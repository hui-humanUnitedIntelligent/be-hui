import { HUIAbmeldenIcon, HUIDatenschutzIcon, HUIKalenderIcon, HUIKontaktIcon, HUIMitgliedIcon, HUIProfilIcon, HUISettingsIcon, HUISicherheitIcon, HUIVerifIcon, HUIMailIcon } from '../../design/icons/HuiSystemIcons.jsx';
// src/components/settings/SettingsModal.jsx
// ── HUI Einstellungs-Modal v2 ─────────────────────────────────
// Enthält: Profil bearbeiten | Buchungen | Privatsphäre | Abmelden
// + Name | E-Mail | Telefon | Passwort ändern
import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../lib/AuthContext.jsx";
import { supabase } from "../../lib/supabaseClient.js";
import { HUILogoWordmark } from '../brand/HUILogo.jsx';
import APP_VERSION from '../../version.ts';

// ── Design Tokens ─────────────────────────────────────────────
const T = {
  bg:       "#F7F5F0",
  bgCard:   "#FFFFFF",
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.52)",
  inkFaint: "rgba(26,26,24,0.28)",
  border:   "rgba(26,26,24,0.09)",
  danger:   "#FF5B5B",
  dangerBg: "rgba(255,91,91,0.08)",
  radius:   14,
};

// ── Primitive Styles ──────────────────────────────────────────
const inp = {
  width:"100%", boxSizing:"border-box",
  border:"1.5px solid " + T.border, borderRadius:10,
  padding:"11px 14px", fontSize:14, color:T.ink,
  background:"#FAFAF8", outline:"none", fontFamily:"inherit",
};
const btnPrimary = {
  background:T.teal, color:"#fff", border:"none",
  borderRadius:10, padding:"10px 22px", fontSize:14,
  fontWeight:600, cursor:"pointer", fontFamily:"inherit",
};

// ── Bausteine ─────────────────────────────────────────────────
function Section({ title, icon, children }) {
  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ fontSize:11, fontWeight:700, color:T.inkSoft,
        textTransform:"uppercase", letterSpacing:0.8, marginBottom:10,
        display:"flex", alignItems:"center", gap:6, padding:"0 4px" }}>
        <span>{icon}</span>{title}
      </div>
      <div style={{ background:T.bgCard, borderRadius:T.radius,
        border:"1px solid "+T.border, overflow:"hidden" }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, children, last }) {
  return (
    <div style={{ padding:"15px 16px",
      borderBottom:last?"none":"1px solid "+T.border }}>
      {label && <div style={{ fontSize:12, color:T.inkSoft, fontWeight:600,
        marginBottom:8, letterSpacing:0.1 }}>{label}</div>}
      {children}
    </div>
  );
}

function SaveRow({ onSave, saving, saved, error }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:10 }}>
      <button onClick={onSave} disabled={saving}
        style={{ ...btnPrimary, opacity:saving?0.6:1 }}>
        {saving?"Speichere…":"Speichern"}
      </button>
      {saved && <span style={{ fontSize:12, color:T.teal, fontWeight:600 }}>✓ Gespeichert</span>}
      {error && <span style={{ fontSize:12, color:T.danger }}>{error}</span>}
    </div>
  );
}

// ── Navigation: Profil bearbeiten + Buchungen ─────────────────
function NavItem({ icon, label, onClick, danger, last }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ width:"100%", display:"flex", alignItems:"center", gap:13,
        padding:"14px 16px", background:hover?(danger?T.dangerBg:T.tealSoft):"none",
        border:"none", cursor:"pointer", fontFamily:"inherit",
        borderBottom:last?"none":"1px solid "+T.border,
        touchAction:"manipulation", textAlign:"left",
        transition:"background 0.12s" }}>
      <div style={{ width:36, height:36, borderRadius:11, flexShrink:0,
        background:danger?T.dangerBg:T.tealSoft,
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>
        {icon}
      </div>
      <span style={{ fontSize:15, fontWeight:500,
        color:danger?T.danger:T.ink, flex:1, textAlign:"left" }}>
        {label}
      </span>
      <span style={{ fontSize:16, color:T.inkFaint }}>›</span>
    </button>
  );
}

