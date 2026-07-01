// src/system/orb/MemberOrbHome.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — Persönlicher HUI-Bereich (Phase 1)
//
// PHILOSOPHIE:
//   Kein Profil-Dashboard. Kein Statistikbereich.
//   Ein ruhiger, persönlicher Ort.
//
//   Das HUI-Logo im Zentrum ist unveränderlich — es ist die Marke.
//   Der Orb ist der RAUM um das Logo — das lebendige Wirkungsfeld.
//   Das Blatt entwickelt sich NICHT im Logo, sondern im Raum drumherum.
//
// ARCHITEKTUR:
//   Layer 1 — Atmosphäre (Blobs, Glow)
//   Layer 2 — Logo-Zentrum (statisch, unverändert)
//   Layer 3 — Wirkungsfeld (Partikel, Resonanzkreise, Licht)
//   Layer 4 — Grundpfeiler-Karten (5 Pfeiler, natürliche Sprache)
//   Layer 5 — Persönliche Reise (Timeline)
//
// DESIGNPRINZIPIEN:
//   Apple · Patagonia · Notion · Aesop · Muji
//   Natur. Ruhe. Premium. Zeitlos.
//
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo } from "react";
import { T } from "./OrbConfig.js";

// ─── Farben und Tokens ───────────────────────────────────────────
const COLOR = {
  cream:     "#FAF7F2",
  creamWarm: "#F5EEE3",
  teal:      "#0DC4B5",
  tealLight: "#22DDD0",
  tealPale:  "#E6FAF8",
  coral:     "#F47355",
  coralPale: "#FFF0EB",
  gold:      "#D4952A",
  goldLight: "#F0C46A",
  goldPale:  "#FDF8F0",
  ink:       "#141422",
  ink2:      "rgba(20,20,34,0.62)",
  ink3:      "rgba(20,20,34,0.40)",
  ink4:      "rgba(20,20,34,0.18)",
  green:     "#4CAF87",
  greenPale: "#EDF7F2",
};

// ─── Grundpfeiler-Definitionen ───────────────────────────────────
const PILLARS = [
  {
    key:   "verbinden",
    icon:  "🤝",
    title: "Verbinden",
    color: COLOR.teal,
    pale:  COLOR.tealPale,
    hints: [
      "Du verbindest Menschen mit echter Absicht.",
      "Deine Verbindungen entstehen aus echtem Interesse.",
      "Du schaffst Räume, in denen Menschen sich finden.",
    ],
  },
  {
    key:   "unterstuetzen",
    icon:  "💚",
    title: "Unterstützen",
    color: COLOR.green,
    pale:  COLOR.greenPale,
    hints: [
      "Du bist da, wenn jemand dich braucht.",
      "Deine Hilfe wirkt — auch wenn du es nicht siehst.",
      "Du unterstützt ohne Gegenleistung zu erwarten.",
    ],
  },
  {
    key:   "erschaffen",
    icon:  "🎨",
    title: "Erschaffen",
    color: COLOR.coral,
    pale:  COLOR.coralPale,
    hints: [
      "Du lässt Neues entstehen.",
      "Was du schaffst, hat Bestand.",
      "Deine Werke tragen deine Handschrift.",
    ],
  },
  {
    key:   "wertschoepfen",
    icon:  "🌱",
    title: "Wertschöpfen",
    color: COLOR.gold,
    pale:  COLOR.goldPale,
    hints: [
      "Du schöpfst echten Wert — für dich und andere.",
      "Deine Arbeit hat Bedeutung über den Moment hinaus.",
      "Du handelst nachhaltig und bewusst.",
    ],
  },
  {
    key:   "impact",
    icon:  "🌍",
    title: "Impact",
    color: "#4CAF87",
    pale:  "#EDF7F2",
    hints: [
      "Deine Wirkung reicht über deinen direkten Kreis hinaus.",
      "Du denkst in größeren Zusammenhängen.",
      "Was du tust, hinterlässt Spuren.",
    ],
  },
];

