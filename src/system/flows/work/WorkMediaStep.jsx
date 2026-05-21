// src/system/flows/work/WorkMediaStep.jsx
// Step 1 — Werk erstellen: Titel, Beschreibung, Medien-Galerie

import React, { useRef, useCallback } from "react";
import { WT } from "./WorkTokens.js";

/* ── Shared Input Styles ─────────────────────────────────────── */
const inputStyle = {
  width:"100%",
  padding:"13px 14px",
  borderRadius:14,
  border:`1.5px solid rgba(26,26,46,0.10)`,
  background:"rgba(248,247,255,0.70)",
  fontSize:15,
  color:"#1A1A2E",
  outline:"none",
  fontFamily:"inherit",
  boxSizing:"border-box",
  transition:"border-color 0.18s ease",
};

/* ── Medien-Upload Button ────────────────────────────────────── */
function MediaButton({ icon, label, color, bgColor, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex:1,
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        gap:6, padding:"16px 8px",
        borderRadius:16,
        border:`1.5px dashed ${color}50`,
        background:bgColor,
        cursor:"pointer",
        transition:"all 0.18s ease",
        minHeight:76,
      }}
    >
      <div style={{
        fontSize:22,
        width:40, height:40, borderRadius:12,
        background:`${color}18`,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>{icon}</div>
      <div style={{ fontSize:11.5, fontWeight:600, color, lineHeight:1.2,
        textAlign:"center" }}>{label}</div>
    </button>
  );
}

/* ── Galerie-Vorschau ─────────────────────────────────────────── */
function MediaGallery({ files, onRemove, onAdd }) {
  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:"repeat(3, 1fr)",
      gap:8, marginTop:8,
    }}>
      {files.map((f, i) => (
        <div key={i} style={{
          position:"relative",
          borderRadius:14, overflow:"hidden",
          aspectRatio:"1",
          boxShadow:"0 4px 16px rgba(26,26,46,0.10)",
        }}>
          {f.type.startsWith("video") ? (
            <video
              src={f.preview}
              style={{ width:"100%", height:"100%", objectFit:"cover" }}
            />
          ) : (
            <img
              src={f.preview}
              alt=""
              style={{ width:"100%", height:"100%", objectFit:"cover" }}
            />
          )}
          {/* Entfernen Button */}
          <button
            onClick={() => onRemove(i)}
            style={{
              position:"absolute", top:6, right:6,
              width:24, height:24, borderRadius:"50%",
              background:"rgba(26,26,46,0.65)",
              border:"none", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:11, color:"#fff",
            }}
          >✕</button>
        </div>
      ))}

      {/* + Slot */}
      <button
        onClick={onAdd}
        style={{
          borderRadius:14,
          border:`1.5px dashed rgba(26,26,46,0.15)`,
          background:"rgba(248,247,255,0.60)",
          cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          aspectRatio:"1",
          fontSize:22, color:"rgba(26,26,46,0.25)",
        }}
      >+</button>
    </div>
  );
}

