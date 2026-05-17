// src/lib/federation/index.js
// HUI — Federated Culture Engine — Phase 8A
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Globale Reichweite ohne kulturellen Imperialismus.
// Viele lebendige Kulturen — verbunden, nicht verschmolzen.
//
// PRINZIPIEN:
//   ✅ Lokale Autonomie zuerst
//   ✅ Keine globale Ranking-Hierarchie
//   ✅ Sprachen gleichwertig
//   ✅ Brücken wechselseitig
//   ✅ Regionale Minderheiten aktiv geschützt
//
// FUNKTIONEN:
//   culturalAutonomy()          → Eigenständigkeit einer Region
//   regionalResonance()         → Kreative Energie einer Region
//   localVisibilityProtection() → Schutz kleiner Regionen
//   languageDiversity()         → Sprach-Gleichgewicht
//   crossCulturalBridges()      → Wechselseitige Verbindungen
//   federationHealth()          → Globale Föderations-Gesundheit
//   globalVisibilityBalance()   → Sichtbarkeits-Fairness global
//   bridgeReciprocity()         → Kulturelle Wechselseitigkeit
//   culturalConvergenceRisk()   → Homogenisierungs-Warnung
// ═══════════════════════════════════════════════════════════════

import { culturalDiversity, localCulturalBalance }
  from '@/lib/culturalEvolution/index';
import { cityCreativeTexture, localResonance }
  from '@/lib/realWorld/index';
import { creatorBridgeScore, creativeResonance }
  from '@/lib/graph/index';
import { getSeason } from '@/lib/culture/index';

const clamp = (v, min = 0, max = 1) => Math.min(Math.max(v, min), max);
function gini(values) {
  const s = [...values].sort((a, b) => a - b);
  const n = s.length; const total = s.reduce((a, b) => a + b, 0) || 1;
  return Math.abs(s.reduce((acc, v, i) => acc + (2 * i - n - 1) * v, 0) / (n * total));
}

// ── Federation-Schwellenwerte ───────────────────────────────────
export const FEDERATION_THRESHOLDS = {
  MAX_REGION_GINI:         0.55,  // Sichtbarkeits-Gini global
  MAX_LANGUAGE_GINI:       0.55,  // Sprach-Gini
  MAX_TOP3_FEED_SHARE:     0.60,  // Top-3-Regionen max 60% Feed
  MAX_ZERO_DISCOVERY_RATE: 0.20,  // Max 20% Regionen mit 0 Discovery
  MIN_BRIDGE_RECIPROCITY:  0.40,  // Min Wechselseitigkeit
  MAX_CULTURAL_CONVERGENCE:0.65,  // Max globale Ästhetik-Konvergenz
  MIN_LANGUAGE_DIVERSITY:  3,     // Mind. 3 Sprachen aktiv vertreten
};

// ── 8A.3 — culturalAutonomy() ──────────────────────────────────
/**
 * Wie eigenständig ist eine Region kulturell?
 * Misst: eigene Ästhetik, eigene Themen, eigene Rhythmen.
 * Nicht: Isolation. Sondern: unverwechselbare Identität.
 *
 * @param {string}  region    — Region/Stadt-Label
 * @param {Array}   creators  — Creators dieser Region
 * @param {Array}   allCreators — Alle Creators (für globalen Vergleich)
 */
