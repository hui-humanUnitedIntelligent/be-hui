// LazyImage.jsx — HUI Performance Component
// Lazy loading + progressive + WebP + Blur-up
// v3: stallTimer-Bugfix + sauberes visibilitychange cleanup
//  - visibilitychange fallback wenn IntersectionObserver nach Idle einfriert
//  - 8s skeleton timeout als Sicherheitsnetz
//  - sentryCapture für stalled loading
//  - FIXES: visibilityTimerRef für cleanup, stale closure fix via Ref
// Kein visuelles Redesign — nur bessere Stabilität

import React, { useState, useEffect, useRef } from 'react';
import { optimizeImg } from '../lib/perfUtils';
import { sentryCapture } from '../lib/sentry';

export default function LazyImage({
  src,
  alt = '',
  style = {},
  className = '',
  width,
  quality = 80,
  fallback = null,
  onLoad: onLoadProp,
  onError: onErrorProp,
  ...rest
}) {
  const [loaded,  setLoaded]  = useState(false);
  const [visible, setVisible] = useState(false);
  const [error,   setError]   = useState(false);
  const imgRef    = useRef(null);
  const wrapRef   = useRef(null);
  const mountedRef = useRef(true);

  // ── Timer Refs — alle Timers zentralisiert ────────────────────
  // FIX: stallTimer war nicht per useRef verwaltet → ReferenceError
  // Alle Timers als Refs: sauber clearable, kein Scope-Problem
  const loadStartRef       = useRef(null);
  const timeoutRef         = useRef(null);   // 8s skeleton-Timeout
  const visibilityTimerRef = useRef(null);   // 400ms IO-Freeze-Recovery Timer (NEU)
  const obsRef             = useRef(null);
  // visibleRef: spiegelt visible State für Closures (Stale-Closure-Fix)
  const visibleRef         = useRef(false);

  const optimized = visible && src
    ? optimizeImg(src, { w: width || 800, q: quality })
    : null;

  // ── Mount/Unmount Cleanup ─────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    visibleRef.current = false;
    return () => {
      mountedRef.current = false;
      // FIX: alle Timers beim Unmount clearen — kein dangling timer
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (visibilityTimerRef.current) {
        clearTimeout(visibilityTimerRef.current);
        visibilityTimerRef.current = null;
      }
      if (obsRef.current) {
        obsRef.current.disconnect();
        obsRef.current = null;
      }
    };
  }, []);

  // visibleRef synchron halten (Stale-Closure-Fix)
  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  // ── IntersectionObserver + visibilitychange fallback ─────────
  // Problem (iPad Safari): Nach langem Background-Idle friert der
  // IntersectionObserver ein und feuert nie wieder.
  // Fix: visibilitychange → wenn Tab sichtbar + noch nicht visible
  // → force setVisible(true) nach kurzem Delay.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    // Fallback: kein IO Support
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    // IntersectionObserver
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && mountedRef.current) {
        setVisible(true);
        visibleRef.current = true;
        obs.disconnect();
        obsRef.current = null;
      }
    }, { rootMargin: '300px', threshold: 0 });

    obs.observe(el);
    obsRef.current = obs;

    // visibilitychange fallback — iPad Safari IO-Freeze Recovery
    // FIX A: visibilityTimerRef statt anonymem setTimeout
    // FIX B: visibleRef.current statt veraltetes visible (Stale-Closure-Fix)
    function onVisibility() {
      if (document.visibilityState !== 'visible') return;
      // FIX: visibleRef.current statt visible (Closure-Bug)
      if (visibleRef.current || !mountedRef.current) return;

      // IO könnte eingefroren sein → nach 400ms Force-load
      // FIX: Timer via Ref → sauber clearable
      if (visibilityTimerRef.current) {
        clearTimeout(visibilityTimerRef.current);
      }
      visibilityTimerRef.current = setTimeout(() => {
        visibilityTimerRef.current = null;
        if (!mountedRef.current || visibleRef.current) return;
        try {
          const rect = wrapRef.current?.getBoundingClientRect();
          if (!rect) { setVisible(true); return; }
          const inViewport = rect.top < window.innerHeight + 600;
          if (inViewport) setVisible(true);
        } catch {
          setVisible(true);
        }
      }, 400);
    }

    document.addEventListener('visibilitychange', onVisibility, { passive: true });

    return () => {
      // FIX: symmetrisches cleanup — addEventlistener / removeEventListener
      obs.disconnect();
      obsRef.current = null;
      document.removeEventListener('visibilitychange', onVisibility);
      // FIX: visibilityTimer clearen wenn Effect re-runs
      if (visibilityTimerRef.current) {
        clearTimeout(visibilityTimerRef.current);
        visibilityTimerRef.current = null;
      }
    };
  }, [src]);   // src-Dep: bei neuem src → IO neu aufsetzen

  // ── Skeleton-Timeout: >8s → force loaded ─────────────────────
  // Sicherheitsnetz: wenn Bild-Load nach 8s noch nicht abgeschlossen
  // → skeleton entfernen statt permanent hängen zu bleiben.
  useEffect(() => {
    if (!visible || loaded || error) return;
    loadStartRef.current = Date.now();
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      if (!mountedRef.current || loaded || error) return;
      const stalledMs = Date.now() - (loadStartRef.current || 0);
      sentryCapture(new Error('LazyImage loading stalled'), {
        source:          'LazyImage.skeletonTimeout',
        src_prefix:      src?.slice(0, 60) ?? null,
        stalled_ms:      stalledMs,
        document_hidden: document.hidden,
      });
      setError(true);
    }, 8000);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [visible, loaded, error, src]);

  function handleLoad() {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    setLoaded(true);
    visibleRef.current = true;
    onLoadProp?.();
  }

  function handleError() {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    setError(true);
    onErrorProp?.();
  }

  const wrapStyle = {
    position: 'relative',
    overflow: 'hidden',
    background: 'rgba(0,0,0,0.06)',
    ...style,
  };

  const imgStyle = {
    width: '100%',
    height: '100%',
    objectFit: style.objectFit || 'cover',
    objectPosition: style.objectPosition || 'center',
    display: 'block',
    transition: 'opacity .4s ease, filter .4s ease',
    opacity: loaded ? 1 : 0,
    filter: loaded ? 'none' : 'blur(8px)',
    willChange: 'opacity',
  };

  if (error && !fallback) {
    return (
      <div ref={wrapRef} style={{
        ...wrapStyle,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(0,0,0,0.2)', fontSize: 24,
      }}>
        🖼
      </div>
    );
  }

  if (error && fallback) {
    return (
      <div ref={wrapRef} style={wrapStyle}>
        <img src={fallback} alt={alt} style={{ ...imgStyle, opacity: 1, filter: 'none' }} />
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={className} style={wrapStyle}>
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg,rgba(0,0,0,0.05) 25%,rgba(0,0,0,0.09) 50%,rgba(0,0,0,0.05) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmerSkel 1.6s ease-in-out infinite',
        }}/>
      )}
      {optimized && (
        <img
          ref={imgRef}
          src={optimized}
          alt={alt}
          style={imgStyle}
          onLoad={handleLoad}
          onError={handleError}
          decoding="async"
          loading="lazy"
          {...rest}
        />
      )}
      <style>{`
        @keyframes shimmerSkel {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

/**
 * LazySection — renders children only when scrolled into view.
 */
export function LazySection({ children, fallback = null, rootMargin = '400px' }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { rootMargin, threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref}>
      {visible ? children : fallback}
    </div>
  );
}