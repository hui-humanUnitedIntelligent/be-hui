// src/components/HuiMomentSheet.jsx — V3 FIXED
// FIXES:
//   1. Schreibt in `beitraege` (= Feed-Quelle), nicht in `stories`
//   2. Lädt Media in Supabase Storage → speichert public URL als `src`
//   3. Dispatcht `feed-refresh` Event nach erfolgreichem Share
//   4. Feed-Realtime-Subscription liegt auf `beitraege` → triggert automatisch
// Design: 100% identisch zu V2.
// ════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient.js";

const D = {
  teal:     "#0EC4B8",
  tealDeep: "#0A9E94",
  coral:    "#E8573A",
  ink:      "#1A3530",
  inkSoft:  "rgba(26,53,48,0.55)",
  inkFaint: "rgba(26,53,48,0.32)",
  sheet:    "rgba(252,253,252,0.97)",
};

const ACTIONS = [
  {
    id: "foto", icon: "📷", label: "Foto", sub: "Kamera öffnen",
    bgLight: "rgba(34,168,68,0.10)", iconBg: "rgba(34,168,68,0.14)",
  },
  {
    id: "video", icon: "🎥", label: "Video", sub: "Videokamera öffnen",
    bgLight: "rgba(232,87,58,0.09)", iconBg: "rgba(232,87,58,0.13)",
  },
  {
    id: "galerie", icon: "🖼️", label: "Galerie", sub: "Foto oder Video",
    bgLight: "rgba(142,68,200,0.09)", iconBg: "rgba(142,68,200,0.13)",
  },
  {
    id: "gedanke", icon: "✍️", label: "Gedanke", sub: "Text schreiben",
    bgLight: "rgba(224,152,40,0.09)", iconBg: "rgba(224,152,40,0.13)",
  },
];

const CSS = `
  @keyframes hms-overlay-in  { from{opacity:0} to{opacity:1} }
  @keyframes hms-overlay-out { from{opacity:1} to{opacity:0} }
  @keyframes hms-sheet-in  { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes hms-sheet-out { from{transform:translateY(0)} to{transform:translateY(100%)} }
  @keyframes hms-content-in {
    from { opacity:0; transform:translateY(10px) }
    to   { opacity:1; transform:translateY(0) }
  }
  @keyframes hms-card-in {
    from { opacity:0; transform:translateY(14px) scale(0.96) }
    to   { opacity:1; transform:translateY(0) scale(1) }
  }
  @keyframes hms-preview-in {
    from { opacity:0; transform:scale(0.97) }
    to   { opacity:1; transform:scale(1) }
  }
  @keyframes hms-success {
    0%   { transform:scale(0.7); opacity:0 }
    60%  { transform:scale(1.06) }
    100% { transform:scale(1); opacity:1 }
  }
  @keyframes hms-spin {
    from { transform:rotate(0deg) }
    to   { transform:rotate(360deg) }
  }

  .hms-card {
    cursor:pointer; touch-action:manipulation;
    -webkit-tap-highlight-color:transparent;
    transition:transform .15s cubic-bezier(.22,1,.36,1);
  }
  .hms-card:hover  { transform:translateY(-2px); }
  .hms-card:active { transform:scale(0.91) !important; opacity:0.80; }

  .hms-btn-ghost {
    cursor:pointer; touch-action:manipulation;
    -webkit-tap-highlight-color:transparent;
    transition:opacity .14s, transform .14s;
    background:none; border:none; font-family:inherit;
  }
  .hms-btn-ghost:active { opacity:0.42; transform:scale(0.94); }

  .hms-btn-primary {
    cursor:pointer; touch-action:manipulation;
    -webkit-tap-highlight-color:transparent;
    transition:transform .14s, opacity .14s, box-shadow .14s;
    border:none; font-family:inherit;
  }
  .hms-btn-primary:active { transform:scale(0.95); opacity:0.88; }

  .hms-textarea {
    resize:none; outline:none; font-family:inherit;
    transition:border-color .18s;
  }
  .hms-textarea:focus { border-color:rgba(14,196,184,0.55) !important; }
`;

