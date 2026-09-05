// src/lib/uploadUtils.js
// ══════════════════════════════════════════════════════════════════════
// UNIVERSELLER UPLOAD-STACK (2026-08-20, Michael-Vorgabe)
// "Bis zu 10 Bilder und videos Hochladen.. universelle in der app..
//  max 25mb upload für videos und 5mb für Bilder.. baue es überall
//  wo upload möglichkeiten sind ein."
//
// SSOT für: Datei-Limits, Validierung, Kompression, Upload-Logik.
// Wiederverwendet von ALLEN Upload-Stellen in der App — Wizards,
// Momente, Chat, Bug-Report, Support, Impact-Updates, etc.
// Erweitert bestehende compressImageForUpload() aus profileMedia.js
// (keine Duplikation — diese Datei ist die neue zentrale Schicht darüber).
// ══════════════════════════════════════════════════════════════════════
import { compressImageForUpload, JPEG_QUALITY, COVER_MAX_DIM } from "./profileMedia.js";
import { supabase } from "./supabaseClient.js";
import { uploadMediaVerified, toSafeUploadBody } from "./uploadBody.js";

// Re-Export: Alle Upload-Stellen im App-Code beziehen den sicheren Body +
// verifizierten Upload zentral aus uploadBody.js (UPLOAD-BODY-SSOT).
export { uploadMediaVerified, toSafeUploadBody };

// ── Universelle Konstanten (Michael-Vorgabe, SSOT) ───────────────────
export const UPLOAD_LIMITS = {
  MAX_FILES:       10,            // max 10 Bilder+Videos gesamt
  MAX_IMAGE_MB:     5,            // 5MB pro Bild
  MAX_VIDEO_MB:    25,            // 25MB pro Video
  IMAGE_MAX_DIM:  1600,           // Maximalauflösung nach Kompression
  IMAGE_QUALITY:   0.82,          // JPEG-Qualität nach Kompression
};

export const MAX_IMAGE_BYTES = UPLOAD_LIMITS.MAX_IMAGE_MB * 1024 * 1024;
export const MAX_VIDEO_BYTES = UPLOAD_LIMITS.MAX_VIDEO_MB * 1024 * 1024;

/**
 * Erkennt ob eine Datei ein Video ist (anhand MIME-Type).
 */
export function isVideoFile(file) {
  return file.type.startsWith("video/");
}

/**
 * Erkennt ob eine Datei ein Bild ist (anhand MIME-Type).
 */
export function isImageFile(file) {
  return file.type.startsWith("image/");
}

/**
 * Validiert eine einzelne Datei gegen die universellen Limits.
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateUploadFile(file) {
  if (!file) return { valid: false, error: "Keine Datei" };

  if (isVideoFile(file)) {
    if (file.size > MAX_VIDEO_BYTES) {
      return { valid: false, error: `Video zu groß (max ${UPLOAD_LIMITS.MAX_VIDEO_MB}MB)` };
    }
  } else if (isImageFile(file)) {
    if (file.size > MAX_IMAGE_BYTES) {
      // Bilder werden komprimiert — erst nach Kompression prüfen
      // (vorläufig valid, Kompression übernimmt compressImageForUpload)
    }
  } else {
    // Andere Dateitypen (PDF, etc.) — nur bei expliziter Freigabe
    return { valid: false, error: "Nur Bilder und Videos erlaubt" };
  }

  return { valid: true };
}

/**
 * Validiert eine Datei-Liste gegen die universellen Limits (inkl. Max-Count).
 * @param {FileList|File[]} rawFiles — vom Input-Element oder Drop
 * @param {number} alreadySelected — wie viele sind schon ausgewählt
 * @returns {{ accepted: File[], rejected: {file:File, error:string}[] }}
 */
export function validateUploadBatch(rawFiles, alreadySelected = 0) {
  const files = Array.from(rawFiles);
  const accepted = [];
  const rejected = [];

  for (const file of files) {
    if (alreadySelected + accepted.length >= UPLOAD_LIMITS.MAX_FILES) {
      rejected.push({ file, error: `Max ${UPLOAD_LIMITS.MAX_FILES} Dateien erreicht` });
      break;
    }
    const check = validateUploadFile(file);
    if (check.valid) {
      accepted.push(file);
    } else {
      rejected.push({ file, error: check.error });
    }
  }

  return { accepted, rejected };
}

/**
 * Erzeugt eine kurze Vorschau-URL für eine Datei (Blob-URL).
 * Wird für die Thumbnails im MultiUploadGrid verwendet.
 */
