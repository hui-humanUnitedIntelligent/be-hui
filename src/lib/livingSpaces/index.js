// src/lib/livingSpaces/index.js
// HUI — Living Spaces Engine — Phase 7C
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Ein Raum ist eine Atmosphäre, eine Geschichte, eine Präsenz.
// Nicht: ein Container für Nachrichten.
//
// RÄUME LEBEN DURCH:
//   deriveSpaceMood()       → Atmosphärische Qualität des Raums
//   spaceEnergy()           → Qualitative Energie (nicht Aktivität)
//   resonanceDensity()      → Tiefe vs. Breite der Resonanz
//   creativeTemperature()   → Emotionale Wärme
//   spaceContinuity()       → Geschichte und Erinnerung
//   roomRhythm()            → Puls des Raums
//   seasonalSpaceShift()    → Jahreszeitlicher Einfluss
//
// RÄUME ERINNERN SICH DURCH:
//   buildRoomMemory()       → Qualitative Gedächtnisschicht
//   getReturnContext()      → Atmosphärische Zusammenfassung bei Rückkehr
//
// RÄUME ATMEN DURCH:
//   silenceTolerance()      → Stille als akzeptierte Phase
//   QUIET_SPACE_RULES       → Räume werden nicht für Stille bestraft
// ═══════════════════════════════════════════════════════════════

import { SPACE_ATMOSPHERES }          from '@/lib/projectSpaces/index';
import { CREATIVE_STATES, detectCreativeMotifs, sharedCreativeState }
                                       from '@/lib/cocreation/index';
import { getSeason, getCommunityAtmosphere } from '@/lib/culture/index';
import { getCurrentAtmosphere, MOOD_ATMOSPHERES } from '@/lib/atmosphere/index';
import { suggestReflectionQuestions }  from '@/lib/assist/context';

// ── Helfer ─────────────────────────────────────────────────────
const clamp = (v, min = 0, max = 1) => Math.min(Math.max(v, min), max);

function daysSince(dateStr) {
  if (!dateStr) return 999;
  return (Date.now() - new Date(dateStr).getTime()) / 86400000;
}

// ── 7C.2 — deriveSpaceMood() ───────────────────────────────────
/**
 * Leitet die aktuelle atmosphärische Stimmung eines Raums ab.
 * Kombiniert: Raum-Atmosphäre + Tageszeit + Jahreszeit + Aktivitätsmuster.
 *
 * Keine User-Eingabe benötigt — entsteht organisch.
 */
export function deriveSpaceMood(space = {}, recentActivity = []) {
  const baseAtmosphere = space.atmosphere || space.mood || 'ruhig';
  const spaceAtm       = SPACE_ATMOSPHERES[baseAtmosphere] || SPACE_ATMOSPHERES.ruhig;

  // Tageszeit-Einfluss
  const timeAtm  = getCurrentAtmosphere();
  const season   = getSeason();

  // Nachtaktivität erkennen (fühlt sich "nächtlich" an wenn > 40% nachts)
  const nightRatio = recentActivity.filter(a => {
    const h = new Date(a.created_at || Date.now()).getHours();
    return h >= 22 || h < 5;
  }).length / Math.max(recentActivity.length, 1);

  // Aktivitätsdichte
  const recentCount = recentActivity.filter(a =>
    daysSince(a.created_at) < 3
  ).length;

  // Mood-Ableitung: Basis + Modifikatoren
  let derivedMood = baseAtmosphere;

  if (nightRatio > 0.45 && derivedMood !== 'naechtlich') {
    derivedMood = 'naechtlich';
  } else if (recentCount === 0 && daysSince(space.updated_at) > 7) {
    derivedMood = 'still';
  } else if (recentCount > 6) {
    // Intensiv aktiv → warm oder lebendig
    derivedMood = spaceAtm.color === '#F5F0E8' ? 'erdverbunden' : 'lebendig';
  }

  const finalAtm = SPACE_ATMOSPHERES[derivedMood] || spaceAtm;

  // Saisonaler Farbshift (sehr subtil — nur Nuance)
  const seasonalShift = _getSeasonalColorNuance(season.key, finalAtm);

  return {
    key:         derivedMood,
    atmosphere:  finalAtm,
    timeQuality: timeAtm.feeling,
    season:      season.key,
    seasonal:    seasonalShift,
    nightRatio,
    // Für CSS
    colors: {
      bg:       seasonalShift.bg     || finalAtm.color,
      accent:   seasonalShift.accent || finalAtm.accent,
      glow:     `${finalAtm.accent}18`,
    },
    // Kurzbeschreibung
    description: _buildMoodDescription(derivedMood, timeAtm, season),
  };
}