// ─── Wirkungsfeld-Partikel (Canvas-basiert) ─────────────────────
function WirkungsfeldCanvas({ pillarData = {}, size = 200 }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const timeRef   = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    // Partikel-System
    const particles = Array.from({ length: 18 }, (_, i) => ({
      angle:  (i / 18) * Math.PI * 2 + Math.random() * 0.4,
      radius: 90 + Math.random() * 40,
      speed:  0.0003 + Math.random() * 0.0002,
      size:   1.2 + Math.random() * 1.8,
      opacity: 0.25 + Math.random() * 0.35,
      color:  [COLOR.teal, COLOR.coral, COLOR.gold, COLOR.green][i % 4],
      drift:  (Math.random() - 0.5) * 0.0001,
    }));

    // Resonanzkreise
    const rings = [
      { radius: 88,  opacity: 0.06, speed: 0.0001  },
      { radius: 110, opacity: 0.04, speed: -0.00008 },
      { radius: 135, opacity: 0.03, speed: 0.00006  },
    ];

    function draw(t) {
      ctx.clearRect(0, 0, W, H);

      // Sanfter Hintergrund-Glow um Logo-Bereich
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
      grd.addColorStop(0,   "rgba(13,196,181,0.04)");
      grd.addColorStop(0.6, "rgba(244,115,85,0.02)");
      grd.addColorStop(1,   "transparent");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.fill();

      // Resonanzkreise
      rings.forEach(ring => {
        const phase = Math.sin(t * ring.speed * 1000) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, ring.radius + phase * 6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(13,196,181,${ring.opacity * (0.6 + phase * 0.4)})`;
        ctx.lineWidth   = 0.8;
        ctx.stroke();
      });

      // Partikel
      particles.forEach(p => {
        p.angle += p.speed + p.drift;
        const px = cx + Math.cos(p.angle) * p.radius;
        const py = cy + Math.sin(p.angle) * p.radius * 0.85;
        const pulse = Math.sin(p.angle * 3 + t * 0.001) * 0.5 + 0.5;

        ctx.beginPath();
        ctx.arc(px, py, p.size * (0.7 + pulse * 0.3), 0, Math.PI * 2);

        // Parse hex color → rgba
        const hex = p.color.replace("#","");
        const r = parseInt(hex.slice(0,2),16);
        const g = parseInt(hex.slice(2,4),16);
        const b = parseInt(hex.slice(4,6),16);
        ctx.fillStyle = `rgba(${r},${g},${b},${p.opacity * (0.5 + pulse * 0.5)})`;
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={size * 2}
      height={size * 2}
      style={{
        width:  size,
        height: size,
        position: "absolute",
        top:    "50%",
        left:   "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        opacity: 0.9,
      }}
    />
  );
}

// ─── Logo-Zentrum ────────────────────────────────────────────────
function OrbLogoCenter({ size = 120 }) {
  return (
    <div style={{
      position:       "relative",
      width:          size,
      height:         size,
      zIndex:         10,
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
    }}>
      <img
        src='/assets/brand/hui-logo.png'
        alt="HUI"
        width={size}
        height={size}
        style={{
          width:     size,
          height:    size,
          objectFit: "contain",
          display:   "block",
          flexShrink: 0,
        }}
        draggable={false}
      />
    </div>
  );
}

// ─── Grundpfeiler-Karte ──────────────────────────────────────────
function PillarCard({ pillar, active, onToggle }) {
  const hint = useMemo(
    () => pillar.hints[Math.floor(Math.random() * pillar.hints.length)],
    [pillar.key]
  );
  return (
    <button
      onClick={onToggle}
      style={{
        width:         "100%",
        background:    active ? pillar.pale : "rgba(255,255,255,0.82)",
        border:        `1.5px solid ${active ? pillar.color + "40" : "rgba(0,0,0,0.05)"}`,
        borderRadius:  16,
        padding:       "14px 16px",
        textAlign:     "left",
        cursor:        "pointer",
        transition:    "all 0.28s cubic-bezier(0.16,1,0.30,1)",
        marginBottom:  10,
        WebkitTapHighlightColor: "transparent",
        boxShadow:     active
          ? `0 4px 16px ${pillar.color}18`
          : "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{
        display:    "flex",
        alignItems: "center",
        gap:        10,
        marginBottom: active ? 8 : 0,
        transition: "margin 0.22s ease",
      }}>
        <span style={{ fontSize: 20 }}>{pillar.icon}</span>
        <span style={{
          fontSize:   15,
          fontWeight: 700,
          color:      COLOR.ink,
          letterSpacing: -0.3,
        }}>{pillar.title}</span>
      </div>
      {active && (
        <p style={{
          margin:     0,
          fontSize:   13,
          color:      COLOR.ink2,
          lineHeight: 1.55,
          fontStyle:  "italic",
        }}>
          "{hint}"
        </p>
      )}
    </button>
  );
}

// ─── Persönliche Reise ───────────────────────────────────────────
const JOURNEY_ITEMS = [
  { period: "Heute",        icon: "✦", text: "Du bist hier." },
  { period: "Diese Woche",  icon: "◎", text: "Deine Wirkung entfaltet sich." },
  { period: "Diesen Monat", icon: "◈", text: "Was du begonnen hast, trägt Früchte." },
  { period: "Dieses Jahr",  icon: "⊙", text: "Ein Jahr voller Begegnungen und Wirkung." },
  { period: "Seit Beginn",  icon: "🌱", text: "Hier begann deine Reise in HUI." },
];

function JourneySection() {
  return (
    <div style={{ width: "100%", maxWidth: 400 }}>
      <h3 style={{
        fontSize:   13,
        fontWeight: 700,
        color:      COLOR.ink3,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        margin:     "0 0 16px 0",
      }}>Deine Reise</h3>
      <div style={{ position: "relative" }}>
        {/* Vertikale Linie */}
        <div style={{
          position:   "absolute",
          left:       14,
          top:        8,
          bottom:     8,
          width:      1,
          background: `linear-gradient(to bottom, ${COLOR.teal}40, transparent)`,
        }} />
        {JOURNEY_ITEMS.map((item, i) => (
          <div key={i} style={{
            display:     "flex",
            alignItems:  "flex-start",
            gap:         16,
            marginBottom: i < JOURNEY_ITEMS.length - 1 ? 20 : 0,
            paddingLeft:  2,
          }}>
            <div style={{
              width:          28,
              height:         28,
              borderRadius:   "50%",
              background:     i === 0 ? COLOR.teal : "rgba(255,255,255,0.9)",
              border:         `1.5px solid ${i === 0 ? COLOR.teal : "rgba(0,0,0,0.08)"}`,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       11,
              color:          i === 0 ? "#fff" : COLOR.ink3,
              flexShrink:     0,
              boxShadow:      i === 0 ? `0 2px 8px ${COLOR.teal}30` : "none",
            }}>
              {i === 0 ? "●" : item.icon}
            </div>
            <div style={{ paddingTop: 4 }}>
              <div style={{
                fontSize:   12,
                fontWeight: 700,
                color:      i === 0 ? COLOR.teal : COLOR.ink3,
                letterSpacing: 0.3,
                marginBottom: 2,
              }}>{item.period}</div>
              <div style={{
                fontSize:  13,
                color:     COLOR.ink2,
                lineHeight: 1.5,
              }}>{item.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Haupt-Komponente ────────────────────────────────────────────
export default function MemberOrbHome({
  membershipType = "member",
  onAction,
  onClose,
  profile = null,
}) {
  const [activePillar, setActivePillar] = useState(null);
  const [scrollY, setScrollY]           = useState(0);
  const scrollRef = useRef(null);

  // Parallax-Effekt: Logo bewegt sich leicht beim Scrollen
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setScrollY(el.scrollTop);
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  const firstName = profile?.display_name?.split(" ")[0]
    || profile?.full_name?.split(" ")[0]
    || profile?.username
    || "du";

  function togglePillar(key) {
    setActivePillar(prev => prev === key ? null : key);
  }

  return (
    <div style={{
      position:   "fixed",
      inset:      0,
      zIndex:     9000,
      background: COLOR.cream,
      overflow:   "hidden",
      display:    "flex",
      flexDirection: "column",
    }}>
      {/* ── Hintergrund-Atmosphäre ─────────────────────────── */}
      {/* Warmer Blob oben links */}
      <div style={{
        position:  "absolute",
        left:      "-10%",
        top:       "-5%",
        width:     320,
        height:    280,
        borderRadius: "62% 38% 55% 45% / 50% 60% 40% 50%",
        background: "radial-gradient(ellipse, rgba(244,115,85,0.07) 0%, transparent 70%)",
        filter:    "blur(60px)",
        pointerEvents: "none",
        animation: "huiOrbAtmBlob1 18s ease-in-out infinite",
      }} />
      {/* Teal Blob rechts */}
      <div style={{
        position:  "absolute",
        right:     "-8%",
        top:       "30%",
        width:     260,
        height:    240,
        borderRadius: "45% 55% 40% 60%",
        background: "radial-gradient(ellipse, rgba(13,196,181,0.07) 0%, transparent 70%)",
        filter:    "blur(70px)",
        pointerEvents: "none",
        animation: "huiOrbAtmBlob2 22s ease-in-out infinite",
      }} />
      <style>{`
        @keyframes huiOrbAtmBlob1 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%     { transform: translate(20px, 30px) scale(1.08); }
        }
        @keyframes huiOrbAtmBlob2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%     { transform: translate(-15px, 20px) scale(1.06); }
        }
      `}</style>

      {/* ── Close Button ────────────────────────────────────── */}
      <button
        onClick={onClose}
        style={{
          position:       "absolute",
          top:            "max(48px, env(safe-area-inset-top, 48px))",
          right:          20,
          width:          36,
          height:         36,
          borderRadius:   "50%",
          background:     "rgba(255,255,255,0.80)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border:         "1px solid rgba(0,0,0,0.07)",
          fontSize:       14,
          color:          COLOR.ink3,
          cursor:         "pointer",
          zIndex:         100,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          WebkitTapHighlightColor: "transparent",
        }}
      >✕</button>

      {/* ── Scroll-Container ────────────────────────────────── */}
      <div
        ref={scrollRef}
        style={{
          flex:       1,
          overflowY:  "auto",
          overflowX:  "hidden",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "max(100px, env(safe-area-inset-bottom, 100px))",
        }}
      >
        {/* ── Orb-Bereich: Logo + Wirkungsfeld ─────────────── */}
        <div style={{
          position:       "relative",
          width:          "100%",
          height:         300,
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          marginTop:      "max(60px, env(safe-area-inset-top, 60px))",
          // Parallax: leicht nach oben beim Scrollen
          transform:      `translateY(${Math.min(scrollY * 0.25, 40)}px)`,
          transition:     "transform 0s linear",
        }}>
          {/* Wirkungsfeld-Canvas (hinter Logo) */}
          <WirkungsfeldCanvas size={280} />

          {/* HUI-Logo — statisch, unverändert, unveränderlich */}
          <OrbLogoCenter size={120} />
        </div>

        {/* ── Persönliche Begrüßung ─────────────────────────── */}
        <div style={{
          textAlign:    "center",
          padding:      "0 24px 32px",
          marginTop:    -16,
        }}>
          <h1 style={{
            fontSize:      26,
            fontWeight:    800,
            color:         COLOR.ink,
            letterSpacing: -0.8,
            lineHeight:    1.2,
            margin:        "0 0 8px 0",
          }}>
            Dein Wirkungsfeld
          </h1>
          <p style={{
            fontSize:   14,
            color:      COLOR.ink3,
            lineHeight: 1.55,
            margin:     0,
            maxWidth:   280,
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            Hier wird sichtbar, was deine Handlungen
            bei anderen Menschen ausgelöst haben.
          </p>
        </div>

        {/* ── Trennlinie ─────────────────────────────────────── */}
        <div style={{
          height:     1,
          background: "rgba(0,0,0,0.05)",
          margin:     "0 24px 32px",
        }} />

        {/* ── Die fünf Grundpfeiler ──────────────────────────── */}
        <div style={{ padding: "0 20px", maxWidth: 440, margin: "0 auto" }}>
          <h3 style={{
            fontSize:   13,
            fontWeight: 700,
            color:      COLOR.ink3,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            margin:     "0 0 16px 0",
          }}>Deine Grundpfeiler</h3>

          {PILLARS.map(pillar => (
            <PillarCard
              key={pillar.key}
              pillar={pillar}
              active={activePillar === pillar.key}
              onToggle={() => togglePillar(pillar.key)}
            />
          ))}
        </div>

        {/* ── Persönliche Reise ──────────────────────────────── */}
        <div style={{
          padding:  "32px 20px 0",
          maxWidth: 440,
          margin:   "0 auto",
        }}>
          <div style={{
            height:     1,
            background: "rgba(0,0,0,0.05)",
            marginBottom: 32,
          }} />
          <JourneySection />
        </div>
      </div>
    </div>
  );
}
