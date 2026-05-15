// HuiOrb.jsx — HUI Orb Navigation System
// Ersetzt die rechte RightActionBar vollständig.
// Ein einziger lebendiger Orb: geschlossen = ruhig, geöffnet = radiales Menü.
// Designsprache: Calm UI · Soft Glassmorphism · Ambient Motion · Premium
//
// Props:
//   activeMood    — { key, color, emoji } | null
//   onChat        — () => void
//   onNotifs      — () => void
//   onKorb        — () => void
//   onProfile     — () => void
//   onMatch       — () => void
//   msgCount      — number
//   notifCount    — number
//   cartCount     — number
//   avatarUrl     — string | null
//   resetKey      — any (tab-Wechsel → Orb schließt)

import React, { useState, useEffect, useRef, useCallback } from "react";

// ── Design Tokens ─────────────────────────────────────────────────
const C = {
  teal:   "#16D7C5",
  coral:  "#FF8A6B",
  gold:   "#F5A623",
  cream:  "#F9F6F2",
  warm:   "#FFF9F4",
  ink:    "#1A1A1A",
  ink2:   "#3A3A3A",
  muted:  "#888",
};

// Mood → Orb-Atmosphäre
const MOOD_ORB = {
  ruhe:          { glow: "rgba(107,159,212,0.32)", color: "#6B9FD4", label: "Ruhig"         },
  inspiration:   { glow: "rgba(245,166,35,0.32)",  color: "#F5A623", label: "Inspiriert"    },
  gemeinschaft:  { glow: "rgba(255,138,107,0.30)", color: "#FF8A6B", label: "Verbunden"     },
  kreativitaet:  { glow: "rgba(167,139,250,0.30)", color: "#A78BFA", label: "Kreativ"       },
  abenteuer:     { glow: "rgba(61,184,122,0.30)",  color: "#3DB87A", label: "Abenteuerlich" },
  ueberraschung: { glow: "rgba(22,215,197,0.28)",  color: "#16D7C5", label: "Überrascht"    },
};
const DEFAULT_ORB = { glow: "rgba(22,215,197,0.22)", color: "#16D7C5" };

// ── Radial Action Positions (5 Slots) ─────────────────────────────
// Kreisförmig um den Orb, Radius ~90px, Bogen oben (keine Überlappung mit BottomNav)
// angles: 210°, 270°, 330° (oberer Halbkreis) + 150°, 30° (Seiten)
// Top-center: 270° | Left: 210° | Right: 330° | Far-left: 150° | Far-right: 30°
const ANGLES_5 = [270, 222, 318, 174, 6];   // 5 Aktionen
const ANGLES_4 = [270, 210, 330, 180];        // 4 Aktionen
const R = 96; // px Radius

function polarPos(angleDeg, r = R) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: Math.cos(rad) * r,
    y: Math.sin(rad) * r,
  };
}

