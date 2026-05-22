// worldPolish.js — HUI World Polish Utilities v1
//
// Shared token-computation helpers used by Orb, Profile, Discover,
// EmptyState and transitions.  No intelligence logic here — just
// the "last mile" conversion from a WorldState (or raw atmosphere)
// into concrete CSS / animation values ready for any React component.
//
// Rules:
//   • Pure functions — no side-effects, no imports from heavy modules
//   • Every function is null-safe and returns a usable value always
//   • Max effect on any visual token: ±10% — enforced by clamp()
//   • SSR-safe — no window, document, or browser-API calls
// ──────────────────────────────────────────────────────────────────

const clamp = (v, lo, hi) => {
  const n = Number(v);
  return (isNaN(n) || !isFinite(n)) ? lo : Math.min(Math.max(n, lo), hi);
};
const lerp = (a, b, t) => a + (b - a) * clamp(t, 0, 1);

// ═══════════════════════════════════════════════════════════════
// 1. ORB ATMOSPHERE TOKENS
//    Converts world temperature → Orb pulse / ring / glow tokens
// ═══════════════════════════════════════════════════════════════

/**
 * Returns Orb visual tokens derived from world continuity state.
 * Safe to call with null (returns neutral defaults).
 *
 * @param {WorldState | null} worldState
 * @returns {OrbAtmosphereTokens}
 */
export function orbAtmosphereFromWorld(worldState) {
  const temp = worldState?.temperature?.id ?? "calm_flowing";
  const orb  = worldState?.orb ?? {};

  // Glow color tinted by world temperature
  const glowTint = {
    warm_creative:  "#F5A623",   // gold
    quiet_deep:     "#8B96B5",   // lavender
    night_still:    "#6B82C4",   // indigo
    human_warm:     "#FF8A6B",   // coral
    inspired_clear: "#16D7C5",   // teal (default HUI)
    soft_emerging:  "#7CC8A0",   // sage
    calm_flowing:   "#16D7C5",   // teal
  }[temp] ?? "#16D7C5";

  // Breath duration — slower in deep/night temperatures
  const baseDuration = {
    warm_creative:  4.2,
    quiet_deep:     6.8,
    night_still:    9.0,
    human_warm:     3.8,
    inspired_clear: 4.5,
    soft_emerging:  5.5,
    calm_flowing:   5.0,
  }[temp] ?? 5.0;

  // Ring pulse period — outer rings breathe slower
  const ringPeriod1 = baseDuration * 0.88;
  const ringPeriod2 = baseDuration * 1.25;
  const ringPeriod3 = baseDuration * 1.60;

  // Glow intensity — world glow scale applied
  const glowScale = clamp(orb.glowScale ?? 1.0, 0.70, 1.15);

  // Blob drift timing — atmosphere blobs drift in world rhythm
  const blobPeriodA = Math.round(lerp(12, 22, clamp(baseDuration / 9, 0, 1)));
  const blobPeriodB = Math.round(blobPeriodA * 1.35);
  const blobPeriodC = Math.round(blobPeriodA * 1.68);

  return Object.freeze({
    glowTint,
    breathDuration:   `${baseDuration.toFixed(1)}s`,
    ringPeriod1:      `${ringPeriod1.toFixed(1)}s`,
    ringPeriod2:      `${ringPeriod2.toFixed(1)}s`,
    ringPeriod3:      `${ringPeriod3.toFixed(1)}s`,
    blobPeriodA:      `${blobPeriodA}s`,
    blobPeriodB:      `${blobPeriodB}s`,
    blobPeriodC:      `${blobPeriodC}s`,
    glowScale,
    // Ring opacity — deeper world = more visible rings (sense of depth)
    ringOpacity1:     clamp(0.10 + (orb.orbDepth ?? 0.42) * 0.08, 0.08, 0.22),
    ringOpacity2:     clamp(0.05 + (orb.orbDepth ?? 0.42) * 0.05, 0.04, 0.12),
    ringOpacity3:     clamp(0.03 + (orb.orbDepth ?? 0.42) * 0.03, 0.02, 0.07),
    // Warmth tint for blob backgrounds
    warmthAlpha:      clamp(0.07 + (orb.orbWarmth ?? 0.42) * 0.04, 0.05, 0.13),
    // CSS animation override strings (empty = use default)
    breathAnim:       `orbBreath ${baseDuration.toFixed(1)}s ease-in-out infinite`,
    ring1Anim:        `orbRingPulse ${ringPeriod1.toFixed(1)}s ease-in-out infinite`,
    ring2Anim:        `orbRingPulse2 ${ringPeriod2.toFixed(1)}s ease-in-out 1s infinite`,
    ring3Anim:        `orbRingPulse2 ${ringPeriod3.toFixed(1)}s ease-in-out 2s infinite`,
    blobAnimA:        `orbBlobA ${blobPeriodA}s ease-in-out infinite`,
    blobAnimB:        `orbBlobB ${blobPeriodB}s ease-in-out 2s infinite`,
    blobAnimC:        `orbBlobC ${blobPeriodC}s ease-in-out 5s infinite`,
  });
}

