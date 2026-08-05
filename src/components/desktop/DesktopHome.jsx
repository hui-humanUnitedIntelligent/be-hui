// ══════════════════════════════════════════════════════════════════════════════
// DesktopHome.jsx — HUI Desktop V3 — Der lebendige Raum
// ══════════════════════════════════════════════════════════════════════════════
//
// KEIN Mission Control. KEIN Dashboard. KEIN 2x2 Grid.
//
// Aufbau:
//   1. Ruhige Begrüßung + Datum
//   2. Fließendes Briefing — nur Typografie, Linien, Weißraum (keine Boxen)
//   3. Der Strom (Feed) — großzügige Karten
//
// DATEN: useDesktopData() (DesktopDataProvider, bereits in Shell aktiv)
// Keine neuen Queries — impact, activity, discover, bookings bereits geladen.
// ══════════════════════════════════════════════════════════════════════════════

import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';
import { useDesktopData } from './DesktopDataContext.jsx';

const UnifiedFeed = lazy(() => import('../../feed/UnifiedFeed.jsx'));

function FeedLoading() {
  return (
    <div className="feed-loading">
      <div className="feed-loading-spinner" />
    </div>
  );
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Gute Nacht';
  if (h < 11) return 'Guten Morgen';
  if (h < 17) return 'Guten Tag';
  if (h < 22) return 'Guten Abend';
  return 'Gute Nacht';
}

function formatToday() {
  return new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ── Briefing-Zeile ────────────────────────────────────────────────────────────
function BriefingLine({ label, children, delay }) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div className="brief-line" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(4px)' }}>
      <span className="brief-label">{label}</span>
      <div className="brief-content">{children}</div>
    </div>
  );
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────
export default function DesktopHome() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { impact, activity, discover, bookings } = useDesktopData();

  const firstName = (profile?.display_name || profile?.username || '').split(' ')[0] || '';

  // "Heute möglich" — aus discover + bookings, nur echte Daten
  const possibilities = [];
  (discover.works || []).slice(0, 1).forEach(w => {
    possibilities.push({ text: `${w.author_name || w.profile?.display_name || 'Jemand'} hat „${w.title}" veröffentlicht.`, action: () => navigate(`/work/${w.id}`) });
  });
  const pendingBooking = (bookings.asCustomer || []).find(b => b.status === 'pending');
  if (pendingBooking) {
    possibilities.push({ text: `Eine Buchungsanfrage wartet auf dich.`, action: () => navigate('/studio') });
  }

  // Resonanz — letzte Aktivität
  const recentActivity = (activity.items || [])[0];

  const hasBriefing = possibilities.length > 0 || recentActivity || (impact.fmtTotal && !impact.loading);

  return (
    <div className="hui-home">
      {/* ── Begrüßung ────────────────────────────────────────────── */}
      <div className="home-greeting">
        <h1>{timeGreeting()}{firstName ? `, ${firstName}` : ''} <span className="wave">👋</span></h1>
        <p className="home-date">{formatToday()}</p>
      </div>

      {/* ── Fließendes Briefing ──────────────────────────────────── */}
      {hasBriefing && (
        <div className="brief">
          {possibilities.length > 0 && (
            <BriefingLine label="Heute möglich" delay={0}>
              {possibilities.map((p, i) => (
                <button key={i} className="brief-item" onClick={p.action}>{p.text}</button>
              ))}
            </BriefingLine>
          )}

          {pendingBooking && (
            <BriefingLine label="Dein nächster Schritt" delay={80}>
              <button className="brief-item" onClick={() => navigate('/studio')}>
                Eine Buchungsanfrage wartet.
              </button>
            </BriefingLine>
          )}

          {recentActivity && (
            <BriefingLine label="Deine Resonanz" delay={160}>
              <span className="brief-item brief-item-static">
                {recentActivity.label || recentActivity.title || 'Es gibt neue Aktivität in deinem Umfeld.'}
              </span>
            </BriefingLine>
          )}

          {!impact.loading && impact.fmtTotal && (
            <BriefingLine label="Aktuelle Wirkung" delay={240}>
              <span className="brief-impact-value">{impact.fmtTotal}</span>
            </BriefingLine>
          )}
        </div>
      )}

      {/* ── Der Strom ────────────────────────────────────────────── */}
      <div className="stream-header">
        <h2>Der Strom</h2>
      </div>
      <div className="hui-feed">
        <Suspense fallback={<FeedLoading />}>
          <UnifiedFeed />
        </Suspense>
      </div>
    </div>
  );
}
