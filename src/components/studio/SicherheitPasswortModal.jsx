import { HUIAnsichtIcon, HUIDatenschutzIcon } from '../../design/icons/HuiSystemIcons.jsx';
// SicherheitPasswortModal.jsx — Passwort ändern via Supabase Auth
// ═══════════════════════════════════════════════════════════════
// Nutzt supabase.auth.updateUser({ password }) für direktes Update
// + supabase.auth.resetPasswordForEmail() für Reset per E-Mail
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";

const T = {
  bg:       "#F7F5F0",
  bgCard:   "#FFFFFF",
  teal:     "#0EC4B8",
  tealDeep: "#0AADA3",
  tealSoft: "rgba(14,196,184,0.10)",
  tealMid:  "rgba(14,196,184,0.22)",
  coral:    "#FF6B6B",
  coralSoft:"rgba(255,107,107,0.10)",
  coralMid: "rgba(255,107,107,0.22)",
  green:    "#10B981",
  greenSoft:"rgba(16,185,129,0.10)",
  greenMid: "rgba(16,185,129,0.22)",
  amber:    "#F59E0B",
  amberSoft:"rgba(245,158,11,0.08)",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.52)",
  inkFaint: "rgba(26,26,24,0.32)",
  border:   "rgba(26,26,24,0.08)",
  r16:16, r12:12, r8:8, r99:99,
  card:"0 1px 6px rgba(26,26,24,0.07)",
  ff:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
};

// Passwort-Stärke berechnen
function pwStrength(pw) {
  if (!pw) return { score:0, label:"", color:"transparent" };
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score:s, label:"Sehr schwach", color:T.coral };
  if (s === 2) return { score:s, label:"Schwach",      color:"#F97316" };
  if (s === 3) return { score:s, label:"Mittel",       color:T.amber  };
  if (s === 4) return { score:s, label:"Stark",        color:T.green  };
  return { score:s, label:"Sehr stark", color:"#059669" };
}

