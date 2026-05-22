// resonanceSpaces.js — HUI Resonance Spaces Engine v1
//
// Philosophy: "emotional architecture, not social media features"
//
// Resonance Spaces are temporary atmospheric environments that emerge
// naturally from collective creative energy. They are not chat rooms,
// Discord servers, or community groups.
//
// A space is felt — not joined.
// It exists — then slowly dissolves.
// It leaves traces — but not records.
//
// ── What a Space IS ────────────────────────────────────────────────────────
//   • A brief shared emotional field
//   • A convergence of creative presence and resonance
//   • A temporary atmosphere that makes the feed feel inhabited
//   • An invisible architecture that shapes visual experience
//
// ── What a Space is NOT ────────────────────────────────────────────────────
//   • Not a chat room, group, or server
//   • Not a permanent community
//   • Not algorithmically advertised
//   • Not notification-driven
//   • Not socially pressured
//
// ── Architecture ───────────────────────────────────────────────────────────
//   • Pure function — no mutations, no side effects
//   • Deterministic — same inputs → same spaces
//   • SSR-safe — no browser APIs without guards
//   • Null-safe — every path has a fallback
//   • Compatible: emotionalIdentity + relationshipMemory + sharedAtmosphere
// ─────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: SPACE ARCHETYPE DEFINITIONS
// 8 emotional space archetypes — each a complete atmospheric world.
// ═══════════════════════════════════════════════════════════════════════════