// ═══════════════════════════════════════════════════════════════
// 2. PROFILE ATMOSPHERE TOKENS
//    Converts world temperature + creator identity → profile atmosphere
// ═══════════════════════════════════════════════════════════════

/**
 * Returns atmospheric styling tokens for profile pages (Atelier feeling).
 *
 * @param {WorldState | null}  worldState
 * @param {ProfileItem | null} profile     — normalized createProfileItem output
 * @returns {ProfileAtmosphereTokens}
 */
export function profileAtmosphereFromWorld(worldState, profile) {
  const temp = worldState?.temperature?.id ?? "calm_flowing";
  const ws   = worldState?.profiles ?? {};

  // Hero gradient — always feels like the creator's personal space
  const heroGradients = {
    warm_creative:  "linear-gradient(160deg, rgba(252,248,240,1) 0%, rgba(248,242,230,1) 100%)",
    quiet_deep:     "linear-gradient(160deg, rgba(240,244,248,1) 0%, rgba(234,240,246,1) 100%)",
    night_still:    "linear-gradient(160deg, rgba(22,28,48,1)    0%, rgba(16,20,40,1)    100%)",
    human_warm:     "linear-gradient(160deg, rgba(255,252,248,1) 0%, rgba(253,246,240,1) 100%)",
    inspired_clear: "linear-gradient(160deg, rgba(244,252,252,1) 0%, rgba(236,250,250,1) 100%)",
    soft_emerging:  "linear-gradient(160deg, rgba(244,250,246,1) 0%, rgba(238,248,242,1) 100%)",
    calm_flowing:   "linear-gradient(160deg, rgba(252,250,248,1) 0%, rgba(248,246,242,1) 100%)",
  }[temp] ?? "linear-gradient(160deg, rgba(252,250,248,1) 0%, rgba(248,246,242,1) 100%)";

  // Avatar ring glow — world temperature accent
  const avatarRingColors = {
    warm_creative:  "#F5A623",
    quiet_deep:     "#8B96B5",
    night_still:    "#6B82C4",
    human_warm:     "#FF8A6B",
    inspired_clear: "#16D7C5",
    soft_emerging:  "#7CC8A0",
    calm_flowing:   "#16D7C5",
  };
  const avatarRingColor = avatarRingColors[temp] ?? "#16D7C5";

  // Card surface tint — very subtle warmth from world
  const warmthNudge = clamp(ws.warmthNudge ?? 0, -0.08, 0.08);
  const baseAlpha   = clamp(0.04 + warmthNudge * 0.3, 0.02, 0.08);

  // Motion — profiles move gently with world breath
  const motionScale = clamp(ws.motionScale ?? 0.92, 0.70, 1.05);
  const staggerBase = Math.round(lerp(48, 72, 1 - motionScale));

  // Presence badge — day/night aware
  const presenceBgDark = temp === "night_still";

  return Object.freeze({
    heroGradient: heroGradients[temp] ?? heroGradients.calm_flowing,
    avatarRingColor,
    avatarRingShadow: `0 0 0 3px ${avatarRingColor}28, 0 0 16px ${avatarRingColor}18`,
    cardSurfaceTint:  `rgba(${avatarRingColor.replace("#","").match(/.{2}/g).map(h=>parseInt(h,16)).join(",")},${baseAlpha})`,
    motionScale,
    staggerBase,
    presenceBgDark,
    glowScale: clamp(ws.glowScale ?? 1.0, 0.80, 1.12),
    // Ambient field — the "glow in the corner" of the atelier
    ambientGlow: `radial-gradient(ellipse at 80% 20%, ${avatarRingColor}0A 0%, transparent 60%)`,
    // Separator opacity — quieter in deep/night temperatures
    separatorOpacity: temp === "night_still" ? 0.06
      : temp === "quiet_deep"  ? 0.07 : 0.09,
    // Float period for avatar — breathes with world
    avatarFloatPeriod: worldState?.orb?.breathDuration
      ?? (worldState?.breath?.period ?? "16s"),
  });
}

