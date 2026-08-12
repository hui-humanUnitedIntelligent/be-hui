// src/lib/searchSuggestions.js — SEARCH-SUGGESTIONS.1 (2026-08-12)
// ══════════════════════════════════════════════════════════════════
// Kategorisierte Live-Suchvorschläge für SearchCommandCenter.jsx.
// Feature-Wunsch Michael: "wenn ich Zu schreibe soll alles was mit Zu
// beginnt angezeigt werden. Personen, Werke, Talent, Erlebnisse, Momente."
// Beispiel aus dem Auftrag: Tippt man "Zi", matcht auch "Armband Zickzack"
// (das Wort "Zickzack" beginnt mit "Zi", auch wenn es nicht das erste Wort
// im Titel ist) -> Wortgrenzen-Präfix-Matching, nicht nur String-Präfix.
//
// ARCHITEKTUR-EINORDNUNG (Prinzip 1 "Erweitern statt duplizieren"):
// SearchCommandCenter.jsx dokumentiert am Dateikopf eine bewusste frühere
// Entscheidung ("Search Experience 2.0", Lars, 2026-07-06): keine eigene
// Ergebnisliste/Overlay mehr -- Ergebnisse laufen ausschliesslich inline
// über den Feed (useFeedStream/searchFilter.js). Dieses Modul repliziert
// das NICHT und ersetzt es nicht -- es ist eine reine Autocomplete-/
// Typeahead-SCHICHT (Vorschläge zum Antippen, kein Ergebnis-Feed), die im
// bereits bestehenden, nicht-portalierten Discovery-Panel angezeigt wird
// (siehe discoveryPanel in SearchCommandCenter.jsx) -- kein neues Overlay,
// keine neue Portal-Ebene, kein Duplikat der Feed-Filterlogik. Klick auf
// einen Vorschlag nutzt ausschliesslich bestehende, etablierte Navigations-
// Hooks (window.__HUI_OPEN_PROFILE__ für Personen, useContentPreview().
// openRef({type,id}) für Werke/Talente/Erlebnisse/Momente) -- exakt das
// gleiche Muster wie NotificationButton.jsx / MyBasisProfile.jsx.
//
// DATENQUELLEN (verifiziert per Live-DB-Abfrage, siehe contentPreviewLoaders.js
// für dieselbe Tabellen-Zuordnung):
//   Personen     -> profiles     (display_name, full_name, username)
//   Werke        -> works        (title)
//   Talente      -> talents      (title)
//   Erlebnisse   -> experiences  (title)
//   Momente      -> beitraege    (caption) -- ungefiltert nach type, exakt
//                    wie MomenteAllModal.jsx es für "Momente" liest.
//
// DATENSCHUTZ: Personen-Query selektiert AUSSCHLIESSLICH nicht-sensible,
// bereits öffentlich einsehbare Felder (id/display_name/full_name/username/
// avatar_url) -- keine sensiblen Profil-Felder (Standing Instruction).
// ══════════════════════════════════════════════════════════════════
import { supabase } from "./supabaseClient.js";

export const SUGGESTIONS_MIN_QUERY_LEN = 2;
const CATEGORY_LIMIT = 4;   // max. angezeigte Treffer pro Kategorie
const FETCH_LIMIT    = 20;  // grosszuegiger DB-Fetch (contains-Suche), danach
                             // Wortgrenzen-Filter + Cut auf CATEGORY_LIMIT

function escapeIlike(s) {
  return String(s || "").replace(/[%_]/g, (m) => "\\" + m);
}

// Findet die Position des ERSTEN Vorkommens von `query` in `text`, das an
// einer Wortgrenze beginnt (Anfang des Strings ODER ein Zeichen, das kein
// Buchstabe/keine Ziffer ist, direkt davor) -- genau das im Auftrag
// beschriebene Verhalten ("Zickzack" matcht bei "Zi", obwohl nicht am
// String-Anfang).
function wordPrefixIndex(text, query) {
  if (!text || !query) return -1;
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  let idx = t.indexOf(q);
  while (idx !== -1) {
    const prevChar = idx === 0 ? "" : t[idx - 1];
    if (idx === 0 || /[^a-z0-9äöüß]/i.test(prevChar)) return idx;
    idx = t.indexOf(q, idx + 1);
  }
  return -1;
}

