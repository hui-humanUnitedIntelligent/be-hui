/**
 * HuiMembershipFlow v4 — Fullscreen Cinematic Journey
 *
 * PARADIGMA-WECHSEL:
 * NICHT: Bild oben 55% + Content darunter (= leere Fläche)
 * SONDERN: Bild FULLSCREEN + Content schwebt IM BILD über Gradient
 *
 * Jeder Screen = eine immersive Szene.
 * Kein toter Raum. Keine leeren Flächen.
 * Alles kompositorisch ausbalanciert.
 *
 * Logo: /hui-logo-real.jpg — das echte Brand-Asset 1:1
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import GuidanceFooter from "./guidance/GuidanceFooter.jsx";
import { useGuidance } from "./guidance/GuidanceContext.jsx";
import { cleanupOrbEnvironment } from "../lib/cleanup/cleanupOrbEnvironment.js";
import { useAuth } from "../lib/AuthContext";

// ─── Images ───────────────────────────────────────────────────────────────────
const IMG = {
  s1: "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/4404032bd_generated_image.png",
  s2: "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/1b0ea94b6_generated_image.png",
  s3: "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/6ba64a1aa_generated_image.png",
  s4: "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/ca9ae11f0_generated_image.png",
  s5: "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/dab418e97_generated_image.png",
  s6: "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/bd1420a31_generated_image.png",
  s7: "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/c5d8bdc7f_generated_image.png",
  s8: "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/9e84eca6c_generated_image.png",
};

// ─── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
  @keyframes hmf4-ken {
    from { transform: scale(1.00) translateY(0px); }
    to   { transform: scale(1.07) translateY(-6px); }
  }
  @keyframes hmf4-float {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-9px); }
  }
  @keyframes hmf4-breathe {
    0%,100% { opacity:0.55; transform:scale(1);    }
    50%     { opacity:0.90; transform:scale(1.07); }
  }
  @keyframes hmf4-spin-cw  { from{transform:rotate(0deg)}   to{transform:rotate(360deg)}  }
  @keyframes hmf4-spin-ccw { from{transform:rotate(0deg)}   to{transform:rotate(-360deg)} }
  @keyframes hmf4-shimmer  { 0%{background-position:-300% 0} 100%{background-position:300% 0} }
  @keyframes hmf4-fade-in  { from{opacity:0} to{opacity:1} }
  @keyframes hmf4-rise     { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes hmf4-pop      { from{opacity:0;transform:scale(0.80)} to{opacity:1;transform:scale(1)} }
  @keyframes hmf4-dot      { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:1;transform:scale(1.5)} }
  @keyframes hmf4-pg-fill  { from{transform:scaleX(0)} to{transform:scaleX(1)} }

  .hmf4-screen { animation: hmf4-fade-in 0.45s cubic-bezier(0.22,1,0.36,1) both; }

  .hmf4-tap {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .hmf4-tap:active { opacity: 0.82; transform: scale(0.975); }

  .hmf4-btn:active { transform: scale(0.965) !important; }
`;

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  teal:    "#16D7C5",
  coral:   "#FF8A6B",
  gold:    "#F5A623",
  white:   "#FFFFFF",
  text:    "rgba(255,255,255,0.95)",
  soft:    "rgba(255,255,255,0.75)",
  muted:   "rgba(255,255,255,0.48)",
  dim:     "rgba(255,255,255,0.22)",
  bg:      "#060A14",
};

// ─── HUI Logo — Das echte Asset. 1:1. Keine Interpretation. ─────────────────
function HuiLogo({ size = 56, glow = false, float = false }) {
  const shadowGlow = glow
    ? `0 0 ${size * 0.65}px rgba(22,215,197,0.55),
       0 0 ${size * 1.3}px rgba(22,215,197,0.22),
       0 0 ${size * 2.2}px rgba(255,138,107,0.14),
       0 ${size * 0.06}px ${size * 0.22}px rgba(0,0,0,0.5)`
    : `0 ${size * 0.04}px ${size * 0.18}px rgba(0,0,0,0.5)`;

  return (
    <div style={{
      width: size, height: size,
      borderRadius: size * 0.235,
      overflow: "hidden",
      flexShrink: 0,
      boxShadow: shadowGlow,
      animation: float ? "hmf4-float 5s ease-in-out infinite" : "none",
    }}>
      <img
        src="/hui-logo-real.jpg"
        alt="HUI"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        onError={e => { e.target.src = "/hui-logo.jpg"; }}
      />
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step, total }) {
  return (
    <div style={{ display:"flex", gap:4, width:"100%", padding:"0 2px" }}>
      {Array.from({ length: total }).map((_, i) => {
        const filled    = i < step;
        const isCurrent = i === step - 1;
        return (
          <div key={i} style={{
            flex:1, height:2, borderRadius:99,
            background: filled
              ? `linear-gradient(90deg, ${T.teal}CC 0%, ${T.teal}88 100%)`
              : "rgba(255,255,255,0.09)",
            boxShadow: (filled && isCurrent) ? `0 0 5px rgba(22,215,197,0.30)` : "none",
            transition: "background 0.65s cubic-bezier(0.22,1,0.36,1), box-shadow 0.65s ease",
          }} />
        );
      })}
    </div>
  );
}

// ─── Step Header (floating über dem Bild) ─────────────────────────────────────
function StepHeader({ step, total, label, accent = T.teal }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, marginBottom: 10,
    }}>
      {/* Dot + Label */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "rgba(0,0,0,0.28)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: 999,
        padding: "5px 12px 5px 8px",
        border: `1px solid ${accent}30`,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: accent,
          boxShadow: `0 0 7px ${accent}`,
        }} />
        <span style={{
          fontSize: 10.5, fontWeight: 700, color: accent,
          letterSpacing: "0.08em", textTransform: "uppercase",
        }}>{label}</span>
      </div>
      <span style={{ marginLeft: "auto", fontSize: 11, color: T.muted, fontWeight: 500 }}>
        {step}/{total}
      </span>
    </div>
  );
}

