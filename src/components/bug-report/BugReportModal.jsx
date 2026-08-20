// BugReportModal.jsx — Fehlermeldungs-Modal (2026-08-19)
// Vollständiges Fehlermeldungs-System mit:
// - Textfeld (Pflicht)
// - Bild/Video Upload (max 10, JPG/PNG/MP4)
// - "Fehler absenden" Button
// - Danke-Meldung nach Absenden
// - Speichert in bug_reports Tabelle + uploads in Supabase Storage
// Additiv — keine bestehenden Funktionen werden berührt.
import React, { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { APP_VERSION } from "../../version.js";
import BugIcon from "./BugIcon.jsx";

const MAX_FILES = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "video/mp4"];
// UNIVERSELLER UPLOAD (2026-08-20): 5MB Bilder, 25MB Videos (Michael-Vorgabe)
const MAX_FILE_SIZE_IMAGE = 5 * 1024 * 1024;
const MAX_FILE_SIZE_VIDEO = 25 * 1024 * 1024;
const MAX_FILE_SIZE = MAX_FILE_SIZE_VIDEO; // kompatibel mit bestehendem Code

export default function BugReportModal({ open = false, onClose = () => {}, user = null }) {
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [attachmentWarning, setAttachmentWarning] = useState(null);
  const fileInputRef = useRef(null);

  const getDeviceInfo = useCallback(async () => {
    let deviceModel = "Unbekannt";
    let deviceOS = "Unbekannt";

    try {
      if (window.Capacitor && window.Capacitor.isNativePlatform?.()) {
        // Try @capacitor/device if available
        const Device = window.Capacitor.Plugins?.Device;
        if (Device) {
          const info = await Device.getInfo?.();
          deviceModel = info?.model || "Unbekannt";
          deviceOS = `${info?.platform || "unknown"} ${info?.osVersion || ""}`.trim();
        }
      }
    } catch (e) {
      // Fallback
    }

    if (deviceModel === "Unbekannt") {
      const ua = navigator.userAgent;
      if (/Android/i.test(ua)) deviceModel = "Android Device";
      else if (/iPhone|iPad/i.test(ua)) deviceModel = "iOS Device";
      else deviceModel = "Web Browser";
      deviceOS = ua.substring(0, 120);
    }

    return { deviceModel, deviceOS };
  }, []);

  const handleFileSelect = useCallback((e) => {
    setError(null);
    const selected = Array.from(e.target.files || []);
    const valid = [];
    for (const f of selected) {
      if (files.length + valid.length >= MAX_FILES) break;
      if (!ALLOWED_TYPES.includes(f.type)) {
        setError(`Datei "${f.name}" ist kein erlaubter Typ (nur JPG, PNG, MP4)`);
        continue;
      }
      const fMax = f.type.startsWith("video") ? MAX_FILE_SIZE_VIDEO : MAX_FILE_SIZE_IMAGE;
      if (f.size > fMax) {
        setError(`Datei "${f.name}" ist zu groß (max 50MB)`);
        continue;
      }
      valid.push(f);
    }
    setFiles(prev => [...prev, ...valid].slice(0, MAX_FILES));
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [files.length]);

  const removeFile = useCallback((idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const uploadFile = useCallback(async (file, reportId) => {
    const ext = file.name.split(".").pop();
    const path = `bug-reports/${reportId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("media")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (upErr) throw upErr;
    const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
    return { name: file.name, url: publicUrl, type: file.type, size: file.size };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!description.trim()) {
      setError("Bitte beschreibe den Fehler.");
      return;
    }
    if (!user?.id) {
      setError("Du musst angemeldet sein, um einen Fehler zu melden.");
      return;
    }

    setUploading(true);
    setError(null);
    setAttachmentWarning(null);

    try {
      const { deviceModel, deviceOS } = await getDeviceInfo();

      // Fallback (2026-08-19 v2): falls authProfile beim Öffnen des Modals noch
      // nicht vollständig geladen war (user.email fehlt) — Auth-Session als
      // zweite Quelle nachziehen, damit E-Mail nie leer bleibt wenn vermeidbar.
      let fallbackEmail = null;
      if (!user.email) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          fallbackEmail = authUser?.email || null;
        } catch (_) { /* nicht kritisch — bleibt null */ }
      }

      // 1. Insert bug report
      const { data: report, error: dbErr } = await supabase
        .from("bug_reports")
        .insert({
          user_id: user.id,
          username: user.display_name || user.username || user.email?.split("@")[0] || fallbackEmail?.split("@")[0] || "Unbekannt",
          email: user.email || fallbackEmail || null,
          device_model: deviceModel,
          device_os: deviceOS,
          app_version: APP_VERSION,
          description: description.trim(),
          status: "offen",
          category: "Fehlermeldung",
          source: "Bug-Käfer",
        })
        .select("id")
        .single();

      if (dbErr) throw dbErr;
      if (!report?.id) throw new Error("Keine Report-ID erhalten");

      // 2. Upload files (if any)
      const attachments = [];
      for (const f of files) {
        const att = await uploadFile(f, report.id);
        attachments.push(att);
      }

      // 3. Update report with attachments
      // BUGFIX (2026-08-19): RLS hatte keine UPDATE-Policy für bug_reports →
      // Update wurde lautlos verworfen (0 Zeilen, kein Fehler), Bilder landeten
      // nur in Storage, nie in der DB-Spalte → "Bilder nicht sichtbar" im SADB.
      // Policy bug_reports_update_own jetzt vorhanden. Trotzdem defensiv prüfen:
      // .select().maybeSingle() macht ein RLS-Silent-Fail sichtbar (data===null).
      if (attachments.length > 0) {
        const { data: updData, error: updErr } = await supabase
          .from("bug_reports")
          .update({ attachments })
          .eq("id", report.id)
          .select("id")
          .maybeSingle();
        if (updErr || !updData) {
          console.error("[BugReport] attachments update failed:", updErr || "kein Zeilen-Match (RLS?)");
          setAttachmentWarning(
            `Deine Beschreibung wurde gespeichert, aber ${attachments.length === 1 ? "das Bild/Video" : `${attachments.length} Bilder/Videos`} konnte${attachments.length === 1 ? "" : "n"} nicht angehängt werden. Bitte melde den Fehler kurz nochmal — am besten ohne Anhang oder mit Support kontaktieren.`
          );
        }
      }

      // 4. Log event
      await supabase.rpc("rpc_log_bug_report_event", {
        p_event_type: "bug_report_created",
        p_bug_report_id: report.id,
        p_actor_id: user.id,
        p_actor_type: "user",
        p_payload: { attachments_count: attachments.length },
      });

      setSubmitted(true);
    } catch (e) {
      console.error("[BugReport] Submit failed:", e);
      setError(e?.message || "Fehler beim Absenden. Bitte versuche es erneut.");
    } finally {
      setUploading(false);
    }
  }, [description, user, files, getDeviceInfo, uploadFile]);

  const handleClose = useCallback(() => {
    setDescription("");
    setFiles([]);
    setError(null);
    setAttachmentWarning(null);
    setSubmitted(false);
    setUploading(false);
    onClose();
  }, [onClose]);

  if (!open) return null;

  return createPortal(
    <div
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10500,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        animation: "huiFadeIn 0.2s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 500,
          maxHeight: "85vh",
          overflowY: "auto",
          background: "#FAF7F2",
          borderRadius: "20px 20px 0 0",
          padding: "20px 20px calc(88px + env(safe-area-inset-bottom, 0px))",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
          animation: "huiSlideUp 0.3s ease",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(91,107,125,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <BugIcon size={24} color="#5B6B7D" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a1a2e", fontFamily: "Inter, sans-serif" }}>
              Fehler melden
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(20,20,34,0.5)", fontFamily: "Inter, sans-serif", lineHeight: 1.4 }}>
              Hier kannst du alle Fehler hochladen, die du während der Testphase findest, damit sich ein HUI-Programmierer darum kümmern kann.
            </p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Schließen"
            style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "none", background: "rgba(0,0,0,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0, fontSize: 16, color: "#666",
            }}
          >✕</button>
        </div>

        {submitted ? (
          /* Danke-Meldung */
          <div style={{
            textAlign: "center",
            padding: "40px 20px",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(22,215,197,0.12)",
              margin: "0 auto 16px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M8 16 L14 22 L24 10" stroke="#16D7C5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#1a1a2e", fontFamily: "Inter, sans-serif", margin: "0 0 4px" }}>
              Danke! Ein HUI-Programmierer schaut sich deinen Fehler an.
            </p>
            {attachmentWarning && (
              <div style={{
                marginTop: 14, padding: "10px 14px", borderRadius: 10,
                background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)",
                fontSize: 12.5, color: "#8a5a10", fontFamily: "Inter, sans-serif",
                lineHeight: 1.5, textAlign: "left",
              }}>
                {attachmentWarning}
              </div>
            )}
            <button
              onClick={handleClose}
              style={{
                marginTop: 20, padding: "12px 32px", borderRadius: 22,
                background: "#16D7C5", border: "none", color: "#fff",
                fontSize: 14, fontWeight: 600, fontFamily: "Inter, sans-serif",
                cursor: "pointer",
              }}
            >Schließen</button>
          </div>
        ) : (
          /* Form */
          <>
            {/* A) Textfeld */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: "block", fontSize: 13, fontWeight: 600,
                color: "#1a1a2e", fontFamily: "Inter, sans-serif", marginBottom: 8,
              }}>
                Fehler beschreiben <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Was ist passiert? Wo? Wann? Schreibe so genau wie möglich…"
                rows={5}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12,
                  border: "1.5px solid rgba(0,0,0,0.10)",
                  background: "#fff",
                  fontSize: 14, fontFamily: "Inter, sans-serif",
                  color: "#1a1a2e", resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "#16D7C5"}
                onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.10)"}
              />
            </div>

            {/* B) Upload-Bereich */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: "block", fontSize: 13, fontWeight: 600,
                color: "#1a1a2e", fontFamily: "Inter, sans-serif", marginBottom: 8,
              }}>
                Bilder / Videos (optional, max. 10)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,video/mp4"
                multiple
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={files.length >= MAX_FILES}
                style={{
                  width: "100%", padding: "14px", borderRadius: 12,
                  border: "2px dashed rgba(0,0,0,0.15)",
                  background: "rgba(255,255,255,0.6)",
                  fontSize: 13, fontFamily: "Inter, sans-serif",
                  color: files.length >= MAX_FILES ? "rgba(20,20,34,0.3)" : "rgba(20,20,34,0.5)",
                  cursor: files.length >= MAX_FILES ? "not-allowed" : "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                }}
              >
                <span style={{ fontSize: 22 }}>📷</span>
                <span>{files.length >= MAX_FILES ? "Maximum erreicht" : "Screenshots/Videos hochladen"}</span>
              </button>

              {/* File List */}
              {files.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 12px", borderRadius: 10,
                      background: "rgba(255,255,255,0.8)",
                      border: "1px solid rgba(0,0,0,0.06)",
                    }}>
                      <span style={{ fontSize: 18 }}>{f.type.startsWith("video") ? "🎬" : "🖼️"}</span>
                      <span style={{
                        flex: 1, fontSize: 12, fontFamily: "Inter, sans-serif",
                        color: "rgba(20,20,34,0.7)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{f.name}</span>
                      <span style={{ fontSize: 11, color: "rgba(20,20,34,0.4)", fontFamily: "Inter, sans-serif" }}>
                        {(f.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <button
                        onClick={() => removeFile(i)}
                        style={{
                          width: 24, height: 24, borderRadius: "50%",
                          border: "none", background: "rgba(239,68,68,0.1)",
                          color: "#EF4444", fontSize: 12, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ fontSize: 11, color: "rgba(20,20,34,0.35)", fontFamily: "Inter, sans-serif", margin: "4px 0 0" }}>
                Bilder max 5MB · Videos max 25MB · {files.length}/{MAX_FILES}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                marginBottom: 12, padding: "10px 14px", borderRadius: 10,
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
                fontSize: 13, color: "#EF4444", fontFamily: "Inter, sans-serif",
              }}>
                {error}
              </div>
            )}

            {/* C) Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!description.trim() || uploading}
              style={{
                width: "100%", padding: "14px", borderRadius: 22,
                background: !description.trim() || uploading ? "rgba(91,107,125,0.2)" : "#16D7C5",
                border: "none", color: "#fff",
                fontSize: 15, fontWeight: 600, fontFamily: "Inter, sans-serif",
                cursor: !description.trim() || uploading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background 0.2s ease",
              }}
            >
              {uploading ? (
                <>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    animation: "hui-spin 0.7s linear infinite",
                  }} />
                  Wird gesendet…
                </>
              ) : "Fehler absenden"}
            </button>
          </>
        )}
      </div>
      <style>{`
        @keyframes huiSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}
