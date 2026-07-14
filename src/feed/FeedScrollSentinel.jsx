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
import { feedSafariDebug, isFeedDebugEnabled } from "../lib/feedSafariDebug.js";

// ── Bottom Sentinel (triggert loadMore) ──────────────────────────────────────
export function FeedBottomSentinel({ onVisible, enabled = true, scrollRootRef = null }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;
    const scrollRoot = scrollRootRef?.current ?? null;

    // SAFARI FIX: root MUST be the scroll container when feed scrolls inside
    // .hui-scroll — root:null (viewport) misses intersection updates on iOS Safari.
    const observer = new IntersectionObserver(
      ([entry]) => {
        const payload = {
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio,
          rootIsViewport: !scrollRoot,
          scrollRootTag: scrollRoot?.tagName ?? "viewport",
          boundingClientRect: {
            top: Math.round(entry.boundingClientRect.top),
            bottom: Math.round(entry.boundingClientRect.bottom),
          },
        };
        feedSafariDebug.logIoFire(payload);

        if (entry.isIntersecting) {
          feedSafariDebug.logEvent("SENTINEL_VISIBLE", payload);
          onVisible?.();
        }
      },
      {
        root:       scrollRoot,
        rootMargin: "200px",
        threshold:  0,
      }
    );
    observer.observe(el);

    // Debug: parallel viewport-root observer to prove Firefox vs Safari divergence
    let viewportObserver = null;
    if (scrollRoot && isFeedDebugEnabled()) {
      viewportObserver = new IntersectionObserver(
        ([entry]) => {
          feedSafariDebug.logEvent("IO_VIEWPORT_COMPARE", {
            isIntersecting: entry.isIntersecting,
            intersectionRatio: entry.intersectionRatio,
            note: "viewport root — diverges from scroll-root on Safari nested scroll",
          });
        },
        { root: null, rootMargin: "200px", threshold: 0 }
      );
      viewportObserver.observe(el);
    }

    return () => {
      observer.disconnect();
      viewportObserver?.disconnect();
    };
  }, [enabled, onVisible, scrollRootRef]);

  return (
    <div
      ref={ref}
      data-feed-sentinel="true"
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
