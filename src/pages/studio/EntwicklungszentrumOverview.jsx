// ══════════════════════════════════════════════════════════════════════════════
// EntwicklungszentrumOverview.jsx — HUI V7.5 — Vertrauenszentrum Übersicht
// ══════════════════════════════════════════════════════════════════════════════
//
// Zweck: Menschliche Übersicht für das HUI-Team. Zeigt was Aufmerksamkeit
//        braucht — ohne technischen Charakter, ohne Dark Mode, ohne Dashboard-Look.
//        Warm, ruhig, wertschätzend.
//
// Architektur-Richtlinie: Wie StudioOverviewPage bewusst leichtgewichtig.
// Nur Status und Navigation. Keine Business-Logik.
//
// DATEN: Supabase (works, experiences, impact_applications, comment_reports, profiles)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient.js';

const C = {
  cream:   '#F9F7F4',
  white:   '#FFFFFF',
  ink:     '#1A1A1A',
  muted:   'rgba(80,80,80,0.55)',
  teal:    '#16D7C5',
  coral:   '#FF8A6B',
  border:  'rgba(0,0,0,0.06)',
};

export default function EntwicklungszentrumOverview({ onNavigate }) {
  const [counts, setCounts] = useState({
    pendingWorks: 0,
    pendingExperiences: 0,
    pendingProjects: 0,
    pendingTalentAntraege: 0,
    openReports: 0,
    totalMembers: 0,
    totalTalents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [
        worksPending, expPending, projPending,
        talentAntraege, reportsOpen, membersCount, talentsCount
      ] = await Promise.all([
        supabase.from('works').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
        supabase.from('experiences').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
        supabase.from('impact_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('type', 'talent_application').eq('is_read', false),
        supabase.from('comment_reports').select('id', { count: 'exact', head: true }).eq('status', 'open')
          .then(r => r, () => ({ count: 0 })),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_talent', true),
      ]);
      setCounts({
        pendingWorks: worksPending.count || 0,
        pendingExperiences: expPending.count || 0,
        pendingProjects: projPending.count || 0,
        pendingTalentAntraege: talentAntraege.count || 0,
        openReports: reportsOpen?.count || 0,
        totalMembers: membersCount.count || 0,
        totalTalents: talentsCount.count || 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  const totalPending = counts.pendingWorks + counts.pendingExperiences + counts.pendingProjects + counts.pendingTalentAntraege;

  return (
    <div style={{
      padding: '40px 32px', maxWidth: 680,
      fontFamily: "Inter, sans-serif",
    }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: C.ink, marginBottom: 8, lineHeight: 1.3 }}>
        Entwicklungszentrum
      </h1>
      <p style={{ fontSize: 15, color: C.muted, marginBottom: 32 }}>
        Du begleitest Menschen in ihrer Wirkung und Verantwortung.
      </p>

      {/* Was Aufmerksamkeit braucht */}
      {totalPending > 0 || counts.openReports > 0 ? (
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: C.muted,
            marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            Das braucht jetzt Aufmerksamkeit
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {totalPending > 0 && (
              <AttentionCard
                count={totalPending}
                label="Anträge und Inhalte warten auf Freigabe"
                onClick={() => onNavigate?.('begleitung')}
              />
            )}
            {counts.openReports > 0 && (
              <AttentionCard
                count={counts.openReports}
                label="Kommentar-Meldungen sind offen"
                onClick={() => onNavigate?.('meldungen')}
                accent="coral"
              />
            )}
          </div>
        </div>
      ) : (
        <div style={{
          padding: '20px', borderRadius: 16, background: C.white,
          border: `1px solid ${C.border}`, marginBottom: 32,
          fontSize: 14, color: C.muted, textAlign: 'center',
        }}>
          Alles ist erledigt. Danke für deine Sorgfalt.
        </div>
      )}

      {/* Menschen im Dachverband */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: C.muted,
          marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          Menschen im Dachverband
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <StatCard label="Mitglieder" value={loading ? '…' : counts.totalMembers} />
          <StatCard label="Talente" value={loading ? '…' : counts.totalTalents} />
        </div>
      </div>

      {/* Schnellzugriff */}
      <div>
        <div style={{
          fontSize: 13, fontWeight: 600, color: C.muted,
          marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          Schnellzugriff
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <QuickCard label="Menschen" hint="Begleiten und Verantwortungen vergeben" onClick={() => onNavigate?.('menschen')} />
          <QuickCard label="Begleitung" hint="Inhalte freigeben" onClick={() => onNavigate?.('begleitung')} />
          <QuickCard label="Meldungen" hint="Kommentare prüfen" onClick={() => onNavigate?.('meldungen')} />
        </div>
      </div>
    </div>
  );
}

function AttentionCard({ count, label, onClick, accent = 'teal' }) {
  const accentColor = accent === 'coral' ? C.coral : C.teal;
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 20px', borderRadius: 14,
        background: C.white, border: `1px solid ${C.border}`,
        cursor: 'pointer', textAlign: 'left', width: '100%',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      <span style={{
        width: 36, height: 36, borderRadius: '50%',
        background: `${accentColor}15`, color: accentColor,
        fontSize: 15, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {count}
      </span>
      <span style={{ fontSize: 14, color: C.ink }}>{label}</span>
    </button>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{
      padding: '20px', borderRadius: 14, background: C.white,
      border: `1px solid ${C.border}`,
    }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: C.ink, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, color: C.muted }}>{label}</div>
    </div>
  );
}

function QuickCard({ label, hint, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        padding: '16px', borderRadius: 14, background: C.white,
        border: `1px solid ${C.border}`, cursor: 'pointer', textAlign: 'left',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 4 }}>{label}</span>
      <span style={{ fontSize: 13, color: C.muted }}>{hint}</span>
    </button>
  );
}
