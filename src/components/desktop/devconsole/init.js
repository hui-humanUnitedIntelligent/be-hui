// ══════════════════════════════════════════════════════════════════════════════
// init.js — HUI Developer Console Activation Gate
// ══════════════════════════════════════════════════════════════════════════════
//
// Diese Datei wird in web-main.jsx importiert.
// Sie prüft, ob der Dev/Admin-Modus aktiv ist.
// Falls NICHT aktiv: nichts passiert — zero overhead, zero code executed.
// Falls aktiv: dynamischer Import der Console (separater Chunk).
//
// Aktivierung:
//   1. Vite Dev Mode (import.meta.env.DEV === true)
//   2. localStorage 'hui-dev-admin' === 'true' (Admin-Modus)
//   3. URL Hash '#dev' oder '#admin' (setzt localStorage, einmalig)
//
// Deaktivierung:
//   localStorage.removeItem('hui-dev-admin')
// ══════════════════════════════════════════════════════════════════════════════

const hash = window.location.hash;
if (hash === '#dev' || hash === '#admin') {
  localStorage.setItem('hui-dev-admin', 'true');
  history.replaceState(null, '', window.location.pathname + window.location.search);
}

const isActive =
  import.meta.env.DEV ||
  localStorage.getItem('hui-dev-admin') === 'true';

if (isActive) {
  // Dynamic import — separater Chunk, wird nur geladen wenn aktiv
  import('./bootstrap.jsx');
}
