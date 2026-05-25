// src/core/hui.contracts.js — HUI ACTION CONTRACT LAYER v1
// ══════════════════════════════════════════════════════════════════
// PHASE 2: Action-Verträge
//
// ZWECK:
//   Jede Action hat einen definierten Vertrag.
//   Vor der Ausführung wird der Payload geprüft.
//   Bei Verstoß: sauber loggen + abbrechen — kein Crash, kein weißer Screen.
//
// DESIGN:
//   - Zentrale Validierung, NICHT überall Optional-Chains
//   - null/undefined Payload wird sicher abgefangen
//   - source ist ab Phase 2 empfohlen für Flow-Memory
//   - Im DEV-Modus: ausführliche Warnings
//   - Im PROD-Modus: stilles Abbrechen
//
// USAGE in hui.actions.js:
//   const p = validate(A.OPEN_PROFILE, rawPayload);
//   if (!p) return;
//   const { creator, creatorId, source } = p;
// ══════════════════════════════════════════════════════════════════

import { S, isValidSource, SURFACE_LABEL } from "./hui.sources.js";

const isDev = import.meta.env?.DEV ?? false;
const VALID_TABS = new Set(["feed", "discover", "impact", "favorites"]);
const KNOWN_ROUTES = new Set([
  "/Home",
  "/impact",
  "/work/:id",
  "/profile/:username",
  "/studio",
  "/studio/:section",
  "/Admin",
  "/dashboard",
  "/diagnose",
  "/login",
  "/auth/callback",
]);

// ─── Source-Konstanten ─────────────────────────────────────────────
export const SOURCE = Object.freeze({
  FEED:             "feed",
  DISCOVER:         "discover",
  FAVORITES:        "favorites",
  IMPACT:           "impact",
  ORB:              "orb",
  NOTIFICATIONS:    "notifications",
  VISITOR_PROFILE:  "visitor-profile",
  OWN_PROFILE:      "own-profile",
  CHAT:             "chat",
  BOOKING:          "booking",
  EXPERIENCE:       "experience",
  MAP:              "map",
  SEARCH:           "search",
  SYSTEM:           "system",
});

