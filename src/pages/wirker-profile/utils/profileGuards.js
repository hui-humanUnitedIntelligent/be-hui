// utils/profileGuards.js
// Null-Guards und Sicherheitsprüfungen für WirkerProfile
// REGEL: Seite darf NIEMALS crashen wenn Daten fehlen

/**
 * Gibt sicheren Zugriff auf ein Profil-Feld zurück.
 * Kein Crash bei null/undefined.
 */
export function safeField(profile, field, fallback = null) {
  try {
    return profile?.[field] ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Prüft ob ein Profil vollständig genug für die Darstellung ist.
 */
export function isProfileReady(profile) {
  return !!(profile && (profile.id || profile.user_id));
}

/**
 * Prüft ob User der Owner dieses Profils ist.
 */
export function isOwnerProfile(user, profile) {
  if (!user?.id || !profile) return false;
  return (
    profile.id      === user.id ||
    profile.user_id === user.id
  );
}

/**
 * Prüft ob Presence-Daten vorhanden und nutzbar sind.
 */
export function hasPresenceData(creativePresence) {
  return !!(creativePresence && (
    creativePresence.signature ||
    creativePresence.rhythm    ||
    creativePresence.continuity
  ));
}

/**
 * Prüft ob Rhythm-Daten angezeigt werden sollen.
 */
export function shouldShowRhythm(creativePresence) {
  const key = creativePresence?.rhythm?.key;
  return !!(key && key !== "consistent");
}

/**
 * Prüft ob Bridge-Creator Daten angezeigt werden sollen.
 */
export function shouldShowBridge(creativePresence) {
  return !!(creativePresence?.continuity?.isBridge);
}

/**
 * Gibt sicheres Array zurück (niemals null/undefined).
 */
export function safeArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [];
}

/**
 * Prüft ob ein Profil buchbar ist.
 */
export function isBookable(profile) {
  return !!(profile?.is_available !== false && profile?.id);
}

/**
 * Gibt den Profil-Identifier zurück (für Routing/Queries).
 * Reihenfolge: user_id > id > username
 */
export function getProfileIdentifier(rawWirker) {
  return rawWirker?.user_id || rawWirker?.id || rawWirker?.username || null;
}
