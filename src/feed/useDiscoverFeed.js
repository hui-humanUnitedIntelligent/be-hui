/**
 * useDiscoverFeed.js — Globaler Discover-Feed Hook
 *
 * Führt works / beitraege / talents / experiences / impact_applications
 * zu einem zeitsortieren, paginierten Feed zusammen.
 *
 * Architektur-Regeln:
 *  - Kein vollständiger Tabellen-Abruf (Supabase .range())
 *  - 20 Elemente pro Batch
 *  - Merging + Sort im Client (nach created_at)
 *  - Kein Caching veralteter Daten
 *  - Keine globalen Re-Renders (lokale State-Updates)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

// ─── Konstanten ──────────────────────────────────────────────────────────────
const PAGE_SIZE    = 20;
const SOURCES      = ["works", "beitraege", "talents", "experiences", "impact"];

// Wie viele Items pro Quelle pro Batch geladen werden.
// 8 × 5 Quellen = 40 Kandidaten → merge → sort → top 20 ausgeben
const PER_SOURCE   = 8;

// ─── Normalizer ──────────────────────────────────────────────────────────────
function normalizeWork(r) {
  return {
    id:         r.id,
    _type:      "work",
    _ts:        r.created_at ? new Date(r.created_at).getTime() : 0,
    created_at: r.created_at,
    title:      r.title || "",
    caption:    r.caption || r.description || "",
    cover_url:  r.cover_url || (r.media_urls?.[0]) || r.media_url || null,
    user_id:    r.user_id || r.creator_id,
    price:      r.price ?? r.price_eur ?? null,
    currency:   r.currency || "EUR",
    category:   r.work_category || r.category || null,
    for_sale:   r.for_sale ?? false,
    _raw:       r,
  };
}

function normalizeBeitrag(r) {
  return {
    id:         r.id,
    _type:      "moment",
    _ts:        r.created_at ? new Date(r.created_at).getTime() : 0,
    created_at: r.created_at,
    title:      null,
    caption:    r.caption || "",
    cover_url:  r.src || r.image_url || null,
    user_id:    r.user_id,
    media_type: r.type || "foto",
    _raw:       r,
  };
}

function normalizeTalent(r) {
  return {
    id:         r.id,
    _type:      "talent",
    _ts:        r.created_at ? new Date(r.created_at).getTime() : 0,
    created_at: r.created_at,
    title:      r.title || "",
    caption:    r.description || "",
    cover_url:  r.images?.[0] || null,
    user_id:    r.user_id,
    price:      r.price_per_session ?? r.price_per_hour ?? null,
    currency:   r.currency || "EUR",
    category:   r.category || null,
    location_type: r.location_type || null,
    _raw:       r,
  };
}

function normalizeExperience(r) {
  return {
    id:         r.id,
    _type:      "experience",
    _ts:        r.created_at ? new Date(r.created_at).getTime() : 0,
    created_at: r.created_at,
    title:      r.title || "",
    caption:    r.caption || r.description || "",
    cover_url:  r.cover_url || r.media_url || null,
    user_id:    r.user_id,
    price:      r.price ?? null,
    currency:   r.currency || "EUR",
    date:       r.date || null,
    location:   r.location_text || null,
    format:     r.format || null,
    _raw:       r,
  };
}

function normalizeImpact(r) {
  return {
    id:         r.id,
    _type:      "impact",
    _ts:        r.created_at ? new Date(r.created_at).getTime() : 0,
    created_at: r.created_at,
    title:      r.project_name || "",
    caption:    r.short_desc || r.problem || "",
    cover_url:  r.cover_url || r.media_urls?.[0] || null,
    user_id:    r.user_id,
    funding_goal:       r.funding_goal || 0,
    current_amount_eur: r.current_amount_eur || 0,
    rank:       r.rank || null,
    _raw:       r,
  };
}

// ─── Query-Definitionen ───────────────────────────────────────────────────────
async function fetchWorks(offset) {
  const { data, error } = await supabase
    .from("works")
    .select("id,user_id,creator_id,title,caption,description,cover_url,media_url,media_urls,price,price_eur,currency,category,work_category,for_sale,created_at")
    .eq("status", "published")
    .eq("approval_status", "approved")
    .order("created_at", { ascending: false })
    .range(offset, offset + PER_SOURCE - 1);
  if (error) throw error;
  return (data || []).map(normalizeWork);
}

async function fetchBeitraege(offset) {
  const { data, error } = await supabase
    .from("beitraege")
    .select("id,user_id,src,type,caption,image_url,created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + PER_SOURCE - 1);
  if (error) throw error;
  return (data || []).map(normalizeBeitrag);
}

async function fetchTalents(offset) {
  const { data, error } = await supabase
    .from("talents")
    .select("id,user_id,title,description,category,images,price_per_hour,price_per_session,currency,location_type,created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .range(offset, offset + PER_SOURCE - 1);
  if (error) throw error;
  return (data || []).map(normalizeTalent);
}

async function fetchExperiences(offset) {
  const { data, error } = await supabase
    .from("experiences")
    .select("id,user_id,title,caption,description,cover_url,media_url,price,currency,date,location_text,format,category,created_at")
    .eq("status", "published")
    .eq("approval_status", "approved")
    .order("created_at", { ascending: false })
    .range(offset, offset + PER_SOURCE - 1);
  if (error) throw error;
  return (data || []).map(normalizeExperience);
}

async function fetchImpact(offset) {
  const { data, error } = await supabase
    .from("impact_applications")
    .select("id,user_id,project_name,short_desc,problem,cover_url,media_urls,funding_goal,current_amount_eur,rank,created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .range(offset, offset + PER_SOURCE - 1);
  if (error) throw error;
  return (data || []).map(normalizeImpact);
}

// ─── Merge + Sort ─────────────────────────────────────────────────────────────
function mergeSortSlice(arrays, pageIndex) {
  // Alle Arrays zusammenführen, nach _ts (created_at) sortieren, Duplikate entfernen
  const combined = arrays.flat();
  combined.sort((a, b) => b._ts - a._ts);

  // Duplikate nach id entfernen (falls verschiedene Queries dasselbe Item liefern)
  const seen = new Set();
  const deduped = combined.filter(item => {
    const key = `${item._type}:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Slice: nur den aktuellen Page-Bereich
  const start = pageIndex * PAGE_SIZE;
  return deduped.slice(start, start + PAGE_SIZE);
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useDiscoverFeed() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError]     = useState(null);

  // Pro-Quelle Offset-Tracking (damit jede Quelle unabhängig paginiert)
  const offsetsRef = useRef({ works: 0, beitraege: 0, talents: 0, experiences: 0, impact: 0 });
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  // Gesamt-Buffer aller geladenen normalisierten Items (für client-seitiges Merge)
  const bufferRef  = useRef([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadPage = useCallback(async (isLoadMore = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    if (!isLoadMore) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    const off = offsetsRef.current;

    try {
      // Alle 5 Quellen parallel laden
      const [works, beitr, talents, exps, impact] = await Promise.allSettled([
        fetchWorks(off.works),
        fetchBeitraege(off.beitraege),
        fetchTalents(off.talents),
        fetchExperiences(off.experiences),
        fetchImpact(off.impact),
      ]);

      if (!mountedRef.current) return;

      const newWorks   = works.status   === "fulfilled" ? works.value   : [];
      const newBeitr   = beitr.status   === "fulfilled" ? beitr.value   : [];
      const newTalents = talents.status === "fulfilled" ? talents.value : [];
      const newExps    = exps.status    === "fulfilled" ? exps.value    : [];
      const newImpact  = impact.status  === "fulfilled" ? impact.value  : [];

      // Offsets nur für Quellen erhöhen die Daten geliefert haben
      if (newWorks.length > 0)   offsetsRef.current.works       += newWorks.length;
      if (newBeitr.length > 0)   offsetsRef.current.beitraege   += newBeitr.length;
      if (newTalents.length > 0) offsetsRef.current.talents     += newTalents.length;
      if (newExps.length > 0)    offsetsRef.current.experiences += newExps.length;
      if (newImpact.length > 0)  offsetsRef.current.impact      += newImpact.length;

      // In den Buffer mergen
      const newAll = [...newWorks, ...newBeitr, ...newTalents, ...newExps, ...newImpact];

      if (newAll.length === 0) {
        // Keine neuen Items → kein hasMore
        setHasMore(false);
        return;
      }

      // Buffer aktualisieren
      bufferRef.current = [...bufferRef.current, ...newAll];

      // Buffer nach _ts sortieren + deduplizieren
      const seen = new Set();
      const sorted = bufferRef.current
        .sort((a, b) => b._ts - a._ts)
        .filter(item => {
          const key = `${item._type}:${item.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      bufferRef.current = sorted;

      // Prüfe ob alle Quellen erschöpft sind
      const allExhausted =
        newWorks.length   < PER_SOURCE &&
        newBeitr.length   < PER_SOURCE &&
        newTalents.length < PER_SOURCE &&
        newExps.length    < PER_SOURCE &&
        newImpact.length  < PER_SOURCE;

      setItems([...bufferRef.current]);
      setHasMore(!allExhausted);

    } catch (err) {
      if (mountedRef.current) {
        setError(err?.message || "Feed konnte nicht geladen werden.");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
      loadingRef.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadPage(false);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (!loadingRef.current && hasMore) {
      loadPage(true);
    }
  }, [hasMore, loadPage]);

  const refresh = useCallback(() => {
    // Reset komplett
    offsetsRef.current = { works: 0, beitraege: 0, talents: 0, experiences: 0, impact: 0 };
    bufferRef.current  = [];
    setItems([]);
    setHasMore(true);
    setError(null);
    loadPage(false);
  }, [loadPage]);

  return { items, loading, loadingMore, hasMore, error, loadMore, refresh };
}
