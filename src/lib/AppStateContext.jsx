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
import { notifyFollow } from "./notificationService";
import { normalizeWorkRow, normalizeExperienceRow, normalizeBeitragRow } from "../system/feed/feedNormalizer.js";
import { rhythmizeFeed } from "../feed/feedRhythmEngine.js";

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
  const [notifications, setNotifications] = useState([]);
  const notifTimerRef = useRef(null);
  const notifRealtimeRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadNotifCount(0);
      return [];
    }
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          id, user_id, sender_id, type, title, body,
          entity_id, entity_type, action_url, read, created_at
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const rows = data || [];
      setNotifications(rows);
      setUnreadNotifCount(rows.filter(n => !n.read).length);
      return rows;
    } catch {
      // silent — kein crash
      return [];
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadNotifCount(0);
      return;
    }
    loadNotifications();
    notifTimerRef.current = setInterval(loadNotifications, 60_000);
    notifRealtimeRef.current = supabase
      .channel(`notifications:${user.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, () => loadNotifications())
      .subscribe((status) => {
        if (status === "SUBSCRIBED") loadNotifications();
      });
    return () => {
      if (notifTimerRef.current) clearInterval(notifTimerRef.current);
      if (notifRealtimeRef.current) supabase.removeChannel(notifRealtimeRef.current);
      notifTimerRef.current = null;
      notifRealtimeRef.current = null;
    };
  }, [user?.id, loadNotifications]);

  const markNotifsRead = useCallback(async () => {
    if (!user?.id) return;
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setNotifications(prev => (prev || []).map(n => ({ ...n, read: true })));
      setUnreadNotifCount(0);
    } catch {
      await loadNotifications();
    }
  }, [user?.id, loadNotifications]);

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
    notifications,
    unreadNotifCount,
    loadNotifications,
    markNotifsRead,
    refreshNotifCount: loadNotifications,
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
// Schema-korrekt nach Analyse der tatsächlichen DB-Struktur:
//   works:       user_id (kein creator_id), status='published'
//   experiences: user_id (kein creator_id), status='published', date (kein date_start)
//   profiles:    SELECT PUBLIC (RLS: true)
export function useFeedData(_opts) {
  const { user } = useAuth();
  const [items,   setItems]   = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error,   setError]   = React.useState(null);

  const load = React.useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Parallele Queries — schema-korrekt
      const [worksRes, expsRes, beitraegeRes, invitationsRes] = await Promise.allSettled([

        // works: user_id, JOIN profiles via works_user_id_fkey
        supabase
          .from("works")
          .select(`
            id, title, cover_url, media_url, category, description,
            caption, tags, price, status, user_id, creator_id, created_at,
            profile:profiles(
              id, display_name, avatar_url, talent, location_label
            )
          `)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(20),

        // experiences: status='published', ORDER BY created_at (date kann NULL sein)
        // BUG-FIX: order by date ASC schließt NULL-date rows aus → jetzt created_at DESC
        supabase
          .from("experiences")
          .select(`
            id, title, cover_url, media_url, category, description,
            price, duration, format, location_text, date,
            booking_mode, pricing_type, experience_type,
            participant_limit, max_participants,
            mood, mood_tags, social_energy,
            status, visibility, user_id, created_at,
            profile:profiles(
              id, display_name, avatar_url, talent, location_label
            )
          `)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(20),

        // beitraege: öffentlich lesbar, kein JOIN nötig (separat profile laden)
        supabase
          .from("beitraege")
          .select("id, user_id, src, type, caption, created_at")
          .order("created_at", { ascending: false })
          .limit(10),

        // Phase 4E: invitations — aktive, öffentliche, nicht abgelaufene
        supabase
          .from("invitations")
          .select(`
            id, user_id, text, title, vibe, mood, energy,
            location, city, time_label, starts_at, expires_at,
            visibility, status, max_participants, content_type, created_at,
            profile:profiles(
              id, display_name, avatar_url, talent, location_label
            )
          `)
          .eq("status", "active")
          .eq("visibility", "public")
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      const works    = worksRes.status    === "fulfilled" ? (worksRes.value?.data    || []) : [];
      const exps     = expsRes.status     === "fulfilled" ? (expsRes.value?.data     || []) : [];
      const beitr    = beitraegeRes.status === "fulfilled" ? (beitraegeRes.value?.data || []) : [];
      const invs     = invitationsRes?.status === "fulfilled" ? (invitationsRes.value?.data || []) : [];

      // Fehler loggen — aber nicht crashen
      if (worksRes.status    === "rejected") console.warn("[HUI_FEED] works failed:", worksRes.reason?.message);
      if (expsRes.status     === "rejected") console.warn("[HUI_FEED] experiences failed:", expsRes.reason?.message);
      if (beitraegeRes.status === "rejected") console.warn("[HUI_FEED] beitraege failed:", beitraegeRes.reason?.message);
      if (invitationsRes?.status === "rejected") console.warn("[HUI_FEED] invitations failed:", invitationsRes.reason?.message);

      // Query-Fehler loggen (Supabase gibt {data:null, error:{...}} zurück)
      if (worksRes.value?.error)    console.warn("[HUI_FEED] works error:", worksRes.value.error.code, worksRes.value.error.message);
      if (expsRes.value?.error)     console.warn("[HUI_FEED] experiences error:", expsRes.value.error.code, expsRes.value.error.message);
      if (beitraegeRes.value?.error) console.warn("[HUI_FEED] beitraege error:", beitraegeRes.value.error.code, beitraegeRes.value.error.message);

      // Detailliertes Debug für Phase 4F
      // ── PHASE 4I: PIPELINE TRACE ──────────────────────────────────
      console.log("[HUI_FEED_RAW_EXPERIENCES]", exps);
      console.log("[HUI_FEED_RAW_WORKS]", works);
      console.log("[HUI_FEED] works count:", works.length);
      console.log("[HUI_FEED] experiences count:", exps.length);
      console.log("[HUI_FEED] beitraege count:", beitr.length);
      if (exps.length > 0) {
        console.log("[HUI_FEED] experiences sample:", exps[0]);
      }
      if (expsRes.value?.error) {
        console.error("[HUI_FEED] experiences query ERROR:", expsRes.value.error);
      }
      if (worksRes.value?.error) {
        console.error("[HUI_FEED] works query ERROR:", worksRes.value.error);
      }

      // ── Normalisierung → Feed-Shape ──
      // Phase 4F: feedNormalizer — robust gegen partial DB rows
      const workItems = works
        .map(w => normalizeWorkRow(w))
        .filter(Boolean);

      // Phase 4F: feedNormalizer — Experience rows robust normalisiert
      const expItems = exps
        .map(e => normalizeExperienceRow(e))
        .filter(Boolean);


      // Phase 4F: feedNormalizer — Beiträge robust normalisiert
      const beitrItems = beitr
        .map(b => normalizeBeitragRow(b))
        .filter(Boolean);


      // ── PHASE 4I: NORMALIZED TRACE ─────────────────────────────────
      console.log("[HUI_FEED_NORMALIZED_WORKS]", workItems.map(w => ({
        id: w.id, type: w.type, name: w.name, creator_id: w.creator_id, time: w.time
      })));
      console.log("[HUI_FEED_NORMALIZED_EXPERIENCES]", expItems.map(e => ({
        id: e.id, type: e.type, name: e.name, expTitle: e.expTitle,
        creator_id: e.creator_id, expImg: e.expImg, expMeta: e.expMeta, time: e.time
      })));
      // ── Phase 4D: Feed Rhythm Engine — kein naives Mischen mehr
      // Alle normalisierten Items → rhythmizeFeed entscheidet Reihenfolge
      // Phase 4E: Invitations normalisieren
      const invItems = invs
        .map(inv => ({
          id:           String(inv.id),
          type:         "invitation",
          content_type: "invitation",
          caption:      inv.text || inv.title || "",
          text:         inv.text || inv.title || "",
          title:        inv.title || inv.text || "",
          vibe:         inv.vibe || inv.mood || null,
          location:     inv.location || inv.city || null,
          time:         inv.time_label || "",
          creator: (() => {
            const p = inv.profile || {};
            const name = p.display_name || p.full_name || p.name || "Unbekannt";
            return {
              id:          String(p.id || inv.user_id || ""),
              name,
              displayName: name,
              avatar:      p.avatar_url || p.avatar || null,
              username:    p.username || "",
              talent:      p.talent || "",
              location:    p.location_label || "",
              verified:    Boolean(p.verified),
            };
          })(),
          creator_id:    String(inv.user_id || ""),
          rhythmState:   "resonance",
          presenceState: "gathering",
          resonanz: 0, berührt: 0, begleitet: 0,
          viewers: [], viewerExtra: 0,
          images: [], expImg: null, coverUrl: null,
          _raw: inv,
        }))
        .filter(Boolean);

      // Phase 4E: Max 2 Invitations pro Feed-Load (Rhythm Engine braucht Luft)
      const invItemsCapped = invItems.slice(0, 2);
      console.log("[HUI_FEED] invitations count:", invItemsCapped.length, "of", invItems.length);

      const allItems = [...workItems, ...expItems, ...beitrItems, ...invItemsCapped];
      // Zeitsortierung als Basis (neuestes zuerst)
      allItems.sort((a, b) => {
        const ta = a._raw?.created_at ? new Date(a._raw.created_at).getTime() : 0;
        const tb = b._raw?.created_at ? new Date(b._raw.created_at).getTime() : 0;
        return tb - ta;
      });
      const mixed = rhythmizeFeed(allItems);

      console.log("[HUI_FEED_MIXED]", mixed.map(i => ({
        id: i.id, type: i.type, rhythmState: i.rhythmState, name: i.name
      })));
      console.log("[HUI_FEED] normalized items:", mixed.length);
      console.log("[HUI_REALITY] feed resolved ✓", {
        works: workItems.length,
        experiences: expItems.length,
        beitraege: beitrItems.length,
        total: mixed.length,
      });
      console.log("[HUI_FEED_QUERY_RESULT]", {
        works:       works.slice(0, 2).map(w => ({ id: w.id, status: w.status, title: w.title })),
        experiences: exps.slice(0, 2).map(e => ({ id: e.id, status: e.status, title: e.title, created_at: e.created_at })),
      });

      setItems(mixed);
    } catch(err) {
      console.error("[HUI_FEED] load exception:", err?.message);
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
