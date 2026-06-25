import React from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";

// Sprint 2.5 — einheitliche Typografie-Tokens
const C = {
  title:  { fontSize:16, fontWeight:700, color:"#141422", lineHeight:1.4, letterSpacing:"-0.01em" },
  desc:   { fontSize:13.5, fontWeight:400, color:"rgba(20,20,34,0.64)", lineHeight:1.55 },
};

export default function MomentContent({ item, onProfile, onReaction, onShare }) {
  if (!item) return null;
  const text = item.text || item.title || "";
  return (
    <BaseFeedCard item={item} onProfile={onProfile} onReaction={onReaction} onShare={onShare}>
      {text ? (
        <p style={{ margin:0, ...C.desc, fontSize:16, lineHeight:1.65 }}>
          {text}
        </p>
      ) : null}
    </BaseFeedCard>
  );
}
