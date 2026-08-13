// ══════════════════════════════════════════════════════════════════════════════
// KontoSettingsPage.jsx — HUI V7.5 — Ein ruhiger persönlicher Raum
// ══════════════════════════════════════════════════════════════════════════════
//
// Der Bereich "Konto & Einstellungen" ist kein technisches Einstellungsmenü.
// Er soll den Menschen dabei unterstützen:
//   - seine Identität zu verwalten
//   - seine Mitgliedschaft zu verstehen
//   - seine Verantwortungen einzusehen
//   - seine Privatsphäre festzulegen
//   - seine Benachrichtigungen bewusst zu steuern
//   - seine Daten transparent einzusehen
//
// Nicht möglichst viele Schalter. Sondern möglichst viel Klarheit.
// Dieselbe warme Designsprache wie das gesamte Studio.
// Keine typische Settings-App. Sondern ein ruhiger persönlicher Raum.
//
// ARL-01: Verantwortungen (is_talent, is_ambassador, role) sind read-only.
//         Nur das Entwicklungszentrum vergibt oder ändert sie.
// ARL-09: Jeder Bereich leistet einen echten Beitrag zum persönlichen Weg.
// ARL-10: Keine Schalter-Flut. Ruhe ist Gestaltungsprinzip.
//
// DATEN: Supabase (profiles, notification_settings, privacy_settings)
//        AuthContext (saveProfile, signOut)
// ══════════════════════════════════════════════════════════════════════════════

import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../lib/AuthContext.jsx';
import { isProfileTalent } from '../../lib/profileUtils.js';
import { formatDateDE } from "../../lib/formatters.js";
import { HUI } from "../../design/hui.design.js";

const C = {
  cream: HUI.COLOR.creamStudio, white: HUI.COLOR.white, ink: HUI.COLOR.inkStudio,
  muted: 'rgba(80,80,80,0.55)', teal: HUI.COLOR.tealStudio, coral: HUI.COLOR.coralStudio,
  green: HUI.COLOR.greenStatus, border: 'rgba(0,0,0,0.06)',
};

const ROLE_LABELS = {
  talent:     'Talent',
  ambassador:  'Ambassador',
  guardian:   'Guardian',
  admin:      'Team',
  superadmin: 'Team',
  member:     'Mitglied',
};

