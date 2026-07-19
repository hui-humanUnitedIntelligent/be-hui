/**
 * usePullToRefresh — nativer Pull-to-Refresh für HUI (Capacitor/iOS/Android/Web)
 *
 * Strategie:
 * - Touch-Events auf dem Scroll-Container tracken
 * - Nur auslösen wenn: scrollTop==0 UND Pull > THRESHOLD
 * - Visuelles Feedback via CSS-Transform des Scroll-Inhalts
 * - kein mehrfaches Triggern (isRefreshing-Guard)
 *
 * @param {object} opts
 * @param {Function}  opts.onRefresh       — async Callback der beim Pull ausgelöst wird
 * @param {React.Ref} opts.scrollRef       — ref auf den Scroll-Container
 * @param {number}   [opts.threshold=72]   — Mindest-Pull-Distanz in px
 * @param {number}   [opts.maxPull=110]    — Maximale Pull-Distanz (für Rubber-Band-Feeling)
 * @param {boolean}  [opts.enabled=true]   — Hook ein-/ausschalten
 */
import { useState, useRef, useCallback, useEffect } from "react";

const THRESHOLD   = 72;   // px: ab hier löst Refresh aus
const MAX_PULL    = 110;  // px: Rubber-Band-Grenze
const RESIST      = 0.45; // Dämpfungsfaktor → natürliches "Gummi"-Feeling
const MIN_SCROLL  = 0;    // scrollTop muss <= das sein

export function usePullToRefresh({
  onRefresh,
  scrollRef,
  threshold  = THRESHOLD,
  maxPull    = MAX_PULL,
  enabled    = true,
}) {
  const [pullDistance,  setPullDistance]  = useState(0);  // 0-maxPull
  const [isRefreshing,  setIsRefreshing]  = useState(false);
  const [isTriggered,   setIsTriggered]   = useState(false); // visueller "Snap"

  const startYRef       = useRef(null);
  const currentYRef     = useRef(0);
  const pullingRef      = useRef(false);
  const isRefreshingRef = useRef(false); // sync version (kein State-Lag)

  // ── Refresh ausführen ──────────────────────────────────────────
  const doRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    setIsTriggered(true);

    try {
      await onRefresh?.();
    } finally {
      // Kurze Pause damit der Nutzer das Feedback sieht
      await new Promise(r => setTimeout(r, 600));
      setIsRefreshing(false);
      setIsTriggered(false);
      setPullDistance(0);
      isRefreshingRef.current = false;
    }
  }, [onRefresh]);

  // ── Touch-Handler ──────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    const el = scrollRef?.current;
    if (!el) return;

    const canPull = () => {
      if (isRefreshingRef.current) return false;
      // Nur pullen wenn ganz oben (oder fast oben — 2px Toleranz für Sub-Pixel)
      return el.scrollTop <= 2;
    };

    const onTouchStart = (e) => {
      if (!canPull()) return;
      startYRef.current  = e.touches[0].clientY;
      currentYRef.current = e.touches[0].clientY;
      pullingRef.current = false;
    };

    const onTouchMove = (e) => {
      if (startYRef.current === null) return;
      if (isRefreshingRef.current) return;

      const currentY = e.touches[0].clientY;
      const deltaY   = currentY - startYRef.current;
      currentYRef.current = currentY;

      if (deltaY <= 0) {
        // Scrollen nach oben — nicht Pull
        if (pullingRef.current) {
          pullingRef.current = false;
          setPullDistance(0);
        }
        return;
      }

      // Nur wenn scrollTop=0 anfangen zu pullen
      if (!canPull() && !pullingRef.current) return;

      pullingRef.current = true;

      // Rubber-Band: Dämpfung → natürliches Feeling
      const rawPull    = deltaY;
      const dampedPull = rawPull * RESIST;
      const clamped    = Math.min(dampedPull, maxPull);

      setPullDistance(clamped);

      // Scroll des Containers verhindern während wir pullen
      // (nur wenn Pull deutlich nach unten geht)
      if (dampedPull > 5) {
        e.preventDefault();
      }
    };

    const onTouchEnd = () => {
      if (!pullingRef.current) {
        startYRef.current = null;
        return;
      }

      const currentDist = Math.min(
        (currentYRef.current - startYRef.current) * RESIST,
        maxPull
      );

      pullingRef.current = false;
      startYRef.current  = null;

      if (currentDist >= threshold && !isRefreshingRef.current) {
        doRefresh();
      } else {
        // Zurückfedern ohne Refresh
        setPullDistance(0);
        setIsTriggered(false);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove",  onTouchMove,  { passive: false }); // passive:false → preventDefault möglich
    el.addEventListener("touchend",   onTouchEnd,   { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove",  onTouchMove);
      el.removeEventListener("touchend",   onTouchEnd);
    };
  }, [enabled, scrollRef, threshold, maxPull, doRefresh]);

  return {
    pullDistance,  // px — wie weit gezogen (0–maxPull)
    isRefreshing,  // bool — Refresh läuft gerade
    isTriggered,   // bool — Threshold überschritten (Snap-Feedback)
  };
}
