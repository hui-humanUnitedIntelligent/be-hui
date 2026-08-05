// ══════════════════════════════════════════════════════════════════════════════
// DesktopShell.jsx — HUI Desktop Platform Shell (Phase 0)
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Zentrale Layout-Komponente für die HUI Desktop-Plattform.
//   3-Zonen-Layout: Sidebar + Content + RightPanel (Wirkungsraum).
//   Prüft Auth und leitet zu /login um, wenn nicht authentifiziert.
//
// ARCHITEKTUR:
//   DesktopShell ist ein React Router Layout-Element.
//   Es nutzt <Outlet /> für die aktuell geroutete Seite.
//   DesktopRightPanel wird außerhalb des Outlet gerendert —
//   es ist auf jeder Seite sichtbar (≥1280px).
//
// 3-ZONEN-LAYOUT:
//   ┌─────────┬──────────────────────┬─────────┐
//   │ Sidebar │   Header            │         │
//   │ (260px) ├──────────────────────┤ Right   │
//   │         │   Content (Outlet)   │ Panel   │
//   │         │   max 1100px         │ (340px) │
//   │         │                      │         │
//   └─────────┴──────────────────────┴─────────┘
//
// RESPONSIVE:
//   ≥1280px: 3-Zonen (Sidebar + Content + RightPanel)
//   1024–1279: 2-Zonen (Compact Sidebar + Content) — RightPanel hidden
//   768–1023: 2-Zonen (Mini Sidebar + Content) — RightPanel hidden
//
// WIEDERVERWENDUNG:
//   - useAuth:          Gemeinsamer AuthContext (shared)
//   - DesktopSidebar:   Desktop-Navigation (Desktop-only)
//   - DesktopHeader:    Desktop-Header (Desktop-only)
//   - DesktopRightPanel: Wirkungsraum (Desktop-only, Phase 0: Shell)
//   - Alle Pages:       Wiederverwendet aus der shared Schicht
//
// DESIGN TOKENS:
//   Alle Breiten, Höhen, Abstände, Schatten und Z-Index-Werte
//   kommen aus desktopFoundation.css (CSS Custom Properties).
//   Keine Magic Numbers in dieser Datei.
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';
import DesktopSidebar from './DesktopSidebar.jsx';
import DesktopHeader from './DesktopHeader.jsx';
import DesktopRightPanel from './DesktopRightPanel.jsx';

// ── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="web-loading">
      <div className="web-loading-spinner" />
      <p style={{ fontSize: 13, color: 'var(--desktop-muted, #8A8A9E)' }}>
        HUI wird geladen…
      </p>
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

  // ── 3-Zonen Shell Layout ──────────────────────────────────────────────────
  return (
    <div className="desktop-shell">
      {/* ── Zone 1: Linke Navigation ─────────────────────────────── */}
      <DesktopSidebar />

      {/* ── Zone 2: Hauptbereich (Header + Content) ───────────────── */}
      <div className="desktop-main">
        <DesktopHeader />

        {/* Content Area — Outlet rendert die aktuell geroutete Seite */}
        <main className="desktop-content">
          <div className="desktop-content-inner">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Zone 3: Wirkungsraum (Right Panel) ────────────────────── */}
      {/* Phase 0: Leere Shell. Später: Impact, Resonanz, Möglichkeiten. */}
      <DesktopRightPanel />
    </div>
  );
}
