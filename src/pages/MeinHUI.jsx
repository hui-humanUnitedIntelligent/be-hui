// src/pages/MeinHUI.jsx
// ═══════════════════════════════════════════════════════════════════
// HUI — Mein HUI (Der persönliche Wirkungsraum)
// Phase 1 — Raum. Ruhe. Wärme.
//
// Philosophie:
//   Kein Dashboard. Kein Profil. Kein Stats-Screen.
//   Sondern: "Willkommen Zuhause."
//
// Architektur:
//   MeinHUI (Shell)
//   ├── HUIWelcome        — Begrüßung, Name, Tagline
//   ├── HUIOrbHero        — Logo + atmosphärischer Licht-Raum
//   ├── HUIPillars        — Die 5 Grundpfeiler
//   ├── HUIJourney        — Deine Reise (Timeline)
//   └── HUIImpactMoments  — Wirkungsmomente
//
// Regeln:
//   - Keine Business-Logik
//   - Keine Datenbankzugriffe
//   - Nur UI — modular, composable
//   - Responsive: iPhone SE → iPad Pro
// ═══════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────
// DESIGN TOKENS — direkt aus HUI-Farbsystem
// ─────────────────────────────────────────────────────────────────
const T = {
  cream:      "#FAF7F2",
  creamSoft:  "#FDFBF8",
  creamDeep:  "#EDE5D8",
  sand:       "#F5EFE4",
  teal:       "#0DC4B5",
  tealSoft:   "rgba(13,196,181,0.12)",
  tealGlow:   "rgba(13,196,181,0.18)",
  tealPale:   "#E6FAF8",
  coral:      "#F47355",
  coralSoft:  "rgba(244,115,85,0.10)",
  sage:       "#6BAE8F",
  sageSoft:   "rgba(107,174,143,0.13)",
  sagePale:   "#EEF7F2",
  gold:       "#D4952A",
  goldSoft:   "rgba(212,149,42,0.12)",
  goldPale:   "#FDF6E3",
  ink:        "#141422",
  inkMid:     "#2E2E45",
  inkSoft:    "rgba(20,20,34,0.48)",
  inkFaint:   "rgba(20,20,34,0.22)",
  white:      "#FFFFFF",
};

