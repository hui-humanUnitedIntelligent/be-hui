// src/main.jsx — BOOT ISOLATION MODE
// Fatal handlers ZUERST — vor jedem anderen Import
window.__HUI_BOOT_START__ = Date.now();
console.log('[BOOT] main.jsx starting');

window.onerror = function(msg, src, line, col, err) {
  console.error('[FATAL]', msg, src + ':' + line, err);
};
window.onunhandledrejection = function(e) {
  console.error('[PROMISE]', e.reason);
};

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

console.log('[BOOT] imports resolved — mounting React');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('[BOOT] ReactDOM.createRoot called');
