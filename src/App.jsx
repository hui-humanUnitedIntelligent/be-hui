// src/App.jsx — BOOT ISOLATION MODE
// Alle lazy imports deaktiviert.
// Ziel: weißen Bildschirm isolieren — ein Modul nach dem anderen re-enablen.
console.log('[BOOT] App.jsx module start');

import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';

console.log('[BOOT] AuthContext imported');

import { AppStateProvider } from './lib/AppStateContext';

console.log('[BOOT] AppStateContext imported');

// EAGER: Login immer gebraucht
import LoginPage    from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';

console.log('[BOOT] LoginPage + AuthCallback imported');

// HOME: minimal stub — kein lazy
import Home from './pages/Home';

console.log('[BOOT] Home imported');

// ── Boot error catcher ───────────────────────────────────────────
class BootBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(e) {
    console.error('[BOOT BOUNDARY]', e);
    return { err: e };
  }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 32, fontFamily: "monospace", background: "#fff" }}>
          <div style={{ color: "red", fontWeight: 800, marginBottom: 8 }}>
            [BOOT BOUNDARY CAUGHT]
          </div>
          <pre style={{ fontSize: 12, color: "#333", whiteSpace: "pre-wrap" }}>
            {this.state.err?.message}
            {String(this.state.err?.stack || "")}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── ProtectedRoute: minimal ──────────────────────────────────────
function useAuthSimple() {
  const ctx = React.useContext(AuthCtx);
  return ctx || { isAuthenticated: false, loadingAuth: true };
}
const AuthCtx = React.createContext(null);

function ProtectedRoute({ children }) {
  // Temporaer: kein Auth-Check — direkt rendern
  // Wenn BOOT OK erscheint, Auth wieder aktivieren
  return children;
}

// ── App ──────────────────────────────────────────────────────────
export default function App() {
  console.log('[BOOT] App() render called');
  return (
    <BootBoundary>
      <AuthProvider>
        <AppStateProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login"         element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/*"             element={
                <ProtectedRoute><Home /></ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </AppStateProvider>
      </AuthProvider>
    </BootBoundary>
  );
}

console.log('[BOOT] App.jsx module fully evaluated');
