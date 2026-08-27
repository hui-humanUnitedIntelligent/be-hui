// src/components/shared/MultiUploadGrid.jsx
// ══════════════════════════════════════════════════════════════════════
// UNIVERSELLES MULTI-UPLOAD-GRID (2026-08-20, Michael-Vorgabe)
// Zeigt bis zu 10 ausgewählte Bilder/Videos als Thumbnail-Grid mit
// Remove-Buttons + "Hinzufügen"-Kachel. Wird überall in der App
// eingesetzt wo Uploads stattfinden — Wizards, Momente, Bug-Report, etc.
//
// Design: 3-spaltiges Grid, quadratische Tiles, HUI-Design-System.
// Nutzt createPortal für Modals (aber als inline-Grid in Wizards).
// ══════════════════════════════════════════════════════════════════════
import React, { useRef, useCallback } from "react";
import { UPLOAD_LIMITS, isVideoFile, isImageFile, processFileSelection } from "../../lib/uploadUtils.js";

const TEAL = "#0EC4B8";
const CORAL = "#FF6F61";

/**
 * @param {File[]} files — aktuell ausgewählte Dateien (mit .previewUrl)
 * @param {(files:File[])=>void} onFilesChange — bei Hinzufügen/Entfernen
 * @param {string[]} [uploadingProgress] — optionale Progress-Indikatoren pro Datei
 * @param {boolean} [disabled]
 * @param {number} [columns] — Standard 3
 * @param {string} [accept] — Standard "image/*,video/*"
 * @param {string} [hint] — Text unter dem Grid (z.B. "Max 5MB Bilder, 25MB Videos")
 * @param {number} [maxFiles] — Standard UPLOAD_LIMITS.MAX_FILES (10)
 * @param {boolean} [allowDocuments] — falls true, accept wird um .pdf,.doc erweitert
 */
export default function MultiUploadGrid({
  files = [],
  onFilesChange = () => {},
  uploadingProgress = [],
  disabled = false,
  columns = 3,
  accept = "image/*,video/*",
  hint,
  maxFiles = UPLOAD_LIMITS.MAX_FILES,
  allowDocuments = false,
}) {
  const inputRef = useRef(null);

  const handleSelect = useCallback((e) => {
    if (disabled || files.length >= maxFiles) {
      e.target.value = "";
      return;
    }
    const fullAccept = allowDocuments ? `${accept},.pdf,.doc,.docx,.txt` : accept;
    const { accepted, rejected } = processFileSelection(e.target.files || [], files.length);

    if (rejected.length > 0) {
      // Zeige ersten Fehler kurz an (kann später durch Toast ersetzt werden)
      console.warn("[MultiUploadGrid] abgelehnt:", rejected.map(r => r.error));
    }

    const combined = [...files, ...accepted].slice(0, maxFiles);
    onFilesChange(combined);
    e.target.value = ""; // Reset für erneute Auswahl
  }, [files, disabled, maxFiles, accept, allowDocuments, onFilesChange]);

  const handleRemove = useCallback((idx) => {
    const file = files[idx];
    if (file?.previewUrl) {
      try { URL.revokeObjectURL(file.previewUrl); } catch {}
    }
    const next = files.filter((_, i) => i !== idx);
    onFilesChange(next);
  }, [files, onFilesChange]);

  const canAddMore = files.length < maxFiles && !disabled;
  const fullAccept = allowDocuments ? `${accept},.pdf,.doc,.docx,.txt` : accept;
  const defaultHint = hint || `Bilder max ${UPLOAD_LIMITS.MAX_IMAGE_MB}MB · Videos max ${UPLOAD_LIMITS.MAX_VIDEO_MB}MB · ${files.length}/${maxFiles}`;

  return (
    <div>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 8,
      }}>
        {files.map((file, idx) => {
          const isVid = isVideoFile(file);
          const isImg = isImageFile(file);
          const preview = file.previewUrl || (typeof URL !== "undefined" ? URL.createObjectURL(file) : "");
          const uploading = uploadingProgress[idx] != null;

          return (
            <div key={idx} style={{
              position: "relative",
              aspectRatio: "1",
              borderRadius: 12,
              overflow: "hidden",
              background: "#e8e4df",
              border: `1.5px solid ${uploading ? TEAL : "rgba(26,26,24,0.10)"}`,
            }}>
              {/* Preview */}
              {isVid ? (
                <video
                  src={preview}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  muted
                  preload="metadata"
                />
              ) : isImg ? (
                <img
                  src={preview}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  alt=""
                />
              ) : (
                <div style={{
                  width: "100%", height: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, color: "rgba(26,26,24,0.4)", textAlign: "center",
                  padding: 4,
                }}>
                  {file.name}
                </div>
              )}

              {/* Video-Badge */}
              {isVid && (
                <div style={{
                  position: "absolute", top: 4, left: 4,
                  background: "rgba(0,0,0,0.6)", color: "#fff",
                  fontSize: 9, fontWeight: 600, padding: "2px 6px",
                  borderRadius: 6, pointerEvents: "none",
                }}>VIDEO</div>
              )}

              {/* Upload-Progress */}
              {uploading && (
                <div style={{
                  position: "absolute", inset: 0,
                  background: "rgba(255,255,255,0.7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    border: "2.5px solid rgba(22,215,197,0.2)",
                    borderTopColor: TEAL,
                    animation: "huiSpin 0.7s linear infinite",
                  }}/>
                </div>
              )}

              {/* Remove-Button */}
              {!disabled && !uploading && (
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  style={{
                    position: "absolute", top: 4, right: 4,
                    width: 24, height: 24, borderRadius: "50%",
                    background: "rgba(0,0,0,0.55)", border: "none",
                    color: "#fff", fontSize: 14, fontWeight: 600,
                    cursor: "pointer", touchAction: "manipulation",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    lineHeight: 1,
                  }}
                >×</button>
              )}
            </div>
          );
        })}

        {/* "Hinzufügen"-Kachel */}
        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{
              aspectRatio: "1",
              borderRadius: 12,
              border: `1.5px dashed ${disabled ? "rgba(26,26,24,0.15)" : TEAL}`,
              background: disabled ? "transparent" : "rgba(22,215,197,0.04)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 4, cursor: disabled ? "not-allowed" : "pointer",
              touchAction: "manipulation", transition: "background 0.15s",
            }}
          >
            <span style={{ fontSize: 22, color: disabled ? "rgba(26,26,24,0.2)" : TEAL, lineHeight: 1 }}>+</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: disabled ? "rgba(26,26,24,0.2)" : TEAL }}>
              {files.length === 0 ? "Bilder/Videos" : "Mehr"}
            </span>
          </button>
        )}
      </div>

      {/* Hint */}
      <div style={{
        fontSize: 11, color: "rgba(26,26,46,0.45)",
        marginTop: 8, lineHeight: 1.4,
      }}>
        {defaultHint}
      </div>

      {/* Hidden Input */}
      <input
        ref={inputRef}
        type="file"
        accept={fullAccept}
        multiple
        style={{ display: "none" }}
        onChange={handleSelect}
      />

      {/* Spin-Animation */}
      <style>{`
        @keyframes huiSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
