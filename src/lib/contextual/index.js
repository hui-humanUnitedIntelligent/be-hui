// src/lib/contextual/index.js
// HUI — Context Intelligence Engine V1 — Phase 5E
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// HUI versteht den kreativen Moment — nicht das Verhalten.
// Kontext-Intelligenz ist keine Überwachung.
// Sie ist Feingefühl.
//
// PRINZIPIEN:
// 1. Client-side only — kein Server-Tracking
// 2. Session-basiert — kein persistentes Profiling
// 3. Transparent — jede Funktion ist dokumentiert
// 4. Opt-out — User kann Kontext deaktivieren
// 5. Begrenzt — max. Einfluss auf Ranking: 10%
//
// ARCHITEKTUR:
// Alle Funktionen sind PURE (außer readSessionContext die
// sessionStorage nutzt — explizit markiert).
// ═══════════════════════════════════════════════════════════════

// ── Temporale Zonen — kreative Tagesrhythmen ──────────────────

/**
 * Zeitfenster mit kreativer Energie-Charakteristik.
 * Basiert auf allgemeinen kreativen Rhythmen — keine persönliche Analyse.
 */
export const TIME_ZONES = {
  late_night:  { hours: [0,5],   label: 'Stille Nacht',      energy: 'quiet',        mood: 'kontemplativ' },
  early_morning:{ hours: [5,9],  label: 'Aufbruch',          energy: 'awakening',    mood: 'frisch' },
  morning:     { hours: [9,12],  label: 'Produktiver Morgen', energy: 'focused',      mood: 'professionell' },
  midday:      { hours: [12,14], label: 'Offene Mitte',      energy: 'social',       mood: 'warm' },
  afternoon:   { hours: [14,18], label: 'Kreativer Nachmittag',energy: 'creative',   mood: 'kreativ' },
  early_evening:{ hours: [18,21],label: 'Übergang',          energy: 'reflective',   mood: 'authentisch' },
  evening:     { hours: [21,24], label: 'Tiefe Abendzeit',   energy: 'deep',         mood: 'ruhig' },
};

/** Wochentag-Energie */
const DAY_ENERGY = {
  0: { label: 'Sonntag',    type: 'rest',        creativeBoost: 0.2 },   // kreative Ruhe
  1: { label: 'Montag',     type: 'intention',   creativeBoost: 0.6 },   // neue Woche, Aufbruch
  2: { label: 'Dienstag',   type: 'focused',     creativeBoost: 0.8 },   // produktivster Tag
  3: { label: 'Mittwoch',   type: 'collaborative',creativeBoost: 0.7 },  // Mitte, Austausch
  4: { label: 'Donnerstag', type: 'creative',    creativeBoost: 0.75 },  // kreativer Flow
  5: { label: 'Freitag',    type: 'open',        creativeBoost: 0.5 },   // abschließend, offen
  6: { label: 'Samstag',    type: 'exploratory', creativeBoost: 0.4 },   // entdeckend, entspannt
};

// ── Helper ─────────────────────────────────────────────────────

function clamp(v, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v));
}

function getCurrentTimeZone() {
  const h = new Date().getHours();
  for (const [key, zone] of Object.entries(TIME_ZONES)) {
    if (h >= zone.hours[0] && h < zone.hours[1]) return { key, ...zone };
  }
  return { key: 'evening', ...TIME_ZONES.evening };
}

function getCurrentDayEnergy() {
  return DAY_ENERGY[new Date().getDay()];
}

// ── 5E.2.1 — TIMING AFFINITY ───────────────────────────────────
/**
 * Passt ein Content-Item zur aktuellen Tageszeit?
 *
 * Keine invasive Analyse. Nur: passt die kreative Energie des Items
 * zur natürlichen Energie dieser Tageszeit?
 *
 * @param {Object} item     — Work, Creator, Experience
 * @param {Object} timeZone — aus getCurrentTimeZone()
 * @returns {number}        — 0–1
 */
