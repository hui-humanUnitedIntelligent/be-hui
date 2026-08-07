// ContentPreviewContext — EIN geteilter Oeffnen-Mechanismus fuer JEDE
// Karte in der App (Feed, Discover, Empfehlungen, Liveticker).
// Warum ein Context: dieselbe Vorschau muss von ueberall aus aufrufbar
// sein, ohne durch 5 Prop-Ebenen durchgereicht zu werden (FeedRouter →
// ReactionCard → FeedList → UnifiedFeed → Home.jsx waere allein fuer
// den Feed schon 4 Ebenen extra gewesen). Ein Provider hoch im Baum +
// useContentPreview() darunter loest das strukturell -- exakt dasselbe
// Muster wie SavedPostsContext/LiveTickerContext.
//
// FULLSCREEN.1 (2026-07-08): Fuer Beitraege (type==="moment") wird statt
// der ContentPreviewSheet (Bottom Sheet) die neue PostFullscreenView
// gerendert. Alle anderen Typen bleiben unveraendert bei der Sheet.
// Wichtig: open()/openRef()/close() sind fuer ALLE Aufrufer unveraendert
// identisch -- es aendert sich nur, WELCHE Praesentations-Komponente
// intern gerendert wird. Keine neue Navigations-/Oeffnen-Logik fuer die
// Konsumenten (Feed, Discover, Liveticker etc. rufen weiterhin exakt
// dieselben Funktionen wie vorher auf).
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { loadPreviewByRef } from "../lib/contentPreviewLoaders.js";
import { normalizePostForPreview } from "../lib/previewNormalizers.js";
import ContentPreviewSheet from "../components/shared/ContentPreviewSheet.jsx";
// BOOKING-DELAY-FIX (2026-08-07): TalentBookingFlow war React.lazy() +
// <Suspense fallback={null}> — derselbe Bug wie bei WerkWizard/
// ImpactStimmenModal/SettingsModal (siehe Memory #807, #936): waehrend
// der Lazy-Chunk laedt, zeigt fallback={null} GAR NICHTS an. Das darunter
// liegende ContentPreviewSheet ("Talent-Angebot"-Vorschau mit "Talent
// buchen"-Button) blieb daher sichtbar/"verankert" -- der Kalender
// ("Termin waehlen") erschien erst, wenn der Chunk fertig geladen war
// (oft erst nach Schliessen/Wiederoeffnen des ersten Sheets bemerkt).
// Fix: eager (statischer) Import -- Chunk ist Teil des Haupt-Bundles,
// kein Netzwerk-Ladevorgang beim Oeffnen mehr noetig.
import TalentBookingFlow from "../components/talents/TalentBookingFlow.jsx";
import PostFullscreenView from "../components/shared/PostFullscreenView.jsx";
import { useModalRegistration } from "../hooks/useModalRegistration.js";

const ContentPreviewContext = createContext(null);

export function ContentPreviewProvider({ children }) {
  const [item, setItem]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [talentBooking, setTalentBooking] = useState(null); // _raw des gebuchten Talents

  // open: item ist bereits vollstaendig normalisiert (Feed/Discover/
  // Empfehlungen haben ihre Datenzeile schon im Speicher).
  const open = useCallback((normalizedItem) => {
    if (!normalizedItem) return;
    setItem(normalizedItem);
  }, []);

  // openRef: nur {type,id} bekannt (Liveticker, Notification-Routing,
  // DEEPLINK.1 2026-07-09 Tiefen-Links /beitrag,/projekt,/erlebnis,
  // /veranstaltung) -- laedt schlank nach. Gibt seit DEEPLINK.1 zusaetzlich
  // true/false zurueck (gefunden/nicht gefunden) -- additiv, bestehende
  // Aufrufer (die den Rueckgabewert ignorieren) sind unveraendert.
  const openRef = useCallback(async ({ type, id }) => {
    if (!type || !id) return false;
    setLoading(true);
    const loaded = await loadPreviewByRef(type, id);
    setLoading(false);
    if (loaded) { setItem(loaded); return true; }
    return false;
  }, []);

    const close = useCallback(() => setItem(null), []);
  const openTalentBooking = useCallback((raw) => setTalentBooking(raw), []);
  const closeTalentBooking = useCallback(() => setTalentBooking(null), []);
  // Back-Button: Content-Preview registrieren
  useModalRegistration(!!item, close, "ContentPreview");
  useModalRegistration(!!talentBooking, closeTalentBooking, "TalentBooking-Flow");

  // onOpenPost: nur von PostFullscreenView genutzt, um innerhalb der
  // Fullscreen-Ansicht direkt zu "Weitere Beitraege dieses Wirkers" zu
  // wechseln (rohe beitraege-Zeile -> normalisiert -> ersetzt das
  // aktuell offene Item, kein Schliessen+Neu-oeffnen noetig).
  const onOpenPost = useCallback((raw) => {
    const normalized = normalizePostForPreview(raw, "moment");
    if (normalized) setItem(normalized);
  }, []);

  const isPost = item?.type === "moment";

  return (
    <ContentPreviewContext.Provider value={useMemo(() => ({ open, openRef, close, item, loading, openTalentBooking }), [open, openRef, close, item, loading, openTalentBooking])}>
      {children}
      <ContentPreviewSheet item={isPost ? null : item} loading={loading} onClose={close} onBookTalent={openTalentBooking} />
      {talentBooking && (
        <TalentBookingFlow talent={talentBooking} onClose={closeTalentBooking} />
      )}
      <PostFullscreenView item={isPost ? item : null} onClose={close} onOpenPost={onOpenPost} />
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
