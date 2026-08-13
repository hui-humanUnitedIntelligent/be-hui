// useOrbGrowthStage.js
// ═══════════════════════════════════════════════════════════════════════
// HUI Orb Growth Stage Hook
// Liefert die aktuelle Wachstumsstufe (1-6) des Orbs fuer einen Nutzer.
// Additiv, kein Eingriff in orbEngine.js oder useCoreEngine.js.
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const STAGE_CACHE_KEY = '__hui_orb_stage__';
const CACHE_TTL = 5 * 60 * 1000; // 5 Minuten

/**
 * Liefert die Orb-Wachstumsstufe (1-6) eines Nutzers.
 * Cached in sessionStorage (5 Min TTL) um DB-Last zu minimieren.
 *
 * @param {string|null} userId - UUID des Nutzers
 * @returns {{ stage: number, loading: boolean }}
 */
export function useOrbGrowthStage(userId = null) {
  const [stage, setStage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setStage(1);
      setLoading(false);
      return;
    }

    // Cache pruefen
    try {
      const cached = sessionStorage.getItem(STAGE_CACHE_KEY);
      if (cached) {
        const { stage: s, ts, uid } = JSON.parse(cached);
        if (uid === userId && Date.now() - ts < CACHE_TTL) {
          setStage(s);
          setLoading(false);
          return;
        }
      }
    } catch (_) {}

    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .rpc('rpc_get_orb_growth_stage', { p_user_id: userId });

        if (cancelled) return;

        if (error) {
          console.warn('[orb-growth-stage] RPC error:', error.message);
          setStage(1);
        } else if (data != null) {
          const s = Math.max(1, Math.min(6, Math.round(data)));
          setStage(s);
          try {
            sessionStorage.setItem(STAGE_CACHE_KEY, JSON.stringify({ stage: s, ts: Date.now(), uid: userId }));
          } catch (_) {}
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[orb-growth-stage] fetch error:', err);
          setStage(1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  return { stage, loading };
}

/**
 * Stage → Image-Pfad Mapping
 */
export const ORB_STAGE_IMAGES = [
  '/assets/brand/orb-stages/stage-1.png', // 0-indexed: stage 1
  '/assets/brand/orb-stages/stage-2.png',
  '/assets/brand/orb-stages/stage-3.png',
  '/assets/brand/orb-stages/stage-4.png',
  '/assets/brand/orb-stages/stage-5.png',
  '/assets/brand/orb-stages/stage-6.png',
];

/**
 * Liefert den Image-Pfad fuer eine Stufe (1-6).
 * @param {number} stage
 * @returns {string}
 */
export function getOrbStageImage(stage) {
  const s = Math.max(1, Math.min(6, Math.round(stage)));
  return ORB_STAGE_IMAGES[s - 1];
}
