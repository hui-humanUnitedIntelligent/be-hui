// src/lib/pipeline/index.js
// HUI — Discovery Pipeline V1 — Phase 6A.2
// ═══════════════════════════════════════════════════════════════
//
// PROBLEM GELÖST:
// Discovery war ein monolithischer useCallback.
// 8 Berechnungsschritte, untrennbar, schwer zu debuggen.
//
// LÖSUNG:
// Stage-basierte Pipeline.
// Jede Stage: pure, einzeln testbar, auditierbar.
//
// STAGES:
//   1. candidateCollection   — Input normalisieren
//   2. trustFilter           — Qualitäts-Mindestmaß
//   3. graphEnrichment       — Bridge/Cluster-Daten
//   4. contextEnrichment     — Timing/Flow/Mood
//   5. healthAdjustment      — Community Health Modifier
//   6. diversityPass         — Diversity Guard + Anti-Monopol
//   7. calmnessPass          — Feed reduzieren + Atemräume
//   8. finalRanking          — Sort + Jitter + Safety Guards
//
// USAGE:
//   const result = await runDiscoveryPipeline(rawItems, context);
//   result.feed / result.bridges / result.audit
// ═══════════════════════════════════════════════════════════════

import { relevanceScore } from '@/lib/discovery/index';
import { graphDiscoveryBonus, communityAffinity, creatorBridgeScore } from '@/lib/graph/index';
import { contextualRelevance, calmnessScore } from '@/lib/contextual/index';
import { healthAwareScore, mergedCalmness, selfHealingBalancer } from '@/lib/communityHealth/integration';
import { diversityBalance, newcomerProtection, SAFETY_GUARDS } from '@/lib/communityHealth/index';

// ── Pipeline Context ───────────────────────────────────────────

/**
 * Erstellt einen vollständigen Pipeline-Context aus User-Daten.
 * Wird einmal pro Feed-Load berechnet, dann wiederverwendet.
 */
export function buildPipelineContext({
  userProfile,
  userFollows   = new Set(),
  activeMood,
  sessionSignals = {},
  healthReport   = null,
  clusterMap     = new Map(),
}) {
  const userClusters  = userProfile ? communityAffinity(userProfile) : {};
  const moodKey       = activeMood?.key || activeMood || null;
  const ctxCalmness   = calmnessScore();
  const masterCalm    = mergedCalmness(ctxCalmness, healthReport);
  const flowMode      = sessionSignals.isSearching   ? 'focus'
                      : sessionSignals.isChatOpen     ? 'collaborate'
                      : sessionSignals.isBookingOpen  ? 'collaborate'
                      : masterCalm > 0.45             ? 'calm'
                      : 'explore';

  const healingParams = healthReport
    ? selfHealingBalancer(healthReport).params
    : { explorationRatio: 0.20, maxPerCreator: 2, bridgeAmplify: 1.0, newcomerAmplify: 1.0 };

  return {
    userProfile,
    userFollows,
    userClusters,
    moodKey,
    flowMode,
    masterCalm,
    healingParams,
    healthReport,
    clusterMap,
    sessionSignals,
    // Mutable state pro Pipeline-Run (wird in den Stages befüllt)
    _feedCountMap:   new Map(),
    _presentMoods:   new Set(),
    _saturationMap:  new Map(),
  };
}

// ── STAGE 1: Candidate Collection ─────────────────────────────
/**
 * Normalisiert rohe Supabase-Daten in ein einheitliches Format.
 * Alle nachfolgenden Stages erwarten dieses Format.
 */
export function stage1_candidateCollection(rawData) {
  const { works = [], experiences = [], stories = [], creators = [] } = rawData;

  // Creator-Map für schnellen Lookup
  const creatorMap = new Map(creators.map(c => [c.id, c]));

  const normalize = (items, type) => items.filter(Boolean).map(item => ({
    // Basis-Felder
    ...item,
    _type:        type,
    type,
    creator_id:   item.user_id,
    // Creator-Daten inline (für Scoring)
    ...((item.profiles || creatorMap.get(item.user_id)) || {}),
    // Pipeline-Tracking
    _stageScores: {},
    _pipelineId:  `${type}_${item.id}`,
  }));

  return [
    ...normalize(works,       'werk'),
    ...normalize(experiences,  'experience'),
    ...normalize(stories,      'story'),
  ];
}

// ── STAGE 2: Trust Filter ──────────────────────────────────────
/**
 * Entfernt Items die Mindest-Qualitätsschwellen nicht erfüllen.
 * Sehr konservativ — nur offensichtlich ungeeignete Items.
 */
