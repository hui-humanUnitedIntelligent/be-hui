// header/MatchBar.jsx — HUI Resonanz Match Bar
// Pill-förmiges Eingabefeld mit animiertem emotionalem Placeholder
// Kein klassisches Suchfeld — emotionale Navigation

import React from "react";
import { MATCH_PLACEHOLDERS } from "../mood/moodConfig.js";

export default function MatchBar({ activeMood, onFocus, value, onChange }) {
  const [phIdx,  setPhIdx]  = React.useState(0);
  const [phVis,  setPhVis]  = React.useState(true);
  const inputRef = React.useRef(null);

  const mc      = activeMood?.color || "#16D7C5";
  const has     = !!activeMood;
  const hasInput = (value || "").trim().length > 0;

  // Rotierender Placeholder
  React.useEffect(() => {
    const t = setInterval(() => {
      setPhVis(false);
      setTimeout(() => {
        setPhIdx(i => (i + 1) % MATCH_PLACEHOLDERS.length);
        setPhVis(true);
      }, 320);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      onClick={() => { inputRef.current?.focus(); onFocus?.(); }}
      style={{
        flex:1, display:"flex", alignItems:"center", gap:8,
        height:38,
        background: has
          ? `linear-gradient(135deg,${mc}12,rgba(255,251,248,0.96))`
          : "rgba(255,255,255,0.88)",
        backdropFilter:"blur(12px)",
        WebkitBackdropFilter:"blur(12px)",
        borderRadius:999,
        border:`1.5px solid ${has ? mc+"42" : "rgba(22,215,197,0.25)"}`,
        boxShadow: has
          ? `0 0 0 3px ${mc}10, 0 3px 14px rgba(0,0,0,0.06)`
          : "0 0 0 2.5px rgba(22,215,197,0.08), 0 3px 14px rgba(0,0,0,0.05)",
        padding:"0 12px",
        cursor:"text",
        transition:"border-color 0.3s, box-shadow 0.3s, background 0.3s",
      }}
    >
      {/* Resonanz-Icon */}
      <div style={{ flexShrink:0, lineHeight:0, opacity: has ? 0.85 : 0.4 }}>
        {has
          ? <span style={{ fontSize:14 }}>{activeMood.emoji}</span>
          : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4" stroke="#16D7C5" strokeWidth="1.5"/>
              <path d="M9.5 9.5 L12.5 12.5" stroke="#16D7C5" strokeWidth="1.5"
                strokeLinecap="round"/>
              <path d="M4.5 6 Q6 4 7.5 6 Q6 8 4.5 6Z" fill="#16D7C5" opacity="0.38"/>
            </svg>
          )
        }
      </div>

      {/* Input + animated placeholder */}
      <div style={{ flex:1, position:"relative", height:38, display:"flex", alignItems:"center" }}>
        <input
          ref={inputRef}
          value={value || ""}
          onChange={e => onChange?.(e.target.value)}
          style={{
            position:"absolute", inset:0,
            background:"transparent", border:"none", outline:"none",
            fontSize:13.5, fontWeight:500,
            color:"rgba(20,20,20,0.85)",
            fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif",
            letterSpacing:0.1, padding:"0 2px",
            WebkitTapHighlightColor:"transparent",
          }}
          placeholder=""
        />
        {!hasInput && (
          <span aria-hidden="true" style={{
            position:"absolute", left:2, pointerEvents:"none",
            fontSize:13.5, fontWeight:500,
            color: has ? `${mc}72` : "rgba(130,130,130,0.62)",
            opacity: phVis ? 1 : 0,
            transform: phVis ? "translateY(0)" : "translateY(4px)",
            transition:"opacity 0.3s ease, transform 0.3s ease",
            whiteSpace:"nowrap", overflow:"hidden", maxWidth:"100%",
          }}>
            {MATCH_PLACEHOLDERS[phIdx]}
          </span>
        )}
      </div>

      {/* Clear button */}
      {hasInput && (
        <button
          onClick={e => { e.stopPropagation(); onChange?.(""); }}
          style={{
            flexShrink:0, width:18, height:18, borderRadius:"50%",
            background:"rgba(0,0,0,0.11)", border:"none",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", WebkitTapHighlightColor:"transparent",
            fontSize:10, color:"rgba(60,60,60,0.65)", fontWeight:700,
          }}>✕</button>
      )}
    </div>
  );
}
