// NavItem.jsx v4 — iPad Safari Fix
// onTouchEnd als primärer Handler (kein 300ms onClick-Delay auf iOS)
// touch-action: manipulation + -webkit-tap-highlight-color: transparent
import React, { useState } from "react";
import { HUI } from "../../../design/hui.design.js";
import { IX, DUR, EASE } from "../../../design/hui.interaction.js";

const C = { teal: HUI.COLOR.teal, coral: HUI.COLOR.coral };

function NavIcon({ k, active }) {
  const col = active ? C.teal : "rgba(80,80,80,0.55)";
  const sw  = active ? 1.8 : 1.5;

  if (k === "feed") return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.5 11 Q12 2.5 20.5 11" stroke={col} strokeWidth={sw} strokeLinecap="round"/>
      <path d="M5.5 11V20.5H10V15.5H14V20.5H18.5V11"
        stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
        fill={active ? `${C.teal}15` : "none"}/>
      <path d="M12 18 C12 18 10.5 17 10.5 15.8 C10.5 15.1 11.3 14.7 12 15.3 C12.7 14.7 13.5 15.1 13.5 15.8 C13.5 17 12 18 12 18Z"
        fill={active ? C.coral : "rgba(80,80,80,0.25)"} stroke="none"/>
    </svg>
  );
  if (k === "impact") return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21 V10" stroke={col} strokeWidth={sw} strokeLinecap="round"/>
      <path d="M12 14 Q8 12 7 8 Q10 8 12 11" fill={active?`${C.teal}30`:"rgba(80,80,80,0.12)"} stroke={col} strokeWidth={sw-0.3} strokeLinejoin="round"/>
      <path d="M12 17 Q16 15 17 11 Q14 11 12 14" fill={active?`${C.teal}22`:"rgba(80,80,80,0.08)"} stroke={col} strokeWidth={sw-0.3} strokeLinejoin="round"/>
      <path d="M8 21 H16" stroke={active?C.coral:"rgba(80,80,80,0.30)"} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
  if (k === "discover") return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={col} strokeWidth={sw}/>
      <path d="M12 12 L10.5 6.5 L12 8.5 L13.5 6.5 Z" fill={active?C.teal:col}/>
      <path d="M12 12 L10.5 17.5 L12 15.5 L13.5 17.5 Z" fill={active?C.coral:"rgba(80,80,80,0.3)"}/>
      <circle cx="12" cy="12" r="1.5" fill={active?"white":"rgba(80,80,80,0.3)"} stroke={col} strokeWidth="0.8"/>
    </svg>
  );
  if (k === "community") return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="8.5" cy="9" r="3" stroke={col} strokeWidth={sw} fill={active?`${C.teal}15`:"none"}/>
      <circle cx="15.5" cy="9" r="3" stroke={active?C.teal:col} strokeWidth={sw-0.2} fill={active?`${C.teal}10`:"none"}/>
      <path d="M2 21 Q2.5 16 8.5 16 Q11.5 16 13 17.5" stroke={col} strokeWidth={sw} strokeLinecap="round" fill={active?`${C.teal}10`:"none"}/>
      <path d="M13 21 Q13.5 16 15.5 16 Q19.5 16 22 21" stroke={active?C.coral:col} strokeWidth={sw-0.2} strokeLinecap="round" fill="none"/>
      {active && <circle cx="12" cy="20" r="1.2" fill={C.coral} opacity="0.7"/>}
    </svg>
  );
  if (k === "creator") return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.5" r="4"
        fill={active?`${C.teal}20`:"rgba(80,80,80,0.07)"} stroke={col} strokeWidth={sw}/>
      {active && <circle cx="12" cy="8.5" r="5.5" stroke={C.teal} strokeWidth="0.8" strokeDasharray="2 2" opacity="0.5"/>}
      <path d="M5 21 Q5.5 15.5 12 15.5 Q18.5 15.5 19 21"
        stroke={col} strokeWidth={sw} strokeLinecap="round"
        fill={active?`${C.teal}12`:"none"}/>
      <path d="M15 5 L16.5 8 L20 8.5 L17.5 11 L18 14.5 L15 13 L12 14.5 L12.5 11 L10 8.5 L13.5 8 Z"
        stroke={active?C.coral:col} strokeWidth="0.8" fill={active?`${C.coral}20`:"none"}/>
    </svg>
  );
  if (k === "profile") return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="9" r="4"
        fill={active?`${C.teal}20`:"rgba(80,80,80,0.07)"} stroke={col} strokeWidth={sw}/>
      {active && <circle cx="12" cy="9" r="5.5" stroke={C.teal} strokeWidth="0.8" strokeDasharray="2 2" opacity="0.5"/>}
      <path d="M4.5 21 Q5 15.5 12 15.5 Q19 15.5 19.5 21"
        stroke={col} strokeWidth={sw} strokeLinecap="round"
        fill={active?`${C.teal}12`:"none"}/>
      {active && <circle cx="12" cy="20.5" r="1" fill={C.coral} opacity="0.7"/>}
    </svg>
  );
  return null;
}

