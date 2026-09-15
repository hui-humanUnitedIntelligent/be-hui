// src/components/home/navigation/OrbQuickMenu.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — Orb Quick Menu („4 kleine Orbs")
// ORB-QUICKMENU (2026-09-15, Michael-Spec „Orb-Button — Talent-Upgrade &
// Quick-Upload Hub" + Korrektur „nein es sollen nur diese 4 kleinen
// orbs erscheinen" + Farbwunsch „farblich mehr Variationen — nicht
// alle gleich machen"):
//
// Talent-User tippt den Nav-Orb → NUR 4 kleine Orbs ploppen fächerförmig
// um den Nav-Orb auf (Moment/Erlebnis/Werk/Talent). KEIN Bottom-Sheet,
// KEIN verdunkeltes Backdrop, keine anderen Elemente — exakt wie in
// der Spec. Tap auf einen Orb → der zugehörige Upload-Flow (identisches
// Routing wie ContentTypeSelector, SSOT-Routing liegt in Home.jsx).
// Tap irgendwo sonst → Menü schließt.
//
// Farb-Design (Michaels Korrektur 15.09.): Jeder Orb ist ein EIGENER
// Farb-Körper (farbiger Gradient + weißer Icon-Kern + farbiger Glow)
// statt der bisherigen weißen Einheits-Optik mit farbigem Rand:
//   Moment   = Türkis-Gradient (#0DC4B5 → #079B8E)
//   Erlebnis = Himmelblau   (#38BDF8 → #0284C7)
//   Werk     = Coral        (#F47355 → #D9532E)
//   Talent   = Mint-Grün    (#34D399 → #059669)
// Label steht in Ink unter dem Orb (Design-System-Farben).
//
// Geometrie: Nav-Orb ist Ø 102px (ORB_D, LOCKED — siehe
// navigationGeometry.js), Zentrum sitzt ~52px über dem Viewport-Grund,
// horizontal zentriert. Die 4 Mini-Orbs (Ø 58px) fächern auf einem
// Bogen R=150px bei ±20°/±60° um dieses Zentrum auf.
//
// Portal-Regel: createPortal auf document.body + zIndex >= 10500
// (footer-navbar-zindex.md). Der Click-Catcher ist TRANSPARENT —
// die Navbar inkl. Nav-Orb bleibt sichtbar, Tap = schließen.
// ═══════════════════════════════════════════════════════════════

import React from "react";
import { createPortal } from "react-dom";
import { HUI } from "../../../design/hui.design.js";
import { useTranslation } from "../../../hooks/useTranslation.js";

/* ── Geometrie-Konstanten (von navigationGeometry.js abgeleitet) ── */
const NAV_ORB_CENTER_BOTTOM = 52;   // px über Viewport-Grund (Orb-Zentrum)
const ARC_R                 = 150;  // Bogenradius um das Orb-Zentrum
const MINI_ORB_D            = 58;   // Ø Mini-Orb
const ANGLES                = [-60, -20, 20, 60]; // ° von der Senkrechten

/* ── Typen — je eigene Farb-Welt (Gradient hell→dunkel + Glow) ── */
function getTypes(t) {
  return [
    {
      key: "moment", icon: "🌿", label: t("orb.moment"),
      c1: HUI.COLOR.teal, c2: "#079B8E", glow: "rgba(13,196,181,0.38)",
    },
    {
      key: "experience", icon: "📅", label: t("orb.erlebnis"),
      c1: "#38BDF8", c2: "#0284C7", glow: "rgba(56,189,248,0.40)",
    },
    {
      key: "work", icon: "🎨", label: t("orb.werk"),
      c1: HUI.COLOR.coral, c2: "#D9532E", glow: "rgba(244,115,85,0.40)",
    },
    {
      key: "talent", icon: "⭐", label: t("orb.talent"),
      c1: "#34D399", c2: "#059669", glow: "rgba(52,211,153,0.40)",
    },
  ];
}

const CSS = `
  @keyframes oq-fade { from{opacity:0} to{opacity:1} }
  @keyframes oq-pop {
    0%   { transform: translate(var(--oq-x0), var(--oq-y0)) scale(0.2); opacity: 0; }
    70%  { transform: translate(var(--oq-x1), var(--oq-y1)) scale(1.08); opacity: 1; }
    100% { transform: translate(var(--oq-x1), var(--oq-y1)) scale(1); opacity: 1; }
  }
  .oq-tap { cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .oq-tap:active { transform: translate(var(--oq-x1), var(--oq-y1)) scale(0.9) !important; }
`;

/* ── Haupt-Komponente ─────────────────────────────────────────── */
export default function OrbQuickMenu({ onSelect, onClose }) {
  const { t } = useTranslation();
  const types = getTypes(t);

  const DEG = Math.PI / 180;

  return createPortal(
    <>
      <style>{CSS}</style>

      {/* Transparenter Click-Catcher — Navbar bleibt SICHTBAR,
          Tap irgendwo = Menü schließen. Portal-Pflicht: zIndex 10500. */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10500,
          background: "transparent",
        }}
      />

      {/* Die 4 kleinen Orbs — fächerförmig um das Nav-Orb-Zentrum */}
      {types.map((type, idx) => {
        const a  = ANGLES[idx] * DEG;
        const dx = Math.sin(a) * ARC_R;          // − = links, + = rechts
        const dy = Math.cos(a) * ARC_R;          // über dem Orb-Zentrum
        // Pop-Animation: Start im Orb-Zentrum (Offset -dx, +dy zur Ruheposition)
        const x0 = -dx, y0 = dy;

        return (
          <div
            key={type.key}
            className="oq-tap"
            role="button"
            tabIndex={0}
            aria-label={type.label}
            onClick={() => onSelect?.(type.key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(type.key); }
            }}
            style={{
              position: "fixed",
              // Orb-Zentrum auf dem Bogen um das Nav-Orb-Zentrum
              left: `calc(50% + ${Math.round(dx - MINI_ORB_D / 2)}px)`,
              bottom: Math.round(NAV_ORB_CENTER_BOTTOM + dy - MINI_ORB_D / 2),
              zIndex: 10501,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              "--oq-x0": `${x0}px`,
              "--oq-y0": `${y0}px`,
              "--oq-x1": "0px",
              "--oq-y1": "0px",
              animation: `oq-pop 0.42s cubic-bezier(.34,1.56,.64,1) ${idx * 55}ms both`,
            }}
          >
            {/* Farb-Orb: Gradient + weißer Ring + farbiger Glow */}
            <div style={{
              width: MINI_ORB_D,
              height: MINI_ORB_D,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${type.c1}, ${type.c2})`,
              border: "1.5px solid rgba(255,255,255,0.55)",
              boxShadow: `0 10px 26px ${type.glow}, 0 0 0 4px rgba(255,255,255,0.55), 0 2px 6px rgba(20,20,34,0.16)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {/* Weißer Icon-Kern mit Emoji */}
              <div style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "inset 0 1px 3px rgba(20,20,34,0.10)",
              }}>
                <span style={{ fontSize: 19, lineHeight: 1 }}>{type.icon}</span>
              </div>
            </div>
            {/* Label unter dem Orb — Ink, Design-System-Farben */}
            <div style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: "#55556B",
              marginTop: 6,
              letterSpacing: -0.1,
              textAlign: "center",
              lineHeight: 1.2,
              maxWidth: 76,
            }}>{type.label}</div>
          </div>
        );
      })}
    </>,
    document.body
  );
}
