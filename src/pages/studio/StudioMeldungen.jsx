// ══════════════════════════════════════════════════════════════════════════════
// StudioMeldungen.jsx — HUI V7.5 — Meldungen im Entwicklungszentrum
// ══════════════════════════════════════════════════════════════════════════════
//
// Zweck: Moderationsfälle — Kommentar-Meldungen und Inhaltsmeldungen.
//        Warme, ruhige Oberfläche. Logik aus Admin.jsx übernommen.
//
// DATEN: Supabase (comment_reports, notifications)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { formatNumberDE } from "../../lib/formatters.js";
import { HUI } from "../../design/hui.design.js";

const C = {
  cream: HUI.COLOR.creamStudio, white: HUI.COLOR.white, ink: HUI.COLOR.inkStudio,
  muted: 'rgba(80,80,80,0.55)', teal: HUI.COLOR.tealStudio, coral: HUI.COLOR.coralStudio,
  border: 'rgba(0,0,0,0.06)',
};

export default function StudioMeldungen() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comment_reports')
        .select('id, comment_id, reporter_id, reason, status, created_at, comment:comments(id, content, author_id, author:profiles!comments_author_id_fkey(id, display_name, username))')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setReports(data || []);
    } catch {
      // Tabelle existiert evtl. noch nicht
      setReports([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markReviewed(reportId) {
    setBusy(reportId);
    const { error } = await supabase
      .from('comment_reports')
      .update({ status: 'reviewed', reviewed_at: new Date().toISOString() })
      .eq('id', reportId);
    if (error) {
      setToast({ text: 'Aktion fehlgeschlagen.', type: 'error' });
    } else {
      setToast({ text: 'Meldung als überprüft markiert.', type: 'success' });
      setReports(prev => prev.filter(r => r.id !== reportId));
    }
    setBusy(null);
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div style={{
      padding: '40px 32px', maxWidth: 680,
      fontFamily: "Inter, sans-serif",
    }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, color: C.ink, marginBottom: 8 }}>Meldungen</h2>
      <p style={{ fontSize: 15, color: C.muted, marginBottom: 24 }}>
        Kommentar-Meldungen und Moderationsfälle prüfen.
      </p>

      {loading ? (
        <p style={{ color: C.muted, fontSize: 14 }}>Lade Meldungen…</p>
      ) : reports.length === 0 ? (
        <div style={{
          padding: '24px', borderRadius: 16, background: C.white, border: `1px solid ${C.border}`,
          fontSize: 14, color: C.muted, textAlign: 'center',
        }}>Keine offenen Meldungen. Alles ist in Ordnung.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reports.map(r => (
            <div key={r.id} style={{
              padding: '16px', borderRadius: 14, background: C.white, border: `1px solid ${C.border}`,
            }}>
              {/* Grund */}
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 8 }}>
                Grund: {r.reason || 'Kein Grund angegeben'}
              </div>

              {/* Gemeldeter Kommentar */}
              {r.comment && (
                <div style={{
                  padding: '12px', borderRadius: 10, background: C.cream, marginBottom: 12,
                  fontSize: 13, color: C.ink,
                }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>
                    {r.comment.author?.display_name || r.comment.author?.username || 'Unbekannt'}
                  </div>
                  <div style={{ color: C.muted }}>{r.comment.content || 'Inhalt nicht verfügbar'}</div>
                </div>
              )}

              <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
                {formatNumberDE(new Date(r.created_at))}
              </div>

              {/* Aktionen */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => markReviewed(r.id)} disabled={busy === r.id}
                  style={{
                    padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: C.teal, color: '#fff', fontSize: 13, fontWeight: 600,
                    opacity: busy === r.id ? 0.6 : 1,
                  }}>Als überprüft markieren</button>
                <button
                  onClick={() => markReviewed(r.id)} disabled={busy === r.id}
                  style={{
                    padding: '8px 16px', borderRadius: 10, border: `1px solid ${C.border}`,
                    background: 'transparent', color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>Ignorieren</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          padding: '14px 24px', borderRadius: 12, zIndex: 100,
          background: toast.type === 'error' ? `${C.coral}15` : `${C.teal}15`,
          color: toast.type === 'error' ? C.coral : C.teal,
          fontSize: 14, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}>{toast.text}</div>
      )}
    </div>
  );
}
