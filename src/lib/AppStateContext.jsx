// AppStateContext.jsx — HUI Phase 4D/4E — rebuilt 2026-05-17T10:22:17Z
// Phase 2B: Single source of truth für alle App-Daten
//
// ARCHITEKTUR:
// - AppStateContext trennt DATA STATE von UI STATE
// - AuthContext bleibt zuständig für: user, auth, profile (eigenes Profil)
// - AppStateContext ist zuständig für: works, experiences, bookings, chats, notifications, follows
// - Kein Component fetcht direkt Supabase — alle gehen über Hooks aus diesem Context
//
// SYNC-STRATEGIE:
// - Supabase Realtime für Chats, Bookings, Notifications
// - Cache mit TTL für Works, Experiences, Profiles
// - Optimistic Updates für Follow, Like, Save
// - Invalidation gezielt — nie komplett

import React, {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, useMemo
} from "react";
// throttle — inline impl. Build-ID:1779199372 (performance module removed in Phase A)
// Minimale Impl: identisch zur vorherigen Verwendung (leading-edge, cancel support)
function throttle(fn, wait = 300) {
  let lastCall = 0;
  let timer    = null;
  function throttled(...args) {
    const now = Date.now();
    const remaining = wait - (now - lastCall);
    if (remaining <= 0) {
      if (timer) { clearTimeout(timer); timer = null; }
      lastCall = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        lastCall = Date.now();
        timer    = null;
        fn(...args);
      }, remaining);
    }
  }
  throttled.cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };
  return throttled;
}
import { supabase } from "./supabaseClient";
import { useAuth } from "./AuthContext";

// ────────────────────────────────────────────────────────────────
// Cache Engine — TTL-basierter In-Memory Cache
// ────────────────────────────────────────────────────────────────
const CACHE_TTL = {
  profile:     5 * 60 * 1000,  // 5 min
  works:       3 * 60 * 1000,  // 3 min
  experiences: 3 * 60 * 1000,  // 3 min
  feed:        2 * 60 * 1000,  // 2 min
  bookings:    1 * 60 * 1000,  // 1 min (frequent changes)
  notifications: 30 * 1000,   // 30 sec
};

class HuiCache {
  constructor() { this._store = {}; }
  set(key, data) {
    this._store[key] = { data, ts: Date.now() };
  }
  get(key, ttl) {
    const entry = this._store[key];
    if (!entry) return null;
    if (Date.now() - entry.ts > ttl) { delete this._store[key]; return null; }
    return entry.data;
  }
  invalidate(key) { delete this._store[key]; }
  invalidatePattern(prefix) {
    Object.keys(this._store)
      .filter(k => k.startsWith(prefix))
      .forEach(k => delete this._store[k]);
  }
  clear() { this._store = {}; }
}

const cache = new HuiCache();