export function culturalAutonomy(region, creators = [], allCreators = []) {
  if (!creators.length) return { autonomy: 0, level: 'unbekannt' };

  // 1. Eigene Domain-Signatur
  const DOMAIN_FAMILIES = {
    visual:['foto','design','video','malerei'],  sonic:['musik','sound','podcast'],
    crafted:['keramik','textil','holz'],          written:['text','lyrik','journalismus'],
    digital:['code','web','generative'],          body:['tanz','theater','performance'],
  };
  const regionalDomains = {};
  for (const c of creators) {
    const text = [...(c.dna_tags||[]), c.talent||''].join(' ').toLowerCase();
    for (const [fam, kws] of Object.entries(DOMAIN_FAMILIES)) {
      if (kws.some(k => text.includes(k))) {
        regionalDomains[fam] = (regionalDomains[fam] || 0) + 1;
      }
    }
  }

  // Vergleich mit globalem Durchschnitt
  const globalDomains = {};
  for (const c of allCreators) {
    const text = [...(c.dna_tags||[]), c.talent||''].join(' ').toLowerCase();
    for (const [fam, kws] of Object.entries(DOMAIN_FAMILIES)) {
      if (kws.some(k => text.includes(k))) {
        globalDomains[fam] = (globalDomains[fam] || 0) + 1;
      }
    }
  }

  // Divergenz: wie verschieden ist die regionale von der globalen Verteilung?
  const totalRegional = Object.values(regionalDomains).reduce((a, b) => a + b, 0) || 1;
  const totalGlobal   = Object.values(globalDomains).reduce((a, b) => a + b, 0) || 1;
  let divergence = 0;
  for (const fam of Object.keys(DOMAIN_FAMILIES)) {
    const regShare  = (regionalDomains[fam] || 0) / totalRegional;
    const globShare = (globalDomains[fam] || 0) / totalGlobal;
    divergence += Math.abs(regShare - globShare);
  }
  const signatureDivergence = clamp(divergence / 2);

  // 2. Eigene Mood-Signatur
  const regionalMoods = {};
  for (const c of creators) {
    for (const m of [...(c.mood_tags||[]), c.mood].filter(Boolean)) {
      regionalMoods[m] = (regionalMoods[m] || 0) + 1;
    }
  }
  const topRegionalMood = Object.entries(regionalMoods)
    .sort(([,a],[,b]) => b-a)[0]?.[0] || null;

  // 3. Sprachliche Eigenständigkeit
  const regionalLangs = new Set(creators.map(c => c.language || c.lang || 'de').filter(Boolean));
  const hasNonDefaultLang = regionalLangs.size > 1 || !regionalLangs.has('de');

  const autonomy = clamp(
    signatureDivergence   * 0.50 +  // Eigene Ästhetik
    Math.min(Object.keys(regionalDomains).length / 4, 1) * 0.30 + // Breite
    (hasNonDefaultLang ? 0.20 : 0.10)  // Sprachliche Eigenheit
  );

  return {
    autonomy:  Math.round(autonomy            * 100) / 100,
    region,
    topDomains:Object.entries(regionalDomains)
      .sort(([,a],[,b]) => b-a).slice(0,3).map(([d]) => d),
    topMood:   topRegionalMood,
    signatureDivergence: Math.round(signatureDivergence * 100) / 100,
    level:
      autonomy > 0.70 ? 'stark eigenständig' :
      autonomy > 0.50 ? 'eigenständig'       :
      autonomy > 0.30 ? 'wachsend'           : 'noch ungeformt',
    description: autonomy > 0.60
      ? `${region} hat eine unverwechselbare kreative Identität.`
      : `${region} entwickelt seine kreative Eigenheit.`,
  };
}

// ── 8A.2 — regionalResonance() ─────────────────────────────────
/**
 * Kreative Energie und Verbindungsdichte einer Region.
 * Kombiniert: lokale Verbindungen + Vitalität + Brücken-Potential.
 */
export function regionalResonance(region, creators = [], collaborations = []) {
  const regionCreators = creators.filter(c =>
    c.location_label?.toLowerCase().trim().includes(region.toLowerCase())
  );
  if (!regionCreators.length) return { resonance: 0, level: 'unbekannt' };

  // Interne Verbindungen
  let internalResonance = 0; let pairs = 0;
  for (let i = 0; i < Math.min(regionCreators.length, 8); i++) {
    for (let j = i + 1; j < Math.min(regionCreators.length, 8); j++) {
      const { resonance } = creativeResonance(regionCreators[i], regionCreators[j]);
      internalResonance += resonance; pairs++;
    }
  }
  const avgInternalResonance = pairs > 0 ? internalResonance / pairs : 0;

  // Lokale Kollaborationen
  const regionIds  = new Set(regionCreators.map(c => c.id));
  const localCollabs = collaborations.filter(c =>
    regionIds.has(c.wirker_user_id) || regionIds.has(c.client_user_id)
  ).length;
  const collabDensity = clamp(localCollabs / Math.max(regionCreators.length, 1) / 2);

  // Bridge-Creators in der Region
  const bridgeCount = regionCreators.filter(c => (c._bridgeScore || c.bridge_score || 0) > 0.30).length;
  const bridgeRatio = bridgeCount / Math.max(regionCreators.length, 1);

  const resonance = clamp(
    avgInternalResonance * 0.40 +
    collabDensity        * 0.35 +
    bridgeRatio          * 0.25
  );

  return {
    resonance:  Math.round(resonance             * 100) / 100,
    region,
    creatorCount:regionCreators.length,
    localCollabs,
    bridgeCount,
    level:
      resonance > 0.65 ? 'lebhaft'    :
      resonance > 0.45 ? 'aktiv'      :
      resonance > 0.25 ? 'entstehend' : 'still',
    avgInternalResonance: Math.round(avgInternalResonance * 100) / 100,
  };
}

