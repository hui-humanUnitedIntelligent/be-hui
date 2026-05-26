// ════════════════════════════════════════════════════════════════
// useTalentActivation.js — Phase 4C
// Hook: openTalentActivationFlow() — kann von überall aufgerufen werden
// wenn BasisUser Creator-Aktion versucht
// ════════════════════════════════════════════════════════════════
import { useCallback } from "react";

export function useTalentActivation(setShowMembership) {
  const openTalentActivationFlow = useCallback(() => {
    if (typeof setShowMembership === "function") {
      setShowMembership(true);
    } else if (typeof window !== "undefined" && typeof window.__HUI_OPEN_TALENT_FLOW === "function") {
      window.__HUI_OPEN_TALENT_FLOW();
    } else {
      console.warn("[HUI] openTalentActivationFlow: kein Handler registriert");
    }
  }, [setShowMembership]);

  return { openTalentActivationFlow };
}

export function requireTalent(isTalent) {
  if (isTalent) return false;
  if (typeof window !== "undefined" && typeof window.__HUI_OPEN_TALENT_FLOW === "function") {
    window.__HUI_OPEN_TALENT_FLOW();
  }
  return true;
}
