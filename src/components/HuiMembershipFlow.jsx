/**
 * HuiMembershipFlow v2 — Premium Cinematic Membership Journey
 *
 * ZWECK: Emotionale Aufnahme in die HUI-Gemeinschaft.
 * TRIGGER: Basis-User tippt HUI-Button (Orb).
 * RESULT: is_member=true → Orb dauerhaft aktiv.
 *
 * Design-Prinzip: Apple Keynote trifft Headspace.
 * Jeder Screen = ein eigenes Kapitel mit eigener Bildwelt.
 * Keine BottomNav. Fullscreen Immersion.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../lib/AuthContext";

// ─── Bild-URLs (eigens generiert, cinematisch, 9:16) ──────────────────────────
const IMGS = {
  focus:      "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/a0811ba71_generated_image.png",
  talent:     "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/8ce1c2182_generated_image.png",
  community:  "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/6682c9b3a_generated_image.png",
  impact:     "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/55d0f1ed2_generated_image.png",
  values:     "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/95bad1eb8_generated_image.png",
  safety:     "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/6ffd64022_generated_image.png",
  consent:    "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/946a78b65_generated_image.png",
  welcome:    "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/3910718a7_generated_image.png",
};

// ─── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
  * { -webkit-font-smoothing: antialiased; }

  @keyframes hmf-fade-up {
    from { opacity:0; transform:translateY(24px); }
    to   { opacity:1; transform:translateY(0);    }
  }
  @keyframes hmf-fade-in {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes hmf-scale-up {
    from { opacity:0; transform:scale(0.88); }
    to   { opacity:1; transform:scale(1);    }
  }
  @keyframes hmf-ken {
    from { transform:scale(1.0); }
    to   { transform:scale(1.06); }
  }
  @keyframes hmf-orb-pulse {
    0%,100% { opacity:0.6; transform:scale(1);    }
    50%     { opacity:1.0; transform:scale(1.08); }
  }
  @keyframes hmf-orb-spin {
    from { transform:rotate(0deg); }
    to   { transform:rotate(360deg); }
  }
  @keyframes hmf-dot-pulse {
    0%,100% { opacity:0.3; transform:scale(1);   }
    50%     { opacity:1.0; transform:scale(1.5); }
  }
  @keyframes hmf-shimmer {
    0%   { background-position:-300% 0; }
    100% { background-position: 300% 0; }
  }
  @keyframes hmf-float {
    0%,100% { transform:translateY(0px);  }
    50%     { transform:translateY(-8px); }
  }
  @keyframes hmf-progress-glow {
    0%,100% { opacity:0.7; }
    50%     { opacity:1.0; }
  }

  .hmf-screen { animation: hmf-fade-in 0.55s cubic-bezier(0.22,1,0.36,1) both; }
  .hmf-content-up { animation: hmf-fade-up 0.65s cubic-bezier(0.22,1,0.36,1) both; }

  .hmf-select-card {
    transition: transform 0.18s ease, box-shadow 0.2s ease, background 0.2s ease;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .hmf-select-card:active { transform: scale(0.97); }

  .hmf-btn-primary {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition: transform 0.12s ease, box-shadow 0.15s ease;
  }
  .hmf-btn-primary:active { transform: scale(0.97); }

  .hmf-legal-row {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition: background 0.15s ease;
  }
  .hmf-legal-row:active { background: rgba(255,255,255,0.10) !important; }

  .hmf-checkbox-row {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition: all 0.25s ease;
  }
`;

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  teal:    "#16D7C5",
  tealDim: "rgba(22,215,197,0.12)",
  coral:   "#FF8A6B",
  gold:    "#F5A623",
  white:   "#FFFFFF",
  off:     "rgba(255,255,255,0.90)",
  soft:    "rgba(255,255,255,0.72)",
  muted:   "rgba(255,255,255,0.50)",
  dim:     "rgba(255,255,255,0.25)",
  bg:      "#070B15",
  glass:   "rgba(255,255,255,0.07)",
  glassHi: "rgba(255,255,255,0.11)",
  border:  "rgba(255,255,255,0.10)",
  borderHi:"rgba(255,255,255,0.18)",
};

// ─── HUI Logo — exakt nach Original-Brand ─────────────────────────────────────
// Das Logo wird als img aus /hui-logo.jpg geladen.
// Kein SVG-Nachbau. Das echte Brand-Asset.
function HuiLogo({ size = 56, glow = false, float = false }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: size * 0.22,
      overflow: "hidden",
      flexShrink: 0,
      position: "relative",
      boxShadow: glow
        ? `0 0 ${size * 0.8}px rgba(22,215,197,0.55), 0 0 ${size * 1.6}px rgba(22,215,197,0.20), 0 0 ${size * 2.4}px rgba(255,138,107,0.12)`
        : `0 4px 24px rgba(22,215,197,0.28), 0 2px 8px rgba(0,0,0,0.3)`,
      animation: float ? "hmf-float 4s ease-in-out infinite" : "none",
    }}>
      <img
        src="/hui-logo.jpg"
        alt="HUI"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}

// ─── Premium Progress Bar ─────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  return (
    <div style={{
      display: "flex", gap: 5, width: "100%", alignItems: "center",
    }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 2, borderRadius: 999, overflow: "hidden",
          background: "rgba(255,255,255,0.12)",
        }}>
          <div style={{
            height: "100%",
            width: i < current ? "100%" : "0%",
            background: i < current
              ? `linear-gradient(90deg, ${T.teal} 0%, ${T.coral} 100%)`
              : "transparent",
            boxShadow: i < current ? `0 0 6px rgba(22,215,197,0.6)` : "none",
            transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
            animation: i === current - 1 ? "hmf-progress-glow 2s ease-in-out infinite" : "none",
          }}/>
        </div>
      ))}
    </div>
  );
}

// ─── Step Counter ─────────────────────────────────────────────────────────────
function StepCounter({ step, total, label, color = T.teal }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
    }}>
      <span style={{
        fontSize: 11, fontWeight: 700, color,
        letterSpacing: "0.12em", textTransform: "uppercase",
        opacity: 0.9,
      }}>{label}</span>
      <span style={{ marginLeft: "auto", fontSize: 11, color: T.muted, fontWeight: 500 }}>
        {step}/{total}
      </span>
    </div>
  );
}

// ─── Full Hero Image (Ken Burns) ──────────────────────────────────────────────
function HeroImg({ src, gradient, height = "58%", animKey }) {
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0,
      height, overflow: "hidden",
    }}>
      <div key={animKey} style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        animation: "hmf-ken 16s ease-in-out both",
      }}/>
      {/* Gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: gradient,
      }}/>
    </div>
  );
}

// ─── Primary Button ───────────────────────────────────────────────────────────
function PrimaryBtn({ onClick, disabled = false, children, color = "teal" }) {
  const bg = color === "coral"
    ? `linear-gradient(135deg, ${T.coral} 0%, #FF6A4A 100%)`
    : `linear-gradient(135deg, ${T.teal} 0%, #0DBFB5 100%)`;
  const shadow = color === "coral"
    ? "0 12px 36px rgba(255,138,107,0.42), 0 4px 12px rgba(0,0,0,0.2)"
    : "0 12px 36px rgba(22,215,197,0.40), 0 4px 12px rgba(0,0,0,0.2)";

  return (
    <button
      className="hmf-btn-primary"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", padding: "19px 28px",
        borderRadius: 18, border: "none",
        background: disabled ? "rgba(255,255,255,0.10)" : bg,
        color: disabled ? T.muted : T.bg,
        fontFamily: "inherit",
        fontSize: 16, fontWeight: 700, letterSpacing: -0.2,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        opacity: disabled ? 0.5 : 1,
        boxShadow: disabled ? "none" : shadow,
      }}>
      {children}
    </button>
  );
}

// ─── Selection Card (Screen 1) ────────────────────────────────────────────────
function SelectCard({ icon, title, subtitle, selected, onClick }) {
  return (
    <button
      className="hmf-select-card"
      onClick={onClick}
      style={{
        width: "100%", padding: "18px 18px",
        borderRadius: 20, border: "none",
        background: selected
          ? "rgba(22,215,197,0.11)"
          : "rgba(255,255,255,0.055)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        outline: selected
          ? `1.5px solid ${T.teal}`
          : `1px solid rgba(255,255,255,0.09)`,
        cursor: "pointer", textAlign: "left",
        display: "flex", alignItems: "center", gap: 16,
        boxShadow: selected
          ? `0 0 0 1px rgba(22,215,197,0.2), 0 8px 32px rgba(22,215,197,0.12), inset 0 1px 0 rgba(255,255,255,0.08)`
          : `0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)`,
        fontFamily: "inherit",
      }}>
      {/* Icon bubble */}
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: selected
          ? "rgba(22,215,197,0.18)"
          : "rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22,
        transition: "background 0.2s ease",
      }}>{icon}</div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontWeight: 700, fontSize: 15.5, color: T.white,
          marginBottom: 4, letterSpacing: -0.2,
        }}>{title}</div>
        <div style={{
          fontSize: 12.5, color: T.muted, lineHeight: 1.45,
        }}>{subtitle}</div>
      </div>

      {/* Radio */}
      <div style={{
        width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${selected ? T.teal : "rgba(255,255,255,0.22)"}`,
        background: selected ? T.teal : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.22s ease",
        boxShadow: selected ? `0 0 10px rgba(22,215,197,0.5)` : "none",
      }}>
        {selected && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1 4.5L4 7.5L10 1.5" stroke={T.bg} strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </button>
  );
}

// ─── Feature Row ──────────────────────────────────────────────────────────────
function FeatureRow({ icon, iconBg = T.tealDim, iconBorder = "rgba(22,215,197,0.2)",
  title, subtitle, delay = 0 }) {
  const [v, setV] = useState(false);
  const t = useRef(null);
  useEffect(() => {
    t.current = setTimeout(() => setV(true), delay);
    return () => clearTimeout(t.current);
  }, [delay]);

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 16,
      opacity: v ? 1 : 0,
      transform: v ? "translateY(0)" : "translateY(18px)",
      transition: "opacity 0.55s ease, transform 0.55s ease",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14, flexShrink: 0,
        background: iconBg, border: `1px solid ${iconBorder}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20,
      }}>{icon}</div>
      <div style={{ paddingTop: 3 }}>
        {title && (
          <div style={{
            fontWeight: 700, fontSize: 15.5, color: T.white,
            marginBottom: 4, letterSpacing: -0.2,
          }}>{title}</div>
        )}
        <div style={{
          fontSize: 14, color: T.soft, lineHeight: 1.6,
        }}>{subtitle}</div>
      </div>
    </div>
  );
}