// ── CSS (einmalig injiziert) ───────────────────────────────────────
const ORB_CSS = `
  @keyframes hui-orb-float {
    0%,100% { transform: translateY(0px);   }
    50%      { transform: translateY(-4px);  }
  }
  @keyframes hui-orb-breathe {
    0%,100% { box-shadow: var(--orb-glow-a); }
    50%      { box-shadow: var(--orb-glow-b); }
  }
  @keyframes hui-orb-pulse-ring {
    0%   { transform:scale(1);   opacity:0.6; }
    100% { transform:scale(1.9); opacity:0;   }
  }
  @keyframes hui-orb-action-in {
    from { opacity:0; transform:translate(var(--tx),var(--ty)) scale(0.5); }
    to   { opacity:1; transform:translate(0,0) scale(1); }
  }
  @keyframes hui-orb-action-out {
    from { opacity:1; transform:translate(0,0) scale(1); }
    to   { opacity:0; transform:translate(var(--tx),var(--ty)) scale(0.5); }
  }
  @keyframes hui-orb-label-in {
    from { opacity:0; transform:translateY(4px); }
    to   { opacity:1; transform:translateY(0);   }
  }
  @keyframes hui-orb-notify {
    0%,100% { box-shadow: var(--orb-glow-a); }
    25%      { box-shadow: 0 0 0 0 rgba(22,215,197,0), 0 0 28px 10px rgba(22,215,197,0.6); }
  }
  @keyframes hui-badge-pulse {
    0%,100% { transform:scale(1); }
    50%      { transform:scale(1.18); }
  }

  .hui-orb-wrap {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(84px + max(8px, env(safe-area-inset-bottom, 8px)));
    z-index: 95;
    display: flex;
    align-items: center;
    justify-content: center;
    /* pointer-events nur wenn nötig */
  }

  .hui-orb-core {
    position: relative;
    width: 62px; height: 62px;
    border-radius: 50%;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition:
      transform 0.38s cubic-bezier(0.34,1.4,0.64,1),
      box-shadow 0.45s ease;
    user-select: none;
    flex-shrink: 0;
  }
  .hui-orb-core:active {
    transform: scale(0.91) !important;
  }

  /* Float-Animation nur wenn geschlossen & kein reduced-motion */
  @media (prefers-reduced-motion: no-preference) {
    .hui-orb-core.hui-orb--idle {
      animation: hui-orb-float 5.5s ease-in-out infinite;
    }
  }

  .hui-orb-ring {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,0.30);
    pointer-events: none;
  }

  .hui-orb-pulse-ring {
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    border: 1px solid rgba(22,215,197,0.5);
    animation: hui-orb-pulse-ring 2.8s ease-out infinite;
    pointer-events: none;
  }

  .hui-orb-action-btn {
    position: absolute;
    width: 46px; height: 46px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.38);
    background: rgba(255,252,248,0.72);
    backdrop-filter: blur(20px) saturate(1.4);
    -webkit-backdrop-filter: blur(20px) saturate(1.4);
    box-shadow:
      0 4px 20px rgba(0,0,0,0.10),
      0 1px 0 rgba(255,255,255,0.7) inset;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition:
      transform 0.22s cubic-bezier(0.34,1.4,0.64,1),
      box-shadow 0.22s ease,
      background 0.22s ease;
    transform: translate(0,0) scale(1);
  }
  .hui-orb-action-btn:active {
    transform: translate(0,0) scale(0.88) !important;
  }
  .hui-orb-action-btn:hover {
    transform: translate(0,0) scale(1.08);
    background: rgba(255,252,248,0.90);
  }

  .hui-orb-badge {
    position: absolute; top: -1px; right: -1px;
    min-width: 14px; height: 14px; padding: 0 3px;
    border-radius: 7px;
    background: linear-gradient(135deg,#FF6B6B,#FF8A6B);
    color:#fff; font-size:8px; font-weight:800;
    display:flex; align-items:center; justify-content:center;
    border:1.5px solid rgba(255,251,248,0.95);
    animation: hui-badge-pulse 3s ease-in-out infinite;
    pointer-events:none;
  }

  .hui-orb-label {
    position: absolute;
    white-space: nowrap;
    font-size: 10px;
    font-weight: 700;
    color: #1A1A1A;
    background: rgba(255,252,248,0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 3px 8px;
    border-radius: 20px;
    border: 1px solid rgba(0,0,0,0.07);
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    letter-spacing: 0.2px;
    animation: hui-orb-label-in 0.18s ease both;
    pointer-events: none;
  }

  .hui-orb-backdrop {
    position: fixed; inset: 0; z-index: 94;
    background: rgba(15,12,8,0.18);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    animation: fadeIn 0.22s ease both;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
`;

// ── Action-Button Komponente ───────────────────────────────────────
function OrbActionBtn({ icon, label, badge, color, angle, open, onClick, delay = 0 }) {
  const [hovered, setHovered] = useState(false);
  const pos = polarPos(angle);

  const style = open ? {
    left: `calc(50% + ${pos.x}px - 23px)`,
    top:  `calc(50% + ${pos.y}px - 23px)`,
    animation: `hui-orb-action-in 0.32s cubic-bezier(0.34,1.5,0.64,1) ${delay}s both`,
    // animationsstart-position (für out-animation über CSS-var)
    '--tx': `${-pos.x * 0.45}px`,
    '--ty': `${-pos.y * 0.45}px`,
  } : {
    left: `calc(50% + ${pos.x}px - 23px)`,
    top:  `calc(50% + ${pos.y}px - 23px)`,
    animation: `hui-orb-action-out 0.22s cubic-bezier(0.4,0,0.6,1) ${delay}s both`,
    '--tx': `${-pos.x * 0.45}px`,
    '--ty': `${-pos.y * 0.45}px`,
    pointerEvents: 'none',
  };

  // Label-Position — außen vom Orb
  const labelAngle = angle;
  const lPos = polarPos(labelAngle, R + 42);
  const labelStyle = {
    left: `calc(50% + ${lPos.x}px)`,
    top:  `calc(50% + ${lPos.y}px)`,
    transform: 'translate(-50%,-50%)',
  };

  return (
    <>
      <div
        className="hui-orb-action-btn"
        style={{
          ...style,
          boxShadow: hovered
            ? `0 4px 20px ${color}44, 0 1px 0 rgba(255,255,255,0.7) inset`
            : undefined,
        }}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={() => setHovered(true)}
        onTouchEnd={() => setHovered(false)}
        aria-label={label}
      >
        {icon}
        {badge > 0 && (
          <span className="hui-orb-badge">{badge > 9 ? "9+" : badge}</span>
        )}
      </div>
      {/* Label — nur bei Hover/Touch */}
      {hovered && open && (
        <div className="hui-orb-label" style={labelStyle}>{label}</div>
      )}
    </>
  );
}

