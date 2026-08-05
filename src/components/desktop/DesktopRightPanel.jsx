// ══════════════════════════════════════════════════════════════════════════════
// DesktopRightPanel.jsx — HUI Desktop Wirkungsraum (Phase 1)
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Rechter Panel der Desktop-Shell. "Wirkungsraum".
//   Zeigt: Impact, Resonanz, Möglichkeiten, Termine, Entwürfe.
//   Ruhig. Warm. Menschlich. Nicht überladen.
//
// DATEN:
//   Alle Daten aus useDesktopData() — kein eigener Supabase-Aufruf.
//   Shared mit Mission Control — keine doppelten Queries.
//
// DESIGN:
//   Vertikale Sektionen mit großzügigem Abstand. Keine Boxen um jede Sektion —
//   der Whitespace trennt. Sanfte Divider. Dezente Typografie.
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesktopData } from './DesktopDataContext.jsx';

// ── Sektion ──────────────────────────────────────────────────────────────────
function PanelSection({ title, children }) {
  return (
    <div className="drp-section">
      <h4 className="drp-section-title">{title}</h4>
      {children}
    </div>
  );
}

// ── Impact-Zahl ──────────────────────────────────────────────────────────────
function ImpactStat({ value, label }) {
  return (
    <div className="drp-impact">
      <span className="drp-impact-value">{value}</span>
      <span className="drp-impact-label">{label}</span>
    </div>
  );
}

// ── Loading ──────────────────────────────────────────────────────────────────
function PanelLoading({ lines = 2 }) {
  return (
    <div className="drp-loading">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="drp-loading-line" style={{ width: `${60 + i * 15}%` }} />
      ))}
    </div>
  );
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────
export default function DesktopRightPanel() {
  const navigate = useNavigate();
  const { impact, activity, bookings, discover, notifCount } = useDesktopData();

  // ── Bevorstehende Termine ──────────────────────────────────────────────────
  const upcomingBookings = (bookings.asCustomer || [])
    .filter(b => b.status === 'confirmed' || b.status === 'pending')
    .filter(b => {
      if (!b.selected_date) return false;
      const d = new Date(b.selected_date);
      return d >= new Date() && d <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    })
    .slice(0, 3);

  return (
    <aside className="desktop-right-panel" aria-label="Wirkungsraum">
      <div className="desktop-right-panel-inner">

        {/* ── Mein Impact ──────────────────────────────────────────── */}
        <PanelSection title="Mein Impact">
          {impact.loading ? <PanelLoading lines={1} /> : (
            <ImpactStat
              value={impact.fmtTotal || '€0.00'}
              label="Beitrag zum Impact-Pool diesen Monat"
            />
          )}
          <button
            className="drp-link"
            onClick={() => navigate('/impact')}
          >
            Impact ansehen →
          </button>
        </PanelSection>

        {/* ── Persönliche Resonanz ──────────────────────────────────── */}
        <PanelSection title="Resonanz">
          {activity.loading ? <PanelLoading lines={2} /> : (
            (activity.items || []).length > 0 ? (
              <div className="drp-activity-list">
                {(activity.items || []).slice(0, 4).map((item, i) => (
                  <div key={i} className="drp-activity-item">
                    <span className="drp-activity-dot" />
                    <div>
                      <span className="drp-activity-text">{item.label || item.title || 'Aktivität'}</span>
                      {item.time_ago && <span className="drp-activity-time">{item.time_ago}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="drp-empty">Noch keine Resonanz heute.</p>
            )
          )}
          {notifCount > 0 && (
            <button className="drp-link" onClick={() => {}}>
              {notifCount} neue Benachrichtigung{notifCount > 1 ? 'en' : ''} →
            </button>
          )}
        </PanelSection>

        {/* ── Bevorstehende Termine ────────────────────────────────── */}
        <PanelSection title="Bevorstehende Termine">
          {bookings.loading ? <PanelLoading lines={2} /> : (
            upcomingBookings.length > 0 ? (
              <div className="drp-booking-list">
                {upcomingBookings.map((b, i) => (
                  <div key={i} className="drp-booking-item">
                    <div className="drp-booking-date">
                      {b.selected_date && new Date(b.selected_date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                    </div>
                    <div>
                      <span className="drp-booking-title">{b.talents?.title || 'Buchung'}</span>
                      {b.selected_time_slot && <span className="drp-booking-time">{b.selected_time_slot}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="drp-empty">Keine Termine in den nächsten 2 Wochen.</p>
            )
          )}
        </PanelSection>

        {/* ── Möglichkeiten ────────────────────────────────────────── */}
        <PanelSection title="Möglichkeiten">
          {discover.loading ? <PanelLoading lines={2} /> : (
            (discover.works || []).length > 0 ? (
              <div className="drp-discover-list">
                {(discover.works || []).slice(0, 2).map((w, i) => (
                  <button
                    key={i}
                    className="drp-discover-item"
                    onClick={() => navigate(`/work/${w.id}`)}
                  >
                    <span className="drp-discover-title">{w.title || 'Werk'}</span>
                    {w.display_name && <span className="drp-discover-sub">{w.display_name}</span>}
                  </button>
                ))}
              </div>
            ) : (
              <p className="drp-empty">Aktuell keine neuen Werke.</p>
            )
          )}
          <button className="drp-link" onClick={() => navigate('/discover')}>
            Mehr entdecken →
          </button>
        </PanelSection>

      </div>
    </aside>
  );
}
