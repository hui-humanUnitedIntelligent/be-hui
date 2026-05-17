import React, { useState, useEffect, lazy, Suspense } from 'react'
import { sentryCapture, Sentry } from './lib/sentry'
import { RouteBoundary, OverlayBoundary } from './lib/ErrorBoundaries'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { AppStateProvider } from './lib/AppStateContext'

// ── EAGER: Auth-kritische Seiten (immer sofort gebraucht) ───────
import LoginPage    from './pages/LoginPage'
import AuthCallback from './pages/AuthCallback'

// ── LAZY: Alle anderen Routes ───────────────────────────────────
// Erzeugen separate Chunks → schnellerer Initial-Load
// WirkerProfilePage (~140KB) und CreatorStudio laden nur bei Bedarf
const Home              = lazy(() => import('./pages/Home'))
const ImpactPage        = lazy(() => import('./pages/ImpactPage'))
const Admin             = lazy(() => import('./pages/Admin'))
const DiagnosePage      = lazy(() => import('./pages/DiagnosePage'))
const PlatformDashboard = lazy(() => import('./pages/PlatformDashboard'))
const CreatorStudio     = lazy(() => import('./pages/CreatorStudio'))
const ProfilePage       = lazy(() => import('./components/ProfilePage'))
const WirkerProfilePage = lazy(() => import('./components/WirkerProfilePage'))
const WorkDetailPage    = lazy(() => import('./components/WorkDetailPage'))

// ── Suspense Fallback ────────────────────────────────────────────
// Ruhig, markenfrei — kein Spinner-Stress
function HuiSuspense({ children }) {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#F9F7F4',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2px solid #EEEBE6', borderTopColor: '#16D7C5',
          animation: 'hui-spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes hui-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>{children}</Suspense>
  );
}


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
    // ── Sentry: Crash mit vollem Kontext senden ──────────────
    // console.error entfernt — Sentry loggt vollständig (Phase 4B)
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
          // auto-retry nach visibility restore (geloggt in Sentry)
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

/* ── Router Wrapper: /profile/:username → WirkerProfilePage ────────── */
// onBook öffnet RequestSheet INNERHALB der WirkerProfilePage
// Kein separates BookingFlow-Overlay mehr nötig
function WirkerProfileRouteWrapper() {
  const { username } = useParams();
  const navigate     = useNavigate();

  return (
    <WirkerProfilePage
      wirker={{ username }}
      onClose={() => navigate(-1)}
      onBook={() => { /* RequestSheet öffnet sich intern in WirkerProfilePage */ }}
      onMessage={() => { /* Chat intern als Sheet in WirkerProfilePage */ }}
    />
  );
}

/* /profile/me → lädt eigenes Profil via Auth */
function OwnProfileRedirect() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [username, setUsername] = React.useState(null);

  React.useEffect(() => {
    if (!user?.id) return;
    // Username aus Supabase holen
    import('./lib/supabaseClient').then(({ supabase }) => {
      supabase.from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            // Fallback bei DB-Fehler: user.id als Identifier
            navigate(`/profile/${user.id}`, { replace: true });
            return;
          }
          if (data?.username) {
            navigate(`/profile/${data.username}`, { replace: true });
          } else {
            navigate(`/profile/${user.id}`, { replace: true });
          }
        })
        .catch(() => {
          navigate(`/profile/${user.id}`, { replace: true });
        });
    }).catch(() => {
      // supabaseClient import failed — navigate with user.id
      navigate(`/profile/${user.id}`, { replace: true });
    });
  }, [user?.id]);

  // Loading state — kurze Animation
  return (
    <div style={{ position:'fixed', inset:0, display:'flex',
      alignItems:'center', justifyContent:'center',
      background:'#F9F6F2', fontFamily:"-apple-system,sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:32, marginBottom:12,
          animation:'spin 1.2s linear infinite',
          display:'inline-block' }}>✦</div>
        <div style={{ fontSize:14, color:'#888', fontWeight:500 }}>
          Lade dein Profil…
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ── App Routes ────────────────────────────────────────────────────── */
function AppRoutes() {
  return (
    // HuiSuspense wraps all lazy routes — zeigt ruhigen Ladeindikator
    <HuiSuspense>
      <Routes>
        {/* Auth — EAGER (kein lazy) */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/Home" replace />} />

        {/* Main App — LAZY */}
        <Route path="/Home" element={
          <ProtectedRoute><Home /></ProtectedRoute>
        }/>

        {/* Work Detail — LAZY */}
        <Route path="/work/:id" element={
          <ProtectedRoute><WorkDetailPage /></ProtectedRoute>
        }/>

        {/* Public Profile — LAZY (~140KB WirkerProfilePage nur bei Bedarf) */}
        <Route path="/profile/:username" element={
          <ProtectedRoute><WirkerProfileRouteWrapper /></ProtectedRoute>
        }/>

        {/* /profile/me shortcut */}
        <Route path="/profile/me" element={
          <ProtectedRoute><OwnProfileRedirect /></ProtectedRoute>
        }/>

        {/* Impact — LAZY */}
        <Route path="/impact" element={
          <ProtectedRoute><ImpactPage /></ProtectedRoute>
        }/>

        {/* Legacy redirect */}
        <Route path="/BookingFlow" element={<Navigate to="/Home" replace />}/>

        {/* Admin — LAZY */}
        <Route path="/Admin" element={
          <ProtectedRoute><Admin /></ProtectedRoute>
        }/>

        {/* Diagnose — LAZY (nur Dev) */}
        <Route path="/diagnose" element={<DiagnosePage />} />

        {/* Platform Dashboard — intern, Admin-only */}
        <Route path="/dashboard" element={
          <ProtectedRoute><PlatformDashboard /></ProtectedRoute>
        }/>

        {/* Creator Studio — LAZY */}
        <Route path="/studio" element={
          <ProtectedRoute><CreatorStudio /></ProtectedRoute>
        }/>
        <Route path="/studio/:section" element={
          <ProtectedRoute><CreatorStudio /></ProtectedRoute>
        }/>

        {/* 404 → Home */}
        <Route path="*" element={<Navigate to="/Home" replace />} />
      </Routes>
    </HuiSuspense>
  );
}

/* ── Root ──────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
        <AppStateProvider>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
          </AppStateProvider>
      </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}