// src/lib/imageOptimization.js
// MEDIA-LOADING-001 (2026-09-15, Michael-Spec, Anforderung 16): Performance —
// Supabase Storage Image Transformation fuer kleinere Bild-Nutzlasten.
//
// Voraussetzung in diesem Projekt NACHWEISLICH erfuellt: HUI nutzt die
// Supabase Transform API bereits produktiv fuer Avatar/Cover-Prewarm
// (TRANSFORM-PREWARM, 2026-09) — d.h. der Projekt-Plan unterstuetzt
// Image Transformation. Videos werden explizit NICHT transformiert
// (Transformation ist eine BILD-API — ?width=... auf .mov/.mp4 waere
// ungueltig und wuerde 400er/Ressourcenverschwendung produzieren; der
// Video-Pfad bleibt unberuehrt, siehe MediaVideo.jsx / VIDEO-BREITEN-FIX).
//
// Vorsicht bei bereits transformierten URLs: wenn die URL bereits
// Query-Parameter enthaelt (z.B. alte Prewarm-Varianten), wird sie
// unangetastet zurueckgegeben (kein Doppel-Append).
import { isVideoUrl } from "./uploadUtils.js";

/**
 * Optimiert eine Supabase-Storage-Bild-URL per Image Transformation.
 * @param {string} url
 * @param {{width?: number, quality?: number}} options — defaults: width 800, quality 80
 * @returns {string} optimierte URL oder die Original-URL (Video/nicht-Supabase/parametrisiert)
 */
export const optimizeImageUrl = (url, options = {}) => {
  const { width = 800, quality = 80 } = options;
  const u = String(url || "");
  if (!u) return u;

  // NUR Supabase-Storage-BILDER transformieren — nie Videos, nie
  // vorparametrisierte URLs, nie signierte chat-media-URLs (die Signatur
  // gilt exakt fuer den parametrisierten Pfad; Query-Append wuerde sie brechen)
  const isSupabaseStorage = u.includes("supabase.co/storage");
  const isSigned          = u.includes("/object/sign/");
  const hasParams         = u.includes("?");
  if (!isSupabaseStorage || isVideoUrl(u) || isSigned || hasParams) return u;

  return `${u}?width=${width}&quality=${quality}`;
};
