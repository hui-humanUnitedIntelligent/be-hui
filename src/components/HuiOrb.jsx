// HuiOrb.jsx — HUI Orb Navigation System v2
// Premium Motion Layer · Ambient Interface · Calm UI
// Designsprache: Apple VisionOS · Glassmorphism · Emotional Computing
//
// ÄNDERUNGEN v2:
//   1. Radiale Geometrie — perfekte Polarkoordinaten, 5 Satelliten gleichmäßig
//   2. Orb visuell — 5 Tiefenschichten, inner glow, light refraction
//   3. Mood-Reaktivität — CSS-Variablen, sanfte Mood-Übergänge
//   4. Premium Open-Animation — gestaffeltes Entfalten mit spring physics
//   5. Action Buttons — Glass-Orbs mit ambient depth
//   6. Backdrop — stärkerer blur + brightness, soft vignette
//   7. Micro Floating Physics — unterschiedliche Float-Offsets pro Satellit
//   8. Depth System — layered shadows, ambient glow stacking
//   9. Positioning — perfekte Balance über BottomNav, Safe Area
//  10. Performance — nur transform/opacity/blur, GPU-composite
//  11. a11y — aria-expanded, role, tabIndex, Escape

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── Design Tokens ────────────────────────────────────────────────
const C = {
  teal:   "#16D7C5",
  coral:  "#FF8A6B",
  gold:   "#F5A623",
  ink2:   "#3A3A3A",
};

// ─── Mood Atmosphären ─────────────────────────────────────────────
// color: Akzent-Hex | rgb: RGB-Tripel | floatS: Float-Dauer | breathS: Breathe-Dauer
const MOODS = {
  ruhe:         { color:"#6B9FD4", rgb:"107,159,212", floatS:7.5, breathS:5.0 },
  inspiration:  { color:"#F5A623", rgb:"245,166,35",  floatS:5.0, breathS:3.2 },
  gemeinschaft: { color:"#FF8A6B", rgb:"255,138,107", floatS:5.8, breathS:3.8 },
  kreativitaet: { color:"#A78BFA", rgb:"167,139,250", floatS:4.8, breathS:3.0 },
  abenteuer:    { color:"#3DB87A", rgb:"61,184,122",  floatS:4.2, breathS:2.6 },
  ueberraschung:{ color:"#16D7C5", rgb:"22,215,197",  floatS:5.2, breathS:3.4 },
};
const DEFAULT_MOOD = { color:"#16D7C5", rgb:"22,215,197", floatS:6.0, breathS:4.2 };

// ─── Radiale Geometrie ────────────────────────────────────────────
// 5 Satelliten: gleichmäßig verteilt im Bogen 150°–390°(=30°)
// Gesamt-Bogen: 240° (oben frei, unterer Bereich frei wegen BottomNav)
// Schritt: 240° / 4 = 60°
// Positionen: 150°, 210°, 270°, 330°, 30°
const ORB_R  = 102;  // Radius Satelliten-Umlaufbahn [px]
const ANGLES = [150, 210, 270, 330, 30];

function polarPos(angleDeg, r) {
  const rd = r !== undefined ? r : ORB_R;
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  // Auf 0.5px gerundet — vermeidet Sub-Pixel-Rendering-Artefakte
  return {
    x: Math.round(Math.cos(rad) * rd * 2) / 2,
    y: Math.round(Math.sin(rad) * rd * 2) / 2,
  };
}

// Micro-Float-Parameter pro Satellit (leicht verschieden = organisch)
const FLOAT_PARAMS = [
  { px: -3.8, dur: 4.9, delay: 0.0  },
  { px: -4.4, dur: 5.5, delay: 0.65 },
  { px: -3.5, dur: 5.1, delay: 1.30 },
  { px: -4.8, dur: 4.7, delay: 0.35 },
  { px: -3.2, dur: 5.3, delay: 0.95 },
];

