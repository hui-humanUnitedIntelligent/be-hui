// src/lib/realWorld/index.js
// HUI — Real-World Resonance Engine — Phase 7D
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Digitale Resonanz und reale Präsenz sind nicht getrennt.
// HUI verbindet beides — ruhig, freiwillig, ohne Tracking.
//
// KEIN GPS. KEINE ECHTZEIT-STANDORTE.
// Nur: location_label (Stadt/Region, vom Creator freiwillig angegeben).
//
// ALLE SYSTEME:
//   ✅ freiwillig — Opt-in für lokale Sichtbarkeit
//   ✅ atmosphärisch — Orte als Stimmungen, nicht Pins
//   ✅ nicht invasiv — kein Nähe-Tracking
//   ✅ kulturell sensibel — keine Geo-Competition
//   ✅ nachhaltig — keine Creator-Tourismus-Mechaniken
//
// FUNKTIONEN:
//   localResonance()         → kreative Dichte einer Stadt
//   creativePlaceAffinity()  → Atmosphäre eines Ortes
//   seasonalLocalEnergy()    → Jahreszeitliche Stadtstimmung
//   quietEncounterPotential()→ Potenzial für sanfte Begegnungen
//   creativeMigrationFlow()  → Kreative Bewegung zwischen Städten
//   cityCreativeTexture()    → Kreative Persönlichkeit einer Stadt
//   localCulturalMemory()    → Kreative Erinnerung einer Stadt
//   localHealthMetrics()     → 7D.8 Gesundheitsmetriken
// ═══════════════════════════════════════════════════════════════

import { getSeason }              from '@/lib/culture/index';
import { localProximityModifier,
         detectLocalClusters,
         findNearbyResonance }    from '@/lib/localNetwork/index';
import { creativeResonance,
         creatorBridgeScore }     from '@/lib/graph/index';

const clamp = (v, min = 0, max = 1) => Math.min(Math.max(v, min), max);

// ── DATENSCHUTZ-FOUNDATION ──────────────────────────────────────
// Alle Funktionen arbeiten nur mit opt-in location_label
// Niemals mit Koordinaten, IP-Adresse oder Gerätedaten

export const LOCATION_PRIVACY_RULES = {
  // Was HUI nutzt
  uses:        ['location_label'],  // Nur: "Hamburg", "Berlin-Mitte"
  granularity: 'city',              // Nie feiner als Stadt/Stadtteil
  // Was HUI NIE nutzt
  never: ['gps_coordinates', 'ip_address', 'device_location',
          'realtime_position', 'movement_tracking'],
  // Opt-in Basis
  requiresOptIn: true,              // Creator muss location_label aktiv setzen
  deletable:    true,               // Jederzeit löschbar
};

// ── 7D.2 — localResonance() ────────────────────────────────────
/**
 * Kreative Resonanz-Dichte einer Stadt.
 * Misst: wie reich ist die lokale kreative Verbindungsdichte?
 *
 * Keine Popularitätskarte. Keine Hotspot-Logik.
 * Nur: Qualität der Verbindungen innerhalb einer Stadt.
 *
 * @param {string}  city      — Stadtname (aus location_label)
 * @param {Array}   creators  — Alle Creators mit location_label
 * @returns {{ resonance, level, description }}
 */
export function localResonance(city, creators = []) {
  if (!city || !creators.length) return { resonance: 0, level: 'unbekannt', description: '' };

  const cityLower   = city.toLowerCase().trim();
  const cityCreators= creators.filter(c =>
    c.location_label?.toLowerCase().trim() === cityLower
  );

  if (cityCreators.length < 2) {
    return { resonance: 0, level: 'entstehend', description: 'Wenige Kreative — viel Raum.', count: cityCreators.length };
  }

  // Kreative Verbindungsdichte (nicht Menge)
  const uniqueDomains = new Set(cityCreators.flatMap(c => c.dna_tags || [])).size;
  const bridgeCount   = cityCreators.filter(c => (c._bridgeScore || 0) > 0.3).length;
  const availCount    = cityCreators.filter(c => c.is_available !== false).length;

  const diversity  = Math.min(uniqueDomains / 12, 1);
  const bridgeDens = Math.min(bridgeCount / Math.max(cityCreators.length, 1), 1);
  const openness   = availCount / cityCreators.length;

  const resonance = clamp(diversity * 0.45 + bridgeDens * 0.30 + openness * 0.25);

  const LEVELS = {
    reich:     { min: 0.70, label: 'Reich',     description: 'Eine lebendige, vielfältige kreative Szene.' },
    lebendig:  { min: 0.45, label: 'Lebendig',  description: 'Aktive kreative Verbindungen.' },
    wachsend:  { min: 0.25, label: 'Wachsend',  description: 'Eine Szene die sich entfaltet.' },
    entstehend:{ min: 0.00, label: 'Entstehend',description: 'Erste kreative Verbindungen knüpfen sich.' },
  };

  const level = Object.values(LEVELS).find(l => resonance >= l.min) || LEVELS.entstehend;

  return {
    resonance:  Math.round(resonance * 100) / 100,
    level:      level.label,
    description:level.description,
    count:      cityCreators.length,
    bridgeCount,
    // Nie: öffentliche Zahlen anzeigen — nur intern
    _private:   { uniqueDomains, diversity, bridgeDens, openness },
  };
}

