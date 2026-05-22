// emotionalIdentity.js — HUI Emotional Identity Layer v1
//
// Philosophy: "digital atmosphere, not behavioral tracking"
//
// This system derives a soft emotional signature from observable creative
// behavior — what someone CREATES, how others RESPOND, how they ENGAGE.
//
// Users must never feel analyzed. The output is purely atmospheric:
// gentle visual adjustments and a human-language label.
//
// ── Design Principles ──────────────────────────────────────────────────────
//   • Deterministic: same input → same identity (no random surprises)
//   • Private:       scores never exposed to UI, only visual tokens
//   • Gradual:       identityDrift() changes over days, never per-session
//   • Null-safe:     every input path has a fallback
//   • SSR-safe:      no window/document/Date without guards
//   • Pure:          no side effects, no mutations
// ─────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: ARCHETYPE DEFINITIONS
// 6 human archetypes — soft, editorial, non-judgmental.
// Each carries visual atmosphere tokens and a human-language label.
// ═══════════════════════════════════════════════════════════════════════════

export const EMOTIONAL_ARCHETYPES = Object.freeze({

  quiet_creator: Object.freeze({
    id:               "quiet_creator",
    atmosphereLabel:  "erschafft in ruhiger Tiefe",

    // Motion — slow, meditative
    motionScale:      0.72,      // relative to DS.motion defaults
    animationSpeed:   "14s",     // aura / glow cycles
    revealDelay:      1.25,      // multiplier on stagger delay

    // Color atmosphere
    ambientColor:     "#A8C5C2",        // desaturated teal-grey
    ambientColorFaint:"rgba(168,197,194,0.07)",
    ambientGlow:      "rgba(168,197,194,0.14)",
    accentColor:      "#16D7C5",        // HUI teal
    surfaceTint:      "rgba(22,215,197,0.03)",

    // Visual texture
    blurIntensity:    "blur(20px)",     // more blur = more depth
    glassOpacity:     0.84,
    ringOpacity:      0.28,

    // Motion character
    resonanceStyle:   "slow_breathe",   // used by PresenceAvatar
    cardAliveSpeed:   "16s",            // cp-card-alive timing
    microMotionAmp:   0.60,             // scale of micro-animations
  }),

  warm_connector: Object.freeze({
    id:               "warm_connector",
    atmosphereLabel:  "verbindet Menschen mit Wärme",

    motionScale:      1.08,
    animationSpeed:   "8s",
    revealDelay:      0.85,

    ambientColor:     "#E8836A",
    ambientColorFaint:"rgba(232,131,106,0.08)",
    ambientGlow:      "rgba(232,131,106,0.18)",
    accentColor:      "#FF8A6B",
    surfaceTint:      "rgba(255,138,107,0.04)",

    blurIntensity:    "blur(14px)",
    glassOpacity:     0.82,
    ringOpacity:      0.35,

    resonanceStyle:   "warm_pulse",
    cardAliveSpeed:   "9s",
    microMotionAmp:   1.10,
  }),

  deep_reflector: Object.freeze({
    id:               "deep_reflector",
    atmosphereLabel:  "bringt stille Gedanken ein",

    motionScale:      0.60,
    animationSpeed:   "20s",
    revealDelay:      1.55,

    ambientColor:     "#8B96B5",
    ambientColorFaint:"rgba(139,150,181,0.07)",
    ambientGlow:      "rgba(139,150,181,0.13)",
    accentColor:      "#8A8AAA",
    surfaceTint:      "rgba(139,150,181,0.04)",

    blurIntensity:    "blur(22px)",
    glassOpacity:     0.80,
    ringOpacity:      0.22,

    resonanceStyle:   "deep_slow",
    cardAliveSpeed:   "22s",
    microMotionAmp:   0.45,
  }),

  gentle_inspirer: Object.freeze({
    id:               "gentle_inspirer",
    atmosphereLabel:  "inspiriert sanft andere",

    motionScale:      0.95,
    animationSpeed:   "10s",
    revealDelay:      0.95,

    ambientColor:     "#C4973A",
    ambientColorFaint:"rgba(196,151,58,0.07)",
    ambientGlow:      "rgba(196,151,58,0.15)",
    accentColor:      "#F5A623",
    surfaceTint:      "rgba(245,166,35,0.03)",

    blurIntensity:    "blur(16px)",
    glassOpacity:     0.83,
    ringOpacity:      0.30,

    resonanceStyle:   "gold_shimmer",
    cardAliveSpeed:   "11s",
    microMotionAmp:   0.88,
  }),

  curious_explorer: Object.freeze({
    id:               "curious_explorer",
    atmosphereLabel:  "entdeckt neue Perspektiven",

    motionScale:      1.18,
    animationSpeed:   "7s",
    revealDelay:      0.72,

    ambientColor:     "#7CC8A0",
    ambientColorFaint:"rgba(124,200,160,0.07)",
    ambientGlow:      "rgba(124,200,160,0.15)",
    accentColor:      "#3DB87A",
    surfaceTint:      "rgba(124,200,160,0.04)",

    blurIntensity:    "blur(12px)",
    glassOpacity:     0.80,
    ringOpacity:      0.32,

    resonanceStyle:   "dynamic_flow",
    cardAliveSpeed:   "8s",
    microMotionAmp:   1.22,
  }),

  steady_presence: Object.freeze({
    id:               "steady_presence",
    atmosphereLabel:  "ist eine ruhige konstante Präsenz",

    motionScale:      0.85,
    animationSpeed:   "18s",
    revealDelay:      1.10,

    ambientColor:     "#A0B4B0",
    ambientColorFaint:"rgba(160,180,176,0.06)",
    ambientGlow:      "rgba(160,180,176,0.12)",
    accentColor:      "#16D7C5",
    surfaceTint:      "rgba(160,180,176,0.03)",

    blurIntensity:    "blur(16px)",
    glassOpacity:     0.86,
    ringOpacity:      0.24,

    resonanceStyle:   "steady_glow",
    cardAliveSpeed:   "20s",
    microMotionAmp:   0.70,
  }),
});

