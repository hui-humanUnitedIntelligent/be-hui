// src/lib/humanePatterns/index.js
// HUI — Humane Digital Civilization Patterns — Phase 8D
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// HUI ist kein Werkzeug zur Aufmerksamkeits-Maximierung.
// Es ist ein menschliches digitales System —
// das Tiefe, Ruhe, Rhythmus und echte Verbindung ermöglicht.
//
// WAS DIESES SYSTEM SCHÜTZT:
//   ✅ Menschliche Aufmerksamkeits-Integrität
//   ✅ Emotionales Pacing — kein System überstimuliert
//   ✅ Soziale Weichheit — kein Vergleichs-Druck
//   ✅ Kulturelle Tiefe — Langsamkeit hat Würde
//   ✅ Reale Verwurzelung — Digital ist nicht das Leben
//
// WAS DIESES SYSTEM VERHINDERT:
//   ❌ Compulsion Loops (nie Infinite Scroll-Mechaniken)
//   ❌ Notification Floods (calmnessHealth Grenzwerte)
//   ❌ Social Comparison Economy (keine Zähler als Hauptsignal)
//   ❌ Permanent Activation (asynchrone Wärme statt sofortige Reaktion)
//   ❌ Digital Displacement (Real-World Cues, Completion Rituals)
//
// FUNKTIONEN:
//   attentionIntegrity()   → Aufmerksamkeits-Schutz
//   socialSoftness()       → Soziale Weichheit und Wärme
//   emotionalPacing()      → Emotionales Tempo und Atemraum
//   culturalDepth()        → Tiefe über Geschwindigkeit
//   humanContinuity()      → Menschliche Kontinuität im Digitalen
//   digitalGroundedness()  → Verwurzelung in der realen Welt
//   humaneHealthScore()    → Gesamter Zivilisations-Score
// ═══════════════════════════════════════════════════════════════

import { calmnessHealth, resonanceQuality } from '@/lib/communityHealth/index';
import { culturalFatigue, culturalFlexibility } from '@/lib/culturalEvolution/index';
import { getSeason }  from '@/lib/culture/index';

const clamp = (v, min = 0, max = 1) => Math.min(Math.max(v, min), max);

// ── Humane Design-Konstanten ────────────────────────────────────
export const HUMANE_THRESHOLDS = {
  // Aufmerksamkeit
  MAX_FEED_ITEMS_PER_SESSION:  30,   // Finite Discovery
  MAX_NOTIFICATIONS_PER_DAY:   3,    // Ruhige Signale
  MAX_INTERACTION_DEPTH_RATIO: 0.15, // Max 15% der Zeit in Deep Interaction
  MIN_PAUSE_BETWEEN_SESSIONS:  30,   // Minuten Mindest-Pause empfohlen
  // Soziale Weichheit
  MAX_PUBLIC_COUNT_PROMINENCE:  0.3, // Zähler sind nie Hauptsignal
  MIN_ASYNC_INTERACTION_RATIO:  0.6, // 60% async (nicht sofort)
  MAX_REACTION_SPEED_PRESSURE:  0.2, // Geringe Erwartung sofortiger Antwort
  // Kulturelle Tiefe
  MIN_LONG_FORM_CONTENT_RATIO:  0.3, // 30% tiefgehende Inhalte
  MAX_TREND_VELOCITY:           0.4, // Trends dürfen nicht zu schnell dominieren
  // Verwurzelung
  MIN_REAL_WORLD_CUES_PER_SESSION: 1, // Mind. 1 Real-World-Cue pro Session
};

// Anti-Compulsion Regeln (technisch verankert)
export const ANTI_COMPULSION_RULES = {
  noInfiniteScroll:       true,   // Finite Discovery — Ende ist Teil des Designs
  noVariableRewardLoops:  true,   // Keine Slot-Machine-Mechaniken
  noStreakPressure:        true,   // Kein Streak-System das Schuld erzeugt
  noFOMO_Design:           true,   // Keine künstliche Verknappung für Druck
  noCompulsiveNotifications:true,  // Max 3/Tag — immer opt-in
  sessionCompletionRituals:true,   // Jede Session hat ein natürliches Ende
  asyncByDefault:          true,   // Asynchron ist der Standard — nicht die Ausnahme
};

