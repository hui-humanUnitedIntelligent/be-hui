// src/pages/MeinHUI.jsx — HUI Wirkungsraum v2.0
// ═══════════════════════════════════════════════════════════════════
// Referenz: HUI Mein HUI Design — persönlicher Wirkungsraum
//
// Philosophie:
//   "Ich betrete meine Welt." — nicht "Ich öffne ein Menü."
//
// Architektur:
//   MeinHUI (Shell — fixed fullscreen, eigenes Scroll-Layer)
//   ├── ProfileHeader     — Avatar, Name, Begrüßung + Actions
//   ├── OrbHero           — großer, leuchtender Zentral-Orb
//   ├── Pillars           — 5 Grundpfeiler (horizontal scroll)
//   ├── Journey           — Deine Reise (Timeline)
//   └── ImpactMoments     — Wirkungsmomente (horizontal)
//
// Regeln (HUI Constitution):
//   - Keine Datenbankzugriffe hier
//   - Nur UI / Props — composable
//   - Logo-Animation NUR am Container, nicht am Logo selbst
// ═══════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────
const T = {
  cream:     "#FAF7F2",
  creamCard: "#FDFBF8",
  sand:      "#F0E9DB",
  teal:      "#0DC4B5",
  tealSoft:  "rgba(13,196,181,0.12)",
  tealPale:  "#E6FAF8",
  coral:     "#F47355",
  coralSoft: "rgba(244,115,85,0.10)",
  sage:      "#5CA87A",
  sageSoft:  "rgba(92,168,122,0.12)",
  sagePale:  "#EEF7F2",
  gold:      "#D4952A",
  goldSoft:  "rgba(212,149,42,0.12)",
  goldPale:  "#FDF6E3",
  purple:    "#7B5EA7",
  purpleSoft:"rgba(123,94,167,0.12)",
  purplePale:"#F3EEF9",
  ink:       "#141422",
  inkMid:    "#2E2E45",
  inkSoft:   "rgba(20,20,34,0.50)",
  inkFaint:  "rgba(20,20,34,0.20)",
  white:     "#FFFFFF",
};

const FONT = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

// ─────────────────────────────────────────────────────────────────
// KEYFRAMES
// ─────────────────────────────────────────────────────────────────
const KEYFRAMES = `
@keyframes mh-fade-up {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes mh-orb-pulse-a {
  0%, 100% { opacity: 0.45; transform: translate(-50%,-50%) scale(1); }
  50%       { opacity: 0.70; transform: translate(-50%,-50%) scale(1.07); }
}
@keyframes mh-orb-pulse-b {
  0%, 100% { opacity: 0.25; transform: translate(-50%,-50%) scale(1); }
  50%       { opacity: 0.48; transform: translate(-50%,-50%) scale(1.13); }
}
@keyframes mh-orb-glow {
  0%, 100% { opacity: 0.60; }
  50%       { opacity: 0.90; }
}
@keyframes mh-float-a {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50%       { transform: translateY(-7px) rotate(3deg); }
}
@keyframes mh-float-b {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(5px); }
}
@keyframes mh-leaf-drift {
  0%        { transform: translate(0,0) rotate(0deg);   opacity: 0; }
  10%       { opacity: 0.7; }
  90%       { opacity: 0.5; }
  100%      { transform: translate(var(--dx), var(--dy)) rotate(var(--dr)); opacity: 0; }
}
@keyframes mh-screen-in {
  from { opacity: 0; transform: scale(0.97); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes mh-screen-out {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(0.97); }
}
`;

// ─────────────────────────────────────────────────────────────────
// FadeIn helper
// ─────────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, style = {} }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{
      opacity: on ? 1 : 0,
      transform: on ? "none" : "translateY(12px)",
      transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 1. ProfileHeader
