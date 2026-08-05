// ══════════════════════════════════════════════════════════════════════════════
// DesktopHeader.jsx — HUI Desktop Header (Phase 2)
// ══════════════════════════════════════════════════════════════════════════════
//
// PHASE 2:
//   ✓ Chat-Panel (Slide-In, Master-Detail)
//   ✓ Notification-Flyout (420px, useNotifications)
//   ✓ Avatar-Dropdown (Profil, Studio, Impact, Abmelden)
//   ✓ Command Palette (Ctrl+K)
//   ✓ ESC schließt alle Panels
//   ✓ Outside Click schließt
//
// DATEN:
//   - SearchService.search() aus services/db.js (shared)
//   - useNotifCount() aus AppStateContext (shared)
//   - useAuth() für Profile + Logout (shared)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';
import { useNotifCount } from '../../lib/AppStateContext.jsx';
import { SearchService } from '../../services/db.js';
import { useEscapeKey } from './hooks/useEscapeKey.js';
import DesktopChatPanel from './DesktopChatPanel.jsx';
import DesktopNotificationFlyout from './DesktopNotificationFlyout.jsx';

// ── Avatar Dropdown ──────────────────────────────────────────────────────────
function AvatarDropdown({ profile, onNavigate, onLogout, onClose }) {
  return (
    <>
      <div className="desktop-dropdown-backdrop" onClick={onClose} />
      <div className="desktop-avatar-dropdown">
        <div className="avatar-dropdown-header">
          {profile?.avatar_url ? (
            <img className="avatar-dropdown-avatar" src={profile.avatar_url} alt="" />
          ) : (
            <div className="avatar-dropdown-avatar avatar-dropdown-fallback">
              {(profile?.display_name || profile?.username || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="avatar-dropdown-name">{profile?.display_name || profile?.username || 'HUI Mitglied'}</div>
            <div className="avatar-dropdown-handle">{profile?.username ? `@${profile.username}` : ''}</div>
          </div>
        </div>
        <div className="avatar-dropdown-divider" />
        <button className="avatar-dropdown-item" onClick={() => { onNavigate('/profile/me'); onClose(); }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="7" r="3" /><path d="M4 17c0-3 3-5 6-5s6 2 6 5" /></svg>
          Mein Profil
        </button>
        <button className="avatar-dropdown-item" onClick={() => { onNavigate('/studio'); onClose(); }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="14" height="12" rx="2" /><path d="M3 8h14" /></svg>
          Studio
        </button>
        <button className="avatar-dropdown-item" onClick={() => { onNavigate('/impact'); onClose(); }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2v6l4 2-4 8v-6l-4-2 4-8z" /></svg>
          Impact
        </button>
        <div className="avatar-dropdown-divider" />
        <button className="avatar-dropdown-item avatar-dropdown-logout" onClick={() => { onLogout(); onClose(); }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 4H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M14 7l3 3-3 3M17 10H8" /></svg>
          Abmelden
        </button>
      </div>
    </>
  );
}

// ── Search Results Dropdown ─────────────────────────────────────────────────
function SearchDropdown({ results, loading, onSelect, onClose }) {
  if (loading) {
    return (
      <>
        <div className="desktop-dropdown-backdrop" onClick={onClose} />
        <div className="desktop-search-dropdown">
          <div className="search-dropdown-loading">Suche läuft…</div>
        </div>
      </>
    );
  }
  const total = (results.profiles?.length || 0) + (results.works?.length || 0) + (results.experiences?.length || 0);
  if (!total) {
    return (
      <>
        <div className="desktop-dropdown-backdrop" onClick={onClose} />
        <div className="desktop-search-dropdown">
          <div className="search-dropdown-empty">Keine Ergebnisse gefunden.</div>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="desktop-dropdown-backdrop" onClick={onClose} />
      <div className="desktop-search-dropdown">
        {results.profiles?.length > 0 && (
          <div className="search-dropdown-section">
            <div className="search-dropdown-label">Menschen</div>
            {results.profiles.map(p => (
              <button key={p.id} className="search-dropdown-item" onClick={() => onSelect('profile', p)}>
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="search-item-avatar" />
                ) : (
                  <div className="search-item-avatar search-item-avatar-fallback">
                    {(p.display_name || p.username || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="search-item-title">{p.display_name || p.username}</div>
                  {p.talent && <div className="search-item-sub">{p.talent}</div>}
                </div>
              </button>
            ))}
          </div>
        )}
        {results.works?.length > 0 && (
          <div className="search-dropdown-section">
            <div className="search-dropdown-label">Werke</div>
            {results.works.map(w => (
              <button key={w.id} className="search-dropdown-item" onClick={() => onSelect('work', w)}>
                <div className="search-item-icon"><svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="14" height="14" rx="2" /></svg></div>
                <div><div className="search-item-title">{w.title}</div></div>
              </button>
            ))}
          </div>
        )}
        {results.experiences?.length > 0 && (
          <div className="search-dropdown-section">
            <div className="search-dropdown-label">Erlebnisse</div>
            {results.experiences.map(e => (
              <button key={e.id} className="search-dropdown-item" onClick={() => onSelect('experience', e)}>
                <div className="search-item-icon"><svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="7" /></svg></div>
                <div><div className="search-item-title">{e.title}</div></div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────
export default function DesktopHeader({ onCommandPalette }) {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const notifCount = useNotifCount();
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState({ profiles: [], works: [], experiences: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  const searchTimer = useRef(null);

  useEscapeKey(() => {
    setShowSearch(false);
    setShowAvatar(false);
    setShowChat(false);
    setShowNotif(false);
  });

  // Search (debounced)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (searchValue.trim().length < 2) {
      setSearchResults({ profiles: [], works: [], experiences: [] });
      setShowSearch(false);
      return;
    }
    setSearchLoading(true);
    setShowSearch(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const results = await SearchService.search(searchValue.trim(), { limit: 5 });
        setSearchResults(results);
      } catch (e) {
        console.error('[HUI Web] Search error:', e);
        setSearchResults({ profiles: [], works: [], experiences: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, [searchValue]);

  const handleSearchSelect = useCallback((type, item) => {
    setShowSearch(false);
    setSearchValue('');
    if (type === 'profile') navigate(`/profile/${item.username || item.id}`);
    else if (type === 'work') navigate(`/work/${item.id}`);
    else if (type === 'experience') navigate('/discover');
  }, [navigate]);

  async function handleLogout() {
    try { await logout(); navigate('/login', { replace: true }); }
    catch (e) { console.error('[HUI Web] Logout:', e); }
  }

  return (
    <header className="desktop-header">
      <div className="header-inner">

        {/* Search */}
        <div className="header-search-container">
          <span className="header-search-icon">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="9" r="6" /><path d="M17 17l-3.5-3.5" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Suchen — Menschen, Werke, Erlebnisse…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            aria-label="Suche"
            className="header-search-input"
          />
          <kbd className="header-search-kbd" onClick={onCommandPalette}>⌘K</kbd>
          {showSearch && (
            <SearchDropdown
              results={searchResults}
              loading={searchLoading}
              onSelect={handleSearchSelect}
              onClose={() => setShowSearch(false)}
            />
          )}
        </div>

        {/* Actions */}
        <div className="header-actions">
          {/* Notifications */}
          <button
            className="header-icon-btn"
            onClick={() => { setShowNotif(true); setShowAvatar(false); setShowChat(false); }}
            aria-label="Benachrichtigungen"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a4 4 0 0 1 8 0v3l1.5 2H4.5L6 11V8z" /><path d="M8 15a2 2 0 0 0 4 0" />
            </svg>
            {notifCount > 0 && <span className="header-badge">{notifCount > 99 ? '99+' : notifCount}</span>}
          </button>

          {/* Messages */}
          <button
            className="header-icon-btn"
            onClick={() => { setShowChat(true); setShowAvatar(false); setShowNotif(false); }}
            aria-label="Nachrichten"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8l-3 3v-3H5a2 2 0 0 1-2-2V5z" />
            </svg>
          </button>

          {/* Avatar */}
          <div className="header-avatar-wrapper">
            {profile?.avatar_url ? (
              <img
                className="header-avatar"
                src={profile.avatar_url}
                alt="Profil"
                onClick={() => { setShowAvatar(!showAvatar); setShowNotif(false); setShowChat(false); }}
              />
            ) : (
              <button
                className="header-avatar header-avatar-fallback"
                onClick={() => { setShowAvatar(!showAvatar); setShowNotif(false); setShowChat(false); }}
                aria-label="Mein Profil"
              >
                {(profile?.display_name || profile?.username || '?').charAt(0).toUpperCase()}
              </button>
            )}
            {showAvatar && (
              <AvatarDropdown
                profile={profile}
                onNavigate={navigate}
                onLogout={handleLogout}
                onClose={() => setShowAvatar(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Panels ─────────────────────────────────────────────────────────── */}
      {showNotif && <DesktopNotificationFlyout onClose={() => setShowNotif(false)} />}
      {showChat && <DesktopChatPanel onClose={() => setShowChat(false)} />}
    </header>
  );
}