// ── 8A.3 — localVisibilityProtection() ─────────────────────────
/**
 * Schutz kleiner und neuer Regionen vor algorithmischer Unsichtbarkeit.
 * Erkennt: welche Regionen brauchen Discovery-Boost?
 *
 * @param {Array} regionStats — [{ region, creatorCount, feedImpressions }]
 * @returns {{ protectedRegions, boosts, overallFairness }}
 */
export function localVisibilityProtection(regionStats = []) {
  if (!regionStats.length) return { protectedRegions: [], boosts: {}, overallFairness: 1 };

  const totalImpressions = regionStats.reduce((a, r) => a + (r.feedImpressions || 0), 0) || 1;
  const totalCreators    = regionStats.reduce((a, r) => a + (r.creatorCount || 0), 0) || 1;

  const protectedRegions = [];
  const boosts = {};

  for (const region of regionStats) {
    const creatorShare    = region.creatorCount / totalCreators;
    const impressionShare = (region.feedImpressions || 0) / totalImpressions;

    // Underrepräsentiert wenn Impressions-Anteil < 50% des Creator-Anteils
    const underrepRatio   = creatorShare > 0 ? impressionShare / creatorShare : 1;

    if (underrepRatio < 0.50 && region.creatorCount >= 2) {
      // Region braucht Schutz
      const boostFactor = clamp(Math.min(1 / underrepRatio, 2.5));  // Max 2.5× Boost
      protectedRegions.push({
        region:        region.region,
        creatorCount:  region.creatorCount,
        underrepRatio: Math.round(underrepRatio * 100) / 100,
        boostFactor:   Math.round(boostFactor   * 100) / 100,
      });
      boosts[region.region] = boostFactor;
    }
  }

  // Gini für Sichtbarkeitsverteilung
  const impressionShares = regionStats.map(r => (r.feedImpressions || 0) / totalImpressions);
  const visibilityGini   = gini(impressionShares);

  return {
    protectedRegions: protectedRegions.sort((a, b) => a.underrepRatio - b.underrepRatio),
    boosts,
    overallFairness:  Math.round((1 - visibilityGini) * 100) / 100,
    visibilityGini:   Math.round(visibilityGini        * 100) / 100,
    needsIntervention:visibilityGini > FEDERATION_THRESHOLDS.MAX_REGION_GINI,
    regionCount:      regionStats.length,
  };
}

// ── 8A.5 — languageDiversity() ─────────────────────────────────
/**
 * Sprach-Gleichgewicht auf der Plattform.
 * Kein Algorithmus darf Sprachen bevorzugen.
 *
 * @param {Array} creators — mit language/lang-Feld
 */
export function languageDiversity(creators = []) {
  const langCount = {};
  for (const c of creators) {
    const lang = (c.language || c.lang || c.ui_language || 'de').toLowerCase().slice(0, 2);
    langCount[lang] = (langCount[lang] || 0) + 1;
  }

  const total  = creators.length || 1;
  const langs  = Object.entries(langCount).sort(([,a],[,b]) => b-a);
  const topLang = langs[0];
  const topShare = topLang ? topLang[1] / total : 0;

  const langGini = gini(langs.map(([, n]) => n));

  // Gleichwertigkeits-Score
  const diversityScore = clamp(
    (1 - langGini)              * 0.50 +
    Math.min(langs.length / FEDERATION_THRESHOLDS.MIN_LANGUAGE_DIVERSITY, 1) * 0.30 +
    (topShare < 0.70 ? 0.20 : 0.05)  // Keine Sprache dominiert > 70%
  );

  const LANGUAGE_LABELS = {
    de: 'Deutsch', en: 'Englisch', fr: 'Französisch', es: 'Spanisch',
    it: 'Italienisch', ja: 'Japanisch', ko: 'Koreanisch', zh: 'Chinesisch',
    pt: 'Portugiesisch', nl: 'Niederländisch', pl: 'Polnisch', ar: 'Arabisch',
    ru: 'Russisch', sv: 'Schwedisch', da: 'Dänisch', no: 'Norwegisch',
  };

  return {
    diversity:  Math.round(diversityScore * 100) / 100,
    langGini:   Math.round(langGini       * 100) / 100,
    topLang:    topLang?.[0] || 'de',
    topShare:   Math.round(topShare       * 100) / 100,
    languages:  langs.slice(0, 8).map(([lang, count]) => ({
      code:    lang,
      label:   LANGUAGE_LABELS[lang] || lang.toUpperCase(),
      count,
      share:   Math.round(count / total * 100) / 100,
    })),
    languageCount: langs.length,
    level:
      diversityScore > 0.70 ? 'sprachlich reich'   :
      diversityScore > 0.50 ? 'mehrsprachig'        :
      diversityScore > 0.30 ? 'wachsend'            : 'einsprachig dominiert',
    warning: topShare > 0.70 ? `${LANGUAGE_LABELS[topLang?.[0]] || topLang?.[0]} dominiert — andere Sprachen benötigen mehr Sichtbarkeit.` : null,
  };
}

