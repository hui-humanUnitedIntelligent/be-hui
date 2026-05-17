// src/hooks/useContextualDiscovery.js
// HUI — Health-Aware Contextual Discovery — Phase 5H.1
// ═══════════════════════════════════════════════════════════════
//
// VOLLSTÄNDIGER 4-LAYER INTELLIGENCE STACK:
//
//   Discovery (5C)         75%   Trust + Fit + Social + Fresh
//   Human Graph (5D)       10%   Bridge + Cluster + Proximity
//   Context (5E)          ±10%   Timing + Flow + Calmness
//   Community Health (5G) ±15%   Fairness + Wellbeing + Diversity
//                          ↑
//                       Neu in Phase 5H — direkt integriert
//
// HARD CAPS:
//   Context Influence:   max ±10%
//   Health Influence:    max ±15%
//   Floor Score:         0.05   (niemand wird komplett unsichtbar)
//   Ceiling Score:       1.00
//
// TRANSPARENZ-VERSPRECHEN:
//   Jede Scoring-Schicht ist dokumentiert.
//   Kein Item bekommt _score = 0 (kein Shadowban).
//   Self-Healing reagiert langsam und ruhig.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeQuery } from '@/lib/safeQuery';

// Discovery (5C)
import { relevanceScore, diversityGuard, antiRepetition } from '@/lib/discovery/index';
// Graph (5D)
import { communityAffinity, creatorBridgeScore, detectSoftClusters, graphDiscoveryBonus } from '@/lib/graph/index';
// Context (5E)
import {
  contextualRelevance, calmDiscoveryMode, detectCreativeFlow,
  readCurrentContext, overstimulationGuard, SessionContext, calmnessScore,
} from '@/lib/contextual/index';
// Community Health (5G + 5H)
import { diversityBalance, newcomerProtection, SAFETY_GUARDS } from '@/lib/communityHealth/index';
import {
  healthAwareScore, saturationModifier, selfHealingBalancer,
  mergedCalmness, newcomerBoost, bridgeBoost,
} from '@/lib/communityHealth/integration';

const CREATOR_FIELDS = `
  id, display_name, talent, focus_type, dna_tags, bio,
  is_available, is_verified, avatar_url, header_img,
  total_bookings_completed, response_rate, created_at,
  updated_at, mood, location_label, has_talent_profile
`.trim();

const CONTENT_FIELDS = `
  id, user_id, title, description, caption, cover_url,
  media_url, category, type, price, status, created_at,
  updated_at, mood, tags
`.trim();

