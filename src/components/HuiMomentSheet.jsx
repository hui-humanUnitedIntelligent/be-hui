// src/components/HuiMomentSheet.jsx — V5 FINAL (2026-05-29)
// ════════════════════════════════════════════════════════════════
// ANALYSE (aus Supabase CSV bestätigt):
//   beitraege: id(uuid PK), user_id(uuid), src(text), type(text), caption(text), created_at
//   src war NOT NULL → Migration 040 macht es nullable
//   Storage: bucket 'media' existiert (public) — Pfad: beitraege/{userId}/{ts}.ext
//   RLS INSERT: auth.uid() = user_id
//
// V5 FIXES gegenüber V4:
//   - INSERT in 'beitraege' (nicht feed_posts)
//   - Upload → bucket 'media', Pfad beitraege/{userId}/{ts}.ext
//   - src=null für Gedanken (nach Migration 040 erlaubt)
//   - Verbose debug logs: Payload, Insert-Result, Fehlercode
//   - Error Banner mit konkreter Fehlermeldung
// ════════════════════════════════════════════════════════════════
import { HUIWarnIcon } from '../design/icons/HuiSystemIcons.jsx';
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "../hooks/useTranslation.js";
import { useKeyboardInset } from "../hooks/useKeyboardInset.js";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../lib/AuthContext.jsx";
import VideoThumbnailPicker from "./shared/VideoThumbnailPicker.jsx";
import { uploadThumbnail } from "../lib/uploadUtils.js";

const D = {
  teal:"#0EC4B8", tealDeep:"#0A9E94", coral:"#E8573A",
  ink:"#1A3530", inkSoft:"rgba(26,53,48,0.55)", inkFaint:"rgba(26,53,48,0.32)",
  sheet:"rgba(252,253,252,0.97)",
};

const ACTIONS = [
  { id:"foto",    icon:"📷", labelKey:"moment.foto",    subKey:"moment.fotoSub",      bgLight:"rgba(34,168,68,0.10)",  iconBg:"rgba(34,168,68,0.14)"  },
  { id:"video",   icon:"🎥", labelKey:"moment.video",   subKey:"moment.videoSub", bgLight:"rgba(232,87,58,0.09)",  iconBg:"rgba(232,87,58,0.13)"  },
  { id:"galerie", icon:"🖼️", labelKey:"moment.galerie", subKey:"moment.galerieSub",    bgLight:"rgba(142,68,200,0.09)", iconBg:"rgba(142,68,200,0.13)" },
  { id:"gedanke", icon:"✍️", labelKey:"moment.gedanke", subKey:"moment.gedankeSub",     bgLight:"rgba(224,152,40,0.09)", iconBg:"rgba(224,152,40,0.13)" },
];

const CSS = `
  @keyframes hms-overlay-in  { from{opacity:0}to{opacity:1} }
  @keyframes hms-overlay-out { from{opacity:1}to{opacity:0} }
  @keyframes hms-sheet-in  { from{transform:translateY(100%)}to{transform:translateY(0)} }
  @keyframes hms-sheet-out { from{transform:translateY(0)}to{transform:translateY(100%)} }
  @keyframes hms-content-in { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
  @keyframes hms-card-in    { from{opacity:0;transform:translateY(14px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes hms-preview-in { from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)} }
  @keyframes hms-success    { 0%{transform:scale(0.7);opacity:0}60%{transform:scale(1.06)}100%{transform:scale(1);opacity:1} }
  @keyframes hms-spin       { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
  @keyframes hms-shake      { 0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)} }

  .hms-card { cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;
    transition:transform .15s cubic-bezier(.22,1,.36,1); }
  .hms-card:hover  { transform:translateY(-2px); }
  .hms-card:active { transform:scale(0.91)!important;opacity:0.80; }
  .hms-btn-ghost { cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;
    transition:opacity .14s,transform .14s;background:none;border:none;font-family:inherit; }
  .hms-btn-ghost:active { opacity:0.42;transform:scale(0.94); }
  .hms-btn-primary { cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;
    transition:transform .14s,opacity .14s,box-shadow .14s;border:none;font-family:inherit; }
  .hms-btn-primary:active { transform:scale(0.95);opacity:0.88; }
  .hms-textarea { resize:none;outline:none;font-family:inherit;transition:border-color .18s; }
  .hms-textarea:focus { border-color:rgba(14,196,184,0.55)!important; }
`;

