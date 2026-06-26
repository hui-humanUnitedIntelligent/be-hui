import React from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";

export default function MomentContent({ item, onProfile, onReaction, onShare }) {
  if (!item) return null;
  const text = item.text || item.title || "";
  return (
    <BaseFeedCard item={item} onProfile={onProfile} onReaction={onReaction} onShare={onShare}>
      {text ? (
        <p style={{
          margin:0, fontSize:16, lineHeight:1.6,
          color:"rgba(26,26,46,0.82)", fontWeight:400,
          letterSpacing:"-0.01em",
        }}>{text}</p>
      ) : null}
    </BaseFeedCard>
  );
}
