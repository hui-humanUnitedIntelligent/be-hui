// src/components/VirtualFeedList.jsx
// ════════════════════════════════════════════════════════════════
// HUI Feed Virtualization — vollständig unsichtbar für Nutzer
//
// Strategie:
//  • scrollContainerRef als Prop — kein DOM-Scan
//  • fallbackSelector als String-Alternative (".df-scroll")
//  • Nur ~10-12 DOM-Knoten statt alle Items
//  • overscan: 5 → flüssiges Scrollen ohne Leerstellen
//  • measureElement → echte variable Höhen nach Render
//  • Stable translateY statt top → GPU-composited, kein Reflow
//  • Graceful fallback: kein Container → rendert erste 15 Items
//
// KEIN DESIGN-CODE — nur Virtualisierungslogik
// ════════════════════════════════════════════════════════════════

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

// ─── VirtualFeedList ─────────────────────────────────────────────
// Props:
//   items[]              — flaches Array aller Feed-Items
//   renderItem(item, i)  — (item, index) => JSX
//   scrollContainerRef   — React Ref auf den scrollbaren Container (bevorzugt)
//   fallbackSelector     — CSS-Selektor als Fallback (z.B. ".df-scroll")
//   estimatedSize        — Schätzung Itemhöhe px (default: 520)
//   overscan             — Items über/unter Viewport (default: 5)
//   onEndReached         — Callback wenn letzte Items sichtbar werden
export default function VirtualFeedList({
  items,
  renderItem,
  scrollContainerRef: externalRef,
  fallbackSelector,
  estimatedSize = 520,
  overscan      = 5,
  onEndReached,
}) {
  const internalRef   = useRef(null);
  const [ready, setReady] = useState(false);

  // Ref-Auflösung: extern > fallbackSelector > intern
  const getScrollEl = useCallback(() => {
    if (externalRef?.current) return externalRef.current;
    if (fallbackSelector) return document.querySelector(fallbackSelector);
    return internalRef.current;
  }, [externalRef, fallbackSelector]);

  // Warte bis Container wirklich im DOM ist
  useEffect(() => {
    const el = getScrollEl();
    if (el) { setReady(true); return; }
    // Retry für Safari — Container kann leicht verzögert mounten
    let tries = 0;
    const interval = setInterval(() => {
      tries++;
      if (getScrollEl() || tries >= 10) {
        clearInterval(interval);
        setReady(true);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [getScrollEl]);

  const virtualizer = useVirtualizer({
    count:            items.length,
    getScrollElement: getScrollEl,
    estimateSize:     () => estimatedSize,
    overscan,
    // Echte Höhe nach Render messen — verhindert Layout-Sprünge
    measureElement:   (el) => {
      if (!el) return estimatedSize;
      return el.getBoundingClientRect().height || estimatedSize;
    },
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize    = virtualizer.getTotalSize();

  // End-reached: triggern wenn letzte sichtbare Items nahe Ende
  useEffect(() => {
    if (!onEndReached || !items.length || !virtualItems.length) return;
    const lastVisible = virtualItems[virtualItems.length - 1];
    if (lastVisible && lastVisible.index >= items.length - Math.max(overscan, 3)) {
      onEndReached();
    }
  }, [virtualItems, items.length, onEndReached, overscan]);

  // Graceful Fallback — wenn Container noch nicht ready oder kein Container
  if (!ready) {
    return (
      <div>
        {items.slice(0, 8).map((item, i) => (
          <React.Fragment key={item?.id ?? i}>
            {renderItem(item, i)}
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    // Outer-Div: nimmt Gesamthöhe aller virtuellen Items ein
    // → Scrollbar-Thumb bleibt korrekt skaliert
    // → position:relative ist der Anker für absolutepositionierte Items
    <div style={{ height: totalSize, position: 'relative', width: '100%' }}>
      {virtualItems.map(vItem => (
        <div
          key={vItem.key}
          data-index={vItem.index}
          ref={virtualizer.measureElement}
          style={{
            position:  'absolute',
            top:       0,
            left:      0,
            width:     '100%',
            // GPU-composited transform — kein Layout-Reflow beim Scrollen
            transform: `translateY(${vItem.start}px)`,
          }}
        >
          {renderItem(items[vItem.index], vItem.index)}
        </div>
      ))}
    </div>
  );
}

// ─── FeedEndSentinel ─────────────────────────────────────────────
// IntersectionObserver-trigger für Infinite Scroll.
// Sauber: Observer wird bei unmount getrennt.
// rootMargin: 500px → lädt früh genug für nahtlose Erfahrung
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
