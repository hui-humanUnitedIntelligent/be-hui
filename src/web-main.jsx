import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from './WebApp.jsx';
import { GlobalAppBoundary } from './lib/ErrorBoundaries.jsx';
import './index.css';
import './web.css';
import './landing.css';
import { initSentry } from './lib/sentry.js';
import { initGlobalKeyboardHandling } from "./lib/globalKeyboardHandler.js";

// Minimal diagnostic
var d = document.getElementById('web-root');
if (d) d.innerHTML = '<div style="padding:20px;font-family:monospace;font-size:14px">[1] Module loaded</div>';

try {
  initSentry();
  if (d) d.innerHTML += '<div>[2] Sentry OK</div>';
} catch(e) { if (d) d.innerHTML += '<div style="color:red">[2] Sentry: ' + e.message + '</div>'; }

try {
  initGlobalKeyboardHandling();
  if (d) d.innerHTML += '<div>[3] Keyboard OK</div>';
} catch(e) { if (d) d.innerHTML += '<div style="color:red">[3] Keyboard: ' + e.message + '</div>'; }

try {
  if (d) d.innerHTML += '<div>[4] Rendering...</div>';
  ReactDOM.createRoot(d).render(
    <React.StrictMode>
      <GlobalAppBoundary>
        <WebApp />
      </GlobalAppBoundary>
    </React.StrictMode>
  );
  if (d) d.innerHTML += '<div>[5] render() called</div>';
} catch(e) {
  if (d) d.innerHTML += '<div style="color:red">[5] CRASH: ' + e.message + '</div>';
}

// Check after 2s
setTimeout(function() {
  var root = document.getElementById('web-root');
  console.log('[2s] children:', root ? root.childNodes.length : 'NULL');
}, 2000);
