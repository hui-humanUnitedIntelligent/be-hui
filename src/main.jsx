// Build: 2026-05-24T16:55:29Z
// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { GlobalAppBoundary } from './lib/ErrorBoundaries'
import './index.css'
import { initSentry, sentryCapture } from './lib/sentry'
import { initAppPerformance } from './lib/appPerformance.js'
import { initOTA, autoCheckOTA, confirmAppReady } from './lib/otaUpdate.js'
import { initGlobalKeyboardHandling } from './lib/globalKeyboardHandler.js'

// ── Production Console Silencer (2026-08-12) ─────────────────────
// Silences console.log + console.debug in production to prevent
// data leaks + perf overhead on mobile. console.warn + console.error
// stay active for production diagnostics.
// Override per-session: localStorage.setItem('hui_debug_log', '1')
if (!import.meta.env.DEV && !localStorage.getItem('hui_debug_log')) {
  const noop = () => {};
  console.log = noop;
  console.debug = noop;
}

initSentry()
initAppPerformance();

// KEYBOARD-FIX (2026-08-10): Globales, framework-weites Keyboard-Handling —
// scrollt JEDES fokussierte Textfeld automatisch sichtbar, sobald die
// Systemtastatur aufgeht. Kein Setup pro Screen nötig (siehe
// src/lib/globalKeyboardHandler.js für die volle Erklärung).
initGlobalKeyboardHandling();

// OTA v5 (2026-08-21): Over-the-Air Updates — lädt neue Web-Bundles automatisch.
// notifyAppReady wird NICHT mehr hier gerufen — sondern erst nach React-Render
// via confirmAppReady() in App.jsx useEffect. Siehe otaUpdate.js für Details.
// Grund: notifyAppReady vor React-Render → White-Screen-Loop ohne Rollback.
initOTA().then((res) => {
  if (res?.error) console.warn('[OTA] Init warning:', res.error);
}).catch((err) => console.warn('[OTA] Init error:', err));

// OTA v4 (2026-08-21): autoCheckOTA() WIEDERHERGESTELLT als Fallback.
// Grund: Alte APKs (gebaut vor Aug 18) haben autoUpdate:false im native Plugin.
// v3 hatte autoCheckOTA() entfernt → alte APKs ziehen keine Updates mehr.
// v4: autoCheckOTA() mit Race-Condition-Schutz (prüft current bundle vor download).
// Bei neuen APKs (autoUpdate:true) ist der Check idempotent — Plugin war schneller → skip.
autoCheckOTA().catch((err) => console.warn('[OTA] Auto-check error:', err));

// ── DEV: Contract Inspector + Observability ────────────────────
// DevTools: window.__HUI_CONTRACTS?.()  |  window.__HUI_OBSERVABILITY__?.getReport()
if (import.meta.env.DEV) {
  import("./core/hui.contracts.js").then(({ inspectContracts }) => {
    window.__HUI_CONTRACTS = inspectContracts;
  });
  import("./lib/observability/index.dev.js").then(({ initObservability }) => {
    initObservability();
  });
}

window.addEventListener('unhandledrejection', (event) => {
  const err = event.reason instanceof Error
    ? event.reason
    : new Error(String(event.reason ?? 'Unhandled rejection'));
  sentryCapture(err, { source: 'unhandledrejection', href: window.location.href });
});

window.addEventListener('error', (event) => {
  if (!event.error) return;
  sentryCapture(event.error, { source: 'window.onerror', href: window.location.href });
});

// confirmAppReady global verfügbar machen — App.jsx ruft es nach erstem Render
window.__HUI_CONFIRM_APP_READY__ = confirmAppReady;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalAppBoundary>
      <App />
    </GlobalAppBoundary>
  </React.StrictMode>,
);
