import React from "react";
import { T } from "../tokens.js";

export function LiveTicker({ activities }) {
  return (
    <div style={{ padding:"16px 16px 0" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background:T.teal,
          animation:"ipPulse 1.4s ease-in-out infinite" }}/>
        <h3 style={{ margin:0, fontSize:14, fontWeight:800, color:T.ink,
          letterSpacing:"-0.01em" }}>Live-Aktivitäten im Impact Pool</h3>
      </div>

      <div style={{ background:T.surfaceHi, borderRadius:20,
        boxShadow:S.card, border:`1px solid ${T.line}`, overflow:"hidden" }}>
        {activities.slice(0,5).map((act, i) => (
          <div key={act.id} style={{
            display:"flex", alignItems:"center", gap:10,
            padding:"11px 16px",
            borderBottom: i < Math.min(activities.length,5)-1 ? `1px solid ${T.line}` : "none",
            animation:"ipFade 0.28s ease both", animationDelay:`${i*0.04}s`,
          }}>
            <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0,
              overflow:"hidden", background:`${T.teal}12`,
              border:`1px solid ${T.teal}20`,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>
              {act.avatar
                ? <img loading="lazy" decoding="async" src={act.avatar} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                : "👤"
              }
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, color:T.ink, lineHeight:1.4,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                <b>{act.user}</b> hat <b>{act.proj}</b> mit 1 Stimme unterstützt
              </div>
            </div>
            <div style={{ fontSize:10, color:T.muted, flexShrink:0 }}>{act.ago}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 8. MECHANIK ERKLÄREN (weiter unten, klar + ruhig)
// ════════════════════════════════════════════════════════════════