export function timingAffinity(item, timeZone = null) {
  const tz = timeZone || getCurrentTimeZone();

  let score = 0.5;  // Neutral-Basis — Timing ist kein dominanter Faktor

  // Abend/Nacht → ruhige, tiefe Inhalte bevorzugen
  if (['evening', 'late_night'].includes(tz.key)) {
    const itemText = [item.bio, item.title, item.mood, ...(item.dna_tags || [])].join(' ').toLowerCase();
    const quietKeywords = ['ruhig', 'still', 'kontemplativ', 'tief', 'meditativ', 'handwerk', 'zeichnen'];
    const matches = quietKeywords.filter(k => itemText.includes(k)).length;
    score += matches * 0.08;
  }

  // Morgen/Vormittag → inspirierende, aufbrechende Inhalte
  if (['early_morning', 'morning'].includes(tz.key)) {
    const itemText = [item.bio, item.title, item.mood, ...(item.dna_tags || [])].join(' ').toLowerCase();
    const energyKeywords = ['inspirierend', 'aufbruch', 'kreativ', 'vision', 'neu', 'frisch'];
    const matches = energyKeywords.filter(k => itemText.includes(k)).length;
    score += matches * 0.06;
  }

  // Verfügbarkeit wichtiger am Morgen/Nachmittag (Buchungs-Intent)
  if (['morning', 'afternoon'].includes(tz.key) && item.is_available) {
    score += 0.05;
  }

  // Wochentag-Boost
  const dayEnergy = getCurrentDayEnergy();
  if (dayEnergy.type === 'collaborative' && item.focus_type === 'experiences') {
    score += 0.04;
  }
  if (dayEnergy.type === 'exploratory') {
    score += 0.02;  // Wochenende → alles etwas gleicher
  }

  return clamp(score);
}

// ── 5E.2.2 — CREATIVE MOMENTUM ─────────────────────────────────
/**
 * Wie viel kreative Energie hat ein Creator gerade?
 *
 * Basiert auf: Aktivität, Recency, Verfügbarkeit.
 * NICHT auf: persönliches Verhalten des Users.
 */
export function creativeMomentum(creator) {
  if (!creator) return 0.5;

  let momentum = 0;

  // Kürzlich aktiv?
  const daysSinceUpdate = creator.updated_at
    ? (Date.now() - new Date(creator.updated_at).getTime()) / 86400000 : 30;

  if (daysSinceUpdate < 3)  momentum += 0.35;
  else if (daysSinceUpdate < 7)  momentum += 0.25;
  else if (daysSinceUpdate < 14) momentum += 0.15;
  else if (daysSinceUpdate < 30) momentum += 0.08;
  else                           momentum += 0.02;

  // Verfügbar (buchbar jetzt)
  if (creator.is_available) momentum += 0.25;

  // Hat kürzlich Werke veröffentlicht (via works_count proxy)
  if (creator.recent_works_count > 0) {
    momentum += clamp(creator.recent_works_count / 5) * 0.20;
  }

  // Aktive Bookings (kreativ beschäftigt)
  if (creator.active_bookings > 0) momentum += 0.10;

  // Response-Bereitschaft
  if ((creator.response_rate || 0) > 80) momentum += 0.10;

  return clamp(momentum);
}

// ── 5E.2.3 — EXPLORATION READINESS ─────────────────────────────
/**
 * Wie offen ist der User gerade für Neues?
 *
 * Liest ausschließlich aus sessionStorage — nie localStorage.
 * Kein persistentes Tracking.
 *
 * @returns {number} 0–1 (1 = maximal explorations-bereit)
 */
export function explorationReadiness() {
  try {
    const ctx = JSON.parse(sessionStorage.getItem('hui_ctx') || '{}');

    // Return-Visitor: kennt die Plattform → offener für Unbekanntes
    const isReturn = ctx.visits > 1;

    // Session-Dauer: lange Session → tiefer eingetaucht
    const sessionAge = ctx.sessionStart
      ? (Date.now() - ctx.sessionStart) / 60000  // Minuten
      : 0;

    // Mood aktiv → fokussierter Modus (weniger exploration)
    const hasMood = !!ctx.activeMood;

    let score = 0.5;  // Neutral-Basis
    if (isReturn)      score += 0.15;
    if (sessionAge > 5) score += 0.10;   // 5min+ → eingetaucht
    if (hasMood)       score -= 0.20;    // Mood gewählt → weniger random

    // Tageszeit-Faktor
    const tz = getCurrentTimeZone();
    if (tz.key === 'late_night')   score += 0.10;  // Nacht → experimentell
    if (tz.key === 'early_morning') score += 0.05; // Morgen → offen
    if (tz.key === 'morning')      score -= 0.10;  // Fokus-Zeit → weniger exploration

    return clamp(score);
  } catch (_) {
    return 0.5;  // sessionStorage nicht verfügbar → neutral
  }
}