export const SPACE_ARCHETYPES = Object.freeze({

  warm_creation: Object.freeze({
    id:              "warm_creation",
    emotionalField:  "Wärme + Entstehung",

    // Human-language feel — never shown as label, only as whisper
    whisperPool: [
      "Menschen erschaffen hier gerade gemeinsam etwas.",
      "Eine warme schöpferische Energie trägt diesen Raum.",
      "Hier entsteht gerade etwas Echtes.",
    ],

    // Minimum lifetime before space can begin fading (minutes)
    minLifetimeMinutes: 90,
    // Typical lifespan under normal conditions
    typicalLifetimeMinutes: 180,

    // Visual atmosphere — all values are deltas on top of base
    visual: Object.freeze({
      // Surface
      surfaceTint:     "rgba(245,166,35,0.030)",    // gold breath on cards
      glassShift:      0.024,                        // opacity nudge on glass
      brightnessBoost: 0.018,                        // +1.8% brightness
      warmthBoost:     0.032,                        // +3.2% color warmth

      // Motion
      motionScale:     0.94,                         // slightly crisper
      floatAmplitude:  8,                            // px — gentle float
      floatPeriod:     "11s",
      transitionEase:  "cubic-bezier(0.22,1,0.36,1)",

      // Glow + aura
      ambientGlow:     "rgba(245,166,35,0.055)",
      ringPulse:       "rgba(245,166,35,0.120)",
      glowAmplification:1.08,

      // Typography
      textSaturation:  1.04,                         // very slightly richer text
      letterSpacing:   "normal",
    }),

    // Presence synchronization — how people inside feel nearby
    presenceSync: Object.freeze({
      auraBlend:       "rgba(245,166,35,0.04)",
      auraRadius:      "48px",
      cohesionSpeed:   "12s",
    }),
  }),

  quiet_reflection: Object.freeze({
    id:              "quiet_reflection",
    emotionalField:  "Stille + Tiefe",

    whisperPool: [
      "Stille Resonanz verbindet diesen Raum.",
      "Eine ruhige kreative Energie sammelt sich hier.",
      "Tiefe Gedanken finden hier gemeinsam Resonanz.",
    ],

    minLifetimeMinutes:     60,
    typicalLifetimeMinutes: 150,

    visual: Object.freeze({
      surfaceTint:     "rgba(139,150,181,0.034)",    // lavender-grey depth
      glassShift:      -0.018,                       // slightly more opaque glass
      brightnessBoost: -0.022,                       // -2.2% (deeper)
      warmthBoost:     -0.012,

      motionScale:     0.76,                         // slowest motion
      floatAmplitude:  4,
      floatPeriod:     "20s",
      transitionEase:  "cubic-bezier(0.15,1,0.22,1)",

      ambientGlow:     "rgba(139,150,181,0.048)",
      ringPulse:       "rgba(139,150,181,0.090)",
      glowAmplification:0.82,

      textSaturation:  0.96,
      letterSpacing:   "0.01em",
    }),

    presenceSync: Object.freeze({
      auraBlend:       "rgba(139,150,181,0.05)",
      auraRadius:      "60px",
      cohesionSpeed:   "22s",
    }),
  }),

  night_presence: Object.freeze({
    id:              "night_presence",
    emotionalField:  "Nacht + Tiefe",

    whisperPool: [
      "Ein ruhiges Licht trägt diesen Raum durch die Nacht.",
      "Tiefe Stille verbindet die Menschen hier.",
      "Dieser Raum atmet langsam — und tief.",
    ],

    minLifetimeMinutes:     120,
    typicalLifetimeMinutes: 300,   // nights last longer

    visual: Object.freeze({
      surfaceTint:     "rgba(40,50,90,0.048)",       // deep indigo
      glassShift:      -0.028,
      brightnessBoost: -0.038,
      warmthBoost:     -0.018,

      motionScale:     0.64,                         // cinematic stillness
      floatAmplitude:  3,
      floatPeriod:     "26s",
      transitionEase:  "cubic-bezier(0.12,1,0.18,1)",

      ambientGlow:     "rgba(60,80,140,0.052)",
      ringPulse:       "rgba(22,215,197,0.060)",
      glowAmplification:0.72,

      textSaturation:  0.92,
      letterSpacing:   "0.015em",
    }),

    presenceSync: Object.freeze({
      auraBlend:       "rgba(60,80,140,0.06)",
      auraRadius:      "72px",
      cohesionSpeed:   "28s",
    }),
  }),

  gentle_gathering: Object.freeze({
    id:              "gentle_gathering",
    emotionalField:  "Wärme + Verbindung",

    whisperPool: [
      "Dieser Raum fühlt sich heute besonders lebendig an.",
      "Menschen kommen hier auf sanfte Weise zusammen.",
      "Eine warme menschliche Verbindung trägt diesen Raum.",
    ],

    minLifetimeMinutes:     45,
    typicalLifetimeMinutes: 120,

    visual: Object.freeze({
      surfaceTint:     "rgba(255,138,107,0.026)",    // coral softness
      glassShift:      0.018,
      brightnessBoost: 0.014,
      warmthBoost:     0.038,                        // warmest space

      motionScale:     1.02,
      floatAmplitude:  6,
      floatPeriod:     "10s",
      transitionEase:  "cubic-bezier(0.20,1,0.32,1)",

      ambientGlow:     "rgba(255,138,107,0.048)",
      ringPulse:       "rgba(255,138,107,0.110)",
      glowAmplification:1.10,

      textSaturation:  1.06,
      letterSpacing:   "normal",
    }),

    presenceSync: Object.freeze({
      auraBlend:       "rgba(255,138,107,0.05)",
      auraRadius:      "52px",
      cohesionSpeed:   "10s",
    }),
  }),

  shared_inspiration: Object.freeze({
    id:              "shared_inspiration",
    emotionalField:  "Inspiration + Verbindung",

    whisperPool: [
      "Inspiration bewegt sich gerade durch diesen Raum.",
      "Hier entsteht etwas gemeinsam Bedeutsames.",
      "Eine kollektive kreative Energie trägt diesen Raum.",
    ],

    minLifetimeMinutes:     60,
    typicalLifetimeMinutes: 150,

    visual: Object.freeze({
      surfaceTint:     "rgba(22,215,197,0.024)",     // teal clarity
      glassShift:      0.012,
      brightnessBoost: 0.010,
      warmthBoost:     0.016,

      motionScale:     1.00,
      floatAmplitude:  7,
      floatPeriod:     "9s",
      transitionEase:  "cubic-bezier(0.22,1,0.36,1)",

      ambientGlow:     "rgba(22,215,197,0.055)",
      ringPulse:       "rgba(22,215,197,0.120)",
      glowAmplification:1.12,

      textSaturation:  1.02,
      letterSpacing:   "normal",
    }),

    presenceSync: Object.freeze({
      auraBlend:       "rgba(22,215,197,0.06)",
      auraRadius:      "56px",
      cohesionSpeed:   "11s",
    }),
  }),

  soft_emergence: Object.freeze({
    id:              "soft_emergence",
    emotionalField:  "Entstehung + Neugier",

    whisperPool: [
      "Etwas Neues entsteht hier leise.",
      "Dieser Raum wächst gerade still.",
      "Neue kreative Energien finden hier zueinander.",
    ],

    minLifetimeMinutes:     30,
    typicalLifetimeMinutes: 90,

    visual: Object.freeze({
      surfaceTint:     "rgba(124,200,160,0.024)",    // sage green
      glassShift:      0.010,
      brightnessBoost: 0.008,
      warmthBoost:     0.018,

      motionScale:     0.90,
      floatAmplitude:  5,
      floatPeriod:     "14s",
      transitionEase:  "cubic-bezier(0.20,1,0.34,1)",

      ambientGlow:     "rgba(124,200,160,0.044)",
      ringPulse:       "rgba(124,200,160,0.090)",
      glowAmplification:0.96,

      textSaturation:  1.00,
      letterSpacing:   "normal",
    }),

    presenceSync: Object.freeze({
      auraBlend:       "rgba(124,200,160,0.05)",
      auraRadius:      "44px",
      cohesionSpeed:   "15s",
    }),
  }),

  deep_focus: Object.freeze({
    id:              "deep_focus",
    emotionalField:  "Fokus + Stille",

    whisperPool: [
      "Eine tiefe Stille trägt die kreative Energie hier.",
      "Konzentration und Schönheit verbinden sich in diesem Raum.",
      "Hier wird gerade mit echter Hingabe erschaffen.",
    ],

    minLifetimeMinutes:     90,
    typicalLifetimeMinutes: 240,

    visual: Object.freeze({
      surfaceTint:     "rgba(100,120,160,0.028)",    // cool blue-grey
      glassShift:      -0.014,
      brightnessBoost: -0.016,
      warmthBoost:     -0.010,

      motionScale:     0.70,
      floatAmplitude:  3,
      floatPeriod:     "24s",
      transitionEase:  "cubic-bezier(0.12,1,0.20,1)",

      ambientGlow:     "rgba(100,120,160,0.046)",
      ringPulse:       "rgba(22,215,197,0.070)",
      glowAmplification:0.80,

      textSaturation:  0.98,
      letterSpacing:   "0.012em",
    }),

    presenceSync: Object.freeze({
      auraBlend:       "rgba(100,120,160,0.055)",
      auraRadius:      "64px",
      cohesionSpeed:   "26s",
    }),
  }),

  human_connection: Object.freeze({
    id:              "human_connection",
    emotionalField:  "Verbindung + Vertrauen",

    whisperPool: [
      "Echte menschliche Verbindungen tragen diesen Raum.",
      "Vertrauen und Wärme verbinden die Menschen hier.",
      "Dieser Raum fühlt sich menschlich und echt an.",
    ],

    minLifetimeMinutes:     60,
    typicalLifetimeMinutes: 180,

    visual: Object.freeze({
      surfaceTint:     "rgba(196,151,58,0.022)",     // soft amber
      glassShift:      0.016,
      brightnessBoost: 0.012,
      warmthBoost:     0.028,

      motionScale:     0.88,
      floatAmplitude:  5,
      floatPeriod:     "13s",
      transitionEase:  "cubic-bezier(0.18,1,0.28,1)",

      ambientGlow:     "rgba(196,151,58,0.048)",
      ringPulse:       "rgba(255,138,107,0.100)",
      glowAmplification:1.04,

      textSaturation:  1.02,
      letterSpacing:   "normal",
    }),

    presenceSync: Object.freeze({
      auraBlend:       "rgba(196,151,58,0.05)",
      auraRadius:      "50px",
      cohesionSpeed:   "14s",
    }),
  }),

});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: SPACE EMERGENCE THRESHOLDS
// Minimum signal strength required for a space to emerge.
// Guards against empty or low-signal feeds generating spaces.
// ═══════════════════════════════════════════════════════════════════════════

