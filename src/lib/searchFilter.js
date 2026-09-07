// src/lib/searchFilter.js
// ─────────────────────────────────────────────────────────────────────────
// HUI SEARCH FILTER — Single Source of Truth für die clientseitige Text-
// und Kategorie-Filterung von Discovery-Inhalten (Home-Feed + Entdecken).
// ─────────────────────────────────────────────────────────────────────────
// BUGFIX (2026-08-11): Die Sucheingabe in SearchCommandCenter hat bisher
// NICHTS gefiltert — weder im Home-Feed (UnifiedFeed erhielt searchQuery/
// typeFilter/categoryFilters als Props, hat sie aber nie in den Destructuring-
// Parametern deklariert und damit komplett ignoriert) noch in DiscoverPage
// (die Props wurden von Home.jsx nie übergeben — DiscoverPage kannte den
// Suchzustand gar nicht). Diese Datei ist die EINZIGE Stelle, die die
// Match-Logik definiert, damit Home-Feed und Entdecken-Seite exakt gleich
// suchen (HUI-Architektur-Charta: "Eine autoritative Quelle pro Bereich",
// keine doppelte Logik).
//
// Rein clientseitiger Filter auf bereits geladenen Daten (kein neuer
// DB-Query/RPC) — additiv, keine Änderung an bestehender Datenladung oder
// bestehenden, funktionierenden Sections/Karten (No-Regression-Protection).

function norm(v) {
  if (v == null) return "";
  // Sanitize: control chars entfernen, max 200 Zeichen, trim+lowercase
  return String(v)
    .replace(/[\x00-\x1f\x7f]/g, "")  // control chars
    .slice(0, 200)                       // max length
    .toLowerCase()
    .trim();
}

/**
 * Prüft ob ein Freitext-Query in einem oder mehreren Feldwerten vorkommt.
 * Kein Query => matcht immer (kein Filter aktiv).
 */
export function textMatches(query, fields = []) {
  const q = norm(query);
  if (!q) return true;
  const haystack = fields.map(norm).join(" ");
  return haystack.includes(q);
}

/**
 * Prüft ob ein Item zu einer oder mehreren ausgewählten Kategorien passt.
 * Matched gegen Kategorie-Label + Synonyme in den durchsuchbaren Feldern
 * des Items (heuristisch, da works.category/experiences.category Freitext
 * ist -- kein Enum/FK, siehe categories.js Kommentar).
 * @param {Array}  categoryFilters - Array von { id, label?, name?, synonyms?, legacyValues? }
 * @param {Array}  fields - durchsuchbare Textfelder des Items
 */
export function categoryMatches(categoryFilters, fields = []) {
  if (!Array.isArray(categoryFilters) || categoryFilters.length === 0) return true;
  const haystack = fields.map(norm).join(" ");
  return categoryFilters.some(cat => {
    // CATEGORY-WELLNESS-001: Auch CHILD-Kategorien (name + legacyValues) in die
    // Nadeln aufnehmen — ein ausgewaehlter Parent-Chip (z.B. "Achtsamkeit")
    // matcht damit auch Items mit Unterkategorie-Werten ("Yoga", "Klangbad",
    // "Meditation", "Energiearbeit") in works/experiences/talents. Kinder sind
    // in der UI unsichtbar, ihre Werte landen aber als Freitext in den Tabellen.
    // Ohne diese Erweiterung waeren die neuen Wellness-Kategorien fuer die
    // Chip-Filter unsichtbar (Freitext-Suche deckte sie bereits ab).
    const childNeedles = (cat?.children || []).flatMap(ch => [ch?.name, ...(ch?.legacyValues || [])]);
    const needles = [cat?.label, cat?.name, ...(cat?.synonyms || []), ...(cat?.legacyValues || []), ...childNeedles].filter(Boolean);
    return needles.some(n => haystack.includes(norm(n)));
  });
}

/**
 * Generischer Item-Filter für Discovery-Listen (Home-Feed, DiscoverPage).
 * @param {Array}    items
 * @param {object}   opts
 * @param {string}   opts.query           - Freitext-Suchbegriff
 * @param {Array}    opts.categoryFilters - ausgewählte Kategorien
 * @param {function} getFields            - (item) => string[] der durchsuchbaren Felder
 */
export function filterDiscoveryItems(items, { query, categoryFilters } = {}, getFields) {
  if (!Array.isArray(items)) return [];
  const q        = norm(query);
  const hasQuery = !!q;
  const hasCats  = Array.isArray(categoryFilters) && categoryFilters.length > 0;
  if (!hasQuery && !hasCats) return items;
  return items.filter(item => {
    const fields = (typeof getFields === "function" ? getFields(item) : []) || [];
    return textMatches(query, fields) && categoryMatches(categoryFilters, fields);
  });
}

/** True wenn irgendein Suchfilter (Text ODER Kategorie) aktuell aktiv ist. */
export function hasActiveSearchFilter({ query, categoryFilters } = {}) {
  return !!norm(query) || (Array.isArray(categoryFilters) && categoryFilters.length > 0);
}
