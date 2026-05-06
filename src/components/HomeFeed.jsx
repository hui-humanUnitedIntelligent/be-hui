import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import mockWirkerProfiles from "../lib/mockData";

/* ─── Design Tokens ─────────────────────────────────────── */
const C = {
  coral:   "#FF6B5B",
  teal:    "#2ABFAC",
  gold:    "#F5A623",
  purple:  "#A78BFA",
  ink:     "#1A1A2E",
  muted:   "#6B7280",
  surface: "#F8F7F5",
  card:    "#FFFFFF",
  border:  "#EEECE8",
};

/* ─── Mock-Daten ────────────────────────────────────────── */
const WIRKERS = Object.values(mockWirkerProfiles);

const MOCK_FEED = [
  {
    id: "w1", type: "wirker",
    wirker: WIRKERS[2], // Marcus – Fotograf
  },
  {
    id: "media1", type: "media",
    mediaType: "foto",
    img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=85",
    title: "Handgedrehte Vase",
    price: "65 €",
    wirkerName: "Sofia M.",
    wirkerImg: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&q=80",
    impactHint: "Mit diesem Werk unterstützt du echte Projekte",
    likes: 112, saved: false,
    tags: ["Keramik", "Unikat"],
  },
  {
    id: "impact1", type: "impact",
    img: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=85",
    poolEur: 3847,
    month: "Mai 2026",
  },
  {
    id: "w2", type: "wirker",
    wirker: WIRKERS[3], // Maria – Yoga
  },
  {
    id: "media2", type: "media",
    mediaType: "video",
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
    thumb: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=85",
    title: "Behind the Scenes – Imagefilm Berlin",
    wirkerName: "Marcus B.",
    wirkerImg: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80",
    impactHint: "Jede Buchung bewegt etwas",
    likes: 234, saved: false,
  },
  {
    id: "media3", type: "media",
    mediaType: "foto",
    img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=85",
    title: "Leder-Rucksack – Maßanfertigung",
    price: "195 €",
    wirkerName: "Tom H.",
    wirkerImg: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&q=80",
    impactHint: "Handgemacht & mit Impact",
    likes: 203, saved: false,
    tags: ["Handwerk", "Leder"],
  },
  {
    id: "w3", type: "wirker",
    wirker: WIRKERS[0], // Lars – Keramik
  },
  {
    id: "media4", type: "media",
    mediaType: "foto",
    img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=85",
    title: "Morgen-Yoga am See",
    wirkerName: "Maria L.",
    wirkerImg: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&q=80",
    impactHint: "Mit diesem Werk unterstützt du echte Projekte",
    likes: 87, saved: false,
  },
];

