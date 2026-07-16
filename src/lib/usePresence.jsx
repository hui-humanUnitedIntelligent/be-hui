// src/lib/usePresence.jsx — Phase 3D (Sprint 8 Phase 2: produktionsfähig)
// ══════════════════════════════════════════════════════════════
// Write: user_presence (status, last_seen_at, current_page)
// Read:  usePresenceMap + Realtime postgres_changes
// UI:    PresenceDot, fmtPresence — noch nicht in Chat/Discover/Feed
// ══════════════════════════════════════════════════════════════
import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "./supabaseClient.js";

const AWAY_TIMEOUT = 90_000;
const HEARTBEAT_MS = 45_000;
const DEBOUNCE_MS  = 2_000;

// ── Realtime channel registry (ref-counted, multi-mount safe) ───
const presenceMapChannels = new Map();

function presenceMapKey(userIds) {
  return [...new Set(userIds.filter(Boolean))].sort().join(",");
}

function presenceRealtimeFilter(userIds) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return null;
  if (ids.length === 1) return `user_id=eq.${ids[0]}`;
  return `user_id=in.(${ids.join(",")})`;
}

function subscribePresenceMap(userIds, listener) {
  const key = presenceMapKey(userIds);
  if (!key) return () => {};

  const filter = presenceRealtimeFilter(userIds);
  if (!filter) return () => {};

  let entry = presenceMapChannels.get(key);
  if (!entry) {
    const topic = `presence_map_${key.replace(/,/g, "_").slice(0, 96)}`;
    const listeners = new Set();
    const channel = supabase
      .channel(topic)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "user_presence",
        filter,
      }, (payload) => {
        const row = payload.eventType === "DELETE"
          ? { ...payload.old, status: "offline" }
          : payload.new;
        if (row?.user_id) {
          listeners.forEach(fn => fn(row));
        }
      })
      .subscribe();
    entry = { channel, listeners, refCount: 0 };
    presenceMapChannels.set(key, entry);
  }

  entry.listeners.add(listener);
  entry.refCount++;

  return () => {
    entry.listeners.delete(listener);
    entry.refCount--;
    if (entry.refCount <= 0) {
      supabase.removeChannel(entry.channel);
      presenceMapChannels.delete(key);
    }
  };
}

// ── usePresence — own user_presence write ─────────────────────
export function usePresence(userId, currentPage = "home") {
  const idleTimerRef  = useRef(null);
  const heartbeatRef  = useRef(null);
  const debounceRef   = useRef(null);
  const statusRef     = useRef("offline");
  const mountedRef    = useRef(false);

  const upsert = useCallback(async (status) => {
    if (!userId || !mountedRef.current) return;
    try {
      statusRef.current = status;
      const now = new Date().toISOString();
      await supabase.from("user_presence").upsert({
        user_id:      userId,
        status,
        last_seen_at: now,
        current_page: currentPage,
        updated_at:   now,
      }, { onConflict: "user_id" });
    } catch { /* silent */ }
  }, [userId, currentPage]);

  const goOnline = useCallback(() => {
    if (!mountedRef.current) return;
    clearTimeout(idleTimerRef.current);
    upsert("online");
    idleTimerRef.current = setTimeout(() => {
      if (mountedRef.current) upsert("away");
    }, AWAY_TIMEOUT);
  }, [upsert]);

  useEffect(() => {
    if (!userId) return;
    mountedRef.current = true;

    upsert("online");

    heartbeatRef.current = setInterval(() => {
      if (statusRef.current !== "offline") upsert(statusRef.current);
    }, HEARTBEAT_MS);

    const onActivity = () => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(goOnline, DEBOUNCE_MS);
    };

    const onVisibility = () => {
      if (document.hidden) upsert("away");
      else goOnline();
    };

    const onUnload = () => { upsert("offline"); };

    window.addEventListener("pointermove", onActivity, { passive: true });
    window.addEventListener("keydown",     onActivity, { passive: true });
    window.addEventListener("touchstart",  onActivity, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onUnload);

    idleTimerRef.current = setTimeout(() => {
      if (mountedRef.current) upsert("away");
    }, AWAY_TIMEOUT);

    return () => {
      mountedRef.current = false;
      clearTimeout(idleTimerRef.current);
      clearTimeout(debounceRef.current);
      clearInterval(heartbeatRef.current);
      window.removeEventListener("pointermove", onActivity);
      window.removeEventListener("keydown",     onActivity);
      window.removeEventListener("touchstart",  onActivity);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onUnload);
      upsert("offline").catch(() => {});
    };
  }, [userId, currentPage, upsert, goOnline]);
}

