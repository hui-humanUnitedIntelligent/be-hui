/**
 * ════════════════════════════════════════════════════════════════
 *  HUI INTERACTION LANGUAGE — Phase 22
 *  Single Source of Truth für Motion, Tap-Feedback und Transitions.
 *
 *  Philosophie:
 *  Ruhig. Warm. Menschlich. Atmosphärisch.
 *  Wie ein lebendiger Raum — nicht wie eine App.
 *
 *  Usage: import { IX } from "../design/hui.interaction.js";
 * ════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────
//  CORE EASING LIBRARY
//  Alle Easings sind organisch — kein Bounce, kein Overshoot.
// ─────────────────────────────────────────────────────────────────

export const EASE = {
  // Haupt-Ease: ruhig ausgleiten — für ALLE standard Transitions
  out:       "cubic-bezier(0.16, 1.00, 0.30, 1.00)",
  // Leicht gewölbt — für Tap-Feedback, depth shifts
  outSoft:   "cubic-bezier(0.22, 1.00, 0.36, 1.00)",
  // Sehr sanft — für Hintergrund-Elemente, Atmosphere
  outGentle: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  // Standard ease-in — Elements die verschwinden
  in:        "cubic-bezier(0.40, 0.00, 0.60, 1.00)",
  // Für Farb- und Opacity-Shifts
  linear:    "linear",
  // Page transitions — cinematic, ruhig
  cinematic: "cubic-bezier(0.16, 1.00, 0.30, 1.00)",
};

// ─────────────────────────────────────────────────────────────────
//  DURATION SYSTEM — alle in ms
// ─────────────────────────────────────────────────────────────────

export const DUR = {
  // Tap-Feedback — sofort spürbar
  tap:        120,
  tapRelease: 200,
  // Micro-Interactions — Badges, Labels
  micro:      160,
  // Standard-Transitions — Modals, Cards
  normal:     240,
  // Seiten-Übergänge — Tab-Wechsel
  page:       320,
  // Atmosphärische Transitions — Overlays, Sheets
  mood:       480,
  // Cinematic — Hero-Elemente, Orb-Öffnung
  cinematic:  680,
  // Ambient-Motion — Breathing, Floating
  breathe:    4800,
  breatheSlow:7200,
  float:      5400,
};

// ─────────────────────────────────────────────────────────────────
//  GLOBAL TAP LANGUAGE
//  Jedes tappable Element folgt diesem System.
//  Variants je nach Element-Gewicht.
// ─────────────────────────────────────────────────────────────────

export const TAP = {
  // Leicht (Icons, kleine Elemente, Labels)
  light: {
    pressed: {
      transform:  "scale(0.94) translateY(0.5px)",
      opacity:     0.78,
      transition: `transform ${DUR.tap}ms ${EASE.outSoft}, opacity ${DUR.tap}ms ${EASE.outSoft}`,
    },
    idle: {
      transform:  "scale(1) translateY(0)",
      opacity:     1,
      transition: `transform ${DUR.tapRelease}ms ${EASE.out}, opacity ${DUR.tapRelease}ms ${EASE.out}`,
    },
  },
  // Standard (Buttons, Pills, Nav-Items)
  standard: {
    pressed: {
      transform:  "scale(0.970) translateY(1px)",
      opacity:     0.84,
      transition: `transform ${DUR.tap}ms ${EASE.outSoft}, opacity ${DUR.tap}ms ${EASE.outSoft}`,
    },
    idle: {
      transform:  "scale(1) translateY(0)",
      opacity:     1,
      transition: `transform ${DUR.tapRelease}ms ${EASE.out}, opacity ${DUR.tapRelease}ms ${EASE.out}`,
    },
  },
  // Schwer (Cards, große tappable Bereiche)
  card: {
    pressed: {
      transform:  "scale(0.984) translateY(1.5px)",
      opacity:     0.90,
      transition: `transform ${DUR.tap}ms ${EASE.outSoft}, opacity ${DUR.tap}ms ${EASE.outSoft}`,
    },
    idle: {
      transform:  "scale(1) translateY(0)",
      opacity:     1,
      transition: `transform ${DUR.tapRelease}ms ${EASE.out}, opacity ${DUR.tapRelease}ms ${EASE.out}`,
    },
  },
  // CTA (Primary Buttons — wärmere, sichtbarere Reaktion)
  cta: {
    pressed: {
      transform:   "scale(0.960) translateY(2px)",
      filter:      "brightness(0.92)",
      transition:  `transform ${DUR.tap}ms ${EASE.outSoft}, filter ${DUR.tap}ms ${EASE.outSoft}`,
    },
    idle: {
      transform:  "scale(1) translateY(0)",
      filter:     "brightness(1)",
      transition: `transform ${DUR.tapRelease}ms ${EASE.out}, filter ${DUR.tapRelease}ms ${EASE.out}`,
    },
  },
};

// ─────────────────────────────────────────────────────────────────
//  CARD INTERACTION SYSTEM
//  Hover/Touch — physische Oberflächen, kein App-Feeling.
// ─────────────────────────────────────────────────────────────────

export const CARD = {
  // Basis-Karte — ruhig, minimal
  base: {
    idle: {
      transform:  "translateY(0) scale(1)",
      boxShadow:  "0 2px 10px rgba(0,0,0,0.055), 0 1px 3px rgba(0,0,0,0.030)",
      transition: `transform ${DUR.normal}ms ${EASE.out}, box-shadow ${DUR.normal}ms ${EASE.out}`,
    },
    hover: {
      transform:  "translateY(-2px) scale(1.005)",
      boxShadow:  "0 6px 24px rgba(0,0,0,0.082), 0 2px 6px rgba(0,0,0,0.040)",
      transition: `transform ${DUR.normal}ms ${EASE.out}, box-shadow ${DUR.normal}ms ${EASE.out}`,
    },
    pressed: {
      transform:  "translateY(1px) scale(0.985)",
      boxShadow:  "0 1px 5px rgba(0,0,0,0.045), 0 0 2px rgba(0,0,0,0.025)",
      transition: `transform ${DUR.tap}ms ${EASE.outSoft}, box-shadow ${DUR.tap}ms ${EASE.outSoft}`,
    },
  },
  // Hero-Karte — größer, stärker
  hero: {
    idle: {
      transform:  "translateY(0) scale(1)",
      boxShadow:  "0 4px 20px rgba(0,0,0,0.070), 0 1px 5px rgba(0,0,0,0.035)",
      transition: `transform ${DUR.normal}ms ${EASE.out}, box-shadow ${DUR.normal}ms ${EASE.out}`,
    },
    hover: {
      transform:  "translateY(-3px) scale(1.008)",
      boxShadow:  "0 10px 36px rgba(0,0,0,0.095), 0 3px 8px rgba(0,0,0,0.045)",
      transition: `transform ${DUR.normal}ms ${EASE.out}, box-shadow ${DUR.normal}ms ${EASE.out}`,
    },
    pressed: {
      transform:  "translateY(1.5px) scale(0.982)",
      boxShadow:  "0 2px 8px rgba(0,0,0,0.055), 0 0 2px rgba(0,0,0,0.030)",
      transition: `transform ${DUR.tap}ms ${EASE.outSoft}, box-shadow ${DUR.tap}ms ${EASE.outSoft}`,
    },
  },
};

// ─────────────────────────────────────────────────────────────────
//  PAGE / TAB TRANSITION SYSTEM
//  "Ich bewege mich durch Räume" — nicht "ich lade neue Screens"
// ─────────────────────────────────────────────────────────────────

export const PAGE = {
  // Active Tab — voll sichtbar, im Fluss
  active: (surfaceOpen = false) => ({
    position:      "relative",
    opacity:       1,
    transform:     "translateX(0) translateY(0) scale(1)",
    pointerEvents: surfaceOpen ? "none" : "auto",
    userSelect:    surfaceOpen ? "none" : "auto",
    transition:    `opacity ${DUR.page}ms ${EASE.cinematic}, transform ${DUR.page}ms ${EASE.cinematic}`,
    zIndex:        "auto",
  }),
  // Inactive Tab — ausgeblendet, aus dem Fluss
  inactive: {
    position:      "absolute",
    top:           0, left: 0,
    width:         "100%",
    opacity:       0,
    transform:     "translateX(0) translateY(4px) scale(0.998)",
    pointerEvents: "none",
    userSelect:    "none",
    transition:    `opacity ${DUR.page}ms ${EASE.cinematic}, transform ${DUR.page}ms ${EASE.cinematic}`,
    zIndex:        0,
  },
  // Fallback Tab (harter Reset ohne Animation)
  reset: {
    position:      "absolute",
    top:           0, left: 0,
    width:         "100%",
    opacity:       0,
    pointerEvents: "none",
    userSelect:    "none",
    zIndex:        0,
  },
};

// ─────────────────────────────────────────────────────────────────
//  LOADING STATES — warm, ruhig, atmosphärisch
//  Kein Spinner aus SaaS-Template.
// ─────────────────────────────────────────────────────────────────

export const LOADING = {
  // Pulsierendes Skeleton für Cards
  skeletonPulse: {
    animation: `huiSkeletonBreath ${DUR.breathe}ms ${EASE.outGentle} infinite`,
    background: "linear-gradient(90deg, rgba(250,247,242,0.6) 0%, rgba(240,235,228,0.8) 50%, rgba(250,247,242,0.6) 100%)",
    backgroundSize: "200% 100%",
  },
  // Gentle Fade-In beim Laden von Content
  contentIn: {
    animation: `huiFadeSlideUp ${DUR.mood}ms ${EASE.out} both`,
  },
  // Atmospheric Dots (statt Spinner)
  dotsBase: {
    display:       "flex",
    gap:           8,
    alignItems:    "center",
    justifyContent:"center",
  },
};

// ─────────────────────────────────────────────────────────────────
//  AMBIENT MOTION — Micro-Bewegungen
//  Sehr subtil. Fast unterbewusst. Nie ablenkend.
// ─────────────────────────────────────────────────────────────────

export const AMBIENT = {
  // Sanftes Schweben — für Hero-Elemente, Orb
  float: (delayMs = 0) => ({
    animation: `huiFloat ${DUR.float}ms ${EASE.outGentle} ${delayMs}ms infinite`,
  }),
  floatB: (delayMs = 0) => ({
    animation: `huiFloatB ${DUR.float * 1.15}ms ${EASE.outGentle} ${delayMs}ms infinite`,
  }),
  // Atmen — für Glow-Elemente, Background-Blobs
  breathe: (delayMs = 0) => ({
    animation: `huiBreathe ${DUR.breathe}ms ${EASE.outGentle} ${delayMs}ms infinite`,
  }),
  breatheSlow: (delayMs = 0) => ({
    animation: `huiBreatheSlow ${DUR.breatheSlow}ms ${EASE.outGentle} ${delayMs}ms infinite`,
  }),
  // Pulse für Presence-Dots
  pulse: (delayMs = 0) => ({
    animation: `huiPulse 2.6s ${EASE.outGentle} ${delayMs}ms infinite`,
  }),
  // Slow Glow Drift — für atmosphärische Layer
  glowDrift: (delayMs = 0) => ({
    animation: `huiGlowDrift ${DUR.breatheSlow}ms ${EASE.outGentle} ${delayMs}ms infinite`,
  }),
};

// ─────────────────────────────────────────────────────────────────
//  GLOBAL KEYFRAMES CSS
//  Einmalig per <style>{IX.CSS}</style> einbinden.
// ─────────────────────────────────────────────────────────────────

export const CSS = `

  /* ── Tap Utility — auf allen tappable Elementen ──────────── */
  .hui-tap {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    cursor: pointer;
    user-select: none;
  }

  /* ── CTA Utility — primäre Buttons ─────────────────────── */
  /* Einladend, nicht aggressiv. Warmth bei Tap. */
  .hui-cta {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    cursor: pointer;
    user-select: none;
    transition: transform 200ms cubic-bezier(0.16,1,0.30,1),
                filter 160ms ease,
                box-shadow 200ms cubic-bezier(0.16,1,0.30,1);
  }
  .hui-cta:active {
    transform: scale(0.960) translateY(2px);
    filter: brightness(0.90) saturate(1.1);
    box-shadow: 0 2px 8px rgba(0,0,0,0.10) !important;
    transition: transform 120ms cubic-bezier(0.22,1,0.36,1),
                filter 100ms ease;
  }

  /* ── Card Utility ────────────────────────────────────────── */
  .hui-card {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    cursor: pointer;
    transition: transform 220ms cubic-bezier(0.16,1,0.30,1),
                box-shadow 220ms cubic-bezier(0.16,1,0.30,1),
                opacity 120ms ease;
  }
  .hui-card:active {
    transform: scale(0.982) translateY(1.5px);
    box-shadow: 0 1px 5px rgba(0,0,0,0.045);
    opacity: 0.92;
    transition: transform 120ms cubic-bezier(0.22,1,0.36,1);
  }

  /* ── Icon Button Utility ─────────────────────────────────── */
  .hui-icon-btn {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    cursor: pointer;
    transition: transform 200ms cubic-bezier(0.16,1,0.30,1), opacity 150ms ease;
  }
  .hui-icon-btn:active {
    transform: scale(0.860) translateY(0.5px);
    opacity: 0.68;
    transition: transform 110ms cubic-bezier(0.22,1,0.36,1);
  }

  /* ── Scroll Feel — kein Momentum-Sprung ─────────────────── */
  .hui-scroll {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .hui-scroll::-webkit-scrollbar { display: none; }

  /* ── Float ───────────────────────────────────────────────── */
  @keyframes huiFloat {
    0%, 100% { transform: translateY(0px) rotate(-0.5deg); }
    50%      { transform: translateY(-7px) rotate(0.5deg); }
  }
  @keyframes huiFloatB {
    0%, 100% { transform: translateY(2px) rotate(0.4deg); }
    50%      { transform: translateY(-5px) rotate(-0.4deg); }
  }
  @keyframes huiFloatC {
    0%, 100% { transform: translateY(-3px); }
    50%      { transform: translateY(4px); }
  }

  /* ── Breathe — sehr subtil, beinahe unsichtbar ───────────── */
  @keyframes huiBreathe {
    0%, 100% { transform: scale(1);    opacity: 0.85; }
    50%      { transform: scale(1.04); opacity: 1.00; }
  }
  @keyframes huiBreatheSlow {
    0%, 100% { transform: scale(1)    rotate(0deg); opacity: 0.72; }
    33%      { transform: scale(1.06) rotate(2deg); opacity: 0.90; }
    66%      { transform: scale(0.97) rotate(-1deg); opacity: 0.78; }
  }

  /* ── Pulse (Presence Dots, Live-Indikatoren) ─────────────── */
  @keyframes huiPulse {
    0%, 100% { transform: scale(1);    opacity: 1; }
    50%      { transform: scale(0.55); opacity: 0.22; }
  }
  @keyframes huiPulseRing {
    0%       { transform: scale(1);    opacity: 0.45; }
    100%     { transform: scale(2.2);  opacity: 0; }
  }

  /* ── Glow Drift — für atmospheric Blobs ─────────────────── */
  @keyframes huiGlowDrift {
    0%, 100% { transform: translate(-50%,-50%) scale(1)    rotate(0deg); }
    33%      { transform: translate(-50%,-50%) scale(1.08) rotate(6deg); }
    66%      { transform: translate(-52%,-48%) scale(0.94) rotate(-4deg); }
  }
  @keyframes huiGlowDriftB {
    0%, 100% { transform: translate(-50%,-50%) scale(1)    rotate(0deg); }
    40%      { transform: translate(-48%,-52%) scale(1.06) rotate(-5deg); }
    70%      { transform: translate(-50%,-50%) scale(0.97) rotate(3deg); }
  }

  /* ── Fade-Slide (Content erscheint) ─────────────────────── */
  @keyframes huiFadeSlideUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes huiFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* ── Skeleton ────────────────────────────────────────────── */
  @keyframes huiSkeletonBreath {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Sheet / Overlay Entry ───────────────────────────────── */
  @keyframes huiSheetUp {
    from { opacity: 0; transform: translateY(36px) scale(0.975); }
    to   { opacity: 1; transform: translateY(0)    scale(1);     }
  }
  @keyframes huiSheetDown {
    from { opacity: 1; transform: translateY(0)    scale(1);     }
    to   { opacity: 0; transform: translateY(36px) scale(0.975); }
  }
  @keyframes huiOverlayIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes huiScaleIn {
    from { opacity: 0; transform: scale(0.84); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* ── Orb Specific ─────────────────────────────────────────── */
  @keyframes huiOrbBreath {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(13,196,181,0),
                  0 10px 36px rgba(13,196,181,0.16),
                  0 0 70px rgba(13,196,181,0.07);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(13,196,181,0.04),
                  0 14px 48px rgba(13,196,181,0.22),
                  0 0 90px rgba(13,196,181,0.10);
    }
  }
  @keyframes huiOrbBreathCoral {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(244,115,85,0),
                  0 10px 36px rgba(244,115,85,0.16),
                  0 0 70px rgba(244,115,85,0.07);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(244,115,85,0.04),
                  0 14px 48px rgba(244,115,85,0.22),
                  0 0 90px rgba(244,115,85,0.10);
    }
  }
  @keyframes huiOrbPulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(13,196,181,0.00),
                  0 4px 18px rgba(13,196,181,0.38),
                  0 2px 6px rgba(0,0,0,0.14);
    }
    50% {
      box-shadow: 0 0 0 6px rgba(13,196,181,0.08),
                  0 4px 26px rgba(13,196,181,0.60),
                  0 2px 6px rgba(0,0,0,0.14);
    }
  }
  @keyframes huiOrbNodeIn {
    0%   { opacity: 0; transform: scale(0.7) translateY(6px); }
    100% { opacity: 1; transform: scale(1)   translateY(0);   }
  }

  /* ── Nav Orb Idle ─────────────────────────────────────────── */
  @keyframes huiNavOrbIdle {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.025); }
  }

  /* ── Spin (minimal, nur wo nötig) ───────────────────────── */
  @keyframes huiSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`;

// ─────────────────────────────────────────────────────────────────
//  REACT HOOK: useTap
//  Verwaltet Pressed-State für jedes tappable Element.
//  Gibt Style-Objekte zurück die direkt auf style={} gehen.
// ─────────────────────────────────────────────────────────────────

// Note: Hook wird in einer separaten Datei exportiert damit dieser
// File auch in .js-Kontexten (OrbConfig.js) nutzbar bleibt.

// ─────────────────────────────────────────────────────────────────
//  ORB INTERACTION TOKENS
//  Alle Werte die das Orb-System für Motion braucht.
// ─────────────────────────────────────────────────────────────────

export const ORB = {
  // Öffnungs-Animation
  overlayIn: {
    animation: `huiOverlayIn ${DUR.cinematic}ms ${EASE.out} both`,
  },
  // Center-Orb Entry
  centerIn: {
    animation: `huiScaleIn ${DUR.mood}ms ${EASE.out} 80ms both`,
  },
  // Center-Orb Breathe (Dauerbewegung)
  centerBreathe: {
    animation: `huiOrbBreath ${DUR.breatheSlow}ms ${EASE.outGentle} infinite`,
  },
  // Node Entry — gestaffelt via delay
  nodeIn: (idx) => ({
    animation: `huiOrbNodeIn ${DUR.normal}ms ${EASE.out} ${120 + idx * 55}ms both`,
  }),
  // Node Float — jeder Node eigene Phase
  nodeFloat: (idx) => {
    const floats = ["huiFloat", "huiFloatB", "huiFloatC", "huiFloat", "huiFloatB"];
    const delays = [0, 400, 800, 200, 600];
    return {
      animation: `${floats[idx % 5]} ${DUR.float + idx * 300}ms ${EASE.outGentle} ${delays[idx % 5]}ms infinite`,
    };
  },
  // Tap-Reaktion auf Nodes
  nodeTap: {
    transform:  "scale(0.91) translateY(2px)",
    filter:     "brightness(0.90)",
    transition: `transform ${DUR.tap}ms ${EASE.outSoft}, filter ${DUR.tap}ms ${EASE.outSoft}`,
  },
  nodeIdle: {
    transform:  "scale(1) translateY(0)",
    filter:     "brightness(1)",
    transition: `transform ${DUR.tapRelease}ms ${EASE.out}, filter ${DUR.tapRelease}ms ${EASE.out}`,
  },
};

// ─────────────────────────────────────────────────────────────────
//  BUTTON INTERACTION SYSTEM
//  CTA Buttons — einladen, nicht schreien.
// ─────────────────────────────────────────────────────────────────

export const BTN = {
  // Standard Hover-Style (desktop)
  hoverLight: {
    filter:     "brightness(1.06) saturate(1.08)",
    transform:  "translateY(-1px)",
    transition: `all ${DUR.micro}ms ${EASE.out}`,
  },
  hoverIdle: {
    filter:     "brightness(1) saturate(1)",
    transform:  "translateY(0)",
    transition: `all ${DUR.micro}ms ${EASE.out}`,
  },
};

// ─────────────────────────────────────────────────────────────────
//  SCROLL FEEL SYSTEM
//  Spacing und Rhythmus der Feed-Elemente.
// ─────────────────────────────────────────────────────────────────

export const SCROLL = {
  // Staggered Entry — jedes n-te Element kommt etwas später
  staggerIn: (idx, baseDelay = 0) => ({
    animation: `huiFadeSlideUp ${DUR.mood}ms ${EASE.out} ${baseDelay + idx * 65}ms both`,
  }),
  // Section Separator — atmosphärische Atempause
  sectionBreath: {
    height:     32,
    position:   "relative",
    overflow:   "hidden",
  },
};

// ─────────────────────────────────────────────────────────────────
//  SURFACE / OVERLAY TRANSITIONS
//  Sheets, Modals, Profile-Overlays
// ─────────────────────────────────────────────────────────────────

export const SURFACE = {
  // Sheet von unten
  sheetIn: {
    animation: `huiSheetUp ${DUR.mood}ms ${EASE.out} both`,
  },
  // Overlay Fade
  overlayIn: {
    animation: `huiOverlayIn ${DUR.page}ms ${EASE.out} both`,
  },
  // Backdrop Blur — ruhige Abdunklung
  backdrop: (strength = 0.52) => ({
    background:    `rgba(20,20,34,${strength})`,
    backdropFilter:"blur(12px) saturate(1.2)",
    transition:    `background ${DUR.mood}ms ${EASE.outGentle}, backdrop-filter ${DUR.mood}ms ${EASE.outGentle}`,
  }),
};

// ─────────────────────────────────────────────────────────────────
//  SKELETON LOADING SYSTEM
//  Warm, atmosphärisch — keine generischen Spinner.
// ─────────────────────────────────────────────────────────────────

export const SKELETON = {
  // Standard Skeleton-Wrapper
  wrap: (height, radius = 18, delay = "0s") => ({
    height,
    borderRadius:  radius,
    background:    "linear-gradient(90deg, #F5EEE4 0%, #EDE5D8 50%, #F5EEE4 100%)",
    backgroundSize:"300% 100%",
    animation:     `huiSkeletonBreath 2.8s linear ${delay} infinite`,
    border:        "1px solid rgba(0,0,0,0.032)",
  }),
  // Inline-Text Skeleton
  text: (w = "100%", delay = "0s") => ({
    width:         w,
    height:        12,
    borderRadius:  6,
    background:    "linear-gradient(90deg, #F5EEE4 0%, #EDE5D8 50%, #F5EEE4 100%)",
    backgroundSize:"300% 100%",
    animation:     `huiSkeletonBreath 2.8s linear ${delay} infinite`,
  }),
};

// ─────────────────────────────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────────────────────────────

export const IX = {
  EASE,
  DUR,
  TAP,
  CARD,
  PAGE,
  LOADING,
  AMBIENT,
  CSS,
  ORB,
  BTN,
  SCROLL,
  SURFACE,
  SKELETON,
};
