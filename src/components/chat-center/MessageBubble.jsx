// components/chat-center/MessageBubble.jsx
// Einzelne Nachricht — HUI Ästhetik, keine WhatsApp-Optik

import React from "react";

const C = { teal:"#16D7C5", teal2:"#11C5B7", coral:"#FF8A6B", muted:"rgba(80,80,80,0.5)" };

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("de-DE", { hour:"2-digit", minute:"2-digit" });
}

export default function MessageBubble({ msg }) {
  const own = msg.own === true;
  return (
    <div style={{
      display:"flex",
      justifyContent: own ? "flex-end" : "flex-start",
      marginBottom:10, padding:"0 16px",
    }}>
      <div style={{
        maxWidth:"74%",
        padding:"11px 15px",
        borderRadius: own ? "20px 20px 5px 20px" : "20px 20px 20px 5px",
        background: own
          ? `linear-gradient(135deg,${C.teal} 0%,${C.teal2} 100%)`
          : "rgba(255,255,255,0.82)",
        backdropFilter: own ? "none" : "blur(12px)",
        color: own ? "white" : "#1A1A1A",
        fontSize:14.5, lineHeight:1.55,
        boxShadow: own
          ? `0 4px 14px rgba(22,215,197,0.28)`
          : "0 2px 10px rgba(0,0,0,0.07)",
        border: own ? "none" : "1px solid rgba(255,255,255,0.65)",
      }}>
        <div>{msg.text}</div>
        <div style={{
          fontSize:10.5, marginTop:5, textAlign:"right",
          color: own ? "rgba(255,255,255,0.65)" : C.muted,
        }}>{formatTime(msg.created_at)}</div>
      </div>
    </div>
  );
}