// ── 7D.3 — creativePlaceAffinity() ─────────────────────────────
/**
 * Atmosphärische Qualität eines Ortes.
 * Kein Rating. Kein Ranking. Nur: kreative Stimmung.
 *
 * Entsteht aus: den Stimmungen der Creators die dort aktiv sind.
 *
 * @param {string}  placeName    — Ortsname (z.B. "Schanzenviertel Hamburg")
 * @param {Array}   localCreators— Creators mit diesem location_hint
 */
export function creativePlaceAffinity(placeName, localCreators = []) {
  if (!placeName || !localCreators.length) return null;

  // Dominante Mood-Cluster
  const moodCount = {};
  for (const c of localCreators) {
    const moods = [...(c.mood_tags || []), c.mood].filter(Boolean);
    for (const m of moods) moodCount[m] = (moodCount[m] || 0) + 1;
  }

  const topMoods = Object.entries(moodCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([mood]) => mood);

  // Dominante Domain-Familien
  const DOMAIN_FAMILIES = {
    visual:   ['foto','illustration','design','video'],
    sonic:    ['musik','sound','podcast','gesang'],
    crafted:  ['keramik','schmuck','textil','holz'],
    written:  ['text','lyrik','storytelling'],
    digital:  ['code','web','app','generative'],
    body:     ['tanz','theater','performance'],
  };

  const familyCount = {};
  for (const c of localCreators) {
    const text = [...(c.dna_tags || []), c.talent || ''].join(' ').toLowerCase();
    for (const [fam, kws] of Object.entries(DOMAIN_FAMILIES)) {
      if (kws.some(k => text.includes(k))) {
        familyCount[fam] = (familyCount[fam] || 0) + 1;
      }
    }
  }
  const topFamilies = Object.entries(familyCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([f]) => f);

  // Atmosphärische Beschreibung — qualitativ
  const description = _buildPlaceDescription(topMoods, topFamilies, placeName);

  // Tageszeit-Qualität (aus Aktivitätszeiten der Creators)
  const nightRatio = localCreators.filter(c => {
    const h = new Date(c.updated_at || Date.now()).getHours();
    return h >= 21 || h < 6;
  }).length / localCreators.length;

  const timeQuality = nightRatio > 0.4 ? 'nächtlich aktiv' : 'tagesoffen';

  return {
    place:       placeName,
    topMoods,
    topFamilies,
    description,
    timeQuality,
    creatorCount:localCreators.length,
    // Keine Rating-Zahl
    hasAffinity: true,
  };
}

const PLACE_MOOD_TEXTS = {
  ruhig:         'ruhiger',
  warm:          'warmer',
  kreativ:       'kreativer',
  authentisch:   'ehrlicher',
  professionell: 'sorgfältiger',
  inspirierend:  'offener',
  nachhaltig:    'bedachter',
};

const PLACE_DOMAIN_TEXTS = {
  visual:  'visueller Arbeit',
  sonic:   'Klang und Sound',
  crafted: 'Handwerk',
  written: 'Sprache und Text',
  digital: 'digitaler Praxis',
  body:    'Performance und Bewegung',
};

function _buildPlaceDescription(moods, families, place) {
  const moodAdj = moods[0] ? (PLACE_MOOD_TEXTS[moods[0]] || 'kreativer') : 'kreativer';
  const domainText = families.length > 0
    ? `bekannt für ${families.map(f => PLACE_DOMAIN_TEXTS[f] || f).join(' und ')}`
    : 'offen für viele kreative Richtungen';

  return `Ein ${moodAdj} Ort, ${domainText}.`;
}

