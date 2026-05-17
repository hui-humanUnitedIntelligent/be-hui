// src/lib/cocreation/index.js
// HUI — Co-Creation Engine — Phase 7B
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Co-Kreation ist kein Produktivitätssystem.
// Es ist ein lebendiger gemeinsamer Prozess —
// mit Pausen, Spannungen, Übergängen und Tiefe.
//
// WAS DIESES SYSTEM MODELLIERT:
//   sharedCreativeState()    → gemeinsamer Zustand (nicht linear)
//   collaborationMomentum()  → Energie der Zusammenarbeit (nicht Velocity)
//   resonanceContinuity()    → Verbindung über Zeit
//   creativePacing()         → Rhythmus der Zusammenarbeit
//   collaborativeDepth()     → Tiefe statt Output
//   processAtmosphere()      → emotionale Temperatur
//
// WAS DIESES SYSTEM NICHT MODELLIERT:
//   ❌ Task-Completion-Rate
//   ❌ Velocity / Story-Points
//   ❌ Individual Productivity
//   ❌ Deadline Pressure
//   ❌ "Wer hat mehr beigetragen?"
// ═══════════════════════════════════════════════════════════════

import { SPACE_ATMOSPHERES } from '@/lib/projectSpaces/index';
import { getSeason }          from '@/lib/culture/index';
import { suggestReflectionQuestions } from '@/lib/assist/context';

// ── 7B.3 — Shared Creative States ──────────────────────────────

export const CREATIVE_STATES = {
  exploring: {
    key:         'exploring',
    label:       'Erkundend',
    description: 'Wir suchen noch. Alles ist offen. Kein Druck.',
    emoji:       '🌫️',
    pacing:      'slow',
    color:       '#E8EDF2',
    accent:      '#7B8FA6',
    // Pausen sind besonders wertvoll in dieser Phase
    pauseIsGood: true,
    // Welche Aktivitäten passen?
    invites:     ['Referenzen sammeln', 'Assoziationen teilen', 'Fragen stellen'],
  },
  deepening: {
    key:         'deepening',
    label:       'Vertiefend',
    description: 'Eine Richtung zeigt sich. Wir gehen gemeinsam tiefer.',
    emoji:       '🌊',
    pacing:      'measured',
    color:       '#EEF0F8',
    accent:      '#6B7FC4',
    pauseIsGood: true,
    invites:     ['Tiefer fragen', 'Zusammenhänge erkennen', 'Kernfragen benennen'],
  },
  experimenting: {
    key:         'experimenting',
    label:       'Experimentierend',
    description: 'Wir probieren aus. Scheitern ist Teil des Prozesses.',
    emoji:       '⚗️',
    pacing:      'playful',
    color:       '#FFF5F0',
    accent:      '#FF8A6B',
    pauseIsGood: false,
    invites:     ['Ausprobieren', 'Verwerfen erlaubt', 'Überraschungen willkommen'],
  },
  refining: {
    key:         'refining',
    label:       'Verfeinernd',
    description: 'Etwas Konkretes entsteht. Es wird klarer und schärfer.',
    emoji:       '✦',
    pacing:      'focused',
    color:       '#F5F5F7',
    accent:      '#6B7FC4',
    pauseIsGood: false,
    invites:     ['Details klären', 'Entscheidungen treffen', 'Form finden'],
  },
  resting: {
    key:         'resting',
    label:       'Ruhend',
    description: 'Bewusste Pause. Alle Beteiligten atmen durch. Das ist gut.',
    emoji:       '🌙',
    pacing:      'none',
    color:       '#F4F7F9',
    accent:      '#AABBCC',
    pauseIsGood: true,
    invites:     ['Nichts tun', 'Abstand gewinnen', 'Neu sehen wenn es Zeit ist'],
  },
  transitioning: {
    key:         'transitioning',
    label:       'Im Übergang',
    description: 'Das Projekt wechselt seinen Charakter. Ein bedeutsamer Moment.',
    emoji:       '🌅',
    pacing:      'gentle',
    color:       '#FDF6EE',
    accent:      '#C4783A',
    pauseIsGood: true,
    invites:     ['Reflektieren', 'Was war – was wird?', 'Neues zulassen'],
  },
  finishing: {
    key:         'finishing',
    label:       'Abschließend',
    description: 'Das Werk sucht seinen Abschluss. Mit Würde, nicht mit Hast.',
    emoji:       '🌿',
    pacing:      'careful',
    color:       '#F0F8FA',
    accent:      '#6BBCC4',
    pauseIsGood: false,
    invites:     ['Was fehlt noch?', 'Was ist genug?', 'Würdiger Abschluss'],
  },
  dormant: {
    key:         'dormant',
    label:       'Ruhend – könnte erwachen',
    description: 'Das Projekt schläft. Nicht beendet – nur pausiert. Das ist ok.',
    emoji:       '💤',
    pacing:      'none',
    color:       '#F5F5F5',
    accent:      '#BBBBBB',
    pauseIsGood: true,
    invites:     ['Warten bis der Moment stimmt', 'Nichts erzwingen'],
  },
};

