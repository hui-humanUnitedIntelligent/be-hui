// src/lib/storageResign.js
// SIGNED-URL-RESIGN-SSOT (2026-09-19, Michael-Report "Bilder werden nicht
// angezeigt"): Chat-Medien werden mit signierten Storage-URLs verschickt,
// deren Token ablaeuft (urspruenglich 24h). Die DATEI bleibt unveraendert im
// Bucket — nur die URL stirbt. Diese Lib extrahiert Bucket + Pfad aus einer
// abgelaufenen Sign-URL und stellt per createSignedUrl eine frische URL
// aus. Nutzt MediaImage.jsx + MediaVideo.jsx (SSOT, keine Duplikate).
//
// Wichtig: createSignedUrl benoetigt SELECT-Recht auf dem Objekt. Fuer den
// chat-media-Bucket existiert die Storage-Policy "Chat participants read"
// (authenticated, DB-verifiziert 19.09.) — BEIDE Chat-Partner koennen also
// neu signieren.
import { supabase } from "./supabaseClient.js";

// TTL frisch signierter URLs (30 Tage). Die Upload-Seite (ChatInput)
// vergibt dieselbe TTL — dieses Re-Sign hier ist die dauerhafte Absicherung
// fuer JEDE bereits verschickte aeltere URL, egal mit welcher Erst-TTL.
export const SIGNED_URL_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * Extrahiert Bucket + Pfad aus einer Supabase-Storage-Sign-URL
 * (".../object/sign/<bucket>/<pfad>?token=...").
 * @returns {{bucket: string, path: string} | null}
 */
export function parseSignedUrl(url) {
  const m = String(url || "").match(/\/object\/sign\/([^/]+)\/([^?]+)/);
  if (!m) return null;
  return { bucket: m[1], path: decodeURIComponent(m[2]) };
}

/**
 * Signiert eine (abgelaufene) Sign-URL neu.
 * @returns {Promise<string|null>} frische signedUrl oder null bei Fehlschlag
 */
export async function resignStorageUrl(url) {
  const parsed = parseSignedUrl(url);
  if (!parsed) return null;
  try {
    const { data, error } = await supabase.storage
      .from(parsed.bucket)
      .createSignedUrl(parsed.path, SIGNED_URL_TTL_SECONDS);
    if (!error && data?.signedUrl) return data.signedUrl;
    console.error("[HUI Media] re-sign failed:", parsed.path, error?.message);
  } catch (e) {
    console.error("[HUI Media] re-sign error:", e?.message);
  }
  return null;
}
