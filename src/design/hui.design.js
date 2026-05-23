/**
 * ════════════════════════════════════════════════════════════════
 *  HUI DESIGN SYSTEM — Phase 20
 *  Single Source of Truth für die gesamte Plattform.
 *
 *  Philosophie:
 *  Humane Zukunft · Emotionale Technologie · Ruhige Intelligenz
 *  Warme digitale Räume · Hoffnung statt Dopamin · Cinematic Calm
 *
 *  Usage:  import { HUI } from "../design/hui.design.js";
 *          import { HUI } from "../../design/hui.design.js";  // tiefer
 * ════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────
//  FARB-SYSTEM
// ─────────────────────────────────────────────────────────────────

const COLOR = {
  // PRIMARY — Brand-Identität
  teal:        "#0DC4B5",   // Warm Turquoise — primäre Markenfarbe
  tealLight:   "#22DDD0",   // Helles Teal für Highlights
  tealDeep:    "#09A89A",   // Tiefes Teal für aktive States
  tealPale:    "#E6FAF8",   // Sehr helles Teal für Hintergründe
  tealGlow:    "rgba(13,196,181,0.18)",

  coral:       "#F47355",   // Humane Coral — Emotion, CTA
  coralLight:  "#F99478",   // Hell-Coral für Tags, Badges
  coralDeep:   "#E05C3C",   // Tief-Coral für Pressed States
  coralPale:   "#FFF0EB",   // Sehr helles Coral
  coralGlow:   "rgba(244,115,85,0.18)",

  cream:       "#FAF7F2",   // Haupt-Hintergrund — warmes Weiß
  creamWarm:   "#F5EEE3",   // Tiefes Creme für Hero-Bereiche
  creamDeep:   "#EDE5D8",   // Noch tiefer für Layer-Trennung
  creamSoft:   "#FDFBF8",   // Fast-Weiß für Karten

  ink:         "#141422",   // Primäres Schwarz — Navy-Tiefe
  inkMid:      "#2E2E45",   // Mid-Tone für Subheadlines
  ink2:        "#3A3A55",   // Body-Text
  muted:       "#8A8A9E",   // Muted Labels, Hints
  faint:       "#C0C0D0",   // Sehr leise Texte, Borders

  // SECONDARY
  gold:        "#D4952A",   // Abend-Gold — Impact, Highlights
  goldLight:   "#F0C46A",   // Hell-Gold
  goldPale:    "#FDF6E3",   // Gold-Hintergrund
  goldGlow:    "rgba(212,149,42,0.16)",

  violet:      "#7264D6",   // Kreativ-Violett — Bildung, Kunst
  violetLight: "#9488E8",   // Hell-Violett
  violetPale:  "#F0EEFF",   // Violett-Hintergrund
  violetGlow:  "rgba(114,100,214,0.16)",

  sage:        "#6BAE8F",   // Sage-Grün — Natur, Nachhaltigkeit
  sagePale:    "#EEF7F2",   // Sage-Hintergrund
  sageGlow:    "rgba(107,174,143,0.15)",

  peach:       "#F0A87A",   // Pfirsich — Wärme, Menschen
  sky:         "#70BFD8",   // Himmel-Cyan — Weite, Offenheit

  // SYSTEM
  white:       "#FFFFFF",
  black:       "#000000",
  error:       "#E53935",
  success:     "#2ECC71",
  warning:     "#F39C12",
};

// ─────────────────────────────────────────────────────────────────
//  SURFACE-SYSTEM — Layered Depth
// ─────────────────────────────────────────────────────────────────

const SURFACE = {
  // Level 0 — Seiten-Fundament
  page:    COLOR.cream,

  // Level 1 — Standard Cards
  card:    COLOR.creamSoft,

  // Level 2 — Elevated Cards (float über Level 1)
  raised:  COLOR.white,

  // Level 3 — Premium Glas
  glass:   "rgba(255,252,248,0.82)",
  glassMid:"rgba(255,251,245,0.90)",
  glassTop:"rgba(255,252,248,0.95)",

  // Level 4 — Atmosphärische Overlays
  overlay:    "rgba(20,20,34,0.48)",
  overlayWarm:"rgba(40,30,20,0.38)",
  overlayBlur:"rgba(255,252,248,0.70)",

  // Hero-Fundament — warmes goldenes Licht
  hero:    `linear-gradient(175deg, #FCF0DF 0%, #F7EBDA 40%, #F2E5D0 100%)`,

  // Glas-Materialien — backdrop-filter kompatibel
  glassFilter: "blur(24px) saturate(1.4)",
  glassMidFilter: "blur(16px) saturate(1.3)",
  glassLightFilter: "blur(10px) saturate(1.2)",
};

// ─────────────────────────────────────────────────────────────────
//  SHADOW- & LICHT-SYSTEM
// ─────────────────────────────────────────────────────────────────

const SHADOW = {
  // Standard Card-Ebenen
  xs:   "0 1px 4px rgba(0,0,0,0.040)",
  sm:   "0 2px 10px rgba(0,0,0,0.055), 0 1px 3px rgba(0,0,0,0.030)",
  md:   "0 4px 20px rgba(0,0,0,0.070), 0 1px 5px rgba(0,0,0,0.035)",
  lg:   "0 8px 36px rgba(0,0,0,0.090), 0 2px 8px rgba(0,0,0,0.040)",
  xl:   "0 16px 56px rgba(0,0,0,0.110), 0 4px 14px rgba(0,0,0,0.045)",

  // Glass-Karten mit inset highlight
  glass:
    "0 8px 36px rgba(0,0,0,0.080), 0 1px 6px rgba(0,0,0,0.030), inset 0 1px 0 rgba(255,255,255,0.95)",
  glassHeavy:
    "0 16px 56px rgba(0,0,0,0.100), 0 4px 16px rgba(0,0,0,0.040), inset 0 1px 0 rgba(255,255,255,0.98)",

  // Brand-Glow für CTA-Buttons (aufrufbar als Funktion)
  btnTeal:   "0 4px 18px rgba(13,196,181,0.38), 0 1px 4px rgba(13,196,181,0.24)",
  btnCoral:  "0 4px 18px rgba(244,115,85,0.38), 0 1px 4px rgba(244,115,85,0.24)",
  btnGold:   "0 4px 18px rgba(212,149,42,0.34), 0 1px 4px rgba(212,149,42,0.20)",
  btnViolet: "0 4px 18px rgba(114,100,214,0.34), 0 1px 4px rgba(114,100,214,0.20)",

  // Accent-Glow (dynamisch)
  glow: (hex, strength = 0.36) =>
    `0 4px 18px ${hex}${Math.round(strength * 255).toString(16).padStart(2,"0")}, 0 1px 4px ${hex}${Math.round(strength * 0.65 * 255).toString(16).padStart(2,"0")}`,

  // Pressed/Active States
  pressed: (hex) => `0 0 0 2.5px ${hex}40`,

  // Ambient light im Hero
  ambient: "0 20px 80px rgba(0,0,0,0.06)",
};

// ─────────────────────────────────────────────────────────────────
//  TYPOGRAFIE-SYSTEM
// ─────────────────────────────────────────────────────────────────

const FONT = {
  // Font-Stack — systembasiert, kein FOUT
  family: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
  familyMono: "'SF Mono', 'Fira Code', monospace",

  // Display / Hero Headlines — cinematic, groß
  displayXl: { fontSize: 48, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.04 },
  displayLg: { fontSize: 40, fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.06 },
  displayMd: { fontSize: 34, fontWeight: 900, letterSpacing: "-0.03em",  lineHeight: 1.08 },
  displaySm: { fontSize: 28, fontWeight: 900, letterSpacing: "-0.026em", lineHeight: 1.10 },

  // Seiten-Headlines
  h1: { fontSize: 24, fontWeight: 820, letterSpacing: "-0.022em", lineHeight: 1.18 },
  h2: { fontSize: 20, fontWeight: 800, letterSpacing: "-0.018em", lineHeight: 1.22 },
  h3: { fontSize: 17, fontWeight: 760, letterSpacing: "-0.014em", lineHeight: 1.26 },
  h4: { fontSize: 15, fontWeight: 720, letterSpacing: "-0.010em", lineHeight: 1.30 },

  // Body — ruhig, hochlesbar
  bodyLg: { fontSize: 16, fontWeight: 400, letterSpacing: "-0.010em", lineHeight: 1.78 },
  body:   { fontSize: 14, fontWeight: 400, letterSpacing: "-0.008em", lineHeight: 1.72 },
  bodySm: { fontSize: 13, fontWeight: 400, letterSpacing: "-0.006em", lineHeight: 1.68 },
  bodyXs: { fontSize: 12, fontWeight: 400, letterSpacing: "-0.004em", lineHeight: 1.60 },

  // Labels / UI — präzise, leise
  labelLg: { fontSize: 12, fontWeight: 650, letterSpacing: "-0.003em", lineHeight: 1.40 },
  label:   { fontSize: 11, fontWeight: 620, letterSpacing:  "0.000em", lineHeight: 1.35 },
  labelSm: { fontSize: 10, fontWeight: 700, letterSpacing:  "0.020em", lineHeight: 1.30 },

  // Caps — Labels, Kategorie-Badges
  caps:    { fontSize: 10, fontWeight: 800, letterSpacing: "0.120em",  lineHeight: 1.20, textTransform: "uppercase" },
  capsSm:  { fontSize:  9, fontWeight: 800, letterSpacing: "0.140em",  lineHeight: 1.20, textTransform: "uppercase" },

  // Numerisch — Pool-Beträge, Statistiken
  numXl:   { fontSize: 44, fontWeight: 900, letterSpacing: "-0.05em",  lineHeight: 1.00 },
  numLg:   { fontSize: 32, fontWeight: 900, letterSpacing: "-0.04em",  lineHeight: 1.00 },
  numMd:   { fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em",  lineHeight: 1.00 },
  numSm:   { fontSize: 19, fontWeight: 900, letterSpacing: "-0.025em", lineHeight: 1.00 },
};

// ─────────────────────────────────────────────────────────────────
//  SPACING-SYSTEM — 4px Basis-Grid
// ─────────────────────────────────────────────────────────────────

const SPACE = {
  // Basis
  1:   4,    // 4px
  2:   8,    // 8px
  3:   12,   // 12px
  4:   16,   // 16px
  5:   20,   // 20px
  6:   24,   // 24px
  7:   28,   // 28px
  8:   32,   // 32px
  9:   36,   // 36px
  10:  40,   // 40px
  12:  48,   // 48px
  14:  56,   // 56px
  16:  64,   // 64px
  20:  80,   // 80px

  // Semantisch
  pagePadding:   18,   // Standard Seiten-Padding (horizontal)
  pagePaddingLg: 24,   // Größeres Padding für Hero
  cardPadding:   20,   // Standard Card-Innenabstand
  cardPaddingLg: 24,   // Großer Card-Innenabstand
  sectionGap:    28,   // Vertikal zwischen Sektionen
  cardGap:       18,   // Vertikal zwischen Cards im Feed
  itemGap:       12,   // Vertikal zwischen Elementen in Cards
  heroTop:       56,   // Oberer Abstand im Hero
  feedBottom:   128,   // Bottom-Padding für Nav-Bar-Überschneidung
};

// ─────────────────────────────────────────────────────────────────
//  BORDER-RADIUS-SYSTEM
// ─────────────────────────────────────────────────────────────────

const RADIUS = {
  xs:   8,    // Kleine Elemente — Tags, Chips
  sm:   12,   // Standard Inputs, kleine Cards
  md:   18,   // Standard Cards
  lg:   24,   // Große Cards
  xl:   28,   // Hero-Cards, Premium Cards
  xxl:  34,   // Sheet-Dialoge, Overlays
  pill: 999,  // Badges, Buttons
};

// ─────────────────────────────────────────────────────────────────
//  MOTION-SYSTEM — organisch, ruhig, menschlich
// ─────────────────────────────────────────────────────────────────

const MOTION = {
  // Durations
  instant:   "100ms",
  fast:      "160ms",
  normal:    "220ms",
  calm:      "320ms",
  slow:      "500ms",
  cinematic: "800ms",

  // Easing
  ease:      "ease",
  easeOut:   "cubic-bezier(0.16, 1, 0.3, 1)",          // Sanft auslaufen
  easeIn:    "cubic-bezier(0.4, 0, 1, 1)",              // Sanft einlaufen
  spring:    "cubic-bezier(0.34, 1.56, 0.64, 1)",       // Organischer Spring
  springCalm:"cubic-bezier(0.22, 1.0,  0.36, 1)",       // Ruhigerer Spring
  gentle:    "cubic-bezier(0.25, 0.46, 0.45, 0.94)",    // Sehr sanft

  // Standard-Transitions (als String direkt nutzbar)
  cardHover:    "transform 0.20s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.20s ease, border-color 0.20s ease",
  buttonHover:  "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
  opacityFade:  "opacity 0.28s ease, transform 0.28s ease",
  colorShift:   "color 0.18s ease, background 0.18s ease",

  // Card-Touch-Scale
  pressScale:  "scale(0.982)",
  idleScale:   "scale(1)",
};

// ─────────────────────────────────────────────────────────────────
//  GRADIENT-SYSTEM — atmosphärische Welten
// ─────────────────────────────────────────────────────────────────

const GRADIENT = {
  // Brand-Hauptgradient
  brand:  `linear-gradient(135deg, ${COLOR.teal} 0%, ${COLOR.coral} 100%)`,
  brandV: `linear-gradient(175deg, ${COLOR.teal} 0%, ${COLOR.coral} 100%)`,

  // Warmes Hero-Fundament
  hero: `
    radial-gradient(ellipse 120% 75% at 85% 25%, rgba(240,196,106,0.20) 0%, transparent 52%),
    radial-gradient(ellipse 75%  75% at  8% 12%, rgba(244,113,85,0.12)  0%, transparent 48%),
    radial-gradient(ellipse 55%  55% at 50% 95%, rgba(13,196,181,0.10)  0%, transparent 52%),
    linear-gradient(175deg, #FCF0DF 0%, #F7EBDA 40%, #F2E5D0 100%)
  `,

  // Section-Atmung — sehr subtil
  tealAmbient:   `radial-gradient(ellipse 80% 60% at 50% 50%, rgba(13,196,181,0.08) 0%, transparent 70%)`,
  coralAmbient:  `radial-gradient(ellipse 80% 60% at 50% 50%, rgba(244,115,85,0.07) 0%, transparent 70%)`,
  goldAmbient:   `radial-gradient(ellipse 80% 60% at 50% 50%, rgba(212,149,42,0.08) 0%, transparent 70%)`,

  // Seitenränder — von Brand zu Transparent
  fadeDown:  "linear-gradient(to bottom, rgba(13,196,181,0.06) 0%, transparent 100%)",
  fadeUp:    "linear-gradient(to top,   rgba(13,196,181,0.06) 0%, transparent 100%)",

  // Image-Overlays
  imgBottomFade: (base = "#FFFFFF") =>
    `linear-gradient(to top, ${base} 0%, rgba(255,255,255,0.80) 45%, transparent 100%)`,
  imgTopFade:
    "linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, transparent 100%)",
  imgLeftFade: (base = "#FAF7F2") =>
    `linear-gradient(to right, ${base} 0%, rgba(250,247,242,0.88) 12%, rgba(250,247,242,0.52) 35%, transparent 75%)`,
};

// ─────────────────────────────────────────────────────────────────
//  ANIMATION-KEYFRAMES — als CSS-String
//  Einbinden: <style>{HUI.KEYFRAMES}</style>  einmalig pro Seite
// ─────────────────────────────────────────────────────────────────

const KEYFRAMES = `
  @keyframes hui-pulse {
    0%,100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.28; transform: scale(0.62); }
  }
  @keyframes hui-fadein {
    from { opacity: 0; transform: translateY(7px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes hui-float {
    0%,100% { transform: translateY(0) rotate(-1deg); }
    50%     { transform: translateY(-9px) rotate(2deg); }
  }
  @keyframes hui-floatB {
    0%,100% { transform: translateY(0) rotate(1deg); }
    50%     { transform: translateY(-6px) rotate(-2deg); }
  }
  @keyframes hui-shimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(230%); }
  }
  @keyframes hui-breathe {
    0%,100% { transform: scale(1) rotate(0deg); }
    50%     { transform: scale(1.06) rotate(0.8deg); }
  }
  @keyframes hui-glow {
    0%,100% { opacity: 0.45; }
    50%     { opacity: 1.00; }
  }
  @keyframes hui-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes hui-slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

// ─────────────────────────────────────────────────────────────────
//  COMPONENT PRESETS — fertige Style-Objekte für häufige Muster
// ─────────────────────────────────────────────────────────────────

const PRESET = {

  // ── PAGE ROOT ──────────────────────────────────────────────────
  page: {
    width:         "100%",
    minHeight:     "100svh",
    background:    COLOR.cream,
    fontFamily:    FONT.family,
    paddingBottom: SPACE.feedBottom,
    overflowX:     "hidden",
  },

  // ── CARDS ──────────────────────────────────────────────────────
  card: {
    background:   COLOR.creamSoft,
    borderRadius: RADIUS.lg,
    boxShadow:    SHADOW.sm,
    border:       `1px solid rgba(0,0,0,0.048)`,
    overflow:     "hidden",
  },
  cardRaised: {
    background:   COLOR.white,
    borderRadius: RADIUS.xl,
    boxShadow:    SHADOW.md,
    border:       `1px solid rgba(0,0,0,0.042)`,
    overflow:     "hidden",
  },
  cardGlass: {
    background:      SURFACE.glass,
    backdropFilter:  SURFACE.glassFilter,
    borderRadius:    RADIUS.xl,
    boxShadow:       SHADOW.glass,
    border:          "1px solid rgba(255,252,248,0.98)",
    overflow:        "hidden",
  },

  // ── BUTTONS ────────────────────────────────────────────────────
  btnPrimary: {
    display:      "inline-flex",
    alignItems:   "center",
    gap:           8,
    padding:      "12px 22px",
    borderRadius: RADIUS.pill,
    border:       "none",
    background:   `linear-gradient(135deg, ${COLOR.teal} 0%, ${COLOR.tealLight} 100%)`,
    color:        "#fff",
    fontSize:     13,
    fontWeight:   700,
    cursor:       "pointer",
    fontFamily:   FONT.family,
    letterSpacing:"-0.010em",
    boxShadow:    SHADOW.btnTeal,
    transition:   MOTION.buttonHover,
  },
  btnCoral: {
    display:      "inline-flex",
    alignItems:   "center",
    gap:           8,
    padding:      "12px 22px",
    borderRadius: RADIUS.pill,
    border:       "none",
    background:   `linear-gradient(135deg, ${COLOR.coral} 0%, ${COLOR.coralLight} 100%)`,
    color:        "#fff",
    fontSize:     13,
    fontWeight:   700,
    cursor:       "pointer",
    fontFamily:   FONT.family,
    letterSpacing:"-0.010em",
    boxShadow:    SHADOW.btnCoral,
    transition:   MOTION.buttonHover,
  },
  btnGhost: (accent) => ({
    display:      "inline-flex",
    alignItems:   "center",
    gap:           8,
    padding:      "11px 22px",
    borderRadius: RADIUS.pill,
    border:       `1.5px solid ${accent}45`,
    background:   `${accent}10`,
    color:        accent,
    fontSize:     13,
    fontWeight:   700,
    cursor:       "pointer",
    fontFamily:   FONT.family,
    letterSpacing:"-0.010em",
    transition:   MOTION.buttonHover,
  }),
  btnFullWidth: (accent, voted = false) => ({
    width:        "100%",
    padding:      "12px 0",
    borderRadius: RADIUS.md,
    border:       voted ? `1.5px solid ${accent}35` : "none",
    background:   voted
      ? "transparent"
      : `linear-gradient(135deg, ${accent} 0%, ${accent}DD 100%)`,
    color:        voted ? accent : "#fff",
    fontSize:     13,
    fontWeight:   700,
    cursor:       voted ? "default" : "pointer",
    fontFamily:   FONT.family,
    letterSpacing:"-0.010em",
    boxShadow:    voted ? "none" : SHADOW.glow(accent, 0.36),
    transition:   "all 0.24s ease",
    display:      "flex",
    alignItems:   "center",
    justifyContent:"center",
    gap:           8,
  }),

  // ── TAGS / BADGES ──────────────────────────────────────────────
  tag: (accent) => ({
    fontSize:     10,
    padding:      "4px 11px",
    borderRadius: RADIUS.pill,
    background:   `${accent}10`,
    border:       `1px solid ${accent}22`,
    color:        accent,
    fontWeight:   700,
    letterSpacing:"-0.005em",
    display:      "inline-block",
  }),
  badgePill: (accent) => ({
    display:      "inline-flex",
    alignItems:   "center",
    gap:           6,
    background:   `${accent}11`,
    border:       `1px solid ${accent}26`,
    borderRadius: RADIUS.pill,
    padding:      "5px 14px",
    backdropFilter: SURFACE.glassLightFilter,
  }),

  // ── SECTION HEADER ─────────────────────────────────────────────
  sectionHeader: {
    display:        "flex",
    alignItems:     "flex-end",
    justifyContent: "space-between",
    marginBottom:   SPACE.sectionGap - 4,
    paddingTop:     SPACE[2],
  },
  sectionTitle: {
    fontSize:      23,
    fontWeight:    900,
    color:         COLOR.ink,
    letterSpacing: "-0.028em",
    lineHeight:    1,
  },
  sectionSub: {
    fontSize:      13,
    color:         COLOR.muted,
    marginTop:     5,
    fontWeight:    480,
    letterSpacing: "-0.008em",
  },

  // ── AVATAR STACK ───────────────────────────────────────────────
  avatar: (size = 28, overlap = -9) => ({
    width:       size,
    height:      size,
    borderRadius:"50%",
    border:      "2.5px solid #fff",
    marginLeft:  overlap,
    objectFit:   "cover",
    boxShadow:   "0 1px 5px rgba(0,0,0,0.10)",
  }),

  // ── DIVIDER ────────────────────────────────────────────────────
  divider: {
    height:     1,
    margin:     `${SPACE[4]}px 0`,
    background: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.06) 75%, transparent 100%)",
  },

  // ── LABEL PILL (Live / Status) ─────────────────────────────────
  labelPill: (accent) => ({
    display:     "inline-flex",
    alignItems:  "center",
    gap:          8,
    background:  `rgba(${_hexToRgb(accent)},0.10)`,
    border:      `1px solid rgba(${_hexToRgb(accent)},0.24)`,
    borderRadius: RADIUS.pill,
    padding:     "6px 14px",
    backdropFilter: "blur(10px)",
  }),

  // ── GLASSMORPHISM CARD (Pool, Stats) ───────────────────────────
  glassCard: {
    background:      SURFACE.glassMid,
    backdropFilter:  SURFACE.glassFilter,
    borderRadius:    RADIUS.xl,
    padding:         `${SPACE.cardPaddingLg}px ${SPACE.cardPadding}px`,
    boxShadow:       SHADOW.glass,
    border:          "1px solid rgba(255,252,248,0.98)",
  },

  // ── SKELETON ───────────────────────────────────────────────────
  skeleton: (h = 200, r = RADIUS.xl, delay = "0s") => ({
    background:   COLOR.white,
    borderRadius: r,
    height:       h,
    marginBottom: SPACE.cardGap,
    border:       `1px solid rgba(0,0,0,0.042)`,
    overflow:     "hidden",
    position:     "relative",
    boxShadow:    SHADOW.sm,
    // Shimmer-Animation via Pseudo-Element — muss per <style> gesetzt werden
  }),
};

// ─────────────────────────────────────────────────────────────────
//  HILFSFUNKTIONEN
// ─────────────────────────────────────────────────────────────────

// Hex → "r,g,b" für rgba() Konstruktion
function _hexToRgb(hex) {
  const clean = hex.replace("#","");
  const r = parseInt(clean.slice(0,2),16);
  const g = parseInt(clean.slice(2,4),16);
  const b = parseInt(clean.slice(4,6),16);
  return `${r},${g},${b}`;
}

// Accent-Glow dynamisch erzeugen
function accentGlow(hex, strength = 0.36) {
  return SHADOW.glow(hex, strength);
}

// Segment-Bar für Pool-Verteilung
const POOL_SEGMENTS = [
  { pct:40, label:"40% Community", color:COLOR.teal,   gradStop:COLOR.tealLight  },
  { pct:30, label:"30% Wirkung",   color:COLOR.coral,  gradStop:COLOR.coralLight },
  { pct:20, label:"20% Kuration",  color:COLOR.violet, gradStop:"#9488E8"        },
  { pct:10, label:"10% Innovation",color:COLOR.gold,   gradStop:COLOR.goldLight  },
];

// ─────────────────────────────────────────────────────────────────
//  HAUPT-EXPORT
// ─────────────────────────────────────────────────────────────────

export const HUI = {
  COLOR,
  SURFACE,
  SHADOW,
  FONT,
  SPACE,
  RADIUS,
  MOTION,
  GRADIENT,
  KEYFRAMES,
  PRESET,
  POOL_SEGMENTS,
  accentGlow,
};

// Convenience-Exports für häufigen Direktzugriff
export const C  = COLOR;
export const Sh = SHADOW;
export const Sp = SPACE;
export const R  = RADIUS;
export const M  = MOTION;
export const G  = GRADIENT;
export const F  = FONT;
