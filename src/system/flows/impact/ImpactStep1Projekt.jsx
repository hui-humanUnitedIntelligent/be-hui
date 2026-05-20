// src/system/flows/impact/ImpactStep1Projekt.jsx
// Step 1 — Projekt vorstellen

import React, { useRef, useCallback } from "react";
import { IT, IInput, ITextarea, ImpactNextBtn } from "./ImpactFlow.jsx";

/* ── Upload Button ────────────────────────────────────────────── */
function UploadBtn({ icon, label, color, bg, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      gap:5, padding:"14px 8px",
      borderRadius:16, border:`1.5px dashed ${color}45`,
      background:bg, cursor:"pointer",
      flex:1, minHeight:72,
      transition:"all 0.16s ease",
    }}>
      <div style={{
        width:36, height:36, borderRadius:11,
        background:`${color}18`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:20,
      }}>{icon}</div>
      <div style={{ fontSize:10.5, fontWeight:700, color,
        textAlign:"center", lineHeight:1.25 }}>{label}</div>
    </button>
  );
}

/* ── Medien-Galerie ───────────────────────────────────────────── */
function MediaGrid({ files, onRemove, onAdd }) {
  const imgFiles = files.filter(f => f.type.startsWith("image") || f.type.startsWith("video"));
  const otherFiles = files.filter(f => !f.type.startsWith("image") && !f.type.startsWith("video"));
  return (
    <div>
      {/* Bilder/Videos */}
      {imgFiles.length > 0 && (
        <div style={{
          display:"grid", gridTemplateColumns:"repeat(3,1fr)",
          gap:8, marginBottom: otherFiles.length > 0 ? 8 : 0,
        }}>
          {imgFiles.map((f,i) => (
            <div key={i} style={{
              position:"relative", borderRadius:14, overflow:"hidden",
              aspectRatio:"1", boxShadow:"0 4px 12px rgba(26,26,46,0.10)",
            }}>
              {f.type.startsWith("video")
                ? <video src={f.preview}
                    style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : <img src={f.preview} alt=""
                    style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              }
              <button onClick={() => onRemove(files.indexOf(f))} style={{
                position:"absolute", top:5, right:5,
                width:22, height:22, borderRadius:"50%",
                background:"rgba(26,26,46,0.60)", border:"none",
                cursor:"pointer", color:"#fff", fontSize:10,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>✕</button>
            </div>
          ))}
          {/* + Slot */}
          <button onClick={onAdd} style={{
            borderRadius:14, border:"1.5px dashed rgba(26,26,46,0.14)",
            background:"rgba(248,247,255,0.55)", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            aspectRatio:"1", fontSize:20, color:"rgba(26,26,46,0.22)",
          }}>+</button>
        </div>
      )}
      {/* Andere Dateien (PDF etc.) */}
      {otherFiles.map((f,i) => (
        <div key={i} style={{
          display:"flex", alignItems:"center", gap:10,
          padding:"10px 12px", borderRadius:12,
          background:"rgba(10,191,184,0.05)",
          border:"1px solid rgba(10,191,184,0.15)",
          marginTop:6,
        }}>
          <div style={{ fontSize:20 }}>
            {f.type.includes("pdf") ? "📄" : "📁"}
          </div>
          <div style={{ flex:1, fontSize:13, color:IT.ink2,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {f.file.name}
          </div>
          <button onClick={() => onRemove(files.indexOf(f))} style={{
            width:22, height:22, borderRadius:"50%",
            background:"rgba(26,26,46,0.10)", border:"none",
            cursor:"pointer", fontSize:11, color:IT.ink3,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>✕</button>
        </div>
      ))}
    </div>
  );
}

/* ── Step 1 ──────────────────────────────────────────────────── */
export function ImpactStep1Projekt({
  form, mediaFiles, onFormChange, onMediaChange, onNext,
}) {
  const photoRef = useRef();
  const videoRef = useRef();
  const pdfRef   = useRef();
  const fileRef  = useRef();

  // Nur Projektname ist Pflichtfeld für Step 1
  const canNext = form.projectName.trim().length >= 2;

  const addFiles = useCallback(list => {
    const arr = Array.from(list).map(f => ({
      file:f, preview: URL.createObjectURL(f), type:f.type,
    }));
    onMediaChange(prev => [...prev, ...arr]);
  }, [onMediaChange]);

  const removeFile = useCallback(idx => {
    onMediaChange(prev => {
      URL.revokeObjectURL(prev[idx]?.preview);
      return prev.filter((_,i) => i !== idx);
    });
  }, [onMediaChange]);

  return (
    <div style={{ padding:"24px 20px 24px",
      animation:"ifFadeStep 0.28s ease both" }}>

      {/* ── Hero ── */}
      <div style={{ marginBottom:24 }}>
        {/* Kleines Pflanzen-Emoji als visueller Anker */}
        <div style={{
          width:52, height:52, borderRadius:16,
          background:"linear-gradient(135deg,rgba(16,185,129,0.12),rgba(10,191,184,0.12))",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:26, marginBottom:12,
        }}>🌱</div>
        <h1 style={{ fontSize:24, fontWeight:900, color:IT.ink,
          letterSpacing:-0.6, margin:0, lineHeight:1.15 }}>
          Wirkung starten<span style={{ color:IT.teal, marginLeft:3 }}>·</span>
        </h1>
        <p style={{ fontSize:13.5, color:IT.ink3, margin:"5px 0 0", lineHeight:1.5 }}>
          Bewirb dein Projekt für den HUI{" "}
          <span style={{ color:IT.teal, fontWeight:700 }}>ImpactPool</span>.
        </p>
      </div>

      {/* ── Sektion Label ── */}
      <div style={{ fontSize:13, fontWeight:800, color:IT.ink,
        marginBottom:14, letterSpacing:0.2 }}>
        Projekt vorstellen
      </div>

      {/* ── Projektname ── */}
      <div style={{ marginBottom:14 }}>
        <label style={{ fontSize:12, fontWeight:700, color:IT.ink3,
          display:"block", marginBottom:6, letterSpacing:0.3 }}>
          Projektname <span style={{ color:IT.coral }}>*</span>
        </label>
        <input className="if-input" style={IInput}
          placeholder="Ocean CleanUp Initiative"
          value={form.projectName} maxLength={80}
          onChange={e => onFormChange({ projectName:e.target.value })}
        />
      </div>

      {/* ── Kurzbeschreibung ── */}
      <div style={{ marginBottom:22 }}>
        <label style={{ fontSize:12, fontWeight:700, color:IT.ink3,
          display:"block", marginBottom:6, letterSpacing:0.3 }}>
          Kurzbeschreibung <span style={{ color:IT.coral }}>*</span>
        </label>
        <div style={{ position:"relative" }}>
          <textarea className="if-input" style={{ ...ITextarea, minHeight:110 }}
            placeholder="Wir entwickeln innovative schwimmende Filterstationen, die Plastikmüll aus Flüssen bevor es ins Meer gelangt, entfernen."
            value={form.shortDesc} maxLength={500}
            onChange={e => onFormChange({ shortDesc:e.target.value })}
          />
          <div style={{ position:"absolute", bottom:8, right:12,
            fontSize:11, color:IT.ink4 }}>
            {form.shortDesc.length}/500
          </div>
        </div>
      </div>

      {/* ── Medien ── */}
      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:13, fontWeight:800, color:IT.ink,
          marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
          Medien hochladen
          <div style={{
            fontSize:10.5, color:IT.ink4, background:"rgba(26,26,46,0.06)",
            borderRadius:6, padding:"2px 6px", fontWeight:500,
          }}>optional</div>
        </div>
        <p style={{ fontSize:12, color:IT.ink4, margin:"0 0 12px" }}>
          Bilder, Videos, PDF oder Pitch Deck
        </p>

        {/* Upload Buttons */}
        <div style={{ display:"flex", gap:8, marginBottom:12 }}>
          <UploadBtn icon="🖼" label="Foto hinzufügen"
            color={IT.teal} bg="rgba(10,191,184,0.05)"
            onClick={() => photoRef.current?.click()} />
          <UploadBtn icon="▶" label="Video hinzufügen"
            color={IT.violet} bg="rgba(139,92,246,0.05)"
            onClick={() => videoRef.current?.click()} />
          <UploadBtn icon="📄" label="PDF / Pitch Deck"
            color={IT.coral} bg="rgba(251,146,60,0.05)"
            onClick={() => pdfRef.current?.click()} />
          <UploadBtn icon="+" label="Weitere Datei"
            color={IT.ink3} bg="rgba(26,26,46,0.04)"
            onClick={() => fileRef.current?.click()} />
        </div>

        <input ref={photoRef} type="file" accept="image/*" multiple hidden
          onChange={e => addFiles(e.target.files)} />
        <input ref={videoRef} type="file" accept="video/*" multiple hidden
          onChange={e => addFiles(e.target.files)} />
        <input ref={pdfRef} type="file" accept=".pdf" multiple hidden
          onChange={e => addFiles(e.target.files)} />
        <input ref={fileRef} type="file"
          accept=".zip,.pptx,.docx,.key,.fig,.sketch" multiple hidden
          onChange={e => addFiles(e.target.files)} />

        {mediaFiles.length > 0 && (
          <MediaGrid
            files={mediaFiles}
            onRemove={removeFile}
            onAdd={() => photoRef.current?.click()}
          />
        )}
      </div>

      {/* ── CTA ── */}
      <ImpactNextBtn onClick={onNext} disabled={!canNext} />
    </div>
  );
}