// ── 7B.2 — sharedCreativeState() ───────────────────────────────
/**
 * Erkennt den aktuellen gemeinsamen kreativen Zustand
 * eines Projekts — nicht-linear, nicht-bewertend.
 *
 * Basiert auf: Aktivitätsmuster, Zeitabstand, Momentum, Phasen-Signale.
 */
export function sharedCreativeState(space = {}, recentActivity = []) {
  const {
    status       = 'active',
    started_at,
    resonance_log= [],
    mood,
  } = space;

  if (status === 'completed') return CREATIVE_STATES.finishing;
  if (status === 'paused')    return CREATIVE_STATES.resting;

  const now         = Date.now();
  const ageInDays   = started_at
    ? (now - new Date(started_at).getTime()) / 86400000 : 0;

  // Letzte Aktivität
  const allActivity = [...recentActivity, ...resonance_log].filter(a => a?.created_at);
  const sortedActs  = allActivity.sort((a,b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const lastActivityDays = sortedActs[0]?.created_at
    ? (now - new Date(sortedActs[0].created_at).getTime()) / 86400000
    : ageInDays;

  // Aktivitäts-Häufigkeit
  const recentCount = allActivity.filter(a => {
    const age = (now - new Date(a.created_at).getTime()) / 86400000;
    return age < 7;
  }).length;

  // Zustandsbestimmung — nicht linear, qualitativ
  if (lastActivityDays > 21)          return CREATIVE_STATES.dormant;
  if (lastActivityDays > 10)          return CREATIVE_STATES.resting;
  if (ageInDays < 3)                  return CREATIVE_STATES.exploring;
  if (ageInDays < 7 && recentCount > 5) return CREATIVE_STATES.experimenting;
  if (recentCount > 8)                return CREATIVE_STATES.refining;
  if (ageInDays > 30 && recentCount < 3) return CREATIVE_STATES.finishing;
  if (ageInDays > 14 && recentCount > 3) return CREATIVE_STATES.deepening;
  return CREATIVE_STATES.exploring;
}

// ── 7B.2 — collaborationMomentum() ─────────────────────────────
/**
 * Kreative Energie der Zusammenarbeit — nicht Velocity.
 * Beschreibt Qualität der Energie, nicht Geschwindigkeit.
 */
export function collaborationMomentum(space = {}, recentActivity = []) {
  const now    = Date.now();
  const recent = recentActivity.filter(a => {
    return a?.created_at &&
      (now - new Date(a.created_at).getTime()) / 86400000 < 14;
  });

  const count14d = recent.length;
  const count3d  = recent.filter(a => {
    return (now - new Date(a.created_at).getTime()) / 86400000 < 3;
  }).length;

  // Energie-Qualität — nie als Zahl nach außen
  const MOMENTUM_LEVELS = {
    alive:      { label: 'Lebendig',      description: 'Frische kreative Energie', icon: '⚡', positive: true  },
    steady:     { label: 'Stetig',        description: 'Gleichmäßige Kraft',       icon: '🌊', positive: true  },
    breathing:  { label: 'Atmend',        description: 'Ruhig, kommt und geht',    icon: '🌬️', positive: true  },
    resting:    { label: 'Ruhend',        description: 'Stille hat ihren Wert',    icon: '🌙', positive: true  },
    dormant:    { label: 'Schlummernd',   description: 'Wartet auf seinen Moment', icon: '💤', positive: false },
  };

  const level =
    count3d > 5               ? 'alive'     :
    count14d > 8              ? 'steady'    :
    count14d > 3              ? 'breathing' :
    count14d > 0              ? 'resting'   :
                                'dormant'   ;

  return { ...MOMENTUM_LEVELS[level], key: level, count14d, count3d };
}

// ── 7B.2 — resonanceContinuity() ───────────────────────────────
/**
 * Misst die kreative Verbindung über Zeit — nicht Aktivität.
 * Zwei Menschen können wenig schreiben und trotzdem tief verbunden sein.
 */
export function resonanceContinuity(space = {}, participants = []) {
  const log = space.resonance_log || [];
  if (!log.length && !participants.length) return { continuity: 0, level: 'nascent' };

  // Tiefe der Log-Einträge (qualitativ)
  const deepEntries = log.filter(e => e.type === 'moment' || e.type === 'decision').length;
  const totalEntries= log.length;
  const depthRatio  = totalEntries > 0 ? deepEntries / totalEntries : 0;

  // Beteiligung aller Teilnehmer
  const participantIds = new Set(participants.map(p => p.id || p));
  const activeInLog    = new Set(log.map(e => e.author_id).filter(Boolean));
  const participationRate = participantIds.size > 0
    ? activeInLog.size / participantIds.size : 0;

  const continuity = Math.min(
    depthRatio * 0.5 + participationRate * 0.5,
    1.0
  );

  const level =
    continuity > 0.7 ? 'tief'      :
    continuity > 0.4 ? 'wachsend'  :
    continuity > 0.1 ? 'entstehend':
                       'nascent'   ;

  return {
    continuity: Math.round(continuity * 100) / 100,
    level,
    description:
      level === 'tief'       ? 'Eine tiefe gemeinsame kreative Geschichte.' :
      level === 'wachsend'   ? 'Die Verbindung wächst mit jedem gemeinsamen Moment.' :
      level === 'entstehend' ? 'Etwas Gemeinsames entsteht gerade.' :
                               'Der Anfang — alles ist noch möglich.',
  };
}

// ── 7B.2 — creativePacing() ────────────────────────────────────
/**
 * Der Rhythmus der Zusammenarbeit — wie atmet dieses Projekt?
 * Beschreibt den Takt, nicht bewertet ihn.
 */
export function creativePacing(space = {}, recentActivity = []) {
  const now       = Date.now();
  const timestamps= recentActivity
    .filter(a => a?.created_at)
    .map(a => new Date(a.created_at).getTime())
    .filter(t => t > now - 30 * 86400000)
    .sort((a, b) => b - a);

  if (timestamps.length < 2) {
    return { rhythm: 'stille', label: 'Stille', description: 'Keine messbaren Abstände.', isNocturnal: false };
  }

  // Durchschnittliche Abstände
  const gaps    = timestamps.slice(1).map((t, i) => timestamps[i] - t);
  const avgGap  = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const avgGapH = avgGap / 3600000;

  // Nachtaktivität?
  const nightActivity = recentActivity.filter(a => {
    const h = new Date(a.created_at).getHours();
    return h >= 22 || h < 5;
  }).length;
  const isNocturnal = nightActivity / Math.max(recentActivity.length, 1) > 0.35;

  const RHYTHMS = {
    intense:  { label: 'Intensiv',   description: 'Dicht und energiegeladen.',  avgGapH: [0, 4]   },
    daily:    { label: 'Täglich',    description: 'Gleichmäßiger Tagesrhythmus.', avgGapH: [4, 30]  },
    weekly:   { label: 'Wöchentlich',description: 'Bewusste Abstände. Tief.',    avgGapH: [30, 170] },
    slow:     { label: 'Langsam',    description: 'Viel Raum zwischen den Momenten.', avgGapH: [170, 700] },
    stille:   { label: 'Stille',     description: 'Das Projekt atmet aus.',      avgGapH: [700, Infinity] },
  };

  const rhythm = Object.entries(RHYTHMS).find(([, r]) =>
    avgGapH >= r.avgGapH[0] && avgGapH < r.avgGapH[1]
  )?.[0] || 'stille';

  return {
    rhythm,
    ...RHYTHMS[rhythm],
    avgGapHours:  Math.round(avgGapH),
    isNocturnal,
    nocturnalNote: isNocturnal ? 'Dieses Projekt lebt in den Nachtstunden.' : null,
  };
}

// ── 7B.2 — collaborativeDepth() ────────────────────────────────
/**
 * Qualitative Tiefe der Zusammenarbeit.
 * Nie als Performance-Zahl — nur für persönliche Reflexion.
 */
export function collaborativeDepth(space = {}, history = {}) {
  const {
    decisionsMade    = 0,
    meaningsShared   = 0,   // Echte Bedeutungen geteilt (Empfehlungen etc.)
    questionsMoved   = 0,   // Fragen die wirklich bewegt haben
    durationDays     = 0,
    participants     = 0,
  } = history;

  const logLength      = (space.resonance_log  || []).length;
  const notesLength    = (space.shared_notes   || '').length;
  const refsLength     = (space.reference_board|| []).length;

  // Qualitative Tiefe — nie linearer Fortschritt
  const contentDepth = Math.min(
    Math.min(logLength / 20, 1) * 0.3 +
    Math.min(notesLength / 500, 1) * 0.2 +
    Math.min(refsLength / 10, 1) * 0.15 +
    Math.min(decisionsMade / 5, 1) * 0.2 +
    Math.min(durationDays / 30, 1) * 0.15,
    1.0
  );

  return {
    depth:       Math.round(contentDepth * 100) / 100,
    level:
      contentDepth > 0.7 ? 'tief'          :
      contentDepth > 0.4 ? 'substantiell'  :
      contentDepth > 0.2 ? 'entstehend'    : 'beginnend',
    // Keine öffentliche Zahl — nur Beschreibung
    description:
      contentDepth > 0.7 ? 'Ein reiches gemeinsames Werk wächst.' :
      contentDepth > 0.4 ? 'Eine Substanz hat sich gebildet.' :
      contentDepth > 0.2 ? 'Die ersten Schichten entstehen.' :
                           'Der Anfang — bereit für Tiefe.',
    // Nie zeigen: rohe Zahlen
    _private:    { logLength, notesLength, refsLength, durationDays },
  };
}

// ── 7B.4 — processAtmosphere() ─────────────────────────────────
/**
 * Die emotionale Temperatur eines gemeinsamen Projekts.
 * Stimmung — nicht Status.
 */
export function processAtmosphere(space = {}, participants = [], recentActivity = []) {
  const state     = sharedCreativeState(space, recentActivity);
  const momentum  = collaborationMomentum(space, recentActivity);
  const pacing    = creativePacing(space, recentActivity);
  const season    = getSeason();

  // Atmosphären-Farbe aus Zustand + Space-Mood
  const spaceMood = space.mood || space.atmosphere || 'ruhig';
  const stateColor= state.color;
  const accentColor= state.accent;

  // Emotionale Temperatur — beschreibend
  const TEMPERATURE = {
    warm:   { label: 'Warm',   description: 'Energie und Verbindung sind spürbar.' },
    cool:   { label: 'Kühl',   description: 'Ruhig und konzentriert.' },
    neutral:{ label: 'Neutral',description: 'Offen und unbestimmt.' },
    alive:  { label: 'Lebendig',description: 'Frische kreative Energie bewegt sich.' },
    still:  { label: 'Still',  description: 'Tiefe Stille — beredt und bedeutungsvoll.' },
  };

  const temperature =
    momentum.key === 'alive'    ? 'alive'  :
    momentum.key === 'dormant'  ? 'still'  :
    state.key === 'resting'     ? 'still'  :
    state.key === 'experimenting'? 'warm'  :
    state.key === 'refining'    ? 'cool'   : 'neutral';

  // Saisonaler Einfluss (leise)
  const seasonNote = season.key === 'herbst'
    ? 'Herbstliche Tiefe liegt in der Luft.'
    : season.key === 'winter'
    ? 'Winterliche Konzentration.'
    : null;

  return {
    state,
    momentum,
    pacing,
    temperature:   TEMPERATURE[temperature],
    temperatureKey: temperature,
    colors:        { bg: stateColor, accent: accentColor },
    seasonNote,
    // Stimmungs-Zusammenfassung für UI
    summary: _buildAtmosphereSummary(state, momentum, pacing, temperature),
  };
}

function _buildAtmosphereSummary(state, momentum, pacing, temperature) {
  const parts = [
    state.description,
    momentum.key !== 'dormant' && pacing.rhythm !== 'stille'
      ? `${pacing.label}er Rhythmus.`
      : null,
    pacing.nocturnalNote,
  ].filter(Boolean);
  return parts.join(' ');
}

// ── 7B.5 — Creative Continuity / Process Memory ────────────────

export const MOTIF_TYPES = {
  recurring_theme:   'Wiederkehrendes Thema',
  returning_question:'Offene Frage die bleibt',
  evolving_idea:     'Idee die sich entwickelt',
  shared_reference:  'Gemeinsame Inspiration',
  creative_tension:  'Produktive Spannung',
  unfinished_thread: 'Offener Faden',
  breakthrough:      'Durchbruch-Moment',
};

/**
 * Erkennt wiederkehrende kreative Motive in einem Prozess.
 * Für Prozess-Gedächtnis und kreative Kontinuität.
 */
export function detectCreativeMotifs(resonanceLog = [], sharedNotes = '') {
  if (!resonanceLog.length && !sharedNotes) return [];

  // Keyword-Häufigkeit in Log + Notes
  const allText = [
    ...resonanceLog.map(e => e.content || e.note || ''),
    sharedNotes,
  ].join(' ').toLowerCase();

  const words  = allText.split(/\s+/).filter(w => w.length > 4);
  const counts = {};
  for (const w of words) counts[w] = (counts[w] || 0) + 1;

  // Wörter die ≥ 3× vorkommen = mögliches Motiv
  const recurring = Object.entries(counts)
    .filter(([w, n]) => n >= 3 && !STOP_WORDS.has(w))
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word, count]) => ({
      word,
      count,
      type: 'recurring_theme',
      label: MOTIF_TYPES.recurring_theme,
      note: `Das Thema „${word}" kehrt ${count}× zurück.`,
    }));

  // Offene Fragen erkennen (Sätze die mit "?" enden oder "was" beginnen)
  const questions = resonanceLog
    .filter(e => (e.content || '').includes('?'))
    .slice(0, 3)
    .map(e => ({
      word:  e.content?.slice(0, 40) || '',
      type:  'returning_question',
      label: MOTIF_TYPES.returning_question,
      note:  'Eine Frage die noch beantwortet wartet.',
    }));

  return [...recurring, ...questions].slice(0, 7);
}

