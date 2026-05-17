// src/hooks/useContextualDiscovery.js
// HUI — Contextual Discovery Hook — Phase 5E
// ═══════════════════════════════════════════════════════════════
//
// ZWECK:
// Das vollständige Intelligence Stack für Discovery:
//   5C — Discovery Engine (relevanceScore, rankFeed)
//   5D — Graph Engine (bridgeScore, communityAffinity)
//   5E — Context Engine (timing, flow, calmness)
//
// GARANTIEN:
// — Context-Einfluss max. 10% auf Ranking
// — Kein Tracking, kein persistentes Profiling
// — Calm Mode bei Abend/langer Session
// — Overstimulation Guard bei sehr langen Sessions
// — Alle Berechnungen client-side
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
  contextualRelevance,
  calmDiscoveryMode,
  detectCreativeFlow,
  readCurrentContext,
  overstimulationGuard,
  SessionContext,
} from '@/lib/contextual/index';

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
  enabled = true,
}) {
  const [feed,          setFeed]          = useState([]);
  const [bridges,       setBridges]       = useState([]);
  const [context,       setContext]       = useState(null);
  const [calmMode,      setCalmMode]      = useState(false);
  const [breathingPoints, setBreathingPoints] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [warning,       setWarning]       = useState(null);   // Overstimulation-Hinweis
  const mountedRef = useRef(true);

  // Session initialisieren
  useEffect(() => { SessionContext.init(); }, []);

  // Mood in Session schreiben wenn gewählt
  useEffect(() => {
    if (activeMood) SessionContext.setMood(activeMood?.key || activeMood);
  }, [activeMood?.key || activeMood]);

  // Aktuellen Kontext bestimmen (memoized, ändert sich mit sessionSignals)
  const currentContext = useMemo(() => {
    return readCurrentContext(sessionSignals);
  }, [
    sessionSignals.isSearching,
    sessionSignals.isChatOpen,
    sessionSignals.sessionDurationMin,
    sessionSignals.isBookingOpen,
  ]);

  // Overstimulation prüfen
  useEffect(() => {
    const guard = overstimulationGuard(sessionSignals);
    if (guard.suggestion) setWarning(guard.suggestion);
    else setWarning(null);
  }, [sessionSignals.sessionDurationMin, sessionSignals.feedItemsConsumed]);

  const loadContextualFeed = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);

    try {
      // 1. Content + Creators parallel laden
      const [worksRes, expRes, storyRes, creatorsRes] = await Promise.all([
        safeQuery(
          supabase.from('works')
            .select(`${CONTENT_FIELDS}, profiles:user_id(${CREATOR_FIELDS})`)
            .eq('status', 'published')
            .order('updated_at', { ascending: false })
            .limit(20)
        ),
        safeQuery(
          supabase.from('experiences')
            .select(`${CONTENT_FIELDS}, profiles:user_id(${CREATOR_FIELDS})`)
            .eq('status', 'published')
            .order('updated_at', { ascending: false })
            .limit(10)
        ),
        safeQuery(
          supabase.from('stories')
            .select(`id, user_id, caption, tags, created_at, updated_at, profiles:user_id(${CREATOR_FIELDS})`)
            .order('created_at', { ascending: false })
            .limit(8)
        ),
        safeQuery(
          supabase.from('profiles')
            .select(CREATOR_FIELDS)
            .eq('has_talent_profile', true)
            .limit(40)
        ),
      ]);

      if (!mountedRef.current) return;

      // 2. Normalisieren
      const normalize = (items, type) => (items || []).filter(Boolean).map(item => ({
        ...item,
        _type: type,
        type,
        ...(item.profiles || {}),
        creator_id: item.user_id,
      }));

      const allContent = [
        ...normalize(worksRes.data,  'werk'),
        ...normalize(expRes.data,    'experience'),
        ...normalize(storyRes.data,  'story'),
      ];

      const allCreators = creatorsRes.data || [];

      // 3. Soft Clusters + Bridge Scores
      const clusterMap = detectSoftClusters(allCreators);
      const userClusters = userProfile ? communityAffinity(userProfile) : {};

      const creatorsEnriched = allCreators.map(c => {
        const clusters = clusterMap.get(c.id) || {};
        const { bridgeScore, bridgeType } = creatorBridgeScore(c, [], clusters);
        return { ...c, _bridgeScore: bridgeScore, _bridgeType: bridgeType, _clusters: clusters };
      });

      // Bridge-Creator-Map für schnellen Lookup
      const bridgeMap = new Map(creatorsEnriched.map(c => [c.id, c]));

      // 4. Content mit Creator-Daten anreichern
      const enrichedContent = allContent.map(item => {
        const creator = bridgeMap.get(item.user_id) || item;
        return { ...item, _bridgeScore: creator._bridgeScore || 0, _clusters: creator._clusters || {} };
      });

      // 5. Dreistufiges Scoring
      const flowMode = currentContext.flow.mode;
      const userContext = { userClusterMemberships: userClusters, userConnections: userFollows || new Set() };

      const scored = enrichedContent.map(item => {
        // a) Discovery Score (5C) — 80%
        const discScore  = relevanceScore(item, {
          mood: activeMood?.key || activeMood,
          userFollows,
          userProfile,
        });

        // b) Graph Bonus (5D) — 10%
        const graphBonus = graphDiscoveryBonus(item, userContext);

        // c) Context Modifier (5E) — max ±10%
        const ctxMod = contextualRelevance(item, {
          mode: flowMode,
          userClusters,
          activeMood: activeMood?.key || activeMood,
        });

        const totalScore = discScore * 0.80 + graphBonus * 0.10 + ctxMod;

        // Minimale Zufälligkeit (±1.5%) gegen statische Reihenfolge
        const jitter = (Math.random() - 0.5) * 0.03;

        return { ...item, _score: Math.min(1, Math.max(0, totalScore + jitter)) };
      });

      // 6. Sortieren
      scored.sort((a, b) => b._score - a._score);

      // 7. Diversity Guard
      const diversified = diversityGuard(scored, { maxPerCreator: 2, explorationRatio: 0.20 });

      // 8. Anti-Repetition
      const deduped = antiRepetition(diversified, 'hui_ctx_seen');

      // 9. Calm Mode anwenden
      const { items: finalItems, breathingPoints: bpoints, isCalmMode } =
        calmDiscoveryMode(deduped, {
          maxItems:  currentContext.overstimulation.shouldThrottle ? 10 : 16,
          breatheAt: [3, 7, 11],
        });

      // 10. Bridge-Creators
      const topBridges = creatorsEnriched
        .filter(c => c._bridgeScore > 0.40)
        .sort((a, b) => b._bridgeScore - a._bridgeScore)
        .slice(0, 5);

      if (mountedRef.current) {
        setFeed(finalItems);
        setBridges(topBridges);
        setContext(currentContext);
        setCalmMode(isCalmMode);
        setBreathingPoints(bpoints);
      }
    } catch (err) {
      console.error('[ContextualDiscovery]', err?.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [userProfile?.id, activeMood?.key || activeMood, currentContext.flow.mode, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    loadContextualFeed();
    return () => { mountedRef.current = false; };
  }, [loadContextualFeed]);

  return {
    feed,
    bridges,
    context,
    calmMode,
    breathingPoints,
    warning,      // Overstimulation-Hinweis (oder null)
    loading,
    reload: loadContextualFeed,
  };
}
