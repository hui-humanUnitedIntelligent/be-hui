// src/components/works/WerkWizard.jsx
// HUI – Werk-Editor als 6-Schritte-Wizard
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import { searchPlaces, geocodeWithFallback } from "../../lib/geocoding.js";

const C = {
  teal:"#0EC4B8", tealD:"#0DBBAF", cream:"#F8F7F4",
  ink:"#1A1A18", inkMid:"rgba(26,26,24,0.55)",
  inkFade:"rgba(26,26,24,0.35)", border:"rgba(26,26,24,0.10)",
};

// Werktypen: ausschließlich echte Werke
// Dienstleistungen/Workshops/Kurse → separater "Angebote"-Bereich (geplant)
const WERK_TYPEN = [
  { id:"original",  icon:"🖼️",  label:"Originalwerk",         sub:"Unikat – einmalig vorhanden." },
  { id:"druck",     icon:"🖨️",  label:"Druck / Reproduktion",  sub:"Reproduzierbar in Auflage." },
  { id:"digital",   icon:"💻",  label:"Digitales Werk",        sub:"Datei zum Download." },
];
const MATERIALIEN = ["Acryl","Öl","Aquarell","Holz","Keramik","Textil","Digital","Metall","Papier","Sonstiges"];
const KATEGORIEN  = ["Malerei","Fotografie","Skulptur","Illustration","Design","Musik","Literatur","Performance","Handwerk","Sonstiges"];