// Min composite signal strength for any space to emerge
const EMERGENCE_THRESHOLD  = 0.28;

// Min signal advantage over second-strongest space
const DOMINANCE_GAP        = 0.08;

// Max number of concurrent spaces (avoids fragmentation)
const MAX_CONCURRENT_SPACES = 2;

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: NULL-SAFE INPUT NORMALIZERS
// ═══════════════════════════════════════════════════════════════════════════

const safeNum  = (v, fb = 0) => { const n = Number(v); return (isNaN(n) || !isFinite(n)) ? fb : Math.max(0, n); };
const safeArr  = (v)          => Array.isArray(v) ? v.filter(Boolean) : [];
const safeStr  = (v, fb = "") => (v != null && typeof v === "string") ? v : fb;

function normalizeFeed(rawFeed) {
  const items = safeArr(rawFeed);
  const n = items.length;
  if (n === 0) return buildEmptyFeed();

  let works = 0, notes = 0, experiences = 0, impacts = 0;
  let totalResonanz = 0, totalBerührt = 0, totalBegleitet = 0, totalViewers = 0;
  let presenceCounts = {};
  const creators = new Set();
  const talentSet = new Set();

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const type = safeStr(item.type || item.rhythmState, "post").toLowerCase();
    if (type.includes("work") || type === "werk")        works++;
    else if (type === "note"  || type === "thought")     notes++;
    else if (type === "experience" || type === "event")  experiences++;
    else if (type === "impact")                          impacts++;

    totalResonanz  += safeNum(item.resonanz  || item.stats?.likes);
    totalBerührt   += safeNum(item.berührt   || 0);
    totalBegleitet += safeNum(item.begleitet || item.stats?.bookings);
    totalViewers   += safeNum((item.viewers?.length || 0) + (item.viewerExtra || 0));

    const ps = safeStr(item.presenceState);
    if (ps) presenceCounts[ps] = (presenceCounts[ps] || 0) + 1;

    const creator = item.creatorId || item.userId || item.name || item.id;
    if (creator) creators.add(creator);
    const talent  = item.talent || item.category;
    if (talent)   talentSet.add(safeStr(talent).toLowerCase());
  }

  const dominant = Object.entries(presenceCounts).sort(([,a],[,b]) => b-a)[0]?.[0] || null;

  return {
    count:            n,
    workRatio:        works  / n,
    noteRatio:        notes  / n,
    experienceRatio:  experiences / n,
    impactRatio:      impacts / n,
    avgResonanz:      totalResonanz  / n,
    avgBerührt:       totalBerührt   / n,
    avgBegleitet:     totalBegleitet / n,
    avgViewers:       totalViewers   / n,
    creatorDiversity: creators.size  / Math.max(n, 1),
    talentDiversity:  talentSet.size / Math.max(creators.size, 1),
    dominantPresence: dominant,
    emotionalDensity: clamp((totalBerührt + totalBegleitet * 1.5) / Math.max(n, 1) / 15, 0, 1),
    presenceCounts,
  };
}

