// src/lib/AppStateContext.jsx — ISOLATION STUB v2
// TEMPORAER: alle imports disabled um White-Screen-Ursache zu isolieren.
// Alle Exports die von Consumern benoetigt werden sind als No-Ops vorhanden.
// Wenn die App damit laedt -> content.js / resonance / security war der Crash.
import React, { createContext, useContext } from "react";

const AppStateContext = createContext(null);

const NOOP = {
  feedItems:       [],
  feedLoading:     false,
  feedError:       null,
  discoverItems:   [],
  discoverLoading: false,
  resonanceMap:    {},
  notifCount:      0,
  refreshFeed:     () => {},
  refreshDiscover: () => {},
  giveResonance:   async () => {},
  removeResonance: async () => {},
  followStatus:    {},
  toggleFollow:    async () => {},
};

export function AppStateProvider({ children }) {
  return (
    <AppStateContext.Provider value={NOOP}>
      {children}
    </AppStateContext.Provider>
  );
}

// Alle Hooks als No-Ops — identische Signatur wie Original
export function useAppState()        { return useContext(AppStateContext) || NOOP; }
export function useFeedData()        { return { items: [], loading: false, error: null, refresh: () => {} }; }
export function useDiscoverData()    { return { items: [], loading: false, error: null, refresh: () => {} }; }
export function useResonanceState()  { return { map: {}, give: async () => {}, remove: async () => {} }; }
export function useNotifCount()      { return 0; }
export function useFollowStatus()    { return { isFollowing: false, toggle: async () => {} }; }
