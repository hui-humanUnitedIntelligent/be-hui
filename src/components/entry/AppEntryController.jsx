// src/components/entry/AppEntryController.jsx
// ─────────────────────────────────────────────────────────────
// Kapitel 1 – Ankommen: AppEntryController
//
// EINZIGE Stelle die entscheidet was nach dem Login passiert.
// Alle anderen Komponenten (HomeShell, ProfileLauncher, …)
// treffen keine Einstiegsentscheidungen mehr.
//
// State-Maschine:
//   loading  → warte auf user + auth
//   welcome  → zeige WelcomeOverlay (einmalig, pro Nutzer)
//   ready    → App läuft normal, children werden gerendert
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext.jsx";
import WelcomeOverlay from "../welcome/WelcomeOverlay.jsx";
import { hasSeenWelcome, markWelcomeSeen } from "../../lib/welcomePersistence.js";

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

  // "loading" | "welcome" | "ready"
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
    if (hasSeenWelcome(user.id)) {
      setPhase("ready");
    } else {
      setPhase("welcome");
    }
  }, [user?.id, loadingAuth, authChecked]);

  // ── Einstieg nach Welcome ──────────────────────────────────
  function handleWelcomeDone() {
    markWelcomeSeen(user?.id);
    setPhase("ready");
    // Sicherstellung: Feed ist der erste Screen
    navigate("/Home", { replace: true });
  }

  // ── Render ────────────────────────────────────────────────
  if (phase === "loading") return <EntryLoader />;

  if (phase === "welcome") {
    return <WelcomeOverlay onDone={handleWelcomeDone} />;
  }

  // phase === "ready"
  return <>{children}</>;
}
