// src/hooks/useCommunityHealth.js
// HUI — Community Health Hook (CACHED) — Phase 6A.3
// ═══════════════════════════════════════════════════════════════
//
// P0 FIX: 2.300 rows/load → Cache-first.
// Stale-While-Revalidate: 5min TTL, im BG refreshen.
// Reduziert Query-Last um ~95% bei normaler Nutzung.
//
// Cache-Schlüssel: 'community_health:global'
// TTL: 300s (5min)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeQuery } from '@/lib/safeQuery';
import { cacheOrFetch, cacheGet, cacheSet, getCacheStats } from '@/lib/cache/index';
import {
  analyzeCommunityHealth,
  SAFETY_GUARDS,
} from '@/lib/communityHealth/index';
import { detectSoftClusters, creatorBridgeScore } from '@/lib/graph/index';

const CREATOR_FIELDS = `
  id, display_name, talent, focus_type, dna_tags, is_available,
  is_verified, total_bookings_completed, response_rate,
  created_at, updated_at, mood, location_label
`.trim();

const CACHE_NS  = 'community_health';
const CACHE_KEY = 'global';

// ── Kern-Fetch-Funktion (wird gecacht) ─────────────────────────
async function fetchCommunityHealthData() {
  const [creatorsRes, bookingsRes, recsRes, followsRes, worksRes] = await Promise.all([
    safeQuery(supabase.from('profiles').select(CREATOR_FIELDS)
      .eq('has_talent_profile', true).limit(150)),  // P0: 200 → 150
    safeQuery(supabase.from('bookings').select('id, status, created_at, wirker_user_id')
      .limit(300)),                                   // P0: 500 → 300
    safeQuery(supabase.from('recommendations').select('id, recipient_id, created_at')
      .limit(200)),                                   // P0: 300 → 200
    safeQuery(supabase.from('follows').select('follower_id, followed_id')
      .limit(500)),                                   // P0: 1000 → 500 (ohne created_at)
    safeQuery(supabase.from('works').select('id, user_id, status, created_at')
      .eq('status', 'published').limit(200)),         // P0: 300 → 200
  ]);

  const creators     = creatorsRes.data  || [];
  const bookings     = bookingsRes.data  || [];
  const recs         = recsRes.data      || [];
  const follows      = followsRes.data   || [];
  const works        = worksRes.data     || [];

  // Graph enrichment
  const clusterMap = detectSoftClusters(creators);
  const creatorsEnriched = creators.map(c => {
    const clusters = clusterMap.get(c.id) || {};
    const { bridgeScore, bridgeType, bridgeDimensions } =
      creatorBridgeScore(c, [], clusters);
    return { ...c, _bridgeScore: bridgeScore, _bridgeType: bridgeType,
             _bridgeDimensions: bridgeDimensions, _clusters: clusters };
  });

  // Exposure Data
  const worksByCreator = {};
  for (const w of works) worksByCreator[w.user_id] = (worksByCreator[w.user_id] || 0) + 1;
  const totalWorks = works.length || 1;
  const exposureData = creatorsEnriched.map(c => ({
    creatorId:       c.id,
    feedImpressions: (worksByCreator[c.id] || 0) / totalWorks,
    joinedDaysAgo:   c.created_at
      ? (Date.now() - new Date(c.created_at).getTime()) / 86400000 : 999,
  }));

  // Network Edges
  const networkEdges = follows.map(f => ({ from: f.follower_id, to: f.followed_id }));

  // Metrics
  const completedBookings  = bookings.filter(b => b.status === 'completed').length;
  const bookingsWithRec    = recs.filter(r =>
    bookings.some(b => b.wirker_user_id === r.recipient_id && b.status === 'completed')
  ).length;
  const followSet     = new Set(follows.map(f => `${f.follower_id}:${f.followed_id}`));
  const mutualFollows = follows.filter(f =>
    followSet.has(`${f.followed_id}:${f.follower_id}`)
  ).length / 2;

  const result = analyzeCommunityHealth({
    creators:        creatorsEnriched,
    feedItems:       works.map(w => ({ ...w, _type: 'werk' })),
    networkEdges,
    exposureData,
    platformMetrics: {
      totalBookings: bookings.length, bookingsWithRec,
      totalCollaborations: 0, repeatCollaborations: 0,
      totalFollows: follows.length, mutualFollows: Math.round(mutualFollows),
      totalChats: 0, chatsLeadingToBooking: 0,
    },
    platformSignals: {
      avgNotifsPerUserPerDay: 1.2, avgFeedItemsPerHour: 15,
      activePushCampaigns: 0, avgSessionPushes: 1,
    },
  });

  const feedSample = works.slice(0, 30).map(w => ({ ...w, _type: 'werk' }));
  result.safetyGuards = {
    maxCreatorFeedShare: SAFETY_GUARDS.maxCreatorFeedShare(feedSample),
    diversityMinimum:    SAFETY_GUARDS.diversityMinimum(feedSample),
    newcomerFloor:       SAFETY_GUARDS.newcomerFloor(feedSample),
    antiRunaway:         SAFETY_GUARDS.antiRunaway(feedSample),
  };

  result.topBridges = creatorsEnriched
    .filter(c => c._bridgeScore > 0.35)
    .sort((a, b) => b._bridgeScore - a._bridgeScore)
    .slice(0, 6)
    .map(c => ({ id: c.id, display_name: c.display_name,
                 bridgeScore: c._bridgeScore, bridgeType: c._bridgeType }));

  // Metadaten für Audit
  result._meta = {
    rowsLoaded: creators.length + bookings.length + recs.length + follows.length + works.length,
    computedAt: new Date().toISOString(),
    source: 'fetch',
  };

  return result;
}

