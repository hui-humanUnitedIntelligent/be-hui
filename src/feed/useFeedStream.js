/**
 * useFeedStream — Phase 4F: Living Feed Infrastructure v2
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
  normalizeMomentRow     as normalizeBeitragRow,
  normalizeExperienceRow,
  normalizeWorkRow,
  normalizeEventRow      as normalizeInvitationRow,
} from "../system/feed/unifiedNormalizer.js";

// ─── Konstanten ──────────────────────────────────────────────────────────────
const PAGE_SIZE          = 20;   // Items pro Seite
const PREFETCH_THRESHOLD = 0.70; // 70% gescrollt → prefetch
const SOFT_HYDRATE_DELAY = 800;  // ms Debounce bevor "N neue" Badge erscheint
const CACHE_KEY          = "hui_feed_cache_v5";
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
  // CACHE DISABLED — always fresh load
  try { sessionStorage.removeItem(CACHE_KEY); } catch (_) {}
  return null;
}

function clearCache() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch (_) {}
}

// ─── Scroll Position ──────────────────────────────────────────────────────────
const _scrollPos = { y: 0 };
export function saveFeedScrollPos(y) { _scrollPos.y = y; }
export function getFeedScrollPos()   { return _scrollPos.y; }

// ─── Batch-Query: eine Seite laden ───────────────────────────────────────────
// FEED.2E — Multi-Cursor: cursors = { works, exps, beitr } | null
async function fetchFeedPage(userId = null, cursors = null) {
  console.log("[FEED] START");
  /**
   * Phase 4H — NO PROFILE JOINS
   * Alle Queries ohne relational join zu profiles.
   * Profile werden separat angereichert (optional, nie blockierend).
   */
  const limit = Math.ceil(PAGE_SIZE / 2); // 10 pro Quelle

  // FEED.2E — eigene Cursor pro Quelle statt eines globalen Timestamps
  const worksCursor = cursors?.works || null;
  const expsCursor  = cursors?.exps  || null;
  const beitrCursor = cursors?.beitr || null;
  // invitations: kein Cursor — immer neueste 2 aktive, nicht-abgelaufene
  const filterWorks = (q) => worksCursor ? q.lt("created_at", worksCursor) : q;
  const filterExps  = (q) => expsCursor  ? q.lt("created_at", expsCursor)  : q;
  const filterBeitr = (q) => beitrCursor ? q.lt("created_at", beitrCursor) : q;

  // ── Step 1: Plain queries — kein JOIN ──────────────────────────────────
  console.log("[FEED] QUERY START");
  const [worksRes, expsRes, beitrRes, invRes] = await Promise.allSettled([
    filterWorks(
      supabase.from("works")
        .select("id,title,cover_url,media_url,category,description,caption,tags,price,status,approval_status,user_id,creator_id,created_at")
        .eq("status", "published")
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false })
        .limit(limit)
    ),
    filterExps(
      supabase.from("experiences")
        .select("id,title,cover_url,media_url,category,description,price,duration,format,location_text,date,booking_mode,pricing_type,experience_type,participant_limit,max_participants,mood,mood_tags,social_energy,status,approval_status,visibility,user_id,created_at")
        .eq("status", "published")
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false })
        .limit(limit)
    ),
    filterBeitr(
      supabase.from("beitraege")
        .select("id,user_id,src,type,caption,created_at")
        .order("created_at", { ascending: false })
        .limit(limit)
    ),
    // invitations: kein rangeFilter — immer neueste 2 aktive Einladungen
    supabase.from("invitations")
      .select("id,user_id,text,title,vibe,mood,energy,location,city,time_label,starts_at,expires_at,visibility,status,max_participants,content_type,created_at")
      .eq("status", "active")
      .eq("visibility", "public")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(2),
  ]);
  console.log("[FEED] QUERY DONE");

  const works = worksRes.status === "fulfilled" ? (worksRes.value?.data || []) : [];
  const exps  = expsRes.status  === "fulfilled" ? (expsRes.value?.data  || []) : [];
  const beitr = beitrRes.status === "fulfilled" ? (beitrRes.value?.data || []) : [];
  const invs  = invRes.status   === "fulfilled" ? (invRes.value?.data   || []) : [];

  const beitrErr = beitrRes.status === "rejected"
    ? beitrRes.reason?.message
    : (beitrRes.value?.error?.message || null);
  const worksErr = worksRes.status === "rejected"
    ? worksRes.reason?.message
    : (worksRes.value?.error?.message || null);
  const expsErr = expsRes.status === "rejected"
    ? expsRes.reason?.message
    : (expsRes.value?.error?.message || null);

  console.log("[HUI_STREAM_RAW]", {
    works: works.length, worksErr,
    exps: exps.length, expsErr,
    beitraege: beitr.length, beitrErr,
    invitations: invs.length,
  });

  if (typeof window !== "undefined") {
    window.__HUI_STREAM_DEBUG__ = {
      works: works.length, exps: exps.length,
      beitraege: beitr.length, beitrErr, worksErr, expsErr,
    };
  }

  // ── Step 2: Profile-Enrichment — optional, nie blockierend ─────────────
  const allRows = [...works, ...exps, ...beitr, ...invs];
  const userIds = [...new Set(allRows.map(r => r.user_id || r.creator_id).filter(Boolean))];
  let profileMap = {};

  if (userIds.length > 0) {
    try {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id,display_name,username,avatar_url,talent,location_label,membership_type,membership_active,is_verified")
        .in("id", userIds);
      console.log("[HUI_STREAM_PROFILES]", profileRows?.length ?? 0);
      if (profileRows) {
        profileRows.forEach(p => { profileMap[p.id] = p; });
      }
    } catch (_) {
      // Profile-Enrichment ist optional — Fehler ignorieren
      console.warn("[HUI_STREAM] Profile enrichment failed — continuing without");
    }
  }

  // ── Step 3: Normalisieren (mit injiziertem profile aus profileMap) ──────
  function injectProfile(row) {
    const uid = row.user_id || row.creator_id || null;
    const p   = (uid && profileMap[uid]) ? profileMap[uid] : null;
    return { ...row, profile: p || { id: uid, display_name: "Human", avatar_url: null } };
  }

  const normalizedBeitr = beitr.map(r => normalizeBeitragRow(injectProfile(r))).filter(Boolean);
  const normalized = [
    ...works.map(r => normalizeWorkRow(injectProfile(r))).filter(Boolean),
    ...exps.map(r => normalizeExperienceRow(injectProfile(r))).filter(Boolean),
    ...normalizedBeitr,
    ...invs.map(r => normalizeInvitationRow(injectProfile(r))).filter(Boolean),
  ];

  console.log("[HUI_STREAM_NORMALIZED]", {
    total: normalized.length,
    beitraege_normalized: normalizedBeitr.length,
  });

  // Zeitsortiert
  normalized.sort((a, b) => {
    const ta = a._raw?.created_at ? new Date(a._raw.created_at).getTime() : 0;
    const tb = b._raw?.created_at ? new Date(b._raw.created_at).getTime() : 0;
    return tb - ta;
  });

  // FEED.2E — Cursor pro Quelle: letztes Item jeder Quelle (vor Normalisierung verfügbar)
  // works/exps/beitr existieren bereits aus Step 1 (Z.107-112)
  const nextCursors = {
    works: works.length >= limit ? (works[works.length - 1]?.created_at || null) : null,
    exps:  exps.length  >= limit ? (exps[exps.length   - 1]?.created_at || null) : null,
    beitr: beitr.length >= limit ? (beitr[beitr.length - 1]?.created_at || null) : null,
  };

  // FEED.2E — hasMore: true wenn mind. eine Quelle weitere Items hat
  const hasMore = works.length >= limit || exps.length >= limit || beitr.length >= limit;

  return { items: normalized, nextCursors, hasMore };
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
  const cursorRef         = useRef(null);     // FEED.2E: null | { works, exps, beitr } — Cursor pro Quelle
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
    saveCache(items, cursorRef.current); // FEED.2E: cursorRef.current ist { works, exps, beitr } | null
  }, [items]);

  // ── Initial Load (mit Cache) ───────────────────────────────────────────────
  const initialLoad = useCallback(async () => {
    // Phase 4G: public feed — kein user.id nötig für beitraege / works
    // user.id wird nur für personalisierte Features genutzt (RLS-geschützte Inhalte)
    const userId = user?.id || null;
    setError(null);

    // Cache prüfen — sofort rendern wenn fresh
    const cached = loadCache();
    if (cached?.items?.length > 0) {
      setItems(cached.items);
      cursorRef.current = cached.cursors || null; // FEED.2E: cursors-Objekt (Cache aktuell disabled)
      setLoading(false);
      // Trotzdem im Hintergrund refreshen (silent)
      _silentRefresh(user.id);
      return;
    }

    setLoading(true);
    try {
      const { items: newItems, nextCursors, hasMore: more } = await fetchFeedPage(userId);
      if (!mountedRef.current) return;
      cursorRef.current = nextCursors;
      setHasMore(more);
      setItems(newItems);
    } catch (err) {
      if (!mountedRef.current) return;
      console.error("[HUI_STREAM] initial load error:", err.message);
      console.error("[FEED] ERROR", err);
      setError(err.message);
    } finally {
      console.log("[FEED] FINALLY");
      if (mountedRef.current) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { initialLoad(); }, [initialLoad]);

  // ── Silent Refresh (Cache war fresh — update im Hintergrund) ──────────────
  async function _silentRefresh(userId) {
    try {
      const { items: fresh, nextCursors } = await fetchFeedPage(userId);
      if (!mountedRef.current) return;
      // Nur aktualisieren wenn sich was geändert hat
      const freshIds  = fresh.map(i => i.id).join(",");
      const currentIds = items.map(i => i.id).join(",");  // closure, okay hier
      if (freshIds !== currentIds) {
        cursorRef.current = nextCursors;
        setItems(fresh);
      }
    } catch (_) { /* silent */ }
  }

  // ── Load More (Pagination) ─────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    // Prefetch bereits vorhanden? → sofort einfügen
    if (prefetchedRef.current) {
      const { items: nextItems, nextCursors, hasMore: more } = prefetchedRef.current;
      prefetchedRef.current = null;
      if (!mountedRef.current) return;
      setItems(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const deduped = nextItems.filter(i => !existingIds.has(i.id));
        return [...prev, ...deduped];
      });
      cursorRef.current = nextCursors;
      setHasMore(more);
      // Neuen Prefetch anstoßen
      _schedulePrefetch(user.id);
      return;
    }

    setLoadingMore(true);
    try {
      const { items: nextItems, nextCursors, hasMore: more } =
        await fetchFeedPage(user.id, cursorRef.current);
      if (!mountedRef.current) return;
      setItems(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const deduped = nextItems.filter(i => !existingIds.has(i.id));
        return [...prev, ...deduped];
      });
      cursorRef.current = nextCursors;
      setHasMore(more);
    } catch (err) {
      console.error("[HUI_STREAM] loadMore error:", err.message);
      console.error("[FEED] ERROR", err);
    } finally {
      if (mountedRef.current) setLoadingMore(false);
    }
  }, [user?.id, loadingMore, hasMore]);

  // ── Prefetch (Idle) ───────────────────────────────────────────────────────
  const _schedulePrefetch = useCallback((userId) => {
    // FEED.2E: !cursorRef.current entfernt — cursorRef.current ist jetzt Objekt (immer truthy)
    // hasMore allein entscheidet ob Prefetch sinnvoll ist
    if (prefetchingRef.current || !hasMore) return;
    prefetchingRef.current = true;

    const run = async () => {
      try {
        const result = await fetchFeedPage(userId, cursorRef.current);
        if (mountedRef.current) prefetchedRef.current = result;
      } catch (_) { /* silent prefetch failure */ }
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
        table: "beitraege",         // echte Tabelle — Realtime via Migration 040
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
    console.log("[HUI_STREAM] refresh() aufgerufen — Cache clearing + reload");
    clearCache();
    cursorRef.current = null;
    prefetchedRef.current = null;
    setPendingItems([]);
    setPendingCount(0);
    setItems([]);  // UI sofort clearen damit neue Items direkt sichtbar
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
