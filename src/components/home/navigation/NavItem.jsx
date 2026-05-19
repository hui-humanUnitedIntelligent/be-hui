// NavItem.jsx v4 — iPad Safari Fix
// onTouchEnd als primärer Handler (kein 300ms onClick-Delay auf iOS)
// touch-action: manipulation + -webkit-tap-highlight-color: transparent
import React from "react";

const C = { teal:"#16D7C5", coral:"#FF8A6B" };

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
  /* touchMoved: verhindert Auslösung wenn User scrollt */
  const touchMoved = React.useRef(false);

  function fire() {
    console.log("[PROFILE TAB CLICKED]", item?.key);
    if (typeof onPress === "function") {
      onPress(item.key);
    } else {
      console.error("[HUI-NAV] onPress kein function:", typeof onPress);
    }
  }

  function handleTouchStart(e) {
    touchMoved.current = false;
    setPressed(true);
  }
  function handleTouchMove() {
    touchMoved.current = true;
  }
  function handleTouchEnd(e) {
    setPressed(false);
    if (touchMoved.current) return; /* Scroll — nicht feuern */
    e.preventDefault();             /* verhindert ghost onClick */
    fire();
  }
  function handleClick(e) {
    /* Nur als Fallback für Nicht-Touch (Desktop, Maus) */
    if (e.detail === 0) return;     /* synth. Event nach Touch — überspringen */
    fire();
  }

  return (
    <button
      type="button"
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      style={{
        flex:            1,
        display:         "flex",
        flexDirection:   "column",
        alignItems:      "center",
        justifyContent:  "center",
        gap:             2,
        border:          "none",
        background:      "none",
        cursor:          "pointer",
        padding:         "6px 2px",
        borderRadius:    18,
        position:        "relative",
        minHeight:       54,
        /* iOS Safari — kein Tap-Delay, kein Ghost-Click */
        WebkitTapHighlightColor: "transparent",
        touchAction:             "manipulation",
        /* Pointer-Events MUSS auto sein */
        pointerEvents:   "auto",
        userSelect:      "none",
        /* Press-Feedback */
        transform:  pressed ? "scale(0.88)" : "scale(1)",
        transition: "transform 0.14s ease",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      {isActive && (
        <div style={{
          position:   "absolute", inset: 0, borderRadius: 18,
          background: `linear-gradient(135deg,rgba(22,215,197,0.12),rgba(255,138,107,0.06))`,
          zIndex:     0,
          pointerEvents: "none",
        }}/>
      )}
      <div style={{
        position:  "relative", zIndex: 1,
        transform: isActive ? "translateY(-1px) scale(1.06)" : "translateY(0) scale(1)",
        transition: "transform 0.24s cubic-bezier(0.34,1.3,0.64,1)",
        pointerEvents: "none",
      }}>
        <NavIcon k={item.key} active={isActive}/>
        {badge > 0 && (
          <div style={{
            position: "absolute", top:-3, right:-5,
            minWidth:14, height:14, borderRadius:7,
            background:"linear-gradient(135deg,#FF5F5F,#FF8A6B)",
            color:"white", fontSize:7.5, fontWeight:800,
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:"0 3px", border:"1.5px solid rgba(255,251,248,0.96)",
            pointerEvents:"none",
          }}>{badge > 9 ? "9+" : badge}</div>
        )}
      </div>
      <span style={{
        fontSize:    10,
        fontWeight:  isActive ? 700 : 500,
        color:       isActive ? C.teal : "rgba(80,80,80,0.6)",
        letterSpacing: isActive ? 0.3 : 0.1,
        marginTop:   3,
        lineHeight:  1,
        pointerEvents: "none",
        userSelect:  "none",
      }}>
        {item.label}
      </span>
      {isActive && (
        <div style={{
          width:4, height:4, borderRadius:"50%", marginTop:2,
          background:`linear-gradient(135deg,${C.teal},${C.coral})`,
          boxShadow:`0 0 4px ${C.teal}66`,
          pointerEvents:"none",
        }}/>
      )}
    </button>
  );
}
