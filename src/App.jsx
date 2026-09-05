import { HUIImpactIcon } from './design/icons/HuiSystemIcons.jsx';
import OTAUpdateBanner from './components/system/OTAUpdateBanner.jsx';
import OTAUpdatePopup from './components/system/OTAUpdatePopup.jsx';
import { makeChunkReload } from "./lib/chunkReload.js";
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { sentryCapture, Sentry } from './lib/sentry';
import { RouteBoundary, OverlayBoundary } from './lib/ErrorBoundaries';
import { AndroidBackButtonHandler } from './components/AndroidBackButtonHandler.jsx';
import { AppLinkHandler } from './components/AppLinkHandler.jsx';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { AppStateProvider } from './lib/AppStateContext';
import { WorldSurfaceProvider } from './context/WorldSurfaceContext.jsx';
import { OrbWorldProvider } from './context/OrbWorldContext.jsx';
import { GuidanceProvider } from './components/guidance/GuidanceContext.jsx';
import { RadiusProvider } from './context/RadiusContext.jsx';
import { SavedPostsProvider } from './context/SavedPostsContext.jsx';
import { LiveTickerProvider } from './context/LiveTickerContext.jsx';
import { ContentPreviewProvider } from './context/ContentPreviewContext.jsx';
import { ImageGalleryProvider } from './context/ImageGalleryContext.jsx';
import { useContentPreview } from './context/ContentPreviewContext.jsx';
import { WorkService } from './services/db.js';
import { HUI } from './design/hui.design.js';

// ── EAGER: Auth-kritische Seiten ───────
import LoginPage from './pages/LoginPage';
import { AuthGateProvider } from './components/auth/AuthGate.jsx';
import { BiometricGate } from './components/BiometricGate.jsx';
import { ToastContainer } from './lib/useToast.jsx';
import ProfileCompletionFlow from './components/auth/ProfileCompletionFlow.jsx';
import AuthCallback from './pages/AuthCallback';

// WelcomeOverlay wird von AppEntryController eingebunden
import AppEntryController from './components/entry/AppEntryController.jsx';
import { supabase } from './lib/supabaseClient';

// ── SplashScreen (NEU) ───────
import SplashScreen from './pages/SplashScreen.tsx';

// ── LAZY: Alle anderen Routes ───────────────────────────────────
// Erzeugen separate Chunks → schnellerer Initial-Load
// WirkerProfilePage (~140KB) und CreatorStudio laden nur bei Bedarf
import Home              from './pages/Home';

// Chunk-Mismatch Recovery

import ImpactPage from './pages/ImpactPage';
const Admin             = lazy(() => import('./pages/Admin').catch(makeChunkReload("App:Admin")))

// ── HUI Website Admin Pages ──
const WebsiteOverview    = lazy(() => import('./components/admin/website/WebsiteOverview.jsx').catch(makeChunkReload("App:WebsiteOverview")));
const WebsitePages       = lazy(() => import('./components/admin/website/WebsitePages.jsx').catch(makeChunkReload("App:WebsitePages")));
const WebsiteSEO         = lazy(() => import('./components/admin/website/WebsiteSEO.jsx').catch(makeChunkReload("App:WebsiteSEO")));
const WebsiteAnalytics   = lazy(() => import('./components/admin/website/WebsiteAnalytics.jsx').catch(makeChunkReload("App:WebsiteAnalytics")));
const WebsiteConnections = lazy(() => import('./components/admin/website/WebsiteConnections.jsx').catch(makeChunkReload("App:WebsiteConnections")));
const WebsiteTechStatus  = lazy(() => import('./components/admin/website/WebsiteTechStatus.jsx').catch(makeChunkReload("App:WebsiteTechStatus")));
const DiagnosePage      = lazy(() => import('./pages/DiagnosePage').catch(makeChunkReload("App:DiagnosePage")))
const PlatformDashboard = lazy(() => import('./pages/PlatformDashboard').catch(makeChunkReload("App:PlatformDashboard")))
const CreatorStudio     = lazy(() => import('./pages/CreatorStudio').catch(makeChunkReload("App:CreatorStudio")))
// DARK-PROFILE-REMOVE-001: WirkerProfilePage entfernt (2026-07-19)
// Ersetzt durch PublicProfileRouteWrapper → TalentProfilePage/PublicProfilePage
const WorkDetailPage    = lazy(() => import('./components/WorkDetailPage').catch(makeChunkReload("App:WorkDetailPage")))

