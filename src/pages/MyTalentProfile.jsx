// src/pages/MyTalentProfile.jsx — HUI Talent Profile v3
// Referenz: Screenshot 2026-05-30 — 1:1 Umsetzung
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";

// ── Design Tokens ─────────────────────────────────────────────
const T = {
  bg:        "#F8F7F4",
  bgCard:    "#FFFFFF",
  teal:      "#0EC4B8",
  tealSoft:  "rgba(14,196,184,0.10)",
  tealMid:   "rgba(14,196,184,0.22)",
  tealDark:  "#0DBBAF",
  ink:       "#1A1A18",
  inkSoft:   "rgba(26,26,24,0.55)",
  inkFaint:  "rgba(26,26,24,0.32)",
  border:    "rgba(26,26,24,0.09)",
  borderMid: "rgba(26,26,24,0.14)",
  card:      "0 1px 6px rgba(26,26,24,0.06), 0 1px 2px rgba(26,26,24,0.03)",
  px: 16,
};

const CSS = `
  .mtp-root {
    background:#F8F7F4;
    font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif;
    color:#1A1A18; width:100%; overflow-x:hidden;
    -webkit-font-smoothing:antialiased;
  }
  .mtp-scroll { overflow-y:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .mtp-scroll::-webkit-scrollbar { display:none; }
  @keyframes mtp-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  .mtp-in { animation:mtp-in .38s ease both; }
  .mtp-press { transition:transform .12s ease,opacity .12s ease; cursor:pointer; }
  .mtp-press:active { transform:scale(0.95); opacity:0.7; }
  .mtp-sec {
    background:#FFFFFF; border-radius:14px;
    border:1px solid rgba(26,26,24,0.09);
    margin:0 16px;
    box-shadow:0 1px 6px rgba(26,26,24,0.06),0 1px 2px rgba(26,26,24,0.03);
    overflow:hidden;
  }
  .mtp-sec-pad { padding:16px 16px 18px; }
  .mtp-sec-hdr { display:flex;align-items:center;justify-content:space-between;margin-bottom:12px; }
  .mtp-sec-title { font-size:15px;font-weight:700;color:#1A1A18; }
  .mtp-sec-sub { font-size:12px;color:rgba(26,26,24,0.32);margin-top:1px; }
  .mtp-edit {
    font-size:12.5px;font-weight:600;color:#0EC4B8;
    background:none;border:none;padding:0;cursor:pointer;
    font-family:inherit;touch-action:manipulation;flex-shrink:0;
    display:inline-flex;align-items:center;gap:2px;
  }
  .mtp-edit:active { opacity:0.6; }
  .mtp-add {
    display:flex;align-items:center;justify-content:center;gap:6px;
    width:100%;padding:11px;
    border:1.5px dashed rgba(26,26,24,0.14);border-radius:12px;
    background:transparent;font-size:12.5px;font-weight:600;color:rgba(26,26,24,0.32);
    cursor:pointer;touch-action:manipulation;font-family:inherit;
    transition:background .15s ease;margin-top:10px;box-sizing:border-box;
  }
  .mtp-add:active { background:rgba(26,26,24,0.03); }
  .mtp-overlay {
    position:fixed;inset:0;z-index:9800;
    background:rgba(0,0,0,0.38);
    display:flex;align-items:flex-end;
  }
  @keyframes mtp-up { from{transform:translateY(100%)} to{transform:none} }
  .mtp-sheet {
    width:100%;background:#FFFFFF;
    border-radius:20px 20px 0 0;
    padding:24px 20px max(28px,calc(20px + env(safe-area-inset-bottom,0px)));
    animation:mtp-up .24s cubic-bezier(.22,1,.36,1) both;
    max-height:82vh;overflow-y:auto;box-sizing:border-box;
  }
`;

