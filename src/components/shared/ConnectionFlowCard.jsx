// src/components/shared/ConnectionFlowCard.jsx — Phase 2.5
// Contextual bridge card that surfaces connections between entities.
// ══════════════════════════════════════════════════════════════════

import React from "react";

const T = {
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  tealMid:  "rgba(14,196,184,0.20)",
  coral:    "#FF6B52",
  ink:      "#0F1117",
  inkSoft:  "rgba(15,17,23,0.55)",
  inkFaint: "rgba(15,17,23,0.30)",
  bg:       "#FFFFFF",
  border:   "rgba(15,17,23,0.07)",
  r16: 16, r99: 99,
  cardShadow: "0 2px 12px rgba(15,17,23,0.06)",
};

function MiniAvatars({ avatars = [], max = 3 }) {
  return (
    <div style={{ display:"flex" }}>
      {avatars.slice(0, max).map((av, i) => (
        <img key={i} src={av} alt=""
          style={{ width:22,height:22,borderRadius:"50%",border:"2px solid white",objectFit:"cover",marginLeft:i===0?0:-7 }}
          onError={e=>{e.target.style.display="none";}}
        />
      ))}
    </div>
  );
}

export default function ConnectionFlowCard({ type, title, subtitle, emoji, avatars=[], value, valueColor=T.teal, onPress, style: sx }) {
  return (
    <div onClick={onPress} style={{
      display:"flex",alignItems:"center",gap:12,
      background:T.bg,border:`1px solid ${T.tealMid}`,
      borderRadius:T.r16,padding:"12px 14px",
      boxShadow:T.cardShadow,
      cursor:onPress?"pointer":"default",
      touchAction:"manipulation",
      ...sx,
    }}>
      {emoji && (
        <div style={{width:36,height:36,borderRadius:10,background:T.tealSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{emoji}</div>
      )}
      {avatars.length>0&&!emoji&&<div style={{flexShrink:0}}><MiniAvatars avatars={avatars}/></div>}
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12.5,fontWeight:700,color:T.ink,lineHeight:1.3}}>{title}</div>
        {subtitle&&<div style={{fontSize:11,color:T.inkSoft,marginTop:2}}>{subtitle}</div>}
      </div>
      {value&&<div style={{fontSize:13,fontWeight:800,color:valueColor,flexShrink:0}}>{value}</div>}
      {onPress&&<div style={{fontSize:14,color:T.inkFaint,flexShrink:0}}>›</div>}
    </div>
  );
}

export function SharedValuesCard({ values=[], onPress }) {
  if (!values.length) return null;
  return <ConnectionFlowCard emoji="✦" title={`${values.length} gemeinsame Werte`} subtitle={values.slice(0,3).join(" · ")} value={`${values.length}`} onPress={onPress}/>;
}

export function EncounterSuggestionCard({ encounter, onPress }) {
  if (!encounter) return null;
  return <ConnectionFlowCard emoji={encounter.emoji||"🌿"} title={encounter.title} subtitle={`${encounter.date} · ${encounter.spotsLeft} Plätze frei`} value="Begegnung →" valueColor={T.coral} onPress={onPress}/>;
}

export function SharedFollowersCard({ count, avatars, onPress }) {
  if (!count||count<2) return null;
  return <ConnectionFlowCard avatars={avatars} title={`${count} deiner Verbindungen folgen`} subtitle="Ihr bewegt euch in ähnlichen Welten" onPress={onPress}/>;
}

export function ImpactBridgeCard({ project, amount, onPress }) {
  if (!project) return null;
  return <ConnectionFlowCard emoji="🌱" title={project.title||"Impact Projekt"} subtitle={`€${amount||0} Wirkung gemeinsam erzeugt`} value="Projekt →" valueColor="#16A34A" onPress={onPress}/>;
}
