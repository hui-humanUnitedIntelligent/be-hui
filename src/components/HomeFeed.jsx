import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import mockWirkerProfiles from "../lib/mockData";
import VirtualFeedList, { FeedEndSentinel } from './VirtualFeedList';
import LazyImage from './LazyImage';

/* ─── Design Tokens ───────────────────────────────── */
const T = {
  teal:       "#3DBFB8",
  tealSoft:   "#6DD5CF",
  tealPale:   "#E8F8F7",
  coral:      "#FF7055",
  coralSoft:  "#FF9080",
  coralPale:  "#FFF0EE",
  cream:      "#FAF8F5",
  card:       "#FFFFFE",
  ink:        "#1C1917",
  ink2:       "#44403C",
  muted:      "#78716C",
  border:     "#E7E3DC",
  gold:       "#F0A500",
  green:      "#2BA27A",
};

/* ─── Rich feed data ─────────────────────────────── */
const WIRKERS = Object.values(mockWirkerProfiles);

const SECTIONS = [
  {
    id: "foryou",
    label: "Für dich",
    emoji: "✨",
    tagline: "Ausgewählt für deinen Moment",
    items: [
      {
        id: "f1", type: "talent",
        wirker: WIRKERS[2], // Marcus – Fotograf
        emotion: "Marcus fängt Momente ein, die für immer bleiben",
        mood: "teal",
      },
      {
        id: "f2", type: "werk",
        img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=900&q=90",
        title: "Handgedrehte Vase",
        price: "65 €",
        emotion: "Sofia formt aus Ton Dinge, die bleiben",
        wirkerName: "Sofia M.",
        wirkerImg: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&q=80",
        mood: "gold",
        tags: ["Keramik", "Unikat"],
      },
      {
        id: "f3", type: "video",
        thumb: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900&q=90",
        src: "https://www.w3schools.com/html/mov_bbb.mp4",
        emotion: "Behind the Scenes — ein Imagefilm entsteht",
        wirkerName: "Marcus B.",
        wirkerImg: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
        mood: "coral",
      },
    ],
  },
  {
    id: "nearby",
    label: "In deiner Nähe",
    emoji: "📍",
    tagline: "Menschen in deiner Stadt",
    items: [
      {
        id: "n1", type: "talent",
        wirker: WIRKERS[0], // Lars – Keramik
        emotion: "Lars formt mit seinen Händen Welten aus Ton",
        mood: "gold",
      },
      {
        id: "n2", type: "werk",
        img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&q=90",
        title: "Leder-Rucksack",
        price: "195 €",
        emotion: "Tom näht jeden Rucksack von Hand — mit Seele",
        wirkerName: "Tom H.",
        wirkerImg: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
        mood: "teal",
        tags: ["Handwerk", "Leder"],
      },
    ],
  },
  {
    id: "inspiration",
    label: "Inspiration",
    emoji: "🌱",
    tagline: "Wirker die die Welt verändern",
    items: [
      {
        id: "i1", type: "impact",
        img: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=900&q=90",
        emotion: "Gemeinsam haben wir diesen Monat schon € 3.847 bewegt",
        poolEur: 3847,
        mood: "teal",
      },
      {
        id: "i2", type: "talent",
        wirker: WIRKERS[3], // Maria – Yoga
        emotion: "Maria bringt in jede Session echte Ruhe und Kraft",
        mood: "purple",
      },
      {
        id: "i3", type: "werk",
        img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&q=90",
        title: "Morgen-Yoga-Session",
        price: "70 €",
        emotion: "Finde zurück zu dir — eine Stunde reicht",
        wirkerName: "Maria L.",
        wirkerImg: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
        mood: "purple",
        tags: ["Yoga", "Achtsamkeit"],
      },
    ],
  },
];

/* ─── Mood → Farbe ───────────────────────────────── */
const MOOD_COLOR = {
  teal:   T.teal,
  coral:  T.coral,
  gold:   T.gold,
  purple: "#9B7FE8",
};

