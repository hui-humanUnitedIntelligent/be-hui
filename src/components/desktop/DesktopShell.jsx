// ══════════════════════════════════════════════════════════════════════════════
// DesktopShell.jsx — HUI Desktop V3 (kompletter Neuaufbau)
// ══════════════════════════════════════════════════════════════════════════════
//
// DREI-ZONEN-LAYOUT — permanent sichtbar, kein Umschalten, kein Springen:
//
//   ┌──────────┬────────────────────────────┬───────────┐
//   │ Sidebar  │  Header                     │           │
//   │ (260px) ├────────────────────────────┤ Rechte    │
//   │          │  Lebendiger Raum (Outlet)   │ Seite     │
//   │          │                             │ (340px)   │
//   └──────────┴────────────────────────────┴───────────┘
//
// Chat ist ein Slide-In-Panel (Master-Detail), das über der rechten Seite
// eingeblendet wird — kein Fullscreen, kein Seitenwechsel.
//
// Ctrl+K öffnet die Command Palette (Spotlight-artig).
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';
import DesktopSidebar from './DesktopSidebar.jsx';
import DesktopHeader from './DesktopHeader.jsx';
import DesktopRightPanel from './DesktopRightPanel.jsx';
import DesktopCommandPalette from './DesktopCommandPalette.jsx';
import DesktopChatPanel from './DesktopChatPanel.jsx';
import { DesktopDataProvider } from './DesktopDataContext.jsx';

function LoadingScreen() {
  return (
    <div className="hui-loading-screen">
      <div className="hui-loading-orb" />
      <p>HUI wird geladen…</p>
    </div>
  );
}

export default function DesktopShell() {
  const { isAuthenticated, loadingAuth } = useAuth();
  const [showPalette, setShowPalette] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowPalette(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loadingAuth) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <DesktopDataProvider>
      <div className="hui-shell">
        <DesktopSidebar onOpenChat={() => setChatOpen(true)} />

        <div className="hui-main">
          <DesktopHeader
            onCommandPalette={() => setShowPalette(true)}
            chatOpen={chatOpen}
            onChatChange={setChatOpen}
          />
          <main className="hui-content">
            <div className="hui-content-inner">
              <Outlet />
            </div>
          </main>
        </div>

        <DesktopRightPanel />

        {showPalette && <DesktopCommandPalette onClose={() => setShowPalette(false)} />}
        {chatOpen && <DesktopChatPanel onClose={() => setChatOpen(false)} />}
      </div>
    </DesktopDataProvider>
  );
}
