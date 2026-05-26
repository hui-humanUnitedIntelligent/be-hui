/**
 * HuiMembershipFlow v5 — 4-Karten Horizontal Slide Flow
 *
 * PARADIGMA:
 * - 4 diskrete Karten (Cards), die horizontal sliden
 * - Karte 1: Einladung — Werde Teil der HUI Gemeinschaft
 * - Karte 2: Dein kreativer Raum — Feature Cards
 * - Karte 3: HUI ist mehr als eine Plattform — Werte
 * - Karte 4: Finale Bestätigung — Checkboxen + CTA
 *
 * Design: Glassmorphism, Teal/Coral-Glow, sanft, emotional
 * iPad + Mobile + Desktop optimiert
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cleanupOrbEnvironment } from "../lib/cleanup/cleanupOrbEnvironment.js";
import { useAuth } from "../lib/AuthContext";

// ─── Design Tokens ────────────────────────────────────────────
const T = {
  teal:   "#16D7C5",
  coral:  "#FF8A6B",
  gold:   "#F5A623",
  bg:     "#060A14",
  card:   "rgba(12,18,32,0.88)",
  text:   "rgba(255,255,255,0.95)",
  soft:   "rgba(255,255,255,0.72)",
  muted:  "rgba(255,255,255,0.45)",
  dim:    "rgba(255,255,255,0.18)",
  border: "rgba(255,255,255,0.10)",
};

// ─── Bilder (Supabase-gehostete Assets) ───────────────────────
const IMG = {
  s1:  "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/4404032bd_generated_image.png",
  s2b: "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/227457cca_generated_image.png",
  s3:  "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/6ba64a1aa_generated_image.png",
  s5:  "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/dab418e97_generated_image.png",
  s7:  "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/c5d8bdc7f_generated_image.png",
};

// ─── Global CSS ───────────────────────────────────────────────
const CSS = `
  @keyframes hmf5-fade  { from{opacity:0} to{opacity:1} }
  @keyframes hmf5-rise  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes hmf5-pop   { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
  @keyframes hmf5-pulse {
    0%,100% { box-shadow:0 0 0 0 rgba(22,215,197,0.0),0 0 28px rgba(22,215,197,0.28); }
    50%     { box-shadow:0 0 0 9px rgba(22,215,197,0.0),0 0 48px rgba(22,215,197,0.52); }
  }
  @keyframes hmf5-orb-breathe {
    0%,100% { transform:scale(1);    filter:brightness(1); }
    50%     { transform:scale(1.06); filter:brightness(1.12); }
  }
  @keyframes hmf5-ring {
    0%   { transform:scale(1);   opacity:0.5; }
    100% { transform:scale(1.55);opacity:0; }
  }
  @keyframes hmf5-ken {
    from { transform:scale(1.00); }
    to   { transform:scale(1.06); }
  }
  @keyframes hmf5-slide-in-right {
    from { opacity:0; transform:translateX(40px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes hmf5-slide-in-left {
    from { opacity:0; transform:translateX(-40px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes hmf5-check-pop {
    0%   { transform:scale(0); }
    60%  { transform:scale(1.2); }
    100% { transform:scale(1); }
  }
  .hmf5-tap {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    cursor: pointer;
  }
  .hmf5-tap:active { opacity:0.80; }
  .hmf5-slide-r { animation: hmf5-slide-in-right 0.42s cubic-bezier(0.22,1,0.36,1) both; }
  .hmf5-slide-l { animation: hmf5-slide-in-left  0.42s cubic-bezier(0.22,1,0.36,1) both; }
  @keyframes hmf5-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

  /* Card2 — Spatial energy system */
  @keyframes hmf5-float-a {
    0%,100% { transform:translateY(0px) translateX(0px); }
    33%     { transform:translateY(-8px) translateX(3px); }
    66%     { transform:translateY(4px)  translateX(-4px); }
  }
  @keyframes hmf5-float-b {
    0%,100% { transform:translateY(0px) translateX(0px); }
    33%     { transform:translateY(6px)  translateX(-5px); }
    66%     { transform:translateY(-10px) translateX(3px); }
  }
  @keyframes hmf5-float-c {
    0%,100% { transform:translateY(0px) translateX(0px); }
    33%     { transform:translateY(-5px) translateX(-3px); }
    66%     { transform:translateY(8px)  translateX(5px); }
  }
  @keyframes hmf5-float-d {
    0%,100% { transform:translateY(0px) translateX(0px); }
    33%     { transform:translateY(9px)  translateX(4px); }
    66%     { transform:translateY(-6px) translateX(-2px); }
  }
  @keyframes hmf5-float-e {
    0%,100% { transform:translateY(0px) translateX(0px); }
    33%     { transform:translateY(-7px) translateX(-4px); }
    66%     { transform:translateY(5px)  translateX(6px); }
  }
  @keyframes hmf5-orb-center-pulse {
    0%,100% {
      box-shadow: 0 0 0 0 rgba(22,215,197,0),
                  0 0 48px rgba(22,215,197,0.38),
                  0 0 96px rgba(22,215,197,0.15),
                  0 0 160px rgba(22,215,197,0.06);
    }
    50% {
      box-shadow: 0 0 0 18px rgba(22,215,197,0),
                  0 0 72px rgba(22,215,197,0.58),
                  0 0 140px rgba(22,215,197,0.22),
                  0 0 220px rgba(22,215,197,0.08);
    }
  }
  @keyframes hmf5-line-appear {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes hmf5-pill-in {
    from { opacity:0; transform:scale(0.72) translateY(12px); }
    to   { opacity:1; transform:scale(1) translateY(0); }
  }
  @keyframes hmf5-particle-drift {
    0%   { transform:translateY(0) translateX(0) scale(1); opacity:0.7; }
    50%  { transform:translateY(-18px) translateX(6px) scale(1.3); opacity:0.4; }
    100% { transform:translateY(-36px) translateX(-4px) scale(0.7); opacity:0; }
  }
`;

let _cssInjected = false;
function injectCSS() {
  if (_cssInjected || typeof document === "undefined") return;
  _cssInjected = true;
  const s = document.createElement("style");
  s.textContent = CSS;
  document.head.appendChild(s);
}

// ─── Helpers ──────────────────────────────────────────────────
const sp = h => <div style={{ height: h }} />;

// ─── HUI Orb ─────────────────────────────────────────────────
function HuiOrb({ size = 88, pulse = true }) {
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      {/* Outer ring */}
      {pulse && (
        <>
          <div style={{
            position:"absolute", inset:-12, borderRadius:"50%",
            border:"1.5px solid rgba(22,215,197,0.22)",
            animation:"hmf5-ring 2.4s ease-out infinite",
          }}/>
          <div style={{
            position:"absolute", inset:-6, borderRadius:"50%",
            border:"1.5px solid rgba(22,215,197,0.32)",
            animation:"hmf5-ring 2.4s 0.8s ease-out infinite",
          }}/>
        </>
      )}
      {/* Core */}
      <div style={{
        width:size, height:size, borderRadius:size*0.28,
        overflow:"hidden", position:"relative",
        boxShadow:`
          0 0 0 2px rgba(22,215,197,0.22),
          0 0 32px rgba(22,215,197,0.45),
          0 0 64px rgba(22,215,197,0.18),
          0 8px 32px rgba(0,0,0,0.5)
        `,
        animation: pulse ? "hmf5-orb-breathe 3.5s ease-in-out infinite" : "none",
      }}>
        <img
          src="/hui-logo-real.jpg"
          alt="HUI"
          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
          onError={e => { e.target.src="/hui-logo.jpg"; }}
        />
      </div>
    </div>
  );
}

// ─── Progress Dots ────────────────────────────────────────────
function ProgressDots({ total, current }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
      {Array.from({length:total}).map((_,i) => {
        const active = i === current;
        const done   = i < current;
        return (
          <div key={i} style={{
            height: 4,
            width:  active ? 22 : 8,
            borderRadius: 99,
            background: active
              ? `linear-gradient(90deg, ${T.teal}, ${T.coral})`
              : done ? `rgba(22,215,197,0.45)` : T.dim,
            transition:"all 0.38s cubic-bezier(0.22,1,0.36,1)",
            boxShadow: active ? `0 0 8px rgba(22,215,197,0.55)` : "none",
          }}/>
        );
      })}
    </div>
  );
}

// ─── Feature Grid Card ────────────────────────────────────────
function FeatureGridItem({ icon, label, color = T.teal, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      gap:10, padding:"18px 12px",
      borderRadius:20,
      background:"rgba(255,255,255,0.05)",
      border:`1px solid rgba(255,255,255,0.09)`,
      backdropFilter:"blur(12px)",
      WebkitBackdropFilter:"blur(12px)",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0) scale(1)" : "translateY(14px) scale(0.95)",
      transition:"opacity 0.45s ease, transform 0.45s cubic-bezier(0.22,1,0.36,1)",
    }}>
      <div style={{
        width:44, height:44, borderRadius:14,
        background:`rgba(22,215,197,0.10)`,
        border:`1px solid rgba(22,215,197,0.18)`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:20,
      }}>{icon}</div>
      <span style={{
        fontSize:12.5, fontWeight:600, color:T.soft,
        textAlign:"center", lineHeight:1.35,
      }}>{label}</span>
    </div>
  );
}

// ─── Value Pill ───────────────────────────────────────────────
function ValuePill({ icon, label, color = T.teal, delay = 0 }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:9,
      padding:"11px 18px", borderRadius:50,
      background:"rgba(255,255,255,0.06)",
      border:"1px solid rgba(255,255,255,0.10)",
      backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
      opacity: v ? 1 : 0,
      transform: v ? "translateY(0)" : "translateY(12px)",
      transition:"opacity 0.45s ease, transform 0.45s ease",
    }}>
      <span style={{ fontSize:16 }}>{icon}</span>
      <span style={{ fontSize:14, fontWeight:600, color:T.soft }}>{label}</span>
    </div>
  );
}

// ─── Checkbox Row ─────────────────────────────────────────────
function CheckRow({ checked, onChange, label, link, delay = 0 }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <button
      className="hmf5-tap"
      onClick={onChange}
      style={{
        width:"100%", padding:"16px 18px",
        borderRadius:16, border:"none",
        background: checked ? "rgba(22,215,197,0.08)" : "rgba(255,255,255,0.04)",
        outline: checked ? "1.5px solid rgba(22,215,197,0.28)" : "1px solid rgba(255,255,255,0.08)",
        display:"flex", alignItems:"center", gap:14,
        fontFamily:"inherit", textAlign:"left",
        cursor:"pointer",
        opacity: v ? 1 : 0,
        transform: v ? "translateX(0)" : "translateX(-16px)",
        transition: "opacity 0.4s ease, transform 0.4s ease, background 0.22s ease, outline 0.22s ease",
      }}>
      {/* Checkbox */}
      <div style={{
        width:26, height:26, borderRadius:8, flexShrink:0,
        background: checked ? T.teal : "transparent",
        border: checked ? `2px solid ${T.teal}` : "2px solid rgba(255,255,255,0.22)",
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow: checked ? `0 0 12px rgba(22,215,197,0.45)` : "none",
        transition:"all 0.22s cubic-bezier(0.34,1.4,0.64,1)",
      }}>
        {checked && (
          <svg width="13" height="10" viewBox="0 0 13 10" fill="none"
            style={{ animation:"hmf5-check-pop 0.28s cubic-bezier(0.34,1.4,0.64,1) both" }}>
            <path d="M1.5 5L5 8.5L11.5 1.5"
              stroke="#041210" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div style={{ flex:1 }}>
        <span style={{ fontSize:14, color: checked ? T.text : T.soft, fontWeight:500 }}>
          {label}{" "}
          {link && (
            <span style={{
              color:T.teal, fontWeight:600,
              textDecoration:"underline", textDecorationColor:"rgba(22,215,197,0.4)",
            }}>{link}</span>
          )}
        </span>
      </div>
    </button>
  );
}

// ─── CTA Button ───────────────────────────────────────────────
function CtaBtn({ label, onClick, disabled, loading, icon, variant = "teal" }) {
  const isTeal = variant === "teal";
  return (
    <button
      className="hmf5-tap"
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width:"100%", height:58,
        borderRadius:18, border:"none",
        fontFamily:"inherit", fontSize:17, fontWeight:700,
        letterSpacing:"-0.02em",
        display:"flex", alignItems:"center", justifyContent:"center", gap:10,
        cursor: (disabled || loading) ? "not-allowed" : "pointer",
        background: (disabled || loading)
          ? "rgba(255,255,255,0.07)"
          : isTeal
            ? `linear-gradient(135deg, ${T.teal} 0%, #0AB9AE 100%)`
            : `linear-gradient(135deg, ${T.coral} 0%, #F55F41 100%)`,
        color: (disabled || loading) ? T.muted : (isTeal ? "#041210" : "#170806"),
        boxShadow: (disabled || loading) ? "none" : isTeal
          ? `0 10px 32px rgba(22,215,197,0.35), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.22)`
          : `0 10px 32px rgba(255,138,107,0.35), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.18)`,
        opacity: (disabled || loading) ? 0.45 : 1,
        transition:"all 0.32s cubic-bezier(0.22,1,0.36,1)",
      }}>
      {loading
        ? <div style={{
            width:20, height:20, borderRadius:"50%",
            border:"2.5px solid rgba(255,255,255,0.18)",
            borderTopColor: isTeal ? "#041210" : "#fff",
            animation:"hmf5-spin 0.7s linear infinite",
          }}/>
        : <>
            {label}
            {icon && <span style={{ fontSize:18 }}>{icon}</span>}
          </>
      }
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// KARTE 1 — Werde Teil der HUI Gemeinschaft
// ═══════════════════════════════════════════════════════════════
function Card1({ onNext, dir }) {
  return (
    <div className={dir === 1 ? "hmf5-slide-r" : "hmf5-slide-l"} style={{
      position:"absolute", inset:0, overflow:"hidden",
    }}>
      {/* Fullscreen Hintergrundbild */}
      <div style={{
        position:"absolute", inset:0,
        backgroundImage:`url(${IMG.s1})`,
        backgroundSize:"cover", backgroundPosition:"center",
        animation:"hmf5-ken 24s ease-in-out both",
      }}/>
      {/* Gradient Overlay */}
      <div style={{
        position:"absolute", inset:0,
        background:`linear-gradient(
          180deg,
          rgba(6,10,20,0.12) 0%,
          rgba(6,10,20,0.22) 25%,
          rgba(6,10,20,0.68) 58%,
          rgba(6,10,20,0.97) 80%
        )`,
      }}/>
      {/* Content */}
      <div style={{
        position:"absolute", inset:0,
        display:"flex", flexDirection:"column", justifyContent:"flex-end",
        padding:"0 28px calc(env(safe-area-inset-bottom, 0px) + 32px)",
        overflowY:"auto", WebkitOverflowScrolling:"touch",
      }}>
        {/* Orb + Badge */}
        <div style={{
          display:"flex", flexDirection:"column", alignItems:"center",
          marginBottom:32,
          animation:"hmf5-pop 0.6s cubic-bezier(0.22,1,0.36,1) both",
        }}>
          <HuiOrb size={96} pulse />
        </div>

        {/* Headline */}
        <div style={{ animation:"hmf5-rise 0.55s 0.12s ease both" }}>
          <h1 style={{
            fontWeight:800, fontSize:"clamp(30px,8vw,38px)",
            color:T.text, margin:"0 0 14px",
            letterSpacing:-1.2, lineHeight:1.13,
          }}>
            Werde Teil der<br/>HUI Gemeinschaft
          </h1>
          <p style={{
            fontSize:15, color:T.soft, lineHeight:1.7,
            margin:"0 0 10px", maxWidth:320,
          }}>
            Du kannst HUI bereits entdecken, erleben und unterstützen.
          </p>
          <p style={{
            fontSize:14.5, color:T.soft, lineHeight:1.65,
            margin:"0 0 32px", maxWidth:320,
          }}>
            Als Mitglied öffnest du deinen eigenen Raum: Teile Momente, veröffentliche Werke,
            erschaffe Erlebnisse und werde sichtbar für andere Menschen.
          </p>
        </div>

        <div style={{ animation:"hmf5-rise 0.5s 0.22s ease both" }}>
          <CtaBtn
            label="Weiter"
            icon="→"
            onClick={onNext}
          />
        </div>
        {sp(4)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// KARTE 2 — Dein kreativer Raum
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// KARTE 2 — Dein kreativer Raum öffnet sich
// Spatial / Cinematic / Minimal — KEINE Feature-Grid-Boxen
// ═══════════════════════════════════════════════════════════════

// Floating energy pill — schwebt, leuchtet, fühlt sich an wie Möglichkeit
function EnergyPill({ icon, label, style = {}, floatAnim = "hmf5-float-a", delay = 0, glowColor = T.teal }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:8,
      padding:"9px 16px 9px 11px",
      borderRadius:100,
      background:"rgba(255,255,255,0.06)",
      backdropFilter:"blur(18px)",
      WebkitBackdropFilter:"blur(18px)",
      border:`1px solid rgba(255,255,255,0.11)`,
      boxShadow:`0 4px 20px rgba(0,0,0,0.28), 0 0 14px ${glowColor}22`,
      opacity: visible ? 1 : 0,
      animation: visible ? `hmf5-pill-in 0.6s cubic-bezier(0.22,1,0.36,1) both, ${floatAnim} ${5 + Math.random()*2.5|0}s ${delay*0.001}s ease-in-out infinite` : "none",
      willChange:"transform, opacity",
      position:"absolute",
      ...style,
    }}>
      <span style={{ fontSize:16, lineHeight:1, flexShrink:0 }}>{icon}</span>
      <span style={{
        fontSize:12.5, fontWeight:600,
        color:"rgba(255,255,255,0.82)",
        letterSpacing:"-0.01em", whiteSpace:"nowrap",
      }}>{label}</span>
    </div>
  );
}