// ── Block: Name ───────────────────────────────────────────────
function NameBlock({ profile, onProfileUpdate }) {
  const [first, setFirst] = useState(profile?.first_name || "");
  const [last,  setLast]  = useState(profile?.last_name  || "");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState(null);

  const save = async () => {
    setSaving(true); setError(null); setSaved(false);
    const display_name = [first.trim(), last.trim()].filter(Boolean).join(" ");
    const { error:err } = await supabase.from("profiles").update({
      first_name:first.trim(), last_name:last.trim(), display_name,
    }).eq("id", profile.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true); setTimeout(() => setSaved(false), 2500);
    onProfileUpdate?.({ ...profile, first_name:first.trim(), last_name:last.trim(), display_name });
  };

  return (
    <Row label="Name" last>
      <div style={{ display:"flex", gap:8, marginBottom:4 }}>
        <input value={first} onChange={e=>setFirst(e.target.value)}
          placeholder="Vorname" style={inp}
          onFocus={e=>e.target.style.borderColor=T.teal}
          onBlur={e=>e.target.style.borderColor=T.border}/>
        <input value={last} onChange={e=>setLast(e.target.value)}
          placeholder="Nachname" style={inp}
          onFocus={e=>e.target.style.borderColor=T.teal}
          onBlur={e=>e.target.style.borderColor=T.border}/>
      </div>
      <SaveRow onSave={save} saving={saving} saved={saved} error={error}/>
    </Row>
  );
}

// ── Block: E-Mail ─────────────────────────────────────────────
function EmailBlock({ profile, onProfileUpdate }) {
  // email direkt aus Supabase Auth holen
  const [email, setEmail] = useState(authCtxProfile?.email || profile?.email || "");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState(null);

  const save = async () => {
    setSaving(true); setError(null); setSaved(false);
    if (!email.includes("@")) { setError("Ungültige E-Mail"); setSaving(false); return; }
    const { error:authErr } = await supabase.auth.updateUser({ email:email.trim() });
    if (authErr) { setError(authErr.message); setSaving(false); return; }
    await supabase.from("profiles").update({ email:email.trim() }).eq("id", profile.id);
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),3000);
    onProfileUpdate?.({ ...profile, email:email.trim() });
  };

  return (
    <Row label="E-Mail-Adresse">
      <input value={email} onChange={e=>setEmail(e.target.value)}
        placeholder="neue@email.de" type="email" style={inp}
        onFocus={e=>e.target.style.borderColor=T.teal}
        onBlur={e=>e.target.style.borderColor=T.border}/>
      {saved && <div style={{ fontSize:12, color:T.teal, marginTop:6 }}>
        ✓ Bestätigungs-Mail verschickt — bitte bestätigen.</div>}
      <SaveRow onSave={save} saving={saving} saved={false} error={error}/>
    </Row>
  );
}

// ── Block: Telefon ────────────────────────────────────────────
function PhoneBlock({ profile, onProfileUpdate }) {
  const [phone, setPhone] = useState(
    profile?.phone || profile?.profile_modules?.phone || ""
  );
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState(null);

  const save = async () => {
    setSaving(true); setError(null); setSaved(false);
    if (!/^[+\d\s\-()\s]*$/.test(phone)) {
      setError("Ungültige Telefonnummer"); setSaving(false); return;
    }
    const pm = profile?.profile_modules || {};
    const { error:err } = await supabase.from("profiles").update({
      phone:phone.trim(),
      profile_modules:{ ...pm, phone:phone.trim() },
    }).eq("id", profile.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true); setTimeout(()=>setSaved(false),2500);
    onProfileUpdate?.({ ...profile, phone:phone.trim() });
  };

  return (
    <Row label="Telefonnummer" last>
      <input value={phone} onChange={e=>setPhone(e.target.value)}
        placeholder="+49 123 456789" type="tel" style={inp}
        onFocus={e=>e.target.style.borderColor=T.teal}
        onBlur={e=>e.target.style.borderColor=T.border}/>
      <SaveRow onSave={save} saving={saving} saved={saved} error={error}/>
    </Row>
  );
}

