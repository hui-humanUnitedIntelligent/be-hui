// src/pages/MeinHUI.jsx — HUI Wirkungsraum v4.0 (Cinematic Opening v2)
// ═══════════════════════════════════════════════════════════════════
// "Der Nutzer erlebt eine Transformation, keinen Seitenwechsel."
//
// 5-Phasen-Choreografie (siehe Home.jsx für Phase 1+2, hier Phase 3+4+5):
//   Phase 3 (0-260ms intern):   Orb-Kern wächst aus der Nav-Position,
//                                Screen-Hintergrund blendet parallel ein
//                                (Frosted-Glass-Crossfade mit dem Feed dahinter)
//   Phase 4 (260ms+ intern):    Content erscheint gestaffelt —
//                                Info-Karten → Titel → Pillars → Reise → Rest
//                                Jeweils 60-100ms Abstand, Opacity + 10px Translate,
//                                KEINE Scale-Effekte auf den Karten.
//   Phase 5:                    Ruhe — Choreografie endet, nur Ambient-Leben
//                                (Atmen, Partikel) läuft weiter.
//
// Schließen: exaktes Spiegelbild —
//   Content fadet zuerst (200ms) → Orb schrumpft zurück (260ms, delay 200ms)
//   → Parent (Home.jsx) lässt danach den Nav-Orb zurückkehren.
// ═══════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────
const T = {
  cream:      "#FAF7F2",
  creamCard:  "#FDFBF8",
  creamDeep:  "#F2EBE0",
  sand:       "#F0E9DB",
  teal:       "#0DC4B5",
  tealSoft:   "rgba(13,196,181,0.10)",
  tealPale:   "#E6FAF8",
  tealGlow:   "rgba(13,196,181,0.16)",
  coral:      "#F47355",
  coralSoft:  "rgba(244,115,85,0.09)",
  sage:       "#5CA87A",
  sageSoft:   "rgba(92,168,122,0.11)",
  sagePale:   "#EEF7F2",
  gold:       "#D4952A",
  goldSoft:   "rgba(212,149,42,0.11)",
  goldPale:   "#FDF6E3",
  goldWarm:   "rgba(255,200,80,0.18)",
  purple:     "#7B5EA7",
  purpleSoft: "rgba(123,94,167,0.10)",
  purplePale: "#F3EEF9",
  ink:        "#141422",
  inkMid:     "#2E2E45",
  inkSoft:    "rgba(20,20,34,0.48)",
  inkFaint:   "rgba(20,20,34,0.18)",
  inkGhost:   "rgba(20,20,34,0.08)",
  white:      "#FFFFFF",
};

const FONT = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

// easeInOutCubic — kein Bounce, kein Overshoot (Cinematic Opening v2 Prinzip)
const EASE = "cubic-bezier(0.65,0,0.35,1)";

// ── Choreografie-Zeitkonstanten (ms, relativ zum MeinHUI-Mount) ────
const ORB_GROW_MS      = 260;  // Phase 3: Orb-Kern wächst
const INFO_CARDS_DELAY = 260;  // Phase 4.2: Info-Karten
const TITLE_DELAY      = 330;  // Phase 4.3: Titel/Begrüßung
const PILLARS_DELAY    = 400;  // Phase 4.4: Grundpfeiler
const JOURNEY_DELAY    = 470;  // Phase 4.5: Reise
const MOMENTS_DELAY    = 540;  // Phase 4.6: Rest (Impact-Momente)

// Schließ-Timing (muss zu Home.jsx closeMeinHuiCinematic passen: 460ms total)
const CLOSE_CONTENT_MS = 200;  // Content fadet zuerst
const CLOSE_ORB_MS     = 260;  // dann schrumpft der Orb (mit CLOSE_CONTENT_MS delay)