// ═══════════════════════════════════════════════════════════════
// 3. DISCOVER DISTRICT TRANSITION TOKENS
//    Makes scrolling/swiping between districts feel geographical
// ═══════════════════════════════════════════════════════════════

/**
 * Returns CSS transition tokens for moving from one district to another.
 * Used by DiscoverPage when activeCategory changes.
 *
 * @param {string}       fromDistrictId
 * @param {string}       toDistrictId
 * @param {WorldState}   worldState
 * @returns {DistrictTransitionTokens}
 */
export function districtTransitionTokens(fromDistrictId, toDistrictId, worldState) {
  const breath = worldState?.breath ?? {};
  const speed  = clamp(breath.motionScale ?? 0.92, 0.60, 1.10);

  // Transition duration: slower world = more cinematic district change
  const durationMs = Math.round(lerp(320, 680, 1 - speed));

  // Easing — from the world breath
  const ease = breath.ease ?? "cubic-bezier(0.22,1,0.36,1)";

  // Cross-fade opacity during district change
  const fadeOpacity = 0;

  return Object.freeze({
    durationMs,
    ease,
    fadeOpacity,
    // Section reveal stagger — inherits from world breath
    sectionStagger: breath.staggerBase ?? 55,
    // Card scale during entry — quieter world = subtler entry
    entryScale:     clamp(0.97 + speed * 0.02, 0.96, 1.0),
    // Blur during district change (very brief — just enough to signal movement)
    transitionFilter: `blur(${clamp(2 - speed, 0.5, 2).toFixed(1)}px)`,
  });
}

// ═══════════════════════════════════════════════════════════════
// 4. EMPTY STATE TOKENS
//    Intentional breathing emptiness — never "broken" feeling
// ═══════════════════════════════════════════════════════════════

/**
 * Returns atmospheric tokens for empty states.
 * Every empty area should feel intentional and alive.
 *
 * @param {WorldState | null} worldState
 * @param {'feed'|'discover'|'profile'|'spaces'} context
 * @returns {EmptyStateTokens}
 */
