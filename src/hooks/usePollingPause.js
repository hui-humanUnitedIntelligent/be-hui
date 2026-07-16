// src/hooks/usePollingPause.js — Sprint 13 Phase 5
// Shared helpers to pause HTTP polling while the tab is hidden.

import { useEffect, useRef } from "react";

/**
 * Interval that skips ticks while document.hidden.
 * Fires once when the tab becomes visible again (catch-up).
 */
export function useIdleAwareInterval(callback, intervalMs, enabled = true) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!enabled || !intervalMs) return;

    const tick = () => {
      if (!document.hidden) cbRef.current();
    };

    const id = setInterval(tick, intervalMs);

    const onVisible = () => {
      if (!document.hidden) cbRef.current();
    };
    document.addEventListener("visibilitychange", onVisible, { passive: true });

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs, enabled]);
}
