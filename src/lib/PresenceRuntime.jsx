// src/lib/PresenceRuntime.jsx
// Sprint 8 Phase 2 — aktiviert usePresence.jsx ohne UI-Änderung.
// Mountet Write (user_presence) + Read/Realtime (usePresenceMap) Pipeline.
// Rendert null — kein sichtbares UI.
import { usePresence, usePresenceMap } from "./usePresence.jsx";

export default function PresenceRuntime({ userId, currentPage = "home" }) {
  usePresence(userId, currentPage);
  // Realtime-Pipeline: user_presence → Hook → Status (eigenes Profil, ohne UI)
  usePresenceMap(userId ? [userId] : []);
  return null;
}
