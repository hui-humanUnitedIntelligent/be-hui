// worldContinuity.js — HUI World Continuity Engine v1
//
// Philosophy: "a living emotional world that people quietly inhabit together"
//
// This is the final intelligence layer. It doesn't compute new things —
// it connects everything that already exists into one coherent organism.
//
// The feed, Discover, Spaces, Profiles, and Orb are not separate screens.
// They are different rooms in the same living world.
// When one room fills with warm creative energy, the others feel it — slowly.
//
// ── What this engine does ──────────────────────────────────────────────────
//   • Aggregates all intelligence layers into one WorldState
//   • Derives world-level emotional temperature and rhythm
//   • Computes ripples (cross-layer emotional propagation)
//   • Provides worldBreath (synchronized motion across all surfaces)
//   • Enables atmospheric carry-over during tab/page transitions
//   • Leaves creative traces without visible records
//
// ── What this engine does NOT do ──────────────────────────────────────────
//   • Does not render anything
//   • Does not notify the user
//   • Does not store data in any database
//   • Does not override individual layer logic — only nudges
//
// ── Architecture ──────────────────────────────────────────────────────────
//   • Pure function — no mutations, no side effects
//   • Deterministic — same inputs → same world state
//   • SSR-safe — no browser APIs without guards
//   • Null-safe — every input has a fallback path
//   • All effects are additive nudges on existing tokens
//   • Maximum effect on any token: ±8% (enforced by clamp)
// ─────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: WORLD EMOTIONAL TEMPERATURES
// The world has seven emotional temperatures — composite states
// that emerge from combining all intelligence layers.
// These are the lingua franca between all parts of the world.
// ═══════════════════════════════════════════════════════════════════════════

export const WORLD_TEMPERATURES = Object.freeze({

  warm_creative:    Object.freeze({ id:"warm_creative",    warmth:0.72, depth:0.28, speed:0.96, glow:1.06 }),
  quiet_deep:       Object.freeze({ id:"quiet_deep",       warmth:0.28, depth:0.82, speed:0.74, glow:0.82 }),
  night_still:      Object.freeze({ id:"night_still",      warmth:0.18, depth:0.90, speed:0.62, glow:0.72 }),
  human_warm:       Object.freeze({ id:"human_warm",       warmth:0.88, depth:0.50, speed:0.92, glow:1.04 }),
  inspired_clear:   Object.freeze({ id:"inspired_clear",   warmth:0.52, depth:0.52, speed:1.02, glow:1.10 }),
  soft_emerging:    Object.freeze({ id:"soft_emerging",    warmth:0.46, depth:0.42, speed:0.90, glow:0.96 }),
  calm_flowing:     Object.freeze({ id:"calm_flowing",     warmth:0.42, depth:0.42, speed:0.92, glow:0.94 }),

});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: WORLD SURFACES
// The 5 surfaces of the HUI world that share atmosphere.
// Each surface receives ripples differently.
// ═══════════════════════════════════════════════════════════════════════════

export const WORLD_SURFACES = Object.freeze([
  "feed",        // Home feed — most reactive (user spends most time here)
  "discover",    // Discover world — medium reactive
  "spaces",      // Resonance spaces — slow, stable
  "profiles",    // Creator profiles — subtle, personal
  "orb",         // HUI Orb — always feels the world
]);

