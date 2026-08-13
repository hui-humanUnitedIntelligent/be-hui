export const __HUI_NOTIF_FIX_V2 = "badge-sync-20260813";
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
        .eq("is_read", false);
      setUnreadNotifCount(count || 0);
    } catch {
      // silent — kein crash
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifCount();
    // Polling alle 60s
    notifTimerRef.current = setInterval(fetchNotifCount, 60_000);
    // CustomEvent: sofort neu laden wenn Notification gelesen wird
    const handler = () => fetchNotifCount();
    window.addEventListener("hui:notif:read", handler);

    // FIX (2026-08-13): Realtime-Subscription auf notifications-Tabelle
    // fuer sofortigen Badge-Update bei neuen Notifications. Bisher kam der
    // Badge nur alle 60s durch Polling — jetzt sofort beim INSERT.
    const topic = `appstate-notifs-${user.id}`;
    const existingCh = supabase.getChannels().find(c => c.topic === `realtime:${topic}`);
    let ch = existingCh;
    let createdHere = false;
    if (!existingCh) {
      ch = supabase.channel(topic)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          () => { fetchNotifCount(); })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          () => { fetchNotifCount(); })
        .subscribe();
      createdHere = true;
    }

    return () => {
      if (notifTimerRef.current) clearInterval(notifTimerRef.current);
      window.removeEventListener("hui:notif:read", handler);
      if (createdHere && ch) supabase.removeChannel(ch);
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
        window.dispatchEvent(new CustomEvent("hui:follow:changed", { detail: { targetId, action: "unfollow" } }));
      } else {
        await supabase.from("follows")
          .insert({ follower_id: user.id, followed_id: targetId });
        window.dispatchEvent(new CustomEvent("hui:follow:changed", { detail: { targetId, action: "follow" } }));
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
  // useMemo verhindert unnötige Re-renders aller Consumer bei jedem Provider-Render
  const value = useMemo(() => ({
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
  }), [activeTab, isMobile, unreadNotifCount, fetchNotifCount, followedIds, toggleFollow]);

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