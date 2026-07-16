// chat-center/ChatHeader.jsx v2
// Avatar tap → Profil öffnen | ··· → Kontext-Menu
// Phase 23: echte Verbindungen — kein dekorativer Header mehr

import React, { useState } from "react";
import { HUI } from "../../design/hui.design.js";
import { formatPresence } from "../../lib/usePresence.js";

const C = { teal:HUI.COLOR.teal, teal2:HUI.COLOR.tealDeep, ink:HUI.COLOR.ink, muted:"rgba(80,80,80,0.55)" };

export default function ChatHeader({ conv, onBack, onOpenProfile, onCloseChat }) {
  const name     = conv?.name   || "Gespräch";
  const talent   = conv?.talent || conv?.type || "Kreative:r";
  const mood     = conv?.mood   || "Gerade kreativ im Studio";
  const avatar   = conv?.avatar_url;
  const initials = name[0]?.toUpperCase() || "?";
  const presence = formatPresence(conv?.other_profile?.last_seen_at || conv?.last_seen_at);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleAvatarTap = () => {
    if (onOpenProfile) onOpenProfile(conv);
  };

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
        background:"rgba(255,255,255,0.70)", border:"1px solid rgba(22,215,197,0.15)",
        backdropFilter:"blur(12px)", display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", color:C.teal, fontSize:17,
        WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
      }}>←</button>

      {/* Avatar — tappable → Profil */}
      <button
        onClick={handleAvatarTap}
        style={{
          position:"relative", flexShrink:0,
          background:"none", border:"none", padding:0, cursor:"pointer",
          WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
        }}
      >
        <div style={{
          width:42, height:42, borderRadius:"50%",
          background: avatar ? `url(${avatar}) center/cover no-repeat`
            : `linear-gradient(135deg,${C.teal}90,${C.teal2}70)`,
          border:"2px solid rgba(255,255,255,0.9)",
          boxShadow:"0 3px 12px rgba(0,0,0,0.12)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:16, color:"white", fontWeight:700,
          transition:"transform 0.15s ease, box-shadow 0.15s ease",
        }}>{!avatar && initials}</div>
      </button>

      {/* Name + Info — auch tappable */}
      <button
        onClick={handleAvatarTap}
        style={{
          flex:1, minWidth:0, background:"none", border:"none", padding:0,
          cursor:"pointer", textAlign:"left",
          WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
        }}
      >
        <div style={{
          fontSize:15.5, fontWeight:800, color:C.ink,
          letterSpacing:-0.3, lineHeight:1.2,
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
        }}>{name}</div>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:2, flexWrap:"wrap" }}>
          {presence ? (
            <span style={{
              fontSize:12, display:"flex", alignItems:"center", gap:5,
              color: presence.online ? "#22c55e" : C.muted,
              fontWeight: presence.online ? 600 : 400,
            }}>
              <span style={{
                display:"inline-block", width:7, height:7, borderRadius:"50%",
                background: presence.dot, flexShrink:0,
              }}/>
              {presence.label}
            </span>
          ) : (
            <>
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
            </>
          )}
        </div>
      </button>

      {/* ··· Kontext-Menu */}
      <div style={{ position:"relative", flexShrink:0 }}>
        <button
          onClick={() => setMenuOpen(p => !p)}
          style={{
            width:34, height:34, borderRadius:"50%",
            background:"rgba(255,255,255,0.65)", border:"1px solid rgba(0,0,0,0.07)",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", letterSpacing:1.5, fontSize:14, color:C.muted,
            WebkitTapHighlightColor:"transparent", transition:"opacity 0.2s ease",
          }}>···</button>

        {/* Dropdown */}
        {menuOpen && (
          <div style={{
            position:"absolute", top:"110%", right:0, zIndex:10,
            background:"rgba(255,255,255,0.96)", backdropFilter:"blur(20px)",
            borderRadius:14, boxShadow:"0 8px 32px rgba(0,0,0,0.13)",
            border:"1px solid rgba(22,215,197,0.12)",
            minWidth:160, overflow:"hidden",
          }}>
            {onOpenProfile && (
              <button
                onClick={() => { setMenuOpen(false); onOpenProfile(conv); }}
                style={{
                  width:"100%", padding:"13px 16px", background:"none", border:"none",
                  textAlign:"left", fontSize:14, color:C.ink, cursor:"pointer",
                  borderBottom:"1px solid rgba(0,0,0,0.05)",
                  WebkitTapHighlightColor:"transparent",
                }}
              >✦ Profil ansehen</button>
            )}
            <button
              onClick={() => setMenuOpen(false)}
              style={{
                width:"100%", padding:"13px 16px", background:"none", border:"none",
                textAlign:"left", fontSize:14, color:C.muted, cursor:"pointer",
                WebkitTapHighlightColor:"transparent",
              }}
            >🗓 Termin anfragen</button>
            <button
              onClick={() => { setMenuOpen(false); onCloseChat?.(); }}
              style={{
                width:"100%", padding:"13px 16px", background:"none", border:"none",
                textAlign:"left", fontSize:14, color:"rgba(220,60,60,0.8)", cursor:"pointer",
                WebkitTapHighlightColor:"transparent",
              }}
            >✕ Schließen</button>
          </div>
        )}
      </div>

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
