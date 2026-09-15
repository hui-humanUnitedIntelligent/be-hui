// src/components/home/navigation/OrbQuickMenu.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — Orb Quick Menu („4 kleine Orbs")
// ORB-QUICKMENU (2026-09-15, Michael-Spec „Orb-Button — Talent-Upgrade &
// Quick-Upload Hub" + Korrekturen im Verlauf des Tages):
//   1. „nur die 4 kleinen orbs erscheinen" → kein Bottom-Sheet.
//   2. „farblich mehr Variationen" → dann „schwach/überlaufend, dichter"
//      → dann „mach sie kleiner, nicht überlappend" (Ø58→46px).
//   3. FINAL: „sieht furchtbar aus.. mach es in gleichen Abständen vom
//      Haupt-Orb zu den kleinen Orbs.. im Fächer.. identisch und schön..
//      der Text soll IN den Orb, Emojis entfernen, mit Icons arbeiten":
//      - Fächer-Winkel jetzt GLEICHMÄSSIG verteilt (36°-Schritte:
//        ±18°/±54° statt der vorherigen ungleichen ±20°/±60° — dadurch
//        war der Abstand zwischen den inneren beiden Orbs sichtbar
//        enger als zu den äußeren, wirkte schief/unsymmetrisch).
//      - Alle 4 Orbs liegen auf demselben Bogenradius (R=112px) um das
//        Nav-Orb-Zentrum → per Definition GLEICHER Abstand zum Haupt-Orb.
//      - Emoji ersetzt durch echte HUI-System-Icons (SVG, Design-System-
//        SSOT aus HuiSystemIcons.jsx — Wiederverwendung statt Neubau,
//        siehe Architektur-Charta Prinzip 1+2): HUIMomenteIcon,
//        HUIKalenderIcon, HUIWerkeIcon, HUITalentStarIcon.
//      - Label steht jetzt IM Orb (Icon oben, kurzes Substantiv darunter,
//        z.B. "Moment"/"Erlebnis"/"Werk"/"Talent") statt darunter —
//        Wiederverwendung bestehender i18n-Keys (feed.createMoment,
//        profile.erlebnisLabel/werkLabel/talentLabel), keine neuen Keys.
//
// Talent-User tippt den Nav-Orb → NUR 4 kleine Orbs ploppen dicht und
// gleichmäßig gefächert um den Nav-Orb auf. KEIN Sheet, KEIN Backdrop.
// Tap auf einen Orb → zugehöriger Upload-Flow (Routing-SSOT:
// openContentFlow in Home.jsx, geteilt mit ContentTypeSelector).
// Tap sonstwo → schließt.
//
// Geometrie: Nav-Orb Ø102px (ORB_D, LOCKED), Zentrum ~52px über dem
// Viewport-Grund. Mini-Orbs Ø46px auf Bogen R=112px, Winkel ±18°/±54°
// (drei gleiche 36°-Schritte) — Abstand zwischen benachbarten Orbs
// überall identisch (~69px Zentrum-zu-Zentrum), Luft zum Nav-Orb ~38px,
// Luft zwischen den Mini-Orbs ~13px (kein Überlappen).
//
// Portal-Regel: createPortal auf document.body + zIndex >= 10500
// (footer-navbar-zindex.md). Der Click-Catcher ist TRANSPARENT —
// die Navbar inkl. Nav-Orb bleibt sichtbar, Tap = schließen.
// ═══════════════════════════════════════════════════════════════

import React from "react";
import { createPortal } from "react-dom";
import { HUI } from "../../../design/hui.design.js";
import { useTranslation } from "../../../hooks/useTranslation.js";
import {
  HUIMomenteIcon,
  HUIKalenderIcon,
  HUIWerkeIcon,
  HUITalentStarIcon,
} from "../../../design/icons/HuiSystemIcons.jsx";

/* ── Geometrie-Konstanten (von navigationGeometry.js abgeleitet) ── */
const NAV_ORB_CENTER_BOTTOM = 52;   // px über Viewport-Grund (Orb-Zentrum)
const ARC_R                 = 112;  // Bogenradius — dicht am Nav-Orb, alle 4 gleich weit
const MINI_ORB_D            = 46;   // Ø Mini-Orb
const ANGLES                = [-54, -18, 18, 54]; // ° — GLEICHMÄSSIGE 36°-Schritte

