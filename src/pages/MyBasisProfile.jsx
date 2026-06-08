// src/pages/MyBasisProfile.jsx — HUI Mein Profil v1
// "Ich gestalte meine Präsenz."
// ════════════════════════════════════════════════════════════════
// Eigene Profil-Seite für Basis-User. Kein Creator-Dashboard.
// Alles inline-editierbar. Ruhig. Emotional. Human.
// ════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth }   from "../lib/AuthContext.jsx";
import GemeinschaftsFlow from "../components/GemeinschaftsFlow.jsx";
import AmbassadorSection, { AmbassadorBadge, AmbassadorCTA } from "../components/ambassador/AmbassadorSection.jsx";
import AmbassadorModal from "../components/ambassador/AmbassadorModal.jsx";
import WerkWizard      from "../components/works/WerkWizard.jsx";
import ExperienceWizard from "../components/experiences/ExperienceWizard.jsx";
import SettingsModal  from "../components/settings/SettingsModal.jsx";
import { useAmbassador } from "../hooks/useAmbassador.js";

// ── Design Tokens ────────────────────────────────────────────────
const T = {
  bg:       "#F7F5F0",
  bgCard:   "#FFFFFF",
  bgSheet:  "rgba(252,251,248,0.98)",
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  tealMid:  "rgba(14,196,184,0.22)",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.52)",
  inkFaint: "rgba(26,26,24,0.28)",
  border:   "rgba(26,26,24,0.08)",
  borderMid:"rgba(26,26,24,0.14)",
  px:       20,
  r12:12, r16:16, r20:20, r24:24, r99:99,
  card:     "0 1px 8px rgba(26,26,24,0.07), 0 1px 2px rgba(26,26,24,0.04)",
  glowTeal: "0 4px 18px rgba(14,196,184,0.26)",
  sheet:    "0 -10px 40px rgba(26,26,24,0.10)",
};

// ── CSS ──────────────────────────────────────────────────────────
const CSS = `
  .mbp-root { background:${T.bg}; font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif; color:${T.ink}; }
  .mbp-scroll { overflow-y:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .mbp-scroll::-webkit-scrollbar { display:none; }
  .mbp-hscroll { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .mbp-hscroll::-webkit-scrollbar { display:none; }

  @keyframes mbp-fade-up  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes mbp-slide-up { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes mbp-shimmer  { from{background-position:-200% 0} to{background-position:200% 0} }

  .mbp-skeleton {
    background:linear-gradient(90deg,rgba(26,26,24,.05) 25%,rgba(26,26,24,.09) 50%,rgba(26,26,24,.05) 75%);
    background-size:200% 100%; animation:mbp-shimmer 1.4s ease-in-out infinite; border-radius:8px;
  }
  .mbp-press  { transition:transform .12s cubic-bezier(.22,1,.36,1),opacity .12s ease; }
  .mbp-press:active  { transform:scale(0.93); opacity:0.74; }
  .mbp-press-light { transition:transform .14s ease,opacity .14s ease; }
  .mbp-press-light:active { transform:scale(0.96); opacity:0.82; }
  .mbp-in { animation:mbp-fade-up .45s ease both; }
  .mbp-sheet { animation:mbp-slide-up .28s cubic-bezier(.22,1,.36,1) both; }
  .mbp-file-input { position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%; z-index:10; }
  @keyframes mbp-upload-spin { to{transform:rotate(360deg)} }
  .mbp-uploading { animation:mbp-upload-spin .7s linear infinite; display:inline-block; }
`;

const s = (v, fb="") => (v && typeof v==="string" ? v.trim() : fb);
const a = (v) => Array.isArray(v) ? v : [];

// ── Fallbacks ─────────────────────────────────────────────────
const FB_COVER = null;   // Kein hardcodierter Cover-Fallback
const FB_AVT   = null;   // Kein hardcodierter Avatar-Fallback — null zeigt Initialen/Icon

// MOMENT_SEEDS entfernt — keine Placeholder-Bilder mehr

const ALL_INTERESTS = [
  { icon:"🌿", label:"Natur"       },
  { icon:"🎵", label:"Musik"       },
  { icon:"☕", label:"Begegnungen" },
  { icon:"🧘", label:"Ruhe"        },
  { icon:"🐾", label:"Tiere"       },
  { icon:"✨", label:"Kreativität" },
  { icon:"📖", label:"Lesen"       },
  { icon:"🌍", label:"Reisen"      },
  { icon:"🎨", label:"Kunst"       },
  { icon:"🤝", label:"Gemeinschaft"},
];

const OPEN_FOR_ALL = [
  { icon:"🌲", label:"Naturgruppen"    },
  { icon:"🎵", label:"Musikabende"     },
  { icon:"☕", label:"Café & Gespräche"},
  { icon:"🧘", label:"Achtsamkeit"     },
  { icon:"🎨", label:"Kreativ-Abende"  },
  { icon:"🐾", label:"Tier-Spaziergänge"},
];

const VISIBILITY_OPTIONS = [
  { key:"public",      icon:"🌍", label:"Öffentlich",    sub:"Für alle sichtbar" },
  { key:"connections", icon:"👥", label:"Verbindungen",  sub:"Nur für deine Verbindungen" },
  { key:"private",     icon:"🔒", label:"Privat",        sub:"Nur für dich" },
];

// ── Atoms ────────────────────────────────────────────────────────
function Gap({ h=16 }) { return <div style={{height:h}}/>; }
function Divider() { return <div style={{height:1,background:T.border,margin:`0 ${T.px}px`}}/>; }

function SectionRow({ title, sub, onEdit }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:`0 ${T.px}px 10px` }}>
      <div>
        <div style={{ fontSize:15, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>{title}</div>
        {sub && <div style={{ fontSize:11, color:T.inkFaint, marginTop:2, fontWeight:400 }}>{sub}</div>}
      </div>
      {onEdit && (
        <button className="mbp-press-light" onClick={onEdit} style={{
          background:"none", border:"none", padding:0,
          fontSize:12, color:T.teal, fontWeight:700,
          cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
          display:"flex", alignItems:"center", gap:3,
        }}>Bearbeiten ›</button>
      )}
    </div>
  );
}

function Sheet({ onClose, children, zIndex=10300 }) {
  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex,
      background:"rgba(26,26,24,0.4)",
      display:"flex", alignItems:"flex-end",
    }}>
      <div className="mbp-sheet" onClick={e=>e.stopPropagation()} style={{
        width:"100%", background:T.bgSheet,
        borderRadius:`${T.r24}px ${T.r24}px 0 0`,
        padding:"20px 20px max(80px,calc(70px + env(safe-area-inset-bottom,0px)))",
        boxShadow:T.sheet, maxHeight:"85vh", overflowY:"auto",
      }}>
        <div style={{width:36,height:4,borderRadius:99,background:T.borderMid,margin:"0 auto 20px"}}/>
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// HEADER — "Mein Profil 🌿" + cinematic cover + floating avatar
// ══════════════════════════════════════════════════════════════
// ── Upload Helper ────────────────────────────────────────────────
async function uploadProfileImage(file, userId, folder) {
  const ext  = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
  return publicUrl;
}