// Ordered fallback list — steady_presence is the graceful default
const ARCHETYPE_IDS = [
  "quiet_creator",
  "warm_connector",
  "deep_reflector",
  "gentle_inspirer",
  "curious_explorer",
  "steady_presence",
];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: NULL-SAFE INPUT NORMALIZERS
// All raw inputs are messy. These guards ensure the engine never crashes.
// ═══════════════════════════════════════════════════════════════════════════

const safeNum = (v, fb = 0) => {
  if (v == null) return fb;
  const n = Number(v);
  return isNaN(n) || !isFinite(n) ? fb : Math.max(0, n);
};

const safeBool = (v) => Boolean(v);

const normalizeProfile = (raw) => {
  if (!raw || typeof raw !== "object") return {};
  return {
    worksCount:      safeNum(raw.works        || raw.worksCount      || raw.stats?.works),
    notesCount:      safeNum(raw.notes        || raw.notesCount),
    experiencesCount:safeNum(raw.experiences  || raw.experiencesCount|| raw.stats?.experiences),
    followersCount:  safeNum(raw.followers    || raw.followersCount  || raw.stats?.followers),
    followingCount:  safeNum(raw.following    || raw.followingCount  || raw.stats?.following),
    connectionsCount:safeNum(raw.connections  || raw.connectionsCount|| raw.stats?.connections),
    bookingsCount:   safeNum(raw.bookings     || raw.bookingsCount   || raw.stats?.bookings),
    isVerified:      safeBool(raw.isVerified  || raw.is_verified     || raw.is_wirker),
    memberSince:     raw.createdAt || raw.created_at || null,
  };
};

const normalizeActivity = (raw) => {
  if (!raw || typeof raw !== "object") return {};
  return {
    // Session behavior
    avgSessionMinutes:safeNum(raw.avgSessionMinutes || raw.avg_session_minutes),
    nightActivityRatio:safeNum(raw.nightActivityRatio || raw.night_ratio),  // 0–1
    weeklyConsistency: safeNum(raw.weeklyConsistency || raw.consistency),   // 0–1

    // Content creation
    contentFrequency:  safeNum(raw.contentFrequency || raw.posts_per_week),
    textPostRatio:     safeNum(raw.textPostRatio    || raw.note_ratio),     // 0–1
    mediaPostRatio:    safeNum(raw.mediaPostRatio   || raw.media_ratio),    // 0–1

    // Engagement style
    commentFrequency:  safeNum(raw.commentFrequency || raw.comments_given),
    replyFrequency:    safeNum(raw.replyFrequency   || raw.replies_given),
    discoverActions:   safeNum(raw.discoverActions  || raw.discover_clicks),
    topicVariety:      safeNum(raw.topicVariety     || raw.unique_categories), // count

    // Event participation
    eventsAttended:    safeNum(raw.eventsAttended   || raw.events_attended),
    eventsHosted:      safeNum(raw.eventsHosted     || raw.events_hosted),
  };
};

