// ══════════════════════════════════════════════════════════════════════════════
// web-main.jsx — HUI Web Entry Point (Desktop V3)
// ══════════════════════════════════════════════════════════════════════════════
//
// v2.5: Defensive init — try-catch um alle Modul-Scope-Init-Aufrufe.
//       Wenn Sentry oder Keyboard-Handler crasht, wird die App trotzdem gerendert.
// v2.4: desktopV3.css nach AuthenticatedApp verschoben.
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

// WHITESCREEN-FIX (2026-08-22): try-catch um initSentry — wenn Sentry crasht,
// darf nicht die ganze App sterben. Sentry ist optional, Rendering ist Pflicht.
try {
  initSentry();
} catch (e) {
  console.error('[HUI] Sentry init failed (non-fatal):', e);
}

// KEYBOARD-PUSH-UP (2026-08-15): Globales Keyboard-Handling auch für Web/Mobile-Web
import { initGlobalKeyboardHandling } from "./lib/globalKeyboardHandler.js";

// WHITESCREEN-FIX (2026-08-22): try-catch um keyboard init — defensive
try {
  initGlobalKeyboardHandling();
} catch (e) {
  console.error('[HUI] Keyboard handler init failed (non-fatal):', e);
}

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