// ── usePresenceMap — read + realtime for foreign user IDs ─────
export function usePresenceMap(userIds = []) {
  const [map, setMap] = useState({});
  const mountedRef = useRef(true);
  const idsKey = presenceMapKey(userIds);

  useEffect(() => {
    mountedRef.current = true;
    if (!idsKey) {
      setMap({});
      return () => { mountedRef.current = false; };
    }

    const ids = idsKey.split(",");

    async function load() {
      try {
        const { data } = await supabase
          .from("user_presence")
          .select("user_id,status,last_seen_at,current_page,updated_at")
          .in("user_id", ids);
        if (!mountedRef.current) return;
        if (data) {
          const m = {};
          data.forEach(r => { m[r.user_id] = r; });
          setMap(m);
        }
      } catch { /* silent */ }
    }

    load();

    const onRealtime = (row) => {
      if (!mountedRef.current || !row?.user_id) return;
      setMap(prev => ({ ...prev, [row.user_id]: row }));
    };

    const unsubscribe = subscribePresenceMap(ids, onRealtime);

    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      mountedRef.current = false;
      document.removeEventListener("visibilitychange", onVisible);
      unsubscribe();
    };
  }, [idsKey]);

  return map;
}

// ── Presence Dot component ────────────────────────────────────
export function PresenceDot({ status, size = 10, style = {} }) {
  const color = status === "online"  ? "#22C55E"
              : status === "away"    ? "#F59E0B"
              : "rgba(26,26,46,0.18)";
  if (status === "offline" || !status) return null;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color,
      border: "2px solid #fff",
      boxShadow: status === "online"
        ? "0 0 0 3px rgba(34,197,94,0.18)"
        : "none",
      flexShrink: 0,
      ...style,
    }} />
  );
}

// ── Format last seen ─────────────────────────────────────────
export function fmtPresence(presence) {
  if (!presence) return null;
  if (presence.status === "online")  return "gerade online";
  if (presence.status === "away")    return "gerade aktiv";
  const last = presence.last_seen_at;
  if (!last) return null;
  const m = Math.floor((Date.now() - new Date(last)) / 60000);
  if (m < 2)  return "gerade eben aktiv";
  if (m < 60) return `vor ${m} Min aktiv`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std aktiv`;
  return `vor ${Math.floor(h / 24)} T aktiv`;
}

// ── Chat presence helpers (Sprint 8 Phase 3) ────────────────────
/** Löst die Partner-User-ID aus einem Chat-Conv-Objekt. */
export function chatOtherUserId(conv, currentUserId) {
  return conv?.user_id
    || conv?.other_profile?.id
    || (conv?.participant_ids || []).find(id => id && id !== currentUserId)
    || null;
}

/** Mappt user_presence-Zeile auf Chat-UI-Format { label, dot, online }. */
export function presenceDisplayFromRow(row) {
  if (!row) return null;
  if (row.status === "online") {
    return { label: "Online", dot: "#22c55e", online: true };
  }
  if (row.status === "away") {
    return { label: "Gerade aktiv", dot: "#F59E0B", online: false };
  }
  const label = fmtPresence(row);
  if (!label) return null;
  return { label, dot: "rgba(0,0,0,0.22)", online: false };
}
