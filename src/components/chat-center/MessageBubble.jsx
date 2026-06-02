// chat-center/MessageBubble.jsx v2
// Cinematic message bubbles — nicht WhatsApp
// Eigene: teal ambient glow, große organic shapes
// Fremde: dark glass surface

import React from "react";
import { HUI } from "../../design/hui.design.js";

const C = { teal:HUI.COLOR.teal, teal2:HUI.COLOR.tealDeep, teal3:HUI.COLOR.tealDeep, coral:HUI.COLOR.coral };

const CSS = `
  @keyframes mb-in-own {
    from{opacity:0;transform:translateX(8px) scale(0.98);}
    to{opacity:1;transform:translateX(0) scale(1);}
  }
  @keyframes mb-in-other {
    from{opacity:0;transform:translateX(-8px) scale(0.98);}
    to{opacity:1;transform:translateX(0) scale(1);}
  }
  @keyframes mb-typing {
    0%,60%,100%{transform:translateY(0);}
    30%{transform:translateY(-4px);}
  }
`;

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});
}

/* ── Typing Indicator ── */
export function TypingBubble() {
  return (
    <div style={{
      display:"flex", justifyContent:"flex-start",
      padding:"2px 20px 10px", alignItems:"flex-end", gap:10,
    }}>
      <style>{CSS}</style>
      <div style={{
        padding:"14px 18px",
        background:"rgba(255,255,255,0.62)",
        backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
        borderRadius:"20px 20px 20px 6px",
        border:"1px solid rgba(255,255,255,0.55)",
        boxShadow:"0 4px 16px rgba(0,0,0,0.07)",
        display:"flex", gap:5, alignItems:"center",
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:7, height:7, borderRadius:"50%",
            background:"rgba(22,215,197,0.45)",
            animation:`mb-typing 1.8s ${i*0.28}s ease-in-out infinite`,
          }}/>
        ))}
      </div>
    </div>
  );
}

/* ── Haupt-Bubble ── */
export default function MessageBubble({ msg }) {
  const own = msg.own === true;

  return (
    <>
      {msg && !window.__MB_MARKER_SHOWN__ && (window.__MB_MARKER_SHOWN__=true) && false}
      <div style={{position:"fixed",top:230,right:20,zIndex:999999,background:"red",color:"white",padding:"4px 8px",fontSize:11,fontFamily:"monospace",fontWeight:700,borderRadius:4,pointerEvents:"none"}}>MessageBubble</div>
    <div style={{
      display:"flex",
      justifyContent: own ? "flex-end" : "flex-start",
      alignItems:"flex-end", gap:9,
      padding:"3px 16px 10px",
      animation: own ? "mb-in-own 0.40s cubic-bezier(0.22,1,0.36,1) both" : "mb-in-other 0.40s cubic-bezier(0.22,1,0.36,1) both",
    }}>
      <style>{CSS}</style>

      {/* Fremdes Avatar — nur wenn nicht own */}
      {!own && msg.avatar && (
        <div style={{
          width:30, height:30, borderRadius:"50%", flexShrink:0,
          background:`url(${msg.avatar}) center/cover no-repeat`,
          border:"1.5px solid rgba(255,255,255,0.8)",
          boxShadow:"0 2px 6px rgba(0,0,0,0.10)",
          marginBottom:2,
        }}/>
      )}
      {!own && !msg.avatar && (
        <div style={{
          width:30, height:30, borderRadius:"50%", flexShrink:0,
          background:`linear-gradient(135deg,${C.teal}70,${C.teal2}50)`,
          border:"1.5px solid rgba(255,255,255,0.8)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:12, color:"white", fontWeight:700, marginBottom:2,
        }}>{(msg.sender_name||"?")[0].toUpperCase()}</div>
      )}

      <div style={{ maxWidth:"72%", display:"flex", flexDirection:"column",
        alignItems: own ? "flex-end" : "flex-start", gap:4 }}>

        {/* Bubble */}
        {own ? (
          /* ── Eigene Nachricht: Teal gradient, glow ── */
          <div style={{
            padding:"14px 20px",
            background:`linear-gradient(160deg, rgba(22,215,197,0.88) 0%, rgba(17,197,183,0.92) 100%)`,
            borderRadius:"22px 22px 6px 22px",
            color:"white",
            fontSize:14.5, lineHeight:1.70,
            boxShadow:`0 4px 16px rgba(22,215,197,0.18), 0 2px 6px rgba(0,0,0,0.04)`,
            position:"relative",
          }}>
            {/* Subtle inner glow */}
            <div style={{
              position:"absolute", inset:0, borderRadius:"inherit",
              background:"linear-gradient(135deg,rgba(255,255,255,0.12) 0%,transparent 60%)",
              pointerEvents:"none",
            }}/>
            <span style={{ position:"relative" }}>{msg.text}</span>
          </div>
        ) : (
          /* ── Fremde Nachricht: Glass surface ── */
          <div style={{
            padding:"14px 20px",
            background:"rgba(255,255,255,0.68)",
            backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)",
            borderRadius:"22px 22px 22px 6px",
            border:"1px solid rgba(255,255,255,0.62)",
            color:HUI.COLOR.ink,
            fontSize:14.5, lineHeight:1.70,
            boxShadow:"0 4px 18px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
          }}>{msg.text}</div>
        )}

        {/* Meta: Zeit + Reactions */}
        <div style={{
          display:"flex", alignItems:"center", gap:7,
          flexDirection: own ? "row-reverse" : "row",
        }}>
          <span style={{ fontSize:10.5, color:"rgba(80,80,80,0.42)" }}>
            {formatTime(msg.created_at)}
          </span>
          {/* Reaktion */}
          {msg.reaction && (
            <div style={{
              fontSize:13, padding:"1px 7px",
              background:"rgba(255,255,255,0.72)",
              backdropFilter:"blur(8px)",
              borderRadius:99, border:"1px solid rgba(0,0,0,0.06)",
              boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
            }}>{msg.reaction}</div>
          )}
          {/* Kein Seen-Stress: gelesen-Haken entfernt */}
        </div>
      </div>
    </div>
  );
}