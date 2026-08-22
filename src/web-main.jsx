import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from './WebApp.jsx';
import { GlobalAppBoundary } from './lib/ErrorBoundaries.jsx';
import './index.css';
import './web.css';
import './landing.css';

const _d = document.getElementById('diag');
if (_d) _d.innerHTML = '[JS] module loaded, React=' + React.version;

const rootEl = document.getElementById('web-root');

// Test 1: Just WebApp, no StrictMode, no ErrorBoundary
const r = ReactDOM.createRoot(rootEl);
r.render(<WebApp />);
if (_d) _d.innerHTML += '\n[JS] render() called';

setTimeout(() => {
  if (_d) {
    _d.innerHTML += '\n[3s] children=' + rootEl.childElementCount;
    _d.innerHTML += '\n[3s] innerHTML.len=' + rootEl.innerHTML.length;
    _d.innerHTML += '\n[3s] preview=' + rootEl.innerHTML.substring(0, 500);
  }
}, 3000);
