import React, { useState } from "react";
import CommentSection from "./CommentSection";
import { Heart, Share2, Star, ShoppingBasket, MapPin, Play, Check, ThumbsUp, BadgeCheck, Image, Video, Info } from "lucide-react";

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";
const GOLD = "#F5A623";
const PURPLE = "#A78BFA";

function MediaCard({ item, liked, onLike, faved, onFav, onViewWirker, isTalentUser, following, toggleFollow }) {
  const [muted, setMuted] = React.useState(true);
  const videoRef = React.useRef(null);
  const containerRef = React.useRef(null);

  // Autoplay when scrolled into view
  React.useEffect(() => {
    if (item.mediaType !== "video") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { videoRef.current?.play().catch(() => {}); }
        else { videoRef.current?.pause(); }
      },
      { threshold: 0.5 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [item.mediaType]);

  // Demo video URL — in production this would be item.videoUrl
  const demoVideoUrl = "https://www.w3schools.com/html/mov_bbb.mp4";

  return (
    <div style={{ background: "white", margin: "6px 12px", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: `1px solid #f0f0ee`, borderLeft: `3px solid ${item.mediaType === "video" ? CORAL : TEAL}` }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px 6px" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img src={item.creatorImg} onClick={() => onViewWirker(item.creator)}
            style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: `2px solid ${TEAL}25`, cursor: "pointer" }} alt={item.creator} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 9, height: 9, borderRadius: "50%", background: "#4CAF50", border: "2px solid white" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => onViewWirker(item.creator)}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#222", display: "flex", alignItems: "center", gap: 3 }}>
            {item.creator} <BadgeCheck size={11} color={TEAL} />
          </div>
          <div style={{ fontSize: 11, color: "#bbb", display: "flex", alignItems: "center", gap: 3, marginTop: 1, overflow: "hidden" }}>
            <span style={{ color: TEAL, fontWeight: 600, flexShrink: 0 }}>{item.talent}</span>
            <span style={{ flexShrink: 0 }}>·</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.location}</span>
          </div>
        </div>
        {(() => {
          const isFollowed = following && following.has(item.creator);
          return (
            <button onClick={() => toggleFollow && toggleFollow(item.creator)}
              style={{ background: isFollowed ? TEAL : `${TEAL}12`, border: "none", borderRadius: 20, padding: "5px 11px", fontWeight: 700, fontSize: 11, color: isFollowed ? "white" : TEAL, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 3, transition: "all 0.2s" }}>
              {isFollowed ? <><Check size={10} /> Folge ich</> : <>+ Folgen</>}
            </button>
          );
        })()}
      </div>

      {/* Media — full width, tall */}
      <div ref={containerRef} style={{ position: "relative", width: "100%", lineHeight: 0 }}>
        {item.mediaType === "video" ? (
          <>
            <video
              ref={videoRef}
              src={demoVideoUrl}
              muted={muted}
              loop
              playsInline
              style={{ width: "100%", height: 240, objectFit: "cover", display: "block" }}
            />
            {/* Mute toggle */}
            <button
              onClick={() => setMuted(m => !m)}
              style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <span style={{ fontSize: 15 }}>{muted ? "🔇" : "🔊"}</span>
            </button>
            {/* Video badge */}
            <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", color: "white", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              🎬 Video
            </div>
          </>
        ) : (
          <img src={item.img} style={{ width: "100%", height: 230, objectFit: "cover", display: "block" }} alt="" />
        )}
      </div>

      {/* Caption + Actions */}
      <div style={{ padding: "7px 12px 8px" }}>
        <div style={{ fontSize: 13, color: "#444", lineHeight: 1.6, marginBottom: 8 }}>
          <span style={{ fontWeight: 700, color: "#222" }}>{item.creator} </span>{item.caption}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <button onClick={() => onLike(item.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "4px 8px 4px 0", color: liked ? CORAL : "#aaa", animation: liked ? "heartPop 0.4s ease" : "none" }}>
            <Heart size={17} fill={liked ? CORAL : "none"} color={liked ? CORAL : "#aaa"} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>{item.likes + (liked ? 1 : 0)}</span>
          </button>
          <button onClick={() => shareItem(item.creator + "s Beitrag")} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", color: "#aaa" }}>
            <Share2 size={17} color="#bbb" />
          </button>
          <button onClick={() => onFav(item.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", color: faved ? GOLD : "#aaa" }}>
            <Star size={17} fill={faved ? GOLD : "none"} color={faved ? GOLD : "#bbb"} />
          </button>
          <button onClick={() => onViewWirker(item.creator)}
            style={{ marginLeft: "auto", background: "none", border: "none", color: TEAL, fontWeight: 700, fontSize: 12, cursor: "pointer", padding: "4px 0" }}>
            Profil ansehen →
          </button>
        </div>
      </div>
      <CommentSection itemId={item.id} creator={item.creator} isTalent={isTalentUser && item.creator === "Sofia M."} />
    </div>
  );
}
function WerkCard({ item, liked, onLike, faved, onFav, onAddToCart, onViewWerk, onViewWirker, isTalentUser }) {
  const [added, setAdded] = useState(false);
  const handleCart = (e) => {
    e.stopPropagation();
    onAddToCart(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };
  return (
    <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: `1px solid #f0f0ee`, margin: "6px 12px", borderLeft: `3px solid ${GOLD}` }}>
      <div style={{ position: "relative", cursor: "pointer" }} onClick={() => onViewWerk(item.title)}>
        <img src={item.img} style={{ width: "100%", height: 175, objectFit: "cover" }} alt={item.title} />
        {/* Preis oben links */}
        <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", color: "white", borderRadius: 20, padding: "5px 12px", fontWeight: 800, fontSize: 15 }}>{item.price}</div>
        {/* In den Korb – Overlay-Button unten */}
        <button
          onClick={handleCart}
          style={{
            position: "absolute", bottom: 10, right: 10,
            background: added ? TEAL : CORAL,
            color: "white", border: "none", borderRadius: 22,
            padding: "8px 16px", fontWeight: 700, fontSize: 13,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            boxShadow: "0 2px 10px rgba(0,0,0,0.25)", transition: "background 0.25s"
          }}
        >
          <ShoppingBasket size={14} color="white" />
          {added ? "✓ Hinzugefügt" : "In den Korb"}
        </button>
      </div>
      <div style={{ padding: "10px 14px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <img src={item.creatorImg} onClick={(e) => { e.stopPropagation(); onViewWirker(item.creator); }} style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", cursor: "pointer" }} alt={item.creator} />
          <span onClick={(e) => { e.stopPropagation(); onViewWirker(item.creator); }} style={{ fontWeight: 600, fontSize: 12, color: TEAL, cursor: "pointer" }}>{item.creator}</span>
          <span style={{ fontSize: 11, color: "#bbb", marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}><MapPin size={10} />{item.location}</span>
          {(item.recommendations || 0) > 0 && <span style={{ fontSize: 11, color: TEAL, display: "flex", alignItems: "center", gap: 2, fontWeight: 700 }}><ThumbsUp size={10} color={TEAL} fill={TEAL} />{item.recommendations} empfehlen</span>}
              {item.recommendations >= 10 && <span style={{ fontSize: 10, background: item.recommendations >= 50 ? "#8B5CF615" : `${CORAL}15`, color: item.recommendations >= 50 ? "#8B5CF6" : CORAL, borderRadius: 20, padding: "1px 7px", fontWeight: 700 }}>{item.recommendations >= 50 ? "✨ Community Liebling" : "🏆 Top Wirker"}</span>}
        </div>
        <div onClick={() => onViewWerk(item.title)} style={{ fontWeight: 700, fontSize: 15, color: "#222", marginBottom: 8, cursor: "pointer" }}>{item.title}</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => onLike(item.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: liked ? CORAL : "#bbb", padding: 0 }}><Heart size={17} fill={liked ? CORAL : "none"} color={liked ? CORAL : "#bbb"} style={{ animation: liked ? "heartPop 0.4s ease" : "none" }} /><span style={{ fontSize: 12, color: liked ? CORAL : "#bbb" }}>{item.likes + (liked ? 1 : 0)}</span></button>
          <button onClick={(e) => { e.stopPropagation(); shareItem(item.title, "Werk"); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Share2 size={17} color="#bbb" /></button>
          <button onClick={() => onFav(item.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Star size={17} fill={faved ? GOLD : "none"} color={faved ? GOLD : "#bbb"} /></button>
          <button onClick={() => onViewWerk(item.title)} style={{ marginLeft: "auto", background: "none", border: `1.5px solid ${CORAL}`, borderRadius: 10, padding: "5px 12px", fontWeight: 700, fontSize: 12, color: CORAL, cursor: "pointer" }}>Details →</button>
        </div>
      </div>
      <CommentSection itemId={item.id} creator={item.creator} isTalent={isTalentUser && item.creator === "Sofia M."} />
    </div>
  );
}

function ServiceCard({ item, liked, onLike, faved, onFav, onViewWirker, onBookService, isTalentUser, following, toggleFollow }) {
  const [booking, setBooking] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  const handleBook = async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (confirming) return;
    setConfirming(true);
    try {
      const rawPrice = (item.price || "60 €").replace(/[^0-9,\.]/g, "").replace(",", ".").trim();
      const price = parseFloat(rawPrice) || 60;
      const amountCents = Math.round(price * 100);
      const res = await fetch('https://michi-6f9abd25.base44.app/functions/createCheckout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: item.title || item.service || "Buchung",
          amountCents,
          itemType: 'buchung',
          wirkerName: item.creator || "Talent",
          successUrl: 'https://be-hui.vercel.app?payment=success',
          cancelUrl: 'https://be-hui.vercel.app',
        }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        try {
          localStorage.setItem("hui_last_booking", JSON.stringify({
            wirkerName: item.creator,
            wirkerImg: item.creatorImg,
            itemName: item.title || item.service,
            totalEur: data.totalEur,
            impactEur: data.impactEur,
          }));
        } catch(ex) {}
        window.open(data.checkoutUrl, '_self');
      } else {
        alert('Stripe-Fehler: ' + (data.error || 'Unbekannt'));
        setConfirming(false);
      }
    } catch(err) {
      alert('Verbindungsfehler: ' + err.message);
      setConfirming(false);
    }
  };

  return (
    <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 14px rgba(0,0,0,0.07)", border: "1px solid #f0f0ee", margin: "8px 16px", borderLeft: `3.5px solid ${TEAL}` }}>
      <div style={{ position: "relative" }}>
        <img src={item.img} style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }} alt={item.title} />
        <div style={{ position: "absolute", top: 10, left: 10, background: `${TEAL}ee`, backdropFilter: "blur(4px)", color: "white", borderRadius: 20, padding: "5px 12px", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
          🤝 {item.price}
        </div>
      </div>
      <div style={{ padding: "10px 14px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <img src={item.creatorImg} onClick={(e) => { e.stopPropagation(); onViewWirker(item.creator); }} style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", cursor: "pointer" }} alt={item.creator} />
          <span onClick={(e) => { e.stopPropagation(); onViewWirker(item.creator); }} style={{ fontWeight: 600, fontSize: 12, color: TEAL, cursor: "pointer" }}>{item.creator}</span>
          <span style={{ fontSize: 11, color: "#bbb", marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}><MapPin size={10} />{item.location}</span>
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#222", marginBottom: 4 }}>{item.title}</div>
        {item.caption && <div style={{ fontSize: 13, color: "#888", marginBottom: 8, lineHeight: 1.5 }}>{item.caption}</div>}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
          <button onClick={() => onLike(item.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: liked ? CORAL : "#bbb", padding: 0 }}><Heart size={17} fill={liked ? CORAL : "none"} color={liked ? CORAL : "#bbb"} style={{ animation: liked ? "heartPop 0.4s ease" : "none" }} /><span style={{ fontSize: 12, color: liked ? CORAL : "#bbb" }}>{item.likes + (liked ? 1 : 0)}</span></button>
          <button onClick={(e) => { e.stopPropagation(); shareItem(item.title, "Dienstleistung"); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Share2 size={17} color="#bbb" /></button>
          <button onClick={() => onFav(item.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Star size={17} fill={faved ? GOLD : "none"} color={faved ? GOLD : "#bbb"} /></button>
          <button
            onClick={handleBook}
            disabled={confirming}
            style={{
              marginLeft: "auto",
              background: confirming ? "#aaa" : TEAL,
              color: "white", border: "none", borderRadius: 22,
              padding: "8px 18px", fontWeight: 700, fontSize: 13,
              cursor: confirming ? "default" : "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            {confirming ? "⏳ Lädt…" : "📅 Buchen"}
          </button>
        </div>
      </div>
      <CommentSection itemId={item.id} creator={item.creator} isTalent={false} />
    </div>
  );
}

function WirkerCard({ item, onViewWirker, onBookWirker }) {
  // Find cover image from mockWirkerProfiles if available
  const wirkerData = mockWirkerProfiles[item.name];
  const coverImg = wirkerData?.header || item.img;
  return (
    <div style={{ margin: "8px 16px", borderRadius: 18, background: "white", boxShadow: "0 2px 16px rgba(0,0,0,0.08)", overflow: "hidden", border: `1px solid #f0f0ee`, borderLeft: `3.5px solid ${TEAL}` }}>
      {/* Cover image */}
      <div style={{ position: "relative", cursor: "pointer", height: 120 }} onClick={() => onViewWirker(item.name)}>
        <img src={coverImg} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} alt="" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.55) 100%)" }} />
        {/* Name overlay */}
        <div style={{ position: "absolute", bottom: 10, left: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <img src={item.img} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid white" }} alt={item.name} />
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: "#4CAF50", border: "2px solid white" }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "white", display: "flex", alignItems: "center", gap: 4 }}>
              {item.name} <BadgeCheck size={12} color="white" />
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>{item.talent}</div>
          </div>
        </div>
      </div>
      {/* Info row */}
      <div style={{ padding: "10px 14px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "#bbb", display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={9} />{item.location}
            <span style={{ color: TEAL, fontWeight: 700, marginLeft: 4, display: "flex", alignItems: "center", gap: 3 }}><ThumbsUp size={11} color={TEAL} fill={TEAL} /> {item.recommendations} empfehlen</span>
                {item.recommendations >= 10 && <span style={{ fontSize: 10, background: item.recommendations >= 50 ? "#8B5CF615" : `${CORAL}15`, color: item.recommendations >= 50 ? "#8B5CF6" : CORAL, borderRadius: 20, padding: "1px 8px", fontWeight: 700, marginLeft: 4 }}>{item.recommendations >= 50 ? "✨ Community Liebling" : "🏆 Top Wirker"}</span>}
          </div>
        </div>
        <button onClick={() => onBookWirker(item.name)}
          style={{ flexShrink: 0, background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 10, padding: "7px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
          Buchen
        </button>
      </div>
    </div>
  );
}
function ImpactCard({ item }) {
  const IMPACT_PURPLE = "#7c3aed";
  const IMPACT_PURPLE_LIGHT = "#ede9fe";
  return (
    <div style={{ background: `linear-gradient(160deg, #faf5ff, #ede9fe)`, borderRadius: 18, overflow: "hidden", boxShadow: `0 4px 18px rgba(124,58,237,0.13)`, border: `1px solid rgba(124,58,237,0.18)`, margin: "8px 16px", borderLeft: `3.5px solid ${IMPACT_PURPLE}` }}>
      {/* Cover Image mit Overlay */}
      <div style={{ position: "relative" }}>
        <img src={item.img} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} alt={item.title} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(124,58,237,0.15) 0%, rgba(0,0,0,0.5) 100%)" }} />
        {/* Badge */}
        <div style={{ position: "absolute", top: 12, left: 12, background: IMPACT_PURPLE, color: "white", borderRadius: 20, padding: "5px 12px", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
          🌱 Herzensprojekt
        </div>
        {/* Fortschritt als Overlay unten */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 14px 8px", background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.85)", marginBottom: 5, fontWeight: 600 }}>
            <span>{item.collected} gesammelt</span>
            <span>Ziel: {item.goal}</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: 99, height: 5 }}>
            <div style={{ background: `linear-gradient(90deg, #a78bfa, ${IMPACT_PURPLE})`, height: 5, borderRadius: 99, width: `${item.progress}%`, transition: "width 0.6s ease" }} />
          </div>
        </div>
      </div>
      {/* Content */}
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: "#1e1b4b", marginBottom: 4 }}>{item.title}</div>
        <div style={{ fontSize: 12, color: "#7c3aed", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
          🗳️ Community stimmt gerade ab
        </div>
      </div>
    </div>
  );
}
// ══════════════════════════════════════════════════════════════════
// CHAT + TREUHAND + EMPFEHLUNGS-FLOW
// ══════════════════════════════════════════════════════════════════

// Mock Chats (Käufer-Sicht)
const mockChats = [
  {
    id: "chat1", type: "buchung", status: "aktiv", // aktiv | abgeschlossen | gemeldet
    wirker: "Sofia M.", wirkerImg: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop",
    item: "Töpfer-Workshop", date: "28. April 2026", betrag: "75 €",
    treuhand: "offen", // offen | freigegeben
    bewertung: null,
    messages: [
      { from: "system", text: "🔒 Buchung bestätigt! Dein Geld liegt sicher im Treuhandkonto. Es wird erst nach deiner Bestätigung an Sofia freigegeben.", time: "10:00" },
      { from: "wirker", text: "Hallo! Ich freue mich auf unseren Töpfer-Workshop 🎨 Bitte bring bequeme Kleidung mit.", time: "10:05" },
      { from: "ich", text: "Super, ich freu mich auch! Gibt es etwas, das ich vorbereiten soll?", time: "10:12" },
      { from: "wirker", text: "Nein, alles da! Bis Dienstag 👋", time: "10:14" },
    ]
  },
  {
    id: "chat2", type: "werk", status: "empfehlung_ausstehend",
    wirker: "Tom H.", wirkerImg: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
    item: "Handgenähter Leder-Rucksack", date: "20. April 2026", betrag: "195 €",
    treuhand: "offen",
    bewertung: null,
    messages: [
      { from: "system", text: "🔒 Kauf bestätigt! Dein Geld liegt sicher im Treuhandkonto.", time: "14:00" },
      { from: "wirker", text: "Hallo! Dein Rucksack ist fertig genäht 🎒 Ich versende ihn morgen per DHL.", time: "16:30" },
      { from: "ich", text: "Wunderbar, danke für die schnelle Arbeit!", time: "17:00" },
      { from: "system", text: "📦 Ware wurde als geliefert markiert. Bitte bestätige den Erhalt und gib eine Empfehlung ab.", time: "23. April", isPrompt: true },
    ]
  },
  {
    id: "chat3", type: "buchung", status: "abgeschlossen",
    wirker: "Lena K.", wirkerImg: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
    item: "Aquarell-Portrait", date: "10. April 2026", betrag: "120 €",
    treuhand: "freigegeben",
    bewertung: { empfohlen: true, text: "Lena ist unglaublich talentiert! Das Portrait hat mich zu Tränen gerührt." },
    messages: [
      { from: "system", text: "🔒 Buchung bestätigt! Dein Geld liegt sicher im Treuhandkonto.", time: "09:00" },
      { from: "wirker", text: "Ich habe das Portrait fertiggestellt! Hier ein Foto 🎨", time: "12:00" },
      { from: "ich", text: "Es ist wunderschön! Vielen Dank Lena!", time: "12:30" },
      { from: "system", text: "✅ Empfehlung abgegeben. Geld wurde an Lena freigegeben. Chat archiviert.", time: "12:35", isDone: true },
    ]
  },
];


export { MediaCard, WerkCard, ServiceCard, WirkerCard, ImpactCard };
