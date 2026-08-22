import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from './WebApp.jsx';
import { GlobalAppBoundary } from './lib/ErrorBoundaries.jsx';
import './index.css';
import './web.css';
import './landing.css';
import { initSentry, sentryCapture } from './lib/sentry.js';
import { initGlobalKeyboardHandling } from "./lib/globalKeyboardHandler.js";

// ── Sentry ────────────────────────────────────────────────────────────────────
// WHITESCREEN-FIX (2026-08-22): try-catch um alle Modul-Scope-Init-Aufrufe.
// Wenn initSentry oder initGlobalKeyboardHandling crasht, wird die App trotzdem gerendert.
try {
  initSentry();
} catch (e) {
  console.error('[HUI Web] Sentry init failed (non-fatal):', e);
}

// ── Global keyboard handling ──────────────────────────────────────────────────
try {
  initGlobalKeyboardHandling();
} catch (e) {
  console.error('[HUI Web] Keyboard handler init failed (non-fatal):', e);
}

// ── Global Error Handlers ───────────────────────────────────────────────────
window.addEventListener('unhandledrejection', (event) => {
  const err = event.reason instanceof Error
    ? event.reason
    : new Error(String(event.reason ?? 'Unhandled rejection'));
  sentryCapture(err, { source: 'web-unhandledrejection', href: window.location.href });
});

window.addEventListener('error', (event) => {
  if (!event.error) return;
  sentryCapture(event.error, { source: 'web-onerror', href: window.location.href });
});

// ── Render ────────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('web-root')).render(
  <React.StrictMode>
    <GlobalAppBoundary>
      <WebApp />
    </GlobalAppBoundary>
  </React.StrictMode>
);
