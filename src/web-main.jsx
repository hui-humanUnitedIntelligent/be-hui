import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from './WebApp.jsx';
import './index.css';
import './web.css';
import './landing.css';
import { initSentry } from './lib/sentry.js';
import { initGlobalKeyboardHandling } from "./lib/globalKeyboardHandler.js";

const _d = document.getElementById('diag');
const rootEl = document.getElementById('web-root');
if (_d) _d.innerHTML = '[JS] web-main loaded';

// Capture ALL console output
const _origLog = console.log;
const _origErr = console.error;
const _origWarn = console.warn;

function logToDiag(prefix, args) {
  if (!_d) return;
  const msg = args.map(a => {
    try { return typeof a === 'object' ? JSON.stringify(a).substring(0,200) : String(a); }
    catch { return String(a); }
  }).join(' ');
  _d.innerHTML += '\n' + prefix + ' ' + msg.substring(0,500);
}

console.error = function(...a) { logToDiag('[ERR]', a); _origErr.apply(console, a); };
console.warn  = function(...a) { logToDiag('[WARN]', a); _origWarn.apply(console, a); };
console.log   = function(...a) { logToDiag('[LOG]', a); _origLog.apply(console, a); };

// Capture errors
window.addEventListener('error', (e) => {
  if (_d) _d.innerHTML += '\n[WIN_ERR] ' + e.message + ' @ ' + (e.filename||'') + ':' + (e.lineno||'');
});
window.addEventListener('unhandledrejection', (e) => {
  if (_d) _d.innerHTML += '\n[REJ] ' + (e.reason?.message || e.reason);
});

try { initSentry(); } catch(e) { if (_d) _d.innerHTML += '\n[JS] Sentry crash: ' + e.message; }
try { initGlobalKeyboardHandling(); } catch(e) { if (_d) _d.innerHTML += '\n[JS] KB crash: ' + e.message; }

// Render the REAL WebApp
try {
  const r = ReactDOM.createRoot(rootEl);
  r.render(
    <React.StrictMode>
      <WebApp />
    </React.StrictMode>
  );
  if (_d) _d.innerHTML += '\n[JS] render() called';
} catch(e) {
  if (_d) _d.innerHTML += '\n[JS] RENDER CRASH: ' + e.message + '\n' + (e.stack||'').substring(0,500);
}

// Check DOM state at intervals
[1, 2, 3, 5, 8].forEach(t => {
  setTimeout(() => {
    if (_d) _d.innerHTML += '\n[' + t + 's] children=' + rootEl.childElementCount + ' html.len=' + rootEl.innerHTML.length;
    if (rootEl.innerHTML.length > 0 && rootEl.innerHTML.length < 500) {
      if (_d) _d.innerHTML += ' preview=' + rootEl.innerHTML.substring(0, 200);
    }
  }, t * 1000);
});
