/**
 * FeedScrollSentinel — Phase 4F
 *
 * Zwei Aufgaben:
 *  1. loadMore() wenn Bottom-Sentinel sichtbar wird (IntersectionObserver)
 *  2. onScrollProgress(ratio) für Prefetch-Trigger bei 70%
 *
 * Kein harter Ladebruch. Kein Pop. Kein Flicker.
 */

import { useEffect, useRef, useCallback } from "react";
import {
  isFeedDiagnosticsActive,
  recordObserverEvent,
} from "./huiFeedRuntimeDiagnostics.js";

// ── Bottom Sentinel (triggert loadMore) ──────────────────────────────────────
export function FeedBottomSentinel({ onVisible, enabled = true, sentinelRef = null }) {
  const ref = useRef(null);

  useEffect(() => {
    if (sentinelRef) sentinelRef.current = ref.current;
  });

  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;
    const diagnostics = isFeedDiagnosticsActive();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (diagnostics) {
          const rect = el.getBoundingClientRect();
          recordObserverEvent(entry.isIntersecting ? "intersecting" : "not_intersecting", {
            isIntersecting: entry.isIntersecting,
            intersectionRatio: entry.intersectionRatio,
            boundingClientRect: {
              top: rect.top,
              bottom: rect.bottom,
              left: rect.left,
              right: rect.right,
              height: rect.height,
            },
            rootBounds: entry.rootBounds ? {
              top: entry.rootBounds.top,
              bottom: entry.rootBounds.bottom,
              height: entry.rootBounds.height,
            } : null,
            enabled,
          });
        }
        if (entry.isIntersecting) {
          if (diagnostics) recordObserverEvent("loadMore_triggered", { enabled });
          onVisible?.();
        }
      },
      {
        root:       null,        // viewport
        rootMargin: "200px",     // 200px Voraus-Trigger (kein harter Bruch)
        threshold:  0,
      }
    );
    observer.observe(el);
    if (diagnostics) recordObserverEvent("observer_connected", { enabled });
    return () => {
      if (diagnostics) recordObserverEvent("observer_disconnected", { enabled });
      observer.disconnect();
    };
  }, [enabled, onVisible]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        height:     1,
        width:      "100%",
        pointerEvents: "none",
        userSelect: "none",
      }}
    />
  );
}

// ── Scroll Progress Tracker (triggert Prefetch bei 70%) ──────────────────────
export function useFeedScrollProgress(scrollContainerRef, onProgress) {
  const rafRef = useRef(null);

  const handleScroll = useCallback(() => {
    if (rafRef.current) return;  // Throttle via rAF
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = scrollContainerRef?.current;
      if (!el) return;
      const scrollTop    = el.scrollTop;
      const scrollHeight = el.scrollHeight;
      const clientHeight = el.clientHeight;
      if (scrollHeight <= clientHeight) return;
      const progress = scrollTop / (scrollHeight - clientHeight);
      onProgress?.(progress);
    });
  }, [scrollContainerRef, onProgress]);

  useEffect(() => {
    const el = scrollContainerRef?.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scrollContainerRef, handleScroll]);
}

// ── Load More Spinner ─────────────────────────────────────────────────────────
export function FeedLoadMoreSpinner({ loading }) {
  if (!loading) return <div style={{ height: 40 }} />;
  return (
    <div style={{
      display:        "flex",
      justifyContent: "center",
      alignItems:     "center",
      padding:        "20px 0 32px",
    }}>
      <div style={{
        width:           28,
        height:          28,
        borderRadius:    "50%",
        border:          "2.5px solid rgba(13,196,181,0.15)",
        borderTopColor:  "#0DC4B5",
        animation:       "huiSpinFeed 0.9s linear infinite",
        opacity:         0.7,
      }} />
      <style>{`
        @keyframes huiSpinFeed {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
