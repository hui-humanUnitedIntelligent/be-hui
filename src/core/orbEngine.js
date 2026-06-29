// src/core/orbEngine.js
// ═══════════════════════════════════════════════════════════════════════
// HUI ORB ENGINE — Phase 2
// Liest ausschließlich die Core Engine. Erzeugt visuelle Orb-Parameter.
//
// PHILOSOPHIE:
//   Der Orb zeigt KEINE Zahlen, Levels oder Scores.
//   Er verändert sich langsam — organisch, über Wochen und Monate.
//   Der Nutzer soll gelegentlich denken: "mein Blatt sieht heute anders aus."
//
//   Die Veränderung folgt der HUI-Spirale:
//   Verbinden → Unterstützen → Erschaffen → Wertschöpfen → Impact
//
//   Das Orb-Symbol rechts neben der HUI-Sonne wächst individuell.
//   Die Sonne ist bei allen Menschen identisch.
//   Nur das Blatt entwickelt sich.
//
// VISUELLER ANSATZ:
//   Orientierung am HUI-Logo: organisch, warm, natürlich.
//   NICHT: Sci-Fi, Gaming, Kristalle, Neon, Galaxien.
//   IMMER: Blatt-Metapher, natürliche Wachstumsprozesse.
//
// NUTZUNG:
//   import { OrbEngine } from '../core/orbEngine.js';
//
//   const params = await OrbEngine.computeParams(userId);
//   // → { leafShape, color, lightIntensity, detail, animation }
//
//   // Nur visuelle Parameter — nie numerische Werte zeigen
//
// ═══════════════════════════════════════════════════════════════════════

import { CoreEngine, PILLARS } from './coreEngine.js';

// ─────────────────────────────────────────────────────────────────────
// PILLAR → VISUELL MAPPING
// Jeder Grundpfeiler hat eine eigene visuelle Qualität.
// Diese Qualitäten überlagern sich im finalen Orb.
// ─────────────────────────────────────────────────────────────────────

/**
 * Visuelle Qualitäten pro Grundpfeiler.
 * Diese Werte werden NIE direkt angezeigt —
 * sie fließen in die Berechnung der Orb-Parameter ein.
 *
 * Farbpalette orientiert sich am HUI Design System (hui.design.js).
 */
const PILLAR_VISUAL = Object.freeze({
  [PILLARS.VERBINDEN]: {
    // Warmes Teal — Verbindung, Nähe, Vertrauen
    baseHue:       174,        // Teal
    saturation:    0.72,
    lightness:     0.48,
    leafModifier:  'rounded',  // rundere Blattform — offen, einladend
    warmth:        0.75,
    glow:          'rgba(13,196,181,0.18)',
  },
  [PILLARS.UNTERSTUETZEN]: {
    // Warmes Grün — Leben, Wachstum, Fürsorge
    baseHue:       142,
    saturation:    0.58,
    lightness:     0.42,
    leafModifier:  'wide',     // breites Blatt — schützend, umarmend
    warmth:        0.85,
    glow:          'rgba(34,197,94,0.16)',
  },
  [PILLARS.ERSCHAFFEN]: {
    // Warmes Coral — Kreativität, Energie, Ursprung
    baseHue:       18,
    saturation:    0.78,
    lightness:     0.58,
    leafModifier:  'pointed',  // spitzes Blatt — Richtung, Bewegung
    warmth:        0.60,
    glow:          'rgba(244,115,85,0.16)',
  },
  [PILLARS.WERTSCHOEPFEN]: {
    // Warmes Gold — Reife, Fülle, Nachhaltigkeit
    baseHue:       40,
    saturation:    0.65,
    lightness:     0.52,
    leafModifier:  'full',     // volles Blatt — Reife, Fülle
    warmth:        0.70,
    glow:          'rgba(212,149,42,0.16)',
  },
  [PILLARS.IMPACT]: {
    // Tiefes Grün-Blau — Tiefe, Weite, Verantwortung
    baseHue:       195,
    saturation:    0.55,
    lightness:     0.38,
    leafModifier:  'deep',     // tiefes Blatt — Verwurzelung, Verantwortung
    warmth:        0.65,
    glow:          'rgba(30,150,140,0.18)',
  },
});

