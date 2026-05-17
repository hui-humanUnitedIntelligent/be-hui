// src/hooks/useRealGraphData.js
// HUI — Real Graph Data Hook — Phase 5D.1
// ═══════════════════════════════════════════════════════════════
//
// ZWECK:
// Verbindet echte Follow-Daten (Supabase) mit der Graph-Engine.
// Berechnet: relationshipStrength, communityAffinity,
//            creatorBridgeScore, analyzeNetworkHealth
// auf Basis ECHTER Verbindungen — nicht mehr Platzhalter.
//
// USAGE:
//   const { enrichedCreators, bridges, networkHealth, myAffinity }
//     = useRealGraphData({ userId, userProfile, creators });
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeQuery } from '@/lib/safeQuery';
import {
  relationshipStrength,
  creativeResonance,
  communityAffinity,
  creatorBridgeScore,
  detectSoftClusters,
  analyzeNetworkHealth,
  mutualEnergy,
  graphDiscoveryBonus,
} from '@/lib/graph/index';
import { useFollowGraph } from './useFollowGraph';

export function useRealGraphData({ userId, userProfile, creators = [] }) {
  const {
    followedIds,
    followerIds,
    mutualIds,
    connectionMap,
    followedProfiles,
    graphEdges,
    getRelationshipHistory,
    loading: followLoading,
  } = useFollowGraph(userId);

  // User Cluster Memberships (memoized)
  const userClusters = useMemo(
    () => userProfile ? communityAffinity(userProfile) : {},
    [userProfile?.id, userProfile?.dna_tags?.join(',')]
  );

  // Soft Cluster Map für alle Creators
  const clusterMap = useMemo(
    () => creators.length ? detectSoftClusters(creators) : new Map(),
    [creators.map(c => c.id).join(',')]
  );

  // Creators mit echten Graph-Daten anreichern
  const enrichedCreators = useMemo(() => {
    if (!creators.length) return [];

    return creators.map(creator => {
      const creatorId = creator.id;

      // Echte Relationship-History
      const history = getRelationshipHistory(creatorId);

      // Relationship Strength (mit echten Daten)
      const { strength, tier, signals } = relationshipStrength(history);

      // Creative Resonance
      const { resonance } = userProfile
        ? creativeResonance(userProfile, creator)
        : { resonance: 0.5 };

      // Bridge Score (mit echten Connections des Creators)
      const creatorClusters = clusterMap.get(creatorId) || {};
      const creatorConnections = followedProfiles.filter(p =>
        // Grobe Nähe: Creators die dieser Creator auch folgt
        // (vereinfacht ohne vollständigen Graphen des Creators)
        mutualIds.has(p.id)
      );
      const { bridgeScore, bridgeType, bridgeDimensions } =
        creatorBridgeScore(creator, creatorConnections, creatorClusters);

      // Graph Discovery Bonus
      const graphBonus = graphDiscoveryBonus(creator, {
        userClusterMemberships: userClusters,
        userConnections:        followedIds,
        networkBridges:         [],
      });

      return {
        ...creator,
        // Graph-Daten
        _relationshipStrength: strength,
        _relationshipTier:     tier,
        _relationshipSignals:  signals,
        _creativeResonance:    resonance,
        _bridgeScore:          bridgeScore,
        _bridgeType:           bridgeType,
        _bridgeDimensions:     bridgeDimensions,
        _graphBonus:           graphBonus,
        _isFollowed:           followedIds.has(creatorId),
        _isFollower:           followerIds.has(creatorId),
        _isMutual:             mutualIds.has(creatorId),
        _clusters:             creatorClusters,
        // Für socialCloseness() in Discovery Engine
        _connectionIds:        [...followedIds],
      };
    });
  }, [
    creators.map(c => c.id).join(','),
    followedIds.size,
    mutualIds.size,
    userProfile?.id,
    clusterMap.size,
  ]);

  // Bridge-Creators (Top 6)
  const bridges = useMemo(
    () => enrichedCreators
      .filter(c => c._bridgeScore > 0.35)
      .sort((a, b) => b._bridgeScore - a._bridgeScore)
      .slice(0, 6),
    [enrichedCreators]
  );

  // Netzwerk-Gesundheit mit echten Edges
  const networkHealth = useMemo(() => {
    if (!creators.length) return null;
    return analyzeNetworkHealth(enrichedCreators, graphEdges, clusterMap);
  }, [enrichedCreators, graphEdges, clusterMap]);

  // Mutual Energy für einen spezifischen Creator
  const getMutualEnergy = useCallback((creatorId) => {
    if (!userProfile) return null;
    const creator = creators.find(c => c.id === creatorId);
    if (!creator) return null;
    const history = getRelationshipHistory(creatorId);
    return mutualEnergy(userProfile, creator, history);
  }, [creators, userProfile, getRelationshipHistory]);

  return {
    enrichedCreators,
    bridges,
    networkHealth,
    userClusters,
    clusterMap,
    followedIds,
    followerIds,
    mutualIds,
    graphEdges,
    getMutualEnergy,
    loading: followLoading,
  };
}
