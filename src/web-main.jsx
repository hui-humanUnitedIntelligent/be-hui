import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext.jsx';
import { ToastContainer } from './lib/useToast.jsx';
import { GlobalAppBoundary } from './lib/ErrorBoundaries.jsx';
import LandingPage from './components/landing/LandingPage';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import './index.css';
import './web.css';
import './landing.css';

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
          <ToastContainer />
          <div style={{ padding: 40, fontFamily: 'monospace', fontSize: 14, color: '#0DC4B5' }}>
            All imports loaded OK! Routes: {typeof LandingPage}, {typeof LoginPage}, {typeof AuthCallback}
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
