// src/lib/usePresence.js — Sprint 8 Phase 6
// Re-Export der kanonischen Presence-Implementierung (user_presence).
// Keine Writes mehr nach profiles.last_seen_at.
export {
  usePresence,
  usePresenceMap,
  PresenceDot,
  fmtPresence,
  presenceDisplay,
} from "./usePresence.jsx";