function Spinner() {
  return <div style={{ width:20,height:20,borderRadius:"50%",
    border:"2.5px solid rgba(255,255,255,0.35)",borderTopColor:"white",
    animation:"hms-spin .7s linear infinite",display:"inline-block" }}/>;
}

function ActionCard({ action, onSelect, delay }) {
  const { t } = useTranslation();
  return (
    <div className="hms-card" onClick={() => onSelect(action)} style={{
      flex:"1 1 0",minWidth:0,background:action.bgLight,borderRadius:20,
      padding:"22px 10px 18px",display:"flex",flexDirection:"column",
      alignItems:"center",gap:12,
      border:"1.5px solid rgba(26,53,48,0.07)",
      boxShadow:"0 2px 12px rgba(0,0,0,0.04)",
      animation:`hms-card-in .40s cubic-bezier(.34,1.56,.64,1) ${delay}ms both`,
      userSelect:"none",
    }} role="button" tabIndex={0}>
      <div style={{ width:58,height:58,borderRadius:"50%",background:action.iconBg,
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:26 }}>
        {action.icon}
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:13.5,fontWeight: 600,color:D.ink,letterSpacing:"-0.02em",
          lineHeight:1.25,marginBottom:4 }}>{t(action.labelKey)}</div>
        <div style={{ fontSize:12,color:D.inkSoft,fontWeight:400 }}>{t(action.subKey)}</div>
      </div>
    </div>
  );
}

function PreviewStep({ mediaURL, isVideo, text, setText, onShare, onDiscard, uploading, fileSize, fileObj, onThumbReady }) {
  const { t } = useTranslation();
  return (
    <div style={{ animation:"hms-preview-in .30s ease both" }}>
      <div style={{ width:"100%",borderRadius:20,background:"#000",
        maxHeight:280,marginBottom:16,boxShadow:"0 4px 24px rgba(0,0,0,0.14)",
        display:"flex",alignItems:"center",justifyContent:"center",
        WebkitMaskImage:"-webkit-radial-gradient(white,black)",
        overflow:"hidden" }}>
        {isVideo
          ? <div style={{ width:"100%", maxHeight:280 }}>
              <VideoThumbnailPicker source={fileObj} onFrameReady={onThumbReady} />
            </div>
          : <img loading="lazy" decoding="async" src={mediaURL} alt="Vorschau"
              style={{ width:"100%",maxHeight:280,display:"block",objectFit:"contain" }}/>
        }
      </div>
      <input className="hms-textarea" type="text" value={text}
        onChange={e => setText(e.target.value.slice(0,80))}
        placeholder={t("moment.titleOptional")}
        style={{ width:"100%",boxSizing:"border-box",
          border:"1.5px solid rgba(14,196,184,0.22)",borderRadius:14,
          background:"rgba(14,196,184,0.04)",padding:"12px 16px",
          fontSize:15,color:D.ink,outline:"none",
          marginBottom:text.length>0?6:16 }}/>
      {text.length > 0 && (
        <div style={{ textAlign:"right",fontSize:11,color:D.inkFaint,marginBottom:14 }}>
          {text.length}/80
        </div>
      )}
      {/* Dateigröße-Warnung */}
      {fileSize > 0 && (
        <div style={{
          marginBottom:12, padding:"8px 14px", borderRadius:12,
          background: fileSize > 50*1024*1024 ? "rgba(232,87,58,0.10)" : "rgba(14,196,184,0.07)",
          color: fileSize > 50*1024*1024 ? "#E8573A" : "rgba(26,53,48,0.55)",
          fontSize:12, display:"flex", alignItems:"center", gap:6,
        }}>
          {isVideo ? "🎥" : "📷"} {(fileSize/(1024*1024)).toFixed(1)} MB
          {fileSize > 100*1024*1024 && " · Zu groß — max. 100 MB"}
          {fileSize > 50*1024*1024 && fileSize <= 100*1024*1024 && " · Upload kann etwas dauern"}
        </div>
      )}
      <button className="hms-btn-primary" onClick={onShare} disabled={uploading || fileSize > 100*1024*1024} style={{
        width:"100%",padding:"16px",borderRadius:18,
        background:`linear-gradient(135deg,${D.teal} 0%,${D.tealDeep} 100%)`,
        color:"white",fontSize:15.5,fontWeight: 600,letterSpacing:"-0.02em",
        boxShadow:`0 6px 24px rgba(14,196,184,0.40)`,marginBottom:10,
        display:"flex",alignItems:"center",justifyContent:"center",gap:10,
        opacity:(uploading||fileSize>100*1024*1024)?0.72:1,
      }}>
        {uploading ? <><Spinner/> {t("moment.uploading")}</> : t("moment.shareTitle")}
      </button>
      <button className="hms-btn-ghost" onClick={onDiscard} disabled={uploading} style={{
        width:"100%",padding:"13px",fontSize:14,color:D.inkSoft,fontWeight:500,
        display:"flex",alignItems:"center",justifyContent:"center",gap:6,
      }}>
        <span style={{ fontSize:15 }}>×</span>{t("moment.discard")}
      </button>
    </div>
  );
}

