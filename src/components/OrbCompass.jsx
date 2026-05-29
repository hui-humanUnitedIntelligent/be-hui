// src/components/OrbCompass.jsx — HUI Begegnungs-Kompass V1.5 PREMIUM
// Funktion: 100% identisch zu V1
// Änderungen: ausschließlich visuell — Premium Look, echtes HUI-Logo,
//             glassmorphism, organische Kompass-Struktur, breathing-Animation
// ════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from "react";

// ── HUI Logo URL (original uploaded asset) ───────────────────────
const HUI_LOGO = "https://base44.app/api/apps/69e91ff9d24a19ce6f9abd25/files/mp/public/69e91ff9d24a19ce6f9abd25/e24f00405_hui_logo.png";

// ── Design ───────────────────────────────────────────────────────
const D = {
  // Hintergrund — sanftes Mint-Cream wie Screenshot
  bg0: "rgba(232,244,240,0.96)",
  bg1: "rgba(210,236,228,0.96)",
  // HUI Logo farben für Glows
  teal:      "#0EC4B8",
  tealLight: "rgba(14,196,184,0.18)",
  tealGlow:  "rgba(14,196,184,0.35)",
  coral:     "#E8573A",
  coralGlow: "rgba(232,87,58,0.22)",
  // Typo
  ink:      "#1B3530",
  inkSoft:  "rgba(27,53,48,0.56)",
  inkFaint: "rgba(27,53,48,0.32)",
  // Track
  track:    "rgba(27,53,48,0.11)",
  trackGlow:"rgba(14,196,184,0.10)",
};

// ── Five Worlds ───────────────────────────────────────────────────
// Positionen: Pentagon, 72° Schritte ab 270° (top = Natur)
const WORLDS = [
  {
    id:"natur", label:"Natur", emoji:"🌿", deg:270,
    bg:"linear-gradient(145deg,#4A9B52,#2E7D34)",
    glow:"rgba(74,155,82,0.45)",
    ring:"rgba(74,155,82,0.30)",
  },
  {
    id:"kreativitaet", label:"Kreativität", emoji:"🎨", deg:342,
    bg:"linear-gradient(145deg,#D85A3A,#C04028)",
    glow:"rgba(216,90,58,0.45)",
    ring:"rgba(216,90,58,0.28)",
  },
  {
    id:"tiere", label:"Tiere", emoji:"🐾", deg:54,
    bg:"linear-gradient(145deg,#2A9E90,#1B7868)",
    glow:"rgba(42,158,144,0.42)",
    ring:"rgba(42,158,144,0.28)",
  },
  {
    id:"wirkung", label:"Wirkung", emoji:"🌍", deg:126,
    bg:"linear-gradient(145deg,#3460BE,#2248A0)",
    glow:"rgba(52,96,190,0.42)",
    ring:"rgba(52,96,190,0.26)",
  },
  {
    id:"gemeinschaft", label:"Gemeinschaft", emoji:"🤝", deg:198,
    bg:"linear-gradient(145deg,#E09028,#C87A18)",
    glow:"rgba(224,144,40,0.45)",
    ring:"rgba(224,144,40,0.28)",
  },
];

function polar(deg, r) {
  const rad = (deg - 90) * (Math.PI / 180);
  return { x: Math.cos(rad) * r, y: Math.sin(rad) * r };
}

// SVG pentagon path
function pentagonD(r, cx, cy) {
  return WORLDS.map((w, i) => {
    const { x, y } = polar(w.deg, r);
    return `${i === 0 ? "M" : "L"} ${(cx + x).toFixed(1)} ${(cy + y).toFixed(1)}`;
  }).join(" ") + " Z";
}

