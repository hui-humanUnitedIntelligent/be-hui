/**
 * useFeedStream — Phase 4F: Living Feed Infrastructure
 *
 * Kein Reload. Kein Poppen. Kein Sterben beim Tab-Wechsel.
 * Ein lebender Strom.
 *
 * Features:
 *  - Cursor-based Pagination (20 items initial, +15 bei Scroll)
 *  - Prefetch: lädt nächste Seite wenn User bei 70% angelangt
 *  - Soft Hydration: neue Items akkumuliert, Tap → sanfter Insert
 *  - Realtime: beitraege / invitations / experiences live updates
 *  - Feed Cache: Tab-Wechsel zerstört nichts (sessionStorage + in-memory)
 *  - Scroll Restore: kehrt zur letzten Position zurück
 *  - Idle Loading: requestIdleCallback für prefetch
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase }        from "../lib/supabaseClient.js";
import { useAuth }         from "../lib/AuthContext.jsx";
import { rhythmizeFeed }   from "./feedRhythmEngine.js";
import { reportRealtimeFailure, reportRuntimeError } from "../lib/runtimeDebug.js";
import {
  normalizeWorkRow,
  normalizeExperienceRow,
  normalizeBeitragRow,
  normalizeInvitationRow,
} from "../system/feed/feedNormalizer.js";

// ─── Konstanten ──────────────────────────────────────────────────────────────
const PAGE_SIZE          = 20;   // Items pro Seite
const PREFETCH_THRESHOLD = 0.70; // 70% gescrollt → prefetch
const SOFT_HYDRATE_DELAY = 800;  // ms Debounce bevor "N neue" Badge erscheint
const CACHE_KEY          = "hui_feed_cache_v4f";
const CACHE_TTL_MS       = 5 * 60 * 1000; // 5 Minuten

// ─── Cache Helpers ────────────────────────────────────────────────────────────
function saveCache(items, cursor) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      items,
      cursor,
      ts: Date.now(),
    }));
  } catch (_) { /* storage full — ignore */ }
}

function loadCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed;
  } catch (_) { return null; }
}

function clearCache() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch (_) {}
}

// ─── Scroll Position ──────────────────────────────────────────────────────────
const _scrollPos = { y: 0 };
export function saveFeedScrollPos(y) { _scrollPos.y = y; }
export function getFeedScrollPos()   { return _scrollPos.y; }

