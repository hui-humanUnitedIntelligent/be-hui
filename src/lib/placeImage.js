// placeImage.js — Liefert ein echtes Sehenswuerdigkeits-/Landschaftsfoto fuer
// einen Ortsnamen (z.B. "Koeln" -> Skyline-Foto mit Koelner Dom), ueber freie
// Wikimedia-APIs (kein API-Key, CORS via origin=*).
//
// WICHTIGE ERKENNTNIS (empirisch getestet, nicht geraten): Wikipedia selbst
// liefert als "pageimage" einer Stadt meist NUR das Wappen oder die Flagge aus
// der Infobox (z.B. Koeln -> Stadtwappen, Wien/Berlin -> Flagge) -- das ist
// KEIN Sehenswuerdigkeits-/Reisefoto. Wikivoyage (das Reise-Wiki derselben
// Wikimedia-Foundation) verwendet dagegen fuer jeden Ort ein kuratiertes
// Titel-/Banner-Foto mit tatsaechlichem Landschafts-/Wahrzeichen-Charakter
// (getestet: Koeln -> Stadtbild mit Dom, Wien -> Stephansdom-Ansicht, Berlin
// -> Cityscape, Paphos -> historische Festung). Deshalb Prioritaet:
// 1. Wikivoyage DE   2. Wikivoyage EN   3. Wikipedia DE   4. Wikipedia EN
// Bei unbekannten/Test-Ortsnamen (z.B. "asdasd") liefert keine Quelle ein
// Ergebnis -> sauberer Fallback auf Icon-Placeholder in der UI, kein Crash.
//
// Ergebnis wird In-Memory + sessionStorage gecacht (aendert sich pro Session
// nicht) um wiederholte Netzwerk-Calls beim Scrollen/Re-Render zu vermeiden.

const memCache = new Map(); // placeName -> url|null (null = kein Bild gefunden)
const SS_PREFIX = "hui_place_img_v2:";

function readSessionCache(key) {
  try {
    const raw = sessionStorage.getItem(SS_PREFIX + key);
    if (raw === null) return undefined; // nicht gecacht
    return raw === "__null__" ? null : raw;
  } catch {
    return undefined;
  }
}

function writeSessionCache(key, value) {
  try {
    sessionStorage.setItem(SS_PREFIX + key, value === null ? "__null__" : value);
  } catch { /* Storage voll o.ae. -> ignorieren, In-Memory-Cache reicht */ }
}

async function fetchThumbnail(host, title) {
  const url = `https://${host}/w/api.php?action=query&prop=pageimages&format=json&origin=*&piprop=thumbnail&pithumbsize=500&redirects=1&titles=${encodeURIComponent(title)}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) return null;
  const json = await res.json();
  const pages = json?.query?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0];
  if (!page || page.missing !== undefined) return null;
  return page?.thumbnail?.source || null;
}

const SOURCES = [
  "de.wikivoyage.org",
  "en.wikivoyage.org",
  "de.wikipedia.org",
  "en.wikipedia.org",
];

/**
 * Liefert eine Bild-URL fuer einen Ortsnamen, oder null wenn keine gefunden wurde.
 */
export async function getPlaceImage(placeName) {
  const key = (placeName || "").trim();
  if (!key || key.length < 2) return null;

  if (memCache.has(key)) return memCache.get(key);

  const cached = readSessionCache(key);
  if (cached !== undefined) {
    memCache.set(key, cached);
    return cached;
  }

  let result = null;
  try {
    for (const host of SOURCES) {
      result = await fetchThumbnail(host, key);
      if (result) break;
    }
  } catch {
    result = null; // Netzwerkfehler -> sauberer Fallback, kein Crash
  }

  memCache.set(key, result);
  writeSessionCache(key, result);
  return result;
}
