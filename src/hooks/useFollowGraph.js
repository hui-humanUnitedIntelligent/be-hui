// src/hooks/useFollowGraph.js
// HUI — Follow Graph Data Hook — Phase 5D.1
// ═══════════════════════════════════════════════════════════════
//
// ZWECK:
// Lädt echte Follow-Verbindungen aus Supabase und bereitet sie
// für die Graph-Engine (5D) vor.
//
// Liefert:
//   followedIds      — Set<uuid>  wem der User folgt
//   followerIds      — Set<uuid>  wer dem User folgt
//   mutualIds        — Set<uuid>  gegenseitige Follows
//   connectionMap    — Map<uuid, {isMutual, followsSince}>
//   sharedWith(id)   — gemeinsame Connections mit einem Creator
//   graphConnections — Array für analyzeNetworkHealth()
//
// Privacy:
//   Keine Follower-Zahlen im UI exponiert.
//   Daten nur für interne Graph-Berechnungen.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeQuery } from '@/lib/safeQuery';

const PROFILE_MINI = 'id, display_name, avatar_url, dna_tags, focus_type, mood, location_label, is_available, created_at';

export function useFollowGraph(userId) {
  const [followedIds,  setFollowedIds]  = useState(new Set());
  const [followerIds,  setFollowerIds]  = useState(new Set());
  const [mutualIds,    setMutualIds]    = useState(new Set());
  const [connectionMap,setConnectionMap]= useState(new Map());
  const [followedProfiles, setFollowedProfiles] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // Parallel: wen folge ich + wer folgt mir
    const [followingRes, followerRes] = await Promise.all([
      safeQuery(
        supabase.from('follows')
          .select(`followed_id, created_at, profiles:followed_id(${PROFILE_MINI})`)
          .eq('follower_id', userId)
          .order('created_at', { ascending: false })
      ),
      safeQuery(
        supabase.from('follows')
          .select('follower_id, created_at')
          .eq('followed_id', userId)
      ),
    ]);

    if (!mountedRef.current) return;

    const followed = (followingRes.data || []);
    const followers = (followerRes.data || []);

    // Sets aufbauen
    const followedSet  = new Set(followed.map(f => f.followed_id));
    const followerSet  = new Set(followers.map(f => f.follower_id));

    // Mutual: in beiden Sets
    const mutualSet    = new Set([...followedSet].filter(id => followerSet.has(id)));

    // Connection Map (für relationshipStrength)
    const connMap = new Map();
    for (const f of followed) {
      connMap.set(f.followed_id, {
        isMutual:      mutualSet.has(f.followed_id),
        followsSince:  f.created_at,
        profile:       f.profiles || null,
      });
    }

    // Profile der gefolgten Creators (für Graph-Berechnungen)
    const profiles = followed
      .map(f => f.profiles)
      .filter(Boolean);

    if (mountedRef.current) {
      setFollowedIds(followedSet);
      setFollowerIds(followerSet);
      setMutualIds(mutualSet);
      setConnectionMap(connMap);
      setFollowedProfiles(profiles);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  // Gemeinsame Connections mit einem anderen Creator (via SQL-Funktion)
  const sharedWith = useCallback(async (otherUserId) => {
    if (!userId || !otherUserId) return [];
    const { data } = await safeQuery(
      supabase.rpc('get_shared_connections', {
        user_a: userId,
        user_b: otherUserId,
        lim: 10,
      })
    );
    return data || [];
  }, [userId]);

  // Für analyzeNetworkHealth: Array von {from, to} Edges
  const graphEdges = useMemo(() => {
    const edges = [];
    for (const [targetId, conn] of connectionMap.entries()) {
      edges.push({ from: userId, to: targetId });
      if (conn.isMutual) edges.push({ from: targetId, to: userId });
    }
    return edges;
  }, [connectionMap, userId]);

  // Für relationshipStrength: History-Objekt für zwei Personen
  const getRelationshipHistory = useCallback((otherUserId) => {
    const conn = connectionMap.get(otherUserId);
    return {
      mutualFollow:            conn?.isMutual ?? false,
      followsA:                followedIds.has(otherUserId),
      followsB:                followerIds.has(otherUserId),
      // Diese Felder kommen aus bookingContext/chatContext wenn kombiniert:
      completedBookings:       0,
      repeatBookings:          false,
      recommendationsGiven:    0,
      recommendationsReceived: 0,
      collaborations:          0,
      chatMessages:            0,
    };
  }, [connectionMap, followedIds, followerIds]);

  return {
    followedIds,
    followerIds,
    mutualIds,
    connectionMap,
    followedProfiles,
    graphEdges,
    loading,
    reload:                load,
    sharedWith,
    getRelationshipHistory,
  };
}
