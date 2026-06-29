// src/core/hui.pillars.js
// ═══════════════════════════════════════════════════════════════════════
// HUI PILLARS — Zentrale Sprach- und Grundpfeiler-Definition
// Single Source of Truth für die HUI-Philosophie in der App.
//
// DIESE DATEI IST DIE EINZIGE AUTORITATIVE QUELLE für:
//   — Grundpfeiler-Bezeichnungen (intern + öffentlich)
//   — HUI-Sprache (Labels, Beschreibungen, Feed-Hints)
//   — Pillar → UI-Mapping (Icon, Farbe, Feed-Hint)
//
// NUTZUNG überall in der App:
//   import { PILLARS, PILLAR_UI, pillarHint, HUI_LANGUAGE } from '../core/hui.pillars.js';
//
// NICHT zu verwenden:
//   — 'Follower' → stattdessen HUI_LANGUAGE.connections
//   — 'Likes'    → vollständig vermeiden
//   — 'Network'  → stattdessen HUI_LANGUAGE.community
//   — 'Seller'   → stattdessen HUI_LANGUAGE.talent
//
// ═══════════════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────────────────
// DIE FÜNF HUI-GRUNDPFEILER
// Interne Bezeichner (entsprechen DB-Enum hui_pillar)
// ─────────────────────────────────────────────────────────────────────

export const PILLARS = Object.freeze({
  VERBINDEN:     'verbinden',
  UNTERSTUETZEN: 'unterstuetzen',
  ERSCHAFFEN:    'erschaffen',
  WERTSCHOEPFEN: 'wertschoepfen',
  IMPACT:        'impact',
});

export const PILLAR_LIST = Object.freeze([
  PILLARS.VERBINDEN,
  PILLARS.UNTERSTUETZEN,
  PILLARS.ERSCHAFFEN,
  PILLARS.WERTSCHOEPFEN,
  PILLARS.IMPACT,
]);


// ─────────────────────────────────────────────────────────────────────
// PILLAR → UI MAPPING
// Alle visuellen Eigenschaften pro Grundpfeiler.
// Wird von Feed, Profil, Orb und Team Dashboard genutzt.
// ─────────────────────────────────────────────────────────────────────

export const PILLAR_UI = Object.freeze({
  [PILLARS.VERBINDEN]: {
    // Öffentliche Labels — ruhig, menschlich
    label:       'Verbinden',
    labelLong:   'Menschen zusammenbringen',
    icon:        '🤝',

    // Feed-Hint — sehr dezent
    feedHint:    '🍃 Unterstützt Verbindung',

    // "Wirkt besonders durch" — öffentliches Profil
    profileHint: 'Bringt Menschen zusammen',

    // Projekt-Matching — was sucht dieses Projekt?
    projectNeeds: 'Dieses Projekt sucht Menschen, die gerne verbinden.',

    // Design-Token
    color:       '#0DC4B5',   // HUI Teal
    colorSoft:   'rgba(13,196,181,0.10)',
    colorBorder: 'rgba(13,196,181,0.18)',
  },

  [PILLARS.UNTERSTUETZEN]: {
    label:       'Unterstützen',
    labelLong:   'Anderen helfen zu wachsen',
    icon:        '💚',
    feedHint:    '🍃 Unterstützt Gemeinschaft',
    profileHint: 'Hilft anderen zu wachsen',
    projectNeeds: 'Dieses Projekt sucht Menschen, die gerne unterstützen.',
    color:       '#22C55E',   // Warm Grün
    colorSoft:   'rgba(34,197,94,0.09)',
    colorBorder: 'rgba(34,197,94,0.16)',
  },

  [PILLARS.ERSCHAFFEN]: {
    label:       'Erschaffen',
    labelLong:   'Neues entstehen lassen',
    icon:        '🎨',
    feedHint:    '🍃 Unterstützt Erschaffen',
    profileHint: 'Lässt Neues entstehen',
    projectNeeds: 'Dieses Projekt sucht Menschen, die gerne erschaffen.',
    color:       '#F47355',   // HUI Coral
    colorSoft:   'rgba(244,115,85,0.09)',
    colorBorder: 'rgba(244,115,85,0.16)',
  },

  [PILLARS.WERTSCHOEPFEN]: {
    label:       'Wertschöpfen',
    labelLong:   'Mehrwert für andere schaffen',
    icon:        '🌱',
    feedHint:    '🍃 Unterstützt Wirkung',
    profileHint: 'Schafft Mehrwert für andere',
    projectNeeds: 'Dieses Projekt sucht Menschen, die gerne Wirkung entfalten.',
    color:       '#D4952A',   // HUI Gold
    colorSoft:   'rgba(212,149,42,0.09)',
    colorBorder: 'rgba(212,149,42,0.16)',
  },

  [PILLARS.IMPACT]: {
    label:       'Impact',
    labelLong:   'Positive Wirkung für Gemeinschaft und Welt',
    icon:        '🌍',
    feedHint:    '🍃 Unterstützt Impact',
    profileHint: 'Wirkt für Gemeinschaft und Welt',
    projectNeeds: 'Dieses Projekt sucht Menschen, die Impact schaffen möchten.',
    color:       '#0EA5E9',   // Tiefes Blau-Grün
    colorSoft:   'rgba(14,165,233,0.09)',
    colorBorder: 'rgba(14,165,233,0.16)',
  },
});


