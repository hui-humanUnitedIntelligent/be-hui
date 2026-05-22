/**
 * HuiMembershipFlow — Premium Cinematic Membership Journey v3
 *
 * Design: Apple Vision Pro trifft Headspace trifft A24 Film
 * Jeder Screen = eigenes Kapitel, eigene Welt, eigene Emotion
 *
 * FLOW: Basis-User tippt HUI-Button → diese Journey → is_member=true
 * NICHT: Login-Onboarding. NICHT: Tutorial. NICHT: normales Formular.
 * SONDERN: Emotionale Aufnahme in eine Gemeinschaft.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../lib/AuthContext";

// ─── Hero Images ──────────────────────────────────────────────────────────────
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

// ─── Global Keyframes ─────────────────────────────────────────────────────────
const CSS = `
  @keyframes hui-mb-kenburns {
    from { transform: scale(1.0) translateY(0px); }
    to   { transform: scale(1.06) translateY(-8px); }
  }
  @keyframes hui-mb-float {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-7px); }
  }
  @keyframes hui-mb-orb-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes hui-mb-orb-spin-rev {
    from { transform: rotate(0deg); }
    to   { transform: rotate(-360deg); }
  }
  @keyframes hui-mb-glow-breathe {
    0%,100% { opacity: 0.55; transform: scale(1); }
    50%     { opacity: 0.85; transform: scale(1.06); }
  }
  @keyframes hui-mb-dot-pulse {
    0%,100% { opacity: 0.3; transform: scale(1); }
    50%     { opacity: 1;   transform: scale(1.45); }
  }
  @keyframes hui-mb-shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  @keyframes hui-mb-in-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0px);  }
  }
  @keyframes hui-mb-in-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes hui-mb-scale-in {
    from { opacity: 0; transform: scale(0.90); }
    to   { opacity: 1; transform: scale(1.00); }
  }
  @keyframes hui-mb-progress-fill {
    from { width: 0%; }
    to   { width: 100%; }
  }

  .hui-mb-screen {
    animation: hui-mb-in-fade 0.50s cubic-bezier(0.22,1,0.36,1) both;
  }
  .hui-mb-card-tap {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .hui-mb-card-tap:active {
    transform: scale(0.975) !important;
  }
  .hui-mb-btn-tap {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition: transform 0.12s ease, opacity 0.15s ease;
  }
  .hui-mb-btn-tap:active {
    transform: scale(0.96) !important;
  }
`;

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  teal:      "#16D7C5",
  tealAlpha: "rgba(22,215,197,",
  coral:     "#FF8A6B",
  gold:      "#F5A623",
  white:     "#FFFFFF",
  text:      "rgba(255,255,255,0.92)",
  soft:      "rgba(255,255,255,0.72)",
  muted:     "rgba(255,255,255,0.46)",
  dim:       "rgba(255,255,255,0.20)",
  bg:        "#080C17",
  surface:   "rgba(255,255,255,0.065)",
  border:    "rgba(255,255,255,0.095)",
  borderHi:  "rgba(255,255,255,0.16)",
};

// ─── HUI LOGO — Das echte Brand-Asset. Keine Interpretation. ─────────────────
function HuiLogo({ size = 52, glow = false, float = false, ambient = false }) {
  return (
    <div style={{
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      animation: float ? "hui-mb-float 5s ease-in-out infinite" : "none",
    }}>
      {/* Ambient Glow Ring — nur wenn ambient=true */}
      {ambient && (
        <div style={{
          position: "absolute",
          inset: -size * 0.55,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(22,215,197,0.18) 0%, rgba(255,138,107,0.08) 45%, transparent 70%)`,
          animation: "hui-mb-glow-breathe 4s ease-in-out infinite",
          pointerEvents: "none",
        }}/>
      )}
      {/* Das Logo */}
      <div style={{
        width: size, height: size,
        borderRadius: size * 0.22,
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: glow
          ? `0 0 ${size * 0.7}px rgba(22,215,197,0.45), 0 0 ${size * 1.2}px rgba(22,215,197,0.18), 0 ${size * 0.08}px ${size * 0.25}px rgba(0,0,0,0.45)`
          : `0 ${size * 0.05}px ${size * 0.2}px rgba(0,0,0,0.4)`,
      }}>
        <img
          src="/hui-logo.jpg"
          alt="HUI"
          style={{
            width: "100%", height: "100%",
            objectFit: "cover", display: "block",
          }}
        />
      </div>
    </div>
  );
}

// ─── Progress Bar — Apple Level ───────────────────────────────────────────────
function ProgressBar({ current, total }) {
  return (
    <div style={{
      display: "flex", gap: 6, width: "100%", alignItems: "center",
    }}>
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < current;
        const active = i === current - 1;
        return (
          <div key={i} style={{
            flex: 1, height: "1.5px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.12)",
            overflow: "hidden",
            position: "relative",
          }}>
            {filled && (
              <div style={{
                position: "absolute", inset: 0,
                background: active
                  ? `linear-gradient(90deg, ${C.teal} 0%, ${C.coral} 100%)`
                  : `linear-gradient(90deg, ${C.teal} 0%, rgba(22,215,197,0.7) 100%)`,
                boxShadow: active ? `0 0 5px rgba(22,215,197,0.6)` : "none",
              }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Floating Pill Label ──────────────────────────────────────────────────────
function PillLabel({ text, color = C.teal, colorAlpha = "rgba(22,215,197," }) {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      background: `${colorAlpha}0.10)`,
      border: `1px solid ${colorAlpha}0.25)`,
      borderRadius: 999,
      padding: "5px 13px 5px 10px",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
    }}>
      <div style={{
        width: 5, height: 5, borderRadius: "50%",
        background: color,
        boxShadow: `0 0 6px ${color}`,
      }}/>
      <span style={{
        fontSize: 10.5, fontWeight: 700, color,
        letterSpacing: "0.11em",
        textTransform: "uppercase",
      }}>{text}</span>
    </div>
  );
}

// ─── Primary Button ───────────────────────────────────────────────────────────
function Btn({ onClick, disabled = false, children, variant = "teal" }) {
  const configs = {
    teal: {
      bg:     `linear-gradient(145deg, rgba(22,215,197,0.92) 0%, rgba(11,191,175,0.96) 100%)`,
      shadow: `0 8px 28px rgba(22,215,197,0.28), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`,
      color:  "#0A1510",
    },
    coral: {
      bg:     `linear-gradient(145deg, rgba(255,138,107,0.92) 0%, rgba(255,100,70,0.96) 100%)`,
      shadow: `0 8px 28px rgba(255,138,107,0.28), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`,
      color:  "#1A0A05",
    },
  };
  const cfg = configs[variant] || configs.teal;

  return (
    <button
      className="hui-mb-btn-tap"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "18px 28px",
        borderRadius: 17,
        border: "none",
        background: disabled
          ? "rgba(255,255,255,0.07)"
          : cfg.bg,
        color: disabled ? C.muted : cfg.color,
        fontFamily: "inherit",
        fontSize: 16,
        fontWeight: 700,
        letterSpacing: -0.3,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        opacity: disabled ? 0.45 : 1,
        boxShadow: disabled ? "none" : cfg.shadow,
        backdropFilter: disabled ? "none" : "blur(4px)",
      }}>
      {children}
    </button>
  );
}

// ─── Ghost Button ─────────────────────────────────────────────────────────────
function GhostBtn({ onClick, children }) {
  return (
    <button
      className="hui-mb-btn-tap"
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: 500,
        color: C.muted,
        padding: "12px 0",
        textAlign: "center",
        width: "100%",
        letterSpacing: 0,
      }}>
      {children}
    </button>
  );
}

// ─── Select Card ──────────────────────────────────────────────────────────────
function SelectCard({ icon, title, subtitle, selected, onClick }) {
  return (
    <button
      className="hui-mb-card-tap"
      onClick={onClick}
      style={{
        width: "100%",
        padding: "17px 18px",
        borderRadius: 18,
        border: "none",
        background: selected
          ? "rgba(22,215,197,0.09)"
          : "rgba(255,255,255,0.04)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        outline: selected
          ? "1.5px solid rgba(22,215,197,0.32)"
          : "1px solid rgba(255,255,255,0.08)",
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 15,
        fontFamily: "inherit",
        boxShadow: selected
          ? "0 0 0 1px rgba(22,215,197,0.12), 0 6px 24px rgba(22,215,197,0.10), inset 0 1px 0 rgba(255,255,255,0.06)"
          : "0 1px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}>

      {/* Icon */}
      <div style={{
        width: 46, height: 46,
        borderRadius: 14,
        flexShrink: 0,
        background: selected
          ? "rgba(22,215,197,0.15)"
          : "rgba(255,255,255,0.06)",
        border: selected
          ? "1px solid rgba(22,215,197,0.25)"
          : "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        transition: "all 0.22s ease",
      }}>{icon}</div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontWeight: 650,
          fontSize: 15,
          color: selected ? C.text : C.soft,
          letterSpacing: -0.25,
          marginBottom: 3,
          lineHeight: 1.3,
          transition: "color 0.2s ease",
        }}>{title}</div>
        <div style={{
          fontSize: 12.5,
          color: C.muted,
          lineHeight: 1.4,
        }}>{subtitle}</div>
      </div>

      {/* Radio Circle */}
      <div style={{
        width: 22, height: 22,
        borderRadius: "50%",
        flexShrink: 0,
        border: `2px solid ${selected ? C.teal : "rgba(255,255,255,0.18)"}`,
        background: selected ? C.teal : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.22s cubic-bezier(0.34,1.4,0.64,1)",
        boxShadow: selected ? `0 0 10px rgba(22,215,197,0.45)` : "none",
      }}>
        {selected && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="#080C17"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </button>
  );
}

// ─── Value Row ────────────────────────────────────────────────────────────────
function ValueRow({ icon, title, body, delay = 0 }) {
  const [vis, setVis] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 15,
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(16px)",
      transition: `opacity 0.55s ease, transform 0.55s ease`,
    }}>
      <div style={{
        width: 42, height: 42,
        borderRadius: 14,
        flexShrink: 0,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.09)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 19,
      }}>{icon}</div>
      <div style={{ paddingTop: 2 }}>
        <div style={{
          fontWeight: 650,
          fontSize: 15.5,
          color: C.text,
          letterSpacing: -0.3,
          marginBottom: 3,
        }}>{title}</div>
        <div style={{
          fontSize: 13.5,
          color: C.soft,
          lineHeight: 1.55,
        }}>{body}</div>
      </div>
    </div>
  );
}

// ─── Safety Row ───────────────────────────────────────────────────────────────
function SafetyRow({ icon, text, delay = 0 }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 15,
      padding: "16px 20px",
      borderRadius: 16,
      background: "rgba(255,255,255,0.035)",
      border: "1px solid rgba(255,255,255,0.07)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      opacity: vis ? 1 : 0,
      transform: vis ? "translateX(0)" : "translateX(-14px)",
      transition: "opacity 0.55s ease, transform 0.55s ease",
    }}>
      <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{ fontSize: 14.5, color: C.soft, lineHeight: 1.6 }}>{text}</span>
    </div>
  );
}

// ─── Legal Row ────────────────────────────────────────────────────────────────
function LegalRow({ label }) {
  const [p, setP] = useState(false);
  return (
    <div
      className="hui-mb-card-tap"
      onPointerDown={() => setP(true)}
      onPointerUp={() => setP(false)}
      onPointerLeave={() => setP(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        borderRadius: 15,
        background: p ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        cursor: "pointer",
        transition: "background 0.14s ease",
      }}>
      <span style={{ fontSize: 14.5, color: C.soft, fontWeight: 500 }}>{label}</span>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M5 3L9 7L5 11" stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

// ─── Close Button ─────────────────────────────────────────────────────────────
function CloseBtn({ onClose }) {
  return (
    <button
      className="hui-mb-btn-tap"
      onClick={onClose}
      style={{
        position: "absolute",
        top: "max(20px, env(safe-area-inset-top, 20px))",
        right: 20,
        zIndex: 100,
        width: 36, height: 36,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.10)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: C.muted,
        fontSize: 14,
        cursor: "pointer",
        fontFamily: "inherit",
      }}>✕</button>
  );
}

// ─── Full-Bleed Hero Image with Gradient ─────────────────────────────────────
function Hero({ src, gradient, heightPct = 55, animKey }) {
  return (
    <div style={{
      position: "absolute",
      top: 0, left: 0, right: 0,
      height: `${heightPct}%`,
      overflow: "hidden",
      borderRadius: "0 0 28px 28px",
    }}>
      {/* Ken Burns */}
      <div
        key={animKey}
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          animation: "hui-mb-kenburns 20s ease-in-out both",
          willChange: "transform",
        }}
      />
      {/* Gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: gradient,
      }}/>
    </div>
  );
}

// ─── Screen Wrapper ───────────────────────────────────────────────────────────
function Screen({ children, scroll = true }) {
  return (
    <div
      className="hui-mb-screen"
      style={{
        position: "absolute", inset: 0,
        overflowY: scroll ? "auto" : "hidden",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
      }}>
      {children}
    </div>
  );
}

// ─── Vertical content layout helper ──────────────────────────────────────────
const pad = (t = 0) => ({
  padding: `${t}px 26px max(40px, env(safe-area-inset-bottom, 40px))`,
});


// ══════════════════════════════════════════════════════════════════════════════
// S1 — WER BIST DU?
// Stimmung: ruhig, organisch, Hände+Licht, warm teal-gold
// Layout: Bild oben 58%, Content darunter ausbalanciert
// ══════════════════════════════════════════════════════════════════════════════
function S1({ onNext, data, setData }) {
  const opts = [
    { k: "works",       icon: "🎨", t: "Ich bringe Werke in die Welt",  s: "Gemälde, Musik, Fotos, Objekte …" },
    { k: "experiences", icon: "✨", t: "Ich begleite Menschen",          s: "Kurse, Events, Sessions, Reisen …" },
    { k: "hybrid",      icon: "🌿", t: "Ich tue beides",                 s: "Werke schaffen und Menschen verbinden" },
  ];

  return (
    <Screen>
      <Hero
        src={IMG.s1}
        heightPct={52}
        gradient="linear-gradient(180deg, rgba(8,12,23,0.05) 0%, rgba(8,12,23,0.22) 45%, rgba(8,12,23,0.72) 72%, rgba(8,12,23,1) 92%)"
        animKey="s1"
      />

      {/* Pill label on image */}
      <div style={{
        position: "absolute",
        top: "calc(52% - 56px)",
        left: 26,
        zIndex: 5,
      }}>
        <PillLabel text="Dein Fokus" />
      </div>

      {/* Content */}
      <div style={{
        position: "relative",
        zIndex: 2,
        marginTop: "calc(52% - 8px)",
        ...pad(0),
      }}>
        {/* Progress + Step */}
        <div style={{ marginBottom: 24, paddingTop: 16 }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.muted,
              letterSpacing: "0.08em", textTransform: "uppercase" }}>Schritt 1 von 7</span>
          </div>
          <ProgressBar current={1} total={7} />
        </div>

        {/* Headline */}
        <div style={{ animation: "hui-mb-in-up 0.6s 0.05s ease both", marginBottom: 9 }}>
          <h1 style={{
            fontWeight: 800, fontSize: 34, color: C.text,
            letterSpacing: -1.2, lineHeight: 1.12, margin: 0,
          }}>Was beschreibt<br/>dich mehr?</h1>
        </div>

        <div style={{ animation: "hui-mb-in-up 0.6s 0.10s ease both", marginBottom: 24 }}>
          <p style={{
            fontSize: 15.5, color: C.soft, lineHeight: 1.65, margin: 0,
          }}>Wähle deinen Weg — du kannst ihn später anpassen.</p>
        </div>

        {/* Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 26 }}>
          {opts.map((o, i) => (
            <div key={o.k} style={{ animation: `hui-mb-in-up 0.55s ${0.13 + i * 0.06}s ease both` }}>
              <SelectCard
                icon={o.icon} title={o.t} subtitle={o.s}
                selected={data.focus === o.k}
                onClick={() => setData(d => ({ ...d, focus: o.k }))}
              />
            </div>
          ))}
        </div>

        <div style={{ animation: "hui-mb-in-up 0.55s 0.32s ease both" }}>
          <Btn onClick={onNext} disabled={!data.focus}>Weiter →</Btn>
        </div>
      </div>
    </Screen>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// S2 — WAS BRINGST DU IN DIE WELT?
// Stimmung: Atelier, warm amber, Künstlerin, intim
// ══════════════════════════════════════════════════════════════════════════════
function S2({ onNext }) {
  return (
    <Screen>
      <Hero
        src={IMG.s2}
        heightPct={58}
        gradient="linear-gradient(180deg, rgba(8,12,23,0.02) 0%, rgba(8,12,23,0.18) 42%, rgba(8,12,23,0.78) 68%, rgba(8,12,23,1) 90%)"
        animKey="s2"
      />

      <div style={{
        position: "absolute",
        top: "calc(58% - 56px)",
        left: 26,
        zIndex: 5,
      }}>
        <PillLabel text="Dein Talent" color={C.gold} colorAlpha="rgba(245,166,35," />
      </div>

      <div style={{
        position: "relative", zIndex: 2,
        marginTop: "calc(58% - 8px)",
        ...pad(0),
      }}>
        <div style={{ marginBottom: 24, paddingTop: 16 }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 8,
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.muted,
              letterSpacing: "0.08em", textTransform: "uppercase" }}>Schritt 2 von 7</span>
          </div>
          <ProgressBar current={2} total={7} />
        </div>

        <div style={{ animation: "hui-mb-in-up 0.6s 0.05s ease both", marginBottom: 9 }}>
          <h1 style={{
            fontWeight: 800, fontSize: 34, color: C.text,
            letterSpacing: -1.2, lineHeight: 1.12, margin: 0,
          }}>Zeige, was<br/>in dir steckt</h1>
        </div>

        <div style={{ animation: "hui-mb-in-up 0.6s 0.10s ease both", marginBottom: 32 }}>
          <p style={{ fontSize: 15.5, color: C.soft, lineHeight: 1.65, margin: 0 }}>
            Teile Werke, Ideen, Erlebnisse und Momente.<br/>
            Dein Talent verdient eine Bühne.
          </p>
        </div>

        {/* Feature points */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 36 }}>
          {[
            { icon: "🎭", text: "Werke & Kreationen mit der Welt teilen",  delay: 80 },
            { icon: "💫", text: "Deine eigene kreative Bühne aufbauen",    delay: 180 },
            { icon: "🤝", text: "Echte Verbindungen zu Menschen schaffen", delay: 280 },
          ].map((it, i) => (
            <FeatureInline key={i} icon={it.icon} text={it.text} delay={it.delay} goldAccent />
          ))}
        </div>

        <Btn onClick={onNext}>Weiter →</Btn>
      </div>
    </Screen>
  );
}

// ─── Inline Feature (für S2, S4) ─────────────────────────────────────────────
function FeatureInline({ icon, text, delay = 0, goldAccent = false }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(14px)",
      transition: "opacity 0.5s ease, transform 0.5s ease",
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 13,
        flexShrink: 0,
        background: goldAccent ? "rgba(245,166,35,0.09)" : "rgba(22,215,197,0.09)",
        border: goldAccent ? "1px solid rgba(245,166,35,0.18)" : "1px solid rgba(22,215,197,0.18)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 19,
      }}>{icon}</div>
      <span style={{ fontSize: 15, color: C.soft, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// S3 — DU BIST NICHT ALLEIN
// Stimmung: Menschen, echte Nähe, Wärme, goldene Stunde
// ══════════════════════════════════════════════════════════════════════════════
function S3({ onNext }) {
  return (
    <Screen>
      <Hero
        src={IMG.s3}
        heightPct={57}
        gradient="linear-gradient(180deg, rgba(8,12,23,0.04) 0%, rgba(8,12,23,0.22) 44%, rgba(8,12,23,0.82) 68%, rgba(8,12,23,1) 92%)"
        animKey="s3"
      />

      <div style={{ position: "absolute", top: "calc(57% - 56px)", left: 26, zIndex: 5 }}>
        <PillLabel text="Gemeinschaft" />
      </div>

      <div style={{ position: "relative", zIndex: 2, marginTop: "calc(57% - 8px)", ...pad(0) }}>
        <div style={{ marginBottom: 24, paddingTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Schritt 3 von 7</span>
          </div>
          <ProgressBar current={3} total={7} />
        </div>

        <div style={{ animation: "hui-mb-in-up 0.6s 0.05s ease both", marginBottom: 9 }}>
          <h1 style={{ fontWeight: 800, fontSize: 34, color: C.text, letterSpacing: -1.2, lineHeight: 1.12, margin: 0 }}>
            Willkommen<br/>bei HUI
          </h1>
        </div>

        <div style={{ animation: "hui-mb-in-up 0.6s 0.10s ease both", marginBottom: 28 }}>
          <p style={{ fontSize: 15.5, color: C.soft, lineHeight: 1.65, margin: 0 }}>
            Eine Gemeinschaft für Menschen, Talente<br/>
            und echte Herzensprojekte.<br/>
            Hier zählt, wer du bist.
          </p>
        </div>

        {/* Glass facts panel */}
        <div style={{
          animation: "hui-mb-in-up 0.6s 0.15s ease both",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderRadius: 20,
          overflow: "hidden",
          marginBottom: 30,
        }}>
          {[
            ["🌱", "Echte Menschen, echte Begegnungen"],
            ["💡", "Kreativität ohne Wettbewerb"],
            ["🌍", "Gemeinsam etwas bewegen"],
          ].map(([e, t], i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "15px 20px",
              borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.055)" : "none",
            }}>
              <span style={{ fontSize: 19, flexShrink: 0 }}>{e}</span>
              <span style={{ fontSize: 14.5, color: C.soft, fontWeight: 500, lineHeight: 1.4 }}>{t}</span>
            </div>
          ))}
        </div>

        <Btn onClick={onNext}>Weiter →</Btn>
      </div>
    </Screen>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// S4 — GEMEINSAM ENTSTEHT ETWAS GRÖSSERES
// Stimmung: epischer Sonnenaufgang, Orange+Coral, Energie+Hoffnung
// ══════════════════════════════════════════════════════════════════════════════
function S4({ onNext }) {
  return (
    <Screen>
      <Hero
        src={IMG.s4}
        heightPct={56}
        gradient="linear-gradient(180deg, rgba(8,12,23,0.04) 0%, rgba(8,12,23,0.15) 38%, rgba(8,12,23,0.75) 65%, rgba(8,12,23,1) 90%)"
        animKey="s4"
      />

      <div style={{ position: "absolute", top: "calc(56% - 56px)", left: 26, zIndex: 5 }}>
        <PillLabel text="Deine Wirkung" color={C.coral} colorAlpha="rgba(255,138,107," />
      </div>

      <div style={{ position: "relative", zIndex: 2, marginTop: "calc(56% - 8px)", ...pad(0) }}>
        <div style={{ marginBottom: 24, paddingTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Schritt 4 von 7</span>
          </div>
          <ProgressBar current={4} total={7} />
        </div>

        <div style={{ animation: "hui-mb-in-up 0.6s 0.05s ease both", marginBottom: 9 }}>
          <h1 style={{ fontWeight: 800, fontSize: 32, color: C.text, letterSpacing: -1.0, lineHeight: 1.15, margin: 0 }}>
            Bereit, deine Wirkung<br/>zu entfalten?
          </h1>
        </div>

        <div style={{ animation: "hui-mb-in-up 0.6s 0.10s ease both", marginBottom: 30 }}>
          <p style={{ fontSize: 15.5, color: C.soft, lineHeight: 1.65, margin: 0 }}>
            Gemeinsam entstehen Dinge,<br/>die einer alleine nicht schafft.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 34 }}>
          <FeatureInline icon="🌿" text="Teile dein Talent mit der Welt"       delay={60} />
          <FeatureInline icon="❤️" text="Verbinde dich mit echten Menschen"     delay={150} />
          <FeatureInline icon="✦"  text="Bewirke gemeinsam Großes"              delay={240} />
        </div>

        <Btn onClick={onNext} variant="coral">Los geht's →</Btn>
      </div>
    </Screen>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// S5 — WOFÜR WIR STEHEN
// Stimmung: dunkel, Teal-Partikel, meditativ, tief
// Voller Hintergrund — kein Bild-Text Split
// ══════════════════════════════════════════════════════════════════════════════
function S5({ onNext }) {
  return (
    <Screen>
      {/* Vollbild — atmosphärisch gedimmt */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${IMG.s5})`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.42,
          animation: "hui-mb-kenburns 25s ease-in-out both",
        }}/>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(8,12,23,0.6) 0%, rgba(8,12,23,0.78) 50%, rgba(8,12,23,0.96) 100%)",
        }}/>
      </div>

      <div style={{
        position: "relative", zIndex: 2,
        padding: "max(60px, env(safe-area-inset-top, 60px)) 26px max(44px, env(safe-area-inset-bottom, 44px))",
      }}>
        {/* Logo ambient — subtil */}
        <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 14 }}>
          <HuiLogo size={38} ambient />
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: C.muted,
              letterSpacing: "0.08em", textTransform: "uppercase",
              marginBottom: 7,
            }}>Schritt 5 von 7</div>
            <ProgressBar current={5} total={7} />
          </div>
        </div>

        <div style={{ animation: "hui-mb-in-up 0.6s 0.05s ease both", marginBottom: 8 }}>
          <h1 style={{
            fontWeight: 800, fontSize: 40, color: C.text,
            letterSpacing: -1.5, lineHeight: 1.08, margin: 0,
          }}>Wofür wir<br/>stehen</h1>
        </div>

        <div style={{ animation: "hui-mb-in-up 0.6s 0.10s ease both", marginBottom: 40 }}>
          <p style={{ fontSize: 16, color: C.soft, lineHeight: 1.65, margin: 0 }}>
            Diese Werte tragen uns alle.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28, marginBottom: 44 }}>
          <ValueRow icon="🤍" title="Echtheit"  body="Sei du selbst. Immer."                         delay={80} />
          <ValueRow icon="🤝" title="Respekt"   body="Wir begegnen uns auf Augenhöhe."               delay={200} />
          <ValueRow icon="🌱" title="Wachstum"  body="Wir inspirieren und entwickeln uns."           delay={320} />
          <ValueRow icon="🎯" title="Wirkung"   body="Wir schaffen echten, dauerhaften Mehrwert."    delay={440} />
        </div>

        {/* Elegant divider */}
        <div style={{
          height: 1, marginBottom: 36,
          background: "linear-gradient(90deg, transparent 0%, rgba(22,215,197,0.28) 50%, transparent 100%)",
        }}/>

        <Btn onClick={onNext}>Weiter →</Btn>
      </div>
    </Screen>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// S6 — GESCHÜTZTER RAUM
