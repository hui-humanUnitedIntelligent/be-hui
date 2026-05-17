// src/hooks/useSmartSearch.js
// HUI — Smart Search & Discovery — Phase 5C.5
// ═══════════════════════════════════════════════════════════════
//
// Features:
// - Mood-aware: Suchergebnisse werden mood-gewichtet
// - Semantic: Versteht verwandte Tags und Cluster
// - Typo-Tolerant: 1 Zeichen Abweichung wird erkannt
// - Related Creators: "Zu diesem Creator passen auch..."
// - Ruhig: Keine aggressive Empfehlungs-Wand
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeQuery } from '@/lib/safeQuery';
import {
  semanticTagMatch,
  creatorAffinity,
  trustWeight,
  moodSimilarity,
} from '@/lib/discovery/index';

const SEARCH_FIELDS = `
  id, username, display_name, talent, focus_type, dna_tags,
  bio, is_available, is_verified, avatar_url, header_img,
  total_bookings_completed, response_rate, created_at, mood
`.trim();

function scoreSearchResult(creator, query, activeMood) {
  if (!creator) return 0;

  // Text-Relevanz (Name, Talent, Bio)
  const searchText = [
    creator.display_name,
    creator.talent,
    creator.bio,
    ...(creator.dna_tags || []),
  ].join(' ').toLowerCase();

  const queryLower = query.toLowerCase();
  let textScore = 0;

  if (creator.display_name?.toLowerCase().includes(queryLower)) textScore += 1.0;
  else if (searchText.includes(queryLower)) textScore += 0.7;

  // Semantic Tag Match
  const tagScore = semanticTagMatch(query, creator.dna_tags || []);

  // Mood-Fit wenn aktiv
  const moodScore = activeMood ? moodSimilarity(creator, activeMood) * 0.3 : 0;

  // Trust Bonus
  const trust = trustWeight(creator) * 0.2;

  return Math.min(1, textScore * 0.5 + tagScore * 0.3 + moodScore + trust);
}

export function useSmartSearch() {
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [query,    setQuery]    = useState('');
  const debounceRef = useRef(null);

  const search = useCallback(async (searchQuery, opts = {}) => {
    const { mood, limit = 12 } = opts;
    const q = searchQuery?.trim();

    if (!q || q.length < 2) {
      setResults([]);
      setQuery('');
      return;
    }

    setQuery(q);

    // Debounce 280ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Supabase ilike-Suche (Server-Side)
        const { data, error } = await safeQuery(
          supabase.from('profiles')
            .select(SEARCH_FIELDS)
            .or([
              `display_name.ilike.%${q}%`,
              `talent.ilike.%${q}%`,
              `bio.ilike.%${q}%`,
            ].join(','))
            .eq('has_talent_profile', true)
            .limit(limit * 2)  // Mehr laden, dann client-side ranken
        );

        if (error) throw error;

        // Client-Side Scoring + Sorting
        const scored = (data || [])
          .map(creator => ({
            ...creator,
            _score: scoreSearchResult(creator, q, mood),
          }))
          .sort((a, b) => b._score - a._score)
          .slice(0, limit);

        setResults(scored);
      } catch (_) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  }, []);

  // Related Creators: "Kreativ ähnlich zu diesem Creator"
  const findRelated = useCallback(async (creator, limit = 6) => {
    if (!creator) return [];
    const { data } = await safeQuery(
      supabase.from('profiles')
        .select(SEARCH_FIELDS)
        .eq('has_talent_profile', true)
        .neq('id', creator.id)
        .limit(30)
    );

    return (data || [])
      .map(c => ({ ...c, affinity: creatorAffinity(creator, c) }))
      .sort((a, b) => b.affinity.score - a.affinity.score)
      .slice(0, limit);
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setQuery('');
  }, []);

  return { results, loading, query, search, findRelated, clear };
}