// ── 7D.2 — seasonalLocalEnergy() ───────────────────────────────
/**
 * Jahreszeitliche kreative Energie einer Stadt.
 * Nicht: Veranstaltungskalender. Sondern: atmosphärische Qualität.
 */
export function seasonalLocalEnergy(city = '', localCreators = []) {
  const season = getSeason();

  // Jahreszeit-Themen pro Stadt-Typ (grob)
  const isNorthernGerman = ['hamburg','bremen','kiel','lübeck','rostock'].some(c =>
    city.toLowerCase().includes(c)
  );
  const isBavarian = ['münchen','nürnberg','augsburg','regensburg'].some(c =>
    city.toLowerCase().includes(c)
  );

  const SEASONAL_CITY_ENERGY = {
    fruehling: {
      energy:      'aufbrechend',
      description: `${season.name} bringt kreative Aufbruchsenergie — neue Projekte, neue Verbindungen.`,
      invitation:  'Was entsteht gerade Neues in deiner Stadt?',
      colors:      season.colors,
    },
    sommer:    {
      energy:      'offen-weit',
      description: `Sommer in ${city || 'der Stadt'} — längere Tage, mehr Begegnungen.`,
      invitation:  'Wer teilt deinen kreativen Sommer?',
      colors:      season.colors,
    },
    herbst:    {
      energy:      'reifend-tief',
      description: `Herbstliche Tiefe in ${city || 'der Stadt'} — Zeit für reife Projekte und Innenräume.`,
      invitation:  isNorthernGerman
        ? 'Der Norden vertieft sich — was reift bei dir?'
        : 'Was will in dieser Jahreszeit abgeschlossen sein?',
      colors:      season.colors,
    },
    winter:    {
      energy:      'konzentriert-innen',
      description: `Winterliche Konzentration — ${isBavarian ? 'gemütliche' : 'stille'} kreative Arbeit.`,
      invitation:  'Was entsteht in der Stille dieser Jahreszeit?',
      colors:      season.colors,
    },
  };

  const energy = SEASONAL_CITY_ENERGY[season.key] || SEASONAL_CITY_ENERGY.herbst;

  // Aktive Creators in dieser Jahreszeit
  const seasonallyActive = localCreators.filter(c => c.is_available !== false).length;

  return {
    ...energy,
    season:         season.key,
    seasonLabel:    season.name,
    activeCreators: seasonallyActive,
    city,
    rituals:        season.rituals || [],
  };
}

// ── 7D.2 — quietEncounterPotential() ───────────────────────────
/**
 * Sanftes Potenzial für reale kreative Begegnungen.
 * Kein "Match mich mit jemandem in der Nähe".
 * Nur: beschreibt ob Voraussetzungen für echte Begegnungen günstig sind.
 *
 * Nie invasiv. Immer freiwillig. Kein Geo-Dating.
 */
export function quietEncounterPotential(userCreator, localCreators = []) {
  if (!userCreator?.location_label || localCreators.length < 1) {
    return { potential: 0, description: null };
  }

  const city = userCreator.location_label;

  // Kreative Nähe zu lokalen Creators
  const resonantLocals = localCreators
    .filter(c => c.id !== userCreator.id && c.is_available !== false)
    .map(c => {
      const { resonance } = creativeResonance(userCreator, c);
      return { creator: c, resonance };
    })
    .filter(({ resonance }) => resonance > 0.2)
    .sort((a, b) => b.resonance - a.resonance)
    .slice(0, 5);

  if (!resonantLocals.length) {
    return { potential: 0, description: null };
  }

  const avgResonance = resonantLocals.reduce((a, b) => a + b.resonance, 0) / resonantLocals.length;

  // Bridge-Creators in der Stadt (interdisziplinäre Begegnungen)
  const localBridges = localCreators.filter(c =>
    (c._bridgeScore || 0) > 0.3 && c.id !== userCreator.id
  );

  // Saisonales Potenzial
  const season = getSeason();
  const seasonBoost = ['fruehling', 'sommer'].includes(season.key) ? 0.1 : 0;

  const potential = clamp(avgResonance * 0.6 + Math.min(localBridges.length / 5, 0.3) + seasonBoost);

  // Beschreibung — nie als Matching-Zahl
  const description = potential > 0.6
    ? `In ${city} gibt es Menschen mit ähnlicher kreativer Energie.`
    : potential > 0.3
    ? `${city} bietet Raum für neue kreative Begegnungen.`
    : `In ${city} entstehen kreative Verbindungen.`;

  // Sanfte Einladung (optional — nie aufdrängen)
  const ritualHint = season.key === 'sommer'
    ? 'Ein gemeinsamer Spaziergang vielleicht?'
    : null;

  return {
    potential:      Math.round(potential * 100) / 100,
    description,
    ritualHint,
    resonantCount:  resonantLocals.length,
    bridgeCount:    localBridges.length,
    city,
    // KEIN öffentlicher Score nach außen
    // KEINE Namen der resonanten Creators ohne explizite Verbindung
    _private:       { topResonant: resonantLocals.slice(0, 2) },
  };
}

