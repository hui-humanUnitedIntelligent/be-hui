// src/hooks/useModalRegistration.js
// ══════════════════════════════════════════════════════════════════════
// Hook: Registriert ein Modal/Overlay im globalen Back-Button-Stack.
//
// Usage in einer Modal-Komponente:
//   const { isOpen, onClose } = props;
//   useModalRegistration(isOpen, onClose, "MyModal");
//
// Wenn isOpen=true: registriert onClose im globalen Stack.
// Wenn isOpen=false oder Unmount: automatisch unregistriert.
//
// Der AndroidBackButtonHandler ruft die zuletzt registrierte
// Close-Funktion auf → Modal schließt sich.
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useRef } from "react";
import { registerModal } from "../lib/backButtonRegistry.js";

export function useModalRegistration(isOpen, closeFn, label = "modal") {
  // Stabile Ref zur closeFn — verhindert re-register bei jedem Render
  const closeRef = useRef(closeFn);
  closeRef.current = closeFn;

  useEffect(() => {
    if (!isOpen) return;
    // Registriere mit stabiler Wrapper-Funktion
    const unregister = registerModal(() => {
      try { closeRef.current?.(); } catch (e) { /* noop */ }
    }, label);
    return unregister;
  }, [isOpen, label]); // closeFn bewusst NICHT in deps (via ref)
}
