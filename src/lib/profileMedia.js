// src/lib/profileMedia.js
// ══════════════════════════════════════════════════════════════════════
// HUI Profil-Media-Hilfsfunktionen — Sprint F.9C
// Single Source of Truth für:
//   • Bild-Upload (Avatar + Cover)
//   • Datenbank-Write nach Upload
//   • Fallback-Auflösung (location, displayName)
//
// UPLOAD-SPEED-041 (2026-08-06): Zwei Probleme behoben, die den Avatar-/
// Cover-Upload "sehr lange" wirken ließen:
//   1. KEIN Instant-Feedback — das UI zeigte nur einen Spinner und wartete
//      auf den KOMPLETTEN Roundtrip (Upload + DB-Write), bis das neue Bild
//      überhaupt sichtbar wurde.
//   2. KEINE Kompression — Handyfotos direkt aus der Kamera (oft 3-10 MB,
//      3000-4000px) wurden 1:1 hochgeladen, was auf Mobilfunknetzen lange
//      dauert.
// Fix: (1) Lokale Blob-URL wird SOFORT (0ms) an onSuccess gemeldet, bevor
// Kompression/Upload überhaupt starten → Bild ist augenblicklich sichtbar.
// (2) Bild wird client-seitig per Canvas auf sinnvolle Zielgröße verkleinert
// und als JPEG (Qualität 0.82) komprimiert, bevor es hochgeladen wird —
// reduziert die Upload-Größe typischerweise von mehreren MB auf 50-250KB.
// Sobald der echte Upload fertig ist, ersetzt die persistente CDN-URL die
// lokale Blob-URL (zweiter onSuccess-Aufruf) — für den Nutzer unsichtbar,
// da das Bild bereits angezeigt wird.
//
// Consumer:
//   • src/components/profile/ProfileHeader.jsx   (canonical)
//   • src/pages/MyBasisProfile.jsx               (MeinProfilHeader)
//   • Zukünftig: alle Hero/Header-Komponenten
// ══════════════════════════════════════════════════════════════════════

import { supabase } from "./supabaseClient.js";
import { clearQueryCache } from "./perfUtils.js";
import heic2any from "heic2any";

// ── Fallback-Assets ──────────────────────────────────────────────────
export const FB_COVER  = "/assets/brand/fallback-cover.svg";
export const FB_AVATAR = "/assets/brand/fallback-avatar.svg";

// ── Kompressions-Zielgrößen ──────────────────────────────────────────
// Avatar wird nur als kleiner Kreis (~150-300px, max. Retina 2x) angezeigt.
// Cover ist volle Breite bei 200px Höhe — 1600px reicht auch für Retina-Displays.
export const AVATAR_MAX_DIM = 640;
export const COVER_MAX_DIM  = 1600;
export const JPEG_QUALITY    = 0.82;
// Unterhalb dieser Dateigröße lohnt sich eine Neukompression nicht (Qualitätsverlust
// ohne nennenswerten Geschwindigkeitsgewinn) — Original wird 1:1 verwendet.
const SKIP_COMPRESSION_UNDER_BYTES = 300 * 1024; // 300 KB

// ── String-Safe Helper ───────────────────────────────────────────────
/**
 * Gibt val zurueck wenn nicht null/leer, sonst fallback.
 */
export function sv(val, fallback = "") {
  return (val != null && String(val).trim() !== "")
    ? String(val).trim()
    : fallback;
}

// ── Profil-Felder aufloesen ──────────────────────────────────────────
/**
 * Loesung Anzeigenamen: display_name → username → fallback
 */
export function resolveDisplayName(profile, fallback = "–") {
  return sv(profile?.display_name || profile?.username, fallback);
}

/**
 * Loesung Standort: location_final (Sprint F.3B) → location → fallback
 */
export function resolveLocation(profile, fallback = "") {
  return sv(profile?.location_final || profile?.location, fallback);
}

// ── Client-seitige Bildkompression ────────────────────────────────────
/**
 * Prueft ob eine Datei fuer eine Canvas-Kompression geeignet ist.
 * GIFs (Animation würde verloren gehen) und SVGs (Vektor, keine Rasterung
 * nötig) werden unverändert durchgereicht.
 */
