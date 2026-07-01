/**
 * HUI Design System v1.0
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth für alle visuellen Entscheidungen.
 * Importiere dieses File in jede Komponente statt lokaler Tokens zu definieren.
 *
 * import { DS } from '../lib/ds';
 *
 * Design-Philosophie:
 *   Apple Vision Pro × Headspace × A24 × Nothing Phone
 *   Emotional, human, cinematic — kein SaaS, kein Dashboard, kein Neon
 */

// ─── Farben ───────────────────────────────────────────────────────────────────
export const color = {
  // Brand
  teal:     "#16D7C5",
  teal2:    "#0DBFB5",
  coral:    "#FF8A6B",
  coral2:   "#F5654A",
  gold:     "#F5A623",

  // Dark Mode (App Primary)
  bg:       "#060A14",      // Tiefes dunkles Blau — nicht reines Schwarz
  bg2:      "#0B1120",      // Etwas heller für Layering
  bg3:      "#111827",      // Cards auf dunkel

  // Light Mode (Feed, Discover)
  cream:    "#F9F7F4",
  warmWhite:"#FEFCFA",
  surface:  "#FFFFFF",

  // Text — Dark Background
  textDark: "rgba(255,255,255,0.94)",
  softDark: "rgba(255,255,255,0.72)",
  mutedDark:"rgba(255,255,255,0.46)",
  dimDark:  "rgba(255,255,255,0.22)",

  // Text — Light Background
  textLight:"#1A1A1A",
  softLight:"#4A4A4A",
  mutedLight:"#888888",

  // Glassmorphism Surfaces
  glass: {
    light: "rgba(255,255,255,0.80)",      // Light mode glass
    lightMid:"rgba(255,255,255,0.60)",
    dark:  "rgba(255,255,255,0.065)",     // Dark mode glass
    darkMid:"rgba(255,255,255,0.045)",
    darkDeep:"rgba(6,10,20,0.55)",        // Dunkle Glasschicht (Overlays)
    teal:  "rgba(22,215,197,0.09)",       // Teal-getönt
    coral: "rgba(255,138,107,0.09)",      // Coral-getönt
  },

  // Borders
  border: {
    light: "rgba(0,0,0,0.07)",
    lightSoft:"rgba(0,0,0,0.04)",
    dark:  "rgba(255,255,255,0.10)",
    darkSoft:"rgba(255,255,255,0.065)",
    teal:  "rgba(22,215,197,0.25)",
    tealSoft:"rgba(22,215,197,0.13)",
    coral: "rgba(255,138,107,0.22)",
  },
};

// ─── Radius ───────────────────────────────────────────────────────────────────
export const radius = {
  xs:   8,
  sm:   12,
  md:   16,
  lg:   20,
  xl:   24,
  xxl:  28,
  pill: 999,
  logo: (size) => size * 0.235,   // fn für Logo-Container
};

// ─── Blur / Glassmorphism ─────────────────────────────────────────────────────
// Immer via backdropFilter + WebkitBackdropFilter setzen.
export const blur = {
  sm:   "blur(8px)",
  md:   "blur(16px)",
  lg:   "blur(24px)",
  xl:   "blur(36px)",
  xxl:  "blur(48px)",
  // Kombiniert mit Saturate für warmes Glas:
  nav:  "blur(36px) saturate(1.8)",
};

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const shadow = {
  // Light Mode
  cardLight:   "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.07)",
  cardLightHover:"0 2px 8px rgba(0,0,0,0.06), 0 8px 28px rgba(0,0,0,0.10)",
  floatLight:  "0 8px 32px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.9) inset",

  // Dark Mode
  cardDark:    "0 1px 8px rgba(0,0,0,0.28), 0 4px 20px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.05)",
  floatDark:   "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",

  // Teal Glow (sparsam einsetzen — nicht auf jedem Element)
  tealSm:   "0 0 12px rgba(22,215,197,0.28)",
  tealMd:   "0 0 24px rgba(22,215,197,0.35), 0 4px 16px rgba(22,215,197,0.18)",
  tealLg:   "0 0 48px rgba(22,215,197,0.45), 0 0 96px rgba(22,215,197,0.18), 0 0 160px rgba(255,138,107,0.10)",

  // Coral Glow
  coralSm:  "0 0 12px rgba(255,138,107,0.25)",
  coralMd:  "0 0 24px rgba(255,138,107,0.32)",

  // Button — Premium
  btnTeal:  "0 8px 28px rgba(22,215,197,0.28), 0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.22)",
  btnCoral: "0 8px 28px rgba(255,138,107,0.28), 0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.20)",
  btnGhost: "0 2px 12px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.10)",
};

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const space = {
  xs:   4,
  sm:   8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
  // Horizontal screen padding
  screen: 22,
  // Safe areas
  safeTop:    "max(20px, env(safe-area-inset-top, 20px))",
  safeBottom: "max(40px, env(safe-area-inset-bottom, 40px))",
};

