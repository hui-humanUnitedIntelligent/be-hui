// src/lib/memory/index.js
// HUI — Multi-Generational Creative Memory Engine — Phase 8C
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Kreative Erinnerung lebt — sie ist kein Archiv.
// Sie verbindet Generationen ohne Hierarchien zu erzeugen.
// Sie erkennt Wiederkehr ohne Nostalgie zu erzwingen.
//
// WAS DIESES SYSTEM NICHT TUT:
//   ❌ Retroaktives Ranking ("wer war wichtig?")
//   ❌ Nostalgie-Algorithmus
//   ❌ Historische Elitenbildung
//   ❌ Kulturelle Versteinerung
//   ❌ Erinnerungsausbeutung für Engagement
//
// WAS DIESES SYSTEM TUT:
//   ✅ Lebendige Verbindungen zwischen Generationen
//   ✅ Wiederkehrende Motive in neuen Formen
//   ✅ Kreative Lineages ohne Hierarchie
//   ✅ Lokale Geschichte als lebendiger Boden
//   ✅ Langsame Entwicklung erkennen und ehren
//
// FUNKTIONEN:
//   culturalMemory()        → Lebendiges Kulturgedächtnis einer Gemeinschaft
//   creativeLineage()       → Kreative Verbindungslinien ohne Hierarchie
//   resonanceContinuity()   → Resonanz die über Zeit trägt
//   recurringMotifs()       → Wiederkehrende kreative Themen
//   generationalInfluence() → Einflüsse die Generationen verbinden
//   creativeRediscovery()   → Vergessenes das zurückkehrt
//   communityMemoryTrace()  → Gemeinschaftliche Erinnerungsschicht
//   memoryHealthScore()     → Gesundheit des Gedächtnissystems
// ═══════════════════════════════════════════════════════════════

import { detectCreativeMotifs, MOTIF_TYPES }
  from '@/lib/cocreation/index';
import { createCollaborationMemory, JOURNEY_PHASES }
  from '@/lib/creativeJourney/index';
import { buildRoomMemory }
  from '@/lib/livingSpaces/index';
import { culturalMemorySnapshot }
  from '@/lib/culturalEvolution/index';
import { getSeason }
  from '@/lib/culture/index';
import { creativeResonance }
  from '@/lib/graph/index';

const clamp = (v, min = 0, max = 1) => Math.min(Math.max(v, min), max);
function daysSince(d) { return d ? (Date.now() - new Date(d).getTime()) / 86400000 : 0; }
function monthsSince(d) { return daysSince(d) / 30; }
function yearsSince(d)  { return daysSince(d) / 365; }

// ── Zeitschichten der Erinnerung ────────────────────────────────
export const MEMORY_LAYERS = {
  moment:     { label: 'Moment',     maxDays: 30,    description: 'Resonanz-Momente, Durchbrüche' },
  season:     { label: 'Saison',     maxDays: 120,   description: 'Saisonale kreative Energie' },
  phase:      { label: 'Phase',      maxDays: 730,   description: 'Kreative Bewegungen, Kollaborations-Zyklen' },
  generation: { label: 'Generation', maxDays: 3650,  description: 'Lineages, Einflusslinien, lokale Geschichte' },
  culture:    { label: 'Kultur',     maxDays: Infinity, description: 'Wiederkehrende Motive, kulturelle DNA' },
};

// ── Lineage-Typen ───────────────────────────────────────────────
export const LINEAGE_TYPES = {
  inspired_by:        { label: 'Inspiriert von',         icon: '✦',  weight: 0.6 },
  continued_by:       { label: 'Weitergeführt durch',    icon: '→',  weight: 0.8 },
  grown_from_local:   { label: 'Lokal gewachsen aus',    icon: '🌱', weight: 0.7 },
  interdisciplinary:  { label: 'Interdisziplinär erweitert',icon:'⚗️',weight: 0.9 },
  reinterpreted:      { label: 'Neu interpretiert',      icon: '◎',  weight: 0.7 },
  rediscovered:       { label: 'Wiederentdeckt',         icon: '💫', weight: 0.8 },
};

