// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initSentry, sentryCapture } from './lib/sentry'
import { BUILD_VERSION } from "./lib/BUILD_VERSION.js";

initSentry();

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
