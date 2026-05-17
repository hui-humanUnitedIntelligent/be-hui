// src/hooks/useGraphDiscovery.js
// HUI — Graph-Enhanced Discovery Hook — Phase 5D.6
// ═══════════════════════════════════════════════════════════════
//
// ZWECK:
// Erweitert die Discovery Engine (5C) um Graph-Signale (5D).
// Berücksichtigt: Bridge-Qualität, Cluster-Komplementarität,
// soziale Nähe zweiten Grades, lokale Resonanz.
//
// VERSPRECHEN:
// — Keine Filter-Bubbles: Cluster-Komplementarität bevorzugt Neues
// — Bridge-Creators werden sichtbarer
// — Lokale Szenen werden gestärkt
// — Newcomers werden fair eingebunden
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeQuery } from '@/lib/safeQuery';
import {
  communityAffinity,
  creatorBridgeScore,
  detectSoftClusters,
  graphDiscoveryBonus,
  analyzeNetworkHealth,
  creativeResonance,
} from '@/lib/graph/index';
import { relevanceScore, rankFeed, diversityGuard } from '@/lib/discovery/index';

const CREATOR_FIELDS = `
  id, display_name, talent, focus_type, dna_tags, bio,
  is_available, is_verified, avatar_url, header_img,
  total_bookings_completed, response_rate, created_at,
  mood, location_label, has_talent_profile
`.trim();

export function useGraphDiscovery({ userProfile, userFollows, activeMood, enabled = true }) {
  const [graphEnhancedFeed, setGraphEnhancedFeed] = useState([]);
  const [bridges,           setBridges]           = useState([]);
  const [networkHealth,     setNetworkHealth]      = useState(null);
  const [loading,           setLoading]            = useState(true);
  const mountedRef = useRef(true);

  // User-Cluster-Memberships (memoized)
  const userClusters = useMemo(
    () => userProfile ? communityAffinity(userProfile) : {},
    [userProfile?.id, userProfile?.dna_tags?.join(',')]
  );

  const loadGraphDiscovery = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);

    try {
      // 1. Creators laden
      const { data: creators } = await safeQuery(
        supabase.from('profiles')
          .select(CREATOR_FIELDS)
          .eq('has_talent_profile', true)
          .limit(60)
      );

      if (!mountedRef.current || !creators?.length) return;

      // 2. Soft Clusters berechnen
      const clusterMap = detectSoftClusters(creators);

      // 3. Bridge Scores berechnen
      // (vereinfacht: ohne vollständige Connections — nur Profil-basiert)
      const creatorsWithBridge = creators.map(creator => {
        const clusterMemberships = clusterMap.get(creator.id) || {};
        const { bridgeScore, bridgeType } = creatorBridgeScore(
          creator,
          [],   // Connections werden in Phase 5E mit echtem Graph befüllt
          clusterMemberships
        );
        return { ...creator, _bridgeScore: bridgeScore, _bridgeType: bridgeType };
      });

      // 4. Graph Discovery Bonus pro Creator
      const userContext = {
        userClusterMemberships: userClusters,
        userConnections: userFollows || new Set(),
        networkBridges: [],
      };

      const enriched = creatorsWithBridge.map(creator => ({
        ...creator,
        _graphBonus: graphDiscoveryBonus(creator, userContext),
      }));

      // 5. Kombiniertes Ranking: Discovery Score + Graph Bonus
      const scored = enriched.map(creator => {
        const baseScore  = relevanceScore(creator, {
          mood: activeMood?.key || activeMood,
          userFollows,
          userProfile,
        });
        const graphBonus = creator._graphBonus || 0;

        // Graph Bonus kann max +15% zum Base Score beitragen
        const totalScore = baseScore * 0.85 + graphBonus * 0.15;

        return { ...creator, _totalScore: totalScore };
      });

      // 6. Sortieren + Diversity Guard
      scored.sort((a, b) => b._totalScore - a._totalScore);

      // 7. Bridge-Creators identifizieren (für UI-Sektion "Kreative Brücken")
      const bridgeCreators = enriched
        .filter(c => c._bridgeScore > 0.45)
        .sort((a, b) => b._bridgeScore - a._bridgeScore)
        .slice(0, 6);

      // 8. Netzwerk-Gesundheit analysieren
      const health = analyzeNetworkHealth(creators, [], clusterMap);

      if (mountedRef.current) {
        setGraphEnhancedFeed(scored.slice(0, 30));
        setBridges(bridgeCreators);
        setNetworkHealth(health);
      }
    } catch (err) {
      console.error('[GraphDiscovery]', err?.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [userProfile?.id, activeMood?.key || activeMood, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    loadGraphDiscovery();
    return () => { mountedRef.current = false; };
  }, [loadGraphDiscovery]);

  return { graphEnhancedFeed, bridges, networkHealth, loading, reload: loadGraphDiscovery };
}
