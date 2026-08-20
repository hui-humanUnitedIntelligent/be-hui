// src/hooks/useScrollTopOnChange.js
// ═══════════════════════════════════════════════════════════════════
// MODAL-SCROLL-RESET-001 (2026-08-21)
// ═══════════════════════════════════════════════════════════════════
// Root Cause: Mehrstufige Wizards (TalentAngebotWizard, WerkWizard,
// ExperienceWizard, TalentBookingFlow) rendern ihren scrollbaren
// Inhaltsbereich (.hui-scroll / overflowY:"auto") als EIN EINZIGES,
// dauerhaft gemountetes DOM-Element — nur der INHALT wechselt je nach
// `step`. React behält dabei den DOM-Node (inkl. scrollTop) bei, weil
// sich Typ/Position im Baum nicht ändern. Ergebnis: Wenn der Nutzer auf
// Schritt N nach unten gescrollt hatte, öffnet Schritt N+1 (mit anderer,
// meist kürzerer Höhe) NICHT oben, sondern an der alten scrollTop-
// Position — sieht aus wie "mittendrin geöffnet" statt am Seitenanfang.
//
// Fix: Ref auf den Scroll-Container + dieser Hook setzt scrollTop
// zwingend auf 0, sobald sich eine der `deps` (i.d.R. [step]) ändert.
// Zusätzlich synchron beim ersten Mount (frisches Öffnen des Modals).
// ═══════════════════════════════════════════════════════════════════
import { useLayoutEffect } from "react";

/**
 * Setzt scrollTop des per ref referenzierten Containers auf 0,
 * sobald sich einer der übergebenen deps ändert (z.B. Wizard-Step)
 * — inklusive beim initialen Mount.
 *
 * @param {React.RefObject<HTMLElement>} ref
 * @param {Array<any>} deps
 */
export function useScrollTopOnChange(ref, deps = []) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (ref?.current) {
      ref.current.scrollTop = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default useScrollTopOnChange;
