import { platformPath, getAuthRedirectUrl } from '../../lib/platform.js';
import { HUIAbmeldenIcon, HUIDatenschutzIcon, HUIKalenderIcon, HUIKontaktIcon, HUIMitgliedIcon, HUIProfilIcon, HUISettingsIcon, HUISicherheitIcon, HUIVerifIcon, HUIMailIcon, HUIFinanzIcon, HUISpracheIcon } from '../../design/icons/HuiSystemIcons.jsx';
import { SUPPORTED_LANGS, LANG_LABELS, LANG_FLAGS } from '../../i18n/index.js';
import BankdatenModal from './BankdatenModal.jsx';
// src/components/settings/SettingsModal.jsx
// ── HUI Einstellungs-Modal v2 ─────────────────────────────────
// Enthält: Profil bearbeiten | Buchungen | Privatsphäre | Abmelden
// + Name | E-Mail | Passwort ändern
import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../lib/AuthContext.jsx";
import { supabase } from "../../lib/supabaseClient.js";
import { HUILogoWordmark } from '../brand/HUILogo.jsx';
import SupportPage from '../../pages/studio/SupportPage.jsx';
import PushNotificationBlock from './PushNotificationBlock.jsx';
import MeineTicketsPage from '../../pages/studio/MeineTicketsPage.jsx';
import { APP_VERSION } from '../../version.ts';
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { useKeyboardInset } from "../../hooks/useKeyboardInset.js";
import { getOTAStatus, checkForUpdate } from "../../lib/otaUpdate.js";
import { formatDateDE } from "../../lib/formatters.js";
import { Capacitor } from "@capacitor/core";
import {
  checkBiometricAvailability,
  isBiometricEnabled,
  isPINEnabled,
  authenticateWithBiometric,
  enableBiometric,
  setPIN as saveNewPIN,
  clearSavedSession,
  disableBiometric,
  disablePIN,
} from "../../lib/biometricService.js";
import { useTranslation } from "../../hooks/useTranslation.js";

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

      <div style={{ fontSize:11, fontWeight: 600, color:T.inkSoft,
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
  const { t } = useTranslation();
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:10 }}>
      <button onClick={onSave} disabled={saving}
        style={{ ...btnPrimary, opacity:saving?0.6:1 }}>
        {saving?t("sm.saving"):t("sm.save")}
      </button>
      {saved && <span style={{ fontSize:12, color:T.teal, fontWeight:600 }}>{t("sm.saved")}</span>}
      {error && <span style={{ fontSize:12, color:T.danger }}>{error}</span>}
    </div>
  );
}

// ── Navigation: Profil bearbeiten + Buchungen ─────────────────
function NavItem({ icon, label, onClick = () => {}, danger = false, last = false, right = null }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={() => onClick?.()}
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
      {right}
      <span style={{ fontSize:16, color:T.inkFaint }}>›</span>
    </button>
  );
}

// ── Block: Name ───────────────────────────────────────────────
function NameBlock({ profile = {}, onProfileUpdate = () => {} }) {
  const { t } = useTranslation();
  // profiles-Tabelle hat keine first_name/last_name — nur full_name + display_name.
  // Wir splitten full_name beim Laden und schreiben beim Speichern beides zurück.
  const _parts = (profile?.full_name || profile?.display_name || "").split(" ");
  const [first, setFirst] = useState(_parts[0] || "");
  const [last,  setLast]  = useState(_parts.slice(1).join(" ") || "");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState(null);

  const save = async () => {
    if (!profile?.id) return;
    setSaving(true); setError(null); setSaved(false);
    const full_name = [first.trim(), last.trim()].filter(Boolean).join(" ");
    const display_name = full_name;
    const { error:err } = await supabase.from("profiles").update({
      full_name, display_name, updated_at: new Date().toISOString(),
    }).eq("id", profile.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true); setTimeout(() => setSaved(false), 2500);
    onProfileUpdate?.({ ...profile, full_name, display_name });
  };

  return (
    <Row label={t("sm.name")} last>
      <div style={{ display:"flex", gap:8, marginBottom:4 }}>
        <input value={first} onChange={e=>setFirst(e.target.value)}
          placeholder={t("sm.ph.firstname")} style={inp}
          name="given-name" type="text" autoComplete="given-name"
          autoCorrect="on" autoCapitalize="words" inputMode="text"
          onFocus={e=>e.target.style.borderColor=T.teal}
          onBlur={e=>e.target.style.borderColor=T.border}/>
        <input value={last} onChange={e=>setLast(e.target.value)}
          placeholder={t("sm.ph.lastname")} style={inp}
          name="family-name" type="text" autoComplete="family-name"
          autoCorrect="on" autoCapitalize="words" inputMode="text"
          onFocus={e=>e.target.style.borderColor=T.teal}
          onBlur={e=>e.target.style.borderColor=T.border}/>
      </div>
      <SaveRow onSave={save} saving={saving} saved={saved} error={error}/>
    </Row>
  );
}

// ── Block: E-Mail ─────────────────────────────────────────────
function EmailBlock({ profile = {}, onProfileUpdate = () => {} }) {
  const { t } = useTranslation();
  // email direkt aus Supabase Auth holen
  const [email, setEmail] = useState(profile?.email || "");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState(null);

  const save = async () => {
    if (!profile?.id) return;
    setSaving(true); setError(null); setSaved(false);
    if (!email.includes("@")) { setError(t("sm.email.invalid")); setSaving(false); return; }
    // BUGFIX 2026-08-15 (gleiche Klasse wie EmailChangeBlock/LoginPage.jsx signUp()):
    // emailRedirectTo ergänzt — ohne diese Option faellt Supabase auf den
    // site_url-Fallback (Marketing-Landingpage) zurueck statt auf /auth/callback.
    const { error:authErr } = await supabase.auth.updateUser(
      { email:email.trim() },
      { emailRedirectTo: getAuthRedirectUrl() }
    );
    if (authErr) { setError(authErr.message); setSaving(false); return; }
    await supabase.from("profiles").update({ email:email.trim(), updated_at: new Date().toISOString() }).eq("id", profile.id);
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),5000);
    onProfileUpdate?.({ ...profile, email:email.trim() });
  };

  return (
    <Row label={t("sm.email.label")}>
      <input value={email} onChange={e=>setEmail(e.target.value)}
        placeholder={t("sm.email.ph")} type="email" style={inp}
        name="email" autoComplete="email" autoCorrect="off" autoCapitalize="none"
        inputMode="email"
        onFocus={e=>e.target.style.borderColor=T.teal}
        onBlur={e=>e.target.style.borderColor=T.border}/>
      {saved && <div style={{ fontSize:12, color:T.teal, marginTop:6 }}>
        {t("sm.email.confirm")}</div>}
      <SaveRow onSave={save} saving={saving} saved={false} error={error}/>
    </Row>
  );
}