// ── 8D.3 — attentionIntegrity() ────────────────────────────────
/**
 * Aufmerksamkeits-Integrität — schützt die kognitive Kapazität.
 * Misst: Fragmentierungs-Rate, Unterbrechungs-Dichte, Tiefe-Ratio.
 * Kein Engagement-Score — ein Ruhe-Score.
 */
export function attentionIntegrity(sessionData = {}) {
  const {
    avgSessionDepthMinutes  = 8,    // Durchschnittliche Tiefe einer Session
    interruptionRate        = 0.3,  // Unterbrechungen (Notifs, Pops) pro Minute
    feedItemsPerSession     = 20,   // Wie viele Items werden gesehen?
    deepInteractionRatio    = 0.2,  // Anteil tiefer Interaktionen (>30s pro Item)
    returnVisitGap          = 4,    // Stunden zwischen Sessions (gesund: > 2h)
    selfDirectedRatio       = 0.5,  // Eigene Entscheidungen vs. Algorithmus-Folge
  } = sessionData;

  // Depth-Score: tiefe Sessions sind wertvoll
  const depthScore = clamp(Math.min(avgSessionDepthMinutes / 15, 1));

  // Interruption-Score: weniger Unterbrechungen = besser
  const interruptScore = clamp(1 - Math.min(interruptionRate / 0.5, 1));

  // Finite Discovery: natürliches Ende erkennbar?
  const finiteScore = feedItemsPerSession <= HUMANE_THRESHOLDS.MAX_FEED_ITEMS_PER_SESSION
    ? 1.0 : clamp(HUMANE_THRESHOLDS.MAX_FEED_ITEMS_PER_SESSION / feedItemsPerSession);

  // Return-Gap: lange Pausen zwischen Sessions sind gesund
  const returnScore = clamp(Math.min(returnVisitGap / 6, 1));

  // Self-direction: Menschen folgen eigener Neugier
  const agencyScore = clamp(selfDirectedRatio);

  const integrity = clamp(
    depthScore      * 0.25 +
    interruptScore  * 0.25 +
    finiteScore     * 0.20 +
    returnScore     * 0.15 +
    agencyScore     * 0.15
  );

  const warnings = [];
  if (interruptionRate > 0.4)   warnings.push('Zu viele Unterbrechungen — Kognitive Fragmentierung');
  if (feedItemsPerSession > 40) warnings.push('Zu viele Feed-Items — Finite Discovery gefährdet');
  if (selfDirectedRatio < 0.3)  warnings.push('Zu wenig Self-Direction — Menschen folgen nur Algorithmen');
  if (returnVisitGap < 1)       warnings.push('Sehr kurze Pausen zwischen Sessions — Pacing-Risiko');

  return {
    integrity:    Math.round(integrity     * 100) / 100,
    depthScore:   Math.round(depthScore    * 100) / 100,
    finiteScore:  Math.round(finiteScore   * 100) / 100,
    agencyScore:  Math.round(agencyScore   * 100) / 100,
    level:
      integrity > 0.80 ? 'aufmerksamkeits-gesund' :
      integrity > 0.60 ? 'stabil'                 :
      integrity > 0.40 ? 'gefährdet'              : 'fragmentiert',
    warnings,
    // Anti-Compulsion Status
    antiCompulsion: ANTI_COMPULSION_RULES,
  };
}

// ── 8D.5 — socialSoftness() ────────────────────────────────────
/**
 * Soziale Weichheit — misst wie wenig Druck das System erzeugt.
 * Schützt vor: Vergleichs-Ökonomie, Performanz-Kultur, sozialem Stress.
 */