// ─────────────────────────────────────────────────────────────────
// KEYFRAMES — Ambient-Leben (Phase 5), läuft unabhängig von der Choreografie
// ─────────────────────────────────────────────────────────────────
const KEYFRAMES = `
@keyframes mh-orb-breathe {
  0%, 100% { transform: scale(0.985); }
  50%       { transform: scale(1.015); }
}
@keyframes mh-atm-outer {
  0%, 100% { opacity: 0.22; transform: translate(-50%,-50%) scale(1.00); }
  50%       { opacity: 0.38; transform: translate(-50%,-50%) scale(1.05); }
}
@keyframes mh-atm-mid {
  0%, 100% { opacity: 0.30; transform: translate(-50%,-50%) scale(1.00); }
  50%       { opacity: 0.52; transform: translate(-50%,-50%) scale(1.08); }
}
@keyframes mh-atm-core {
  0%, 100% { opacity: 0.55; }
  50%       { opacity: 0.85; }
}
@keyframes mh-resonance {
  0%   { transform: translate(-50%,-50%) scale(0.85); opacity: 0.18; }
  100% { transform: translate(-50%,-50%) scale(1.40); opacity: 0; }
}
@keyframes mh-particle-a {
  0%, 100% { transform: translate(0,0) rotate(0deg); opacity: 0; }
  15%       { opacity: 0.55; }
  85%       { opacity: 0.35; }
  100%      { transform: translate(var(--px), var(--py)) rotate(var(--pr)); opacity: 0; }
}
/* ── Energie-Partikel: fließen einmalig vom Orb-Ursprung nach oben ── */
@keyframes mh-stream-in {
  0%   { opacity: 0;    transform: translateY(var(--sy, 120px)) scale(0.5); }
  30%  { opacity: 0.55; }
  75%  { opacity: 0.30; }
  100% { opacity: 0;    transform: translateY(0) scale(1); }
}
/* ── Staggered Content (Phase 4): Opacity + 10px Translate, kein Scale ── */
@keyframes mh-fadeup {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;

// ─────────────────────────────────────────────────────────────────
// FadeUp — Phase-4-Baustein: reine CSS-Animation, kein Scale
// ─────────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, style = {} }) {
  return (
    <div style={{
      animation: `mh-fadeup 0.5s ${EASE} ${delay}ms both`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 1. ProfileHeader — "Titel" (Phase 4.3)
// ─────────────────────────────────────────────────────────────────
function ProfileHeader({ profile, onNotif, onSettings, delay }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 5  ? "Gute Nacht" :
    hour < 12 ? "Guten Morgen" :
    hour < 17 ? "Willkommen zurück" :
    hour < 21 ? "Guten Abend" : "Gute Nacht";
  const name = profile?.display_name || profile?.username || null;

  return (
    <FadeUp delay={delay} style={{
      display: "flex", alignItems: "center",
      padding: "10px 20px 0", gap: 12,
    }}>
      {/* Avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: "50%",
        flexShrink: 0, overflow: "hidden",
        background: `linear-gradient(135deg, ${T.teal} 0%, ${T.sage} 100%)`,
        boxShadow: `0 2px 10px rgba(13,196,181,0.22), 0 1px 4px rgba(0,0,0,0.08)`,
      }}>
        {profile?.avatar_url
          ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: T.white, fontSize: 17, fontWeight: 700, fontFamily: FONT }}>
              {name ? name[0].toUpperCase() : "H"}
            </div>
        }
      </div>

      {/* Greet */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT, fontSize: 11.5, color: T.inkSoft, fontWeight: 400, lineHeight: 1.3 }}>
          {greeting},
        </div>
        <div style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: T.ink, lineHeight: 1.2, display: "flex", alignItems: "center", gap: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name || "Mein HUI"}
          <span style={{ fontSize: 13 }}>🌿</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
        <button onClick={onNotif} style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,0.80)", backdropFilter: "blur(8px)",
          border: `1px solid ${T.inkFaint}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", position: "relative",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={T.inkMid} strokeWidth="1.8" strokeLinecap="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <div style={{ position: "absolute", top: 7, right: 7, width: 6, height: 6, borderRadius: "50%", background: T.coral, border: `1.5px solid ${T.creamCard}` }} />
        </button>
        <button onClick={onSettings} style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,0.80)", backdropFilter: "blur(8px)",
          border: `1px solid ${T.inkFaint}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={T.inkMid} strokeWidth="1.8" strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="16" y2="18"/>
          </svg>
        </button>
      </div>
    </FadeUp>
  );
}

// ─────────────────────────────────────────────────────────────────
// EnergyParticles — Phase 3 Flourish: fließen einmalig vom Orb-Ursprung
// (optional lt. Vorgabe, sehr dezent, kein Funkeln/Magie)
// ─────────────────────────────────────────────────────────────────
const STREAM = [
  { sy: 128, sx: -8,  dur: 560, del: 0   },
  { sy: 118, sx: 14,  dur: 520, del: 40  },
  { sy: 138, sx: -22, dur: 600, del: 20  },
  { sy: 110, sx: 6,   dur: 540, del: 90  },
  { sy: 124, sx: 24,  dur: 580, del: 60  },
  { sy: 132, sx: -14, dur: 500, del: 130 },
  { sy: 116, sx: 2,   dur: 560, del: 110 },
  { sy: 120, sx: -30, dur: 520, del: 150 },
];

function EnergyParticles() {
  return (
    <>
      {STREAM.map((p, i) => (
        <div key={i} style={{
          position: "absolute", top: "62%", left: `calc(50% + ${p.sx}px)`,
          width: 3.5, height: 3.5, borderRadius: "50%",
          background: i % 2 === 0 ? T.gold : T.teal,
          "--sy": `${p.sy}px`,
          animation: `mh-stream-in ${p.dur}ms ${EASE} ${p.del}ms 1 both`,
          pointerEvents: "none",
        }} />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// 2. OrbHero — Kern (Phase 3) + Info-Karten (Phase 4.2)
// ─────────────────────────────────────────────────────────────────
const LEAVES = [
  { size: 5, col: T.sage,  "--px": "-28px", "--py": "-38px", "--pr": "-22deg", dur: "8.5s", del: "0s"   },
  { size: 4, col: T.teal,  "--px": "26px",  "--py": "-32px", "--pr": "18deg",  dur: "9.8s", del: "2.1s" },
  { size: 6, col: T.gold,  "--px": "-20px", "--py": "30px",  "--pr": "-12deg", dur: "7.9s", del: "1.3s" },
  { size: 3, col: T.sage,  "--px": "22px",  "--py": "26px",  "--pr": "15deg",  dur: "10.2s","del": "3.4s"},
];

function OrbHero({ profile, coreStyle, showParticles, infoDelay }) {
  return (
    <div style={{ position: "relative", textAlign: "center", padding: "24px 0 16px" }}>

      {/* ═══ ORB-KERN — wächst in Phase 3 (0-260ms), schrumpft beim Schließen ═══ */}
      <div style={coreStyle}>

        {/* Atmosphärische Hintergrundstrahlung */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 340, height: 340, marginTop: -170, marginLeft: -170,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,190,70,0.07) 0%, rgba(13,196,181,0.05) 45%, transparent 72%)",
          animation: "mh-atm-outer 9s ease-in-out infinite",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 240, height: 240, marginTop: -120, marginLeft: -120,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,205,80,0.16) 0%, rgba(244,115,85,0.10) 40%, rgba(13,196,181,0.04) 70%, transparent 100%)",
          animation: "mh-atm-mid 7s ease-in-out 0.8s infinite",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 150, height: 150, marginTop: -75, marginLeft: -75,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(255,215,90,0.30) 50%, transparent 100%)",
          animation: "mh-atm-core 5s ease-in-out 0.3s infinite",
          pointerEvents: "none",
        }} />

        {/* Resonanzwellen */}
        {[{ del: "0s" }, { del: "3.5s" }].map((w, i) => (
          <div key={i} style={{
            position: "absolute", top: "50%", left: "50%",
            width: 180, height: 180, marginTop: -90, marginLeft: -90,
            borderRadius: "50%",
            border: "1px solid rgba(13,196,181,0.18)",
            animation: `mh-resonance 7s ease-out ${w.del} infinite`,
            pointerEvents: "none",
          }} />
        ))}

        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 210, height: 210, marginTop: -105, marginLeft: -105,
          borderRadius: "50%",
          border: "1px solid rgba(212,149,42,0.12)",
          pointerEvents: "none",
        }} />

        {/* Ambient-Blätter */}
        {LEAVES.map((l, i) => (
          <div key={i} style={{
            position: "absolute", top: "50%", left: "50%",
            marginTop: -l.size/2, marginLeft: -l.size/2,
            width: l.size, height: l.size,
            borderRadius: "50% 0 50% 0",
            background: l.col, opacity: 0,
            "--px": l["--px"], "--py": l["--py"], "--pr": l["--pr"],
            animation: `mh-particle-a ${l.dur} ease-in-out ${l.del} infinite`,
            pointerEvents: "none",
          }} />
        ))}

        {/* Energie-Partikel — fließen einmalig beim Öffnen */}
        {showParticles && <EnergyParticles />}

        {/* Das HUI-Logo — UNVERÄNDERT, freistehend */}
        <div style={{
          position: "relative", zIndex: 3,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 190, height: 190,
        }}>
          <div style={{
            animation: "mh-orb-breathe 8s ease-in-out infinite",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <img
              src="/assets/brand/hui-logo.png"
              alt="HUI"
              style={{
                width: 168, height: 168,
                objectFit: "contain", display: "block",
                userSelect: "none", pointerEvents: "none",
              }}
              draggable={false}
            />
          </div>
        </div>
      </div>
      {/* ═══ ENDE ORB-KERN ═══ */}

      {/* ─── Info-Karten — Phase 4.2, erscheinen NACH dem Orb-Wachstum ─── */}
      <FadeUp delay={infoDelay} style={{
        position: "absolute",
        left: 16, top: "50%", transform: "translateY(-50%)",
        zIndex: 2, maxWidth: 115, textAlign: "left",
      }}>
        <p style={{
          fontFamily: FONT, fontSize: 12.5, fontWeight: 400,
          lineHeight: 1.6, color: T.inkSoft, margin: "0 0 14px",
          letterSpacing: "0.005em",
        }}>
          Dein Blatt wächst durch das, was du für andere bewirkst.
        </p>
        <div style={{ color: T.coral, fontSize: 15, opacity: 0.75 }}>♡</div>
      </FadeUp>

      <div style={{
        position: "absolute", right: 14, top: "50%",
        transform: "translateY(-50%)",
        display: "flex", flexDirection: "column", gap: 8,
        zIndex: 2,
      }}>
        {[
          { icon: "🌱", label: "Deine Reise", sub: "seit 134 Tagen", glow: T.sageSoft },
          { icon: "🔥", label: "Impact gesät", sub: "23 Impulse",    glow: "rgba(244,115,85,0.08)" },
          { icon: "👥", label: "Verbindungen", sub: "47 Menschen",    glow: T.tealSoft },
        ].map((s, i) => (
          <FadeUp key={i} delay={infoDelay + i * 45}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(253,251,248,0.82)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderRadius: 13,
              padding: "6px 10px",
              boxShadow: `0 2px 10px ${s.glow}, 0 1px 3px rgba(0,0,0,0.05)`,
              border: "1px solid rgba(255,255,255,0.90)",
              minWidth: 0,
            }}>
              <span style={{ fontSize: 13, lineHeight: 1 }}>{s.icon}</span>
              <div>
                <div style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 700, color: T.ink, lineHeight: 1.2 }}>{s.label}</div>
                <div style={{ fontFamily: FONT, fontSize: 9.5, color: T.inkSoft, lineHeight: 1.2 }}>{s.sub}</div>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>

      {/* Tagline unter Orb — Teil der Info-Karten-Welle */}
      <FadeUp delay={infoDelay}>
        <p style={{
          fontFamily: FONT, fontSize: 13, fontWeight: 400,
          color: T.inkSoft, margin: "2px 0 0", lineHeight: 1.5,
          letterSpacing: "0.02em",
        }}>
          Mein Wirkungsraum
        </p>
      </FadeUp>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 3. Pillars — Phase 4.4
// ─────────────────────────────────────────────────────────────────
const PILLARS = [
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    label: "Verbinden",
    text: "Du baust Brücken und schaffst echte Begegnungen.",
    accent: T.teal, bg: T.tealPale, border: "rgba(13,196,181,0.16)", glow: "rgba(13,196,181,0.14)",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    label: "Unterstützen",
    text: "Du stärkst andere und gibst Halt, wo er gebraucht wird.",
    accent: T.sage, bg: T.sagePale, border: "rgba(92,168,122,0.18)", glow: "rgba(92,168,122,0.14)",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    label: "Erschaffen",
    text: "Du bringst Ideen in die Welt und schaffst Neues.",
    accent: T.coral, bg: "rgba(244,115,85,0.06)", border: "rgba(244,115,85,0.15)", glow: "rgba(244,115,85,0.12)",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M12 2v2m0 8v2m4-6h2M2 8h2m12.95 4.95 1.41 1.41M4.64 4.64l1.41 1.41M19.36 4.64l-1.41 1.41M6.05 12.95l-1.41 1.41"/></svg>,
    label: "Wertschöpfen",
    text: "Du schaffst echten Wert für Menschen und Projekte.",
    accent: T.gold, bg: T.goldPale, border: "rgba(212,149,42,0.18)", glow: "rgba(212,149,42,0.12)",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    label: "Impact",
    text: "Du hinterlässt Spuren, die die Welt verbessern.",
    accent: T.purple, bg: T.purplePale, border: "rgba(123,94,167,0.16)", glow: "rgba(123,94,167,0.12)",
  },
];

function PillarCard({ pillar, index, baseDelay }) {
  const [active, setActive] = useState(false);

  return (
    <FadeUp delay={baseDelay + index * 30}>
      <div
        onPointerDown={() => setActive(true)}
        onPointerUp={() => setActive(false)}
        onPointerLeave={() => setActive(false)}
        style={{
          width: 126,
          flexShrink: 0,
          background: active ? T.creamCard : pillar.bg,
          border: `1px solid ${active ? pillar.accent + "40" : pillar.border}`,
          borderRadius: 18,
          padding: "15px 13px 13px",
          cursor: "default",
          userSelect: "none",
          // Touch-Feedback (Interaktion, NICHT Teil der Entrance-Choreografie)
          transition: [
            "transform 0.22s cubic-bezier(0.16,1,0.3,1)",
            "box-shadow 0.22s cubic-bezier(0.16,1,0.3,1)",
            "background 0.18s ease",
            "border-color 0.18s ease",
          ].join(", "),
          transform: active ? "translateY(-3px) scale(1.01)" : "translateY(0) scale(1)",
          boxShadow: active
            ? `0 8px 24px ${pillar.glow}, 0 2px 8px rgba(0,0,0,0.06)`
            : `0 1px 4px rgba(0,0,0,0.04)`,
        }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          background: active ? pillar.bg : T.white,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: pillar.accent, marginBottom: 10,
          boxShadow: active ? `0 2px 10px ${pillar.glow}` : "0 1px 4px rgba(0,0,0,0.06)",
          transition: "box-shadow 0.22s ease, background 0.18s ease",
          flexShrink: 0,
        }}>
          {pillar.icon}
        </div>

        <div style={{
          fontFamily: FONT, fontSize: 13.5, fontWeight: 700,
          color: pillar.accent, marginBottom: 5, lineHeight: 1.2,
          letterSpacing: "-0.01em",
        }}>
          {pillar.label}
        </div>

        <div style={{
          fontFamily: FONT, fontSize: 11.5, fontWeight: 400,
          color: T.inkSoft, lineHeight: 1.5,
        }}>
          {pillar.text}
        </div>

        <div style={{
          height: 2, borderRadius: 2, marginTop: 11,
          background: pillar.accent,
          width: active ? 32 : 20,
          opacity: active ? 0.7 : 0.4,
          transition: "width 0.25s cubic-bezier(0.16,1,0.3,1), opacity 0.22s ease",
        }} />
      </div>
    </FadeUp>
  );
}

function Pillars({ delay }) {
  return (
    <div style={{ padding: "0 0 0 20px" }}>
      <FadeUp delay={delay}>
        <div style={{
          display: "flex", alignItems: "baseline", justifyContent: "space-between",
          paddingRight: 20, marginBottom: 14,
        }}>
          <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: T.ink, letterSpacing: "-0.015em" }}>
            Deine Grundpfeiler
          </div>
        </div>
      </FadeUp>
      <div style={{
        display: "flex", gap: 9, overflowX: "auto", scrollbarWidth: "none",
        paddingRight: 20, paddingBottom: 4,
        WebkitOverflowScrolling: "touch",
      }}>
        {PILLARS.map((p, i) => <PillarCard key={p.label} pillar={p} index={i} baseDelay={delay + 30} />)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 4. Journey — Phase 4.5, echte Erinnerungen, keine Statistiken
// ─────────────────────────────────────────────────────────────────
const JOURNEY = [
  { emoji: "🌱", label: "Heute",        text: "Kleine Impulse setzen Großes in Bewegung.",   color: T.teal   },
  { emoji: "🤝", label: "Diese Woche",  text: "Du hast 3 neue Verbindungen gestärkt.",        color: T.sage   },
  { emoji: "✨", label: "Diesen Monat", text: "Ein Projekt, das dir am Herzen liegt, wächst.", color: T.coral  },
  { emoji: "🌅", label: "Dieses Jahr",  text: "Deine Wirkung erreicht immer mehr Menschen.",  color: T.gold   },
  { emoji: "🌳", label: "Seit Beginn",  text: "Dein Weg ist einzigartig und wertvoll.",       color: T.purple },
];

function Journey({ delay }) {
  return (
    <div style={{ padding: "0 20px" }}>
      <FadeUp delay={delay}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14,
        }}>
          <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: T.ink, letterSpacing: "-0.015em" }}>
            Deine Reise
          </div>
          <button style={{
            fontFamily: FONT, fontSize: 12.5, color: T.teal, fontWeight: 500,
            background: "none", border: "none", cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", gap: 3, opacity: 0.85,
          }}>
            Reise anzeigen <span style={{ fontSize: 11 }}>›</span>
          </button>
        </div>
      </FadeUp>

      <div style={{
        display: "flex", gap: 11, overflowX: "auto",
        scrollbarWidth: "none", paddingBottom: 4,
        WebkitOverflowScrolling: "touch",
      }}>
        {JOURNEY.map((j, i) => (
          <FadeUp key={j.label} delay={delay + 30 + i * 30}>
            <div style={{ width: 106, flexShrink: 0, textAlign: "center" }}>
              <div style={{
                width: 68, height: 68, borderRadius: "50%", margin: "0 auto 9px",
                background: `linear-gradient(135deg, ${j.color}28 0%, ${j.color}55 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `1.5px solid ${j.color}38`,
                boxShadow: `0 3px 12px ${j.color}22`,
              }}>
                <span style={{ fontSize: 24 }}>{j.emoji}</span>
              </div>
              <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 4, lineHeight: 1.2 }}>
                {j.label}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 11, color: T.inkSoft, lineHeight: 1.45 }}>
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
// 5. ImpactMoments — Phase 4.6 (Rest)
// ─────────────────────────────────────────────────────────────────
const MOMENTS = [
  { icon: "♡",  label: "Du hast Jana unterstützt",        time: "vor 2 Tagen",  color: T.coral,  bg: "rgba(244,115,85,0.07)",  border: "rgba(244,115,85,0.13)" },
  { icon: "👥", label: "Neue Verbindung mit Max",          time: "vor 5 Tagen",  color: T.teal,   bg: T.tealSoft,               border: "rgba(13,196,181,0.13)"  },
  { icon: "✏️", label: "Du hast ein Werk veröffentlicht",  time: "vor 1 Woche",  color: T.sage,   bg: T.sageSoft,               border: "rgba(92,168,122,0.13)"  },
  { icon: "🌍", label: "Dein Impact hat 8 Menschen erreicht", time: "vor 1 Woche", color: T.purple, bg: T.purpleSoft,           border: "rgba(123,94,167,0.13)"  },
];

