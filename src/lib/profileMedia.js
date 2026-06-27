// src/lib/profileMedia.js
// ══════════════════════════════════════════════════════════════════════
// HUI Profil-Media-Hilfsfunktionen — Sprint F.9C
// Single Source of Truth für:
//   • Bild-Upload (Avatar + Cover)
//   • Datenbank-Write nach Upload
//   • Fallback-Auflösung (location, displayName)
//
// Consumer:
//   • src/components/profile/ProfileHeader.jsx   (canonical)
//   • src/pages/MyBasisProfile.jsx               (MeinProfilHeader)
//   • Zukünftig: alle Hero/Header-Komponenten
// ══════════════════════════════════════════════════════════════════════

import { supabase } from "./supabaseClient.js";
import { clearQueryCache } from "./perfUtils.js";

// ── Fallback-Assets ──────────────────────────────────────────────────
export const FB_COVER  = "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=80";
export const FB_AVATAR = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80";

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

// ── Bild-Upload ──────────────────────────────────────────────────────
/**
 * Laedt ein Bild in den Supabase Storage "media"-Bucket hoch.
 * Gibt die oeffentliche URL zurueck.
 */
export async function uploadProfileImage(file, userId, folder) {
  const ext  = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
  return publicUrl;
}

// ── kombinierter Upload + DB-Write ───────────────────────────────────
/**
 * Laedt Avatar hoch + schreibt avatar_url in profiles.
 * Vereinheitlicht aus ProfileHeader.jsx + MeinProfilHeader (MyBasisProfile.jsx).
 *
 * @param {{ event, profileId, onSuccess, setUploading }} opts
 */
export async function handleAvatarUpload({ event, profileId, onSuccess, setUploading }) {
  const file = event.target.files?.[0];
  if (!file) return;
  setUploading(true);
  try {
    let uid = profileId;
    if (!uid) {
      const { data: { user } } = await supabase.auth.getUser();
      uid = user?.id;
    }
    if (!uid) { console.warn("[profileMedia] Avatar upload: kein userId"); return; }
    const url = await uploadProfileImage(file, uid, "avatars");
    const { error: dbErr } = await supabase.from("profiles")
      .update({ avatar_url: url, updated_at: new Date().toISOString() })
      .eq("id", uid);
    if (dbErr) throw dbErr;
    // Cache invalidieren — damit reload() frische Daten holt
    clearQueryCache(`profile:${uid}`);
    onSuccess?.(url);
  } catch (err) {
    console.error("[profileMedia] Avatar upload error:", err?.message, err?.statusCode || err?.status, JSON.stringify(err));
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
  setUploading(true);
  try {
    let uid = profileId;
    if (!uid) {
      const { data: { user } } = await supabase.auth.getUser();
      uid = user?.id;
    }
    if (!uid) { console.warn("[profileMedia] Cover upload: kein userId"); return; }
    const url = await uploadProfileImage(file, uid, "covers");
    const { error: dbErr } = await supabase.from("profiles")
      .update({ header_img: url, updated_at: new Date().toISOString() })
      .eq("id", uid);
    if (dbErr) throw dbErr;
    // Cache invalidieren — damit reload() frische Daten holt
    clearQueryCache(`profile:${uid}`);
    onSuccess?.(url);
  } catch (err) {
    console.error("[profileMedia] Cover upload error:", err?.message, err?.statusCode || err?.status, JSON.stringify(err));
  } finally {
    setUploading(false);
    event.target.value = "";
  }
}