// ─── Typography ───────────────────────────────────────────────────────────────
export const type = {
  // Display — cinematic, emotional, groß
  displayXl: { fontSize: 48, fontWeight: 800, letterSpacing: -1.8, lineHeight: 1.06 },
  displayLg: { fontSize: 40, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.08 },
  displayMd: { fontSize: 34, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.10 },
  displaySm: { fontSize: 28, fontWeight: 800, letterSpacing: -0.9, lineHeight: 1.15 },

  // Headlines — ruhig, hochwertig
  h1: { fontSize: 24, fontWeight: 750, letterSpacing: -0.7, lineHeight: 1.2 },
  h2: { fontSize: 20, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.25 },
  h3: { fontSize: 17, fontWeight: 650, letterSpacing: -0.3, lineHeight: 1.3 },

  // Body
  body:   { fontSize: 15.5, fontWeight: 400, letterSpacing: 0,    lineHeight: 1.65 },
  bodyMd: { fontSize: 14.5, fontWeight: 400, letterSpacing: 0,    lineHeight: 1.6  },
  bodySm: { fontSize: 13,   fontWeight: 400, letterSpacing: 0,    lineHeight: 1.55 },

  // Caption
  caption: { fontSize: 11.5, fontWeight: 500, letterSpacing: 0.05, lineHeight: 1.4 },
  label:   { fontSize: 10.5, fontWeight: 700, letterSpacing: "0.12em", lineHeight: 1.3 },

  // Font Stack
  family: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
};

// ─── Animation ────────────────────────────────────────────────────────────────
// Durations: langsam, weich, cinematic
export const motion = {
  // Durations (ms)
  instant:  80,
  fast:     180,
  normal:   320,
  slow:     500,
  xslow:    700,
  cinematic:1000,

  // Easing
  ease:     "cubic-bezier(0.22,1,0.36,1)",       // Standard smooth
  spring:   "cubic-bezier(0.34,1.56,0.64,1)",    // Overshoot für Confirms
  decel:    "cubic-bezier(0,0,0.2,1)",            // Slides/Sheets
  accel:    "cubic-bezier(0.4,0,1,1)",            // Dismiss

  // Keyframe-Namen (für CSS-Injection)
  css: `
    @keyframes ds-fade-in  { from{opacity:0} to{opacity:1} }
    @keyframes ds-fade-up  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ds-scale-in { from{opacity:0;transform:scale(0.90)} to{opacity:1;transform:scale(1)} }
    @keyframes ds-slide-up { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
    @keyframes ds-slide-in { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
    @keyframes ds-float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes ds-breathe  { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:.9;transform:scale(1.06)} }
    @keyframes ds-spin-cw  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes ds-spin-ccw { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
    @keyframes ds-shimmer  { 0%{background-position:-300% 0} 100%{background-position:300% 0} }
    @keyframes ds-ken      { from{transform:scale(1.00) translateY(0px)} to{transform:scale(1.07) translateY(-6px)} }
    @keyframes ds-pulse-ring { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.15);opacity:0} }
    @keyframes ds-skeleton { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .ds-tap { -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
    .ds-tap:active { opacity:.82; }
    .ds-scroll { overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch;
                 scrollbar-width:none; -ms-overflow-style:none; }
    .ds-scroll::-webkit-scrollbar { display:none; }
  `,
};

