// src/lib/intelligence/index.js
// HUI Intelligence Layer — clean re-export surface
// v1: Emotional Identity
// v2: + Relationship Memory
// v3: + Shared Atmosphere
// v4: + Resonance Spaces

// ── Emotional Identity ────────────────────────────────────────────────────
export {
  buildEmotionalIdentity, identityDrift,
  attachEmotionalIdentity, quickIdentityFromProfile,
  selectAnimationSpeed, selectMotionScale, selectAmbientGlow,
  selectGlassOpacity, selectAtmosphereLabel,
  isFallbackIdentity, debugIdentitySummary,
  EMOTIONAL_ARCHETYPES,
} from "./emotionalIdentity.js";

// ── Relationship Memory ───────────────────────────────────────────────────
export {
  buildRelationshipMemory, relationshipDrift, decayedSignal,
  attachRelationshipToFeedItem, relationshipOrderingBoost, mockInteractionsFromItem,
  selectWarmthBoost, selectMotionCalm, selectCardDelay, selectGlowBoost,
  selectRelationshipState, selectMicroMoment,
  isFallbackMemory, debugMemorySummary,
  RELATIONSHIP_STATES, MEMORY_HALF_LIVES,
} from "./relationshipMemory.js";

// ── Shared Atmosphere ─────────────────────────────────────────────────────
export {
  buildSharedAtmosphere, atmosphereDrift, applyAtmosphereToFeed,
  mockActivityFromFeed, mockResonanceFromFeed,
  selectSurfaceTint, selectAtmMotionScale, selectStaggerMultiplier,
  selectGlowSoftening, selectWhisper, selectQuietSpaceTone,
  isFallbackAtmosphere, debugAtmosphereSummary,
  COLLECTIVE_ATMOSPHERES,
} from "./sharedAtmosphere.js";

// ── Resonance Spaces ──────────────────────────────────────────────────────
export {
  // Core engine
  buildResonanceSpaces, spaceFade,

  // Space memory traces
  createSpaceTrace, spaceReEntryWarmth,

  // Mock factory
  mockResonanceSpacesFromFeed, registerMockFactories,

  // Selectors
  selectDominantSpace, selectAmbient, selectSpaceWhisper,
  selectSpaceMotionScale, selectFloatPeriod, selectPresenceSync,
  selectSpaceSurfaceTint, selectRingPulse,
  isEmptySpaceResult, debugSpacesSummary,

  // Archetype data
  SPACE_ARCHETYPES,
} from "./resonanceSpaces.js";
