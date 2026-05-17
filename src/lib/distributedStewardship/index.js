// src/lib/distributedStewardship/index.js
// HUI — Distributed Stewardship Engine — Phase 8B
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Macht die rotiert ist gesünder als Macht die akkumuliert.
// HUI verteilt kulturelle Verantwortung — ohne Chaos.
//
// STEWARD-ROLLE:
//   ✅ Kulturelle Begleiter
//   ✅ Lokale Perspektivträger
//   ✅ Resonanz-Pfleger
//   ✅ Konflikt-Vermittler
//   ✅ Kulturelle Übersetzer
//   ❌ Keine dauerhaften Posten (max 6 Monate)
//   ❌ Keine Sanktionsmacht
//   ❌ Keine wirtschaftlichen Entscheidungen
//
// FUNKTIONEN:
//   stewardshipDistribution()  → Verteilung der Stewardship-Verantwortung
//   regionalRepresentation()   → Regionale Repräsentation in Governance
//   culturalLegitimacy()       → Legitimität der Stewardship-Strukturen
//   stewardshipRotation()      → Rotations-Gesundheit
//   governanceResilience()     → Stabilität bei Steward-Ausfällen
//   localContextIntegrity()    → Kontext-Nähe der Stewards
//   culturalContextModeration()→ Kontext-bewusste Moderation
//   stewardshipHealthScore()   → Gesamtscore verteilter Governance
// ═══════════════════════════════════════════════════════════════

import { communityRepresentation, governanceHealth }
  from '@/lib/stewardship/index';
import { culturalAutonomy, regionalResonance }
  from '@/lib/federation/index';
import { getSeason } from '@/lib/culture/index';

const clamp = (v, min = 0, max = 1) => Math.min(Math.max(v, min), max);
function daysSince(d) { return d ? (Date.now() - new Date(d).getTime()) / 86400000 : 0; }
function gini(values) {
  const s = [...values].sort((a, b) => a - b);
  const n = s.length; const total = s.reduce((a, b) => a + b, 0) || 1;
  return Math.abs(s.reduce((acc, v, i) => acc + (2 * i - n - 1) * v, 0) / (n * total));
}

// ── Stewardship-Konstanten ──────────────────────────────────────
export const STEWARD_CYCLE = {
  ACTIVE_MONTHS:   4,   // Volle Verantwortung
  HANDOVER_MONTHS: 1,   // Übergabe mit Nachfolger
  RETREAT_MONTHS:  1,   // Beratend, kein Entscheidungsrecht
  MIN_PAUSE_MONTHS:6,   // Mindest-Pause vor Re-Entry
  TOTAL_MONTHS:    6,   // Aktiv-Zyklus gesamt
};

export const STEWARD_LIMITS = {
  MAX_ACTIVE_CASES_WEEK: 15,    // Warnung über diesem Wert
  CRITICAL_CASES_WEEK:   25,    // Kritisch über diesem Wert
  MAX_REGIONS_PER_STEWARD: 3,   // Max Regionen pro Steward
  MIN_STEWARD_COVERAGE:  0.60,  // Mind. 60% Regionen mit Steward
  MAX_STAGNATION_MONTHS: 8,     // Warnung wenn keine Rotation
};

// ── Steward-Rollen (nie Status, immer Funktion) ─────────────────
export const STEWARD_ROLES = {
  companion: {
    label:       'Kulturelle Begleiterin / Kultureller Begleiter',
    description: 'Hält kreative Räume offen. Bemerkt wenn Atmosphäre kippt.',
    power:       'keine Entscheidungsmacht — nur Impulse',
    duration:    `${STEWARD_CYCLE.TOTAL_MONTHS} Monate`,
  },
  mediator: {
    label:       'Vermittlerin / Vermittler',
    description: 'De-eskaliert bevor Moderation nötig wird. Sucht gemeinsamen Boden.',
    power:       'keine Sanktionen — nur Gespräch',
    duration:    `${STEWARD_CYCLE.TOTAL_MONTHS} Monate`,
  },
  translator: {
    label:       'Kulturelle Übersetzerin / Übersetzer',
    description: 'Vermittelt zwischen Sprachen und Ästhetiken.',
    power:       'keine Entscheidungen — nur Kontext',
    duration:    `${STEWARD_CYCLE.TOTAL_MONTHS} Monate`,
  },
  resonance_keeper: {
    label:       'Resonanz-Pflegerin / Resonanz-Pfleger',
    description: 'Beobachtet kulturelle Gesundheit einer Region. Gibt Impulse.',
    power:       'keine Kontrolle — nur Wahrnehmung',
    duration:    `${STEWARD_CYCLE.TOTAL_MONTHS} Monate`,
  },
};

