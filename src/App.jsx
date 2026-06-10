import React, { useState, useEffect, lazy, Suspense } from 'react'
import { sentryCapture, Sentry } from './lib/sentry'
import { RouteBoundary, OverlayBoundary } from './lib/ErrorBoundaries'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { AppStateProvider } from './lib/AppStateContext'
import { WorldSurfaceProvider } from './context/WorldSurfaceContext.jsx'
import { OrbWorldProvider } from './context/OrbWorldContext.jsx'
import { GuidanceProvider } from './components/guidance/GuidanceContext.jsx'

// ── EAGER: Auth-kritische Seiten (immer sofort gebraucht) ───────
import LoginPage    from './pages/LoginPage'
import { AuthGateProvider } from './components/auth/AuthGate.jsx'
import { ToastContainer } from './lib/useToast.jsx'
import ProfileCompletionFlow from './components/auth/ProfileCompletionFlow.jsx'
import AuthCallback from './pages/AuthCallback'

import { supabase } from './lib/supabaseClient'
import { detectReferral } from './lib/referralTracking.js'

// ── LAZY: Alle anderen Routes ───────────────────────────────────
// Erzeugen separate Chunks → schnellerer Initial-Load
// WirkerProfilePage (~140KB) und CreatorStudio laden nur bei Bedarf
const Home              = lazy(() => import('./pages/Home'))
const RefRedirect       = lazy(() => import('./pages/RefRedirect'))
import ImpactPage from './pages/ImpactPage'
const Admin             = lazy(() => import('./pages/Admin'))
const DiagnosePage      = lazy(() => import('./pages/DiagnosePage'))
const ProfileDebugPage  = lazy(() => import('./pages/ProfileDebugPage'))
const PlatformDashboard = lazy(() => import('./pages/PlatformDashboard'))
const CreatorStudio     = lazy(() => import('./pages/CreatorStudio'))
const WirkerProfilePage = lazy(() => import('./pages/wirker-profile/index.jsx'))
const WorkDetailPage    = lazy(() => import('./components/WorkDetailPage'))

// ── Route Factory ──────────────────────────────────────────────────────────
import { createTabPage, filterValidPages } from './lib/factories/createTabPage.js'

// Normalisierte, validierte Route-Definitionen
// Alle Routen gehen durch createTabPage() — kein undefined-component möglich
export const APP_ROUTES = filterValidPages([
  createTabPage({ key:'home',      route:'/Home',           component:Home,              title:'HUI',         protectedRoute:true,  preload:true  }),
  createTabPage({ key:'impact',    route:'/impact',         component:ImpactPage,        title:'Impact',      protectedRoute:true,  preload:false }),
  createTabPage({ key:'work',      route:'/work/:id',       component:WorkDetailPage,    title:'Werk',        protectedRoute:true,  preload:false }),
  createTabPage({ key:'profile',   route:'/profile/:username', component:WirkerProfilePage, title:'Profil',  protectedRoute:true,  preload:false }),
  createTabPage({ key:'admin',     route:'/Admin',          component:Admin,             title:'Admin',       protectedRoute:true,  preload:false }),
  createTabPage({ key:'diagnose',  route:'/diagnose',       component:DiagnosePage,      title:'Diagnose',    protectedRoute:false, preload:false }),
  createTabPage({ key:'dashboard', route:'/dashboard',      component:PlatformDashboard, title:'Dashboard',   protectedRoute:true,  preload:false }),
  createTabPage({ key:'studio',    route:'/studio',         component:CreatorStudio,     title:'Studio',      protectedRoute:true,  preload:false }),
])

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
window.__HUI_WORLD_STATE__         = { activeSurface: null, activeTab: "feed", repaintPhase: null };

// Referral-Code aus URL beim App-Start erkennen
if (typeof window !== 'undefined') { detectReferral(); }

