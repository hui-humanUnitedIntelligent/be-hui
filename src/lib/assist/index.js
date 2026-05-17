// src/lib/assist/index.js
// HUI — Creative Assist Engine — Phase 7A.2 + 7A.3 + 7A.5 + 7A.6 + 7A.8
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// AI als ruhige, erklärbare Assistenz — nie als Ersatz.
// Mensch bleibt Ursprung kreativer Bedeutung.
//
// ALLE FUNKTIONEN:
//   ✅ transparent — jeder Vorschlag hat eine Erklärung
//   ✅ opt-in — nichts passiert ohne Zustimmung
//   ✅ ruhig — keine aggressiven Nudges, keine Popups
//   ✅ erklärbar — keine Blackbox
//   ✅ kulturell sensibel — schützt Vielfalt aktiv
//   ✅ reversibel — Feature Flags für alle Systeme
//
// WAS DIESE ENGINE NICHT MACHT:
//   ❌ Menschen ersetzen
//   ❌ Stimmen imitieren
//   ❌ Aufmerksamkeit manipulieren
//   ❌ Resonanz simulieren
//   ❌ Kulturelle Dynamiken steuern
// ═══════════════════════════════════════════════════════════════

import { creativeResonance, trustDistance, collaborationDepth, creatorBridgeScore }
  from '@/lib/graph/index';
import { resonanceSignature, atmosphericIdentity }
  from '@/lib/presence/index';
import { detectInterdisciplinaryTransition }
  from '@/lib/creativeJourney/index';
import { findNearbyResonance }
  from '@/lib/localNetwork/index';
import { getSeason }
  from '@/lib/culture/index';
import { getFlag }
  from '@/lib/release/index';

// ── AI Feature Flag Guard ────────────────────────────────────────
// Alle Assist-Funktionen prüfen ob AI-Unterstützung aktiv ist
function isAssistEnabled() {
  return getFlag('DISCOVERY_V2');  // Proxy — wird durch eigenen Flag ersetzt
}

// ── Assist Result Schema ────────────────────────────────────────
// Jedes Assist-Ergebnis hat eine Erklärung — immer
function assistResult(data, explanation, source = 'heuristic') {
  return {
    ...data,
    _assist: {
      explanation,    // Menschlich lesbar: warum dieser Vorschlag?
      source,         // 'heuristic' | 'graph' | 'resonance' | 'local' | 'context'
      confidence:     data.confidence || null,
      isAI:           true,
      optOut:         'settings.assistive_intelligence',
      timestamp:      new Date().toISOString(),
    },
  };
}

// ════════════════════════════════════════════════════════════════
// 7A.2 — CREATIVE ASSIST FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * suggestConnections()
 * Schlägt Verbindungen vor — basierend auf kreativem Resonanz-Score.
 * Keine Zahl wird gezeigt. Nur: menschliche Beschreibung.
 *
 * @param {Object}  currentCreator  — Das eigene Profil
 * @param {Array}   candidates      — Potenzielle Verbindungen
 * @param {number}  [limit=5]       — Max Vorschläge (ruhig begrenzt)
 */
export function suggestConnections(currentCreator, candidates = [], limit = 5) {
  if (!isAssistEnabled() || !currentCreator || !candidates.length) return [];

  const scored = candidates
    .filter(c => c.id !== currentCreator.id)
    .map(candidate => {
      const { resonance, dimensions } = creativeResonance(currentCreator, candidate);
      const trust  = trustDistance(currentCreator, candidate);

      // Dominante Resonanz-Dimension finden
      const topDim = Object.entries(dimensions)
        .filter(([, v]) => v > 0)
        .sort(([, a], [, b]) => b - a)[0];

      if (resonance < 0.15) return null;  // Zu wenig — nicht zeigen

      // Menschliche Erklärung — nie eine Zahl
      const explanation = _buildConnectionExplanation(
        currentCreator, candidate, resonance, dimensions, trust
      );

      return assistResult(
        { creator: candidate, resonance, dimensions },
        explanation,
        'graph'
      );
    })
    .filter(Boolean)
    .sort((a, b) => b.resonance - a.resonance)
    .slice(0, limit);

  return scored;
}