// ── Haupt-Orb Komponente ───────────────────────────────────────────
export default function HuiOrb({
  activeMood = null,
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
  const [open, setOpen]           = useState(false);
  const [notify, setNotify]       = useState(false); // kurzer Puls bei neuer Notif
  const prevNotifCount            = useRef(notifCount);
  const wrapRef                   = useRef(null);

  // Mood → visueller Charakter
  const mood = activeMood ? (MOOD_ORB[activeMood.key] || DEFAULT_ORB) : DEFAULT_ORB;

  // ── Tab-Wechsel / resetKey → Orb schließen ─────────────────────
  useEffect(() => { setOpen(false); }, [resetKey]);

  // ── Neue Notif → sanfter Puls ──────────────────────────────────
  useEffect(() => {
    if (notifCount > prevNotifCount.current && !open) {
      setNotify(true);
      const t = setTimeout(() => setNotify(false), 2200);
      prevNotifCount.current = notifCount;
      return () => clearTimeout(t);
    }
    prevNotifCount.current = notifCount;
  }, [notifCount, open]);

  // ── Scroll → Orb schließen ─────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const el = document.querySelector(".hui-scroll");
    if (!el) return;
    const handler = () => setOpen(false);
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, [open]);

  // ── Außerhalb klicken → schließen (via Backdrop, siehe unten) ──

  const toggleOrb = useCallback((e) => {
    e.stopPropagation();
    setOpen(o => !o);
  }, []);

  const handleAction = useCallback((fn) => {
    setOpen(false);
    fn?.();
  }, []);

  // ── Orb Glow CSS-Variablen ─────────────────────────────────────
  const glowA = `0 0 0 0 ${mood.glow}, 0 6px 28px ${mood.glow}, 0 2px 8px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.55) inset`;
  const glowB = `0 0 0 0 ${mood.glow}, 0 10px 38px ${mood.glow.replace('0.2','0.45').replace('0.3','0.52').replace('0.32','0.52').replace('0.22','0.40')}, 0 2px 8px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.55) inset`;

  // Aktionen definieren
  const ACTIONS = [
    {
      key:    "match",
      icon:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={mood.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>,
      label:  "Match",
      badge:  0,
      color:  mood.color,
      angle:  ANGLES_5[0],   // oben
      fn:     onMatch,
      delay:  0.02,
    },
    {
      key:    "chat",
      icon:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
      label:  "Nachrichten",
      badge:  msgCount,
      color:  C.teal,
      angle:  ANGLES_5[1],   // links oben
      fn:     onChat,
      delay:  0.04,
    },
    {
      key:    "notifs",
      icon:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.coral} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
      label:  "Mitteilungen",
      badge:  notifCount,
      color:  C.coral,
      angle:  ANGLES_5[2],   // rechts oben
      fn:     onNotifs,
      delay:  0.06,
    },
    {
      key:    "korb",
      icon:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
      label:  "Warenkorb",
      badge:  cartCount,
      color:  "#F5A623",
      angle:  ANGLES_5[3],   // weit links
      fn:     onKorb,
      delay:  0.08,
    },
    {
      key:    "profile",
      icon:   avatarUrl
        ? <img src={avatarUrl} alt="Profil"
            style={{ width:22, height:22, borderRadius:"50%", objectFit:"cover" }}
            onError={e => { e.target.style.display="none"; }}/>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ink2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
      label:  "Mein Profil",
      badge:  0,
      color:  C.ink2,
      angle:  ANGLES_5[4],   // weit rechts
      fn:     onProfile,
      delay:  0.08,
    },
  ];

  return (
    <>
      <style>{ORB_CSS}</style>

      {/* Backdrop — schließt Orb bei Außen-Klick */}
      {open && (
        <div
          className="hui-orb-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="hui-orb-wrap" ref={wrapRef}>
        {/* Radiale Action-Buttons — relativ zum Orb-Zentrum */}
        <div style={{ position:"absolute", width:62, height:62, left:0, top:0, pointerEvents: open ? "auto" : "none" }}>
          {ACTIONS.map(a => (
            <OrbActionBtn
              key={a.key}
              icon={a.icon}
              label={a.label}
              badge={a.badge}
              color={a.color}
              angle={a.angle}
              open={open}
              delay={a.delay}
              onClick={() => handleAction(a.fn)}
            />
          ))}
        </div>

        {/* ── Der Orb ──────────────────────────────────────── */}
        <div
          className={`hui-orb-core${open ? "" : " hui-orb--idle"}`}
          style={{
            background: open
              ? `radial-gradient(circle at 38% 35%, rgba(255,255,255,0.82) 0%, rgba(255,252,248,0.70) 50%, ${mood.color}28 100%)`
              : `radial-gradient(circle at 38% 35%, rgba(255,255,255,0.78) 0%, rgba(255,252,248,0.62) 45%, ${mood.color}22 100%)`,
            backdropFilter:         "blur(24px) saturate(1.5)",
            WebkitBackdropFilter:   "blur(24px) saturate(1.5)",
            border:    `1px solid rgba(255,255,255,${open ? "0.55" : "0.42"})`,
            boxShadow: glowA,
            '--orb-glow-a': glowA,
            '--orb-glow-b': glowB,
            // Breathe-Glow-Animation nur wenn idle + mood aktiv
            animation: notify
              ? `hui-orb-notify 0.7s ease-out`
              : (!open && activeMood)
                ? `hui-orb-float 5.5s ease-in-out infinite, hui-orb-breathe 3.5s ease-in-out infinite`
                : !open
                  ? `hui-orb-float 5.5s ease-in-out infinite`
                  : "none",
            transform: open ? "scale(1.06)" : undefined,
          }}
          onClick={toggleOrb}
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") toggleOrb(e); }}
        >
          {/* Glassmorphism inner ring */}
          <div className="hui-orb-ring"/>

          {/* Pulse ring — nur bei Notif oder offenem Mood */}
          {(notify || (activeMood && !open)) && (
            <div className="hui-orb-pulse-ring"
              style={{ borderColor: `${mood.color}60` }}/>
          )}

          {/* Icon: HUI + oder X */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"center",
            transition: "transform 0.35s cubic-bezier(0.34,1.4,0.64,1), opacity 0.25s ease",
            transform:  open ? "rotate(45deg)" : "rotate(0deg)",
          }}>
            {/* HUI Logo */}
            <div style={{
              position: "absolute",
              opacity: open ? 0 : 1,
              transition: "opacity 0.22s ease",
            }}>
              <img
                src="/hui-logo.jpg"
                alt="HUI"
                loading="eager"
                style={{ width:34, height:34, borderRadius:"50%", objectFit:"cover", display:"block" }}
                onError={e => { e.target.style.display="none"; }}
              />
            </div>
            {/* Plus → X */}
            <svg
              width="22" height="22" viewBox="0 0 22 22" fill="none"
              style={{
                opacity: open ? 1 : 0,
                transition: "opacity 0.22s ease",
              }}
            >
              <line x1="4" y1="11" x2="18" y2="11" stroke={mood.color} strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="11" y1="4" x2="11" y2="18" stroke={mood.color} strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Notif-Dot am Orb (wenn geschlossen & Notifs vorhanden) */}
          {!open && notifCount > 0 && (
            <div style={{
              position:"absolute", top:5, right:5,
              width:8, height:8, borderRadius:"50%",
              background:`linear-gradient(135deg,${C.coral},#FF6B6B)`,
              border:"1.5px solid rgba(255,251,248,0.9)",
              boxShadow:`0 0 6px ${C.coral}`,
            }}/>
          )}

          {/* Cart-Dot */}
          {!open && cartCount > 0 && (
            <div style={{
              position:"absolute", top:5, left:5,
              width:8, height:8, borderRadius:"50%",
              background:`linear-gradient(135deg,#F5A623,#F5A623CC)`,
              border:"1.5px solid rgba(255,251,248,0.9)",
            }}/>
          )}
        </div>
      </div>
    </>
  );
}
