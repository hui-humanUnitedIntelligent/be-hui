import { IX } from "../../design/hui.interaction.js";

// src/lib/world/tabVisibilityController.js — Phase 16.4 + Search Experience 2.0
// SINGLE SOURCE OF TRUTH for tab visibility.
//
// RULES:
//   1. Tab visibility derived ONLY from (activeTab, activeSurface, searchActive).
//   2. When activeSurface === null → activeTab is ALWAYS fully visible.
//   3. No hidden refs, no cached visibility, no stale opacity.
//   4. Surface dims content via dimStyle overlay (fixed, sibling to scroll container).
//      Individual tab divs only control whether THIS tab is the active one.
//   5. Search Experience 2.0 (2026-07-06, Lars): waehrend die globale Suche
//      aktiv ist (searchActive=true), wird der "feed"-Tab unabhaengig vom
//      tatsaechlichen activeTab erzwungen sichtbar -- Suchergebnisse sind
//      tab-uebergreifend (dieselbe UnifiedFeed-Instanz zeigt sie, egal ob der
//      Nutzer zuvor auf Home/Entdecken/Impact/Favoriten war). Das ist eine
//      Erweiterung DIESER einen Wahrheitsquelle, keine zweite Visibility-Logik.

// ─── Timing ────────────────────────────────────────────────────────────────
// Phase 22: HUI Interaction Language
const TAB_TRANSITION = `opacity ${IX.DUR.page}ms ${IX.EASE.cinematic}, transform ${IX.DUR.page}ms ${IX.EASE.cinematic}`;

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
// @param {boolean}     searchActive  — true while the global search is engaged;
//                                      forces "feed" to be the visually active tab
export function getTabStyle(tabId, activeTab, activeSurface, searchActive = false) {
  const effectiveActiveTab = searchActive ? "feed" : activeTab;
  const isActive = tabId === effectiveActiveTab;

  // Inactive tab: pulled OUT of document flow via position:absolute.
  // Still mounted (keep-alive), but takes NO height → active tab is always at top.
  if (!isActive) {
    return {
      position:      "absolute",
      top:           0,
      left:          0,
      width:         "100%",
      height:        0,           // ← KEY FIX: kein Platz im Scroll-Container
      overflow:      "hidden",    // ← KEY FIX: kein sichtbarer Inhalt
      opacity:       0,
      transform:     "translateY(4px) scale(0.999)",
      pointerEvents: "none",
      userSelect:    "none",
      transition:    TAB_TRANSITION,
      zIndex:        0,
    };
  }

  // Active tab: normal document flow, fully visible.
  // pointerEvents: none if surface is open (surface overlay captures interaction)
  return {
    position:      "relative",
    opacity:       1,
    transform:     "translateY(0) scale(1)",
    pointerEvents: activeSurface !== null ? "none" : "auto",
    userSelect:    activeSurface !== null ? "none" : "auto",
    transition:    TAB_TRANSITION,
    zIndex:        "auto",
  };
}

// ─── getTabVisualState ─────────────────────────────────────────────────────
// Full descriptor for debugging.
export function getTabVisualState(tabId, activeTab, activeSurface, searchActive = false) {
  const effectiveActiveTab = searchActive ? "feed" : activeTab;
  const isActive   = tabId === effectiveActiveTab;
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
    searchActive,
  };
}

// ─── useTabStyles ──────────────────────────────────────────────────────────
// React hook — returns all 4 tab styles. Pure derivation, no state/effects.
//
// Usage:
//   const { tabFeed, tabDiscover, tabImpact, tabFavorites } =
//     useTabStyles(tab, activeSurface, searchActive);
export function useTabStyles(activeTab, activeSurface, searchActive = false) {
  return {
    tabFeed:      getTabStyle("feed",      activeTab, activeSurface, searchActive),
    tabDiscover:  getTabStyle("discover",  activeTab, activeSurface, searchActive),
    tabImpact:    getTabStyle("impact",    activeTab, activeSurface, searchActive),
    tabFavorites: getTabStyle("favorites", activeTab, activeSurface, searchActive),
  };
}