/* ── Typen — je eigene, aber SANFTE Farb-Welt (weiß + Bleed-Glow) ── */
function getTypes(t) {
  // ORB-SOFTTINT-001 (2026-09-15, Michael-Entscheid "Variante B — Zarte
  // Toenung"): Glow voellig entfernt (Michael: "mir gefaellt der Glow nicht").
  // Statt radialem Bleed-Glow FLACHE Toenung (kein Verlauf) — Icon + Label
  // in Originalfarbe, KEIN Halo noetig.
  //
  // ORB-SOLID-FILL (2026-09-15, Michael-Entscheid "mach viel mehr deckkraft
  // das wirkt zu schwach und ich denke die Prozente sind auch zu wenig. und
  // nicht transparent"): Transparenz KOMPLETT raus. Die Mini-Orbs bekommen
  // VOLL DECKENDE Markenfarbe (Fill = reiner Farbton, alpha 1.0 — kein
  // rgba-Mix mehr, der auf hellem Grund wie dem Discover-Hintergrund
  // unsichtbar verschwimmt). Rand = weiss 90% fuer klare Kante auf jedem
  // Hintergrund. Icon + Label weiss fuer Kontrast auf der Vollfarbe.
  // Weiterhin FLACH (kein Verlauf, kein Glow, kein Halo) — B-Version-Geist,
  // aber satt sichtbar.
  return [
    {
      key: "moment", Icon: HUIMomenteIcon, label: t("feed.createMoment"),
      tint: "#FFFFFF", fill: HUI.COLOR.teal, ring: "rgba(255,255,255,0.9)",
    },
    {
      key: "experience", Icon: HUIKalenderIcon, label: t("profile.erlebnisLabel"),
      tint: "#FFFFFF", fill: "#38BDF8",      ring: "rgba(255,255,255,0.9)",
    },
    {
      key: "work", Icon: HUIWerkeIcon, label: t("profile.werkLabel"),
      tint: "#FFFFFF", fill: HUI.COLOR.coral, ring: "rgba(255,255,255,0.9)",
    },
    {
      key: "talent", Icon: HUITalentStarIcon, label: t("profile.talentLabel"),
      tint: "#FFFFFF", fill: "#8B5CF6",      ring: "rgba(255,255,255,0.9)",
    },
  ];
}

const CSS = `
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

      {/* Die 4 kleinen Orbs — gleichmäßig gefächert, alle im selben
          Abstand zum Nav-Orb-Zentrum */}
      {types.map((type, idx) => {
        const a  = ANGLES[idx] * DEG;
        const dx = Math.sin(a) * ARC_R;          // − = links, + = rechts
        const dy = Math.cos(a) * ARC_R;          // über dem Orb-Zentrum
        // Pop-Animation: Start im Orb-Zentrum (Offset -dx, +dy zur Ruheposition)
        const x0 = -dx, y0 = dy;
        const OrbIcon = type.Icon;

        return (
          <button
            key={type.key}
            type="button"
            className="oq-tap"
            aria-label={type.label}
            onClick={() => onSelect?.(type.key)}
            style={{
              position: "fixed",
              left: `calc(50% + ${Math.round(dx - MINI_ORB_D / 2)}px)`,
              bottom: Math.round(NAV_ORB_CENTER_BOTTOM + dy - MINI_ORB_D / 2),
              width: MINI_ORB_D,
              height: MINI_ORB_D,
              zIndex: 10501,
              border: `2px solid ${type.ring}`,
              borderRadius: "50%",
              padding: 0,
              margin: 0,
              // ORB-SOFTTINT-VISIBILITY-FIX (2026-09-15): FLACHE Toenung,
              // aber deutlich kraeftiger (24% Fill / 65% Ring) als die
              // urspruengliche B-Auslegung, damit die Orbs auf JEDEM
              // Hintergrund (v.a. helle Discover-Karten) klar erkennbar
              // sind. Weiterhin kein Verlauf, kein Glow, kein Halo.
              background: type.fill,
              boxShadow: `0 3px 10px rgba(20,20,34,0.16)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              "--oq-x0": `${x0}px`,
              "--oq-y0": `${y0}px`,
              "--oq-x1": "0px",
              "--oq-y1": "0px",
              animation: `oq-pop 0.42s cubic-bezier(.34,1.56,.64,1) ${idx * 55}ms both`,
            }}
          >
            {/* Echtes SVG-Icon statt Emoji — Design-System-SSOT */}
            <OrbIcon size={17} style={{ color: type.tint }} />
            {/* Kurzes Substantiv IM Orb — bestehende i18n-Keys wiederverwendet */}
            <span style={{
              fontSize: 8.5,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: -0.1,
              lineHeight: 1,
              maxWidth: 40,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>{type.label}</span>
          </button>
        );
      })}
    </>,
    document.body
  );
}
