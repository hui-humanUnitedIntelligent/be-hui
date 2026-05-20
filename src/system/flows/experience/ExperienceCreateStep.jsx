// src/system/flows/experience/ExperienceCreateStep.jsx
// Step 1 — Fähigkeit vorstellen: Titel, Beschreibung, Medien

import React, { useRef, useCallback } from "react";
import { ET, EInput } from "./ExperienceFlow.jsx";

const EXAMPLES = [
  "Gitarrenunterricht für Anfänger",
  "Meditationsabende",
  "Portrait Fotografie",
  "3D Design Mentoring",
];

const CATEGORIES = [
  "Coaching","Musik","Fotografie","Meditation","Yoga","Design",
  "Sprachen","Sport","Kunst","Technologie","Tanz","Ernährung",
  "Persönlichkeit","Kreativität","Sonstiges",
];

/* ── Medien Upload Button ─────────────────────────────────────── */
function MediaBtn({ icon, label, color, bg, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex:1, padding:"15px 8px", borderRadius:16,
      border:`1.5px dashed ${color}45`,
      background:bg, cursor:"pointer",
      display:"flex", flexDirection:"column",
      alignItems:"center", gap:6, minHeight:74,
      transition:"all 0.18s ease",
    }}>
      <div style={{
        width:38, height:38, borderRadius:11,
        background:`${color}18`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:20,
      }}>{icon}</div>
      <div style={{ fontSize:11, fontWeight:600, color,
        textAlign:"center", lineHeight:1.2 }}>{label}</div>
    </button>
  );
}

/* ── Galerie ─────────────────────────────────────────────────── */
function MediaGallery({ files, onRemove, onAdd }) {
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"repeat(3,1fr)",
      gap:8, marginTop:8,
    }}>
      {files.map((f,i) => (
        <div key={i} style={{
          position:"relative", borderRadius:14, overflow:"hidden",
          aspectRatio:"1",
          boxShadow:"0 4px 14px rgba(26,26,46,0.10)",
        }}>
          {f.type.startsWith("video") ? (
            <video src={f.preview}
              style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          ) : (
            <img src={f.preview} alt=""
              style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          )}
          <button onClick={() => onRemove(i)} style={{
            position:"absolute", top:6, right:6,
            width:22, height:22, borderRadius:"50%",
            background:"rgba(26,26,46,0.62)", border:"none",
            cursor:"pointer", display:"flex", alignItems:"center",
            justifyContent:"center", fontSize:10, color:"#fff",
          }}>✕</button>
        </div>
      ))}
      <button onClick={onAdd} style={{
        borderRadius:14, border:"1.5px dashed rgba(26,26,46,0.14)",
        background:"rgba(248,247,255,0.55)", cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center",
        aspectRatio:"1", fontSize:20, color:"rgba(26,26,46,0.22)",
      }}>+</button>
    </div>
  );
}