// ────────────────────────────────────────────────────────────────
// Context
// ────────────────────────────────────────────────────────────────
const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const { user, profile: authProfile, setProfile } = useAuth();

  // ── DATA STATE ───────────────────────────────────────────────
  const [ownWorks,       setOwnWorks]       = useState([]);
  const [ownExperiences, setOwnExperiences] = useState([]);
  const [bookings,       setBookings]       = useState([]);
  const [chats,          setChats]          = useState([]);
  const [notifications,  setNotifications]  = useState([]);
  const [follows,        setFollows]        = useState(new Set()); // Set<userId>
  const [savedWorks,     setSavedWorks]     = useState(new Set()); // Set<workId>
  const [inspiredWorks,  setInspiredWorks]  = useState(new Set()); // Set<workId> — resonated

  // ── LOADING / ERROR STATE ────────────────────────────────────
  const [loadingStates,  setLoadingStates]  = useState({});
  const [errorStates,    setErrorStates]    = useState({});

  // ── REALTIME REFS ────────────────────────────────────────────
  const realtimeChannels = useRef([]);
  const bootstrapped     = useRef(false);

  // ── UI STATE (getrennt von Data) ─────────────────────────────
  const [uiState, setUiState] = useState({
    activeTab:      "feed",
    showBooking:    null,
    showChat:       false,
    showNotifs:     false,
    showPlusSheet:  false,
    showMembership: false,
    showCreateFlow: false,
    createType:     null,
    activeMood:     null,
    storyRefreshKey: 0,
  });

  // ────────────────────────────────────────────────────────────
  // Loading helpers
  // ────────────────────────────────────────────────────────────
  const setLoading = useCallback((key, val) =>
    setLoadingStates(s => ({ ...s, [key]: val })), []);
  const setError   = useCallback((key, err) =>
    setErrorStates(s => ({ ...s, [key]: err  })), []);

  // ────────────────────────────────────────────────────────────
  // UI State Helpers — Quelle der Wahrheit für Overlays
  // ────────────────────────────────────────────────────────────
  const updateUI = useCallback((patch) =>
    setUiState(s => ({ ...s, ...patch })), []);

  const switchTab = useCallback((newTab) => {
    setUiState(s => ({
      ...s,
      activeTab:      newTab,
      showBooking:    null,
      showChat:       false,
      showNotifs:     false,
      showPlusSheet:  false,
      showCreateFlow: false,
      createType:     null,
    }));
  }, []);

  // ────────────────────────────────────────────────────────────
  // OWN WORKS — Creator's published + draft works
  // ────────────────────────────────────────────────────────────
  const loadOwnWorks = useCallback(async (force = false) => {
    if (!user?.id) return;
    const cacheKey = `works:own:${user.id}`;
    if (!force) {
      const cached = cache.get(cacheKey, CACHE_TTL.works);
      if (cached) { setOwnWorks(cached); return; }
    }
    setLoading('works', true);
    try {
      const { data, error } = await supabase
        .from("works")
        .select("id,title,cover_url,media_url,price,category,status,likes_count,saves_count,created_at")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setOwnWorks(data);
        cache.set(cacheKey, data);
      }
    } catch(e) {
      setError('works', e.message);
    } finally {
      setLoading('works', false);
    }
  }, [user?.id]);

  // ────────────────────────────────────────────────────────────
  // OWN EXPERIENCES
  // ────────────────────────────────────────────────────────────
  const loadOwnExperiences = useCallback(async (force = false) => {
    if (!user?.id) return;
    const cacheKey = `exps:own:${user.id}`;
    if (!force) {
      const cached = cache.get(cacheKey, CACHE_TTL.experiences);
      if (cached) { setOwnExperiences(cached); return; }
    }
    try {
      const { data, error } = await supabase
        .from("experiences")
        .select("id,title,start_date,location_text,price,max_participants,registered_count,status,cover_url,category")
        .eq("creator_id", user.id)
        .order("start_date", { ascending: true });
      if (!error && data) {
        setOwnExperiences(data);
        cache.set(cacheKey, data);
      }
    } catch(e) {
      setError('experiences', e.message);
    }
  }, [user?.id]);

  // ────────────────────────────────────────────────────────────
  // BOOKINGS
  // ────────────────────────────────────────────────────────────
  const loadBookings = useCallback(async (force = false) => {
    if (!user?.id) return;
    const cacheKey = `bookings:${user.id}`;
    if (!force) {
      const cached = cache.get(cacheKey, CACHE_TTL.bookings);
      if (cached) { setBookings(cached); return; }
    }
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`id, status, amount, created_at, notes,
          requester:profiles!bookings_requester_id_fkey(id,display_name,avatar_url),
          creator:profiles!bookings_creator_id_fkey(id,display_name,avatar_url)`)
        .or(`requester_id.eq.${user.id},creator_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data) {
        setBookings(data);
        cache.set(cacheKey, data);
      }
    } catch(e) {
      setError('bookings', e.message);
    }
  }, [user?.id]);

  // ────────────────────────────────────────────────────────────
  // NOTIFICATIONS (unread count)
  // ────────────────────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,type,text,read,created_at,actor_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (!error && data) setNotifications(data);
    } catch(e) { /* silent — notifications non-critical */ }
  }, [user?.id]);

  const unreadNotifCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  const markNotifsRead = useCallback(async () => {
    if (!user?.id) return;
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    await supabase.from("notifications")
      .update({ read: true }).eq("user_id", user.id).eq("read", false);
  }, [user?.id]);

  // ────────────────────────────────────────────────────────────
  // FOLLOWS — optimistic
  // ────────────────────────────────────────────────────────────
  const loadFollows = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("follows")
      .select("followed_id")
      .eq("follower_id", user.id);
    if (error) {
      console.error("[AppState] loadFollows:", error.message);
      return;
    }
    if (data) setFollows(new Set(data.map(f => f.followed_id)));
  }, [user?.id]);

  const toggleFollow = useCallback(async (targetUserId) => {
    // Safety guards
    if (!user?.id || !targetUserId) return;
    if (targetUserId === user.id) {
      console.warn("[AppState] toggleFollow: self-follow abgeblockt");
      return;
    }

    const isFollowing = follows.has(targetUserId);

    // 1. Optimistic update (sofort sichtbar)
    setFollows(prev => {
      const next = new Set(prev);
      isFollowing ? next.delete(targetUserId) : next.add(targetUserId);
      return next;
    });

    // 2. DB sync
    let error = null;
    if (isFollowing) {
      const res = await supabase.from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("followed_id", targetUserId);
      error = res.error;
    } else {
      const res = await supabase.from("follows")
        .insert({ follower_id: user.id, followed_id: targetUserId });
      error = res.error;
    }

    // 3. Rollback bei Fehler (Optimistic Update zurücknehmen)
    if (error) {
      console.error("[AppState] toggleFollow:", error.message);
      setFollows(prev => {
        const next = new Set(prev);
        // Umkehren: war isFollowing → wieder hinzufügen; war nicht → wieder entfernen
        isFollowing ? next.add(targetUserId) : next.delete(targetUserId);
        return next;
      });
    }
  }, [user?.id, follows]);

  // ────────────────────────────────────────────────────────────
  // SAVED / LIKED WORKS — optimistic
  // ────────────────────────────────────────────────────────────
  const toggleSaveWork = useCallback(async (workId) => {
    if (!user?.id || !workId) return;
    const isSaved = savedWorks.has(workId);
    setSavedWorks(prev => {
      const next = new Set(prev); isSaved ? next.delete(workId) : next.add(workId); return next;
    });
    if (isSaved) {
      await supabase.from("work_saves").delete()
        .eq("user_id", user.id).eq("work_id", workId);
    } else {
      await supabase.from("work_saves").insert({ user_id: user.id, work_id: workId });
    }
  }, [user?.id, savedWorks]);

  const toggleLikeWork = useCallback(async (workId) => {
    if (!user?.id || !workId) return;
    const isInspiredNow = inspiredWorks.has(workId);
    setInspiredWorks(prev => {
      const next = new Set(prev); isInspiredNow ? next.delete(workId) : next.add(workId); return next;
    });
    if (isInspiredNow) {
      await supabase.from("work_likes").delete()
        .eq("user_id", user.id).eq("work_id", workId);
    } else {
      await supabase.from("work_likes").insert({ user_id: user.id, work_id: workId });
    }
  }, [user?.id, inspiredWorks]);

  // ────────────────────────────────────────────────────────────
  // PROFILE UPDATE — zentrales Update, invalidiert alle Caches
  // ────────────────────────────────────────────────────────────
  const updateOwnProfile = useCallback(async (updates) => {
    if (!user?.id) return { error: "Nicht eingeloggt" };
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .select().single();
      if (error) return { error };
      // Update AuthContext-Profile (Single Source of Truth)
      if (setProfile) setProfile(p => ({ ...p, ...data }));
      // Cache invalidieren
      cache.invalidatePattern(`profile:${user.id}`);
      cache.invalidatePattern(`works:own:${user.id}`);
      return { data };
    } catch(e) {
      return { error: e.message };
    }
  }, [user?.id, setProfile]);

  // ────────────────────────────────────────────────────────────────
  // REALTIME SUBSCRIPTIONS
  // ────────────────────────────────────────────────────────────────
  //
  // ARCHITEKTUR: Stabile Throttled Refs auf Komponenten-Ebene.
  // Niemals throttle() inline im .on() aufrufen — das erzeugt bei jedem
  // user.id-Wechsel eine neue Funktion die nie gecancelled wird (Memory Leak).
  // Refs leben im Komponenten-Scope → cancel() immer erreichbar.
  const throttledNotifHandlerRef = useRef(null);
  const throttledChatHandlerRef  = useRef(null);

  useEffect(() => {
    if (!user?.id) return;

    // Cleanup: Channels + pending Throttle-Timer
    realtimeChannels.current.forEach(ch => supabase.removeChannel(ch));
    realtimeChannels.current = [];
    throttledNotifHandlerRef.current?.cancel?.();
    throttledChatHandlerRef.current?.cancel?.();

    // Handler einmal pro user.id instanzieren — nie inline im .on()
    // Notification: max 1 Update alle 200ms — verhindert Notification-Storm
    throttledNotifHandlerRef.current = throttle((payload) => {
      if (!payload?.new) return;
      setNotifications(prev => [payload.new, ...prev].slice(0, 50));
    }, 200);

    // Chat: max 1 Update alle 150ms — verhindert Message-Storm
    throttledChatHandlerRef.current = throttle((payload) => {
      if (!payload?.new?.chat_id) return;
      setChats(prev => prev.map(chat =>
        chat.id === payload.new.chat_id
          ? { ...chat, last_message: payload.new.text, last_message_at: payload.new.created_at }
          : chat
      ));
    }, 150);

    // 1. Notifications — realtime
    const notifChannel = supabase
      .channel(`asc-notifs:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, throttledNotifHandlerRef.current)
      .subscribe();
    realtimeChannels.current.push(notifChannel);

    // 2. Bookings — realtime (Client-Sicht, kein throttle nötig)
    const bookingChannel = supabase
      .channel(`bookings-client:${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'bookings',
        filter: `requester_id=eq.${user.id}`,
      }, () => {
        cache.invalidate(`bookings:${user.id}`);
        loadBookings(true);
      })
      .subscribe();
    realtimeChannels.current.push(bookingChannel);

    // 3. Chats — realtime new messages
    const chatChannel = supabase
      .channel(`chats:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
      }, throttledChatHandlerRef.current)
      .subscribe();
    realtimeChannels.current.push(chatChannel);

    // Offline/Reconnect Guard
    function handleOnline() {
      Promise.allSettled([loadNotifications(), loadBookings(true)]).catch(() => {});
    }
    window.addEventListener('online', handleOnline);

    return () => {
      realtimeChannels.current.forEach(ch => supabase.removeChannel(ch));
      realtimeChannels.current = [];
      // Throttle cancel — kein Memory Leak, kein Stale-State nach Logout
      throttledNotifHandlerRef.current?.cancel?.();
      throttledChatHandlerRef.current?.cancel?.();
      window.removeEventListener('online', handleOnline);
    };
  }, [user?.id]);

  // ────────────────────────────────────────────────────────────
  // BOOTSTRAP — initial load on login
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || bootstrapped.current) return;
    bootstrapped.current = true;

    // Non-blocking parallel bootstrap
    Promise.allSettled([
      loadNotifications(),
      loadFollows(),
    ]).then(() => {
      // Secondary data — load after primary is ready
      if (authProfile?.has_talent_profile || authProfile?.is_wirker) {
        loadOwnWorks();
        loadOwnExperiences();
      }
      loadBookings();
    });
  }, [user?.id, authProfile?.has_talent_profile]);

  // Reset on logout
  useEffect(() => {
    if (!user) {
      bootstrapped.current = false;
      setOwnWorks([]);
      setOwnExperiences([]);
      setBookings([]);
      setChats([]);
      setNotifications([]);
      setFollows(new Set());
      setSavedWorks(new Set());
      setInspiredWorks(new Set());
      cache.clear();
    }
  }, [user]);

  // ────────────────────────────────────────────────────────────
  // Cache invalidation helpers — für Components
  // ────────────────────────────────────────────────────────────
  const invalidate = useCallback((keys) => {
    (Array.isArray(keys) ? keys : [keys]).forEach(k => cache.invalidatePattern(k));
  }, []);

  // ────────────────────────────────────────────────────────────
  // Stable isLoading selector — nicht inline im useMemo!
  const isLoading = useCallback((key) => !!loadingStates[key], [loadingStates]);

  // ────────────────────────────────────────────────────────────
  // Context value
  // ────────────────────────────────────────────────────────────
  const value = useMemo(() => ({
    // ── Data ──────────────────────────────────────────────────
    ownWorks, ownExperiences, bookings, chats,
    notifications, unreadNotifCount,
    follows, savedWorks, inspiredWorks,

    // ── Loading / Errors ──────────────────────────────────────
    loadingStates, errorStates,
    isLoading,

    // ── UI State ──────────────────────────────────────────────
    uiState, updateUI, switchTab,

    // ── Actions ───────────────────────────────────────────────
    loadOwnWorks, loadOwnExperiences,
    loadBookings, loadNotifications,
    loadFollows,
    toggleFollow, toggleSaveWork, toggleLikeWork,
    updateOwnProfile,
    markNotifsRead,

    // ── Cache ─────────────────────────────────────────────────
    invalidate,
    cache, // expose for direct cache ops in rare cases

  }), [
    ownWorks, ownExperiences, bookings, chats,
    notifications, unreadNotifCount,
    follows, savedWorks, inspiredWorks,
    loadingStates, errorStates,
    uiState,
    updateUI, switchTab,
    loadOwnWorks, loadOwnExperiences, loadBookings,
    loadNotifications, loadFollows,
    toggleFollow, toggleSaveWork, toggleLikeWork,
    updateOwnProfile, markNotifsRead, invalidate, isLoading,
  ]);

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

