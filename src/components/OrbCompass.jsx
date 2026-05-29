// src/components/OrbCompass.jsx — HUI Begegnungs-Kompass V1
// RESET — nur Kompass, kein Moment-System, keine weiteren Features.
// Verbindliche Referenz: Screenshot 29.05.2026
// ════════════════════════════════════════════════════════════════
// Nutzerflow:
//   Tap Orb in BottomNav → Kompass öffnet sich (feed bleibt sichtbar, blur)
//   Tap Themenwelt → Kompass schliesst → Feed filtert auf diese Welt
//   Tap X → Kompass schliesst, Feed unverändert
// ════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useMemo } from "react";

// ── Design ───────────────────────────────────────────────────────
const D = {
  // Screenshot-genaue Hintergrundfarben
  bgTop:    "#E8F3EF",
  bgBot:    "#D2E8E0",
  // Typo
  ink:      "#1B3530",
  inkSoft:  "rgba(27,53,48,0.58)",
  inkFaint: "rgba(27,53,48,0.34)",
  // HUI brand
  teal:     "#0EC4B8",
  tealDark: "#0A9990",
  coral:    "#E8573A",
  // Lines
  track:    "rgba(27,53,48,0.13)",
};

// ── Five worlds — pentagon layout (every 72° starting from top=270°) ──
// Screenshot: Natur=top, Kreativität=upper-right, Tiere=lower-right,
//             Wirkung=lower-left, Gemeinschaft=upper-left
const WORLDS = [
  { id:"natur",        emoji:"🌿", label:"Natur",       bg:"#3D7A42", deg: 270 },
  { id:"kreativitaet", emoji:"🎨", label:"Kreativität", bg:"#C8432A", deg: 342 },
  { id:"tiere",        emoji:"🐾", label:"Tiere",       bg:"#1B7A6E", deg:  54 },
  { id:"wirkung",      emoji:"🌍", label:"Wirkung",     bg:"#2B4E9E", deg: 126 },
  { id:"gemeinschaft", emoji:"🤝", label:"Gemeinschaft",bg:"#D48218", deg: 198 },
];

// polar offset from center (deg 0 = right, adjusted so 270° = top)
function xy(deg, r) {
  const rad = (deg - 90) * (Math.PI / 180);
  return { x: Math.cos(rad) * r, y: Math.sin(rad) * r };
}

// Pentagon SVG path through all world positions
function pentagonPath(r, cx, cy) {
  return WORLDS.map((w, i) => {
    const { x, y } = xy(w.deg, r);
    return `${i === 0 ? "M" : "L"} ${cx + x} ${cy + y}`;
  }).join(" ") + " Z";
}

const CSS = `
  @keyframes orb-bg-in   { from{opacity:0} to{opacity:1} }
  @keyframes orb-panel-in{ from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
  @keyframes orb-panel-out{from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(0.92)} }
  @keyframes orb-node    { from{opacity:0;transform:translate(-50%,-50%) scale(0.4)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
  @keyframes orb-center  { from{opacity:0;transform:translate(-50%,-50%) scale(0.3)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
  @keyframes orb-title   { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes orb-hint    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes orb-pulse   {
    0%,100%{ box-shadow:0 0 0 0 rgba(14,196,184,0.55) }
    55%    { box-shadow:0 0 0 16px rgba(14,196,184,0) }
  }
  @keyframes orb-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

  .orb-bg-in    { animation: orb-bg-in    .25s ease both }
  .orb-panel-in { animation: orb-panel-in .32s cubic-bezier(.22,1,.36,1) both }
  .orb-panel-out{ animation: orb-panel-out .22s cubic-bezier(.22,1,.36,1) both }
  .orb-pulse    { animation: orb-pulse 2.8s ease-in-out infinite }

  .orb-node-press {
    cursor:pointer;
    touch-action:manipulation;
    transition: transform .15s cubic-bezier(.22,1,.36,1), filter .15s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .orb-node-press:active { transform:translate(-50%,-50%) scale(0.82) !important; filter:brightness(0.9); }

  .orb-center-press {
    cursor:pointer;
    touch-action:manipulation;
    transition: transform .15s cubic-bezier(.22,1,.36,1);
    -webkit-tap-highlight-color: transparent;
  }
  .orb-center-press:active { transform:translate(-50%,-50%) scale(0.9) !important; }

  .orb-close-btn {
    transition: opacity .14s ease, transform .14s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .orb-close-btn:active { opacity:0.5; transform:scale(0.88); }
`;

