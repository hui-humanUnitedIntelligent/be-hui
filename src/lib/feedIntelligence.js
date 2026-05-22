// feedIntelligence.js — HUI Feed Intelligence v1 + Relationship Memory v1
//
// Philosophy: "walking through a living creative world, not consuming content"
//
// This is NOT algorithmic addiction design.
// This is humane curation — optimizing for emotional quality, not engagement time.
//
// All functions are pure (no side effects, no external calls).
// The engine runs on the client during useMemo — zero latency.

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: EMOTIONAL WEIGHT SYSTEM
// Each content type carries an emotional weight (0–1).
// Heavy content needs a lighter successor to maintain breathing room.
// ─────────────────────────────────────────────────────────────────────────────

const EMOTIONAL_WEIGHT = {
  hero:       0.85,   // Large immersive — demands attention
  experience: 0.65,   // Social energy — warm but present
  resonance:  0.40,   // Compact — light engagement
  note:       0.55,   // Reflective — moderate depth
  quiet:      0.00,   // Breathing space — zero weight
  post:       0.45,
  werk:       0.70,
  impact:     0.60,
  story:      0.30,
  activity:   0.25,
};

const VISUAL_DENSITY = {
  hero:       1.0,   // Full-width, large media
  experience: 0.65,
  resonance:  0.35,  // Compact
  note:       0.40,
  quiet:      0.0,
  post:       0.50,
  werk:       0.75,
  impact:     0.55,
  story:      0.20,
};

function getWeight(item) {
  const state = item.rhythmState || item.type || "post";
  return EMOTIONAL_WEIGHT[state] ?? 0.45;
}

