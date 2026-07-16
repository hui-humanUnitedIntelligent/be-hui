// sessionHooks.js — HUI Session & Persistence Layer v1.0
// Phase 2D: Scroll memory, draft persistence
//
// ENTHÄLT:
// - useScrollMemory: merkt scroll position pro key
// - useDraftPersist: auto-saved drafts in localStorage
// - useTabKeepAlive: verhindert unmount bei Tab-Wechsel
// - useSoftLoad:     fade-in statt harte lade-Sprünge
//
// Presence: siehe src/lib/usePresence.jsx (user_presence — Sprint 8 Phase 6)

import { useEffect, useRef, useCallback, useState } from "react";

// ────────────────────────────────────────────────────────────────
// useScrollMemory
// Speichert & stellt Scroll-Position wieder her
//
// Usage:
//   const { ref, restore } = useScrollMemory("feed");
//   <div ref={ref} className="hui-scroll"> ...
//   restore() wird beim Mount automatisch aufgerufen
// ────────────────────────────────────────────────────────────────
const _scrollStore = {};  // In-memory (sessionStorage für persistence)

export function useScrollMemory(key) {
  const ref = useRef(null);
  const savedKey = `hui_scroll_${key}`;

  // Restore on mount — smooth, non-jarring
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const saved = parseInt(sessionStorage.getItem(savedKey) || "0", 10);
    if (saved > 0) {
      // requestAnimationFrame verhindert Layout-Thrashing
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.scrollTop = saved;
        });
      });
    }
  }, [savedKey]);

  // Save on scroll — throttled (16ms = 60fps)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let ticking = false;
    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        sessionStorage.setItem(savedKey, String(el.scrollTop));
        ticking = false;
      });
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, [savedKey]);

  const resetScroll = useCallback(() => {
    sessionStorage.removeItem(savedKey);
    if (ref.current) ref.current.scrollTop = 0;
  }, [savedKey]);

  const peekScroll = useCallback(() =>
    parseInt(sessionStorage.getItem(savedKey) || "0", 10), [savedKey]);

  return { ref, resetScroll, peekScroll };
}

// ────────────────────────────────────────────────────────────────
// useDraftPersist
// Auto-saves form state to localStorage, restores on mount
//
// Usage:
//   const [draft, setDraft, clearDraft] = useDraftPersist("moment-create", {
//     caption: "", mood: null, visibility: "public"
//   });
// ────────────────────────────────────────────────────────────────
export function useDraftPersist(key, initialState) {
  const storageKey = `hui_draft_${key}`;

  // Restore from localStorage on first render
  const [draft, setDraftState] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only restore if < 24h old
        if (parsed._ts && Date.now() - parsed._ts < 86400000) {
          const { _ts, ...data } = parsed;
          return { ...initialState, ...data };
        }
      }
    } catch (e) { /* silent — corrupt storage */ }
    return initialState;
  });

  // Auto-save on every change
  const setDraft = useCallback((updater) => {
    setDraftState(prev => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      // Debounced save — don't hammer localStorage
      clearTimeout(setDraft._timer);
      setDraft._timer = setTimeout(() => {
        try {
          localStorage.setItem(storageKey, JSON.stringify({ ...next, _ts: Date.now() }));
        } catch (e) { /* silent — storage full */ }
      }, 500);
      return next;
    });
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setDraftState(initialState);
  }, [storageKey, initialState]);

  const hasDraft = (() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      return !!(parsed._ts && Date.now() - parsed._ts < 86400000);
    } catch { return false; }
  })();

  return [draft, setDraft, clearDraft, hasDraft];
}

// ────────────────────────────────────────────────────────────────
// useSoftFade
// Gibt ein opacity-ready CSS-State zurück für weiche Einblendung
// Usage: const opacity = useSoftFade(isLoading);
//        <div style={{ opacity, transition: "opacity .3s ease" }}>
// ────────────────────────────────────────────────────────────────
export function useSoftFade(loading, delay = 0) {
  const [opacity, setOpacity] = useState(loading ? 0 : 1);

  useEffect(() => {
    if (loading) {
      setOpacity(0);
    } else {
      const t = setTimeout(() => setOpacity(1), delay);
      return () => clearTimeout(t);
    }
  }, [loading, delay]);

  return opacity;
}

// ────────────────────────────────────────────────────────────────
// useTabKeepAlive
// Verhindert dass Tab-Content unmountet wenn Tab gewechselt wird
// Nutze opacity:0 statt unmount (display:none verboten — Phase 16.3)
//
// Usage:
//   const style = useTabKeepAlive(tab === "feed");
//   <div style={style}> <DiscoveryFeed .../> </div>
// ────────────────────────────────────────────────────────────────
export function useTabKeepAlive(isActive) {
  // Phase 16.3: NEVER display:none — feed must stay mounted always.
  // Visibility controlled only via opacity + pointer-events + aria.
  return {
    opacity:       isActive ? 1 : 0,
    pointerEvents: isActive ? "auto" : "none",
    userSelect:    isActive ? "auto" : "none",
    // Accessibility: screen readers skip inactive tabs
    "aria-hidden": isActive ? undefined : true,
    transition:    "opacity 0.32s cubic-bezier(0.22,1,0.36,1)",
    willChange:    "opacity",
  };
}

// ────────────────────────────────────────────────────────────────
// useSessionRestore
//
// Tab-Restore via sessionStorage: Tab bleibt nach Refresh erhalten.
// WICHTIG: Nur Tab-State (feed/discover/impact/favorites) — KEINE
// Overlays (Creator-Dashboard etc.) werden wiederhergestellt.
//
// "creator"-Tab wird NICHT wiederhergestellt — das Creator-Dashboard
// ist ein Overlay das immer geschlossen startet.
// ────────────────────────────────────────────────────────────────
const RESTORABLE_TABS = new Set(["feed", "discover", "impact", "favorites"]);

export function useSessionRestore(defaultTab = "feed") {
  const [tab, setTabState] = useState(defaultTab);
  const restoredRef = useRef(false);

  // Tab aus sessionStorage laden — erst nach Auth-Check.
  // "creator"-Tab wird nie wiederhergestellt (Overlay-Tab).
  const restoreTab = useCallback(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const saved = sessionStorage.getItem("hui_active_tab");
      if (saved && RESTORABLE_TABS.has(saved) && saved !== defaultTab) {
        setTabState(saved);
      }
    } catch (_) {}
  }, [defaultTab]);

  const setTab = useCallback((newTab) => {
    try { sessionStorage.setItem("hui_active_tab", newTab); } catch (_) {}
    setTabState(newTab);
  }, []);

  return [tab, setTab, restoreTab];
}