function normalizeAtmosphere(rawAtm) {
  if (!rawAtm || typeof rawAtm !== "object") return { id: "calm_transition", motionScale: 1 };
  return {
    id:            safeStr(rawAtm.id, "calm_transition"),
    motionScale:   safeNum(rawAtm.motionScale, 1.0),
    glowSoftening: safeNum(rawAtm.glowSoftening, 1.0),
    warmthDelta:   safeNum(rawAtm.warmthDelta,  0),
    feedSignals:   rawAtm.feedSignals || {},
  };
}

function normalizeActivity(rawActivity) {
  if (!rawActivity || typeof rawActivity !== "object") return {};
  return {
    activeCreators: safeNum(rawActivity.activeCreatorCount || rawActivity.active_creators),
    newWorks:       safeNum(rawActivity.newWorksToday      || rawActivity.new_works),
    events:         safeNum(rawActivity.eventsToday        || rawActivity.events_count),
    messages:       safeNum(rawActivity.messagesExchanged  || rawActivity.messages),
    growth:         safeNum(rawActivity.growthMomentum     || rawActivity.growth_rate),
  };
}

function normalizeRelationships(rawRels) {
  if (!rawRels || typeof rawRels !== "object") return { avgScore: 0, strongCount: 0 };
  // Accepts either an array of RelationshipMemory or an aggregated object
  if (Array.isArray(rawRels)) {
    const valid = rawRels.filter(r => r && !r._fallback && typeof r.resonanceScore === "number");
    const avg   = valid.length ? valid.reduce((s, r) => s + r.resonanceScore, 0) / valid.length : 0;
    const strong= valid.filter(r => r.resonanceScore > 0.44).length;
    return { avgScore: avg, strongCount: strong, totalCount: valid.length };
  }
  return {
    avgScore:    safeNum(rawRels.avgScore    || rawRels.avg_score),
    strongCount: safeNum(rawRels.strongCount || rawRels.strong_count),
    totalCount:  safeNum(rawRels.totalCount  || rawRels.total),
  };
}

