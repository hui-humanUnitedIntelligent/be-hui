import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { HUI } from "../design/hui.design.js";
import { HUILogoWordmark } from '../components/brand/HUILogo.jsx';
import NutzungsbedingungenModal from '../components/auth/NutzungsbedingungenModal.jsx';
import EmailVerificationModal from '../components/auth/EmailVerificationModal.jsx';
import { getAuthRedirectUrl } from '../lib/platform.js';
import { useTranslation } from '../hooks/useTranslation.js';
import { useKeyboardInset } from '../hooks/useKeyboardInset.js';

// ── Design Tokens ───────────────────────────────────────────────
const T = {
  teal:    HUI.COLOR.teal,
  teal2:   '#0FC4B2',
  coral:   HUI.COLOR.coral,
  white:   HUI.COLOR.white,
  ink:     '#0D0D0D',
  muted:   'rgba(255,255,255,0.55)',
  glass:   'rgba(255,255,255,0.07)',
  glassBorder: 'rgba(255,255,255,0.13)',
  glassFocus:  'rgba(22,215,197,0.35)',
  errorBg: 'rgba(255,138,107,0.15)',
};

// Cinematic Hintergrundbilder — atmosphärisch, warm, kreativ
const BG_IMAGES = [
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85', // Atelier warm
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=85', // kreative Arbeit
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85', // Natur tief
];


