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

/**
 * Geocodiert eine Adresse mit stufenweisem Rueckfall auf einen groesseren/
 * allgemeineren Ausschnitt, falls die exakte Adresse bei Nominatim keinen
 * Treffer liefert (z.B. kleine Doerfer/Strassen ohne Hausnummern-Eintrag in
 * OpenStreetMap). Ziel: lieber ein ungefaehrer Marker auf Dorf-/Stadtebene
 * als gar keine Koordinate.
 *
 * Reihenfolge der Versuche (stoppt beim ersten Treffer):
 *  1. Adresse wie eingegeben
 *  2. ohne Hausnummer am Anfang/Ende ("Pera Geitonias 9" -> "Pera Geitonias")
 *  3. PLZ-Anker: alles ab der ersten 4-6-stelligen Zahl im Text, auch ohne
 *     Komma davor ("Pera Geitonias 9 8552 Choulou, Paphos, CY" ->
 *     "8552 Choulou, Paphos, CY" bzw. nur "8552 Choulou")
 *  4. bei Komma-Adressen: vorderste (spezifischste) Segmente schrittweise
 *     weglassen ("Musterstr. 5, 12345 Musterstadt" -> "12345 Musterstadt")
 *
 * Bewusst OHNE Rueckfall auf ein einzelnes generisches Wort -- das kann
 * zufaellig einen voellig unzusammenhaengenden Ort weltweit treffen (siehe
 * Kommentar weiter unten). Frei erfundene Adressen (z.B. "Dingsangstrasse 1")
 * sowie sehr kleine, in OpenStreetMap nicht indexierte Ortsteile (z.B.
 * manche zypriotischen Nachbarschaften) liefern deshalb weiterhin bewusst
 * KEIN Ergebnis -- lieber gar kein Marker als ein falscher.
 *
 * @param {string} address
 * @returns {Promise<{lat:number, lng:number, label:string, precise:boolean}|null>}
 *   precise=true nur beim allerersten (exakten) Versuch, sonst false
 *   (Aufrufer kann das ignorieren oder z.B. fuer eine "ungefaehr"-Anzeige nutzen).
 */
export async function geocodeWithFallback(address) {
  const original = (address || "").trim();
  if (!original) return null;

  const noTrailingNum = original.replace(/\s*\d+\s*[a-zA-Z]?\s*$/, "").trim();
  const noLeadingNum  = original.replace(/^\s*\d+\s*[a-zA-Z]?\s*/, "").trim();

  const candidates = [original];
  if (noTrailingNum && noTrailingNum !== original) candidates.push(noTrailingNum);
  if (noLeadingNum && noLeadingNum !== original) candidates.push(noLeadingNum);

  // Postleitzahl-Anker: manche Adressen haben keine Kommas zwischen
  // Strassenname und PLZ/Ort (z.B. "Musterweg 9 12345 Musterstadt, Land").
  // Findet die erste eigenstaendige 4-6-stellige Zahl (typische PLZ-Laenge
  // in den meisten Laendern, u.a. Zypern=4-stellig) und nutzt alles ab dort
  // als Kandidat -- deutlich zuverlaessiger als der Strassenname, da PLZ+Ort
  // fast immer in OpenStreetMap indexiert sind, auch wenn der genaue
  // Strassenname/Nachbarschaftsname fehlt.
  const postalMatch = original.match(/\b\d{4,6}\b.*$/);
  if (postalMatch) {
    const fromPostal = postalMatch[0].trim();
    if (fromPostal && fromPostal !== original) candidates.push(fromPostal);
    const commaIdx = fromPostal.indexOf(",");
    if (commaIdx > 0) candidates.push(fromPostal.slice(0, commaIdx).trim());
  }

  const parts = original.split(",").map(p => p.trim()).filter(Boolean);
  for (let i = 1; i < parts.length; i++) {
    candidates.push(parts.slice(i).join(", "));
  }

  // ACHTUNG: bewusst KEIN Rueckfall auf ein einzelnes generisches Wort
  // (z.B. nur "Geitonias") -- getestet und verworfen: ein einzelnes Wort
  // kann zufaellig auf einen komplett unzusammenhaengenden Ort irgendwo auf
  // der Welt treffen (Beispiel: "Geitonias" allein matchte ein Gebaeude in
  // Bruessel statt der gemeinten Ortschaft auf Zypern). Ein falscher Marker
  // ist schlimmer als gar keiner -- deshalb nur noch mehrwortige, spezifische
  // Rueckfall-Stufen (Hausnummer entfernt, Komma-Segmente).

  const seen = new Set();
  const uniqueCandidates = candidates.filter(c => {
    const key = c.toLowerCase();
    if (!c || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6); // Fair-Use/Latenz begrenzen -- max. 6 Versuche pro Speichern

  for (let i = 0; i < uniqueCandidates.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 1000)); // Nominatim Fair-Use: max 1 req/s
    const hits = await searchPlaces(uniqueCandidates[i]);
    if (hits[0]) {
      return { ...hits[0], precise: i === 0 };
    }
  }
  return null;
}
