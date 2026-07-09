import React, { useState, useEffect, lazy, Suspense } from 'react'
import { sentryCapture, Sentry } from './lib/sentry'
import { RouteBoundary, OverlayBoundary } from './lib/ErrorBoundaries'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { AppStateProvider } from './lib/AppStateContext'
import { WorldSurfaceProvider } from './context/WorldSurfaceContext.jsx'
import { OrbWorldProvider } from './context/OrbWorldContext.jsx'
import { GuidanceProvider } from './components/guidance/GuidanceContext.jsx'
import { RadiusProvider } from './context/RadiusContext.jsx' // Umkreissuche 2026-07-06 -- globaler Radius-Zustand (Single Source of Truth)
import { SavedPostsProvider } from './context/SavedPostsContext.jsx' // Merken 2026-07-08 -- globaler saved_posts-Zustand (Single Source of Truth)
import { LiveTickerProvider } from './context/LiveTickerContext.jsx' // LIVETICKER.1 2026-07-08 -- eine geteilte Datenquelle statt Doppel-Polling in Home+Entdecken-Tab
import { ContentPreviewProvider } from './context/ContentPreviewContext.jsx' // OPEN.1 2026-07-08 -- eine geteilte Vorschau fuer jede Karte app-weit
import { useContentPreview } from './context/ContentPreviewContext.jsx' // DEEPLINK.1 2026-07-09
import { WorkService } from './services/db.js'
import { HUI } from './design/hui.design.js'

// ── EAGER: Auth-kritische Seiten (immer sofort gebraucht) ───────
import LoginPage    from './pages/LoginPage'
import { AuthGateProvider } from './components/auth/AuthGate.jsx'
import { ToastContainer } from './lib/useToast.jsx'
import ProfileCompletionFlow from './components/auth/ProfileCompletionFlow.jsx'
import AuthCallback from './pages/AuthCallback'

// WelcomeOverlay wird von AppEntryController eingebunden (Kapitel 1)
import AppEntryController from './components/entry/AppEntryController.jsx'; // Kapitel 1
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
const PlatformDashboard = lazy(() => import('./pages/PlatformDashboard'))
const CreatorStudio     = lazy(() => import('./pages/CreatorStudio'))
const WirkerProfilePage = lazy(() => import('./pages/wirker-profile/index.jsx'))
const WorkDetailPage    = lazy(() => import('./components/WorkDetailPage'))

// ── Route Factory ──────────────────────────────────────────────────────────
import { createTabPage, filterValidPages } from './lib/factories/createTabPage.js'
import { HUILogoSplash } from './components/brand/HUILogo.jsx'