const STOP_WORDS = new Set([
  'haben','sein','werden','können','müssen','wollen','sollen',
  'dass','aber','oder','und','auch','noch','mehr','sehr',
  'dann','wenn','weil','durch','nach','über','unter','beim',
  'diese','dieser','dieses','eine','einen','einem','einer',
]);

// ── 7B.6 — Assistive Co-Creation ───────────────────────────────
/**
 * AI-Unterstützung für Zusammenarbeit — ruhig, opt-in, erklärbar.
 * Basiert auf 7A.4 Context Support — erweitert für Kollaboration.
 */
export function getCollaborationAssist(space = {}, recentActivity = []) {
  const state   = sharedCreativeState(space, recentActivity);
  const motifs  = detectCreativeMotifs(space.resonance_log, space.shared_notes);
  const questions = suggestReflectionQuestions({
    mood:   space.mood || space.atmosphere,
    season: getSeason().key,
  });

  // Chat-Zusammenfassung (letzte 5 Aktivitäten)
  const recentSummary = recentActivity.slice(0, 5).map(a =>
    a.content || a.note || a.type || '—'
  ).join(' · ');

  // Atmosphärische Beschreibung des Prozesszustands
  const atmosphericSummary = `${state.emoji} ${state.description}`;

  return {
    state:        state.label,
    motifs,
    questions,
    summary:      atmosphericSummary,
    recentContext:recentSummary || null,
    _assist: {
      explanation: 'Kollaborations-Kontext aus Projektraum-Aktivität.',
      source:      'context',
      isAI:        true,
      optOut:      'settings.assistive_intelligence',
    },
  };
}

