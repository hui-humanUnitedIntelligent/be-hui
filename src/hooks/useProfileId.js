// src/hooks/useProfileId.js — Sprint F.7B
// ══════════════════════════════════════════════════════════════
// Loest einen :username oder UUID aus der URL in eine stabile profileId auf.
//
// PROBLEM:
//   /profile/:username  ->  WirkerProfilePage braucht UUID fuer useProfileData
//   Frueher: useWirkerProfile machte den Lookup intern
//   Jetzt:  Resolver ist explizit + wiederverwendbar
//
// AUFLOESUNGS-REIHENFOLGE:
//   1. Wenn rawId bereits UUID-Format -> direkt verwenden (kein DB-Lookup)
//   2. Andernfalls: profiles.username = rawId -> id
//
// RUECKGABE:
//   { profileId: string|null, loading: boolean, error: string|null }
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient.js";

// UUID v4 Pattern
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ist rawId bereits eine UUID? */
export function isUuid(val) {
  return typeof val === "string" && UUID_RE.test(val.trim());
}

/**
 * useProfileId(rawId)
 *
 * rawId = UUID  -> direkt verwenden, kein DB-Lookup
 * rawId = username  -> SELECT id FROM profiles WHERE username = rawId
 * rawId = null  -> { profileId: null, loading: false, error: "Kein Identifier" }
 */
export function useProfileId(rawId) {
  const [profileId, setProfileId] = useState(() => isUuid(rawId) ? rawId : null);
  const [loading,   setLoading]   = useState(() => !isUuid(rawId) && !!rawId);
  const [error,     setError]     = useState(null);

  const rawRef = useRef(rawId);
  useEffect(() => { rawRef.current = rawId; }, [rawId]);

  useEffect(() => {
    if (!rawId) {
      setProfileId(null);
      setLoading(false);
      setError("Kein Identifier");
      return;
    }

    // Fall 1: bereits UUID
    if (isUuid(rawId)) {
      setProfileId(rawId);
      setLoading(false);
      setError(null);
      return;
    }

    // Fall 2: username -> DB-Lookup
    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase
      .from("profiles")
      .select("id")
      .eq("username", rawId.trim())
      .maybeSingle()
      .then(({ data, error: dbErr }) => {
        if (cancelled) return;
        if (dbErr) {
          setError(dbErr.message);
          setProfileId(null);
        } else if (data?.id) {
          setProfileId(data.id);
          setError(null);
        } else {
          setProfileId(null);
          setError("Profil nicht gefunden");
        }
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err && err.message ? err.message : "Netzwerkfehler");
        setProfileId(null);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [rawId]);

  return { profileId, loading, error };
}
