import React from 'react';
import ReactDOM from 'react-dom/client';

const _d = document.getElementById('diag');
if (_d) _d.innerHTML += '<br>[JS] web-main.jsx module loaded';

import WebApp from './WebApp.jsx';
import { GlobalAppBoundary } from './lib/ErrorBoundaries.jsx';
import './index.css';
import './web.css';
import './landing.css';
import { initSentry } from './lib/sentry.js';
import { initGlobalKeyboardHandling } from "./lib/globalKeyboardHandler.js";

if (_d) _d.innerHTML += '<br>[JS] All imports loaded';

try { initSentry(); if (_d) _d.innerHTML += '<br>[JS] Sentry OK'; }
catch(e) { if (_d) _d.innerHTML += '<br>[JS] Sentry FAIL: ' + e.message; }

try { initGlobalKeyboardHandling(); if (_d) _d.innerHTML += '<br>[JS] Keyboard OK'; }
catch(e) { if (_d) _d.innerHTML += '<br>[JS] Keyboard FAIL: ' + e.message; }

try {
  if (_d) _d.innerHTML += '<br>[JS] Calling createRoot...';
  ReactDOM.createRoot(document.getElementById('web-root')).render(
    <React.StrictMode>
      <GlobalAppBoundary>
        <WebApp />
      </GlobalAppBoundary>
    </React.StrictMode>
  );
  if (_d) _d.innerHTML += '<br>[JS] render() called';
} catch(e) {
  if (_d) _d.innerHTML += '<br>[JS] RENDER CRASH: ' + e.message + '<pre>' + (e.stack||'') + '</pre>';
}
