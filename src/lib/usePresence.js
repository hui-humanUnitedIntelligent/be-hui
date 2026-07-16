// src/lib/usePresence.js
// ══════════════════════════════════════════════════════════════
// HUI Presence System — Phase 1
// Tracking: App-Start, Foreground-Return, Heartbeat alle 60s
// ══════════════════════════════════════════════════════════════

import { useEffect, useRef } from "react";
import { supabase } from "./supabaseClient.js";

const _presencePingInflight = new Map();

// ── formatPresence — öffentliche Utility ──────────────────────
export function formatPresence(last_seen_at) {
  if (!last_seen_at) return null;
  const diff = (Date.now() - new Date(last_seen_at).getTime()) / 1000; // Sekunden

  if (diff < 120)       return { label: "Online",           dot: "#22c55e", online: true  };
  if (diff < 3600)      return { label: `Vor ${Math.floor(diff / 60)} Min aktiv`, dot: "rgba(0,0,0,0.22)", online: false };
  if (diff < 86400)     return { label: "Heute aktiv",      dot: "rgba(0,0,0,0.22)", online: false };
  const d = new Date(last_seen_at);
  return {
    label: d.toLocaleDateString("de-DE", { day:"2-digit", month:"2-digit" }),
    dot:   "rgba(0,0,0,0.18)",
    online: false,
  };
}

// ── usePresence — Activity Tracking Hook ──────────────────────
// Nur für den eingeloggten User. Kein Polling für fremde User.
export function usePresence(userId) {
  const heartbeatRef = useRef(null);

  async function ping() {
    if (!userId) return;
    if (_presencePingInflight.has(userId)) return _presencePingInflight.get(userId);
    const p = supabase
      .from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", userId)
      .finally(() => { _presencePingInflight.delete(userId); });
    _presencePingInflight.set(userId, p);
    return p;
  }

  useEffect(() => {
    if (!userId) return;

    // App-Start
    ping();

    // Heartbeat alle 60 Sekunden (pausiert wenn Tab hidden)
    heartbeatRef.current = setInterval(() => {
      if (!document.hidden) ping();
    }, 60_000);

    // Foreground-Return (Visibility API)
    function onVisible() {
      if (document.visibilityState === "visible") ping();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(heartbeatRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId]);
}