// ── 7D.2 — creativeMigrationFlow() ─────────────────────────────
/**
 * Kreative Bewegung zwischen Städten.
 * Nicht: Tracking. Sondern: Muster.
 * Erkennt wenn Creators mehrere Städte in ihrer Geschichte haben.
 */
export function creativeMigrationFlow(creators = []) {
  const cityHistory = {};  // city → creators die jemals dort aktiv waren

  for (const c of creators) {
    const city = c.location_label?.toLowerCase().trim();
    if (!city) continue;
    if (!cityHistory[city]) cityHistory[city] = new Set();
    cityHistory[city].add(c.id);
  }

  // Städte nach kreativer Dichte
  const flows = Object.entries(cityHistory)
    .filter(([, ids]) => ids.size >= 2)
    .map(([city, ids]) => ({
      city:     city.charAt(0).toUpperCase() + city.slice(1),
      count:    ids.size,
      // Nie öffentlich: wer genau
    }))
    .sort((a, b) => b.count - a.count);

  // Kreative Knotenpunkte (Städte die besonders verbinden)
  const hubs = flows.filter(f => f.count >= 3).slice(0, 5);

  return {
    flows:     flows.slice(0, 10),
    hubs,
    totalCities: Object.keys(cityHistory).length,
    description: hubs.length > 0
      ? `${hubs[0].city} ist ein kreativer Knotenpunkt.`
      : 'Kreative Präsenz verteilt sich ruhig.',
    // Niemals: individuelle Bewegungs-Daten
  };
}

// ── 7D.2 — cityCreativeTexture() ───────────────────────────────
/**
 * Die kreative Persönlichkeit einer Stadt.
 * Atmosphärische Beschreibung — kein Ranking, kein Vergleich.
 */
export function cityCreativeTexture(city = '', creators = []) {
  if (!city) return null;

  const cityLower = city.toLowerCase();
  const cityCreators = creators.filter(c =>
    c.location_label?.toLowerCase().includes(cityLower)
  );

  if (cityCreators.length === 0) return null;

  // Domain-Mix
  const DOMAIN_FAMILIES = {
    visual:   ['foto','illustration','design','video','malerei'],
    sonic:    ['musik','sound','podcast','gesang','komposition'],
    crafted:  ['keramik','schmuck','textil','holz','töpferei'],
    written:  ['text','lyrik','storytelling','journalismus'],
    digital:  ['code','web','app','generative'],
    body:     ['tanz','theater','performance','yoga'],
  };

  const domainDist = {};
  for (const c of cityCreators) {
    const text = [...(c.dna_tags || []), c.talent || ''].join(' ').toLowerCase();
    for (const [fam, kws] of Object.entries(DOMAIN_FAMILIES)) {
      if (kws.some(k => text.includes(k))) {
        domainDist[fam] = (domainDist[fam] || 0) + 1;
      }
    }
  }

  const topDomains = Object.entries(domainDist)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([d]) => d);

  // Mood-Mix
  const moodDist = {};
  for (const c of cityCreators) {
    for (const m of [...(c.mood_tags || []), c.mood].filter(Boolean)) {
      moodDist[m] = (moodDist[m] || 0) + 1;
    }
  }
  const topMood = Object.entries(moodDist)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'kreativ';

  // Diversity Score
  const diversity = Object.keys(domainDist).length / Object.keys(DOMAIN_FAMILIES).length;

  // Bridge-Ratio
  const bridgeRatio = cityCreators.filter(c => (c._bridgeScore || 0) > 0.3).length / cityCreators.length;

  // Atmosphärische Stadt-Persönlichkeit
  const personality =
    bridgeRatio > 0.3 && diversity > 0.5  ? 'weltoffen-interdisziplinär' :
    diversity > 0.6                        ? 'vielfältig und offen'       :
    topDomains[0] === 'crafted'            ? 'handwerklich-geerdet'       :
    topDomains[0] === 'sonic'              ? 'klangorientiert'            :
    topDomains[0] === 'visual'             ? 'visuell-geprägt'            :
    topMood === 'ruhig'                    ? 'ruhig-vertieft'             :
                                             'kreativ-offen'              ;

  return {
    city,
    personality,
    topDomains,
    topMood,
    diversity:   Math.round(diversity * 100) / 100,
    description: _buildCityDescription(city, personality, topDomains, topMood),
    creatorCount:cityCreators.length,
  };
}

