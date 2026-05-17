// ═══════════════════════════════════════════════════════════════
// STATUS: LEGACY — Phase 4A.5
// Diese Datei wird von keinem aktiven Modul importiert.
// NICHT LÖSCHEN — nur dokumentiert für spätere Bereinigung.
// Ersatz: siehe docs/LEGACY_MAP.md
// ═══════════════════════════════════════════════════════════════
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

    (async () => {
      const { data } = await MatchService.getTopMatches(userId);
      if (!mounted.current) return;
      setMatches(data || []);
      setLoading(false);
    })();

    return () => { mounted.current = false; };
  }, [userId]);

  return { matches, loading };
}
