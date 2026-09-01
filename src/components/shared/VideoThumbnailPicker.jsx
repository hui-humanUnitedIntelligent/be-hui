// src/components/shared/VideoThumbnailPicker.jsx
// ══════════════════════════════════════════════════════════════════════
// VIDEO-THUMBNAIL-PICKER (2026-08-31, Michael-Vorgabe)
// "Video-Thumbnail-Auswahl bei ALLEN Upload-Flows mit Video (statt
//  generischem Play-Icon-Platzhalter)"
//
// Eine einzige, wiederverwendbare Komponente für alle 4 Upload-Flows
// mit Video (Momente/HuiMomentSheet, Werke/WerkWizard, Erlebnisse/
// ExperienceWizard, Talent-Angebote/TalentAngebotWizard) — kein
// Code-Duplikat pro Wizard (Punkt 7 der Anforderung).
//
// Verhalten:
//  1. Lädt das Video (frisch gewählte File ODER bereits hochgeladene
//     Remote-URL im Edit-Modus) unsichtbar via loadVideoElement().
//  2. Extrahiert automatisch einen Fallback-Frame bei 1s (oder
//     Video-Mitte, falls kürzer) — Punkt 4 der Anforderung: NIE nackter
//     Play-Icon-Platzhalter ohne Bildinhalt.
//  3. Zeigt den extrahierten Frame als statisches Bild + einen
//     Scrubber/Slider, mit dem der Nutzer einen anderen Zeitpunkt als
//     Titelbild wählen kann — Live-Vorschau bei jedem Scrub.
//  4. Ruft onFrameReady(blob, dataUrl) bei jeder neuen Frame-Wahl auf
//     (auch beim initialen Fallback) — der Elternteil (Wizard) hält den
//     Blob im State und lädt ihn erst beim tatsächlichen Speichern hoch
//     (uploadThumbnail aus uploadUtils.js), analog zum bestehenden
//     Muster "_preview: true" in den Wizards.
//
// Props:
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
import { loadVideoElement, extractVideoFrame } from "../../lib/uploadUtils.js";

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
  const capturingRef = useRef(false);

  const captureAt = useCallback(async (t) => {
    const v = videoElRef.current;
    if (!v || capturingRef.current) return;
    capturingRef.current = true;
    try {
      const { blob, dataUrl } = await extractVideoFrame(v, t);
      setFrameUrl(dataUrl);
      onFrameReady?.(blob, dataUrl);
    } catch (e) {
      console.warn("[VideoThumbnailPicker] Frame-Extraktion fehlgeschlagen:", e?.message);
    } finally {
      capturingRef.current = false;
    }
  }, [onFrameReady]);

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    setErr(false);
    loadVideoElement(source).then((v) => {
      if (cancelled) return;
      videoElRef.current = v;
      const dur = v.duration && isFinite(v.duration) ? v.duration : 0;
      setDuration(dur);
      const fallbackTime = dur > 0 ? Math.min(1, dur / 2) : 0;
      setTime(fallbackTime);
      // Wenn bereits ein Thumbnail existiert (Edit-Modus), NICHT sofort
      // neu extrahieren — nur wenn der Nutzer den Scrubber bewegt.
      if (!initialThumbnailUrl) {
        captureAt(fallbackTime);
      }
    }).catch(() => {
      if (!cancelled) setErr(true);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const handleScrub = (e) => {
    const t = parseFloat(e.target.value);
    setTime(t);
    captureAt(t);
  };

  if (!source) return null;

  const boxSize = compact
    ? { width: "100%", aspectRatio: "1 / 1", borderRadius: 12 }
    : { width: "100%", aspectRatio: "16 / 9", borderRadius: 16 };

  return (
    <div style={{ width: "100%" }}>
      <div style={{
        ...boxSize,
        overflow: "hidden", background: "#000", position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {frameUrl && !err ? (
          <img src={frameUrl} alt={t("upload.thumbnailAlt")}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#e8e4df" }} />
        )}
        {/* Play-Badge — rein dekorativ, signalisiert "das ist ein Video",
            ersetzt den nativen schwarzen Play-Icon-Platzhalter durch ein
            konsistentes, kleines Overlay über dem echten Bildinhalt. */}
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
      </div>
      {duration > 0.3 && (
        <div style={{ marginTop: 8 }}>
          {(label || !compact) && (
            <div style={{ fontSize: 11, color: "rgba(26,53,48,0.55)", marginBottom: 4 }}>
              {label || t("upload.chooseThumbnail")}
            </div>
          )}
          <input
            type="range" min={0} max={duration} step={0.05} value={time}
            onChange={handleScrub}
            style={{ width: "100%", height: compact ? 16 : 20, cursor: "pointer", accentColor: "#0EC4B8" }}
          />
        </div>
      )}
    </div>
  );
}