// ── 8C.2 — culturalMemory() ─────────────────────────────────────
/**
 * Lebendiges Kulturgedächtnis einer Gemeinschaft.
 * Nicht: Archiv. Sondern: was aus der Vergangenheit noch lebt.
 *
 * @param {Object} community — { works, collaborations, creators, location }
 */
export function culturalMemory(community = {}) {
  const {
    works          = [],
    collaborations = [],
    creators       = [],
    location       = '',
  } = community;

  if (!works.length && !collaborations.length) {
    return { memory: null, alive: false, description: 'Noch keine gemeinsame Geschichte.' };
  }

  // Zeitschicht bestimmen
  const oldestWork   = works.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];
  const communityAge = oldestWork ? monthsSince(oldestWork.created_at) : 0;

  const layer = communityAge < 1   ? MEMORY_LAYERS.moment    :
                communityAge < 4   ? MEMORY_LAYERS.season    :
                communityAge < 24  ? MEMORY_LAYERS.phase     :
                communityAge < 120 ? MEMORY_LAYERS.generation: MEMORY_LAYERS.culture;

  // Wiederkehrende Motive
  const allNotes = [...works.map(w => w.description || w.title || ''),
                    ...collaborations.map(c => c.message || c.description || '')].join(' ');
  const motifs   = detectCreativeMotifs([], allNotes);

  // Längste Kollaborationen
  const deepCollabs = collaborations
    .filter(c => c.status === 'completed')
    .map(c => ({
      ...c,
      durationDays: daysSince(c.created_at),
    }))
    .sort((a, b) => b.durationDays - a.durationDays)
    .slice(0, 3);

  // Bedeutsame Werke (Werke mit Empfehlungen oder hoher Resonanz)
  const significantWorks = works
    .filter(w => (w.recommendation_count || 0) > 0 || (w.resonance_count || 0) > 2)
    .slice(0, 5)
    .map(w => ({ title: w.title || 'Unbenannt', age: Math.round(monthsSince(w.created_at)), ageUnit: 'Monate' }));

  // Saisonaler Kontext
  const season = getSeason();

  return {
    alive:           true,
    layer:           layer.label,
    communityAge:    Math.round(communityAge),
    motifs:          motifs.slice(0, 4),
    deepCollabs:     deepCollabs.map(c => ({ id: c.id, durationDays: Math.round(c.durationDays) })),
    significantWorks,
    location,
    season:          season.key,
    description:     _buildCommunityMemoryDescription(layer, motifs, communityAge, location),
    // Kein Ranking — kein "bestes Werk"
    _isArchival:     true,
  };
}

function _buildCommunityMemoryDescription(layer, motifs, ageMonths, location) {
  const loc  = location ? ` in ${location}` : '';
  const top  = motifs[0]?.word;
  if (layer.label === 'Kultur')
    return `Eine kulturelle Geschichte${loc} die Generationen trägt${top ? ` — immer wieder: „${top}"` : ''}.`;
  if (layer.label === 'Generation')
    return `${Math.round(ageMonths / 12)} Jahre gemeinsamer kreativer Geschichte${loc}${top ? ` — geprägt von: „${top}"` : ''}.`;
  if (layer.label === 'Phase')
    return `Eine kreative Phase${loc} die Substanz entwickelt${top ? ` — Motiv: „${top}"` : ''}.`;
  return `Eine entstehende kreative Gemeinschaft${loc} — am Anfang ihrer Geschichte.`;
}

// ── 8C.3 — creativeLineage() ───────────────────────────────────
/**
 * Kreative Verbindungslinien zwischen Creators über Zeit.
 * Keine Hierarchie: "inspiriert von" ≠ "weniger als".
 *
 * @param {Object} creator     — der aktuelle Creator
 * @param {Array}  allCreators — alle Creators (für Resonanz-Vergleich)
 * @param {Array}  works       — Werke des Creators
 */