export function socialSoftness(socialData = {}) {
  const {
    asyncInteractionRatio    = 0.6,  // Anteil asynchroner Interaktionen
    publicCountProminence    = 0.2,  // Wie prominent sind Zahlen (Follower, Likes)?
    comparisonSignals        = 0.1,  // Wie oft werden Vergleiche erzeugt?
    pressureToRespond        = 0.2,  // Gefühlter Druck sofort zu antworten
    performanceOptimization  = 0.2,  // Anteil optimierter vs. authentischer Inhalte
    quietRecognitionRate     = 0.5,  // Sanfte Anerkennung (vs. lautes Lob)
  } = socialData;

  // Async-Score: Asynchron ist gesünder als sofort-reaktiv
  const asyncScore = clamp(asyncInteractionRatio / HUMANE_THRESHOLDS.MIN_ASYNC_INTERACTION_RATIO);

  // Anti-Comparison: Zahlen sollten nicht dominieren
  const comparisonScore = clamp(1 - publicCountProminence / HUMANE_THRESHOLDS.MAX_PUBLIC_COUNT_PROMINENCE);

  // Low-Pressure: kein Druck sofort zu reagieren
  const pressureScore = clamp(1 - pressureToRespond / HUMANE_THRESHOLDS.MAX_REACTION_SPEED_PRESSURE);

  // Authentizitäts-Score
  const authenticScore = clamp(1 - performanceOptimization);

  // Quiet Recognition
  const recognitionScore = clamp(quietRecognitionRate);

  const softness = clamp(
    asyncScore       * 0.25 +
    comparisonScore  * 0.25 +
    pressureScore    * 0.20 +
    authenticScore   * 0.15 +
    recognitionScore * 0.15
  );

  return {
    softness:       Math.round(softness          * 100) / 100,
    asyncScore:     Math.round(asyncScore        * 100) / 100,
    comparisonScore:Math.round(comparisonScore   * 100) / 100,
    pressureScore:  Math.round(pressureScore     * 100) / 100,
    level:
      softness > 0.80 ? 'sehr weich und warm'  :
      softness > 0.60 ? 'weich'                :
      softness > 0.40 ? 'mittel'               : 'sozial hart',
    description:
      softness > 0.70
        ? 'Soziale Interaktion fühlt sich menschlich an — kein Druck, kein Vergleich.'
        : softness > 0.50
        ? 'Soziale Weichheit vorhanden — einzelne Spannungspunkte.'
        : 'Soziale Härtung erkennbar — Vergleichs- oder Druckmechaniken zu stark.',
  };
}

// ── 8D.4 — emotionalPacing() ───────────────────────────────────
/**
 * Emotionales Tempo — respektiert menschliche Rhythmen.
 * Kein System sollte schneller sein als das menschliche Nervensystem.
 */
