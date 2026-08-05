// ══════════════════════════════════════════════════════════════════════════════
// DesktopSidebar.jsx — HUI Web Desktop Navigation
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Linke Navigationsleiste für die HUI Web-Version.
//   Zeigt das HUI-Logo, Navigationssektionen und Benutzerinfo.
//   Ersetzt die mobile HUIBottomNavigation für Desktop-Bildschirme.
//
// WIEDERVERWENDUNG:
//   - HUILogo:  Direkt aus der Mobile-App (src/components/brand/HUILogo.jsx)
//   - useAuth:  Gemeinsamer AuthContext (src/lib/AuthContext.jsx)
//   - Design:   HUI Design System (src/design/hui.design.js)
//
// ARCHITEKTUR:
//   - Navigation wird aus desktopNavConfig.js geladen (deklarativ)
//   - Active-State basiert auf React Router useLocation
//   - SVG-Icons sind inline (keine externe Icon-Library nötig)
//   - Responsive: < 1280px → Icon-only (CSS in web.css)
//
// ZUKUNFTSERWEITERUNGEN:
//   - Admin-Sektion (conditional, nur für role=admin)
//   - Organisationen & Vereine (conditional, nach Feature-Flag)
//   - Mehrsprachigkeit (Sprachumschalter unten)
//   - PWA-Install-Hinweis (Browser-spezifisch)
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HUILogo } from '../brand/HUILogo.jsx';
import { useAuth } from '../../lib/AuthContext.jsx';
import { DESKTOP_NAV_SECTIONS } from './desktopNavConfig.js';

// ── Inline SVG Icon Paths (20×20, 1.5px stroke, currentColor) ───────────────
//   Konsistent mit dem HUI Design System (1.5px Outline Icons).
//   Neue Icons: hier hinzufügen und in desktopNavConfig.js referenzieren.
const ICON_PATHS = {
  home: (
    <>
      <path d="M3 9.5L10 4l7 5.5V16a1 1 0 0 1-1 1h-3v-4H7v4H4a1 1 0 0 1-1-1V9.5z" />
    </>
  ),
  discover: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M13.5 6.5l-2 4.5-4.5 2 2-4.5 4.5-2z" />
    </>
  ),
  impact: (
    <>
      <path d="M10 2v6l4 2-4 8v-6l-4-2 4-8z" />
    </>
  ),
  studio: (
    <>
      <rect x="3" y="4" width="14" height="12" rx="2" />
      <path d="M3 8h14M7 4v4M13 4v4" />
    </>
  ),
  messages: (
    <>
      <path d="M3 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8l-3 3v-3H5a2 2 0 0 1-2-2V5z" />
    </>
  ),
  profile: (
    <>
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17c0-3 3-5 6-5s6 2 6 5" />
    </>
  ),
  settings: (
    <>
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" />
    </>
  ),
  // ── Zukunft: Weitere Icons ────────────────────────────────────────────
  // projects: (...),
  // orgs: (...),
  // admin: (...),
};

function NavIcon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name] || null}
    </svg>
  );
}

// ── Sidebar-Item ────────────────────────────────────────────────────────────
function SidebarItem({ item, isActive, onClick }) {
  return (
    <button
      className={`sidebar-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
    >
      <NavIcon name={item.icon} />
      <span className="sidebar-item-label">{item.label}</span>
    </button>
  );
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────
export default function DesktopSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout } = useAuth();

  // Active-State: Match exakt oder Prefix (z.B. /profile/me → /profile/me)
  function isItemActive(route) {
    if (location.pathname === route) return true;
    // /profile/me soll aktiv sein, wenn man auf /profile/me ist
    // /profile/:username soll NICHT /profile/me aktivieren
    if (route === '/profile/me' && location.pathname === '/profile/me') return true;
    return false;
  }

  function handleNavClick(route) {
    navigate(route);
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (e) {
      console.error('[HUI Web] Logout error:', e);
    }
  }

  return (
    <aside className="desktop-sidebar">
      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div className="sidebar-logo">
        <HUILogo size={32} />
        <span
          className="sidebar-item-label"
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#141422',
            letterSpacing: '-0.02em',
          }}
        >
          HUI
        </span>
      </div>

      {/* ── Navigation Sections ──────────────────────────────────────── */}
      {DESKTOP_NAV_SECTIONS.map((section) => (
        <div key={section.id} className="sidebar-section">
          {section.label && (
            <div className="sidebar-section-label">{section.label}</div>
          )}
          {section.items.map((item) => (
            <SidebarItem
              key={item.key}
              item={item}
              isActive={isItemActive(item.route)}
              onClick={() => handleNavClick(item.route)}
            />
          ))}
        </div>
      ))}

      {/* ── Divider ──────────────────────────────────────────────────── */}
      <div className="sidebar-divider" />

      {/* ── User Info & Logout ──────────────────────────────────────── */}
      <div className="sidebar-user">
        <div
          className="sidebar-user-info"
          onClick={() => navigate('/profile/me')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/profile/me');
            }
          }}
        >
          {profile?.avatar_url ? (
            <img
              className="sidebar-user-avatar"
              src={profile.avatar_url}
              alt=""
            />
          ) : (
            <div
              className="sidebar-user-avatar"
              style={{
                background: '#E6FAF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#09A89A',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {(profile?.display_name || profile?.username || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <div className="sidebar-user-name">
              {profile?.display_name || profile?.username || 'HUI Mitglied'}
            </div>
            <div className="sidebar-user-handle">
              {profile?.username ? `@${profile.username}` : 'Profil ansehen'}
            </div>
          </div>
        </div>

        <button
          className="sidebar-item"
          onClick={handleLogout}
          style={{ marginTop: 4 }}
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
            <path d="M7 4H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M14 7l3 3-3 3M17 10H8" />
          </svg>
          <span className="sidebar-item-label">Abmelden</span>
        </button>
      </div>
    </aside>
  );
}
