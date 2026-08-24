// src/hooks/useLiveTicker.js — LIVETICKER.1 (2026-07-08)
// ══════════════════════════════════════════════════════════════════
// OPTIMIZED (2026-08-24): Statt 13+ separater Supabase-Queries pro
// Refresh wird nun EINE einzige RPC (rpc_get_live_ticker_feed) aufgerufen.
// Das reduziert die Round-Trips von 13+ auf 1 und verbessert die
// Home-Load-Performance massiv. Die alten fetch-Funktionen bleiben als
// Fallback erhalten (fallbackToLegacyQueries) falls die RPC nicht
// verfügbar ist oder Fehler wirft.
//
// Ersetzt die beiden alten, komplett hartcodierten Demo-Ticker
// (AmbientWorldBar.ACTIVITY_POOL + DiscoverPage.LIVE_ACTIVITIES) durch
// EINE einzige, echte Datenquelle.
//
// FALLBACK/TURNUS.1 (2026-08-10): Echte Aggregat-Zahlen statt Fake-Events
// als Fuell-Items mit sehr altem createdAt.
//
// Architektur-Entscheidung Polling statt 10 Realtime-Channels:
// Ein Liveticker braucht keine Millisekunden-Aktualitaet (Wechsel ohnehin
// alle 8-12s). Statt zehn parallele supabase.channel()-Subscriptions zu
// eroeffnen, wird alle 90s neu geladen.
// ══════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../lib/AuthContext.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { timedQuery } from "../lib/perfMonitor.js";

const REFRESH_INTERVAL_MS = 90_000; // Optimiert: 90s statt 60s
const PER_SOURCE_LIMIT    = 5;
const MAX_BUFFER          = 30;

function esc(s) {
  return String(s ?? "").trim();
}

function looksLikeEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || ""));
}

function safePublicName(p) {
  const name = esc(p?.display_name) || esc(p?.username);
  if (!name || looksLikeEmail(name)) return null;
  return name;
}

