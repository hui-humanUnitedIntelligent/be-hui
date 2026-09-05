// src/lib/uploadBody.js
// ══════════════════════════════════════════════════════════════════════
// UPLOAD-BODY-SSOT — Body-Typ-Pass-through + EXAKTE Größen-Verifizierung
// (2026-09-05, abendlicher Release-Fix "AVATAR-MANGLE-001")
//
// EMPIRISCHE BEWEISLAGE (Storage-Magic-Byte-Sweep 05.09. abends, 80 Dateien
// seit 28.08. — NICHT geraten, jede Datei per HTTP auf FFD8FF geprüft):
//
//   Body-Typ     Transport-Ergebnis auf Android/CapacitorHttp
//   ─────────────────────────────────────────────────────────────────
//   Blob         ✅ GÜLTIG auf ALLEN getesteten Geräten (68/68 echte
//                Content-Dateien 28.08.–04.09., inkl. Karens Samsung:
//                ihre Werke/Erlebnisse 04.09. via Blob = valid)
//   ArrayBuffer  ❌ "{}" (2 Bytes) — Karens Avatar-Versuche 04.09. 15:10
//                (v2.1.542, IMG-FALLBACK-002)
//   Uint8Array   ❌ UTF-8-MANGLED (EF BF BD am Dateianfang) — ALLE 7
//                img_diag-p5-Dateien auf 3 Geräten (04.+05.09.) +
//                Michaels 2 Avatar-Uploads + Karens Cover-Upload 05.09.
//                (v2.1.543+, Body-SSOT-Fehlschluss)
//
// FEHLER-KETTE (dokumentiert gegen Wiederholung):
//   Der v2.1.543-Fix (Blob→Uint8Array) beruhte auf einem FALSCH-POSITIV:
//   die "Beweis"-Datei diag_1788529163521.jpg (04.09., angeblich "212-Byte-
//   echtes JPEG, byte-genau verifiziert") ist selbst MANGLED (256 Bytes,
//   EF BF BD). Der img_diag-p5 prüfte NUR error==null, NIEMALS die
//   gespeicherten Bytes. Uint8Array hat damit NIE funktioniert — und hat
//   am 05.09. alle Android-Uploads global kaputtgemacht.
//
// FIX (dieser Stand):
//   1. toSafeUploadBody = PASS-THROUGH (Original-Blob unverändert) — der
//      einzige empirisch auf allen Geräten bewiesene Body-Typ.
//   2. uploadMediaVerified: EXAKTE Größen-Verifizierung (stored !==
//      expected → korrupt). Fängt "{}" (Schrumpfen) UND Mangel-Growth
//      (212→256, ~60KB→91KB) ab — die 50%-Toleranz ließ Growth durch.
//   3. imgDiag p5 verifiziert jetzt Magic Bytes des gespeicherten Objekts.
// ══════════════════════════════════════════════════════════════════════

import { supabase } from "./supabaseClient.js";

/**
 * AVATAR-MANGLE-001 (2026-09-05): PASS-THROUGH.
 * Wandelt NICHTS mehr um. Beweislage siehe Datei-Header:
 *   Blob = valid (68/68), ArrayBuffer = "{}" (Karen 04.09.),
 *   Uint8Array = mangled (9/9 auf 3 Geräten).
 * Die Funktion bleibt als SSOT-Anker für alle ~22 Aufrufstellen bestehen,
 * damit ein künftiger Body-Typ-Wechsel wieder NUR hier passiert.
 */
export async function toSafeUploadBody(input) {
  return input;
}

/**
 * Verifizierter Upload in den "media"-Bucket:
 *   1. Body unverändert durchreichen (Blob — bewiesen, siehe oben)
 *   2. supabase.storage.upload()
 *   3. EXAKTE Größen-Verifizierung via storage.list():
 *      storedBytes !== expectedBytes → korrupt (fängt "{}" UND
 *      UTF-8-Mangel-Growth ab, die beide HTTP 200 liefern)
 *   4. Bei Korruption: Objekt löschen + Fehler werfen (mit .statusCode)
 *
 * Wirft bei jedem Fehlschlag einen Error mit .statusCode (Supabase-Status
 * oder 900 bei Korruption).
 */
export async function uploadMediaVerified({ path, file, contentType, bucket = "media", upsert = false, cacheControl }) {
  if (!path || !file) throw Object.assign(new Error("Ungültige Upload-Parameter"), { statusCode: 400 });

  const body = await toSafeUploadBody(file);
  const expectedBytes =
    (body?.size != null)        ? body.size        : // Blob/File
    (body?.byteLength != null)  ? body.byteLength : // ArrayBuffer/TypedArray
    (file?.size != null)        ? file.size       :
    0;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, body, { contentType, upsert, cacheControl });
  if (error) {
    throw Object.assign(new Error(error.message), { statusCode: error.statusCode });
  }

  // ── EXAKTE Größen-Verifizierung (AVATAR-MANGLE-001) ──
  // list() liefert Metadaten ohne CORS-Header-Problem, öffentlich lesbar.
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

  if (storedBytes != null && expectedBytes > 0 && storedBytes !== expectedBytes) {
    try { await supabase.storage.from(bucket).remove([path]); } catch { /* Best-Effort-Cleanup */ }
    console.error("[uploadBody] KORRUPTE Upload-Datei erkannt und gelöscht (exakte Größen-Abweichung):",
      { path, expectedBytes, storedBytes });
    throw Object.assign(
      new Error("Upload beschädigt (Größe weicht ab) — bitte erneut versuchen"),
      { statusCode: 900, corrupt: true, expectedBytes, storedBytes }
    );
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return { publicUrl, path, size: storedBytes ?? expectedBytes };
}
