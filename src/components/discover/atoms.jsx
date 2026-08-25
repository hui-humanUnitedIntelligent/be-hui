// src/components/discover/atoms.jsx
// Shared UI atoms for DiscoverPage. Extracted — no logic changes.
import React from "react";
import { T } from "./constants.js";
import { HUILocationIcon } from "../../design/icons/HuiSystemIcons.jsx";

export function Skel({ w="100%", h=14, r=10, mb=0 }) {
  return <div className="dp-skel" style={{ width:w, height:h, borderRadius:r, marginBottom:mb }} />;
}

// ── Section Header ────────────────────────────────────────────────
export function SectionHead({ title = "", sub = "", action = "", onAction = () => {}, delay=0 }) {
  return (
    <div className="dp-in" style={{
      display:"flex", alignItems:"flex-end", justifyContent:"space-between",
      padding:`0 ${T.px}px`, marginBottom:14,
      animationDelay:`${delay}ms`,
    }}>
      <div>
        <div style={{ fontSize:17, fontWeight: 600, color:T.ink, letterSpacing:"-0.03em", lineHeight:1.2 }}>
          {title}
        </div>
        {sub && <div style={{ fontSize:12, color:T.inkFaint, marginTop:3, fontWeight:400 }}>{sub}</div>}
      </div>
      {action && (
        <button onClick={() => onAction?.()} style={{
          background:"none", border:"none", cursor:"pointer", padding:0,
          fontSize:12.5, fontWeight:600, color:T.teal,
          display:"flex", alignItems:"center", gap:4,
          touchAction:"manipulation", WebkitTapHighlightColor:"transparent",
        }}>
          {action} <span style={{ fontSize:13 }}>›</span>
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 1. TITELBEREICH (Suchleiste entfernt — globale Suche im Header)
// ════════════════════════════════════════════════════════════════
// HOME.1 (2026-07-08, Lars): diese Komponente rendert unter dem Nav-Tab
// key="discover", der in navConfig.js explizit mit Label "Home" beschriftet
// ist (NAV.1A-Entscheidung: feed→"Entdecken", discover→"Home"). Der Titel
// zeigte bisher noch "Entdecken" + Discovery-Marketing-Subline -- eine
// Altlast aus der Zeit vor der Home/Discover-Aufteilung. Jetzt korrekt auf
// den persoenlichen "Zuhause"-Charakter des Home-Bereichs umgestellt.
// Der Nav-Tab mit Label "Entdecken" (key="feed", UnifiedFeed) bleibt
// unveraendert der Ort zum Entdecken neuer Menschen/Werke/Erlebnisse/
// Projekte -- hier wird NUR der Home-Titel angepasst, kein Funktions-/
// Layout-Eingriff. KEIN Bezug auf Tageszeiten (kein "Guten Morgen").
// Komponentenname 'DiscoverTitleBar' bewusst technisch beibehalten (reines
// Implementierungsdetail, keine sichtbare Aenderung durch Umbenennung noetig).
export function CardBadge({ pos="left", bg, color, cover, children }) {
  return (
    <div style={{
      position:"absolute", top:8, [pos]:8,
      background: cover ? "rgba(0,0,0,0.54)" : bg,
      backdropFilter: "none",
      borderRadius:99, padding:"2px 9px",
      fontSize:9, fontWeight: 600,
      color: cover ? "rgba(255,255,255,0.92)" : color,
      letterSpacing:".03em",
    }}>
      {children}
    </div>
  );
}

export function CardTitle({ children }) {
  return (
    <div style={{
      fontSize:13, fontWeight: 600, color:T.ink,
      marginBottom:3, letterSpacing:"-0.02em", lineHeight:1.25,
      overflow:"hidden", display:"-webkit-box",
      WebkitLineClamp:2, WebkitBoxOrient:"vertical",
    }}>
      {children}
    </div>
  );
}

export function CardLocationRow({ location, distanceKm }) {
  if (!location && !Number.isFinite(distanceKm)) return null;
  return (
    <div style={{
      fontSize:10, color:T.inkFaint, marginBottom:6,
      display:"flex", alignItems:"center", gap:3,
    }}>
      <HUILocationIcon size={9} style={{flexShrink:0}} />
      <span style={{ overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
        {location}{location && Number.isFinite(distanceKm) ? " " : ""}
        {Number.isFinite(distanceKm) ? `${distanceKm.toFixed(0)} km entfernt` : ""}
      </span>
    </div>
  );
}

