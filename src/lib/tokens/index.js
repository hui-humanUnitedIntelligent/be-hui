// src/lib/tokens/index.js
// HUI — Design Token System — Phase 4F
// ═══════════════════════════════════════════════════════════════
//
// SINGLE SOURCE OF TRUTH für alle visuellen Konstanten.
// Kein hardcoded z-index. Keine Magic Numbers.
// Kein inline Transition-String.
//
// ── Prinzip ───────────────────────────────────────────────────
//   Import was du brauchst:
//   import { Z, SP, FS, FW, T, EASE, DUR, C } from '@/lib/tokens'
// ═══════════════════════════════════════════════════════════════

// ── Z-INDEX LAYER SYSTEM ─────────────────────────────────────
// Kanonisches Schema — keine Werte außerhalb dieser Tabelle.
//
//   0–9     Base (normaler DOM-Flow)
//  10–49    Cards, sticky Elemente
//  50–99    Floating Buttons (Orb, FAB)
// 100–199   Header, BottomNav
// 200–399   Sheets (erste Overlay-Ebene)
// 300–399   Sekundäre Overlays (Chat, Notifs)
// 400–499   Primary Flows (Booking, Create)
// 500–599   Full-Screen (Story, Map)
// 600–699   Critical (Membership, Onboarding)
// 700–799   Emergency Dialogs
// 1000      Toast/Feedback (immer oberhalb)
//
// VERBOTEN: alle Werte > 1000

export const Z = {
  // Base
  base:          1,
  card:         10,
  cardHover:    11,
  stickyCard:   20,

  // Floating
  floatingBtn:  50,
  orbBackdrop:  60,
  orb:          70,

  // Navigation
  header:      100,
  bottomNav:   110,
  appBar:      120,

  // Sheets — erste Ebene
  sheet1:      200,
  sheet1Top:   201,   // Content über Backdrop

  // Overlays — zweite Ebene
  overlay:     300,
  overlayTop:  301,
  chat:        310,
  notifs:      320,

  // Primary Flows
  flow:        400,
  flowTop:     401,
  booking:     410,
  create:      420,

  // Full-Screen
  fullscreen:  500,
  story:       510,
  map:         520,
  storyTop:    511,

  // Critical System
  critical:    600,
  membership:  610,
  onboarding:  620,

  // Emergency
  emergency:   700,
  debug:       800,  // NUR in Dev

  // Toast — immer ganz oben
  toast:      1000,
};

// ── SPACING TOKENS ────────────────────────────────────────────
// 4px-Raster. Kein px-Wert außerhalb dieser Skala.
//
//  SP.1 =  4px   micro
//  SP.2 =  8px   compact
//  SP.3 = 12px   tight
//  SP.4 = 16px   base
//  SP.5 = 20px   comfortable
//  SP.6 = 24px   spacious
//  SP.7 = 32px   section
//  SP.8 = 40px   large section
//  SP.9 = 48px   page margin
// SP.10 = 64px   hero

export const SP = {
  1:  4,
  2:  8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
 10: 64,

  // Named aliases
  micro:       4,
  compact:     8,
  tight:      12,
  base:       16,
  comfortable:20,
  spacious:   24,
  section:    32,
  large:      40,
  page:       48,
  hero:       64,

  // Touch target
  touch:      44,   // Apple HIG Minimum
};

// ── TYPOGRAPHY SCALE ──────────────────────────────────────────
// Nur diese fontSizes. Keine .5-Zwischenwerte.

export const FS = {
  xs:    10,
  sm:    12,
  base:  14,
  md:    16,
  lg:    18,
  xl:    20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
  '6xl': 48,
};

// ── FONT WEIGHTS ─────────────────────────────────────────────
// Nur diese 5 Werte. Kein 300, kein 400 (zu schwach für Mobile).

export const FW = {
  normal:     500,   // fließtext
  medium:     600,   // emphasis
  semibold:   700,   // labels, buttons
  bold:       800,   // headings
  black:      900,   // hero, numbers
};

// ── BORDER RADIUS ────────────────────────────────────────────
export const R = {
  sm:   8,
  md:  12,
  lg:  16,
  xl:  20,
  '2xl':24,
  pill:999,  // vollständig rund
};