function _getSeasonalColorNuance(seasonKey, baseAtm) {
  // Subtile Farbverschiebungen durch Jahreszeit — kein Override
  const SHIFTS = {
    fruehling: { saturation: 1.05, description: 'Frühlingsfrisch' },
    sommer:    { warmth: 1.04,     description: 'Sommerlich warm' },
    herbst:    { depth: 1.03,      description: 'Herbstlich tief'  },
    winter:    { cool: 1.02,       description: 'Winterlich klar'  },
  };
  return { ...SHIFTS[seasonKey], base: baseAtm.color };
}

function _buildMoodDescription(mood, timeAtm, season) {
  const moodTexts = {
    still:       'Ruhig und tief',
    warm:        'Warm und einladend',
    tief:        'Tiefgehend',
    lebendig:    'Lebendig',
    naechtlich:  'Nächtlich und konzentriert',
    erdverbunden:'Geerdet',
    ruhig:       'Ruhig offen',
  };
  const base = moodTexts[mood] || 'Atmosphärisch';
  return `${base} · ${season.name}`;
}

// ── 7C.2 — spaceEnergy() ───────────────────────────────────────
/**
 * Qualitative Energie des Raums — nicht Aktivitätsmenge.
 * Tiefe Resonanz-Einträge = hohe Energie. Flüchtige = niedrige.
 */
export function spaceEnergy(space = {}, recentActivity = []) {
  const log        = space.resonance_log   || [];
  const notes      = space.shared_notes    || '';
  const refs       = space.reference_board || [];
  const moments    = space.progress_moments|| [];

  // Qualitative Signale
  const deepEntries    = log.filter(e =>
    e.type === 'moment' || e.type === 'decision' || e.type === 'question'
  ).length;

  const recentDeep = recentActivity.filter(a =>
    (a.type === 'moment' || a.type === 'note' || a.type === 'question') &&
    daysSince(a.created_at) < 7
  ).length;

  const notesDepth = Math.min(notes.length / 300, 1);
  const refDepth   = Math.min(refs.length / 8, 1);

  const energy = clamp(
    deepEntries * 0.15 + recentDeep * 0.20 + notesDepth * 0.35 + refDepth * 0.30
  );

  // Energie-Qualitäten — nie als Zahl
  const ENERGY_LEVELS = {
    still:    { label: 'Still',      description: 'Leise, wartend.',               icon: '🌙', threshold: 0.10 },
    wachsend: { label: 'Wachsend',   description: 'Substanz bildet sich.',          icon: '🌱', threshold: 0.25 },
    lebendig: { label: 'Lebendig',   description: 'Frische kreative Energie.',      icon: '⚡', threshold: 0.50 },
    reich:    { label: 'Reich',      description: 'Dichte und Tiefe vorhanden.',    icon: '🌿', threshold: 0.75 },
    intensiv: { label: 'Intensiv',   description: 'Besonders aktive kreative Phase.',icon: '🔥', threshold: 1.01 },
  };

  const level = Object.values(ENERGY_LEVELS)
    .filter(l => energy < l.threshold)
    .sort((a, b) => a.threshold - b.threshold)[0]
    || ENERGY_LEVELS.intensiv;

  return { energy: Math.round(energy * 100) / 100, ...level };
}

// ── 7C.2 — resonanceDensity() ──────────────────────────────────
/**
 * Tiefe vs. Breite der Resonanz im Raum.
 * Viele kurze Momente vs. wenige tiefe.
 * Keine Präferenz — nur Beschreibung.
 */