// ── 8B.2 — stewardshipDistribution() ───────────────────────────
/**
 * Wie gut ist Stewardship-Verantwortung verteilt?
 * Misst: regionale Abdeckung, Generationen-Balance, Rollen-Vielfalt.
 */
export function stewardshipDistribution(stewards = [], regions = []) {
  if (!stewards.length) {
    return { distribution: 0, level: 'keine Stewards', warnings: ['Stewardship-Struktur fehlt'] };
  }

  // Regionale Abdeckung
  const stewardedRegions = new Set(stewards.flatMap(s => s.regions || []));
  const allRegions       = new Set(regions.map(r => r.toLowerCase()));
  const coverage         = allRegions.size > 0
    ? stewardedRegions.size / allRegions.size : 0;

  // Generationen-Balance
  const tenureGroups = { fresh: 0, growing: 0, established: 0, veteran: 0 };
  for (const s of stewards) {
    const days = daysSince(s.platform_joined);
    if (days < 90)        tenureGroups.fresh++;
    else if (days < 365)  tenureGroups.growing++;
    else if (days < 730)  tenureGroups.established++;
    else                  tenureGroups.veteran++;
  }
  const total           = stewards.length;
  const genBalance      = clamp(
    (tenureGroups.fresh > 0 ? 0.25 : 0) +
    (tenureGroups.growing > 0 ? 0.25 : 0) +
    (tenureGroups.established > 0 ? 0.25 : 0) +
    (tenureGroups.veteran > 0 ? 0.25 : 0)
  );

  // Rollen-Vielfalt
  const roles        = new Set(stewards.map(s => s.role));
  const roleVariety  = clamp(roles.size / Object.keys(STEWARD_ROLES).length);

  // Geschlechter-/Identitäts-Balance (wenn Daten vorhanden)
  const hasGenderData = stewards.some(s => s.gender_identity);
  const identityBalance = hasGenderData
    ? clamp(new Set(stewards.map(s => s.gender_identity).filter(Boolean)).size / 3)
    : 0.5;  // Unbekannt → neutral

  const distribution = clamp(
    coverage          * 0.40 +
    genBalance        * 0.25 +
    roleVariety       * 0.20 +
    identityBalance   * 0.15
  );

  const warnings = [];
  if (coverage < STEWARD_LIMITS.MIN_STEWARD_COVERAGE)
    warnings.push(`Nur ${Math.round(coverage * 100)}% der Regionen haben einen Steward.`);
  if (tenureGroups.fresh === 0)
    warnings.push('Keine frischen Stimmen (<90 Tage) in Stewardship.');
  if (roles.size < 2)
    warnings.push('Zu wenig Rollen-Vielfalt — nur eine Steward-Funktion aktiv.');

  return {
    distribution: Math.round(distribution * 100) / 100,
    coverage:     Math.round(coverage     * 100) / 100,
    genBalance:   Math.round(genBalance   * 100) / 100,
    roleVariety:  Math.round(roleVariety  * 100) / 100,
    stewardCount: stewards.length,
    stewardedRegions: stewardedRegions.size,
    totalRegions:     allRegions.size,
    tenureGroups,
    warnings,
    level:
      distribution > 0.75 ? 'gut verteilt'   :
      distribution > 0.55 ? 'mäßig verteilt' :
      distribution > 0.35 ? 'eingeschränkt'  : 'stark zentralisiert',
  };
}

// ── 8B.2 — regionalRepresentation() ────────────────────────────
/**
 * Regionale Repräsentation in Governance-Entscheidungen.
 * Misst: welche Regionen haben Stimme, welche nicht?
 */
