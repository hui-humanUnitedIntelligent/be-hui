// src/components/media/MediaImage.jsx
// MEDIA-LOADING-001 (2026-09-15, Michael-Spec, Anforderungen 6/8/9/13/16):
// Geteilte SSOT-Komponente fuer Bild-Rendering mit
//   - Storage-URL-Validierung (storageDebug.validateStorageUrl)
//   - Image-Optimization (imageOptimization.optimizeImageUrl, nur Bilder)
//   - Loading-Placeholder + Fehler-Fallback (PFLICHTREGEL bild-platzhalter:
//     HUI-Logo statt grauer Box / Emoji — Spec-Vorlage mit #f0f0f0-Box +
//     ⚠️-Text wurde bewusst auf die kanonische Markenkomponente umgelenkt)
//   - Debug-Logging (useMediaLoad)
//   - CACHE-BYPASS-RETRY — die eigentliche App-Antwort auf den Ausgangs-
//     Fehler net::ERR_CACHE_OPERATION_NOT_SUPPORTED: Der WebView-Cache
//     verweigerte die Operation, nicht der Server (Live-Nachweis 15.09.:
//     Produktion liefert 206 + CORS * + immutable-Cache-Header). Beim
//     ersten Lade-Fehler wird EINMAL mit Cache-Buster (?hui-retry=<ts>)
// // neu geladen — eine andere URL umgeht den defekten Cache-Eintrag.
//     Erst beim zweiten Fehlschlag erscheint der HUILogo-Fallback.
import React, { useState } from "react";
import { HUILogo } from "../brand/HUILogo.jsx";
import { useMediaLoad } from "../../hooks/useMediaLoad.js";
import { validateStorageUrl } from "../../lib/storageDebug.js";
import { optimizeImageUrl } from "../../lib/imageOptimization.js";

/**
 * @param {string}  src     — Bild-URL (Storage oder extern)
 * @param {string}  alt     — Alt-Text (Pflicht fuer Accessibility)
 * @param {object}  style   — zusaetzliche Styles fuer den Container
 * @param {object}  imgStyle — zusaetzliche Styles fuer das <img>
 * @param {number}  optimizeWidth  — Transform-Breite (Default 800)
 * @param {number}  optimizeQuality — Transform-Qualitaet (Default 80)
 * @param {boolean} skipOptimize — Transformation aus (z.B. exakte Pixel noetig)
 */
export default function MediaImage({
  src, alt = "", style = {}, imgStyle = {},
  optimizeWidth = 800, optimizeQuality = 80, skipOptimize = false,
  imgProps = {},
}) {
  const [retryUrl, setRetryUrl]   = useState(null);  // Cache-Bypass-URL (1 Versuch)
  const [failed, setFailed]       = useState(false); // beide Versuche gescheitert
  const { isLoading, handleLoad } = useMediaLoad(src, "image");

  if (!src || failed) {
    // PFLICHTREGEL bild-platzhalter: HUI-Logo-Platzhalter, nie blank/Emoji
    return (
      <div style={{
        width: "100%", height: style.height || 220,
        display: "flex", alignItems: "center", justifyContent: "center",
        ...style,
      }}>
        <HUILogo size={40} style={{ opacity: 0.5 }} />
      </div>
    );
  }

  // Anforderung 8: URL validieren (loggt Warnung bei invalid, laedt trotzdem —
  // keine Redux-Falle: valide externe/CDN-URLs duerfen nicht blockiert werden)
  validateStorageUrl(src);

  const effectiveSrc = retryUrl || (skipOptimize ? src : optimizeImageUrl(src, {
    width: optimizeWidth, quality: optimizeQuality,
  }));

  return (
    <div style={{ width: "100%", position: "relative", ...style }}>
      {isLoading && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.03)", borderRadius: 8,
        }}>
          <HUILogo size={32} style={{ opacity: 0.35 }} />
        </div>
      )}
      <img
        src={effectiveSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={() => {
          // Sign-URLs (privater chat-media-Bucket) duerfen KEINEN Cache-Buster
          // bekommen — Query-Anhaenge brechen die Signatur. Direkt zum Fallback.
          const isSigned = src.includes("/object/sign/");
          if (!retryUrl && !isSigned) {
            // CACHE-BYPASS-RETRY: einmalig mit frischer URL am defekten
            // WebView-Cache-Eintrag vorbei (ERR_CACHE_OPERATION_NOT_SUPPORTED)
            console.warn("[HUI Media] image failed — retrying with cache-buster:", src);
            setRetryUrl(`${src}${src.includes("?") ? "&" : "?"}hui-retry=${Date.now()}`);
          } else {
            console.error("[HUI Media] image failed after retry:", src);
            setFailed(true);
          }
        }}
        style={{ width: "100%", display: "block", ...imgStyle }}
        {...imgProps}
      />
    </div>
  );
}
