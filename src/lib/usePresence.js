// src/lib/usePresence.js
// ══════════════════════════════════════════════════════════════
// HUI Presence System — Phase 1 + Sprint 8 Dual-Write-Brücke
// Tracking: App-Start, Foreground-Return, Heartbeat alle 60s
// Dual-Write: profiles.last_seen_at + user_presence (identischer Timestamp)
// UI liest weiterhin profiles.last_seen_at via formatPresence (unverändert)
// ══════════════════════════════════════════════════════════════

import { useEffect, useRef } from "react";
import { supabase } from "./supabaseClient.js";

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

// ── dualWritePresence — Sprint 8 Phase 1 Brücke ───────────────
// Schreibt profiles.last_seen_at und user_presence mit identischem last_seen_at.
async function dualWritePresence(userId, { currentPage = "home" } = {}) {
  if (!userId) return;
  const now = new Date().toISOString();
  const status = typeof document !== "undefined" && document.hidden ? "away" : "online";

  await Promise.all([
    supabase
      .from("profiles")
      .update({ last_seen_at: now })
      .eq("id", userId),
    supabase
      .from("user_presence")
      .upsert({
        user_id:      userId,
        status,
        last_seen_at: now,
        current_page: currentPage,
        updated_at:   now,
      }, { onConflict: "user_id" }),
  ]);
}

// ── usePresence — Activity Tracking Hook ──────────────────────
// Nur für den eingeloggten User. Kein Polling für fremde User.
export function usePresence(userId, currentPage = "home") {
  const heartbeatRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    async function ping() {
      await dualWritePresence(userId, { currentPage });
    }

    // App-Start
    ping();

    // Heartbeat alle 60 Sekunden
    heartbeatRef.current = setInterval(ping, 60_000);

    // Foreground-Return (Visibility API)
    function onVisible() {
      if (document.visibilityState === "visible") ping();
    }
    document.addEventListener("visibilitychange", onVisible);

    // Tab schließen / Navigation — user_presence auf offline (profiles behält letzten Ping)
    function onUnload() {
      const now = new Date().toISOString();
      supabase.from("user_presence").upsert({
        user_id:      userId,
        status:       "offline",
        last_seen_at: now,
        updated_at:   now,
        current_page: currentPage,
      }, { onConflict: "user_id" }).catch(() => {});
    }
    window.addEventListener("beforeunload", onUnload);

    return () => {
      clearInterval(heartbeatRef.current);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("beforeunload", onUnload);
      onUnload();
    };
  }, [userId, currentPage]);
}