function _buildConnectionExplanation(creatorA, creatorB, resonance, dimensions, trust) {
  const parts = [];
  const nameB = creatorB.display_name?.split(' ')[0] || 'Diese Person';

  // Dominante Dimension benennen
  if (dimensions.tagOverlap > 0.3)
    parts.push(`ähnliche kreative Ausrichtung`);
  if (dimensions.moodMatch > 0.4)
    parts.push(`verwandte Energie`);
  if (dimensions.locationMatch > 0)
    parts.push(`lokal verbunden`);
  if (dimensions.focusCompat > 0.3)
    parts.push(`kompatibler Fokus`);

  // Trust-Tiefe
  const depthLabel =
    resonance > 0.6 ? 'besonders nah' :
    resonance > 0.4 ? 'deutlich verwandt' :
    resonance > 0.2 ? 'thematisch ähnlich' : 'leicht verwandt';

  return parts.length > 0
    ? `${nameB}: ${parts.join(', ')} — ${depthLabel}.`
    : `${nameB} und du teilen ${depthLabel}e kreative Qualitäten.`;
}

/**
 * suggestCollaborations()
 * Erkennt potenzielle Zusammenarbeiten basierend auf
 * Verfügbarkeit, Kompatibilität und kreativem Matching.
 */
export function suggestCollaborations(currentCreator, candidates = [], limit = 3) {
  if (!isAssistEnabled() || !currentCreator) return [];

  return candidates
    .filter(c => c.id !== currentCreator.id && c.is_available !== false)
    .map(candidate => {
      const { resonance, dimensions } = creativeResonance(currentCreator, candidate);
      if (resonance < 0.20) return null;

      // Kollaborations-Kompatibilität
      const styleA = currentCreator.collab_mood || 'ruhig';
      const styleB = candidate.collab_mood    || 'ruhig';
      const styleCompat = styleA === styleB ? 0.2 : 0;

      const collabScore = resonance * 0.7 + styleCompat + (candidate.is_available ? 0.1 : 0);

      const collabStyle = _describeCollabStyle(styleA, styleB, resonance);

      return assistResult(
        { creator: candidate, score: Math.round(collabScore * 100) / 100 },
        collabStyle,
        'resonance'
      );
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function _describeCollabStyle(styleA, styleB, resonance) {
  if (styleA === styleB && resonance > 0.4)
    return `Ähnlicher Kollaborationsstil — könnte eine ruhige, fließende Zusammenarbeit sein.`;
  if (resonance > 0.5)
    return `Starke kreative Verwandtschaft — Zusammenarbeit könnte tief und bedeutsam sein.`;
  if (resonance > 0.3)
    return `Kreative Verbindung erkennbar — eine Begegnung könnte interessant sein.`;
  return `Verschiedene Zugänge — könnte eine bereichernde Begegnung entstehen.`;
}

/**
 * suggestCreativeBridges()
 * Findet Bridge-Möglichkeiten: wo könnten zwei kreative Welten
 * sich sinnvoll begegnen?
 */
export function suggestCreativeBridges(currentCreator, candidates = [], limit = 3) {
  if (!isAssistEnabled() || !currentCreator) return [];

  return candidates
    .filter(c => c.id !== currentCreator.id)
    .map(candidate => {
      const bridgeA = creatorBridgeScore(currentCreator, []).bridgeScore;
      const bridgeB = creatorBridgeScore(candidate, []).bridgeScore;

      // Interdisziplinäre Transition erkennen
      const currentDomains = currentCreator.dna_tags || [];
      const candidateDomains = candidate.dna_tags || [];
      const newDomains = candidateDomains.filter(d => !currentDomains.includes(d));

      const bridges = newDomains
        .map(d => detectInterdisciplinaryTransition(currentDomains, d))
        .filter(b => b?.detected);

      if (bridges.length === 0 && bridgeA < 0.3 && bridgeB < 0.3) return null;

      const explanation = bridges.length > 0
        ? `${candidate.display_name?.split(' ')[0] || 'Diese Person'} öffnet Felder die du noch nicht bereist hast: ${bridges.map(b => b.toFamily).join(', ')}.`
        : `${candidate.display_name?.split(' ')[0] || 'Diese Person'} ist eine kreative Brücke — verbindet Welten die sich sonst selten begegnen.`;

      return assistResult(
        { creator: candidate, bridges, isBridge: true },
        explanation,
        'graph'
      );
    })
    .filter(Boolean)
    .slice(0, limit);
}

/**
 * suggestProjectDirections()
 * Leichte Richtungsimpulse für ein laufendes Projekt.
 * Keine Entscheidungen — nur: Möglichkeitsräume.
 */
export function suggestProjectDirections(projectContext = {}) {
  if (!isAssistEnabled()) return [];

  const { mood, tags = [], participants = [], season } = projectContext;
  const currentSeason = getSeason();
  const activeSeason  = season || currentSeason.key;

  const DIRECTION_SEEDS = {
    // Jahreszeit-basiert
    fruehling: [
      'Was wäre der Aufbruch in diesem Projekt?',
      'Welche neue Richtung wartet noch unentdeckt?',
      'Was könnte hier wachsen wenn man es lässt?',
    ],
    sommer:    [
      'Was könnte nach draußen getragen werden?',
      'Welche Verbindung zur lokalen Gemeinschaft wäre möglich?',
      'Was ist das Leichte, das Direkte in diesem Vorhaben?',
    ],
    herbst:    [
      'Was ist reif — und wartet auf Ernte?',
      'Was braucht Tiefe statt Breite?',
      'Welche Erfahrung der letzten Monate fließt ein?',
    ],
    winter:    [
      'Was ist das Essentielle — wenn man alles andere weglässt?',
      'Welche stille Qualität will sich zeigen?',
      'Was entsteht in der Konzentration?',
    ],
  };

  const seasonDirections = DIRECTION_SEEDS[activeSeason] || DIRECTION_SEEDS.herbst;

  // Mood-basierte Zusatzrichtungen
  const moodDirections = {
    ruhig:    'Was ist die stillste Version dieses Projekts?',
    kreativ:  'Was wäre der mutigste nächste Schritt?',
    warm:     'Wie könnte dieser Raum für andere öffnen?',
    tief:     'Welche Frage steht noch unbeantwortet im Raum?',
  };

  const directions = [
    ...seasonDirections,
    mood && moodDirections[mood],
  ].filter(Boolean).map(q => assistResult(
    { question: q, type: 'direction' },
    `Jahreszeit: ${currentSeason.name}. Impuls — keine Aufgabe.`,
    'context'
  ));

  return directions.slice(0, 3);
}

/**
 * detectCreativeCompatibility()
 * Beschreibt wie zwei Menschen zusammen arbeiten könnten.
 * Keine Zahl. Nur: atmosphärische Beschreibung.
 */
export function detectCreativeCompatibility(creatorA, creatorB) {
  if (!creatorA || !creatorB) return null;

  const { resonance, dimensions } = creativeResonance(creatorA, creatorB);
  const sigA = resonanceSignature(creatorA);
  const sigB = resonanceSignature(creatorB);
  const atmA = atmosphericIdentity(creatorA);
  const atmB = atmosphericIdentity(creatorB);

  // Energie-Kompatibilität
  const sameEnergy    = atmA.energy === atmB.energy;
  const sameMoodCluster = sigA.moodCluster === sigB.moodCluster;

  // Pacing-Kompatibilität
  const PACING = { resonant: 4, präsent: 3, entstehend: 2, offen: 1, ruhend: 0 };
  const pacingDiff = Math.abs((PACING[atmA.energy] || 0) - (PACING[atmB.energy] || 0));

  let quality, description;

  if (resonance > 0.55 && sameEnergy) {
    quality     = 'tief resonant';
    description = `${creatorA.display_name?.split(' ')[0]} und ${creatorB.display_name?.split(' ')[0]} teilen kreative Energie und Tiefe — eine Zusammenarbeit könnte besonders fließend sein.`;
  } else if (resonance > 0.40) {
    quality     = 'deutlich verwandt';
    description = `Starke thematische Verbindung — Zusammenarbeit könnte reich und bedeutsam sein.`;
  } else if (resonance > 0.25) {
    quality     = 'komplementär';
    description = `Verschiedene Qualitäten die sich ergänzen könnten — interessante Spannung möglich.`;
  } else {
    quality     = 'kontrastreich';
    description = `Sehr verschiedene kreative Welten — könnte eine bereichernde Begegnung entstehen, braucht aber Offenheit.`;
  }

  return assistResult(
    { quality, resonance, pacingDiff, sameMoodCluster },
    description,
    'resonance'
  );
}

/**
 * summarizeCreativeThemes()
 * Erkennt dominante Themen in einem Set von Werken oder Profilen.
 * Für Projekt-Zusammenfassungen und Kontext-Unterstützung.
 */
export function summarizeCreativeThemes(items = []) {
  if (!items.length) return null;

  const THEME_FAMILIES = {
    natur:     ['natur','wald','wasser','pflanze','erde','tier','garten'],
    mensch:    ['portrait','mensch','emotion','körper','gemeinschaft'],
    material:  ['ton','holz','textil','papier','material','handwerk'],
    klang:     ['klang','stille','rhythmus','melodie','ambient'],
    raum:      ['raum','architektur','urban','garten','installation'],
    sprache:   ['text','lyrik','narration','geschichte','wort'],
    bewegung:  ['bewegung','tanz','ritual','dynamik','flow'],
    licht:     ['licht','farbe','pigment','schatten'],
  };

  const tagCounts = {};
  const familyCounts = {};

  for (const item of items) {
    const tags = [...(item.dna_tags || []), ...(item.tags || []),
                  item.talent, item.category].filter(Boolean);
    for (const tag of tags) {
      const t = tag.toLowerCase();
      tagCounts[t] = (tagCounts[t] || 0) + 1;
      for (const [family, kws] of Object.entries(THEME_FAMILIES)) {
        if (kws.some(k => t.includes(k))) {
          familyCounts[family] = (familyCounts[family] || 0) + 1;
        }
      }
    }
  }

  const topTags    = Object.entries(tagCounts)
    .sort(([,a],[,b]) => b-a).slice(0,5).map(([t]) => t);
  const topFamilies= Object.entries(familyCounts)
    .sort(([,a],[,b]) => b-a).slice(0,3).map(([f]) => f);

  const summary = topFamilies.length > 0
    ? `Dominante Themen: ${topFamilies.join(', ')}.`
    : 'Vielfältige kreative Themen ohne klaren Schwerpunkt.';

  return assistResult(
    { topTags, topFamilies, itemCount: items.length },
    summary,
    'context'
  );
}

// ── 7A.5 — Atmospheric AI ───────────────────────────────────────
// Sanfte Hinweise — nie drängen, nie aufdrängen

/**
 * getAtmosphericHint()
 * Ein einziger, optionaler Impuls.
 * Wird nur gezeigt wenn Creator explizit "Inspiration" anfordert.
 * Nie proaktiv pushen.
 */
export function getAtmosphericHint(creatorProfile = {}) {
  if (!isAssistEnabled()) return null;

  const season    = getSeason();
  const signature = resonanceSignature(creatorProfile);
  const isActive  = creatorProfile.is_available !== false;

  if (!isActive) return null;  // Kein Hint wenn Creator pausiert

  // Leise, saisonale Inspiration
  const SEASONAL_HINTS = {
    fruehling: [
      'Was wartet schon eine Weile auf seinen Moment?',
      'Welches Material wolltest du schon lange erkunden?',
    ],
    sommer:    [
      'Gibt es jemanden in deiner Stadt mit dem du noch nie gesprochen hast?',
      'Was könnte nach draußen getragen werden?',
    ],
    herbst:    [
      'Was ist in den letzten Monaten gereift?',
      'Welches Projekt braucht jetzt Stille zum Vollenden?',
    ],
    winter:    [
      'Was wäre das eine Ding, wenn du alles andere weglässt?',
      'Welche Zusammenarbeit schwebte dir schon lange vor?',
    ],
  };

  const hints = SEASONAL_HINTS[season.key] || SEASONAL_HINTS.herbst;
  const hint  = hints[Math.floor(Date.now() / 86400000) % hints.length];

  return assistResult(
    { hint, season: season.key },
    `Saisonaler Impuls: ${season.name}. Freiwillig — kein Auftrag.`,
    'context'
  );
}

// ── 7A.8 — Cultural Safety Check ───────────────────────────────

/**
 * culturalSafetyCheck()
 * Prüft ob ein Set von Vorschlägen kulturelle Vielfalt wahrt.
 * Verhindert Mono-Kultur-Förderung durch AI.
 *
 * @returns {{ safe: boolean, issues: string[], recommendations: string[] }}
 */
export function culturalSafetyCheck(suggestions = []) {
  if (!suggestions.length) return { safe: true, issues: [], recommendations: [] };

  const domains    = suggestions.map(s => s.creator?.talent || s.creator?.focus_type || '');
  const locations  = suggestions.map(s => s.creator?.location_label || '');
  const moods      = suggestions.map(s => (s.creator?.mood_tags || [])[0] || '');

  // Diversität prüfen
  const uniqueDomains  = new Set(domains.filter(Boolean)).size;
  const uniqueLocs     = new Set(locations.filter(Boolean)).size;
  const uniqueMoods    = new Set(moods.filter(Boolean)).size;
  const total          = suggestions.length;

  const issues = [];
  const recommendations = [];

  // Mono-Domain Check
  if (total >= 3 && uniqueDomains <= 1) {
    issues.push('Alle Vorschläge aus demselben kreativen Feld');
    recommendations.push('Mehr Diversität in den Domains — Bridge Creators bevorzugen');
  }

  // Geo-Bubble Check
  if (total >= 4 && uniqueLocs <= 1) {
    issues.push('Alle Vorschläge aus derselben Stadt');
    recommendations.push('Regionale Diversität stärken');
  }

  // Mood-Monokultur
  if (total >= 4 && uniqueMoods <= 1) {
    issues.push('Alle Vorschläge mit identischer Stimmung');
    recommendations.push('Atmosphärische Vielfalt erhöhen');
  }

  return {
    safe:            issues.length === 0,
    issues,
    recommendations,
    diversity: {
      domains:   uniqueDomains,
      locations: uniqueLocs,
      moods:     uniqueMoods,
    },
  };
}

// React Hook
import { useState, useCallback } from 'react';

export function useAssist(currentCreator) {
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);

  const assist = useCallback(async (type, candidates = [], context = {}) => {
    if (!currentCreator) return;
    setLoading(true);
    try {
      let output = null;
      if (type === 'connections')   output = suggestConnections(currentCreator, candidates);
      if (type === 'collaborations')output = suggestCollaborations(currentCreator, candidates);
      if (type === 'bridges')       output = suggestCreativeBridges(currentCreator, candidates);
      if (type === 'directions')    output = suggestProjectDirections(context);
      if (type === 'hint')          output = getAtmosphericHint(currentCreator);

      // Cultural Safety Check
      const safetyResult = type !== 'hint'
        ? culturalSafetyCheck(Array.isArray(output) ? output : [output])
        : { safe: true };

      setResult({ output, safety: safetyResult, type });
    } catch (err) {
      console.error('[Assist]', err?.message);
    } finally {
      setLoading(false);
    }
  }, [currentCreator]);

  return { result, loading, assist };
}
