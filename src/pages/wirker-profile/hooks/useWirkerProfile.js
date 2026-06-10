// hooks/useWirkerProfile.js v2
// KRITISCH-FIX: deps auf primitive IDs stabilisiert (kein Object-Loop mehr)
// REGEL: Kein direkter Supabase-Zugriff in UI-Komponenten

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  safeQuery,
  batchQueries,
  FIELDS,
  PROFILE_FIELDS,
  normalizeProfileInput,
} from "../../../lib/perfUtils";
import { createProfileItem, filterValidProfiles }
  from "../../../lib/factories/createProfileItem.js";
import { createWorkItem, createExperienceItem, filterValidFeedItems }
  from "../../../lib/factories/createFeedItem.js";
import { getProfileIdentifier } from "../utils/profileGuards";

export function useWirkerProfile(rawWirker) {
  const [profile,  setProfile]  = useState(null);
  const [works,    setWorks]    = useState([]);
  const [exps,     setExps]     = useState([]);
  const [recs,     setRecs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // ── KRITISCH: Stabile primitive IDs als deps — kein Objekt-Loop ──
  // Stabilisierte primitive IDs — leere Strings als null behandeln
  const _rawId = rawWirker?.user_id || rawWirker?.id || null;
  const stableId       = (_rawId && typeof _rawId === "string" && _rawId.trim().length > 0) ? _rawId : null;
  const stableUsername = rawWirker?.username || null;
  const stableName     = rawWirker?.name     || null;

  // rawWirker Ref für den loadData-Callback (ohne Neu-Trigger)
  const rawRef = useRef(rawWirker);
  useEffect(() => { rawRef.current = rawWirker; }, [rawWirker]);

  const loadData = useCallback(async () => {
    console.log("🔶 STEP 7 — useWirkerProfile loadData", { stableId, stableUsername, stableName });
    const raw = rawRef.current;
    if (!raw) { setLoading(false); return; }

    setLoading(true);
    setError(null);

    try {
      let profileData = null;

      // 1. Per user_id / id
      if (stableId) {
        console.log("🔶 STEP 7a — Supabase query mit stableId:", stableId);
        const res = await safeQuery(
          supabase.from("profiles").select(PROFILE_FIELDS).eq("id", stableId).single()
        );
        profileData = res?.data || null;
        console.log("🔶 STEP 8 — Supabase result", { profileData: !!profileData, id: profileData?.id, error: !profileData ? "KEIN PROFIL" : null });
      }

      // 2. Fallback: per username
      if (!profileData && stableUsername) {
        const res = await safeQuery(
          supabase.from("profiles")
            .select(PROFILE_FIELDS)
            .eq("username", stableUsername)
            .single()
        );
        profileData = res?.data || null;
      }

      // 3. Fallback: per display_name
      if (!profileData && stableName) {
        const res = await safeQuery(
          supabase.from("profiles")
            .select(PROFILE_FIELDS)
            .ilike("display_name", stableName)
            .limit(1)
            .single()
        );
        profileData = res?.data || null;
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
              .eq("approval_status", "approved")
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
              .select(`id,from_user_id,to_user_id,text,result_images,is_public,created_at,
                from_profile:profiles!recommendations_from_user_id_fkey(display_name,avatar_url)`)
              .eq("to_user_id", uid)
              .eq("is_public", true)
              .order("created_at", { ascending: false })
              .limit(20)
          ),
        ]);

        setWorks(filterValidFeedItems((worksRes?.data  || []).map(createWorkItem)));
        setExps(filterValidFeedItems((expsRes?.data   || []).map(createExperienceItem)));
        setRecs(recsRes?.data || []);  // recs haben kein eigenes Schema — passthrough
      }

      if (profileData) {
        console.log("✅ STEP 8 — Profil geladen + setProfile()", { id: profileData.id, display_name: profileData.display_name });
        setProfile(createProfileItem(normalizeProfileInput(profileData)));
      } else {
        console.warn("⚠️ STEP 8 — Kein profileData → Fallback wird gerendert");
        // Fallback: rawWirker als Profil-Basis
        // Normalisieren damit isProfileReady() greift
        const fallback = createProfileItem(normalizeProfileInput({
          ...raw,
          id: stableId || raw.id || null,
          user_id: stableId || raw.user_id || null,
          display_name: raw.display_name || raw.name || "HUI Creator",
        }));
        setProfile(fallback);
      }

    } catch (err) {
      console.error("[useWirkerProfile] Fehler:", err);
      setError(err);
      // Kein Crash: rawWirker als Fallback
      const fallback = createProfileItem(normalizeProfileInput({
        ...rawRef.current,
        id: stableId || null,
        user_id: stableId || null,
      }));
      setProfile(fallback);
    } finally {
      setLoading(false);
    }
  }, [stableId, stableUsername, stableName]); // ← primitives, kein Loop

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