// ── 7B.7 — Quiet Collaboration Design ──────────────────────────
// Regeln für ruhige Zusammenarbeit — technisch implementiert

export const QUIET_COLLAB_RULES = {
  // Benachrichtigungen
  notifications: {
    // Nie sofort senden wenn Partner "resting" oder "dormant"
    respectPartnerState: true,
    // Keine Aktivitäts-Erinnerungen ("Du hast 3 Tage nichts beigetragen")
    noInactivityReminders: true,
    // Kein "Dein Partner wartet"-Druck
    noPressureMessages: true,
    // Batching: max 1 Notification/Tag für Projekt-Updates
    maxDailyProjectNotifications: 1,
  },
  // Sichtbarkeit
  visibility: {
    // Kein "Wer hat zuletzt etwas getan?" Indikator
    noLastActiveComparison: true,
    // Kein individuelle Contribution-Tracking (wer hat mehr?)
    noIndividualContributionMetrics: true,
    // Pausen werden respektiert — kein Marker für Inaktivität
    pausesAreInvisible: true,
  },
  // Aktivitätsdruck
  pressure: {
    // Keine Deadlines für kreative Phasen
    noDeadlines: true,
    // Kein Velocity-Tracking
    noVelocity: true,
    // Kein "Produktivitäts"-Wording
    noProductivityLanguage: true,
  },
};

