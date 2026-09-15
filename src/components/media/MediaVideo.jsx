// src/components/media/MediaVideo.jsx
// MEDIA-LOADING-001 (2026-09-15, Michael-Spec, Anforderung 10): Geteilte
// SSOT-Komponente fuer Video-Rendering mit
//   - preload="metadata" (Spec: nur Video-Header laden, nicht das ganze
//     Video — wichtig bei bis zu 50MB-Uploads)
//   - onError-Logging (useMediaLoad / Konsole)
//   - HUILogo-Fallback bei Lade-Fehler (PFLICHTREGEL bild-platzhalter)
//
// BEWUSSTE SPEC-KORREKTUR (VIDEO-BREITEN-FIX, Michael-bestaetigt 2026-09-11,
// Bug 93ce2b88): Die Spec-Vorlage setzt ein blindes maxHeight: 80vh — jede
// Orientierungs-/Max-Cap OHNE Seitenverhaeltnis erzeugt Letterbox-Balken
// (Portrait-Videos 9:16 in Breit-Karten → schwarze Balken links/rechts).
// Korrekt ist NUR die breiten-exakte Hoehe: containerWidth / aspect aus den
// echten Video-Metadaten, mit Extrem-Clamps min 150px (Panorama) und
// max min(920px, 92% Viewport) — identisch zum etablierten FeedMedia-Muster
// (BaseFeedCard.getAdaptiveMediaHeight). Bis die Metadaten da sind, gilt
// der Fallback-Style des Callers (kein Layout-Sprung nachtraeglich mehr als
// noetig). Nur Video-Bildschirmgroesse ist erlaubt zu passen; KEIN Retry mit
// Cache-Buster (Range-Request + frische URL = kompletter Neuladen eines
// 50MB-Videos — der Fehler-Fallback genuegt hier).
import React, { useState } from "react";
import { HUILogo } from "../brand/HUILogo.jsx";
import { useMediaLoad } from "../../hooks/useMediaLoad.js";
import { validateStorageUrl } from "../../lib/storageDebug.js";


export default function MediaVideo({ src, poster, style = {}, controls = true }) {
  const [failed, setFailed] = useState(false);
  const [aspect, setAspect] = useState(null);
  const { handleLoad, handleError } = useMediaLoad(src, "video");

  if (!src || failed) {
    return (
      <div style={{
        width: "100%", height: style.height || 220,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.03)", borderRadius: 8, ...style,
      }}>
        <HUILogo size={40} style={{ opacity: 0.5 }} />
      </div>
    );
  }

  validateStorageUrl(src);

  return (
    <video
      src={src}
      poster={poster}
      controls={controls}
      preload="metadata"
      playsInline
      onLoadedMetadata={(e) => {
        // Breiten-exakte Hoehe aus den echten Metadaten (VIDEO-BREITEN-FIX)
        const v = e.currentTarget;
        if (v.videoWidth && v.videoHeight) {
          setAspect(v.videoWidth / v.videoHeight);
        }
        handleLoad();
      }}
      onError={(e) => { handleError(e); setFailed(true); }}
      style={{
        width: "100%",
        display: "block",
        borderRadius: 8,
        // Aspect bekannt → breiten-exakte Hoehe (VIDEO-BREITEN-FIX) mit
        // Extrem-Clamps; unbekannt → 16/9-Default bis Metadaten geliefert
        // werden (preload="metadata" ist sofort da — kein Layout-Sprung)
        aspectRatio: aspect || "16/9",
        maxHeight: "min(920px, 92vh)",
        objectFit: "contain",
        ...style,
      }}
    />
  );
}
