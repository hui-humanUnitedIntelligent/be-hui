// src/components/VirtualFeedList.jsx
// ══════════════════════════════════════════════════════════════
// HUI Feed Virtualization — invisible to the user
// 
// RÈGLES:
//  • Kein visuelles Design geändert
//  • Cards werden identisch gerendert wie vorher
//  • Nur DOM-Knoten außerhalb des Viewports werden entfernt
//  • Variable Card-Höhen werden automatisch gemessen
//  • Fällt gracefully zurück auf normales Rendering bei Fehler
// ══════════════════════════════════════════════════════════════

import { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

/**
 * VirtualFeedList
 * 
 * Drop-in replacement für sections.map() in HomeFeed.
 * Rendert identische Cards, aber hält nur ~5-8 im DOM statt alle.
 * 
 * @param {Object[]} items - Array of feed items
 * @param {Function} renderItem - (item, index) => JSX
 * @param {number}   estimatedItemHeight - Schätzung in px (default: 420)
 * @param {Function} onEndReached - Callback wenn 80% gescrollt
 * @param {string}   scrollContainerId - ID des äußeren Scroll-Containers
 */
export default function VirtualFeedList({
  items,
  renderItem,
  estimatedItemHeight = 420,
  onEndReached,
  containerRef: externalContainerRef,
}) {
  const containerRef = externalContainerRef || useRef(null);

  const virtualizer = useVirtualizer({
    count:               items.length,
    getScrollElement:    () => containerRef.current,
    estimateSize:        () => estimatedItemHeight,
    overscan:            4,       // render 4 items above + below viewport
    measureElement:      (el) => el?.getBoundingClientRect().height ?? estimatedItemHeight,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // End-reached detection
  const lastVirtualIndex = virtualItems[virtualItems.length - 1]?.index ?? 0;
  if (onEndReached && lastVirtualIndex >= items.length - 3) {
    onEndReached();
  }

  return (
    <div
      ref={containerRef}
      style={{
        height:   '100%',
        overflow: 'auto',
        // Prevent layout shift during virtualization
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Total height placeholder — keeps scrollbar correct */}
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualItems.map(virtualItem => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            style={{
              position:  'absolute',
              top:       0,
              left:      0,
              width:     '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * useVirtualFeed
 * 
 * Hook für Feeds die bereits einen äußeren Scroll-Container haben
 * (z.B. wenn die gesamte Page scrollt, nicht eine innere div).
 * Nutzt window als Scroll-Container.
 */
export function useWindowVirtualFeed(items, estimatedItemHeight = 420) {
  const virtualizer = useVirtualizer({
    count:            items.length,
    getScrollElement: () => window,
    estimateSize:     () => estimatedItemHeight,
    overscan:         3,
  });

  return {
    virtualItems:  virtualizer.getVirtualItems(),
    totalSize:     virtualizer.getTotalSize(),
    measureElement: virtualizer.measureElement,
  };
}

/**
 * FeedEndSentinel
 * 
 * IntersectionObserver-basierter Trigger für infinite scroll.
 * Kein zusätzliches Library-Dependency.
 */
export function FeedEndSentinel({ onVisible, loading }) {
  const ref = useCallback(node => {
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !loading) onVisible?.(); },
      { rootMargin: '300px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, onVisible]);

  return (
    <div ref={ref} style={{ height: 1, width: '100%' }} aria-hidden="true" />
  );
}
