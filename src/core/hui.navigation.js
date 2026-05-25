// src/core/hui.navigation.js
// Canonical route handoff helpers. UI back/close actions should not call history.back().

export const HUI_ROUTES = Object.freeze({
  HOME: "/Home",
  IMPACT: "/impact",
  STUDIO: "/studio",
  PROFILE: "/profile/:username",
  WORK: "/work/:id",
});

const ROUTE_TARGETS = Object.freeze({
  home: HUI_ROUTES.HOME,
  feed: HUI_ROUTES.HOME,
  discover: HUI_ROUTES.HOME,
  favorites: HUI_ROUTES.HOME,
  impact: HUI_ROUTES.IMPACT,
  studio: HUI_ROUTES.STUDIO,
});

export function canonicalRouteHandoff(target = "home") {
  if (typeof target === "string" && target.startsWith("/")) return target;
  return ROUTE_TARGETS[target] || HUI_ROUTES.HOME;
}

export function navigateCanonical(navigate, target = "home", options = {}) {
  if (typeof navigate !== "function") {
    console.error("[HUI_NAVIGATION] navigate handler missing", { target });
    return false;
  }
  const route = canonicalRouteHandoff(target);
  navigate(route, options);
  return true;
}