// ── MOTION: DURATIONS ────────────────────────────────────────
// Kein ms-Wert außerhalb dieser Skala.
//
// INSTANT  80ms   — tap feedback, icon reaction
// FAST    150ms   — tooltip, small reveals
// NORMAL  220ms   — card hover, tab switch
// MEDIUM  320ms   — overlay open
// SLOW    420ms   — page transitions
// CRAWL   600ms   — hero animations, breathe

export const DUR = {
  instant:  80,
  fast:    150,
  normal:  220,
  medium:  320,
  slow:    420,
  crawl:   600,
};

// ── MOTION: EASINGS ──────────────────────────────────────────
// Kein custom cubic-bezier inline.

export const EASE = {
  // Standard — meistgenutzt
  standard: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  // Out — für Overlays die reinkommen
  out:      'cubic-bezier(0.0, 0.0, 0.2, 1)',
  // In — für Overlays die rausgehen
  in:       'cubic-bezier(0.4, 0.0, 1, 1)',
  // Spring — leichter Überschwinger für Cards
  spring:   'cubic-bezier(0.34, 1.2, 0.64, 1)',
  // Soft spring — HUI Orb, weiche Elemente
  soft:     'cubic-bezier(0.34, 1.05, 0.64, 1)',
  // Linear — für opacity only
  linear:   'linear',
};

// ── MOTION: TRANSITION PRESETS ───────────────────────────────
// Fertige transition-strings. Keine inline strings mehr.

function t(prop, dur, ease) {
  return \`\${prop} \${dur}ms \${ease}\`;
}
function multi(...arr) { return arr.join(', '); }

export const T = {
  // Tap-Feedback (Buttons, Cards)
  tap:      multi(t('transform', DUR.instant, EASE.out), t('opacity', DUR.instant, EASE.out)),

  // Card hover
  card:     multi(t('transform', DUR.normal, EASE.spring), t('box-shadow', DUR.normal, EASE.standard)),

  // Einfaches Fade
  fade:     t('opacity', DUR.normal, EASE.standard),

  // Overlay slide-up (Bottom Sheet öffnen)
  slideUp:  multi(t('transform', DUR.medium, EASE.out), t('opacity', DUR.fast, EASE.out)),

  // Overlay slide-down (Bottom Sheet schließen)
  slideDown:multi(t('transform', DUR.normal, EASE.in), t('opacity', DUR.fast, EASE.in)),

  // Backdrop fade
  backdrop: t('opacity', DUR.fast, EASE.standard),

  // Tab-Wechsel
  tab:      multi(t('opacity', DUR.fast, EASE.out), t('transform', DUR.fast, EASE.out)),

  // Slow breathe (Orb, ambient)
  breathe:  multi(t('transform', DUR.crawl, EASE.soft), t('opacity', DUR.crawl, EASE.soft)),

  // Icon-Reaktion (Like, Follow)
  icon:     multi(t('transform', DUR.fast, EASE.spring), t('color', DUR.fast, EASE.standard)),

  // Farb-Transition (Button states)
  color:    multi(t('background', DUR.fast, EASE.standard), t('color', DUR.fast, EASE.standard)),

  // Box-Shadow
  shadow:   t('box-shadow', DUR.normal, EASE.standard),
};

// ── COLORS — HUI Design Tokens ───────────────────────────────
// Single source — kein hardcoded hex in Komponenten
export const C = {
  // Brand
  teal:      '#16D7C5',
  tealLight: '#E8FAF8',
  tealPale:  '#F0FAF9',
  coral:     '#FF8A6B',
  coralPale: '#FFF2EE',

  // Neutrals
  bg:        '#F9F7F4',    // App-Hintergrund
  surface:   '#FFFFFF',    // Cards, Sheets
  border:    '#EEEBE6',    // Trennlinien
  borderSoft:'rgba(0,0,0,0.07)',

  // Text
  ink:       '#1A1A1A',    // Primary text
  ink2:      '#2C2C2C',    // Secondary
  muted:     '#888888',    // Muted text
  muted2:    '#AAAAAA',    // Very muted
  placeholder:'#CCCCCC',   // Input placeholder

  // Shadows
  shadow:    'rgba(0,0,0,0.06)',
  shadowMd:  'rgba(0,0,0,0.10)',
  shadowLg:  'rgba(0,0,0,0.15)',
};