// ── 5E.2.4 — COLLABORATION READINESS ───────────────────────────
/**
 * Wie kollaborations-bereit ist der aktuelle Moment?
 *
 * Kombiniert: Tageszeit + Wochentag + Session-Kontext.
 * Kein User-Profiling.
 */
export function collaborationReadiness() {
  const tz  = getCurrentTimeZone();
  const day = getCurrentDayEnergy();

  let score = 0;

  // Optimale Kollaborations-Zeiten
  if (tz.energy === 'focused' || tz.energy === 'creative')  score += 0.4;
  if (tz.energy === 'social')                               score += 0.5;
  if (tz.energy === 'reflective')                           score += 0.3;
  if (tz.energy === 'deep' || tz.energy === 'quiet')        score += 0.1;

  // Wochentag
  if (day.type === 'collaborative') score += 0.2;
  if (day.type === 'focused')       score += 0.15;
  if (day.type === 'rest')          score -= 0.1;

  return clamp(score);
}

// ── 5E.2.5 — CALMNESS SCORE ────────────────────────────────────
/**
 * Wie ruhig soll die aktuelle Discovery-Experience sein?
 *
 * Hoher Calmness-Score → weniger Items, ruhigere Reihenfolge,
 * mehr Atemraum zwischen Inhalten.
 *
 * WICHTIG: Nie über 60% — Discovery soll nicht einschlafen.
 */
export function calmnessScore() {
  const tz  = getCurrentTimeZone();
  const day = getCurrentDayEnergy();

  let calmness = 0.3;  // Basis: leicht ruhig (HUI ist eh ruhig)

  // Abend/Nacht: ruhiger
  if (tz.key === 'evening')    calmness += 0.20;
  if (tz.key === 'late_night') calmness += 0.25;

  // Wochenende: entspannter
  if (day.type === 'rest')        calmness += 0.10;
  if (day.type === 'exploratory') calmness += 0.05;

  // Session-Check (vermeidet Over-Stimulation nach langer Session)
  try {
    const ctx = JSON.parse(sessionStorage.getItem('hui_ctx') || '{}');
    const sessionAge = ctx.sessionStart
      ? (Date.now() - ctx.sessionStart) / 60000 : 0;
    if (sessionAge > 20) calmness += 0.10;  // 20min+ → ruhiger werden
  } catch (_) {}

  return clamp(calmness, 0, 0.60);  // Max 60% — nie komplett still
}

// ── 5E.2.6 — FOCUS MODE AFFINITY ───────────────────────────────
/**
 * Wie gut passt ein Item in einen fokussierten Modus?
 *
 * Fokus-Items: tiefe Werke, komplexe Erlebnisse, lange Texte.
 * Anti-Fokus-Items: kurze Stories, viele verschiedene Typen.
 */
export function focusModeAffinity(item) {
  if (!item) return 0.5;

  let score = 0.5;

  // Tiefe Beschreibung → Fokus-würdig
  const descLength = (item.description || item.bio || item.caption || '').length;
  if (descLength > 200) score += 0.15;
  if (descLength > 100) score += 0.10;

  // Spezifische Tags → Nischen-Tiefe → Fokus
  const tagCount = (item.dna_tags || []).length;
  if (tagCount >= 3) score += 0.10;

  // Works > Experiences > Stories (für Fokus)
  if (item.type === 'werk' || item._type === 'werk')       score += 0.10;
  if (item.type === 'experience')                           score += 0.05;
  if (item.type === 'story' || item._type === 'story')     score -= 0.05;

  // Preis-Signal (Qualitäts-Indiz bei Works)
  if (item.price && item.price > 0) score += 0.05;

  return clamp(score);
}

// ── 5E.2.7 — INSPIRATION MATCH ─────────────────────────────────
/**
 * Passt ein Item gerade zur Inspirations-Suche?
 *
 * Inspirations-Items: unbekannte Creators, überraschende Moods,
 * kreative Grenzgänger, Bridge-Creators.
 */