// ─────────────────────────────────────────────────────────────────────
// BLATT-FORMEN
// SVG-Pfade für die verschiedenen Blattqualitäten.
// Fließen aus dominanten Grundpfeilern und der organischen Wachstums-Logik.
// ─────────────────────────────────────────────────────────────────────

/**
 * Blatt-Archetypen — entstehen aus Kombinationen der Grundpfeiler.
 * Der finale Blatt-Typ ist ein Mischung aus den dominanten Pfeilern.
 */
const LEAF_ARCHETYPES = Object.freeze({
  // Hauptblatt-Formen (als SVG viewBox "0 0 60 80")
  seed: {
    // Neues Mitglied — kleines, geschlossenes Blatt
    path: 'M30,75 C15,60 8,45 10,30 C12,15 25,8 30,5 C35,8 48,15 50,30 C52,45 45,60 30,75 Z',
    name: 'seed',
  },
  sprouting: {
    // Erste Aktivität — entfaltendes Blatt
    path: 'M30,75 C14,58 6,42 9,27 C12,12 24,5 30,3 C36,5 50,13 51,28 C53,43 46,58 30,75 Z',
    name: 'sprouting',
  },
  young: {
    // Wachsend — asymmetrisch, lebendig
    path: 'M30,76 C13,57 5,39 8,24 C11,9 24,2 30,2 C37,3 51,11 52,27 C54,43 47,57 30,76 Z',
    name: 'young',
  },
  mature: {
    // Gereift — vollständiges, ausgewogenes Blatt
    path: 'M30,77 C12,56 4,37 7,21 C10,5 24,0 30,0 C36,0 50,6 53,22 C56,38 48,56 30,77 Z',
    name: 'mature',
  },
  flourishing: {
    // Blühend — lebendiges Blatt mit Details
    path: 'M30,78 C10,55 3,35 6,18 C9,2 24,-2 30,-2 C36,-2 51,3 54,19 C57,36 50,55 30,78 Z',
    name: 'flourishing',
  },
  rooted: {
    // Verwurzelt — Impact-Fokus, tief und stabil
    path: 'M30,76 C13,57 5,40 7,24 C9,8 23,1 30,0 C37,1 51,9 53,25 C55,41 47,57 30,76 Z',
    name: 'rooted',
  },
});

// ─────────────────────────────────────────────────────────────────────
// ORB PARAMETER BERECHNUNG
// Kernteil der Orb Engine.
// Transformiert Core Engine Daten → visuelle Parameter.
// ─────────────────────────────────────────────────────────────────────

/**
 * Berechnet eine geglättete Farbe aus mehreren Grundpfeilern.
 * Gewichtete Mischung basierend auf den Stärke-Werten.
 */
function blendColors(pillarStrengths) {
  let totalWeight = 0;
  let blendedH = 0, blendedS = 0, blendedL = 0, blendedW = 0;

  for (const [pillar, strength] of Object.entries(pillarStrengths)) {
    if (strength <= 0) continue;
    const visual = PILLAR_VISUAL[pillar];
    if (!visual) continue;

    blendedH += visual.baseHue * strength;
    blendedS += visual.saturation * strength;
    blendedL += visual.lightness * strength;
    blendedW += visual.warmth * strength;
    totalWeight += strength;
  }

  if (totalWeight === 0) {
    // Default: zartes Teal (neues Mitglied)
    return { h: 174, s: 0.40, l: 0.55, warmth: 0.5 };
  }

  return {
    h:      Math.round(blendedH / totalWeight),
    s:      blendedS / totalWeight,
    l:      blendedL / totalWeight,
    warmth: blendedW / totalWeight,
  };
}

/**
 * Bestimmt den Blatt-Archetyp aus dem organischen Wachstumsstand.
 * Basiert auf orb_vitality + orb_depth (NICHT auf Punkten).
 */
