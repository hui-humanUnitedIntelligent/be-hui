import React from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";

const TEAL  = "#16D7C5";
const INK   = "#1A1A2E";
const INK3  = "rgba(26,26,46,0.45)";
const CORAL = "#FF8A6B";

export default function ExperienceContent({ item, onProfile, onReaction, onShare, onBook }) {
  if (!item) return null;
  const title = item.title || item.text || "";
  const desc  = item._raw?.description || item._raw?.caption || null;
  const timeDisplay = item.timeStart ? item.timeStart.slice(0,5) + " Uhr" : (item.duration || null);
  const meta  = [item.location, timeDisplay, item.format].filter(Boolean).join(" · ");
  const badge = { label:"Erlebnis", bg:"rgba(22,215,197,0.10)", border:"rgba(22,215,197,0.25)", color:TEAL };
  const priceLabel = item.price != null ? "ab " + item.price + " €" : "Buchen";

  const bookBtn = onBook ? (
    <button
      onClick={() => onBook(item)}
      style={{
        background:"linear-gradient(135deg,#16D7C5,#0AB8B2)",
        color:"#fff", border:"none", borderRadius:14,
        padding:"7px 16px", fontSize:12, fontWeight:700,
        cursor:"pointer", touchAction:"manipulation",
        boxShadow:"0 2px 8px rgba(22,215,197,0.30)",
      }}
    >
      {priceLabel}
    </button>
  ) : null;

  return (
    <BaseFeedCard
      item={item} onProfile={onProfile} onReaction={onReaction}
      onShare={onShare} badge={badge} extraActions={bookBtn}
    >
      {title ? (
        <p style={{ margin:"0 0 6px", fontSize:15, fontWeight:700, color:INK, lineHeight:1.4 }}>
          {title}
        </p>
      ) : null}
      {desc ? (
        <p style={{ margin:"0 0 8px", fontSize:13.5, color:"rgba(20,20,34,0.65)", lineHeight:1.55 }}>
          {desc}
        </p>
      ) : null}
      {meta ? (
        <p style={{ margin:0, fontSize:12, color:INK3, fontWeight:500 }}>{meta}</p>
      ) : null}
    </BaseFeedCard>
  );
}