// ── 8A.4 — crossCulturalBridges() ──────────────────────────────
/**
 * Wechselseitige kulturelle Verbindungen.
 * Erkennt: welche Regionen verbinden sich? In welche Richtung?
 * Warnt: wenn Verbindungen nur in eine Richtung fließen.
 */
export function crossCulturalBridges(creators = [], collaborations = []) {
  // Regionale Kollaborations-Matrix
  const regionCreatorMap = {};
  for (const c of creators) {
    const region = c.location_label?.toLowerCase().trim() || 'unbekannt';
    if (!regionCreatorMap[region]) regionCreatorMap[region] = new Set();
    regionCreatorMap[region].add(c.id);
  }

  // Welche Regionen kollaborieren miteinander?
  const bridgeMatrix = {};  // regionA:regionB → count
  for (const collab of collaborations) {
    let regionA = 'unbekannt', regionB = 'unbekannt';
    for (const [region, ids] of Object.entries(regionCreatorMap)) {
      if (ids.has(collab.wirker_user_id)) regionA = region;
      if (ids.has(collab.client_user_id)) regionB = region;
    }
    if (regionA !== regionB && regionA !== 'unbekannt' && regionB !== 'unbekannt') {
      const key = [regionA, regionB].sort().join(':');
      bridgeMatrix[key] = (bridgeMatrix[key] || 0) + 1;
    }
  }

  // Reciprocity-Check: A→B und B→A
  const forwardMatrix = {};  // region → welche Regionen kontaktieren es?
  for (const collab of collaborations) {
    const fromRegion = [...Object.entries(regionCreatorMap)]
      .find(([, ids]) => ids.has(collab.client_user_id))?.[0];
    const toRegion   = [...Object.entries(regionCreatorMap)]
      .find(([, ids]) => ids.has(collab.wirker_user_id))?.[0];
    if (fromRegion && toRegion && fromRegion !== toRegion) {
      if (!forwardMatrix[fromRegion]) forwardMatrix[fromRegion] = new Set();
      forwardMatrix[fromRegion].add(toRegion);
    }
  }

  // Reciprocity-Score: wie viele Brücken sind wechselseitig?
  const bridges = Object.keys(bridgeMatrix);
  const reciprocalBridges = bridges.filter(key => {
    const [a, b] = key.split(':');
    return forwardMatrix[a]?.has(b) && forwardMatrix[b]?.has(a);
  });

  const reciprocity = bridges.length > 0
    ? reciprocalBridges.length / bridges.length : 0;

  // Top-Brücken
  const topBridges = Object.entries(bridgeMatrix)
    .sort(([,a],[,b]) => b-a)
    .slice(0, 5)
    .map(([key, count]) => {
      const [a, b] = key.split(':');
      return { from: a, to: b, count, isReciprocal: reciprocalBridges.includes(key) };
    });

  return {
    bridgeCount:        bridges.length,
    reciprocalBridges:  reciprocalBridges.length,
    reciprocity:        Math.round(reciprocity * 100) / 100,
    topBridges,
    level:
      reciprocity > 0.70 ? 'wechselseitig reich'  :
      reciprocity > 0.50 ? 'ausgewogen'            :
      reciprocity > 0.30 ? 'teilweise wechselseitig':
                           'einbahnstraße',
    warning: reciprocity < FEDERATION_THRESHOLDS.MIN_BRIDGE_RECIPROCITY
      ? 'Kulturelle Brücken fließen überwiegend in eine Richtung — Wechselseitigkeit stärken.'
      : null,
    regionCount: Object.keys(regionCreatorMap).length,
  };
}

