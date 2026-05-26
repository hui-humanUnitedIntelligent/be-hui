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
  s2b: "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/7574637e3_generated_image.png",
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
  @keyframes hmf5-dash-flow {
    from { stroke-dashoffset: 0; }
    to   { stroke-dashoffset: -28; }
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
// FINAL ATMOSPHERE POLISH — organic, warm, meditative
// ═══════════════════════════════════════════════════════════════

// ── Energy Pill — schwebt organisch, leuchtet warm ──────────────
function EnergyPill({ icon, label, style = {}, floatAnim = "hmf5-float-a", delay = 0, glowColor = "#16D7C5" }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:9,
      padding:"10px 18px 10px 13px",
      borderRadius:100,
      // Warmer glass — slight tint from glow color
      background:`linear-gradient(135deg, ${glowColor}10 0%, rgba(255,255,255,0.055) 100%)`,
      backdropFilter:"blur(22px) saturate(1.4)",
      WebkitBackdropFilter:"blur(22px) saturate(1.4)",
      border:`1px solid ${glowColor}28`,
      boxShadow:`
        0 6px 28px rgba(0,0,0,0.32),
        0 0 0 0.5px ${glowColor}18,
        inset 0 1px 0 rgba(255,255,255,0.10),
        0 0 20px ${glowColor}18
      `,
      opacity: visible ? 1 : 0,
      animation: visible
        ? `hmf5-pill-in 0.7s cubic-bezier(0.22,1,0.36,1) both, ${floatAnim} 7s ${delay * 0.0008}s ease-in-out infinite`
        : "none",
      willChange:"transform, opacity",
      position:"absolute",
      ...style,
    }}>
      <span style={{ fontSize:15, lineHeight:1, flexShrink:0 }}>{icon}</span>
      <span style={{
        fontSize:12, fontWeight:600,
        color:"rgba(255,255,255,0.88)",
        letterSpacing:"0.01em", whiteSpace:"nowrap",
      }}>{label}</span>
    </div>
  );
}

