import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from './WebApp.jsx';
import { GlobalAppBoundary } from './lib/ErrorBoundaries.jsx';
import './index.css';
import './web.css';
import './landing.css';
import { initSentry, sentryCapture } from './lib/sentry.js';
import { initGlobalKeyboardHandling } from "./lib/globalKeyboardHandler.js";

// ── DIAGNOSTIC: Track execution progress ──────────────────────────
window.__HUI_DIAG__ = { step: 'module_loaded', ts: Date.now() };

// ── Sentry ────────────────────────────────────────────────────────
try {
  initSentry();
  window.__HUI_DIAG__.sentry = 'ok';
} catch (e) {
  window.__HUI_DIAG__.sentry = 'FAIL: ' + e.message;
  console.error('[HUI Web] Sentry init failed (non-fatal):', e);
}

// ── Global keyboard handling ──────────────────────────────────────
try {
  initGlobalKeyboardHandling();
  window.__HUI_DIAG__.keyboard = 'ok';
} catch (e) {
  window.__HUI_DIAG__.keyboard = 'FAIL: ' + e.message;
  console.error('[HUI Web] Keyboard handler init failed (non-fatal):', e);
}

// ── Global Error Handlers ─────────────────────────────────────────
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

// ── Render ────────────────────────────────────────────────────────
window.__HUI_DIAG__.step = 'before_createRoot';
window.__HUI_DIAG__.ts2 = Date.now();

try {
  const rootEl = document.getElementById('web-root');
  window.__HUI_DIAG__.rootEl = rootEl ? 'found' : 'NULL';
  
  if (!rootEl) {
    window.__HUI_DIAG__.step = 'NO_ROOT_ELEMENT';
    throw new Error('web-root element not found');
  }
  
  const root = ReactDOM.createRoot(rootEl);
  window.__HUI_DIAG__.step = 'after_createRoot';
  
  root.render(
    <React.StrictMode>
      <GlobalAppBoundary>
        <WebApp />
      </GlobalAppBoundary>
    </React.StrictMode>
  );
  window.__HUI_DIAG__.step = 'after_render';
  window.__HUI_DIAG__.ts3 = Date.now();
} catch (e) {
  window.__HUI_DIAG__.step = 'RENDER_CRASH';
  window.__HUI_DIAG__.crash = e.message;
  window.__HUI_DIAG__.stack = (e.stack || '').substring(0, 1000);
  console.error('[HUI Web] RENDER CRASH:', e);
}
