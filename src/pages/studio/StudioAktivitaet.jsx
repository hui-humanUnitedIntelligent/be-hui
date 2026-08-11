// ══════════════════════════════════════════════════════════════════════════════
// StudioAktivitaet.jsx — HUI V7.5 — Ruhige Chronik der letzten Aktivitäten
// ══════════════════════════════════════════════════════════════════════════════
//
// Zweck: Kein KPI-Dashboard. Eine ruhige Chronik der letzten Veränderungen.
//        Zeigt Freischaltungen, Projektfreigaben, Verantwortungsänderungen, Meldungen.
//        Warm, chronologisch, menschlich.
//
// DATEN: Supabase (works, impact_applications, notifications, comment_reports)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { HUI } from "../../design/hui.design.js";

const C = {
  cream: HUI.COLOR.creamStudio, white: HUI.COLOR.white, ink: HUI.COLOR.inkStudio,
  muted: 'rgba(80,80,80,0.55)', teal: HUI.COLOR.tealStudio, coral: HUI.COLOR.coralStudio,
  border: 'rgba(0,0,0,0.06)',
};

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`;
  if (hours > 0) return `vor ${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}`;
  const mins = Math.floor(diff / 60000);
  if (mins > 0) return `vor ${mins} ${mins === 1 ? 'Minute' : 'Minuten'}`;
  return 'gerade eben';
}

export default function StudioAktivitaet() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [
        worksRes, projectsRes, notifRes, reportsRes
      ] = await Promise.all([
        supabase.from('works')
          .select('id, title, status, published_at')
          .eq('status', 'published').not('published_at', 'is', null)
          .order('published_at', { ascending: false }).limit(10),
        supabase.from('impact_applications')
          .select('id, name, status, created_at')
          .eq('status', 'approved')
          .order('created_at', { ascending: false }).limit(10),
        supabase.from('notifications')
          .select('id, type, title, body, created_at')
          .in('type', ['responsibility_granted', 'responsibility_revoked'])
          .order('created_at', { ascending: false }).limit(10),
        supabase.from('comment_reports')
          .select('id, reason, status, created_at')
          .order('created_at', { ascending: false }).limit(10)
          .then(r => r, () => ({ data: [] })),
      ]);

      const all = [];

      (worksRes.data || []).forEach(w => all.push({
        type: 'Freigabe',
        label: w.title || 'Ohne Titel',
        date: w.published_at,
        color: C.teal,
      }));

      (projectsRes.data || []).forEach(p => all.push({
        type: 'Projekt',
        label: p.name || 'Ohne Titel',
        date: p.created_at,
        color: C.teal,
      }));

      (notifRes.data || []).forEach(n => all.push({
        type: 'Verantwortung',
        label: n.title || n.body || 'Veränderung',
        date: n.created_at,
        color: C.ink,
      }));

      (reportsRes.data || []).forEach(r => all.push({
        type: 'Meldung',
        label: r.reason || 'Kommentar-Meldung',
        date: r.created_at,
        color: C.coral,
      }));

      all.sort((a, b) => new Date(b.date) - new Date(a.date));
      setActivities(all.slice(0, 30));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={{
      padding: '40px 32px', maxWidth: 680,
      fontFamily: "Inter, sans-serif",
    }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, color: C.ink, marginBottom: 8 }}>
        Letzte Aktivitäten
      </h2>
      <p style={{ fontSize: 15, color: C.muted, marginBottom: 32 }}>
        Eine ruhige Chronik der letzten Veränderungen.
      </p>

      {loading ? (
        <p style={{ color: C.muted, fontSize: 14 }}>Lade Aktivitäten…</p>
      ) : activities.length === 0 ? (
        <p style={{ color: C.muted, fontSize: 14 }}>Noch keine Aktivitäten erfasst.</p>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 20 }}>
          {/* Timeline line */}
          <div style={{
            position: 'absolute', left: 5, top: 0, bottom: 0, width: 1,
            background: C.border,
          }} />

          {/* Entries */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {activities.map((a, i) => (
              <div key={i} style={{ position: 'relative' }}>
                {/* Dot */}
                <div style={{
                  position: 'absolute', left: -20, top: 6, width: 11, height: 11,
                  borderRadius: '50%', background: a.color,
                  border: `2px solid ${C.cream}`,
                }} />
                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2,
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: a.color,
                      textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>{a.type}</span>
                  </div>
                  <div style={{ fontSize: 14, color: C.ink, marginBottom: 2 }}>
                    {a.label}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    {relativeTime(a.date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
