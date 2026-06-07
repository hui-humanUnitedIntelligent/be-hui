// src/components/ambassador/AmbassadorModal.jsx
import React, { useState, useRef } from "react";
import { useAmbassadorApplication } from "../../hooks/useAmbassador.js";

const T = {
  teal:    "#0EC4B8",
  ink:     "#1A1A18",
  inkSoft: "rgba(26,26,24,0.55)",
};

const CSS = `
  @keyframes amb-slide-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
  .amb-overlay {
    position:fixed;inset:0;background:rgba(10,10,10,0.55);
    z-index:9999;display:flex;align-items:flex-end;justify-content:center;
    padding-bottom:calc(64px + env(safe-area-inset-bottom,0px));
  }
  .amb-sheet {
    background:#fff;border-radius:24px 24px 0 0;width:100%;max-width:520px;
    max-height:calc(90dvh - 64px);overflow-y:auto;
    animation:amb-slide-up .28s cubic-bezier(.22,1,.36,1) both;
    scrollbar-width:none;-webkit-overflow-scrolling:touch;
  }
  .amb-sheet::-webkit-scrollbar { display:none }
  .amb-input {
    width:100%;padding:13px 14px;background:#F7F5F2;
    border:1.5px solid rgba(26,26,24,0.10);border-radius:12px;
    font-size:15px;color:#1A1A18;font-family:inherit;
    transition:border-color .15s;outline:none;box-sizing:border-box;
  }
  .amb-input:focus { border-color:#0EC4B8; }
  .amb-input::placeholder { color:rgba(26,26,24,0.35); }
  .amb-label { font-size:12.5px;font-weight:600;color:rgba(26,26,24,0.55);margin-bottom:6px;display:block; }
  .amb-req { color:#FF5B5B;margin-left:2px; }
  .amb-press { transition:transform .12s ease,opacity .12s ease; cursor:pointer; touch-action:manipulation; }
  .amb-press:active { transform:scale(0.96);opacity:0.75; }
  @keyframes amb-spin { to{transform:rotate(360deg)} }
  .amb-spinner { animation:amb-spin .7s linear infinite;display:inline-block; }
`;

const GENDER_OPTIONS = [
  { value: "",              label: "Bitte wählen" },
  { value: "männlich",      label: "Männlich" },
  { value: "weiblich",      label: "Weiblich" },
  { value: "divers",        label: "Divers" },
  { value: "keine Angabe",  label: "Keine Angabe" },
];

const MAX_IMAGES = 5;
const MAX_VIDEOS = 2;