function getDensity(item) {
  const state = item.rhythmState || item.type || "post";
  return VISUAL_DENSITY[state] ?? 0.50;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: TIME-OF-DAY ATMOSPHERE
// Subtle tone adjustments — NOT dramatic theme switches.
// ─────────────────────────────────────────────────────────────────────────────

// ── Relationship Memory integration
import {
  buildRelationshipMemory,
  attachRelationshipToFeedItem,
  relationshipOrderingBoost,
  mockInteractionsFromItem,
} from "./intelligence/relationshipMemory.js";

// ── Shared Atmosphere integration
import {
  buildSharedAtmosphere,
  applyAtmosphereToFeed,
  mockActivityFromFeed,
  mockResonanceFromFeed,
} from "./intelligence/sharedAtmosphere.js";

// ── Resonance Spaces integration
import {
  buildResonanceSpaces,
  registerMockFactories,
} from "./intelligence/resonanceSpaces.js";

// Register mock factories once
registerMockFactories(mockActivityFromFeed, mockResonanceFromFeed);

// ── World Continuity integration
import {
  buildWorldContinuity,
} from "./intelligence/worldContinuity.js";

export const TIME_ATMOSPHERES = {
  morning: {           // 05:00–11:59
    id:          "morning",
    label:       "Guter Morgen",
    feedLabel:   "Morgenstimmung",
    motionSpeed: 1.15,         // slightly faster reveals
    ambientTone: "gold",
    tealOpacity: 0.05,
    coralOpacity:0.07,
    goldOpacity: 0.09,
    cardSurface: "rgba(255,252,248,0.84)",   // warmer white
    feedTagline: "Was bewegt dich heute?",
    quotePool:   [
      "Was entsteht, wenn du heute anfängst?",
      "Jeder Morgen ist ein neuer Anfang.",
      "Der erste Moment des Tages gehört dir.",
    ],
  },
  day: {               // 12:00–16:59
    id:          "day",
    label:       "Guten Tag",
    feedLabel:   "Gerade aktiv",
    motionSpeed: 1.00,
    ambientTone: "neutral",
    tealOpacity: 0.06,
    coralOpacity:0.04,
    goldOpacity: 0.04,
    cardSurface: "rgba(255,255,255,0.80)",
    feedTagline: null,
    quotePool:   [
      "Teile heute etwas, das dich bewegt.",
      "Jede echte Wirkung beginnt mit einem kleinen Impuls.",
      "Kreativität ist kein Zustand — sie ist eine Begegnung.",
    ],
  },
  evening: {           // 17:00–21:59
    id:          "evening",
    label:       "Guten Abend",
    feedLabel:   "Abendstimmung",
    motionSpeed: 0.88,         // slightly slower reveals
    ambientTone: "warm",
    tealOpacity: 0.07,
    coralOpacity:0.08,
    goldOpacity: 0.05,
    cardSurface: "rgba(254,251,248,0.84)",   // warm cream
    feedTagline: "Was hat dich heute berührt?",
    quotePool:   [
      "Was hat dich heute wirklich bewegt?",
      "Jeder Abend trägt das Licht des Tages in sich.",
      "Lass den Tag in dir ankommen.",
    ],
  },
  night: {             // 22:00–04:59
    id:          "night",
    label:       "Gute Nacht",
    feedLabel:   "Nachtgedanken",
    motionSpeed: 0.72,         // slowest — most reflective
    ambientTone: "deep",
    tealOpacity: 0.05,
    coralOpacity:0.04,
    goldOpacity: 0.03,
    cardSurface: "rgba(250,248,248,0.78)",   // softer
    feedTagline: "Stille Momente der Gemeinschaft.",
    quotePool:   [
      "Was entsteht, wenn du aufhörst zu warten?",
      "Die Stille trägt mehr als wir denken.",
      "Manche Dinge entstehen nur in der Ruhe.",
      "Ein Werk trägt mehr in sich als der Moment seiner Schöpfung.",
    ],
  },
};

export function getTimeAtmosphere(now = new Date()) {
  const h = now.getHours();
  if (h >= 5  && h < 12) return TIME_ATMOSPHERES.morning;
  if (h >= 12 && h < 17) return TIME_ATMOSPHERES.day;
  if (h >= 17 && h < 22) return TIME_ATMOSPHERES.evening;
  return TIME_ATMOSPHERES.night;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: CREATOR DIVERSITY ENFORCER
// Prevents the same creator from appearing back-to-back.
// Uses a soft window: same creator cannot appear within N positions.
// ─────────────────────────────────────────────────────────────────────────────

const CREATOR_WINDOW = 3;  // min positions between same creator

function getCreatorId(item) {
  return (
    item.creatorId      ||
    item.creator?.id    ||
    item.userId         ||
    item.name           ||   // fallback: display name
    item.id
  );
}

function enforceCreatorDiversity(items) {
  if (!Array.isArray(items) || items.length === 0) return items;

  const result   = [];
  const deferred = [];

  const recentCreators = [];  // sliding window of last N creator IDs

  for (let i = 0; i < items.length; i++) {
    const item    = items[i];
    const creator = getCreatorId(item);

    if (recentCreators.includes(creator)) {
      // Defer — this creator appeared too recently
      deferred.push(item);
    } else {
      result.push(item);
      recentCreators.push(creator);
      if (recentCreators.length > CREATOR_WINDOW) recentCreators.shift();

      // Try to insert a deferred item that's now safe
      const safeIdx = deferred.findIndex(d => !recentCreators.includes(getCreatorId(d)));
      if (safeIdx !== -1) {
        const safe = deferred.splice(safeIdx, 1)[0];
        result.push(safe);
        recentCreators.push(getCreatorId(safe));
        if (recentCreators.length > CREATOR_WINDOW) recentCreators.shift();
      }
    }
  }

  // Append any remaining deferred items at the end
  return [...result, ...deferred];
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: EMOTIONAL PACING ENGINE
// After heavy content (weight > 0.7), inserts a softer card or quiet moment.
// Prevents emotional exhaustion without being mechanical.
// ─────────────────────────────────────────────────────────────────────────────

const HEAVY_THRESHOLD  = 0.70;  // above this → heavy
const ROLLING_WINDOW   = 2;     // look back N cards
const MAX_CUMULATIVE_W = 1.20;  // max cumulative weight before forced quiet

function needsEmotionalRelief(recentWeights) {
  if (recentWeights.length === 0) return false;
  const cumulative = recentWeights.slice(-ROLLING_WINDOW).reduce((a, b) => a + b, 0);
  return cumulative >= MAX_CUMULATIVE_W;
}

function needsVisualBreak(recentDensities) {
  const avg = recentDensities.length === 0 ? 0
    : recentDensities.slice(-2).reduce((a,b) => a+b, 0) / 2;
  return avg > 0.72;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: RESONANCE SCORER
// Soft signal — not viral metric. Combines depth indicators.
// ─────────────────────────────────────────────────────────────────────────────

function scoreResonance(item) {
  const resonanz   = item.resonanz   || item.stats?.likes    || 0;
  const berührt    = item.berührt    || 0;
  const begleitet  = item.begleitet  || item.stats?.bookings || 0;
  const viewerCt   = (item.viewers?.length || 0) + (item.viewerExtra || 0);

  // Weight emotional depth markers more than raw quantity
  return (
    resonanz   * 1.0  +
    berührt    * 1.8  +   // emotional touch is rarer, more meaningful
    begleitet  * 1.5  +   // commitment signal
    viewerCt   * 0.4      // passive presence
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: CONTENT TYPE BALANCER
// Prevents too many of the same visual type in sequence.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_CONSECUTIVE_SAME_TYPE = 2;

function rebalanceContentTypes(items) {
  if (!Array.isArray(items) || items.length < 3) return items;

  const result   = [];
  const deferred = [];
  const typeWindow = [];

  for (const item of items) {
    const type = item.rhythmState || item.type || "post";
    const consecutiveSame = typeWindow.filter(t => t === type).length;

    if (consecutiveSame >= MAX_CONSECUTIVE_SAME_TYPE) {
      deferred.push(item);
      // Insert a different type if available
      const altIdx = deferred.findIndex(d => {
        const dt = d.rhythmState || d.type || "post";
        return dt !== type && typeWindow.filter(t => t === dt).length < MAX_CONSECUTIVE_SAME_TYPE;
      });
      if (altIdx !== -1) {
        const alt = deferred.splice(altIdx, 1)[0];
        result.push(alt);
        typeWindow.push(alt.rhythmState || alt.type || "post");
        if (typeWindow.length > 4) typeWindow.shift();
      }
    } else {
      result.push(item);
      typeWindow.push(type);
      if (typeWindow.length > 4) typeWindow.shift();
    }
  }

  return [...result, ...deferred];
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: MICRO-MOMENT INTELLIGENCE
// Contextual — appears after specific emotional cues, never randomly.
// ─────────────────────────────────────────────────────────────────────────────

export function intelligentMicroMoment(item, prevItem, idx) {
  // Never on the first card
  if (!prevItem || idx === 0) return null;

  const prevWeight = getWeight(prevItem);
  const currWeight = getWeight(item);
  const name       = item.name || "Jemand";
  const viewers    = (item.viewerExtra || 0) + (item.viewers?.length || 0);

  // After heavy emotional content → soft acknowledgment
  if (prevWeight > 0.70 && currWeight < 0.55) {
    return "Dieser Moment findet gerade Resonanz.";
  }

  // After artwork with strong berührt signal
  if ((item.berührt || 0) > 8 && (item.type === "work_upload" || item.type === "werk")) {
    return `${name}s Arbeit berührt gerade viele Menschen.`;
  }

  // After experience/gathering with high begleitet
  if ((item.begleitet || 0) > 10 && item.type === "experience") {
    return `${viewers > 0 ? viewers + " Menschen" : "Viele Menschen"} erleben dies gerade zusammen.`;
  }

  // After a note/reflection
  if (prevItem.type === "note" && item.type !== "note") {
    return "Dieser Gedanke findet gerade Resonanz.";
  }

  // High resonance score
  if (scoreResonance(item) > 48) {
    return `${name} inspiriert heute etwas Besonderes.`;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: QUIET INJECTION STRATEGY
// Determines WHEN to inject quiet moments based on emotional load.
// Replaces the mechanical "every 3 cards" approach.
// ─────────────────────────────────────────────────────────────────────────────

const QUIET_COOLDOWN = 4;   // min items between quiet moments
const QUIET_QUOTE_POOL = [
  "Teile heute etwas, das dich bewegt.",
  "Jede echte Wirkung beginnt mit einem kleinen Impuls.",
  "Vielleicht inspiriert dein Moment heute jemand anderen.",
  "Kreativität ist kein Zustand — sie ist eine Begegnung.",
  "Was entsteht, wenn du aufhörst zu warten?",
  "Ein Werk trägt mehr in sich als der Moment seiner Schöpfung.",
  "Stille ist keine Leere — sie ist Raum.",
  "Echte Begegnungen entstehen, wenn wir wirklich da sind.",
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9: MAIN ORCHESTRATOR — curateHumaneFeed()
// Takes raw items → returns an emotionally curated sequence with metadata.
// Pure function. No mutations to input.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {Array}  rawItems  — normalized feed items (from filterValidFeedItems)
 * @param {object} options
 *   @param {Date}    options.now         — for time-of-day atmosphere (default: new Date())
 *   @param {boolean} options.diversity   — enforce creator diversity (default: true)
 *   @param {boolean} options.pacing      — enable emotional pacing (default: true)
 *   @param {boolean} options.rebalance   — enable type rebalancing (default: true)
 *   @param {number}  options.maxItems    — cap output length (default: 50)
 *
 * @returns {CuratedFeed}
 *   {
 *     atmosphere:    TimeAtmosphere,
 *     sequence:      Array<{kind, item?, quoteIdx?, microMoment?, slot}>
 *     stats:         { totalCards, quietCount, diversityApplied, avgWeight }
 *   }
 */
export function curateHumaneFeed(rawItems = [], options = {}) {
  const {
    now             = new Date(),
    diversity       = true,
    pacing          = true,
    rebalance       = true,
    maxItems        = 50,
    viewerContext   = null,   // { id, interests, mood } — for relationship memory
    relationshipMap = null,   // Map<creatorId, RelationshipMemory> — pre-built or null
    sharedAtm       = null,   // pre-built SharedAtmosphere — or built from feed signals
    pastAtmosphere  = null,   // previous SharedAtmosphere for drift blending
    spacesResult    = null,   // pre-built ResonanceSpacesResult — or built from feed
    worldState      = null,   // pre-built WorldState — or built from all layers
  } = options;

  const atmosphere = getTimeAtmosphere(now);

  // ── Step 1: Validate + cap
  const items = (Array.isArray(rawItems) ? rawItems : [])
    .filter(item => item && typeof item === "object")
    .slice(0, maxItems);

  if (items.length === 0) {
    return {
      atmosphere,
      sharedAtmosphere: null,
      sequence: [],
      stats: { totalCards:0, quietCount:0, diversityApplied:false, avgWeight:0 },
    };
  }

  // ── Step 1b: Build shared atmosphere from feed signals
  const collectiveAtm = sharedAtm || (() => {
    const activity  = mockActivityFromFeed(items);
    const resonance = mockResonanceFromFeed(items);
    return buildSharedAtmosphere(items, activity, resonance, atmosphere.id);
  })();

  // ── Step 1c: Build resonance spaces from collective signals
  const resonanceSpaces = spacesResult || buildResonanceSpaces(
    items,
    collectiveAtm,
    collectiveAtm.feedSignals?.activity || mockActivityFromFeed(items),
    {},
  );

  // ── Step 1d: Build world continuity — the whole organism
  const world = worldState || buildWorldContinuity(
    collectiveAtm,          // shared atmosphere
    resonanceSpaces,        // resonance spaces
    {},                     // relationships (enriched at call-site)
    [],                     // identities  (enriched at call-site)
    {},                     // discover world (separate page, injected externally)
    collectiveAtm.feedSignals || {},
  );

  // ── Step 2: Score resonance → soft-sort (stable, not aggressive)
  const scored = items.map(item => ({
    item,
    resonanceScore: scoreResonance(item),
    weight:         getWeight(item),
    density:        getDensity(item),
  }));

  // Stable soft-sort: high resonance items bubble up slightly within groups of 4
  // NOT a full re-sort — preserves chronological feeling
  const softSorted = softBubble(scored, 4);

  // ── Step 2b: Apply relationship memory boost (very gentle — max +15%)
  // Only active when viewerContext is provided
  const withRelationship = viewerContext
    ? softSorted.map(s => {
        const creatorId = s.item.creatorId || s.item.userId || s.item.name || s.item.id;
        const memory    = (relationshipMap && relationshipMap.get(creatorId))
          || buildRelationshipMemory(
              viewerContext,
              { id: creatorId, talent: s.item.talent, tags: [] },
              mockInteractionsFromItem(s.item, viewerContext.id || ""),
             );
        const boost     = relationshipOrderingBoost(memory);
        return {
          ...s,
          resonanceScore: s.resonanceScore + boost,
          _memory:        memory,
        };
      })
    : softSorted;

  // ── Step 3: Creator diversity
  const diversified = diversity
    ? enforceCreatorDiversity(withRelationship.map(s => ({ ...s.item, _memory: s._memory })))
    : withRelationship.map(s => ({ ...s.item, _memory: s._memory }));

  // ── Step 4: Content type rebalancing
  const rebalanced = rebalance
    ? rebalanceContentTypes(diversified)
    : diversified;

  // ── Step 5: Emotional pacing — build sequence with quiet injections
  const sequence = [];
  const recentWeights   = [];
  const recentDensities = [];
  let quietCount        = 0;
  let lastQuietAt       = -QUIET_COOLDOWN;
  let quoteIdx          = 0;

  rebalanced.forEach((item, idx) => {
    const prevItem = idx > 0 ? rebalanced[idx - 1] : null;
    const weight   = getWeight(item);
    const density  = getDensity(item);

    // ── Should we inject quiet BEFORE this card?
    const sinceLastQuiet = idx - lastQuietAt;
    const wantsRelief    = pacing && needsEmotionalRelief(recentWeights);
    const wantsDensityBreak = pacing && needsVisualBreak(recentDensities);
    const cooledDown     = sinceLastQuiet >= QUIET_COOLDOWN;

    if (cooledDown && (wantsRelief || wantsDensityBreak)) {
      sequence.push({
        kind:     "quiet",
        quoteIdx: quoteIdx % QUIET_QUOTE_POOL.length,
        slot:     sequence.length,
      });
      quoteIdx++;
      quietCount++;
      lastQuietAt = idx;
      recentWeights.length   = 0;  // reset after break
      recentDensities.length = 0;
    }

    // ── Attach relationship memory tokens if present
    const memory = item._memory || null;

    // ── Derive micro-moment — prefer relationship micro-moment if more contextual
    const feedMicroMoment     = intelligentMicroMoment(item, prevItem, idx);
    const relationMicroMoment = memory && !memory._fallback ? (memory.microMoment || null) : null;
    const microMoment         = relationMicroMoment || feedMicroMoment;

    // ── Enrich item with atmosphere + presence + relationship tokens
    const worldFeed   = world?.feed || {};

    const enrichedItem = {
      ...item,
      _atmosphere:       atmosphere.id,
      presenceState:     item.presenceState || derivePresenceFromItem(item),
      microMoment,
      // Relationship tokens
      _warmthBoost:      memory?._warmthBoost  ?? 0,
      _motionCalm:       memory?._motionCalm   ?? 0,
      _glowBoost:        memory?._glowBoost    ?? 0,
      _cardDelay:        memory?._cardDelay    ?? 1.0,
      _relationship:     memory || null,
      // World continuity tokens (additive nudges, max ±8%)
      _worldTemperature: world?.temperature?.id  || "calm_flowing",
      _worldWarmthNudge: worldFeed.warmthNudge   ?? 0,
      _worldGlowScale:   worldFeed.glowScale     ?? 1.0,
      _worldBreathPeriod:worldFeed.breathPeriod  ?? "16s",
    };

    sequence.push({
      kind:  "card",
      item:  enrichedItem,
      slot:  sequence.length,
      idx,
    });

    recentWeights.push(weight);
    recentDensities.push(density);
    if (recentWeights.length   > ROLLING_WINDOW) recentWeights.shift();
    if (recentDensities.length > ROLLING_WINDOW + 1) recentDensities.shift();
  });

  // ── Stats (for debugging + transparency — never shown to users)
  const weights   = rebalanced.map(getWeight);
  const avgWeight = weights.length
    ? weights.reduce((a,b) => a+b, 0) / weights.length
    : 0;

  // ── Step 6: Apply shared atmosphere to sequence (stagger scaling + surface tints)
  const atmosphericSequence = applyAtmosphereToFeed(sequence, collectiveAtm);

  return {
    atmosphere,
    sharedAtmosphere: collectiveAtm,
    resonanceSpaces,
    worldState: world,
    sequence: atmosphericSequence,
    quotePool: atmosphere.quotePool,
    stats: {
      totalCards:       rebalanced.length,
      quietCount,
      diversityApplied: diversity,
      avgWeight:        Math.round(avgWeight * 100) / 100,
      sequenceLength:   atmosphericSequence.length,
      atmosphereState:  collectiveAtm?.id  || null,
      dominantSpace:    resonanceSpaces?.dominant?.id  || null,
      activeSpaceCount: resonanceSpaces?.spaces?.length  || 0,
      worldTemperature: world?.temperature?.id           || null,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: Soft bubble sort within fixed window
// Moves high-resonance items up slightly — preserves chronological feel
// ─────────────────────────────────────────────────────────────────────────────

function softBubble(scored, windowSize = 4) {
  const out = [...scored];
  for (let i = 0; i < out.length - 1; i += windowSize) {
    const window = out.slice(i, i + windowSize);
    // Only swap if resonance difference is significant (>15 points)
    window.sort((a, b) => {
      const diff = b.resonanceScore - a.resonanceScore;
      return diff > 15 ? 1 : diff < -15 ? -1 : 0;
    });
    out.splice(i, windowSize, ...window);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: Derive presence from item (mirrors derivePresenceState in CreatorPresence)
// Duplicated here to avoid circular import — pure function
// ─────────────────────────────────────────────────────────────────────────────

function derivePresenceFromItem(item) {
  if (!item) return null;
  const type = item.type || item.rhythmState || "";
  if (type === "work_upload" || type === "werk")   return "creating";
  if (type === "note"        || type === "thought") return "reflecting";
  if (type === "experience"  || type === "event")   return "gathering";
  if (type === "impact")                            return "welcoming";
  if ((item.resonanz || 0) > 20)                   return "resonating";
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT: QUIET_QUOTE_POOL (used by QuietSpace component)
// ─────────────────────────────────────────────────────────────────────────────

export { QUIET_QUOTE_POOL };
