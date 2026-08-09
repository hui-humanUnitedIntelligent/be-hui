// ══════════════════════════════════════════════════════════════════════════════
// DesktopKalenderFlyout.jsx — HUI Desktop V3 — Kalender-Flyout
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Zeigt bevorstehende Termine (Buchungen) als Flyout — kein Fullscreen,
//   keine neue Seite.
//
// P0-OPTIMIERUNG (2026-08-05):
//   Nutzt useDesktopData() statt useTalentBookings() direkt.
//   DesktopDataContext lädt Buchungen bereits — kein doppelter Query.
//   Vorher: 2 Queries (customer + seller) zusätzlich zu DesktopDataContext.
//   Nachher: 0 zusätzliche Queries (daten kommen aus Context).
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useDesktopData } from './DesktopDataContext.jsx';
import { useEscapeKey } from './hooks/useEscapeKey.js';
import { formatDateDE } from "../../lib/formatters.js";

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return formatDateDE(d, { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function DesktopKalenderFlyout({ onClose }) {
  // P0: Buchungen aus DesktopDataContext (bereits geladen, kein doppelter Query)
  const { bookings } = useDesktopData();
  const { asCustomer, asSeller, loading } = bookings;

  useEscapeKey(onClose);

  const upcoming = [...(asCustomer || []), ...(asSeller || [])]
    .filter(b => (b.status === 'confirmed' || b.status === 'pending' || b.status === 'accepted'))
    .filter(b => b.selected_date && new Date(b.selected_date) >= new Date())
    .sort((a, b) => new Date(a.selected_date) - new Date(b.selected_date))
    .slice(0, 12);

  return (
    <>
      <div className="fly-backdrop" onClick={onClose} />
      <div className="fly-panel">
        <div className="fly-header">
          <h3>Kalender</h3>
          <button className="fly-close" onClick={onClose} aria-label="Schließen">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
        <div className="fly-list">
          {loading ? (
            <div className="fly-loading">
              <div className="v3-shimmer" style={{ width: '70%' }} />
              <div className="v3-shimmer" style={{ width: '50%' }} />
            </div>
          ) : upcoming.length === 0 ? (
            <div className="v3-empty"><p>Keine anstehenden Termine.</p></div>
          ) : (
            upcoming.map((b, i) => (
              <div key={b.id || i} className="fly-item">
                <div className="fly-item-date">{formatDate(b.selected_date)}</div>
                <div className="fly-item-title">{b.talents?.title || b.title || 'Erlebnis'}</div>
                {b.selected_time_slot && <div className="fly-item-time">{b.selected_time_slot}</div>}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
