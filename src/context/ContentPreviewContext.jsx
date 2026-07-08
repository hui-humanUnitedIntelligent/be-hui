// ContentPreviewContext — EIN geteilter Oeffnen-Mechanismus fuer JEDE
// Karte in der App (Feed, Discover, Empfehlungen, Liveticker).
// Warum ein Context: dieselbe Vorschau muss von ueberall aus aufrufbar
// sein, ohne durch 5 Prop-Ebenen durchgereicht zu werden (FeedRouter →
// ReactionCard → FeedList → UnifiedFeed → Home.jsx waere allein fuer
// den Feed schon 4 Ebenen extra gewesen). Ein Provider hoch im Baum +
// useContentPreview() darunter loest das strukturell -- exakt dasselbe
// Muster wie SavedPostsContext/LiveTickerContext.
import React, { createContext, useCallback, useContext, useState } from "react";
import { loadPreviewByRef } from "../lib/contentPreviewLoaders.js";
import ContentPreviewSheet from "../components/shared/ContentPreviewSheet.jsx";

const ContentPreviewContext = createContext(null);

export function ContentPreviewProvider({ children }) {
  const [item, setItem]       = useState(null);
  const [loading, setLoading] = useState(false);

  // open: item ist bereits vollstaendig normalisiert (Feed/Discover/
  // Empfehlungen haben ihre Datenzeile schon im Speicher).
  const open = useCallback((normalizedItem) => {
    if (!normalizedItem) return;
    setItem(normalizedItem);
  }, []);

  // openRef: nur {type,id} bekannt (Liveticker) -- laedt schlank nach.
  const openRef = useCallback(async ({ type, id }) => {
    if (!type || !id) return;
    setLoading(true);
    const loaded = await loadPreviewByRef(type, id);
    setLoading(false);
    if (loaded) setItem(loaded);
  }, []);

  const close = useCallback(() => setItem(null), []);

  return (
    <ContentPreviewContext.Provider value={{ open, openRef, close, item, loading }}>
      {children}
      <ContentPreviewSheet item={item} loading={loading} onClose={close} />
    </ContentPreviewContext.Provider>
  );
}

export function useContentPreview() {
  const ctx = useContext(ContentPreviewContext);
  if (!ctx) {
    return { open: () => {}, openRef: async () => {}, close: () => {}, item: null, loading: false };
  }
  return ctx;
}
