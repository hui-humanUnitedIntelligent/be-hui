import React from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";

// Sprint 2.5 — einheitliche Typografie-Tokens
const C = {
  title: { margin:"0 0 8px", fontSize:16, fontWeight:700, color:"#141422", lineHeight:1.4, letterSpacing:"-0.01em" },
  desc:  { margin:"0 0 8px", fontSize:13.5, fontWeight:400, color:"rgba(20,20,34,0.64)", lineHeight:1.55 },
  meta:  { margin:0, fontSize:12, fontWeight:500, color:"rgba(20,20,34,0.42)" },
};
const TEAL = "#0DC4B5";

export default function ExperienceContent({ item, onProfile, onReaction, onShare, onBook }) {
  if (!item) return null;

  const title       = item.title || item.text || "";
  const desc        = item._raw?.description || item._raw?.caption || null;
  const timeDisplay = item.timeStart ? item.timeStart.slice(0,5) + " Uhr" : (item.duration || null);
  const meta        = [item.location, timeDisplay, item.format].filter(Boolean).join(" · ");
  const badge       = { label:"Erlebnis", bg:"rgba(13,196,181,0.10)", border:"rgba(13,196,181,0.22)", color:TEAL };
  const priceLabel  = item.price != null ? "ab " + item.price + " €" : "Buchen";

  const bookBtn = onBook ? (
    <button
      onClick={() => onBook(item)}
      style={{
        background:"linear-gradient(135deg,#0DC4B5,#09A89A)",
        color:"#fff", border:"none", borderRadius:14,
        padding:"7px 18px", fontSize:12, fontWeight:700,
        cursor:"pointer", touchAction:"manipulation",
        boxShadow:"0 2px 8px rgba(13,196,181,0.28)",
      }}
    >
      {priceLabel}
    </button>
  ) : null;

  return (
    <BaseFeedCard item={item} onProfile={onProfile} onReaction={onReaction}
      onShare={onShare} badge={badge} extraActions={bookBtn}>

      {/* Titel */}
      {title ? <p style={{ ...C.title }}>{title}</p> : null}

      {/* Beschreibung */}
      {desc ? <p style={{ ...C.desc }}>{desc}</p> : null}

      {/* Ort · Zeit · Format */}
      {meta ? <p style={{ ...C.meta }}>{meta}</p> : null}

    </BaseFeedCard>
  );
}