// ── Block: Passwort ───────────────────────────────────────────
function PasswordBlock() {
  const { t } = useTranslation();
  const [next,    setNext]    = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState(null);

  const save = async () => {
    setError(null); setSaved(false);
    if (next.length < 8) { setError(t("sm.pw.tooShort")); return; }
    if (next !== confirm)  { setError(t("sm.pw.mismatch")); return; }
    setSaving(true);
    const { error:err } = await supabase.auth.updateUser({ password:next });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true); setNext(""); setConfirm("");
    setTimeout(()=>setSaved(false), 3000);
  };

  return (
    <Row label={t("sm.pw.label")} last>
      <input value={next} onChange={e=>setNext(e.target.value)}
        placeholder={t("sm.pw.ph.new")} type="password"
        style={{ ...inp, marginBottom:8 }}
        name="new-password" autoComplete="new-password" autoCorrect="off"
        autoCapitalize="none" inputMode="text"
        onFocus={e=>e.target.style.borderColor=T.teal}
        onBlur={e=>e.target.style.borderColor=T.border}/>
      <input value={confirm} onChange={e=>setConfirm(e.target.value)}
        placeholder={t("sm.pw.ph.confirm")} type="password" style={inp}
        name="confirm-new-password" autoComplete="new-password" autoCorrect="off"
        autoCapitalize="none" inputMode="text"
        onFocus={e=>e.target.style.borderColor=T.teal}
        onBlur={e=>e.target.style.borderColor=T.border}/>
      <SaveRow onSave={save} saving={saving} saved={saved} error={error}/>
      {saved && (
        <div style={{ marginTop:8, fontSize:12, color:T.teal, lineHeight:1.4 }}>
          {t("sm.pw.success")}
        </div>
      )}
    </Row>
  );
}

