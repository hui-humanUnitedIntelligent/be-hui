import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from './WebApp.jsx';
import './index.css';
import './web.css';
import './landing.css';
import { initSentry } from './lib/sentry.js';
import { initGlobalKeyboardHandling } from "./lib/globalKeyboardHandler.js";

const _diag = document.getElementById('diag');
if (_diag) _diag.innerHTML += '<br>[JS] ✅ Imports loaded (no StrictMode)';

try { initSentry(); _diag && (_diag.innerHTML += '<br>[JS] ✅ Sentry'); }
catch (e) { _diag && (_diag.innerHTML += '<br>[JS] ❌ Sentry: ' + e.message); }

try { initGlobalKeyboardHandling(); _diag && (_diag.innerHTML += '<br>[JS] ✅ Keyboard'); }
catch (e) { _diag && (_diag.innerHTML += '<br>[JS] ❌ Keyboard: ' + e.message); }

window.addEventListener('unhandledrejection', function(e) {
  _diag && (_diag.innerHTML += '<br>[JS] ❌ REJECTION: ' + (e.reason?.message || e.reason));
});
window.addEventListener('error', function(e) {
  _diag && (_diag.innerHTML += '<br>[JS] ❌ ERROR: ' + (e.error?.message || e.message));
});

class DiagBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    const d = document.getElementById('diag');
    if (d) {
      d.innerHTML += '<br>[JS] ❌ BOUNDARY: ' + (error?.message || error);
      d.innerHTML += '<br>[JS] ❌ STACK: ' + (error?.stack || '').substring(0, 300);
      d.innerHTML += '<br>[JS] ❌ CS: ' + (info?.componentStack || '').substring(0, 300);
    }
  }
  render() {
    if (this.state.error) return React.createElement('div', { style: { padding: '20px', color: 'red' } }, 'CAUGHT: ' + this.state.error.message);
    return this.props.children;
  }
}

try {
  _diag && (_diag.innerHTML += '<br>[JS] Rendering WebApp (NO StrictMode)...');
  // NO StrictMode wrapper
  ReactDOM.createRoot(document.getElementById('web-root')).render(
    React.createElement(DiagBoundary, null, React.createElement(WebApp))
  );
  _diag && (_diag.innerHTML += '<br>[JS] ✅ render() called');
} catch (e) {
  _diag && (_diag.innerHTML += '<br>[JS] ❌ CRASH: ' + e.message);
}

[500, 1000, 2000, 5000].forEach(function(delay) {
  setTimeout(function() {
    var root = document.getElementById('web-root');
    _diag && (_diag.innerHTML += '<br>[' + delay + 'ms] children: ' + (root ? root.childNodes.length : 'NULL'));
  }, delay);
});