// ─── Contract Definitionen ─────────────────────────────────────────
const CONTRACTS = {
  OPEN_PROFILE: {
    required:    [],
    requiredOr:  [["creator", "creatorId"]],
    optional:    ["source"],
    description: "Oeffnet ein Creator-Profil als Overlay",
  },
  OPEN_OWN_PROFILE: {
    required:    [],
    optional:    ["source"],
    description: "Oeffnet das eigene Profil",
  },
  CLOSE_PROFILE: {
    required:    [],
    optional:    [],
    description: "Schliesst das aktive Profil-Overlay",
  },
  OPEN_CHAT: {
    required:    [],
    requiredOr:  [],
    optional:    ["recipient", "recipientId", "source"],
    description: "Oeffnet den Chat",
  },
  CLOSE_CHAT: {
    required:    [],
    optional:    [],
    description: "Schliesst den Chat-Overlay",
  },
  SEND_MESSAGE: {
    required:    [],
    requiredOr:  [["recipient", "recipientId"]],
    optional:    ["source"],
    description: "Sendet eine Nachricht — delegiert an OPEN_CHAT",
  },
  OPEN_EXPERIENCE: {
    required:    [],
    requiredOr:  [["experience", "creatorId"]],
    optional:    ["source", "view"],
    description: "Oeffnet ein Erlebnis",
  },
  BOOK_EXPERIENCE: {
    required:    ["experience"],
    optional:    ["creator", "source"],
    description: "Bucht ein Erlebnis",
  },
  CREATE_EXPERIENCE: {
    required:    [],
    optional:    ["source"],
    description: "Oeffnet den Erlebnis-Creator",
  },
  OPEN_IMPACT: {
    required:    [],
    optional:    ["source"],
    description: "Wechselt zum Impact-Tab",
  },
  SEND_RESONANCE: {
    required:    ["targetId", "type"],
    optional:    ["source"],
    description: "Sendet Resonanz an ein Target",
  },
  FOLLOW_CREATOR: {
    required:    ["creatorId"],
    optional:    ["following", "source"],
    description: "Folgt/Entfolgt einem Creator",
  },
  SHARE_MOMENT: {
    required:    [],
    optional:    ["url", "title", "text", "source"],
    description: "Teilt einen Moment",
  },
  OPEN_WERK: {
    required:    [],
    requiredOr:  [["werk", "werkId", "view"]],
    optional:    ["source"],
    description: "Oeffnet einen Werk-Kontext",
  },
  OPEN_MOMENT: {
    required:    [],
    optional:    ["moment", "momentId", "view", "source"],
    description: "Oeffnet einen Moment-Kontext",
  },
  OPEN_ORB: {
    required:    [],
    optional:    ["world", "source"],
    description: "Oeffnet den HUI Orb",
  },
  CLOSE_ORB: {
    required:    [],
    optional:    [],
    description: "Schliesst den HUI Orb",
  },
  OPEN_BOOKING: {
    required:    [],
    optional:    ["recipient", "source"],
    description: "Oeffnet den Booking-Connect-Sheet",
  },
  OPEN_CONNECT: {
    required:    [],
    optional:    ["intent", "experience", "source"],
    description: "Oeffnet das Connect-Sheet",
  },
  OPEN_NOTIFICATIONS: {
    required:    [],
    optional:    ["source"],
    description: "Oeffnet das Notification-Center",
  },
  OPEN_MAP: {
    required:    [],
    optional:    ["source"],
    description: "Oeffnet die Live-Map",
  },
  OPEN_MATCH: {
    required:    [],
    optional:    ["source"],
    description: "Oeffnet das Match-Overlay",
  },
  OPEN_WORLD: {
    required:    [],
    optional:    ["world", "source"],
    description: "Oeffnet einen Orb-World-Layer",
  },
  OPEN_ROOM: {
    required:    [],
    optional:    ["creatorId", "roomId", "source"],
    description: "Oeffnet einen Creator-Raum",
  },
  OPEN_COMMUNITY: {
    required:    [],
    optional:    ["source"],
    description: "Wechselt zum Community-Tab",
  },
  OPEN_STORY_COMPOSER: {
    required:    [],
    optional:    ["source"],
    description: "Oeffnet den Story-Composer",
  },
  OPEN_IMPACT_FLOW: {
    required:    [],
    optional:    ["source"],
    description: "Oeffnet den Impact-Flow",
  },
  OPEN_CREATE_FLOW: {
    required:    [],
    optional:    ["type", "source"],
    description: "Oeffnet den Create-Flow",
  },
  OPEN_CALENDAR: {
    required:    [],
    optional:    ["source"],
    description: "Oeffnet den Kalender",
  },
  OPEN_EARNINGS: {
    required:    [],
    optional:    ["source"],
    description: "Oeffnet den Einnahmen-Kontext",
  },
  OPEN_EXPERIENCE_MANAGER: {
    required:    [],
    optional:    ["source"],
    description: "Oeffnet die Erlebnis-Verwaltung",
  },
  OPEN_NOTIFICATIONS_SETTINGS: {
    required:    [],
    optional:    ["source"],
    description: "Oeffnet Benachrichtigungs-Einstellungen",
  },
  FILTER_CATEGORY: {
    required:    ["category"],
    optional:    ["source"],
    description: "Filtert eine Kategorie im aktuellen Kontext",
  },
  GO_TO_TAB: {
    required:    [],
    optional:    ["tab", "source"],
    description: "Wechselt zu einem Tab",
  },
  GO_HOME: {
    required:    [],
    optional:    ["source"],
    description: "Wechselt zum Feed-Tab",
  },
  GO_DISCOVER: {
    required:    [],
    optional:    ["source"],
    description: "Wechselt zum Discover-Tab",
  },
  GO_IMPACT: {
    required:    [],
    optional:    ["source"],
    description: "Wechselt zum Impact-Tab",
  },
  GO_FAVORITES: {
    required:    [],
    optional:    ["source"],
    description: "Wechselt zum Favoriten-Tab",
  },
};

