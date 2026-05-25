// src/context/OrbWorldContext.jsx — HUI Orb World Context v1
//
// The Orb lives ABOVE the navigation system.
// This context is mounted once, at the top of the React tree,
// and persists across all tab changes, overlays, and route transitions.
//
// It exposes openOrbWorld() and closeOrbWorld() to any component.
// It NEVER routes to "/orb". It NEVER sets activeTab to "orb".
//
// Consumed by:
//   • BottomNav      — for drift tokens (opacity/transform while orb open)
//   • Home.jsx       — for world-content blur tokens
//   • OrbSystem      — for atmosphere carry-in
//   • HomeShell      — for continuity carry state
// ─────────────────────────────────────────────────────────────────

import React, {
  createContext, useContext, useState, useCallback,
  useRef, useMemo,
} from "react";

import {
  ORB_STATE_CLOSED,
  buildOpenOrbState,
  buildCloseOrbState,
  orbBackdropTokens,
  orbNavDriftTokens,
  assertValidTab,
  validateOrbState,
} from "../lib/world/orbLayer.js";
import { cleanupOrbEnvironment } from "../lib/cleanup/cleanupOrbEnvironment.js";

// ─────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────

const OrbWorldCtx = createContext(null);

export function useOrbWorld() {
  const ctx = useContext(OrbWorldCtx);
  if (!ctx) {
    // Graceful fallback — context not yet mounted
    return {
      orbState:        ORB_STATE_CLOSED,
      openOrbWorld:    () => {},
      closeOrbWorld:   () => {},
      backdrop:        orbBackdropTokens(false),
      navDrift:        orbNavDriftTokens(false),
      isOrbOpen:       false,
      originTab:       "feed",
    };
  }
  return ctx;
}

// ─────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────

export function OrbWorldProvider({ children }) {
  const [orbState, setOrbState] = useState(ORB_STATE_CLOSED);
  const closeTimerRef = useRef(null);

  // ── Open Orb World ─────────────────────────────────────────
  const openOrbWorld = useCallback((options = {}) => {
    const opts = options && typeof options === "object"
      ? options
      : { continuityCarry: options ? { world: options } : {} };
    const {
      source           = "orb-button",
      originTab        = "feed",
      worldTemperature = "calm_flowing",
      atmosphereId     = null,
      continuityCarry  = {},
    } = opts;
    // Safety: never route to invalid tab keys
    const safeOriginTab = assertValidTab(originTab) ? originTab : "feed";

    // Clear any pending close timer
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    const next = buildOpenOrbState({
      originTab: safeOriginTab, worldTemperature, atmosphereId, continuityCarry, source,
    });

    console.log("[HUI ORB] open", {
      source,
      originTab: safeOriginTab,
      worldTemperature,
      atmosphereId,
      openedAt: new Date(next.openedAt).toISOString(),
    });

    setOrbState(next);
  }, []);

  // ── Close Orb World ────────────────────────────────────────
  const closeOrbWorld = useCallback((reason = "user-close") => {
    setOrbState(prev => {
      const next = buildCloseOrbState(prev);

      console.log("[HUI ORB] close", {
        reason,
        originTab:        prev.originTab,
        wasOpen:          prev.isOpen,
        durationMs:       prev.openedAt ? Date.now() - prev.openedAt : 0,
        continuityCarry:  prev.continuityCarry,
      });

      return next;
    });

    // Phase 15.2: run environment cleanup AFTER close animation (900ms)
    // This catches any stray body locks / overlays the orb may have set
    cleanupOrbEnvironment({ reason, afterMs: 900 });
  }, []);

  // ── Derived tokens (memoized) ──────────────────────────────
  const backdrop = useMemo(() =>
    orbBackdropTokens(orbState.isOpen, orbState.worldTemperature),
  [orbState.isOpen, orbState.worldTemperature]);

  const navDrift = useMemo(() =>
    orbNavDriftTokens(orbState.isOpen, orbState.worldTemperature),
  [orbState.isOpen, orbState.worldTemperature]);

  // ── Context value ──────────────────────────────────────────
  const value = useMemo(() => ({
    orbState:      validateOrbState(orbState),
    openOrbWorld,
    closeOrbWorld,
    backdrop,
    navDrift,
    isOrbOpen:     orbState.isOpen,
    originTab:     orbState.originTab,
  }), [orbState, openOrbWorld, closeOrbWorld, backdrop, navDrift]);

  return (
    <OrbWorldCtx.Provider value={value}>
      {children}
    </OrbWorldCtx.Provider>
  );
}
