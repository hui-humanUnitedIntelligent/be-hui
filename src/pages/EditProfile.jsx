// EditProfile.jsx — HUI Creator Profile Editor
// Instagram-Level UX: alle Felder, Avatar Upload, Preview-Mode
// isOwner-only — wird als Overlay aus WirkerProfilePage geöffnet

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

const C = {
  bg:     "#F9F7F4",
  card:   "#FFFFFF",
  teal:   "#16D7C5",
  teal2:  "#12B8A8",
  coral:  "#FF8A6B",
  ink:    "#1A1A1A",
  ink2:   "#3D3D3D",
  muted:  "rgba(60,60,60,0.48)",
  border: "rgba(0,0,0,0.07)",
  input:  "rgba(0,0,0,0.04)",
};

const MOODS = ["ruhig","kreativ","energetisch","spielerisch","professionell","warmherzig","mutig","subtil"];
const CATEGORIES = ["Fotografie","Illustration","Musik","Design","Kochen","Workshops","Handwerk","Natur","Mode","Schreiben","Film","Tanz","Sport","Wellness","Coaching"];
const LANGUAGES = ["Deutsch","Englisch","Französisch","Spanisch","Italienisch","Portugiesisch","Arabisch","Chinesisch","Japanisch","Türkisch"];

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:11, fontWeight:800, color:C.muted, letterSpacing:1.1,
        textTransform:"uppercase", marginBottom:6 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{hint}</div>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, multiline, rows=4 }) {
  const style = {
    width:"100%", padding:"13px 16px", borderRadius:14,
    border:`1.5px solid ${C.border}`, background:C.input,
    fontSize:14, color:C.ink, fontFamily:"inherit",
    outline:"none", resize:"none", boxSizing:"border-box",
    transition:"border-color .15s",
  };
  if (multiline) return (
    <textarea value={value} onChange={onChange} placeholder={placeholder}
      rows={rows} style={style} />
  );
  return <input value={value} onChange={onChange} placeholder={placeholder} style={style} />;
}