const ACTION_RUNTIME = {
  OPEN_PROFILE:         { target: S.VISITOR_PROFILE, entityType: "profile", runtimeEffect: "overlay:profile", requiresAuth: true },
  OPEN_OWN_PROFILE:     { target: S.OWNER_PROFILE,   entityType: "profile", runtimeEffect: "overlay:own-profile", requiresAuth: true },
  CLOSE_PROFILE:        { target: S.VISITOR_PROFILE, entityType: "profile", runtimeEffect: "overlay:close-profile", requiresAuth: true },
  OPEN_CHAT:            { target: S.CHAT,            entityType: "recipient", runtimeEffect: "overlay:chat", requiresAuth: true },
  CLOSE_CHAT:           { target: S.CHAT,            entityType: "recipient", runtimeEffect: "overlay:close-chat", requiresAuth: true },
  SEND_MESSAGE:         { target: S.CHAT,            entityType: "recipient", runtimeEffect: "overlay:chat", requiresAuth: true },
  OPEN_EXPERIENCE:      { target: S.EXPERIENCE,      entityType: "experience", runtimeEffect: "overlay:experience", requiresAuth: true },
  BOOK_EXPERIENCE:      { target: S.BOOKING,         entityType: "experience", runtimeEffect: "overlay:booking", requiresAuth: true },
  CREATE_EXPERIENCE:    { target: S.EXPERIENCE,      entityType: "experience", runtimeEffect: "flow:create-experience", requiresAuth: true },
  OPEN_IMPACT:          { target: S.IMPACT,          entityType: "impact", runtimeEffect: "tab:impact", requiresAuth: true, route: "/impact" },
  SEND_RESONANCE:       { target: S.HOME,            entityType: "resonance", runtimeEffect: "signal:resonance", requiresAuth: true },
  FOLLOW_CREATOR:       { target: S.VISITOR_PROFILE, entityType: "profile", runtimeEffect: "signal:follow", requiresAuth: true },
  SHARE_MOMENT:         { target: S.HOME,            entityType: "moment", runtimeEffect: "share:moment", requiresAuth: true },
  OPEN_WERK:            { target: S.EXPERIENCE,      entityType: "werk", runtimeEffect: "overlay:werk", requiresAuth: true },
  OPEN_MOMENT:          { target: S.HOME,            entityType: "moment", runtimeEffect: "flow:moment", requiresAuth: true },
  OPEN_ORB:             { target: S.ORB,             entityType: "orb", runtimeEffect: "overlay:orb", requiresAuth: true },
  CLOSE_ORB:            { target: S.ORB,             entityType: "orb", runtimeEffect: "overlay:close-orb", requiresAuth: true },
  OPEN_BOOKING:         { target: S.BOOKING,         entityType: "recipient", runtimeEffect: "overlay:booking", requiresAuth: true },
  OPEN_CONNECT:         { target: S.BOOKING,         entityType: "connection", runtimeEffect: "overlay:connect", requiresAuth: true },
  OPEN_NOTIFICATIONS:   { target: S.NOTIFICATIONS,   entityType: "notification", runtimeEffect: "overlay:notifications", requiresAuth: true },
  OPEN_MAP:             { target: S.MAP,             entityType: "map", runtimeEffect: "overlay:map", requiresAuth: true },
  OPEN_MATCH:           { target: S.MATCH,           entityType: "match", runtimeEffect: "overlay:match", requiresAuth: true },
  OPEN_WORLD:           { target: S.ORB,             entityType: "world", runtimeEffect: "overlay:orb-world", requiresAuth: true },
  OPEN_ROOM:            { target: S.VISITOR_PROFILE, entityType: "room", runtimeEffect: "overlay:room", requiresAuth: true },
  OPEN_COMMUNITY:       { target: S.DISCOVER,        entityType: "community", runtimeEffect: "tab:discover", requiresAuth: true, route: "/Home" },
  OPEN_STORY_COMPOSER:  { target: S.HOME,            entityType: "story", runtimeEffect: "overlay:story-composer", requiresAuth: true },
  OPEN_IMPACT_FLOW:     { target: S.IMPACT,          entityType: "impact", runtimeEffect: "flow:impact", requiresAuth: true },
  OPEN_CREATE_FLOW:     { target: S.ORB,             entityType: "create", runtimeEffect: "flow:create", requiresAuth: true },
  OPEN_CALENDAR:        { target: S.OWNER_PROFILE,   entityType: "calendar", runtimeEffect: "deprecated:calendar", requiresAuth: true },
  OPEN_EARNINGS:        { target: S.OWNER_PROFILE,   entityType: "earnings", runtimeEffect: "deprecated:earnings", requiresAuth: true },
  OPEN_EXPERIENCE_MANAGER: { target: S.OWNER_PROFILE, entityType: "experience", runtimeEffect: "deprecated:experience-manager", requiresAuth: true },
  OPEN_NOTIFICATIONS_SETTINGS: { target: S.NOTIFICATIONS, entityType: "notification-settings", runtimeEffect: "deprecated:notification-settings", requiresAuth: true },
  FILTER_CATEGORY:      { target: S.DISCOVER,        entityType: "category", runtimeEffect: "state:filter-category", requiresAuth: true },
  GO_TO_TAB:            { target: S.HOME,            entityType: "tab", runtimeEffect: "tab:switch", requiresAuth: true, route: "/Home" },
  GO_HOME:              { target: S.HOME,            entityType: "tab", runtimeEffect: "tab:feed", requiresAuth: true, route: "/Home" },
  GO_DISCOVER:          { target: S.DISCOVER,        entityType: "tab", runtimeEffect: "tab:discover", requiresAuth: true, route: "/Home" },
  GO_IMPACT:            { target: S.IMPACT,          entityType: "tab", runtimeEffect: "tab:impact", requiresAuth: true, route: "/Home" },
  GO_FAVORITES:         { target: S.FAVORITES,       entityType: "tab", runtimeEffect: "tab:favorites", requiresAuth: true, route: "/Home" },
};

