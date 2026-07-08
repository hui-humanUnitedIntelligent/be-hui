// LiveTickerContext — einzige, appweit geteilte Liveticker-Dateninstanz.
// Warum ein Context noetig ist: Home-Tab (Nav-Label "Home", Tab-Key
// "discover") und Entdecken-Tab (Nav-Label "Entdecken", Tab-Key "feed")
// werden beide ueber KEEP_ALIVE_TABS dauerhaft gemountet (nicht erst beim
// Wechsel) -- wuerde jede Seite ihren eigenen useLiveTicker()-Aufruf
// starten, liefe derselbe 60s-Datenabruf ueber 10 Tabellen doppelt
// parallel. Ein einziger Provider hoch im Baum + useContext() darunter
// verhindert das strukturell (gleiches Muster wie SavedPostsContext.jsx).
import React, { createContext, useContext } from "react";
import { useLiveTicker } from "../hooks/useLiveTicker.js";

const LiveTickerContext = createContext(null);

export function LiveTickerProvider({ children }) {
  const value = useLiveTicker();
  return (
    <LiveTickerContext.Provider value={value}>
      {children}
    </LiveTickerContext.Provider>
  );
}

export function useLiveTickerContext() {
  const ctx = useContext(LiveTickerContext);
  if (!ctx) {
    // Fallback statt Crash, falls ausserhalb des Providers gerendert.
    return { items: [], loading: true };
  }
  return ctx;
}
