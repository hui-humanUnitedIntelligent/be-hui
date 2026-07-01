import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { processReferralForUser } from '../lib/referralTracking.js';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { HUI } from "../design/hui.design.js";
import { HUILogoWordmark } from '../components/brand/HUILogo.jsx';

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


function GlassInput({ type = 'text', value, onChange, placeholder, autoComplete, id, rightSlot }) {
  const [focused, setFocused] = useState(false);


  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          width: '100%',
          padding: rightSlot ? '12px 44px 12px 16px' : '12px 16px',
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
        padding: '13px',
        background: disabled
          ? 'rgba(22,215,197,0.35)'
          : 'linear-gradient(135deg, #16D7C5 0%, #0FC4B2 100%)',
        color: T.white,
        border: 'none',
        borderRadius: 16,
        fontSize: 17,
        fontWeight: 800,
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
  const navigate = useNavigate();

  // Ref-Link aus URL-Param (?ref=username) ODER localStorage vorausfüllen
  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setRefLink(`https://be-hui.com/${refParam}`);
      return;
    }
    // Fallback: localStorage (gesetzt von RefRedirect wenn Nutzer über be-hui.com/username kam)
    try {
      const stored = localStorage.getItem('hui_referral_ambassador');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.expiry && Date.now() < parsed.expiry && parsed.username) {
          setRefLink(`https://be-hui.com/${parsed.username}`);
        }
      }
    } catch (e) { /* ignorieren */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [searchParams] = useSearchParams();

  const { isAuthenticated, loadingAuth } = useAuth();

  // Modes: 'splash' | 'login' | 'register' | 'magic' | 'forgot' | 'onboarding'
  const [mode,       setMode]       = useState('splash');
  const [email,      setEmail]      = useState('');
  const [pw,         setPw]         = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [fullName,    setFullName]    = useState('');
  const [lastName,    setLastName]    = useState('');
  const [username,    setUsername]    = useState('');
  const [usernameErr, setUsernameErr] = useState('');
  const [refLink,    setRefLink]    = useState('');
  const [refValid,   setRefValid]   = useState(null);
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
      navigate('/Home', { replace: true });
      return;
    }
    if (mode === 'onboarding') {
      navigate('/Home', { replace: true });
    }
  }, [isAuthenticated, loadingAuth, mode, navigate]);

  // Fade-in bei Mode-Wechsel
  useEffect(() => {
    setFadeIn(false);
    const t = setTimeout(() => setFadeIn(true), 30);
    return () => clearTimeout(t);
  }, [mode]);

  function clearMessages() { setErr(''); setSuccess(''); }

  function translateError(msg = '') {
    if (msg.includes('Invalid login credentials')) return 'E-Mail oder Passwort stimmen nicht überein.';
    if (msg.includes('Email not confirmed'))        return 'Bitte bestätige zuerst deine E-Mail.';
    if (msg.includes('already registered'))         return 'Diese E-Mail ist bereits registriert.';
    if (msg.includes('Password should be'))         return 'Das Passwort muss mindestens 6 Zeichen haben.';
    if (msg.includes('rate limit'))                 return 'Zu viele Versuche — bitte kurz warten.';
    if (msg.toLowerCase().includes('banned'))         return 'Dein Konto wird von einem Admin geprüft. Bei Fragen: support@be-hui.com';
    return msg || 'Ein Fehler ist aufgetreten.';
  }

  // ── Auth Actions ──────────────────────────────────────────────

  async function handleLogin(e) {
    e.preventDefault(); clearMessages();
    if (!email || !pw) { setErr('Bitte E-Mail und Passwort eingeben.'); return; }
    setLoading(true);

    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) { setErr(translateError(error.message)); setLoading(false); return; }

    // ── BLOCK-CHECK nach erfolgreichem Login ──────────────────────────
    // ── Profil-Check nach erfolgreichem Login ─────────────────────────────
    if (signInData?.user?.id) {
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("blocked, blocked_at")
        .eq("id", signInData.user.id)
        .maybeSingle(); // maybeSingle statt single → null wenn kein Profil (gelöschter Nutzer)

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
        setErr("Dein Konto wurde blockiert und wird von unserem Team geprüft.");
        return;
      }

      // 3. Referral verarbeiten (falls Nutzer über Ambassador-Link kam)
      // Fire-and-forget: blockiert Login nicht
      processReferralForUser(signInData.user.id).catch(() => {});
    }

    setLoading(false);
    // success → useEffect navigates
  }

  // Ambassador-Namen validieren (rpc_validate_ambassador_name Logik)
  // Erlaubt: NUR den Ambassador-Usernamen (z.B. "milileo")
  // NICHT: Links, Codes, URLs
  // Silent fail wenn kein Ambassador gefunden
  async function resolveRefLink(input) {
    if (!input?.trim()) return null;
    // Normalisierung: extrahiere Username aus Link falls nötig
    let username = input.trim().toLowerCase();
    // Wenn jemand doch den Link eingibt: Username extrahieren
    const urlMatch = username.match(/(?:https?:\/\/)?(?:www\.)?be-hui\.com\/([a-z0-9._-]+)/i);
    if (urlMatch) username = urlMatch[1].toLowerCase();
    // Format-Prüfung: nur gültige Usernames
    if (!/^[a-z0-9._-]{2,40}$/.test(username)) return null;
    // Ausschluss-Liste: keine Systemseiten
    const EXCLUDED = ['home','login','studio','impact','admin','diagnose',
      'dashboard','profile','work','auth','ref','entdecken','buchung',
      'mein-hui','community','impressum','datenschutz','agb','cookies','copyright'];
    if (EXCLUDED.includes(username)) return null;

    // WICHTIG: An dieser Stelle ist der Nutzer noch NICHT eingeloggt (anon-Key).
    // profiles/ambassador_ref_links haben KEINE anon-SELECT-Policy (RLS) — ein
    // direktes .from(...).select() liefert hier IMMER [] zurueck, egal ob der
    // Ambassador existiert! Deshalb ausschliesslich ueber die SECURITY-DEFINER-RPC
    // aufloesen, die bewusst fuer anon freigegeben ist (rpc_resolve_ref_link).
    const { data, error } = await supabase.rpc('rpc_resolve_ref_link', { p_username: username });
    if (error) { console.warn('[HUI Referral] rpc_resolve_ref_link Fehler:', error.message); return null; }
    if (data?.found && data?.ambassador_id) {
      return { ambassadorId: data.ambassador_id, username: data.username || username };
    }
    return null;
  }

  // Sichert eine manuell im Reflink-Feld eingetippte Eingabe im localStorage,
  // damit JEDER Signup-Weg (Email/PW, Google, Apple, Magic Link) sie spaeter
  // ueber processReferralForUser()/AuthCallback zuverlaessig aufloesen kann —
  // unabhaengig davon, ob die sofortige Aufloesung hier gerade gelingt.
  async function persistManualRefLinkToStorage() {
    if (!refLink.trim()) return;
    const rawUsername = refLink.trim().toLowerCase();
    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
    try { localStorage.setItem('hui_referral_ambassador', JSON.stringify({ username: rawUsername, expiry })); } catch {}
    let refResult = await resolveRefLink(refLink.trim());
    if (!refResult?.ambassadorId) {
      await new Promise(r => setTimeout(r, 400));
      refResult = await resolveRefLink(refLink.trim());
    }
    if (refResult?.ambassadorId) {
      try { localStorage.setItem('hui_referral_ambassador', JSON.stringify({
        username: refResult.username, ambassadorId: refResult.ambassadorId, expiry
      })); } catch {}
    }
  }

  async function handleRegister(e) {
    e.preventDefault(); clearMessages(); setUsernameErr('');

    // ── Pflichtfeld-Validierung ──
    if (!fullName.trim())   { setErr('Bitte gib deinen Vornamen ein.');    return; }
    if (!lastName.trim())   { setErr('Bitte gib deinen Nachnamen ein.');   return; }
    if (!username.trim())   { setErr('Bitte wähle einen Benutzernamen.');  return; }
    if (!email)             { setErr('Bitte gib deine E-Mail ein.');       return; }
    if (!pw)                { setErr('Bitte gib ein Passwort ein.');       return; }
    if (pw.length < 6)      { setErr('Das Passwort muss mindestens 6 Zeichen haben.'); return; }

    // Username-Format prüfen
    const uname = username.trim().toLowerCase().replace(/\s+/g, '_');
    if (!/^[a-z0-9_]{3,30}$/.test(uname)) {
      setErr('Benutzername: 3-30 Zeichen, nur Buchstaben, Zahlen und _');
      return;
    }

    setLoading(true);

    // Username-Verfügbarkeit prüfen
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', uname)
      .maybeSingle();
    if (existingUser) {
      setErr('Dieser Benutzername ist bereits vergeben. Bitte wähle einen anderen.');
      setLoading(false);
      return;
    }

    const combinedName = `${fullName.trim()} ${lastName.trim()}`;

    // ── Ref-Link auflösen (manuelles Feld ODER localStorage ODER URL) ──
    // Prio 1: Manuell eingetippt im Formular (Helper sichert + versucht sofort aufzuloesen)
    await persistManualRefLinkToStorage();
    let ambassadorId = null;
    try {
      const justStored = JSON.parse(localStorage.getItem('hui_referral_ambassador') || 'null');
      if (justStored?.ambassadorId) ambassadorId = justStored.ambassadorId;
    } catch {}
    // Prio 2: localStorage (gesetzt von RefRedirect wenn Nutzer über Link kam)
    if (!ambassadorId) {
      try {
        const stored = JSON.parse(localStorage.getItem('hui_referral_ambassador') || 'null');
        if (stored?.ambassadorId && Date.now() < stored.expiry) {
          ambassadorId = stored.ambassadorId;
        }
      } catch {}
    }

    const { error, data: signUpData } = await supabase.auth.signUp({
      email, password: pw,
      options: {
        data: {
          full_name:    combinedName,
          display_name: uname,
          username:     uname,
        },
      },
    });
    if (error) {
      setErr(translateError(error.message));
      setLoading(false);
      return;
    }

    // Profil sofort mit allen Pflichtfeldern befüllen
    if (signUpData?.user?.id) {
      const profileData = {
        id:           signUpData.user.id,
        full_name:    combinedName,
        display_name: uname,
        username:     uname,
        email:        email,
        updated_at:   new Date().toISOString(),
      };
      // referred_by NICHT mehr im rohen Upsert mitschicken — direkt nach Signup ist die
      // Session evtl. noch nicht vollständig aktiv (RLS: auth.uid()=id), wodurch das Feld
      // beim rohen .upsert() unbemerkt verworfen werden kann (Fehler wurde nie geprüft).
      await supabase.from('profiles').upsert(profileData, { onConflict: 'id' });

      // referred_by GARANTIERT über die SECURITY-DEFINER-RPC setzen (umgeht RLS komplett,
      // idempotent per "WHERE referred_by IS NULL"). Das ist jetzt der einzige Schreibweg
      // fuer referred_by beim Signup.
      if (ambassadorId) {
        try {
          const { data: rpcRes, error: rpcErr } = await supabase.rpc('rpc_register_with_ambassador', {
            p_user_id: signUpData.user.id,
            p_ambassador_id: ambassadorId,
          });
          if (rpcErr || rpcRes?.ok === false) {
            console.warn('[HUI Referral] rpc_register_with_ambassador fehlgeschlagen:', rpcErr?.message || rpcRes?.error);
            // localStorage NICHT löschen → processReferralForUser holt es beim naechsten Login nach
          } else {
            try { localStorage.removeItem('hui_referral_ambassador'); } catch {}
          }
        } catch (e) {
          console.warn('[HUI Referral] rpc_register_with_ambassador Exception:', e);
        }
      } else {
        // Kein ambassadorId sofort aufgeloest → Fallback ueber localStorage/AuthCallback
        processReferralForUser(signUpData.user.id).catch(() => {});
      }
    }

    // Auto-login
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (loginErr) {
      setSuccess('Konto erstellt! Bitte einloggen.');
      setMode('login'); setLoading(false);
    } else {
      setMode('onboarding');
      setLoading(false);
    }
  }

  async function handleMagicLink(e) {
    e.preventDefault(); clearMessages();
    if (!email) { setErr('Bitte gib deine E-Mail-Adresse ein.'); return; }
    if (mode === 'register') await persistManualRefLinkToStorage();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setErr(translateError(error.message));
    } else {
      setSuccess('Dein ruhiger Zugang ist unterwegs. Bitte prüf dein Postfach.');
    }
    setLoading(false);
  }

  async function handleForgot(e) {
    e.preventDefault(); clearMessages();
    if (!email) { setErr('Bitte gib deine E-Mail-Adresse ein.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
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
    if (mode === 'register') await persistManualRefLinkToStorage();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleApple() {
    clearMessages();
    if (mode === 'register') await persistManualRefLinkToStorage();
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  // ── Shared Layout ─────────────────────────────────────────────

  const cardStyle = {
    position: 'relative', zIndex: 1,
    width: '100%', maxWidth: 420,
    margin: '0 auto',
    padding: '32px 28px',
    background: 'rgba(10,10,10,0.55)',
    backdropFilter: 'blur(28px)',
    WebkitBackdropFilter: 'blur(28px)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 28,
    boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
    // Register hat mehr Felder — scrollbar wenn nötig
    ...(mode === 'register' ? {
      maxHeight: '92dvh',
      overflowY: 'auto',
      overflowX: 'hidden',
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
      <div style={{ position: 'relative', zIndex: 1, padding: '0 28px max(48px,env(safe-area-inset-bottom,48px))' }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontWeight: 900, fontSize: 42, color: T.white, letterSpacing: -1.8,
            lineHeight: 1.1, marginBottom: 16 }}>
            Verbinde dich<br/>mit Menschen,<br/>
            <span style={{ color: T.teal }}>die wirken.</span>
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.68)', lineHeight: 1.7, maxWidth: 320 }}>
            Ein ruhiges kreatives Netzwerk<br/>für echte Zusammenarbeit.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PrimaryBtn onClick={() => setMode('register')}>
            Werde Teil von HUI
          </PrimaryBtn>
          <GhostBtn onClick={() => setMode('login')}>
            Ich bin bereits dabei
          </GhostBtn>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button type="button" onClick={() => setMode('magic')}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: T.muted, fontFamily: 'inherit',
              textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.25)' }}>
            Per Magic Link anmelden
          </button>
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
      headline: 'Schön, dass du wieder da bist.',
      sub:      'Dein kreativer Raum wartet auf dich.',
      cta:      'Einloggen',
      switch:   'Noch kein Konto? Werde Teil von HUI →',
      switchMode: 'register',
    },
    register: {
      headline: 'Werde Teil eines ruhigen\nkreativen Netzwerks.',
      sub:      'Verbinde dich mit Menschen, die wirken.',
      cta:      'Konto erstellen',
      switch:   'Bereits dabei? Einloggen →',
      switchMode: 'login',
    },
    magic: {
      headline: 'Ruhiger Zugang\nper E-Mail.',
      sub:      'Kein Passwort nötig — wir senden dir einen sicheren Link.',
      cta:      'Magic Link senden',
      switch:   'Lieber mit Passwort einloggen →',
      switchMode: 'login',
    },
    forgot: {
      headline: 'Manchmal hilft\nein neuer Anfang.',
      sub:      'Wir senden dir einen Link zum Zurücksetzen.',
      cta:      'Link senden',
      switch:   'Zurück zum Login →',
      switchMode: 'login',
    },
  };

  const copy = COPY[mode] || COPY.login;

  const handleSubmit = mode === 'login'   ? handleLogin
                     : mode === 'register' ? handleRegister
                     : mode === 'magic'    ? handleMagicLink
                     :                       handleForgot;

  return (
    <div style={{ position: 'relative', minHeight: '100dvh', width: '100%', maxWidth: '100%', overflowX: 'hidden', overflow: 'hidden',
      display: 'flex', flexDirection: 'column' }}>
      <AtmosphericBackground imgIdx={bgIdx} />

      {}
      <div style={{
        position: 'relative', zIndex: 1, flex: 1,
        display: 'flex', flexDirection: 'column',
        padding: 'max(24px,env(safe-area-inset-top,24px)) 20px max(24px,env(safe-area-inset-bottom,24px))',
        overflowY: 'auto',
      }}>
        {}
        <button type="button" onClick={() => { clearMessages(); setMode('splash'); }}
          style={{ alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer',
            color: T.muted, fontSize: 14, fontFamily: 'inherit', padding: '4px 0', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Zurück
        </button>

        {}
        <div style={{ ...cardStyle, ...fadeStyle }}>
          {}
          {/* ── HUI Logo (Markenanker, Constitution-konform) ──── */}
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
            <HUILogoWordmark logoSize={44} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 900, fontSize: 20, color: T.white, letterSpacing: -0.5,
              lineHeight: 1.2, marginBottom: 6, whiteSpace: 'pre-line' }}>
              {copy.headline}
            </div>
            <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.6 }}>
              {copy.sub}
            </div>
          </div>

          {}
          {(mode === 'login' || mode === 'register') && (
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
          )}

          {}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {}
            {mode === 'register' && (
              <>
                {/* Vorname */}
                <GlassInput
                  id="firstname"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Vorname *"
                  autoComplete="given-name"
                  required
                />
                {/* Nachname */}
                <GlassInput
                  id="lastname"
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Nachname *"
                  autoComplete="family-name"
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
                  placeholder="Benutzername * (z.B. max_muster)"
                  autoComplete="username"
                  required
                  rightSlot={
                    username.trim().length >= 3 ? (
                      <span style={{
                        fontSize: 11, fontWeight: 700,
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
              </>
            )}

            {}
            <GlassInput
              id="email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); clearMessages(); }}
              placeholder="E-Mail-Adresse *"
              autoComplete="email"
            />

            {}
            {(mode === 'login' || mode === 'register') && (
              <GlassInput
                id="password"
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={e => { setPw(e.target.value); clearMessages(); }}
                placeholder="Passwort *"
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

            {/* REF-LINK — nur bei Registrierung sichtbar */}
            {mode === 'register' && (
              <div style={{ marginTop: 8 }}>
                <GlassInput
                  type="text"
                  value={refLink}
                  onChange={e => setRefLink(e.target.value)}
                  placeholder="Reflink (optional, z.B. milileo)"
                  autoComplete="off"
                  rightSlot={
                    refLink.trim() ? (
                      <span style={{
                        fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                        color: /^[a-z0-9._-]{2,40}$/i.test(refLink.trim())
                          ? '#0EC4B8' : 'rgba(255,138,107,0.9)',
                      }}>
                        {/^[a-z0-9._-]{2,40}$/i.test(refLink.trim()) ? '✓' : '✗'}
                      </span>
                    ) : null
                  }
                />
              </div>
            )}

            {}
            {err && <ErrorMessage msg={err} />}
            {success && <SuccessMessage msg={success} />}

            {}
            <div style={{ marginTop: 4 }}>
              <PrimaryBtn type="submit" loading={loading} disabled={loading}>
                {loading ? 'Bitte warten…' : copy.cta}
              </PrimaryBtn>
            </div>

            {}
            {mode === 'login' && (
              <div style={{ textAlign: 'center', marginTop: -4 }}>
                <button type="button" onClick={() => { clearMessages(); setMode('forgot'); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: T.muted, fontFamily: 'inherit' }}>
                  Passwort vergessen?
                </button>
              </div>
            )}

            {}
            {(mode === 'login' || mode === 'register') && (
              <>
                <Divider label="oder" />
                <button type="button" onClick={() => { clearMessages(); setMode('magic'); }}
                  style={{
                    width: '100%', padding: '14px',
                    background: T.glass, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                    border: `1.5px solid ${T.glassBorder}`, borderRadius: 14,
                    color: T.muted, fontSize: 14, fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'background 200ms ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
                  onMouseLeave={e => e.currentTarget.style.background = T.glass}
                >
                  ✉️ &nbsp;Per Magic Link anmelden
                </button>
              </>
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
            Mit der Registrierung stimmst du den <span style={{ textDecoration: 'underline' }}>Nutzungsbedingungen</span> zu.
          </div>
        </div>
      </div>
    </div>
  );
}
