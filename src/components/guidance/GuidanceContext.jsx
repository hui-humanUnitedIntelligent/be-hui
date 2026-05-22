// src/components/guidance/GuidanceContext.jsx — HUI Guidance Context v1
//
// Single global context for the Guidance System.
// Mounted once at App root. Exposes focusMode, readability adjustments,
// orb guidance state, and imperative control methods.

import React, {
  createContext, useContext, useState, useCallback,
  useMemo, useRef, useEffect,
} from "react";

import {
  FOCUS_MODES, FLOW_DEFAULT_MODE,
  ORB_GUIDANCE_NORMAL, ORB_GUIDANCE_REDUCED,
} from "./guidanceTokens.js";
import { cleanupOrbEnvironment } from "../../lib/cleanup/cleanupOrbEnvironment.js";
import { resolveFocusMode, resolveOrbGuidanceState, focusModeTransitionMs } from
  "../../lib/guidance/focusSystem.js";
import { detectVisualNoise, computeReadabilityAdjustments } from
  "../../lib/guidance/readabilityEngine.js";

// ─────────────────────────────────────────────────────────────────
const GuidanceCtx = createContext(null);

export function useGuidance() {
  const ctx = useContext(GuidanceCtx);
  if (!ctx) {
    // Graceful fallback
    return {
      focusMode:      FOCUS_MODES.immersive,
      readAdj:        computeReadabilityAdjustments(0),
      orbGuidance:    ORB_GUIDANCE_NORMAL,
      isFlowActive:   false,
      enterFlow:      () => {},
      exitFlow:       () => {},
      setFocusMode:   () => {},
      updateReadability: () => {},
    };
  }
  return ctx;
}

// ─────────────────────────────────────────────────────────────────

export function GuidanceProvider({ children }) {
  // ── State ──────────────────────────────────────────────────
  const [focusModeId,  setFocusModeId]  = useState("immersive");
  const [isFlowActive, setIsFlowActive] = useState(false);
  const [flowType,     setFlowType]     = useState(null);
  const [activeTab,    setActiveTab]    = useState("feed");
  const [override,     setOverride]     = useState(null);

  // Readability state — updated by components that know their bg
  const [visualState, setVisualState]   = useState({
    bgLuminance:     0.15,   // dark by default (most HUI screens are dark)
    motionIntensity: 0.45,
    glowDensity:     0.42,
    blurConflict:    0.12,
    ctaContrast:     0.90,
    textReadability: 0.88,
  });

  // ── Derived values ─────────────────────────────────────────
  const focusMode = useMemo(() =>
    resolveFocusMode({ activeTab, isFlowOpen: isFlowActive, flowType, override }),
  [activeTab, isFlowActive, flowType, override]);

  const noiseScore = useMemo(() =>
    detectVisualNoise({ ...visualState, activeFocusMode: focusMode?.id ?? "immersive" }),
  [visualState, focusMode]);

  const readAdj = useMemo(() =>
    computeReadabilityAdjustments(noiseScore),
  [noiseScore]);

  const orbGuidance = useMemo(() =>
    resolveOrbGuidanceState(focusMode, isFlowActive),
  [focusMode, isFlowActive]);

  // ── Handlers ───────────────────────────────────────────────

  const enterFlow = useCallback((type = "membership") => {
    console.log("[HUI GUIDANCE] enterFlow", type);
    setFlowType(type);
    setIsFlowActive(true);
  }, []);

  const exitFlow = useCallback(() => {
    console.log("[HUI GUIDANCE] exitFlow");
    setIsFlowActive(false);
    setFlowType(null);
    setOverride(null);
    // Phase 15.2: ensure environment is always clean after any flow exits
    cleanupOrbEnvironment({ reason: "guidance-exitFlow", afterMs: 300 });
  }, []);

  const setFocusMode = useCallback((modeId) => {
    if (!FOCUS_MODES[modeId]) return;
    setOverride(modeId);
  }, []);

  const updateReadability = useCallback((partialState) => {
    setVisualState(prev => ({ ...prev, ...partialState }));
  }, []);

  const onTabChange = useCallback((tab) => {
    setActiveTab(tab);
    // Tab change clears flow override (natural navigation resets focus)
    if (!isFlowActive) setOverride(null);
  }, [isFlowActive]);

  // ── Context value ──────────────────────────────────────────
  const value = useMemo(() => ({
    focusMode,
    readAdj,
    orbGuidance,
    isFlowActive,
    flowType,
    noiseScore,
    enterFlow,
    exitFlow,
    setFocusMode,
    updateReadability,
    onTabChange,
    // Direct access for debug
    _focusModeId: focusMode?.id,
    _noiseScore:  noiseScore,
  }), [focusMode, readAdj, orbGuidance, isFlowActive, flowType, noiseScore,
       enterFlow, exitFlow, setFocusMode, updateReadability, onTabChange]);

  return (
    <GuidanceCtx.Provider value={value}>
      {children}
    </GuidanceCtx.Provider>
  );
}
