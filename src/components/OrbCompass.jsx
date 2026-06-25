// src/components/OrbCompass.jsx — HUI Begegnungs-Kompass V2.1 FINAL POLISH
// Layout: 100% identisch zu V2. Ausschließlich atmosphärische Verfeinerung.
// Änderungen: sphere gradients tiefer, glass highlights präziser,
//             kompass-track subtiler, partikel-glow, center-logo premium depth.
// ════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from "react";
import HuiMomentSheet   from "./HuiMomentSheet.jsx";
import GemeinschaftsFlow from "./GemeinschaftsFlow.jsx";

const HUI_LOGO = "/hui-logo-app.png"; // Branding update — lokales Asset

const D = {
  ink:      "#1A3530",
  inkTeal:  "#0C5E54",
  inkSoft:  "rgba(26,53,48,0.56)",
  teal:     "#0EC4B8",
  tealDeep: "#0D9E94",
  coral:    "#E8573A",
};

// ── Worlds — richer sphere gradients, more depth per identity ────
const WORLDS = [
  {
    id: "natur", label: "Natur", emoji: "🌿", deg: 270,
    // More organic depth: bright center, verdant mid, deep forest edge
    sphereGrad: "radial-gradient(circle at 36% 30%, rgba(210,245,185,0.98) 0%, rgba(120,195,105,0.92) 38%, rgba(55,138,62,0.88) 68%, rgba(35,100,42,0.82) 100%)",
    sphereGlow: "rgba(72,172,80,0.60)",
    rimLight:   "rgba(220,252,195,0.95)",
    // Second inner highlight — more natural light feel
    innerHighlight: "rgba(185,240,155,0.55)",
    floatDur: 4.6, floatDelay: 0.0,
  },
  {
    id: "kreativitaet", label: "Kreativität", emoji: "🎨", deg: 342,
    // Warm coral energy: bright warm highlight, rich coral mid, deep crimson edge
    sphereGrad: "radial-gradient(circle at 36% 30%, rgba(255,225,205,0.98) 0%, rgba(248,152,118,0.92) 38%, rgba(218,82,55,0.88) 68%, rgba(185,52,35,0.82) 100%)",
    sphereGlow: "rgba(228,90,58,0.60)",
    rimLight:   "rgba(255,230,210,0.95)",
    innerHighlight: "rgba(255,195,165,0.50)",
    floatDur: 4.9, floatDelay: 0.5,
  },
  {
    id: "tiere", label: "Tiere", emoji: "🐾", deg: 54,
    // Soft organic teal: nature calm
    sphereGrad: "radial-gradient(circle at 36% 30%, rgba(195,245,240,0.98) 0%, rgba(85,205,195,0.92) 38%, rgba(28,148,138,0.88) 68%, rgba(15,108,100,0.82) 100%)",
    sphereGlow: "rgba(38,172,162,0.56)",
    rimLight:   "rgba(200,248,243,0.95)",
    innerHighlight: "rgba(158,240,232,0.48)",
    floatDur: 5.2, floatDelay: 1.0,
  },
  {
    id: "wirkung", label: "Wirkung", emoji: "🌍", deg: 126,
    // Deep hopeful blue: teal-blue, depth, future
    sphereGrad: "radial-gradient(circle at 36% 30%, rgba(195,225,252,0.98) 0%, rgba(95,162,228,0.92) 38%, rgba(42,98,195,0.88) 68%, rgba(22,65,158,0.82) 100%)",
    sphereGlow: "rgba(52,112,205,0.56)",
    rimLight:   "rgba(200,228,255,0.95)",
    innerHighlight: "rgba(155,200,250,0.45)",
    floatDur: 4.8, floatDelay: 1.5,
  },
  {
    id: "gemeinschaft", label: "Gemeinschaft", emoji: "🤝", deg: 198,
    // Warm amber gold: human warmth, inviting
    sphereGrad: "radial-gradient(circle at 36% 30%, rgba(255,238,198,0.98) 0%, rgba(248,185,82,0.92) 38%, rgba(218,138,28,0.88) 68%, rgba(185,105,15,0.82) 100%)",
    sphereGlow: "rgba(228,152,35,0.58)",
    rimLight:   "rgba(255,242,200,0.95)",
    innerHighlight: "rgba(255,220,138,0.48)",
    floatDur: 5.0, floatDelay: 0.8,
  },
];

