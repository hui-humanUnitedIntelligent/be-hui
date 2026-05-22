// sharedAtmosphere.js — HUI Shared Atmosphere Engine v1
//
// Philosophy: "collective emotional weather, not trend mechanics"
//
// HUI should feel like a living creative atmosphere shared by real people.
// Not a platform full of content — a space with its own emotional pulse.
//
// This engine reads aggregated feed signals and derives a collective
// atmospheric state that subtly shapes the entire visual experience.
//
// What users feel: "Something is happening in this space today."
// What users never consciously notice: "The app changed its mood."
//
// ── Principles ─────────────────────────────────────────────────────────────
//   • Pure function — no side effects, no mutations
//   • Deterministic — same signals → same atmosphere
//   • SSR-safe — no window/document/Date without guards
//   • Null-safe — every input path has a fallback
//   • Barely visible — effects max 8% opacity shift on any surface
//   • Slow — all transitions are measured in seconds, not milliseconds
//   • Human — it breathes, not reacts
// ─────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: COLLECTIVE ATMOSPHERE STATES
// 7 states — internal only, never surface as labels.
// Each carries a complete visual field definition.
// ═══════════════════════════════════════════════════════════════════════════

export const COLLECTIVE_ATMOSPHERES = Object.freeze({

  quiet_reflection: Object.freeze({
    id:              "quiet_reflection",

    // Micro-moment whispers — very rare, never notifications
    whisperPool: [
      "Viele stille Gedanken finden heute Resonanz.",
      "Die Gemeinschaft ist heute besonders bei sich.",
      "Etwas Ruhiges trägt die Atmosphäre gerade.",
    ],

    // Feed surface adjustments — all subtle
    surfaceTint:      "rgba(139,150,181,0.028)",    // lavender-grey, barely visible
    vignetteColor:    "rgba(100,110,140,0.035)",
    cardBlurDelta:    2,                             // +2px extra blur on glass surfaces
    brightnessDelta:  -0.018,                        // -1.8% brightness (barely perceptible)
    warmthDelta:      -0.008,                        // -0.8% warmth

    // Motion pacing
    motionScale:      0.82,          // slower reveals
    staggerMultiplier:1.18,          // more breathing between cards
    transitionEase:   "cubic-bezier(0.18,1,0.30,1)",
    cardAliveSpeed:   "20s",         // slower breathing animations

    // Ambient color field
    ambientPrimary:   "rgba(139,150,181,0.05)",
    ambientSecondary: "rgba(22,215,197,0.025)",
    glowSoftening:    0.85,          // multiply existing glows by this

    // QuietSpace tone
    quietSpaceTone:   "reflective",
  }),

  warm_creation: Object.freeze({
    id:              "warm_creation",

    whisperPool: [
      "Etwas Warmes bewegt die Gemeinschaft gerade.",
      "Heute entstehen besonders viele Werke.",
      "Kreative Energie liegt in der Luft.",
    ],

    surfaceTint:      "rgba(196,151,58,0.022)",      // very soft gold
    vignetteColor:    "rgba(180,130,50,0.028)",
    cardBlurDelta:    -1,                             // slightly crisper
    brightnessDelta:  0.012,                          // +1.2% brightness
    warmthDelta:      0.022,                          // +2.2% warmth

    motionScale:      0.96,
    staggerMultiplier:0.96,
    transitionEase:   "cubic-bezier(0.22,1,0.36,1)",
    cardAliveSpeed:   "13s",

    ambientPrimary:   "rgba(245,166,35,0.045)",
    ambientSecondary: "rgba(255,138,107,0.030)",
    glowSoftening:    1.05,                           // slightly amplify glows

    quietSpaceTone:   "creative",
  }),

  collective_inspiration: Object.freeze({
    id:              "collective_inspiration",

    whisperPool: [
      "Heute liegt eine ruhige kreative Energie in der Gemeinschaft.",
      "Die Atmosphäre fühlt sich heute besonders verbunden an.",
      "Inspiration bewegt sich leise durch die Gemeinschaft.",
    ],

    surfaceTint:      "rgba(22,215,197,0.020)",       // barely-there teal
    vignetteColor:    "rgba(22,180,170,0.030)",
    cardBlurDelta:    0,
    brightnessDelta:  0.008,
    warmthDelta:      0.012,

    motionScale:      1.02,
    staggerMultiplier:0.92,
    transitionEase:   "cubic-bezier(0.22,1,0.36,1)",
    cardAliveSpeed:   "11s",

    ambientPrimary:   "rgba(22,215,197,0.042)",
    ambientSecondary: "rgba(124,200,160,0.025)",
    glowSoftening:    1.08,

    quietSpaceTone:   "inspired",
  }),

  gentle_gathering: Object.freeze({
    id:              "gentle_gathering",

    whisperPool: [
      "Menschen kommen heute in dieser Gemeinschaft zusammen.",
      "Etwas verbindet die Gemeinschaft gerade sanft.",
      "Eine warme Verbindung trägt die Atmosphäre heute.",
    ],

    surfaceTint:      "rgba(232,131,106,0.018)",      // coral, very soft
    vignetteColor:    "rgba(200,110,90,0.025)",
    cardBlurDelta:    -1,
    brightnessDelta:  0.010,
    warmthDelta:      0.030,                           // warmest state

    motionScale:      1.00,
    staggerMultiplier:0.94,
    transitionEase:   "cubic-bezier(0.20,1,0.32,1)",
    cardAliveSpeed:   "12s",

    ambientPrimary:   "rgba(255,138,107,0.038)",
    ambientSecondary: "rgba(196,151,58,0.020)",
    glowSoftening:    1.06,

    quietSpaceTone:   "warm",
  }),

  deep_night_presence: Object.freeze({
    id:              "deep_night_presence",

    whisperPool: [
      "Die Stille trägt heute mehr als wir denken.",
      "Tiefe Gedanken bewegen die Gemeinschaft in dieser Nacht.",
      "Ein ruhiges Licht hält die Gemeinschaft zusammen.",
    ],

    surfaceTint:      "rgba(60,70,100,0.038)",         // deep blue-grey
    vignetteColor:    "rgba(40,50,80,0.048)",
    cardBlurDelta:    3,                               // deepest blur
    brightnessDelta:  -0.028,                          // slightly darker
    warmthDelta:      -0.015,

    motionScale:      0.72,                            // slowest state
    staggerMultiplier:1.28,
    transitionEase:   "cubic-bezier(0.15,1,0.22,1)",
    cardAliveSpeed:   "24s",                           // deeply slow breathing

    ambientPrimary:   "rgba(80,90,140,0.048)",
    ambientSecondary: "rgba(22,215,197,0.022)",
    glowSoftening:    0.78,                            // quieter glows at night

    quietSpaceTone:   "nocturnal",
  }),

  soft_emergence: Object.freeze({
    id:              "soft_emergence",

    whisperPool: [
      "Etwas Neues entsteht heute leise in der Gemeinschaft.",
      "Neue kreative Energien finden zueinander.",
      "Die Gemeinschaft wächst gerade still.",
    ],

    surfaceTint:      "rgba(124,200,160,0.020)",       // sage green, tender
    vignetteColor:    "rgba(100,180,140,0.025)",
    cardBlurDelta:    0,
    brightnessDelta:  0.006,
    warmthDelta:      0.014,

    motionScale:      0.94,
    staggerMultiplier:1.02,
    transitionEase:   "cubic-bezier(0.20,1,0.34,1)",
    cardAliveSpeed:   "15s",

    ambientPrimary:   "rgba(124,200,160,0.040)",
    ambientSecondary: "rgba(22,215,197,0.028)",
    glowSoftening:    0.95,

    quietSpaceTone:   "emerging",
  }),

  calm_transition: Object.freeze({
    id:              "calm_transition",

    whisperPool: [
      "Die Gemeinschaft atmet gemeinsam.",
      "Ein ruhiger Übergang trägt die Atmosphäre.",
    ],

    // Most neutral — used during drift between states
    surfaceTint:      "rgba(160,176,172,0.015)",
    vignetteColor:    "rgba(140,160,156,0.018)",
    cardBlurDelta:    0,
    brightnessDelta:  0,
    warmthDelta:      0,

    motionScale:      0.92,
    staggerMultiplier:1.00,
    transitionEase:   "cubic-bezier(0.22,1,0.36,1)",
    cardAliveSpeed:   "16s",

    ambientPrimary:   "rgba(160,180,176,0.030)",
    ambientSecondary: "rgba(160,180,176,0.015)",
    glowSoftening:    0.92,

    quietSpaceTone:   "transitional",
  }),

});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: NULL-SAFE INPUT NORMALIZERS
// ═══════════════════════════════════════════════════════════════════════════

