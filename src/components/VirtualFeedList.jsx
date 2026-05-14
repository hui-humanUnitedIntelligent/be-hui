// src/components/VirtualFeedList.jsx
// ══════════════════════════════════════════════════════════════
// HUI Feed Virtualization — vollständig unsichtbar für Nutzer
//
// Architektur:
//  • useVirtualizer mit externem .hui-scroll Container
//  • Nur sichtbare + overscan Items im DOM
//  • Variable Höhen via measureElement (auto-gemessen)
//  • Graceful fallback wenn Container nicht verfügbar
//  • Keine visuellen Änderungen — identische Card-Ausgabe
//
// WICHTIG: Kein Design-Code hier. Nur Virtualisierungs-Logik.
// ══════════════════════════════════════════════════════════════

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

// ─── Util: findet den .hui-scroll Container im DOM ───────────
function findScrollContainer() {
  return document.querySelector('.hui-scroll') || null;
}

// ─── Hook: gibt stable Ref auf hui-scroll zurück ─────────────
function useHuiScrollContainer() {
  const ref = useRef(null);
  useEffect(() => {
    ref.current = findScrollContainer();
  }, []);
  return ref;
}

// ══════════════════════════════════════════════════════════════
// VirtualFeedList
// Rendert nur sichtbare Items aus einer flachen Liste.
// Props:
//   items[]           — flaches Array aller Feed-Items
//   renderItem(item, index) → JSX
//   estimatedSize     — Schätzung Itemhöhe in px (default 440)
//   overscan          — Items außerhalb Viewport (default 3)
//   onEndReached      — Callback wenn 85% gescrollt
// ══════════════════════════════════════════════════════════════
export default function VirtualFeedList({
  items,
  renderItem,
  estimatedSize = 440,
  overscan      = 3,
  onEndReached,
}) {
  const scrollRef = useHuiScrollContainer();
  const [ready,   setReady] = useState(false);

  // Warte bis Container im DOM ist
  useEffect(() => {
    const el = findScrollContainer();
    if (el) { scrollRef.current = el; setReady(true); return; }
    // Retry — auf langsamen Geräten kurz warten
    const t = setTimeout(() => {
      scrollRef.current = findScrollContainer();
      setReady(true);
    }, 80);
    return () => clearTimeout(t);
  }, []);

  const virtualizer = useVirtualizer({
    count:            items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize:     () => estimatedSize,
    overscan,
    // measureElement: echte Höhe nach Render messen
    measureElement:   (el) => {
      if (!el) return estimatedSize;
      return el.getBoundingClientRect().height || estimatedSize;
    },
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize    = virtualizer.getTotalSize();

  // End-reached detection — bei 85% Scroll-Position
  useEffect(() => {
    if (!onEndReached || !items.length) return;
    const last = virtualItems[virtualItems.length - 1];
    if (last && last.index >= items.length - Math.max(3, overscan + 1)) {
      onEndReached();
    }
  }, [virtualItems, items.length, onEndReached, overscan]);

  // Fallback: wenn Container nicht ready → normales Rendering
  // Verhindert leeren Screen auf alten Geräten
  if (!ready || !scrollRef.current) {
    return (
      <>
        {items.slice(0, 12).map((item, i) => (
          <React.Fragment key={item?.id ?? i}>
            {renderItem(item, i)}
          </React.Fragment>
        ))}
      </>
    );
  }

  return (
    // Outer div nimmt die Gesamthöhe aller virtuellen Items ein
    // → Scrollbar bleibt immer korrekt skaliert
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
            // translateY statt top — GPU-composited, kein Layout-Reflow
            transform: `translateY(${vItem.start}px)`,
            // will-change nur während scroll aktiv setzen wäre ideal,
            // aber hier static OK da virtualize sowieso GPU nutzt
          }}
        >
          {renderItem(items[vItem.index], vItem.index)}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// FeedEndSentinel
// IntersectionObserver trigger für infinite scroll.
// Sauber: observer wird beim unmount getrennt.
// ══════════════════════════════════════════════════════════════
export function FeedEndSentinel({ onVisible, loading }) {
  const observerRef = useRef(null);

  const sentinelRef = useCallback(node => {
    // Cleanup vorheriger observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) onVisible?.();
      },
      { rootMargin: '400px' } // früh triggern — 400px vor Sichtbarkeit
    );
    obs.observe(node);
    observerRef.current = obs;
  }, [loading, onVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  return <div ref={sentinelRef} style={{ height: 1, width: '100%' }} aria-hidden="true" />;
}

// ══════════════════════════════════════════════════════════════
// useHuiFeedVirtualizer
// Hook für Komponenten die direkten Zugriff auf den Virtualizer
// brauchen (z.B. für scroll-to-index).
// ══════════════════════════════════════════════════════════════
export function useHuiFeedVirtualizer(count, estimatedSize = 440) {
  const scrollRef = useHuiScrollContainer();
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollRef.current,
    estimateSize:     () => estimatedSize,
    overscan:         3,
  });
  return virtualizer;
}
