// src/lib/intelligence/persistence/useLivingMemory.js
// HUI Living Memory Hook v1
//
// Single hook that:
//   1. Hydrates memory store once on mount (lazy, non-blocking)
//   2. Builds viewerContext (never null)
//   3. Exposes recordInteraction, recordDwell
//   4. Provides memoized relationship selectors
//   5. Tracks dwell time via IntersectionObserver (scroll-safe)
//
// Performance contract:
//   - No synchronous re-renders on every interaction
//   - Writes throttled (800ms) + debounced (400ms)
//   - viewerContext only re-derived when feed changes or user changes
//   - Dwell tracking: passive intersection + requestIdleCallback

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { recordMemory, recordDwell, hydrateStore } from "./interactionMemoryStore.js";
import { buildViewerContext, buildAnonymousViewerContext } from "./viewerContext.js";

// Idle callback shim (Safari doesn't support requestIdleCallback)
const rIC = typeof requestIdleCallback !== "undefined"
  ? requestIdleCallback
  : (fn) => setTimeout(fn, 60);

// ═══════════════════════════════════════════════════════════════════════════
// useLivingMemory
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @param {object|null} profile       — user profile from AuthContext (can be null)
 * @param {string[]}    feedCreatorIds — creator IDs visible in current feed
 * @returns {LivingMemoryAPI}
 */
export function useLivingMemory(profile, feedCreatorIds = []) {
  const viewerId   = profile?.id || null;
  const stableIds  = useMemo(
    () => feedCreatorIds.filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [feedCreatorIds.join(",")]  // stable reference: only recompute if IDs change
  );

  // ── Hydration (once per viewerId, non-blocking) ───────────────────────
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!viewerId || hydratedRef.current) return;
    rIC(() => {
      hydrateStore(viewerId);
      hydratedRef.current = true;
    });
  }, [viewerId]);

  // ── viewerContext — memoized, only re-derives when profile/feedIds change
  const viewerContext = useMemo(() => {
    if (!profile?.id) return buildAnonymousViewerContext();
    return buildViewerContext(profile, stableIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, stableIds, profile?.dna_tags?.join?.(",")]);

  // ── Record interaction (stable ref — no re-renders) ──────────────────
  const record = useCallback((creatorId, field, amount = 1) => {
    if (!viewerId || !creatorId) return;
    recordMemory(viewerId, creatorId, field, amount);
  }, [viewerId]);

  // ── Record dwell (stable ref) ─────────────────────────────────────────
  const dwell = useCallback((creatorId, ms) => {
    if (!viewerId || !creatorId) return;
    recordDwell(viewerId, creatorId, ms);
  }, [viewerId]);

  // ── Reaction → memory event mapper ───────────────────────────────────
  const recordReaction = useCallback((creatorId, reactionType) => {
    if (!viewerId || !creatorId) return;
    const fieldMap = {
      resonanz:   "resonanzGiven",
      berührt:    "berührtGiven",
      inspiriert: "inspiredGiven",
      saved:      "savedWorks",
    };
    const field = fieldMap[reactionType];
    if (field) recordMemory(viewerId, creatorId, field);
  }, [viewerId]);

  // ── Profile visit ─────────────────────────────────────────────────────
  const recordProfileVisit = useCallback((creatorId) => {
    if (!viewerId || !creatorId || creatorId === viewerId) return;
    recordMemory(viewerId, creatorId, "profileVisits");
  }, [viewerId]);

  // ── Get relationship depth for a specific creator ─────────────────────
  const getRelationshipDepth = useCallback((creatorId) => {
    if (!creatorId || !viewerContext.relationshipDepths) return null;
    return viewerContext.relationshipDepths[creatorId] || null;
  }, [viewerContext]);

  return {
    viewerContext,          // rich viewer context (never null)
    record,                 // recordMemory(creatorId, field, amount)
    dwell,                  // recordDwell(creatorId, ms)
    recordReaction,         // recordReaction(creatorId, 'resonanz'|'berührt'|'inspiriert')
    recordProfileVisit,     // recordProfileVisit(creatorId)
    getRelationshipDepth,   // getRelationshipDepth(creatorId) → tokens | null
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// useDwellTracker — measures time spent on a card element
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Attach to a card container ref. Measures visible dwell time.
 * Non-blocking: uses IntersectionObserver + visibilitychange.
 *
 * @param {string} viewerId
 * @param {string} creatorId
 * @returns {{ ref: React.RefObject }}
 */
export function useDwellTracker(viewerId, creatorId) {
  const ref        = useRef(null);
  const enteredAt  = useRef(null);

  useEffect(() => {
    if (!ref.current || !viewerId || !creatorId || viewerId === creatorId) return;

    const el = ref.current;

    const flush = () => {
      if (enteredAt.current) {
        const ms = Date.now() - enteredAt.current;
        enteredAt.current = null;
        if (ms > 200) recordDwell(viewerId, creatorId, ms);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          enteredAt.current = Date.now();
        } else {
          flush();
        }
      },
      { threshold: 0.4 }  // 40% visible before counting
    );

    observer.observe(el);

    // Flush when page hidden (iOS Safari backgrounding)
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onHide, { passive: true });

    return () => {
      flush();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [viewerId, creatorId]);

  return { ref };
}