export function emotionalPacing(signals = {}) {
  const {
    notificationsPerDay      = 2,    // Wie viele Notifs pro Tag
    contentVelocity          = 0.2,  // Wie schnell wechseln Inhalte
    emotionalIntensityAvg    = 0.4,  // Durchschnittliche emotionale Intensität
    silenceToNoiseRatio      = 0.5,  // Anteil ruhiger vs. intensiver Momente
    nightModeRespected       = true, // Wird Nachtzeit respektiert?
    restCuesProvided         = false,// Gibt es Ruhe-Cues in der UI?
  } = signals;

  // Notif-Ruhe: weniger ist mehr
  const notifScore = clamp(
    1 - Math.max(0, notificationsPerDay - HUMANE_THRESHOLDS.MAX_NOTIFICATIONS_PER_DAY) / 10
  );

  // Velocity: langsame Inhalts-Geschwindigkeit ist gesünder
  const velocityScore = clamp(1 - Math.min(contentVelocity / HUMANE_THRESHOLDS.MAX_TREND_VELOCITY, 1));

  // Emotionale Balance
  const emotionScore = clamp(1 - Math.max(0, emotionalIntensityAvg - 0.6));

  // Stille schützen
  const silenceScore = clamp(silenceToNoiseRatio);

  // Nacht-Respekt
  const nightScore = nightModeRespected ? 1.0 : 0.5;

  // Rest-Cues
  const restScore = restCuesProvided ? 1.0 : 0.7;

  const pacing = clamp(
    notifScore    * 0.25 +
    velocityScore * 0.20 +
    emotionScore  * 0.20 +
    silenceScore  * 0.20 +
    nightScore    * 0.10 +
    restScore     * 0.05
  );

  // Saisonale Modulation
  const season = getSeason();
  const seasonalPacingNote =
    season.key === 'winter' ? 'Winter — langsames Tempo besonders wichtig.' :
    season.key === 'herbst' ? 'Herbst — ruhig werden statt beschleunigen.' :
    season.key === 'sommer' ? 'Sommer — lebhaft aber nicht hektisch.' :
    'Frühling — Aufbruch mit Raum für Pause.';

  return {
    pacing:        Math.round(pacing       * 100) / 100,
    notifScore:    Math.round(notifScore   * 100) / 100,
    silenceScore:  Math.round(silenceScore * 100) / 100,
    level:
      pacing > 0.80 ? 'ruhig und rhythmisch'   :
      pacing > 0.60 ? 'ausgewogen'              :
      pacing > 0.40 ? 'zu schnell'             : 'überstimuliert',
    seasonalPacingNote,
    restCuesNeeded:!restCuesProvided,
    nightReflection: !nightModeRespected
      ? 'Nacht-Modus fehlt — Abend-/Nacht-Nutzung sollte bewusst gedämpft sein.'
      : null,
  };
}

// ── 8D.4 — culturalDepth() ─────────────────────────────────────
/**
 * Kulturelle Tiefe — Langsamkeit hat Würde.
 * Misst: werden tiefgehende, langsame kreative Arbeiten sichtbar?
 */
export function culturalDepth(contentData = {}) {
  const {
    longFormContentRatio     = 0.3,   // Anteil tiefgehender Inhalte
    avgEngagementDepthSecs   = 45,    // Durchschnittliche Verweildauer
    slowWorkVisibility       = 0.3,   // Sichtbarkeit langsamer Projekte
    instantContentRatio      = 0.3,   // Anteil schnell konsumierter Inhalte
    trendFollowingRate       = 0.2,   // Wie viel folgt Trends
    contemplativeSpaceRatio  = 0.2,   // Anteil kontemplativer Räume
  } = contentData;

  // Long-Form gesund?
  const longFormScore = clamp(longFormContentRatio / HUMANE_THRESHOLDS.MIN_LONG_FORM_CONTENT_RATIO);

  // Verweildauer-Score
  const depthScore    = clamp(Math.min(avgEngagementDepthSecs / 90, 1));

  // Langsame Arbeit sichtbar?
  const slowWorkScore = clamp(slowWorkVisibility / 0.3);

  // Anti-Trend-Pressure
  const trendScore    = clamp(1 - Math.min(trendFollowingRate / HUMANE_THRESHOLDS.MAX_TREND_VELOCITY, 1));

  // Kontemplativer Raum
  const contemplScore = clamp(contemplativeSpaceRatio / 0.2);

  const depth = clamp(
    longFormScore * 0.25 +
    depthScore    * 0.25 +
    slowWorkScore * 0.20 +
    trendScore    * 0.15 +
    contemplScore * 0.15
  );

  return {
    depth:         Math.round(depth         * 100) / 100,
    longFormScore: Math.round(longFormScore  * 100) / 100,
    depthScore:    Math.round(depthScore     * 100) / 100,
    level:
      depth > 0.75 ? 'kulturell tief'         :
      depth > 0.55 ? 'ausgewogen'             :
      depth > 0.35 ? 'oberflächlich tendierend':
                     'kulturell flach',
    description:
      depth > 0.70
        ? 'Tiefe kreative Arbeit ist sichtbar und wird gehört.'
        : depth > 0.50
        ? 'Tiefe vorhanden — langsame Werke könnten sichtbarer sein.'
        : 'Oberflächliche Inhalte dominieren — langsame Arbeit braucht mehr Raum.',
    slowWorkHonored: slowWorkVisibility >= 0.25,
  };
}

