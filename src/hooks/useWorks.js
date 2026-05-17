// ═══════════════════════════════════════════════════════════════
// STATUS: LEGACY — Phase 4A.5
// Diese Datei wird von keinem aktiven Modul importiert.
// NICHT LÖSCHEN — nur dokumentiert für spätere Bereinigung.
// Ersatz: siehe docs/LEGACY_MAP.md
// ═══════════════════════════════════════════════════════════════
// src/hooks/useWorks.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { WorkService } from '../services/db';

export function useWorks(userId) {
  const [works,   setWorks]   = useState([]);
  const [loading, setLoading] = useState(!!userId);
  const [error,   setError]   = useState(null);
  const [page,    setPage]    = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const mounted    = useRef(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    mounted.current = true;
    if (!userId) { setLoading(false); return; }
    loadPage(0);
    return () => { mounted.current = false; };
  }, [userId]); // eslint-disable-line

  async function loadPage(pageNum) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const { data, error: err } = await WorkService.getByUser(userId, pageNum);
    if (!mounted.current) return;

    const rows = data || [];
    if (pageNum === 0) setWorks(rows);
    else setWorks(prev => [...prev, ...rows]);

    setHasMore(rows.length === 20);
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

  const createWork = useCallback(async (data) => {
    const { data: created, error: err } = await WorkService.create(userId, data);
    if (created) setWorks(prev => [created, ...prev]);
    return { data: created, error: err };
  }, [userId]);

  return { works, loading, error, hasMore, loadMore, createWork };
}

export function useWorkById(workId) {
  const [work,    setWork]    = useState(null);
  const [loading, setLoading] = useState(!!workId);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!workId) { setLoading(false); return; }

    (async () => {
      const { data } = await WorkService.getById(workId);
      if (!mounted.current) return;
      setWork(data);
      setLoading(false);
    })();

    return () => { mounted.current = false; };
  }, [workId]);

  return { work, loading };
}
