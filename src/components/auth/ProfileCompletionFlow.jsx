// src/components/auth/ProfileCompletionFlow.jsx — Phase 4A
// Shown after registration when profile is incomplete.
// Steps: username → bio → avatar → interests → done
// Soft modal — NEVER a hard redirect or whitescreen.
import React, { useState, useRef, useCallback } from "react";
import { supabase }           from "../../lib/supabaseClient.js";
import { useAuth }            from "../../lib/AuthContext.jsx";
import { UsernameInput, validateUsername } from "../../lib/useUsernameCheck.jsx";

const TEAL  = "#16D7C5";
const CORAL = "#FF8A6B";
const INK   = "#1A1A2E";

const INTEREST_OPTIONS = [
  "Musik","Kunst","Design","Natur","Heilung","Bewegung",
  "Handwerk","Sprache","Tanz","Wirkung","Kochen","Fotografie",
  "Schreiben","Coaching","Gemeinschaft","Wissenschaft",
];

const CSS_STR = `
@keyframes pcfIn {
  from { opacity:0; transform:translateY(24px) scale(0.97); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
@keyframes pcfStepIn {
  from { opacity:0; transform:translateX(20px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes pcfSpin { to { transform:rotate(360deg); } }
`;
let _css = false;
function injectCSS() {
  if (_css || typeof document === "undefined") return;
  _css = true;
  const s = document.createElement("style"); s.textContent = CSS_STR;
  document.head.appendChild(s);
}

function StepDots({ total, current }) {
  return (
    <div style={{ display:"flex", gap:7, justifyContent:"center", marginBottom:28 }}>
      {Array.from({length:total}, (_,i) => (
        <div key={i} style={{
          height:5, borderRadius:3,
          width: i === current ? 24 : 7,
          background: i <= current ? TEAL : "rgba(26,26,46,0.12)",
          transition:"all 0.28s cubic-bezier(.22,1,.36,1)",
        }}/>
      ))}
    </div>
  );
}

function AvatarUploader({ userId, current, onUploaded }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(current || null);
  const [error,   setError]   = useState(null);
  const inputRef = useRef(null);

  async function compressImage(file, maxPx) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => resolve(blob || file), "image/jpeg", 0.82);
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }

  async function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Nur Bilder erlaubt"); return; }
    if (file.size > 5 * 1024 * 1024)    { setError("Maximal 5 MB"); return; }
    setLoading(true); setError(null);
    setPreview(URL.createObjectURL(file));
    try {
      const uploadFile = file.size > 500_000 ? await compressImage(file, 600) : file;
      const ext  = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `avatars/${userId}/${Date.now()}.${ext}`;
      const { error: e1 } = await supabase.storage.from("media").upload(path, uploadFile, { upsert:true });
      if (e1) throw e1;
      const { data:{ publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url:publicUrl, updated_at:new Date().toISOString() }).eq("id", userId);
      setPreview(publicUrl);
      onUploaded?.(publicUrl);
    } catch {
      setError("Upload fehlgeschlagen — bitte erneut versuchen");
      setPreview(current || null);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:14 }}>
      <button onClick={() => inputRef.current?.click()} disabled={loading}
        style={{
          width:100,height:100,borderRadius:28,
          border: preview ? `3px solid ${TEAL}` : `2.5px dashed rgba(22,215,197,0.4)`,
          background: preview ? "transparent" : "rgba(22,215,197,0.06)",
          cursor:"pointer",overflow:"hidden",position:"relative",touchAction:"manipulation",
        }}>
        {preview
          ? <img src={preview} alt="Avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          : <span style={{fontSize:36}}>📷</span>
        }
        {loading && (
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.45)",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{width:28,height:28,borderRadius:"50%",
              border:"3px solid rgba(255,255,255,0.25)",
              borderTop:`3px solid ${TEAL}`,animation:"pcfSpin 0.8s linear infinite"}}/>
          </div>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*"
        onChange={e => handleFile(e.target.files?.[0])}
        style={{position:"absolute",opacity:0,pointerEvents:"none",width:1,height:1,top:-9999}}/>
      <button onClick={() => inputRef.current?.click()} style={{
        background:"none",border:"none",color:TEAL,fontSize:13.5,fontWeight:600,
        cursor:"pointer",textDecoration:"underline",touchAction:"manipulation",
      }}>
        {preview ? "Anderes Foto wählen" : "Foto hochladen"}
      </button>
      {error && <div style={{fontSize:12,color:"#EF4444",textAlign:"center"}}>{error}</div>}
    </div>
  );
}

