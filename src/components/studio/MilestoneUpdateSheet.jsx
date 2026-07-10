// MilestoneUpdateSheet.jsx — Bottom-Sheet zum Aktualisieren eines Meilensteins
// ════════════════════════════════════════════════════════════════════════════
// Props: milestone (object), projectId, authorId, onClose, onSubmitted
// Felder: Bild/Video Upload, Text/Beschreibung, Status-Update (in_progress | completed)
// Speichern:
//   1. Medien hochladen (Supabase Storage, Bucket 'impact-media')
//   2. INSERT impact_milestone_updates { milestone_id, project_id, author_id, content, media_urls, status_update }
//   3. UPDATE impact_milestones SET status = status_update, updated_at = now() WHERE id = milestone_id
//   4. onSubmitted()
// Portal + zIndex 10600
// ════════════════════════════════════════════════════════════════════════════

import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";

// ── Design Tokens (konsistent mit HUI Design) ─────────────────────
const T = {
  bg:       "#F7F5F0",
  bgCard:   "#FFFFFF",
  teal:     "#0DC4B5",
  tealDeep: "#09A89D",
  tealSoft: "rgba(13,196,181,0.10)",
  tealMid:  "rgba(13,196,181,0.22)",
  coral:    "#FF6B6B",
  coralSoft:"rgba(255,107,107,0.10)",
  green:    "#22c55e",
  greenSoft:"rgba(34,197,94,0.10)",
  amber:    "#F59E0B",
  amberSoft:"rgba(245,158,11,0.10)",
  ink:      "#141422",
  inkSoft:  "rgba(20,20,34,0.52)",
  inkFaint: "rgba(20,20,34,0.32)",
  border:   "rgba(20,20,34,0.08)",
  borderMid:"rgba(20,20,34,0.14)",
  r16: 16, r12: 12, r8: 8, r99: 99,
  card: "0 1px 6px rgba(20,20,34,0.07)",
};

const STATUS_OPTIONS = [
  { key: "in_progress", label: "🔄 In Arbeit",    color: T.teal,  bg: T.tealSoft },
  { key: "completed",   label: "✅ Abgeschlossen",  color: T.green, bg: T.greenSoft },
];

