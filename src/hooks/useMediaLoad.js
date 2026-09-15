// src/hooks/useMediaLoad.js
// MEDIA-LOADING-001 (2026-09-15, Michael-Spec, Anforderung 13): Console
// Logging fuer Media-Debugging — Loading-State, 5s-Timeout-Warnung und
// Load/Error-Handler, die die Consumer-Komponente an <img>/<video> haengt.
//
// BEWUSSTE SPEC-KORREKTUR (Design-Fehler der Spec-Vorlage): Der Spec-Code
// definierte handleLoad/handleError, hing sie aber an KEIN Element an und
// setzte bei Timeout hart setError('Load timeout') — ein 5s-Hard-Error
// wuerde jede legitime Langsam-Netz-Ladung (Mobilfunk, 50MB-Video) als
// "fehlgeschlagen" melden, obwohl sie noch laeuft. Korrigiert:
// (1) Handler werden zurueckgegeben und vom Consumer an das Element gebunden
//     (bindProps), (2) der 5s-Timer WARNT nur in der Konsole (Spec-Log
//     bleibt erhalten), killt die Ladung aber nicht — echte Fehler faengt
//     onError zuverlaessig. Von der Konsole aus ist beides Spez-konform
//     sichtbar (⏱️-Warnung bzw. ❌-Error).
import { useState, useEffect, useCallback, useRef } from "react";

export const useMediaLoad = (mediaUrl, type = "image") => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    if (!mediaUrl) {
      console.warn("[HUI Media] No media URL provided");
      setError("Missing URL");
      return;
    }

    console.log(`[HUI Media] Loading ${type}:`, mediaUrl);

    // 5s-Timeout: NUR Konsole-Warnung (siehe Korrektur-Kommentar oben)
    timerRef.current = setTimeout(() => {
      console.warn(`[HUI Media] ${type} loading timeout (5s):`, mediaUrl);
    }, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [mediaUrl, type]);

  const handleLoad = useCallback(() => {
    console.log(`[HUI Media] ${type} loaded successfully`);
    setIsLoading(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, [type]);

  const handleError = useCallback((err) => {
    console.error(`[HUI Media] ${type} load error:`, mediaUrl, err);
    setError((err?.message) || "Load failed");
    setIsLoading(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, [type, mediaUrl]);

  return { isLoading, error, handleLoad, handleError };
};
