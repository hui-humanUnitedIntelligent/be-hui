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
const FB_COVER = "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80";
const FB_AVT   = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80";

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

function Sheet({ onClose, children, zIndex=9800 }) {
  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex,
      background:"rgba(26,26,24,0.4)",
      display:"flex", alignItems:"flex-end",
    }}>
      <div className="mbp-sheet" onClick={e=>e.stopPropagation()} style={{
        width:"100%", background:T.bgSheet,
        borderRadius:`${T.r24}px ${T.r24}px 0 0`,
        padding:"20px 20px max(36px,calc(24px + env(safe-area-inset-bottom,0px)))",
        boxShadow:T.sheet, maxHeight:"80vh", overflowY:"auto",
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

  const cover  = s(profile?.header_img,  FB_COVER);
  const avatar = s(profile?.avatar_url,  FB_AVT);
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
            Mein Profil <span style={{fontSize:18}}>🌿</span>
          </div>
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
              {!avLoaded && <div className="mbp-skeleton" style={{position:"absolute",inset:0,borderRadius:"50%"}}/>}
              <img src={avatar} alt={name} onLoad={()=>setAvLoaded(true)} onError={()=>setAvLoaded(true)}
                style={{ width:"100%", height:"100%", objectFit:"cover",
                  opacity:avLoaded?1:0, transition:"opacity .5s ease" }}/>
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
  const display = current.length ? OPEN_FOR_ALL.filter(t=>current.includes(t.label)) : OPEN_FOR_ALL.slice(0,4);

  const toggle = (label) => {
    if (current.includes(label)) onChange(current.filter(x=>x!==label));
    else onChange([...current, label]);
  };

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <SectionRow title="Offen für Begegnungen" sub="Wofür bist du offen? Was interessiert dich?"/>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {display.map((t,i)=>(
          <div key={i} style={{
            display:"inline-flex", alignItems:"center", gap:6,
            padding:"9px 16px", borderRadius:T.r99,
            background:T.bgCard, border:`1px solid ${T.border}`,
            fontSize:13, fontWeight:600, color:T.ink,
            boxShadow:T.card,
          }}>
            <span style={{fontSize:14}}>{t.icon}</span>{t.label}
          </div>
        ))}
        <button className="mbp-press-light" onClick={()=>setShowEdit(true)} style={{
          display:"inline-flex", alignItems:"center", gap:6,
          padding:"9px 16px", borderRadius:T.r99,
          background:"transparent", border:`1px dashed ${T.borderMid}`,
          fontSize:13, fontWeight:600, color:T.inkSoft,
          cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
        }}>
          <span style={{fontSize:14}}>+</span> Weiteres hinzufügen
        </button>
      </div>

      {showEdit && (
        <Sheet onClose={()=>setShowEdit(false)}>
          <div style={{ fontSize:16, fontWeight:800, color:T.ink, marginBottom:4 }}>Offen für Begegnungen</div>
          <div style={{ fontSize:12, color:T.inkFaint, marginBottom:16 }}>Was interessiert dich gerade?</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
            {OPEN_FOR_ALL.map((t,i)=>(
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
export default function MyBasisProfile({ onClose, profileId }) {
  console.log("PROFILE PAGE PARAM", profileId ?? "(keine profileId prop — lädt eigenes Profil)");
  // AuthContext: eigenen Profile-Cache nach Uploads aktualisieren
  const _auth = useAuth() || {};
  const setAuthProfile = _auth.setProfile ?? null;
  const refreshProfile  = _auth.refreshProfile ?? null;
  const [profile,    setProfile]    = useState(null);
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
  const ambState = useAmbassador(profile);  // Nach States: profile ist jetzt null (nicht undefined)

  useEffect(()=>{ const t=setTimeout(()=>setMounted(true),30); return()=>clearTimeout(t); },[]);

  useEffect(()=>{
    (async () => {
      try {
        const { data:{ user } } = await supabase.auth.getUser();

        if (!user) { setLoading(false); return; }
        const { data, error: loadErr } = await supabase.from("profiles")
          .select("id,username,display_name,avatar_url,header_img,bio,location,skills,dna_tags,focus_type")
          .eq("id", user.id).single();
        console.log("DB PROFILE", data);
        if (loadErr) console.error("Profile load error:", loadErr.message, loadErr.code, JSON.stringify(loadErr));
        console.log("DNA_TAGS FROM DB", data?.dna_tags);
        if (data) {
          setProfile(data);
          setBio(s(data.bio));
          console.log("SET BIO", data.bio);
          // Interessen aus skills-Spalte laden (ARRAY, existiert in DB)
          const nextInterests = Array.isArray(data.skills) ? data.skills : [];
          setInterests(nextInterests);
          console.log("SET INTERESTS", nextInterests);
          // Momente aus dna_tags laden (ARRAY von URL-Strings, existiert in DB)
          // dna_tags kann als JS Array ODER als Postgres-String '{url1,url2}' kommen
          let rawTags = data.dna_tags;
          if (typeof rawTags === "string" && rawTags.startsWith("{")) {
            // Postgres array literal parsen: '{a,b,c}' → ['a','b','c']
            rawTags = rawTags.slice(1, -1).split(",").map(s => s.trim()).filter(Boolean);
          }
          const tagArr = Array.isArray(rawTags) ? rawTags : [];
          console.log("DNA_CHECK type:", typeof data.dna_tags, "isArray:", Array.isArray(data.dna_tags), "tagArr.length:", tagArr.length, "sample:", tagArr[0]);
          if (tagArr.length) {
            const mapped = tagArr.map((url, i) => ({ id: `db_${i}`, img: url }));
            setMoments(mapped);
            console.log("MOMENTS STATE SET", mapped.length, "items");
          } else {
            console.log("MOMENTS SKIPPED — dna_tags leer");
          }
          // Sichtbarkeit aus focus_type laden (TEXT, existiert in DB)
          if (data.focus_type && ["public","connections","private"].includes(data.focus_type)) {
            setVisibility(data.focus_type);
          }
          // Offen für Begegnungen — interests-Spalte existiert nicht in DB, lokal verwaltet
          setOpenFor([]);
        }
      } catch(e) { console.warn("MyBasisProfile load:", e); }
      setLoading(false);
    })();
  },[]);

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

  const handleOpenForChange = (v) => {
    setOpenFor(v);
    // Persistenz via interests-Spalte (TEXT[], existiert in profiles)
    autoSave("interests", v);
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
        paddingBottom:"max(80px,calc(64px + env(safe-area-inset-bottom,0px)))" }}>

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
        {/* HEADER */}
        <MeinProfilHeader
          profile={{
            ...profile,
            avatar_url: localAvatar || profile?.avatar_url,
            header_img: localCover  || profile?.header_img,
          }}
          onSettings={() => setShowSettings(true)}
          onAvatarChange={handleAvatarChange}
          onCoverChange={handleCoverChange}
        />
        <Gap h={62}/>

        {/* ── 1. ÜBER MICH ─────────────────────────────────── */}
        <div style={{ padding:"0 20px" }}>
          <SectionRow title="Über mich" onEdit={() => {}} />
          {bio ? (
            <p style={{ margin:"0 0 12px", fontSize:14, lineHeight:1.75, color:T.ink }}>
              {bio}
            </p>
          ) : (
            <div style={{ fontSize:13, color:T.inkFaint, fontStyle:"italic", marginBottom:12 }}>
              Erzähl etwas über dich…
            </div>
          )}
          {profile?.profile_modules?.warum_hui && (
            <div style={{
              background:T.tealSoft, borderRadius:T.r12,
              border:`1px solid ${T.tealMid}`, padding:"12px 14px", marginTop:4,
            }}>
              <div style={{ fontSize:11, fontWeight:700, color:T.teal, marginBottom:4 }}>
                🌱 Warum ich auf HUI bin
              </div>
              <p style={{ margin:0, fontSize:13, color:T.ink, lineHeight:1.65 }}>
                {profile.profile_modules.warum_hui}
              </p>
            </div>
          )}
        </div>
        <Gap h={20}/>
        <Divider/>
        <Gap h={20}/>

        {/* ── 2. MEINE TALENTE & ANGEBOTE ──────────────────── */}
        {profile && (() => {
          const chips = Array.isArray(profile?.skills) ? profile.skills : [];
          if (!chips.length) return null;
          return (
            <div style={{ padding:"0 20px" }}>
              <SectionRow title="Meine Talente & Angebote" onEdit={() => {}} />
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {chips.map((t, i) => (
                  <span key={i} style={{
                    display:"inline-flex", alignItems:"center",
                    padding:"6px 13px", borderRadius:99,
                    background:T.bgCard, border:`1.5px solid ${T.border}`,
                    fontSize:13, fontWeight:600, color:T.ink, boxShadow:T.card,
                  }}>{t}</span>
                ))}
              </div>
            </div>
          );
        })()}
        {profile?.skills?.length > 0 && <Gap h={20}/>}
        {profile?.skills?.length > 0 && <Divider/>}
        {profile?.skills?.length > 0 && <Gap h={20}/>}

        {/* ── 3. WEITEREMPFEHLUNGEN ────────────────────────── */}
        <div style={{ padding:"0 20px" }}>
          <SectionRow title="Weiterempfehlungen" />
          <div style={{
            display:"inline-flex", alignItems:"center", gap:6,
            padding:"5px 12px", borderRadius:99, marginBottom:12,
            background:T.tealSoft, border:`1px solid ${T.tealMid}`,
            fontSize:11, fontWeight:700, color:T.teal,
          }}>
            💚 Keine Sterne. Keine Likes. Nur echte Erfahrungen.
          </div>
          <div style={{
            background:T.bgCard, borderRadius:T.r16, padding:"16px",
            border:`1px solid ${T.border}`, boxShadow:T.card,
          }}>
            <div style={{ fontSize:13, color:T.inkFaint, lineHeight:1.65 }}>
              Weiterempfehlungen entstehen nach echten Erlebnissen, Buchungen oder Zusammenarbeit.
            </div>
          </div>
        </div>
        <Gap h={20}/>
        <Divider/>
        <Gap h={20}/>

        {/* ── 4. VERFÜGBARKEIT ─────────────────────────────── */}
        <div style={{ padding:"0 20px" }}>
          <SectionRow title="Verfügbarkeit" />
          <div style={{
            background:T.bgCard, borderRadius:T.r16,
            border:`1px solid ${T.border}`, padding:"14px 16px", boxShadow:T.card,
          }}>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ width:7, height:7, borderRadius:"50%",
                  background:"#16A34A", display:"inline-block", flexShrink:0 }}/>
                <span style={{ fontSize:13, color:T.ink, fontWeight:600 }}>
                  Online & Vor Ort
                </span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:13 }}>💬</span>
                <span style={{ fontSize:13, color:T.inkSoft }}>Offen für neue Anfragen</span>
              </div>
              <div style={{ fontSize:11, color:T.inkFaint }}>
                Antwortzeit: innerhalb von 24h
              </div>
            </div>
          </div>
        </div>
        <Gap h={20}/>
        <Divider/>
        <Gap h={20}/>

        {/* ── 5. STANDORT ──────────────────────────────────── */}
        {profile?.location && (
          <>
            <div style={{ padding:"0 20px" }}>
              <SectionRow title="Standort" />
              <div style={{
                background:T.bgCard, borderRadius:T.r16,
                border:`1px solid ${T.border}`, padding:"14px 16px",
                boxShadow:T.card, display:"flex", alignItems:"center", gap:8,
              }}>
                <span style={{ fontSize:16 }}>📍</span>
                <span style={{ fontSize:13, color:T.inkSoft, fontWeight:500 }}>
                  {profile.location}
                </span>
              </div>
            </div>
            <Gap h={20}/>
            <Divider/>
            <Gap h={20}/>
          </>
        )}

        {/* ── 6. SICHTBARKEIT ──────────────────────────────── */}
        <SichtbarkeitSection visibility={visibility} onChange={handleVisibilityChange}/>

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

      {/* AMBASSADOR BEWERBUNGS-MODAL */}
      {showAmbModal && profile?.id && (
        <AmbassadorModal
          userId={profile.id}
          onClose={() => setShowAmbModal(false)}
          onSuccess={() => {
            setShowAmbModal(false);
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
