// QuickCreateSheet.jsx — Premium Apple-style bottom sheet
// Nur 3 Optionen: Story / Werk / Experience
// Props-only, kein Router-Hook direkt
import React, { useEffect } from "react";

const T = {
  teal:"#16D7C5", tealGlow:"rgba(22,215,197,.28)",
  coral:"#FF8A6B", coralGlow:"rgba(255,138,107,.28)",
  gold:"#F5A623",  goldGlow:"rgba(245,166,35,.28)",
  ink:"#1A1A1A", ink2:"#3A3A3A", ink3:"#6A6A6A",
  muted:"#9A9A9A", border:"rgba(0,0,0,.07)",
  card:"rgba(255,255,255,.95)",
  warm:"#F9F7F4",
};

const CSS = `
  @keyframes qcUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
  @keyframes qcIn{from{opacity:0}to{opacity:1}}
  @keyframes qcPop{0%{transform:scale(.88)}60%{transform:scale(1.04)}100%{transform:scale(1)}}
  .qc-tap{cursor:pointer;-webkit-tap-highlight-color:transparent}
  .qc-tap:active{opacity:.7;transform:scale(.96)!important;transition:all .12s}
`;

const OPTIONS = [
  {
    key:"story",
    emoji:"⚡️",
    label:"Story posten",
    sub:"Teile einen spontanen Moment",
    gradient:"linear-gradient(135deg,#16D7C5,#0EC4B3)",
    glow:"rgba(22,215,197,.32)",
    textColor:T.teal,
    bg:"rgba(22,215,197,.07)",
    border:"rgba(22,215,197,.22)",
  },
  {
    key:"werk",
    emoji:"🎨",
    label:"Werk veröffentlichen",
    sub:"Zeige was du erschaffen hast",
    gradient:"linear-gradient(135deg,#FF8A6B,#E8705A)",
    glow:"rgba(255,138,107,.32)",
    textColor:T.coral,
    bg:"rgba(255,138,107,.07)",
    border:"rgba(255,138,107,.22)",
  },
  {
    key:"experience",
    emoji:"✨",
    label:"Experience teilen",
    sub:"Lade andere in deine Welt ein",
    gradient:"linear-gradient(135deg,#F5A623,#E8952A)",
    glow:"rgba(245,166,35,.32)",
    textColor:T.gold,
    bg:"rgba(245,166,35,.07)",
    border:"rgba(245,166,35,.22)",
  },
];

export default function QuickCreateSheet({ onClose, onSelect }) {
  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:500,
      background:"rgba(6,6,6,.48)",
      backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
      display:"flex", alignItems:"flex-end",
      animation:"qcIn .18s both"
    }} onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <style>{CSS}</style>

      <div style={{
        width:"100%", maxWidth:520, margin:"0 auto",
        padding:"20px 16px",
        paddingBottom:"max(24px,calc(env(safe-area-inset-bottom,0px)+16px))",
        animation:"qcUp .34s cubic-bezier(.34,1.2,.64,1) both"
      }}>

        {/* Heading */}
        <div style={{ textAlign:"center", marginBottom:18 }}>
          <p style={{ margin:0, fontSize:12, fontWeight:700,
            color:"rgba(255,255,255,.55)", letterSpacing:.6 }}>
            WAS MÖCHTEST DU TEILEN?
          </p>
        </div>

        {/* 3 Cards */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {OPTIONS.map((opt, i) => (
            <button key={opt.key} className="qc-tap"
              onClick={() => { onClose(); onSelect(opt.key); }}
              style={{
                width:"100%", display:"flex", alignItems:"center", gap:16,
                padding:"18px 20px", borderRadius:22,
                background:T.card,
                border:`1.5px solid ${opt.border}`,
                cursor:"pointer",
                boxShadow:`0 4px 20px ${opt.glow}`,
                animation:`qcPop ${.28+i*.08}s cubic-bezier(.34,1.3,.64,1) both`,
              }}>

              {/* Icon */}
              <div style={{
                width:52, height:52, borderRadius:16, flexShrink:0,
                background:opt.gradient,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:24,
                boxShadow:`0 6px 18px ${opt.glow}`
              }}>
                {opt.emoji}
              </div>

              {/* Text */}
              <div style={{ flex:1, textAlign:"left" }}>
                <div style={{ fontWeight:800, fontSize:16,
                  color:T.ink, letterSpacing:"-.3px" }}>
                  {opt.label}
                </div>
                <div style={{ fontSize:12, color:T.ink3, marginTop:3, lineHeight:1.4 }}>
                  {opt.sub}
                </div>
              </div>

              {/* Arrow */}
              <div style={{ color:opt.textColor, fontSize:20, fontWeight:300,
                opacity:.6 }}>›</div>
            </button>
          ))}
        </div>

        {/* Cancel */}
        <button className="qc-tap"
          onClick={onClose}
          style={{
            width:"100%", marginTop:10, padding:"16px",
            borderRadius:18, border:"none", cursor:"pointer",
            background:"rgba(255,255,255,.14)",
            color:"rgba(255,255,255,.7)",
            fontWeight:700, fontSize:14, backdropFilter:"blur(4px)"
          }}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}
