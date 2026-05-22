// src/lib/intelligence/persistence/viewerContext.js
// HUI Viewer Context Builder v1
//
// Builds a rich, living viewerContext from:
//   - authenticated user profile
//   - local interaction memory
//   - time of day
//   - relationship depths
//
// viewerContext is NEVER null after hydration.
// Consumed by: curateHumaneFeed, buildRelationshipMemory, discoverWorld
//
// ── SSR-safe, memoized, null-safe ─────────────────────────────────────────

import { buildMemoryMap, hydrateStore } from "./interactionMemoryStore.js";
import { buildRelationshipMemory }       from "../relationshipMemory.js";

// ─── Time helpers ──────────────────────────────────────────────────────────
function getTimeSlot(now = new Date()) {
  const h = now.getHours();
  if (h >= 5  && h < 10) return "morning";
  if (h >= 10 && h < 13) return "midday";
  if (h >= 13 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

// ─── Safe array normalizer ─────────────────────────────────────────────────
const safeArr = (v) => Array.isArray(v) ? v.filter(Boolean) : [];
const safeStr = (v) => typeof v === "string" ? v.trim() : "";

// ─── Null-safe profile normalizer ─────────────────────────────────────────
function normalizeProfile(profile = {}) {
  return {
    id:         safeStr(profile.id || profile.user_id),
    interests:  safeArr(profile.dna_tags || profile.skills || profile.interests || []),
    mood:       safeStr(profile.mood || profile.currentMood || ""),
    talent:     safeStr(profile.talent || profile.focus_type || ""),
    location:   safeStr(profile.location || profile.location_label || ""),
    isMember:   Boolean(profile.is_member),
    hasTalent:  Boolean(profile.has_talent_profile),
    joinedAt:   profile.created_at || profile.member_since || null,
  };
}

// ─── Derive emotional rhythm from memory ──────────────────────────────────
function deriveEmotionalRhythm(memMap, profile) {
  if (memMap.size === 0) return { tone: "open", energy: 0.5 };

  let totalResonanz = 0, totalBerührt = 0, totalInspired = 0;
  for (const [, sig] of memMap) {
    totalResonanz += sig.resonanzGiven || 0;
    totalBerührt  += sig.berührtGiven  || 0;
    totalInspired += sig.inspiredGiven || 0;
  }
  const total = totalResonanz + totalBerührt + totalInspired;
  if (total === 0) return { tone: "open", energy: 0.5 };

  const berührtRatio  = totalBerührt  / total;
  const inspiredRatio = totalInspired / total;

  // Emotional character based on dominant reaction type
  const tone = berührtRatio > 0.45  ? "reflective"
             : inspiredRatio > 0.40 ? "energetic"
             : "warm";

  const energy = Math.min(0.3 + (total / 100) * 0.5, 1.0);  // grows with activity

  return { tone, energy };
}

// ─── Derive viewing patterns from memory ──────────────────────────────────
function deriveViewingPatterns(memMap) {
  if (memMap.size === 0) return { depth: "explorer", dwellAvgMs: 0, revisitRate: 0 };

  let totalDwell = 0, totalRevisits = 0, count = 0;
  for (const [, sig] of memMap) {
    totalDwell   += sig.feedDwellMs   || 0;
    totalRevisits += sig.revisitCount || 0;
    count++;
  }
  const dwellAvgMs  = count > 0 ? totalDwell / count : 0;
  const revisitRate = count > 0 ? totalRevisits / count : 0;

  // Viewing depth character
  const depth = dwellAvgMs > 8000 ? "deep"
              : dwellAvgMs > 3000 ? "engaged"
              : "explorer";

  return { depth, dwellAvgMs, revisitRate };
}

// ─── Derive resonance bias from memory ────────────────────────────────────
function deriveResonanceBias(memMap) {
  // Which type of reaction does this person give most?
  let resonanz = 0, berührt = 0, inspired = 0;
  for (const [, sig] of memMap) {
    resonanz += sig.resonanzGiven || 0;
    berührt  += sig.berührtGiven  || 0;
    inspired += sig.inspiredGiven || 0;
  }
  const total = resonanz + berührt + inspired;
  if (total === 0) return "balanced";
  if (berührt / total > 0.50) return "emotionally_sensitive";
  if (inspired / total > 0.40) return "creatively_driven";
  if (resonanz / total > 0.60) return "socially_engaged";
  return "balanced";
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN: buildViewerContext()
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a rich, living viewer context.
 * NEVER returns null — always returns a meaningful fallback.
 *
 * @param {object} profile       — user profile from AuthContext
 * @param {string[]} feedCreatorIds — creator IDs currently in feed
 * @param {Date}   now            — current time (for SSR-safe testing)
 *
 * @returns {ViewerContext}
 */
export function buildViewerContext(profile = {}, feedCreatorIds = [], now = new Date()) {
  const p = normalizeProfile(profile);

  // Always have a viewer id (anonymous fallback for unauthenticated)
  const viewerId = p.id || "anonymous";

  // Hydrate memory (prunes + warms cache)
  const { knownCreators, totalSignals } = p.id
    ? hydrateStore(p.id)
    : { knownCreators: [], totalSignals: 0 };

  // Build memory map for feed creators + all known creators
  const allIds    = [...new Set([...feedCreatorIds, ...knownCreators])].filter(Boolean);
  const memMap    = p.id ? buildMemoryMap(p.id, allIds) : new Map();

  // ── Trusted creators (non-fallback relationship) ─────────────────────
  const trustedCreators = [];
  const relationshipDepths = {};
  const recentInteractions = [];

  if (p.id && memMap.size > 0) {
    for (const [creatorId, signals] of memMap) {
      const creatorCtx = { id: creatorId };
      const memory = buildRelationshipMemory(
        { id: p.id, interests: p.interests, mood: p.mood },
        creatorCtx,
        signals
      );

      if (!memory._fallback) {
        relationshipDepths[creatorId] = {
          state:          memory.state,
          resonanceScore: memory.resonanceScore,
          warmthBoost:    memory.warmthBoost,
          motionCalm:     memory.motionCalm,
          glowBoost:      memory.glowBoost,
          cardDelay:      memory.cardDelay,
          microMoment:    memory.microMoment,
        };

        if (memory.resonanceScore >= 0.44) {
          trustedCreators.push(creatorId);
        }

        // Recent: seen within 7 days
        if ((signals.daysSinceLastSeen || 999) <= 7) {
          recentInteractions.push({
            creatorId,
            daysSince: signals.daysSinceLastSeen,
            resonanzGiven: signals.resonanzGiven,
          });
        }
      }
    }
  }

  // Sort recent by recency
  recentInteractions.sort((a, b) => a.daysSince - b.daysSince);

  // ── Derived behavior patterns ──────────────────────────────────────────
  const emotionalRhythm  = deriveEmotionalRhythm(memMap, p);
  const viewingPatterns  = deriveViewingPatterns(memMap);
  const resonanceBias    = deriveResonanceBias(memMap);

  // ── Creative affinity: from interests + most-engaged creators ─────────
  const creativeAffinity = safeArr(p.interests).slice(0, 8);

  return Object.freeze({
    // Identity
    viewerId,
    isMember:     p.isMember,
    hasTalent:    p.hasTalent,

    // Interaction history
    recentInteractions,         // creators seen in last 7 days
    trustedCreators,            // creators with quiet_connection or deeper
    relationshipDepths,         // map of creatorId → relationship tokens
    totalMemorySignals: totalSignals,
    knownCreatorCount:  knownCreators.length,

    // Behavioral patterns
    emotionalRhythm,            // { tone, energy }
    viewingPatterns,            // { depth, dwellAvgMs, revisitRate }
    resonanceBias,              // "balanced" | "emotionally_sensitive" | etc.
    creativeAffinity,           // top interest tags

    // Temporal
    timeOfDay:     getTimeSlot(now),

    // Raw for curateHumaneFeed
    id:        p.id,
    interests: p.interests,
    mood:      p.mood,

    // Meta
    _hydrated: Boolean(p.id),
    _fallback: !p.id,
    _builtAt:  now.getTime(),
  });
}

/**
 * Lightweight anonymous fallback — for unauthenticated users.
 * Never null.
 */
export function buildAnonymousViewerContext(now = new Date()) {
  return Object.freeze({
    viewerId:          "anonymous",
    isMember:          false,
    hasTalent:         false,
    recentInteractions:   [],
    trustedCreators:      [],
    relationshipDepths:   {},
    totalMemorySignals:   0,
    knownCreatorCount:    0,
    emotionalRhythm:   { tone: "open", energy: 0.5 },
    viewingPatterns:   { depth: "explorer", dwellAvgMs: 0, revisitRate: 0 },
    resonanceBias:     "balanced",
    creativeAffinity:  [],
    timeOfDay:         getTimeSlot(now),
    id:                null,
    interests:         [],
    mood:              "",
    _hydrated:         false,
    _fallback:         true,
    _builtAt:          now.getTime(),
  });
}