// ── HEIC/HEIF-Konvertierung (2026-08-08) ─────────────────────────────
// WARUM: iPhone-Kameras speichern Fotos standardmaessig im HEIC-Format.
// Chromium/Android-WebView (also die gesamte HUI-App) kann HEIC NICHT
// dekodieren -- weder in <canvas> noch in <img src="...">. Bisher fiel
// die Kompression bei HEIC-Dateien lautlos auf das Original zurueck
// (isCompressible() liess "image/heic" durch, aber createImageBitmap/
// Image() konnten die Datei nicht laden), die Original-HEIC-Datei wurde
// unkonvertiert zu Supabase Storage hochgeladen -- und jedes <img> das
// diese URL laedt (Header/Cover, Avatar, Werk-/Erlebnis-Bilder) feuert
// sofort onError und faellt auf den Platzhalter zurueck. Symptom fuer
// den Nutzer: "Profilbild ist zu gross" (HEIC-Originale sind oft 3-8MB)
// "und der Header zeigt es nicht an" (Bild laedt schlicht nie).
// Fix: HEIC/HEIF wird VOR jeder anderen Verarbeitung client-seitig via
// heic2any (reines JS, keine native Abhaengigkeit) zu JPEG konvertiert
// -- danach durchlaeuft die Datei ganz normal die bestehende Resize-/
// Kompressions-Pipeline. Betrifft ALLE Consumer dieser Datei: Avatar,
// Cover/Header, Werk-Bilder (WerkWizard), Erlebnis-Bilder (ExperienceWizard).
function isHeic(file) {
  const type = (file?.type || "").toLowerCase();
  const name = (file?.name || "").toLowerCase();
  return type === "image/heic" || type === "image/heif"
    || type === "image/heic-sequence" || type === "image/heif-sequence"
    || name.endsWith(".heic") || name.endsWith(".heif");
}

async function convertHeicToJpeg(file) {
  try {
    const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    const blob = Array.isArray(result) ? result[0] : result;
    const baseName = (file.name || "image").replace(/\.(heic|heif)$/i, "");
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch (err) {
    console.warn("[profileMedia] HEIC-Konvertierung fehlgeschlagen, nutze Original:", err?.message);
    return file; // niemals werfen — Original durchreichen ist besser als ein kompletter Abbruch
  }
}

function isCompressible(file) {
  return !!file?.type
    && file.type.startsWith("image/")
    && file.type !== "image/gif"
    && file.type !== "image/svg+xml";
}

/**
 * Laedt eine Bilddatei als ImageBitmap/HTMLImageElement, bevorzugt
 * createImageBitmap (schneller, off-main-thread-faehig), mit Fallback
 * auf klassisches Image()-Element fuer aeltere Browser/WebViews.
 */
async function loadDrawableSource(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return { source: await createImageBitmap(file), revoke: null };
    } catch {
      // Fallback unten versuchen
    }
  }
  return new Promise((resolve, reject) => {
    const objUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload  = () => resolve({ source: img, revoke: () => URL.revokeObjectURL(objUrl) });
    img.onerror = (e) => { URL.revokeObjectURL(objUrl); reject(e); };
    img.src = objUrl;
  });
}

/**
 * Verkleinert + komprimiert ein Bild client-seitig auf maxDim (längste Seite)
 * als JPEG. Gibt bei jedem Fehler oder wenn die Kompression keinen Vorteil
 * bringt (z.B. Original bereits klein) die Original-Datei zurueck — niemals
 * ein kaputtes Ergebnis.
 */
