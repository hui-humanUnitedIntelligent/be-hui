// src/lib/backButtonRegistry.js
// ══════════════════════════════════════════════════════════════════════
// Global Modal/Overlay Registry — zentrale Stack-Verwaltung für
// den Android Back-Button-Handler.
//
// Jede Modal-/Overlay-/Wizard-Komponente registriert sich mit ihrer
// Close-Funktion wenn sie öffnet, und unregistriert sich beim Schließen.
// Der AndroidBackButtonHandler ruft closeTopmostModal() auf, was die
// zuletzt geöffnete Komponente schließt — LIFO-Stack.
//
// Design:
//   - Modul-globaler Stack (außerhalb React) — wie wizardBodyLock.js
//   - Stack enthält { id, closeFn, label } Objekte
//   - LIFO: zuletzt geöffnet = zuerst geschlossen
//   - closeFn wird nur einmal aufgerufen, dann auto-entfernt
// ══════════════════════════════════════════════════════════════════════

let stack = [];
let nextId = 1;

/**
 * Registriert ein offenes Modal/Overlay mit seiner Close-Funktion.
 * @param {Function} closeFn — Funktion die das Modal schließt
 * @param {string} [label] — Optionaler Name für Debugging
 * @returns {Function} Unregister-Funktion (beim Unmount aufrufen)
 */
export function registerModal(closeFn, label = "modal") {
  const id = nextId++;
  const entry = { id, closeFn, label };
  stack.push(entry);
  return () => unregisterById(id);
}

/**
 * Entfernt ein spezifisches Modal anhand seiner ID.
 */
function unregisterById(id) {
  stack = stack.filter(e => e.id !== id);
}

/**
 * Hat offene Modals?
 */
export function hasOpenModal() {
  return stack.length > 0;
}

/**
 * Schließt das oberste (zuletzt geöffnete) Modal.
 * @returns {boolean} true wenn ein Modal geschlossen wurde, false wenn Stack leer
 */
export function closeTopmostModal() {
  if (stack.length === 0) return false;
  const entry = stack[stack.length - 1];
  try {
    entry.closeFn();
  } catch (e) {
    console.warn("[BackButtonRegistry] closeFn error:", entry.label, e);
  }
  // Auto-entfernen (falls closeFn das nicht selbst macht)
  unregisterById(entry.id);
  return true;
}

/**
 * Gibt die Anzahl offener Modals zurück.
 */
export function getModalCount() {
  return stack.length;
}

/**
 * Gibt die Labels aller offenen Modals zurück (für Debugging).
 */
export function getOpenModalLabels() {
  return stack.map(e => e.label);
}

// ── Debug-API ──────────────────────────────────────────────────────────
if (typeof window !== "undefined") {
  window.__HUI_BACK_BUTTON_REGISTRY__ = {
    hasOpenModal,
    getModalCount,
    getOpenModalLabels,
    closeTopmostModal,
  };
}