export function inspirationMatch(item, context = {}) {
  const { knownCreatorIds = new Set(), userClusters = {} } = context;

  let score = 0.5;

  // Unbekannter Creator → Überraschungspotenzial
  const creatorId = item.user_id || item.creator_id || item.id;
  if (creatorId && !knownCreatorIds.has(creatorId)) score += 0.15;

  // Bridge-Creator → verbindet Welten
  if (item._bridgeScore > 0.4)  score += 0.15;
  if (item._bridgeScore > 0.6)  score += 0.10;

  // Anderer Cluster als User → Horizonterweiterung
  const itemMood = (item.mood || '').toLowerCase();
  if (itemMood && !userClusters[itemMood]) {
    score += 0.10;  // Neuer Mood-Cluster für diesen User
  }

  // Frisch auf der Plattform → neue Energie
  const daysSinceJoin = item.creator_joined_at || item.created_at
    ? (Date.now() - new Date(item.creator_joined_at || item.created_at).getTime()) / 86400000
    : 999;
  if (daysSinceJoin < 14) score += 0.10;

  return clamp(score);
}

// ── 5E.2.8 — CONTEXTUAL RELEVANCE (Master-Funktion) ────────────
/**
 * Haupt-Kontext-Score für ein Item.
 * Kombiniert alle Kontext-Signale BEGRENZT auf max. 10% Einfluss.
 *
 * WICHTIG: Kontext-Intelligenz ist ein SUBTILER Modifikator.
 * Basis-Ranking (Discovery Engine 5C) bleibt dominant.
 *
 * @param {Object} item       — Work, Creator, Experience
 * @param {Object} context    — { mode, userClusters, knownCreatorIds, activeMood }
 * @returns {number}          — Modifier -0.05 bis +0.10
 */
export function contextualRelevance(item, context = {}) {
  const { mode = 'explore', userClusters = {}, knownCreatorIds = new Set(), activeMood } = context;

  const tz      = getCurrentTimeZone();
  const timing  = timingAffinity(item, tz);
  const calmness = calmnessScore();

  let modifier = 0;

  switch (mode) {
    case 'focus':
      // Fokus-Modus: tiefe Inhalte
      modifier = focusModeAffinity(item) * 0.08 - 0.04;
      break;

    case 'explore':
      // Explorations-Modus: Überraschung + Timing
      modifier = (inspirationMatch(item, { knownCreatorIds, userClusters }) * 0.06) +
                 (timing - 0.5) * 0.04;
      break;

    case 'collaborate':
      // Kollaborations-Modus: verfügbare Creator mit Momentum
      modifier = collaborationReadiness() * 0.05 +
                 (item.is_available ? 0.04 : 0);
      break;

    case 'calm':
      // Ruhiger Modus: tiefe Qualität, keine Hektik
      modifier = (calmness * 0.06) + (focusModeAffinity(item) * 0.04) - 0.05;
      break;

    default:
      // Standard: leichte Timing-Gewichtung
      modifier = (timing - 0.5) * 0.06;
  }

  // Clampen: Kontext kann Ranking max ±10% verschieben
  return clamp(modifier, -0.05, 0.10);
}

// ── 5E.3 — CALM DISCOVERY MODE ─────────────────────────────────
/**
 * Modifiziert eine Feed-Liste für den ruhigen Discovery-Modus.
 *
 * Ruhiger Modus bedeutet:
 * - Weniger Items (Qualität über Quantität)
 * - Kein endloser Scroll-Druck
 * - Atemräume (Pausen-Indikatoren)
 * - Tiefe statt Breite
 *
 * @param {Array}  items     — bereits gerankte Items
 * @param {Object} opts
 * @returns {Object}         — { items, breathingPoints, isCalmMode }
 */
export function calmDiscoveryMode(items, opts = {}) {
  const {
    maxItems   = 12,    // Ruhiger Feed: maximal 12 Items (statt 24)
    breatheAt  = [4, 8], // Nach Item 4 und 8: Atemraum-Marker
  } = opts;

  const calmness = calmnessScore();
  const isCalmMode = calmness > 0.45;

  if (!isCalmMode) {
    return { items, breathingPoints: [], isCalmMode: false };
  }

  // Für ruhigen Modus: weniger Items, mehr Tiefe
  const calmItems = items
    .filter(item => {
      // Filtere sehr kurze/oberflächliche Inhalte
      const desc = (item.description || item.bio || item.caption || '');
      return desc.length > 20 || item._bridgeScore > 0 || item.is_verified;
    })
    .slice(0, maxItems);

  // Atemraum-Positionen
  const breathingPoints = breatheAt.filter(pos => pos < calmItems.length);

  return { items: calmItems, breathingPoints, isCalmMode: true };
}

