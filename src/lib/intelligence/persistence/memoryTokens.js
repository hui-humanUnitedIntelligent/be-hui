// src/lib/intelligence/persistence/memoryTokens.js
// HUI Memory Token Resolver v1
//
// Translates relationship depth into concrete CSS/style tokens.
// All effects are BELOW perception threshold — never noticeable as "algorithm".
//
// Design rule: the difference between strangers and trusted presence
// should feel like "this person feels familiar" — not "the app changed."
//
// ── Token scale ───────────────────────────────────────────────────────────
//   emerging_connection: barely perceptible (+2-3%)
//   familiar_presence:   subtle warmth     (+4-6%)
//   quiet_connection:    soft glow          (+6-8%)
//   creative_alignment:  warmer atmosphere  (+8-10%)
//   shared_resonance:    gentle pulse       (+10-12%)
//   trusted_presence:    full warmth        (+12-15%)

// ── State definitions (must match relationshipMemory.js states) ───────────
const STATE_TOKENS = {
  emerging_connection: {
    warmthOpacity:    0.025,   // avatar border glow
    glowOpacity:      0.03,    // card ambient glow
    blurExtra:        0,       // extra blur px on card surface
    animationScale:   1.0,     // multiplier on animation speed
    revealEarlyMs:    0,       // ms to reveal earlier
    shadowOpacity:    0.06,
    borderOpacity:    0.06,
  },
  familiar_presence: {
    warmthOpacity:    0.05,
    glowOpacity:      0.06,
    blurExtra:        0.3,
    animationScale:   0.97,    // 3% slower = calmer
    revealEarlyMs:    20,
    shadowOpacity:    0.08,
    borderOpacity:    0.10,
  },
  quiet_connection: {
    warmthOpacity:    0.07,
    glowOpacity:      0.09,
    blurExtra:        0.6,
    animationScale:   0.94,
    revealEarlyMs:    35,
    shadowOpacity:    0.10,
    borderOpacity:    0.14,
  },
  creative_alignment: {
    warmthOpacity:    0.09,
    glowOpacity:      0.12,
    blurExtra:        0.8,
    animationScale:   0.91,
    revealEarlyMs:    50,
    shadowOpacity:    0.12,
    borderOpacity:    0.18,
  },
  shared_resonance: {
    warmthOpacity:    0.11,
    glowOpacity:      0.15,
    blurExtra:        1.0,
    animationScale:   0.88,
    revealEarlyMs:    65,
    shadowOpacity:    0.14,
    borderOpacity:    0.22,
  },
  trusted_presence: {
    warmthOpacity:    0.13,
    glowOpacity:      0.18,
    blurExtra:        1.2,
    animationScale:   0.85,    // 15% calmer — most trusted = most relaxed
    revealEarlyMs:    80,
    shadowOpacity:    0.16,
    borderOpacity:    0.26,
  },
};

const NULL_TOKENS = {
  warmthOpacity: 0, glowOpacity: 0, blurExtra: 0,
  animationScale: 1.0, revealEarlyMs: 0,
  shadowOpacity: 0.04, borderOpacity: 0,
};

// ── Color palette ─────────────────────────────────────────────────────────
// Teal (fresh/emerging) → Coral (deep/trusted)
// Transition at creative_alignment threshold (score ≥ 0.58)

const COLOR_TEAL  = { r: 22,  g: 215, b: 197 };  // #16D7C5
const COLOR_CORAL = { r: 255, g: 138, b: 107 };  // #FF8A6B
const COLOR_WARM  = { r: 255, g: 200, b: 140 };  // #FFC88C — warmest

function lerpColor(a, b, t) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

