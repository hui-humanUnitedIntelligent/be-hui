// src/lib/usePresence.js
// ══════════════════════════════════════════════════════════════
// HUI Presence System — Phase 2 (Performance-optimiert)
// Tracking: App-Start, Foreground-Return, Heartbeat alle 120s
// NEU: Pausiert automatisch wenn Tab/App im Hintergrund ist
// ══════════════════════════════════════════════════════════════

import { useEffect, useRef } from "react";
import { supabase } from "./supabaseClient.js";

export function formatPresence(last_seen_at) {
  if (!last_seen_at) return null;
  const diff = (Date.now() - new Date(last_seen_at).getTime()) / 1000;

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

// Heartbeat-Interval: 120s statt 60s (halbiert DB-Writes)
const HEARTBEAT_MS = 120_000;

export function usePresence(userId) {
  const heartbeatRef = useRef(null);
  const lastPingRef  = useRef(0);

  useEffect(() => {
    if (!userId) return;

    async function ping() {
      // Deduplizierung: nie öfter als alle 30s pingen (auch bei schnellen visibility-Wechseln)
      const now = Date.now();
      if (now - lastPingRef.current < 30_000) return;
      lastPingRef.current = now;

      // Nur pingen wenn Tab sichtbar (kein Write im Hintergrund)
      if (document.visibilityState !== "visible") return;

      await supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", userId);
    }

    function startHeartbeat() {
      stopHeartbeat();
      if (document.visibilityState !== "visible") return;
      heartbeatRef.current = setInterval(ping, HEARTBEAT_MS);
    }

    function stopHeartbeat() {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        ping();          // Sofort-Ping beim Zurückkehren
        startHeartbeat();
      } else {
        stopHeartbeat(); // Heartbeat pausieren wenn Hintergrund
      }
    }

    // App-Start
    ping();
    startHeartbeat();

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopHeartbeat();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [userId]);
}
