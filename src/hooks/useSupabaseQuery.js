// useSupabaseQuery.js — HUI Data Fetching Hook
// Zentraler Hook für alle Supabase Queries:
// - Deduplication (kein doppelter Fetch)
// - Caching (30s default TTL)
// - Loading / Error / Retry states
// - Automatic cleanup
// - Keine UI-Änderungen

import { useState, useEffect, useCallback, useRef } from 'react';
import { safeQuery, cachedQuery } from '../lib/perfUtils';

/**
 * useSupabaseQuery — generic data fetching with cache + retry
 *
 * @param {string}   key       — Cache key (stable string)
 * @param {Function} queryFn   — () => supabase.from(...).select(...)
 * @param {Object}   options
 *   @param {any[]}    deps      — Extra deps for re-fetch (default [])
 *   @param {number}   ttl       — Cache TTL in ms (default 30000)
 *   @param {boolean}  enabled   — Skip fetch if false (default true)
 *   @param {any}      fallback  — Default data if query fails
 *   @param {number}   timeout   — Query timeout in ms (default 8000)
 */
export function useSupabaseQuery(key, queryFn, {
  deps = [],
  ttl = 30000,
  enabled = true,
  fallback = null,
  timeout = 8000,
} = {}) {
  const [data,    setData]    = useState(fallback);
  const [loading, setLoading] = useState(enabled);
  const [error,   setError]   = useState(null);
  const mounted = useRef(true);

  const fetch = useCallback(async () => {
    if (!enabled || !mounted.current) return;
    setLoading(true);
    setError(null);
    try {
      const result = await cachedQuery(key, () => safeQuery(queryFn(), timeout), ttl);
      if (!mounted.current) return;
      if (result.error && result.error.code !== 'PGRST116') {
        setError(result.error.message || 'Fehler beim Laden');
        setData(fallback);
      } else {
        setData(result.data ?? fallback);
      }
    } catch (e) {
      if (mounted.current) setError(e.message);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [key, enabled, ...deps]); // eslint-disable-line

  useEffect(() => {
    mounted.current = true;
    fetch();
    return () => { mounted.current = false; };
  }, [fetch]);

  const refetch = useCallback(() => {
    // Clear cache for this key then re-fetch
    const { clearQueryCache } = require('../lib/perfUtils');
    clearQueryCache(key);
    fetch();
  }, [key, fetch]);

  return { data, loading, error, refetch };
}

/**
 * useSupabasePaginated — paginated list with load-more
 *
 * @param {string}   key
 * @param {Function} queryFn    — (from, to) => supabase.from(...).select(...).range(from, to)
 * @param {Object}   options
 */
export function useSupabasePaginated(key, queryFn, {
  pageSize = 20,
  enabled = true,
  deps = [],
} = {}) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error,   setError]   = useState(null);
  const [page,    setPage]    = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const mounted = useRef(true);
  const loadingRef = useRef(false);

  const loadPage = useCallback(async (pageNum = 0) => {
    if (!enabled || loadingRef.current || !mounted.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const from = pageNum * pageSize;
      const to   = from + pageSize - 1;
      const { data, error: err } = await safeQuery(queryFn(from, to));
      if (!mounted.current) return;
      if (err) { setError(err.message); return; }
      const rows = data || [];
      setHasMore(rows.length === pageSize);
      setItems(prev => pageNum === 0 ? rows : [...prev, ...rows]);
      setPage(pageNum);
    } catch (e) {
      if (mounted.current) setError(e.message);
    } finally {
      if (mounted.current) setLoading(false);
      loadingRef.current = false;
    }
  }, [key, enabled, pageSize, ...deps]); // eslint-disable-line

  useEffect(() => {
    mounted.current = true;
    setItems([]); setPage(0); setHasMore(true);
    loadPage(0);
    return () => { mounted.current = false; };
  }, [key, enabled, ...deps]); // eslint-disable-line

  const loadMore = useCallback(() => {
    if (hasMore && !loading) loadPage(page + 1);
  }, [hasMore, loading, page, loadPage]);

  const refetch = useCallback(() => loadPage(0), [loadPage]);

  return { items, loading, error, hasMore, loadMore, refetch };
}

/**
 * useRealtimeChannel — managed realtime subscription
 * Automatically cleans up on unmount. 
 * Only for: Chat, Notifications, active Bookings.
 */
export function useRealtimeChannel(supabase, channelId, setupFn, enabled = true) {
  const channelRef = useRef(null);

  useEffect(() => {
    if (!enabled || !supabase || !channelId) return;
    // Cleanup existing channel with same ID
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    const ch = setupFn(supabase.channel(channelId));
    ch.subscribe(status => {
      if (status === 'SUBSCRIBED') {
        console.debug(`[HUI RT] Channel ${channelId} active`);
      }
    });
    channelRef.current = ch;
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channelId, enabled]); // eslint-disable-line
}