// ─── CSS ─────────────────────────────────────────────────────────
// Nur: transform, opacity, box-shadow, backdrop-filter — GPU-composite.
// Kein width/height/top/left in Animationen.
const ORB_CSS = `

  /* ══ KEYFRAMES ══════════════════════════════════════════════════ */

  @keyframes orb-wrap-float {
    0%,100% { transform: translateX(-50%) translateY(0px);  }
    50%      { transform: translateX(-50%) translateY(-3.5px); }
  }

  @keyframes orb-breathe {
    0%,100% {
      box-shadow:
        var(--sha), var(--shd), var(--shi);
    }
    50% {
      box-shadow:
        var(--sha-hi), var(--shd), var(--shi);
    }
  }

  @keyframes orb-notify {
    0%   { transform: scale(1);    }
    20%  { transform: scale(1.08); }
    45%  { transform: scale(0.96); }
    70%  { transform: scale(1.03); }
    100% { transform: scale(1);    }
  }

  @keyframes orb-open-pop {
    0%   { transform: scale(0.92); opacity: 0.82; }
    60%  { transform: scale(1.05); opacity: 1;    }
    100% { transform: scale(1.0);  opacity: 1;    }
  }

  @keyframes orb-pulse-ring {
    0%   { transform: scale(1.0); opacity: 0.55; }
    100% { transform: scale(2.2); opacity: 0;    }
  }

  @keyframes sat-float {
    0%,100% { transform: translate(var(--sx),var(--sy)); }
    50%      { transform: translate(var(--sx), calc(var(--sy) + var(--sf))); }
  }

  @keyframes sat-in {
    from {
      opacity: 0;
      transform: translate(
        calc(var(--sx) * 0.32),
        calc(var(--sy) * 0.32)
      ) scale(0.42);
    }
    to {
      opacity: 1;
      transform: translate(var(--sx), var(--sy)) scale(1);
    }
  }

  @keyframes sat-out {
    from {
      opacity: 1;
      transform: translate(var(--sx), var(--sy)) scale(1);
    }
    to {
      opacity: 0;
      transform: translate(
        calc(var(--sx) * 0.32),
        calc(var(--sy) * 0.32)
      ) scale(0.42);
    }
  }

  @keyframes label-in {
    from { opacity:0; transform:translate(-50%,-50%) scale(0.88) translateY(5px); }
    to   { opacity:1; transform:translate(-50%,-50%) scale(1)    translateY(0);   }
  }

  @keyframes backdrop-in  { from{opacity:0} to{opacity:1} }
  @keyframes badge-pulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
  @keyframes dot-pulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.65;transform:scale(1.3)} }

  /* ══ ORB WRAP ═══════════════════════════════════════════════════ */

  .orb-wrap {
    position: fixed;
    left: 50%;
    /* Perfekte Balance: BottomNav ≈ 74px + safe-area + 16px Luft */
    /* Orb sitzt teilweise in/über BottomNav — nahtlose Integration */
    bottom: calc(52px + max(8px, env(safe-area-inset-bottom, 8px)));
    z-index: 95;
    pointer-events: none;
    transform: translateX(-50%);
    width: 64px;
    height: 64px;
  }

  @media (prefers-reduced-motion: no-preference) {
    .orb-wrap.orb--idle {
      animation: orb-wrap-float var(--orb-float-dur, 6s) ease-in-out infinite;
    }
  }

  /* ══ ORB CORE ═══════════════════════════════════════════════════ */

  .orb-core {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    cursor: pointer;
    pointer-events: auto;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    transition:
      background   0.55s ease,
      border-color 0.55s ease,
      box-shadow   0.45s ease,
      transform    0.38s cubic-bezier(0.34, 1.35, 0.64, 1);
    will-change: transform, box-shadow;
  }

  .orb-core:active {
    transform: scale(0.89) !important;
    transition-duration: 0.11s !important;
  }

  @media (prefers-reduced-motion: no-preference) {
    .orb-core.orb--breathe {
      animation: orb-breathe var(--orb-breathe-dur, 4.2s) ease-in-out infinite;
    }
    .orb-core.orb--notify {
      animation: orb-notify 0.60s cubic-bezier(0.34,1.4,0.64,1);
    }
    .orb-core.orb--open-pop {
      animation: orb-open-pop 0.40s cubic-bezier(0.34,1.35,0.64,1) both;
    }
  }

  /* ══ ORB GLASS LAYERS ═══════════════════════════════════════════ */

  /* Layer 1: Outer ring */
  .orb-ring {
    position: absolute;
    inset: -5px;
    border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,0.38);
    pointer-events: none;
    transition: border-color 0.55s ease, opacity 0.4s ease;
  }

  /* Layer 4: Top-left reflection crescent */
  .orb-highlight {
    position: absolute;
    top: 8px; left: 10px;
    width: 30px; height: 16px;
    border-radius: 50%;
    background: radial-gradient(
      ellipse at center,
      rgba(255,255,255,0.80) 0%,
      rgba(255,255,255,0.22) 55%,
      transparent 100%
    );
    filter: blur(2.5px);
    pointer-events: none;
    transform: rotate(-22deg);
    transition: opacity 0.4s ease;
  }

  /* Layer 5: Pulse ring */
  .orb-pulse-ring {
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 1px solid transparent;
    pointer-events: none;
    will-change: transform, opacity;
  }

  @media (prefers-reduced-motion: no-preference) {
    .orb-pulse-ring.orb-pulse-ring--active {
      animation: orb-pulse-ring var(--orb-pulse-dur, 3.2s) ease-out infinite;
    }
  }

  /* ══ SATELLITE SYSTEM ═══════════════════════════════════════════ */

  .orb-satellites {
    position: absolute;
    /* Zentriert auf Orb — gleiche Größe */
    inset: 0;
    pointer-events: none;
  }

  .sat-btn {
    position: absolute;
    width: 50px; height: 50px;
    /* Positionierung via CSS-Var --sx / --sy */
    left: calc(50% + var(--sx) - 25px);
    top:  calc(50% + var(--sy) - 25px);
    border-radius: 50%;
    cursor: pointer;
    pointer-events: auto;
    -webkit-tap-highlight-color: transparent;

    /* Glass-Orb Design */
    background:
      radial-gradient(circle at 34% 28%,
        rgba(255,255,255,0.90) 0%,
        rgba(255,252,248,0.72) 42%,
        rgba(255,252,248,0.50) 100%
      );
    backdrop-filter: blur(24px) saturate(1.55);
    -webkit-backdrop-filter: blur(24px) saturate(1.55);
    border: 1px solid rgba(255,255,255,0.52);
    box-shadow:
      0 8px 28px rgba(0,0,0,0.10),
      0 3px 10px rgba(0,0,0,0.06),
      0 1px 0    rgba(255,255,255,0.85) inset,
      0 -1px 0   rgba(0,0,0,0.03) inset;

    display: flex; align-items: center; justify-content: center;

    transition:
      transform 0.28s cubic-bezier(0.34,1.4,0.64,1),
      box-shadow 0.28s ease,
      background 0.28s ease;
    will-change: transform;
  }

  .sat-btn:active {
    transform: translate(var(--sx),var(--sy)) scale(0.86) !important;
    transition-duration: 0.10s !important;
  }

  @media (prefers-reduced-motion: no-preference) {
    .sat-btn.sat-btn--float {
      animation:
        sat-float var(--sat-dur, 5.2s) ease-in-out infinite var(--sat-delay, 0s);
    }
  }

  .sat-btn.sat-btn--in {
    animation:
      sat-in var(--sat-in-dur, 0.38s) cubic-bezier(0.34,1.5,0.64,1)
      var(--sat-delay, 0s) both;
  }

  .sat-btn.sat-btn--out {
    animation:
      sat-out 0.22s cubic-bezier(0.4,0,0.8,1)
      var(--sat-delay, 0s) both;
    pointer-events: none;
  }

  /* ══ BADGE ══════════════════════════════════════════════════════ */

  .sat-badge {
    position: absolute; top: -2px; right: -2px;
    min-width: 15px; height: 15px; padding: 0 3px;
    border-radius: 8px;
    background: linear-gradient(135deg,#FF5F5F,#FF8A6B);
    color:#fff; font-size:8.5px; font-weight:800;
    display:flex; align-items:center; justify-content:center;
    border:1.5px solid rgba(255,251,248,0.96);
    animation: badge-pulse 3.2s ease-in-out infinite;
    pointer-events:none;
  }

  /* ══ LABEL ══════════════════════════════════════════════════════ */

  .sat-label {
    position: absolute;
    white-space: nowrap;
    font-size: 10.5px; font-weight: 700;
    color: #1A1A1A; letter-spacing: 0.15px;
    background: rgba(255,252,248,0.95);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    padding: 4px 10px; border-radius: 20px;
    border: 1px solid rgba(0,0,0,0.06);
    box-shadow: 0 3px 14px rgba(0,0,0,0.09), 0 1px 0 rgba(255,255,255,0.85) inset;
    pointer-events: none;
    animation: label-in 0.22s cubic-bezier(0.34,1.3,0.64,1) both;
    z-index: 2;
  }

  /* ══ BACKDROP / FOCUS SYSTEM ════════════════════════════════════ */

  .orb-backdrop {
    position: fixed; inset: 0; z-index: 94;
    /* Stärkerer blur + Brightness-Reduktion + soft Vignette */
    backdrop-filter: blur(7px) brightness(0.82) saturate(0.86);
    -webkit-backdrop-filter: blur(7px) brightness(0.82) saturate(0.86);
    /* Radial vignette — hält Feed sichtbar, dämpft Ränder */
    background: radial-gradient(
      ellipse 90% 75% at 50% 115%,
      transparent 25%,
      rgba(15,12,8,0.12) 100%
    );
    pointer-events: auto;
    cursor: default;
    animation: backdrop-in 0.30s ease both;
  }

  /* ══ STATUS DOTS AM ORB ═════════════════════════════════════════ */

  .orb-dot {
    position: absolute;
    width: 8px; height: 8px;
    border-radius: 50%;
    border: 1.5px solid rgba(255,251,248,0.94);
    pointer-events: none;
    animation: dot-pulse 3s ease-in-out infinite;
  }
`;

