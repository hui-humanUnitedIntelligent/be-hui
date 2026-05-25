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
import {
  normalizeWorkRow,
  normalizeExperienceRow,
  normalizeBeitragRow,
  normalizeInvitationRow,
  normalizeFeedPostRow,
  normalizeStoryRow,
  normalizeConnectionRow,
} from "../system/feed/feedNormalizer.js";
import { subscribeFeedRefresh } from "../lib/publishContract.js";

// ─── Konstanten ──────────────────────────────────────────────────────────────
const PAGE_SIZE          = 20;   // Items pro Seite
const PREFETCH_THRESHOLD = 0.70; // 70% gescrollt → prefetch
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
export async function fetchFeedPage(userId, cursor = null) {
  /**
   * cursor = ISO timestamp (created_at des ältesten Items auf letzter Seite)
   * Lädt PAGE_SIZE Items über alle 4 Quellen.
   * Jede Quelle bekommt PAGE_SIZE/2 Slots und wird zeitbasiert gemischt.
   */
  const limit = PAGE_SIZE;

  const rangeFilter = (q) => cursor
    ? q.lt("created_at", cursor)
    : q;

  const now = new Date().toISOString();

  const [worksRes, expsRes, beitrRes, invRes, feedPostsRes, storiesRes, connectionsRes] = await Promise.allSettled([
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

    rangeFilter(
      supabase.from("invitations")
        .select(`id,user_id,text,title,vibe,mood,energy,
               location,city,time_label,starts_at,expires_at,
               visibility,status,max_participants,content_type,created_at,
               profile:profiles(id,display_name,avatar_url,talent,location_label)`)
        .eq("status", "active")
        .eq("visibility", "public")
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(4)
    ),

    rangeFilter(
      supabase.from("feed_posts")
        .select(`id,user_id,caption,media_url,media_type,mood,location,is_archived,created_at`)
        .eq("is_archived", false)
        .order("created_at", { ascending: false })
        .limit(limit)
    ),

    rangeFilter(
      supabase.from("stories")
        .select("id,user_id,media_url,media_type,caption,text_overlay,mood,location,mood_tags,is_highlight,expires_at,created_at")
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order("created_at", { ascending: false })
        .limit(limit)
    ),

    rangeFilter(
      supabase.from("connections")
        .select("id,user_id,type,title,description,date,time,location,max_participants,cost,mood,visibility,openness,status,created_at")
        .eq("status", "active")
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(limit)
    ),
  ]);

  const errors = [];
  const readRows = (label, result) => {
    if (result.status === "rejected") {
      const message = result.reason?.message || String(result.reason || "unknown error");
      errors.push(`${label}: ${message}`);
      console.error("[HUI_STREAM_QUERY_ERROR]", label, result.reason);
      return [];
    }
    if (result.value?.error) {
      const err = result.value.error;
      errors.push(`${label}: ${err.message || err.code || "query failed"}`);
      console.error("[HUI_STREAM_QUERY_ERROR]", label, {
        code: err.code,
        message: err.message,
        details: err.details,
        hint: err.hint,
      });
      return [];
    }
    return Array.isArray(result.value?.data) ? result.value.data : [];
  };

  const works       = readRows("works", worksRes);
  const exps        = readRows("experiences", expsRes);
  const beitr       = readRows("beitraege", beitrRes);
  const invs        = readRows("invitations", invRes);
  const feedPosts   = readRows("feed_posts", feedPostsRes);
  const stories     = readRows("stories", storiesRes);
  const connections = readRows("connections", connectionsRes);

  // Normalisieren
  const normalized = [
    ...works.map(normalizeWorkRow).filter(Boolean),
    ...exps.map(normalizeExperienceRow).filter(Boolean),
    ...beitr.map(normalizeBeitragRow).filter(Boolean),
    ...invs.map(normalizeInvitationRow).filter(Boolean),
    ...feedPosts.map(normalizeFeedPostRow).filter(Boolean),
    ...stories.map(normalizeStoryRow).filter(Boolean),
    ...connections.map(normalizeConnectionRow).filter(Boolean),
  ];

  // Zeitsortiert
  normalized.sort((a, b) => {
    const ta = a._raw?.created_at ? new Date(a._raw.created_at).getTime() : 0;
    const tb = b._raw?.created_at ? new Date(b._raw.created_at).getTime() : 0;
    return tb - ta;
  });

  const pageItems = normalized.slice(0, PAGE_SIZE);

  // Neuer Cursor = created_at des ältesten Items dieser Seite
  const nextCursor = pageItems.length > 0
    ? pageItems[pageItems.length - 1]._raw?.created_at || null
    : null;

  const sourceCounts = [works, exps, beitr, invs, feedPosts, stories, connections].map(rows => rows.length);
  const hasMore = normalized.length > PAGE_SIZE || sourceCounts.some(count => count >= limit);

  return { items: pageItems, nextCursor, hasMore, errors };
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
  const itemsRef          = useRef([]);

  // ── Safeguard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Rhythmisierung (nur bei items-Änderung, nicht bei pending) ────────────
  useEffect(() => {
    itemsRef.current = items;
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
      const { items: newItems, nextCursor, hasMore: more, errors } = await fetchFeedPage(user.id);
      if (!mountedRef.current) return;
      cursorRef.current = nextCursor;
      setHasMore(more);
      setItems(newItems);
      setError(errors?.length ? `Feed teilweise geladen: ${errors.join(" | ")}` : null);
    } catch (err) {
      if (!mountedRef.current) return;
      console.error("[HUI_STREAM] initial load error:", err.message);
      setError(err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { initialLoad(); }, [initialLoad]);

  // ── Silent Refresh (Cache war fresh — update im Hintergrund) ──────────────
  async function _silentRefresh(userId) {
    try {
      const { items: fresh, nextCursor, hasMore: more, errors } = await fetchFeedPage(userId);
      if (!mountedRef.current) return;
      // Nur aktualisieren wenn sich was geändert hat
      const freshIds  = fresh.map(i => i.id).join(",");
      const currentIds = itemsRef.current.map(i => i.id).join(",");
      if (freshIds !== currentIds) {
        cursorRef.current = nextCursor;
        setHasMore(more);
        setItems(fresh);
      }
      setError(errors?.length ? `Feed teilweise geladen: ${errors.join(" | ")}` : null);
    } catch (err) {
      console.error("[HUI_STREAM] silent refresh error:", err?.message || err);
      if (mountedRef.current) setError(err?.message || "Feed konnte nicht aktualisiert werden");
    }
  }

  // ── Load More (Pagination) ─────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!user?.id || loadingMore || !hasMore) return;

    // Prefetch bereits vorhanden? → sofort einfügen
    if (prefetchedRef.current) {
      const { items: nextItems, nextCursor, hasMore: more, errors } = prefetchedRef.current;
      prefetchedRef.current = null;
      if (!mountedRef.current) return;
      setItems(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const deduped = nextItems.filter(i => !existingIds.has(i.id));
        return [...prev, ...deduped];
      });
      cursorRef.current = nextCursor;
      setHasMore(more);
      setError(errors?.length ? `Feed teilweise geladen: ${errors.join(" | ")}` : null);
      // Neuen Prefetch anstoßen
      _schedulePrefetch(user.id);
      return;
    }

    setLoadingMore(true);
    try {
      const { items: nextItems, nextCursor, hasMore: more, errors } =
        await fetchFeedPage(user.id, cursorRef.current);
      if (!mountedRef.current) return;
      setItems(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const deduped = nextItems.filter(i => !existingIds.has(i.id));
        return [...prev, ...deduped];
      });
      cursorRef.current = nextCursor;
      setHasMore(more);
      setError(errors?.length ? `Feed teilweise geladen: ${errors.join(" | ")}` : null);
    } catch (err) {
      console.error("[HUI_STREAM] loadMore error:", err.message);
      if (mountedRef.current) setError(err.message || "Weitere Feed-Inhalte konnten nicht geladen werden");
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
        if (result.errors?.length) {
          console.error("[HUI_STREAM] prefetch query errors:", result.errors);
          if (mountedRef.current) setError(`Feed teilweise geladen: ${result.errors.join(" | ")}`);
        }
      } catch (err) {
        console.error("[HUI_STREAM] prefetch error:", err?.message || err);
        if (mountedRef.current) setError(err?.message || "Feed-Prefetch fehlgeschlagen");
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

    // Live-Inhalte werden direkt sichtbar. Dedupe verhindert doppelte Inserts,
    // wenn ein Publish zusätzlich einen manuellen Refresh auslöst.
    setItems(prev => {
      const exists = prev.find(i => i.id === normalized.id);
      if (exists) return prev;
      return [normalized, ...prev];
    });
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
        table: "works",
        filter: "status=eq.published",
      }, (payload) => {
        if (!mountedRef.current) return;
        _receiveLiveItem(payload.new, normalizeWorkRow);
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
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "feed_posts",
      }, (payload) => {
        if (!mountedRef.current) return;
        if (payload.new?.is_archived) return;
        _receiveLiveItem(payload.new, normalizeFeedPostRow);
      })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "stories",
      }, (payload) => {
        if (!mountedRef.current) return;
        const story = payload.new;
        if (story.expires_at && new Date(story.expires_at) < new Date()) return;
        _receiveLiveItem(story, normalizeStoryRow);
      })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "connections",
        filter: "visibility=eq.public",
      }, (payload) => {
        if (!mountedRef.current) return;
        const connection = payload.new;
        if (connection.status && connection.status !== "active") return;
        _receiveLiveItem(connection, normalizeConnectionRow);
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("[HUI_STREAM] Realtime Channel Error — Feed läuft ohne Live-Updates weiter");
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

  useEffect(() => {
    return subscribeFeedRefresh(() => {
      refresh();
    });
  }, [refresh]);

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