export function regionalRepresentation(stewards = [], allCreators = []) {
  // Creator-Verteilung nach Region
  const creatorsByRegion = {};
  for (const c of allCreators) {
    const r = c.location_label?.toLowerCase().trim() || 'unbekannt';
    creatorsByRegion[r] = (creatorsByRegion[r] || 0) + 1;
  }

  // Steward-Abdeckung nach Region
  const stewardedRegions = new Set(stewards.flatMap(s => s.regions || []));

  // Welche großen Regionen haben keinen Steward?
  const underrepresented = Object.entries(creatorsByRegion)
    .filter(([region, count]) => count >= 3 && !stewardedRegions.has(region))
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([region, count]) => ({ region, creatorCount: count }));

  // Gini über Steward-Verteilung
  const stewardCountByRegion = {};
  for (const s of stewards) {
    for (const r of (s.regions || [])) {
      stewardCountByRegion[r] = (stewardCountByRegion[r] || 0) + 1;
    }
  }
  const repGini = Object.keys(creatorsByRegion).length > 0
    ? gini(Object.keys(creatorsByRegion).map(r => stewardCountByRegion[r] || 0))
    : 0;

  const representationScore = clamp(
    (1 - repGini)                       * 0.50 +
    (1 - underrepresented.length / 10)  * 0.30 +
    (stewards.length > 0 ? 0.20 : 0)
  );

  return {
    score:            Math.round(representationScore * 100) / 100,
    repGini:          Math.round(repGini             * 100) / 100,
    underrepresented,
    stewardedRegions: stewardedRegions.size,
    totalRegions:     Object.keys(creatorsByRegion).length,
    level:
      representationScore > 0.75 ? 'breit vertreten'  :
      representationScore > 0.55 ? 'mäßig'            :
      representationScore > 0.30 ? 'lückenhaft'       : 'stark lückenhaft',
    suggestion: underrepresented.length > 0
      ? `Regionen ohne Steward: ${underrepresented.map(u => u.region).join(', ')}.`
      : 'Alle größeren Regionen sind vertreten.',
  };
}

// ── 8B.2 — culturalLegitimacy() ────────────────────────────────
/**
 * Wie legitim wirkt die Stewardship-Struktur für die Gemeinschaft?
 * Legitimität = Transparenz + Rotation + Repräsentation + Verständlichkeit.
 */
export function culturalLegitimacy(data = {}) {
  const {
    stewards               = [],
    stewardSelectionPublic = false,  // Ist Auswahl-Prozess öffentlich?
    rotationVisible        = false,  // Können Alle sehen wer wann rotiert?
    stewardContactible     = false,  // Sind Stewards erreichbar?
    communityUnderstanding = 0.50,   // % Community die Stewardship versteht
    feedbackActed          = 0.30,   // % Feedback das zu Änderungen führte
  } = data;

  const transparency = clamp(
    (stewardSelectionPublic ? 0.35 : 0) +
    (rotationVisible ? 0.30 : 0) +
    (stewardContactible ? 0.20 : 0) +
    Math.min(communityUnderstanding, 0.15)
  );

  const accountability = clamp(
    Math.min(feedbackActed / 0.30, 1) * 0.60 +
    (stewards.length > 0 ? 0.40 : 0)
  );

  const legitimacy = clamp(transparency * 0.60 + accountability * 0.40);

  const gaps = [];
  if (!stewardSelectionPublic) gaps.push('Auswahl-Prozess nicht öffentlich');
  if (!rotationVisible)        gaps.push('Rotations-Zeitplan nicht einsehbar');
  if (!stewardContactible)     gaps.push('Stewards nicht direkt erreichbar');
  if (communityUnderstanding < 0.40) gaps.push('Zu wenige verstehen die Stewardship-Struktur');

  return {
    legitimacy:    Math.round(legitimacy    * 100) / 100,
    transparency:  Math.round(transparency  * 100) / 100,
    accountability:Math.round(accountability* 100) / 100,
    level:
      legitimacy > 0.75 ? 'hoch legitim'   :
      legitimacy > 0.55 ? 'solide'         :
      legitimacy > 0.35 ? 'fragil'         : 'Legitimitäts-Defizit',
    gaps,
    priority: gaps[0] || null,
  };
}

// ── 8B.4 — stewardshipRotation() ───────────────────────────────
/**
 * Gesundheit des Rotations-Systems.
 * Misst: werden Zyklen eingehalten? Gibt es Stagnation?
 */