// ─────────────────────────────────────────────────────────────────
function ProfileHeader({ profile, onNotif, onSettings }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Guten Morgen" : hour < 17 ? "Willkommen zurück" : "Guten Abend";
  const name = profile?.display_name || profile?.username || null;

  return (
    <FadeUp delay={60} style={{
      display: "flex",
      alignItems: "center",
      padding: "8px 20px 0",
      gap: 12,
    }}>
      {/* Avatar */}
      <div style={{
        width: 46,
        height: 46,
        borderRadius: "50%",
        flexShrink: 0,
        overflow: "hidden",
        background: `linear-gradient(135deg, ${T.teal} 0%, ${T.sage} 100%)`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
      }}>
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: T.white, fontSize: 18, fontWeight: 700, fontFamily: FONT,
          }}>
            {name ? name[0].toUpperCase() : "H"}
          </div>
        )}
      </div>

      {/* Greet */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: FONT, fontSize: 12, color: T.inkSoft,
          fontWeight: 400, lineHeight: 1.3,
        }}>
          {greeting},
        </div>
        <div style={{
          fontFamily: FONT, fontSize: 17, fontWeight: 700,
          color: T.ink, lineHeight: 1.2,
          display: "flex", alignItems: "center", gap: 5,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {name || "Mein HUI"}
          <span style={{ fontSize: 14 }}>🌿</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        {/* Glocke */}
        <button onClick={onNotif} style={{
          width: 38, height: 38, borderRadius: "50%",
          background: T.creamCard, border: `1px solid ${T.inkFaint}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", position: "relative",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.inkMid} strokeWidth="1.8" strokeLinecap="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {/* Dot */}
          <div style={{
            position: "absolute", top: 8, right: 8,
            width: 7, height: 7, borderRadius: "50%",
            background: T.coral, border: `1.5px solid ${T.creamCard}`,
          }} />
        </button>

        {/* Settings */}
        <button onClick={onSettings} style={{
          width: 38, height: 38, borderRadius: "50%",
          background: T.creamCard, border: `1px solid ${T.inkFaint}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.inkMid} strokeWidth="1.8" strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="8" y1="12" x2="20" y2="12"/>
            <line x1="4" y1="18" x2="16" y2="18"/>
          </svg>
        </button>
      </div>
    </FadeUp>
  );
}

// ─────────────────────────────────────────────────────────────────
// 2. OrbHero — leuchtender Zentral-Orb nach Referenz
// ─────────────────────────────────────────────────────────────────
const LEAVES = [
  { size: 8,  col: T.sage,  top: "18%", left: "22%", dur: "5.2s", del: "0s",   dx: "-30px", dy: "-40px", dr: "-25deg" },
  { size: 6,  col: T.teal,  top: "24%", left: "72%", dur: "6.1s", del: "1.2s", dx: "25px",  dy: "-35px", dr: "20deg"  },
  { size: 7,  col: T.sage,  top: "55%", left: "78%", dur: "4.8s", del: "0.6s", dx: "20px",  dy: "-28px", dr: "15deg"  },
  { size: 5,  col: T.gold,  top: "62%", left: "18%", dur: "5.5s", del: "1.8s", dx: "-18px", dy: "-22px", dr: "-18deg" },
];

function OrbHero({ profile }) {
  return (
    <FadeUp delay={150} style={{
      position: "relative",
      textAlign: "center",
      padding: "28px 0 20px",
    }}>
      {/* Floating Leaves */}
      {LEAVES.map((l, i) => (
        <div key={i} style={{
          position: "absolute",
          top: l.top, left: l.left,
          width: l.size, height: l.size,
          borderRadius: "50% 0 50% 0",
          background: l.col,
          opacity: 0,
          "--dx": l.dx, "--dy": l.dy, "--dr": l.dr,
          animation: `mh-leaf-drift ${l.dur} ease-in-out ${l.del} infinite`,
          pointerEvents: "none",
        }} />
      ))}

      {/* Äußerer Glow-Ring */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        width: 310, height: 310,
        marginTop: -155, marginLeft: -155,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,195,80,0.12) 0%, rgba(13,196,181,0.08) 50%, transparent 75%)",
        animation: "mh-orb-pulse-b 7s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      {/* Mittlerer Lichtring — warm orange */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        width: 220, height: 220,
        marginTop: -110, marginLeft: -110,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,210,80,0.22) 0%, rgba(244,115,85,0.14) 45%, rgba(13,196,181,0.06) 75%, transparent 100%)",
        animation: "mh-orb-pulse-a 5s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      {/* Innerer Kern — weiß/golden */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        width: 140, height: 140,
        marginTop: -70, marginLeft: -70,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,220,100,0.35) 55%, transparent 100%)",
        animation: "mh-orb-glow 4s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      {/* Stats rechts — dezent */}
      <div style={{
        position: "absolute",
        right: 22, top: "50%",
        transform: "translateY(-50%)",
        display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start",
        zIndex: 2,
      }}>
        {[
          { icon: "🌱", label: "Deine Reise", sub: "seit 134 Tagen" },
          { icon: "🔥", label: "Impact gesät", sub: "23 Impulse" },
          { icon: "👥", label: "Verbindungen", sub: "47 Menschen" },
        ].map((s, i) => (
          <FadeUp key={i} delay={280 + i * 80}>
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(8px)",
              borderRadius: 12,
              padding: "6px 10px",
              boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
              border: `1px solid rgba(255,255,255,0.90)`,
              minWidth: 0,
            }}>
              <span style={{ fontSize: 14 }}>{s.icon}</span>
              <div>
                <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, color: T.ink, lineHeight: 1.2 }}>{s.label}</div>
                <div style={{ fontFamily: FONT, fontSize: 10, color: T.inkSoft, lineHeight: 1.2 }}>{s.sub}</div>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>

      {/* Tagline links */}
      <FadeUp delay={220} style={{
        position: "absolute",
        left: 22, top: "50%",
        transform: "translateY(-50%)",
        zIndex: 2, maxWidth: 110, textAlign: "left",
      }}>
        <p style={{
          fontFamily: FONT, fontSize: 13, fontWeight: 400,
          lineHeight: 1.55, color: T.inkSoft, margin: 0,
        }}>
          Dein Blatt wächst durch das, was du für andere bewirkst.
        </p>
        <div style={{ marginTop: 8, color: T.coral, fontSize: 16 }}>♡</div>
      </FadeUp>

      {/* Das HUI-Logo — UNVERÄNDERT, kein Background */}
      <div style={{
        position: "relative",
        zIndex: 3,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 190, height: 190,
      }}>
        {/* Animation am Container, NIEMALS am Logo */}
        <div style={{
          animation: "mh-float-a 6s ease-in-out infinite",
          width: 170, height: 170,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <img
            src="/assets/brand/hui-logo.png"
            alt="HUI"
            style={{
              width: 170, height: 170,
              objectFit: "contain",
              display: "block",
              userSelect: "none",
              pointerEvents: "none",
              // Kein Background, kein Container — freistehend
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* Tagline unter Orb */}
      <FadeUp delay={350}>
        <p style={{
          fontFamily: FONT, fontSize: 14, fontWeight: 400,
          color: T.inkSoft, margin: "4px 0 0", lineHeight: 1.5,
          textAlign: "center",
        }}>
          Mein Wirkungsraum
        </p>
      </FadeUp>
    </FadeUp>
  );
}

// ─────────────────────────────────────────────────────────────────
// 3. Pillars — 5 Grundpfeiler (horizontal scroll wie Referenz)
// ─────────────────────────────────────────────────────────────────
const PILLARS = [
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    label: "Verbinden",
    text: "Du baust Brücken und schaffst echte Begegnungen.",
    accent: T.teal, bg: T.tealPale, border: "rgba(13,196,181,0.18)",
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    label: "Unterstützen",
    text: "Du stärkst andere und gibst Halt, wo er gebraucht wird.",
    accent: T.sage, bg: T.sagePale, border: "rgba(92,168,122,0.20)",
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    label: "Erschaffen",
    text: "Du bringst Ideen in die Welt und schaffst Neues.",
    accent: T.coral, bg: "rgba(244,115,85,0.07)", border: "rgba(244,115,85,0.18)",
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M12 2v2m0 8v2m4-6h2M2 8h2m12.95 4.95 1.41 1.41M4.64 4.64l1.41 1.41M19.36 4.64l-1.41 1.41M6.05 12.95l-1.41 1.41"/></svg>,
    label: "Wertschöpfen",
    text: "Du schaffst echten Wert für Menschen und Projekte.",
    accent: T.gold, bg: T.goldPale, border: "rgba(212,149,42,0.20)",
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    label: "Impact",
    text: "Du hinterlässt Spuren, die die Welt verbessern.",
    accent: T.purple, bg: T.purplePale, border: "rgba(123,94,167,0.18)",
  },
];

