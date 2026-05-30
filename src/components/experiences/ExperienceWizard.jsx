// src/components/experiences/ExperienceWizard.jsx
// HUI – Erlebnis-Editor als 9-Schritte-Wizard
// Architektur: 1:1 nach WerkWizard.jsx — gleiche Bausteine, andere Felder
import React, { useState, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient.js";

const C = {
  teal:"#0EC4B8", tealD:"#0DBBAF", cream:"#F8F7F4",
  ink:"#1A1A18", inkMid:"rgba(26,26,24,0.55)",
  inkFade:"rgba(26,26,24,0.35)", border:"rgba(26,26,24,0.10)",
};

const EXP_TYPEN = [
  { id:"workshop",    icon:"🛠️",  label:"Workshop",     sub:"Aktives Mitmachen und gemeinsam Lernen." },
  { id:"event",       icon:"🎉",  label:"Event",        sub:"Veranstaltung mit besonderem Erlebnis-Charakter." },
  { id:"projekt",     icon:"🌱",  label:"Projekt",      sub:"Längerfristige Initiative oder Kooperation." },
  { id:"ausstellung", icon:"🖼️",  label:"Ausstellung",  sub:"Präsentation von Werken oder Ideen." },
  { id:"kurs",        icon:"📚",  label:"Kurs",         sub:"Strukturiertes Lernangebot über mehrere Einheiten." },
  { id:"tour",        icon:"🗺️",  label:"Tour",         sub:"Geführte Reise oder Erkundung." },
];

const SICHTBARKEIT = [
  { id:"public",      icon:"🌍", label:"Öffentlich",    sub:"Sichtbar im HUI-Feed und Talent-Profil." },
  { id:"connections", icon:"🔗", label:"Verbindungen",  sub:"Nur für Menschen in deinem Netzwerk." },
  { id:"private",     icon:"🔒", label:"Privat",        sub:"Nur für dich sichtbar." },
];

// ── Gemeinsame Bausteine (identisch zu WerkWizard) ────────────
function ProgressBar({ step, total }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:0 }}>
      {Array.from({ length: total }, (_, i) => {
        const n=i+1; const done=n<step; const cur=n===step;
        return (
          <React.Fragment key={n}>
            <div style={{
              width:cur?26:20, height:cur?26:20, borderRadius:"50%",
              background:(done||cur)?C.teal:"rgba(26,26,24,0.09)",
              border:cur?`2.5px solid ${C.teal}`:"none",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:cur?11:9, fontWeight:700,
              color:(done||cur)?"#fff":C.inkFade,
              flexShrink:0, transition:"all .22s",
              boxShadow:cur?"0 0 0 4px rgba(14,196,184,0.18)":"none",
            }}>{done?"✓":n}</div>
            {i<total-1&&<div style={{ flex:1, height:2, minWidth:4, background:done?C.teal:"rgba(26,26,24,0.09)", transition:"background .22s" }}/>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function TopBar({ onClose, step, total, isEdit }) {
  return (
    <div style={{ padding:"14px 20px 12px", background:"#fff", borderBottom:`1px solid ${C.border}` }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <button onClick={onClose} style={{ background:"none", border:"none", padding:0, fontSize:13, fontWeight:600, color:C.inkMid, cursor:"pointer", touchAction:"manipulation" }}>Abbrechen</button>
        <div style={{ fontSize:14, fontWeight:700, color:C.ink }}>{isEdit?"Erlebnis bearbeiten":"Erlebnis erstellen"}</div>
        <button onClick={onClose} style={{ width:28, height:28, borderRadius:"50%", background:"rgba(26,26,24,0.07)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", touchAction:"manipulation" }}>
          <span style={{ fontSize:14, color:C.ink }}>×</span>
        </button>
      </div>
      <ProgressBar step={step} total={total}/>
    </div>
  );
}

const INP = {
  width:"100%", boxSizing:"border-box",
  padding:"13px 15px", borderRadius:12,
  border:"1.5px solid rgba(26,26,24,0.10)",
  outline:"none", fontSize:15, fontFamily:"inherit",
  color:"#1A1A18", background:"#fff",
  WebkitAppearance:"none", appearance:"none",
};

function Lbl({ text, req }) {
  return <div style={{ fontSize:12, fontWeight:700, color:C.inkMid, marginBottom:6 }}>{text}{req&&<span style={{ color:C.teal, marginLeft:2 }}>*</span>}</div>;
}
function FI({ label, req, value, onChange, placeholder, maxLen, type="text", inputMode }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label&&<Lbl text={label} req={req}/>}
      <input type={type} inputMode={inputMode} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} maxLength={maxLen} style={INP}/>
      {maxLen&&<div style={{ textAlign:"right", fontSize:11, color:C.inkFade, marginTop:3 }}>{value.length}/{maxLen}</div>}
    </div>
  );
}
function FTA({ label, req, value, onChange, placeholder, maxLen, rows=3 }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label&&<Lbl text={label} req={req}/>}
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} maxLength={maxLen} style={{ ...INP, resize:"none", lineHeight:1.6 }}/>
      {maxLen&&<div style={{ textAlign:"right", fontSize:11, color:C.inkFade, marginTop:3 }}>{value.length}/{maxLen}</div>}
    </div>
  );
}
function RCard({ active, icon, label, sub, onClick }) {
  return (
    <div onClick={onClick} style={{ display:"flex", alignItems:"center", gap:14, padding:"16px", borderRadius:14, border:active?`2px solid ${C.teal}`:`1.5px solid ${C.border}`, background:active?"rgba(14,196,184,0.07)":"#fff", cursor:"pointer", transition:"all .15s", touchAction:"manipulation", minHeight:60 }}>
      <div style={{ width:20, height:20, borderRadius:"50%", border:active?`2px solid ${C.teal}`:`2px solid ${C.border}`, background:active?C.teal:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {active&&<div style={{ width:7, height:7, borderRadius:"50%", background:"#fff" }}/>}
      </div>
      {icon&&<div style={{ fontSize:18, flexShrink:0 }}>{icon}</div>}
      <div>
        <div style={{ fontSize:14, fontWeight:700, color:active?C.teal:C.ink }}>{label}</div>
        {sub&&<div style={{ fontSize:11.5, color:C.inkMid, marginTop:1 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Screen 1: Titel ───────────────────────────────────────────
function S1({ data, onChange }) {
  return (
    <div>
      <div style={{ fontSize:20, fontWeight:800, color:C.ink, marginBottom:4 }}>Titel</div>
      <div style={{ fontSize:13, color:C.inkMid, marginBottom:20, lineHeight:1.5 }}>Wie heißt dein Erlebnis?</div>
      <FI label="Titel" req value={data.title||""} onChange={v=>onChange({title:v})} placeholder="z. B. Acryl-Malkurs für Einsteiger" maxLen={80}/>
    </div>
  );
}

// ── Screen 2: Typ ─────────────────────────────────────────────
function S2({ data, onChange }) {
  return (
    <div>
      <div style={{ fontSize:20, fontWeight:800, color:C.ink, marginBottom:4 }}>Typ</div>
      <div style={{ fontSize:13, color:C.inkMid, marginBottom:16 }}>Was für ein Erlebnis ist es?</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {EXP_TYPEN.map(et=>(
          <RCard key={et.id} active={data.experience_type===et.id}
            icon={et.icon} label={et.label} sub={et.sub}
            onClick={()=>onChange({experience_type:et.id})}/>
        ))}
      </div>
    </div>
  );
}

// ── Screen 3: Bild(er) ────────────────────────────────────────
function S3({ data, onChange, userId }) {
  const [upl, setUpl] = useState(false);
  const ref = useRef(null);
  const imgs = data.images||[];

  async function upload(e) {
    const files = Array.from(e.target.files||[]);
    if (!userId||!files.length) return;
    setUpl(true);
    const next=[...imgs];
    for (const file of files.slice(0,5-next.length)) {
      const ext=file.name.split(".").pop().toLowerCase();
      const path=`experiences/${userId}/${Date.now()}_${Math.random().toString(36).slice(2,6)}.${ext}`;
      const { error }=await supabase.storage.from("media").upload(path,file,{ upsert:true });
      if (!error) {
        const { data:u }=supabase.storage.from("media").getPublicUrl(path);
        next.push({ url:u.publicUrl, path });
      }
    }
    onChange({ images:next });
    setUpl(false);
    if (ref.current) ref.current.value="";
  }

  return (
    <div>
      <div style={{ fontSize:20, fontWeight:800, color:C.ink, marginBottom:4 }}>Bild(er)</div>
      <div style={{ fontSize:13, color:C.inkMid, marginBottom:16, lineHeight:1.5 }}>Das erste Bild wird als Titelbild verwendet. Bis zu 5 Bilder.</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
        {imgs.map((img,idx)=>(
          <div key={idx} style={{ position:"relative", aspectRatio:"1", borderRadius:12, overflow:"hidden", background:"#e8e4df", border:idx===0?`2.5px solid ${C.teal}`:`1.5px solid ${C.border}` }}>
            <img src={img.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            {idx===0&&<div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent,rgba(14,196,184,0.82))", padding:"12px 5px 4px", fontSize:9, fontWeight:700, color:"#fff", textAlign:"center" }}>TITELBILD</div>}
            <button onClick={()=>onChange({ images:imgs.filter((_,i)=>i!==idx) })} style={{ position:"absolute", top:4, right:4, width:22, height:22, borderRadius:"50%", background:"rgba(0,0,0,0.55)", border:"none", color:"#fff", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", touchAction:"manipulation" }}>×</button>
          </div>
        ))}
        {imgs.length<5&&(
          <div onClick={()=>!upl&&ref.current?.click()} style={{ aspectRatio:"1", borderRadius:12, border:"2px dashed rgba(14,196,184,0.38)", background:"rgba(14,196,184,0.04)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:upl?"not-allowed":"pointer", gap:4, touchAction:"manipulation" }}>
            {upl
              ? <div style={{ fontSize:12, color:C.teal, fontWeight:600 }}>…</div>
              : <>
                  <div style={{ fontSize:22, color:C.teal, fontWeight:300, lineHeight:1 }}>+</div>
                  <div style={{ fontSize:9, color:C.teal, fontWeight:600, textAlign:"center", lineHeight:1.4 }}>Bild<br/>hinzufügen</div>
                </>
            }
          </div>
        )}
      </div>
      {imgs.length>0&&<div style={{ fontSize:11, color:C.inkFade, textAlign:"center", marginBottom:14 }}>{imgs.length}/5 Bilder</div>}
      <input ref={ref} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={upload}/>
    </div>
  );
}

// ── Screen 4: Beschreibung ────────────────────────────────────
function S4({ data, onChange }) {
  return (
    <div>
      <div style={{ fontSize:20, fontWeight:800, color:C.ink, marginBottom:4 }}>Beschreibung</div>
      <div style={{ fontSize:13, color:C.inkMid, marginBottom:16, lineHeight:1.5 }}>Was erwartet die Teilnehmenden?</div>
      <FTA label="Kurzbeschreibung" req value={data.caption||""} onChange={v=>onChange({caption:v})} placeholder="Ein inspirierender Workshop in kleiner Gruppe…" maxLen={120} rows={2}/>
      <FTA label="Detaillierte Beschreibung" value={data.description||""} onChange={v=>onChange({description:v})} placeholder="Wir tauchen gemeinsam ein in die Welt der Farben…" maxLen={1000} rows={5}/>
    </div>
  );
}

// ── Screen 5: Datum & Zeitraum ────────────────────────────────
function S5({ data, onChange }) {
  return (
    <div>
      <div style={{ fontSize:20, fontWeight:800, color:C.ink, marginBottom:4 }}>Datum & Zeitraum</div>
      <div style={{ fontSize:13, color:C.inkMid, marginBottom:20, lineHeight:1.5 }}>Wann findet das Erlebnis statt?</div>
      <FI label="Datum" type="date" value={data.date||""} onChange={v=>onChange({date:v})} placeholder=""/>
      <FI label="Dauer" value={data.duration||""} onChange={v=>onChange({duration:v})} placeholder="z. B. 3 Stunden, 2 Tage, regelmäßig dienstags" maxLen={60}/>
    </div>
  );
}

// ── Screen 6: Ort ─────────────────────────────────────────────
function S6({ data, onChange }) {
  const FORMAT = [
    { id:"vor_ort", label:"Vor Ort",  sub:"Physischer Treffpunkt." },
    { id:"online",  label:"Online",   sub:"Digitales Format, z. B. Zoom oder Meet." },
    { id:"hybrid",  label:"Hybrid",   sub:"Sowohl vor Ort als auch online möglich." },
  ];
  return (
    <div>
      <div style={{ fontSize:20, fontWeight:800, color:C.ink, marginBottom:4 }}>Ort</div>
      <div style={{ fontSize:13, color:C.inkMid, marginBottom:16, lineHeight:1.5 }}>Wo findet das Erlebnis statt?</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
        {FORMAT.map(f=>(
          <RCard key={f.id} active={data.format===f.id} label={f.label} sub={f.sub}
            onClick={()=>onChange({format:f.id})}/>
        ))}
      </div>
      {(data.format==="vor_ort"||data.format==="hybrid")&&(
        <FI label="Adresse / Ort" value={data.location_text||""} onChange={v=>onChange({location_text:v})} placeholder="z. B. Atelierstraße 12, Freiburg" maxLen={120}/>
      )}
    </div>
  );
}

// ── Screen 7: Teilnehmerzahl ──────────────────────────────────
function S7({ data, onChange }) {
  return (
    <div>
      <div style={{ fontSize:20, fontWeight:800, color:C.ink, marginBottom:4 }}>Teilnehmerzahl</div>
      <div style={{ fontSize:13, color:C.inkMid, marginBottom:20, lineHeight:1.5 }}>Wie viele Personen können teilnehmen? (optional)</div>
      <div style={{ marginBottom:14 }}>
        <Lbl text="Max. Teilnehmerzahl"/>
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute", left:15, top:"50%", transform:"translateY(-50%)", fontSize:18, color:"rgba(14,196,184,0.5)", pointerEvents:"none" }}>👥</span>
          <input
            type="number" min="1" max="9999"
            inputMode="numeric"
            value={data.max_participants||""}
            onChange={e=>onChange({max_participants:e.target.value})}
            placeholder="z. B. 12"
            style={{ ...INP, paddingLeft:44, fontSize:22, fontWeight:700 }}
          />
        </div>
        {data.max_participants&&(
          <div style={{ marginTop:6, fontSize:12, color:C.inkFade, paddingLeft:4 }}>
            Max. {data.max_participants} Teilnehmende
          </div>
        )}
      </div>
      <div style={{ padding:"14px 16px", borderRadius:12, background:"rgba(14,196,184,0.05)", border:"1.5px solid rgba(14,196,184,0.12)", fontSize:12.5, color:C.inkMid, lineHeight:1.6 }}>
        💡 Lass das Feld leer, wenn die Teilnehmerzahl unbegrenzt ist.
      </div>
    </div>
  );
}

// ── Screen 8: Sichtbarkeit ────────────────────────────────────
function S8({ data, onChange }) {
  return (
    <div>
      <div style={{ fontSize:20, fontWeight:800, color:C.ink, marginBottom:4 }}>Sichtbarkeit</div>
      <div style={{ fontSize:13, color:C.inkMid, marginBottom:16 }}>Wer kann dieses Erlebnis sehen?</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {SICHTBARKEIT.map(s=>(
          <RCard key={s.id} active={data.visibility===s.id}
            icon={s.icon} label={s.label} sub={s.sub}
            onClick={()=>onChange({visibility:s.id})}/>
        ))}
      </div>
    </div>
  );
}

// ── Screen 9: Vorschau & Veröffentlichen ──────────────────────
function S9({ data, saving }) {
  const cover = data.images?.[0]?.url;
  const typeObj = EXP_TYPEN.find(t=>t.id===data.experience_type);
  const fmtDate = (iso) => {
    if (!iso) return null;
    try { return new Date(iso).toLocaleDateString("de-DE",{day:"numeric",month:"long",year:"numeric"}); }
    catch { return iso; }
  };

  return (
    <div>
      <div style={{ fontSize:20, fontWeight:800, color:C.ink, marginBottom:4 }}>Vorschau</div>
      <div style={{ fontSize:13, color:C.inkMid, marginBottom:16 }}>So sieht dein Erlebnis aus.</div>

      <div style={{ borderRadius:16, overflow:"hidden", border:"1.5px solid rgba(26,26,24,0.10)", background:"#fff", marginBottom:20 }}>
        <div style={{ width:"100%", height:160, background:cover?"#1A1A18":"rgba(14,196,184,0.10)", position:"relative", overflow:"hidden" }}>
          {cover
            ? <img src={cover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, opacity:0.3 }}>📅</div>
          }
          {typeObj&&(
            <div style={{ position:"absolute", top:10, left:10, background:"rgba(0,0,0,0.52)", backdropFilter:"blur(6px)", borderRadius:99, padding:"3px 10px", fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.92)" }}>
              {typeObj.icon} {typeObj.label}
            </div>
          )}
        </div>
        <div style={{ padding:"14px 16px" }}>
          <div style={{ fontSize:16, fontWeight:800, color:C.ink, marginBottom:8, lineHeight:1.3 }}>{data.title||"Kein Titel"}</div>
          {data.caption&&<div style={{ fontSize:13, color:C.inkMid, marginBottom:8, lineHeight:1.5 }}>{data.caption}</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {fmtDate(data.date)&&<div style={{ fontSize:12, color:C.inkMid }}>📅 {fmtDate(data.date)}{data.duration&&` · ${data.duration}`}</div>}
            {data.location_text&&<div style={{ fontSize:12, color:C.inkMid }}>📍 {data.location_text}</div>}
            {data.max_participants&&<div style={{ fontSize:12, color:C.inkMid }}>👥 Max. {data.max_participants} Personen</div>}
          </div>
        </div>
      </div>

      {saving&&<div style={{ textAlign:"center", fontSize:13, color:C.teal, fontWeight:600, padding:"8px 0" }}>Wird gespeichert…</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// WIZARD ROOT
// ══════════════════════════════════════════════════════════════
export default function ExperienceWizard({ userId, existingExp=null, onClose, onSaved }) {
  const TOTAL = 9;
  const [step, setSt]           = useState(1);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [form, setForm] = useState(() => {
    if (existingExp) {
      let imgs = [];
      try { imgs = existingExp.images ? JSON.parse(existingExp.images) : []; } catch {}
      if (!imgs.length && existingExp.cover_url) imgs = [{ url: existingExp.cover_url }];
      return {
        images:          imgs,
        title:           existingExp.title           || "",
        caption:         existingExp.caption          || "",
        description:     existingExp.description      || "",
        experience_type: existingExp.experience_type  || "",
        date:            existingExp.date ? existingExp.date.slice(0,10) : "",
        duration:        existingExp.duration         || "",
        format:          existingExp.format           || "",
        location_text:   existingExp.location_text    || "",
        max_participants:existingExp.max_participants ? String(existingExp.max_participants) : "",
        visibility:      existingExp.visibility       || "public",
      };
    }
    return {
      images:[], title:"", caption:"", description:"",
      experience_type:"", date:"", duration:"",
      format:"", location_text:"",
      max_participants:"", visibility:"public",
    };
  });

  const patch  = u => setForm(p => ({ ...p, ...u }));
  const next   = () => setSt(s => Math.min(s+1, TOTAL));
  const back   = () => setSt(s => Math.max(s-1, 1));
  const isLast = step === TOTAL;

  // ── Schritt-Validierung ────────────────────────────────────
  const canContinue = useCallback(() => {
    switch (step) {
      case 1: return !!(form.title?.trim());
      case 2: return !!(form.experience_type);
      case 3: return true;
      case 4: return !!(form.caption?.trim());
      case 5: return true;
      case 6: return !!(form.format);
      case 7: return true;
      case 8: return !!(form.visibility);
      case 9: return true;
      default: return true;
    }
  }, [step, form]);

  // ── body-scroll sperren (wie WerkWizard) ──────────────────
  React.useLayoutEffect(() => {
    document.body.classList.add("hui-wizard-open");
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("hui-wizard-open");
      document.body.style.overflow = prev;
    };
  }, []);

  // ── Speichern ─────────────────────────────────────────────
  async function save(status) {
    if (!userId) return;
    setSaving(true);

    const cover_url = form.images?.[0]?.url || null;
    const imagesArr = (form.images||[]).map(img =>
      typeof img === "object" ? img : { url: img }
    );

    const payload = {
      user_id:          userId,
      title:            form.title            || "",
      description:      form.description      || null,
      caption:          form.caption          || null,
      cover_url,
      images:           imagesArr,
      experience_type:  form.experience_type  || null,
      category:         form.experience_type  || null,
      date:             form.date ? new Date(form.date).toISOString() : null,
      duration:         form.duration         || null,
      format:           form.format           || null,
      location_text:    form.location_text    || null,
      max_participants: form.max_participants ? parseInt(form.max_participants, 10) : null,
      visibility:       form.visibility       || "public",
      status,
      updated_at:       new Date().toISOString(),
    };

    console.log("[SAVE EXP] payload:", JSON.stringify({
      user_id:    payload.user_id?.slice(0,8),
      title:      payload.title,
      type:       payload.experience_type,
      status:     payload.status,
      imgs:       imagesArr.length,
      keys:       Object.keys(payload),
    }, null, 2));

    const { data: saved, error } = existingExp?.id
      ? await supabase.from("experiences").update(payload).eq("id", existingExp.id).eq("user_id", userId).select().single()
      : await supabase.from("experiences").insert(payload).select().single();

    setSaving(false);

    if (error) {
      console.error("[SAVE EXP] DB-ERROR:", error.message, "| code:", error.code);
      setSaveError(error.message || "Speichern fehlgeschlagen");
      setTimeout(() => setSaveError(null), 5000);
      return;
    }

    console.log("[SAVE EXP] success:", saved?.id, "| status:", status);
    onSaved?.(saved);
    onClose?.();
  }

  return (
    <div style={{
      position:"fixed", inset:0,
      zIndex:10500,
      background:C.cream,
      display:"flex", flexDirection:"column",
    }}>
      {/* Header */}
      <TopBar onClose={onClose} step={step} total={TOTAL} isEdit={!!existingExp}/>

      {/* Schritt-Label */}
      <div style={{
        textAlign:"center", fontSize:11, fontWeight:600,
        color:C.teal, padding:"6px 0 8px", letterSpacing:0.4,
        background:"#fff", borderBottom:"1px solid rgba(26,26,24,0.10)",
      }}>
        Schritt {step} von {TOTAL}
      </div>

      {/* Scrollbarer Content */}
      <div style={{ flex:1, overflowY:"auto", WebkitOverflowScrolling:"touch", padding:"20px 20px 0" }}>
        {step===1&&<S1 data={form} onChange={patch}/>}
        {step===2&&<S2 data={form} onChange={patch}/>}
        {step===3&&<S3 data={form} onChange={patch} userId={userId}/>}
        {step===4&&<S4 data={form} onChange={patch}/>}
        {step===5&&<S5 data={form} onChange={patch}/>}
        {step===6&&<S6 data={form} onChange={patch}/>}
        {step===7&&<S7 data={form} onChange={patch}/>}
        {step===8&&<S8 data={form} onChange={patch}/>}
        {step===9&&<S9 data={form} saving={saving}/>}
        <div style={{ height:100 }}/>
      </div>

      {/* Error Toast */}
      {saveError&&(
        <div style={{ flexShrink:0, padding:"10px 20px", background:"rgba(239,68,68,0.10)", borderTop:"1.5px solid rgba(239,68,68,0.20)", fontSize:12.5, fontWeight:600, color:"rgba(239,68,68,0.9)", display:"flex", alignItems:"center", gap:8 }}>
          <span>⚠</span>
          <span style={{ flex:1 }}>{saveError}</span>
          <button onClick={()=>setSaveError(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(239,68,68,0.7)", fontSize:14, padding:0 }}>×</button>
        </div>
      )}

      {/* Sticky Footer */}
      <div style={{
        flexShrink:0, background:"#fff",
        borderTop:"1px solid rgba(26,26,24,0.10)",
        padding:"12px 20px",
        paddingBottom:"max(20px, env(safe-area-inset-bottom, 20px))",
        display:"flex", gap:10,
        boxShadow:"0 -4px 20px rgba(0,0,0,0.06)",
      }}>
        {step > 1 ? (
          <button onClick={back} style={{ flex:1, padding:"15px", background:"rgba(26,26,24,0.06)", border:"none", borderRadius:14, fontSize:14, fontWeight:700, color:C.inkMid, cursor:"pointer", fontFamily:"inherit", touchAction:"manipulation" }}>← Zurück</button>
        ) : (
          <button onClick={onClose} style={{ flex:1, padding:"15px", background:"rgba(26,26,24,0.06)", border:"none", borderRadius:14, fontSize:14, fontWeight:700, color:C.inkMid, cursor:"pointer", fontFamily:"inherit", touchAction:"manipulation" }}>Abbrechen</button>
        )}

        {!isLast&&(
          <button onClick={next} disabled={!canContinue()} style={{
            flex:2, padding:"15px",
            background:canContinue()?`linear-gradient(135deg,${C.teal},${C.tealD})`:"rgba(14,196,184,0.32)",
            border:"none", borderRadius:14, color:"#fff",
            fontSize:16, fontWeight:700,
            cursor:canContinue()?"pointer":"not-allowed",
            fontFamily:"inherit", touchAction:"manipulation", transition:"background .18s",
          }}>Weiter →</button>
        )}
        {isLast&&(
          <>
            <button onClick={()=>save("draft")} disabled={saving} style={{ flex:1, padding:"15px", background:"rgba(26,26,24,0.06)", border:"none", borderRadius:14, fontSize:14, fontWeight:600, color:C.inkMid, cursor:saving?"not-allowed":"pointer", fontFamily:"inherit", touchAction:"manipulation" }}>
              {saving?"…":"Entwurf"}
            </button>
            <button onClick={()=>save("published")} disabled={saving||!form.title?.trim()} style={{
              flex:2, padding:"15px",
              background:(saving||!form.title?.trim())?"rgba(14,196,184,0.32)":`linear-gradient(135deg,${C.teal},${C.tealD})`,
              border:"none", borderRadius:14, color:"#fff",
              fontSize:16, fontWeight:700,
              cursor:(saving||!form.title?.trim())?"not-allowed":"pointer",
              fontFamily:"inherit", touchAction:"manipulation",
            }}>
              {saving?"Wird gespeichert…":"🌍 Veröffentlichen"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