export function useContextualDiscovery({
  userProfile,
  userFollows,
  activeMood,
  sessionSignals = {},
  healthReport   = null,   // ← aus useCommunityHealth() (optional)
  enabled        = true,
}) {
  const [feed,            setFeed]            = useState([]);
  const [bridges,         setBridges]         = useState([]);
  const [context,         setContext]         = useState(null);
  const [calmMode,        setCalmMode]        = useState(false);
  const [breathingPoints, setBreathingPoints] = useState([]);
  const [warning,         setWarning]         = useState(null);
  const [healthStatus,    setHealthStatus]    = useState(null);
  const mountedRef = useRef(true);

  // Session initialisieren
  useEffect(() => { SessionContext.init(); }, []);

  // Mood in Session schreiben
  useEffect(() => {
    if (activeMood) SessionContext.setMood(activeMood?.key || activeMood);
  }, [activeMood?.key || activeMood]);

  // Kontext bestimmen
  const currentContext = useMemo(() => readCurrentContext(sessionSignals), [
    sessionSignals.isSearching, sessionSignals.isChatOpen,
    sessionSignals.sessionDurationMin, sessionSignals.isBookingOpen,
  ]);

  // Overstimulation Guard
  useEffect(() => {
    const guard = overstimulationGuard(sessionSignals);
    setWarning(guard.suggestion || null);
  }, [sessionSignals.sessionDurationMin, sessionSignals.feedItemsConsumed]);

  // Self-Healing Params aus Health-Report ableiten
  const healingParams = useMemo(() => {
    if (!healthReport) return { explorationRatio: 0.20, maxPerCreator: 2, bridgeAmplify: 1.0, newcomerAmplify: 1.0 };
    return selfHealingBalancer(healthReport).params;
  }, [healthReport?.overallScore, healthReport?.issues?.join(',')]);

  // Merged Calmness (5E Context + 5G Community)
  const masterCalmness = useMemo(() => {
    const ctxCalm = calmnessScore();
    return mergedCalmness(ctxCalm, healthReport);
  }, [healthReport?.scores?.calmness]);

  const loadFeed = useCallback(async () => {
    if (!enabled) return;

    try {
      // ── 1. Daten laden ─────────────────────────────────────────
      const [worksRes, expRes, storyRes, creatorsRes] = await Promise.all([
        safeQuery(supabase.from('works')
          .select(`${CONTENT_FIELDS}, profiles:user_id(${CREATOR_FIELDS})`)
          .eq('status', 'published').order('updated_at', { ascending: false }).limit(22)),
        safeQuery(supabase.from('experiences')
          .select(`${CONTENT_FIELDS}, profiles:user_id(${CREATOR_FIELDS})`)
          .eq('status', 'published').order('updated_at', { ascending: false }).limit(10)),
        safeQuery(supabase.from('stories')
          .select(`id, user_id, caption, tags, created_at, updated_at, profiles:user_id(${CREATOR_FIELDS})`)
          .order('created_at', { ascending: false }).limit(8)),
        safeQuery(supabase.from('profiles')
          .select(CREATOR_FIELDS).eq('has_talent_profile', true)
          .limit(healingParams.explorationRatio > 0.25 ? 60 : 40)),
      ]);

      if (!mountedRef.current) return;

      const allCreators = creatorsRes.data || [];

      // ── 2. Graph-Anreicherung ─────────────────────────────────
      const clusterMap     = detectSoftClusters(allCreators);
      const userClusters   = userProfile ? communityAffinity(userProfile) : {};

      const creatorsEnriched = allCreators.map(c => {
        const clusters = clusterMap.get(c.id) || {};
        const { bridgeScore, bridgeType } = creatorBridgeScore(c, [], clusters);
        return { ...c, _bridgeScore: bridgeScore, _bridgeType: bridgeType, _clusters: clusters };
      });
      const bridgeMap = new Map(creatorsEnriched.map(c => [c.id, c]));

      // ── 3. Normalisieren ───────────────────────────────────────
      const normalize = (items, type) => (items || []).filter(Boolean).map(item => ({
        ...item, _type: type, type,
        ...(item.profiles || {}),
        creator_id: item.user_id,
        _bridgeScore: bridgeMap.get(item.user_id)?._bridgeScore || 0,
        _clusters:   bridgeMap.get(item.user_id)?._clusters   || {},
      }));

      const allContent = [
        ...normalize(worksRes.data,  'werk'),
        ...normalize(expRes.data,    'experience'),
        ...normalize(storyRes.data,  'story'),
      ];

      // ── 4. Saturation Map aufbauen ────────────────────────────
      // Vereinfacht: Creators die sehr viele Works haben = höheres Exposure-Risiko
      const worksByCreator = new Map();
      for (const item of allContent) {
        const id = item.user_id;
        worksByCreator.set(id, (worksByCreator.get(id) || 0) + 1);
      }
      const totalContent = allContent.length || 1;
      const saturationMap = new Map(
        [...worksByCreator.entries()].map(([id, count]) => [id, count / totalContent])
      );

      // ── 5. Feed-Kontext aufbauen ───────────────────────────────
      const flowMode   = currentContext.flow.mode;
      const userCtx    = { userClusterMemberships: userClusters, userConnections: userFollows || new Set() };
      const presentMoods    = new Set();
      const feedCountMap    = new Map();
      const feedContext     = { presentMoods, targetDiversity: 4 };

      // ── 6. VIERSCHICHTIGES SCORING ────────────────────────────
      const scored = allContent.map(item => {

        // Schicht 1: Discovery (5C) — 75%
        const discScore = relevanceScore(item, {
          mood: activeMood?.key || activeMood,
          userFollows,
          userProfile,
        });

        // Schicht 2: Graph (5D) — 10%
        const graphBonus = graphDiscoveryBonus(item, userCtx);

        // Schicht 3: Context (5E) — max ±10%
        const ctxMod = contextualRelevance(item, {
          mode: flowMode,
          userClusters,
          activeMood: activeMood?.key || activeMood,
        });

        // Basis-Score (ohne Health)
        const baseScore = discScore * 0.75 + graphBonus * 0.10 + ctxMod;

        // Schicht 4: Community Health (5G/5H) — max ±15%
        const { finalScore, healthMod, breakdown } = healthAwareScore(item, baseScore, {
          saturationMap,
          feedContext: { presentMoods, targetDiversity: 4 },
          feedCountMap,
          feedLength: allContent.length,
          calmness:   masterCalmness,
        });

        // Feed-Tracking für Anti-Monopol
        const creatorId = item.user_id;
        if (creatorId) {
          feedCountMap.set(creatorId, (feedCountMap.get(creatorId) || 0) + 1);
        }
        if (item.mood) presentMoods.add(item.mood.toLowerCase());

        // Minimale Zufälligkeit (±1%) gegen statische Reihenfolge
        const jitter = (Math.random() - 0.5) * 0.02;

        return {
          ...item,
          _score:     Math.min(1, Math.max(0.05, finalScore + jitter)),
          _healthMod: healthMod,
          _breakdown: breakdown,
        };
      });

      // ── 7. Sortieren ──────────────────────────────────────────
      scored.sort((a, b) => b._score - a._score);

      // ── 8. Diversity Guard + Anti-Repetition ──────────────────
      const diversified = diversityGuard(scored, {
        maxPerCreator:    healingParams.maxPerCreator,
        explorationRatio: healingParams.explorationRatio,
      });
      const deduped = antiRepetition(diversified, 'hui_ctx_seen');

      // ── 9. Safety Guards prüfen ───────────────────────────────
      const guardsPass = {
        creatorShare: SAFETY_GUARDS.maxCreatorFeedShare(deduped),
        diversity:    SAFETY_GUARDS.diversityMinimum(deduped),
        newcomers:    SAFETY_GUARDS.newcomerFloor(deduped),
        antiRunaway:  SAFETY_GUARDS.antiRunaway(deduped),
      };

      // ── 10. Calm Discovery Mode (5E + 5H merged) ─────────────
      const throttle = currentContext.overstimulation?.throttle || 1.0;
      const maxItems = Math.round((masterCalmness > 0.45 ? 12 : 18) * throttle);

      const { items: finalItems, breathingPoints: bpoints, isCalmMode } =
        calmDiscoveryMode(deduped, { maxItems, breatheAt: [3, 7, 11] });

      // ── 11. Bridge-Creators ───────────────────────────────────
      const topBridges = creatorsEnriched
        .filter(c => c._bridgeScore > 0.38)
        .sort((a, b) => b._bridgeScore - a._bridgeScore)
        .slice(0, 5);

      // ── 12. Health-Status aggregieren ─────────────────────────
      const feedDiversity = diversityBalance(finalItems);
      const feedNewcomer  = newcomerProtection(finalItems, allCreators.length);

      if (mountedRef.current) {
        setFeed(finalItems);
        setBridges(topBridges);
        setContext(currentContext);
        setCalmMode(isCalmMode);
        setBreathingPoints(bpoints);
        setHealthStatus({
          guardsPass,
          diversity: feedDiversity.score,
          newcomerRatio: feedNewcomer.currentRatio,
          healingActive: selfHealingBalancer(healthReport).severity !== 'none',
          masterCalmness: Math.round(masterCalmness * 100) / 100,
          itemCount: finalItems.length,
        });
      }
    } catch (err) {
      console.error('[ContextualDiscovery]', err?.message);
    }
  }, [
    userProfile?.id,
    activeMood?.key || activeMood,
    currentContext.flow.mode,
    healingParams.explorationRatio,
    masterCalmness,
    enabled,
  ]);

  useEffect(() => {
    mountedRef.current = true;
    setFeed([]);
    loadFeed();
    return () => { mountedRef.current = false; };
  }, [loadFeed]);

  return {
    feed,
    bridges,
    context,
    calmMode,
    breathingPoints,
    warning,          // Overstimulation-Hinweis
    healthStatus,     // Gesundheits-Status des aktuellen Feeds
    reload: loadFeed,
  };
}