// ── Center Orb — atmet, pulsiert, strahlt aus ───────────────────
function CenterOrb2({ visible }) {
  return (
    <div style={{
      position:"absolute",
      top:"50%", left:"50%",
      transform:"translate(-50%,-50%)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:4,
    }}>
      {/* Deep atmospheric aura layers — stacked radial glows */}
      <div style={{
        position:"absolute", borderRadius:"50%",
        width:320, height:320,
        background:"radial-gradient(circle, rgba(22,215,197,0.04) 0%, transparent 70%)",
        filter:"blur(24px)",
        animation: visible ? "hmf5-orb-center-pulse 6s ease-in-out infinite" : "none",
        pointerEvents:"none",
      }}/>
      <div style={{
        position:"absolute", borderRadius:"50%",
        width:200, height:200,
        background:"radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 70%)",
        filter:"blur(18px)",
        animation: visible ? "hmf5-orb-center-pulse 8s 1.5s ease-in-out infinite" : "none",
        pointerEvents:"none",
      }}/>

      {/* Slowly expanding breathing rings — very slow */}
      {[
        { w:240, op:0.055, del:"0s"   },
        { w:185, op:0.08,  del:"1.8s" },
        { w:138, op:0.11,  del:"0.9s" },
      ].map((r,i) => (
        <div key={i} style={{
          position:"absolute",
          width:r.w, height:r.w, borderRadius:"50%",
          border:`1px solid rgba(22,215,197,${r.op})`,
          animation: visible ? `hmf5-ring 4.5s ${r.del} ease-out infinite` : "none",
        }}/>
      ))}

      {/* Static soft glow ring — always visible */}
      <div style={{
        position:"absolute",
        width:112, height:112, borderRadius:"50%",
        background:"transparent",
        border:"1px solid rgba(22,215,197,0.18)",
        boxShadow:"0 0 22px rgba(22,215,197,0.14), inset 0 0 22px rgba(22,215,197,0.06)",
        animation: visible ? "hmf5-orb-breathe 5s ease-in-out infinite" : "none",
      }}/>

      {/* Energy connection lines — SVG, animated dashes */}
      <svg style={{
        position:"absolute",
        width:340, height:340,
        top:"50%", left:"50%",
        transform:"translate(-50%,-50%)",
        overflow:"visible",
        opacity: visible ? 1 : 0,
        transition:"opacity 1.8s ease",
        pointerEvents:"none",
        zIndex:3,
      }} viewBox="0 0 340 340">
        <defs>
          <radialGradient id="lineFadeTeal" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#16D7C5" stopOpacity="0.55"/>
            <stop offset="100%" stopColor="#16D7C5" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="lineFadeCoral" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#FF8A6B" stopOpacity="0.45"/>
            <stop offset="100%" stopColor="#FF8A6B" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="lineFadeGold" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#F5A623" stopOpacity="0.40"/>
            <stop offset="100%" stopColor="#F5A623" stopOpacity="0"/>
          </radialGradient>
        </defs>
        {/* 5 spokes — center 170,170 — each to a pill anchor */}
        {[
          { x2:170, y2:18,  grad:"url(#lineFadeTeal)",  dash:"4 10" },  // top
          { x2:320, y2:88,  grad:"url(#lineFadeCoral)", dash:"3 9"  },  // top-right
          { x2:308, y2:268, grad:"url(#lineFadeGold)",  dash:"5 11" },  // bottom-right
          { x2:30,  y2:268, grad:"url(#lineFadeTeal)",  dash:"4 10" },  // bottom-left
          { x2:22,  y2:88,  grad:"url(#lineFadeCoral)", dash:"3 9"  },  // top-left
        ].map((l, i) => (
          <line key={i}
            x1="170" y1="170" x2={l.x2} y2={l.y2}
            stroke={l.grad}
            strokeWidth="0.7"
            strokeDasharray={l.dash}
            style={{
              opacity:0,
              animation:`hmf5-line-appear 0.6s ${0.6 + i * 0.14}s ease both,
                         hmf5-dash-flow 6s ${i * 1.1}s linear infinite`,
            }}
          />
        ))}
      </svg>

      {/* Orb warm glow — mix of teal + gold */}
      <div style={{
        position:"absolute", borderRadius:"50%",
        width:100, height:100,
        background:"radial-gradient(circle, rgba(22,215,197,0.35) 0%, rgba(245,166,35,0.12) 55%, transparent 75%)",
        filter:"blur(14px)",
        animation: visible ? "hmf5-orb-center-pulse 4.5s ease-in-out infinite" : "none",
        zIndex:4,
      }}/>

      {/* HUI Logo Orb — larger, more impactful */}
      <div style={{
        width:96, height:96,
        borderRadius:96 * 0.26,
        overflow:"hidden",
        position:"relative", zIndex:5,
        boxShadow:`
          0 0 0 1.5px rgba(22,215,197,0.38),
          0 0 0 4px rgba(22,215,197,0.08),
          0 0 40px rgba(22,215,197,0.55),
          0 0 80px rgba(22,215,197,0.20),
          0 0 120px rgba(245,166,35,0.10),
          0 16px 48px rgba(0,0,0,0.55)
        `,
        animation: visible ? "hmf5-orb-breathe 5s ease-in-out infinite" : "none",
        flexShrink:0,
      }}>
        <img
          src="/hui-logo-real.jpg"
          alt="HUI"
          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
          onError={e => { e.target.style.display="none"; }}
        />
        {/* Warm shimmer — teal top-left, gold bottom-right */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          background:"linear-gradient(135deg, rgba(22,215,197,0.14) 0%, rgba(245,166,35,0.08) 60%, transparent 100%)",
        }}/>
        {/* Inner light spot */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          background:"radial-gradient(circle at 35% 30%, rgba(255,255,255,0.12) 0%, transparent 50%)",
        }}/>
      </div>
    </div>
  );
}

// ── Ambient Particles — warm, organic, slow ─────────────────────
function AmbientParticles() {
  const pts = useRef(
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      x:  8  + (Math.sin(i * 137.5 * Math.PI / 180) * 0.5 + 0.5) * 84,
      y:  12 + (Math.cos(i * 137.5 * Math.PI / 180) * 0.5 + 0.5) * 76,
      size: 1.5 + (i % 4) * 0.8,
      delay: (i * 0.47) % 4.2,
      dur:   4.2 + (i % 5) * 0.9,
      // warm color palette: teal, coral, gold, white
      color: ["rgba(22,215,197,0.75)","rgba(255,138,107,0.65)","rgba(245,166,35,0.70)","rgba(255,255,255,0.55)"][i % 4],
    }))
  ).current;

  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:2 }}>
      {pts.map(p => (
        <div key={p.id} style={{
          position:"absolute",
          left:`${p.x}%`, top:`${p.y}%`,
          width:p.size, height:p.size,
          borderRadius:"50%",
          background:p.color,
          boxShadow:`0 0 ${p.size * 4}px ${p.color}`,
          opacity:0,
          animation:`hmf5-particle-drift ${p.dur}s ${p.delay}s ease-out infinite`,
        }}/>
      ))}
    </div>
  );
}

