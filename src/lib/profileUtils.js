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

  // 1. PRIMARY — membership_type + membership_active (Sprint F.4C Wahrheit)
  //    talent / guardian / team mit aktivem membership → Talent
  if (profile.membership_active === true) {
    if (profile.membership_type === "talent"  ) return true;
    if (profile.membership_type === "guardian") return true;
    if (profile.membership_type === "team"    ) return true;
  }

  // 2. LEGACY — Rollen-basiert (bestehende Nutzer ohne Migration)
  //    role: creator NICHT enthalten (creator ist kein Talent in HUI)
  if (profile.role === "talent") return true;
  if (profile.role === "wirker") return true;

  // 3. LEGACY — Boolean-Flag (Nutzer über TalentOnboarding aktiviert)
  if (profile.is_talent === true) return true;

  // 4. LEGACY — has_talent_profile (ältestes Schema)
  if (profile.has_talent_profile === true) return true;

  // NICHT mehr: is_member, membership_type==="member", membership_type==="guide",
  //             localStorage.getItem("hui_talent"), role==="admin"
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

/**
 * getFullDisplayName — SSOT für die Namensanzeige fremder Nutzer
 * (NAME-DISPLAY-FIX, 2026-08-07)
 *
 * Problem: An mehreren Stellen wurde profile.display_name (frei wählbarer
 * Spitzname, z.B. "Linda") mit höherer Priorität als profile.full_name
 * (echter Vor- und Nachname, z.B. "Linda Mathis") angezeigt oder
 * display_name war die EINZIGE Quelle ohne full_name-Fallback. Das führte
 * dazu, dass reale Nutzer nur mit Vornamen/Spitznamen in Feed-Karten,
 * Kommentaren und Discover-Kacheln auftauchten.
 *
 * Regel (explizite Vorgabe): Vor- und Nachname soll IMMER angezeigt werden.
 * full_name hat daher Vorrang vor display_name.
 *
 * Prioritätskette: full_name → display_name → username → fallback
 *
 * @param {object|null} profile - Profil-Objekt aus Supabase (oder Teilobjekt)
 * @param {string} fallback - Rückgabewert wenn nichts vorhanden ist
 * @returns {string}
 */
export function getFullDisplayName(profile, fallback = "Mitglied") {
  if (!profile) return fallback;
  const full = typeof profile.full_name === "string" ? profile.full_name.trim() : "";
  if (full) return full;
  const disp = typeof profile.display_name === "string" ? profile.display_name.trim() : "";
  if (disp) return disp;
  const uname = typeof profile.username === "string" ? profile.username.trim() : "";
  if (uname) return uname;
  return fallback;
}

/**
 * getProfileRoleLabel — Rollen-/Status-Text unter dem Namen (Feed-Header etc.)
 * (NAME-DISPLAY-FIX, 2026-08-07; BASIS-TAG-FIX, 2026-08-15)
 *
 * Problem (2026-08-07): Das freie Textfeld profile.talent wird manuell gepflegt
 * (z.B. "Superadmin" bei Admins) und ist bei echten Talent-Nutzern oft NULL,
 * obwohl isProfileTalent(profile) bereits true liefert — die Zeile blieb
 * dann komplett leer statt "Talent" anzuzeigen.
 *
 * Problem (2026-08-15): Basis-Nutzer (isProfileTalent===false, kein
 * gepflegter Freitext) bekamen bisher GAR KEINEN Tag unter dem Namen —
 * die Zeile blieb komplett leer, während Talent-Nutzer konsistent "Talent"
 * sahen. Das wirkte uneinheitlich (Screenshot-Feedback: "Peter Stock" ohne
 * jeden Rollen-Tag, während andere Feed-Karten "Talent" zeigen).
 *
 * Priorität: profile.talent (gepflegter Freitext) → "Talent" (wenn
 * isProfileTalent) → "Basis-Nutzer" (Fallback, konsistent mit dem
 * Profil-Badge-Label in ProfileHeader.jsx) → nie mehr null.
 *
 * @param {object|null} profile
 * @returns {string|null}
 */
// SYSTEM-BOT-TAG-FIX (2026-08-18): myHUI clientseitig per fester ID
// erkennen statt ueber profile.is_system_account (DB-Spalte hat kein
// Column-Level-GRANT fuer 'authenticated' -> jede Query, die sie
// SELECTed, bekam ein Request-weites 403 Forbidden von PostgREST).
// ID identisch zu SYSTEM_USER_ID in BaseFeedCard.jsx / ProfileLauncher.jsx
// (bewusst dupliziert, kein Cross-Import um Bundle-Kopplung zu vermeiden).
const SYSTEM_ACCOUNT_ID = "152619c1-9adc-40bf-9078-eb67f5024ed2";

export function getProfileRoleLabel(profile) {
  if (!profile) return null;
  // myHUI ist kein normaler Nutzer und bekommt bereits ein eigenes
  // "Bot"-Badge (HumanHeader in BaseFeedCard.jsx / ProfileHeader.jsx).
  // Der generische Rollen-Fallback "Basis-Nutzer" darunter ist fuer den
  // System-Account fachlich falsch (myHUI hat keine "Basis"-Mitgliedschaft)
  // und wirkt neben dem Bot-Badge redundant/verwirrend — daher hier
  // bewusst kein Tag.
  if (profile.id === SYSTEM_ACCOUNT_ID) return null;
  const custom = typeof profile.talent === "string" ? profile.talent.trim() : "";
  if (custom) return custom;
  if (isProfileTalent(profile)) return "Talent";
  return "Basis-Nutzer";
}

