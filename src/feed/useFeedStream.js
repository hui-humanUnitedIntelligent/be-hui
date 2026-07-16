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
import { ProfileService } from '../services/db';
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
  const [worksRes, expsRes, beitrRes, invRes] = await Promise.allSettled([
    filterWorks(
      supabase.from("works")
        .select("id,title,cover_url,media_url,category,description,caption,tags,price,for_sale,status,approval_status,user_id,creator_id,created_at")
        .eq("status", "published")
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false })
        .limit(limit)
    ),
    filterExps(
      supabase.from("experiences")
        .select("id,title,cover_url,media_url,category,description,price,duration,format,location_text,date,time_start,time_end,is_live,booking_mode,pricing_type,experience_type,participant_limit,max_participants,mood,mood_tags,social_energy,status,approval_status,visibility,user_id,created_at")
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


  if (typeof window !== "undefined") {
    window.__HUI_STREAM_DEBUG__ = {
      works: works.length, exps: exps.length,
      beitraege: beitr.length, beitrErr, worksErr, expsErr,
    };
  }

  // ── Step 2: Profile-Enrichment — optional, nie blockierend ─────────────
  // ── TRACE STEP 1: erstes Work-Item ─────────────────────────
  if (works && works.length > 0) {
    const w0 = works[0];
    if (import.meta.env.DEV) {
      console.group("🔍 STEP 1 - WORK[0]");
      if (import.meta.env.DEV) { console.log("raw row:", w0); }
      if (import.meta.env.DEV) { console.log("id:", w0.id); }
      if (import.meta.env.DEV) { console.log("user_id:", w0.user_id); }
      if (import.meta.env.DEV) { console.log("creator_id:", w0.creator_id); }
      if (import.meta.env.DEV) { console.groupEnd(); }
    }
  }

  const allRows = [...works, ...exps, ...beitr, ...invs];
  const userIds = [...new Set(allRows.map(r => r.user_id || r.creator_id).filter(Boolean))];
  // ── TRACE STEP 2: userIds ───────────────────────────────────
  if (import.meta.env.DEV) {
    console.group("🔍 STEP 2 - USER IDS");
    if (import.meta.env.DEV) { console.log("userIds:", userIds); }
    if (import.meta.env.DEV) { console.log("works[0].user_id in userIds:", works[0] ? userIds.includes(works[0].user_id) : "no works"); }
    if (import.meta.env.DEV) { console.groupEnd(); }
  }

  let profileMap = {};

  if (userIds.length > 0) {
    try {
      // ProfileService v1.0
      const { data: profileRows } = await ProfileService.getMany(userIds);
      // ── TRACE STEP 3: Supabase Profile Query Result ──────────
      if (import.meta.env.DEV) {
        console.group("🔍 STEP 3 - PROFILE QUERY");
        if (import.meta.env.DEV) { console.log("profileRows:", profileRows); }
        if (import.meta.env.DEV) { console.log("count:", profileRows?.length); }
        if (profileRows && profileRows.length > 0) {
          if (import.meta.env.DEV) { console.log("profileRows[0] fields:", Object.keys(profileRows[0])); }
          if (import.meta.env.DEV) { console.log("avatar_url:", profileRows[0].avatar_url); }
          if (import.meta.env.DEV) { console.log("display_name:", profileRows[0].display_name); }
          if (import.meta.env.DEV) { console.log("full_name:", profileRows[0].full_name); }
        }
        if (import.meta.env.DEV) { console.groupEnd(); }
      }

      if (profileRows) {
        profileRows.forEach(p => { profileMap[p.id] = p; });
      }
    } catch (_) {
      if (import.meta.env.DEV) { console.warn("[HUI_STREAM] Profile enrichment failed:", _?.message || _); }
    }

  // ── TRACE STEP 4: profileMap ──────────────────────────────
  const _w0uid = works[0] ? (works[0].user_id || works[0].creator_id) : null;
  if (import.meta.env.DEV) {
    console.group("🔍 STEP 4 - PROFILE MAP");
    if (import.meta.env.DEV) { console.log("profileMap keys:", Object.keys(profileMap)); }
    if (import.meta.env.DEV) { console.log("works[0] uid:", _w0uid); }
    if (import.meta.env.DEV) { console.log("profileMap[uid]:", _w0uid ? profileMap[_w0uid] : "no uid"); }
    if (import.meta.env.DEV) { console.groupEnd(); }
  }
  }

  // ── Step 3: Normalisieren (mit injiziertem profile aus profileMap) ──────
  let _step5Done = false; // nur erstes Work tracen
  function injectProfile(row) {
    const uid = row.user_id || row.creator_id || null;
    const p   = (uid && profileMap[uid]) ? profileMap[uid] : null;
    const result = { ...row, profile: p || { id: uid } };
    // ── TRACE STEP 5 (nur erstes Work) ────────────────────
    if (!_step5Done && row.title !== undefined) {
      _step5Done = true;
      if (import.meta.env.DEV) {
        console.group("🔍 STEP 5 - injectProfile (first work)");
        if (import.meta.env.DEV) { console.log("uid:", uid); }
        if (import.meta.env.DEV) { console.log("profileMap[uid]:", profileMap[uid]); }
        if (import.meta.env.DEV) { console.log("row.id:", row.id, "row.title:", row.title); }
        if (import.meta.env.DEV) { console.log("result.profile:", result.profile); }
        if (import.meta.env.DEV) { console.log("result.profile.avatar_url:", result.profile?.avatar_url); }
        if (import.meta.env.DEV) { console.log("result.profile.display_name:", result.profile?.display_name); }
        if (import.meta.env.DEV) { console.groupEnd(); }
      }
    }
    return result;
  }

  const normalizedBeitr = beitr.map(r => normalizeBeitragRow(injectProfile(r))).filter(Boolean);
  const normalized = [
    ...works.map(r => normalizeWorkRow(injectProfile(r))).filter(Boolean),
    ...exps.map(r => normalizeExperienceRow(injectProfile(r))).filter(Boolean),
    ...normalizedBeitr,
    ...invs.map(r => normalizeInvitationRow(injectProfile(r))).filter(Boolean),
  ];


  // FEED.13B — Upcoming Experience Relevance Ranking
  // Ersetzt FEED.10C (+4h Boost) durch zeitliche Relevanz-Verankerung.
  //
  // Regel: Experience mit Termin innerhalb von 7 Tagen erhält
  //   _sortKey = max(created_at, event_date - 48h)
  //
  // Effekte:
  //   Termin morgen (24h)  → visibilityAnchor = heute       → max(base, heute)
  //   Termin in 3 Tagen    → visibilityAnchor = übermorgen  → max(base, übermorgen)
  //   Termin in 6 Monaten  → CAP greift        → base (created_at, kein Vorteil)
  //   Vergangene Termine   → kein Vorteil      → base
  //   Works / Moments      → base (unverändert)
  //
  // Cursor, Pagination und Analytics bleiben vollständig unberührt.
  const _now                     = Date.now();
  const EVENT_VISIBILITY_WINDOW_MS = 48 * 60 * 60 * 1000;  // 48 Stunden Vorlauf
  const _WINDOW_MS                = 7  * 24 * 60 * 60 * 1000; // 7 Tage CAP (unverändert)

  normalized.forEach(item => {
    const base = item._raw?.created_at ? new Date(item._raw.created_at).getTime() : 0;
    if (item.type === "experience" && item._raw?.date) {
      const eventMs = new Date(item._raw.date).getTime();
      const delta   = eventMs - _now;
      if (delta >= 0 && delta < _WINDOW_MS) {
        // Termin in 0–7 Tagen → zeitliche Relevanz-Verankerung
        const visibilityAnchor = eventMs - EVENT_VISIBILITY_WINDOW_MS;
        item._sortKey = Math.max(base, visibilityAnchor);
      } else {
        // Vergangen oder > 7 Tage → kein Vorteil
        item._sortKey = base;
      }
    } else {
      item._sortKey = base;
    }
  });

  // Zeitsortiert (via _sortKey — created_at bleibt unberührt)
  normalized.sort((a, b) => (b._sortKey || 0) - (a._sortKey || 0));

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
      setError(err.message);
    } finally {
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
        // FEED.3B FIX-3 — approval_status Guard (Query: status=published AND approval_status=approved)
        if (payload.new?.approval_status !== "approved") return;
        _receiveLiveItem(payload.new, normalizeExperienceRow);
      })
      // FEED.3B FIX-2 — works INSERT (vorher fehlend, RT-1)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "works",
        filter: "status=eq.published",
      }, (payload) => {
        if (!mountedRef.current) return;
        // JS-Guard: approval_status analog zur Feed-Query prüfen
        if (payload.new?.approval_status !== "approved") return;
        _receiveLiveItem(payload.new, normalizeWorkRow);
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          if (import.meta.env.DEV) { console.warn("[HUI_STREAM] Realtime Channel Error — Feed läuft ohne Live-Updates weiter"); }
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
    setItems([]);  // UI sofort clearen damit neue Items direkt sichtbar
    await initialLoad();
  }, [initialLoad]);

  return {
    // Items
    items:          items,           // Chronologisch (_sortKey), ohne rhythmizeFeed
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