// ─── Fullscreen Scene (neues Layout-Paradigma) ─────────────────────────────────
// Bild ist 100% Fullscreen.
// Gradient dimmt von unten: Bild bleibt oben sichtbar, Content unten.
// Kein toter Raum. Alles ist Komposition.
function Scene({ src, children, gradientStart = "65%", bottomColor = T.bg }) {
  return (
    <div className="hmf4-screen" style={{
      position: "absolute", inset: 0, overflow: "hidden",
    }}>
      {/* EBENE 1: Fullscreen Atmosphäre */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${src})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        animation: "hmf4-ken 22s ease-in-out both",
      }} />

      {/* EBENE 2: Cinematischer Gradient — von unten verdunkeln */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(
          180deg,
          rgba(6,10,20,0.08)  0%,
          rgba(6,10,20,0.15) 25%,
          rgba(6,10,20,0.45) ${gradientStart},
          rgba(6,10,20,0.93) 80%,
          rgba(6,10,20,1.00) 88%
        )`,
      }} />

      {/* Vignette Seiten */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, transparent 55%, rgba(6,10,20,0.45) 100%)",
        pointerEvents: "none",
      }} />

      {/* EBENE 3: Content — scrollbar, sitzt über dem Bild */}
      <div style={{
        position: "absolute", inset: 0,
        overflowY: "auto", overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        display: "flex", flexDirection: "column",
      }}>
        {children}
      </div>
    </div>
  );
}

// Für Screens ohne Bild (Values, Safety) — dark atmospheric scene
function DarkScene({ children, bgSrc, opacity = 0.38 }) {
  return (
    <div className="hmf4-screen" style={{
      position: "absolute", inset: 0, overflow: "hidden",
      background: T.bg,
    }}>
      {bgSrc && (
        <>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${bgSrc})`,
            backgroundSize: "cover", backgroundPosition: "center",
            opacity, animation: "hmf4-ken 28s ease-in-out both",
          }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, rgba(6,10,20,0.60) 0%, rgba(6,10,20,0.82) 50%, rgba(6,10,20,0.98) 100%)",
          }} />
        </>
      )}
      <div style={{
        position: "absolute", inset: 0,
        overflowY: "auto", overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── Primary Button ───────────────────────────────────────────────────────────
function Btn({ onClick, disabled, children, variant = "teal" }) {
  const cfg = {
    teal: {
      bg: "linear-gradient(145deg, rgba(22,215,197,0.95) 0%, rgba(10,185,174,0.98) 100%)",
      shadow: "0 10px 32px rgba(22,215,197,0.30), 0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.22)",
      color: "#041210",
    },
    coral: {
      bg: "linear-gradient(145deg, rgba(255,138,107,0.95) 0%, rgba(245,95,65,0.98) 100%)",
      shadow: "0 10px 32px rgba(255,138,107,0.30), 0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.20)",
      color: "#170806",
    },
    ghost: {
      bg: "rgba(255,255,255,0.08)",
      shadow: "0 2px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.10)",
      color: T.soft,
    },
  }[variant];

  // Phase 15: teal variant uses GuidanceFooter CTA style; keep ghost/coral in Btn
  // For teal, callers should prefer <GuidanceFooter cta=... /> where possible
  return (
    <button
      className="hmf4-tap hmf4-btn"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        height: variant === "teal" ? 58 : "auto",
        padding: variant === "teal" ? "0 28px" : "16px 28px",
        borderRadius: 18, border: "none",
        fontFamily: "inherit",
        fontSize: variant === "teal" ? 17 : 16,
        fontWeight: 700,
        letterSpacing: variant === "teal" ? "-0.02em" : "-0.02em",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
        background: disabled ? "rgba(255,255,255,0.07)" : cfg.bg,
        color: disabled ? T.muted : cfg.color,
        opacity: disabled ? 0.42 : 1,
        filter: disabled ? "saturate(0.7)" : "none",
        boxShadow: disabled ? "none" : cfg.shadow,
        transition: "transform 0.42s cubic-bezier(0.22,1,0.36,1), box-shadow 0.42s cubic-bezier(0.22,1,0.36,1), opacity 0.42s cubic-bezier(0.22,1,0.36,1)",
        isolation: "isolate",
        contain: "layout paint",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}>
      {children}
    </button>
  );
}

// ─── Select Card ──────────────────────────────────────────────────────────────
function SelectCard({ icon, title, subtitle, selected, onClick }) {
  return (
    <button
      className="hmf4-tap"
      onClick={onClick}
      style={{
        width: "100%", padding: "15px 17px",
        borderRadius: 18, border: "none",
        background: selected
          ? "rgba(22,215,197,0.12)"
          : "rgba(255,255,255,0.055)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        outline: selected
          ? "1.5px solid rgba(22,215,197,0.38)"
          : "1px solid rgba(255,255,255,0.085)",
        cursor: "pointer", textAlign: "left",
        display: "flex", alignItems: "center", gap: 14,
        fontFamily: "inherit",
        boxShadow: selected
          ? "0 0 0 1px rgba(22,215,197,0.15), 0 8px 28px rgba(22,215,197,0.14), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "0 1px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
        transition: "all 0.22s ease",
      }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14, flexShrink: 0,
        background: selected ? "rgba(22,215,197,0.18)" : "rgba(255,255,255,0.07)",
        border: selected ? "1px solid rgba(22,215,197,0.28)" : "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 21, transition: "all 0.22s ease",
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontWeight: 650, fontSize: 14.5, color: selected ? T.text : T.soft,
          letterSpacing: -0.25, marginBottom: 3, lineHeight: 1.3,
        }}>{title}</div>
        <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.4 }}>{subtitle}</div>
      </div>
      <div style={{
        width: 21, height: 21, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${selected ? T.teal : "rgba(255,255,255,0.18)"}`,
        background: selected ? T.teal : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: selected ? `0 0 12px rgba(22,215,197,0.5)` : "none",
        transition: "all 0.22s cubic-bezier(0.34,1.4,0.64,1)",
      }}>
        {selected && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="#041210" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </button>
  );
}

// ─── Animated Value Row ───────────────────────────────────────────────────────
function ValueRow({ icon, title, body, delay = 0 }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 14,
      opacity: v ? 1 : 0,
      transform: v ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 0.55s ease, transform 0.55s ease",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 13, flexShrink: 0,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
      }}>{icon}</div>
      <div style={{ paddingTop: 2 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: T.text, letterSpacing: -0.25, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 13.5, color: T.soft, lineHeight: 1.55 }}>{body}</div>
      </div>
    </div>
  );
}

// ─── Safety Row ───────────────────────────────────────────────────────────────
function SafetyRow({ icon, text, delay = 0 }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 14,
      padding: "15px 18px", borderRadius: 16,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
      opacity: v ? 1 : 0,
      transform: v ? "translateX(0)" : "translateX(-16px)",
      transition: "opacity 0.55s ease, transform 0.55s ease",
    }}>
      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <span style={{ fontSize: 14, color: T.soft, lineHeight: 1.6 }}>{text}</span>
    </div>
  );
}

// ─── Legal Row ────────────────────────────────────────────────────────────────
function LegalRow({ label }) {
  const [p, setP] = useState(false);
  return (
    <div className="hmf4-tap"
      onPointerDown={() => setP(true)}
      onPointerUp={() => setP(false)}
      onPointerLeave={() => setP(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "15px 18px", borderRadius: 14, cursor: "pointer",
        background: p ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        transition: "background 0.14s ease",
      }}>
      <span style={{ fontSize: 14.5, color: T.soft, fontWeight: 500 }}>{label}</span>
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M4.5 2.5L8.5 6.5L4.5 10.5" stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

// ─── Inline Feature ───────────────────────────────────────────────────────────
function Feature({ icon, text, accent = "rgba(22,215,197,", delay = 0 }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 13,
      opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(14px)",
      transition: "opacity 0.5s ease, transform 0.5s ease",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 13, flexShrink: 0,
        background: `${accent}0.09)`, border: `1px solid ${accent}0.18)`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
      }}>{icon}</div>
      <span style={{ fontSize: 14.5, color: T.soft, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

// ─── Close Button ─────────────────────────────────────────────────────────────
function CloseBtn({ onClose }) {
  return (
    <button className="hmf4-tap" onClick={onClose} style={{
      position: "absolute",
      top: "max(20px, env(safe-area-inset-top, 20px))",
      right: 20, zIndex: 200,
      width: 36, height: 36, borderRadius: "50%",
      background: "rgba(0,0,0,0.35)",
      backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
      border: "1px solid rgba(255,255,255,0.10)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: T.muted, fontSize: 14, cursor: "pointer",
      fontFamily: "inherit",
    }}>✕</button>
  );
}

// ─── Spacer Helper ────────────────────────────────────────────────────────────
const sp = h => <div style={{ height: h }} />;


// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 1 — WER BIST DU?
// Vollbild-Hände+Pflanze. Gradient von unten. Content im unteren Drittel.
// KEINE leere Fläche oben — das Bild FÜHRT die Komposition.
// ══════════════════════════════════════════════════════════════════════════════
function S1({ data, setData }) {
  const opts = [
    { k: "works",       icon: "🎨", t: "Ich bringe Werke in die Welt",  s: "Gemälde, Musik, Fotos, Objekte …" },
    { k: "experiences", icon: "✨", t: "Ich begleite Menschen",          s: "Kurse, Events, Sessions, Reisen …" },
    { k: "hybrid",      icon: "🌿", t: "Ich tue beides",                 s: "Werke schaffen und Menschen verbinden" },
  ];

  return (
    <Scene src={IMG.s1} gradientStart="52%">
      {/* Spacer — lässt das Bild oben atmen */}
      <div style={{ flex: 1, minHeight: "32%" }} />

      {/* Content — schwebt im unteren Bereich des Bildes */}
      <div style={{ padding: "0 24px 160px" }}>

        <StepHeader step={1} total={7} label="Dein Fokus" />
        <ProgressBar step={1} total={7} />
        {sp(20)}

        <h1 style={{
          fontWeight: 800, fontSize: 34, color: T.text,
          letterSpacing: -1.2, lineHeight: 1.12, margin: 0,
          maxWidth: 290,
          animation: "hmf4-rise 0.65s 0.05s ease both",
        }}>Was beschreibt<br/>dich mehr?</h1>
        {sp(10)}

        <p style={{
          fontSize: 15, color: T.soft, lineHeight: 1.70, margin: 0,
          maxWidth: 260,
          animation: "hmf4-rise 0.65s 0.10s ease both",
        }}>Wähle deinen Weg.<br/>Du kannst ihn jederzeit anpassen.</p>
        {sp(24)}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(opts || []).filter(o => o && o.k).map((o, i) => (
            <div key={o.k} style={{ animation: `hmf4-rise 0.55s ${0.13 + i * 0.06}s ease both` }}>
              <SelectCard icon={o.icon} title={o.t} subtitle={o.s}
                selected={data.focus === o.k}
                onClick={() => setData(d => ({ ...d, focus: o.k }))} />
            </div>
          ))}
        </div>
        {sp(22)}

        {/* CTA rendered by global GuidanceFooter in root — see HuiMembershipFlow */}
      </div>
    </Scene>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 2 — WAS BRINGST DU IN DIE WELT?
// Atelier-Stimmung fullscreen. Künstlerin dominant oben.
// Text + Button schweben über Gradient.
// ══════════════════════════════════════════════════════════════════════════════
function S2() {
  return (
    <Scene src={IMG.s2} gradientStart="48%">
      <div style={{ flex: 1, minHeight: "40%" }} />
      <div style={{ padding: "0 24px 160px" }}>

        <StepHeader step={2} total={7} label="Dein Talent" accent={T.gold} />
        <ProgressBar step={2} total={7} />
        {sp(20)}

        <h1 style={{
          fontWeight: 800, fontSize: 38, color: T.text,
          letterSpacing: -1.4, lineHeight: 1.1, margin: 0,
          animation: "hmf4-rise 0.65s 0.05s ease both",
        }}>Zeige, was<br/>in dir steckt</h1>
        {sp(12)}

        <p style={{
          fontSize: 16, color: T.soft, lineHeight: 1.65, margin: 0,
          animation: "hmf4-rise 0.65s 0.10s ease both",
        }}>
          Teile Werke, Ideen, Erlebnisse und Momente.<br/>
          Dein Talent verdient eine Bühne.
        </p>
        {sp(32)}

        <div style={{ animation: "hmf4-rise 0.55s 0.15s ease both" }}>
{/* CTA → GuidanceFooter */}
        </div>
      </div>
    </Scene>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 3 — DU BIST NICHT ALLEIN
// Menschen in goldener Stunde. Offen und warm.
// Glassmorphism-Panel für die Community-Facts.
// ══════════════════════════════════════════════════════════════════════════════
function S3() {
  return (
    <Scene src={IMG.s3} gradientStart="50%">
      <div style={{ flex: 1, minHeight: "35%" }} />
      <div style={{ padding: "0 24px 160px" }}>

        <StepHeader step={3} total={7} label="Gemeinschaft" />
        <ProgressBar step={3} total={7} />
        {sp(20)}

        <h1 style={{
          fontWeight: 800, fontSize: 38, color: T.text,
          letterSpacing: -1.4, lineHeight: 1.1, margin: 0,
          animation: "hmf4-rise 0.65s 0.05s ease both",
        }}>Willkommen<br/>bei HUI</h1>
        {sp(10)}

        <p style={{
          fontSize: 16, color: T.soft, lineHeight: 1.65, margin: 0,
          animation: "hmf4-rise 0.65s 0.10s ease both",
        }}>
          Eine Gemeinschaft für Menschen, Talente<br/>
          und echte Herzensprojekte. Hier zählst du.
        </p>
        {sp(22)}

        {/* Glassmorphism fact panel */}
        <div style={{
          animation: "hmf4-rise 0.6s 0.14s ease both",
          background: "rgba(6,10,20,0.42)",
          backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 20, overflow: "hidden", marginBottom: 24,
        }}>
          {[
            ["🌱", "Echte Menschen, echte Begegnungen"],
            ["💡", "Kreativität ohne Wettbewerb"],
            ["🌍", "Gemeinsam etwas bewegen"],
          ].map(([e, t], i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 13,
              padding: "14px 18px",
              borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{e}</span>
              <span style={{ fontSize: 14, color: T.soft, fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>

{/* CTA → GuidanceFooter */}
      </div>
    </Scene>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 4 — GEMEINSAM ENTSTEHT ETWAS GRÖSSERES
// Epischer Sonnenaufgang. Coral-Energie. Feature-Punkte.
// ══════════════════════════════════════════════════════════════════════════════
function S4() {
  return (
    <Scene src={IMG.s4} gradientStart="45%">
      <div style={{ flex: 1, minHeight: "38%" }} />
      <div style={{ padding: "0 24px 160px" }}>

        <StepHeader step={4} total={7} label="Deine Wirkung" accent={T.coral} />
        <ProgressBar step={4} total={7} />
        {sp(20)}

        <h1 style={{
          fontWeight: 800, fontSize: 36, color: T.text,
          letterSpacing: -1.2, lineHeight: 1.12, margin: 0,
          animation: "hmf4-rise 0.65s 0.05s ease both",
        }}>Bereit, deine<br/>Wirkung zu entfalten?</h1>
        {sp(22)}

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
          <Feature icon="🌿" text="Teile dein Talent mit der Welt"       accent="rgba(22,215,197," delay={60} />
          <Feature icon="❤️" text="Verbinde dich mit echten Menschen"     accent="rgba(255,107,107," delay={150} />
          <Feature icon="✦"  text="Bewirke gemeinsam Großes"              accent="rgba(245,166,35," delay={240} />
        </div>

{/* CTA → GuidanceFooter */}
      </div>
    </Scene>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 5 — WOFÜR WIR STEHEN
// Dark atmospheric — Partikel, meditativ.
// Großes Headline-zentriertes Layout.
// ══════════════════════════════════════════════════════════════════════════════
function S5() {
  return (
    <DarkScene bgSrc={IMG.s5} opacity={0.40}>
      <div style={{
        padding: "max(62px, env(safe-area-inset-top, 62px)) 24px 160px",
      }}>
        {/* Logo oben — subtil */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <HuiLogo size={36} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: T.muted, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 7 }}>
              Schritt 5 von 7
            </div>
            <ProgressBar step={5} total={7} />
          </div>
        </div>

        <h1 style={{
          fontWeight: 800, fontSize: 44, color: T.text,
          letterSpacing: -1.6, lineHeight: 1.07, margin: 0,
          animation: "hmf4-rise 0.65s 0.05s ease both",
        }}>Wofür wir<br/>stehen</h1>
        {sp(12)}

        <p style={{
          fontSize: 16, color: T.soft, lineHeight: 1.65, margin: 0,
          animation: "hmf4-rise 0.65s 0.10s ease both",
        }}>Diese Werte tragen uns alle.</p>
        {sp(40)}

        <div style={{ display: "flex", flexDirection: "column", gap: 26, marginBottom: 44 }}>
          <ValueRow icon="🤍" title="Echtheit"  body="Sei du selbst. Immer."                      delay={80} />
          <ValueRow icon="🤝" title="Respekt"   body="Wir begegnen uns auf Augenhöhe."             delay={200} />
          <ValueRow icon="🌱" title="Wachstum"  body="Wir inspirieren und entwickeln uns."         delay={320} />
          <ValueRow icon="🎯" title="Wirkung"   body="Wir schaffen echten, dauerhaften Mehrwert."  delay={440} />
        </div>

        {/* Teal Divider */}
        <div style={{
          height: 1, marginBottom: 36,
          background: "linear-gradient(90deg, transparent, rgba(22,215,197,0.32), transparent)",
        }} />

{/* CTA → GuidanceFooter */}
      </div>
    </DarkScene>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 6 — GESCHÜTZTER RAUM
// Clean, minimalistisch, Vertrauen. Glas-Ästhetik.
// ══════════════════════════════════════════════════════════════════════════════
function S6() {
  return (
    <DarkScene bgSrc={IMG.s6} opacity={0.28}>
      <div style={{
        padding: "max(62px, env(safe-area-inset-top, 62px)) 24px 160px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <HuiLogo size={36} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: T.muted, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 7 }}>Schritt 6 von 7</div>
            <ProgressBar step={6} total={7} />
          </div>
        </div>

        <h1 style={{
          fontWeight: 800, fontSize: 42, color: T.text,
          letterSpacing: -1.5, lineHeight: 1.1, margin: 0,
          animation: "hmf4-rise 0.65s 0.05s ease both",
        }}>Ein sicherer<br/>Raum für alle</h1>
        {sp(12)}

        <p style={{
          fontSize: 16, color: T.soft, lineHeight: 1.65, margin: 0,
          animation: "hmf4-rise 0.65s 0.10s ease both",
        }}>HUI ist ein Ort des Vertrauens.</p>
        {sp(36)}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
          <SafetyRow icon="🛡️" text="Wir schützen deine Daten und deine Privatsphäre."                    delay={80} />
          <SafetyRow icon="🔒" text="Wir dulden keine Diskriminierung, Hass oder Belästigung."             delay={190} />
          <SafetyRow icon="⚙️" text="Du hast die volle Kontrolle über deine Inhalte und Sichtbarkeit."    delay={300} />
        </div>

        {/* Trust Badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 13, padding: "15px 18px",
          borderRadius: 16,
          background: "rgba(22,215,197,0.06)",
          border: "1px solid rgba(22,215,197,0.14)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          marginBottom: 32,
          animation: "hmf4-rise 0.6s 0.38s ease both",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11, flexShrink: 0,
            background: "rgba(22,215,197,0.10)", border: "1px solid rgba(22,215,197,0.20)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
          }}>✦</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.teal, marginBottom: 3 }}>Community-Versprechen</div>
            <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.5 }}>
              Aufgebaut auf Vertrauen und gegenseitigem Respekt.
            </div>
          </div>
        </div>

{/* CTA → GuidanceFooter */}
      </div>
    </DarkScene>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 7 — BEWUSSTER EINTRITT
// Apple Pay Level. Zeremoniell. Hoch.
// Logo prominent. Emotionale Checkbox.
// ══════════════════════════════════════════════════════════════════════════════
function S7({ data, setData, loading }) {
  const agreed = data.agbAll;

  return (
    <DarkScene bgSrc={IMG.s7} opacity={0.20}>
      <div style={{
        padding: "max(62px, env(safe-area-inset-top, 62px)) 24px 160px",
      }}>
        {/* Logo + Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
          <HuiLogo size={42} glow />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: T.muted, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 7 }}>Schritt 7 von 7</div>
            <ProgressBar step={7} total={7} />
          </div>
        </div>

        <h1 style={{
          fontWeight: 800, fontSize: 34, color: T.text,
          letterSpacing: -1.1, lineHeight: 1.13, margin: 0,
          animation: "hmf4-rise 0.65s 0.05s ease both",
        }}>Gemeinsam<br/>gestalten wir HUI</h1>
        {sp(10)}

        <p style={{
          fontSize: 15.5, color: T.soft, lineHeight: 1.65, margin: 0,
          animation: "hmf4-rise 0.65s 0.10s ease both",
        }}>
          Bitte lies unsere Bedingungen durch und stimm zu,
          um bewusst Teil der HUI-Gemeinschaft zu werden.
        </p>
        {sp(26)}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20, animation: "hmf4-rise 0.6s 0.13s ease both" }}>
          <LegalRow label="AGBs (Allgemeine Geschäftsbedingungen)" />
          <LegalRow label="Datenschutzerklärung" />
          <LegalRow label="Community-Richtlinien" />
        </div>

        {/* Emotionale Checkbox */}
        <button
          className="hmf4-tap"
          onClick={() => setData(d => ({ ...d, agbAll: !d.agbAll }))}
          style={{
            width: "100%", padding: "17px 18px", borderRadius: 18, border: "none",
            background: agreed ? "rgba(22,215,197,0.09)" : "rgba(255,255,255,0.04)",
            backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            outline: agreed ? "1.5px solid rgba(22,215,197,0.30)" : "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "flex-start", gap: 14,
            cursor: "pointer", textAlign: "left", fontFamily: "inherit",
            boxShadow: agreed
              ? "0 0 0 1px rgba(22,215,197,0.12), 0 6px 24px rgba(22,215,197,0.10), inset 0 1px 0 rgba(255,255,255,0.06)"
              : "0 1px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)",
            marginBottom: 22,
            transition: "all 0.25s ease",
            animation: "hmf4-rise 0.6s 0.17s ease both",
          }}>
          <div style={{
            width: 24, height: 24, borderRadius: 7, flexShrink: 0,
            border: `2px solid ${agreed ? T.teal : "rgba(255,255,255,0.22)"}`,
            background: agreed ? T.teal : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginTop: 2,
            boxShadow: agreed ? `0 0 14px rgba(22,215,197,0.5)` : "none",
            transition: "all 0.22s cubic-bezier(0.34,1.4,0.64,1)",
          }}>
            {agreed && (
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                <path d="M1.5 4.5L4.5 7.5L10 1.5" stroke="#041210" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: agreed ? T.text : T.soft, lineHeight: 1.4, marginBottom: 3, transition: "color 0.2s ease" }}>
              Ich stimme den Bedingungen zu
            </div>
            <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.45 }}>
              Du wirst bewusst Teil der HUI-Gemeinschaft.
            </div>
          </div>
        </button>

{/* CTA → GuidanceFooter */}

        {agreed && (
          <p style={{
            textAlign: "center", fontSize: 13, color: T.muted,
            marginTop: 14, lineHeight: 1.5,
            animation: "hmf4-rise 0.4s ease both",
          }}>Du wirst Teil von etwas Besonderem. 🌿</p>
        )}
      </div>
    </DarkScene>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 8 — EMOTIONALES ANKOMMEN
// Kosmischer Orb fullscreen. Großer Reveal. Das Ziel der ganzen Reise.
// Phasen-Animation: 3 Stufen.
// ══════════════════════════════════════════════════════════════════════════════
function S8() {
  const [ph, setPh] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPh(1), 150);
    const t2 = setTimeout(() => setPh(2), 800);
    const t3 = setTimeout(() => setPh(3), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="hmf4-screen" style={{
      position: "absolute", inset: 0, overflow: "hidden",
    }}>
      {/* Fullscreen cosmic image */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${IMG.s8})`,
        backgroundSize: "cover", backgroundPosition: "center",
        animation: "hmf4-ken 30s ease-in-out both",
      }} />
      {/* Dark gradient bottom */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(6,10,20,0.18) 0%, rgba(6,10,20,0.38) 30%, rgba(6,10,20,0.70) 55%, rgba(6,10,20,0.95) 78%, rgba(6,10,20,1) 92%)",
      }} />
      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, transparent 50%, rgba(6,10,20,0.40) 100%)",
      }} />

      {/* Content — bottom anchored */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "0 28px 160px",
        textAlign: "center", zIndex: 2,
      }}>
        {/* ORB — Das Herz des Finales */}
        <div style={{
          display: "flex", justifyContent: "center", marginBottom: 32,
          opacity: ph >= 1 ? 1 : 0,
          transform: ph >= 1 ? "scale(1) translateY(0)" : "scale(0.5) translateY(24px)",
          transition: "all 0.9s cubic-bezier(0.34,1.56,0.64,1)",
        }}>
          <div style={{ position: "relative", display: "inline-flex" }}>
            {/* Outer ring — dreht */}
            <div style={{
              position: "absolute", top: -30, left: -30, right: -30, bottom: -30,
              borderRadius: "50%",
              border: "1px solid rgba(22,215,197,0.18)",
              animation: "hmf4-spin-cw 26s linear infinite",
            }} />
            {/* Inner ring — dreht gegenläufig */}
            <div style={{
              position: "absolute", top: -18, left: -18, right: -18, bottom: -18,
              borderRadius: "50%",
              border: "1px solid rgba(255,138,107,0.13)",
              animation: "hmf4-spin-ccw 19s linear infinite",
            }} />
            {/* Ambient glow */}
            <div style={{
              position: "absolute", top: -55, left: -55, right: -55, bottom: -55,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(22,215,197,0.22) 0%, rgba(255,138,107,0.09) 45%, transparent 70%)",
              animation: "hmf4-breathe 4s ease-in-out infinite",
            }} />
            <HuiLogo size={96} glow float />
          </div>
        </div>

        {/* Text Phase 1 */}
        <div style={{
          opacity: ph >= 1 ? 1 : 0,
          transform: ph >= 1 ? "translateY(0)" : "translateY(22px)",
          transition: "all 0.70s ease 0.30s",
        }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🎉</div>
          <h1 style={{
            fontWeight: 800, fontSize: 30, color: T.text,
            letterSpacing: -0.8, lineHeight: 1.2, marginBottom: 14,
          }}>
            Willkommen in der<br/>HUI-Gemeinschaft!
          </h1>
          <p style={{ fontSize: 16, color: T.soft, lineHeight: 1.7, marginBottom: 38 }}>
            Schön, dass du da bist.<br/>
            Gemeinsam schaffen wir etwas Besonderes.
          </p>
        </div>

        {/* Stats — Phase 2 */}
        <div style={{
          display: "flex", marginBottom: 36,
          opacity: ph >= 2 ? 1 : 0,
          transform: ph >= 2 ? "translateY(0)" : "translateY(14px)",
          transition: "all 0.60s ease",
        }}>
          {[["1.000+","Kreative"],["∞","Möglichkeiten"],["1","Gemeinschaft"]].map(([n,l],i) => (
            <div key={i} style={{
              flex: 1, textAlign: "center",
              borderRight: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none",
            }}>
              <div style={{ fontWeight: 800, fontSize: 22, color: T.teal, marginBottom: 3 }}>{n}</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{l}</div>
            </div>
          ))}
        </div>

        {/* CTA — Phase 3 */}
        {/* CTA → GuidanceFooter */}

        {/* Shimmer */}
        <div style={{
          width: 44, height: "1.5px", borderRadius: 999, margin: "16px auto 0",
          background: `linear-gradient(90deg, transparent, ${T.teal}, transparent)`,
          backgroundSize: "300% 100%",
          animation: "hmf4-shimmer 2s ease infinite",
          opacity: ph >= 3 ? 0.6 : 0,
          transition: "opacity 0.6s ease 0.3s",
        }} />
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
// ── Per-step CTA config ──────────────────────────────────────────────────────
function useStepCta(step, data, loading, saveError = null) {
  // Returns { label, disabled, hint } for the current step
  return React.useMemo(() => {
    const configs = {
      1: { label: "Weiter",                   disabled: !data.focus,          hint: "Du kannst deinen Weg jederzeit anpassen" },
      2: { label: "Weiter",                   disabled: false,                hint: null },
      3: { label: "Weiter",                   disabled: false,                hint: null },
      4: { label: "Los geht's",               disabled: false,                hint: null },
      5: { label: "Weiter",                   disabled: false,                hint: null },
      6: { label: "Weiter",                   disabled: false,                hint: null },
      7: { label: loading
              ? "Einen Moment …"
              : "Zustimmen & Mitglied werden", disabled: !data.agbAll||loading, hint: saveError || "Du kannst jederzeit kündigen" },
      8: { label: "Zur HUI-Welt",             disabled: false,                hint: "Willkommen in der Gemeinschaft" },
    };
    return configs[step] ?? configs[1];
  }, [step, data.focus, data.agbAll, loading]);
}

export default function HuiMembershipFlow({ onComplete, onClose }) {
  const { activateMembership, refreshProfile, activateTalentProfile } = useAuth();
  const { enterFlow, exitFlow } = useGuidance();

  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [data,    setData]    = useState({ focus: null, agbAll: false });

  // ── Register with Guidance System ─────────────────────────────
  useEffect(() => {
    enterFlow("membership");
    return () => {
      exitFlow();
      // Phase 15.2: always cleanup on unmount (covers error boundaries + hard unmounts)
      cleanupOrbEnvironment({ reason: "membership-unmount" });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const next = useCallback(() => setStep(s => Math.min(s + 1, 8)), []);

  // Phase 15.2: save → sync → advance. Never close on error.
  const [saveError, setSaveError] = useState(null);

  const handleFinish = useCallback(async () => {
    if (!data.agbAll || loading) return;
    setSaveError(null);
    setLoading(true);
    try {
      // 1. Save to DB (single source of truth)
      const result = await activateMembership?.();
      if (result?.error) {
        setSaveError("Speichern fehlgeschlagen. Bitte nochmal versuchen.");
        return;
      }
      // 2. Activate talent profile if focus was selected
      if (data.focus && activateTalentProfile) {
        await activateTalentProfile(data.focus).catch(() => {});
      }
      // 3. Sync profile from DB
      await refreshProfile?.().catch(() => {});
      // 4. Advance to success screen (orb stays open until user presses CTA in S8)
      setStep(8);
    } catch (e) {
      setSaveError("Verbindungsfehler. Bitte nochmal versuchen.");
      console.warn("[HUI MF] handleFinish error:", e?.message);
    } finally {
      setLoading(false);
    }
  }, [data, loading, activateMembership, activateTalentProfile, refreshProfile]);

  // ── CTA config for current step ───────────────────────────────
  const ctaCfg = useStepCta(step, data, loading, saveError);

  function handleCta() {
    if (step === 7) { handleFinish(); return; }
    if (step === 8) {
      // Phase 15.2: cleanup FIRST, then close
      cleanupOrbEnvironment({ reason: "membership-complete" });
      onComplete?.();
      return;
    }
    next();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9800,
      background: T.bg, overflow: "hidden",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
      WebkitFontSmoothing: "antialiased",
      display: "flex", flexDirection: "column",
    }}>
      <style>{CSS}</style>

      {/* Preload */}
      <div style={{ display: "none" }} aria-hidden="true">
        {Object.values(IMG||{}).map((s, i) => s ? <img key={i} src={s} alt="" loading="eager" /> : null)}
      </div>

      {/* ── Step content — fills flex space ──────────────────── */}
      <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
        {step === 1 && <S1 data={data} setData={setData} />}
        {step === 2 && <S2 />}
        {step === 3 && <S3 />}
        {step === 4 && <S4 />}
        {step === 5 && <S5 />}
        {step === 6 && <S6 />}
        {step === 7 && <S7 data={data} setData={setData} loading={loading} />}
        {step === 8 && <S8 />}
      </div>

      {/* ── Global GuidanceFooter — ONE footer for entire flow ── */}
      {/* Position: fixed — always above everything, safe-area aware */}
      <div style={{
        position:      "fixed",
        bottom:        "calc(env(safe-area-inset-bottom, 0px) + 18px)",
        left:          18,
        right:         18,
        zIndex:        9810,   // above content (9800) — below nothing in this flow
        isolation:     "isolate",
        contain:       "layout paint",
        // Reveal animation
        animation:     "hmf4-rise 0.52s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        <GuidanceFooter
          cta={ctaCfg.label}
          onCta={handleCta}
          disabled={ctaCfg.disabled}
          loading={loading && step === 7}
          hint={ctaCfg.hint}
          secondary={step <= 6 && step > 1 ? { label: "Zurück", onClick: () => setStep(s => Math.max(s-1,1)) } : null}
        />
      </div>

      {step <= 6 && <CloseBtn onClose={() => {
        cleanupOrbEnvironment({ reason: "user-close" });
        onClose?.();
      }} />}

      {loading && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 50,
          background: "rgba(6,10,20,0.80)",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            border: "2.5px solid rgba(255,255,255,0.08)",
            borderTopColor: T.teal,
            animation: "hmf4-spin-cw 0.75s linear infinite",
          }} />
        </div>
      )}
    </div>
  );
}