function normalizeRawPayload(actionName, rawPayload) {
  if (actionName === "GO_TO_TAB" && typeof rawPayload === "string") {
    return { tab: rawPayload };
  }
  return rawPayload;
}

function resolveEntityId(payload) {
  return (
    payload.entityId ??
    payload.creatorId ??
    payload.recipientId ??
    payload.targetId ??
    payload.itemId ??
    payload.werkId ??
    payload.momentId ??
    payload.roomId ??
    payload.experience?.id ??
    payload.creator?.id ??
    payload.creator?.user_id ??
    payload.recipient?.id ??
    payload.werk?.id ??
    null
  );
}

function normalizeTarget(actionName, payload, runtimeMeta) {
  if (actionName === "GO_TO_TAB") {
    return VALID_TABS.has(payload.tab) ? payload.tab : S.HOME;
  }
  return runtimeMeta?.target ?? ACTION_RUNTIME[actionName]?.target ?? S.SYSTEM;
}

function buildCanonicalAction(actionName, payload, overrides = {}) {
  const runtimeMeta = ACTION_RUNTIME[actionName] || {};
  const route = overrides.route ?? runtimeMeta.route ?? payload.route ?? null;
  return Object.freeze({
    actionId:      actionName,
    source:        payload.source || S.SYSTEM,
    target:        normalizeTarget(actionName, payload, runtimeMeta),
    entityType:    overrides.entityType ?? runtimeMeta.entityType ?? payload.entityType ?? null,
    entityId:      overrides.entityId ?? resolveEntityId(payload),
    route,
    runtimeEffect: overrides.runtimeEffect ?? runtimeMeta.runtimeEffect ?? null,
    requiresAuth:  overrides.requiresAuth ?? runtimeMeta.requiresAuth ?? false,
  });
}

