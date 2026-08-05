// ══════════════════════════════════════════════════════════════════════════════
// DesktopMissionControl.jsx — HUI Desktop Mission Control
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Ruht ÜBER dem Feed. Zeigt in 4 ruhigen Bereichen, was heute möglich ist,
//   was der Nutzer als Nächstes tun kann, welche Resonanz entstanden ist
//   und welche Schnellaktionen verfügbar sind.
//
// DATEN:
//   Alle Daten kommen aus useDesktopData() — kein eigener Supabase-Aufruf.
//   Keine Mockdaten. Keine Duplikate.
//
// DESIGN:
//   Ruhig. Warm. Menschlich. Keine Dashboards, keine Charts, keine Balken.
//   Vier sanfte Karten in einem 2×2 Grid, mit weichen Schatten und großzügigem
//   Whitespace. Jede Karte hat einen Titel, ein Icon und 2-3 Items.
//
// PERFORMANCE:
//   - Rendert erst NACH dem Feed (Suspense/deferred).
//   - Keine Blockierung des Feed-Renderings.
//   - useDesktopData lädt lazy im Hintergrund.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesktopData } from './DesktopDataContext.jsx';

// ── Sub-Komponenten ────────────────────────────────────────────────────────────

// Sanfte Section-Karte
function ControlCard({ title, icon, children, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <section
      className="mc-card desktop-hover-card"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 350ms cubic-bezier(0.16,1,0.30,1), transform 350ms cubic-bezier(0.16,1,0.30,1)',
      }}
    >
      <div className="mc-card-header">
        <span className="mc-card-icon">{icon}</span>
        <h3 className="mc-card-title">{title}</h3>
      </div>
      <div className="mc-card-body">
        {children}
      </div>
    </section>
  );
}

// Einzelnes Item in einer Control-Karte
function ControlItem({ label, sublabel, onClick, accent }) {
  return (
    <button className="mc-item" onClick={onClick}>
      <span className="mc-item-dot" style={accent ? { background: accent } : undefined} />
      <div className="mc-item-text">
        <span className="mc-item-label">{label}</span>
        {sublabel && <span className="mc-item-sub">{sublabel}</span>}
      </div>
      <svg className="mc-item-arrow" width="16" height="16" viewBox="0 0 20 20" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 5l5 5-5 5" />
      </svg>
    </button>
  );
}

