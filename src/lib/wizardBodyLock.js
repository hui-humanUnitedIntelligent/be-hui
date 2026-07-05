// src/lib/wizardBodyLock.js
// ═══════════════════════════════════════════════════════════════
// HUI Wizard Body Lock — referenzgezählter Ersatz für die bisherige
// unabhängige document.body.classList.add/remove("hui-wizard-open")
// Logik in WerkWizard.jsx, ExperienceWizard.jsx, TalentAngebotWizard.jsx.
//
// URSACHE DER REGRESSION (siehe Root-Cause-Analyse):
//   Alle drei Wizard-Komponenten haben unabhängig voneinander dieselbe
//   globale Body-Klasse per eigenem useLayoutEffect gesetzt/entfernt.
//   Sobald zwei dieser Wizards jemals überlappend gemountet sind (auch
//   nur kurzzeitig), entfernt der zuerst schließende Wizard die Klasse
//   für den/die anderen noch offenen Wizard(s) mit — die Bottom
//   Navigation gerät dadurch in einen von der tatsächlichen Anzahl
//   offener Wizards entkoppelten, unvorhersehbaren Zustand.
//
// FIX: ein einziger, modul-globaler Referenzzähler entscheidet über
//   die tatsächliche DOM-Mutation. Die Klasse wird nur bei der
//   0→1-Transition gesetzt und nur bei der 1→0-Transition entfernt —
//   unabhängig davon, welcher/wie viele Wizards gerade offen sind und
//   in welcher Reihenfolge sie schließen.
// ═══════════════════════════════════════════════════════════════

import { useLayoutEffect } from "react";

const BODY_CLASS = "hui-wizard-open";

// Modul-weiter Zähler — bewusst AUSSERHALB von React-State, da er über
// mehrere, komplett unabhängige Komponenteninstanzen hinweg konsistent
// sein muss (kein gemeinsamer Parent-State verfügbar/gewünscht).
let openWizardCount = 0;

function acquire() {
  openWizardCount += 1;
  if (openWizardCount === 1) {
    document.body.classList.add(BODY_CLASS);
  }
}

function release() {
  openWizardCount = Math.max(0, openWizardCount - 1);
  if (openWizardCount === 0) {
    document.body.classList.remove(BODY_CLASS);
  }
}

/**
 * useWizardBodyLock — von jeder Vollbild-Wizard-Komponente aufzurufen,
 * solange sie gemountet ist. Blendet über die "hui-wizard-open"-Klasse
 * die HUIBottomNavigation aus (MutationObserver dort beobachtet die
 * Klasse) — unabhängig davon, wie viele weitere Wizards zeitgleich
 * offen sind.
 *
 * Garantie: React ruft die Cleanup-Funktion eines useLayoutEffect IMMER
 * beim Unmount auf (auch bei Unmount durch einen Fehler, der weiter oben
 * von einer ErrorBoundary aufgefangen wird) — das Cleanup hier kann somit
 * nicht "übersprungen" werden, ohne dass die Komponente selbst weiterhin
 * gemountet bleibt.
 */
export function useWizardBodyLock() {
  useLayoutEffect(() => {
    acquire();
    return () => release();
  }, []);
}
