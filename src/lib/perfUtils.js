// src/lib/perfUtils.js — HUI Performance Utils
// VERIFIZIERT: Nur Spalten die in profiles wirklich existieren (Stand 2026-06-08)
// Verboten: membership_type, has_talent_profile, is_wirker, wirkerProfile,
//           impact_revenue,
//           profile_complete

// ─── Cache TTL ─────────────────────────────────────────────────
export const CACHE_TTL = {
  profiles:     60_000,
  works:        30_000,
  experiences:  30_000,
  feed:         20_000,
  discover:     60_000,
  notifications: 15_000,
};

// ─── Verifizierte Profile-Spalten ─────────────────────────────
// Genau die Spalten die in Supabase profiles-Tabelle existieren.
// NICHT ändern ohne DB-Prüfung!
// Identity Contract v1.0: PROFILE_FIELDS zeigt jetzt auf IDENTITY_CONTRACT
// Kein direktes Fieldset mehr — alle Consumer sollen auf ProfileService migrieren.
// PROFILE_FIELDS bleibt als Re-Export für Module die noch nicht migriert sind.
// Identity Contract v1.0 — hier definiert um Zirkelimport mit db.js zu vermeiden
// db.js importiert perfUtils → perfUtils darf NICHT db.js importieren
export const IDENTITY_CONTRACT =
  'id,display_name,full_name,username,avatar_url,bio,location_label,location,member_since,role,has_talent_profile,talent,membership_type,membership_active,followers_count,impact_eur,profile_views,website,tagline,focus_type,skills,dna_tags,is_available,hourly_rate';
export const PROFILE_FIELDS = IDENTITY_CONTRACT;

// ─── Legacy-FIELDS (für alte Komponenten die FIELDS.profile benutzen) ──
export const FIELDS = {
  profile: PROFILE_FIELDS,
};

// ─── Normalisierung ────────────────────────────────────────────
export function normalizeProfile(raw) {
  if (!raw) return null;
  return {
    id:                       raw.id,
    display_name:             raw.display_name   || null,
    username:                 raw.username        || null,
    avatar_url:               raw.avatar_url      || null,
    bio:                      raw.bio             || null,
    is_talent:                raw.is_talent       === true,
    talent_since:             raw.talent_since    || null,
    referred_by:              raw.referred_by     || null,
    blocked:                  raw.blocked         === true,
    profile_modules:          raw.profile_modules || {},
    skills:                   Array.isArray(raw.skills)   ? raw.skills   : [],
    dna_tags:                 Array.isArray(raw.dna_tags) ? raw.dna_tags : [],
    location:                 raw.location        || null,
    header_img:               raw.header_img      || null,
    focus_type:               raw.focus_type      || null,
    created_at:               raw.created_at      || null,
    updated_at:               raw.updated_at      || null,
  };
}

// ── Legacy Exports (von db.js, content.js, discovery/index.js benötigt) ──────
export const PAGE_SIZE = 20;

// Query-Cache (in-memory)
const _queryCache = new Map();

export async function safeQuery(fn, timeoutMs = 6000) {
  try {
    // fn kann callable (Funktion) oder direkt ein Promise/Thenable sein
    const query = typeof fn === 'function' ? fn() : fn;
    // Globaler Timeout pro Query — verhindert ewige Hänger (war ohne Limit!)
    const timeoutGuard = new Promise((_, rej) =>
      setTimeout(() => rej(new Error(`safeQuery timeout after ${timeoutMs}ms`)), timeoutMs)
    );
    const result = await Promise.race([query, timeoutGuard]);
    return result;
  } catch (e) {
    if (e?.message?.includes("timeout")) {
      console.warn("[HUI safeQuery] Timeout:", e.message);
    } else {
      console.warn("[HUI safeQuery] Fehler:", e?.message);
    }
    return { data: null, error: e };
  }
}

export async function cachedQuery(key, fn, ttl = 30_000) {
  const now = Date.now();
  const cached = _queryCache.get(key);
  if (cached && now - cached.ts < ttl) return cached.data;
  const result = await fn();
  if (!result?.error) {
    _queryCache.set(key, { data: result, ts: now });
  }
  return result;
}

// Manuell einen Cache-Eintrag setzen (für Prewarming aus Feed-Daten)
export function warmQueryCache(key, data, ttl = 30_000) {
  _queryCache.set(key, { data: { data, error: null }, ts: Date.now() - (ttl - 55_000) });
  // ts so setzen dass TTL noch ~55s übrig bleibt (verhindert sofortigen Ablauf)
}



// Synchroner Cache-Lesezugriff (kein Network, kein Promise)
// Nutzt prewarm: Key aus ProfileService.prewarm() für Instant-Render
export function readCache(key) {
  const now = Date.now();
  const cached = _queryCache.get(key);
  if (cached && now - cached.ts < 60_000) return cached.data;
  return null;
}