// ── 8A.6 — globalVisibilityBalance() ───────────────────────────
/**
 * Sichtbarkeits-Fairness global — keine Region dominiert.
 * Misst: Gini der regionalen Feed-Anteile.
 */
export function globalVisibilityBalance(regionStats = []) {
  if (!regionStats.length) return { balance: 1, gini: 0, level: 'keine Daten' };

  const feedShares = regionStats.map(r => r.feedImpressions || 0);
  const visGini    = gini(feedShares);

  const total      = feedShares.reduce((a, b) => a + b, 0) || 1;
  const sorted     = [...feedShares].sort((a, b) => b - a);
  const top3Share  = sorted.slice(0, 3).reduce((a, b) => a + b, 0) / total;

  const balance = clamp(
    (1 - visGini)                  * 0.50 +
    (1 - Math.min(top3Share / 0.60, 1)) * 0.30 +
    Math.min(regionStats.length / 10, 1) * 0.20
  );

  const warnings = [];
  if (visGini > FEDERATION_THRESHOLDS.MAX_REGION_GINI) warnings.push('hohe_regionale_konzentration');
  if (top3Share > FEDERATION_THRESHOLDS.MAX_TOP3_FEED_SHARE) warnings.push('top3_dominieren');

  return {
    balance:    Math.round(balance  * 100) / 100,
    visGini:    Math.round(visGini  * 100) / 100,
    top3Share:  Math.round(top3Share* 100) / 100,
    level:
      balance > 0.75 ? 'global fair'    :
      balance > 0.55 ? 'mäßig verteilt' :
      balance > 0.35 ? 'konzentriert'   : 'stark konzentriert',
    warnings,
    regionCount:regionStats.length,
  };
}

// ── 8A.8 — culturalConvergenceRisk() ───────────────────────────
/**
 * Erkennt globale Homogenisierungs-Drift.
 * Wenn alle Regionen sich ästhetisch annähern → Warnung.
 */
export function culturalConvergenceRisk(regionProfiles = []) {
  if (regionProfiles.length < 3) return { risk: 0, level: 'zu wenig Daten' };

  // Paarweise ästhetische Ähnlichkeit
  let totalSimilarity = 0; let pairs = 0;
  for (let i = 0; i < regionProfiles.length; i++) {
    for (let j = i + 1; j < regionProfiles.length; j++) {
      const a = regionProfiles[i];
      const b = regionProfiles[j];

      // Mood-Überlappung
      const moodsA = new Set(a.topMoods || []);
      const moodsB = new Set(b.topMoods || []);
      const moodOverlap = [...moodsA].filter(m => moodsB.has(m)).length
        / Math.max(moodsA.size + moodsB.size - [...moodsA].filter(m => moodsB.has(m)).length, 1);

      // Domain-Überlappung
      const domsA = new Set(a.topDomains || []);
      const domsB = new Set(b.topDomains || []);
      const domOverlap = [...domsA].filter(d => domsB.has(d)).length
        / Math.max(domsA.size + domsB.size - [...domsA].filter(d => domsB.has(d)).length, 1);

      totalSimilarity += (moodOverlap + domOverlap) / 2;
      pairs++;
    }
  }

  const avgSimilarity = pairs > 0 ? totalSimilarity / pairs : 0;
  const convergenceRisk = clamp(avgSimilarity);

  return {
    risk:    Math.round(convergenceRisk * 100) / 100,
    level:
      convergenceRisk > FEDERATION_THRESHOLDS.MAX_CULTURAL_CONVERGENCE ? 'kritisch'  :
      convergenceRisk > 0.50 ? 'erhöht'    :
      convergenceRisk > 0.30 ? 'moderat'   : 'gesund',
    avgSimilarity:    Math.round(avgSimilarity * 100) / 100,
    regionCount:      regionProfiles.length,
    warning: convergenceRisk > FEDERATION_THRESHOLDS.MAX_CULTURAL_CONVERGENCE
      ? 'Globale Ästhetik-Homogenisierung erkannt — regionale Autonomie stärken.'
      : null,
  };
}

// ── 8A.2 — federationHealth() ──────────────────────────────────
/**
 * Gesamte Föderations-Gesundheit.
 * Aggregiert: Autonomie + Sprache + Sichtbarkeit + Brücken + Konvergenz.
 */
