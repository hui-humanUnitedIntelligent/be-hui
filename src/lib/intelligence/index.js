// src/lib/intelligence/index.js
// HUI Intelligence Layer — clean re-export surface
// v1: Emotional Identity
// v2: + Relationship Memory
// v3: + Shared Atmosphere

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
  buildRelationshipMemory,
  relationshipDrift,
  decayedSignal,
  attachRelationshipToFeedItem,
  relationshipOrderingBoost,
  mockInteractionsFromItem,
  selectWarmthBoost,
  selectMotionCalm,
  selectCardDelay,
  selectGlowBoost,
  selectRelationshipState,
  selectMicroMoment,
  isFallbackMemory,
  debugMemorySummary,
  RELATIONSHIP_STATES,
  MEMORY_HALF_LIVES,
} from "./relationshipMemory.js";

// ── Shared Atmosphere ─────────────────────────────────────────────────────
export {
  // Core engine
  buildSharedAtmosphere,
  atmosphereDrift,

  // Feed integration
  applyAtmosphereToFeed,

  // Mock factories (dev mode)
  mockActivityFromFeed,
  mockResonanceFromFeed,

  // Selectors
  selectSurfaceTint,
  selectAtmMotionScale,
  selectStaggerMultiplier,
  selectGlowSoftening,
  selectWhisper,
  selectQuietSpaceTone,
  isFallbackAtmosphere,
  debugAtmosphereSummary,

  // Data constants
  COLLECTIVE_ATMOSPHERES,
} from "./sharedAtmosphere.js";
