// src/lib/perfMonitor.js
// HUI Performance Monitor — Query-Timing + Slow-Query-Logging
// Einbinden via: import { timedQuery, perfLog } from "../lib/perfMonitor.js"

const SLOW_QUERY_MS = 300;  // Alles über 300ms wird geloggt
const ENABLED = import.meta.env.DEV || localStorage.getItem("hui_perf_debug") === "1";

/** Misst die Dauer eines Supabase-Promise und loggt langsame Queries */
export async function timedQuery(label, queryPromise) {
  const start = performance.now();
  try {
    const result = await queryPromise;
    const ms = Math.round(performance.now() - start);

    if (ms > SLOW_QUERY_MS) {
      console.warn(`[HUI PERF] 🐌 Slow query (${ms}ms): ${label}`);
      // Für spätere Analyse im Window-Objekt sammeln
      if (typeof window !== "undefined") {
        window.__HUI_SLOW_QUERIES = window.__HUI_SLOW_QUERIES || [];
        window.__HUI_SLOW_QUERIES.push({ label, ms, ts: new Date().toISOString() });
        // Max 50 Einträge im Speicher halten
        if (window.__HUI_SLOW_QUERIES.length > 50) window.__HUI_SLOW_QUERIES.shift();
      }
    } else if (ENABLED) {
      console.debug(`[HUI PERF] ✓ ${label} (${ms}ms)`);
    }

    return result;
  } catch (err) {
    const ms = Math.round(performance.now() - start);
    console.error(`[HUI PERF] ❌ Error in query "${label}" after ${ms}ms:`, err);
    throw err;
  }
}

/** Loggt allgemeine Performance-Events */
export function perfLog(label, data) {
  if (!ENABLED) return;
  console.debug(`[HUI PERF] ${label}`, data || "");
}

/** Zeigt alle langsamen Queries in der Konsole an */
export function printSlowQueries() {
  const queries = window.__HUI_SLOW_QUERIES || [];
  if (!queries.length) { console.log("[HUI PERF] Keine langsamen Queries."); return; }
  console.table(queries);
}

// Globale Hilfsfunktion für Entwickler in der Browser-Konsole
if (typeof window !== "undefined") {
  window.huiPerf = { printSlowQueries };
}
