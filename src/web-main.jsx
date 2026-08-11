// ══════════════════════════════════════════════════════════════════════════════
// web-main.jsx — HUI Web Entry Point (Desktop V3)
// ══════════════════════════════════════════════════════════════════════════════
//
// v2.4: desktopV3.css nach AuthenticatedApp verschoben.
// Öffentliche Landingpage lädt nur index.css + web.css + landing.css.
// cssCodeSplit: true → desktopV3.css wird als separater CSS-Chunk
// erst nach Login geladen.
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from './WebApp.jsx';

// ── Styles (Public-only) ─────────────────────────────────────────────────────
import './index.css';                       // Shared Design System (Tailwind, CSS Variables, Fonts)
import './web.css';                         // Web-spezifische Styles (Root Reset, Loading Screen)
import './landing.css';                     // Landing Page Styles (nur Public)
// desktopV3.css → jetzt in AuthenticatedApp.jsx (lazy nach Login)

// ── Sentry ────────────────────────────────────────────────────────────────────
import { initSentry, sentryCapture } from './lib/sentry.js';

initSentry();

// ── Global Error Handlers ───────────────────────────────────────────────────
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

// ── Render ────────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('web-root')).render(
  <React.StrictMode>
    <WebApp />
  </React.StrictMode>
);