export async function compressImageForUpload(file, maxDim, quality = JPEG_QUALITY) {
  // HEIC/HEIF IMMER zuerst konvertieren — unabhaengig von Dateigroesse,
  // da Chromium/Android diese Formate gar nicht darstellen kann.
  if (isHeic(file)) {
    file = await convertHeicToJpeg(file);
  }
  if (!isCompressible(file)) return file;
  if (file.size <= SKIP_COMPRESSION_UNDER_BYTES) return file;
  if (typeof document === "undefined") return file; // SSR-Safety

  let revoke = null;
  try {
    const loaded = await loadDrawableSource(file);
    const src = loaded.source;
    revoke = loaded.revoke;

    let width  = src.width  || src.naturalWidth;
    let height = src.height || src.naturalHeight;
    if (!width || !height) return file;

    if (width > maxDim || height > maxDim) {
      if (width > height) { height = Math.round(height * (maxDim / width)); width = maxDim; }
      else                { width  = Math.round(width  * (maxDim / height)); height = maxDim; }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(src, 0, 0, width, height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return file;
    // Nur verwenden wenn tatsaechlich eine Verbesserung erzielt wurde
    return blob.size < file.size ? blob : file;
  } catch (err) {
    console.warn("[profileMedia] Bildkompression fehlgeschlagen, nutze Original:", err?.message);
    return file;
  } finally {
    revoke?.();
  }
}

// ── Bild-Upload ──────────────────────────────────────────────────────
/**
 * Komprimiert (falls sinnvoll) und laedt ein Bild in den Supabase Storage
 * "media"-Bucket hoch. Gibt die oeffentliche URL zurueck.
 */
export async function uploadProfileImage(file, userId, folder, maxDim = COVER_MAX_DIM, quality = JPEG_QUALITY) {
  const uploadBlob = await compressImageForUpload(file, maxDim, quality);
  const wasCompressed = uploadBlob !== file;
  const ext  = wasCompressed ? "jpg" : (file.name.split(".").pop() || "jpg");
  const path = `${folder}/${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("media")
    .upload(path, uploadBlob, {
      contentType: wasCompressed ? "image/jpeg" : file.type,
      upsert: true,
    });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
  return publicUrl;
}

// ── kombinierter Upload + DB-Write ───────────────────────────────────
/**
 * Laedt Avatar hoch + schreibt avatar_url in profiles.
 * Vereinheitlicht aus ProfileHeader.jsx + MeinProfilHeader (MyBasisProfile.jsx).
 *
 * UPLOAD-SPEED-041: onSuccess wird ZWEIMAL aufgerufen —
 *   1. sofort (0ms) mit einer lokalen Blob-URL → instant sichtbar im UI
 *   2. nach Abschluss des echten Uploads mit der persistenten CDN-URL
 * Beide Aufrufe sind fuer bestehende Consumer (setLocalAvatar etc.) sicher,
 * da sie einfach den Anzeige-State ueberschreiben.
 *
 * @param {{ event, profileId, onSuccess, setUploading }} opts
 */
export async function handleAvatarUpload({ event, profileId, onSuccess, setUploading }) {
  const file = event.target.files?.[0];
  if (!file) return;

  // Sofort-Vorschau: lokale Blob-URL, 0ms Delay — noch bevor Kompression/
  // Upload ueberhaupt starten.
  let previewUrl = null;
  try {
    previewUrl = URL.createObjectURL(file);
    onSuccess?.(previewUrl);
  } catch { /* noop — faellt einfach auf normalen Flow zurueck */ }

  setUploading(true);
  try {
    let uid = profileId;
    if (!uid) {
      const { data: { user } } = await supabase.auth.getUser();
      uid = user?.id;
    }
    if (!uid) { console.warn("[profileMedia] Avatar upload: kein userId"); return; }
    const url = await uploadProfileImage(file, uid, "avatars", AVATAR_MAX_DIM, JPEG_QUALITY);
    const { error: dbErr } = await supabase.from("profiles")
      .update({ avatar_url: url })
      .eq("id", uid);
    if (dbErr) throw dbErr;
    // Cache invalidieren — damit reload() frische Daten holt
    clearQueryCache(`profile:${uid}`);
    onSuccess?.(url); // ersetzt lokale Blob-URL durch persistente CDN-URL
    if (previewUrl) URL.revokeObjectURL(previewUrl); // nur bei Erfolg freigeben
  } catch (err) {
    console.error("[HUI-AVATAR-ERROR]", err?.message, err?.statusCode, err?.status, JSON.stringify(err));
    // Bei Fehler: lokale Vorschau NICHT revoken — bleibt sichtbar bis Reload,
    // besser als ein kaputtes <img> zu zeigen.
  } finally {
    setUploading(false);
    event.target.value = "";
  }
}

/**
 * Laedt Cover hoch + schreibt header_img in profiles.
 * Identische Logik wie handleAvatarUpload — anderes DB-Feld + Ordner.
 *
 * @param {{ event, profileId, onSuccess, setUploading }} opts
 */
export async function handleCoverUpload({ event, profileId, onSuccess, setUploading }) {
  const file = event.target.files?.[0];
  if (!file) return;

  let previewUrl = null;
  try {
    previewUrl = URL.createObjectURL(file);
    onSuccess?.(previewUrl);
  } catch { /* noop */ }

  setUploading(true);
  try {
    let uid = profileId;
    if (!uid) {
      const { data: { user } } = await supabase.auth.getUser();
      uid = user?.id;
    }
    if (!uid) { console.warn("[profileMedia] Cover upload: kein userId"); return; }
    const url = await uploadProfileImage(file, uid, "covers", COVER_MAX_DIM, JPEG_QUALITY);
    const { error: dbErr } = await supabase.from("profiles")
      .update({ header_img: url })
      .eq("id", uid);
    if (dbErr) throw dbErr;
    // Cache invalidieren — damit reload() frische Daten holt
    clearQueryCache(`profile:${uid}`);
    onSuccess?.(url);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  } catch (err) {
    console.error("[profileMedia] Cover upload error:", err?.message, err?.statusCode || err?.status, JSON.stringify(err));
  } finally {
    setUploading(false);
    event.target.value = "";
  }
}