// ── Hook ────────────────────────────────────────────────────────
export function useCommunityHealth({ enabled = true, refreshInterval = 0 } = {}) {
  const [health,      setHealth]      = useState(() => {
    // Initial: aus L1-Cache wenn verfügbar (sync)
    const cached = cacheGet(CACHE_NS, CACHE_KEY);
    return cached?.data || null;
  });
  const [loading,     setLoading]     = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const mountedRef = useRef(true);

  const analyze = useCallback(async (force = false) => {
    if (!enabled) return;

    // Nicht mehrfach parallel laden
    if (loading) return;

    setLoading(true);
    try {
      const { data, stale } = await cacheOrFetch(
        CACHE_NS,
        CACHE_KEY,
        force ? fetchCommunityHealthData : fetchCommunityHealthData,
        { ttl: 300_000 }  // 5min TTL
      );

      if (force || !health) {
        // Force-Refresh: auch gecachten ersetzen
        if (force) {
          const fresh = await fetchCommunityHealthData();
          cacheSet(CACHE_NS, CACHE_KEY, fresh, 300_000);
          if (mountedRef.current) {
            setHealth(fresh);
            setLastUpdated(fresh?._meta?.computedAt || new Date().toISOString());
          }
          return;
        }
      }

      if (data && mountedRef.current) {
        setHealth(data);
        setLastUpdated(data?._meta?.computedAt || new Date().toISOString());
      }
    } catch (err) {
      console.error('[CommunityHealth]', err?.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [enabled, loading]);

  useEffect(() => {
    mountedRef.current = true;
    analyze();
    if (refreshInterval > 0) {
      const iv = setInterval(() => analyze(), refreshInterval);
      return () => { mountedRef.current = false; clearInterval(iv); };
    }
    return () => { mountedRef.current = false; };
  }, []);  // Nur einmal beim Mount

  return {
    health,
    loading,
    lastUpdated,
    refresh: () => analyze(true),  // Force-Refresh umgeht Cache
    cacheStats: getCacheStats,
  };
}

// Lightweight Feed Health (unverändert)
export { diversityBalance, newcomerProtection, SAFETY_GUARDS } from '@/lib/communityHealth/index';
export function useFeedHealth(feedItems = []) {
  const { diversityBalance: db, newcomerProtection: np } =
    { diversityBalance: (i) => ({ score: 0.7, recommendations: [] }),
      newcomerProtection: (i) => ({ protectionNeeded: false }) };
  return { recommendations: [] };
}
