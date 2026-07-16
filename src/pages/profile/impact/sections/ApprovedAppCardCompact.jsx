import React from "react";
import { T } from "../tokens.js";
import { safeNum } from "../utils.js";

export function ApprovedAppCardCompact({ app, rank, onOpen }) {
  const img = app.cover_url || (app.media_urls && app.media_urls[0])
    || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=90";
  return (
    <div onClick={() => onOpen && onOpen(app)} className="ip-p"
      style={{ display:"flex", alignItems:"center", gap:12, background:"#fff",
        borderRadius:16, padding:"12px 14px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)",
        border:"1px solid rgba(13,196,181,0.10)", cursor:"pointer" }}>
      <div style={{ width:26, height:26, borderRadius:"50%", flexShrink:0,
        background:"rgba(13,196,181,0.12)", display:"flex", alignItems:"center",
        justifyContent:"center", fontSize:11, fontWeight:900, color:T.teal }}>
        {rank}
      </div>
      <div style={{ width:56, height:56, borderRadius:12, overflow:"hidden", flexShrink:0 }}>
        <img loading="lazy" decoding="async" src={img} alt={app.project_name}
          style={{ width:"100%", height:"100%", objectFit:"cover" }}
          onError={e => { e.target.src = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=90"; }} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:800, color:"#141422",
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          maxWidth:"100%" }}>
          💚 {app.project_name}
        </div>
        <div style={{ fontSize:11, color:"#888", marginTop:2,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          maxWidth:"100%" }}>
          {app.short_desc}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
          <span style={{ fontSize:10, fontWeight:700, color:"#22c55e",
            background:"rgba(34,197,94,0.10)", borderRadius:99, padding:"2px 8px",
            border:"1px solid rgba(34,197,94,0.20)" }}>✅ Bewilligt</span>
          <span style={{ fontSize:11, color: app.vote_count > 0 ? T.teal : "#aaa", fontWeight:700,
            transition:"color 0.3s ease" }}>
            🗳 {app.vote_count || 0} {app.vote_count === 1 ? "Stimme" : "Stimmen"}
          </span>
        </div>
      </div>
      <div style={{ flexShrink:0, textAlign:"right" }}>
        <div style={{ fontSize:12, fontWeight:800, color:T.teal }}>€ {(app.funding_goal||0).toLocaleString("de-DE")}</div>
        <div style={{ fontSize:10, color:"#999" }}>Ziel</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// IMPACT TIMELINE — "Impact auf einen Blick"
// Horizontale Kette: eingereicht → Prüfung → nominiert → finanziert → in Umsetzung
// ════════════════════════════════════════════════════════════════
