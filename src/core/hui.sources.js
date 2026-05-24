// src/core/hui.sources.js — HUI SOURCE STANDARD v1
// ══════════════════════════════════════════════════════════════════
// PHASE 2B: Flow Consistency Engine
//
// ZWECK:
//   Alle source-Werte in der Action Engine sind hier zentralisiert.
//   Keine freien Strings mehr in Components.
//
//   NICHT: source: "discover"
//   SONDERN: source: S.DISCOVER
//
// IMPORT:
//   import { S } from "../core/hui.sources.js";
//
// KOMPATIBILITÄT:
//   SOURCE (aus hui.contracts.js) bleibt für Contract-Validierung erhalten.
//   S ist der kurze Alias für Component-Usage.
// ══════════════════════════════════════════════════════════════════

// ─── Surface-Typen ────────────────────────────────────────────────
// Ein Surface ist der Ort, von dem aus eine Action ausgelöst wurde.
// Er bestimmt das Return-Verhalten und den Flow-Context.

export const S = Object.freeze({
  // ── Navigation / Tabs ──────────────────────────────────────────
  HOME:             "home",          // Home-Feed (aktiver Tab)
  DISCOVER:         "discover",      // Entdecken-Seite
  FAVORITES:        "favorites",     // Dein Raum / Favoriten
  IMPACT:           "impact",        // Impact-Seite

  // ── Overlay-Surfaces ───────────────────────────────────────────
  VISITOR_PROFILE:  "visitor-profile",  // Fremdes Creator-Profil
  OWNER_PROFILE:    "owner-profile",    // Eigenes Profil (Creator-Dashboard)
  CHAT:             "chat",             // Chat / Resonanz-Center
  BOOKING:          "booking",          // Booking-Flow
  EXPERIENCE:       "experience",       // Erlebnis-Detail
  NOTIFICATIONS:    "notifications",    // Notification-Center
  MAP:              "map",              // Live-Map
  MATCH:            "match",            // Match-Overlay
  ORB:              "orb",              // HUI Orb (Aktions-Hub)

  // ── System / Intern ────────────────────────────────────────────
  SYSTEM:           "system",        // Interne Action (kein UI-Trigger)
  UNKNOWN:          "unknown",       // Fallback — unbekannter Ursprung
});

// ─── Flow-Hierarchie ──────────────────────────────────────────────
// Definiert welche Surfaces "tiefer" liegen als andere.
// Return-Logic nutzt diese Hierarchie: tiefe Surface → zurück zur übergeordneten.
//
// Schicht 0: Tab-Level (unterste — immer verfügbar)
// Schicht 1: Overlay-Level (über Tab)
// Schicht 2: Detail-Level (über Overlay)
// Schicht 3: Deep-Level (tiefste Ebene)

export const SURFACE_DEPTH = Object.freeze({
  [S.HOME]:            0,
  [S.DISCOVER]:        0,
  [S.FAVORITES]:       0,
  [S.IMPACT]:          0,
  [S.ORB]:             1,
  [S.NOTIFICATIONS]:   1,
  [S.MAP]:             1,
  [S.MATCH]:           1,
  [S.VISITOR_PROFILE]: 1,
  [S.OWNER_PROFILE]:   1,
  [S.EXPERIENCE]:      2,
  [S.BOOKING]:         2,
  [S.CHAT]:            2,
  [S.SYSTEM]:         -1,  // kein UI-Layer
  [S.UNKNOWN]:        -1,
});

// ─── Return-Map ───────────────────────────────────────────────────
// Definiert für jede Surface: wohin kehrt man zurück?
// Genutzt von hui.flow.return.js für semantische Returns.

export const RETURN_TO = Object.freeze({
  [S.CHAT]:            S.VISITOR_PROFILE,  // Chat → zurück zum Profil (LOOP 1)
  [S.EXPERIENCE]:      S.DISCOVER,         // Erlebnis → zurück zu Discover
  [S.BOOKING]:         S.VISITOR_PROFILE,  // Booking → zurück zum Profil
  [S.VISITOR_PROFILE]: S.HOME,             // Profil → zurück zu Home/Feed
  [S.NOTIFICATIONS]:   S.HOME,             // Notifs → zurück zu Home
  [S.MAP]:             S.DISCOVER,         // Map → zurück zu Discover
  [S.MATCH]:           S.HOME,             // Match → zurück zu Home
  [S.ORB]:             S.HOME,             // Orb → zurück zu Home
  // Tab-Level kehrt immer zu Home zurück
  [S.DISCOVER]:        S.HOME,
  [S.FAVORITES]:       S.HOME,
  [S.IMPACT]:          S.HOME,
});

// ─── Label-Map (für DEV-Logging) ──────────────────────────────────
export const SURFACE_LABEL = Object.freeze({
  [S.HOME]:            "Home-Feed",
  [S.DISCOVER]:        "Entdecken",
  [S.FAVORITES]:       "Dein Raum",
  [S.IMPACT]:          "Impact",
  [S.ORB]:             "HUI Orb",
  [S.NOTIFICATIONS]:   "Benachrichtigungen",
  [S.MAP]:             "Live-Map",
  [S.MATCH]:           "Match",
  [S.VISITOR_PROFILE]: "Creator-Profil",
  [S.OWNER_PROFILE]:   "Mein Profil",
  [S.EXPERIENCE]:      "Erlebnis",
  [S.BOOKING]:         "Buchung",
  [S.CHAT]:            "Chat",
  [S.SYSTEM]:          "System",
  [S.UNKNOWN]:         "Unbekannt",
});

// ─── Validator ────────────────────────────────────────────────────
// Gibt true zurück wenn der Wert ein bekannter Surface ist.
export function isValidSource(val) {
  return Object.values(S).includes(val);
}
