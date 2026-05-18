// src/lib/performance/index.js
// HUI — Performance Utilities — Phase 4D
// ═══════════════════════════════════════════════════════════════
// throttle, debounce, useMemoizedFeed, useThrottledCallback,
// useVisibilityPause, useStableCallback, useScrollThrottle,
// useRealtimeBatch, createFeedNormalizer
// ═══════════════════════════════════════════════════════════════

import { useRef, useCallback, useEffect, useMemo, useState } from 'react';

// ── throttle ─────────────────────────────────────────────────────
// Führt fn maximal 1× pro `wait` ms aus.
// .cancel() — bricht pending trailing calls ab (Memory-Leak-safe).
// .flush()  — führt sofort aus wenn pending.
export function throttle(fn, wait = 100) {
  let last      = 0;
  let trailingT = null;
  let lastArgs  = null;

  function invoke(args) {
    last = Date.now();
    return fn.apply(this, args);
  }

  function throttled(...args) {
    const now      = Date.now();
    const remaining = wait - (now - last);
    lastArgs = args;

    if (remaining <= 0) {
      // Sofort ausführen
      if (trailingT) { clearTimeout(trailingT); trailingT = null; }
      invoke(args);
    } else if (!trailingT) {
      // Trailing call: nach remaining ms ausführen
      trailingT = setTimeout(() => {
        trailingT = null;
        if (lastArgs) { invoke(lastArgs); lastArgs = null; }
      }, remaining);
    }
  }

  // cancel: pending trailing call abbrechen
  throttled.cancel = function () {
    if (trailingT) { clearTimeout(trailingT); trailingT = null; }
    last = 0; lastArgs = null;
  };

  // flush: sofort ausführen wenn pending
  throttled.flush = function () {
    if (trailingT) {
      clearTimeout(trailingT); trailingT = null;
      if (lastArgs) { invoke(lastArgs); lastArgs = null; }
    }
  };

  return throttled;
}

// ── debounce ─────────────────────────────────────────────────────
// Führt fn erst aus wenn `wait` ms ohne weiteren Aufruf vergangen.
// .cancel() — verhindert pending Ausführung.
// .flush()  — führt sofort aus wenn pending.
export function debounce(fn, wait = 300) {
  let timer   = null;
  let lastArgs = null;

  function debounced(...args) {
    lastArgs = args;
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, lastArgs);
      lastArgs = null;
    }, wait);
  }

  debounced.cancel = function () {
    clearTimeout(timer); timer = null; lastArgs = null;
  };

  debounced.flush = function () {
    if (timer) {
      clearTimeout(timer); timer = null;
      if (lastArgs) { fn.apply(this, lastArgs); lastArgs = null; }
    }
  };

  return debounced;
}

// ── useStableCallback ─────────────────────────────────────────────
// Stabile Callback-Referenz — immer die neueste fn, nie neue Referenz.
// Ersetzt useCallback([...all-deps]) anti-pattern.
//
// Usage:
//   const handlePress = useStableCallback((item) => navigate(item))
export function useStableCallback(fn) {
  const ref = useRef(fn);
  useEffect(() => { ref.current = fn; }); // nach jedem render syncen
  return useCallback((...args) => ref.current(...args), []); // stabile Referenz
}

