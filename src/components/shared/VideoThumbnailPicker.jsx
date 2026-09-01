// src/components/shared/VideoThumbnailPicker.jsx
// ══════════════════════════════════════════════════════════════════════
// VIDEO-THUMBNAIL-PICKER (2026-08-31, Michael-Vorgabe)
// UX-FIX (2026-09-01, Michael-Vorgabe): Scrubber ruckelte, Video lud
// nicht sauber, Bedienung wirkte nicht produktionsreif. Root Causes
// (siehe uploadUtils.js loadVideoElement/extractVideoFrame für Details):
//  1. Scrubber war sofort bedienbar sobald die Dauer bekannt war
//     (loadedmetadata), nicht wenn das Video tatsächlich abspielbereit
//     war (canplay) → Seeks trafen auf ungepufferte Daten → Ruckeln.
//     FIX: eigener `ready`-State, Scrubber erst danach aktiv, davor
//     sichtbarer Spinner statt stillem Nichts.
//  2. Jeder Pixel-Drag löste sofort einen Frame-Extract aus (canvas.
//     drawImage bei jedem onChange) → Overhead + sichtbares Rucken.
//     FIX: Extraktion debounced (140ms) + zusätzlich sofort bei
//     Pointer-Release (pointerup/touchend) — Regler-Bewegung selbst
//     bleibt sofort responsiv (eigener `time`-State ändert sich pro
//     Frame), nur die teure Bild-Extraktion wird entkoppelt.
//  3. Bei mehreren schnellen Zwischen-Extraktionen wurde eine neue
//     Anfrage einfach ÜBERSPRUNGEN wenn eine andere noch lief → das
//     zuletzt sichtbare Bild passte nicht mehr zur Reglerposition.
//     FIX: `pendingTimeRef` — während einer laufenden Extraktion
//     eingehende neue Zeitpunkte werden nicht verworfen, sondern nach
//     Abschluss der aktuellen sofort nachgezogen, bis der zuletzt
//     gewünschte Zeitpunkt tatsächlich als Bild angezeigt wird.
//
// Eine einzige, wiederverwendbare Komponente für alle 4 Upload-Flows
// mit Video (Momente/HuiMomentSheet, Werke/WerkWizard, Erlebnisse/
// ExperienceWizard, Talent-Angebote/TalentAngebotWizard) — kein
// Code-Duplikat pro Wizard (Punkt 7 der Anforderung). Der Fix wirkt
// sich automatisch auf alle 4 Flows aus, ohne dass sich an deren
// Props-Nutzung etwas ändert.
//
// Props (unverändert):
//   source        — File (frisch gewählt) ODER String-URL (Edit-Modus,
//                    bereits hochgeladenes Video)
//   onFrameReady  — (blob, dataUrl) => void
//   initialThumbnailUrl — optional; falls im Edit-Modus bereits ein
//                    thumbnail_url existiert, wird dieser sofort als
//                    Vorschau gezeigt (kein Flackern), OHNE erneute
//                    Frame-Extraktion — erst wenn der Nutzer den
//                    Scrubber bewegt, wird ein neuer Frame gezogen.
//   compact       — kleinere Kachel-Optik für Grid-Kontexte (Werke/
//                    Erlebnisse/Talente-Galerie). Default: großes
//                    16:9-Format (Momente-Compose-Screen).
//   label         — optionaler Hinweistext über dem Scrubber
// ══════════════════════════════════════════════════════════════════════
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "../../hooks/useTranslation.js";
import { loadVideoElement, extractVideoFrame, releaseVideoElement } from "../../lib/uploadUtils.js";

const EXTRACT_DEBOUNCE_MS = 140;