// ── Komponente ────────────────────────────────────────────────────
export default function MilestoneUpdateSheet({ milestone, projectId, authorId, onClose, onSubmitted = () => {} }) {
  const [content,        setContent]        = useState("");
  const [statusUpdate,   setStatusUpdate]   = useState("in_progress");
  const [mediaFiles,     setMediaFiles]     = useState([]);
  const [mediaPreviews,  setMediaPreviews]  = useState([]);
  const [submitting,     setSubmitting]     = useState(false);
  const [error,          setError]          = useState(null);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef(null);

  // ── Datei-Auswahl ────────────────────────────────────────────────
  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPreviews = files.map(f => ({
      url: URL.createObjectURL(f),
      name: f.name,
      type: f.type,
      size: f.size,
    }));
    setMediaFiles(prev => [...prev, ...files]);
    setMediaPreviews(prev => [...prev, ...newPreviews]);
  }, []);

  const removeFile = (idx) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== idx));
    setMediaPreviews(prev => {
      const removed = prev[idx];
      if (removed?.url?.startsWith("blob:")) URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // ── Upload einer einzelnen Datei ─────────────────────────────────
  const uploadFile = async (file, idx) => {
    const ext = file.name.split(".").pop() || "bin";
    const path = `milestones/${projectId}/${milestone.id}/${Date.now()}_${idx}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("impact-media")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) throw new Error(`Upload-Fehler: ${upErr.message}`);
    const { data: urlData } = supabase.storage.from("impact-media").getPublicUrl(path);
    return urlData?.publicUrl;
  };

  // ── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!content.trim()) { setError("Bitte beschreibe den Fortschritt."); return; }
    if (!milestone?.id)  { setError("Meilenstein-ID fehlt."); return; }
    if (!projectId)      { setError("Projekt-ID fehlt."); return; }
    if (!authorId)       { setError("Du musst angemeldet sein."); return; }

    setSubmitting(true);
    setError(null);
    try {
      // 1. Medien hochladen
      const urls = [];
      for (let i = 0; i < mediaFiles.length; i++) {
        setUploadProgress(`Lade Medien hoch... (${i + 1}/${mediaFiles.length})`);
        const url = await uploadFile(mediaFiles[i], i);
        if (url) urls.push(url);
      }
      setUploadProgress("Speichere Update...");

      // 2. INSERT impact_milestone_updates
      const { error: insErr } = await supabase
        .from("impact_milestone_updates")
        .insert({
          milestone_id:  milestone.id,
          project_id:    projectId,
          author_id:     authorId,
          content:       content.trim(),
          media_urls:    urls.length > 0 ? urls : null,
          status_update: statusUpdate,
        });

      if (insErr) throw new Error(`Speichern fehlgeschlagen: ${insErr.message}`);

      // 3. UPDATE impact_milestones SET status = status_update
      const { error: msErr } = await supabase
        .from("impact_milestones")
        .update({ status: statusUpdate, updated_at: new Date().toISOString() })
        .eq("id", milestone.id);

      if (msErr) {
        console.warn("[MilestoneUpdateSheet] milestone status update warning:", msErr);
      }

      // Cleanup
      mediaPreviews.forEach(p => { if (p.url?.startsWith("blob:")) URL.revokeObjectURL(p.url); });

      // 4. onSubmitted
      onSubmitted();
      onClose?.();
    } catch (e) {
      console.error("[MilestoneUpdateSheet] submit:", e);
      setError(e.message || "Ein Fehler ist aufgetreten.");
    } finally {
      setSubmitting(false);
      setUploadProgress("");
    }
  };

  // ── Modal ─────────────────────────────────────────────────────────
  const modal = (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10600,
        background: "rgba(20,20,34,0.55)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end",
      }}
      onClick={e => { if (e.target === e.currentTarget && !submitting) onClose?.(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480, margin: "0 auto",
        background: T.bg, borderRadius: "24px 24px 0 0",
        maxHeight: "92vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.22)",
        animation: "msuSlideUp 0.28s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        <style>{`@keyframes msuSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(20,20,34,0.12)" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 20px 14px",
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, letterSpacing: "-0.02em" }}>
              🏁 Meilenstein aktualisieren
            </div>
            <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>
              {milestone?.title}
            </div>
          </div>
          <button onClick={() => { if (!submitting) onClose?.(); }} style={{
            background: "rgba(20,20,34,0.07)", border: "none", cursor: "pointer",
            borderRadius: "50%", width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: T.inkSoft,
          }}>✕</button>
        </div>

        {/* ── Scroll-Content ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 120px" }}>

          {/* Status-Update Chips */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, display: "block", marginBottom: 8 }}>
              Status-Update
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s.key}
                  onClick={() => setStatusUpdate(s.key)}
                  style={{
                    padding: "8px 14px", borderRadius: T.r99,
                    border: statusUpdate === s.key ? `1.5px solid ${s.color}` : `1px solid ${T.border}`,
                    background: statusUpdate === s.key ? s.bg : T.bgCard,
                    color: statusUpdate === s.key ? s.color : T.inkSoft,
                    fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                    cursor: "pointer", transition: "all .15s",
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Beschreibung */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, display: "block", marginBottom: 6 }}>
              Beschreibung *
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Beschreibe den aktuellen Fortschritt dieses Meilensteins..."
              rows={4}
              maxLength={2000}
              style={{
                width: "100%", padding: "12px 14px",
                background: T.bgCard, border: `1px solid ${T.border}`,
                borderRadius: T.r12, fontSize: 14, fontFamily: "inherit",
                color: T.ink, outline: "none", resize: "vertical",
                lineHeight: 1.5, boxSizing: "border-box",
              }}
              onFocus={e => e.target.style.borderColor = T.teal}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>

          {/* Medien-Upload */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, display: "block", marginBottom: 8 }}>
              Bilder / Videos
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%", padding: "16px",
                background: T.bgCard, border: `1.5px dashed ${T.borderMid}`,
                borderRadius: T.r12, cursor: "pointer", fontFamily: "inherit",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              }}
            >
              <span style={{ fontSize: 22 }}>📎</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.inkSoft }}>
                Dateien auswählen
              </span>
              <span style={{ fontSize: 11, color: T.inkFaint }}>
                Bilder und Videos (mehrere möglich)
              </span>
            </button>

            {/* Vorschau */}
            {mediaPreviews.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {mediaPreviews.map((p, idx) => (
                  <div key={idx} style={{ position: "relative", width: 72, height: 72 }}>
                    {p.type?.startsWith("video/") ? (
                      <div style={{
                        width: "100%", height: "100%", borderRadius: T.r8,
                        background: T.ink, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: 22, color: "#fff",
                      }}>🎬</div>
                    ) : (
                      <img src={p.url} alt={p.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: T.r8 }} />
                    )}
                    <button onClick={() => removeFile(idx)} style={{
                      position: "absolute", top: -6, right: -6,
                      width: 20, height: 20, borderRadius: "50%",
                      background: T.coral, border: "2px solid #fff",
                      color: "#fff", fontSize: 10, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700,
                    }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              fontSize: 13, color: T.coral, marginBottom: 12,
              padding: "10px 14px", background: T.coralSoft,
              borderRadius: T.r8, border: `1px solid rgba(255,107,107,0.20)`,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Progress */}
          {uploadProgress && (
            <div style={{
              fontSize: 12, color: T.teal, marginBottom: 12,
              padding: "8px 14px", background: T.tealSoft,
              borderRadius: T.r8, textAlign: "center", fontWeight: 600,
            }}>
              {uploadProgress}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "12px 20px calc(12px + env(safe-area-inset-bottom, 0px))",
          background: T.bg,
          borderTop: `1px solid ${T.border}`,
          flexShrink: 0,
        }}>
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            style={{
              width: "100%", padding: "14px",
              background: submitting || !content.trim()
                ? "rgba(13,196,181,0.40)"
                : `linear-gradient(135deg, ${T.teal}, ${T.tealDeep})`,
              border: "none", borderRadius: T.r99, color: "#fff",
              fontSize: 15, fontWeight: 800, fontFamily: "inherit",
              cursor: submitting || !content.trim() ? "not-allowed" : "pointer",
              boxShadow: submitting ? "none" : "0 4px 18px rgba(13,196,181,0.35)",
              transition: "all .2s",
            }}
          >
            {submitting ? "⏳ Wird gesendet..." : "✅ Update speichern"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
