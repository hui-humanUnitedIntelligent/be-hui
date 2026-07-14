// src/components/studio/ImpactUpdateSheet.jsx
// Bottom-Sheet zum Veröffentlichen von Projekt-Updates für Impact-Projekte.
// Nur für den Initiator (user_id == profile.id) eines bewilligten Projekts.
// ══════════════════════════════════════════════════════════════════════
import { HUINachrichtIcon } from '../../design/icons/HuiSystemIcons.jsx';
import React from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";

const UPDATE_TYPES = ["Meilenstein", "Fortschritt", "Neuigkeit", "Geplant", "Proof of Work"];

export default function ImpactUpdateSheet({ project, currentUser, onClose, onSuccess }) {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [updateType, setUpdateType] = React.useState("Neuigkeit");
  const [mediaUrls, setMediaUrls] = React.useState([]);
  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const uid = currentUser?.user_id || currentUser?.id || currentUser?.sub || null;

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Bitte einen Titel eingeben.");
      return;
    }
    if (!project?.id) {
      setError("Projekt-ID fehlt — Update kann nicht gespeichert werden.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { error: insertError } = await supabase
        .from("impact_project_updates")
        .insert({
          project_id: project.id,
          author_id: uid,
          title: title.trim(),
          content: content.trim() || null,
          update_type: updateType,
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        });
      if (insertError) {
        console.error("[ImpactUpdateSheet] insert error:", insertError);
        setError("Fehler beim Speichern: " + insertError.message);
        setSaving(false);
        return;
      }
      setSaving(false);
      onSuccess?.();
      onClose?.();
    } catch (e) {
      console.error("[ImpactUpdateSheet] submit error:", e);
      setError("Unerwarteter Fehler: " + e.message);
      setSaving(false);
    }
  };

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10490,
          background: "rgba(0,0,0,0.5)",
        }}
      />
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10500,
          background: "#FDFAF5",
          borderRadius: "24px 24px 0 0",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
        }}
      >
        {/* Handle */}
        <div
          style={{
            padding: "12px 0 4px",
            display: "flex",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 99,
              background: "rgba(0,0,0,0.15)",
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 20px 8px",
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, display:"flex", alignItems:"center", gap:6 }}><HUINachrichtIcon size={18}/>Projekt-Update</div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "none",
              background: "rgba(0,0,0,0.08)",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        {/* Projektname Subtitle */}
        <div
          style={{
            fontSize: 13,
            color: "#666",
            padding: "0 20px 12px",
            flexShrink: 0,
          }}
        >
          {project?.project_name}
        </div>

        {/* Scrollbarer Inhalt */}
        <div style={{ overflowY: "auto", flex: 1, padding: "0 20px 100px" }}>
          {/* Update-Typ Auswahl */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#444",
                marginBottom: 8,
              }}
            >
              TYP
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {UPDATE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setUpdateType(t)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 99,
                    border: "1.5px solid",
                    borderColor: updateType === t ? "#0DC4B5" : "rgba(0,0,0,0.15)",
                    background: updateType === t ? "#0DC4B515" : "transparent",
                    color: updateType === t ? "#0DC4B5" : "#666",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Titel */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#444",
                marginBottom: 8,
              }}
            >
              TITEL *
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Zaun ist fertiggestellt"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1.5px solid rgba(0,0,0,0.12)",
                fontSize: 14,
                fontFamily: "inherit",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          {/* Beschreibung */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#444",
                marginBottom: 8,
              }}
            >
              BESCHREIBUNG
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Beschreibe den Fortschritt..."
              rows={4}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1.5px solid rgba(0,0,0,0.12)",
                fontSize: 14,
                fontFamily: "inherit",
                boxSizing: "border-box",
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>

          {error && (
            <div style={{ color: "#e74c3c", fontSize: 13, marginBottom: 12 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer / Submit */}
        <div
          style={{
            padding: "12px 20px",
            paddingBottom: "max(12px,env(safe-area-inset-bottom))",
            borderTop: "1px solid rgba(0,0,0,0.08)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 16,
              border: "none",
              background: saving
                ? "rgba(13,196,181,0.5)"
                : "linear-gradient(135deg,#0DC4B5,#09A89D)",
              color: "white",
              fontSize: 15,
              fontWeight: 800,
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {saving ? "⏳ Wird gespeichert..." : "✅ Update veröffentlichen"}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