// ── Route Factory ──────────────────────────────────────────────────────────
import { createTabPage, filterValidPages } from './lib/factories/createTabPage.js'
import { loadPushSettings, initPushNotifications, invalidateTokensOnLogout } from "./lib/pushNotificationService.js";
import { setupPushDeepLinkHandler } from "./lib/pushDeepLinkHandler.js";
import InAppNotificationBanner from "./components/notifications/InAppNotificationBanner.jsx";
import ImageLightbox from "./components/shared/ImageLightbox.jsx";
import VideoFullscreenCloseButton from "./components/shared/VideoFullscreenCloseButton.jsx";
import { useTranslation } from "./hooks/useTranslation.js";
// HUILogoSplash entfernt — IntroVideoScreen ersetzt Splash

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
  // DARK-PROFILE-REMOVE-001: Route via PublicProfileRouteWrapper (helles Profil)
  createTabPage({ key:'admin',     route:'/Admin',          component:Admin,             title:'Admin',       protectedRoute:true,  preload:false }),
  // ── HUI Website Admin ──
  createTabPage({ key:'ws-overview',   route:'/admin/website',             component:WebsiteOverview,    title:'HUI Website', protectedRoute:true,  preload:false }),
  createTabPage({ key:'ws-pages',      route:'/admin/website/seiten',       component:WebsitePages,       title:'Seiten',      protectedRoute:true,  preload:false }),
  createTabPage({ key:'ws-seo',        route:'/admin/website/seo',          component:WebsiteSEO,         title:'SEO & Google',protectedRoute:true,  preload:false }),
  createTabPage({ key:'ws-analytics',  route:'/admin/website/analytics',     component:WebsiteAnalytics,   title:'Analytics',   protectedRoute:true,  preload:false }),
  createTabPage({ key:'ws-links',      route:'/admin/website/verknuepfungen',component:WebsiteConnections,title:'Verknuepfungen',protectedRoute:true,preload:false }),
  createTabPage({ key:'ws-tech',       route:'/admin/website/technik',       component:WebsiteTechStatus,  title:'Technik',     protectedRoute:true,  preload:false }),
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
    // ChunkLoadError nach Deployment → automatisch einmalig neu laden
    const isChunkError = (
      error?.message?.includes("Failed to fetch dynamically imported module") ||
      error?.message?.includes("Importing a module script failed") ||
      error?.message?.includes("error loading dynamically imported module") ||
      error?.name === "ChunkLoadError"
    );
    if (isChunkError) {
      const reloadKey = "hui_chunk_reload_ts";
      const lastReload = parseInt(sessionStorage.getItem(reloadKey) || "0", 10);
      const now = Date.now();
      if (now - lastReload > 30_000) { // max 1x alle 30s
        sessionStorage.setItem(reloadKey, String(now));
        // SICHERHEITSFIX (Red-Team-Audit C.15): Nutzer-Feedback vor Reload
        const _ov = document.createElement('div');
        _ov.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.95);display:flex;align-items:center;justify-content:center;z-index:99999;font-family:Inter,sans-serif;flex-direction:column;gap:12px';
        _ov.innerHTML = '<div style="font-size:16px;font-weight:600;color:#333">App wird aktualisiert…</div><div style="font-size:14px;color:#666">Ein kurzer Moment bitte</div><div style="width:40px;height:40px;border:3px solid #16D7C3;border-top-color:transparent;border-radius:50%;animation:_hui_spin 0.8s linear infinite"></div><style>@keyframes _hui_spin{to{transform:rotate(360deg)}}</style>';
        document.body.appendChild(_ov);
        setTimeout(() => window.location.reload(), 200);
        return { hasError: false, error: null }; // kurz bevor reload kommt
      }
    }
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
        background:"#F9F7F4", fontFamily:"Inter,sans-serif" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⚡️</div>
        <div style={{ fontWeight: 600, fontSize:20, color:"#1A1A1A", marginBottom:8 }}>
          Kurzer Aussetzer
        </div>
        <div style={{ fontSize:13, color:"#888", textAlign:"center",
          maxWidth:260, lineHeight:1.6, marginBottom:24 }}>
          Etwas ist schiefgelaufen. Lade die Seite neu.
        </div>
        <button onClick={() => window.location.reload()}
          style={{ padding:"13px 28px", borderRadius:14, background:"#16D7C5",
            color:"white", border:"none", fontWeight: 600, fontSize:14,
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
          <div style={{ color:"#FF6B6B", fontWeight: 600, marginBottom:6 }}>
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
  // Stiller Ladebildschirm — kein pulsierendes Logo, keine Animation
  // Nur ein ruhiger dunkler Hintergrund während der Auth-Check läuft
  const [timedOut, setTimedOut] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 25000);
    return () => clearTimeout(t);
  }, []);

  if (timedOut) return (
    <div style={{ minHeight:"100dvh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:32,
      background:"linear-gradient(160deg,#0D1412 0%,#12100E 100%)",
      fontFamily:"Inter,sans-serif" }}>
      <div style={{ fontWeight: 600, fontSize:18, color:"rgba(255,255,255,0.90)",
        marginTop:0, marginBottom:8 }}>
        Verbindung dauert länger als erwartet
      </div>
      <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", textAlign:"center",
        maxWidth:280, lineHeight:1.65, marginBottom:28 }}>
        Bitte prüfe deine Internetverbindung.
      </div>
      <button onClick={() => window.location.reload()}
        style={{ padding:"13px 28px", borderRadius:14,
          background:"linear-gradient(135deg,#16D7C5,#0FC4B2)",
          color:"white", border:"none", fontWeight: 600, fontSize:14,
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
      minHeight:"100dvh",
      background:"linear-gradient(160deg,#0A1210 0%,#0E1612 55%,#0D0B09 100%)",
    }} />
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