// ── 8D.5 — humanContinuity() ───────────────────────────────────
/**
 * Menschliche Kontinuität — digitale Systeme sollen menschlichen
 * Lebensbogen respektieren, nicht unterbrechen.
 * Misst: Langzeit-Präsenz, kreative Entwicklung, Gedächtnis-Tiefe.
 */
export function humanContinuity(userData = {}) {
  const {
    platformAgeMonths        = 0,    // Wie lange ist Person schon dabei
    creativeEvolutionRate    = 0.1,  // Wie sehr entwickelt sich die Praxis
    longTermCollabRate       = 0.2,  // Anteil langfristiger Kollaborationen
    memoryDepth              = 0.3,  // Tiefe des persönlichen Gedächtnisses
    seasonalRhythmAdherence  = 0.5,  // Folgt die Person saisonalen Rhythmen?
    pausesTaken              = 0,    // Wie viele bewusste Pausen in letzten 6M
  } = userData;

  // Plattform-Reife
  const maturityScore = clamp(Math.min(platformAgeMonths / 24, 1));

  // Kreative Entwicklung (nicht Optimierung)
  const evolutionScore = clamp(creativeEvolutionRate);

  // Langfristige Beziehungen
  const longTermScore = clamp(longTermCollabRate / 0.3);

  // Gedächtnis-Verbindung
  const memoryScore = clamp(memoryDepth);

  // Saisonale Verbundenheit
  const rhythmScore = clamp(seasonalRhythmAdherence);

  // Pausen als Zeichen von Gesundheit (nicht Inaktivität)
  const pauseScore  = clamp(Math.min(pausesTaken / 2, 1));  // 2 Pausen in 6M = gesund

  const continuity = clamp(
    maturityScore  * 0.20 +
    evolutionScore * 0.20 +
    longTermScore  * 0.20 +
    memoryScore    * 0.15 +
    rhythmScore    * 0.15 +
    pauseScore     * 0.10
  );

  return {
    continuity:   Math.round(continuity   * 100) / 100,
    maturityScore:Math.round(maturityScore* 100) / 100,
    pauseScore:   Math.round(pauseScore   * 100) / 100,
    level:
      continuity > 0.75 ? 'tiefe menschliche Kontinuität' :
      continuity > 0.55 ? 'wachsend'                      :
      continuity > 0.35 ? 'früh'                          : 'noch jung',
    description:
      pauseScore > 0.5
        ? 'Bewusste Pausen wurden genommen — Zeichen für gesunde Plattform-Nutzung.'
        : 'Noch keine Pausen erkennbar — Pacing-Hinweis könnte helfen.',
    pausesHonored: true,  // Pausen werden nie bestraft auf HUI
  };
}

// ── 8D.6 — digitalGroundedness() ───────────────────────────────
/**
 * Verwurzelung in der realen Welt.
 * Digitale Plattformen sollen Menschen im Leben halten — nicht daraus entführen.
 */
