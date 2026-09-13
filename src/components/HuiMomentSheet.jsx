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
import MultiUploadGrid from "./shared/MultiUploadGrid.jsx";
import { uploadThumbnail, UPLOAD_LIMITS, uploadMediaFile, processFileSelection, isVideoFile } from "../lib/uploadUtils.js";

const D = {
  teal:"#0EC4B8", tealDeep:"#0A9E94", coral:"#E8573A",
  ink:"#1A3530", inkSoft:"#55556B", inkFaint:"#808098",
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

// ── PREVIEW (MOMENT-MULTI-UPLOAD-001): 1-10 Dateien, jederzeit erweiterbar ──
// Foto/Video/Galerie landen alle in diesem Schritt. Das MultiUploadGrid
// (SSOT, sonst nur WerkWizard) zeigt alle gewählten Dateien als Kacheln mit
// Entfernen-Button + "Mehr"-Kachel zum Nachladen (z.B. 2. Kamera-Foto nach
// dem 1.). Ist das ERSTE Element ein Video, bleibt der VideoThumbnailPicker
// (Frame-Auswahl) darüber — exakt wie im Einzel-Flow vorher.
// Gedanke bleibt unverändert (nur Text, kein Medium).
function MediaPreviewStep({ files, onFilesChange, text, setText, onShare, onDiscard, uploading, accept, onThumbReady }) {
  const { t } = useTranslation();
  const firstIsVideo = files.length > 0 && isVideoFile(files[0]);
  const columns = files.length >= 4 ? 3 : 2;
  return (
    <div style={{ animation:"hms-preview-in .30s ease both" }}>
      {firstIsVideo && (
        <div style={{ width:"100%",borderRadius:20,background:"#000",
          maxHeight:280,marginBottom:16,boxShadow:"0 4px 24px rgba(0,0,0,0.14)",
          display:"flex",alignItems:"center",justifyContent:"center",
          WebkitMaskImage:"-webkit-radial-gradient(white,black)",
          overflow:"hidden" }}>
          <div style={{ width:"100%", maxHeight:280 }}>
            <VideoThumbnailPicker key={files[0]?.name + "_" + files[0]?.size} source={files[0]} onFrameReady={onThumbReady} />
          </div>
        </div>
      )}
      <div style={{ marginBottom:16 }}>
        <MultiUploadGrid files={files} onFilesChange={onFilesChange}
          disabled={uploading} accept={accept} columns={columns}/>
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
      {/* Dateigrößen werden bereits bei der Auswahl geprüft (processFileSelection,
          Videos max 50MB / Bilder max 10MB, SSOT uploadUtils.js) — hier nur noch
          der Gesamt-Hinweis des Grids (common.uploadHint). */}
      <button className="hms-btn-primary" onClick={onShare} disabled={uploading || files.length===0} style={{
        width:"100%",padding:"16px",borderRadius:18,
        background:`linear-gradient(135deg,${D.teal} 0%,${D.tealDeep} 100%)`,
        color:"white",fontSize:15.5,fontWeight: 600,letterSpacing:"-0.02em",
        boxShadow:`0 6px 24px rgba(14,196,184,0.40)`,marginBottom:10,
        display:"flex",alignItems:"center",justifyContent:"center",gap:10,
        opacity:(uploading||files.length===0)?0.72:1,
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

// MOMENT-MULTI-UPLOAD-001 (2026-09-13): Die lokale uploadToMedia() wurde
// GESTRICHEN und durch die SSOT uploadMediaFile() aus lib/uploadUtils.js
// ersetzt (Erweitern statt Duplizieren). Sie bietet ALLE Garantien, die die
// lokale Kopie hatte, plus mehr:
//   - UPLOAD-BODY-SSOT: uploadMediaVerified() → Uint8Array-Konvertierung +
//     gespeicherte-Bytes-Verifikation ("{}"-Korruption erkannt, Fall Karen
//     Hagen 05.09., siehe alte Doku unten — Verhalten unverändert: echter
//     Fehler → Share bricht ab, KEIN stiller Datenverlust)
//   - Größen-Check VOR Upload (Videos 50MB, Bilder 10MB, via
//     processFileSelection bereits bei der Auswahl abgelehnt)
//   - Bild-Kompression VOR Upload (compressImageForUpload — die lokale Kopie
//     lud Fotos unbehandelt hoch)
//   - Pfad beitraege/{userId}/{ts}_{rand}.ext — derselbe Bucket/Prefix wie vorher
// Storage-Cleanup bei Moderations-Verstoss bleibt über die publicUrl machbar
// (MODERATION-HARD-BLOCK-001: Dateien werden als Beweis NICHT gelöscht).


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
  // MOMENT-MULTI-UPLOAD-001: 1-10 Dateien (File[] mit .previewUrl) statt
  // einer einzelnen — Foto/Video/Galerie nutzen alle denselben Array-Flow.
  const [mediaFiles, setMediaFiles] = useState([]);
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
    setMediaFiles(prev => { prev.forEach(f => f.previewUrl && URL.revokeObjectURL(f.previewUrl)); return []; });
    setThumbBlob(null);
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

  // Foto/Video/Galerie-Input (alle mit `multiple`): Validierung + Preview-URLs
  // über die SSOT processFileSelection (Videos max 50MB, Bilder max 10MB,
  // max 10 Dateien gesamt — Limits kommen aus UPLOAD_LIMITS, nicht lokal).
  const handleFileChange = useCallback((e) => {
    const raw = e.target.files;
    if (!raw || raw.length === 0) return;
    e.target.value = "";
    const wasEmpty = mediaFiles.length === 0;
    const { accepted, rejected } = processFileSelection(raw, mediaFiles.length);
    if (accepted.length === 0) {
      if (rejected.length > 0) setShareErr(rejected[0].error);
      return;
    }
    setShareErr(null);
    if (wasEmpty) setText("");
    setMediaFiles(prev => [...prev, ...accepted].slice(0, UPLOAD_LIMITS.MAX_FILES));
    setPhase("preview");
  }, [mediaFiles]);

  // Grid-Änderungen (Entfernen im Preview): Wenn sich das ERSTE Element
  // ändert, gehört ein bereits extrahierter Video-Frame nicht mehr zum
  // ersten Medium → ThumbBlob verwerfen (sonst würde ein Frame eines
  // verschobenen Videos als Poster eines anderen Videos gesetzt).
  const handleGridFilesChange = useCallback((next) => {
    setThumbBlob(prev => (prev && next[0] !== mediaFiles[0]) ? null : prev);
    setMediaFiles(next);
  }, [mediaFiles]);

  // ── Kern-Logik: in beitraege inserieren ───────────────────────
  async function _publishMoment({ src, type, caption, thumbnailUrl, mediaUrls }) {

    // 1. User authentifizieren
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user?.id) {
      throw new Error(t("moment.notLoggedIn"));
    }
    const userId = authData.user.id;

    // 1b. CONTENT-MODERATION-001: Prüfung VOR Insert
    // FIX (2026-09-08, CONTENT-MODERATION-005): Root Cause von Michaels
    // "Verbindungsproblem beim Teilen"-Report (36.1MB-Video, direkt nach der
    // Upload-Limit-Erhöhung 25→50MB) — die Edge Function schickte bei Videos
    // die ROHEN Video-Bytes an Google Vision (eine BILD-API!) und base64-
    // kodierte sie per Spread-Operator (String.fromCharCode(...bytes)).
    // Bei >~25MB sprengt das den Call-Stack/die Laufzeit der Deno-Function →
    // Timeout/Crash → fail-closed "Verbindungsproblem". Fachlich war das
    // ohnehin nie korrekt (Vision prüft keine Videos als "Bild"). Fix: bei
    // Videos wird stattdessen der bereits extrahierte Thumbnail-Frame (echtes
    // kleines JPEG) moderiert — das prüft jetzt TATSÄCHLICH Bildinhalt, statt
    // nichts Sinnvolles zu tun. Fehlt der Thumbnail (Extraktion fehlgeschlagen,
    // graceful), wird nur der Text geprüft — KEINE Video-Rohdaten mehr an
    // Vision gesendet.
    const moderationMediaUrl = type === "video" ? (thumbnailUrl || null) : src;
    const moderationMediaType = type === "video"
      ? (thumbnailUrl ? "image" : null)
      : (type === "foto" ? "image" : null);
    let modResult = { is_flagged: false, is_blurred: false, flag_categories: [] };
    if (moderationMediaUrl || (caption && caption.trim())) {
      modResult = await moderateContent({
        userId,
        mediaUrl: moderationMediaUrl,
        mediaType: moderationMediaType,
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
      // MOMENT-MULTI-UPLOAD-001 (2026-09-13, Migration 138): ALLE Medien-URLs
      // in Anzeige-Reihenfolge — wird NUR bei >=2 Medien gesetzt (bei 1 Medium
      // bleibt null, dann sind src/type/thumbnail_url die einzige Quelle und
      // alle Alt-Konsumenten (Grid-Kacheln, die nur .src lesen) laufen ohne
      // jede Änderung weiter).
      media_urls:       mediaUrls || null,
    };

    // 3a. MEDIA-INTEGRITAETS-GUARD (2026-09-05, Fall Karen Hagen): Ein Moment
    // mit type "foto"/"video" OHNE src ist Datenmuell — genau das ist am
    // 05.09. passiert (Moment "Shooting..." mit src=null im Home-Feed, Bild
    // nie angekommen, Nutzer sah nur den Text). VOR dem Insert verhindern,
    // nicht hinterher reparieren.
    if ((type === "foto" || type === "video") && !src) {
      throw new Error("Bild konnte nicht hochgeladen werden — Moment nicht veroeffentlicht. Bitte erneut versuchen.");
    }

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

  // ── Share Foto/Video — MOMENT-MULTI-UPLOAD-001: 1-10 Dateien ──
  const doShare = useCallback(async () => {
    if (!mediaFiles || mediaFiles.length === 0) return;
    setUploading(true); setShareErr(null);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      // ORG-AUTHORSHIP: Storage-Pfad nutzt aktives Profil (Org-Profil wenn aktiv)
      const uploadId = activeProfileId || userId;
      if (!uploadId) throw new Error(t("moment.notLoggedIn"));

      // Sequenzieller Upload ALLER Dateien über die SSOT uploadMediaFile
      // (verifizierter Body + Bild-Kompression, Pfad beitraege/{uploadId}/…).
      // KEIN graceful-Fallback (Regel seit 2026-09-05): Ein Upload-Fehler
      // bricht den Share AB — kein Moment wird ohne Bilder gepostet.
      const results = [];
      for (const file of mediaFiles) {
        results.push(await uploadMediaFile(file, uploadId, "beitraege"));
      }
      const urls = results.map(r => r?.url).filter(Boolean);
      if (urls.length === 0) throw new Error("Upload fehlgeschlagen — bitte erneut versuchen.");

      const firstIsVideo = results[0]?.type === "video";
      const type = firstIsVideo ? "video" : "foto";
      const src  = urls[0];

      // VIDEO-THUMBNAIL-001 (2026-08-31): extrahierten Frame hochladen —
      // graceful (kein harter Fehler), falls Extraktion fehlschlug bleibt
      // thumbnail_url einfach null, Video bleibt trotzdem postbar.
      // Der Frame gehört zum ERSTEN Video im Array (siehe MediaPreviewStep);
      // unifiedNormalizer ordnet ihn dem ersten Video-Element als poster zu.
      let thumbnailUrl = null;
      if (firstIsVideo && thumbBlob) {
        try {
          thumbnailUrl = await uploadThumbnail(thumbBlob, uploadId, "beitraege");
        } catch (thumbErr) {
          console.warn("[HuiMoment] Thumbnail-Upload fehlgeschlagen (graceful):", thumbErr?.message);
        }
      }

      // media_urls NUR bei >=2 Medien (Migration 138) — sonst null, dann sind
      // src/type/thumbnail_url die einzige Quelle (Alt-Konsumenten-kompatibel).
      const mediaUrls = urls.length >= 2 ? urls : null;

      await _publishMoment({ src, type, momentSource: momentSource || (firstIsVideo ? "video" : "foto"), caption: text.trim(), thumbnailUrl, mediaUrls });
      // AUTO-REFRESH-FIX (2026-09-01): Profil nach Posten aktualisieren
      onSaved?.();

      mediaFiles.forEach(f => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); });
      setMediaFiles([]); setThumbBlob(null);
      setPhase("done");
      setTimeout(() => doClose(), 1600);
    } catch (err) {
      console.error("[HuiMoment] Share ERROR:", err.message);
      setShareErr(err.message);
      setUploading(false);
    }
  }, [mediaFiles, text, thumbBlob, activeProfileId, momentSource, doClose]);

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
    mediaFiles.forEach(f => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); });
    setMediaFiles([]); setThumbBlob(null);
    setText(""); setShareErr(null); setPhase("open");
  }, [mediaFiles]);

  if (phase === "hidden") return null;
  // Grid-"Mehr"-Kachel darf nur nachreichen, was der Einstieg erlaubt:
  // Foto → nur Bilder, Video → nur Videos, Galerie → beides.
  const gridAccept = momentSource === "foto" ? "image/*"
    : momentSource === "video" ? "video/*"
    : "image/*,video/*";
  const isClosing = phase === "closing";
  const isOpen    = phase === "open";
  const isPreview = phase === "preview";
  const isGedanke = phase === "gedanke";
  const isDone    = phase === "done";

  return (
    <>
      <style>{CSS}</style>
      {/* multiple seit MOMENT-MULTI-UPLOAD-001: Foto/Video/Galerie nehmen
          mehrere Dateien an; die Kamera (capture) liefert pro Durchlauf mind.
          1 Foto — weitere lassen sich im Preview über die Mehr-Kachel des
          MultiUploadGrid nachziehen (jeder Tap = eine weitere Aufnahme). */}
      <input ref={fotoRef}    type="file" accept="image/*"        capture="environment" multiple onChange={handleFileChange} style={{display:"none"}}/>
      <input ref={videoRef}   type="file" accept="video/*"        capture="environment" multiple onChange={handleFileChange} style={{display:"none"}}/>
      <input ref={galerieRef} type="file" accept="image/*,video/*"                                  multiple onChange={handleFileChange} style={{display:"none"}}/>

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

          {/* PREVIEW — 1-10 Medien, jederzeit erweiterbar */}
          {isPreview && (
            <MediaPreviewStep files={mediaFiles} onFilesChange={handleGridFilesChange}
              text={text} setText={setText} accept={gridAccept}
              onThumbReady={(blob) => setThumbBlob(blob)}
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