function TagPicker({ options, selected, onToggle, color = C.teal }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
      {options.map(opt => {
        const active = selected.includes(opt);
        return (
          <button key={opt} onClick={() => onToggle(opt)}
            style={{
              padding:"7px 13px", borderRadius:50,
              background: active ? color : "rgba(0,0,0,0.04)",
              border: active ? "none" : `1.5px solid ${C.border}`,
              fontSize:12.5, fontWeight: active ? 700 : 500,
              color: active ? "white" : C.ink2,
              cursor:"pointer", fontFamily:"inherit",
              transition:"all .14s ease",
            }}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function EditProfile({ user, profile: initProfile, onClose, onSave }) {
  const { profile: authProfile } = useAuth();
  const src = initProfile || authProfile;

  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [preview,  setPreview]  = useState(false);
  const [section,  setSection]  = useState("basis"); // "basis"|"creator"|"links"|"verfuegbarkeit"
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    display_name:  src?.display_name  || "",
    username:      src?.username      || "",
    bio:           src?.bio           || "",
    location:      src?.location      || src?.location_label || "",
    website:       src?.website       || "",
    talent:        src?.talent        || "",
    focus_type:    src?.focus_type    || "hybrid",
    hourly_rate:   src?.hourly_rate   || "",
    categories:    Array.isArray(src?.categories) ? src.categories : [],
    mood_tags:     Array.isArray(src?.mood_tags)  ? src.mood_tags  : [],
    languages:     Array.isArray(src?.languages)  ? src.languages  : ["Deutsch"],
    instagram:     src?.instagram     || "",
    tiktok:        src?.tiktok        || "",
    linkedin:      src?.linkedin      || "",
    avatar_url:    src?.avatar_url    || "",
    header_img:    src?.header_img    || "",
    is_available:  src?.is_available  ?? true,
  });

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const toggle = (key, val) => setForm(f => {
    const arr = f[key] || [];
    return { ...f, [key]: arr.includes(val) ? arr.filter(x=>x!==val) : [...arr, val] };
  });

  // Avatar Upload
  async function uploadAvatar(file) {
    if (!file || !user?.id) return;
    const ext  = file.name.split('.').pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error } = await supabase.storage.from('media').upload(path, file, { upsert:true });
    if (error) { console.error('Avatar Upload:', error); return; }
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    setForm(f => ({ ...f, avatar_url: data.publicUrl }));
  }

  async function handleSave() {
    if (!user?.id) return;
    setSaving(true);
    const updates = {
      id:           user.id,
      display_name: form.display_name,
      username:     form.username.replace(/\s/g,'').toLowerCase(),
      bio:          form.bio,
      location:     form.location,
      location_label: form.location,
      website:      form.website,
      talent:       form.talent,
      focus_type:   form.focus_type,
      categories:   form.categories,
      mood_tags:    form.mood_tags,
      languages:    form.languages,
      is_available: form.is_available,
      avatar_url:   form.avatar_url,
      header_img:   form.header_img,
      updated_at:   new Date().toISOString(),
    };
    await supabase.from('profiles').upsert(updates);
    // Wirker-Profil auch updaten wenn vorhanden
    const { data: wp } = await supabase.from('wirker_profiles')
      .select('id').eq('user_id', user.id).single();
    if (wp) {
      await supabase.from('wirker_profiles').update({
        talent:      form.talent,
        hourly_rate: +form.hourly_rate || 0,
        categories:  form.categories,
        avatar_url:  form.avatar_url,
        header_img:  form.header_img,
        updated_at:  new Date().toISOString(),
      }).eq('user_id', user.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onSave?.(updates); }, 1400);
  }

  const SECTIONS = [
    { key:"basis",          label:"Basis" },
    { key:"creator",        label:"Creator" },
    { key:"links",          label:"Links" },
    { key:"verfuegbarkeit", label:"Verfügbar" },
  ];

  if (preview) return (
    <div style={{ position:"fixed", inset:0, zIndex:950, background:C.bg,
      fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif", overflowY:"auto" }}>
      <div style={{ padding:"max(52px,env(safe-area-inset-top,52px)) 20px 20px",
        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.muted }}>Vorschau</div>
        <button onClick={() => setPreview(false)}
          style={{ padding:"8px 16px", borderRadius:50, background:C.teal,
            color:"white", border:"none", fontWeight:700, fontSize:13, fontFamily:"inherit" }}>
          ← Bearbeiten
        </button>
      </div>
      {/* Profil Preview */}
      <div style={{ padding:"0 20px 40px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20 }}>
          <div style={{ width:72, height:72, borderRadius:"50%", flexShrink:0,
            background:`linear-gradient(135deg,${C.teal},${C.coral})`,
            overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {form.avatar_url
              ? <img src={form.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              : <span style={{ fontSize:28, color:"white" }}>{(form.display_name||"?")[0]?.toUpperCase()}</span>}
          </div>
          <div>
            <div style={{ fontSize:18, fontWeight:900, color:C.ink }}>{form.display_name || "Dein Name"}</div>
            <div style={{ fontSize:13, color:C.muted }}>@{form.username || "username"}</div>
            {form.talent && <div style={{ fontSize:12, color:C.teal, fontWeight:700, marginTop:2 }}>{form.talent}</div>}
          </div>
        </div>
        {form.bio && (
          <div style={{ fontSize:14, color:C.ink2, lineHeight:1.6, marginBottom:16 }}>{form.bio}</div>
        )}
        {form.location && (
          <div style={{ fontSize:13, color:C.muted, marginBottom:8 }}>📍 {form.location}</div>
        )}
        {form.categories.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {form.categories.map(c => (
              <span key={c} style={{ padding:"5px 11px", borderRadius:50,
                background:"rgba(22,215,197,0.1)", color:C.teal,
                fontSize:12, fontWeight:700 }}>{c}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, zIndex:950, background:C.bg,
      fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif", overflowY:"auto" }}>

      {/* ── Header ── */}
      <div style={{
        position:"sticky", top:0, zIndex:10,
        background:"rgba(249,246,242,0.95)", backdropFilter:"blur(20px)",
        borderBottom:`1px solid ${C.border}`,
        padding:"max(52px,env(safe-area-inset-top,52px)) 16px 12px",
        display:"flex", alignItems:"center", gap:12,
      }}>
        <button onClick={onClose}
          style={{ width:36, height:36, borderRadius:12,
            background:"rgba(0,0,0,0.06)", border:`1.5px solid ${C.border}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, cursor:"pointer", color:C.ink }}>
          ←
        </button>
        <div style={{ flex:1, fontWeight:800, fontSize:17, color:C.ink, letterSpacing:-0.3 }}>
          Profil bearbeiten
        </div>
        <button onClick={() => setPreview(true)}
          style={{ padding:"8px 14px", borderRadius:50,
            background:"rgba(0,0,0,0.05)", border:`1.5px solid ${C.border}`,
            fontSize:12.5, fontWeight:700, color:C.ink2, fontFamily:"inherit" }}>
          Vorschau
        </button>
        <button onClick={handleSave} disabled={saving}
          style={{ padding:"9px 18px", borderRadius:50,
            background: saved ? "#10B981" : `linear-gradient(135deg,${C.teal},${C.teal2})`,
            border:"none", fontSize:13, fontWeight:800,
            color:"white", fontFamily:"inherit",
            boxShadow: saved ? "0 4px 14px rgba(16,185,129,0.35)" : `0 4px 14px rgba(22,215,197,0.35)`,
            transition:"all .18s ease" }}>
          {saved ? "✓ Gespeichert" : saving ? "..." : "Speichern"}
        </button>
      </div>

      {/* ── Section Tabs ── */}
      <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${C.border}`,
        background:C.card, overflowX:"auto", padding:"0 4px" }}>
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => setSection(s.key)}
            style={{
              padding:"12px 18px", border:"none", background:"none",
              fontSize:13, fontWeight: section===s.key ? 800 : 500,
              color: section===s.key ? C.teal : C.muted,
              borderBottom: section===s.key ? `2.5px solid ${C.teal}` : "2.5px solid transparent",
              cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap",
              transition:"all .14s",
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ padding:"20px 20px 80px" }}>

        {/* ══ BASIS ══ */}
        {section === "basis" && (<>
          {/* Avatar */}
          <Field label="Profilbild">
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ width:72, height:72, borderRadius:"50%", flexShrink:0,
                background:`linear-gradient(135deg,${C.teal},${C.coral})`,
                overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center",
                cursor:"pointer", position:"relative" }}
                onClick={() => fileRef.current?.click()}>
                {form.avatar_url
                  ? <img src={form.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : <span style={{ fontSize:26, color:"white" }}>{(form.display_name||"?")[0]?.toUpperCase()}</span>}
                <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.3)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  opacity:0, transition:"opacity .15s" }}
                  onMouseEnter={e=>e.currentTarget.style.opacity=1}
                  onMouseLeave={e=>e.currentTarget.style.opacity=0}>
                  <span style={{ fontSize:20 }}>📷</span>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }}
                onChange={e => uploadAvatar(e.target.files[0])} />
              <div>
                <button onClick={() => fileRef.current?.click()}
                  style={{ padding:"9px 16px", borderRadius:50, background:"rgba(0,0,0,0.05)",
                    border:`1.5px solid ${C.border}`, fontSize:13, fontWeight:700,
                    color:C.ink, cursor:"pointer", fontFamily:"inherit" }}>
                  Foto ändern
                </button>
                <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>JPG, PNG — max 5MB</div>
              </div>
            </div>
          </Field>

          <Field label="Anzeigename">
            <TextInput value={form.display_name} onChange={set("display_name")}
              placeholder="Dein vollständiger Name" />
          </Field>

          <Field label="Username" hint="Deine öffentliche Profil-URL: hui.app/@username">
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)",
                color:C.muted, fontSize:14 }}>@</span>
              <input value={form.username} onChange={set("username")}
                placeholder="username"
                style={{ width:"100%", padding:"13px 16px 13px 30px", borderRadius:14,
                  border:`1.5px solid ${C.border}`, background:C.input, fontSize:14,
                  color:C.ink, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
            </div>
          </Field>

          <Field label="Bio" hint="Max 160 Zeichen — wird auf deinem Profil angezeigt">
            <TextInput value={form.bio} onChange={set("bio")} multiline rows={4}
              placeholder="Erzähl der Community etwas über dich — was bewegst du?" />
            <div style={{ textAlign:"right", fontSize:11, color:form.bio.length>160?C.coral:C.muted, marginTop:3 }}>
              {form.bio.length}/160
            </div>
          </Field>

          <Field label="Standort">
            <TextInput value={form.location} onChange={set("location")}
              placeholder="z.B. Berlin, Hamburg, München …" />
          </Field>

          <Field label="Website">
            <TextInput value={form.website} onChange={set("website")}
              placeholder="https://deine-website.de" />
          </Field>
        </>)}

        {/* ══ CREATOR ══ */}
        {section === "creator" && (<>
          <Field label="Dein Talent / Hauptangebot">
            <TextInput value={form.talent} onChange={set("talent")}
              placeholder="z.B. Modefotografin, Tontechniker, Illustratorin …" />
          </Field>

          <Field label="Fokus">
            <div style={{ display:"flex", gap:8 }}>
              {[
                { key:"hybrid",     label:"🔀 Werke & Erlebnisse" },
                { key:"works",      label:"🎨 Nur Werke" },
                { key:"services",   label:"✨ Nur Erlebnisse" },
              ].map(opt => (
                <button key={opt.key} onClick={() => setForm(f => ({...f, focus_type: opt.key}))}
                  style={{
                    flex:1, padding:"11px 6px", borderRadius:14, fontFamily:"inherit",
                    background: form.focus_type===opt.key ? `linear-gradient(135deg,${C.teal},${C.teal2})` : "rgba(0,0,0,0.04)",
                    border: form.focus_type===opt.key ? "none" : `1.5px solid ${C.border}`,
                    fontSize:11.5, fontWeight: form.focus_type===opt.key ? 800 : 500,
                    color: form.focus_type===opt.key ? "white" : C.ink2,
                    cursor:"pointer", transition:"all .14s", textAlign:"center",
                    boxShadow: form.focus_type===opt.key ? `0 4px 14px rgba(22,215,197,0.3)` : "none",
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Stundensatz (optional)">
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)",
                color:C.muted, fontSize:14 }}>€</span>
              <input value={form.hourly_rate} onChange={set("hourly_rate")}
                type="number" placeholder="0"
                style={{ width:"100%", padding:"13px 16px 13px 30px", borderRadius:14,
                  border:`1.5px solid ${C.border}`, background:C.input, fontSize:14,
                  color:C.ink, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
            </div>
          </Field>

          <Field label="Kategorien" hint="Wähle bis zu 5 die zu dir passen">
            <TagPicker options={CATEGORIES} selected={form.categories}
              onToggle={v => toggle("categories", v)} color={C.teal} />
          </Field>

          <Field label="Atmosphäre / Mood" hint="Wie würde man deine Energie beschreiben?">
            <TagPicker options={MOODS} selected={form.mood_tags}
              onToggle={v => toggle("mood_tags", v)} color={C.coral} />
          </Field>

          <Field label="Sprachen">
            <TagPicker options={LANGUAGES} selected={form.languages}
              onToggle={v => toggle("languages", v)} color="#8B5CF6" />
          </Field>
        </>)}

        {/* ══ LINKS ══ */}
        {section === "links" && (<>
          <div style={{ fontSize:14, color:C.muted, marginBottom:20, lineHeight:1.6 }}>
            Verbinde deine Social-Konten — sichtbar auf deinem Profil.
          </div>
          {[
            { key:"instagram", label:"Instagram", icon:"📸", prefix:"instagram.com/" },
            { key:"tiktok",    label:"TikTok",    icon:"🎵", prefix:"tiktok.com/@" },
            { key:"linkedin",  label:"LinkedIn",  icon:"💼", prefix:"linkedin.com/in/" },
          ].map(s => (
            <Field key={s.key} label={`${s.icon} ${s.label}`}>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)",
                  color:C.muted, fontSize:11.5, fontWeight:600 }}>{s.prefix}</span>
                <input value={form[s.key]} onChange={set(s.key)}
                  placeholder="dein_nutzername"
                  style={{ width:"100%", padding:`13px 16px 13px ${s.prefix.length * 7.5 + 14}px`,
                    borderRadius:14, border:`1.5px solid ${C.border}`, background:C.input,
                    fontSize:14, color:C.ink, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
              </div>
            </Field>
          ))}
        </>)}

        {/* ══ VERFÜGBARKEIT ══ */}
        {section === "verfuegbarkeit" && (<>
          <Field label="Status">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"16px 18px", borderRadius:16, background:C.card,
              border:`1.5px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:C.ink }}>
                  {form.is_available ? "✅ Ich nehme Anfragen an" : "⏸ Aktuell nicht verfügbar"}
                </div>
                <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                  {form.is_available
                    ? "Du erscheinst in der Suche und kannst gebucht werden."
                    : "Du bist versteckt — keine neuen Buchungsanfragen."}
                </div>
              </div>
              <div onClick={() => setForm(f => ({...f, is_available: !f.is_available}))}
                style={{
                  width:48, height:28, borderRadius:50, cursor:"pointer",
                  background: form.is_available ? C.teal : "rgba(0,0,0,0.15)",
                  position:"relative", transition:"background .2s",
                  flexShrink:0,
                }}>
                <div style={{
                  position:"absolute", top:3, transition:"left .2s",
                  left: form.is_available ? 23 : 3,
                  width:22, height:22, borderRadius:"50%", background:"white",
                  boxShadow:"0 1px 4px rgba(0,0,0,0.2)",
                }} />
              </div>
            </div>
          </Field>

          <div style={{ padding:"16px 18px", borderRadius:16, background:"rgba(22,215,197,0.06)",
            border:"1.5px solid rgba(22,215,197,0.15)", fontSize:13, color:C.ink2, lineHeight:1.6 }}>
            <div style={{ fontWeight:700, marginBottom:4 }}>🗓 Detaillierter Kalender</div>
            Gehe zu <strong>Creator Tools → Verfügbarkeit</strong> um einzelne Tage
            und Zeitslots zu blockieren oder freizugeben.
          </div>
        </>)}

      </div>
    </div>
  );
}
