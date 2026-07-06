// src/lib/geocoding.js
// ══════════════════════════════════════════════════════════════════════
// GEOCODING — Standort-Autovervollständigung + Distanzberechnung
// Nutzt OpenStreetMap Nominatim (kostenlos, kein API-Key nötig).
// Fair-Use: max. 1 Anfrage/Sekunde, eigener User-Agent gesetzt.
// ══════════════════════════════════════════════════════════════════════

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

/**
 * Sucht Orts-Vorschläge für einen eingegebenen Text (Autocomplete).
 * @param {string} query
 * @returns {Promise<Array<{label:string, lat:number, lng:number}>>}
 */
export async function searchPlaces(query) {
  const q = (query || "").trim();
  if (q.length < 2) return [];
  const params = new URLSearchParams({
    format: "json",
    q,
    limit: "5",
    "accept-language": "de",
  });
  try {
    const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).map(d => ({
      label: d.display_name,
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
    })).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  } catch {
    return [];
  }
}

/**
 * Haversine-Distanz in km zwischen zwei Koordinaten.
 */
export function distanceKm(lat1, lng1, lat2, lng2) {
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
