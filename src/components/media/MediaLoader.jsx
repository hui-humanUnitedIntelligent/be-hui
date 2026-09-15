// src/components/media/MediaLoader.jsx
// MEDIA-LOADING-001 (2026-09-15, Michael-Spec, Anforderung 6): Fetch-basierte
// Media-Validierung mit Fehler-Toast — fuer Flaechen, die vor dem Rendern
// wissen muessen, ob eine URL wirklich ladbar ist (z.B. Lightbox-Vorcheck,
// Teilen-Flows). Fuer normales Bild-/Video-Rendering sind MediaImage /
// MediaVideo die SSOT (die haben onError-Pfade, kein fetch noetig).
//
// Toast: HUI-Toast-SSOT src/lib/useToast.jsx (toast.error) — die Spec nennt
// showToast(); die App hat kein showToast, das etablierte Toast-SSOT ist
// toast. Fehlertext kommt vom Caller (i18n-pflicht fuer sichtbare Texte —
// hier KEIN hardcoded DE-String, der Caller uebergibt t()-Uebersetzung).
import { toast } from "../../lib/useToast.jsx";

/**
 * Laedt eine Media-URL probehalber per fetch (Range-Header: nur 1 KB laden,
// kein 50MB-Download zur Pruefung noetig).
 * @param {string} url
 * @param {{message?: string}} opts — Toast-Text bei Fehlschlag (i18n vom Caller)
 * @returns {Promise<boolean>} true wenn HTTP ok
 */
export async function loadMedia(url, opts = {}) {
  try {
    const response = await fetch(url, { headers: { Range: "bytes=0-1024" } });
    if (!response.ok && response.status !== 206) {
      throw new Error(`HTTP ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error("[HUI Media] load error:", url, error);
    if (opts.message) toast.error(opts.message);
    return false;
  }
}