export function emptyStateFromWorld(worldState, context = "feed") {
  const temp   = worldState?.temperature?.id ?? "calm_flowing";
  const breath = worldState?.breath ?? {};

  const bgGradients = {
    feed:     "linear-gradient(180deg, rgba(252,250,248,0) 0%, rgba(248,246,242,0.6) 100%)",
    discover: "linear-gradient(160deg, rgba(248,252,252,0) 0%, rgba(240,250,250,0.5) 100%)",
    profile:  "linear-gradient(180deg, rgba(252,250,248,0) 0%, rgba(248,246,242,0.5) 100%)",
    spaces:   "linear-gradient(160deg, rgba(240,244,252,0) 0%, rgba(235,240,252,0.6) 100%)",
  };

  // Accent glows by temperature
  const accentGlows = {
    warm_creative:  "rgba(245,166,35,0.06)",
    quiet_deep:     "rgba(139,150,181,0.06)",
    night_still:    "rgba(107,130,196,0.08)",
    human_warm:     "rgba(255,138,107,0.06)",
    inspired_clear: "rgba(22,215,197,0.07)",
    soft_emerging:  "rgba(124,200,160,0.06)",
    calm_flowing:   "rgba(22,215,197,0.05)",
  };

  // Copy text — minimal, atmospheric, never apologetic
  const emptyText = {
    feed:     "Hier entsteht gerade Stille.",
    discover: "Diese Welt wartet auf Wanderer.",
    profile:  "Noch keine Werke — aber der Raum ist bereit.",
    spaces:   "Noch kein Raum erwacht.",
  };
  const emptySubText = {
    feed:     "Neue Begegnungen kommen in ihrem eigenen Rhythmus.",
    discover: "Kehre später zurück — die Welt verändert sich.",
    profile:  "Schöpfungen erscheinen hier wenn sie entstehen.",
    spaces:   "Resonanz braucht Zeit um sich zu formen.",
  };

  return Object.freeze({
    bgGradient:  bgGradients[context] ?? bgGradients.feed,
    accentGlow:  accentGlows[temp]   ?? accentGlows.calm_flowing,
    floatPeriod: breath.period       ?? "16s",
    text:        emptyText[context]  ?? emptyText.feed,
    subText:     emptySubText[context] ?? emptySubText.feed,
    iconOpacity: 0.28,
    // Empty states breathe very slowly — intentional stillness
    breathScale: clamp((breath.motionScale ?? 0.92) * 0.70, 0.50, 0.80),
  });
}

// ═══════════════════════════════════════════════════════════════
// 5. MOTION HARMONIZATION
//    All surfaces share a single motion vocabulary
// ═══════════════════════════════════════════════════════════════

/**
 * Harmonized animation durations for a given surface.
 * Call this instead of hard-coding 0.3s / 0.5s everywhere.
 *
 * @param {WorldState | null} worldState
 * @param {'feed'|'discover'|'profiles'|'orb'|'spaces'} surface
 * @returns {MotionTokens}
 */
export function harmonizedMotion(worldState, surface = "feed") {
  const breath = worldState?.breath ?? {};
  const ws     = worldState?.[surface] ?? {};
  const scale  = clamp(ws.motionScale ?? breath.motionScale ?? 0.92, 0.60, 1.10);

  // Base durations — everything scales with world rhythm
  const micro   = Math.round(lerp(140, 100, scale - 0.60));  // 100–140ms  quick
  const short_  = Math.round(lerp(340, 220, scale - 0.60));  // 220–340ms  standard
  const medium  = Math.round(lerp(560, 360, scale - 0.60));  // 360–560ms  deliberate
  const long_   = Math.round(lerp(900, 560, scale - 0.60));  // 560–900ms  cinematic
  const xlong   = Math.round(lerp(1400,860, scale - 0.60));  // 860-1400ms  world

  const ease      = breath.ease ?? "cubic-bezier(0.22,1,0.36,1)";
  const easeDeep  = "cubic-bezier(0.15,1,0.22,1)";          // for deeper elements
  const easeEntry = "cubic-bezier(0.18,1,0.30,1)";          // card entries
  const stagger   = breath.staggerBase ?? 55;

  return Object.freeze({
    micro:    `${micro}ms`,
    short:    `${short_}ms`,
    medium:   `${medium}ms`,
    long:     `${long_}ms`,
    xlong:    `${xlong}ms`,
    ease,
    easeDeep,
    easeEntry,
    stagger,
    breathPeriod: ws.breathPeriod ?? breath.period ?? "16s",
    scale,
  });
}

// ═══════════════════════════════════════════════════════════════
// 6. ATMOSPHERIC SETTINGS TOKENS
//    Even utility screens breathe with the world
// ═══════════════════════════════════════════════════════════════

/**
 * Tokens for settings / permission / help screens.
 * Removes sterile utility feeling without adding visual noise.
 *
 * @param {WorldState | null} worldState
 * @returns {SettingsAtmosphereTokens}
 */
