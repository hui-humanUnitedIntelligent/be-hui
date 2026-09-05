// src/components/experiences/ExperienceWizard.jsx
// HUI – Erlebnis-Editor: 4-Schritte-Wizard (v2)
// Schritt 1: Basis | 2: Wann & Wo | 3: Teilnahme | 4: Veröffentlichen
import {
  HUIVorOrtIcon, HUIOnlineIcon,
  HUIKalenderIcon, HUIZeitIcon, HUILocationIcon,
  HUIPersonenIcon, HUIEuroIcon, HUIEinladungIcon,
  HUIPrivatIcon, HUISchreibenIcon, HUIWarnIcon,
} from '../../design/icons/HuiSystemIcons.jsx';
import React, { useState, useRef, useCallback, useEffect } from "react";
import { toSafeUploadBody } from "../../lib/uploadBody.js";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { invalidateOrbStageCache } from "../../hooks/useOrbGrowthStage.js";
import { compressImageForUpload, JPEG_QUALITY, COVER_MAX_DIM } from "../../lib/profileMedia.js";
import { UPLOAD_LIMITS, uploadMediaFile, processFileSelection, uploadThumbnail } from "../../lib/uploadUtils.js";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { useKeyboardInset } from "../../hooks/useKeyboardInset.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import { searchPlaces, geocodeWithFallback } from "../../lib/geocoding.js";
import LocationAutocompleteInput from "../shared/LocationAutocompleteInput.jsx";
import { formatDateDE } from "../../lib/formatters.js";
import { HUI } from "../../design/hui.design.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import BankdatenModal from "../settings/BankdatenModal.jsx";
import VideoThumbnailPicker from "../shared/VideoThumbnailPicker.jsx";

// ── Design-Tokens ─────────────────────────────────────────────
const C = {
  teal:      HUI.COLOR.teal,
  tealD:     HUI.COLOR.tealDeep,
  tealSoft:  "rgba(14,196,184,0.08)",
  tealBdr:   "rgba(14,196,184,0.28)",
  cream:     HUI.COLOR.cream,
  white:     HUI.COLOR.white,
  ink:       HUI.COLOR.inkStudio,
  inkMid:    "rgba(26,26,24,0.55)",
  inkFade:   "rgba(26,26,24,0.35)",
  border:    "rgba(26,26,24,0.10)",
  borderMed: "rgba(26,26,24,0.16)",
  redSoft:   "rgba(239,68,68,0.08)",
  redBdr:    "rgba(239,68,68,0.20)",
};

// ── Erlebnis-Typen ────────────────────────────────────────────
const EXP_TYPEN = [
  { id:"workshop",    icon:"🛠️",  label:"Workshop"    },
  { id:"event",       icon:"🎉",  label:"Event"       },
  { id:"projekt",     icon:"🌱",  label:"Projekt"     },
  { id:"ausstellung", icon:"🖼️",  label:"Ausstellung" },
  { id:"kurs",        icon:"📚",  label:"Kurs"        },
  { id:"tour",        icon:"🗺️",  label:"Tour"        },
];

// ── Preis-Bezugsgrößen ────────────────────────────────────────
function getPreisPro(t) {
  return [
  { id:"Teilnehmer", label:t("ew.pp.teilnehmer"), sub:t("ew.pp.teilnehmer.sub") },
  { id:"Ticket",     label:t("ew.pp.ticket"),     sub:t("ew.pp.ticket.sub") },
  { id:"Stunde",     label:t("ew.pp.stunde"),     sub:t("ew.pp.stunde.sub") },
  { id:"Tag",        label:t("ew.pp.tag"),        sub:t("ew.pp.tag.sub") },
  { id:"Kurs",       label:t("ew.pp.kurs"),       sub:t("ew.pp.kurs.sub") },
  { id:"Gruppe",     label:t("ew.pp.gruppe"),     sub:t("ew.pp.gruppe.sub") },
  { id:"Monat",      label:t("ew.pp.monat"),      sub:t("ew.pp.monat.sub") },
  ];
}

function getSichtbarkeit(t) {
  return [
  { id:"public",      icon:"🌍", label:t("ew.sichtbar.public"),      sub:t("ew.sichtbar.public.sub") },
  { id:"connections", icon:"🔗", label:t("ew.sichtbar.connections"), sub:t("ew.sichtbar.connections.sub") },
  { id:"private",     icon:<HUIPrivatIcon size={16}/>, label:t("ew.sichtbar.private"), sub:t("ew.sichtbar.private.sub") },
  ];
}

// ══════════════════════════════════════════════════════════════
// Basis-Bausteine
// ══════════════════════════════════════════════════════════════
const INP_BASE = {
  width: "100%", boxSizing: "border-box",
  padding: "14px 16px", borderRadius: 14,
  border: `1.5px solid ${C.border}`,
  outline: "none", fontSize: 16,
  fontFamily: "inherit", color: C.ink, background: C.white,
  WebkitAppearance: "none", appearance: "none",
};

function Label({ text, req, hint }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.inkMid }}>{text}</span>
      {req && <span style={{ color: C.teal, marginLeft: 3, fontSize: 13 }}>*</span>}
      {hint && <span style={{ fontSize: 11.5, color: C.inkFade, marginLeft: 8 }}>{hint}</span>}
    </div>
  );
}

function Field({ label, req, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {label && <Label text={label} req={req} hint={hint}/>}
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, maxLen, type="text", inputMode }) {
  return (
    <div>
      <input
        type={type} inputMode={inputMode}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLen}
        style={INP_BASE}
      />
      {maxLen && (
        <div style={{ textAlign: "right", fontSize: 11, color: C.inkFade, marginTop: 4 }}>
          {value.length}/{maxLen}
        </div>
      )}
    </div>
  );
}

function TextArea({ value, onChange, placeholder, maxLen, rows=4 }) {
  return (
    <div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLen}
        style={{ ...INP_BASE, resize: "none", lineHeight: 1.6 }}
      />
      {maxLen && (
        <div style={{ textAlign: "right", fontSize: 11, color: C.inkFade, marginTop: 4 }}>
          {value.length}/{maxLen}
        </div>
      )}
    </div>
  );
}

// Typ-Chip: horizontale Grid-Kacheln (3 Spalten)
function TypChip({ active, icon, label, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "11px 14px", borderRadius: 12,
        border: active ? `2px solid ${C.teal}` : `1.5px solid ${C.border}`,
        background: active ? C.tealSoft : C.white,
        cursor: "pointer", touchAction: "manipulation",
        transition: "all .14s",
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: active ? 600 : 600, color: active ? C.teal : C.ink }}>
        {label}
      </span>
    </div>
  );
}

// Format-Pill: Vor Ort / Online
function FormatPill({ active, label, icon, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "14px 10px", borderRadius: 12,
        border: active ? `2px solid ${C.teal}` : `1.5px solid ${C.border}`,
        background: active ? C.tealSoft : C.white,
        cursor: "pointer", touchAction: "manipulation", transition: "all .14s",
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: active ? 600 : 600, color: active ? C.teal : C.ink }}>
        {label}
      </span>
    </div>
  );
}

