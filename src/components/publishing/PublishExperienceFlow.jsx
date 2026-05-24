// src/components/publishing/PublishExperienceFlow.jsx
// Phase 4 — Creator Experience Creator
// experiences(user_id, title, description, price, duration, format, location_text,
//             category, max_participants, date, status, cover_url)

import React, { useState, useRef, useCallback } from "react";
import { publishExperience } from "../../lib/factories/experienceContract.js";
import { supabase } from "../../lib/supabaseClient";
import { useAuth }  from "../../lib/AuthContext.jsx";

const C = {
  teal:"#16D7C5", coral:"#FF8A6B", cream:"#F9F7F4",
  ink:"#1A1A2E", muted:"rgba(80,80,80,0.55)", glass:"rgba(255,255,255,0.88)",
};

const FORMATS = ["Online","Vor Ort","Hybrid","Outdoor","Studio","Atelier"];
const CATS    = ["Keramik","Malerei","Musik","Tanz","Yoga","Kochen","Schreiben",
                 "Fotografie","Holz","Design","Natur","Sonstiges"];

export default function PublishExperienceFlow({ onClose, onPublished }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title:"", description:"", price:"", duration:"",
    format:"Vor Ort", location_text:"", category:"",
    max_participants:"", date:"",
  });
  const [cover,    setCover]    = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);
  const fileRef = useRef();

  const handleCover = useCallback(e => {
    const file = e.target.files?.[0];
    if (file) setCover({ url: URL.createObjectURL(file), file });
  }, []);

  const handleSave = useCallback(async () => {
    if (!user?.id) return setError("Nicht eingeloggt.");
    if (!form.title) return setError("Bitte Titel angeben.");
    setSaving(true); setError(null);
    try {
      let cover_url = null;
      if (cover?.file) {
        const ext  = cover.file.name.split(".").pop();
        const path = `experiences/${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("media").upload(path, cover.file, { upsert: true });
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
          cover_url = publicUrl;
        }
      }

      // Contract Layer: normalize → validate → insert (Phase 4E)
      const coverUrls = cover_url ? [cover_url] : [];
      const { data, error: contractErr } = await publishExperience(
        supabase, form, user.id, coverUrls
      );
      if (contractErr) throw new Error(contractErr.message);
      console.log("[HUI_REALITY] ✓ experience published:", data?.id);
      onPublished?.({ id: data?.id, ...form });
      onClose?.();
    } catch(err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [user, form, cover, onPublished, onClose]);

  const Field = ({ label, ...props }) => (
    <div>
      <div style={{ fontSize:12, fontWeight:600, color:C.muted, marginBottom:5 }}>{label}</div>
      <input {...props} style={{
        width:"100%", padding:"11px 14px", borderRadius:12,
        border:"1.5px solid rgba(0,0,0,0.10)", background:C.glass,
        fontSize:14, boxSizing:"border-box", fontFamily:"inherit", outline:"none",
      }}/>
    </div>
  );

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:12001,
      background:"rgba(0,0,0,0.75)", backdropFilter:"blur(20px)",
      display:"flex", alignItems:"flex-end", justifyContent:"center",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
    }}>
      <div style={{
        width:"100%", maxWidth:480, background:C.cream,
        borderRadius:"24px 24px 0 0",
        padding:"0 0 env(safe-area-inset-bottom,16px)",
        maxHeight:"94vh", overflowY:"auto",
      }}>
        <div style={{ padding:"12px 0 0", display:"flex", justifyContent:"center" }}>
          <div style={{ width:36, height:4, borderRadius:2, background:"rgba(0,0,0,0.12)" }}/>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px 8px" }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:C.ink }}>Erlebnis erstellen</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:C.muted }}>x</button>
        </div>

        <div style={{ padding:"0 20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
          {/* Cover */}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleCover} style={{ display:"none" }}/>
          {cover?.url
            ? <div style={{ borderRadius:16, overflow:"hidden", height:160, position:"relative" }}>
                <img src={cover.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                <button onClick={() => setCover(null)} style={{
                  position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.5)",
                  border:"none", color:"#fff", borderRadius:20, padding:"4px 10px",
                  fontSize:12, cursor:"pointer",
                }}>x</button>
              </div>
            : <button onClick={() => fileRef.current?.click()} style={{
                height:120, borderRadius:16, border:"2px dashed rgba(22,215,197,0.4)",
                background:"rgba(22,215,197,0.04)", cursor:"pointer",
                display:"flex", flexDirection:"column", alignItems:"center",
                justifyContent:"center", gap:8, color:C.muted,
              }}>
                <span style={{ fontSize:28 }}>🌟</span>
                <span style={{ fontSize:13, fontWeight:600 }}>Coverbild wählen</span>
              </button>
          }

          <Field label="Titel *" placeholder="z.B. Keramik-Abend im Atelier"
            value={form.title} onChange={e => setForm(f => ({...f,title:e.target.value}))}/>

          <div>
            <div style={{ fontSize:12, fontWeight:600, color:C.muted, marginBottom:5 }}>Beschreibung</div>
            <textarea
              placeholder="Was erwartet die Teilnehmenden? Was ist besonders?"
              value={form.description}
              onChange={e => setForm(f => ({...f,description:e.target.value}))}
              rows={3}
              style={{
                width:"100%", padding:"11px 14px", borderRadius:12,
                border:"1.5px solid rgba(0,0,0,0.10)", background:C.glass,
                fontSize:14, resize:"none", boxSizing:"border-box",
                fontFamily:"inherit", outline:"none",
              }}
            />
          </div>

          {/* Format */}
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:C.muted, marginBottom:6 }}>Format</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {FORMATS.map(f => (
                <button key={f} onClick={() => setForm(x => ({...x,format:f}))} style={{
                  padding:"6px 12px", borderRadius:99, border:"none",
                  background: form.format === f ? `linear-gradient(135deg,${C.teal},${C.coral})` : "rgba(0,0,0,0.07)",
                  color: form.format === f ? "#fff" : C.muted,
                  fontSize:12, fontWeight:600, cursor:"pointer",
                }}>{f}</button>
              ))}
            </div>
          </div>

          {/* Kategorie */}
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:C.muted, marginBottom:6 }}>Kategorie</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {CATS.map(cat => (
                <button key={cat} onClick={() => setForm(f => ({...f,category:cat===form.category?"":cat}))} style={{
                  padding:"6px 12px", borderRadius:99, border:"none",
                  background: form.category === cat ? `linear-gradient(135deg,${C.teal},${C.coral})` : "rgba(0,0,0,0.07)",
                  color: form.category === cat ? "#fff" : C.muted,
                  fontSize:12, fontWeight:600, cursor:"pointer",
                }}>{cat}</button>
              ))}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <Field label="Preis (EUR)" type="number" placeholder="18"
              value={form.price} onChange={e => setForm(f => ({...f,price:e.target.value}))}/>
            <Field label="Dauer" placeholder="z.B. 2h"
              value={form.duration} onChange={e => setForm(f => ({...f,duration:e.target.value}))}/>
            <Field label="Max. Teilnehmende" type="number" placeholder="8"
              value={form.max_participants} onChange={e => setForm(f => ({...f,max_participants:e.target.value}))}/>
            <Field label="Datum" type="date"
              value={form.date} onChange={e => setForm(f => ({...f,date:e.target.value}))}/>
          </div>

          <Field label="Ort" placeholder="z.B. Atelier Nord, Hamburg"
            value={form.location_text} onChange={e => setForm(f => ({...f,location_text:e.target.value}))}/>

          {error && (
            <div style={{ padding:"10px 14px", borderRadius:10,
              background:"rgba(255,80,80,0.08)", color:"#E53E3E", fontSize:13 }}>{error}</div>
          )}

          <button onClick={handleSave} disabled={saving} style={{
            padding:16, borderRadius:16,
            background: saving ? "rgba(0,0,0,0.1)" : `linear-gradient(135deg,${C.teal},${C.coral})`,
            border:"none", color: saving ? C.muted : "#fff",
            fontSize:16, fontWeight:700, cursor: saving ? "not-allowed" : "pointer",
          }}>
            {saving ? "Erstellen..." : "Erlebnis veroeffentlichen"}
          </button>
        </div>
      </div>
    </div>
  );
}
