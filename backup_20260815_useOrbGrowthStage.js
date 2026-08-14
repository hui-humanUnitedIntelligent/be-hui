// useOrbGrowthStage.js
// ═══════════════════════════════════════════════════════════════════════
// HUI Orb Growth Stage Hook
// Liefert die aktuelle Wachstumsstufe (1-6) des Orbs fuer einen Nutzer.
// Additiv, kein Eingriff in orbEngine.js oder useCoreEngine.js.
//
// FIX (2026-08-13): Vorher startete der Hook IMMER mit stage=1 als
// React-Default-State, auch wenn der Nutzer laengst Stufe 6 erreicht
// hatte. Das erzeugte einen sichtbaren "Flash" (Knospe → springt auf
// Stufe 6), sobald die RPC-Antwort eintraf. Root Cause: useState(1)
// initialisierte synchron auf einen falschen Wert, waehrend echte Daten
// erst asynchron nachkamen.
//
// Fix: Der sessionStorage-Cache wird jetzt SYNCHRON im initialen
// useState-Lazy-Initializer gelesen (kein Warten auf useEffect noetig).
// Ist kein gueltiger Cache vorhanden (z.B. allererster Start der Session),
// ist der initiale Wert `null` statt einer geratenen Zahl — die
// aufrufende Komponente rendert dann bewusst KEIN falsches Bild, bis
// die echte Stufe von der RPC eintrifft (siehe getOrbStageImage-Aufrufer).
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const STAGE_CACHE_KEY = '__hui_orb_stage__';
const CACHE_TTL = 5 * 60 * 1000; // 5 Minuten

function readCachedStage(userId) {
  if (!userId) return null;
  try {
    const cached = sessionStorage.getItem(STAGE_CACHE_KEY);
    if (!cached) return null;
    const { stage: s, ts, uid } = JSON.parse(cached);
    if (uid === userId && Date.now() - ts < CACHE_TTL) {
      return s;
    }
  } catch (_) {}
  return null;
}

/**
 * Liefert die Orb-Wachstumsstufe (1-6) eines Nutzers.
 * Cached in sessionStorage (5 Min TTL) um DB-Last zu minimieren.
 *
 * @param {string|null} userId - UUID des Nutzers
 * @returns {{ stage: number|null, loading: boolean }}
 *   stage ist `null`, solange die echte Stufe noch nicht bekannt ist
 *   (kein Cache-Treffer + RPC noch nicht zurueck). Aufrufende Komponenten
 *   MUESSEN das behandeln (kein Bild rendern / Platzhalter, statt Stufe 1
 *   zu raten).
 */
export function useOrbGrowthStage(userId = null) {
  // Lazy-Initializer: liest den Cache SYNCHRON vor dem ersten Render.
  // Verhindert den Flash bei jedem Re-Mount innerhalb der 5-Minuten-TTL
  // (z.B. Tab-Wechsel, Navigation zurueck zur Home-Page).
  const [stage, setStage] = useState(() => readCachedStage(userId));
  const [loading, setLoading] = useState(() => readCachedStage(userId) == null && !!userId);

  useEffect(() => {
    if (!userId) {
      setStage(null);
      setLoading(false);
      return;
    }

    // Cache erneut pruefen (falls sich userId geaendert hat seit dem
    // initialen Render)
    const cachedNow = readCachedStage(userId);
    if (cachedNow != null) {
      setStage(cachedNow);
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .rpc('rpc_get_orb_growth_stage', { p_user_id: userId });

        if (cancelled) return;

        if (error) {
          console.warn('[orb-growth-stage] RPC error:', error.message);
          // Kein Cache, kein Ergebnis -> stage bleibt null (kein falsches Raten)
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
 * Gibt `null` zurueck, wenn stage null/undefined ist (noch nicht geladen) —
 * Aufrufer MUSS das behandeln (kein Bild rendern statt Stufe 1 zu raten).
 * @param {number|null|undefined} stage
 * @returns {string|null}
 */
export function getOrbStageImage(stage) {
  if (stage == null) return null;
  const s = Math.max(1, Math.min(6, Math.round(stage)));
  return ORB_STAGE_IMAGES[s - 1];
}

/**
 * FIX (2026-08-13): Invalidiert den sessionStorage-Cache der Orb-Stufe fuer
 * einen Nutzer. MUSS von JEDER Aktion aufgerufen werden, die die
 * Aktivitaets-Zaehlung in rpc_get_orb_growth_stage beeinflusst
 * (Talentprofil aktivieren, Werk/Erlebnis posten, Kauf/Buchung abschliessen,
 * Follow) — sonst zeigt der Orb bis zu 5 Minuten (CACHE_TTL) die alte,
 * veraltete Stufe, obwohl die DB bereits die neue Stufe liefern wuerde.
 * Ohne Aufruf hier bleibt der naechste useOrbGrowthStage()-Aufruf auf dem
 * gecachten (falschen) Wert haengen, bis die TTL ablaeuft oder die
 * sessionStorage-Session neu startet.
 *
 * @param {string|null} userId
 */
export function invalidateOrbStageCache(userId) {
  if (!userId) return;
  try {
    const cached = sessionStorage.getItem(STAGE_CACHE_KEY);
    if (!cached) return;
    const parsed = JSON.parse(cached);
    if (parsed?.uid === userId) {
      sessionStorage.removeItem(STAGE_CACHE_KEY);
    }
  } catch (_) {
    // Bei Parse-Fehlern sicherheitshalber komplett entfernen
    try { sessionStorage.removeItem(STAGE_CACHE_KEY); } catch (_) {}
  }
}