// Phase 16.6: Global error tracer for crash diagnostics
if (typeof window !== "undefined" && !window.__HUI_ERROR_TRACER__) {
  window.__HUI_ERROR_TRACER__ = true;

  window.addEventListener("error", (e) => {
    const ws = window.__HUI_WORLD_STATE__ || {};
    console.error("[HUI GLOBAL ERROR]", {
      message:       e.message,
      filename:      e.filename,
      line:          e.lineno,
      col:           e.colno,
      stack:         e.error?.stack?.slice(0, 400),
      activeSurface: ws.activeSurface,
      activeTab:     ws.activeTab,
      repaintPhase:  ws.repaintPhase,
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    const ws = window.__HUI_WORLD_STATE__ || {};
    console.error("[HUI UNHANDLED REJECTION]", {
      reason:        String(e.reason),
      stack:         e.reason?.stack?.slice(0, 400),
      activeSurface: ws.activeSurface,
      activeTab:     ws.activeTab,
      repaintPhase:  ws.repaintPhase,
    });
  });
}

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
    // DEBUG: Echten Fehler IMMER sichtbar loggen
    console.error("[GLOBAL ERROR] message:", error?.message);
    console.error("[GLOBAL ERROR] stack:", error?.stack);
    console.error("[GLOBAL ERROR] componentStack:", errorInfo?.componentStack);
    // ── Sentry: Crash mit vollem Kontext senden ──────────────
    // console.error entfernt — Sentry loggt vollständig (Phase 4B)
    const ws = window.__HUI_WORLD_STATE__ || {};
    const eventId = sentryCapture(error, {
      source:              'ErrorBoundary',
      component_stack:     errorInfo?.componentStack || '',
      last_feed_component: window.__HUI_LAST_FEED_COMPONENT__ || null,
      // Phase 16.6: World state at time of crash
      active_surface:      ws.activeSurface   ?? null,
      active_tab:          ws.activeTab        ?? null,
      repaint_phase:       ws.repaintPhase     ?? null,
      document_hidden:     document.hidden,
      visibility_state:    document.visibilityState,
      user_agent:          navigator.userAgent,
      href:                window.location.href,
      retry_count:         this.state.retryCount,
      is_ipad:             /iPad/.test(navigator.userAgent) ||
                           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    });
    // Store on instance for render-time display
    this._worldState = ws;
    if (eventId) {
      this.setState({ sentryEventId: eventId });
    }

    // ── Sentry.showReportDialog (optional) ───────────────────
    // Kann aktiviert werden wenn User-Feedback gewünscht:
    // if (eventId) Sentry.showReportDialog({ eventId });

    // Auto-retry nach Idle-Crash: wenn Tab wieder sichtbar wird, einmal versuchen
    // FIX: Cleanup immer via _visibilityHandler — kein doppelter Listener
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
    }

    if (this.state.retryCount < 2) {
      const handler = () => {
        if (document.visibilityState !== 'visible') return;
        // FIX: cleanup vor setState — kein Listener nach Retry
        document.removeEventListener('visibilitychange', handler);
        this._visibilityHandler = null;
        this.setState(prev => ({
          hasError: false, error: null,
          retryCount: prev.retryCount + 1
        }));
      };
      this._visibilityHandler = handler;
      document.addEventListener('visibilitychange', handler, { passive: true });
    }
  }

  componentWillUnmount() {
    // FIX: Defensive null-check — kein Fehler wenn nie gesetzt
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
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

        {/* ── DEBUG: Echter Fehler — IMMER sichtbar (temporär) ── */}
        <div style={{
          marginTop:24, padding:"14px 16px", borderRadius:12,
          background:"#1A1A1A", color:"#FF6B6B",
          fontFamily:"monospace", fontSize:11, lineHeight:1.7,
          maxWidth:360, width:"100%", overflowX:"auto",
          textAlign:"left", wordBreak:"break-word",
        }}>
          <div style={{ color:"#FF6B6B", fontWeight:800, marginBottom:6 }}>
            ⛔ {this.state.error?.name ?? "Error"}
          </div>
          <div style={{ color:"#FFD700", marginBottom:8 }}>
            {this.state.error?.message ?? "Kein Message"}
          </div>
          <div style={{ color:"#aaa", fontSize:10, whiteSpace:"pre-wrap" }}>
            {this.state.error?.stack?.slice(0, 600) ?? "Kein Stack"}
          </div>
        </div>

        {/* Phase 16.6: Dev world state — only in development */}
        {import.meta.env.DEV && (
          <details style={{ marginTop:20, maxWidth:340, width:"100%", textAlign:"left" }}>
            <summary style={{ fontSize:11, color:"#aaa", cursor:"pointer", paddingLeft:4 }}>
              Dev: Crash-Kontext
            </summary>
            <pre style={{
              fontSize:9.5, color:"#888", background:"rgba(0,0,0,0.04)",
              padding:10, borderRadius:8, overflow:"auto", marginTop:6,
              lineHeight:1.55, maxHeight:200,
            }}>
              {`surface:  ${(this._worldState||{}).activeSurface ?? "null"}\n` +
               `tab:      ${(this._worldState||{}).activeTab     ?? "?"}\n`    +
               `repaint:  ${(this._worldState||{}).repaintPhase  ?? "none"}\n`  +
               `error:    ${this.state.error?.toString()?.slice(0, 120) ?? "?"}`}
            </pre>
          </details>
        )}
      </div>
    );
    return this.props.children;
  }
}