export default function VideoThumbnailPicker({
  source,
  onFrameReady,
  initialThumbnailUrl = null,
  compact = false,
  label,
}) {
  const { t } = useTranslation();
  const videoElRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [frameUrl, setFrameUrl] = useState(initialThumbnailUrl || null);
  const [err, setErr] = useState(false);
  const [ready, setReady] = useState(false);       // Video canplay/loadeddata erreicht
  const [extracting, setExtracting] = useState(false); // laufende Frame-Extraktion (visuelles Feedback)
  const [extractError, setExtractError] = useState(false); // letzte Extraktion fehlgeschlagen (kein Bild verfügbar)

  const capturingRef = useRef(false);
  const pendingTimeRef = useRef(null);   // letzter gewünschter Zeitpunkt während eine Extraktion läuft
  const debounceRef = useRef(null);
  const hasFrameRef = useRef(!!initialThumbnailUrl); // vermeidet stale closure in runCapture (useCallback)

  // Führt die eigentliche Extraktion aus — mit Nachzieh-Logik: falls
  // während des Laufs ein neuerer Zeitpunkt gewünscht wurde, wird dieser
  // direkt danach nachgezogen (statt verworfen), bis der zuletzt
  // gewünschte Stand tatsächlich angezeigt wird.
  const runCapture = useCallback(async (t) => {
    const v = videoElRef.current;
    if (!v) return;
    if (capturingRef.current) {
      pendingTimeRef.current = t;
      return;
    }
    capturingRef.current = true;
    setExtracting(true);
    try {
      const { blob, dataUrl } = await extractVideoFrame(v, t);
      hasFrameRef.current = true;
      setFrameUrl(dataUrl);
      setExtractError(false);
      onFrameReady?.(blob, dataUrl);
    } catch (e) {
      console.warn("[VideoThumbnailPicker] Frame-Extraktion fehlgeschlagen:", e?.message);
      // Nie einen Zustand hinterlassen, aus dem der Nutzer nicht mehr
      // herauskommt: bei Fehlschlag klar sichtbares Feedback statt
      // stillem Nichts — der Wizard selbst blockiert "Weiter" NICHT auf
      // Basis der Thumbnail-Extraktion, daher hängt der Nutzer hier nie
      // fest, soll das aber auch klar sehen können.
      if (!hasFrameRef.current) setExtractError(true);
    } finally {
      capturingRef.current = false;
      const next = pendingTimeRef.current;
      pendingTimeRef.current = null;
      if (next != null) {
        runCapture(next);
      } else {
        setExtracting(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFrameReady]);

  // Debounced öffentlicher Einstiegspunkt — wird bei jedem Scrub-Schritt
  // aufgerufen, löst aber erst nach EXTRACT_DEBOUNCE_MS ohne weitere
  // Bewegung (oder sofort bei Pointer-Release, siehe unten) tatsächlich
  // eine Extraktion aus. Verhindert Extraktion bei jedem Pixel-Drag.
  const captureAtDebounced = useCallback((t) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runCapture(t);
    }, EXTRACT_DEBOUNCE_MS);
  }, [runCapture]);

  const captureAtImmediate = useCallback((t) => {
    if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null; }
    runCapture(t);
  }, [runCapture]);

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    setErr(false);
    setReady(false);
    const prevVideoEl = videoElRef.current;
    loadVideoElement(source).then((v) => {
      if (cancelled) { releaseVideoElement(v); return; }
      videoElRef.current = v;
      setReady(true);
      const dur = v.duration && isFinite(v.duration) ? v.duration : 0;
      setDuration(dur);
      const fallbackTime = dur > 0 ? Math.min(1, dur / 2) : 0;
      setTime(fallbackTime);
      // Wenn bereits ein Thumbnail existiert (Edit-Modus), NICHT sofort
      // neu extrahieren — nur wenn der Nutzer den Scrubber bewegt.
      if (!initialThumbnailUrl) {
        captureAtImmediate(fallbackTime);
      }
    }).catch(() => {
      if (!cancelled) setErr(true);
    });
    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (prevVideoEl) releaseVideoElement(prevVideoEl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  // Regler-Bewegung: Position (time) reagiert immer sofort (visuell
  // butterweich), die teure Bild-Extraktion läuft debounced dahinter.
  const handleScrub = (e) => {
    const t = parseFloat(e.target.value);
    setTime(t);
    if (!ready) return;
    captureAtDebounced(t);
  };

  // Bei Loslassen des Reglers sofort (ohne Debounce-Wartezeit) den exakt
  // finalen Zeitpunkt extrahieren — Punkt 2 der Anforderung: "Extraktion
  // erst beim Loslassen des Reglers", nicht bei jedem Zwischenschritt.
  const handleScrubRelease = (e) => {
    if (!ready) return;
    const t = parseFloat(e.target.value);
    captureAtImmediate(t);
  };

  if (!source) return null;

  const boxSize = compact
    ? { width: "100%", aspectRatio: "1 / 1", borderRadius: 12 }
    : { width: "100%", aspectRatio: "16 / 9", borderRadius: 16 };

  const showSpinner = !err && (!ready || (extracting && !frameUrl));

  return (
    <div style={{ width: "100%" }}>
      <div style={{
        ...boxSize,
        overflow: "hidden", background: "#000", position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {frameUrl && !err ? (
          <img src={frameUrl} alt={t("upload.thumbnailAlt")}
            style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
              // Dezentes Abdunkeln während einer laufenden Extraktion —
              // klares visuelles Feedback statt eines abrupten "Sprungs"
              // zwischen altem und neuem Frame.
              opacity: extracting ? 0.72 : 1,
              transition: "opacity 120ms ease-out",
            }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#e8e4df" }} />
        )}

        {/* Lade-Spinner — sichtbar solange das Video noch nicht
            abspielbereit ist (Punkt 1: Ladezustand klar anzeigen) ODER
            während der allerersten Extraktion noch kein Bild da ist. */}
        {showSpinner && (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
            background: frameUrl ? "transparent" : "rgba(0,0,0,0.15)",
            pointerEvents: "none",
          }}>
            <div style={{
              width: compact ? 22 : 32, height: compact ? 22 : 32,
              borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.35)",
              borderTopColor: "#0EC4B8",
              animation: "hui-vtp-spin 0.8s linear infinite",
            }} />
            <style>{`@keyframes hui-vtp-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Play-Badge — rein dekorativ, signalisiert "das ist ein Video",
            ersetzt den nativen schwarzen Play-Icon-Platzhalter durch ein
            konsistentes, kleines Overlay über dem echten Bildinhalt. */}
        {!showSpinner && (
          <div style={{
            position: "absolute", width: compact ? 26 : 46, height: compact ? 26 : 46,
            borderRadius: "50%", background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}>
            <div style={{
              width: 0, height: 0, marginLeft: 2,
              borderTop: `${compact ? 6 : 9}px solid transparent`,
              borderBottom: `${compact ? 6 : 9}px solid transparent`,
              borderLeft: `${compact ? 9 : 14}px solid #fff`,
            }} />
          </div>
        )}
      </div>
      {duration > 0.3 && (
        <div style={{ marginTop: 8 }}>
          {(label || !compact) && (
            <div style={{ fontSize: 11, color: "rgba(26,53,48,0.55)", marginBottom: 4 }}>
              {ready ? (label || t("upload.chooseThumbnail")) : t("upload.videoLoading")}
            </div>
          )}
          {extractError && !frameUrl && (
            <div style={{ fontSize: 11, color: "rgba(217,83,79,0.85)", marginBottom: 4 }}>
              {t("upload.thumbnailExtractFailed")}
            </div>
          )}
          <input
            type="range" min={0} max={duration} step={0.05} value={time}
            onChange={handleScrub}
            onPointerUp={handleScrubRelease}
            onTouchEnd={handleScrubRelease}
            onMouseUp={handleScrubRelease}
            disabled={!ready}
            style={{
              width: "100%", height: compact ? 16 : 20,
              cursor: ready ? "pointer" : "wait",
              accentColor: "#0EC4B8",
              opacity: ready ? 1 : 0.5,
            }}
          />
        </div>
      )}
    </div>
  );
}
