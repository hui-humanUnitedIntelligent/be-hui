// Build: 2026-05-24T16:55:29Z
// src/main.jsx
// WHITESCREEN-FIX (2026-08-22): try-catch um alle Modul-Scope-Init-Aufrufe.
// Wenn Sentry, Performance oder Keyboard-Handler crasht, wird die App trotzdem gerendert.
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { GlobalAppBoundary } from './lib/ErrorBoundaries'
import './index.css'
import { initSentry, sentryCapture } from './lib/sentry'
import { initAppPerformance } from './lib/appPerformance.js'
import { initOTA, autoCheckOTA, confirmAppReady } from './lib/otaUpdate.js'
import { initGlobalKeyboardHandling } from './lib/globalKeyboardHandler.js'
import { initErrorReporting, reportError } from './lib/errorReporter.js'
import ErrorReportToast from './lib/ErrorReportToast.jsx'
import { APP_VERSION } from './version.js'

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

// ── Set App Version for Error Reports ────────────────────────────
window.__HUI_APP_VERSION__ = APP_VERSION;

// WHITESCREEN-FIX (2026-08-22): Defensive init — try-catch um alle Init-Aufrufe
try {
  initSentry()
} catch (e) {
  console.error('[HUI] Sentry init failed (non-fatal):', e)
}

try {
  initAppPerformance();
} catch (e) {
  console.error('[HUI] Performance init failed (non-fatal):', e)
}

// KEYBOARD-FIX (2026-08-10): Globales, framework-weites Keyboard-Handling —
// scrollt JEDES fokussierte Textfeld automatisch sichtbar, sobald die
// Systemtastatur aufgeht. Kein Setup pro Screen nötig (siehe
// src/lib/globalKeyboardHandler.js für die volle Erklärung).
try {
  initGlobalKeyboardHandling();
} catch (e) {
  console.error('[HUI] Keyboard handler init failed (non-fatal):', e)
}

// ── Error Reporting System (2026-08-22) ──────────────────────────
try {
  initErrorReporting();
} catch (e) {
  console.error('[HUI] ErrorReporter init failed (non-fatal):', e)
}

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

// ── DEV: Contract Inspector ──────────────────────────────────────
// In DevTools: window.__HUI_CONTRACTS?.()
if (import.meta.env.DEV) {
  import("./core/hui.contracts.js").then(({ inspectContracts }) => {
    window.__HUI_CONTRACTS = inspectContracts;
  });
}

window.addEventListener('unhandledrejection', (event) => {
  const err = event.reason instanceof Error
    ? event.reason
    : new Error(String(event.reason ?? 'Unhandled rejection'));
  sentryCapture(err, { source: 'unhandledrejection', href: window.location.href });
  try { reportError('unhandled_rejection', { message: err.message, stack: err.stack?.substring(0, 2000) || '' }); } catch(_) {}
});

window.addEventListener('error', (event) => {
  if (!event.error && !event.message) return;
  const msg = event.error?.message || event.message || '';
  if (msg.includes('ResizeObserver loop')) return;
  sentryCapture(event.error || new Error(msg), { source: 'window.onerror', href: window.location.href });
  try { reportError('js_error', { message: msg, stack: event.error?.stack?.substring(0, 2000) || '', filename: event.filename || '', lineno: event.lineno || 0, colno: event.colno || 0 }); } catch(_) {}
});

// confirmAppReady global verfügbar machen — App.jsx ruft es nach erstem Render
window.__HUI_CONFIRM_APP_READY__ = confirmAppReady;

// Punkt 10.2: try-catch um createRoot — kein Crash vor React-Mount möglich
try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <GlobalAppBoundary>
        <App />
        <ErrorReportToast />
      </GlobalAppBoundary>
    </React.StrictMode>,
  );
} catch (e) {
  console.error('[HUI] createRoot failed:', e);
  try { reportError('react_render_crash', { message: 'createRoot failed: ' + (e?.message || String(e)), stack: e?.stack?.substring(0, 2000) || '', component: 'main.jsx / createRoot' }); } catch(_) {}
  var _root = document.getElementById('root');
  if (_root) {
    _root.innerHTML = '<div style="position:fixed;inset:0;background:#F9F6F2;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;font-family:sans-serif">' +
      '<div style="font-size:36px;margin-bottom:8px;opacity:0.7">✦</div>' +
      '<h1 style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0 0 4px 0;text-align:center">HUI — Start-Fehler</h1>' +
      '<p style="font-size:14px;color:#888;margin:0 0 24px 0;text-align:center;max-width:400px">Die App konnte nicht starten. Bitte lade neu.</p>' +
      '<button onclick="window.location.reload()" style="padding:12px 28px;background:#0DC4B5;border:none;border-radius:14px;color:white;font-size:15px;font-weight:600;cursor:pointer">Neu laden</button>' +
      '</div>';
  }
}