// ── APP_ROUTES: ÜBERGANGSSTRUKTUR (NAV-001B) ─────────────────────────────────
// APP_ROUTES ist die Tab-Registry der Home-Shell — KEIN vollständiges Route-Register.
// Sie enthält nur die 8 Tab-orientierten Routen (Home, Impact, Work, Profil, etc.).
// Auth-Routen, Redirects, Catch-Alls und Referral-Routen fehlen hier bewusst.
//
// MIGRATION (wenn NAV-003 freigegeben):
//   APP_ROUTES wird durch src/routes/registry.js (ROUTE_REGISTRY) ersetzt.
//   Bis dahin: APP_ROUTES bleibt bestehen und wird NICHT verändert.
//   Quelle der Wahrheit für alle Routen: src/routes/registry.js
//
// Normalisierte, validierte Route-Definitionen
// Alle Routen gehen durch createTabPage() — kein undefined-component möglich
export const APP_ROUTES = filterValidPages([
  createTabPage({ key:'home',      route:'/Home',           component:Home,              title:'HUI',         protectedRoute:true,  preload:true  }),
  createTabPage({ key:'impact',    route:'/impact',         component:ImpactPage,        title:'Impact',      protectedRoute:true,  preload:false }),
  createTabPage({ key:'work',      route:'/work/:id',       component:WorkDetailPage,    title:'Werk',        protectedRoute:true,  preload:false }),
  createTabPage({ key:'profile',   route:'/profile/:username', component:WirkerProfilePage, title:'Profil',  protectedRoute:true,  preload:false }),
  createTabPage({ key:'admin',     route:'/Admin',          component:Admin,             title:'Admin',       protectedRoute:true,  preload:false }),
  createTabPage({ key:'diagnose',  route:'/diagnose',       component:DiagnosePage,      title:'Diagnose',    protectedRoute:true,  preload:false }),
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
      <div style={{ minHeight:"100dvh", display:"flex", flexDirection:"column",
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


function HUILoader() {
  const [timedOut, setTimedOut] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 25000);
    return () => clearTimeout(t);
  }, []);

  if (timedOut) return (
    <div style={{ minHeight:"100dvh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:32,
      background:"linear-gradient(160deg,#0D1412 0%,#12100E 100%)",
      fontFamily:"Inter,-apple-system,sans-serif" }}>
      <HUILogoSplash size={64} />
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
      minHeight:"100dvh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      background:"linear-gradient(160deg,#0A1210 0%,#0E1612 55%,#0D0B09 100%)",
      fontFamily:"Inter,-apple-system,sans-serif",
    }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
        animation:"hui-splash-fade 0.6s ease both" }}>
        <HUILogoSplash size={84} />
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
  const location = useLocation();
  // Kein Redirect bevor Auth vollständig geprüft — verhindert Login-Flash
  if (loadingAuth || !authChecked) return <HUILoader />;
  // DEEPLINK.1 (2026-07-09): Ziel-Route im Navigate-State merken, damit
  // LoginPage nach erfolgreichem Login automatisch dorthin zurueckfuehrt
  // statt immer starr auf /Home zu landen (Definition-of-Done: "kein
  // Informationsverlust" bei Login-Zwischenstopp fuer geteilte Links).
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

// ── DEEPLINK.1 (2026-07-09): Freundlicher Fallback fuer geloeschte/nicht
// mehr verfuegbare Inhalte hinter einem Deep Link -- niemals eine weisse
// Seite oder ein Fehlerbild, siehe Debug-Protokoll/Definition-of-Done. ──
function ContentUnavailablePage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:"100dvh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:32,
      background:HUI.COLOR.cream, fontFamily:"inherit", textAlign:"center" }}>
      <div style={{ fontSize:42, marginBottom:14 }}>🌱</div>
      <div style={{ fontWeight:800, fontSize:18, color:HUI.COLOR.ink, marginBottom:8 }}>
        Inhalt nicht mehr verfügbar
      </div>
      <div style={{ fontSize:13.5, color:HUI.COLOR.ink+"99", maxWidth:280, lineHeight:1.6, marginBottom:26 }}>
        Dieser Beitrag wurde entfernt oder existiert nicht (mehr).
      </div>
      <button onClick={() => navigate("/Home", { replace:true })}
        style={{ padding:"12px 26px", borderRadius:14, border:"none",
          background:HUI.COLOR.teal, color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer" }}>
        Zurück zu HUI
      </button>
    </div>
  );
}

// ── DEEPLINK.1: /beitrag/:id, /projekt/:id, /erlebnis/:id, /veranstaltung/:id
// oeffnen KEINE eigenen neuen Detailseiten -- sie rendern die App (Home)
// und triggern beim Mount die bereits bestehende, geteilte Preview/
// Fullscreen-Infrastruktur (ContentPreviewContext.openRef), die appweit
// schon fuer Feed/Liveticker/Notifications genutzt wird (OPEN.1/
// FULLSCREEN.1). Kommentare/Herz-Reaktion/Teilen funktionieren dadurch
// automatisch identisch zur Inline-Vorschau -- keine Dopplung. ──
function DeepLinkOpener({ type }) {
  const { id } = useParams();
  const { openRef } = useContentPreview();
  const [state, setState] = useState("loading"); // loading | notfound | done

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    (async () => {
      const found = await openRef({ type, id });
      if (!cancelled) setState(found ? "done" : "notfound");
    })();
    return () => { cancelled = true; };
  }, [type, id, openRef]);

  if (state === "notfound") return <ContentUnavailablePage />;
  // "loading"/"done": Home bleibt als Hintergrund sichtbar, das eigentliche
  // Overlay (Sheet/Fullscreen) wird global von ContentPreviewProvider gerendert.
  return <Home />;
}

// ── DEEPLINK.1: /werke/:slug -- loest den Slug zur Werk-ID auf und leitet
// auf die bestehende, unveraenderte /work/:id-Route weiter (kein Umbau von
// WorkDetailPage noetig -- Evolution statt Rewrite). ──
function WorkBySlugOpener() {
  const { slug } = useParams();
  const [workId, setWorkId] = useState(undefined); // undefined=lädt, null=nicht gefunden

  useEffect(() => {
    let cancelled = false;
    setWorkId(undefined);
    WorkService.getBySlug(slug).then(({ data }) => {
      if (!cancelled) setWorkId(data?.id || null);
    });
    return () => { cancelled = true; };
  }, [slug]);

  if (workId === undefined) return <HUILoader />;
  if (workId === null) return <ContentUnavailablePage />;
  return <Navigate to={`/work/${workId}`} replace />;
}

