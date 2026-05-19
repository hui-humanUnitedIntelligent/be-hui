// components/creator-profile/CreatorFloatingActions.jsx
// Floating glass action bar — Creator quick actions

import React from "react";

const C = { teal:"#16D7C5", coral:"#FF8A6B", ink:"#1A1A1A", cream:"#F9F7F4" };

const ACTIONS = [
  { key:"studio",    label:"Creator Studio", emoji:"🎛️" },
  { key:"werk",      label:"Neues Werk",      emoji:"✦"  },
  { key:"erlebnis",  label:"Erlebnis",        emoji:"🌟" },
  { key:"community", label:"Community",       emoji:"🫂" },
];

export default function CreatorFloatingActions({ onAction }) {
  return (
    <div style={{
      position:"sticky", bottom:0, left:0, right:0,
      padding:"12px 16px max(20px, env(safe-area-inset-bottom, 20px))",
      background:"rgba(249,247,244,0.92)",
      backdropFilter:"blur(24px)",
      WebkitBackdropFilter:"blur(24px)",
      borderTop:"1px solid rgba(0,0,0,0.06)",
    }}>
      <div style={{ display:"flex", gap:10 }}>
        {ACTIONS.map(a => (
          <button
            key={a.key}
            onClick={() => onAction?.(a.key)}
            style={{
              flex:1, display:"flex", flexDirection:"column",
              alignItems:"center", gap:4,
              padding:"10px 6px",
              background:"white",
              borderRadius:16,
              border:"1px solid rgba(0,0,0,0.06)",
              boxShadow:"0 2px 10px rgba(0,0,0,0.05)",
              cursor:"pointer",
              transition:"transform 0.15s ease, box-shadow 0.15s ease",
              WebkitTapHighlightColor:"transparent",
              touchAction:"manipulation",
            }}
            onTouchStart={e => e.currentTarget.style.transform="scale(0.94)"}
            onTouchEnd={e => e.currentTarget.style.transform="scale(1)"}
          >
            <span style={{ fontSize:20 }}>{a.emoji}</span>
            <span style={{ fontSize:10, fontWeight:600, color:C.ink, letterSpacing:0.1 }}>
              {a.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