export default function AmbassadorModal({ userId, onClose, onSuccess }) {
  const { submit, loading, error } = useAmbassadorApplication();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    first_name: "", last_name: "", age: "",
    gender: "", location: "", motivation_text: "",
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [submitted, setSubmitted]   = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = "Pflichtfeld";
    if (!form.last_name.trim())  errs.last_name  = "Pflichtfeld";
    if (!form.age || isNaN(Number(form.age)) || Number(form.age) < 16)
      errs.age = "Bitte gültiges Alter eingeben (min. 16)";
    if (!form.location.trim()) errs.location = "Pflichtfeld";
    if (form.motivation_text.trim().length < 30)
      errs.motivation_text = "Bitte mindestens 30 Zeichen schreiben.";
    return errs;
  };

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const images = files.filter(f => f.type.startsWith("image/"));
    const videos = files.filter(f => f.type.startsWith("video/"));
    const existImg = mediaFiles.filter(f => f.type.startsWith("image/")).length;
    const existVid = mediaFiles.filter(f => f.type.startsWith("video/")).length;
    setMediaFiles([
      ...mediaFiles,
      ...images.slice(0, MAX_IMAGES - existImg),
      ...videos.slice(0, MAX_VIDEOS - existVid),
    ]);
  };

  const removeFile = (idx) => setMediaFiles(f => f.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});
    const result = await submit(userId, form, mediaFiles);
    if (result.ok) {
      setSubmitted(true);
      setTimeout(() => { onSuccess && onSuccess(); onClose && onClose(); }, 2200);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="amb-overlay" onClick={onClose}>
        <div className="amb-sheet" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 22, marginBottom: 2 }}>🌟</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.ink }}>Werde Ambassador</div>
              <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 3 }}>
                Teile deine Leidenschaft und wachse mit der Community.
              </div>
            </div>
            <button onClick={onClose} className="amb-press"
              style={{ background: "rgba(26,26,24,0.07)", border: "none", borderRadius: 10,
                width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, cursor: "pointer", color: T.ink, flexShrink: 0 }}>
              ✕
            </button>
          </div>

          {submitted ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.ink, marginBottom: 8 }}>
                Bewerbung eingereicht!
              </div>
              <div style={{ fontSize: 14, color: T.inkSoft, lineHeight: 1.6 }}>
                Wir prüfen deine Bewerbung und melden uns bald bei dir.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ padding: "16px 20px 32px" }}>

              {/* Name */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label className="amb-label">Vorname<span className="amb-req">*</span></label>
                  <input className="amb-input" placeholder="Max" value={form.first_name}
                    onChange={e => set("first_name", e.target.value)} />
                  {formErrors.first_name && <div style={{ fontSize: 11, color: "#FF5B5B", marginTop: 4 }}>{formErrors.first_name}</div>}
                </div>
                <div>
                  <label className="amb-label">Nachname<span className="amb-req">*</span></label>
                  <input className="amb-input" placeholder="Mustermann" value={form.last_name}
                    onChange={e => set("last_name", e.target.value)} />
                  {formErrors.last_name && <div style={{ fontSize: 11, color: "#FF5B5B", marginTop: 4 }}>{formErrors.last_name}</div>}
                </div>
              </div>

              {/* Alter + Geschlecht */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label className="amb-label">Alter<span className="amb-req">*</span></label>
                  <input className="amb-input" type="number" min="16" max="99" placeholder="25" value={form.age}
                    onChange={e => set("age", e.target.value)} />
                  {formErrors.age && <div style={{ fontSize: 11, color: "#FF5B5B", marginTop: 4 }}>{formErrors.age}</div>}
                </div>
                <div>
                  <label className="amb-label">Geschlecht</label>
                  <select className="amb-input" value={form.gender} onChange={e => set("gender", e.target.value)}
                    style={{ appearance: "none", WebkitAppearance: "none" }}>
                    {GENDER_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ort */}
              <div style={{ marginBottom: 14 }}>
                <label className="amb-label">Ort<span className="amb-req">*</span></label>
                <input className="amb-input" placeholder="Berlin, Deutschland" value={form.location}
                  onChange={e => set("location", e.target.value)} />
                {formErrors.location && <div style={{ fontSize: 11, color: "#FF5B5B", marginTop: 4 }}>{formErrors.location}</div>}
              </div>

              {/* Motivation */}
              <div style={{ marginBottom: 14 }}>
                <label className="amb-label">Warum möchtest du Ambassador werden?<span className="amb-req">*</span></label>
                <textarea className="amb-input" rows={4} placeholder="Erzähl uns von dir und deiner Motivation…"
                  value={form.motivation_text} onChange={e => set("motivation_text", e.target.value)}
                  style={{ resize: "vertical", minHeight: 90 }} />
                <div style={{ fontSize: 11, color: form.motivation_text.length >= 30 ? T.teal : T.inkSoft, marginTop: 4, textAlign: "right" }}>
                  {form.motivation_text.length} / min. 30 Zeichen
                </div>
                {formErrors.motivation_text && <div style={{ fontSize: 11, color: "#FF5B5B", marginTop: 2 }}>{formErrors.motivation_text}</div>}
              </div>

              {/* Medien */}
              <div style={{ marginBottom: 20 }}>
                <label className="amb-label">Bilder &amp; Videos (optional)</label>
                <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 8 }}>
                  Max. {MAX_IMAGES} Bilder · Max. {MAX_VIDEOS} Videos
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="amb-press"
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px",
                    background: "rgba(14,196,184,0.08)", border: "1.5px dashed rgba(14,196,184,0.4)",
                    borderRadius: 12, color: T.teal, fontSize: 13.5, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit" }}>
                  📎 Dateien auswählen
                </button>
                <input ref={fileInputRef} type="file" multiple accept="image/*,video/*"
                  style={{ display: "none" }} onChange={handleFiles} />
                {mediaFiles.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                    {mediaFiles.map((file, i) => (
                      <div key={i} style={{ background: "#F7F5F2", borderRadius: 10,
                        padding: "6px 10px", display: "flex", alignItems: "center", gap: 6,
                        fontSize: 12, color: T.inkSoft }}>
                        <span>{file.type.startsWith("video/") ? "🎥" : "🖼️"}</span>
                        <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {file.name}
                        </span>
                        <button type="button" onClick={() => removeFile(i)}
                          style={{ background: "none", border: "none", color: "#FF5B5B",
                            cursor: "pointer", fontSize: 14, padding: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div style={{ background: "rgba(255,91,91,0.08)", border: "1px solid rgba(255,91,91,0.2)",
                  borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#FF5B5B", marginBottom: 14 }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Submit — Teil des Scroll-Flows */}
              <button type="submit" disabled={loading} className="amb-press"
                style={{ width: "100%", padding: "15px",
                  background: loading ? "rgba(14,196,184,0.5)" : T.teal,
                  border: "none", borderRadius: 99, color: "#fff", fontSize: 16, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
                  boxShadow: loading ? "none" : "0 4px 18px rgba(14,196,184,0.35)" }}>
                {loading ? <span className="amb-spinner">⟳</span> : "🚀 Bewerbung einreichen"}
              </button>

            </form>
          )}

        </div>
      </div>
    </>
  );
}
