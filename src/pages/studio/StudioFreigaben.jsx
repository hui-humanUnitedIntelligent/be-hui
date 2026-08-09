// ══════════════════════════════════════════════════════════════════════════════
// StudioFreigaben.jsx — HUI V7.5 — Freigaben im Entwicklungszentrum
// ══════════════════════════════════════════════════════════════════════════════
//
// Zweck: Warteschlange für Talent-Anträge, Werke, Erlebnisse und Projekte — alle an einem Ort.
//        Warme, ruhige Oberfläche — kein technisches Dashboard.
//        Logik aus Admin.jsx übernommen, nicht dupliziert.
//
// DATEN: Supabase (works, experiences, impact_applications, notifications)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { formatDateDE } from "../../lib/formatters.js";

const C = {
  cream: '#F9F7F4', white: '#FFFFFF', ink: '#1A1A1A',
  muted: 'rgba(80,80,80,0.55)', teal: '#16D7C5', coral: '#FF8A6B',
  green: '#10B981', border: 'rgba(0,0,0,0.06)',
};

const TYPE_CFG = {
  werk: { label: 'Werk', table: 'works', pending: 'pending_review', approve: 'published', reject: 'rejected' },
  erlebnis: { label: 'Erlebnis', table: 'experiences', pending: 'pending_review', approve: 'published', reject: 'rejected' },
  projekt: { label: 'Projekt', table: 'impact_applications', pending: 'pending', approve: 'approved', reject: 'rejected' },
};

// V7.5 Phase 5: Talent-Anträge aus notifications (keine eigene Tabelle)
// ARL-01: is_talent wird HIER gesetzt (innerhalb des Entwicklungszentrums)
const TALENT_ANTRAG_TYPE = 'talent_application';

async function sendNotification(userId, type, title, body, actionUrl) {
  if (!userId) return;
  await supabase.from('notifications').insert({
    user_id: userId, type, title, body,
    action_url: actionUrl || null, is_read: false,
    created_at: new Date().toISOString(),
  });
}

