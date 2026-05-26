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
// HARD RESET — emotional atmosphere, no diagrams, no SVG geometry
// Konzept: großer pulsierender Orb-Glow + schwebende Wörter + zentrierter Text
// ═══════════════════════════════════════════════════════════════

// ── Emotional floating word — eher Gedanke als Label ─────────────
function FloatingWord({ text, delay, style = {} }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div style={{
      position:"absolute",
      fontWeight:500,
      fontSize:13,
      letterSpacing:"0.02em",
      color: vis ? "rgba(255,255,255,0.48)" : "rgba(255,255,255,0)",
      textShadow:"0 0 18px rgba(22,215,197,0.35)",
      whiteSpace:"nowrap",
      userSelect:"none",
      pointerEvents:"none",
      transition:`opacity 1.4s ${delay * 0.001}s ease`,
      opacity: vis ? 1 : 0,
      ...style,
    }}>{text}</div>
  );
}

// ── The Orb — dominantes emotionales Herzstück ───────────────────
// Kein Logo. Kein HUI-Text. Kein Icon.
// Nur Licht, Tiefe, Atem.
function EmotionalOrb({ visible }) {
  return (
    <div style={{
      position:"relative",
      width:220, height:220,
      display:"flex", alignItems:"center", justifyContent:"center",
      flexShrink:0,
    }}>

      {/* Far atmospheric haze — very large, very soft */}
      <div style={{
        position:"absolute",
        width:420, height:420, borderRadius:"50%",
        background:"radial-gradient(circle, rgba(22,215,197,0.06) 0%, rgba(245,140,40,0.04) 35%, transparent 68%)",
        filter:"blur(40px)",
        animation: visible ? "hmf5-orb-center-pulse 7s ease-in-out infinite" : "none",
        pointerEvents:"none",
      }}/>

      {/* Mid warm glow — teal+amber */}
      <div style={{
        position:"absolute",
        width:300, height:300, borderRadius:"50%",
        background:"radial-gradient(circle, rgba(22,215,197,0.10) 0%, rgba(245,140,40,0.06) 42%, transparent 70%)",
        filter:"blur(28px)",
        animation: visible ? "hmf5-orb-center-pulse 5s 1.2s ease-in-out infinite" : "none",
        pointerEvents:"none",
      }}/>

      {/* Near glow ring — breathes */}
      <div style={{
        position:"absolute",
        width:186, height:186, borderRadius:"50%",
        background:"radial-gradient(circle, rgba(22,215,197,0.16) 0%, rgba(22,215,197,0.04) 55%, transparent 72%)",
        filter:"blur(14px)",
        animation: visible ? "hmf5-orb-breathe 4.5s ease-in-out infinite" : "none",
        pointerEvents:"none",
      }}/>

      {/* Single soft ring — barely visible */}
      <div style={{
        position:"absolute",
        width:160, height:160, borderRadius:"50%",
        border:"1px solid rgba(22,215,197,0.14)",
        boxShadow:"0 0 24px rgba(22,215,197,0.08), inset 0 0 24px rgba(22,215,197,0.04)",
        animation: visible ? "hmf5-orb-breathe 4.5s 0.8s ease-in-out infinite" : "none",
      }}/>

      {/* The orb core — pure light, no image, no text */}
      <div style={{
        width:130, height:130,
        borderRadius:"50%",
        position:"relative", zIndex:2,
        // Layered sphere: white core, teal body, warm amber edges, deep dark rim
        background:`radial-gradient(circle at 40% 34%,
          rgba(255,255,255,0.92) 0%,
          rgba(180,240,235,0.82) 8%,
          rgba(22,215,197,0.90) 22%,
          rgba(16,160,175,0.88) 42%,
          rgba(8,80,120,0.90) 62%,
          rgba(245,140,40,0.45) 80%,
          rgba(40,10,5,0.70) 100%
        )`,
        boxShadow:`
          0 0 0 1px rgba(22,215,197,0.28),
          0 0 0 4px rgba(22,215,197,0.08),
          0 0 40px rgba(22,215,197,0.60),
          0 0 80px rgba(22,215,197,0.28),
          0 0 130px rgba(22,215,197,0.12),
          0 0 180px rgba(245,140,40,0.10),
          0 20px 60px rgba(0,0,0,0.50)
        `,
        animation: visible ? "hmf5-orb-breathe 4.5s ease-in-out infinite" : "none",
        overflow:"hidden",
      }}>
        {/* Internal light shimmer */}
        <div style={{
          position:"absolute", inset:0, borderRadius:"50%",
          background:`
            radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55) 0%, transparent 30%),
            radial-gradient(circle at 70% 72%, rgba(245,140,40,0.35) 0%, transparent 35%)
          `,
          pointerEvents:"none",
        }}/>
      </div>

      {/* Logo als sehr subtile screen-Ebene über dem Orb */}
      <div style={{
        position:"absolute",
        width:130, height:130, borderRadius:"50%",
        overflow:"hidden", zIndex:3,
        opacity:0.18, mixBlendMode:"screen",
        pointerEvents:"none",
      }}>
        <img
          src="/hui-logo-real.jpg"
          style={{ width:"100%", height:"100%", objectFit:"cover" }}
          onError={e => { e.target.style.display="none"; }}
          alt=""
        />
      </div>
    </div>
  );
}

