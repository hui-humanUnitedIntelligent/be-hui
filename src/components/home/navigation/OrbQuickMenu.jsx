// src/components/home/navigation/OrbQuickMenu.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — Orb Quick Menu („4 kleine Orbs")
// ORB-QUICKMENU (2026-09-15, Michael-Spec „Orb-Button — Talent-Upgrade &
// Quick-Upload Hub" + Korrekturen:
//   1. „nein es sollen nur diese 4 kleinen orbs erscheinen" → kein
//      Bottom-Sheet, nur die 4 Orbs.
//   2. „farblich mehr Variationen.. nicht alle gleich machen" → jeder
//      Orb bekam kurz eine eigene kräftige Gradient-Farbe.
//   3. „nein die farben dürfen schwach sein und überlaufen aber mehr
//      variation.. und mache die orbs näher an den grossen orb ran..
//      dichter" + „nein so war schöner" (Screenshot der WEISSEN
//      Variante, aber enger) → FINAL: weiße/soft Orbs mit dezentem,
//      nach außen ÜBERLAUFENDEM Farb-Glow (radial-gradient bleed) +
//      farbiger Rand, mehr Farb-Varianz zwischen den 4 Typen, UND
//      deutlich dichter am großen Nav-Orb (Bogenradius 150→98px).
//
// Talent-User tippt den Nav-Orb → NUR 4 kleine Orbs ploppen fächerförmig
// dicht um den Nav-Orb auf (Moment/Erlebnis/Werk/Talent). KEIN Sheet,
// KEIN verdunkeltes Backdrop, keine anderen Elemente. Tap auf einen
// Orb → zugehöriger Upload-Flow (Routing-SSOT: openContentFlow in
// Home.jsx, geteilt mit ContentTypeSelector). Tap sonstwo → schließt.
//
// Geometrie: Nav-Orb Ø 102px (ORB_D, LOCKED — navigationGeometry.js),
// Zentrum ~52px über dem Viewport-Grund, horizontal zentriert. Die 4
// Mini-Orbs (Ø 58px) fächern jetzt auf einem ENGEN Bogen R=98px bei
// ±22°/±58° um dieses Zentrum auf — deutlich dichter als die vorherige
// Version (R=150px), berühren sich aber nicht mit dem Nav-Orb (Radius
// 51px + Bogen 98px − Mini-Orb-Radius 29px = 18px Luft am engsten Punkt).
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
const ARC_R                 = 98;   // Bogenradius — dicht am Nav-Orb (war 150)
const MINI_ORB_D            = 58;   // Ø Mini-Orb
const ANGLES                = [-58, -22, 22, 58]; // ° von der Senkrechten (etwas enger gefächert)

/* ── Typen — je eigene, aber SANFTE Farb-Welt (weiß + Bleed-Glow) ── */
function getTypes(t) {
  return [
    {
      key: "moment", icon: "🌿", label: t("orb.moment"),
      tint: HUI.COLOR.teal,   glowSoft: "rgba(13,196,181,0.30)",  glowFar: "rgba(13,196,181,0.10)",
    },
    {
      key: "experience", icon: "📅", label: t("orb.erlebnis"),
      tint: "#38BDF8",         glowSoft: "rgba(56,189,248,0.32)", glowFar: "rgba(56,189,248,0.11)",
    },
    {
      key: "work", icon: "🎨", label: t("orb.werk"),
      tint: HUI.COLOR.coral,  glowSoft: "rgba(244,115,85,0.32)",  glowFar: "rgba(244,115,85,0.11)",
    },
    {
      key: "talent", icon: "⭐", label: t("orb.talent"),
      tint: "#8B5CF6",         glowSoft: "rgba(139,92,246,0.30)", glowFar: "rgba(139,92,246,0.11)",
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

      {/* Die 4 kleinen Orbs — dicht fächerförmig um das Nav-Orb-Zentrum */}
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
            {/* Weißer/soft Orb-Körper mit ÜBERLAUFENDEM Farb-Glow (radial
                Bleed nach außen, deutlich über den eigenen Rand hinaus)
                + dezentem farbigem Rand. Kein kräftiger Farbkörper mehr. */}
            <div style={{
              width: MINI_ORB_D,
              height: MINI_ORB_D,
              borderRadius: "50%",
              background: `radial-gradient(circle at 50% 38%, ${type.glowSoft}, rgba(255,255,255,0.97) 62%)`,
              border: `1.5px solid ${type.tint}40`,
              // Zwei Glow-Ebenen: enger + weiter ausgreifender, schwächerer Bleed
              boxShadow: `0 0 0 10px ${type.glowFar}, 0 8px 20px rgba(20,20,34,0.10), 0 2px 6px ${type.glowSoft}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ fontSize: 21, lineHeight: 1 }}>{type.icon}</span>
            </div>
            {/* Label unter dem Orb — Ink, Design-System-Farben */}
            <div style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: "#55556B",
              marginTop: 5,
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
