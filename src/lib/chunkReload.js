// src/lib/chunkReload.js
// ════════════════════════════════════════════════════════════════
// Zentrale Chunk-Mismatch-Recovery für React.lazy()-Imports.
//
// ROOT CAUSE (2026-08-04): Vorher hatte JEDE Datei mit lazy-Imports ihre
// EIGENE Kopie derselben Funktion (App.jsx, MyBasisProfile.jsx,
// BasisProfilePage.jsx, TalentProfilePage.jsx, PublicProfilePreview.jsx) —
// aber ALLE Kopien nutzten denselben globalen sessionStorage-Key
// '__hui_chunk_reload'. Folge: Schlug irgendein Lazy-Chunk (z.B. beim
// Feed) einmal fehl -> automatischer Reload, Flag='1'. Schlug DANACH ein
// voellig ANDERER, unabhaengiger Chunk fehl (z.B. WerkWizard beim Klick
// auf "Werk hinzufügen"), wurde das faelschlich als "schon einmal
// versucht" gewertet -> KEIN Reload mehr, der Chunk rendert still `null`
// -> Button/Feature wirkt komplett tot, ohne jede Fehlermeldung. Exakt
// das gemeldete Symptom ("Werk hinzufügen tut nichts").
//
// FIX: Ein eigener sessionStorage-Key PRO Chunk (per `chunkKey`-Parameter),
// damit jeder Chunk unabhaengig von allen anderen genau einmal automatisch
// neu laden darf, bevor er als "wirklich kaputt" gilt.
// ════════════════════════════════════════════════════════════════
export function makeChunkReload(chunkKey) {
  const storageKey = `__hui_chunk_reload_${chunkKey}`;
  return () => {
    if (!sessionStorage.getItem(storageKey)) {
      sessionStorage.setItem(storageKey, "1");
      location.reload();
      // Promise bewusst nie aufloesen -- die Seite laedt sowieso neu.
      return new Promise(() => {});
    }
    // Auch nach einem Reload ist der Chunk noch nicht ladbar -> kein reiner
    // Cache/Timing-Fall mehr. Flag zuruecksetzen (falls der Chunk spaeter
    // doch wieder verfuegbar wird) und ein neutrales Null-Modul liefern,
    // statt in eine Reload-Schleife zu laufen.
    sessionStorage.removeItem(storageKey);
    return Promise.resolve({ default: () => null });
  };
}
