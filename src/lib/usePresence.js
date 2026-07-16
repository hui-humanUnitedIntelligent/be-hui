// src/lib/usePresence.js
// ══════════════════════════════════════════════════════════════
// HUI Presence System — profiles.last_seen_at (Legacy-UI-Read)
// Sprint 8 Phase 2: user_presence Write → usePresence.jsx (PresenceRuntime)
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

// ── usePresence — profiles.last_seen_at Write (UI-Read-Pfad) ──
export function usePresence(userId) {
  const heartbeatRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    async function ping() {
      await supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", userId);
    }

    ping();
    heartbeatRef.current = setInterval(ping, 60_000);

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
