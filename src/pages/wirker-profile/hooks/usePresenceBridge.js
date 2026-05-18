// hooks/usePresenceBridge.js
// Brückt Legacy-Presence (online/offline) und Creative-Presence (Phase 6G)
// REGEL: Kein Crash wenn Presence-Daten fehlen. Alle Returns null-safe.

import { usePresence as usePresenceLegacy, getPresenceLabel } from "../../../lib/sessionHooks";
import { usePresence } from "../../../lib/presence/index";
import { hasPresenceData, shouldShowRhythm, shouldShowBridge } from "../utils/profileGuards";
import { formatRhythm, formatContinuity } from "../utils/profileFormatters";

/**
 * Kombiniert Legacy-Presence (online/offline Status)
 * und Creative-Presence (Phase 6G: Signatur, Rhythmus, Kontinuität).
 *
 * @param {string|null} profileId - ID des Profils
 * @returns {{
 *   presenceStatus: string,        // "online"|"recently"|"away"|"offline"
 *   presenceInfo:   object|null,   // { label, color, emoji }
 *   creativePresence: object|null, // Phase 6G Presence-Daten
 *   hasCreative: boolean,
 *   showRhythm:  boolean,
 *   showBridge:  boolean,
 *   rhythm:      object|null,      // { icon, label }
 *   continuity:  object|null,      // { isBridge, domains, label }
 *   signature:   string|null,      // Resonance-Signatur Satz
 * }}
 */
export function usePresenceBridge(profileId) {
  // Legacy: primitiver String-Status (für Online-Dot)
  const presenceStatus = usePresenceLegacy(profileId ?? undefined);
  const presenceInfo   = getPresenceLabel(presenceStatus);

  // Creative: Phase 6G Presence-Objekt
  const { presence: creativePresence } = usePresence(profileId || null);

  const hasCreative  = hasPresenceData(creativePresence);
  const showRhythm   = shouldShowRhythm(creativePresence);
  const showBridge   = shouldShowBridge(creativePresence);
  const rhythm       = formatRhythm(creativePresence);
  const continuity   = formatContinuity(creativePresence);
  const signature    = creativePresence?.signature?.full || null;

  return {
    presenceStatus,
    presenceInfo,
    creativePresence,
    hasCreative,
    showRhythm,
    showBridge,
    rhythm,
    continuity,
    signature,
  };
}