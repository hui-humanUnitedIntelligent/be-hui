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
//
// ERWEITERUNG (2026-08-23, Michael): Versions-gebundene Persistenz für
// den erweiterten Empfangsbereich (Regeln/Sicherheit/Kernbereiche) —
// bestehende Nutzer sollen die neuen Hinweise EINMAL PRO APP-UPDATE sehen,
// unabhängig davon ob sie das ursprüngliche WelcomeOverlay schon gesehen
// haben. Reine Ergänzung — hasSeenWelcome/markWelcomeSeen unverändert.
//   hasSeenRulesForVersion(userId, version)  → boolean
//   markRulesSeenForVersion(userId, version) → void
// ─────────────────────────────────────────────────────────────

const KEY = (userId) => `hui_welcome_seen:${userId}`;
const RULES_KEY = (userId, version) => `hui_rules_seen:${userId}:${version}`;

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

/**
 * Gibt true zurück wenn der Nutzer die erweiterten Hinweise (Regeln/
 * Sicherheit/Kernbereiche) für die AKTUELLE App-Version bereits gesehen hat.
 * @param {string|null|undefined} userId
 * @param {string|null|undefined} version - z.B. APP_VERSION aus version.js
 */
export function hasSeenRulesForVersion(userId, version) {
  if (!userId || !version) return false;
  try {
    return localStorage.getItem(RULES_KEY(userId, version)) === "true";
  } catch {
    return false;
  }
}

/**
 * Speichert dass der Nutzer die erweiterten Hinweise für die AKTUELLE
 * App-Version gesehen hat (feuert danach nicht erneut für dieselbe Version).
 * @param {string|null|undefined} userId
 * @param {string|null|undefined} version
 */
export function markRulesSeenForVersion(userId, version) {
  if (!userId || !version) return;
  try {
    localStorage.setItem(RULES_KEY(userId, version), "true");
  } catch {
    // Safari Private Mode — silent fail
  }
}