const MOCK_STORIES = [
  { id: "mine",    name: "Deine Story", img: null,   isMine: true, hasStory: false },
  { id: "s1",      name: "Sofia",       img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&q=80", hasStory: true },
  { id: "s2",      name: "Marcus",      img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80", hasStory: true },
  { id: "s3",      name: "Maria",       img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&q=80",  hasStory: true },
  { id: "s4",      name: "Tom",         img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&q=80", hasStory: false },
  { id: "s5",      name: "Lena",        img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80", hasStory: true },
  { id: "s6",      name: "Lars",        img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80", hasStory: false },
];

/* ─── Micro: Like-Button ────────────────────────────────── */
function LikeButton({ initialLikes = 0, size = "normal" }) {
  const [liked, setLiked]   = useState(false);
  const [count, setCount]   = useState(initialLikes);
  const [pop, setPop]       = useState(false);

  function toggle() {
    setPop(true);
    setTimeout(() => setPop(false), 420);
    const next = !liked;
    setLiked(next);
    setCount(c => next ? c + 1 : c - 1);
  }

  const fs = size === "large" ? 26 : 22;
  return (
    <button onClick={toggle}
      style={{ background: "none", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 5, padding: "4px 0",
        WebkitTapHighlightColor: "transparent" }}>
      <span
        className={pop ? "hui-heart-pop" : ""}
        style={{ fontSize: fs, lineHeight: 1,
          filter: liked ? "none" : "grayscale(1) opacity(0.45)",
          transition: "filter 0.2s" }}>
        {liked ? "❤️" : "🤍"}
      </span>
      <span style={{ fontSize: size === "large" ? 14 : 12,
        fontWeight: 700, color: liked ? C.coral : C.muted,
        transition: "color 0.2s", minWidth: 20 }}>
        {count}
      </span>
    </button>
  );
}

/* ─── Micro: Save-Button ────────────────────────────────── */
function SaveButton({ size = "normal" }) {
  const [saved, setSaved] = useState(false);
  return (
    <button onClick={() => setSaved(p => !p)}
      style={{ background: "none", border: "none", cursor: "pointer",
        fontSize: size === "large" ? 24 : 20, padding: "4px",
        filter: saved ? "none" : "grayscale(1) opacity(0.45)",
        transition: "filter 0.2s, transform 0.15s",
        transform: saved ? "scale(1.1)" : "scale(1)",
        WebkitTapHighlightColor: "transparent" }}>
      {saved ? "⭐" : "☆"}
    </button>
  );
}

/* ─── Micro: Share-Button ───────────────────────────────── */
function ShareButton() {
  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: "HUI", url: window.location.href }); }
      catch {}
    }
  }
  return (
    <button onClick={share}
      style={{ background: "none", border: "none", cursor: "pointer",
        fontSize: 20, padding: "4px", color: C.muted, opacity: 0.6,
        transition: "opacity 0.2s",
        WebkitTapHighlightColor: "transparent" }}>
      ↗️
    </button>
  );
}

/* ─── Story-Leiste ──────────────────────────────────────── */
function StoriesBar({ onViewWirker }) {
  return (
    <div style={{ padding: "14px 0 10px" }}>
      <div
        style={{ display: "flex", gap: 14, overflowX: "auto",
          padding: "4px 16px 4px", scrollbarWidth: "none" }}
        className="scrollbar-hide">
        {MOCK_STORIES.map((s) => (
          <div key={s.id}
            onClick={() => !s.isMine && s.name !== "Deine Story" && onViewWirker && onViewWirker(s.name)}
            style={{ display: "flex", flexDirection: "column",
              alignItems: "center", gap: 6, flexShrink: 0,
              cursor: s.isMine ? "default" : "pointer" }}>

            {/* Ring */}
            <div style={{
              padding: 2, borderRadius: "50%",
              background: s.hasStory
                ? `linear-gradient(135deg, ${C.coral}, ${C.teal})`
                : C.border,
            }}
              className={s.hasStory ? "hui-glow-ring" : ""}>
              <div style={{ padding: 2, borderRadius: "50%", background: "white" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  overflow: "hidden", background: `linear-gradient(135deg, ${C.coral}40, ${C.teal}30)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, position: "relative" }}>
                  {s.isMine ? (
                    <>
                      <div style={{
                        width: "100%", height: "100%",
                        background: `linear-gradient(135deg, ${C.coral}20, ${C.teal}15)`,
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 24 }}>👤</span>
                      </div>
                      <div style={{
                        position: "absolute", bottom: 0, right: 0,
                        width: 18, height: 18, borderRadius: "50%",
                        background: C.coral, border: "2px solid white",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, color: "white", fontWeight: 900 }}>+</div>
                    </>
                  ) : s.img ? (
                    <img src={s.img} alt={s.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span>{s.name[0]}</span>
                  )}
                </div>
              </div>
            </div>

            <span style={{
              fontSize: 10, fontWeight: 600, color: C.ink,
              maxWidth: 58, textAlign: "center",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Media-Karte (Foto & Video) ────────────────────────── */
function MediaCard({ item }) {
  const videoRef  = useRef(null);
  const [playing, setPlaying]   = useState(false);
  const [muted,   setMuted]     = useState(true);
  const [visible, setVisible]   = useState(false);
  const cardRef   = useRef(null);

  /* Intersection Observer – Autoplay wenn sichtbar */
  useEffect(() => {
    if (item.mediaType !== "video") return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting && videoRef.current) {
          videoRef.current.play().catch(() => {});
          setPlaying(true);
        } else if (videoRef.current) {
          videoRef.current.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.55 }
    );
    if (cardRef.current) obs.observe(cardRef.current);
    return () => obs.disconnect();
  }, [item.mediaType]);

  function toggleMute(e) {
    e.stopPropagation();
    if (videoRef.current) videoRef.current.muted = !muted;
    setMuted(p => !p);
  }

  const isVideo = item.mediaType === "video";

  return (
    <div ref={cardRef} className="hui-feed-card"
      style={{ margin: "0 16px 20px" }}>

      {/* ── Mediafläche ── */}
      <div style={{ position: "relative", background: "#0A0A0A" }}>
        {isVideo ? (
          <div className={visible ? "hui-video-fade" : ""}
            style={{ position: "relative", minHeight: 320 }}>
            {/* Thumbnail bis Video lädt */}
            {item.thumb && (
              <img src={item.thumb} alt=""
                style={{ position: "absolute", inset: 0,
                  width: "100%", height: "100%", objectFit: "cover",
                  opacity: playing ? 0 : 1, transition: "opacity 0.4s" }} />
            )}
            <video ref={videoRef} src={item.src}
              muted={muted} playsInline loop
              style={{ width: "100%", display: "block",
                maxHeight: 420, objectFit: "cover",
                opacity: playing ? 1 : 0, transition: "opacity 0.5s ease" }} />

            {/* Mute-Toggle */}
            <button onClick={toggleMute}
              style={{ position: "absolute", top: 14, right: 14,
                width: 34, height: 34, borderRadius: "50%",
                background: "rgba(26,26,46,0.5)", backdropFilter: "blur(8px)",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, color: "white",
                WebkitTapHighlightColor: "transparent" }}>
              {muted ? "🔇" : "🔊"}
            </button>
          </div>
        ) : (
          <img src={item.img} alt={item.title}
            style={{ width: "100%", display: "block",
              maxHeight: 420, objectFit: "cover" }} />
        )}

        {/* Gradient-Overlay unten */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
          background: "linear-gradient(to top, rgba(26,26,46,0.88) 0%, rgba(26,26,46,0.4) 55%, transparent 100%)"
        }} />

        {/* Wirker-Info über Overlay */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 16px 14px" }}>
          {/* Wirker */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%",
              overflow: "hidden", border: "1.5px solid rgba(255,255,255,0.6)",
              flexShrink: 0 }}>
              {item.wirkerImg
                ? <img src={item.wirkerImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%",
                    background: `linear-gradient(135deg, ${C.coral}, ${C.teal})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, color: "white", fontWeight: 800 }}>
                    {(item.wirkerName||"")[0]}
                  </div>
              }
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{item.wirkerName}</span>
            {isVideo && <span style={{ marginLeft: "auto",
              background: `${C.coral}EE`, borderRadius: 20,
              padding: "2px 10px", fontSize: 10, fontWeight: 800, color: "white" }}>🎬 Video</span>}
          </div>

          {/* Titel + Preis */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              {item.title && (
                <div style={{ fontWeight: 800, fontSize: 17, color: "white",
                  marginBottom: 3, textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
                  {item.title}
                </div>
              )}
              {/* Impact Hint */}
              {item.impactHint && (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span className="hui-impact-dot" style={{ fontSize: 10 }}>🌱</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.75)",
                    fontStyle: "italic" }}>
                    {item.impactHint}
                  </span>
                </div>
              )}
            </div>
            {item.price && (
              <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
                borderRadius: 12, padding: "5px 12px",
                fontWeight: 900, fontSize: 16, color: "white",
                border: "1px solid rgba(255,255,255,0.2)" }}>
                {item.price}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Aktionen ── */}
      <div style={{ padding: "12px 16px 14px",
        display: "flex", alignItems: "center", gap: 4 }}>
        <LikeButton initialLikes={item.likes || 0} size="large" />
        <div style={{ width: 1, height: 20, background: C.border, margin: "0 8px" }} />
        <SaveButton size="large" />
        <div style={{ flex: 1 }} />
        <ShareButton />
        {item.price && (
          <button style={{
            background: `linear-gradient(135deg, ${C.coral}, ${C.teal})`,
            color: "white", border: "none", borderRadius: 14,
            padding: "9px 18px", fontSize: 13, fontWeight: 800, cursor: "pointer",
            boxShadow: `0 3px 12px ${C.coral}33`,
            WebkitTapHighlightColor: "transparent" }}>
            🛒 Kaufen
          </button>
        )}
      </div>

      {/* Tags */}
      {item.tags?.length > 0 && (
        <div style={{ padding: "0 16px 14px", display: "flex", gap: 6 }}>
          {item.tags.map((t, i) => (
            <span key={i} style={{
              background: `${C.gold}14`, color: "#92400E",
              borderRadius: 20, padding: "3px 11px",
              fontSize: 11, fontWeight: 600 }}>{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Wirker-Karte ──────────────────────────────────────── */
function WirkerCard({ wirker, onView, onBook }) {
  const typeColor =
    wirker.talentType === "beides"  ? C.purple :
    wirker.talentType === "werke"   ? C.gold   : C.teal;

  return (
    <div className="hui-feed-card"
      style={{ margin: "0 16px 20px" }}
      onClick={() => onView && onView(wirker.name)}>

      {/* Header-Bild mit sanftem Gradient */}
      <div style={{ height: 170, position: "relative", overflow: "hidden",
        background: `linear-gradient(160deg, ${typeColor}25, ${C.coral}12)` }}>
        {wirker.header && (
          <img src={wirker.header} alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover",
              filter: "brightness(0.92)" }} />
        )}
        {/* Bottom-Fade */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, transparent 50%, rgba(255,255,255,0.96) 100%)"
        }} />

        {/* Avatar über Kante */}
        <div style={{ position: "absolute", bottom: -26, left: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%",
            border: `3px solid white`, overflow: "hidden",
            boxShadow: "0 4px 16px rgba(26,26,46,0.18)" }}>
            <img src={wirker.img} alt={wirker.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => e.target.style.display = "none"} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "32px 18px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: C.ink, marginBottom: 2 }}>
              {wirker.fullName || wirker.name}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: typeColor, marginBottom: 4 }}>
              {wirker.talent}
            </div>
            {wirker.location && (
              <div style={{ fontSize: 12, color: C.muted }}>📍 {wirker.location}</div>
            )}
          </div>
          <SaveButton />
        </div>

        {/* Bio */}
        {wirker.bio && (
          <div style={{ fontSize: 13, color: "#555", lineHeight: 1.65,
            margin: "12px 0 14px",
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {wirker.bio}
          </div>
        )}

        {/* Empfehlungen – Trust-Signal */}
        {wirker.recommendations > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8,
            background: `${C.teal}0D`, borderRadius: 14,
            padding: "9px 14px", marginBottom: 14,
            border: `1px solid ${C.teal}22` }}>
            <span style={{ fontSize: 16 }}>👥</span>
            <span style={{ fontSize: 13, color: C.teal, fontWeight: 700 }}>
              {wirker.recommendations} Menschen empfehlen {wirker.name?.split(" ")[0]}
            </span>
          </div>
        )}

        {/* Skills */}
        {wirker.skills?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {wirker.skills.slice(0, 4).map((s, i) => (
              <span key={i} style={{
                background: `${typeColor}10`, color: typeColor,
                borderRadius: 20, padding: "4px 12px",
                fontSize: 11, fontWeight: 600 }}>{s}</span>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={e => { e.stopPropagation(); onView && onView(wirker.name); }}
            style={{ flex: 1, background: `${typeColor}12`, color: typeColor,
              border: `1.5px solid ${typeColor}25`, borderRadius: 14,
              padding: "12px 8px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              WebkitTapHighlightColor: "transparent" }}>
            Talent entdecken →
          </button>
          {wirker.pricePerHour > 0 && (
            <button
              onClick={e => { e.stopPropagation(); onBook && onBook(wirker); }}
              style={{ flex: 1.4,
                background: `linear-gradient(135deg, ${C.coral}, ${C.teal})`,
                color: "white", border: "none", borderRadius: 14,
                padding: "12px 8px", fontSize: 13, fontWeight: 800, cursor: "pointer",
                boxShadow: `0 4px 14px ${C.coral}2E`,
                WebkitTapHighlightColor: "transparent" }}>
              📅 Buchen · ab {wirker.pricePerHour} €
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Impact-Karte ──────────────────────────────────────── */
function ImpactCard({ item, onImpact }) {
  return (
    <div className="hui-feed-card"
      style={{ margin: "0 16px 20px", overflow: "hidden" }}
      onClick={onImpact}>

      {/* Bild */}
      <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
        <img src={item.img} alt="Impact"
          style={{ width: "100%", height: "100%", objectFit: "cover",
            filter: "brightness(0.75) saturate(1.1)" }} />
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(160deg, ${C.teal}88 0%, ${C.coral}55 100%)`
        }} />
        {/* Betrag in der Mitte */}
        <div style={{ position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700,
            color: "rgba(255,255,255,0.85)", letterSpacing: 1,
            textTransform: "uppercase", marginBottom: 6 }}>
            {item.month}
          </div>
          <div style={{ fontSize: 46, fontWeight: 900, color: "white",
            textShadow: "0 2px 16px rgba(0,0,0,0.3)", lineHeight: 1 }}>
            € {(item.poolEur || 0).toLocaleString("de-DE")}
          </div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.9)",
            marginTop: 6, fontWeight: 600 }}>
            gemeinsam bewegt
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "18px 18px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
          <div className="hui-impact-dot"
            style={{ fontSize: 28, flexShrink: 0 }}>🌱</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: C.ink, marginBottom: 4 }}>
              Gemeinsam haben wir diesen Monat schon
              <span style={{ color: C.teal }}> € {(item.poolEur||0).toLocaleString("de-DE")}</span> bewegt
            </div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.55 }}>
              2,5 % jeder Buchung fließen in echte Projekte –
              Stadtgärten, Bildung, Handwerk.
            </div>
          </div>
        </div>

        <button style={{
          width: "100%", padding: "14px",
          background: `linear-gradient(135deg, ${C.teal}, ${C.teal}CC)`,
          color: "white", border: "none", borderRadius: 16,
          fontSize: 14, fontWeight: 800, cursor: "pointer",
          boxShadow: `0 4px 16px ${C.teal}33`,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          WebkitTapHighlightColor: "transparent" }}>
          <span className="hui-impact-dot">🌱</span>
          Impact ansehen →
        </button>
      </div>
    </div>
  );
}

/* ─── Haupt-Export ──────────────────────────────────────── */
export default function HomeFeed({ onViewWirker, onBook, onAddToCart, onImpact, currentUser }) {
  const [feed, setFeed]       = useState(MOCK_FEED);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLive() {
      try {
        // Echte Posts aus DB
        const { data: posts } = await supabase
          .from("posts")
          .select("*, profiles(name, profile_image_url)")
          .order("created_at", { ascending: false })
          .limit(10);

        if (posts?.length) {
          const liveItems = posts.map(p => ({
            id: "live_" + p.id,
            type: "media",
            mediaType: p.type === "video" ? "video" : "foto",
            img:  p.type !== "video" ? p.media_urls?.[0] : undefined,
            src:  p.type === "video"  ? p.media_urls?.[0] : undefined,
            thumb: p.media_urls?.[0],
            title: p.caption || "",
            wirkerName: p.profiles?.name || "HUI Wirker",
            wirkerImg:  p.profiles?.profile_image_url,
            impactHint: "Mit diesem Beitrag unterstützt du echte Projekte",
            likes: 0,
          }));
          setFeed([...liveItems.slice(0, 3), ...MOCK_FEED]);
        }
      } catch {}
      setLoading(false);
    }
    loadLive();
  }, []);

  const renderItem = useCallback((item, i) => {
    if (item.type === "wirker") return (
      <WirkerCard key={item.id || i} wirker={item.wirker}
        onView={onViewWirker} onBook={onBook} />
    );
    if (item.type === "media") return (
      <MediaCard key={item.id || i} item={item} />
    );
    if (item.type === "impact") return (
      <ImpactCard key={item.id || i} item={item} onImpact={onImpact} />
    );
    return null;
  }, [onViewWirker, onBook, onImpact]);

  return (
    <div style={{ paddingBottom: 90 }}>
      <StoriesBar onViewWirker={onViewWirker} />

      {/* Trennlinie */}
      <div style={{ height: 1, background: C.border, margin: "2px 16px 14px" }} />

      {/* Loading Shimmer */}
      {loading && [1, 2, 3].map(i => (
        <div key={i} className="hui-shimmer"
          style={{ height: 360, borderRadius: 24, margin: "0 16px 20px" }} />
      ))}

      {/* Feed-Items */}
      {!loading && feed.map((item, i) => renderItem(item, i))}

      {/* Footer */}
      {!loading && (
        <div style={{ textAlign: "center", padding: "20px 16px 12px" }}>
          <div style={{ fontSize: 26, marginBottom: 6 }}>🌱</div>
          <div style={{ fontSize: 13, color: C.muted }}>Du hast alles gesehen.</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Morgen gibt\'s Neues.</div>
        </div>
      )}
    </div>
  );
}
