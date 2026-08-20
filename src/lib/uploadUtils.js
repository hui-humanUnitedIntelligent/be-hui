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
  const { error } = await supabase.storage
    .from("media")
    .upload(path, uploadBlob, {
      contentType: contentType,
      upsert: false,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);

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
