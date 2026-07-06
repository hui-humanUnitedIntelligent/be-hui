// src/hooks/useRadiusFilter.js
// ══════════════════════════════════════════════════════════════════════
// UMKREISSUCHE — duenner Wrapper um den globalen RadiusContext.
//
// VEREINHEITLICHUNG (2026-07-06, Lars-Ticket "Radius zentral vereinheitlichen"):
// Frueher hielt dieser Hook seinen eigenen React-State (useState) -- jeder
// Aufrufer bekam eine unabhaengige Kopie, die nur ueber localStorage beim
// naechsten Mount synchron wurde. Jetzt ist der State im RadiusProvider
// (src/context/RadiusContext.jsx, an der App-Wurzel in App.jsx montiert)
// ausgelagert. Dieser Hook liest/schreibt nur noch DENSELBEN Context --
// echtes Single-Source-of-Truth, Aenderungen wirken sofort in JEDEM
// Aufrufer (SearchCommandCenter, DiscoverPage/TalenteSection, ...).
//
// WICHTIG: Die oeffentliche API (radiusKm, setRadiusKm, stages,
// defaultRadiusKm, geo, status, requestBrowserLocation, setManualPlace,
// clearLocation, isWorldwide, distanceKm) ist UNVERAENDERT -- kein
// Aufrufer musste angepasst werden ("bestehende Funktionen aendern sich
// nicht"). Neu hinzugekommen: setGeo (fuer DiscoverPage, um eine konkret
// angeklickte Autocomplete-Vorschlagszeile direkt zu setzen).
// ══════════════════════════════════════════════════════════════════════
import { useRadiusContext, RADIUS_OPTIONS, DEFAULT_RADIUS_KM, radiusLabel } from "../context/RadiusContext.jsx";

export { RADIUS_OPTIONS, DEFAULT_RADIUS_KM, radiusLabel };

export function useRadiusFilter() {
  return useRadiusContext();
}

export default useRadiusFilter;
