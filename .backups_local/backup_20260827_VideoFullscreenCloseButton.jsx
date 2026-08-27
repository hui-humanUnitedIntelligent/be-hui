// src/components/shared/VideoFullscreenCloseButton.jsx — NEU (2026-08-15)
// ══════════════════════════════════════════════════════════════════
// Nutzer-Report (Screenshot): "ein Moment wird geteilt mit einem Video,
// das Video lässt sich öffnen aber nicht mehr schließen -- entweder X
// oben rechts oder die System-Zurück-Taste muss funktionieren."
//
// ROOT CAUSE: Einzelne Video-Momente werden in BaseFeedCard.jsx als
// natives <video controls> Element inline im Feed gerendert (bewusst
// KEIN eigenes Lightbox-Overlay -- Kommentar "Single video: keep video
// with controls (no lightbox needed)"). Tippt der Nutzer auf das
// Vollbild-Icon der NATIVEN Browser/WebView-Videosteuerung, ruft das
// WebView intern video.requestFullscreen() auf -- das ist ein System-
// Vollbild-Modus AUSSERHALB des React-Baums (kein Modal/Overlay das wir
// rendern). Der App-weite AndroidBackButtonHandler kennt diesen Zustand
// nicht und ruft stattdessen die App-eigene Navigation auf (oder tut
// nichts) -- die Zurück-Taste schliesst das native Vollbild-Video nicht.
// Ein eigener X-Button existierte für diesen Fall bisher gar nicht.
//
// FIX (rein additiv, keine bestehende Logik veraendert): Globaler
// Listener auf die Fullscreen-Events (fullscreenchange + WebKit/Moz-
// Praefixe, fuer Android-WebView-Kompatibilitaet). Sobald irgendein
// <video>-Element in den nativen Vollbild-Modus wechselt, wird EIN
// eigener, klar sichtbarer X-Button oben rechts eingeblendet (zIndex
// ueber allem), der document.exitFullscreen() (+ Praefix-Varianten)
// aufruft. Zusaetzlich per useModalRegistration() im globalen Back-
// Button-Stack registriert, solange das Vollbild aktiv ist -- die
// System-Zuruecktaste schliesst das Vollbild-Video jetzt ebenfalls.
// ══════════════════════════════════════════════════════════════════
import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";

function getFullscreenElement() {
  if (typeof document === "undefined") return null;
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ||
    null
  );
}

function exitFullscreenNow() {
  try {
    if (document.exitFullscreen) { document.exitFullscreen(); return; }
    if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); return; }
    if (document.mozCancelFullScreen) { document.mozCancelFullScreen(); return; }
    if (document.msExitFullscreen) { document.msExitFullscreen(); return; }
  } catch { /* noop -- Button bleibt einfach bis das naechste Event kommt */ }
}

export default function VideoFullscreenCloseButton() {
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);

  useEffect(() => {
    function onFsChange() {
      const el = getFullscreenElement();
      // Nur einblenden wenn tatsaechlich ein <video>-Element im
      // Vollbild ist -- keine Einmischung in andere App-Fullscreen-Faelle.
      setIsVideoFullscreen(!!el && el.tagName === "VIDEO");
    }
    const events = ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"];
    events.forEach(ev => document.addEventListener(ev, onFsChange));
    onFsChange(); // initialer Check
    return () => events.forEach(ev => document.removeEventListener(ev, onFsChange));
  }, []);

  const handleClose = useCallback(() => { exitFullscreenNow(); }, []);

  // System-Zuruecktaste: solange das native Video-Vollbild aktiv ist,
  // hoechste Prioritaet im LIFO-Stack (wird zuletzt geoeffnet).
  useModalRegistration(isVideoFullscreen, handleClose, "VideoFullscreenCloseButton");

  if (!isVideoFullscreen) return null;
  const portalTarget = typeof document !== "undefined" ? document.body : null;
  if (!portalTarget) return null;

  return createPortal(
    <button
      onClick={handleClose}
      aria-label="Video schließen"
      style={{
        position: "fixed",
        top: "max(var(--hui-safe-top, 0px), 14px, env(safe-area-inset-top, 14px))",
        right: 16,
        zIndex: 2147483000, // ueber JEDEM nativen Vollbild-Layer (max sicherer Wert)
        width: 42, height: 42, borderRadius: "50%",
        background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.25)",
        color: "#fff", fontSize: 20, fontWeight: 600, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        touchAction: "manipulation", fontFamily: "inherit",
      }}
    >
      ✕
    </button>,
    portalTarget
  );
}
