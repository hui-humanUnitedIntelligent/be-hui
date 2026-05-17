// src/lib/communityHealth/integration.js
// HUI — Health-Aware Discovery Integration — Phase 5H.2
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Community Health beeinflusst Discovery — sanft, transparent, capped.
// Keine Bestrafung. Kein Shadowban. Keine verborgene Kontrolle.
//
// GEWICHTUNG (Final Stack):
//   Discovery Score (5C)    75%   Trust + Fit + Social + Fresh
//   Human Graph (5D)        10%   Bridge + Cluster + Proximity
//   Context (5E)           ±10%   Timing + Flow + Calmness
//   Community Health (5G)  ±15%   Fairness + Wellbeing + Diversity
//
// HARD CAPS (nicht verhandelbar):
//   max Health Boost:     +10%
//   max Health Dämpfung:  -15%
//   Kein Item unter 0.05  (niemand wird unsichtbar)
//   Kein Item über 1.00   (kein künstlicher Boost)
//
// ALLE FUNKTIONEN: pure, testbar, auditierbar.
// ═══════════════════════════════════════════════════════════════

import { HEALTH_THRESHOLDS } from './index';

// ── Globale Caps ────────────────────────────────────────────────
const MAX_HEALTH_BOOST    = +0.10;   //  +10% max
const MAX_HEALTH_DAMPEN   = -0.15;   // -15% max
const FLOOR_SCORE         =  0.05;   // niemand wird komplett unsichtbar
const CEILING_SCORE       =  1.00;

function clamp(v, min = FLOOR_SCORE, max = CEILING_SCORE) {
  return Math.min(max, Math.max(min, v));
}

function clampMod(v) {
  return Math.min(MAX_HEALTH_BOOST, Math.max(MAX_HEALTH_DAMPEN, v));
}

// ── 5H.2.1 — SATURATION MODIFIER ──────────────────────────────
/**
 * Dämpft Scores von übersättigten Creators sanft.
 *
 * "Sanft" bedeutet: max -15%, nie komplett unsichtbar.
 * Ein Creator mit Feed-Share > 10% bekommt einen leichten Abschlag.
 * Das ist keine Strafe — es ist Balance.
 *
 * @param {Object} item          — Feed-Item
 * @param {Map}    saturationMap — creatorId → saturation (0–1)
 * @returns {number}             — Modifier -0.15 bis 0
 */
export function saturationModifier(item, saturationMap = new Map()) {
  const creatorId   = item.user_id || item.creator_id;
  const saturation  = saturationMap.get(creatorId) || 0;

  if (saturation <= 0.20) return 0;  // Unter Schwelle: kein Modifier

  // Lineare Dämpfung: 0.20 → 0, 1.0 → -0.15
  const excess  = (saturation - 0.20) / 0.80;
  const modifier = -(excess * MAX_HEALTH_DAMPEN * -1);  // 0 bis -0.15

  return clampMod(modifier);
}

// ── 5H.2.2 — DIVERSITY MODIFIER ───────────────────────────────
/**
 * Bonus für Items die Diversität im Feed erhöhen.
 *
 * Wenn ein Mood/Cluster im aktuellen Feed unterrepräsentiert ist,
 * bekommen Items aus diesem Cluster einen sanften Bonus.
 *
 * Max +8% — nicht dominant genug um Qualitäts-Ranking zu überschreiben.
 */
export function diversityModifier(item, feedContext = {}) {
  const {
    presentMoods    = new Set(),  // Moods die bereits im Feed sind
    targetDiversity = 4,          // Ziel: min. 4 verschiedene Moods
    presentClusters = new Set(),
  } = feedContext;

  const itemMood = (item.mood || '').toLowerCase();
  if (!itemMood) return 0;

  // Item bringt neuen Mood → Bonus
  if (!presentMoods.has(itemMood)) {
    const diversityGap = Math.max(0, targetDiversity - presentMoods.size);
    const bonus = clampMod(diversityGap * 0.02);  // 0.02 pro fehlendem Mood
    return Math.min(bonus, 0.08);  // hard cap +8%
  }

  return 0;
}

// ── 5H.2.3 — NEWCOMER BOOST ────────────────────────────────────
/**
 * Sanfter Sichtbarkeits-Boost für neue Creators.
 *
 * Neue Creators (< 30 Tage) bekommen bis zu +10% Bonus.
 * Sehr neue Creators (< 7 Tage) bis zu +10% (Maximum).
 * Klingt nach 30 Tagen langsam aus.
 *
 * WICHTIG: Boost basiert auf Neuheit — nicht auf Qualität.
 * Qualitäts-Signale bleiben dominant.
 */
