// src/features/discovery/userSearch.js — HUI User Discovery Engine
// Phase 3A: Menschen finden, nicht Inhalte suchen.
//
// Philosophie:
//   Menschen wandern durch HUI — sie suchen nicht algorithmisch.
//   Diese Suche ist ein Einladungs-System, kein Filter-System.
//   Ergebnisse zeigen: Avatar, Name, Energie, Resonanz.
//
// Anbindung:
//   import { useUserSearch } from "../../features/discovery/userSearch";
//   const { results, query, setQuery, loading } = useUserSearch();

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { createProfileItem } from "../../lib/factories/createProfileItem.js";

// ── Felder die wir brauchen (kein select *) ─────────────────────
// Identity Contract v1.0: SEARCH_FIELDS → CANONICAL
const SEARCH_FIELDS = "id,display_name,username,avatar_url,bio,location_label,member_since,role,has_talent_profile,talent,membership_type,membership_active,followers_count,impact_eur,profile_views";

// ── Normalisierung ───────────────────────────────────────────────
function normalizeResult(raw) {
  if (!raw?.id) return null;
  const item = createProfileItem(raw);
  return {
    id:           raw.id,
    display_name: raw.display_name || "HUI Creator",
    username:     raw.username     || null,
    avatar_url:   raw.avatar_url   || null,
    bio:          raw.bio          || null,
    talent:       raw.talent || raw.focus_type || null,
    location:     raw.location     || null,
    is_wirker:    raw.is_wirker    || raw.has_talent_profile || false,
    impact_eur:   raw.impact_eur   || 0,
    follower_count: raw.follower_count || 0,
    is_available: raw.is_available ?? true,
    availability: raw.availability || "available",
    _raw:         raw,
    _item:        item,
  };
}

// ── Haupt-Hook ───────────────────────────────────────────────────
export function useUserSearch({ minLength = 2, debounceMs = 280 } = {}) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const debounceRef = useRef(null);

  const search = useCallback(async (q) => {
    const trimmed = q?.trim();
    if (!trimmed || trimmed.length < minLength) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    console.log("[HUI_DISCOVERY] user search:", trimmed);

    try {
      // Parallele Queries: display_name + username + bio + talent
      const { data, error: err } = await supabase
        .from("profiles")
        .select(SEARCH_FIELDS)
        .or([
          `display_name.ilike.%${trimmed}%`,
          `username.ilike.%${trimmed}%`,
          `bio.ilike.%${trimmed}%`,
          `talent.ilike.%${trimmed}%`,
          `focus_type.ilike.%${trimmed}%`,
          `location.ilike.%${trimmed}%`,
        ].join(","))
        .order("follower_count", { ascending: false })
        .limit(20);

      if (err) throw err;

      const normalized = (data || [])
        .map(normalizeResult)
        .filter(Boolean);

      console.log("[HUI_DISCOVERY] results:", normalized.length, "für:", trimmed);
      setResults(normalized);
    } catch (e) {
      console.warn("[HUI_DISCOVERY] search error:", e.message);
      setError(e.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [minLength]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.trim().length < minLength) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => search(query), debounceMs);
    return () => clearTimeout(debounceRef.current);
  }, [query, search, minLength, debounceMs]);

  // Clear
  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
    setError(null);
  }, []);

  return { query, setQuery, results, loading, error, clear };
}

// ── Utility: Einzel-User laden (für direkte Navigation) ─────────
export async function loadUserById(userId) {
  if (!userId) return null;
  const { data } = await supabase
    .from("profiles")
    .select(SEARCH_FIELDS)
    .eq("id", userId)
    .single();
  return data ? normalizeResult(data) : null;
}

// ── Utility: Featured Creators (für leere Suche) ─────────────────
export async function loadFeaturedCreators({ limit = 8 } = {}) {
  const { data } = await supabase
    .from("profiles")
    .select(SEARCH_FIELDS)
    .eq("has_talent_profile", true)
    .eq("is_available", true)
    .order("follower_count", { ascending: false })
    .limit(limit);
  return (data || []).map(normalizeResult).filter(Boolean);
}
