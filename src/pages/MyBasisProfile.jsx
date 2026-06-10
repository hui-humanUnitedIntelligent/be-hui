// src/pages/MyBasisProfile.jsx — HUI Mein Profil v1
// "Ich gestalte meine Präsenz."
// ════════════════════════════════════════════════════════════════
// Eigene Profil-Seite für Basis-User. Kein Creator-Dashboard.
// Alles inline-editierbar. Ruhig. Emotional. Human.
// ════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth }   from "../lib/AuthContext.jsx";
import { useHome }   from "../components/home/HomeShell.jsx";
import GemeinschaftsFlow from "../components/GemeinschaftsFlow.jsx";
import AmbassadorSection, { AmbassadorCTA } from "../components/ambassador/AmbassadorSection.jsx";
import NotificationPanel from "../components/notifications/NotificationPanel.jsx";
import AmbassadorModal from "../components/ambassador/AmbassadorModal.jsx";
import SettingsModal  from "../components/settings/SettingsModal.jsx";
import { useAmbassador } from "../hooks/useAmbassador.js";
import { useProfileData } from "../hooks/useProfileData.js";
import HuiStudio       from "../components/studio/HuiStudio.jsx";
import WerkWizard      from "../components/works/WerkWizard.jsx";
import ExperienceWizard from "../components/experiences/ExperienceWizard.jsx";

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

