// src/hooks/useFeed.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { FeedService } from '../services/db';

export function useFeed(filters = {}) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [page,    setPage]    = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const mounted   = useRef(true);
  const loadingRef = useRef(false);
  
  // Stable filter key to avoid re-render loops
  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    mounted.current = true;
    setItems([]); setPage(0); setHasMore(true);
    loadPage(0);
    return () => { mounted.current = false; };
  }, [filterKey]); // eslint-disable-line

  async function loadPage(pageNum) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (pageNum === 0) setLoading(true);
    const { data, error: err } = await FeedService.getHomeFeed(pageNum, filters);
    if (!mounted.current) return;
    const rows = data || [];
    setHasMore(rows.length === 20);
    setItems(prev => pageNum === 0 ? rows : [...prev, ...rows]);
    setError(err?.message || null);
    setLoading(false);
    loadingRef.current = false;
  }

  const loadMore = useCallback(() => {
    if (!hasMore || loadingRef.current) return;
    const next = page + 1;
    setPage(next);
    loadPage(next);
  }, [page, hasMore]); // eslint-disable-line

  const refetch = useCallback(() => loadPage(0), []); // eslint-disable-line

  return { items, loading, error, hasMore, loadMore, refetch };
}