// ── Bausteine ─────────────────────────────────────────────────
function ProgressBar({ step, total }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:0 }}>
      {Array.from({ length: total }, (_, i) => {
        const n=i+1; const done=n<step; const cur=n===step;
        return (
          <React.Fragment key={n}>
            <div style={{
              width:cur?28:22, height:cur?28:22, borderRadius:"50%",
              background:(done||cur)?C.teal:"rgba(26,26,24,0.09)",
              border:cur?`2.5px solid ${C.teal}`:"none",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:cur?12:10, fontWeight:700,
              color:(done||cur)?"#fff":C.inkFade,
              flexShrink:0, transition:"all .22s",
              boxShadow:cur?"0 0 0 4px rgba(14,196,184,0.18)":"none",
            }}>{done?"✓":n}</div>
            {i<total-1 && <div style={{ flex:1, height:2, minWidth:8, background:done?C.teal:"rgba(26,26,24,0.09)", transition:"background .22s" }}/>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function TopBar({ onClose, step, total }) {
  return (
    <div style={{ padding:"14px 20px 12px", background:"#fff", borderBottom:`1px solid ${C.border}` }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <button onClick={onClose} style={{ background:"none", border:"none", padding:0, fontSize:13, fontWeight:600, color:C.inkMid, cursor:"pointer", touchAction:"manipulation" }}>Abbrechen</button>
        <div style={{ fontSize:14, fontWeight:700, color:C.ink }}>Werk bearbeiten</div>
        <button onClick={onClose} style={{ width:28, height:28, borderRadius:"50%", background:"rgba(26,26,24,0.07)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", touchAction:"manipulation" }}>
          <span style={{ fontSize:14, color:C.ink }}>×</span>
        </button>
      </div>
      <ProgressBar step={step} total={total}/>
    </div>
  );
}

function PBtn({ label, onClick, disabled, loading }) {
  return (
    <button onClick={onClick} disabled={disabled||loading} style={{
      width:"100%", padding:"16px",
      background:(disabled||loading)?"rgba(14,196,184,0.32)":`linear-gradient(135deg,${C.teal},${C.tealD})`,
      border:"none", borderRadius:14, color:"#fff", fontSize:15, fontWeight:700,
      cursor:(disabled||loading)?"not-allowed":"pointer",
      fontFamily:"inherit", touchAction:"manipulation",
    }}>{loading?"Wird gespeichert…":label}</button>
  );
}

function SBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{ width:"100%", padding:"14px", background:"none", border:"none", color:C.teal, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit", touchAction:"manipulation" }}>{label}</button>
  );
}

function Lbl({ text, req }) {
  return <div style={{ fontSize:12, fontWeight:700, color:C.inkMid, marginBottom:6 }}>{text}{req&&<span style={{ color:C.teal, marginLeft:2 }}>*</span>}</div>;
}

const INP = {
  width:"100%", boxSizing:"border-box",
  padding:"13px 15px",   // größere Touch-Targets
  borderRadius:12,
  border:"1.5px solid rgba(26,26,24,0.10)",
  outline:"none",
  fontSize:15,           // besser lesbar auf Mobile
  fontFamily:"inherit",
  color:"#1A1A18",
  background:"#fff",
  WebkitAppearance:"none",
  appearance:"none",
};

function FI({ label, req, value, onChange, placeholder, maxLen, type="text" }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label&&<Lbl text={label} req={req}/>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} maxLength={maxLen} style={INP}/>
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

function FSel({ label, req, value, onChange, options }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label&&<Lbl text={label} req={req}/>}
      <select value={value} onChange={e=>onChange(e.target.value)} style={{ ...INP, backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%230EC4B8' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 14px center", paddingRight:38 }}>
        <option value="">Bitte wählen…</option>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"17px 18px", background:"#fff", borderRadius:14, border:`1.5px solid ${C.border}`, marginBottom:10, minHeight:60 }}>
      <span style={{ fontSize:16, fontWeight:600, color:C.ink }}>{label}</span>
      <div onClick={()=>onChange(!value)} style={{ width:48, height:28, borderRadius:14, background:value?C.teal:"rgba(26,26,24,0.15)", position:"relative", cursor:"pointer", transition:"background .18s", flexShrink:0, touchAction:"manipulation" }}>
        <div style={{ position:"absolute", top:3, left:value?22:3, width:22, height:22, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.18)", transition:"left .18s" }}/>
      </div>
    </div>
  );
}

function RCard({ active, icon, label, sub, onClick }) {
  return (
    <div onClick={onClick} style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 16px", borderRadius:14, border:active?`2px solid ${C.teal}`:`1.5px solid ${C.border}`, background:active?"rgba(14,196,184,0.07)":"#fff", cursor:"pointer", transition:"all .15s", touchAction:"manipulation", minHeight:60 }}>
      <div style={{ width:20, height:20, borderRadius:"50%", border:active?`2px solid ${C.teal}`:`2px solid ${C.border}`, background:active?C.teal:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {active&&<div style={{ width:7, height:7, borderRadius:"50%", background:"#fff" }}/>}
      </div>
      {icon&&<div style={{ fontSize:16, flexShrink:0 }}>{icon}</div>}
      <div>
        <div style={{ fontSize:14, fontWeight:700, color:active?C.teal:C.ink }}>{label}</div>
        {sub&&<div style={{ fontSize:11.5, color:C.inkMid, marginTop:1 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Screen 1 – Bilder
// ══════════════════════════════════════════════════════════════
function S1({ data, onChange, userId, onNext }) {
  const [upl, setUpl] = useState(false);
  const ref = useRef(null);
  const imgs = data.images||[];

  async function upload(e) {
    const files = Array.from(e.target.files||[]);
    if (!userId||!files.length) return;
    setUpl(true);
    const next=[...imgs];
    for (const file of files.slice(0,10-next.length)) {
      const ext=file.name.split(".").pop().toLowerCase();
      const path=`works/${userId}/${Date.now()}_${Math.random().toString(36).slice(2,6)}.${ext}`;
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
      <div style={{ fontSize:20, fontWeight:800, color:C.ink, marginBottom:4 }}>Bilder</div>
      <div style={{ fontSize:13, color:C.inkMid, marginBottom:16, lineHeight:1.5 }}>Füge bis zu 10 Bilder hinzu. Das erste Bild wird als Titelbild verwendet.</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
        {imgs.map((img,idx)=>(
          <div key={idx} style={{ position:"relative", aspectRatio:"1", borderRadius:12, overflow:"hidden", background:"#e8e4df", border:idx===0?`2.5px solid ${C.teal}`:`1.5px solid ${C.border}` }}>
            <img src={img.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            {idx===0&&<div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent,rgba(14,196,184,0.82))", padding:"12px 5px 4px", fontSize:9, fontWeight:700, color:"#fff", textAlign:"center" }}>TITELBILD</div>}
            <button onClick={()=>onChange({ images:imgs.filter((_,i)=>i!==idx) })} style={{ position:"absolute", top:4, right:4, width:22, height:22, borderRadius:"50%", background:"rgba(0,0,0,0.55)", border:"none", color:"#fff", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", touchAction:"manipulation" }}>×</button>
          </div>
        ))}
        {imgs.length<10&&(
          <div onClick={()=>!upl&&ref.current?.click()} style={{ aspectRatio:"1", borderRadius:12, border:"2px dashed rgba(14,196,184,0.38)", background:"rgba(14,196,184,0.04)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:upl?"not-allowed":"pointer", gap:4, touchAction:"manipulation" }}>
            {upl?<div style={{ fontSize:12, color:C.teal, fontWeight:600 }}>…</div>:<>
              <div style={{ fontSize:22, color:C.teal, fontWeight:300, lineHeight:1 }}>+</div>
              <div style={{ fontSize:9, color:C.teal, fontWeight:600, textAlign:"center", lineHeight:1.4 }}>Bild<br/>hinzufügen</div>
            </>}
          </div>
        )}
      </div>
      {imgs.length>0&&<div style={{ fontSize:11, color:C.inkFade, textAlign:"center", marginBottom:14 }}>{imgs.length}/10 Bilder</div>}
      <input ref={ref} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={upload}/>
      {onNext && <PBtn label="Weiter" onClick={onNext} disabled={imgs.length===0}/>}
    </div>
  );
}

// Screen 2 – Basisinformationen
function S2({ data, onChange, onNext }) {
  const [ti, setTi] = useState("");
  const tags=data.tags||[];
  function addTag() { const t=ti.trim(); if (!t||tags.includes(t)){setTi("");return;} onChange({ tags:[...tags,t] }); setTi(""); }
  return (
    <div>
      <div style={{ fontSize:20, fontWeight:800, color:C.ink, marginBottom:16 }}>Basisinformationen</div>
      <FI label="Titel des Werks" req value={data.title||""} onChange={v=>onChange({title:v})} placeholder="z. B. Wellen der Ruhe" maxLen={80}/>
      <FTA label="Kurzbeschreibung" req value={data.shortDesc||""} onChange={v=>onChange({shortDesc:v})} placeholder="Ein abstraktes Acrylbild, inspiriert von der Kraft des Ozeans." maxLen={120} rows={2}/>
      <FTA label="Detaillierte Beschreibung" value={data.description||""} onChange={v=>onChange({description:v})} placeholder="Dieses Werk steht für Bewegung, Freiheit und innere Balance…" maxLen={1000} rows={4}/>
      <FSel label="Kategorie" req value={data.category||""} onChange={v=>onChange({category:v})} options={KATEGORIEN}/>
      <div style={{ marginBottom:14 }}>
        <Lbl text="Tags"/>
        <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:8 }}>
          {tags.map(tag=>(
            <div key={tag} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 11px", borderRadius:99, background:"rgba(14,196,184,0.10)", border:"1.5px solid rgba(14,196,184,0.28)", fontSize:12.5, fontWeight:600, color:C.teal }}>
              {tag}
              <button onClick={()=>onChange({ tags:tags.filter(t=>t!==tag) })} style={{ background:"none", border:"none", padding:0, cursor:"pointer", color:C.teal, fontSize:14, lineHeight:1 }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <input value={ti} onChange={e=>setTi(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),addTag())} placeholder="+ Tag hinzufügen" style={{ flex:1, padding:"9px 13px", borderRadius:99, border:"1.5px dashed rgba(14,196,184,0.35)", outline:"none", fontSize:13, fontFamily:"inherit", color:C.ink, background:"transparent" }}/>
          {ti&&<button onClick={addTag} style={{ background:C.teal, border:"none", borderRadius:99, padding:"9px 14px", fontSize:12, fontWeight:700, color:"#fff", cursor:"pointer", touchAction:"manipulation" }}>+</button>}
        </div>
      </div>
      {onNext && <PBtn label="Weiter" onClick={onNext} disabled={!data.title?.trim()||!data.category}/>}
    </div>
  );
}

// Screen 3 – Werktyp
function S3({ data, onChange, onNext }) {
  return (
    <div>
      <div style={{ fontSize:20, fontWeight:800, color:C.ink, marginBottom:4 }}>Werktyp</div>
      <div style={{ fontSize:13, color:C.inkMid, marginBottom:16 }}>Wähle die Art deines Werks.</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
        {WERK_TYPEN.map(wt=><RCard key={wt.id} active={data.werktyp===wt.id} icon={wt.icon} label={wt.label} sub={wt.sub} onClick={()=>onChange({werktyp:wt.id})}/>)}
      </div>
      {onNext && <PBtn label="Weiter" onClick={onNext} disabled={!data.werktyp}/>}
    </div>
  );
}

// Screen 4 – Preis & Verkauf
function S4({ data, onChange, onNext }) {
  const VERF=[
    { id:"available", label:"Verfügbar zum Kauf",  sub:"Interessenten können direkt anfragen." },
    { id:"reserved",  label:"Reserviert", sub:"Bereits für jemanden zurückgelegt." },
    { id:"sold",      label:"Verkauft",   sub:"Das Werk wurde bereits verkauft." },
  ];
  return (
    <div>
      <div style={{ fontSize:20, fontWeight:800, color:C.ink, marginBottom:6 }}>Preis & Verkauf</div>
      <div style={{ fontSize:13, color:C.inkFade, marginBottom:20 }}>Festpreis in Euro</div>

      {/* ── PREIS: volle Breite, große Schrift ── */}
      <div style={{ marginBottom:20 }}>
        <Lbl text="Preis (EUR)" req/>
        <div style={{ position:"relative" }}>
          <span style={{
            position:"absolute", left:16, top:"50%", transform:"translateY(-50%)",
            fontSize:26, fontWeight:700, color:"rgba(14,196,184,0.6)",
            pointerEvents:"none", userSelect:"none",
          }}>€</span>
          <input
            type="number" min="0" step="0.01"
            value={data.price||""}
            onChange={e=>onChange({price:e.target.value})}
            placeholder="0,00"
            inputMode="decimal"
            style={{
              width:"100%", boxSizing:"border-box",
              padding:"18px 16px 18px 46px",
              borderRadius:14,
              border:`2px solid ${data.price ? C.teal : C.border}`,
              outline:"none",
              fontSize:32,
              fontWeight:800,
              fontFamily:"inherit",
              color:C.ink,
              background:"#fff",
              letterSpacing:1,
              transition:"border-color .15s",
            }}
          />
        </div>
        {data.price && (
          <div style={{ marginTop:6, fontSize:12, color:C.inkFade, paddingLeft:4 }}>
            + ggf. Versandkosten
          </div>
        )}
      </div>

      {/* ── VERFÜGBARKEIT ── */}
      <div style={{ marginBottom:8 }}>
        <Lbl text="Verfügbarkeit" req/>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {VERF.map(v=>(
            <RCard key={v.id} active={data.availability===v.id}
              label={v.label} sub={v.sub}
              onClick={()=>onChange({availability:v.id})}/>
          ))}
        </div>
      </div>

      {onNext && <PBtn label="Weiter" onClick={onNext} disabled={!data.price||!data.availability}/>}
    </div>
  );
}

// Screen 5 – Versand & Abholung
function S5({ data, onChange, onNext }) {
  const NAT=["DHL Standard","DHL Express","Hermes","DPD","Selbst verpackt"];
  const INT=["DHL International","FedEx","UPS","Auf Anfrage"];
  return (
    <div>
      <div style={{ fontSize:20, fontWeight:800, color:C.ink, marginBottom:16 }}>Versand & Abholung</div>
      <Toggle label="Versand möglich" value={!!data.versand} onChange={v=>onChange({versand:v})}/>
      {data.versand&&(
        <div style={{ background:"rgba(14,196,184,0.04)", border:"1.5px solid rgba(14,196,184,0.15)", borderRadius:14, padding:"14px 14px 4px", marginBottom:12 }}>
          <FSel label="Versand national" value={data.versandNational||""} onChange={v=>onChange({versandNational:v})} options={NAT}/>
          <FSel label="Versand international" value={data.versandInternational||""} onChange={v=>onChange({versandInternational:v})} options={INT}/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
            {[["Versandkosten","versandkosten"],["Kostenfrei ab","versandFrei"]].map(([lbl,key])=>(
              <div key={key}>
                <div style={{ fontSize:11, fontWeight:600, color:C.inkMid, marginBottom:5 }}>{lbl}</div>
                <div style={{ position:"relative" }}>
                  <input type="number" min="0" step="0.01" value={data[key]||""} onChange={e=>onChange({[key]:e.target.value})} placeholder="0,00" style={{ width:"100%", boxSizing:"border-box", padding:"10px 28px 10px 10px", borderRadius:10, border:`1.5px solid ${C.border}`, outline:"none", fontSize:13, fontFamily:"inherit", color:C.ink, background:"#fff" }}/>
                  <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:13, color:C.inkFade }}>€</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <Toggle label="Abholung möglich" value={!!data.abholung} onChange={v=>onChange({abholung:v})}/>
      {data.abholung&&(
        <div style={{ background:"rgba(14,196,184,0.04)", border:"1.5px solid rgba(14,196,184,0.15)", borderRadius:14, padding:"14px 14px 6px", marginBottom:12 }}>
          <FI label="Standort für Abholung" value={data.abholort||""} onChange={v=>onChange({abholort:v})} placeholder="z. B. Freiburg im Breisgau, Deutschland"/>
        </div>
      )}
      {!data.versand&&!data.abholung&&(
        <div style={{ padding:"12px 14px", borderRadius:12, background:"rgba(239,68,68,0.06)", border:"1.5px solid rgba(239,68,68,0.15)", fontSize:12.5, color:"rgba(239,68,68,0.8)", marginBottom:12 }}>
          Mindestens eine Option muss aktiviert sein.
        </div>
      )}
      {onNext && <PBtn label="Weiter" onClick={onNext} disabled={!data.versand&&!data.abholung}/>}
    </div>
  );
}

// Screen 6 – Sichtbarkeit & Speichern
function S6({ data, onChange, onSave, onDraft, saving, hideButtons=false }) {
  const SICHT=[
    { id:"public",      icon:"🌍", label:"Öffentlich",   sub:"Sichtbar in deinem Talent-Profil und ggf. im HUI-Marktplatz." },
    { id:"connections", icon:"🔗", label:"Verbindungen", sub:"Nur für Menschen in deinem Netzwerk sichtbar." },
    { id:"private",     icon:"🔒", label:"Privat",       sub:"Nur für dich sichtbar." },
  ];
  const cover=data.images?.[0]?.url;
  const ps=data.price?`${parseFloat(data.price).toLocaleString("de-DE",{minimumFractionDigits:2})} ${data.currency||"€"}`:"—";
  return (
    <div>
      <div style={{ fontSize:20, fontWeight:800, color:C.ink, marginBottom:4 }}>Sichtbarkeit</div>
      <div style={{ fontSize:13, color:C.inkMid, marginBottom:16 }}>Wer kann dieses Werk sehen?</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
        {SICHT.map(s=><RCard key={s.id} active={(data.sichtbarkeit||"public")===s.id} icon={s.icon} label={s.label} sub={s.sub} onClick={()=>onChange({sichtbarkeit:s.id})}/>)}
      </div>
      <div style={{ background:"#fff", border:`1.5px solid ${C.border}`, borderRadius:16, padding:14, marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.inkMid, marginBottom:12 }}>Zusammenfassung</div>
        <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
          {cover&&<img src={cover} alt="" style={{ width:64, height:64, borderRadius:10, objectFit:"cover", flexShrink:0 }}/>}
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:C.ink, marginBottom:2 }}>{data.title||"—"}</div>
            <div style={{ fontSize:14, fontWeight:700, color:C.teal, marginBottom:6 }}>{ps}</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {data.availability==="available"&&<span style={{ fontSize:11, fontWeight:600, color:"#22c55e", display:"flex", alignItems:"center", gap:4 }}><span style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", display:"inline-block" }}/>Verfügbar</span>}
              {data.versand&&<span style={{ fontSize:11, fontWeight:600, color:C.inkMid }}>📦 Versand möglich</span>}
              {data.abholung&&<span style={{ fontSize:11, fontWeight:600, color:C.inkMid }}>🤝 Abholung möglich</span>}
            </div>
          </div>
        </div>
      </div>
      {!hideButtons && <><PBtn label="Zur Prüfung einreichen" onClick={onSave} loading={saving}/><SBtn label="Entwurf speichern" onClick={onDraft}/></>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// WIZARD ROOT
// ══════════════════════════════════════════════════════════════
export default function WerkWizard({ userId, existingWork=null, onClose, onSaved }) {
  const TOTAL=6;
  const [step,setSt]=useState(1);
  const [saving,setSaving]=useState(false);
  const [saveError,setSaveError]=useState(null);
  const [form,setForm]=useState(()=>{
    if (existingWork) {
      let imgs=[];
      try { imgs=existingWork.images?JSON.parse(existingWork.images):[]; } catch {}
      if (!imgs.length&&existingWork.cover_url) imgs=[{ url:existingWork.cover_url }];
      return {
        images:imgs, title:existingWork.title||"", shortDesc:existingWork.caption||"",
        description:existingWork.description||"", category:existingWork.category||"",
        tags:existingWork.tags||[], werktyp:existingWork.medium||"",
        price:existingWork.price||"", currency:"EUR",
        availability:existingWork.for_sale?"available":"sold",
        breite:"", hoehe:"", tiefe:"", gewicht:"",
        material:existingWork.material||"",
        versand:existingWork.versand||false,
        versandNational:"", versandInternational:"",
        versandkosten:"", versandFrei:"",
        abholung:existingWork.abholung||false,
        abholort:existingWork.location_text||"",
        sichtbarkeit:existingWork.visibility||"public",
      };
    }
    return {
      images:[], title:"", shortDesc:"", description:"", category:"", tags:[],
      werktyp:"", price:"", currency:"EUR", availability:"available",
      breite:"", hoehe:"", tiefe:"", gewicht:"", material:"",
      versand:false, versandNational:"", versandInternational:"",
      versandkosten:"", versandFrei:"", abholung:false, abholort:"",
      sichtbarkeit:"public",
    };
  });

  const patch=u=>setForm(p=>({...p,...u}));
  const next=()=>setSt(s=>Math.min(s+1,TOTAL));
  const back=()=>setSt(s=>Math.max(s-1,1));

  async function save(status) {
    if (!userId) return;
    setSaving(true);
    const cover_url=form.images?.[0]?.url||null;

    // Geokoordinaten fuer Abholort ermitteln (Standort-Feature 2026-07-06,
    // fuer Umkreissuche auf Discover-Seite, siehe geocoding.js).
    // Nur wenn sich der Ort seit dem letzten Speichern geaendert hat oder
    // noch keine Koordinaten vorhanden sind.
    let geoLat = existingWork?.lat ?? null, geoLng = existingWork?.lng ?? null;
    const abholortTrimmed = (form.abholort || "").trim();
    if (abholortTrimmed && abholortTrimmed !== (existingWork?.location_text || "").trim()) {
      const geo = await geocodeWithFallback(abholortTrimmed);
      geoLat = geo?.lat ?? null;
      geoLng = geo?.lng ?? null;
    } else if (!abholortTrimmed) {
      geoLat = null; geoLng = null;
    }

    // ── DIFF-SNAPSHOT: Beim Update eines approved Werks, alten Stand speichern ──
    // Wird in admin_comment als "__snapshot__:{...}" gespeichert (nur lesend vom Admin genutzt)
    let snapshotPayload = {};
    if (status === "pending_review" && existingWork?.id && existingWork?.approval_status === "approved") {
      try {
        const snap = {
          title:         existingWork.title         || null,
          description:   existingWork.description   || null,
          category:      existingWork.category      || null,
          price:         existingWork.price         || null,
          caption:       existingWork.caption       || null,
          file_format:   existingWork.file_format   || null,
          materials:     existingWork.materials     || null,
          location_text: existingWork.location_text || null,
          tags:          existingWork.tags          || [],
          images:        existingWork.images        || [],
          cover_url:     existingWork.cover_url     || null,
          visibility:    existingWork.visibility    || null,
          for_sale:      existingWork.for_sale      || false,
        };
        snapshotPayload = { admin_comment: "__snapshot__:" + JSON.stringify(snap) };
      } catch (_) { /* Snapshot nicht kritisch */ }
    } else if (status === "pending_review") {
      // Neue Einreichung (kein Update): admin_comment zurücksetzen
      snapshotPayload = { admin_comment: null };
    }
    // ── Payload: nur Spalten die in public.works existieren (045) ──
    // images als JSONB Array (kein JSON.stringify → kein 22P02)
    const imagesArr = (form.images||[]).map(img =>
      typeof img === "object" ? img : { url: img }
    );

    // ── Payload: exakt die Spalten die in public.works existieren ──
    // Bestätigt vorhanden: category, caption, cover_url, creator_id,
    //   description, file_format, for_sale, images, location_text, materials,
    //   price, sale_mode, shipping, shipping_cost, shipping_countries,
    //   shipping_time, status, tags, visibility
    // NICHT in DB: medium → gemappt auf file_format
    // NICHT in DB: media_url, size, condition → entfernt
    const payload = {
      user_id:      userId,
      title:        form.title        || "",
      description:  form.description  || null,
      caption:      form.shortDesc    || null,
      cover_url,
      images:       imagesArr,
      category:     form.category     || null,
      tags:         form.tags         || [],
      file_format:  form.werktyp      || null,
      price:        parseFloat(form.price) || null,
      for_sale:     form.availability === "available",
      sale_mode:    "fixed",
      materials:    form.material     || null,
      shipping:     !!form.versand,
      shipping_cost: form.versandkosten ? parseFloat(form.versandkosten) : null,
      shipping_countries: [
        form.versandNational,
        form.versandInternational,
      ].filter(Boolean).join(", ") || null,
      shipping_time: form.versandTime  || null,
      location_text: form.abholort     || null,
      lat:          geoLat,
      lng:          geoLng,
      visibility:   form.sichtbarkeit  || "public",
      status,
      // Beim Einreichen: nie direkt veröffentlichen
      published_at: status === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
      // Freigabe-Tracking
      last_submitted_at: status === "pending_review" ? new Date().toISOString() : undefined,
      is_update: status === "pending_review" ? !!existingWork?.id : undefined,
      // Approval System: beim Einreichen immer pending, nur Admin kann auf approved setzen
      approval_status: status === "pending_review" ? "pending" : undefined,
      // Bei Update: rejection_reason zurücksetzen (neue Prüfung)
      rejection_reason: status === "pending_review" ? null : undefined,
      // Snapshot der alten Version für Admin-Diff (nur wenn is_update=true)
      ...snapshotPayload,
    };

    console.log("[SAVE WERK] PRE-INSERT payload:", JSON.stringify({
      user_id: payload.user_id?.slice(0,8),
      title: payload.title,
      file_format: payload.file_format,
      price: payload.price,
      status: payload.status,
      images_count: imagesArr.length,
      all_keys: Object.keys(payload),
    }, null, 2));
    const { data:saved, error }=existingWork?.id
      ? await supabase.from("works").update(payload).eq("id",existingWork.id).eq("user_id",userId).select().single()
      : await supabase.from("works").insert(payload).select().single();
    setSaving(false);
    if (error) {
      console.error("[SAVE WERK] DB-ERROR:", error.message, "| code:", error.code);
      // Nutzer-Feedback
      setSaveError(error.message || "Speichern fehlgeschlagen");
      setTimeout(() => setSaveError(null), 5000);
      return;
    }
    console.log("[SAVE WERK] success:", saved?.id, "status:", status);
    onSaved?.(saved);
    onSave?.(saved);   // Alias für MyBasisProfile reload
    // Bei pending_review: kurze Bestätigung zeigen, dann schließen
    if (status === "pending_review") {
      setSaveError(null);
      setTimeout(() => { onClose?.(); }, 1800);
    } else {
      onClose?.();
    }
  }

  // ── BottomNav (zIndex:9999) ausblenden solange Wizard offen ──
  // Referenzgezählter Lock (siehe wizardBodyLock.js) statt eigener
  // classList.add/remove — verhindert Race Conditions mit anderen
  // gleichzeitig offenen Wizards (Werk/Erlebnis/Talent-Angebot).
  useWizardBodyLock();

  // ── body-scroll sperren (rein lokal, kein geteilter Zustand) ──
  React.useLayoutEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ── Weiter-Button Validierung pro Schritt ─────────────────
  const canContinue = useCallback(() => {
    switch (step) {
      case 1: return (form.images||[]).length > 0;
      case 2: return !!(form.title?.trim()) && !!form.category;
      case 3: return !!form.werktyp;
      case 4: return !!(form.price) && !!form.availability;
      case 5: return !!(form.versand || form.abholung);
      case 6: return true;
      default: return true;
    }
  }, [step, form]);

  const isLast = step === TOTAL;

  return createPortal(
    /* Fullscreen — zIndex 10500 überschreibt BottomNav (9999) + ProfileLauncher (9500) */
    <div style={{
      position:"fixed", inset:0,
      zIndex:10500,
      background:C.cream,
      display:"flex", flexDirection:"column",
      /* Kein overflow:hidden auf Root — damit iOS keyboard nicht bricht */
    }}>

      {/* ── HEADER: Abbrechen · Titel · X ─────────────────── */}
      <TopBar onClose={onClose} step={step} total={TOTAL}/>

      {/* ── SCHRITT-LABEL ─────────────────────────────────── */}
      <div style={{
        textAlign:"center", fontSize:11, fontWeight:600,
        color:C.teal, padding:"6px 0 0", letterSpacing:0.4,
        background:"#fff", borderBottom:`1px solid ${C.border}`,
        paddingBottom:8,
      }}>
        Schritt {step} von {TOTAL}
      </div>

      {/* ── SCROLLBARER CONTENT ───────────────────────────── */}
      <div style={{
        flex:1,
        overflowY:"auto",
        WebkitOverflowScrolling:"touch",
        padding:"20px 20px 0",
      }}>
        {step===1&&<S1 data={form} onChange={patch} userId={userId} onNext={null}/>}
        {step===2&&<S2 data={form} onChange={patch} onNext={null}/>}
        {step===3&&<S3 data={form} onChange={patch} onNext={null}/>}
        {step===4&&<S4 data={form} onChange={patch} onNext={null}/>}
        {step===5&&<S5 data={form} onChange={patch} onNext={null}/>}
        {step===6&&<S6 data={form} onChange={patch}
          onSave={()=>save("pending_review")}
          onDraft={()=>save("draft")}
          saving={saving}
          hideButtons
        />}
        {/* Spacer damit letzter Inhalt nicht hinter Footer verschwindet */}
        <div style={{ height:100 }}/>
      </div>

      {/* ── SAVE ERROR TOAST ────────────────────────────────── */}
      {saveError && (
        <div style={{
          flexShrink:0, padding:"10px 20px",
          background:"rgba(239,68,68,0.10)",
          borderTop:"1.5px solid rgba(239,68,68,0.20)",
          fontSize:12.5, fontWeight:600,
          color:"rgba(239,68,68,0.9)",
          display:"flex", alignItems:"center", gap:8,
        }}>
          <span>⚠</span>
          <span style={{ flex:1 }}>{saveError}</span>
          <button onClick={()=>setSaveError(null)} style={{
            background:"none", border:"none", cursor:"pointer",
            color:"rgba(239,68,68,0.7)", fontSize:14, padding:0,
          }}>×</button>
        </div>
      )}

      {/* ── STICKY FOOTER ─────────────────────────────────── */}
      <div style={{
        flexShrink:0,
        background:"#fff",
        borderTop:`1px solid ${C.border}`,
        padding:`12px 20px`,
        paddingBottom:`max(20px, env(safe-area-inset-bottom, 20px))`,
        display:"flex", gap:10,
        boxShadow:"0 -4px 20px rgba(0,0,0,0.06)",
      }}>
        {/* Zurück */}
        {step > 1 ? (
          <button onClick={back} style={{
            flex:1, padding:"15px",
            background:"rgba(26,26,24,0.06)", border:"none",
            borderRadius:14, fontSize:14, fontWeight:700,
            color:C.inkMid, cursor:"pointer",
            fontFamily:"inherit", touchAction:"manipulation",
          }}>← Zurück</button>
        ) : (
          <button onClick={onClose} style={{
            flex:1, padding:"15px",
            background:"rgba(26,26,24,0.06)", border:"none",
            borderRadius:14, fontSize:14, fontWeight:700,
            color:C.inkMid, cursor:"pointer",
            fontFamily:"inherit", touchAction:"manipulation",
          }}>Abbrechen</button>
        )}

        {/* Weiter / Speichern */}
        {!isLast && (
          <button onClick={next} disabled={!canContinue()} style={{
            flex:2, padding:"15px",
            background:canContinue()
              ? `linear-gradient(135deg,${C.teal},${C.tealD})`
              : "rgba(14,196,184,0.32)",
            border:"none", borderRadius:14,
            color:"#fff", fontSize:16, fontWeight:700,
            cursor:canContinue()?"pointer":"not-allowed",
            fontFamily:"inherit", touchAction:"manipulation",
            transition:"background .18s",
          }}>
            Weiter →
          </button>
        )}
        {isLast && (
          <button onClick={()=>save("pending_review")} disabled={saving} style={{
            flex:2, padding:"15px",
            background:saving
              ? "rgba(14,196,184,0.32)"
              : `linear-gradient(135deg,${C.teal},${C.tealD})`,
            border:"none", borderRadius:14,
            color:"#fff", fontSize:15, fontWeight:700,
            cursor:saving?"not-allowed":"pointer",
            fontFamily:"inherit", touchAction:"manipulation",
          }}>
            {saving?"Wird eingereicht…":"Zur Prüfung einreichen"}
          </button>
        )}
      </div>
      {/* Entwurf-Button: nur in Schritt 6, unter dem Footer */}
      {isLast && (
        <div style={{
          textAlign:"center",
          paddingBottom:"max(12px, env(safe-area-inset-bottom, 12px))",
          background:"#fff",
        }}>
          <button onClick={()=>save("draft")} disabled={saving} style={{
            background:"none", border:"none",
            color:C.teal, fontSize:13, fontWeight:600,
            cursor:"pointer", fontFamily:"inherit",
            touchAction:"manipulation", padding:"8px 24px",
          }}>
            Entwurf speichern
          </button>
        </div>
      )}
    </div>
  ,
    document.body
  );
}