const safeNum  = (v, fb = 0) => { const n = Number(v); return (isNaN(n) || !isFinite(n)) ? fb : Math.max(0, n); };
const safeArr  = (v)          => Array.isArray(v) ? v.filter(Boolean) : [];

function normalizeFeedSignals(rawFeed = []) {
  const items = safeArr(rawFeed);
  if (items.length === 0) return buildEmptyFeedSignals();

  // Content type distribution
  let workCount  = 0, noteCount = 0, expCount  = 0;
  let impactCount = 0, postCount = 0;

  // Emotional signals
  let totalResonanz  = 0, totalBerührt = 0, totalBegleitet = 0;
  let totalViewers   = 0, totalSaves   = 0;
  let presenceStates = {};
  let creatorIds     = new Set();

  for (const item of items) {
    if (!item || typeof item !== "object") continue;

    const type = String(item.type || item.rhythmState || "post").toLowerCase();
    if (type.includes("work") || type === "werk")      workCount++;
    else if (type === "note"  || type === "thought")   noteCount++;
    else if (type === "experience" || type === "event") expCount++;
    else if (type === "impact")                         impactCount++;
    else                                                postCount++;

    totalResonanz  += safeNum(item.resonanz  || item.stats?.likes);
    totalBerührt   += safeNum(item.berührt   || 0);
    totalBegleitet += safeNum(item.begleitet || item.stats?.bookings);
    totalViewers   += safeNum((item.viewers?.length || 0) + (item.viewerExtra || 0));
    totalSaves     += safeNum(item.saves || 0);

    const ps = item.presenceState;
    if (ps) presenceStates[ps] = (presenceStates[ps] || 0) + 1;

    const cid = item.creatorId || item.userId || item.name || item.id;
    if (cid) creatorIds.add(cid);
  }

  const n = items.length;

  return {
    count:              n,
    workRatio:          workCount  / n,
    noteRatio:          noteCount  / n,
    experienceRatio:    expCount   / n,
    impactRatio:        impactCount/ n,

    avgResonanz:        n > 0 ? totalResonanz  / n : 0,
    avgBerührt:         n > 0 ? totalBerührt   / n : 0,
    avgBegleitet:       n > 0 ? totalBegleitet / n : 0,
    avgViewers:         n > 0 ? totalViewers   / n : 0,

    // Dominant presence state across the feed
    dominantPresence:   Object.entries(presenceStates)
      .sort(([,a],[,b]) => b - a)[0]?.[0] || null,

    // Reflective vs expressive balance (notes vs works)
    reflectiveBalance:  noteCount / Math.max(workCount + noteCount, 1),

    // Creator diversity in this feed slice
    creatorDiversity:   creatorIds.size / Math.max(n, 1),

    // Emotional density: how much emotional reaction per item
    emotionalDensity:   (totalBerührt + totalBegleitet * 1.5) / Math.max(n, 1) / 15,
  };
}

