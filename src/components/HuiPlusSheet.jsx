// HuiPlusSheet.jsx — Content Type Selector
// 4 Typen: Moment / Werk / Erlebnis / Story
// Design: Premium Bottom Sheet, Apple + Instagram Qualität

import React, { useEffect } from "react";

const C = {
  teal:"#16D7C5", coral:"#FF8A6B", gold:"#F5A623", purple:"#A78BFA",
  cream:"#F9F7F4", card:"#FFFFFF",
  ink:"#1A1A1A", ink2:"#3A3A3A", muted:"rgba(60,60,60,0.55)",
};

const CSS = `
  @keyframes psUp {
    from { opacity:0; transform:translateY(100%); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes psCardIn {
    from { opacity:0; transform:translateY(16px) scale(0.97); }
    to   { opacity:1; transform:translateY(0)   scale(1); }
  }
  @keyframes psBgIn { from{opacity:0} to{opacity:1} }

  .psc-card {
    cursor:pointer;
    -webkit-tap-highlight-color:transparent;
    transition: transform 0.16s cubic-bezier(0.34,1.3,0.64,1),
                box-shadow 0.16s ease;
    border:none; text-align:left; width:100%; font-family:inherit;
  }
  .psc-card:active {
    transform: scale(0.96) !important;
  }
`;

const TYPES = [
  {
    key:    "moment",
    emoji:  "✨",
    title:  "Moment",
    desc:   "Spontaner Post · Foto · Video",
    color:  "#16D7C5",
    bg:     "linear-gradient(135deg,rgba(22,215,197,0.10),rgba(22,215,197,0.03))",
    border: "rgba(22,215,197,0.28)",
    shadow: "rgba(22,215,197,0.12)",
  },
  {
    key:    "werk",
    emoji:  "🎨",
    title:  "Werk",
    desc:   "Produkt · Kunst · Portfolio · Service",
    color:  "#FF8A6B",
    bg:     "linear-gradient(135deg,rgba(255,138,107,0.10),rgba(255,138,107,0.03))",
    border: "rgba(255,138,107,0.28)",
    shadow: "rgba(255,138,107,0.12)",
  },
  {
    key:    "erlebnis",
    emoji:  "🌟",
    title:  "Erlebnis",
    desc:   "Workshop · Event · Session · Community",
    color:  "#F5A623",
    bg:     "linear-gradient(135deg,rgba(245,166,35,0.10),rgba(245,166,35,0.03))",
    border: "rgba(245,166,35,0.28)",
    shadow: "rgba(245,166,35,0.12)",
  },
  {
    key:    "story",
    emoji:  "📖",
    title:  "Story",
    desc:   "Temporär · 24h · Tagesbericht",
    color:  "#A78BFA",
    bg:     "linear-gradient(135deg,rgba(167,139,250,0.10),rgba(167,139,250,0.03))",
    border: "rgba(167,139,250,0.28)",
    shadow: "rgba(167,139,250,0.12)",
  },
];

export default function HuiPlusSheet({ onSelect, onClose }) {
  // Body-Scroll sperren
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <>
      <style>{CSS}</style>

      {/* ── Backdrop ── */}
      <div
        onClick={onClose}
        style={{
          position:"fixed", inset:0, zIndex:2000,
          background:"rgba(0,0,0,0.35)",
          backdropFilter:"blur(8px)",
          WebkitBackdropFilter:"blur(8px)",
          animation:"psBgIn .25s ease both",
        }}
      />

      {/* ── Sheet ── */}
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:2001,
        background:C.card,
        borderRadius:"28px 28px 0 0",
        paddingBottom:"max(24px, env(safe-area-inset-bottom, 24px))",
        boxShadow:"0 -8px 48px rgba(0,0,0,0.14)",
        fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
        animation:"psUp 0.38s cubic-bezier(0.32,1.0,0.64,1) both",
      }}>

        {/* Handle */}
        <div style={{
          width:40, height:4.5, borderRadius:999,
          background:"rgba(0,0,0,0.10)",
          margin:"14px auto 0",
        }}/>

        {/* Header */}
        <div style={{ padding:"20px 22px 6px" }}>
          <div style={{
            fontWeight:900, fontSize:21, color:C.ink, letterSpacing:-0.5,
            marginBottom:4,
          }}>
            Was möchtest du erstellen?
          </div>
          <div style={{ fontSize:13.5, color:C.muted, lineHeight:1.5 }}>
            Wähle einen Typ — dann geht es los ✦
          </div>
        </div>

        {/* Type Cards — 2x2 Grid auf großen Screens, Liste auf Mobile */}
        <div style={{
          padding:"14px 16px 6px",
          display:"grid",
          gridTemplateColumns:"1fr 1fr",
          gap:11,
        }}>
          {TYPES.map((t, idx) => (
            <button
              key={t.key}
              className="psc-card"
              onClick={() => onSelect?.(t.key)}
              style={{
                background:  t.bg,
                border:      `1.5px solid ${t.border}`,
                borderRadius: 20,
                padding:     "18px 16px",
                display:     "flex",
                flexDirection:"column",
                gap:         10,
                boxShadow:   `0 3px 18px ${t.shadow}`,
                animation:   `psCardIn 0.32s ${idx * 0.055}s ease both`,
              }}
            >
              {/* Emoji Circle */}
              <div style={{
                width:50, height:50, borderRadius:15, flexShrink:0,
                background:`${t.color}18`,
                border:`1.5px solid ${t.color}30`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:24,
                boxShadow:`0 3px 14px ${t.color}22`,
              }}>
                {t.emoji}
              </div>

              {/* Text */}
              <div>
                <div style={{
                  fontWeight:800, fontSize:15.5, color:C.ink,
                  letterSpacing:-0.2, marginBottom:3,
                }}>
                  {t.title}
                </div>
                <div style={{
                  fontSize:11.5, color:C.muted, lineHeight:1.45,
                }}>
                  {t.desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Cancel */}
        <div style={{ padding:"10px 16px 0" }}>
          <button
            onClick={onClose}
            style={{
              display:"block", width:"100%",
              padding:"13px",
              background:"rgba(0,0,0,0.04)",
              border:"1.5px solid rgba(0,0,0,0.07)",
              borderRadius:16,
              fontSize:14, fontWeight:600, color:C.muted,
              cursor:"pointer", fontFamily:"inherit",
              WebkitTapHighlightColor:"transparent",
              transition:"background .15s",
            }}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </>
  );
}
