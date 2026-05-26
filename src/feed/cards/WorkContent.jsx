import React from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";
const CORAL="#FF8A6B";
export default function WorkContent({ item, onProfile, onReaction, onShare }) {
  if (!item) return null;
  const title = item.title||item.text||"";
  const tags  = Array.isArray(item.tags)?item.tags.slice(0,3):[];
  const badge = {label:"Werk",bg:"rgba(255,138,107,0.10)",border:"rgba(255,138,107,0.25)",color:CORAL};
  return (
    <BaseFeedCard item={item} onProfile={onProfile} onReaction={onReaction} onShare={onShare} badge={badge}>
      {title ? <p style={{margin:0,fontSize:15,fontWeight:600,color:"#1A1A2E",lineHeight:1.4}}>{title}</p> : null}
      {tags.length>0 && (
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
          {tags.map((t,i)=>(
            <span key={i} style={{padding:"3px 10px",borderRadius:20,background:"rgba(255,138,107,0.08)",
              border:"1px solid rgba(255,138,107,0.18)",fontSize:11,color:CORAL,fontWeight:600}}>{t}</span>
          ))}
        </div>
      )}
    </BaseFeedCard>
  );
}