export function creativeLineage(creator, allCreators = [], works = []) {
  if (!creator?.id) return { lineage: [], strength: 0 };

  // Potenzielle Einflüsse: Creators mit ähnlicher DNA + älter als der Creator
  const olderCreators = allCreators.filter(c =>
    c.id !== creator.id &&
    daysSince(c.created_at) > daysSince(creator.created_at) + 90  // mind. 90 Tage älter
  );

  // Resonanz-basierte Verbindungen
  const connections = olderCreators
    .map(c => {
      const { resonance } = creativeResonance(creator, c);
      // Lineage-Typ aus Domain-Überlappung bestimmen
      const creatorDomains = (creator.dna_tags || []).join(' ').toLowerCase();
      const otherDomains   = (c.dna_tags || []).join(' ').toLowerCase();
      const domainOverlap  = (creator.dna_tags || []).filter(t =>
        (c.dna_tags || []).includes(t)
      ).length;
      const hasDiffDomains = domainOverlap === 0 && resonance > 0.3;

      const lineageType = hasDiffDomains ? 'interdisciplinary' :
                          resonance > 0.6 ? 'continued_by'    :
                          resonance > 0.4 ? 'inspired_by'     : null;

      return lineageType ? { creator: c, resonance, type: lineageType } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.resonance - a.resonance)
    .slice(0, 5);

  // Lineage-Stärke
  const strength = connections.length > 0
    ? connections.reduce((a, c) => a + c.resonance * LINEAGE_TYPES[c.type].weight, 0)
      / connections.length
    : 0;

  return {
    lineage: connections.map(c => ({
      creatorId:  c.creator.id,
      name:       c.creator.display_name || c.creator.full_name || 'Unbekannt',
      resonance:  Math.round(c.resonance * 100) / 100,
      type:       c.type,
      typeLabel:  LINEAGE_TYPES[c.type].label,
      icon:       LINEAGE_TYPES[c.type].icon,
      // Nie: "besser/schlechter" — nur: "verbunden"
    })),
    strength: Math.round(strength * 100) / 100,
    hasLineage: connections.length > 0,
    description: connections.length > 0
      ? `Kreative Verbindungslinien zu ${connections.length} anderen Creators.`
      : 'Eine eigenständige kreative Stimme — noch nicht verbunden.',
  };
}

// ── 8C.2 — resonanceContinuity() ───────────────────────────────
/**
 * Resonanz die über Zeit trägt — nicht nur im Moment.
 * Misst: wie stark sind kreative Verbindungen über Monate/Jahre hinweg?
 */
export function resonanceContinuity(collaborations = [], creators = []) {
  if (!collaborations.length) return { continuity: 0, level: 'noch keine Geschichte' };

  const now = Date.now();

  // Langfristige Kollaborationen (> 1 Monat)
  const longTerm = collaborations.filter(c =>
    daysSince(c.created_at) > 30 && c.status === 'completed'
  );

  // Wiederkehrende Kollaborations-Paare
  const pairCount = {};
  for (const c of collaborations) {
    const key = [c.wirker_user_id, c.client_user_id].sort().join(':');
    pairCount[key] = (pairCount[key] || 0) + 1;
  }
  const recurringPairs = Object.values(pairCount).filter(n => n >= 2).length;
  const totalPairs     = Object.keys(pairCount).length || 1;

  // Querschnitt-Generationen: alte Creators mit neuen verbunden?
  const veteranIds  = new Set(creators.filter(c => daysSince(c.created_at) > 365).map(c => c.id));
  const newcomerIds = new Set(creators.filter(c => daysSince(c.created_at) < 90).map(c => c.id));
  const crossGenCollabs = collaborations.filter(c =>
    (veteranIds.has(c.wirker_user_id) && newcomerIds.has(c.client_user_id)) ||
    (veteranIds.has(c.client_user_id) && newcomerIds.has(c.wirker_user_id))
  ).length;

  const continuity = clamp(
    Math.min(longTerm.length / 10, 1)      * 0.40 +
    (recurringPairs / totalPairs)           * 0.35 +
    Math.min(crossGenCollabs / 5, 1)        * 0.25
  );

  return {
    continuity:      Math.round(continuity    * 100) / 100,
    longTermCount:   longTerm.length,
    recurringPairs,
    crossGenCollabs,
    level:
      continuity > 0.70 ? 'tief und dauerhaft' :
      continuity > 0.50 ? 'wachsend'           :
      continuity > 0.30 ? 'entstehend'         : 'noch jung',
    description:
      continuity > 0.60
        ? 'Kreative Verbindungen die über Zeit gewachsen sind.'
        : 'Erste Fäden einer sich entwickelnden gemeinsamen Geschichte.',
  };
}

// ── 8C.2 — recurringMotifs() ───────────────────────────────────
/**
 * Wiederkehrende kreative Themen über Generationen.
 * Erkennt: welche Motive kehren in verschiedenen Formen wieder?
 * Nicht: was war "populär". Was kehrt zurück.
 */
export function recurringMotifs(works = [], collaborations = [], minRecurrence = 2) {
  // Text aus allen Werken und Kollaborationen
  const allTexts = [
    ...works.map(w => [w.title, w.description, ...(w.tags || [])].join(' ')),
    ...collaborations.map(c => c.message || c.description || ''),
  ].join(' ').toLowerCase();

  // Wort-Frequenz (Motiv-Kandidaten)
  const words  = allTexts.split(/\s+/).filter(w => w.length > 4);
  const freq   = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;

  const STOP_WORDS = new Set([
    'haben','werden','können','müssen','wollen','sollen','dass','aber',
    'oder','und','auch','noch','mehr','sehr','dann','wenn','weil','durch',
    'nach','über','unter','beim','diese','dieser','dieses','eine','einen',
    'einem','einer','nicht','sein','sind','wird','wurde','wurde','einen',
  ]);

  // Motive: ≥ minRecurrence × und nicht Stop-Word
  const motifs = Object.entries(freq)
    .filter(([w, n]) => n >= minRecurrence && !STOP_WORDS.has(w))
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([word, count]) => {
      // Zeitliche Verteilung: wann taucht dieses Motiv auf?
      const inWorks    = works.filter(w =>
        [w.title, w.description, ...(w.tags||[])].join(' ').toLowerCase().includes(word)
      );
      const oldest     = inWorks.sort((a,b) => new Date(a.created_at) - new Date(b.created_at))[0];
      const newest     = inWorks.sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];
      const ageSpanMonths = (oldest && newest)
        ? (new Date(newest.created_at) - new Date(oldest.created_at)) / 2592000000 : 0;

      return {
        word,
        count,
        ageSpanMonths: Math.round(ageSpanMonths),
        // Lang-spannendes Motiv = übergreifendes kulturelles Thema
        isCultural:    ageSpanMonths > 12,
        description:   ageSpanMonths > 24
          ? `Das Thema „${word}" begleitet diese kreative Gemeinschaft seit ${Math.round(ageSpanMonths)} Monaten.`
          : `„${word}" taucht wiederholt auf.`,
        type: ageSpanMonths > 12 ? 'cultural_motif' : 'recurring_theme',
      };
    });

  return {
    motifs,
    culturalMotifs: motifs.filter(m => m.isCultural),
    hasCulturalDepth: motifs.some(m => m.isCultural),
  };
}