function _buildCityDescription(city, personality, domains, mood) {
  const PERSONALITY_TEXTS = {
    'weltoffen-interdisziplinär':  'verbindet viele kreative Welten — eine Brückenstadt.',
    'vielfältig und offen':        'bietet Raum für viele kreative Richtungen.',
    'handwerklich-geerdet':        'trägt eine starke Handwerks-Tradition.',
    'klangorientiert':             'hat eine lebendige Klang-Szene.',
    'visuell-geprägt':             'ist reich an visueller Kreativität.',
    'ruhig-vertieft':              'kultiviert ruhige, tiefe kreative Arbeit.',
    'kreativ-offen':               'ist offen für kreative Begegnungen.',
  };
  const pText = PERSONALITY_TEXTS[personality] || 'hat eine eigene kreative Energie.';
  return `${city} ${pText}`;
}

// ── 7D.5 — localCulturalMemory() ───────────────────────────────
/**
 * Kreative Erinnerung einer Stadt.
 * Nicht: Trendkarten. Sondern: qualitative kulturelle Geschichte.
 *
 * @param {string}  city
 * @param {Array}   collaborations — lokale Zusammenarbeiten
 * @param {Array}   works          — lokale Werke
 */
export function localCulturalMemory(city = '', collaborations = [], works = []) {
  if (!city) return null;

  const cityLower = city.toLowerCase();

  // Lokale Themen aus Werken (Tags)
  const localTags = works.flatMap(w => w.tags || w.dna_tags || []);
  const tagFreq   = {};
  for (const t of localTags) tagFreq[t] = (tagFreq[t] || 0) + 1;
  const recurringThemes = Object.entries(tagFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag]) => tag);

  // Langfristige Kollaborationen
  const longTermCollabs = collaborations.filter(c => (c.duration_days || 0) > 14);

  // Saisonale Kontinuität
  const season = getSeason();
  const seasonalTheme = season.themes[0];

  return {
    city,
    recurringThemes,
    longTermCollabCount: longTermCollabs.length,
    seasonalTheme,
    hasHistory:          recurringThemes.length > 0 || longTermCollabs.length > 0,
    description:
      recurringThemes.length > 0
        ? `${city} kehrt immer wieder zurück zu: ${recurringThemes.slice(0, 2).join(', ')}.`
        : `${city}s kreative Geschichte schreibt sich gerade.`,
    // Nie: öffentliche Vergangenheitskarte
    _private: { tagFreq, longTermCollabs: longTermCollabs.slice(0, 3) },
  };
}

// ── 7D.8 — localHealthMetrics() ────────────────────────────────
/**
 * Lokale Gesundheitsmetriken einer Stadt.
 * Keine Heatmaps. Keine Geo-Competition.
 * Nur: qualitative Signale für interne Beobachtung.
 */
