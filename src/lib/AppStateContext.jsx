// src/lib/AppStateContext.jsx — Phase 1 Restore
// Stabiler Basis-State ohne gefaehrliche Import-Chains.
//
// IMPORT-SICHERHEIT (Phase 1):
//   ✅ supabase — direkt, stabil
//   ✅ useAuth  — stabil
//   ❌ content.js / resonance / security / perfUtils — NOCH NICHT
//
// PHASE 2 aktiviert: feedService, resonance, discoverService
// PHASE 3 aktiviert: security chain, realtime, optimistic updates

import React, {
  createContext, useContext,
  useState, useEffect, useCallback, useRef, useMemo,
} from "react";
import { supabase }  from "./supabaseClient";
import { useAuth }   from "./AuthContext";

// ── Context ───────────────────────────────────────────────────────
const AppStateContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────
export function AppStateProvider({ children }) {
  const { user } = useAuth();

  // ── Navigation / UI State ──────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState("home");
  const [isMobile,     setIsMobile]     = useState(
    typeof window !== "undefined" ? window.innerWidth < 1200 : true
  );

  // Resize listener — useRef um Leak zu verhindern (Stabilisierungsregel)
  const resizeTimerRef = useRef(null);
  useEffect(() => {
    function onResize() {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        setIsMobile(window.innerWidth < 1200);
      }, 150);
    }
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, []);

  // ── Notification Count — direkter Supabase-Query (kein Service) ─
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const notifTimerRef = useRef(null);

  const fetchNotifCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnreadNotifCount(count || 0);
    } catch {
      // silent — kein crash
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifCount();
    // Polling alle 60s — kein Realtime (Phase 3)
    notifTimerRef.current = setInterval(fetchNotifCount, 60_000);
    return () => {
      if (notifTimerRef.current) clearInterval(notifTimerRef.current);
    };
  }, [user?.id, fetchNotifCount]);

  // ── Follow Status — direkter Supabase-Query (kein security layer) ─
  const [followedIds, setFollowedIds] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("follows")
      .select("followed_id")
      .eq("follower_id", user.id)
      .then(({ data }) => {
        if (data && Array.isArray(data)) setFollowedIds((data).filter(r=>r&&r.followed_id).map(r => r.followed_id));
      })
      .catch(() => {}); // silent
  }, [user?.id]);

  const toggleFollow = useCallback(async (targetId) => {
    if (!user?.id || !targetId) return;
    const isFollowing = followedIds.includes(targetId);
    // Optimistic update
    setFollowedIds(prev =>
      isFollowing ? prev.filter(id => id !== targetId) : [...prev, targetId]
    );
    try {
      if (isFollowing) {
        await supabase.from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("followed_id", targetId);
        console.log("[HUI_REALITY] relationship synced ✓ (unfollow)", targetId.slice(0,8));
      } else {
        await supabase.from("follows")
          .insert({ follower_id: user.id, followed_id: targetId });
        console.log("[HUI_REALITY] relationship synced ✓ (follow)", targetId.slice(0,8));
        // Notification an gefolgten User
        const { data: me } = await supabase
          .from("profiles").select("display_name").eq("id", user.id).single();
        notifyFollow({
          followerId:   user.id,
          followedId:   targetId,
          followerName: me?.display_name || "Jemand",
        }).catch(() => {}); // nie blocking
      }
    } catch {
      // Rollback bei Fehler
      setFollowedIds(prev =>
        isFollowing ? [...prev, targetId] : prev.filter(id => id !== targetId)
      );
    }
  }, [user?.id, followedIds]);

  // ── Context Value ──────────────────────────────────────────────
  const value = {
    // UI State
    activeTab, setActiveTab,
    isMobile,
    // Notifications
    unreadNotifCount,
    refreshNotifCount: fetchNotifCount,
    // Follow
    followedIds,
    toggleFollow,
    // Phase 2 placeholders — NOOP bis aktiviert
    feedItems:       [],
    feedLoading:     false,
    feedError:       null,
    refreshFeed:     () => {},
    discoverItems:   [],
    discoverLoading: false,
    refreshDiscover: () => {},
    resonanceMap:    {},
    giveResonance:   async () => {},
    removeResonance: async () => {},
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

// ── Hooks ──────────────────────────────────────────────────────────
export function useAppState() {
  return useContext(AppStateContext) || {};
}

// HomeFeed: gibt NOOP zurueck — Feed laeuft ueber interne Mock-Daten
// bis Phase 2 aktiviert wird
// useFeedData: Phase 4D — echte Feed-Daten aus Supabase
// Quellen: works + profiles (echte Creator-Aktivitäten)
export function useFeedData(_opts) {
  const { user } = useAuth();
  const [items,   setItems]   = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error,   setError]   = React.useState(null);

  const load = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      // Parallele Queries: works + erfahrungen der gefolgten Creator + eigene
      const [worksRes, expsRes] = await Promise.allSettled([
        supabase
          .from("works")
          .select(`
            id, title, cover_url, category, description, media_urls, price,
            creator_id, status, created_at, updated_at,
            profile:profiles!works_creator_id_fkey(
              id, display_name, avatar_url, talent, location_label
            )
          `)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(20),

        supabase
          .from("experiences")
          .select(`
            id, title, cover_url, category, description, price, date_start,
            location_label, max_participants, status, creator_id, created_at,
            profile:profiles!experiences_creator_id_fkey(
              id, display_name, avatar_url, talent, location_label
            )
          `)
          .eq("status", "open")
          .order("date_start", { ascending: true })
          .limit(10),
      ]);

      const works = worksRes.status === "fulfilled" ? (worksRes.value?.data || []) : [];
      const exps  = expsRes.status  === "fulfilled" ? (expsRes.value?.data  || []) : [];

      if (worksRes.status === "rejected")
        console.warn("[HUI_FEED] works query failed:", worksRes.reason?.message);
      if (expsRes.status === "rejected")
        console.warn("[HUI_FEED] experiences query failed:", expsRes.reason?.message);

      // Normalisieren → Feed-Shape
      const workItems = works
        .filter(w => w?.id && w.profile?.id)
        .map(w => ({
          id:            w.id,
          type:          "work_upload",
          rhythmState:   "hero",
          presenceState: "creating",
          name:          w.profile?.display_name || "Creator",
          talent:        w.profile?.talent || w.category || "Kunst",
          location:      w.profile?.location_label || "",
          avatar:        w.profile?.avatar_url || null,
          creator_id:    w.creator_id,
          caption:       w.description || w.title || "",
          images:        w.media_urls?.length > 0 ? w.media_urls : (w.cover_url ? [w.cover_url] : []),
          resonanz:      0,
          berührt:       0,
          begleitet:     0,
          viewers:       [],
          viewerExtra:   0,
          time:          _relTime(w.created_at),
          _raw:          w,
        }));

      const expItems = exps
        .filter(e => e?.id && e.profile?.id)
        .map(e => ({
          id:            "exp_" + e.id,
          type:          "experience",
          rhythmState:   "experience",
          presenceState: "gathering",
          name:          e.profile?.display_name || "Creator",
          talent:        e.profile?.talent || e.category || "Erlebnis",
          location:      e.location_label || e.profile?.location_label || "",
          avatar:        e.profile?.avatar_url || null,
          creator_id:    e.creator_id,
          caption:       e.description || e.title,
          expImg:        e.cover_url || null,
          expTitle:      e.title,
          expMeta:       [
            e.date_start ? new Date(e.date_start).toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"short"}) : null,
            e.location_label,
            e.price ? e.price + " €" : null,
          ].filter(Boolean).join(" · "),
          resonanz:      0,
          berührt:       0,
          begleitet:     0,
          viewers:       [],
          viewerExtra:   0,
          time:          _relTime(e.created_at),
          _raw:          e,
        }));

      // Mischen: 1 Experience alle 3 Works
      const mixed = [];
      let ei = 0;
      workItems.forEach((w, i) => {
        mixed.push(w);
        if ((i + 1) % 3 === 0 && ei < expItems.length) {
          mixed.push(expItems[ei++]);
        }
      });
      // Restliche Experiences anhängen
      while (ei < expItems.length) mixed.push(expItems[ei++]);

      console.log("[HUI_REALITY] feed resolved ✓", {
        works: workItems.length, experiences: expItems.length, total: mixed.length
      });

      setItems(mixed);
    } catch(err) {
      console.error("[HUI_FEED] load failed:", err?.message);
      setError(err?.message || "Feed konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => { load(); }, [load]);

  return { items, feedItems: items, loading, error, refresh: load };
}

// Hilfsfunktion: relative Zeit
function _relTime(iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)    return "gerade eben";
  if (diff < 3600)  return `vor ${Math.floor(diff/60)} Min.`;
  if (diff < 86400) return `vor ${Math.floor(diff/3600)} Std.`;
  if (diff < 604800)return `vor ${Math.floor(diff/86400)} Tag${Math.floor(diff/86400)>1?"en":""}`;
  return new Date(iso).toLocaleDateString("de-DE",{day:"numeric",month:"short"});
}