// ─── Glassmorphism Helpers ────────────────────────────────────────────────────
// Fertige Style-Objekte — einfach spreaden
export const glass = {
  // Dark Mode Surfaces
  darkCard: {
    background: color.glass.dark,
    backdropFilter: blur.md,
    WebkitBackdropFilter: blur.md,
    border: `1px solid ${color.border.dark}`,
    boxShadow: shadow.cardDark,
    borderRadius: radius.lg,
  },
  darkCardHi: {
    background: color.glass.darkMid,
    backdropFilter: blur.lg,
    WebkitBackdropFilter: blur.lg,
    border: `1px solid ${color.border.darkSoft}`,
    boxShadow: shadow.cardDark,
    borderRadius: radius.lg,
  },
  darkOverlay: {
    background: color.glass.darkDeep,
    backdropFilter: blur.xl,
    WebkitBackdropFilter: blur.xl,
    border: `1px solid ${color.border.dark}`,
  },

  // Light Mode Surfaces
  lightCard: {
    background: color.glass.light,
    backdropFilter: blur.lg,
    WebkitBackdropFilter: blur.lg,
    border: `1px solid ${color.border.light}`,
    boxShadow: shadow.cardLight,
    borderRadius: radius.lg,
  },
  lightFloat: {
    background: color.glass.light,
    backdropFilter: blur.xl,
    WebkitBackdropFilter: blur.xl,
    border: `1px solid rgba(255,255,255,0.70)`,
    boxShadow: shadow.floatLight,
    borderRadius: radius.xxl,
  },

  // Teal Tinted
  tealCard: {
    background: color.glass.teal,
    backdropFilter: blur.md,
    WebkitBackdropFilter: blur.md,
    border: `1px solid ${color.border.teal}`,
    borderRadius: radius.lg,
  },
};

// ─── Button Styles ────────────────────────────────────────────────────────────
export const btn = {
  base: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    width: "100%", padding: "18px 28px",
    borderRadius: radius.lg, border: "none",
    fontFamily: type.family,
    fontSize: 16, fontWeight: 700, letterSpacing: -0.3,
    cursor: "pointer",
    transition: `transform ${motion.fast}ms ${motion.ease}, opacity ${motion.fast}ms ${motion.ease}`,
    WebkitTapHighlightColor: "transparent",
    touchAction: "manipulation",
  },
  teal: {
    background: `linear-gradient(145deg, rgba(22,215,197,0.95) 0%, rgba(10,185,174,0.98) 100%)`,
    color: "#041210",
    boxShadow: shadow.btnTeal,
    backdropFilter: blur.sm,
  },
  coral: {
    background: `linear-gradient(145deg, rgba(255,138,107,0.95) 0%, rgba(245,95,65,0.98) 100%)`,
    color: "#170806",
    boxShadow: shadow.btnCoral,
    backdropFilter: blur.sm,
  },
  ghost: {
    background: color.glass.dark,
    backdropFilter: blur.md,
    WebkitBackdropFilter: blur.md,
    color: color.softDark,
    boxShadow: shadow.btnGhost,
  },
  disabled: {
    background: "rgba(255,255,255,0.07)",
    color: "rgba(255,255,255,0.30)",
    cursor: "not-allowed",
    boxShadow: "none",
    opacity: 0.5,
  },
};

// ─── Vignette / Cinematic Overlays ────────────────────────────────────────────
export const vignette = {
  // Standard — leichte Randverdunklung
  subtle:   "radial-gradient(ellipse at center, transparent 55%, rgba(6,10,20,0.40) 100%)",
  // Stärker — für dramatische Szenen
  strong:   "radial-gradient(ellipse at center, transparent 40%, rgba(6,10,20,0.65) 100%)",
  // Von unten — für Bild+Content
  fromBottom: (start = "50%") => `linear-gradient(180deg,
    rgba(6,10,20,0.06) 0%,
    rgba(6,10,20,0.18) 30%,
    rgba(6,10,20,0.55) ${start},
    rgba(6,10,20,0.92) 80%,
    rgba(6,10,20,1.00) 94%)`,
  // Von oben — für Header-Überlagerung
  fromTop:    "linear-gradient(180deg, rgba(6,10,20,0.55) 0%, transparent 100%)",
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export const progressBar = {
  // Segment Style
  segment: (filled, active) => ({
    flex: 1, height: "1.5px", borderRadius: radius.pill,
    background: filled
      ? `linear-gradient(90deg, ${color.teal}, ${color.coral})`
      : "rgba(255,255,255,0.14)",
    boxShadow: active ? `0 0 6px rgba(22,215,197,0.7)` : "none",
    transition: `background ${motion.slow}ms ${motion.ease}`,
  }),
};

// ─── Complete DS Export ───────────────────────────────────────────────────────
export const DS = {
  color, radius, blur, shadow, space, type, motion, glass, btn, vignette, progressBar,
};

export default DS;
