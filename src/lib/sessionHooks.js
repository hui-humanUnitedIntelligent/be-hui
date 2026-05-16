// sessionHooks.js — HUI Session & Persistence Layer v1.0
// Phase 2D: Scroll memory, draft persistence, presence
//
// ENTHÄLT:
// - useScrollMemory: merkt scroll position pro key
// - useDraftPersist: auto-saved drafts in localStorage
// - usePresence:     leichtes online/zuletzt-aktiv system
// - useTabKeepAlive: verhindert unmount bei Tab-Wechsel
// - useSoftLoad:     fade-in statt harte lade-Sprünge

import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "./supabaseClient";

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
// usePresence
// Leichtes Presence-System — sehr subtil, kein Gamer-Look
//
// - Setzt "last_seen" alle 2 Minuten in Supabase
// - Liest "last_seen" für einen anderen User
// - Gibt zurück: status ("online"|"recently"|"away"|"offline")
// ────────────────────────────────────────────────────────────────
export function usePresence(userId) {
  const [presenceStatus, setPresenceStatus] = useState("offline");

  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    async function checkPresence() {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("last_seen")
          .eq("id", userId)
          .single();
        if (!mounted || !data?.last_seen) return;
        const diffMin = (Date.now() - new Date(data.last_seen).getTime()) / 60000;
        if      (diffMin < 5)   setPresenceStatus("online");
        else if (diffMin < 60)  setPresenceStatus("recently");
        else if (diffMin < 720) setPresenceStatus("away");
        else                     setPresenceStatus("offline");
      } catch { /* silent */ }
    }

    checkPresence();
    const interval = setInterval(checkPresence, 3 * 60 * 1000); // alle 3 min
    return () => { mounted = false; clearInterval(interval); };
  }, [userId]);

  return presenceStatus;
}

// useOwnPresence — setzt eigene last_seen
export function useOwnPresence(userId) {
  useEffect(() => {
    if (!userId) return;

    async function touch() {
      try {
        await supabase.from("profiles")
          .update({ last_seen: new Date().toISOString() })
          .eq("id", userId);
      } catch { /* silent */ }
    }

    // Sofort beim Mount + dann alle 2 Minuten
    touch();
    const interval = setInterval(touch, 2 * 60 * 1000);

    // Bei Tab-Aktivierung
    const onVisible = () => { if (!document.hidden) touch(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId]);
}

// Presence Label + Color — für UI-Nutzung
export function getPresenceLabel(status) {
  switch (status) {
    case "online":    return { text: "Aktiv",              color: "#10B981", dot: true };
    case "recently":  return { text: "Kürzlich aktiv",     color: "#F59E0B", dot: true };
    case "away":      return { text: "",                   color: "transparent", dot: false };
    case "offline":   return { text: "",                   color: "transparent", dot: false };
    default:          return { text: "",                   color: "transparent", dot: false };
  }
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
// Nutze display:none statt unmount
//
// Usage:
//   const style = useTabKeepAlive(tab === "feed");
//   <div style={style}> <DiscoveryFeed .../> </div>
// ────────────────────────────────────────────────────────────────
export function useTabKeepAlive(isActive) {
  return {
    display: isActive ? "block" : "none",
    // Wenn nicht aktiv: pointer-events off + aria hidden
    pointerEvents: isActive ? "auto" : "none",
    userSelect: isActive ? "auto" : "none",
  };
}

// ────────────────────────────────────────────────────────────────
// useSessionRestore
// Speichert activeTab in sessionStorage
// Stellt bei App-Reload den letzten Tab wieder her
// ────────────────────────────────────────────────────────────────
export function useSessionRestore(defaultTab = "feed") {
  const [tab, setTabState] = useState(() => {
    return sessionStorage.getItem("hui_active_tab") || defaultTab;
  });

  const setTab = useCallback((newTab) => {
    sessionStorage.setItem("hui_active_tab", newTab);
    setTabState(newTab);
  }, []);

  return [tab, setTab];
}
