// src/lib/debugCollector.js
// DIAG TEMP — Debug Log Collector
// Kein Produktivcode. Nur Runtime-Beweis.

const MAX_ENTRIES = 100;

if (typeof window !== "undefined" && !window.HUI_DEBUG_LOGS) {
  window.HUI_DEBUG_LOGS = [];
}

export function logDebug(event, payload) {
  if (typeof window === "undefined") return;
  if (!window.HUI_DEBUG_LOGS) window.HUI_DEBUG_LOGS = [];
  window.HUI_DEBUG_LOGS.push({
    ts:      Date.now(),
    event,
    payload: payload ?? null,
  });
  if (window.HUI_DEBUG_LOGS.length > MAX_ENTRIES) {
    window.HUI_DEBUG_LOGS.shift();
  }
}