export function resonanceDensity(space = {}) {
  const log = space.resonance_log || [];
  if (!log.length) return { density: 0, quality: 'leer', description: 'Noch keine Resonanz.' };

  const total      = log.length;
  const deepCount  = log.filter(e =>
    (e.content || e.note || '').length > 60
  ).length;
  const depthRatio = deepCount / total;

  // Dichte: Einträge pro Tag
  const ageInDays  = daysSince(space.started_at) || 1;
  const entriesPerDay = total / ageInDays;

  const quality =
    depthRatio > 0.6 && entriesPerDay < 2  ? 'tief-langsam'  :
    depthRatio > 0.6 && entriesPerDay >= 2  ? 'tief-aktiv'    :
    depthRatio < 0.3 && entriesPerDay > 3   ? 'breit-intensiv':
    depthRatio < 0.3                        ? 'breit-leicht'  :
                                              'ausgewogen'    ;

  const QUALITY_DESCRIPTIONS = {
    'tief-langsam':   'Wenige aber bedeutsame Momente — ruhige Tiefe.',
    'tief-aktiv':     'Häufig und tief — eine intensive kreative Beziehung.',
    'breit-intensiv': 'Viel und schnell — lebhafter Austausch.',
    'breit-leicht':   'Breiter, leichter Austausch.',
    'ausgewogen':     'Eine gute Mischung aus Tiefe und Häufigkeit.',
  };

  return {
    density:      Math.round(entriesPerDay * 10) / 10,
    depthRatio:   Math.round(depthRatio * 100) / 100,
    quality,
    description:  QUALITY_DESCRIPTIONS[quality],
    total,
  };
}

// ── 7C.2 — creativeTemperature() ───────────────────────────────
/**
 * Emotionale Wärme des Raums — wie warm fühlt er sich an?
 * Aus: Kollaborationsstil, Mood, Aktivitätsdichte, Jahreszeit.
 */
export function creativeTemperature(space = {}, participants = []) {
  const mood     = space.mood || space.atmosphere || '';
  const season   = getSeason();

  // Mood-basierte Basistemperatur
  const MOOD_TEMP = {
    warm:        0.80,
    lebendig:    0.70,
    erdverbunden:0.65,
    ruhig:       0.55,
    tief:        0.50,
    still:       0.40,
    naechtlich:  0.35,
  };
  const basetemp = MOOD_TEMP[mood] || 0.55;

  // Jahreszeit-Modifikator
  const SEASON_MOD = { fruehling: 0.05, sommer: 0.10, herbst: 0, winter: -0.05 };
  const seasonMod  = SEASON_MOD[season.key] || 0;

  // Teilnehmer-Anzahl (mehr = wärmer, bis Limit)
  const participantWarmth = Math.min(participants.length / 4, 1) * 0.10;

  const temperature = clamp(basetemp + seasonMod + participantWarmth);

  return {
    temperature:  Math.round(temperature * 100) / 100,
    warmth:
      temperature > 0.75 ? 'sehr warm'  :
      temperature > 0.55 ? 'warm'       :
      temperature > 0.40 ? 'neutral'    :
      temperature > 0.25 ? 'kühl'       : 'still-kalt',
    description:
      temperature > 0.75 ? 'Lebendige Wärme — die Verbindung ist spürbar.' :
      temperature > 0.55 ? 'Angenehme Wärme — ein guter Ort.' :
      temperature > 0.40 ? 'Ruhig neutral — bereit für Tiefe.' :
                           'Kühl und still — wartet auf Impulse.',
    season: season.name,
  };
}

// ── 7C.2 — spaceContinuity() ───────────────────────────────────
/**
 * Die Geschichte des Raums — wie viel gemeinsame Vergangenheit existiert?
 * Basis für Return-Zusammenfassung und Gedächtnisschicht.
 */