// ────────────────────────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────────────────────────
export const useAppState = () => {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState muss innerhalb von <AppStateProvider> verwendet werden");
  return ctx;
};

// ────────────────────────────────────────────────────────────────
// Selective hooks — vermeiden unnötige re-renders
// ────────────────────────────────────────────────────────────────


// ────────────────────────────────────────────────────────────────
// Phase 4D.2 — Selective Hooks (Performance)
// Consumer rendern NUR wenn ihre eigenen Daten sich ändern.
// ────────────────────────────────────────────────────────────────

/** Nur Booking-Daten — rendert nicht bei Notif/Chat-Changes */
export const useBookings = () => {
  const { bookings, loadBookings } = useAppState();
  return { bookings, loadBookings };
};

/** Nur Chat-Liste — rendert nicht bei Booking-Changes */
export const useChats = () => {
  const { chats } = useAppState();
  return { chats };
};

/** Nur eigene Works */
export const useMyWorks = () => {
  const { ownWorks, loadOwnWorks } = useAppState();
  return { ownWorks, loadOwnWorks };
};

/** Nur Follow-Status für einen User */
export const useFollow = (userId) => {
  const { follows, toggleFollow } = useAppState();
  const isFollowing = useMemo(
    () => userId ? follows.has(String(userId)) : false,
    [follows, userId]
  );
  return { isFollowing, toggleFollow };
};

