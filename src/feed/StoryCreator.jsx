// src/feed/StoryCreator.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — STORY CREATOR (Phase 3 — Stable UI)
//
// FIXES:
//   - No capture="environment" (Safari/iPad compat)
//   - No opacity:0 animation that can freeze → content always visible
//   - Explicit height on root (100dvh fallback) so flex:1 works
//   - No overflow:hidden on root
//   - Step 1 always renders — never a black screen
//   - Separate "Galerie" and "Kamera" buttons (iOS best practice)
//
// Saves ONLY to: stories table
// NEVER touches: beitraege, feed, FeedRouter
// ═══════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth }  from "../lib/AuthContext.jsx";

/* ── Tokens ──────────────────────────────────────────────────── */
const TEAL  = "#16D7C5";
const CORAL = "#FF8A6B";
const C = {
  bg:     "#0D0D1A",
  panel:  "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.13)",
  white:  "#FFFFFF",
  dim:    "rgba(255,255,255,0.45)",
  dimmer: "rgba(255,255,255,0.25)",
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function StoryCreator({ onClose, onPublished }) {
  const { user } = useAuth();

  // step: "pick" | "text" | "preview"
  const [step,         setStep]       = useState("pick");
  const [mediaFile,    setMediaFile]  = useState(null);
  const [mediaPreview, setMediaPrev]  = useState(null);
  const [mediaType,    setMediaType]  = useState("image");
  const [caption,      setCaption]    = useState("");
  const [publishing,   setPublishing] = useState(false);
  const [error,        setError]      = useState(null);

  // Two separate file inputs — gallery and camera
  const galleryRef = useRef(null);
  const cameraRef  = useRef(null);

  /* ── File pick ────────────────────────────────────────────── */
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset the input so the same file can be re-selected
    e.target.value = "";
    const isVid = file.type.startsWith("video/");
    setMediaType(isVid ? "video" : "image");
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPrev(url);
    setStep("text");
  }

  /* ── Publish ──────────────────────────────────────────────── */
  const handlePublish = useCallback(async () => {
    if (!user?.id) { setError("Nicht eingeloggt."); return; }
    setPublishing(true);
    setError(null);

    try {
      let media_url = null;

      if (mediaFile) {
        const ext  = mediaFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;

        // Try stories-media first, fall back to media/stories/
        const { error: err1 } = await supabase.storage
          .from("stories-media")
          .upload(path, mediaFile, { upsert: true });

        if (!err1) {
          const { data: pub } = supabase.storage
            .from("stories-media").getPublicUrl(path);
          media_url = pub?.publicUrl || null;
        } else {
          console.warn("[HUI_STORY] stories-media failed:", err1.message);
          const { error: err2 } = await supabase.storage
            .from("media")
            .upload(`stories/${path}`, mediaFile, { upsert: true });
          if (!err2) {
            const { data: pub } = supabase.storage
              .from("media").getPublicUrl(`stories/${path}`);
            media_url = pub?.publicUrl || null;
          } else {
            console.warn("[HUI_STORY] media fallback also failed:", err2.message);
          }
        }
      }

      const { data, error: insertError } = await supabase
        .from("stories")
        .insert({
          user_id:         user.id,
          username:        user.user_metadata?.username
                           || user.user_metadata?.display_name
                           || user.email?.split("@")[0]
                           || "Human",
          avatar_url:      user.user_metadata?.avatar_url || null,
          media_url,
          media_type:      mediaType,
          caption:         caption.trim() || null,
          text_overlay:    caption.trim() || null,
          visibility:      "public",
          status:          "active",
          allow_comments:  true,
          allow_reactions: true,
          allow_sharing:   true,
          expires_at:      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select("id")
        .single();

      if (insertError) {
        setError("Fehler beim Speichern: " + insertError.message);
        console.error("[HUI_STORY] insert error:", insertError);
        return;
      }

      console.log("[HUI_STORY] published:", data?.id);
      window.dispatchEvent(new Event("stories-refresh"));
      onPublished?.({ id: data?.id });
      onClose?.();

    } catch (e) {
      setError("Fehler: " + (e?.message || "Unbekannt"));
      console.error("[HUI_STORY] crash:", e);
    } finally {
      setPublishing(false);
    }
  }, [user?.id, mediaFile, mediaType, caption, onClose, onPublished]);

  /* ── Root style — NO animation opacity, NO overflow:hidden ── */
  // iPad Safari fix: height:"100%" on position:fixed is unreliable.
  // Use window.innerHeight in px as explicit height.
  const vh = (typeof window !== "undefined" && window.innerHeight > 0)
    ? window.innerHeight
    : 812;
  const rootStyle = {
    position:       "fixed",
    top:            0,
    left:           0,
    width:          "100%",
    height:         vh + "px",
    minHeight:      vh + "px",
    zIndex:         11500,
    background:     C.bg,
    display:        "flex",
    flexDirection:  "column",
    fontFamily:     "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
    overflowX:      "hidden",
    overflowY:      "auto",
    WebkitOverflowScrolling: "touch",
  };

  /* ── Header ─────────────────────────────────────────────── */
  const title = step === "pick" ? "Story erstellen"
    : step === "text"    ? "Beschreibung"
    : "Vorschau";

  const backLabel = step === "pick" ? "×"
    : step === "text"    ? "←"
    : "←";

  function goBack() {
    if (step === "pick")    { onClose?.(); return; }
    if (step === "text")    { setStep("pick"); return; }
    if (step === "preview") { setStep("text"); return; }
  }

  /* ════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════ */
  return (
    <div style={rootStyle}>

      {/* ── Hidden file inputs (NO capture attr — gallery only) ── */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none",
                 width: 1, height: 1, top: -9999, left: -9999 }}
        aria-hidden="true"
        tabIndex={-1}
      />
      {/* Separate camera input — capture:environment, images only */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none",
                 width: 1, height: 1, top: -9999, left: -9999 }}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* ── Top bar ──────────────────────────────────────────── */}
      <div style={{
        display:      "flex",
        alignItems:   "center",
        padding:      "calc(env(safe-area-inset-top, 14px) + 10px) 16px 14px",
        borderBottom: `1px solid ${C.border}`,
        flexShrink:   0,
        background:   C.bg,
        // Explicit — so it never disappears
        minHeight:    56,
      }}>
        <button
          onClick={goBack}
          style={{
            background: "none", border: "none",
            color: C.dim, fontSize: 24,
            cursor: "pointer", padding: "4px 12px 4px 0",
            touchAction: "manipulation",
            lineHeight: 1,
            minWidth: 36,
            minHeight: 36,
            display: "flex", alignItems: "center",
          }}
        >
          {backLabel}
        </button>

        <div style={{
          flex: 1, textAlign: "center",
          color: C.white, fontWeight: 700, fontSize: 16,
          letterSpacing: 0.1,
        }}>
          {title}
        </div>

        {/* Publish button only on preview step */}
        {step === "preview" && (
          <button
            onClick={handlePublish}
            disabled={publishing}
            style={{
              background:   publishing
                ? "rgba(22,215,197,0.35)"
                : `linear-gradient(135deg, ${TEAL}, ${CORAL})`,
              border:       "none",
              borderRadius: 20,
              padding:      "8px 20px",
              color:        "#fff",
              fontWeight:   700,
              fontSize:     14,
              cursor:       publishing ? "default" : "pointer",
              touchAction:  "manipulation",
              opacity:      publishing ? 0.7 : 1,
            }}
          >
            {publishing ? "…" : "Teilen ✦"}
          </button>
        )}
        {step !== "preview" && <div style={{ minWidth: 60 }} />}
      </div>

      {/* ── Error banner ─────────────────────────────────────── */}
      {error && (
        <div style={{
          padding:    "10px 16px",
          background: "rgba(255,80,80,0.18)",
          color:      "#FF6B6B",
          fontSize:   13,
          textAlign:  "center",
          flexShrink: 0,
        }}>
          {error}
          <button
            onClick={() => setError(null)}
            style={{ background: "none", border: "none", color: "#FF6B6B",
              fontSize: 16, cursor: "pointer", marginLeft: 8, lineHeight: 1 }}
          >×</button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 1 — PICK MEDIA
          Always visible. No conditions that can hide it.
      ══════════════════════════════════════════════════════ */}
      {step === "pick" && (
        <div style={{
          flex:           "1 1 auto",
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          gap:            28,
          padding:        "32px 24px",
          minHeight:      "calc(100% - 80px)",
          boxSizing:      "border-box",
        }}>

          {/* Headline */}
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize:   28,
              marginBottom: 8,
              lineHeight: 1,
            }}>✦</div>
            <div style={{
              color:      C.white,
              fontSize:   20,
              fontWeight: 700,
              marginBottom: 6,
            }}>
              Dein Moment
            </div>
            <div style={{
              color:    C.dim,
              fontSize: 14,
              maxWidth: 260,
              margin:   "0 auto",
              lineHeight: 1.5,
            }}>
              Teile einen Schnappschuss — 24h sichtbar, dann weg.
            </div>
          </div>

          {/* Main CTA — Gallery */}
          <button
            onClick={() => galleryRef.current?.click()}
            style={{
              width:          "min(200px, 60vw)",
              height:         "min(200px, 60vw)",
              borderRadius:   "50%",
              border:         `2.5px dashed rgba(22,215,197,0.5)`,
              background:     "rgba(22,215,197,0.07)",
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              justifyContent: "center",
              gap:            12,
              cursor:         "pointer",
              touchAction:    "manipulation",
              transition:     "transform 0.14s ease, background 0.14s ease",
              color:          TEAL,
            }}
            onTouchStart={e => e.currentTarget.style.transform = "scale(0.95)"}
            onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
            onMouseDown={e => e.currentTarget.style.background = "rgba(22,215,197,0.14)"}
            onMouseUp={e => e.currentTarget.style.background = "rgba(22,215,197,0.07)"}
          >
            <span style={{ fontSize: 52, lineHeight: 1 }}>🖼</span>
            <span style={{
              fontSize:   14,
              fontWeight: 700,
              letterSpacing: 0.3,
            }}>
              Galerie öffnen
            </span>
          </button>

          {/* Secondary options row */}
          <div style={{
            display:    "flex",
            gap:        12,
            flexWrap:   "wrap",
            justifyContent: "center",
          }}>
            {/* Camera button */}
            <button
              onClick={() => cameraRef.current?.click()}
              style={{
                display:      "flex",
                alignItems:   "center",
                gap:          8,
                padding:      "12px 20px",
                background:   C.panel,
                border:       `1.5px solid ${C.border}`,
                borderRadius: 24,
                color:        C.white,
                fontSize:     14,
                fontWeight:   600,
                cursor:       "pointer",
                touchAction:  "manipulation",
              }}
            >
              <span>📷</span> Kamera
            </button>

            {/* Text-only */}
            <button
              onClick={() => setStep("text")}
              style={{
                display:      "flex",
                alignItems:   "center",
                gap:          8,
                padding:      "12px 20px",
                background:   C.panel,
                border:       `1.5px solid ${C.border}`,
                borderRadius: 24,
                color:        C.dim,
                fontSize:     14,
                fontWeight:   600,
                cursor:       "pointer",
                touchAction:  "manipulation",
              }}
            >
              <span>✏️</span> Nur Text
            </button>
          </div>

          {/* Fine print */}
          <p style={{
            color:     C.dimmer,
            fontSize:  12,
            textAlign: "center",
            maxWidth:  240,
            lineHeight: 1.4,
          }}>
            Bilder und Videos · max. 50 MB
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 2 — ADD TEXT / CAPTION
      ══════════════════════════════════════════════════════ */}
      {step === "text" && (
        <div style={{
          flex:          1,
          display:       "flex",
          flexDirection: "column",
          minHeight:     320,
        }}>
          {/* Media preview — only if media was picked */}
          {mediaPreview && (
            <div style={{
              flex:       "0 0 auto",
              height:     "min(45vh, 320px)",
              position:   "relative",
              overflow:   "hidden",
              background: "#000",
            }}>
              {mediaType === "video" ? (
                <video
                  src={mediaPreview}
                  autoPlay muted playsInline loop
                  style={{ width:"100%", height:"100%", objectFit:"cover" }}
                />
              ) : (
                <img
                  src={mediaPreview}
                  alt="Vorschau"
                  style={{ width:"100%", height:"100%", objectFit:"cover" }}
                />
              )}
              {/* Change media button */}
              <button
                onClick={() => galleryRef.current?.click()}
                style={{
                  position:     "absolute",
                  top:          12,
                  right:        12,
                  background:   "rgba(10,10,18,0.7)",
                  border:       `1px solid ${C.border}`,
                  borderRadius: 20,
                  padding:      "6px 14px",
                  color:        C.white,
                  fontSize:     13,
                  fontWeight:   600,
                  cursor:       "pointer",
                  touchAction:  "manipulation",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              >
                Ändern
              </button>
            </div>
          )}

          {/* No media selected — gradient placeholder */}
          {!mediaPreview && (
            <div style={{
              flex:       "0 0 auto",
              height:     "min(30vh, 220px)",
              background: `linear-gradient(135deg, rgba(22,215,197,0.15) 0%, rgba(255,138,107,0.15) 100%)`,
              display:    "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection:  "column",
              gap:        12,
              cursor:     "pointer",
            }}
            onClick={() => galleryRef.current?.click()}
            >
              <span style={{ fontSize: 40 }}>➕</span>
              <span style={{ color: C.dim, fontSize: 14 }}>Bild hinzufügen (optional)</span>
            </div>
          )}

          {/* Caption input */}
          <div style={{
            flex:       1,
            padding:    "16px 16px 0",
            display:    "flex",
            flexDirection: "column",
            gap:        12,
          }}>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Was möchtest du teilen? (optional)"
              maxLength={200}
              rows={4}
              autoFocus={false}
              style={{
                width:       "100%",
                background:  C.panel,
                border:      `1.5px solid ${C.border}`,
                borderRadius: 16,
                padding:     "14px 16px",
                color:       C.white,
                fontSize:    16,
                lineHeight:  1.55,
                resize:      "none",
                outline:     "none",
                fontFamily:  "inherit",
                boxSizing:   "border-box",
                touchAction: "auto",
              }}
            />
            <div style={{
              display:       "flex",
              justifyContent:"space-between",
              alignItems:    "center",
            }}>
              <span style={{ color: C.dimmer, fontSize: 12 }}>
                {caption.length}/200
              </span>
              <button
                onClick={() => setStep("preview")}
                style={{
                  background:   `linear-gradient(135deg, ${TEAL}, ${CORAL})`,
                  border:       "none",
                  borderRadius: 20,
                  padding:      "12px 32px",
                  color:        "#fff",
                  fontWeight:   700,
                  fontSize:     15,
                  cursor:       "pointer",
                  touchAction:  "manipulation",
                }}
              >
                Weiter →
              </button>
            </div>
          </div>

          {/* Safe area spacer */}
          <div style={{ height: "calc(env(safe-area-inset-bottom, 16px) + 16px)", flexShrink: 0 }} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 3 — PREVIEW + PUBLISH
      ══════════════════════════════════════════════════════ */}
      {step === "preview" && (
        <div style={{
          flex:          1,
          display:       "flex",
          flexDirection: "column",
          minHeight:     320,
        }}>
          {/* Full preview */}
          <div style={{
            flex:       1,
            position:   "relative",
            overflow:   "hidden",
            background: "#000",
            minHeight:  200,
          }}>
            {mediaPreview && mediaType !== "video" && (
              <img
                src={mediaPreview}
                alt="Story"
                style={{ width:"100%", height:"100%", objectFit:"cover" }}
              />
            )}
            {mediaPreview && mediaType === "video" && (
              <video
                src={mediaPreview}
                autoPlay muted playsInline loop
                style={{ width:"100%", height:"100%", objectFit:"cover" }}
              />
            )}
            {!mediaPreview && (
              <div style={{
                width:"100%", height:"100%", minHeight: 200,
                background: `linear-gradient(135deg, ${TEAL}44 0%, ${CORAL}44 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 48 }}>✦</span>
              </div>
            )}

            {/* Text overlay preview */}
            {caption.trim() && (
              <div style={{
                position:   "absolute",
                bottom:     20,
                left:       16,
                right:      16,
                padding:    "12px 16px",
                background: "rgba(10,10,18,0.68)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderRadius: 16,
                color:      C.white,
                fontSize:   16,
                lineHeight: 1.5,
                textAlign:  "center",
              }}>
                {caption}
              </div>
            )}
          </div>

          {/* Action bar */}
          <div style={{
            padding:    "16px 16px calc(env(safe-area-inset-bottom, 16px) + 16px)",
            background: C.bg,
            borderTop:  `1px solid ${C.border}`,
            display:    "flex",
            gap:        12,
            flexShrink: 0,
          }}>
            <button
              onClick={() => setStep("text")}
              style={{
                flex:         1,
                padding:      "14px",
                background:   C.panel,
                border:       `1.5px solid ${C.border}`,
                borderRadius: 20,
                color:        C.dim,
                fontSize:     15,
                fontWeight:   600,
                cursor:       "pointer",
                touchAction:  "manipulation",
              }}
            >
              Bearbeiten
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing}
              style={{
                flex:         2,
                padding:      "14px",
                background:   publishing
                  ? "rgba(22,215,197,0.38)"
                  : `linear-gradient(135deg, ${TEAL}, ${CORAL})`,
                border:       "none",
                borderRadius: 20,
                color:        "#fff",
                fontSize:     15,
                fontWeight:   700,
                cursor:       publishing ? "default" : "pointer",
                touchAction:  "manipulation",
                opacity:      publishing ? 0.7 : 1,
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