// ── 8C.2 — generationalInfluence() ─────────────────────────────
/**
 * Einflüsse die Generationen verbinden.
 * Macht sichtbar: welche kreativen Ideen reisen durch Zeit?
 * Keine Hierarchie: früher ≠ besser.
 */
export function generationalInfluence(creators = [], works = [], collaborations = []) {
  if (creators.length < 4) return { influence: 0, generations: {}, level: 'zu wenig Daten' };

  // 3 Generationen definieren
  const gens = {
    pioneer:   creators.filter(c => daysSince(c.created_at) > 730),   // > 2 Jahre
    bridge:    creators.filter(c => {
      const d = daysSince(c.created_at); return d >= 180 && d <= 730;
    }),
    fresh:     creators.filter(c => daysSince(c.created_at) < 180),
  };

  // Generationsübergreifende Resonanz (Pioneer ↔ Fresh)
  let pioneerFreshResonance = 0; let pairs = 0;
  for (const p of gens.pioneer.slice(0, 5)) {
    for (const f of gens.fresh.slice(0, 5)) {
      const { resonance } = creativeResonance(p, f);
      pioneerFreshResonance += resonance; pairs++;
    }
  }
  const avgCrossGenResonance = pairs > 0 ? pioneerFreshResonance / pairs : 0;

  // Domain-Übertragung: welche Domains werden von Pioneers zu Fresh weitergegeben?
  const pioneerDomains = new Set(gens.pioneer.flatMap(c => c.dna_tags || []));
  const freshDomains   = new Set(gens.fresh.flatMap(c => c.dna_tags || []));
  const sharedDomains  = [...pioneerDomains].filter(d => freshDomains.has(d));
  const domainTransfer = pioneerDomains.size > 0 ? sharedDomains.length / pioneerDomains.size : 0;

  // Cross-Gen Kollaborationen
  const pioneerIds = new Set(gens.pioneer.map(c => c.id));
  const freshIds   = new Set(gens.fresh.map(c => c.id));
  const crossCollabs = collaborations.filter(c =>
    (pioneerIds.has(c.wirker_user_id) && freshIds.has(c.client_user_id)) ||
    (pioneerIds.has(c.client_user_id) && freshIds.has(c.wirker_user_id))
  ).length;

  const influence = clamp(
    avgCrossGenResonance  * 0.40 +
    domainTransfer        * 0.35 +
    Math.min(crossCollabs / 5, 1) * 0.25
  );

  return {
    influence:            Math.round(influence              * 100) / 100,
    avgCrossGenResonance: Math.round(avgCrossGenResonance   * 100) / 100,
    domainTransfer:       Math.round(domainTransfer         * 100) / 100,
    crossCollabs,
    sharedDomains:        sharedDomains.slice(0, 5),
    generations: {
      pioneer: gens.pioneer.length,
      bridge:  gens.bridge.length,
      fresh:   gens.fresh.length,
    },
    level:
      influence > 0.65 ? 'reich — Erfahrung fließt' :
      influence > 0.45 ? 'wachsend'                 :
      influence > 0.25 ? 'beginnend'                : 'kaum vorhanden',
    description:
      influence > 0.60
        ? `Kreative Erfahrung fließt zwischen den Generationen — ${sharedDomains.slice(0,2).join(', ')} als Verbindungsfelder.`
        : 'Erste generationsübergreifende Verbindungen entstehen.',
  };
}