function GlassInput({
  type = 'text', value, onChange, placeholder, autoComplete, id, rightSlot,
  name, autoCorrect, autoCapitalize, inputMode, spellCheck, required,
}) {
  const [focused, setFocused] = useState(false);

  // System-Tastatur/AutoFill-Konfiguration (KEYBOARD-INPUT-FIX 2026-08-15):
  // name = autoComplete als Fallback, da Android/iOS AutoFill-Heuristiken
  // sowohl auf autoComplete als auch auf den name-Attributwert schauen.
  const resolvedName = name || autoComplete || id;
  // Sinnvolle Defaults je Feldtyp, sofern nicht explizit übergeben —
  // E-Mail/Passwort/Username: keine Autokorrektur/Großschreibung (stört beim Tippen
  // von Adressen/Zugangsdaten). Freitext (Name etc.) behält System-Standardverhalten.
  const isCredential = type === 'email' || type === 'password'
    || autoComplete === 'username' || autoComplete === 'off';
  const resolvedAutoCorrect   = autoCorrect   ?? (isCredential ? 'off' : 'on');
  const resolvedAutoCapitalize= autoCapitalize?? (isCredential ? 'none' : 'sentences');
  const resolvedInputMode     = inputMode     ?? (type === 'email' ? 'email' : 'text');

  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        name={resolvedName}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCorrect={resolvedAutoCorrect}
        autoCapitalize={resolvedAutoCapitalize}
        inputMode={resolvedInputMode}
        spellCheck={spellCheck ?? !isCredential}
        required={required}
        style={{
          width: '100%',
          padding: rightSlot ? '10px 42px 10px 14px' : '10px 14px',
          background: focused ? 'rgba(255,255,255,0.12)' : T.glass,
          border: `1.5px solid ${focused ? T.glassFocus : T.glassBorder}`,
          borderRadius: 14,
          fontSize: 14,
          color: T.white,
          outline: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          caretColor: T.teal,
          transition: 'background 250ms ease, border-color 250ms ease',
          WebkitTapHighlightColor: 'transparent',
          WebkitAppearance: 'none',
        }}
      />
      {rightSlot && (
        <div style={{
          position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
        }}>
          {rightSlot}
        </div>
      )}
      <style>{`
        input::placeholder { color: rgba(255,255,255,0.38); }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 100px #14161a inset !important;
          box-shadow: 0 0 0 100px #14161a inset !important;
          -webkit-text-fill-color: #fff !important;
          caret-color: #16D7C5;
          border-radius: 16px;
          transition: background-color 600000s ease-in-out 0s, color 600000s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
}

// ── Primary Button ───────────────────────────────────────────────
function PrimaryBtn({ children, onClick, type = 'button', disabled, loading }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%',
        padding: '11px',
        background: disabled
          ? 'rgba(22,215,197,0.35)'
          : 'linear-gradient(135deg, #16D7C5 0%, #0FC4B2 100%)',
        color: T.white,
        border: 'none',
        borderRadius: 16,
        fontSize: 17,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        letterSpacing: -0.2,
        boxShadow: disabled ? 'none' : '0 4px 24px rgba(22,215,197,0.40)',
        transition: 'transform 150ms ease, box-shadow 150ms ease, opacity 150ms ease',
        WebkitTapHighlightColor: 'transparent',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.965) translateY(1px)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      onTouchStart={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.965) translateY(1px)'; }}
      onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <LoadingDot />
          {children}
        </span>
      ) : children}
    </button>
  );
}

// ── Ghost Button ─────────────────────────────────────────────────
function GhostBtn({ children, onClick, style: extStyle }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        padding: '11px',
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: `1.5px solid ${T.glassBorder}`,
        borderRadius: 16,
        color: T.white,
        fontSize: 15,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background 200ms ease',
        WebkitTapHighlightColor: 'transparent',
        ...extStyle,
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
    >
      {children}
    </button>
  );
}

// ── Social Button ─────────────────────────────────────────────────
function SocialBtn({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: '11px 10px',
        background: 'rgba(255,255,255,0.09)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1.5px solid ${T.glassBorder}`,
        borderRadius: 14,
        color: T.white,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'background 200ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ── Loading Dot ──────────────────────────────────────────────────
function LoadingDot() {
  return (
    <>
      <style>{`
        @keyframes hui-dot-pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .hui-dot { width:6px; height:6px; background:white; border-radius:50%; animation:hui-dot-pulse 1.2s ease infinite; }
        .hui-dot:nth-child(2) { animation-delay: 0.2s; }
        .hui-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>
      <div style={{ display:'flex', gap: 4 }}>
        <div className="hui-dot"/>
        <div className="hui-dot"/>
        <div className="hui-dot"/>
      </div>
    </>
  );
}

// ── Background Layer ──────────────────────────────────────────────
function AtmosphericBackground({ imgIdx = 0 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      {}
      <img
        src={BG_IMAGES[imgIdx]}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          filter: 'brightness(0.42) saturate(1.2)',
          transform: 'scale(1.04)',
        }}
      />
      {}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(160deg, rgba(22,215,197,0.18) 0%, transparent 45%)',
      }}/>
      {}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.82) 100%)',
      }}/>
      {}
      <div style={{
        position: 'absolute',
        right: '-10%', bottom: '-10%',
        width: '55%', height: '55%',
        background: 'radial-gradient(circle, rgba(255,138,107,0.14) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>
      {}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
        opacity: 0.6,
        pointerEvents: 'none',
      }}/>
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────
function Divider({ label = 'oder' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: T.glassBorder }}/>
      <span style={{ fontSize: 12, color: T.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: T.glassBorder }}/>
    </div>
  );
}

// ── Error Message ─────────────────────────────────────────────────
function ErrorMessage({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      padding: '12px 16px',
      background: T.errorBg,
      border: '1px solid rgba(255,138,107,0.30)',
      borderRadius: 12,
      fontSize: 14,
      color: '#FFB49A',
      lineHeight: 1.5,
    }}>
      {msg}
    </div>
  );
}

// ── Success Message ───────────────────────────────────────────────
function SuccessMessage({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      padding: '12px 16px',
      background: 'rgba(22,215,197,0.12)',
      border: '1px solid rgba(22,215,197,0.30)',
      borderRadius: 12,
      fontSize: 14,
      color: HUI.COLOR.teal,
      lineHeight: 1.5,
    }}>
      {msg}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HAUPT-EXPORT
// ═══════════════════════════════════════════════════════════════════
export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation(); // DEEPLINK.1 (2026-07-09) — Rueckweg nach Login

  // localStorage-Eintrag bleibt für processReferralForUser erhalten (OAuth-Flows).

  const [searchParams] = useSearchParams();

  const { isAuthenticated, loadingAuth } = useAuth();

  // KBD-INSET-FIX (2026-08-29, Michael-Report Screenshot "wird durch
  // Systemtastatur verdeckt, laesst sich nicht scrollen"): Register-Card
  // nutzte statisches maxHeight:"94dvh" -- die Systemtastatur schrumpft
  // dvh in dieser Android-WebView NICHT (identischer Root Cause wie
  // ShippingAddressModal KBD-INSET-FIX 2026-08-20). Card blieb dadurch
  // ueber den sichtbaren Bereich hinaus hoch, unterste Felder (Email,
  // Passwort, Weiter-Button) blieben permanent hinter der Tastatur --
  // auch Scroll-Versuche im Card-Container konnten sie nicht erreichen,
  // weil der Container selbst nie schrumpfte. Fix: card maxHeight jetzt
  // dynamisch ueber --hui-keyboard-inset CSS-Var reduziert.
  useKeyboardInset();

  // Modes: 'splash' | 'login' | 'register' | 'forgot' | 'onboarding'
  const [mode,       setMode]       = useState('splash');
  const [showTerms,  setShowTerms]  = useState(false);
  const [email,      setEmail]      = useState('');
  const [pw,         setPw]         = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [fullName,    setFullName]    = useState('');
  const [lastName,    setLastName]    = useState('');
  const [username,    setUsername]    = useState('');
  const [usernameErr, setUsernameErr] = useState('');
  const [refValid,   setRefValid]   = useState(null);
  // REGISTRATION-UPGRADE-001 (2026-08-15): Neue Pflichtfelder
  const [anrede,     setAnrede]     = useState('');
  // ALTERSSCHUTZ (2026-08-22): Geburtsdatum + Alters-Verifikation (min. 16)
  const [birthDate,  setBirthDate]  = useState('');
  const [dateFocused, setDateFocused] = useState(false); // FIX (2026-08-22 v2): Geburtsdatum-Placeholder-Overlap
  const [ageError,   setAgeError]   = useState('');

  const [pw2,        setPw2]        = useState('');
  const [showPw2,    setShowPw2]    = useState(false);
  // EMAIL-DUPLICATE-PROTECTION (Migration 113): Zeigt "Passwort vergessen?"
  // Button unter der Fehlermeldung, wenn Registrierung wegen existierender
  // E-Mail blockiert wurde.
  const [emailBlocked, setEmailBlocked] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  // Speichere Register-Credentials für Polling im Verifikations-Modal
  const [regCredentials, setRegCredentials] = useState({ email: '', password: '' });
  const [loading,    setLoading]    = useState(false);
  const [err,        setErr]        = useState('');
  const [success,    setSuccess]    = useState('');
  const [bgIdx]                     = useState(() => Math.floor(Math.random() * BG_IMAGES.length));
  const [fadeIn,     setFadeIn]     = useState(false);
  // Onboarding intent
  const [intent,     setIntent]     = useState('');

  // Kapitel 1: navigate() aus dem Render-Body entfernt.
  // Alle Navigationen nach Login/Onboarding laufen hier — niemals im Render.
  useEffect(() => {
    if (!loadingAuth && isAuthenticated) {
      // DEEPLINK.1: ProtectedRoute hinterlaesst state.from (z.B. /beitrag/123),
      // wenn ein nicht eingeloggter Nutzer einem geteilten Link folgte.
      // Nur relative, interne Pfade zulassen (kein Open-Redirect).
      const from = location.state?.from;
      const target = (typeof from === 'string' && from.startsWith('/') && !from.startsWith('//'))
        ? from : '/Home';
      navigate(target, { replace: true });
      return;
    }
    if (mode === 'onboarding') {
      navigate('/Home', { replace: true });
    }
  }, [isAuthenticated, loadingAuth, mode, navigate, location.state]);

  // Fade-in bei Mode-Wechsel
  useEffect(() => {
    setFadeIn(false);
    const t = setTimeout(() => setFadeIn(true), 30);
    return () => clearTimeout(t);
  }, [mode]);

  function clearMessages() { setErr(''); setSuccess(''); setEmailBlocked(false); }

  function translateError(msg = '') {
    if (msg.includes('Invalid login credentials')) return t("auth.credentialsMismatch");
    if (msg.includes('Email not confirmed'))        return t("auth.confirmEmailFirst2");
    if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user_already_exists'))
                                                     return 'Diese E-Mail-Adresse wird bereits verwendet. Bitte logge dich ein oder nutze Passwort-Wiederherstellung.';
    if (msg.includes('Password should be'))         return 'Das Passwort muss mindestens 6 Zeichen haben.';
    if (msg.includes('rate limit'))                 return 'Zu viele Versuche — bitte kurz warten.';
    if (msg.toLowerCase().includes('banned'))         return t('auth.accountUnderReview');
    return msg || t("auth.genericError");
  }

  // ── Auth Actions ──────────────────────────────────────────────

  async function handleLogin(e) {
    e.preventDefault(); clearMessages();
    if (!email || !pw) { setErr(t("auth.enterEmailPassword")); return; }
    setLoading(true);

    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) { setErr(translateError(error.message)); setLoading(false); return; }

    // ── BLOCK-CHECK nach erfolgreichem Login ──────────────────────────
    // ── Profil-Check nach erfolgreichem Login ─────────────────────────────
    if (signInData?.user?.id) {
      // FIX (2026-08-12): "blocked"/"blocked_at" wurden durch die Security-
      // Hardening-Migration 104 per Column-Level-REVOKE fuer ALLE Rollen
      // gesperrt (verhindert dass fremde Nutzer den Blocked-Status anderer
      // sehen). Ein direktes SELECT auf profiles schlaegt dadurch mit 403 fehl
      // und der Block-Check wurde lautlos uebersprungen (blockierte Nutzer
      // konnten sich wieder einloggen). Fix: SECURITY DEFINER RPC
      // rpc_check_own_blocked_status() liefert NUR den eigenen Status
      // (auth.uid() = Zeile) -- siehe Migration 106.
      const { data: profRows, error: profErr } = await supabase
        .rpc("rpc_check_own_blocked_status");
      const prof = Array.isArray(profRows) ? profRows[0] : profRows;

      // 1. Kein Profil-Eintrag → Nutzer wurde gelöscht
      if (!prof && !profErr) {
        await supabase.auth.signOut();
        setLoading(false);
        setErr("Dieses Konto existiert nicht mehr. Bitte registriere dich neu.");
        return;
      }

      // 2. Profil blockiert
      if (prof?.blocked === true) {
        await supabase.auth.signOut();
        setLoading(false);
        setErr(t("auth.accountBlocked"));
        return;
      }
    }

    // ── Success: Login war erfolgreich, Nutzer ist nicht blockiert ──
    // AuthContext.onAuthStateChange feuert SIGNED_IN → isAuthenticated=true
    // → ConditionalRouter re-rendert → AuthenticatedApp wird angezeigt.
    // setLoading(false) als Defensive — falls onAuthStateChange verzögert feuert.
    setLoading(false);
    setSuccess('Login erfolgreich! Du wirst weitergeleitet…');
  }

  // ── Registration ──────────────────────────────────────────────
  function calculateAge(birthStr) {
    // birthStr = YYYY-MM-DD
    if (!birthStr) return -1;
    const parts = birthStr.split('-');
    if (parts.length !== 3) return -1;
    const birth = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (isNaN(birth.getTime())) return -1;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const mDiff = today.getMonth() - birth.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  async function handleRegister(e) {
    e.preventDefault(); clearMessages();

    // ALTERSSCHUTZ: Prüfe Alter VOR allem anderen
    const age = calculateAge(birthDate);
    if (!birthDate || age < 0) {
      setErr('Bitte gib dein Geburtsdatum an.');
      return;
    }
    if (age < 16) {
      setErr(''); // Normale Fehlermeldung ausblenden
      setAgeError(t("auth.ageError", {age}));
      return;
    }
    setAgeError('');

    if (!email || !pw || !username) { setErr(t("auth.fillAllFields2")); return; }
    setLoading(true);

    // Username-Verfügbarkeit prüfen
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (existingUser) {
      setErr(t("auth.usernameTaken"));
      setLoading(false);
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // EMAIL-DUPLICATE-PROTECTION (Migration 113, 2026-08-15)
    // ═══════════════════════════════════════════════════════════════
    // VOR signUp() prüfen ob die E-Mail bereits in auth.users existiert.
    // Das ist kritisch: Supabase signUp() mit mailer_autoconfirm=false
    // erstellt bei Duplikat-Index KEINEN neuen User, aber je nach Config
    // kann es eine Session zurückgeben oder stillschweigend verhalten.
    // Wir dürfen NIEMALS zulassen dass ein Duplikat-Eintrag zu einem
    // automatischen Login führt. Daher: explizite RPC-Prüfung VORHER.
    const { data: emailExists, error: emailCheckErr } = await supabase.rpc('rpc_check_email_exists', {
      p_email: email,
    });
    if (emailCheckErr) {
      // RPC-Fehler → sicherheitshalber blockieren (fail-closed)
      console.warn('[HUI Register] rpc_check_email_exists error:', emailCheckErr?.message);
      setErr(t("auth.emailCheckFailed"));
      setLoading(false);
      return;
    }
    if (emailExists === true) {
      // E-Mail existiert bereits → Registrierung stoppen, kein signUp(),
      // keine Session, kein Profil, kein Login, kein Redirect.
      setErr('Diese E-Mail-Adresse wird bereits verwendet. Bitte logge dich ein oder nutze Passwort-Wiederherstellung.');
      setEmailBlocked(true);
      setLoading(false);
      // Sicherheits-Log via RPC (Migration 113)
      try {
        await supabase.rpc('rpc_log_registration_blocked', {
          p_email: email,
          p_reason: 'existing_email',
        });
      } catch (e) {
        console.warn('[HUI Register] log error:', e);
      }
      return;
    }

    const combinedName = `${fullName.trim()} ${lastName.trim()}`;

    // ── KEIN Auto-Login mehr ──
    // Stattdessen: Verifikations-Modal anzeigen, das alle 3 Sekunden
    // prüft ob die E-Mail bestätigt wurde.
    setLoading(false);
    setRegCredentials({ email, password: pw });
    setShowVerification(true);
  }

  async function handleForgot(e) {
    e.preventDefault(); clearMessages();
    if (!email) { setErr('Bitte gib deine E-Mail-Adresse ein.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRedirectUrl(),
    });
    if (error) {
      setErr(translateError(error.message));
    } else {
      setSuccess('Wir haben dir einen Link gesendet. Manchmal hilft ein neuer Anfang.');
    }
    setLoading(false);
  }

  async function handleGoogle() {
    clearMessages();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getAuthRedirectUrl() },
    });
  }

  async function handleApple() {
    clearMessages();
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: getAuthRedirectUrl() },
    });
  }

  // ── Shared Layout ─────────────────────────────────────────────

  const cardStyle = {
    position: 'relative', zIndex: 1,
    width: '100%', maxWidth: 420,
    margin: '0 auto',
    padding: '24px 22px',
    background: 'rgba(10,10,10,0.55)',
    backdropFilter: 'blur(28px)',
    WebkitBackdropFilter: 'blur(28px)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 28,
    boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
    // Register hat mehr Felder — scrollbar wenn nötig
    // KBD-INSET-FIX (2026-08-29): maxHeight schrumpft jetzt IM GLEICHEN
    // MASS wie die Tastatur (--hui-keyboard-inset), damit alle Felder
    // per Scroll erreichbar bleiben statt permanent verdeckt zu sein.
    ...(mode === 'register' ? {
      maxHeight: 'calc(94dvh - var(--hui-keyboard-inset, 0px))',
      overflowY: 'auto',
      overflowX: 'hidden',
      transition: 'max-height .15s ease-out',
    } : {}),
  };

  const fadeStyle = {
    opacity: fadeIn ? 1 : 0,
    transform: fadeIn ? 'translateY(0)' : 'translateY(12px)',
    transition: 'opacity 400ms ease, transform 400ms ease',
  };

  // ════════════════════════════════════════════════════
  // SPLASH SCREEN
  // ════════════════════════════════════════════════════
  if (mode === 'splash') return (
    <div style={{ position: 'relative', minHeight: '100dvh', width: '100%', maxWidth: '100%', overflowX: 'hidden', overflow: 'hidden',
      display: 'flex', flexDirection: 'column' }}>
      <AtmosphericBackground imgIdx={bgIdx} />

      <div style={{ minHeight: 24 }}/>

      <div style={{ flex: 1 }}/>

      {}
      <div style={{ position: 'relative', zIndex: 1, padding: '0 28px max(48px,max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 48px), 48px))' }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontWeight: 600, fontSize: 42, color: T.white, letterSpacing: -1.8,
            lineHeight: 1.1, marginBottom: 16 }}>
            {t("auth.connectPeople")}<br/>{t("auth.withPeople")}<br/>
            <span style={{ color: T.teal }}> {t("auth.whoCreate")} </span>
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.68)', lineHeight: 1.7, maxWidth: 320 }}>
            {t("auth.quietNetwork")}<br/>{t("auth.realCollaboration")}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PrimaryBtn onClick={() => setMode('register')}>
            {t('auth.joinHUI')}
          </PrimaryBtn>
          <GhostBtn onClick={() => setMode('login')}>
            {t('auth.alreadyMember')}
          </GhostBtn>
        </div>

      </div>
    </div>
  );

  // ════════════════════════════════════════════════════
  // NACH REGISTRIERUNG — direkt zur App
  // Das Membership-Onboarding startet NICHT hier.
  // Es wird beim ersten Tippen auf den HUI-Button (Orb)
  // ausgelöst — für Basis-User als Freischaltungs-Journey.
  // ════════════════════════════════════════════════════
  // navigate() für onboarding läuft im useEffect oben — nicht hier im Render.
  if (mode === 'onboarding') return null;

  // ════════════════════════════════════════════════════
  // LOGIN / REGISTER / MAGIC / FORGOT — gemeinsames Layout
  // ════════════════════════════════════════════════════

  const COPY = {
    login: {
      headline: t('auth.loginHeadline'),
      sub:      t('auth.loginSub'),
      cta:      t('auth.loginCta'),
      switch:   t('auth.loginSwitch'),
      switchMode: 'register',
    },
    register: {
      headline: t('auth.registerHeadline'),
      sub:      t('auth.registerSub'),
      cta:      t('auth.registerCta'),
      switch:   t('auth.registerSwitch'),
      switchMode: 'login',
    },
    forgot: {
      headline: t('auth.forgotHeadline'),
      sub:      t('auth.forgotSub'),
      cta:      t('auth.forgotCta'),
      switch:   t('auth.forgotSwitch'),
      switchMode: 'login',
    },
  };

  const copy = COPY[mode] || COPY.login;

  const handleSubmit = mode === 'login'   ? handleLogin
                     : mode === 'register' ? handleRegister
                     :                       handleForgot;

  return (
    <div data-hui-kbd-self-managed style={{ position: 'relative', minHeight: '100dvh', width: '100%', maxWidth: '100%', overflowX: 'hidden', overflow: 'hidden',
      display: 'flex', flexDirection: 'column' }}>
      <AtmosphericBackground imgIdx={bgIdx} />

      {}
      <div style={{
        position: 'relative', zIndex: 1, flex: 1,
        display: 'flex', flexDirection: 'column',
        padding: 'max(var(--hui-safe-top, 0px),24px,env(safe-area-inset-top,24px)) 20px max(24px,max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 24px), 24px))',
        overflowY: 'auto',
      }}>
        {}
        <button type="button" onClick={() => { clearMessages(); setMode('splash'); }}
          style={{ alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer',
            color: T.muted, fontSize: 14, fontFamily: 'inherit', padding: '4px 0', marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 6 }}>
          {t('auth.back')}
        </button>

        {}
        <div style={{ ...cardStyle, ...fadeStyle }}>
          {}
          {/* ── HUI Logo (Markenanker, Constitution-konform) ──── */}
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
            <HUILogoWordmark logoSize={36} textColor={T.teal2} subOpacity={0.85} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 18, color: T.white, letterSpacing: -0.4,
              lineHeight: 1.2, marginBottom: 4, whiteSpace: 'pre-line' }}>
              {copy.headline}
            </div>
            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
              {copy.sub}
            </div>
          </div>

          {}
          {/* ARCHIVED 2026-08-15: Google/Apple OAuth-Login ausgebaut.
              Provider in Supabase noch nicht aktiviert (keine Credentials).
              Code bleibt erhalten fuer spaetere Reaktivierung.
              Siehe _archived/oauth_login_buttons.jsx fuer das Original-Markup.
          {mode === 'login' || mode === 'register' ? (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <SocialBtn
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill={T.white}>
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>}
                  label="Google"
                  onClick={handleGoogle}
                />
                <SocialBtn
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill={T.white}>
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.42.07 2.4.83 3.22.84.85.02 2.34-.99 3.87-.84 1.34.12 2.52.65 3.35 1.75-3.03 1.86-2.52 5.73.56 6.96-.73 1.71-1.5 3.39-3 4.17zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>}
                  label="Apple"
                  onClick={handleApple}
                />
              </div>
              <Divider label="oder per E-Mail" />
              <div style={{ height: 16 }}/>
            </>
          ) : null
          } */}

          {}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {}
            {mode === 'register' && (
              <>
                {/* Anrede — REGISTRATION-UPGRADE-001 */}
                <div style={{ position: 'relative' }}>
                  <select
                    id="anrede"
                    value={anrede}
                    onChange={e => setAnrede(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: T.glass,
                      border: '1.5px solid rgba(255,255,255,0.13)',
                      borderRadius: 14,
                      fontSize: 14,
                      color: anrede ? T.white : 'rgba(255,255,255,0.38)',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      caretColor: T.teal,
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="" disabled style={{ background: '#1a1a1a', color: '#999' }}>{t("auth.salutation")}</option>
                    <option value="Herr" style={{ background: '#1a1a1a', color: '#fff' }}>{t("auth.mr")}</option>
                    <option value="Frau" style={{ background: '#1a1a1a', color: '#fff' }}>{t("auth.mrs")}</option>
                    <option value="Divers" style={{ background: '#1a1a1a', color: '#fff' }}>{t("auth.diverse")}</option>
                  </select>
                  <svg style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
                {/* Vorname */}
                <GlassInput
                  id="firstname"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={t("auth.firstname")}
                  autoComplete="given-name"
                  autoCapitalize="words"
                  autoCorrect="on"
                  required
                />
                {/* Nachname */}
                <GlassInput
                  id="lastname"
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder={t("auth.lastname")}
                  autoComplete="family-name"
                  autoCapitalize="words"
                  autoCorrect="on"
                  required
                />
                {/* Benutzername */}
                <GlassInput
                  id="username"
                  type="text"
                  value={username}
                  onChange={e => {
                    const v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                    setUsername(v);
                    setUsernameErr('');
                  }}
                  placeholder={t("auth.usernamePlaceholder")}
                  autoComplete="username"
                  required
                  rightSlot={
                    username.trim().length >= 3 ? (
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: /^[a-z0-9_]{3,30}$/.test(username) ? '#0EC4B8' : 'rgba(255,138,107,0.9)',
                      }}>
                        {/^[a-z0-9_]{3,30}$/.test(username) ? '✓' : '✗'}
                      </span>
                    ) : null
                  }
                />
                {usernameErr && (
                  <div style={{ fontSize: 11, color: 'rgba(255,138,107,0.9)', marginTop: -6, paddingLeft: 4 }}>
                    {usernameErr}
                  </div>
                )}

                {/* ALTERSSCHUTZ (2026-08-22): Geburtsdatum — min. 16 Jahre */}
                {/* FIX (2026-08-22 v2): Browser-eigener "tt.mm.jjjj"-Platzhalter des
                    <input type="date"> überlappte mit dem eigenen "Geburtsdatum *"-Label,
                    da beide gleichzeitig sichtbar waren. Fix: Native Datums-Segmente werden
                    per CSS (index.css, .hui-date-empty) transparent gemacht solange das Feld
                    leer UND nicht fokussiert ist — unser Label übernimmt die Anzeige. Beim
                    Fokussieren (dateFocused) werden die nativen Segmente wieder sichtbar,
                    damit der Nutzer beim Tippen sein Eingabe sieht; unser Label verschwindet. */}
                <div style={{ position: 'relative' }}>
                  <input
                    id="birthdate"
                    type="date"
                    value={birthDate}
                    onChange={e => { setBirthDate(e.target.value); setAgeError(''); clearMessages(); }}
                    onFocus={() => setDateFocused(true)}
                    onBlur={() => setDateFocused(false)}
                    required
                    max={new Date(new Date().getFullYear() - 16, new Date().getMonth(), new Date().getDate()).toISOString().slice(0, 10)}
                    min="1900-01-01"
                    className={birthDate || dateFocused ? 'hui-date-hasvalue' : 'hui-date-empty'}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: T.glass,
                      border: '1.5px solid rgba(255,255,255,0.13)',
                      borderRadius: 14,
                      fontSize: 14,
                      color: birthDate ? T.white : 'rgba(255,255,255,0.38)',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      caretColor: T.teal,
                    }}
                  />
                  {!birthDate && !dateFocused && (
                    <span style={{
                      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 14, color: 'rgba(255,255,255,0.38)', pointerEvents: 'none',
                      fontFamily: 'inherit',
                    }}>
                      {t('auth.birthdate')}
                    </span>
                  )}
                </div>

                {/* Alters-Info (erscheint nur bei unter 16) */}
                {ageError && (
                  <div style={{
                    background: 'rgba(255,138,107,0.08)',
                    border: '1px solid rgba(255,138,107,0.2)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: 'rgba(255,200,190,0.95)',
                    marginTop: -2,
                  }}>
                    {ageError}
                  </div>
                )}

              </>
            )}

            {}
            <GlassInput
              id="email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); clearMessages(); }}
              placeholder={t("auth.emailAddress")}
              autoComplete="email"
            />

            {}
            {(mode === 'login' || mode === 'register') && (
              <GlassInput
                id="password"
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={e => { setPw(e.target.value); clearMessages(); }}
                placeholder={t("auth.passwordReq")}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                rightSlot={
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer',
                      color: T.muted, padding: 0, fontSize: 14, fontFamily: 'inherit',
                      lineHeight: 1 }}>
                    {showPw ? '●' : '○'}
                  </button>
                }
              />
            )}

            {/* Passwort wiederholen — REGISTRATION-UPGRADE-001 (nur bei Registrierung) */}
            {mode === 'register' && (
              <GlassInput
                id="password2"
                type={showPw2 ? 'text' : 'password'}
                value={pw2}
                onChange={e => { setPw2(e.target.value); clearMessages(); }}
                placeholder={t("auth.passwordRepeat")}
                autoComplete="new-password"
                rightSlot={
                  <button type="button" onClick={() => setShowPw2(v => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer',
                      color: T.muted, padding: 0, fontSize: 14, fontFamily: 'inherit',
                      lineHeight: 1 }}>
                    {showPw2 ? '●' : '○'}
                  </button>
                }
              />
            )}
{/* RESTORE (2026-08-22): Err/Success-Feedback + Submit-Button + Login-Forgot-Link
                waren beim Ambassador-Removal-Commit (f473c037) versehentlich mit entfernt
                worden (Collateral-Damage — Reflink-Feld korrekt entfernt, aber diese
                3 unabhängigen Blöcke standen im selben Diff-Hunk und wurden mitgelöscht).
                Root Cause: Kein Submit-Button sichtbar, keine Fehler-/Erfolgsmeldung,
                kein "Passwort vergessen?" im Login-Modus. Wiederhergestellt aus Git-History
                (Commit vor f473c037), unverändert bis auf Entfernung der Reflink-Abhängigkeit. */}
            {}
            {err && <ErrorMessage msg={err} />}
            {success && <SuccessMessage msg={success} />}

            {}
            <div style={{ marginTop: 2 }}>
              <PrimaryBtn type="submit" loading={loading} disabled={loading}>
                {loading ? t("auth.pleaseWait") : copy.cta}
              </PrimaryBtn>
            </div>

            {}
            {mode === 'login' && (
              <div style={{ textAlign: 'center', marginTop: -4 }}>
                <button type="button" onClick={() => { clearMessages(); setMode('forgot'); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: T.muted, fontFamily: 'inherit' }}>
                  {t('auth.forgotPassword')}
                </button>
              </div>
            )}

            {/* EMAIL-DUPLICATE-PROTECTION: "Passwort vergessen?" Button
                erscheint unter der Fehlermeldung, wenn die Registrierung
                wegen existierender E-Mail blockiert wurde. */}
            {mode === 'register' && emailBlocked && (
              <div style={{ textAlign: 'center', marginTop: -4 }}>
                <button type="button" onClick={() => { clearMessages(); setMode('forgot'); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: T.teal, fontFamily: 'inherit', fontWeight: 600 }}>
                  {t('auth.forgotPassword')}
                </button>
              </div>
            )}

          </form>

          {}
          <div style={{ marginTop: 20, textAlign: 'center', borderTop: `1px solid ${T.glassBorder}`, paddingTop: 20 }}>
            <button type="button" onClick={() => { clearMessages(); setMode(copy.switchMode); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, color: T.teal, fontWeight: 600, fontFamily: 'inherit' }}>
              {copy.switch}
            </button>
          </div>
        </div>

        {}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', lineHeight: 1.8 }}>
            {t('auth.termsAgree')}{' '}
            <span
              role="link"
              tabIndex={0}
              onClick={() => setShowTerms(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowTerms(true); }}
              style={{
                textDecoration: 'underline',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.42)',
              }}
            >
              {t('auth.terms')}
            </span>{' '}
            {t('auth.termsTo')}
          </div>
        </div>
      </div>
      <NutzungsbedingungenModal open={showTerms} onClose={() => setShowTerms(false)} />
      <EmailVerificationModal
        open={showVerification}
        email={regCredentials.email}
        password={regCredentials.password}
        onClose={() => setShowVerification(false)}
      />
    </div>
  );
}