export default function StudioFreigaben() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('pending');
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState(null);
  const [rejectItem, setRejectItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const results = [];
    for (const [key, cfg] of Object.entries(TYPE_CFG)) {
      const status = subTab === 'pending' ? cfg.pending
                   : subTab === 'approved' ? cfg.approve
                   : cfg.reject;
      const { data } = await supabase.from(cfg.table)
        .select('id, title, name, status, created_at, user_id, created_by')
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(50);
      (data || []).forEach(item => results.push({
        ...item, _type: key, _label: item.title || item.name || 'Ohne Titel',
      }));
    }

    // V7.5 Phase 5: Talent-Anträge aus notifications laden
    if (subTab === 'pending') {
      const { data: antraege } = await supabase
        .from('notifications')
        .select('id, title, body, created_at, actor_id, metadata')
        .eq('type', TALENT_ANTRAG_TYPE)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(50);
      (antraege || []).forEach(item => results.push({
        ...item,
        _type: 'talentantrag',
        _label: item.metadata?.applicant_name || 'Talent-Antrag',
        created_at: item.created_at,
      }));
    }
    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setItems(results);
    setLoading(false);
  }, [subTab]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(item) {
    if (item._type === 'talentantrag') {
      // V7.5 Phase 5: Talent-Antrag annehmen → is_talent = true (ARL-01: im Entwicklungszentrum)
      setBusy(item.id);
      const applicantId = item.actor_id || item.metadata?.applicant_id;
      if (applicantId) {
        const { error } = await supabase
          .from('profiles')
          .update({ is_talent: true, role: 'talent', has_talent_profile: true, updated_at: new Date().toISOString() })
          .eq('id', applicantId);
        if (error) {
          setToast({ text: 'Freigabe fehlgeschlagen.', type: 'error' });
        } else {
          await sendNotification(applicantId, 'responsibility_granted',
            'Du hast die Talent-Verantwortung erhalten',
            'Das Team hat dein Angebot angenommen. Willkommen als Talent bei HUI. Dein Studio steht dir jetzt offen.',
            '/studio');
          // Notification als gelesen markieren
          await supabase.from('notifications').update({ is_read: true }).eq('id', item.id);
          setToast({ text: `Talent-Verantwortung an ${item.metadata?.applicant_name || 'Mitglied'} vergeben.`, type: 'success' });
          setItems(prev => prev.filter(i => i.id !== item.id));
        }
      }
      setBusy(null);
      setTimeout(() => setToast(null), 4000);
      return;
    }

    const cfg = TYPE_CFG[item._type];
    setBusy(item.id);
    const updates = { status: cfg.approve, updated_at: new Date().toISOString() };
    if (item._type === 'werk' || item._type === 'erlebnis') {
      updates.published_at = new Date().toISOString();
    }
    const { error } = await supabase.from(cfg.table).update(updates).eq('id', item.id);
    if (error) {
      setToast({ text: 'Freigabe fehlgeschlagen.', type: 'error' });
    } else {
      const userId = item.user_id || item.created_by;
      await sendNotification(userId, 'content_approved',
        `Dein ${cfg.label} wurde freigegeben`,
        `„${item._label}" ist jetzt öffentlich.`,
        '/studio');
      setToast({ text: `„${item._label}" freigegeben.`, type: 'success' });
      setItems(prev => prev.filter(i => i.id !== item.id));
    }
    setBusy(null);
    setTimeout(() => setToast(null), 4000);
  }

  async function handleReject(item) {
    if (item._type === 'talentantrag') {
      // V7.5 Phase 5: Talent-Antrag ablehnen → Notification an Antragsteller
      setBusy(item.id);
      const applicantId = item.actor_id || item.metadata?.applicant_id;
      if (applicantId) {
        await sendNotification(applicantId, 'talent_application_rejected',
          'Dein Angebot wurde geprüft',
          rejectReason ? `Das Team dankt dir für dein Vertrauen. ${rejectReason}` : 'Das Team dankt dir für dein Vertrauen. Bewerb dich gerne erneut, wenn du dich weiterentwickelt hast.',
          '/studio');
        await supabase.from('notifications').update({ is_read: true }).eq('id', item.id);
        setToast({ text: `Antrag von ${item.metadata?.applicant_name || 'Mitglied'} abgelehnt.`, type: 'success' });
        setItems(prev => prev.filter(i => i.id !== item.id));
      }
      setBusy(null);
      setRejectItem(null);
      setRejectReason('');
      setTimeout(() => setToast(null), 4000);
      return;
    }

    const cfg = TYPE_CFG[item._type];
    setBusy(item.id);
    const updates = { status: cfg.reject, updated_at: new Date().toISOString() };
    if (item._type === 'werk' || item._type === 'erlebnis') {
      updates.published_at = null;
    }
    const { error } = await supabase.from(cfg.table).update(updates).eq('id', item.id);
    if (error) {
      setToast({ text: 'Ablehnung fehlgeschlagen.', type: 'error' });
    } else {
      const userId = item.user_id || item.created_by;
      await sendNotification(userId, 'content_rejected',
        `Dein ${cfg.label} wurde abgelehnt`,
        rejectReason ? `„${item._label}": ${rejectReason}` : `„${item._label}" konnte leider nicht freigegeben werden.`,
        '/studio');
      setToast({ text: `„${item._label}" abgelehnt.`, type: 'success' });
      setItems(prev => prev.filter(i => i.id !== item.id));
    }
    setBusy(null);
    setRejectItem(null);
    setRejectReason('');
    setTimeout(() => setToast(null), 4000);
  }

  const subTabs = [
    { key: 'pending', label: 'Warteschlange' },
    { key: 'approved', label: 'Freigegeben' },
    { key: 'rejected', label: 'Abgelehnt' },
  ];

  return (
    <div style={{
      padding: '40px 32px', maxWidth: 680,
      fontFamily: "Inter, sans-serif",
    }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Freigaben</h2>
      <p style={{ fontSize: 15, color: C.muted, marginBottom: 20 }}>
        Talent-Anträge, Werke, Erlebnisse und Projekte — alle an einem Ort.
      </p>

      {/* Sub-Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {subTabs.map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)} style={{
            padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: subTab === t.key ? C.white : 'transparent',
            color: subTab === t.key ? C.ink : C.muted,
            fontSize: 13, fontWeight: subTab === t.key ? 600 : 400,
            boxShadow: subTab === t.key ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <p style={{ color: C.muted, fontSize: 14 }}>Lade…</p>
      ) : items.length === 0 ? (
        <div style={{
          padding: '24px', borderRadius: 16, background: C.white, border: `1px solid ${C.border}`,
          fontSize: 14, color: C.muted, textAlign: 'center',
        }}>Alles erledigt. Danke für deine Sorgfalt.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(item => (
            <div key={`${item._type}-${item.id}`} style={{
              padding: '16px', borderRadius: 14, background: C.white, border: `1px solid ${C.border}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{item._label}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                    {TYPE_CFG[item._type].label} · {formatDateDE(new Date(item.created_at))}
                  </div>
                </div>
              </div>
              {subTab === 'pending' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    onClick={() => handleApprove(item)} disabled={busy === item.id}
                    style={{
                      padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: C.teal, color: '#fff', fontSize: 13, fontWeight: 600,
                      opacity: busy === item.id ? 0.6 : 1,
                    }}>Freigeben</button>
                  <button
                    onClick={() => setRejectItem(item)}
                    style={{
                      padding: '8px 16px', borderRadius: 10, border: `1px solid ${C.coral}40`,
                      background: 'transparent', color: C.coral, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}>Ablehnen</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      {rejectItem && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setRejectItem(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: C.white, borderRadius: 16, padding: 24, maxWidth: 400, width: '90%',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 12 }}>
              „{rejectItem._label}" ablehnen
            </h3>
            <textarea
              value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Grund (optional)…"
              style={{
                width: '100%', minHeight: 80, padding: '12px', borderRadius: 10,
                border: `1px solid ${C.border}`, fontSize: 14, color: C.ink,
                outline: 'none', boxSizing: 'border-box', resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectItem(null)} style={{
                padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'transparent', color: C.muted, fontSize: 13, fontWeight: 600,
              }}>Abbrechen</button>
              <button onClick={() => handleReject(rejectItem)} disabled={busy === rejectItem.id} style={{
                padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: C.coral, color: '#fff', fontSize: 13, fontWeight: 600,
                opacity: busy === rejectItem.id ? 0.6 : 1,
              }}>Ablehnen</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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