// DiscoverPage: direkter Supabase-Query im Hook (kein discoverService)
export function useDiscoverData({ enabled = true, limit = 16 } = {}) {
  const { user } = useAuth();
  const [works,   setWorks]   = useState([]);
  const [talents, setTalents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      supabase.from("profiles")
        .select("id, display_name, avatar_url, talent, location_label, bio")
        .eq("has_talent_profile", true)
        .limit(limit),
      supabase.from("works")
        .select("id, title, cover_url, category, price, creator_id, status")
        .eq("status", "published")
        .limit(limit),
    ])
    .then(([profilesRes, worksRes]) => {
      if (cancelled) return;
      setTalents(filterValidProfiles(profilesRes.data || []));
      setWorks(filterValidFeedItems((worksRes.data || []).map(createWorkItem)));
    })
    .catch(() => {})
    .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [enabled, limit, user?.id]);

  return { works, talents, loading, refresh: () => {} };
}

// ResonanceState: NOOP bis Phase 2
export function useResonanceState() {
  return { map: {}, give: async () => {}, remove: async () => {}, isResonated: () => false, toggle: async () => {} };
}

// NotifCount: shortcut fuer HomeShell
export function useNotifCount() {
  const ctx = useContext(AppStateContext);
  return ctx?.unreadNotifCount ?? 0;
}

// FollowStatus: shortcut fuer useBookingState
export function useFollowStatus(targetId) {
  const ctx = useContext(AppStateContext);
  const isFollowing = (ctx?.followedIds ?? []).includes(targetId);
  const toggle = ctx?.toggleFollow ?? (() => {});
  return { isFollowing, toggle: () => toggle(targetId) };
}
