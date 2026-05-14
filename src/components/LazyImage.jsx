// LazyImage.jsx — HUI Performance Component
// Lazy loading + progressive + WebP + Blur-up
// Kein visuelles Redesign — nur bessere Performance

import React, { useState, useEffect, useRef } from 'react';
import { optimizeImg } from '../lib/perfUtils';

/**
 * LazyImage — drop-in replacement für <img>
 * - IntersectionObserver lazy loading
 * - Blur-up placeholder (kein Layout-Shift)
 * - WebP via optimizeImg
 * - onError fallback
 *
 * Usage:
 *   <LazyImage src={url} alt="..." style={{ width:'100%', height:200, objectFit:'cover' }} />
 */
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
  const imgRef  = useRef(null);
  const wrapRef = useRef(null);

  const optimized = visible && src
    ? optimizeImg(src, { w: width || 800, q: quality })
    : null;

  // IntersectionObserver — load when near viewport
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        obs.disconnect();
      }
    }, { rootMargin: '300px', threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  function handleLoad() {
    setLoaded(true);
    onLoadProp?.();
  }

  function handleError() {
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

  // If error + no fallback → grey box
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
      {/* Skeleton pulse while not visible / not loaded */}
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
 * Use for heavy sections (maps, charts, video) that shouldn't block initial render.
 *
 * Usage:
 *   <LazySection fallback={<Skeleton />}>
 *     <HeavyChart />
 *   </LazySection>
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
