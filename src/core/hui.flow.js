// src/core/hui.flow.js — HUI FLOW MEMORY SYSTEM v1
// ══════════════════════════════════════════════════════════════════
// Phase 2: Flow Calibration
//
// MISSION: HUI soll sich wie eine zusammenhängende Welt anfühlen,
//          nicht wie isolierte Screens.
//
// WAS DIESES SYSTEM MACHT:
//   - Return Stack:    merkt sich den Weg zurück
//   - Context Memory: weiß woher der User kam
//   - Flow Endings:   emotionale Abschlüsse statt "Modal close"
//
// USAGE:
//   const flow = useHuiFlow();
//   flow.push("discover");
//   flow.popAndReturn() → gibt vorherigen Context zurück
//
// LOOP 1 (Priorität):
//   Discover → Visitor Profile → Chat → Return zum selben Profil
// ══════════════════════════════════════════════════════════════════

import { useContext, createContext } from "react";
import { S, SURFACE_LABEL } from "./hui.sources.js";
import { isValidTab } from "../lib/world/orbLayer.js";

// ─── Flow Entry Schema ─────────────────────────────────────────────
// {
//   surface:          "discover"|"visitor-profile"|"chat"|"experience"|"impact"|"feed"
//   sourceTab?:       string   — welcher Tab war aktiv
//   sourceRoute?:     string   — Browser-Route beim Flow-Start
//   sourceWorld?:     object|string|null
//   sourceAtmosphere?:object|string|null
//   returnBehavior?:  string   — z.B. "previous-tab"|"feed"|"preserve"
//   previousFlow?:    object|null
//   creatorId?:       string
//   creator?:         object   — vollständiges Profil-Objekt
//   scrollKey?:       string   — sessionStorage key für Scroll-Position
//   timestamp:        number
// }

const isDev = import.meta.env?.DEV ?? false;

// ─── Context ───────────────────────────────────────────────────────
export const FlowCtx = createContext(null);

// ─── useHuiFlow — main hook ────────────────────────────────────────
export function useHuiFlow() {
  const ctx = useContext(FlowCtx);
  if (!ctx) {
    // Graceful noop — Flow ist optional, nie crashen
    return {
      push:               () => {},
      pop:                () => null,
      current:            () => null,
      hasReturn:          () => false,
      setReturnProfile:   () => {},
      getReturnProfile:   () => null,
      clearReturnProfile: () => {},
      clear:              () => {},
      entries:            () => [],
    };
  }
  return ctx;
}

function currentRoute() {
  if (typeof window === "undefined") return null;
  return window.location.pathname + window.location.search + window.location.hash;
}

function inferSourceTab(entry) {
  if (isValidTab(entry?.sourceTab)) return entry.sourceTab;
  if (isValidTab(entry?.tab)) return entry.tab;
  if (isValidTab(entry?.source)) return entry.source;
  return S.FEED;
}

function publicFlowSnapshot(entry) {
  if (!entry) return null;
  const {
    surface,
    sourceTab,
    sourceRoute,
    sourceWorld,
    sourceAtmosphere,
    returnBehavior,
    timestamp,
  } = entry;
  return {
    surface,
    sourceTab,
    sourceRoute,
    sourceWorld,
    sourceAtmosphere,
    returnBehavior,
    timestamp,
  };
}

// ─── createFlowStore — factory für HomeShell ──────────────────────
// Gibt ein stabiles Store-Objekt zurück (kein React-State).
// HomeShell hält dieses in einem useRef und stellt es als FlowCtx bereit.
//
// DESIGN: useRef statt useState → Stack-Änderungen triggern KEINEN Re-render.
// Nur returnProfile ist für den UI-Layer relevant und wird über
// setShowWirker gesteuert (bestehender State).
export function createFlowStore() {
  const stack = [];          // LIFO — neuestes = letztes Element
  let _returnProfile = null; // Profil das nach Chat-Close wieder erscheint

  return {
    // ── Stack Operations ─────────────────────────────────────────
    push(entry) {
      if (!entry?.surface) return; // kein leerer Eintrag
      const previousFlow = publicFlowSnapshot(stack[stack.length - 1]);
      var e = Object.assign({
        timestamp: Date.now(),
        sourceTab: inferSourceTab(entry),
        sourceRoute: currentRoute(),
        sourceWorld: null,
        sourceAtmosphere: null,
        returnBehavior: "previous-context",
        previousFlow,
      }, entry);
      e.sourceTab = inferSourceTab(e);
      stack.push(e);
      if (stack.length > 10) stack.shift(); // Rolling window
      if (isDev) {
        var surfLabel = SURFACE_LABEL[e.surface] || e.surface;
        var fromLabel = e.source ? (SURFACE_LABEL[e.source] || e.source) : null;
        var msg = "[HUI_FLOW] → " + surfLabel;
        if (fromLabel) msg += " from " + fromLabel;
        if (e.creatorId) msg += " (id:" + e.creatorId + ")";
        console.log(msg);
      }
    },

    pop() {
      return stack.pop() ?? null;
    },

    current() {
      return stack.length > 0 ? stack[stack.length - 1] : null;
    },

    hasReturn() {
      return stack.length > 0;
    },

    // ── Return Profile — Kern von LOOP 1 ─────────────────────────
    // Wenn Chat vom Profil aus geöffnet wird:
    //   flow.setReturnProfile(wirker)
    // Wenn Chat schließt:
    //   flow.getReturnProfile() → Profil wieder öffnen
    setReturnProfile(profile) {
      _returnProfile = profile ?? null;
      if (isDev && profile) {
        var name = profile.display_name || profile.name || profile.id || "?";
        console.log("[HUI_FLOW] ReturnProfile gesetzt:", name);
      }
    },

    getReturnProfile() {
      return _returnProfile;
    },

    clearReturnProfile() {
      if (isDev && _returnProfile) {
        console.log("[HUI_FLOW] ReturnProfile geleert");
      }
      _returnProfile = null;
    },

    clear(reason = "flow-clear") {
      if (isDev && stack.length) {
        console.log("[HUI_FLOW] Stack geleert:", reason, stack.length);
      }
      stack.length = 0;
      _returnProfile = null;
    },

    entries() {
      return stack.map(publicFlowSnapshot);
    },
  };
}
