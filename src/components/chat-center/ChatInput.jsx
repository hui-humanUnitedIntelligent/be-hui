// chat-center/ChatInput.jsx
// Screenshot-exact: + | Nachricht schreiben... | Emoji | Mikro
// Floating glass surface, teal send glow

import React, { useRef } from "react";

const C = { teal:"#16D7C5", teal2:"#11C5B7", muted:"rgba(80,80,80,0.45)" };

export default function ChatInput({ onSend, placeholder = "Schreib etwas Echtes\u2026" }) {
  const [text, setText] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const textRef = useRef(null);

  function send() {
    if (!text.trim()) return;
    onSend?.(text.trim());
    setText("");
    textRef.current?.focus();
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const hasTeal = !!text.trim();

  return (
    <div style={{
      padding:"10px 14px max(18px,env(safe-area-inset-bottom,18px))",
      background:"rgba(242,244,248,0.88)",
      backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
      borderTop:"1px solid rgba(22,215,197,0.10)",
      flexShrink:0, position:"relative", zIndex:2,
    }}>
      <div style={{
        display:"flex", alignItems:"flex-end", gap:10,
      }}>
        {/* + Button */}
        <button style={{
          width:38, height:38, borderRadius:"50%", flexShrink:0,
          background:"rgba(255,255,255,0.75)",
          border:"1px solid rgba(0,0,0,0.08)",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", color:C.muted, fontSize:18, fontWeight:300,
          WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
          boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
        }}>+</button>

        {/* Text Area */}
        <div style={{
          flex:1,
          background: focused ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.70)",
          border: focused
            ? "1.5px solid rgba(22,215,197,0.35)"
            : "1.5px solid rgba(0,0,0,0.07)",
          borderRadius:22, padding:"10px 14px",
          display:"flex", alignItems:"center", gap:8,
          boxShadow: focused
            ? "0 0 0 3px rgba(22,215,197,0.10), 0 4px 14px rgba(0,0,0,0.06)"
            : "0 2px 8px rgba(0,0,0,0.05)",
          transition:"border 0.32s ease, box-shadow 0.32s ease, background 0.28s ease",
          backdropFilter:"blur(12px)",
        }}>
          <textarea
            ref={textRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            rows={1}
            style={{
              flex:1, border:"none", background:"none", outline:"none",
              fontSize:14.5, lineHeight:1.55, color:"#1A1A1A",
              fontFamily:"inherit", resize:"none",
              maxHeight:100, overflowY:"auto",
              WebkitOverflowScrolling:"touch",
            }}
          />
          {/* Emoji */}
          <button style={{
            flexShrink:0, background:"none", border:"none",
            cursor:"pointer", fontSize:19, padding:0, lineHeight:1,
            WebkitTapHighlightColor:"transparent",
          }}>✦</button>
        </div>

        {/* Send / Mikro */}
        <button
          onClick={send}
          style={{
            width:42, height:42, borderRadius:"50%", flexShrink:0,
            background: hasTeal
              ? `linear-gradient(135deg,${C.teal} 0%,${C.teal2} 100%)`
              : "rgba(255,255,255,0.75)",
            border: hasTeal ? "none" : "1px solid rgba(0,0,0,0.08)",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor: hasTeal ? "pointer" : "default",
            boxShadow: hasTeal
              ? "0 4px 14px rgba(22,215,197,0.24), 0 2px 5px rgba(0,0,0,0.04)"
              : "0 2px 8px rgba(0,0,0,0.06)",
            transition:"background 0.2s, box-shadow 0.2s",
            WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
          }}
        >
          {hasTeal ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke={C.teal} strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke={C.teal} strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="12" y1="19" x2="12" y2="23" stroke={C.teal} strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="8" y1="23" x2="16" y2="23" stroke={C.teal} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