// ── 8C.2 — creativeRediscovery() ───────────────────────────────
/**
 * Vergessenes das zurückkehrt.
 * Erkennt: kreative Richtungen die eine Pause hatten und wiederkehren.
 * Wiederentdeckung ist keine Nostalgie — sie ist kreative Ressource.
 */
export function creativeRediscovery(works = [], windowMonths = 6) {
  const now = Date.now();
  const windowMs = windowMonths * 30 * 86400000;

  // Tags/Domains aus aktuellen Werken (letzte windowMonths)
  const recent = works.filter(w => daysSince(w.created_at) < windowMonths * 30);
  const older  = works.filter(w =>
    daysSince(w.created_at) > windowMonths * 30 &&
    daysSince(w.created_at) < windowMonths * 30 * 4  // max 2 Jahre alt
  );
  const oldest = works.filter(w => daysSince(w.created_at) > windowMonths * 30 * 4);

  if (!recent.length || !older.length) return { rediscoveries: [], hasRediscovery: false };

  // Tags die in älteren Werken vorkamen, dann verschwanden, jetzt zurückkehren
  const recentTags  = new Set(recent.flatMap(w => w.tags || []));
  const olderTags   = new Set(older.flatMap(w => w.tags || []));
  const oldestTags  = new Set(oldest.flatMap(w => w.tags || []));

  // Wiederentdeckt = in oldest + recent, aber nicht in older (hatte Pause)
  const rediscovered = [...recentTags].filter(tag =>
    oldestTags.has(tag) && !olderTags.has(tag)
  );

  const rediscoveries = rediscovered.slice(0, 4).map(tag => ({
    theme:       tag,
    description: `„${tag}" kehrt zurück — nach einer kreativen Pause.`,
    type:        'rediscovered',
    icon:        LINEAGE_TYPES.rediscovered.icon,
    // Keine Wertung: Wiederentdeckung ist neutral — weder besser noch schlechter
  }));

  return {
    rediscoveries,
    hasRediscovery:rediscoveries.length > 0,
    count:         rediscoveries.length,
    description:   rediscoveries.length > 0
      ? `${rediscoveries.length} kreative Themen kehren zurück.`
      : 'Keine Wiederentdeckungen in diesem Zeitfenster.',
  };
}