// ── Upload zu 'media' bucket → Pfad: beitraege/{userId}/{ts}.ext ─────
// Max-Größen
const MAX_VIDEO_MB = 25;  // UNIVERSELLER UPLOAD (2026-08-20, Michael-Vorgabe)
const MAX_FOTO_MB  = 5;

async function uploadToMedia(file, userId) {
  const isVid = file.type.startsWith("video");

  // Größen-Check VOR Upload
  const maxMB  = isVid ? MAX_VIDEO_MB : MAX_FOTO_MB;
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxMB) {
    throw new Error(
      isVid
        ? `Video zu groß (${sizeMB.toFixed(1)} MB). Bitte max. ${maxMB} MB.`
        : `Bild zu groß (${sizeMB.toFixed(1)} MB). Bitte max. ${maxMB} MB.`
    );
  }

  // contentType sicherstellen
  const contentType = file.type || (isVid ? "video/mp4" : "image/jpeg");
  const ext  = file.name?.split(".").pop()?.toLowerCase() || (isVid ? "mp4" : "jpg");
  const path = `beitraege/${userId}/${Date.now()}.${ext}`;


  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, { upsert: false, contentType });

  if (error) {
    console.error("[HuiMoment] Upload FEHLER →", { code:error.statusCode, msg:error.message, error });
    // Bei Videos: KEIN graceful-Fallback — Nutzer muss es wissen
    if (isVid) {
      const msg = error.statusCode === 413
        ? "Video ist zu groß"
        : error.statusCode === 403
        ? "Keine Berechtigung"
        : `Upload fehlgeschlagen: ${error.message}`;
      throw new Error(msg);
    }
    return null; // bei Fotos: graceful
  }

  const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
  const url = urlData?.publicUrl || null;
  // MODERATION-HARD-BLOCK-001: path mitgeben für Storage-Cleanup bei Verstoss
  return { url, path };
}


