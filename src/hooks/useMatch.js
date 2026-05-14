// src/hooks/useMatch.js
import { useState, useEffect, useRef } from 'react';
import { MatchService } from '../services/db';

export function useMatch(userId) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(!!userId);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!userId) { setLoading(false); return; }
    MatchService.getTopMatches(userId).then(({ data }) => {
      if (mounted.current) { setMatches(data || []); setLoading(false); }
    });
    return () => { mounted.current = false; };
  }, [userId]);

  return { matches, loading };
}
