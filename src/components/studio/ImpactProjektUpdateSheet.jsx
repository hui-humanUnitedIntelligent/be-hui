import { HUIAwardIcon, HUIFortschrittIcon, HUIKalenderIcon, HUINachrichtIcon } from '../../design/icons/HuiSystemIcons.jsx';
// ImpactProjektUpdateSheet.jsx — Bottom-Sheet zum Hinzufügen von Projekt-Updates
// ════════════════════════════════════════════════════════════════════════════
// Felder: Überschrift, Beschreibung, Bilder/Videos Upload (multiple),
//         Typ-Chip (Meilenstein/Fortschritt/Neuigkeit/Geplant), Datum (optional)
// Submit → INSERT in impact_project_updates
// Uploads via Supabase Storage Bucket 'impact-updates'
// Portal + zIndex >= 10500
// ════════════════════════════════════════════════════════════════════════════

import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";

// ── Design Tokens ─────────────────────────────────────────────────
const T = {
  bg:       "#F7F5F0",
  bgCard:   "#FFFFFF",
  teal:     "#0EC4B8",
  tealDeep: "#0AADA3",
  tealSoft: "rgba(14,196,184,0.10)",
  tealMid:  "rgba(14,196,184,0.22)",
  coral:    "#FF6B6B",
  coralSoft:"rgba(255,107,107,0.10)",
  violet:   "#7C3AED",
  violetSoft:"rgba(124,58,237,0.10)",
  amber:    "#F59E0B",
  amberSoft:"rgba(245,158,11,0.10)",
  green:    "#10B981",
  greenSoft:"rgba(16,185,129,0.10)",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.52)",
  inkFaint: "rgba(26,26,24,0.32)",
  border:   "rgba(26,26,24,0.08)",
  borderMid:"rgba(26,26,24,0.14)",
  r16: 16, r12: 12, r8: 8, r99: 99,
  card: "0 1px 6px rgba(26,26,24,0.07)",
};

const UPDATE_TYPES = [
  { key: "Meilenstein", icon: <HUIAwardIcon size={16}/>, color: T.amber,  bg: T.amberSoft },
  { key: "Fortschritt", icon: <HUIFortschrittIcon size={16}/>, color: T.teal,   bg: T.tealSoft },
  { key: "Neuigkeit",   icon: <HUINachrichtIcon size={16}/>, color: T.violet, bg: T.violetSoft },
  { key: "Geplant",     icon: <HUIKalenderIcon size={16}/>, color: T.green,  bg: T.greenSoft },
];

function fmtToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function fmtDisplayDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Komponente ────────────────────────────────────────────────────
export default function ImpactProjektUpdateSheet({ projectId, authorId, onClose, onSubmitted = () => {} }) {
  const [title,       setTitle]       = useState("");
  const [content,     setContent]     = useState("");
  const [updateType,  setUpdateType]  = useState("Neuigkeit");
  const [dateStr,     setDateStr]     = useState(fmtToday());
  const [mediaFiles,  setMediaFiles]  = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState(null);
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
    const path = `updates/${projectId}/${Date.now()}_${idx}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("impact-updates")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) throw new Error(`Upload-Fehler: ${upErr.message}`);
    const { data: urlData } = supabase.storage.from("impact-updates").getPublicUrl(path);
    return urlData?.publicUrl;
  };

  // ── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim()) { setError("Bitte gib eine Überschrift ein."); return; }
    if (!projectId)    { setError("Projekt-ID fehlt."); return; }
    if (!authorId)     { setError("Du musst angemeldet sein."); return; }

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

      // 2. Insert in impact_project_updates
      const insertData = {
        project_id:  projectId,
        author_id:   authorId,
        title:       title.trim(),
        content:     content.trim() || null,
        update_type: updateType,
        media_urls:  urls,
      };

      // Wenn ein Datum angegeben wurde, das vom heutigen abweicht,
      // nutzen wir es als created_at
      if (dateStr && dateStr !== fmtToday()) {
        insertData.created_at = new Date(dateStr + "T12:00:00").toISOString();
      }

      const { error: insErr } = await supabase
        .from("impact_project_updates")
        .insert(insertData);

      if (insErr) throw new Error(`Speichern fehlgeschlagen: ${insErr.message}`);

      // Cleanup
      mediaPreviews.forEach(p => { if (p.url?.startsWith("blob:")) URL.revokeObjectURL(p.url); });

      onSubmitted();
      onClose?.();
    } catch (e) {
      console.error("[ImpactProjektUpdateSheet] submit:", e);
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
        position: "fixed", inset: 0, zIndex: 10500,
        background: "rgba(26,26,24,0.52)",
        display: "flex", alignItems: "flex-end",
      }}
      onClick={e => { if (e.target === e.currentTarget && !submitting) onClose?.(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480, margin: "0 auto",
        background: T.bg, borderRadius: "24px 24px 0 0",
        maxHeight: "92vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 -4px 32px rgba(26,26,24,0.18)",
        animation: "ipuSlideUp 0.28s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        <style>{`@keyframes ipuSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(26,26,24,0.12)" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 20px 14px",
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, letterSpacing: "-0.02em" }}>
              
            </div>
            <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>
              Halte deine Unterstützer auf dem Laufenden
            </div>
          </div>
          <button onClick={() => { if (!submitting) onClose?.(); }} style={{
            background: "rgba(26,26,24,0.07)", border: "none", cursor: "pointer",
            borderRadius: "50%", width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: T.inkSoft,
          }}>✕</button>
        </div>

        {/* ── Scroll-Content ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 120px" }}>

          {/* Ueberschrift */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, display: "block", marginBottom: 6 }}>
              Überschrift *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="z.B. Erster Meilenstein erreicht!"
              maxLength={120}
              style={{
                width: "100%", padding: "12px 14px",
                background: T.bgCard, border: `1px solid ${T.border}`,
                borderRadius: T.r12, fontSize: 14, fontFamily: "inherit",
                color: T.ink, outline: "none",
              }}
              onFocus={e => e.target.style.borderColor = T.teal}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>

          {/* Beschreibung */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, display: "block", marginBottom: 6 }}>
              Beschreibung
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Erzaehl mehr ueber dieses Update..."
              rows={4}
              maxLength={2000}
              style={{
                width: "100%", padding: "12px 14px",
                background: T.bgCard, border: `1px solid ${T.border}`,
                borderRadius: T.r12, fontSize: 14, fontFamily: "inherit",
                color: T.ink, outline: "none", resize: "vertical",
                lineHeight: 1.5,
              }}
              onFocus={e => e.target.style.borderColor = T.teal}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>

          {/* Typ-Chips */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, display: "block", marginBottom: 8 }}>
              Typ
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {UPDATE_TYPES.map(t => (
                <button
                  key={t.key}
                  onClick={() => setUpdateType(t.key)}
                  style={{
                    padding: "8px 14px", borderRadius: T.r99,
                    border: updateType === t.key ? `1.5px solid ${t.color}` : `1px solid ${T.border}`,
                    background: updateType === t.key ? t.bg : T.bgCard,
                    color: updateType === t.key ? t.color : T.inkSoft,
                    fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                    cursor: "pointer", transition: "all .15s",
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  <span>{t.icon}</span> {t.key}
                </button>
              ))}
            </div>
          </div>

          {/* Datum */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, display: "block", marginBottom: 6 }}>
              Datum (optional)
            </label>
            <input
              type="date"
              value={dateStr}
              onChange={e => setDateStr(e.target.value)}
              style={{
                width: "100%", padding: "12px 14px",
                background: T.bgCard, border: `1px solid ${T.border}`,
                borderRadius: T.r12, fontSize: 14, fontFamily: "inherit",
                color: T.ink, outline: "none",
              }}
              onFocus={e => e.target.style.borderColor = T.teal}
              onBlur={e => e.target.style.borderColor = T.border}
            />
            <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 4 }}>
              Standard: heute ({fmtDisplayDate(fmtToday())})
            </div>
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
                Bilder und Videos (mehrere moeglich)
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
                        background: "#1A1A18", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: 22, color: "#fff",
                      }}>🎬</div>
                    ) : (
                      <img loading="lazy" decoding="async" src={p.url} alt={p.name}
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
            disabled={submitting || !title.trim()}
            style={{
              width: "100%", padding: "14px",
              background: submitting || !title.trim()
                ? "rgba(14,196,184,0.40)"
                : `linear-gradient(135deg, ${T.teal}, ${T.tealDeep})`,
              border: "none", borderRadius: T.r99, color: "#fff",
              fontSize: 15, fontWeight: 800, fontFamily: "inherit",
              cursor: submitting || !title.trim() ? "not-allowed" : "pointer",
              boxShadow: submitting ? "none" : "0 4px 18px rgba(14,196,184,0.35)",
              transition: "all .2s",
            }}
          >
            {submitting ? "⏳ Wird gesendet..." : "✅ Update veroeffentlichen"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
