import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext.jsx';
import { GlobalAppBoundary } from './lib/ErrorBoundaries.jsx';
import './index.css';
import './web.css';

window.__HUI_DIAG__ = { step: 'module_loaded' };

try {
  const rootEl = document.getElementById('web-root');
  window.__HUI_DIAG__.rootEl = rootEl ? 'found' : 'NULL';

  const root = ReactDOM.createRoot(rootEl);
  window.__HUI_DIAG__.step = 'after_createRoot';

  root.render(
    <GlobalAppBoundary>
      <BrowserRouter basename="/app">
        <AuthProvider>
          <div style={{ padding: 40, fontFamily: 'monospace', fontSize: 14, color: '#0DC4B5' }}>
            BrowserRouter + AuthProvider rendered OK!
          </div>
        </AuthProvider>
      </BrowserRouter>
    </GlobalAppBoundary>
  );
  window.__HUI_DIAG__.step = 'after_render';
} catch (e) {
  window.__HUI_DIAG__.step = 'CRASH';
  window.__HUI_DIAG__.crash = e.message;
}
