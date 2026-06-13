// NavItem.jsx v5 — HUI Active State: Capsule + Scale-Animation
// Fixes: Props-Normalisierung (active|isActive), Capsule-BG, Scale-Keyframe
import React from "react";
import { HUI } from "../../../design/hui.design.js";

const C = {
  teal:        HUI.COLOR.teal || "#3ED6CF",
  coral:       HUI.COLOR.coral || "#F4714F",
  inactiveIcon:"rgba(80,80,80,0.52)",
  inactiveLabel:"rgba(80,80,80,0.55)",
};

// ── Icons ────────────────────────────────────────────────────
function NavIcon({ k, active }) {
  const col = active ? C.teal : C.inactiveIcon;
  const sw  = active ? 1.9 : 1.5;

  if (k === "feed") return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={col} strokeWidth={sw}/>
      <path d="M12 12 L10.5 6.5 L12 8.5 L13.5 6.5 Z" fill={active ? C.teal : col}/>
      <path d="M12 12 L10.5 17.5 L12 15.5 L13.5 17.5 Z" fill={active ? C.coral : "rgba(80,80,80,0.28)"}/>
      <circle cx="12" cy="12" r="1.5" fill={active ? "white" : "rgba(80,80,80,0.28)"} stroke={col} strokeWidth="0.8"/>
    </svg>
  );
  if (k === "discover") return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.5 11 Q12 2.5 20.5 11" stroke={col} strokeWidth={sw} strokeLinecap="round"/>
      <path d="M5.5 11V20.5H10V15.5H14V20.5H18.5V11"
        stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
        fill={active ? `${C.teal}18` : "none"}/>
      <path d="M12 18 C12 18 10.5 17 10.5 15.8 C10.5 15.1 11.3 14.7 12 15.3 C12.7 14.7 13.5 15.1 13.5 15.8 C13.5 17 12 18 12 18Z"
        fill={active ? C.coral : "rgba(80,80,80,0.20)"} stroke="none"/>
    </svg>
  );
  if (k === "impact") return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 19.5 C12 19.5 4 14 4 8.5 C4 6.0 6 4 8.5 4 C10 4 11.2 4.8 12 6 C12.8 4.8 14 4 15.5 4 C18 4 20 6.0 20 8.5 C20 14 12 19.5 12 19.5Z"
        fill={active ? `${C.teal}18` : "rgba(80,80,80,0.07)"}
        stroke={col} strokeWidth={sw} strokeLinejoin="round"/>
      <path d="M12 16 V11" stroke={active ? C.teal : col} strokeWidth={sw - 0.3} strokeLinecap="round"/>
      <path d="M12 13 Q10 12 9.5 10.5 Q11 10.5 12 12"
        fill={active ? `${C.teal}30` : "rgba(80,80,80,0.10)"}
        stroke={active ? C.teal : col} strokeWidth={sw - 0.5} strokeLinejoin="round"/>
      <path d="M12 14.5 Q14 13.5 14.5 12 Q13 12 12 13.5"
        fill={active ? `${C.coral}25` : "rgba(80,80,80,0.07)"}
        stroke={active ? C.coral : col} strokeWidth={sw - 0.5} strokeLinejoin="round"/>
    </svg>
  );
  if (k === "creator") return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.5" r="4"
        fill={active ? `${C.teal}22` : "rgba(80,80,80,0.07)"} stroke={col} strokeWidth={sw}/>
      {active && <circle cx="12" cy="8.5" r="5.5" stroke={C.teal} strokeWidth="0.8" strokeDasharray="2 2" opacity="0.5"/>}
      <path d="M5 21 Q5.5 15.5 12 15.5 Q18.5 15.5 19 21"
        stroke={col} strokeWidth={sw} strokeLinecap="round"
        fill={active ? `${C.teal}14` : "none"}/>
    </svg>
  );
  if (k === "profile") return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="9" r="4"
        fill={active ? `${C.teal}22` : "rgba(80,80,80,0.07)"} stroke={col} strokeWidth={sw}/>
      {active && <circle cx="12" cy="9" r="5.5" stroke={C.teal} strokeWidth="0.8" strokeDasharray="2 2" opacity="0.5"/>}
      <path d="M4.5 21 Q5 15.5 12 15.5 Q19 15.5 19.5 21"
        stroke={col} strokeWidth={sw} strokeLinecap="round"
        fill={active ? `${C.teal}14` : "none"}/>
    </svg>
  );
  return null;
}

// ── Animation CSS ─────────────────────────────────────────────
const CSS = `
  @keyframes huiTabActivate {
    0%   { transform: scale(1.0); }
    45%  { transform: scale(1.08); }
    100% { transform: scale(1.0); }
  }
  @keyframes huiCapsuleFadeIn {
    from { opacity:0; transform:scaleX(0.72); }
    to   { opacity:1; transform:scaleX(1); }
  }
  @keyframes huiPulseDot {
    0%,100% { opacity:1; transform:scale(1); }
    50%     { opacity:0.55; transform:scale(0.75); }
  }
  .hui-nav-item-active { animation: huiTabActivate 250ms ease-out both; }
  .hui-nav-capsule     { animation: huiCapsuleFadeIn 200ms cubic-bezier(0.22,1,0.36,1) both; }
`;

