import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from './WebApp.jsx';
import { GlobalAppBoundary } from './lib/ErrorBoundaries.jsx';
import './index.css';
import './web.css';
import './landing.css';
import { initSentry } from './lib/sentry.js';
import { initGlobalKeyboardHandling } from "./lib/globalKeyboardHandler.js";

// ── Sentry ────────────────────────────────────────────────────────────────────
initSentry();

// ── Global keyboard handling ──────────────────────────────────────────────────
initGlobalKeyboardHandling();

// ── Render ────────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('web-root')).render(
  <React.StrictMode>
    <GlobalAppBoundary>
      <WebApp />
    </GlobalAppBoundary>
  </React.StrictMode>
);
