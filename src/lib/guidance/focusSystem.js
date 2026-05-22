// src/lib/guidance/focusSystem.js — HUI Focus System v1
//
// Determines the current focusMode based on app state.
// Pure functions — no React, no side-effects.
// Consumed by GuidanceContext + all visual systems.

import { FOCUS_MODES, FLOW_DEFAULT_MODE, ORB_GUIDANCE_REDUCED, ORB_GUIDANCE_NORMAL } from
  "../../components/guidance/guidanceTokens.js";

// ── Mode resolution ────────────────────────────────────────────

/**
 * Resolves the correct focus mode for the current app context.
 *
 * Priority:
 *   1. Explicit override (e.g. user is in a deep reflection state)
 *   2. Active flow type (onboarding, creation, publishing)
 *   3. Tab context (discover = immersive, impact = reflection)
 *   4. Default: "decision" (safest — CTA always visible)
 *
 * @param {object} ctx
 * @param {string}  ctx.activeTab
 * @param {boolean} ctx.isFlowOpen  — any multi-step flow active
 * @param {string}  ctx.flowType    — "membership"|"creation"|"publishing"|"talent"
 * @param {string}  ctx.override    — explicit override
 * @returns {FocusMode}
 */
export function resolveFocusMode({
  activeTab    = "feed",
  isFlowOpen   = false,
  flowType     = null,
  override     = null,
} = {}) {
  // 1. Explicit override wins
  if (override && FOCUS_MODES[override]) {
    return FOCUS_MODES[override];
  }

  // 2. Active multi-step flow
  if (isFlowOpen) {
    const flowModeMap = {
      membership:  "decision",
      talent:      "decision",
      publishing:  "creation",
      creation:    "creation",
      experience:  "creation",
      impact:      "reflection",
      teilen:      "creation",
      werk:        "creation",
    };
    const mode = flowModeMap[flowType] ?? FLOW_DEFAULT_MODE;
    return FOCUS_MODES[mode] ?? FOCUS_MODES.decision;
  }

  // 3. Tab context
  const tabModeMap = {
    feed:      "immersive",
    discover:  "immersive",
    impact:    "reflection",
    favorites: "stillness",
    profile:   "reflection",
    spaces:    "stillness",
    notifs:    "decision",
    chat:      "immersive",
  };
  const tabMode = tabModeMap[activeTab] ?? "immersive";
  return FOCUS_MODES[tabMode] ?? FOCUS_MODES.immersive;
}

// ── Orb reduction ─────────────────────────────────────────────

/**
 * Returns orb visual reduction state for the current focus mode.
 * During flows, the Orb becomes "quiet presence" not "magnetic center".
 */
export function resolveOrbGuidanceState(focusMode, isFlowOpen) {
  if (!isFlowOpen) return ORB_GUIDANCE_NORMAL;

  const mode = typeof focusMode === "object" ? focusMode : FOCUS_MODES[focusMode];
  if (!mode) return ORB_GUIDANCE_NORMAL;

  // Reduce orb proportionally to focus mode
  const r = ORB_GUIDANCE_REDUCED;
  const n = ORB_GUIDANCE_NORMAL;
  const t = 1 - (mode.orbOpacity ?? 0.78);

  return {
    glow:       lerp(n.glow,       r.glow,       t),
    saturation: lerp(n.saturation, r.saturation, t),
    motion:     lerp(n.motion,     r.motion,     t),
    scale:      lerp(n.scale,      r.scale,      t),
    opacity:    lerp(n.opacity,    r.opacity,    t),
    blur:       lerp(n.blur,       r.blur,       t),
  };
}

function lerp(a, b, t) {
  return a + (b - a) * Math.min(Math.max(t, 0), 1);
}

// ── CSS variable generation ────────────────────────────────────

/**
 * Generates CSS custom properties from a focus mode.
 * Inject on the document root or a container element.
 * Keeps CSS and React in sync without prop drilling.
 */
export function focusModeToCSS(mode) {
  if (!mode) return "";
  return `
    --guidance-motion:    ${mode.motionScale};
    --guidance-contrast:  ${mode.contrast};
    --guidance-sat:       ${mode.saturation};
    --guidance-glow:      ${mode.glow};
    --guidance-spacing:   ${mode.spacing};
    --guidance-blur:      ${mode.blur};
    --guidance-cta:       ${mode.ctaPromince};
    --guidance-overlay:   ${mode.overlayDens};
    --guidance-orb-scale: ${mode.orbScale};
    --guidance-orb-op:    ${mode.orbOpacity};
  `.trim();
}

// ── Transition timing ─────────────────────────────────────────

/**
 * Returns transition duration for switching between focus modes.
 * Deeper modes (stillness, reflection) transition more slowly.
 */
export function focusModeTransitionMs(fromMode, toMode) {
  const depths = { immersive:1, decision:2, creation:3, reflection:4, stillness:5 };
  const fromD  = depths[fromMode?.id ?? fromMode] ?? 1;
  const toD    = depths[toMode?.id   ?? toMode]   ?? 1;
  const delta  = Math.abs(toD - fromD);
  return [420, 520, 680, 820, 1000][delta] ?? 420;
}