let _cssInjected = false;

// ── NavItem ───────────────────────────────────────────────────
export default function NavItem({ item, active, isActive, onPress, badge = 0 }) {
  // Props-Normalisierung: BottomNav sendet "active", ältere Stellen "isActive"
  const isAct = !!(active ?? isActive);

  const [pressed,   setPressed]   = React.useState(false);
  const [animClass, setAnimClass] = React.useState("");
  const prevActive  = React.useRef(isAct);
  const touchMoved  = React.useRef(false);

  // CSS einmalig injizieren
  if (!_cssInjected && typeof document !== "undefined") {
    const s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
    _cssInjected = true;
  }

  // Scale-Animation beim Aktivieren
  React.useEffect(() => {
    if (isAct && !prevActive.current) {
      setAnimClass("hui-nav-item-active");
      const t = setTimeout(() => setAnimClass(""), 260);
      return () => clearTimeout(t);
    }
    prevActive.current = isAct;
  }, [isAct]);

  function fire() {
    if (typeof onPress === "function") onPress(item.key);
  }
  function handleTouchStart() { touchMoved.current = false; setPressed(true); }
  function handleTouchMove()  { touchMoved.current = true; }
  function handleTouchEnd(e)  {
    setPressed(false);
    if (touchMoved.current) return;
    e.preventDefault();
    fire();
  }
  function handleClick(e)     { if (e.detail === 0) return; fire(); }

  return (
    <button
      type="button"
      aria-label={item.label}
      aria-current={isAct ? "page" : undefined}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      style={{
        position:  "relative",
        background:"none",
        border:    "none",
        outline:   "none",
        display:   "flex",
        flexDirection: "column",
        alignItems:    "center",
        justifyContent:"center",
        gap:       2,
        padding:   "6px 10px",
        borderRadius: 999,
        cursor:    "pointer",
        userSelect:"none",
        WebkitTapHighlightColor:"transparent",
        touchAction:"manipulation",
        minWidth:  56,
        // Tap-Feedback
        opacity:   pressed ? 0.70 : 1,
        transform: pressed ? "scale(0.88) translateY(1px)" : "scale(1)",
        transition:pressed
          ? "transform 120ms cubic-bezier(0.22,1,0.36,1), opacity 100ms ease"
          : "transform 220ms cubic-bezier(0.16,1,0.30,1), opacity 180ms ease",
      }}
    >
      {/* ── Aktive Capsule (Hintergrund) ──────────────────── */}
      {isAct && (
        <div
          className="hui-nav-capsule"
          style={{
            position:     "absolute",
            inset:        0,
            borderRadius: 999,
            background:   `${C.teal}14`,  // ~12% Opacity
            boxShadow: [
              `0 0 10px ${C.teal}22`,     // leichter Außen-Glow
              `inset 0 1px 0 ${C.teal}18`, // obere Kante
            ].join(","),
            pointerEvents:"none",
            zIndex:       0,
          }}
        />
      )}

      {/* ── Icon ──────────────────────────────────────────── */}
      <div
        className={isAct ? animClass : ""}
        style={{
          position:  "relative",
          zIndex:    1,
          display:   "flex",
          alignItems:"center",
          justifyContent:"center",
          // aktiv: leicht nach oben + Glow-Filter
          filter: isAct
            ? `drop-shadow(0 0 4px ${C.teal}55)`
            : "none",
          transition:"filter 0.22s ease, transform 0.22s cubic-bezier(0.22,1,0.36,1)",
          pointerEvents:"none",
        }}
      >
        <NavIcon k={item.key} active={isAct} />

        {/* Badge ─────────────────────────────────────────── */}
        {badge > 0 && (
          <div style={{
            position:"absolute", top:-3, right:-5,
            minWidth:14, height:14, borderRadius:7,
            background:"linear-gradient(135deg,#FF5F5F,rgba(244,115,85,0.9))",
            color:"white", fontSize:7.5, fontWeight:800,
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:"0 3px", border:"1.5px solid rgba(255,251,248,0.96)",
            pointerEvents:"none",
          }}>{badge > 9 ? "9+" : badge}</div>
        )}
      </div>

      {/* ── Label ─────────────────────────────────────────── */}
      <span style={{
        fontSize:     9.5,
        fontWeight:   isAct ? 750 : 500,
        color:        isAct ? C.teal : C.inactiveLabel,
        letterSpacing:isAct ? "0.02em" : "0.01em",
        lineHeight:   1,
        zIndex:       1,
        pointerEvents:"none",
        userSelect:   "none",
        transition:   "color 0.2s ease, font-weight 0.2s ease",
        whiteSpace:   "nowrap",
      }}>
        {item.label}
      </span>
    </button>
  );
}