export function newcomerBoost(item) {
  const joinDate = item.creator_joined_at || item.created_at;
  if (!joinDate) return 0;

  const daysOld = (Date.now() - new Date(joinDate).getTime()) / 86400000;

  if (daysOld > 30) return 0;           // Kein Boost mehr nach 30 Tagen
  if (daysOld <= 3)  return MAX_HEALTH_BOOST;  // Frisch: voller +10% Boost
  if (daysOld <= 7)  return 0.08;       // 1. Woche: +8%
  if (daysOld <= 14) return 0.06;       // 2. Woche: +6%
  if (daysOld <= 21) return 0.04;       // 3. Woche: +4%
  return 0.02;                           // 4. Woche: +2% (ausklingend)
}

// ── 5H.2.4 — BRIDGE BOOST ──────────────────────────────────────
/**
 * Bridge-Creators verbinden kreative Welten.
 * Sie bekommen sanfte Sichtbarkeits-Verstärkung.
 *
 * max +8% (etwas weniger als Newcomer — Bridge ist persistenter)
 */
export function bridgeBoost(item) {
  const bridgeScore = item._bridgeScore || 0;

  if (bridgeScore < 0.35) return 0;         // Kein Bridge-Effekt
  if (bridgeScore >= 0.70) return 0.08;     // Major Bridge: +8%
  if (bridgeScore >= 0.50) return 0.05;     // Local Bridge: +5%
  return 0.02;                               // Emerging: +2%
}

// ── 5H.2.5 — ANTI-MONOPOLY MODIFIER ──────────────────────────
/**
 * Reduziert Sichtbarkeit wenn ein Creator bereits sehr dominant ist.
 *
 * Prüft: wie viele Items von diesem Creator sind schon im
 * aktuell gerenderten Feed-Chunk?
 *
 * NICHT: dauerhafter Sichtbarkeits-Entzug.
 * NUR: pro Feed-Session Balancierung.
 *
 * @param {Object} item
 * @param {Map}    feedCountMap  — creatorId → anzahl Items im aktuellen Feed
 * @param {number} feedLength    — Gesamtlänge des Feeds
 */
export function antiMonopolyModifier(item, feedCountMap = new Map(), feedLength = 20) {
  const creatorId = item.user_id || item.creator_id;
  if (!creatorId) return 0;

  const currentCount = feedCountMap.get(creatorId) || 0;
  const currentShare = currentCount / feedLength;

  // Unter Schwelle: kein Modifier
  if (currentShare <= HEALTH_THRESHOLDS.MAX_SINGLE_CREATOR_SHARE) return 0;

  // Über Schwelle: gradueller Abschlag
  const excess   = currentShare - HEALTH_THRESHOLDS.MAX_SINGLE_CREATOR_SHARE;
  const modifier = -(excess * 2);  // 5% über Schwelle → -10% Modifier

  return clampMod(modifier);
}

// ── 5H.2.6 — CALM DISTRIBUTION MODIFIER ───────────────────────
/**
 * Ordnet den Feed für ruhige Discovery um.
 *
 * Im Calm Mode: tiefe Inhalte nach vorne,
 * sehr kurze/oberflächliche Inhalte nach hinten.
 *
 * Max ±5% — subtilster aller Modifier.
 */
export function calmDistributionModifier(item, calmness = 0) {
  if (calmness < 0.40) return 0;  // Nicht im Calm Mode

  const descLength  = (item.description || item.bio || item.caption || '').length;
  const hasDepth    = descLength > 100 || (item.dna_tags?.length || 0) >= 3;
  const isShallow   = item._type === 'story' && descLength < 20;

  if (hasDepth)  return Math.min(calmness * 0.05, 0.05);   // Tiefe bevorzugen
  if (isShallow) return -Math.min(calmness * 0.03, 0.03);  // Oberflächlich dämpfen

  return 0;
}

// ── 5H.2.7 — HEALTH-AWARE SCORE (Master) ──────────────────────
/**
 * Berechnet den finalen Health-adjustierten Score.
 *
 * Transparente Schichten:
 *   baseScore    = Discovery (5C) + Graph (5D) + Context (5E)
 *   healthMod    = Summe aller Health-Modifier (5G/5H)
 *   finalScore   = clamp(baseScore + healthMod, FLOOR, CEILING)
 *
 * GARANTIEN:
 * — healthMod ist immer im Bereich [-0.15, +0.10]
 * — finalScore ist immer im Bereich [0.05, 1.00]
 * — kein Item wird auf 0 gesetzt (niemand unsichtbar)
 * — Modifier sind additiv, nie multiplikativ
 *
 * @param {Object} item
 * @param {number} baseScore       — Score aus 5C + 5D + 5E (0–1)
 * @param {Object} healthContext   — alle Health-Inputs
 * @returns {{ finalScore, healthMod, breakdown }}
 */