// React Hook: useCoCreation
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useCoCreation(spaceId, currentUserId) {
  const [space,         setSpace]         = useState(null);
  const [recentActivity,setRecentActivity]= useState([]);
  const [loading,       setLoading]       = useState(false);

  const load = useCallback(async () => {
    if (!spaceId) return;
    setLoading(true);
    try {
      const [spaceRes, actRes] = await Promise.all([
        supabase.from('project_spaces').select('*').eq('id', spaceId).single(),
        supabase.from('project_activities').select('*')
          .eq('space_id', spaceId)
          .order('created_at', { ascending: false }).limit(30),
      ]);
      if (spaceRes.data) setSpace(spaceRes.data);
      setRecentActivity(actRes.data || []);
    } catch (err) {
      console.error('[CoCreation]', err?.message);
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => { load(); }, [load]);

  // Berechnungen
  const state      = useMemo(() => space ? sharedCreativeState(space, recentActivity) : null, [space, recentActivity]);
  const momentum   = useMemo(() => space ? collaborationMomentum(space, recentActivity) : null, [space, recentActivity]);
  const pacing     = useMemo(() => space ? creativePacing(space, recentActivity) : null, [space, recentActivity]);
  const atmosphere = useMemo(() => space ? processAtmosphere(space, [], recentActivity) : null, [space, recentActivity]);
  const motifs     = useMemo(() => space ? detectCreativeMotifs(space.resonance_log, space.shared_notes) : [], [space]);
  const assist     = useMemo(() => space ? getCollaborationAssist(space, recentActivity) : null, [space, recentActivity]);

  return {
    space, recentActivity, loading, reload: load,
    state, momentum, pacing, atmosphere, motifs, assist,
    rules: QUIET_COLLAB_RULES,
  };
}
