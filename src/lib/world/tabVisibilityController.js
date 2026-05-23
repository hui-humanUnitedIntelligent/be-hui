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
// Phase 17.1 ROOT CAUSE FIX:
//
// PROBLEM: Inactive tabs (opacity:0) remained in document flow with full height.
// Impact/Discover tab divs rendered BELOW the invisible feed div — outside viewport.
//
// FIX: Inactive tabs → position:absolute, removes from flow, no height contribution.
//      Active tab    → position:relative, normal flow.
//
// This is the standard keep-alive tab pattern (same as browser tab bars,
// React Native TabView, etc.)
//
// @param {string}      tabId         — "feed"|"discover"|"impact"|"favorites"
// @param {string}      activeTab     — current active tab
// @param {string|null} activeSurface — null = no surface open
export function getTabStyle(tabId, activeTab, activeSurface) {
  const isActive = tabId === activeTab;

  // Inactive tab: pulled OUT of document flow via position:absolute.
  // Still mounted (keep-alive), but takes NO height → active tab is always at top.
  if (!isActive) {
    return {
      position:      "absolute",
      top:           0,
      left:          0,
      width:         "100%",
      opacity:       0,
      pointerEvents: "none",
      userSelect:    "none",
      // No transition on position change — instant removal from flow
      // Opacity transition kept for visual polish when switching back
      transition:    TAB_TRANSITION,
      // zIndex:0 ensures active tab (position:relative, z-index:auto) is above
      zIndex:        0,
    };
  }

  // Active tab: normal document flow, fully visible.
  // pointerEvents: none if surface is open (surface overlay captures interaction)
  return {
    position:      "relative",
    opacity:       1,
    pointerEvents: activeSurface !== null ? "none" : "auto",
    userSelect:    activeSurface !== null ? "none" : "auto",
    transition:    TAB_TRANSITION,
    zIndex:        "auto",
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
    visible:       isActive,
    opacity:       isActive ? 1 : 0,
    position:      isActive ? "relative" : "absolute",
    inFlow:        isActive,           // key: inactive tabs are out of document flow
    pointerEvents: !isActive || surfActive ? "none" : "auto",
    zIndex:        isActive ? "auto" : 0,
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
