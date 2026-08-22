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

// MutationObserver: log every change to web-root
const root = document.getElementById('web-root');
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(m) {
    const d = document.getElementById('diag');
    if (d) {
      d.innerHTML += '<br>[MUT] type:' + m.type + ' added:' + m.addedNodes.length + ' removed:' + m.removedNodes.length;
      if (m.addedNodes.length > 0) {
        d.innerHTML += '<br>[MUT] added: ' + (m.addedNodes[0].nodeName + ':' + (m.addedNodes[0].textContent || '').substring(0, 50));
      }
      if (m.removedNodes.length > 0) {
        d.innerHTML += '<br>[MUT] removed: ' + (m.removedNodes[0].nodeName + ':' + (m.removedNodes[0].textContent || '').substring(0, 50));
      }
    }
  });
});
observer.observe(root, { childList: true, subtree: true, attributes: true, characterData: true });
_diag && (_diag.innerHTML += '<br>[JS] Observer attached');

// Also check for unhandled rejections and errors
window.addEventListener('unhandledrejection', function(e) {
  _diag && (_diag.innerHTML += '<br>[JS] ❌ REJECTION: ' + (e.reason?.message || e.reason));
});
window.addEventListener('error', function(e) {
  _diag && (_diag.innerHTML += '<br>[JS] ❌ ERROR: ' + (e.error?.message || e.message));
});

// DiagBoundary
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
    if (this.state.error) {
      return React.createElement('div', { style: { padding: '20px', color: 'red' } }, 'CAUGHT: ' + this.state.error.message);
    }
    return this.props.children;
  }
}

// Render
try {
  _diag && (_diag.innerHTML += '<br>[JS] Rendering...');
  ReactDOM.createRoot(root).render(
    React.createElement(DiagBoundary, null, React.createElement(WebApp))
  );
  _diag && (_diag.innerHTML += '<br>[JS] ✅ render() called');
} catch (e) {
  _diag && (_diag.innerHTML += '<br>[JS] ❌ CRASH: ' + e.message);
}

// Check every 100ms for the first 2 seconds
for (let i = 100; i <= 2000; i += 100) {
  setTimeout(function() {
    const r = document.getElementById('web-root');
    _diag && (_diag.innerHTML += '<br>[' + i + 'ms] children: ' + r.childNodes.length);
  }, i);
}