// ── DEFENSE-IN-DEPTH (2026-08-24, Audit-Empfehlung): Frontend-Admin-Gate ──
// ProtectedRoute prüft nur "eingeloggt" — das /Admin-Route lädt für jeden
// User. Schutz lag komplett auf RLS/Backend. Diese Funktion fügt eine
// zweite Schicht hinzu: profile.role muss admin/superadmin/employee sein.
// Non-Admins werden auf /Home umgeleitet. RLS bleibt die primäre Sicherung.
function AdminProtectedRoute({ children }) {
  const { isAuthenticated, loadingAuth, authChecked, profile } = useAuth();
  if (loadingAuth || !authChecked) return <HUILoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: "/Admin" }} />;

  // Profile noch am Laden? Warten (nicht sofort ablehnen — Race Condition)
  if (!profile) return <HUILoader />;

  const isAdmin = ["admin", "superadmin", "super_admin", "employee"].includes(profile?.role);
  if (!isAdmin) {
    console.warn("[AdminGuard] Non-admin user attempted /Admin access — redirected to /Home");
    return <Navigate to="/Home" replace />;
  }
  return children;
}

// ── DEEPLINK.1 (2026-07-09): Freundlicher Fallback fuer geloeschte/nicht
// mehr verfuegbare Inhalte hinter einem Deep Link -- niemals eine weisse
// Seite oder ein Fehlerbild, siehe Debug-Protokoll/Definition-of-Done. ──
// ── IMPACT-SCROLL-FIX (2026-08-19, Michael-Report): Direktnavigation zu
// /impact (aus ContentPreviewSheet, SystemBotProfile, DiscoverPage,
// MomentContent — z.B. Klick auf ein eingereichtes Projekt oder auf eine
// Resonanzzentrum-Mitteilung "Projekt abgelehnt") landete auf der
// eigenstaendigen /impact-Route in App.jsx. ImpactPage.jsx selbst hat KEINEN
// eigenen Scroll-Container (nur width/background/overflowX) -- sie verlaesst
// sich normalerweise auf den .hui-scroll-Wrapper aus Home.jsx (Tab-Ansicht).
// Bei der Direkt-Route fehlte dieser Wrapper komplett -> Seite liess sich
// nicht scrollen. FIX additiv: eigener Scroll-Container NUR fuer die
// Standalone-Route (analog WorkDetailPage.jsx-Pattern), ImpactPage.jsx bleibt
// unveraendert -- die Tab-eingebettete Nutzung in Home.jsx ist nicht betroffen. ──
function ImpactPageStandalone(props) {
  return (
    <div style={{
      height: "100dvh", overflowY: "auto", overflowX: "hidden",
      WebkitOverflowScrolling: "touch",
      background: "#F9F7F4",
    }}>
      <ImpactPage {...props} />
    </div>
  );
}

