// ══════════════════════════════════════════════════════════════════════════════
// WebApp.jsx — HUI Web Root Component
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Root-Komponente fuer die HUI Web-Version (Browser/Desktop).
//   Setzt den Provider-Tree auf und konfiguriert das Routing.
//   Ersetzt App.jsx fuer den Web-Einstiegspunkt (web.html -> web-main.jsx).
//
// PROVIDER-TREE:
//   Identisch zur Mobile-App (App.jsx) — alle Context-Provider werden
//   in derselben Reihenfolge gesetzt. Dadurch haben alle wiederverwendeten
//   Komponenten denselben Kontext und funktionieren ohne Anpassungen.
//
// ROUTING:
//   Auth-Routen (Login, Callback) werden ohne Shell gerendert.
//   Alle anderen Routen werden innerhalb von DesktopShell gerendert.
//   DesktopShell nutzt <Outlet /> fuer die Kind-Routen.
//
// PERFORMANCE (v2.1):
//   UnifiedFeed und ImpactPage sind lazy-loaded.
//   Sie werden erst geladen, wenn der Nutzer die entsprechende Route
//   tatsaechlich besucht. Das reduziert den initialen Download um ~50-80 KB
//   gzipped (feed-*.js chunk wird nur bei Bedarf geladen).
//   LoginPage und AuthCallback bleiben eager (werden vor der Auth-
//   Entscheidung benoetigt).
//
// WIEDERVERWENDUNG:
//   Alle Provider, alle Pages, alle Services, alle Hooks, alle Contexts
//   werden 1:1 aus der Mobile-App importiert. Keine Duplikate.
//
// UNTERSCHIED ZU App.jsx:
//   - Keine AppEntryController / IntroVideoScreen (Desktop: direkter Start)
//   - Keine ErrorBoundary mit Chunk-Reload (Desktop: Standard-Fehlerbehandlung)
//   - DesktopShell statt HomeShell (Sidebar statt Bottom-Nav)
//   - React Router <Outlet /> statt internem Tab-State
//   - UnifiedFeed + ImpactPage lazy (App.jsx laedt diese eager fuer Safari)
//
// ZUKUNFT:
//   - Mehrsprachigkeit (i18n Provider kann hier eingefuegt werden)
//   - Organization Context (fuer Multi-Tenant-Features)
//   - Theme Provider (Dark Mode fuer Desktop)
// ══════════════════════════════════════════════════════════════════════════════

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ── Shared Providers (identisch zu App.jsx) ─────────────────────────────────
import { AuthProvider } from './lib/AuthContext.jsx';
import { AppStateProvider } from './lib/AppStateContext.jsx';
import { WorldSurfaceProvider } from './context/WorldSurfaceContext.jsx';
import { OrbWorldProvider } from './context/OrbWorldContext.jsx';
import { GuidanceProvider } from './components/guidance/GuidanceContext.jsx';
import { RadiusProvider } from './context/RadiusContext.jsx';
import { SavedPostsProvider } from './context/SavedPostsContext.jsx';
import { LiveTickerProvider } from './context/LiveTickerContext.jsx';
import { ContentPreviewProvider } from './context/ContentPreviewContext.jsx';
import { ToastContainer } from './lib/useToast.jsx';

// ── Eager: Auth-kritische Seiten (vor Auth-Entscheidung benoetigt) ────────────
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';

// ── Lazy: Alle App-Seiten (separate Chunks, nur bei Bedarf geladen) ──────────
//   UnifiedFeed (31 Dateien, ~500KB Source) ist der schwerste Chunk.
//   ImpactPage ist mittel. Beide werden lazy geladen, damit der initiale
//   Download beim Login-Screen kleiner ist.
const UnifiedFeed      = lazy(() => import('./feed/UnifiedFeed.jsx'));
const ImpactPage       = lazy(() => import('./pages/ImpactPage.jsx'));
const DiscoverPage     = lazy(() => import('./pages/DiscoverPage'));
const WorkDetailPage   = lazy(() => import('./components/WorkDetailPage'));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const MyBasisProfile    = lazy(() => import('./pages/MyBasisProfile'));
const CreatorStudio    = lazy(() => import('./pages/CreatorStudio'));

// ── Desktop Shell ───────────────────────────────────────────────────────────
import DesktopShell from './components/desktop/DesktopShell.jsx';

// ── Suspense Fallback ────────────────────────────────────────────────────────
function WebSuspense({ children }) {
  return (
    <Suspense
      fallback={
        <div className="web-loading">
          <div className="web-loading-spinner" />
          <p style={{ fontSize: 13, color: '#8A8A9E' }}>Wird geladen…</p>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

// ── WebApp Root ──────────────────────────────────────────────────────────────
export default function WebApp() {
  return (
    <BrowserRouter basename="/app">
      <AuthProvider>
        <AppStateProvider>
          <WorldSurfaceProvider>
            <OrbWorldProvider>
              <GuidanceProvider>
                <RadiusProvider>
                  <SavedPostsProvider>
                    <LiveTickerProvider>
                      <ContentPreviewProvider>
                        <WebSuspense>
                          <Routes>
                            {/* ── Auth-Routen (ohne Shell) ─────────────────── */}
                            <Route path="/login" element={<LoginPage />} />
                            <Route
                              path="/auth/callback"
                              element={<AuthCallback />}
                            />

                            {/* ── App-Routen (mit DesktopShell) ────────────── */}
                            <Route element={<DesktopShell />}>
                              <Route path="/Home" element={<UnifiedFeed />} />
                              <Route path="/discover" element={<DiscoverPage />} />
                              <Route path="/impact" element={<ImpactPage />} />
                              <Route path="/work/:id" element={<WorkDetailPage />} />
                              <Route path="/profile/me" element={<MyBasisProfile />} />
                              <Route path="/profile/:username" element={<PublicProfilePage />} />
                              <Route path="/studio" element={<CreatorStudio />} />

                              {/* ── Redirects ────────────────────────────── */}
                              <Route path="/" element={<Navigate to="/Home" replace />} />
                              <Route path="*" element={<Navigate to="/Home" replace />} />
                            </Route>
                          </Routes>
                        </WebSuspense>
                        <ToastContainer />
                      </ContentPreviewProvider>
                    </LiveTickerProvider>
                  </SavedPostsProvider>
                </RadiusProvider>
              </GuidanceProvider>
            </OrbWorldProvider>
          </WorldSurfaceProvider>
        </AppStateProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
