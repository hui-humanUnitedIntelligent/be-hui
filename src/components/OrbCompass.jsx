// src/components/OrbCompass.jsx — HUI Begegnungs-Kompass V2 ATMOSPHERE
// Referenz: Screenshot 29.05.2026 — Glasssphären, schwebender Kompass, Feed sichtbar
// Funktion: 100% identisch zu V1. Ausschließlich visuelle Veredelung.
// ════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from "react";

// ── HUI Logo (original asset) ─────────────────────────────────────
const HUI_LOGO = "https://base44.app/api/apps/69e91ff9d24a19ce6f9abd25/files/mp/public/69e91ff9d24a19ce6f9abd25/e24f00405_hui_logo.png";

// ── Design ───────────────────────────────────────────────────────
const D = {
  ink:       "#1A3530",
  inkTeal:   "#0D6B5E",
  inkSoft:   "rgba(26,53,48,0.58)",
  inkFaint:  "rgba(26,53,48,0.34)",
  teal:      "#0EC4B8",
  tealDeep:  "#0D9E94",
  coral:     "#E8573A",
  track:     "rgba(255,255,255,0.70)",
  trackSoft: "rgba(255,255,255,0.45)",
  dot:       "rgba(255,255,255,0.95)",
};

// ── Five Worlds — glass sphere definitions ────────────────────────
// Each world: glassmorphism sphere with unique gradient + emoji + label
const WORLDS = [
  {
    id:    "natur",
    label: "Natur",
    emoji: "🌿",
    deg:   270,  // top
    // Glass sphere: green tones
    sphereGrad: "radial-gradient(circle at 38% 32%, rgba(180,230,160,0.95) 0%, rgba(100,180,100,0.85) 45%, rgba(60,140,70,0.80) 100%)",
    sphereGlow: "rgba(80,180,90,0.55)",
    rimLight:   "rgba(200,240,180,0.90)",
    accent:     "#3A8A42",
  },
  {
    id:    "kreativitaet",
    label: "Kreativität",
    emoji: "🎨",
    deg:   342,  // upper-right
    sphereGrad: "radial-gradient(circle at 38% 32%, rgba(255,210,190,0.95) 0%, rgba(240,140,110,0.88) 45%, rgba(210,80,60,0.82) 100%)",
    sphereGlow: "rgba(230,100,70,0.55)",
    rimLight:   "rgba(255,220,200,0.90)",
    accent:     "#C84030",
  },
  {
    id:    "tiere",
    label: "Tiere",
    emoji: "🐾",
    deg:   54,   // lower-right
    sphereGrad: "radial-gradient(circle at 38% 32%, rgba(180,235,230,0.95) 0%, rgba(80,195,185,0.88) 45%, rgba(30,140,130,0.82) 100%)",
    sphereGlow: "rgba(40,180,168,0.52)",
    rimLight:   "rgba(190,240,235,0.90)",
    accent:     "#18807A",
  },
  {
    id:    "wirkung",
    label: "Wirkung",
    emoji: "🌍",
    deg:   126,  // lower-left
    sphereGrad: "radial-gradient(circle at 38% 32%, rgba(180,215,240,0.95) 0%, rgba(90,155,215,0.88) 45%, rgba(40,90,180,0.82) 100%)",
    sphereGlow: "rgba(60,120,210,0.50)",
    rimLight:   "rgba(190,220,250,0.90)",
    accent:     "#2850A8",
  },
  {
    id:    "gemeinschaft",
    label: "Gemeinschaft",
    emoji: "🤝",
    deg:   198,  // left
    sphereGrad: "radial-gradient(circle at 38% 32%, rgba(255,230,185,0.95) 0%, rgba(240,175,80,0.88) 45%, rgba(210,130,30,0.82) 100%)",
    sphereGlow: "rgba(225,155,40,0.52)",
    rimLight:   "rgba(255,235,190,0.90)",
    accent:     "#C88018",
  },
];

function polar(deg, r) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: Math.cos(rad) * r, y: Math.sin(rad) * r };
}