function buildEmptyFeed() {
  return {
    count: 0, workRatio: 0, noteRatio: 0, experienceRatio: 0, impactRatio: 0,
    avgResonanz: 0, avgBerührt: 0, avgBegleitet: 0, avgViewers: 0,
    creatorDiversity: 0, talentDiversity: 0, dominantPresence: null,
    emotionalDensity: 0, presenceCounts: {},
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: SPACE EMERGENCE SCORERS
// Each returns a 0–1 strength for that space archetype emerging.
// ═══════════════════════════════════════════════════════════════════════════

function scoreWarmCreation(feed, atm, activity, rels) {
  const workEnergy    = clamp(feed.workRatio * 2.2, 0, 1);
  const creatingPres  = feed.dominantPresence === "creating" ? 0.40 : 0;
  const creativeAtm   = ["warm_creation", "collective_inspiration"].includes(atm.id) ? 0.25 : 0;
  const newWorks      = clamp(safeNum(activity.newWorks) / 18, 0, 1);
  const communalTouch = clamp(feed.avgBerührt / 10, 0, 1) * 0.5;

  return weightedMean([
    [workEnergy,    0.30],
    [creatingPres,  0.25],
    [creativeAtm,   0.20],
    [newWorks,      0.15],
    [communalTouch, 0.10],
  ]);
}

function scoreQuietReflection(feed, atm, activity, rels) {
  const noteEnergy    = clamp(feed.noteRatio * 2.5, 0, 1);
  const reflectPres   = feed.dominantPresence === "reflecting" ? 0.40 : 0;
  const quietAtm      = ["quiet_reflection", "calm_transition"].includes(atm.id) ? 0.25 : 0;
  const lowActivity   = clamp(1 - safeNum(activity.activeCreators) / 50, 0, 1);
  const deepTouch     = clamp(feed.emotionalDensity * 1.4, 0, 1);

  return weightedMean([
    [noteEnergy,    0.30],
    [reflectPres,   0.25],
    [quietAtm,      0.20],
    [lowActivity,   0.14],
    [deepTouch,     0.11],
  ]);
}

function scoreNightPresence(feed, atm, activity, rels) {
  // Almost entirely time-driven — only emerges at night
  const nightAtm      = atm.id === "deep_night_presence" ? 0.70 : 0;
  const deepEmotion   = clamp(feed.emotionalDensity * 1.6, 0, 1);
  const reflective    = clamp(feed.noteRatio * 2.0, 0, 1);
  const slowMotion    = clamp(1 - safeNum(atm.motionScale), 0, 1);

  return weightedMean([
    [nightAtm,    0.50],
    [deepEmotion, 0.22],
    [reflective,  0.16],
    [slowMotion,  0.12],
  ]);
}

function scoreGentleGathering(feed, atm, activity, rels) {
  const expEnergy     = clamp(feed.experienceRatio * 2.5, 0, 1);
  const gatherPres    = feed.dominantPresence === "gathering" ? 0.40 : 0;
  const eventActivity = clamp(safeNum(activity.events) / 4, 0, 1);
  const begleitet     = clamp(feed.avgBegleitet / 10, 0, 1);
  const socialRels    = clamp(safeNum(rels.strongCount) / 5, 0, 1);

  return weightedMean([
    [expEnergy,    0.28],
    [gatherPres,   0.24],
    [eventActivity,0.20],
    [begleitet,    0.17],
    [socialRels,   0.11],
  ]);
}

function scoreSharedInspiration(feed, atm, activity, rels) {
  const highResonanz  = clamp(feed.avgResonanz / 28, 0, 1);
  const diversity     = clamp(feed.creatorDiversity * 1.5, 0, 1);
  const talentSpread  = clamp(feed.talentDiversity, 0, 1);
  const inspAtm       = atm.id === "collective_inspiration" ? 0.30 : 0;
  const resonating    = feed.dominantPresence === "resonating" ? 0.30 : 0;

  return weightedMean([
    [highResonanz, 0.28],
    [diversity,    0.24],
    [talentSpread, 0.18],
    [inspAtm,      0.16],
    [resonating,   0.14],
  ]);
}

function scoreSoftEmergence(feed, atm, activity, rels) {
  const growthSignal  = clamp(safeNum(activity.growth) * 3, 0, 1);
  const newEnergy     = atm.id === "soft_emergence" ? 0.35 : 0;
  const impactPres    = clamp(feed.impactRatio * 3, 0, 1);
  const welcomingPres = feed.dominantPresence === "welcoming" ? 0.35 : 0;
  const lowBerührt    = clamp(1 - feed.avgBerührt / 12, 0, 1) * 0.3; // new = not yet deeply touched

  return weightedMean([
    [growthSignal,  0.30],
    [newEnergy,     0.26],
    [impactPres,    0.18],
    [welcomingPres, 0.16],
    [lowBerührt,    0.10],
  ]);
}

function scoreDeepFocus(feed, atm, activity, rels) {
  const workDominance = clamp(feed.workRatio * 2.0, 0, 1);
  const highDensity   = clamp(feed.emotionalDensity * 1.5, 0, 1);
  const lowDiversity  = clamp(1 - feed.creatorDiversity, 0, 1); // few creators, deep
  const slowAtm       = clamp(1 - safeNum(atm.motionScale, 1), 0, 1);
  const quietContext  = ["quiet_reflection", "deep_night_presence"].includes(atm.id) ? 0.20 : 0;

  return weightedMean([
    [workDominance, 0.28],
    [highDensity,   0.26],
    [lowDiversity,  0.20],
    [slowAtm,       0.16],
    [quietContext,  0.10],
  ]);
}

function scoreHumanConnection(feed, atm, activity, rels) {
  const strongRels    = clamp(safeNum(rels.strongCount) / 4, 0, 1);
  const avgRelScore   = clamp(safeNum(rels.avgScore) * 2, 0, 1);
  const messages      = clamp(safeNum(activity.messages) / 20, 0, 1);
  const berührtDepth  = clamp(feed.avgBerührt / 12, 0, 1);
  const warmAtm       = ["gentle_gathering", "warm_creation"].includes(atm.id) ? 0.20 : 0;

  return weightedMean([
    [strongRels,   0.32],
    [avgRelScore,  0.26],
    [messages,     0.20],
    [berührtDepth, 0.14],
    [warmAtm,      0.08],
  ]);
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: MAIN ENGINE — buildResonanceSpaces()
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Derives emergent Resonance Spaces from collective creative signals.
 *
 * @param {Array}            rawFeed         — normalized feed items
 * @param {SharedAtmosphere} rawAtmosphere   — from buildSharedAtmosphere()
 * @param {object}           rawActivity     — community activity signals
 * @param {Array|object}     rawRelationships— relationship memories or aggregate
 *
 * @returns {ResonanceSpacesResult} — frozen object
 *   {
 *     spaces:   Array<ActiveSpace>,   // 0–2 emerging spaces
 *     dominant: ActiveSpace | null,   // strongest space
 *     ambient:  AmbientField,         // blended visual field from all active spaces
 *     whisper:  string | null,        // very rare atmospheric text
 *     scores:   object,               // INTERNAL — never display
 *     _empty:   boolean,              // true if no spaces emerged
 *   }
 */
export function buildResonanceSpaces(
  rawFeed          = [],
  rawAtmosphere    = {},
  rawActivity      = {},
  rawRelationships = {},
) {
  const feed = normalizeFeed(rawFeed);
  const atm  = normalizeAtmosphere(rawAtmosphere);
  const act  = normalizeActivity(rawActivity);
  const rels = normalizeRelationships(rawRelationships);

  // ── Score all 8 archetypes ─────────────────────────────────────────
  const rawScores = {
    warm_creation:       scoreWarmCreation(feed,    atm, act, rels),
    quiet_reflection:    scoreQuietReflection(feed, atm, act, rels),
    night_presence:      scoreNightPresence(feed,   atm, act, rels),
    gentle_gathering:    scoreGentleGathering(feed, atm, act, rels),
    shared_inspiration:  scoreSharedInspiration(feed,atm, act, rels),
    soft_emergence:      scoreSoftEmergence(feed,   atm, act, rels),
    deep_focus:          scoreDeepFocus(feed,       atm, act, rels),
    human_connection:    scoreHumanConnection(feed, atm, act, rels),
  };

  // ── Filter to spaces above emergence threshold ────────────────────
  const candidates = Object.entries(rawScores)
    .filter(([, s]) => s >= EMERGENCE_THRESHOLD)
    .sort(([, a], [, b]) => b - a);

  // ── Check dominance gap ───────────────────────────────────────────
  // Second space only emerges if it's within reasonable range of the first
  const activeEntries = candidates.slice(0, MAX_CONCURRENT_SPACES).filter(([, score], i) => {
    if (i === 0) return true;
    const topScore = candidates[0][1];
    // Second space needs its own minimum AND must not be dominated
    return score >= EMERGENCE_THRESHOLD && (topScore - score) <= (1 - DOMINANCE_GAP);
  });

  if (activeEntries.length === 0) {
    return buildEmptySpaceResult(rawScores);
  }

  // ── Build active spaces ───────────────────────────────────────────
  const spaces = activeEntries.map(([id, score], rank) => {
    const archetype = SPACE_ARCHETYPES[id];
    if (!archetype) return null;

    // Compute lifetime: score influences how long the space lasts
    const lifetimeMultiplier = 0.7 + score * 0.6; // 0.7–1.3×
    const estimatedMinutes   = Math.round(
      archetype.typicalLifetimeMinutes * lifetimeMultiplier
    );

    // Space-specific whisper (very rare — see deriveSpaceWhisper)
    const whisper = rank === 0
      ? deriveSpaceWhisper(id, score, feed)
      : null;

    return Object.freeze({
      id,
      archetype,
      score,
      rank,
      strength:         categorizeStrength(score),
      estimatedMinutes,
      visual:           archetype.visual,
      presenceSync:     archetype.presenceSync,
      whisper,
      emotionalField:   archetype.emotionalField,
    });
  }).filter(Boolean);

  // ── Dominant space ────────────────────────────────────────────────
  const dominant = spaces[0] || null;

  // ── Blend ambient field from all active spaces ────────────────────
  const ambient = buildAmbientField(spaces);

  // ── Global whisper (from dominant space only) ─────────────────────
  const whisper = dominant?.whisper || null;

  return Object.freeze({
    spaces,
    dominant,
    ambient,
    whisper,
    scores:  rawScores,  // INTERNAL — never display
    _empty:  false,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: SPACE FADE — spaceFade()
// Spaces don't vanish — they slowly dissolve.
// Takes a past space result + time elapsed → returns faded version.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Applies natural fade to a space result over time.
 * Called when re-computing spaces to smoothly dissolve old ones.
 *
 * @param {ResonanceSpacesResult} pastResult
 * @param {ResonanceSpacesResult} freshResult
 * @param {number}               minutesElapsed
 *
 * @returns {ResonanceSpacesResult}
 */
export function spaceFade(pastResult, freshResult, minutesElapsed = 0) {
  if (!pastResult || pastResult._empty) return freshResult;
  if (!freshResult)                      return pastResult;

  // Space transitions use a 30-minute half-life
  // Spaces emerge faster than they dissolve (more human)
  const EMERGE_HALF_LIFE = 20;  // minutes — quick to form
  const FADE_HALF_LIFE   = 40;  // minutes — slow to dissolve

  const isExpanding = (freshResult.spaces?.length || 0) >= (pastResult.spaces?.length || 0);
  const halfLife    = isExpanding ? EMERGE_HALF_LIFE : FADE_HALF_LIFE;

  const t = clamp(1 - Math.pow(0.5, minutesElapsed / halfLife), 0, 0.95);

  // Blend ambient field
  const blendedAmbient = blendAmbientFields(
    pastResult.ambient || buildNullAmbient(),
    freshResult.ambient || buildNullAmbient(),
    t,
  );

  // Use fresh spaces when transition is past 50%
  const spaces  = t > 0.50 ? freshResult.spaces  : pastResult.spaces;
  const dominant= t > 0.50 ? freshResult.dominant : pastResult.dominant;

  return Object.freeze({
    ...freshResult,
    spaces,
    dominant,
    ambient: blendedAmbient,
    whisper: freshResult.whisper,
    _fadeT:  t,
    _empty:  false,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: AMBIENT FIELD BUILDER
// Blends visual tokens from all active spaces into one coherent field.
// ═══════════════════════════════════════════════════════════════════════════

function buildAmbientField(spaces) {
  if (!spaces || spaces.length === 0) return buildNullAmbient();

  // Weight by score (stronger spaces contribute more)
  const totalScore = spaces.reduce((s, sp) => s + sp.score, 0);

  const blended = spaces.reduce((acc, sp) => {
    const w = sp.score / totalScore;
    const v = sp.visual;
    return {
      surfaceTint:     acc.surfaceTint || v.surfaceTint,   // CSS string — take dominant
      glassShift:      acc.glassShift      + v.glassShift      * w,
      brightnessBoost: acc.brightnessBoost + v.brightnessBoost * w,
      warmthBoost:     acc.warmthBoost     + v.warmthBoost     * w,
      motionScale:     acc.motionScale     + v.motionScale     * w,
      floatAmplitude:  acc.floatAmplitude  + v.floatAmplitude  * w,
      glowAmplification:acc.glowAmplification + v.glowAmplification * w,
      textSaturation:  acc.textSaturation  + v.textSaturation  * w,
    };
  }, {
    surfaceTint: null, glassShift: 0, brightnessBoost: 0, warmthBoost: 0,
    motionScale: 0, floatAmplitude: 0, glowAmplification: 0, textSaturation: 0,
  });

  // Dominant space provides qualitative tokens
  const dominant = spaces[0];

  return Object.freeze({
    ...blended,
    surfaceTint:     dominant.visual.surfaceTint,
    floatPeriod:     dominant.visual.floatPeriod,
    transitionEase:  dominant.visual.transitionEase,
    ambientGlow:     dominant.visual.ambientGlow,
    ringPulse:       dominant.visual.ringPulse,
    presenceSync:    dominant.presenceSync,
    letterSpacing:   dominant.visual.letterSpacing,
    cardAliveSpeed:  spaces[0]?.archetype?.typicalLifetimeMinutes > 150 ? "20s" : "12s",
  });
}

function blendAmbientFields(past, fresh, t) {
  const lerp = (a, b) => a + (b - a) * t;
  return Object.freeze({
    // Blend numerical tokens
    glassShift:        lerp(safeNum(past.glassShift),       safeNum(fresh.glassShift)),
    brightnessBoost:   lerp(safeNum(past.brightnessBoost),  safeNum(fresh.brightnessBoost)),
    warmthBoost:       lerp(safeNum(past.warmthBoost),      safeNum(fresh.warmthBoost)),
    motionScale:       lerp(safeNum(past.motionScale, 1),   safeNum(fresh.motionScale, 1)),
    floatAmplitude:    lerp(safeNum(past.floatAmplitude),   safeNum(fresh.floatAmplitude)),
    glowAmplification: lerp(safeNum(past.glowAmplification,1),safeNum(fresh.glowAmplification,1)),
    textSaturation:    lerp(safeNum(past.textSaturation, 1),safeNum(fresh.textSaturation, 1)),
    // Qualitative: switch at 50%
    surfaceTint:    t > 0.5 ? fresh.surfaceTint   : past.surfaceTint,
    floatPeriod:    t > 0.5 ? fresh.floatPeriod   : past.floatPeriod,
    transitionEase: t > 0.5 ? fresh.transitionEase: past.transitionEase,
    ambientGlow:    t > 0.5 ? fresh.ambientGlow   : past.ambientGlow,
    ringPulse:      t > 0.5 ? fresh.ringPulse     : past.ringPulse,
    presenceSync:   t > 0.5 ? fresh.presenceSync  : past.presenceSync,
    letterSpacing:  t > 0.5 ? fresh.letterSpacing : past.letterSpacing,
    cardAliveSpeed: t > 0.5 ? fresh.cardAliveSpeed: past.cardAliveSpeed,
  });
}

function buildNullAmbient() {
  return Object.freeze({
    surfaceTint: "rgba(160,176,172,0.012)", glassShift: 0,
    brightnessBoost: 0, warmthBoost: 0, motionScale: 1,
    floatAmplitude: 6, floatPeriod: "14s",
    transitionEase: "cubic-bezier(0.22,1,0.36,1)",
    ambientGlow: "rgba(22,215,197,0.030)", ringPulse: "rgba(22,215,197,0.060)",
    presenceSync: null, glowAmplification: 1, textSaturation: 1, letterSpacing: "normal",
    cardAliveSpeed: "14s",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8: MEMOIZED SELECTORS
// Safe accessors — always return sensible defaults.
// ═══════════════════════════════════════════════════════════════════════════

/** Returns the dominant space id or null. */
export function selectDominantSpace(result) {
  return result?.dominant?.id ?? null;
}

/** Returns the ambient field (safe — always has defaults). */
export function selectAmbient(result) {
  return result?.ambient ?? buildNullAmbient();
}

/** Returns the space whisper or null. */
export function selectSpaceWhisper(result) {
  return result?.whisper ?? null;
}

/** Returns motion scale from the ambient field. */
export function selectSpaceMotionScale(result) {
  const s = result?.ambient?.motionScale;
  return (typeof s === "number" && !isNaN(s)) ? clamp(s, 0.60, 1.10) : 1.0;
}

/** Returns float period CSS string for animations. */
export function selectFloatPeriod(result) {
  return result?.ambient?.floatPeriod ?? "14s";
}

/** Returns presence sync config for the dominant space. */
export function selectPresenceSync(result) {
  return result?.ambient?.presenceSync ?? null;
}

/** Returns surface tint CSS string. */
export function selectSpaceSurfaceTint(result) {
  return result?.ambient?.surfaceTint ?? "rgba(160,176,172,0.012)";
}

/** Returns the ring pulse color for presence avatars in this space. */
export function selectRingPulse(result) {
  return result?.ambient?.ringPulse ?? "rgba(22,215,197,0.060)";
}

/** Returns true if no space has emerged. */
export function isEmptySpaceResult(result) {
  return !result || result._empty === true || !result.spaces?.length;
}

/** Debug summary — never pass to user UI. */
export function debugSpacesSummary(result) {
  if (!result || result._empty) return "[no spaces]";
  const sc = result.scores
    ? Object.entries(result.scores).sort(([,a],[,b])=>b-a).slice(0,3)
        .map(([k,v])=>`${k.split("_")[0]}:${(v*100).toFixed(0)}`).join(" | ")
    : "";
  const spaces = (result.spaces||[]).map(s=>`[${s.id} ${(s.score*100).toFixed(0)}%]`).join(" ");
  return `spaces:${spaces} | ${sc}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9: SPACE MEMORY TRACES
// Spaces leave emotional traces when a viewer returns.
// No visible system — just warmth on re-entry.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates an emotional trace from a space the viewer has been in.
 * To be stored locally — not in a database. Fades naturally.
 *
 * @param {ActiveSpace} space
 * @param {Date}        enteredAt
 * @returns {SpaceTrace}
 */
export function createSpaceTrace(space, enteredAt = new Date()) {
  if (!space || !space.id) return null;
  return Object.freeze({
    spaceId:       space.id,
    emotionalField:space.emotionalField,
    enteredAt:     enteredAt.toISOString(),
    // Visual warmth on re-entry (fades over 3 days — half-life 1 day)
    familiarity:   0.70,
  });
}

/**
 * Computes re-entry warmth from stored traces.
 * Returns a 0–0.35 warmth boost for a space the viewer has been in before.
 *
 * @param {string}       spaceId
 * @param {SpaceTrace[]} traces
 * @returns {number} 0–0.35
 */
export function spaceReEntryWarmth(spaceId, traces = []) {
  if (!spaceId || !traces.length) return 0;

  const trace = traces.find(t => t?.spaceId === spaceId);
  if (!trace) return 0;

  const enteredAt = new Date(trace.enteredAt);
  if (isNaN(enteredAt.getTime())) return 0;

  const daysSince = Math.max(0, (Date.now() - enteredAt.getTime()) / 86_400_000);
  const HALF_LIFE = 1;  // day — gentle, not sticky
  const warmth    = trace.familiarity * Math.pow(0.5, daysSince / HALF_LIFE);

  return clamp(warmth * 0.35, 0, 0.35);  // max 35% warmth boost
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 10: MOCK FACTORY
// Derives plausible space signals from feed alone (dev mode).
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Builds Resonance Spaces purely from feed items (no Supabase needed).
 * Uses sharedAtmosphere mock factories for activity/resonance.
 */
export function mockResonanceSpacesFromFeed(feedItems = [], sharedAtmosphere = null) {
  const { mockActivityFromFeed, mockResonanceFromFeed } = _mockFactories;

  // Safely access mock factories (avoids circular import — lazy resolution)
  const activity  = mockActivityFromFeed  ? mockActivityFromFeed(feedItems)  : {};
  const resonance = mockResonanceFromFeed ? mockResonanceFromFeed(feedItems) : {};
  const atm       = sharedAtmosphere || { id: "calm_transition", motionScale: 1.0, glowSoftening: 1.0 };

  return buildResonanceSpaces(feedItems, atm, activity, {});
}

// Internal: mock factory refs (set by sharedAtmosphere.js integration)
const _mockFactories = {
  mockActivityFromFeed:  null,
  mockResonanceFromFeed: null,
};

/** Register mock factories from sharedAtmosphere (avoids circular import). */
export function registerMockFactories(activityFn, resonanceFn) {
  _mockFactories.mockActivityFromFeed  = activityFn;
  _mockFactories.mockResonanceFromFeed = resonanceFn;
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

function categorizeStrength(score) {
  if (score >= 0.72) return "strong";
  if (score >= 0.52) return "moderate";
  if (score >= 0.36) return "emerging";
  return "faint";
}

function deriveSpaceWhisper(spaceId, score, feed) {
  // Only for strong-enough spaces
  if (score < 0.38) return null;

  // Very rare: deterministic hash from feed composition
  const hash = Math.floor(
    (feed.workRatio * 113 + feed.noteRatio * 89 + feed.avgBerührt * 17) * 100
  ) % 7;
  if (hash !== 0) return null;  // ~14% chance

  const archetype = SPACE_ARCHETYPES[spaceId];
  if (!archetype?.whisperPool?.length) return null;

  const pool = archetype.whisperPool;
  const idx  = Math.floor(
    (feed.experienceRatio * 100 + feed.avgResonanz * 3)
  ) % pool.length;

  return pool[idx];
}

function buildEmptySpaceResult(scores) {
  return Object.freeze({
    spaces:  [],
    dominant:null,
    ambient: buildNullAmbient(),
    whisper: null,
    scores,
    _empty:  true,
  });
}