async function safe(promise) {
  try {
    const { data, error } = await promise;
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

async function safeCount(promise) {
  try {
    const { count, error } = await promise;
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

// ══════════════════════════════════════════════════════════════════
// NEU (2026-08-24): Single-RPC Pfad — 1 Call statt 13+
// ══════════════════════════════════════════════════════════════════
async function fetchFromRPC() {
  try {
    const { data, error } = await supabase.rpc("rpc_get_live_ticker_feed", {
      p_limit: PER_SOURCE_LIMIT,
    });
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

function transformRPCData(rpcData) {
  if (!rpcData || typeof rpcData !== "object") return [];
  const items = [];

  // Works
  for (const w of (rpcData.works || [])) {
    items.push({
      id: `work_${w.id}`, createdAt: w.created_at,
      text: `„${esc(w.title) || "Ein neues Werk"}" wurde soeben veröffentlicht`,
      openRef: { type: "work", id: w.id },
    });
  }

  // Experiences
  for (const e of (rpcData.experiences || [])) {
    items.push({
      id: `exp_${e.id}`, createdAt: e.created_at,
      text: `Neues Erlebnis: „${esc(e.title) || "Ohne Titel"}"`,
      openRef: { type: "experience", id: e.id },
    });
  }

  // Connections
  for (const c of (rpcData.connections || [])) {
    items.push({
      id: `conn_${c.id}`, createdAt: c.created_at,
      text: `Neue Verbindung entstanden`,
      openRef: { type: "connection", id: c.id },
    });
  }

  // Recommendations
  for (const r of (rpcData.recommendations || [])) {
    items.push({
      id: `rec_${r.id}`, createdAt: r.created_at,
      text: `Neue Empfehlung wurde veröffentlicht`,
      openRef: { type: "recommendation", id: r.id },
    });
  }

  // Post Reactions (Resonanz)
  for (const pr of (rpcData.post_reactions || [])) {
    items.push({
      id: `resonance_${pr.id}`, createdAt: pr.created_at,
      text: `Ein Beitrag hat gerade Resonanz erhalten`,
      openRef: pr.type === "work" ? { type: "work", id: pr.post_id } : null,
    });
  }

  // Project Support
  for (const ps of (rpcData.project_support || [])) {
    items.push({
      id: `support_${ps.id}`, createdAt: ps.created_at,
      text: `Ein Impact-Projekt hat neue Unterstützung erhalten`,
      openRef: ps.project_id ? { type: "project", id: ps.project_id } : null,
    });
  }

  // Work Sales
  for (const ws of (rpcData.work_sales || [])) {
    items.push({
      id: `sale_${ws.id}`, createdAt: ws.created_at,
      text: `Ein Werk wurde gerade verkauft`,
      openRef: ws.work_id ? { type: "work", id: ws.work_id } : null,
    });
  }

  // Talent Bookings
  for (const tb of (rpcData.talent_bookings || [])) {
    items.push({
      id: `booking_${tb.id}`, createdAt: tb.created_at,
      text: `Ein Talent wurde gerade gebucht`,
      openRef: tb.talent_id ? { type: "talent", id: tb.talent_id } : null,
    });
  }

  // Impact Votes
  for (const iv of (rpcData.impact_votes || [])) {
    items.push({
      id: `vote_${iv.id}`, createdAt: iv.created_at,
      text: `Jemand hat gerade für ein Impact-Projekt gestimmt`,
      openRef: iv.project_id ? { type: "project", id: iv.project_id } : null,
    });
  }

  // New Talents
  for (const t of (rpcData.talents || [])) {
    if (!esc(t.title)) continue;
    items.push({
      id: `talentoffer_${t.id}`, createdAt: t.created_at,
      text: `Neues Talent-Angebot: „${esc(t.title)}"`,
      openRef: { type: "talent", id: t.id },
    });
  }

  // New Users
  for (const p of (rpcData.new_users || [])) {
    const name = esc(p.username) || esc(p.display_name);
    if (!name || looksLikeEmail(name)) continue;
    items.push({
      id: `newuser_${p.id}`, createdAt: p.created_at,
      text: `${name} ist jetzt bei HUI dabei`,
      openRef: { type: "profile", id: p.id },
    });
  }

  // Impact Pool Contributions
  for (const ip of (rpcData.impact_pool || [])) {
    const amount = Number(ip.amount_eur || 0);
    const fmtAmount = amount.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    items.push({
      id: `pool_${ip.id}`,
      createdAt: ip.created_at,
      text: `€ ${fmtAmount} wurden gerade in den Impact-Pool eingezahlt`,
      openRef: null,
    });
  }

  return items;
}

// ══════════════════════════════════════════════════════════════════
// LEGACY FALLBACK — falls RPC nicht verfügbar
// ══════════════════════════════════════════════════════════════════
async function fetchWorks() {
  const rows = await safe(
    supabase.from("works")
      .select("id,title,created_at")
      .eq("status", "published").eq("approval_status", "approved")
      .order("created_at", { ascending: false }).limit(PER_SOURCE_LIMIT)
  );
  return rows.map(w => ({
    id: `work_${w.id}`, createdAt: w.created_at,
    text: `„${esc(w.title) || "Ein neues Werk"}" wurde soeben veröffentlicht`,
    openRef: { type: "work", id: w.id },
  }));
}

async function fetchFallbackStats() {
  const [works, talentsN, experiences, users, projects] = await Promise.all([
    safeCount(supabase.from("works").select("id", { count: "exact", head: true })
      .eq("status", "published").eq("approval_status", "approved")),
    safeCount(supabase.from("talents").select("id", { count: "exact", head: true })
      .eq("status", "approved")),
    safeCount(supabase.from("experiences").select("id", { count: "exact", head: true })
      .eq("status", "published").eq("approval_status", "approved")),
    safeCount(supabase.from("profiles").select("id", { count: "exact", head: true })),
    safeCount(supabase.from("impact_applications").select("id", { count: "exact", head: true })
      .eq("status", "approved")),
  ]);

  const out = [];
  if (works > 0) out.push({
    id: "fb_works", createdAt: "2000-01-01T00:00:00Z",
    text: `Schon ${works} Werke auf HUI veröffentlicht`, openRef: null,
  });
  if (talentsN > 0) out.push({
    id: "fb_talents", createdAt: "2000-01-01T00:00:01Z",
    text: `${talentsN} Talente bieten aktuell ihr Können auf HUI an`, openRef: null,
  });
  if (experiences > 0) out.push({
    id: "fb_experiences", createdAt: "2000-01-01T00:00:02Z",
    text: `${experiences} Erlebnisse warten auf HUI darauf, entdeckt zu werden`, openRef: null,
  });
  if (users > 0) out.push({
    id: "fb_users", createdAt: "2000-01-01T00:00:03Z",
    text: `Schon ${users} Menschen sind Teil von HUI`, openRef: null,
  });
  if (projects > 0) out.push({
    id: "fb_projects", createdAt: "2000-01-01T00:00:04Z",
    text: `${projects} Herzensprojekte werden aktuell über den Impact Pool unterstützt`, openRef: null,
  });
  return out;
}

async function fallbackToLegacyQueries() {
  const results = await Promise.all([
    fetchWorks().catch(() => []),
    fetchFallbackStats().catch(() => []),
  ]);
  return results.flat();
}

// ══════════════════════════════════════════════════════════════════
// HOOK
// ══════════════════════════════════════════════════════════════════
export function useLiveTicker() {
  const { user } = useAuth();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const bufferRef = useRef(new Map());
  const mounted   = useRef(true);

  const refresh = useCallback(async () => {
    const _t = performance.now();

    // HAUPTPFAD: 1 RPC Call statt 13+ separater Queries
    let activityItems = [];
    const rpcData = await fetchFromRPC();

    if (rpcData) {
      activityItems = transformRPCData(rpcData);
      // Fallback-Stats hinzufügen (immer, als Füll-Items)
      const stats = await fetchFallbackStats();
      activityItems = [...activityItems, ...stats];
    } else {
      // FALLBACK: Legacy Queries wenn RPC nicht verfügbar
      console.warn("[HUI LiveTicker] RPC nicht verfügbar, falle zurück auf Legacy Queries");
      activityItems = await fallbackToLegacyQueries();
    }

    const _ms = Math.round(performance.now() - _t);
    if (_ms > 600) console.warn(`[HUI PERF] 🐌 LiveTicker refresh langsam (${_ms}ms)`);
    if (!mounted.current) return;

    const merged = bufferRef.current;
    for (const item of activityItems) {
      merged.set(item.id, item);
    }

    const sorted = [...merged.values()]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, MAX_BUFFER);

    bufferRef.current = new Map(sorted.map(i => [i.id, i]));

    setItems(sorted);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    mounted.current = true;
    if (document.visibilityState === "visible") refresh();

    let interval = null;
    function startInterval() {
      stopInterval();
      if (document.visibilityState !== "visible") return;
      interval = setInterval(() => {
        if (document.visibilityState === "visible") refresh();
      }, REFRESH_INTERVAL_MS);
    }
    function stopInterval() { clearInterval(interval); interval = null; }

    function onVisibility() {
      if (document.visibilityState === "visible") { refresh(); startInterval(); }
      else stopInterval();
    }

    startInterval();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mounted.current = false;
      stopInterval();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh, user?.id]);

  return { items, loading };
}
