// src/lib/guidance/readabilityEngine.js — HUI Readability Engine v1
//
// Detects when atmosphere threatens readability and
// automatically adjusts: CTA prominence, overlay density,
// blur, glow, saturation, vignette.
//
// Philosophy: the platform NEVER fights legibility.

// ── Noise detection ───────────────────────────────────────────

/**
 * Analyzes the current visual state and returns a noise score (0–1).
 * 0 = perfectly calm | 1 = atmospheric chaos
 *
 * @param {VisualState} state
 * @returns {number} noiseScore
 */
export function detectVisualNoise({
  bgLuminance      = 0.5,    // 0=dark, 1=bright
  motionIntensity  = 0.5,    // 0=still, 1=heavy motion
  glowDensity      = 0.5,    // 0=none, 1=overloaded
  blurConflict     = 0,      // 0=no conflict, 1=stacked blurs
  ctaContrast      = 0.8,    // 0=invisible, 1=perfect contrast
  textReadability  = 0.8,    // 0=unreadable, 1=perfect
  activeFocusMode  = "immersive",
} = {}) {
  // Weighted noise contributors
  const luminanceNoise  = Math.abs(bgLuminance - 0.3) * 1.2;  // bright bg = high noise for dark UI
  const motionNoise     = motionIntensity * 0.9;
  const glowNoise       = glowDensity * 0.85;
  const blurNoise       = blurConflict * 1.1;
  const readNoise       = (1 - textReadability) * 1.4;         // unreadable = critical
  const ctaNoise        = (1 - ctaContrast) * 1.3;            // invisible CTA = critical

  // Focus mode dampening — decision mode tolerates less noise
  const modeDampening = {
    immersive:  0.70,
    decision:   1.20,   // amplify noise in decision mode (user needs clarity)
    creation:   0.90,
    reflection: 0.80,
    stillness:  0.75,
  }[activeFocusMode] ?? 1.0;

  const raw = (luminanceNoise + motionNoise + glowNoise + blurNoise + readNoise + ctaNoise) / 6;
  return Math.min(Math.max(raw * modeDampening, 0), 1);
}

// ── Adaptation response ───────────────────────────────────────

/**
 * Given a noise score, returns adjustments to apply to the visual system.
 * All adjustments are additive corrections — they don't override base values.
 *
 * @param {number} noiseScore — 0–1
 * @returns {ReadabilityAdjustments}
 */
export function computeReadabilityAdjustments(noiseScore) {
  const n = Math.min(Math.max(noiseScore, 0), 1);

  // Thresholds
  const isMild     = n > 0.35;
  const isModerate = n > 0.55;
  const isHigh     = n > 0.75;

  return {
    // CTA: boost prominence as noise increases
    ctaBoost:        isHigh ? 0.28 : isModerate ? 0.16 : isMild ? 0.08 : 0,

    // Overlay: darken atmosphere beneath important elements
    overlayDarkening: isHigh ? 0.22 : isModerate ? 0.14 : isMild ? 0.06 : 0,

    // Blur: increase overlay blur to separate CTA from noisy bg
    extraBlur:        isHigh ? "8px" : isModerate ? "4px" : isMild ? "2px" : "0px",

    // Glow: reduce ambient glow when it competes with CTA
    glowReduction:    isHigh ? 0.45 : isModerate ? 0.28 : isMild ? 0.12 : 0,

    // Vignette: strengthen edge darkening for focus
    vignetteStrength: isHigh ? 0.55 : isModerate ? 0.38 : isMild ? 0.18 : 0,

    // Saturation: desaturate atmosphere (not content)
    satReduction:     isHigh ? 0.30 : isModerate ? 0.18 : isMild ? 0.06 : 0,

    // Score for components to use directly
    noiseScore: n,
    severity:   isHigh ? "high" : isModerate ? "moderate" : isMild ? "mild" : "none",
  };
}

// ── Image readability ─────────────────────────────────────────

/**
 * Estimates luminance of a color string (hex or rgba).
 * Used to detect if a background is too light for dark text.
 *
 * @param {string} colorStr
 * @returns {number} 0–1 luminance estimate
 */
export function estimateLuminance(colorStr) {
  if (!colorStr) return 0.5;
  // rgba(r,g,b,a)
  const rgba = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgba) {
    const [, r, g, b] = rgba.map(Number);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  // hex
  const hex = colorStr.replace("#", "");
  if (hex.length >= 6) {
    const r = parseInt(hex.slice(0,2), 16);
    const g = parseInt(hex.slice(2,4), 16);
    const b = parseInt(hex.slice(4,6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  return 0.5;
}

// ── Footer readability ────────────────────────────────────────

/**
 * Computes whether the guidance footer needs extra protection
 * from a bright/busy background.
 *
 * @param {number} bgLuminance — 0–1
 * @returns {FooterProtection}
 */
export function footerProtection(bgLuminance) {
  const bright = bgLuminance > 0.55;
  const mid    = bgLuminance > 0.35;

  return {
    // Extra overlay beneath footer on bright backgrounds
    extraOverlayAlpha: bright ? 0.85 : mid ? 0.72 : 0.65,
    // Extra blur to separate from noisy bg
    extraBlur:         bright ? "32px" : mid ? "26px" : "20px",
    // Vignette at bottom of screen
    vignetteSrc:       bright
      ? "linear-gradient(to top, rgba(0,0,0,0.70) 0%, transparent 100%)"
      : "linear-gradient(to top, rgba(0,0,0,0.52) 0%, transparent 100%)",
    needsProtection:   mid,
  };
}
