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
// ERLEBNIS-BUCHEN.1 (2026-08-15): analog TalentBookingFlow — eager Import,
// existierende ExperienceBookingFlow.jsx (bereits von DiscoverPage/Home.jsx
// genutzt) wiederverwendet statt einer neuen Komponente (Charta Prinzip 1+2).
import ExperienceBookingFlow from "../components/commerce/ExperienceBookingFlow.jsx";
import PostFullscreenView from "../components/shared/PostFullscreenView.jsx";
import { useModalRegistration } from "../hooks/useModalRegistration.js";
import { toast } from "../lib/useToast.jsx";
import { useTranslation } from "../hooks/useTranslation.js";

const ContentPreviewContext = createContext(null);

export function ContentPreviewProvider({ children }) {
  const { t } = useTranslation();
  const [item, setItem]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [talentBooking, setTalentBooking] = useState(null); // _raw des gebuchten Talents
  const [experienceBooking, setExperienceBooking] = useState(null); // normalisiertes Item des gebuchten Erlebnisses

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
  const openRef = useCallback(async ({ type, id }, opts) => {
    if (!type || !id) return false;
    setLoading(true);
    const loaded = await loadPreviewByRef(type, id);
    setLoading(false);
    if (loaded) { setItem(loaded); return true; }
    // B9/B10-SSOT-FIX (2026-09-05, Michael-Report "hhhh"-Notification): Click
    // auf eine Notification/Resonanz-Zeile, deren referenzierter Inhalt
    // inzwischen geloescht wurde, endete hier in einem STILLEN No-Op (nichts
    // passierte). Da ALLE Deep-Link-Pfade (Notifications, Meine Resonanz,
    // Liveticker, gespeicherte Beitraege) durch diese EINE Funktion laufen,
    // ist hier der SSOT-Ort fuer die sichtbare Rueckmeldung -- alle Aufrufer
    // bekommen sie automatisch, kein Einzelpatch pro Aufrufstelle noetig.
    // Ausnahme: Aufrufer mit EIGENER Fehlerbehandlung (App.jsx/
    // AuthenticatedApp.jsx Deep-Link-Routen rendern ContentUnavailablePage
    // bzw. navigieren zu Home) uebergeben opts.silent=true, damit es keine
    // Doppel-Meldung gibt. Rueckgabewert true/false bleibt unveraendert.
    if (!opts?.silent) toast.info(t("preview.contentRemoved"));
    return false;
  }, [t]);

    const close = useCallback(() => setItem(null), []);
  const openTalentBooking = useCallback((raw) => setTalentBooking(raw), []);
  const closeTalentBooking = useCallback(() => setTalentBooking(null), []);
  const openExperienceBooking = useCallback((item) => setExperienceBooking(item), []);
  const closeExperienceBooking = useCallback(() => setExperienceBooking(null), []);
  // Back-Button: Content-Preview registrieren
  useModalRegistration(!!item, close, "ContentPreview");
  useModalRegistration(!!talentBooking, closeTalentBooking, "TalentBooking-Flow");
  useModalRegistration(!!experienceBooking, closeExperienceBooking, "ExperienceBooking-Flow");

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
    <ContentPreviewContext.Provider value={useMemo(() => ({ open, openRef, close, item, loading, openTalentBooking, openExperienceBooking }), [open, openRef, close, item, loading, openTalentBooking, openExperienceBooking])}>
      {children}
      <ContentPreviewSheet item={isPost ? null : item} loading={loading} onClose={close} onBookTalent={openTalentBooking} onBookExperience={openExperienceBooking} />
      {talentBooking && (
        <TalentBookingFlow talent={talentBooking} onClose={closeTalentBooking} />
      )}
      {experienceBooking && (
        <ExperienceBookingFlow experience={experienceBooking} onClose={closeExperienceBooking} />
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