// Prefetch-on-Intent: Befüllt den prewarm-Cache für ein fremdes Profil
// Wird bei onPointerDown/onMouseEnter auf klickbaren Profil-Verweisen aufgerufen
// Bevor die Navigation startet → Cache ist warm wenn useProfileData liest

export async function prefetchProfile(profileId) {
  if (!profileId || typeof profileId !== "string") return;
  // Wenn Cache bereits warm → kein Duplicate Request
  const cached = readCache(`prewarm:${profileId}`);
  if (cached?.data) return;
  // Dynamic import — vermeidet Zirkelimport (db.js → perfUtils.js)
  const { ProfileService } = await import("../services/db.js");
  ProfileService.getById(profileId)
    .then(({ data }) => {
      if (data) ProfileService.prewarm([data]);
    })
    .catch(() => {});
}

// ─── HEADER-INSTANT-FIX (2026-08-10) ──────────────────────────────
// Root Cause: Der In-Memory prewarm-Cache (readCache) lebt nur im
// laufenden JS-Modul und wird bei JEDEM App-Neustart geleert. Das
// eigene Profil wird nie über eine Discover-Karte "vorgewärmt" (das
// passiert nur bei fremden Profilen via prefetchProfile), daher
// musste der Header bei jedem Öffnen des eigenen Profils komplett auf
// den Netzwerk-Request warten, bevor Avatar/Cover zu rendern begannen
// -- das war die sichtbare Verzögerung.
// Fix: Zusätzlicher, persistenter localStorage-Cache (überlebt App-
// Neustarts) für die zuletzt erfolgreich geladenen Profil-Header-Felder
// (nur öffentliche Felder, keine Telefonnummer/PII). Wird als zweite
// Instant-Render-Stufe genutzt, WENN der In-Memory-Cache leer ist —
// die normale Netzwerk-Aktualisierung im Hintergrund bleibt unverändert
// bestehen und überschreibt den Cache anschließend mit frischen Daten.
const OWN_PROFILE_CACHE_PREFIX = "hui_profile_cache_v1:";

export function readPersistedProfile(profileId) {
  if (!profileId) return null;
  try {
    const raw = localStorage.getItem(OWN_PROFILE_CACHE_PREFIX + profileId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === "object") ? parsed : null;
  } catch {
    return null;
  }
}

export function writePersistedProfile(profileId, data) {
  if (!profileId || !data) return;
  try {
    localStorage.setItem(OWN_PROFILE_CACHE_PREFIX + profileId, JSON.stringify(data));
  } catch {
    // Storage voll/deaktiviert (z.B. privater Modus) — nicht kritisch, ignorieren
  }
}

export function clearQueryCache(keyPrefix) {
  if (!keyPrefix) { _queryCache.clear(); return; }
  for (const k of _queryCache.keys()) {
    if (k.startsWith(keyPrefix)) _queryCache.delete(k);
  }
}

export function buildPage(query, page = 0, pageSize = PAGE_SIZE) {
  const from = page * pageSize;
  const to   = from + pageSize - 1;
  return query.range(from, to);
}

// ── Weitere Legacy-Exports (von Komponenten benötigt) ─────────
export async function batchQueries(queries) {
  // Führt mehrere Supabase-Queries parallel aus
  const results = await Promise.allSettled(queries.map(q => q()));
  return results.map(r => r.status === 'fulfilled' ? r.value : { data: null, error: r.reason });
}

