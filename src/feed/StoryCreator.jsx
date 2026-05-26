// src/feed/StoryCreator.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — STORY CREATOR (Phase 3)
//
// Minimal fullscreen flow:
//   Step 1: Pick image/video
//   Step 2: Add text (optional)
//   Step 3: Preview → Publish
//
// Saves ONLY to: stories table + stories-media bucket
// NEVER touches: beitraege, feed, FeedRouter
// ═══════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth }  from "../lib/AuthContext.jsx";

/* ── Tokens ─────────────────────────────────────────────────── */
const TEAL  = "#16D7C5";
const CORAL = "#FF8A6B";
const C = {
  bg:     "#0A0A12",
  panel:  "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.12)",
  white:  "#FFFFFF",
  ink3:   "rgba(255,255,255,0.45)",
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function StoryCreator({ onClose, onPublished }) {
  const { user } = useAuth();

  const [step,       setStep]       = useState(1); // 1=pick, 2=text, 3=preview
  const [mediaFile,  setMediaFile]  = useState(null);
  const [mediaPreview, setMediaPrev] = useState(null);
  const [mediaType,  setMediaType]  = useState("image");
  const [text,       setText]       = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error,      setError]      = useState(null);

  const fileRef  = useRef(null);
  const videoRef = useRef(null);

  /* ── File pick ───────────────────────────────────────────── */
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVid = file.type.startsWith("video/");
    setMediaType(isVid ? "video" : "image");
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPrev(url);
    setStep(2);
  }

  /* ── Publish ─────────────────────────────────────────────── */
  const handlePublish = useCallback(async () => {
    if (!user?.id) { setError("Nicht eingeloggt."); return; }
    setPublishing(true);
    setError(null);

    try {
      let media_url = null;

      // ── Upload media ───────────────────────────────────────
      if (mediaFile) {
        const ext  = mediaFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;

        // Try stories-media bucket first, fall back to media bucket
        let uploadError = null;
        let uploadResult = await supabase.storage
          .from("stories-media")
          .upload(path, mediaFile, { upsert: true });

        if (uploadResult.error) {
          // Bucket might not exist yet — fall back to media bucket
          console.warn("[HUI_STORY] stories-media bucket failed, falling back to media:", uploadResult.error.message);
          uploadResult = await supabase.storage
            .from("media")
            .upload(`stories/${path}`, mediaFile, { upsert: true });
          
          if (uploadResult.error) {
            uploadError = uploadResult.error;
          } else {
            const { data: pub } = supabase.storage.from("media").getPublicUrl(`stories/${path}`);
            media_url = pub?.publicUrl || null;
          }
        } else {
          const { data: pub } = supabase.storage.from("stories-media").getPublicUrl(path);
          media_url = pub?.publicUrl || null;
        }

        if (uploadError) {
          console.warn("[HUI_STORY] Upload failed — publishing without media:", uploadError.message);
          // Continue without media (text-only story)
        }
      }

      // ── Insert into stories table ─────────────────────────
      const { data, error: insertError } = await supabase
        .from("stories")
        .insert({
          user_id:    user.id,
          media_url,
          media_type: mediaType,
          text:       text.trim() || null,
          visibility: "public",
          is_active:  true,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select("id")
        .single();

      if (insertError) {
        setError("Fehler: " + insertError.message);
        console.error("[HUI_STORY] Insert error:", insertError);
        return;
      }

      console.log("[HUI_STORY] Published:", data?.id);

      // Refresh stories bar
      window.dispatchEvent(new Event("stories-refresh"));

      onPublished?.({ id: data?.id });
      onClose?.();

    } catch (e) {
      setError("Unbekannter Fehler: " + e?.message);
      console.error("[HUI_STORY] crash:", e);
    } finally {
      setPublishing(false);
    }
  }, [user?.id, mediaFile, mediaType, text, onClose, onPublished]);

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div style={{
      position:    "fixed",
      inset:       0,
      zIndex:      11000,
      background:  C.bg,
      display:     "flex",
      flexDirection: "column",
      fontFamily:  "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      animation:   "hui-story-creator-in 0.22s cubic-bezier(.22,1,.36,1) both",
      overflow:    "hidden",
    }}>
      <style>{`
        @keyframes hui-story-creator-in {
          from { opacity:0; transform:translateY(32px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      {/* ── Top bar ──────────────────────────────────────────── */}
      <div style={{
        display:     "flex",
        alignItems:  "center",
        padding:     "calc(env(safe-area-inset-top, 12px) + 8px) 16px 12px",
        borderBottom: `1px solid ${C.border}`,
        flexShrink:  0,
      }}>
        <button
          onClick={step > 1 ? () => setStep(s => s - 1) : onClose}
          style={{ background:"none", border:"none", color: C.ink3,
            fontSize: 22, cursor:"pointer", padding:"4px 8px 4px 0",
            touchAction:"manipulation" }}
        >
          {step > 1 ? "←" : "×"}
        </button>

        <div style={{
          flex: 1, textAlign: "center",
          color: C.white, fontWeight: 700, fontSize: 16,
        }}>
          {step === 1 ? "Story erstellen"
           : step === 2 ? "Text hinzufügen"
           : "Vorschau"}
        </div>

        {step === 3 && (
          <button
            onClick={handlePublish}
            disabled={publishing}
            style={{
              background:  publishing ? "rgba(22,215,197,0.4)" : TEAL,
              border:      "none",
              borderRadius: 20,
              padding:     "8px 18px",
              color:       "#fff",
              fontWeight:  700,
              fontSize:    14,
              cursor:      publishing ? "default" : "pointer",
              touchAction: "manipulation",
            }}
          >
            {publishing ? "…" : "Teilen"}
          </button>
        )}

        {step !== 3 && <div style={{ width: 60 }} />}
      </div>

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && (
        <div style={{
          padding: "10px 16px", background: "rgba(255,107,107,0.18)",
          color: "#FF6B6B", fontSize: 13, textAlign: "center",
        }}>
          {error}
        </div>
      )}

      {/* ── Step 1: Pick media ───────────────────────────────── */}
      {step === 1 && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 24,
          padding: 32,
        }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {/* Big pick button */}
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              width:        180,
              height:       180,
              borderRadius: "50%",
              border:       `2.5px dashed rgba(22,215,197,0.45)`,
              background:   "rgba(22,215,197,0.06)",
              display:      "flex",
              flexDirection: "column",
              alignItems:   "center",
              justifyContent: "center",
              gap:          12,
              cursor:       "pointer",
              touchAction:  "manipulation",
            }}
          >
            <span style={{ fontSize: 48 }}>📸</span>
            <span style={{ color: TEAL, fontSize: 14, fontWeight: 700 }}>
              Foto / Video
            </span>
          </button>

          <p style={{ color: C.ink3, fontSize: 13, textAlign: "center", maxWidth: 260 }}>
            Wähle ein Bild oder Video — deine Story ist 24h sichtbar
          </p>

          {/* Text-only story option */}
          <button
            onClick={() => { setMediaType("image"); setStep(2); }}
            style={{
              background: "none",
              border:     `1.5px solid ${C.border}`,
              borderRadius: 20,
              padding:    "8px 20px",
              color:      C.ink3,
              fontSize:   13,
              cursor:     "pointer",
              touchAction: "manipulation",
            }}
          >
            Nur Text
          </button>
        </div>
      )}

      {/* ── Step 2: Add text ─────────────────────────────────── */}
      {step === 2 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Media preview */}
          {mediaPreview && (
            <div style={{
              flex: 1, position: "relative", overflow: "hidden",
              minHeight: 200,
            }}>
              {mediaType === "video" ? (
                <video
                  ref={videoRef}
                  src={mediaPreview}
                  autoPlay muted playsInline loop
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <img
                  src={mediaPreview}
                  alt="Vorschau"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </div>
          )}

          {/* No media — gradient bg */}
          {!mediaPreview && (
            <div style={{
              flex: 1, minHeight: 180,
              background: `linear-gradient(135deg, ${TEAL}40 0%, ${CORAL}40 100%)`,
            }} />
          )}

          {/* Text input */}
          <div style={{
            padding:      "16px 16px 32px",
            borderTop:    `1px solid ${C.border}`,
            background:   C.bg,
            flexShrink:   0,
          }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Text zur Story hinzufügen (optional)…"
              maxLength={200}
              rows={3}
              style={{
                width:       "100%",
                background:  C.panel,
                border:      `1.5px solid ${C.border}`,
                borderRadius: 16,
                padding:     "12px 14px",
                color:       C.white,
                fontSize:    16,
                lineHeight:  1.5,
                resize:      "none",
                outline:     "none",
                fontFamily:  "inherit",
                boxSizing:   "box-sizing" === "border-box" ? "border-box" : "border-box",
              }}
            />
            <div style={{
              display: "flex", justifyContent: "space-between",
              marginTop: 8, alignItems: "center",
            }}>
              <span style={{ color: C.ink3, fontSize: 12 }}>
                {text.length}/200
              </span>
              <button
                onClick={() => setStep(3)}
                style={{
                  background:  `linear-gradient(135deg, ${TEAL}, ${CORAL})`,
                  border:      "none",
                  borderRadius: 20,
                  padding:     "10px 28px",
                  color:       "#fff",
                  fontWeight:  700,
                  fontSize:    15,
                  cursor:      "pointer",
                  touchAction: "manipulation",
                }}
              >
                Weiter →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Final preview ────────────────────────────── */}
      {step === 3 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Preview */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            {mediaPreview && mediaType !== "video" && (
              <img src={mediaPreview} alt="Story" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            )}
            {mediaPreview && mediaType === "video" && (
              <video src={mediaPreview} autoPlay muted playsInline loop
                style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            )}
            {!mediaPreview && (
              <div style={{
                width:"100%", height:"100%",
                background: `linear-gradient(135deg, ${TEAL}55 0%, ${CORAL}55 100%)`,
              }}/>
            )}

            {/* Text overlay preview */}
            {text.trim() && (
              <div style={{
                position:   "absolute",
                bottom:     80,
                left:       20, right: 20,
                padding:    "12px 16px",
                background: "rgba(10,10,18,0.64)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderRadius: 16,
                color:      C.white,
                fontSize:   16,
                textAlign:  "center",
                lineHeight: 1.5,
              }}>
                {text}
              </div>
            )}
          </div>

          {/* Confirm bar */}
          <div style={{
            padding:    "16px 16px calc(env(safe-area-inset-bottom, 16px) + 16px)",
            background: C.bg,
            borderTop:  `1px solid ${C.border}`,
            display:    "flex",
            gap:        12,
          }}>
            <button
              onClick={() => setStep(2)}
              style={{
                flex:        1,
                padding:     "13px",
                background:  C.panel,
                border:      `1.5px solid ${C.border}`,
                borderRadius: 20,
                color:       C.ink3,
                fontSize:    15,
                fontWeight:  600,
                cursor:      "pointer",
                touchAction: "manipulation",
              }}
            >
              Bearbeiten
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing}
              style={{
                flex:        2,
                padding:     "13px",
                background:  publishing
                  ? "rgba(22,215,197,0.4)"
                  : `linear-gradient(135deg, ${TEAL}, ${CORAL})`,
                border:      "none",
                borderRadius: 20,
                color:       "#fff",
                fontSize:    15,
                fontWeight:  700,
                cursor:      publishing ? "default" : "pointer",
                touchAction: "manipulation",
              }}
            >
              {publishing ? "Wird geteilt…" : "✦ Story teilen"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
