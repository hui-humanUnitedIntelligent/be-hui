// src/components/settings/SettingsModal.jsx
// ── HUI Profil-Einstellungen Modal ───────────────────────────
// Modular aufgebaut: Persönliche Daten | Kontakt | Sicherheit | Account
import { useState, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient.js";

// ── Design Tokens ────────────────────────────────────────────
const T = {
  bg:      "#F7F5F0",
  bgCard:  "#FFFFFF",
  teal:    "#0EC4B8",
  tealSoft:"rgba(14,196,184,0.10)",
  ink:     "#1A1A18",
  inkSoft: "rgba(26,26,24,0.52)",
  border:  "rgba(26,26,24,0.10)",
  danger:  "#FF5B5B",
  dangerSoft:"rgba(255,91,91,0.10)",
  radius:  14,
};

// ── Hilfsfunktionen ──────────────────────────────────────────
const inputStyle = {
  width: "100%", boxSizing: "border-box",
  border: `1.5px solid ${T.border}`, borderRadius: 10,
  padding: "11px 14px", fontSize: 14, color: T.ink,
  background: "#FAFAF8", outline: "none",
  transition: "border-color 0.15s",
};

const btnPrimary = {
  background: T.teal, color: "#fff", border: "none",
  borderRadius: 10, padding: "10px 22px", fontSize: 14,
  fontWeight: 600, cursor: "pointer", transition: "opacity 0.15s",
};

const btnDanger = {
  background: T.dangerSoft, color: T.danger, border: `1px solid rgba(255,91,91,0.25)`,
  borderRadius: 10, padding: "10px 22px", fontSize: 14,
  fontWeight: 600, cursor: "pointer",
};

function Section({ title, icon, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.inkSoft,
        textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12,
        display: "flex", alignItems: "center", gap: 6 }}>
        <span>{icon}</span> {title}
      </div>
      <div style={{ background: T.bgCard, borderRadius: T.radius,
        border: `1px solid ${T.border}`, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, children, last }) {
  return (
    <div style={{ padding: "16px 18px",
      borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600,
        marginBottom: 8, letterSpacing: 0.2 }}>{label}</div>
      {children}
    </div>
  );
}

function SaveRow({ onSave, saving, saved, error }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
      <button onClick={onSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
        {saving ? "Speichere…" : "Speichern"}
      </button>
      {saved  && <span style={{ fontSize: 12, color: T.teal, fontWeight: 600 }}>✓ Gespeichert</span>}
      {error  && <span style={{ fontSize: 12, color: T.danger }}>{error}</span>}
    </div>
  );
}

// ── Block: Name ändern ────────────────────────────────────────
function NameBlock({ profile, onProfileUpdate }) {
  const [first, setFirst] = useState(profile?.first_name || "");
  const [last,  setLast]  = useState(profile?.last_name  || "");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState(null);

  const save = async () => {
    setSaving(true); setError(null); setSaved(false);
    const display_name = [first.trim(), last.trim()].filter(Boolean).join(" ");
    const { error: err } = await supabase.from("profiles").update({
      first_name: first.trim(), last_name: last.trim(), display_name,
    }).eq("id", profile.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true); setTimeout(() => setSaved(false), 2500);
    onProfileUpdate?.({ ...profile, first_name: first.trim(), last_name: last.trim(), display_name });
  };

  return (
    <SettingRow label="Name" last>
      <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
        <input value={first} onChange={e => setFirst(e.target.value)}
          placeholder="Vorname" style={inputStyle}
          onFocus={e => e.target.style.borderColor = T.teal}
          onBlur={e  => e.target.style.borderColor = T.border} />
        <input value={last} onChange={e => setLast(e.target.value)}
          placeholder="Nachname" style={inputStyle}
          onFocus={e => e.target.style.borderColor = T.teal}
          onBlur={e  => e.target.style.borderColor = T.border} />
      </div>
      <SaveRow onSave={save} saving={saving} saved={saved} error={error} />
    </SettingRow>
  );
}

// ── Block: E-Mail ändern ──────────────────────────────────────
function EmailBlock({ profile, onProfileUpdate }) {
  const [email,  setEmail]  = useState(profile?.email || "");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState(null);

  const save = async () => {
    setSaving(true); setError(null); setSaved(false);
    if (!email.includes("@")) { setError("Ungültige E-Mail-Adresse"); setSaving(false); return; }
    // Supabase Auth E-Mail ändern
    const { error: authErr } = await supabase.auth.updateUser({ email: email.trim() });
    if (authErr) { setError(authErr.message); setSaving(false); return; }
    // Profile updaten
    await supabase.from("profiles").update({ email: email.trim() }).eq("id", profile.id);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
    onProfileUpdate?.({ ...profile, email: email.trim() });
  };

  return (
    <SettingRow label="E-Mail-Adresse" last>
      <input value={email} onChange={e => setEmail(e.target.value)}
        placeholder="neue@email.de" type="email" style={inputStyle}
        onFocus={e => e.target.style.borderColor = T.teal}
        onBlur={e  => e.target.style.borderColor = T.border} />
      {saved && <div style={{ fontSize: 12, color: T.teal, marginTop: 6 }}>
        ✓ Bestätigungs-E-Mail wurde verschickt. Bitte klicke den Link.
      </div>}
      <SaveRow onSave={save} saving={saving} saved={false} error={error} />
    </SettingRow>
  );
}

// ── Block: Telefon ändern ─────────────────────────────────────
function PhoneBlock({ profile, onProfileUpdate }) {
  const [phone,  setPhone]  = useState(profile?.phone || profile?.profile_modules?.phone || "");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState(null);

  const validate = (v) => /^[+\d\s\-()]*$/.test(v);

  const save = async () => {
    setSaving(true); setError(null); setSaved(false);
    if (!validate(phone)) { setError("Ungültige Telefonnummer"); setSaving(false); return; }
    const pm = profile?.profile_modules || {};
    const { error: err } = await supabase.from("profiles").update({
      phone: phone.trim(),
      profile_modules: { ...pm, phone: phone.trim() },
    }).eq("id", profile.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true); setTimeout(() => setSaved(false), 2500);
    onProfileUpdate?.({ ...profile, phone: phone.trim() });
  };

  return (
    <SettingRow label="Telefonnummer" last>
      <input value={phone} onChange={e => setPhone(e.target.value)}
        placeholder="+49 123 456789" type="tel" style={inputStyle}
        onFocus={e => e.target.style.borderColor = T.teal}
        onBlur={e  => e.target.style.borderColor = T.border} />
      <SaveRow onSave={save} saving={saving} saved={saved} error={error} />
    </SettingRow>
  );
}

// ── Block: Passwort ändern ────────────────────────────────────
function PasswordBlock() {
  const [current, setCurrent] = useState("");
  const [next,    setNext]    = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState(null);

  const save = async () => {
    setError(null); setSaved(false);
    if (next.length < 8) { setError("Mindestens 8 Zeichen"); return; }
    if (next !== confirm)  { setError("Passwörter stimmen nicht überein"); return; }
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password: next });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true); setCurrent(""); setNext(""); setConfirm("");
    setTimeout(() => setSaved(false), 3000);
  };

  const fieldStyle = { ...inputStyle, marginBottom: 8 };
  return (
    <SettingRow label="Neues Passwort setzen" last>
      <input value={current} onChange={e => setCurrent(e.target.value)}
        placeholder="Aktuelles Passwort" type="password" style={fieldStyle}
        onFocus={e => e.target.style.borderColor = T.teal}
        onBlur={e  => e.target.style.borderColor = T.border} />
      <input value={next} onChange={e => setNext(e.target.value)}
        placeholder="Neues Passwort (min. 8 Zeichen)" type="password" style={fieldStyle}
        onFocus={e => e.target.style.borderColor = T.teal}
        onBlur={e  => e.target.style.borderColor = T.border} />
      <input value={confirm} onChange={e => setConfirm(e.target.value)}
        placeholder="Passwort bestätigen" type="password" style={{ ...fieldStyle, marginBottom: 0 }}
        onFocus={e => e.target.style.borderColor = T.teal}
        onBlur={e  => e.target.style.borderColor = T.border} />
      <SaveRow onSave={save} saving={saving} saved={saved} error={error} />
    </SettingRow>
  );
}