export function settingsAtmosphereFromWorld(worldState) {
  const temp   = worldState?.temperature?.id ?? "calm_flowing";
  const ws     = worldState?.profiles ?? {};  // settings use profile surface

  const bgGradients = {
    warm_creative:  "linear-gradient(180deg, rgba(255,252,248,1) 0%, rgba(252,249,244,1) 100%)",
    quiet_deep:     "linear-gradient(180deg, rgba(248,250,254,1) 0%, rgba(244,248,253,1) 100%)",
    night_still:    "linear-gradient(180deg, rgba(24,30,50,1)    0%, rgba(18,24,42,1)    100%)",
    human_warm:     "linear-gradient(180deg, rgba(255,252,250,1) 0%, rgba(253,250,246,1) 100%)",
    inspired_clear: "linear-gradient(180deg, rgba(248,254,254,1) 0%, rgba(244,252,252,1) 100%)",
    soft_emerging:  "linear-gradient(180deg, rgba(248,252,250,1) 0%, rgba(244,250,248,1) 100%)",
    calm_flowing:   "linear-gradient(180deg, rgba(254,252,250,1) 0%, rgba(252,250,248,1) 100%)",
  };

  const rowBg = temp === "night_still"
    ? "rgba(255,255,255,0.06)"
    : "rgba(255,255,255,0.72)";
  const rowBorder = temp === "night_still"
    ? "rgba(255,255,255,0.08)"
    : "rgba(0,0,0,0.05)";
  const labelColor = temp === "night_still"
    ? "rgba(220,228,255,0.82)"
    : "rgba(30,30,30,0.80)";
  const mutedColor = temp === "night_still"
    ? "rgba(180,190,220,0.50)"
    : "rgba(80,80,80,0.48)";
  const separatorColor = temp === "night_still"
    ? "rgba(255,255,255,0.05)"
    : "rgba(0,0,0,0.045)";

  // Section headers — soft, not sterile
  const sectionHeaderSize   = 11;
  const sectionHeaderWeight = 600;
  const sectionHeaderColor  = temp === "night_still"
    ? "rgba(22,215,197,0.70)"
    : "rgba(22,215,197,0.80)";

  return Object.freeze({
    bgGradient:        bgGradients[temp] ?? bgGradients.calm_flowing,
    rowBg,
    rowBorder,
    rowRadius:         16,
    rowShadow:         `0 1px 8px rgba(0,0,0,${temp==="night_still"?0.24:0.04})`,
    labelColor,
    mutedColor,
    separatorColor,
    sectionHeaderSize,
    sectionHeaderWeight,
    sectionHeaderColor,
    // Motion — settings pages are calm, not reactive
    transitionMs:      220,
    transitionEase:    "cubic-bezier(0.22,1,0.36,1)",
    // Ambient — very subtle corner glow
    ambientGlow: temp === "night_still"
      ? "radial-gradient(ellipse at 100% 0%, rgba(22,215,197,0.04) 0%, transparent 50%)"
      : "radial-gradient(ellipse at 100% 0%, rgba(22,215,197,0.03) 0%, transparent 50%)",
  });
}

// ═══════════════════════════════════════════════════════════════
// 7. WORLD SOUNDLESSNESS — noise reduction helpers
//    Protect the user's sense of stillness
// ═══════════════════════════════════════════════════════════════

/**
 * Returns badge/notification visual tokens that preserve quietness.
 * Badges should never feel aggressive — just informative.
 *
 * @param {WorldState | null} worldState
 * @returns {QuietNotificationTokens}
 */
export function quietNotificationTokens(worldState) {
  const temp = worldState?.temperature?.id ?? "calm_flowing";

  // Night/quiet temperatures → even quieter badges
  const isDeep = temp === "night_still" || temp === "quiet_deep";

  return Object.freeze({
    badgeBg:       isDeep ? "rgba(22,215,197,0.80)"  : "#16D7C5",
    badgeColor:    "#fff",
    badgeFontSize: 10,
    badgeRadius:   50,
    badgePadding:  "2px 6px",
    // No animation on badges — stillness
    badgeAnimation:"none",
    // Dot indicators — barely visible
    dotSize:       5,
    dotOpacity:    isDeep ? 0.55 : 0.70,
    dotColor:      isDeep ? "#8B96B5" : "#16D7C5",
  });
}