function normalizeActivitySignals(rawActivity = {}) {
  if (!rawActivity || typeof rawActivity !== "object") return {};
  return {
    activeCreatorCount: safeNum(rawActivity.activeCreatorCount || rawActivity.active_creators),
    newWorksToday:      safeNum(rawActivity.newWorksToday      || rawActivity.new_works),
    eventsToday:        safeNum(rawActivity.eventsToday        || rawActivity.events_count),
    savesToday:         safeNum(rawActivity.savesToday         || rawActivity.saves_today),
    messagesExchanged:  safeNum(rawActivity.messagesExchanged  || rawActivity.messages),
    // Community growth rate (0–1): new members / active members
    growthMomentum:     safeNum(rawActivity.growthMomentum     || rawActivity.growth_rate),
  };
}

function normalizeResonanceSignals(rawResonance = {}) {
  if (!rawResonance || typeof rawResonance !== "object") return {};
  return {
    // Overall emotional temperature of the community
    communityWarmth:    safeNum(rawResonance.communityWarmth   || rawResonance.warmth),  // 0–1
    // Depth of engagement (berührt / total reactions)
    engagementDepth:    safeNum(rawResonance.engagementDepth   || rawResonance.depth),   // 0–1
    // How much quiet content (notes/reflections) is resonating
    quietResonance:     safeNum(rawResonance.quietResonance    || rawResonance.quiet),   // 0–1
    // Creative momentum: new works getting reactions quickly
    creativeMomentum:   safeNum(rawResonance.creativeMomentum  || rawResonance.momentum),// 0–1
  };
}

