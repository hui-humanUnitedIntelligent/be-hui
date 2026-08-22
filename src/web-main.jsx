import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from './WebApp.jsx';
import { GlobalAppBoundary } from './lib/ErrorBoundaries';
import './index.css';
import './web.css';
import './landing.css';
import { initSentry, sentryCapture } from './lib/sentry.js';
import { initGlobalKeyboardHandling } from "./lib/globalKeyboardHandler.js";

// ── DIAGNOSTIC: Write to #diag after all imports ──────────────────
const _diag = document.getElementById('diag');
if (_diag) {
  _diag.innerHTML += '<br>[JS] ✅ All imports loaded';
  _diag.innerHTML += '<br>[JS] React: ' + (typeof React);
  _diag.innerHTML += '<br>[JS] ReactDOM: ' + (typeof ReactDOM);
  _diag.innerHTML += '<br>[JS] WebApp: ' + (typeof WebApp);
  _diag.innerHTML += '<br>[JS] GlobalAppBoundary: ' + (typeof GlobalAppBoundary);
  _diag.innerHTML += '<br>[JS] web-root: ' + (!!document.getElementById('web-root'));
  _diag.innerHTML += '<br>[JS] initSentry: ' + (typeof initSentry);
  _diag.innerHTML += '<br>[JS] initGlobalKeyboardHandling: ' + (typeof initGlobalKeyboardHandling);
}

// ── Init (defensive) ──────────────────────────────────────────────
try { initSentry(); _diag && (_diag.innerHTML += '<br>[JS] ✅ Sentry initialized'); }
catch (e) { _diag && (_diag.innerHTML += '<br>[JS] ❌ Sentry: ' + e.message); console.error('[HUI] Sentry init failed:', e); }

try { initGlobalKeyboardHandling(); _diag && (_diag.innerHTML += '<br>[JS] ✅ Keyboard initialized'); }
catch (e) { _diag && (_diag.innerHTML += '<br>[JS] ❌ Keyboard: ' + e.message); console.error('[HUI] Keyboard init failed:', e); }

window.addEventListener('unhandledrejection', (event) => {
  const err = event.reason instanceof Error ? event.reason : new Error(String(event.reason ?? 'Unhandled rejection'));
  _diag && (_diag.innerHTML += '<br>[JS] ❌ UNHANDLED REJECTION: ' + err.message);
  sentryCapture(err, {source: 'unhandledrejection', href: window.location.href});
});

window.addEventListener('error', (event) => {
  if (!event.error) return;
  _diag && (_diag.innerHTML += '<br>[JS] ❌ WINDOW ERROR: ' + event.error.message);
  sentryCapture(event.error, {source: 'window.onerror', href: window.location.href});
});

// ── RENDER ────────────────────────────────────────────────────────
try {
  _diag && (_diag.innerHTML += '<br>[JS] Calling createRoot().render()...');
  const root = ReactDOM.createRoot(document.getElementById('web-root'));
  _diag && (_diag.innerHTML += '<br>[JS] createRoot returned: ' + typeof root);
  root.render(
    <React.StrictMode>
      <GlobalAppBoundary>
        <WebApp />
      </GlobalAppBoundary>
    </React.StrictMode>
  );
  _diag && (_diag.innerHTML += '<br>[JS] ✅ render() called');
} catch (e) {
  _diag && (_diag.innerHTML += '<br>[JS] ❌ RENDER CRASH: ' + e.message + '<pre>' + (e.stack||'') + '</pre>');
  console.error('[HUI] RENDER CRASH:', e);
}
