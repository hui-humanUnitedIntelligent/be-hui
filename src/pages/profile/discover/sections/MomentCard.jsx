import React, { useState } from "react";
import { T } from "../tokens.js";
import { HUIFotoIcon } from "../../../../design/icons/HuiSystemIcons.jsx";
import { HUIHeartIcon, HUIChatIcon } from "../../../../design/icons/HuiInteractionIcons.jsx";
import { timeAgo } from "../utils.js";

export function MomentCard({ moment, delay=0, onPress }) {
  const [imgErr, setImgErr] = useState(false);
  const ago = timeAgo(moment.created_at);

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={() => onPress?.(moment)} style={{
      width:175, flexShrink:0,
      borderRadius:18, overflow:"hidden",
      background:T.white,
      display:"flex", flexDirection:"column",
      boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
      position:"relative",
    }}>
      {/* Bildbereich — feste Höhe, kein Hintergrundleck */}
      <div style={{ width:"100%", height:130, flexShrink:0, position:"relative", overflow:"hidden" }}>
        {!imgErr && moment.src ? (
          <img loading="lazy" decoding="async" src={moment.src} alt={moment.caption}
            onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", background:`linear-gradient(135deg,${T.tealSoft},${T.coralSoft})`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <HUIFotoIcon size={32} style={{opacity:0.3, color:"rgba(14,196,184,0.5)"}} />
          </div>
        )}
        {/* Gradient overlay */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.65) 100%)" }}/>
        {/* Time badge */}
        <div style={{
          position:"absolute", top:8, left:8,
          background:"rgba(0,0,0,0.55)", backdropFilter:"blur(6px)",
          borderRadius:99, padding:"3px 8px",
          fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.9)",
        }}>
          {ago}
        </div>
        {/* Live Badge — within image so position:absolute works correctly */}
        {moment.isLive && (
          <div style={{
            position:"absolute", top:8, right:8,
            background:"#E8573A", borderRadius:99, padding:"2px 7px",
            fontSize:9, fontWeight:700, color:"white", letterSpacing:".04em",
            display:"flex", alignItems:"center", gap:4,
          }}>
            <div className="dp-live-dot" style={{ width:5,height:5,borderRadius:"50%",background:"white" }}/>
            Live
          </div>
        )}
      </div>

      {/* Content-Bereich — flexGrow:1 füllt den Rest, kein Hintergrundleck */}
      <div style={{ flexGrow:1, display:"flex", flexDirection:"column", padding:"10px 11px 12px", background:T.white }}>
        {/* Caption */}
        <div style={{
          fontSize:11.5, fontWeight:600, color:T.ink, lineHeight:1.35,
          marginBottom:6,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:2, WebkitBoxOrient:"vertical",
        }}>
          {moment.caption}
        </div>
        {/* Autor */}
        <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:0 }}>
          <div style={{
            width:18, height:18, borderRadius:"50%",
            background:T.tealSoft,
            display:"flex", alignItems:"center", justifyContent:"center",
            flexShrink:0,
          }}><HUIProfilIcon size={24} style={{opacity:0.35, color:"rgba(14,196,184,0.5)"}}/></div>
          <span style={{ fontSize:10.5, fontWeight:600, color:T.inkSoft }}>{moment.name}</span>
          {moment.location && (
            <span style={{ fontSize:10, color:T.inkFaint, display:"flex", alignItems:"center", gap:2 }}>
              <HUILocationIcon size={10}/>{moment.location}
            </span>
          )}
        </div>
        {/* Engagement Row — immer am unteren Rand */}
        <div className="dp-engage" style={{ marginTop:"auto", paddingTop:8 }}>
          <span><HUIHeartIcon size={12} /> {moment.likes ?? Math.floor(4 + (moment.id?.charCodeAt?.(moment.id.length-1)??7) % 30)}</span>
          <span><HUIChatIcon size={12} /> {moment.comments ?? Math.floor(1 + (moment.id?.charCodeAt?.(0)??3) % 12)}</span>
          <span style={{display:"flex",alignItems:"center",gap:2}}><HUIImpactIcon size={12}/>{moment.wirkung ?? Math.floor(1 + (moment.id?.charCodeAt?.(1)??2) % 8)}</span>
        </div>
      </div>
    </div>
  );
}

