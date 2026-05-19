// chat-center/MessageBubble.jsx v2
// Cinematic message bubbles — nicht WhatsApp
// Eigene: teal ambient glow, große organic shapes
// Fremde: dark glass surface

import React from "react";

const C = { teal:"#16D7C5", teal2:"#11C5B7", teal3:"#0FAAA0", coral:"#FF8A6B" };

const CSS = `
  @keyframes mb-in-own {
    from{opacity:0;transform:translateX(14px) scale(0.96);}
    to{opacity:1;transform:translateX(0) scale(1);}
  }
  @keyframes mb-in-other {
    from{opacity:0;transform:translateX(-14px) scale(0.96);}
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
            background:"rgba(22,215,197,0.65)",
            animation:`mb-typing 1.2s ${i*0.18}s ease-in-out infinite`,
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
    <div style={{
      display:"flex",
      justifyContent: own ? "flex-end" : "flex-start",
      alignItems:"flex-end", gap:9,
      padding:"3px 16px 10px",
      animation: own ? "mb-in-own 0.22s ease both" : "mb-in-other 0.22s ease both",
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
            padding:"13px 18px",
            background:`linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 55%, ${C.teal3} 100%)`,
            borderRadius:"22px 22px 6px 22px",
            color:"white",
            fontSize:14.5, lineHeight:1.60,
            boxShadow:`0 6px 22px rgba(22,215,197,0.32), 0 2px 8px rgba(0,0,0,0.06)`,
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
            padding:"13px 18px",
            background:"rgba(255,255,255,0.68)",
            backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)",
            borderRadius:"22px 22px 22px 6px",
            border:"1px solid rgba(255,255,255,0.62)",
            color:"#1A1A1A",
            fontSize:14.5, lineHeight:1.60,
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
          {/* Doppel-Haken (gelesen) */}
          {own && msg.read && (
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
              <path d="M1 5l3 3 5-6" stroke={C.teal} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 5l3 3 5-6" stroke={C.teal} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
