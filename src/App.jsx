import React, { useState, useEffect } from 'react'
import { sentryCapture, Sentry } from './lib/sentry'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Home from './pages/Home'
import ImpactPage from './pages/ImpactPage'
import LoginPage from './pages/LoginPage'
import BookingFlow from './pages/BookingFlow'
import Admin from './pages/Admin'
import AuthCallback from './pages/AuthCallback'
import DiagnosePage from './pages/DiagnosePage'
import ProfilePage from './components/ProfilePage'
import WorkDetailPage from './components/WorkDetailPage'

/* ── Error Boundary ────────────────────────────────────────────────── */
// Globaler letzter Feed-Kontext fuer ErrorBoundary-Diagnose
window.__HUI_LAST_FEED_COMPONENT__ = null;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0, sentryEventId: null };
    this._visibilityHandler = null;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // ── Vollstaendiges Stack-Logging ────────────────────────
    console.error('[HUI ErrorBoundary] CRASH:', error.message);
    console.error('[HUI ErrorBoundary] Stack:', error.stack);
    console.error('[HUI ErrorBoundary] ComponentStack:', errorInfo?.componentStack);
    console.error('[HUI ErrorBoundary] LastFeedComponent:', window.__HUI_LAST_FEED_COMPONENT__);
    console.error('[HUI ErrorBoundary] document.hidden:', document.hidden);
    console.error('[HUI ErrorBoundary] visibilityState:', document.visibilityState);
    console.error('[HUI ErrorBoundary] userAgent:', navigator.userAgent);
    console.error('[HUI ErrorBoundary] RetryCount:', this.state.retryCount);

    // ── Sentry: Crash mit vollem Kontext senden ──────────────
    const eventId = sentryCapture(error, {
      source:              'ErrorBoundary',
      component_stack:     errorInfo?.componentStack || '',
      last_feed_component: window.__HUI_LAST_FEED_COMPONENT__ || null,
      document_hidden:     document.hidden,
      visibility_state:    document.visibilityState,
      user_agent:          navigator.userAgent,
      href:                window.location.href,
      retry_count:         this.state.retryCount,
      is_ipad:             /iPad/.test(navigator.userAgent) ||
                           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    });
    if (eventId) {
      console.error('[HUI ErrorBoundary] Sentry Event ID:', eventId);
      this.setState({ sentryEventId: eventId });
    }

    // ── Sentry.showReportDialog (optional) ───────────────────
    // Kann aktiviert werden wenn User-Feedback gewünscht:
    // if (eventId) Sentry.showReportDialog({ eventId });

    // Auto-retry nach Idle-Crash: wenn Tab wieder sichtbar wird, einmal versuchen
    if (this.state.retryCount < 2) {
      this._visibilityHandler = () => {
        if (document.visibilityState === 'visible') {
          document.removeEventListener('visibilitychange', this._visibilityHandler);
          this._visibilityHandler = null;
          console.log('[HUI ErrorBoundary] Auto-retry after visibility restore');
          this.setState(prev => ({
            hasError: false, error: null,
            retryCount: prev.retryCount + 1
          }));
        }
      };
      document.addEventListener('visibilitychange', this._visibilityHandler);
    }
  }

  componentWillUnmount() {
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
    }
  }

  reset() {
    this.setState(prev => ({ hasError: false, error: null, retryCount: prev.retryCount + 1 }));
  }

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
        <button onClick={() => this.reset()}
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

/* ── HUI Ambient Splash — kein Login-Flash, kein Spinner-Stress ──── */
function HUILoader() {
  const [timedOut, setTimedOut] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 25000);
    return () => clearTimeout(t);
  }, []);

  if (timedOut) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:32,
      background:"#F9F7F4", fontFamily:"-apple-system,sans-serif" }}>
      <div style={{ fontSize:38, marginBottom:14 }}>🌿</div>
      <div style={{ fontWeight:800, fontSize:18, color:"#1A1A1A", marginBottom:8 }}>
        Verbindung dauert länger als erwartet
      </div>
      <div style={{ fontSize:13, color:"#888", textAlign:"center",
        maxWidth:280, lineHeight:1.65, marginBottom:28 }}>
        Bitte prüfe deine Internetverbindung.
      </div>
      <button onClick={() => window.location.reload()}
        style={{ padding:"13px 28px", borderRadius:14, background:"#16D7C5",
          color:"white", border:"none", fontWeight:800, fontSize:14,
          cursor:"pointer", boxShadow:"0 4px 18px rgba(22,215,197,0.3)", marginBottom:10 }}>
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

  return (
    <div style={{
      minHeight:"100vh",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      background:"linear-gradient(160deg,#F0FAF9 0%,#FFF9F4 55%,#F9F7F4 100%)",
      fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",
    }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20,
        animation:"hui-splash-fade 0.55s ease both" }}>
        <div style={{ animation:"hui-splash-pulse 3s ease-in-out infinite" }}>
          <img src="/hui-logo.jpg" alt="HUI"
            style={{ width:72, height:72, borderRadius:"50%", objectFit:"cover",
              boxShadow:"0 8px 32px rgba(22,215,197,0.22), 0 2px 8px rgba(0,0,0,0.07)",
              border:"2px solid rgba(255,255,255,0.90)" }}
            onError={e => { e.target.style.display="none"; }}
          />
        </div>
        <div style={{ fontSize:13, color:"rgba(60,60,60,0.50)", fontWeight:500, letterSpacing:0.3 }}>
          HUI
        </div>
      </div>
      <style>{`
        @keyframes hui-splash-fade {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes hui-splash-pulse {
          0%,100% { transform:scale(1);    }
          50%      { transform:scale(1.04); }
        }
      `}</style>
    </div>
  );
}


/* ── Protected Route ───────────────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loadingAuth, authChecked } = useAuth();
  // Kein Redirect bevor Auth vollständig geprüft — verhindert Login-Flash
  if (loadingAuth || !authChecked) return <HUILoader />;
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
      {/* ── TEMPORÄR: Diagnose-Route — nach Debugging entfernen ── */}
      <Route path="/diagnose" element={<DiagnosePage />} />
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