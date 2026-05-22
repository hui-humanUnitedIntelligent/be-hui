// src/lib/guidance/visualPriority.js — HUI Visual Priority Engine v1
//
// The platform always knows what matters most right now.
// Priority shapes z-index, opacity, motion, and contrast
// of every layer simultaneously.

import { VISUAL_PRIORITY, FOCUS_MODES } from
  "../../components/guidance/guidanceTokens.js";

// ── Priority resolution ───────────────────────────────────────

/**
 * Returns ordered priority list with visual weights for current context.
 * Higher priority = more visual weight / contrast / stillness.
 *
 * @param {FocusMode} focusMode
 * @returns {PriorityMap}
 */
export function resolvePriorityMap(focusMode) {
  const mode = typeof focusMode === "string"
    ? FOCUS_MODES[focusMode] ?? FOCUS_MODES.immersive
    : focusMode ?? FOCUS_MODES.immersive;

  // Attention weights — how much each layer should draw the eye
  // 1.0 = full attention | 0.0 = invisible background
  const ctaWeight  = mode.ctaPromince ?? 1.0;
  const atmWeight  = Math.min(mode.overlayDens ?? 0.7, 1 - ctaWeight * 0.15);
  const orbWeight  = mode.orbOpacity ?? 1.0;

  return {
    [VISUAL_PRIORITY.CTA]:        { weight: ctaWeight,           zBoost: 0,   motionDamp: 0    },
    [VISUAL_PRIORITY.DECISION]:   { weight: ctaWeight * 0.88,    zBoost: 0,   motionDamp: 0.1  },
    [VISUAL_PRIORITY.PROGRESS]:   { weight: ctaWeight * 0.72,    zBoost: 0,   motionDamp: 0.2  },
    [VISUAL_PRIORITY.CONTENT]:    { weight: 0.88,                 zBoost: 0,   motionDamp: 0.3  },
    [VISUAL_PRIORITY.ATMOSPHERE]: { weight: atmWeight,            zBoost: 0,   motionDamp: 0.5  },
    [VISUAL_PRIORITY.ORB]:        { weight: orbWeight,            zBoost: 0,   motionDamp: 0.4  },
    [VISUAL_PRIORITY.AMBIENT]:    { weight: atmWeight * 0.65,     zBoost: 0,   motionDamp: 0.8  },
  };
}

// ── z-index system ─────────────────────────────────────────────

// Fixed z-index hierarchy — never conflict
export const Z_GUIDANCE = {
  worldContent:    0,
  feed:            10,
  content:         20,
  atmosphere:      30,
  ambient:         35,
  progressBar:     40,
  guidanceVignette:50,
  guidanceFooter:  80,       // specified in Phase 15 brief
  orbReduced:      90,       // orb during flows
  overlayDim:      8990,     // Orb world-layer
  orbOverlay:      9000,
  profileOverlay:  9500,
  toastLayer:      9800,
};

// ── Opacity cascades ──────────────────────────────────────────

/**
 * Returns opacity multipliers for each visual layer based on focus mode.
 * Elements "step back" when something more important is present.
 */
export function layerOpacityCascade(focusMode) {
  const mode = typeof focusMode === "string"
    ? FOCUS_MODES[focusMode] ?? FOCUS_MODES.immersive
    : focusMode ?? FOCUS_MODES.immersive;

  return {
    cta:        1.0,                           // CTA always full opacity
    decision:   0.95,
    progress:   0.88,
    content:    0.92,
    atmosphere: mode.overlayDens ?? 0.72,
    orb:        mode.orbOpacity  ?? 1.0,
    ambient:    (mode.overlayDens ?? 0.72) * 0.72,
  };
}

// ── CTA isolation style ───────────────────────────────────────

/**
 * Generates complete inline style for a CTA button.
 * Based on focus mode + readability adjustments.
 *
 * @param {object} opts
 * @param {FocusMode|string} opts.focusMode
 * @param {boolean}          opts.disabled
 * @param {boolean}          opts.isActive   — pressed state
 * @param {ReadabilityAdj}   opts.readAdj
 * @returns {React.CSSProperties}
 */
export function ctaButtonStyle({ focusMode, disabled = false, isActive = false, readAdj = null } = {}) {
  const ctaBoost = readAdj?.ctaBoost ?? 0;
  const baseShadowAlpha = Math.min(0.28 + ctaBoost * 0.3, 0.55);
  const haloAlpha = Math.min(0.22 + ctaBoost * 0.25, 0.45);

  return {
    width:          "100%",
    height:         58,
    borderRadius:   18,
    border:         "none",
    fontFamily:     "inherit",
    fontSize:       17,
    fontWeight:     700,
    letterSpacing:  "-0.02em",
    cursor:         disabled ? "not-allowed" : "pointer",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    gap:            8,

    // Gradient — Phase 15 spec
    background: disabled
      ? "rgba(255,255,255,0.08)"
      : "linear-gradient(135deg, #16D7C5 0%, #2DE2D0 100%)",
    color:       disabled ? "rgba(255,255,255,0.28)" : "#071114",

    // Shadow — readability-boosted
    boxShadow: disabled ? "none" : [
      `0 8px 30px rgba(22,215,197,${baseShadowAlpha})`,
      `0 0 18px rgba(22,215,197,${haloAlpha})`,
    ].join(", "),

    opacity:    disabled ? 0.42 : 1,
    filter:     disabled ? "saturate(0.7)" : "none",

    // Pressed state
    transform:  isActive ? "translateY(-1px) scale(0.992)" : "none",

    // Smooth transition — Phase 15 spec
    transition: "transform 0.42s cubic-bezier(0.22,1,0.36,1), box-shadow 0.42s cubic-bezier(0.22,1,0.36,1), opacity 0.42s cubic-bezier(0.22,1,0.36,1)",

    // Isolation — CTA never bleeds into other stacking contexts
    isolation:     "isolate",
    contain:       "layout paint",
    WebkitTapHighlightColor: "transparent",
    touchAction:   "manipulation",
  };
}

// ── Guidance footer style ─────────────────────────────────────

/**
 * Generates complete inline style for the guidance footer.
 *
 * @param {ReadabilityAdj} readAdj
 * @returns {React.CSSProperties}
 */
export function guidanceFooterStyle(readAdj = null) {
  const extraBlur = readAdj?.extraBlur ?? "0px";
  const extraDark = readAdj?.overlayDarkening ?? 0;
  const bgAlpha   = Math.min(0.72 + extraDark, 0.92);
  const blurPx    = parseInt(extraBlur) + 26;

  return {
    // Position — Phase 15 spec
    position:       "sticky",
    bottom:         `calc(env(safe-area-inset-bottom, 0px) + 18px)`,
    left:           18,
    right:          18,
    // Height managed by content (min 92px)
    minHeight:      92,
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    padding:        16,
    borderRadius:   28,

    // Glass surface — Phase 15 spec
    background:           `rgba(8,12,20,${bgAlpha})`,
    backdropFilter:       `blur(${blurPx}px) saturate(1.25)`,
    WebkitBackdropFilter: `blur(${blurPx}px) saturate(1.25)`,
    border:               "1px solid rgba(255,255,255,0.08)",
    boxShadow:            [
      "0 12px 40px rgba(0,0,0,0.32)",
      "0 0 0 1px rgba(255,255,255,0.03) inset",
    ].join(", "),

    // Stacking
    zIndex:   Z_GUIDANCE.guidanceFooter,
    isolation:"isolate",
    contain:  "layout paint",

    // Width — always full (minus side gaps set by parent padding)
    width:    "100%",
    boxSizing:"border-box",
  };
}