function MeinProfilHeader({ profile, onSettings, onAvatarChange, onCoverChange }) {
  const [imgLoaded,       setImgLoaded]       = useState(false);
  const [avLoaded,        setAvLoaded]         = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading,  setCoverUploading]  = useState(false);
  const avatarInputRef = useRef(null);
  const coverInputRef  = useRef(null);

  // ── Avatar + Cover: direkt aus profile (kein Demo-Fallback) ──────────
  // localAvatar/localCover leben im Eltern-State (MyBasisProfile),
  // werden via onAvatarChange/onCoverChange hochgereicht und dann als
  // aktualisiertes profile weitergegeben.
  const cover  = profile?.header_img  || null;
  const avatar = profile?.avatar_url  || null;
  const name   = s(profile?.display_name||profile?.username, "Mein Profil");

  async function handleAvatarFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      // Fallback: userId direkt aus Auth holen wenn profile?.id noch null
      let uid = profile?.id;
      if (!uid) {
        const { data: { user: au } } = await supabase.auth.getUser();
        uid = au?.id;
      }
      if (!uid) { console.warn("Avatar upload: kein userId"); setAvatarUploading(false); return; }
      const url = await uploadProfileImage(file, uid, "avatars");
      await supabase.from("profiles")
        .update({ avatar_url: url, updated_at: new Date().toISOString() })
        .eq("id", uid);
      onAvatarChange?.(url);
    } catch(err) {
      // Vollständige Fehlerausgabe statt silent suppression
      console.error("Avatar upload error:", err?.message, err?.statusCode || err?.status, JSON.stringify(err));
    }
    setAvatarUploading(false);
    e.target.value = "";
  }

  async function handleCoverFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      let uid = profile?.id;
      if (!uid) {
        const { data: { user: au } } = await supabase.auth.getUser();
        uid = au?.id;
      }
      if (!uid) { console.warn("Cover upload: kein userId"); setCoverUploading(false); return; }
      const url = await uploadProfileImage(file, uid, "covers");
      await supabase.from("profiles")
        .update({ header_img: url, updated_at: new Date().toISOString() })
        .eq("id", uid);
      onCoverChange?.(url);
    } catch(err) {
      console.error("Cover upload error:", err?.message, err?.statusCode || err?.status, JSON.stringify(err));
    }
    setCoverUploading(false);
    e.target.value = "";
  }

  return (
    <div style={{ width:"100%", paddingTop:8 }}>
      {/* Title row */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:`0 ${T.px}px 10px` }}>
        <div>
          <div style={{ fontSize:24, fontWeight:800, color:T.ink, letterSpacing:"-0.03em",
            display:"flex", alignItems:"center", gap:8, lineHeight:1.2 }}>
            {profile?.display_name || profile?.username || "Mein Profil"} <span style={{fontSize:18}}>🌿</span>
          </div>
          {profile?.username && (
            <div style={{ fontSize:13, color:T.teal, fontWeight:600, marginTop:2, letterSpacing:"0.01em" }}>
              @{profile.username}
            </div>
          )}
          <div style={{ fontSize:12.5, color:T.inkFaint, marginTop:2, fontWeight:400 }}>
            Gestalte dein Profil so, wie du bist.
          </div>
        </div>
        <button className="mbp-press-light" onClick={onSettings} style={{
          width:36, height:36, borderRadius:"50%",
          background:"rgba(26,26,24,0.06)", border:`1px solid ${T.border}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:17, cursor:"pointer", touchAction:"manipulation",
        }}>⚙️</button>
      </div>

      {/* Cinematic cover — Kamera-Icon triggert Upload */}
      {/* Verstecktes Input für Cover-Bild */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        style={{ display:"none" }}
        onChange={handleCoverFile}
      />
      {/* Cover-Wrapper: position:relative, KEIN overflow:hidden damit Avatar sichtbar bleibt */}
      <div style={{ margin:`0 ${T.px}px`, borderRadius:T.r20,
        height:170, position:"relative", background:"linear-gradient(160deg,#2C3E2D,#7B8E5E)" }}>
        {/* Das Bild selbst hat overflow:hidden via borderRadius auf dem Container-Img-Wrapper */}
        <div style={{ position:"absolute", inset:0, borderRadius:T.r20, overflow:"hidden" }}>
          <img src={cover} alt="" onLoad={()=>setImgLoaded(true)} onError={()=>setImgLoaded(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover",
              opacity:imgLoaded?0.7:0, transition:"opacity 1.1s ease" }}/>
          <div style={{ position:"absolute", inset:0,
            background:"linear-gradient(180deg,rgba(247,245,240,0) 30%,rgba(247,245,240,0.55) 100%)" }}/>
          {/* Kamera-Icon oben rechts — öffnet Cover-Upload */}
          <button
            onClick={() => coverInputRef.current?.click()}
            style={{
              position:"absolute", top:10, right:10, zIndex:15,
              width:32, height:32, borderRadius:"50%",
              background:"rgba(0,0,0,0.42)", backdropFilter:"blur(6px)",
              border:"none", display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:15, cursor:"pointer", touchAction:"manipulation",
            }}
          >
            {coverUploading ? <span className="mbp-uploading" style={{fontSize:13}}>⏳</span> : "📷"}
          </button>
        </div>

        {/* Floating avatar — außerhalb des overflow:hidden, deshalb sichtbar */}
        <div style={{ position:"absolute", bottom:-44, left:"50%", transform:"translateX(-50%)",
          display:"flex", flexDirection:"column", alignItems:"center", zIndex:10 }}>
          <div style={{ position:"relative" }}>
            {/* Teal ring */}
            <div style={{ position:"absolute", inset:-3, borderRadius:"50%",
              background:`conic-gradient(from 0deg,${T.teal},rgba(14,196,184,0.3),${T.teal})`,
              opacity:0.85 }}/>
            <div style={{ position:"relative", width:82, height:82, borderRadius:"50%",
              border:"3.5px solid white",
              boxShadow:"0 4px 20px rgba(0,0,0,0.16)",
              overflow:"hidden", background:T.bg }}>
              {/* Avatar: Bild wenn vorhanden, sonst Initialen */}
              {avatar ? (
                <>
                  {!avLoaded && <div className="mbp-skeleton" style={{position:"absolute",inset:0,borderRadius:"50%"}}/>}
                  <img src={avatar} alt={name} onLoad={()=>setAvLoaded(true)} onError={()=>setAvLoaded(true)}
                    style={{ width:"100%", height:"100%", objectFit:"cover",
                      opacity:avLoaded?1:0, transition:"opacity .5s ease" }}/>
                </>
              ) : (
                <div style={{
                  position:"absolute", inset:0, borderRadius:"50%",
                  background:`linear-gradient(135deg, ${T.teal}, ${T.tealMid})`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:28, fontWeight:700, color:"white",
                }}>
                  {(name||"?").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {/* Camera button */}
            <label style={{
              position:"absolute", bottom:0, right:0,
              width:26, height:26, borderRadius:"50%",
              background: avatarUploading ? "rgba(26,26,24,0.5)" : T.teal,
              border:"2px solid white",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:12, cursor:"pointer", touchAction:"manipulation",
              boxShadow:"0 2px 8px rgba(14,196,184,0.3)",
              zIndex:20,
            }}>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display:"none" }}
                onChange={handleAvatarFile}
              />
              {avatarUploading
                ? <span className="mbp-uploading" style={{fontSize:11}}>⏳</span>
                : "📷"
              }
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ÜBER DICH — Inline text editor with char counter
// ══════════════════════════════════════════════════════════════
function UeberDich({ bio, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(bio || "");
  const MAX = 220;

  const handleSave = () => {
    onChange(draft.trim());
    setEditing(false);
  };

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <SectionRow title="Über dich" onEdit={()=>{ setDraft(bio||""); setEditing(true); }}/>
      <div style={{
        background:T.bgCard, borderRadius:T.r16,
        border:`1px solid ${editing ? T.tealMid : T.border}`,
        padding:"14px 16px", position:"relative",
        boxShadow: editing ? `0 0 0 3px ${T.tealSoft}` : T.card,
        transition:"all .2s ease",
      }}>
        {editing ? (
          <>
            <textarea
              autoFocus
              value={draft}
              onChange={e=>setDraft(e.target.value.slice(0,MAX))}
              style={{
                width:"100%", minHeight:80, border:"none", outline:"none",
                background:"transparent", fontSize:14, color:T.ink,
                lineHeight:1.68, resize:"none", fontFamily:"inherit",
                fontStyle:"italic",
              }}
              placeholder="Wie bist du so?"
            />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6 }}>
              <span style={{ fontSize:11, color:T.inkFaint }}>{draft.length} / {MAX}</span>
              <div style={{ display:"flex", gap:8 }}>
                <button className="mbp-press" onClick={()=>setEditing(false)} style={{
                  padding:"6px 14px", borderRadius:T.r99, border:`1px solid ${T.border}`,
                  background:"transparent", fontSize:12, fontWeight:600, color:T.inkSoft,
                  cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
                }}>Abbrechen</button>
                <button className="mbp-press" onClick={handleSave} style={{
                  padding:"6px 16px", borderRadius:T.r99, border:"none",
                  background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,
                  fontSize:12, fontWeight:700, color:"white",
                  cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
                  boxShadow:T.glowTeal,
                }}>Speichern</button>
              </div>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize:14, lineHeight:1.68, color:T.inkSoft, margin:0,
              fontFamily:"-apple-system,'Georgia',serif", fontStyle:"italic" }}>
              {bio || "Liebe die Natur, Musik und gute Gespräche.\nSuche echte Begegnungen und Orte,\nan denen man gemeinsam wachsen kann."}
            </p>
            {bio && (
              <div style={{ textAlign:"right", marginTop:6,
                fontSize:11, color:T.inkFaint }}>{(bio||"").length} / {MAX}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// INTERESSEN & WERTE — Tappable pills + edit sheet
// ══════════════════════════════════════════════════════════════
function InterestPill({ icon, label, active, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      display:"inline-flex", alignItems:"center", gap:6,
      padding:"9px 16px", borderRadius:T.r99,
      background: active ? T.tealSoft : T.bgCard,
      border:`1px solid ${active ? T.tealMid : T.border}`,
      fontSize:13.5, fontWeight:600,
      color: active ? T.teal : T.ink,
      cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
      transition:"all .18s cubic-bezier(.22,1,.36,1)",
      boxShadow: active ? T.glowTeal : T.card,
    }}>
      <span style={{fontSize:15}}>{icon}</span>{label}
    </button>
  );
}

function InteressenSection({ interests, onChange }) {
  const [showEdit, setShowEdit] = useState(false);
  const current = a(interests);

  const toggle = (label) => {
    if (current.includes(label)) onChange(current.filter(x=>x!==label));
    else onChange([...current, label]);
  };

  const displayTags = current.length
    ? ALL_INTERESTS.filter(t=>current.includes(t.label))
    : ALL_INTERESTS.slice(0,6);

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <SectionRow title="Interessen & Werte" onEdit={()=>setShowEdit(true)}/>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {displayTags.map((t,i)=>(
          <div key={i} className="mbp-in" style={{ display:"inline-flex", alignItems:"center", gap:6,
            padding:"9px 16px", borderRadius:T.r99,
            background:T.bgCard, border:`1px solid ${T.border}`,
            fontSize:13.5, fontWeight:600, color:T.ink,
            boxShadow:T.card }}>
            <span style={{fontSize:15}}>{t.icon}</span>{t.label}
          </div>
        ))}
      </div>

      {showEdit && (
        <Sheet onClose={()=>setShowEdit(false)}>
          <div style={{ fontSize:16, fontWeight:800, color:T.ink, marginBottom:4 }}>Interessen & Werte</div>
          <div style={{ fontSize:12, color:T.inkFaint, marginBottom:16 }}>Wähle, was dich bewegt.</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
            {ALL_INTERESTS.map((t,i)=>(
              <InterestPill key={i} icon={t.icon} label={t.label}
                active={current.includes(t.label)}
                onToggle={()=>toggle(t.label)}/>
            ))}
          </div>
          <button className="mbp-press" onClick={()=>setShowEdit(false)} style={{
            width:"100%", padding:"14px", borderRadius:T.r99, border:"none",
            background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,
            color:"white", fontSize:15, fontWeight:700,
            cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
            boxShadow:T.glowTeal,
          }}>Fertig</button>
        </Sheet>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MOMENTE — Editable cinematic thumbnails
// ══════════════════════════════════════════════════════════════
function MomenteSection({ moments, onChange }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Nur echte User-Momente anzeigen — KEINE Seeds mehr wenn DB leer
  const items = a(moments);

  const removeItem = (id) => {
    onChange(items.filter(m => m.id !== id));
  };

  const handleAddFile = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { console.warn("Moment upload: kein User"); setUploading(false); return; }

      const newItems = [...items];
      for (const file of files) {
        console.log("MOMENT_UPLOAD START", file.name, user.id);
        const url = await uploadProfileImage(file, user.id, "moments");
        console.log("MOMENT_UPLOAD URL", url);
        newItems.push({ id: `m_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, img: url });
      }
      console.log("MOMENT_UPLOAD onChange", newItems);
      onChange(newItems);
    } catch (err) {
      console.error("Moment upload error:", err?.message, JSON.stringify(err));
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <SectionRow title="✨ Meine Erlebnisse" sub="Zeige, was dich bewegt und ausmacht."/>

      {items.length > 0 && (
        <div className="mbp-hscroll" style={{
          display:"flex", gap:8, paddingBottom:4,
        }}>
          {items.map((m, i) => (
            <MomentThumb key={m.id || i} m={m} onRemove={() => removeItem(m.id)}/>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div style={{
          borderRadius:T.r16, border:`1.5px dashed ${T.border}`,
          padding:"28px 16px", textAlign:"center",
          background:"rgba(26,26,24,0.025)",
        }}>
          <div style={{fontSize:28, marginBottom:6}}>📸</div>
          <div style={{fontSize:13, color:T.inkFaint, lineHeight:1.5}}>
            Noch keine Erlebnisse.<br/>Füge deinen ersten Einblick hinzu.
          </div>
        </div>
      )}

      <Gap h={10}/>

      {/* verstecktes multi-file Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display:"none" }}
        onChange={handleAddFile}
      />

      {/* + Moment hinzufügen Button */}
      <button
        className="mbp-press-light"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        style={{
          display:"inline-flex", alignItems:"center", gap:8,
          padding:"9px 18px", borderRadius:T.r99,
          background:T.bgCard, border:`1px solid ${T.border}`,
          fontSize:13, fontWeight:600,
          color: uploading ? T.inkFaint : T.inkSoft,
          cursor: uploading ? "default" : "pointer",
          touchAction:"manipulation", fontFamily:"inherit",
          boxShadow:T.card, opacity: uploading ? 0.7 : 1,
          transition:"opacity .2s",
        }}
      >
        {uploading
          ? <><span className="mbp-uploading" style={{fontSize:14}}>⏳</span> Wird hochgeladen…</>
          : <><span style={{fontSize:16}}>+</span> Erlebnis hinzufügen</>
        }
      </button>
    </div>
  );
}

function MomentThumb({ m, onRemove }) {
  const [loaded,  setLoaded]  = useState(false);
  const [broken,  setBroken]  = useState(false);
  return (
    <div style={{ position:"relative", width:116, height:116, borderRadius:T.r12,
      overflow:"hidden", background:"rgba(26,26,24,0.07)", flexShrink:0 }}>
      {!loaded && !broken && <div className="mbp-skeleton" style={{position:"absolute",inset:0}}/>}
      {broken ? (
        /* Broken-State: graue Box, isoliert — andere Momente unberührt */
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          background:"rgba(26,26,24,0.06)", gap:4 }}>
          <span style={{fontSize:22}}>🖼️</span>
          <span style={{fontSize:9, color:"rgba(26,26,24,0.35)", textAlign:"center",
            padding:"0 6px", lineHeight:1.4}}>Bild nicht verfügbar</span>
        </div>
      ) : (
        <img src={m.img} alt="" onLoad={()=>setLoaded(true)} onError={()=>{ setLoaded(true); setBroken(true); }}
          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block",
            opacity:loaded?1:0, transition:"opacity .5s ease" }}/>
      )}
      {/* × remove */}
      <button className="mbp-press" onClick={onRemove} style={{
        position:"absolute", top:5, right:5,
        width:20, height:20, borderRadius:"50%",
        background:"rgba(26,26,24,0.65)", backdropFilter:"blur(6px)",
        border:"none", color:"white", fontSize:11,
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", touchAction:"manipulation", lineHeight:1,
      }}>×</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// OFFEN FÜR BEGEGNUNGEN — Editable open-for capsules