/* ── Step 1 ──────────────────────────────────────────────────── */
export function ExperienceCreateStep({
  form, mediaFiles, onFormChange, onMediaChange, onNext,
}) {
  const photoRef = useRef();
  const videoRef = useRef();
  const fileRef  = useRef();
  const canNext  = form.title.trim().length >= 3;

  const addFiles = useCallback((fileList) => {
    const newFiles = Array.from(fileList).map(f => ({
      file: f, preview: URL.createObjectURL(f), type: f.type,
    }));
    onMediaChange(prev => [...prev, ...newFiles]);
  }, [onMediaChange]);

  const removeFile = useCallback(idx => {
    onMediaChange(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_,i) => i !== idx);
    });
  }, [onMediaChange]);

  return (
    <div style={{ padding:"24px 20px 20px",
      animation:"efFadeStep 0.28s ease both" }}>

      {/* ── Headline ── */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:900, color:ET.ink,
          letterSpacing:-0.6, margin:0, lineHeight:1.15 }}>
          Erlebnis öffnen<span style={{ color:ET.teal, marginLeft:3 }}>·</span>
        </h1>
        <p style={{ fontSize:13.5, color:ET.ink3, margin:"5px 0 0" }}>
          Teile deine Fähigkeit mit anderen Menschen.
        </p>
      </div>

      {/* ── Beispiele (inspirierend) ── */}
      <div style={{
        background:"rgba(10,191,184,0.05)",
        borderRadius:14, padding:"12px 14px",
        border:"1px solid rgba(10,191,184,0.12)",
        marginBottom:20,
      }}>
        <div style={{ fontSize:11, fontWeight:700, color:ET.teal,
          letterSpacing:0.5, marginBottom:8, textTransform:"uppercase" }}>
          Inspiration
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => onFormChange({ title:ex })} style={{
              fontSize:11.5, padding:"5px 10px", borderRadius:20,
              border:"1px solid rgba(10,191,184,0.22)",
              background:"rgba(10,191,184,0.07)",
              color:ET.ink2, cursor:"pointer", fontWeight:500,
              transition:"all 0.16s ease",
            }}>{ex}</button>
          ))}
        </div>
      </div>

      {/* ── Titel ── */}
      <div style={{ marginBottom:16 }}>
        <label style={{ fontSize:12, fontWeight:700, color:ET.ink3,
          letterSpacing:0.3, display:"block", marginBottom:6 }}>
          Titel
        </label>
        <input
          style={EInput}
          placeholder="z.B. Gitarrenunterricht für Anfänger"
          value={form.title}
          maxLength={80}
          onChange={e => onFormChange({ title: e.target.value })}
        />
      </div>

      {/* ── Beschreibung ── */}
      <div style={{ marginBottom:16 }}>
        <label style={{ fontSize:12, fontWeight:700, color:ET.ink3,
          letterSpacing:0.3, display:"block", marginBottom:6 }}>
          Beschreibung
        </label>
        <div style={{ position:"relative" }}>
          <textarea style={{
            ...EInput, minHeight:100, resize:"none",
            lineHeight:1.55, paddingBottom:24,
          }}
            placeholder="Was machst du, was können Teilnehmende erwarten?"
            value={form.description}
            maxLength={500}
            onChange={e => onFormChange({ description: e.target.value })}
          />
          <div style={{ position:"absolute", bottom:8, right:12,
            fontSize:11, color:ET.ink4 }}>
            {form.description.length}/500
          </div>
        </div>
      </div>

      {/* ── Kategorie ── */}
      <div style={{ marginBottom:20 }}>
        <label style={{ fontSize:12, fontWeight:700, color:ET.ink3,
          letterSpacing:0.3, display:"block", marginBottom:6 }}>
          Kategorie <span style={{ fontWeight:400, color:ET.ink4 }}>(optional)</span>
        </label>
        <div style={{
          display:"flex", flexWrap:"wrap", gap:6,
        }}>
          {CATEGORIES.slice(0,8).map(c => (
            <button key={c} onClick={() => onFormChange({ category: c })} style={{
              fontSize:11.5, padding:"6px 12px", borderRadius:20,
              border: form.category===c
                ? `1.5px solid ${ET.teal}` : "1.5px solid rgba(26,26,46,0.10)",
              background: form.category===c
                ? "rgba(10,191,184,0.08)" : "rgba(248,247,255,0.55)",
              color: form.category===c ? ET.teal : ET.ink3,
              cursor:"pointer", fontWeight:600,
              transition:"all 0.16s ease",
            }}>{c}</button>
          ))}
          {CATEGORIES.slice(8).map(c => (
            <button key={c} onClick={() => onFormChange({ category: c })} style={{
              fontSize:11.5, padding:"6px 12px", borderRadius:20,
              border: form.category===c
                ? `1.5px solid ${ET.teal}` : "1.5px solid rgba(26,26,46,0.10)",
              background: form.category===c
                ? "rgba(10,191,184,0.08)" : "rgba(248,247,255,0.55)",
              color: form.category===c ? ET.teal : ET.ink3,
              cursor:"pointer", fontWeight:600,
              transition:"all 0.16s ease",
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* ── Medien ── */}
      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:14, fontWeight:800, color:ET.ink,
          marginBottom:12 }}>Medien hinzufügen</div>

        <div style={{ display:"flex", gap:10, marginBottom:12 }}>
          <MediaBtn icon="🖼" label="Foto hinzufügen"
            color={ET.teal} bg="rgba(10,191,184,0.05)"
            onClick={() => photoRef.current?.click()} />
          <MediaBtn icon="▶" label="Video hinzufügen"
            color={ET.violet} bg="rgba(139,92,246,0.05)"
            onClick={() => videoRef.current?.click()} />
          <MediaBtn icon="📁" label="Beispielwerke"
            color={ET.coral} bg="rgba(251,146,60,0.05)"
            onClick={() => fileRef.current?.click()} />
        </div>

        <input ref={photoRef} type="file" accept="image/*" multiple hidden
          onChange={e => addFiles(e.target.files)} />
        <input ref={videoRef} type="file" accept="video/*" multiple hidden
          onChange={e => addFiles(e.target.files)} />
        <input ref={fileRef} type="file"
          accept=".pdf,.mp3,.wav,.zip,.psd,.ai,.fig,.mp4,.mov" multiple hidden
          onChange={e => addFiles(e.target.files)} />

        {mediaFiles.length > 0 && (
          <MediaGallery
            files={mediaFiles}
            onRemove={removeFile}
            onAdd={() => photoRef.current?.click()}
          />
        )}
      </div>

      {/* ── CTA ── */}
      <button onClick={canNext ? onNext : undefined} style={{
        width:"100%", height:54, borderRadius:18, border:"none",
        background: canNext
          ? `linear-gradient(135deg, ${ET.teal} 0%, #06B6D4 100%)`
          : "rgba(26,26,46,0.08)",
        color: canNext ? "#fff" : ET.ink4,
        fontSize:16, fontWeight:800,
        cursor: canNext ? "pointer" : "default",
        boxShadow: canNext ? "0 8px 24px rgba(10,191,184,0.26)" : "none",
        transition:"all 0.22s ease",
        marginBottom:4,
      }}>Weiter →</button>
    </div>
  );
}
