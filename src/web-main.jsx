import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from './WebApp.jsx';
import { GlobalAppBoundary } from './lib/ErrorBoundaries';
import './index.css';
import './web.css';
import './landing.css';
import { initSentry, sentryCapture } from './lib/sentry.js';
import { initGlobalKeyboardHandling } from "./lib/globalKeyboardHandler.js";

try { initSentry(); } catch (e) { console.error('[HUI] Sentry init failed:', e); }
try { initGlobalKeyboardHandling(); } catch (e) { console.error('[HUI] Keyboard init failed:', e); }

window.addEventListener('unhandledrejection', (event) => {
  const err = event.reason instanceof Error ? event.reason : new Error(String(event.reason ?? 'Unhandled rejection'));
  sentryCapture(err, {source: 'unhandledrejection', href: window.location.href});
});
window.addEventListener('error', (event) => {
  if (!event.error) return;
  sentryCapture(event.error, {source: 'window.onerror', href: window.location.href});
});

ReactDOM.createRoot(document.getElementById('web-root')).render(
  <React.StrictMode>
    <GlobalAppBoundary>
      <WebApp />
    </GlobalAppBoundary>
  </React.StrictMode>
);