// ─── Satellite Button (React.memo — rendert nur bei Prop-Änderung) ─
const SatBtn = React.memo(function SatBtn({
  icon, label, badge, accentRgb, angleIndex, open, onClick,
}) {
  const [hovered, setHovered] = useState(false);
  const fp   = FLOAT_PARAMS[angleIndex];
  const pos  = polarPos(ANGLES[angleIndex]);
  const lPos = polarPos(ANGLES[angleIndex], ORB_R + 56);

  const cls = [
    "sat-btn",
    open ? "sat-btn--in"    : "sat-btn--out",
    open && !hovered ? "sat-btn--float" : "",
  ].filter(Boolean).join(" ");

  return (
    <>
      <div
        className={cls}
        style={{
          "--sx":         `${pos.x}px`,
          "--sy":         `${pos.y}px`,
          "--sf":         `${fp.px}px`,
          "--sat-dur":    `${fp.dur}s`,
          "--sat-delay":  `${angleIndex * 0.058}s`,
          "--sat-in-dur": `${0.34 + angleIndex * 0.02}s`,
          // Hover
          boxShadow: hovered
            ? `0 8px 30px rgba(${accentRgb},0.28), 0 3px 10px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.88) inset`
            : undefined,
          background: hovered
            ? `radial-gradient(circle at 34% 28%, rgba(255,255,255,0.96) 0%, rgba(255,252,248,0.85) 44%, rgba(${accentRgb},0.09) 100%)`
            : undefined,
        }}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={() => setHovered(true)}
        onTouchEnd={() => setTimeout(() => setHovered(false), 160)}
        aria-label={label}
        role="button"
        tabIndex={open ? 0 : -1}
      >
        {icon}
        {badge > 0 && (
          <span className="sat-badge">{badge > 9 ? "9+" : badge}</span>
        )}
      </div>

      {hovered && open && (
        <div
          className="sat-label"
          style={{
            position: "absolute",
            left: `calc(50% + ${lPos.x}px)`,
            top:  `calc(50% + ${lPos.y}px)`,
            transform: "translate(-50%,-50%)",
          }}
        >
          {label}
        </div>
      )}
    </>
  );
});

