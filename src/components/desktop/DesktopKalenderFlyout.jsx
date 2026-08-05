// ══════════════════════════════════════════════════════════════════════════════
// DesktopKalenderFlyout.jsx — HUI Desktop V3 — Kalender-Flyout
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Zeigt bevorstehende Termine (Buchungen) als Flyout — kein Fullscreen,
//   keine neue Seite. Nutzt useTalentBookings (bestehender Hook, unverändert).
//
// Es wird KEIN neuer Kalender gebaut — nur eine kompakte Ansicht bestehender
// Buchungsdaten (asCustomer + asSeller).
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useAuth } from '../../lib/AuthContext.jsx';
import { useTalentBookings } from '../../hooks/useTalentBookings.js';
import { useEscapeKey } from './hooks/useEscapeKey.js';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function DesktopKalenderFlyout({ onClose }) {
  const { user } = useAuth();
  const { asCustomer, asSeller, loading } = useTalentBookings(user?.id);

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
