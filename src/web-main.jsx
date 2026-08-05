// ══════════════════════════════════════════════════════════════════════════════
// web-main.jsx — HUI Web Entry Point
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Einstiegspunkt für die HUI Web-Version (Browser/Desktop).
//   Wird von web.html geladen: <script src="/src/web-main.jsx" />
//   Rendert WebApp in den #web-root Container.
//
// UNTERSCHIED ZU main.jsx (Mobile-App):
//   - Importiert WebApp (statt App)
//   - Importiert web.css zusätzlich zu index.css
//   - Kein appPerformance.js (Mobile-spezifisch)
//   - Kein Contract Inspector (Dev-Tool für Mobile)
//   - Rendert in #web-root (statt #root)
//
// GEMEINSAM MIT main.jsx:
//   - Sentry Initialisierung (Error Monitoring)
//   - Global Error Handlers (unhandledrejection, error)
//   - index.css (Shared Design System, Tailwind, CSS Variables)
//   - React.StrictMode
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from './WebApp.jsx';

// ── Shared Styles ────────────────────────────────────────────────────────────
import './index.css';    // Shared Design System (Tailwind, CSS Variables, Reset)
import './web.css';      // Web-spezifische Styles (unter #web-root scope)
import './components/desktop/desktopFoundation.css';  // Desktop Foundation (Tokens, Layout, Breakpoints, Interactions)
import './components/desktop/desktopPhase1.css';  // Desktop Phase 1 (Mission Control, Panels, Sidebar, Header)
import './components/desktop/desktopPhase2.css';  // Desktop Phase 2 (Chat, Notifications, Command Palette, Profiles)

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