function ContentUnavailablePage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:"100dvh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:32,
      background:HUI.COLOR.cream, fontFamily:"inherit", textAlign:"center" }}>
      <div style={{ marginBottom:14, display:"flex", justifyContent:"center", color:"rgba(14,196,184,0.5)" }}><HUIImpactIcon size={42}/></div>
      <div style={{ fontWeight: 600, fontSize:18, color:HUI.COLOR.ink, marginBottom:8 }}>
        Inhalt nicht mehr verfügbar
      </div>
      <div style={{ fontSize:13.5, color:HUI.COLOR.ink+"99", maxWidth:280, lineHeight:1.6, marginBottom:26 }}>
        Dieser Beitrag wurde entfernt oder existiert nicht (mehr).
      </div>
      <button onClick={() => navigate("/Home", { replace:true })}
        style={{ padding:"12px 26px", borderRadius:14, border:"none",
          background:HUI.COLOR.teal, color:"#fff", fontWeight: 600, fontSize:14, cursor:"pointer" }}>
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
      // B9/B10-SSOT-FIX (2026-09-05): silent=true — diese Route hat ihre eigene
      // sichtbare Fehlerbehandlung (ContentUnavailablePage / Home-Redirect),
      // der globale Toast aus openRef darf hier nicht zusaetzlich feuern.
      const found = await openRef({ type, id }, { silent: true });
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

/* ── DARK-PROFILE-REMOVE-001: PublicProfileRouteWrapper (2026-07-19) ── */
// Ersetzt WirkerProfilePage (dunkles Profil) durch TalentProfilePage/PublicProfilePage (helles Profil)
const TalentProfilePageLazy = lazy(() => import('./pages/TalentProfilePage.jsx').catch(makeChunkReload("App:TalentProfilePageLazy")));
const PublicProfilePageLazy  = lazy(() => import('./pages/PublicProfilePage.jsx').catch(makeChunkReload("App:PublicProfilePageLazy")));

function PublicProfileRouteWrapper() {
  const { username } = useParams();
  const navigate     = useNavigate();
  const [profileData, setProfileData] = React.useState(null);
  const [loading,     setLoading]     = React.useState(true);

  React.useEffect(() => {
    if (!username) { setLoading(false); return; }
    const timeout = setTimeout(() => setLoading(false), 8000);
    supabase
      .from('profiles')
      .select('id, has_talent_profile, role')
      .eq('username', username)
      .maybeSingle()
      .then(({ data }) => { clearTimeout(timeout); setProfileData(data); setLoading(false); })
      .catch(() => { clearTimeout(timeout); setLoading(false); });
    return () => clearTimeout(timeout);
  }, [username]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#F7F5F0' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid rgba(14,196,184,0.2)', borderTopColor:'#0EC4B8', animation:'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!profileData) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', background:'#F7F5F0', gap:12 }}>
      <div style={{ fontSize:18, fontWeight: 600, color:'#1A1A18' }}>Profil nicht gefunden</div>
      <button onClick={() => navigate(-1)} style={{ padding:'10px 24px', borderRadius:99, background:'#0EC4B8', color:'#fff', border:'none', fontWeight:600, cursor:'pointer' }}>Zurück</button>
    </div>
  );

  const isTalent = profileData.has_talent_profile || profileData.role === 'talent' || profileData.role === 'wirker';
  const Component = isTalent ? TalentProfilePageLazy : PublicProfilePageLazy;
  return (
    <Suspense fallback={
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#F7F5F0' }}>
        <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid rgba(14,196,184,0.2)', borderTopColor:'#0EC4B8', animation:'spin 0.7s linear infinite' }} />
      </div>
    }>
      <Component profileId={profileData.id} onClose={() => navigate(-1)} publicView={true} />
    </Suspense>
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
      background:'#F9F6F2', fontFamily:"Inter,sans-serif" }}>
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
  const { t } = useTranslation();
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
        fontSize: 22, fontWeight: 600, color: '#fff',
        marginBottom: 12, letterSpacing: -0.5,
      }}>{t("app.accountLocked")}</div>
      <div style={{
        fontSize: 15, color: 'rgba(255,255,255,0.6)',
        maxWidth: 320, lineHeight: 1.6,
      }}>
        {t("app.accountLockedBody")}{' '}
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