/* ── Step 1 Hauptkomponente ──────────────────────────────────── */
export function WorkMediaStep({ form, mediaFiles, onFormChange, onMediaChange, onNext }) {
  const photoRef = useRef();
  const videoRef = useRef();
  const fileRef  = useRef();

  const canNext = form.title.trim().length > 0;

  // ── Medien hinzufügen ────────────────────────────────────────
  const addFiles = useCallback((fileList, accept) => {
    const arr = Array.from(fileList);
    const newFiles = arr.map(f => ({
      file:    f,
      preview: URL.createObjectURL(f),
      type:    f.type,
    }));
    onMediaChange(prev => [...prev, ...newFiles]);
  }, [onMediaChange]);

  const removeFile = useCallback((idx) => {
    onMediaChange(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }, [onMediaChange]);

  return (
    <div style={{ padding:"24px 20px 20px",
      animation:"wfFadeStep 0.30s ease both" }}>

      {/* ── Überschrift ── */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:900, color:WT.ink,
          letterSpacing:-0.6, margin:0, lineHeight:1.15 }}>
          Werk erschaffen<span style={{ color:WT.teal, marginLeft:3 }}>·</span>
        </h1>
        <p style={{ fontSize:13.5, color:WT.ink3, margin:"5px 0 0",
          lineHeight:1.5 }}>
          Zeige deine Kreativität der Community.
        </p>
      </div>

      {/* ── Titel ── */}
      <div style={{ marginBottom:16 }}>
        <label style={{ fontSize:12, fontWeight:700, color:WT.ink3,
          letterSpacing:0.3, display:"block", marginBottom:6 }}>
          Titel des Werkes
        </label>
        <input
          style={inputStyle}
          placeholder="Abendlicht über den Bergen"
          value={form.title}
          maxLength={80}
          onChange={e => onFormChange({ title: e.target.value })}
        />
      </div>

      {/* ── Beschreibung ── */}
      <div style={{ marginBottom:24 }}>
        <label style={{ fontSize:12, fontWeight:700, color:WT.ink3,
          letterSpacing:0.3, display:"block", marginBottom:6 }}>
          Beschreibung
        </label>
        <div style={{ position:"relative" }}>
          <textarea
            style={{
              ...inputStyle,
              minHeight:96,
              resize:"none",
              lineHeight:1.55,
              paddingBottom:24,
            }}
            placeholder="Ein digitales Gemälde inspiriert von einem Sonnenuntergang in den Alpen. 2024."
            value={form.description}
            maxLength={500}
            onChange={e => onFormChange({ description: e.target.value })}
          />
          <div style={{
            position:"absolute", bottom:8, right:12,
            fontSize:11, color:WT.ink4,
          }}>{form.description.length}/500</div>
        </div>
      </div>

      {/* ── Medien ── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:14, fontWeight:800, color:WT.ink,
          marginBottom:12 }}>Medien hinzufügen</div>

        {/* Upload-Buttons */}
        <div style={{ display:"flex", gap:10, marginBottom:12 }}>
          <MediaButton
            icon="🖼"
            label="Foto hinzufügen"
            color={WT.teal}
            bgColor="rgba(10,191,184,0.06)"
            onClick={() => photoRef.current?.click()}
          />
          <MediaButton
            icon="▶"
            label="Video hinzufügen"
            color={WT.violet}
            bgColor="rgba(139,92,246,0.06)"
            onClick={() => videoRef.current?.click()}
          />
          <MediaButton
            icon="📄"
            label="Datei hochladen"
            color={WT.coral}
            bgColor="rgba(251,146,60,0.06)"
            onClick={() => fileRef.current?.click()}
          />
        </div>

        {/* Hidden File Inputs */}
        <input ref={photoRef} type="file" accept="image/*" multiple hidden
          onChange={e => addFiles(e.target.files)} />
        <input ref={videoRef} type="file" accept="video/*" multiple hidden
          onChange={e => addFiles(e.target.files)} />
        <input ref={fileRef}  type="file" accept=".pdf,.mp3,.wav,.zip,.psd,.ai,.fig" multiple hidden
          onChange={e => addFiles(e.target.files)} />

        {/* Galerie-Vorschau */}
        {mediaFiles.length > 0 && (
          <MediaGallery
            files={mediaFiles}
            onRemove={removeFile}
            onAdd={() => photoRef.current?.click()}
          />
        )}
      </div>

      {/* ── CTA ── */}
      <button
        onClick={canNext ? onNext : undefined}
        style={{
          width:"100%", height:54,
          borderRadius:18,
          border:"none",
          background: canNext
            ? `linear-gradient(135deg, ${WT.teal} 0%, #06B6D4 100%)`
            : "rgba(26,26,46,0.08)",
          color: canNext ? "#fff" : WT.ink4,
          fontSize:16, fontWeight:800,
          cursor: canNext ? "pointer" : "default",
          transition:"all 0.22s ease",
          boxShadow: canNext ? "0 8px 24px rgba(10,191,184,0.28)" : "none",
          marginBottom:4,
        }}
      >
        Weiter →
      </button>
    </div>
  );
}
