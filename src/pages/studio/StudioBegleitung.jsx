// ══════════════════════════════════════════════════════════════════════════════
// StudioBegleitung.jsx — HUI V7.5 — Mitglieder mit Verantwortung begleiten
// ══════════════════════════════════════════════════════════════════════════════
//
// Zweck: Mitglieder gruppiert nach Verantwortung. Übersicht aktiver Talente,
//        Ambassadors, Guardian, Team. Verantwortungen können verwaltet werden.
//        Warm, ruhig, menschlich.
//
// DATEN: Supabase (profiles, notifications)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { HUI } from "../../design/hui.design.js";

const C = {
  cream: HUI.COLOR.creamStudio, white: HUI.COLOR.white, ink: HUI.COLOR.inkStudio,
  muted: 'rgba(80,80,80,0.55)', teal: HUI.COLOR.tealStudio, coral: HUI.COLOR.coralStudio,
  green: HUI.COLOR.greenStatus, border: 'rgba(0,0,0,0.06)',
};

async function sendNotification(userId, type, title, body) {
  await supabase.from('notifications').insert({
    user_id: userId, type, title, body, is_read: false,
    created_at: new Date().toISOString(),
  });
}

export default function StudioBegleitung() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url, is_talent, is_ambassador, role, membership_active, membership_type, profile_modules, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    setMembers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleResponsibility(member, field) {
    setUpdating(true);
    const newValue = !(member[field] === true);
    const { error } = await supabase
      .from('profiles')
      .update({ [field]: newValue, updated_at: new Date().toISOString() })
      .eq('id', member.id);

    if (error) {
      setToast({ text: 'Änderung fehlgeschlagen.', type: 'error' });
    } else {
      const label = field === 'is_talent' ? 'Talent' : 'Ambassador';
      if (newValue) {
        await sendNotification(member.id, 'responsibility_granted',
          `Du hast eine neue Verantwortung erhalten`,
          `Dir wurde die Verantwortung „${label}" anvertraut. Willkommen in dieser Rolle.`);
        setToast({ text: `${label}-Verantwortung an ${member.display_name || member.username || 'Mitglied'} vergeben.`, type: 'success' });
      } else {
        await sendNotification(member.id, 'responsibility_revoked',
          `Deine Verantwortung wurde angepasst`,
          `Die Verantwortung „${label}" wurde zurückgenommen.`);
        setToast({ text: `${label}-Verantwortung zurückgenommen.`, type: 'success' });
      }
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, [field]: newValue } : m));
    }
    setUpdating(false);
    setTimeout(() => setToast(null), 4000);
  }

  // Gruppieren
  const groups = [
    { key: 'talents', label: 'Talente', filter: m => m.is_talent === true && m.membership_active !== false },
    { key: 'ambassadors', label: 'Ambassadors', filter: m => m.is_ambassador === true },
    { key: 'guardians', label: 'Guardian', filter: m => m.profile_modules?.guardian?.status === 'active' },
    { key: 'team', label: 'Team', filter: m => m.role === 'admin' || m.role === 'superadmin' },
    { key: 'inactive', label: 'Inaktive Mitglieder', filter: m => m.membership_active !== true },
  ];

  const q = search.toLowerCase();
  const matchesSearch = m => !search ||
    (m.display_name || '').toLowerCase().includes(q) ||
    (m.username || '').toLowerCase().includes(q);

  return (
    <div style={{
      padding: '40px 32px', maxWidth: 680,
      fontFamily: "Inter, sans-serif",
    }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, color: C.ink, marginBottom: 8 }}>Begleitung</h2>
      <p style={{ fontSize: 15, color: C.muted, marginBottom: 20 }}>
        Mitglieder mit Verantwortung — begleiten und verwalten.
      </p>

      <input
        type="text" placeholder="Name oder Benutzername suchen…" value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${C.border}`,
          background: C.white, fontSize: 14, color: C.ink, outline: 'none',
          marginBottom: 24, boxSizing: 'border-box',
        }}
      />

      {loading ? (
        <p style={{ color: C.muted, fontSize: 14 }}>Lade Mitglieder…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {groups.map(group => {
            const groupMembers = members.filter(m => group.filter(m) && matchesSearch(m));
            if (groupMembers.length === 0) return null;
            return (
              <div key={group.key}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 10,
                  textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  {group.label} · {groupMembers.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {groupMembers.map(member => (
                    <MemberRow
                      key={member.id} member={member}
                      expanded={expanded === member.id}
                      onToggleExpand={() => setExpanded(expanded === member.id ? null : member.id)}
                      onToggleResp={toggleResponsibility}
                      updating={updating}
                    />
                  ))}
                </div>
              </div>
            );
          })}
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

function MemberRow({ member, expanded, onToggleExpand, onToggleResp, updating }) {
  const name = member.display_name || member.username || 'Unbekannt';
  const initials = name.charAt(0).toUpperCase();

  return (
    <div style={{
      background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden',
    }}>
      <button onClick={onToggleExpand} style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
        width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        {member.avatar_url ? (
          <img src={member.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: `${C.teal}15`, color: C.teal,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600,
          }}>{initials}</div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: C.ink }}>{name}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
            {member.is_talent === true && <Badge label="Talent" color={C.teal} />}
            {member.is_ambassador === true && <Badge label="Ambassador" color={C.coral} />}
            {(member.role === 'admin' || member.role === 'superadmin') && <Badge label="Team" color={C.ink} />}
          </div>
        </div>
        <span style={{ color: C.muted, fontSize: 12 }}>{expanded ? '▴' : '▾'}</span>
      </button>

      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ paddingTop: 16 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 10,
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>Verantwortungen</div>
            <RespToggle label="Talent" desc="Kreative Angebote gestalten" active={member.is_talent === true}
              onToggle={() => onToggleResp(member, 'is_talent')} disabled={updating} />
            <RespToggle label="Ambassador" desc="Neue Mitglieder einladen" active={member.is_ambassador === true}
              onToggle={() => onToggleResp(member, 'is_ambassador')} disabled={updating} />
          </div>
        </div>
      )}
    </div>
  );
}

function RespToggle({ label, desc, active, onToggle, disabled }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 10,
      background: active ? `${C.teal}08` : 'transparent', marginBottom: 4,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: C.ink }}>{label}</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{desc}</div>
      </div>
      <button onClick={onToggle} disabled={disabled} style={{
        padding: '8px 16px', borderRadius: 10, border: 'none',
        background: active ? C.teal : `${C.muted}15`,
        color: active ? '#fff' : C.muted,
        fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}>{active ? 'Vergeben' : 'Vergeben'}</button>
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{
      display: 'inline-flex', padding: '2px 8px', borderRadius: 6,
      background: `${color}12`, color, fontSize: 11, fontWeight: 500,
    }}>{label}</span>
  );
}
