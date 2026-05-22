// src/lib/world/tabVisibilityController.js — Phase 16.4
// SINGLE SOURCE OF TRUTH for tab visibility.
//
// RULES:
//   1. Tab visibility derived ONLY from (activeTab, activeSurface).
//   2. When activeSurface === null → activeTab is ALWAYS fully visible.
//   3. No hidden refs, no cached visibility, no stale opacity.
//   4. Surface dims content via dimStyle overlay (fixed, sibling to scroll container).
//      Individual tab divs only control whether THIS tab is the active one.

// ─── Timing ────────────────────────────────────────────────────────────────
const TAB_TRANSITION = "opacity 0.28s cubic-bezier(0.22,1,0.36,1)";

// ─── getTabStyle ───────────────────────────────────────────────────────────
// Returns CSS object for a tab-level div wrapper.
// ONLY controls active/inactive visibility — surface dimming is via dimStyle.
//
// @param {string}      tabId         — "feed"|"discover"|"impact"|"favorites"
// @param {string}      activeTab     — current active tab
// @param {string|null} activeSurface — null = no surface open
export function getTabStyle(tabId, activeTab, activeSurface) {
  const isActive = tabId === activeTab;

  // When surface is active: dim overlay covers everything visually.
  // Tab divs: active tab stays opacity:1 (dim overlay darkens it),
  //           inactive tabs: opacity:0 + no pointer-events.
  // pointerEvents: none for ALL tabs when surface active.
  if (activeSurface !== null) {
    return {
      opacity:       isActive ? 1 : 0,
      pointerEvents: "none",       // surface captures all interaction
      userSelect:    "none",
      transition:    TAB_TRANSITION,
      willChange:    "opacity",
    };
  }

  // No surface — active tab: fully visible. Inactive: hidden.
  // INVARIANT: when activeSurface===null, activeTab MUST have opacity:1.
  return {
    opacity:       isActive ? 1 : 0,
    pointerEvents: isActive ? "auto" : "none",
    userSelect:    isActive ? "auto" : "none",
    transition:    TAB_TRANSITION,
    willChange:    "opacity",
  };
}

// ─── getTabVisualState ─────────────────────────────────────────────────────
// Full descriptor for debugging.
export function getTabVisualState(tabId, activeTab, activeSurface) {
  const isActive   = tabId === activeTab;
  const surfActive = activeSurface !== null;
  return {
    tabId,
    isActive,
    visible:       isActive && !surfActive,
    opacity:       isActive ? 1 : 0,
    pointerEvents: surfActive ? "none" : (isActive ? "auto" : "none"),
    transform:     "none",
    zIndex:        isActive ? 1 : 0,
    activeSurface: activeSurface ?? "none",
    activeTab,
  };
}

// ─── useTabStyles ──────────────────────────────────────────────────────────
// React hook — returns all 4 tab styles. Pure derivation, no state/effects.
//
// Usage:
//   const { tabFeed, tabDiscover, tabImpact, tabFavorites } =
//     useTabStyles(tab, activeSurface);
export function useTabStyles(activeTab, activeSurface) {
  return {
    tabFeed:      getTabStyle("feed",      activeTab, activeSurface),
    tabDiscover:  getTabStyle("discover",  activeTab, activeSurface),
    tabImpact:    getTabStyle("impact",    activeTab, activeSurface),
    tabFavorites: getTabStyle("favorites", activeTab, activeSurface),
  };
}