/* ─── Like-Button ────────────────────────────────── */
function LikeBtn({ count = 0 }) {
  const [liked,  setLiked]  = useState(false);
  const [n,      setN]      = useState(count);
  const [anim,   setAnim]   = useState(false);

  function tap(e) {
    e.stopPropagation();
    setAnim(true);
    setTimeout(() => setAnim(false), 450);
    setLiked(p => { setN(c => p ? c - 1 : c + 1); return !p; });
  }

  return (
    <button onClick={tap} style={{
      background: "rgba(255,255,255,0.18)", backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.28)",
      borderRadius: 999, padding: "8px 14px",
      display: "flex", alignItems: "center", gap: 6,
      cursor: "pointer", WebkitTapHighlightColor: "transparent",
    }}>
      <span className={anim ? "hui-heart-anim" : ""}
        style={{ fontSize: 18, lineHeight: 1,
          filter: liked ? "none" : "grayscale(1) opacity(0.7)" }}>
        {liked ? "❤️" : "🤍"}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{n}</span>
    </button>
  );
}

/* ─── Ghost-Button (Save / Share) ────────────────── */
function GhostBtn({ icon, onTap }) {
  return (
    <button onClick={e => { e.stopPropagation(); if (onTap) onTap(); }}
      style={{
        width: 40, height: 40, borderRadius: "50%",
        background: "rgba(255,255,255,0.18)", backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.28)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        transition: "transform 0.15s",
      }}
      onTouchStart={e => e.currentTarget.style.transform = "scale(0.88)"}
      onTouchEnd={e   => e.currentTarget.style.transform = "scale(1)"}>
      {icon}
    </button>
  );
}

