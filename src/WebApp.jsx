// ══════════════════════════════════════════════════════════════════════════════
// WebApp.jsx — HUI Web Root Component
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Root-Komponente fuer die HUI Web-Version (Browser/Desktop).
//   Setzt den minimalen Provider-Tree für öffentliche Routen auf und
//   lädt die vollständige App-Infrastruktur erst nach Authentifizierung.
//
// PROVIDER-TREE (optimiert v2.2):
//
//   Öffentlich (/login, /auth/callback):
//     BrowserRouter → AuthProvider → ToastContainer
//     → 0 App-Provider, 0 Supabase-Queries, 0 Realtime-Channels
//
//   Authentifiziert (alle App-Routen):
//     + AuthenticatedApp (lazy chunk)
//     → AppStateProvider → WorldSurfaceProvider → OrbWorldProvider →
//       GuidanceProvider → RadiusProvider → SavedPostsProvider →
//       LiveTickerProvider → ContentPreviewProvider → DesktopShell
//
//   Vorher (v2.1): Alle 9 Provider mounteten immer — auch auf /login.
//   Nachher (v2.2): 7 App-Provider + DesktopShell werden als separater
//   Chunk lazy-geladen und NUR nach erfolgreicher Authentifizierung gemountet.
//
// ROUTING:
//   Auth-Routen (Login, Callback) werden ohne Shell und ohne App-Provider gerendert.
//   Alle anderen Routen werden innerhalb von DesktopShell gerendert.
//
// WIEDERVERWENDUNG:
//   Alle Provider, alle Pages, alle Services, alle Hooks, alle Contexts
//   werden 1:1 aus der Mobile-App importiert. Keine Duplikate.
// ══════════════════════════════════════════════════════════════════════════════

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ── Auth Provider (MUSS global sein — auch /login braucht Auth-State) ──────────
import { AuthProvider, useAuth } from './lib/AuthContext.jsx';

// ── Toast (global — Login-Fehlermeldungen brauchen Toast) ─────────────────────
import { ToastContainer } from './lib/useToast.jsx';

// ── Eager: Auth-kritische Seiten (vor Auth-Entscheidung benoetigt) ────────────
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';

// ── Lazy: Authenticated App (separater Chunk — nur nach Login geladen) ────────
const AuthenticatedApp = lazy(() => import('./AuthenticatedApp.jsx'));

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
// Entscheidet basierend auf Auth-Status, welche Provider und Routen gerendert
// werden. Wenn nicht authentifiziert: nur Login/Callback ohne App-Provider.
// Wenn authentifiziert: alle App-Provider + DesktopShell-Routen.
function ConditionalRouter() {
  const { isAuthenticated, loadingAuth } = useAuth();

  if (loadingAuth) return <LoadingScreen />;

  if (!isAuthenticated) {
    // ── Öffentliche Routen — KEINE App-Provider ──────────────────────
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // ── Authentifizierte Routen — alle App-Provider (lazy chunk) ────────
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
