// src/lib/intelligence/index.js
// HUI Intelligence Layer — clean re-export surface
// v1: Emotional Identity
// v2: + Relationship Memory

// ── Emotional Identity ────────────────────────────────────────────────────
export {
  buildEmotionalIdentity,
  identityDrift,
  attachEmotionalIdentity,
  quickIdentityFromProfile,
  selectAnimationSpeed,
  selectMotionScale,
  selectAmbientGlow,
  selectGlassOpacity,
  selectAtmosphereLabel,
  isFallbackIdentity,
  debugIdentitySummary,
  EMOTIONAL_ARCHETYPES,
} from "./emotionalIdentity.js";

// ── Relationship Memory ───────────────────────────────────────────────────
export {
  // Core engine
  buildRelationshipMemory,
  relationshipDrift,
  decayedSignal,

  // Feed integration
  attachRelationshipToFeedItem,
  relationshipOrderingBoost,
  mockInteractionsFromItem,

  // Selectors
  selectWarmthBoost,
  selectMotionCalm,
  selectCardDelay,
  selectGlowBoost,
  selectRelationshipState,
  selectMicroMoment,
  isFallbackMemory,
  debugMemorySummary,

  // Data constants
  RELATIONSHIP_STATES,
  MEMORY_HALF_LIVES,
} from "./relationshipMemory.js";
