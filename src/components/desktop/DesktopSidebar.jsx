// ══════════════════════════════════════════════════════════════════════════════
// DesktopSidebar.jsx — HUI Desktop V3 (kompletter Neuaufbau)
// ══════════════════════════════════════════════════════════════════════════════
//
// V3-PHILOSOPHIE:
//   Kein Dashboard. Ein hochwertiger Workspace.
//   Ruhig, elegant, ohne harte Hintergründe bei Hover.
//   Aktive Seite: türkiser Indikator, kein Kasten.
//
// STRUKTUR (nach Referenzgrafik):
//   Logo → Erstellen-Button (Glow) → Home/Entdecken/Studio/Nachrichten/
//   Impact/Veranstaltungen → WIRKUNG (Projekte, Unterstützte Projekte,
//   Empfehlungen) → KONTO (Mein Profil, Einstellungen) → Profilbereich unten
//
// DATEN: useAuth() (profile, logout), useChatList() (unread)
// Keine neue Business-Logik — nur bestehende Hooks.
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HUILogo } from '../brand/HUILogo.jsx';
import { useAuth } from '../../lib/AuthContext.jsx';
import { useTranslation } from "../../hooks/useTranslation.js";

// ── Icons — konsistent 1.5px outline ─────────────────────────────────────────
const PATHS = {
  home:        <path d="M3 9.5L10 4l7 5.5V16a1 1 0 0 1-1 1h-3v-4H7v4H4a1 1 0 0 1-1-1V9.5z" />,
  discover:    <><circle cx="10" cy="10" r="6.5" /><path d="M12.8 7.2l-1.6 3.6-3.6 1.6 1.6-3.6 3.6-1.6z" /></>,
  studio:      <><rect x="3" y="4" width="14" height="12" rx="2.5" /><path d="M3 8.5h14M7.2 4v4.5" /></>,
  messages:    <path d="M3 5.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8l-3.2 3v-3H5a2 2 0 0 1-2-2v-7z" />,
  impact:      <path d="M10 2.5v5.5l3.5 1.7L10 17.5v-5.5L6.5 10.2 10 2.5z" />,
  events:      <><rect x="3" y="5" width="14" height="12" rx="2.5" /><path d="M3 9h14M7 3v3M13 3v3" /></>,
  project:     <><rect x="3" y="3.5" width="14" height="14" rx="2" /><path d="M6.5 10l2.2 2.2L14 7.5" /></>,
  supported:   <path d="M10 17s-6-3.8-6-8.4A3.6 3.6 0 0 1 10 6a3.6 3.6 0 0 1 6 2.6C16 13.2 10 17 10 17z" />,
  recommend:   <><path d="M10 3l1.9 4 4.4.6-3.2 3.1.8 4.3L10 12.9l-3.9 2.1.8-4.3-3.2-3.1 4.4-.6L10 3z" /></>,
  profile:     <><circle cx="10" cy="7" r="3.2" /><path d="M3.8 17c0-3.4 2.8-6 6.2-6s6.2 2.6 6.2 6" /></>,
  settings:    <><circle cx="10" cy="10" r="2.6" /><path d="M10 3.5v2M10 14.5v2M16.5 10h-2M5.5 10h-2M14.6 5.4l-1.4 1.4M6.8 13.2l-1.4 1.4M14.6 14.6l-1.4-1.4M6.8 6.8l5.4-5.4" /></>,
  create:      <path d="M10 4v12M4 10h12" />,
  logout:      <path d="M7.2 3.6H4.4a1.2 1.2 0 0 0-1.2 1.2v10.4a1.2 1.2 0 0 0 1.2 1.2h2.8M13.5 6.8l3.2 3.2-3.2 3.2M16.3 10H8" />,
};

function Icon({ name, size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name] || null}
    </svg>
  );
}

// ── Nav-Struktur ──────────────────────────────────────────────────────────────
const MAIN_ITEMS = [
  { key: 'home',     label: 'Home',        icon: 'home',     route: '/Home' },
  { key: 'discover', label: 'Entdecken',   icon: 'discover', route: '/discover' },
  { key: 'studio',   label: 'Studio',       icon: 'studio',   route: '/studio' },
  { key: 'messages', label: 'Nachrichten',  icon: 'messages', action: 'chat' },
  { key: 'impact',   label: 'Impact',       icon: 'impact',   route: '/impact' },
  { key: 'events',   label: 'Veranstaltungen', icon: 'events', route: '/discover' },
];

