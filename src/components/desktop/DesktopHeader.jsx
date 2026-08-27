// ══════════════════════════════════════════════════════════════════════════════
// DesktopHeader.jsx — HUI Desktop V3 (kompletter Neuaufbau)
// ══════════════════════════════════════════════════════════════════════════════
//
// V3-PHILOSOPHIE:
//   Nicht hoch (~70px). Große, ruhige Suche fast über die gesamte Breite.
//   Rechts: Notifications, Nachrichten, Kalender, Profil — minimal, elegant.
//   Keine großen Buttons.
//
// DATEN: SearchService.search(), useNotifCount(), useChatList(), useAuth()
// Keine neue Business-Logik.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PerfProfiler, usePerfMount } from './perf-instrument.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';
import { useNotifCount } from '../../lib/AppStateContext.jsx';
import { SearchService } from '../../services/db.js';
import { useEscapeKey } from './hooks/useEscapeKey.js';
import DesktopNotificationFlyout from './DesktopNotificationFlyout.jsx';
import DesktopKalenderFlyout from './DesktopKalenderFlyout.jsx';
import { useTranslation } from "../../hooks/useTranslation.js";

// ── Avatar Dropdown ──────────────────────────────────────────────────────────
function AvatarDropdown({ profile, onNavigate, onLogout, onClose }) {
  return (
    <>
      <div className="hd-dropdown-backdrop" onClick={onClose} />
      <div className="hd-avatar-dropdown">
        <div className="hd-avatar-dropdown-header">
          {profile?.avatar_url ? (
            <img className="hd-avatar-dropdown-img" src={profile.avatar_url} alt="" />
          ) : (
            <div className="hd-avatar-dropdown-img hd-avatar-fallback">
              {(profile?.display_name || profile?.username || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="hd-dropdown-name">{profile?.display_name || profile?.username || 'HUI Mitglied'}</div>
            <div className="hd-dropdown-handle">{profile?.username ? `@${profile.username}` : ''}</div>
          </div>
        </div>
        <div className="hd-dropdown-divider" />
        <button className="hd-dropdown-item" onClick={() => { onNavigate('/profile/me'); onClose(); }}>Mein Profil</button>
        <button className="hd-dropdown-item" onClick={() => { onNavigate('/studio'); onClose(); }}>Studio</button>
        <button className="hd-dropdown-item" onClick={() => { onNavigate('/impact'); onClose(); }}>Impact</button>
        <div className="hd-dropdown-divider" />
        <button className="hd-dropdown-item hd-dropdown-logout" onClick={() => { onLogout(); onClose(); }}>Abmelden</button>
      </div>
    </>
  );
}

// ── Search Dropdown ───────────────────────────────────────────────────────────
function SearchDropdown({ results, loading, onSelect, onClose }) {
  const total = (results.profiles?.length || 0) + (results.works?.length || 0) + (results.experiences?.length || 0);
  const { t } = useTranslation();
  return (
    <>
      <div className="hd-dropdown-backdrop" onClick={onClose} />
      <div className="hd-search-dropdown">
        {loading ? (
          <div className="hd-search-status">{t("common.searching")}</div>
        ) : total === 0 ? (
          <div className="hd-search-status">Keine Ergebnisse gefunden.</div>
        ) : (
          <>
            {results.profiles?.length > 0 && (
              <div className="hd-search-section">
                <div className="hd-search-label">Menschen</div>
                {results.profiles.map(p => (
                  <button key={p.id} className="hd-search-item" onClick={() => onSelect('profile', p)}>
                    {p.avatar_url ? <img src={p.avatar_url} alt="" className="hd-search-avatar" /> : (
                      <div className="hd-search-avatar hd-search-avatar-fallback">{(p.display_name || p.username || '?').charAt(0).toUpperCase()}</div>
                    )}
                    <div>
                      <div className="hd-search-title">{p.display_name || p.username}</div>
                      {p.talent && <div className="hd-search-sub">{p.talent}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {results.works?.length > 0 && (
              <div className="hd-search-section">
                <div className="hd-search-label">Werke</div>
                {results.works.map(w => (
                  <button key={w.id} className="hd-search-item" onClick={() => onSelect('work', w)}>
                    <div className="hd-search-title">{w.title}</div>
                  </button>
                ))}
              </div>
            )}
            {results.experiences?.length > 0 && (
              <div className="hd-search-section">
                <div className="hd-search-label">Erlebnisse</div>
                {results.experiences.map(e => (
                  <button key={e.id} className="hd-search-item" onClick={() => onSelect('experience', e)}>
                    <div className="hd-search-title">{e.title}</div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function BellIcon() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a4 4 0 0 1 8 0v3l1.5 2H4.5L6 11V8z" /><path d="M8 15a2 2 0 0 0 4 0" /></svg>;
}
function ChatIcon() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8l-3.2 3v-3H5a2 2 0 0 1-2-2v-7z" /></svg>;
}
function CalendarIcon() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="14" height="12" rx="2.5" /><path d="M3 9h14M7 3v3M13 3v3" /></svg>;
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────
export default function DesktopHeader({ onCommandPalette, chatOpen, onChatChange, chatUnread = 0 }) {
  const { t } = useTranslation();
  usePerfMount('DesktopHeader');
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const notifCount = useNotifCount();
  // P0: chatUnread kommt als Prop von DesktopShell (zentrale useChatList)

  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState({ profiles: [], works: [], experiences: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showKalender, setShowKalender] = useState(false);

  const searchTimer = useRef(null);

  useEscapeKey(() => {
    setShowSearch(false);
    setShowAvatar(false);
    setShowNotif(false);
    setShowKalender(false);
    if (chatOpen) onChatChange?.(false);
  });

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
        console.error('[HUI Web] Search:', e);
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
    <PerfProfiler id="DesktopHeader">
    <header className="hui-header">
      {/* Search */}
      <div className="hd-search-wrap">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="hd-search-icon">
          <circle cx="9" cy="9" r="6" /><path d="M17 17l-3.5-3.5" />
        </svg>
        <input
          type="text"
          className="hd-search-input"
          placeholder="Suche nach Menschen, Werken, Erlebnissen, Projekten …"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          aria-label="Suche"
        />
        <kbd className="hd-kbd" onClick={onCommandPalette}>⌘K</kbd>
        {showSearch && (
          <SearchDropdown results={searchResults} loading={searchLoading} onSelect={handleSearchSelect} onClose={() => setShowSearch(false)} />
        )}
      </div>

      {/* Actions */}
      <div className="hd-actions">
        <button className="hd-icon-btn" onClick={() => { setShowNotif(true); setShowAvatar(false); setShowKalender(false); }} aria-label="Benachrichtigungen">
          <BellIcon />
          {notifCount > 0 && <span className="hd-badge">{notifCount > 9 ? '9+' : notifCount}</span>}
        </button>
        <button className="hd-icon-btn" onClick={() => onChatChange?.(!chatOpen)} aria-label="Nachrichten">
          <ChatIcon />
          {chatUnread > 0 && <span className="hd-badge">{chatUnread > 9 ? '9+' : chatUnread}</span>}
        </button>
        <button className="hd-icon-btn" onClick={() => { setShowKalender(true); setShowAvatar(false); setShowNotif(false); }} aria-label="Kalender">
          <CalendarIcon />
        </button>
        <div className="hd-avatar-wrap">
          {profile?.avatar_url ? (
            <img className="hd-avatar" src={profile.avatar_url} alt="Profil" onClick={() => { setShowAvatar(!showAvatar); setShowNotif(false); setShowKalender(false); }} />
          ) : (
            <button className="hd-avatar hd-avatar-fallback" onClick={() => { setShowAvatar(!showAvatar); setShowNotif(false); setShowKalender(false); }} aria-label="Mein Profil">
              {(profile?.display_name || profile?.username || '?').charAt(0).toUpperCase()}
            </button>
          )}
          {showAvatar && (
            <AvatarDropdown profile={profile} onNavigate={navigate} onLogout={handleLogout} onClose={() => setShowAvatar(false)} />
          )}
        </div>
      </div>

      {/* Panels */}
      {showNotif && <DesktopNotificationFlyout onClose={() => setShowNotif(false)} />}
      {showKalender && <DesktopKalenderFlyout onClose={() => setShowKalender(false)} />}
    </header>
    </PerfProfiler>
  );
}