export function stage2_trustFilter(items, context) {
  return items.filter(item => {
    // Pflicht: muss eine ID haben
    if (!item.id) return false;
    // Works/Experiences: müssen published sein
    if ((item._type === 'werk' || item._type === 'experience') &&
        item.status && item.status !== 'published') return false;
    // Kein gelöschter Creator
    if (item.is_deleted) return false;
    return true;
  });
}

// ── STAGE 3: Graph Enrichment ──────────────────────────────────
/**
 * Fügt Bridge-Score und Cluster-Daten hinzu.
 * Nutzt vorberechnete clusterMap wenn verfügbar.
 */
export function stage3_graphEnrichment(items, context) {
  const { userClusters, userFollows, clusterMap } = context;

  return items.map(item => {
    const creatorId = item.user_id || item.creator_id;

    // Aus clusterMap wenn vorhanden (vermeidet re-Berechnung)
    const clusters = clusterMap.get(creatorId) || {};

    // Bridge-Score (vereinfacht wenn schon berechnet)
    const bridgeScore = item._bridgeScore ||
      (() => {
        const { bridgeScore: bs } = creatorBridgeScore(item, [], clusters);
        return bs;
      })();

    // Graph Discovery Bonus
    const graphBonus = graphDiscoveryBonus(item, {
      userClusterMemberships: userClusters,
      userConnections:        userFollows,
    });

    item._stageScores.graph = graphBonus;
    return { ...item, _bridgeScore: bridgeScore, _clusters: clusters, _graphBonus: graphBonus };
  });
}

// ── STAGE 4: Context Enrichment ────────────────────────────────
/**
 * Fügt Context-Modifier hinzu (Timing, Flow, Mood).
 */
export function stage4_contextEnrichment(items, context) {
  const { flowMode, moodKey, userClusters } = context;

  return items.map(item => {
    const ctxMod = contextualRelevance(item, {
      mode:         flowMode,
      userClusters,
      activeMood:   moodKey,
    });
    item._stageScores.context = ctxMod;
    return { ...item, _ctxMod: ctxMod };
  });
}

// ── STAGE 5: Community Health Adjustment ─────────────────────
/**
 * Fügt Health-Modifier hinzu.
 * Nutzt _saturationMap aus Context (wird hier befüllt).
 */
export function stage5_healthAdjustment(items, context) {
  const { userClusters, masterCalm, _saturationMap, _presentMoods, _feedCountMap } = context;

  // Saturation Map aus Item-Verteilung aufbauen
  const worksByCreator = new Map();
  for (const item of items) {
    const id = item.user_id;
    worksByCreator.set(id, (worksByCreator.get(id) || 0) + 1);
  }
  const total = items.length || 1;
  for (const [id, count] of worksByCreator.entries()) {
    _saturationMap.set(id, count / total);
  }

  return items.map(item => {
    // Base Score: Discovery (75%) + Graph (10%) + Context (±10%)
    const discScore = relevanceScore(item, {
      mood: context.moodKey,
      userFollows: context.userFollows,
      userProfile: context.userProfile,
    });

    const baseScore = discScore * 0.75 +
                      (item._graphBonus || 0) * 0.10 +
                      (item._ctxMod     || 0);

    const { finalScore, healthMod, breakdown } = healthAwareScore(item, baseScore, {
      saturationMap: _saturationMap,
      feedContext:   { presentMoods: _presentMoods, targetDiversity: 4 },
      feedCountMap:  _feedCountMap,
      feedLength:    items.length,
      calmness:      masterCalm,
    });

    // Feed-Tracking aktualisieren
    const creatorId = item.user_id;
    if (creatorId) _feedCountMap.set(creatorId, (_feedCountMap.get(creatorId) || 0) + 1);
    if (item.mood) _presentMoods.add(item.mood.toLowerCase());

    item._stageScores.health    = healthMod;
    item._stageScores.discovery = discScore;
    item._stageScores.base      = baseScore;

    return { ...item, _score: finalScore, _healthMod: healthMod, _breakdown: breakdown };
  });
}

// ── STAGE 6: Diversity Pass ────────────────────────────────────
/**
 * Diversity Guard + Anti-Repetition.
 */
export function stage6_diversityPass(items, context) {
  const { healingParams } = context;

  // Sort nach Score
  const sorted = [...items].sort((a, b) => b._score - a._score);

  // maxPerCreator aus Self-Healing Params
  const maxPerCreator = healingParams.maxPerCreator || 2;
  const explorationRatio = healingParams.explorationRatio || 0.20;

  const creatorCount  = {};
  const mainFeed      = [];
  const explorations  = [];

  const daysSince = (d) => d ? (Date.now() - new Date(d).getTime()) / 86400000 : 999;

  for (const item of sorted) {
    const creatorId   = item.user_id || item.creator_id;
    const count       = creatorCount[creatorId] || 0;
    const isNewcomer  = daysSince(item.creator_joined_at || item.created_at) < 30;

    if (isNewcomer && explorations.length < Math.ceil(sorted.length * explorationRatio)) {
      explorations.push(item);
      continue;
    }

    if (count < maxPerCreator) {
      creatorCount[creatorId] = count + 1;
      mainFeed.push(item);
    }
  }

  // Explorations einstreuen
  const result = [...mainFeed];
  const step   = Math.max(3, Math.floor(result.length / Math.max(explorations.length, 1)));
  explorations.forEach((item, i) => {
    const at = Math.min((i + 1) * step, result.length);
    result.splice(at, 0, item);
  });

  return result;
}