export default function KontoSettingsPage() {
  const { t } = useTranslation();
  const { user, profile, saveProfile, signOut } = useAuth();
  const [notifSettings, setNotifSettings] = useState(null);
  const [privacySettings, setPrivacySettings] = useState(null);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Ref: verhindert dass profile-Updates aus Hintergrund (Token-Refresh, saveProfile)
  // die Formular-Eingaben überschreiben, während der Nutzer tippt.
  const profileInitialized = React.useRef(false);

  const load = useCallback(async () => {
    if (!user?.id) return;

    // Notification- und Privacy-Settings laden
    const [notifRes, privRes] = await Promise.all([
      supabase.from('notification_settings').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('privacy_settings').select('*').eq('user_id', user.id).maybeSingle(),
    ]);

    setNotifSettings(notifRes.data || null);
    setPrivacySettings(privRes.data || null);

    // Profil-Felder nur beim ersten Laden initialisieren — nicht bei jedem profile-Update
    if (!profileInitialized.current && profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setWebsite(profile.website || '');
      setLocationLabel(profile.location_label || '');
      profileInitialized.current = true;
    }
  }, [user?.id]); // profile bewusst NICHT in Dependencies — verhindert Überschreiben von Eingaben

  useEffect(() => { load(); }, [load]);

  async function handleSaveIdentity() {
    setSaving(true);
    const { error } = await saveProfile({
      display_name: displayName.trim(),
      bio: bio.trim() || null,
      website: website.trim() || null,
      location_label: locationLabel.trim() || null,
    });
    setSaving(false);
    if (error) {
      setToast({ text: 'Speichern fehlgeschlagen.', type: 'error' });
    } else {
      setToast({ text: 'Gespeichert.', type: 'success' });
      setEditing(false);
    }
    setTimeout(() => setToast(null), 3000);
  }

  async function toggleNotif(key) {
    if (!notifSettings?.user_id) return;
    const newValue = !notifSettings[key];
    const { error } = await supabase
      .from('notification_settings')
      .update({ [key]: newValue })
      .eq('user_id', notifSettings.user_id);
    if (!error) setNotifSettings(prev => ({ ...prev, [key]: newValue }));
  }

  async function togglePrivacy(key) {
    if (!privacySettings?.user_id) return;
    const newValue = !privacySettings[key];
    const { error } = await supabase
      .from('privacy_settings')
      .update({ [key]: newValue })
      .eq('user_id', privacySettings.user_id);
    if (!error) setPrivacySettings(prev => ({ ...prev, [key]: newValue }));
  }

  const isTalent = isProfileTalent(profile);
  const isAmb = profile?.is_ambassador === true;
  const memberSince = profile?.member_since || profile?.created_at;

  return (
    <div style={{
      padding: '40px 32px', maxWidth: 680,
      fontFamily: "Inter, sans-serif",
    }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, color: C.ink, marginBottom: 8 }}>
        Dein Raum
      </h2>
      <p style={{ fontSize: 15, color: C.muted, marginBottom: 40, lineHeight: 1.7 }}>
        Wer du bist. Was du trägst. Wie du erreichbar bist.
        Hier bestimmst du, was die Welt von dir sieht.
      </p>

      {/* ═══ Identität ═══ */}
      <Section title="Deine Identität" hint="Wie du in der Gemeinschaft sichtbar bist.">
        <div style={{
          padding: '20px', borderRadius: 14, background: C.white,
          border: `1px solid ${C.border}`,
        }}>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{
                width: 56, height: 56, borderRadius: '50%', objectFit: 'cover',
              }} />
            ) : (
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: C.cream,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, color: C.muted,
              }}>{(displayName || '?')[0]}</div>
            )}
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>
                {displayName || 'Ohne Namen'}
              </div>
              {profile?.username && (
                <div style={{ fontSize: 13, color: C.muted }}>@{profile.username}</div>
              )}
            </div>
          </div>

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <InputField label={t("common.name")} value={displayName} onChange={setDisplayName} placeholder="Dein Name" />
              <TextAreaField label={t("profile.aboutYou")} value={bio} onChange={setBio} placeholder="Erzähl von dir" />
              <InputField label={t("common.location")} value={locationLabel} onChange={setLocationLabel} placeholder="Wo du lebst" />
              <InputField label={t("common.website")} value={website} onChange={setWebsite} placeholder="https://…" />
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={handleSaveIdentity} disabled={saving} style={{
                  padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: C.teal, color: '#fff', fontSize: 14, fontWeight: 600,
                  opacity: saving ? 0.6 : 1,
                }}>{saving ? 'Speichert…' : 'Speichern'}</button>
                <button onClick={() => setEditing(false)} style={{
                  padding: '10px 20px', borderRadius: 10, border: `1px solid ${C.border}`,
                  background: 'transparent', cursor: 'pointer', fontSize: 14, color: C.muted,
                }}>Abbrechen</button>
              </div>
            </div>
          ) : (
            <div>
              {bio && <p style={{ fontSize: 14, color: C.ink, lineHeight: 1.6, marginBottom: 8 }}>{bio}</p>}
              {locationLabel && <p style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>📍 {locationLabel}</p>}
              {website && <p style={{ fontSize: 13, color: C.teal, marginBottom: 4 }}>{website}</p>}
              <button onClick={() => setEditing(true)} style={{
                marginTop: 12, padding: '8px 16px', borderRadius: 10,
                border: `1px solid ${C.border}`, background: 'transparent',
                cursor: 'pointer', fontSize: 13, color: C.teal, fontWeight: 500,
              }}>Bearbeiten</button>
            </div>
          )}
        </div>
      </Section>

      {/* ═══ Mitgliedschaft ═══ */}
      <Section title="Deine Mitgliedschaft" hint="Seit wann du Teil der Bewegung bist.">
        <div style={{
          padding: '20px', borderRadius: 14, background: C.white,
          border: `1px solid ${C.border}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 4 }}>
                {profile?.membership_active ? 'Aktives Mitglied' : 'Mitglied (inaktiv)'}
              </div>
              {memberSince && (
                <div style={{ fontSize: 13, color: C.muted }}>
                  Seit {formatDateDE(new Date(memberSince), { month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
            <div style={{
              width: 12, height: 12, borderRadius: '50%',
              background: profile?.membership_active ? C.green : C.muted,
            }} />
          </div>
        </div>
      </Section>

      {/* ═══ Verantwortungen ═══ */}
      <Section title="Deine Verantwortungen" hint="Was du trägst. Diese wurden dir anvertraut — nicht selbst gewählt.">
        <div style={{
          padding: '20px', borderRadius: 14, background: C.white,
          border: `1px solid ${C.border}`,
        }}>
          {/* Rolle */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 0', borderBottom: `1px solid ${C.border}`,
          }}>
            <span style={{ fontSize: 14, color: C.ink }}>Rolle</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.teal }}>
              {ROLE_LABELS[profile?.role] || 'Mitglied'}
            </span>
          </div>

          {/* Talent */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 0', borderBottom: `1px solid ${C.border}`,
          }}>
            <span style={{ fontSize: 14, color: C.ink }}>Talent-Verantwortung</span>
            <span style={{
              fontSize: 13, fontWeight: 500,
              color: isTalent ? C.green : C.muted,
            }}>
              {isTalent ? 'Getragen' : 'Nicht getragen'}
            </span>
          </div>

          {/* Ambassador */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 0',
          }}>
            <span style={{ fontSize: 14, color: C.ink }}>Ambassador-Verantwortung</span>
            <span style={{
              fontSize: 13, fontWeight: 500,
              color: isAmb ? C.green : C.muted,
            }}>
              {isAmb ? 'Getragen' : 'Nicht getragen'}
            </span>
          </div>

          {/* Hinweis */}
          <p style={{
            fontSize: 12, color: C.muted, marginTop: 12, lineHeight: 1.5,
            fontStyle: 'italic',
          }}>
            Verantwortungen werden vom HUI-Team vergeben.
            Sie sind Vertrauen, kein Status. Du kannst sie hier einsehen.
          </p>
        </div>
      </Section>

      {/* ═══ Privatsphäre ═══ */}
      {privacySettings && (
        <Section title="Deine Privatsphäre" hint="Was die Welt von dir sehen darf.">
          <div style={{
            padding: '20px', borderRadius: 14, background: C.white,
            border: `1px solid ${C.border}`,
          }}>
            <ToggleRow
              label={t("profile.profileVisible")}
              hint="Andere können dein Profil finden"
              value={privacySettings.profile_visibility !== 'private'}
              onChange={() => togglePrivacy('profile_visibility')}
              toggleType="visibility"
              currentValue={privacySettings.profile_visibility}
            />
            <ToggleRow
              label={t("common.location")}
              hint="Zeigt, wo du lebst"
              value={privacySettings.show_location}
              onChange={() => togglePrivacy('show_location')}
            />
            <ToggleRow
              label={t("common.available")}
              hint="Zeigt, ob du Zeit hast"
              value={privacySettings.show_availability}
              onChange={() => togglePrivacy('show_availability')}
            />
            <ToggleRow
              label={t("connection.message")}
              hint="Andere können dir schreiben"
              value={privacySettings.allow_messages}
              onChange={() => togglePrivacy('allow_messages')}
              last
            />
          </div>
        </Section>
      )}

      {/* ═══ Benachrichtigungen ═══ */}
      {notifSettings && (
        <Section title="Deine Benachrichtigungen" hint="Was du wissen möchtest. Bewusst, nicht ständig.">
          <div style={{
            padding: '20px', borderRadius: 14, background: C.white,
            border: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 12 }}>E-Mail</div>
            <ToggleRow label={t("common.active")} hint="Wenn jemand Zeit mit dir verbringt" value={notifSettings.email_bookings} onChange={() => toggleNotif('email_bookings')} />
            <ToggleRow label={t("connection.message")} hint="Wenn dir jemand schreibt" value={notifSettings.email_messages} onChange={() => toggleNotif('email_messages')} />
            <ToggleRow label={t("impact.impact")} hint="Wenn sich an deinen Projekten etwas bewegt" value={notifSettings.email_impact} onChange={() => toggleNotif('email_impact')} last />

            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginTop: 16, marginBottom: 12 }}>Push</div>
            <ToggleRow label={t("common.active")} hint="" value={notifSettings.push_bookings} onChange={() => toggleNotif('push_bookings')} />
            <ToggleRow label={t("connection.message")} hint="" value={notifSettings.push_messages} onChange={() => toggleNotif('push_messages')} />
            <ToggleRow label={t("impact.impact")} hint="" value={notifSettings.push_impact} onChange={() => toggleNotif('push_impact')} last />
          </div>
        </Section>
      )}

      {/* ═══ Abmeldung ═══ */}
      <Section title="Abmelden" hint="Verlässt den Raum. Du kannst jederzeit zurückkommen.">
        <button
          onClick={() => signOut?.()}
          style={{
            padding: '12px 24px', borderRadius: 12,
            border: `1px solid ${C.border}`, background: 'transparent',
            cursor: 'pointer', fontSize: 14, fontWeight: 500,
            color: C.coral,
          }}
        >Abmelden</button>
      </Section>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500,
          background: toast.type === 'success' ? C.green : C.coral,
          color: '#fff', zIndex: 1000,
        }}>{toast.text}</div>
      )}
    </div>
  );
}

// ── Section ──────────────────────────────────────────────────────────
function Section({ title, hint, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 4 }}>{title}</h3>
      {hint && <p style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>{hint}</p>}
      {children}
    </div>
  );
}

// ── Input Field ────────────────────────────────────────────────────
function InputField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 6, display: 'block' }}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '12px', borderRadius: 10,
          border: `1px solid ${C.border}`, background: C.cream,
          fontSize: 14, color: C.ink, outline: 'none',
          boxSizing: 'border-box', fontFamily: 'inherit',
        }}
      />
    </div>
  );
}

// ── Textarea Field ─────────────────────────────────────────────────
function TextAreaField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 6, display: 'block' }}>{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', minHeight: 80, padding: '12px', borderRadius: 10,
          border: `1px solid ${C.border}`, background: C.cream,
          fontSize: 14, color: C.ink, outline: 'none',
          boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6,
        }}
      />
    </div>
  );
}

// ── Toggle Row ──────────────────────────────────────────────────────
function ToggleRow({ label, hint, value, onChange, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: last ? 'none' : `1px solid ${C.border}`,
    }}>
      <div>
        <div style={{ fontSize: 14, color: C.ink }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{hint}</div>}
      </div>
      <button
        onClick={onChange}
        style={{
          width: 40, height: 24, borderRadius: 12, border: 'none',
          background: value ? C.teal : 'rgba(0,0,0,0.12)',
          cursor: 'pointer', position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: value ? 21 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );
}
