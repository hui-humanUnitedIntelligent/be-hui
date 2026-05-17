// src/lib/assist/context.js
// HUI — Creative Context Support — Phase 7A.4
// ═══════════════════════════════════════════════════════════════
//
// AI-Unterstützung für kreative Prozesse.
// Hilft verstehen, strukturieren, orientieren.
// Nie: Entscheidungen übernehmen.
//
// FUNKTIONEN:
//   summarizeProjectContext()   → Projekt-Zusammenfassung
//   clusterIdeas()              → Ideen-Clustering
//   findSharedThemes()          → Gemeinsame Themen erkennen
//   suggestReflectionQuestions()→ Kreative Reflexionsfragen
//   structureReferences()       → Referenzen ordnen
// ═══════════════════════════════════════════════════════════════

import { summarizeCreativeThemes } from '@/lib/assist/index';
import { getSeason } from '@/lib/culture/index';

// ── Projekt-Zusammenfassung ─────────────────────────────────────
/**
 * Fasst den Kontext eines Projekts zusammen.
 * Für Project Spaces — gibt Teilnehmern einen gemeinsamen Überblick.
 *
 * @param {Object} space  — Project Space
 * @returns {{ summary: string, themes: string[], questions: string[] }}
 */
export function summarizeProjectContext(space = {}) {
  const { name, description, mood, members = [], resonance_log = [], shared_notes = '' } = space;

  // Themen aus Space-Daten
  const themeItems = [
    { dna_tags: description?.split(' ').slice(0,10) || [] },
    { dna_tags: shared_notes?.split(' ').slice(0,10) || [] },
  ];
  const themes = summarizeCreativeThemes(themeItems);

  // Reflexionsfragen aus Kontext
  const questions = suggestReflectionQuestions({ mood, themes: themes?.topFamilies });

  // Kurze Zusammenfassung
  const ageIndicator = resonance_log.length > 5 ? 'vertieft sich gerade' : 'gerade gestartet';
  const summary = [
    name && `Projekt: „${name}"`,
    mood && `Atmosphäre: ${mood}`,
    members.length > 1 && `${members.length} Creators gemeinsam`,
    themes?.topFamilies?.length && `Themen: ${themes.topFamilies.join(', ')}`,
    ageIndicator,
  ].filter(Boolean).join(' · ');

  return {
    summary,
    themes:    themes?.topFamilies || [],
    questions,
    _assist: {
      explanation: 'Kontext-Zusammenfassung aus Projektraum-Daten.',
      source:      'context',
      isAI:        true,
      optOut:      'settings.assistive_intelligence',
    },
  };
}

// ── Ideen-Clustering ────────────────────────────────────────────
/**
 * Gruppiert lose Ideen nach thematischer Nähe.
 * Für collaborative notes in Project Spaces.
 *
 * @param {string[]} ideas — Rohe Ideen-Liste
 * @returns {{ clusters: Object, ungrouped: string[] }}
 */
export function clusterIdeas(ideas = []) {
  if (ideas.length < 3) return { clusters: {}, ungrouped: ideas };

  const CLUSTER_KEYWORDS = {
    'Visuelle Qualität':   ['bild','farbe','licht','form','komposition','ästhetik'],
    'Klang & Rhythmus':    ['klang','ton','musik','rhythmus','stille','frequenz'],
    'Material & Handwerk': ['material','werkzeug','technik','handwerk','stoff','ton'],
    'Raum & Ort':          ['raum','ort','lokal','draußen','stadt','architektur'],
    'Mensch & Beziehung':  ['person','mensch','begegnung','beziehung','gemeinschaft'],
    'Zeit & Prozess':      ['zeit','prozess','verlauf','schritt','entwicklung','wachstum'],
    'Idee & Konzept':      ['idee','konzept','bedeutung','inhalt','thema','aussage'],
  };

  const clusters = {};
  const ungrouped = [];

  for (const idea of ideas) {
    const lower = idea.toLowerCase();
    let bestCluster = null;
    let bestScore   = 0;

    for (const [cluster, keywords] of Object.entries(CLUSTER_KEYWORDS)) {
      const score = keywords.filter(k => lower.includes(k)).length;
      if (score > bestScore) { bestScore = score; bestCluster = cluster; }
    }

    if (bestCluster && bestScore > 0) {
      if (!clusters[bestCluster]) clusters[bestCluster] = [];
      clusters[bestCluster].push(idea);
    } else {
      ungrouped.push(idea);
    }
  }

  return {
    clusters,
    ungrouped,
    _assist: {
      explanation: 'Thematisches Clustering — grobe Orientierung, keine Wertung.',
      source:      'context',
      isAI:        true,
      optOut:      'settings.assistive_intelligence',
    },
  };
}

