// BugReportButton.jsx — Floating Bug-Käfer Button (2026-08-19)
// Position: unten rechts, direkt über der Navigation (oberhalb "Profil")
// Größe: ~25px (gleich groß wie der WerkeKorb)
// Sichtbar auf allen Hauptseiten: Home, Entdecken, Impact, Profil
// Additiv — keine bestehenden Elemente werden berührt.
//
// IOS-TAP-FIX (2026-09-08, iOS-BUG-002): Der bisherige Touch-Handler
// (onTouchEnd + e.preventDefault() + onPress) ist ein Android-typisches
// Muster — auf iOS-WebKit kann preventDefault im touchend die Click-
// Synthese stören. Auf iOS wird deshalb ein separater Eingabepfad genutzt:
// Pointer Events (iOS 13+, Deployment-Target 15) für den Pressed-State
// + onClick als alleinige Aktionsquelle. Der Android-Pfad ist ZEILENFÜR-
// ZEILE unverändert (IS_IOS-Fall greift dort nie).
// Zusätzlich iOS-only Diagnostik (1× pro App-Session, fire-and-forget über
// errorReporter → system_error_reports): Beweist serverseitig, ob Taps
// überhaupt im JS ankommen — nachweislich fehlten am 08.09. ALLE iOS
// bug_reports, obwohl die DB-Inserts auf iOS funktionieren (img_diag kam
// durch). Mit dem Marker lässt sich die Fehlerstelle exakt eingrenzen.
import React from "react";
import { createPortal } from "react-dom";
import { Capacitor } from "@capacitor/core";
import BugIcon from "./BugIcon.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";

// Plattform-Erkennung (SSOT-Muster wie BiometricGate/AndroidBackButtonHandler)
const IS_IOS = typeof window !== "undefined" && Capacitor.getPlatform?.() === "ios";

// iOS-Diagnostik: nur der ERSTE Tap pro App-Session wird geloggt (kein Spam)
let iosTapLogged = false;
function logIosTap() {
  if (iosTapLogged) return;
  iosTapLogged = true;
  try {
    import("../../lib/errorReporter.js").then(({ reportError }) => {
      reportError("ios_diag", { message: "BUG-BUTTON-TAP: Tap im JS registriert (iOS)", component: "BugReportButton" });
    });
  } catch (err) { console.debug("[BugReport] iOS-Tap-Diagnostik nicht verfügbar:", err); }
}

export default function BugReportButton({ onPress = () => {} }) {
  const { t } = useTranslation();
  const [pressed, setPressed] = React.useState(false);

  function handleTouchEnd(e) {
    e.preventDefault();
    setPressed(false);
    onPress?.();
  }

  return createPortal(
    <button
      onClick={() => {
        if (IS_IOS) logIosTap(); // iOS-Diagnostik (Android: unverändert ohne Zusatzlogik)
        onPress?.();
      }}
      /* Android-Pfad: unverändert (touchend + preventDefault + onPress) */
      onTouchStart={() => setPressed(true)}
      onTouchEnd={IS_IOS ? undefined : handleTouchEnd}
      /* iOS-Pfad: Pointer Events für Pressed-Visual, KEIN preventDefault,
         KEIN onPress aus touchend (sonst Doppel-Feuer mit onClick) */
      onPointerDown={IS_IOS ? () => setPressed(true) : undefined}
      onPointerUp={IS_IOS ? () => setPressed(false) : undefined}
      onPointerCancel={IS_IOS ? () => setPressed(false) : undefined}
      onPointerLeave={IS_IOS ? () => setPressed(false) : undefined}
      aria-label={t('bug.report')}
      style={{
        position: "fixed",
        bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
        right: "16px",
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.80)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1.5px solid rgba(91,107,125,0.18)",
        boxShadow: "0 1px 8px rgba(0,0,0,0.06), 0 0 0 2.5px rgba(91,107,125,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 9998,
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        transform: pressed ? "scale(0.93)" : "scale(1)",
        transition: "transform 0.22s ease",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <BugIcon size={22} color="#5B6B7D" />
    </button>,
    document.body
  );
}