// ── Volumetric Light Blobs — background depth ───────────────────
function VolumetricLights() {
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0 }}>
      {/* Warm amber — upper right */}
      <div style={{
        position:"absolute",
        top:"-8%", right:"-12%",
        width:"55%", height:"55%", borderRadius:"50%",
        background:"radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 68%)",
        filter:"blur(40px)",
        animation:"hmf5-float-b 9s ease-in-out infinite",
      }}/>
      {/* Teal — center left */}
      <div style={{
        position:"absolute",
        top:"25%", left:"-15%",
        width:"50%", height:"40%", borderRadius:"50%",
        background:"radial-gradient(circle, rgba(22,215,197,0.10) 0%, transparent 70%)",
        filter:"blur(36px)",
        animation:"hmf5-float-d 11s ease-in-out infinite",
      }}/>
      {/* Soft violet — lower right */}
      <div style={{
        position:"absolute",
        bottom:"10%", right:"-8%",
        width:"42%", height:"38%", borderRadius:"50%",
        background:"radial-gradient(circle, rgba(192,132,252,0.09) 0%, transparent 70%)",
        filter:"blur(32px)",
        animation:"hmf5-float-a 13s ease-in-out infinite",
      }}/>
      {/* Coral warmth — lower left */}
      <div style={{
        position:"absolute",
        bottom:"18%", left:"-10%",
        width:"38%", height:"32%", borderRadius:"50%",
        background:"radial-gradient(circle, rgba(255,138,107,0.09) 0%, transparent 70%)",
        filter:"blur(30px)",
        animation:"hmf5-float-e 10s 2s ease-in-out infinite",
      }}/>
    </div>
  );
}

