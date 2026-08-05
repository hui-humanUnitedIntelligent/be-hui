// ══════════════════════════════════════════════════════════════════════════════
// DesktopShell.jsx — HUI Desktop Platform Shell (Phase 2)
// ══════════════════════════════════════════════════════════════════════════════
//
// PHASE 2:
//   - Ctrl+K öffnet Command Palette
//   - Chat + Notifications als Slide-In/Flyout
//   - Profile/Discover/Studio als Desktop-Wrapper
//
// 3-ZONEN-LAYOUT:
//   ┌─────────┬──────────────────────┬─────────┐
//   │ Sidebar │   Header              │ Right   │
//   │ (260px)├──────────────────────┤ Panel   │
//   │         │   Content (Outlet)    │ (340px) │
//   └─────────┴──────────────────────┴─────────┘
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';
import DesktopSidebar from './DesktopSidebar.jsx';
import DesktopHeader from './DesktopHeader.jsx';
import DesktopRightPanel from './DesktopRightPanel.jsx';
import DesktopCommandPalette from './DesktopCommandPalette.jsx';

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
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Ctrl+K / Cmd+K → Command Palette
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loadingAuth) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="desktop-shell">
      <DesktopSidebar />

      <div className="desktop-main">
        <DesktopHeader onCommandPalette={() => setShowCommandPalette(true)} />
        <main className="desktop-content">
          <div className="desktop-content-inner">
            <Outlet />
          </div>
        </main>
      </div>

      <DesktopRightPanel />

      {showCommandPalette && (
        <DesktopCommandPalette onClose={() => setShowCommandPalette(false)} />
      )}
    </div>
  );
}
