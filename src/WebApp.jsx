// ══════════════════════════════════════════════════════════════════════════════
// WebApp.jsx — HUI Web Root Component
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Root-Komponente fuer die HUI Web-Version (Browser/Desktop).
//   Setzt den minimalen Provider-Tree für öffentliche Routen auf und
//   lädt die vollständige App-Infrastruktur erst nach Authentifizierung.
//
// FIX 2026-08-22: React.lazy + Vite __vitePreload hängen bei Suspense fest
// (gleicher Root Cause wie PublicProfilePage Fix #807).
// Alle Komponenten jetzt eager (statischer Import) — kein React.lazy, kein Suspense.
//
// PROVIDER-TREE:
//   Öffentlich (/login, /auth/callback):
//     BrowserRouter → AuthProvider → ToastContainer → Routes
//   Authentifiziert (alle App-Routen):
//     + AuthenticatedApp → alle App-Provider
//
// ROUTING:
//   / → LandingPage (wenn nicht authentifiziert)
//   /login → LoginPage (wenn nicht authentifiziert)
//   /auth/callback → AuthCallback
//   Alle anderen App-Routen werden innerhalb von DesktopShell gerendert.
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ── Auth Provider (MUSS global sein — auch /login braucht Auth-State) ──────────
import { AuthProvider, useAuth } from './lib/AuthContext.jsx';

// ── Toast (global — Login-Fehlermeldungen brauchen Toast) ─────────────────────
import { ToastContainer } from './lib/useToast.jsx';

// ── Eager imports (FIX 2026-08-22: kein React.lazy — siehe #807) ──────────────
import LandingPage    from './components/landing/LandingPage';
import LoginPage      from './pages/LoginPage';
import AuthCallback   from './pages/AuthCallback';
import AuthenticatedApp from './AuthenticatedApp.jsx';

// ── Loading Screen (während Auth-Check) ─────────────────────────────────────
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
    // ── Öffentliche Routen — KEINE App-Provider ──────────────────────
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // ── Authentifizierte Routen — alle App-Provider ────────
  return <AuthenticatedApp />;
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
