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
    <Suspense fallback={<LoadingScreen />}>
      <AuthenticatedApp />
    </Suspense>
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
