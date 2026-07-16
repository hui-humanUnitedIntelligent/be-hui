import React, { useState } from "react";
import { T } from "../tokens.js";
import { HUIImpactIcon } from "../../../../design/icons/HuiSystemIcons.jsx";

export function ProjektCard({ projekt, delay=0, onPress }) {
  const [imgErr, setImgErr] = useState(false);
  const cover = (!imgErr && projekt.cover) ? projekt.cover : null;
  const cc = projekt.catColor || { bg:T.tealSoft, text:T.teal };

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={() => onPress?.(projekt)} style={{
      width:160, flexShrink:0,
      borderRadius:18, overflow:"hidden",
      background:T.white, boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
    }}>
      {/* Cover */}
      <div style={{ width:"100%", height:90, position:"relative", overflow:"hidden", background:cover?"#000":cc.bg }}>
        {cover ? (
          <img loading="lazy" decoding="async" src={cover} alt={projekt.title} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", opacity:0.82 }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:28, opacity:0.4 }}>🌍</span>
          </div>
        )}
        {/* Category badge */}
        <div style={{
          position:"absolute", top:7, left:7,
          background:"rgba(255,255,255,0.90)", backdropFilter:"blur(6px)",
          borderRadius:99, padding:"2px 8px",
          fontSize:9, fontWeight:700, color:cc.text,
        }}>
          {projekt.cat}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding:"10px 10px 11px" }}>
        <div style={{
          fontSize:12.5, fontWeight:700, color:T.ink, marginBottom:4,
          letterSpacing:"-0.02em", lineHeight:1.25,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:1, WebkitBoxOrient:"vertical",
        }}>
          {projekt.title}
        </div>
        <div style={{
          fontSize:10.5, color:T.inkSoft, lineHeight:1.4, marginBottom:9,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:2, WebkitBoxOrient:"vertical",
        }}>
          {projekt.desc}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <HUIPersonenIcon size={11} style={{flexShrink:0}} />
          <span style={{ fontSize:10.5, fontWeight:600, color:T.inkSoft }}>{projekt.members} Mitglieder</span>
        </div>
      </div>
    </div>
  );
}

