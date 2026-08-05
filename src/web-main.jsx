// ══════════════════════════════════════════════════════════════════════════════
// web-main.jsx — HUI Web Entry Point (Desktop V3)
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from './WebApp.jsx';

// ── Styles ────────────────────────────────────────────────────────────────────
import './index.css';                       // Shared Design System (Tailwind, CSS Variables)
import './web.css';                         // Web-spezifische Styles
import './components/desktop/desktopV3.css'; // Desktop V3 (komplettes Design-System)

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
