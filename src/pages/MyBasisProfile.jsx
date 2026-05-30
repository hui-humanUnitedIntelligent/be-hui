// src/pages/MyBasisProfile.jsx — HUI Mein Profil v1
// "Ich gestalte meine Präsenz."
// ════════════════════════════════════════════════════════════════
// Eigene Profil-Seite für Basis-User. Kein Creator-Dashboard.
// Alles inline-editierbar. Ruhig. Emotional. Human.
// ════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth }   from "../lib/AuthContext.jsx";

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

const MOMENT_SEEDS = [
  { id:"s1", img:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=300&q=70" },
  { id:"s2", img:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&q=70" },
  { id:"s3", img:"https://images.unsplash.com/photo-1490750967868-88df5691cc38?w=300&q=70" },
  { id:"s4", img:"https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=300&q=70" },
  { id:"s5", img:"https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&q=70" },
];

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
      <div style={{ margin:`0 ${T.px}px`, borderRadius:T.r20, overflow:"hidden",
        height:170, position:"relative", background:"linear-gradient(160deg,#2C3E2D,#7B8E5E)" }}>
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

        {/* Floating avatar — centered bottom */}
        <div style={{ position:"absolute", bottom:-38, left:"50%", transform:"translateX(-50%)",
          display:"flex", flexDirection:"column", alignItems:"center" }}>
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
            {/* Camera button — öffnet File Picker für Avatar */}
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
  const items = a(moments).length ? a(moments) : MOMENT_SEEDS;

  const removeItem = (id) => onChange(items.filter(m=>m.id!==id));

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <SectionRow title="Momente" sub="Teile kleine Augenblicke aus deinem Alltag." onEdit={()=>{}}/>
      {/* Horizontal scroll grid exactly like screenshot */}
      <div className="mbp-hscroll" style={{
        display:"grid",
        gridTemplateColumns:`repeat(${items.length + 1}, minmax(110px, 1fr))`,
        gap:8, paddingBottom:4,
      }}>
        {items.map((m,i)=>(
          <MomentThumb key={m.id||i} m={m} onRemove={()=>removeItem(m.id)}/>
        ))}
      </div>
      <Gap h={10}/>
      {/* + Moment hinzufügen */}
      <button className="mbp-press-light" style={{
        display:"inline-flex", alignItems:"center", gap:8,
        padding:"9px 18px", borderRadius:T.r99,
        background:T.bgCard, border:`1px solid ${T.border}`,
        fontSize:13, fontWeight:600, color:T.inkSoft,
        cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
        boxShadow:T.card,
      }}>
        <span style={{fontSize:16}}>+</span> Moment hinzufügen
      </button>
    </div>
  );
}

function MomentThumb({ m, onRemove }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ position:"relative", aspectRatio:"1", borderRadius:T.r12,
      overflow:"hidden", background:"rgba(26,26,24,0.07)", flexShrink:0 }}>
      {!loaded && <div className="mbp-skeleton" style={{position:"absolute",inset:0}}/>}
      <img src={m.img} alt="" onLoad={()=>setLoaded(true)} onError={()=>setLoaded(true)}
        style={{ width:"100%", height:"100%", objectFit:"cover", display:"block",
          opacity:loaded?1:0, transition:"opacity .5s ease" }}/>
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
      <SectionRow title="Offen für Begegnungen" sub="Wofür bist du offen? Was interessiert dich?" onEdit={()=>setShowEdit(true)}/>
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
  const { setProfile: setAuthProfile, refreshProfile } = useAuth();

  const [profile,    setProfile]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [mounted,    setMounted]    = useState(false);
  const [bio,        setBio]        = useState("");
  const [interests,  setInterests]  = useState([]);
  const [openFor,    setOpenFor]    = useState([]);
  const [moments,    setMoments]    = useState([]);
  const [visibility, setVisibility] = useState("connections");
  const [saving,     setSaving]     = useState(false);
  const [saveOk,     setSaveOk]     = useState(false);
  // Lokale URL-Overrides für sofortige UI-Aktualisierung nach Upload
  const [localAvatar, setLocalAvatar] = useState(null);
  const [localCover,  setLocalCover]  = useState(null);

  useEffect(()=>{ const t=setTimeout(()=>setMounted(true),30); return()=>clearTimeout(t); },[]);

  useEffect(()=>{
    (async () => {
      try {
        const { data:{ user } } = await supabase.auth.getUser();
        console.log("AUTH UID", user?.id);
        if (!user) { setLoading(false); return; }
        const { data, error: loadErr } = await supabase.from("profiles")
          .select("id,username,display_name,avatar_url,header_img,bio,interests,location,visibility")
          .eq("id", user.id).single();
        console.log("PROFILE SELECT RESULT", data);
        if (loadErr) console.error("PROFILE SELECT ERROR", loadErr.message, loadErr.code);
        if (data) {
          setProfile(data);
          setBio(s(data.bio));
          setInterests(Array.isArray(data.interests) ? data.interests.filter(x=>typeof x==="string") : []);
          setVisibility(data.visibility || "connections");
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
    setSaving(true);
    try {
      const { error: saveErr } = await supabase.from("profiles")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", uid);
      if (saveErr) {
        // Sichtbarer Fehler statt silent warning
        console.error("autoSave DB error:", field, saveErr.message, saveErr.code, JSON.stringify(saveErr));
      } else {
        setSaveOk(true); setTimeout(()=>setSaveOk(false), 2000);
        // AuthContext-Cache sofort mitaktualisieren
        setAuthProfile(prev => prev ? { ...prev, [field]: value } : prev);
      }
    } catch(e) {
      console.error("autoSave exception:", field, e?.message);
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
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(()=>autoSave("interests", v), 800);
  };

  const handleVisibilityChange = (v) => {
    setVisibility(v);
    autoSave("visibility", v);
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
        {(() => { console.log("PROFILE USED FOR RENDER", profile); return null; })()}
        <MeinProfilHeader
        profile={{
          ...profile,
          // Lokale Overrides überschreiben DB-Wert sofort nach Upload
          avatar_url: localAvatar || profile?.avatar_url,
          header_img: localCover  || profile?.header_img,
        }}
        onSettings={() => {}}
        onAvatarChange={handleAvatarChange}
        onCoverChange={handleCoverChange}
      />
        <Gap h={56}/> {/* space for floating avatar */}

        {/* ÜBER DICH */}
        <UeberDich bio={bio} onChange={handleBioChange}/>
        <Gap h={24}/>
        <Divider/>
        <Gap h={20}/>

        {/* INTERESSEN & WERTE */}
        <InteressenSection interests={interests} onChange={handleInterestsChange}/>
        <Gap h={24}/>
        <Divider/>
        <Gap h={20}/>

        {/* MOMENTE */}
        <MomenteSection moments={moments} onChange={setMoments}/>
        <Gap h={24}/>
        <Divider/>
        <Gap h={20}/>

        {/* OFFEN FÜR BEGEGNUNGEN */}
        <OffenFuerSection openFor={openFor} onChange={setOpenFor}/>
        <Gap h={24}/>
        <Divider/>
        <Gap h={20}/>

        {/* SICHTBARKEIT */}
        <SichtbarkeitSection visibility={visibility} onChange={handleVisibilityChange}/>
        <Gap h={40}/>
      </div>
    </div>
  );
}
