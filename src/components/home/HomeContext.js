// src/components/home/HomeContext.js
// ══════════════════════════════════════════════════════════════════
// CIRCULAR-IMPORT-FIX (2026-08-30): HomeCtx + useHome standen bisher
// direkt in HomeShell.jsx. HuiActionProvider.jsx importierte useHome
// aus HomeShell.jsx, während HomeShell.jsx gleichzeitig
// HuiActionProvider.jsx importierte (um <HuiActionProvider> im JSX zu
// rendern) → echter zirkulärer Modul-Import. Bei eagerem Bundling
// (keine Lazy-Loads, siehe Memory #807/#936) verschiebt jede Änderung
// an benachbarten Chunks die Modul-Evaluierungsreihenfolge — das hat
// im ProfileLauncher-Chunk zu "Cannot access 'Ie' before
// initialization" (TDZ) geführt (App-Crash, PROFILE CRASH Screen).
//
// FIX: HomeCtx + useHome hierher extrahiert (kein Import von
// HomeShell.jsx NOCH von HuiActionProvider.jsx nötig) → beide Seiten
// importieren nur noch dieses neutrale Blatt-Modul, kein Zyklus mehr.
// HomeShell.jsx re-exportiert HomeCtx/useHome von hier, damit alle
// bestehenden 10 Consumer (ProfileLauncher, MyBasisProfile, etc.) ihre
// Imports aus "HomeShell.jsx" unverändert weiter nutzen können.
// ══════════════════════════════════════════════════════════════════

import { createContext, useContext } from "react";

export const HomeCtx = createContext(null);

export function useHome() {
  const ctx = useContext(HomeCtx);
  // Kein throw: TalentProfilePage/BasisProfilePage können auch außerhalb HomeShell
  // gerendert werden (PublicProfilePreview, ProfileLauncher). null-Return ist sicher.
  return ctx || null;
}