// ── CSS keyframes ─────────────────────────────────────────────────
const CSS = `
  /* ── Overlay ── */
  @keyframes oatm-in  { from{opacity:0} to{opacity:1} }
  @keyframes oatm-out { from{opacity:1} to{opacity:0} }

  /* ── Title ── */
  @keyframes oatm-title {
    from { opacity:0; transform:translateY(-18px) }
    to   { opacity:1; transform:translateY(0) }
  }

  /* ── Center orb rises from bottom ── */
  @keyframes oatm-center-rise {
    0%   { opacity:0; transform:translate(-50%,-50%) scale(0.3) translateY(60px) }
    60%  { opacity:1; transform:translate(-50%,-50%) scale(1.06) translateY(-4px) }
    100% { opacity:1; transform:translate(-50%,-50%) scale(1) translateY(0) }
  }

  /* ── Light pulse radiates from center ── */
  @keyframes oatm-radiate {
    0%   { opacity:0.7; transform:translate(-50%,-50%) scale(0.4) }
    100% { opacity:0;   transform:translate(-50%,-50%) scale(2.2) }
  }

  /* ── Track circle draws in ── */
  @keyframes oatm-track-in {
    from { opacity:0; transform:translate(-50%,-50%) scale(0.5) }
    to   { opacity:1; transform:translate(-50%,-50%) scale(1) }
  }

  /* ── Nodes bloom from center ── */
  @keyframes oatm-node-bloom {
    0%   { opacity:0; transform:translate(-50%,-50%) scale(0.15) }
    70%  { opacity:1; transform:translate(-50%,-50%) scale(1.07) }
    100% { opacity:1; transform:translate(-50%,-50%) scale(1) }
  }

  /* ── Hint floats up ── */
  @keyframes oatm-hint {
    from { opacity:0; transform:translateY(16px) }
    to   { opacity:1; transform:translateY(0) }
  }

  /* ── Living: center breathe ── */
  @keyframes oatm-breathe {
    0%,100% { transform:translate(-50%,-50%) scale(1) }
    50%     { transform:translate(-50%,-50%) scale(1.045) }
  }

  /* ── Living: node float ── */
  @keyframes oatm-float {
    0%,100% { transform:translate(-50%,-50%) translateY(0) }
    50%     { transform:translate(-50%,-50%) translateY(-5px) }
  }

  /* ── Living: soft glow pulse ── */
  @keyframes oatm-glow {
    0%,100% { opacity:0.55 }
    50%     { opacity:0.90 }
  }

  /* ── Living: dot twinkle ── */
  @keyframes oatm-twinkle {
    0%,100% { opacity:0.6; transform:translate(-50%,-50%) scale(0.8) }
    50%     { opacity:1.0; transform:translate(-50%,-50%) scale(1.2) }
  }

  /* ── Close ── */
  .oatm-x {
    -webkit-tap-highlight-color:transparent;
    transition:opacity .14s ease, transform .14s ease;
    cursor:pointer;
  }
  .oatm-x:active { opacity:0.4; transform:scale(0.82); }

  /* ── Node tap feedback ── */
  .oatm-node {
    cursor:pointer;
    touch-action:manipulation;
    -webkit-tap-highlight-color:transparent;
  }
  .oatm-sphere {
    transition: transform .18s cubic-bezier(.22,1,.36,1), filter .18s ease;
  }
  .oatm-node:active .oatm-sphere {
    transform: scale(0.82) !important;
    filter: brightness(0.88);
  }
`;

// ── Glass Sphere Component ────────────────────────────────────────
function GlassSphere({ world, size, animDelay }) {
  return (
    <div
      className="oatm-sphere"
      style={{
        width: size, height: size,
        borderRadius: "50%",
        position: "relative",
        overflow: "hidden",
        // Glass sphere base
        background: world.sphereGrad,
        // Multi-layer shadow: color glow + depth + rim
        boxShadow: `
          0 0 ${size * 0.5}px ${world.sphereGlow},
          0 8px 32px rgba(0,0,0,0.16),
          0 2px 8px rgba(0,0,0,0.10),
          inset 0 1.5px 0 ${world.rimLight},
          inset 0 -1px 0 rgba(0,0,0,0.08)
        `,
        // Animate: floating + glow
        animation: `oatm-float ${4.2 + animDelay * 0.3}s ease-in-out ${animDelay * 0.4}s infinite`,
      }}
    >
      {/* Inner glass highlight — top-left rim light */}
      <div style={{
        position: "absolute",
        top: "8%", left: "10%",
        width: "42%", height: "38%",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0) 100%)",
        pointerEvents: "none",
      }}/>
      {/* Bottom inner shadow */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0, height: "35%",
        background: "linear-gradient(to top, rgba(0,0,0,0.12) 0%, transparent 100%)",
        pointerEvents: "none",
      }}/>
      {/* Emoji centered */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.38,
        filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.18))",
      }}>
        {world.emoji}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