export default function ProfileCompletionFlow({ onComplete }) {
  injectCSS();
  const { user, profile, refreshProfile } = useAuth();
  const [step,      setStep]      = useState(0);
  const [username,  setUsername]  = useState(profile?.username || "");
  const [bio,       setBio]       = useState(profile?.bio || "");
  const [avatar,    setAvatar]    = useState(profile?.avatar_url || null);
  const [interests, setInterests] = useState(profile?.interests || []);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState(null);

  const saveField = useCallback(async (data) => {
    setSaving(true); setError(null);
    try {
      const { error: e } = await supabase.from("profiles")
        .update({ ...data, updated_at:new Date().toISOString() }).eq("id", user.id);
      if (e) throw e;
      // Refresh AuthContext immediately — profile data visible everywhere
      try { await refreshProfile(); } catch {}
      setSaving(false); return true;
    } catch {
      setError("Speichern fehlgeschlagen — bitte erneut versuchen");
      setSaving(false); return false;
    }
  }, [user?.id, refreshProfile]);

  async function nextStep() {
    if (saving) return;
    setError(null);

    if (step === 0) {
      const { ok, hint, normalized } = validateUsername(username);
      if (!ok) { setError(hint || "Ungültiger Benutzername"); return; }
      if (!await saveField({ username: normalized })) return;
    }
    if (step === 1) {
      if (bio.trim().length < 10) { setError("Mindestens 10 Zeichen"); return; }
      if (!await saveField({ bio: bio.trim() })) return;
    }
    if (step === 3) {
      // Write profile_complete = true — critical, do this first
      const { error: completeErr } = await supabase.from("profiles").update({
        interests,
        profile_complete: true,
        updated_at: new Date().toISOString(),
      }).eq("id", user.id);
      if (completeErr) {
        console.warn("[PROFILE_FLOW] profile_complete write failed:", completeErr.message);
      } else {
        console.log("[PROFILE_FLOW] profile_complete = true written ✓");
      }
      // Also set via RPC for double-confirmation
      try { await supabase.rpc("mark_profile_complete", { p_user_id: user.id }); } catch {}
      // localStorage guard — prevents re-trigger after reload
      try { localStorage.setItem("hui_profile_completed", "true"); } catch {}
      setStep(4);
      setTimeout(async () => {
        try { await refreshProfile(); } catch {}
        onComplete?.();
      }, 1800);
      return;
    }

    setStep(s => s + 1);
  }

  if (!user) return null;

  if (step === 4) {
    return (
      <div style={{
        position:"fixed",inset:0,zIndex:18000,
        display:"flex",alignItems:"center",justifyContent:"center",
        background:"rgba(249,247,244,0.96)",
        backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
      }}>
        <div style={{textAlign:"center",animation:"pcfIn 0.4s ease both"}}>
          <div style={{fontSize:64,marginBottom:16}}>✦</div>
          <div style={{fontSize:24,fontWeight:800,color:INK,marginBottom:8}}>Willkommen bei HUI</div>
          <div style={{fontSize:15,color:"rgba(26,26,46,0.5)"}}>Dein Profil ist bereit.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:17000,
      display:"flex",alignItems:"center",justifyContent:"center",
      background:"rgba(249,247,244,0.97)",
      backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",
    }}>
      <div style={{
        width:"100%",maxWidth:400,margin:"0 auto",padding:"32px 24px 40px",
        background:"#fff",borderRadius:32,
        boxShadow:"0 8px 48px rgba(26,26,46,0.12)",
        animation:"pcfIn 0.32s cubic-bezier(.22,1,.36,1) both",
      }}>
        <div style={{textAlign:"center",marginBottom:8}}>
          <div style={{fontSize:13,fontWeight:700,color:TEAL,letterSpacing:1.5,
            textTransform:"uppercase",marginBottom:6}}>Profil einrichten</div>
          <div style={{fontSize:22,fontWeight:800,color:INK,letterSpacing:-0.5}}>
            {["Dein Name","Über dich","Dein Gesicht","Deine Welt"][step]}
          </div>
        </div>

        <div style={{marginTop:22,marginBottom:8}}>
          <StepDots total={4} current={step} />
        </div>

        <div key={step} style={{animation:"pcfStepIn 0.25s ease both"}}>
          {step === 0 && (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <p style={{fontSize:14,color:"rgba(26,26,46,0.5)",margin:"0 0 4px",lineHeight:1.6}}>
                Dein @Username ist deine einzigartige Adresse in HUI.
              </p>
              <UsernameInput value={username} onChange={setUsername} />
            </div>
          )}
          {step === 1 && (
            <div>
              <p style={{fontSize:14,color:"rgba(26,26,46,0.5)",margin:"0 0 12px",lineHeight:1.6}}>
                Was bewegst du? Was macht dich aus?
              </p>
              <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={300} rows={4}
                placeholder="Ich bin … ich erschaffe …"
                style={{
                  width:"100%",padding:"14px 16px",
                  border:"1.5px solid rgba(26,26,46,0.12)",borderRadius:16,
                  fontSize:15,color:INK,outline:"none",resize:"none",
                  fontFamily:"inherit",lineHeight:1.6,boxSizing:"border-box",
                }}
                onFocus={e => e.target.style.borderColor=TEAL}
                onBlur={e  => e.target.style.borderColor="rgba(26,26,46,0.12)"}
              />
              <div style={{textAlign:"right",fontSize:11,color:"rgba(26,26,46,0.3)",marginTop:4}}>
                {bio.length}/300
              </div>
            </div>
          )}
          {step === 2 && (
            <div style={{textAlign:"center"}}>
              <p style={{fontSize:14,color:"rgba(26,26,46,0.5)",margin:"0 0 20px",lineHeight:1.6}}>
                Ein echtes Foto schafft Vertrauen.
              </p>
              <AvatarUploader userId={user.id} current={avatar} onUploaded={url => setAvatar(url)}/>
            </div>
          )}
          {step === 3 && (
            <div>
              <p style={{fontSize:14,color:"rgba(26,26,46,0.5)",margin:"0 0 14px",lineHeight:1.6}}>
                Was bewegt dich? Wähle alles was passt.
              </p>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {INTEREST_OPTIONS.map(tag => {
                  const active = interests.includes(tag);
                  return (
                    <button key={tag} onClick={() =>
                      setInterests(prev => active ? prev.filter(t=>t!==tag) : [...prev,tag])
                    } style={{
                      padding:"8px 16px",borderRadius:22,
                      background: active ? `linear-gradient(135deg,${TEAL},${CORAL})` : "rgba(22,215,197,0.08)",
                      border: active ? "none" : "1.5px solid rgba(22,215,197,0.20)",
                      color: active ? "#fff" : TEAL,
                      fontSize:13.5,fontWeight:600,
                      cursor:"pointer",touchAction:"manipulation",
                      transform: active ? "scale(1.04)" : "scale(1)",
                      transition:"all 0.16s ease",
                    }}>{tag}</button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{
            marginTop:14,padding:"10px 14px",borderRadius:12,
            background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.20)",
            fontSize:13,color:"#EF4444",lineHeight:1.5,
          }}>{error}</div>
        )}

        <div style={{marginTop:22,display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={nextStep} disabled={saving} style={{
            width:"100%",padding:"16px",borderRadius:20,border:"none",
            background: saving ? "rgba(22,215,197,0.35)" : "linear-gradient(135deg,#16D7C5,#0FC4B2)",
            color:"#fff",fontSize:16,fontWeight:800,
            cursor:saving?"default":"pointer",touchAction:"manipulation",
            boxShadow: saving ? "none" : "0 4px 20px rgba(22,215,197,0.35)",
          }}>
            {saving ? "Speichern…" : step === 3 ? "Fertig — Los geht's ✦" : "Weiter →"}
          </button>
          {(step === 2 || step === 3) && (
            <button onClick={() => setStep(s=>s+1)} style={{
              background:"none",border:"none",color:"rgba(26,26,46,0.35)",
              fontSize:13,cursor:"pointer",textDecoration:"underline",touchAction:"manipulation",
            }}>Jetzt überspringen</button>
          )}
        </div>
      </div>
    </div>
  );
}