// Stimmung: minimalistisch, clean, white light, Vertrauen, Apple-rein
// ══════════════════════════════════════════════════════════════════════════════
function S6({ onNext }) {
  return (
    <Screen>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${IMG.s6})`,
          backgroundSize: "cover", backgroundPosition: "center top",
          opacity: 0.3,
          animation: "hui-mb-kenburns 25s ease-in-out both",
        }}/>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(8,12,23,0.55) 0%, rgba(8,12,23,0.80) 45%, rgba(8,12,23,0.98) 80%)",
        }}/>
      </div>

      <div style={{
        position: "relative", zIndex: 2,
        padding: "max(60px, env(safe-area-inset-top, 60px)) 26px max(44px, env(safe-area-inset-bottom, 44px))",
      }}>
        <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 14 }}>
          <HuiLogo size={38} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>Schritt 6 von 7</div>
            <ProgressBar current={6} total={7} />
          </div>
        </div>

        <div style={{ animation: "hui-mb-in-up 0.6s 0.05s ease both", marginBottom: 8 }}>
          <h1 style={{ fontWeight: 800, fontSize: 38, color: C.text, letterSpacing: -1.3, lineHeight: 1.1, margin: 0 }}>
            Ein sicherer Raum<br/>für alle
          </h1>
        </div>

        <div style={{ animation: "hui-mb-in-up 0.6s 0.10s ease both", marginBottom: 36 }}>
          <p style={{ fontSize: 15.5, color: C.soft, lineHeight: 1.65, margin: 0 }}>
            HUI ist ein Ort des Vertrauens.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          <SafetyRow icon="🛡️" text="Wir schützen deine Daten und deine Privatsphäre."                    delay={80} />
          <SafetyRow icon="🔒" text="Wir dulden keine Diskriminierung, Hass oder Belästigung."             delay={190} />
          <SafetyRow icon="⚙️" text="Du hast die volle Kontrolle über deine Inhalte und Sichtbarkeit."    delay={300} />
        </div>

        {/* Trust seal */}
        <div style={{
          animation: "hui-mb-in-up 0.6s 0.38s ease both",
          display: "flex", alignItems: "center", gap: 14,
          padding: "16px 20px",
          borderRadius: 17,
          background: "rgba(22,215,197,0.05)",
          border: "1px solid rgba(22,215,197,0.12)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          marginBottom: 32,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: "rgba(22,215,197,0.10)",
            border: "1px solid rgba(22,215,197,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, flexShrink: 0,
          }}>✦</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: C.teal, marginBottom: 3 }}>
              Community-Versprechen
            </div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
              Wir bauen HUI auf Vertrauen und gegenseitigem Respekt.
            </div>
          </div>
        </div>

        <Btn onClick={onNext}>Weiter →</Btn>
      </div>
    </Screen>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// S7 — BEWUSSTE ENTSCHEIDUNG
// Stimmung: hochwertig, seriös, Apple Pay / Wallet Level
// ══════════════════════════════════════════════════════════════════════════════
function S7({ onNext, data, setData, loading }) {
  const agreed = data.agbAll;

  return (
    <Screen>
      {/* Subtiles Hintergrundbild */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${IMG.s7})`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.22,
          animation: "hui-mb-kenburns 28s ease-in-out both",
        }}/>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(8,12,23,0.65) 0%, rgba(8,12,23,0.90) 60%, rgba(8,12,23,1) 100%)",
        }}/>
      </div>

      <div style={{
        position: "relative", zIndex: 2,
        padding: "max(60px, env(safe-area-inset-top, 60px)) 26px max(44px, env(safe-area-inset-bottom, 44px))",
      }}>
        {/* Logo + Progress */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          marginBottom: 32,
        }}>
          <HuiLogo size={42} glow />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>Schritt 7 von 7</div>
            <ProgressBar current={7} total={7} />
          </div>
        </div>

        <div style={{ animation: "hui-mb-in-up 0.6s 0.05s ease both", marginBottom: 8 }}>
          <h1 style={{ fontWeight: 800, fontSize: 34, color: C.text, letterSpacing: -1.1, lineHeight: 1.13, margin: 0 }}>
            Gemeinsam gestalten<br/>wir HUI
          </h1>
        </div>

        <div style={{ animation: "hui-mb-in-up 0.6s 0.10s ease both", marginBottom: 28 }}>
          <p style={{ fontSize: 15.5, color: C.soft, lineHeight: 1.65, margin: 0 }}>
            Bitte lies unsere Bedingungen durch und stimm zu,
            um bewusst Teil der HUI-Gemeinschaft zu werden.
          </p>
        </div>

        {/* Dokumente */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 8,
          marginBottom: 22,
          animation: "hui-mb-in-up 0.6s 0.14s ease both",
        }}>
          <LegalRow label="AGBs (Allgemeine Geschäftsbedingungen)" />
          <LegalRow label="Datenschutzerklärung" />
          <LegalRow label="Community-Richtlinien" />
        </div>

        {/* Emotionale Checkbox — Apple Pay Level */}
        <button
          className="hui-mb-card-tap"
          onClick={() => setData(d => ({ ...d, agbAll: !d.agbAll }))}
          style={{
            width: "100%",
            padding: "18px 20px",
            borderRadius: 18,
            border: "none",
            background: agreed ? "rgba(22,215,197,0.08)" : "rgba(255,255,255,0.04)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            outline: agreed
              ? "1.5px solid rgba(22,215,197,0.28)"
              : "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "flex-start",
            gap: 15,
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "inherit",
            boxShadow: agreed
              ? "0 0 0 1px rgba(22,215,197,0.10), 0 6px 22px rgba(22,215,197,0.09), inset 0 1px 0 rgba(255,255,255,0.05)"
              : "0 1px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)",
            marginBottom: 24,
            transition: "all 0.25s ease",
            animation: "hui-mb-in-up 0.6s 0.18s ease both",
          }}>
          {/* Custom Checkbox */}
          <div style={{
            width: 25, height: 25,
            borderRadius: 8, flexShrink: 0,
            border: `2px solid ${agreed ? C.teal : "rgba(255,255,255,0.22)"}`,
            background: agreed ? C.teal : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginTop: 1,
            transition: "all 0.22s cubic-bezier(0.34,1.4,0.64,1)",
            boxShadow: agreed ? `0 0 14px rgba(22,215,197,0.45)` : "none",
          }}>
            {agreed && (
              <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                <path d="M1.5 4.5L4.5 7.5L10.5 1.5" stroke="#080C17"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <div>
            <div style={{
              fontWeight: 600, fontSize: 15,
              color: agreed ? C.text : C.soft,
              lineHeight: 1.4, marginBottom: 4,
              transition: "color 0.2s ease",
            }}>
              Ich stimme den Bedingungen zu
            </div>
            <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.45 }}>
              Mit deiner Zustimmung wirst du bewusst<br/>Teil der HUI-Gemeinschaft.
            </div>
          </div>
        </button>

        {/* CTA */}
        <div style={{ animation: "hui-mb-in-up 0.6s 0.22s ease both" }}>
          <Btn onClick={onNext} disabled={!agreed || loading}>
            {loading ? "Einen Moment …" : "Zustimmen & Mitglied werden"}
          </Btn>
        </div>

        {agreed && (
          <p style={{
            textAlign: "center",
            fontSize: 13,
            color: C.muted,
            marginTop: 14,
            lineHeight: 1.55,
            animation: "hui-mb-in-up 0.45s ease both",
          }}>
            Du wirst Teil von etwas Besonderem. 🌿
          </p>
        )}
      </div>
    </Screen>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// S8 — EMOTIONALES ANKOMMEN