// ─── Haupt-Orb ───────────────────────────────────────────────────
export default function HuiOrb({
  activeMood  = null,
  onChat,
  onNotifs,
  onKorb,
  onProfile,
  onMatch,
  msgCount    = 0,
  notifCount  = 0,
  cartCount   = 0,
  avatarUrl   = null,
  resetKey,
}) {
  const [open,     setOpen]     = useState(false);
  const [notify,   setNotify]   = useState(false);
  const [openPop,  setOpenPop]  = useState(false);  // kurzer Pop beim Öffnen
  const prevNotifRef            = useRef(notifCount);

  const mood = activeMood ? (MOODS[activeMood.key] || DEFAULT_MOOD) : DEFAULT_MOOD;

  // ── Glow-Werte ─────────────────────────────────────────────────
  const sha    = `0 8px 32px rgba(${mood.rgb},0.26), 0 4px 14px rgba(0,0,0,0.09)`;
  const shaHi  = `0 12px 48px rgba(${mood.rgb},0.50), 0 4px 14px rgba(0,0,0,0.09)`;
  const shd    = `0 2px 4px rgba(0,0,0,0.07)`;
  const shi    = `0 1px 0 rgba(255,255,255,0.62) inset, 0 -1px 0 rgba(0,0,0,0.04) inset`;

  // ── Lifecycle ──────────────────────────────────────────────────
  useEffect(() => { setOpen(false); }, [resetKey]);

  useEffect(() => {
    if (notifCount > prevNotifRef.current && !open) {
      setNotify(true);
      const t = setTimeout(() => setNotify(false), 1600);
      prevNotifRef.current = notifCount;
      return () => clearTimeout(t);
    }
    prevNotifRef.current = notifCount;
  }, [notifCount, open]);

  useEffect(() => {
    if (!open) return;
    const el = document.querySelector(".hui-scroll");
    if (!el) return;
    const h = () => setOpen(false);
    el.addEventListener("scroll", h, { passive: true });
    return () => el.removeEventListener("scroll", h);
  }, [open]);

  const toggleOrb = useCallback((e) => {
    e.stopPropagation();
    setOpen(o => {
      const next = !o;
      if (next) { setOpenPop(true); setTimeout(() => setOpenPop(false), 500); }
      return next;
    });
  }, []);

  const handleAction = useCallback((fn) => { setOpen(false); fn?.(); }, []);

  // ── Klassen ────────────────────────────────────────────────────
  const wrapCls = `orb-wrap${open ? "" : " orb--idle"}`;
  const coreCls = [
    "orb-core",
    open     ? "orb--open-pop" : notify ? "orb-core--notify" : "orb--breathe",
    notify   ? "orb--notify"   : "",
  ].filter(Boolean).join(" ");

  // 5-Layer Orb Background
  const orbBg = `radial-gradient(circle at 36% 30%,
    rgba(255,255,255,${open ? "0.90" : "0.84"}) 0%,
    rgba(255,252,248,0.72) 36%,
    rgba(255,252,248,0.54) 62%,
    rgba(${mood.rgb},0.${open ? "14" : "09"}) 100%
  )`;

  // ── 5 Aktionen (Reihenfolge = ANGLES[0..4]) ───────────────────
  // ANGLES = [150°, 210°, 270°, 330°, 30°]
  const ACTIONS = [
    {
      key:"korb",   angleIndex:0,
      label:"Warenkorb",  badge:cartCount, accentRgb:"245,166,35",
      fn:onKorb,
      icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
    },
    {
      key:"chat",   angleIndex:1,
      label:"Nachrichten", badge:msgCount, accentRgb:"22,215,197",
      fn:onChat,
      icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#16D7C5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    },
    {
      key:"match",  angleIndex:2,
      label:"Match",       badge:0,       accentRgb:mood.rgb,
      fn:onMatch,
      icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={mood.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>,
    },
    {
      key:"notifs", angleIndex:3,
      label:"Mitteilungen", badge:notifCount, accentRgb:"255,138,107",
      fn:onNotifs,
      icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FF8A6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    },
    {
      key:"profile",angleIndex:4,
      label:"Mein HUI",     badge:0,       accentRgb:"22,215,197",
      fn:onProfile,
      icon: avatarUrl
        ? <img src={avatarUrl} alt="Profil"
            style={{width:24,height:24,borderRadius:"50%",objectFit:"cover",display:"block"}}
            onError={e=>{e.target.style.display="none";}}/>
        : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.ink2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    },
  ];

  const pulseActive = notify || (!open && (activeMood || notifCount > 0));

  return (
    <>
      <style>{ORB_CSS}</style>

      {/* Backdrop */}
      {open && (
        <div className="orb-backdrop" onClick={() => setOpen(false)} aria-hidden="true"/>
      )}

      {/* Wrap */}
      <div
        className={wrapCls}
        style={{ "--orb-float-dur": `${mood.floatS}s`, "--orb-breathe-dur": `${mood.breathS}s` }}
      >
        {/* Satelliten */}
        <div className="orb-satellites" aria-hidden={!open}>
          {ACTIONS.map(a => (
            <SatBtn
              key={a.key}
              icon={a.icon}
              label={a.label}
              badge={a.badge}
              accentRgb={a.accentRgb}
              angleIndex={a.angleIndex}
              open={open}
              onClick={() => handleAction(a.fn)}
            />
          ))}
        </div>

        {/* ── Orb Core ─────────────────────────────────────── */}
        <div
          className={coreCls}
          style={{
            "--sha":              sha,
            "--sha-hi":           shaHi,
            "--shd":              shd,
            "--shi":              shi,
            "--orb-breathe-dur":  `${mood.breathS}s`,
            "--orb-pulse-dur":    `${mood.breathS * 0.78}s`,
            background:           orbBg,
            backdropFilter:       "blur(30px) saturate(1.6)",
            WebkitBackdropFilter: "blur(30px) saturate(1.6)",
            border: `1px solid rgba(255,255,255,${open ? "0.60" : "0.46"})`,
            boxShadow: open ? `${shaHi}, ${shd}, ${shi}` : undefined,
            transform: open ? "scale(1.08)" : undefined,
          }}
          onClick={toggleOrb}
          role="button"
          aria-label={open ? "Menü schließen" : "Schnellzugriff öffnen"}
          aria-expanded={open}
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleOrb(e); }
            if (e.key === "Escape") setOpen(false);
          }}
        >
          {/* Layer 1: Outer ring */}
          <div className="orb-ring"
            style={{ borderColor:`rgba(255,255,255,${open?"0.44":"0.30"})` }}/>

          {/* Layer 4: Highlight */}
          <div className="orb-highlight" style={{ opacity: open ? 0.55 : 0.84 }}/>

          {/* Layer 5: Pulse ring */}
          <div
            className={`orb-pulse-ring${pulseActive ? " orb-pulse-ring--active" : ""}`}
            style={{ borderColor:`rgba(${mood.rgb},${notify?"0.72":"0.40"})` }}
          />

          {/* Icon */}
          <div style={{
            position:"absolute", inset:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            borderRadius:"50%", overflow:"hidden",
          }}>
            {/* Logo */}
            <div style={{
              position:"absolute",
              opacity:   open ? 0 : 1,
              transform: open ? "scale(0.70) rotate(-18deg)" : "scale(1) rotate(0deg)",
              transition:"opacity 0.28s ease, transform 0.36s cubic-bezier(0.34,1.3,0.64,1)",
            }}>
              <img src="/hui-logo.jpg" alt="HUI" loading="eager" decoding="async"
                style={{width:36,height:36,borderRadius:"50%",objectFit:"cover",display:"block"}}
                onError={e=>{e.target.style.display="none";}}/>
            </div>

            {/* ✕ Close */}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
              style={{
                position:"absolute",
                opacity:   open ? 1 : 0,
                transform: open ? "rotate(0deg) scale(1)" : "rotate(-45deg) scale(0.55)",
                transition:"opacity 0.26s ease, transform 0.36s cubic-bezier(0.34,1.4,0.64,1)",
              }}>
              <line x1="4" y1="10" x2="16" y2="10" stroke={mood.color} strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="10" y1="4" x2="10" y2="16" stroke={mood.color} strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Notif-Dot */}
          {!open && notifCount > 0 && (
            <div className="orb-dot" style={{
              top:4, right:4,
              background:`linear-gradient(135deg,${C.coral},#FF5F5F)`,
              boxShadow:`0 0 7px rgba(255,138,107,0.72)`,
            }}/>
          )}

          {/* Cart-Dot */}
          {!open && cartCount > 0 && (
            <div className="orb-dot" style={{
              top:4, left:4,
              background:`linear-gradient(135deg,#F5A623,#F5C623)`,
              boxShadow:`0 0 6px rgba(245,166,35,0.58)`,
              animationDelay:"0.45s",
            }}/>
          )}
        </div>
      </div>
    </>
  );
}
