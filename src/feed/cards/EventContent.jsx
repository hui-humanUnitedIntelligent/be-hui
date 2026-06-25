import React from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";

// Sprint 2.5 — einheitliche Typografie-Tokens
const C = {
  title: { margin:"0 0 8px", fontSize:16, fontWeight:700, color:"#141422", lineHeight:1.4, letterSpacing:"-0.01em" },
  desc:  { margin:"0 0 8px", fontSize:13.5, fontWeight:400, color:"rgba(20,20,34,0.64)", lineHeight:1.55 },
  meta:  { margin:0, fontSize:12, fontWeight:500, color:"rgba(20,20,34,0.42)" },
};
const TEAL   = "#0DC4B5";
const PURPLE = "#7264D6";

export default function EventContent({ item, onProfile, onReaction, onShare }) {
  if (!item) return null;

  const title   = item.title || item.text || "";
  const desc    = item._raw?.description || item._raw?.caption || null;
  const isLive  = item.isLive;
  // Meta: Ort · Uhrzeit
  const timeDisplay = item.timeStart ? item.timeStart.slice(0,5) + " Uhr" : null;
  const meta    = [item.location, timeDisplay].filter(Boolean).join(" · ");

  const badge = {
    label:  isLive ? "🔴 LIVE" : "Event",
    bg:     isLive ? "rgba(239,68,68,0.10)"   : "rgba(114,100,214,0.10)",
    border: isLive ? "rgba(239,68,68,0.22)"   : "rgba(114,100,214,0.22)",
    color:  isLive ? "#EF4444"                : PURPLE,
  };

  return (
    <BaseFeedCard item={item} onProfile={onProfile} onReaction={onReaction} onShare={onShare} badge={badge}>

      {/* Titel */}
      {title ? <p style={{ ...C.title }}>{title}</p> : null}

      {/* Beschreibung */}
      {desc ? <p style={{ ...C.desc }}>{desc}</p> : null}

      {/* Ort · Zeit */}
      {meta ? <p style={{ ...C.meta }}>{meta}</p> : null}

    </BaseFeedCard>
  );
}