// Central orb — pulsiert, atmet, strahlt Energie aus
function CenterOrb({ visible }) {
  return (
    <div style={{
      position:"absolute",
      top:"50%", left:"50%",
      transform:"translate(-50%,-50%)",
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      {/* Outer atmospheric rings */}
      <div style={{
        position:"absolute",
        width:220, height:220, borderRadius:"50%",
        border:"1px solid rgba(22,215,197,0.08)",
        animation: visible ? "hmf5-ring 3.8s ease-out infinite" : "none",
      }}/>
      <div style={{
        position:"absolute",
        width:170, height:170, borderRadius:"50%",
        border:"1px solid rgba(22,215,197,0.12)",
        animation: visible ? "hmf5-ring 3.8s 1.2s ease-out infinite" : "none",
      }}/>
      <div style={{
        position:"absolute",
        width:130, height:130, borderRadius:"50%",
        border:"1px solid rgba(22,215,197,0.16)",
        animation: visible ? "hmf5-ring 3.8s 0.6s ease-out infinite" : "none",
      }}/>

      {/* Connection lines — subtle SVG spokes to pill positions */}
      <svg style={{
        position:"absolute",
        width:300, height:300,
        top:"50%", left:"50%",
        transform:"translate(-50%,-50%)",
        overflow:"visible",
        opacity: visible ? 0.18 : 0,
        transition:"opacity 1.2s ease",
        pointerEvents:"none",
      }} viewBox="0 0 300 300">
        {/* Spokes from center (150,150) to pill anchor points */}
        {[
          [150, 30],   // top
          [270, 90],   // top-right
          [260, 220],  // bottom-right
          [40,  220],  // bottom-left
          [42,  90],   // top-left
        ].map(([x, y], i) => (
          <line key={i}
            x1="150" y1="150" x2={x} y2={y}
            stroke={i % 2 === 0 ? T.teal : T.coral}
            strokeWidth="0.8"
            strokeDasharray="3 6"
            style={{
              animation:`hmf5-line-appear 0.4s ${0.4 + i * 0.12}s ease both`,
            }}
          />
        ))}
      </svg>

      {/* Glow aura */}
      <div style={{
        position:"absolute",
        width:96, height:96, borderRadius:"50%",
        background:`radial-gradient(circle, rgba(22,215,197,0.28) 0%, transparent 70%)`,
        filter:"blur(16px)",
        animation: visible ? "hmf5-orb-center-pulse 4s ease-in-out infinite" : "none",
      }}/>

      {/* HUI Orb core */}
      <div style={{
        width:80, height:80,
        borderRadius:80*0.28,
        overflow:"hidden",
        position:"relative", zIndex:2,
        boxShadow:`
          0 0 0 2px rgba(22,215,197,0.30),
          0 0 32px rgba(22,215,197,0.50),
          0 0 64px rgba(22,215,197,0.20),
          0 12px 40px rgba(0,0,0,0.55)
        `,
        animation: visible ? "hmf5-orb-breathe 4s ease-in-out infinite" : "none",
        flexShrink:0,
      }}>
        <img
          src="/hui-logo-real.jpg"
          alt="HUI"
          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
          onError={e => { e.target.style.display="none"; }}
        />
        {/* Teal shimmer overlay */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(135deg, rgba(22,215,197,0.18) 0%, transparent 55%)",
          pointerEvents:"none",
        }}/>
      </div>
    </div>
  );
}

// Floating particles — sehr subtil
function Particles({ count = 8 }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 15 + Math.random() * 70,
      y: 20 + Math.random() * 60,
      size: 2 + Math.random() * 2.5,
      delay: Math.random() * 3,
      dur:   3.5 + Math.random() * 2.5,
      color: i % 3 === 0 ? T.teal : i % 3 === 1 ? T.coral : "rgba(255,255,255,0.6)",
    }))
  ).current;

  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position:"absolute",
          left:`${p.x}%`, top:`${p.y}%`,
          width:p.size, height:p.size,
          borderRadius:"50%",
          background:p.color,
          boxShadow:`0 0 ${p.size*3}px ${p.color}`,
          opacity:0,
          animation:`hmf5-particle-drift ${p.dur}s ${p.delay}s ease-out infinite`,
        }}/>
      ))}
    </div>
  );
}

