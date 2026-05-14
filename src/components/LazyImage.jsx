// LazyImage.jsx — HUI Performance Component
// Lazy loading + progressive + WebP + Blur-up
// v2: iPad Safari background resume recovery
//  - visibilitychange fallback wenn IntersectionObserver nach Idle einfriert
//  - 8s skeleton timeout als Sicherheitsnetz
//  - sentryCapture für stalled loading
// Kein visuelles Redesign — nur bessere Performance

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
  // Für Timeout-Tracking
  const loadStartRef   = useRef(null);
  const timeoutRef     = useRef(null);
  const obsRef         = useRef(null);

  const optimized = visible && src
    ? optimizeImg(src, { w: width || 800, q: quality })
    : null;

  // ── Cleanup ──────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      obsRef.current?.disconnect();
    };
  }, []);

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
        obs.disconnect();
        obsRef.current = null;
      }
    }, { rootMargin: '300px', threshold: 0 });

    obs.observe(el);
    obsRef.current = obs;

    // visibilitychange fallback — iPad Safari IO-Freeze Recovery
    function onVisibility() {
      if (document.visibilityState !== 'visible') return;
      if (visible || !mountedRef.current) return;
      // IO könnte eingefroren sein → nach 400ms Force-load
      // (Zeit damit normaler IO noch feuern kann wenn er noch läuft)
      setTimeout(() => {
        if (!mountedRef.current) return;
        // Prüfe ob Element im sichtbaren Bereich liegt
        try {
          const rect = wrapRef.current?.getBoundingClientRect();
          if (!rect) { setVisible(true); return; }
          const inViewport = rect.top < window.innerHeight + 600;
          if (inViewport) {
            console.log('[LazyImage] IO-Freeze recovery: force visible', src?.slice(0, 40));
            setVisible(true);
          }
        } catch {
          setVisible(true);
        }
      }, 400);
    }

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      obs.disconnect();
      obsRef.current = null;
      document.removeEventListener('visibilitychange', onVisibility);
    };
  // visible als Dep damit onVisibility-closure aktuell ist
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // ── Skeleton-Timeout: >8s → force loaded ─────────────────────
  // Sicherheitsnetz: wenn Bild-Load nach 8s noch nicht abgeschlossen
  // → skeleton entfernen statt permanent hängen zu bleiben.
  useEffect(() => {
    if (!visible || loaded || error) return;
    loadStartRef.current = Date.now();
    timeoutRef.current = setTimeout(() => {
      if (!mountedRef.current || loaded || error) return;
      const stalledMs = Date.now() - (loadStartRef.current || 0);
      console.warn('[LazyImage] Loading stalled after ' + Math.round(stalledMs/1000) + 's:', src?.slice(0, 60));
      sentryCapture(new Error('LazyImage loading stalled'), {
        source:      'LazyImage.skeletonTimeout',
        src_prefix:  src?.slice(0, 60) ?? null,
        stalled_ms:  stalledMs,
        document_hidden: document.hidden,
      });
      // Skeleton entfernen — kein Bild erzwingen da src evtl. invalide
      setError(true);
    }, 8000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [visible, loaded, error, src]);

  function handleLoad() {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    setLoaded(true);
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
