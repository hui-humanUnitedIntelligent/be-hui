import React from "react";
import { T } from "../tokens.js";
import { HUILocationIcon } from "../../../../design/icons/HuiSystemIcons.jsx";
import { CARD_RADIUS } from "../tokens.js";

export { CARD_RADIUS };
// CARD_RADIUS re-exported for card components

export function CardBadge({ pos="left", bg, color, cover, children }) {
  return (
    <div style={{
      position:"absolute", top:8, [pos]:8,
      background: cover ? "rgba(0,0,0,0.54)" : bg,
      backdropFilter: "none",
      borderRadius:99, padding:"2px 9px",
      fontSize:9, fontWeight:700,
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
      fontSize:13, fontWeight:700, color:T.ink,
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