// ═══════════════════════════════════════════════════════════════
// 8. CARRY-OVER TRANSITION CSS
//    Generates inline style for a page entering after a tab switch
// ═══════════════════════════════════════════════════════════════

/**
 * Returns an inline `style` object to apply to a page container
 * when it becomes visible after a tab transition.
 * The entering page inherits subtle warmth from the leaving surface.
 *
 * @param {{ warmthCarry: number, motionCarry: number, transitionMs: number, transitionEase: string } | null} carryOver
 * @returns {React.CSSProperties}
 */
export function carryOverEntryStyle(carryOver) {
  if (!carryOver) return {};
  const warm = clamp(carryOver.warmthCarry ?? 0, -0.08, 0.08);
  const mot  = clamp(carryOver.motionCarry ?? 0, -0.08, 0.08);
  const ms   = Math.round(clamp(carryOver.transitionMs ?? 400, 200, 800));
  const ease = carryOver.transitionEase ?? "cubic-bezier(0.22,1,0.36,1)";

  // Very subtle: slight opacity fade-in, no translate (no jarring movement)
  return {
    animation:  `worldCarryIn ${ms}ms ${ease} both`,
    // Warmth tint — rgba overlay, max 4% opacity
    ...(Math.abs(warm) > 0.01 ? {
      boxShadow:`inset 0 0 120px rgba(${warm>0?"255,160,80":"80,120,200"},${Math.abs(warm)*0.4})`,
    } : {}),
  };
}

// ═══════════════════════════════════════════════════════════════
// 9. GLOBAL WORLD CSS
//    Inject once at root level — contains world-breath keyframes
// ═══════════════════════════════════════════════════════════════

export const WORLD_CSS = `
  /* ── World Carry-In (tab transition) ── */
  @keyframes worldCarryIn {
    from { opacity:0.88; }
    to   { opacity:1; }
  }

  /* ── World Float (avatar, orb center, ambient elements) ── */
  @keyframes worldFloat {
    0%,100% { transform:translateY(0);   }
    50%     { transform:translateY(-5px);}
  }

  /* ── World Glow Pulse (rings, halos) ── */
  @keyframes worldGlowPulse {
    0%,100% { opacity:var(--glow-lo, 0.08); transform:scale(1);    }
    50%     { opacity:var(--glow-hi, 0.18); transform:scale(1.10); }
  }

  /* ── World Breathe (bg blobs, ambient layers) ── */
  @keyframes worldBreathe {
    0%,100% { transform:translate(-50%,-50%) scale(1); }
    50%     { transform:translate(-50%,-50%) scale(1.06); }
  }

  /* ── Stillness (empty state icon) ── */
  @keyframes worldStillness {
    0%,100% { opacity:var(--still-lo, 0.20); transform:scale(1);    }
    50%     { opacity:var(--still-hi, 0.30); transform:scale(1.03); }
  }

  /* ── Atelier Shimmer (profile ambient corner) ── */
  @keyframes atelierShimmer {
    0%   { opacity:0.03; }
    50%  { opacity:0.07; }
    100% { opacity:0.03; }
  }

  /* ── World tap — all interactive elements ── */
  .world-tap {
    -webkit-tap-highlight-color:transparent;
    touch-action:manipulation;
    cursor:pointer;
  }
  .world-tap:active { opacity:0.70; transition:opacity 0.12s ease; }

  /* ── World scroll ── */
  .world-scroll { scrollbar-width:none; -ms-overflow-style:none; -webkit-overflow-scrolling:touch; }
  .world-scroll::-webkit-scrollbar { display:none; }

  /* ── World card ── */
  .world-card {
    background:rgba(255,255,255,0.82);
    backdrop-filter:blur(14px);
    -webkit-backdrop-filter:blur(14px);
    will-change:transform;
  }
`;