// ── STAGE 7: Calmness Pass ─────────────────────────────────────
/**
 * Feed-Größe + Atemräume basierend auf Calmness.
 */
export function stage7_calmnessPass(items, context) {
  const { masterCalm, sessionSignals = {} } = context;
  const throttle = sessionSignals.throttle || 1.0;

  const isCalmMode = masterCalm > 0.45;
  const maxItems   = Math.round((isCalmMode ? 12 : 18) * throttle);
  const breatheAt  = [3, 7, 11];

  let calmItems = items;
  if (isCalmMode) {
    calmItems = items
      .filter(i => {
        const desc = (i.description || i.bio || i.caption || '');
        return desc.length > 20 || (i._bridgeScore || 0) > 0 || i.is_verified;
      })
      .slice(0, maxItems);
  } else {
    calmItems = items.slice(0, maxItems);
  }

  const breathingPoints = breatheAt.filter(p => p < calmItems.length);
  return { items: calmItems, breathingPoints, isCalmMode };
}

// ── STAGE 8: Final Ranking ─────────────────────────────────────
/**
 * Letzter Pass: Jitter, Safety Guards, Bridge-Extraktion.
 */
export function stage8_finalRanking(items, context) {
  // Minimale Zufälligkeit (±1%) gegen statische Reihenfolge
  const withJitter = items.map(item => ({
    ...item,
    _score: Math.min(1, Math.max(0.05, item._score + (Math.random() - 0.5) * 0.02)),
  }));

  // Safety Guards prüfen
  const guardsPass = {
    creatorShare: SAFETY_GUARDS.maxCreatorFeedShare(withJitter),
    diversity:    SAFETY_GUARDS.diversityMinimum(withJitter),
    newcomers:    SAFETY_GUARDS.newcomerFloor(withJitter),
    antiRunaway:  SAFETY_GUARDS.antiRunaway(withJitter),
  };

  return { items: withJitter, guardsPass };
}

// ── MASTER: runDiscoveryPipeline ───────────────────────────────
/**
 * Führt alle 8 Stages sequentiell aus.
 * Gibt vollständigen Audit-Trail zurück.
 *
 * @param {Object} rawData   — { works, experiences, stories, creators }
 * @param {Object} context   — aus buildPipelineContext()
 * @returns {Object}         — { feed, bridges, breathingPoints, isCalmMode, guardsPass, audit }
 */
export function runDiscoveryPipeline(rawData, context) {
  const t0 = performance.now();
  const audit = { stages: {}, timing: {} };

  // Stage 1
  let items = stage1_candidateCollection(rawData);
  audit.stages.s1_candidates = items.length;

  // Stage 2
  items = stage2_trustFilter(items, context);
  audit.stages.s2_afterTrust = items.length;

  // Stage 3
  items = stage3_graphEnrichment(items, context);
  audit.timing.s3_graph = performance.now() - t0;

  // Stage 4
  items = stage4_contextEnrichment(items, context);
  audit.timing.s4_context = performance.now() - t0;

  // Stage 5
  items = stage5_healthAdjustment(items, context);
  audit.timing.s5_health = performance.now() - t0;

  // Stage 6
  items = stage6_diversityPass(items, context);
  audit.stages.s6_afterDiversity = items.length;

  // Stage 7
  const { items: calmItems, breathingPoints, isCalmMode } = stage7_calmnessPass(items, context);
  audit.stages.s7_afterCalm = calmItems.length;
  audit.meta = { isCalmMode, breathingPoints };

  // Stage 8
  const { items: finalItems, guardsPass } = stage8_finalRanking(calmItems, context);
  audit.stages.s8_final = finalItems.length;
  audit.guardsPass = guardsPass;

  // Bridge-Creators aus angereicherten Items
  const bridges = finalItems
    .filter(i => (i._bridgeScore || 0) > 0.38)
    .sort((a, b) => (b._bridgeScore || 0) - (a._bridgeScore || 0))
    .slice(0, 5);

  audit.timing.total = Math.round(performance.now() - t0);

  return {
    feed:            finalItems,
    bridges,
    breathingPoints,
    isCalmMode,
    guardsPass,
    audit,  // Vollständiger Audit-Trail (für Debugging)
  };
}
