// src/components/system/WhatsNewModal.jsx
// ═══════════════════════════════════════════════════════════════════
// "Was ist neu"-Sheet (Michael 08.09.2026): Zeigt beim ersten Start einer
// neuen App-Version einmal die Nutzer-sichtbaren Highlights des Updates
// (Quelle: src/lib/releaseNotes.js — SSOT, vom Agent pro Release gepflegt).
//
// Timing (bewusst nicht sofort beim Cold-Start):
//   1. Nutzer muss authentifiziert sein (nicht auf Login/Biometrie-Screen)
//   2. Mind. 4s nach Mount (Intro-Video/Begrüssung nicht überlappen)
//   3. Erst wenn kein Wizard/Sheet offen ist (hui-wizard-open Body-Lock
//      ist der etablierte SSOT-Indikator aus useWizardBodyLock)
// Danach: einmal pro Version (localStorage-Merker), nie wieder.
//
// MICHAEL-VORGABE (08.09., 2. Runde): Die Infos duerfen NICHT verschwinden —
// KEIN Auto-Hide, KEIN Schliessen durch Backdrop-Klick. Der Nutzer schliesst
// AUSSCHLIESSLICH ueber den "Verstanden"-Button selbst (entscheidet selbst,
// wann er fertig mit Lesen ist).
//
// Pflicht-Regeln: createPortal(document.body) + zIndex >= 10500 (hier
// 10800 — über OTA-Popup und PIN/Biometrie-Sheets, unter Fehler-Overlays).
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { APP_VERSION } from "../../version.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { useAuth } from "../../lib/AuthContext.jsx";
import { getReleaseNotes } from "../../lib/releaseNotes.js";

const SEEN_KEY = "hui_whatsnew_seen_version";
const MIN_DELAY_MS = 4000;
const POLL_MS = 1000;

const T = {
  ink:       "#1A1A18",
  inkSoft:   "rgba(26,26,24,0.72)",
  teal:      "#0EC4B8",
  bg:        "#FDFBF8",
};

export default function WhatsNewModal() {
  const { t, lang } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [show, setShow] = useState(false);
  const timersRef = useRef([]);
  const notes = getReleaseNotes(APP_VERSION, lang);

  useEffect(function() {
    // Keine Notizen fuer diese Version (oder im Web-Storage bereits
    // gesehen) → nichts tun. Cleanup der Timer in jedem Fall.
    if (!notes || localStorage.getItem(SEEN_KEY) === APP_VERSION) return;

    let cancelled = false;
    const myTimers = [];
    timersRef.current = myTimers;

    function tryShow() {
      if (cancelled) return;
      if (!isAuthenticated) return; // naechster Poll versucht es wieder
      // Kein Sheet zeigen, waehrend ein Wizard/Sheet offen ist
      if (document.body.classList.contains("hui-wizard-open")) return;
      cancelled = true;
      setShow(true);
    }

    // Mind.-Verzoegung + danach Pollen bis Auth + kein Sheet offen
    const first = setTimeout(function() {
      tryShow();
      if (!cancelled) {
        const iv = setInterval(tryShow, POLL_MS);
        myTimers.push(iv);
        // Bewusst KEIN Aufgeben-Timer (Michael: Infos duerfen nicht
        // verschwinden) — wartet bis Auth + kein Sheet offen; wird es
        // in dieser Session nie sichtbar, zeigt er beim naechsten Start.
      }
    }, MIN_DELAY_MS);
    myTimers.push(first);

    return function() {
      cancelled = true;
      myTimers.forEach(function(h) { clearTimeout(h); clearInterval(h); });
    };
  }, [isAuthenticated, notes]);

  if (!show || !notes) return null;

  // Schliessen NUR durch den Verstanden-Button (Michael-Vorgabe)
  function dismiss() {
    localStorage.setItem(SEEN_KEY, APP_VERSION);
    setShow(false);
  }

  return createPortal(
    <div
      /* KEIN onClick — Michael-Vorgabe: schliessen nur via Verstanden-Button */
      style={{
        position: "fixed", inset: 0, zIndex: 10800,
        background: "rgba(26,26,24,0.55)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        fontFamily: "Inter,sans-serif",
      }}
    >
      <div
        onClick={function(e) { e.stopPropagation(); }}
        style={{
          width: "100%", maxWidth: 430, background: T.bg,
          borderRadius: "20px 20px 0 0",
          padding: "24px 22px calc(28px + max(env(safe-area-inset-bottom, 0px), 0px))",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.12)", margin: "0 auto 14px" }} />
        <div style={{ fontSize: 17, fontWeight: 700, color: T.ink, marginBottom: 2 }}>
          {t("whatsnew.title")}
        </div>
        <div style={{ fontSize: 12, color: T.teal, fontWeight: 600, marginBottom: 14 }}>
          {t("whatsnew.subtitle").replace("{version}", APP_VERSION)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
          {notes.map(function(item, i) {
            return (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                <span style={{ color: T.teal, fontSize: 13, lineHeight: 1.55, fontWeight: 700 }}>✓</span>
                <span style={{ fontSize: 13.5, color: T.inkSoft, lineHeight: 1.55 }}>{item}</span>
              </div>
            );
          })}
        </div>
        <button
          onClick={dismiss}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 12, border: "none", cursor: "pointer",
            background: T.teal, color: "#fff", fontSize: 14, fontWeight: 600,
            touchAction: "manipulation",
          }}
        >
          {t("whatsnew.btn")}
        </button>
      </div>
    </div>,
    document.body
  );
}