// ── Block: Passwort ───────────────────────────────────────────
function PasswordBlock() {
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
    const { error:err } = await supabase.auth.updateUser({ password:next });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true); setNext(""); setConfirm("");
    setTimeout(()=>setSaved(false), 3000);
  };

  return (
    <Row label="Neues Passwort" last>
      <input value={next} onChange={e=>setNext(e.target.value)}
        placeholder="Neues Passwort (min. 8 Zeichen)" type="password"
        style={{ ...inp, marginBottom:8 }}
        onFocus={e=>e.target.style.borderColor=T.teal}
        onBlur={e=>e.target.style.borderColor=T.border}/>
      <input value={confirm} onChange={e=>setConfirm(e.target.value)}
        placeholder="Passwort bestätigen" type="password" style={inp}
        onFocus={e=>e.target.style.borderColor=T.teal}
        onBlur={e=>e.target.style.borderColor=T.border}/>
      <SaveRow onSave={save} saving={saving} saved={saved} error={error}/>
    </Row>
  );
}

// ── Block: E-Mail ändern ─────────────────────────────────────
function EmailChangeBlock({ profile, onProfileUpdate }) {
  const { supabase } = useAuth() || {};
  const [oldEmail, setOldEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState(null);

  const save = async () => {
    setError(null); setSaved(false);
    const currentEmail = profile?.email || "";
    if (!oldEmail.trim()) { setError("Bitte aktuelle E-Mail eingeben"); return; }
    if (oldEmail.trim().toLowerCase() !== currentEmail.toLowerCase()) {
      setError("Aktuelle E-Mail stimmt nicht überein"); return;
    }
    if (!newEmail.includes("@")) { setError("Ungültige neue E-Mail-Adresse"); return; }
    if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
      setError("Neue E-Mail ist identisch mit der aktuellen"); return;
    }
    setSaving(true);
    try {
      // 1. Supabase Auth E-Mail ändern (sendet Bestätigungs-Mail)
      const { error: authErr } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (authErr) throw new Error(authErr.message);
      // 2. profiles-Tabelle sofort mitziehen
      await supabase.from("profiles")
        .update({ email: newEmail.trim(), updated_at: new Date().toISOString() })
        .eq("id", profile?.id);
      // 3. UI-Zustand aktualisieren
      onProfileUpdate?.({ ...profile, email: newEmail.trim() });
      setSaved(true); setOldEmail(""); setNewEmail("");
      setTimeout(() => setSaved(false), 5000);
    } catch(e) {
      setError(e.message || "Fehler beim Ändern der E-Mail");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Row label="Aktuelle E-Mail">
      <input value={oldEmail} onChange={e=>setOldEmail(e.target.value)}
        placeholder="Deine aktuelle E-Mail" type="email"
        style={{ ...inp, marginBottom:8 }}
        onFocus={e=>e.target.style.borderColor=T.teal}
        onBlur={e=>e.target.style.borderColor=T.border}/>
      <input value={newEmail} onChange={e=>setNewEmail(e.target.value)}
        placeholder="Neue E-Mail-Adresse" type="email" style={inp}
        onFocus={e=>e.target.style.borderColor=T.teal}
        onBlur={e=>e.target.style.borderColor=T.border}/>
      <SaveRow onSave={save} saving={saving} saved={saved} error={error}/>
      {saved && (
        <div style={{ marginTop:8, fontSize:12, color:T.teal, lineHeight:1.4 }}>
          ✅ E-Mail geändert. Falls eine Bestätigung nötig ist, prüfe deine neue Inbox.
        </div>
      )}
    </Row>
  );
}

// ── Block: Privatsphäre ───────────────────────────────────────
const VISIBILITY_OPTIONS = [
  { value:"public",      label:"🌍 Öffentlich",        desc:"Jeder kann dein Profil sehen" },
  { value:"connections", label:"🤝 Verbindungen",      desc:"Nur Verbindungen sehen dein Profil" },
  { value:"private",     label:"🔒 Privat",            desc:"Nur du siehst dein Profil" },
];

function PrivacyBlock({ profile, onProfileUpdate }) {
  const current = profile?.profile_modules?.visibility || "public";
  const [vis,    setVis]    = useState(current);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState(null);

  const save = async () => {
    setSaving(true); setError(null);
    const pm = profile?.profile_modules || {};
    const { error:err } = await supabase.from("profiles").update({
      profile_modules:{ ...pm, visibility:vis },
    }).eq("id", profile.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true); setTimeout(()=>setSaved(false), 2500);
    onProfileUpdate?.({ ...profile, profile_modules:{ ...(profile?.profile_modules||{}), visibility:vis } });
  };

  return (
    <Row label="Profil-Sichtbarkeit" last>
      {VISIBILITY_OPTIONS.map(opt => (
        <button key={opt.value} onClick={() => setVis(opt.value)}
          style={{ width:"100%", display:"flex", alignItems:"center", gap:12,
            padding:"10px 12px", marginBottom:6, borderRadius:10, cursor:"pointer",
            border:"1.5px solid " + (vis===opt.value ? T.teal : T.border),
            background:vis===opt.value ? T.tealSoft : "#FAFAF8",
            fontFamily:"inherit", textAlign:"left", transition:"all 0.12s" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:vis===opt.value?600:400, color:T.ink }}>
              {opt.label}
            </div>
            <div style={{ fontSize:11, color:T.inkSoft, marginTop:2 }}>{opt.desc}</div>
          </div>
          {vis===opt.value && <span style={{ color:T.teal, fontSize:16 }}>✓</span>}
        </button>
      ))}
      <SaveRow onSave={save} saving={saving} saved={saved} error={error}/>
    </Row>
  );
}

// ── Haupt-Komponente ─────────────────────────────────────────
export default function SettingsModal({ profile: profileProp, onClose, onProfileUpdate, onOpenBookings, onEditProfile }) {
  // Profil aus prop ODER direkt aus AuthContext (Fallback wenn prop noch null)
  const { profile: authCtxProfile } = useAuth() || {};
  const profile = profileProp || authCtxProfile || null;
  if (!profile) return null;
  const [view, setView] = useState("main"); // "main" | "edit" | "privacy" | "contact" | "security"

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const overlay = {
    position:"fixed", inset:0, zIndex:10200,
    background:"rgba(10,10,8,0.55)", backdropFilter:"blur(4px)",
    display:"flex", alignItems:"flex-end", justifyContent:"center",
    paddingBottom:64, // Navbar-Höhe — Sheet endet über der Navbar
  };
  const sheet = {
    background:T.bg, borderRadius:"20px 20px 0 0",
    width:"100%", maxWidth:560,
    maxHeight:"calc(92dvh - 64px)", overflowY:"auto",
    boxShadow:"0 -8px 40px rgba(0,0,0,0.18)",
    paddingBottom:"env(safe-area-inset-bottom, 16px)",
  };
  const header = {
    display:"flex", alignItems:"center", justifyContent:"space-between",
    padding:"18px 18px 13px", position:"sticky", top:0,
    background:T.bg, borderBottom:"1px solid "+T.border,
    borderRadius:"20px 20px 0 0", zIndex:1,
  };

  // Titel je nach View
  const titles = {
    main:     "Einstellungen",
    contact:  "📬 Persönliche Daten",
    security: "Sicherheit",
    privacy:  "🕵️ Privatsphäre",
  };

  return createPortal(
    <div style={overlay} onClick={e=>{ if(e.target===e.currentTarget) onClose?.(); }}>
      <div style={sheet}>

        {/* ── Header ── */}
        <div style={header}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {view !== "main" && (
              <button onClick={()=>setView("main")} style={{ background:"none", border:"none",
                cursor:"pointer", fontSize:20, color:T.inkSoft, padding:"0 6px 0 0",
                display:"flex", alignItems:"center" }}>‹</button>
            )}
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {view==="main" && <HUISettingsIcon size={16}/>}
              <div style={{ fontSize:17, fontWeight:700, color:T.ink }}>
                {titles[view] || "Einstellungen"}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(26,26,24,0.07)", border:"none",
            borderRadius:"50%", width:34, height:34, fontSize:16, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        {/* ── Inhalt ── */}
        <div style={{ padding:"18px 14px 30px" }}>

          {/* ══ MAIN VIEW ══════════════════════════════════════ */}
          {view === "main" && (<>

            {/* Ein Block: Profil bearbeiten / Sicherheit / Abmelden */}
            <Section title="Account & Sicherheit" icon={<HUIProfilIcon size={16}/>}>
              <NavItem icon={<HUIProfilIcon size={16}/>} label="Profil bearbeiten"
                onClick={() => { onClose?.(); onEditProfile?.(); }}/>
              <NavItem icon={<HUISicherheitIcon size={16}/>} label="Sicherheit & Passwort"
                onClick={() => setView("security")}/>
              <NavItem icon={<HUIAbmeldenIcon size={16}/>} label="Abmelden"
                onClick={logout} danger last/>
            </Section>

            {/* Brand Footer */}
            <div style={{
              display:"flex", flexDirection:"column", alignItems:"center",
              padding:"28px 0 8px", gap:6,
            }}>
              <HUILogoWordmark logoSize={32}/>
              <div style={{ fontSize:10.5, color:"rgba(26,26,24,0.25)", letterSpacing:"0.05em" }}>
                v{APP_VERSION}
              </div>
            </div>

          </>)}


          {/* ══ VERIFIZIERUNG ══════════════════════════════════ */}
          {view === "verification" && (<>
            <Section title="Verifizierung" icon={<HUIVerifIcon size={16}/>}>
              <div style={{padding:"14px 16px"}}>
                <div style={{fontSize:13,color:"#555",lineHeight:1.65}}>
                  Die Identitäts-Verifizierung ist in Kürze verfügbar. Damit stärkst du das Vertrauen in deiner HUI-Gemeinschaft.
                </div>
                <div style={{
                  marginTop:14, padding:"10px 14px", borderRadius:10,
                  background:"rgba(14,196,184,0.07)", border:"1px solid rgba(14,196,184,0.2)",
                  fontSize:12, color:"#0EC4B8", fontWeight:600,
                }}>
                  🔜 Bald verfügbar
                </div>
              </div>
            </Section>
          </>)}

          {/* ══ MITGLIEDSCHAFT ════════════════════════════════ */}
          {view === "membership" && (<>
            <Section title="Mitgliedschaftsinformation" icon={<HUIMitgliedIcon size={16}/>}>
              <div style={{padding:"14px 16px"}}>
                <div style={{
                  padding:"12px 14px", borderRadius:10,
                  background:"rgba(14,196,184,0.07)", border:"1px solid rgba(14,196,184,0.15)",
                  marginBottom:12,
                }}>
                  <div style={{fontSize:11,fontWeight:700,color:"#0EC4B8",marginBottom:4}}>Status</div>
                  <div style={{fontSize:14,fontWeight:800,color:"#1A1A18"}}>
                    {profile?.is_talent ? "✨ HUI-Talent" : "🌿 HUI-Mitglied"}
                  </div>
                  {profile?.talent_since && (
                    <div style={{fontSize:11,color:"#888",marginTop:4}}>
                      Talent seit: {new Date(profile.talent_since).toLocaleDateString("de-DE")}
                    </div>
                  )}
                </div>
                <div style={{fontSize:12,color:"#888",lineHeight:1.6}}>
                  Deine Mitgliedschaft bei HUI ist kostenlos und basiert auf echter Gemeinschaft. Premium-Funktionen kommen bald.
                </div>
              </div>
            </Section>
          </>)}

          {/* ══ PERSÖNLICHE DATEN ══════════════════════════════ */}
          {view === "contact" && (<>
            <Section title="Name" icon={<HUIProfilIcon size={16}/>}>
              <NameBlock profile={profile} onProfileUpdate={onProfileUpdate}/>
            </Section>
            <Section title="Kontakt" icon={<HUIKontaktIcon size={16}/>}>
              <EmailBlock profile={profile} onProfileUpdate={onProfileUpdate}/>
              <PhoneBlock profile={profile} onProfileUpdate={onProfileUpdate}/>
            </Section>
          </>)}

          {/* ══ SICHERHEIT ═════════════════════════════════════ */}
          {view === "security" && (<>
            <Section title="Passwort ändern" icon={<HUISicherheitIcon size={16}/>}>
              <PasswordBlock/>
            </Section>
            <Section title="E-Mail ändern" icon={<HUIMailIcon size={16}/>}>
              <EmailChangeBlock profile={profile} onProfileUpdate={onProfileUpdate}/>
            </Section>
          </>)}

          {/* ══ PRIVATSPHÄRE ═══════════════════════════════════ */}
          {view === "privacy" && (
            <Section title="Profil-Sichtbarkeit" icon={<HUIDatenschutzIcon size={16}/>}>
              <PrivacyBlock profile={profile} onProfileUpdate={onProfileUpdate}/>
            </Section>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
