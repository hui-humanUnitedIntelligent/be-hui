// src/components/shared/AutoPauseVideo.jsx — AUTOPAUSE-VIDEO-SSOT (2026-09-11)
//
// KONTEXT: Extrahiert aus BaseFeedCard.jsx (urspruenglich VIDEO-BG-AUDIO-001,
// 2026-09-11, Report b76f4fac). Vorher war die Pause-bei-Viewport-Verlassen-
// Logik NUR an den Sonderfall "Einzel-Video-Post" gebunden (der frueher einen
// eigenen <video>-Render-Pfad in BaseFeedCard hatte, statt durch ImageSlider zu
// laufen). Mehrfach-Media-Galerien mit eingebettetem Video (ImageSlider) hatten
// diesen Schutz NIE — ein Video mit Ton konnte dort unsichtbar im Hintergrund
// weiterlaufen, wenn der Tab/Surface gewechselt wurde (Keep-Alive-Tabs bleiben
// gemountet, siehe VIDEO-BG-AUDIO-001-Kommentar).
//
// FEED-VIDEO-INSTAGRAM-STYLE-001 (2026-09-11, Michael-Prompt "Feed-Redesign"):
// Im Zuge der Vereinheitlichung von Einzel-Video-Posts auf den ImageSlider-
// Renderpfad (siehe BaseFeedCard.jsx FeedMedia) wird diese Komponente jetzt
// die EINZIGE Quelle fuer "Video pausiert automatisch außerhalb des
// Viewports" — verwendet von ImageSlider fuer JEDEN inline <video>-Preview
// (Einzel-Video UND Video-Slide in einer Multi-Media-Galerie). Erweitern
// statt duplizieren (HUI-Architektur-Charta Prinzip 1).
//
// Nimmt alle normalen <video>-Props entgegen (src, poster, muted, loop,
// playsInline, autoPlay, style, onLoadedData, onError, className, ...) und
// reicht sie 1:1 an ein echtes <video>-Element weiter — nur der ref wird
// intern verwaltet (kein externer ref-Prop nötig/unterstützt, da kein Caller
// aktuell einen externen ref braucht).
import React, { useRef, useEffect } from "react";

export default function AutoPauseVideo(props) {
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || typeof IntersectionObserver === "undefined") return;
    let resumeOnVisible = false;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          if (resumeOnVisible) { resumeOnVisible = false; v.play().catch(() => {}); }
        } else if (!v.paused) {
          resumeOnVisible = true;
          v.pause();
        }
      }
    }, { threshold: 0.01 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return <video ref={videoRef} {...props} />;
}
