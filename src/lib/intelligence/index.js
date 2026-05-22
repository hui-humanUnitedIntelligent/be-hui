// src/lib/intelligence/index.js — HUI Intelligence Platform v6
// One continuous living world, composed of six interconnected layers.
//
// v1: Emotional Identity     — every person has a signature
// v2: Relationship Memory    — trust grows between people
// v3: Shared Atmosphere      — the community has weather
// v4: Resonance Spaces       — the world has rooms
// v5: Discover World         — the world has geography
// v6: World Continuity       — the world breathes as one

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
  mockDiscoverWorldFromFeed, pillToDistrict, getDistrictVisual,
  selectDiscoverAmbient, selectPrimaryDistrict, selectWanderingPath,
  selectWorldWhisper as selectDiscoverWhisper,
  selectDistrictAccent, selectDiscoverBg, selectDiscoverMotionScale,
  selectRevealDelay, isEmptyWorld, debugWorldSummary, DISCOVER_DISTRICTS,
} from "./discoverWorld.js";

// ─────────────────────────────────────────────────────────────
// LAYER 7: World Polish — last-mile CSS/animation utilities
// ─────────────────────────────────────────────────────────────
export {
  // Orb
  orbAtmosphereFromWorld,
  // Profiles
  profileAtmosphereFromWorld,
  // Discover districts
  districtTransitionTokens,
  // Empty states
  emptyStateFromWorld,
  // Motion harmonization
  harmonizedMotion,
  // Settings screens
  settingsAtmosphereFromWorld,
  // Notification quietness
  quietNotificationTokens,
  // Tab transitions
  carryOverEntryStyle,
  // Global CSS
  WORLD_CSS,
} from "./worldPolish.js";

export {
  // Core engine
  buildWorldContinuity, worldDrift, buildWorldFromLayers,
  // Convenience
  computeTransitionCarryOver, mockWorldFromAtmosphere,
  // Selectors
  selectTemperatureId, selectWorldBreath, selectSurface, selectCarryOver,
  selectWorldWhisper, selectTraces,
  selectSurfaceMotionScale, selectSurfaceGlowScale,
  selectWarmthNudge, selectBreathPeriod,
  isEmptyWorldState, debugWorldState,
  // Data
  WORLD_TEMPERATURES, WORLD_SURFACES,
} from "./worldContinuity.js";

// ─────────────────────────────────────────────────────────────────
// LAYER 8: Interaction Store — privacy-safe local interaction memory
// ─────────────────────────────────────────────────────────────────
export {
  recordInteraction,
  readInteractions,
  buildInteractionMap,
  getKnownCreatorIds,
  clearInteractionStore,
} from "./interactionStore.js";

// ─────────────────────────────────────────────────────────────────
// LAYER 8b: Living Memory Persistence (v2) — throttled, versioned, hydrated
// ─────────────────────────────────────────────────────────────────
export {
  recordMemory,
  recordDwell,
  readCreatorMemory,
  buildMemoryMap,
  hydrateStore,
  clearMemoryStore,
  flushAllPending,
} from "./persistence/interactionMemoryStore.js";

export {
  buildViewerContext,
  buildAnonymousViewerContext,
} from "./persistence/viewerContext.js";

export {
  resolveMemoryTokens,
  applyMemoryToCardStyle,
  memoryAdjustedDelay,
} from "./persistence/memoryTokens.js";

export {
  useLivingMemory,
  useDwellTracker,
} from "./persistence/useLivingMemory.js";
