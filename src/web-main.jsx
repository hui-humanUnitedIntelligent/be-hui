import React from 'react';
import ReactDOM from 'react-dom/client';
import { GlobalAppBoundary } from './lib/ErrorBoundaries';
import './index.css';
import './web.css';
import './landing.css';
import { initSentry, sentryCapture } from './lib/sentry.js';
import { initGlobalKeyboardHandling } from "./lib/globalKeyboardHandler.js";

const _diag = document.getElementById('diag');
if (_diag) {
  _diag.innerHTML += '<br>[JS] ✅ Imports loaded';
  _diag.innerHTML += '<br>[JS] GlobalAppBoundary: ' + (typeof GlobalAppBoundary);
}

// Init
try { initSentry(); _diag && (_diag.innerHTML += '<br>[JS] ✅ Sentry'); }
catch (e) { _diag && (_diag.innerHTML += '<br>[JS] ❌ Sentry: ' + e.message); }

try { initGlobalKeyboardHandling(); _diag && (_diag.innerHTML += '<br>[JS] ✅ Keyboard'); }
catch (e) { _diag && (_diag.innerHTML += '<br>[JS] ❌ Keyboard: ' + e.message); }

// TEST: StrictMode + GlobalAppBoundary + simple div (NO WebApp)
try {
  _diag && (_diag.innerHTML += '<br>[JS] Rendering StrictMode + GlobalAppBoundary + div...');
  ReactDOM.createRoot(document.getElementById('web-root')).render(
    React.createElement(React.StrictMode, null,
      React.createElement(GlobalAppBoundary, null,
        React.createElement('div', { style: { padding: '40px', fontSize: '24px', color: '#333' } }, 'Test: StrictMode + Boundary works')
      )
    )
  );
  _diag && (_diag.innerHTML += '<br>[JS] ✅ render() called');
} catch (e) {
  _diag && (_diag.innerHTML += '<br>[JS] ❌ CRASH: ' + e.message + '<pre>' + (e.stack||'') + '</pre>');
}

// Check after 500ms, 2s
[500, 2000].forEach(function(delay) {
  setTimeout(function() {
    var root = document.getElementById('web-root');
    var children = root ? root.childNodes.length : 'NULL';
    _diag && (_diag.innerHTML += '<br>[' + delay + 'ms] children: ' + children);
  }, delay);
});
