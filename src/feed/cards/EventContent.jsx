import React from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";
const PURPLE="#8B5CF6";
export default function EventContent({ item, onProfile, onReaction, onShare }) {
  if (!item) return null;
  const title = item.title||item.text||"";
  const meta  = [item.location,item.createdAt].filter(Boolean).join(" · ");
  const isLive= item.isLive;
  const badge = {label:isLive?"🔴 LIVE":"Event",
    bg:isLive?"rgba(239,68,68,0.10)":"rgba(139,92,246,0.10)",
    border:isLive?"rgba(239,68,68,0.25)":"rgba(139,92,246,0.25)",
    color:isLive?"#EF4444":PURPLE};
  return (
    <BaseFeedCard item={item} onProfile={onProfile} onReaction={onReaction} onShare={onShare} badge={badge}>
      {title ? <p style={{margin:0,fontSize:15,fontWeight:600,color:"#1A1A2E",lineHeight:1.4}}>{title}</p> : null}
      {meta  ? <p style={{margin:"6px 0 0",fontSize:12,color:"rgba(26,26,46,0.45)"}}>{meta}</p> : null}
    </BaseFeedCard>
  );
}
