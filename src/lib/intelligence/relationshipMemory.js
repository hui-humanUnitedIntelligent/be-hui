// relationshipMemory.js — HUI Humane Memory Layer v1
//
// Philosophy: "quiet digital familiarity, not surveillance"
//
// This system models soft, fading human resonance between two people —
// how a creative community slowly becomes familiar over time.
//
// The output is purely atmospheric:
//   → subtle visual warmth
//   → softer motion timing
//   → rare, contextual micro-moments
//   → gentle ordering influence in curateHumaneFeed
//
// What this is NOT:
//   → friendship meters
//   → relationship scoring
//   → social graph analysis
//   → behavioral profiling
//   → surveillance of any kind
//
// ── Architecture ───────────────────────────────────────────────────────────
//   • All computation is local + deterministic
//   • No raw interaction data stored — only aggregated signals
//   • Memory decays naturally (half-life model)
//   • Meaningful moments persist longer than casual ones
//   • SSR-safe, null-safe, mobile-performant
//   • Compatible with emotionalIdentity, curateHumaneFeed, presence system
// ─────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: RELATIONSHIP STATE TOKENS
// Internal atmospheric states — never surfaced as public labels.
// Each state carries visual atmosphere adjustments only.
// ═══════════════════════════════════════════════════════════════════════════

export const RELATIONSHIP_STATES = Object.freeze({

  emerging_connection: Object.freeze({
    id:             "emerging_connection",
    // Very subtle — just a hint of warmth
    warmthBoost:    0.08,       // +% to ambient color opacity
    motionCalm:     0.04,       // -% from motion speed
    glowBoost:      0.05,
    transitionEase: "cubic-bezier(0.22,1,0.36,1)",
    cardDelay:      0.92,       // multiplier on reveal delay (< 1 = slightly earlier)
    microMomentPool: [
      "Eine neue kreative Begegnung entsteht leise.",
      "Etwas verbindet eure Perspektiven.",
    ],
  }),

  familiar_presence: Object.freeze({
    id:             "familiar_presence",
    warmthBoost:    0.14,
    motionCalm:     0.10,
    glowBoost:      0.10,
    transitionEase: "cubic-bezier(0.18,1,0.30,1)",
    cardDelay:      0.88,
    microMomentPool: [
      "Ihr begegnet euch immer wieder in ähnlichen Momenten.",
      "Eine vertraute kreative Nähe wächst still.",
    ],
  }),

  quiet_connection: Object.freeze({
    id:             "quiet_connection",
    warmthBoost:    0.20,
    motionCalm:     0.16,
    glowBoost:      0.16,
    transitionEase: "cubic-bezier(0.15,1,0.25,1)",
    cardDelay:      0.84,
    microMomentPool: [
      "Diese kreative Verbindung wächst leise.",
      "Vertraute Resonanz entsteht langsam.",
      "Ihr teilt etwas Stilles, das wächst.",
    ],
  }),

  creative_alignment: Object.freeze({
    id:             "creative_alignment",
    warmthBoost:    0.26,
    motionCalm:     0.22,
    glowBoost:      0.22,
    transitionEase: "cubic-bezier(0.12,1,0.22,1)",
    cardDelay:      0.80,
    microMomentPool: [
      "Eure kreativen Welten berühren sich immer öfter.",
      "Etwas verbindet eure Ausdrucksweise tief.",
      "Diese Verbindung trägt etwas Echtes in sich.",
    ],
  }),

  shared_resonance: Object.freeze({
    id:             "shared_resonance",
    warmthBoost:    0.32,
    motionCalm:     0.28,
    glowBoost:      0.28,
    transitionEase: "cubic-bezier(0.10,1,0.18,1)",
    cardDelay:      0.76,
    microMomentPool: [
      "Gemeinsame Resonanz verbindet euch über Zeit.",
      "Ihr habt etwas Bedeutsames miteinander geteilt.",
      "Diese Verbindung hat eine Geschichte.",
    ],
  }),

  trusted_presence: Object.freeze({
    id:             "trusted_presence",
    warmthBoost:    0.40,
    motionCalm:     0.35,
    glowBoost:      0.35,
    transitionEase: "cubic-bezier(0.08,1,0.14,1)",
    cardDelay:      0.72,
    microMomentPool: [
      "Eine echte kreative Verbindung lebt hier.",
      "Vertrauen entsteht still — und bleibt.",
      "Ihr seid in dieser Gemeinschaft wirklich verbunden.",
    ],
  }),

});