export function spaceContinuity(space = {}, recentActivity = []) {
  const log       = space.resonance_log    || [];
  const notes     = space.shared_notes    || '';
  const moments   = space.progress_moments|| [];
  const ageInDays = daysSince(space.started_at);

  // Qualitative Tiefe der Geschichte
  const historyDepth = clamp(
    Math.min(log.length / 15, 1) * 0.35 +
    Math.min(notes.length / 400, 1) * 0.30 +
    Math.min(moments.length / 5, 1) * 0.20 +
    Math.min(ageInDays / 60, 1) * 0.15
  );

  const motifs = detectCreativeMotifs(log, notes);

  return {
    depth:    Math.round(historyDepth * 100) / 100,
    ageInDays:Math.round(ageInDays),
    motifs:   motifs.slice(0, 3),
    hasMeaningfulHistory: historyDepth > 0.2,
    level:
      historyDepth > 0.7 ? 'reich'      :
      historyDepth > 0.4 ? 'gewachsen'  :
      historyDepth > 0.2 ? 'entstehend' : 'jung',
    description:
      historyDepth > 0.7 ? `Eine reiche gemeinsame Geschichte — ${Math.round(ageInDays)} Tage gewachsen.` :
      historyDepth > 0.4 ? 'Substanz hat sich aufgebaut.' :
      historyDepth > 0.2 ? 'Erste Schichten gemeinsamer Geschichte.' :
                           'Am Anfang — alles wartet.',
  };
}

// ── 7C.2 — roomRhythm() ────────────────────────────────────────
/**
 * Der Puls des Raums — wie atmet er?
 * Erkennt Muster: nächtlich, wöchentlich, intensiv, langsam, still.
 */
export function roomRhythm(recentActivity = []) {
  if (recentActivity.length < 2) {
    return { rhythm: 'stille', label: 'Still', description: 'Wartet auf seinen Moment.', cssClass: 'hui-rhythm-still' };
  }

  const now = Date.now();
  const timestamps = recentActivity
    .filter(a => a.created_at)
    .map(a => new Date(a.created_at).getTime())
    .filter(t => t > now - 30 * 86400000)
    .sort((a, b) => b - a);

  if (timestamps.length < 2) return { rhythm: 'stille', label: 'Still', description: 'Leise.', cssClass: 'hui-rhythm-still' };

  const gaps      = timestamps.slice(1).map((t, i) => timestamps[i] - t);
  const avgGapH   = (gaps.reduce((a, b) => a + b, 0) / gaps.length) / 3600000;

  // Nachtaktivität
  const nightCount = recentActivity.filter(a => {
    const h = new Date(a.created_at || now).getHours();
    return h >= 22 || h < 5;
  }).length;
  const nightRatio = nightCount / Math.max(recentActivity.length, 1);

  // Wellenartig: hohe Varianz in den Gaps
  const variance = gaps.length > 1
    ? gaps.reduce((a, g) => a + Math.pow(g - avgGapH * 3600000, 2), 0) / gaps.length
    : 0;
  const isWavy = Math.sqrt(variance) / (avgGapH * 3600000) > 0.8;

  const RHYTHMS = {
    nocturnal: { label: 'Nächtlich',   description: 'Dieser Raum lebt in den stillen Stunden.',  cssClass: 'hui-rhythm-nocturnal', condition: nightRatio > 0.4  },
    intense:   { label: 'Intensiv',    description: 'Dicht und energiegeladen.',                  cssClass: 'hui-rhythm-intense',   condition: avgGapH < 4       },
    wavy:      { label: 'Wellenartig', description: 'Kommt und geht — in Wellen.',                cssClass: 'hui-rhythm-wavy',      condition: isWavy && avgGapH > 4 },
    daily:     { label: 'Täglich',     description: 'Gleichmäßiger täglicher Atem.',              cssClass: 'hui-rhythm-daily',     condition: avgGapH >= 4 && avgGapH < 30 },
    weekly:    { label: 'Wöchentlich', description: 'Bewusste Abstände — tief und langsam.',      cssClass: 'hui-rhythm-weekly',    condition: avgGapH >= 30 && avgGapH < 170 },
    slow:      { label: 'Langsam tief',description: 'Viel Raum zwischen den Momenten.',           cssClass: 'hui-rhythm-slow',      condition: avgGapH >= 170 },
  };

  const matched = Object.entries(RHYTHMS)
    .filter(([, r]) => r.condition)
    .map(([key, r]) => ({ key, ...r }))[0];

  return matched || { rhythm: 'stille', label: 'Still', description: 'Das Projekt atmet aus.', cssClass: 'hui-rhythm-still' };
}