// How quickly each surface absorbs ripples from others (0-1 sensitivity)
const SURFACE_SENSITIVITY = {
  feed:     0.85,  // most sensitive — very responsive
  discover: 0.65,  // medium
  spaces:   0.48,  // slower — spaces have their own stability
  profiles: 0.55,  // personal — absorbs thoughtfully
  orb:      0.90,  // orb always feels the world — most attuned
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: NULL-SAFE INPUT NORMALIZERS
// ═══════════════════════════════════════════════════════════════════════════

const safeNum  = (v, fb=0) => { const n=Number(v); return (isNaN(n)||!isFinite(n)) ? fb : n; };
const safeStr  = (v, fb="") => (v!=null && typeof v==="string") ? v : fb;
const safeArr  = (v)         => Array.isArray(v) ? v.filter(Boolean) : [];

function normalizeAtmosphere(raw) {
  if (!raw || typeof raw !== "object") return { id:"calm_transition", motionScale:1, warmthDelta:0, glowSoftening:1, cardBlurDelta:0 };
  return {
    id:            safeStr(raw.id, "calm_transition"),
    motionScale:   safeNum(raw.motionScale, 1.0),
    warmthDelta:   safeNum(raw.warmthDelta, 0),
    glowSoftening: safeNum(raw.glowSoftening, 1.0),
    cardBlurDelta: safeNum(raw.cardBlurDelta, 0),
    staggerMultiplier: safeNum(raw.staggerMultiplier, 1.0),
  };
}

function normalizeSpaces(raw) {
  if (!raw || typeof raw !== "object") return { dominantId:null, strength:"faint", motionScale:1, warmthBoost:0, glowAmplification:1, _empty:true };
  return {
    dominantId:        safeStr(raw.dominant?.id),
    strength:          safeStr(raw.dominant?.strength, "faint"),
    motionScale:       safeNum(raw.ambient?.motionScale, 1),
    warmthBoost:       safeNum(raw.ambient?.warmthBoost, 0),
    glowAmplification: safeNum(raw.ambient?.glowAmplification, 1),
    _empty:            raw._empty !== false,
  };
}

function normalizeRelationships(raw) {
  if (!raw) return { avgScore:0, strongCount:0, totalCount:0 };
  if (Array.isArray(raw)) {
    const valid = raw.filter(r => r && !r._fallback && typeof r.resonanceScore === "number");
    return {
      avgScore:    valid.length ? valid.reduce((s,r)=>s+r.resonanceScore,0)/valid.length : 0,
      strongCount: valid.filter(r=>r.resonanceScore>0.44).length,
      totalCount:  valid.length,
    };
  }
  return {
    avgScore:    safeNum(raw.avgScore),
    strongCount: safeNum(raw.strongCount),
    totalCount:  safeNum(raw.totalCount),
  };
}

function normalizeIdentities(raw) {
  const items = safeArr(raw);
  const freq  = {};
  for (const id of items) {
    const archetype = safeStr(id?.emotionalIdentity?.id || id?.archetype);
    if (archetype) freq[archetype] = (freq[archetype] || 0) + 1;
  }
  const dominant = Object.entries(freq).sort(([,a],[,b])=>b-a)[0]?.[0] || null;
  return { archetypeFrequency:freq, dominantArchetype:dominant, count:items.length };
}

function normalizeDiscoverWorld(raw) {
  if (!raw || raw._empty) return { primaryDistrict:null, motionScale:0.92, bgWarmth:0, _empty:true };
  return {
    primaryDistrict: safeStr(raw.primary?.id),
    motionScale:     safeNum(raw.ambient?.motionScale, 0.92),
    bgWarmth:        safeNum(raw.ambient?.warmthBoost, 0),
    _empty:          false,
  };
}

function normalizeFeedState(raw) {
  if (!raw || typeof raw !== "object") return { avgResonanz:0, avgBerührt:0, dominantPresence:null, emotionalDensity:0 };
  return {
    avgResonanz:      safeNum(raw.avgResonanz  || raw.feedSignals?.avgResonanz),
    avgBerührt:       safeNum(raw.avgBerührt   || raw.feedSignals?.avgBerührt),
    dominantPresence: safeStr(raw.dominantPresence || raw.feedSignals?.dominantPresence),
    emotionalDensity: safeNum(raw.emotionalDensity || raw.feedSignals?.emotionalDensity),
    workRatio:        safeNum(raw.workRatio    || raw.feedSignals?.workRatio),
    noteRatio:        safeNum(raw.noteRatio    || raw.feedSignals?.noteRatio),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: WORLD TEMPERATURE DERIVATION
// From all 5 intelligence layers → one composite world temperature.
// ═══════════════════════════════════════════════════════════════════════════

function deriveWorldTemperature(atm, spaces, rels, identities, discover, feed) {
  // Each layer contributes a vote with weight
  const votes = {};

  // ── Shared Atmosphere vote ───────────────────────────────────────
  const atmMap = {
    warm_creation:          "warm_creative",
    collective_inspiration: "inspired_clear",
    gentle_gathering:       "human_warm",
    quiet_reflection:       "quiet_deep",
    deep_night_presence:    "night_still",
    soft_emergence:         "soft_emerging",
    calm_transition:        "calm_flowing",
  };
  const atmTemp = atmMap[atm.id] || "calm_flowing";
  vote(votes, atmTemp, 0.28);

  // ── Resonance Spaces vote ────────────────────────────────────────
  const spaceMap = {
    warm_creation:       "warm_creative",
    quiet_reflection:    "quiet_deep",
    night_presence:      "night_still",
    gentle_gathering:    "human_warm",
    shared_inspiration:  "inspired_clear",
    soft_emergence:      "soft_emerging",
    deep_focus:          "quiet_deep",
    human_connection:    "human_warm",
  };
  if (!spaces._empty && spaces.dominantId) {
    const spTemp = spaceMap[spaces.dominantId] || "calm_flowing";
    const spW    = spaces.strength === "strong" ? 0.28
                 : spaces.strength === "moderate" ? 0.20
                 : spaces.strength === "emerging"  ? 0.12
                 : 0.06;
    vote(votes, spTemp, spW);
  }

  // ── Discover World vote ──────────────────────────────────────────
  const districtMap = {
    quiet_makers:     "quiet_deep",
    night_thoughts:   "night_still",
    warm_gatherings:  "human_warm",
    living_works:     "warm_creative",
    gentle_resonance: "inspired_clear",
    creative_rituals: "soft_emerging",
    human_connection: "human_warm",
    slow_inspiration: "quiet_deep",
  };
  if (!discover._empty && discover.primaryDistrict) {
    const discTemp = districtMap[discover.primaryDistrict] || "calm_flowing";
    vote(votes, discTemp, 0.20);
  }

  // ── Relationship vote ────────────────────────────────────────────
  if (rels.avgScore > 0.55 || rels.strongCount > 3) {
    vote(votes, "human_warm",   0.12);
  } else if (rels.avgScore > 0.30) {
    vote(votes, "soft_emerging",0.08);
  }

  // ── Feed state vote ──────────────────────────────────────────────
  if (feed.workRatio > 0.50)  vote(votes, "warm_creative",  0.08);
  if (feed.noteRatio > 0.40)  vote(votes, "quiet_deep",     0.08);
  if (feed.dominantPresence === "gathering") vote(votes, "human_warm", 0.08);
  if (feed.emotionalDensity > 0.60) vote(votes, "quiet_deep",  0.06);

  // ── Identity vote (who is around) ───────────────────────────────
  const idMap = {
    quiet_creator:    "quiet_deep",
    deep_reflector:   "night_still",
    warm_connector:   "human_warm",
    gentle_inspirer:  "inspired_clear",
    curious_explorer: "soft_emerging",
    steady_presence:  "calm_flowing",
  };
  if (identities.dominantArchetype && idMap[identities.dominantArchetype]) {
    vote(votes, idMap[identities.dominantArchetype], 0.04);
  }

  // ── Find winning temperature ─────────────────────────────────────
  const winner = Object.entries(votes).sort(([,a],[,b])=>b-a)[0]?.[0] || "calm_flowing";
  const confidence = deriveConfidence(votes);

  return {
    temperature:  WORLD_TEMPERATURES[winner] || WORLD_TEMPERATURES.calm_flowing,
    votes,
    confidence,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: WORLD RIPPLE SYSTEM
// Emotional propagation from dominant sources to all surfaces.
// Maximum effect ±8% on any token (strict clamp at consumer).
// Half-life 30min — ripples fade naturally.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Computes ripple effects from dominant world signals.
 *
 * @param {object} temp   — world temperature result
 * @param {object} atm    — normalized atmosphere
 * @param {object} spaces — normalized spaces
 * @returns {WorldRipple} — per-surface ripple tokens
 */
function computeRipples(temp, atm, spaces) {
  const t = temp.temperature;
  const conf = temp.confidence;

  // Base ripple magnitudes — scaled by confidence (weaker when uncertain)
  const magnitude = clamp(conf * 0.6, 0.05, 0.50);

  // Ripple tokens — additive nudges on each surface's base tokens
  // All values are deltas, max abs = 0.08
  const baseRipple = {
    warmthNudge:   clamp((t.warmth - 0.50) * 0.14 * magnitude, -0.08, 0.08),
    motionNudge:   clamp((t.speed  - 1.00) * 0.10 * magnitude, -0.08, 0.08),
    glowNudge:     clamp((t.glow   - 1.00) * 0.10 * magnitude, -0.08, 0.08),
    depthNudge:    clamp((t.depth  - 0.50) * 0.06 * magnitude, -0.06, 0.06),
  };

  // Apply per-surface sensitivity
  const ripples = {};
  for (const surface of WORLD_SURFACES) {
    const s = SURFACE_SENSITIVITY[surface] ?? 0.5;
    ripples[surface] = Object.freeze({
      warmthNudge: baseRipple.warmthNudge * s,
      motionNudge: baseRipple.motionNudge * s,
      glowNudge:   baseRipple.glowNudge   * s,
      depthNudge:  baseRipple.depthNudge  * s,
    });
  }

  return Object.freeze(ripples);
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: WORLD BREATH
// Synchronized motion pacing across all surfaces.
// Every surface pulses at the same rhythm — barely perceptibly.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Derives the world's synchronized breathing rhythm.
 * All surfaces share these base pacing values, then layer their own on top.
 *
 * @param {object} temp — world temperature
 * @returns {WorldBreath}
 */
function computeWorldBreath(temp) {
  const t = temp.temperature;

  // Base breath period (seconds) — inversely proportional to speed
  const basePeriod = lerp(28, 9, clamp(t.speed - 0.6, 0, 0.5) / 0.5);

  // Transition ease — deeper world → more cinematic curve
  const ease = t.id === "night_still"
    ? "cubic-bezier(0.12,1,0.18,1)"
    : t.id === "quiet_deep"
    ? "cubic-bezier(0.15,1,0.22,1)"
    : t.id === "warm_creative" || t.id === "human_warm"
    ? "cubic-bezier(0.22,1,0.36,1)"
    : "cubic-bezier(0.18,1,0.30,1)";

  // Glow pulse period — surfaces breathe in glow at this rate
  const glowPeriod = Math.round(basePeriod * 1.4);

  // Stagger base — shared interval between card reveals (ms)
  const staggerBase = Math.round(lerp(45, 75, 1 - t.speed));

  return Object.freeze({
    period:         `${Math.round(basePeriod)}s`,
    glowPeriod:     `${glowPeriod}s`,
    ease,
    staggerBase,
    motionScale:    t.speed,
    depthScale:     t.depth,
    glowScale:      t.glow,
    // CSS keyframe duration — all breathing animations use this
    keyframeDuration:`${Math.round(basePeriod * 1000)}ms`,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: CREATIVE TRACES
// Soft atmospheric memory left by creators and visitors.
// No visible ownership — only ambient warmth.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Derives atmospheric traces from relationship + identity signals.
 * These make familiar places feel subtly warmer on re-entry.
 *
 * @returns {Array<CreativeTrace>}
 */
function deriveCreativeTraces(rels, identities, spaces) {
  const traces = [];

  // Strong relationships leave warmth traces in shared spaces
  if (rels.strongCount > 0) {
    traces.push(Object.freeze({
      type:        "relationship_warmth",
      magnitude:   clamp(rels.strongCount * 0.06, 0, 0.28),
      surface:     "profiles",
      halfLifeHrs: 24,
    }));
  }

  // Dominant identity shapes nearby districts
  if (identities.dominantArchetype && identities.count > 2) {
    const identityDistrictMap = {
      quiet_creator:    "quiet_makers",
      deep_reflector:   "night_thoughts",
      warm_connector:   "warm_gatherings",
      gentle_inspirer:  "gentle_resonance",
      curious_explorer: "slow_inspiration",
      steady_presence:  "creative_rituals",
    };
    const district = identityDistrictMap[identities.dominantArchetype];
    if (district) {
      traces.push(Object.freeze({
        type:        "identity_imprint",
        district,
        magnitude:   clamp(identities.count * 0.04, 0, 0.22),
        surface:     "discover",
        halfLifeHrs: 12,
      }));
    }
  }

  // Active spaces leave traces in feed
  if (!spaces._empty && spaces.dominantId) {
    traces.push(Object.freeze({
      type:        "space_echo",
      spaceId:     spaces.dominantId,
      magnitude:   clamp(spaces.warmthBoost * 0.5, 0, 0.18),
      surface:     "feed",
      halfLifeHrs: 6,
    }));
  }

  return traces;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8: TRANSITION CARRY-OVER
// When moving between surfaces, atmospheric context carries over.
// This makes tab switching feel like walking between rooms.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Computes the atmospheric carry-over for a surface transition.
 *
 * @param {string}       fromSurface   — "feed" | "discover" | "spaces" | "profiles" | "orb"
 * @param {string}       toSurface
 * @param {WorldState}   worldState
 * @returns {TransitionCarryOver}
 */
export function computeTransitionCarryOver(fromSurface, toSurface, worldState) {
  if (!fromSurface || !toSurface || !worldState) return buildNullCarryOver();

  const fromRipple = worldState.ripples?.[fromSurface] || buildNullRipple();
  const toSens     = SURFACE_SENSITIVITY[toSurface] ?? 0.5;

  // Carry-over fades during transition — 60% of from-surface ripple arrives at destination
  const carryFactor = 0.60 * toSens;

  return Object.freeze({
    warmthCarry:  fromRipple.warmthNudge * carryFactor,
    motionCarry:  fromRipple.motionNudge * carryFactor,
    glowCarry:    fromRipple.glowNudge   * carryFactor,
    // Transition duration — world temperature sets pacing
    transitionMs: worldState.breath?.staggerBase
      ? worldState.breath.staggerBase * 6
      : 400,
    transitionEase: worldState.breath?.ease || "cubic-bezier(0.22,1,0.36,1)",
    // Atmospheric identity: what the user is "carrying" from
    fromTemperatureId: worldState.temperature?.id || "calm_flowing",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9: MAIN ENGINE — buildWorldContinuity()
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Synthesizes all intelligence layers into one coherent WorldState.
 *
 * @param {SharedAtmosphere}   rawAtmosphere    — from buildSharedAtmosphere()
 * @param {ResonanceSpaces}    rawSpaces        — from buildResonanceSpaces()
 * @param {Array|object}       rawRelationships — relationship memories
 * @param {Array}              rawIdentities    — emotional identities
 * @param {DiscoverWorld}      rawDiscoverWorld — from buildDiscoverWorld()
 * @param {object}             rawFeedState     — feedSignals from curateHumaneFeed
 *
 * @returns {WorldState} — frozen object
 *   {
 *     temperature:     WorldTemperature,   // composite emotional state
 *     ripples:         { [surface]: RippleTokens },
 *     breath:          WorldBreath,        // synchronized motion pacing
 *     traces:          Array<CreativeTrace>,
 *     whisper:         string | null,      // very rare world whisper
 *     // Per-surface token packages (ready to consume):
 *     feed:            SurfaceTokens,
 *     discover:        SurfaceTokens,
 *     spaces:          SurfaceTokens,
 *     profiles:        SurfaceTokens,
 *     orb:             SurfaceTokens,
 *     _empty:          boolean,
 *   }
 */
export function buildWorldContinuity(
  rawAtmosphere    = {},
  rawSpaces        = {},
  rawRelationships = {},
  rawIdentities    = [],
  rawDiscoverWorld = {},
  rawFeedState     = {},
) {
  const atm       = normalizeAtmosphere(rawAtmosphere);
  const spaces    = normalizeSpaces(rawSpaces);
  const rels      = normalizeRelationships(rawRelationships);
  const identities= normalizeIdentities(rawIdentities);
  const discover  = normalizeDiscoverWorld(rawDiscoverWorld);
  const feed      = normalizeFeedState(rawFeedState);

  // ── 1. World temperature ──────────────────────────────────────────
  const tempResult = deriveWorldTemperature(atm, spaces, rels, identities, discover, feed);

  // ── 2. Ripples ────────────────────────────────────────────────────
  const ripples = computeRipples(tempResult, atm, spaces);

  // ── 3. World breath ───────────────────────────────────────────────
  const breath = computeWorldBreath(tempResult);

  // ── 4. Creative traces ────────────────────────────────────────────
  const traces = deriveCreativeTraces(rels, identities, spaces);

  // ── 5. Per-surface token packages ────────────────────────────────
  const surfaceTokens = {};
  for (const surface of WORLD_SURFACES) {
    surfaceTokens[surface] = buildSurfaceTokens(surface, tempResult, ripples, breath, atm, spaces);
  }

  // ── 6. World whisper ──────────────────────────────────────────────
  const whisper = deriveWorldWhisper(tempResult, atm, spaces, feed);

  return Object.freeze({
    temperature:  tempResult.temperature,
    votes:        tempResult.votes,     // INTERNAL — never display
    confidence:   tempResult.confidence,
    ripples,
    breath,
    traces,
    whisper,
    ...surfaceTokens,
    _empty: false,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 10: SURFACE TOKEN PACKAGES
// Ready-to-consume token objects for each surface.
// Components import only what they need.
// ═══════════════════════════════════════════════════════════════════════════

function buildSurfaceTokens(surface, temp, ripples, breath, atm, spaces) {
  const t = temp.temperature;
  const r = ripples[surface] || buildNullRipple();

  // Base tokens from world temperature — all very subtle
  return Object.freeze({
    // Motion
    motionScale:      clamp(breath.motionScale + r.motionNudge, 0.60, 1.10),
    transitionEase:   breath.ease,
    staggerBase:      breath.staggerBase,
    breathPeriod:     breath.period,
    keyframeDuration: breath.keyframeDuration,

    // Color warmth — added on top of surface's base
    warmthNudge:   clamp(r.warmthNudge,  -0.08, 0.08),
    depthNudge:    clamp(r.depthNudge,   -0.06, 0.06),

    // Glow
    glowScale:     clamp(t.glow + r.glowNudge, 0.70, 1.15),

    // Atmosphere carry-over hint (CSS variable ready)
    atmosphereId:  temp.temperature.id,
    temperatureId: temp.temperature.id,

    // Surface-specific: orb gets full world temperature
    ...(surface === "orb" ? {
      orbPulsePeriod: breath.glowPeriod,
      orbDepth:       t.depth,
      orbWarmth:      t.warmth,
      orbGlow:        t.glow,
    } : {}),
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 11: WORLD CONTINUITY DRIFT
// The world evolves over time — no abrupt shifts.
// 90-minute half-life — slower than any individual layer.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Blends past world state with fresh computation over time.
 * The world feels continuous — like weather, not a switch.
 *
 * @param {WorldState} pastState
 * @param {WorldState} freshState
 * @param {number}     minutesElapsed
 * @returns {WorldState}
 */
export function worldDrift(pastState, freshState, minutesElapsed = 0) {
  if (!pastState || pastState._empty) return freshState;
  if (!freshState)                     return pastState;

  // World transitions are the slowest of all layers — 90min half-life
  const WORLD_HALF_LIFE = 90;
  const t = clamp(1 - Math.pow(0.5, minutesElapsed / WORLD_HALF_LIFE), 0, 0.94);

  // Blend per-surface motion scale and warmth nudge
  const blendSurface = (past, fresh) => {
    if (!past || !fresh) return fresh || past;
    return Object.freeze({
      ...fresh,
      motionScale: lerp(safeNum(past.motionScale, 1), safeNum(fresh.motionScale, 1), t),
      glowScale:   lerp(safeNum(past.glowScale,   1), safeNum(fresh.glowScale,   1), t),
      warmthNudge: lerp(safeNum(past.warmthNudge, 0), safeNum(fresh.warmthNudge, 0), t),
      // Qualitative tokens switch at 50%
      transitionEase: t > 0.5 ? fresh.transitionEase : past.transitionEase,
      atmosphereId:   t > 0.5 ? fresh.atmosphereId   : past.atmosphereId,
    });
  };

  const blendedSurfaces = {};
  for (const surface of WORLD_SURFACES) {
    blendedSurfaces[surface] = blendSurface(pastState[surface], freshState[surface]);
  }

  return Object.freeze({
    ...freshState,
    ...blendedSurfaces,
    // Breath switches at 60%
    breath:      t > 0.6 ? freshState.breath : pastState.breath,
    // Temperature switches at 50%
    temperature: t > 0.5 ? freshState.temperature : pastState.temperature,
    // Whisper always from fresh
    whisper:     freshState.whisper,
    traces:      freshState.traces,
    _driftT:     t,
    _empty:      false,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 12: MEMOIZED SELECTORS
// ═══════════════════════════════════════════════════════════════════════════

/** Returns world temperature id. */
export function selectTemperatureId(ws) { return ws?.temperature?.id ?? "calm_flowing"; }

/** Returns world breath object (synchronized pacing). */
export function selectWorldBreath(ws) { return ws?.breath ?? buildNullBreath(); }

/** Returns surface tokens for a given surface. */
export function selectSurface(ws, surface) { return ws?.[surface] ?? buildNullSurfaceTokens(); }

/** Returns the carry-over token for a transition between surfaces. */
export function selectCarryOver(ws, from, to) { return computeTransitionCarryOver(from, to, ws); }

/** Returns the world whisper or null. */
export function selectWorldWhisper(ws) { return ws?.whisper ?? null; }

/** Returns all creative traces. */
export function selectTraces(ws) { return ws?.traces ?? []; }

/** Returns motion scale for a given surface. */
export function selectSurfaceMotionScale(ws, surface) {
  const s = ws?.[surface]?.motionScale;
  return (typeof s === "number" && !isNaN(s)) ? clamp(s, 0.60, 1.10) : 1.0;
}

/** Returns glow scale for a given surface. */
export function selectSurfaceGlowScale(ws, surface) {
  const s = ws?.[surface]?.glowScale;
  return (typeof s === "number" && !isNaN(s)) ? clamp(s, 0.70, 1.15) : 1.0;
}

/** Returns warmth nudge for a given surface (−0.08–+0.08). */
export function selectWarmthNudge(ws, surface) {
  return clamp(ws?.[surface]?.warmthNudge ?? 0, -0.08, 0.08);
}

/** Returns breath period CSS string for a given surface. */
export function selectBreathPeriod(ws, surface) {
  return ws?.[surface]?.breathPeriod ?? ws?.breath?.period ?? "16s";
}

/** Returns true if world state is empty/uninitialized. */
export function isEmptyWorldState(ws) { return !ws || ws._empty === true; }

/** Debug summary — NEVER pass to user UI. */
export function debugWorldState(ws) {
  if (!ws || ws._empty) return "[empty world]";
  const votes = ws.votes
    ? Object.entries(ws.votes).sort(([,a],[,b])=>b-a).slice(0,3)
        .map(([k,v])=>`${k.split("_")[0]}:${v.toFixed(2)}`).join(" ")
    : "";
  return `[${ws.temperature?.id}] conf:${(ws.confidence*100).toFixed(0)}% | ${votes} | breath:${ws.breath?.period}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 13: WORLD WHISPER DERIVATION
// Very rare — maybe once per session at most.
// The world itself speaks — never a UI notification.
// ═══════════════════════════════════════════════════════════════════════════

const WORLD_WHISPER_POOLS = {
  warm_creative:  [
    "Kreative Energie verbindet heute viele Orte.",
    "Etwas Warmes bewegt die Welt gerade.",
    "Viele Hände schaffen heute gemeinsam Schönes.",
  ],
  quiet_deep: [
    "Ein ruhiger Abend breitet sich langsam aus.",
    "Stille Gedanken tragen die Welt gerade.",
    "Diese Stimmung wandert gerade durch die Welt.",
  ],
  night_still: [
    "Die Welt atmet langsam und tief heute Nacht.",
    "Tiefe Stille verbindet die kreative Welt.",
    "Ein ruhiges Licht hält die Gemeinschaft zusammen.",
  ],
  human_warm: [
    "Etwas Gemeinsames bewegt die Welt heute.",
    "Warme menschliche Verbindungen tragen die Welt gerade.",
    "Menschen finden heute auf natürliche Weise zueinander.",
  ],
  inspired_clear: [
    "Kreative Energie verbindet heute viele Orte.",
    "Eine klare Inspiration trägt die Welt gerade.",
    "Viele Gedanken finden heute ihren Ausdruck.",
  ],
  soft_emerging: [
    "Etwas Neues entsteht leise in der Welt.",
    "Neue kreative Energien verbinden sich gerade.",
    "Die Welt wächst heute still und schön.",
  ],
  calm_flowing: [
    "Die Welt bewegt sich heute ruhig und gleichmäßig.",
    "Ein sanfter Fluss trägt die kreative Gemeinschaft.",
  ],
};

function deriveWorldWhisper(temp, atm, spaces, feed) {
  // Very rare: strong temperature + confident + deterministic hash
  if (temp.confidence < 0.18) return null;

  const hash = Math.floor(
    (feed.workRatio * 131 + feed.noteRatio * 97 + feed.avgBerührt * 19) * 100
  ) % 11;
  if (hash !== 0) return null;  // ~9% of qualifying moments

  const pool = WORLD_WHISPER_POOLS[temp.temperature.id];
  if (!pool?.length) return null;

  const idx = Math.floor(
    (feed.avgResonanz * 7 + feed.emotionalDensity * 13) * 100
  ) % pool.length;
  return pool[idx];
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 14: MOCK FACTORY
// Build WorldState from minimal inputs (dev mode, no Supabase).
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Builds a WorldState from a sharedAtmosphere alone.
 * All other layers default to neutral values.
 */
export function mockWorldFromAtmosphere(sharedAtmosphere) {
  return buildWorldContinuity(
    sharedAtmosphere || {},
    {},   // no spaces
    {},   // no relationships
    [],   // no identities
    {},   // no discover world
    sharedAtmosphere?.feedSignals || {},
  );
}

/**
 * Builds a WorldState from all available intelligence layer outputs.
 * Convenience wrapper for components that have all layers computed.
 */
export function buildWorldFromLayers({
  atmosphere    = {},
  spaces        = {},
  relationships = {},
  identities    = [],
  discoverWorld = {},
  feedState     = {},
} = {}) {
  return buildWorldContinuity(
    atmosphere, spaces, relationships, identities, discoverWorld, feedState
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function vote(votes, temp, weight) {
  votes[temp] = (votes[temp] || 0) + weight;
}

function deriveConfidence(votes) {
  const vals  = Object.values(votes).sort((a,b)=>b-a);
  if (vals.length < 2 || vals[0] === 0) return 0;
  return clamp((vals[0] - (vals[1] || 0)) / vals[0], 0, 1);
}

function clamp(v, min, max) {
  if (typeof v !== "number" || isNaN(v)) return min;
  return Math.min(Math.max(v, min), max);
}

function lerp(a, b, t) { return a + (b - a) * clamp(t, 0, 1); }

function buildNullRipple() {
  return Object.freeze({ warmthNudge:0, motionNudge:0, glowNudge:0, depthNudge:0 });
}

function buildNullCarryOver() {
  return Object.freeze({
    warmthCarry:0, motionCarry:0, glowCarry:0,
    transitionMs:400,
    transitionEase:"cubic-bezier(0.22,1,0.36,1)",
    fromTemperatureId:"calm_flowing",
  });
}

function buildNullBreath() {
  return Object.freeze({
    period:"16s", glowPeriod:"22s",
    ease:"cubic-bezier(0.22,1,0.36,1)",
    staggerBase:55, motionScale:0.92, depthScale:0.42, glowScale:0.94,
    keyframeDuration:"16000ms",
  });
}

function buildNullSurfaceTokens() {
  return Object.freeze({
    motionScale:1.0, transitionEase:"cubic-bezier(0.22,1,0.36,1)",
    staggerBase:55, breathPeriod:"16s", keyframeDuration:"16000ms",
    warmthNudge:0, depthNudge:0, glowScale:1.0,
    atmosphereId:"calm_flowing", temperatureId:"calm_flowing",
  });
}