export function digitalGroundedness(signals = {}) {
  const {
    realWorldCuesPresent     = false, // Gibt es Real-World-Cues in der UI?
    sessionCompletionDesign  = false, // Hat Session ein natürliches Ende?
    offlineEncouragement     = false, // Wird Offline-Zeit gefördert?
    localContextIntegration  = false, // Lokaler Kontext sichtbar?
    seasonalPresence         = false, // Jahreszeit erkennbar?
    avgSessionLengthMinutes  = 20,    // Durchschnittliche Session-Länge
    exitFrictionLevel        = 0.1,   // Wie schwer ist es zu gehen? (0=leicht)
  } = signals;

  // Real-World-Präsenz
  const realWorldScore = [
    realWorldCuesPresent,
    sessionCompletionDesign,
    offlineEncouragement,
    localContextIntegration,
    seasonalPresence,
  ].filter(Boolean).length / 5;

  // Exit-Friction: Weggehen soll leicht sein
  const exitScore = clamp(1 - exitFrictionLevel);

  // Session-Länge: zu lang ist ein Warnsignal
  const sessionScore = clamp(
    avgSessionLengthMinutes <= 15  ? 1.0  :
    avgSessionLengthMinutes <= 30  ? 0.8  :
    avgSessionLengthMinutes <= 60  ? 0.5  : 0.2
  );

  const groundedness = clamp(
    realWorldScore * 0.50 +
    exitScore      * 0.25 +
    sessionScore   * 0.25
  );

  const season = getSeason();
  const seasonalCue = {
    fruehling: 'Frühling ist draußen — geh raus.',
    sommer:    'Sommer wartet. Die Plattform wartet auch.',
    herbst:    'Herbst lädt ein — Stille und echte Begegnungen.',
    winter:    'Winter: echte Wärme ist wichtiger als digitale.',
  };

  return {
    groundedness:  Math.round(groundedness  * 100) / 100,
    realWorldScore:Math.round(realWorldScore* 100) / 100,
    exitScore:     Math.round(exitScore     * 100) / 100,
    level:
      groundedness > 0.75 ? 'geerdet'          :
      groundedness > 0.55 ? 'mäßig geerdet'    :
      groundedness > 0.35 ? 'tendenziell digital':
                            'digital entfremdet',
    seasonalCue:   seasonalCue[season.key] || 'Die Welt wartet draußen.',
    season:        season.key,
    missingFeatures: [
      !realWorldCuesPresent    && 'Real-World-Cues fehlen',
      !sessionCompletionDesign && 'Session-Completion-Ritual fehlt',
      !offlineEncouragement    && 'Offline-Ermutigung fehlt',
      !seasonalPresence        && 'Saisonale Präsenz fehlt',
    ].filter(Boolean),
  };
}

// ── 8D.8 — humaneHealthScore() ─────────────────────────────────
/**
 * Gesamter Humane Civilization Score.
 * Das übergeordnete Maß: wie menschlich ist dieses digitale System?
 */
export function humaneHealthScore(data = {}) {
  const {
    sessionData    = {},
    socialData     = {},
    pacingSignals  = {},
    contentData    = {},
    userData       = {},
    groundingData  = {},
    platformSignals= {},
  } = data;

  const attention    = attentionIntegrity(sessionData);
  const social       = socialSoftness(socialData);
  const pacing       = emotionalPacing(pacingSignals);
  const depth        = culturalDepth(contentData);
  const continuity   = humanContinuity(userData);
  const grounding    = digitalGroundedness(groundingData);

  // Zusätzlich aus bestehenden Systemen
  const calmness     = calmnessHealth(platformSignals);
  const fatigue      = culturalFatigue(platformSignals);

  const score = clamp(
    attention.integrity   * 0.20 +
    social.softness       * 0.15 +
    pacing.pacing         * 0.20 +
    depth.depth           * 0.15 +
    continuity.continuity * 0.10 +
    grounding.groundedness* 0.10 +
    calmness.calmness     * 0.05 +
    (1 - fatigue.fatigue) * 0.05
  );

  const allWarnings = [
    ...attention.warnings,
    pacing.restCuesNeeded ? ['Rest-Cues fehlen in der UI'] : [],
    pacing.nightReflection ? [pacing.nightReflection] : [],
    ...grounding.missingFeatures,
  ].flat().filter(Boolean);

  return {
    score:   Math.round(score * 100) / 100,
    level:
      score > 0.80 ? 'human-zentriert'          :
      score > 0.65 ? 'ausgewogen menschlich'     :
      score > 0.50 ? 'entwicklungsfähig'         :
      score > 0.35 ? 'mechanistisch tendierend'  :
                     'menschlichkeits-defizitär',
    dimensions: { attention, social, pacing, depth, continuity, grounding },
    allWarnings: [...new Set(allWarnings)].slice(0, 6),
    antiCompulsion:ANTI_COMPULSION_RULES,
    season:        getSeason().key,
    timestamp:     new Date().toISOString(),
    _isInternal:   true,
    // Kein Retention-KPI — nur menschliche Gesundheit
    note: 'Dieser Score misst menschliche Gesundheit — nicht Plattform-Retention.',
  };
}