// ── Seed Data ──────────────────────────────────────────────────
const DEFAULT_BIO = "Ich male, um das Unsichtbare sichtbar zu machen.\nInspiration finde ich in der Natur, im Licht\nund in echten Begegnungen.";
const DEFAULT_TALENTS = ["Malen","Illustration","Workshops","Kunstberatung","Auftragskunst"];
const TALENT_ICONS = {
  "Malen":"🎨","Illustration":"🖌","Workshops":"👥","Kunstberatung":"⭐",
  "Auftragskunst":"👜","Fotografie":"📷","Musik":"🎵","Design":"✏️",
};
const SEED_WORKS = [
  { id:"w1", img:"https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=75" },
  { id:"w2", img:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=75" },
  { id:"w3", img:"https://images.unsplash.com/photo-1518791841217-8f162f1912da?w=400&q=75" },
  { id:"w4", img:"https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=75" },
  { id:"w5", img:"https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&q=75" },
];
const SEED_EXP = [
  { id:"e1", title:"Malkurs: Intuitives Malen",  type:"Workshop",    date:"Mai 2024",   img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&q=70" },
  { id:"e2", title:"Gemeinschaftsausstellung",    type:"Ausstellung", date:"März 2024",  img:"https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=300&q=70" },
  { id:"e3", title:"Live Painting Event",         type:"Event",       date:"Feb. 2024",  img:"https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&q=70" },
  { id:"e4", title:"Kunst für den guten Zweck",   type:"Projekt",     date:"Jan. 2024",  img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&q=70" },
];
const SEED_REVIEW = {
  text: "Deine Bilder berühren etwas in mir, das Worte nicht können.",
  author: "– Julia M.",
  avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&q=70",
};
const FB_COVER = "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=80";
const FB_AVT   = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80";

// ── Helpers ────────────────────────────────────────────────────
const sv = (v, fb="") => (v && typeof v === "string" ? v.trim() : fb);
function Gap({ h=12 }) { return <div style={{ height:h }}/>; }

// ── BottomSheet ────────────────────────────────────────────────
function BottomSheet({ onClose, children }) {
  return (
    <div className="mtp-overlay" onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
      <div className="mtp-sheet">
        <div style={{ width:36,height:4,borderRadius:99,background:"rgba(26,26,24,0.15)",margin:"0 auto 20px" }}/>
        {children}
      </div>
    </div>
  );
}

// ── SecHdr ─────────────────────────────────────────────────────
function SecHdr({ title, sub, onEdit, isOwner }) {
  return (
    <div className="mtp-sec-hdr">
      <div>
        <div className="mtp-sec-title">{title}</div>
        {sub && <div className="mtp-sec-sub">{sub}</div>}
      </div>
      {isOwner && onEdit && (
        <button className="mtp-edit" onClick={onEdit}>
          Bearbeiten <span style={{ fontSize:11, color:"#0EC4B8" }}>›</span>
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 0. PAGE TITLE
// ══════════════════════════════════════════════════════════════
function PageTitle({ isOwner }) {
  return (
    <div style={{ padding:"14px 16px 10px", display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
      <div>
        <div style={{ fontSize:22, fontWeight:800, color:"#1A1A18", letterSpacing:-0.3 }}>
          Mein Talent-Profil ✨
        </div>
        <div style={{ fontSize:12.5, color:"rgba(26,26,24,0.32)", marginTop:3, lineHeight:1.4 }}>
          Gestalte dein Talent-Profil so, wie es dich und dein Wirken zeigt.
        </div>
      </div>
      {isOwner && (
        <button style={{ background:"none", border:"none", padding:"2px 0 0 10px", cursor:"pointer", touchAction:"manipulation", flexShrink:0 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="rgba(26,26,24,0.32)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 1. HEADER — Cover + Avatar
// ══════════════════════════════════════════════════════════════
function ProfileHeader({ profile, loading, isOwner }) {
  const coverRef  = useRef(null);
  const avatarRef = useRef(null);
  const cover  = sv(profile?.header_img, FB_COVER);
  const avatar = sv(profile?.avatar_url, FB_AVT);

  async function uploadImage(file, folder) {
    if (!file) return null;
    const { data:{ user } } = await supabase.auth.getUser();
    const ext = file.name.split(".").pop();
    const path = `${folder}/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { upsert:true });
    if (error) { console.error(error); return null; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleCoverChange(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const url = await uploadImage(file, "covers");
    if (url) {
      const { data:{ user } } = await supabase.auth.getUser();
      await supabase.from("profiles").update({ header_img:url }).eq("id", user.id);
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const url = await uploadImage(file, "avatars");
    if (url) {
      const { data:{ user } } = await supabase.auth.getUser();
      await supabase.from("profiles").update({ avatar_url:url }).eq("id", user.id);
    }
  }

  return (
    <div style={{ position:"relative", width:"100%" }}>
      {/* Cover */}
      <div style={{ width:"100%", height:160, position:"relative", overflow:"hidden", background:"#e8e4df" }}>
        {!loading && <img src={cover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>}
        {isOwner && (
          <>
            <input ref={coverRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleCoverChange}/>
            <button onClick={() => coverRef.current?.click()} style={{
              position:"absolute", top:10, right:10, width:32, height:32, borderRadius:"50%",
              background:"rgba(0,0,0,0.40)", border:"none",
              display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer", touchAction:"manipulation",
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Avatar */}
      <div style={{ position:"absolute", bottom:-42, left:"50%", transform:"translateX(-50%)" }}>
        <div style={{
          width:84, height:84, borderRadius:"50%",
          border:"3px solid white",
          boxShadow:"0 2px 12px rgba(0,0,0,0.18)",
          overflow:"hidden", background:"#ddd", position:"relative",
        }}>
          {!loading && <img src={avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>}
        </div>
        {isOwner && (
          <>
            <input ref={avatarRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleAvatarChange}/>
            <button onClick={() => avatarRef.current?.click()} style={{
              position:"absolute", bottom:0, right:0,
              width:26, height:26, borderRadius:"50%",
              background:"#FFFFFF", border:"2px solid white",
              boxShadow:"0 1px 4px rgba(0,0,0,0.18)",
              display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer", touchAction:"manipulation",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1A1A18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 2. ÜBER MICH
// ══════════════════════════════════════════════════════════════
function UeberMich({ profile, loading, isOwner }) {
  const MAX = 220;
  const [bio, setBio]         = useState(DEFAULT_BIO);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState("");
  const [saving, setSaving]   = useState(false);

  useEffect(() => { if (profile?.bio) setBio(profile.bio); }, [profile?.bio]);

  async function save() {
    setSaving(true);
    const { data:{ user } } = await supabase.auth.getUser();
    await supabase.from("profiles").update({ bio: draft }).eq("id", user.id);
    setBio(draft); setSaving(false); setEditing(false);
  }

  return (
    <div className="mtp-sec">
      <div className="mtp-sec-pad">
        <SecHdr title="Über mich" isOwner={isOwner}
          onEdit={() => { setDraft(bio); setEditing(true); }}/>
        {loading ? (
          <div style={{ height:72, background:"rgba(26,26,24,0.05)", borderRadius:8 }}/>
        ) : (
          <div style={{
            position:"relative",
            border:"1px solid rgba(26,26,24,0.09)", borderRadius:12,
            padding:"12px 14px 28px", background:"#FFFFFF",
          }}>
            <p style={{ margin:0, fontSize:13.5, lineHeight:1.7, color:"#1A1A18", whiteSpace:"pre-line" }}>
              {bio || DEFAULT_BIO}
            </p>
            <span style={{ position:"absolute", bottom:8, right:12, fontSize:11, color:"rgba(26,26,24,0.32)", fontWeight:500 }}>
              {(bio||DEFAULT_BIO).length} / {MAX}
            </span>
          </div>
        )}
      </div>
      {editing && (
        <BottomSheet onClose={() => setEditing(false)}>
          <div style={{ fontSize:16, fontWeight:800, color:"#1A1A18", marginBottom:14 }}>Über mich bearbeiten</div>
          <div style={{ position:"relative" }}>
            <textarea value={draft} onChange={e => setDraft(e.target.value.slice(0,MAX))} rows={5}
              style={{
                width:"100%", boxSizing:"border-box", padding:"12px 14px 28px", borderRadius:12,
                border:"1.5px solid rgba(14,196,184,0.22)", outline:"none",
                fontSize:13.5, lineHeight:1.7, resize:"none", fontFamily:"inherit", color:"#1A1A18", background:"#FFFFFF",
              }}/>
            <span style={{ position:"absolute", bottom:10, right:12, fontSize:11, color:"rgba(26,26,24,0.32)" }}>
              {draft.length} / {MAX}
            </span>
          </div>
          <Gap h={12}/>
          <button onClick={save} disabled={saving} style={{
            width:"100%", padding:"14px", borderRadius:14,
            background:"linear-gradient(135deg,#0EC4B8,#0DBBAF)", border:"none",
            color:"white", fontSize:14, fontWeight:700,
            cursor:"pointer", fontFamily:"inherit", touchAction:"manipulation",
          }}>
            {saving ? "Speichert…" : "Speichern"}
          </button>
        </BottomSheet>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 3. MEINE TALENTE & ANGEBOTE
// ══════════════════════════════════════════════════════════════
function TalenteAngebote({ loading, isOwner, wirkerProfile, userId }) {
  // Quelle der Wahrheit: wirker_profiles.categories
  // DEFAULT_TALENTS nur als visuelle Vorlage im Edit-Sheet, nie als Datenquelle
  const [tags, setTags]       = useState([]);
  const [editing, setEditing] = useState(false);
  const [newTag, setNewTag]   = useState("");
  const [saveState, setSaveState] = useState(null); // null | "saving" | "ok" | "error"

  // ── LOAD: wirkerProfile.categories → State ─────────────────
  useEffect(() => {
    if (!wirkerProfile) return;
    const cats = Array.isArray(wirkerProfile.categories)
      ? wirkerProfile.categories
      : [];
    console.log("[LOAD CATEGORIES]", cats);
    setTags(cats);
  }, [wirkerProfile?.id]);

  // ── SAVE: sofort nach jeder Änderung in DB schreiben ───────
  async function saveToDB(newTags) {
    if (!userId) return;
    console.log("[SAVE CATEGORIES]", newTags);
    setSaveState("saving");
    const { error } = await supabase
      .from("wirker_profiles")
      .update({ categories: newTags, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) {
      console.error("[DB UPDATE ERROR]", error);
      setSaveState("error");
      setTimeout(() => setSaveState(null), 2500);
    } else {
      console.log("[DB UPDATE SUCCESS] categories →", newTags);
      setSaveState("ok");
      setTimeout(() => setSaveState(null), 1500);
    }
  }

  function addTag() {
    const t = newTag.trim();
    if (!t || tags.includes(t)) { setNewTag(""); return; }
    const next = [...tags, t];
    setTags(next);
    setNewTag("");
    saveToDB(next);
  }

  function removeTag(tag) {
    console.log("[REMOVE CATEGORY]", tag);
    const next = tags.filter(x => x !== tag);
    setTags(next);
    saveToDB(next);
  }

  return (
    <div className="mtp-sec">
      <div className="mtp-sec-pad">
        <SecHdr title="Meine Talente & Angebote" isOwner={isOwner} onEdit={null}/>
        {loading ? (
          <div style={{ height:56, background:"rgba(26,26,24,0.05)", borderRadius:8 }}/>
        ) : (
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {tags.map(tag => (
              <div key={tag} style={{
                display:"inline-flex", alignItems:"center", gap:5,
                padding:"7px 13px", borderRadius:99,
                border:"1.5px solid rgba(26,26,24,0.09)", background:"#FFFFFF",
                fontSize:13, fontWeight:600, color:"#1A1A18",
                boxShadow:"0 1px 3px rgba(26,26,24,0.06)",
              }}>
                {TALENT_ICONS[tag] && <span style={{ fontSize:13 }}>{TALENT_ICONS[tag]}</span>}
                {tag}
              </div>
            ))}
            {isOwner && (
              <button onClick={() => setEditing(true)} style={{
                display:"inline-flex", alignItems:"center", gap:5,
                padding:"7px 13px", borderRadius:99,
                border:"1.5px dashed rgba(26,26,24,0.14)", background:"transparent",
                fontSize:13, fontWeight:600, color:"rgba(26,26,24,0.32)",
                cursor:"pointer", fontFamily:"inherit", touchAction:"manipulation",
              }}>
                + Weiteres hinzufügen
              </button>
            )}
          </div>
        )}
      </div>
      {editing && (
        <BottomSheet onClose={() => setEditing(false)}>
          <div style={{ fontSize:16, fontWeight:800, color:"#1A1A18", marginBottom:14 }}>Talente & Angebote</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
            {tags.map(tag => (
              <div key={tag} style={{
                display:"inline-flex", alignItems:"center", gap:6,
                padding:"7px 12px", borderRadius:99,
                background:"rgba(14,196,184,0.10)", border:"1px solid rgba(14,196,184,0.22)",
                fontSize:13, fontWeight:600, color:"#0EC4B8",
              }}>
                {TALENT_ICONS[tag] && <span>{TALENT_ICONS[tag]}</span>}
                {tag}
                <button onClick={() => removeTag(tag)} style={{
                  background:"none", border:"none", padding:"0 0 0 2px",
                  cursor:"pointer", color:"#0EC4B8", fontSize:14, lineHeight:1, touchAction:"manipulation",
                }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <input value={newTag} onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => e.key==="Enter" && addTag()}
              placeholder="Neues Talent…"
              style={{
                flex:1, padding:"11px 14px", borderRadius:12,
                border:"1.5px solid rgba(26,26,24,0.09)", outline:"none",
                fontSize:13.5, fontFamily:"inherit", color:"#1A1A18", background:"#FFFFFF",
              }}/>
            <button onClick={addTag} style={{
              padding:"11px 16px", borderRadius:12,
              background:"linear-gradient(135deg,#0EC4B8,#0DBBAF)", border:"none",
              color:"white", fontSize:13, fontWeight:700,
              cursor:"pointer", fontFamily:"inherit", touchAction:"manipulation",
            }}>+</button>
          </div>
          <Gap h={14}/>
          {/* Save-Status */}
          {saveState && (
            <div style={{
              textAlign:"center", marginBottom:10,
              fontSize:12, fontWeight:600,
              color: saveState==="ok" ? "#0EC4B8" : saveState==="error" ? "#ef4444" : "rgba(26,26,24,0.45)",
            }}>
              {saveState==="saving" && "Speichert…"}
              {saveState==="ok"     && "✓ Gespeichert"}
              {saveState==="error"  && "⚠ Fehler beim Speichern"}
            </div>
          )}
          <button onClick={() => setEditing(false)} style={{
            width:"100%", padding:"14px", borderRadius:14,
            background:"linear-gradient(135deg,#0EC4B8,#0DBBAF)", border:"none",
            color:"white", fontSize:14, fontWeight:700,
            cursor:"pointer", fontFamily:"inherit", touchAction:"manipulation",
          }}>Fertig</button>
        </BottomSheet>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 4. MEINE WERKE
// ══════════════════════════════════════════════════════════════
function MeineWerke({ loading, isOwner, userId }) {
  // ── State ────────────────────────────────────────────────────
  // Quelle der Wahrheit: public.works  (cover_url, title, description)
  // SEED_WORKS nur als Entwicklungs-Fallback — nie als Datenquelle
  const [works,     setWorks]     = useState([]);
  const [worksLoading, setWorksLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editWork,  setEditWork]  = useState(null); // {id, title, description} | null
  const [saveState, setSaveState] = useState(null); // null|"saving"|"ok"|"error"
  const fileRef = useRef(null);

  // ── LOAD: public.works → State ───────────────────────────────
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setWorksLoading(true);
      const { data, error } = await supabase
        .from("works")
        .select("id,user_id,title,description,cover_url,media_url,status,created_at")
        .eq("user_id", userId)
        .neq("status", "archived")
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("[LOAD WORKS] error:", error.message);
      } else {
        console.log("[LOAD WORKS]", data?.length ?? 0, "Werke");
        console.log("[WORKS COUNT]", data?.length ?? 0);
        setWorks(data || []);
      }
      setWorksLoading(false);
    })();
  }, [userId]);

  // ── UPLOAD: Bild → Storage → works INSERT ────────────────────
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    console.log("[UPLOAD WORK] start:", file.name);

    // 1. Storage Upload: media/works/{userId}/{timestamp}.{ext}
    const ext  = file.name.split(".").pop().toLowerCase();
    const path = `works/${userId}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("media")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      console.error("[UPLOAD WORK] storage error:", uploadErr.message);
      setSaveState("error");
      setTimeout(() => setSaveState(null), 2500);
      setUploading(false);
      return;
    }

    // 2. Public URL
    const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
    const cover_url = urlData.publicUrl;

    // 3. DB INSERT
    console.log("[SAVE WORK] inserting cover_url:", cover_url);
    const { data: newWork, error: insertErr } = await supabase
      .from("works")
      .insert({
        user_id:   userId,
        cover_url: cover_url,
        media_url: cover_url,
        title:     "",
        status:    "published",
      })
      .select("id,user_id,title,description,cover_url,media_url,status,created_at")
      .single();

    if (insertErr) {
      console.error("[SAVE WORK] insert error:", insertErr.message);
      setSaveState("error");
    } else {
      console.log("[SAVE WORK] success, id:", newWork.id);
      setWorks(prev => [newWork, ...prev]);
      setSaveState("ok");
      // Titel-Edit sofort öffnen
      setEditWork({ id: newWork.id, title: "", description: "" });
    }
    setTimeout(() => setSaveState(null), 1800);
    setUploading(false);
    // Input zurücksetzen
    if (fileRef.current) fileRef.current.value = "";
  }

  // ── DELETE: status="archived" ────────────────────────────────
  async function deleteWork(id) {
    console.log("[DELETE WORK] id:", id);
    // Optimistisch aus UI entfernen
    setWorks(prev => prev.filter(w => w.id !== id));
    const { error } = await supabase
      .from("works")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) {
      console.error("[DELETE WORK] error:", error.message);
      // Reload bei Fehler
      const { data } = await supabase
        .from("works")
        .select("id,user_id,title,description,cover_url,media_url,status,created_at")
        .eq("user_id", userId).neq("status", "archived")
        .order("created_at", { ascending: false });
      if (data) setWorks(data);
    }
  }

  // ── EDIT: title + description speichern ──────────────────────
  async function saveEdit() {
    if (!editWork) return;
    setSaveState("saving");
    const { error } = await supabase
      .from("works")
      .update({
        title:       editWork.title,
        description: editWork.description,
        updated_at:  new Date().toISOString(),
      })
      .eq("id", editWork.id)
      .eq("user_id", userId);
    if (error) {
      console.error("[SAVE WORK] edit error:", error.message);
      setSaveState("error");
    } else {
      setWorks(prev => prev.map(w =>
        w.id === editWork.id
          ? { ...w, title: editWork.title, description: editWork.description }
          : w
      ));
      setSaveState("ok");
      setEditWork(null);
    }
    setTimeout(() => setSaveState(null), 1500);
  }

  const isWorksLoading = loading || worksLoading;

  return (
    <div className="mtp-sec">
      <div className="mtp-sec-pad">
        <SecHdr title="Meine Werke" isOwner={isOwner} onEdit={null}/>

        {/* Upload-Status Toast */}
        {(uploading || saveState) && (
          <div style={{
            marginBottom:8, padding:"6px 12px", borderRadius:99,
            background: saveState==="ok"    ? "rgba(14,196,184,0.10)"
                       : saveState==="error" ? "rgba(239,68,68,0.08)"
                       : "rgba(26,26,24,0.05)",
            border: `1px solid ${saveState==="ok" ? "rgba(14,196,184,0.22)" : saveState==="error" ? "rgba(239,68,68,0.18)" : "rgba(26,26,24,0.09)"}`,
            fontSize:12, fontWeight:600,
            color: saveState==="ok" ? "#0EC4B8" : saveState==="error" ? "#ef4444" : "rgba(26,26,24,0.45)",
            display:"inline-flex", alignItems:"center", gap:6,
          }}>
            {uploading && !saveState && "Bild wird hochgeladen…"}
            {saveState==="saving" && "Speichert…"}
            {saveState==="ok"     && "✓ Gespeichert"}
            {saveState==="error"  && "⚠ Fehler beim Speichern"}
          </div>
        )}

        {/* Galerie */}
        {isWorksLoading ? (
          <div style={{ height:90, background:"rgba(26,26,24,0.05)", borderRadius:8 }}/>
        ) : (
          <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:2, scrollbarWidth:"none" }}>
            {works.map(w => (
              <div key={w.id} style={{
                flexShrink:0, position:"relative",
                width:90, height:90, borderRadius:8, overflow:"hidden", background:"#e8e4df",
              }}>
                <img
                  src={w.cover_url || w.media_url}
                  alt={w.title || ""}
                  style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                  onError={e => { e.currentTarget.style.display="none"; }}
                />
                {/* Titel-Overlay wenn vorhanden */}
                {w.title && (
                  <div style={{
                    position:"absolute", bottom:0, left:0, right:0,
                    background:"linear-gradient(transparent,rgba(0,0,0,0.55))",
                    padding:"14px 5px 4px",
                  }}>
                    <div style={{
                      fontSize:9, fontWeight:600, color:"white",
                      overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
                      paddingLeft:4,
                    }}>
                      {w.title}
                    </div>
                  </div>
                )}
                {/* Owner Controls */}
                {isOwner && (
                  <>
                    {/* Löschen × */}
                    <button onClick={() => deleteWork(w.id)} style={{
                      position:"absolute", top:3, right:3, width:20, height:20, borderRadius:"50%",
                      background:"rgba(0,0,0,0.55)", border:"none", color:"white", fontSize:12,
                      cursor:"pointer", touchAction:"manipulation",
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}>×</button>
                    {/* Bearbeiten ✎ */}
                    <button onClick={() => setEditWork({ id:w.id, title:w.title||"", description:w.description||"" })} style={{
                      position:"absolute", bottom:3, right:3, width:20, height:20, borderRadius:"50%",
                      background:"rgba(14,196,184,0.85)", border:"none", color:"white", fontSize:10,
                      cursor:"pointer", touchAction:"manipulation",
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}>✎</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* + Werk hinzufügen */}
        {isOwner && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display:"none" }}
              onChange={handleFileChange}
            />
            <button
              className="mtp-add"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{ opacity: uploading ? 0.6 : 1 }}
            >
              <span style={{ fontSize:15 }}>+</span>
              {uploading ? "Wird hochgeladen…" : "Werk hinzufügen"}
            </button>
          </>
        )}
      </div>

      {/* Edit-Sheet: Titel + Beschreibung */}
      {editWork && (
        <BottomSheet onClose={() => setEditWork(null)}>
          <div style={{ fontSize:16, fontWeight:800, color:"#1A1A18", marginBottom:14 }}>
            Werk bearbeiten
          </div>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:12, fontWeight:600, color:"rgba(26,26,24,0.45)", marginBottom:5 }}>
              Titel
            </div>
            <input
              value={editWork.title}
              onChange={e => setEditWork(p => ({ ...p, title: e.target.value }))}
              placeholder="Titel des Werks…"
              maxLength={80}
              style={{
                width:"100%", boxSizing:"border-box",
                padding:"11px 14px", borderRadius:12,
                border:"1.5px solid rgba(14,196,184,0.22)", outline:"none",
                fontSize:13.5, fontFamily:"inherit", color:"#1A1A18", background:"#FFFFFF",
              }}
            />
          </div>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:600, color:"rgba(26,26,24,0.45)", marginBottom:5 }}>
              Beschreibung (optional)
            </div>
            <textarea
              value={editWork.description}
              onChange={e => setEditWork(p => ({ ...p, description: e.target.value }))}
              placeholder="Kurze Beschreibung…"
              rows={3}
              maxLength={300}
              style={{
                width:"100%", boxSizing:"border-box",
                padding:"11px 14px", borderRadius:12,
                border:"1.5px solid rgba(26,26,24,0.09)", outline:"none",
                fontSize:13, fontFamily:"inherit", color:"#1A1A18",
                background:"#FFFFFF", resize:"none", lineHeight:1.6,
              }}
            />
          </div>
          {saveState && (
            <div style={{ textAlign:"center", marginBottom:10, fontSize:12, fontWeight:600,
              color: saveState==="ok" ? "#0EC4B8" : saveState==="error" ? "#ef4444" : "rgba(26,26,24,0.45)" }}>
              {saveState==="saving" && "Speichert…"}
              {saveState==="ok"     && "✓ Gespeichert"}
              {saveState==="error"  && "⚠ Fehler"}
            </div>
          )}
          <button onClick={saveEdit} style={{
            width:"100%", padding:"14px", borderRadius:14,
            background:"linear-gradient(135deg,#0EC4B8,#0DBBAF)", border:"none",
            color:"white", fontSize:14, fontWeight:700,
            cursor:"pointer", fontFamily:"inherit", touchAction:"manipulation",
          }}>
            Speichern
          </button>
        </BottomSheet>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 5. ERLEBNISSE & PROJEKTE
// ══════════════════════════════════════════════════════════════
function ErlebnisseProjekte({ loading, isOwner }) {
  const [exps] = useState(SEED_EXP);

  return (
    <div className="mtp-sec">
      <div className="mtp-sec-pad">
        <SecHdr title="Erlebnisse & Projekte"
          sub="Momente, die mein Wirken zeigen."
          isOwner={isOwner} onEdit={() => {}}/>
        {loading ? (
          <div style={{ height:110, background:"rgba(26,26,24,0.05)", borderRadius:8 }}/>
        ) : (
          <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:2, scrollbarWidth:"none" }}>
            {exps.map(e => (
              <div key={e.id} style={{ flexShrink:0, width:100 }}>
                <div style={{ width:100, height:80, borderRadius:8, overflow:"hidden", background:"#e8e4df", marginBottom:6 }}>
                  <img src={e.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
                </div>
                <div style={{
                  fontSize:11.5, fontWeight:700, color:"#1A1A18", lineHeight:1.3, marginBottom:2,
                  overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical",
                }}>{e.title}</div>
                <div style={{ fontSize:11, color:"rgba(26,26,24,0.32)" }}>{e.type}</div>
                <div style={{ fontSize:11, color:"rgba(26,26,24,0.32)" }}>{e.date}</div>
              </div>
            ))}
            {isOwner && (
              <div style={{ flexShrink:0, width:80 }}>
                <div style={{
                  width:80, height:80, borderRadius:8,
                  border:"1.5px dashed rgba(26,26,24,0.14)", background:"transparent",
                  display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                  gap:4, cursor:"pointer", marginBottom:6,
                }}>
                  <span style={{ fontSize:20, color:"rgba(26,26,24,0.32)" }}>+</span>
                </div>
                <div style={{ fontSize:11, fontWeight:600, color:"rgba(26,26,24,0.32)", textAlign:"center", lineHeight:1.3 }}>
                  Erlebnis<br/>hinzufügen
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 6. KUNDENSTIMMEN
// ══════════════════════════════════════════════════════════════
function Kundenstimmen({ loading, isOwner }) {
  return (
    <div className="mtp-sec">
      <div className="mtp-sec-pad">
        <SecHdr title="Kundenstimmen" isOwner={isOwner} onEdit={() => {}}/>
        {loading ? (
          <div style={{ height:64, background:"rgba(26,26,24,0.05)", borderRadius:8 }}/>
        ) : (
          <div style={{ display:"flex", gap:10, alignItems:"stretch" }}>
            {/* Review card */}
            <div style={{
              flex:1, border:"1px solid rgba(26,26,24,0.09)", borderRadius:12,
              padding:"12px 14px", background:"#FFFFFF",
              boxShadow:"0 1px 6px rgba(26,26,24,0.06)",
              display:"flex", alignItems:"flex-start", gap:10,
            }}>
              <span style={{ fontSize:28, lineHeight:1, color:"rgba(26,26,24,0.14)", fontFamily:"Georgia,serif", marginTop:-5, flexShrink:0 }}>"</span>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:"0 0 6px", fontSize:12.5, lineHeight:1.6, color:"#1A1A18", fontStyle:"italic" }}>
                  {SEED_REVIEW.text}
                </p>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <img src={SEED_REVIEW.avatar} alt="" style={{ width:22, height:22, borderRadius:"50%", objectFit:"cover", flexShrink:0 }}/>
                  <span style={{ fontSize:11.5, fontWeight:600, color:"rgba(26,26,24,0.55)" }}>{SEED_REVIEW.author}</span>
                </div>
              </div>
            </div>
            {/* Add card */}
            {isOwner && (
              <div style={{
                flexShrink:0, width:72,
                border:"1.5px dashed rgba(26,26,24,0.14)", borderRadius:12,
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                gap:4, cursor:"pointer", padding:"10px 6px",
              }}>
                <span style={{ fontSize:20, color:"rgba(26,26,24,0.32)" }}>+</span>
                <span style={{ fontSize:10.5, color:"rgba(26,26,24,0.32)", fontWeight:600, textAlign:"center", lineHeight:1.3 }}>
                  Weitere<br/>hinzufügen
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 7. VERFÜGBARKEIT + STANDORT (side by side)
// ══════════════════════════════════════════════════════════════
function VerfuegbarkeitStandort({ profile, loading, isOwner }) {
  const location = sv(profile?.location, "Freiburg, Deutschland");
  const [avSheet, setAvSheet]   = useState(false);
  const [locSheet, setLocSheet] = useState(false);
  const [locDraft, setLocDraft] = useState("");

  async function saveLocation() {
    const { data:{ user } } = await supabase.auth.getUser();
    await supabase.from("profiles").update({ location: locDraft }).eq("id", user.id);
    setLocSheet(false);
  }

  return (
    <>
      <div style={{ display:"flex", gap:10, margin:"0 16px" }}>
        {/* Verfügbarkeit */}
        <div style={{ flex:1, background:"#FFFFFF", borderRadius:14, border:"1px solid rgba(26,26,24,0.09)", boxShadow:"0 1px 6px rgba(26,26,24,0.06)", overflow:"hidden" }}>
          <div style={{ padding:"14px 14px 16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <span style={{ fontSize:14, fontWeight:700, color:"#1A1A18" }}>Verfügbarkeit</span>
              {isOwner && (
                <button className="mtp-edit" onClick={() => setAvSheet(true)}>
                  Bearbeiten <span style={{ fontSize:11 }}>›</span>
                </button>
              )}
            </div>
            {loading ? (
              <div style={{ height:48, background:"rgba(26,26,24,0.05)", borderRadius:8 }}/>
            ) : (
              <div style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"10px 12px", background:"#FFFFFF", borderRadius:12,
                border:"1px solid rgba(26,26,24,0.09)",
              }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                    <div style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e", flexShrink:0 }}/>
                    <span style={{ fontSize:12, fontWeight:700, color:"#1A1A18" }}>Offen für neue Anfragen</span>
                  </div>
                  <div style={{ fontSize:10.5, color:"rgba(26,26,24,0.32)", paddingLeft:13 }}>Antwortzeit innerhalb von 24h</div>
                </div>
                <span style={{ color:"rgba(26,26,24,0.32)", fontSize:14 }}>›</span>
              </div>
            )}
          </div>
        </div>

        {/* Standort */}
        <div style={{ flex:1, background:"#FFFFFF", borderRadius:14, border:"1px solid rgba(26,26,24,0.09)", boxShadow:"0 1px 6px rgba(26,26,24,0.06)", overflow:"hidden" }}>
          <div style={{ padding:"14px 14px 16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <span style={{ fontSize:14, fontWeight:700, color:"#1A1A18" }}>Standort</span>
              {isOwner && (
                <button className="mtp-edit" onClick={() => { setLocDraft(location); setLocSheet(true); }}>
                  Bearbeiten <span style={{ fontSize:11 }}>›</span>
                </button>
              )}
            </div>
            {loading ? (
              <div style={{ height:48, background:"rgba(26,26,24,0.05)", borderRadius:8 }}/>
            ) : (
              <div style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"10px 12px", background:"#FFFFFF", borderRadius:12,
                border:"1px solid rgba(26,26,24,0.09)",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0EC4B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span style={{ fontSize:12, fontWeight:600, color:"#1A1A18" }}>{location}</span>
                </div>
                <span style={{ color:"rgba(26,26,24,0.32)", fontSize:14 }}>›</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {avSheet && (
        <BottomSheet onClose={() => setAvSheet(false)}>
          <div style={{ fontSize:16, fontWeight:800, color:"#1A1A18", marginBottom:14 }}>Verfügbarkeit</div>
          {[
            { label:"Offen für neue Anfragen", sub:"Antwortzeit innerhalb von 24h", color:"#22c55e" },
            { label:"Eingeschränkt",            sub:"Begrenzte Kapazität",            color:"#f59e0b" },
            { label:"Nicht verfügbar",          sub:"Momentan ausgebucht",            color:"#ef4444" },
          ].map(opt => (
            <button key={opt.label} onClick={() => setAvSheet(false)} style={{
              display:"flex", alignItems:"center", gap:12, width:"100%",
              padding:"14px 16px", borderRadius:12, border:"1px solid rgba(26,26,24,0.09)",
              background:"#FFFFFF", marginBottom:8,
              cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit", textAlign:"left",
            }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:opt.color, flexShrink:0 }}/>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:"#1A1A18" }}>{opt.label}</div>
                <div style={{ fontSize:11.5, color:"rgba(26,26,24,0.32)" }}>{opt.sub}</div>
              </div>
            </button>
          ))}
        </BottomSheet>
      )}

      {locSheet && (
        <BottomSheet onClose={() => setLocSheet(false)}>
          <div style={{ fontSize:16, fontWeight:800, color:"#1A1A18", marginBottom:14 }}>Standort bearbeiten</div>
          <input value={locDraft} onChange={e => setLocDraft(e.target.value)}
            placeholder="z.B. Freiburg, Deutschland"
            style={{
              width:"100%", boxSizing:"border-box", padding:"12px 14px", borderRadius:12,
              border:"1.5px solid rgba(14,196,184,0.22)", outline:"none",
              fontSize:13.5, fontFamily:"inherit", color:"#1A1A18", background:"#FFFFFF",
            }}/>
          <Gap h={12}/>
          <button onClick={saveLocation} style={{
            width:"100%", padding:"14px", borderRadius:14,
            background:"linear-gradient(135deg,#0EC4B8,#0DBBAF)", border:"none",
            color:"white", fontSize:14, fontWeight:700,
            cursor:"pointer", fontFamily:"inherit", touchAction:"manipulation",
          }}>Speichern</button>
        </BottomSheet>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// 8. SICHTBARKEIT
// ══════════════════════════════════════════════════════════════
function Sichtbarkeit({ profile, loading, isOwner }) {
  const [selected, setSelected] = useState("connections");

  useEffect(() => {
    if (profile?.focus_type && ["public","connections","private"].includes(profile.focus_type))
      setSelected(profile.focus_type);
  }, [profile?.focus_type]);

  async function choose(key) {
    setSelected(key);
    if (isOwner) {
      const { data:{ user } } = await supabase.auth.getUser();
      await supabase.from("profiles").update({ focus_type:key }).eq("id", user.id);
    }
  }

  const VIS = [
    {
      key:"public",
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
      label:"Öffentlich", sub:"Für alle sichtbar",
    },
    {
      key:"connections",
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      label:"Verbindungen", sub:"Nur für deine Verbindungen",
    },
    {
      key:"private",
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
      label:"Privat", sub:"Nur für dich",
    },
  ];

  return (
    <div className="mtp-sec">
      <div className="mtp-sec-pad">
        <SecHdr title="Sichtbarkeit" sub="Wähle, wer dein Profil sehen kann." isOwner={false}/>
        {loading ? (
          <div style={{ height:72, background:"rgba(26,26,24,0.05)", borderRadius:8 }}/>
        ) : (
          <div style={{ display:"flex", gap:8 }}>
            {VIS.map(opt => {
              const active = selected === opt.key;
              return (
                <button key={opt.key} onClick={() => isOwner && choose(opt.key)} style={{
                  flex:1, padding:"12px 6px 14px", borderRadius:14,
                  border:`1.5px solid ${active ? "#0EC4B8" : "rgba(26,26,24,0.09)"}`,
                  background: active ? "rgba(14,196,184,0.10)" : "#FFFFFF",
                  cursor: isOwner ? "pointer" : "default",
                  touchAction:"manipulation", fontFamily:"inherit",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                  transition:"all .18s ease",
                  boxShadow: active ? "0 0 0 1px rgba(14,196,184,0.22)" : "0 1px 3px rgba(26,26,24,0.06)",
                }}>
                  <span style={{ color: active ? "#0EC4B8" : "rgba(26,26,24,0.32)" }}>{opt.icon}</span>
                  <span style={{ fontSize:12, fontWeight:700, color: active ? "#0EC4B8" : "#1A1A18" }}>{opt.label}</span>
                  <span style={{ fontSize:10.5, color: active ? "#0EC4B8" : "rgba(26,26,24,0.32)", textAlign:"center", lineHeight:1.3 }}>{opt.sub}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════
export default function MyTalentProfile({ onClose, profileId, viewerMode = false }) {
  const [profile,       setProfile]       = useState(null);
  const [wirkerProfile, setWirkerProfile] = useState(null);
  const [userId,        setUserId]        = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [mounted,       setMounted]       = useState(false);
  const isOwner = !viewerMode && !profileId;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        let id = profileId;
        if (!id) {
          const { data:{ user } } = await supabase.auth.getUser();
          id = user?.id;
        }
        if (!id) { setLoading(false); return; }
        setUserId(id);

        // profiles laden
        const { data: pData } = await supabase.from("profiles")
          .select("id,username,display_name,bio,avatar_url,header_img,location,has_talent_profile,role,membership_type,focus_type")
          .eq("id", id).single();
        setProfile(pData || null);

        // wirker_profiles laden — Quelle der Wahrheit für Talent-Daten
        const { data: wpData, error: wpErr } = await supabase
          .from("wirker_profiles")
          .select("id,user_id,slug,talent,categories,location_label,avatar_url,header_img,hourly_rate,is_verified,rating_avg,booking_count")
          .eq("user_id", id)
          .single();
        if (wpErr) console.warn("[MyTalentProfile] wirker_profiles:", wpErr.message);
        setWirkerProfile(wpData || null);
      } catch(e) { console.warn("MyTalentProfile:", e); }
      setLoading(false);
    })();
  }, [profileId]);

  return (
    <div className="mtp-root" style={{
      position:"fixed", inset:0, zIndex:9500,
      display:"flex", flexDirection:"column",
      opacity: mounted ? 1 : 0,
      transform: mounted ? "none" : "translateY(12px)",
      transition:"opacity .32s ease, transform .32s cubic-bezier(.22,1,.36,1)",
    }}>
      <style>{CSS}</style>

      <div className="mtp-scroll" style={{
        flex:1, overflowY:"auto",
        paddingBottom:"max(80px,calc(64px + env(safe-area-inset-bottom,0px)))",
      }}>
        {/* 0. Titel */}
        <PageTitle isOwner={isOwner}/>

        {/* 1. Cover + Avatar */}
        <ProfileHeader profile={profile} loading={loading} isOwner={isOwner}/>
        <Gap h={52}/>

        {/* 2. Über mich */}
        <UeberMich profile={profile} loading={loading} isOwner={isOwner}/>
        <Gap/>

        {/* 3. Meine Talente & Angebote */}
        <TalenteAngebote loading={loading} isOwner={isOwner} wirkerProfile={wirkerProfile} userId={userId}/>
        <Gap/>

        {/* 4. Meine Werke */}
        <MeineWerke loading={loading} isOwner={isOwner} userId={userId}/>
        <Gap/>

        {/* 5. Erlebnisse & Projekte */}
        <ErlebnisseProjekte loading={loading} isOwner={isOwner}/>
        <Gap/>

        {/* 6. Kundenstimmen */}
        <Kundenstimmen loading={loading} isOwner={isOwner}/>
        <Gap/>

        {/* 7. Verfügbarkeit + Standort */}
        <VerfuegbarkeitStandort profile={profile} loading={loading} isOwner={isOwner}/>
        <Gap/>

        {/* 8. Sichtbarkeit */}
        <Sichtbarkeit profile={profile} loading={loading} isOwner={isOwner}/>

        <Gap h={32}/>
      </div>
    </div>
  );
}