const WIRKUNG_ITEMS = [
  { key: 'projects',   label: 'Projekte',            icon: 'project',   route: '/impact' },
  { key: 'supported',  label: "Unterstützte Projekte", icon: 'supported', route: '/impact' },
  { key: 'recommend',  label: 'Empfehlungen',        icon: 'recommend', route: '/profile/me' },
];

const KONTO_ITEMS = [
  { key: 'profile',  label: 'Mein Profil',   icon: 'profile',  route: '/profile/me' },
  { key: 'settings', label: 'Einstellungen', icon: 'settings', route: '/studio/settings' },
];

// ── Nav Item ──────────────────────────────────────────────────────────────────
function NavItem({ item, active, badge, onClick }) {
  return (
    <button
      className={`sb-item ${active ? 'active' : ''}`}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
    >
      <Icon name={item.icon} />
      <span className="sb-item-label">{item.label}</span>
      {badge > 0 && <span className="sb-badge">{badge > 9 ? '9+' : badge}</span>}
    </button>
  );
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────
export default function DesktopSidebar({ onOpenChat, chatUnread = 0 }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout } = useAuth();
  // P0: chatUnread kommt als Prop von DesktopShell (zentrale useChatList)

  function isActive(route) {
    if (!route) return false;
    if (location.pathname === route) return true;
    if (route === '/Home' && (location.pathname === '/' || location.pathname === '/app' || location.pathname === '/app/')) return true;
    return false;
  }

  function handleClick(item) {
    if (item.action === 'chat') { onOpenChat?.(); return; }
    if (item.route) navigate(item.route);
  }

  async function handleLogout() {
    try { await logout(); navigate('/login', { replace: true }); }
    catch (e) { console.error('[HUI Web] Logout:', e); }
  }

  const displayName = profile?.display_name || profile?.username || 'HUI Mitglied';
  const impactLevel = profile?.membership_type && profile.membership_type !== 'free'
    ? (profile.membership_type === 'premium' ? 'Premium' : profile.membership_type)
    : 'Mitglied';

  return (
    <aside className="hui-sidebar">
      {/* ── Logo ─────────────────────────────────────────────────── */}
      <button className="sb-logo" onClick={() => navigate('/Home')}>
        <HUILogo size={26} />
        <span className="sb-logo-text">HUI</span>
      </button>

      {/* ── Erstellen (V7.5: nur für Mitglieder) ─────────────────── */}
      {profile?.membership_active === true && (
        <button className="sb-create" onClick={() => navigate('/studio')}>
          <Icon name="create" size={17} />
          <span>Erstellen</span>
        </button>
      )}

      {/* ── Haupt-Navigation (V7.5: Studio nur für Mitglieder) ──── */}
      <nav className="sb-nav">
        {MAIN_ITEMS
          .filter(item => item.key !== 'studio' || profile?.membership_active === true)
          .map(item => (
          <NavItem
            key={item.key}
            item={item}
            active={isActive(item.route)}
            badge={item.key === 'messages' ? chatUnread : (item.key === 'home' ? 0 : 0)}
            onClick={() => handleClick(item)}
          />
        ))}
      </nav>

      {/* ── Wirkung ──────────────────────────────────────────────── */}
      <div className="sb-group">
        <div className="sb-group-label">Wirkung</div>
        {WIRKUNG_ITEMS.map(item => (
          <NavItem key={item.key} item={item} active={isActive(item.route)} badge={0} onClick={() => handleClick(item)} />
        ))}
      </div>

      {/* ── Konto ────────────────────────────────────────────────── */}
      <div className="sb-group">
        <div className="sb-group-label">Konto</div>
        {KONTO_ITEMS.map(item => (
          <NavItem key={item.key} item={item} active={isActive(item.route)} badge={0} onClick={() => handleClick(item)} />
        ))}
      </div>

      {/* ── Spacer ───────────────────────────────────────────────── */}
      <div className="sb-spacer" />

      {/* ── Profilbereich ────────────────────────────────────────── */}
      <div className="sb-profile" onClick={() => navigate('/profile/me')} role="button" tabIndex={0}>
        {profile?.avatar_url ? (
          <img className="sb-profile-avatar" src={profile.avatar_url} alt="" />
        ) : (
          <div className="sb-profile-avatar sb-profile-avatar-fallback">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="sb-profile-info">
          <span className="sb-profile-name">{displayName}</span>
          <span className="sb-profile-level">{impactLevel}</span>
        </div>
        <button
          className="sb-logout"
          onClick={(e) => { e.stopPropagation(); handleLogout(); }}
          aria-label="Abmelden"
        >
          <Icon name="logout" size={16} />
        </button>
      </div>
    </aside>
  );
}