function buildEmptyFeedSignals() {
  return {
    count: 0, workRatio: 0, noteRatio: 0, experienceRatio: 0, impactRatio: 0,
    avgResonanz: 0, avgBerührt: 0, avgBegleitet: 0, avgViewers: 0,
    dominantPresence: null, reflectiveBalance: 0.3,
    creatorDiversity: 0.5, emotionalDensity: 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: TIME-OF-DAY INTEGRATION
// Shared atmosphere is always influenced by the time of day.
// Time provides the structural baseline; feed signals color within it.
// ═══════════════════════════════════════════════════════════════════════════

function deriveTimeWeight(timeOfDayId) {
  // Returns a map of state → time-affinity weight
  // These are additive bonuses on top of signal scores
  const weights = {
    morning: {
      warm_creation:          0.20,
      soft_emergence:         0.14,
      collective_inspiration: 0.10,
      calm_transition:        0.08,
      quiet_reflection:       0.04,
    },
    day: {
      collective_inspiration: 0.16,
      warm_creation:          0.12,
      gentle_gathering:       0.10,
      soft_emergence:         0.06,
    },
    evening: {
      gentle_gathering:       0.18,
      warm_creation:          0.12,
      quiet_reflection:       0.10,
      collective_inspiration: 0.06,
    },
    night: {
      deep_night_presence:    0.28,
      quiet_reflection:       0.18,
      calm_transition:        0.08,
    },
  };
  return weights[timeOfDayId] || weights.day;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: SIGNAL EXTRACTORS
// Each scores one atmosphere dimension from 0–1.
// ═══════════════════════════════════════════════════════════════════════════

function scoreQuietReflection(feed, activity, resonance) {
  const noteDominance   = clamp(feed.noteRatio             * 2.5, 0, 1);  // notes heavy
  const quietRes        = clamp(resonance.quietResonance  || 0,   0, 1);
  const lowActivity     = clamp(1 - (activity.activeCreatorCount || 0) / 60, 0, 1);
  const deepPresence    = feed.dominantPresence === "reflecting" ? 0.4 : 0;

  return weightedMean([
    [noteDominance,  0.35],
    [quietRes,       0.28],
    [lowActivity,    0.22],
    [deepPresence,   0.15],
  ]);
}

function scoreWarmCreation(feed, activity, resonance) {
  const workDominance   = clamp(feed.workRatio             * 2.0, 0, 1);
  const creative        = clamp(resonance.creativeMomentum || 0,  0, 1);
  const newWorks        = clamp((activity.newWorksToday    || 0) / 20, 0, 1);
  const creating        = feed.dominantPresence === "creating" ? 0.35 : 0;

  return weightedMean([
    [workDominance,  0.30],
    [creative,       0.28],
    [newWorks,       0.22],
    [creating,       0.20],
  ]);
}

function scoreCollectiveInspiration(feed, activity, resonance) {
  const highResonanz    = clamp(feed.avgResonanz   / 30, 0, 1);
  const warmth          = clamp(resonance.communityWarmth || 0, 0, 1);
  const momentum        = clamp(resonance.creativeMomentum || 0, 0, 1);
  const resonating      = feed.dominantPresence === "resonating" ? 0.35 : 0;
  const diversity       = clamp(feed.creatorDiversity * 1.5, 0, 1);

  return weightedMean([
    [highResonanz,  0.25],
    [warmth,        0.25],
    [momentum,      0.20],
    [resonating,    0.18],
    [diversity,     0.12],
  ]);
}

function scoreGentleGathering(feed, activity, resonance) {
  const expDominance    = clamp(feed.experienceRatio        * 2.5, 0, 1);
  const eventActivity   = clamp((activity.eventsToday     || 0) / 5,  0, 1);
  const begleitet       = clamp(feed.avgBegleitet            / 12, 0, 1);
  const gathering       = feed.dominantPresence === "gathering" ? 0.35 : 0;
  const messages        = clamp((activity.messagesExchanged|| 0) / 30, 0, 1);

  return weightedMean([
    [expDominance,  0.28],
    [eventActivity, 0.24],
    [begleitet,     0.22],
    [gathering,     0.16],
    [messages,      0.10],
  ]);
}

function scoreDeepNightPresence(feed, activity, resonance) {
  // This state is almost exclusively time-driven — reinforced by signal depth
  const deepEngagement  = clamp(feed.emotionalDensity        * 1.5, 0, 1);
  const quietDepth      = clamp(resonance.engagementDepth   || 0,   0, 1);
  const reflective      = feed.dominantPresence === "reflecting" ? 0.25 : 0;
  const lowCreator      = clamp(1 - (activity.activeCreatorCount || 0) / 40, 0, 1);

  return weightedMean([
    [deepEngagement, 0.30],
    [quietDepth,     0.30],
    [reflective,     0.22],
    [lowCreator,     0.18],
  ]);
}

function scoreSoftEmergence(feed, activity, resonance) {
  const growthSignal    = clamp(resonance.creativeMomentum  || 0,  0, 1);
  const newMomentum     = clamp((activity.growthMomentum   || 0) * 3, 0, 1);
  const diversity       = clamp(feed.creatorDiversity,              0, 1);
  const welcoming       = feed.dominantPresence === "welcoming" ? 0.30 : 0;
  const impactPresence  = clamp(feed.impactRatio             * 3, 0, 1);

  return weightedMean([
    [growthSignal,  0.28],
    [newMomentum,   0.24],
    [diversity,     0.22],
    [welcoming,     0.16],
    [impactPresence,0.10],
  ]);
}

function scoreCalmTransition(feed, activity, resonance) {
  // Elevated when no single state is dominant — feeds blend into each other
  // Score is the "uncertainty" / "balance" of the feed
  const balance = 1 - clamp(
    Math.max(
      feed.workRatio, feed.noteRatio,
      feed.experienceRatio, feed.impactRatio
    ) * 2.5,
    0, 1
  );
  const neutralWarmth = resonance.communityWarmth
    ? 1 - Math.abs((resonance.communityWarmth - 0.5) * 2)
    : 0.5;

  return weightedMean([
    [balance,       0.60],
    [neutralWarmth, 0.40],
  ]);
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: MAIN ENGINE — buildSharedAtmosphere()
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Derives the collective emotional atmosphere from aggregated feed signals.
 *
 * @param {Array}  rawFeed       — normalized feed items (from filterValidFeedItems)
 * @param {object} rawActivity   — community activity signals (optional)
 * @param {object} rawResonance  — community resonance signals (optional)
 * @param {string} timeOfDayId   — "morning"|"day"|"evening"|"night" (from getTimeAtmosphere)
 *
 * @returns {SharedAtmosphere} — frozen object with visual field tokens
 */
export function buildSharedAtmosphere(
  rawFeed      = [],
  rawActivity  = {},
  rawResonance = {},
  timeOfDayId  = "day",
) {
  const feed      = normalizeFeedSignals(rawFeed);
  const activity  = normalizeActivitySignals(rawActivity);
  const resonance = normalizeResonanceSignals(rawResonance);
  const timeWeights = deriveTimeWeight(timeOfDayId);

  // ── Score each collective state ────────────────────────────────────
  const rawScores = {
    quiet_reflection:       scoreQuietReflection(feed,    activity, resonance),
    warm_creation:          scoreWarmCreation(feed,       activity, resonance),
    collective_inspiration: scoreCollectiveInspiration(feed, activity, resonance),
    gentle_gathering:       scoreGentleGathering(feed,    activity, resonance),
    deep_night_presence:    scoreDeepNightPresence(feed,  activity, resonance),
    soft_emergence:         scoreSoftEmergence(feed,      activity, resonance),
    calm_transition:        scoreCalmTransition(feed,     activity, resonance),
  };

  // ── Add time-of-day affinity weights ──────────────────────────────
  const scores = {};
  for (const [state, score] of Object.entries(rawScores)) {
    scores[state] = clamp(score + (timeWeights[state] || 0), 0, 1);
  }

  // ── Find dominant state ───────────────────────────────────────────
  let dominantId    = "calm_transition";
  let dominantScore = 0;

  for (const [id, score] of Object.entries(scores)) {
    if (score > dominantScore) {
      dominantScore = score;
      dominantId    = id;
    }
  }

  // ── Confidence ────────────────────────────────────────────────────
  const sorted     = Object.values(scores).sort((a, b) => b - a);
  const confidence = sorted.length >= 2
    ? clamp(sorted[0] - sorted[1], 0, 1)
    : 0.5;

  const tokens = COLLECTIVE_ATMOSPHERES[dominantId]
    || COLLECTIVE_ATMOSPHERES.calm_transition;

  // ── Derive whisper (very rare) ────────────────────────────────────
  const whisper = deriveWhisper(dominantId, dominantScore, feed, confidence);

  return Object.freeze({
    // State
    id:          dominantId,
    tokens,
    scores,
    confidence,

    // Visual field tokens — safe for direct consumption
    surfaceTint:          tokens.surfaceTint,
    vignetteColor:        tokens.vignetteColor,
    cardBlurDelta:        tokens.cardBlurDelta,
    brightnessDelta:      tokens.brightnessDelta,
    warmthDelta:          tokens.warmthDelta,
    motionScale:          tokens.motionScale,
    staggerMultiplier:    tokens.staggerMultiplier,
    transitionEase:       tokens.transitionEase,
    cardAliveSpeed:       tokens.cardAliveSpeed,
    ambientPrimary:       tokens.ambientPrimary,
    ambientSecondary:     tokens.ambientSecondary,
    glowSoftening:        tokens.glowSoftening,
    quietSpaceTone:       tokens.quietSpaceTone,

    // Feed-derived metadata
    feedSignals:          feed,         // INTERNAL — never display raw
    dominantPresence:     feed.dominantPresence,

    // Whisper (atmospheric micro-moment for the whole feed, not a card)
    whisper,

    _fallback: false,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: ATMOSPHERE DRIFT
// Collective states transition slowly — no abrupt switches.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Blends a past collective atmosphere with a freshly computed one.
 * Ensures the platform feels alive, not reactive.
 *
 * @param {SharedAtmosphere} pastAtmosphere
 * @param {SharedAtmosphere} freshAtmosphere
 * @param {number}           minutesSinceUpdate — time since last computation
 *
 * @returns {SharedAtmosphere}
 */
export function atmosphereDrift(pastAtmosphere, freshAtmosphere, minutesSinceUpdate = 0) {
  if (!pastAtmosphere || pastAtmosphere._fallback) return freshAtmosphere;
  if (!freshAtmosphere)                             return pastAtmosphere;

  // Collective atmosphere has a shorter drift cycle than identity (minutes not days)
  // But still slow: 45 minutes for 50% drift
  const HALF_LIFE_MINUTES = 45;
  const driftRatio = clamp(
    1 - Math.pow(0.5, minutesSinceUpdate / HALF_LIFE_MINUTES),
    0,
    0.92  // never fully override past — always some continuity
  );

  // Blend all numerical tokens
  const blend = (past, fresh, key, fallback = 0) =>
    lerp(safeTokenNum(past?.[key], fallback), safeTokenNum(fresh?.[key], fallback), driftRatio);

  const blended = {
    cardBlurDelta:     blend(pastAtmosphere, freshAtmosphere, "cardBlurDelta",     0),
    brightnessDelta:   blend(pastAtmosphere, freshAtmosphere, "brightnessDelta",   0),
    warmthDelta:       blend(pastAtmosphere, freshAtmosphere, "warmthDelta",       0),
    motionScale:       blend(pastAtmosphere, freshAtmosphere, "motionScale",       1),
    staggerMultiplier: blend(pastAtmosphere, freshAtmosphere, "staggerMultiplier", 1),
    glowSoftening:     blend(pastAtmosphere, freshAtmosphere, "glowSoftening",     1),
  };

  // Qualitative tokens switch at 50% drift
  const useNew = driftRatio > 0.50;
  const base   = useNew ? freshAtmosphere : pastAtmosphere;

  return Object.freeze({
    ...base,
    ...blended,
    // Whisper always from fresh (contextual to current feed)
    whisper:    freshAtmosphere.whisper,
    scores:     freshAtmosphere.scores,
    confidence: freshAtmosphere.confidence,
    feedSignals:freshAtmosphere.feedSignals,
    _driftRatio:driftRatio,
    _fallback:  false,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: FEED INTEGRATION — applyAtmosphereToFeed()
// Applies shared atmosphere tokens to curateHumaneFeed output.
// Modifies stagger delays and injects atmosphere into sequence.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Post-processes a curated feed sequence with shared atmosphere adjustments.
 *
 * @param {Array}            sequence    — from curateHumaneFeed().sequence
 * @param {SharedAtmosphere} atmosphere
 *
 * @returns {Array} — same structure, with _atm tokens on each card slot
 */
export function applyAtmosphereToFeed(sequence, atmosphere) {
  if (!sequence || !atmosphere || atmosphere._fallback) return sequence || [];

  return sequence.map((slot, si) => {
    if (!slot || slot.kind !== "card" || !slot.item) return slot;

    // Apply atmosphere motion scale to existing animation delay
    const baseDelay = si * 0.055;
    const scaledDelay = baseDelay
      * (atmosphere.staggerMultiplier ?? 1.0)
      * (slot.item._cardDelay ?? 1.0);   // relationship _cardDelay still applies

    return Object.freeze({
      ...slot,
      item: Object.freeze({
        ...slot.item,
        // Atmosphere tokens on the item — consumed by RhythmCard + HomeFeed
        _atmSurfaceTint:     atmosphere.surfaceTint,
        _atmGlowSoftening:   atmosphere.glowSoftening,
        _atmCardAliveSpeed:  atmosphere.cardAliveSpeed,
        _atmMotionScale:     atmosphere.motionScale,
        _atmTransitionEase:  atmosphere.transitionEase,
        _atmWarmthDelta:     atmosphere.warmthDelta,
      }),
      // Scaled animation delay (used by RhythmicFeed div wrapper)
      _scaledDelay: Math.min(scaledDelay, 1.6),
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8: MEMOIZED SELECTORS
// Safe accessors — always return sensible defaults, never throw.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Returns the surface tint CSS string for a given atmosphere.
 */
export function selectSurfaceTint(atm) {
  return atm?.surfaceTint ?? "rgba(160,180,176,0.015)";
}

/**
 * Returns the motion scale (0.72–1.05) for the current atmosphere.
 */
export function selectAtmMotionScale(atm) {
  const s = atm?.motionScale;
  if (typeof s !== "number" || isNaN(s)) return 1.0;
  return clamp(s, 0.72, 1.05);
}

/**
 * Returns the stagger multiplier (0.92–1.28).
 */
export function selectStaggerMultiplier(atm) {
  const s = atm?.staggerMultiplier;
  if (typeof s !== "number" || isNaN(s)) return 1.0;
  return clamp(s, 0.88, 1.32);
}

/**
 * Returns the glow softening factor (0.78–1.08).
 */
export function selectGlowSoftening(atm) {
  const s = atm?.glowSoftening;
  if (typeof s !== "number" || isNaN(s)) return 1.0;
  return clamp(s, 0.72, 1.12);
}

/**
 * Returns the current whisper string or null.
 * Only show this extremely rarely — maybe once per session.
 */
export function selectWhisper(atm) {
  return atm?.whisper ?? null;
}

/**
 * Returns the quiet space tone for QuietSpace component.
 */
export function selectQuietSpaceTone(atm) {
  return atm?.quietSpaceTone ?? "reflective";
}

/**
 * Returns a debug summary. NEVER pass to user UI.
 */
export function debugAtmosphereSummary(atm) {
  if (!atm) return "[no atmosphere]";
  const scores = atm.scores
    ? Object.entries(atm.scores)
        .sort(([,a],[,b]) => b - a)
        .slice(0, 3)
        .map(([k,v]) => `${k.split("_")[0]}:${(v*100).toFixed(0)}`)
        .join(" | ")
    : "no scores";
  return `[${atm.id}] conf:${((atm.confidence||0)*100).toFixed(0)}% | ${scores}`;
}

/**
 * Returns true if the atmosphere is the graceful fallback.
 */
export function isFallbackAtmosphere(atm) {
  return !atm || atm._fallback === true;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9: WHISPER DERIVATION
// Atmospheric whispers — rarely surface in the UI.
// They are mood-contextual, never notification-like.
// ═══════════════════════════════════════════════════════════════════════════

function deriveWhisper(state, score, feed, confidence) {
  // Only emit whisper when atmosphere is strong + confident
  if (score < 0.45 || confidence < 0.15) return null;

  // Very rare: only ~20% of the time when conditions are met
  // Deterministic: based on feed composition hash
  const hash = Math.floor(
    (feed.noteRatio * 100 + feed.workRatio * 77 + feed.avgBerührt * 13) * 100
  );
  if (hash % 5 !== 0) return null;

  const tokens = COLLECTIVE_ATMOSPHERES[state];
  if (!tokens?.whisperPool?.length) return null;

  return tokens.whisperPool[hash % tokens.whisperPool.length];
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 10: MOCK ACTIVITY / RESONANCE FACTORIES
// For development — derives plausible community signals from feed items.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Infers mock community activity signals from a normalized feed.
 * Used during development before Supabase aggregation is wired up.
 */
export function mockActivityFromFeed(feedItems = []) {
  const items = Array.isArray(feedItems) ? feedItems : [];
  const works  = items.filter(i => (i.type || "").includes("work")).length;
  const exps   = items.filter(i => (i.type || "") === "experience").length;
  const unique = new Set(items.map(i => i.name || i.id)).size;

  return {
    activeCreatorCount: unique,
    newWorksToday:      works * 3,
    eventsToday:        exps,
    savesToday:         Math.floor(works * 1.4),
    messagesExchanged:  Math.floor(unique * 2.2),
    growthMomentum:     clamp(unique / 20, 0, 1),
  };
}

/**
 * Infers mock community resonance signals from feed items.
 */
export function mockResonanceFromFeed(feedItems = []) {
  const items = Array.isArray(feedItems) ? feedItems : [];
  if (items.length === 0) return { communityWarmth: 0.4, engagementDepth: 0.3 };

  const totalBerührt  = items.reduce((s, i) => s + safeNum(i.berührt),   0);
  const totalResonanz = items.reduce((s, i) => s + safeNum(i.resonanz),  0);
  const notes         = items.filter(i => (i.type || "") === "note").length;

  const depth   = totalResonanz > 0 ? clamp(totalBerührt / totalResonanz, 0, 1) : 0.35;
  const warmth  = clamp((totalBerührt + totalResonanz * 0.3) / (items.length * 15), 0, 1);
  const quiet   = clamp(notes / Math.max(items.length, 1) * 3, 0, 1);
  const creative= clamp(items.filter(i => (i.type||"").includes("work")).length / items.length * 2, 0, 1);

  return {
    communityWarmth:  warmth,
    engagementDepth:  depth,
    quietResonance:   quiet,
    creativeMomentum: creative,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function weightedMean(pairs) {
  let sum = 0, totalW = 0;
  for (const [v, w] of pairs) {
    if (typeof v === "number" && !isNaN(v) && typeof w === "number" && w > 0) {
      sum    += clamp(v, 0, 1) * w;
      totalW += w;
    }
  }
  return totalW > 0 ? clamp(sum / totalW, 0, 1) : 0;
}

function clamp(v, min, max) {
  if (typeof v !== "number" || isNaN(v)) return min;
  return Math.min(Math.max(v, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}

function safeTokenNum(v, fallback) {
  const n = Number(v);
  return (isNaN(n) || !isFinite(n)) ? fallback : n;
}
