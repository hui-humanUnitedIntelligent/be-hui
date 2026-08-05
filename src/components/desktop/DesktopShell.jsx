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
// P0-OPTIMIERUNG (2026-08-05):
//   useChatList wird EINMAL hier aufgerufen (instanceId 'desktop').
//   Sidebar, Header und ChatPanel erhalten chats/unreadTotal als Props.
//   Vorher: 3 useChatList-Instanzen → 3 Queries + 3 Realtime Channels.
//   Nachher: 1 useChatList-Instanz → 1 Query + 1 Realtime Channel.
//
// Chat ist ein Slide-In-Panel (Master-Detail), das über der rechten Seite
// eingeblendet wird — kein Fullscreen, kein Seitenwechsel.
//
// Ctrl+K öffnet die Command Palette (Spotlight-artig).
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';
import { useChatList } from '../../lib/chatContext.js';
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

  // P0: Zentrale useChatList-Instanz für alle Desktop-Komponenten
  // Vorher: 3 Instanzen (sidebar, header, desktop) → 3 Queries + 3 Realtime Channels
  // Nachher: 1 Instanz → 1 Query + 1 Realtime Channel
  const { chats, loading: chatLoading, unreadTotal: chatUnread } = useChatList('desktop');

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
        <DesktopSidebar
          onOpenChat={() => setChatOpen(true)}
          chatUnread={chatUnread}
        />

        <div className="hui-main">
          <DesktopHeader
            onCommandPalette={() => setShowPalette(true)}
            chatOpen={chatOpen}
            onChatChange={setChatOpen}
            chatUnread={chatUnread}
          />
          <main className="hui-content">
            <div className="hui-content-inner">
              <Outlet />
            </div>
          </main>
        </div>

        <DesktopRightPanel />

        {showPalette && <DesktopCommandPalette onClose={() => setShowPalette(false)} />}
        {chatOpen && (
          <DesktopChatPanel
            onClose={() => setChatOpen(false)}
            chats={chats}
            chatLoading={chatLoading}
            chatUnread={chatUnread}
          />
        )}
      </div>
    </DesktopDataProvider>
  );
}