function polar(deg, r) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: Math.cos(rad) * r, y: Math.sin(rad) * r };
}

// ── Floating particles (5 gentle light motes) ────────────────────
// Fixed positions relative to compass center, subtle teal/coral
const PARTICLES = [
  { dx: -0.28, dy: -0.35, size: 3.5, col: "rgba(14,196,184,0.55)", dur: 6.2, delay: 0.0 },
  { dx:  0.32, dy: -0.18, size: 2.8, col: "rgba(232,87,58,0.42)",  dur: 7.0, delay: 1.2 },
  { dx:  0.22, dy:  0.38, size: 3.2, col: "rgba(14,196,184,0.48)", dur: 5.8, delay: 2.1 },
  { dx: -0.30, dy:  0.25, size: 2.5, col: "rgba(232,87,58,0.38)",  dur: 6.6, delay: 0.7 },
  { dx:  0.05, dy: -0.42, size: 2.0, col: "rgba(14,196,184,0.35)", dur: 7.4, delay: 3.0 },
];

const CSS = `
  @keyframes oatm-in    { from{opacity:0}            to{opacity:1} }
  @keyframes oatm-out   { from{opacity:1}            to{opacity:0} }
  @keyframes oatm-title {
    from { opacity:0; transform:translateY(-16px) }
    to   { opacity:1; transform:translateY(0) }
  }
  @keyframes oatm-center-rise {
    0%   { opacity:0; transform:translate(-50%,-50%) scale(0.28) translateY(55px) }
    62%  { opacity:1; transform:translate(-50%,-50%) scale(1.05)  translateY(-3px) }
    100% { opacity:1; transform:translate(-50%,-50%) scale(1)     translateY(0) }
  }
  @keyframes oatm-radiate {
    0%   { opacity:0.65; transform:translate(-50%,-50%) scale(0.35) }
    100% { opacity:0;    transform:translate(-50%,-50%) scale(2.4) }
  }
  @keyframes oatm-track-in {
    from { opacity:0; transform:translate(-50%,-50%) scale(0.45) }
    to   { opacity:1; transform:translate(-50%,-50%) scale(1) }
  }
  @keyframes oatm-node-bloom {
    0%   { opacity:0; transform:translate(-50%,-50%) scale(0.12) }
    68%  { opacity:1; transform:translate(-50%,-50%) scale(1.06) }
    100% { opacity:1; transform:translate(-50%,-50%) scale(1) }
  }
  @keyframes oatm-hint {
    from { opacity:0; transform:translateY(14px) }
    to   { opacity:1; transform:translateY(0) }
  }

  /* Living — slower, more elegant */
  @keyframes oatm-breathe {
    0%,100% { transform:translate(-50%,-50%) scale(1) }
    50%     { transform:translate(-50%,-50%) scale(1.038) }
  }
  @keyframes oatm-float {
    0%,100% { transform:translate(-50%,-50%) translateY(0px) }
    50%     { transform:translate(-50%,-50%) translateY(-5px) }
  }
  @keyframes oatm-glow {
    0%,100% { opacity:0.48 }
    50%     { opacity:0.82 }
  }
  @keyframes oatm-twinkle {
    0%,100% { opacity:0.50; r:3.8 }
    50%     { opacity:1.00; r:5.2 }
  }
  /* Particle drift */
  @keyframes oatm-particle {
    0%,100% { opacity:0.0; transform:translate(-50%,-50%) translateY(0px) scale(0.8) }
    20%     { opacity:1.0 }
    80%     { opacity:0.8 }
    100%    { opacity:0.0; transform:translate(-50%,-50%) translateY(-18px) scale(1.1) }
  }
  /* Logo inner shimmer */
  @keyframes oatm-shimmer {
    0%   { transform:translate(-50%,-50%) rotate(-15deg) translateX(-120%) }
    100% { transform:translate(-50%,-50%) rotate(-15deg) translateX(220%) }
  }

  .oatm-x {
    -webkit-tap-highlight-color:transparent;
    transition:opacity .14s, transform .14s;
    cursor:pointer;
  }
  .oatm-x:active { opacity:0.38; transform:scale(0.80); }

  .oatm-node {
    cursor:pointer;
    touch-action:manipulation;
    -webkit-tap-highlight-color:transparent;
  }
  .oatm-sphere {
    transition: transform .20s cubic-bezier(.22,1,.36,1), filter .20s ease;
    will-change: transform;
  }
  .oatm-node:active .oatm-sphere {
    transform: scale(0.80) !important;
    filter: brightness(0.86) saturate(1.1);
  }
`;

