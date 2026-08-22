import React from 'react';
import ReactDOM from 'react-dom/client';

window.__HUI_DIAG__ = { step: 'module_loaded' };

try {
  const rootEl = document.getElementById('web-root');
  window.__HUI_DIAG__.rootEl = rootEl ? 'found' : 'NULL';
  
  const root = ReactDOM.createRoot(rootEl);
  window.__HUI_DIAG__.step = 'after_createRoot';
  
  root.render(
    <div style={{ padding: 40, fontFamily: 'monospace', fontSize: 14, color: '#0DC4B5' }}>
      HUI Web — React rendered successfully!
    </div>
  );
  window.__HUI_DIAG__.step = 'after_render';
} catch (e) {
  window.__HUI_DIAG__.step = 'CRASH';
  window.__HUI_DIAG__.crash = e.message;
}
