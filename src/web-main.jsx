// MINIMAL TEST: Does React render at all?
import React from 'react';
import ReactDOM from 'react-dom/client';

// Minimal CSS
import './index.css';

console.log('[HUI web-main] Starting minimal render...');

try {
  const root = document.getElementById('web-root');
  console.log('[HUI web-main] root element:', root);
  ReactDOM.createRoot(root).render(
    React.createElement('div', { style: { padding: 40, fontFamily: 'sans-serif' } },
      React.createElement('h1', null, 'HUI Web — Minimal Test'),
      React.createElement('p', null, 'If you see this, React works. The issue is in the app imports.')
    )
  );
  console.log('[HUI web-main] Render called successfully');
} catch (e) {
  console.error('[HUI web-main] Render FAILED:', e);
  document.getElementById('web-root').innerHTML = '<div style="padding:40px;font-family:sans-serif"><h1>Render Error</h1><pre>' + (e.message || e) + '</pre></div>';
}
