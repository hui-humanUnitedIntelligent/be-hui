// src/hooks/useTalentProfile.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { TalentService } from '../services/db';

export function useTalentProfile(userId) {
  const [talent,  setTalent]  = useState(null);
  const [loading, setLoading] = useState(!!userId);
  const [error,   setError]   = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!userId) { setLoading(false); return; }
    TalentService.getByUserId(userId).then(({ data, error: err }) => {
      if (!mounted.current) return;
      setTalent(data);
      setError(err?.code === 'PGRST116' ? null : err?.message || null);
      setLoading(false);
    });
    return () => { mounted.current = false; };
  }, [userId]);

  const updateTalent = useCallback(async (updates) => {
    const { data, error: err } = await TalentService.update(userId, updates);
    if (data) setTalent(data);
    return { data, error: err };
  }, [userId]);

  const createTalent = useCallback(async (data) => {
    const { data: created, error: err } = await TalentService.create(userId, data);
    if (created) setTalent(created);
    return { data: created, error: err };
  }, [userId]);

  return { talent, loading, error, updateTalent, createTalent };
}
