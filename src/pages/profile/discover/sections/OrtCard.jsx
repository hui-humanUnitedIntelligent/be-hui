import React, { useState } from "react";
import { T } from "../tokens.js";
import { HUILocationIcon } from "../../../../design/icons/HuiSystemIcons.jsx";

export function OrtCard({ ort, delay=0, onMap }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="dp-press dp-in dp-card-hover" onClick={onMap} style={{
      width:110, flexShrink:0,
      borderRadius:14, overflow:"hidden",
      background:T.white, boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
    }}>
      <div style={{ width:"100%", height:68, overflow:"hidden", position:"relative", background:T.tealSoft }}>
        {!imgErr && ort.cover ? (
          <img loading="lazy" decoding="async" src={ort.cover} alt={ort.name} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <HUILocationIcon size={24} style={{opacity:0.4, color:"rgba(14,196,184,0.5)"}} />
          </div>
        )}
        {ort.dist !== "—" && (
          <div style={{
            position:"absolute", top:5, left:5,
            background:"rgba(255,255,255,0.90)", backdropFilter:"blur(6px)",
            borderRadius:99, padding:"1px 6px",
            fontSize:9, fontWeight:700, color:T.teal,
          }}>
            {ort.dist}
          </div>
        )}
      </div>
      <div style={{ padding:"7px 8px 9px" }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.ink, marginBottom:2, lineHeight:1.25,
          overflow:"hidden", display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical" }}>
          {ort.name}
        </div>
        <div style={{ fontSize:9.5, color:T.inkFaint, fontWeight:500, marginBottom:4 }}>{ort.city}</div>
        {/* Aktivität */}
        {ort.nextEvent ? (
          <div style={{ fontSize:9, color:"#D97706", fontWeight:600, display:"flex", alignItems:"center", gap:2 }}><HUIKalenderIcon size={9}/>{ort.nextEvent}</div>
        ) : ort.active ? (
          <div style={{ display:"flex", alignItems:"center", gap:3, fontSize:9.5, color:"#22c55e", fontWeight:700 }}>
            <span style={{ display:"inline-block",width:6,height:6,borderRadius:"50%",background:"#22c55e" }}/>
            {ort.active} aktiv
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
/**
 * Gemeinsamer Umkreisfilter fuer Werke/Erlebnisse -- gleiche Logik wie der
 * bestehende Talente-Filter (siehe displayTalente unten), aber als kleine
 * Hilfsfunktion statt ein drittes Mal ausgeschrieben. isOnlineFn entscheidet,
 * ob ein Eintrag standortunabhaengig ist (bleibt dann immer sichtbar).
 */
