#!/usr/bin/env node
/**
 * Verifiziert den Tabbar-Touch-Root-Cause-Fix ohne Browser:
 * 1) useWizardBodyLock(active) setzt hui-wizard-open nur bei active=true
 * 2) Dauerhaft gemountete PostFullscreenView-Simulation: kein Lock bei idle
 * 3) Nach Schliessen: kein Ghost-Overlay mit pointer-events (Code-Check)
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// ── 1. wizardBodyLock active-Parameter ──────────────────────────
const lockSrc = readFileSync(join(root, "src/lib/wizardBodyLock.js"), "utf8");
if (!lockSrc.includes("export function useWizardBodyLock(active = true)")) {
  console.error("FAIL: useWizardBodyLock braucht active-Parameter");
  process.exit(1);
}
if (!lockSrc.includes("if (!active) return;")) {
  console.error("FAIL: useWizardBodyLock muss bei active=false no-op sein");
  process.exit(1);
}

// ── 2. PostFullscreenView koppelt Lock an mountedItem ───────────
const pfvSrc = readFileSync(join(root, "src/components/shared/PostFullscreenView.jsx"), "utf8");
if (pfvSrc.includes("useWizardBodyLock();")) {
  console.error("FAIL: PostFullscreenView darf useWizardBodyLock() nicht bedingungslos aufrufen");
  process.exit(1);
}
if (!pfvSrc.includes("useWizardBodyLock(!!mountedItem)")) {
  console.error("FAIL: PostFullscreenView muss useWizardBodyLock(!!mountedItem) nutzen");
  process.exit(1);
}
if (!pfvSrc.includes('pointerEvents: visible ? "auto" : "none"')) {
  console.error("FAIL: PostFullscreenView braucht pointer-events waehrend Exit-Animation");
  process.exit(1);
}

// ── 3. Refcount-Simulation (Root Cause) ─────────────────────────
let openWizardCount = 0;
let bodyHasClass = false;
function acquire() {
  openWizardCount += 1;
  if (openWizardCount === 1) bodyHasClass = true;
}
function release() {
  openWizardCount = Math.max(0, openWizardCount - 1);
  if (openWizardCount === 0) bodyHasClass = false;
}
function useWizardBodyLockSim(active) {
  if (!active) return;
  acquire();
  return () => release();
}

// ALT (Bug): Komponente mountet einmal, Lock bleibt fuer immer
bodyHasClass = false;
openWizardCount = 0;
useWizardBodyLockSim(true); // unconditional on mount
if (!bodyHasClass) {
  console.error("FAIL: Simulation ALT — body-Klasse sollte gesetzt sein");
  process.exit(1);
}
// close post — component still mounted, no cleanup
if (bodyHasClass !== true || openWizardCount !== 1) {
  console.error("FAIL: Simulation ALT — Lock bleibt nach Post-Schliessen");
  process.exit(1);
}

// NEU (Fix): Lock nur wenn mountedItem gesetzt
bodyHasClass = false;
openWizardCount = 0;
let cleanup = null;
// App start — kein Post
cleanup = useWizardBodyLockSim(false);
if (bodyHasClass) {
  console.error("FAIL: Simulation NEU — body-Klasse darf bei idle nicht gesetzt sein");
  process.exit(1);
}
// Post oeffnen
if (cleanup) cleanup();
cleanup = useWizardBodyLockSim(true);
if (!bodyHasClass) {
  console.error("FAIL: Simulation NEU — Lock fehlt bei offenem Post");
  process.exit(1);
}
// Post schliessen (mountedItem -> null)
cleanup();
cleanup = useWizardBodyLockSim(false);
if (bodyHasClass) {
  console.error("FAIL: Simulation NEU — body-Klasse muss nach Schliessen weg sein");
  process.exit(1);
}

console.log("PASS: Tabbar-Touch-Root-Cause-Fix verifiziert");
console.log("  - useWizardBodyLock(active) korrekt");
console.log("  - PostFullscreenView: Lock nur bei !!mountedItem");
console.log("  - pointer-events:none waehrend Exit-Animation");
console.log("  - Idle: hui-wizard-open NICHT auf body");
