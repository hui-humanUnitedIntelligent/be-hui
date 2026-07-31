// src/lib/factories/createTabPage.js
// Route + Tab Normalization Factory
// Verhindert undefined-route / invalid-component Crashes zur Laufzeit

/**
 * Erstellt ein normalisiertes, immutables Tab/Route-Objekt.
 *
 * Validierungsregeln (immer aktiv, nicht nur DEV):
 *  - key:       Pflicht, string
 *  - route:     Pflicht, string, muss mit '/' beginnen
 *  - component: Pflicht, function oder lazy()
 *
 * @param {object}   config
 * @param {string}   config.key             — Pflichtfeld: eindeutiger Tab-Identifier
 * @param {string}   config.route           — Pflichtfeld: URL-Pfad (z.B. '/Home')
 * @param {Function} config.component       — Pflichtfeld: React-Komponente oder lazy()
 * @param {string}  [config.title]          — Seiten-Titel (default: '')
 * @param {any}     [config.icon]           — Icon-Komponente oder String (default: null)
 * @param {boolean} [config.protectedRoute] — Auth required (default: false)
 * @param {boolean} [config.preload]        — Prefetch-Hint (default: false)
 * @param {object}  [config.meta]           — Beliebige Metadaten (default: {})
 * @returns {TabPage|null}
 */
export const createTabPage = ({
  key,
  route,
  component,
  title          = '',
  icon           = null,
  protectedRoute = false,
  preload        = false,
  meta           = {},
} = {}) => {

  // ── Validation (immer aktiv — kein DEV-only) ──────────────────────
  if (!key || typeof key !== 'string') {
    console.warn('[HUI INVALID TAB KEY]', key);
    return null;
  }

  if (!route || typeof route !== 'string') {
    console.warn('[HUI INVALID ROUTE]', route, '(tab:', key, ')');
    return null;
  }

  if (!route.startsWith('/')) {
    console.warn('[HUI INVALID ROUTE] Route muss mit "/" beginnen:', route, '(tab:', key, ')');
    return null;
  }

  if (!component) {
    console.warn('[HUI INVALID COMPONENT] Keine Komponente für Tab:', key);
    return null;
  }

  if (typeof component !== 'function') {
    console.warn('[HUI INVALID COMPONENT] Komponente muss eine Function sein:', key, typeof component);
    return null;
  }

  // ── Normalisiertes, immutables Objekt ────────────────────────────
  return Object.freeze({
    key,
    route,
    component,
    title:     title     ?? '',
    icon:      icon      ?? null,
    protected: Boolean(protectedRoute),
    preload:   Boolean(preload),
    meta:      meta      ?? {},
  });
};

/**
 * Erstellt ein einfaches Tab-Item (ohne Route — für Inline-Tab-Bars).
 * Leichtgewichtigere Variante für Profil-Tabs, Discover-Tabs etc.
 *
 * @param {object}  config
 * @param {string}  config.key    — Pflicht
 * @param {string}  config.label  — Anzeigetext (default: '')
 * @param {any}    [config.icon]  — Optional
 * @param {object} [config.meta]  — Beliebige Metadaten
 * @returns {TabItem|null}
 */
export const createTabItem = ({
  key,
  label = '',
  icon  = null,
  meta  = {},
} = {}) => {

  if (!key || typeof key !== 'string') {
    console.warn('[HUI INVALID TAB ITEM] key fehlt:', { key, label });
    return null;
  }

  return Object.freeze({
    key,
    label: label ?? '',
    icon:  icon  ?? null,
    meta:  meta  ?? {},
  });
};

/**
 * Filtert null-Einträge aus einem TabPage/TabItem Array.
 * Ersetzt manuelles .filter(Boolean) überall im Code.
 *
 * @param {Array} pages
 * @returns {Array}
 */
export const filterValidPages = (pages) =>
  (pages || []).filter(p => p !== null && p !== undefined && p.key);
