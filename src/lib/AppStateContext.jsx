// src/lib/AppStateContext.jsx — ISOLATION STUB
// TEMPORÄR: alle imports disabled um White-Screen-Ursache zu isolieren.
// content.js / resonance / security werden NICHT geladen.
// Wenn die App damit lädt → einer dieser Imports war der Crash.
import React, { createContext, useContext, useState, useCallback } from "react";

const AppStateContext = createContext(null);

const NOOP_STATE = {
  feedItems:       [],
  feedLoading:     false,
  feedError:       null,
  discoverItems:   [],
  discoverLoading: false,
  resonanceMap:    {},
  refreshFeed:     () => {},
  refreshDiscover: () => {},
  giveResonance:   async () => {},
  removeResonance: async () => {},
};

export function AppStateProvider({ children }) {
  return (
    <AppStateContext.Provider value={NOOP_STATE}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState()        { return useContext(AppStateContext) || NOOP_STATE; }
export function useFeedData()        { return { items: [], loading: false, error: null, refresh: () => {} }; }
export function useDiscoverData()    { return { items: [], loading: false, error: null, refresh: () => {} }; }
export function useResonanceState()  { return { map: {}, give: async () => {}, remove: async () => {} }; }