// Stimmung: kosmischer Orb, Celebration, Zugehörigkeit, Finale
// Großer Orb-Reveal. Das Ziel der ganzen Journey.
// ══════════════════════════════════════════════════════════════════════════════
function S8({ onDone }) {
  const [ph, setPh] = useState(0);
  const refs = [useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    const t1 = setTimeout(() => setPh(1), 180);
    const t2 = setTimeout(() => setPh(2), 900);
    const t3 = setTimeout(() => setPh(3), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <Screen scroll={false}>
      {/* Full-bleed cosmic background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${IMG.s8})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          animation: "hui-mb-kenburns 30s ease-in-out both",
        }}/>
        {/* Multi-layer gradient for depth */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(8,12,23,0.30) 0%, rgba(8,12,23,0.45) 30%, rgba(8,12,23,0.65) 55%, rgba(8,12,23,0.92) 78%, rgba(8,12,23,1) 100%)",
        }}/>
      </div>

      {/* Content — absolute positioned at bottom */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        padding: "0 28px max(52px, env(safe-area-inset-bottom, 52px))",
        zIndex: 2,
        textAlign: "center",
      }}>
        {/* ORB REVEAL — das Herzstück */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 36,
          opacity: ph >= 1 ? 1 : 0,
          transform: ph >= 1 ? "scale(1) translateY(0)" : "scale(0.55) translateY(20px)",
          transition: "all 0.90s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}>
          <div style={{ position: "relative", display: "inline-flex" }}>
            {/* Outer glow ring — dreht sich */}
            <div style={{
              position: "absolute",
              top: -28, left: -28, right: -28, bottom: -28,
              borderRadius: "50%",
              border: "1px solid rgba(22,215,197,0.16)",
              animation: "hui-mb-orb-spin 28s linear infinite",
            }}/>
            {/* Middle ring — gegenläufig */}
            <div style={{
              position: "absolute",
              top: -16, left: -16, right: -16, bottom: -16,
              borderRadius: "50%",
              border: "1px solid rgba(255,138,107,0.12)",
              animation: "hui-mb-orb-spin-rev 20s linear infinite",
            }}/>
            {/* Ambient radial glow */}
            <div style={{
              position: "absolute",
              top: -50, left: -50, right: -50, bottom: -50,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(22,215,197,0.20) 0%, rgba(255,138,107,0.08) 45%, transparent 70%)",
              animation: "hui-mb-glow-breathe 4s ease-in-out infinite",
            }}/>
            <HuiLogo size={92} glow float />
          </div>
        </div>

        {/* Welcome headline */}
        <div style={{
          opacity: ph >= 1 ? 1 : 0,
          transform: ph >= 1 ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.70s ease 0.35s",
        }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🎉</div>
          <h1 style={{
            fontWeight: 800,
            fontSize: 30,
            color: C.text,
            letterSpacing: -0.8,
            lineHeight: 1.2,
            marginBottom: 14,
          }}>
            Willkommen in der<br/>HUI-Gemeinschaft!
          </h1>
          <p style={{
            fontSize: 16,
            color: C.soft,
            lineHeight: 1.7,
            marginBottom: 40,
          }}>
            Schön, dass du da bist.<br/>
            Gemeinsam schaffen wir etwas Besonderes.
          </p>
        </div>

        {/* Stats — erscheinen nach Delay */}
        <div style={{
          display: "flex",
          marginBottom: 40,
          opacity: ph >= 2 ? 1 : 0,
          transform: ph >= 2 ? "translateY(0)" : "translateY(14px)",
          transition: "all 0.60s ease",
        }}>
          {[["1.000+", "Kreative"], ["∞", "Möglichkeiten"], ["1", "Gemeinschaft"]].map(([n, l], i) => (
            <div key={i} style={{
              flex: 1,
              textAlign: "center",
              borderRight: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
            }}>
              <div style={{
                fontWeight: 800,
                fontSize: 22,
                color: C.teal,
                letterSpacing: -0.5,
                marginBottom: 3,
              }}>{n}</div>
              <div style={{
                fontSize: 12,
                color: C.muted,
                letterSpacing: 0.2,
              }}>{l}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          opacity: ph >= 3 ? 1 : 0,
          transform: ph >= 3 ? "translateY(0)" : "translateY(10px)",
          transition: "all 0.55s ease",
        }}>
          <Btn onClick={onDone}>Los geht's →</Btn>
        </div>

        {/* Shimmer accent line */}
        <div style={{
          width: 48, height: "1.5px",
          borderRadius: 999,
          margin: "18px auto 0",
          background: `linear-gradient(90deg, transparent, ${C.teal}, transparent)`,
          backgroundSize: "200% 100%",
          animation: "hui-mb-shimmer 2.2s ease infinite",
          opacity: ph >= 3 ? 0.6 : 0,
          transition: "opacity 0.6s ease 0.3s",
        }}/>
      </div>
    </Screen>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════════
export default function HuiMembershipFlow({ onComplete, onClose }) {
  const { activateMembership, refreshProfile, activateTalentProfile } = useAuth();

  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [data,    setData]    = useState({ focus: null, agbAll: false });

  const next = useCallback(() => setStep(s => Math.min(s + 1, 8)), []);

  const handleFinish = useCallback(async () => {
    if (!data.agbAll || loading) return;
    setLoading(true);
    try {
      await activateMembership?.();
      if (data.focus && activateTalentProfile) {
        activateTalentProfile(data.focus).catch(() => {});
      }
      refreshProfile?.().catch(() => {});
    } catch (e) {
      // silent — screen 8 trotzdem zeigen
    } finally {
      setLoading(false);
    }
    setStep(8);
  }, [data, loading, activateMembership, activateTalentProfile, refreshProfile]);

  return (
    <div style={{
      position: "fixed", inset: 0,
      zIndex: 9800,
      background: C.bg,
      overflow: "hidden",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    }}>
      <style>{CSS}</style>

      {/* Preload alle Bilder silent */}
      <div style={{ display: "none" }} aria-hidden="true">
        {Object.values(IMG).map((src, i) => (
          <img key={i} src={src} alt="" loading="eager" />
        ))}
      </div>

      {/* Screen Router */}
      {step === 1 && <S1 onNext={next} data={data} setData={setData} />}
      {step === 2 && <S2 onNext={next} />}
      {step === 3 && <S3 onNext={next} />}
      {step === 4 && <S4 onNext={next} />}
      {step === 5 && <S5 onNext={next} />}
      {step === 6 && <S6 onNext={next} />}
      {step === 7 && <S7 onNext={handleFinish} data={data} setData={setData} loading={loading} />}
      {step === 8 && <S8 onDone={() => onComplete?.()} />}

      {/* Close — nur auf Screens 1–6 */}
      {step <= 6 && <CloseBtn onClose={onClose} />}

      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 50,
          background: "rgba(8,12,23,0.80)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            border: "2.5px solid rgba(255,255,255,0.08)",
            borderTopColor: C.teal,
            animation: "hui-mb-orb-spin 0.75s linear infinite",
          }}/>
        </div>
      )}
    </div>
  );
}