// Loading Placeholder
function ControlLoading({ lines = 2 }) {
  return (
    <div className="mc-loading">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="mc-loading-line" style={{ width: `${70 + i * 10}%` }} />
      ))}
    </div>
  );
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────
export default function DesktopMissionControl() {
  const navigate = useNavigate();
  const { discover, bookings, activity, notifCount, profile } = useDesktopData();

  // ── "Heute möglich" — aus discover.works + discover.talents ─────────────────
  const heuteItems = [
    ...(discover.works || []).slice(0, 2).map(w => ({
      label: w.title || 'Neues Werk',
      sub:   w.display_name ? `von ${w.display_name}` : '',
      onClick: () => navigate(`/work/${w.id}`),
      accent: '#0EC4B8',
    })),
    ...(discover.talents || []).slice(0, 1).map(t => ({
      label: t.talent || 'Neues Talent',
      sub:   t.display_name ? `von ${t.display_name}` : '',
      onClick: () => navigate(`/profile/${t.username || t.id}`),
      accent: '#F47355',
    })),
  ].slice(0, 3);

  // ── "Mein nächster Schritt" — aus bookings ────────────────────────────────
  const nextSteps = [
    ...(bookings.asCustomer || []).filter(b => b.status === 'pending').slice(0, 1).map(b => ({
      label: 'Buchungsanfrage offen',
      sub:   b.talents?.title || 'Talent-Buchung',
      onClick: () => navigate('/studio'),
      accent: '#F47355',
    })),
    ...(bookings.asSeller || []).filter(b => b.status === 'pending').slice(0, 1).map(b => ({
      label: 'Neue Buchungsanfrage',
      sub:   b.talents?.title || 'Talent-Buchung',
      onClick: () => navigate('/studio'),
      accent: '#F47355',
    })),
    ...(notifCount > 0 ? [{
      label: `${notifCount} neue Benachrichtigung${notifCount > 1 ? 'en' : ''}`,
      sub:   'Resonanz auf deine Inhalte',
      onClick: () => {}, // Placeholder — wird durch Panel ersetzt
      accent: '#0EC4B8',
    }] : []),
  ].slice(0, 3);

  // Fallback wenn keine nächsten Schritte
  const nextStepsFinal = nextSteps.length > 0 ? nextSteps : [
    { label: 'Alles erledigt', sub: 'Keine offenen Aktionen', onClick: () => {}, accent: '#5CA87A' },
  ];

  // ── "Resonanz" — aus activity.items ────────────────────────────────────────
  const resonanzItems = (activity.items || []).slice(0, 3).map(item => ({
    label: item.label || item.title || 'Aktivität',
    sub:   item.time_ago || '',
    onClick: () => {},
    accent: '#0EC4B8',
  }));

  // ── "Schnellaktionen" — statisch, nutzen hui.navigator ──────────────────────
  const quickActions = [
    { label: 'Werk erstellen', sub: 'Neues Werk veröffentlichen', onClick: () => navigate('/studio'), accent: '#0EC4B8' },
    { label: 'Moment teilen', sub: 'Einen Moment festhalten', onClick: () => navigate('/studio'), accent: '#F47355' },
    { label: 'Projekt unterstützen', sub: 'Impact schaffen', onClick: () => navigate('/impact'), accent: '#5CA87A' },
    { label: 'Erlebnis anbieten', sub: 'Termin öffnen', onClick: () => navigate('/studio'), accent: '#0EC4B8' },
  ];

  return (
    <div className="mc-container desktop-page-enter">
      {/* ── Begrüßung ──────────────────────────────────────────────── */}
      <div className="mc-greeting">
        <h2 className="mc-greeting-title">
          {greeting()}, {profile?.display_name?.split(' ')[0] || profile?.username || 'Willkommen'}
        </h2>
        <p className="mc-greeting-sub">
          {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* ── 2×2 Grid ──────────────────────────────────────────────── */}
      <div className="mc-grid">
        {/* ── Heute möglich ──────────────────────────────────────── */}
        <ControlCard
          title="Heute möglich"
          delay={0}
          icon={
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10" cy="10" r="7" />
              <path d="M10 6v4l2 2" />
            </svg>
          }
        >
          {discover.loading ? <ControlLoading lines={3} /> : (
            heuteItems.length > 0 ? heuteItems.map((item, i) => (
              <ControlItem key={i} {...item} />
            )) : (
              <p className="mc-empty">Aktuell keine neuen Werke oder Talente.</p>
            )
          )}
        </ControlCard>

        {/* ── Mein nächster Schritt ──────────────────────────────── */}
        <ControlCard
          title="Mein nächster Schritt"
          delay={70}
          icon={
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 10l3 3 7-7" />
            </svg>
          }
        >
          {bookings.loading ? <ControlLoading lines={2} /> : (
            nextStepsFinal.map((item, i) => (
              <ControlItem key={i} {...item} />
            ))
          )}
        </ControlCard>

        {/* ── Resonanz ────────────────────────────────────────────── */}
        <ControlCard
          title="Resonanz"
          delay={140}
          icon={
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10c0-3 3-5 7-5s7 2 7 5-3 5-7 5c-1 0-2 0-3-.5L4 16l.5-2.5C3.5 12.5 3 11.5 3 10z" />
            </svg>
          }
        >
          {activity.loading ? <ControlLoading lines={3} /> : (
            resonanzItems.length > 0 ? resonanzItems.map((item, i) => (
              <ControlItem key={i} {...item} />
            )) : (
              <p className="mc-empty">Noch keine Resonanz heute. <br/>Erstelle ein Werk oder teile einen Moment.</p>
            )
          )}
        </ControlCard>

        {/* ── Schnellaktionen ────────────────────────────────────── */}
        <ControlCard
          title="Schnellaktionen"
          delay={210}
          icon={
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 4v12M4 10h12" />
            </svg>
          }
        >
          {quickActions.map((item, i) => (
            <ControlItem key={i} {...item} />
          ))}
        </ControlCard>
      </div>
    </div>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Guten Morgen';
  if (h < 17) return 'Guten Tag';
  if (h < 22) return 'Guten Abend';
  return 'Hallo';
}