function PillarCard({ pillar, index }) {
  const [pressed, setPressed] = useState(false);
  return (
    <FadeUp delay={480 + index * 50}>
      <div
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        style={{
          width: 130,
          flexShrink: 0,
          background: pillar.bg,
          border: `1px solid ${pillar.border}`,
          borderRadius: 18,
          padding: "16px 14px 14px",
          cursor: "default",
          transition: "transform 0.18s cubic-bezier(0.16,1,0.3,1)",
          transform: pressed ? "scale(0.96)" : "scale(1)",
          userSelect: "none",
        }}
      >
        {/* Icon */}
        <div style={{
          width: 40, height: 40,
          borderRadius: "50%",
          background: T.white,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: pillar.accent,
          marginBottom: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          {pillar.icon}
        </div>

        {/* Titel */}
        <div style={{
          fontFamily: FONT, fontSize: 14, fontWeight: 700,
          color: pillar.accent, marginBottom: 6, lineHeight: 1.2,
        }}>
          {pillar.label}
        </div>

        {/* Text */}
        <div style={{
          fontFamily: FONT, fontSize: 12, fontWeight: 400,
          color: T.inkSoft, lineHeight: 1.5,
        }}>
          {pillar.text}
        </div>

        {/* Akzent-Linie */}
        <div style={{
          height: 2, borderRadius: 2, marginTop: 12,
          background: pillar.accent, width: 24, opacity: 0.5,
        }} />
      </div>
    </FadeUp>
  );
}

function Pillars() {
  return (
    <div style={{ padding: "0 0 0 20px" }}>
      {/* Titel */}
      <FadeUp delay={440}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingRight: 20, marginBottom: 14,
        }}>
          <div style={{
            fontFamily: FONT, fontSize: 16, fontWeight: 700,
            color: T.ink, letterSpacing: "-0.01em",
          }}>
            Deine Grundpfeiler
          </div>
        </div>
      </FadeUp>

      {/* Horizontal scroll */}
      <div style={{
        display: "flex", gap: 10,
        overflowX: "auto", scrollbarWidth: "none",
        paddingRight: 20, paddingBottom: 4,
        WebkitOverflowScrolling: "touch",
      }}>
        {PILLARS.map((p, i) => (
          <PillarCard key={p.label} pillar={p} index={i} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 4. Journey — Deine Reise (Referenz: 5 Zeitpunkte mit Bildern)
// ─────────────────────────────────────────────────────────────────
const JOURNEY = [
  {
    label: "Heute",
    img: null,
    text: "Kleine Impulse setzen Großes in Bewegung.",
    color: T.teal,
  },
  {
    label: "Diese Woche",
    img: null,
    text: "Du hast 3 neue Verbindungen gestärkt.",
    color: T.sage,
  },
  {
    label: "Diesen Monat",
    img: null,
    text: "Ein Projekt, das dir am Herzen liegt, wächst.",
    color: T.coral,
  },
  {
    label: "Dieses Jahr",
    img: null,
    text: "Deine Wirkung erreicht immer mehr Menschen.",
    color: T.gold,
  },
  {
    label: "Seit Beginn",
    img: null,
    text: "Dein Weg ist einzigartig und wertvoll.",
    color: T.purple,
  },
];

function Journey() {
  return (
    <div style={{ padding: "0 20px" }}>
      {/* Header */}
      <FadeUp delay={680}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 16,
        }}>
          <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: T.ink }}>
            Deine Reise
          </div>
          <button style={{
            fontFamily: FONT, fontSize: 13, color: T.teal, fontWeight: 500,
            background: "none", border: "none", cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            Reise anzeigen <span style={{ fontSize: 12 }}>›</span>
          </button>
        </div>
      </FadeUp>

      {/* Horizontal Kacheln */}
      <div style={{
        display: "flex", gap: 12, overflowX: "auto",
        scrollbarWidth: "none", paddingBottom: 4,
        WebkitOverflowScrolling: "touch",
      }}>
        {JOURNEY.map((j, i) => (
          <FadeUp key={j.label} delay={720 + i * 60}>
            <div style={{ width: 110, flexShrink: 0, textAlign: "center" }}>
              {/* Bild-Kreis */}
              <div style={{
                width: 72, height: 72, borderRadius: "50%", margin: "0 auto 10px",
                background: `linear-gradient(135deg, ${j.color}30 0%, ${j.color}60 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `2px solid ${j.color}40`,
                boxShadow: `0 2px 10px ${j.color}25`,
              }}>
                <span style={{ fontSize: 26 }}>
                  {i === 0 ? "🌱" : i === 1 ? "🤝" : i === 2 ? "✨" : i === 3 ? "🌅" : "🌳"}
                </span>
              </div>
              {/* Label */}
              <div style={{
                fontFamily: FONT, fontSize: 12, fontWeight: 700,
                color: T.ink, marginBottom: 4, lineHeight: 1.2,
              }}>
                {j.label}
              </div>
              {/* Text */}
              <div style={{
                fontFamily: FONT, fontSize: 11, color: T.inkSoft,
                lineHeight: 1.45,
              }}>
                {j.text}
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 5. ImpactMoments — Wirkungsmomente (horizontal wie Referenz)
// ─────────────────────────────────────────────────────────────────
const MOMENTS = [
  { icon: "♡",  label: "Du hast Jana unterstützt", time: "vor 2 Tagen",  color: T.coral, bg: "rgba(244,115,85,0.07)",  border: "rgba(244,115,85,0.15)" },
  { icon: "👥", label: "Neue Verbindung mit Max",   time: "vor 5 Tagen",  color: T.teal,  bg: T.tealSoft,              border: "rgba(13,196,181,0.15)" },
  { icon: "✏️", label: "Du hast ein Werk veröffentlicht", time: "vor 1 Woche", color: T.sage, bg: T.sageSoft,          border: "rgba(92,168,122,0.15)" },
  { icon: "🌍", label: "Dein Impact hat 8 Menschen erreicht", time: "vor 1 Woche", color: T.purple, bg: T.purpleSoft,  border: "rgba(123,94,167,0.15)" },
];

function ImpactMoments() {
  return (
    <div style={{ padding: "0 20px" }}>
      {/* Header */}
      <FadeUp delay={900}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 16,
        }}>
          <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: T.ink }}>
            Deine Impact-Momente
          </div>
          <button style={{
            fontFamily: FONT, fontSize: 13, color: T.teal, fontWeight: 500,
            background: "none", border: "none", cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            Mehr anzeigen <span style={{ fontSize: 12 }}>›</span>
          </button>
        </div>
      </FadeUp>

      {/* Horizontal scroll */}
      <div style={{
        display: "flex", gap: 10, overflowX: "auto",
        scrollbarWidth: "none", paddingBottom: 4,
        WebkitOverflowScrolling: "touch",
      }}>
        {MOMENTS.map((m, i) => (
          <FadeUp key={i} delay={940 + i * 55}>
            <div style={{
              width: 140, flexShrink: 0,
              background: m.bg, border: `1px solid ${m.border}`,
              borderRadius: 16, padding: "14px 14px 12px",
            }}>
              {/* Icon-Badge */}
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: T.white, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 16, marginBottom: 10,
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              }}>
                {m.icon}
              </div>

              <div style={{
                fontFamily: FONT, fontSize: 12, fontWeight: 600,
                color: m.color, lineHeight: 1.35, marginBottom: 4,
              }}>
                {m.label}
              </div>
              <div style={{
                fontFamily: FONT, fontSize: 11, color: T.inkFaint,
              }}>
                {m.time}
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SHELL — MeinHUI
// ─────────────────────────────────────────────────────────────────
export default function MeinHUI({
  visible   = true,
  profile   = null,
  onClose,
  onNotif,
  onSettings,
}) {
  const scrollRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);

  // Scroll auf Top beim Öffnen
  useEffect(() => {
    if (visible && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [visible]);

  function handleClose() {
    setIsClosing(true);
    setTimeout(() => { setIsClosing(false); onClose?.(); }, 260);
  }

  if (!visible) return null;

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        ref={scrollRef}
        style={{
          position: "fixed",
          inset: 0,
          background: T.cream,
          zIndex: 9000,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          animation: isClosing ? "mh-screen-out 0.26s ease both" : "mh-screen-in 0.32s ease both",
        }}
      >
        {/* Safe area top padding */}
        <div style={{
          paddingTop: "max(16px, env(safe-area-inset-top, 16px))",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 120px)",
        }}>

          {/* 1 — Header */}
          <ProfileHeader
            profile={profile}
            onNotif={onNotif}
            onSettings={onSettings}
          />

          {/* 2 — Orb-Hero */}
          <OrbHero profile={profile} />

          {/* Trennlinie */}
          <div style={{
            width: 32, height: 1, background: T.inkFaint,
            margin: "8px auto 28px", opacity: 0.4,
          }} />

          {/* 3 — Grundpfeiler */}
          <Pillars />

          <div style={{ height: 32 }} />

          {/* 4 — Reise */}
          <Journey />

          <div style={{ height: 32 }} />

          {/* 5 — Impact-Momente */}
          <ImpactMoments />

          <div style={{ height: 16 }} />
        </div>
      </div>
    </>
  );
}