// ── useThrottledCallback ──────────────────────────────────────────
// Throttled useCallback — verhindert Realtime-Storms.
//
// Usage:
//   const handleNotif = useThrottledCallback((payload) => setState(...), 200)
export function useThrottledCallback(fn, wait = 100, deps = []) {
  const throttled = useRef(throttle(fn, wait));
  useEffect(() => {
    throttled.current = throttle(fn, wait);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return useCallback((...args) => throttled.current(...args), []);
}

// ── useDebouncedCallback ──────────────────────────────────────────
// Debounced useCallback — für Suche, Typing-Indicators etc.
export function useDebouncedCallback(fn, wait = 300, deps = []) {
  const debounced = useRef(debounce(fn, wait));
  useEffect(() => {
    debounced.current = debounce(fn, wait);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return useCallback((...args) => debounced.current(...args), []);
}

// ── useVisibilityPause ────────────────────────────────────────────
// Pausiert Realtime-Callbacks wenn Tab/App nicht sichtbar.
// Verhindert unnötige Updates im Hintergrund.
//
// Usage:
//   const { visible, whenVisible } = useVisibilityPause()
//   const handleRT = whenVisible((payload) => setState(...))
export function useVisibilityPause() {
  const [visible, setVisible] = useState(!document.hidden);

  useEffect(() => {
    const handler = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', handler, { passive: true });
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  const whenVisible = useCallback((fn) => {
    return (...args) => {
      if (!document.hidden) fn(...args);
    };
  }, []);

  return { visible, whenVisible };
}

// ── useRealtimeBatch ─────────────────────────────────────────────
// Sammelt Realtime-Events und verarbeitet sie gebündelt.
// Verhindert Render-Storms bei vielen gleichzeitigen Events.
//
// Usage:
//   const batch = useRealtimeBatch((events) => setItems(prev => [...prev, ...events]), 50)
//   // In Realtime-Handler:
//   batch.push(payload.new)
export function useRealtimeBatch(processFn, waitMs = 50) {
  const buffer   = useRef([]);
  const timerRef = useRef(null);
  const fnRef    = useRef(processFn);
  useEffect(() => { fnRef.current = processFn; });

  const flush = useCallback(() => {
    if (buffer.current.length === 0) return;
    const batch = [...buffer.current];
    buffer.current = [];
    timerRef.current = null;
    fnRef.current(batch);
  }, []);

  const push = useCallback((item) => {
    buffer.current.push(item);
    if (!timerRef.current) {
      timerRef.current = setTimeout(flush, waitMs);
    }
  }, [flush, waitMs]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { push, flush };
}

// ── useMemoizedFeed ───────────────────────────────────────────────
// Verhindert Feed-Neuaufbau wenn sich Daten nicht geändert haben.
// Vergleicht via JSON-Hash der IDs.
//
// Usage:
//   const stableFeed = useMemoizedFeed(rawFeedItems)
export function useMemoizedFeed(items) {
  const prevHashRef = useRef('');
  const prevItemsRef = useRef([]);

  return useMemo(() => {
    if (!Array.isArray(items)) return prevItemsRef.current;
    // Hash via IDs — sehr schnell
    const hash = items.map(i => i?.id || i?.key || '').join(',');
    if (hash === prevHashRef.current) return prevItemsRef.current; // stabile Referenz
    prevHashRef.current  = hash;
    prevItemsRef.current = items;
    return items;
  }, [items]);
}

// ── useScrollThrottle ─────────────────────────────────────────────
// Throttled Scroll-Handler — verhindert Layout Thrashing.
//
// Usage:
//   const handleScroll = useScrollThrottle((e) => setScrollY(e.target.scrollTop), 16)
export function useScrollThrottle(fn, wait = 16) {
  return useThrottledCallback(fn, wait);
}

// ── useRAFCallback ───────────────────────────────────────────────
// Führt Callback im nächsten Animation Frame aus.
// Für DOM-Reads und Animations-Scheduling.
export function useRAFCallback(fn) {
  const rafRef = useRef(null);
  const fnRef  = useRef(fn);
  useEffect(() => { fnRef.current = fn; });

  return useCallback((...args) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => fnRef.current(...args));
  }, []);
}

// ── createFeedNormalizer ──────────────────────────────────────────
// Memoized Feed-Transformation — teuer nur beim ersten Mal.
// Identische IDs → identisches Ergebnis ohne Re-Map.
export function createFeedNormalizer(transformFn) {
  const cache = new Map();

  return function normalize(items) {
    if (!Array.isArray(items)) return [];
    return items.map(item => {
      const key = item?.id;
      if (key && cache.has(key)) {
        const cached = cache.get(key);
        // Nur neu transformieren wenn updated_at sich geändert hat
        if (cached._updated === item.updated_at) return cached._result;
      }
      const result = transformFn(item);
      if (key) cache.set(key, { _updated: item.updated_at, _result: result });
      // Cache-Größe begrenzen
      if (cache.size > 500) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      return result;
    }).filter(Boolean);
  };
}

// ── useImageLazyLoad ─────────────────────────────────────────────
// IntersectionObserver-basiertes Lazy Loading.
// Verhindert das Laden von Off-Screen-Bildern.
export function useImageLazyLoad(src, { rootMargin = '200px', enabled = true } = {}) {
  const [loaded, setLoaded]   = useState(false);
  const [imgSrc, setImgSrc]   = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!enabled || !src) return;
    if (!window.IntersectionObserver) { setImgSrc(src); return; }

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setImgSrc(src);
        obs.disconnect();
      }
    }, { rootMargin });

    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [src, rootMargin, enabled]);

  return { ref, imgSrc, loaded, onLoad: () => setLoaded(true) };
}

// ── useMemoryCleanup ─────────────────────────────────────────────
// Bereinigt große Arrays/Objekte beim Unmount.
// Für Mobile — verhindert Memory Pressure.
export function useMemoryCleanup(...refs) {
  useEffect(() => {
    return () => {
      refs.forEach(ref => {
        if (ref?.current) {
          if (Array.isArray(ref.current)) ref.current.length = 0;
          else ref.current = null;
        }
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