// Preis-pro-Karte (vertikale Liste)
function PreisProCard({ active, item, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px", borderRadius: 12,
        border: active ? `2px solid ${C.teal}` : `1.5px solid ${C.border}`,
        background: active ? C.tealSoft : C.white,
        cursor: "pointer", touchAction: "manipulation", transition: "all .14s",
        minHeight: 54,
      }}
    >
      {/* Radio-Dot */}
      <div style={{
        width: 20, height: 20, borderRadius: "50%",
        border: active ? `2px solid ${C.teal}` : `2px solid ${C.border}`,
        background: active ? C.teal : "transparent",
        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {active && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }}/>}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: active ? C.teal : C.ink }}>{item.label}</div>
        <div style={{ fontSize: 11.5, color: C.inkMid, marginTop: 1 }}>{item.sub}</div>
      </div>
    </div>
  );
}

// Sichtbarkeits-Karte
function SichtCard({ active, item, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "16px", borderRadius: 14,
        border: active ? `2px solid ${C.teal}` : `1.5px solid ${C.border}`,
        background: active ? C.tealSoft : C.white,
        cursor: "pointer", touchAction: "manipulation", transition: "all .14s",
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: "50%",
        border: active ? `2px solid ${C.teal}` : `2px solid ${C.border}`,
        background: active ? C.teal : "transparent",
        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {active && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }}/>}
      </div>
      <div style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: active ? C.teal : C.ink }}>{item.label}</div>
        <div style={{ fontSize: 12, color: C.inkMid, marginTop: 2 }}>{item.sub}</div>
      </div>
    </div>
  );
}

// Ja/Nein Toggle-Pill
function JaNeinPill({ value, onChange }) {
  const { t } = useTranslation();
  return (
    <div style={{ display: "flex", gap: 10 }}>
      {[true, false].map(v => (
        <div
          key={String(v)}
          onClick={() => onChange(v)}
          style={{
            flex: 1, textAlign: "center", padding: "13px",
            borderRadius: 12, fontSize: 14, fontWeight: 600,
            border: value === v ? `2px solid ${C.teal}` : `1.5px solid ${C.border}`,
            background: value === v ? C.tealSoft : C.white,
            color: value === v ? C.teal : C.ink,
            cursor: "pointer", touchAction: "manipulation", transition: "all .14s",
          }}
        >
          {v ? t("ew.s3.ja") : t("ew.s3.nein")}
        </div>
      ))}
    </div>
  );
}

