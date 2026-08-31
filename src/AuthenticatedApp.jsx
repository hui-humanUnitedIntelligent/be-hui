// ══════════════════════════════════════════════════════════════════════════════
// AuthenticatedApp.jsx — HUI Web Authenticated Provider Tree + Routes
// ══════════════════════════════════════════════════════════════════════════════
//
// Diese Datei wird NUR geladen, wenn der Nutzer authentifiziert ist.
// Sie enthält alle App-spezifischen Provider und Routen.
// Auf /login wird dieser Code gar nicht heruntergeladen.
//
// v2.4: desktopV3.css + devconsole — alle nur nach Auth
// von web-main.jsx hierher verschoben — nur nach Auth aktiv.
//
// Provider-Tree:
//   AppStateProvider → WorldSurfaceProvider → OrbWorldProvider →
//   GuidanceProvider → RadiusProvider → SavedPostsProvider →
//   LiveTickerProvider → ContentPreviewProvider → DesktopShell
// ══════════════════════════════════════════════════════════════════════════════

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';

// ── App-spezifische Provider ─────────────────────────────────────────────────
import { AppStateProvider } from './lib/AppStateContext.jsx';
import { WorldSurfaceProvider } from './context/WorldSurfaceContext.jsx';
import { OrbWorldProvider } from './context/OrbWorldContext.jsx';
import { GuidanceProvider } from './components/guidance/GuidanceContext.jsx';
import { RadiusProvider } from './context/RadiusContext.jsx';
import { SavedPostsProvider } from './context/SavedPostsContext.jsx';
import { LiveTickerProvider } from './context/LiveTickerContext.jsx';
import { ContentPreviewProvider, useContentPreview } from './context/ContentPreviewContext.jsx';
import { WorkService } from './services/db.js';

// ── Desktop Shell ───────────────────────────────────────────────────────────
import DesktopShell from './components/desktop/DesktopShell.jsx';
import DesktopHome from './components/desktop/DesktopHome.jsx';
import DesktopProfile from './components/desktop/DesktopProfile.jsx';
import DesktopDiscover from './components/desktop/DesktopDiscover.jsx';
import DesktopStudio from './components/desktop/DesktopStudio.jsx';

// ── Developer Console (Dev/Admin Mode only — zero overhead in production) ────
import './components/desktop/devconsole/init.js';
// ── Desktop V3 Design System (nur nach Auth geladen) ───────────────────────
import './components/desktop/desktopV3.css';

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

// ── DEEPLINK.1-WEB (2026-08-31) — Web-App-Pendant zu App.jsx DeepLinkOpener/
// WorkBySlugOpener/WirkerAliasRedirect. ROOT CAUSE des 404-Bugs: Diese
// Deep-Link-Typen (Moment/Projekt/Erlebnis/Veranstaltung/Talent/Werk-Slug/
// Wirker-Alias) existierten NUR in App.jsx (native App, kein Server-Routing-
// Problem dort), aber NICHT hier in der Web-App (AuthenticatedApp.jsx) unter
// dem Router-Basename /app. Reale Browser die einen dieser Pfade aufriefen
// (z.B. via HuiShareModal-Link /beitrag/:id) fielen auf Vercels Standard-
// 404.html, weil vercel.json diese Pfade nur für Bot-User-Agents (OG-Preview)
// zu /api/og rewritet -- für Menschen gab es kein Ziel. Fix: Evolution statt
// Duplizierung -- exakt dieselbe ContentPreviewProvider-Infra (bereits hier
// aktiv, siehe Provider-Tree oben) wiederverwenden, nur das Hintergrund-Element
// ist DesktopHome statt der mobilen Home-Komponente aus App.jsx.
function WebDeepLinkOpener({ type }) {
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

  // "loading"/"done": DesktopHome bleibt als Hintergrund sichtbar, das
  // eigentliche Overlay (Sheet/Fullscreen) wird global vom
  // ContentPreviewProvider gerendert (siehe ContentPreviewContext.jsx).
  // "notfound": zurück auf Home -- kein separates NotFound-UI nötig,
  // Inhalt existiert schlicht nicht (gelöscht/privat).
  if (state === "notfound") return <Navigate to="/Home" replace />;
  return <DesktopHome />;
}

// ── DEEPLINK.1-WEB: /werke/:slug -- Slug zur Werk-ID auflösen, dann auf die
// bestehende /work/:id-Route weiterleiten (kein Umbau von WorkDetailPage). ──
function WebWorkBySlugOpener() {
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

  if (workId === undefined) return <DesktopHome />;
  if (workId === null) return <Navigate to="/Home" replace />;
  return <Navigate to={`/work/${workId}`} replace />;
}

// ── DEEPLINK.1-WEB: /wirker/:username -- reiner Alias, keine eigene Logik. ──
function WebWirkerAliasRedirect() {
  const { username } = useParams();
  return <Navigate to={`/profile/${username}`} replace />;
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
                          <Route path="/werke/:slug" element={<WebWorkBySlugOpener />} />
                          <Route path="/beitrag/:id" element={<WebDeepLinkOpener type="moment" />} />
                          <Route path="/projekt/:id" element={<WebDeepLinkOpener type="project" />} />
                          <Route path="/erlebnis/:id" element={<WebDeepLinkOpener type="experience" />} />
                          <Route path="/veranstaltung/:id" element={<WebDeepLinkOpener type="event" />} />
                          <Route path="/talent/:id" element={<WebDeepLinkOpener type="talent" />} />
                          <Route path="/wirker/:username" element={<WebWirkerAliasRedirect />} />
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