// ── 5E.4 — CREATIVE FLOW DETECTION ─────────────────────────────
/**
 * Erkennt den aktuellen kreativen Flow-Zustand.
 * Basiert NUR auf session-lokalem Kontext.
 *
 * @param {Object} sessionSignals — { hasActiveMood, isSearching,
 *   isChatOpen, sessionDurationMin, scrollDepth }
 * @returns {{ mode: string, confidence: number, label: string }}
 */
export function detectCreativeFlow(sessionSignals = {}) {
  const {
    hasActiveMood      = false,
    isSearching        = false,
    isChatOpen         = false,
    sessionDurationMin = 0,
    scrollDepth        = 0,
    isBookingOpen      = false,
  } = sessionSignals;

  // Explizite Signale (höchste Konfidenz)
  if (isSearching)    return { mode: 'focus',       confidence: 0.9, label: 'Suchend & Fokussiert' };
  if (isChatOpen)     return { mode: 'collaborate', confidence: 0.85,label: 'Kollaborativ' };
  if (isBookingOpen)  return { mode: 'collaborate', confidence: 0.80,label: 'Buchungs-Intent' };

  // Implizite Signale (niedrigere Konfidenz)
  if (hasActiveMood && sessionDurationMin > 5) {
    return { mode: 'focus', confidence: 0.6, label: 'Stimmungs-fokussiert' };
  }

  const tz = getCurrentTimeZone();
  if (tz.energy === 'deep' || tz.energy === 'quiet') {
    return { mode: 'calm', confidence: 0.5, label: 'Ruhige Entdeckung' };
  }

  if (scrollDepth > 0.7 && sessionDurationMin > 8) {
    return { mode: 'explore', confidence: 0.55, label: 'Tief Entdeckend' };
  }

  // Standard
  return { mode: 'explore', confidence: 0.4, label: 'Entdeckend' };
}

// ── 5E.5 — SESSION CONTEXT MANAGER ─────────────────────────────
/**
 * Liest und schreibt Session-Kontext in sessionStorage.
 * Kein localStorage. Kein Server. Kein Tracking.
 *
 * Daten die gespeichert werden:
 * - sessionStart (Timestamp)
 * - visits (Zähler dieser Session)
 * - activeMood (temporär)
 * - lastFlow (letzter Flow-Modus)
 *
 * Daten die NICHT gespeichert werden:
 * - Klick-Sequenzen
 * - Verweildauer pro Item
 * - Profile-Besuche
 */
export const SessionContext = {
  read() {
    try {
      return JSON.parse(sessionStorage.getItem('hui_ctx') || '{}');
    } catch (_) { return {}; }
  },

  write(data) {
    try {
      const existing = this.read();
      sessionStorage.setItem('hui_ctx', JSON.stringify({ ...existing, ...data }));
    } catch (_) {}
  },

  init() {
    const existing = this.read();
    if (!existing.sessionStart) {
      this.write({
        sessionStart: Date.now(),
        visits: (existing.visits || 0) + 1,
      });
    }
  },

  setMood(mood) {
    this.write({ activeMood: mood, moodSetAt: Date.now() });
  },

  getMood() {
    const ctx = this.read();
    // Mood verfällt nach 2 Stunden Inaktivität
    if (ctx.moodSetAt && (Date.now() - ctx.moodSetAt) > 7200000) {
      this.write({ activeMood: null, moodSetAt: null });
      return null;
    }
    return ctx.activeMood || null;
  },

  clear() {
    try { sessionStorage.removeItem('hui_ctx'); } catch (_) {}
  },
};

// ── 5E.6 — CONTEXTUAL CREATOR MATCHING EXTENSION ───────────────
/**
 * Erweitert creatorAffinity() aus Discovery (5C) um Kontext.
 * Fügt Timing + Flow-Modus zur Affinitäts-Berechnung hinzu.
 *
 * Kontext-Boost: max +10% auf existierenden Affinitäts-Score.
 */