// Ordered by depth — used for threshold mapping
const STATE_THRESHOLDS = [
  { minScore: 0.00, state: null },                              // no state below threshold
  { minScore: 0.12, state: "emerging_connection"  },
  { minScore: 0.28, state: "familiar_presence"    },
  { minScore: 0.44, state: "quiet_connection"     },
  { minScore: 0.58, state: "creative_alignment"   },
  { minScore: 0.72, state: "shared_resonance"     },
  { minScore: 0.86, state: "trusted_presence"     },
];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: MEMORY DECAY MODEL
// Different interaction types have different half-lives.
// Meaningful moments persist longer than casual ones.
// ═══════════════════════════════════════════════════════════════════════════

export const MEMORY_HALF_LIVES = Object.freeze({
  // Casual / lightweight
  profile_view:        5,   // days — brief curiosity fades quickly
  reaction_given:      7,   // simple resonanz tap
  card_expanded:       6,

  // Meaningful engagement
  berührt_given:      14,   // emotional touch — "berührt"
  saved_work:         21,   // saved to space — genuine interest
  message_sent:       28,   // direct contact — significant
  comment_written:    18,   // investment of thought

  // Shared experience
  event_together:     45,   // shared physical/digital space
  begleitet_given:    35,   // committed to a booking
  inspired_reaction:  21,   // "inspiriert" — rarer, more meaningful

  // Long-term
  recurring_visits:   30,   // multiple profile visits over time
  theme_overlap:      12,   // shared mood/category interests
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: NULL-SAFE INPUT NORMALIZERS
// ═══════════════════════════════════════════════════════════════════════════

const safeNum  = (v, fb = 0)    => { const n = Number(v); return (isNaN(n) || !isFinite(n)) ? fb : Math.max(0, n); };
const safeBool = (v)             => Boolean(v);
const safeDate = (v)             => { try { return v ? new Date(v) : null; } catch { return null; } };
const safeArr  = (v)             => Array.isArray(v) ? v.filter(Boolean) : [];

function normalizeViewer(raw = {}) {
  return {
    id:         String(raw.id || raw.user_id || ""),
    interests:  safeArr(raw.interests || raw.tags || raw.skills),
    mood:       String(raw.mood || raw.currentMood || ""),
  };
}

function normalizeCreator(raw = {}) {
  return {
    id:         String(raw.id || raw.user_id || raw.creatorId || ""),
    talent:     String(raw.talent || raw.category || raw.focus_type || ""),
    tags:       safeArr(raw.tags || raw.skills || raw.dna_tags),
    mood:       String(raw.mood || raw.currentMood || ""),
  };
}

function normalizeInteractions(raw = {}) {
  return {
    // View signals
    profileViewCount:    safeNum(raw.profileViewCount    || raw.profile_views),
    cardExpandCount:     safeNum(raw.cardExpandCount     || raw.card_expands),

    // Reaction signals
    resonanzGiven:       safeNum(raw.resonanzGiven       || raw.reactions_given),
    berührtGiven:        safeNum(raw.berührtGiven        || raw.touched_given),
    inspiredGiven:       safeNum(raw.inspiredGiven       || raw.inspired_given),

    // Commitment signals
    savedWorks:          safeNum(raw.savedWorks          || raw.saves),
    begleitetGiven:      safeNum(raw.begleitetGiven      || raw.bookings_given),
    eventsShared:        safeNum(raw.eventsShared        || raw.events_together),
    commentsWritten:     safeNum(raw.commentsWritten     || raw.comments_given),
    messagesSent:        safeNum(raw.messagesSent        || raw.messages_given),

    // Temporal signals
    firstInteractionAt:  safeDate(raw.firstInteractionAt || raw.first_seen_at),
    lastInteractionAt:   safeDate(raw.lastInteractionAt  || raw.last_seen_at),
    daysSinceLastSeen:   safeNum(raw.daysSinceLastSeen   || raw.days_since),

    // Theme alignment
    sharedThemes:        safeArr(raw.sharedThemes        || raw.shared_tags || []),
    themeOverlapScore:   safeNum(raw.themeOverlapScore   || raw.theme_overlap),  // 0–1

    // Interaction recency (normalized 0–1 externally, or compute from date)
    recencyScore:        safeNum(raw.recencyScore        || raw.recency),        // 0–1
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: DECAY CALCULATOR
// Applies half-life decay to a raw signal count.
// Returns a 0–1 score: how "alive" this memory still is.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Apply exponential half-life decay to a signal.
 *
 * @param {number} rawCount         — how many times this happened
 * @param {number} halfLifeDays     — half-life in days
 * @param {number} daysSinceLastOccurrence
 * @param {number} maxCount         — count at which signal saturates (default: 10)
 *
 * @returns {number} 0–1
 */
export function decayedSignal(rawCount, halfLifeDays, daysSinceLastOccurrence = 0, maxCount = 10) {
  if (rawCount <= 0 || halfLifeDays <= 0) return 0;

  // Saturate at maxCount (e.g., 10 visits → same as 10)
  const saturated = Math.min(rawCount / maxCount, 1.0);

  // Exponential decay: value × 0.5^(days / halfLife)
  const decay     = Math.pow(0.5, Math.max(0, daysSinceLastOccurrence) / halfLifeDays);

  return clamp(saturated * decay, 0, 1);
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: SIGNAL EXTRACTORS
// Each extracts a 0–1 score for one dimension of the relationship.
// ═══════════════════════════════════════════════════════════════════════════

function signalAttentionDepth(interactions, days) {
  const views   = decayedSignal(interactions.profileViewCount, MEMORY_HALF_LIVES.profile_view,    days, 8);
  const expands = decayedSignal(interactions.cardExpandCount,  MEMORY_HALF_LIVES.card_expanded,   days, 12);
  return weightedMean([
    [views,   0.45],
    [expands, 0.55],
  ]);
}

function signalEmotionalTouch(interactions, days) {
  const berührt  = decayedSignal(interactions.berührtGiven,   MEMORY_HALF_LIVES.berührt_given,   days, 6);
  const inspired = decayedSignal(interactions.inspiredGiven,  MEMORY_HALF_LIVES.inspired_reaction,days, 6);
  const resonanz = decayedSignal(interactions.resonanzGiven,  MEMORY_HALF_LIVES.reaction_given,  days, 15);
  return weightedMean([
    [berührt,  0.40],
    [inspired, 0.38],
    [resonanz, 0.22],
  ]);
}

function signalCommitment(interactions, days) {
  const saved     = decayedSignal(interactions.savedWorks,       MEMORY_HALF_LIVES.saved_work,       days, 5);
  const begleitet = decayedSignal(interactions.begleitetGiven,   MEMORY_HALF_LIVES.begleitet_given,  days, 3);
  const events    = decayedSignal(interactions.eventsShared,     MEMORY_HALF_LIVES.event_together,   days, 3);
  const messages  = decayedSignal(interactions.messagesSent,     MEMORY_HALF_LIVES.message_sent,     days, 6);
  return weightedMean([
    [saved,     0.28],
    [begleitet, 0.25],
    [events,    0.27],
    [messages,  0.20],
  ]);
}

function signalConsistency(interactions, days) {
  // How long have they been aware of each other?
  const longevity = interactions.firstInteractionAt
    ? clamp(daysBetween(interactions.firstInteractionAt, new Date()) / 90, 0, 1) // up to 90 days
    : 0;

  // Recency: is there still active engagement?
  const recency   = interactions.recencyScore > 0
    ? interactions.recencyScore
    : clamp(1 - days / 30, 0, 1);   // if no explicit score: fade over 30 days

  // Comments: investment of thought over time
  const comments  = decayedSignal(interactions.commentsWritten, MEMORY_HALF_LIVES.comment_written, days, 8);

  return weightedMean([
    [longevity, 0.40],
    [recency,   0.38],
    [comments,  0.22],
  ]);
}

function signalThemeAlignment(viewer, creator, interactions) {
  // Explicit overlap score if available
  if (interactions.themeOverlapScore > 0) {
    return clamp(interactions.themeOverlapScore, 0, 1);
  }

  // Compute from tag arrays
  const vTags = (viewer.interests || []).map(t => String(t).toLowerCase());
  const cTags = (creator.tags     || []).map(t => String(t).toLowerCase());

  if (vTags.length === 0 || cTags.length === 0) return 0.2;  // neutral fallback

  const shared = vTags.filter(t => cTags.includes(t)).length;
  const union  = new Set([...vTags, ...cTags]).size;
  return union > 0 ? clamp(shared / union, 0, 1) : 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: MAIN ENGINE — buildRelationshipMemory()
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Derives a soft relational atmosphere from observable interaction signals.
 *
 * @param {object} rawViewer      — viewer profile (createProfileItem output or raw)
 * @param {object} rawCreator     — creator profile (createProfileItem output or raw)
 * @param {object} rawInteractions— interaction signals between viewer and creator
 *
 * @returns {RelationshipMemory} — frozen object
 *   {
 *     state,              // RELATIONSHIP_STATES key | null
 *     tokens,             // RELATIONSHIP_STATES[state] object | null
 *     resonanceScore,     // 0–1 (INTERNAL — never display)
 *     warmthBoost,        // 0–0.40 — added to ambient opacity
 *     motionCalm,         // 0–0.35 — subtracted from motion speed
 *     glowBoost,          // 0–0.35 — added to glow intensity
 *     cardDelay,          // 0.72–1.0 — multiplier on reveal delay
 *     microMoment,        // string | null — contextual soft text
 *     signals,            // { attention, touch, commitment, consistency, alignment } — INTERNAL
 *     _fallback,          // true if no meaningful relationship
 *   }
 */
export function buildRelationshipMemory(rawViewer = {}, rawCreator = {}, rawInteractions = {}) {
  const viewer       = normalizeViewer(rawViewer);
  const creator      = normalizeCreator(rawCreator);
  const interactions = normalizeInteractions(rawInteractions);

  // Days since last interaction — used across all signals
  const days = interactions.daysSinceLastSeen > 0
    ? interactions.daysSinceLastSeen
    : (interactions.lastInteractionAt
        ? daysBetween(interactions.lastInteractionAt, new Date())
        : 0);

  // ── Extract individual signals ─────────────────────────────────────
  const attention   = signalAttentionDepth(interactions, days);
  const touch       = signalEmotionalTouch(interactions, days);
  const commitment  = signalCommitment(interactions, days);
  const consistency = signalConsistency(interactions, days);
  const alignment   = signalThemeAlignment(viewer, creator, interactions);

  const signals = { attention, touch, commitment, consistency, alignment };

  // ── Composite resonance score ─────────────────────────────────────
  // Commitment + touch are weighted highest — they require real investment
  const resonanceScore = weightedMean([
    [attention,   0.12],   // lightweight — just looking
    [touch,       0.28],   // emotional reactions
    [commitment,  0.30],   // real investment
    [consistency, 0.22],   // long-term familiarity
    [alignment,   0.08],   // shared themes — supporting signal
  ]);

  // ── Map to relationship state ────────────────────────────────────
  let matchedState = null;
  for (const { minScore, state } of STATE_THRESHOLDS) {
    if (resonanceScore >= minScore) matchedState = state;
  }

  // No meaningful relationship yet
  if (!matchedState) {
    return buildFallbackMemory(signals, resonanceScore);
  }

  const tokens = RELATIONSHIP_STATES[matchedState];

  // ── Derive micro-moment (rare + contextual) ──────────────────────
  const microMoment = deriveMicroMoment(matchedState, signals, interactions, viewer, creator);

  return Object.freeze({
    state:          matchedState,
    tokens,
    resonanceScore,
    // Visual atmosphere adjustments (safe to consume directly)
    warmthBoost:    tokens.warmthBoost,
    motionCalm:     tokens.motionCalm,
    glowBoost:      tokens.glowBoost,
    cardDelay:      tokens.cardDelay,
    microMoment,
    signals,        // INTERNAL — for debugging only
    _fallback:      false,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: RELATIONSHIP DRIFT
// Memory evolves slowly — half-life blending between past and fresh.
// Prevents abrupt appearance/disappearance of familiarity.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Blends a stored (past) relationship memory with freshly computed memory.
 * Governs how fast familiarity grows or fades.
 *
 * @param {RelationshipMemory} pastMemory        — previously stored memory
 * @param {RelationshipMemory} freshMemory       — just computed
 * @param {number}             daysSinceUpdate   — days since pastMemory was built
 *
 * @returns {RelationshipMemory}
 */
export function relationshipDrift(pastMemory, freshMemory, daysSinceUpdate = 0) {
  if (!pastMemory || pastMemory._fallback) return freshMemory;
  if (!freshMemory)                         return pastMemory;

  // Growth rate: faster to build familiarity, slower to lose it
  // Building: 7-day half-life for growth
  // Fading:   14-day half-life for decay (asymmetric — more human)
  const isGrowing = freshMemory.resonanceScore >= pastMemory.resonanceScore;
  const halfLife  = isGrowing ? 7 : 14;

  const driftRatio = clamp(
    1 - Math.pow(0.5, daysSinceUpdate / halfLife),
    0,
    0.90  // never fully replace past — always some continuity
  );

  // Blend numerical atmosphere tokens
  const warmthBoost = lerp(pastMemory.warmthBoost ?? 0, freshMemory.warmthBoost ?? 0, driftRatio);
  const motionCalm  = lerp(pastMemory.motionCalm  ?? 0, freshMemory.motionCalm  ?? 0, driftRatio);
  const glowBoost   = lerp(pastMemory.glowBoost   ?? 0, freshMemory.glowBoost   ?? 0, driftRatio);
  const cardDelay   = lerp(pastMemory.cardDelay   ?? 1, freshMemory.cardDelay   ?? 1, driftRatio);
  const score       = lerp(pastMemory.resonanceScore ?? 0, freshMemory.resonanceScore ?? 0, driftRatio);

  // State: switch only when drift is substantial (> 40%)
  // Prevents state flickering on minor signal changes
  const useNewState = driftRatio > 0.40;
  const finalState  = useNewState ? freshMemory.state : pastMemory.state;
  const finalTokens = finalState ? RELATIONSHIP_STATES[finalState] : null;

  return Object.freeze({
    ...(useNewState ? freshMemory : pastMemory),

    // Smoothed visual tokens
    warmthBoost,
    motionCalm,
    glowBoost,
    cardDelay,
    resonanceScore: score,
    tokens:         finalTokens,
    state:          finalState,

    // Fresh signals always
    signals:        freshMemory.signals,
    microMoment:    freshMemory.microMoment,

    // Drift metadata
    _driftRatio:    driftRatio,
    _fallback:      false,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8: MEMOIZED SELECTORS
// Safe accessors — always return fallback values, never throw.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Returns the warmth boost (0–0.40) for a relationship memory.
 * Used to tint ambient glow colors.
 */
export function selectWarmthBoost(memory) {
  return clamp(memory?.warmthBoost ?? 0, 0, 0.40);
}

/**
 * Returns the motion calm factor (0–0.35).
 * Subtract from animation speed multiplier for warmer feel.
 */
export function selectMotionCalm(memory) {
  return clamp(memory?.motionCalm ?? 0, 0, 0.35);
}

/**
 * Returns the card reveal delay multiplier (0.72–1.0).
 * Multiply the stagger delay by this — familiar content appears slightly sooner.
 */
export function selectCardDelay(memory) {
  const d = memory?.cardDelay;
  if (typeof d !== "number" || isNaN(d)) return 1.0;
  return clamp(d, 0.72, 1.0);
}

/**
 * Returns the glow boost (0–0.35) for ring + card glow amplification.
 */
export function selectGlowBoost(memory) {
  return clamp(memory?.glowBoost ?? 0, 0, 0.35);
}

/**
 * Returns the relationship state id or null.
 */
export function selectRelationshipState(memory) {
  return memory?.state ?? null;
}

/**
 * Returns a contextual micro-moment string or null.
 */
export function selectMicroMoment(memory) {
  return memory?.microMoment ?? null;
}

/**
 * Returns true if no meaningful relationship has formed.
 */
export function isFallbackMemory(memory) {
  return !memory || memory._fallback === true;
}

/**
 * Returns a debug summary string. NEVER pass this to user UI.
 */
export function debugMemorySummary(memory) {
  if (!memory) return "[no memory]";
  const s = memory.signals || {};
  return `[${memory.state || "none"}] score:${((memory.resonanceScore||0)*100).toFixed(0)}% | `
    + `att:${((s.attention||0)*100).toFixed(0)} `
    + `touch:${((s.touch||0)*100).toFixed(0)} `
    + `commit:${((s.commitment||0)*100).toFixed(0)} `
    + `consist:${((s.consistency||0)*100).toFixed(0)} `
    + `align:${((s.alignment||0)*100).toFixed(0)}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9: FEED INTEGRATION HELPER
// Attach relationship memory to an enriched feed item.
// Influences warmth, delay, and micro-moments in curateHumaneFeed.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Enriches a feed item with relationship memory tokens.
 * Called inside curateHumaneFeed when viewer context is available.
 *
 * @param {FeedItem}           item        — normalized feed item
 * @param {RelationshipMemory} memory      — from buildRelationshipMemory()
 *
 * @returns {FeedItem} — new object with _relationship attached
 */
export function attachRelationshipToFeedItem(item, memory) {
  if (!item || !memory || memory._fallback) return item;

  return Object.freeze({
    ...item,
    _relationship: memory,
    // Hoist key tokens for direct consumption by RhythmicFeed
    _warmthBoost:  selectWarmthBoost(memory),
    _motionCalm:   selectMotionCalm(memory),
    _glowBoost:    selectGlowBoost(memory),
    _cardDelay:    selectCardDelay(memory),
    // Override microMoment if relationship provides a more contextual one
    microMoment:   memory.microMoment || item.microMoment || null,
  });
}

/**
 * Soft ordering weight for a feed item based on relationship.
 * Returns a 0–1 boost — NOT a hard priority.
 * Used as a gentle secondary sort signal.
 */
export function relationshipOrderingBoost(memory) {
  if (!memory || memory._fallback) return 0;
  // Small nudge: max +15% ordering weight
  return clamp(memory.resonanceScore * 0.15, 0, 0.15);
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 10: MICRO-MOMENT DERIVATION
// Contextual — only fires when signals genuinely warrant it.
// Uses relationship state + signal patterns, not randomness.
// ═══════════════════════════════════════════════════════════════════════════

function deriveMicroMoment(state, signals, interactions, viewer, creator) {
  // Only emit micro-moments for meaningful relationships
  if (!state || state === "emerging_connection") return null;

  // Deterministic rarity gate — avoids repetition across feed
  const hash = (
    (viewer.id  || "").split("").reduce((a,c) => a + c.charCodeAt(0), 0) +
    (creator.id || "").split("").reduce((a,c) => a + c.charCodeAt(0), 7)
  );
  // ~40% chance for quiet_connection, higher for deeper states
  const rarityThreshold = state === "quiet_connection"  ? 3
    : state === "creative_alignment"  ? 2
    : state === "shared_resonance"    ? 2
    : state === "trusted_presence"    ? 1
    : 4;

  if (hash % rarityThreshold !== 0) return null;

  // Context-specific: choose from state's micro-moment pool
  const tokens = RELATIONSHIP_STATES[state];
  if (!tokens?.microMomentPool?.length) return null;

  const pool = tokens.microMomentPool;
  return pool[hash % pool.length];
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 11: MOCK RELATIONSHIP DATA FACTORY
// For development — builds plausible interaction signals from feed item data.
// Replaces hardcoded zeros when Supabase data isn't connected yet.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Builds mock interaction data from available feed item signals.
 * Uses resonanz/berührt/viewers as proxies for real interactions.
 * Deterministic — same item always produces same mock interactions.
 *
 * @param {FeedItem} item — normalized feed item
 * @param {string}   viewerId — current viewer's id
 * @returns {object} — mock interaction signals
 */
export function mockInteractionsFromItem(item, viewerId = "") {
  // Deterministic seed from viewer + creator
  const seed = (
    (viewerId   || "").split("").reduce((a,c) => a + c.charCodeAt(0), 3) +
    (item.name  || item.id || "").split("").reduce((a,c) => a + c.charCodeAt(0), 5)
  );

  // Only generate relationship signals for a subset of creators (~40%)
  if (seed % 5 >= 2) return {};   // 60% → no relationship signals

  const level = seed % 5;         // 0 or 1 → light relationship

  return {
    profileViewCount:   1 + (seed % 4),
    resonanzGiven:      level > 0 ? 2 + (seed % 4) : (seed % 2),
    berührtGiven:       level > 0 ? (seed % 3)     : 0,
    inspiredGiven:      level > 0 && (seed % 3 === 0) ? 1 : 0,
    savedWorks:         seed % 7 === 0 ? 1 : 0,
    commentsWritten:    level > 0 && seed % 5 === 0 ? 1 : 0,
    daysSinceLastSeen:  2 + (seed % 8),
    themeOverlapScore:  seed % 3 === 0 ? 0.4 + (seed % 10) * 0.04 : 0,
    recencyScore:       clamp(1 - (2 + (seed % 8)) / 14, 0, 1),
    firstInteractionAt: null,
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

function daysBetween(dateA, dateB) {
  try {
    const ms = Math.abs(new Date(dateB).getTime() - new Date(dateA).getTime());
    return Math.floor(ms / 86_400_000);
  } catch {
    return 0;
  }
}

function buildFallbackMemory(signals = {}, resonanceScore = 0) {
  return Object.freeze({
    state:          null,
    tokens:         null,
    resonanceScore,
    warmthBoost:    0,
    motionCalm:     0,
    glowBoost:      0,
    cardDelay:      1.0,
    microMoment:    null,
    signals,
    _fallback:      true,
  });
}