export function healthAwareScore(item, baseScore, healthContext = {}) {
  const {
    saturationMap  = new Map(),
    feedContext    = {},
    feedCountMap   = new Map(),
    feedLength     = 20,
    calmness       = 0,
  } = healthContext;

  // Alle Modifier berechnen
  const satMod      = saturationModifier(item, saturationMap);
  const divMod      = diversityModifier(item, feedContext);
  const newMod      = newcomerBoost(item);
  const bridgeMod   = bridgeBoost(item);
  const monoMod     = antiMonopolyModifier(item, feedCountMap, feedLength);
  const calmMod     = calmDistributionModifier(item, calmness);

  // Summe clampen (gesamt max ±15%)
  const rawHealthMod = satMod + divMod + newMod + bridgeMod + monoMod + calmMod;
  const healthMod    = clampMod(rawHealthMod);

  // Finaler Score
  const finalScore   = clamp(baseScore + healthMod);

  return {
    finalScore,
    healthMod: Math.round(healthMod * 1000) / 1000,
    breakdown: {
      baseScore:   Math.round(baseScore  * 1000) / 1000,
      satMod:      Math.round(satMod     * 1000) / 1000,
      divMod:      Math.round(divMod     * 1000) / 1000,
      newMod:      Math.round(newMod     * 1000) / 1000,
      bridgeMod:   Math.round(bridgeMod  * 1000) / 1000,
      monoMod:     Math.round(monoMod    * 1000) / 1000,
      calmMod:     Math.round(calmMod    * 1000) / 1000,
      finalScore:  Math.round(finalScore * 1000) / 1000,
    },
  };
}

// ── 5H.5 — SELF-HEALING BALANCER ──────────────────────────────
/**
 * Erkennt Gesundheitsprobleme und gibt Balancing-Empfehlungen.
 *
 * System "heilt sich selbst" durch angepasste Feed-Parameter.
 * Reagiert langsam (5min Zyklen) — nie aggressiv.
 *
 * @param {Object} healthReport — aus analyzeCommunityHealth()
 * @returns {Object}            — { params, actions, severity }
 */
export function selfHealingBalancer(healthReport) {
  if (!healthReport) return { params: {}, actions: [], severity: 'none' };

  const issues  = healthReport.issues  || [];
  const warnings= healthReport.warnings|| [];
  const actions = [];
  const params  = {
    explorationRatio: 0.20,   // Standard
    maxPerCreator:    2,       // Standard
    bridgeAmplify:    1.0,     // Standard (kein Boost)
    newcomerAmplify:  1.0,     // Standard
    calmnessFactor:   0,       // Standard (kein Calm)
  };

  // Newcomer Starvation → mehr Exploration
  if (issues.includes('newcomer_starvation')) {
    params.explorationRatio = 0.30;  // 30% statt 20%
    params.newcomerAmplify  = 1.5;   // 50% mehr Newcomer-Boost
    actions.push({ action: 'newcomer_boost', reason: 'Newcomer-Integration zu niedrig' });
  }

  // Popularity Runaway → Anti-Monopol verschärfen
  if (issues.includes('popularity_runaway') || issues.includes('high_concentration')) {
    params.maxPerCreator = 1;         // Nur noch 1× pro Creator
    actions.push({ action: 'anti_monopoly', reason: 'Popularity-Konzentration zu hoch' });
  }

  // Bridge Collapse → Bridge-Amplification
  if (issues.includes('insufficient_bridges') || issues.includes('bridges_overloaded')) {
    params.bridgeAmplify = 1.5;
    actions.push({ action: 'bridge_amplify', reason: 'Bridge-Dichte zu niedrig' });
  }

  // Low Diversity → Calm + Exploration
  if (warnings.includes('low_diversity')) {
    params.explorationRatio = 0.25;
    params.calmnessFactor   = 0.3;
    actions.push({ action: 'diversity_inject', reason: 'Kreative Vielfalt zu niedrig' });
  }

  // Calmness Issue
  if (issues.some(i => i.includes('notif') || i.includes('push') || i.includes('velocity'))) {
    params.calmnessFactor = 0.5;
    actions.push({ action: 'calm_mode', reason: 'Plattform zu hektisch' });
  }

  const severity =
    issues.length > 3   ? 'critical' :
    issues.length > 1   ? 'moderate' :
    warnings.length > 2 ? 'mild'     :
                          'none';

  return { params, actions, severity };
}

// ── 5H.6 — CALMNESS + HEALTH MERGE ────────────────────────────
/**
 * Verbindet Context-Calmness (5E) mit Community-Health (5G).
 *
 * Ergibt: master calmness factor der beide Schichten berücksichtigt.
 *
 * @param {number} contextCalmness  — aus calmnessScore() (5E)
 * @param {Object} healthReport     — aus analyzeCommunityHealth() (5G)
 * @returns {number}                — 0–0.70 (master calmness)
 */
export function mergedCalmness(contextCalmness, healthReport) {
  const baseCalm  = contextCalmness || 0;

  // Community Calmness aus Health-Report
  const commCalm  = healthReport?.scores?.calmness || 1.0;
  const commNoise = 1 - commCalm;  // wie viel "noise" auf der Plattform?

  // Wenn Plattform laut ist UND User-Kontext ruhig:
  // → noch ruhigerer Feed (schützend)
  const merged = baseCalm * 0.6 + (1 - commNoise * 0.4) * 0.4;

  return Math.min(0.70, Math.max(0, merged));  // Hard cap: 70%
}
