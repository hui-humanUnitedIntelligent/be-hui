// src/components/entry/AppEntryController.jsx
// ─────────────────────────────────────────────────────────────
// Kapitel 1 – Ankommen: AppEntryController
//
// EINZIGE Stelle die entscheidet was nach dem Login passiert.
// Alle anderen Komponenten (HomeShell, ProfileLauncher, …)
// treffen keine Einstiegsentscheidungen mehr.
//
// State-Maschine:
//   loading      → warte auf user + auth
//   welcome      → zeige WelcomeOverlay (einmalig, pro Nutzer) — NEUE Nutzer
//   rulesUpdate  → zeige WelcomeOverlay im mode="rulesOnly" — bestehende
//                  Nutzer, die die erweiterten Hinweise (Regeln/Sicherheit/
//                  Kernbereiche) für die AKTUELLE App-Version noch nicht
//                  gesehen haben. Erscheint EINMAL PRO APP-UPDATE.
//                  (ERWEITERUNG 2026-08-23, Michael — reine Ergänzung,
//                  bestehende "welcome"-Phase bleibt unverändert)
//   ready        → App läuft normal, children werden gerendert
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext.jsx";
import WelcomeOverlay from "../welcome/WelcomeOverlay.jsx";
import {
  hasSeenWelcome, markWelcomeSeen,
  hasSeenRulesForVersion, markRulesSeenForVersion,
} from "../../lib/welcomePersistence.js";
import { APP_VERSION } from "../../version.js";

// ── Lade-Bildschirm (minimal, kein Flash) ─────────────────────
function EntryLoader() {
  return (
    <div style={{
      position: "fixed", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "transparent",
    }} />
  );
}

// ─────────────────────────────────────────────────────────────
export default function AppEntryController({ children }) {
  const { user, loadingAuth, authChecked } = useAuth();
  const navigate = useNavigate();

  // "loading" | "welcome" | "rulesUpdate" | "ready"
  const [phase, setPhase] = useState("loading");

  useEffect(() => {
    // Warte bis Auth-Check abgeschlossen ist
    if (loadingAuth || !authChecked) return;

    // Nicht eingeloggt → direkt ready (ProtectedRoute übernimmt Redirect)
    if (!user?.id) {
      setPhase("ready");
      return;
    }

    // Eingeloggt: Welcome schon gesehen?
    if (!hasSeenWelcome(user.id)) {
      setPhase("welcome");
    } else if (!hasSeenRulesForVersion(user.id, APP_VERSION)) {
      // Bestehender Nutzer, der die erweiterten Hinweise (Regeln/Sicherheit/
      // Kernbereiche) für DIESE App-Version noch nicht gesehen hat.
      setPhase("rulesUpdate");
    } else {
      setPhase("ready");
    }
  }, [user?.id, loadingAuth, authChecked]);

  // ── VORWORT-TILES-OPEN-FIX (2026-09-08, Report 0ddbab94) ──
  // Tap auf eine der 5 Grundbereichs-Kacheln im WelcomeOverlay schließt das
  // Overlay und navigiert zum Bereich. Da das Overlay VOR der Home-Shell
  // gerendert wird (App noch nicht gemountet), erfolgt der Tab-Wechsel über
  // einen sessionStorage-Entry-Key, den HomeShell beim Mount liest:
  //   hui_entry_tab       → "impact" | "discover" (Tab-Wechsel via switchTab)
  //   hui_discover_focus  → "werke" | "talente" | "erlebnisse" | "momente"
  //                         (DiscoverPage scrollt zur Section)
  function applyAreaEntry(areaKey) {
    try {
      if (!areaKey) return;
      if (areaKey === "impact") {
        sessionStorage.setItem("hui_entry_tab", "impact");
      } else {
        sessionStorage.setItem("hui_entry_tab", "discover");
        sessionStorage.setItem("hui_discover_focus", areaKey);
      }
    } catch { /* sessionStorage nicht verfügbar — Fallback: normaler Start */ }
  }

  // ── Einstieg nach Welcome (neue Nutzer) ────────────────────
  function handleWelcomeDone({ areaKey } = {}) {
    markWelcomeSeen(user?.id);
    // Neue Nutzer haben die Regeln/Kernbereiche direkt im vollen
    // WelcomeOverlay gesehen — für diese Version nicht erneut zeigen.
    markRulesSeenForVersion(user?.id, APP_VERSION);
    setPhase("ready");
    // Sicherstellung: Feed ist der erste Screen
    navigate("/Home", { replace: true });
    applyAreaEntry(areaKey);
  }

  // ── Einstieg nach Regel-Update-Hinweis (bestehende Nutzer) ──
  function handleRulesUpdateDone({ areaKey } = {}) {
    markRulesSeenForVersion(user?.id, APP_VERSION);
    setPhase("ready");
    // Keine Navigation — bestehender Nutzer bleibt auf seiner aktuellen Route.
    // AUSNAHME: Expliziter Bereichs-Tap (VORWORT-TILES-OPEN-FIX) — der Nutzer
    // hat aktiv einen Bereich gewählt und erwartet, dort zu landen.
    if (areaKey) {
      applyAreaEntry(areaKey);
      navigate("/Home", { replace: true });
    }
  }

  // ── Render ────────────────────────────────────────────────
  if (phase === "loading") return <EntryLoader />;

  if (phase === "welcome") {
    return <WelcomeOverlay onDone={handleWelcomeDone} />;
  }

  if (phase === "rulesUpdate") {
    return <WelcomeOverlay mode="rulesOnly" onDone={handleRulesUpdateDone} />;
  }

  // phase === "ready"
  return <>{children}</>;
}
