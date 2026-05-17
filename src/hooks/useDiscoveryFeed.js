// src/hooks/useDiscoveryFeed.js
// HUI — Discovery Feed Hook — Phase 5C.3
// ═══════════════════════════════════════════════════════════════
//
// ZWECK:
// Verbindet die Discovery Engine mit dem DiscoveryFeed.
// Ersetzt einfaches created_at-Ordering durch intelligentes Ranking.
//
// ÄNDERUNGEN vs. vorher:
// VORHER: .order("created_at", { ascending: false }) → chronologisch
// NACHHER: rankFeed() + diversityGuard() → menschliche Relevanz
//
// Was sich NICHT ändert:
// - UI bleibt identisch
// - Daten kommen aus denselben Tabellen
// - Mood-Filter bleibt erhalten (wird jetzt als Ranking-Input genutzt)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeQuery } from '@/lib/safeQuery';
import {
  rankFeed,
  diversityGuard,
  antiRepetition,
  analyzeDiscoveryHealth,
  moodSimilarity,
} from '@/lib/discovery/index';

/** Wie viele Items initial laden */
const PAGE_SIZE = 24;

/** Felder die wir für Ranking brauchen */
const CREATOR_FIELDS = `
  id, display_name, talent, focus_type, dna_tags,
  is_available, is_verified, response_rate,
  total_bookings_completed, mood, created_at
`.trim();

export function useDiscoveryFeed({ activeMood, userProfile, userFollows, enabled = true }) {
  const [feed,    setFeed]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [health,  setHealth]  = useState(null);
  const mountedRef = useRef(true);

  const loadFeed = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Items aus DB laden (Works + Experiences + Stories)
      const [worksRes, expRes, storyRes] = await Promise.all([
        safeQuery(
          supabase.from('works')
            .select(`*, profiles:user_id(${CREATOR_FIELDS})`)
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(PAGE_SIZE)
        ),
        safeQuery(
          supabase.from('experiences')
            .select(`*, profiles:user_id(${CREATOR_FIELDS})`)
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(Math.floor(PAGE_SIZE / 2))
        ),
        safeQuery(
          supabase.from('stories')
            .select(`*, profiles:user_id(${CREATOR_FIELDS})`)
            .order('created_at', { ascending: false })
            .limit(Math.floor(PAGE_SIZE / 3))
        ),
      ]);

      if (!mountedRef.current) return;

      // 2. Items normalisieren (einheitliche Struktur für Engine)
      const normalize = (items, type) => (items || [])
        .filter(Boolean)
        .map(item => ({
          ...item,
          _type:      type,
          type:       type,
          // Creator-Felder auf Top-Level heben (für Engine)
          ...(item.profiles || {}),
          creator_id: item.user_id,
        }));

      const allItems = [
        ...normalize(worksRes.data,  'werk'),
        ...normalize(expRes.data,    'experience'),
        ...normalize(storyRes.data,  'story'),
      ];

      // 3. Ranking mit Discovery Engine
      const context = {
        mood:        activeMood?.key || activeMood,
        userFollows: userFollows || new Set(),
        userProfile: userProfile || null,
        debugMode:   false,
      };

      const ranked     = rankFeed(allItems, context);
      const diversified = diversityGuard(ranked, {
        maxPerCreator:    2,
        explorationRatio: 0.20,
      });

      // Anti-Repetition (Session-basiert)
      const deduped = antiRepetition(diversified, 'hui_disc_seen');

      // 4. Feed-Gesundheit analysieren
      if (deduped.length > 0) {
        const h = analyzeDiscoveryHealth(deduped);
        setHealth(h);
        if (process.env.NODE_ENV !== 'production' && h.issues.length > 0) {
          console.warn('[Discovery] Health issues:', h.issues);
        }
      }

      setFeed(deduped);
    } catch (err) {
      if (mountedRef.current) {
        setError(err?.message || 'Feed konnte nicht geladen werden');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [activeMood?.key || activeMood, userProfile?.id, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    loadFeed();
    return () => { mountedRef.current = false; };
  }, [loadFeed]);

  return { feed, loading, error, health, reload: loadFeed };
}
