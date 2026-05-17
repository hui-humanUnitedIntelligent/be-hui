// src/lib/animations.js
// HUI — GPU-beschleunigte Animations-Standards — Phase 4D.6
// ═══════════════════════════════════════════════════════════════
// NUR transform + opacity — kein top/left/width-Animation
// NUR GPU-Layer: will-change: transform, opacity
// ═══════════════════════════════════════════════════════════════

// ── Standard Transition Durations ────────────────────────────────
export const ANIM_DUR = {
  instant:  '80ms',
  fast:     '150ms',
  normal:   '250ms',
  slow:     '400ms',
  verySlow: '600ms',
};

// ── Standard Easing ──────────────────────────────────────────────
export const ANIM_EASE = {
  out:     'cubic-bezier(0.25, 0.46, 0.45, 0.94)',  // sanftes Out
  in:      'cubic-bezier(0.55, 0.055, 0.675, 0.19)', // sanftes In
  spring:  'cubic-bezier(0.34, 1.02, 0.64, 1)',       // leichter Spring
  breathe: 'cubic-bezier(0.4, 0, 0.6, 1)',            // meditativer Atemrhythmus
  overlay: 'cubic-bezier(0.32, 0.72, 0, 1)',          // Overlay Slide
};

// ── Standard Transitions ─────────────────────────────────────────
// Nur transform + opacity — GPU-Layer garantiert
export const ANIM_T = {
  overlay:  `transform ${ANIM_DUR.normal} ${ANIM_EASE.overlay}, opacity ${ANIM_DUR.normal} ${ANIM_EASE.out}`,
  card:     `transform ${ANIM_DUR.fast} ${ANIM_EASE.out}, opacity ${ANIM_DUR.fast} ${ANIM_EASE.out}`,
  fade:     `opacity ${ANIM_DUR.normal} ${ANIM_EASE.out}`,
  spring:   `transform ${ANIM_DUR.slow} ${ANIM_EASE.spring}, opacity ${ANIM_DUR.fast} ${ANIM_EASE.out}`,
  breathe:  `transform 4s ${ANIM_EASE.breathe} infinite, opacity 4s ${ANIM_EASE.breathe} infinite`,
  instant:  `transform ${ANIM_DUR.instant} ${ANIM_EASE.out}, opacity ${ANIM_DUR.instant} ${ANIM_EASE.out}`,
};

// ── GPU-Layer Hints ──────────────────────────────────────────────
// will-change NUR auf Elementen die tatsächlich animieren
export const GPU = {
  transform:  { willChange: 'transform' },
  opacity:    { willChange: 'opacity' },
  both:       { willChange: 'transform, opacity' },
  // Nach Animation: will-change zurücksetzen (verhindert Memory-Druck)
  none:       { willChange: 'auto' },
};

// ── Standard Overlay-State ───────────────────────────────────────
// Für alle Bottom Sheets + Overlays
export function overlayStyles(visible) {
  return {
    transform: visible ? 'translateY(0)' : 'translateY(100%)',
    opacity:   visible ? 1 : 0,
    transition: T.overlay,
    willChange: 'transform, opacity',
  };
}

// ── Card Tap-Feedback ────────────────────────────────────────────
export function tapStyles(pressed) {
  return {
    transform: pressed ? 'scale(0.97)' : 'scale(1)',
    transition: T.instant,
    // KEIN will-change — zu viele Cards würden GPU-Memory verbrauchen
  };
}

// ── Fade In/Out ──────────────────────────────────────────────────
export function fadeStyles(visible) {
  return {
    opacity:    visible ? 1 : 0,
    transition: T.fade,
    pointerEvents: visible ? 'auto' : 'none',
  };
}

// ── Mobile-safe fixed positioning ────────────────────────────────
// Safari-fix: position:fixed + iOS keyboard
export const SAFE_FIXED_BOTTOM = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  // iOS Safari: padding-bottom = safe-area-inset-bottom
  paddingBottom: 'max(0px, env(safe-area-inset-bottom, 0px))',
};

// ── Passive Event Listener Options ───────────────────────────────
// Immer für scroll/touch events verwenden
export const PASSIVE = { passive: true };
export const PASSIVE_CAPTURE = { passive: true, capture: true };

// ── CSS-Keyframe Strings (für style-tags) ────────────────────────
export const KEYFRAMES = {
  fadeUp: `
    @keyframes huiFadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `,
  breathe: `
    @keyframes huiBreathe {
      0%, 100% { transform: scale(1); opacity: 0.9; }
      50%       { transform: scale(1.03); opacity: 1; }
    }
  `,
  slideUp: `
    @keyframes huiSlideUp {
      from { transform: translateY(100%); opacity: 0; }
      to   { transform: translateY(0);   opacity: 1; }
    }
  `,
  pulse: `
    @keyframes huiPulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }
  `,
};