// ── 8C.4 — communityMemoryTrace() ──────────────────────────────
/**
 * Gemeinschaftliche Erinnerungsschicht.
 * Was gehört nicht einzelnen Creators — sondern der Gemeinschaft?
 * Kollaborative Momente, gemeinsame Wendepunkte, lokale Geschichte.
 */
export function communityMemoryTrace(space = {}, collaborations = [], works = []) {
  // Bedeutsame kollaborative Momente
  const significantMoments = (space.resonance_log || [])
    .filter(e => e.type === 'moment' || e.type === 'decision')
    .slice(0, 5)
    .map(e => ({
      type:    e.type,
      content: (e.content || '').slice(0, 80),
      age:     Math.round(monthsSince(e.created_at)),
      ageUnit: 'Monate',
    }));

  // Langjährige Präsenz-Muster
  const returnVisits = collaborations.filter(c => {
    const pairKey = [c.wirker_user_id, c.client_user_id].sort().join(':');
    return collaborations.filter(c2 =>
      [c2.wirker_user_id, c2.client_user_id].sort().join(':') === pairKey
    ).length >= 2;
  }).length;

  // Saisonale Erinnerungen
  const season = getSeason();
  const seasonalWorks = works.filter(w => {
    const month = new Date(w.created_at).getMonth();
    const seasonMonths = { fruehling: [2,3,4], sommer: [5,6,7], herbst: [8,9,10], winter: [11,0,1] };
    return (seasonMonths[season.key] || []).includes(month);
  });

  return {
    significantMoments,
    returnVisits,
    seasonalWorks:   seasonalWorks.length,
    currentSeason:   season.key,
    hasMemory:       significantMoments.length > 0 || returnVisits > 0,
    trace: {
      depth:      significantMoments.length > 3 ? 'tief' : significantMoments.length > 0 ? 'entstehend' : 'jung',
      recurring:  returnVisits > 0,
      seasonal:   seasonalWorks.length > 0,
    },
    description: significantMoments.length > 0
      ? `${significantMoments.length} bedeutsame Momente in der gemeinsamen Geschichte.`
      : 'Geschichte beginnt sich zu schreiben.',
  };
}

// ── 8C.7 — memoryHealthCheck() ─────────────────────────────────
/**
 * Erkennt wenn Erinnerung problematisch wird.
 * Warnt vor: Versteinerung, nostalgischer Dominanz, historischer Elite.
 */
export function memoryHealthCheck(data = {}) {
  const {
    works          = [],
    collaborations = [],
    creators       = [],
    motifs         = [],
  } = data;

  const issues = [];
  const suggestions = [];

  // 1. Kulturelle Versteinerung: alte Werke dominieren Discovery
  const oldWorks  = works.filter(w => daysSince(w.created_at) > 365).length;
  const totalWorks= works.length || 1;
  const oldDominance = oldWorks / totalWorks;
  if (oldDominance > 0.70)
    issues.push('cultural_ossification');

  // 2. Nostalgische Dominanz: Erinnerungs-Content > frische Kreation
  const nostalgicContent = works.filter(w =>
    (w.tags || []).some(t => ['nostalgie', 'classic', 'vintage', 'throwback'].includes(t.toLowerCase()))
  ).length;
  if (nostalgicContent / totalWorks > 0.30)
    issues.push('nostalgic_dominance');

  // 3. Historische Elitenbildung: Pioneer-Creators haben > 60% der Sichtbarkeit
  const pioneers = creators.filter(c => daysSince(c.created_at) > 730);
  if (pioneers.length / creators.length > 0.60 && creators.length > 10)
    issues.push('historical_elite_risk');

  // 4. Erinnerungsmonokultur: immer dasselbe Motiv
  const dominantMotif = motifs[0];
  if (dominantMotif && motifs.length > 0) {
    const dominance = dominantMotif.count / motifs.reduce((a, m) => a + m.count, 0);
    if (dominance > 0.50 && motifs.length > 3)
      issues.push('memory_monoculture');
  }

  // Sanfte Öffnungs-Empfehlungen
  if (issues.includes('cultural_ossification'))
    suggestions.push('Mehr frische Werke in Discovery einbeziehen. Neue Stimmen aktiv einladen.');
  if (issues.includes('nostalgic_dominance'))
    suggestions.push('Gegenwärtiges Schaffen stärker sichtbar machen. Nostalgie als eine Stimme unter vielen.');
  if (issues.includes('historical_elite_risk'))
    suggestions.push('Jüngere Creators aktiver Discovery-Priorität geben. Generationsübergreifende Verbindungen fördern.');
  if (issues.includes('memory_monoculture'))
    suggestions.push('Andere Motive und Themen aktiv sichtbar machen — Motiv-Vielfalt als Gesundheitszeichen.');

  return {
    healthy:     issues.length === 0,
    issues,
    suggestions,
    oldDominance:Math.round(oldDominance * 100) / 100,
    description: issues.length === 0
      ? 'Das kreative Gedächtnis ist lebendig und offen.'
      : `${issues.length} Gedächtnis-Gesundheits-Signal${issues.length > 1 ? 'e' : ''} — sanfte Öffnung empfohlen.`,
  };
}