// CSS — Humane Interaction Design
export const HUMANE_CSS = `
  /* Breathing Space — kein Element springt einen an */
  .hui-content-card {
    transition: transform 400ms cubic-bezier(0.23, 1, 0.32, 1),
                box-shadow 400ms ease;
  }
  .hui-content-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  }

  /* Finite Discovery Indicator — sanftes Ende */
  .hui-feed-end {
    opacity: 0;
    animation: hui-fade-end 600ms ease forwards;
    animation-delay: 200ms;
  }
  @keyframes hui-fade-end {
    to { opacity: 1; }
  }

  /* Async Response — keine sofortige Erwartung erzeugen */
  .hui-message-status {
    opacity: 0.5;
    font-size: 0.75rem;
    letter-spacing: 0.02em;
  }

  /* Real-World Cue — sanfter Übergang zurück */
  .hui-grounding-cue {
    opacity: 0;
    animation: hui-grounding-appear 800ms ease forwards;
    animation-delay: 500ms;
  }
  @keyframes hui-grounding-appear {
    0%   { opacity: 0; transform: translateY(4px); }
    100% { opacity: 0.7; transform: translateY(0); }
  }

  /* Session Completion — natürlicher Abschluss */
  .hui-session-complete {
    text-align: center;
    padding: 2rem;
    opacity: 0.6;
    font-size: 0.9rem;
    letter-spacing: 0.05em;
  }

  /* Quiet Recognition — keine lauten Celebrations */
  .hui-quiet-recognition {
    transition: opacity 600ms ease;
    opacity: 0.8;
  }
  .hui-quiet-recognition:hover {
    opacity: 1.0;
  }
`;

// React Hook
import { useState, useEffect, useCallback, useMemo } from 'react';

export function useHumanePatterns(userProfile = null) {
  const [sessionData,   setSessionData]   = useState({});
  const [groundingData, setGroundingData] = useState({
    realWorldCuesPresent:    true,   // HUI hat Seasonal Cues
    sessionCompletionDesign: true,   // Feed hat natürliches Ende
    offlineEncouragement:    false,  // TODO: implementieren
    localContextIntegration: !!userProfile?.location_label,
    seasonalPresence:        true,   // Jahreszeit immer sichtbar
    exitFrictionLevel:       0.05,   // Sehr leicht zu gehen
  });

  // Session-Tracking (privacy-preserving — nur aggregiert)
  useEffect(() => {
    const start = Date.now();
    return () => {
      const durationMinutes = (Date.now() - start) / 60000;
      setSessionData(prev => ({
        ...prev,
        avgSessionDepthMinutes: durationMinutes,
      }));
    };
  }, []);

  const score = useMemo(() =>
    humaneHealthScore({ sessionData, groundingData }),
    [sessionData, groundingData]
  );

  const season = getSeason();

  return {
    score,
    seasonalGroundingCue: score.dimensions?.grounding?.seasonalCue || null,
    isHealthy:            score.score > 0.65,
    antiCompulsion:       ANTI_COMPULSION_RULES,
    thresholds:           HUMANE_THRESHOLDS,
    css:                  HUMANE_CSS,
    season:               season.key,
  };
}
