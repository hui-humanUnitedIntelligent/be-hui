import React from "react";
import { T } from "../tokens.js";
export function SectionHead({ title, sub, action, onAction, delay=0 }) {
  return (
    <div className="dp-in" style={{
      display:"flex", alignItems:"flex-end", justifyContent:"space-between",
      padding:`0 ${T.px}px`, marginBottom:14,
      animationDelay:`${delay}ms`,
    }}>
      <div>
        <div style={{ fontSize:17, fontWeight:800, color:T.ink, letterSpacing:"-0.03em", lineHeight:1.2 }}>
          {title}
        </div>
        {sub && <div style={{ fontSize:12, color:T.inkFaint, marginTop:3, fontWeight:400 }}>{sub}</div>}
      </div>
      {action && (
        <button onClick={onAction} style={{
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