// ── Gemeinsame Themen ───────────────────────────────────────────
/**
 * Findet gemeinsame Themen zwischen mehreren Creator-Profilen.
 * Für Project Spaces mit mehreren Teilnehmern.
 */
export function findSharedThemes(profiles = []) {
  if (profiles.length < 2) return null;

  const tagSets = profiles.map(p => new Set([...(p.dna_tags || []), p.talent || ''].map(t => t.toLowerCase())));
  const allTags = [...tagSets[0]];

  // Schnittmenge: Tags die mindestens 2 Profile teilen
  const shared = allTags.filter(tag =>
    tagSets.filter(set => set.has(tag)).length >= Math.max(2, Math.floor(profiles.length * 0.5))
  );

  if (shared.length === 0) {
    return {
      shared: [],
      description: 'Sehr verschiedene Ausgangspunkte — das kann eine interessante kreative Spannung sein.',
      _assist: { explanation: 'Keine gemeinsamen Tags gefunden.', source: 'context', isAI: true, optOut: 'settings.assistive_intelligence' },
    };
  }

  return {
    shared:      shared.slice(0, 5),
    description: `Gemeinsamer Boden: ${shared.slice(0, 3).join(', ')}.`,
    _assist: {
      explanation: `Gemeinsame Tags aus ${profiles.length} Profilen.`,
      source:      'context',
      isAI:        true,
      optOut:      'settings.assistive_intelligence',
    },
  };
}

// ── Reflexionsfragen ────────────────────────────────────────────
/**
 * Sanfte Reflexionsfragen für einen kreativen Kontext.
 * Keine Aufgaben. Keine Ziele. Nur: offene Fragen.
 *
 * @param {Object} context — { mood, themes, season }
 */
export function suggestReflectionQuestions(context = {}) {
  const { mood, themes = [], season } = context;
  const currentSeason = season || getSeason().key;

  const UNIVERSAL_QUESTIONS = [
    'Was ist das Wichtigste in diesem Moment?',
    'Was wollt ihr gemeinsam herausfinden?',
    'Welche Frage steht noch unbeantwortet?',
    'Was überrascht euch gerade?',
    'Was braucht mehr Zeit?',
  ];

  const MOOD_QUESTIONS = {
    ruhig:         'Was ist das Leiseste was hier entstehen könnte?',
    kreativ:       'Welche Idee wartet noch auf ihren Mut?',
    warm:          'Wen könnte diese Arbeit berühren?',
    tief:          'Was wäre, wenn ihr noch tiefer geht?',
    inspirierend:  'Was würde entstehen wenn alle Grenzen wegfallen?',
    authentisch:   'Was ist das Ehrlichste was gesagt werden möchte?',
  };

  const SEASONAL_QUESTIONS = {
    fruehling: 'Was soll in diesem Projekt neu entstehen?',
    sommer:    'Wie könnte diese Arbeit nach außen wirken?',
    herbst:    'Was ist gereift — und wartet auf seinen Abschluss?',
    winter:    'Was ist das Essentielle wenn man alles Unnötige weglässt?',
  };

  const questions = [
    SEASONAL_QUESTIONS[currentSeason],
    mood && MOOD_QUESTIONS[mood],
    ...UNIVERSAL_QUESTIONS.slice(0, 2),
  ].filter(Boolean);

  return questions.slice(0, 3);
}

// ── Referenzen strukturieren ────────────────────────────────────
/**
 * Ordnet Referenzen (Links, Bilder, Notizen) nach thematischen Clustern.
 */
export function structureReferences(references = []) {
  if (!references.length) return { organized: [], unorganized: [] };

  // Einfache Kategorisierung nach Typ und Stichworten
  const organized = [];
  const unorganized = [];

  for (const ref of references) {
    const text  = (ref.title || ref.url || ref.note || '').toLowerCase();
    const type  = ref.type || 'misc';

    const category =
      text.match(/foto|bild|image|photo/) ? 'Visuelles'  :
      text.match(/klang|sound|musik|audio/)? 'Klang'     :
      text.match(/text|artikel|paper/)     ? 'Sprache'   :
      text.match(/video|film|motion/)      ? 'Bewegtbild':
      type === 'link'                      ? 'Links'     :
      'Sonstiges';

    organized.push({ ...ref, _category: category });
  }

  // Nach Kategorie gruppieren
  const byCategory = {};
  for (const ref of organized) {
    const cat = ref._category;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(ref);
  }

  return {
    byCategory,
    total: references.length,
    _assist: {
      explanation: 'Referenzen nach Medientyp und Stichworten geordnet.',
      source:      'context',
      isAI:        true,
      optOut:      'settings.assistive_intelligence',
    },
  };
}
