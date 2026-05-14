// src/components/VirtualFeedList.jsx
// ════════════════════════════════════════════════════════════════
// HUI Feed Virtualization — stabil, kein Design-Code
//
// Fixes v2:
//  • items[vItem.index] immer auf undefined geprüft
//  • measureElement: null-guard + document.hidden-guard
//  • visibilitychange: Virtualizer-Measure nach Tab-Restore
//  • mounted-guard: kein setState nach unmount
//  • stale count: count = items.length (immer aktuell)
//  • getScrollEl: null-safe, kein throw
//  • Fallback: bei fehlendem Container → normales Rendering
// ════════════════════════════════════════════════════════════════

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export default function VirtualFeedList({
  items,
  renderItem,
  scrollContainerRef: externalRef,
  fallbackSelector,
  estimatedSize = 520,
  overscan      = 5,
  onEndReached,
}) {
  const internalRef = useRef(null);
  const mountedRef  = useRef(true);           // ① mounted guard
  const [ready, setReady] = useState(false);

  // ── Cleanup: mounted guard ──────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Ref-Auflösung: extern > fallbackSelector > intern ───────
  // null-safe: gibt null zurück statt zu werfen
  const getScrollEl = useCallback(() => {
    try {
      if (externalRef?.current) return externalRef.current;
      if (fallbackSelector)     return document.querySelector(fallbackSelector) ?? null;
      return internalRef.current ?? null;
    } catch {
      return null;
    }
  }, [externalRef, fallbackSelector]);

  // ── Container-Bereitschaft mit Retry (Safari-Timing) ────────
  useEffect(() => {
    let tries    = 0;
    let interval = null;

    function check() {
      if (!mountedRef.current) return;
      if (getScrollEl()) {
        if (mountedRef.current) setReady(true);
        return;
      }
      tries++;
      // max 20 Versuche × 50ms = 1s Geduld
      if (tries >= 20) {
        // Kein Container gefunden → trotzdem ready setzen (Fallback greift)
        if (mountedRef.current) setReady(true);
      }
    }

    check();
    if (!getScrollEl()) {
      interval = setInterval(check, 50);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [getScrollEl]);

  // ── visibilitychange: Virtualizer nach Tab-Restore refreshen ─
  // Safari friert Intersection Observer + Virtualizer nach Idle ein.
  // Nach Tab-Aktivierung: Maße neu berechnen.
  const virtualizerRef = useRef(null);
  useEffect(() => {
    function onVisibility() {
      if (document.hidden) return;   // Tab wird versteckt — nichts tun
      // Tab wird wieder sichtbar → Virtualizer-Maße invalidieren
      try {
        virtualizerRef.current?.measure();
      } catch { /* ignore */ }
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // ── Virtualizer ──────────────────────────────────────────────
  const virtualizer = useVirtualizer({
    // ② count ist immer items.length (nie stale)
    count: items.length,

    // ③ getScrollElement null-safe
    getScrollElement: () => {
      const el = getScrollEl();
      return el ?? null;
    },

    estimateSize: () => estimatedSize,
    overscan,

    // ④ measureElement: guard gegen null + document.hidden
    measureElement: (el) => {
      if (!el)              return estimatedSize;
      if (document.hidden)  return estimatedSize;   // keine Messung wenn Tab hidden
      try {
        const h = el.getBoundingClientRect().height;
        return h > 0 ? h : estimatedSize;
      } catch {
        return estimatedSize;
      }
    },
  });

  // Ref für visibilitychange-Handler speichern
  virtualizerRef.current = virtualizer;

  const virtualItems = virtualizer.getVirtualItems();
  // ⑤ totalSize guard — nie negativ, verhindert layout-collapse
  const totalSize    = Math.max(virtualizer.getTotalSize(), 0);

  // ── End-reached trigger ──────────────────────────────────────
  useEffect(() => {
    if (!onEndReached || !items.length || !virtualItems.length) return;
    const last = virtualItems[virtualItems.length - 1];
    if (!last) return;
    if (last.index >= items.length - Math.max(overscan, 3)) {
      onEndReached();
    }
  }, [virtualItems, items.length, onEndReached, overscan]);

  // ── Graceful Fallback ────────────────────────────────────────
  // Wenn Container noch nicht bereit: rendern ohne Virtualisierung
  // Zeigt max 8 Items damit kein leerer Screen entsteht
  if (!ready) {
    return (
      <div>
        {items.slice(0, 8).map((item, i) => {
          if (!item) return null;
          return (
            <React.Fragment key={item?.id ?? i}>
              {renderItem(item, i)}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ height: totalSize, position: 'relative', width: '100%' }}>
      {virtualItems.map(vItem => {
        // ⑥ items[vItem.index] guard — undefined wenn items zwischenzeitlich schrumpft
        const item = items[vItem.index];
        if (!item) return null;

        return (
          <div
            key={vItem.key}
            data-index={vItem.index}
            ref={virtualizer.measureElement}
            style={{
              position:  'absolute',
              top:       0,
              left:      0,
              width:     '100%',
              transform: `translateY(${vItem.start}px)`,
            }}
          >
            {renderItem(item, vItem.index)}
          </div>
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