// ── Premium Glass Sphere ──────────────────────────────────────────
function GlassSphere({ world, size, animDelay }) {
  return (
    <div
      className="oatm-sphere"
      style={{
        width: size, height: size,
        borderRadius: "50%",
        position: "relative",
        overflow: "hidden",
        background: world.sphereGrad,
        boxShadow: `
          0 0 ${size * 0.55}px ${world.sphereGlow},
          0 ${size * 0.12}px ${size * 0.42}px rgba(0,0,0,0.18),
          0 ${size * 0.04}px ${size * 0.12}px rgba(0,0,0,0.12),
          inset 0 2px 0 ${world.rimLight},
          inset 0 -2px 4px rgba(0,0,0,0.10),
          inset 2px 0 6px rgba(255,255,255,0.12)
        `,
        animation: `oatm-float ${world.floatDur}s ease-in-out ${world.floatDelay}s infinite`,
      }}
    >
      {/* Primary highlight — top-left rim */}
      <div style={{
        position: "absolute",
        top: "7%", left: "9%",
        width: "44%", height: "40%",
        borderRadius: "50%",
        background: `radial-gradient(circle at 40% 40%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 100%)`,
        pointerEvents: "none",
      }}/>
      {/* Secondary softer highlight — right edge catch */}
      <div style={{
        position: "absolute",
        top: "14%", right: "8%",
        width: "18%", height: "28%",
        borderRadius: "50%",
        background: `radial-gradient(circle, ${world.innerHighlight} 0%, transparent 100%)`,
        pointerEvents: "none",
      }}/>
      {/* Depth shadow — bottom */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0, height: "38%",
        background: "linear-gradient(to top, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.04) 60%, transparent 100%)",
        pointerEvents: "none",
      }}/>
      {/* Emoji */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.38,
        filter: "drop-shadow(0 1px 5px rgba(0,0,0,0.22)) drop-shadow(0 0 8px rgba(255,255,255,0.30))",
      }}>
        {world.emoji}
      </div>
    </div>

  );
}