function toRgba({ r, g, b }, opacity) {
  return `rgba(${r},${g},${b},${opacity.toFixed(3)})`;
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Resolve memory tokens from a relationship depth object.
 * Input: getRelationshipDepth(creatorId) result from useLivingMemory.
 *
 * @param {object|null} depth  — { state, resonanceScore, warmthBoost, ... }
 * @returns {ResolvedMemoryTokens}
 */
export function resolveMemoryTokens(depth) {
  if (!depth || !depth.state) return resolvedNull();

  const base   = STATE_TOKENS[depth.state] || NULL_TOKENS;
  const score  = Math.max(0, Math.min(1, depth.resonanceScore || 0));

  // Color interpolation: teal (0) → coral (0.58+) → warm (1.0)
  const warmColor = score < 0.58
    ? lerpColor(COLOR_TEAL, COLOR_CORAL, score / 0.58)
    : lerpColor(COLOR_CORAL, COLOR_WARM, (score - 0.58) / 0.42);

  // Ambient glow — behind card, radial, very soft
  const ambientGlow = toRgba(warmColor, base.glowOpacity);

  // Avatar border warmth — ring around creator avatar
  const avatarWarmth = toRgba(warmColor, base.warmthOpacity * 2);

  // Card surface tint — almost invisible wash
  const cardTint = toRgba(warmColor, base.warmthOpacity * 0.4);

  // Shadow enhancement — deeper shadow = more presence
  const boxShadow = base.shadowOpacity > 0.05
    ? `0 2px 12px ${toRgba(warmColor, base.shadowOpacity)}, 0 1px 4px rgba(0,0,0,0.06)`
    : null;

  // Animation timing multiplier
  const animationMultiplier = base.animationScale;

  // Reveal delay reduction (ms)
  const revealEarlyMs = base.revealEarlyMs;

  return Object.freeze({
    // Presence
    state:              depth.state,
    resonanceScore:     score,
    isFamiliar:         score >= 0.28,
    isTrusted:          score >= 0.58,

    // Visual — all CSS-ready strings or null
    ambientGlow,        // radial-gradient color → use in background
    avatarWarmth,       // border-color → avatar ring
    cardTint,           // background-color → card surface
    boxShadow,          // box-shadow → card container

    // Animation
    animationMultiplier, // multiply animation-duration by this
    revealEarlyMs,       // subtract from animationDelay (ms)
    motionCalm:  depth.motionCalm || 0,   // from relationship engine

    // Extra blur on card surface (px)
    blurExtra: base.blurExtra,

    // Raw for debugging
    _state: depth.state,
    _null:  false,
  });
}

function resolvedNull() {
  return Object.freeze({
    state: null, resonanceScore: 0, isFamiliar: false, isTrusted: false,
    ambientGlow:  "transparent",
    avatarWarmth: "transparent",
    cardTint:     "transparent",
    boxShadow:    null,
    animationMultiplier: 1.0,
    revealEarlyMs: 0,
    motionCalm: 0,
    blurExtra: 0,
    _state: null, _null: true,
  });
}

/**
 * Quick card style object — apply directly to card container style prop.
 * All effects are additive (never remove existing styles).
 *
 * @param {object|null} depth
 * @param {object}      baseStyle — existing style object
 * @returns {object}   merged style
 */
export function applyMemoryToCardStyle(depth, baseStyle = {}) {
  const t = resolveMemoryTokens(depth);
  if (t._null) return baseStyle;

  return {
    ...baseStyle,
    ...(t.boxShadow    ? { boxShadow: t.boxShadow }          : {}),
    ...(t.blurExtra > 0
      ? { backdropFilter: `blur(${(parseFloat(baseStyle.backdropFilter?.match(/[\d.]+/)?.[0]) || 0) + t.blurExtra}px)` }
      : {}),
  };
}

/**
 * Animation delay for a card slot, adjusted by familiarity.
 *
 * @param {number}      baseDelayMs  — original delay in ms
 * @param {object|null} depth        — relationship depth tokens
 * @returns {string}   CSS delay string e.g. "0.32s"
 */
export function memoryAdjustedDelay(baseDelayMs, depth) {
  const t = resolveMemoryTokens(depth);
  const adjusted = Math.max(0, baseDelayMs - t.revealEarlyMs);
  return `${(adjusted / 1000).toFixed(3)}s`;
}
