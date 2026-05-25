// src/core/hui.safePayload.js
// ═══════════════════════════════════════════════════════════════
// HUI — Globaler Payload Schutz (Phase 1 Reality Core)
//
// ZWECK: Jeder Orb-Button, Action-Call, Flow-Start läuft durch
//        diese Guards bevor irgendetwas destructured wird.
//
// GARANTIEN:
//   - gibt NIEMALS null zurück
//   - source IMMER als gültiger String
//   - alle required-Felder mit sicheren Fallbacks
//   - crasht nie, egal was reinkommt
// ═══════════════════════════════════════════════════════════════

import { S } from "./hui.sources.js";

/**
 * Macht ein beliebiges Payload-Objekt crash-sicher.
 * Garantiert: gibt immer ein Objekt zurück, niemals null/undefined.
 */
export function safePayload(raw, defaults = {}) {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    console.warn("[HUI_SAFE_PAYLOAD] invalid payload — using defaults", typeof raw, raw);
    return { source: S.SYSTEM, ...defaults };
  }
  const source = (typeof raw.source === "string" && raw.source.length > 0)
    ? raw.source
    : S.SYSTEM;
  return { ...defaults, ...raw, source };
}

/**
 * Macht einen action-type String crash-sicher.
 * Gibt immer einen non-empty string zurück.
 */
export function safeActionType(type, fallback = "unknown") {
  if (typeof type === "string" && type.trim().length > 0) return type.trim();
  console.warn("[HUI_SAFE_PAYLOAD] invalid action type:", type, "→ fallback:", fallback);
  return fallback;
}

/**
 * Macht ein Creator-Objekt crash-sicher.
 * Garantiert id und display_name.
 */
export function safeCreator(raw) {
  if (!raw || typeof raw !== "object") {
    return { id: null, display_name: "Creator", avatar_url: null };
  }
  return {
    id:           raw.id || raw.user_id || raw.profile_id || null,
    display_name: raw.display_name || raw.name || raw.full_name || raw.username || "Creator",
    avatar_url:   raw.avatar_url || raw.img || raw.avatar || null,
    talent:       raw.talent || raw.role || null,
    verified:     Boolean(raw.verified || raw.is_verified),
    _raw:         raw,
  };
}

/**
 * Orb-spezifischer Action-Guard.
 * Jeder Orb-Node-Click läuft durch diese Funktion.
 * Gibt null zurück wenn der type unbekannt ist → kein Flow starten.
 */
export function safeOrbAction(type) {
  const KNOWN_ACTIONS = new Set([
    "story", "teilen", "moment", "thought",
    "werk", "kunstwerk", "handwerk", "design", "digital", "sammler",
    "experience", "erlebnis", "workshop", "retreat", "event", "session", "erlebnis_s",
    "impact", "wirkung", "idee", "wirkraum", "einreich",
    "connect", "connection", "kollab", "mentor", "partner", "community",
    "wirker", "membership",
    "create",
  ]);
  const t = safeActionType(type, "unknown");
  if (t === "unknown" || !KNOWN_ACTIONS.has(t)) {
    console.warn("[HUI_ORB] unbekannte action:", t, "— kein Flow ausgelöst");
    return null;  // null = kein Flow starten
  }
  return t;
}
