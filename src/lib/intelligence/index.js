// src/lib/intelligence/index.js
// HUI Intelligence Layer — v5
// v1: Emotional Identity  v2: +Relationship Memory
// v3: +Shared Atmosphere  v4: +Resonance Spaces  v5: +Discover World

export {
  buildEmotionalIdentity, identityDrift, attachEmotionalIdentity, quickIdentityFromProfile,
  selectAnimationSpeed, selectMotionScale, selectAmbientGlow, selectGlassOpacity,
  selectAtmosphereLabel, isFallbackIdentity, debugIdentitySummary, EMOTIONAL_ARCHETYPES,
} from "./emotionalIdentity.js";

export {
  buildRelationshipMemory, relationshipDrift, decayedSignal,
  attachRelationshipToFeedItem, relationshipOrderingBoost, mockInteractionsFromItem,
  selectWarmthBoost, selectMotionCalm, selectCardDelay, selectGlowBoost,
  selectRelationshipState, selectMicroMoment, isFallbackMemory, debugMemorySummary,
  RELATIONSHIP_STATES, MEMORY_HALF_LIVES,
} from "./relationshipMemory.js";

export {
  buildSharedAtmosphere, atmosphereDrift, applyAtmosphereToFeed,
  mockActivityFromFeed, mockResonanceFromFeed,
  selectSurfaceTint, selectAtmMotionScale, selectStaggerMultiplier,
  selectGlowSoftening, selectWhisper, selectQuietSpaceTone,
  isFallbackAtmosphere, debugAtmosphereSummary, COLLECTIVE_ATMOSPHERES,
} from "./sharedAtmosphere.js";

export {
  buildResonanceSpaces, spaceFade, createSpaceTrace, spaceReEntryWarmth,
  mockResonanceSpacesFromFeed, registerMockFactories,
  selectDominantSpace, selectAmbient, selectSpaceWhisper, selectSpaceMotionScale,
  selectFloatPeriod, selectPresenceSync, selectSpaceSurfaceTint, selectRingPulse,
  isEmptySpaceResult, debugSpacesSummary, SPACE_ARCHETYPES,
} from "./resonanceSpaces.js";

export {
  buildDiscoverWorld, discoverDrift, assignItemsToDistricts,
  mockDiscoverWorldFromFeed,
  pillToDistrict, getDistrictVisual,
  selectDiscoverAmbient, selectPrimaryDistrict, selectWanderingPath,
  selectWorldWhisper, selectDistrictAccent, selectDiscoverBg,
  selectDiscoverMotionScale, selectRevealDelay,
  isEmptyWorld, debugWorldSummary,
  DISCOVER_DISTRICTS,
} from "./discoverWorld.js";
