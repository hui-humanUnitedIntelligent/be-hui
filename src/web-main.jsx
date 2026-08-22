import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from './WebApp.jsx';
import { GlobalAppBoundary } from './lib/ErrorBoundaries.jsx';
import './index.css';
import './web.css';
import './landing.css';
import { initSentry } from './lib/sentry.js';
import { initGlobalKeyboardHandling } from "./lib/globalKeyboardHandler.js";

const _d = document.getElementById('diag');
if (_d) _d.innerHTML = '[JS] module loaded, React=' + React.version;

try { initSentry(); } catch(e) {}
try { initGlobalKeyboardHandling(); } catch(e) {}

const rootEl = document.getElementById('web-root');
const r = ReactDOM.createRoot(rootEl);

r.render(
  <React.StrictMode>
    <GlobalAppBoundary>
      <WebApp />
    </GlobalAppBoundary>
  </React.StrictMode>
);

if (_d) _d.innerHTML += '\n[JS] render() called';

// Inspect DOM after 3s
setTimeout(() => {
  if (_d) {
    _d.innerHTML += '\n[3s] #web-root children=' + rootEl.childElementCount;
    _d.innerHTML += '\n[3s] innerHTML.len=' + rootEl.innerHTML.length;
    _d.innerHTML += '\n[3s] innerHTML.preview=' + rootEl.innerHTML.substring(0, 300);
    // Check for error boundary UI
    const errUI = rootEl.querySelector('[style*="background"]');
    _d.innerHTML += '\n[3s] has error UI=' + !!errUI;
    // Check for loading screen
    const loadingEl = rootEl.querySelector('.web-loading');
    _d.innerHTML += '\n[3s] has .web-loading=' + !!loadingEl;
    // Check all class names
    const allEls = rootEl.querySelectorAll('*');
    const classes = new Set();
    allEls.forEach(el => { if(el.className) el.classList.forEach(c => classes.add(c)); });
    _d.innerHTML += '\n[3s] classes=' + [...classes].slice(0, 15).join(',');
  }
}, 3000);
