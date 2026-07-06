// src/context/RadiusContext.jsx — HUI Umkreissuche: globaler Radius-Zustand v1
// ══════════════════════════════════════════════════════════════════════
// VEREINHEITLICHUNG (2026-07-06, Lars-Ticket "Radius zentral vereinheitlichen")
//
// Vorher: useRadiusFilter.js hielt seinen State PRO Aufrufer lokal (React
// useState) und synchronisierte nur ueber localStorage beim naechsten Mount.
// Zwei Komponenten, die den Hook gleichzeitig aufriefen (z.B. SearchCommand-
// Center + DiscoverPage), bekamen dadurch zwei UNABHAENGIGE Zustaende, die
// sich erst nach einem Reload angeglichen haetten -- kein echtes "Single
// Source of Truth", live-Aenderungen an einer Stelle wirkten sich NICHT
// sofort auf die andere Stelle aus.
//
// Jetzt: Der komplette State + alle Aktionen leben EINMAL hier im Context,
// einmal an der App-Wurzel gemountet (App.jsx, neben AppStateProvider/
// OrbWorldProvider). useRadiusFilter() (src/hooks/useRadiusFilter.js) ist
// nur noch ein duenner useContext(RadiusCtx)-Wrapper -- exakt dieselbe
// oeffentliche API wie vorher, damit kein Aufrufer (SearchCommandCenter)
// angepasst werden musste.
//
// Konsumenten: SearchCommandCenter (globale Suche), DiscoverPage/
// TalenteSection (Wirker-Umkreissuche). Beide lesen/schreiben jetzt exakt
// denselben radiusKm/geo-Zustand.
// ══════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useCallback } from "react";
import { searchPlaces, distanceKm } from "../lib/geocoding.js";

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

const RadiusCtx = createContext(null);

export function RadiusProvider({ children }) {
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

  const value = {
    radiusKm, setRadiusKm, stages: RADIUS_STAGES, defaultRadiusKm: DEFAULT_RADIUS_KM,
    geo, setGeo, status, requestBrowserLocation, setManualPlace, clearLocation,
    isWorldwide: radiusKm === "world",
    distanceKm,
  };

  return <RadiusCtx.Provider value={value}>{children}</RadiusCtx.Provider>;
}

export function useRadiusContext() {
  const ctx = useContext(RadiusCtx);
  if (!ctx) {
    throw new Error("useRadiusContext() ausserhalb von <RadiusProvider> aufgerufen -- Provider fehlt in App.jsx.");
  }
  return ctx;
}