export function stewardshipRotation(stewards = []) {
  if (!stewards.length) return { rotation: 0, level: 'keine Stewards', stagnation: true };

  const now          = Date.now();
  const cycleMs      = STEWARD_CYCLE.TOTAL_MONTHS * 30 * 86400000;

  // Stewards in Übergabe-Phase
  const inHandover = stewards.filter(s => {
    const activeMs = now - new Date(s.cycle_start || Date.now()).getTime();
    const inPhase  = activeMs / 86400000 / 30;
    return inPhase >= STEWARD_CYCLE.ACTIVE_MONTHS &&
           inPhase < STEWARD_CYCLE.ACTIVE_MONTHS + STEWARD_CYCLE.HANDOVER_MONTHS;
  }).length;

  // Überfällige Stewards (länger als Zyklus ohne Rotation)
  const overdue = stewards.filter(s => {
    const activeMs = now - new Date(s.cycle_start || Date.now()).getTime();
    return activeMs > cycleMs * 1.1;  // 10% Toleranz
  });

  // Durchschnittliche Zykluslänge der letzten Rotationen
  const completedCycles = stewards
    .filter(s => s.cycle_end)
    .map(s => (new Date(s.cycle_end) - new Date(s.cycle_start)) / 86400000 / 30);

  const avgCycleMonths = completedCycles.length > 0
    ? completedCycles.reduce((a, b) => a + b, 0) / completedCycles.length
    : null;

  const stagnation = overdue.length / Math.max(stewards.length, 1) > 0.30;

  const rotation = clamp(
    (1 - overdue.length / Math.max(stewards.length, 1)) * 0.50 +
    (inHandover > 0 ? 0.30 : 0.10) +
    (avgCycleMonths !== null
      ? clamp(1 - Math.abs(avgCycleMonths - STEWARD_CYCLE.TOTAL_MONTHS) / STEWARD_CYCLE.TOTAL_MONTHS)
      : 0.5) * 0.20
  );

  return {
    rotation:      Math.round(rotation * 100) / 100,
    stagnation,
    overdueCount:  overdue.length,
    inHandover,
    avgCycleMonths:avgCycleMonths !== null ? Math.round(avgCycleMonths * 10) / 10 : null,
    level:
      rotation > 0.75 ? 'gesund rotierend' :
      rotation > 0.55 ? 'mäßig'           :
      rotation > 0.35 ? 'stockend'        : 'stagnierend',
    warning: stagnation
      ? `${overdue.length} Stewards überschreiten ihren Zyklus — Rotation nötig.`
      : null,
    overdueStewards: overdue.slice(0, 3).map(s => ({
      id:           s.id,
      region:       s.regions?.[0] || 'unbekannt',
      overdueMonths:Math.round((now - new Date(s.cycle_start || Date.now()).getTime()) / 86400000 / 30 - STEWARD_CYCLE.TOTAL_MONTHS),
    })),
  };
}

// ── 8B.6 — governanceResilience() ──────────────────────────────
/**
 * Stabilität des Stewardship-Systems bei Ausfällen.
 * Was passiert wenn ein Steward plötzlich wegfällt?
 */
export function governanceResilience(stewards = [], regions = []) {
  if (!stewards.length) return { resilience: 0, level: 'nicht resilient' };

  // Redundanz: wie viele Regionen haben mehr als 1 Steward?
  const regionCoverage = {};
  for (const s of stewards) {
    for (const r of (s.regions || [])) {
      regionCoverage[r] = (regionCoverage[r] || 0) + 1;
    }
  }
  const redundantRegions = Object.values(regionCoverage).filter(n => n >= 2).length;
  const totalCovered     = Object.keys(regionCoverage).length;
  const redundancyRate   = totalCovered > 0 ? redundantRegions / totalCovered : 0;

  // Übergabe-Überlapp: wie viele aktive Übergaben gibt es?
  const now = Date.now();
  const activeHandovers = stewards.filter(s => {
    if (!s.cycle_start) return false;
    const months = (now - new Date(s.cycle_start).getTime()) / 86400000 / 30;
    return months >= STEWARD_CYCLE.ACTIVE_MONTHS;
  }).length;
  const handoverRate = stewards.length > 0 ? activeHandovers / stewards.length : 0;

  // Wissen-Dokumentation (haben Stewards ihre Kontexte dokumentiert?)
  const documentedStewards = stewards.filter(s => s.has_documentation).length;
  const documentationRate  = stewards.length > 0 ? documentedStewards / stewards.length : 0;

  const resilience = clamp(
    redundancyRate    * 0.40 +
    Math.min(handoverRate / 0.20, 1) * 0.30 +  // 20% in Übergabe = gut
    documentationRate * 0.30
  );

  const risks = [];
  if (redundancyRate < 0.30)  risks.push('Wenig Redundanz — Regionen oft nur mit 1 Steward abgedeckt');
  if (handoverRate < 0.10)    risks.push('Zu wenige aktive Übergaben — Wissenstransfer gefährdet');
  if (documentationRate < 0.50) risks.push('Zu wenig Kontext-Dokumentation — Ausfälle schwer absorbierbar');

  return {
    resilience:       Math.round(resilience       * 100) / 100,
    redundancyRate:   Math.round(redundancyRate   * 100) / 100,
    handoverRate:     Math.round(handoverRate     * 100) / 100,
    documentationRate:Math.round(documentationRate* 100) / 100,
    activeHandovers,
    level:
      resilience > 0.70 ? 'resilient'            :
      resilience > 0.50 ? 'mäßig resilient'      :
      resilience > 0.30 ? 'verletzlich'          : 'fragil',
    risks,
  };
}

