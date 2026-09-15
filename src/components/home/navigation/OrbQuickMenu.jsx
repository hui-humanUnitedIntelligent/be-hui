// src/components/home/navigation/OrbQuickMenu.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — Orb Quick Menu („4 kleine Orbs")
// ORB-QUICKMENU (2026-09-15, Michael-Spec „Orb-Button — Talent-Upgrade &
// Quick-Upload Hub" + Korrektur „nein es sollen nur diese 4 kleinen
// orbs erscheinen"):
//
// Talent-User tippt den Nav-Orb → NUR 4 kleine Orbs ploppen fächerförmig
// um den Nav-Orb auf (Moment/Erlebnis/Werk/Talent). KEIN Bottom-Sheet,
// KEIN verdunkeltes Backdrop, keine anderen Elemente — exakt wie in
// der Spec. Tap auf einen Orb → der zugehörige Upload-Flow (identisches
// Routing wie ContentTypeSelector, SSOT-Routing liegt in Home.jsx).
// Tap irgendwo sonst → Menü schließt.
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

/* ── Typen — Reihenfolge + Farben identisch zum ContentTypeSelector ── */
function getTypes(t) {
  return [
    { key: "moment",     icon: "🌿", color: HUI.COLOR.teal,  label: t("orb.moment")   },
    { key: "experience", icon: "📅", color: "#38BDF8",       label: t("orb.erlebnis") },
    { key: "work",       icon: "🎨", color: HUI.COLOR.coral, label: t("orb.werk")     },
    { key: "talent",     icon: "⭐", color: "#34D399",        label: t("orb.talent")   },
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
              // Zentrum des Mini-Orbs auf dem Bogen um das Nav-Orb-Zentrum
              left: `calc(50% + ${Math.round(dx - MINI_ORB_D / 2)}px)`,
              bottom: Math.round(NAV_ORB_CENTER_BOTTOM + dy - MINI_ORB_D / 2),
              width: MINI_ORB_D,
              height: MINI_ORB_D,
              zIndex: 10501,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.96)",
              border: `1.5px solid ${type.color}55`,
              boxShadow: `0 6px 22px rgba(20,20,34,0.14), 0 0 0 6px ${type.color}0F, 0 2px 6px ${type.color}22`,
              // Farb-Flow in das Orb-Innere — dezent, Design-System-farben
              backgroundImage: `radial-gradient(circle at 50% 32%, ${type.color}26, rgba(255,255,255,0) 70%)`,
              "--oq-x0": `${x0}px`,
              "--oq-y0": `${y0}px`,
              "--oq-x1": `0px`,
              "--oq-y1": `0px`,
              animation: `oq-pop 0.42s cubic-bezier(.34,1.56,.64,1) ${idx * 55}ms both`,
            }}
          >
            {/* Icon */}
            <span style={{ fontSize: 22, lineHeight: 1 }}>{type.icon}</span>
            {/* Label direkt unter dem Icon IM Orb (klein, muted) */}
            <span style={{
              fontSize: 9.5,
              fontWeight: 600,
              color: "#55556B",
              marginTop: 1,
              letterSpacing: -0.1,
              textAlign: "center",
              lineHeight: 1.1,
              maxWidth: "90%",
            }}>{type.label}</span>
          </div>
        );
      })}
    </>,
    document.body
  );
}