export function createPreviewUrl(file) {
  if (file.previewUrl) return file.previewUrl; // bereits zugewiesen
  return URL.createObjectURL(file);
}

/**
 * Lädt eine einzelne Datei in den Supabase Storage hoch.
 * - Bilder: werden vorher komprimiert (compressImageForUpload)
 * - Videos: direkt hochgeladen (keine Kompression)
 * @param {File} file
 * @param {string} userId — für den Storage-Pfad
 * @param {string} folder — Subfolder im "media"-Bucket (z.B. "works", "experiences")
 * @param {(progress:number)=>void} [onProgress] — 0..1
 * @returns {Promise<{url:string, type:"image"|"video", name:string}>}
 */
export async function uploadMediaFile(file, userId, folder, onProgress) {
  const isImg = isImageFile(file);
  const isVid = isVideoFile(file);

  if (!isImg && !isVid) {
    throw new Error("Nur Bilder und Videos erlaubt");
  }

  // Bild: komprimieren
  let uploadBlob = file;
  let contentType = file.type;
  let ext = (file.name.split(".").pop() || "").toLowerCase();

  if (isImg) {
    uploadBlob = await compressImageForUpload(file, UPLOAD_LIMITS.IMAGE_MAX_DIM, UPLOAD_LIMITS.IMAGE_QUALITY);
    const wasCompressed = uploadBlob !== file;
    if (wasCompressed) {
      contentType = "image/jpeg";
      ext = "jpg";
    }
    // Größen-Check NACH Kompression (Kompression kann unter 5MB bringen)
    if (uploadBlob.size > MAX_IMAGE_BYTES && !wasCompressed) {
      // Nochmal versuchen mit stärkerer Kompression
      uploadBlob = await compressImageForUpload(file, 800, 0.6);
      contentType = "image/jpeg";
      ext = "jpg";
    }
  }

  // Pfad: folder/userId/timestamp_rand.ext
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${folder}/${userId}/${ts}_${rand}.${ext || (isVid ? "mp4" : "jpg")}`;

  // Supabase Storage Upload mit Progress (falls unterstützt)
  // UPLOAD-BODY-SSOT (2026-09-05, Fall Karen Hagen): Blob-Body wurde auf
  // Android/CapacitorHttp teils als "{}" serialisiert (2-Byte-Datei im
  // Storage, still korrupt). uploadMediaVerified() konvertiert zu Uint8Array
  // (auf dem fehlerhaften Gerät per img_diag BEWIESEN) und verifiziert die
  // gespeicherte Größe. Wirft bei Fehlschlag — Caller verhalten sich wie bei
  // `throw error` vorher.
  const { publicUrl } = await uploadMediaVerified({
    path,
    file: uploadBlob,
    contentType,
    upsert: false,
  });

  return {
    url: publicUrl,
    type: isVid ? "video" : "image",
    name: file.name,
  };
}

/**
 * Lädt mehrere Dateien hoch (sequenziell, mit Progress pro Datei).
 * @param {File[]} files
 * @param {string} userId
 * @param {string} folder
 * @param {(fileIndex:number, total:number, file:File, result?:{url:string,type:string,name:string})=>void} [onFileDone]
 * @returns {Promise<{url:string,type:"image"|"video",name:string}[]>}
 */
export async function uploadMediaFiles(files, userId, folder, onFileDone) {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const result = await uploadMediaFile(files[i], userId, folder);
    results.push(result);
    onFileDone?.(i, files.length, files[i], result);
  }
  return results;
}

/**
 * Universelle Datei-Auswahl verarbeiten: validiert, erzeugt Preview-URLs,
 * gibt akzeptierte Files + Fehlermeldungen zurück.
 * @param {FileList|File[]} rawFiles
 * @param {number} alreadySelected
 * @returns {{ accepted: File[], rejected: {file:File,error:string}[] }}
 */
export function processFileSelection(rawFiles, alreadySelected = 0) {
  const { accepted, rejected } = validateUploadBatch(rawFiles, alreadySelected);

  // Preview-URLs vorab zuweisen (für sofortige Anzeige im Grid)
  accepted.forEach(f => {
    if (!f.previewUrl) f.previewUrl = URL.createObjectURL(f);
  });

  return { accepted, rejected };
}

// ══════════════════════════════════════════════════════════════════════
// VIDEO-THUMBNAIL-EXTRAKTION (2026-08-31, Michael-Vorgabe)
// "Video-Thumbnail-Auswahl bei ALLEN Upload-Flows mit Video (statt
//  generischem Play-Icon-Platzhalter)" — Momente, Werke, Erlebnisse,
// Talent-Angebote. Additive Erweiterung dieser SSOT-Datei, keine
// bestehende Funktion oben verändert.
//
// Ablauf (identisch in allen 4 Wizards via VideoThumbnailPicker.jsx):
//  1. loadVideoElement(source)   — source = File (neu ausgewählt) ODER
//     eine bereits hochgeladene Remote-URL (Edit-Modus, crossOrigin).
//  2. extractVideoFrame(videoEl, timeSec) — Frame bei Zeitpunkt t als
//     JPEG-Blob + DataURL (für Sofort-Vorschau ohne Upload-Roundtrip).
//  3. uploadThumbnail(blob, userId, folder) — Blob in denselben "media"
//     Bucket hochladen wie das Video selbst, Pfad thumbnails/{folder}/...
// ══════════════════════════════════════════════════════════════════════

/**
 * Lädt ein <video>-Element (unangehängt an den DOM) aus einer Datei oder
 * einer Remote-URL und wartet auf geladene Metadaten (Dauer, Abmessungen).
 * @param {File|string} source — File-Objekt (frisch ausgewählt) oder
 *   Remote-URL-String (Edit-Modus, bereits hochgeladenes Video).
 * @returns {Promise<HTMLVideoElement>}
 */
export function loadVideoElement(source) {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    // preload="auto" statt "metadata" — bei "metadata" puffert der Browser
    // NUR die Metadaten (Dauer/Abmessungen), nicht die tatsächlichen
    // Frame-Daten. Jeder anschließende Seek muss dann live nachladen/
    // dekodieren → das ist die Ursache des Ruckelns beim Scrubben.
    // "auto" lässt den Browser so viel wie möglich vorladen (Video ist
    // durch UPLOAD_LIMITS.MAX_VIDEO_MB=25MB ohnehin klein genug).
    v.preload = "auto";
    v.muted = true;
    v.playsInline = true;
    let objectUrl = null;
    // Remote-URL (Edit-Modus): crossOrigin nötig, damit canvas.toBlob()
    // im nächsten Schritt nicht mit "tainted canvas" (SecurityError)
    // abbricht. Supabase Storage 'media'-Bucket ist public + sendet
    // Access-Control-Allow-Origin — funktioniert daher mit anonymous.
    if (typeof source === "string") {
      v.crossOrigin = "anonymous";
      v.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      v.src = objectUrl;
    }

    let settled = false;
    const cleanup = () => {
      v.removeEventListener("canplay", onReady);
      v.removeEventListener("loadeddata", onReady);
      v.removeEventListener("error", onErr);
      clearTimeout(timeoutId);
    };
    // Referenz zum späteren Aufräumen des ObjectURL beim Unmount
    // (verhindert Memory-Leak) — Aufrufer kann v.__objectUrl auslesen.
    v.__objectUrl = objectUrl;

    // WICHTIG: nicht nur auf "loadedmetadata" warten (liefert nur
    // Dauer/Abmessungen), sondern auf "canplay" — das garantiert, dass
    // der Decoder tatsächlich einen ersten Frame bereitgestellt hat und
    // ein sofortiger seek()+drawImage() nicht auf ein leeres/graues Bild
    // trifft. "loadeddata" als Fallback für Browser, die "canplay" bei
    // sehr kurzen Videos verzögert/gar nicht feuern.
    const onReady = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(v);
    };
    const onErr = () => {
      if (settled) return;
      settled = true;
      cleanup();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error("Video konnte nicht geladen werden"));
    };
    // Timeout-Fallback (15s) — falls weder canplay noch loadeddata noch
    // error feuern (defekte/extrem langsame Quelle), statt die UI
    // endlos im Lade-Zustand hängen zu lassen.
    const timeoutId = setTimeout(() => {
      if (settled) return;
      // readyState>=1 heißt: zumindest Metadaten sind da → notfalls damit
      // weiterarbeiten statt komplett zu scheitern.
      if (v.readyState >= 1) { onReady(); } else { onErr(); }
    }, 15000);

    v.addEventListener("canplay", onReady, { once: true });
    v.addEventListener("loadeddata", onReady, { once: true });
    v.addEventListener("error", onErr, { once: true });
  });
}

/**
 * Gibt den für ein via loadVideoElement() erzeugtes <video>-Element
 * angelegten ObjectURL wieder frei (falls vorhanden). Muss beim Unmount
 * der Komponente bzw. bei Quellenwechsel aufgerufen werden, um Memory-
 * Leaks zu vermeiden (File-Quellen erzeugen einen ObjectURL, Remote-URLs
 * nicht).
 * @param {HTMLVideoElement} videoEl
 */
export function releaseVideoElement(videoEl) {
  if (!videoEl) return;
  try {
    videoEl.pause?.();
    videoEl.removeAttribute("src");
    videoEl.load?.();
  } catch { /* noop */ }
  if (videoEl.__objectUrl) {
    try { URL.revokeObjectURL(videoEl.__objectUrl); } catch { /* noop */ }
  }
}

/**
 * Extrahiert einen einzelnen Frame aus einem bereits geladenen <video>-
 * Element bei Zeitpunkt timeSec als JPEG (Blob + DataURL für Sofort-
 * Vorschau ohne Netzwerk-Roundtrip).
 * @param {HTMLVideoElement} videoEl — via loadVideoElement() geladen
 * @param {number} timeSec
 * @returns {Promise<{blob: Blob, dataUrl: string}>}
 */
export function extractVideoFrame(videoEl, timeSec) {
  return new Promise((resolve, reject) => {
    const clamped = Math.max(0, Math.min(timeSec, (videoEl.duration || timeSec) - 0.05));
    let done = false;

    const drawNow = () => {
      if (done) return;
      done = true;
      clearTimeout(safetyTimer);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = videoEl.videoWidth || 640;
        canvas.height = videoEl.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error("Frame-Extraktion fehlgeschlagen (kein Blob)")); return; }
          resolve({ blob, dataUrl });
        }, "image/jpeg", 0.82);
      } catch (err) {
        reject(err);
      }
    };

    // REGRESSION-FIX (2026-09-01, kritisch): Die vorherige Version wartete
    // bei unterstützten Browsern auf requestVideoFrameCallback (rVFC) bevor
    // gezeichnet wurde. Das hat auf echten Android-Geräten zu einem
    // ENDLOSEN Spinner geführt (nie irgendein Bild) — schlimmer als der
    // ursprüngliche Ruckel-Bug. Root Cause: loadVideoElement() hängt das
    // <video>-Element ABSICHTLICH NIE in den DOM ("unangehängt", siehe
    // Kommentar dort). rVFC ist an den Compositor/Präsentations-Zyklus
    // gebunden — bei einem nie angehängten Element präsentiert der
    // Compositor auf vielen Chromium/Android-WebView-Builds NIE einen
    // Frame → der rVFC-Callback feuert schlicht nie → drawNow() wird nie
    // aufgerufen → Promise löst sich nie auf → Spinner dreht ewig.
    // requestAnimationFrame() hängt dagegen am Dokument-Render-Loop, NICHT
    // am Video-Element — feuert zuverlässig unabhängig von DOM-Attachment.
    // Fix: rVFC komplett entfernt, nur noch doppelter rAF nach 'seeked'.
    const onSeeked = () => {
      videoEl.removeEventListener("seeked", onSeeked);
      requestAnimationFrame(() => requestAnimationFrame(drawNow));
    };
    videoEl.addEventListener("seeked", onSeeked);

    // Zusätzliches Sicherheitsnetz: falls 'seeked' aus irgendeinem Grund
    // (Edge Case, Geräte-/Codec-Eigenheit) NIE feuert, wird nach 2.5s
    // trotzdem gezeichnet — lieber ein eventuell leicht veralteter Frame
    // als ein für immer hängender Spinner, aus dem der Nutzer nicht
    // mehr herauskommt (Punkt 5 der Anforderung).
    const safetyTimer = setTimeout(() => {
      videoEl.removeEventListener("seeked", onSeeked);
      drawNow();
    }, 2500);

    try {
      videoEl.currentTime = clamped;
    } catch (err) {
      clearTimeout(safetyTimer);
      videoEl.removeEventListener("seeked", onSeeked);
      reject(err);
    }
  });
}

/**
 * Lädt einen extrahierten Video-Thumbnail-Frame (JPEG-Blob) in den
 * "media"-Bucket hoch — gleicher Bucket wie das Video, eigener
 * thumbnails/-Unterpfad zur klaren Trennung.
 * @param {Blob} blob — JPEG-Blob aus extractVideoFrame()
 * @param {string} userId
 * @param {string} folder — z.B. "beitraege", "works", "experiences", "talents"
 * @returns {Promise<string>} — public URL
 */
export async function uploadThumbnail(blob, userId, folder) {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `thumbnails/${folder}/${userId}/${ts}_${rand}.jpg`;

  // UPLOAD-BODY-SSOT (2026-09-05): siehe uploadMedia() — gleicher Fix-Pfad.
  const { publicUrl } = await uploadMediaVerified({
    path,
    file: blob,
    contentType: "image/jpeg",
    upsert: false,
  });
  return publicUrl;
}
