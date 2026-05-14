import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabaseClient';

const C = {
  teal:"#16D7C5", teal2:"#11C5B7",
  coral:"#FF8A6B", coral2:"#FF7B72",
  cream:"#F9F6F2", card:"#FFFFFF",
  ink:"#1A1A1A", muted:"#888888",
};

function HuiLogo({ size=52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="ll-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22E8D8"/>
          <stop offset="100%" stopColor="#FF8A6B"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#ll-g)"/>
      <rect x="2" y="2" width="60" height="28" rx="18" fill="white" fillOpacity="0.15"/>
      <text x="10" y="44" fontSize="30" fontWeight="900" fill="white"
        fontFamily="-apple-system,system-ui,sans-serif" letterSpacing="-2">Hj</text>
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loadingAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [mode, setMode] = useState('splash');

  // If already authenticated → go to Home
  useEffect(() => {
    if (!loadingAuth && isAuthenticated) {
      navigate('/Home', { replace: true });
    }
  }, [isAuthenticated, loadingAuth, navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) {
      // Translate common Supabase error messages to German
      const msg = error.message?.includes('Invalid login credentials')
        ? 'E-Mail oder Passwort falsch.'
        : error.message?.includes('Email not confirmed')
          ? 'Bitte bestätige zuerst deine E-Mail-Adresse.'
          : error.message || 'Login fehlgeschlagen.';
      setErr(msg);
      setLoading(false);
    }
    // Navigation handled by useEffect above when isAuthenticated changes
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true); setErr('');
    const { error } = await supabase.auth.signUp({ email, password: pw });
    if (error) {
      const msg = error.message?.includes('already registered')
        ? 'Diese E-Mail ist bereits registriert. Bitte einloggen.'
        : error.message || 'Registrierung fehlgeschlagen.';
      setErr(msg);
      setLoading(false);
      return;
    }
    // Auto-login after register
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (loginErr) {
      setMode('login');
      setErr('Konto erstellt! Bitte einloggen.');
      setLoading(false);
    }
    // Navigation handled by useEffect above when isAuthenticated changes
  }

  // SPLASH
  if (mode === 'splash') return (
    <div style={{ height:"100dvh", overflow:"hidden", position:"relative", background:"#1A1208" }}>
      <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=90"
        alt="HUI"
        style={{ position:"absolute", inset:0, width:"100%", height:"100%",
          objectFit:"cover", filter:"brightness(0.55) saturate(1.15)" }}/>
      <div style={{ position:"absolute", inset:0,
        background:`linear-gradient(to bottom, rgba(22,215,197,0.25) 0%, rgba(0,0,0,0.02) 40%, rgba(26,18,8,0.88) 100%)` }}/>
      <div style={{ position:"relative", height:"100%", display:"flex", flexDirection:"column", padding:"0 28px" }}>
        <div style={{ paddingTop:"max(60px, env(safe-area-inset-top,60px))", display:"flex", alignItems:"center", gap:12 }}>
          <HuiLogo size={48} />
          <div>
            <div style={{ fontWeight:900, fontSize:22, color:"white", letterSpacing:-0.8 }}>HUI</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:500 }}>Human United Intelligent</div>
          </div>
        </div>
        <div style={{ flex:1 }} />
        <div style={{ paddingBottom:"max(44px, env(safe-area-inset-bottom,44px))" }}>
          <div style={{ fontWeight:900, fontSize:38, color:"white", letterSpacing:-1.5, lineHeight:1.15, marginBottom:12 }}>
            Verbinde dich<br/>mit Menschen,<br/>
            <span style={{ color:C.teal }}>die wirken.</span>
          </div>
          <div style={{ fontSize:15, color:"rgba(255,255,255,0.75)", lineHeight:1.65, marginBottom:36 }}>
            Für eine Welt, die gemeinsam<br/>mehr bewegt.
          </div>
          <button onClick={()=>setMode('register')}
            style={{ width:"100%", padding:"16px", marginBottom:12,
              background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
              color:"white", border:"none", borderRadius:16,
              fontSize:17, fontWeight:800, cursor:"pointer", fontFamily:"inherit",
              boxShadow:"0 4px 20px rgba(22,215,197,0.45)", WebkitTapHighlightColor:"transparent" }}>
            Los geht's
          </button>
          <button onClick={()=>setMode('login')}
            style={{ width:"100%", padding:"15px",
              background:"rgba(255,255,255,0.10)", backdropFilter:"blur(10px)",
              color:"white", border:"1.5px solid rgba(255,255,255,0.25)",
              borderRadius:16, fontSize:15, fontWeight:600,
              cursor:"pointer", fontFamily:"inherit", WebkitTapHighlightColor:"transparent" }}>
            Einloggen
          </button>
        </div>
      </div>
    </div>
  );

  // LOGIN / REGISTER
  return (
    <div style={{ minHeight:"100dvh", background:C.cream, display:"flex", flexDirection:"column",
      padding:"max(60px,env(safe-area-inset-top,60px)) 28px 40px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:40 }}>
        <HuiLogo size={44} />
        <div style={{ fontWeight:900, fontSize:20, color:C.ink }}>HUI</div>
      </div>
      <div style={{ fontWeight:900, fontSize:30, color:C.ink, letterSpacing:-0.8, marginBottom:8 }}>
        {mode==="login" ? "Willkommen zurück" : "Konto erstellen"}
      </div>
      <div style={{ fontSize:15, color:C.muted, marginBottom:32 }}>
        {mode==="login" ? "Schön, dich wiederzusehen." : "Werde Teil der HUI-Community."}
      </div>
      <form onSubmit={mode==="login"?handleLogin:handleRegister}>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
          placeholder="E-Mail-Adresse"
          style={{ width:"100%", padding:"15px 18px", marginBottom:12,
            background:C.card, border:`1.5px solid #E8E2D8`,
            borderRadius:16, fontSize:15, color:C.ink,
            outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}/>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)}
          placeholder="Passwort"
          style={{ width:"100%", padding:"15px 18px", marginBottom:24,
            background:C.card, border:`1.5px solid #E8E2D8`,
            borderRadius:16, fontSize:15, color:C.ink,
            outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}/>
        {err && <div style={{ color:C.coral, fontSize:13, marginBottom:16,
          padding:"10px 14px", background:"#FFF2EE", borderRadius:12 }}>{err}</div>}
        <button type="submit" disabled={loading}
          style={{ width:"100%", padding:"16px",
            background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
            color:"white", border:"none", borderRadius:16,
            fontSize:17, fontWeight:800, cursor:"pointer", fontFamily:"inherit", marginBottom:16,
            boxShadow:"0 4px 20px rgba(22,215,197,0.40)", opacity:loading?0.75:1 }}>
          {loading ? "Bitte warten…" : mode==="login" ? "Einloggen" : "Konto erstellen"}
        </button>
      </form>
      <button onClick={()=>setMode(mode==="login"?"register":"login")}
        style={{ background:"none", border:"none", cursor:"pointer",
          fontSize:14, color:C.teal, fontWeight:600, textAlign:"center" }}>
        {mode==="login" ? "Noch kein Konto? Jetzt registrieren →" : "Bereits registriert? Einloggen →"}
      </button>
      <button onClick={()=>setMode('splash')}
        style={{ marginTop:12, background:"none", border:"none",
          cursor:"pointer", fontSize:13, color:C.muted }}>
        ← Zurück
      </button>
    </div>
  );
}
