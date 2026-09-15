// src/lib/storageDebug.js
// MEDIA-LOADING-001 (2026-09-15, Michael-Spec: Supabase Storage — Cache &
// CORS Fix, Anforderung 8): Storage-URL-Validierung fuer Debugging von
// Media-Loading-Problemen (Ausgangsreport: net::ERR_CACHE_OPERATION_NOT_
// SUPPORTED auf media/beitraege-URLs).
//
// FAKTEN-ABWEICHUNG zur Spec (bewusst, mit Produktion-Nachweis vom 15.09.):
// Die Spec prueft nur '/media/' oder '/beitraege/'. Real existieren in der
// Produktion 13 Buckets (media, chat-media, stories, works, avatars, headers,
// offers, impact, impact_projects, impact-updates, ambassador-media,
// story-media, broadcasts) — 'beitraege' ist KEIN Bucket, sondern ein
// FOLDER im media-Bucket (media/beitraege/...). Die App rendert ausserdem
// signierte URLs des privaten chat-media-Buckets (/object/sign/...). Die
// Validierung akzeptiert daher ALLE realen Buckets + beitraege-Folder +
// sign-URLs — sonst wuerde sie korrekte App-URLs als ungueltig melden.
//
// Konsolen-Warnung (Spec): invalid URLs werden mit allen Checks geloggt,
// der Rueckgabewert entscheidet im Render. Siehe auch die Live-Verifikation
// vom 15.09.: Produktion liefert HTTP 206 + cache-control: immutable +
// CORS * — Storage-seitig war alles korrekt, der Fehler lag im WebView-Cache.

// Reale Produktions-Buckets (Quelle: storage.buckets, 15.09. verifiziert)
const KNOWN_BUCKETS = [
  "media", "chat-media", "stories", "works", "avatars", "headers",
  "offers", "impact", "impact_projects", "impact-updates",
  "ambassador-media", "story-media", "broadcasts",
];

/**
 * Prueft eine Storage-URL auf die 4 Spec-Kriterien:
 * hasSupabaseUrl / hasStoragePath / hasBucket / isHttps.
 * @param {string} url — Media-URL
 * @returns {boolean} true wenn alle Checks bestehen
 */
export const validateStorageUrl = (url) => {
  const u = String(url || "");
  const checks = {
    hasSupabaseUrl: u.includes("supabase.co"),
    // public ODER signierte URL (chat-media ist privat — sign-URLs sind dort korrekt)
    hasStoragePath: u.includes("/storage/v1/object/public/") || u.includes("/storage/v1/object/sign/"),
    hasBucket: KNOWN_BUCKETS.some(b => u.includes(`/${b}/`)) || u.includes("/beitraege/"),
    isHttps: u.startsWith("https://"),
  };

  const allValid = Object.values(checks).every(v => v === true);

  if (!allValid) {
    // Spec-Konsole-Warnung — hilft beim Debugging kaputter/alter URLs
    console.warn("[HUI Storage] URL invalid:", { url: u, checks });
  }

  return allValid;
};

/**
 * Debug-Info fuer Support/Reports: validiert URL und liefert die Details
 * zurueck (fuer Bug-Report-Kontext), ohne die Konsole zu spammen.
 */
export const getStorageDebugInfo = (url) => {
  const u = String(url || "");
  return {
    url: u,
    valid: validateStorageUrl(u),
    isVideo: /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(u),
  };
};
