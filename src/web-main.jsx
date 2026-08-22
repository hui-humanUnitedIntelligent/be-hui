import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from './WebApp.jsx';
import './index.css';
import './web.css';
import './landing.css';
import { initSentry } from './lib/sentry.js';
import { initGlobalKeyboardHandling } from "./lib/globalKeyboardHandler.js";

const _diag = document.getElementById('diag');
if (_diag) _diag.innerHTML += '<br>[JS] ✅ Imports loaded';

try { initSentry(); _diag && (_diag.innerHTML += '<br>[JS] ✅ Sentry'); }
catch (e) { _diag && (_diag.innerHTML += '<br>[JS] ❌ Sentry: ' + e.message); }

try { initGlobalKeyboardHandling(); _diag && (_diag.innerHTML += '<br>[JS] ✅ Keyboard'); }
catch (e) { _diag && (_diag.innerHTML += '<br>[JS] ❌ Keyboard: ' + e.message); }

// ── Diagnostic Error Boundary — writes EVERYTHING to diag div ──
class DiagBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }
  
  static getDerivedStateFromError(error) {
    return { error };
  }
  
  componentDidCatch(error, errorInfo) {
    const d = document.getElementById('diag');
    if (d) {
      d.innerHTML += '<br>[JS] ❌ BOUNDARY CAUGHT: ' + (error?.message || error);
      d.innerHTML += '<br>[JS] ❌ Stack: <pre style="font-size:10px">' + (error?.stack || 'No stack').substring(0, 500) + '</pre>';
      d.innerHTML += '<br>[JS] ❌ ComponentStack: <pre style="font-size:10px">' + (errorInfo?.componentStack || 'No stack').substring(0, 500) + '</pre>';
      d.style.background = '#f0a';
      d.style.color = '#fff';
    }
  }
  
  render() {
    if (this.state.error) {
      // Ultra-simple error UI — no external imports, no dependencies
      return React.createElement('div', 
        { style: { padding: '30px', fontFamily: 'monospace', fontSize: '14px', color: '#e00' } },
        'ERROR: ' + (this.state.error?.message || String(this.state.error))
      );
    }
    return this.props.children;
  }
}

// ── Render ──────────────────────────────────────────────────────
try {
  _diag && (_diag.innerHTML += '<br>[JS] Rendering WebApp with DiagBoundary...');
  ReactDOM.createRoot(document.getElementById('web-root')).render(
    React.createElement(React.StrictMode, null,
      React.createElement(DiagBoundary, null,
        React.createElement(WebApp)
      )
    )
  );
  _diag && (_diag.innerHTML += '<br>[JS] ✅ render() called');
} catch (e) {
  _diag && (_diag.innerHTML += '<br>[JS] ❌ SYNC CRASH: ' + e.message);
}

// Check at 500ms, 1s, 2s, 5s
[500, 1000, 2000, 5000].forEach(function(delay) {
  setTimeout(function() {
    var root = document.getElementById('web-root');
    var children = root ? root.childNodes.length : 'NULL';
    _diag && (_diag.innerHTML += '<br>[' + delay + 'ms] children: ' + children);
  }, delay);
});