// ─────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────

/**
 * Gibt den dezenten Feed-Hint für einen Grundpfeiler zurück.
 * "🍃 Unterstützt Erschaffen"
 * @param {string} pillar — hui_pillar-Wert
 * @returns {string | null}
 */
export function pillarHint(pillar) {
  return PILLAR_UI[pillar]?.feedHint ?? null;
}

/**
 * Gibt die öffentliche Pillar-Beschreibung für das Profil zurück.
 * "Wirkt besonders durch"
 * @param {string[]} pillars — top 1–3 dominante Grundpfeiler
 * @returns {Array<{label, icon, description, color}>}
 */
export function dominantPillarLabels(pillars = []) {
  return pillars
    .map(p => {
      const ui = PILLAR_UI[p];
      if (!ui) return null;
      return {
        pillar:      p,
        label:       ui.label,
        icon:        ui.icon,
        description: ui.profileHint,
        color:       ui.color,
        colorSoft:   ui.colorSoft,
        colorBorder: ui.colorBorder,
      };
    })
    .filter(Boolean)
    .slice(0, 3);  // Maximal 3 — nicht mehr
}

/**
 * Automatische Pillar-Zuordnung für Content-Typen.
 * Wird beim Feed-Normalizer genutzt wenn kein Core-Engine-Wert vorhanden.
 * @param {'work'|'experience'|'post'|'impact_project'|'story'} contentType
 * @returns {string} — primärer Grundpfeiler
 */
export function inferPillarFromType(contentType) {
  const map = {
    work:           PILLARS.ERSCHAFFEN,
    experience:     PILLARS.ERSCHAFFEN,
    post:           PILLARS.ERSCHAFFEN,
    note:           PILLARS.ERSCHAFFEN,
    moment:         PILLARS.ERSCHAFFEN,
    story:          PILLARS.ERSCHAFFEN,
    invitation:     PILLARS.VERBINDEN,
    impact_project: PILLARS.IMPACT,
    project:        PILLARS.ERSCHAFFEN,
  };
  return map[contentType] ?? PILLARS.ERSCHAFFEN;
}

/**
 * Gibt die Projekt-Matching-Beschreibung zurück.
 * "Dieses Projekt sucht Menschen, die gerne erschaffen."
 * @param {string} pillar
 * @returns {string}
 */
export function projectNeedsLabel(pillar) {
  return PILLAR_UI[pillar]?.projectNeeds
    ?? 'Dieses Projekt sucht engagierte Menschen.';
}