function MeinProfilHeader({ profile, isTalentView = false, onSettings, onBell = () => {}, onStudio = () => {}, unreadCount = 0, onAvatarChange, onCoverChange }) {
  const [imgLoaded,       setImgLoaded]       = useState(false);
  const [avLoaded,        setAvLoaded]         = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading,  setCoverUploading]  = useState(false);
  const avatarInputRef = useRef(null);
  const coverInputRef  = useRef(null);

  const cover  = s(profile?.header_img,  FB_COVER);
  const avatar = s(profile?.avatar_url,  FB_AVT);
  const name   = s(profile?.display_name || profile?.username);

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

  // Avatar: 90px Durchmesser → Hälfte = 45px überlappt die Unterkante
  // Cover-Wrapper hat overflow:visible damit Avatar rausragen kann
  const AVT_SIZE = 90;

  return (
    <div style={{ width:"100%" }}>

      {/* Hidden file inputs */}
      <input ref={coverInputRef} type="file" accept="image/*"
        style={{ display:"none" }} onChange={handleCoverFile} />
      <input ref={avatarInputRef} type="file" accept="image/*"
        style={{ display:"none" }} onChange={handleAvatarFile} />

      {/* ── COVER + Avatar-Overlap ─────────────────────────── */}
      {/* Cover hat overflow:visible — Avatar ragt unten raus */}
      <div style={{
        margin:`0 ${T.px}px`,
        borderRadius:T.r20,
        height:165,
        position:"relative",
        overflow:"visible",
        background:"linear-gradient(160deg,#1a2e3b,#5a7a6e)",
      }}>
        {/* Cover-Bild (overflow:hidden nur auf dem Bild selbst) */}
        <div style={{
          position:"absolute", inset:0,
          borderRadius:T.r20, overflow:"hidden",
        }}>
          <img
            src={cover} alt=""
            onLoad={()=>setImgLoaded(true)}
            onError={()=>setImgLoaded(true)}
            style={{
              width:"100%", height:"100%", objectFit:"cover",
              opacity:imgLoaded ? 1 : 0, transition:"opacity 1.1s ease",
            }}
          />
          {/* sanfter Gradient unten */}
          <div style={{
            position:"absolute", inset:0,
            background:"linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,0.18) 100%)",
          }}/>
        </div>



        {/* Cover-Kamera oben links */}
        <button
          onClick={() => coverInputRef.current?.click()}
          style={{
            position:"absolute", top:12, left:12, zIndex:20,
            width:30, height:30, borderRadius:"50%",
            background:"rgba(0,0,0,0.38)", backdropFilter:"blur(6px)",
            border:"none", display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:13, cursor:"pointer", touchAction:"manipulation",
          }}
        >
          {coverUploading ? "⏳" : "📷"}
        </button>

        {/* Avatar — zentriert, Hälfte überlappt Unterkante */}
        <div style={{
          position:"absolute",
          bottom: -(AVT_SIZE / 2),   /* 45px unter Cover-Unterkante */
          left:"50%",
          transform:"translateX(-50%)",
          zIndex:30,
        }}>
          <div style={{ position:"relative", width:AVT_SIZE, height:AVT_SIZE }}>
            {/* Weißer Ring */}
            <div style={{
              position:"absolute", inset:-4, borderRadius:"50%",
              background:"white",
              boxShadow:"0 4px 20px rgba(0,0,0,0.15)",
            }}/>
            {/* Teal-Ring innen */}
            <div style={{
              position:"absolute", inset:-2, borderRadius:"50%",
              background:`conic-gradient(from 0deg,${T.teal},rgba(14,196,184,0.4),${T.teal})`,
              opacity:0.9,
            }}/>
            {/* Avatar-Bild */}
            <div style={{
              position:"relative", width:AVT_SIZE, height:AVT_SIZE,
              borderRadius:"50%", overflow:"hidden",
              border:"3px solid white",
              background:T.bg,
            }}>
              {!avLoaded && (
                <div className="mbp-skeleton" style={{position:"absolute",inset:0,borderRadius:"50%"}}/>
              )}
              <img
                src={avatar} alt={name}
                onLoad={()=>setAvLoaded(true)}
                onError={()=>setAvLoaded(true)}
                style={{
                  width:"100%", height:"100%", objectFit:"cover",
                  opacity:avLoaded ? 1 : 0, transition:"opacity .5s ease",
                }}
              />
            </div>
            {/* Kamera-Icon auf Avatar */}
            <label style={{
              position:"absolute", bottom:2, right:2,
              width:26, height:26, borderRadius:"50%",
              background: avatarUploading ? "rgba(26,26,24,0.5)" : T.teal,
              border:"2px solid white",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:12, cursor:"pointer", touchAction:"manipulation",
              boxShadow:"0 2px 8px rgba(14,196,184,0.35)",
              zIndex:40,
            }}>
              <input ref={avatarInputRef} type="file" accept="image/*"
                style={{ display:"none" }} onChange={handleAvatarFile} />
              {avatarUploading ? "⏳" : "📷"}
            </label>
          </div>
        </div>

      </div>{/* /cover */}

      {/* ── Name + Badge — zentriert, unterhalb Avatar ──────── */}
      {/* paddingTop = Avatar-Hälfte (45px) + 12px Luft */}
      <div style={{
        paddingTop: (AVT_SIZE / 2) + 14,
        textAlign:"center",
        paddingBottom:4,
      }}>
        <div style={{
          fontSize:22, fontWeight:900, color:T.ink,
          letterSpacing:"-0.03em", lineHeight:1.2,
        }}>
          {profile?.display_name || profile?.username || "–"}
        </div>
        {profile?.username && (
          <div style={{ fontSize:12, color:T.inkFaint, marginTop:3, fontWeight:400 }}>
            @{profile.username}
          </div>
        )}
        {/* Badge */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:5,
          marginTop:8,
          background: profile?.is_talent ? "rgba(14,196,184,0.09)" : "rgba(14,196,184,0.07)",
          border:`1px solid ${profile?.is_talent ? "rgba(14,196,184,0.25)" : "rgba(14,196,184,0.15)"}`,
          borderRadius:99, padding:"4px 12px",
          fontSize:11, fontWeight:700, color:"#0AADA3",
        }}>
          <span>{profile?.is_talent ? "✨" : "🌿"}</span>
          <span>{profile?.is_talent ? "HUI-Talent" : "HUI-Mitglied"}</span>
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
        const url = await uploadProfileImage(file, user.id, "moments");
        newItems.push({ id: `m_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, img: url });
      }
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

// ══════════════════════════════════════════════════════════════
// BIO EDIT MODAL — "Über mich" bearbeiten
// ══════════════════════════════════════════════════════════════
const MAX_BIO = 500;
function BioEditModal({ bio = "", onClose = () => {}, onSave = () => {} }) {
  const [draft,  setDraft]  = useState(bio);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    await onSave?.(draft.trim());
    setSaving(false);
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position:"fixed", inset:0, zIndex:10300,
        background:"rgba(0,0,0,0.45)",
        display:"flex", alignItems:"flex-end", justifyContent:"center",
      }}
    >
      <div style={{
        width:"100%", maxWidth:520,
        background:"#FFFFFF", borderRadius:"20px 20px 0 0",
        padding:"20px 20px 88px", /* oberhalb Navbar */
        boxShadow:"0 -4px 24px rgba(0,0,0,0.12)",
      }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <span style={{ fontSize:16, fontWeight:800, color:"#1A1A18" }}>
            Über mich bearbeiten
          </span>
          <button
            onClick={() => onClose?.()}
            style={{
              width:30, height:30, borderRadius:"50%",
              background:"rgba(26,26,24,0.07)", border:"none",
              fontSize:14, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}
          >✕</button>
        </div>

        {/* Textarea */}
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value.slice(0, MAX_BIO))}
          autoFocus
          placeholder="Erzähl etwas über dich…"
          rows={5}
          style={{
            width:"100%", boxSizing:"border-box",
            padding:"12px 14px", borderRadius:12,
            border:"1.5px solid rgba(14,196,184,0.35)",
            fontSize:14, lineHeight:1.65, color:"#1A1A18",
            fontFamily:"inherit", resize:"none", outline:"none",
            background:"rgba(14,196,184,0.04)",
          }}
        />
        <div style={{ fontSize:11, color:"#888", textAlign:"right", marginTop:4 }}>
          {draft.length} / {MAX_BIO}
        </div>

        {/* Speichern */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width:"100%", marginTop:14, padding:"13px",
            borderRadius:99, background:"#0EC4B8", border:"none",
            color:"white", fontSize:14, fontWeight:700,
            cursor: saving ? "default" : "pointer",
            fontFamily:"inherit", opacity: saving ? 0.7 : 1,
            touchAction:"manipulation",
          }}
        >
          {saving ? "Speichert…" : "Speichern"}
        </button>
      </div>
    </div>
  );
}

export default function MyBasisProfile({ onClose, profileId }) {
  // AuthContext: eigenen Profile-Cache nach Uploads aktualisieren
  const _auth = useAuth() || {};
  const user            = _auth.user   ?? null;          // Sprint F.7D: user für useProfileData
  const setAuthProfile  = _auth.setProfile ?? null;
  const refreshProfile  = _auth.refreshProfile ?? null;
  // Sprint F.7D Phase 1: profile + loading aus useProfileData (Hook oben)
  // const [profile, setProfile] — ENTFERNT: kommt aus useProfileData
  // const [loading, setLoading] — ENTFERNT: kommt aus useProfileData
  // Für Kompatibilität mit setProfile-Calls die noch existieren:
  const [_profileOverride, _setProfileOverride] = useState(null); // Phase 2: alle setProfile-Calls → reload()
  const [bio,        setBio]        = useState("");
  const [showBioEdit, setShowBioEdit] = useState(false);

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
  const [showStudio,        setShowStudio]        = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // ── Notification Action Routing ───────────────────────────────────────────
  const {
    openProfileById   = () => {},
    switchTab         = () => {},
    setChatRecipient  = () => {},
    setShowChat       = () => {},
    setShowWerkDetail = () => {},
  } = useHome?.() || {};

  const handleNotifAction = (n) => {
    // 1. action_url hat Vorrang
    if (n.action_url) {
      setShowNotifications(false);
      // Intern-Routing via Typ trotzdem ausführen für nahtlose UX
    }
    const meta = n.metadata || {};
    const targetId = meta.target_id || meta.actor_id || n.actor_id || null;
    const werkId   = meta.werk_id   || null;

    setShowNotifications(false); // Panel schließen

    switch (n.type) {
      // ── Profil öffnen ───────────────────────────────────────────────────
      case "follow":
      case "follow_request":
      case "new_follower":
        if (targetId) openProfileById(targetId);
        break;

      // ── Chat öffnen ─────────────────────────────────────────────────────
      case "begegnung":
      case "buchung":
      case "booking":
      case "message":
      case "new_message":
        if (targetId) { setChatRecipient(targetId); setShowChat(true); }
        break;

      // ── Tab-Navigation ──────────────────────────────────────────────────
      case "impact":
      case "project_update":
      case "impact_update":
        switchTab("impact");
        break;

      case "community":
      case "community_update":
        switchTab("discover");
        break;

      case "inspiration":
      case "discover":
        switchTab("discover");
        break;

      // ── Werk-Detail öffnen ──────────────────────────────────────────────
      case "work_approved":
        if (werkId) setShowWerkDetail(werkId);
        break;

      // ── Werk abgelehnt: Modal wird in NotifCard selbst geöffnet ─────────
      case "work_rejected":
      case "content_rejected":
        // Handled by NotifCard → RejectionModal (kein weiteres Routing nötig)
        break;

      // ── Admin / System: Detailansicht ───────────────────────────────────
      case "admin":
      case "admin_broadcast":
      case "system":
      case "info":
        // Kein spezifisches Routing — Panel bleibt offen für Lesbarkeit
        break;

      default:
        // Unbekannter Typ — nichts tun, Panel wurde bereits geschlossen
        break;
    }
  };
  const [unreadCount,       setUnreadCount]       = useState(0);
  const ambState = useAmbassador(profile);
  const [works,       setWorks]       = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [showWerkWizard, setShowWerkWizard] = useState(false);
  const [showExpWizard,  setShowExpWizard]  = useState(false);
  const [editingWerk,   setEditingWerk]   = useState(null);
  const [editingExp,    setEditingExp]    = useState(null);

  // ── Sprint F.7D: Einheitliche Datenpipeline via useProfileData ──────────
  // Ersetzt: eigenen Profil-Loader useEffect (Zeilen ~962-1003)
  // Beibehaltung: Realtime-Listener für works+experiences (Regel 1)
  const {
    profile,
    works:      hooksWorks,
    experiences: hooksExps,
    recommendations: hooksRecs,
    moments:    hooksMoments,
    loading:    hookLoading,  // Phase 2: lokale [loading] States werden danach entfernt
    reload,
  } = useProfileData(user?.id);


  // Sprint F.7D: Profil-Loader entfernt — useProfileData(user?.id) übernimmt
  // Alte lokale States (profile, loading) werden durch Hook-Werte ersetzt (Phase 2)
  // dna_tags → hooksMoments bereits normalisiert durch useProfileData
  // skills → profile.skills direkt aus useProfileData
  // is_available → profile.is_available direkt aus useProfileData

  // ── Sprint F.7D: Realtime-Listener (Regel 1: beibehalten, nutzt reload()) ──
  // loadWorksAndExps() entfernt — useProfileData lädt works+experiences
  // reload() triggert useProfileData neu → Realtime-Events bleiben wirksam
  useEffect(() => {
    if (!profile?.id) return;
    let channel;

    // Realtime: wenn Admin Status ändert → useProfileData neu laden
    channel = supabase
      .channel("mbp:works-exps:" + profile.id)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "works",
        filter: "user_id=eq." + profile.id,
      }, () => reload())
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "experiences",
        filter: "user_id=eq." + profile.id,
      }, () => reload())
      // Admin Hard-Delete → sofort neu laden
      .on("postgres_changes", {
        event: "DELETE", schema: "public", table: "experiences",
      }, () => reload())
      .on("postgres_changes", {
        event: "DELETE", schema: "public", table: "projects",
      }, () => reload())
      .subscribe();

    return () => { if (channel) supabase.removeChannel(channel); };
  }, [profile?.id, reload]);

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
    autoSave("dna_tags", urls);
  };

  const handleVisibilityChange = (v) => {
    setVisibility(v);
    // Persistenz via focus_type-Spalte (TEXT, existiert in profiles)
    autoSave("focus_type", v);
  };

  const handleOpenForChange = (v) => {
    setOpenFor(v);
    // Sprint F.3A: Verfügbarkeit in profiles.is_available persistieren
    // v.length > 0 = verfügbar (true), [] = ausgelastet (false)
    autoSave("is_available", v.length > 0);
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

  // CSS sofort in <head> injizieren — Safari-safe, kein Blink beim Lazy-Load
  useEffect(() => {
    const id = "__mbp_styles__";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = CSS;
      document.head.appendChild(el);
    }
    return () => {
      // Style bleibt — kein Flicker bei re-mount
    };
  }, []);


  // Sofort sichtbarer Spinner während Profil lädt — kein weißer Screen
  if (loading) {
    return (
      <div style={{
        position:"fixed", inset:0, zIndex:9500,
        background:T.bg,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <div style={{
          width:36, height:36, borderRadius:"50%",
          border:"3px solid rgba(14,196,184,0.15)",
          borderTop:"3px solid #0EC4B8",
          animation:"spin .8s linear infinite",
        }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div className="mbp-root" style={{
      position:"fixed", inset:0, zIndex:9500,
      display:"flex", flexDirection:"column",
    }}>

      
{/* styles via head-inject — siehe useEffect */}

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

        {/* ── SEITEN-TITEL ─────────────────────────────────────── */}
        <div style={{
          padding:`max(52px,calc(48px + env(safe-area-inset-top,0px))) ${T.px}px 0`,
          display:"flex", justifyContent:"space-between", alignItems:"flex-start",
        }}>
          <div>
            <div style={{ fontSize:24, fontWeight:900, color:T.ink, letterSpacing:"-0.04em",
              lineHeight:1.15 }}>
              {profile?.is_talent ? "Mein Talent-Profil ✨" : "Mein Profil 🌿"}
            </div>
            <div style={{ fontSize:12, color:T.inkFaint, marginTop:2, fontWeight:400 }}>
              {profile?.is_talent
                ? "Gestalte dein Talent-Profil, wie es dich und dein Wirken zeigt."
                : "Gestalte dein Profil so, wie du bist."}
            </div>
          </div>
          {/* Zahnrad */}
          <button className="mbp-press-light" onClick={() => setShowStudio(true)} style={{
            width:34, height:34, borderRadius:"50%",
            background:"rgba(26,26,24,0.06)", border:`1px solid ${T.border}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, cursor:"pointer", touchAction:"manipulation",
            flexShrink:0, marginTop:2,
          }}>⚙️</button>
        </div>
        <Gap h={12}/>

        {/* ── HEADER — Cover + Avatar + Name ───────────────── */}
        <MeinProfilHeader
          profile={{
            ...profile,
            avatar_url: localAvatar || profile?.avatar_url,
            header_img: localCover  || profile?.header_img,
          }}
          isTalentView={!!profile?.is_talent}
          onSettings={() => setShowSettings(true)}
          onBell={() => setShowNotifications(v => !v)}
          onStudio={() => setShowStudio(true)}
          unreadCount={unreadCount}
          onAvatarChange={handleAvatarChange}
          onCoverChange={handleCoverChange}
        />
        <Gap h={28}/>

        {/* ══ TALENT-PROFIL-LAYOUT (is_talent === true) ══════════ */}
        {profile?.is_talent ? (
          <>
            {/* T1. Über mich */}
            <UeberDich bio={bio} onChange={handleBioChange}/>
            <Gap h={24}/>

            {/* T2. Meine Talente & Angebote */}
            <MeineTalenteSection
              skills={interests}
              onChange={handleInterestsChange}
            />
            <Gap h={24}/>

            {/* T3. Meine Werke */}
            <MeineWerkeSection
              userId={profile?.id}
              works={works}
              onWerkWizard={(w) => { setEditingWerk(w || null); setShowWerkWizard(true); }}
              onDeleteWerk={(id) => setWorks(prev => prev.filter(w => w.id !== id))}
            />
            <Gap h={24}/>

            {/* T4. Erlebnisse & Projekte */}
            <ErlebnisseSection
              experiences={experiences}
              onErlebnisWizard={(exp) => { setEditingExp(exp || null); setShowExpWizard(true); }}
              onDeleteErlebnis={(id) => setExperiences(prev => prev.filter(e => e.id !== id))}
            />
            <Gap h={24}/>

            {/* T5. Kundenstimmen */}
            <KundenstimmenSection
              recommendations={recommendations}
              onEdit={() => {}}
            />
            <Gap h={24}/>

            {/* T6. Verfügbarkeit + Standort */}
            <VerfuegbarkeitStandortRow
              profile={profile}
              onSave={(upd) => {
                // Sprint F.3A.1: is_available + location beide über diesen Handler
                setProfile(p => ({ ...p, ...upd }));
                setAuthProfile(p => p ? { ...p, ...upd } : p);
                const uid = profile?.id;
                if (uid) supabase.from("profiles")
                  .update({ ...upd, updated_at: new Date().toISOString() })
                  .eq("id", uid).then(({error}) => {
                    if (error) console.error("VerfügbarkeitStandort save:", error.message);
                  });
              }}
            />
            <Gap h={24}/>

            {/* T7. Sichtbarkeit */}
            <SichtbarkeitSection visibility={visibility} onChange={handleVisibilityChange}/>
            <Gap h={40}/>
          </>
        ) : (
          <>
            {/* ══ BASIS-PROFIL-LAYOUT ══════════════════════════════ */}
            {/* B1. Über dich */}
            <UeberDich bio={bio} onChange={handleBioChange}/>
            <Gap h={24}/>

            {/* B2. Interessen & Werte */}
            <InteressenSection interests={interests} onChange={handleInterestsChange}/>
            <Gap h={24}/>

            {/* B3. Momente */}
            <MomenteSection moments={moments} onChange={handleMomentsChange}/>
            <Gap h={24}/>

            {/* B4. Offen für Begegnungen */}
            <OffenFuerSection openFor={openFor} onChange={handleOpenForChange}/>
            <Gap h={24}/>

            {/* B5. Sichtbarkeit */}
            <SichtbarkeitSection visibility={visibility} onChange={handleVisibilityChange}/>
            <Gap h={28}/>

            {/* B6. Ambassador-Banner */}
            <AmbassadorBanner
              profile={profile}
              ambState={ambState}
              onApply={() => setShowAmbModal(true)}
            />
            <Gap h={40}/>
          </>
        )}
      </div>

      {/* GEMEINSCHAFT FLOW MODAL */}
      {showGemeinschaft && (
        <GemeinschaftsFlow
          onClose={() => setShowGemeinschaft(false)}
          onComplete={() => {
            setShowGemeinschaft(false);
            // Lokalen State sofort patchen → TalentErweiterung erscheint ohne Reload
            setProfile(p => p ? { ...p, is_talent: true, talent_since: new Date().toISOString() } : p);
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

      {/* HUI STUDIO MODAL */}
      {showStudio && (
        <HuiStudio
          profile={profile}
          onClose={() => setShowStudio(false)}
          onProfileUpdate={(upd) => {
            setProfile(p => ({ ...p, ...upd }));
            setAuthProfile && setAuthProfile(p => ({ ...p, ...upd }));
            refreshProfile?.().catch(() => {});
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

      {/* NOTIFICATION PANEL */}
      {showNotifications && profile?.id && (
        <NotificationPanel
          userId={profile.id}
          onClose={() => setShowNotifications(false)}
          onUnreadChange={setUnreadCount}
          onAction={handleNotifAction}
        />
      )}

      {/* ══ BIO BEARBEITEN MODAL ══════════════════════════════════════ */}
      {showBioEdit && (
        <BioEditModal
          bio={bio}
          onClose={() => setShowBioEdit(false)}
          onSave={async (newBio) => {
            setBio(newBio);
            setShowBioEdit(false);
            try {
              await supabase
                .from("profiles")
                .update({ bio: newBio })
                .eq("id", profile?.id);
            } catch(e) { console.error("Bio save:", e); }
          }}
        />
      )}

      {/* WERK WIZARD */}
      {showWerkWizard && profile?.id && (
        <WerkWizard
          userId={profile.id}
          existingWork={editingWerk}
          onClose={() => { setShowWerkWizard(false); setEditingWerk(null); }}
          onSaved={(werk) => {
            setShowWerkWizard(false); setEditingWerk(null);
            setWorks(prev => {
              const idx = prev.findIndex(w => w.id === werk.id);
              if (idx >= 0) { const n=[...prev]; n[idx]=werk; return n; }
              return [werk, ...prev];
            });
          }}
        />
      )}

      {/* EXPERIENCE WIZARD */}
      {showExpWizard && profile?.id && (
        <ExperienceWizard
          userId={profile.id}
          existingExp={editingExp}
          onClose={() => { setShowExpWizard(false); setEditingExp(null); }}
          onSaved={(exp) => {
            setShowExpWizard(false); setEditingExp(null);
            setExperiences(prev => {
              const idx = prev.findIndex(e => e.id === exp.id);
              if (idx >= 0) { const n=[...prev]; n[idx]=exp; return n; }
              return [exp, ...prev];
            });
          }}
        />
      )}
    </div>
  );
}



// ══════════════════════════════════════════════════════════════
// AMBASSADOR-PROFIL-SEKTION
// Zeigt Status, Einladungslink, Empfehlungen
// ══════════════════════════════════════════════════════════════
function AmbassadorProfilSection({ profile, ambState, onApply }) {
  const T2 = {
    teal:"#0EC4B8", tealSoft:"rgba(14,196,184,0.08)",
    tealMid:"rgba(14,196,184,0.2)", ink:"#1A1A18",
    inkSoft:"#555552", inkFaint:"#888885",
    bgCard:"#FFFFFF", border:"rgba(26,26,24,0.09)",
    r16:"12px", r12:"10px", r99:"99px", card:"0 1px 4px rgba(0,0,0,0.06)",
  };

  const isAmb      = profile?.is_ambassador === true;
  const status     = ambState?.applicationStatus;
  const hasPending = status === 'offen' || status === 'pending';
  const isRejected = status === 'abgelehnt' || status === 'rejected';
  const ref_link   = profile?.profile_modules?.ambassador?.referral_link || null;
  const ref_code   = profile?.profile_modules?.ambassador?.referral_code || null;
  const refCount   = profile?.profile_modules?.ambassador?.referral_count || 0;

  function copyLink() {
    if (ref_link) {
      navigator.clipboard.writeText(ref_link).catch(() => {});
    }
  }

  // Nicht-Ambassador: CTA anzeigen
  if (!isAmb) {
    return (
      <div style={{ padding:"0 20px" }}>
        <div style={{
          background:T2.bgCard, borderRadius:T2.r16,
          border:`1px solid ${T2.border}`, padding:"18px",
          boxShadow:T2.card,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <span style={{fontSize:18}}>🌟</span>
            <span style={{fontSize:14, fontWeight:800, color:T2.ink}}>Ambassador werden</span>
          </div>
          <div style={{fontSize:13, color:T2.inkSoft, lineHeight:1.6, marginBottom:14}}>
            Als Ambassador empfiehlst du HUI weiter und verdienst mit jedem aktiven Mitglied, das du eingeladen hast.
          </div>
          {hasPending && (
            <div style={{
              background:"rgba(255,193,7,0.1)", borderRadius:T2.r12,
              border:"1px solid rgba(255,193,7,0.3)", padding:"10px 14px",
              fontSize:12, color:"#B8860B", fontWeight:600, marginBottom:10,
            }}>
              ⏳ Deine Bewerbung wird geprüft
            </div>
          )}
          {isRejected && (
            <div style={{
              background:"rgba(255,99,71,0.08)", borderRadius:T2.r12,
              border:"1px solid rgba(255,99,71,0.2)", padding:"10px 14px",
              fontSize:12, color:"#cc4433", fontWeight:600, marginBottom:10,
            }}>
              ❌ Bewerbung abgelehnt
            </div>
          )}
          {!hasPending && !isRejected && (
            <button onClick={onApply} style={{
              padding:"10px 20px", borderRadius:T2.r99,
              background:T2.teal, border:"none", color:"white",
              fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
              touchAction:"manipulation",
            }}>
              Jetzt bewerben
            </button>
          )}
        </div>
      </div>
    );
  }

  // Aktiver Ambassador: Dashboard
  return (
    <div style={{ padding:"0 20px" }}>
      {/* Status-Badge */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <SectionRow title="Ambassador" />
        <div style={{
          display:"inline-flex", alignItems:"center", gap:5,
          background:"rgba(14,196,184,0.08)", borderRadius:T2.r99,
          border:`1px solid ${T2.tealMid}`, padding:"3px 10px",
          fontSize:11, fontWeight:700, color:T2.teal,
        }}>
          ✅ Aktiv
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display:"grid", gridTemplateColumns:"1fr 1fr",
        gap:10, marginBottom:14,
      }}>
        {[
          { emoji:"👥", label:"Eingeladene", value: refCount },
          { emoji:"🥉", label:"Level", value: refCount >= 201 ? "Platin" : refCount >= 51 ? "Gold" : refCount >= 11 ? "Silber" : "Bronze" },
        ].map(({ emoji, label, value }) => (
          <div key={label} style={{
            background:T2.bgCard, borderRadius:T2.r12,
            border:`1px solid ${T2.border}`, padding:"12px",
            textAlign:"center", boxShadow:T2.card,
          }}>
            <div style={{fontSize:20, marginBottom:4}}>{emoji}</div>
            <div style={{fontSize:18, fontWeight:800, color:T2.teal}}>{value}</div>
            <div style={{fontSize:11, color:T2.inkFaint}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Einladungslink */}
      {ref_link && (
        <div style={{
          background:T2.tealSoft, borderRadius:T2.r12,
          border:`1px solid ${T2.tealMid}`, padding:"12px 14px",
          marginBottom:10,
        }}>
          <div style={{fontSize:11, fontWeight:700, color:T2.teal, marginBottom:4}}>
            🔗 Dein Einladungslink
          </div>
          <div style={{
            fontSize:12, color:T2.inkSoft, fontFamily:"monospace",
            wordBreak:"break-all", marginBottom:8,
          }}>
            {ref_link}
          </div>
          <button onClick={copyLink} style={{
            padding:"6px 14px", borderRadius:T2.r99,
            background:T2.teal, border:"none", color:"white",
            fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            touchAction:"manipulation",
          }}>
            Link kopieren
          </button>
        </div>
      )}


    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TALENT-ERWEITERUNG
// Sichtbar wenn profiles.is_talent = true
// Zeigt 6 Schritte + Meine Werke + Meine Erlebnisse
// Basiert auf DEMSELBEN Profil — kein neues Profil
// ══════════════════════════════════════════════════════════════
function TalentErweiterung({ profile, onProfileUpdate }) {


  return (
    <div style={{ padding: "0 20px" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0EC4B8 0%, #00A8A0 100%)",
        borderRadius: T.r16,
        padding: "20px",
        marginBottom: 20,
        color: "#fff",
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          🌱 Du bist Teil der Gemeinschaft
        </div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          Gestalte dein Profil und werde sichtbar.
        </div>
      </div>


      {/* Meine Werke */}
      <div style={{ fontSize: 13, fontWeight: 700, color: T.inkSoft, marginBottom: 12, letterSpacing: "0.05em" }}>
        MEINE WERKE
      </div>
      <div style={{
        background: T.bgCard, borderRadius: T.r16,
        border: `1px solid ${T.border}`, padding: "16px",
        boxShadow: T.card, marginBottom: 20,
      }}>
        <div style={{ fontSize: 13, color: T.inkFaint, lineHeight: 1.65 }}>
          Noch keine Werke hinzugefügt. Teile deine Projekte, Ideen und Leistungen mit der Gemeinschaft.
        </div>
        <button style={{
          marginTop: 12, padding: "8px 16px", borderRadius: 99,
          background: "#0EC4B8", border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: 700, color: "#fff",
        }}>
          + Werk hinzufügen
        </button>
      </div>

      {/* Meine Erlebnisse */}
      <div style={{ fontSize: 13, fontWeight: 700, color: T.inkSoft, marginBottom: 12, letterSpacing: "0.05em" }}>
        MEINE ERLEBNISSE
      </div>
      <div style={{
        background: T.bgCard, borderRadius: T.r16,
        border: `1px solid ${T.border}`, padding: "16px",
        boxShadow: T.card,
      }}>
        <div style={{ fontSize: 13, color: T.inkFaint, lineHeight: 1.65 }}>
          Noch keine Erlebnisse hinzugefügt. Berichte von echten Begegnungen und Erfahrungen.
        </div>
        <button style={{
          marginTop: 12, padding: "8px 16px", borderRadius: 99,
          background: "#0EC4B8", border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: 700, color: "#fff",
        }}>
          + Erlebnis hinzufügen
        </button>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// AMBASSADOR BANNER — Screenshot-genau unten im Profil
// Kompakter Banner mit Bild + Text + Button
// ══════════════════════════════════════════════════════════════
function AmbassadorBanner({ profile, ambState, onApply }) {
  const isAmb     = profile?.is_ambassador === true;
  const isPending = ambState?.isPending || ambState?.applicationStatus === "offen"
                    || ambState?.applicationStatus === "pending";
  if (isAmb) return null; // Aktive Ambassadors brauchen keinen CTA

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <div style={{
        background:T.bgCard,
        borderRadius:T.r20,
        border:`1px solid ${T.border}`,
        boxShadow:T.card,
        padding:"16px 18px",
        display:"flex", alignItems:"center", gap:14,
      }}>
        {/* Münz-Icon */}
        <div style={{
          width:44, height:44, borderRadius:T.r12, flexShrink:0,
          background:"linear-gradient(135deg,rgba(255,193,7,0.15),rgba(255,193,7,0.08))",
          border:"1.5px solid rgba(255,193,7,0.25)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:22,
        }}>
          🏅
        </div>

        {/* Text */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:800, color:T.ink, marginBottom:2 }}>
            Ambassador werden
          </div>
          <div style={{ fontSize:12, color:T.inkSoft, lineHeight:1.45 }}>
            Teile HUI mit anderen und unterstütze das Wachstum der Gemeinschaft.
          </div>
          {isPending && (
            <div style={{
              marginTop:6, fontSize:11.5, fontWeight:600,
              color:"#B8860B",
            }}>
              ⏳ Bewerbung wird geprüft
            </div>
          )}
        </div>

        {/* Button */}
        {!isPending && (
          <button
            onClick={onApply}
            className="mbp-press"
            style={{
              flexShrink:0,
              padding:"10px 16px", borderRadius:T.r99,
              background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,
              border:"none", color:"white",
              fontSize:12.5, fontWeight:700,
              cursor:"pointer", touchAction:"manipulation",
              fontFamily:"inherit",
              whiteSpace:"nowrap",
              boxShadow:T.glowTeal,
            }}
          >
            Jetzt anmelden ›
          </button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TALENT-PROFIL SEKTIONEN (is_talent === true)
// ══════════════════════════════════════════════════════════════

const TALENT_KATEGORIEN = [
  {icon:"🎨", label:"Malerei"},      {icon:"✏️", label:"Illustration"},
  {icon:"📸", label:"Fotografie"},   {icon:"🎵", label:"Musik"},
  {icon:"🎤", label:"Gesang"},       {icon:"🪡", label:"Handwerk"},
  {icon:"💻", label:"Programmierung"},{icon:"📐", label:"Design"},
  {icon:"📚", label:"Bildung"},      {icon:"🎭", label:"Theater"},
  {icon:"🧘", label:"Coaching"},     {icon:"🌿", label:"Naturführung"},
  {icon:"🍳", label:"Kochen"},       {icon:"🎬", label:"Film"},
  {icon:"✍️", label:"Schreiben"},   {icon:"🏺", label:"Töpfern"},
  {icon:"🎸", label:"Workshops"},    {icon:"⭐", label:"Kunstberatung"},
  {icon:"🖼️", label:"Auftragskunst"},{icon:"🎁", label:"Weitere Angebote"},
];

function MeineTalenteSection({ skills, onChange }) {
  const [showEdit, setShowEdit] = React.useState(false);
  const current = Array.isArray(skills) ? skills : [];
  const toggle = (label) => {
    if (current.includes(label)) onChange(current.filter(x => x !== label));
    else onChange([...current, label]);
  };
  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <SectionRow title="Meine Talente & Angebote" onEdit={() => setShowEdit(true)}/>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {current.length === 0 && (
          <div style={{ fontSize:13, color:T.inkFaint, fontStyle:"italic", marginBottom:4 }}>
            Noch keine Talente hinzugefügt.
          </div>
        )}
        {current.map((label, i) => {
          const cat = TALENT_KATEGORIEN.find(c => c.label === label);
          return (
            <div key={i} style={{
              display:"inline-flex", alignItems:"center", gap:6,
              padding:"8px 14px", borderRadius:T.r99,
              background:T.bgCard, border:`1.5px solid ${T.tealMid}`,
              fontSize:13, fontWeight:600, color:T.ink, boxShadow:T.card,
            }}>
              {cat && <span style={{fontSize:13}}>{cat.icon}</span>}
              {label}
            </div>
          );
        })}
        <button className="mbp-press-light" onClick={() => setShowEdit(true)} style={{
          display:"inline-flex", alignItems:"center", gap:6,
          padding:"8px 14px", borderRadius:T.r99,
          background:"transparent", border:`1.5px dashed ${T.borderMid}`,
          fontSize:13, fontWeight:600, color:T.inkSoft,
          cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
        }}>
          <span style={{fontSize:14}}>+</span> Weiteres hinzufügen
        </button>
      </div>
      {showEdit && (
        <Sheet onClose={() => setShowEdit(false)}>
          <div style={{ fontSize:16, fontWeight:800, color:T.ink, marginBottom:4 }}>
            Meine Talente & Angebote
          </div>
          <div style={{ fontSize:12, color:T.inkFaint, marginBottom:16 }}>Was kannst du?</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
            {TALENT_KATEGORIEN.map((t, i) => (
              <InterestPill key={i} icon={t.icon} label={t.label}
                active={current.includes(t.label)} onToggle={() => toggle(t.label)}/>
            ))}
          </div>
          <button className="mbp-press" onClick={() => setShowEdit(false)} style={{
            width:"100%", padding:"14px", borderRadius:T.r99, border:"none",
            background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,
            color:"white", fontSize:15, fontWeight:700,
            cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
          }}>Fertig</button>
        </Sheet>
      )}
    </div>
  );
}

function DeleteWerkConfirm({ werk, onConfirm, onCancel }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9999,
      background:"rgba(0,0,0,0.55)", display:"flex",
      alignItems:"center", justifyContent:"center", padding:"24px",
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"#fff", borderRadius:16, padding:"24px 20px 20px",
        maxWidth:320, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
      }}>
        <div style={{ fontSize:36, textAlign:"center", marginBottom:8 }}>🗑️</div>
        <div style={{ fontSize:16, fontWeight:700, textAlign:"center", marginBottom:6, color:"#1a1a18" }}>
          Werk unwiderruflich löschen?
        </div>
        <div style={{ fontSize:13, color:"#666", textAlign:"center", lineHeight:1.5, marginBottom:20 }}>
          <strong>„{werk.title || 'Dieses Werk'}"</strong> wird dauerhaft gelöscht und kann nicht wiederhergestellt werden.
        </div>
        <button onClick={onConfirm} style={{
          width:"100%", padding:"12px", borderRadius:99,
          background:"#ff3b3b", border:"none", color:"#fff",
          fontSize:14, fontWeight:700, cursor:"pointer",
          fontFamily:"inherit", marginBottom:8,
        }}>
          Ja, endgültig löschen
        </button>
        <button onClick={onCancel} style={{
          width:"100%", padding:"12px", borderRadius:99,
          background:"#f0f0ee", border:"none", color:"#444",
          fontSize:14, fontWeight:600, cursor:"pointer",
          fontFamily:"inherit",
        }}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function MeineWerkeSection({ works, onWerkWizard, onDeleteWerk = () => {} }) {
  const [confirmWork, setConfirmWork] = React.useState(null);

  const handleDeleteClick = (e, w) => {
    e.stopPropagation();
    setConfirmWork(w);
  };

  const handleConfirmDelete = async () => {
    const w = confirmWork;
    setConfirmWork(null);
    if (!w?.id) return;
    try {
      await supabase.from("works").update({ status: "deleted", visibility: "private" }).eq("id", w.id);
      onDeleteWerk(w.id);
    } catch(e) { console.error("Werk löschen:", e); }
  };

  return (
    <>
    {confirmWork && (
      <DeleteWerkConfirm
        werk={confirmWork}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmWork(null)}
      />
    )}
    <div style={{ padding:`0 ${T.px}px` }}>
      <SectionRow title="Meine Werke" onEdit={() => onWerkWizard?.()}/>
      {works.length > 0 && (
        <div style={{ display:"flex", gap:10, overflowX:"auto",
          WebkitOverflowScrolling:"touch", scrollbarWidth:"none",
          paddingBottom:4, marginBottom:10 }}>
          {works.map((w, i) => {
            const isApproved = w.approval_status === "approved";
            const isPending  = w.approval_status === "pending" || w.status === "pending_review";
            const badgeBg    = isApproved ? "rgba(14,196,184,0.92)" : isPending ? "rgba(234,179,8,0.92)" : "rgba(255,80,80,0.92)";
            const badgeText  = isApproved ? "✅ Live" : isPending ? "⏳ Prüfung" : "❌ Abgelehnt";
            return (
              <div key={w.id || i}
                onClick={() => onWerkWizard?.(w)}
                style={{
                  flexShrink:0, width:110, height:110,
                  borderRadius:T.r12, overflow:"hidden",
                  background:"#e8e4de", position:"relative", cursor:"pointer",
                  boxShadow: isApproved ? "0 0 0 2px #0EC4B8" : isPending ? "0 0 0 2px #D4A800" : "0 0 0 2px #ff5050",
                }}>
                {w.cover_url
                  ? <img src={w.cover_url} alt={w.title||""}
                      style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : <div style={{ width:"100%", height:"100%", display:"flex",
                      alignItems:"center", justifyContent:"center", fontSize:24 }}>🎨</div>
                }
                {/* X-Löschen-Button oben rechts */}
                <button
                  onClick={(e) => handleDeleteClick(e, w)}
                  style={{
                    position:"absolute", top:4, right:4,
                    width:20, height:20, borderRadius:"50%",
                    background:"rgba(0,0,0,0.65)", border:"none",
                    color:"#fff", fontSize:11, fontWeight:700,
                    cursor:"pointer", display:"flex",
                    alignItems:"center", justifyContent:"center",
                    lineHeight:1, padding:0, zIndex:2,
                  }}
                >✕</button>
                {/* Status-Badge */}
                <div style={{
                  position:"absolute", bottom:0, left:0, right:0,
                  background: badgeBg, backdropFilter:"blur(4px)",
                  fontSize:9, fontWeight:700, color:"#fff",
                  padding:"3px 5px", textAlign:"center", letterSpacing:"0.3px",
                }}>
                  {badgeText}
                </div>
                {/* Titel */}
                {w.title && (
                  <div style={{
                    position:"absolute", top:0, left:0, right:0,
                    background:"rgba(0,0,0,0.45)", fontSize:9, color:"#fff",
                    padding:"3px 22px 3px 5px", whiteSpace:"nowrap",
                    overflow:"hidden", textOverflow:"ellipsis",
                  }}>
                    {w.title}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <button className="mbp-press-light" onClick={() => onWerkWizard?.()} style={{
        display:"flex", alignItems:"center", gap:8,
        padding:"10px 16px", borderRadius:T.r12,
        background:T.bgCard, border:`1.5px dashed ${T.borderMid}`,
        fontSize:13, fontWeight:600, color:T.inkSoft,
        cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
        width:"100%",
      }}>
        <span style={{fontSize:16}}>+</span>
        Werk hinzufügen
      </button>
    </div>
    </>
  );
}

function ErlebnisseSection({ experiences, onErlebnisWizard, onDeleteErlebnis = () => {} }) {
  const [confirmExp, setConfirmExp] = React.useState(null);

  const handleDeleteClick = (e, exp) => {
    e.stopPropagation();
    setConfirmExp(exp);
  };

  const handleConfirmDelete = async () => {
    const exp = confirmExp;
    setConfirmExp(null);
    if (!exp?.id) return;
    try {
      const table = exp._source === "projects" ? "projects" : "experiences";
      // Hard-Delete: Zeile vollständig aus DB entfernen
      // → Realtime triggert Admin-Dashboard, Zeile verschwindet dort sofort
      const { error } = await supabase.from(table).delete().eq("id", exp.id);
      if (!error) {
        onDeleteErlebnis(exp.id);
      } else {
        console.error("Erlebnis löschen:", error);
        // Fallback: soft-delete wenn Hard-Delete nicht erlaubt (RLS)
        await supabase.from(table).update({ status: "deleted" }).eq("id", exp.id);
        onDeleteErlebnis(exp.id);
      }
    } catch(e) { console.error("Erlebnis löschen:", e); }
  };

  function fmtDate(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return "";
    return dt.toLocaleDateString("de-DE", { month:"short", year:"numeric" });
  }
  return (
    <>
    {confirmExp && (
      <div style={{
        position:"fixed", inset:0, zIndex:9999,
        background:"rgba(0,0,0,0.55)", display:"flex",
        alignItems:"center", justifyContent:"center", padding:"24px",
      }} onClick={() => setConfirmExp(null)}>
        <div onClick={e => e.stopPropagation()} style={{
          background:"#fff", borderRadius:16, padding:"24px 20px 20px",
          maxWidth:320, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
        }}>
          <div style={{ fontSize:36, textAlign:"center", marginBottom:8 }}>🗑️</div>
          <div style={{ fontSize:16, fontWeight:700, textAlign:"center", marginBottom:6, color:"#1a1a18" }}>
            Erlebnis unwiderruflich löschen?
          </div>
          <div style={{ fontSize:13, color:"#666", textAlign:"center", lineHeight:1.5, marginBottom:20 }}>
            <strong>„{confirmExp.title || 'Dieses Erlebnis'}"</strong> wird dauerhaft gelöscht und kann nicht wiederhergestellt werden.
          </div>
          <button onClick={handleConfirmDelete} style={{
            width:"100%", padding:"12px", borderRadius:99,
            background:"#ff3b3b", border:"none", color:"#fff",
            fontSize:14, fontWeight:700, cursor:"pointer",
            fontFamily:"inherit", marginBottom:8,
          }}>
            Ja, endgültig löschen
          </button>
          <button onClick={() => setConfirmExp(null)} style={{
            width:"100%", padding:"12px", borderRadius:99,
            background:"#f0f0ee", border:"none", color:"#444",
            fontSize:14, fontWeight:600, cursor:"pointer",
            fontFamily:"inherit",
          }}>
            Abbrechen
          </button>
        </div>
      </div>
    )}
    <div style={{ padding:`0 ${T.px}px` }}>
      <SectionRow title="Erlebnisse & Projekte"
        sub="Momente, die mein Wirken zeigen."
        onEdit={() => onErlebnisWizard?.()}/>
      <div style={{ display:"flex", gap:10, overflowX:"auto",
        WebkitOverflowScrolling:"touch", scrollbarWidth:"none", paddingBottom:4 }}>
        {experiences.map((exp, i) => {
          // ── Badge-System identisch zu Meine Werke ──────────────
          const isApproved = exp.approval_status === "approved" || exp.status === "published";
          const isPending  = !isApproved && (exp.approval_status === "pending" || exp.status === "pending_review" || exp.status === "pending");
          const isRejected = !isApproved && !isPending && (exp.approval_status === "rejected" || exp.status === "rejected");
          const badgeBg    = isApproved
            ? "rgba(14,196,184,0.92)"
            : isPending
              ? "rgba(234,179,8,0.92)"
              : isRejected
                ? "rgba(255,80,80,0.92)"
                : "rgba(14,196,184,0.92)";
          const badgeText  = isApproved
            ? "✅ Live"
            : isPending
              ? "⏳ Prüfung"
              : isRejected
                ? "❌ Abgelehnt"
                : "✅ Live";
          const borderCol  = isApproved ? "#0EC4B8" : isPending ? "#D4A800" : isRejected ? "#ff5050" : "#0EC4B8";
          return (
            <div key={exp.id || i}
              onClick={() => onErlebnisWizard?.(exp)}
              style={{
                flexShrink:0, width:110, height:110,
                borderRadius:T.r12, overflow:"hidden",
                background:"#e8e4de", position:"relative", cursor:"pointer",
                boxShadow: `0 0 0 2px ${borderCol}`,
              }}>
              {exp.cover_url
                ? <img src={exp.cover_url} alt={exp.title||""}
                    style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                : <div style={{ width:"100%", height:"100%", display:"flex",
                    alignItems:"center", justifyContent:"center", fontSize:24 }}>🎟</div>
              }
              {/* X-Löschen-Button oben rechts */}
              <button
                onClick={(e) => handleDeleteClick(e, exp)}
                style={{
                  position:"absolute", top:4, right:4,
                  width:20, height:20, borderRadius:"50%",
                  background:"rgba(0,0,0,0.65)", border:"none",
                  color:"#fff", fontSize:11, fontWeight:700,
                  cursor:"pointer", display:"flex",
                  alignItems:"center", justifyContent:"center",
                  lineHeight:1, padding:0, zIndex:2,
                }}
              >✕</button>
              {/* Status-Badge unten */}
              <div style={{
                position:"absolute", bottom:0, left:0, right:0,
                background: badgeBg, backdropFilter:"blur(4px)",
                fontSize:9, fontWeight:700, color:"#fff",
                padding:"3px 5px", textAlign:"center", letterSpacing:"0.3px",
              }}>
                {badgeText}
              </div>
              {/* Titel oben */}
              {exp.title && (
                <div style={{
                  position:"absolute", top:0, left:0, right:0,
                  background:"rgba(0,0,0,0.45)", fontSize:9, color:"#fff",
                  padding:"3px 22px 3px 5px", whiteSpace:"nowrap",
                  overflow:"hidden", textOverflow:"ellipsis",
                }}>
                  {exp.title}
                </div>
              )}
              {/* Ablehnungsgrund Overlay + "Anpassen"-CTA */}
              {isRejected && (
                <div style={{
                  position:"absolute", top:0, left:0, right:0, bottom:0,
                  background:"rgba(255,80,80,0.08)",
                  pointerEvents:"none",
                }}/>
              )}
              {/* Anpassen-Hinweis bei abgelehnten Erlebnissen */}
              {isRejected && (
                <div style={{
                  position:"absolute", top:"50%", left:0, right:0,
                  transform:"translateY(-50%)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  pointerEvents:"none",
                }}>
                  <span style={{
                    background:"rgba(0,0,0,0.72)", color:"#fff",
                    fontSize:8, fontWeight:700, padding:"2px 7px",
                    borderRadius:20, letterSpacing:"0.3px",
                  }}>✏️ Anpassen</span>
                </div>
              )}
            </div>
          );
        })}
        {/* Hinzufügen Button */}
        <div style={{ flexShrink:0, width:80 }}>
          <button className="mbp-press-light" onClick={() => onErlebnisWizard?.()} style={{
            width:80, height:110, borderRadius:T.r12,
            background:T.bgCard, border:`1.5px dashed ${T.borderMid}`,
            display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:4,
            cursor:"pointer", touchAction:"manipulation",
            fontFamily:"inherit",
          }}>
            <span style={{ fontSize:20, color:T.inkFaint }}>+</span>
          </button>
          <div style={{ fontSize:10.5, color:T.inkFaint, textAlign:"center", lineHeight:1.3, marginTop:6 }}>
            Erlebnis<br/>hinzufügen
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

function KundenstimmenSection({ recommendations, onEdit }) {
  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <SectionRow title="Kundenstimmen" onEdit={onEdit}/>
      <div style={{ display:"flex", gap:12, overflowX:"auto",
        WebkitOverflowScrolling:"touch", scrollbarWidth:"none", paddingBottom:4 }}>
        {recommendations.length === 0 ? (
          <div style={{ fontSize:13, color:T.inkFaint, fontStyle:"italic", paddingBottom:8 }}>
            Noch keine Empfehlungen.
          </div>
        ) : (
          recommendations.slice(0,5).map((rec, i) => {
            const authorName   = rec.from_profile?.display_name || "Mitglied";
            const authorAvatar = rec.from_profile?.avatar_url   || null;
            return (
            <div key={rec.id || i} style={{
              flexShrink:0, width:200,
              background:T.bgCard, borderRadius:T.r16,
              border:`1px solid ${T.border}`, padding:"14px 16px", boxShadow:T.card,
            }}>
              <div style={{ fontSize:22, color:T.teal, marginBottom:6 }}>❝</div>
              <div style={{ fontSize:13, color:T.ink, lineHeight:1.55, fontStyle:"italic", marginBottom:10 }}>
                {rec.text || ""}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {authorAvatar && (
                  <img src={authorAvatar} alt={authorName}
                    style={{ width:28, height:28, borderRadius:"50%", objectFit:"cover" }}/>
                )}
                <div style={{ fontSize:11.5, color:T.inkFaint, fontWeight:600 }}>
                  — {authorName}
                </div>
              </div>
            </div>
            );
          })
        )}
        <button className="mbp-press-light" onClick={onEdit} style={{
          flexShrink:0, display:"flex", alignItems:"center", gap:6,
          padding:"10px 16px", borderRadius:T.r16,
          background:T.bgCard, border:`1.5px dashed ${T.borderMid}`,
          fontSize:12.5, fontWeight:600, color:T.inkSoft,
          cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
          alignSelf:"flex-start",
        }}>
          <span style={{fontSize:16}}>+</span> Weitere hinzufügen
        </button>
      </div>
    </div>
  );
}

function VerfuegbarkeitStandortRow({ profile, onSave }) {
  const [editLoc,   setEditLoc]   = React.useState(false);
  const [editAvail, setEditAvail] = React.useState(false);   // Sprint F.3A.1 — war fehlendes State
  const [locDraft,  setLocDraft]  = React.useState(profile?.location || "");

  // WAHRHEIT: profiles.is_available (Sprint F.3A)
  // focus_type ist Sichtbarkeit, NICHT Verfügbarkeit
  const isOpen = profile?.is_available !== false;

  const saveLocation = async () => {
    onSave?.({ location: locDraft });
    setEditLoc(false);
  };

  // Sprint F.3A.1: Verfügbarkeit speichern
  const saveAvailability = async (val) => {
    onSave?.({ is_available: val });
    setEditAvail(false);
  };

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {/* ── Verfügbarkeit ── */}
        <div style={{ background:T.bgCard, borderRadius:T.r16,
          border:`1px solid ${editAvail ? "rgba(14,196,184,0.35)" : T.border}`,
          padding:"14px", boxShadow:T.card,
          transition:"border-color .2s ease" }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"flex-start", marginBottom:6 }}>
            <div style={{ fontSize:13, fontWeight:800, color:T.ink }}>Verfügbarkeit</div>
            {!editAvail && (
              <button className="mbp-press-light" style={{
                background:"none", border:"none", padding:0,
                fontSize:11, color:T.teal, fontWeight:700,
                cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
              }} onClick={() => setEditAvail(true)}>Bearbeiten ›</button>
            )}
          </div>
          <div style={{ fontSize:10.5, color:T.inkFaint, marginBottom:8 }}>
            Wann du für neue Anfragen offen bist.
          </div>
          {editAvail ? (
            /* ── Editor: zwei Optionen + Buttons ── */
            <div>
              {[
                { val: true,  label:"Offen für neue Anfragen", dot: T.teal,    bg: "rgba(14,196,184,0.08)", bord: "rgba(14,196,184,0.22)" },
                { val: false, label:"Momentan ausgelastet",    dot: T.inkFaint, bg: "rgba(26,26,24,0.04)",   bord: T.border },
              ].map(opt => (
                <button key={String(opt.val)} className="mbp-press-light"
                  onClick={() => saveAvailability(opt.val)}
                  style={{
                    display:"flex", alignItems:"center", gap:8,
                    width:"100%", padding:"8px 10px", borderRadius:12,
                    background: isOpen === opt.val ? opt.bg : "transparent",
                    border:`1.5px solid ${isOpen === opt.val ? opt.bord : T.border}`,
                    marginBottom:6, cursor:"pointer",
                    touchAction:"manipulation", fontFamily:"inherit",
                    transition:"all .15s ease",
                  }}>
                  <span style={{ width:7, height:7, borderRadius:"50%",
                    background: opt.dot, display:"inline-block", flexShrink:0 }}/>
                  <span style={{ fontSize:11, fontWeight:700,
                    color: isOpen === opt.val ? opt.dot : T.inkSoft }}>
                    {opt.label}
                  </span>
                  {isOpen === opt.val && (
                    <span style={{ marginLeft:"auto", fontSize:11, color: opt.dot }}>✓</span>
                  )}
                </button>
              ))}
              <button onClick={() => setEditAvail(false)} style={{
                width:"100%", padding:"5px", marginTop:2,
                borderRadius:99, border:`1px solid ${T.border}`,
                background:"none", fontSize:10, color:T.inkSoft,
                cursor:"pointer", fontFamily:"inherit",
              }}>Abbrechen</button>
            </div>
          ) : (
            /* ── Anzeige ── */
            <div style={{ display:"flex", alignItems:"center", gap:6,
              padding:"7px 10px", borderRadius:T.r12,
              background: isOpen ? T.tealSoft : "rgba(26,26,24,0.04)",
              border:`1px solid ${isOpen ? T.tealMid : T.border}` }}>
              <span style={{ width:7, height:7, borderRadius:"50%",
                background: isOpen ? T.teal : T.inkFaint,
                display:"inline-block", flexShrink:0 }}/>
              <div>
                <div style={{ fontSize:11, fontWeight:700,
                  color: isOpen ? T.teal : T.inkSoft }}>
                  {isOpen ? "Offen für neue Anfragen" : "Momentan ausgelastet"}
                </div>
                <div style={{ fontSize:10, color:T.inkFaint }}>Antwortzeit: innerhalb von 24h</div>
              </div>
            </div>
          )}
        </div>
        <div style={{ background:T.bgCard, borderRadius:T.r16,
          border:`1px solid ${T.border}`, padding:"14px", boxShadow:T.card }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"flex-start", marginBottom:6 }}>
            <div style={{ fontSize:13, fontWeight:800, color:T.ink }}>Standort</div>
            <button className="mbp-press-light" style={{
              background:"none", border:"none", padding:0,
              fontSize:11, color:T.teal, fontWeight:700,
              cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
            }} onClick={() => setEditLoc(true)}>Bearbeiten ›</button>
          </div>
          {editLoc ? (
            <div>
              <input autoFocus value={locDraft} onChange={e => setLocDraft(e.target.value)}
                placeholder="z.B. Berlin, Deutschland"
                style={{ width:"100%", padding:"7px 8px", borderRadius:T.r12,
                  border:`1.5px solid ${T.teal}`, outline:"none",
                  fontSize:11, color:T.ink, fontFamily:"inherit", boxSizing:"border-box" }}/>
              <div style={{ display:"flex", gap:5, marginTop:5 }}>
                <button onClick={() => setEditLoc(false)} style={{
                  flex:1, padding:"5px", borderRadius:T.r99,
                  border:`1px solid ${T.border}`, background:"none",
                  fontSize:10, color:T.inkSoft, cursor:"pointer", fontFamily:"inherit",
                }}>✕</button>
                <button onClick={saveLocation} style={{
                  flex:2, padding:"5px", borderRadius:T.r99,
                  border:"none", background:T.teal,
                  fontSize:10, fontWeight:700, color:"white",
                  cursor:"pointer", fontFamily:"inherit",
                }}>✓</button>
              </div>
            </div>
          ) : (
            <button className="mbp-press-light" onClick={() => setEditLoc(true)} style={{
              display:"flex", alignItems:"center", gap:6, width:"100%",
              padding:"7px 8px", borderRadius:T.r12,
              background:"rgba(26,26,24,0.03)", border:`1px solid ${T.border}`,
              cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
              justifyContent:"space-between",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <span style={{fontSize:12}}>📍</span>
                <span style={{ fontSize:11, color:T.ink, fontWeight:500 }}>
                  {profile?.location || "Standort eingeben"}
                </span>
              </div>
              <span style={{ fontSize:12, color:T.inkFaint }}>›</span>
            </button>
          )}
        </div>
      </div>
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
