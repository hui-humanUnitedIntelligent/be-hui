// ══════════════════════════════════════════════════════════════════════════════
// DesktopShell.jsx — HUI Web Desktop Shell
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Zentrale Layout-Komponente für die HUI Web-Version.
//   Stellt die Desktop-Shell dar: Sidebar + Header + Content Area.
//   Prüft Auth und leitet zu /login um, wenn nicht authentifiziert.
//   Ersetzt die mobile HomeShell für Desktop-Bildschirme.
//
// ARCHITEKTUR:
//   DesktopShell ist ein React Router Layout-Element.
//   Es nutzt <Outlet /> um die aktuell geroutete Seite im
//   Content-Bereich zu rendern. Alle Kind-Routen (definiert in
//   WebApp.jsx) erscheinen automatisch im Content-Bereich.
//
// WIEDERVERWENDUNG:
//   - useAuth:           Gemeinsamer AuthContext
//   - DesktopSidebar:    Desktop-Navigation (neu, nutzt HUILogo aus Mobile-App)
//   - DesktopHeader:     Desktop-Header (neu, nutzt useNotifCount aus Mobile-App)
//   - Alle Pages:        Wiederverwendet aus der Mobile-App (UnifiedFeed, etc.)
//
// SICHERHEIT:
//   - loadingAuth → Ladebildschirm
//   - !isAuthenticated → Redirect zu /login
//   - isAuthenticated → Shell mit Sidebar + Header + Content
//
// ZUKUNFT:
//   - ProfileCompletionFlow (bei unvollständigem Profil)
//   - Conditional Admin-Sektion (role=admin)
//   - Organisation-spezifische Sidebar-Items
//   - Mehrsprachigkeit (Sprachschalter)
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';
import DesktopSidebar from './DesktopSidebar.jsx';
import DesktopHeader from './DesktopHeader.jsx';

// ── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="web-loading">
      <div className="web-loading-spinner" />
      <p style={{ fontSize: 13, color: '#8A8A9E' }}>HUI wird geladen…</p>
    </div>
  );
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────
export default function DesktopShell() {
  const { isAuthenticated, loadingAuth } = useAuth();

  // ── Auth Check ────────────────────────────────────────────────────────────
  if (loadingAuth) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ── Shell Layout ──────────────────────────────────────────────────────────
  return (
    <div className="desktop-shell">
      {/* Linke Navigationsleiste */}
      <DesktopSidebar />

      {/* Hauptbereich: Header + Content */}
      <div className="desktop-main">
        <DesktopHeader />

        {/* Content Area — Outlet rendert die aktuell geroutete Seite */}
        <main className="desktop-content">
          <div className="desktop-content-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
