import React from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";
const TEAL="#16D7C5";
export default function ExperienceContent({ item, onProfile, onReaction, onShare, onBook }) {
  if (!item) return null;
  const title = item.title||item.text||"";
  const timeDisplay = item.timeStart ? item.timeStart.slice(0,5) + " Uhr" : (item.duration || null);
  const meta  = [item.location,timeDisplay,item.format].filter(Boolean).join(" · ");
  const badge = {label:"Erlebnis",bg:"rgba(22,215,197,0.10)",border:"rgba(22,215,197,0.25)",color:TEAL};
  const bookBtn = onBook ? (
    <button onClick={()=>onBook(item)} style={{background:"linear-gradient(135deg,#16D7C5,#0AB8B2)",
      color:"#fff",border:"none",borderRadius:14,padding:"7px 16px",fontSize:12,fontWeight:700,
      cursor:"pointer",touchAction:"manipulation"}}>
      {item.price!=null?"ab €"+item.price:"Buchen"}
    </button>
  ) : null;
  return (
    <BaseFeedCard item={item} onProfile={onProfile} onReaction={onReaction} onShare={onShare} badge={badge} extraActions={bookBtn}>
      {title ? <p style={{margin:0,fontSize:15,fontWeight:600,color:"#1A1A2E",lineHeight:1.4}}>{title}</p> : null}
      {meta  ? <p style={{margin:"6px 0 0",fontSize:12,color:"rgba(26,26,46,0.45)"}}>{meta}</p> : null}
    </BaseFeedCard>
  );
}
