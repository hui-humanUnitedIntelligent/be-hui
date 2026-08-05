// ══════════════════════════════════════════════════════════════════════════════
// DesktopSidebar.jsx — HUI Desktop Navigation (v2.0)
// ══════════════════════════════════════════════════════════════════════════════
//
// DESIGN v2.0:
//   Wärmer. Mehr Charakter. Mehr HUI.
//   - Orb als sanft leuchtender Kreis (kein Icon)
//   - Profilbereich großzügiger, mit warmer Aura
//   - Hover: sanfte Opazität statt harten Hintergrund
//   - Active: dezenter Teal-Glow statt Block
//   - Bessere Abstände, mehr Luft
//   - Erstellen-Button: weicher, runder, kein harten Shadow
//
// DATEN:
//   useNotifCount() aus AppStateContext (shared)
//   useAuth() für Profile + Logout (shared)
//   Kein eigener Supabase-Aufruf
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HUILogo } from '../brand/HUILogo.jsx';
import { useAuth } from '../../lib/AuthContext.jsx';
import { useNotifCount } from '../../lib/AppStateContext.jsx';
import { DESKTOP_NAV_SECTIONS } from './desktopNavConfig.js';

// ── Inline SVG Icons (20×20, 1.5px stroke, currentColor) ──────────────────────
const ICON_PATHS = {
  home:     <path d="M3 9.5L10 4l7 5.5V16a1 1 0 0 1-1 1h-3v-4H7v4H4a1 1 0 0 1-1-1V9.5z" />,
  discover: <><circle cx="10" cy="10" r="7" /><path d="M13.5 6.5l-2 4.5-4.5 2 2-4.5 4.5-2z" /></>,
  impact:   <path d="M10 2v6l4 2-4 8v-6l-4-2 4-8z" />,
  studio:   <><rect x="3" y="4" width="14" height="12" rx="2" /><path d="M3 8h14M7 4v4M13 4v4" /></>,
  messages: <path d="M3 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8l-3 3v-3H5a2 2 0 0 1-2-2V5z" />,
  profile:  <><circle cx="10" cy="7" r="3" /><path d="M4 17c0-3 3-5 6-5s6 2 6 5" /></>,
  settings: <><circle cx="10" cy="10" r="2.5" /><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" /></>,
  create:   <path d="M10 4v12M4 10h12" />,
  logout:   <path d="M7 4H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M14 7l3 3-3 3M17 10H8" />,
};

function NavIcon({ name, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICON_PATHS[name] || null}
    </svg>
  );
}

// ── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ label, show }) {
  if (!show) return null;
  return <span className="sidebar-tooltip">{label}</span>;
}

// ── Sidebar-Item ──────────────────────────────────────────────────────────────
function SidebarItem({ item, isActive, onClick, badge, compact }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="sidebar-item-wrapper"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        className={`sidebar-item ${isActive ? 'active' : ''}`}
        onClick={onClick}
        aria-current={isActive ? 'page' : undefined}
        aria-label={item.label}
      >
        <NavIcon name={item.icon} />
        <span className="sidebar-item-label">{item.label}</span>
        {badge > 0 && <span className="sidebar-badge">{badge > 99 ? '99+' : badge}</span>}
      </button>
      {compact && <Tooltip label={item.label} show={hovered} />}
    </div>
  );
}

// ── Erstellen-Button ──────────────────────────────────────────────────────────
function CreateButton({ onClick }) {
  return (
    <button className="sidebar-create-btn" onClick={onClick} aria-label="Erstellen">
      <NavIcon name="create" size={18} />
      <span className="sidebar-item-label">Erstellen</span>
    </button>
  );
}

// ── Orb (sanft leuchtender Kreis) ────────────────────────────────────────────
function OrbButton({ onClick, compact }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="sidebar-item-wrapper"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button className="sidebar-orb-btn" onClick={onClick} aria-label="Mein HUI — Wirkungsraum">
        <span className="sidebar-orb-glow" />
        <span className="sidebar-orb-core" />
        <span className="sidebar-item-label">Mein HUI</span>
      </button>
      {compact && <Tooltip label="Mein HUI" show={hovered} />}
    </div>
  );
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────
export default function DesktopSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout } = useAuth();
  const notifCount = useNotifCount();

  const [compact, setCompact] = useState(false);
  useEffect(() => {
    function check() { setCompact(window.innerWidth >= 1024 && window.innerWidth < 1280); }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  function isItemActive(route) {
    if (location.pathname === route) return true;
    if (route === '/Home' && (location.pathname === '/' || location.pathname === '/app/' || location.pathname === '/app')) return true;
    return false;
  }

  async function handleLogout() {
    try { await logout(); navigate('/login', { replace: true }); }
    catch (e) { console.error('[HUI Web] Logout error:', e); }
  }

  const badgeMap = { home: notifCount };

  return (
    <aside className="desktop-sidebar">
      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div className="sidebar-logo" onClick={() => navigate('/Home')} role="button" tabIndex={0}>
        <HUILogo size={30} />
        <span className="sidebar-item-label sidebar-logo-text">HUI</span>
      </div>

      {/* ── Erstellen ────────────────────────────────────────────── */}
      <CreateButton onClick={() => navigate('/studio')} />

      {/* ── Orb ────────────────────────────────────────────────────── */}
      <OrbButton onClick={() => {}} compact={compact} />

      {/* ── Trenner ─────────────────────────────────────────────────── */}
      <div className="sidebar-divider" />

      {/* ── Navigation ──────────────────────────────────────────────── */}
      {DESKTOP_NAV_SECTIONS.map((section) => (
        <div key={section.id} className="sidebar-section">
          {section.label && <div className="sidebar-section-label">{section.label}</div>}
          {section.items.map((item) => (
            <SidebarItem
              key={item.key}
              item={item}
              isActive={isItemActive(item.route)}
              onClick={() => navigate(item.route)}
              badge={badgeMap[item.key] || 0}
              compact={compact}
            />
          ))}
        </div>
      ))}

      {/* ── Spacer ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1 }} />

      {/* ── Profilbereich ──────────────────────────────────────────── */}
      <div className="sidebar-profile">
        <div
          className="sidebar-profile-card"
          onClick={() => navigate('/profile/me')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/profile/me'); } }}
        >
          {profile?.avatar_url ? (
            <img className="sidebar-profile-avatar" src={profile.avatar_url} alt="" />
          ) : (
            <div className="sidebar-profile-avatar sidebar-profile-avatar-fallback">
              {(profile?.display_name || profile?.username || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="sidebar-profile-info">
            <div className="sidebar-profile-name">{profile?.display_name || profile?.username || 'HUI Mitglied'}</div>
            <div className="sidebar-profile-handle">{profile?.username ? `@${profile.username}` : 'Profil ansehen'}</div>
          </div>
          <button
            className="sidebar-logout"
            onClick={(e) => { e.stopPropagation(); handleLogout(); }}
            aria-label="Abmelden"
          >
            <NavIcon name="logout" size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
