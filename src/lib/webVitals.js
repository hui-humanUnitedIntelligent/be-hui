// src/lib/webVitals.js — HUI P5: Web Vitals Messung (nur messen, kein Tracking)
// Misst CLS, LCP, INP und dokumentiert Werte in window.__HUI_WEB_VITALS__

const VITALS_KEY = "__HUI_WEB_VITALS__";

/** Initialisiert Web-Vitals-Messung. Kein Analytics, kein externes Tracking. */
export function initWebVitals() {
  if (typeof window === "undefined") return;

  window[VITALS_KEY] = {
    cls:  null,
    lcp:  null,
    inp:  null,
    fcp:  null,
    ttfb: null,
    measuredAt: null,
  };

  import("web-vitals").then(({ onCLS, onLCP, onINP, onFCP, onTTFB }) => {
    const store = (name, value) => {
      window[VITALS_KEY][name] = {
        value:    Math.round(value.value * 100) / 100,
        rating:   value.rating,
        id:       value.id,
        delta:    value.delta,
        entries:  value.entries?.length ?? 0,
        timestamp: Date.now(),
      };
      window[VITALS_KEY].measuredAt = new Date().toISOString();

      if (import.meta.env.DEV) {
        console.info(`[HUI Web Vital] ${name.toUpperCase()}:`, value.value, `(${value.rating})`);
      }
    };

    onCLS((m) => store("cls", m));
    onLCP((m) => store("lcp", m));
    onINP((m) => store("inp", m));
    onFCP((m) => store("fcp", m));
    onTTFB((m) => store("ttfb", m));
  }).catch((err) => {
    if (import.meta.env.DEV) {
      console.warn("[HUI Web Vitals] Init fehlgeschlagen:", err?.message);
    }
  });
}

/** Gibt die aktuellen Messwerte zurück. */
export function getWebVitals() {
  if (typeof window === "undefined") return null;
  return window[VITALS_KEY] || null;
}

/** Formatiert Messwerte für Dokumentation/Console. */
export function formatWebVitalsReport() {
  const v = getWebVitals();
  if (!v) return "Keine Web-Vitals-Daten verfügbar.";

  const fmt = (key, unit = "ms") => {
    const entry = v[key];
    if (!entry) return `${key.toUpperCase()}: —`;
    const val = key === "cls" ? entry.value : `${entry.value}${unit}`;
    return `${key.toUpperCase()}: ${val} (${entry.rating})`;
  };

  return [
    `HUI Web Vitals — ${v.measuredAt || "in progress"}`,
    fmt("lcp"),
    fmt("cls", ""),
    fmt("inp"),
    fmt("fcp"),
    fmt("ttfb"),
  ].join("\n");
}
