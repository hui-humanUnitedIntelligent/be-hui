/** Soft Transition — Schließen MeinHUI, spiegelbildlich zum Öffnen */
export function createCloseMeinHuiCinematic({
  setMeinHuiClosing,
  setShowPlusSheet,
  setOrbTransition,
}) {
  return () => {
    setMeinHuiClosing(true);
    setTimeout(() => {
      setShowPlusSheet(false);
      setMeinHuiClosing(false);
      setOrbTransition("entering");
      setTimeout(() => setOrbTransition("idle"), 300);
    }, 400);
  };
}

/** Orb-Nav: Wirkungsraum öffnet ruhig */
export function createOrbOpenHandler({ setOrbTransition, setShowPlusSheet, canRenderOrbContent }) {
  return (key) => {
    if (key !== "create") return;
    if (!canRenderOrbContent) return;
    setOrbTransition("exiting");
    setShowPlusSheet(true);
    setTimeout(() => setOrbTransition("hidden"), 300);
  };
}