// ─── Legal Row ────────────────────────────────────────────────────────────────
function LegalRow({ label, onPress }) {
  return (
    <button
      className="hmf-legal-row"
      onClick={onPress}
      style={{
        width: "100%", padding: "17px 20px",
        borderRadius: 16, border: "none",
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        outline: `1px solid rgba(255,255,255,0.09)`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        cursor: "pointer", fontFamily: "inherit",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}>
      <span style={{ fontSize: 15, color: T.off, fontWeight: 500 }}>{label}</span>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 4L10 8L6 12" stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

// ─── Close Button ─────────────────────────────────────────────────────────────
function CloseBtn({ onClose }) {
  return (
    <button onClick={onClose} style={{
      position: "absolute",
      top: "max(18px, env(safe-area-inset-top, 18px))",
      right: 20, zIndex: 20,
      width: 38, height: 38, borderRadius: "50%",
      background: "rgba(255,255,255,0.09)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.12)",
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer",
      color: "rgba(255,255,255,0.55)",
      fontSize: 16, fontFamily: "inherit",
      WebkitTapHighlightColor: "transparent",
      touchAction: "manipulation",
    }}>✕</button>
  );
}

// ─── Screen Shell ─────────────────────────────────────────────────────────────
function Screen({ children, scrollable = true }) {
  return (
    <div className="hmf-screen" style={{
      position: "absolute", inset: 0,
      overflowY: scrollable ? "auto" : "hidden",
      overflowX: "hidden",
      WebkitOverflowScrolling: "touch",
    }}>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 1 — Dein Fokus
// Stimmung: ruhig, kreativ, organisch / teal+gold / Hände mit Licht
// ══════════════════════════════════════════════════════════════════════════════
function S1({ onNext, data, setData }) {
  const CHOICES = [
    {
      key: "works",
      icon: "🎨",
      title: "Ich bringe Werke in die Welt",
      subtitle: "Gemälde, Musik, Fotos, Objekte …",
    },
    {
      key: "experiences",
      icon: "✨",
      title: "Ich begleite Menschen",
      subtitle: "Kurse, Events, Sessions, Reisen …",
    },
    {
      key: "hybrid",
      icon: "🌿",
      title: "Ich tue beides",
      subtitle: "Werke schaffen und Menschen verbinden",
    },
  ];

  return (
    <Screen>
      {/* Hero */}
      <HeroImg
        src={IMGS.focus}
        height="56%"
        gradient="linear-gradient(to bottom, rgba(7,11,21,0.1) 0%, rgba(7,11,21,0.35) 45%, rgba(7,11,21,0.85) 72%, rgba(7,11,21,1) 100%)"
        animKey="focus"
      />

      {/* Content — über dem Bild */}
      <div style={{
        position: "relative", zIndex: 2,
        marginTop: "calc(56% - 80px)",
        padding: "0 24px max(40px, env(safe-area-inset-bottom, 40px))",
      }}>
        {/* Pill Label */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(22,215,197,0.14)",
          border: "1px solid rgba(22,215,197,0.3)",
          borderRadius: 20, padding: "5px 14px",
          marginBottom: 16,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.teal }}/>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.teal,
            letterSpacing: "0.10em", textTransform: "uppercase" }}>Dein Fokus</span>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 6 }}>
          <StepCounter step={1} total={7} label="" />
          <ProgressBar current={1} total={7} />
        </div>

        {/* Headline */}
        <h1 className="hmf-content-up" style={{
          fontWeight: 900, fontSize: 34, color: T.white,
          letterSpacing: -1.2, lineHeight: 1.1,
          marginTop: 24, marginBottom: 10,
        }}>
          Was beschreibt<br/>dich mehr?
        </h1>
        <p style={{
          fontSize: 15, color: T.soft, lineHeight: 1.65,
          marginBottom: 28,
          animationDelay: "0.08s",
        }} className="hmf-content-up">
          Wähle deinen Weg — du kannst ihn später anpassen.
        </p>

        {/* Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {CHOICES.map((c, i) => (
            <div key={c.key} className="hmf-content-up"
              style={{ animationDelay: `${0.12 + i * 0.07}s` }}>
              <SelectCard
                icon={c.icon} title={c.title} subtitle={c.subtitle}
                selected={data.focus === c.key}
                onClick={() => setData(d => ({ ...d, focus: c.key }))}
              />
            </div>
          ))}
        </div>

        <div className="hmf-content-up" style={{ animationDelay: "0.35s" }}>
          <PrimaryBtn onClick={onNext} disabled={!data.focus}>
            Weiter →
          </PrimaryBtn>
        </div>
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 2 — Dein Talent
// Stimmung: warme Atelier-Stimmung, Künstlerin, Gold+Amber
// ══════════════════════════════════════════════════════════════════════════════
function S2({ onNext }) {
  return (
    <Screen>
      <HeroImg
        src={IMGS.talent}
        height="60%"
        gradient="linear-gradient(to bottom, rgba(7,11,21,0.05) 0%, rgba(7,11,21,0.3) 40%, rgba(7,11,21,0.88) 70%, rgba(7,11,21,1) 100%)"
        animKey="talent"
      />

      <div style={{
        position: "relative", zIndex: 2,
        marginTop: "calc(60% - 80px)",
        padding: "0 24px max(40px, env(safe-area-inset-bottom, 40px))",
      }}>
        {/* Pill */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(245,166,35,0.14)",
          border: "1px solid rgba(245,166,35,0.3)",
          borderRadius: 20, padding: "5px 14px", marginBottom: 16,
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold }}/>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.gold,
            letterSpacing: "0.10em", textTransform: "uppercase" }}>Dein Talent</span>
        </div>

        <div style={{ marginBottom: 6 }}>
          <StepCounter step={2} total={7} label="" color={T.gold} />
          <ProgressBar current={2} total={7} />
        </div>

        <h1 className="hmf-content-up" style={{
          fontWeight: 900, fontSize: 34, color: T.white,
          letterSpacing: -1.2, lineHeight: 1.1,
          marginTop: 24, marginBottom: 12,
        }}>
          Zeige, was<br/>in dir steckt
        </h1>
        <p className="hmf-content-up" style={{
          fontSize: 15, color: T.soft, lineHeight: 1.65, marginBottom: 36,
          animationDelay: "0.08s",
        }}>
          Teile Werke, Ideen, Erlebnisse und Momente.<br/>
          Dein Talent verdient eine Bühne.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 40 }}>
          <FeatureRow icon="🎭"
            iconBg="rgba(245,166,35,0.10)" iconBorder="rgba(245,166,35,0.20)"
            subtitle="Werke & Kreationen teilen" delay={80} />
          <FeatureRow icon="💫"
            iconBg="rgba(245,166,35,0.08)" iconBorder="rgba(245,166,35,0.16)"
            subtitle="Deine eigene kreative Bühne" delay={180} />
          <FeatureRow icon="🤝"
            iconBg="rgba(245,166,35,0.08)" iconBorder="rgba(245,166,35,0.16)"
            subtitle="Mit echten Menschen in Kontakt" delay={280} />
        </div>

        <PrimaryBtn onClick={onNext}>Weiter →</PrimaryBtn>
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 3 — Gemeinschaft
// Stimmung: echte Menschen, Wärme, Nähe, Zusammengehörigkeit
// ══════════════════════════════════════════════════════════════════════════════
function S3({ onNext }) {
  return (
    <Screen>
      <HeroImg
        src={IMGS.community}
        height="58%"
        gradient="linear-gradient(to bottom, rgba(7,11,21,0.08) 0%, rgba(7,11,21,0.32) 42%, rgba(7,11,21,0.88) 70%, rgba(7,11,21,1) 100%)"
        animKey="community"
      />

      <div style={{
        position: "relative", zIndex: 2,
        marginTop: "calc(58% - 80px)",
        padding: "0 24px max(40px, env(safe-area-inset-bottom, 40px))",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(22,215,197,0.12)",
          border: "1px solid rgba(22,215,197,0.28)",
          borderRadius: 20, padding: "5px 14px", marginBottom: 16,
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.teal }}/>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.teal,
            letterSpacing: "0.10em", textTransform: "uppercase" }}>Gemeinschaft</span>
        </div>

        <div style={{ marginBottom: 6 }}>
          <StepCounter step={3} total={7} label="" />
          <ProgressBar current={3} total={7} />
        </div>

        <h1 className="hmf-content-up" style={{
          fontWeight: 900, fontSize: 34, color: T.white,
          letterSpacing: -1.2, lineHeight: 1.1,
          marginTop: 24, marginBottom: 12,
        }}>
          Willkommen<br/>bei HUI
        </h1>
        <p className="hmf-content-up" style={{
          fontSize: 15, color: T.soft, lineHeight: 1.65, marginBottom: 30,
          animationDelay: "0.08s",
        }}>
          Eine Gemeinschaft für Menschen, Talente und echte
          Herzensprojekte. Hier zählt, wer du bist.
        </p>

        {/* Community Fact Cards */}
        <div className="hmf-content-up" style={{
          display: "flex", flexDirection: "column", gap: 1,
          marginBottom: 36, animationDelay: "0.14s",
          borderRadius: 20, overflow: "hidden",
          border: "1px solid rgba(22,215,197,0.10)",
          background: "rgba(22,215,197,0.04)",
        }}>
          {[
            ["🌱", "Echte Menschen, echte Begegnungen"],
            ["💡", "Kreativität ohne Wettbewerb"],
            ["🌍", "Gemeinsam etwas bewegen"],
          ].map(([e, t], i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "16px 18px",
              background: i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
              borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none",
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{e}</span>
              <span style={{ fontSize: 15, color: T.off, fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>

        <PrimaryBtn onClick={onNext}>Weiter →</PrimaryBtn>
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 4 — Deine Wirkung
// Stimmung: episch, Sonnenaufgang, Hoffnung, Energie, Orange+Coral
// ══════════════════════════════════════════════════════════════════════════════
function S4({ onNext }) {
  return (
    <Screen>
      <HeroImg
        src={IMGS.impact}
        height="60%"
        gradient="linear-gradient(to bottom, rgba(7,11,21,0.05) 0%, rgba(7,11,21,0.2) 35%, rgba(7,11,21,0.82) 65%, rgba(7,11,21,1) 100%)"
        animKey="impact"
      />

      <div style={{
        position: "relative", zIndex: 2,
        marginTop: "calc(60% - 80px)",
        padding: "0 24px max(40px, env(safe-area-inset-bottom, 40px))",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(255,138,107,0.13)",
          border: "1px solid rgba(255,138,107,0.28)",
          borderRadius: 20, padding: "5px 14px", marginBottom: 16,
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.coral }}/>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.coral,
            letterSpacing: "0.10em", textTransform: "uppercase" }}>Deine Wirkung</span>
        </div>

        <div style={{ marginBottom: 6 }}>
          <StepCounter step={4} total={7} label="" color={T.coral} />
          <ProgressBar current={4} total={7} />
        </div>

        <h1 className="hmf-content-up" style={{
          fontWeight: 900, fontSize: 32, color: T.white,
          letterSpacing: -1.0, lineHeight: 1.15,
          marginTop: 24, marginBottom: 28,
        }}>
          Bereit, deine Wirkung<br/>zu entfalten?
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginBottom: 40 }}>
          <FeatureRow icon="🌿"
            iconBg="rgba(78,205,196,0.12)" iconBorder="rgba(78,205,196,0.22)"
            subtitle="Teile dein Talent mit der Welt" delay={60} />
          <FeatureRow icon="❤️"
            iconBg="rgba(255,107,107,0.12)" iconBorder="rgba(255,107,107,0.22)"
            subtitle="Verbinde dich mit echten Menschen" delay={160} />
          <FeatureRow icon="✦"
            iconBg="rgba(245,166,35,0.12)" iconBorder="rgba(245,166,35,0.22)"
            subtitle="Bewirke gemeinsam Großes" delay={260} />
        </div>

        <PrimaryBtn onClick={onNext} color="coral">Los geht's →</PrimaryBtn>
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 5 — Unsere Werte
// Stimmung: dunkel, Teal-Partikel, meditativ, elegant
// ══════════════════════════════════════════════════════════════════════════════
function S5({ onNext }) {
  return (
    <Screen>
      {/* Vollbild-Hintergrundbild */}
      <div style={{ position: "absolute", inset: 0 }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${IMGS.values})`,
          backgroundSize: "cover", backgroundPosition: "center",
          animation: "hmf-ken 20s ease-in-out both",
          opacity: 0.5,
        }}/>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(7,11,21,0.65) 0%, rgba(7,11,21,0.82) 50%, rgba(7,11,21,0.96) 100%)",
        }}/>
      </div>

      <div style={{
        position: "relative", zIndex: 2,
        padding: "max(56px, env(safe-area-inset-top, 56px)) 24px max(40px, env(safe-area-inset-bottom, 40px))",
      }}>
        <div style={{ marginBottom: 6 }}>
          <StepCounter step={5} total={7} label="Unsere Werte" />
          <ProgressBar current={5} total={7} />
        </div>

        <h1 className="hmf-content-up" style={{
          fontWeight: 900, fontSize: 38, color: T.white,
          letterSpacing: -1.4, lineHeight: 1.08,
          marginTop: 28, marginBottom: 10,
        }}>
          Wofür wir<br/>stehen
        </h1>
        <p className="hmf-content-up" style={{
          fontSize: 15, color: T.soft, lineHeight: 1.65,
          marginBottom: 40, animationDelay: "0.08s",
        }}>
          Diese Werte tragen uns gemeinsam.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 26, marginBottom: 48 }}>
          <FeatureRow icon="🤍" iconBg="rgba(255,255,255,0.07)" iconBorder="rgba(255,255,255,0.12)"
            title="Echtheit" subtitle="Sei du selbst. Immer." delay={80} />
          <FeatureRow icon="🤝" iconBg="rgba(255,255,255,0.07)" iconBorder="rgba(255,255,255,0.12)"
            title="Respekt" subtitle="Wir begegnen uns auf Augenhöhe." delay={200} />
          <FeatureRow icon="🌱" iconBg="rgba(255,255,255,0.07)" iconBorder="rgba(255,255,255,0.12)"
            title="Wachstum" subtitle="Wir inspirieren und entwickeln uns." delay={320} />
          <FeatureRow icon="🎯" iconBg="rgba(255,255,255,0.07)" iconBorder="rgba(255,255,255,0.12)"
            title="Wirkung" subtitle="Wir schaffen echten Mehrwert." delay={440} />
        </div>

        {/* Thin teal divider line */}
        <div style={{
          height: 1, marginBottom: 36,
          background: "linear-gradient(90deg, transparent, rgba(22,215,197,0.35), transparent)",
        }}/>

        <PrimaryBtn onClick={onNext}>Weiter →</PrimaryBtn>
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 6 — Fairness & Sicherheit
// Stimmung: minimalistisch, sauber, Vertrauen, Clean White Light
// ══════════════════════════════════════════════════════════════════════════════
function S6({ onNext }) {
  return (
    <Screen>
      {/* Hintergrundbild dezent */}
      <div style={{ position: "absolute", inset: 0 }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${IMGS.safety})`,
          backgroundSize: "cover", backgroundPosition: "center top",
          opacity: 0.35,
          animation: "hmf-ken 20s ease-in-out both",
        }}/>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(7,11,21,0.55) 0%, rgba(7,11,21,0.80) 40%, rgba(7,11,21,0.97) 80%)",
        }}/>
      </div>

      <div style={{
        position: "relative", zIndex: 2,
        padding: "max(56px, env(safe-area-inset-top, 56px)) 24px max(40px, env(safe-area-inset-bottom, 40px))",
      }}>
        <div style={{ marginBottom: 6 }}>
          <StepCounter step={6} total={7} label="Fairness & Sicherheit" />
          <ProgressBar current={6} total={7} />
        </div>

        <h1 className="hmf-content-up" style={{
          fontWeight: 900, fontSize: 36, color: T.white,
          letterSpacing: -1.2, lineHeight: 1.1,
          marginTop: 28, marginBottom: 12,
        }}>
          Ein sicherer Raum<br/>für alle
        </h1>
        <p className="hmf-content-up" style={{
          fontSize: 15, color: T.soft, lineHeight: 1.65,
          marginBottom: 40, animationDelay: "0.08s",
        }}>
          HUI ist ein Ort des Vertrauens.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 40 }}>
          <FeatureRow icon="🛡️"
            iconBg="rgba(22,215,197,0.08)" iconBorder="rgba(22,215,197,0.16)"
            subtitle="Wir schützen deine Daten und deine Privatsphäre." delay={80} />
          <FeatureRow icon="🔒"
            iconBg="rgba(22,215,197,0.08)" iconBorder="rgba(22,215,197,0.16)"
            subtitle="Wir dulden keine Diskriminierung, Hass oder Belästigung." delay={200} />
          <FeatureRow icon="⚙️"
            iconBg="rgba(22,215,197,0.08)" iconBorder="rgba(22,215,197,0.16)"
            subtitle="Du hast die Kontrolle über deine Inhalte und Sichtbarkeit." delay={320} />
        </div>

        {/* Trust Badge */}
        <div className="hmf-content-up" style={{
          background: "rgba(22,215,197,0.06)",
          border: "1px solid rgba(22,215,197,0.14)",
          borderRadius: 18, padding: "18px 20px",
          display: "flex", alignItems: "center", gap: 14, marginBottom: 36,
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          animationDelay: "0.4s",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: "rgba(22,215,197,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20,
          }}>✦</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.teal, marginBottom: 3 }}>
              Community-Versprechen
            </div>
            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
              Wir bauen HUI gemeinsam auf Vertrauen und Respekt.
            </div>
          </div>
        </div>

        <PrimaryBtn onClick={onNext}>Weiter →</PrimaryBtn>
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 7 — Deine Zustimmung (AGB)
// Stimmung: hochwertig, seriös, Apple Pay Consent Level
// ══════════════════════════════════════════════════════════════════════════════
function S7({ onNext, data, setData, loading }) {
  const agreed = data.agbAll;

  return (
    <Screen>
      {/* Hintergrundbild — goldener Kreis/Ring */}
      <div style={{ position: "absolute", inset: 0 }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${IMGS.consent})`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.3,
          animation: "hmf-ken 22s ease-in-out both",
        }}/>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(7,11,21,0.6) 0%, rgba(7,11,21,0.82) 40%, rgba(7,11,21,0.98) 75%)",
        }}/>
      </div>

      <div style={{
        position: "relative", zIndex: 2,
        padding: "max(56px, env(safe-area-inset-top, 56px)) 24px max(40px, env(safe-area-inset-bottom, 40px))",
      }}>
        {/* Kleines Logo oben */}
        <div style={{ marginBottom: 24 }}>
          <HuiLogo size={40} />
        </div>

        <div style={{ marginBottom: 6 }}>
          <StepCounter step={7} total={7} label="Deine Zustimmung" />
          <ProgressBar current={7} total={7} />
        </div>

        <h1 className="hmf-content-up" style={{
          fontWeight: 900, fontSize: 32, color: T.white,
          letterSpacing: -1.0, lineHeight: 1.15,
          marginTop: 28, marginBottom: 10,
        }}>
          Gemeinsam gestalten<br/>wir HUI
        </h1>
        <p className="hmf-content-up" style={{
          fontSize: 15, color: T.soft, lineHeight: 1.65,
          marginBottom: 28, animationDelay: "0.08s",
        }}>
          Bitte lies unsere Bedingungen sorgfältig durch und stimm zu,
          um Teil der HUI-Gemeinschaft zu werden.
        </p>

        {/* Dokumente */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          <LegalRow label="AGBs (Allgemeine Geschäftsbedingungen)" onPress={() => {}} />
          <LegalRow label="Datenschutzerklärung" onPress={() => {}} />
          <LegalRow label="Community-Richtlinien" onPress={() => {}} />
        </div>

        {/* Emotionale Checkbox — Apple Pay Consent Level */}
        <button
          className="hmf-checkbox-row"
          onClick={() => setData(d => ({ ...d, agbAll: !d.agbAll }))}
          style={{
            width: "100%", padding: "18px 20px",
            borderRadius: 18, border: "none",
            background: agreed ? "rgba(22,215,197,0.09)" : "rgba(255,255,255,0.045)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            outline: agreed
              ? `1.5px solid rgba(22,215,197,0.35)`
              : `1px solid rgba(255,255,255,0.09)`,
            display: "flex", alignItems: "flex-start", gap: 16,
            cursor: "pointer", textAlign: "left", fontFamily: "inherit",
            boxShadow: agreed
              ? `0 0 0 1px rgba(22,215,197,0.15), 0 8px 28px rgba(22,215,197,0.10), inset 0 1px 0 rgba(255,255,255,0.06)`
              : `0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)`,
            marginBottom: 28,
          }}>
          {/* Custom Checkbox */}
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            border: `2px solid ${agreed ? T.teal : "rgba(255,255,255,0.26)"}`,
            background: agreed ? T.teal : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginTop: 1,
            transition: "all 0.22s ease",
            boxShadow: agreed ? `0 0 12px rgba(22,215,197,0.5)` : "none",
          }}>
            {agreed && (
              <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                <path d="M1.5 5L5 8.5L11.5 1.5" stroke={T.bg}
                  strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span style={{
            fontSize: 15, fontWeight: 500, lineHeight: 1.55,
            color: agreed ? T.off : T.soft,
            transition: "color 0.2s ease",
          }}>
            Ich habe die Bedingungen gelesen und stimme zu.
          </span>
        </button>

        {/* Haupt-CTA */}
        <PrimaryBtn onClick={onNext} disabled={!agreed || loading}>
          {loading ? "Einen Moment …" : "Zustimmen & Mitglied werden"}
        </PrimaryBtn>

        {agreed && (
          <p style={{
            textAlign: "center", fontSize: 12.5, color: T.muted,
            marginTop: 14, lineHeight: 1.55,
            animation: "hmf-fade-up 0.4s ease both",
          }}>
            Du wirst Teil einer besonderen Gemeinschaft. 🌿
          </p>
        )}
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 8 — Willkommen in der HUI-Gemeinschaft
// Stimmung: großer emotionaler Finale / Orb-Reveal / Celebration
// ══════════════════════════════════════════════════════════════════════════════
function S8({ onDone }) {
  const [ph, setPh] = useState(0);
  const t1 = useRef(null);
  const t2 = useRef(null);

  useEffect(() => {
    t1.current = setTimeout(() => setPh(1), 200);
    t2.current = setTimeout(() => setPh(2), 900);
    return () => { clearTimeout(t1.current); clearTimeout(t2.current); };
  }, []);

  return (
    <Screen scrollable={false}>
      {/* Vollbild Welcome-Bild — Orb im Kosmos */}
      <div style={{ position: "absolute", inset: 0 }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${IMGS.welcome})`,
          backgroundSize: "cover", backgroundPosition: "center",
          animation: "hmf-ken 20s ease-in-out both",
        }}/>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(7,11,21,0.25) 0%, rgba(7,11,21,0.55) 40%, rgba(7,11,21,0.88) 70%, rgba(7,11,21,1) 100%)",
        }}/>
      </div>

      {/* Content */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "0 28px max(52px, env(safe-area-inset-bottom, 52px))",
        textAlign: "center",
        zIndex: 2,
      }}>
        {/* HUI Logo — zentrales Orb-Reveal */}
        <div style={{
          display: "flex", justifyContent: "center",
          marginBottom: 32,
          opacity: ph >= 1 ? 1 : 0,
          transform: ph >= 1 ? "scale(1)" : "scale(0.6)",
          transition: "all 0.85s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}>
          <div style={{ position: "relative" }}>
            {/* Äußerer Glow-Ring — dreht sich */}
            <div style={{
              position: "absolute",
              top: -24, left: -24, right: -24, bottom: -24,
              borderRadius: "50%",
              border: "1px solid rgba(22,215,197,0.18)",
              animation: "hmf-orb-spin 24s linear infinite",
            }}/>
            {/* Mittlerer Glow-Ring */}
            <div style={{
              position: "absolute",
              top: -14, left: -14, right: -14, bottom: -14,
              borderRadius: "50%",
              border: "1px solid rgba(255,138,107,0.14)",
              animation: "hmf-orb-spin 18s linear infinite reverse",
            }}/>
            {/* Radiales Glow */}
            <div style={{
              position: "absolute",
              top: -40, left: -40, right: -40, bottom: -40,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(22,215,197,0.22) 0%, rgba(255,138,107,0.10) 50%, transparent 72%)",
              animation: "hmf-orb-pulse 3.5s ease-in-out infinite",
            }}/>
            <HuiLogo size={88} glow float />
          </div>
        </div>

        {/* Welcome Text */}
        <div style={{
          opacity: ph >= 1 ? 1 : 0,
          transform: ph >= 1 ? "translateY(0)" : "translateY(24px)",
          transition: "all 0.7s ease 0.35s",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
          <h1 style={{
            fontWeight: 900, fontSize: 30, color: T.white,
            letterSpacing: -0.8, lineHeight: 1.2, marginBottom: 16,
          }}>
            Willkommen in der<br/>HUI-Gemeinschaft!
          </h1>
          <p style={{
            fontSize: 16, color: T.soft, lineHeight: 1.7,
            marginBottom: 44,
          }}>
            Schön, dass du da bist.<br/>
            Gemeinsam schaffen wir etwas Besonderes.
          </p>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex", gap: 0, justifyContent: "center",
          marginBottom: 44,
          opacity: ph >= 2 ? 1 : 0,
          transform: ph >= 2 ? "translateY(0)" : "translateY(14px)",
          transition: "all 0.6s ease 0.2s",
        }}>
          {[["1.000+", "Kreative"], ["∞", "Möglichkeiten"], ["1", "Gemeinschaft"]].map(([n, l], i) => (
            <div key={i} style={{
              textAlign: "center", flex: 1,
              borderRight: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none",
            }}>
              <div style={{ fontWeight: 900, fontSize: 22, color: T.teal }}>{n}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          opacity: ph >= 2 ? 1 : 0,
          transform: ph >= 2 ? "translateY(0)" : "translateY(12px)",
          transition: "all 0.6s ease 0.4s",
        }}>
          <PrimaryBtn onClick={onDone}>Los geht's →</PrimaryBtn>
        </div>

        {/* Shimmer line */}
        <div style={{
          width: 56, height: 2, borderRadius: 999,
          margin: "20px auto 0",
          background: `linear-gradient(90deg, transparent, ${T.teal}, transparent)`,
          backgroundSize: "300% 100%",
          animation: "hmf-shimmer 2s ease infinite",
          opacity: ph >= 2 ? 0.7 : 0,
          transition: "opacity 0.6s ease 0.6s",
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

  // Screen 7 → aktiviere Membership + zeige Screen 8
  const handleFinish = useCallback(async () => {
    if (!data.agbAll || loading) return;
    setLoading(true);
    try {
      await activateMembership();
      if (data.focus && activateTalentProfile) {
        activateTalentProfile(data.focus).catch(() => {});
      }
      refreshProfile?.().catch(() => {});
    } catch (e) { /* silent */ } finally {
      setLoading(false);
    }
    setStep(8);
  }, [data, loading, activateMembership, activateTalentProfile, refreshProfile]);

  return (
    <div style={{
      position: "fixed", inset: 0,
      zIndex: 9800,
      background: T.bg,
      overflow: "hidden",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
    }}>
      <style>{CSS}</style>

      {/* Preload alle Bilder */}
      <div style={{ display: "none" }}>
        {Object.values(IMGS).map((src, i) => <img key={i} src={src} alt="" />)}
      </div>

      {/* Screens */}
      {step === 1 && <S1 onNext={next} data={data} setData={setData} />}
      {step === 2 && <S2 onNext={next} />}
      {step === 3 && <S3 onNext={next} />}
      {step === 4 && <S4 onNext={next} />}
      {step === 5 && <S5 onNext={next} />}
      {step === 6 && <S6 onNext={next} />}
      {step === 7 && <S7 onNext={handleFinish} data={data} setData={setData} loading={loading} />}
      {step === 8 && <S8 onDone={() => onComplete?.()} />}

      {/* Schließen — nur auf Screens 1–6, nicht auf AGB oder Welcome */}
      {step <= 6 && <CloseBtn onClose={onClose} />}

      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 30,
          background: "rgba(7,11,21,0.75)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.10)",
            borderTopColor: T.teal,
            animation: "hmf-orb-spin 0.75s linear infinite",
          }}/>
        </div>
      )}
    </div>
  );
}