function Card2({ onNext, onBack, dir }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 120);
    return () => clearTimeout(t);
  }, []);

  // 5 energy pills — schwebend um den Orb
  const pills = [
    { icon:"✍️", label:"Momente teilen",     floatAnim:"hmf5-float-a", delay:350,  glowColor:T.teal,
      style:{ top:"7%",  left:"50%", transform:"translateX(-50%)" } },
    { icon:"🎨", label:"Werke zeigen",         floatAnim:"hmf5-float-b", delay:500,  glowColor:T.coral,
      style:{ top:"28%", right:"2%" } },
    { icon:"🌱", label:"Wirkung entfalten",    floatAnim:"hmf5-float-c", delay:650,  glowColor:"#6BCB77",
      style:{ bottom:"26%", right:"4%" } },
    { icon:"🤝", label:"Menschen verbinden",   floatAnim:"hmf5-float-d", delay:800,  glowColor:T.gold,
      style:{ bottom:"26%", left:"2%" } },
    { icon:"✨", label:"Räume öffnen",          floatAnim:"hmf5-float-e", delay:950,  glowColor:"#C084FC",
      style:{ top:"28%", left:"2%" } },
  ];

  return (
    <div className={dir === 1 ? "hmf5-slide-r" : "hmf5-slide-l"} style={{
      position:"absolute", inset:0,
      display:"flex", flexDirection:"column",
      overflow:"hidden",
    }}>
      {/* ── Cinematic Background ── */}
      <div style={{ position:"absolute", inset:0, zIndex:0 }}>
        {/* Photo layer — blurred humans */}
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url(${IMG.s2b})`,
          backgroundSize:"cover", backgroundPosition:"center 30%",
          opacity:0.40,
          filter:"blur(3px)",
          transform:"scale(1.06)",
          animation:"hmf5-ken 30s ease-in-out both",
        }}/>
        {/* Gradient veil — depth layers */}
        <div style={{
          position:"absolute", inset:0,
          background:`
            radial-gradient(ellipse 70% 55% at 50% 42%, rgba(22,215,197,0.09) 0%, transparent 65%),
            linear-gradient(180deg,
              rgba(6,10,20,0.62) 0%,
              rgba(6,10,20,0.30) 22%,
              rgba(6,10,20,0.30) 60%,
              rgba(6,10,20,0.90) 82%,
              rgba(6,10,20,0.98) 100%
            )
          `,
        }}/>
        {/* Subtle radial teal aura behind the orb center */}
        <div style={{
          position:"absolute",
          top:"40%", left:"50%",
          transform:"translate(-50%,-50%)",
          width:280, height:280, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(22,215,197,0.12) 0%, transparent 70%)",
          filter:"blur(30px)",
          animation: ready ? "hmf5-orb-center-pulse 5s ease-in-out infinite" : "none",
        }}/>
      </div>

      {/* ── Floating Particles ── */}
      <div style={{ position:"absolute", inset:0, zIndex:1, pointerEvents:"none" }}>
        <Particles count={10} />
      </div>

      {/* ── Top: Progress + tiny step label ── */}
      <div style={{
        position:"relative", zIndex:3,
        padding:`max(52px, env(safe-area-inset-top, 52px)) 24px 0`,
        animation:"hmf5-fade 0.5s 0.1s ease both",
      }}>
        <ProgressDots total={4} current={1} />
      </div>

      {/* ── Center: Spatial Orb + Pills ── */}
      <div style={{
        position:"relative", zIndex:2,
        flex:1,
        display:"flex", alignItems:"center", justifyContent:"center",
        minHeight:0,
      }}>
        {/* Pill orbit area — positioned relative to center */}
        <div style={{ position:"relative", width:"100%", height:"100%", minHeight:200 }}>
          <CenterOrb visible={ready} />
          {pills.map((p, i) => (
            <EnergyPill key={i} {...p} />
          ))}
        </div>
      </div>

      {/* ── Bottom: Text + CTA ── */}
      <div style={{
        position:"relative", zIndex:3,
        padding:`0 28px calc(env(safe-area-inset-bottom, 0px) + 28px)`,
        animation:"hmf5-rise 0.55s 0.2s ease both",
      }}>
        {/* Headline */}
        <h1 style={{
          fontWeight:800,
          fontSize:"clamp(24px,6.5vw,32px)",
          color:T.text, margin:"0 0 10px",
          letterSpacing:-0.8, lineHeight:1.18,
        }}>Dein kreativer Raum<br/>öffnet sich</h1>

        {/* Subline */}
        <p style={{
          fontSize:15, color:T.soft, lineHeight:1.68,
          margin:"0 0 24px", maxWidth:360,
        }}>
          Als Talent kannst du Menschen inspirieren,
          Werke teilen und besondere Räume erschaffen.
        </p>

        {/* Single CTA */}
        <button className="hmf5-tap" onClick={onNext} style={{
          width:"100%",
          padding:"16px 24px",
          borderRadius:16,
          border:"1px solid rgba(22,215,197,0.28)",
          background:"rgba(22,215,197,0.10)",
          backdropFilter:"blur(20px)",
          WebkitBackdropFilter:"blur(20px)",
          fontFamily:"inherit",
          fontSize:16, fontWeight:700,
          color:T.teal,
          letterSpacing:-0.2,
          cursor:"pointer",
          boxShadow:`
            0 0 0 1px rgba(22,215,197,0.14),
            0 0 32px rgba(22,215,197,0.18),
            0 8px 24px rgba(0,0,0,0.28)
          `,
          transition:"all 0.22s ease",
          marginBottom:12,
        }}>Das klingt nach mir →</button>

        <button className="hmf5-tap" onClick={onBack} style={{
          display:"block", width:"100%",
          background:"none", border:"none", fontFamily:"inherit",
          fontSize:14, color:T.muted, padding:"10px",
          letterSpacing:-0.2, cursor:"pointer",
          textAlign:"center",
        }}>← Zurück</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// KARTE 3 — HUI ist mehr als eine Plattform
// ═══════════════════════════════════════════════════════════════
function Card3({ onNext, onBack, dir }) {
  const values = [
    { icon:"🤍", label:"Respekt" },
    { icon:"🌿", label:"Echtheit" },
    { icon:"✦",  label:"Kreativität" },
    { icon:"🤝", label:"Verbindung" },
    { icon:"🌍", label:"Verantwortung" },
  ];
  return (
    <div className={dir === 1 ? "hmf5-slide-r" : "hmf5-slide-l"} style={{
      position:"absolute", inset:0, overflowY:"auto",
      WebkitOverflowScrolling:"touch",
    }}>
      {/* Fullscreen BG image */}
      <div style={{ position:"fixed", inset:0, zIndex:0,
        backgroundImage:`url(${IMG.s5})`,
        backgroundSize:"cover", backgroundPosition:"center",
        animation:"hmf5-ken 26s ease-in-out both",
      }}/>
      <div style={{ position:"fixed", inset:0, zIndex:1, background:`linear-gradient(
        180deg,
        rgba(6,10,20,0.18) 0%,
        rgba(6,10,20,0.30) 22%,
        rgba(6,10,20,0.72) 55%,
        rgba(6,10,20,0.98) 78%
      )`}}/>

      {/* Content */}
      <div style={{
        position:"relative", zIndex:2,
        padding:`max(56px, env(safe-area-inset-top, 56px)) 24px
                 calc(env(safe-area-inset-bottom, 0px) + 32px)`,
        display:"flex", flexDirection:"column", minHeight:"100%",
      }}>
        <div style={{ flex:1 }}/>

        <div style={{ animation:"hmf5-fade 0.4s ease both" }}>
          <ProgressDots total={4} current={2} />
          {sp(18)}
          <div style={{
            fontSize:11, fontWeight:700, color:T.teal,
            letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10,
          }}>3 / 4</div>
          <h1 style={{
            fontWeight:800, fontSize:"clamp(26px,7vw,34px)",
            color:T.text, margin:"0 0 14px",
            letterSpacing:-1, lineHeight:1.15,
          }}>HUI ist mehr als<br/>eine Plattform</h1>
          <p style={{
            fontSize:15.5, color:T.soft, lineHeight:1.7,
            margin:"0 0 8px",
          }}>
            Wir glauben an echte Begegnungen, kreative Freiheit
            und respektvolle Gemeinschaft.
          </p>
          <p style={{
            fontSize:14.5, color:"rgba(255,255,255,0.52)", lineHeight:1.65,
            margin:"0 0 30px",
          }}>
            Hier geht es nicht um Lautstärke,<br/>
            sondern um Resonanz zwischen Menschen.
          </p>

          {/* Value Pills */}
          <div style={{
            display:"flex", flexWrap:"wrap", gap:10, marginBottom:32,
          }}>
            {values.map((v, i) => (
              <ValuePill key={i} icon={v.icon} label={v.label} delay={60 + i * 70} />
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <CtaBtn label="Ich verstehe" icon="→" onClick={onNext} />
            <button className="hmf5-tap" onClick={onBack} style={{
              background:"none", border:"none", fontFamily:"inherit",
              fontSize:14, color:T.muted, padding:"12px",
              letterSpacing:-0.2,
            }}>← Zurück</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// KARTE 4 — Finale Bestätigung
// ═══════════════════════════════════════════════════════════════
function Card4({ onFinish, onBack, dir, loading, error }) {
  const [agb,      setAgb]      = useState(false);
  const [privacy,  setPrivacy]  = useState(false);
  const [rules,    setRules]    = useState(false);

  const allChecked = agb && privacy && rules;

  return (
    <div className={dir === 1 ? "hmf5-slide-r" : "hmf5-slide-l"} style={{
      position:"absolute", inset:0, overflowY:"auto",
      WebkitOverflowScrolling:"touch",
    }}>
      {/* BG */}
      <div style={{ position:"fixed", inset:0, zIndex:0,
        backgroundImage:`url(${IMG.s7})`,
        backgroundSize:"cover", backgroundPosition:"center",
        opacity:0.18,
        animation:"hmf5-ken 30s ease-in-out both",
      }}/>
      <div style={{ position:"fixed", inset:0, zIndex:1,
        background:`linear-gradient(180deg, rgba(6,10,20,0.85) 0%, rgba(6,10,20,0.98) 100%)`,
      }}/>

      {/* Content */}
      <div style={{
        position:"relative", zIndex:2,
        padding:`max(56px, env(safe-area-inset-top, 56px)) 24px
                 calc(env(safe-area-inset-bottom, 0px) + 32px)`,
        minHeight:"100%", display:"flex", flexDirection:"column",
      }}>

        <div style={{ animation:"hmf5-fade 0.4s ease both" }}>
          <ProgressDots total={4} current={3} />
          {sp(18)}

          {/* Heart + Headline */}
          <div style={{
            display:"flex", flexDirection:"column", alignItems:"center",
            textAlign:"center", marginBottom:28,
          }}>
            <div style={{
              fontSize:40, marginBottom:14,
              animation:"hmf5-pop 0.5s 0.1s cubic-bezier(0.34,1.4,0.64,1) both",
            }}>❤️</div>
            <div style={{
              fontSize:11, fontWeight:700, color:T.teal,
              letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10,
            }}>4 / 4</div>
            <h1 style={{
              fontWeight:800, fontSize:"clamp(24px,7vw,32px)",
              color:T.text, margin:"0 0 10px",
              letterSpacing:-0.9, lineHeight:1.15,
            }}>Willkommen in der<br/>Gemeinschaft</h1>
            <p style={{ fontSize:14.5, color:T.soft, lineHeight:1.65, margin:0, maxWidth:280 }}>
              Mit deiner Mitgliedschaft gestaltest du<br/>HUI aktiv mit.
            </p>
          </div>

          {/* Checkboxen */}
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
            <CheckRow
              checked={agb}
              onChange={() => setAgb(v=>!v)}
              label="Ich akzeptiere die"
              link="AGB"
              delay={80}
            />
            <CheckRow
              checked={privacy}
              onChange={() => setPrivacy(v=>!v)}
              label="Ich akzeptiere die"
              link="Datenschutzrichtlinien"
              delay={160}
            />
            <CheckRow
              checked={rules}
              onChange={() => setRules(v=>!v)}
              label="Ich respektiere die"
              link="Gemeinschaftsregeln"
              delay={240}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding:"12px 16px", borderRadius:12, marginBottom:14,
              background:"rgba(239,68,68,0.12)",
              border:"1px solid rgba(239,68,68,0.22)",
              fontSize:13.5, color:"rgba(239,68,68,0.9)", lineHeight:1.5,
            }}>
              {error}
            </div>
          )}

          {/* CTA */}
          <div style={{ animation:"hmf5-rise 0.5s 0.32s ease both" }}>
            <CtaBtn
              label="Mitglied werden"
              icon="🤝"
              variant="coral"
              onClick={() => onFinish()}
              disabled={!allChecked}
              loading={loading}
            />
          </div>
          {sp(10)}

          {/* Trust Badge */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            animation:"hmf5-fade 0.5s 0.45s ease both",
          }}>
            <span style={{ fontSize:13 }}>🔒</span>
            <span style={{ fontSize:12.5, color:T.muted }}>
              Sicher. Transparent. Respektvoll.
            </span>
          </div>
          {sp(8)}

          <button className="hmf5-tap" onClick={onBack} style={{
            display:"block", width:"100%",
            background:"none", border:"none", fontFamily:"inherit",
            fontSize:14, color:T.muted, padding:"10px",
            letterSpacing:-0.2, textAlign:"center",
          }}>← Zurück</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUCCESS SCREEN — Transformation bestätigt
// ═══════════════════════════════════════════════════════════════
function SuccessScreen({ onDone }) {
  return (
    <div style={{
      position:"absolute", inset:0,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"0 32px",
      background:T.bg,
      animation:"hmf5-fade 0.5s ease both",
    }}>
      {/* Pulsing Orb */}
      <div style={{
        marginBottom:36,
        animation:"hmf5-pop 0.6s cubic-bezier(0.34,1.4,0.64,1) both",
      }}>
        <HuiOrb size={100} pulse />
      </div>

      <h1 style={{
        fontWeight:800, fontSize:36, color:T.text,
        letterSpacing:-1.2, lineHeight:1.13,
        textAlign:"center", margin:"0 0 14px",
        animation:"hmf5-rise 0.55s 0.15s ease both",
      }}>
        Du bist jetzt<br/>Teil von HUI ✦
      </h1>
      <p style={{
        fontSize:15.5, color:T.soft, lineHeight:1.7,
        textAlign:"center", margin:"0 0 40px",
        animation:"hmf5-rise 0.55s 0.22s ease both",
      }}>
        Dein kreativer Raum ist freigeschaltet.<br/>
        Teile, erschaffe und verbinde.
      </p>

      <div style={{ width:"100%", animation:"hmf5-rise 0.5s 0.30s ease both" }}>
        <CtaBtn
          label="Los geht's ✦"
          variant="teal"
          onClick={onDone}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CLOSE BUTTON
// ═══════════════════════════════════════════════════════════════
function CloseBtn({ onClose }) {
  return (
    <button className="hmf5-tap" onClick={onClose} style={{
      position:"fixed",
      top:"max(18px, env(safe-area-inset-top, 18px))",
      right:18, zIndex:9900,
      width:36, height:36, borderRadius:"50%",
      background:"rgba(0,0,0,0.40)",
      backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
      border:"1px solid rgba(255,255,255,0.12)",
      display:"flex", alignItems:"center", justifyContent:"center",
      color:T.muted, fontSize:14, cursor:"pointer",
      fontFamily:"inherit",
    }}>✕</button>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════
export default function HuiMembershipFlow({ onComplete, onClose }) {
  const { activateMembership, refreshProfile } = useAuth();

  const [card,    setCard]    = useState(0);   // 0–3 = Karten, 4 = Success
  const [dir,     setDir]     = useState(1);   // 1 = forward, -1 = back
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // Inject CSS once
  useEffect(() => { injectCSS(); }, []);

  const goNext = useCallback(() => {
    setDir(1);
    setCard(c => c + 1);
  }, []);

  const goBack = useCallback(() => {
    setDir(-1);
    setCard(c => Math.max(0, c - 1));
  }, []);

  const handleFinish = useCallback(async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const result = await activateMembership?.();
      if (result?.error) {
        setError("Speichern fehlgeschlagen. Bitte nochmal versuchen.");
        setLoading(false);
        return;
      }
      await refreshProfile?.().catch(() => {});
      setDir(1);
      setCard(4); // Success screen
    } catch (e) {
      setError("Verbindungsfehler. Bitte nochmal versuchen.");
      console.warn("[MF5] finish error:", e?.message);
    } finally {
      setLoading(false);
    }
  }, [loading, activateMembership, refreshProfile]);

  const handleClose = useCallback(() => {
    try { cleanupOrbEnvironment({ reason: "user-close" }); } catch {}
    onClose?.();
  }, [onClose]);

  const handleDone = useCallback(() => {
    try { cleanupOrbEnvironment({ reason: "membership-complete" }); } catch {}
    onComplete?.();
  }, [onComplete]);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9800,
      background:T.bg,
      fontFamily:"-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
      WebkitFontSmoothing:"antialiased",
      contain:"layout paint",
      overflow:"hidden",
    }}>
      {/* Preload images silently */}
      <div style={{ display:"none" }} aria-hidden="true">
        {Object.values(IMG).map((s,i) => <img key={i} src={s} alt="" loading="eager"/>)}
      </div>

      {/* Card Container — position:relative für absolute card children */}
      <div style={{ position:"relative", width:"100%", height:"100%" }}>
        {card === 0 && <Card1 onNext={goNext} dir={dir} />}
        {card === 1 && <Card2 onNext={goNext} onBack={goBack} dir={dir} />}
        {card === 2 && <Card3 onNext={goNext} onBack={goBack} dir={dir} />}
        {card === 3 && <Card4 onFinish={handleFinish} onBack={goBack} dir={dir} loading={loading} error={error} />}
        {card === 4 && <SuccessScreen onDone={handleDone} />}
      </div>

      {/* Close Button — only on cards 0–3, not success */}
      {card < 4 && <CloseBtn onClose={handleClose} />}

      {/* Loading overlay */}
      {loading && (
        <div style={{
          position:"fixed", inset:0, zIndex:9850,
          background:"rgba(6,10,20,0.75)",
          backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <div style={{
            width:40, height:40, borderRadius:"50%",
            border:"3px solid rgba(255,255,255,0.08)",
            borderTopColor:T.teal,
            animation:"hmf5-spin 0.7s linear infinite",
          }}/>
        </div>
      )}
    </div>
  );
}