// ─── Kern-Validator ────────────────────────────────────────────────
// Gibt einen sicheren, normalisierten Payload-Klon zurueck — oder null.
//
// null-Payload wird IMMER zu {} normalisiert.
// Default-Param (payload = {}) greift NICHT bei explizit null — daher hier.
export function validate(actionName, rawPayload) {
  // Null-Safety: normalisiere null/undefined zu leerem Objekt
  const normalizedRaw = normalizeRawPayload(actionName, rawPayload);
  const payload = (normalizedRaw == null) ? {} : normalizedRaw;

  // Typ-Check
  if (typeof payload !== "object") {
    if (isDev) {
      console.warn(
        "[HUI_CONTRACT] A." + actionName + ": payload muss ein Object sein, erhalten: " + typeof payload + ". Abbruch.",
        rawPayload
      );
    }
    return null;
  }

  const contract = CONTRACTS[actionName];
  if (!contract) {
    console.error("[HUI_CONTRACT] A." + actionName + ": kein Contract definiert. Action abgebrochen.", payload);
    return null;
  }

  // Required-Felder
  for (const field of (contract.required || [])) {
    if (payload[field] == null) {
      if (isDev) {
        console.warn(
          "[HUI_CONTRACT] A." + actionName + ": Pflichtfeld \"" + field + "\" fehlt. Abbruch.",
          contract.description, payload
        );
      }
      return null;
    }
  }

  // RequiredOr-Gruppen: mind. ein Feld der Gruppe muss vorhanden sein
  for (const group of (contract.requiredOr || [])) {
    const present = group.some(function(f) { return payload[f] != null; });
    if (!present) {
      if (isDev) {
        console.warn(
          "[HUI_CONTRACT] A." + actionName + ": eines von [" + group.join(", ") + "] muss gesetzt sein. Abbruch.",
          contract.description, payload
        );
      }
      return null;
    }
  }

  // Source-Validierung — Hinweis bei fehlendem oder ungültigem Source
  if (isDev) {
    if (!payload.source) {
      console.info(
        "[HUI_CONTRACT] A." + actionName + ": kein source gesetzt. " +
        "Nutze S.DISCOVER, S.FEED etc. aus hui.sources.js"
      );
    } else if (!isValidSource(payload.source)) {
      console.warn(
        "[HUI_CONTRACT] A." + actionName + ': unbekannter source-Wert: "' + payload.source + '". ' +
        "Verwende nur Werte aus S (hui.sources.js)"
      );
    }
  }

  // Sicherer Klon — source IMMER als String, niemals undefined/null (Phase 4G)
  const safeSrc = (typeof payload.source === "string" && payload.source.length > 0)
    ? payload.source
    : "system";
  return Object.assign({}, payload, { source: safeSrc });
}

export function validateAction(actionName, rawPayload, runtime = {}) {
  if (runtime.handlerExists === false) {
    console.error("[HUI_ACTION_RUNTIME] A." + actionName + ": kein Handler registriert. Action abgebrochen.");
    return null;
  }
  if (runtime.isMounted === false) {
    console.error("[HUI_ACTION_RUNTIME] A." + actionName + ": UI ist nicht gemounted. Action abgebrochen.");
    return null;
  }

  const payload = validate(actionName, rawPayload);
  if (!payload) return null;

  const canonical = buildCanonicalAction(actionName, payload, runtime);

  if (canonical.requiresAuth && runtime.hasAuth === false) {
    console.error("[HUI_ACTION_RUNTIME] A." + actionName + ": Auth erforderlich. Action abgebrochen.", canonical);
    return null;
  }

  if (canonical.route && !KNOWN_ROUTES.has(canonical.route)) {
    console.error("[HUI_ACTION_RUNTIME] A." + actionName + ": unbekannte Route. Action abgebrochen.", canonical);
    return null;
  }

  if (actionName === "GO_TO_TAB" && payload.tab && !VALID_TABS.has(payload.tab)) {
    console.error("[HUI_ACTION_RUNTIME] A.GO_TO_TAB: unbekannter Tab. Action abgebrochen.", payload.tab);
    return null;
  }

  return { payload, action: canonical };
}

// ─── DEV: Contract-Inspektor ───────────────────────────────────────
export function inspectContracts() {
  if (!isDev) return;
  console.group("[HUI_CONTRACTS] Action Contract Map");
  for (const name of Object.keys(CONTRACTS)) {
    var c = CONTRACTS[name];
    console.group("A." + name + " — " + c.description);
    if (c.required && c.required.length)   console.log("Required:   ", c.required);
    if (c.requiredOr && c.requiredOr.length) console.log("RequiredOr: ", c.requiredOr);
    if (c.optional && c.optional.length)   console.log("Optional:   ", c.optional);
    console.groupEnd();
  }
  console.groupEnd();
}