function Card2({ onNext, onBack, dir }) {
  const [ready, setReady] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 150);
    return () => clearTimeout(t);
  }, []);

  // 5 pills — organisch verteilt, nicht symmetrisch
  const pills = [
    {
      icon:"✍️", label:"Momente teilen",
      floatAnim:"hmf5-float-a", delay:360, glowColor:"#16D7C5",
      style:{ top:"8%", left:"50%", transform:"translateX(-50%)" },
    },
    {
      icon:"🎨", label:"Werke zeigen",
      floatAnim:"hmf5-float-b", delay:520, glowColor:"#FF8A6B",
      style:{ top:"31%", right:"3%" },
    },
    {
      icon:"🌱", label:"Wirkung entfalten",
      floatAnim:"hmf5-float-c", delay:680, glowColor:"#6BCB77",
      style:{ bottom:"29%", right:"5%" },
    },
    {
      icon:"🤝", label:"Menschen verbinden",
      floatAnim:"hmf5-float-d", delay:840, glowColor:"#F5A623",
      style:{ bottom:"29%", left:"3%" },
    },
    {
      icon:"✨", label:"Räume öffnen",
      floatAnim:"hmf5-float-e", delay:1000, glowColor:"#C084FC",
      style:{ top:"31%", left:"3%" },
    },
  ];

  return (
    <div className={dir === 1 ? "hmf5-slide-r" : "hmf5-slide-l"} style={{
      position:"absolute", inset:0,
      display:"flex", flexDirection:"column",
      overflow:"hidden",
    }}>

      {/* ── Layer 0: Base deep color ── */}
      <div style={{
        position:"absolute", inset:0, zIndex:0,
        background:"linear-gradient(170deg, #05091A 0%, #060D1E 40%, #040810 100%)",
      }}/>

      {/* ── Layer 1: Volumetric light blobs ── */}
      <div style={{ position:"absolute", inset:0, zIndex:1 }}>
        <VolumetricLights />
      </div>

      {/* ── Layer 2: Background photo — very blurred, dreamlike ── */}
      <div style={{
        position:"absolute", inset:0, zIndex:2,
        backgroundImage:`url(${IMG.s2b})`,
        backgroundSize:"cover", backgroundPosition:"center 35%",
        opacity:0.22,
        filter:"blur(6px) saturate(0.7)",
        transform:"scale(1.08)",
        mixBlendMode:"luminosity",
        animation:"hmf5-ken 35s ease-in-out both",
      }}/>

      {/* ── Layer 3: Depth gradient veil ── */}
      <div style={{
        position:"absolute", inset:0, zIndex:3,
        background:`
          radial-gradient(ellipse 80% 60% at 50% 44%,
            rgba(22,215,197,0.065) 0%, transparent 62%),
          radial-gradient(ellipse 60% 40% at 72% 25%,
            rgba(245,166,35,0.055) 0%, transparent 58%),
          linear-gradient(180deg,
            rgba(5,9,26,0.55) 0%,
            rgba(5,9,26,0.18) 20%,
            rgba(5,9,26,0.10) 48%,
            rgba(5,9,26,0.70) 72%,
            rgba(5,9,26,0.97) 88%,
            rgba(5,9,26,1.00) 100%
          )
        `,
      }}/>

      {/* ── Layer 4: Floating particles ── */}
      <div style={{ position:"absolute", inset:0, zIndex:4 }}>
        <AmbientParticles />
      </div>

      {/* ── Layer 5: Content ── */}

      {/* Progress */}
      <div style={{
        position:"relative", zIndex:5,
        padding:`max(52px, env(safe-area-inset-top, 52px)) 24px 0`,
        opacity: ready ? 1 : 0, transition:"opacity 0.5s ease",
      }}>
        <ProgressDots total={4} current={1} />
      </div>

      {/* Orb + Pills zone */}
      <div style={{
        position:"relative", zIndex:5,
        flex:1, minHeight:0,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <div style={{ position:"relative", width:"100%", height:"100%" }}>
          <CenterOrb2 visible={ready} />
          {pills.map((p, i) => (
            <EnergyPill key={i} {...p} />
          ))}
        </div>
      </div>

      {/* Text + CTA */}
      <div style={{
        position:"relative", zIndex:5,
        padding:`0 26px calc(env(safe-area-inset-bottom, 0px) + 32px)`,
        opacity: ready ? 1 : 0,
        transform: ready ? "translateY(0)" : "translateY(16px)",
        transition:"opacity 0.7s 0.25s ease, transform 0.7s 0.25s cubic-bezier(0.22,1,0.36,1)",
      }}>

        {/* Headline — larger, more space */}
        <h1 style={{
          fontWeight:800,
          fontSize:"clamp(27px,7.5vw,38px)",
          color:"rgba(255,255,255,0.97)",
          margin:"0 0 12px",
          letterSpacing:-1.2, lineHeight:1.14,
        }}>Dein kreativer Raum<br/>öffnet sich</h1>

        {/* Subline */}
        <p style={{
          fontSize:15.5, color:"rgba(255,255,255,0.60)",
          lineHeight:1.72, margin:"0 0 28px",
          maxWidth:340, fontWeight:400,
        }}>
          Als Talent kannst du Menschen inspirieren,
          Werke teilen und besondere Räume erschaffen.
        </p>

        {/* CTA — Premium Glassmorphism */}
        <button
          className="hmf5-tap"
          onClick={onNext}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
          style={{
            width:"100%",
            padding:"17px 24px",
            borderRadius:18,
            border:"none",
            outline:"none",
            fontFamily:"inherit",
            fontSize:16, fontWeight:700,
            letterSpacing:-0.2,
            cursor:"pointer",
            position:"relative",
            overflow:"hidden",
            // Layered glass: teal-tinted dark, not flat green
            background: btnHover
              ? "linear-gradient(135deg, rgba(22,215,197,0.22) 0%, rgba(22,215,197,0.10) 100%)"
              : "linear-gradient(135deg, rgba(22,215,197,0.16) 0%, rgba(22,215,197,0.07) 100%)",
            backdropFilter:"blur(28px) saturate(1.6)",
            WebkitBackdropFilter:"blur(28px) saturate(1.6)",
            // Refined border — inner light on top, teal glow on bottom
            boxShadow: btnHover
              ? `
                  inset 0 1px 0 rgba(255,255,255,0.18),
                  inset 0 -1px 0 rgba(22,215,197,0.28),
                  0 0 0 1px rgba(22,215,197,0.30),
                  0 0 48px rgba(22,215,197,0.28),
                  0 0 80px rgba(22,215,197,0.12),
                  0 12px 32px rgba(0,0,0,0.35)
                `
              : `
                  inset 0 1px 0 rgba(255,255,255,0.12),
                  inset 0 -1px 0 rgba(22,215,197,0.18),
                  0 0 0 1px rgba(22,215,197,0.20),
                  0 0 28px rgba(22,215,197,0.16),
                  0 8px 24px rgba(0,0,0,0.30)
                `,
            color:"#16D7C5",
            transition:"all 0.25s ease",
            marginBottom:14,
          }}
        >
          {/* Inner glow shimmer */}
          <div style={{
            position:"absolute", inset:0, borderRadius:18,
            background:"radial-gradient(ellipse 60% 55% at 50% 0%, rgba(22,215,197,0.15) 0%, transparent 70%)",
            pointerEvents:"none",
          }}/>
          <span style={{ position:"relative", zIndex:1 }}>Das klingt nach mir →</span>
        </button>

        <button className="hmf5-tap" onClick={onBack} style={{
          display:"block", width:"100%",
          background:"none", border:"none", fontFamily:"inherit",
          fontSize:14, color:"rgba(255,255,255,0.32)", padding:"10px",
          letterSpacing:-0.1, cursor:"pointer", textAlign:"center",
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