// ── Fortschrittsbalken oben ───────────────────────────────────
function ProgressBar({ step, total }) {
  const { t } = useTranslation();
  const LABELS = [t("ew.progress.basis"), t("ew.progress.wann"), t("ew.progress.teilnahme"), t("ew.progress.veroeff")];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 0, padding: "0 8px" }}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1; const done = n < step; const cur = n === step;
        return (
          <React.Fragment key={n}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, minWidth: 52 }}>
              <div style={{
                width: cur ? 30 : 24, height: cur ? 30 : 24, borderRadius: "50%",
                background: (done || cur) ? C.teal : "rgba(26,26,24,0.09)",
                border: cur ? `2.5px solid ${C.teal}` : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: cur ? 13 : 11, fontWeight: 600,
                color: (done || cur) ? "#fff" : C.inkFade,
                flexShrink: 0, transition: "all .22s",
                boxShadow: cur ? `0 0 0 4px rgba(14,196,184,0.18)` : "none",
              }}>
                {done ? "✓" : n}
              </div>
              <div style={{
                fontSize: 10, fontWeight: cur ? 600 : 500,
                color: cur ? C.teal : C.inkFade,
                textAlign: "center", lineHeight: 1.2,
                whiteSpace: "nowrap",
              }}>
                {LABELS[i]}
              </div>
            </div>
            {i < total - 1 && (
              <div style={{
                flex: 1, height: 2, marginTop: 14,
                background: done ? C.teal : "rgba(26,26,24,0.09)",
                transition: "background .22s",
              }}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Top Bar ───────────────────────────────────────────────────
function TopBar({ onClose, step, total, isEdit }) {
  const { t } = useTranslation();
  return (
    <div style={{ padding: "max(var(--hui-safe-top, 0px), 14px, env(safe-area-inset-top, 14px)) 20px 14px", background: C.white, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", padding: 0, fontSize: 13, fontWeight: 600, color: C.inkMid, cursor: "pointer", touchAction: "manipulation" }}>
          Abbrechen
        </button>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>
          {isEdit ? "Erlebnis bearbeiten" : "Erlebnis erstellen"}
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(26,26,24,0.07)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", touchAction: "manipulation" }}>
          <span style={{ fontSize: 16, color: C.ink, lineHeight: 1 }}>×</span>
        </button>
      </div>
      <ProgressBar step={step} total={total}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SCHRITT 1 — BASIS
// Titel · Typ · Kurzbeschreibung · Titelbild
// ══════════════════════════════════════════════════════════════
function S1({ data, onChange, userId, onCoverThumbFrame, existingThumbnailUrl, onUploadStateChange }) {
  const { t } = useTranslation();
  const [upl, setUpl] = useState(false);
  const ref = useRef(null);
  const imgs = data.images || [];

  async function upload(e) {
    const files = Array.from(e.target.files || []);
    if (!userId || !files.length) return;
    // Instant-Preview: lokale Blob-URLs SOFORT anzeigen
    const next = [...imgs];
    const previews = [];
    for (const file of files.slice(0, 5 - next.length)) {
      const isVid = file.type.startsWith("video/");
      const previewUrl = URL.createObjectURL(file);
      next.push({ url: previewUrl, path: null, _preview: true, type: isVid ? "video" : "image" });
      previews.push({ file, previewUrl, idx: next.length - 1, isVid });
    }
    onChange({ images: next });
    // Upload im Hintergrund
    setUpl(true);
    onUploadStateChange?.(true);
    for (const { file, previewUrl, idx, isVid } of previews) {
      try {
        if (isVid) {
          const result = await uploadMediaFile(file, userId, "experiences");
          next[idx] = { url: result.url, path: null, type: "video" };
        } else {
          const blob = await compressImageForUpload(file, COVER_MAX_DIM, JPEG_QUALITY);
          const wasCompressed = blob !== file;
          const ext = wasCompressed ? "jpg" : file.name.split(".").pop().toLowerCase();
          const path = `experiences/${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
          const { error } = await supabase.storage.from("media").upload(path, await toSafeUploadBody(blob), { upsert: true, contentType: wasCompressed ? "image/jpeg" : file.type });
          if (!error) {
            const { data: u } = supabase.storage.from("media").getPublicUrl(path);
            next[idx] = { url: u.publicUrl, path, type: "image" };
          }
        }
        onChange({ images: [...next] });
        URL.revokeObjectURL(previewUrl);
      } catch (err) {
        console.error("[ExperienceWizard] Upload-Fehler — Bild entfernt:", err?.message);
        next.splice(idx, 1);
        for (const p of previews) { if (p.idx > idx) p.idx--; }
        onChange({ images: [...next] });
      }
    }
    setUpl(false);
    onUploadStateChange?.(false);
    if (ref.current) ref.current.value = "";
  }

  function removeImg(idx) {
    onChange({ images: imgs.filter((_, i) => i !== idx) });
  }

  const firstImg = imgs[0]?.url;

  // ── GALERIE (2026-08-15, Michael-Request): "füge unterhalb des
  // Titelbild einfügemöglichkeit noch die Möglichkeit 10 Bilder und
  // Videos zusätzlich hochzuladen die dann auch im Home-Feed angezeigt
  // werden". Titelbild bleibt fix imgs[0] (unveraendert, s.o.) --
  // Galerie = imgs[1..], bis zu MAX_GALLERY zusaetzliche Bilder/Videos.
  // Anzeige im Feed ist bereits SSOT-faehig: unifiedNormalizer.js
  // extractMedia() liest raw.images komplett (nicht nur [0]) und
  // BaseFeedCard/ImageSlider rendern jedes Element mit type==="video"
  // bereits nativ als <video> in derselben Slider-Karte -- keine
  // Aenderung auf der Anzeige-Seite noetig, nur die fehlende Upload-UI
  // hier in Schritt 1 wird ergaenzt.
  const [uplGallery, setUplGallery] = useState(false);
  const galleryRef = useRef(null);
  const MAX_GALLERY = UPLOAD_LIMITS.MAX_FILES;
  const galleryImgs = imgs.slice(1);

  async function uploadGallery(e) {
    const { accepted, rejected } = processFileSelection(e.target.files || [], galleryImgs.length);
    if (!userId || !accepted.length) { if (galleryRef.current) galleryRef.current.value = ""; return; }
    const freeSlots = MAX_GALLERY - galleryImgs.length;
    const toUpload = accepted.slice(0, freeSlots);
    const next = [...imgs];
    const previews = [];
    for (const file of toUpload) {
      const isVideo = file.type.startsWith("video");
      const previewUrl = file.previewUrl || URL.createObjectURL(file);
      next.push({ url: previewUrl, path: null, type: isVideo ? "video" : "image", _preview: true });
      previews.push({ file, previewUrl, isVideo, idx: next.length - 1 });
    }
    onChange({ images: next });
    setUplGallery(true);
    onUploadStateChange?.(true);
    for (const { file, previewUrl, isVideo, idx } of previews) {
      try {
        const result = await uploadMediaFile(file, userId, "experiences");
        next[idx] = { url: result.url, path: null, type: result.type };
        onChange({ images: [...next] });
        URL.revokeObjectURL(previewUrl);
      } catch (err) {
        console.error("[ExperienceWizard] Galerie-Upload-Fehler — Bild entfernt:", err?.message);
        next.splice(idx, 1);
        for (const p of previews) { if (p.idx > idx) p.idx--; }
        onChange({ images: [...next] });
      }
    }
    setUplGallery(false);
    onUploadStateChange?.(false);
    if (galleryRef.current) galleryRef.current.value = "";
  }

  function removeGalleryImg(displayIdx) {
    const realIdx = displayIdx + 1; // Index 0 ist immer das Titelbild
    onChange({ images: imgs.filter((_, i) => i !== realIdx) });
  }

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 600, color: C.ink, marginBottom: 4 }}>{t("ew.s1.title")}</div>
      <div style={{ fontSize: 13, color: C.inkMid, marginBottom: 24, lineHeight: 1.5 }}>{t("ew.s1.sub")}</div>

      {/* Titel */}
      <Field label={t("ew.s1.label.titel")} req>
        <TextInput value={data.title || ""} onChange={v => onChange({ title: v })} placeholder={t("ew.s1.ph.titel")} maxLen={80}/>
      </Field>

      {/* Typ — 3-spaltige Chip-Kacheln */}
      <Field label={t("ew.s1.label.typ")} req>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {EXP_TYPEN.map(et => (
            <TypChip
              key={et.id}
              active={data.experience_type === et.id}
              icon={et.icon}
              label={et.label}
              onClick={() => onChange({ experience_type: et.id })}
            />
          ))}
        </div>
      </Field>

      {/* Kurzbeschreibung */}
      <Field label={t("ew.s1.label.kurz")} req>
        <TextArea
          value={data.caption || ""}
          onChange={v => onChange({ caption: v })}
          placeholder={t("ew.s1.ph.kurz")}
          maxLen={250}
          rows={4}
        />
      </Field>

      {/* Titelbild */}
      <Field label="Titelbild" req>
        {firstImg ? (
          /\.(mp4|mov|webm|avi)(\?|$)/i.test(firstImg) || imgs[0]?.type === "video" ? (
            <div>
              <div style={{ position: "relative", marginBottom: 8 }}>
                <VideoThumbnailPicker source={firstImg} initialThumbnailUrl={existingThumbnailUrl}
                  onFrameReady={onCoverThumbFrame} label={t("upload.chooseThumbnail")} />
                <button
                  onClick={() => removeImg(0)}
                  style={{
                    position: "absolute", top: 10, right: 10, zIndex: 1,
                    width: 30, height: 30, borderRadius: "50%",
                    background: "rgba(0,0,0,0.60)", border: "none",
                    color: "#fff", fontSize: 16, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    touchAction: "manipulation",
                  }}
                >×</button>
              </div>
              <div style={{
                background: "rgba(14,196,184,0.90)", borderRadius: 8,
                padding: "3px 10px", fontSize: 10, fontWeight: 600, color: "#fff",
                display: "inline-block", marginBottom: 8,
              }}>{t("common.titelbild")} · {t("common.video")}</div>
            </div>
          ) : (
          <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", aspectRatio: "16/9", background: "#e8e4df" }}>
            <img loading="lazy" decoding="async" src={firstImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { e.target.style.opacity = 0.3; }}/>
            <button
              onClick={() => removeImg(0)}
              style={{
                position: "absolute", top: 10, right: 10,
                width: 30, height: 30, borderRadius: "50%",
                background: "rgba(0,0,0,0.60)", border: "none",
                color: "#fff", fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                touchAction: "manipulation",
              }}
            >×</button>
            <div style={{
              position: "absolute", bottom: 10, left: 10,
              background: "rgba(14,196,184,0.90)", borderRadius: 8,
              padding: "3px 10px", fontSize: 10, fontWeight: 600, color: "#fff",
            }}>{t("common.titelbild")}</div>
          </div>
          )
        ) : (
          <div
            onClick={() => !upl && ref.current?.click()}
            style={{
              aspectRatio: "16/9", borderRadius: 14,
              border: `2px dashed ${C.tealBdr}`,
              background: C.tealSoft,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 8, cursor: upl ? "not-allowed" : "pointer",
              touchAction: "manipulation",
            }}
          >
            {upl ? (
              <div style={{ fontSize: 13, color: C.teal, fontWeight: 600 }}>Wird hochgeladen…</div>
            ) : (
              <>
                <div style={{ fontSize: 28, color: C.teal, lineHeight: 1 }}>📷</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.teal }}>Bild hochladen</div>
                <div style={{ fontSize: 11.5, color: C.inkFade }}>{t("ew.s1.tapPhoto")}</div>
              </>
            )}
          </div>
        )}
        <input ref={ref} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={upload}/>
      </Field>

      {/* Weitere Bilder & Videos (optional, bis zu 10) — GALERIE 2026-08-15 */}
      <Field label={`Weitere Bilder & Videos (optional) · ${galleryImgs.length}/${MAX_GALLERY}`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {galleryImgs.map((img, i) => (
            <div key={img.path || img.url || i} style={{
              position: "relative", borderRadius: 12, overflow: "hidden",
              aspectRatio: "1", background: "#e8e4df",
            }}>
              {img.type === "video" ? (
                <video src={img.url} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}/>
              ) : (
                <img loading="lazy" decoding="async" src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { e.target.style.opacity = 0.3; }}/>
              )}
              {img.type === "video" && (
                <div style={{
                  position: "absolute", top: 6, left: 6,
                  width: 20, height: 20, borderRadius: "50%",
                  background: "rgba(0,0,0,0.55)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: "#fff",
                }}>▶</div>
              )}
              <button
                onClick={() => removeGalleryImg(i)}
                style={{
                  position: "absolute", top: 6, right: 6,
                  width: 24, height: 24, borderRadius: "50%",
                  background: "rgba(0,0,0,0.60)", border: "none",
                  color: "#fff", fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  touchAction: "manipulation",
                }}
              >×</button>
            </div>
          ))}

          {galleryImgs.length < MAX_GALLERY && (
            <div
              onClick={() => !uplGallery && galleryRef.current?.click()}
              style={{
                aspectRatio: "1", borderRadius: 12,
                border: `2px dashed ${C.tealBdr}`,
                background: C.tealSoft,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 4, cursor: uplGallery ? "not-allowed" : "pointer",
                touchAction: "manipulation",
              }}
            >
              {uplGallery ? (
                <div style={{ fontSize: 10.5, color: C.teal, fontWeight: 600, textAlign: "center" }}>{t("ew.s1.loading")}</div>
              ) : (
                <>
                  <div style={{ fontSize: 22, color: C.teal, lineHeight: 1 }}>+</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.teal, textAlign: "center" }}>Foto/Video</div>
                </>
              )}
            </div>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: C.inkFade, marginTop: 8, lineHeight: 1.4 }}>
          {t("ew.s1.gallery.hint")}
        </div>
        <input ref={galleryRef} type="file" accept="image/*,video/*" multiple style={{ display: "none" }} onChange={uploadGallery}/>
      </Field>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SCHRITT 2 — WANN & WO
// Datum · Beginn · Ende · Ort · Vor Ort / Online
// ══════════════════════════════════════════════════════════════
function S2({ data, onChange, onPickLocation }) {
  const { t } = useTranslation();
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Wann & Wo</div>
      <div style={{ fontSize: 13, color: C.inkMid, marginBottom: 24, lineHeight: 1.5 }}>Wann und wo findet das Erlebnis statt?</div>

      {/* Datum */}
      <Field label={t("ew.s2.label.datum")} req>
        <div style={{ position: "relative" }}>
          <span style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", color:C.inkFade, pointerEvents:"none" }}><HUIKalenderIcon size={16}/></span>
          <input
            type="date"
            value={data.date || ""}
            onChange={e => onChange({ date: e.target.value })}
            style={{ ...INP_BASE, paddingLeft: 46 }}
          />
        </div>
      </Field>

      {/* Uhrzeiten — nebeneinander */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        {/* Beginn */}
        <div>
          <Label text={t("ew.s2.label.beginn")} req/>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: C.inkFade, pointerEvents: "none" }}>🕐</span>
            <input
              type="time"
              value={data.time_start || ""}
              onChange={e => onChange({ time_start: e.target.value })}
              style={{ ...INP_BASE, paddingLeft: 44 }}
            />
          </div>
        </div>
        {/* Ende */}
        <div>
          <Label text={t("ew.s2.label.ende")} hint={t("ew.s2.ende.hint")}/>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: C.inkFade, pointerEvents: "none" }}>🕐</span>
            <input
              type="time"
              value={data.time_end || ""}
              onChange={e => onChange({ time_end: e.target.value })}
              style={{ ...INP_BASE, paddingLeft: 44 }}
            />
          </div>
        </div>
      </div>

      {/* Ort */}
      <Field label={t("ew.s2.label.ort")} req hint={t("ew.s2.ort.hint")}>
        <div style={{ position: "relative" }}>
          <span style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", color:C.inkFade, pointerEvents:"none", zIndex:1 }}><HUILocationIcon size={16}/></span>
          <LocationAutocompleteInput
            value={data.location_text || ""}
            onChange={v => onChange({ location_text: v })}
            onPick={onPickLocation}
            placeholder={t("ew.s2.ph.ort")}
            style={{ ...INP_BASE, paddingLeft: 46 }}
          />
        </div>
      </Field>

      {/* Online oder Vor Ort */}
      <Field label={t("ew.s2.label.format")} req>
        <div style={{ display: "flex", gap: 10 }}>
          <FormatPill active={data.format === "vor_ort"} label={t("ew.s2.format.vorort")} icon={<HUIVorOrtIcon size={16}/>} onClick={() => onChange({ format: "vor_ort" })}/>
          <FormatPill active={data.format === "online"}  label={t("ew.s2.format.online")}  icon={<HUIOnlineIcon size={16}/>} onClick={() => onChange({ format: "online"  })}/>
        </div>
      </Field>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SCHRITT 3 — TEILNAHME
// Preis · Währung · Preis gilt pro · Teilnehmerzahl · Anmeldung
// ══════════════════════════════════════════════════════════════
function S3({ data, onChange }) {
  const { t } = useTranslation();
  const preisPro = getPreisPro(t);
  // WÄHRUNG-FIX (2026-08-20, Michael-Screenshot): Erlebnisse werden systemweit
  // ausschließlich in EUR abgerechnet (Stripe-Konfiguration, Balanced-Growth-v1
  // Gebührenmodell rechnet zentral in EUR). Die CHF/USD-Auswahl täuschte eine
  // Mehrwährungsfähigkeit vor, die es serverseitig nirgends gibt. Dropdown
  // entfernt, currency bleibt fest 'EUR' (Default war ohnehin schon überall
  // im Wizard/DB "EUR" — siehe INITIAL-STATE + Submit-Payload weiter unten).

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 600, color: C.ink, marginBottom: 4 }}>{t("ew.s3.title")}</div>
      <div style={{ fontSize: 13, color: C.inkMid, marginBottom: 24, lineHeight: 1.5 }}>{t("ew.s3.sub")}</div>

      {/* Preis — großer Input */}
      <Field label={t("ew.s3.label.preis")} req>
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)",
            fontSize: 22, fontWeight: 600, color: "rgba(14,196,184,0.60)",
            pointerEvents: "none", userSelect: "none",
          }}>€</span>
          <input
            type="number" min="0" step="0.01"
            inputMode="decimal"
            value={data.price || ""}
            onChange={e => onChange({ price: e.target.value })}
            placeholder="49,00"
            style={{
              ...INP_BASE,
              paddingLeft: 52,
              fontSize: 28, fontWeight: 600,
              border: `2px solid ${data.price ? C.teal : C.border}`,
              letterSpacing: 0.5, transition: "border-color .15s",
            }}
          />
        </div>
      </Field>

      {/* Preis gilt pro — vertikale Radio-Liste */}
      <Field label={t("ew.s3.label.pro")} req>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {preisPro.map(pp => (
            <PreisProCard
              key={pp.id}
              active={data.price_per === pp.id}
              item={pp}
              onClick={() => onChange({ price_per: pp.id })}
            />
          ))}
        </div>
        {data.price && data.price_per && (
          <div style={{
            marginTop: 12, padding: "10px 14px", borderRadius: 10,
            background: C.tealSoft, border: `1.5px solid ${C.tealBdr}`,
            fontSize: 13, fontWeight: 600, color: C.teal,
          }}>
            {parseFloat(data.price).toFixed(2).replace(".", ",")} {data.currency || "EUR"} pro {data.price_per}
          </div>
        )}
      </Field>

      {/* Max. Teilnehmerzahl */}
      <Field label={t("ew.s3.label.maxTeiln")} hint={t("ew.s3.maxTeiln.hint")}>
        <div style={{ position: "relative" }}>
          <span style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", color:C.inkFade, pointerEvents:"none" }}><HUIPersonenIcon size={18}/></span>
          <input
            type="number" min="1" max="9999"
            inputMode="numeric"
            value={data.max_participants || ""}
            onChange={e => onChange({ max_participants: e.target.value })}
            placeholder="12"
            style={{ ...INP_BASE, paddingLeft: 46, fontSize: 20, fontWeight: 600 }}
          />
        </div>
      </Field>

      {/* Anmeldung erforderlich */}
      <Field label={t("ew.s3.label.anmeldung")}>
        <JaNeinPill
          value={data.registration_required ?? false}
          onChange={v => onChange({ registration_required: v })}
        />
      </Field>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SCHRITT 4 — VERÖFFENTLICHEN
// Summary · Sichtbarkeit · Veröffentlichen-Button (im Footer)
// ══════════════════════════════════════════════════════════════
function S4({ data, onChange, saving }) {
  const { t } = useTranslation();
  const sichtbarkeit = getSichtbarkeit(t);
  const cover   = data.images?.[0]?.url;
  const typeObj = EXP_TYPEN.find(t => t.id === data.experience_type);

  // Datum formatieren
  const fmtDate = iso => {
    if (!iso) return null;
    try { return formatDateDE(new Date(iso), { day:"numeric", month:"2-digit", year:"numeric" }); }
    catch { return iso; }
  };

  // Uhrzeit-Range
  const timeRange = data.time_start
    ? data.time_end
      ? `${data.time_start} – ${data.time_end}`
      : data.time_start
    : null;

  // Preis-Anzeige
  const preisAnzeige = data.price && data.price_per
    ? `${parseFloat(data.price).toFixed(2).replace(".", ",")} ${data.currency || "EUR"} pro ${data.price_per}`
    : data.price
      ? `${parseFloat(data.price).toFixed(2).replace(".", ",")} ${data.currency || "EUR"}`
      : null;

  const summaryRows = [
    fmtDate(data.date) && { icon:<HUIKalenderIcon size={14}/>, text: fmtDate(data.date) },
    timeRange          && { icon:<HUIZeitIcon size={14}/>, text: timeRange },
    data.location_text && { icon:<HUILocationIcon size={14}/>, text: data.location_text },
    data.max_participants && { icon:<HUIPersonenIcon size={14}/>, text: t("ew.s4.maxTeiln", { count: data.max_participants }) },
    preisAnzeige       && { icon:<HUIEuroIcon size={14}/>, text: preisAnzeige },
    data.registration_required && { icon:<HUIEinladungIcon size={14}/>, text: t("ew.s4.anmeldung") },
  ].filter(Boolean);

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 600, color: C.ink, marginBottom: 4 }}>{t("ew.s4.title")}</div>
      <div style={{ fontSize: 13, color: C.inkMid, marginBottom: 20, lineHeight: 1.5 }}>{t("ew.s4.sub")}</div>

      {/* Summary-Karte */}
      <div style={{ borderRadius: 16, overflow: "hidden", border: `1.5px solid ${C.border}`, background: C.white, marginBottom: 24, boxShadow: "0 2px 16px rgba(26,26,24,0.07)" }}>
        {/* Titelbild */}
        {cover ? (
          <div style={{ width: "100%", aspectRatio: "16/9", background: "#e8e4df", overflow: "hidden" }}>
            <img loading="lazy" decoding="async" src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { e.target.style.opacity = 0.3; }}/>
          </div>
        ) : (
          <div style={{ width:"100%", height:100, background:C.tealSoft, display:"flex", alignItems:"center", justifyContent:"center", opacity:0.4, color:"rgba(14,196,184,0.8)" }}><HUIKalenderIcon size={32}/></div>
        )}
        {/* Info */}
        <div style={{ padding: "16px 18px" }}>
          {/* Typ-Badge */}
          {typeObj && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, background: C.tealSoft, border: `1.5px solid ${C.tealBdr}`, fontSize: 11, fontWeight: 600, color: C.teal, marginBottom: 8 }}>
              {typeObj.icon} {typeObj.label}
            </div>
          )}
          {/* Titel */}
          <div style={{ fontSize: 18, fontWeight: 600, color: C.ink, lineHeight: 1.3, marginBottom: 12 }}>
            {data.title || t("ew.s4.noTitle")}
          </div>
          {/* Summary-Rows */}
          {summaryRows.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {summaryRows.map((row, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ flexShrink: 0, marginTop: 1, display:"flex", alignItems:"center", color:"rgba(14,196,184,0.7)" }}>{row.icon}</span>
                  <span style={{ fontSize: 13, color: C.inkMid, lineHeight: 1.4 }}>{row.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sichtbarkeit */}
      <div style={{ marginBottom: 20 }}>
        <Label text="Sichtbarkeit" req/>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sichtbarkeit.map(s => (
            <SichtCard key={s.id} active={data.visibility === s.id} item={s} onClick={() => onChange({ visibility: s.id })}/>
          ))}
        </div>
      </div>

      {saving && (
        <div style={{ textAlign: "center", fontSize: 13, color: C.teal, fontWeight: 600, padding: "8px 0" }}>
          Wird gespeichert…
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// WIZARD ROOT
// ══════════════════════════════════════════════════════════════
export default function ExperienceWizard({ userId, existingExp = null, onClose, onSaved }) {
  const { t } = useTranslation();
  // BANK-GATE-001 (2026-08-21, Michele-Report — siehe WerkWizard fuer Begruendung):
  // Bankdaten-Pruefung JETZT beim Oeffnen des Wizards statt erst beim finalen
  // Speichern -- verhindert Datenverlust durch komplettes Neu-Ausfuellen.
  // ExperienceWizard hatte bisher GAR KEINEN Bankdaten-Check (weder vorher
  // noch am Ende) -- Ergaenzung fuer Konsistenz mit WerkWizard/TalentAngebotWizard.
  const [bankHasDetails, setBankHasDetails] = useState(null);
  const [showBankModal, setShowBankModal]   = useState(false);
  const checkBank = useCallback(async () => {
    if (!userId) { setBankHasDetails(true); return; }
    try {
      const { data } = await supabase.rpc("rpc_get_ambassador_bank_status", { p_ambassador_id: userId });
      setBankHasDetails(!!data?.has_bank_details);
    } catch (e) {
      console.warn("[ExperienceWizard] bank-gate check failed:", e?.message);
      setBankHasDetails(true);
    }
  }, [userId]);
  useEffect(() => { checkBank(); }, [checkBank]);

  const TOTAL = 4;
  const [step, setSt]             = useState(1);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState(null);
  // KBD-INSET-FIX (2026-08-20, gleicher Root Cause wie WerkWizard): Hook war
  // importiert, aber nie aufgerufen — Wizard passte sich nie an offene
  // Tastatur an. Fix am Root-Container unten (bottom: var(--hui-keyboard-inset)).
  useKeyboardInset();
  // Praezise Koordinaten aus einem angetippten Autocomplete-Vorschlag (Ort),
  // siehe LocationAutocompleteInput.jsx -- direkt uebernommen statt erneut
  // zu geocodieren. Zurueckgesetzt sobald der Ort danach manuell bearbeitet wird.
  const [pickedGeo, setPickedGeo] = useState(null);
  // VIDEO-THUMBNAIL-001 (2026-08-31)
  const [coverThumbBlob, setCoverThumbBlob] = useState(null);
  // SAVE-IMAGE-FIX (2026-09-01): Upload-Status von S1 an Parent
  const [isUploading, setIsUploading] = useState(false);

  const [form, setForm] = useState(() => {
    if (existingExp) {
      // EXPERIENCES-EDIT-MEDIA-FIX (2026-08-31): experiences.images ist jsonb
      // (nicht text[]), PostgREST liefert bereits ein geparstes Array von
      // {url, type} Objekten. JSON.parse darauf wuerfe SyntaxError (wie der
      // WerkWizard text[]-Bug). Direkte Zuweisung + Fallback auf cover_url.
      let imgs = [];
      if (Array.isArray(existingExp.images)) {
        imgs = existingExp.images;
      } else if (typeof existingExp.images === 'string') {
        try { imgs = JSON.parse(existingExp.images); } catch { imgs = []; }
      }
      if (!imgs.length && existingExp.cover_url) imgs = [{ url: existingExp.cover_url }];
      return {
        images:               imgs,
        title:                existingExp.title               || "",
        experience_type:      existingExp.experience_type     || "",
        caption:              existingExp.caption             || "",
        date:                 existingExp.date ? existingExp.date.slice(0, 10) : "",
        time_start:           existingExp.time_start          || "",
        time_end:             existingExp.time_end            || "",
        location_text:        existingExp.location_text       || "",
        format:               existingExp.format              || "",
        price:                existingExp.price               ? String(existingExp.price) : "",
        currency:             existingExp.currency            || "EUR",
        price_per:            existingExp.price_per           || "",
        max_participants:     existingExp.max_participants     ? String(existingExp.max_participants) : "",
        registration_required: existingExp.registration_required ?? false,
        visibility:           existingExp.visibility          || "public",
        description:          existingExp.description         || "",
      };
    }
    return {
      images: [], title: "", experience_type: "", caption: "",
      date: "", time_start: "", time_end: "",
      location_text: "", format: "",
      price: "", currency: "EUR", price_per: "",
      max_participants: "", registration_required: false,
      visibility: "public", description: "",
    };
  });

  const patch  = u => setForm(p => ({ ...p, ...u }));
  const next   = () => setSt(s => Math.min(s + 1, TOTAL));
  const back   = () => setSt(s => Math.max(s - 1, 1));
  const isLast = step === TOTAL;

  // ── Validierung pro Schritt ────────────────────────────────
  const canContinue = useCallback(() => {
    switch (step) {
      case 1: return !!(form.title?.trim()) && !!(form.experience_type) && !!(form.caption?.trim()) && form.images.length > 0;
      case 2: return !!(form.date) && !!(form.time_start) && !!(form.location_text) && !!(form.format);
      case 3: return !!(form.price) && !!(form.price_per);
      case 4: return !!(form.visibility);
      default: return true;
    }
  }, [step, form]);

  // ── BottomNav (zIndex:9999) ausblenden solange Wizard offen ──
  // Referenzgezählter Lock (siehe wizardBodyLock.js) statt eigener
  // classList.add/remove — verhindert Race Conditions mit anderen
  // gleichzeitig offenen Wizards (Werk/Erlebnis/Talent-Angebot).
  useWizardBodyLock();
  useModalRegistration(true, onClose, "ExperienceWizard");

  // ── body-scroll sperren (rein lokal, kein geteilter Zustand) ──
  React.useLayoutEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ── Speichern ─────────────────────────────────────────────
  async function save(status) {
    if (!userId) {
      console.error("[EXPERIENCE USER] userId ist null/undefined — save() abgebrochen");
      return;
    }
    setSaving(true);

    // BANKDATEN-002 Parity-Fix (2026-08-21): Absicherung falls der Bank-Gate-
    // Check beim Oeffnen (bankHasDetails) durch einen Edge-Case umgangen wurde
    // (siehe WerkWizard/TalentAngebotWizard fuer Begruendung).
    if (status === "pending_review") {
      try {
        const { data: bankCheck } = await supabase.rpc("rpc_get_ambassador_bank_status", { p_ambassador_id: userId });
        if (!bankCheck?.has_bank_details) {
          setSaving(false);
          setSaveError(t("ew.save.bankError"));
          setTimeout(() => setSaveError(null), 6000);
          return;
        }
      } catch (e) {
        console.warn("[ExperienceWizard] bank-check failed:", e?.message);
      }
    }

    // ── DIFF-SNAPSHOT: Beim Update eines approved Erlebnisses, alten Stand speichern ──
    let snapshotPayload = {};
    if (status === "pending_review" && existingExp?.id && existingExp?.approval_status === "approved") {
      try {
        const snap = {
          title:           existingExp.title           || null,
          description:     existingExp.description     || null,
          category:        existingExp.category        || null,
          experience_type: existingExp.experience_type || null,
          price:           existingExp.price           || null,
          date:            existingExp.date            || null,
          time_start:      existingExp.time_start      || null,
          time_end:        existingExp.time_end        || null,
          location_text:   existingExp.location_text   || null,
          format:          existingExp.format          || null,
          caption:         existingExp.caption         || null,
          max_participants: existingExp.max_participants || null,
          images:          existingExp.images          || [],
          cover_url:       existingExp.cover_url       || null,
        };
        snapshotPayload = { admin_comment: "__snapshot__:" + JSON.stringify(snap) };
      } catch (_) { /* Snapshot nicht kritisch */ }
    } else if (status === "pending_review") {
      snapshotPayload = { admin_comment: null };
    }

    const cover_url = form.images?.[0]?.url || null;

    // VIDEO-THUMBNAIL-001 (2026-08-31): Falls Titelbild ein Video ist,
    // extrahierten Frame als thumbnail_url hochladen. Graceful.
    let thumbnailUrl = existingExp?.thumbnail_url || null;
    const coverIsVideo = form.images?.[0]?.type === "video" || /\.(mp4|mov|webm|avi)(\?|$)/i.test(cover_url || "");
    if (coverIsVideo && coverThumbBlob) {
      try {
        thumbnailUrl = await uploadThumbnail(coverThumbBlob, userId, "experiences");
      } catch (thumbErr) {
        console.warn("[ExperienceWizard] Thumbnail-Upload fehlgeschlagen (graceful):", thumbErr?.message);
      }
    }
    // SAVE-IMAGE-FIX (2026-09-01): Safety-Net — blob:-URLs nicht speichern
    const imagesArr = (form.images || [])
      .filter(img => {
        const url = typeof img === "object" ? (img?.url || "") : img;
        return Boolean(url) && !url.startsWith("blob:");
      })
      .map(img => typeof img === "object" ? img : { url: img });

    // Geokoordinaten ermitteln (Standort-Feature 2026-07-06, fuer Umkreissuche
    // auf Discover-Seite). Nicht bei Online-Erlebnissen, nicht wenn sich der
    // Ort seit dem letzten Speichern nicht geaendert hat.
    let geoLat = existingExp?.lat ?? null, geoLng = existingExp?.lng ?? null;
    const locTrimmed = (form.location_text || "").trim();
    if (form.format === "online" || !locTrimmed) {
      geoLat = null; geoLng = null;
    } else if (pickedGeo) {
      // Ort wurde per Autocomplete-Vorschlag ausgewaehlt und seither nicht
      // manuell veraendert -- exakte Koordinaten direkt uebernehmen.
      geoLat = pickedGeo.lat; geoLng = pickedGeo.lng;
    } else if (locTrimmed !== (existingExp?.location_text || "").trim()) {
      const geo = await geocodeWithFallback(locTrimmed);
      geoLat = geo?.lat ?? null;
      geoLng = geo?.lng ?? null;
    }

    const payload = {
      user_id:               userId,
      title:                 form.title               || "",
      caption:               form.caption             || null,
      description:           form.description         || null,
      cover_url,
      // VIDEO-THUMBNAIL-001 (2026-08-31)
      thumbnail_url:    thumbnailUrl,
      images:                imagesArr,
      experience_type:       form.experience_type     || null,
      category:              form.experience_type     || null,
      date:                  form.date ? new Date(form.date).toISOString() : null,
      time_start:            form.time_start          || null,
      time_end:              form.time_end            || null,
      location_text:         form.location_text       || null,
      lat:                   geoLat,
      lng:                   geoLng,
      format:                form.format              || null,
      price:                 form.price ? parseFloat(form.price) : null,
      currency:              form.currency            || "EUR",
      price_per:             form.price_per           || null,
      max_participants:      form.max_participants ? parseInt(form.max_participants, 10) : null,
      registration_required: form.registration_required ?? false,
      visibility:            form.visibility          || "public",
      status,
      updated_at:            new Date().toISOString(),
      // ── Freigabe-System (identisch zu WerkWizard) ──────────
      last_submitted_at:     status === "pending_review" ? new Date().toISOString() : undefined,
      is_update:             status === "pending_review" ? !!existingExp?.id : undefined,
      approval_status:       status === "pending_review" ? "pending" : undefined,
      rejection_reason:      status === "pending_review" ? null : undefined,
      // Diff-Snapshot für Admin-Dashboard
      ...snapshotPayload,
    };


    // ── Pre-Save: Session prüfen, ggf. refreshen ──
    const { data: { session: curSession } } = await supabase.auth.getSession();
    if (!curSession?.access_token) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (!refreshed?.session?.access_token) {
        setSaving(false);
        setSaveError(t("ew.save.sessionExpired"));
        setTimeout(() => setSaveError(null), 8000);
        return;
      }
    }

    const { data: saved, error } = existingExp?.id
      ? await supabase.from("experiences").update(payload).eq("id", existingExp.id).eq("user_id", userId).select().single()
      : await supabase.from("experiences").insert(payload).select().single();

    setSaving(false);

    if (error) {
      console.error("[EXPERIENCE INSERT ERROR]", error);
      const isRLS = error.code === "42501" || /row-level security/i.test(error.message || "");
      setSaveError(isRLS
        ? t("ew.save.sessionExpired")
        : (error.message || t("ew.save.failed")));
      setTimeout(() => setSaveError(null), isRLS ? 8000 : 6000);
      return;
    }

    // FIX (2026-08-13): Erstes Erlebnis kann Orb-Stufe (3=has_content) triggern —
    // Cache invalidieren, sonst haengt der Orb bis zu 5 Min. auf altem Wert.
    invalidateOrbStageCache(userId);

    // ── STORAGE-CLEANUP: Gelöschte Bilder aus Supabase Storage entfernen ──
    // EXPERIENCES-EDIT-MEDIA-FIX (2026-08-31): Vergleicht alte images mit neuen,
    // löscht verwaiste Dateien aus dem media-Bucket. Nur im Edit-Modus.
    if (existingExp?.id) {
      try {
        const oldImgs = Array.isArray(existingExp.images) ? existingExp.images : [];
        const oldUrls = oldImgs.map(i => typeof i === 'object' ? (i.url || '') : i).filter(Boolean);
        const newUrls = (form.images || []).map(img => img?.url || '').filter(Boolean);
        const deletedUrls = oldUrls.filter(u => !newUrls.includes(u));
        for (const url of deletedUrls) {
          const match = url.match(/\/object\/public\/media\/(.+)$/);
          if (match) {
            await supabase.storage.from('media').remove([match[1]]);
          }
        }
      } catch (e) {
        console.warn('[ExperienceWizard] Storage cleanup failed (non-critical):', e?.message);
      }
    }

    onSaved?.(saved);
    // pending_review: kurze Bestätigung, dann schließen
    if (saved?.status === "pending_review") {
      setSaveError(isRejectedUpdate ? t("ew.save.updateOk") : t("ew.save.submitOk"));
      setTimeout(() => { setSaveError(null); onClose?.(); }, 2500);
    } else {
      onClose?.();
    }
  }

  const isRejectedUpdate = existingExp?.approval_status === "rejected" || existingExp?.status === "rejected";

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
        <div style={{ padding:"max(var(--hui-safe-top, 0px), 14px, env(safe-area-inset-top, 14px)) 20px 12px", background:C.white, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ width:28 }}/>
          <div style={{ fontSize:14, fontWeight:600, color:C.ink }}>{t("ew.bank.required")}</div>
          <button onClick={() => onClose?.()} style={{ width:28, height:28, borderRadius:"50%", background:"rgba(26,26,24,0.07)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", touchAction:"manipulation" }}>
            <span style={{ fontSize:14, color:C.ink }}>×</span>
          </button>
        </div>
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px 28px", textAlign:"center", gap:14 }}>
          <div style={{ fontSize:44 }}>🏦</div>
          <div style={{ fontSize:17, fontWeight:600, color:C.ink }}>{t("ew.bank.missing")}</div>
          <div style={{ fontSize:14, color:C.inkMid, lineHeight:1.5 }}>
            {t("ew.bank.body")}
          </div>
        </div>
        <div style={{ padding:"0 20px calc(20px + env(safe-area-inset-bottom, 0px))" }}>
          <button onClick={() => setShowBankModal(true)} style={{
            width:"100%", padding:"16px", background:`linear-gradient(135deg, ${C.teal}, ${C.tealD})`,
            border:"none", borderRadius:14, color:"#fff", fontSize:15, fontWeight:600,
            cursor:"pointer", fontFamily:"inherit", touchAction:"manipulation", marginBottom:6,
          }}>Bankdaten jetzt hinterlegen</button>
          <button onClick={() => onClose?.()} style={{
            width:"100%", padding:"13px", background:"none", border:"none", color:C.teal,
            fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit", touchAction:"manipulation",
          }}>Abbrechen</button>
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
    <div data-hui-kbd-self-managed style={{
      position: "fixed", top: 0, left: 0, right: 0,
      bottom: "var(--hui-keyboard-inset, 0px)", // KBD-INSET-FIX (2026-08-20)
      zIndex: 10500,
      background: C.cream,
      display: "flex", flexDirection: "column",
      transition: "bottom .15s ease-out",
    }}>
      {/* Header */}
      <TopBar onClose={onClose} step={step} total={TOTAL} isEdit={!!existingExp}/>

      {/* Abgelehnt-Banner */}
      {isRejectedUpdate && (
        <div style={{
          background: "rgba(239,68,68,0.08)", borderBottom: "1px solid rgba(239,68,68,0.18)",
          padding: "10px 20px", display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <HUISchreibenIcon size={16} style={{flexShrink:0, color:"rgba(14,196,184,0.6)"}} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#DC2626", marginBottom: 2 }}>
              Du passt ein abgelehntes Erlebnis an
            </div>
            {existingExp.rejection_reason && (
              <div style={{ fontSize: 12, color: "rgba(220,38,38,0.75)", lineHeight: 1.4 }}>
                Ablehnungsgrund: {existingExp.rejection_reason}
              </div>
            )}
            <div style={{ fontSize: 11, color: "rgba(26,26,24,0.50)", marginTop: 2 }}>
              Gehe alle Schritte durch und reiche es erneut ein — der Admin sieht, dass es ein Update ist.
            </div>
          </div>
        </div>
      )}

      {/* Scrollbarer Content */}
      <div className="hui-scroll" style={{
        flex: 1,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        padding: "24px 20px 0",
      }}>
        {step === 1 && <S1 data={form} onChange={patch} userId={userId}
          onCoverThumbFrame={(blob) => setCoverThumbBlob(blob)}
          existingThumbnailUrl={existingExp?.thumbnail_url || null}
          onUploadStateChange={setIsUploading} />}
        {step === 2 && <S2 data={form} onChange={patch} onPickLocation={place => { patch({ location_text: place.label }); setPickedGeo({ lat: place.lat, lng: place.lng }); }}/>}
        {step === 3 && <S3 data={form} onChange={patch}/>}
        {step === 4 && <S4 data={form} onChange={patch} saving={saving}/>}
        <div style={{ height: 120 }}/>
      </div>

      {/* Error Toast */}
      {saveError && (
        <div style={{
          flexShrink: 0, padding: "10px 20px",
          background: C.redSoft, borderTop: `1.5px solid ${C.redBdr}`,
          fontSize: 12.5, fontWeight: 600, color: "rgba(239,68,68,0.9)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <HUIWarnIcon size={14} style={{flexShrink:0}} />
          <span style={{ flex: 1 }}>{saveError}</span>
          <button onClick={() => setSaveError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(239,68,68,0.7)", fontSize: 16, padding: 0 }}>×</button>
        </div>
      )}

      {/* Sticky Footer */}
      <div style={{
        flexShrink: 0, background: C.white,
        borderTop: `1px solid ${C.border}`,
        padding: "14px 20px",
        paddingBottom: "max(20px, max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 20px), 20px))",
        display: "flex", gap: 10,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.07)",
      }}>
        {/* Zurück / Abbrechen */}
        {step > 1 ? (
          <button onClick={back} style={{
            flex: 1, padding: "16px",
            background: "rgba(26,26,24,0.06)", border: "none",
            borderRadius: 14, fontSize: 15, fontWeight: 600,
            color: C.inkMid, cursor: "pointer",
            fontFamily: "inherit", touchAction: "manipulation",
          }}>{t("ew.btn.back")}</button>
        ) : (
          <button onClick={onClose} style={{
            flex: 1, padding: "16px",
            background: "rgba(26,26,24,0.06)", border: "none",
            borderRadius: 14, fontSize: 15, fontWeight: 600,
            color: C.inkMid, cursor: "pointer",
            fontFamily: "inherit", touchAction: "manipulation",
          }}>{t("ew.btn.cancel")}</button>
        )}

        {/* Weiter */}
        {!isLast && (
          <button onClick={next} disabled={!canContinue()} style={{
            flex: 2, padding: "16px",
            background: canContinue()
              ? `linear-gradient(135deg, ${C.teal}, ${C.tealD})`
              : "rgba(14,196,184,0.30)",
            border: "none", borderRadius: 14,
            color: "#fff", fontSize: 16, fontWeight: 600,
            cursor: canContinue() ? "pointer" : "not-allowed",
            fontFamily: "inherit", touchAction: "manipulation",
            transition: "background .18s",
          }}>
            Weiter →
          </button>
        )}

        {/* Letzer Schritt: Entwurf + Veröffentlichen */}
        {isLast && (
          <>
            <button onClick={() => save("draft")} disabled={saving||isUploading} style={{
              flex: 1, padding: "16px",
              background: "rgba(26,26,24,0.06)", border: "none",
              borderRadius: 14, fontSize: 14, fontWeight: 600,
              color: C.inkMid, cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "inherit", touchAction: "manipulation",
            }}>
              {saving ? "…" : t("ew.btn.draft")}
            </button>
            <button
              onClick={() => save("pending_review")}
              disabled={saving || isUploading || !form.title?.trim() || !form.visibility}
              style={{
                flex: 2, padding: "16px",
                background: (saving || !form.title?.trim())
                  ? "rgba(14,196,184,0.30)"
                  : `linear-gradient(135deg, ${C.teal}, ${C.tealD})`,
                border: "none", borderRadius: 14,
                color: "#fff", fontSize: 15, fontWeight: 600,
                cursor: (saving || !form.title?.trim()) ? "not-allowed" : "pointer",
                fontFamily: "inherit", touchAction: "manipulation",
                letterSpacing: 0.2,
              }}
            >
              {saving ? t("ew.btn.submitting") : (existingExp?.approval_status === "rejected" ? t("ew.btn.resubmit") : t("ew.btn.publish"))}
            </button>
          </>
        )}
      </div>
    </div>
  ,
    document.body
  );
}
