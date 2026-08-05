// ══════════════════════════════════════════════════════════════════════════════
// DesktopStudio.jsx — HUI Desktop Studio Workspace (Phase 3 — Vollständig)
// ══════════════════════════════════════════════════════════════════════════════
//
// Kein Wrapper mehr. Echter Desktop-Workspace.
//
// Links (220px, sticky):
//   Werke & Inhalte, Zusammenarbeit, Verfügbarkeit,
//   Reichweite, Einnahmen, Vertrauen, Impact,
//   Support, Einstellungen
//
// Mitte:
//   Arbeitsbereich — rendert die jeweilige SubPage
//
// DATEN:
//   Gleiche Imports wie CreatorStudio (StudioSubPages)
//   useCreatorBookings, useAppState — gleiche Hooks wie Mobile
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';
import { useAppState } from '../../lib/AppStateContext.jsx';
import { useCreatorBookings } from '../../lib/bookingContext.js';

// SubPages — gleiche wie Mobile (1:1)
import {
  AnalyticsPage, EinnahmenPage, VerfuegbarkeitPage,
  ImpactSubPage, KontoPage, MeineInhaltePage,
  BestellungenPage, ReputationInsightsPage,
} from '../../pages/studio/StudioSubPages';
import SupportPage from '../../pages/studio/SupportPage.jsx';

// ── Icon ──────────────────────────────────────────────────────────────────────
function StudioIcon({ name, size = 18 }) {
  const paths = {
    content:     <><rect x="3" y="3" width="14" height="14" rx="2" /><path d="M3 8h14M7 3v5" /></>,
    orders:      <><circle cx="10" cy="10" r="7" /><path d="M7 10l2 2 4-4" /></>,
    availability:<><rect x="3" y="5" width="14" height="12" rx="2" /><path d="M3 9h14M7 5v3" /></>,
    analytics:   <><path d="M3 17l4-6 4 3 6-8" /></>,
    earnings:    <><circle cx="10" cy="10" r="7" /><path d="M10 6v8M8 8h3a1.5 1.5 0 0 1 0 3H8M8 11h4" /></>,
    reputation:  <path d="M10 3l2.5 5.5L18 9l-4 4 1 5.5L10 15l-5 3.5 1-5.5-4-4 5.5-.5z" />,
    impact:      <path d="M10 2v6l4 2-4 8v-6l-4-2 4-8z" />,
    support:     <><circle cx="10" cy="10" r="7" /><path d="M8 8a2 2 0 1 1 4 0c0 1-2 2-2 2M10 14h.01" /></>,
    settings:    <><circle cx="10" cy="10" r="2.5" /><path d="M10 2v2M10 16v2M2 10h2M16 10h2" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
  );
}

// ── Navigation Groups ────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Werkzeug',
    items: [
      { key: 'content',      icon: 'content',      label: 'Werke & Inhalte' },
      { key: 'orders',       icon: 'orders',       label: 'Zusammenarbeit' },
      { key: 'availability', icon: 'availability', label: 'Verfügbarkeit' },
    ],
  },
  {
    label: 'Deine Wirkung',
    items: [
      { key: 'analytics',    icon: 'analytics',    label: 'Reichweite' },
      { key: 'earnings',     icon: 'earnings',     label: 'Einnahmen' },
      { key: 'reputation',   icon: 'reputation',   label: 'Vertrauen' },
      { key: 'impact',       icon: 'impact',       label: 'Impact' },
    ],
  },
  {
    label: 'Persönliches',
    items: [
      { key: 'support',      icon: 'support',      label: 'Support' },
      { key: 'settings',     icon: 'settings',     label: 'Einstellungen' },
    ],
  },
];

// ── SubPage Renderer ─────────────────────────────────────────────────────────
function renderSubPage(activeTool, handleBack) {
  const map = {
    content:      () => <MeineInhaltePage        onBack={handleBack} />,
    orders:       () => <BestellungenPage        onBack={handleBack} />,
    availability: () => <VerfuegbarkeitPage      onBack={handleBack} />,
    analytics:    () => <AnalyticsPage           onBack={handleBack} />,
    earnings:     () => <EinnahmenPage           onBack={handleBack} />,
    reputation:   () => <ReputationInsightsPage   onBack={handleBack} />,
    impact:       () => <ImpactSubPage           onBack={handleBack} />,
    support:      () => <SupportPage             onBack={handleBack} />,
    settings:     () => <KontoPage               onBack={handleBack} />,
  };
  const SubPage = map[activeTool];
  return SubPage ? <SubPage /> : null;
}

// ── Hauptkomponente ─═══════════════════════════════════════════════════════════
export default function DesktopStudio() {
  const navigate = useNavigate();
  const { section } = useParams();
  const { user } = useAuth();
  const { ownWorks } = useAppState();
  const { grouped: bookingGroups } = useCreatorBookings();

  const [activeTool, setActiveTool] = useState(section || 'content');

  // Sync with URL section
  useEffect(() => {
    if (section) setActiveTool(section);
  }, [section]);

  const pendingCount = bookingGroups.pending?.length || 0;

  function handleBack() {
    setActiveTool(null);
    navigate('/studio');
  }

  return (
    <div className="desktop-studio">
      {/* ── Left: Subnavigation ───────────────────────────────────── */}
      <aside className="ds-nav">
        <div className="ds-nav-sticky">
          {/* Header */}
          <div className="ds-nav-header">
            <h2 className="ds-nav-title">Studio</h2>
          </div>

          {/* Nav Groups */}
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="ds-nav-group">
              <div className="ds-nav-group-label">{group.label}</div>
              {group.items.map(item => (
                <button
                  key={item.key}
                  className={`ds-nav-item ${activeTool === item.key ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTool(item.key);
                    navigate(`/studio/${item.key === 'content' ? '' : item.key}`);
                  }}
                >
                  <StudioIcon name={item.icon} />
                  <span className="ds-nav-item-label">{item.label}</span>
                  {item.key === 'orders' && pendingCount > 0 && (
                    <span className="ds-nav-badge">{pendingCount}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* ── Center: Working Area ──────────────────────────────────── */}
      <div className="ds-workspace">
        {activeTool && activeTool !== 'content' ? (
          renderSubPage(activeTool, handleBack)
        ) : (
          <MeineInhaltePage onBack={handleBack} />
        )}
      </div>
    </div>
  );
}
