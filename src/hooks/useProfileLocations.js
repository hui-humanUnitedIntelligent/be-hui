// src/hooks/useProfileLocations.js
// ══════════════════════════════════════════════════════════════════════
// PROFILE LOCATIONS — Mehrere Standorte pro Profil (hinzufügen/löschen)
// Tabelle: profile_locations (additiv, siehe Migration 20260706_066)
// Hält zusätzlich profiles.location/location_label (Legacy-Anzeigefeld,
// von vielen bestehenden Stellen noch gelesen) synchron mit dem
// Primär-Standort — kein Consumer muss dafür angepasst werden.
// ══════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient.js";

export function useProfileLocations(profileId) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    if (!profileId) { setLocations([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("profile_locations")
      .select("id,label,lat,lng,is_primary,created_at")
      .eq("profile_id", profileId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });
    if (mounted.current) {
      setLocations(error ? [] : (data || []));
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    mounted.current = true;
    load();
    if (!profileId) return () => { mounted.current = false; };

    const channel = supabase
      .channel(`profile_locations_${profileId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "profile_locations",
        filter: `profile_id=eq.${profileId}`,
      }, () => { load(); })
      .subscribe();

    return () => {
      mounted.current = false;
      supabase.removeChannel(channel);
    };
  }, [profileId, load]);

  const syncLegacyLocation = useCallback(async (label) => {
    if (!profileId) return;
    await supabase.from("profiles")
      .update({ location: label || null, location_label: label || null })
      .eq("id", profileId);
  }, [profileId]);

  const addLocation = useCallback(async ({ label, lat, lng }) => {
    if (!profileId || !label) return { ok: false, error: "Standort fehlt" };
    const isFirst = locations.length === 0;
    const { error } = await supabase.from("profile_locations").insert({
      profile_id: profileId, label, lat, lng, is_primary: isFirst,
    });
    if (error) return { ok: false, error: error.message };
    if (isFirst) await syncLegacyLocation(label);
    await load();
    return { ok: true };
  }, [profileId, locations.length, load, syncLegacyLocation]);

  const deleteLocation = useCallback(async (id) => {
    if (!id) return { ok: false };
    const wasPrimary = locations.find(l => l.id === id)?.is_primary;
    const { error } = await supabase.from("profile_locations").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    if (wasPrimary) {
      const remaining = locations.filter(l => l.id !== id);
      if (remaining[0]) {
        await supabase.from("profile_locations")
          .update({ is_primary: true })
          .eq("id", remaining[0].id);
        await syncLegacyLocation(remaining[0].label);
      } else {
        await syncLegacyLocation(null);
      }
    }
    await load();
    return { ok: true };
  }, [locations, load, syncLegacyLocation]);

  return { locations, loading, addLocation, deleteLocation, reload: load };
}

export default useProfileLocations;
