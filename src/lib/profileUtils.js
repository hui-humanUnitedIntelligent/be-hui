// src/lib/profileUtils.js
// ─────────────────────────────────────────────────────────────────
// HUI Profil-Hilfsfunktionen — Phase 1.5 Konsolidierung
// Single Source of Truth für Talent-Erkennung
// ─────────────────────────────────────────────────────────────────

/**
 * isProfileTalent — zentrale Talent-Erkennungsfunktion
 *
 * Wahrheits-Hierarchie:
 *   1. membership_type === "talent" (primäre Wahrheit — zukunftssicher)
 *   2. role === "talent" | "wirker" | "admin" (Rollen-basiert)
 *   3. is_talent === true (Boolean-Flag aus profiles-Tabelle)
 *   4. has_talent_profile === true (Übergangs-Kompatibilität — Legacy)
 *
 * HINWEIS:
 *   membership_active wird hier NICHT geprüft — diese Funktion
 *   bestimmt ob jemand EIN Talentprofil hat, nicht ob die Mitgliedschaft
 *   aktuell aktiv ist. Für Mitgliedschafts-Gates: membership_active separat prüfen.
 *
 * @param {object|null} profile - Profil-Objekt aus Supabase
 * @returns {boolean}
 */
export function isProfileTalent(profile) {
  if (!profile) return false;
  // 1. Primäre Wahrheit: membership_type
  if (profile.membership_type === "talent"    ) return true;
  if (profile.membership_type === "guardian"  ) return true;
  if (profile.membership_type === "team"      ) return true;
  // 2. Rollen-basiert (bestehende Nutzer)
  if (profile.role === "talent"  ) return true;
  if (profile.role === "wirker"  ) return true;
  if (profile.role === "admin"   ) return true;
  // 3. Boolean-Flag (neue Nutzer via Membership-Flow)
  if (profile.is_talent === true ) return true;
  // 4. Legacy-Kompatibilität
  if (profile.has_talent_profile === true) return true;
  return false;
}

/**
 * hasTalentProfile — hat der User sein Talent-Profil bereits eingerichtet?
 * Unterschied zu isProfileTalent: prüft OB das Profil befüllt wurde,
 * nicht ob die Mitgliedschaft vorhanden ist.
 *
 * @param {object|null} profile
 * @returns {boolean}
 */
export function hasTalentProfile(profile) {
  if (!profile) return false;
  return profile.has_talent_profile === true;
}

/**
 * isMembershipActive — ist die Talent-Mitgliedschaft aktiv?
 * Nur relevant für Feature-Gates (z.B. Buchungen empfangen).
 *
 * @param {object|null} profile
 * @returns {boolean}
 */
export function isMembershipActive(profile) {
  if (!profile) return false;
  if (profile.membership_active === true) return true;
  // Legacy: is_member
  if (profile.is_member === true) return true;
  return false;
}
