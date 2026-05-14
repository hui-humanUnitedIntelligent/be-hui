// src/hooks/useWorks.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { WorkService } from '../services/db';

export function useWorks(userId) {
  const [works,   setWorks]   = useState([]);
  const [loading, setLoading] = useState(!!userId);
  const [error,   setError]   = useState(null);
  const [page,    setPage]    = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    WorkService.getByUser(userId, 0).then(({ data, error: err }) => {
      if (!mounted.current) return;
      const rows = data || [];
      setWorks(rows);
      setHasMore(rows.length === 20);
      setError(err?.message || null);
      setLoading(false);
    });
    return () => { mounted.current = false; };
  }, [userId]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    const { data } = await WorkService.getByUser(userId, nextPage);
    const rows = data || [];
    setWorks(prev => [...prev, ...rows]);
    setHasMore(rows.length === 20);
    setPage(nextPage);
  }, [userId, page, hasMore, loading]);

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
    if (!workId) return;
    WorkService.getById(workId).then(({ data }) => {
      if (mounted.current) { setWork(data); setLoading(false); }
    });
    return () => { mounted.current = false; };
  }, [workId]);

  return { work, loading };
}