// ══════════════════════════════════════════════════════════════
function OffenFuerSection({ openFor, onChange }) {
  const [showEdit, setShowEdit] = useState(false);
  const current = a(openFor);
  // Im Read-Mode: aktive Kacheln anzeigen, sonst Demo-Auswahl
  const display = current.length ? OPEN_FOR_ALL.filter(t=>current.includes(t.label)) : OPEN_FOR_ALL.slice(0,4);

  const toggle = (label) => {
    if (current.includes(label)) onChange(current.filter(x=>x!==label));
    else onChange([...current, label]);
  };

  const remove = (label) => onChange(current.filter(x => x !== label));

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      {/* Header mit Bearbeiten-Button — identisch zu InteressenSection */}
      <SectionRow
        title="Offen für Begegnungen"
        sub="Wofür bist du offen? Was interessiert dich?"
        onEdit={() => setShowEdit(true)}
      />

      {/* Read-Mode: Kacheln mit X-Icon */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {display.map((t,i) => (
          <div key={i} style={{
            position:"relative",
            display:"inline-flex", alignItems:"center", gap:6,
            padding:"9px 16px", borderRadius:T.r99,
            background:T.bgCard, border:`1px solid ${T.border}`,
            fontSize:13, fontWeight:600, color:T.ink,
            boxShadow:T.card,
          }}>
            <span style={{fontSize:14}}>{t.icon}</span>{t.label}
            {/* X-Button: nur wenn Kachel wirklich aktiv (nicht Demo) */}
            {current.includes(t.label) && (
              <button
                onClick={() => remove(t.label)}
                style={{
                  marginLeft:2, width:16, height:16,
                  borderRadius:"50%", border:"none",
                  background:"rgba(26,26,24,0.12)",
                  color:T.inkSoft, fontSize:10, fontWeight:800,
                  cursor:"pointer", display:"flex", alignItems:"center",
                  justifyContent:"center", lineHeight:1, padding:0,
                  touchAction:"manipulation", fontFamily:"inherit",
                }}
                aria-label={`${t.label} entfernen`}
              >✕</button>
            )}
          </div>
        ))}
        {/* + Hinzufügen Chip */}
        <button className="mbp-press-light" onClick={() => setShowEdit(true)} style={{
          display:"inline-flex", alignItems:"center", gap:6,
          padding:"9px 16px", borderRadius:T.r99,
          background:"transparent", border:`1px dashed ${T.borderMid}`,
          fontSize:13, fontWeight:600, color:T.inkSoft,
          cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
        }}>
          <span style={{fontSize:14}}>+</span> Weiteres hinzufügen
        </button>
      </div>

      {/* Edit-Sheet — identisch zu InteressenSection */}
      {showEdit && (
        <Sheet onClose={() => setShowEdit(false)}>
          <div style={{ fontSize:16, fontWeight:800, color:T.ink, marginBottom:4 }}>Offen für Begegnungen</div>
          <div style={{ fontSize:12, color:T.inkFaint, marginBottom:16 }}>Was interessiert dich gerade? Wähle oder entferne Kategorien.</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
            {OPEN_FOR_ALL.map((t,i) => (
              <InterestPill
                key={i} icon={t.icon} label={t.label}
                active={current.includes(t.label)}
                onToggle={() => toggle(t.label)}
              />
            ))}
          </div>
          <button className="mbp-press" onClick={() => setShowEdit(false)} style={{
            width:"100%", padding:"14px", borderRadius:T.r99, border:"none",
            background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,
            color:"white", fontSize:15, fontWeight:700,
            cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
            boxShadow:T.glowTeal,
          }}>Fertig</button>
        </Sheet>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SICHTBARKEIT — 3-option toggle
// ══════════════════════════════════════════════════════════════
function SichtbarkeitSection({ visibility, onChange }) {
  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <SectionRow title="Sichtbarkeit" sub="Wähle, wer dein Profil sehen kann."/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
        {VISIBILITY_OPTIONS.map(opt=>{
          const active = (visibility||"connections") === opt.key;
          return (
            <button key={opt.key} className="mbp-press-light" onClick={()=>onChange(opt.key)} style={{
              padding:"14px 8px",
              borderRadius:T.r16,
              background: active ? T.tealSoft : T.bgCard,
              border:`1.5px solid ${active ? T.teal : T.border}`,
              boxShadow: active ? T.glowTeal : T.card,
              cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
              display:"flex", flexDirection:"column", alignItems:"center", gap:5,
              transition:"all .2s cubic-bezier(.22,1,.36,1)",
            }}>
              <span style={{fontSize:20}}>{opt.icon}</span>
              <span style={{ fontSize:12.5, fontWeight:700,
                color: active ? T.teal : T.ink }}>{opt.label}</span>
              <span style={{ fontSize:10.5, color:T.inkFaint, lineHeight:1.4,
                textAlign:"center", fontWeight:400 }}>{opt.sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════
// WARUM ICH AUF HUI BIN — Persönlicher Motivations-Bereich
// ════════════════════════════════════════════════════════════════
const WERT_TAGS = [
  { icon:"🌱", label:"Natur"        },
  { icon:"🤝", label:"Gemeinschaft" },
  { icon:"🎨", label:"Kreativität"  },
  { icon:"💚", label:"Vertrauen"    },
  { icon:"✨", label:"Inspiration"  },
  { icon:"🌍", label:"Wirkung"      },
  { icon:"🎵", label:"Musik"        },
  { icon:"📖", label:"Bildung"      },
  { icon:"🧘", label:"Achtsamkeit"  },
  { icon:"💡", label:"Innovation"   },
];

function WarumHUI({ profile, onEdit }) {
  const warum = profile?.profile_modules?.warum_hui || "";
  const tags  = Array.isArray(profile?.profile_modules?.wert_tags)
    ? profile.profile_modules.wert_tags : [];
  return (
    <div style={{ padding:"0 20px" }}>
      <SectionRow title="Über mich" onEdit={onEdit} />
      <div style={{
        background:T.bgCard, borderRadius:T.r16,
        border:`1px solid ${T.border}`, padding:"16px",
        boxShadow:T.card, marginBottom:12,
      }}>
        {warum ? (
          <p style={{ margin:0, fontSize:14, lineHeight:1.7, color:T.ink }}>
            {warum}
          </p>
        ) : (
          <div style={{ fontSize:13, color:T.inkFaint, lineHeight:1.6, fontStyle:"italic" }}
            onClick={onEdit}>
            Schreib hier, warum du Teil von HUI bist, was dich antreibt und welche Werte dir wichtig sind…
          </div>
        )}
        {tags.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:12 }}>
            {tags.map((t, i) => (
              <span key={i} style={{
                display:"inline-flex", alignItems:"center", gap:4,
                padding:"4px 10px", borderRadius:99,
                background:T.tealSoft, border:`1px solid ${T.tealMid}`,
                fontSize:12, fontWeight:600, color:T.teal,
              }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MEINE TALENTE & FÄHIGKEITEN — Chip-basiert, sofort erkennbar
// ════════════════════════════════════════════════════════════════
const TALENT_CHIPS = [
  "Fotografie","Musik","Handwerk","Coaching","Kunst","Programmierung",
  "Bildung","Schreiben","Design","Tanz","Theater","Yoga","Kochen",
  "Gartenbau","Architektur","Film","Illustration","Keramik","Textil",
];

function MeineTalenteSection({ profile, onEdit }) {
  const talents = Array.isArray(profile?.profile_modules?.talente)
    ? profile.profile_modules.talente
    : (Array.isArray(profile?.skills) ? profile.skills : []);
  return (
    <div style={{ padding:"0 20px" }}>
      <SectionRow title="Meine Talente & Fähigkeiten" onEdit={onEdit} />
      {talents.length > 0 ? (
        <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:4 }}>
          {talents.map((t, i) => (
            <span key={i} style={{
              display:"inline-flex", alignItems:"center", gap:5,
              padding:"6px 13px", borderRadius:99,
              background:T.bgCard, border:`1.5px solid ${T.border}`,
              fontSize:13, fontWeight:600, color:T.ink,
              boxShadow:T.card,
            }}>
              {t}
            </span>
          ))}
        </div>
      ) : (
        <div style={{
          background:T.tealSoft, borderRadius:T.r12,
          border:`1px dashed ${T.tealMid}`, padding:"14px 16px",
          textAlign:"center", cursor:"pointer",
        }} onClick={onEdit}>
          <div style={{ fontSize:13, color:T.teal, fontWeight:600 }}>
            + Talente hinzufügen
          </div>
          <div style={{ fontSize:11, color:T.inkFaint, marginTop:4 }}>
            Fotografie · Musik · Coaching · Kunst · …
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// WEITEREMPFEHLUNGEN — Kein Sterne-System
// ════════════════════════════════════════════════════════════════
function WeiterempfehlungenSection({ userId }) {
  const [recs, setRecs]       = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase.from("recommendations")
      .select("id,text,from_name,from_avatar,created_at")
      .eq("to_user_id", userId)
      .order("created_at", { ascending:false })
      .limit(3)
      .then(({ data }) => { setRecs(data || []); setLoading(false); });
  }, [userId]);

  return (
    <div style={{ padding:"0 20px" }}>
      <SectionRow title="Weiterempfehlungen" />
      {/* Keine Sterne — Grundsatz */}
      <div style={{
        display:"inline-flex", alignItems:"center", gap:6,
        padding:"5px 12px", borderRadius:99, marginBottom:12,
        background:T.tealSoft, border:`1px solid ${T.tealMid}`,
        fontSize:11, fontWeight:700, color:T.teal,
      }}>
        💚 Keine Sterne. Keine Likes. Nur echte Erfahrungen.
      </div>

      {loading ? (
        <div style={{ height:60, borderRadius:T.r12 }} className="mbp-skeleton"/>
      ) : recs.length === 0 ? (
        <div style={{
          background:T.bgCard, borderRadius:T.r16, padding:"18px 16px",
          border:`1px solid ${T.border}`, textAlign:"center",
          boxShadow:T.card,
        }}>
          <div style={{ fontSize:13, color:T.inkFaint, lineHeight:1.6 }}>
            Empfehlungen entstehen durch echte Erlebnisse, Buchungen und Zusammenarbeit.
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {recs.map(r => (
            <div key={r.id} style={{
              background:T.bgCard, borderRadius:T.r16, padding:"14px 16px",
              border:`1px solid ${T.border}`, boxShadow:T.card,
            }}>
              <p style={{ margin:"0 0 10px", fontSize:13.5, color:T.ink, lineHeight:1.65,
                fontStyle:"italic" }}>
                „{r.text}"
              </p>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {r.from_avatar ? (
                  <img src={r.from_avatar} style={{ width:26, height:26, borderRadius:"50%",
                    objectFit:"cover" }} alt=""/>
                ) : (
                  <div style={{ width:26, height:26, borderRadius:"50%",
                    background:T.tealSoft, display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:12 }}>👤</div>
                )}
                <span style={{ fontSize:12, fontWeight:600, color:T.inkSoft }}>
                  {r.from_name || "Anonym"}
                </span>
              </div>
            </div>
          ))}
          <button style={{
            background:"none", border:`1px solid ${T.border}`,
            borderRadius:99, padding:"9px 0", width:"100%",
            fontSize:12, fontWeight:700, color:T.teal, cursor:"pointer",
          }}>
            Alle Empfehlungen anzeigen →
          </button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MEIN WIRKEN — Wirkungskennzahlen (kein Ranking)
// ════════════════════════════════════════════════════════════════
function MeinWirkenSection({ profile, works, exps }) {
  const [impact, setImpact] = React.useState({ votes:0, connections:0 });
  React.useEffect(() => {
    if (!profile?.id) return;
    Promise.allSettled([
      supabase.from("impact_votes").select("id", { count:"exact" }).eq("user_id", profile.id),
      supabase.from("follows").select("id", { count:"exact" }).eq("following_id", profile.id),
    ]).then(([vR, fR]) => {
      setImpact({
        votes:       vR.status === "fulfilled" ? (vR.value.count || 0) : 0,
        connections: fR.status === "fulfilled" ? (fR.value.count || 0) : 0,
      });
    });
  }, [profile?.id]);

  const published = (works || []).filter(w => w.status === "published").length;
  const expCount  = (exps  || []).filter(e => e.status !== "archived").length;
  const recs      = profile?.recommendations || 0;

  const stats = [
    { icon:"💚", val:recs,               label:"Weiterempfehlungen" },
    { icon:"🎨", val:published,           label:"Werke veröffentlicht" },
    { icon:"🎟",  val:expCount,            label:"Erlebnisse angeboten" },
    { icon:"🤝", val:impact.connections,  label:"Verbindungen" },
    { icon:"🌍", val:impact.votes,        label:"Impact-Projekte unterstützt" },
  ];

  return (
    <div style={{
      background:T.bgCard, borderRadius:T.r16,
      border:`1px solid ${T.border}`, padding:"16px 18px",
      boxShadow:T.card,
    }}>
      <div style={{ fontSize:13, fontWeight:800, color:T.ink, marginBottom:12 }}>
        Mein Wirken
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:16, width:22, textAlign:"center", flexShrink:0 }}>{s.icon}</span>
            <div style={{ flex:1, fontSize:13, fontWeight:700, color:T.ink }}>{s.val}</div>
            <div style={{ fontSize:11, color:T.inkFaint }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// HUI-VERTRAUENSSTATUS — Vertrauensentwicklung (kein Level-System)
// ════════════════════════════════════════════════════════════════
function VertrauensstatusCard({ profile }) {
  const recs = profile?.recommendations || 0;
  const createdAt = profile?.created_at;
  const monthsActive = createdAt
    ? Math.max(0, Math.floor((Date.now() - new Date(createdAt)) / (30*24*3600*1000)))
    : 0;

  let status = { icon:"🌱", label:"Neues Mitglied",      color:"#16A34A", bg:"#DCFCE7",
                 sub:"Willkommen in der HUI-Gemeinschaft" };
  if (recs >= 10 || monthsActive >= 12) {
    status = { icon:"💎", label:"Vertrauenspartner",    color:"#7264D6", bg:"#EDE9FE",
               sub:"Langjährige Vertrauensbeziehung" };
  } else if (recs >= 5 || monthsActive >= 6) {
    status = { icon:"🌳", label:"Bewährtes Mitglied",   color:"#0DC4B5", bg:"#CCFBF1",
               sub:"Aktiv und bewährt in der Community" };
  } else if (recs >= 1 || monthsActive >= 2) {
    status = { icon:"🍃", label:"Empfohlenes Mitglied", color:"#D97706", bg:"#FEF3C7",
               sub:"Von der Community empfohlen" };
  }

  return (
    <div style={{
      background:T.bgCard, borderRadius:T.r16,
      border:`1px solid ${T.border}`, padding:"16px 18px",
      boxShadow:T.card,
    }}>
      <div style={{ fontSize:13, fontWeight:800, color:T.ink, marginBottom:12 }}>
        HUI-Vertrauensstatus
      </div>
      <div style={{
        display:"flex", alignItems:"center", gap:10, marginBottom:12,
        padding:"10px 12px", borderRadius:T.r12,
        background:status.bg, border:`1px solid ${status.color}22`,
      }}>
        <span style={{ fontSize:22 }}>{status.icon}</span>
        <div>
          <div style={{ fontSize:13, fontWeight:800, color:status.color }}>{status.label}</div>
          <div style={{ fontSize:10, color:T.inkFaint, marginTop:1 }}>{status.sub}</div>
        </div>
      </div>
      <div style={{ fontSize:10, color:T.inkFaint, lineHeight:1.5 }}>
        Keine Punkte. Kein Ranking. Nur Vertrauensentwicklung.
      </div>
      <button style={{
        width:"100%", marginTop:12,
        background:"none", border:`1.5px solid ${T.teal}`,
        borderRadius:T.r99, padding:"9px 0",
        fontSize:12, fontWeight:700, color:T.teal, cursor:"pointer",
      }}>
        ✉ Vertrauen schenken
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MEIN WEG AUF HUI — Automatische Aktivitäten-Timeline
// ════════════════════════════════════════════════════════════════
function MeinWegTimeline({ userId }) {
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase.from("activities")
      .select("id,type,description,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending:false })
      .limit(5)
      .then(({ data }) => { setEvents(data || []); setLoading(false); });
  }, [userId]);

  const TYPE_MAP = {
    profile_created:   { icon:"🌱", label:"Profil erstellt"        },
    work_published:    { icon:"🎨", label:"Werk veröffentlicht"     },
    experience_created:{ icon:"🎟", label:"Erlebnis erstellt"       },
    recommendation:    { icon:"💚", label:"Empfehlung erhalten"     },
    impact_vote:       { icon:"🌍", label:"Projekt unterstützt"     },
    connection:        { icon:"🤝", label:"Verbindung aufgebaut"    },
  };

  const fmtDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("de-DE", { month:"long", year:"numeric" });
  };

  return (
    <div style={{
      background:T.bgCard, borderRadius:T.r16,
      border:`1px solid ${T.border}`, padding:"16px 18px",
      boxShadow:T.card,
    }}>
      <div style={{ fontSize:13, fontWeight:800, color:T.ink, marginBottom:12 }}>
        Mein Weg auf HUI
      </div>
      {loading ? (
        <div style={{ height:40 }} className="mbp-skeleton"/>
      ) : events.length === 0 ? (
        <div style={{ fontSize:12, color:T.inkFaint, lineHeight:1.5 }}>
          Deine HUI-Geschichte beginnt hier. 🌱
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {events.map((ev, i) => {
            const cfg = TYPE_MAP[ev.type] || { icon:"✨", label:ev.description || ev.type };
            return (
              <div key={ev.id} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                {/* Linie */}
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  width:22, flexShrink:0 }}>
                  <div style={{
                    width:22, height:22, borderRadius:"50%",
                    background:T.tealSoft, border:`1.5px solid ${T.tealMid}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:11, flexShrink:0,
                  }}>{cfg.icon}</div>
                  {i < events.length - 1 && (
                    <div style={{ width:1.5, height:20, background:T.border, margin:"2px 0" }}/>
                  )}
                </div>
                {/* Text */}
                <div style={{ paddingTop:2, paddingBottom:i < events.length-1 ? 0 : 0 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.ink, lineHeight:1.3 }}>
                    {cfg.label}
                  </div>
                  {ev.description && ev.description !== cfg.label && (
                    <div style={{ fontSize:10, color:T.inkFaint, fontStyle:"italic",
                      lineHeight:1.3, marginTop:1 }}>
                      „{ev.description.slice(0, 40)}"
                    </div>
                  )}
                  <div style={{ fontSize:9, color:T.inkFaint, marginTop:1 }}>
                    {fmtDate(ev.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
          <button style={{
            background:"none", border:"none", padding:"8px 0 0",
            fontSize:11, color:T.teal, fontWeight:700, cursor:"pointer",
            textAlign:"left",
          }}>
            Alle Aktivitäten ansehen
          </button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// STANDORT + VERFÜGBARKEIT — kompakt, Sidebar
// ════════════════════════════════════════════════════════════════
function StandortVerfuegbarkeit({ profile }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {/* Standort */}
      {profile?.location && (
        <div style={{
          background:T.bgCard, borderRadius:T.r12,
          border:`1px solid ${T.border}`, padding:"12px 14px",
          boxShadow:T.card,
        }}>
          <div style={{ fontSize:12, fontWeight:800, color:T.ink, marginBottom:6 }}>Standort</div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:13 }}>📍</span>
            <span style={{ fontSize:12.5, color:T.inkSoft }}>{profile.location}</span>
          </div>
        </div>
      )}
      {/* Verfügbarkeit */}
      <div style={{
        background:T.bgCard, borderRadius:T.r12,
        border:`1px solid ${T.border}`, padding:"12px 14px",
        boxShadow:T.card,
      }}>
        <div style={{ fontSize:12, fontWeight:800, color:T.ink, marginBottom:8 }}>
          Bereich & Verfügbarkeit
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#16A34A",
              display:"inline-block", flexShrink:0 }}/>
            <span style={{ fontSize:11.5, color:T.inkSoft }}>Online & Vor Ort</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:11 }}>💬</span>
            <span style={{ fontSize:11.5, color:T.inkSoft }}>Offen für neue Anfragen</span>
          </div>
          <div style={{ fontSize:10, color:T.inkFaint, marginTop:2 }}>
            Antwortzeit: innerhalb von 24h
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SICHTBARKEIT SIDEBAR — nur Creator-Sicht
// ════════════════════════════════════════════════════════════════
function SichtbarkeitSidebar({ visibility, onChange }) {
  const opts = [
    { key:"public",       icon:"🌍", label:"Öffentlich" },
    { key:"connections",  icon:"👥", label:"Verbindungen" },
    { key:"private",      icon:"🔒", label:"Privat" },
  ];
  const cur = opts.find(o => o.key === visibility) || opts[0];
  return (
    <div style={{
      background:T.bgCard, borderRadius:T.r12,
      border:`1px solid ${T.border}`, padding:"12px 14px",
      boxShadow:T.card,
    }}>
      <div style={{ fontSize:12, fontWeight:800, color:T.ink, marginBottom:8 }}>Sichtbarkeit</div>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
        <span style={{ fontSize:13 }}>{cur.icon}</span>
        <span style={{ fontSize:12, color:T.inkSoft }}>
          Profil sichtbar für {cur.label}
        </span>
      </div>
      <button onClick={() => {
        const idx = opts.findIndex(o => o.key === visibility);
        onChange(opts[(idx+1) % opts.length].key);
      }} style={{
        background:"none", border:`1px solid ${T.border}`,
        borderRadius:99, padding:"6px 12px", fontSize:11,
        fontWeight:700, color:T.teal, cursor:"pointer", width:"100%",
      }}>
        ⚙ Einstellungen
      </button>
    </div>
  );
}

export default function MyBasisProfile({ onClose, profileId }) {
  console.log("PROFILE PAGE PARAM", profileId ?? "(keine profileId prop — lädt eigenes Profil)");
  // AuthContext: eigenen Profile-Cache nach Uploads aktualisieren
  // useAuth() kann null sein wenn kein Provider → safe fallback
  const _auth = useAuth() || {};
  const authContextProfile = _auth.profile ?? null;
  const loadingAuth        = _auth.loadingAuth ?? false;
  const setAuthProfile     = _auth.setProfile ?? null;
  const refreshProfile     = _auth.refreshProfile ?? null;
  // isTalent: STRIKT — nur aktive Talent-Mitgliedschaft gilt
  // membership_type==="talent" UND membership_active===true (aus activateMembership gesetzt)
  // has_talent_profile allein reicht NICHT (legacy-Feld, veraltet)
  // is_member allein reicht NICHT (war früher für alle Members gesetzt)
  // isTalent: Prüfe BEIDE Quellen — authContextProfile (primär) + lokaler profile-State (Fallback)
  // Verhindert Race-Condition wenn AuthContext noch nicht geladen
  const _checkTalent = (p) => !!(
    p?.is_talent === true ||           // persistentes Feld — primäre Quelle (Aufgabe 31)
    (p?.membership_type === "talent" && p?.membership_active === true) ||
    p?.membership_type === "guardian" ||
    p?.membership_type === "team"
  );
  const [profile,    setProfile]    = useState(null);
  // isTalent: IMMER aus AuthContext — niemals aus lokalem profile-State
  // AuthContext.profile ist die einzige Wahrheitsquelle für Membership-Status
  const isTalent = !!(
    _auth.isTalent === true ||                  // AuthContext-Calc (primär, immer aktuell)
    authContextProfile?.is_talent === true ||   // direktes DB-Feld aus AuthContext
    authContextProfile?.membership_type === "talent"  // membership_type-Check
  );
  const [loading,    setLoading]    = useState(true);
  const [mounted,    setMounted]    = useState(false);
  const [bio,        setBio]        = useState("");

  const [interests,  setInterests]  = useState([]);
  const [openFor,    setOpenFor]    = useState([]);
  const [moments,    setMoments]    = useState([]);
  const [visibility, setVisibility] = useState("connections"); // lokal — kein DB-Write
  const [saving,     setSaving]     = useState(false);
  const [saveOk,     setSaveOk]     = useState(false);
  const [saveErrMsg, setSaveErrMsg] = useState("");
  // Lokale URL-Overrides für sofortige UI-Aktualisierung nach Upload
  const [localAvatar, setLocalAvatar] = useState(null);
  const [localCover,  setLocalCover]  = useState(null);
  const [showGemeinschaft, setShowGemeinschaft] = useState(false);
  const [showAmbModal,    setShowAmbModal]    = useState(false);
  const [showSettings,    setShowSettings]    = useState(false);
  const [showWizard,      setShowWizard]      = useState(false);
  const [works,           setWorks]           = useState([]);
  const [worksLoading,    setWorksLoading]    = useState(false);
  // Talent-Dashboard Erlebnisse
  const [exps,            setExps]            = useState([]);
  const [expsLoading,     setExpsLoading]     = useState(false);
  const [showExpWizard,   setShowExpWizard]   = useState(false);
  const [editingExp,      setEditingExp]      = useState(null);
  // Talent-Dashboard wirker_profile (Kategorien/Tags)
  const [wirkerProfile,   setWirkerProfile]   = useState(null);
  const ambState = useAmbassador(profile);  // Nach States: profile ist jetzt null (nicht undefined)

  useEffect(()=>{ const t=setTimeout(()=>setMounted(true),30); return()=>clearTimeout(t); },[]);

  // ── Profil direkt aus DB laden (zuverlässig, kein AuthContext-Race) ──
  // ── Profil-Sync: AuthContext → lokaler State ─────────────────────────────
  // PRIMÄRE QUELLE: AuthContext.profile (wird von AuthContext geladen + gecacht)
  // FALLBACK: direkter DB-Call wenn AuthContext beim ersten Render noch nicht fertig
  const profileSyncedRef = useRef(false);

  useEffect(() => {
    if (!authContextProfile?.id) {
      // AuthContext noch nicht geladen — warte (useEffect feuert erneut wenn authContextProfile sich ändert)
      return;
    }
    // AuthContext hat ein Profil → synchronisieren
    const p = authContextProfile;
    setProfile(p);
    setBio(s(p.bio));
    setInterests(Array.isArray(p.skills) ? p.skills : []);
    setOpenFor(Array.isArray(p.profile_modules?.open_for) ? p.profile_modules.open_for : []);
    if (p.focus_type && ["public","connections","private"].includes(p.focus_type)) {
      setVisibility(p.focus_type);
    }
    let rawTags = p.dna_tags;
    if (typeof rawTags === "string" && rawTags.startsWith("{")) {
      rawTags = rawTags.slice(1, -1).split(",").map(v => v.trim()).filter(Boolean);
    }
    const tagArr = Array.isArray(rawTags) ? rawTags : [];
    if (tagArr.length) setMoments(tagArr.map((url, i) => ({ id: `db_${i}`, img: url })));
    profileSyncedRef.current = true;
    setLoading(false);
  }, [authContextProfile?.id, authContextProfile?.is_talent, authContextProfile?.membership_type,
      authContextProfile?.avatar_url, authContextProfile?.display_name,
      authContextProfile?.bio, authContextProfile?.profile_modules,
      authContextProfile?.skills]);

  // ── Fallback: AuthContext zu langsam → direkter DB-Call nach 2s ───────────
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (profileSyncedRef.current) return; // bereits geladen
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data } = await supabase.from("profiles")
          .select("id,username,display_name,avatar_url,header_img,bio,location,skills,dna_tags,focus_type,profile_modules,is_ambassador,is_wirker,membership_type,membership_active,is_member,has_talent_profile,is_talent,talent_since,role,membership_since,member_since,talent_activated_at,impact_eur,availability,blocked")
          .eq("id", user.id).single();
        if (data && !profileSyncedRef.current) {
          setProfile(data);
          setBio(s(data.bio));
          setInterests(Array.isArray(data.skills) ? data.skills : []);
          setOpenFor(Array.isArray(data.profile_modules?.open_for) ? data.profile_modules.open_for : []);
          if (data.focus_type && ["public","connections","private"].includes(data.focus_type)) {
            setVisibility(data.focus_type);
          }
          profileSyncedRef.current = true;
        }
      } catch(e) { console.warn("MyBasisProfile fallback load:", e); }
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // ── Werke des Nutzers laden ───────────────────────────────────────
  useEffect(()=>{
    if (!profile?.id) return;
    setWorksLoading(true);
    supabase.from("works")
      .select("id,title,status,created_at,media_urls,images,cover_url,price,price_eur,currency,category")
      .eq("user_id", profile.id)
      .not("status", "in", '("archived","deleted")')
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setWorks(data || []);
        setWorksLoading(false);
      });
  }, [profile?.id]);

  // ── Erlebnisse laden (nur wenn isTalent) ─────────────────────
  useEffect(() => {
    if (!profile?.id || !isTalent) { setExpsLoading(false); return; }
    let cancelled = false;
    setExpsLoading(true);
    supabase.from("experiences")
      .select("id,title,cover_url,status,date,category,experience_type,location_text,duration,created_at")
      .eq("user_id", profile.id)
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!cancelled) {
          if (!error) setExps(data || []);
          setExpsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [profile?.id, isTalent]);

  // ── wirker_profile laden (Kategorien/Tags) ───────────────────
  useEffect(() => {
    if (!profile?.id || !isTalent) return;
    supabase.from("wirker_profiles")
      .select("id,user_id,categories,talent,is_verified,hourly_rate")
      .eq("user_id", profile.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setWirkerProfile(data); });
  }, [profile?.id, isTalent]);

  // Auto-save on bio/interests/visibility change (debounced 1.2s)
  const saveTimer = useRef(null);
  const autoSave = useCallback(async (field, value) => {
    // FIX BUG 1: userId direkt aus Auth holen wenn profile?.id noch null
    let uid = profile?.id;
    if (!uid) {
      const { data: { user: au } } = await supabase.auth.getUser();
      uid = au?.id;
    }
    if (!uid) { console.warn("autoSave: kein userId für Feld", field); return; }
    console.log("AUTO_SAVE START", field, value, "uid:", uid);
    setSaving(true);
    try {
      const { error: saveErr } = await supabase.from("profiles")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", uid);
      if (saveErr) {
        console.error("AUTO_SAVE ERROR:", field, saveErr.message, saveErr.code, JSON.stringify(saveErr));
        setSaveErrMsg(field + ": " + saveErr.message + " [" + saveErr.code + "]");
        setTimeout(() => setSaveErrMsg(""), 8000);
      } else {
        console.log("AUTO_SAVE OK:", field, value);
        setSaveOk(true); setTimeout(()=>setSaveOk(false), 2000);
        // AuthContext-Cache sofort mitaktualisieren
        setAuthProfile(prev => prev ? { ...prev, [field]: value } : prev);
      }
    } catch(e) {
      console.error("AUTO_SAVE EXCEPTION:", field, e?.message);
    }
    setSaving(false);
  },[profile?.id, setAuthProfile]);

  const handleBioChange = (v) => {
    setBio(v);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(()=>autoSave("bio", v), 1200);
  };

  const handleInterestsChange = (v) => {
    setInterests(v);
    // Persistenz via skills-Spalte (ARRAY, existiert in profiles)
    autoSave("skills", v);
  };

  const handleMomentsChange = (newItems) => {
    setMoments(newItems);
    // Persistenz via dna_tags-Spalte (ARRAY von URL-Strings, existiert in profiles)
    const urls = newItems.map(m => m.img).filter(Boolean);
    console.log("HANDLE_MOMENTS_CHANGE newItems:", JSON.stringify(newItems));
    console.log("HANDLE_MOMENTS_CHANGE urls (nach filter):", JSON.stringify(urls));
    console.log("HANDLE_MOMENTS_CHANGE profile?.id:", profile?.id);
    autoSave("dna_tags", urls);
  };

  const handleVisibilityChange = (v) => {
    setVisibility(v);
    // Persistenz via focus_type-Spalte (TEXT, existiert in profiles)
    autoSave("focus_type", v);
  };

  const handleOpenForChange = async (v) => {
    setOpenFor(v);
    // Persistenz via profile_modules.open_for (JSONB-Feld, existiert in profiles)
    let uid = profile?.id;
    if (!uid) {
      const { data: { user: au } } = await supabase.auth.getUser();
      uid = au?.id;
    }
    if (!uid) return;
    try {
      const { data: curr } = await supabase.from("profiles")
        .select("profile_modules").eq("id", uid).single();
      const existing = curr?.profile_modules || {};
      await supabase.from("profiles")
        .update({
          profile_modules: { ...existing, open_for: v },
          updated_at: new Date().toISOString()
        })
        .eq("id", uid);
    } catch(e) { console.error("open_for save:", e?.message); }
  };

  // Sofortige lokale Anzeige + globaler AuthContext-Update nach Upload
  const handleAvatarChange = useCallback((url) => {
    setLocalAvatar(url);
    // Lokaler State
    setProfile(prev => prev ? { ...prev, avatar_url: url } : prev);
    // Globaler AuthContext → alle Komponenten die authProfile.avatar_url nutzen
    setAuthProfile(prev => prev ? { ...prev, avatar_url: url } : prev);
  }, [setAuthProfile]);

  const handleCoverChange = useCallback((url) => {
    setLocalCover(url);
    setProfile(prev => prev ? { ...prev, header_img: url } : prev);
    setAuthProfile(prev => prev ? { ...prev, header_img: url } : prev);
  }, [setAuthProfile]);

  return (
    <div className="mbp-root" style={{
      position:"fixed", inset:0, zIndex:9500,
      display:"flex", flexDirection:"column",
      opacity:mounted?1:0,
      transform:mounted?"none":"translateY(14px)",
      transition:"opacity .35s ease, transform .35s cubic-bezier(.22,1,.36,1)",
    }}>

      
      <style>{CSS}</style>

      {/* Save-Error-Toast */}
      {saveErrMsg ? (
        <div style={{
          position:"fixed", top:16, left:"50%", transform:"translateX(-50%)",
          zIndex:9999, padding:"10px 18px", borderRadius:99,
          background:"rgba(200,40,40,0.95)", color:"white",
          fontSize:12, fontWeight:700, maxWidth:"88vw",
          boxShadow:"0 4px 20px rgba(0,0,0,0.3)",
          textAlign:"center", lineHeight:1.5,
        }}>
          ⚠️ Speicher-Fehler: {saveErrMsg}
        </div>
      ) : null}

      {/* Save indicator */}
      {(saving || saveOk) && (
        <div style={{
          position:"fixed", top:16, right:16, zIndex:9900,
          padding:"6px 14px", borderRadius:T.r99,
          background: saveOk ? T.tealSoft : "rgba(26,26,24,0.07)",
          border:`1px solid ${saveOk ? T.tealMid : T.border}`,
          fontSize:11.5, fontWeight:600,
          color: saveOk ? T.teal : T.inkFaint,
          backdropFilter:"blur(10px)",
          transition:"all .2s ease",
        }}>
          {saveOk ? "✓ Gespeichert" : "Speichert…"}
        </div>
      )}

      <div className="mbp-scroll" style={{ flex:1, overflowY:"auto",
        paddingBottom:"max(96px,calc(80px + env(safe-area-inset-bottom,0px)))" }}>

        {/* HEADER */}

        <MeinProfilHeader
        profile={{
          ...profile,
          // Lokale Overrides überschreiben DB-Wert sofort nach Upload
          avatar_url: localAvatar || profile?.avatar_url,
          header_img: localCover  || profile?.header_img,
        }}
        onSettings={() => setShowSettings(true)}
        onAvatarChange={handleAvatarChange}
        onCoverChange={handleCoverChange}
      />
        <Gap h={62}/>

        {/* ══ NEUE STRUKTUR: Über mich → Talente → Werke → Erlebnisse → Empfehlungen → Sidebar */}

          {/* 1. ÜBER MICH */}
          <WarumHUI profile={profile} onEdit={() => {}} />
          <Gap h={20}/>
          <Divider/>
          <Gap h={20}/>

          {/* 2. TALENTE & FÄHIGKEITEN */}
          <MeineTalenteSection profile={profile} onEdit={() => {}} />
          <Gap h={20}/>
          <Divider/>
          <Gap h={20}/>

          {/* 3. TALENT-CONTENT — nur wenn isTalent */}
          {profile && isTalent && (
            <>
              {/* MEINE WERKE */}
              <MeineWerkeSection
                works={works}
                loading={worksLoading}
                onCreateNew={() => setShowWizard(true)}
                onRefresh={() => {
                  if (!profile?.id) return;
                  setWorksLoading(true);
                  supabase.from("works")
                    .select("id,title,status,created_at,media_urls,images,cover_url,price,price_type,description")
                    .eq("user_id", profile.id)
                    .not("status","in",'("archived","deleted")')
                    .order("created_at",{ascending:false}).limit(50)
                    .then(({data}) => { setWorks(data||[]); setWorksLoading(false); });
                }}
              />
              <Gap h={20}/>
              <Divider/>
              <Gap h={20}/>

              {/* ERLEBNISSE & PROJEKTE */}
              <TalentErlebnisseSection
                userId={profile?.id}
                exps={exps}
                loading={expsLoading}
                onCreateNew={() => setShowExpWizard(true)}
                onEdit={exp => { setEditingExp(exp); setShowExpWizard(true); }}
                onRefresh={() => {
                  if (!profile?.id) return;
                  setExpsLoading(true);
                  supabase.from("experiences")
                    .select("id,title,cover_url,status,date,category,experience_type,location,price,max_participants,current_participants,description")
                    .eq("user_id", profile.id)
                    .neq("status", "archived")
                    .order("created_at",{ascending:false})
                    .then(({ data }) => { setExps(data||[]); setExpsLoading(false); });
                }}
              />
              <Gap h={20}/>
              <Divider/>
              <Gap h={20}/>
            </>
          )}

          {/* 4. WEITEREMPFEHLUNGEN */}
          <WeiterempfehlungenSection userId={profile?.id} />
          <Gap h={20}/>
          <Divider/>
          <Gap h={20}/>

          {/* 5. INTERESSEN & WERTE */}
          <InteressenSection interests={interests} onChange={handleInterestsChange}/>
          <Gap h={20}/>
          <Divider/>
          <Gap h={20}/>

          {/* 6. OFFEN FÜR BEGEGNUNGEN */}
          <OffenFuerSection openFor={openFor} onChange={handleOpenForChange}/>
          <Gap h={20}/>
          <Divider/>
          <Gap h={20}/>

          {/* 7. GEMEINSCHAFT — nur für Nicht-Talents */}
          {profile && !isTalent && (
            <>
              <GemeinschaftsKarte onJoin={() => setShowGemeinschaft(true)}/>
              <Gap h={20}/>
              <Divider/>
              <Gap h={20}/>
            </>
          )}

          {/* 8. AMBASSADOR */}
          {ambState.isAmbassador ? (
            <AmbassadorSection ambassadorData={ambState.ambassadorData}/>
          ) : (
            <AmbassadorCTA
              isAmbassador={ambState.isAmbassador}
              isPending={ambState.isPending}
              ambassadorStatus={(profile?.profile_modules?.ambassador?.status) || null}
              onApply={() => setShowAmbModal(true)}
            />
          )}
          <Gap h={20}/>
          <Divider/>
          <Gap h={20}/>

          {/* ══ SIDEBAR-SEKTIONEN — auf Mobile unterhalb, auf Desktop rechts ══ */}
          <div style={{ padding:"0 20px", display:"flex", flexDirection:"column", gap:14 }}>
            <VertrauensstatusCard profile={profile} />
            <MeinWirkenSection profile={profile} works={works} exps={exps} />
            <StandortVerfuegbarkeit profile={profile} />
            <SichtbarkeitSidebar visibility={visibility} onChange={handleVisibilityChange} />
            <MeinWegTimeline userId={profile?.id} />
          </div>

          <Gap h={40}/>
      </div>

      {/* GEMEINSCHAFT FLOW MODAL */}
      {showGemeinschaft && (
        <GemeinschaftsFlow
          onClose={() => setShowGemeinschaft(false)}
          onComplete={() => {
            setShowGemeinschaft(false);
            refreshProfile?.().catch(() => {});
          }}
        />
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <SettingsModal
          profile={profile}
          onClose={() => setShowSettings(false)}
          onProfileUpdate={(updated) => {
            refreshProfile?.().catch(() => {});
          }}
          onEditProfile={() => {
            setShowSettings(false);
            // Öffne Profil-Editor falls vorhanden
            if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hui:openEditor"));
          }}
          onOpenBookings={() => {
            setShowSettings(false);
            if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hui:openBookings"));
          }}
        />
      )}

      {/* WERK-WIZARD */}
      {showWizard && profile?.id && (
        <WerkWizard
          userId={profile.id}
          onClose={() => setShowWizard(false)}
          onSaved={(werk) => {
            setShowWizard(false);
            if (werk) {
              setWorks(prev => [werk, ...prev.filter(w => w.id !== werk.id)]);
            } else {
              // Fallback: Werke neu laden
              supabase.from("works")
                .select("id,title,status,created_at,media_urls,images,cover_url,price,price_eur,currency,category")
                .eq("user_id", profile.id)
                .not("status","in",'("archived","deleted")')
                .order("created_at",{ascending:false}).limit(50)
                .then(({data}) => setWorks(data||[]));
            }
          }}
          onSave={() => {
            setShowWizard(false);
            supabase.from("works")
              .select("id,title,status,created_at,media_urls,images,cover_url,price,price_eur,currency,category")
              .eq("user_id", profile.id)
              .not("status","in",'("archived","deleted")')
              .order("created_at",{ascending:false}).limit(50)
              .then(({data}) => setWorks(data||[]));
          }}
        />
      )}

      {/* ERLEBNIS-WIZARD */}
      {showExpWizard && profile?.id && (
        <ExperienceWizard
          userId={profile.id}
          existingExp={editingExp}
          onClose={() => { setShowExpWizard(false); setEditingExp(null); }}
          onSaved={(exp) => {
            setShowExpWizard(false);
            setEditingExp(null);
            if (exp) {
              setExps(prev => [exp, ...prev.filter(e => e.id !== exp.id)]);
            } else {
              supabase.from("experiences")
                .select("id,title,cover_url,status,date,category,experience_type,location_text,duration,created_at")
                .eq("user_id", profile.id)
                .neq("status", "archived")
                .order("created_at",{ascending:false})
                .then(({ data }) => setExps(data||[]));
            }
          }}
        />
      )}

      {/* AMBASSADOR BEWERBUNGS-MODAL */}
      {showAmbModal && profile?.id && (
        <AmbassadorModal
          userId={profile.id}
          onClose={() => setShowAmbModal(false)}
          onSuccess={async () => {
            setShowAmbModal(false);
            // Profil neu laden damit isPending sofort korrekt angezeigt wird
            try {
              const { data: freshProf } = await supabase.from("profiles")
                .select("id,username,display_name,avatar_url,header_img,bio,location,skills,dna_tags,focus_type,profile_modules,is_ambassador,is_wirker,membership_type,membership_active,is_member,has_talent_profile,is_talent,talent_since,role,membership_since,member_since,talent_activated_at,impact_eur,availability,blocked")
                .eq("id", profile.id).single();
              if (freshProf) {
                setProfile(freshProf);
                setAuthProfile(prev => prev ? { ...prev, ...freshProf } : freshProf);
              }
            } catch(e) { /* silent */ }
            refreshProfile?.().catch(() => {});
          }}
        />
      )}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// GEMEINSCHAFTSKARTE
// Einladende Karte zwischen "Über mich" und "Interessen"
// Nur sichtbar für Basis-User (kein Talent-Profil aktiv)
// ══════════════════════════════════════════════════════════════
function GemeinschaftsKarte({ onJoin }) {
  return (
    <div style={{ padding:`0 20px` }}>
      <div style={{
        background:"linear-gradient(140deg,#F0FDFB 0%,#E8FAF8 60%,#F5FCF5 100%)",
        border:"1.5px solid rgba(14,196,184,0.20)",
        borderRadius:20,
        padding:"24px 20px 20px",
        boxShadow:"0 2px 16px rgba(14,196,184,0.10)",
        position:"relative",
        overflow:"hidden",
      }}>
        {/* Deko-Glow hinten */}
        <div style={{
          position:"absolute", right:-20, top:-20,
          width:120, height:120, borderRadius:"50%",
          background:"radial-gradient(circle,rgba(14,196,184,0.12),transparent 70%)",
          pointerEvents:"none",
        }}/>

        <h3 style={{
          fontSize:22, fontWeight:800, color:"#1A1A18",
          letterSpacing:"-0.03em", lineHeight:1.25,
          margin:"0 0 10px",
        }}>
          Werde Teil der<br/>HUI-Gemeinschaft ✨
        </h3>

        <p style={{
          fontSize:14, lineHeight:1.72, color:"rgba(26,26,24,0.58)",
          margin:"0 0 20px",
        }}>
          Jeder Mensch trägt etwas Wertvolles in sich.
          Teile deine Talente, Ideen, Werke und Erfahrungen mit anderen
          und gestalte gemeinsam eine bessere Welt.
        </p>

        <button
          onClick={onJoin}
          style={{
            display:"inline-flex", alignItems:"center", gap:8,
            padding:"14px 22px",
            background:"linear-gradient(135deg,#0EC4B8,#0AADA3)",
            color:"#fff", border:"none", borderRadius:99,
            fontSize:15, fontWeight:800,
            cursor:"pointer", fontFamily:"inherit",
            boxShadow:"0 4px 16px rgba(14,196,184,0.30)",
            touchAction:"manipulation",
            transition:"transform .15s, box-shadow .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform="scale(1.02)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; }}
          onTouchStart={e => { e.currentTarget.style.transform="scale(0.97)"; }}
          onTouchEnd={e => { e.currentTarget.style.transform="scale(1)"; }}
        >
          🤝 Der Gemeinschaft beitreten
        </button>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// TALENT STATISTIK SECTION
// ══════════════════════════════════════════════════════════════
function TalentStatsSection({ works = [], exps = [] }) {
  const published   = works.filter(w => w.status === "published").length;
  const pending     = works.filter(w => w.status === "pending_review").length;
  const expCount    = exps.filter(e => e.status !== "archived").length;
  const stats = [
    { icon:"🎨", label:"Werke", value: works.length, sub: `${published} veröffentlicht` },
    { icon:"✨", label:"Erlebnisse", value: expCount, sub: "Workshops & Events" },
    { icon:"⏳", label:"In Prüfung", value: pending, sub: "warten auf Freigabe" },
  ];
  return (
    <div style={{ padding:"0 20px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
        <span style={{ fontSize:15 }}>📊</span>
        <span style={{ fontSize:14, fontWeight:700, color:"#1A1A18" }}>Statistik & Wirkung</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background:"linear-gradient(135deg,#F0FDFB,#E8FAF8)",
            border:"1.5px solid rgba(14,196,184,0.18)",
            borderRadius:14, padding:"14px 10px 12px",
            textAlign:"center",
          }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:800, color:"#0EC4B8", lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, fontWeight:700, color:"#1A1A18", marginTop:3 }}>{s.label}</div>
            <div style={{ fontSize:10, color:"rgba(26,26,24,0.45)", marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TALENT ERLEBNISSE SECTION
// ══════════════════════════════════════════════════════════════
const EXP_STATUS = {
  draft:          { label:"Entwurf",       color:"rgba(26,26,24,0.38)", bg:"rgba(26,26,24,0.05)" },
  pending_review: { label:"In Prüfung",    color:"#D97706",             bg:"#FEF3C7" },
  published:      { label:"Aktiv",         color:"#16A34A",             bg:"#DCFCE7" },
  rejected:       { label:"Abgelehnt",     color:"#DC2626",             bg:"#FEE2E2" },
};

function TalentErlebnisseSection({ userId, exps, loading, onCreateNew, onEdit, onRefresh }) {
  return (
    <div style={{ padding:"0 20px" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ fontSize:18 }}>✨</span>
          <span style={{ fontSize:15, fontWeight:800, color:"#1A1A18" }}>Erlebnisse & Projekte</span>
        </div>
        <button
          onClick={onCreateNew}
          style={{
            display:"flex", alignItems:"center", gap:5,
            padding:"8px 14px", borderRadius:99,
            background:"#0EC4B8", border:"none",
            color:"#fff", fontSize:12, fontWeight:700,
            cursor:"pointer", touchAction:"manipulation",
          }}
        >
          + Neues Erlebnis
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ height:80, background:"rgba(14,196,184,0.06)", borderRadius:12, animation:"pulse 1.5s infinite" }}/>
      ) : exps.length === 0 ? (
        <div style={{
          textAlign:"center", padding:"32px 20px",
          background:"rgba(14,196,184,0.04)", borderRadius:16,
          border:"1.5px dashed rgba(14,196,184,0.20)",
        }}>
          <div style={{ fontSize:32, marginBottom:8 }}>✨</div>
          <div style={{ fontSize:14, fontWeight:700, color:"#1A1A18", marginBottom:4 }}>Noch keine Erlebnisse</div>
          <div style={{ fontSize:12, color:"rgba(26,26,24,0.45)" }}>Erstelle dein erstes Erlebnis, Event oder Projekt.</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {exps.map(exp => {
            const st = EXP_STATUS[exp.status] || EXP_STATUS.draft;
            const dateStr = exp.date ? new Date(exp.date).toLocaleDateString("de-DE", { day:"2-digit", month:"short", year:"numeric" }) : null;
            return (
              <div key={exp.id} style={{
                background:"#fff", borderRadius:14,
                border:"1px solid rgba(26,26,24,0.09)",
                padding:"14px 16px",
                display:"flex", alignItems:"center", gap:12,
                boxShadow:"0 2px 8px rgba(26,26,24,0.05)",
              }}>
                {exp.cover_url ? (
                  <img src={exp.cover_url} alt="" style={{ width:52, height:52, borderRadius:10, objectFit:"cover", flexShrink:0 }}/>
                ) : (
                  <div style={{ width:52, height:52, borderRadius:10, background:"rgba(14,196,184,0.10)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>✨</div>
                )}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#1A1A18", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{exp.title || "Unbenanntes Erlebnis"}</div>
                  {dateStr && <div style={{ fontSize:11, color:"rgba(26,26,24,0.45)", marginTop:2 }}>📅 {dateStr}</div>}
                  {exp.category && <div style={{ fontSize:11, color:"rgba(26,26,24,0.45)" }}>{exp.category}</div>}
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:st.color, background:st.bg, padding:"3px 8px", borderRadius:99 }}>{st.label}</span>
                  <button
                    onClick={() => onEdit?.(exp)}
                    style={{ fontSize:11, fontWeight:600, color:"#0EC4B8", background:"none", border:"none", cursor:"pointer", padding:0 }}
                  >Bearbeiten</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MEINE WERKE SECTION
// ══════════════════════════════════════════════════════════════
const STATUS_CONFIG = {
  pending_review: { label:"In Prüfung",        color:"#E58A00", bg:"rgba(229,138,0,0.10)",  icon:"⏳" },
  published:      { label:"Veröffentlicht",     color:"#0EC4B8", bg:"rgba(14,196,184,0.10)", icon:"✅" },
  rejected:       { label:"Abgelehnt",          color:"#E53935", bg:"rgba(229,57,53,0.10)",  icon:"❌" },
  draft:          { label:"Entwurf",            color:"#888",    bg:"rgba(0,0,0,0.07)",       icon:"✏️" },
  approved:       { label:"Veröffentlicht",     color:"#0EC4B8", bg:"rgba(14,196,184,0.10)", icon:"✅" },
};

function WerkStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding:"3px 9px", borderRadius:99,
      background:cfg.bg, color:cfg.color,
      fontSize:11.5, fontWeight:700,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function WerkCard({ werk }) {
  // Thumbnail: cover_url → images[0] → media_urls[0]
  const thumb = werk.cover_url
    || (Array.isArray(werk.images) && werk.images.length > 0
        ? (werk.images[0]?.url || werk.images[0])
        : null)
    || (Array.isArray(werk.media_urls) && werk.media_urls.length > 0
        ? (werk.media_urls[0]?.url || werk.media_urls[0])
        : null);
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12,
      padding:"12px 0", borderBottom:"1px solid rgba(26,26,24,0.08)",
    }}>
      {thumb ? (
        <img src={thumb} alt={werk.title} style={{
          width:52, height:52, borderRadius:10, objectFit:"cover", flexShrink:0,
          background:"rgba(26,26,24,0.06)",
        }}/>
      ) : (
        <div style={{
          width:52, height:52, borderRadius:10, flexShrink:0,
          background:"rgba(14,196,184,0.10)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:22,
        }}>🎨</div>
      )}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#1A1A18",
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {werk.title || "Ohne Titel"}
        </div>
        <div style={{ marginTop:4 }}>
          <WerkStatusBadge status={werk.status || "draft"}/>
        </div>
        {werk.status === "rejected" && (
          <div style={{ fontSize:11.5, color:"#E53935", marginTop:4, lineHeight:1.4 }}>
            Abgelehnt – bitte überarbeite und reiche es erneut ein.
          </div>
        )}
      </div>
    </div>
  );
}

function MeineWerkeSection({ works, loading, onCreateNew, onRefresh }) {
  return (
    <div style={{ padding:`0 20px` }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:17, fontWeight:800, color:"#1A1A18" }}>🎨 Meine Werke</div>
        <button onClick={onCreateNew} style={{
          display:"flex", alignItems:"center", gap:6,
          padding:"8px 14px", background:"#0EC4B8",
          border:"none", borderRadius:99,
          fontSize:13, fontWeight:700, color:"#fff",
          cursor:"pointer", touchAction:"manipulation",
        }}>+ Neues Werk</button>
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"24px 0", color:"rgba(26,26,24,0.4)", fontSize:13 }}>
          Lädt…
        </div>
      ) : works.length === 0 ? (
        <div style={{
          textAlign:"center", padding:"28px 16px",
          background:"rgba(14,196,184,0.05)", borderRadius:14,
          border:"1.5px dashed rgba(14,196,184,0.25)",
        }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🎨</div>
          <div style={{ fontSize:13.5, fontWeight:600, color:"rgba(26,26,24,0.55)" }}>
            Noch keine Werke
          </div>
          <div style={{ fontSize:12, color:"rgba(26,26,24,0.38)", marginTop:4 }}>
            Erstelle dein erstes Werk und reiche es zur Freigabe ein.
          </div>
        </div>
      ) : (
        <div>
          {works.map(w => <WerkCard key={w.id} werk={w}/>)}
        </div>
      )}
    </div>
  );
}
