// ══════════════════════════════════════════════════════════════════════════════
// DesktopMissionControl.jsx — HUI Desktop Morgen-Briefing (v2.0)
// ══════════════════════════════════════════════════════════════════════════════
//
// DESIGN v2.0:
//   Kein 2×2 Grid. Keine gleich großen Boxen. Kein Dashboard.
//   Ein fließendes Briefing — vertikal, kompakt, emotional.
//
//   Struktur:
//     Persönliche Begrüßung (groß, warm)
//     ── Heute möglich        (eine Zeile, max. 3 Items inline)
//     ── Dein nächster Schritt (eine Zeile, eine Handlung)
//     ── Deine aktuelle Wirkung (eine Zeile, ein Gefühl)
//     ── Drei Möglichkeiten    (inline, max. 3 Items)
//
//   Höhe: ~220px. Der Feed beginnt OHNE Scrollen sichtbar.
//
// DATEN:
//   Alle aus useDesktopData() — keine neuen Queries.
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesktopData } from './DesktopDataContext.jsx';

// ── Briefing-Zeile ────────────────────────────────────────────────────────────
function BriefingLine({ label, children }) {
  return (
    <div className="briefing-line">
      <span className="briefing-label">{label}</span>
      <div className="briefing-content">{children}</div>
    </div>
  );
}

// ── Inline-Item (klickbar) ────────────────────────────────────────────────────
function BriefingItem({ label, sub, onClick, accent }) {
  return (
    <button className="briefing-item" onClick={onClick}>
      {accent && <span className="briefing-item-dot" style={{ background: accent }} />}
      <span className="briefing-item-text">
        {label}
        {sub && <span className="briefing-item-sub">{sub}</span>}
      </span>
    </button>
  );
}

// ── Loading Shimmer ──────────────────────────────────────────────────────────
function BriefingShimmer() {
  return <div className="briefing-shimmer" />;
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────
export default function DesktopMissionControl() {
  const navigate = useNavigate();
  const { discover, bookings, activity, impact, notifCount, profile } = useDesktopData();

  // ── Heute möglich ──────────────────────────────────────────────────────────
  const heuteItems = [
    ...(discover.works || []).slice(0, 2).map(w => ({
      label: w.title || 'Neues Werk',
      sub:   w.display_name || '',
      onClick: () => navigate(`/work/${w.id}`),
      accent: '#0DC4B5',
    })),
    ...(discover.talents || []).slice(0, 1).map(t => ({
      label: t.talent || 'Neues Talent',
      sub:   t.display_name || '',
      onClick: () => navigate(`/profile/${t.username || t.id}`),
      accent: '#F47355',
    })),
  ].slice(0, 3);

  // ── Nächster Schritt ───────────────────────────────────────────────────────
  const nextStep = (() => {
    const pendingCustomer = (bookings.asCustomer || []).find(b => b.status === 'pending');
    const pendingSeller = (bookings.asSeller || []).find(b => b.status === 'pending');
    if (pendingCustomer) return { label: 'Buchungsanfrage offen', sub: pendingCustomer.talents?.title || '', onClick: () => navigate('/studio') };
    if (pendingSeller) return { label: 'Neue Buchungsanfrage erhalten', sub: pendingSeller.talents?.title || '', onClick: () => navigate('/studio') };
    if (notifCount > 0) return { label: `${notifCount} neue Benachrichtigung${notifCount > 1 ? 'en' : ''}`, sub: 'Schau rein', onClick: () => {} };
    return null;
  })();

  // ── Drei Möglichkeiten ──────────────────────────────────────────────────────
  const possibilities = [
    ...(discover.works || []).slice(2, 3).map(w => ({
      label: w.title || 'Werk',
      sub: w.display_name || '',
      onClick: () => navigate(`/work/${w.id}`),
    })),
    ...(discover.talents || []).slice(1, 2).map(t => ({
      label: t.talent || 'Talent',
      sub: t.display_name || '',
      onClick: () => navigate(`/profile/${t.username || t.id}`),
    })),
  ];
  // Fallback mit Schnellaktionen
  while (possibilities.length < 3) {
    const actions = [
      { label: 'Werk erstellen', sub: 'Teile etwas Neues', onClick: () => navigate('/studio') },
      { label: 'Projekt unterstützen', sub: 'Wirkung entfalten', onClick: () => navigate('/impact') },
    ];
    possibilities.push(actions[possibilities.length]);
  }

  return (
    <section className="briefing desktop-page-enter">
      {/* ── Begrüßung ──────────────────────────────────────────────── */}
      <div className="briefing-greeting">
        <h1 className="briefing-title">
          {greeting()}, {profile?.display_name?.split(' ')[0] || profile?.username || 'Willkommen'}
        </h1>
        <p className="briefing-date">
          {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* ── Briefing-Zeilen ────────────────────────────────────────── */}
      <div className="briefing-lines">
        <BriefingLine label="Heute möglich">
          {discover.loading ? <BriefingShimmer /> : (
            <div className="briefing-items-inline">
              {heuteItems.length > 0 ? heuteItems.map((item, i) => (
                <BriefingItem key={i} {...item} />
              )) : (
                <span className="briefing-empty">Aktuell keine neuen Werke oder Talente.</span>
              )}
            </div>
          )}
        </BriefingLine>

        <BriefingLine label="Dein nächster Schritt">
          {bookings.loading ? <BriefingShimmer /> : (
            nextStep ? (
              <BriefingItem {...nextStep} accent="#F47355" />
            ) : (
              <span className="briefing-empty">Alles erledigt — kein offener Schritt.</span>
            )
          )}
        </BriefingLine>

        <BriefingLine label="Deine aktuelle Wirkung">
          {impact.loading ? <BriefingShimmer /> : (
            <div className="briefing-impact">
              <span className="briefing-impact-value">{impact.fmtTotal || '€0.00'}</span>
              <span className="briefing-impact-label">im Impact-Pool diesen Monat</span>
            </div>
          )}
        </BriefingLine>

        <BriefingLine label="Drei Möglichkeiten">
          <div className="briefing-items-inline">
            {possibilities.map((item, i) => (
              <BriefingItem key={i} {...item} accent={i === 0 ? '#0DC4B5' : i === 1 ? '#F47355' : '#5CA87A'} />
            ))}
          </div>
        </BriefingLine>
      </div>
    </section>
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