// ── Ambient particles — very soft, warm ──────────────────────────
function SoftParticles() {
  const pts = React.useRef(
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: 3 + ((Math.sin(i * 113.5 * Math.PI/180) * 0.5 + 0.5) * 94),
      y: 5 + ((Math.cos(i * 83.7  * Math.PI/180) * 0.5 + 0.5) * 90),
      size: 1.0 + (i % 4) * 0.55,
      delay: (i * 0.38) % 5.2,
      dur:   4.5 + (i % 7) * 0.8,
      color: [
        "rgba(22,215,197,0.85)",
        "rgba(245,166,35,0.80)",
        "rgba(255,138,107,0.70)",
        "rgba(255,255,255,0.60)",
        "rgba(180,220,255,0.55)",
      ][i % 5],
    }))
  ).current;
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
      {pts.map(p => (
        <div key={p.id} style={{
          position:"absolute",
          left:`${p.x}%`, top:`${p.y}%`,
          width:p.size, height:p.size, borderRadius:"50%",
          background:p.color,
          boxShadow:`0 0 ${p.size * 5}px ${p.color}`,
          opacity:0,
          animation:`hmf5-particle-drift ${p.dur}s ${p.delay}s ease-out infinite`,
        }}/>
      ))}
    </div>
  );
}

// ── Warm light blobs — depth & atmosphere ────────────────────────
function AtmosphereLights() {
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
      {/* Warm amber — right, like campfire glow */}
      <div style={{
        position:"absolute", top:"5%", right:"-15%",
        width:"55%", height:"55%", borderRadius:"50%",
        background:"radial-gradient(circle, rgba(220,120,40,0.16) 0%, transparent 65%)",
        filter:"blur(48px)",
        animation:"hmf5-float-b 10s ease-in-out infinite",
      }}/>
      {/* Teal — upper left */}
      <div style={{
        position:"absolute", top:"-10%", left:"-10%",
        width:"50%", height:"50%", borderRadius:"50%",
        background:"radial-gradient(circle, rgba(22,200,197,0.13) 0%, transparent 65%)",
        filter:"blur(44px)",
        animation:"hmf5-float-d 12s ease-in-out infinite",
      }}/>
      {/* Soft coral — lower right */}
      <div style={{
        position:"absolute", bottom:"8%", right:"-8%",
        width:"44%", height:"40%", borderRadius:"50%",
        background:"radial-gradient(circle, rgba(240,100,80,0.10) 0%, transparent 65%)",
        filter:"blur(36px)",
        animation:"hmf5-float-a 14s 2s ease-in-out infinite",
      }}/>
      {/* Deep teal — lower left */}
      <div style={{
        position:"absolute", bottom:"5%", left:"-12%",
        width:"46%", height:"38%", borderRadius:"50%",
        background:"radial-gradient(circle, rgba(22,180,197,0.11) 0%, transparent 68%)",
        filter:"blur(38px)",
        animation:"hmf5-float-e 11s 1s ease-in-out infinite",
      }}/>
      {/* Gold center warmth — directly behind orb */}
      <div style={{
        position:"absolute", top:"22%", left:"15%",
        width:"70%", height:"45%", borderRadius:"50%",
        background:"radial-gradient(circle, rgba(22,215,197,0.07) 0%, rgba(200,130,40,0.05) 50%, transparent 72%)",
        filter:"blur(32px)",
        animation:"hmf5-float-c 9s ease-in-out infinite",
      }}/>
    </div>
  );
}

