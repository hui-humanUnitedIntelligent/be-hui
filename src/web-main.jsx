import React from 'react';
import ReactDOM from 'react-dom/client';

// No CSS, no Sentry, no keyboard handler, no WebApp
// Just render a simple div
const root = document.getElementById('web-root');
if (root) {
  ReactDOM.createRoot(root).render(
    React.createElement('div', {style: {padding: 40, fontFamily: 'monospace'}}, 
      'HUI Web — minimal test. React version: ' + React.version)
  );
}
