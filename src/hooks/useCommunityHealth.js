// src/hooks/useCommunityHealth.js
// HUI — Community Health Hook — Phase 5G.6
// ═══════════════════════════════════════════════════════════════
//
// ZWECK:
// Berechnet Community Health Score aus echten Supabase-Daten.
// Verwendet von: CreatorStudio (Admin), Discovery Engine.
//
// WICHTIG:
// Keine Vanity-Metrics. Keine Screen-Time-KPIs.
// Nur: kreative Netzwerk-Gesundheit.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeQuery } from '@/lib/safeQuery';
import {
  analyzeCommunityHealth,
  exposureFairness,
  diversityBalance,
  bridgeHealth,
  resonanceQuality,
  calmnessHealth,
  newcomerProtection,
  creatorSaturation,
  healthyExposureDistribution,
  HEALTH_THRESHOLDS,
  SAFETY_GUARDS,
} from '@/lib/communityHealth/index';
import { detectSoftClusters, creatorBridgeScore, communityAffinity } from '@/lib/graph/index';

const CREATOR_FIELDS = `
  id, display_name, talent, focus_type, dna_tags, is_available,
  is_verified, total_bookings_completed, response_rate,
  created_at, updated_at, mood, location_label
`.trim();

export function useCommunityHealth({ enabled = true, refreshInterval = 300000 } = {}) {
  // 300s = 5min Refresh-Intervall — kein Echtzeit-Polling
  const [health,       setHealth]       = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState(null);
  const mountedRef = useRef(true);

  const analyze = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);

    try {
      // 1. Parallel: Creators, Bookings, Recommendations, Follows
      const [creatorsRes, bookingsRes, recsRes, followsRes, worksRes] = await Promise.all([
        safeQuery(supabase.from('profiles').select(CREATOR_FIELDS)
          .eq('has_talent_profile', true).limit(200)),
        safeQuery(supabase.from('bookings').select('id, status, created_at, wirker_user_id')
          .limit(500)),
        safeQuery(supabase.from('recommendations').select('id, recipient_id, created_at')
          .limit(300)),
        safeQuery(supabase.from('follows').select('follower_id, followed_id, created_at')
          .limit(1000)),
        safeQuery(supabase.from('works').select('id, user_id, status, created_at')
          .eq('status', 'published').limit(300)),
      ]);

      if (!mountedRef.current) return;

      const creators     = creatorsRes.data  || [];
      const bookings     = bookingsRes.data  || [];
      const recs         = recsRes.data      || [];
      const follows      = followsRes.data   || [];
      const works        = worksRes.data     || [];

      // 2. Soft Clusters + Bridge Scores
      const clusterMap = detectSoftClusters(creators);
      const creatorsEnriched = creators.map(c => {
        const clusters = clusterMap.get(c.id) || {};
        const { bridgeScore, bridgeType, bridgeDimensions } =
          creatorBridgeScore(c, [], clusters);
        return { ...c, _bridgeScore: bridgeScore, _bridgeType: bridgeType,
                 _bridgeDimensions: bridgeDimensions, _clusters: clusters };
      });

      // 3. Exposure-Daten aufbauen (vereinfacht: works als proxy)
      const worksByCreator = {};
      for (const w of works) {
        worksByCreator[w.user_id] = (worksByCreator[w.user_id] || 0) + 1;
      }
      const totalWorks = works.length || 1;
      const exposureData = creatorsEnriched.map(c => ({
        creatorId:       c.id,
        feedImpressions: (worksByCreator[c.id] || 0) / totalWorks,  // 0–1 Anteil
        joinedDaysAgo:   c.created_at
          ? (Date.now() - new Date(c.created_at).getTime()) / 86400000 : 999,
      }));

      // 4. Network Edges aus follows
      const networkEdges = follows.map(f => ({
        from: f.follower_id,
        to:   f.followed_id,
      }));

      // 5. Platform Metrics für resonanceQuality
      const completedBookings = bookings.filter(b => b.status === 'completed').length;
      const bookingsWithRec   = recs.filter(r =>
        bookings.some(b => b.wirker_user_id === r.recipient_id && b.status === 'completed')
      ).length;

      // Mutual follows zählen
      const followSet = new Set(follows.map(f => `${f.follower_id}:${f.followed_id}`));
      const mutualFollows = follows.filter(f =>
        followSet.has(`${f.followed_id}:${f.follower_id}`)
      ).length / 2;

      const platformMetrics = {
        totalBookings:       bookings.length,
        bookingsWithRec,
        totalCollaborations: 0,   // kommt in Phase 5H wenn collaboration table vorhanden
        repeatCollaborations:0,
        totalFollows:        follows.length,
        mutualFollows:       Math.round(mutualFollows),
        totalChats:          0,
        chatsLeadingToBooking:0,
      };

      // 6. Platform Signals (Calmness) — client-side defaults
      const platformSignals = {
        avgNotifsPerUserPerDay: 1.2,  // Annahme: konservative Plattform
        avgFeedItemsPerHour:    15,
        activePushCampaigns:    0,
        avgSessionPushes:       1,
      };

      // 7. Vollständige Analyse
      const result = analyzeCommunityHealth({
        creators:        creatorsEnriched,
        feedItems:       works.map(w => ({ ...w, _type: 'werk' })),
        networkEdges,
        exposureData,
        platformMetrics,
        platformSignals,
      });

      // 8. Safety Guards prüfen
      const feedSample = works.slice(0, 30).map(w => ({ ...w, _type: 'werk' }));
      result.safetyGuards = {
        maxCreatorFeedShare: SAFETY_GUARDS.maxCreatorFeedShare(feedSample),
        diversityMinimum:    SAFETY_GUARDS.diversityMinimum(feedSample),
        newcomerFloor:       SAFETY_GUARDS.newcomerFloor(feedSample),
        antiRunaway:         SAFETY_GUARDS.antiRunaway(feedSample),
      };

      // 9. Bridge-Creators für Dashboard
      result.topBridges = creatorsEnriched
        .filter(c => c._bridgeScore > 0.35)
        .sort((a, b) => b._bridgeScore - a._bridgeScore)
        .slice(0, 6)
        .map(c => ({
          id: c.id, display_name: c.display_name,
          bridgeScore: c._bridgeScore, bridgeType: c._bridgeType,
        }));

      if (mountedRef.current) {
        setHealth(result);
        setLastUpdated(new Date().toISOString());
      }
    } catch (err) {
      console.error('[CommunityHealth]', err?.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    mountedRef.current = true;
    analyze();
    // Periodischer Refresh (kein Echtzeit — Community Health ändert sich langsam)
    if (refreshInterval > 0) {
      const interval = setInterval(analyze, refreshInterval);
      return () => { mountedRef.current = false; clearInterval(interval); };
    }
    return () => { mountedRef.current = false; };
  }, [analyze, refreshInterval]);

  return { health, loading, lastUpdated, refresh: analyze };
}

// ── Lightweight Version für Discovery (kein Supabase) ──────────
/**
 * Schnelle client-side Health-Prüfung für Feed-Rendering.
 * Kein Supabase. Nur Analyse des aktuellen Feeds.
 */
export function useFeedHealth(feedItems = []) {
  const diversity    = diversityBalance(feedItems);
  const newcomer     = newcomerProtection(feedItems);
  const guardsPass   = {
    creatorShare: SAFETY_GUARDS.maxCreatorFeedShare(feedItems),
    diversity:    SAFETY_GUARDS.diversityMinimum(feedItems),
    newcomers:    SAFETY_GUARDS.newcomerFloor(feedItems),
    antiRunaway:  SAFETY_GUARDS.antiRunaway(feedItems),
  };
  const allPass = Object.values(guardsPass).every(Boolean);

  return {
    diversity,
    newcomer,
    guardsPass,
    allPass,
    recommendations: diversity.recommendations,
  };
}
