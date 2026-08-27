// ══════════════════════════════════════════════════════════════════════════════
import { PerfProfiler, usePerfMount } from './perf-instrument.js';
// DesktopRightPanel.jsx — HUI Desktop V3 — Mein Wirkungsraum
// ══════════════════════════════════════════════════════════════════════════════
//
// KEINE Widget-Sammlung. KEINE Kästen. Nur Typografie, Linien, Weißraum.
//
// Aufbau:
//   MEIN IMPACT — Zahl + Veränderung
//   AKTUELLE RESONANZ — letzte Aktivitäten
//   HEUTE MÖGLICH — Vorschau (Werke/Erlebnisse)
//   TERMINE — bevorstehende Buchungen
//   PERSÖNLICHER PULS — ruhiger Statussatz
//
// DATEN: useDesktopData() — bereits geladen, keine neuen Queries.
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesktopData } from './DesktopDataContext.jsx';
import { formatDateDE } from "../../lib/formatters.js";
import { useTranslation } from "../../hooks/useTranslation.js";

function Divider() {
  return <div className="wr-divider" />;
}

function Shimmer({ w = '60%' }) {
  return <div className="v3-shimmer" style={{ width: w }} />;
}

function formatDate(iso) {
  if (!iso) return '';
  return formatDateDE(new Date(iso), { weekday: 'long', day: 'numeric', month: 'short' });
}

export default function DesktopRightPanel() {
  const { t } = useTranslation();
  usePerfMount('DesktopRightPanel');
  const navigate = useNavigate();
  const { impact, activity, discover, bookings } = useDesktopData();

  const upcoming = [...(bookings.asCustomer || []), ...(bookings.asSeller || [])]
    .filter(b => (b.status === 'confirmed' || b.status === 'pending' || b.status === 'accepted'))
    .filter(b => b.selected_date && new Date(b.selected_date) >= new Date())
    .sort((a, b) => new Date(a.selected_date) - new Date(b.selected_date))
    .slice(0, 3);

  const recentItems = (activity.items || []).slice(0, 3);
  const previewWorks = (discover.works || []).slice(0, 3);

  // {t("desk.personalPulse")} — ehrlich formuliert, nur aus echten Daten
  const openCount = upcoming.length + (bookings.asCustomer || []).filter(b => b.status === 'pending').length;
  const pulseText = openCount === 0
    ? 'Alles ruhig.'
    : openCount === 1
      ? 'Heute steht eine Sache an.'
      : `Heute stehen ${openCount} Dinge an.`;

  return (
    <PerfProfiler id="DesktopRightPanel">
    <aside className="hui-rightpanel">
      <div className="wr-inner">

        {/* ── Mein Impact ──────────────────────────────────────────── */}
        <section className="wr-section">
          <h4 className="wr-label">Mein Impact</h4>
          {impact.loading ? <Shimmer w="50%" /> : (
            <>
              <div className="wr-impact-value">{impact.fmtTotal || '€0.00'}</div>
              <p className="wr-impact-sub">Gemeinsam bewegt.</p>
            </>
          )}
          <button className="wr-link" onClick={() => navigate('/impact')}>Impact ansehen →</button>
        </section>

        <Divider />

        {/* ── Aktuelle Resonanz ────────────────────────────────────── */}
        <section className="wr-section">
          <h4 className="wr-label">Aktuelle Resonanz</h4>
          {activity.loading ? <><Shimmer /><Shimmer w="70%" /></> : (
            recentItems.length > 0 ? (
              <div className="wr-list">
                {recentItems.map((item, i) => (
                  <p key={i} className="wr-text">{item.label || item.title || t("desk.newActivity")}</p>
                ))}
              </div>
            ) : <p className="wr-empty">Noch keine Resonanz heute.</p>
          )}
        </section>

        <Divider />

        {/* ── {t("desk.todayPossible")} ────────────────────────────────────────── */}
        <section className="wr-section">
          <h4 className="wr-label">Heute möglich</h4>
          {discover.loading ? <Shimmer /> : (
            previewWorks.length > 0 ? (
              <div className="wr-preview-row">
                {previewWorks.map((w, i) => (
                  <button key={i} className="wr-preview-thumb" onClick={() => navigate(`/work/${w.id}`)}>
                    {w.image_url || w.cover_url ? (
                      <img src={w.image_url || w.cover_url} alt="" />
                    ) : (
                      <div className="wr-preview-thumb-fallback" />
                    )}
                  </button>
                ))}
              </div>
            ) : <p className="wr-empty">Aktuell nichts Neues.</p>
          )}
          <button className="wr-link" onClick={() => navigate('/discover')}>Mehr entdecken →</button>
        </section>

        <Divider />

        {/* ── Termine ──────────────────────────────────────────────── */}
        <section className="wr-section">
          <h4 className="wr-label">Termine</h4>
          {bookings.loading ? <Shimmer /> : (
            upcoming.length > 0 ? (
              <div className="wr-list">
                {upcoming.map((b, i) => (
                  <div key={i} className="wr-term-item">
                    <span className="wr-term-date">{formatDate(b.selected_date)}</span>
                    <span className="wr-term-title">{b.talents?.title || b.title || 'Erlebnis'}</span>
                  </div>
                ))}
              </div>
            ) : <p className="wr-empty">Keine anstehenden Termine.</p>
          )}
        </section>

        <Divider />

        {/* ── Persönlicher Puls ────────────────────────────────────── */}
        <section className="wr-section">
          <h4 className="wr-label">Persönlicher Puls</h4>
          <p className="wr-pulse">{pulseText}</p>
        </section>

      </div>
    </aside>
    </PerfProfiler>
  );
}
