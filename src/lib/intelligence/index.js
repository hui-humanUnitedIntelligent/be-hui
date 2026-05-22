// src/lib/intelligence/index.js
// HUI Intelligence Layer — clean re-export surface

export {
  // Core engine
  buildEmotionalIdentity,
  identityDrift,

  // Integration helpers
  attachEmotionalIdentity,
  quickIdentityFromProfile,

  // Memoized selectors
  selectAnimationSpeed,
  selectMotionScale,
  selectAmbientGlow,
  selectGlassOpacity,
  selectAtmosphereLabel,
  isFallbackIdentity,
  debugIdentitySummary,

  // Archetype data (for UI that needs to enumerate them)
  EMOTIONAL_ARCHETYPES,

  // Archetype type reference (for documentation)
  // quiet_creator | warm_connector | deep_reflector
  // gentle_inspirer | curious_explorer | steady_presence
} from "./emotionalIdentity.js";