// ── CONTENT-MODERATION-001 (2026-08-20): Automatische Erkennung ────
async function moderateContent({ userId, mediaUrl, mediaType, text }) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moderate-content`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          content_type: "moment",
          user_id: userId,
          media_url: mediaUrl || null,
          media_type: mediaType || null,
          text: text || null,
          device_info: { platform: navigator.userAgent, source: "HuiMomentSheet" },
        }),
      }
    );
    if (!resp.ok) { console.warn("[Moderation] Non-OK (fail-closed):", resp.status); return { is_flagged: true, is_blurred: true, flag_categories: ["moderation_unavailable"] }; }
    const json = await resp.json();
    return json;
  } catch (e) {
    console.warn("[Moderation] fehlgeschlagen (fail-closed):", e?.message);
    return { is_flagged: true, is_blurred: true, flag_categories: ["moderation_error"] };
  }
}

// ════════════════════════════════════════════════════════════════
export default function HuiMomentSheet({ visible, onClose, onSaved, visibilityScope = 'public' }) {
  const { t } = useTranslation();
  const { activeProfileId } = useAuth();
  const [phase,     setPhase]     = useState(visible ? "open" : "hidden");
  const [text,      setText]      = useState("");
  const [mediaURL,  setMediaURL]  = useState(null);
  const [isVideo,   setIsVideo]   = useState(false);
  const [fileObj,   setFileObj]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const [shareErr,  setShareErr]  = useState(null);
  const [momentSource, setMomentSource] = useState(null); // "foto"|"video"|"galerie"|"gedanke"
  const [thumbBlob, setThumbBlob] = useState(null); // VIDEO-THUMBNAIL-001: extrahierter Frame-Blob
  const [moderationNotice, setModerationNotice] = useState(null); // CONTENT-MODERATION-001
  const [moderationBlocked, setModerationBlocked] = useState(false); // MODERATION-HARD-BLOCK-001

  // KEYBOARD-FIX (2026-08-11): useKeyboardInset() MUSS aufgerufen werden, damit
  // der globale visualViewport/native-Insets-Listener initialisiert wird — sonst
  // bleibt --hui-keyboard-inset auf 0, wenn dieses Sheet die erste tastatur-
  // bewusste Oberfläche der Session ist (z.B. direkter Einstieg über "Mein
  // Bereich" → "Momente hinzufügen" ohne vorher Chat/Settings/Comments geöffnet
  // zu haben). Gleiches Muster wie CommentsSheet.jsx (Zeile 371).
  useKeyboardInset();

  const fotoRef     = useRef(null);
  const videoRef    = useRef(null);
  const galerieRef  = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (visible  && phase === "hidden") { setPhase("open"); resetState(); }
    if (!visible && phase !== "hidden") setPhase("hidden");
  }, [visible]);

  function resetState() {
    setText(""); setShareErr(null); setUploading(false); setModerationNotice(null); setModerationBlocked(false);
    setMediaURL(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    setFileObj(null); setIsVideo(false); setThumbBlob(null);
  }

  const doClose = useCallback(() => {
    setPhase("closing");
    setTimeout(() => { resetState(); setPhase("hidden"); onClose?.(); }, 300);
  }, [onClose]);

  useEffect(() => {
    if (phase === "gedanke") setTimeout(() => textareaRef.current?.focus(), 120);
  }, [phase]);

  const handleAction = useCallback((action) => {
    setMomentSource(action.id); // "foto"|"video"|"galerie"|"gedanke"
    if (action.id === "gedanke") { setPhase("gedanke"); return; }
    if (action.id === "foto")    { fotoRef.current?.click();    return; }
    if (action.id === "video")   { videoRef.current?.click();   return; }
    if (action.id === "galerie") { galerieRef.current?.click(); return; }
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setMediaURL(URL.createObjectURL(file));
    setIsVideo(file.type.startsWith("video"));
    setFileObj(file); setText(""); setShareErr(null);
    setPhase("preview");
  }, []);

  // ── Kern-Logik: in beitraege inserieren ───────────────────────
  async function _publishMoment({ src, storagePath, type, caption, thumbnailUrl }) {

    // 1. User authentifizieren
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user?.id) {
      throw new Error(t("moment.notLoggedIn"));
    }
    const userId = authData.user.id;

    // 1b. CONTENT-MODERATION-001: Prüfung VOR Insert
    let modResult = { is_flagged: false, is_blurred: false, flag_categories: [] };
    if (src || (caption && caption.trim())) {
      modResult = await moderateContent({
        userId,
        mediaUrl: src,
        mediaType: type === "video" ? "video" : (type === "foto" ? "image" : null),
        text: caption,
      });
    }

    // 1c. MODERATION-HARD-BLOCK-001: Verstoss → nicht posten, Media BEHALTEN als Beweis für Admin
    // FIX (2026-08-30): moderateContent() ist "fail-closed" gebaut — bei einem
    // TECHNISCHEN Fehler (Netzwerk/Timeout/Funktion nicht erreichbar) liefert
    // sie is_flagged=true mit flag_categories=['moderation_error'/'moderation_unavailable'],
    // OHNE dass tatsächlich ein content_moderation-Eintrag/Report erzeugt wurde.
    // Vorher zeigte der Client in DIESEM Fall trotzdem die "wurde gemeldet"-Meldung —
    // sachlich falsch (niemand wurde gemeldet) und unnötig beängstigend für den Nutzer.
    // Jetzt: technischer Fehlschlag → ehrliche "bitte erneut versuchen"-Meldung,
    // echter Regelverstoss (google_vision/keyword_filter/ocr_keyword_filter) → weiterhin
    // die "gemeldet"-Meldung.
    if (modResult.is_flagged) {
      const isTechnicalFailure =
        Array.isArray(modResult.flag_categories) &&
        modResult.flag_categories.length > 0 &&
        modResult.flag_categories.every(
          (cat) => cat === "moderation_error" || cat === "moderation_unavailable"
        );

      // WICHTIG: Storage-Datei wird NICHT gelöscht — der Admin braucht das Bild/Video
      // als Beweis im SADB "Inhaltsprüfung"-Dashboard (content_moderation.media_url).
      const blockErr = new Error(
        isTechnicalFailure ? t("moment.checkUnavailable") : t("moment.violationReported")
      );
      blockErr.isModerationBlock = !isTechnicalFailure;
      blockErr.isTechnicalFailure = isTechnicalFailure;
      throw blockErr;
    }

    // 2. Payload — user_id = aktives Profil (Org-Profil wenn aktiv, sonst auth.uid())
    // ORG-AUTHORSHIP-FIX (2026-08-30): Wenn ein Verein/Unternehmen aktiv ist,
    // wird der Moment unter dessen UUID gepostet, nicht unter Michaels persönlichem
    // Account. RLS erlaubt das über die owner_user_id-Policy (Migration 137).
    const postingId = activeProfileId || userId;
    const payload = {
      user_id:          postingId,
      src:              src     || null,
      type:             type    || "gedanke",
      moment_source:    momentSource || null,
      caption:          caption || null,
      visibility_scope: visibilityScope,
      moderation_flag:       false,
      moderation_blurred:    !!modResult.is_blurred,
      moderation_categories: modResult.flag_categories || [],
      // VIDEO-THUMBNAIL-001 (2026-08-31): extrahierter Frame statt nacktem
      // Play-Icon-Platzhalter -- nur bei Videos gesetzt, sonst null.
      thumbnail_url:    thumbnailUrl || null,
    };

    // 3. INSERT in beitraege
    const { data: result, error: insertErr } = await supabase
      .from("beitraege")
      .insert(payload)
      .select("id, created_at")
      .single();

    if (insertErr) {
      console.error("[HuiMoment] INSERT FEHLER →", {
        code:    insertErr.code,
        message: insertErr.message,
        details: insertErr.details,
        hint:    insertErr.hint,
      });
      throw new Error(`DB-Fehler (${insertErr.code}): ${insertErr.message}`);
    }

    window.dispatchEvent(new CustomEvent("feed-refresh", { detail: { id: result?.id } }));
    return result;
  }

  // ── Share Foto/Video ───────────────────────────────────────────
  const doShare = useCallback(async () => {
    setUploading(true); setShareErr(null);
    try {
      let src  = null;
      let storagePath = null;
      let type = "gedanke";
      let thumbnailUrl = null;

      if (fileObj) {
        type = isVideo ? "video" : "foto";
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id;
        // ORG-AUTHORSHIP: Storage-Pfad nutzt aktives Profil (Org-Profil wenn aktiv)
        const uploadId = activeProfileId || userId;
        if (uploadId) {
          const uploadResult = await uploadToMedia(fileObj, uploadId);
          src = uploadResult?.url || null;
          storagePath = uploadResult?.path || null;
          // VIDEO-THUMBNAIL-001 (2026-08-31): extrahierten Frame hochladen —
          // graceful (kein harter Fehler), falls Extraktion fehlschlug bleibt
          // thumbnail_url einfach null, Video bleibt trotzdem postbar.
          if (isVideo && thumbBlob) {
            try {
              thumbnailUrl = await uploadThumbnail(thumbBlob, uploadId, "beitraege");
            } catch (thumbErr) {
              console.warn("[HuiMoment] Thumbnail-Upload fehlgeschlagen (graceful):", thumbErr?.message);
            }
          }
        }
        // Upload-Fehler wirft jetzt bei Videos (kein graceful-Fallback mehr)
      }

      await _publishMoment({ src, storagePath, type, momentSource: momentSource || (isVideo ? "video" : "foto"), caption: text.trim(), thumbnailUrl });
      // AUTO-REFRESH-FIX (2026-09-01): Profil nach Posten aktualisieren
      onSaved?.();

      if (mediaURL) URL.revokeObjectURL(mediaURL);
      setMediaURL(null);
      setPhase("done");
      setTimeout(() => doClose(), 1600);
    } catch (err) {
      console.error("[HuiMoment] Share ERROR:", err.message);
      setShareErr(err.message);
      setUploading(false);
    }
  }, [fileObj, isVideo, text, mediaURL, doClose, thumbBlob]);

  // ── Share Gedanke ──────────────────────────────────────────────
  const doShareGedanke = useCallback(async () => {
    if (!text.trim()) return;
    setUploading(true); setShareErr(null);
    try {
      await _publishMoment({ src: null, type: "gedanke", momentSource: "gedanke", caption: text.trim() });
      // AUTO-REFRESH-FIX (2026-09-01)
      onSaved?.();
      setPhase("done");
      setTimeout(() => doClose(), 1600);
    } catch (err) {
      console.error("[HuiMoment] Gedanke ERROR:", err.message);
      setShareErr(err.message);
      setUploading(false);
    }
  }, [text, doClose]);

  const doDiscard = useCallback(() => {
    if (mediaURL) URL.revokeObjectURL(mediaURL);
    setMediaURL(null); setFileObj(null); setIsVideo(false);
    setText(""); setShareErr(null); setPhase("open");
  }, [mediaURL]);

  if (phase === "hidden") return null;
  const isClosing = phase === "closing";
  const isOpen    = phase === "open";
  const isPreview = phase === "preview";
  const isGedanke = phase === "gedanke";
  const isDone    = phase === "done";

  return (
    <>
      <style>{CSS}</style>
      <input ref={fotoRef}    type="file" accept="image/*"        capture="environment" onChange={handleFileChange} style={{display:"none"}}/>
      <input ref={videoRef}   type="file" accept="video/*"        capture="environment" onChange={handleFileChange} style={{display:"none"}}/>
      <input ref={galerieRef} type="file" accept="image/*,video/*"                      onChange={handleFileChange} style={{display:"none"}}/>

      {/* Overlay */}
      <div onClick={doClose} style={{
        position:"fixed",inset:0,zIndex:11000,
        background:"rgba(15,30,26,0.30)",
        backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)",
        animation:isClosing?"hms-overlay-out .28s ease both":"hms-overlay-in .22s ease both",
      }} role="button" tabIndex={0} />

      {/* Sheet */}
      <div onClick={e => e.stopPropagation()} style={{
        position:"fixed",bottom:"var(--hui-keyboard-inset, 0px)",left:0,right:0,zIndex:11100,
        background:D.sheet,borderRadius:"28px 28px 0 0",
        padding:`0 0 max(32px,calc(24px + max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px), 0px)))`,
        boxShadow:"0 -8px 48px rgba(15,30,26,0.18),0 -2px 12px rgba(15,30,26,0.08)",
        backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
        maxHeight:"calc(92dvh - var(--hui-keyboard-inset, 0px))",overflowY:"auto", WebkitOverflowScrolling:"touch",
        animation:isClosing
          ?"hms-sheet-out .28s cubic-bezier(.4,0,1,1) both"
          :"hms-sheet-in  .34s cubic-bezier(.22,1,.36,1) both",
      }}>

        {/* Handle */}
        <div style={{ display:"flex",justifyContent:"center",paddingTop:14,paddingBottom:6 }}>
          <div style={{ width:38,height:4,borderRadius:99,background:"rgba(26,53,48,0.14)" }}/>
        </div>

        <div style={{ padding:"8px 20px 0" }}>
          {/* Header */}
          <div style={{ textAlign:"center",marginBottom:22,animation:"hms-content-in .34s ease .06s both" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:7 }}>
              <span style={{ fontSize:18,color:D.teal,filter:"drop-shadow(0 0 4px rgba(14,196,184,0.50))" }}>✦</span>
              <h2 style={{ fontSize:21,fontWeight: 600,color:D.ink,letterSpacing:"-0.035em",margin:0,lineHeight:1.2 }}>
                {t("moment.shareTitle")}
              </h2>
            </div>
            <p style={{ fontSize:14,color:D.inkSoft,margin:0,fontWeight:400,lineHeight:1.5 }}>
              {isPreview ? t("moment.optionalThought") : t("moment.shareReal")}
            </p>
          </div>

          {/* Error Banner */}
          {shareErr && (
            <div style={{
              background:"rgba(232,87,58,0.10)",border:"1.5px solid rgba(232,87,58,0.30)",
              borderRadius:14,padding:"12px 16px",marginBottom:14,
              display:"flex",alignItems:"flex-start",gap:10,
              animation:"hms-shake .4s ease",
            }}>
              <HUIWarnIcon size={18} style={{flexShrink:0, color:"rgba(245,158,11,0.8)"}} />
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:13.5,fontWeight: 600,color:D.coral }}>{t("moment.shareError")}</div>
                <div style={{ fontSize:12,color:D.inkSoft,marginTop:2,wordBreak:"break-word" }}>{shareErr}</div>
              </div>
              <button className="hms-btn-ghost" onClick={() => setShareErr(null)}
                style={{ fontSize:18,color:D.inkSoft,padding:4,flexShrink:0 }}>×</button>
            </div>
          )}

          {/* DONE */}
          {isDone && (
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",
              justifyContent:"center",gap:14,padding:"24px 0 36px",
              animation:"hms-success .45s cubic-bezier(.34,1.56,.64,1) both" }}>
              <div style={{ width:72,height:72,borderRadius:"50%",
                background:`linear-gradient(135deg,${D.teal},${D.tealDeep})`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:32,color:"white",boxShadow:`0 8px 28px rgba(14,196,184,0.40)` }}>✓</div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:17,fontWeight: 600,color:D.ink,marginBottom:4 }}>{t("meinBereich.momentsShared")}!</div>
                <div style={{ fontSize:13.5,color:D.inkSoft }}>{t("moment.appearsInFeed")}</div>
              </div>
            </div>
          )}

          {/* PREVIEW */}
          {isPreview && (
            <PreviewStep mediaURL={mediaURL} isVideo={isVideo} fileSize={fileObj?.size || 0}
              text={text} setText={setText} fileObj={fileObj} onThumbReady={(blob) => setThumbBlob(blob)}
              onShare={doShare} onDiscard={doDiscard} uploading={uploading}/>
          )}

          {/* GEDANKE */}
          {isGedanke && (
            <div style={{ animation:"hms-content-in .28s ease both" }}>
              <textarea ref={textareaRef} className="hms-textarea"
                value={text} onChange={e => setText(e.target.value.slice(0,300))}
                placeholder={t("moment.thoughtPlaceholder")}
                rows={5} style={{ width:"100%",boxSizing:"border-box",
                  border:"1.5px solid rgba(14,196,184,0.28)",borderRadius:18,
                  background:"rgba(14,196,184,0.05)",padding:"16px 18px",
                  fontSize:15.5,color:D.ink,lineHeight:1.68,fontStyle:"italic",
                  marginBottom:text.length>0?6:14 }}/>
              {text.length > 0 && (
                <div style={{ textAlign:"right",fontSize:11,color:D.inkFaint,marginBottom:14 }}>
                  {text.length}/300
                </div>
              )}
              <button className="hms-btn-primary" onClick={doShareGedanke}
                disabled={!text.trim()||uploading} style={{
                  width:"100%",padding:"16px",borderRadius:18,
                  background:text.trim()?`linear-gradient(135deg,${D.teal},${D.tealDeep})`:"rgba(26,53,48,0.08)",
                  color:text.trim()?"white":D.inkFaint,
                  fontSize:15.5,fontWeight: 600,letterSpacing:"-0.02em",
                  boxShadow:text.trim()?`0 6px 24px rgba(14,196,184,0.38)`:"none",
                  transition:"all .20s ease",marginBottom:4,
                  display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                }}>
                {uploading?<><Spinner/> {t("moment.uploading")}</>:t("moment.shareTitle")}
              </button>
              <button className="hms-btn-ghost" onClick={() => setPhase("open")}
                disabled={uploading} style={{
                  width:"100%",padding:"12px",fontSize:14,color:D.inkSoft,fontWeight:500,
                  display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                }}>
                {t("common.back")}
              </button>
            </div>
          )}

          {/* ACTION CARDS */}
          {isOpen && (
            <>
              <div style={{ display:"flex",flexWrap:"wrap",gap:10,marginBottom:22,
                animation:"hms-content-in .30s ease .12s both" }}>
                {ACTIONS.map((action, i) => (
                  <div key={action.id} style={{
                    flex:window.innerWidth>=520?"1 1 0":"1 1 calc(50% - 5px)",minWidth:0,
                  }}>
                    <ActionCard action={action} onSelect={handleAction} delay={i*55+100}/>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex",justifyContent:"center",paddingBottom:4,
                animation:"hms-content-in .30s ease .34s both" }}>
                <button className="hms-btn-ghost" onClick={doClose} style={{
                  fontSize:14.5,color:D.inkSoft,fontWeight:500,
                  padding:"8px 20px",display:"flex",alignItems:"center",gap:7,
                }}>
                  <span style={{ fontSize:16 }}>×</span>{t("common.cancel")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