// ── Supabase Image Optimization ────────────────────────────────
// SUPABASE_IMG_OPT (2026-08-08): Nutzt Supabase Image Resizing API um
// Thumbnails on-the-fly zu generieren — reduziert Download-Größe drastisch.
// Avatar: 200px (Retina: 400px), Cover: 800px, Card: 400px.
// Fallback: Original-URL wenn Render-API nicht verfügbar.
const SUPABASE_HOST = (import.meta.env.VITE_SUPABASE_URL || '').replace(/^https?:\/\//, '').trim();

// ZOOM-BUG-FIX (2026-08-10): Supabase Image Resizing API verzerrte JEDES
// Bild, dessen Original-Hoehe != Original-Breite war. Ursache: Ohne
// `resize`-Parameter erzwingt die API die angeforderte `width`, laesst die
// HOEHE aber auf der Original-Pixelzahl stehen (z.B. 480x640 Original ->
// "width=200" ergab 200x640 statt proportional 200x267) -- das Bild wurde
// in der Breite zusammengequetscht, in der Hoehe unveraendert gelassen.
// Mit object-fit:contain (siehe fix "Avatar-Bild-Zoom reduziert" von heute
// morgen) wurde dieses verzerrte Bild dann VOLLSTAENDIG angezeigt statt
// nur angeschnitten -> der gemeldete extreme "Zoom"/Stauch-Effekt bei
// Avataren. Fix: `resize=contain` Parameter ergaenzt -- die API skaliert
// jetzt IMMER proportional zur angeforderten `width`, unabhaengig vom
// Seitenverhaeltnis des Originals. Betrifft alle 4 Funktionen unten
// (Avatar/Cover/Card/Thumbnail) gleichermassen, da alle ueber diese eine
// Funktion laufen. Keine Breite/Groessen-Werte geaendert -- rein additiv.
export function optimizeImg(url, width = 400, quality = 75) {
  if (!url || typeof url !== 'string') return url;
  // SVG und lokale Assets nicht optimieren
  if (url.endsWith('.svg') || url.startsWith('/assets/') || url.startsWith('./')) return url;
  // Unsplash mit Size-Param
  if (url.includes('unsplash.com')) return `${url}&w=${width}&q=${quality}&auto=format`;
  // Supabase Image Resizing API
  if (SUPABASE_HOST && url.includes(SUPABASE_HOST)) {
    // Pattern: https://host/storage/v1/object/public/bucket/path → /storage/v1/render/image/public/bucket/path?width=W&quality=Q&resize=contain
    if (url.includes('/storage/v1/object/public/')) {
      return url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + `?width=${width}&quality=${quality}&format=webp&resize=contain`;
    }
    // Wenn bereits eine signed URL oder andere Form, nicht verändern
  }
  return url;
}

// WERK-BILDER-SLIDE-FIX (2026-08-20, Michael-Feedback "Bilder lassen sich
// nicht sliden"): Root Cause war zweistufig:
// (1) useFeedStream.js SELECT für 'works' holte nur cover_url/media_url,
//     nie die images-Spalte -> Feed/Quick-Preview kannten nur 1 Bild.
// (2) works.images ist in der DB eine text[]-Spalte (anders als
//     experiences.images/talents.images, die jsonb sind). WerkWizard.jsx
//     schickte Objekte {url,path} an diese text[]-Spalte -> Postgres/
//     PostgREST serialisiert jedes Objekt zu einem JSON-STRING pro Array-
//     Element ('{"url":"...","path":"..."}' als TEXT), da text[] keine
//     Objekte aufnehmen kann. Jeder Consumer der images[] direkt als URL-
//     String benutzte (unifiedNormalizer.extractMedia, WorkDetailPage.
//     getImages) bekam dadurch keine gültige Bild-URL mehr.
// Fix: (a) diese Hilfsfunktion parst beide Formen robust -- neue,
//     korrekt geschriebene Klartext-URLs UND bereits vorhandene, defekt
//     JSON-stringifizierte Altdaten. (b) WerkWizard.jsx schreibt ab jetzt
//     nur noch Klartext-URL-Strings (kein Objekt mehr) in die Spalte.
export function extractWorkImageUrl(entry) {
  if (!entry) return null;
  if (typeof entry === "string") {
    const t = entry.trim();
    // Alt-Daten: text[]-Element enthält einen JSON-String {"url":"...",...}
    if (t.startsWith("{")) {
      try {
        const obj = JSON.parse(t);
        return (obj && typeof obj.url === "string") ? obj.url : null;
      } catch (_) { return null; }
    }
    return t || null;
  }
  if (typeof entry === "object" && typeof entry.url === "string") return entry.url;
  return null;
}

// Spezifische Optimierungs-Funktionen für verschiedene Kontexte
export function optimizeAvatar(url)  { return optimizeImg(url, 200); }
export function optimizeCover(url)   { return optimizeImg(url, 800); }
export function optimizeCard(url)    { return optimizeImg(url, 400); }
export function optimizeThumbnail(url) { return optimizeImg(url, 150); }

// LIGHTBOX-HEIC-FIX (2026-08-11): Fullscreen-Bildbetrachter (ImageLightbox,
// ImageGalleryModal) luden bisher die ROHE Original-Datei direkt (current.url).
// Bilder, die im HEIC-Format hochgeladen wurden (z.B. von iPhones), koennen
// von KEINEM Browser/WebView in einem <img>-Tag dekodiert werden -> das Bild
// "poppt auf" (Modal oeffnet), das <img> feuert aber niemals "onLoad" ->
// endloser Spinner auf schwarzem Hintergrund. Feed-Thumbnails hatten dieses
// Problem NICHT, weil sie ueber optimizeCard() liefen, was die Supabase
// Image-Resizing-API (render/image) nutzt -- diese transkodiert JEDE
// Quelle (auch HEIC) verlustfrei zu WebP. Fix: Lightbox/Galerie nutzen jetzt
// optimizeFull() (grosse Breite 1600px, hohe Qualitaet 90) statt der rohen
// Original-URL -- garantiert dekodierbares WebP, unabhaengig vom
// Upload-Quellformat. Kombiniert mit onError-Fallback (roh-URL -> Original,
// falls Transform-API mal nicht verfuegbar ist) und einer echten
// Fehleranzeige statt endlosem Spinner, falls beides fehlschlaegt.
export function optimizeFull(url) { return optimizeImg(url, 1600, 90); }

export function normalizeProfileInput(raw) {
  return normalizeProfile(raw);
}
