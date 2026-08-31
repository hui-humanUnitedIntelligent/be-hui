import { useTranslation } from '../../hooks/useTranslation.js';
// src/components/works/WerkWizard.jsx
// HUI – Werk-Editor als 6-Schritte-Wizard
import { HUIPrivatIcon, HUIVersandIcon, HUIWarnIcon } from '../../design/icons/HuiSystemIcons.jsx';
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { invalidateOrbStageCache } from "../../hooks/useOrbGrowthStage.js";
import { compressImageForUpload, JPEG_QUALITY, COVER_MAX_DIM } from "../../lib/profileMedia.js";
import { UPLOAD_LIMITS, uploadMediaFile, processFileSelection } from "../../lib/uploadUtils.js";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { useKeyboardInset } from "../../hooks/useKeyboardInset.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import { searchPlaces, geocodeWithFallback } from "../../lib/geocoding.js";
import LocationAutocompleteInput from "../shared/LocationAutocompleteInput.jsx";
import { formatNumberDE } from "../../lib/formatters.js";
import { HUI } from "../../design/hui.design.js";
import BankdatenModal from "../settings/BankdatenModal.jsx";

const C = {
  teal:HUI.COLOR.teal, tealD:HUI.COLOR.tealDeep, cream:HUI.COLOR.cream,
  ink:HUI.COLOR.inkStudio, inkMid:"rgba(26,26,24,0.55)",
  inkFade:"rgba(26,26,24,0.35)", border:"rgba(26,26,24,0.10)",
};

// Werktypen: ausschließlich echte Werke
// Dienstleistungen/Workshops/Kurse → separater "Angebote"-Bereich (geplant)
function getWerkTypen(t) {
  return [
  { id:"original",  icon:"🖼️",  label:t("ww.typ.original"),         sub:t("ww.typ.original.sub") },
  { id:"druck",     icon:"🖨️",  label:t("ww.typ.druck"),  sub:t("ww.typ.druck.sub") },
  { id:"digital",   icon:"💻",  label:t("ww.typ.digital"),        sub:t("ww.typ.digital.sub") },
  ];
}
function getMaterialien(t) { return t("ww.materialien").split(","); }
function getKategorien(t) { return t("ww.kategorien").split(","); }

