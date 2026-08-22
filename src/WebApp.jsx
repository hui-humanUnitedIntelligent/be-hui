// ══════════════════════════════════════════════════════════════════════════════
// WebApp.jsx — HUI Web Root Component
// ══════════════════════════════════════════════════════════════════════════════
//
// FIX 2026-08-22: Whitescreen bei /app/login
// Root Cause: React.lazy + Vite __vitePreload hängen bei Suspense fest (#807).
// 
// Lösung: Öffentliche Routen (LoginPage, LandingPage, AuthCallback) als
// EAGER imports — kein React.lazy, kein Suspense.
// AuthenticatedApp bleibt lazy (Suspense) — nur nach Login gerendert.
// ══════════════════════════════════════════════════════════════════════════════

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext.jsx';
import { ToastContainer } from './lib/useToast.jsx';

// ── Eager: öffentliche Routen (kein Suspense, kein Lazy) ────────────────────
import LandingPage  from './components/landing/LandingPage';
import LoginPage    from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';

// ── Lazy: AuthenticatedApp (nur nach Login) ────────────────────────────────
const AuthenticatedApp = lazy(() => import('./AuthenticatedApp.jsx'));

// ── Loading Screen ─────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="web-loading">
      <div className="web-loading-spinner" />
      <p style={{ fontSize: 13, color: '#8A8A9E' }}>HUI wird geladen…</p>
    </div>
  );
}

// ── Suspense Timeout-Fallback (Punkt 10.1 — max 8s) ────────────────────────
// Wenn ein lazy-loaded Component nach 8s nicht geladen ist,
// zeige Fallback-UI mit Neu-Laden-Button statt ewigem Spinner.
import { useState, useEffect } from 'react';
import { RouteBoundary } from './lib/ErrorBoundaries.jsx';
import { reportError } from './lib/errorReporter.js';

function SuspenseWithTimeout({ children, fallback }) {
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
      try {
        reportError('suspense_hang', {
          message: 'Suspense-Hang: Component nach 8s nicht geladen (React.lazy/Vite)',
          component: 'SuspenseWithTimeout',
        });
      } catch (_) {}
    }, 8000);
    return () => clearTimeout(timer);
  }, []);
  if (timedOut) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', padding: 24, gap: 12,
        fontFamily: 'inherit',
      }}>
        <div style={{ fontSize: 28, opacity: 0.5 }}>✦</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>
          Laden dauert zu lange
        </div>
        <div style={{ fontSize: 13, color: '#888', textAlign: 'center', maxWidth: 280 }}>
          Die Komponente konnte nicht rechtzeitig geladen werden.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 24px', background: '#0DC4B5',
            border: 'none', borderRadius: 12,
            color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Neu laden
        </button>
      </div>
    );
  }
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

// ── Conditional Router ──────────────────────────────────────────────────────
function ConditionalRouter() {
  const { isAuthenticated, loadingAuth } = useAuth();

  if (loadingAuth) return <LoadingScreen />;

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <RouteBoundary name="AuthenticatedApp" fallbackTitle="App konnte nicht geladen werden">
      <SuspenseWithTimeout fallback={<LoadingScreen />}>
        <AuthenticatedApp />
      </SuspenseWithTimeout>
    </RouteBoundary>
  );
}

// ── WebApp Root ──────────────────────────────────────────────────────────────
export default function WebApp() {
  return (
    <BrowserRouter basename="/app">
      <AuthProvider>
        <ToastContainer />
        <ConditionalRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
