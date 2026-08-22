import React from 'react';
import ReactDOM from 'react-dom/client';

const _diag = document.getElementById('diag');
if (_diag) {
  _diag.innerHTML += '<br>[JS] ✅ Minimal test: React ' + (typeof React) + ', ReactDOM ' + (typeof ReactDOM);
}

try {
  const root = ReactDOM.createRoot(document.getElementById('web-root'));
  _diag && (_diag.innerHTML += '<br>[JS] createRoot OK');
  
  // TEST 1: Simplest possible render — no StrictMode, no boundary, no WebApp
  root.render(React.createElement('div', { style: { padding: '40px', fontSize: '24px', color: '#333' } }, 'HUI React Render Test — if you see this, React works'));
  _diag && (_diag.innerHTML += '<br>[JS] render() called with simple div');
} catch (e) {
  _diag && (_diag.innerHTML += '<br>[JS] ❌ CRASH: ' + e.message + '<pre>' + (e.stack||'') + '</pre>');
}

// Check after 500ms, 2s, 5s
[500, 2000, 5000].forEach(function(delay) {
  setTimeout(function() {
    var root = document.getElementById('web-root');
    var children = root ? root.childNodes.length : 'NULL';
    var html = root ? root.innerHTML.substring(0, 100) : 'NULL';
    _diag && (_diag.innerHTML += '<br>[' + delay + 'ms] children: ' + children + ', html: ' + html);
  }, delay);
});