function Spinner() {
  return (
    <div style={{
      width:22, height:22, borderRadius:"50%",
      border:"2.5px solid rgba(255,255,255,0.35)",
      borderTopColor:"white",
      animation:"hms-spin .7s linear infinite",
      display:"inline-block",
    }}/>
  );
}

function ActionCard({ action, onSelect, delay }) {
  return (
    <div
      className="hms-card"
      onClick={() => onSelect(action)}
      style={{
        flex:"1 1 0", minWidth:0,
        background:action.bgLight,
        borderRadius:20, padding:"22px 10px 18px",
        display:"flex", flexDirection:"column",
        alignItems:"center", gap:12,
        border:"1.5px solid rgba(26,53,48,0.07)",
        boxShadow:"0 2px 12px rgba(0,0,0,0.04)",
        animation:`hms-card-in .40s cubic-bezier(.34,1.56,.64,1) ${delay}ms both`,
        userSelect:"none",
      }}
    >
      <div style={{
        width:58, height:58, borderRadius:"50%",
        background:action.iconBg,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:26,
      }}>
        {action.icon}
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:13.5, fontWeight:800, color:D.ink,
          letterSpacing:"-0.02em", lineHeight:1.25, marginBottom:4 }}>
          {action.label}
        </div>
        <div style={{ fontSize:12, color:D.inkSoft, fontWeight:400 }}>
          {action.sub}
        </div>
      </div>
    </div>
  );
}

