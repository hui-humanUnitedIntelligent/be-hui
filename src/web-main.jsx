import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from './WebApp.jsx';
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
    <WebApp />
  </React.StrictMode>
);