// ── CSS ───────────────────────────────────────────────────────────
const CSS = `
  @keyframes orb-in        { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
  @keyframes orb-out       { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(0.92)} }
  @keyframes orb-title-in  { from{opacity:0;transform:translateY(-14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes orb-node-in   {
    from { opacity:0; transform:translate(-50%,-50%) scale(0.35) }
    to   { opacity:1; transform:translate(-50%,-50%) scale(1) }
  }
  @keyframes orb-center-in {
    from { opacity:0; transform:translate(-50%,-50%) scale(0.2) }
    to   { opacity:1; transform:translate(-50%,-50%) scale(1) }
  }
  @keyframes orb-hint-in   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

  /* Living animations */
  @keyframes orb-breathe {
    0%,100% { transform:translate(-50%,-50%) scale(1) }
    50%     { transform:translate(-50%,-50%) scale(1.04) }
  }
  @keyframes orb-glow-pulse {
    0%,100% { opacity:0.6; box-shadow:0 0 0 0 rgba(14,196,184,0.55), 0 0 40px rgba(14,196,184,0.20) }
    50%     { opacity:1;   box-shadow:0 0 0 20px rgba(14,196,184,0), 0 0 60px rgba(14,196,184,0.35) }
  }
  @keyframes orb-ring-spin {
    from { transform:rotate(0deg) }
    to   { transform:rotate(360deg) }
  }
  @keyframes orb-track-glow {
    0%,100% { opacity:0.35 }
    50%     { opacity:0.65 }
  }

  /* Glassmorphism backdrop */
  .orb-glass {
    backdrop-filter: blur(32px) saturate(1.4) brightness(0.9);
    -webkit-backdrop-filter: blur(32px) saturate(1.4) brightness(0.9);
    background: linear-gradient(165deg, ${D.bg0} 0%, ${D.bg1} 100%);
  }

  /* Panel enter/exit */
  .orb-in  { animation: orb-in  .38s cubic-bezier(.22,1,.36,1) both }
  .orb-out { animation: orb-out .22s cubic-bezier(.22,1,.36,1) both }

  /* Center */
  .orb-center-breathe {
    animation:
      orb-center-in .48s cubic-bezier(.34,1.56,.64,1) .08s both,
      orb-breathe 4.5s ease-in-out 0.8s infinite;
  }
  .orb-logo-glow {
    animation: orb-glow-pulse 3s ease-in-out infinite;
  }
  .orb-ring-layer {
    animation: orb-ring-spin 18s linear infinite;
  }
  .orb-track-breathing {
    animation: orb-track-glow 4s ease-in-out infinite;
  }

  /* Node hover press */
  .orb-node {
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: filter .16s ease;
  }
  .orb-node:active .orb-node-circle {
    transform: scale(0.83);
    filter: brightness(0.88);
  }
  .orb-node-circle {
    transition: transform .18s cubic-bezier(.22,1,.36,1), filter .18s ease, box-shadow .18s ease;
  }
  .orb-node:hover .orb-node-circle {
    transform: scale(1.08);
    filter: brightness(1.06);
  }

  /* Close btn */
  .orb-x {
    -webkit-tap-highlight-color: transparent;
    transition: opacity .14s ease, transform .14s ease;
  }
  .orb-x:active { opacity:0.45; transform:scale(0.85); }
`;

