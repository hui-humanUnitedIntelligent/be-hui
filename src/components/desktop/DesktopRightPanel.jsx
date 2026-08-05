// ══════════════════════════════════════════════════════════════════════════════
// DesktopRightPanel.jsx — HUI Desktop Wirkungsraum (v2.0)
// ══════════════════════════════════════════════════════════════════════════════
//
// DESIGN v2.0:
//   Keine Boxen. Kein Dashboard. Ein ruhiger Begleiter.
//   Vertikale Sektionen, getrennt durch Weißraum und feine Linien.
//   Warm. Menschlich. Organisch.
//
//   Sektionen:
//     Mein Impact — große Zahl, warm
//     Resonanz — was lebt (live items)
//     Heute möglich — was entstanden ist
//     Nächste Termine — was kommt
//     Wirkungsentwicklung — wie es wächst (history)
//     Persönlicher Puls — wie du stehst
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesktopData } from './DesktopDataContext.jsx';

// ── Ruhige Sektion ────────────────────────────────────────────────────────────
function PanelSection({ title, children, delay = 0 }) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <section
      className="rp-section"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 400ms cubic-bezier(0.16,1,0.30,1), transform 400ms cubic-bezier(0.16,1,0.30,1)',
      }}
    >
      <h4 className="rp-label">{title}</h4>
      <div className="rp-body">{children}</div>
    </section>
  );
}

// ── Shimmer ──────────────────────────────────────────────────────────────────
function Shimmer({ w = '70%' }) {
  return <div className="rp-shimmer" style={{ width: w }} />;
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────
export default function DesktopRightPanel() {
  const navigate = useNavigate();
  const { impact, activity, bookings, discover, notifCount } = useDesktopData();

  // ── Bevorstehende Termine ──────────────────────────────────────────────────
  const upcoming = (bookings.asCustomer || [])
    .filter(b => b.status === 'confirmed' || b.status === 'pending')
    .filter(b => {
      if (!b.selected_date) return false;
      const d = new Date(b.selected_date);
      return d >= new Date() && d <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    })
    .slice(0, 3);

  // ── Wirkungsentwicklung (aus impact.history) ───────────────────────────────
  const historyItems = (impact.history || []).slice(0, 4).reverse();
  const hasGrowth = historyItems.length >= 2;

  // ── Persönlicher Puls ──────────────────────────────────────────────────────
  const pulseParts = [];
  if (notifCount > 0) pulseParts.push(`${notifCount} Benachrichtigung${notifCount > 1 ? 'en' : ''}`);
  if (upcoming.length > 0) pulseParts.push(`${upcoming.length} Termin${upcoming.length > 1 ? 'e' : ''}`);
  if ((activity.items || []).length > 0) pulseParts.push(`${(activity.items || []).length} Aktivitäten`);
  const pulseText = pulseParts.length > 0
    ? pulseParts.join(' · ')
    : 'Alles ruhig — nichts Offenes.';

  return (
    <aside className="desktop-right-panel" aria-label="Wirkungsraum">
      <div className="rp-inner">

        {/* ── Mein Impact ─────────────────────────────────────────────── */}
        <PanelSection title="Mein Impact" delay={0}>
          {impact.loading ? <Shimmer w="50%" /> : (
            <>
              <div className="rp-impact-value">{impact.fmtTotal || '€0.00'}</div>
              <div className="rp-impact-label">Beitrag zum Impact-Pool diesen Monat</div>
            </>
          )}
          <button className="rp-link" onClick={() => navigate('/impact')}>Impact ansehen →</button>
        </PanelSection>

        {/* ── Resonanz ────────────────────────────────────────────────── */}
        <PanelSection title="Resonanz" delay={80}>
          {activity.loading ? <><Shimmer /><Shimmer w="60%" /></> : (
            (activity.items || []).length > 0 ? (
              <div className="rp-resonance-list">
                {(activity.items || []).slice(0, 4).map((item, i) => (
                  <div key={i} className="rp-resonance-item">
                    <span className="rp-dot" />
                    <div className="rp-resonance-text">
                      <span className="rp-text">{item.label || item.title || 'Aktivität'}</span>
                      {item.time_ago && <span className="rp-time">{item.time_ago}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rp-empty">Noch keine Resonanz heute.</p>
            )
          )}
        </PanelSection>

        {/* ── Heute möglich ───────────────────────────────────────────── */}
        <PanelSection title="Heute möglich" delay={160}>
          {discover.loading ? <Shimmer /> : (
            (discover.works || []).length > 0 ? (
              <div className="rp-discover-list">
                {(discover.works || []).slice(0, 2).map((w, i) => (
                  <button key={i} className="rp-discover-item" onClick={() => navigate(`/work/${w.id}`)}>
                    <span className="rp-discover-title">{w.title || 'Werk'}</span>
                    {w.display_name && <span className="rp-discover-sub">{w.display_name}</span>}
                  </button>
                ))}
              </div>
            ) : (
              <p className="rp-empty">Aktuell keine neuen Werke.</p>
            )
          )}
        </PanelSection>

        {/* ── Nächste Termine ──────────────────────────────────────────── */}
        <PanelSection title="Nächste Termine" delay={240}>
          {bookings.loading ? <Shimmer /> : (
            upcoming.length > 0 ? (
              <div className="rp-booking-list">
                {upcoming.map((b, i) => (
                  <div key={i} className="rp-booking-item">
                    <div className="rp-booking-date">
                      {b.selected_date && new Date(b.selected_date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                    </div>
                    <div className="rp-booking-info">
                      <span className="rp-booking-title">{b.talents?.title || 'Buchung'}</span>
                      {b.selected_time_slot && <span className="rp-booking-time">{b.selected_time_slot}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rp-empty">Keine Termine in den nächsten 4 Wochen.</p>
            )
          )}
        </PanelSection>

        {/* ── Wirkungsentwicklung ──────────────────────────────────────── */}
        {hasGrowth && (
          <PanelSection title="Wirkungsentwicklung" delay={320}>
            <div className="rp-growth-list">
              {historyItems.map((h, i) => (
                <div key={i} className="rp-growth-item">
                  <span className="rp-growth-month">
                    {h.month ? new Date(h.month + '-01').toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }) : ''}
                  </span>
                  <span className="rp-growth-value">
                    €{((h.total_inflow_eur ?? 0)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </PanelSection>
        )}

        {/* ── Persönlicher Puls ────────────────────────────────────────── */}
        <PanelSection title="Persönlicher Puls" delay={400}>
          <p className="rp-pulse">{pulseText}</p>
        </PanelSection>

      </div>
    </aside>
  );
}