export default function SicherheitPasswortModal({ profile, onClose }) {
  // Passwort-Ändern
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew,   setShowNew]   = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveOk,    setSaveOk]    = useState(false);
  const [saveErr,   setSaveErr]   = useState("");

  // Reset per E-Mail
  const [resetSent,  setResetSent]  = useState(false);
  const [resetErr,   setResetErr]   = useState("");
  const [resetLoading,setResetLoading]=useState(false);

  const strength = pwStrength(newPw);
  const match    = newPw && confirmPw && newPw === confirmPw;
  const mismatch = confirmPw && newPw !== confirmPw;

  // ── Passwort speichern ──────────────────────────────────────────
  const handleSave = async () => {
    setSaveErr(""); setSaveOk(false);
    if (newPw.length < 8)  { setSaveErr("Mindestens 8 Zeichen erforderlich."); return; }
    if (newPw !== confirmPw){ setSaveErr("Passwörter stimmen nicht überein.");  return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSaving(false);
    if (error) { setSaveErr(error.message); return; }
    setSaveOk(true);
    setNewPw(""); setConfirmPw("");
    setTimeout(() => { setSaveOk(false); onClose?.(); }, 1800);
  };

  // ── Reset per E-Mail ────────────────────────────────────────────
  const handleReset = async () => {
    setResetErr(""); setResetSent(false);
    if (!profile?.email) { setResetErr("Keine E-Mail-Adresse hinterlegt."); return; }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) { setResetErr(error.message); return; }
    setResetSent(true);
  };

  const modal = (
    <div
      onClick={e => { if(e.target===e.currentTarget) onClose?.(); }}
      style={{
        position:"fixed", inset:0, zIndex:10700,
        background:"rgba(26,26,24,0.55)",
        display:"flex", alignItems:"flex-end", justifyContent:"center",
        fontFamily:T.ff,
      }}
    >
      <div style={{
        width:"100%", maxWidth:480,
        background:T.bg, borderRadius:"24px 24px 0 0",
        maxHeight:"92vh", overflow:"hidden",
        display:"flex", flexDirection:"column",
        boxShadow:"0 -4px 32px rgba(26,26,24,0.20)",
      }}>
        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px", flexShrink:0 }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"rgba(26,26,24,0.12)" }} />
        </div>

        {/* Header */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"10px 20px 16px", flexShrink:0,
        }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>
              
            </div>
            <div style={{ fontSize:12, color:T.inkSoft, marginTop:2 }}>
              {profile?.email || "Account-Sicherheit"}
            </div>
          </div>
          <button onClick={onClose} style={{
            background:"rgba(26,26,24,0.07)", border:"none", cursor:"pointer",
            borderRadius:"50%", width:32, height:32,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color:T.inkSoft,
          }}>✕</button>
        </div>

        {/* Scroll */}
        <div style={{ flex:1, overflowY:"auto", padding:"0 20px 12px",
          WebkitOverflowScrolling:"touch", scrollbarWidth:"none" }}>

          {/* ── Passwort ändern ── */}
          <div style={{
            background:T.bgCard, borderRadius:T.r16,
            border:`1px solid ${T.border}`, padding:"18px",
            boxShadow:T.card, marginBottom:14,
          }}>
            <div style={{ fontSize:13, fontWeight:800, color:T.ink, marginBottom:16,
              display:"flex", alignItems:"center", gap:8 }}>
              <span style={{
                width:28, height:28, borderRadius:8,
                background:T.tealSoft, display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:14,
              }}>🔑</span>
              Neues Passwort setzen
            </div>

            {/* Neues Passwort */}
            <FieldLabel label="Neues Passwort" />
            <PwInput
              value={newPw} onChange={setNewPw}
              show={showNew} onToggleShow={() => setShowNew(s=>!s)}
              placeholder="Mindestens 8 Zeichen"
            />

            {/* Stärke-Balken */}
            {newPw.length > 0 && (
              <div style={{ marginTop:6, marginBottom:12 }}>
                <div style={{ display:"flex", gap:3, marginBottom:4 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{
                      flex:1, height:4, borderRadius:99,
                      background: i <= strength.score ? strength.color : T.border,
                      transition:"background .2s",
                    }} />
                  ))}
                </div>
                <div style={{ fontSize:11, fontWeight:600, color:strength.color }}>
                  {strength.label}
                  {strength.score >= 3 && " ✓"}
                </div>
              </div>
            )}

            {/* Passwort bestätigen */}
            <FieldLabel label="Passwort bestätigen" style={{ marginTop: newPw ? 0 : 12 }} />
            <PwInput
              value={confirmPw} onChange={setConfirmPw}
              show={showConf} onToggleShow={() => setShowConf(s=>!s)}
              placeholder="Nochmals eingeben"
              hasError={mismatch}
              hasSuccess={match}
            />
            {mismatch && (
              <div style={{ fontSize:11, color:T.coral, marginTop:4, fontWeight:600 }}>
                ❌ Passwörter stimmen nicht überein
              </div>
            )}
            {match && (
              <div style={{ fontSize:11, color:T.green, marginTop:4, fontWeight:600 }}>
                ✅ Passwörter stimmen überein
              </div>
            )}

            {/* Hinweise */}
            <div style={{
              marginTop:14, padding:"10px 12px", borderRadius:T.r12,
              background:T.amberSoft, border:"1px solid rgba(245,158,11,0.20)",
            }}>
              <div style={{ fontSize:11, color:"#92400E", lineHeight:1.6 }}>
                <div>💡 <strong>Tipps für ein starkes Passwort:</strong></div>
                <div>· Mindestens 12 Zeichen</div>
                <div>· Groß- und Kleinbuchstaben</div>
                <div>· Zahlen und Sonderzeichen (@, #, !, …)</div>
              </div>
            </div>

            {/* Fehler / Erfolg */}
            {saveErr && (
              <div style={{
                marginTop:12, padding:"10px 14px", borderRadius:T.r12,
                background:T.coralSoft, border:`1px solid ${T.coralMid}`,
                fontSize:13, color:T.coral, fontWeight:600,
              }}>❌ {saveErr}</div>
            )}
            {saveOk && (
              <div style={{
                marginTop:12, padding:"10px 14px", borderRadius:T.r12,
                background:T.greenSoft, border:`1px solid ${T.greenMid}`,
                fontSize:13, color:T.green, fontWeight:700,
              }}>✅ Passwort wurde erfolgreich geändert!</div>
            )}

            {/* Speichern */}
            <button
              onClick={handleSave}
              disabled={saving || !newPw || !confirmPw}
              style={{
                marginTop:14, width:"100%", padding:"13px",
                borderRadius:T.r12, border:"none", fontFamily:T.ff,
                cursor: (saving || !newPw || !confirmPw) ? "not-allowed" : "pointer",
                background: (saving || !newPw || !confirmPw)
                  ? "rgba(26,26,24,0.07)"
                  : `linear-gradient(135deg, ${T.teal}, ${T.tealDeep})`,
                color: (saving || !newPw || !confirmPw) ? T.inkSoft : "#fff",
                fontSize:14, fontWeight:800, letterSpacing:"-0.01em",
                boxShadow: (saving || !newPw || !confirmPw) ? "none" : "0 4px 14px rgba(14,196,184,0.28)",
                transition:"all .18s",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              }}
            >
              {saving
                ? <><span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>⏳</span> Wird gespeichert…</>
                : saveOk ? "✅ Gespeichert!" : "💾 Passwort ändern"
              }
            </button>
          </div>

          {/* ── Reset per E-Mail ── */}
          <div style={{
            background:T.bgCard, borderRadius:T.r16,
            border:`1px solid ${T.border}`, padding:"18px",
            boxShadow:T.card, marginBottom:14,
          }}>
            <div style={{ fontSize:13, fontWeight:800, color:T.ink, marginBottom:6,
              display:"flex", alignItems:"center", gap:8 }}>
              <span style={{
                width:28, height:28, borderRadius:8,
                background:"rgba(124,58,237,0.10)", display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:14,
              }}>📧</span>
              Passwort-Reset per E-Mail
            </div>
            <div style={{ fontSize:12, color:T.inkSoft, marginBottom:14, lineHeight:1.55 }}>
              Wir senden dir einen sicheren Reset-Link an <strong>{profile?.email || "deine E-Mail"}</strong>.
              Damit kannst du ein neues Passwort vergeben.
            </div>

            {resetSent && (
              <div style={{
                padding:"10px 14px", borderRadius:T.r12, marginBottom:12,
                background:T.greenSoft, border:`1px solid ${T.greenMid}`,
                fontSize:13, color:T.green, fontWeight:700,
              }}>
                ✅ Reset-Link wurde gesendet! Bitte prüfe dein Postfach.
              </div>
            )}
            {resetErr && (
              <div style={{
                padding:"10px 14px", borderRadius:T.r12, marginBottom:12,
                background:T.coralSoft, border:`1px solid ${T.coralMid}`,
                fontSize:13, color:T.coral, fontWeight:600,
              }}>❌ {resetErr}</div>
            )}

            <button
              onClick={handleReset}
              disabled={resetLoading || resetSent}
              style={{
                width:"100%", padding:"12px",
                borderRadius:T.r12, fontFamily:T.ff,
                border:`1.5px solid rgba(124,58,237,0.30)`,
                cursor: (resetLoading || resetSent) ? "not-allowed" : "pointer",
                background: resetSent ? T.greenSoft : "rgba(124,58,237,0.07)",
                color: resetSent ? T.green : "#7C3AED",
                fontSize:13, fontWeight:700,
                opacity: (resetLoading || resetSent) ? 0.7 : 1,
                transition:"all .18s",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              }}
            >
              {resetLoading
                ? <><span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>⏳</span> Sende…</>
                : resetSent ? "✅ Link gesendet" : "📧 Reset-Link senden"
              }
            </button>
          </div>

          {/* ── Info-Box ── */}
          <div style={{
            background:"rgba(26,26,24,0.04)", borderRadius:T.r12,
            border:`1px solid ${T.border}`, padding:"12px 14px",
            marginBottom:8,
          }}>
            <div style={{ fontSize:11, color:T.inkSoft, lineHeight:1.6 }}>
              🔐 Dein Passwort wird verschlüsselt über <strong>Supabase Auth</strong> gespeichert.
              HUI hat keinen Zugriff auf dein Klartext-Passwort.
            </div>
          </div>

        </div>

        {/* Footer Schließen */}
        <div style={{ padding:"12px 20px 36px", borderTop:`1px solid ${T.border}`, background:T.bg, flexShrink:0 }}>
          <button onClick={onClose} style={{
            width:"100%", padding:"13px", borderRadius:T.r12, border:"none",
            cursor:"pointer", fontFamily:T.ff,
            background:"rgba(26,26,24,0.07)", color:T.inkSoft,
            fontSize:14, fontWeight:700,
            WebkitTapHighlightColor:"transparent",
          }}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ── Passwort-Input ─────────────────────────────────────────────────
function PwInput({ value, onChange, show, onToggleShow, placeholder, hasError, hasSuccess }) {
  const borderColor = hasError ? T.coral : hasSuccess ? T.green : "rgba(26,26,24,0.15)";
  return (
    <div style={{
      display:"flex", alignItems:"center",
      background:T.bgCard, borderRadius:T.r12,
      border:`1.5px solid ${borderColor}`,
      marginBottom:8, overflow:"hidden",
      boxShadow: hasError ? `0 0 0 3px ${T.coralSoft}` : hasSuccess ? `0 0 0 3px ${T.greenSoft}` : "none",
      transition:"border-color .15s, box-shadow .15s",
    }}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex:1, padding:"12px 14px", border:"none", outline:"none",
          fontSize:14, color:T.ink, fontFamily:T.ff, background:"transparent",
          letterSpacing: show ? "normal" : value ? "0.12em" : "normal",
        }}
      />
      <button onClick={onToggleShow} style={{
        padding:"0 14px", border:"none", background:"none",
        cursor:"pointer", fontSize:16, color:T.inkSoft,
        WebkitTapHighlightColor:"transparent",
      }}>
        {show ? <HUIDatenschutzIcon size={18}/> : <HUIAnsichtIcon size={18}/>}
      </button>
    </div>
  );
}

function FieldLabel({ label, style: s }) {
  return (
    <div style={{ fontSize:12, fontWeight:700, color:T.ink, marginBottom:6, ...s }}>
      {label}
    </div>
  );
}
