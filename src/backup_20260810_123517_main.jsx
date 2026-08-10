// Build: 2026-05-24T16:55:29Z
// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initSentry, sentryCapture } from './lib/sentry'
import { initAppPerformance } from './lib/appPerformance.js'
import { initOTA, autoCheckOTA } from './lib/otaUpdate.js'

initSentry()
initAppPerformance();

// OTA (2026-08-08): Over-the-Air Updates — lädt neue Web-Bundles automatisch.
// notifyAppReady MUSS innerhalb ~10s nach Start gerufen werden, sonst rollt
// das Plugin nach 3 Crashes zum letzten stabilen Bundle zurück.
initOTA().then((res) => {
  if (res?.error) console.warn('[OTA] Init warning:', res.error);
}).catch((err) => console.warn('[OTA] Init error:', err));

// OTA v2: Background-Check nach 3s (nicht blockierend, nur wenn serverVersion > APP_VERSION)
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
});

window.addEventListener('error', (event) => {
  if (!event.error) return;
  sentryCapture(event.error, { source: 'window.onerror', href: window.location.href });
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