// ═══════════════════════════════════════════════════════════════
export default function OrbCompass({ visible, isTalent = false, onClose, onWorldSelect }) {
  const [phase, setPhase] = useState("hidden"); // hidden | open | closing

  useEffect(() => {
    if (visible  && phase === "hidden")  setPhase("open");
    if (!visible && phase !== "hidden")  setPhase("hidden");
  }, [visible]);

  const close = useCallback(() => {
    setPhase("closing");
    setTimeout(() => { setPhase("hidden"); onClose?.(); }, 230);
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

  // ── Responsive sizing ──────────────────────────────────────────
  const vw = Math.min(window.innerWidth, 430);
  const vh = window.innerHeight;

  // Stage — generous so compass feels dominant
  const stageSize = Math.min(vw - 16, vh * 0.50, 400);
  const cx = stageSize / 2;
  const cy = stageSize / 2;

  // Orbit — nodes sit here
  const R = stageSize * 0.385;

  // Node size
  const nodeD = Math.min(stageSize * 0.148, 58); // diameter

  // Center logo size — 25% bigger than nodes
  const ctrD = Math.min(stageSize * 0.210, 88);  // diameter

  // Decorative ring around center (between center and nodes)
  const ringD = ctrD + 22;

  const isClosing = phase === "closing";

  return (
    <div
      className={`orb-glass ${isClosing ? "orb-out" : "orb-in"}`}
      style={{
        position: "fixed", inset: 0, zIndex: 9200,
        display: "flex", flexDirection: "column",
        alignItems: "center",
      }}
      onClick={close}
    >
      <style>{CSS}</style>

      {/* Inner — stops backdrop tap propagation */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", flex: 1,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: `max(52px,calc(44px + env(safe-area-inset-top,0px))) 0
                    max(36px,calc(28px + env(safe-area-inset-bottom,0px)))`,
        }}
      >
        {/* ✕ Close ──────────────────────────────────── */}
        <button
          className="orb-x"
          onClick={close}
          aria-label="Schließen"
          style={{
            position: "absolute",
            top: "max(52px,calc(44px + env(safe-area-inset-top,0px)))",
            left: 22,
            background: "none", border: "none",
            fontSize: 28, color: D.ink,
            cursor: "pointer", touchAction: "manipulation",
            lineHeight: 1, padding: "2px 6px", fontWeight: 300,
          }}
        >×</button>

        {/* ── Title ──────────────────────────────────── */}
        <div style={{
          textAlign: "center", marginBottom: 32,
          animation: "orb-title-in .38s ease .04s both",
        }}>
          <h1 style={{
            fontSize: Math.min(33, vw * 0.082),
            fontWeight: 900, color: D.ink,
            letterSpacing: "-0.048em", lineHeight: 1.17,
            margin: "0 0 13px",
            fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
          }}>
            Wonach suchst<br/>du heute?
          </h1>
          <p style={{
            fontSize: Math.min(15, vw * 0.037),
            color: D.inkSoft, lineHeight: 1.65,
            margin: 0, fontWeight: 400, maxWidth: 250,
          }}>
            Entdecke die Welt,<br/>die dich heute bewegt.
          </p>
        </div>

        {/* ── Compass Stage ──────────────────────────── */}
        <div style={{ position: "relative", width: stageSize, height: stageSize, flexShrink: 0 }}>

          {/* SVG layers: outer glow ring + pentagon track + spoke lines */}
          <svg
            style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
            width={stageSize} height={stageSize}
          >
            <defs>
              {/* Radial gradient for track glow */}
              <radialGradient id="trackGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor={D.teal} stopOpacity="0.18"/>
                <stop offset="100%" stopColor={D.teal} stopOpacity="0"/>
              </radialGradient>
              {/* Conic-ish gradient ring — use linearGradient trick */}
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor={D.teal}  stopOpacity="0.55"/>
                <stop offset="50%"  stopColor={D.coral} stopOpacity="0.38"/>
                <stop offset="100%" stopColor={D.teal}  stopOpacity="0.55"/>
              </linearGradient>
            </defs>

            {/* Outer glow halo behind the compass */}
            <circle
              cx={cx} cy={cy} r={R + nodeD * 0.7}
              fill="url(#trackGrad)" opacity="0.5"
            />

            {/* Pentagon track — dashed elegant */}
            <path
              d={pentagonD(R, cx, cy)}
              fill="none"
              stroke={D.track}
              strokeWidth="1.4"
              strokeDasharray="6 5"
              strokeLinecap="round"
              className="orb-track-breathing"
            />

            {/* Spoke lines from center to each node midpoint */}
            {WORLDS.map(w => {
              const mid = polar(w.deg, R * 0.48);
              return (
                <line
                  key={w.id + "-spoke"}
                  x1={cx} y1={cy}
                  x2={cx + mid.x} y2={cy + mid.y}
                  stroke={D.track} strokeWidth="1" opacity="0.45"
                  strokeDasharray="3 4"
                />
              );
            })}

            {/* Connection dots at each node position */}
            {WORLDS.map(w => {
              const p = polar(w.deg, R);
              return (
                <circle
                  key={w.id + "-dot"}
                  cx={cx + p.x} cy={cy + p.y} r="3.5"
                  fill="white" opacity="0.55"
                  stroke={D.track} strokeWidth="1"
                />
              );
            })}
          </svg>

          {/* World Nodes ─────────────────────────────────────── */}
          {WORLDS.map((w, i) => {
            const pos = polar(w.deg, R);
            return (
              <div
                key={w.id}
                className="orb-node"
                onClick={() => selectWorld(w)}
                style={{
                  position: "absolute",
                  left: cx + pos.x, top: cy + pos.y,
                  transform: "translate(-50%,-50%)",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 8,
                  userSelect: "none",
                  animation: `orb-node-in .42s cubic-bezier(.34,1.56,.64,1) ${i * 60 + 90}ms both`,
                }}
              >
                {/* Outer glow halo */}
                <div style={{
                  position: "absolute",
                  width: nodeD + 18, height: nodeD + 18,
                  borderRadius: "50%",
                  background: w.ring,
                  filter: "blur(8px)",
                  top: "50%", left: "50%",
                  transform: "translate(-50%, calc(-50% - 4px))",
                  pointerEvents: "none",
                }}/>

                {/* Node circle */}
                <div
                  className="orb-node-circle"
                  style={{
                    width: nodeD, height: nodeD,
                    borderRadius: "50%",
                    background: w.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: nodeD * 0.44,
                    boxShadow: `
                      0 6px 24px ${w.glow},
                      0 2px 8px rgba(0,0,0,0.18),
                      0 0 0 3.5px rgba(255,255,255,0.75),
                      inset 0 1px 2px rgba(255,255,255,0.25)
                    `,
                  }}
                >
                  {w.emoji}
                </div>

                {/* Label */}
                <span style={{
                  fontSize: Math.min(13, vw * 0.033),
                  fontWeight: 700, color: D.ink,
                  letterSpacing: "-0.01em", whiteSpace: "nowrap",
                  textShadow: "0 1px 8px rgba(255,255,255,0.95), 0 1px 2px rgba(255,255,255,0.8)",
                }}>
                  {w.label}
                </span>
              </div>
            );
          })}

          {/* CENTER — Echtes HUI-Logo ───────────────────────── */}
          <div
            className="orb-center-breathe"
            style={{
              position: "absolute",
              left: cx, top: cy,
              transform: "translate(-50%,-50%)",
              zIndex: 10,
            }}
          >
            {/* Outer animated teal+coral ring */}
            <div
              className="orb-ring-layer"
              style={{
                position: "absolute",
                width: ringD, height: ringD,
                borderRadius: "50%",
                top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                background: `conic-gradient(
                  from 0deg,
                  rgba(14,196,184,0.70) 0%,
                  rgba(14,196,184,0.15) 25%,
                  rgba(232,87,58,0.65) 50%,
                  rgba(232,87,58,0.15) 75%,
                  rgba(14,196,184,0.70) 100%
                )`,
                borderRadius: "50%",
                pointerEvents: "none",
              }}
            />

            {/* White gap ring */}
            <div style={{
              position: "absolute",
              width: ringD - 4, height: ringD - 4,
              borderRadius: "50%",
              background: "rgba(240,248,244,0.92)",
              top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              pointerEvents: "none",
            }}/>

            {/* Logo container with glow */}
            <div
              className="orb-logo-glow"
              style={{
                width: ctrD, height: ctrD,
                borderRadius: "50%",
                overflow: "hidden",
                position: "relative",
                boxShadow: `
                  0 0 0 0 rgba(14,196,184,0.55),
                  0 8px 40px rgba(14,196,184,0.30),
                  0 4px 16px rgba(232,87,58,0.18),
                  0 2px 8px rgba(0,0,0,0.12),
                  0 0 0 4px rgba(255,255,255,0.90)
                `,
              }}
            >
              <img
                src={HUI_LOGO}
                alt="HUI"
                style={{
                  width: "100%", height: "100%",
                  objectFit: "cover", display: "block",
                  borderRadius: "50%",
                }}
              />
            </div>
          </div>

        </div>{/* / compass stage */}

        {/* ── Bottom hint ─────────────────────────────── */}
        {isTalent && (
          <div style={{
            marginTop: 26, textAlign: "center",
            animation: "orb-hint-in .36s ease .5s both",
          }}>
            <div style={{ fontSize: 20, color: D.teal, lineHeight: 1, marginBottom: 6 }}>↑</div>
            <p style={{
              fontSize: 13.5, color: D.inkSoft, lineHeight: 1.72,
              margin: 0, fontWeight: 400,
            }}>
              In die Mitte tippen,<br/>um einen<br/>
              <strong style={{ color: D.teal, fontWeight: 800 }}>HUI-Moment</strong><br/>
              zu teilen
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
