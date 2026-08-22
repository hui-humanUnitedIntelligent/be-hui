import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from './WebApp.jsx';
import { GlobalAppBoundary } from './lib/ErrorBoundaries';
import './index.css';
import './web.css';
import './landing.css';
import { initSentry, sentryCapture } from './lib/sentry.js';
import { initGlobalKeyboardHandling } from "./lib/globalKeyboardHandler.js";

const _diag = document.getElementById('diag');
if (_diag) {
  _diag.innerHTML += '<br>[JS] ✅ Imports loaded, WebApp: ' + (typeof WebApp);
}

// Init
try { initSentry(); _diag && (_diag.innerHTML += '<br>[JS] ✅ Sentry'); }
catch (e) { _diag && (_diag.innerHTML += '<br>[JS] ❌ Sentry: ' + e.message); }

try { initGlobalKeyboardHandling(); _diag && (_diag.innerHTML += '<br>[JS] ✅ Keyboard'); }
catch (e) { _diag && (_diag.innerHTML += '<br>[JS] ❌ Keyboard: ' + e.message); }

// Error tracking
window.addEventListener('unhandledrejection', (event) => {
  _diag && (_diag.innerHTML += '<br>[JS] ❌ REJECTION: ' + (event.reason?.message || event.reason));
});
window.addEventListener('error', (event) => {
  _diag && (_diag.innerHTML += '<br>[JS] ❌ WINDOW ERROR: ' + (event.error?.message || event.message));
});

// TEST: Full WebApp render
try {
  _diag && (_diag.innerHTML += '<br>[JS] Rendering WebApp...');
  ReactDOM.createRoot(document.getElementById('web-root')).render(
    React.createElement(React.StrictMode, null,
      React.createElement(GlobalAppBoundary, null,
        React.createElement(WebApp)
      )
    )
  );
  _diag && (_diag.innerHTML += '<br>[JS] ✅ render() called');
} catch (e) {
  _diag && (_diag.innerHTML += '<br>[JS] ❌ SYNC CRASH: ' + e.message + '<pre>' + (e.stack||'') + '</pre>');
}

// Check at 500ms, 2s, 5s
[500, 2000, 5000].forEach(function(delay) {
  setTimeout(function() {
    var root = document.getElementById('web-root');
    var children = root ? root.childNodes.length : 'NULL';
    var html = root ? root.innerHTML.substring(0, 200) : 'NULL';
    _diag && (_diag.innerHTML += '<br>[' + delay + 'ms] children: ' + children + ', html: ' + html);
  }, delay);
});
