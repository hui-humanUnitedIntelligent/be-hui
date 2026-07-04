// src/core/hui.navigator.js — HUI Centralized Navigation System
// ══════════════════════════════════════════════════════════════
// SINGLE SOURCE OF TRUTH für alle Screen-Transitionen in HUI.
//
// Screens:
//   home             → Feed (default)
//   discover         → Entdecken
//   community        → Messages / Community Hub
//   impact           → Impact Hub
//   creator-dashboard → Profil-AppShell-Tab (interner Key: creator)
//   public-profile   → Social identity view (params: { profileId })
//   story-viewer     → Story playback (params: { storyId, authorId })
//   create-flow      → Create new content (params: { type? })
//   notifications    → Notification center
//
// Usage:
//   const nav = useNavigator();
//   nav.navigate("public-profile", { profileId: "uuid" });
//   nav.navigate("creator-dashboard");
//   nav.goBack();
//   nav.currentScreen  // "home"
//   nav.params         // { profileId: "..." }
// ══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useCallback, useReducer, useRef } from "react";

// ── Screen types ───────────────────────────────────────────────
export const SCREENS = {
  HOME:              "home",
  DISCOVER:          "discover",
  COMMUNITY:         "community",
  IMPACT:            "impact",
  CREATOR_DASHBOARD: "creator-dashboard",
  PUBLIC_PROFILE:    "public-profile",
  STORY_VIEWER:      "story-viewer",
  CREATE_FLOW:       "create-flow",
  NOTIFICATIONS:     "notifications",
};

// ── Tab → Screen mapping ───────────────────────────────────────
export const TAB_TO_SCREEN = {
  feed:     SCREENS.HOME,
  discover: SCREENS.DISCOVER,
  community:SCREENS.COMMUNITY,
  impact:   SCREENS.IMPACT,
  creator:  SCREENS.CREATOR_DASHBOARD,
};

export const SCREEN_TO_TAB = {
  [SCREENS.HOME]:              "feed",
  [SCREENS.DISCOVER]:          "discover",
  [SCREENS.COMMUNITY]:         "community",
  [SCREENS.IMPACT]:            "impact",
  [SCREENS.CREATOR_DASHBOARD]: "creator",
};

// ── Overlay screens (don't change the active tab) ─────────────
export const OVERLAY_SCREENS = new Set([
  SCREENS.PUBLIC_PROFILE,
  SCREENS.STORY_VIEWER,
  SCREENS.CREATE_FLOW,
  SCREENS.NOTIFICATIONS,
]);

// ── State ──────────────────────────────────────────────────────
const INITIAL = {
  currentScreen: SCREENS.HOME,
  params:        {},
  history:       [{ screen: SCREENS.HOME, params: {} }],
};

function reducer(state, action) {
  switch (action.type) {
    case "NAVIGATE": {
      const { screen, params = {} } = action;
      // Don't push duplicate
      if (state.currentScreen === screen && JSON.stringify(state.params) === JSON.stringify(params)) {
        return state;
      }
      const entry = { screen, params };
      return {
        currentScreen: screen,
        params,
        history: [...state.history, entry].slice(-20), // max 20 entries
      };
    }
    case "GO_BACK": {
      if (state.history.length <= 1) return state;
      const newHistory = state.history.slice(0, -1);
      const prev = newHistory[newHistory.length - 1];
      return {
        currentScreen: prev.screen,
        params:        prev.params,
        history:       newHistory,
      };
    }
    case "RESET": {
      return { ...INITIAL };
    }
    default: return state;
  }
}

// ── Context ────────────────────────────────────────────────────
const NavigatorCtx = createContext(null);

export function NavigatorProvider({ children, onTabChange }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const onTabChangeRef = useRef(onTabChange);
  onTabChangeRef.current = onTabChange;

  const navigate = useCallback((screen, params = {}) => {
    dispatch({ type: "NAVIGATE", screen, params });
    // Sync to tab system for non-overlay screens
    const tab = SCREEN_TO_TAB[screen];
    if (tab && !OVERLAY_SCREENS.has(screen)) {
      onTabChangeRef.current?.(tab);
    }
  }, []);

  const goBack = useCallback(() => {
    dispatch({ type: "GO_BACK" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const value = {
    currentScreen: state.currentScreen,
    params:        state.params,
    history:       state.history,
    navigate,
    goBack,
    reset,
    // Convenience
    isOverlay: OVERLAY_SCREENS.has(state.currentScreen),
    canGoBack: state.history.length > 1,
  };

  return <NavigatorCtx.Provider value={value}>{children}</NavigatorCtx.Provider>;
}

export function useNavigator() {
  const ctx = useContext(NavigatorCtx);
  if (!ctx) throw new Error("useNavigator must be inside NavigatorProvider");
  return ctx;
}

// ── Shorthand hooks ────────────────────────────────────────────
export function useScreen() {
  const { currentScreen, params } = useNavigator();
  return { screen: currentScreen, params };
}

export function useNavigateTo() {
  const { navigate } = useNavigator();
  return {
    goHome:            () => navigate(SCREENS.HOME),
    goDiscover:        () => navigate(SCREENS.DISCOVER),
    goCommunity:       () => navigate(SCREENS.COMMUNITY),
    goImpact:          () => navigate(SCREENS.IMPACT),
    goCreatorDashboard:() => navigate(SCREENS.CREATOR_DASHBOARD),
    openPublicProfile: (profileId) => navigate(SCREENS.PUBLIC_PROFILE, { profileId }),
    openStoryViewer:   (storyId, authorId) => navigate(SCREENS.STORY_VIEWER, { storyId, authorId }),
    openCreateFlow:    (type) => navigate(SCREENS.CREATE_FLOW, { type }),
    openNotifications: () => navigate(SCREENS.NOTIFICATIONS),
  };
}