// ── Block: Ausloggen ──────────────────────────────────────────
function LogoutBlock() {
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <SettingRow label="Sitzung beenden" last>
      <button onClick={logout} disabled={busy} style={{ ...btnDanger, opacity: busy ? 0.6 : 1 }}>
        {busy ? "Ausloggen…" : "🚪 Ausloggen"}
      </button>
    </SettingRow>
  );
}

// ── Haupt-Komponente ─────────────────────────────────────────
export default function SettingsModal({ profile, onClose, onProfileUpdate }) {
  if (!profile) return null;

  const overlayStyle = {
    position: "fixed", inset: 0, zIndex: 9000,
    background: "rgba(10,10,8,0.55)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "flex-end", justifyContent: "center",
    padding: "0",
  };

  const sheetStyle = {
    background: T.bg, borderRadius: "20px 20px 0 0",
    width: "100%", maxWidth: 560,
    maxHeight: "92dvh", overflowY: "auto",
    padding: "0 0 env(safe-area-inset-bottom, 20px)",
    boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
  };

  return (
    <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div style={sheetStyle}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 20px 14px", position: "sticky", top: 0,
          background: T.bg, borderBottom: `1px solid ${T.border}`,
          borderRadius: "20px 20px 0 0", zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.ink }}>⚙️ Einstellungen</div>
            <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>
              {profile?.display_name || profile?.username || "Mein Konto"}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(26,26,24,0.07)", border: "none", borderRadius: "50%",
            width: 34, height: 34, fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 16px 30px" }}>

          {/* A) Persönliche Daten */}
          <Section title="Persönliche Daten" icon="👤">
            <NameBlock profile={profile} onProfileUpdate={onProfileUpdate} />
          </Section>

          {/* B) Kontakt */}
          <Section title="Kontakt" icon="📬">
            <EmailBlock profile={profile} onProfileUpdate={onProfileUpdate} />
            <PhoneBlock profile={profile} onProfileUpdate={onProfileUpdate} />
          </Section>

          {/* C) Sicherheit */}
          <Section title="Sicherheit" icon="🔒">
            <PasswordBlock />
          </Section>

          {/* D) Account */}
          <Section title="Account" icon="🚪">
            <LogoutBlock />
          </Section>

          {/* Erweiterungshinweis — für zukünftige Features */}
          {/* FUTURE: Sprache, Sichtbarkeit, 2FA, Ambassador-Einstellungen */}

        </div>
      </div>
    </div>
  );
}
