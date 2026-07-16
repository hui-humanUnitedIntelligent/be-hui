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
import { cachedQuery, CACHE_TTL } from "./perfUtils";
import { useIdleAwareInterval } from "../hooks/usePollingPause.js";

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

  const fetchNotifCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      console.log("[BADGE USER]", user?.id);
      const { count, error } = await cachedQuery(
        `notif:unread:${user.id}`,
        () => supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false),
        CACHE_TTL.notifications
      );
      console.log("[BADGE COUNT]", count);
      console.log("[BADGE ERROR]", error);
      setUnreadNotifCount(count || 0);
    } catch {
      // silent — kein crash
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifCount();
    const handler = () => fetchNotifCount();
    window.addEventListener("hui:notif:read", handler);
    return () => {
      window.removeEventListener("hui:notif:read", handler);
    };
  }, [user?.id, fetchNotifCount]);

  useIdleAwareInterval(fetchNotifCount, 60_000, !!user?.id);

  // ── Follow Status — direkter Supabase-Query (kein security layer) ─
  const [followedIds, setFollowedIds] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    cachedQuery(
      `follows:list:${user.id}`,
      () => supabase
        .from("follows")
        .select("followed_id")
        .eq("follower_id", user.id),
      CACHE_TTL.profiles
    ).then(({ data }) => {
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
        // notifyFollow removed — function not defined
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
        .select("id,display_name,username,avatar_url,bio,location_label,member_since,role,has_talent_profile,talent,membership_type,membership_active,followers_count,impact_eur,profile_views") // Identity Contract v1.0
        .eq("has_talent_profile", true)
        .limit(limit),
      supabase.from("works")
        .select("id, title, cover_url, category, price, creator_id, status")
        .eq("status", "published")
        .limit(limit),
    ])
    .then(([profilesRes, worksRes]) => {
      if (cancelled) return;
      setTalents((profilesRes.data || []).filter(p => p?.id));
      setWorks((worksRes.data || []).filter(w => w?.id).map(w => ({ ...w, type: "work" })));
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