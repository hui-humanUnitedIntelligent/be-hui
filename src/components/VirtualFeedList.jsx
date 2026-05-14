// src/components/VirtualFeedList.jsx
// ════════════════════════════════════════════════════════════════
// HUI Feed Virtualization — Hook-Order-Safe v4
//
// WICHTIG — React Hook Rules:
//   Alle Hooks (useState, useEffect, useRef, useCallback, useVirtualizer)
//   müssen BEDINGUNGSLOS und in fixer Reihenfolge aufgerufen werden.
//   Early returns sind AUSSCHLIESSLICH nach dem letzten Hook erlaubt.
//
// Architektur:
//   1. Alle Hooks (immer, keine Bedingung)
//   2. virtualItems / totalSize berechnen
//   3. Render-Entscheidung (empty / fallback / virtualized)
// ════════════════════════════════════════════════════════════════

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { sentryCapture } from '../lib/sentry';

// ─── SafeVirtualRow ──────────────────────────────────────────────
// Normales React-Component (keine Hooks) → early returns erlaubt
function SafeVirtualRow({ renderItem, item, index, virtualKey, start, measureEl }) {
  if (item == null) return null;

  let content = null;
  try {
    content = renderItem(item, index);
  } catch (err) {
    const eventId = sentryCapture(err, {
      source:     'VirtualFeedList.SafeVirtualRow',
      item_id:    item?.id   ?? null,
      item_type:  item?.type ?? 'unknown',
      item_index: index,
    });
    console.error(
      '[VirtualFeedList] renderItem crash index=' + index +
      ' type=' + (item?.type ?? '?') +
      ' sentry=' + (eventId || 'not sent'),
      err
    );
    return null;
  }

  if (content == null) return null;

  return (
    <div
      data-index={index}
      ref={measureEl}
      style={{
        position:  'absolute',
        top:       0,
        left:      0,
        width:     '100%',
        transform: 'translateY(' + start + 'px)',
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
  // ══════════════════════════════════════════════════════════════
  // ALLE HOOKS HIER — keine early returns vorher, keine Bedingungen
  // ══════════════════════════════════════════════════════════════

  const internalRef    = useRef(null);
  const mountedRef     = useRef(true);
  const virtualizerRef = useRef(null);
  const [ready, setReady] = useState(false);

  // Hook 1: mounted-guard
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Hook 2: scroll-element resolver (null-safe)
  const getScrollEl = useCallback(() => {
    try {
      if (externalRef?.current) return externalRef.current;
      if (fallbackSelector)     return document.querySelector(fallbackSelector) ?? null;
      return internalRef.current ?? null;
    } catch {
      return null;
    }
  }, [externalRef, fallbackSelector]);

  // Hook 3: container readiness with Safari retry
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
      if (tries >= 20 && mountedRef.current) setReady(true);
    }
    check();
    if (!getScrollEl()) iv = setInterval(check, 50);
    return () => { if (iv) clearInterval(iv); };
  }, [getScrollEl]);

  // Hook 4: visibilitychange → measure() only when visible + ref exists
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState !== 'visible') return;
      const el = getScrollEl();
      if (!el || !virtualizerRef.current) return;
      try { virtualizerRef.current.measure(); } catch { /* ignore */ }
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [getScrollEl]);

  // Hook 5: virtualizer — IMMER aufgerufen, count=0 wenn items leer
  const safeCount = Array.isArray(items) ? items.length : 0;
  const virtualizer = useVirtualizer({
    count: safeCount,
    getScrollElement: () => {
      if (document.hidden) return null;
      return getScrollEl() ?? null;
    },
    estimateSize: () => estimatedSize,
    overscan,
    measureElement: (el) => {
      if (!el || document.visibilityState !== 'visible') return estimatedSize;
      try {
        const h = el.getBoundingClientRect().height;
        return h > 0 ? h : estimatedSize;
      } catch {
        return estimatedSize;
      }
    },
  });

  // Ref fuer visibilitychange-Handler
  virtualizerRef.current = virtualizer;

  // Berechne virtualItems + totalSize NACH Hooks, VOR early returns
  const virtualItems = virtualizer.getVirtualItems();
  const totalSize    = Math.max(virtualizer.getTotalSize(), 0);

  // Hook 6: end-reached trigger — IMMER aufgerufen (guards im body, nicht aussen)
  useEffect(() => {
    if (!onEndReached || safeCount === 0 || virtualItems.length === 0) return;
    const last = virtualItems[virtualItems.length - 1];
    if (!last) return;
    if (last.index >= safeCount - Math.max(overscan, 3)) {
      onEndReached();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [virtualItems, safeCount, onEndReached, overscan]);

  // ══════════════════════════════════════════════════════════════
  // RENDER — erst nach ALLEN Hooks
  // ══════════════════════════════════════════════════════════════

  // Guard: keine items → nichts rendern
  if (safeCount === 0) return null;

  // Guard: container noch nicht bereit → plain fallback (max 8 items)
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
            sentryCapture(err, {
              source:     'VirtualFeedList.fallback',
              item_id:    item?.id   ?? null,
              item_type:  item?.type ?? 'unknown',
              item_index: i,
            });
            console.error('[VirtualFeedList:fallback] crash i=' + i, err);
            return null;
          }
        })}
      </div>
    );
  }

  // Virtualized render
  return (
    <div style={{ height: totalSize, position: 'relative', width: '100%' }}>
      {virtualItems.map(vItem => {
        if (vItem.index >= safeCount) return null;
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