// ── ScrollToTop: Jede Route-Änderung scrollt document.documentElement + alle
// hui-scroll Container zurück auf 0. Gilt für alle Route-Wechsel außerhalb
// der Home-Shell (z.B. /work/:id, /profile/:username, /impact nach deep-link).
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // 1. Standard-Browser-Scroll (document.documentElement / document.body)
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    // 2. Alle internen Scroll-Container (hui-scroll, overflowY:auto Divs)
    const containers = document.querySelectorAll('.hui-scroll, [data-scroll-container]');
    containers.forEach(el => { el.scrollTop = 0; });
  }, [pathname]);
  return null; // kein UI
}

function AppRoutes() {
  const navigate = useNavigate();

  // ── Push Deep-Link Handler ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const { entity_type, entity_id, action_url, data } = e.detail || {};

      // 1. action_url hat Priorität
      if (action_url && typeof action_url === "string" && action_url.startsWith("/")) {
        navigate(action_url);
        return;
      }

      // 2. entity_type → Route
      switch (entity_type) {
        case "chat":
          if (entity_id) navigate("/Home", { state: { openChatId: entity_id } });
          else navigate("/Home");
          break;
        case "profile":
        case "connection":
          if (data?.sender_id) window.__HUI_OPEN_PROFILE__?.(data.sender_id);
          else if (entity_id) window.__HUI_OPEN_PROFILE__?.(entity_id);
          else navigate("/Home");
          break;
        case "booking":
          navigate("/Home", { state: { openBookings: true } });
          break;
        case "work":
        case "experience":
        case "talent":
        case "project":
        case "moment":
          if (entity_id) navigate("/Home", { state: { highlightId: entity_id, highlightType: entity_type } });
          else navigate("/Home");
          break;
        case "order":
        case "purchase":
          navigate("/Home", { state: { openFinances: true } });
          break;
        case "impact":
          navigate("/Home", { state: { openImpact: true } });
          break;
        default:
          navigate("/Home");
      }
    };
    window.addEventListener("hui:push:navigate", handler);
    return () => window.removeEventListener("hui:push:navigate", handler);
  }, [navigate]);

  // ── Route-Validierung beim Render ──────────────────────────────────
  // APP_ROUTES wurde durch createTabPage() normalisiert.
  // Ungültige Einträge (null) wurden durch filterValidPages() entfernt.
  // Diese Log-Zeile bestätigt im DEV-Modus die valide Route-Liste:
  if (import.meta.env.DEV) {
  }

  return (
    <>
    <InAppNotificationBanner />
    <AndroidBackButtonHandler>
<AppLinkHandler>
    {/* HuiSuspense wraps all lazy routes — zeigt ruhigen Ladeindikator */}
    <HuiSuspense>
      <ScrollToTop />
      <Routes>
        {/* Splash Screen */}
        <Route path="/" element={<SplashScreen />} />

        {/* Auth — EAGER (kein lazy) */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Main App — LAZY */}
        <Route path="/Home" element={
          <ProtectedRoute><RouteBoundary name="Home"><Home /></RouteBoundary></ProtectedRoute>
        }/>

        {/* Work Detail — LAZY */}
        {/* COMMERCE-01 */}
        <Route path="/work/:id" element={
          <ProtectedRoute><RouteBoundary name="WorkDetail"><WorkDetailRouteWrapper /></RouteBoundary></ProtectedRoute>
        }/>

        {/* /profile/:username → PublicProfileRouteWrapper (helles Profil, DARK-PROFILE-REMOVE-001) */}
        {/* PUBLIC-PROFILE-FIX (2026-08-26): Kein ProtectedRoute — öffentliche */}
        {/* Profile müssen ohne Login zugänglich sein (Beleg-Links, Social Media). */}
        <Route path="/profile/:username" element={
          <RouteBoundary name="PublicProfile"><PublicProfileRouteWrapper /></RouteBoundary>
        }/>

        {/* /profile/me shortcut */}
        <Route path="/profile/me" element={
          <ProtectedRoute><RouteBoundary name="OwnProfile"><OwnProfileRedirect /></RouteBoundary></ProtectedRoute>
        }/>

        {/* DEEPLINK.1 (2026-07-09) — /wirker/:username ist ein reiner
            Alias auf die bestehende, kanonische /profile/:username-Route
            (kein Duplikat der Wirker-Profil-Logik). */}
        <Route path="/wirker/:username" element={<WirkerAliasRedirect />} />

        {/* DEEPLINK.1 — Werke ueber sprechenden Slug statt roher ID */}
        <Route path="/werke/:slug" element={
          <ProtectedRoute><RouteBoundary name="WorkBySlug"><WorkBySlugOpener /></RouteBoundary></ProtectedRoute>
        }/>

        {/* DEEPLINK.1 — Beitrag/Projekt/Erlebnis/Veranstaltung: oeffnen
            ueber die bestehende, geteilte Preview/Fullscreen-Infra statt
            eigener neuer Detailseiten (siehe DeepLinkOpener oben). */}
        <Route path="/beitrag/:id" element={
          <ProtectedRoute><RouteBoundary name="DeepLink-moment"><DeepLinkOpener type="moment" /></RouteBoundary></ProtectedRoute>
        }/>
        <Route path="/projekt/:id" element={
          <ProtectedRoute><RouteBoundary name="DeepLink-project"><DeepLinkOpener type="project" /></RouteBoundary></ProtectedRoute>
        }/>
        <Route path="/erlebnis/:id" element={
          <ProtectedRoute><RouteBoundary name="DeepLink-experience"><DeepLinkOpener type="experience" /></RouteBoundary></ProtectedRoute>
        }/>
        <Route path="/veranstaltung/:id" element={
          <ProtectedRoute><RouteBoundary name="DeepLink-event"><DeepLinkOpener type="event" /></RouteBoundary></ProtectedRoute>
        }/>
        {/* DEEPLINK.1-FIX (2026-08-31): /talent/:id fehlte komplett -- HuiShareModal
            generiert Talent-Share-Links (buildPublicUrl case "talent"), aber es gab
            nirgends eine Route dafuer. Der "talent"-Loader in contentPreviewLoaders.js
            existierte bereits -- nur die Route fehlte. */}
        <Route path="/talent/:id" element={
          <ProtectedRoute><RouteBoundary name="DeepLink-talent"><DeepLinkOpener type="talent" /></RouteBoundary></ProtectedRoute>
        }/>

        {/* Impact — EAGER */}
        <Route path="/impact" element={
          <ProtectedRoute><RouteBoundary name="Impact"><ImpactPageStandalone /></RouteBoundary></ProtectedRoute>
        }/>

        {/* Legacy redirect */}
        <Route path="/BookingFlow" element={<Navigate to="/Home" replace />}/>

        {/* Admin — LAZY */}
        <Route path="/Admin" element={
          <AdminProtectedRoute><RouteBoundary name="Admin"><Admin /></RouteBoundary></AdminProtectedRoute>
        }/>

        {/* ── HUI Website Admin — LAZY ── */}
        <Route path="/admin/website" element={
          <AdminProtectedRoute><RouteBoundary name="WebsiteOverview"><WebsiteOverview /></RouteBoundary></AdminProtectedRoute>
        }/>
        <Route path="/admin/website/seiten" element={
          <AdminProtectedRoute><RouteBoundary name="WebsitePages"><WebsitePages /></RouteBoundary></AdminProtectedRoute>
        }/>
        <Route path="/admin/website/seo" element={
          <AdminProtectedRoute><RouteBoundary name="WebsiteSEO"><WebsiteSEO /></RouteBoundary></AdminProtectedRoute>
        }/>
        <Route path="/admin/website/analytics" element={
          <AdminProtectedRoute><RouteBoundary name="WebsiteAnalytics"><WebsiteAnalytics /></RouteBoundary></AdminProtectedRoute>
        }/>
        <Route path="/admin/website/verknuepfungen" element={
          <AdminProtectedRoute><RouteBoundary name="WebsiteConnections"><WebsiteConnections /></RouteBoundary></AdminProtectedRoute>
        }/>
        <Route path="/admin/website/technik" element={
          <AdminProtectedRoute><RouteBoundary name="WebsiteTechStatus"><WebsiteTechStatus /></RouteBoundary></AdminProtectedRoute>
        }/>

        {/* Diagnose — LAZY (nur Dev) */}
        <Route path="/diagnose" element={<ProtectedRoute><RouteBoundary name="Diagnose"><DiagnosePage /></RouteBoundary></ProtectedRoute>} />

        {/* Platform Dashboard — intern, Admin-only */}
        <Route path="/dashboard" element={
          <ProtectedRoute><RouteBoundary name="Dashboard"><PlatformDashboard /></RouteBoundary></ProtectedRoute>
        }/>

        {/* Creator Studio — LAZY */}
        <Route path="/studio" element={
          <ProtectedRoute><RouteBoundary name="Studio"><CreatorStudio /></RouteBoundary></ProtectedRoute>
        }/>
        <Route path="/studio/:section" element={
          <ProtectedRoute><RouteBoundary name="Studio"><CreatorStudio /></RouteBoundary></ProtectedRoute>
        }/>


        {/* 404 / Unbekannte Route: SmartNotFound wartet auf Auth */}
        <Route path="*" element={<SmartNotFound />} />
      </Routes>
    </HuiSuspense>
    </AppLinkHandler>
    </AndroidBackButtonHandler>
    </>
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


// ── Push-Init Component (fixes race condition: push init ran BEFORE auth
//    session was restored, so rpc_get_push_settings() returned null because
//    auth.uid() was null → _pushEnabled stayed false → registerDevice() never
//    called → no FCM token registered → all notifications skipped with
//    "No active device tokens". Fix: run push init inside AuthProvider tree
//    and wait for authChecked + user.id before initializing.)
function PushInit() {
  const { user, authChecked, loadingAuth } = useAuth();
  useEffect(() => {
    if (loadingAuth || !authChecked || !user?.id) return;
    (async () => {
      await loadPushSettings();
      await initPushNotifications();
    })();
  }, [loadingAuth, authChecked, user?.id]);
  return null;
}

// ── IMG-DIAG-001 (2026-09-04): Einmaliger Geräte-Image-/Upload-Probe ──
// Misst beim ersten Auth-Start einer App-Version (nur nativ, nur einmal,
// Guard in localStorage) ob remote Bilder im <img> laden, fetch() die
// Transform-URL erreicht und ein Storage-Upload ankommt. Ergebnis →
// system_error_reports (error_type='img_diag'). Details: src/lib/imgDiag.js.
// Dynamischer Import → landet im eigenen Lazy-Chunk, bläht main nicht auf.
function ImgDiagProbe() {
  const { user, authChecked, loadingAuth } = useAuth();
  useEffect(() => {
    if (loadingAuth || !authChecked || !user?.id) return;
    import('./lib/imgDiag.js')
      .then(({ runImgDiagOnce }) => runImgDiagOnce(user.id))
      .catch(() => {});
  }, [loadingAuth, authChecked, user?.id]);
  return null;
}

export default function App() {
  const { t } = useTranslation();
  // ── OTA v5: confirmAppReady nach erstem erfolgreichen React-Render ──
  // Ruft notifyAppReady() beim native Plugin — "App lebt, kein Rollback".
  // Wenn React crasht → dieser useEffect läuft nie → Plugin rollt nach 3
  // Crashes automatisch zur letzten funktionierenden Version zurück.
  React.useEffect(() => {
    if (typeof window.__HUI_CONFIRM_APP_READY__ === 'function') {
      window.__HUI_CONFIRM_APP_READY__();
    }
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AuthGateProvider>
            <BiometricGate>
            <GlobalBlockGuard />
            <ProfileCompletionTrigger/>
            <AppEntryController>
              <PushInit />
              <ImgDiagProbe />
              <AppStateProvider>
                <WorldSurfaceProvider>
                  <OrbWorldProvider>
                    <RadiusProvider>
                      <SavedPostsProvider>
                        <LiveTickerProvider>
                          <ContentPreviewProvider>
                            <ImageGalleryProvider>
                              <GuidanceProvider>
                                <ErrorBoundary>
                                  <AppRoutes />
                                </ErrorBoundary>
                              </GuidanceProvider>
                            </ImageGalleryProvider>
                          </ContentPreviewProvider>
                          <ImageLightbox />
                          <VideoFullscreenCloseButton />
                        </LiveTickerProvider>
                      </SavedPostsProvider>
                    </RadiusProvider>
                  </OrbWorldProvider>
                </WorldSurfaceProvider>
              </AppStateProvider>
            </AppEntryController>

            <ToastContainer/>
            <OTAUpdateBanner />
            <OTAUpdatePopup />

            </BiometricGate>
          </AuthGateProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}