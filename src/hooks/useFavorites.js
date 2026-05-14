// src/hooks/useFavorites.js — v2
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { safeQuery } from '../lib/perfUtils';

export function useFavorites(userId) {
  const [favorites, setFavorites] = useState([]);
  const [loading,   setLoading]   = useState(!!userId);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!userId) { setLoading(false); return; }
    safeQuery(
      supabase.from('favorites')
        .select('id,user_id,wirker_name,wirker_id,created_at')
        .eq('user_id', userId).limit(100)
    ).then(({ data }) => {
      if (mounted.current) { setFavorites(data || []); setLoading(false); }
    });
    return () => { mounted.current = false; };
  }, [userId]);

  const toggleFavorite = useCallback(async (wirkerName, wirkerId = null) => {
    const existing = favorites.find(f => f.wirker_name === wirkerName);
    if (existing) {
      await safeQuery(supabase.from('favorites').delete().eq('id', existing.id));
      setFavorites(prev => prev.filter(f => f.id !== existing.id));
      return false;
    } else {
      const { data } = await safeQuery(
        supabase.from('favorites')
          .insert({ user_id: userId, wirker_name: wirkerName, wirker_id: wirkerId })
          .select('id,user_id,wirker_name,wirker_id,created_at').single()
      );
      if (data) setFavorites(prev => [...prev, data]);
      return true;
    }
  }, [userId, favorites]);

  const isFavorite = useCallback((wirkerName) =>
    favorites.some(f => f.wirker_name === wirkerName), [favorites]);

  return { favorites, loading, toggleFavorite, isFavorite };
}