export default function NavItem({ item, isActive, onPress, badge = 0 }) {
  const [pressed, setPressed] = React.useState(false);
  const touchMoved = React.useRef(false);
  const col = isActive ? C.teal : "rgba(80,80,80,0.55)";
  const sw  = isActive ? 1.7 : 1.4;

  function fire() {
    if (typeof onPress === "function") {
      onPress(item.key);
    } else {
      console.error("[HUI-NAV] onPress kein function:", typeof onPress);
    }
  }

  function handleTouchStart() {
    touchMoved.current = false;
    setPressed(true);
  }
  function handleTouchMove() {
    touchMoved.current = true;
  }
  function handleTouchEnd(e) {
    setPressed(false);
    if (touchMoved.current) return;
    e.preventDefault();
    fire();
  }
  function handleClick(e) {
    if (e.detail === 0) return;
    fire();
  }

  return (
    <button
      type="button"
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      style={{
        background:              "none",
        border:                  "none",
        outline:                 "none",
        display:                 "flex",
        flexDirection:           "column",
        alignItems:              "center",
        gap:                     3,
        padding:                 "8px 12px",
        borderRadius:            16,
        cursor:                  "pointer",
        userSelect:              "none",
        WebkitTapHighlightColor: "transparent",
        touchAction:             "manipulation",
        // Phase 22: Tap-Feedback
        opacity:    pressed ? 0.72 : 1,
        transform:  pressed ? "scale(0.88) translateY(1px)" : "scale(1)",
        transition: pressed
          ? "transform 120ms cubic-bezier(0.22,1,0.36,1), opacity 120ms ease"
          : "transform 220ms cubic-bezier(0.16,1,0.30,1), opacity 200ms ease",
      }}
    >
      <div style={{
        position:  "relative", zIndex: 1,
        transform: isActive ? "translateY(-1px) scale(1.06)" : "translateY(0) scale(1)",
        transition:"transform 0.24s cubic-bezier(0.22,1,0.36,1)",
        pointerEvents: "none",
      }}>
        <NavIcon k={item.key} active={isActive}/>
        {badge > 0 && (
          <div style={{
            position: "absolute", top:-3, right:-5,
            minWidth:14, height:14, borderRadius:7,
            background:"linear-gradient(135deg,#FF5F5F,rgba(244,115,85,0.9))",
            color:"white", fontSize:7.5, fontWeight:800,
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:"0 3px", border:"1.5px solid rgba(255,251,248,0.96)",
            pointerEvents:"none",
          }}>{badge > 9 ? "9+" : badge}</div>
        )}
      </div>
      <span style={{
        fontSize:     10,
        fontWeight:   isActive ? 700 : 500,
        color:        isActive ? C.teal : "rgba(80,80,80,0.6)",
        letterSpacing:isActive ? 0.3 : 0.1,
        marginTop:    3,
        lineHeight:   1,
        pointerEvents:"none",
        userSelect:   "none",
      }}>
        {item.label}
      </span>
      {isActive && (
        <div style={{
          width:4, height:4, borderRadius:"50%", marginTop:2,
          background:`linear-gradient(135deg,${C.teal},${C.coral})`,
          boxShadow:`0 0 4px ${C.teal}66`,
          pointerEvents:"none",
          animation:"huiPulse 2.6s ease-in-out infinite",
        }}/>
      )}
    </button>
  );
}
