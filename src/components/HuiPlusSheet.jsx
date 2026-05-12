// HuiPlusSheet.jsx — Bottom Sheet für Plus-Button (Talent-Modus aktiv)
// Sauber, modern, 3 große Karten. HUI DNA beibehalten.

import React from "react";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealGlow:"rgba(22,215,197,0.22)",
  coral:"#FF8A6B", coralGlow:"rgba(255,138,107,0.18)",
  cream:"#F9F7F4", card:"#FFFFFF",
  ink:"#1A1A1A", ink2:"#3A3A3A", muted:"#888",
  border:"rgba(0,0,0,0.07)",
};

const CSS = `
  @keyframes psFadeUp {
    from { opacity:0; transform:translateY(28px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes psCardIn {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .ps-card {
    -webkit-tap-highlight-color:transparent;
    transition: transform 0.18s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.18s;
  }
  .ps-card:active { transform:scale(0.96) !important; }
`;

const OPTIONS = [
  {
    key:"moment",
    emoji:"📸",
    title:"Moment teilen",
    desc:"Foto oder Video posten",
    color:C.teal,
    bg:`linear-gradient(145deg,rgba(22,215,197,0.09),rgba(22,215,197,0.03))`,
    border:`rgba(22,215,197,0.25)`,
    shadow:`rgba(22,215,197,0.15)`,
  },
  {
    key:"werk",
    emoji:"🎨",
    title:"Werk veröffentlichen",
    desc:"Etwas verkaufen oder zeigen",
    color:"#F5A623",
    bg:`linear-gradient(145deg,rgba(245,166,35,0.09),rgba(245,166,35,0.03))`,
    border:`rgba(245,166,35,0.25)`,
    shadow:`rgba(245,166,35,0.15)`,
  },
  {
    key:"erlebnis",
    emoji:"🌟",
    title:"Erlebnis anbieten",
    desc:"Zeit, Wissen oder Sessions anbieten",
    color:"#A78BFA",
    bg:`linear-gradient(145deg,rgba(167,139,250,0.09),rgba(167,139,250,0.03))`,
    border:`rgba(167,139,250,0.25)`,
    shadow:`rgba(167,139,250,0.15)`,
  },
];

export default function HuiPlusSheet({ onSelect, onClose }) {
  return (
    <>
      <style>{CSS}</style>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position:"fixed", inset:0, zIndex:2000,
        background:"rgba(0,0,0,0.30)",
        backdropFilter:"blur(4px)",
        WebkitBackdropFilter:"blur(4px)",
      }}/>

      {/* Sheet */}
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:2001,
        background:C.card,
        borderRadius:"26px 26px 0 0",
        paddingBottom:"max(28px, env(safe-area-inset-bottom, 28px))",
        boxShadow:"0 -6px 40px rgba(0,0,0,0.12)",
        fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
        animation:"psFadeUp 0.34s cubic-bezier(0.34,1.3,0.64,1) both",
      }}>
        {/* Handle */}
        <div style={{
          width:38, height:4, borderRadius:999,
          background:"rgba(0,0,0,0.11)",
          margin:"13px auto 0",
        }}/>

        {/* Title */}
        <div style={{
          padding:"18px 22px 4px",
          fontWeight:800, fontSize:20,
          color:C.ink, letterSpacing:-0.5,
        }}>
          Was möchtest du teilen?
        </div>
        <div style={{
          padding:"0 22px 18px",
          fontSize:13, color:C.muted,
        }}>
          Wähle, wie dein Beitrag erscheinen soll.
        </div>

        {/* Option cards */}
        <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:11 }}>
          {OPTIONS.map((opt, i) => (
            <button key={opt.key}
              className="ps-card"
              onClick={() => onSelect?.(opt.key)}
              style={{
                display:"flex", alignItems:"center", gap:16,
                padding:"17px 18px",
                background: opt.bg,
                border:`1.5px solid ${opt.border}`,
                borderRadius:18,
                cursor:"pointer", fontFamily:"inherit",
                textAlign:"left", width:"100%",
                boxShadow:`0 2px 16px ${opt.shadow}`,
                animation:`psCardIn 0.3s ${i * 0.06}s ease both`,
              }}>
              {/* Icon box */}
              <div style={{
                width:54, height:54, borderRadius:17, flexShrink:0,
                background:`${opt.color}15`,
                border:`1.5px solid ${opt.color}25`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:26,
                boxShadow:`0 2px 12px ${opt.color}20`,
              }}>
                {opt.emoji}
              </div>

              {/* Text */}
              <div style={{ flex:1 }}>
                <div style={{
                  fontWeight:800, fontSize:16, color:C.ink,
                  letterSpacing:-0.2, marginBottom:3,
                }}>
                  {opt.title}
                </div>
                <div style={{
                  fontSize:13, color:C.muted, lineHeight:1.4,
                }}>
                  {opt.desc}
                </div>
              </div>

              {/* Arrow */}
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none"
                style={{ flexShrink:0, opacity:0.3 }}>
                <path d="M1 1L7 7L1 13"
                  stroke={C.ink} strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>

        {/* Cancel */}
        <button onClick={onClose} style={{
          display:"block", width:"calc(100% - 32px)",
          margin:"14px 16px 0",
          padding:"14px",
          background:"rgba(0,0,0,0.04)",
          border:"1.5px solid rgba(0,0,0,0.07)",
          borderRadius:16,
          fontSize:14, fontWeight:600, color:C.muted,
          cursor:"pointer", fontFamily:"inherit",
          WebkitTapHighlightColor:"transparent",
        }}>
          Abbrechen
        </button>
      </div>
    </>
  );
}
