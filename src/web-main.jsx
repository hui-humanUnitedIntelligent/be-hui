import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext.jsx';
import { ToastContainer } from './lib/useToast.jsx';
import { GlobalAppBoundary } from './lib/ErrorBoundaries.jsx';
import WebApp from './WebApp.jsx';
import './index.css';
import './web.css';

window.__HUI_DIAG__ = { step: 'module_loaded' };

try {
  const rootEl = document.getElementById('web-root');
  window.__HUI_DIAG__.rootEl = rootEl ? 'found' : 'NULL';

  // Test: Full WebApp (with GlobalAppBoundary wrapper)
  const root = ReactDOM.createRoot(rootEl);
  window.__HUI_DIAG__.step = 'after_createRoot';

  root.render(
    <GlobalAppBoundary>
      <WebApp />
    </GlobalAppBoundary>
  );
  window.__HUI_DIAG__.step = 'after_render';
} catch (e) {
  window.__HUI_DIAG__.step = 'CRASH';
  window.__HUI_DIAG__.crash = e.message;
  window.__HUI_DIAG__.stack = (e.stack || '').substring(0, 500);
}
