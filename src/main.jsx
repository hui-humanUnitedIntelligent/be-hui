// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initSentry, sentryCapture } from './lib/sentry'

// ── Sentry: als allererstes initialisieren ───────────────────────
// Muss vor ReactDOM.createRoot() stehen damit alle Errors gefangen werden
initSentry();

// ── Global: unhandled Promise Rejections ────────────────────────
// Fängt async-Crashes die keinen try/catch haben
window.addEventListener('unhandledrejection', (event) => {
  const err = event.reason instanceof Error
    ? event.reason
    : new Error(String(event.reason ?? 'Unhandled rejection'));
  console.error('[HUI] unhandledrejection:', err);
  sentryCapture(err, {
    source:          'unhandledrejection',
    document_hidden: document.hidden,
    href:            window.location.href,
  });
});

// ── Global: uncaught JS errors ───────────────────────────────────
// Ergänzt Sentry's eigenen Handler mit HUI-Kontext
window.addEventListener('error', (event) => {
  if (!event.error) return;          // ignore cross-origin resource errors
  console.error('[HUI] uncaught error:', event.error);
  sentryCapture(event.error, {
    source:          'window.onerror',
    filename:        event.filename,
    lineno:          event.lineno,
    colno:           event.colno,
    document_hidden: document.hidden,
  });
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