export default function OrbCompass({ visible, isTalent = false, onClose, onWorldSelect }) {
  const [phase, setPhase] = useState("hidden"); // hidden | opening | open | closing

  useEffect(() => {
    if (visible && phase === "hidden") {
      setPhase("open");
    }
    if (!visible && phase !== "hidden") {
      setPhase("hidden");
    }
  }, [visible]);

  const close = useCallback(() => {
    setPhase("closing");
    setTimeout(() => { setPhase("hidden"); onClose?.(); }, 220);
  }, [onClose]);

  const selectWorld = useCallback((world) => {
    setPhase("closing");
    setTimeout(() => {
      setPhase("hidden");
      onClose?.();
      onWorldSelect?.(world.id, world.label);
    }, 200);
  }, [onClose, onWorldSelect]);

  if (phase === "hidden") return null;

  // Responsive sizing
  const vw = Math.min(window.innerWidth, 430);
  const vh = window.innerHeight;

  // Stage is a square that fits comfortably in the screen
  const stageSize = Math.min(vw - 32, vh * 0.52, 380);
  const cx = stageSize / 2;
  const cy = stageSize / 2;

  // Orbit radius — nodes sit on this circle
  const R = stageSize * 0.375;

  // Node circle size
  const nodeR = Math.min(stageSize * 0.135, 52);

  // Center orb size
  const ctrR = Math.min(stageSize * 0.165, 68);

  const panelClass = phase === "closing" ? "orb-panel-out" : "orb-panel-in";

  return (
    <div
      className="orb-bg-in"
      style={{
        position:   "fixed",
        inset:      0,
        zIndex:     9200,
        display:    "flex",
        flexDirection: "column",
        alignItems: "center",
        // Feed visible + blurred behind
        backdropFilter: "blur(20px) brightness(0.88)",
        WebkitBackdropFilter: "blur(20px) brightness(0.88)",
        background: `linear-gradient(170deg, ${D.bgTop}E6 0%, ${D.bgBot}E6 100%)`,
      }}
      onClick={close}
    >
      <style>{CSS}</style>

      {/* Inner panel — stops click propagation */}
      <div
        className={panelClass}
        onClick={e => e.stopPropagation()}
        style={{
          width:  "100%",
          flex:   1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: `max(56px,calc(48px + env(safe-area-inset-top,0px))) 0 max(40px,calc(32px + env(safe-area-inset-bottom,0px)))`,
        }}
      >
        {/* ✕ Close — top left */}
        <button
          className="orb-close-btn"
          onClick={close}
          style={{
            position:   "absolute",
            top:        "max(52px,calc(44px + env(safe-area-inset-top,0px)))",
            left:       20,
            background: "none",
            border:     "none",
            fontSize:   26,
            color:      D.ink,
            cursor:     "pointer",
            touchAction:"manipulation",
            lineHeight: 1,
            padding:    "4px 6px",
            fontWeight: 300,
          }}
          aria-label="Schließen"
        >×</button>

        {/* ── Title block ─────────────────────────────── */}
        <div
          style={{
            textAlign:   "center",
            marginBottom: 36,
            animation:   "orb-title .35s ease .05s both",
          }}
        >
          <h1 style={{
            fontSize:      Math.min(32, vw * 0.08),
            fontWeight:    900,
            color:         D.ink,
            letterSpacing: "-0.045em",
            lineHeight:    1.18,
            margin:        "0 0 11px",
            fontFamily:    "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
          }}>
            Wonach suchst<br />du heute?
          </h1>
          <p style={{
            fontSize:   Math.min(15, vw * 0.038),
            color:      D.inkSoft,
            lineHeight: 1.65,
            margin:     0,
            fontWeight: 400,
            maxWidth:   260,
            padding:    "0 24px",
          }}>
            Wähle einen Bereich oder tippe<br />
            in die Mitte, um einen Moment<br />
            zu teilen.
          </p>
        </div>

        {/* ── Compass stage ───────────────────────────── */}
        <div style={{
          position: "relative",
          width:    stageSize,
          height:   stageSize,
          flexShrink: 0,
        }}>
          {/* Pentagon track lines (SVG) */}
          <svg
            style={{ position:"absolute", inset:0, overflow:"visible", pointerEvents:"none" }}
            width={stageSize}
            height={stageSize}
          >
            <path
              d={pentagonPath(R, cx, cy)}
              fill="none"
              stroke={D.track}
              strokeWidth={1.2}
              strokeDasharray="5 5"
            />
          </svg>

          {/* World nodes */}
          {WORLDS.map((w, i) => {
            const pos = xy(w.deg, R);
            return (
              <div
                key={w.id}
                className="orb-node-press"
                onClick={() => selectWorld(w)}
                style={{
                  position:  "absolute",
                  left:      cx + pos.x,
                  top:       cy + pos.y,
                  transform: "translate(-50%,-50%)",
                  display:   "flex",
                  flexDirection: "column",
                  alignItems:   "center",
                  gap:           7,
                  userSelect:   "none",
                  animation:    `orb-node .38s cubic-bezier(.34,1.56,.64,1) ${i * 55 + 80}ms both`,
                }}
              >
                {/* Circle */}
                <div style={{
                  width:        nodeR * 2,
                  height:       nodeR * 2,
                  borderRadius: "50%",
                  background:   w.bg,
                  display:      "flex",
                  alignItems:   "center",
                  justifyContent: "center",
                  fontSize:     nodeR * 0.88,
                  boxShadow:    `0 5px 20px rgba(0,0,0,0.20), 0 0 0 3px rgba(255,255,255,0.70)`,
                }}>
                  {w.emoji}
                </div>
                {/* Label */}
                <span style={{
                  fontSize:      Math.min(13.5, vw * 0.034),
                  fontWeight:    700,
                  color:         D.ink,
                  letterSpacing: "-0.01em",
                  whiteSpace:    "nowrap",
                  textShadow:    "0 1px 6px rgba(255,255,255,0.85)",
                }}>
                  {w.label}
                </span>
              </div>
            );
          })}

          {/* ── Center HUI Orb ──────────────────────── */}
          <div
            className="orb-center-press"
            style={{
              position:  "absolute",
              left:      cx,
              top:       cy,
              transform: "translate(-50%,-50%)",
              zIndex:    5,
              animation: "orb-center .42s cubic-bezier(.34,1.56,.64,1) .12s both",
            }}
          >
            {/* Pulsing glow ring */}
            <div
              className="orb-pulse"
              style={{
                width:        ctrR * 2,
                height:       ctrR * 2,
                borderRadius: "50%",
                // Conic teal → coral like HUI logo
                background:   `conic-gradient(from 0deg,
                  ${D.teal}   0%,
                  #6EE8E2    22%,
                  ${D.coral} 50%,
                  #F4927A    72%,
                  ${D.teal}  100%)`,
                display:       "flex",
                alignItems:    "center",
                justifyContent:"center",
                boxShadow:     `0 6px 32px rgba(14,196,184,0.42), 0 2px 12px rgba(232,87,58,0.22)`,
              }}
            >
              {/* White ring */}
              <div style={{
                width:        ctrR * 2 - 8,
                height:       ctrR * 2 - 8,
                borderRadius: "50%",
                background:   "#FFFFFF",
                display:      "flex",
                alignItems:   "center",
                justifyContent:"center",
                boxShadow:    "inset 0 1px 8px rgba(0,0,0,0.07)",
              }}>
                {/* Logo core */}
                <div style={{
                  width:        ctrR * 2 - 22,
                  height:       ctrR * 2 - 22,
                  borderRadius: "50%",
                  background:   `linear-gradient(135deg, ${D.teal} 0%, ${D.tealDark} 100%)`,
                  display:      "flex",
                  alignItems:   "center",
                  justifyContent:"center",
                }}>
                  <span style={{
                    fontSize:      ctrR * 0.58,
                    fontWeight:    900,
                    color:         "#FFFFFF",
                    fontFamily:    "system-ui,-apple-system",
                    letterSpacing: "-0.06em",
                    lineHeight:    1,
                    userSelect:    "none",
                  }}>hui</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom hint ─────────────────────────────── */}
        <div style={{
          marginTop:  28,
          textAlign:  "center",
          animation:  "orb-hint .35s ease .45s both",
        }}>
          {/* Arrow up */}
          <div style={{
            fontSize:   22,
            color:      D.teal,
            lineHeight: 1,
            marginBottom: 6,
          }}>↑</div>
          <p style={{
            fontSize:   13.5,
            color:      D.inkSoft,
            lineHeight: 1.7,
            margin:     0,
            fontWeight: 400,
          }}>
            In die Mitte tippen,<br />
            um einen<br />
            <strong style={{ color: D.teal, fontWeight: 800 }}>HUI-Moment</strong><br />
            zu teilen
          </p>
        </div>

      </div>
    </div>
  );
}