// ── Block: E-Mail ändern ─────────────────────────────────────
function EmailChangeBlock({ profile, onProfileUpdate }) {
  const { t } = useTranslation();
  // supabase ist modul-importiert (oben in Datei), nicht aus useAuth
  const [oldEmail, setOldEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState(null);

  const save = async () => {
    setError(null); setSaved(false);
    if (!oldEmail.trim()) { setError(t("sm.emailChange.currentEmpty")); return; }
    if (!newEmail.includes("@")) { setError(t("sm.emailChange.invalid")); return; }
    setSaving(true);
    try {
      // BUGFIX 2026-08-15: Root Cause war profiles.email — diese DB-Spalte war für
      // 176/204 Nutzer NULL (handle_new_user() Trigger setzte sie nie, siehe Migration
      // 114). Validierung gegen profile.email schlug daher fehl, obwohl der Nutzer die
      // korrekte, tatsächliche Login-E-Mail eingab ("Aktuelle E-Mail stimmt nicht
      // überein" trotz korrekter Eingabe). Fix: Live-Session (auth.users via
      // getUser()) ist SSOT für die aktuelle Login-E-Mail — NIE die denormalisierte
      // profiles.email-Kopie zur Validierung heranziehen, die veralten/NULL sein kann.
      const { data: liveUser, error: liveErr } = await supabase.auth.getUser();
      if (liveErr || !liveUser?.user?.email) throw new Error(t("sm.emailChange.session"));
      const currentEmail = liveUser.user.email;
      if (oldEmail.trim().toLowerCase() !== currentEmail.toLowerCase()) {
        throw new Error(t("sm.emailChange.mismatch"));
      }
      if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
        throw new Error(t("sm.emailChange.identical"));
      }
      // 1. Supabase Auth E-Mail ändern (sendet Bestätigungs-Mail an neue Adresse).
      // BUGFIX 2026-08-15 (gleiche Klasse wie LoginPage.jsx signUp()): OHNE
      // emailRedirectTo faellt Supabase auf den site_url-Fallback zurueck
      // (Marketing-Landingpage) statt auf /auth/callback zu leiten.
      const { error: authErr } = await supabase.auth.updateUser(
        { email: newEmail.trim() },
        { emailRedirectTo: getAuthRedirectUrl() }
      );
      if (authErr) throw new Error(authErr.message);
      // 2. profiles-Tabelle sofort mitziehen (optimistisch — die eigentliche
      // Auth-E-Mail wechselt erst nach Bestätigung des Links, siehe unten)
      await supabase.from("profiles")
        .update({ email: newEmail.trim(), updated_at: new Date().toISOString() })
        .eq("id", profile?.id);
      // 3. UI-Zustand aktualisieren
      onProfileUpdate?.({ ...profile, email: newEmail.trim() });
      setSaved(true); setOldEmail(""); setNewEmail("");
      setTimeout(() => setSaved(false), 8000);
    } catch(e) {
      setError(e.message || t("sm.emailChange.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Row label={t("sm.emailChange.current")}>
      <input value={oldEmail} onChange={e=>setOldEmail(e.target.value)}
        placeholder={t("sm.emailChange.ph.current")} type="email"
        style={{ ...inp, marginBottom:8 }}
        name="email" autoComplete="email" autoCorrect="off" autoCapitalize="none"
        inputMode="email"
        onFocus={e=>e.target.style.borderColor=T.teal}
        onBlur={e=>e.target.style.borderColor=T.border}/>
      <input value={newEmail} onChange={e=>setNewEmail(e.target.value)}
        placeholder={t("sm.emailChange.new")} type="email" style={inp}
        name="new-email" autoComplete="off" autoCorrect="off" autoCapitalize="none"
        inputMode="email"
        onFocus={e=>e.target.style.borderColor=T.teal}
        onBlur={e=>e.target.style.borderColor=T.border}/>
      <SaveRow onSave={save} saving={saving} saved={saved} error={error}/>
      {saved && (
        <div style={{ marginTop:8, fontSize:12, color:T.teal, lineHeight:1.4 }}>
          {t("sm.emailChange.success")}
        </div>
      )}
    </Row>
  );
}

// ── Block: Privatsphäre ───────────────────────────────────────
function getVisibilityOptions(t) {
  return [
  { value:"public",      label:t("sm.visibility.public"),        desc:t("sm.visibility.public.desc") },
  { value:"connections", label:t("sm.visibility.connections"),      desc:t("sm.visibility.connections.desc") },
  { value:"private",     label:t("sm.visibility.private"),            desc:t("sm.visibility.private.desc") },
  ];
}

function PrivacyBlock({ profile, onProfileUpdate }) {
  const { t } = useTranslation();
  const VISIBILITY_OPTIONS = getVisibilityOptions(t);
  const current = profile?.profile_modules?.visibility || "public";
  const [vis,    setVis]    = useState(current);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState(null);

  const save = async () => {
    if (!profile?.id) return;
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
    <Row label={t("sm.visibility.label")} last>
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
export default function SettingsModal({ profile: profileProp, onClose, onProfileUpdate = () => {}, onOpenBookings = () => {}, onEditProfile = () => {}, autoOpenBankdaten = false }) {
  const { t, lang, changeLang } = useTranslation();
  useModalRegistration(true, onClose, "SettingsModal");

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    (async () => {
      const bioOn = await isBiometricEnabled();
      const pinOn = await isPINEnabled();
      setBiometricEnabled(bioOn || pinOn);
    })();
  }, []);
  // Profil aus prop ODER direkt aus AuthContext (Fallback wenn prop noch null)
  const { profile: authCtxProfile } = useAuth() || {};
  const profile = profileProp || authCtxProfile || null;
  // HOOK-ORDER-FIX (2026-08-08): useState/useKeyboardInset standen vorher
  // NACH "if (!profile) return null" -- sobald profile kurzzeitig null war
  // (z.B. wenn authCtxProfile noch nicht geladen), ueberspreng React diese
  // Hooks fuer den Render, was beim naechsten Render (profile vorhanden)
  // zu einer anderen Hook-Reihenfolge fuehrte -> "Minified React error #310".
  const [view, setView] = useState("main"); // "main" | "edit" | "privacy" | "contact" | "security" | "support" | "tickets"
  const [showTutorialConfirm, setShowTutorialConfirm] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false); // SPRACHAUSWAHL (2026-08-27)
  const [showBankdaten, setShowBankdaten] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showBioPINSetup,  setShowBioPINSetup]  = useState(false);
  const [bioPinStep,       setBioPinStep]       = useState("first"); // first | confirm
  const [bioPinFirst,      setBioPinFirst]      = useState("");
  const [bioPinSecond,     setBioPinSecond]     = useState("");
  const [bioPinError,      setBioPinError]      = useState(null);
  const [bioIsNative]                           = useState(() => Capacitor.isNativePlatform());
  const [pinEnabled, setPinEnabled]               = useState(false);
  const [bioAvailable, setBioAvailable]            = useState(false);
  const [bioReasonCode, setBioReasonCode]          = useState(null); // Diagnose: nativer code/reason wenn nicht verfügbar
  // BANKDATEN-LINK (2026-08-16): Wenn von Notification-Deep-Link geöffnet,
  // automatisch Bankdaten-Sub-Modal öffnen.
  useEffect(() => {
    if (autoOpenBankdaten) setShowBankdaten(true);
  }, [autoOpenBankdaten]);
  const [bankStatus, setBankStatus] = useState(null); // { has_bank_details, bank_iban_last4 }
  useEffect(() => {
    if (!profile?.id) return;
    supabase.rpc("rpc_get_ambassador_bank_status", { p_ambassador_id: profile.id })
      .then(({ data }) => setBankStatus(data))
      .catch(() => {});
  }, [profile?.id]);
  const kbdInset = useKeyboardInset();
  if (!profile) return null;

  // ── Init: Status von Biometrie + PIN laden ──────────────────────
  useEffect(() => {
    if (!bioIsNative) return;
    (async () => {
      const bioOn = await isBiometricEnabled();
      const pinOn = await isPINEnabled();
      const avail = await checkBiometricAvailability();
      setBiometricEnabled(bioOn);
      setPinEnabled(pinOn);
      setBioAvailable(avail.available);
      setBioReasonCode(avail.available ? null : (avail.code || null));
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Biometrie Toggle (unabhängig von PIN) ─────────────────────
  const handleBiometricToggle = useCallback(async () => {
    if (biometricEnabled) {
      await disableBiometric();
      setBiometricEnabled(false);
      return;
    }
    if (!bioAvailable) return; // Toggle ist disabled — wird durch UI blockiert
    // Biometrie-Sensor verfügbar → Fingerabdruck-Scan auslösen
    const success = await authenticateWithBiometric();
    if (success) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.refresh_token && session?.user?.email) {
        await enableBiometric(session.user.email, session.refresh_token);
        setBiometricEnabled(true);
      }
    }
  }, [biometricEnabled, bioAvailable]);

  // ── PIN Toggle (unabhängig von Biometrie) ─────────────────────
  const handlePinToggle = useCallback(async () => {
    if (pinEnabled) {
      await disablePIN();
      setPinEnabled(false);
      return;
    }
    // PIN aktivieren → Setup-Dialog öffnen
    setBioPinStep("first");
    setBioPinFirst("");
    setBioPinSecond("");
    setBioPinError(null);
    setShowBioPINSetup(true);
  }, [pinEnabled]);

  const finishBioPINSetup = useCallback(async (finalPin) => {
    await saveNewPIN(finalPin);
    setPinEnabled(true);
    setShowBioPINSetup(false);
    setBioPinFirst("");
    setBioPinSecond("");
    setBioPinStep("first");
  }, []);

  // Eigener In-App-Ziffernblock statt natives System-Keyboard (KEYBOARD-VISIBILITY-FIX,
  // 2026-08-29): Ein hidden <input autoFocus> öffnete auf Android/Xiaomi HyperOS das
  // native Tastatur-Overlay, das den bottom-anchored PIN-Dialog (position:fixed,
  // alignItems:"flex-end") komplett verdeckte -- der Dialog lag optisch HINTER der
  // Systemtastatur, ohne Keyboard-Inset-Anpassung. Fix: kein natives Keyboard mehr,
  // Ziffern werden über eigene Buttons erfasst -- Problem kann so nicht mehr auftreten.
  const handleBioPinDigit = useCallback((digit) => {
    setBioPinError(null);
    if (bioPinStep === "first") {
      setBioPinFirst(prev => {
        if (prev.length >= 6) return prev;
        const next = prev + digit;
        if (next.length === 6) {
          setTimeout(() => { setBioPinStep("confirm"); }, 180);
        }
        return next;
      });
    } else {
      setBioPinSecond(prev => {
        if (prev.length >= 6) return prev;
        const next = prev + digit;
        if (next.length === 6) {
          setTimeout(() => {
            setBioPinFirst(firstVal => {
              if (firstVal !== next) {
                setBioPinError(t("biometric.pinMismatch"));
                setBioPinSecond("");
              } else {
                finishBioPINSetup(next);
              }
              return firstVal;
            });
          }, 180);
        }
        return next;
      });
    }
  }, [bioPinStep, t, finishBioPINSetup]);

  const handleBioPinBackspace = useCallback(() => {
    setBioPinError(null);
    if (bioPinStep === "first") setBioPinFirst(prev => prev.slice(0, -1));
    else setBioPinSecond(prev => prev.slice(0, -1));
  }, [bioPinStep]);

  const logout = async () => {
    // Push-Tokens invalidieren vor dem Logout
    try { await import("../../lib/pushNotificationService.js").then(m => m.invalidateTokensOnLogout()); } catch(e) {}
    await supabase.auth.signOut();
    window.location.href = platformPath("/login");
  };

  const overlay = {
    position:"fixed", inset:0, zIndex:10500,
    background:"rgba(10,10,8,0.55)", backdropFilter:"blur(4px)",
    display:"flex", alignItems:"flex-end", justifyContent:"center",
    paddingBottom:"calc(64px + var(--hui-keyboard-inset, 0px))",
  };
  const sheet = {
    background:T.bg, borderRadius:"20px 20px 0 0",
    width:"100%", maxWidth:560,
    maxHeight:"calc(92dvh - 64px - var(--hui-keyboard-inset, 0px))",
    overflowY: "auto",
    boxShadow:"0 -8px 40px rgba(0,0,0,0.18)",
    paddingBottom: "max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 16px), 16px)",
  };
  const header = {
    display: view === "support" ? "none" : "flex",
    alignItems:"center", justifyContent:"space-between",
    padding:"max(var(--hui-safe-top, 0px), 18px, env(safe-area-inset-top, 18px)) 18px 13px",
    position:"sticky", top:0,
    background:T.bg, borderBottom:"1px solid "+T.border,
    borderRadius:"20px 20px 0 0", zIndex:1,
  };

  // Titel je nach View
  const titles = {
    main:      t("sm.title.main"),
    contact:   t("sm.title.contact"),
    security:  t("sm.title.security"),
    privacy:   t("sm.title.privacy"),
    biometric: t("biometric.settingsLabel"),
  };

  // Native Diagnose-Codes (@aparajita/capacitor-biometric-auth checkBiometry) → verständlicher Text
  const BIO_REASON_LABELS = {
    biometryNotEnrolled: t("biometric.reasonNotEnrolled"),   // Sensor da, aber kein Fingerabdruck im System hinterlegt
    biometryNotAvailable: t("biometric.reasonHwUnavailable"), // Hardware vorhanden, aktuell nicht verfügbar
    biometryLockout: t("biometric.reasonLockout"),            // Zu viele Fehlversuche, temporär gesperrt
  };

  return createPortal(
    <div style={overlay} onClick={e=>{ if(e.target===e.currentTarget) onClose?.(); }} role="button" tabIndex={0}>
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
              <div style={{ fontSize:17, fontWeight: 600, color:T.ink }}>
                {titles[view] || t("sm.title.main")}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(26,26,24,0.07)", border:"none",
            borderRadius:"50%", width:34, height:34, fontSize:16, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        {/* ── Inhalt ── */}
        <div style={{ padding: view === "support" ? 0 : "18px 14px 30px" }}>

          {/* ══ MAIN VIEW ══════════════════════════════════════ */}
          {view === "main" && (<>

            {/* Push-Notifications */}
            <Section title={t("sm.section.notifications")} icon={<HUISettingsIcon size={16}/>}>
              <PushNotificationBlock/>
            </Section>

            {/* Ein Block: Profil bearbeiten / Sicherheit / Abmelden */}
            <Section title={t("sm.section.account")} icon={<HUIProfilIcon size={16}/>}>
              <NavItem icon={<HUIProfilIcon size={16}/>} label={t("sm.nav.editProfile")}
                onClick={() => onEditProfile?.()}/>
              <NavItem
                icon={<HUIFinanzIcon size={16}/>}
                label={t("sm.nav.bankdata")}
                onClick={() => setShowBankdaten(true)}
                right={bankStatus?.has_bank_details ? (
                  <span style={{ fontSize:11, fontWeight:600, color:T.teal, background:T.tealSoft, padding:"3px 8px", borderRadius:6, whiteSpace:"nowrap" }}>
                    •••• {bankStatus.bank_iban_last4 || "????"}
                  </span>
                ) : (
                  <span style={{ fontSize:11, fontWeight:600, color:"#B8860B", background:"rgba(184,134,11,0.10)", padding:"3px 8px", borderRadius:6, whiteSpace:"nowrap" }}>
                    {t("sm.nav.bankdata.missing")}
                  </span>
                )}
              />
              <NavItem icon={<HUISicherheitIcon size={16}/>} label={t("sm.nav.emailPw")}
                onClick={() => setView("security")}/>
              {bioIsNative && (
                <NavItem
                  icon={<HUISicherheitIcon size={16}/>}
                  label={t("biometric.settingsLabel")}
                  onClick={() => setView("biometric")}
                  right={(biometricEnabled || pinEnabled) ? (
                    <span style={{ fontSize:11, fontWeight:600, color:T.teal, background:T.tealSoft, padding:"3px 8px", borderRadius:6, whiteSpace:"nowrap" }}>
                      {t("biometric.settingsOn")}
                    </span>
                  ) : null}
                />
              )}
              <NavItem icon={<HUIKontaktIcon size={16}/>} label={t("sm.nav.support")}
                onClick={() => setView("support")}/>
              <NavItem icon={<HUIMailIcon size={16}/>} label={t("sm.nav.tickets")}
                onClick={() => setView("tickets")}/>
              <NavItem icon={<HUISettingsIcon size={16}/>} label={t("sm.nav.tutorial")}
                onClick={() => setShowTutorialConfirm(true)}/>
              <NavItem icon={<HUISpracheIcon size={16}/>} label={t("sm.nav.language")}
                onClick={() => setShowLangModal(true)}
                right={<span style={{ fontSize:13, color:T.inkSoft, fontWeight:500 }}>{LANG_FLAGS[lang]} {lang.toUpperCase()}</span>}/>
              <NavItem icon={<HUIAbmeldenIcon size={16}/>} label={t("sm.nav.logout")}
                onClick={logout} danger last/>
            </Section>

            {showBioPINSetup && createPortal(
          <div
            onClick={() => { setShowBioPINSetup(false); setBioPinError(null); }}
            style={{
              position:"fixed", inset:0, zIndex:10600,
              background:"rgba(26,26,24,0.55)",
              display:"flex", alignItems:"flex-end", justifyContent:"center",
              fontFamily:"Inter,sans-serif",
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width:"100%", maxWidth:480,
                background:T.bg, borderRadius:"24px 24px 0 0",
                padding:"0 0 calc(max(env(safe-area-inset-bottom, 0px), 16px) + 24px)",
                boxShadow:"0 -4px 32px rgba(26,26,24,0.20)",
                overflow:"hidden",
              }}
            >
              <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 0" }}>
                <div style={{ width:36, height:4, borderRadius:99, background:"rgba(26,26,24,0.12)" }} />
              </div>

              <div style={{ padding:"24px 20px 0" }}>
                <div style={{ fontSize:20, fontWeight:600, color:T.ink, letterSpacing:-0.4, marginBottom:4 }}>
                  {t("biometric.setupPIN")}
                </div>
                <div style={{ fontSize:13, color:T.inkSoft, marginBottom:24 }}>
                  {bioPinStep === "first" ? t("biometric.setupPIN") : t("biometric.confirmPIN")}
                </div>

                <div style={{ display:"flex", gap:14, justifyContent:"center", marginBottom:24 }}>
                  {Array.from({ length: 6 }).map((_, i) => {
                    const val = bioPinStep === "first" ? bioPinFirst : bioPinSecond;
                    return (
                      <div key={i} style={{
                        width:16, height:16, borderRadius:"50%",
                        border:`2px solid ${i < val.length ? T.teal : "rgba(26,26,24,0.15)"}`,
                        background: i < val.length ? T.teal : "transparent",
                        transition:"all 0.15s ease",
                      }} />
                    );
                  })}
                </div>

                {bioPinError && (
                  <div style={{ fontSize:13, color:T.danger, textAlign:"center", marginBottom:16 }}>
                    {bioPinError}
                  </div>
                )}

                {/* Eigener Ziffernblock — kein natives Keyboard (siehe Kommentar oben) */}
                <div style={{
                  display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12,
                  marginBottom: bioPinError ? 8 : 24,
                }}>
                  {["1","2","3","4","5","6","7","8","9"].map((d) => (
                    <button
                      key={d}
                      onClick={() => handleBioPinDigit(d)}
                      style={{
                        padding:"16px 0", borderRadius:16, border:"none",
                        background:T.bgCard, color:T.ink,
                        fontSize:20, fontWeight:600,
                        cursor:"pointer", touchAction:"manipulation",
                        boxShadow:"0 1px 2px rgba(26,26,24,0.06)",
                      }}
                    >
                      {d}
                    </button>
                  ))}
                  <div />
                  <button
                    onClick={() => handleBioPinDigit("0")}
                    style={{
                      padding:"16px 0", borderRadius:16, border:"none",
                      background:T.bgCard, color:T.ink,
                      fontSize:20, fontWeight:600,
                      cursor:"pointer", touchAction:"manipulation",
                      boxShadow:"0 1px 2px rgba(26,26,24,0.06)",
                    }}
                  >
                    0
                  </button>
                  <button
                    onClick={handleBioPinBackspace}
                    aria-label="Backspace"
                    style={{
                      padding:"16px 0", borderRadius:16, border:"none",
                      background:"none", color:T.inkSoft,
                      fontSize:18, fontWeight:600,
                      cursor:"pointer", touchAction:"manipulation",
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}
                  >
                    ⌫
                  </button>
                </div>

                <button
                  onClick={() => { setShowBioPINSetup(false); setBioPinError(null); setBioPinFirst(""); setBioPinSecond(""); setBioPinStep("first"); }}
                  style={{
                    width:"100%", padding:"12px", marginTop:8,
                    background:"none", border:"none",
                    color:T.inkFaint, fontSize:13,
                    cursor:"pointer", textDecoration:"underline",
                    touchAction:"manipulation",
                  }}
                >
                  {t("sm.nav.logout") === "Abmelden" ? "Abbrechen" : "Cancel"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {showBankdaten && (
              <BankdatenModal
                userId={profile.id}
                onClose={() => setShowBankdaten(false)}
                onSaved={() => {
                  // Bank-Status neu laden nach Speichern
                  supabase.rpc("rpc_get_ambassador_bank_status", { p_ambassador_id: profile.id })
                    .then(({ data }) => setBankStatus(data))
                    .catch(() => {});
                }}
              />
            )}

            {/* OTA Update-Check (2026-08-08) */}
            <OTAUpdateSection/>

            {/* Brand Footer */}
            <div style={{
              display:"flex", flexDirection:"column", alignItems:"center",
              padding:"28px 0 8px", gap:6,
            }}>
              <HUILogoWordmark logoSize={32}/>
              {/* 2026-08-11 FIX: Michael-Report — Versionsnummer war fast unlesbar
                  blass (Opacity 0.25). Jetzt dunkler/schwarz für Lesbarkeit,
                  gleiche Konvention wie andere Fließtext-Labels im Profil. */}
              <div style={{ fontSize:10.5, color:"rgba(26,26,24,0.75)", letterSpacing:"0.05em" }}>
                v{APP_VERSION}
              </div>
            </div>

          </>)}



          {/* TUTORIAL-RESTART-BESTATIGUNG */}
          {showTutorialConfirm && createPortal(
            <div style={{
              position:"fixed", inset:0, zIndex:10600,
              display:"flex", alignItems:"center", justifyContent:"center",
              background:"rgba(10,10,8,0.55)", backdropFilter:"blur(4px)",
              WebkitBackdropFilter:"blur(4px)",
            }}>
              <div style={{
                background:"#FDFBF8", borderRadius:24, padding:"28px 24px 24px",
                maxWidth:340, width:"calc(100% - 48px)",
                boxShadow:"0 8px 40px rgba(0,0,0,0.25)",
                textAlign:"center", fontFamily:"Inter, sans-serif",
              }}>
                <h2 style={{ fontSize:20, fontWeight:700, color:"#1A1A18", margin:"0 0 10px" }}>
                  {t("sm.tutorial.title")}
                </h2>
                <p style={{ fontSize:15, fontWeight:600, color:"#1A1A18", margin:"0 0 4px", lineHeight:1.45 }}>
                  {t("sm.tutorial.body")}
                </p>
                <p style={{ fontSize:13, fontWeight:400, color:"rgba(26,26,24,0.6)", margin:"0 0 20px", lineHeight:1.45 }}>
                  {t("sm.tutorial.hint")}
                </p>
                <div style={{ display:"flex", gap:10 }}>
                  <button
                    onClick={() => setShowTutorialConfirm(false)}
                    style={{
                      flex:1, padding:"13px 20px", borderRadius:14,
                      border:"1.5px solid rgba(26,26,24,0.12)",
                      background:"transparent", color:"rgba(26,26,24,0.65)",
                      fontSize:15, fontWeight:600, fontFamily:"Inter, sans-serif",
                      cursor:"pointer", touchAction:"manipulation",
                      WebkitTapHighlightColor:"transparent",
                    }}
                  >{t("sm.tutorial.no")}</button>
                  <button
                    onClick={() => {
                      setShowTutorialConfirm(false);
                      if (onClose) onClose();
                      window.dispatchEvent(new CustomEvent("hui:navigate:tab", { detail: { tab: "home" } }));
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent("hui:restart-tutorial"));
                      }, 100);
                    }}
                    style={{
                      flex:1, padding:"13px 20px", borderRadius:14,
                      border:"none",
                      background:"linear-gradient(135deg, #16D7C5, #0DC4B5)",
                      color:"white", fontSize:15, fontWeight:600,
                      fontFamily:"Inter, sans-serif", cursor:"pointer",
                      boxShadow:"0 2px 12px rgba(22,215,197,0.35)",
                      touchAction:"manipulation", WebkitTapHighlightColor:"transparent",
                    }}
                  >{t("sm.tutorial.yes")}</button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* SPRACHAUSWAHL-MODAL (2026-08-27) — gleiches Muster wie
              Tutorial-Restart-Bestaetigung: eigener Portal, zIndex 10600
              (oberhalb des SettingsModal-Roots mit zIndex 10500). Liste
              aller SUPPORTED_LANGS aus i18n/index.js, aktive Sprache
              hervorgehoben, Auswahl ruft changeLang() (CustomEvent-
              basiert, kein Reload) und schliesst das Modal. */}
          {showLangModal && createPortal(
            <div
              onClick={() => setShowLangModal(false)}
              style={{
                position:"fixed", inset:0, zIndex:10600,
                display:"flex", alignItems:"center", justifyContent:"center",
                background:"rgba(10,10,8,0.55)", backdropFilter:"blur(4px)",
                WebkitBackdropFilter:"blur(4px)",
              }}>
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  background:"#FDFBF8", borderRadius:24, padding:"24px 20px 20px",
                  maxWidth:340, width:"calc(100% - 48px)", maxHeight:"70vh",
                  overflowY:"auto", WebkitOverflowScrolling:"touch",
                  boxShadow:"0 8px 40px rgba(0,0,0,0.25)",
                  fontFamily:"Inter, sans-serif",
                }}>
                <h2 style={{ fontSize:19, fontWeight:700, color:"#1A1A18", margin:"0 0 16px", textAlign:"center" }}>
                  {t("sm.lang.title")}
                </h2>
                <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                  {SUPPORTED_LANGS.map(l => (
                    <button
                      key={l}
                      onClick={() => { changeLang(l); setShowLangModal(false); }}
                      style={{
                        display:"flex", alignItems:"center", gap:12, width:"100%",
                        padding:"12px 14px", borderRadius:14, border:"none",
                        background: l === lang ? "rgba(14,196,184,0.10)" : "transparent",
                        cursor:"pointer", fontFamily:"inherit", touchAction:"manipulation",
                        WebkitTapHighlightColor:"transparent",
                      }}>
                      <span style={{ fontSize:20 }}>{LANG_FLAGS[l]}</span>
                      <span style={{ flex:1, textAlign:"left", fontSize:15, fontWeight: l===lang?700:500, color:"#1A1A18" }}>
                        {LANG_LABELS[l]}
                      </span>
                      {l === lang && <span style={{ color:"#0EC4B8", fontSize:16, fontWeight:700 }}>✓</span>}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowLangModal(false)}
                  style={{
                    marginTop:16, width:"100%", padding:"13px", borderRadius:14,
                    border:"1.5px solid rgba(26,26,24,0.12)",
                    background:"transparent", color:"rgba(26,26,24,0.65)",
                    fontSize:15, fontWeight:600, fontFamily:"Inter, sans-serif",
                    cursor:"pointer", touchAction:"manipulation",
                    WebkitTapHighlightColor:"transparent",
                  }}
                >{t("sm.lang.close")}</button>
              </div>
            </div>,
            document.body
          )}

          {/* ══ VERIFIZIERUNG ══════════════════════════════════ */}
          {view === "verification" && (<>
            <Section title={t("sm.verification.title")} icon={<HUIVerifIcon size={16}/>}>
              <div style={{padding:"14px 16px"}}>
                <div style={{fontSize:13,color:"#555",lineHeight:1.65}}>
                  {t("sm.verification.body")}
                </div>
                <div style={{
                  marginTop:14, padding:"10px 14px", borderRadius:10,
                  background:"rgba(14,196,184,0.07)", border:"1px solid rgba(14,196,184,0.2)",
                  fontSize:12, color:"#0EC4B8", fontWeight:600,
                }}>
                  {t("sm.verification.soon")}
                </div>
              </div>
            </Section>
          </>)}

          {/* ══ MITGLIEDSCHAFT ════════════════════════════════ */}
          {view === "membership" && (<>
            <Section title={t("settings.membershipInfo")} icon={<HUIMitgliedIcon size={16}/>}>
              <div style={{padding:"14px 16px"}}>
                <div style={{
                  padding:"12px 14px", borderRadius:10,
                  background:"rgba(14,196,184,0.07)", border:"1px solid rgba(14,196,184,0.15)",
                  marginBottom:12,
                }}>
                  <div style={{fontSize:11,fontWeight: 600,color:"#0EC4B8",marginBottom:4}}>Status</div>
                  <div style={{fontSize:14,fontWeight: 600,color:"#1A1A18"}}>
                    {profile?.is_talent ? t("sm.talentBadge") : t("sm.memberBadge")}
                  </div>
                  {profile?.talent_since && (
                    <div style={{fontSize:11,color:"#888",marginTop:4}}>
                      Talent seit: {formatDateDE(new Date(profile.talent_since))}
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
            <Section title={t("sm.name")} icon={<HUIProfilIcon size={16}/>}>
              <NameBlock profile={profile} onProfileUpdate={onProfileUpdate}/>
            </Section>
            <Section title="Kontakt" icon={<HUIKontaktIcon size={16}/>}>
              <EmailBlock profile={profile} onProfileUpdate={onProfileUpdate}/>
            </Section>
          </>)}

          {/* ══ SICHERHEIT ═════════════════════════════════════ */}
          {view === "tickets" && (
            <div style={{
              flex: 1,
              overflowY: "auto",
              paddingBottom: "max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 16px), 16px)",
            }}>
              <MeineTicketsPage
                onBack={() => setView("main")}
                userId={profile?.id}
                profile={profile}
              />
            </div>
          )}

          {view === "support" && (
              <SupportPage
                onBack={() => setView("main")}
                userId={profile?.id}
                userEmail={profile?.email}
                userName={profile?.display_name || profile?.full_name || ""}
              />
          )}

          {view === "security" && (<>
            <Section title={t("sm.pw.section")} icon={<HUISicherheitIcon size={16}/>}>
              <PasswordBlock/>
            </Section>
            <Section title={t("sm.emailChange.section")} icon={<HUIMailIcon size={16}/>}>
              <EmailChangeBlock profile={profile} onProfileUpdate={onProfileUpdate}/>
            </Section>
          </>)}

          {/* ══ BIOMETRIE / PIN ═══════════════════════════════════ */}
          {view === "biometric" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

              {/* Info-Text */}
              <div style={{
                fontSize:13, color:T.inkSoft, lineHeight:1.5,
                padding:"12px 14px", background:"rgba(14,196,184,0.06)",
                borderRadius:12,
              }}>
                {t("biometric.modalHint")}
              </div>

              {/* ── Biometrie ── */}
              <div style={{
                padding:"16px", borderRadius:16, background:T.bgCard,
                border:`1px solid ${biometricEnabled ? "rgba(14,196,184,0.25)" : "rgba(26,26,24,0.06)"}`,
              }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:600, color:T.ink }}>{t("biometric.labelBiometric")}</div>
                    <div style={{ fontSize:12, color:T.inkFaint, marginTop:2 }}>
                      {bioAvailable
                        ? t("biometric.biometricAvailable")
                        : (BIO_REASON_LABELS[bioReasonCode] || t("biometric.biometricUnavailable"))}
                    </div>
                  </div>
                  <button
                    onClick={handleBiometricToggle}
                    disabled={!bioAvailable && !biometricEnabled}
                    style={{
                      width:44, height:26, borderRadius:13, border:"none", cursor:"pointer",
                      padding:0, position:"relative",
                      background: biometricEnabled ? T.teal : "rgba(26,26,24,0.15)",
                      opacity: (!bioAvailable && !biometricEnabled) ? 0.4 : 1,
                      transition:"background 0.2s", touchAction:"manipulation",
                    }}
                    aria-label={biometricEnabled ? t("biometric.settingsOff") : t("biometric.settingsOn")}
                  >
                    <div style={{
                      position:"absolute", top:3, left: biometricEnabled ? 21 : 3,
                      width:20, height:20, borderRadius:"50%", background:"#fff",
                      boxShadow:"0 1px 3px rgba(0,0,0,0.2)",
                      transition:"left 0.2s ease",
                    }} />
                  </button>
                </div>
                {biometricEnabled && (
                  <div style={{ fontSize:12, color:T.teal, marginTop:4 }}>
                    ✓ {t("biometric.biometricActive")}
                  </div>
                )}
              </div>

              {/* ── PIN ── */}
              <div style={{
                padding:"16px", borderRadius:16, background:T.bgCard,
                border:`1px solid ${pinEnabled ? "rgba(14,196,184,0.25)" : "rgba(26,26,24,0.06)"}`,
              }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:600, color:T.ink }}>{t("biometric.labelPIN")}</div>
                    <div style={{ fontSize:12, color:T.inkFaint, marginTop:2 }}>
                      {pinEnabled ? t("biometric.pinChangeHint") : t("biometric.pinSetupHint")}
                    </div>
                  </div>
                  <button
                    onClick={handlePinToggle}
                    style={{
                      width:44, height:26, borderRadius:13, border:"none", cursor:"pointer",
                      padding:0, position:"relative",
                      background: pinEnabled ? T.teal : "rgba(26,26,24,0.15)",
                      transition:"background 0.2s", touchAction:"manipulation",
                    }}
                    aria-label={pinEnabled ? t("biometric.settingsOff") : t("biometric.settingsOn")}
                  >
                    <div style={{
                      position:"absolute", top:3, left: pinEnabled ? 21 : 3,
                      width:20, height:20, borderRadius:"50%", background:"#fff",
                      boxShadow:"0 1px 3px rgba(0,0,0,0.2)",
                      transition:"left 0.2s ease",
                    }} />
                  </button>
                </div>
                {pinEnabled && (
                  <button
                    onClick={() => {
                      setBioPinStep("first");
                      setBioPinFirst("");
                      setBioPinSecond("");
                      setBioPinError(null);
                      setShowBioPINSetup(true);
                    }}
                    style={{
                      marginTop:10, padding:"8px 14px", borderRadius:10,
                      background:"rgba(14,196,184,0.08)", border:"1px solid rgba(14,196,184,0.2)",
                      color:T.teal, fontSize:13, fontWeight:500,
                      cursor:"pointer", touchAction:"manipulation",
                    }}
                  >
                    {t("biometric.pinChange")}
                  </button>
                )}
              </div>

            </div>
          )}

          {/* ══ PRIVATSPHÄRE ═══════════════════════════════════ */}
          {view === "privacy" && (
            <Section title={t("sm.visibility.label")} icon={<HUIDatenschutzIcon size={16}/>}>
              <PrivacyBlock profile={profile} onProfileUpdate={onProfileUpdate}/>
            </Section>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}

// ═══════════════════════════════════════════════════════════════
// OTAUpdateSection — "Nach Updates suchen" Button (2026-08-08)
// ═══════════════════════════════════════════════════════════════
function OTAUpdateSection() {
  const { t } = useTranslation();
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    getOTAStatus().then(s => setStatus(s)).catch(() => {});
  }, []);

  const handleCheck = async () => {
    setChecking(true);
    setResult(null);
    try {
      const res = await checkForUpdate();
      setResult(res);
    } catch (err) {
      setResult({ available: false, error: err?.message || t("common.error") });
    }
    setChecking(false);
  };

  if (status && !status.native) return null; // Web — keine OTA-Updates

  return (
    <div style={{ padding: "12px 16px 0" }}>
      <button
        onClick={handleCheck}
        disabled={checking}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, padding: "12px 16px", borderRadius: 12,
          background: checking ? "rgba(13,196,181,0.06)" : "rgba(13,196,181,0.10)",
          border: "1px solid rgba(13,196,181,0.18)",
          color: "#0DC4B5", fontSize: 13, fontWeight: 600,
          cursor: checking ? "wait" : "pointer",
          opacity: checking ? 0.6 : 1,
          transition: "opacity .15s",
        }}
      >
        {checking ? t("sm.ota.checking") : t("sm.ota.check")}
      </button>
      {result?.available && (
        <div style={{
          marginTop: 10, padding: "10px 14px", borderRadius: 10,
          background: "rgba(13,196,181,0.08)", fontSize: 12,
          color: "#0DC4B5", lineHeight: 1.5, textAlign: "center",
        }}>
          {result.message || t("sm.ota.available", { latest: result.latest })}
        </div>
      )}
      {result && !result.available && !result.error && (
        <div style={{
          marginTop: 10, padding: "10px 14px", borderRadius: 10,
          background: "rgba(26,26,24,0.04)", fontSize: 12,
          color: "rgba(26,26,24,0.45)", textAlign: "center",
        }}>
          {t("sm.ota.latest", { current: result.current })}
        </div>
      )}
      {result?.error && (
        <div style={{
          marginTop: 10, padding: "10px 14px", borderRadius: 10,
          background: "rgba(244,115,85,0.06)", fontSize: 12,
          color: "#F47355", textAlign: "center",
        }}>
          {t("sm.ota.failed", { error: result.error })}
        </div>
      )}
    </div>
  );
}