/* ─── Stories ────────────────────────────────────── */
function StoriesBar({ onView }) {
  const stories = [
    { id: "me",  name: "Du",     img: null,                                                   isMine: true,  hasStory: false },
    { id: "s1",  name: "Sofia",  img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&q=80", hasStory: true  },
    { id: "s2",  name: "Marcus", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80", hasStory: true  },
    { id: "s3",  name: "Maria",  img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&q=80",  hasStory: true  },
    { id: "s4",  name: "Tom",    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&q=80", hasStory: false },
    { id: "s5",  name: "Lena",   img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80", hasStory: true  },
    { id: "s6",  name: "Lars",   img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80", hasStory: false },
  ];

  return (
    <div style={{ padding: "14px 0 10px" }}>
      <div className="scrollbar-hide"
        style={{ display: "flex", gap: 14, overflowX: "auto", padding: "4px 20px 4px" }}>
        {stories.map(s => (
          <div key={s.id}
            onClick={() => !s.isMine && onView && onView(s.name)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center",
              gap: 6, flexShrink: 0, cursor: s.isMine ? "default" : "pointer" }}>

            <div
              className={s.hasStory ? "hui-story-ring" : ""}
              style={{
                padding: 2.5, borderRadius: "50%",
                background: s.hasStory
                  ? `linear-gradient(135deg, ${T.teal}, ${T.coral})`
                  : T.border,
                boxShadow: s.hasStory ? "none" : "none",
              }}>
              <div style={{ padding: 2, borderRadius: "50%", background: T.cream }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%", overflow: "hidden",
                  background: `linear-gradient(135deg, ${T.tealPale}, ${T.coralPale})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, position: "relative",
                }}>
                  {s.isMine ? (
                    <>
                      <span style={{ fontSize: 22 }}>👤</span>
                      <div style={{
                        position: "absolute", bottom: 0, right: 0,
                        width: 18, height: 18, borderRadius: "50%",
                        background: T.coral, border: `2px solid ${T.cream}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, color: "white", fontWeight: 900,
                      }}>+</div>
                    </>
                  ) : s.img ? (
                    <img loading="lazy" decoding="async" src={s.img} alt={s.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontWeight: 800, color: T.teal }}>{s.name[0]}</span>
                  )}
                </div>
              </div>
            </div>

            <span style={{ fontSize: 10, fontWeight: 600, color: T.ink2,
              maxWidth: 56, textAlign: "center", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── STAGE CARD — Talent ────────────────────────── */
function TalentStageCard({ item, onView, onBook, className = "" }) {
  const w = item.wirker;
  const color = MOOD_COLOR[item.mood] || T.teal;

  return (
    <div className={`hui-stage-card ${className}`}
      style={{ margin: "0 18px 24px" }}
      onClick={() => onView && onView(w.name)}>

      {/* ── Bild — 4:5 aspect ratio ── */}
      <div style={{
        position: "relative",
        paddingTop: "125%", /* 4:5 */
        overflow: "hidden",
        background: `linear-gradient(160deg, ${color}30, ${color}10)`,
      }}>
        {w.header && (
          <img loading="lazy" decoding="async" src={w.header} alt=""
            style={{ position: "absolute", inset: 0,
              width: "100%", height: "100%", objectFit: "cover",
              transition: "transform 0.6s ease" }} />
        )}

        {/* Deep gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(
            to bottom,
            transparent              0%,
            transparent             40%,
            rgba(28, 25, 23, 0.35)  70%,
            rgba(28, 25, 23, 0.82) 100%
          )`,
        }} />

        {/* ── Top: interaction row ── */}
        <div style={{
          position: "absolute", top: 14, left: 14, right: 14,
          display: "flex", justifyContent: "flex-end", gap: 8,
        }}>
          <GhostBtn icon="⭐" />
          <GhostBtn icon="↗️" onTap={async () => {
            if (navigator.share) {
              try { await navigator.share({ title: w.fullName, url: window.location.href }); } catch {}
            }
          }} />
        </div>

        {/* ── Bottom: content ── */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 18px" }}>
          {/* Avatar + Name row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              overflow: "hidden", border: "2px solid rgba(255,255,255,0.6)",
              flexShrink: 0,
            }}>
              <img loading="lazy" decoding="async" src={w.img} alt={w.fullName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={e => e.target.style.display = "none"} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "white", lineHeight: 1.2 }}>
                {w.fullName || w.name}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
                {w.talent} · 📍 {w.location}
              </div>
            </div>
          </div>

          {/* Emotional sentence */}
          <div style={{
            fontSize: 16, fontWeight: 700, color: "white",
            lineHeight: 1.45, marginBottom: 14,
            textShadow: "0 1px 8px rgba(0,0,0,0.3)",
          }}>
            {item.emotion}
          </div>

          {/* Empfehlungen + CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {w.recommendations > 0 && (
              <div style={{
                background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 999, padding: "6px 12px",
                fontSize: 12, fontWeight: 700, color: "white",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                👥 {w.recommendations} Empfehlung{w.recommendations !== 1 ? "en" : ""}
              </div>
            )}
            <div style={{ flex: 1 }} />
            <LikeBtn count={w.followers || 0} />
          </div>

          {/* Book CTA */}
          {w.pricePerHour > 0 && (
            <button
              onClick={e => { e.stopPropagation(); onBook && onBook(w); }}
              style={{
                marginTop: 12, width: "100%", padding: "13px",
                background: `linear-gradient(135deg, ${color}, ${color}CC)`,
                color: "white", border: "none",
                borderRadius: 14, fontSize: 14, fontWeight: 800,
                cursor: "pointer", WebkitTapHighlightColor: "transparent",
                boxShadow: `0 4px 16px ${color}40`,
                transition: "opacity 0.2s",
              }}>
              ✨ Talent entdecken · ab {w.pricePerHour} €
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── STAGE CARD — Werk ──────────────────────────── */
function WerkStageCard({ item, onCart, className = "" }) {
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const color = MOOD_COLOR[item.mood] || T.gold;

  function handleCart(e) {
    e.stopPropagation();
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
    if (onCart) onCart(item);
  }

  return (
    <div className={`hui-stage-card ${className}`}
      style={{ margin: "0 18px 24px" }}>

      <div style={{ position: "relative", paddingTop: "125%", overflow: "hidden" }}>
        <img loading="lazy" decoding="async" src={item.img} alt={item.title}
          style={{ position: "absolute", inset: 0,
            width: "100%", height: "100%", objectFit: "cover" }} />

        {/* Overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(
            to bottom,
            transparent 35%,
            rgba(28,25,23,0.8) 100%
          )`,
        }} />

        {/* Top row */}
        <div style={{
          position: "absolute", top: 14, left: 14, right: 14,
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          {/* Werk badge */}
          <div style={{
            background: `${color}EE`, borderRadius: 999,
            padding: "5px 13px", fontSize: 11, fontWeight: 800, color: "white",
          }}>
            🎨 Werk · {item.price}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <GhostBtn icon={saved ? "⭐" : "☆"}
              onTap={() => setSaved(p => !p)} />
          </div>
        </div>

        {/* Bottom content */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "18px" }}>
          {/* Creator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {item.wirkerImg && (
              <div style={{ width: 28, height: 28, borderRadius: "50%",
                overflow: "hidden", border: "1.5px solid rgba(255,255,255,0.6)",
                flexShrink: 0 }}>
                <img loading="lazy" decoding="async" src={item.wirkerImg} alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
              {item.wirkerName}
            </span>
          </div>

          {/* Emotional sentence */}
          <div style={{
            fontSize: 16, fontWeight: 700, color: "white",
            lineHeight: 1.45, marginBottom: 14,
            textShadow: "0 1px 8px rgba(0,0,0,0.3)",
          }}>
            {item.emotion}
          </div>

          {/* Impact + CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LikeBtn count={Math.floor(Math.random() * 150) + 40} />
            <div style={{ flex: 1 }} />
            <button onClick={handleCart} style={{
              padding: "10px 18px", borderRadius: 14, border: "none",
              background: added
                ? `linear-gradient(135deg, ${T.green}, #34D399)`
                : `linear-gradient(135deg, ${color}, ${color}CC)`,
              color: "white", fontWeight: 800, fontSize: 13,
              cursor: "pointer", transition: "background 0.3s",
              WebkitTapHighlightColor: "transparent",
              boxShadow: `0 3px 12px ${color}30`,
            }}>
              {added ? "✓ Im Korb" : "🛒 Kaufen"}
            </button>
          </div>

          {/* Impact hint */}
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <span className="hui-breathe" style={{ fontSize: 11 }}>🌱</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontStyle: "italic" }}>
              Mit diesem Kauf unterstützt du echte Projekte
            </span>
          </div>
        </div>
      </div>

      {/* Tags below card */}
      {item.tags?.length > 0 && (
        <div style={{ padding: "10px 14px 14px", display: "flex", gap: 6 }}>
          {item.tags.map((t, i) => (
            <span key={i} className="hui-chip hui-chip-teal">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

});

/* ─── STAGE CARD — Video ─────────────────────────── */
function VideoStageCard({ item, className = "" }) {
  const videoRef  = useRef(null);
  const wrapRef   = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted,   setMuted]   = useState(true);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => {});
          setPlaying(true);
        } else {
          videoRef.current?.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.5 }
    );
    if (wrapRef.current) obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className={`hui-stage-card ${className}`}
      style={{ margin: "0 18px 24px" }}>

      <div style={{ position: "relative", paddingTop: "125%", overflow: "hidden", background: "#0D0D0D" }}>
        {/* Thumb */}
        <img loading="lazy" decoding="async" src={item.thumb} alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", opacity: playing ? 0 : 1, transition: "opacity 0.5s" }} />

        {/* Video */}
        <video ref={videoRef} src={item.src} muted={muted} playsInline loop
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", opacity: playing ? 1 : 0, transition: "opacity 0.5s" }} />

        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(to bottom, transparent 30%, rgba(28,25,23,0.82) 100%)`,
        }} />

        {/* Play state indicator */}
        {!playing && (
          <div style={{ position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: 58, height: 58, borderRadius: "50%",
            background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22 }}>▶️</div>
        )}

        {/* Top row */}
        <div style={{ position: "absolute", top: 14, left: 14, right: 14,
          display: "flex", justifyContent: "space-between" }}>
          <div style={{ background: `${T.coral}EE`, borderRadius: 999,
            padding: "5px 13px", fontSize: 11, fontWeight: 800, color: "white" }}>
            🎬 Video
          </div>
          <button onClick={e => { e.stopPropagation(); setMuted(p => !p); }}
            style={{ width: 36, height: 36, borderRadius: "50%",
              background: "rgba(255,255,255,0.18)", backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.28)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
            {muted ? "🔇" : "🔊"}
          </button>
        </div>

        {/* Bottom */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {item.wirkerImg && (
              <div style={{ width: 28, height: 28, borderRadius: "50%",
                overflow: "hidden", border: "1.5px solid rgba(255,255,255,0.6)" }}>
                <img loading="lazy" decoding="async" src={item.wirkerImg} alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
              {item.wirkerName}
            </span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "white",
            lineHeight: 1.45, marginBottom: 12, textShadow: "0 1px 8px rgba(0,0,0,0.3)" }}>
            {item.emotion}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <LikeBtn count={item.likes || 0} />
            <GhostBtn icon="💬" />
            <div style={{ flex: 1 }} />
            <GhostBtn icon="↗️" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── IMPACT CARD ────────────────────────────────── */
function ImpactStageCard({ item, onImpact, className = "" }) {
  return (
    <div className={`hui-stage-card ${className}`}
      style={{ margin: "0 18px 24px" }}
      onClick={onImpact}>

      <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
        <img loading="lazy" decoding="async" src={item.img} alt="" style={{ width: "100%", height: "100%",
          objectFit: "cover", filter: "brightness(0.72) saturate(1.15)" }} />
        <div style={{ position: "absolute", inset: 0,
          background: `linear-gradient(160deg, ${T.teal}88 0%, ${T.coral}55 100%)` }} />

        {/* Euro in center */}
        <div style={{ position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 4 }}>🌱</div>
          <div style={{ fontWeight: 900, fontSize: 38, color: "white",
            textShadow: "0 2px 20px rgba(0,0,0,0.3)", lineHeight: 1 }}>
            € {(item.poolEur||0).toLocaleString("de-DE")}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.88)",
            marginTop: 6, fontWeight: 600 }}>
            gemeinsam bewegt diesen Monat
          </div>
        </div>
      </div>

      <div style={{ padding: "18px" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, lineHeight: 1.6,
          marginBottom: 14 }}>
          {item.emotion}
        </div>
        <button style={{ width: "100%", padding: "14px",
          background: `linear-gradient(135deg, ${T.teal}, ${T.tealSoft})`,
          color: "white", border: "none", borderRadius: 14,
          fontSize: 14, fontWeight: 800, cursor: "pointer",
          boxShadow: `0 4px 16px ${T.teal}30`,
          WebkitTapHighlightColor: "transparent" }}>
          🌱 Impact ansehen →
        </button>
      </div>
    </div>
  );
}

/* ─── Section Header ─────────────────────────────── */
function SectionHeader({ section, index }) {
  const colors = [T.teal, T.coral, T.green];
  const color  = colors[index % colors.length];

  return (
    <div style={{ padding: "24px 20px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{
          width: 3, height: 24, borderRadius: 999,
          background: `linear-gradient(to bottom, ${color}, ${color}66)`,
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 22 }}>{section.emoji}</span>
        <div>
          <div style={{ fontWeight: 900, fontSize: 20, color: T.ink,
            letterSpacing: -0.03 * 20 }}>{section.label}</div>
          <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, marginTop: 1 }}>
            {section.tagline}
          </div>
        </div>
      </div>
    </div>
  );
}

});

/* ─── Shimmer Skeleton ───────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ margin: "0 18px 24px", borderRadius: 22, overflow: "hidden" }}>
      <div className="hui-shimmer" style={{ paddingTop: "125%", borderRadius: 22 }} />
    </div>
  );
}


/* ─── Memoized Stage Cards — prevent re-render on parent state changes ─ */
const MemoTalentCard  = React.memo(TalentStageCard);
const MemoWerkCard    = React.memo(WerkStageCard);
const MemoVideoCard   = React.memo(VideoStageCard);
const MemoImpactCard  = React.memo(ImpactStageCard);

/* ─── Haupt HomeFeed ─────────────────────────────── */
export default function HomeFeed({ onViewWirker, onBook, onAddToCart, onImpact ,
  onLoadMore,
  loadingMore = false,
  hasMore = false,
}) {
  const [sections, setSections] = useState(SECTIONS);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadLive() {
      try {
        const { data: posts } = await supabase
          .from("posts")
          .select("*, profiles(name, profile_image_url)")
          .order("created_at", { ascending: false })
          .limit(6);
        if (!mounted) return;
        if (posts?.length) {
          const liveItems = posts.slice(0, 3).map(p => ({
            id: "live_" + p.id,
            type: p.type === "video" ? "video" : "werk",
            img:  p.media_urls?.[0],
            thumb: p.media_urls?.[0],
            src:  p.type === "video" ? p.media_urls?.[0] : undefined,
            emotion: p.caption || "Ein neues Werk ist entstanden",
            wirkerName: p.profiles?.name || "HUI Wirker",
            wirkerImg:  p.profiles?.profile_image_url,
            mood: "teal",
          }));
          if (mounted) setSections(prev => {
            const updated = [...prev];
            updated[0] = { ...updated[0], items: [...liveItems, ...updated[0].items.slice(0, 2)] };
            return updated;
          });
        }
      } catch {}
      if (mounted) setLoading(false);
    }
    loadLive();
    return () => { mounted = false; };
  }, []);

  const renderItem = useCallback((item, secIdx, itemIdx) => {
    const cls = `hui-rise-${Math.min(itemIdx + 1, 4)}`;
    if (item.type === "talent")
      return <MemoTalentCard key={item.id} item={item} className={cls}
               onView={onViewWirker} onBook={onBook} />;
    if (item.type === "werk")
      return <MemoWerkCard key={item.id} item={item} className={cls}
               onCart={onAddToCart} />;
    if (item.type === "video")
      return <MemoVideoCard key={item.id} item={item} className={cls} />;
    if (item.type === "impact")
      return <MemoImpactCard key={item.id} item={item} className={cls}
               onImpact={onImpact} />;
    return null;
  }, [onViewWirker, onBook, onAddToCart, onImpact]);

  // ── Virtualization: flatten sections into a single list ────────────
  // Section headers werden als spezielle Items eingebettet
  // Typ "__header" → rendert SectionHeader
  // Typ "__divider" → rendert Trennlinie
  const flatFeedItems = React.useMemo(() => {
    const flat = [];
    sections.forEach((sec, si) => {
      // Section header als pseudo-item
      flat.push({ __type: "__header", sec, si, id: `hdr_${sec.id}` });
      // Echte Items
      sec.items.forEach((item, ii) => {
        flat.push({ ...item, __secIdx: si, __itemIdx: ii });
      });
      // Trennlinie zwischen Sections (nicht nach letzter)
      if (si < sections.length - 1) {
        flat.push({ __type: "__divider", id: `div_${sec.id}` });
      }
    });
    return flat;
  }, [sections]);

  // ── renderFlatItem: rendert header, divider oder Card ──────────────
  const renderFlatItem = useCallback((item, index) => {
    if (!item) return null;
    if (item.__type === "__header") {
      return <SectionHeader key={item.id} section={item.sec} index={item.si} />;
    }
    if (item.__type === "__divider") {
      return (
        <div key={item.id}
          style={{ height: 1, background: T.border, margin: "4px 20px 4px" }} />
      );
    }
    // Echte Feed-Card — renderItem recyceln
    return renderItem(item, item.__secIdx ?? 0, item.__itemIdx ?? index);
  }, [renderItem]);

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Stories */}
      <StoriesBar onView={onViewWirker} />

      {/* Divider */}
      <div style={{ height: 1, background: T.border, margin: "0 20px 4px" }} />

      {loading
        ? [1,2,3].map(i => <SkeletonCard key={i} />)
        : <VirtualFeedList
            items={flatFeedItems}
            renderItem={renderFlatItem}
            estimatedSize={460}
            overscan={3}
            onEndReached={onLoadMore}
          />
      }

      {/* Infinite scroll — handled by VirtualFeedList.onEndReached */}
      {!loading && !hasMore && false && (
        <FeedEndSentinel onVisible={onLoadMore} loading={!!loadingMore} />
      )}

      {/* Footer — only when truly at end */}
      {!loading && !hasMore && (
        <div style={{ textAlign: "center", padding: "24px 20px 16px" }}>
          <div className="hui-breathe" style={{ fontSize: 28, marginBottom: 8 }}>🌱</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.muted }}>
            Du hast alles gesehen.
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>
            Morgen gibt's Neues.
          </div>
        </div>
      )}
    </div>
  );
}