export function federationHealth(data = {}) {
  const {
    regionStats    = [],
    creators       = [],
    collaborations = [],
    regionProfiles = [],
  } = data;

  const visibility  = globalVisibilityBalance(regionStats);
  const language    = languageDiversity(creators);
  const bridges     = crossCulturalBridges(creators, collaborations);
  const convergence = culturalConvergenceRisk(regionProfiles);
  const protection  = localVisibilityProtection(regionStats);

  const health = clamp(
    visibility.balance            * 0.25 +
    language.diversity            * 0.20 +
    bridges.reciprocity           * 0.20 +
    (1 - convergence.risk)        * 0.20 +
    protection.overallFairness    * 0.15
  );

  const allWarnings = [
    ...visibility.warnings,
    language.warning      ? ['language_imbalance']      : [],
    bridges.warning       ? ['bridge_asymmetry']         : [],
    convergence.warning   ? ['cultural_convergence']     : [],
    protection.needsIntervention ? ['regional_protection_needed'] : [],
  ].flat().filter(Boolean);

  return {
    health:   Math.round(health * 100) / 100,
    level:
      health > 0.75 ? 'föderativ gesund'  :
      health > 0.60 ? 'stabil'            :
      health > 0.40 ? 'fragil'            : 'kritisch zentralisiert',
    dimensions: { visibility, language, bridges, convergence, protection },
    allWarnings: [...new Set(allWarnings)],
    regionCount: regionStats.length,
    season:      getSeason().key,
    _isInternal: true,
    timestamp:   new Date().toISOString(),
  };
}

// ── Language System Extension — 8A.5 ───────────────────────────
// Grundstruktur für mehrsprachige UI-Texte
// DE ist vollständig (language.js). EN folgt hier als zweite Sprache.

export const UI_TEXTS_EN = {
  profile: {
    available:       'Open for collaboration',
    unavailable:     'Taking time for myself',
    followCTA:       'Connect',
    unfollowCTA:     'Disconnect',
    messageCTA:      'Send message',
    bookCTA:         'Request collaboration',
    editCTA:         'Edit profile',
    studioCTA:       'My Studio',
    followersLabel:  'Connections',
    bookingsLabel:   'Projects',
    recsLabel:       'Recommendations',
    impactLabel:     'Impact',
  },
  feed: {
    emptyState:      'Nothing here yet — and that\'s okay.',
    loadingState:    'Creative worlds are becoming visible…',
    errorState:      'Something didn\'t arrive — please try again.',
    noMoreItems:     'That\'s all for now. More tomorrow.',
    searchPlaceholder:'What are you looking for?',
    filterLabel:     'Atmosphere',
  },
  booking: {
    requestTitle:    'Request collaboration',
    budgetLabel:     'Shared frame',
    dateLabel:       'Possible timing',
    locationLabel:   'Place of creation',
    messageLabel:    'Your intention',
    submitCTA:       'Send request',
    successMessage:  'Your request has arrived.',
    moodLabel:       'Atmosphere of collaboration',
  },
  general: {
    loading:  'One moment…',
    error:    'Didn\'t arrive. Please try again.',
    empty:    'Nothing here yet.',
    save:     'Save',
    cancel:   'Cancel',
    close:    'Close',
    back:     'Back',
    confirm:  'Confirm',
  },
};

// Sprach-Resolver — liefert korrekten Text für aktive Sprache
export function tGlobal(section, key, lang = 'de') {
  // Lazy-Import Strategie: de aus language.js, en aus UI_TEXTS_EN
  if (lang === 'en') {
    return UI_TEXTS_EN[section]?.[key] || `${section}.${key}`;
  }
  // Fallback: Deutsch (aus language.js)
  return `${section}.${key}`;
}

// React Hook
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useFederation() {
  const [creators,       setCreators]       = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [loading,        setLoading]        = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [creatorsRes, collabsRes] = await Promise.all([
        supabase.from('profiles')
          .select('id, dna_tags, talent, mood, mood_tags, location_label, language, ui_language, is_available, created_at, bridge_score')
          .eq('has_talent_profile', true).limit(500),
        supabase.from('bookings')
          .select('id, wirker_user_id, client_user_id, status, created_at')
          .eq('status', 'completed').limit(300),
      ]);
      setCreators(creatorsRes.data   || []);
      setCollaborations(collabsRes.data || []);
    } catch (err) {
      console.error('[Federation]', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const langHealth = useMemo(() => languageDiversity(creators), [creators]);
  const bridges    = useMemo(() => crossCulturalBridges(creators, collaborations), [creators, collaborations]);

  return {
    creators, collaborations, loading, reload: load,
    languageHealth: langHealth, bridges,
    thresholds: FEDERATION_THRESHOLDS,
  };
}
