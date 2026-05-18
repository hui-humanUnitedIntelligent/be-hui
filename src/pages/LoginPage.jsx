import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

// ── Design Tokens ───────────────────────────────────────────────
const T = {
  teal:    '#16D7C5',
  teal2:   '#0FC4B2',
  coral:   '#FF8A6B',
  white:   '#FFFFFF',
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

// ── HUI Logo — neue Brand Identity ──────────────────────────────
function HuiLogo({ size = 64, glow = true }) {
  return (
    <div style={{
      width: size, height: size, position: 'relative', flexShrink: 0,
      ...(glow && {
        filter: [
          'drop-shadow(0 0 ' + Math.round(size*0.22) + 'px rgba(22,215,197,0.55))',
          'drop-shadow(0 0 ' + Math.round(size*0.45) + 'px rgba(22,215,197,0.22))',
          'drop-shadow(0 ' + Math.round(size*0.06) + 'px ' + Math.round(size*0.18) + 'px rgba(0,0,0,0.35))',
        ].join(' '),
      }),
    }}>
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-label="HUI Logo">
        <defs>
          <linearGradient id="hl-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1ED8C8"/>
            <stop offset="45%" stopColor="#22D4C4"/>
            <stop offset="100%" stopColor="#FF7A5C"/>
          </linearGradient>
          <linearGradient id="hl-sh" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.28"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </linearGradient>
          <radialGradient id="hl-cr" cx="80%" cy="80%" r="50%">
            <stop offset="0%" stopColor="#FF8A6B" stopOpacity="0.55"/>
            <stop offset="100%" stopColor="#FF8A6B" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="hl-tl" cx="20%" cy="20%" r="50%">
            <stop offset="0%" stopColor="#22EDD8" stopOpacity="0.40"/>
            <stop offset="100%" stopColor="#22EDD8" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect x="3" y="3" width="114" height="114" rx="30" fill="url(#hl-bg)"/>
        <rect x="3" y="3" width="114" height="114" rx="30" fill="url(#hl-cr)"/>
        <rect x="3" y="3" width="114" height="114" rx="30" fill="url(#hl-tl)"/>
        <rect x="3" y="3" width="114" height="62"  rx="30" fill="url(#hl-sh)"/>
        <circle cx="60" cy="62" r="38" fill="white" fillOpacity="0.92"/>
        <path d="M30 42 C28 50 28 62 28 62 C28 74 30 82 30 82" stroke="url(#hl-bg)" strokeWidth="9" strokeLinecap="round" fill="none"/>
        <path d="M50 42 C52 50 52 62 52 62 C52 74 50 82 50 82" stroke="url(#hl-bg)" strokeWidth="9" strokeLinecap="round" fill="none"/>
        <path d="M29 62 L51 62" stroke="url(#hl-bg)" strokeWidth="8" strokeLinecap="round" fill="none"/>
        <path d="M56 42 L56 68 C56 76 65 83 70 76 C74 69 72 42 72 42" stroke="url(#hl-bg)" strokeWidth="9" strokeLinecap="round" fill="none"/>
        <circle cx="82" cy="44" r="5.5" fill="url(#hl-bg)"/>
        <path d="M82 54 L82 82" stroke="url(#hl-bg)" strokeWidth="9" strokeLinecap="round" fill="none"/>
        <path d="M72 18 C85 14 100 20 108 32 C114 42 112 55 105 62" stroke="#22EDD8" strokeWidth="7" strokeLinecap="round" fill="none" strokeOpacity="0.75"/>
        <path d="M48 104 C38 108 22 104 14 92 C8 82 10 68 17 60" stroke="#FF8A6B" strokeWidth="7" strokeLinecap="round" fill="none" strokeOpacity="0.75"/>
        <rect x="3" y="3" width="114" height="114" rx="30" fill="none" stroke="white" strokeOpacity="0.18" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}

// ── Glass Input ──────────────────────────────────────────────────
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
          padding: rightSlot ? '16px 52px 16px 20px' : '16px 20px',
          background: focused ? 'rgba(255,255,255,0.12)' : T.glass,
          border: `1.5px solid ${focused ? T.glassFocus : T.glassBorder}`,
          borderRadius: 16,
          fontSize: 16,
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
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px rgba(22,215,197,0.08) inset !important;
          -webkit-text-fill-color: #fff !important;
          caret-color: #16D7C5;
          border-radius: 16px;
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
        padding: '17px',
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
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.98)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      onTouchStart={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.98)'; }}
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
        padding: '16px',
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
        padding: '14px 12px',
        background: 'rgba(255,255,255,0.09)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1.5px solid ${T.glassBorder}`,
        borderRadius: 14,
        color: T.white,
        fontSize: 14,
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
      {/* Cinematic Bild */}
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
      {/* Teal-Hauch oben */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(160deg, rgba(22,215,197,0.18) 0%, transparent 45%)',
      }}/>
      {/* Dunkel-Overlay unten — für Lesbarkeit */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.82) 100%)',
      }}/>
      {/* Warmer Coral-Hauch rechts unten */}
      <div style={{
        position: 'absolute',
        right: '-10%', bottom: '-10%',
        width: '55%', height: '55%',
        background: 'radial-gradient(circle, rgba(255,138,107,0.14) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>
      {/* Noise texture overlay für Tiefe */}
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
      color: '#16D7C5',
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
  const { isAuthenticated, loadingAuth } = useAuth();

  // Modes: 'splash' | 'login' | 'register' | 'magic' | 'forgot' | 'onboarding'
  const [mode,       setMode]       = useState('splash');
  const [email,      setEmail]      = useState('');
  const [pw,         setPw]         = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [fullName,   setFullName]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [err,        setErr]        = useState('');
  const [success,    setSuccess]    = useState('');
  const [bgIdx]                     = useState(() => Math.floor(Math.random() * BG_IMAGES.length));
  const [fadeIn,     setFadeIn]     = useState(false);
  // Onboarding intent
  const [intent,     setIntent]     = useState('');

  useEffect(() => {
    if (!loadingAuth && isAuthenticated) {
      navigate('/Home', { replace: true });
    }
  }, [isAuthenticated, loadingAuth, navigate]);

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
    return msg || 'Ein Fehler ist aufgetreten.';
  }

  // ── Auth Actions ──────────────────────────────────────────────

  async function handleLogin(e) {
    e.preventDefault(); clearMessages();
    if (!email || !pw) { setErr('Bitte E-Mail und Passwort eingeben.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) { setErr(translateError(error.message)); setLoading(false); }
    // success → useEffect navigates
  }

  async function handleRegister(e) {
    e.preventDefault(); clearMessages();
    if (!email || !pw) { setErr('Bitte E-Mail und Passwort eingeben.'); return; }
    if (pw.length < 6) { setErr('Das Passwort muss mindestens 6 Zeichen haben.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password: pw,
      options: { data: { full_name: fullName || '' } },
    });
    if (error) {
      setErr(translateError(error.message));
      setLoading(false);
      return;
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
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleApple() {
    clearMessages();
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
    <div style={{ position: 'relative', minHeight: '100dvh', overflow: 'hidden',
      display: 'flex', flexDirection: 'column' }}>
      <AtmosphericBackground imgIdx={bgIdx} />

      {/* Logo oben */}
      <div style={{ position: 'relative', zIndex: 1, padding: 'max(52px,env(safe-area-inset-top,52px)) 28px 0',
        display: 'flex', alignItems: 'center', gap: 12 }}>
        <HuiLogo size={44} />
        <div>
          <div style={{ fontWeight: 900, fontSize: 20, color: T.white, letterSpacing: -0.6 }}>HUI</div>
          <div style={{ fontSize: 11, color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Human United Intelligent
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }}/>

      {/* Hero Text + CTAs */}
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
  // ONBOARDING LIGHT (nach Registrierung)
  // ════════════════════════════════════════════════════
  if (mode === 'onboarding') return (
    <div style={{ position: 'relative', minHeight: '100dvh', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 24px' }}>
      <AtmosphericBackground imgIdx={bgIdx} />
      <div style={{ ...cardStyle, ...fadeStyle, textAlign: 'center' }}>
        <HuiLogo size={56} />
        <div style={{ marginTop: 24, fontWeight: 900, fontSize: 26, color: T.white,
          letterSpacing: -0.8, lineHeight: 1.2, marginBottom: 8 }}>
          Schön, dass du da bist.
        </div>
        <div style={{ fontSize: 15, color: T.muted, lineHeight: 1.65, marginBottom: 32 }}>
          Was suchst du gerade?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {[
            { key: 'collab',   label: 'Kreative Zusammenarbeit' },
            { key: 'local',    label: 'Lokale Resonanz' },
            { key: 'spaces',   label: 'Ruhige kreative Räume' },
            { key: 'impulse',  label: 'Neue kreative Impulse' },
          ].map(opt => (
            <button key={opt.key} type="button"
              onClick={() => { setIntent(opt.key); setTimeout(() => navigate('/Home', {replace:true}), 300); }}
              style={{
                padding: '14px 20px',
                background: intent === opt.key ? 'rgba(22,215,197,0.18)' : T.glass,
                border: `1.5px solid ${intent === opt.key ? T.glassFocus : T.glassBorder}`,
                borderRadius: 14,
                color: T.white, fontSize: 15, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                transition: 'background 200ms ease, border-color 200ms ease',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => { if (intent !== opt.key) e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
              onMouseLeave={e => { if (intent !== opt.key) e.currentTarget.style.background = T.glass; }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => navigate('/Home', {replace:true})}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: T.muted, fontFamily: 'inherit' }}>
          Überspringen — ich erkunde selbst
        </button>
      </div>
    </div>
  );

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
    <div style={{ position: 'relative', minHeight: '100dvh', overflow: 'hidden',
      display: 'flex', flexDirection: 'column' }}>
      <AtmosphericBackground imgIdx={bgIdx} />

      {/* Scrollable content */}
      <div style={{
        position: 'relative', zIndex: 1, flex: 1,
        display: 'flex', flexDirection: 'column',
        padding: 'max(52px,env(safe-area-inset-top,52px)) 20px max(32px,env(safe-area-inset-bottom,32px))',
        overflowY: 'auto',
      }}>
        {/* Back Button */}
        <button type="button" onClick={() => { clearMessages(); setMode('splash'); }}
          style={{ alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer',
            color: T.muted, fontSize: 14, fontFamily: 'inherit', padding: '4px 0', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Zurück
        </button>

        {/* Logo zentriert */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
          marginBottom: 32, ...fadeStyle }}>
          <HuiLogo size={52} />
          <div style={{ marginTop: 8, fontSize: 11, color: T.muted, letterSpacing: '0.08em',
            textTransform: 'uppercase' }}>Human United Intelligent</div>
        </div>

        {/* Card */}
        <div style={{ ...cardStyle, ...fadeStyle }}>
          {/* Headline */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 900, fontSize: 26, color: T.white, letterSpacing: -0.8,
              lineHeight: 1.2, marginBottom: 8, whiteSpace: 'pre-line' }}>
              {copy.headline}
            </div>
            <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.6 }}>
              {copy.sub}
            </div>
          </div>

          {/* Social Login — nur bei login/register */}
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

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Name-Feld nur bei Register */}
            {mode === 'register' && (
              <GlassInput
                id="fullname"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Dein Name (optional)"
                autoComplete="name"
              />
            )}

            {/* E-Mail */}
            <GlassInput
              id="email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); clearMessages(); }}
              placeholder="E-Mail-Adresse"
              autoComplete="email"
            />

            {/* Passwort — nicht bei magic/forgot */}
            {(mode === 'login' || mode === 'register') && (
              <GlassInput
                id="password"
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={e => { setPw(e.target.value); clearMessages(); }}
                placeholder="Passwort"
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

            {/* Fehlermeldung */}
            {err && <ErrorMessage msg={err} />}
            {success && <SuccessMessage msg={success} />}

            {/* Submit */}
            <div style={{ marginTop: 4 }}>
              <PrimaryBtn type="submit" loading={loading} disabled={loading}>
                {loading ? 'Bitte warten…' : copy.cta}
              </PrimaryBtn>
            </div>

            {/* Forgot Password Link */}
            {mode === 'login' && (
              <div style={{ textAlign: 'center', marginTop: -4 }}>
                <button type="button" onClick={() => { clearMessages(); setMode('forgot'); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: T.muted, fontFamily: 'inherit' }}>
                  Passwort vergessen?
                </button>
              </div>
            )}

            {/* Magic Link Option */}
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

          {/* Mode Switch */}
          <div style={{ marginTop: 20, textAlign: 'center', borderTop: `1px solid ${T.glassBorder}`, paddingTop: 20 }}>
            <button type="button" onClick={() => { clearMessages(); setMode(copy.switchMode); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, color: T.teal, fontWeight: 600, fontFamily: 'inherit' }}>
              {copy.switch}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', lineHeight: 1.8 }}>
            Mit der Registrierung stimmst du den <span style={{ textDecoration: 'underline' }}>Nutzungsbedingungen</span> zu.
          </div>
        </div>
      </div>
    </div>
  );
}
