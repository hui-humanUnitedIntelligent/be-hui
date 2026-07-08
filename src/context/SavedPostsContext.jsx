// SavedPostsContext — einzige, appweit geteilte saved_posts-Instanz.
// Zweck: EIN globaler isSaved()/toggleSave()-Zustand fuer Feed, Suche,
// Detailseite, Profil und Gemerkte Inhalte -- ueberall derselbe aktive
// Bookmark-Status, weil alle denselben useSavedPosts()-Aufruf teilen.
// Warum ein Context noetig ist: useSavedPosts() oeffnet einen eigenen
// Realtime-Channel (saved_posts_count:<uid>). Wuerde jede Komponente ihn
// direkt aufrufen (z.B. jede Feed-Karte einzeln), kollidieren mehrere
// Instanzen auf demselben Topic-Namen -- exakt der Crash, der bereits
// einmal gefixt wurde (siehe useReactions.jsx-Kommentare). Ein einziger
// Provider hoch im Baum + useContext() darunter verhindert das strukturell.
// Keine neue Tabelle, kein neuer Channel, keine zweite Datenquelle --
// nur eine korrekte, einmalige Instanziierung des bestehenden Hooks.
import React, { createContext, useContext } from "react";
import { useSavedPosts } from "../lib/useReactions.jsx";

const SavedPostsContext = createContext(null);

export function SavedPostsProvider({ children }) {
  const value = useSavedPosts();
  return (
    <SavedPostsContext.Provider value={value}>
      {children}
    </SavedPostsContext.Provider>
  );
}

// Zweck: Zugriff auf { savedIds, toggleSave, isSaved, count } ohne eigene
// Subscription zu oeffnen. Muss innerhalb von <SavedPostsProvider> genutzt
// werden (in App.jsx einmalig gemountet).
export function useSavedPostsContext() {
  const ctx = useContext(SavedPostsContext);
  if (!ctx) {
    // Fallback statt Crash: Komponente ausserhalb des Providers gerendert
    // (z.B. isolierte Test-Route) -- lieber "nichts gemerkt" anzeigen als
    // die App zu brechen.
    return { savedIds: new Set(), toggleSave: async () => {}, isSaved: () => false, count: 0 };
  }
  return ctx;
}