function ImpactMoments({ delay }) {
  return (
    <div style={{ padding: "0 20px" }}>
      <FadeUp delay={delay}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14,
        }}>
          <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: T.ink, letterSpacing: "-0.015em" }}>
            Deine Impact-Momente
          </div>
          <button style={{
            fontFamily: FONT, fontSize: 12.5, color: T.teal, fontWeight: 500,
            background: "none", border: "none", cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", gap: 3, opacity: 0.85,
          }}>
            Mehr anzeigen <span style={{ fontSize: 11 }}>›</span>
          </button>
        </div>
      </FadeUp>

      <div style={{
        display: "flex", gap: 9, overflowX: "auto",
        scrollbarWidth: "none", paddingBottom: 4,
        WebkitOverflowScrolling: "touch",
      }}>
        {MOMENTS.map((m, i) => (
          <FadeUp key={i} delay={delay + 30 + i * 30}>
            <div style={{
              width: 138, flexShrink: 0,
              background: m.bg, border: `1px solid ${m.border}`,
              borderRadius: 16, padding: "13px 13px 11px",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: T.white, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 15, marginBottom: 9,
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              }}>
                {m.icon}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 600, color: m.color, lineHeight: 1.35, marginBottom: 4 }}>
                {m.label}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 10.5, color: T.inkFaint }}>
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
// SHELL — MeinHUI (Cinematic Opening v2 Orchestrierung)
// ─────────────────────────────────────────────────────────────────
export default function MeinHUI({
  visible   = true,
  closing   = false,   // von Home.jsx gesteuert: Content fadet, dann schrumpft Orb
  profile   = null,
  onClose,
  onNotif,
  onSettings,
}) {
  const scrollRef = useRef(null);
  // "entered" via Double-RAF: erzwingt einen ersten Paint im Ausgangszustand,
  // bevor die CSS-Transition zum Endzustand ausgelöst wird (kein Sprung).
  const [entered, setEntered] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (visible) {
      setEntered(false);
      setShowParticles(false);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      // Double-RAF: erzwingt einen ersten Paint im Ausgangszustand,
      // bevor die CSS-Transition zum Endzustand ausgelöst wird.
      const raf1 = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setEntered(true);
          setShowParticles(true);
        });
      });
      return () => cancelAnimationFrame(raf1);
    } else {
      setEntered(false);
      setShowParticles(false);
    }
  }, [visible]);

  if (!visible) return null;

  // ── Screen-Hintergrund: blendet parallel zum Orb-Wachstum ein (Phase 3) ──
  // Frosted-Glass-Crossfade mit dem gedimmten Feed dahinter (siehe Home.jsx filter)
  const screenStyle = {
    position: "fixed", inset: 0,
    background: T.cream,
    zIndex: 9000,
    overflowY: "auto", overflowX: "hidden",
    WebkitOverflowScrolling: "touch",
    overscrollBehavior: "contain",
    opacity: closing ? 1 : (entered ? 1 : 0),
    transition: `opacity ${ORB_GROW_MS}ms ${EASE}`,
  };

  // ── Orb-Kern: wächst aus Nav-Position (Phase 3) / schrumpft zurück (Closing) ──
  const coreStyle = {
    transformOrigin: "center",
    transform: closing
      ? "translateY(46px) scale(0.55)"
      : entered ? "translateY(0) scale(1)" : "translateY(46px) scale(0.55)",
    opacity: closing ? 0 : entered ? 1 : 0,
    transition: closing
      ? `transform ${CLOSE_ORB_MS}ms ${EASE} ${CLOSE_CONTENT_MS}ms, opacity ${CLOSE_ORB_MS}ms ${EASE} ${CLOSE_CONTENT_MS}ms`
      : `transform ${ORB_GROW_MS}ms ${EASE}, opacity ${ORB_GROW_MS}ms ${EASE}`,
  };

  // ── Content-Gruppe (alles außer Orb-Kern): fadet als Erstes beim Schließen ──
  const contentGroupStyle = closing
    ? {
        opacity: 0,
        transform: "translateY(8px)",
        transition: `opacity ${CLOSE_CONTENT_MS}ms ${EASE}, transform ${CLOSE_CONTENT_MS}ms ${EASE}`,
      }
    : {};

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div ref={scrollRef} style={screenStyle}>
        <div style={{
          paddingTop: "max(14px, env(safe-area-inset-top, 14px))",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 120px)",
          ...contentGroupStyle,
        }}>

          {/* Titel (Phase 4.3) */}
          <ProfileHeader profile={profile} onNotif={onNotif} onSettings={onSettings} delay={TITLE_DELAY} />

          {/* Orb-Kern (Phase 3) + Info-Karten (Phase 4.2) */}
          <OrbHero
            profile={profile}
            coreStyle={coreStyle}
            showParticles={showParticles && !closing}
            infoDelay={INFO_CARDS_DELAY}
          />

          <div style={{ width: 28, height: 1, background: T.inkFaint, margin: "6px auto 26px", opacity: 0.35 }} />

          {/* Grundpfeiler (Phase 4.4) */}
          <Pillars delay={PILLARS_DELAY} />

          <div style={{ height: 30 }} />

          {/* Reise (Phase 4.5) */}
          <Journey delay={JOURNEY_DELAY} />

          <div style={{ height: 30 }} />

          {/* Rest (Phase 4.6) */}
          <ImpactMoments delay={MOMENTS_DELAY} />

          <div style={{ height: 12 }} />
        </div>
      </div>
    </>
  );
}
