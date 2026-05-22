// src/lib/world/orbLayer.js — HUI Orb Layer Engine v1
//
// The Orb is NOT a route. The Orb is NOT a tab.
// The Orb is the living heart of the world — always above, never replacing.
//
// Philosophy:
//   • Orb opens: the world softens and slows beneath it
//   • Orb closes: the world resurfaces, carrying warmth forward
//   • BottomNav never unmounts — it drifts, then returns
//   • activeTab is NEVER set to "orb"
// ─────────────────────────────────────────────────────────────────

export const ORB_STATE_CLOSED = Object.freeze({
  isOpen:           false,
  layer:            "world",
  originTab:        "feed",
  openedAt:         null,
  closedAt:         null,
  continuityCarry:  {},
  worldTemperature: "calm_flowing",
  atmosphereId:     null,
  _source:          null,
});

export function buildOpenOrbState({
  originTab        = "feed",
  worldTemperature = "calm_flowing",
  atmosphereId     = null,
  continuityCarry  = {},
  source           = "orb-button",
} = {}) {
  return Object.freeze({
    isOpen:           true,
    layer:            "world",
    originTab,
    openedAt:         Date.now(),
    closedAt:         null,
    continuityCarry:  Object.freeze({ ...continuityCarry }),
    worldTemperature,
    atmosphereId,
    _source:          source,
  });
}

export function buildCloseOrbState(prevState) {
  return Object.freeze({
    ...ORB_STATE_CLOSED,
    originTab:        prevState?.originTab       ?? "feed",
    closedAt:         Date.now(),
    continuityCarry:  prevState?.continuityCarry ?? {},
    worldTemperature: prevState?.worldTemperature ?? "calm_flowing",
    atmosphereId:     prevState?.atmosphereId    ?? null,
  });
}

// ── Visual tokens ─────────────────────────────────────────────

export function orbBackdropTokens(isOpen, worldTemperature = "calm_flowing") {
  const blurAmount = {
    night_still:"8px", quiet_deep:"6px", warm_creative:"4px",
    human_warm:"4px",  inspired_clear:"5px", soft_emerging:"5px", calm_flowing:"4px",
  }[worldTemperature] ?? "4px";

  const dimAlpha = {
    night_still:0.52, quiet_deep:0.44, warm_creative:0.38,
    human_warm:0.36, inspired_clear:0.40, soft_emerging:0.40, calm_flowing:0.38,
  }[worldTemperature] ?? 0.38;

  const duration = {
    night_still:"900ms", quiet_deep:"800ms", warm_creative:"650ms",
    human_warm:"600ms", inspired_clear:"700ms", soft_emerging:"720ms", calm_flowing:"680ms",
  }[worldTemperature] ?? "700ms";

  return Object.freeze({
    worldContainerStyle: {
      filter:     isOpen ? `blur(${blurAmount})` : "blur(0px)",
      opacity:    isOpen ? (1 - dimAlpha * 0.3) : 1,
      transform:  isOpen ? "scale(0.985)" : "scale(1)",
      transition: `filter ${duration} cubic-bezier(0.22,1,0.36,1), opacity ${duration} cubic-bezier(0.22,1,0.36,1), transform ${duration} cubic-bezier(0.22,1,0.36,1)`,
      willChange: "filter, opacity, transform",
      pointerEvents: isOpen ? "none" : "auto",
    },
    dimOverlayStyle: {
      position:"fixed", inset:0, zIndex:8990,
      background:`rgba(20,20,30,${isOpen ? dimAlpha : 0})`,
      backdropFilter: isOpen ? "blur(2px)" : "none",
      WebkitBackdropFilter: isOpen ? "blur(2px)" : "none",
      transition: `background ${duration} cubic-bezier(0.22,1,0.36,1)`,
      pointerEvents: isOpen ? "auto" : "none",
    },
    blurAmount, dimAlpha, duration,
  });
}

export function orbNavDriftTokens(isOpen, worldTemperature = "calm_flowing") {
  const driftPx = isOpen ? 12 : 0;
  const opacity  = isOpen ? 0.45 : 1;
  const scale    = isOpen ? 0.96 : 1;
  const duration = { night_still:"900ms", quiet_deep:"800ms", warm_creative:"620ms",
                     human_warm:"580ms", calm_flowing:"650ms" }[worldTemperature] ?? "650ms";
  const ease = "cubic-bezier(0.22,1,0.36,1)";
  return Object.freeze({
    opacity,
    transform:  `translateY(${driftPx}px) scale(${scale})`,
    transition: `opacity ${duration} ${ease}, transform ${duration} ${ease}`,
    pointerEvents: "none",
  });
}

export function orbOverlayTokens(isOpen, isMounted) {
  return Object.freeze({
    opacity:    (isOpen && isMounted) ? 1 : 0,
    transform:  (isOpen && isMounted) ? "scale(1)" : "scale(0.96)",
    transition: "opacity 0.72s cubic-bezier(0.22,1,0.36,1), transform 0.72s cubic-bezier(0.22,1,0.36,1)",
    pointerEvents: (isOpen && isMounted) ? "auto" : "none",
  });
}

// ── Cinematic sequence timing ─────────────────────────────────

export const ORB_OPEN_SEQUENCE = Object.freeze([
  { step:"pulse_deepen",     delayMs:0,   durationMs:200 },
  { step:"world_softens",    delayMs:80,  durationMs:380 },
  { step:"warmth_spreads",   delayMs:180, durationMs:320 },
  { step:"atmosphere_slows", delayMs:260, durationMs:280 },
  { step:"overlay_emerges",  delayMs:340, durationMs:460 },
  { step:"nodes_arrive",     delayMs:680, durationMs:400 },
]);

export const ORB_CLOSE_SEQUENCE = Object.freeze([
  { step:"nodes_recede",    delayMs:0,   durationMs:240 },
  { step:"overlay_closes",  delayMs:140, durationMs:380 },
  { step:"world_resurfaces",delayMs:360, durationMs:400 },
  { step:"warmth_carries",  delayMs:480, durationMs:320 },
  { step:"nav_returns",     delayMs:400, durationMs:340 },
]);

export const ORB_OPEN_DURATION_MS  = 1080;
export const ORB_CLOSE_DURATION_MS = 800;

// ── Guards ────────────────────────────────────────────────────

export function assertValidTab(tab) {
  if (tab === "orb") {
    if (typeof console !== "undefined") {
      console.warn("[HUI INVALID ORB ROUTE] activeTab was set to 'orb'. The Orb is a world-layer, not a tab. Use openOrbWorld() instead.");
    }
    return false;
  }
  return true;
}

export function validateOrbState(state) {
  if (!state || typeof state !== "object") return ORB_STATE_CLOSED;
  if (typeof state.isOpen !== "boolean")   return ORB_STATE_CLOSED;
  return state;
}