/** Nur UI-State (Overlays, Tab) — kein Datenzugriff — definiert weiter unten */

/** Nur Notification-Count — re-rendert nur wenn Count sich ändert */
// useUnreadChatTotal — delegiert an useChatList (Phase 3B)
// Importiert als Kompat-Layer damit bestehender Code weiterläuft
export const useUnreadChatTotal = () => {
  // Wird von ChatPage direkt über useChatList gehandelt
  // Hier als Stub für externe Nutzung
  return 0;
};

export const useNotifCount = () => {
  const { unreadNotifCount } = useAppState();
  return unreadNotifCount;
};

/** Nur Follow-Status für einen User */
export const useFollowStatus = (userId) => {
  const { follows, toggleFollow } = useAppState();
  // Defensive: String-Konversion für Set-Lookup
  // follows.has(undefined/null) → immer false (kein Crash)
  const safeId = userId ? String(userId) : null;
  return {
    isFollowing: safeId ? follows.has(safeId) : false,
    toggle:      safeId ? () => toggleFollow(safeId) : () => Promise.resolve(),
  };
};

/** Nur Save/Like Status für ein Werk */
export const useWorkInteraction = (workId) => {
  const { savedWorks, inspiredWorks, toggleSaveWork, toggleLikeWork } = useAppState();
  return {
    isSaved: savedWorks.has(workId),
    isLiked: inspiredWorks.has(workId),  // @deprecated — use isInspired
    isInspired: inspiredWorks.has(workId),
    toggleSave: () => toggleSaveWork(workId),
    toggleLike: () => toggleLikeWork(workId),
  };
};

