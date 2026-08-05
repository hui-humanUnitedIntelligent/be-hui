// ══════════════════════════════════════════════════════════════════════════════
// desktopTokens.js — HUI Desktop Design Tokens
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Single Source of Truth für alle Desktop-Design-Werte.
//   JS-Konstanten für programmatic use (inline styles, JS logic).
//   CSS Custom Properties (in desktopFoundation.css) spiegeln diese Werte.
//   Niemand darf Magic Numbers in Desktop-Komponenten verwenden.
//
// REGEL:
//   Neue Desktop-Komponenten importieren { TOKENS } und nutzen diese Werte.
//   Nie inline `width: 260` schreiben — immer `TOKENS.layout.sidebar.default`.
//
// ERWEITERBAR:
//   Neue Tokens werden hier hinzugefügt, dann in desktopFoundation.css als
//   CSS Custom Property definiert. Beide müssen synchron bleiben.
// ══════════════════════════════════════════════════════════════════════════════

// ── Layout ────────────────────────────────────────────────────────────────────
export const LAYOUT = {
  sidebar: {
    default:   260,   // Standard-Desktop (≥1280px)
    compact:   72,    // Laptop (1024–1279px) — Icon-only
    mini:      56,    // Tablet (768–1023px) — Minimal
  },
  content: {
    min:       640,   // Minimale Content-Breite
    max:       1100,  // Maximale Content-Breite (zentriert)
    padding:   32,    // Content-Padding (horizontal)
    paddingLg: 48,    // Content-Padding bei Large Desktop
  },
  rightPanel: {
    default:   340,   // Standard Right Panel
    wide:      380,   // Wide Right Panel (≥1536px)
    min:       320,   // Minimale Right Panel Breite
  },
  header: {
    height:    64,    // Desktop Header Höhe
  },
  gap: {
    section:   24,    // Abstand zwischen Sektionen
    card:      16,    // Abstand zwischen Karten
    item:      8,     // Abstand zwischen Items
  },
};

// ── Breakpoints ───────────────────────────────────────────────────────────────
export const BREAKPOINTS = {
  mobile:        0,      // < 768px — Nicht desktop (Mobile App)
  tablet:        768,    // 768–1023px — Tablet
  laptop:        1024,   // 1024–1279px — Laptop
  desktop:       1280,   // 1280–1535px — Standard Desktop
  largeDesktop:  1536,   // 1536–1919px — Large Desktop
  ultrawide:     1920,   // ≥ 1920px — Ultrawide
};

// ── Modal ──────────────────────────────────────────────────────────────────────
export const MODAL = {
  width:           480,   // Standard Modal-Breite
  maxWidth:        '90vw',
  radius:          20,
  padding:         32,
  backdropOpacity: 0.4,
  backdropBlur:     8,
};

// ── Spacing ────────────────────────────────────────────────────────────────────
export const SPACING = {
  xs:    4,
  sm:    8,
  md:    16,
  lg:    24,
  xl:    32,
  xxl:   48,
  xxxl:  64,
};

// ── Border Radius ───────────────────────────────────────────────────────────────
export const RADIUS = {
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  xxl:   28,
  pill:  999,
};

// ── Shadows ────────────────────────────────────────────────────────────────────
export const SHADOW = {
  sm:     '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
  md:     '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
  lg:     '0 8px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)',
  xl:     '0 16px 48px rgba(0,0,0,0.10), 0 8px 16px rgba(0,0,0,0.06)',
  hover:  '0 8px 24px rgba(14,196,181,0.10), 0 4px 8px rgba(0,0,0,0.05)',
  focus:  '0 0 0 3px rgba(14,196,181,0.18)',
};

// ── Animation ──────────────────────────────────────────────────────────────────
export const ANIMATION = {
  fast:     150,    // ms — Quick feedback (hover, tap)
  normal:   250,    // ms — Standard transitions
  slow:     350,    // ms — Page transitions, panels
  page:     400,    // ms — Route transitions
  easing:       'cubic-bezier(0.16, 1, 0.30, 1)',   // HUI signature ease
  easingOut:    'cubic-bezier(0.0, 0, 0.2, 1)',
  easingInOut:  'cubic-bezier(0.4, 0, 0.2, 1)',
};

// ── Z-Index Layers ─────────────────────────────────────────────────────────────
export const Z_INDEX = {
  base:            0,
  content:         10,
  sidebar:         50,
  header:          100,
  sticky:          200,
  dropdown:        500,
  popover:         700,
  modal:           1000,
  modalBackdrop:   999,
  commandPalette:  1100,
  tooltip:         1200,
  contextMenu:     1300,
};

// ── Composite Token Object ─────────────────────────────────────────────────────
export const TOKENS = {
  layout:      LAYOUT,
  breakpoints: BREAKPOINTS,
  modal:       MODAL,
  spacing:     SPACING,
  radius:      RADIUS,
  shadow:      SHADOW,
  animation:   ANIMATION,
  zIndex:      Z_INDEX,
};

export default TOKENS;
