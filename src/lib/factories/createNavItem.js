// src/lib/factories/createNavItem.js
// Lightweight factory + validator für Navigation Items
// Verhindert null/undefined crashes durch normalisierte Struktur

/**
 * Erstellt ein typsicheres, normalisiertes NavItem-Objekt.
 * Alle Felder werden auf definierte Defaults gesetzt —
 * kein undefined kann in die Render-Schicht gelangen.
 *
 * @param {object} config
 * @param {string}      config.key      — Pflichtfeld: eindeutiger Tab-Identifier
 * @param {string}     [config.label]   — Anzeigetext (default: '')
 * @param {any}        [config.icon]    — Icon-Komponente oder String (default: null)
 * @param {boolean}    [config.isOrb]   — Markiert den Orb-Slot (default: false)
 * @param {string}     [config.href]    — Optionaler Deep-Link (default: '')
 * @param {any}        [config.badge]   — Badge-Value (number | null, default: null)
 * @returns {NavItem}
 */
export const createNavItem = ({
  key,
  label  = '',
  icon   = null,
  isOrb  = false,
  href   = '',
  badge  = null,
} = {}) => {
  // DEV-only Validation — wird in Produktion nicht ausgeführt (tree-shaken)
  if (import.meta.env.DEV) {
    if (!key || typeof key !== 'string') {
      console.warn('[HUI INVALID NAV ITEM] key fehlt oder ist kein String:', { key, label, isOrb });
    }
    if (isOrb && key !== 'orb') {
      console.warn('[HUI INVALID NAV ITEM] isOrb=true aber key !== "orb":', { key, label });
    }
  }

  return Object.freeze({
    key:   key   ?? '',
    label: label ?? '',
    icon:  icon  ?? null,
    isOrb: Boolean(isOrb),
    href:  href  ?? '',
    badge: badge ?? null,
  });
};

/**
 * Validiert ein NavItem zur Laufzeit.
 * Gibt null zurück wenn ungültig — verhindert Render-Crashes.
 *
 * @param {any} item
 * @returns {NavItem|null}
 */
export const validateNavItem = (item) => {
  if (!item || typeof item !== 'object') {
    console.warn('[HUI INVALID NAV ITEM] kein Objekt:', item);
    return null;
  }
  if (!item.key || typeof item.key !== 'string') {
    console.warn('[HUI INVALID NAV ITEM] key fehlt oder invalid:', item);
    return null;
  }
  return item;
};
