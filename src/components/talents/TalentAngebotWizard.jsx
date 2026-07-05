// src/components/talents/TalentAngebotWizard.jsx
// ══════════════════════════════════════════════════════════════════════
// TALENT-ANGEBOT WIZARD — Erstellen/Bearbeiten eines einzelnen Talent-Angebots
// Analog zu WerkWizard.jsx (Bilder-Upload-Pattern, Freigabe-Mechanismus),
// aber als einfaches 1-Screen-Formular (Titel, Kategorie, Beschreibung, Bilder).
// ══════════════════════════════════════════════════════════════════════
import React, { useState, useRef } from "react";
import { createTalent, updateTalent, uploadTalentImage, TALENT_KATEGORIEN } from "../../hooks/useTalents.js";
import { createPortal } from "react-dom";

const C = {
  teal: "#0EC4B8", ink: "#1A1A18", inkMid: "rgba(26,26,24,0.55)",
  inkFade: "rgba(26,26,24,0.35)", border: "rgba(26,26,24,0.10)", cream: "#F8F7F4",
};

export default function TalentAngebotWizard({ userId, existingTalent = null, onClose, onSaved }) {
  const [title, setTitle] = useState(existingTalent?.title || "");
  const [category, setCategory] = useState(existingTalent?.category || "");
  const [description, setDescription] = useState(existingTalent?.description || "");
  const [images, setImages] = useState(existingTalent?.images || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const isEdit = !!existingTalent?.id;
  const wasRejected = existingTalent?.status === "rejected";
  const isApproved = existingTalent?.status === "approved";

  // BottomNav (Orb + Footer, zIndex 9999) ausblenden solange dieser Wizard offen ist —
  // gleiches Muster wie WerkWizard.jsx/ExperienceWizard.jsx, sonst liegt der Footer über
  // dem Speichern-Button (Bug gemeldet 2026-07-04).
  React.useLayoutEffect(() => {
    document.body.classList.add("hui-wizard-open");
    return () => document.body.classList.remove("hui-wizard-open");
  }, []);

  async function handleUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!userId || !files.length) return;
    setUploading(true);
    const next = [...images];
    for (const file of files.slice(0, 5 - next.length)) {
      const { url, path, error: upErr } = await uploadTalentImage(userId, file);
      if (!upErr && url) next.push({ url, path });
    }
    setImages(next);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeImage(idx) {
    setImages(images.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!title.trim() || !category) {
      setError("Titel und Kategorie sind erforderlich.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: saveErr } = isEdit
      ? await updateTalent(existingTalent.id, {
          title: title.trim(), description: description.trim() || null,
          category, images, previousStatus: existingTalent.status,
        })
      : await createTalent({ userId, title: title.trim(), description: description.trim(), category, images });
    setSaving(false);
    if (saveErr) {
      setError(saveErr.message || "Speichern fehlgeschlagen.");
      return;
    }
    onSaved?.();
    onClose?.();
  }

  return createPortal(
    <div onClick={onClose} style={{
      // zIndex 10500 wie WerkWizard/ExperienceWizard — ueberschreibt BottomNav (10000) + ProfileLauncher (9500).
      // ROOT CAUSE des Footer-Overlap-Bugs (2026-07-04/05): war vorher 9900 (< BottomNav 10000),
      // daher lag der Footer IMMER ueber dem Modal, unabhaengig von der hui-wizard-open-Klasse.
      position: "fixed", inset: 0, zIndex: 10500, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: "20px 20px 0 0", padding: "20px 20px 24px",
        maxWidth: 480, width: "100%", maxHeight: "88vh", overflowY: "auto",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>
            {isEdit ? "Talent-Angebot bearbeiten" : "Neues Talent-Angebot"}
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: 22, color: C.inkFade, cursor: "pointer", lineHeight: 1,
          }}>×</button>
        </div>

        {isApproved && (
          <div style={{ background: "rgba(14,196,184,0.10)", borderRadius: 10, padding: "10px 12px",
            fontSize: 12, color: C.teal, fontWeight: 600, marginBottom: 14 }}>
            ✅ Dieses Angebot ist bereits freigegeben und live. Änderungen sind erst nach Rückzug/Ablehnung wieder möglich.
          </div>
        )}
        {wasRejected && existingTalent?.rejection_reason && (
          <div style={{ background: "rgba(255,80,80,0.10)", borderRadius: 10, padding: "10px 12px",
            fontSize: 12, color: "#d13a3a", marginBottom: 14, lineHeight: 1.5 }}>
            ❌ Abgelehnt: {existingTalent.rejection_reason}<br/>
            <span style={{ fontWeight: 600 }}>Beim Speichern wird es erneut zur Prüfung eingereicht.</span>
          </div>
        )}

        {/* Titel */}
        <div style={{ fontSize: 12, fontWeight: 700, color: C.inkMid, marginBottom: 6 }}>Titel</div>
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          disabled={isApproved}
          placeholder="z.B. Aquarell-Portraits nach Foto"
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C.border}`,
            fontSize: 14, fontFamily: "inherit", marginBottom: 14, boxSizing: "border-box",
            background: isApproved ? "#f5f5f3" : "#fff" }}
        />

        {/* Kategorie */}
        <div style={{ fontSize: 12, fontWeight: 700, color: C.inkMid, marginBottom: 6 }}>Kategorie</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {TALENT_KATEGORIEN.map(k => (
            <button key={k} type="button" disabled={isApproved}
              onClick={() => setCategory(k)}
              style={{
                padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                cursor: isApproved ? "default" : "pointer", fontFamily: "inherit",
                border: category === k ? `1.5px solid ${C.teal}` : `1.5px solid ${C.border}`,
                background: category === k ? "rgba(14,196,184,0.12)" : "#fff",
                color: category === k ? C.teal : C.inkMid,
              }}>{k}</button>
          ))}
        </div>

        {/* Beschreibung */}
        <div style={{ fontSize: 12, fontWeight: 700, color: C.inkMid, marginBottom: 6 }}>Beschreibung</div>
        <textarea
          value={description} onChange={e => setDescription(e.target.value)}
          disabled={isApproved}
          placeholder="Beschreibe dein Angebot..."
          rows={4}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C.border}`,
            fontSize: 14, fontFamily: "inherit", marginBottom: 14, boxSizing: "border-box", resize: "vertical",
            background: isApproved ? "#f5f5f3" : "#fff" }}
        />

        {/* Bilder */}
        <div style={{ fontSize: 12, fontWeight: 700, color: C.inkMid, marginBottom: 6 }}>Bilder (bis zu 5)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
          {images.map((img, idx) => (
            <div key={idx} style={{ position: "relative", aspectRatio: "1", borderRadius: 12,
              overflow: "hidden", background: "#e8e4df", border: `1.5px solid ${C.border}` }}>
              <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {!isApproved && (
                <button onClick={() => removeImage(idx)} style={{
                  position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%",
                  background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", fontSize: 12,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>×</button>
              )}
            </div>
          ))}
          {images.length < 5 && !isApproved && (
            <div onClick={() => !uploading && fileRef.current?.click()} style={{
              aspectRatio: "1", borderRadius: 12, border: `2px dashed rgba(14,196,184,0.38)`,
              background: "rgba(14,196,184,0.04)", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", cursor: uploading ? "not-allowed" : "pointer", gap: 4,
            }}>
              {uploading ? <div style={{ fontSize: 12, color: C.teal }}>…</div> : (
                <>
                  <div style={{ fontSize: 20, color: C.teal, fontWeight: 300 }}>+</div>
                  <div style={{ fontSize: 9, color: C.teal, fontWeight: 600 }}>Bild</div>
                </>
              )}
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleUpload} />

        {error && (
          <div style={{ background: "rgba(255,80,80,0.10)", color: "#d13a3a", borderRadius: 10,
            padding: "10px 12px", fontSize: 12, marginBottom: 12 }}>{error}</div>
        )}

        {!isApproved && (
          <button onClick={handleSave} disabled={saving || uploading} style={{
            width: "100%", padding: "14px", borderRadius: 99, border: "none",
            background: C.teal, color: "#fff", fontSize: 14, fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1,
          }}>
            {saving ? "Speichert…" : isEdit ? "Änderungen speichern" : "Zur Prüfung einreichen"}
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
