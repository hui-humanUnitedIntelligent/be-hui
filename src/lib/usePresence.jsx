// src/lib/usePresence.js — Phase 3D
// ══════════════════════════════════════════════════════════════
// Lightweight presence hook. Isolated — NEVER blocks feed.
// Updates user_presence table + subscribes to realtime changes.
// Auto: online on mount, away after 90s idle, offline on unload.
// ══════════════════════════════════════════════════════════════
import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "./supabaseClient.js";

const AWAY_TIMEOUT    = 90_000;  // 90s idle → away
const HEARTBEAT_MS    = 45_000;  // upsert every 45s while active
const DEBOUNCE_MS     = 2_000;   // debounce activity events

export function usePresence(userId, currentPage = "home") {
  const idleTimerRef = useRef(null);
  const heartbeatRef = useRef(null);
  const statusRef    = useRef("offline");
  const mountedRef   = useRef(false);

  const upsert = useCallback(async (status) => {
    if (!userId) return;
    try {
      statusRef.current = status;
      await supabase.from("user_presence").upsert({
        user_id:      userId,
        status,
        last_seen_at: new Date().toISOString(),
        current_page: currentPage,
        updated_at:   new Date().toISOString(),
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

    // Initial online
    upsert("online");

    // Heartbeat
    heartbeatRef.current = setInterval(() => {
      if (statusRef.current !== "offline") upsert(statusRef.current);
    }, HEARTBEAT_MS);

    // Activity events — debounced
    let debounce = null;
    const onActivity = () => {
      clearTimeout(debounce);
      debounce = setTimeout(goOnline, DEBOUNCE_MS);
    };

    // Visibility change → away/online
    const onVisibility = () => {
      if (document.hidden) upsert("away");
      else goOnline();
    };

    const onUnload = () => upsert("offline");

    window.addEventListener("pointermove",   onActivity,  { passive: true });
    window.addEventListener("keydown",       onActivity,  { passive: true });
    window.addEventListener("touchstart",    onActivity,  { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload",  onUnload);

    // Start idle timer
    idleTimerRef.current = setTimeout(() => {
      if (mountedRef.current) upsert("away");
    }, AWAY_TIMEOUT);

    return () => {
      mountedRef.current = false;
      clearTimeout(idleTimerRef.current);
      clearTimeout(debounce);
      clearInterval(heartbeatRef.current);
      window.removeEventListener("pointermove",   onActivity);
      window.removeEventListener("keydown",       onActivity);
      window.removeEventListener("touchstart",    onActivity);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload",  onUnload);
      upsert("offline").catch(() => {});
    };
  }, [userId]); // eslint-disable-line
}

// ── Read presence for a list of user IDs ─────────────────────
export function usePresenceMap(userIds = []) {
  const [map, setMap] = useState({});

  useEffect(() => {
    if (!userIds.length) return;

    async function load() {
      try {
        const { data } = await supabase
          .from("user_presence")
          .select("user_id,status,last_seen_at")
          .in("user_id", userIds);
        if (data) {
          const m = {};
          data.forEach(r => { m[r.user_id] = r; });
          setMap(m);
        }
      } catch { /* silent */ }
    }
    load();

    // Realtime subscription
    let sub;
    let createdHere = false;
    try {
    // Realtime-Dedupe-Schutz (2026-07-08, systemweit, siehe useProfileLocations.js):
    // existierenden Channel fuer diesen Topic wiederverwenden statt erneut zu
    // subscriben -- verhindert "cannot add postgres_changes callbacks ... after
    // subscribe()" bei gleichzeitigen Mounts fuer denselben Topic.
      // Cleanup vereinheitlicht auf removeChannel() (war zuvor sub.unsubscribe(),
      // das entfernt den Channel nicht aus der globalen Registry).
      const topic = "presence_map_" + userIds[0];
      const existing = supabase.getChannels().find(c => c.topic === `realtime:${topic}`);
      if (existing) {
        sub = existing;
      } else {
        sub = supabase
          .channel(topic)
          .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "user_presence",
            filter: `user_id=in.(${userIds.join(",")})`,
          }, (payload) => {
            const r = payload.new;
            if (r?.user_id) {
              setMap(prev => ({ ...prev, [r.user_id]: r }));
            }
          })
          .subscribe();
        createdHere = true;
      }
    } catch { /* silent — realtime optional */ }

    return () => { try { if (createdHere && sub) supabase.removeChannel(sub); } catch {} };
  }, [userIds.join(",")]); // eslint-disable-line

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
  return `vor ${Math.floor(h/24)} T aktiv`;
}