function selectLeafArchetype(vitality, depth, breadth) {
  const growth = (vitality * 0.5) + (depth * 0.3) + (breadth * 0.2);

  if (growth < 0.08) return LEAF_ARCHETYPES.seed;
  if (growth < 0.20) return LEAF_ARCHETYPES.sprouting;
  if (growth < 0.38) return LEAF_ARCHETYPES.young;
  if (growth < 0.58) return LEAF_ARCHETYPES.mature;
  if (growth < 0.78) return LEAF_ARCHETYPES.flourishing;
  return LEAF_ARCHETYPES.rooted;
}

/**
 * Berechnet den Glow (Licht) des Orbits.
 * Wärme des Menschen → Glüh-Intensität.
 * Organisch — niemals zu stark, niemals zu neon.
 */
function computeGlow(color, warmth, vitality) {
  const intensity = warmth * vitality * 0.7;          // Max 0.7 — nie zu aggressiv
  const dominantPillarGlow = `hsla(${color.h},${Math.round(color.s * 100)}%,${Math.round(color.l * 100)}%,${intensity.toFixed(2)})`;
  return {
    primary:   dominantPillarGlow,
    intensity: intensity,
    radius:    Math.round(24 + vitality * 20),         // 24–44px Glow-Radius
  };
}

/**
 * Berechnet die Animation-Parameter.
 * Langsam. Organisch. Nie abrupt.
 */
function computeAnimation(vitality, warmth) {
  const breathDuration = `${(6.5 - vitality * 2.5).toFixed(1)}s`;  // 4.0s–6.5s
  const floatAmplitude = Math.round(2 + vitality * 4);               // 2–6px

  return {
    breathDuration,
    breathEasing:  'ease-in-out',
    floatAmplitude,
    floatDuration: `${(8 + (1 - warmth) * 4).toFixed(1)}s`,          // 8–12s
    floatEasing:   'ease-in-out',
    transitionDuration: '2.4s',  // Langsamere Übergänge bei Orb-Änderungen
  };
}

/**
 * Berechnet subtile Details, die bei reiferen Orbits erscheinen.
 * Kleine Details — nie dominant.
 */
function computeDetails(vitality, depth, breadth, dominantPillars) {
  const details = [];

  // Kleine Äderung im Blatt (ab mittlerer Tiefe)
  if (depth > 0.3) {
    details.push({ type: 'veins', opacity: depth * 0.4 });
  }

  // Dezenter Schimmer (bei Wärme + Vitalität)
  if (vitality > 0.4 && breadth > 0.4) {
    details.push({ type: 'shimmer', opacity: breadth * 0.3 });
  }

  // Kleiner zweiter Blattansatz bei breiter Wirkung
  if (breadth > 0.65 && dominantPillars.length >= 3) {
    details.push({ type: 'secondary_leaf', opacity: (breadth - 0.65) * 2 });
  }

  return details;
}

/**
 * Prüft ob ein Core-Profil genug Daten für Orb-Individualisierung hat.
 * Ohne Personalisierung wird der Standard-Orb (defaultParams) verwendet.
 */
function hasPersonalizationData(profile) {
  if (!profile) return false;

  const {
    strength_verbinden      = 0,
    strength_unterstuetzen  = 0,
    strength_erschaffen     = 0,
    strength_wertschoepfen  = 0,
    strength_impact         = 0,
    resonance_verbinden      = 0,
    resonance_unterstuetzen  = 0,
    resonance_erschaffen     = 0,
    resonance_wertschoepfen  = 0,
    resonance_impact         = 0,
    dominant_pillars        = [],
    orb_vitality            = 0,
    orb_depth               = 0,
    orb_breadth             = 0,
  } = profile;

  if (dominant_pillars.length > 0) return true;
  if (orb_vitality > 0 || orb_depth > 0 || orb_breadth > 0) return true;

  const totalStrength = strength_verbinden + strength_unterstuetzen + strength_erschaffen
    + strength_wertschoepfen + strength_impact;
  const totalResonance = resonance_verbinden + resonance_unterstuetzen + resonance_erschaffen
    + resonance_wertschoepfen + resonance_impact;

  return totalStrength > 0 || totalResonance > 0;
}