// ── 8C.8 — memoryHealthScore() ─────────────────────────────────
/**
 * Gesamter Creative Memory Score.
 * Aggregiert alle Gedächtnis-Dimensionen.
 */
export function memoryHealthScore(community = {}) {
  const {
    works          = [],
    collaborations = [],
    creators       = [],
    spaces         = [],
  } = community;

  const memory    = culturalMemory({ works, collaborations, creators });
  const continuity= resonanceContinuity(collaborations, creators);
  const motifs    = recurringMotifs(works, collaborations);
  const influence = generationalInfluence(creators, works, collaborations);
  const rediscov  = creativeRediscovery(works);
  const health    = memoryHealthCheck({ works, collaborations, creators, motifs: motifs.motifs });

  const score = clamp(
    (memory.alive ? 0.15 : 0) +
    continuity.continuity * 0.25 +
    (motifs.hasCulturalDepth ? 0.15 : 0.05) +
    influence.influence    * 0.25 +
    (rediscov.hasRediscovery ? 0.10 : 0.05) +
    (health.healthy ? 0.10 : 0.05)
  );

  return {
    score:   Math.round(score * 100) / 100,
    level:
      score > 0.75 ? 'lebendig und generationsreich' :
      score > 0.55 ? 'wachsend'                      :
      score > 0.35 ? 'entstehend'                    : 'jung',
    dimensions: { memory, continuity, motifs, influence, rediscov, health },
    season:      getSeason().key,
    timestamp:   new Date().toISOString(),
    _isInternal: true,
  };
}

// React Hook
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useCreativeMemory(locationFilter = null) {
  const [works,          setWorks]          = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [creators,       setCreators]       = useState([]);
  const [loading,        setLoading]        = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let worksQ = supabase.from('works').select('id, title, description, tags, creator_id, created_at, recommendation_count').order('created_at', { ascending: false }).limit(200);
      if (locationFilter) {
        // Werke von Creators in dieser Region
        const { data: localCreators } = await supabase.from('profiles')
          .select('id').ilike('location_label', `%${locationFilter}%`).limit(100);
        if (localCreators?.length) {
          worksQ = worksQ.in('creator_id', localCreators.map(c => c.id));
        }
      }

      const [worksRes, collabsRes, creatorsRes] = await Promise.all([
        worksQ,
        supabase.from('bookings').select('id, wirker_user_id, client_user_id, status, message, created_at').eq('status', 'completed').limit(200),
        supabase.from('profiles').select('id, display_name, dna_tags, mood, location_label, created_at').limit(300),
      ]);
      setWorks(worksRes.data          || []);
      setCollaborations(collabsRes.data || []);
      setCreators(creatorsRes.data    || []);
    } catch (err) {
      console.error('[CreativeMemory]', err?.message);
    } finally {
      setLoading(false);
    }
  }, [locationFilter]);

  useEffect(() => { load(); }, [load]);

  const score = useMemo(() =>
    memoryHealthScore({ works, collaborations, creators }),
    [works, collaborations, creators]
  );

  return {
    works, collaborations, creators, loading, reload: load,
    memoryScore: score,
    layers:      MEMORY_LAYERS,
    lineageTypes:LINEAGE_TYPES,
  };
}