const FONT = {
  display: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

// ─────────────────────────────────────────────────────────────────
// HELPER: FadeIn-Wrapper (nur opacity, kein Layout-Shift)
// ─────────────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, style = {} }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      opacity:    visible ? 1 : 0,
      transform:  visible ? "none" : "translateY(10px)",
      transition: "opacity 0.8s cubic-bezier(0.16,1,0.30,1), transform 0.8s cubic-bezier(0.16,1,0.30,1)",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 1. HUIWelcome — Begrüßung
// ─────────────────────────────────────────────────────────────────
export function HUIWelcome({ name }) {
  const hour = new Date().getHours();
  const greeting = hour < 12
    ? "Guten Morgen"
    : hour < 17
      ? "Schön, dass du da bist"
      : "Willkommen zurück";

  const displayName = name || null;

  return (
    <FadeIn delay={80} style={{ textAlign: "center", padding: "52px 28px 0" }}>
      {/* Kleines Datum oben */}
      <p style={{
        fontFamily:    FONT.display,
        fontSize:      12,
        fontWeight:    500,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color:         T.inkFaint,
        marginBottom:  20,
      }}>
        {new Date().toLocaleDateString("de-DE", {
          weekday: "long",
          day:     "numeric",
          month:   "long",
        })}
      </p>

      {/* Begrüßung */}
      <h1 style={{
        fontFamily:    FONT.display,
        fontSize:      "clamp(26px, 6.5vw, 38px)",
        fontWeight:    300,
        letterSpacing: "-0.025em",
        lineHeight:    1.2,
        color:         T.ink,
        margin:        0,
      }}>
        {greeting}
        {displayName && (
          <span style={{ display: "block", fontWeight: 600 }}>
            {displayName}.
          </span>
        )}
        {!displayName && "."}
      </h1>

      {/* Tagline */}
      <p style={{
        fontFamily:  FONT.display,
        fontSize:    15,
        fontWeight:  400,
        lineHeight:  1.65,
        color:       T.inkSoft,
        maxWidth:    300,
        margin:      "16px auto 0",
      }}>
        Dein Blatt wächst durch das,<br />was du für andere bewirkst.
      </p>
    </FadeIn>
  );
}

// ─────────────────────────────────────────────────────────────────
// 2. HUIOrbHero — Logo + atmosphärischer Lichtraum
// ─────────────────────────────────────────────────────────────────

// Sanfte CSS-only Atmosphäre — kein Canvas, kein WebGL
const ORB_KEYFRAMES = `
@keyframes hui-orb-pulse {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50%       { opacity: 0.85; transform: scale(1.06); }
}
@keyframes hui-orb-pulse-slow {
  0%, 100% { opacity: 0.30; transform: scale(1); }
  50%       { opacity: 0.55; transform: scale(1.12); }
}
@keyframes hui-orb-glow {
  0%, 100% { opacity: 0.18; }
  50%       { opacity: 0.32; }
}
@keyframes hui-orb-float-a {
  0%, 100% { transform: translate(-50%,-50%) translateY(0px);   }
  50%       { transform: translate(-50%,-50%) translateY(-8px);  }
}
@keyframes hui-orb-float-b {
  0%, 100% { transform: translate(-50%,-50%) translateY(0px);   }
  50%       { transform: translate(-50%,-50%) translateY(6px);   }
}
@keyframes hui-orb-rotate {
  0%   { transform: translate(-50%,-50%) rotate(0deg); }
  100% { transform: translate(-50%,-50%) rotate(360deg); }
}
@keyframes hui-logo-settle {
  0%   { opacity: 0; transform: scale(0.94); }
  100% { opacity: 1; transform: scale(1); }
}
`;

export function HUIOrbHero() {
  return (
    <>
      <style>{ORB_KEYFRAMES}</style>
      <FadeIn delay={180} style={{ position: "relative", textAlign: "center", padding: "44px 0 32px" }}>

        {/* Atmosphärischer Außenring — sehr dezent */}
        <div style={{
          position:     "absolute",
          top:          "50%",
          left:         "50%",
          width:        360,
          height:       360,
          marginTop:    -180,
          marginLeft:   -180,
          borderRadius: "50%",
          background:   `radial-gradient(circle, ${T.tealSoft} 0%, transparent 70%)`,
          animation:    "hui-orb-pulse-slow 7s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        {/* Mittlerer Ring — warm */}
        <div style={{
          position:     "absolute",
          top:          "50%",
          left:         "50%",
          width:        260,
          height:       260,
          marginTop:    -130,
          marginLeft:   -130,
          borderRadius: "50%",
          background:   `radial-gradient(circle, ${T.goldSoft} 0%, ${T.sageSoft} 50%, transparent 75%)`,
          animation:    "hui-orb-pulse 5.5s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        {/* Innerer Glow-Kern */}
        <div style={{
          position:     "absolute",
          top:          "50%",
          left:         "50%",
          width:        160,
          height:       160,
          marginTop:    -80,
          marginLeft:   -80,
          borderRadius: "50%",
          background:   `radial-gradient(circle, rgba(255,255,255,0.9) 0%, ${T.tealSoft} 60%, transparent 100%)`,
          animation:    "hui-orb-glow 4s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        {/* Lichtteilchen — 3 schwebendes Punkte */}
        {[
          { size: 6,  color: T.teal,  top: "22%", left: "34%", delay: "0s",   dur: "4.2s", anim: "hui-orb-float-a" },
          { size: 5,  color: T.sage,  top: "68%", left: "62%", delay: "1.4s", dur: "5.1s", anim: "hui-orb-float-b" },
          { size: 4,  color: T.gold,  top: "30%", left: "66%", delay: "0.8s", dur: "3.8s", anim: "hui-orb-float-a" },
        ].map((p, i) => (
          <div key={i} style={{
            position:        "absolute",
            top:             p.top,
            left:            p.left,
            width:           p.size,
            height:          p.size,
            borderRadius:    "50%",
            background:      p.color,
            opacity:         0.5,
            animation:       `${p.anim} ${p.dur} ease-in-out ${p.delay} infinite`,
            pointerEvents:   "none",
          }} />
        ))}

        {/* Dünner Lichtkreis */}
        <div style={{
          position:        "absolute",
          top:             "50%",
          left:            "50%",
          width:           220,
          height:          220,
          marginTop:       -110,
          marginLeft:      -110,
          borderRadius:    "50%",
          border:          `1px solid rgba(13,196,181,0.18)`,
          animation:       "hui-orb-pulse 8s ease-in-out 1s infinite",
          pointerEvents:   "none",
        }} />

        {/* Das HUI-Logo — unverändert, zentriert */}
        <div style={{
          position:     "relative",
          zIndex:       2,
          display:      "inline-flex",
          alignItems:   "center",
          justifyContent: "center",
          width:        200,
          height:       200,
        }}>
          <img
            src="/assets/brand/hui-logo-light.svg"
            alt="HUI"
            style={{
              width:     "clamp(160px, 36vw, 210px)",
              height:    "auto",
              display:   "block",
              animation: "hui-logo-settle 1.1s cubic-bezier(0.16,1,0.30,1) both",
              // Dezenter Drop-Shadow — warmes Licht
              filter:    "drop-shadow(0 4px 28px rgba(13,196,181,0.18)) drop-shadow(0 2px 8px rgba(212,149,42,0.10))",
            }}
          />
        </div>

      </FadeIn>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// 3. HUIPillars — Die 5 Grundpfeiler
// ─────────────────────────────────────────────────────────────────
const PILLARS = [
  {
    icon:    "🤝",
    label:   "Verbinden",
    text:    "Du hast zuletzt Menschen miteinander verbunden.",
    accent:  T.teal,
    bg:      T.tealPale,
    border:  "rgba(13,196,181,0.18)",
  },
  {
    icon:    "💚",
    label:   "Unterstützen",
    text:    "Deine Unterstützung hat Talente gestärkt.",
    accent:  T.sage,
    bg:      T.sagePale,
    border:  "rgba(107,174,143,0.20)",
  },
  {
    icon:    "🎨",
    label:   "Erschaffen",
    text:    "Du hast Werke in die Welt gebracht.",
    accent:  T.coral,
    bg:      "rgba(244,115,85,0.07)",
    border:  "rgba(244,115,85,0.16)",
  },
  {
    icon:    "🌱",
    label:   "Wertschöpfen",
    text:    "Dein Wirken erzeugt echten Wert für andere.",
    accent:  T.gold,
    bg:      T.goldPale,
    border:  "rgba(212,149,42,0.18)",
  },
  {
    icon:    "🌍",
    label:   "Impact",
    text:    "Du gestaltest, was bleibt.",
    accent:  T.inkMid,
    bg:      "rgba(20,20,34,0.04)",
    border:  "rgba(20,20,34,0.10)",
  },
];

function PillarCard({ pillar, delay }) {
  const [pressed, setPressed] = useState(false);

  return (
    <FadeIn delay={delay}>
      <div
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        style={{
          background:    pillar.bg,
          border:        `1px solid ${pillar.border}`,
          borderRadius:  18,
          padding:       "18px 18px 16px",
          cursor:        "default",
          userSelect:    "none",
          transition:    "transform 0.22s cubic-bezier(0.16,1,0.30,1), box-shadow 0.22s ease",
          transform:     pressed ? "scale(0.975)" : "scale(1)",
          boxShadow:     pressed
            ? `0 2px 8px rgba(0,0,0,0.06)`
            : `0 1px 4px rgba(0,0,0,0.04)`,
        }}
      >
        {/* Icon */}
        <div style={{
          fontSize:     24,
          marginBottom: 10,
          lineHeight:   1,
        }}>
          {pillar.icon}
        </div>

        {/* Titel */}
        <div style={{
          fontFamily:    FONT.display,
          fontSize:      15,
          fontWeight:    700,
          color:         pillar.accent,
          letterSpacing: "-0.01em",
          marginBottom:  6,
        }}>
          {pillar.label}
        </div>

        {/* Text */}
        <div style={{
          fontFamily:  FONT.display,
          fontSize:    13,
          fontWeight:  400,
          lineHeight:  1.55,
          color:       T.inkSoft,
        }}>
          {pillar.text}
        </div>
      </div>
    </FadeIn>
  );
}

export function HUIPillars() {
  return (
    <div style={{ padding: "0 20px" }}>
      {/* Abschnitts-Titel */}
      <FadeIn delay={340}>
        <div style={{
          fontFamily:    FONT.display,
          fontSize:      11,
          fontWeight:    600,
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          color:         T.inkFaint,
          marginBottom:  16,
          paddingLeft:   2,
        }}>
          Deine fünf Grundpfeiler
        </div>
      </FadeIn>

      {/* 2-Spalten Grid */}
      <div style={{
        display:             "grid",
        gridTemplateColumns: "1fr 1fr",
        gap:                 10,
      }}>
        {PILLARS.slice(0, 4).map((p, i) => (
          <PillarCard key={p.label} pillar={p} delay={380 + i * 55} />
        ))}
      </div>

      {/* Impact — volle Breite */}
      <div style={{ marginTop: 10 }}>
        <PillarCard pillar={PILLARS[4]} delay={600} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 4. HUIJourney — Deine Reise
// ─────────────────────────────────────────────────────────────────
const JOURNEY_SEGMENTS = [
  { label: "Heute",         placeholder: "Noch keine Aktivität heute." },
  { label: "Diese Woche",   placeholder: "Deine Woche beginnt." },
  { label: "Diesen Monat",  placeholder: "Ein Monat voller Möglichkeiten." },
  { label: "Dieses Jahr",   placeholder: "Dein Jahr in HUI." },
  { label: "Seit Beginn",   placeholder: "Deine gesamte Wirkungsreise." },
];

export function HUIJourney() {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <FadeIn delay={680} style={{ padding: "0 20px" }}>
      {/* Titel */}
      <div style={{
        fontFamily:    FONT.display,
        fontSize:      11,
        fontWeight:    600,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color:         T.inkFaint,
        marginBottom:  16,
        paddingLeft:   2,
      }}>
        Deine Reise
      </div>

      {/* Timeline-Tabs */}
      <div style={{
        display:        "flex",
        gap:            6,
        overflowX:      "auto",
        scrollbarWidth: "none",
        marginBottom:   20,
        paddingBottom:  2,
      }}>
        {JOURNEY_SEGMENTS.map((seg, i) => {
          const active = i === activeIdx;
          return (
            <button
              key={seg.label}
              onClick={() => setActiveIdx(i)}
              style={{
                flexShrink:    0,
                fontFamily:    FONT.display,
                fontSize:      13,
                fontWeight:    active ? 600 : 400,
                color:         active ? T.ink : T.inkSoft,
                background:    active ? T.white : "transparent",
                border:        active ? `1px solid ${T.inkFaint}` : "1px solid transparent",
                borderRadius:  20,
                padding:       "7px 14px",
                cursor:        "pointer",
                transition:    "all 0.25s cubic-bezier(0.16,1,0.30,1)",
                boxShadow:     active ? "0 1px 6px rgba(0,0,0,0.06)" : "none",
              }}
            >
              {seg.label}
            </button>
          );
        })}
      </div>

      {/* Placeholder-Inhalt */}
      <div style={{
        background:    T.white,
        border:        `1px solid ${T.inkFaint}`,
        borderRadius:  18,
        padding:       "32px 24px",
        textAlign:     "center",
        minHeight:     110,
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        justifyContent: "center",
        gap:           10,
      }}>
        {/* Dezentes Blatt-Icon */}
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path
            d="M14 4C14 4 6 8 6 16C6 20.4 9.6 24 14 24C18.4 24 22 20.4 22 16C22 8 14 4 14 4Z"
            fill={T.sageSoft}
            stroke={T.sage}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M14 24V13" stroke={T.sage} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M14 17L11 14" stroke={T.sage} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M14 20L17 17" stroke={T.sage} strokeWidth="1.1" strokeLinecap="round" />
        </svg>
        <p style={{
          fontFamily: FONT.display,
          fontSize:   14,
          fontWeight: 400,
          color:      T.inkSoft,
          lineHeight: 1.55,
          margin:     0,
          maxWidth:   220,
        }}>
          {JOURNEY_SEGMENTS[activeIdx].placeholder}
        </p>
      </div>
    </FadeIn>
  );
}

// ─────────────────────────────────────────────────────────────────
// 5. HUIImpactMoments — Wirkungsmomente
// ─────────────────────────────────────────────────────────────────
const MOMENT_TYPES = [
  { icon: "🤝", label: "Neue Verbindung",     color: T.teal,  bg: T.tealPale,  border: "rgba(13,196,181,0.18)" },
  { icon: "🎨", label: "Werk veröffentlicht", color: T.coral, bg: "rgba(244,115,85,0.07)", border: "rgba(244,115,85,0.15)" },
  { icon: "💚", label: "Unterstützung",        color: T.sage,  bg: T.sagePale,  border: "rgba(107,174,143,0.18)" },
  { icon: "🌍", label: "Impact ausgelöst",     color: T.gold,  bg: T.goldPale,  border: "rgba(212,149,42,0.18)" },
];

function MomentCard({ moment, delay }) {
  return (
    <FadeIn delay={delay}>
      <div style={{
        display:       "flex",
        alignItems:    "center",
        gap:           14,
        background:    moment.bg,
        border:        `1px solid ${moment.border}`,
        borderRadius:  14,
        padding:       "14px 16px",
      }}>
        {/* Icon */}
        <div style={{
          width:          40,
          height:         40,
          borderRadius:   "50%",
          background:     T.white,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontSize:       18,
          flexShrink:     0,
          boxShadow:      "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          {moment.icon}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily:    FONT.display,
            fontSize:      14,
            fontWeight:    600,
            color:         moment.color,
            letterSpacing: "-0.01em",
            marginBottom:  3,
          }}>
            {moment.label}
          </div>
          <div style={{
            fontFamily: FONT.display,
            fontSize:   12,
            color:      T.inkFaint,
          }}>
            Platzhalter
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

export function HUIImpactMoments() {
  return (
    <FadeIn delay={800} style={{ padding: "0 20px" }}>
      {/* Titel */}
      <div style={{
        fontFamily:    FONT.display,
        fontSize:      11,
        fontWeight:    600,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color:         T.inkFaint,
        marginBottom:  16,
        paddingLeft:   2,
      }}>
        Wirkungsmomente
      </div>

      {/* Karten */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {MOMENT_TYPES.map((m, i) => (
          <MomentCard key={m.label} moment={m} delay={840 + i * 60} />
        ))}
      </div>

      {/* Philosophie-Hinweis */}
      <FadeIn delay={1100}>
        <p style={{
          fontFamily:  FONT.display,
          fontSize:    12,
          fontWeight:  400,
          color:       T.inkFaint,
          textAlign:   "center",
          lineHeight:  1.6,
          marginTop:   24,
          paddingBottom: 8,
        }}>
          Keine Likes. Keine Kommentare.<br />
          Nur echte Wirkung.
        </p>
      </FadeIn>
    </FadeIn>
  );
}

// ─────────────────────────────────────────────────────────────────
// SHELL — MeinHUI
// ─────────────────────────────────────────────────────────────────
export default function MeinHUI({ name, onClose }) {
  const scrollRef = useRef(null);

  // Scroll-Position erhalten beim Öffnen
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  return (
    <div
      ref={scrollRef}
      style={{
        position:         "fixed",
        inset:            0,
        background:       T.cream,
        overflowY:        "auto",
        overflowX:        "hidden",
        zIndex:           200,
        WebkitOverflowScrolling: "touch",
        // Verhindert Safari-Gummi-Effekt
        overscrollBehavior: "contain",
      }}
    >
      {/* Schließen-Button — diskret oben rechts */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position:        "fixed",
            top:             "env(safe-area-inset-top, 16px)",
            right:           18,
            zIndex:          201,
            background:      "rgba(255,255,255,0.85)",
            backdropFilter:  "blur(12px)",
            border:          `1px solid ${T.inkFaint}`,
            borderRadius:    "50%",
            width:           36,
            height:          36,
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            cursor:          "pointer",
            color:           T.inkSoft,
            fontSize:        16,
          }}
          aria-label="Schließen"
        >
          ×
        </button>
      )}

      {/* Inhalt */}
      <div style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 100px)" }}>

        {/* 1 — Begrüßung */}
        <HUIWelcome name={name} />

        {/* 2 + 3 — Logo + Orb-Atmosphäre */}
        <HUIOrbHero />

        {/* Sanfte Trennlinie */}
        <div style={{
          width:       "40px",
          height:      "1px",
          background:  T.inkFaint,
          margin:      "0 auto 40px",
          opacity:     0.5,
        }} />

        {/* 4 — Grundpfeiler */}
        <HUIPillars />

        {/* Abstand */}
        <div style={{ height: 40 }} />

        {/* 5 — Deine Reise */}
        <HUIJourney />

        {/* Abstand */}
        <div style={{ height: 40 }} />

        {/* 6 — Wirkungsmomente */}
        <HUIImpactMoments />

      </div>
    </div>
  );
}
