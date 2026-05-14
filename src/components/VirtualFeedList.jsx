// src/components/VirtualFeedList.jsx
// ════════════════════════════════════════════════════════════════
// HUI Feed Virtualization — Runtime-Crash-Isolation v3
//
// Architektur:
//  SafeVirtualRow   — try/catch um jeden renderItem-Aufruf
//  VirtualFeedList  — alle render-guards vor virtualizer
//  FeedEndSentinel  — sauberer IO mit cleanup
//
// Guards:
//  - items[index] undefined -> null (kein throw)
//  - renderItem throws -> null (kein Propagation zum App-EB)
//  - document.hidden -> kein render, keine measurements
//  - scrollEl fehlt -> graceful fallback (plain list, max 8)
//  - items.length===0 -> sofort null, kein virtualizer
//  - visibilitychange -> measure() nur wenn visible+ref.current
//  - mounted guard -> kein setState nach unmount
// ════════════════════════════════════════════════════════════════

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

// ─── SafeVirtualRow ──────────────────────────────────────────────
// Isoliert jeden einzelnen Feed-Item-Render.
// Wenn renderItem() wirft: log + return null statt App-Crash.
function SafeVirtualRow({ renderItem, item, index, virtualKey, start, measureEl }) {
  // Guard 1: item undefined
  if (item == null) return null;

  let content = null;
  try {
    content = renderItem(item, index);
  } catch (err) {
    // Log mit kontext — niemals nach oben propagieren
    console.error(
      '[VirtualFeedList] renderItem crash at index=' + index +
      ' type=' + (item?.type ?? 'unknown') +
      ' id=' + (item?.id ?? 'none'),
      err
    );
    return null;
  }

  // Guard 2: renderItem gab null/undefined
  if (content == null) return null;

  return (
    <div
      key={virtualKey}
      data-index={index}
      ref={measureEl}
      style={{
        position:  'absolute',
        top:       0,
        left:      0,
        width:     '100%',
        transform: 'translateY(' + start + 'px)',
        // Keine weiteren Styles — alles Design-frei
      }}
    >
      {content}
    </div>
  );
}

// ─── VirtualFeedList ─────────────────────────────────────────────
export default function VirtualFeedList({
  items,
  renderItem,
  scrollContainerRef: externalRef,
  fallbackSelector,
  estimatedSize = 520,
  overscan      = 5,
  onEndReached,
}) {
  const internalRef    = useRef(null);
  const mountedRef     = useRef(true);
  const virtualizerRef = useRef(null);
  const [ready, setReady] = useState(false);

  // Mounted-guard cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Ref-Aufloesung — null-safe, kein throw
  const getScrollEl = useCallback(() => {
    try {
      if (externalRef?.current) return externalRef.current;
      if (fallbackSelector)     return document.querySelector(fallbackSelector) ?? null;
      return internalRef.current ?? null;
    } catch {
      return null;
    }
  }, [externalRef, fallbackSelector]);

  // Container-Bereitschaft mit Safari-Retry
  useEffect(() => {
    let tries = 0;
    let iv    = null;

    function check() {
      if (!mountedRef.current) return;
      if (getScrollEl()) {
        if (mountedRef.current) setReady(true);
        return;
      }
      tries++;
      if (tries >= 20 && mountedRef.current) {
        // Timeout — Fallback-Modus aktivieren (plain list)
        setReady(true);
      }
    }

    check();
    if (!getScrollEl()) iv = setInterval(check, 50);
    return () => { if (iv) clearInterval(iv); };
  }, [getScrollEl]);

  // visibilitychange — measure() nur wenn visible UND ref existiert
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState !== 'visible') return;
      const el = getScrollEl();
      if (!el) return;                          // kein scrollEl -> skip
      if (!virtualizerRef.current) return;      // kein virtualizer -> skip
      try {
        virtualizerRef.current.measure();
      } catch { /* ignore */ }
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [getScrollEl]);

  // Virtualizer
  const virtualizer = useVirtualizer({
    count: items.length,

    getScrollElement: () => {
      // Guard: nie rendern wenn document.hidden
      if (document.hidden) return null;
      return getScrollEl() ?? null;
    },

    estimateSize: () => estimatedSize,
    overscan,

    measureElement: (el) => {
      if (!el)                                    return estimatedSize;
      if (document.visibilityState !== 'visible') return estimatedSize;
      try {
        const h = el.getBoundingClientRect().height;
        return h > 0 ? h : estimatedSize;
      } catch {
        return estimatedSize;
      }
    },
  });

  // Speichere ref fuer visibilitychange
  virtualizerRef.current = virtualizer;

  // Guard: items leer -> kein render
  if (!items || items.length === 0) return null;

  // Guard: noch nicht ready -> plain fallback (max 8, mit try/catch)
  if (!ready) {
    return (
      <div>
        {items.slice(0, 8).map((item, i) => {
          if (!item) return null;
          try {
            const content = renderItem(item, i);
            return content
              ? <React.Fragment key={item?.id ?? i}>{content}</React.Fragment>
              : null;
          } catch (err) {
            console.error('[VirtualFeedList:fallback] renderItem crash i=' + i, err);
            return null;
          }
        })}
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize    = Math.max(virtualizer.getTotalSize(), 0);

  // End-reached
  useEffect(() => {
    if (!onEndReached || !items.length || !virtualItems.length) return;
    const last = virtualItems[virtualItems.length - 1];
    if (!last) return;
    if (last.index >= items.length - Math.max(overscan, 3)) {
      onEndReached();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [virtualItems, items.length, onEndReached, overscan]);

  return (
    <div style={{ height: totalSize, position: 'relative', width: '100%' }}>
      {virtualItems.map(vItem => {
        // Guard: index out of bounds
        if (vItem.index >= items.length) return null;
        const item = items[vItem.index];

        return (
          <SafeVirtualRow
            key={vItem.key}
            renderItem={renderItem}
            item={item}
            index={vItem.index}
            virtualKey={vItem.key}
            start={vItem.start}
            measureEl={virtualizer.measureElement}
          />
        );
      })}
    </div>
  );
}

// ─── FeedEndSentinel ─────────────────────────────────────────────
export function FeedEndSentinel({ onVisible, loading }) {
  const obsRef = useRef(null);

  const ref = useCallback(node => {
    if (obsRef.current) { obsRef.current.disconnect(); obsRef.current = null; }
    if (!node) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !loading) onVisible?.(); },
      { rootMargin: '500px' }
    );
    obs.observe(node);
    obsRef.current = obs;
  }, [loading, onVisible]);

  useEffect(() => () => { obsRef.current?.disconnect(); }, []);

  return <div ref={ref} style={{ height: 1, width: '100%' }} aria-hidden="true" />;
}