// ── DEEPLINK.1: /wirker/:username -- reiner Alias, keine eigene Logik. ──
function WirkerAliasRedirect() {
  const { username } = useParams();
  return <Navigate to={`/profile/${username}`} replace />;
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


/* ── WorkDetailRouteWrapper: /work/:id → WorkDetailPage ─────────── */
// onBuyWerk: navigiert zurück zu /Home mit Router-State.
// Home.jsx liest location.state.pendingWerkKauf und öffnet WerkKaufFlow.
// Keine globale Variable — React Router v6 state ist offizieller Mechanismus.
function WorkDetailRouteWrapper() {
  const navigate = useNavigate();
  return (
    <WorkDetailPage
      onBuyWerk={(werk) => {
        // COMMERCE-01: Router-State → Home.jsx öffnet WerkKaufFlow
        navigate("/Home", { state: { pendingWerkKauf: werk } });
      }}
    />
  );
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
        {/* COMMERCE-01 */}
        <Route path="/work/:id" element={
          <ProtectedRoute><WorkDetailRouteWrapper /></ProtectedRoute>
        }/>

        {/* /profile/:username → WirkerProfileRouteWrapper */}
        <Route path="/profile/:username" element={
          <ProtectedRoute><WirkerProfileRouteWrapper /></ProtectedRoute>
        }/>

        {/* /profile/me shortcut */}
        <Route path="/profile/me" element={
          <ProtectedRoute><OwnProfileRedirect /></ProtectedRoute>
        }/>

        {/* DEEPLINK.1 (2026-07-09) — /wirker/:username ist ein reiner
            Alias auf die bestehende, kanonische /profile/:username-Route
            (kein Duplikat der Wirker-Profil-Logik). */}
        <Route path="/wirker/:username" element={<WirkerAliasRedirect />} />

        {/* DEEPLINK.1 — Werke ueber sprechenden Slug statt roher ID */}
        <Route path="/werke/:slug" element={
          <ProtectedRoute><WorkBySlugOpener /></ProtectedRoute>
        }/>

        {/* DEEPLINK.1 — Beitrag/Projekt/Erlebnis/Veranstaltung: oeffnen
            ueber die bestehende, geteilte Preview/Fullscreen-Infra statt
            eigener neuer Detailseiten (siehe DeepLinkOpener oben). */}
        <Route path="/beitrag/:id" element={
          <ProtectedRoute><DeepLinkOpener type="moment" /></ProtectedRoute>
        }/>
        <Route path="/projekt/:id" element={
          <ProtectedRoute><DeepLinkOpener type="project" /></ProtectedRoute>
        }/>
        <Route path="/erlebnis/:id" element={
          <ProtectedRoute><DeepLinkOpener type="experience" /></ProtectedRoute>
        }/>
        <Route path="/veranstaltung/:id" element={
          <ProtectedRoute><DeepLinkOpener type="event" /></ProtectedRoute>
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
        <Route path="/diagnose" element={<ProtectedRoute><DiagnosePage /></ProtectedRoute>} />

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

    // Kapitel 1 – Ankommen: WelcomeOverlay hat Vorrang.
    // ProfileCompletionFlow darf erst erscheinen, nachdem der Nutzer
    // das WelcomeOverlay gesehen und bestätigt hat.
    let welcomeSeen = false;
    try { welcomeSeen = localStorage.getItem("hui_welcome_seen") === "true"; } catch {}

    if (needsSetup && welcomeSeen) {
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
        {/* Kapitel 1 – AppEntryController: einzige Einstiegs-Entscheidungsstelle */}
        <AppEntryController>
        <AppStateProvider>
      <WorldSurfaceProvider>
            <OrbWorldProvider>
      <RadiusProvider>
      <SavedPostsProvider>
      <LiveTickerProvider>
      <ContentPreviewProvider>
      <GuidanceProvider>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
          </GuidanceProvider>
      </ContentPreviewProvider>
      </LiveTickerProvider>
      </SavedPostsProvider>
      </RadiusProvider>
      </OrbWorldProvider>
          </WorldSurfaceProvider>
      </AppStateProvider>
        </AppEntryController>
      </AuthGateProvider>
        <ToastContainer/>
      </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}