/* ── HUI Ambient Splash — kein Login-Flash, kein Spinner-Stress ──── */
/* Inline SVG-Logo: keine externen Abhängigkeiten, immer verfügbar   */
function HuiSplashLogo({ size = 80 }) {
  return (
    <div style={{ width:size, height:size,
      animation:"hui-logo-breathe 3.5s ease-in-out infinite",
      filter:"drop-shadow(0 0 16px rgba(22,215,197,0.55)) drop-shadow(0 4px 24px rgba(0,0,0,0.40))" }}>
      <style>{`@keyframes hui-logo-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}`}</style>
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <defs>
          <linearGradient id="hsl-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1ED8C8"/>
            <stop offset="45%" stopColor="#22D4C4"/>
            <stop offset="100%" stopColor="#FF7A5C"/>
          </linearGradient>
          <linearGradient id="hsl-sh" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.28"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </linearGradient>
          <radialGradient id="hsl-cr" cx="80%" cy="80%" r="50%">
            <stop offset="0%" stopColor="#FF8A6B" stopOpacity="0.55"/>
            <stop offset="100%" stopColor="#FF8A6B" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="hsl-tl" cx="20%" cy="20%" r="50%">
            <stop offset="0%" stopColor="#22EDD8" stopOpacity="0.40"/>
            <stop offset="100%" stopColor="#22EDD8" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect x="3" y="3" width="114" height="114" rx="30" fill="url(#hsl-bg)"/>
        <rect x="3" y="3" width="114" height="114" rx="30" fill="url(#hsl-cr)"/>
        <rect x="3" y="3" width="114" height="114" rx="30" fill="url(#hsl-tl)"/>
        <rect x="3" y="3" width="114" height="62" rx="30" fill="url(#hsl-sh)"/>
        <circle cx="60" cy="62" r="38" fill="white" fillOpacity="0.92"/>
        <path d="M30 42 C28 50 28 62 28 62 C28 74 30 82 30 82" stroke="url(#hsl-bg)" strokeWidth="9" strokeLinecap="round" fill="none"/>
        <path d="M50 42 C52 50 52 62 52 62 C52 74 50 82 50 82" stroke="url(#hsl-bg)" strokeWidth="9" strokeLinecap="round" fill="none"/>
        <path d="M29 62 L51 62" stroke="url(#hsl-bg)" strokeWidth="8" strokeLinecap="round" fill="none"/>
        <path d="M56 42 L56 68 C56 76 65 83 70 76 C74 69 72 42 72 42" stroke="url(#hsl-bg)" strokeWidth="9" strokeLinecap="round" fill="none"/>
        <circle cx="82" cy="44" r="5.5" fill="url(#hsl-bg)"/>
        <path d="M82 54 L82 82" stroke="url(#hsl-bg)" strokeWidth="9" strokeLinecap="round" fill="none"/>
        <path d="M72 18 C85 14 100 20 108 32 C114 42 112 55 105 62" stroke="#22EDD8" strokeWidth="6" strokeLinecap="round" fill="none" strokeOpacity="0.75"/>
        <path d="M48 104 C38 108 22 104 14 92 C8 82 10 68 17 60" stroke="#FF8A6B" strokeWidth="6" strokeLinecap="round" fill="none" strokeOpacity="0.75"/>
        <rect x="3" y="3" width="114" height="114" rx="30" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}

function HUILoader() {
  const [timedOut, setTimedOut] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 25000);
    return () => clearTimeout(t);
  }, []);

  if (timedOut) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:32,
      background:"linear-gradient(160deg,#0D1412 0%,#12100E 100%)",
      fontFamily:"Inter,-apple-system,sans-serif" }}>
      <HuiSplashLogo size={64}/>
      <div style={{ fontWeight:800, fontSize:18, color:"rgba(255,255,255,0.90)",
        marginTop:20, marginBottom:8 }}>
        Verbindung dauert länger als erwartet
      </div>
      <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", textAlign:"center",
        maxWidth:280, lineHeight:1.65, marginBottom:28 }}>
        Bitte prüfe deine Internetverbindung.
      </div>
      <button onClick={() => window.location.reload()}
        style={{ padding:"13px 28px", borderRadius:14,
          background:"linear-gradient(135deg,#16D7C5,#0FC4B2)",
          color:"white", border:"none", fontWeight:800, fontSize:14,
          cursor:"pointer", boxShadow:"0 4px 18px rgba(22,215,197,0.4)", marginBottom:10 }}>
        Neu laden
      </button>
      <button onClick={() => { window.location.href = "/login"; }}
        style={{ padding:"10px 22px", borderRadius:12, background:"none",
          border:"1.5px solid rgba(255,255,255,0.12)",
          color:"rgba(255,255,255,0.45)", fontWeight:600, fontSize:13, cursor:"pointer" }}>
        Zur Anmeldung
      </button>
    </div>
  );

  return (
    <div style={{
      minHeight:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      background:"linear-gradient(160deg,#0A1210 0%,#0E1612 55%,#0D0B09 100%)",
      fontFamily:"Inter,-apple-system,sans-serif",
    }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
        animation:"hui-splash-fade 0.6s ease both" }}>
        <HuiSplashLogo size={84}/>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.30)", fontWeight:600,
          marginTop:20, letterSpacing:"0.12em", textTransform:"uppercase" }}>
          Human United Intelligent
        </div>
      </div>
      <style>{`
        @keyframes hui-splash-fade {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
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


/* ── SmartNotFound ─────────────────────────────────────────────────
 * Ersetzt den sofortigen <Navigate to="/Home"> Catch-All.
 *
 * REGEL: Während Auth lädt → null (kein Redirect).
 *        Nach Auth: eingeloggt  → /Home (echte 404).
 *                  nicht eingeloggt → /login.
 *
 * Verhindert dass Refresh auf einer gültigen Route zu /Home springt,
 * weil der Router die Route kurz als "unbekannt" einordnet.
 * ──────────────────────────────────────────────────────────────── */
function SmartNotFound() {
  const { isAuthenticated, loadingAuth, authChecked } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Warten bis Auth vollständig geprüft ist
    if (loadingAuth || !authChecked) return;
    if (isAuthenticated) {
      navigate("/Home", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [loadingAuth, authChecked, isAuthenticated, navigate]);

  // Während Auth lädt: Loader zeigen, KEIN Redirect
  return <HUILoader />;
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
      onChat={() => { /* Chat intern als Sheet in WirkerProfilePage */ }}
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
    supabase.from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data?.username) {
          navigate(`/profile/${user.id}`, { replace: true });
          return;
        }
        navigate(`/profile/${data.username}`, { replace: true });
      })
      .catch(() => {
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
// ── BlockedScreen: globaler Overlay wenn Nutzer blockiert wird ───────
function BlockedScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'linear-gradient(135deg, #0d1117 0%, #1a1f2e 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 32, textAlign: 'center',
    }}>
      <div style={{ fontSize: 64, marginBottom: 24 }}>🚫</div>
      <div style={{
        fontSize: 22, fontWeight: 800, color: '#fff',
        marginBottom: 12, letterSpacing: -0.5,
      }}>Konto gesperrt</div>
      <div style={{
        fontSize: 15, color: 'rgba(255,255,255,0.6)',
        maxWidth: 320, lineHeight: 1.6,
      }}>
        Dein Konto wurde blockiert und wird von unserem Team geprüft.
        Bei Fragen wende dich an{' '}
        <a href="mailto:hello@be-hui.com" style={{ color: '#16D7C5', textDecoration: 'none' }}>
          hello@be-hui.com
        </a>
      </div>
    </div>
  );
}

// ── GlobalBlockGuard: prüft isBlocked aus AuthContext ────────────────
function GlobalBlockGuard() {
  const auth = useAuth();
  if (!auth) return null;
  const { isBlocked } = auth;
  if (isBlocked) return <BlockedScreen />;
  return null;
}

function AppRoutes() {
  // ── Route-Validierung beim Render ──────────────────────────────────
  // APP_ROUTES wurde durch createTabPage() normalisiert.
  // Ungültige Einträge (null) wurden durch filterValidPages() entfernt.
  // Diese Log-Zeile bestätigt im DEV-Modus die valide Route-Liste:
  if (import.meta.env.DEV) {
    console.log('[HUI ROUTES]', APP_ROUTES.map(r => r.key + ' → ' + r.route));
  }

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

        {/* /profile/:username → WirkerProfileRouteWrapper */}
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

        {/* Profile Debug — SPRINT D.3, temporär, READ-ONLY */}
        <Route path="/profile-debug" element={<ProfileDebugPage />} />

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

        {/* Ref-Link Weiterleitung */}
        <Route path="/ref/:username" element={
          <Suspense fallback={null}><RefRedirect /></Suspense>
        }/>

        {/* Direkte Ref-Links: /:username → RefRedirect (z.B. be-hui.com/milileo) */}
        <Route path="/:username" element={
          <Suspense fallback={null}><RefRedirect /></Suspense>
        }/>

        {/* 404 / Unbekannte Route: SmartNotFound wartet auf Auth */}
        <Route path="*" element={<SmartNotFound />} />
      </Routes>
    </HuiSuspense>
  );
}

/* ── Root ──────────────────────────────────────────────────────────── */
// ── ProfileCompletionTrigger — Phase 4B FIX ─────────────────────────
// RULES:
//   1. Opens EXACTLY ONCE per session — guarded by hasTriggeredRef
//   2. localStorage "hui_profile_completed" = secondary guard across reloads
//   3. Only deps: user.id — NOT profile object (avoids realtime/presence re-triggers)
//   4. profile_complete check runs once when user.id is first known
//   5. Realtime updates / feed re-renders / notifications CANNOT reset this
function ProfileCompletionTrigger() {
  const { user, profile, loadingAuth, loadingProfile } = useAuth();
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    // Warten bis Auth UND Profile vollständig geladen
    if (loadingAuth || loadingProfile) return;
    // Kein eingeloggter User → nichts tun
    if (!user?.id) return;
    // Profile noch null (lädt noch) → warten
    if (!profile) return;

    // Profil ist geladen — prüfen ob Setup nötig
    // Robuste Prüfung: .trim() damit leere Strings "" nicht als "gesetzt" gelten
    const hasUsername    = typeof profile.username === "string" && profile.username.trim().length > 0;
    const hasDisplayName = typeof profile.display_name === "string" && profile.display_name.trim().length > 0;
    // profile_complete existiert nicht als DB-Spalte → localStorage als einziger Completion-Guard
    let localCompleted = false;
    try { localCompleted = localStorage.getItem("hui_profile_completed") === "true"; } catch {}

    const needsSetup = !hasUsername && !hasDisplayName && !localCompleted;

    if (needsSetup) {
      setShow(true);
    }
  }, [user?.id, profile, loadingAuth, loadingProfile]);

  function handleComplete() {
    setShow(false);
  }

  if (!show) return null;
  return <ProfileCompletionFlow onComplete={handleComplete} />;
}


export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
      <AuthGateProvider>
        <GlobalBlockGuard />
        <ProfileCompletionTrigger/>
        <AppStateProvider>
      <WorldSurfaceProvider>
            <OrbWorldProvider>
      <GuidanceProvider>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
          </GuidanceProvider>
      </OrbWorldProvider>
          </WorldSurfaceProvider>
      </AppStateProvider>
      </AuthGateProvider>
        <ToastContainer/>
      </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}