// Zerlegt `text` an der ersten Wortgrenzen-Treffer-Stelle in {before,match,after}
// -- fuer fettes Highlighting des getippten Präfixes in der UI (Vorgabe:
// "(Zi)mmermann" -- der getippte Teil wird hervorgehoben).
export function highlightMatch(text, query) {
  const safeText = text || "";
  if (!query) return { before: safeText, match: "", after: "" };
  const idx = wordPrefixIndex(safeText, query);
  if (idx === -1) return { before: safeText, match: "", after: "" };
  return {
    before: safeText.slice(0, idx),
    match:  safeText.slice(idx, idx + query.length),
    after:  safeText.slice(idx + query.length),
  };
}

function byWordPrefix(rows, query, getField) {
  return rows
    .filter((r) => wordPrefixIndex(getField(r), query) !== -1)
    .slice(0, CATEGORY_LIMIT);
}

// KORREKTUR 2026-08-12 (Michael-Feedback): frueher wurde currentUser per
// excludeUserId aus den Ergebnissen gefiltert -- das war der Root Cause,
// warum "Michael Mathis" beim Tippen von "michael" NICHT erschien (er IST
// der eingeloggte currentUser). Kein Grund, das eigene Profil aus der
// Namenssuche auszuschliessen -- man soll sich selbst genauso finden
// koennen wie jeden anderen. excludeUserId-Parameter entfernt.
async function searchPeople(query) {
  const esc = escapeIlike(query);
  const { data, error } = await supabase
    .from("profiles")
    .select("id,display_name,full_name,username,avatar_url")
    .or(`display_name.ilike.%${esc}%,full_name.ilike.%${esc}%,username.ilike.%${esc}%`)
    .limit(FETCH_LIMIT);
  if (error || !data) return [];
  const matched = byWordPrefix(data, query, (p) => p.full_name || p.display_name || p.username || "");
  return matched.map((p) => ({
    id: p.id,
    type: "profile",
    label: p.full_name || p.display_name || p.username || "HUI Mitglied",
    avatar: p.avatar_url || null,
  }));
}

async function searchSimpleTitleTable(table, query) {
  const esc = escapeIlike(query);
  const { data, error } = await supabase
    .from(table)
    .select("id,title")
    .ilike("title", `%${esc}%`)
    .limit(FETCH_LIMIT);
  if (error || !data) return [];
  const matched = byWordPrefix(data, query, (r) => r.title || "");
  return matched.map((r) => ({ id: r.id, label: r.title || "" }));
}

async function searchMoments(query) {
  const esc = escapeIlike(query);
  const { data, error } = await supabase
    .from("beitraege")
    .select("id,caption")
    .ilike("caption", `%${esc}%`)
    .limit(FETCH_LIMIT);
  if (error || !data) return [];
  const matched = byWordPrefix(data, query, (r) => r.caption || "");
  return matched.map((r) => ({ id: r.id, label: r.caption || "" }));
}

// ── Orchestrator ─────────────────────────────────────────────────
// Läuft alle Kategorien parallel (Promise.allSettled -- ein Fehler in einer
// Kategorie darf die anderen nie blockieren, gleiche Resilienz-Vorgabe wie
// bei useLiveTicker.js safeCount()). Rückgabe: {people, works, talents,
// experiences, moments} -- jede Liste kann leer sein.
export async function fetchSearchSuggestions(query) {
  const q = (query || "").trim();
  if (q.length < SUGGESTIONS_MIN_QUERY_LEN) {
    return { people: [], works: [], talents: [], experiences: [], moments: [] };
  }
  const [people, works, talents, experiences, moments] = await Promise.allSettled([
    searchPeople(q),
    searchSimpleTitleTable("works", q),
    searchSimpleTitleTable("talents", q),
    searchSimpleTitleTable("experiences", q),
    searchMoments(q),
  ]);
  return {
    people:      people.status      === "fulfilled" ? people.value      : [],
    works:       works.status       === "fulfilled" ? works.value       : [],
    talents:     talents.status     === "fulfilled" ? talents.value     : [],
    experiences: experiences.status === "fulfilled" ? experiences.value : [],
    moments:     moments.status     === "fulfilled" ? moments.value     : [],
  };
}

export function hasAnySuggestions(s) {
  if (!s) return false;
  return (s.people?.length || 0) + (s.works?.length || 0) + (s.talents?.length || 0)
       + (s.experiences?.length || 0) + (s.moments?.length || 0) > 0;
}