export function localHealthMetrics(city = '', creators = [], collaborations = []) {
  const cityCreators = creators.filter(c =>
    c.location_label?.toLowerCase().trim() === city.toLowerCase().trim()
  );

  if (!cityCreators.length) return null;

  // 1. Lokale kreative Vielfalt
  const allDomains  = new Set(cityCreators.flatMap(c => c.dna_tags || [])).size;
  const diversity   = clamp(allDomains / 10);

  // 2. Lokale Kollaborationswärme
  const localCollabs = collaborations.filter(c =>
    c.participants?.some(p => cityCreators.find(cc => cc.id === p))
  );
  const collabWarmth = clamp(localCollabs.length / Math.max(cityCreators.length, 1) / 0.5);

  // 3. Neighborhood Resonance (wie gut kennen sich Locals?)
  let resonanceSum = 0; let pairs = 0;
  for (let i = 0; i < Math.min(cityCreators.length, 10); i++) {
    for (let j = i + 1; j < Math.min(cityCreators.length, 10); j++) {
      const { resonance } = creativeResonance(cityCreators[i], cityCreators[j]);
      resonanceSum += resonance; pairs++;
    }
  }
  const neighborhoodResonance = pairs > 0 ? resonanceSum / pairs : 0;

  // 4. Interdisziplinäre Offenheit
  const DOMAIN_FAMILIES = {
    visual:['foto','design','video'], sonic:['musik','sound'],
    crafted:['keramik','textil','holz'], written:['text','lyrik'],
    digital:['code','web'], body:['tanz','theater'],
  };
  const familiesPresent = new Set();
  for (const c of cityCreators) {
    const text = [...(c.dna_tags||[]), c.talent||''].join(' ').toLowerCase();
    for (const [fam, kws] of Object.entries(DOMAIN_FAMILIES)) {
      if (kws.some(k => text.includes(k))) familiesPresent.add(fam);
    }
  }
  const interdiscOpen = clamp(familiesPresent.size / 6);

  // 5. Saisonale Vitalität
  const season = getSeason();
  const seasonBoost = { fruehling: 0.1, sommer: 0.12, herbst: 0.05, winter: 0 };
  const seasonVitality = clamp(
    (cityCreators.filter(c => c.is_available !== false).length / cityCreators.length) +
    (seasonBoost[season.key] || 0)
  );

  // 6. Lokale Nachhaltigkeit
  const veteranCreators = cityCreators.filter(c => {
    const months = c.created_at
      ? (Date.now() - new Date(c.created_at).getTime()) / 2592000000 : 0;
    return months > 6;
  }).length;
  const sustainability = clamp(veteranCreators / Math.max(cityCreators.length, 1));

  // Gesamtscore (intern — nie öffentlich)
  const overallScore = clamp(
    diversity           * 0.20 +
    collabWarmth        * 0.20 +
    neighborhoodResonance * 0.20 +
    interdiscOpen       * 0.15 +
    seasonVitality      * 0.15 +
    sustainability      * 0.10
  );

  return {
    city,
    metrics: {
      diversity:            Math.round(diversity * 100) / 100,
      collabWarmth:         Math.round(collabWarmth * 100) / 100,
      neighborhoodResonance:Math.round(neighborhoodResonance * 100) / 100,
      interdisciplinaryOpen:Math.round(interdiscOpen * 100) / 100,
      seasonalVitality:     Math.round(seasonVitality * 100) / 100,
      sustainability:       Math.round(sustainability * 100) / 100,
    },
    overallScore: Math.round(overallScore * 100) / 100,
    level:
      overallScore > 0.70 ? 'kulturell lebendig' :
      overallScore > 0.50 ? 'kulturell stabil'   :
      overallScore > 0.30 ? 'kulturell wachsend' : 'kulturell entstehend',
    creatorCount: cityCreators.length,
    season:       season.key,
    // NIEMALS als öffentliche Stadtbewertung zeigen
    _isInternal:  true,
  };
}

// React Hook
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useLocalResonance(userLocation) {
  const [creators,       setCreators]       = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [loading,        setLoading]        = useState(false);

  const load = useCallback(async () => {
    if (!userLocation) return;
    setLoading(true);
    try {
      const [creatorsRes, collabsRes] = await Promise.all([
        supabase.from('profiles')
          .select('id, display_name, talent, dna_tags, mood, mood_tags, location_label, is_available, is_verified, avatar_url, focus_type, updated_at, created_at, _bridgeScore:bridge_score')
          .eq('has_talent_profile', true)
          .not('location_label', 'is', null)
          .limit(200),
        supabase.from('bookings')
          .select('id, wirker_user_id, client_user_id, status, created_at')
          .eq('status', 'completed')
          .limit(100),
      ]);
      setCreators(creatorsRes.data || []);
      setCollaborations(collabsRes.data || []);
    } catch (err) {
      console.error('[LocalResonance]', err?.message);
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  useEffect(() => { load(); }, [load]);

  const resonance    = useMemo(() => localResonance(userLocation, creators), [userLocation, creators]);
  const texture      = useMemo(() => cityCreativeTexture(userLocation, creators), [userLocation, creators]);
  const seasonal     = useMemo(() => seasonalLocalEnergy(userLocation, creators.filter(c => c.location_label?.toLowerCase().trim() === userLocation?.toLowerCase().trim())), [userLocation, creators]);
  const healthMetrics= useMemo(() => localHealthMetrics(userLocation, creators, collaborations), [userLocation, creators, collaborations]);

  return {
    creators, collaborations, loading, reload: load,
    resonance, texture, seasonal, healthMetrics,
    privacyRules: LOCATION_PRIVACY_RULES,
  };
}
