// src/lib/creativeJourney/index.js — minimal stub
// presence/index.js importiert detectJourneyPhase + computeJourneyDepth

export function detectJourneyPhase(s) {
  if (!s) return 'active';
  const { bookingCount = 0, workCount = 0 } = s;
  if (bookingCount > 10 && workCount > 5) return 'established';
  if (bookingCount > 0  || workCount > 0) return 'growing';
  return 'active';
}
export function computeJourneyDepth(s) {
  if (!s) return 0;
  const { bookingCount = 0, workCount = 0, followerCount = 0 } = s;
  return Math.min(1, (bookingCount * 0.05) + (workCount * 0.1) + (followerCount * 0.02));
}