function Card2({ onNext, onBack, dir }) {
  const [ready, setReady] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 120);
    return () => clearTimeout(t);
  }, []);

  // Floating words — organic, not symmetric, some slightly offset
  // These are "thoughts in the air", not feature labels
  const words = [
    { text:"Momente teilen",     delay:500,  style:{ top:"8%",   left:"50%", transform:"translateX(-50%)" } },
    { text:"Werke zeigen",       delay:680,  style:{ top:"25%",  right:"5%"  } },
    { text:"Wirkung entfalten",  delay:860,  style:{ bottom:"33%", right:"4%" } },
    { text:"Menschen verbinden", delay:1040, style:{ bottom:"33%", left:"3%"  } },
    { text:"Räume öffnen",       delay:1220, style:{ top:"25%",  left:"4%"   } },
  ];

  return (
    <div className={dir === 1 ? "hmf5-slide-r" : "hmf5-slide-l"} style={{
      position:"absolute", inset:0,
      display:"flex", flexDirection:"column",
      alignItems:"center",
      overflow:"hidden",
      background:"#04070F",
    }}>

      {/* ── BG Layer 1: cinematic photo — almost transparent ── */}
      <div style={{
        position:"absolute", inset:0, zIndex:0,
        backgroundImage:`url(${IMG.s2b})`,
        backgroundSize:"cover", backgroundPosition:"center 25%",
        opacity:0.15,
        filter:"blur(12px) saturate(0.40)",
        transform:"scale(1.12)",
        mixBlendMode:"luminosity",
        animation:"hmf5-ken 45s ease-in-out both",
      }}/>

      {/* ── BG Layer 2: warm atmosphere lights ── */}
      <div style={{ position:"absolute", inset:0, zIndex:1 }}>
        <AtmosphereLights />
      </div>

      {/* ── BG Layer 3: depth vignette ── */}
      <div style={{
        position:"absolute", inset:0, zIndex:2,
        background:`linear-gradient(180deg,
          rgba(4,7,15,0.70) 0%,
          rgba(4,7,15,0.10) 18%,
          rgba(4,7,15,0.05) 42%,
          rgba(4,7,15,0.55) 68%,
          rgba(4,7,15,0.96) 84%,
          rgba(4,7,15,1.00) 100%
        )`,
      }}/>

      {/* ── BG Layer 4: particles ── */}
      <div style={{ position:"absolute", inset:0, zIndex:3, pointerEvents:"none" }}>
        <SoftParticles />
      </div>

      {/* ── CONTENT ── */}

      {/* Progress dots — top left */}
      <div style={{
        position:"relative", zIndex:10, width:"100%",
        padding:`max(50px, env(safe-area-inset-top, 50px)) 22px 0`,
        flexShrink:0,
        opacity: ready ? 1 : 0, transition:"opacity 0.6s ease",
      }}>
        <ProgressDots total={4} current={1} />
        <div style={{
          marginTop:5, fontSize:11, fontWeight:700,
          color:"rgba(22,215,197,0.50)",
          letterSpacing:"0.10em",
        }}>2 / 4</div>
      </div>

      {/* Floating words zone — fills the space around the orb */}
      <div style={{
        position:"absolute", inset:0, zIndex:8, pointerEvents:"none",
      }}>
        {words.map((w, i) => (
          <FloatingWord key={i} {...w} />
        ))}
      </div>

      {/* ── CENTER STAGE: Orb + Text + CTA as one emotional unit ── */}
      <div style={{
        position:"relative", zIndex:10,
        flex:1, width:"100%", minHeight:0,
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        gap:0, paddingBottom:16,
      }}>

        {/* The Orb */}
        <div style={{
          opacity: ready ? 1 : 0,
          transform: ready ? "scale(1) translateY(0)" : "scale(0.88) translateY(20px)",
          transition:"opacity 0.9s 0.1s ease, transform 0.9s 0.1s cubic-bezier(0.22,1,0.36,1)",
        }}>
          <EmotionalOrb visible={ready} />
        </div>

        {/* Text block — immediately under orb, NO gap */}
        <div style={{
          textAlign:"center",
          padding:"0 28px",
          opacity: ready ? 1 : 0,
          transform: ready ? "translateY(0)" : "translateY(16px)",
          transition:"opacity 0.8s 0.4s ease, transform 0.8s 0.4s cubic-bezier(0.22,1,0.36,1)",
          marginTop: -4,
        }}>
          <h1 style={{
            fontWeight:800,
            fontSize:"clamp(24px,6.2vw,36px)",
            color:"rgba(255,255,255,0.96)",
            margin:"0 0 10px",
            letterSpacing:-1.1, lineHeight:1.16,
            textShadow:"0 2px 24px rgba(0,0,0,0.55)",
          }}>
            Dein{" "}
            <span style={{
              color:"#16D7C5",
              textShadow:"0 0 28px rgba(22,215,197,0.55), 0 2px 8px rgba(0,0,0,0.3)",
            }}>kreativer</span>
            {" "}Raum<br/>öffnet sich
          </h1>

          <p style={{
            fontSize:15, color:"rgba(255,255,255,0.52)",
            lineHeight:1.72, margin:"0 0 28px",
            maxWidth:300, marginLeft:"auto", marginRight:"auto",
            fontWeight:400,
            textShadow:"0 1px 8px rgba(0,0,0,0.4)",
          }}>
            Als Talent kannst du Menschen inspirieren,
            Werke teilen und besondere Räume erschaffen.
          </p>

          {/* CTA — pill, centered, max 340px, warm glass */}
          <button
            className="hmf5-tap"
            onClick={onNext}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{
              display:"inline-flex",
              alignItems:"center", justifyContent:"center", gap:10,
              padding:"14px 36px",
              borderRadius:100,
              border:`1px solid rgba(22,215,197,${btnHover ? "0.40" : "0.22"})`,
              background: btnHover
                ? "linear-gradient(135deg, rgba(22,215,197,0.18) 0%, rgba(8,55,80,0.50) 100%)"
                : "linear-gradient(135deg, rgba(22,215,197,0.10) 0%, rgba(6,40,60,0.40) 100%)",
              backdropFilter:"blur(28px) saturate(1.4)",
              WebkitBackdropFilter:"blur(28px) saturate(1.4)",
              fontFamily:"inherit",
              fontSize:15.5, fontWeight:700,
              color:"rgba(255,255,255,0.94)",
              letterSpacing:-0.2, cursor:"pointer",
              maxWidth:340, width:"100%",
              boxShadow: btnHover
                ? `inset 0 1px 0 rgba(255,255,255,0.18),
                   0 0 0 1px rgba(22,215,197,0.24),
                   0 0 40px rgba(22,215,197,0.25),
                   0 0 80px rgba(22,215,197,0.10),
                   0 10px 30px rgba(0,0,0,0.42)`
                : `inset 0 1px 0 rgba(255,255,255,0.10),
                   0 0 0 1px rgba(22,215,197,0.14),
                   0 0 20px rgba(22,215,197,0.14),
                   0 8px 24px rgba(0,0,0,0.38)`,
              transition:"all 0.22s ease",
              position:"relative", overflow:"hidden",
            }}
          >
            <div style={{
              position:"absolute", inset:0, borderRadius:100,
              background:"radial-gradient(ellipse 60% 45% at 50% 0%, rgba(22,215,197,0.12) 0%, transparent 70%)",
              pointerEvents:"none",
            }}/>
            <span style={{ position:"relative", zIndex:1 }}>Das klingt nach mir</span>
            <span style={{ position:"relative", zIndex:1, fontSize:14, opacity:0.8 }}>→</span>
          </button>

          <div style={{ marginTop:14 }}>
            <button className="hmf5-tap" onClick={onBack} style={{
              background:"none", border:"none", fontFamily:"inherit",
              fontSize:13, color:"rgba(255,255,255,0.24)",
              padding:"8px 16px", cursor:"pointer",
              letterSpacing:-0.1,
            }}>← Zurück</button>
          </div>
        </div>
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
