// src/lib/world/tabLifecycle.js — HUI Performance Sprint P2
// Intelligent Keep-Alive: tabs stay mounted, background work pauses.
//
// Single control plane for "is this tab fully active?" — derived from the
// same rules as tabVisibilityController (activeTab + searchActive override).

import { useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { useHome } from "../../components/home/HomeShell.jsx";

// ─── Pure helpers (no React) ───────────────────────────────────────────────

export function getEffectiveActiveTab(activeTab, searchActive = false) {
  return searchActive ? "feed" : activeTab;
}

export function isTabActive(tabId, activeTab, searchActive = false) {
  return tabId === getEffectiveActiveTab(activeTab, searchActive);
}

/** LiveTicker is shown on feed + discover — pause polling when neither is active. */
export function isLiveTickerActive(activeTab, searchActive = false) {
  const effective = getEffectiveActiveTab(activeTab, searchActive);
  return effective === "feed" || effective === "discover";
}

// ─── Module-level sync for App-level consumers (LiveTickerProvider) ────────

let _activeTab = "feed";
let _searchActive = false;
const _listeners = new Set();

export function syncTabLifecycleState(activeTab, searchActive) {
  _activeTab = activeTab;
  _searchActive = searchActive;
  _listeners.forEach((fn) => fn());
}

function subscribeTabLifecycle(cb) {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

function getLiveTickerSnapshot() {
  return isLiveTickerActive(_activeTab, _searchActive) && !document.hidden;
}

function getLiveTickerServerSnapshot() {
  return true;
}

export function useLiveTickerActive() {
  return useSyncExternalStore(
    subscribeTabLifecycle,
    getLiveTickerSnapshot,
    getLiveTickerServerSnapshot,
  );
}

// ─── React hooks (require HomeShell context) ───────────────────────────────

export function useTabLifecycle(tabId) {
  const home = useHome();
  const activeTab = home?.tab ?? "feed";
  const searchActive = home?.searchState?.active ?? false;
  const effectiveActiveTab = getEffectiveActiveTab(activeTab, searchActive);
  const isActive = isTabActive(tabId, activeTab, searchActive);

  return {
    isActive,
    paused: !isActive,
    effectiveActiveTab,
    activeTab,
    searchActive,
  };
}

/**
 * Runs effect only while tab is active. Cleans up when paused.
 * Re-runs effect when tab becomes active again (resume).
 */
export function useTabGatedEffect(isActive, effect) {
  useEffect(() => {
    if (!isActive) return undefined;
    return effect();
  }, [isActive, effect]);
}

/**
 * Calls callback once when tab transitions from paused → active.
 * Used for targeted refresh on tab return (no continuous polling).
 */
export function useTabResumeEffect(isActive, callback) {
  const wasActiveRef = useRef(isActive);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      callbackRef.current();
    }
    wasActiveRef.current = isActive;
  }, [isActive]);
}

export function useIsTabActive(tabId) {
  const home = useHome();
  const check = useCallback(
    (id) => isTabActive(id, home?.tab ?? "feed", home?.searchState?.active ?? false),
    [home?.tab, home?.searchState?.active],
  );
  return check(tabId);
}

// ─── CSS: pause animations in background tabs ─────────────────────────────

export const TAB_PAUSE_CSS = `
  [data-tab-paused="true"],
  [data-tab-paused="true"] *,
  [data-tab-paused="true"] *::before,
  [data-tab-paused="true"] *::after {
    animation-play-state: paused !important;
    transition-duration: 0ms !important;
  }
`;
