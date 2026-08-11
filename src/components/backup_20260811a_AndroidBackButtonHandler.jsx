// src/components/AndroidBackButtonHandler.jsx
// ══════════════════════════════════════════════════════════════════════
// ZENTRALER Android Back-Button Handler
//
// Implementiert Capacitor App.addListener('backButton', ...) mit:
//   a) Modal/Overlay offen? → oberstes Modal schließen (via Registry)
//   b) Wizard offen (hui-wizard-open body class)? → close-event
//   c) Router kann zurück? → navigate(-1)
//   d) Auf Root-Route (/Home)? → Exit-Bestätigungs-Dialog
//
// PFLICHT: Muss INSIDE BrowserRouter leben (braucht useNavigate/useLocation)
//
// WICHTIG: @capacitor/app wird NICHT importiert (weder top-level noch dynamic).
// Stattdessen registerPlugin("App", {}) aus @capacitor/core —
// genau das, was @capacitor/app intern tut. Das erzeugt einen Proxy
// der auf Android/iOS das native Plugin anspricht, auf Web ein No-Op ist.
// Dadurch gibt es KEINEN Rollup-Resolve-Fehler beim Web-Build.
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { hasOpenModal, closeTopmostModal, getModalCount } from "../lib/backButtonRegistry.js";

// ── Plugin Proxy (läuft auf allen Plattformen, No-Op auf Web) ────────────────
const App = registerPlugin("App", {});

// ─── Exit-Confirm Dialog ─────────────────────────────────────────────
function ExitConfirmDialog({ onConfirm, onCancel }) {
  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 11000,
      background: "rgba(26,26,24,0.55)",
      backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{
        background: "#F7F5F0", borderRadius: 20, padding: 28,
        maxWidth: 340, width: "100%", textAlign: "center",
        boxShadow: "0 8px 32px rgba(26,26,24,0.25)",
      }}>
        <div style={{
          fontSize: 20, fontWeight: 600, color: "#1A1A18",
          letterSpacing: "-0.02em", marginBottom: 8,
        }}>
          App wirklich schließen?
        </div>
        <div style={{
          fontSize: 14, color: "rgba(26,26,24,0.52)",
          lineHeight: 1.5, marginBottom: 24,
        }}>
          Du bist auf der Startseite. Möchtest du HUI verlassen?
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "12px 0", borderRadius: 99,
              border: "1.5px solid rgba(26,26,24,0.12)",
              background: "transparent", color: "#1A1A18",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Weiter in HUI
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: "12px 0", borderRadius: 99,
              border: "none",
              background: "linear-gradient(135deg, #0EC4B8, #0DBBAF)",
              color: "white", fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Schließen
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Handler Component ──────────────────────────────────────────
export function AndroidBackButtonHandler({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const lastBackRef = useRef(0);
  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;

  // ── Back Button Listener ───────────────────────────────────────────
  useEffect(() => {
    let listenerPromise;
    let removed = false;

    const handleBack = () => {
      // ── Debounce: verhindert Doppel-Events (manche Geräte senden 2x) ──
      const now = Date.now();
      if (now - lastBackRef.current < 300) return;
      lastBackRef.current = now;

      // a) Registry hat offene Modals? → oberstes schließen
      if (hasOpenModal()) {
        closeTopmostModal();
        return;
      }

      // b) Body class hui-wizard-open (Fallback für Wizards ohne Registration)?
      if (document.body.classList.contains("hui-wizard-open")) {
        // Global event — wizard components that use useWizardBodyLock
        // but haven't registered can catch this
        window.dispatchEvent(new CustomEvent("hui:back-button"));
        return;
      }

      // c) Nicht auf Root-Route? → Router zurück
      const currentPath = pathnameRef.current;
      const isRoot = currentPath === "/Home" || currentPath === "/" || currentPath === "/";

      if (!isRoot) {
        // Check if we can go back in history
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          // No history → go to Home
          navigate("/Home", { replace: true });
        }
        return;
      }

      // d) Auf Root-Route → Exit-Bestätigung anzeigen
      setShowExitConfirm(true);
    };

    // ── Capacitor App Plugin (nur auf nativen Plattformen) ─────────────
    const setup = async () => {
      if (!Capacitor.isNativePlatform()) return;
      try {
        listenerPromise = App.addListener("backButton", handleBack);
      } catch (e) {
        // Fallback — Plugin nicht verfügbar
      }
    };

    setup();

    return () => {
      removed = true;
      listenerPromise?.then?.(listener => {
        listener?.remove?.();
      }).catch(() => {});
    };
  }, [navigate]); // location.pathname via ref — kein re-subscribe nötig

  // ── Exit Confirm Handlers ───────────────────────────────────────────
  const handleConfirmExit = useCallback(async () => {
    setShowExitConfirm(false);
    if (!Capacitor.isNativePlatform()) {
      window.close();
      return;
    }
    try {
      App.exitApp();
    } catch (e) {
      // Browser fallback — kann App nicht schließen
      window.close();
    }
  }, []);

  const handleCancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  return (
    <>
      {children}
      {showExitConfirm && (
        <ExitConfirmDialog
          onConfirm={handleConfirmExit}
          onCancel={handleCancelExit}
        />
      )}
    </>
  );
}
