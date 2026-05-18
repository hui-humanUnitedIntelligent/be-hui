// hooks/useWirkerProfile.js
// Zentraler Daten-Hook für WirkerProfile
// Kapselt alle Supabase-Queries: profile, works, experiences, recommendations
// REGEL: Kein direkter Supabase-Zugriff in UI-Komponenten

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  safeQuery,
  batchQueries,
  FIELDS,
  PROFILE_FIELDS,
  normalizeProfileInput,
} from "../../lib/perfUtils";
import { getProfileIdentifier } from "../utils/profileGuards";

/**
 * Lädt alle Profildaten für eine WirkerProfile-Seite.
 * @param {object} rawWirker - Rohes Wirker-Objekt (aus Navigation/Props)
 * @returns {{ profile, works, experiences, recommendations, loading, reload }}
 */
export function useWirkerProfile(rawWirker) {
  const [profile,  setProfile]  = useState(null);
  const [works,    setWorks]    = useState([]);
  const [exps,     setExps]     = useState([]);
  const [recs,     setRecs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const loadData = useCallback(async () => {
    if (!rawWirker) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    try {
      const identifier = getProfileIdentifier(rawWirker);

      // ── Profil laden (3 Fallback-Strategien) ──────────────────────
      let profileData = null;

      // 1. Direkt per user_id / id
      if (rawWirker.user_id || rawWirker.id) {
        const uid = rawWirker.user_id || rawWirker.id;
        const res = await safeQuery(
          supabase.from("profiles").select(PROFILE_FIELDS).eq("id", uid).single()
        );
        profileData = res.data;
      }

      // 2. Fallback: per username
      if (!profileData && rawWirker.username) {
        const res = await safeQuery(
          supabase.from("profiles")
            .select(PROFILE_FIELDS)
            .eq("username", rawWirker.username)
            .single()
        );
        profileData = res.data;
      }

      // 3. Fallback: per display_name (unsauber, aber besser als Crash)
      if (!profileData && rawWirker.name) {
        const res = await safeQuery(
          supabase.from("profiles")
            .select(PROFILE_FIELDS)
            .ilike("display_name", rawWirker.name)
            .limit(1)
            .single()
        );
        profileData = res.data;
      }

      const uid = profileData?.id;

      // ── Parallel: works, experiences, recommendations ──────────────
      if (uid) {
        const [worksRes, expsRes, recsRes] = await batchQueries([
          safeQuery(
            supabase.from("works")
              .select(FIELDS.WORK)
              .eq("user_id", uid)
              .eq("status", "published")
              .order("created_at", { ascending: false })
              .limit(20)
          ),
          safeQuery(
            supabase.from("experiences")
              .select(FIELDS.EXPERIENCE || "*")
              .eq("user_id", uid)
              .eq("status", "active")
              .limit(12)
          ),
          safeQuery(
            supabase.from("recommendations")
              .select("*")
              .eq("wirker_user_id", uid)
              .order("created_at", { ascending: false })
              .limit(20)
          ),
        ]);

        setWorks(worksRes?.data   || []);
        setExps(expsRes?.data     || []);
        setRecs(recsRes?.data     || []);
      }

      // Normalisieren + setzen
      if (profileData) {
        setProfile(normalizeProfileInput(profileData));
      } else {
        // Fallback: rawWirker direkt normalisieren
        setProfile(normalizeProfileInput(rawWirker));
      }

    } catch (err) {
      setError(err);
      // Kein Crash: rawWirker als Fallback
      setProfile(normalizeProfileInput(rawWirker));
    } finally {
      setLoading(false);
    }
  }, [rawWirker]);

  useEffect(() => { loadData(); }, [loadData]);

  return {
    profile,
    works,
    experiences: exps,
    recommendations: recs,
    loading,
    error,
    reload: loadData,
  };
}