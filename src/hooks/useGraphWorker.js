// src/hooks/useGraphWorker.js
// HUI — Graph Worker Hook — Phase 6A.4
// ═══════════════════════════════════════════════════════════════
//
// ZWECK:
// Lädt graphWorker.js als Web Worker.
// Graph-Berechnungen laufen im Background — Main Thread frei.
//
// FALLBACK:
// Wenn Web Workers nicht verfügbar (SSR, alte Browser):
// Berechnungen laufen synchron im Main Thread.
//
// API:
//   const { enrich, scoreItems, ready } = useGraphWorker();
//   const { creators, bridges } = await enrich(creators, userProfile, moodKey);
// ═══════════════════════════════════════════════════════════════

import { useRef, useEffect, useCallback, useState } from 'react';

const WORKER_TIMEOUT = 5000;  // 5s max pro Job

export function useGraphWorker() {
  const workerRef  = useRef(null);
  const pendingRef = useRef(new Map());  // id → { resolve, reject, timer }
  const [ready,    setReady]    = useState(false);
  const [fallback, setFallback] = useState(false);
  const idCounter  = useRef(0);

  useEffect(() => {
    // Web Workers verfügbar?
    if (typeof Worker === 'undefined') {
      setFallback(true);
      return;
    }

    try {
      // Vite: ?worker URL für dynamische Worker-Imports
      const worker = new Worker(
        new URL('../lib/workers/graphWorker.js', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (e) => {
        const { type, id, payload } = e.data;
        const pending = pendingRef.current.get(id);
        if (!pending) return;

        clearTimeout(pending.timer);
        pendingRef.current.delete(id);

        if (type === 'ERROR') {
          pending.reject(new Error(payload?.message || 'Worker error'));
        } else {
          pending.resolve(payload);
        }
      };

      worker.onerror = (err) => {
        console.error('[GraphWorker] Error:', err.message);
        // Alle pending Jobs ablehnen
        for (const [id, pending] of pendingRef.current.entries()) {
          clearTimeout(pending.timer);
          pending.reject(new Error('Worker crashed'));
          pendingRef.current.delete(id);
        }
        setFallback(true);
      };

      workerRef.current = worker;

      // Ping zum Testen
      const testId = ++idCounter.current;
      const timer  = setTimeout(() => { setFallback(true); }, 2000);
      pendingRef.current.set(testId, {
        resolve: () => { clearTimeout(timer); setReady(true); },
        reject:  () => { setFallback(true); },
        timer,
      });
      worker.postMessage({ type: 'PING', id: testId });

    } catch (err) {
      console.warn('[GraphWorker] Not available, using fallback:', err.message);
      setFallback(true);
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      for (const p of pendingRef.current.values()) clearTimeout(p.timer);
      pendingRef.current.clear();
    };
  }, []);

  // Generische Worker-Anfrage
  const postJob = useCallback((type, payload) => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || fallback) {
        // Fallback: synchron im Main Thread
        reject(new Error('use_fallback'));
        return;
      }

      const id    = ++idCounter.current;
      const timer = setTimeout(() => {
        pendingRef.current.delete(id);
        reject(new Error(`Worker timeout: ${type}`));
      }, WORKER_TIMEOUT);

      pendingRef.current.set(id, { resolve, reject, timer });
      workerRef.current.postMessage({ type, payload, id });
    });
  }, [fallback]);

  // Creators anreichern (Graph + Bridge + Score)
  const enrich = useCallback(async (creators, userProfile, moodKey) => {
    try {
      return await postJob('ENRICH_CREATORS', { creators, userProfile, moodKey });
    } catch (err) {
      if (err.message === 'use_fallback') {
        // Synchroner Fallback
        const { communityAffinity, creatorBridgeScore, detectSoftClusters } =
          await import('@/lib/graph/index');
        const clusterMap = detectSoftClusters(creators);
        const enriched = creators.map(c => {
          const clusters = clusterMap.get(c.id) || {};
          const { bridgeScore } = creatorBridgeScore(c, [], clusters);
          return { ...c, _clusters: clusters, _bridgeScore: bridgeScore };
        });
        return { creators: enriched, bridges: enriched.filter(c => c._bridgeScore > 0.35) };
      }
      throw err;
    }
  }, [postJob]);

  // Items scoren
  const scoreItems = useCallback(async (items, userProfile, moodKey) => {
    try {
      return await postJob('SCORE_ITEMS', { items, userProfile, moodKey });
    } catch (err) {
      if (err.message === 'use_fallback') {
        const { relevanceScore } = await import('@/lib/discovery/index');
        const scored = items.map(i => ({
          ...i,
          _workerScore: relevanceScore(i, { mood: moodKey, userProfile }),
        })).sort((a, b) => b._workerScore - a._workerScore);
        return { items: scored };
      }
      throw err;
    }
  }, [postJob]);

  return {
    ready:     ready || fallback,
    fallback,
    enrich,
    scoreItems,
  };
}