// ── Preview Step ──────────────────────────────────────────────────
function PreviewStep({ mediaURL, isVideo, text, setText, onShare, onDiscard, uploading }) {
  return (
    <div style={{ animation:"hms-preview-in .30s ease both" }}>

      {/* Media preview */}
      <div style={{
        width:"100%", borderRadius:20, overflow:"hidden",
        background:"#000", maxHeight:280, marginBottom:16,
        boxShadow:"0 4px 24px rgba(0,0,0,0.14)",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        {isVideo
          ? <video src={mediaURL} controls playsInline
              style={{ width:"100%", maxHeight:280, display:"block", objectFit:"contain" }}/>
          : <img src={mediaURL} alt="Vorschau"
              style={{ width:"100%", maxHeight:280, display:"block", objectFit:"contain" }}/>
        }
      </div>

      {/* Optional caption */}
      <textarea
        className="hms-textarea"
        value={text}
        onChange={e => setText(e.target.value.slice(0, 300))}
        placeholder="Was möchtest du zu diesem Moment teilen? (optional)"
        rows={3}
        style={{
          width:"100%", boxSizing:"border-box",
          border:"1.5px solid rgba(14,196,184,0.22)",
          borderRadius:16,
          background:"rgba(14,196,184,0.04)",
          padding:"14px 16px",
          fontSize:15, color:D.ink, lineHeight:1.65,
          marginBottom: text.length > 0 ? 6 : 16,
        }}
      />
      {text.length > 0 && (
        <div style={{ textAlign:"right", fontSize:11, color:D.inkFaint, marginBottom:14 }}>
          {text.length}/300
        </div>
      )}

      <button
        className="hms-btn-primary"
        onClick={onShare}
        disabled={uploading}
        style={{
          width:"100%", padding:"16px", borderRadius:18,
          background:`linear-gradient(135deg, ${D.teal} 0%, ${D.tealDeep} 100%)`,
          color:"white", fontSize:15.5, fontWeight:800,
          letterSpacing:"-0.02em",
          boxShadow:`0 6px 24px rgba(14,196,184,0.40)`,
          marginBottom:10,
          display:"flex", alignItems:"center", justifyContent:"center", gap:10,
          opacity: uploading ? 0.72 : 1,
        }}
      >
        {uploading ? <><Spinner/> Wird hochgeladen…</> : "HUI-Moment teilen"}
      </button>

      <button
        className="hms-btn-ghost"
        onClick={onDiscard}
        disabled={uploading}
        style={{
          width:"100%", padding:"13px",
          fontSize:14, color:D.inkSoft, fontWeight:500,
          display:"flex", alignItems:"center", justifyContent:"center", gap:6,
        }}
      >
        <span style={{ fontSize:15 }}>×</span>
        Verwerfen
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
export default function HuiMomentSheet({ visible, onClose }) {
  const [phase,     setPhase]     = useState("hidden");
  const [text,      setText]      = useState("");
  const [mediaURL,  setMediaURL]  = useState(null);
  const [isVideo,   setIsVideo]   = useState(false);
  const [fileObj,   setFileObj]   = useState(null);
  const [uploading, setUploading] = useState(false);

  const fotoRef     = useRef(null);
  const videoRef    = useRef(null);
  const galerieRef  = useRef(null);
  const textareaRef = useRef(null);

  // ── Lifecycle ────────────────────────────────────────────────
  useEffect(() => {
    if (visible  && phase === "hidden") { setPhase("open"); resetState(); }
    if (!visible && phase !== "hidden") setPhase("hidden");
  }, [visible]);

  function resetState() {
    setText("");
    setUploading(false);
    setMediaURL(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    setFileObj(null);
    setIsVideo(false);
  }

  const doClose = useCallback(() => {
    setPhase("closing");
    setTimeout(() => {
      resetState();
      setPhase("hidden");
      onClose?.();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (phase === "gedanke") setTimeout(() => textareaRef.current?.focus(), 120);
  }, [phase]);

  // ── Action tap ───────────────────────────────────────────────
  const handleAction = useCallback((action) => {
    if (action.id === "gedanke") { setPhase("gedanke"); return; }
    if (action.id === "foto")    { fotoRef.current?.click();    return; }
    if (action.id === "video")   { videoRef.current?.click();   return; }
    if (action.id === "galerie") { galerieRef.current?.click(); return; }
  }, []);

  // ── File chosen → preview (no auto-publish) ──────────────────
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const url = URL.createObjectURL(file);
    setMediaURL(url);
    setIsVideo(file.type.startsWith("video"));
    setFileObj(file);
    setText("");
    setPhase("preview");
  }, []);

  // ── Upload file to Supabase Storage → return public URL ──────
  async function uploadMedia(file, userId) {
    const ext  = file.name.split(".").pop() || (file.type.startsWith("video") ? "mp4" : "jpg");
    const path = `moments/${userId}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("beitraege")          // bucket name
      .upload(path, file, { upsert: false, contentType: file.type });

    if (upErr) {
      // Bucket might not exist — try "public" bucket as fallback
      const { error: upErr2 } = await supabase.storage
        .from("public")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr2) {
        console.warn("[HuiMoment] Storage upload failed:", upErr2.message);
        return null;
      }
      const { data: urlData2 } = supabase.storage.from("public").getPublicUrl(path);
      return urlData2?.publicUrl || null;
    }

    const { data: urlData } = supabase.storage.from("beitraege").getPublicUrl(path);
    return urlData?.publicUrl || null;
  }

  // ── Share → INSERT into beitraege (= Feed-Quelle) ────────────
  const doShare = useCallback(async () => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht eingeloggt");

      // 1. Media hochladen falls vorhanden
      let srcUrl = null;
      if (fileObj) {
        srcUrl = await uploadMedia(fileObj, user.id);
      }

      // 2. In `beitraege` schreiben — das ist die Feed-Quelle
      const type = fileObj
        ? (isVideo ? "video" : "foto")
        : "gedanke";

      const { error: insertErr } = await supabase
        .from("beitraege")
        .insert({
          user_id: user.id,
          type,
          src:     srcUrl,          // öffentliche Media-URL (null für Gedanke)
          caption: text.trim() || null,
          // created_at wird automatisch gesetzt
        });

      if (insertErr) {
        console.warn("[HuiMoment] Insert error:", insertErr.message);
      }

      // 3. Feed-Refresh auslösen (Realtime + Event)
      window.dispatchEvent(new CustomEvent("feed-refresh", { detail: { type } }));

    } catch (err) {
      console.warn("[HuiMoment] Share failed:", err.message);
    }

    // Cleanup object URL
    if (mediaURL) URL.revokeObjectURL(mediaURL);
    setMediaURL(null);
    setUploading(false);
    setPhase("done");
    setTimeout(() => doClose(), 1600);
  }, [fileObj, isVideo, text, mediaURL, doClose]);

  // ── Share gedanke (kein Medium) ──────────────────────────────
  const doShareGedanke = useCallback(async () => {
    if (!text.trim()) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("beitraege").insert({
          user_id: user.id,
          type:    "gedanke",
          src:     null,
          caption: text.trim(),
        });
        window.dispatchEvent(new CustomEvent("feed-refresh", { detail: { type: "gedanke" } }));
      }
    } catch (err) {
      console.warn("[HuiMoment] Gedanke share:", err.message);
    }
    setUploading(false);
    setPhase("done");
    setTimeout(() => doClose(), 1600);
  }, [text, doClose]);

  const doDiscard = useCallback(() => {
    if (mediaURL) URL.revokeObjectURL(mediaURL);
    setMediaURL(null);
    setFileObj(null);
    setIsVideo(false);
    setText("");
    setPhase("open");
  }, [mediaURL]);

  if (phase === "hidden") return null;
  const isClosing = phase === "closing";
  const isOpen    = phase === "open";
  const isPreview = phase === "preview";
  const isGedanke = phase === "gedanke";
  const isSharing = phase === "sharing";
  const isDone    = phase === "done";

  return (
    <>
      <style>{CSS}</style>

      {/* File inputs */}
      <input ref={fotoRef}    type="file" accept="image/*"        capture="environment" onChange={handleFileChange} style={{display:"none"}}/>
      <input ref={videoRef}   type="file" accept="video/*"        capture="environment" onChange={handleFileChange} style={{display:"none"}}/>
      <input ref={galerieRef} type="file" accept="image/*,video/*"                      onChange={handleFileChange} style={{display:"none"}}/>

      {/* Overlay */}
      <div
        onClick={doClose}
        style={{
          position:"fixed", inset:0, zIndex:9300,
          background:"rgba(15,30,26,0.30)",
          backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)",
          animation: isClosing ? "hms-overlay-out .28s ease both" : "hms-overlay-in .22s ease both",
        }}
      />

      {/* Sheet */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position:"fixed", bottom:0, left:0, right:0, zIndex:9301,
          background:D.sheet,
          borderRadius:"28px 28px 0 0",
          padding:`0 0 max(32px,calc(24px + env(safe-area-inset-bottom,0px)))`,
          boxShadow:"0 -8px 48px rgba(15,30,26,0.18), 0 -2px 12px rgba(15,30,26,0.08)",
          backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
          maxHeight:"92vh", overflowY:"auto",
          animation: isClosing
            ? "hms-sheet-out .28s cubic-bezier(.4,0,1,1) both"
            : "hms-sheet-in  .34s cubic-bezier(.22,1,.36,1) both",
        }}
      >
        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", paddingTop:14, paddingBottom:6 }}>
          <div style={{ width:38, height:4, borderRadius:99, background:"rgba(26,53,48,0.14)" }}/>
        </div>

        <div style={{ padding:"8px 20px 0" }}>

          {/* Header */}
          <div style={{ textAlign:"center", marginBottom:22, animation:"hms-content-in .34s ease .06s both" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:7 }}>
              <span style={{ fontSize:18, color:D.teal, filter:"drop-shadow(0 0 4px rgba(14,196,184,0.50))" }}>✦</span>
              <h2 style={{ fontSize:21, fontWeight:900, color:D.ink,
                letterSpacing:"-0.035em", margin:0, lineHeight:1.2 }}>
                HUI-Moment teilen
              </h2>
            </div>
            <p style={{ fontSize:14, color:D.inkSoft, margin:0, fontWeight:400, lineHeight:1.5 }}>
              {isPreview ? "Füge optional einen Gedanken hinzu." : "Teile einen echten Moment."}
            </p>
          </div>

          {/* DONE */}
          {isDone && (
            <div style={{
              display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", gap:14, padding:"24px 0 36px",
              animation:"hms-success .45s cubic-bezier(.34,1.56,.64,1) both",
            }}>
              <div style={{
                width:72, height:72, borderRadius:"50%",
                background:`linear-gradient(135deg, ${D.teal}, ${D.tealDeep})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:32, color:"white",
                boxShadow:`0 8px 28px rgba(14,196,184,0.40)`,
              }}>✓</div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:17, fontWeight:800, color:D.ink, marginBottom:4 }}>Moment geteilt!</div>
                <div style={{ fontSize:13.5, color:D.inkSoft }}>Erscheint jetzt in deinem Feed.</div>
            </div>
            </div>
          )}

          {/* PREVIEW */}
          {isPreview && (
            <PreviewStep
              mediaURL={mediaURL}
              isVideo={isVideo}
              text={text}
              setText={setText}
              onShare={doShare}
              onDiscard={doDiscard}
              uploading={uploading}
            />
          )}

          {/* GEDANKE */}
          {isGedanke && (
            <div style={{ animation:"hms-content-in .28s ease both" }}>
              <textarea
                ref={textareaRef}
                className="hms-textarea"
                value={text}
                onChange={e => setText(e.target.value.slice(0, 300))}
                placeholder={"Was möchtest du teilen?\n\nSchreibe einen echten Gedanken…"}
                rows={5}
                style={{
                  width:"100%", boxSizing:"border-box",
                  border:"1.5px solid rgba(14,196,184,0.28)",
                  borderRadius:18,
                  background:"rgba(14,196,184,0.05)",
                  padding:"16px 18px",
                  fontSize:15.5, color:D.ink, lineHeight:1.68,
                  fontStyle:"italic",
                  marginBottom: text.length > 0 ? 6 : 14,
                }}
              />
              {text.length > 0 && (
                <div style={{ textAlign:"right", fontSize:11, color:D.inkFaint, marginBottom:14 }}>
                  {text.length}/300
                </div>
              )}
              <button
                className="hms-btn-primary"
                onClick={doShareGedanke}
                disabled={!text.trim() || uploading}
                style={{
                  width:"100%", padding:"16px", borderRadius:18,
                  background: text.trim()
                    ? `linear-gradient(135deg, ${D.teal}, ${D.tealDeep})`
                    : "rgba(26,53,48,0.08)",
                  color: text.trim() ? "white" : D.inkFaint,
                  fontSize:15.5, fontWeight:800, letterSpacing:"-0.02em",
                  boxShadow: text.trim() ? `0 6px 24px rgba(14,196,184,0.38)` : "none",
                  transition:"all .20s ease", marginBottom:4,
                  display:"flex", alignItems:"center",
                  justifyContent:"center", gap:10,
                }}
              >
                {uploading ? <><Spinner/> Wird geteilt…</> : "HUI-Moment teilen"}
              </button>
              <button
                className="hms-btn-ghost"
                onClick={() => setPhase("open")}
                disabled={uploading}
                style={{
                  width:"100%", padding:"12px",
                  fontSize:14, color:D.inkSoft, fontWeight:500,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                }}
              >
                ← Zurück
              </button>
            </div>
          )}

          {/* ACTION CARDS */}
          {isOpen && (
            <>
              <div style={{
                display:"flex", flexWrap:"wrap", gap:10, marginBottom:22,
                animation:"hms-content-in .30s ease .12s both",
              }}>
                {ACTIONS.map((action, i) => (
                  <div key={action.id} style={{
                    flex: window.innerWidth >= 520 ? "1 1 0" : "1 1 calc(50% - 5px)",
                    minWidth:0,
                  }}>
                    <ActionCard action={action} onSelect={handleAction} delay={i * 55 + 100}/>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", justifyContent:"center", paddingBottom:4,
                animation:"hms-content-in .30s ease .34s both" }}>
                <button
                  className="hms-btn-ghost"
                  onClick={doClose}
                  style={{
                    fontSize:14.5, color:D.inkSoft, fontWeight:500,
                    padding:"8px 20px",
                    display:"flex", alignItems:"center", gap:7,
                  }}
                >
                  <span style={{ fontSize:16 }}>×</span>
                  Abbrechen
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