const normalizeResonance = (raw) => {
  if (!raw || typeof raw !== "object") return {};
  return {
    // Received reactions
    totalInspired:   safeNum(raw.totalInspired   || raw.inspiriert_received || raw.inspired_count),
    totalBerührt:    safeNum(raw.totalBerührt    || raw.berührt_received    || raw.touched_count),
    totalResonanz:   safeNum(raw.totalResonanz   || raw.resonanz_received   || raw.resonance_count),
    totalSaves:      safeNum(raw.totalSaves      || raw.saves_received      || raw.saved_count),

    // Social depth
    avgResponseTime: safeNum(raw.avgResponseTime || raw.avg_response_h),    // hours
    connectionDepth: safeNum(raw.connectionDepth || raw.deep_connections),   // count of 3+ interaction pairs

    // Resonance density (quality / quantity)
    resonanceDensity:safeNum(raw.resonanceDensity || raw.resonance_density), // 0–1
    peakActivity:    safeNum(raw.peakActivity     || raw.peak_hour),         // 0–23 (hour of day)
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: SIGNAL EXTRACTORS
// Each extracts a normalized 0–1 signal for one archetype dimension.
// These are the "observable behaviors" — never psychological conclusions.
// ═══════════════════════════════════════════════════════════════════════════

function signalQuietCreator(profile, activity, resonance) {
  const worksSignal    = Math.min(profile.worksCount        / 20, 1.0);  // up to 20 works
  const sessionSignal  = Math.min(activity.avgSessionMinutes / 60, 1.0); // up to 60 min avg
  const commentInverse = 1.0 - Math.min(activity.commentFrequency / 30, 1.0); // few comments
  const calmResonance  = resonance.resonanceDensity > 0 ? resonance.resonanceDensity : 0.5;

  return weightedMean([
    [worksSignal,    0.35],
    [sessionSignal,  0.25],
    [commentInverse, 0.25],
    [calmResonance,  0.15],
  ]);
}

function signalWarmConnector(profile, activity, resonance) {
  const replySignal    = Math.min(activity.replyFrequency    / 40, 1.0);
  const eventSignal    = Math.min(activity.eventsAttended    / 10, 1.0);
  const followerSignal = Math.min(profile.followersCount     / 200, 1.0);
  const socialResonance= Math.min(resonance.totalBerührt     / 50, 1.0);

  return weightedMean([
    [replySignal,     0.30],
    [eventSignal,     0.25],
    [followerSignal,  0.20],
    [socialResonance, 0.25],
  ]);
}

function signalDeepReflector(profile, activity, resonance) {
  const noteSignal     = Math.min(activity.textPostRatio,         1.0); // already 0–1
  const sessionSignal  = Math.min(activity.avgSessionMinutes / 90, 1.0);
  const nightSignal    = Math.min(activity.nightActivityRatio,     1.0); // already 0–1
  const thoughtResonance = Math.min(resonance.totalResonanz  / 40, 1.0);

  return weightedMean([
    [noteSignal,        0.30],
    [sessionSignal,     0.25],
    [nightSignal,       0.25],
    [thoughtResonance,  0.20],
  ]);
}

function signalGentleInspirer(profile, activity, resonance) {
  const inspiredSignal = Math.min(resonance.totalInspired  / 60, 1.0);
  const savesSignal    = Math.min(resonance.totalSaves     / 40, 1.0);
  const densitySignal  = resonance.resonanceDensity || 0;
  const worksSignal    = Math.min(profile.worksCount       / 15, 1.0);

  return weightedMean([
    [inspiredSignal, 0.35],
    [savesSignal,    0.30],
    [densitySignal,  0.20],
    [worksSignal,    0.15],
  ]);
}

function signalCuriousExplorer(profile, activity, resonance) {
  const discoverSignal = Math.min(activity.discoverActions / 50, 1.0);
  const varietySignal  = Math.min(activity.topicVariety    / 8,  1.0);
  const followSignal   = Math.min(profile.followingCount   / 100, 1.0);
  const eventSignal    = Math.min(activity.eventsAttended  / 8,  1.0);

  return weightedMean([
    [discoverSignal, 0.35],
    [varietySignal,  0.30],
    [followSignal,   0.20],
    [eventSignal,    0.15],
  ]);
}

function signalSteadyPresence(profile, activity, resonance) {
  const consistencySignal = Math.min(activity.weeklyConsistency, 1.0);  // 0–1
  const calmSignal        = 1.0 - Math.min(
    Math.abs(resonance.peakActivity - 12) / 12, 1.0  // centered around noon = calm
  );
  const memberSignal      = profile.memberSince
    ? Math.min(daysSince(profile.memberSince) / 180, 1.0)   // up to 180 days
    : 0.3;
  const resonanceCalm     = resonance.resonanceDensity > 0
    ? 1.0 - Math.abs(resonance.resonanceDensity - 0.5) * 2   // closer to 0.5 = steadier
    : 0.5;

  return weightedMean([
    [consistencySignal, 0.40],
    [calmSignal,        0.20],
    [memberSignal,      0.25],
    [resonanceCalm,     0.15],
  ]);
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: MAIN ENGINE — buildEmotionalIdentity()
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Derives a soft emotional identity from observable creator signals.
 *
 * @param {object} rawProfile   — profile object (createProfileItem output or raw)
 * @param {object} rawActivity  — activity signals (optional, safe to omit)
 * @param {object} rawResonance — resonance signals (optional, safe to omit)
 *
 * @returns {EmotionalIdentity} — frozen object with visual atmosphere tokens
 *   {
 *     type,            // archetype id
 *     atmosphereLabel, // human-language string ("erschafft in ruhiger Tiefe")
 *     motionScale,     // number 0.60–1.22
 *     animationSpeed,  // CSS duration string "7s"–"20s"
 *     ambientColor,    // hex color
 *     ambientColorFaint,
 *     ambientGlow,
 *     accentColor,
 *     surfaceTint,
 *     blurIntensity,   // CSS filter string
 *     glassOpacity,
 *     ringOpacity,
 *     resonanceStyle,  // string token used by PresenceAvatar
 *     cardAliveSpeed,
 *     microMotionAmp,
 *     scores,          // { archetype: 0–1 } — INTERNAL ONLY, never display
 *     confidence,      // 0–1 — how confident the classification is
 *     _fallback,       // true if built from empty/missing data
 *   }
 */
export function buildEmotionalIdentity(rawProfile = {}, rawActivity = {}, rawResonance = {}) {
  // ── Normalize all inputs ─────────────────────────────────────────────
  const profile   = normalizeProfile(rawProfile);
  const activity  = normalizeActivity(rawActivity);
  const resonance = normalizeResonance(rawResonance);

  // ── Detect data poverty (too little signal to classify) ──────────────
  const hasData = (
    profile.worksCount       > 0 ||
    profile.followersCount   > 0 ||
    activity.contentFrequency > 0 ||
    resonance.totalInspired  > 0 ||
    resonance.totalResonanz  > 0
  );

  // If no data: graceful fallback — steady_presence (most neutral)
  if (!hasData) {
    return buildFallbackIdentity();
  }

  // ── Score each archetype ─────────────────────────────────────────────
  const scores = {
    quiet_creator:   signalQuietCreator(profile,   activity, resonance),
    warm_connector:  signalWarmConnector(profile,  activity, resonance),
    deep_reflector:  signalDeepReflector(profile,  activity, resonance),
    gentle_inspirer: signalGentleInspirer(profile, activity, resonance),
    curious_explorer:signalCuriousExplorer(profile,activity, resonance),
    steady_presence: signalSteadyPresence(profile, activity, resonance),
  };

  // ── Determine dominant archetype ─────────────────────────────────────
  let dominantId   = "steady_presence";
  let dominantScore = 0;

  for (const [id, score] of Object.entries(scores)) {
    if (score > dominantScore) {
      dominantScore = score;
      dominantId    = id;
    }
  }

  // ── Confidence: how much does the dominant stand out? ────────────────
  const sortedScores = Object.values(scores).sort((a, b) => b - a);
  const confidence   = sortedScores.length >= 2
    ? clamp(sortedScores[0] - sortedScores[1], 0, 1)
    : 0.5;

  // ── Get archetype tokens ─────────────────────────────────────────────
  const archetype = EMOTIONAL_ARCHETYPES[dominantId]
    || EMOTIONAL_ARCHETYPES.steady_presence;

  // ── Return frozen identity object ────────────────────────────────────
  return Object.freeze({
    ...archetype,
    scores,
    confidence,
    _fallback: false,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: IDENTITY DRIFT
// The emotional signature changes slowly over time.
// Uses a time-weighted blend of past identity + current signals.
// Prevents abrupt changes per-session — identity evolves over days.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Blends a stored (past) identity with a freshly computed identity.
 * The blend weight depends on how many days have passed.
 *
 * @param {EmotionalIdentity} pastIdentity    — previously stored identity
 * @param {EmotionalIdentity} freshIdentity   — just computed identity
 * @param {number}            daysSinceUpdate — days since pastIdentity was stored
 *
 * @returns {EmotionalIdentity} — smoothly blended identity
 */
export function identityDrift(pastIdentity, freshIdentity, daysSinceUpdate = 0) {
  if (!pastIdentity || pastIdentity._fallback) return freshIdentity;
  if (!freshIdentity)                           return pastIdentity;

  // How fast does identity drift? 7 days → 50% weight to new signal
  // Slow: cannot flip archetype overnight. Fast: not stuck forever.
  const HALF_LIFE_DAYS = 7;
  const driftRatio = clamp(
    1 - Math.pow(0.5, daysSinceUpdate / HALF_LIFE_DAYS),
    0,
    0.85  // cap at 85% — past identity always has some weight
  );

  // If same archetype: no blend needed — just return fresh
  if (pastIdentity.id === freshIdentity.id) {
    return freshIdentity;
  }

  // If different archetype AND confidence is low: stay with past identity
  // (Prevents flickering when signals are ambiguous)
  if (freshIdentity.confidence < 0.12 && daysSinceUpdate < 3) {
    return pastIdentity;
  }

  // Blend numerical tokens (motion, opacity, etc.)
  const blendedMotionScale   = lerp(pastIdentity.motionScale   ?? 1, freshIdentity.motionScale   ?? 1, driftRatio);
  const blendedMicroMotionAmp= lerp(pastIdentity.microMotionAmp ?? 1, freshIdentity.microMotionAmp ?? 1, driftRatio);
  const blendedGlassOpacity  = lerp(pastIdentity.glassOpacity  ?? 0.82, freshIdentity.glassOpacity ?? 0.82, driftRatio);
  const blendedRingOpacity   = lerp(pastIdentity.ringOpacity   ?? 0.28, freshIdentity.ringOpacity  ?? 0.28, driftRatio);

  // For qualitative tokens (color, style): switch only when drift is strong
  const useNew = driftRatio > 0.50;

  return Object.freeze({
    ...(useNew ? freshIdentity : pastIdentity),

    // Smoothed numerical tokens
    motionScale:    blendedMotionScale,
    microMotionAmp: blendedMicroMotionAmp,
    glassOpacity:   blendedGlassOpacity,
    ringOpacity:    blendedRingOpacity,

    // Always from fresh
    scores:         freshIdentity.scores,
    confidence:     freshIdentity.confidence,

    // Drift metadata (internal)
    _driftRatio:    driftRatio,
    _fallback:      false,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: MEMOIZED SELECTORS
// Safe accessors — return tokens from an identity object.
// Always return a fallback — never throw.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Returns the CSS animation speed for a given identity.
 * Used by PresenceAvatar, cp-ring, cp-card-alive.
 */
export function selectAnimationSpeed(identity) {
  return identity?.animationSpeed
    ?? EMOTIONAL_ARCHETYPES.steady_presence.animationSpeed;
}

/**
 * Returns the motion scale — multiply DS.motion durations by this.
 */
export function selectMotionScale(identity) {
  const scale = identity?.motionScale;
  if (typeof scale !== "number" || isNaN(scale)) return 1.0;
  return clamp(scale, 0.40, 1.60);
}

/**
 * Returns the ambient glow color for avatar rings.
 */
export function selectAmbientGlow(identity) {
  return identity?.ambientGlow
    ?? EMOTIONAL_ARCHETYPES.steady_presence.ambientGlow;
}

/**
 * Returns the glass opacity for card surfaces.
 */
export function selectGlassOpacity(identity) {
  const op = identity?.glassOpacity;
  if (typeof op !== "number" || isNaN(op)) return 0.82;
  return clamp(op, 0.65, 0.96);
}

/**
 * Returns the human-language atmosphere label.
 * Safe to render directly in UI.
 */
export function selectAtmosphereLabel(identity) {
  return identity?.atmosphereLabel
    ?? EMOTIONAL_ARCHETYPES.steady_presence.atmosphereLabel;
}

/**
 * Returns true if identity is the graceful fallback (not enough data).
 */
export function isFallbackIdentity(identity) {
  return !identity || identity._fallback === true;
}

/**
 * Returns a lightweight summary for logging/debugging.
 * NEVER pass this to the user-facing UI.
 */
export function debugIdentitySummary(identity) {
  if (!identity) return "[no identity]";
  const scores = identity.scores
    ? Object.entries(identity.scores)
        .sort(([,a],[,b]) => b - a)
        .map(([k,v]) => `${k.split("_")[0]}:${(v*100).toFixed(0)}`)
        .join(" | ")
    : "no scores";
  return `[${identity.id}] conf:${((identity.confidence||0)*100).toFixed(0)}% | ${scores}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: INTEGRATION HELPERS
// Attach emotional identity to a createProfileItem() output.
// The profileItem is frozen — we return a new extended object.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extends a createProfileItem() output with emotionalIdentity.
 *
 * @param {ProfileItem}       profileItem  — from createProfileItem()
 * @param {object}            activity     — activity signals
 * @param {object}            resonance    — resonance signals
 * @param {EmotionalIdentity} pastIdentity — previously stored identity (for drift)
 * @param {number}            daysSinceUpdate
 *
 * @returns {ProfileItem & { emotionalIdentity: EmotionalIdentity }}
 */
export function attachEmotionalIdentity(
  profileItem,
  activity     = {},
  resonance    = {},
  pastIdentity = null,
  daysSinceUpdate = 0,
) {
  if (!profileItem || typeof profileItem !== "object") return profileItem;

  const fresh = buildEmotionalIdentity(
    profileItem._raw || profileItem,
    activity,
    resonance,
  );

  const final = pastIdentity
    ? identityDrift(pastIdentity, fresh, daysSinceUpdate)
    : fresh;

  // Return new object (profileItem is frozen — cannot mutate)
  return Object.freeze({
    ...profileItem,
    emotionalIdentity: final,
  });
}

/**
 * Quick helper: get identity tokens from a profile (no activity/resonance data).
 * Falls back gracefully if profile has enough stats embedded.
 */
export function quickIdentityFromProfile(profileItem) {
  if (!profileItem) return buildFallbackIdentity();

  const raw = profileItem._raw || profileItem;

  return buildEmotionalIdentity(
    raw,
    {
      // Infer activity from embedded stats where possible
      contentFrequency: safeNum(raw.stats?.works || raw.worksCount) / 4,  // rough per-week estimate
      weeklyConsistency: profileItem.isVerified ? 0.7 : 0.4,
      textPostRatio: 0.3,
    },
    {
      totalInspired: safeNum(raw.stats?.resonance || raw.resonance),
      resonanceDensity: profileItem.isVerified ? 0.6 : 0.35,
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8: INTERNAL UTILITIES (not exported)
// ═══════════════════════════════════════════════════════════════════════════

function weightedMean(pairs) {
  // pairs: [[value, weight], ...]
  let sum = 0;
  let totalWeight = 0;
  for (const [v, w] of pairs) {
    if (typeof v === "number" && !isNaN(v) && typeof w === "number" && w > 0) {
      sum         += clamp(v, 0, 1) * w;
      totalWeight += w;
    }
  }
  return totalWeight > 0 ? clamp(sum / totalWeight, 0, 1) : 0;
}

function clamp(v, min, max) {
  if (typeof v !== "number" || isNaN(v)) return min;
  return Math.min(Math.max(v, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}

function daysSince(dateish) {
  if (!dateish) return 0;
  try {
    const ms = Date.now() - new Date(dateish).getTime();
    return Math.max(0, Math.floor(ms / 86_400_000));
  } catch {
    return 0;
  }
}

function buildFallbackIdentity() {
  return Object.freeze({
    ...EMOTIONAL_ARCHETYPES.steady_presence,
    scores:     null,
    confidence: 0,
    _fallback:  true,
  });
}