// ── 8B.2 — localContextIntegrity() ─────────────────────────────
/**
 * Kontext-Nähe der Stewards zu ihren Regionen.
 * Misst: verstehen Stewards die kulturelle Realität ihrer Region?
 */
export function localContextIntegrity(stewards = [], creators = []) {
  if (!stewards.length) return { integrity: 0 };

  const contextScores = stewards.map(steward => {
    const stewardRegions = steward.regions || [];
    if (!stewardRegions.length) return 0;

    // Ist der Steward selbst in der Region?
    const isLocal = stewardRegions.some(r =>
      steward.location_label?.toLowerCase().includes(r.toLowerCase())
    );

    // Wie lange ist der Steward schon in der Region aktiv?
    const localCreators = creators.filter(c =>
      stewardRegions.some(r => c.location_label?.toLowerCase().includes(r.toLowerCase()))
    );
    const stewardKnownByLocals = localCreators.filter(c =>
      c.known_stewards?.includes(steward.id)
    ).length / Math.max(localCreators.length, 1);

    // Sprach-Übereinstimmung
    const regionLangs = new Set(localCreators.map(c => c.language || 'de'));
    const stewardLang = steward.language || 'de';
    const langMatch   = regionLangs.has(stewardLang) ? 1 : 0.4;

    return clamp(
      (isLocal ? 0.40 : 0.15) +
      stewardKnownByLocals * 0.35 +
      langMatch * 0.25
    );
  });

  const avgIntegrity = contextScores.reduce((a, b) => a + b, 0) / contextScores.length;

  return {
    integrity:     Math.round(avgIntegrity * 100) / 100,
    stewardScores: contextScores.map((s, i) => ({
      id:    stewards[i].id,
      score: Math.round(s * 100) / 100,
    })),
    level:
      avgIntegrity > 0.70 ? 'hohe Kontextnähe'   :
      avgIntegrity > 0.50 ? 'gute Kontextnähe'   :
      avgIntegrity > 0.30 ? 'begrenzte Nähe'     : 'Kontext-Lücke',
    warning: avgIntegrity < 0.40
      ? 'Stewards haben zu wenig kulturellen Kontext zu ihren Regionen.'
      : null,
  };
}

// ── 8B.5 — culturalContextModeration() ─────────────────────────
/**
 * Kontext-bewusste Moderation.
 * Nicht: globale Einheitsregeln.
 * Sondern: lokaler Kontext informiert jede Entscheidung.
 *
 * @param {Object} moderationCase — { content, region, language, cultural_context }
 * @param {Array}  stewards       — Stewards mit Kontext-Wissen
 */