// ── 7C.2 — seasonalSpaceShift() ────────────────────────────────
/**
 * Jahreszeitlicher Einfluss auf den Raum.
 * Sehr subtil — Nuance, kein Override.
 */
export function seasonalSpaceShift(space = {}) {
  const season = getSeason();
  const mood   = space.atmosphere || space.mood || 'ruhig';

  // Jahreszeit-basierte Qualitäten die den Raum färben
  const SEASONAL_QUALITIES = {
    fruehling: {
      quality:     'aufbrechend',
      description: 'Frühling trägt Energie des Aufbruchs.',
      nudge:       'Was könnte in diesem Raum neu entstehen?',
      cssFilter:   'saturate(1.05)',
    },
    sommer:    {
      quality:     'weit-offen',
      description: 'Sommer bringt Offenheit und Weite.',
      nudge:       'Was könnte dieser Raum nach außen tragen?',
      cssFilter:   'brightness(1.02)',
    },
    herbst:    {
      quality:     'reifend',
      description: 'Herbst vertieft was bereits begonnen hat.',
      nudge:       'Was ist bereit für seinen Abschluss?',
      cssFilter:   'sepia(0.04)',
    },
    winter:    {
      quality:     'konzentriert',
      description: 'Winter verdichtet auf das Wesentliche.',
      nudge:       'Was ist das Eine wenn man alles andere weglässt?',
      cssFilter:   'saturate(0.97)',
    },
  };

  return {
    season:  season.key,
    name:    season.name,
    ...SEASONAL_QUALITIES[season.key],
    themeOfDay: season.themeOfMonth,
    colors:     season.colors,
  };
}

// ── 7C.3 — Room Memory ─────────────────────────────────────────

/**
 * buildRoomMemory()
 * Qualitative Gedächtnisschicht des Raums.
 * Nicht: Message-History. Sondern: kreative Erinnerung.
 */
export function buildRoomMemory(space = {}) {
  const log    = space.resonance_log    || [];
  const notes  = space.shared_notes    || '';
  const moments= space.progress_moments|| [];
  const refs   = space.reference_board  || [];

  // Bedeutsame Momente (qualitativ gefiltert)
  const meaningfulMoments = log
    .filter(e => e.type === 'moment' || e.type === 'decision' || e.type === 'question')
    .slice(0, 5)
    .map(e => ({
      type:    e.type,
      content: (e.content || e.note || '').slice(0, 80),
      age:     Math.round(daysSince(e.created_at)),
    }));

  // Wiederkehrende kreative Motive
  const motifs = detectCreativeMotifs(log, notes);

  // Offene Fäden (Fragen ohne Antwort)
  const openThreads = log
    .filter(e => (e.content || '').includes('?') && e.type !== 'decision')
    .slice(0, 3)
    .map(e => ({ question: (e.content || '').slice(0, 60), age: Math.round(daysSince(e.created_at)) }));

  // Einzigartige Referenzen (thematische Schwerpunkte)
  const refThemes = refs.slice(0, 4).map(r => r.title || r.url || 'Referenz');

  return {
    meaningfulMoments,
    motifs:      motifs.slice(0, 4),
    openThreads,
    refThemes,
    hasMemory:   meaningfulMoments.length > 0 || motifs.length > 0,
    summary:     _buildMemorySummary(meaningfulMoments, motifs, openThreads),
  };
}

function _buildMemorySummary(moments, motifs, openThreads) {
  if (!moments.length && !motifs.length) return null;

  const parts = [];
  if (motifs.length > 0)
    parts.push(`Wiederkehrendes Thema: „${motifs[0].word}"`);
  if (openThreads.length > 0)
    parts.push(`Offene Frage: „${openThreads[0].question.slice(0, 40)}…"`);
  if (moments.length > 0)
    parts.push(`${moments.length} bedeutsame Moment${moments.length > 1 ? 'e' : ''}`);

  return parts.join(' · ');
}

// ── 7C.6 — Return Context ──────────────────────────────────────

/**
 * getReturnContext()
 * Was jemand sieht wenn er nach längerer Abwesenheit zurückkehrt.
 * Kein "128 neue Nachrichten". Sondern: atmosphärische Zusammenfassung.
 *
 * @param {Object} space
 * @param {string} lastVisit  — ISO-Datetime des letzten Besuchs
 */