// ── Bausteine ─────────────────────────────────────────────────
function ProgressBar({ step = 1, total = 6 }) {
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
              fontSize:cur?12:10, fontWeight: 600,
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

function TopBar({ onClose = () => {}, step = 1, total = 6 }) {
  const { t } = useTranslation();
  return (
    <div style={{ padding:"max(var(--hui-safe-top, 0px), 14px, env(safe-area-inset-top, 14px)) 20px 12px", background:"#fff", borderBottom:`1px solid ${C.border}` }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <button onClick={() => onClose?.()} style={{ background:"none", border:"none", padding:0, fontSize:13, fontWeight:600, color:C.inkMid, cursor:"pointer", touchAction:"manipulation" }}>{t("ww.btn.cancel")}</button>
        <div style={{ fontSize:14, fontWeight: 600, color:C.ink }}>{t("ww.title.edit")}</div>
        <button onClick={() => onClose?.()} style={{ width:28, height:28, borderRadius:"50%", background:"rgba(26,26,24,0.07)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", touchAction:"manipulation" }}>
          <span style={{ fontSize:14, color:C.ink }}>×</span>
        </button>
      </div>
      <ProgressBar step={step} total={total}/>
    </div>
  );
}

function PBtn({ label = "", onClick = () => {}, disabled = false, loading = false }) {
  return (
    <button onClick={onClick} disabled={disabled||loading} style={{
      width:"100%", padding:"16px",
      background:(disabled||loading)?"rgba(14,196,184,0.32)":`linear-gradient(135deg,${C.teal},${C.tealD})`,
      border:"none", borderRadius:14, color:"#fff", fontSize:15, fontWeight: 600,
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
  return <div style={{ fontSize:12, fontWeight: 600, color:C.inkMid, marginBottom:6 }}>{text}{req&&<span style={{ color:C.teal, marginLeft:2 }}>*</span>}</div>;
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
  const { t } = useTranslation();
  return (
    <div style={{ marginBottom:14 }}>
      {label&&<Lbl text={label} req={req}/>}
      <select value={value} onChange={e=>onChange(e.target.value)} style={{ ...INP, backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%230EC4B8' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 14px center", paddingRight:38 }}>
        <option value="">{t("ww.select.placeholder")}</option>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"17px 18px", background:"#fff", borderRadius:14, border:`1.5px solid ${C.border}`, marginBottom:10, minHeight:60 }}>
      <span style={{ fontSize:16, fontWeight:600, color:C.ink }}>{label}</span>
      <div onClick={()=>onChange(!value)} style={{ width:48, height:28, borderRadius:14, background:value?C.teal:"rgba(26,26,24,0.15)", position:"relative", cursor:"pointer", transition:"background .18s", flexShrink:0, touchAction:"manipulation" }} role="button" tabIndex={0}>
        <div style={{ position:"absolute", top:3, left:value?22:3, width:22, height:22, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.18)", transition:"left .18s" }}/>
      </div>
    </div>
  );
}

function RCard({ active, icon, label, sub, onClick }) {
  return (
    <div onClick={onClick} style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 16px", borderRadius:14, border:active?`2px solid ${C.teal}`:`1.5px solid ${C.border}`, background:active?"rgba(14,196,184,0.07)":"#fff", cursor:"pointer", transition:"all .15s", touchAction:"manipulation", minHeight:60 }} role="button" tabIndex={0}>
      <div style={{ width:20, height:20, borderRadius:"50%", border:active?`2px solid ${C.teal}`:`2px solid ${C.border}`, background:active?C.teal:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {active&&<div style={{ width:7, height:7, borderRadius:"50%", background:"#fff" }}/>}
      </div>
      {icon&&<div style={{ fontSize:16, flexShrink:0 }}>{icon}</div>}
      <div>
        <div style={{ fontSize:14, fontWeight: 600, color:active?C.teal:C.ink }}>{label}</div>
        {sub&&<div style={{ fontSize:11.5, color:C.inkMid, marginTop:1 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Screen 1 – Bilder & Videos (UNIVERSELLER UPLOAD 2026-08-20)
// Bis zu 10 Bilder/Videos, 5MB Bilder, 25MB Videos (Michael-Vorgabe).
// ══════════════════════════════════════════════════════════════
function S1({ data, onChange, userId, onNext }) {
  const { t } = useTranslation();
  const [upl, setUpl] = useState(false);
  const imgs = data.images || [];

  // Universeller Upload: Bilder+Videos, bis 10, 5MB/25MB Limits
  async function handleFilesChange(selectedFiles) {
    if (!userId) return;
    const next = [...imgs];
    const previews = [];

    for (const file of selectedFiles.slice(0, UPLOAD_LIMITS.MAX_FILES - next.length)) {
      const previewUrl = URL.createObjectURL(file);
      const isVid = file.type.startsWith("video/");
      next.push({ url: previewUrl, path: null, _preview: true, type: isVid ? "video" : "image" });
      previews.push({ file, previewUrl, idx: next.length - 1 });
    }
    onChange({ images: next });
    setUpl(true);

    for (const { file, previewUrl, idx } of previews) {
      try {
        const result = await uploadMediaFile(file, userId, "works");
        next[idx] = { url: result.url, path: null, type: result.type };
        onChange({ images: [...next] });
        URL.revokeObjectURL(previewUrl);
      } catch (err) {
        console.error("[WerkWizard] Upload-Fehler:", err?.message);
      }
    }
    setUpl(false);
  }

  function handleRemove(idx) {
    onChange({ images: imgs.filter((_, i) => i !== idx) });
  }

  // WerkWizard nutzt data.images als Array von {url, type} Objekten.
  // MultiUploadGrid braucht File[] aber WerkWizard arbeitet mit URLs.
  // Daher behalten wir das manuelle Grid bei (Titelbild-Markierung, CDN-URLs
  // die schon im data-Objekt sind), aber nutzen die universelle Upload-Logik.
  const fileRef = useRef(null);

  return (
    <div>
      <div style={{ fontSize:20, fontWeight: 600, color:C.ink, marginBottom:4 }}>{t("ww.title.images")}</div>
      <div style={{ fontSize:13, color:C.inkMid, marginBottom:16, lineHeight:1.5 }}>
        {t("ww.hint.images")}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
        {imgs.map((img, idx) => {
          const isVid = img.type === "video" || img.url?.match(/\.(mp4|mov|webm|avi)(\?|$)/i);
          return (
            <div key={idx} style={{
              position:"relative", aspectRatio:"1", borderRadius:12, overflow:"hidden",
              background:"#e8e4df",
              border: idx === 0 && !isVid ? `2.5px solid ${C.teal}` : `1.5px solid ${C.border}`,
            }}>
              {isVid ? (
                <video src={img.url} style={{ width:"100%", height:"100%", objectFit:"cover" }} muted preload="metadata" />
              ) : (
                <img loading="lazy" decoding="async" src={img.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              )}
              {isVid && (
                <div style={{ position:"absolute", top:4, left:4, background:"rgba(0,0,0,0.6)", color:"#fff", fontSize:9, fontWeight:600, padding:"2px 6px", borderRadius:6 }}>{t("common.video")}</div>
              )}
              {idx === 0 && !isVid && (
                <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent,rgba(14,196,184,0.82))", padding:"12px 5px 4px", fontSize:9, fontWeight:600, color:"#fff", textAlign:"center" }}>{t("common.titelbild")}</div>
              )}
              <button onClick={() => handleRemove(idx)} style={{
                position:"absolute", top:4, right:4, width:22, height:22, borderRadius:"50%",
                background:"rgba(0,0,0,0.55)", border:"none", color:"#fff", fontSize:13,
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                touchAction:"manipulation",
              }}>×</button>
            </div>
          );
        })}
        {imgs.length < UPLOAD_LIMITS.MAX_FILES && (
          <div onClick={() => !upl && fileRef.current?.click()} style={{
            aspectRatio:"1", borderRadius:12,
            border:`2px dashed ${upl ? "rgba(26,26,24,0.15)" : "rgba(14,196,184,0.38)"}`,
            background: upl ? "transparent" : "rgba(14,196,184,0.04)",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            cursor: upl ? "not-allowed" : "pointer", gap:4, touchAction:"manipulation",
          }} role="button" tabIndex={0}>
            {upl ? <div style={{ fontSize:12, color:C.teal, fontWeight:600 }}>…</div> : <>
              <div style={{ fontSize:22, color:C.teal, fontWeight:300, lineHeight:1 }}>+</div>
              <div style={{ fontSize:9, color:C.teal, fontWeight:600, textAlign:"center", lineHeight:1.4 }}>{t("ww.addImage")}</div>
            </>}
          </div>
        )}
      </div>
      {imgs.length > 0 && (
        <div style={{ fontSize:11, color:C.inkFade, textAlign:"center", marginBottom:14 }}>
          {t('common.uploadSummary', { current: imgs.length, max: UPLOAD_LIMITS.MAX_FILES, imgMax: UPLOAD_LIMITS.MAX_IMAGE_MB, vidMax: UPLOAD_LIMITS.MAX_VIDEO_MB })}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*,video/*" multiple style={{ display:"none" }} onChange={(e) => {
        const { accepted } = processFileSelection(e.target.files || [], imgs.length);
        if (accepted.length) handleFilesChange(accepted);
        if (fileRef.current) fileRef.current.value = "";
      }}/>
      {onNext && <PBtn label={t("ww.btn.next")} onClick={onNext} disabled={imgs.length === 0} />}
    </div>
  );
}

// Screen 2 – Basisinformationen
function S2({ data, onChange, onNext }) {
  const { t } = useTranslation();
  const [ti, setTi] = useState("");
  const tags=data.tags||[];
  function addTag() { const t=ti.trim(); if (!t||tags.includes(t)){setTi("");return;} onChange({ tags:[...tags,t] }); setTi(""); }
  return (
    <div>
      <div style={{ fontSize:20, fontWeight: 600, color:C.ink, marginBottom:16 }}>{t("ww.title.basics")}</div>
      <FI label={t("ww.field.title")} req value={data.title||""} onChange={v=>onChange({title:v})} placeholder={t("ww.ph.title")} maxLen={80}/>
      {/* KURZBESCHREIBUNG-REMOVED-FIX (2026-08-07): Feld auf Nutzerwunsch entfernt --
          Titel + Detaillierte Beschreibung reichen aus. `data.shortDesc` bleibt im
          Formular-State/Payload erhalten (mappt weiterhin auf DB-Spalte "caption"),
          damit bestehende Werke mit vorhandenem caption-Wert beim Bearbeiten NICHT
          stillschweigend geloescht werden -- lediglich das Eingabefeld verschwindet. */}
      <FTA label={t("ww.field.description")} value={data.description||""} onChange={v=>onChange({description:v})} placeholder={t("ww.ph.description")} maxLen={1000} rows={4}/>
      <FSel label={t("ww.field.category")} req value={data.category||""} onChange={v=>onChange({category:v})} options={getKategorien(t)}/>
      <div style={{ marginBottom:14 }}>
        <Lbl text={t("ww.field.tags")}/>
        <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:8 }}>
          {tags.map(tag=>(
            <div key={tag} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 11px", borderRadius:99, background:"rgba(14,196,184,0.10)", border:"1.5px solid rgba(14,196,184,0.28)", fontSize:12.5, fontWeight:600, color:C.teal }}>
              {tag}
              <button onClick={()=>onChange({ tags:tags.filter(t=>t!==tag) })} style={{ background:"none", border:"none", padding:0, cursor:"pointer", color:C.teal, fontSize:14, lineHeight:1 }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <input value={ti} onChange={e=>setTi(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),addTag())} placeholder={t("ww.ph.tag")} style={{ flex:1, padding:"9px 13px", borderRadius:99, border:"1.5px dashed rgba(14,196,184,0.35)", outline:"none", fontSize:13, fontFamily:"inherit", color:C.ink, background:"transparent" }}/>
          {ti&&<button onClick={addTag} style={{ background:C.teal, border:"none", borderRadius:99, padding:"9px 14px", fontSize:12, fontWeight: 600, color:"#fff", cursor:"pointer", touchAction:"manipulation" }}>+</button>}
        </div>
      </div>
      {onNext && <PBtn label={t("ww.btn.next")} onClick={onNext} disabled={!data.title?.trim()||!data.category}/>}
    </div>
  );
}

// Screen 3 – Werktyp
// STOCK-WIZARD-002 (2026-08-16, Michael-Request): Stückanzahl fehlte im
// Erstellungsprozess -- Originalwerk = automatisch 1 Stück (Unikat),
// Druck/Reproduktion = Nutzer gibt Anzahl Stück an, Digitales Werk =
// unbegrenzt (Download). Speist is_unique/stock_total/stock_available
// in public.works (bereits vorhanden, bislang nur mit DB-Defaults belegt).
function S3({ data, onChange, onNext }) {
  const { t } = useTranslation();
  const werkTypen = getWerkTypen(t);
  const isDruck = data.werktyp === "druck";
  const stockNum = parseInt(data.stockCount, 10);
  const stockValid = Number.isInteger(stockNum) && stockNum >= 1;
  return (
    <div>
      <div style={{ fontSize:20, fontWeight: 600, color:C.ink, marginBottom:4 }}>{t("ww.title.werktyp")}</div>
      <div style={{ fontSize:13, color:C.inkMid, marginBottom:16 }}>{t("ww.hint.werktyp")}</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
        {werkTypen.map(wt=><RCard key={wt.id} active={data.werktyp===wt.id} icon={wt.icon} label={wt.label} sub={wt.sub} onClick={()=>onChange({werktyp:wt.id})}/>)}
      </div>

      {/* ── Stückanzahl (STOCK-WIZARD-002) ── */}
      {data.werktyp === "original" && (
        <div style={{
          display:"flex", alignItems:"center", gap:10, padding:"12px 14px",
          borderRadius:12, background:"rgba(14,196,184,0.07)",
          border:`1.5px solid ${C.border}`, marginBottom:20,
          animation:"wfFadeStep 0.2s ease both",
        }}>
          <span style={{ fontSize:18, flexShrink:0 }}>1️⃣</span>
          <div style={{ fontSize:12.5, color:C.inkMid }}>
            <strong style={{ color:C.ink, fontWeight:600 }}>{t("ww.unicat")}</strong> — {t("ww.unicat.sub")}
          </div>
        </div>
      )}

      {isDruck && (
        <div style={{ marginBottom:20, animation:"wfFadeStep 0.2s ease both" }}>
          <Lbl text={t("ww.field.stock")} req/>
          <input
            type="number" min="1" step="1" inputMode="numeric"
            value={data.stockCount||""}
            onChange={e=>onChange({stockCount:e.target.value})}
            placeholder={t("ww.ph.stock")}
            style={{
              ...INP,
              borderColor: data.stockCount ? C.teal : "rgba(26,26,24,0.10)",
            }}
          />
          <div style={{ fontSize:11.5, color:C.inkFade, marginTop:6 }}>
            {t("ww.hint.stock")}
          </div>
        </div>
      )}

      {data.werktyp === "digital" && (
        <div style={{
          display:"flex", alignItems:"center", gap:10, padding:"12px 14px",
          borderRadius:12, background:"rgba(14,196,184,0.07)",
          border:`1.5px solid ${C.border}`, marginBottom:20,
          animation:"wfFadeStep 0.2s ease both",
        }}>
          <span style={{ fontSize:18, flexShrink:0 }}>♾️</span>
          <div style={{ fontSize:12.5, color:C.inkMid }}>
            <strong style={{ color:C.ink, fontWeight:600 }}>{t("ww.unlimited")}</strong> — {t("ww.unlimited.sub")}
          </div>
        </div>
      )}

      {onNext && <PBtn label={t("ww.btn.next")} onClick={onNext} disabled={!data.werktyp || (isDruck && !stockValid)}/>}
    </div>
  );
}

// Screen 4 – Preis & Verkauf
function S4({ data, onChange, onNext }) {
  const { t } = useTranslation();
  // VERFUEGBARKEIT-VEREINFACHT (2026-08-20, Michael-Report): "Reserviert"/
  // "Verkauft" ergaben in diesem Erstellungs-Schritt keinen Sinn -- beide
  // Werte mappten ohnehin schon vorher 1:1 auf dasselbe for_sale=false
  // (siehe Speicher-Logik unten), es gab also nie eine echte fachliche
  // Unterscheidung dahinter. Auf Michaels Wunsch ersetzt durch eine
  // Option, die tatsaechlich zum Erstellungs-Kontext passt: individuell
  // gefertigte Werke (z.B. Moebel), die erst NACH einer Anfrage entstehen.
  const VERF=[
    { id:"available",  label:t("ww.avail.available"),       sub:t("ww.avail.available.sub") },
    { id:"on_request",  label:t("ww.avail.onrequest"),  sub:t("ww.avail.onrequest.sub") },
  ];
  return (
    <div>
      <div style={{ fontSize:20, fontWeight: 600, color:C.ink, marginBottom:6 }}>{t("ww.title.price")}</div>
      <div style={{ fontSize:13, color:C.inkFade, marginBottom:20 }}>{t("ww.hint.price")}</div>

      {/* ── PREIS: volle Breite, große Schrift ── */}
      <div style={{ marginBottom:20 }}>
        <Lbl text={t("ww.field.price")} req/>
        <div style={{ position:"relative" }}>
          <span style={{
            position:"absolute", left:16, top:"50%", transform:"translateY(-50%)",
            fontSize:26, fontWeight: 600, color:"rgba(14,196,184,0.6)",
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
              fontWeight: 600,
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
            {t("ww.hint.shippingCost")}
          </div>
        )}
      </div>

      {/* ── VERFÜGBARKEIT ── */}
      <div style={{ marginBottom:8 }}>
        <Lbl text={t("ww.field.availability")} req/>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {VERF.map(v=>(
            <RCard key={v.id} active={data.availability===v.id}
              label={v.label} sub={v.sub}
              onClick={()=>onChange({availability:v.id})}/>
          ))}
        </div>
      </div>

      {onNext && <PBtn label={t("ww.btn.next")} onClick={onNext} disabled={!data.price||!data.availability}/>}
    </div>
  );
}

// Screen 5 – Versand & Abholung
function S5({ data, onChange, onNext, onPickLocation }) {
  const { t } = useTranslation();
  const NAT=t("ww.nat").split(",");
  const INT=t("ww.int").split(",");
  return (
    <div>
      <div style={{ fontSize:20, fontWeight: 600, color:C.ink, marginBottom:16 }}>{t("ww.title.shipping")}</div>
      <Toggle label={t("ww.toggle.shipping")} value={!!data.versand} onChange={v=>onChange({versand:v})}/>
      {data.versand&&(
        <div style={{ background:"rgba(14,196,184,0.04)", border:"1.5px solid rgba(14,196,184,0.15)", borderRadius:14, padding:"14px 14px 4px", marginBottom:12 }}>
          <FSel label={t("ww.field.shippingNational")} value={data.versandNational||""} onChange={v=>onChange({versandNational:v})} options={NAT}/>
          <FSel label={t("ww.field.shippingInternational")} value={data.versandInternational||""} onChange={v=>onChange({versandInternational:v})} options={INT}/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
            {[[t("ww.field.shippingCost"),"versandkosten"],[t("ww.field.shippingFree"),"versandFrei"]].map(([lbl,key])=>(
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
      <Toggle label={t("ww.toggle.pickup")} value={!!data.abholung} onChange={v=>onChange({abholung:v})}/>
      {data.abholung&&(
        <div style={{ background:"rgba(14,196,184,0.04)", border:"1.5px solid rgba(14,196,184,0.15)", borderRadius:14, padding:"14px 14px 6px", marginBottom:12 }}>
          <div style={{ marginBottom:14 }}>
            <Lbl text={t("ww.field.pickupLocation")}/>
            <LocationAutocompleteInput
              value={data.abholort||""}
              onChange={v=>onChange({abholort:v})}
              onPick={onPickLocation}
              placeholder={t("ww.ph.pickupLocation")}
              style={INP}
            />
          </div>
        </div>
      )}
      {!data.versand&&!data.abholung&&(
        <div style={{ padding:"12px 14px", borderRadius:12, background:"rgba(239,68,68,0.06)", border:"1.5px solid rgba(239,68,68,0.15)", fontSize:12.5, color:"rgba(239,68,68,0.8)", marginBottom:12 }}>
          {t("ww.warn.minOption")}
        </div>
      )}
      {onNext && <PBtn label={t("ww.btn.next")} onClick={onNext} disabled={!data.versand&&!data.abholung}/>}
    </div>
  );
}

// Screen 6 – Sichtbarkeit & Speichern
function S6({ data, onChange, onSave, onDraft, saving, hideButtons=false }) {
  const { t } = useTranslation();
  const SICHT=[
    { id:"public",      icon:"🌍", label:t("ww.vis.public"),   sub:t("ww.vis.public.sub") },
    { id:"connections", icon:"🔗", label:t("ww.vis.connections"), sub:t("ww.vis.connections.sub") },
    { id:"private",     icon:<HUIPrivatIcon size={16}/>, label:t("ww.vis.private"),       sub:t("ww.vis.private.sub") },
  ];
  const cover=data.images?.[0]?.url;
  const ps=data.price?`${formatNumberDE(parseFloat(data.price), {minimumFractionDigits:2})} ${data.currency||"€"}`:"—";
  return (
    <div>
      <div style={{ fontSize:20, fontWeight: 600, color:C.ink, marginBottom:4 }}>{t("ww.title.visibility")}</div>
      <div style={{ fontSize:13, color:C.inkMid, marginBottom:16 }}>{t("ww.hint.visibility")}</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
        {SICHT.map(s=><RCard key={s.id} active={(data.sichtbarkeit||"public")===s.id} icon={s.icon} label={s.label} sub={s.sub} onClick={()=>onChange({sichtbarkeit:s.id})}/>)}
      </div>
      <div style={{ background:"#fff", border:`1.5px solid ${C.border}`, borderRadius:16, padding:14, marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight: 600, color:C.inkMid, marginBottom:12 }}>{t("ww.title.summary")}</div>
        <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
          {cover&&<img loading="lazy" decoding="async" src={cover} alt="" style={{ width:64, height:64, borderRadius:10, objectFit:"cover", flexShrink:0 }}/>}
          <div>
            <div style={{ fontSize:14, fontWeight: 600, color:C.ink, marginBottom:2 }}>{data.title||"—"}</div>
            <div style={{ fontSize:14, fontWeight: 600, color:C.teal, marginBottom:6 }}>{ps}</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {data.availability==="available"&&<span style={{ fontSize:11, fontWeight:600, color:"#22c55e", display:"flex", alignItems:"center", gap:4 }}><span style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", display:"inline-block" }}/>{t("ww.badge.available")}</span>}
              {data.availability==="on_request"&&<span style={{ fontSize:11, fontWeight:600, color:C.teal, display:"flex", alignItems:"center", gap:4 }}><span style={{ width:6, height:6, borderRadius:"50%", background:C.teal, display:"inline-block" }}/>{t("ww.badge.onrequest")}</span>}
              {data.versand&&<span style={{display:"flex",alignItems:"center",gap:3, fontSize:11, fontWeight:600, color:C.inkMid}}><HUIVersandIcon size={11}/>{t("ww.badge.shipping")}</span>}
              {data.abholung&&<span style={{ fontSize:11, fontWeight:600, color:C.inkMid }}>{t("ww.badge.pickup")}</span>}
            </div>
          </div>
        </div>
      </div>
      {!hideButtons && <><PBtn label={t("ww.btn.submit")} onClick={onSave} loading={saving}/><SBtn label={t("ww.btn.draft")} onClick={onDraft}/></>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// WIZARD ROOT
// ══════════════════════════════════════════════════════════════
export default function WerkWizard({ userId, existingWork=null, onClose = () => {}, onSaved = () => {} }) {
  const { t } = useTranslation();
  // BANK-GATE-001 (2026-08-21, Michele-Report): Bankdaten-Pruefung passierte
  // bisher NUR beim finalen Speichern (Schritt 6) -- Nutzer fuellte den
  // gesamten 6-Schritte-Wizard aus, verlor beim Fehlschlag alle Eingaben und
  // musste komplett neu anfangen. Fix: Check JETZT beim Oeffnen des Wizards,
  // VOR Schritt 1 -- fehlen Bankdaten, wird sofort ein Hinweis mit direktem
  // Bankdaten-Zugang gezeigt, bevor ueberhaupt etwas eingetippt wird.
  const [bankHasDetails, setBankHasDetails] = useState(null); // null=pruefe, true/false=Ergebnis
  const [showBankModal, setShowBankModal]   = useState(false);
  const checkBank = useCallback(async () => {
    if (!userId) { setBankHasDetails(true); return; }
    try {
      const { data } = await supabase.rpc("rpc_get_ambassador_bank_status", { p_ambassador_id: userId });
      setBankHasDetails(!!data?.has_bank_details);
    } catch (e) {
      console.warn("[WerkWizard] bank-gate check failed:", e?.message);
      setBankHasDetails(true); // fail-open: bei Netzwerkfehler nicht blockieren
    }
  }, [userId]);
  useEffect(() => { checkBank(); }, [checkBank]);

  const TOTAL=6;
  const [step,setSt]=useState(1);
  const [saving,setSaving]=useState(false);
  const [saveError,setSaveError]=useState(null);
  // KBD-INSET-FIX (2026-08-20, Michael-Report): Hook war importiert, aber nie
  // aufgerufen — dadurch passte sich der fixed-position Wizard nie an eine
  // offene Tastatur an. Kategorie/Tags in Schritt 2 verschwanden hinter der
  // Tastatur, ohne dass irgendetwas den sichtbaren Bereich verkleinerte oder
  // dahin scrollte. Siehe Fix am Root-Container unten (bottom: var(--hui-keyboard-inset)).
  useKeyboardInset();
  // Praezise Koordinaten aus einem angetippten Autocomplete-Vorschlag (Standort
  // fuer Abholung) -- siehe LocationAutocompleteInput.jsx. Wird beim Speichern
  // direkt uebernommen statt erneut zu geocodieren. Zurueckgesetzt sobald der
  // Ort danach manuell weiter bearbeitet wird.
  const [pickedGeo,setPickedGeo]=useState(null);
  const [form,setForm]=useState(()=>{
    if (existingWork) {
      let imgs=[];
      // WORKS-EDIT-MEDIA-FIX (2026-08-31): works.images ist text[] (Array von
      // URL-Strings), PostgREST liefert es bereits als JS-Array. JSON.parse
      // auf ein Array schlaegt fehl → Bilder jenseits cover_url gingen im
      // Edit-Modus verloren. Korrekte Behandlung:
      if (Array.isArray(existingWork.images)) {
        // text[] → PostgREST gibt JS-Array von URL-Strings zurueck
        imgs = existingWork.images.map(u => ({ url: typeof u === 'object' ? (u.url || '') : u }));
      } else if (typeof existingWork.images === 'string') {
        // Fallback: JSON-String (Legacy oder manuell eingetragen)
        try { imgs = JSON.parse(existingWork.images); } catch {}
      }
      if (!imgs.length && existingWork.cover_url) imgs = [{ url: existingWork.cover_url }];
      return {
        images:imgs, title:existingWork.title||"", shortDesc:existingWork.caption||"",
        description:existingWork.description||"", category:existingWork.category||"",
        tags:existingWork.tags||[], werktyp:existingWork.file_format||existingWork.medium||"",
        // STOCK-WIZARD-002: bestehende Stückzahl nur bei "Druck" (mehrfach) vorbelegen
        stockCount: (!existingWork.is_unique && existingWork.stock_total)
          ? String(existingWork.stock_total) : "",
        price:existingWork.price||"", currency:"EUR",
        // "sold" existiert als Option nicht mehr (siehe VERFUEGBARKEIT-VEREINFACHT
        // oben) -- Werke mit for_sale=false laden jetzt auf "on_request" statt
        // auf einen inzwischen entfernten Options-Wert.
        availability:existingWork.for_sale?"available":"on_request",
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
      werktyp:"", stockCount:"", price:"", currency:"EUR", availability:"available",
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

    // BANKDATEN-002 (2026-08-16): Vor dem Verkaufen/Veröffentlichen pruefen,
    // ob der Nutzer Bankdaten hinterlegt hat. Ohne stripe_account_id wuerde
    // confirm-and-transfer bei einer Kaeufer-Bestaetigung keinen Stripe-
    // Transfer ausloesen koennen -- das Geld bliebe im Escrow stecken.
    if (status === "published" || status === "available") {
      try {
        const { data: bankCheck } = await supabase.rpc("rpc_get_ambassador_bank_status", { p_ambassador_id: userId });
        if (!bankCheck?.has_bank_details) {
          setSaving(false);
          setSaveError(t("ww.bank.error"));
          return;
        }
      } catch (e) {
        // Wenn der Check fehlschlaegt, nicht blockieren -- save laeuft weiter
        console.warn("[WerkWizard] bank-check failed:", e?.message);
      }
    }
    const cover_url=form.images?.[0]?.url||null;

    // Geokoordinaten fuer Abholort ermitteln (Standort-Feature 2026-07-06,
    // fuer Umkreissuche auf Discover-Seite, siehe geocoding.js).
    // Nur wenn sich der Ort seit dem letzten Speichern geaendert hat oder
    // noch keine Koordinaten vorhanden sind.
    let geoLat = existingWork?.lat ?? null, geoLng = existingWork?.lng ?? null;
    const abholortTrimmed = (form.abholort || "").trim();
    if (pickedGeo) {
      // Ort wurde per Autocomplete-Vorschlag ausgewaehlt und seither nicht
      // manuell veraendert -- exakte Koordinaten direkt uebernehmen.
      geoLat = pickedGeo.lat; geoLng = pickedGeo.lng;
    } else if (abholortTrimmed && abholortTrimmed !== (existingWork?.location_text || "").trim()) {
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
    // WERK-BILDER-SLIDE-FIX (2026-08-20, Michael-Feedback "Bilder lassen
    // sich nicht sliden"): works.images ist eine text[]-Spalte (KEIN
    // jsonb, anders als experiences.images/talents.images) -- Objekte
    // {url,path} wurden hier bisher hineingeschrieben, PostgREST musste
    // sie dafür pro Element zu einem JSON-STRING serialisieren
    // ('{"url":"...","path":"..."}' als Text). Jeder Consumer, der
    // images[] direkt als URL erwartete (Feed, WorkDetailPage), bekam
    // dadurch keine gültige Bild-URL mehr -> nur cover_url zeigte an,
    // kein Sliden möglich. Fix: nur noch Klartext-URL-Strings schreiben,
    // exakt wie experiences/talents es der Leseseite liefern.
    const imagesArr = (form.images||[]).map(img =>
      typeof img === "object" ? (img.url || "") : img
    ).filter(Boolean);

    // ── Payload: exakt die Spalten die in public.works existieren ──
    // Bestätigt vorhanden: category, caption, cover_url, creator_id,
    //   description, file_format, for_sale, images, location_text, materials,
    //   price, sale_mode, shipping, shipping_cost, shipping_countries,
    //   shipping_time, status, tags, visibility, is_unique, stock_total,
    //   stock_available (COMMERCE-STOCK-001, verifiziert per REST-API 2026-08-16)
    // NICHT in DB: medium → gemappt auf file_format
    // NICHT in DB: media_url, size, condition → entfernt

    // ── Stückanzahl (STOCK-WIZARD-002) ──────────────────────────
    // original  → Unikat, exakt 1 Stück
    // druck     → Nutzer-Eingabe (Mehrfachproduktion)
    // digital   → unbegrenzt (kein Bestandslimit, Download)
    let is_unique, stock_total;
    if (form.werktyp === "druck") {
      is_unique = false;
      stock_total = Math.max(1, parseInt(form.stockCount, 10) || 1);
    } else if (form.werktyp === "digital") {
      is_unique = false;
      stock_total = null; // unbegrenzt
    } else {
      is_unique = true;
      stock_total = 1;
    }
    // stock_available: bei Neuanlage = kompletter Bestand. Bei Bearbeitung
    // wird nur die DIFFERENZ zum bisherigen stock_total angewendet, damit
    // bereits verkaufte Stückzahlen nicht zurückgesetzt werden.
    let stock_available;
    if (existingWork?.id) {
      const oldTotal = existingWork.stock_total ?? 1;
      const oldAvail = existingWork.stock_available ?? oldTotal;
      stock_available = (stock_total === null)
        ? null
        : Math.max(0, Math.min(stock_total, oldAvail + (stock_total - oldTotal)));
    } else {
      stock_available = stock_total;
    }

    const payload = {
      user_id:      userId,
      // WERK-CREATOR-ID-FIX (2026-08-07): DB-Spalte "creator_id" ist NOT NULL
      // (FK auf auth.users, identisch zu user_id in allen Bestandsdaten) und
      // wurde hier nie gesetzt → "null value in column creator_id" Fehler bei
      // JEDEM Speichern (Entwurf + Einreichen). Fix: creator_id = userId,
      // exakt wie in allen bisherigen DB-Zeilen (user_id === creator_id).
      creator_id:   userId,
      // POST-TYPE-FIX (2026-08-20, Michael-Feedback): post_type wurde hier
      // nie gesetzt -- die DB-Spalte fiel dadurch auf ihren Default zurueck
      // (faelschlich 'moment' statt 'work'). WorkFlow.jsx (separater
      // Creation-Flow) setzte es bereits korrekt -- hier additiv ergaenzt,
      // analog zu useLiveTicker.js/WorkDetailPage.jsx, die post_type='work'
      // als literalen Kontext-Wert erwarten (polymorphe Kommentare/
      // Reaktionen/Live-Ticker-Filter).
      post_type:    "work",
      title:        form.title        || "",
      description:  form.description  || null,
      caption:      form.shortDesc    || null,
      cover_url,
      images:       imagesArr,
      category:     form.category     || null,
      tags:         form.tags         || [],
      file_format:  form.werktyp      || null,
      is_unique,
      stock_total,
      stock_available,
      price:        parseFloat(form.price) || null,
      // Beide Verfuegbarkeits-Optionen ("available" + "on_request") sind
      // fuer Interessenten anfragbar/kaufbar -- der Unterschied ist rein
      // informativ (fertig vorhanden vs. wird erst gefertigt), keine Sperre.
      for_sale:     form.availability === "available" || form.availability === "on_request",
      sale_mode:    "fixed",
      materials:    form.material     || null,
      shipping:     !!form.versand,
      shipping_available: !!form.versand,
      pickup_available:    !!form.abholung,
      is_digital:          form.werktyp === "digital" || form.category === "digital",
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
      // Approval System: beim Einreichen immer pending, nur Admin kann auf approved setzen.
      // ENTWURF-BADGE-FIX (2026-08-20, Michael-Report "wird NICHT als Entwurf
      // gekennzeichnet"): Erster Versuch war hier ":null" bei status="draft"
      // -- FALSCH: works.approval_status ist NOT NULL + CHECK IN
      // ('pending','approved','rejected') (Migration 20260609_works_approval_
      // system.sql). null hätte JEDEN Entwurf-Speichervorgang mit 23502/23514
      // crashen lassen. Zurück auf ":undefined" (Feld fehlt im Payload, DB-
      // Default 'pending' greift bei Neuanlage) -- das war nie das Problem.
      // Der tatsächliche Fix für die Badge-Anzeige liegt in MyBasisProfile.jsx
      // (isDraft muss Vorrang vor isPending haben, siehe dort).
      approval_status: status === "pending_review" ? "pending" : undefined,
      // Bei Update: rejection_reason zurücksetzen (neue Prüfung)
      rejection_reason: status === "pending_review" ? null : undefined,
      // Snapshot der alten Version für Admin-Diff (nur wenn is_update=true)
      ...snapshotPayload,
    };

    // ── Pre-Save: Session prüfen, ggf. refreshen ──
    const { data: { session: curSession } } = await supabase.auth.getSession();
    if (!curSession?.access_token) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (!refreshed?.session?.access_token) {
        setSaving(false);
        setSaveError("Sitzung abgelaufen — bitte abmelden und neu anmelden.");
        setTimeout(() => setSaveError(null), 8000);
        return;
      }
    }

    const { data:saved, error }=existingWork?.id
      ? await supabase.from("works").update(payload).eq("id",existingWork.id).eq("user_id",userId).select().single()
      : await supabase.from("works").insert(payload).select().single();
    setSaving(false);
    if (error) {
      console.error("[SAVE WERK] DB-ERROR:", error.message, "| code:", error.code);
      // RLS-Fehler (42501) = Session abgelaufen → spezifische Meldung
      const isRLS = error.code === "42501" || /row-level security/i.test(error.message || "");
      setSaveError(isRLS
        ? "Sitzung abgelaufen — bitte abmelden und neu anmelden."
        : (error.message || "Speichern fehlgeschlagen"));
      setTimeout(() => setSaveError(null), isRLS ? 8000 : 5000);
      return;
    }
    // FIX (2026-08-13): Erstes Werk kann Orb-Stufe (3=has_content) triggern —
    // Cache invalidieren, sonst haengt der Orb bis zu 5 Min. auf altem Wert.
    invalidateOrbStageCache(userId);
    // WERK-CRASH-FIX (2026-08-21): "onSave?.(saved)" wurde hier aufgerufen,
    // obwohl "onSave" NIE ein Prop von WerkWizard ist (Signatur oben nur
    // onClose/onSaved) — jeder Aufruf warf "ReferenceError: onSave is not
    // defined", NACH dem erfolgreichen DB-Insert. Nutzer sahen einen Crash-
    // Screen trotz erfolgreich gespeichertem Werk (Michèle-Report 2026-08-21,
    // App v2.1.332). Bug bestand bereits seit Commit 79b79a765 (2026-06-10) —
    // niemand übergibt einen "onSave"-Prop an <WerkWizard>, nur "onSaved".
    onSaved?.(saved);
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
  useModalRegistration(true, onClose, "WerkWizard");

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
      case 3: return !!form.werktyp && (form.werktyp !== "druck" || (Number.isInteger(parseInt(form.stockCount,10)) && parseInt(form.stockCount,10) >= 1));
      case 4: return !!(form.price) && !!form.availability;
      case 5: return !!(form.versand || form.abholung);
      case 6: return true;
      default: return true;
    }
  }, [step, form]);

  const isLast = step === TOTAL;

  // ── BANK-GATE-001: Lade-/Sperr-Screen VOR dem eigentlichen Wizard ──
  if (bankHasDetails === null) {
    return createPortal(
      <div style={{ position:"fixed", inset:0, zIndex:10500, background:C.cream, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:28, height:28, border:`3px solid ${C.border}`, borderTopColor:C.teal, borderRadius:"50%", animation:"hui-bankgate-spin 0.8s linear infinite" }}/>
        <style>{"@keyframes hui-bankgate-spin{to{transform:rotate(360deg)}}"}</style>
      </div>,
      document.body
    );
  }
  if (bankHasDetails === false) {
    return createPortal(
      <div data-hui-kbd-self-managed style={{ position:"fixed", inset:0, zIndex:10500, background:C.cream, display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"max(var(--hui-safe-top, 0px), 14px, env(safe-area-inset-top, 14px)) 20px 12px", background:"#fff", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ width:28 }}/>
          <div style={{ fontSize:14, fontWeight:600, color:C.ink }}>{t("ww.bank.title")}</div>
          <button onClick={() => onClose?.()} style={{ width:28, height:28, borderRadius:"50%", background:"rgba(26,26,24,0.07)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", touchAction:"manipulation" }}>
            <span style={{ fontSize:14, color:C.ink }}>×</span>
          </button>
        </div>
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px 28px", textAlign:"center", gap:14 }}>
          <div style={{ fontSize:44 }}>🏦</div>
          <div style={{ fontSize:17, fontWeight:600, color:C.ink }}>{t("ww.bank.missing")}</div>
          <div style={{ fontSize:14, color:C.inkMid, lineHeight:1.5 }}>
            {t("ww.bank.body")}
          </div>
        </div>
        <div style={{ padding:"0 20px calc(20px + env(safe-area-inset-bottom, 0px))" }}>
          <PBtn label={t("ww.bank.btn")} onClick={() => setShowBankModal(true)}/>
          <SBtn label={t("ww.btn.cancel")} onClick={() => onClose?.()}/>
        </div>
        {showBankModal && (
          <BankdatenModal
            userId={userId}
            onClose={() => setShowBankModal(false)}
            onSaved={() => { setShowBankModal(false); checkBank(); }}
          />
        )}
      </div>,
      document.body
    );
  }

  return createPortal(
    /* Fullscreen — zIndex 10500 überschreibt BottomNav (9999) + ProfileLauncher (9500) */
    <div data-hui-kbd-self-managed style={{
      position:"fixed", top:0, left:0, right:0,
      bottom:"var(--hui-keyboard-inset, 0px)", // KBD-INSET-FIX (2026-08-20)
      zIndex:10500,
      background:C.cream,
      display:"flex", flexDirection:"column",
      transition:"bottom .15s ease-out",
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
        {t("ww.stepOf", {step, total: TOTAL})}
      </div>

      {/* ── SCROLLBARER CONTENT ───────────────────────────── */}
      <div className="hui-scroll" style={{
        flex:1,
        overflowY:"auto",
        WebkitOverflowScrolling:"touch",
        padding:"20px 20px 0",
      }}>
        {step===1&&<S1 data={form} onChange={patch} userId={userId} onNext={null}/>}
        {step===2&&<S2 data={form} onChange={patch} onNext={null}/>}
        {step===3&&<S3 data={form} onChange={patch} onNext={null}/>}
        {step===4&&<S4 data={form} onChange={patch} onNext={null}/>}
        {step===5&&<S5 data={form} onChange={patch} onNext={null} onPickLocation={place=>{ patch({abholort:place.label}); setPickedGeo({lat:place.lat,lng:place.lng}); }}/>}
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
          <HUIWarnIcon size={14} style={{flexShrink:0}} />
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
        paddingBottom:`max(20px, max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 20px), 20px))`,
        display:"flex", gap:10,
        boxShadow:"0 -4px 20px rgba(0,0,0,0.06)",
      }}>
        {/* Zurück */}
        {step > 1 ? (
          <button onClick={back} style={{
            flex:1, padding:"15px",
            background:"rgba(26,26,24,0.06)", border:"none",
            borderRadius:14, fontSize:14, fontWeight: 600,
            color:C.inkMid, cursor:"pointer",
            fontFamily:"inherit", touchAction:"manipulation",
          }}>{t("ww.btn.back")}</button>
        ) : (
          <button onClick={onClose} style={{
            flex:1, padding:"15px",
            background:"rgba(26,26,24,0.06)", border:"none",
            borderRadius:14, fontSize:14, fontWeight: 600,
            color:C.inkMid, cursor:"pointer",
            fontFamily:"inherit", touchAction:"manipulation",
          }}>{t("ww.btn.cancel")}</button>
        )}

        {/* Weiter / Speichern */}
        {!isLast && (
          <button onClick={next} disabled={!canContinue()} style={{
            flex:2, padding:"15px",
            background:canContinue()
              ? `linear-gradient(135deg,${C.teal},${C.tealD})`
              : "rgba(14,196,184,0.32)",
            border:"none", borderRadius:14,
            color:"#fff", fontSize:16, fontWeight: 600,
            cursor:canContinue()?"pointer":"not-allowed",
            fontFamily:"inherit", touchAction:"manipulation",
            transition:"background .18s",
          }}>
            {t("ww.btn.nextArrow")}
          </button>
        )}
        {isLast && (
          <button onClick={()=>save("pending_review")} disabled={saving} style={{
            flex:2, padding:"15px",
            background:saving
              ? "rgba(14,196,184,0.32)"
              : `linear-gradient(135deg,${C.teal},${C.tealD})`,
            border:"none", borderRadius:14,
            color:"#fff", fontSize:15, fontWeight: 600,
            cursor:saving?"not-allowed":"pointer",
            fontFamily:"inherit", touchAction:"manipulation",
          }}>
            {saving?t("ww.btn.submitting"):t("ww.btn.submit")}
          </button>
        )}
      </div>
      {/* Entwurf-Button: nur in Schritt 6, unter dem Footer */}
      {isLast && (
        <div style={{
          textAlign:"center",
          paddingBottom:"max(12px, max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 12px), 12px))",
          background:"#fff",
        }}>
          <button onClick={()=>save("draft")} disabled={saving} style={{
            background:"none", border:"none",
            color:C.teal, fontSize:13, fontWeight:600,
            cursor:"pointer", fontFamily:"inherit",
            touchAction:"manipulation", padding:"8px 24px",
          }}>
            {t("common.draft")}
          </button>
        </div>
      )}
    </div>
  ,
    document.body
  );
}