export function culturalContextModeration(moderationCase = {}, stewards = []) {
  const {
    content         = '',
    region          = '',
    language        = 'de',
    cultural_context= '',
    reported_by     = [],
    severity        = 'low',  // 'low', 'medium', 'high'
  } = moderationCase;

  // Finde zuständige Stewards mit lokalem Kontext
  const relevantStewards = stewards.filter(s =>
    (s.regions || []).some(r => r.toLowerCase().includes(region.toLowerCase())) &&
    (s.language === language || !s.language)
  );

  // Kontext-Faktoren die global-agnostische Regeln modifizieren
  const contextualFactors = [];

  if (language !== 'en' && language !== 'de') {
    contextualFactors.push('Nicht-dominante Sprache — kulturelle Nuancen können abweichen');
  }
  if (cultural_context) {
    contextualFactors.push(`Lokaler Kontext angegeben: ${cultural_context.slice(0, 60)}`);
  }
  if (reported_by.length === 1) {
    contextualFactors.push('Nur ein Meldevorgang — kontextuelle Überprüfung wichtig');
  }

  // Empfohlener Prozess basierend auf Kontext und Schwere
  const recommendedProcess =
    severity === 'high'
      ? 'Sofortige menschliche Überprüfung durch regionalen Steward oder Team'
      : severity === 'medium' && relevantStewards.length > 0
      ? `Weiterleitung an regionalen Steward: ${relevantStewards[0].id || 'Steward'}`
      : severity === 'medium'
      ? 'Menschliche Überprüfung — kein automatischer Entscheid'
      : 'Niedrige Schwere — regionaler Steward kann Kontext geben';

  return {
    hasLocalSteward:      relevantStewards.length > 0,
    relevantStewardCount: relevantStewards.length,
    contextualFactors,
    recommendedProcess,
    severity,
    automaticDecision:    false,  // Niemals automatisch
    principles: {
      restorativeFirst:   true,
      contextBefore:      'rule',
      humanReview:        'always for medium/high',
      noShadowBan:        true,
    },
  };
}

// ── 8B.8 — stewardshipHealthScore() ────────────────────────────
/**
 * Gesamter Distributed Stewardship Score.
 * Aggregiert alle Governance-Dimensionen.
 */
export function stewardshipHealthScore(data = {}) {
  const {
    stewards = [], regions = [], allCreators = [],
    legitimacyData = {}, moderationData = {},
  } = data;

  const distribution = stewardshipDistribution(stewards, regions);
  const representation= regionalRepresentation(stewards, allCreators);
  const legitimacy   = culturalLegitimacy({ stewards, ...legitimacyData });
  const rotation     = stewardshipRotation(stewards);
  const resilience   = governanceResilience(stewards, regions);
  const contextInt   = localContextIntegrity(stewards, allCreators);

  const score = clamp(
    distribution.distribution  * 0.20 +
    representation.score       * 0.20 +
    legitimacy.legitimacy      * 0.20 +
    (1 - (rotation.stagnation ? 0.30 : 0)) * 0.20 +
    resilience.resilience      * 0.10 +
    contextInt.integrity       * 0.10
  );

  const allWarnings = [
    ...distribution.warnings,
    ...representation.underrepresented.map(u => `${u.region}: kein Steward`),
    ...legitimacy.gaps,
    rotation.warning ? [rotation.warning] : [],
    ...resilience.risks,
    contextInt.warning ? [contextInt.warning] : [],
  ].flat().filter(Boolean);

  const season = getSeason();

  return {
    score:   Math.round(score * 100) / 100,
    level:
      score > 0.80 ? 'verteilte Stewardship — gesund'  :
      score > 0.65 ? 'solide'                          :
      score > 0.45 ? 'fragil'                          : 'kritisch zentralisiert',
    dimensions: { distribution, representation, legitimacy, rotation, resilience, contextInt },
    allWarnings: [...new Set(allWarnings)].slice(0, 8),
    // Saisonale Stewardship-Reflexion
    seasonalReflection:
      season.key === 'herbst'
        ? 'Herbst: Zeit für Rotations-Überprüfung — wer ist zu lange aktiv?'
        : season.key === 'winter'
        ? 'Winter: Governance-Überprüfung — was haben Stewards gelernt?'
        : season.key === 'fruehling'
        ? 'Frühling: Zeit für neue Stewardship-Zyklen — wer tritt neu ein?'
        : 'Sommer: Stewards aktiv halten — Übergaben vorbereiten.',
    timestamp:   new Date().toISOString(),
    _isInternal: true,
  };
}

// React Hook
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useDistributedStewardship() {
  const [stewards,  setStewards]  = useState([]);
  const [creators,  setCreators]  = useState([]);
  const [loading,   setLoading]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stewardsRes, creatorsRes] = await Promise.all([
        supabase.from('cultural_stewards').select('*').eq('is_active', true).limit(100),
        supabase.from('profiles').select('id, location_label, language, dna_tags, created_at').limit(300),
      ]);
      setStewards(stewardsRes.data  || []);
      setCreators(creatorsRes.data  || []);
    } catch (err) {
      console.error('[DistributedStewardship]', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const healthScore = useMemo(() =>
    stewardshipHealthScore({ stewards, allCreators: creators }),
    [stewards, creators]
  );

  return { stewards, creators, healthScore, loading, reload: load };
}
