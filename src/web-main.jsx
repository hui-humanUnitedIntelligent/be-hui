// Line 1: DOM write BEFORE any imports — if this shows, module loaded
document.getElementById('web-root').innerHTML = '<div style="padding:20px;font-family:monospace;font-size:14px;color:#333">[A] Module JS loaded at ' + new Date().toISOString() + '</div>';

import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from './WebApp.jsx';
import { GlobalAppBoundary } from './lib/ErrorBoundaries.jsx';
import './index.css';
import './web.css';
import './landing.css';
import { initSentry } from './lib/sentry.js';
import { initGlobalKeyboardHandling } from "./lib/globalKeyboardHandler.js";

document.getElementById('web-root').innerHTML += '<div>[B] Imports resolved</div>';

try {
  initSentry();
  document.getElementById('web-root').innerHTML += '<div>[C] Sentry OK</div>';
} catch(e) {
  document.getElementById('web-root').innerHTML += '<div style="color:red">[C] Sentry: ' + e.message + '</div>';
}

try {
  initGlobalKeyboardHandling();
  document.getElementById('web-root').innerHTML += '<div>[D] Keyboard OK</div>';
} catch(e) {
  document.getElementById('web-root').innerHTML += '<div style="color:red">[D] Keyboard: ' + e.message + '</div>';
}

try {
  ReactDOM.createRoot(document.getElementById('web-root')).render(
    <React.StrictMode>
      <GlobalAppBoundary>
        <WebApp />
      </GlobalAppBoundary>
    </React.StrictMode>
  );
  document.getElementById('web-root').innerHTML += '<div>[E] render() called</div>';
} catch(e) {
  document.getElementById('web-root').innerHTML += '<div style="color:red">[E] CRASH: ' + e.message + '</div>';
}
