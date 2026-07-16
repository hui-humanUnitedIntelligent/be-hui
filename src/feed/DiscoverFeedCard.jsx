/**
 * DiscoverFeedCard.jsx — Einheitliche Feed-Karte für alle Content-Typen
 *
 * Rendert work / moment / talent / experience / impact
 * ohne eigene Logik — rein visuell.
 *
 * Performance:
 *  - React.memo → kein Re-Render wenn Item sich nicht ändert
 *  - Bilder mit loading="lazy" + IntersectionObserver-gesteuert
 *  - Kein State in der Karte selbst
 */

import React from "react";

// ─── Token / Design System ────────────────────────────────────────────────────
const T = {
  teal:    "rgba(13,196,181,1)",
  tealSoft:"rgba(13,196,181,0.12)",
  coral:   "rgba(244,115,85,1)",
  coralSoft:"rgba(244,115,85,0.10)",
  gold:    "rgba(251,191,36,1)",
  goldSoft:"rgba(251,191,36,0.12)",
  purple:  "rgba(139,92,246,1)",
  purpleSoft:"rgba(139,92,246,0.10)",
  green:   "rgba(34,197,94,1)",
  greenSoft:"rgba(34,197,94,0.10)",
  text:    "rgba(26,26,46,0.85)",
  sub:     "rgba(26,26,46,0.45)",
  border:  "rgba(26,26,46,0.07)",
  card:    "#ffffff",
  radius:  16,
};

// ─── Type-Config ──────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  work:       { label: "Werk",        color: T.teal,   bg: T.tealSoft,   emoji: "🎨" },
  moment:     { label: "Moment",      color: T.coral,  bg: T.coralSoft,  emoji: "📸" },
  talent:     { label: "Talent",      color: T.purple, bg: T.purpleSoft, emoji: "✨" },
  experience: { label: "Erlebnis",    color: T.gold,   bg: T.goldSoft,   emoji: "🌿" },
  impact:     { label: "Herzensprojekt", color: T.green, bg: T.greenSoft, emoji: "💚" },
};

// ─── Datum formatieren ───────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60)       return "gerade";
  if (diff < 3600)     return `vor ${Math.floor(diff/60)} Min`;
  if (diff < 86400)    return `vor ${Math.floor(diff/3600)} Std`;
  if (diff < 86400*7)  return `vor ${Math.floor(diff/86400)} Tagen`;
  return d.toLocaleDateString("de-DE", { day:"numeric", month:"short" });
}

// ─── Preis formatieren ───────────────────────────────────────────────────────
function fmtPrice(price, currency = "EUR") {
  if (price == null || price === 0) return null;
  const sym = currency === "EUR" ? "€" : currency;
  return `${sym}${Number(price).toFixed(2).replace(".", ",")}`;
}

// ─── Lazy Image ───────────────────────────────────────────────────────────────
const LazyImage = React.memo(function LazyImage({ src, alt, style }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt || ""}
      loading="lazy"
      decoding="async"
      style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", ...style }}
      onError={e => { e.currentTarget.style.display = "none"; }}
    />
  );
});

// ─── Placeholder wenn kein Bild ───────────────────────────────────────────────
function ImagePlaceholder({ type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.work;
  return (
    <div style={{
      width:"100%", height:"100%",
      display:"flex", alignItems:"center", justifyContent:"center",
      background:`linear-gradient(135deg, ${cfg.bg}, rgba(255,255,255,0.5))`,
      fontSize: 40,
    }}>
      {cfg.emoji}
    </div>
  );
}

// ─── Impact Progress Bar ──────────────────────────────────────────────────────
function ImpactProgress({ current, goal }) {
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:11, color:T.sub }}>Gesammelt</span>
        <span style={{ fontSize:11, color:T.green, fontWeight:600 }}>
          €{current?.toLocaleString("de-DE") || 0} / €{goal?.toLocaleString("de-DE") || 0}
        </span>
      </div>
      <div style={{ height:4, borderRadius:2, background:"rgba(26,26,46,0.07)", overflow:"hidden" }}>
        <div style={{
          height:"100%", borderRadius:2,
          width:`${pct}%`,
          background:`linear-gradient(90deg, ${T.green}, rgba(34,197,94,0.7))`,
          transition: "width 0.3s ease",
        }}/>
      </div>
    </div>
  );
}

