import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Home from './pages/Home'
import ImpactPage from './pages/ImpactPage'
import LoginPage from './pages/LoginPage'
import BookingFlow from './pages/BookingFlow'
import Admin from './pages/Admin'
import AuthCallback from './pages/AuthCallback'
import ProfilePage from './components/ProfilePage'
import WorkDetailPage from './components/WorkDetailPage'

/* ── Error Boundary ────────────────────────────────────────────────── */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(e, info) { console.error('[HUI ErrorBoundary]', e, info); }
  render() {
    if (this.state.hasError) return (
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", padding:32,
        background:"#F9F7F4", fontFamily:"-apple-system,sans-serif" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⚡️</div>
        <div style={{ fontWeight:800, fontSize:20, color:"#1A1A1A", marginBottom:8 }}>
          Kurzer Aussetzer
        </div>
        <div style={{ fontSize:13, color:"#888", textAlign:"center",
          maxWidth:260, lineHeight:1.6, marginBottom:24 }}>
          Etwas ist schiefgelaufen. Lade die Seite neu.
        </div>
        <button onClick={() => window.location.reload()}
          style={{ padding:"13px 28px", borderRadius:14, background:"#16D7C5",
            color:"white", border:"none", fontWeight:800, fontSize:14,
            cursor:"pointer", boxShadow:"0 4px 18px rgba(22,215,197,0.3)" }}>
          Neu laden
        </button>
        <button onClick={() => this.setState({ hasError:false, error:null })}
          style={{ marginTop:10, padding:"10px 20px", borderRadius:12,
            background:"none", border:"1.5px solid rgba(0,0,0,0.1)",
            color:"#888", fontWeight:600, fontSize:13, cursor:"pointer" }}>
          Trotzdem versuchen
        </button>
      </div>
    );
    return this.props.children;
  }
}

/* ── Loading Screen — with timeout escape hatch ────────────────────── */
function HUILoader({ message }) {
  const [timedOut, setTimedOut] = useState(false);

  // If still loading after 9s → show escape button
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 30000);
    return () => clearTimeout(t);
  }, []);

  if (timedOut) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", padding:32,
        background:"linear-gradient(135deg,#E6FAF8 0%,#FFF9F4 100%)",
        fontFamily:"-apple-system,sans-serif" }}>
        <div style={{ fontSize:40, marginBottom:16 }}>🌿</div>
        <div style={{ fontWeight:800, fontSize:18, color:"#1A1A1A", marginBottom:8 }}>
          Das dauert länger als erwartet
        </div>
        <div style={{ fontSize:13, color:"#888", textAlign:"center",
          maxWidth:280, lineHeight:1.65, marginBottom:28 }}>
          Möglicherweise gibt es ein Verbindungsproblem.
          Versuche es nochmal oder lade die Seite neu.
        </div>
        <button onClick={() => window.location.reload()}
          style={{ padding:"13px 28px", borderRadius:14, background:"#16D7C5",
            color:"white", border:"none", fontWeight:800, fontSize:14,
            cursor:"pointer", boxShadow:"0 4px 18px rgba(22,215,197,0.3)",
            marginBottom:10 }}>
          Neu laden
        </button>
        <button onClick={() => { window.location.href = "/login"; }}
          style={{ padding:"10px 22px", borderRadius:12,
            background:"none", border:"1.5px solid rgba(0,0,0,0.10)",
            color:"#888", fontWeight:600, fontSize:13, cursor:"pointer" }}>
          Zur Anmeldung
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center",
      justifyContent:"center",
      background:"linear-gradient(135deg,#E6FAF8 0%,#FFF9F4 100%)" }}>
      <div style={{ textAlign:"center" }}>
        <svg width="52" height="52" viewBox="0 0 64 64" fill="none"
          style={{ animation:"spin 1.5s linear infinite" }}>
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22E8D8"/>
              <stop offset="100%" stopColor="#FF8A6B"/>
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#lg)"/>
          <text x="10" y="44" fontSize="30" fontWeight="900" fill="white"
            fontFamily="-apple-system,system-ui" letterSpacing="-2">Hj</text>
        </svg>
        <div style={{ fontSize:13, color:"#888", marginTop:12, fontWeight:600 }}>
          {message || "HUI lädt…"}
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ── Protected Route — never hangs ────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loadingAuth, authError } = useAuth();

  // Auth timed out or errored → redirect to login
  if (authError === "timeout") {
    console.warn("[HUI] Auth timeout — redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Still checking session
  if (loadingAuth) return <HUILoader key="auth-loader" message="Anmeldung prüfen…" />;

  // Not authenticated → login
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}

/* ── Router Wrapper für ProfilePage als Route ──────────────────────── */
function ProfilePageRouteWrapper() {
  const { username } = useParams();
  const navigate = useNavigate();
  return (
    <ProfilePage
      username={username}
      onBack={() => navigate(-1)}
      onNavigate={navigate}
    />
  );
}

/* ── App Routes ────────────────────────────────────────────────────── */
function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/Home" replace />} />

      {/* Main App */}
      <Route path="/Home" element={
        <ProtectedRoute><Home /></ProtectedRoute>
      }/>

      {/* Work Detail */}
      <Route path="/work/:id" element={
        <ProtectedRoute><WorkDetailPage /></ProtectedRoute>
      }/>

      {/* Public Profile */}
      <Route path="/profile/:username" element={
        <ProtectedRoute><ProfilePageRouteWrapper /></ProtectedRoute>
      }/>

      {/* Legacy routes */}
      <Route path="/impact" element={
        <ProtectedRoute><ImpactPage /></ProtectedRoute>
      }/>
      <Route path="/BookingFlow" element={
        <ProtectedRoute><BookingFlow /></ProtectedRoute>
      }/>
      <Route path="/Admin" element={
        <ProtectedRoute><Admin /></ProtectedRoute>
      }/>

      {/* 404 fallback → Home (never dead end) */}
      <Route path="*" element={<Navigate to="/Home" replace />} />
    </Routes>
  );
}

/* ── Root ──────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