// ─── Batch-Query: eine Seite laden ───────────────────────────────────────────
async function fetchFeedPage(userId, cursor = null) {
  /**
   * cursor = ISO timestamp (created_at des ältesten Items auf letzter Seite)
   * Lädt PAGE_SIZE Items über alle 4 Quellen.
   * Jede Quelle bekommt PAGE_SIZE/2 Slots und wird zeitbasiert gemischt.
   */
  const limit = Math.ceil(PAGE_SIZE / 2); // 10 pro Quelle

  const rangeFilter = (q) => cursor
    ? q.lt("created_at", cursor)
    : q;

  const [worksRes, expsRes, beitrRes, invRes] = await Promise.allSettled([
    rangeFilter(
      supabase.from("works")
        .select(`id,title,cover_url,media_url,category,description,
                 caption,tags,price,status,user_id,creator_id,created_at,
                 profile:profiles(id,display_name,avatar_url,talent,location_label)`)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(limit)
    ),

    rangeFilter(
      supabase.from("experiences")
        .select(`id,title,cover_url,media_url,category,description,
                 price,duration,format,location_text,date,
                 booking_mode,pricing_type,experience_type,
                 participant_limit,max_participants,
                 mood,mood_tags,social_energy,
                 status,visibility,user_id,created_at,
                 profile:profiles(id,display_name,avatar_url,talent,location_label)`)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(limit)
    ),

    rangeFilter(
      supabase.from("beitraege")
        .select("id,user_id,src,type,caption,created_at")
        .order("created_at", { ascending: false })
        .limit(limit)
    ),

    // Invitations: nicht cursor-basiert (expires_at filter ist wichtiger)
    supabase.from("invitations")
      .select(`id,user_id,text,title,vibe,mood,energy,
               location,city,time_label,starts_at,expires_at,
               visibility,status,max_participants,content_type,created_at,
               profile:profiles(id,display_name,avatar_url,talent,location_label)`)
      .eq("status", "active")
      .eq("visibility", "public")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(2),  // Max 2 Invitations pro Seite
  ]);

  const works = worksRes.status === "fulfilled" ? (worksRes.value?.data || []) : [];
  const exps  = expsRes.status  === "fulfilled" ? (expsRes.value?.data  || []) : [];
  const beitr = beitrRes.status === "fulfilled" ? (beitrRes.value?.data || []) : [];
  const invs  = invRes.status   === "fulfilled" ? (invRes.value?.data   || []) : [];

  // Normalisieren
  const normalized = [
    ...works.map(normalizeWorkRow).filter(Boolean),
    ...exps.map(normalizeExperienceRow).filter(Boolean),
    ...beitr.map(normalizeBeitragRow).filter(Boolean),
    ...invs.map(normalizeInvitationRow).filter(Boolean),
  ];

  // Zeitsortiert
  normalized.sort((a, b) => {
    const ta = a._raw?.created_at ? new Date(a._raw.created_at).getTime() : 0;
    const tb = b._raw?.created_at ? new Date(b._raw.created_at).getTime() : 0;
    return tb - ta;
  });

  // Neuer Cursor = created_at des ältesten Items dieser Seite
  const nextCursor = normalized.length > 0
    ? normalized[normalized.length - 1]._raw?.created_at || null
    : null;

  const hasMore = normalized.length >= PAGE_SIZE;

  return { items: normalized, nextCursor, hasMore };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useFeedStream() {
  const { user } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [items,          setItems]          = useState([]);
  const [rhythmicItems,  setRhythmicItems]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [loadingMore,    setLoadingMore]     = useState(false);
  const [hasMore,        setHasMore]        = useState(true);
  const [error,          setError]          = useState(null);
  const [pendingItems,   setPendingItems]   = useState([]);  // Soft Hydration Queue
  const [pendingCount,   setPendingCount]   = useState(0);   // Badge "N neue"

  // ── Refs ───────────────────────────────────────────────────────────────────
  const cursorRef         = useRef(null);     // Letzter Paginierungs-Cursor
  const prefetchedRef     = useRef(null);     // Vorgeladene nächste Seite
  const prefetchingRef    = useRef(false);    // Prefetch läuft gerade
  const realtimeRef       = useRef(null);     // Supabase Realtime Channel
  const softHydrateTimer  = useRef(null);     // Debounce für Badge
  const idleCallbackRef   = useRef(null);     // requestIdleCallback ID
  const mountedRef        = useRef(true);

  // ── Safeguard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Rhythmisierung (nur bei items-Änderung, nicht bei pending) ────────────
  useEffect(() => {
    if (items.length === 0) { setRhythmicItems([]); return; }
    const rhythmic = rhythmizeFeed([...items]);
    setRhythmicItems(rhythmic);
    saveCache(items, cursorRef.current);
  }, [items]);

  // ── Initial Load (mit Cache) ───────────────────────────────────────────────
  const initialLoad = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setError(null);

    // Cache prüfen — sofort rendern wenn fresh
    const cached = loadCache();
    if (cached?.items?.length > 0) {
      setItems(cached.items);
      cursorRef.current = cached.cursor;
      setLoading(false);
      // Trotzdem im Hintergrund refreshen (silent)
      _silentRefresh(user.id);
      return;
    }

    setLoading(true);
    try {
      const { items: newItems, nextCursor, hasMore: more } = await fetchFeedPage(user.id);
      if (!mountedRef.current) return;
      cursorRef.current = nextCursor;
      setHasMore(more);
      setItems(newItems);
    } catch (err) {
      if (!mountedRef.current) return;
      console.error("[HUI_STREAM] initial load error:", err.message);
      setError(err.message);
      reportRuntimeError({
        flow: "feed",
        step: "initial-load",
        entity: "feed",
        error: err,
        message: err.message,
      });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { initialLoad(); }, [initialLoad]);

  // ── Silent Refresh (Cache war fresh — update im Hintergrund) ──────────────
  async function _silentRefresh(userId) {
    try {
      const { items: fresh, nextCursor } = await fetchFeedPage(userId);
      if (!mountedRef.current) return;
      // Nur aktualisieren wenn sich was geändert hat
      const freshIds  = fresh.map(i => i.id).join(",");
      const currentIds = items.map(i => i.id).join(",");  // closure, okay hier
      if (freshIds !== currentIds) {
        cursorRef.current = nextCursor;
        setItems(fresh);
      }
    } catch (err) {
      reportRuntimeError({
        flow: "feed",
        step: "silent-refresh",
        entity: "feed",
        error: err,
        message: err?.message || "Feed Refresh fehlgeschlagen",
      });
    }
  }

  // ── Load More (Pagination) ─────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!user?.id || loadingMore || !hasMore) return;

    // Prefetch bereits vorhanden? → sofort einfügen
    if (prefetchedRef.current) {
      const { items: nextItems, nextCursor, hasMore: more } = prefetchedRef.current;
      prefetchedRef.current = null;
      if (!mountedRef.current) return;
      setItems(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const deduped = nextItems.filter(i => !existingIds.has(i.id));
        return [...prev, ...deduped];
      });
      cursorRef.current = nextCursor;
      setHasMore(more);
      // Neuen Prefetch anstoßen
      _schedulePrefetch(user.id);
      return;
    }

    setLoadingMore(true);
    try {
      const { items: nextItems, nextCursor, hasMore: more } =
        await fetchFeedPage(user.id, cursorRef.current);
      if (!mountedRef.current) return;
      setItems(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const deduped = nextItems.filter(i => !existingIds.has(i.id));
        return [...prev, ...deduped];
      });
      cursorRef.current = nextCursor;
      setHasMore(more);
    } catch (err) {
      console.error("[HUI_STREAM] loadMore error:", err.message);
      reportRuntimeError({
        flow: "feed",
        step: "load-more",
        entity: "feed",
        error: err,
        message: err.message,
      });
    } finally {
      if (mountedRef.current) setLoadingMore(false);
    }
  }, [user?.id, loadingMore, hasMore]);

  // ── Prefetch (Idle) ───────────────────────────────────────────────────────
  const _schedulePrefetch = useCallback((userId) => {
    if (prefetchingRef.current || !hasMore || !cursorRef.current) return;
    prefetchingRef.current = true;

    const run = async () => {
      try {
        const result = await fetchFeedPage(userId, cursorRef.current);
        if (mountedRef.current) prefetchedRef.current = result;
      } catch (err) {
        reportRuntimeError({
          flow: "feed",
          step: "prefetch",
          entity: "feed",
          error: err,
          message: err?.message || "Feed Prefetch fehlgeschlagen",
        });
      }
      finally { prefetchingRef.current = false; }
    };

    if (typeof requestIdleCallback !== "undefined") {
      idleCallbackRef.current = requestIdleCallback(run, { timeout: 3000 });
    } else {
      setTimeout(run, 1000);
    }
  }, [hasMore]);

  // ── Soft Hydration: neue Items aus Realtime akkumulieren ──────────────────
  const _receiveLiveItem = useCallback((rawItem, normalizer) => {
    const normalized = normalizer(rawItem);
    if (!normalized) return;

    // Existiert bereits? → update statt duplizieren
    setItems(prev => {
      const exists = prev.find(i => i.id === normalized.id);
      if (exists) return prev;  // kein Duplicate
      return prev;  // noch nicht einbauen — erst in pending
    });

    // In pending queue
    setPendingItems(prev => {
      if (prev.find(i => i.id === normalized.id)) return prev;
      return [normalized, ...prev];
    });

    // Debounce Badge
    clearTimeout(softHydrateTimer.current);
    softHydrateTimer.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setPendingCount(prev => prev + 1);
    }, SOFT_HYDRATE_DELAY);
  }, []);

  // ── Soft Hydration: Items einbauen (User-Tap) ────────────────────────────
  const flushPendingItems = useCallback(() => {
    if (pendingItems.length === 0) return;
    setItems(prev => {
      const existingIds = new Set(prev.map(i => i.id));
      const newOnes = pendingItems.filter(i => !existingIds.has(i.id));
      return [...newOnes, ...prev];
    });
    setPendingItems([]);
    setPendingCount(0);
  }, [pendingItems]);

  // ── Realtime Setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    // Cleanup vorheriger Channel
    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current);
      realtimeRef.current = null;
    }

    realtimeRef.current = supabase
      .channel("hui_feed_realtime_v4f")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "beitraege",
      }, (payload) => {
        if (!mountedRef.current) return;
        _receiveLiveItem(payload.new, normalizeBeitragRow);
      })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "invitations",
        filter: "visibility=eq.public",
      }, (payload) => {
        if (!mountedRef.current) return;
        const inv = payload.new;
        // Nur aktive, nicht abgelaufene
        if (inv.status !== "active") return;
        if (inv.expires_at && new Date(inv.expires_at) < new Date()) return;
        _receiveLiveItem(inv, normalizeInvitationRow);
      })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "experiences",
        filter: "status=eq.published",
      }, (payload) => {
        if (!mountedRef.current) return;
        _receiveLiveItem(payload.new, normalizeExperienceRow);
      })
      .subscribe((status, error) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          console.warn("[HUI_STREAM] Realtime Channel Error — Feed läuft ohne Live-Updates weiter");
          reportRealtimeFailure({
            flow: "feed",
            step: "feed-subscribe",
            entity: "feed",
            channel: "hui_feed_realtime_v4f",
            error,
            message: `Feed Realtime Status: ${status}`,
          });
        }
      });

    return () => {
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }
      clearTimeout(softHydrateTimer.current);
      if (typeof cancelIdleCallback !== "undefined" && idleCallbackRef.current) {
        cancelIdleCallback(idleCallbackRef.current);
      }
    };
  }, [user?.id, _receiveLiveItem]);

  // ── Prefetch bei 70% Scroll (wird von ScrollSentinel aufgerufen) ──────────
  const onScrollProgress = useCallback((progress) => {
    if (progress >= PREFETCH_THRESHOLD && user?.id) {
      _schedulePrefetch(user.id);
    }
  }, [user?.id, _schedulePrefetch]);

  // ── Hard Refresh (pull-to-refresh, manuell) ────────────────────────────────
  const refresh = useCallback(async () => {
    clearCache();
    cursorRef.current = null;
    prefetchedRef.current = null;
    setPendingItems([]);
    setPendingCount(0);
    await initialLoad();
  }, [initialLoad]);

  return {
    // Items
    items:          rhythmicItems,   // Rhythmisiert, fertig zum Rendern
    rawItems:       items,           // Unverarbeitet (für Debug)
    loading,
    loadingMore,
    hasMore,
    error,

    // Pagination
    loadMore,
    onScrollProgress,

    // Soft Hydration
    pendingCount,
    flushPendingItems,

    // Utils
    refresh,
  };
}
