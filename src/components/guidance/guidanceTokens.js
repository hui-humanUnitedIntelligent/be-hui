// src/components/guidance/guidanceTokens.js — HUI Guidance Design Tokens v1
//
// Single source of truth for all guidance-layer visual values.
// Everything flows from here — no magic numbers elsewhere.

// ── Color ──────────────────────────────────────────────────────
export const G_COLOR = {
  // CTA primary — teal gradient, dark ink text
  ctaTeal:        "#16D7C5",
  ctaTealLight:   "#2DE2D0",
  ctaInk:         "#071114",

  // Footer glass surface
  footerBg:       "rgba(8,12,20,0.72)",
  footerBorder:   "rgba(255,255,255,0.08)",
  footerBorderIn: "rgba(255,255,255,0.03)",

  // Shadows
  footerShadow:   "0 12px 40px rgba(0,0,0,0.32), 0 0 0 1px rgba(255,255,255,0.03) inset",
  ctaShadow:      "0 8px 30px rgba(22,215,197,0.28), 0 0 18px rgba(22,215,197,0.22)",
  ctaShadowHover: "0 10px 36px rgba(22,215,197,0.38), 0 0 24px rgba(22,215,197,0.28)",

  // Progress bar
  progressFill:   "linear-gradient(90deg, #16D7C5 0%, #2DE2D0 100%)",
  progressBg:     "rgba(255,255,255,0.10)",
  progressDot:    "rgba(22,215,197,0.60)",
};

// ── Geometry ───────────────────────────────────────────────────
export const G_SHAPE = {
  footerRadius:    28,
  ctaRadius:       18,
  progressH:        2,    // px — thinner, calmer
  progressRadius:  99,

  footerH:         92,    // px
  ctaH:            58,    // px
  footerPad:       16,    // px sides

  // Margin from screen edges
  footerSideGap:   18,    // px
  footerBottomGap: "max(env(safe-area-inset-bottom, 18px) + 18px, 28px)",
};

// ── Typography ─────────────────────────────────────────────────
export const G_TYPE = {
  ctaSize:       17,      // px
  ctaWeight:     700,
  ctaTracking:  "-0.02em",

  stepLabelSize: 10.5,    // px — quieter
  stepLabelWt:   600,
  stepLabelTrack:"0.10em",

  subLabelSize:  13,
  subLabelWt:    400,
};

// ── Motion ─────────────────────────────────────────────────────
export const G_MOTION = {
  // Guidance-specific easing — cinematic, never snappy
  ease:    "cubic-bezier(0.22,1,0.36,1)",
  easeIn:  "cubic-bezier(0.55,0,1,0.45)",
  easeOut: "cubic-bezier(0.00,0,0.22,1)",

  reveal:      "520ms",   // footer enters
  settle:      "680ms",   // content settles after reveal
  focusShift:  "420ms",   // mode transitions
  breathe:     "4800ms",  // ambient glow pulse
  float:       "6200ms",  // subtle CTA float
  ctaPress:    "0.42s",   // cta active transition
};

// ── Visual Priority ────────────────────────────────────────────
// The platform always knows what matters most right now
export const VISUAL_PRIORITY = {
  CTA:        1,
  DECISION:   2,
  PROGRESS:   3,
  CONTENT:    4,
  ATMOSPHERE: 5,
  ORB:        6,
  AMBIENT:    7,
};

// ── Focus Modes ────────────────────────────────────────────────
// Each mode shapes all visual systems
export const FOCUS_MODES = {
  immersive: {
    id:          "immersive",
    motionScale: 1.0,
    contrast:    0.95,
    saturation:  1.0,
    glow:        0.85,
    spacing:     1.1,
    blur:        1.0,
    ctaPromince: 0.72,   // CTA less prominent — world speaks
    overlayDens: 0.55,
    orbScale:    1.0,
    orbOpacity:  1.0,
  },
  decision: {
    id:          "decision",
    motionScale: 0.62,   // slower — user needs to think
    contrast:    1.08,   // more contrast for clarity
    saturation:  0.88,   // slightly desaturated atmosphere
    glow:        0.55,   // glow pulls back
    spacing:     1.18,   // more breathing room
    blur:        0.72,   // less blur noise
    ctaPromince: 1.0,    // CTA at full prominence
    overlayDens: 0.82,   // atmosphere dimmed
    orbScale:    0.96,
    orbOpacity:  0.78,
  },
  creation: {
    id:          "creation",
    motionScale: 0.78,
    contrast:    1.0,
    saturation:  0.92,
    glow:        0.62,
    spacing:     1.0,
    blur:        0.62,
    ctaPromince: 0.88,
    overlayDens: 0.70,
    orbScale:    0.96,
    orbOpacity:  0.78,
  },
  reflection: {
    id:          "reflection",
    motionScale: 0.48,   // very slow — stillness
    contrast:    0.90,
    saturation:  0.80,
    glow:        0.45,
    spacing:     1.25,   // maximum breathing room
    blur:        1.15,   // soft, dreamy
    ctaPromince: 0.65,
    overlayDens: 0.60,
    orbScale:    0.94,
    orbOpacity:  0.70,
  },
  stillness: {
    id:          "stillness",
    motionScale: 0.28,   // barely moving
    contrast:    0.85,
    saturation:  0.72,
    glow:        0.30,
    spacing:     1.35,
    blur:        1.30,
    ctaPromince: 0.55,
    overlayDens: 0.50,
    orbScale:    0.92,
    orbOpacity:  0.62,
  },
};

// Default mode for flows
export const FLOW_DEFAULT_MODE = "decision";

// ── Orb Reduction State ────────────────────────────────────────
// Applied during onboarding / multi-step flows / publishing
export const ORB_GUIDANCE_REDUCED = {
  glow:       0.42,
  saturation: 0.72,
  motion:     0.58,
  scale:      0.96,
  opacity:    0.78,
  blur:       0.82,
};

export const ORB_GUIDANCE_NORMAL = {
  glow:       1.0,
  saturation: 1.0,
  motion:     1.0,
  scale:      1.0,
  opacity:    1.0,
  blur:       1.0,
};
