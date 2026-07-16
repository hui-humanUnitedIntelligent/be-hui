import React from "react";
import { T } from "../tokens.js";
import { fmtEur, safeNum } from "../utils.js";

const SEED_WEITERE_PROJEKTE = [];

// ════════════════════════════════════════════════════════════════
const HP_STATUS = {
  submitted:   { icon:"📬", color:"#9CA3AF", label:"Eingegangen"   },
  pending:     { icon:"🟡", color:"#D97706", label:"In Prüfung"     },
  approved:    { icon:"🟢", color:"#16A34A", label:"Genehmigt"     },
  nominated:   { icon:"🗳️", color:"#0DC4B5", label:"Nominiert"     },
  active:      { icon:"🗳️", color:"#0DC4B5", label:"Abstimmung"    },
  in_progress: { icon:"🚀", color:"#7264D6", label:"In Umsetzung" },
  funded:      { icon:"💪", color:"#0DC4B5", label:"Finanziert"   },
  finished:    { icon:"✅",     color:"#16A34A", label:"Abgeschlossen" },
};

export function HerzensKarte({ p, idx }) {
  const [imgErr, setImgErr] = React.useState(false);
  const cfg     = HP_STATUS[p.status] || HP_STATUS.pending;
  const accent  = p.color || T.teal;
  const goalEur = safeNum(p.goal_eur) || 0;
  return (
    <div style={{
      background:T.surfaceHi, borderRadius:20,
      boxShadow:S.card, border:`1px solid ${T.line}`,
      overflow:"hidden",
      animation:"ipFade 0.32s ease both",
      animationDelay:`${(idx||0)*0.05}s`,
    }}>
      <div style={{ display:"flex", alignItems:"stretch" }}>
        <div style={{ width:84, flexShrink:0, background:`${accent}12`,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:30 }}>
          {p.img_url && !imgErr
            ? <img loading="lazy" decoding="async" src={p.img_url} alt={p.name} onError={() => setImgErr(true)}
                style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            : (p.icon || "🌱")
          }
        </div>
        <div style={{ flex:1, padding:"11px 13px", minWidth:0 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:4,
            background:`${cfg.color}14`, border:`1px solid ${cfg.color}28`,
            borderRadius:99, padding:"2px 8px", marginBottom:5 }}>
            <span style={{ fontSize:10 }}>{cfg.icon}</span>
            <span style={{ fontSize:9, fontWeight:800, color:cfg.color,
              letterSpacing:"0.05em", textTransform:"uppercase" }}>{cfg.label}</span>
          </div>
          <div style={{ fontSize:14, fontWeight:800, color:T.ink, lineHeight:1.3,
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
            marginBottom: p.description ? 3 : 0 }}>{p.name}</div>
          {p.description && (
            <div style={{ fontSize:11.5, color:T.ink2, lineHeight:1.5, marginBottom:5,
              display:"-webkit-box", WebkitLineClamp:1,
              WebkitBoxOrient:"vertical", overflow:"hidden" }}>
              {p.description}
            </div>
          )}
          {/* Stimmen-Counter */}
          <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:5 }}>
            <span style={{ fontSize:10, color:T.muted }}>
              🗳 {safeNum(p.vote_count || p.votes)} {safeNum(p.vote_count || p.votes) === 1 ? "Stimme" : "Stimmen"}
            </span>
          </div>
          {/* Finanzierungsbalken */}
          {goalEur > 0 && (() => {
            const curr = safeNum(p.current_amount_eur) || 0;
            const pct  = Math.min(100, goalEur > 0 ? (curr / goalEur) * 100 : 0);
            return (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", marginBottom:3 }}>
                  <span style={{ fontSize:9.5, color:T.ink2, fontWeight:600 }}>
                    {fmtEur(curr)} von {fmtEur(goalEur)} finanziert
                  </span>
                  <span style={{ fontSize:9, color:accent, fontWeight:800 }}>
                    {Math.round(pct)}%
                  </span>
                </div>
                <div style={{ height:4, background:`${accent}18`, borderRadius:99, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`,
                    background:`linear-gradient(90deg,${accent},${accent}cc)`,
                    borderRadius:99, transition:"width 0.6s ease" }} />
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

