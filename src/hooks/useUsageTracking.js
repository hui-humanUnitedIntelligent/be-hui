// src/hooks/useUsageTracking.js
// ─────────────────────────────────────────────────────────────────────────────
// SADB-ANALYSE-005 (2026-08-22): App-Nutzungs-Tracking für das Super-Admin-
// Dashboard. Schreibt beim Login/App-Start eine Session-Zeile in
// `app_usage_sessions` (Supabase), aktualisiert sie per Heartbeat (60s) und
// finalisiert sie beim Verlassen/Backgrounden der App.
//
// WICHTIG (Michael-Vorgabe): "Ich muss nicht wissen WER die App nutzt,
// sondern WIE OFT/WIE LANGE." → user_id wird in der DB gespeichert (für
// korrekte Unique-User-Zählung nötig), aber NIRGENDS im Admin-UI angezeigt —
// nur aggregierte Zahlen (DAU/WAU/MAU, Ø Dauer, Ø Sitzungen/Tag). RLS erlaubt
// jedem Nutzer ausschließlich Schreib-/Lesezugriff auf seine EIGENEN Zeilen;
// die Admin-Aggregation läuft ausschließlich server-seitig über den Supabase
// Service-Role-Key (SADB /api/usage-analytics), der RLS umgeht.
//
// Additiv, keine bestehende Logik berührt. Kein Impact auf App-Performance:
// Insert/Update laufen fire-and-forget (kein await, kein Blocking der UI).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "../lib/supabaseClient.js";
import { APP_VERSION } from "../version.ts";

const HEARTBEAT_MS = 60_000; // 60s — reicht für Ø-Dauer, ohne DB zu spammen

export function useUsageTracking(userId) {
  const sessionIdRef = useRef(null);
  const startedAtRef = useRef(null);
  const heartbeatRef  = useRef(null);
  const startedForUserRef = useRef(null); // verhindert Doppel-Start bei Re-Renders

  useEffect(() => {
    if (!userId || startedForUserRef.current === userId) return;
    startedForUserRef.current = userId;

    let cancelled = false;

    const platform = (() => {
      try { return Capacitor.getPlatform(); } catch { return "web"; }
    })();

    const startSession = async () => {
      const now = new Date();
      startedAtRef.current = now;
      try {
        const { data, error } = await supabase
          .from("app_usage_sessions")
          .insert({
            user_id: userId,
            started_at: now.toISOString(),
            last_seen_at: now.toISOString(),
            platform,
            app_version: APP_VERSION,
          })
          .select("id")
          .single();
        if (error) throw error;
        if (!cancelled) sessionIdRef.current = data?.id || null;
      } catch (e) {
        // Tracking ist rein informativ — niemals die App-Funktion blockieren
        console.warn("[UsageTracking] start:", e?.message || e);
      }
    };

    const heartbeat = (finalize = false) => {
      if (!sessionIdRef.current || !startedAtRef.current) return;
      const now = new Date();
      const durationSeconds = Math.max(0, Math.round((now - startedAtRef.current) / 1000));
      const payload = { last_seen_at: now.toISOString(), duration_seconds: durationSeconds };
      if (finalize) payload.ended_at = now.toISOString();
      // Fire-and-forget — kein await, damit unload/hidden-Events nicht blockieren
      supabase.from("app_usage_sessions").update(payload).eq("id", sessionIdRef.current)
        .then(({ error }) => { if (error) console.warn("[UsageTracking] heartbeat:", error.message); });
    };

    startSession();
    heartbeatRef.current = setInterval(() => heartbeat(false), HEARTBEAT_MS);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") heartbeat(true);
      else if (document.visibilityState === "visible" && !sessionIdRef.current) {
        // App kam aus dem Hintergrund zurück, alte Session war evtl. nie
        // finalisiert (Killed) → neue Session starten
        startSession();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", () => heartbeat(true));

    return () => {
      cancelled = true;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
      heartbeat(true);
    };
  }, [userId]);
}
