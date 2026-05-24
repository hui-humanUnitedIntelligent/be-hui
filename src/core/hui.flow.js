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

// ─── Flow Entry Schema ─────────────────────────────────────────────
// {
//   surface:    "discover"|"profile"|"chat"|"experience"|"impact"|"feed"
//   creatorId?: string
//   creator?:   object   — vollständiges Profil-Objekt
//   tab?:       string   — welcher Tab war aktiv
//   scrollKey?: string   — sessionStorage key für Scroll-Position
//   timestamp:  number
// }

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
    };
  }
  return ctx;
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
      stack.push({ timestamp: Date.now(), ...entry });
      if (stack.length > 10) stack.shift(); // Rolling window
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
    },

    getReturnProfile() {
      return _returnProfile;
    },

    clearReturnProfile() {
      _returnProfile = null;
    },
  };
}
