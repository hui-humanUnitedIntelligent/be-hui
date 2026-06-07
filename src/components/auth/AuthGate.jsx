// src/components/auth/AuthGate.jsx — Phase 4A
// ══════════════════════════════════════════════════════════════
// Wraps any action that requires auth.
// If not logged in → shows elegant auth modal (not redirect).
// Usage:
//   <AuthGate action="story posten" onAuth={handlePost}>
//     <button>Story posten</button>
//   </AuthGate>
//
// OR imperatively:
//   const { requireAuth } = useAuthGate();
//   requireAuth("liken", () => doLike());
// ══════════════════════════════════════════════════════════════
import React, { useState, createContext, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext.jsx";

const TEAL  = "#16D7C5";
const CORAL = "#FF8A6B";
const INK   = "#1A1A2E";

const CSS_STR = `
@keyframes agIn {
  from { opacity:0; transform:translateY(32px) scale(0.96); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
@keyframes agBackdropIn {
  from { opacity:0; }
  to   { opacity:1; }
}
`;
let _css = false;
function injectCSS() {
  if (_css || typeof document === "undefined") return;
  _css = true;
  const s = document.createElement("style"); s.textContent = CSS_STR;
  document.head.appendChild(s);
}

import { getStoredReferral, validateRefLink, processReferralAfterSignup } from "../../lib/referralTracking.js";

// ── Auth Modal ────────────────────────────────────────────────
function AuthModal({ action, onClose, onConfirm }) {
  injectCSS();
  const { signIn, signUp } = useAuth();
  const [mode,   setMode]  = useState("prompt"); // prompt | login | signup
  const [email,  setEmail] = useState("");
  const [pw,     setPw]    = useState("");
  const [name,   setName]  = useState("");
  const [refInput, setRefInput]   = useState(() => {
    const stored = getStoredReferral();
    return stored ? "https://be-hui.com/" + stored : "";
  });
  const [refValid, setRefValid]   = useState(null); // null | true | false
  const [err,    setErr]   = useState(null);
  const [busy,   setBusy]  = useState(false);
  const navigate = useNavigate();

  async function handleSignIn(e) {
    e.preventDefault();
    if (!email || !pw) { setErr("Bitte alle Felder ausfüllen"); return; }
    setBusy(true); setErr(null);
    const { error } = await signIn(email, pw);
    setBusy(false);
    if (error) {
      setErr(
        error.message?.includes("Invalid login") ? "E-Mail oder Passwort falsch" :
        error.message?.includes("Email not confirmed") ? "Bitte bestätige zuerst deine E-Mail" :
        error.message?.includes("network") ? "Netzwerkfehler — bitte versuche es erneut" :
        error.message || "Anmeldung fehlgeschlagen"
      );
      return;
    }
    onConfirm?.();
    onClose();
  }

  async function handleSignUp(e) {
    e.preventDefault();
    if (!email || !pw || !name) { setErr("Bitte alle Felder ausfüllen"); return; }
    if (pw.length < 8) { setErr("Passwort muss mindestens 8 Zeichen haben"); return; }
    setBusy(true); setErr(null);
    const { error } = await signUp(email, pw, name);
    setBusy(false);
    if (error) {
      setErr(
        error.message?.includes("already registered") ? "Diese E-Mail ist bereits registriert" :
        error.message?.includes("network") ? "Netzwerkfehler — bitte versuche es erneut" :
        error.message || "Registrierung fehlgeschlagen"
      );
      return;
    }
    // Referral verarbeiten (non-blocking)
    if (refInput.trim()) {
      validateRefLink(refInput).then(res => {
        if (res.valid) processReferralAfterSignup(undefined, res.username);
      });
    } else {
      const stored = getStoredReferral();
      if (stored) processReferralAfterSignup(undefined, stored);
    }
    // success
    setMode("verify");
  }

  const inputStyle = {
    width:"100%",padding:"13px 16px",
    border:"1.5px solid rgba(26,26,46,0.12)",borderRadius:14,
    fontSize:15,color:INK,outline:"none",
    fontFamily:"inherit",boxSizing:"border-box",
    background:"rgba(249,247,244,0.7)",
    transition:"border-color 0.2s",
  };

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:19000,
      display:"flex",alignItems:"flex-end",justifyContent:"center",
      animation:"agBackdropIn 0.2s ease both",
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div style={{
        position:"absolute",inset:0,
        background:"rgba(26,26,46,0.45)",
        backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",
      }}/>

      {/* Sheet */}
      <div style={{
        position:"relative",width:"100%",maxWidth:480,
        background:"#fff",
        borderRadius:"28px 28px 0 0",
        padding:"28px 24px calc(env(safe-area-inset-bottom,16px) + 28px)",
        animation:"agIn 0.3s cubic-bezier(.22,1,.36,1) both",
        fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      }}>
        {/* Handle */}
        <div style={{
          width:36,height:4,borderRadius:2,background:"rgba(26,26,46,0.12)",
          margin:"0 auto 24px",
        }}/>

        {mode === "prompt" && (
          <>
            <div style={{textAlign:"center",marginBottom:24}}>
              <div style={{fontSize:32,marginBottom:12}}>✦</div>
              <div style={{fontSize:20,fontWeight:800,color:INK,marginBottom:8,letterSpacing:-0.4}}>
                {action ? `Um ${action}, brauchst du ein Konto` : "Bitte melde dich an"}
              </div>
              <div style={{fontSize:14,color:"rgba(26,26,46,0.5)",lineHeight:1.6}}>
                Werde Teil von HUI — einer Gemeinschaft echter kreativer Menschen.
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <button onClick={() => setMode("login")} style={{
                width:"100%",padding:"15px",borderRadius:18,border:"none",
                background:`linear-gradient(135deg,${TEAL},#0FC4B2)`,
                color:"#fff",fontSize:16,fontWeight:800,
                cursor:"pointer",touchAction:"manipulation",
                boxShadow:"0 4px 20px rgba(22,215,197,0.35)",
              }}>Anmelden</button>
              <button onClick={() => setMode("signup")} style={{
                width:"100%",padding:"15px",borderRadius:18,
                border:"1.5px solid rgba(22,215,197,0.25)",
                background:"rgba(22,215,197,0.06)",
                color:TEAL,fontSize:15,fontWeight:700,
                cursor:"pointer",touchAction:"manipulation",
              }}>Neu registrieren</button>
              <button onClick={onClose} style={{
                background:"none",border:"none",color:"rgba(26,26,46,0.35)",
                fontSize:13,cursor:"pointer",textDecoration:"underline",
                touchAction:"manipulation",marginTop:4,
              }}>Lieber nicht</button>
            </div>
          </>
        )}

        {mode === "login" && (
          <>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:20,fontWeight:800,color:INK,letterSpacing:-0.4}}>Willkommen zurück</div>
              <div style={{fontSize:13,color:"rgba(26,26,46,0.45)",marginTop:4}}>
                Melde dich mit deiner E-Mail an
              </div>
            </div>
            <form onSubmit={handleSignIn} style={{display:"flex",flexDirection:"column",gap:12}}>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="E-Mail" autoComplete="email" style={inputStyle}
                onFocus={e=>e.target.style.borderColor=TEAL}
                onBlur={e=>e.target.style.borderColor="rgba(26,26,46,0.12)"}/>
              <input type="password" value={pw} onChange={e=>setPw(e.target.value)}
                placeholder="Passwort" autoComplete="current-password" style={inputStyle}
                onFocus={e=>e.target.style.borderColor=TEAL}
                onBlur={e=>e.target.style.borderColor="rgba(26,26,46,0.12)"}/>
              {err && <div style={{fontSize:13,color:"#EF4444",padding:"8px 12px",
                background:"rgba(239,68,68,0.07)",borderRadius:10}}>{err}</div>}
              {/* Einladungslink (optional) */}
              <div style={{marginBottom:4}}>
                <div style={{fontSize:11,color:"rgba(26,26,46,0.5)",marginBottom:5,fontWeight:500}}>
                  Hast du einen Einladungslink? <span style={{fontWeight:400}}>(optional)</span>
                </div>
                <div style={{position:"relative"}}>
                  <input
                    type="text"
                    value={refInput}
                    onChange={async e => {
                      setRefInput(e.target.value);
                      setRefValid(null);
                      if (e.target.value.trim().length > 5) {
                        const res = await validateRefLink(e.target.value);
                        setRefValid(res.valid);
                      }
                    }}
                    placeholder="https://be-hui.com/username"
                    style={{...inputStyle, paddingRight:36,
                      borderColor: refValid === true ? "#0EC4B8" : refValid === false ? "#FF5B5B" : "rgba(26,26,46,0.12)"
                    }}
                    onFocus={e=>e.target.style.borderColor= refValid === false ? "#FF5B5B" : TEAL}
                    onBlur={e=>e.target.style.borderColor= refValid === true ? "#0EC4B8" : refValid === false ? "#FF5B5B" : "rgba(26,26,46,0.12)"}
                  />
                  {refValid === true && <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"#0EC4B8",fontSize:14}}>✓</span>}
                  {refValid === false && <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"#FF5B5B",fontSize:14}}>✗</span>}
                </div>
                {refValid === true && <div style={{fontSize:11,color:"#0EC4B8",marginTop:3}}>✅ Gültiger Einladungslink</div>}
                {refValid === false && <div style={{fontSize:11,color:"#FF5B5B",marginTop:3}}>❌ Link nicht gefunden — trotzdem fortfahren?</div>}
              </div>

              <button type="submit" disabled={busy} style={{
                padding:"15px",borderRadius:18,border:"none",
                background: busy ? "rgba(22,215,197,0.35)" : `linear-gradient(135deg,${TEAL},#0FC4B2)`,
                color:"#fff",fontSize:16,fontWeight:800,
                cursor:busy?"default":"pointer",touchAction:"manipulation",
                marginTop:4,
              }}>{busy ? "Anmelden…" : "Anmelden"}</button>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                <button type="button" onClick={() => navigate("/forgot-password")} style={{
                  background:"none",border:"none",color:TEAL,fontSize:12.5,
                  cursor:"pointer",textDecoration:"underline",touchAction:"manipulation",
                }}>Passwort vergessen?</button>
                <button type="button" onClick={() => { setMode("signup"); setErr(null); }} style={{
                  background:"none",border:"none",color:"rgba(26,26,46,0.4)",fontSize:12.5,
                  cursor:"pointer",textDecoration:"underline",touchAction:"manipulation",
                }}>Noch kein Konto?</button>
              </div>
            </form>
          </>
        )}

        {mode === "signup" && (
          <>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:20,fontWeight:800,color:INK,letterSpacing:-0.4}}>Jetzt beitreten</div>
              <div style={{fontSize:13,color:"rgba(26,26,46,0.45)",marginTop:4}}>
                Kostenlos und in unter einer Minute
              </div>
            </div>
            <form onSubmit={handleSignUp} style={{display:"flex",flexDirection:"column",gap:12}}>
              <input type="text" value={name} onChange={e=>setName(e.target.value)}
                placeholder="Dein Name" autoComplete="name" style={inputStyle}
                onFocus={e=>e.target.style.borderColor=TEAL}
                onBlur={e=>e.target.style.borderColor="rgba(26,26,46,0.12)"}/>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="E-Mail" autoComplete="email" style={inputStyle}
                onFocus={e=>e.target.style.borderColor=TEAL}
                onBlur={e=>e.target.style.borderColor="rgba(26,26,46,0.12)"}/>
              <input type="password" value={pw} onChange={e=>setPw(e.target.value)}
                placeholder="Passwort (min. 8 Zeichen)" autoComplete="new-password" style={inputStyle}
                onFocus={e=>e.target.style.borderColor=TEAL}
                onBlur={e=>e.target.style.borderColor="rgba(26,26,46,0.12)"}/>
              {err && <div style={{fontSize:13,color:"#EF4444",padding:"8px 12px",
                background:"rgba(239,68,68,0.07)",borderRadius:10}}>{err}</div>}
              {/* Einladungslink (optional) */}
              <div style={{marginBottom:4}}>
                <div style={{fontSize:11,color:"rgba(26,26,46,0.5)",marginBottom:5,fontWeight:500}}>
                  Hast du einen Einladungslink? <span style={{fontWeight:400}}>(optional)</span>
                </div>
                <div style={{position:"relative"}}>
                  <input
                    type="text"
                    value={refInput}
                    onChange={async e => {
                      setRefInput(e.target.value);
                      setRefValid(null);
                      if (e.target.value.trim().length > 5) {
                        const res = await validateRefLink(e.target.value);
                        setRefValid(res.valid);
                      }
                    }}
                    placeholder="https://be-hui.com/username"
                    style={{...inputStyle, paddingRight:36,
                      borderColor: refValid === true ? "#0EC4B8" : refValid === false ? "#FF5B5B" : "rgba(26,26,46,0.12)"
                    }}
                    onFocus={e=>e.target.style.borderColor= refValid === false ? "#FF5B5B" : TEAL}
                    onBlur={e=>e.target.style.borderColor= refValid === true ? "#0EC4B8" : refValid === false ? "#FF5B5B" : "rgba(26,26,46,0.12)"}
                  />
                  {refValid === true && <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"#0EC4B8",fontSize:14}}>✓</span>}
                  {refValid === false && <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"#FF5B5B",fontSize:14}}>✗</span>}
                </div>
                {refValid === true && <div style={{fontSize:11,color:"#0EC4B8",marginTop:3}}>✅ Gültiger Einladungslink</div>}
                {refValid === false && <div style={{fontSize:11,color:"#FF5B5B",marginTop:3}}>❌ Link nicht gefunden — trotzdem fortfahren?</div>}
              </div>

              <button type="submit" disabled={busy} style={{
                padding:"15px",borderRadius:18,border:"none",
                background: busy ? "rgba(22,215,197,0.35)" : `linear-gradient(135deg,${TEAL},${CORAL})`,
                color:"#fff",fontSize:16,fontWeight:800,
                cursor:busy?"default":"pointer",touchAction:"manipulation",marginTop:4,
              }}>{busy ? "Registrieren…" : "Konto erstellen"}</button>
              <button type="button" onClick={() => { setMode("login"); setErr(null); }} style={{
                background:"none",border:"none",color:"rgba(26,26,46,0.4)",fontSize:12.5,
                cursor:"pointer",textDecoration:"underline",touchAction:"manipulation",
              }}>Bereits ein Konto? Anmelden</button>
            </form>
          </>
        )}

        {mode === "verify" && (
          <div style={{textAlign:"center",padding:"12px 0"}}>
            <div style={{fontSize:48,marginBottom:16}}>✉️</div>
            <div style={{fontSize:20,fontWeight:800,color:INK,marginBottom:8}}>E-Mail bestätigen</div>
            <div style={{fontSize:14,color:"rgba(26,26,46,0.5)",lineHeight:1.7}}>
              Wir haben dir einen Link geschickt.<br/>
              Bitte schaue in deinem Posteingang nach.
            </div>
            <button onClick={onClose} style={{
              marginTop:24,padding:"13px 28px",borderRadius:18,border:"none",
              background:`linear-gradient(135deg,${TEAL},#0FC4B2)`,
              color:"#fff",fontSize:15,fontWeight:700,
              cursor:"pointer",touchAction:"manipulation",
            }}>Ok, habe ich</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Context for imperative usage ──────────────────────────────
const AuthGateCtx = createContext(null);

export function AuthGateProvider({ children }) {
  const [modal, setModal] = useState(null); // { action, cb }
  const { isAuthenticated } = useAuth();

  const requireAuth = useCallback((action, cb) => {
    if (isAuthenticated) { cb?.(); return; }
    setModal({ action, cb });
  }, [isAuthenticated]);

  return (
    <AuthGateCtx.Provider value={{ requireAuth }}>
      {children}
      {modal && (
        <AuthModal
          action={modal.action}
          onClose={() => setModal(null)}
          onConfirm={() => { modal.cb?.(); setModal(null); }}
        />
      )}
    </AuthGateCtx.Provider>
  );
}

export function useAuthGate() {
  const ctx = useContext(AuthGateCtx);
  if (!ctx) return { requireAuth: (_, cb) => cb?.() }; // graceful fallback
  return ctx;
}

// ── Declarative wrapper ───────────────────────────────────────
export function AuthGate({ action, onAuth, children }) {
  const { isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);

  function handleClick(e) {
    if (!isAuthenticated) {
      e.preventDefault(); e.stopPropagation();
      setShowModal(true);
      return;
    }
    onAuth?.();
  }

  return (
    <>
      <div onClick={handleClick} style={{ display:"contents" }}>{children}</div>
      {showModal && (
        <AuthModal
          action={action}
          onClose={() => setShowModal(false)}
          onConfirm={() => { setShowModal(false); onAuth?.(); }}
        />
      )}
    </>
  );
}
