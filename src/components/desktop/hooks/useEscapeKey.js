// ══════════════════════════════════════════════════════════════════════════════
// useEscapeKey.js — Global Escape Key Handler
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Universeller ESC-Handler für Desktop-Komponenten.
//   Schließt Modals, Panels, Dropdowns, Overlays bei ESC-Taste.
//
// USAGE:
//   useEscapeKey(() => closePanel(), isOpen);
//   // Nur aktiv wenn isOpen === true
//
// REGEL:
//   Jede Desktop-Komponente, die sich öffnen/schließen lässt,
//   muss useEscapeKey verwenden. Keine manuellen keydown-Listener.
// ══════════════════════════════════════════════════════════════════════════════

import { useEffect } from 'react';

export function useEscapeKey(onEscape, active = true) {
  useEffect(() => {
    if (!active) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onEscape();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, active]);
}

export default useEscapeKey;
