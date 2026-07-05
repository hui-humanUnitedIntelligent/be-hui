// src/features/resonance/foundation/resonanceSections.js
// ─────────────────────────────────────────────────────────────────
// HUI Release Phase 1.6 — Meine Resonanz Foundation
// Zentrale Sektions-Registry. Reihenfolge hier änderbar ohne Refactoring.
// ─────────────────────────────────────────────────────────────────

import TimelineSection         from "./sections/TimelineSection.jsx";
import ResonanzzentrumSection  from "./sections/ResonanzzentrumSection.jsx";
import DeinRaumSection         from "./sections/DeinRaumSection.jsx";
import ErlebtSection           from "./sections/ErlebtSection.jsx";
import EmpfehlungenSection     from "./sections/EmpfehlungenSection.jsx";

/**
 * Offizielle Sektionen der persönlichen Erlebniswelt.
 * Reihenfolge ist bewusst flexibel vorbereitet — Phase 1.7 kann
 * die Navigationsreihenfolge anpassen, ohne Komponenten zu ändern.
 */
export const RESONANCE_SECTIONS = Object.freeze([
  {
    id:        "timeline",
    label:     "Timeline",
    tagline:   "Alles, was mich bewegt hat",
    icon:      "✨",
    component: TimelineSection,
  },
  {
    id:        "dein-raum",
    label:     "Dein Raum",
    tagline:   "Gespeicherte Inhalte, Favoriten, Merklisten",
    icon:      "🔖",
    component: DeinRaumSection,
  },
  {
    id:        "erlebt",
    label:     "Erlebt",
    tagline:   "Buchungen, Käufe, besuchte Erlebnisse, unterstützte Projekte",
    icon:      "🌿",
    component: ErlebtSection,
  },
  {
    id:        "empfehlungen",
    label:     "Empfehlungen",
    tagline:   "Von mir ausgesprochene Empfehlungen",
    icon:      "⭐",
    component: EmpfehlungenSection,
  },
  {
    id:        "resonanzzentrum",
    label:     "Resonanzzentrum",
    tagline:   "Alles, was zu mir zurückkommt",
    icon:      "🔔",
    component: ResonanzzentrumSection,
  },
]);

export const DEFAULT_SECTION_ID = "timeline";

export function getSectionById(id) {
  return RESONANCE_SECTIONS.find(s => s.id === id) || RESONANCE_SECTIONS[0];
}

export function isValidSectionId(id) {
  return RESONANCE_SECTIONS.some(s => s.id === id);
}
