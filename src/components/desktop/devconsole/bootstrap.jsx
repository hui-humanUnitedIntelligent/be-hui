// ══════════════════════════════════════════════════════════════════════════════
// bootstrap.jsx — HUI Developer Console Loader
// ══════════════════════════════════════════════════════════════════════════════
import React from 'react';
import { createRoot } from 'react-dom/client';
import HuiDevConsole from './HuiDevConsole.jsx';
import { store } from './store.js';
import './devConsole.css';

// Store aktivieren — installiert Error/Network/Console/Perf Hooks
store.activate();

// Console rendern — eigener React-Root, eigener DOM-Knoten
// Wartet bis App gemountet ist, dann Console darüber legen
function mountConsole() {
  const container = document.createElement('div');
  container.id = 'hui-dev-console-root';
  document.body.appendChild(container);
  createRoot(container).render(React.createElement(HuiDevConsole));
}

if (document.readyState === 'complete') {
  setTimeout(mountConsole, 500);
} else {
  window.addEventListener('load', () => setTimeout(mountConsole, 2000));
}
