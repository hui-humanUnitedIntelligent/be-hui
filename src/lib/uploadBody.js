// src/lib/uploadBody.js
// ══════════════════════════════════════════════════════════════════════
// UPLOAD-BODY-SSOT — CapacitorHttp-sicherer Storage-Upload (2026-09-05)
//
// ROOT CAUSE (bewiesen, Fall "Karen Hagen", v2.1.541/542):
// CapacitorHttp (aktiver nativer fetch-Interceptor, capacitor.config.json)
// kann Blob-Bodies auf manchen Android-Geräten NICHT übertragen. Der Body
// wird dabei als JSON serialisiert: JSON.stringify(new Blob()) === "{}"
// → Storage empfängt und speichert die 2-Byte-Datei "{}" als gültiges
// "JPEG" (HTTP 200, kein Fehler!) → DB-Write mit scheinbar valider CDN-URL
// → <img> kann "{}" nie dekodieren → Avatar zeigt für immer den Platzhalter
// (Karens Fall: avatars/b8a69c4e…/1788534631421.jpg, Inhalt hexdump "{}",
// 2 Bytes).
//
// BEWEIS-Lage (IMG-DIAG, 04.09.2026, genau auf dem fehlerhaften Gerät):
//   • Blob-Body  → "{}" (2 Bytes)          ← kaputt auf Karens Gerät
//   • Uint8Array → 212-Byte-echtes JPEG    ← FUNKTIONIERT auf Karens Gerät
//     (img_diag p5, Objekt diag_1788529163521.jpg, byte-genau verifiziert)
// Uint8Array ist damit der EINZIG geräte-proven sichere Body-Typ — nicht
// raten, sondern exakt den belegten Pfad nutzen.
//
// VERIFIZIERUNG (Defense-in-Depth für unbekannte künftige Geräte):
// uploadMediaVerified() prüft nach dem Upload via storage.list() die
// tatsächliche Größe des gespeicherten Objekts (JSON-Metadaten, kein
// CORS-Header-Problem — content-length ist bei Supabase public URLs
// NICHT exposed, list() dagegen lesbar, mit anon-Key getestet). Eine
// korrupte Leere-Datei ("{}") wird erkannt, gelöscht und als Fehler
// gemeldet — statt wie bisher still als "erfolgreich" durchzugehen.
// ══════════════════════════════════════════════════════════════════════

import { supabase } from "./supabaseClient.js";

/**
 * Konvertiert einen Blob/File/ArrayBuffer in einen Uint8Array — den EINZIGEN
 * Body-Typ, der auf dem nachweislich fehlerhaften Gerät (Karen Hagen,
 * Android/CapacitorHttp) korrekt übertragen wurde. Bei technischem Fehlschlag
 * der Konvertierung wird das Original durchgereicht (kein Härteverlust
 * gegenüber vorherigem Zustand).
 *
 * @param {Blob|File|ArrayBuffer|Uint8Array} input
 * @returns {Promise<Uint8Array|*>}
 */
export async function toSafeUploadBody(input) {
  try {
    if (typeof input?.arrayBuffer === "function") {
      const buf = await input.arrayBuffer();
      return new Uint8Array(buf);
    }
    if (input instanceof ArrayBuffer) {
      return new Uint8Array(input);
    }
  } catch (err) {
    console.warn("[uploadBody] Konvertierung zu Uint8Array fehlgeschlagen, nutze Original:", err?.message);
  }
  return input; // Uint8Array/sonstiges unverändert durchreichen
}

/**
 * Verifizierter Upload in den "media"-Bucket:
 *   1. Body → Uint8Array (toSafeUploadBody — geräte-proven)
 *   2. supabase.storage.upload()
 *   3. Größen-Verifizierung via storage.list() — erkennt die "{}"-Korruption
 *      (gespeicherte Größe < 64 Bytes ODER < 50% der gesendeten Bytes)
 *   4. Bei Korruption: Objekt löschen + Fehler werfen (mit .statusCode)
 *
 * Wirft bei jedem Fehlschlag einen Error mit .statusCode (Supabase-Status
 * oder 900 bei Korruption) — Caller prüfen err.statusCode wie bisher.
 *
 * @param {{ path: string, file: (Blob|File|ArrayBuffer|Uint8Array),
 *           contentType: string, bucket?: string, upsert?: boolean,
 *           cacheControl?: string }} opts
 * @returns {Promise<{ publicUrl: string, path: string, size: number }>}
 */
export async function uploadMediaVerified({ path, file, contentType, bucket = "media", upsert = false, cacheControl }) {
  if (!path || !file) throw Object.assign(new Error("Ungültige Upload-Parameter"), { statusCode: 400 });

  // 1. Body-Konvertierung — der eigentliche Root-Cause-Fix
  const body = await toSafeUploadBody(file);
  const expectedBytes =
    (body?.byteLength != null) ? body.byteLength
    : (body?.size != null) ? body.size
    : (file?.size != null) ? file.size
    : 0;

  // 2. Upload
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, body, { contentType, upsert, cacheControl });
  if (error) {
    throw Object.assign(new Error(error.message), { statusCode: error.statusCode });
  }

  // 3. Größen-Verifizierung (list() liefert Metadaten ohne CORS-Header-Problem;
  //    öffentlich lesbar — mit anon-Key verifiziert, siehe Datei-Header)
  let storedBytes = null;
  try {
    const prefix = path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1) : "";
    const fileName = path.includes("/") ? path.slice(path.lastIndexOf("/") + 1) : path;
    const { data: listed, error: listErr } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit: 100, search: fileName });
    const obj = listed?.find((o) => o.name === fileName);
    storedBytes = obj?.metadata?.size ?? null;
    if (listErr) console.warn("[uploadBody] list()-Verifizierung nicht möglich:", listErr?.message);
  } catch (verifyErr) {
    console.warn("[uploadBody] Verifizierung fehlgeschlagen (nicht blockierend):", verifyErr?.message);
  }

  // 4. Korruption → löschen + werfen (statt stiller Datenmüll wie bisher)
  if (storedBytes != null && (storedBytes < 64 || (expectedBytes > 0 && storedBytes < expectedBytes * 0.5))) {
    try { await supabase.storage.from(bucket).remove([path]); } catch { /* Best-Effort-Cleanup */ }
    console.error("[uploadBody] KORRUPTE Upload-Datei erkannt und gelöscht:", { path, expectedBytes, storedBytes });
    throw Object.assign(
      new Error("Upload beschädigt (leere Datei) — bitte erneut versuchen"),
      { statusCode: 900, corrupt: true, expectedBytes, storedBytes }
    );
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return { publicUrl, path, size: storedBytes ?? expectedBytes };
}
