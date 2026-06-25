// src/lib/welcomePersistence.js
// ─────────────────────────────────────────────────────────────
// Abstraktion für Welcome-Persistenz.
//
// Aktuell: localStorage mit nutzer-spezifischem Key.
// Später: einfach hier auf profiles.welcome_seen_at umstellen —
//         kein anderer Code muss verändert werden.
//
// API:
//   hasSeenWelcome(userId)  → boolean
//   markWelcomeSeen(userId) → void
// ─────────────────────────────────────────────────────────────

const KEY = (userId) => `hui_welcome_seen:${userId}`;

/**
 * Gibt true zurück wenn der Nutzer das WelcomeOverlay bereits gesehen hat.
 * @param {string|null|undefined} userId
 */
export function hasSeenWelcome(userId) {
  if (!userId) return false;
  try {
    return localStorage.getItem(KEY(userId)) === "true";
  } catch {
    return false;
  }
}

/**
 * Speichert dass der Nutzer das WelcomeOverlay gesehen und bestätigt hat.
 * @param {string|null|undefined} userId
 */
export function markWelcomeSeen(userId) {
  if (!userId) return;
  try {
    localStorage.setItem(KEY(userId), "true");
  } catch {
    // Safari Private Mode — silent fail
  }
}