// ═══════════════════════════════════════════════════════════════════
export default function OrbCompass({ visible, isTalent = false, onClose, onWorldSelect }) {
  const [phase,  setPhase]  = useState("hidden");
  const [logoOk,     setLogoOk]     = useState(false);
  const [showMoment,      setShowMoment]      = useState(false);
  const [showOrbDialog,   setShowOrbDialog]   = useState(false);
  const [showGemeinschaft,setShowGemeinschaft]= useState(false);

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

  // ── Sizes — identical to V2 ─────────────────────────────────────
  const vw    = Math.min(window.innerWidth, 430);
  const vh    = window.innerHeight;
  const stage = Math.min(vw - 8, vh * 0.54, 420);
  const cx    = stage / 2;
  const cy    = stage / 2;
  const R     = stage * 0.390;
  const sphD  = Math.min(stage * 0.210, 86);
  const ctrD  = Math.min(stage * 0.230, 96);
  const r1    = R - sphD * 0.05;
  const r2    = R * 0.52;

  return (
    <>
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9200,
        backdropFilter: "blur(30px) saturate(1.35) brightness(0.84)",
        WebkitBackdropFilter: "blur(30px) saturate(1.35) brightness(0.84)",
        // Slightly richer mint overlay — more premium depth
        background: "linear-gradient(168deg, rgba(232,246,241,0.92) 0%, rgba(205,235,226,0.92) 55%, rgba(220,238,232,0.92) 100%)",
        display: "flex", flexDirection: "column", alignItems: "center",
        animation: isClosing ? "oatm-out .24s ease both" : "oatm-in .32s ease both",
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

        {/* ✕ ─────────────────────────────────────────── */}
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

        {/* ── Title ── unchanged position, refined rendering ──── */}
        <div style={{
          textAlign: "center",
          marginBottom: stage * 0.07,
          animation: "oatm-title .42s ease .05s both",
        }}>
          <h1 style={{
            fontSize:      Math.min(34, vw * 0.084),
            fontWeight:    900,
            color:         D.inkTeal,
            letterSpacing: "-0.046em",
            lineHeight:    1.16,
            margin:        "0 0 10px",
            fontFamily:    "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
            // Subtle text depth
            textShadow:    "0 1px 0 rgba(255,255,255,0.60)",
          }}>
            Wonach suchst<br/>du heute?
          </h1>
          <p style={{
            fontSize:   Math.min(15, vw * 0.037),
            color:      D.inkSoft,
            lineHeight: 1.62,
            margin:     0,
            fontWeight: 400,
            letterSpacing: "0.005em",
          }}>
            Entdecke die Welt,<br/>die dich heute bewegt.
          </p>
        </div>

        {/* ════ COMPASS STAGE — identical layout ═══════════ */}
        <div style={{ position: "relative", width: stage, height: stage, flexShrink: 0 }}>

          {/* ── SVG: refined track + dots ─────────────── */}
          <svg
            style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
            width={stage} height={stage}
          >
            <defs>
              <radialGradient id="compassGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="rgba(14,196,184,0.20)"/>
                <stop offset="55%"  stopColor="rgba(14,196,184,0.05)"/>
                <stop offset="100%" stopColor="rgba(14,196,184,0)"/>
              </radialGradient>
              {/* Sharper dot glow */}
              <filter id="dotGlow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
              {/* Very soft track glow filter */}
              <filter id="trackGlow" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="1.5" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            </defs>

            {/* Ambient compass halo — very subtle */}
            <circle cx={cx} cy={cy} r={R + sphD * 0.65}
              fill="url(#compassGlow)"
              style={{ animation: "oatm-glow 5.5s ease-in-out infinite" }}
            />

            {/* Outer track — barely-there, feels more than seen */}
            <circle cx={cx} cy={cy} r={r1}
              fill="none"
              stroke="rgba(255,255,255,0.58)"
              strokeWidth="1.0"
              filter="url(#trackGlow)"
              style={{ animation: "oatm-track-in .60s ease .20s both" }}
            />

            {/* Inner ring — even more subtle */}
            <circle cx={cx} cy={cy} r={r2}
              fill="none"
              stroke="rgba(255,255,255,0.32)"
              strokeWidth="0.7"
              strokeDasharray="3.5 7"
              style={{ animation: "oatm-track-in .60s ease .25s both" }}
            />

            {/* Spokes — barely visible, organic feel */}
            {WORLDS.map(w => {
              const near = polar(w.deg, r2 * 0.88);
              const far  = polar(w.deg, r1 * 0.87);
              return (
                <line key={w.id + "-sp"}
                  x1={cx + near.x} y1={cy + near.y}
                  x2={cx + far.x}  y2={cy + far.y}
                  stroke="rgba(255,255,255,0.42)"
                  strokeWidth="0.8"
                  strokeDasharray="2.5 5"
                />
              );
            })}

            {/* Outer ring dots — glowing white pearls */}
            {WORLDS.map((w, i) => {
              const p = polar(w.deg, r1);
              return (
                <g key={w.id + "-dot"}>
                  {/* Glow bloom behind dot */}
                  <circle
                    cx={cx + p.x} cy={cy + p.y} r="7"
                    fill={w.sphereGlow || "rgba(14,196,184,0.30)"}
                    opacity="0.35"
                    style={{ animation: `oatm-glow ${3.2 + i * 0.5}s ease-in-out ${i * 0.4}s infinite` }}
                  />
                  {/* White pearl dot */}
                  <circle
                    cx={cx + p.x} cy={cy + p.y} r="4"
                    fill="white"
                    opacity="0.88"
                    filter="url(#dotGlow)"
                    style={{ animation: `oatm-glow ${2.6 + i * 0.4}s ease-in-out ${i * 0.35}s infinite` }}
                  />
                </g>
              );
            })}

            {/* Inner ring dots — tiny, very soft */}
            {WORLDS.map(w => {
              const p = polar(w.deg, r2);
              return (
                <circle key={w.id + "-idot"}
                  cx={cx + p.x} cy={cy + p.y} r="2"
                  fill="rgba(255,255,255,0.55)"
                />
              );
            })}
          </svg>

          {/* ── Floating particles — teal & coral motes ── */}
          {PARTICLES.map((pt, i) => (
            <div key={"pt" + i} style={{
              position: "absolute",
              left: cx + pt.dx * stage * 0.48,
              top:  cy + pt.dy * stage * 0.48,
              width: pt.size, height: pt.size,
              borderRadius: "50%",
              background: pt.col,
              transform: "translate(-50%,-50%)",
              pointerEvents: "none",
              filter: `blur(${pt.size * 0.4}px)`,
              animation: `oatm-particle ${pt.dur}s ease-in-out ${pt.delay + 0.8}s infinite`,
            }}/>
          ))}

          {/* ── Light radiate (opening pulse) ── */}
          <div style={{
            position: "absolute", left: cx, top: cy,
            width: ctrD * 1.1, height: ctrD * 1.1,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(14,196,184,0.45) 0%, rgba(232,87,58,0.15) 55%, transparent 75%)",
            animation: "oatm-radiate 1.1s cubic-bezier(.22,1,.36,1) .06s both",
            pointerEvents: "none",
          }}/>

          {/* ── World Nodes — identical positions ─────── */}
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
                  animation: `oatm-node-bloom .52s cubic-bezier(.34,1.56,.64,1) ${i * 65 + 185}ms both`,
                }}
              >
                {/* Aura — per-world color glow, slightly more defined */}
                <div style={{
                  position: "absolute",
                  width: sphD + 26, height: sphD + 26,
                  borderRadius: "50%",
                  top: "50%", left: "50%",
                  transform: "translate(-50%, calc(-50% - 4px))",
                  background: `radial-gradient(circle, ${w.sphereGlow} 0%, transparent 68%)`,
                  filter: "blur(7px)",
                  pointerEvents: "none",
                  animation: `oatm-glow ${3.8 + i * 0.55}s ease-in-out ${i * 0.65}s infinite`,
                }}/>

                <GlassSphere world={w} size={sphD} animDelay={i}/>

                <span style={{
                  fontSize: Math.min(13, vw * 0.033),
                  fontWeight: 700,
                  color: D.ink,
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  // Slightly more legible
                  textShadow: "0 1px 10px rgba(255,255,255,0.98), 0 1px 4px rgba(255,255,255,0.85)",
                }}>
                  {w.label}
                </span>
              </div>
            );
          })}

          {/* ── CENTER HUI LOGO — tappable, opens HUI-Moment ── */}
          <div
            onClick={() => isTalent ? setShowMoment(true) : setShowOrbDialog(true)}
            style={{
              position: "absolute",
              left: cx, top: cy,
              zIndex: 10,
              cursor: "pointer",
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
              animation: `
                oatm-center-rise .60s cubic-bezier(.34,1.56,.64,1) .06s both,
                oatm-breathe 5.2s ease-in-out 1.4s infinite
              `,
            }}
          >
            {/* Deep ambient aura — two-color, very soft */}
            <div style={{
              position: "absolute",
              width: ctrD + 52, height: ctrD + 52,
              borderRadius: "50%",
              top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              background: `radial-gradient(circle,
                rgba(14,196,184,0.24) 0%,
                rgba(232,87,58,0.12) 50%,
                transparent 72%)`,
              filter: "blur(12px)",
              pointerEvents: "none",
              animation: "oatm-glow 4.5s ease-in-out infinite",
            }}/>

            {/* Outer white halo ring */}
            <div style={{
              position: "absolute",
              width: ctrD + 14, height: ctrD + 14,
              borderRadius: "50%",
              top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              background: "rgba(255,255,255,0.82)",
              boxShadow: `
                0 4px 28px rgba(14,196,184,0.20),
                0 2px 10px rgba(0,0,0,0.08),
                inset 0 1px 2px rgba(255,255,255,0.90)
              `,
              pointerEvents: "none",
            }}/>

            {/* Logo container */}
            <div style={{
              position: "absolute",
              width: ctrD, height: ctrD,
              borderRadius: "50%",
              top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              overflow: "hidden",
              boxShadow: `
                0 6px 30px rgba(14,196,184,0.28),
                0 3px 12px rgba(232,87,58,0.14),
                0 1px 5px rgba(0,0,0,0.10),
                inset 0 1px 2px rgba(255,255,255,0.80)
              `,
            }}>
              {/* Fallback gradient while logo loads */}
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
                  transition: "opacity .5s ease",
                }}
              />
              {/* Glass highlight shimmer on logo — one sweep on open */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.38) 50%, transparent 70%)",
                borderRadius: "50%",
                pointerEvents: "none",
                animation: "oatm-shimmer 1.2s ease .7s 1 both",
              }}/>
            </div>
          </div>

        </div>{/* / stage */}

        {/* ── Hint ─────────────────────────────────────── */}
        <div style={{
          marginTop: stage * 0.055,
          textAlign: "center",
          animation: "oatm-hint .42s ease .64s both",
        }}>
          <div style={{ fontSize: 18, color: D.teal, lineHeight: 1, marginBottom: 5 }}>↑</div>
          <p style={{
            fontSize: 13.5, color: D.inkSoft, lineHeight: 1.72,
            margin: 0, fontWeight: 400,
          }}>
            In die Mitte tippen,<br/>um einen<br/>
            <strong style={{ color: D.teal, fontWeight: 800 }}>HUI-Moment</strong><br/>
            zu teilen
          </p>
        </div>

      </div>
    </div>

      {/* HUI-Moment Sheet — nur für Talent-User */}
      <HuiMomentSheet
        visible={showMoment}
        onClose={() => setShowMoment(false)}
        visibilityScope="public"
      />

      {/* Orb-Dialog für Basis-User */}
      {showOrbDialog && (
        <OrbLockedDialog
          onJoin={() => { setShowOrbDialog(false); setShowGemeinschaft(true); }}
          onClose={() => setShowOrbDialog(false)}
        />
      )}

      {/* GemeinschaftsFlow — startet nach Button-Tap */}
      {showGemeinschaft && (
        <GemeinschaftsFlow
          onClose={() => setShowGemeinschaft(false)}
          onComplete={() => {
            setShowGemeinschaft(false);
            // isTalent flippt automatisch via AuthContext + useMemo
          }}
        />
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// OrbLockedDialog — herzliches Dialogfenster für Basis-User
// Öffnet sich wenn Basis-User den HUI-Orb antippt.
// ══════════════════════════════════════════════════════════════
const OrbLockedDialogCSS = `
  @keyframes old-scale-in {
    from { opacity:0; transform:translate(-50%,-50%) scale(0.88); }
    to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
  }
  @keyframes old-fade-in {
    from { opacity:0; }
    to   { opacity:1; }
  }
`;

function OrbLockedDialog({ onJoin, onClose }) {
  return (
    <>
      <style>{OrbLockedDialogCSS}</style>

      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 12000,
          background: "rgba(26,53,48,0.52)",
          WebkitBackdropFilter: "blur(6px)",
          backdropFilter: "blur(6px)",
          animation: "old-fade-in .22s ease both",
        }}
      />

      {/* Dialog Card */}
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        zIndex: 12001,
        width: "min(calc(100% - 40px), 360px)",
        background: "#F7F5F0",
        borderRadius: 24,
        padding: "32px 24px 28px",
        boxShadow: "0 24px 64px rgba(26,53,48,0.22), 0 4px 16px rgba(26,53,48,0.10)",
        animation: "old-scale-in .32s cubic-bezier(.34,1.56,.64,1) both",
        textAlign: "center",
      }}>
        {/* Orb-Illustration */}
        <div style={{
          width: 72, height: 72,
          borderRadius: "50%",
          background: "radial-gradient(circle at 36% 30%, rgba(195,245,240,0.98) 0%, rgba(14,196,184,0.82) 55%, rgba(10,173,163,0.92) 100%)",
          boxShadow: "0 8px 28px rgba(14,196,184,0.38)",
          margin: "0 auto 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}>
          <img
            src="/hui-logo-app.png"
            alt="HUI"
            style={{ width: 44, height: 44, objectFit: "contain" }}
            onError={e => { e.currentTarget.style.display = "none"; }}
          />
        </div>

        {/* Titel */}
        <h3 style={{
          fontSize: 20,
          fontWeight: 800,
          color: "#1A3530",
          letterSpacing: "-0.03em",
          lineHeight: 1.25,
          margin: "0 0 14px",
        }}>
          Der HUI-Orb wartet<br/>auf dich ✨
        </h3>

        {/* Text */}
        <p style={{
          fontSize: 14.5,
          lineHeight: 1.72,
          color: "rgba(26,53,48,0.62)",
          margin: "0 0 24px",
        }}>
          Mit dem HUI-Orb teilen Talente und Wirker ihre Werke,
          Erlebnisse, Momente und ihre Wirkung mit der Gemeinschaft.
          <br/><br/>
          Werde Teil der Gemeinschaft und schalte den HUI-Orb
          für dein Profil frei.
        </p>

        {/* Primär-Button */}
        <button
          onClick={onJoin}
          style={{
            display: "block",
            width: "100%",
            padding: "16px 20px",
            background: "linear-gradient(135deg,#0EC4B8,#0AADA3)",
            color: "#fff",
            border: "none",
            borderRadius: 99,
            fontSize: 15.5,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 4px 18px rgba(14,196,184,0.30)",
            marginBottom: 10,
            touchAction: "manipulation",
            transition: "transform .15s",
          }}
          onTouchStart={e => { e.currentTarget.style.transform = "scale(0.97)"; }}
          onTouchEnd={e   => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          Mitglied der Gemeinschaft werden ✨
        </button>

        {/* Sekundär-Button */}
        <button
          onClick={onClose}
          style={{
            display: "block",
            width: "100%",
            padding: "13px 20px",
            background: "transparent",
            color: "rgba(26,53,48,0.48)",
            border: "none",
            borderRadius: 99,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            touchAction: "manipulation",
          }}
        >
          Später
        </button>
      </div>
    </>
  );
}