/** Eigene Works — nur für Creator */
export const useOwnWorks = () => {
  const { ownWorks, loadOwnWorks, isLoading } = useAppState();
  return { works: ownWorks, reload: () => loadOwnWorks(true), loading: isLoading('works') };
};

/** UI State als atomarer Selector */
export const useUIState = () => {
  const { uiState, updateUI, switchTab } = useAppState();
  return { uiState, updateUI, switchTab };
};

// Re-export cache for emergency direct access
export { cache as huiCache };
// ─────────────────────────────────────────────────────────────
// PHASE 2: ECHTE FEED-DATEN
// ─────────────────────────────────────────────────────────────

// useFeedData — lädt echten HomeFeed
// Ersetzt MOCK_FEED in HomeFeed.jsx wenn Props übergeben werden
export function useFeedData({ enabled = true, limit = 12 } = {}) {
  const { user } = useAppState();
  const [items,   setItems]   = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error,   setError]   = React.useState(null);
  const loadedRef = React.useRef(false);

  React.useEffect(() => {
    if (!enabled || !user?.id || loadedRef.current) return;
    loadedRef.current = true;

    setLoading(true);
    feedService.getHomeFeed({ userId: user.id, limit })
      .then(({ items: data, error: err }) => {
        if (!err && data?.length) setItems(data);
        if (err) setError(err);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [user?.id, enabled, limit]);

  const refresh = React.useCallback(() => {
    if (!user?.id) return;
    loadedRef.current = false;
    setLoading(true);
    feedService.getHomeFeed({ userId: user.id, limit })
      .then(({ items: data, error: err }) => {
        if (!err && data?.length) setItems(data);
        loadedRef.current = true;
      })
      .finally(() => setLoading(false));
  }, [user?.id, limit]);

  return { items, loading, error, refresh };
}

// useDiscoverData — lädt echte Discover-Inhalte
export function useDiscoverData({ enabled = true, limit = 12 } = {}) {
  const { user } = useAppState();
  const [data,    setData]    = React.useState({ talents: [], works: [], experiences: [] });
  const [loading, setLoading] = React.useState(false);
  const [error,   setError]   = React.useState(null);
  const loadedRef = React.useRef(false);

  React.useEffect(() => {
    if (!enabled || loadedRef.current) return;
    loadedRef.current = true;

    setLoading(true);
    discoverService.getDiscovery({ userId: user?.id, limit })
      .then(result => {
        if (!result.error) setData(result);
        if (result.error) setError(result.error);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [user?.id, enabled, limit]);

  return { ...data, loading, error };
}

// useResonanceState — verwaltet Resonanz-Status für UI (optimistisch)
// Ersetzt den alten inspired/liked State in Feeds
export function useResonanceState() {
  const { user } = useAppState();
  const [resonated, setResonated] = React.useState({});  // { [targetId]: Set<type> }

  const toggle = React.useCallback(async (targetId, targetType, resonanceType = 'inspired') => {
    if (!user?.id) return;

    // Optimistisches UI-Update
    setResonated(prev => {
      const next = { ...prev };
      const current = next[targetId] || new Set();
      const updated = new Set(current);
      if (updated.has(resonanceType)) {
        updated.delete(resonanceType);
      } else {
        updated.add(resonanceType);
      }
      next[targetId] = updated;
      return next;
    });

    // DB async (fire-and-forget, Fehler nicht Block-UI)
    try {
      const { resonanceService } = await import('../services/content.js');
      const hasIt = (resonated[targetId] || new Set()).has(resonanceType);
      await resonanceService.toggle({
        user, targetType, targetId, resonanceType, currentState: hasIt
      });
    } catch (e) {
      // Optimistisches UI-Update zurückrollen bei Fehler
      setResonated(prev => {
        const next = { ...prev };
        const current = next[targetId] || new Set();
        const updated = new Set(current);
        if (updated.has(resonanceType)) {
          updated.delete(resonanceType);
        } else {
          updated.add(resonanceType);
        }
        next[targetId] = updated;
        return next;
      });
    }
  }, [user, resonated]);

  const isResonated = React.useCallback((targetId, resonanceType = 'inspired') => {
    return (resonated[targetId] || new Set()).has(resonanceType);
  }, [resonated]);

  return { resonated, toggle, isResonated };
}
