// src/lib/world/worldSurfaceController.js
// HUI World Surface Controller v1 — Phase 16.2
//
// Single authority for ALL overlay/blur/feed/nav state.
// No component may directly set blur, hide feed, or lock nav.
// Everything flows through openSurface() / closeSurface().
//
// Invariants:
//   blur ONLY active when overlayConfirmed === true
//   Feed NEVER unmounted — opacity/transform/pointer-events only
//   Nav  NEVER unmounted — visual modulation only
//   Auto-recovery fires after getMountTimeout(surfaceId) ms

// ── Surface Registry ─────────────────────────────────────────────
export const SURFACE_REGISTRY = {
  orb: {
    blurAmount:   "4px",
    dimAlpha:     0.38,
    feedOpacity:  0.0,
    feedScale:    0.985,
    navDrift:     12,
    navOpacity:   0.45,
    duration:     "680ms",
    easing:       "cubic-bezier(0.22,1,0.36,1)",
    mountTimeout: 2500,
  },
  membership: {
    blurAmount:   "6px",
    dimAlpha:     0.50,
    feedOpacity:  0.0,
    feedScale:    0.98,
    navDrift:     0,
    navOpacity:   0.0,
    duration:     "500ms",
    easing:       "cubic-bezier(0.22,1,0.36,1)",
    mountTimeout: 3000,
  },
  chat: {
    blurAmount:   "2px",
    dimAlpha:     0.20,
    feedOpacity:  0.6,
    feedScale:    1.0,
    navDrift:     0,
    navOpacity:   1.0,
    duration:     "350ms",
    easing:       "cubic-bezier(0.22,1,0.36,1)",
    mountTimeout: 4000,
  },
  match: {
    blurAmount:   "3px",
    dimAlpha:     0.30,
    feedOpacity:  0.5,
    feedScale:    0.99,
    navDrift:     8,
    navOpacity:   0.60,
    duration:     "420ms",
    easing:       "cubic-bezier(0.22,1,0.36,1)",
    mountTimeout: 4000,
  },
};

// ── World State shape ────────────────────────────────────────────
export function buildWorldState(overrides = {}) {
  return Object.freeze({
    activeSurface:    null,
    previousSurface:  null,
    blurActive:       false,
    feedVisible:      true,
    navLocked:        false,
    overlayMounted:   false,
    overlayConfirmed: false,
    transitionLocked: false,
    rollbackSnapshot: null,
    openedAt:         null,
    ...overrides,
  });
}

export const WORLD_STATE_CLOSED = buildWorldState();

// ── Snapshot ─────────────────────────────────────────────────────
export function snapshotWorldState(state) {
  return Object.freeze({
    activeSurface:    state.activeSurface,
    previousSurface:  state.previousSurface,
    blurActive:       state.blurActive,
    feedVisible:      state.feedVisible,
    navLocked:        state.navLocked,
    overlayMounted:   state.overlayMounted,
    overlayConfirmed: state.overlayConfirmed,
    snapshottedAt:    Date.now(),
  });
}

// ── Phase 1: Opening state (no blur yet) ─────────────────────────
export function buildOpeningState(current, surfaceId) {
  if (!SURFACE_REGISTRY[surfaceId]) {
    console.warn("[WORLD SURFACE] unknown surfaceId:", surfaceId);
    return current;
  }
  return Object.freeze({
    ...current,
    activeSurface:    surfaceId,
    previousSurface:  current.activeSurface,
    transitionLocked: true,
    overlayMounted:   false,
    overlayConfirmed: false,
    openedAt:         Date.now(),
    rollbackSnapshot: snapshotWorldState(current),
    // blur/feed/nav NOT yet active — waiting for confirmation
    blurActive:       false,
    feedVisible:      current.feedVisible,
    navLocked:        false,
  });
}

// ── Phase 2: Confirmed state (blur NOW active) ───────────────────
export function buildConfirmedState(current) {
  const reg = SURFACE_REGISTRY[current.activeSurface];
  if (!reg) return current;
  return Object.freeze({
    ...current,
    overlayMounted:   true,
    overlayConfirmed: true,
    transitionLocked: false,
    blurActive:       true,
    feedVisible:      false,   // feed dimmed (opacity only)
    navLocked:        true,
  });
}

// ── Closed state (full world restore) ────────────────────────────
export function buildClosedState(current) {
  return Object.freeze({
    ...WORLD_STATE_CLOSED,
    previousSurface:  current.activeSurface,
    rollbackSnapshot: current.rollbackSnapshot,
  });
}

// ── Derive CSS tokens — pure function, no side effects ───────────
export function deriveWorldTokens(state) {
  const confirmed = state.overlayConfirmed;
  const reg       = SURFACE_REGISTRY[state.activeSurface] || {};
  const blur      = confirmed ? (reg.blurAmount ?? "0px") : "0px";
  const feedOp    = confirmed ? (reg.feedOpacity ?? 0)   : 1;
  const feedScale = confirmed ? (reg.feedScale   ?? 1)   : 1;
  const navDrift  = confirmed ? (reg.navDrift    ?? 0)   : 0;
  const navOp     = confirmed ? (reg.navOpacity  ?? 1)   : 1;
  const dimAlpha  = confirmed ? (reg.dimAlpha    ?? 0)   : 0;
  const dur       = reg.duration ?? "680ms";
  const ease      = reg.easing   ?? "cubic-bezier(0.22,1,0.36,1)";

  return Object.freeze({
    // Phase 16.4: feedContainerStyle — scroll container scale only.
    // Opacity handled by tabVisibilityController.
    // Blur handled by dimStyle overlay.
    // pointerEvents: always auto on scroll container.
    feedContainerStyle: {
      transform:     `scale(${feedScale})`,
      transformOrigin: "top center",
      transition:    `transform ${dur} ${ease}`,
      willChange:    "transform",
      pointerEvents: "auto",  // scroll container always interactive
    },
    // BottomNav — always mounted, visual modulation only
    navStyle: {
      opacity:       navOp,
      transform:     `translateY(${navDrift}px)`,
      transition:    `opacity ${dur} ${ease}, transform ${dur} ${ease}`,
      willChange:    "opacity, transform",
      pointerEvents: state.navLocked ? "none" : "auto",
    },
    // Dim overlay behind surface
    dimStyle: {
      position:             "fixed", inset: 0,
      zIndex:               8985,   // Phase 16.4: above tab content, below overlays
      background:           `rgba(20,20,30,${dimAlpha})`,
      backdropFilter:       confirmed ? `blur(${blur})` : "none",
      WebkitBackdropFilter: confirmed ? `blur(${blur})` : "none",
      transition:           `background ${dur} ${ease}, backdrop-filter ${dur} ${ease}`,
      pointerEvents:        "none",   // NEVER blocks interaction — visual only
      willChange:           "background, backdrop-filter",
    },
    _surfaceId:  state.activeSurface,
    _confirmed:  confirmed,
    _blurActive: state.blurActive,
  });
}

// ── Validation ───────────────────────────────────────────────────
export function validateSurfaceId(surfaceId) {
  if (surfaceId === null) return true;
  if (!SURFACE_REGISTRY[surfaceId]) {
    console.warn("[WORLD SURFACE] Invalid surfaceId:", surfaceId,
      "— known:", Object.keys(SURFACE_REGISTRY).join(", "));
    return false;
  }
  return true;
}

export function getMountTimeout(surfaceId) {
  return SURFACE_REGISTRY[surfaceId]?.mountTimeout ?? 2500;
}