// ─── Haupt-Karte ─────────────────────────────────────────────────────────────
const DiscoverFeedCard = React.memo(function DiscoverFeedCard({ item, onPress, style }) {
  if (!item) return null;
  const cfg = TYPE_CONFIG[item._type] || TYPE_CONFIG.work;

  const hasImage = Boolean(item.cover_url);
  const priceStr = fmtPrice(item.price, item.currency);

  return (
    <div
      onClick={() => onPress?.(item)}
      style={{
        background: T.card,
        borderRadius: T.radius,
        border: `1px solid ${T.border}`,
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        // Kein box-shadow → Performance
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
    >
      {/* ── Bild-Bereich (16:9) ──────────────────────────── */}
      <div style={{ position:"relative", width:"100%", paddingTop:"56.25%", flexShrink:0 }}>
        <div style={{ position:"absolute", inset:0, background:"rgba(26,26,46,0.04)" }}>
          {hasImage
            ? <LazyImage src={item.cover_url} alt={item.title || ""} />
            : <ImagePlaceholder type={item._type} />
          }
        </div>

        {/* Type-Badge oben links */}
        <div style={{
          position:"absolute", top:8, left:8,
          background: cfg.color,
          color:"#fff",
          fontSize:10, fontWeight:700,
          padding:"3px 8px", borderRadius:20,
          letterSpacing:"0.3px",
        }}>
          {cfg.label}
        </div>

        {/* Preis-Badge oben rechts */}
        {priceStr && (
          <div style={{
            position:"absolute", top:8, right:8,
            background:"rgba(26,26,46,0.72)",
            backdropFilter:"blur(8px)",
            color:"#fff",
            fontSize:11, fontWeight:700,
            padding:"3px 8px", borderRadius:20,
          }}>
            {priceStr}
          </div>
        )}
      </div>

      {/* ── Textbereich ─────────────────────────────────── */}
      <div style={{ padding:"12px 14px 14px", flex:1, display:"flex", flexDirection:"column", gap:4 }}>

        {/* Titel */}
        {item.title && (
          <div style={{
            fontSize:14, fontWeight:700,
            color:T.text,
            lineHeight:1.35,
            overflow:"hidden", display:"-webkit-box",
            WebkitLineClamp:2, WebkitBoxOrient:"vertical",
          }}>
            {item.title}
          </div>
        )}

        {/* Caption / Beschreibung */}
        {item.caption && (
          <div style={{
            fontSize:12, color:T.sub,
            lineHeight:1.5,
            overflow:"hidden", display:"-webkit-box",
            WebkitLineClamp:2, WebkitBoxOrient:"vertical",
          }}>
            {item.caption}
          </div>
        )}

        {/* Impact Progress */}
        {item._type === "impact" && (
          <ImpactProgress current={item.current_amount_eur} goal={item.funding_goal} />
        )}

        {/* Erlebnis-Datum */}
        {item._type === "experience" && item.date && (
          <div style={{ fontSize:11, color:T.gold, fontWeight:600, marginTop:4 }}>
            📅 {new Date(item.date).toLocaleDateString("de-DE", { day:"numeric", month:"short", year:"numeric" })}
          </div>
        )}

        {/* Talent-Ort */}
        {item._type === "talent" && item.location_type && (
          <div style={{ fontSize:11, color:T.sub, marginTop:4 }}>
            📍 {item.location_type === "online" ? "Online" : item.location_type === "local" ? "Vor Ort" : "Flexibel"}
          </div>
        )}

        {/* Footer: Datum */}
        <div style={{ marginTop:"auto", paddingTop:8, fontSize:11, color:T.sub }}>
          {fmtDate(item.created_at)}
        </div>
      </div>
    </div>
  );
});

export default DiscoverFeedCard;
