// ══════════════════════════════════════════════════════════════════════════════
// DesktopHeader.jsx — HUI Web Desktop Header
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Obere Header-Leiste für die HUI Web-Version.
//   Enthält Suche, Benachrichtigungen, Nachrichten und Profil.
//   Ersetzt den mobilen HomeHeader für Desktop-Bildschirme.
//
// WIEDERVERWENDUNG:
//   - useAuth:        Gemeinsamer AuthContext
//   - useNotifCount:  Gemeinsamer AppStateContext
//   - HUI Design:     Design System Tokens
//
// PHASE 1 STATUS:
//   - Suchleiste: Platzhalter (funktioniert noch nicht, wird in Schritt 8 gebaut)
//   - Notifications: Button vorhanden, Panel folgt in späterer Phase
//   - Messages: Button vorhanden, Chat folgt in späterer Phase
//   - Profile: Avatar clickable → /profile/me
//
// ZUKUNFT:
//   - DesktopCommandCenter (Volltextsuche mit Ctrl+K)
//   - NotificationFlyout (Dropdown statt Fullscreen-Overlay)
//   - DesktopChatLayout (Master-Detail Chat)
//   - ProfileDropdown (Schnellzugriff auf Studio, Einstellungen, Abmelden)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';
import { useNotifCount } from '../../lib/AppStateContext.jsx';

export default function DesktopHeader() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const notifCount = useNotifCount();
  const [searchValue, setSearchValue] = useState('');

  function handleSearchSubmit(e) {
    e.preventDefault();
    // Phase 1: Suche noch nicht implementiert
    // Wird in Schritt 8 durch DesktopCommandCenter ersetzt
    if (searchValue.trim()) {
      console.log('[HUI Web] Search (not yet implemented):', searchValue);
    }
  }

  return (
    <header className="desktop-header">
      <div className="header-inner">
        {/* ── Search ───────────────────────────────────────────────── */}
        <form className="header-search" onSubmit={handleSearchSubmit}>
          <span className="header-search-icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="9" r="6" />
              <path d="M17 17l-3.5-3.5" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Suchen — Menschen, Werke, Erlebnisse…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            aria-label="Suche"
          />
        </form>

        {/* ── Action Buttons ───────────────────────────────────────── */}
        <div className="header-actions">
          {/* Notifications */}
          <button
            className="header-icon-btn"
            onClick={() => navigate('/notifications')}
            aria-label="Benachrichtigungen"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8a4 4 0 0 1 8 0v3l1.5 2H4.5L6 11V8z" />
              <path d="M8 15a2 2 0 0 0 4 0" />
            </svg>
            {notifCount > 0 && (
              <span className="header-badge">
                {notifCount > 99 ? '99+' : notifCount}
              </span>
            )}
          </button>

          {/* Messages */}
          <button
            className="header-icon-btn"
            onClick={() => navigate('/messages')}
            aria-label="Nachrichten"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8l-3 3v-3H5a2 2 0 0 1-2-2V5z" />
            </svg>
          </button>

          {/* Profile Avatar */}
          {profile?.avatar_url ? (
            <img
              className="header-avatar"
              src={profile.avatar_url}
              alt="Profil"
              onClick={() => navigate('/profile/me')}
            />
          ) : (
            <button
              className="header-avatar"
              onClick={() => navigate('/profile/me')}
              style={{
                background: '#E6FAF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#09A89A',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
              }}
              aria-label="Mein Profil"
            >
              {(profile?.display_name || profile?.username || '?').charAt(0).toUpperCase()}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
