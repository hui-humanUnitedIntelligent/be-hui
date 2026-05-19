// src/lib/creativeJourney/index.js
// Stub — creativeJourney wurde in Phase A entfernt
// presence/index.js importiert detectJourneyPhase + computeJourneyDepth

/**
 * Erkennt die aktuelle Journey-Phase eines Creators.
 * Stub: gibt immer 'active' zurück.
 * @param {Object} journeySignals
 * @returns {string} phase
 */
export function detectJourneyPhase(journeySignals) {
  if (!journeySignals) return 'active';
  const { bookingCount = 0, workCount = 0 } = journeySignals;
  if (bookingCount > 10 && workCount > 5) return 'established';
  if (bookingCount > 0  || workCount > 0) return 'growing';
  return 'active';
}

/**
 * Berechnet die Journey-Tiefe (0–1).
 * Stub: einfache Heuristik.
 * @param {Object} journeySignals
 * @returns {number} depth 0–1
 */
export function computeJourneyDepth(journeySignals) {
  if (!journeySignals) return 0;
  const { bookingCount = 0, workCount = 0, followerCount = 0 } = journeySignals;
  const score = Math.min(1, (bookingCount * 0.05) + (workCount * 0.1) + (followerCount * 0.02));
  return Math.round(score * 100) / 100;
}
