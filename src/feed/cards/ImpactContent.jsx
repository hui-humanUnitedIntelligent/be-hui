/**
 * ImpactContent.jsx — Feed-Karte für Herzensprojekte
 * FEED-GLOBAL-001 (2026-07-16)
 *
 * Zeigt: Cover, Titel, Kurzbeschreibung, Fortschrittsbalken, Rang
 */
import React from "react";

const T = {
  green:     "rgba(34,197,94,1)",
  greenSoft: "rgba(34,197,94,0.10)",
  gold:      "rgba(251,191,36,1)",
  ink:       "rgba(26,26,46,0.85)",
  sub:       "rgba(26,26,46,0.45)",
  border:    "rgba(26,26,46,0.07)",
};

const RANK_MEDAL = { 1:"🥇", 2:"🥈", 3:"🥉" };

function ProgressBar({ current, goal }) {
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:11, color:T.sub }}>Gesammelt</span>
        <span style={{ fontSize:11, color:T.green, fontWeight:700 }}>
          {pct.toFixed(0)}% · €{(current||0).toLocaleString("de-DE")}
        </span>
      </div>
      <div style={{ height:5, borderRadius:3, background:"rgba(26,26,46,0.07)", overflow:"hidden" }}>
        <div style={{
          height:"100%", borderRadius:3,
          width:`${pct}%`,
          background:`linear-gradient(90deg, ${T.green}, rgba(34,197,94,0.6))`,
        }}/>
      </div>
    </div>
  );
}

export default function ImpactContent({ item, onProfile }) {
  if (!item) return null;
  const raw   = item._raw  || {};
  const title = item.title || raw.project_name || "";
  const desc  = item.text  || raw.short_desc   || raw.problem || "";
  const cover = raw.cover_url || raw.media_urls?.[0] || null;
  const rank  = raw.rank   || null;
  const goal  = raw.funding_goal || 0;
  const curr  = raw.current_amount_eur || 0;
  const author = item.author?.name || "HUI Mitglied";
  const avatar = item.author?.avatar || null;

  return (
    <div style={{
      margin:"0 12px 14px",
      borderRadius:24,
      background:"#fff",
      border:`1px solid ${T.border}`,
      boxShadow:"0 2px 16px rgba(26,26,46,0.07)",
      overflow:"hidden",
    }}>
      {/* Cover */}
      {cover && (
        <div style={{ width:"100%", paddingTop:"50%", position:"relative", background:"rgba(26,26,46,0.04)" }}>
          <img src={cover} alt={title} loading="lazy" decoding="async"
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}
            onError={e => { e.currentTarget.parentElement.style.display="none"; }}
          />
          <div style={{
            position:"absolute", top:10, left:10,
            background:T.green, color:"#fff",
            fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:20,
          }}>
            {rank && RANK_MEDAL[rank] ? `${RANK_MEDAL[rank]} Top-${rank}` : "Herzensprojekt"}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding:"14px 16px 0", display:"flex", gap:10, alignItems:"center" }}>
        <div
          onClick={() => onProfile?.()}
          style={{
            width:40, height:40, borderRadius:14, flexShrink:0, overflow:"hidden",
            background:T.greenSoft, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}
        >
          {avatar
            ? <img src={avatar} alt={author} loading="lazy"
                style={{ width:"100%", height:"100%", objectFit:"cover" }}
                onError={e=>{ e.currentTarget.style.display="none"; }}
              />
            : <span style={{ fontSize:18 }}>💚</span>
          }
        </div>
        <div>
          <div onClick={() => onProfile?.()} style={{ fontSize:13, fontWeight:700, color:T.ink, cursor:"pointer" }}>
            {author}
          </div>
          <div style={{ fontSize:11, color:T.sub }}>Herzensprojekt</div>
        </div>
        {!cover && (
          <div style={{
            marginLeft:"auto",
            background:T.green, color:"#fff",
            fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:20,
          }}>💚 Projekt</div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding:"10px 16px 14px" }}>
        {title && (
          <div style={{ fontSize:15, fontWeight:700, color:T.ink, marginBottom:4, lineHeight:1.35 }}>
            {title}
          </div>
        )}
        {desc && (
          <div style={{
            fontSize:13, color:T.sub, lineHeight:1.6,
            overflow:"hidden", display:"-webkit-box",
            WebkitLineClamp:3, WebkitBoxOrient:"vertical",
            marginBottom:10,
          }}>
            {desc}
          </div>
        )}
        {goal > 0 && <ProgressBar current={curr} goal={goal} />}
      </div>
    </div>
  );
}
