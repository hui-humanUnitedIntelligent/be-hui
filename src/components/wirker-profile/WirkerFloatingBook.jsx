// components/wirker-profile/WirkerFloatingBook.jsx
// Sticky floating CTA am unteren Rand

import React from "react";
import { HUI } from "../../design/hui.design.js";

const C = { teal:HUI.COLOR.teal, teal2:HUI.COLOR.tealDeep, coral:HUI.COLOR.coral, cream:HUI.COLOR.cream };

export default function WirkerFloatingBook({ profile, onBook, onFollow, followed }) {
  return (
    <div style={{
      position:"sticky", bottom:0, left:0, right:0,
      padding:"10px 20px max(20px, env(safe-area-inset-bottom, 20px))",
      background:"rgba(249,247,244,0.94)",
      backdropFilter:"blur(20px)",
      WebkitBackdropFilter:"blur(20px)",
      borderTop:"1px solid rgba(0,0,0,0.07)",
      display:"flex", gap:10,
    }}>
      <button
        onClick={onBook}
        style={{
          flex:1, height:48,
          background:`linear-gradient(135deg,${C.teal} 0%,${C.teal2} 100%)`,
          border:"none", borderRadius:99,
          color:"white", fontSize:15, fontWeight:700,
          cursor:"pointer",
          boxShadow:"0 6px 18px rgba(22,215,197,0.30)",
          WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
        }}
      >
        Begegnung anfragen
      </button>
      <button
        onClick={onFollow}
        style={{
          width:48, height:48, borderRadius:"50%",
          background: followed ? C.teal : "white",
          border:"1.5px solid " + (followed ? C.teal : "rgba(0,0,0,0.12)"),
          boxShadow:"0 2px 8px rgba(0,0,0,0.07)",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer",
          flexShrink:0,
          WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
            stroke={followed ? "white" : "rgba(80,80,80,0.6)"} strokeWidth="2"
            strokeLinecap="round"/>
          <circle cx="9" cy="7" r="4"
            stroke={followed ? "white" : "rgba(80,80,80,0.6)"} strokeWidth="2"/>
          <line x1="19" y1="8" x2="19" y2="14"
            stroke={followed ? "white" : C.teal} strokeWidth="2" strokeLinecap="round"/>
          <line x1="22" y1="11" x2="16" y2="11"
            stroke={followed ? "white" : C.teal} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
