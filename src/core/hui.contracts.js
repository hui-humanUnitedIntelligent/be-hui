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
  ADD_TO_CART: {
    required:    ["item"],
    optional:    ["openKorb", "source"],
    description: "Fuegt Item zum WerkeKorb hinzu (Commerce 2.0)",
  },
  OPEN_WERK: {
    required:    [],
    requiredOr:  [["werk", "id", "werkId"]],
    optional:    ["source"],
    description: "Oeffnet Werk-Detail (/work/:id)",
  },
  SUPPORT_CREATOR: {
    required:    ["creator"],
    optional:    ["source"],
    description: "Oeffnet Creator-Unterstuetzung (Commerce 2.0)",
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
  GO_TO_TAB: {
    required:    [],
    optional:    ["tab", "source"],
    description: "Wechselt zu einem Tab",
  },
};

// ─── Kern-Validator ────────────────────────────────────────────────
// Gibt einen sicheren, normalisierten Payload-Klon zurueck — oder null.
//
// null-Payload wird IMMER zu {} normalisiert.
// Default-Param (payload = {}) greift NICHT bei explizit null — daher hier.
export function validate(actionName, rawPayload) {
  // Null-Safety: normalisiere null/undefined zu leerem Objekt
  const payload = (rawPayload == null) ? {} : rawPayload;

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
    if (isDev) {
      console.warn("[HUI_CONTRACT] A." + actionName + ": kein Contract definiert. Unverifiziert ausgefuehrt.");
    }
    return { source: "system", ...payload };
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
