// src/hooks/useSmartSearch.js
// HUI — Smart Search (Cached + Deduped) — Phase 6A.6
// ═══════════════════════════════════════════════════════════════
//
// VERBESSERUNGEN vs. V1 (5C.5):
//   + Query-Result-Cache (60s TTL)
//   + Inflight-Deduplication (gleiche Query läuft nur 1×)
//   + Typo-Toleranz erhalten (1 Zeichen)
//   + Mood-gewichtet erhalten
//   + 280ms Debounce erhalten
//   + findRelated() erhalten
//
// CACHE:
//   Namespace: 'search_results'
//   TTL: 60s (genug für Session, nicht zu lange stale)
//   Key: query + activeMood + userProfile.id
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeQuery } from '@/lib/safeQuery';
import { cacheOrFetch } from '@/lib/cache/index';
import { semanticTagMatch, moodSimilarity } from '@/lib/discovery/index';

const DEBOUNCE_MS  = 280;
const MIN_LEN      = 2;
const MAX_RESULTS  = 20;
const CACHE_NS     = 'search_results';

// Inflight-Deduplication (per Query-Key)
const inFlight = new Map();  // key → Promise

const CREATOR_SEARCH_FIELDS = `
  id, display_name, talent, bio, dna_tags, focus_type,
  is_available, is_verified, avatar_url, mood, location_label,
  total_bookings_completed, response_rate
`.trim();

// ── Kern-Suche ─────────────────────────────────────────────────
async function executeSearch(query, opts = {}) {
  const { activeMood, userProfile } = opts;
  const q = query.trim().toLowerCase();

  // Server-Side: ilike Suche
  const [nameRes, tagRes, talentRes] = await Promise.all([
    safeQuery(
      supabase.from('profiles')
        .select(CREATOR_SEARCH_FIELDS)
        .ilike('display_name', `%${q}%`)
        .eq('has_talent_profile', true)
        .limit(15)
    ),
    safeQuery(
      supabase.from('profiles')
        .select(CREATOR_SEARCH_FIELDS)
        .contains('dna_tags', [q])
        .eq('has_talent_profile', true)
        .limit(10)
    ),
    safeQuery(
      supabase.from('profiles')
        .select(CREATOR_SEARCH_FIELDS)
        .ilike('talent', `%${q}%`)
        .eq('has_talent_profile', true)
        .limit(10)
    ),
  ]);

  // Deduplizieren
  const seen  = new Set();
  const raw   = [
    ...(nameRes.data   || []),
    ...(tagRes.data    || []),
    ...(talentRes.data || []),
  ].filter(c => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  // Client-Side Semantic Scoring
  const moodKey = activeMood?.key || activeMood || '';
  const userDna = userProfile?.dna_tags || [];

  const scored = raw.map(creator => {
    // Semantic Tag Match (Typo-Toleranz)
    const tagScore     = semanticTagMatch(q, creator.dna_tags || []);

    // Mood-Match (gibt Kontext)
    const moodScore    = moodKey
      ? moodSimilarity({ mood: moodKey }, { mood: creator.mood })
      : 0.5;

    // Name-Relevanz
    const nameMatch    = (creator.display_name || '').toLowerCase().includes(q) ? 1 : 0;

    // Talent-Relevanz
    const talentMatch  = (creator.talent || '').toLowerCase().includes(q) ? 0.8 : 0;

    // Trust-Signal (verifizierte Creator leicht bevorzugt)
    const trustBonus   = creator.is_verified ? 0.05 : 0;

    const totalScore   = (
      Math.max(nameMatch, talentMatch) * 0.35 +
      tagScore    * 0.30 +
      moodScore   * 0.20 +
      trustBonus  * 0.15
    );

    return { ...creator, _searchScore: totalScore };
  });

  return scored
    .sort((a, b) => b._searchScore - a._searchScore)
    .slice(0, MAX_RESULTS);
}

// ── Hook ────────────────────────────────────────────────────────
export function useSmartSearch({ activeMood, userProfile } = {}) {
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [query,    setQuery]    = useState('');
  const debounceRef = useRef(null);

  const search = useCallback(async (rawQuery) => {
    const q = (rawQuery || '').trim();
    setQuery(q);

    if (q.length < MIN_LEN) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Cache-Key: query + mood + user (unterschiedliche Kontexte = verschiedene Ergebnisse)
    const cacheKey = `${q}:${activeMood?.key || ''}:${userProfile?.id || ''}`;

    // Inflight-Deduplication
    if (inFlight.has(cacheKey)) {
      const data = await inFlight.get(cacheKey);
      setResults(data || []);
      setLoading(false);
      return;
    }

    const fetchPromise = cacheOrFetch(
      CACHE_NS,
      cacheKey,
      () => executeSearch(q, { activeMood, userProfile }),
      { ttl: 60_000 }
    ).then(({ data }) => data || []);

    inFlight.set(cacheKey, fetchPromise);

    try {
      const data = await fetchPromise;
      setResults(data);
    } catch (err) {
      console.error('[SmartSearch]', err?.message);
      setResults([]);
    } finally {
      inFlight.delete(cacheKey);
      setLoading(false);
    }
  }, [activeMood?.key || activeMood, userProfile?.id]);

  // Debounced search trigger
  const debouncedSearch = useCallback((q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), DEBOUNCE_MS);
  }, [search]);

  // Ähnliche Creators finden
  const findRelated = useCallback(async (creator) => {
    if (!creator?.dna_tags?.length) return [];
    const q = (creator.dna_tags || []).join(' ');
    const cacheKey = `related:${creator.id}`;

    const { data } = await cacheOrFetch(
      CACHE_NS,
      cacheKey,
      () => executeSearch(q, { activeMood, userProfile }),
      { ttl: 120_000 }  // 2min für "Related" — ändert sich langsamer
    );
    return (data || []).filter(c => c.id !== creator.id);
  }, [activeMood?.key, userProfile?.id]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    results,
    loading,
    query,
    search: debouncedSearch,
    searchImmediate: search,
    findRelated,
    clear: () => { setResults([]); setQuery(''); },
  };
}
