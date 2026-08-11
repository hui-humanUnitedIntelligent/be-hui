// ══════════════════════════════════════════════════════════════════════════════
// AuthenticatedApp.jsx — HUI Web Authenticated Provider Tree + Routes
// ══════════════════════════════════════════════════════════════════════════════
//
// Diese Datei wird NUR geladen, wenn der Nutzer authentifiziert ist.
// Sie enthält alle App-spezifischen Provider und Routen.
// Auf /login wird dieser Code gar nicht heruntergeladen.
//
// Provider-Tree:
//   AppStateProvider → WorldSurfaceProvider → OrbWorldProvider →
//   GuidanceProvider → RadiusProvider → SavedPostsProvider →
//   LiveTickerProvider → ContentPreviewProvider → DesktopShell
// ══════════════════════════════════════════════════════════════════════════════

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// ── App-spezifische Provider ─────────────────────────────────────────────────
import { AppStateProvider } from './lib/AppStateContext.jsx';
import { WorldSurfaceProvider } from './context/WorldSurfaceContext.jsx';
import { OrbWorldProvider } from './context/OrbWorldContext.jsx';
import { GuidanceProvider } from './components/guidance/GuidanceContext.jsx';
import { RadiusProvider } from './context/RadiusContext.jsx';
import { SavedPostsProvider } from './context/SavedPostsContext.jsx';
import { LiveTickerProvider } from './context/LiveTickerContext.jsx';
import { ContentPreviewProvider } from './context/ContentPreviewContext.jsx';

// ── Desktop Shell ───────────────────────────────────────────────────────────
import DesktopShell from './components/desktop/DesktopShell.jsx';
import DesktopHome from './components/desktop/DesktopHome.jsx';
import DesktopProfile from './components/desktop/DesktopProfile.jsx';
import DesktopDiscover from './components/desktop/DesktopDiscover.jsx';
import DesktopStudio from './components/desktop/DesktopStudio.jsx';

// ── Lazy: Schwere App-Seiten ──────────────────────────────────────────────────
const UnifiedFeed      = lazy(() => import('./feed/UnifiedFeed.jsx'));
const ImpactPage       = lazy(() => import('./pages/ImpactPage.jsx'));
const DiscoverPage     = lazy(() => import('./pages/DiscoverPage'));
const WorkDetailPage   = lazy(() => import('./components/WorkDetailPage'));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const MyBasisProfile    = lazy(() => import('./pages/MyBasisProfile'));
const CreatorStudio    = lazy(() => import('./pages/CreatorStudio'));

// ── Suspense Fallback ────────────────────────────────────────────────────────
function AuthSuspense({ children }) {
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

// ── AuthenticatedApp ─────────────────────────────────────────────────────────
export default function AuthenticatedApp() {
  return (
    <AppStateProvider>
      <WorldSurfaceProvider>
        <OrbWorldProvider>
          <GuidanceProvider>
            <RadiusProvider>
              <SavedPostsProvider>
                <LiveTickerProvider>
                  <ContentPreviewProvider>
                    <AuthSuspense>
                      <Routes>
                        {/* ── App-Routen (mit DesktopShell) ────────────── */}
                        <Route element={<DesktopShell />}>
                          <Route path="/Home" element={<DesktopHome />} />
                          <Route path="/discover" element={<DesktopDiscover />} />
                          <Route path="/impact" element={<ImpactPage />} />
                          <Route path="/work/:id" element={<WorkDetailPage />} />
                          <Route path="/profile/me" element={<DesktopProfile />} />
                          <Route path="/profile/:username" element={<DesktopProfile />} />
                          <Route path="/studio" element={<DesktopStudio />} />
                          <Route path="/studio/:section" element={<DesktopStudio />} />

                          {/* ── Redirects ────────────────────────────── */}
                          <Route path="/" element={<Navigate to="/Home" replace />} />
                          <Route path="*" element={<Navigate to="/Home" replace />} />
                        </Route>
                      </Routes>
                    </AuthSuspense>
                  </ContentPreviewProvider>
                </LiveTickerProvider>
              </SavedPostsProvider>
            </RadiusProvider>
          </GuidanceProvider>
        </OrbWorldProvider>
      </WorldSurfaceProvider>
    </AppStateProvider>
  );
}
