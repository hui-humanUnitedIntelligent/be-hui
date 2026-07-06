// src/hooks/useRadiusFilter.js
// ══════════════════════════════════════════════════════════════════════
// UMKREISSUCHE (2026-07-06, Lars) — geteilter Radius-Zustand fuer die
// globale Suche (SearchCommandCenter). Wiederverwendet src/lib/geocoding.js
// (Nominatim-Suche + Haversine), das die parallele Session STANDORT-036
// bereits fuer die Talent-Standort-Suche gebaut hat -- KEIN zweites
// Geocoding-Modul, KEINE zweite Standort-Logik.
//
// Persistenz: radius + Nutzer-Koordinaten landen in localStorage, damit sie
// beim naechsten Oeffnen automatisch wiederhergestellt werden (Vorgabe).
// Standortabfrage (Browser-Geolocation) wird NIE automatisch beim Laden
// ausgeloest -- nur bei explizitem Nutzer-Tap (freundliche Anfrage, keine
// versteckte/aufdringliche Permission-Anfrage).
// ══════════════════════════════════════════════════════════════════════
import { useState, useCallback } from "react";
import { searchPlaces, distanceKm } from "../lib/geocoding.js";

// 9 Stufen inkl. "Weltweit" (deaktiviert den Distanzfilter komplett).
export const RADIUS_STAGES = [1, 5, 10, 25, 50, 100, 250, 500, "world"];
export const DEFAULT_RADIUS_KM = 25;

export function radiusLabel(stage) {
  return stage === "world" ? "Weltweit 🌍" : `${stage} km`;
}

const LS_RADIUS_KEY = "hui_radius_km";
const LS_GEO_KEY     = "hui_radius_geo"; // {lat,lng,label,source}

function loadStoredRadius() {
  try {
    const raw = localStorage.getItem(LS_RADIUS_KEY);
    if (raw == null) return DEFAULT_RADIUS_KM;
    if (raw === "world") return "world";
    const n = Number(raw);
    return RADIUS_STAGES.includes(n) ? n : DEFAULT_RADIUS_KM;
  } catch { return DEFAULT_RADIUS_KM; }
}

function loadStoredGeo() {
  try {
    const raw = localStorage.getItem(LS_GEO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/**
 * Zentraler Hook fuer den Umkreis-Zustand. Ein Aufruf pro Suchoberflaeche
 * (aktuell: SearchCommandCenter) -- kein globaler Context, da der Radius
 * bewusst pro Such-Session lokal im jeweiligen UI-Baustein lebt, aber ueber
 * localStorage geraeteweit konsistent bleibt.
 */
export function useRadiusFilter() {
  const [radiusKm, setRadiusKmState] = useState(loadStoredRadius);
  const [geo, setGeoState]           = useState(loadStoredGeo);
  const [status, setStatus]          = useState("idle"); // idle|requesting|denied|error

  const setRadiusKm = useCallback((stage) => {
    setRadiusKmState(stage);
    try { localStorage.setItem(LS_RADIUS_KEY, String(stage)); } catch {}
  }, []);

  const setGeo = useCallback((g) => {
    setGeoState(g);
    try {
      if (g) localStorage.setItem(LS_GEO_KEY, JSON.stringify(g));
      else localStorage.removeItem(LS_GEO_KEY);
    } catch {}
  }, []);

  // Freundliche Standortabfrage -- nur bei explizitem Tap aufrufen.
  const requestBrowserLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (!("geolocation" in navigator)) { setStatus("error"); resolve(null); return; }
      setStatus("requesting");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const g = { lat: pos.coords.latitude, lng: pos.coords.longitude, source: "gps", label: "Aktueller Standort" };
          setGeo(g); setStatus("idle"); resolve(g);
        },
        (err) => { setStatus(err?.code === 1 ? "denied" : "error"); resolve(null); },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
      );
    });
  }, [setGeo]);

  // Manuelle Ortsangabe (PLZ/Stadt) -- nutzt dieselbe Nominatim-Suche wie
  // die Talent-Standortsuche (searchPlaces), nimmt den ersten Treffer.
  const setManualPlace = useCallback(async (query) => {
    setStatus("requesting");
    const results = await searchPlaces(query);
    const hit = results?.[0];
    if (hit) {
      const g = { lat: hit.lat, lng: hit.lng, source: "manual", label: hit.label?.split(",")[0] || query };
      setGeo(g); setStatus("idle");
      return g;
    }
    setStatus("error");
    return null;
  }, [setGeo]);

  const clearLocation = useCallback(() => setGeo(null), [setGeo]);

  return {
    radiusKm, setRadiusKm, stages: RADIUS_STAGES, defaultRadiusKm: DEFAULT_RADIUS_KM,
    geo, status, requestBrowserLocation, setManualPlace, clearLocation,
    isWorldwide: radiusKm === "world",
    distanceKm, // durchgereicht fuer Aufrufer, die Distanz-Labels rendern wollen
  };
}

export default useRadiusFilter;
