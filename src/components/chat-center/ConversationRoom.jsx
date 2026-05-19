// components/chat-center/ConversationRoom.jsx
// Einzelner Chat-Raum — cinematic, ruhig
// Öffnet sich über ConversationList wenn conv angetippt

import React, { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble.jsx";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", coral:"#FF8A6B",
  ink:"#1A1A1A", muted:"rgba(80,80,80,0.52)", cream:"#F9F7F4",
};

// Repräsentative Mock-Nachrichten
function getMockMessages(conv) {
  const base = new Date(Date.now() - 3600000);
  return [
    { id:1, text:"Hey, deine letzte Story hat mich wirklich ber\u00fchrt.", own:false, created_at: new Date(base.getTime()+0).toISOString() },
    { id:2, text:"Das freut mich sehr \u2014 ich wollte etwas Echtes zeigen.", own:true,  created_at: new Date(base.getTime()+120000).toISOString() },
    { id:3, text:"Magst du mal bei einem meiner Workshops vorbeikommen?",    own:false, created_at: new Date(base.getTime()+240000).toISOString() },
    { id:4, text:"Sehr gerne! Wann ist der n\u00e4chste?",                   own:true,  created_at: new Date(base.getTime()+360000).toISOString() },
    { id:5, text:conv?.last_message || "Danke f\u00fcr deine Resonanz.",     own:false, created_at: new Date(Date.now()-120000).toISOString() },
  ];
}

export default function ConversationRoom({ conv, onBack }) {
  const [text, setText]   = useState("");
  const [msgs, setMsgs]   = useState(() => getMockMessages(conv));
  const endRef             = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  function sendMsg() {
    if (!text.trim()) return;
    setMsgs(m => [...m, {
      id: Date.now(), text: text.trim(), own:true,
      created_at: new Date().toISOString(),
    }]);
    setText("");
  }

  const avatarBg = conv?.avatar_url
    ? `url(${conv.avatar_url}) center/cover no-repeat`
    : `linear-gradient(135deg,${C.teal}80,${C.coral}60)`;

  return (
    <div style={{
      position:"absolute", inset:0, background:C.cream,
      display:"flex", flexDirection:"column", zIndex:2,
    }}>
      {/* ── Header ── */}
      <div style={{
        display:"flex", alignItems:"center", gap:12,
        padding:"16px 16px 14px",
        background:"rgba(249,247,244,0.92)",
        backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
        borderBottom:"1px solid rgba(0,0,0,0.07)",
        flexShrink:0,
      }}>
        <button onClick={onBack} style={{
          width:36, height:36, borderRadius:"50%",
          background:"rgba(22,215,197,0.10)",
          border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:17, color:C.teal,
          WebkitTapHighlightColor:"transparent",
        }}>←</button>

        <div style={{
          width:40, height:40, borderRadius:"50%",
          background:avatarBg, flexShrink:0,
          border:"2px solid rgba(255,255,255,0.9)",
          boxShadow:"0 2px 8px rgba(0,0,0,0.10)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:16, color:"white", fontWeight:700,
        }}>
          {!conv?.avatar_url && (conv?.name||"?")[0].toUpperCase()}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.ink }}>{conv?.name}</div>
          <div style={{ fontSize:11.5, color:C.teal, fontWeight:500 }}>Gerade kreativ</div>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="hui-scroll" style={{
        flex:1, overflowY:"auto", paddingTop:16, paddingBottom:8,
      }}>
        {msgs.map(m => <MessageBubble key={m.id} msg={m}/>)}
        <div ref={endRef}/>
      </div>

      {/* ── Input ── */}
      <div style={{
        display:"flex", gap:10, alignItems:"flex-end",
        padding:"10px 16px max(16px, env(safe-area-inset-bottom,16px))",
        background:"rgba(249,247,244,0.94)",
        backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
        borderTop:"1px solid rgba(0,0,0,0.07)",
        flexShrink:0,
      }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); }}}
          placeholder="Schreib etwas R\u00e4ume-\u00d6ffnendes\u2026"
          rows={1}
          style={{
            flex:1, resize:"none", border:"1.5px solid rgba(22,215,197,0.20)",
            borderRadius:22, padding:"10px 14px",
            fontSize:14, lineHeight:1.5,
            background:"rgba(255,255,255,0.80)",
            outline:"none", color:C.ink,
            fontFamily:"inherit",
            maxHeight:100, overflowY:"auto",
          }}
        />
        <button
          onClick={sendMsg}
          disabled={!text.trim()}
          style={{
            width:42, height:42, borderRadius:"50%",
            background: text.trim()
              ? `linear-gradient(135deg,${C.teal},${C.teal2})`
              : "rgba(0,0,0,0.08)",
            border:"none", cursor: text.trim() ? "pointer" : "default",
            display:"flex", alignItems:"center", justifyContent:"center",
            flexShrink:0, transition:"background 0.2s",
            boxShadow: text.trim() ? "0 4px 12px rgba(22,215,197,0.30)" : "none",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="white" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
