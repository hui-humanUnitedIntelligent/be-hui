// header/MessageButton.jsx — HUI Chat/Resonanz Button
// FIX: onTouchEnd löst onPress direkt aus (iOS sticky-overflow safety)
// FIX: touchAction:manipulation entfernt 300ms delay

import React from "react";

export default function MessageButton({ count=0, onPress }) {
  const [pressed, setPressed] = React.useState(false);

  function handleTouchEnd(e) {
    e.preventDefault();          // verhindert ghost-click delay
    setPressed(false);
    onPress?.();                 // direkt auslösen — nicht auf onClick warten
  }

  function handleClick(e) {
    // Fallback für Desktop/non-touch
    onPress?.();
  }

  return (
    <button
      onClick={handleClick}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={handleTouchEnd}
      aria-label="Nachrichten"
      style={{
        flexShrink:0, width:36, height:36, borderRadius:"50%",
        background:"rgba(255,255,255,0.80)",
        backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
        border:"1.5px solid rgba(22,215,197,0.18)",
        boxShadow:"0 1px 8px rgba(0,0,0,0.06), 0 0 0 2.5px rgba(22,215,197,0.06)",
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", position:"relative",
        WebkitTapHighlightColor:"transparent",
        touchAction:"manipulation",
        transform: pressed ? "scale(0.930) translateY(0.5px)" : "scale(1)",
        transition:"transform 0.22s ease",
        userSelect:"none", WebkitUserSelect:"none",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M2 2.5 H16 Q17 2.5 17 3.5 V11.5 Q17 12.5 16 12.5 H10.5 L9 15 L7.5 12.5 H2 Q1 12.5 1 11.5 V3.5 Q1 2.5 2 2.5Z"
          fill="rgba(22,215,197,0.09)" stroke="#16D7C5" strokeWidth="1.35" strokeLinejoin="round"/>
        <circle cx="6"  cy="7.5" r="1" fill="#16D7C5" opacity="0.65"/>
        <circle cx="9"  cy="7.5" r="1" fill="#FF8A6B" opacity="0.65"/>
        <circle cx="12" cy="7.5" r="1" fill="#16D7C5" opacity="0.65"/>
      </svg>

      {count > 0 && (
        <div style={{
          position:"absolute", top:3, right:3,
          minWidth: count > 9 ? 16 : 14,
          height: count > 9 ? 16 : 14,
          borderRadius:8,
          background:"linear-gradient(135deg,#FF4757,#E8353F)",
          color:"white",
          fontSize: count > 9 ? 8 : 9,
          fontWeight:800,
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:"0 3px",
          border:"1.5px solid rgba(255,251,248,0.97)",
          boxShadow:"0 1px 6px rgba(255,71,87,0.55)",
          opacity:1,
          transform:"scale(1)",
          transition:"opacity 0.2s ease, transform 0.2s cubic-bezier(.175,.885,.32,1.275)",
        }}>
          {count >= 100 ? "99+" : count > 9 ? count : count}
        </div>
      )}
    </button>
  );
}