export function getReturnContext(space = {}, lastVisit = null) {
  if (!lastVisit) return null;

  const absentDays = daysSince(lastVisit);
  if (absentDays < 0.5) return null; // Weniger als 12h — kein Return-Context nötig

  const memory   = buildRoomMemory(space);
  const mood     = deriveSpaceMood(space, space.resonance_log || []);
  const state    = sharedCreativeState(space, space.resonance_log || []);

  // Ton der Rückkehr — sanft, nie überwältigend
  const returnTone =
    absentDays < 2   ? 'kurz weg'     :
    absentDays < 7   ? 'einige Tage'  :
    absentDays < 30  ? 'eine Weile'   : 'längere Zeit';

  // Zusammenfassung — atmosphärisch, nie zählerisch
  const summaryParts = [
    state.description,
    memory.summary,
    mood.description,
  ].filter(Boolean);

  // Reflexionsfrage — ein einziger sanfter Impuls
  const question = suggestReflectionQuestions({
    mood:   space.mood || space.atmosphere,
    season: getSeason().key,
  })[0] || null;

  return {
    absentDays:    Math.round(absentDays),
    returnTone,
    stateSummary:  state.label,
    stateEmoji:    state.emoji,
    description:   summaryParts[0] || 'Der Raum wartet.',
    memory:        memory.hasMemory ? memory.summary : null,
    question,
    // Nie: "X neue Nachrichten"
    // Nie: "Du warst X Tage weg"
    colors:        mood.colors,
  };
}

// ── 7C.7 — Silence Tolerance ───────────────────────────────────

export const QUIET_SPACE_RULES = {
  // Wie lange darf ein Raum still sein?
  silenceTolerance: {
    resonance_room:  7,   // Resonance Rooms: 7 Tage Still OK
    project:         21,  // Project Spaces: 3 Wochen Still OK
    local_circle:    60,  // Local Circles: 2 Monate Still OK
    mentorship:      14,  // Mentorship: 2 Wochen Still OK
  },
  // Was passiert nach der Toleranz?
  afterSilence: 'sanft als ruhend markiert — nie als inaktiv oder tot',
  // Was NIE passiert:
  never: [
    'Automatisches Löschen',
    'Aktivitäts-Reminder an Teilnehmer',
    '"Dieser Raum ist inaktiv"-Label',
    'Ranking-Strafe für stille Räume',
    'Automatische Archivierung ohne Zustimmung',
  ],
};

/**
 * silenceTolerance()
 * Prüft ob ein Raum noch in seiner natürlichen Stille ist.
 */
export function silenceTolerance(space = {}) {
  const spaceType  = space.type || 'project';
  const tolerance  = QUIET_SPACE_RULES.silenceTolerance[spaceType] || 21;
  const silentDays = daysSince(
    space.updated_at || space.created_at
  );
  const isWithinTolerance = silentDays <= tolerance;

  return {
    silentDays:      Math.round(silentDays),
    tolerance,
    isWithinTolerance,
    // Sanfte Beschreibung — nie alarmierend
    description:
      silentDays < 1       ? 'Gerade aktiv.' :
      isWithinTolerance    ? `Still seit ${Math.round(silentDays)} Tagen — das ist gut.` :
                             'Der Raum ruht tief. Bereit zu erwachen wenn der Moment stimmt.',
    // Empfehlung — nie Druck
    gentleSuggestion:
      !isWithinTolerance && space.type === 'resonance'
        ? 'Dieser Resonanzraum hat seine Zeit vielleicht erfüllt. Oder er wartet.'
        : null,
  };
}

// ── 7C.5 — Atmospheric CSS ─────────────────────────────────────
// CSS für lebendige Raum-Atmosphäre

