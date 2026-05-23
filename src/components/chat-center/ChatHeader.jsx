// chat-center/ChatHeader.jsx
// Screenshot-exact: Zurück ← | Avatar | Name + Talent + Mood | ··· | ☎
// Glassmorphism header, cinematic

import React from "react";
import { HUI } from "../../design/hui.design.js";

const C = { teal:HUI.COLOR.teal, teal2:HUI.COLOR.tealDeep, ink:HUI.COLOR.ink, muted:"rgba(80,80,80,0.55)" };

export default function ChatHeader({ conv, onBack }) {
  const name   = conv?.name   || "Gespräch";
  const talent = conv?.talent || conv?.type || "Kreative:r";
  const mood   = conv?.mood   || "Gerade kreativ im Studio";
  const online = conv?.online ?? true;
  const avatar = conv?.avatar_url;
  const initials = name[0]?.toUpperCase() || "?";

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:11,
      padding:"max(50px,env(safe-area-inset-top,50px)) 16px 14px",
      background:"rgba(242,244,248,0.90)",
      backdropFilter:"blur(28px) saturate(1.8)",
      WebkitBackdropFilter:"blur(28px) saturate(1.8)",
      borderBottom:"1px solid rgba(22,215,197,0.10)",
      position:"relative", zIndex:2, flexShrink:0,
    }}>
      {/* ← Zurück */}
      <button onClick={onBack} style={{
        width:36, height:36, borderRadius:"50%", flexShrink:0,
        background:"rgba(255,255,255,0.70)",
        border:"1px solid rgba(22,215,197,0.15)",
        backdropFilter:"blur(12px)",
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", color:C.teal, fontSize:17,
        WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
      }}>←</button>

      {/* Avatar */}
      <div style={{ position:"relative", flexShrink:0 }}>
        <div style={{
          width:42, height:42, borderRadius:"50%",
          background: avatar ? `url(${avatar}) center/cover no-repeat`
            : `linear-gradient(135deg,${C.teal}90,${C.teal2}70)`,
          border:"2px solid rgba(255,255,255,0.9)",
          boxShadow:"0 3px 12px rgba(0,0,0,0.12)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:16, color:"white", fontWeight:700,
        }}>{!avatar && initials}</div>
        {/* Kein aggressiver Online-Punkt — Presence im Mood-Label */}
      </div>

      {/* Name + Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontSize:15.5, fontWeight:800, color:C.ink,
          letterSpacing:-0.3, lineHeight:1.2,
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
        }}>{name}</div>
        <div style={{
          display:"flex", alignItems:"center", gap:6, marginTop:2, flexWrap:"wrap",
        }}>
          <span style={{ fontSize:12, color:C.muted }}>{talent}</span>
          {talent && mood && <span style={{ fontSize:10, color:"rgba(0,0,0,0.20)" }}>·</span>}
          {mood && (
            <span style={{
              fontSize:12, color:"rgba(22,215,197,0.85)", fontWeight:500,
              display:"flex", alignItems:"center", gap:4,
            }}>
              <span style={{ fontSize:10 }}>✦</span>{mood}
            </span>
          )}
        </div>
      </div>

      {/* ··· Button */}
      <button style={{
        width:34, height:34, borderRadius:"50%",
        background:"rgba(255,255,255,0.65)", border:"1px solid rgba(0,0,0,0.07)",
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", flexShrink:0, letterSpacing:1.5,
        fontSize:14, color:C.muted,
        WebkitTapHighlightColor:"transparent",
        transition:"opacity 0.2s ease",
      }}>···</button>

      {/* Telefon */}
      <button style={{
        width:34, height:34, borderRadius:"50%",
        background:"rgba(255,255,255,0.65)", border:"1px solid rgba(0,0,0,0.07)",
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", flexShrink:0,
        WebkitTapHighlightColor:"transparent",
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
            stroke={C.teal} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