export default function OrbCompass({ visible, isTalent = false, onClose, onWorldSelect }) {
  const [phase,   setPhase]   = useState("hidden");
  const [logoOk,  setLogoOk]  = useState(false);

  useEffect(() => {
    if (visible  && phase === "hidden") setPhase("open");
    if (!visible && phase !== "hidden") setPhase("hidden");
  }, [visible]);

  const close = useCallback(() => {
    setPhase("closing");
    setTimeout(() => { setPhase("hidden"); onClose?.(); }, 240);
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
  const isClosing = phase === "closing";

  // ── Responsive ─────────────────────────────────────────────────
  const vw     = Math.min(window.innerWidth,  430);
  const vh     =         window.innerHeight;

  // Stage — generous, dominates the screen
  const stage  = Math.min(vw - 8, vh * 0.54, 420);
  const cx     = stage / 2;
  const cy     = stage / 2;

  // Orbit radius — nodes sit here
  const R      = stage * 0.390;

  // Sphere size — the glass orbs
  const sphD   = Math.min(stage * 0.210, 86);   // ~86px

  // Center logo size
  const ctrD   = Math.min(stage * 0.230, 96);   // ~96px

  // Track ring radii
  const r1     = R - sphD * 0.05;  // just inside nodes
  const r2     = R * 0.52;         // inner decorative ring

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9200,
        // Feed stays visible, blur it
        backdropFilter: "blur(28px) saturate(1.3) brightness(0.86)",
        WebkitBackdropFilter: "blur(28px) saturate(1.3) brightness(0.86)",
        // Very light overlay so feed color shows through
        background: "linear-gradient(170deg, rgba(235,246,242,0.90) 0%, rgba(212,236,228,0.90) 100%)",
        display: "flex", flexDirection: "column", alignItems: "center",
        animation: isClosing ? "oatm-out .24s ease both" : "oatm-in .30s ease both",
      }}
      onClick={close}
    >
      <style>{CSS}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", flex: 1,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: `max(52px,calc(44px + env(safe-area-inset-top,0px)))
                    0
                    max(36px,calc(28px + env(safe-area-inset-bottom,0px)))`,
        }}
      >

        {/* ── ✕ Close ────────────────────────────────── */}
        <button
          className="oatm-x"
          onClick={close}
          aria-label="Schließen"
          style={{
            position: "absolute",
            top: "max(52px,calc(44px + env(safe-area-inset-top,0px)))",
            left: 20,
            background: "none", border: "none",
            fontSize: 26, color: D.inkTeal,
            fontWeight: 300, lineHeight: 1,
            padding: "4px 8px",
            touchAction: "manipulation",
          }}
        >×</button>

        {/* ── Title ──────────────────────────────────── */}
        <div style={{
          textAlign: "center",
          marginBottom: stage * 0.07,
          animation: "oatm-title .40s ease .05s both",
        }}>
          <h1 style={{
            fontSize:      Math.min(34, vw * 0.084),
            fontWeight:    900,
            color:         D.inkTeal,
            letterSpacing: "-0.046em",
            lineHeight:    1.16,
            margin:        "0 0 10px",
            fontFamily:    "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
          }}>
            Wonach suchst<br/>du heute?
          </h1>
          <p style={{
            fontSize:   Math.min(15, vw * 0.037),
            color:      D.inkSoft,
            lineHeight: 1.60,
            margin:     0,
            fontWeight: 400,
          }}>
            Entdecke die Welt,<br/>die dich heute bewegt.
          </p>
        </div>

        {/* ════ COMPASS STAGE ════════════════════════ */}
        <div style={{ position: "relative", width: stage, height: stage, flexShrink: 0 }}>

          {/* ── SVG: tracks, spokes, connection dots ── */}
          <svg
            style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
            width={stage} height={stage}
          >
            <defs>
              {/* Radial glow behind whole compass */}
              <radialGradient id="compassGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="rgba(14,196,184,0.22)"/>
                <stop offset="60%"  stopColor="rgba(14,196,184,0.06)"/>
                <stop offset="100%" stopColor="rgba(14,196,184,0)"/>
              </radialGradient>

              {/* Glow filter for dots */}
              <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>

              {/* Spoke gradient: teal center → transparent */}
              <linearGradient id="spokeGrad" x1="50%" y1="50%" x2="100%" y2="50%" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="rgba(14,196,184,0.35)"/>
                <stop offset="100%" stopColor="rgba(14,196,184,0.05)"/>
              </linearGradient>
            </defs>

            {/* Soft glow halo behind compass */}
            <circle cx={cx} cy={cy} r={R + sphD * 0.6}
              fill="url(#compassGlow)" opacity="0.8"
              style={{ animation: "oatm-glow 5s ease-in-out infinite" }}
            />

            {/* Outer track ring */}
            <circle cx={cx} cy={cy} r={r1}
              fill="none"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth="1.2"
              style={{ animation: "oatm-track-in .55s ease .18s both" }}
            />

            {/* Inner decorative ring */}
            <circle cx={cx} cy={cy} r={r2}
              fill="none"
              stroke="rgba(255,255,255,0.40)"
              strokeWidth="0.8"
              strokeDasharray="4 6"
              style={{ animation: "oatm-track-in .55s ease .22s both" }}
            />

            {/* Spokes: center → each node (stop at inner ring) */}
            {WORLDS.map(w => {
              const near = polar(w.deg, r2 * 0.85);
              const far  = polar(w.deg, r1 * 0.88);
              return (
                <line key={w.id + "-sp"}
                  x1={cx + near.x} y1={cy + near.y}
                  x2={cx + far.x}  y2={cy + far.y}
                  stroke="rgba(255,255,255,0.50)"
                  strokeWidth="0.9"
                  strokeDasharray="3 4"
                />
              );
            })}

            {/* Connection dots on outer ring — glowing white */}
            {WORLDS.map((w, i) => {
              const p = polar(w.deg, r1);
              return (
                <circle key={w.id + "-dot"}
                  cx={cx + p.x} cy={cy + p.y} r="4.5"
                  fill="white"
                  filter="url(#dotGlow)"
                  opacity="0.9"
                  style={{ animation: `oatm-twinkle ${2.8 + i * 0.4}s ease-in-out ${i * 0.3}s infinite` }}
                />
              );
            })}

            {/* Inner ring dots */}
            {WORLDS.map(w => {
              const p = polar(w.deg, r2);
              return (
                <circle key={w.id + "-idot"}
                  cx={cx + p.x} cy={cy + p.y} r="2.5"
                  fill="rgba(255,255,255,0.65)"
                />
              );
            })}
          </svg>

          {/* ── Light radiate from center (on open) ── */}
          <div style={{
            position: "absolute", left: cx, top: cy,
            width: ctrD, height: ctrD,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(14,196,184,0.50) 0%, transparent 70%)",
            animation: "oatm-radiate 1.0s cubic-bezier(.22,1,.36,1) .05s both",
            pointerEvents: "none",
          }}/>

          {/* ── World Nodes ─────────────────────────── */}
          {WORLDS.map((w, i) => {
            const pos = polar(w.deg, R);
            return (
              <div
                key={w.id}
                className="oatm-node"
                onClick={() => selectWorld(w)}
                style={{
                  position: "absolute",
                  left: cx + pos.x, top: cy + pos.y,
                  transform: "translate(-50%,-50%)",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 9,
                  userSelect: "none",
                  animation: `oatm-node-bloom .50s cubic-bezier(.34,1.56,.64,1) ${i * 65 + 180}ms both`,
                }}
              >
                {/* Outer aura glow */}
                <div style={{
                  position: "absolute",
                  width: sphD + 28, height: sphD + 28,
                  borderRadius: "50%",
                  top: "50%", left: "50%",
                  transform: "translate(-50%, calc(-50% - 5px))",
                  background: `radial-gradient(circle, ${w.sphereGlow} 0%, transparent 70%)`,
                  pointerEvents: "none",
                  filter: "blur(6px)",
                  animation: `oatm-glow ${3.5 + i * 0.5}s ease-in-out ${i * 0.6}s infinite`,
                }}/>

                <GlassSphere world={w} size={sphD} animDelay={i}/>

                {/* Label */}
                <span style={{
                  fontSize: Math.min(13, vw * 0.033),
                  fontWeight: 700,
                  color: D.ink,
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  textShadow: "0 1px 8px rgba(255,255,255,0.95), 0 1px 3px rgba(255,255,255,0.80)",
                }}>
                  {w.label}
                </span>
              </div>
            );
          })}

          {/* ── CENTER HUI LOGO ──────────────────────── */}
          <div
            style={{
              position: "absolute",
              left: cx, top: cy,
              zIndex: 10,
              animation: `
                oatm-center-rise .58s cubic-bezier(.34,1.56,.64,1) .06s both,
                oatm-breathe 4.8s ease-in-out 1.2s infinite
              `,
            }}
          >
            {/* Soft colored aura behind logo */}
            <div style={{
              position: "absolute",
              width: ctrD + 40, height: ctrD + 40,
              borderRadius: "50%",
              top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              background: `radial-gradient(circle,
                rgba(14,196,184,0.28) 0%,
                rgba(232,87,58,0.14) 55%,
                transparent 75%)`,
              filter: "blur(10px)",
              pointerEvents: "none",
              animation: "oatm-glow 4s ease-in-out infinite",
            }}/>

            {/* White clean ring around logo */}
            <div style={{
              position: "absolute",
              width: ctrD + 12, height: ctrD + 12,
              borderRadius: "50%",
              top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              background: "rgba(255,255,255,0.85)",
              boxShadow: "0 4px 24px rgba(14,196,184,0.22), 0 2px 8px rgba(0,0,0,0.08)",
              pointerEvents: "none",
            }}/>

            {/* Logo image */}
            <div style={{
              position: "absolute",
              width: ctrD, height: ctrD,
              borderRadius: "50%",
              top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              overflow: "hidden",
              boxShadow: `
                0 6px 28px rgba(14,196,184,0.30),
                0 2px 10px rgba(232,87,58,0.16),
                0 1px 4px rgba(0,0,0,0.10)
              `,
            }}>
              {!logoOk && (
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${D.teal} 0%, ${D.coral} 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{
                    fontSize: ctrD * 0.30, fontWeight: 900, color: "white",
                    fontFamily: "system-ui", letterSpacing: "-0.05em",
                  }}>hui</span>
                </div>
              )}
              <img
                src={HUI_LOGO}
                alt="HUI"
                onLoad={() => setLogoOk(true)}
                onError={() => setLogoOk(true)}
                style={{
                  width: "100%", height: "100%",
                  objectFit: "cover", display: "block",
                  borderRadius: "50%",
                  opacity: logoOk ? 1 : 0,
                  transition: "opacity .4s ease",
                }}
              />
            </div>
          </div>

        </div>{/* / stage */}

        {/* ── Bottom hint ────────────────────────────── */}
        <div style={{
          marginTop: stage * 0.055,
          textAlign: "center",
          animation: "oatm-hint .40s ease .60s both",
        }}>
          <div style={{ fontSize: 18, color: D.teal, lineHeight: 1, marginBottom: 5 }}>↑</div>
          <p style={{
            fontSize: 13.5, color: D.inkSoft, lineHeight: 1.72, margin: 0, fontWeight: 400,
          }}>
            In die Mitte tippen,<br/>um einen<br/>
            <strong style={{ color: D.teal, fontWeight: 800 }}>HUI-Moment</strong><br/>
            zu teilen
          </p>
        </div>

      </div>
    </div>
  );
}
