// src/context/WorldSurfaceContext.jsx
// HUI World Surface Context v1 — Phase 16.2
//
// Single source of truth for overlay/blur/feed/nav lifecycle.
// Mounted ONCE at App root — survives all tab/route changes.
//
// API:
//   openSurface(id)       → Phase 1: snapshot + lock (no blur yet)
//   confirmSurface(id)    → Phase 2: blur + dim + nav (after mount)
//   closeSurface(id)      → Full world restore
//   forceRecoverWorld()   → Emergency: immediate reset
//   worldTokens           → Derived CSS for feed, nav, dim

import React, {
  createContext, useContext, useState, useCallback,
  useRef, useMemo, useEffect,
} from "react";
import {
  WORLD_STATE_CLOSED,
  buildOpeningState,
  buildConfirmedState,
  buildClosedState,
  deriveWorldTokens,
  snapshotWorldState,
  validateSurfaceId,
  getMountTimeout,
} from "../lib/world/worldSurfaceController.js";
import { cleanupOrbEnvironment } from "../lib/cleanup/cleanupOrbEnvironment.js";

const isDev = import.meta.env?.DEV ?? false;

const WorldSurfaceCtx = createContext(null);
const FALLBACK_TOKENS = deriveWorldTokens(WORLD_STATE_CLOSED);

export function useWorldSurface() {
  const ctx = useContext(WorldSurfaceCtx);
  if (!ctx) {
    return {
      worldState:        WORLD_STATE_CLOSED,
      worldTokens:       FALLBACK_TOKENS,
      openSurface:       () => {},
      closeSurface:      () => {},
      confirmSurface:    () => {},
      forceRecoverWorld: () => {},
      snapshotWorld:     () => snapshotWorldState(WORLD_STATE_CLOSED),
      activeSurface:     null,
      isWorldOpen:       false,
    };
  }
  return ctx;
}

export function WorldSurfaceProvider({ children }) {
  const [worldState, setWorldState] = useState(WORLD_STATE_CLOSED);
  const recoveryTimerRef = useRef(null);
  const activeIdRef      = useRef(null);

  const clearRecovery = useCallback(() => {
    if (recoveryTimerRef.current) {
      clearTimeout(recoveryTimerRef.current);
      recoveryTimerRef.current = null;
    }
  }, []);

  // ── forceRecoverWorld — emergency reset ────────────────────────
  const forceRecoverWorld = useCallback((reason = "forced") => {
    clearRecovery();
    activeIdRef.current = null;
    setWorldState(prev => {
      if (!prev.activeSurface && !prev.blurActive) return prev;
      if (isDev) {
        console.log("[WORLD SURFACE] world restored", {
          reason,
          was:         prev.activeSurface,
          blurActive:  prev.blurActive,
          feedRestored: "opacity→1",
          navRestored:  "translateY→0",
          blurRemoved:  "filter→none",
          focusReset:   "pointer-events→auto",
        });
      }
      return buildClosedState(prev);
    });
    cleanupOrbEnvironment({ reason: `surface-recovery-${reason}` });
    if (isDev) console.log("[WORLD SURFACE] feed restored | nav restored | blur removed | focus reset");
  }, [clearRecovery]);

  // ── openSurface — Phase 1: snapshot + lock ────────────────────
  const openSurface = useCallback((surfaceId, _opts = {}) => {
    if (!validateSurfaceId(surfaceId)) return;
    clearRecovery();
    setWorldState(prev => {
      const next = buildOpeningState(prev, surfaceId);
      if (isDev) {
        console.log("[WORLD SURFACE] openSurface", {
          surfaceId,
          previous: prev.activeSurface,
          blurActive: next.blurActive,  // false — not yet confirmed
        });
      }
      return next;
    });
    activeIdRef.current = surfaceId;

    // Auto-recovery if surface never calls confirmSurface
    const timeout = getMountTimeout(surfaceId);
    recoveryTimerRef.current = setTimeout(() => {
      setWorldState(current => {
        if (current.activeSurface !== surfaceId || current.overlayConfirmed) {
          return current;
        }
        console.warn("[WORLD SURFACE] recovery triggered", {
          surfaceId, reason: "mount-timeout", afterMs: timeout,
        });
        cleanupOrbEnvironment({ reason: `mount-timeout-${surfaceId}` });
        return buildClosedState(current);
      });
      activeIdRef.current = null;
    }, timeout);
  }, [clearRecovery]);

  // ── confirmSurface — Phase 2: blur + feed + nav ───────────────
  const confirmSurface = useCallback((surfaceId) => {
    setWorldState(prev => {
      if (prev.activeSurface !== surfaceId) {
        console.warn("[WORLD SURFACE] confirmSurface: mismatch", {
          expected: prev.activeSurface, got: surfaceId,
        });
        return prev;
      }
      if (prev.overlayConfirmed) return prev;
      const next = buildConfirmedState(prev);
      if (isDev) {
        console.log("[WORLD SURFACE] overlay confirmed", {
          surfaceId,
          blurActive:  next.blurActive,
          feedVisible: next.feedVisible,
          navLocked:   next.navLocked,
          mountMs:     prev.openedAt ? Date.now() - prev.openedAt : 0,
        });
      }
      return next;
    });
    clearRecovery();
  }, [clearRecovery]);

  // ── closeSurface — idempotent full restore ────────────────────
  const closeSurface = useCallback((surfaceId = null, reason = "user-close") => {
    clearRecovery();
    activeIdRef.current = null;
    setWorldState(prev => {
      if (!prev.activeSurface && !prev.blurActive) return prev;
      const next = buildClosedState(prev);
      if (isDev) {
        console.log("[WORLD SURFACE] closeSurface", {
          surfaceId: prev.activeSurface,
          reason,
          durationMs: prev.openedAt ? Date.now() - prev.openedAt : 0,
        });
      }
      return next;
    });
    cleanupOrbEnvironment({ reason: `surface-close-${reason}` });
  }, [clearRecovery]);

  const snapshotWorld = useCallback(
    () => snapshotWorldState(worldState),
    [worldState]
  );

  // Safety: cleanup on unmount
  useEffect(() => () => {
    clearRecovery();
    cleanupOrbEnvironment({ reason: "WorldSurfaceProvider-unmount" });
  }, [clearRecovery]);

  // Phase 16.6: Sync world state to window for ErrorBoundary crash diagnostics
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__HUI_WORLD_STATE__ = {
        activeSurface:    worldState.activeSurface    ?? null,
        overlayConfirmed: worldState.overlayConfirmed ?? false,
        feedVisible:      worldState.feedVisible      ?? true,
        blurActive:       worldState.blurActive       ?? false,
        navLocked:        worldState.navLocked         ?? false,
        activeTab:        window.__HUI_WORLD_STATE__?.activeTab ?? "feed",
        repaintPhase:     window.__HUI_WORLD_STATE__?.repaintPhase ?? null,
      };
    }
  }, [worldState]);

  const worldTokens = useMemo(() => deriveWorldTokens(worldState), [worldState]);

  const value = useMemo(() => ({
    worldState,
    worldTokens,
    openSurface,
    closeSurface,
    confirmSurface,
    forceRecoverWorld,
    snapshotWorld,
    activeSurface: worldState.activeSurface,
    isWorldOpen:   worldState.activeSurface !== null,
  }), [worldState, worldTokens, openSurface, closeSurface,
       confirmSurface, forceRecoverWorld, snapshotWorld]);

  return (
    <WorldSurfaceCtx.Provider value={value}>
      {children}
    </WorldSurfaceCtx.Provider>
  );
}