export const LIVING_SPACE_CSS = `
  /* Sanfte Hintergrundfläche — atmet mit der Atmosphäre */
  @keyframes hui-space-breathe {
    0%, 100% { opacity: 0.85; }
    50%       { opacity: 1.0;  }
  }

  /* Nächtlicher Raum — leise pulsierend */
  @keyframes hui-space-nocturnal {
    0%, 100% { background-position: 0% 50%;   }
    50%       { background-position: 100% 50%; }
  }

  /* Wellenartig aktiver Raum */
  @keyframes hui-space-wavy {
    0%  { transform: scale(1);    opacity: 0.9; }
    33% { transform: scale(1.01); opacity: 1.0; }
    66% { transform: scale(0.99); opacity: 0.95;}
    100%{ transform: scale(1);    opacity: 0.9; }
  }

  /* Langsamer Übergang zwischen Atmosphären */
  .hui-space-bg {
    transition: background 3s ease, border-color 2s ease;
  }

  /* Raumtemperatur als subtiler Schimmer */
  .hui-space-warm {
    box-shadow: 0 0 60px rgba(232,168,124,0.08) inset;
  }
  .hui-space-cool {
    box-shadow: 0 0 60px rgba(107,188,196,0.06) inset;
  }
  .hui-space-still {
    box-shadow: none;
  }

  /* Rhythm-Klassen */
  .hui-rhythm-nocturnal .hui-space-accent {
    animation: hui-space-breathe 4s ease-in-out infinite;
  }
  .hui-rhythm-wavy .hui-space-accent {
    animation: hui-space-wavy 6s ease-in-out infinite;
  }
  .hui-rhythm-intense .hui-space-accent {
    animation: hui-space-breathe 2s ease-in-out infinite;
  }
  .hui-rhythm-still .hui-space-accent {
    opacity: 0.6;
  }

  /* Return-Context — sanft einblenden */
  .hui-return-context {
    animation: hui-presence-fade 800ms ease both;
    animation-delay: 400ms;
    opacity: 0;
  }
`;

// ── Master: getLivingSpaceProfile() ───────────────────────────

/**
 * Vollständiges lebendiges Raum-Profil.
 * Aggregiert alle Dimensionen zu einem kohärenten Bild.
 */
export function getLivingSpaceProfile(space = {}, recentActivity = [], participants = []) {
  const mood        = deriveSpaceMood(space, recentActivity);
  const energy      = spaceEnergy(space, recentActivity);
  const density     = resonanceDensity(space);
  const temperature = creativeTemperature(space, participants);
  const continuity  = spaceContinuity(space, recentActivity);
  const rhythm      = roomRhythm(recentActivity);
  const seasonal    = seasonalSpaceShift(space);
  const memory      = buildRoomMemory(space);
  const silence     = silenceTolerance(space);

  return {
    // Atmosphäre
    mood, energy, temperature,
    // Geschichte
    density, continuity, memory,
    // Rhythmus
    rhythm, seasonal,
    // Stille
    silence,
    // Für UI — direkt verwendbar
    cssClass: `hui-space-bg ${rhythm.cssClass} hui-space-${temperature.warmth.replace(' ', '-')}`,
    colors:   mood.colors,
    summary:  [mood.description, energy.description].filter(Boolean).join(' · '),
  };
}

// React Hook
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useLivingSpace(spaceId, lastVisit = null) {
  const [space,          setSpace]          = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [participants,   setParticipants]   = useState([]);
  const [loading,        setLoading]        = useState(false);

  const load = useCallback(async () => {
    if (!spaceId) return;
    setLoading(true);
    try {
      const [spaceRes, actRes] = await Promise.all([
        supabase.from('project_spaces').select('*').eq('id', spaceId).single(),
        supabase.from('project_activities').select('*')
          .eq('space_id', spaceId)
          .order('created_at', { ascending: false }).limit(50),
      ]);
      if (spaceRes.data) {
        setSpace(spaceRes.data);
        // Teilnehmer aus members-Array
        if (spaceRes.data.members?.length) {
          setParticipants(spaceRes.data.members.map(id => ({ id })));
        }
      }
      setRecentActivity(actRes.data || []);
    } catch (err) {
      console.error('[LivingSpace]', err?.message);
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => { load(); }, [load]);

  const profile = useMemo(() =>
    space ? getLivingSpaceProfile(space, recentActivity, participants) : null,
    [space, recentActivity, participants]
  );

  const returnContext = useMemo(() =>
    space && lastVisit ? getReturnContext(space, lastVisit) : null,
    [space, lastVisit]
  );

  return { space, profile, returnContext, loading, reload: load };
}
