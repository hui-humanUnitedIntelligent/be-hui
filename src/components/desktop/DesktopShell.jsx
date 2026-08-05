// ══════════════════════════════════════════════════════════════════════════════
// DesktopShell.jsx — HUI Desktop Platform Shell (Phase 1)
// ══════════════════════════════════════════════════════════════════════════════
//
// 3-ZONEN-LAYOUT:
//   ┌─────────┬──────────────────────┬─────────┐
//   │ Sidebar │   Header              │ Right   │
//   │ (260px)├──────────────────────┤ Panel   │
//   │         │   Content (Outlet)    │ (340px) │
//   │         │                       │         │
//   └─────────┴──────────────────────┴─────────┘
//
// PHASE 1:
//   - RightPanel wird nur auf /Home mit Daten versorgt.
//   - Auf anderen Routes zeigt RightPanel einen leeren Zustand.
//   - DesktopDataProvider wird in DesktopHome gemountet (nur /Home).
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';
import DesktopSidebar from './DesktopSidebar.jsx';
import DesktopHeader from './DesktopHeader.jsx';
import DesktopRightPanel from './DesktopRightPanel.jsx';

function LoadingScreen() {
  return (
    <div className="web-loading">
      <div className="web-loading-spinner" />
      <p style={{ fontSize: 13, color: 'var(--desktop-muted, #8A8A9E)' }}>HUI wird geladen…</p>
    </div>
  );
}

export default function DesktopShell() {
  const { isAuthenticated, loadingAuth } = useAuth();
  const location = useLocation();

  if (loadingAuth) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="desktop-shell">
      {/* ── Zone 1: Linke Navigation ─────────────────────────────── */}
      <DesktopSidebar />

      {/* ── Zone 2: Hauptbereich ──────────────────────────────────── */}
      <div className="desktop-main">
        <DesktopHeader />
        <main className="desktop-content">
          <div className="desktop-content-inner">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Zone 3: Wirkungsraum ──────────────────────────────────── */}
      {/* Auf /Home: DesktopDataProvider in DesktopHome mountet RightPanel mit Daten.
          Auf anderen Routes: RightPanel zeigt leeren Zustand (Phase 1). */}
      <DesktopRightPanel />
    </div>
  );
}
