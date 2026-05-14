// src/hooks/useWirker.js — v2
import { useState, useEffect, useRef } from 'react';
import { TalentService } from '../services/db';

export function useWirker({ page = 0, category = null, location = null } = {}) {
  const [wirker,  setWirker]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);

    (async () => {
      const { data, error: err } = await TalentService.list({ page, category, location });
      if (!mounted.current) return;
      setWirker(data || []);
      setError(err?.message || null);
      setLoading(false);
    })();

    return () => { mounted.current = false; };
  }, [page, category, location]);

  return { wirker, loading, error };
}

export function useWirkerById(id) {
  const [wirker,  setWirker]  = useState(null);
  const [loading, setLoading] = useState(!!id);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!id) { setLoading(false); return; }

    (async () => {
      const { data } = await TalentService.getByUserId(id);
      if (!mounted.current) return;
      setWirker(data);
      setLoading(false);
    })();

    return () => { mounted.current = false; };
  }, [id]);

  return { wirker, loading };
}

export function useWirkerByName(name) {
  const [wirker,  setWirker]  = useState(null);
  const [loading, setLoading] = useState(!!name);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!name) { setLoading(false); return; }

    (async () => {
      const { data } = await TalentService.getBySlug(name);
      if (!mounted.current) return;
      setWirker(data);
      setLoading(false);
    })();

    return () => { mounted.current = false; };
  }, [name]);

  return { wirker, loading };
}