// ─────────────────────────────────────────────────────────────────────
// HUI SPRACHE
// Zentrale Terminologie — ersetzt nicht-HUI-konforme Begriffe.
// Alle Labels der App sollen aus diesem Objekt kommen.
// ─────────────────────────────────────────────────────────────────────

export const HUI_LANGUAGE = Object.freeze({
  // Navigation
  feed:           'Entdecken',
  discover:       'Home',
  impact:         'Impact',
  myHui:          'Mein HUI',

  // Menschen + Gemeinschaft
  talent:         'Talent',          // ersetzt 'Seller', 'Creator'
  member:         'Mitglied',        // ersetzt 'User'
  community:      'Gemeinschaft',    // ersetzt 'Network', 'Community'
  connections:    'Verbindungen',    // ersetzt 'Followers', 'Friends'
  connection:     'Verbindung',      // ersetzt 'Follower', 'Friend'

  // Aktionen (Verben)
  connect:        'Verbinden',       // ersetzt 'Follow', 'Add friend'
  support:        'Unterstützen',    // ersetzt 'Donate', 'Fund', 'Back'
  create:         'Erschaffen',      // ersetzt 'Post', 'Publish', 'Upload'
  giveImpact:     'Impact geben',    // ersetzt 'Donate to project'
  book:           'Erleben',         // ersetzt 'Book', 'Purchase'
  buy:            'Aufnehmen',       // ersetzt 'Buy', 'Purchase'

  // Inhalte
  work:           'Werk',            // bleibt
  experience:     'Erlebnis',        // bleibt
  project:        'Projekt',         // ersetzt 'Campaign'
  impactProject:  'Impact-Projekt',
  story:          'Moment',          // ersetzt 'Story', 'Post'
  post:           'Gedanke',         // ersetzt 'Post', 'Note'

  // Räume
  huiWorld:       'HUI Welt',        // ersetzt 'Marketplace'
  studio:         'Studio',          // bleibt
  resonanz:       'Resonanz',        // ersetzt 'Engagement', 'Reactions'

  // Empfehlungen
  recommends:     'Wirkung entfalten', // ersetzt 'Recommendation'
  complementsYou: 'Ergänzt deine Wirkung',
  matchesPillar:  'Passt zu deinen Stärken',

  // Wirkung
  impact:         'Wirkung',         // kontextuell
  impactPool:     'Impact Pool',
  wirkung:        'Wirkung',

  // Was vermeiden
  // 'Likes'       → vollständig vermeiden
  // 'XP'          → vollständig vermeiden
  // 'Level'       → vollständig vermeiden
  // 'Leaderboard' → vollständig vermeiden
  // 'Ranking'     → vollständig vermeiden
  // 'Score'       → vollständig vermeiden (intern OK)
  // 'Engagement'  → → 'Wirkung' oder 'Resonanz'
});


// ─────────────────────────────────────────────────────────────────────
// CONTENT-TYP → PILLAR MAPPING für Feed-Normalizer
// ─────────────────────────────────────────────────────────────────────

/**
 * Vollständige Klassifizierungs-Tabelle für Feed-Inhalte.
 * Wird im unifiedNormalizer genutzt um pillar_hint anzuhängen.
 */
export const CONTENT_PILLAR_MAP = Object.freeze({
  work:           { primary: PILLARS.ERSCHAFFEN,    secondary: PILLARS.WERTSCHOEPFEN },
  experience:     { primary: PILLARS.ERSCHAFFEN,    secondary: PILLARS.VERBINDEN },
  invitation:     { primary: PILLARS.VERBINDEN,     secondary: null },
  moment:         { primary: PILLARS.ERSCHAFFEN,    secondary: null },
  note:           { primary: PILLARS.ERSCHAFFEN,    secondary: null },
  story:          { primary: PILLARS.ERSCHAFFEN,    secondary: null },
  impact_project: { primary: PILLARS.IMPACT,        secondary: PILLARS.VERBINDEN },
  project:        { primary: PILLARS.ERSCHAFFEN,    secondary: PILLARS.VERBINDEN },
  post:           { primary: PILLARS.ERSCHAFFEN,    secondary: null },
});
