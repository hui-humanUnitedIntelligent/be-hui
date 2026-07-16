import React from "react";
import { T, S } from "../tokens.js";
import { safeNum, fmtEur } from "../utils.js";
import { HUIStimmeIcon } from "../../../../design/icons/HuiSystemIcons.jsx";

export function VotingCard({ project:p, rank, voted, totalVotes, onVote, onOpen }) {
  const accent = p.color || T.teal;
  const fundedEur = safeNum(p.current_amount_eur) || 0;
  const goalEur   = safeNum(p.goal_eur) || safeNum(p.funding_goal) || 2000;
  const fundPct   = goalEur > 0 ? Math.min(100, Math.round(fundedEur / goalEur * 100)) : 0;
  const [imgErr, setImgErr] = React.useState(false);
  const RANK_C = [T.teal, T.coral, T.violet];
  const rc = RANK_C[rank] || T.teal;

  // Supporter-Avatare
  const AVTS = ["https://i.pravatar.cc/28?img=1","https://i.pravatar.cc/28?img=5","https://i.pravatar.cc/28?img=12"];

  return (
    <div id={`project-${p.id}`}
      onClick={() => onOpen && onOpen(p)}
      style={{
        background:T.surfaceHi, borderRadius:24, overflow:"hidden",
        boxShadow:S.card, border:`1px solid ${T.line}`,
        animation:"ipFade 0.38s ease both", animationDelay:`${rank*0.08}s`,
        cursor: onOpen ? "pointer" : "default",
      }}>
      {/* Bild — gross */}
      <div style={{ position:"relative", height:180, overflow:"hidden",
        background:`${accent}12` }}>
        {p.img && !imgErr
          ? <img loading="lazy" decoding="async" src={p.img} alt={p.name} onError={() => setImgErr(true)}
              style={{ width:"100%", height:"100%", objectFit:"cover",
                filter:"saturate(0.85) brightness(0.92)" }}/>
          : <div style={{ width:"100%", height:"100%", display:"flex",
              alignItems:"center", justifyContent:"center", fontSize:56 }}>{p.icon||"🌱"}</div>
        }
        {/* Rang-Badge */}
        <div style={{ position:"absolute", top:14, left:14, width:30, height:30,
          borderRadius:"50%", background:rc, display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:14, fontWeight:900, color:"white",
          boxShadow:`0 2px 10px ${rc}55` }}>{rank+1}</div>
        {/* Kategorie */}
        <div style={{ position:"absolute", top:14, right:14,
          background:"rgba(255,252,248,0.92)", backdropFilter:"blur(10px)",
          border:"1px solid rgba(255,255,255,0.85)", borderRadius:99, padding:"4px 11px" }}>
          <span style={{ fontSize:9, color:T.ink2, fontWeight:750,
            letterSpacing:"0.08em", textTransform:"uppercase" }}>{p.category}</span>
        </div>
        {/* Gradient nach unten */}
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to top,rgba(255,255,255,0.9) 0%,transparent 46%)",
          pointerEvents:"none" }}/>
      </div>

      {/* Body */}
      <div style={{ padding:"16px 20px 20px" }}>
        <h3 style={{ margin:"0 0 8px", fontSize:19, fontWeight:820, color:T.ink,
          letterSpacing:"-0.02em", lineHeight:1.2 }}>{p.name}</h3>

        {p.description && (
          <p style={{ margin:"0 0 14px", fontSize:13, color:T.ink2, lineHeight:1.65,
            display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {p.description}
          </p>
        )}

        {/* Finanzierung + Stimmen */}
        <div style={{ display:"flex", justifyContent:"space-between",
          fontSize:12, color:T.muted, marginBottom:8 }}>
          <span>€{fundedEur.toLocaleString('de-DE')} von €{goalEur.toLocaleString('de-DE')} finanziert</span>
          <span><b style={{ color:T.ink }}>{p.votes||0}</b> Stimmen</span>
        </div>

        {/* Finanzierungsbalken */}
        <div style={{ height:5, borderRadius:99, background:"rgba(0,0,0,0.07)",
          overflow:"hidden", marginBottom:14 }}>
          <div style={{ height:"100%", borderRadius:99,
            width:`${fundPct}%`, minWidth:fundPct>0?6:0,
            background:`linear-gradient(90deg,${accent},${accent}BB)`,
            transition:"width 1.4s cubic-bezier(0.22,1,0.36,1)" }}/>
        </div>

        {/* Supporter-Zeile */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
          <div style={{ display:"flex" }}>
            {AVTS.map((av,j) => (
              <img loading="lazy" decoding="async" key={j} src={av} alt="" style={{ width:22, height:22, borderRadius:"50%",
                border:"1.5px solid white", marginLeft:j>0?-7:0, objectFit:"cover" }}/>
            ))}
          </div>
          <span style={{ fontSize:11, color:T.muted }}>
            {(p.votes||0) > 0
              ? `${p.votes} ${p.votes === 1 ? "Mensch möchte" : "Menschen möchten"} dieses Projekt ermöglichen`
              : "Sei der Erste, der unterstützt"}
          </span>
        </div>

        {/* Emotionale Wirkungsleiste — Menschen, Anteil, Restbetrag */}
        <div style={{
          display:"flex", alignItems:"stretch", gap:0,
          background:`${accent}08`, borderRadius:14,
          border:`1px solid ${accent}18`, marginBottom:14,
          overflow:"hidden",
        }}>
          {[
            {
              top: `${p.votes||0} Stimmen`,
              bot: "für dieses Projekt",
              accent,
            },
            {
              top: `€${fundedEur.toLocaleString('de-DE')}`,
              bot: "bereits finanziert",
              accent,
            },
            {
              top: `Noch €${Math.max(0,goalEur-fundedEur).toLocaleString('de-DE')}`,
              bot: "bis Ziel",
              accent,
            },
          ].map((stat, si) => (
            <div key={si} style={{
              flex:1, padding:"9px 8px", textAlign:"center",
              borderRight: si < 2 ? `1px solid ${accent}15` : "none",
            }}>
              <div style={{ fontSize:11, fontWeight:800, color:T.ink,
                lineHeight:1.25, marginBottom:2 }}>{stat.top}</div>
              <div style={{ fontSize:9, color:T.muted, lineHeight:1.3 }}>{stat.bot}</div>
            </div>
          ))}
        </div>

        {/* Vote Button — groß + premium */}
        <button onClick={(e) => { e.stopPropagation(); !voted && onVote(p.id); }} className="ip-p"
          disabled={voted} style={{
            width:"100%", borderRadius:18, padding:"14px 0",
            cursor: voted ? "default" : "pointer",
            background: voted
              ? `linear-gradient(135deg,${accent}12,${accent}06)`
              : `linear-gradient(135deg,${accent},${accent}CC)`,
            color: voted ? accent : "white",
            border: voted ? `1.5px solid ${accent}30` : "none",
            fontSize:14, fontWeight:750, letterSpacing:"-0.01em",
            boxShadow: voted ? "none" : S.btn(accent),
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            transition:"all 0.22s ease",
          }}>
          <span style={{ fontSize:16 }}>{voted ? "✓" : "🩷"}</span>
          <span>{voted ? "Deine Stimme zählt" : "Mit 1 Stimme unterstützen"}</span>
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 4. STIMMEN — PERSÖNLICH + WARM
// ════════════════════════════════════════════════════════════════
