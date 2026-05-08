// WirkerCreateSheet.jsx
// Der Wirker-Plus-Button öffnet dieses Sheet.
// Ruhig. Cinematic. Kein Instagram Create.
import React, { useState } from "react";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealGlow:"rgba(22,215,197,0.22)",
  coral:"#FF8A6B", coral2:"#FF7B72", coralGlow:"rgba(255,138,107,0.20)",
  gold:"#F5A623", warm:"#FFF9F4", card:"#FFFFFF",
  ink:"#1A1A1A", muted:"#888", border:"rgba(0,0,0,0.06)",
};

const CSS = `
  @keyframes cs-up{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
  @keyframes cs-bg{from{opacity:0}to{opacity:1}}
  @keyframes cs-pop{0%{transform:scale(0.9);opacity:0}65%{transform:scale(1.03)}100%{transform:scale(1);opacity:1}}
  .cs-tap{transition:transform .17s cubic-bezier(.34,1.4,.64,1);-webkit-tap-highlight-color:transparent}
  .cs-tap:active{transform:scale(.96)}
`;

const OPTIONS = [
  {
    key:"werk",
    icon:"🎨",
    bg:`linear-gradient(135deg,rgba(245,166,35,0.14),rgba(245,166,35,0.05))`,
    border:"rgba(245,166,35,0.3)",
    accent:"#F5A623",
    label:"Werk erstellen",
    sub:"Fotos, Handwerk, Kunst, Digitales",
    delay:"0.08s",
  },
  {
    key:"experience",
    icon:"✨",
    bg:`linear-gradient(135deg,rgba(22,215,197,0.12),rgba(22,215,197,0.04))`,
    border:"rgba(22,215,197,0.28)",
    accent:"#16D7C5",
    label:"Experience anbieten",
    sub:"Sessions, Coaching, Events, Vor Ort",
    delay:"0.14s",
  },
  {
    key:"story",
    icon:"📸",
    bg:`linear-gradient(135deg,rgba(255,138,107,0.12),rgba(255,138,107,0.04))`,
    border:"rgba(255,138,107,0.28)",
    accent:"#FF8A6B",
    label:"Moment teilen",
    sub:"Fotos, Videos, Einblicke in deine Welt",
    delay:"0.20s",
  },
];

export default function WirkerCreateSheet({ onClose, onSelect }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:500 }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <style>{CSS}</style>

      {/* Backdrop */}
      <div style={{ position:"absolute", inset:0,
        background:"rgba(10,10,10,0.48)",
        backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)",
        animation:"cs-bg 0.25s both" }}
        onClick={onClose}/>

      {/* Sheet */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        background:C.warm,
        borderRadius:"28px 28px 0 0",
        padding:"10px 22px max(40px,env(safe-area-inset-bottom,40px))",
        animation:"cs-up 0.38s cubic-bezier(0.22,1,0.36,1) both",
        boxShadow:"0 -4px 40px rgba(0,0,0,0.12)" }}>

        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center",
          padding:"10px 0 18px" }}>
          <div style={{ width:38, height:4, borderRadius:999,
            background:"rgba(0,0,0,0.10)" }}/>
        </div>

        {/* Title */}
        <div style={{ marginBottom:22 }}>
          <div style={{ fontWeight:900, fontSize:20, color:C.ink,
            letterSpacing:-0.4, marginBottom:4 }}>
            Was möchtest du erschaffen?
          </div>
          <div style={{ fontSize:13, color:C.muted }}>
            Teile etwas das dir bedeutet.
          </div>
        </div>

        {/* Options */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {OPTIONS.map((opt, i) => (
            <button key={opt.key} onClick={() => onSelect(opt.key)}
              className="cs-tap"
              style={{ width:"100%", textAlign:"left",
                background:opt.bg,
                border:`1.5px solid ${opt.border}`,
                borderRadius:22, padding:"18px 18px",
                cursor:"pointer", fontFamily:"inherit",
                display:"flex", alignItems:"center", gap:16,
                animation:`cs-pop 0.4s ${opt.delay} both`,
                boxShadow:"0 2px 14px rgba(0,0,0,0.04)" }}>
              <div style={{ width:50, height:50, borderRadius:16,
                background:`${opt.accent}18`,
                border:`1px solid ${opt.accent}30`,
                display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:24, flexShrink:0 }}>
                {opt.icon}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:16, color:C.ink,
                  letterSpacing:-0.2, marginBottom:3 }}>
                  {opt.label}
                </div>
                <div style={{ fontSize:12.5, color:C.muted,
                  lineHeight:1.4 }}>{opt.sub}</div>
              </div>
              <span style={{ color:"rgba(0,0,0,0.18)", fontSize:18 }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