// ─────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────
export const OrbEngine = Object.freeze({

  /**
   * Hauptmethode: Berechnet alle visuellen Orb-Parameter für einen Nutzer.
   * Liest aus der Core Engine — kein direkter DB-Zugriff.
   *
   * @param {string} userId
   * @returns {Promise<OrbParams>}
   */
  async computeParams(userId) {
    // Core Engine Daten lesen
    const coreProfile = await CoreEngine.profiles.get(userId);

    // Standard-Orb für neue / leere Nutzer — identisch auf allen Geräten
    if (!hasPersonalizationData(coreProfile)) {
      return OrbEngine.defaultParams();
    }

    const {
      // Ebene 3: Resonanzbestätigte Stärken — primäre Orb-Eingabe
      resonance_verbinden      = 0,
      resonance_unterstuetzen  = 0,
      resonance_erschaffen     = 0,
      resonance_wertschoepfen  = 0,
      resonance_impact         = 0,
      // Ebene 1: Rohe Handlungs-Stärken — Fallback wenn noch keine Resonanz
      strength_verbinden      = 0,
      strength_unterstuetzen  = 0,
      strength_erschaffen     = 0,
      strength_wertschoepfen  = 0,
      strength_impact         = 0,
      dominant_pillars        = [],
      orb_vitality            = 0,
      orb_depth               = 0,
      orb_breadth             = 0,
      orb_warmth              = 0,
    } = coreProfile;

    // Resonanz Engine: Wirkungsstärken für Orb-Farbberechnung.
    // Primär: resonance_* (bestätigte Wirkung durch andere Menschen).
    // Fallback: strength_* * 0.25 (Handlungen ohne Resonanz zählen dezent).
    // So sieht das Blatt auch für neue Nutzer nicht völlig farblos aus.
    const effectiveVerbinden     = resonance_verbinden     || strength_verbinden     * 0.25;
    const effectiveUnterstuetzen = resonance_unterstuetzen || strength_unterstuetzen * 0.25;
    const effectiveErschaffen    = resonance_erschaffen    || strength_erschaffen    * 0.25;
    const effectiveWertschoepfen = resonance_wertschoepfen || strength_wertschoepfen * 0.25;
    const effectiveImpact        = resonance_impact        || strength_impact        * 0.25;

    // Normalisieren (0.0–1.0)
    const maxStrength = Math.max(
      effectiveVerbinden, effectiveUnterstuetzen, effectiveErschaffen,
      effectiveWertschoepfen, effectiveImpact, 1
    );

    const normalizedStrengths = {
      [PILLARS.VERBINDEN]:     effectiveVerbinden     / maxStrength,
      [PILLARS.UNTERSTUETZEN]: effectiveUnterstuetzen / maxStrength,
      [PILLARS.ERSCHAFFEN]:    effectiveErschaffen    / maxStrength,
      [PILLARS.WERTSCHOEPFEN]: effectiveWertschoepfen / maxStrength,
      [PILLARS.IMPACT]:        effectiveImpact        / maxStrength,
    };

    // Berechnungen
    const color     = blendColors(normalizedStrengths);
    const leaf      = selectLeafArchetype(orb_vitality, orb_depth, orb_breadth);
    const glow      = computeGlow(color, orb_warmth, orb_vitality);
    const animation = computeAnimation(orb_vitality, orb_warmth);
    const details   = computeDetails(orb_vitality, orb_depth, orb_breadth, dominant_pillars);

    return {
      // Blatt
      leaf: {
        archetype:   leaf.name,
        path:        leaf.path,
        viewBox:     '0 0 60 80',
      },

      // Farbe
      color: {
        primary:   `hsl(${color.h},${Math.round(color.s * 100)}%,${Math.round(color.l * 100)}%)`,
        warm:      `hsl(${color.h},${Math.round(color.s * 80)}%,${Math.round((color.l + 0.08) * 100)}%)`,
        deep:      `hsl(${color.h},${Math.round(color.s * 110)}%,${Math.round((color.l - 0.08) * 100)}%)`,
        asHsl:     { h: color.h, s: Math.round(color.s * 100), l: Math.round(color.l * 100) },
      },

      // Licht
      glow,

      // Animation
      animation,

      // Details
      details,

      // Grundpfeiler (für öffentliches Profil — als Sprache, KEINE Zahlen)
      dominantPillars: dominant_pillars,

      // Interne Werte (nur für Debugging / Engine-interne Nutzung)
      _internal: {
        vitality:  orb_vitality,
        depth:     orb_depth,
        breadth:   orb_breadth,
        warmth:    orb_warmth,
      },
    };
  },

  /**
   * Standard-Parameter für neue Nutzer (noch keine Signale).
   * Kleines, zartes Blatt — voller Potenzial.
   */
  defaultParams() {
    return {
      leaf: {
        archetype: 'seed',
        path:      LEAF_ARCHETYPES.seed.path,
        viewBox:   '0 0 60 80',
      },
      color: {
        primary: 'hsl(174,40%,62%)',
        warm:    'hsl(174,32%,70%)',
        deep:    'hsl(174,48%,54%)',
        asHsl:   { h: 174, s: 40, l: 62 },
      },
      glow: {
        primary:   'hsla(174,40%,62%,0.12)',
        intensity: 0.12,
        radius:    24,
      },
      animation: {
        breathDuration:     '6.5s',
        breathEasing:       'ease-in-out',
        floatAmplitude:     2,
        floatDuration:      '12.0s',
        floatEasing:        'ease-in-out',
        transitionDuration: '2.4s',
      },
      details:         [],
      dominantPillars: [],
      _internal: { vitality: 0, depth: 0, breadth: 0, warmth: 0 },
    };
  },

  /**
   * Berechnet Orb-Parameter nur aus bereits geladenen Core-Daten.
   * Für Fälle wo das Core Profile bereits im State ist.
   * Kein DB-Aufruf.
   */
  fromCoreProfile(coreProfile) {
    if (!hasPersonalizationData(coreProfile)) return OrbEngine.defaultParams();
    return OrbEngine.computeParams.__fromProfile?.(coreProfile)
        ?? OrbEngine.defaultParams();
  },

  /**
   * Ob ein Core-Profil genug Daten für Orb-Individualisierung hat.
   * Nur für Personalisierung — nicht als Anzeige-Gate verwenden.
   */
  hasPersonalizationData,

  /**
   * Menschliche Beschreibung der dominanten Grundpfeiler.
   * Wird im öffentlichen Profil angezeigt.
   * "Wirkt besonders durch..."
   *
   * @param {string[]} pillars — hui_pillar-Werte
   * @returns {Array<{label: string, icon: string, pillar: string}>}
   */
  pillarLabels(pillars = []) {
    const labels = {
      [PILLARS.VERBINDEN]:     { label: 'Verbinden',    icon: '🤝', description: 'Bringt Menschen zusammen' },
      [PILLARS.UNTERSTUETZEN]: { label: 'Unterstützen', icon: '💚', description: 'Hilft anderen wachsen' },
      [PILLARS.ERSCHAFFEN]:    { label: 'Erschaffen',   icon: '🎨', description: 'Lässt Neues entstehen' },
      [PILLARS.WERTSCHOEPFEN]: { label: 'Wertschöpfen', icon: '🌱', description: 'Schafft Mehrwert für andere' },
      [PILLARS.IMPACT]:        { label: 'Impact',       icon: '🌍', description: 'Wirkt für Gemeinschaft und Welt' },
    };

    return pillars
      .map(p => labels[p])
      .filter(Boolean);
  },

  /**
   * Feed-Hinweis für einen Inhalt basierend auf seinem Grundpfeiler.
   * Dezent. Nicht dominant.
   * "🍃 Unterstützt Erschaffen"
   *
   * @param {string} pillar — hui_pillar-Wert
   * @returns {string | null}
   */
  feedHint(pillar) {
    const hints = {
      [PILLARS.VERBINDEN]:     '🍃 Unterstützt Verbindung',
      [PILLARS.UNTERSTUETZEN]: '🍃 Unterstützt Gemeinschaft',
      [PILLARS.ERSCHAFFEN]:    '🍃 Unterstützt Erschaffen',
      [PILLARS.WERTSCHOEPFEN]: '🍃 Unterstützt Wirkung',
      [PILLARS.IMPACT]:        '🍃 Unterstützt Impact',
    };
    return hints[pillar] ?? null;
  },

  PILLAR_VISUAL,
  LEAF_ARCHETYPES,
});