export function contextualCreatorAffinity(baseAffinity, creator, context = {}) {
  const { mode = 'explore', timeZone = null } = context;

  const tz       = timeZone || getCurrentTimeZone();
  const timing   = timingAffinity(creator, tz);
  const momentum = creativeMomentum(creator);
  const collab   = collaborationReadiness();

  let contextBonus = 0;

  switch (mode) {
    case 'collaborate':
      // Verfügbare, aktive, responsive Creator bevorzugen
      contextBonus = (creator.is_available ? 0.05 : 0) +
                     (momentum > 0.6 ? 0.03 : 0) +
                     (collab * 0.02);
      break;

    case 'focus':
      // Verified, tiefe Nischen
      contextBonus = (creator.is_verified ? 0.04 : 0) +
                     ((creator.dna_tags?.length || 0) > 3 ? 0.03 : 0);
      break;

    case 'calm':
      // Ruhige, tiefe Creator (niedrige Frequenz, hohe Qualität)
      const isCalmCreator = (creator.mood || '').toLowerCase().includes('ruhig') ||
                            (creator.dna_tags || []).some(t =>
                              ['ruhig','still','kontemplativ','meditativ'].includes(t.toLowerCase())
                            );
      contextBonus = isCalmCreator ? 0.06 : 0;
      break;

    default:
      contextBonus = (timing - 0.5) * 0.04;
  }

  // Kontext-Bonus ist additiv, aber begrenzt
  const enhanced = clamp(baseAffinity + clamp(contextBonus, 0, 0.10));
  return { score: enhanced, contextBonus, mode, timing };
}

// ── 5E.8 — OVERSTIMULATION GUARD ───────────────────────────────
/**
 * Erkennt Anzeichen von Over-Stimulation und
 * reduziert Feed-Intensität entsprechend.
 *
 * WICHTIG: Kein Paternalismus. Nur sanfte Drosselung.
 * User kann immer mehr laden wenn er will.
 */
export function overstimulationGuard(sessionSignals = {}) {
  const { sessionDurationMin = 0, feedItemsConsumed = 0 } = sessionSignals;

  const risks = [];
  let throttle = 1.0;  // 1.0 = normal, 0.5 = halb so viele Items

  // Lange Session → sanfte Drosselung
  if (sessionDurationMin > 30) {
    risks.push('long_session');
    throttle = Math.max(0.6, throttle - 0.2);
  }

  // Sehr viele Items konsumiert → Atemraum
  if (feedItemsConsumed > 40) {
    risks.push('high_consumption');
    throttle = Math.max(0.5, throttle - 0.3);
  }

  // Abend + lange Session → besonders sanft
  const tz = getCurrentTimeZone();
  if (['evening', 'late_night'].includes(tz.key) && sessionDurationMin > 20) {
    risks.push('late_heavy_session');
    throttle = Math.max(0.5, throttle - 0.15);
  }

  return {
    shouldThrottle: risks.length > 0,
    throttle,        // Multiplikator für Feed-Länge
    risks,
    suggestion: risks.includes('long_session')
      ? 'Du bist schon eine Weile dabei — vielleicht eine Pause?'
      : null,
  };
}

// ── Convenience-Export: vollständiger Context-Read ─────────────
/**
 * Liest den vollständigen aktuellen Kontext.
 * Client-side only. Kein Server.
 *
 * @param {Object} sessionSignals — optional manuelle Signale
 * @returns {Object}              — vollständiger Context-Snapshot
 */
export function readCurrentContext(sessionSignals = {}) {
  const timeZone     = getCurrentTimeZone();
  const dayEnergy    = getCurrentDayEnergy();
  const flow         = detectCreativeFlow(sessionSignals);
  const calmness     = calmnessScore();
  const exploration  = explorationReadiness();
  const collab       = collaborationReadiness();
  const overstim     = overstimulationGuard(sessionSignals);

  return {
    timeZone,
    dayEnergy,
    flow,
    calmness,
    explorationReadiness: exploration,
    collaborationReadiness: collab,
    overstimulation: overstim,
    timestamp: new Date().toISOString(),
  };
}
