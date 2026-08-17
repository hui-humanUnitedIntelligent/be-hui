// ═══════════════════════════════════════════════════════════════
// src/hooks/useKeyboardInset.js — Keyboard-Inset Hook (2026-08-08)
// Erweitert 2026-08-10: nativer IME-Inset als zusätzliche, robustere
// Quelle (siehe MainActivity.java) — visualViewport allein war auf
// Android (Edge-to-Edge WebView) unzuverlässig, weil die native Seite
// vorher ALLE Insets inkl. ime() konsumiert hat (Root Cause behoben).
// ═══════════════════════════════════════════════════════════════
// Löst das Problem: Wenn die Tastatur auf iOS/Android aufgeht,
// werden fixed-position Modals/Botton-Sheets oben abgeschnitten
// oder der Speichern-Button verschwindet hinter der Tastatur.
//
// Lösung: Nutzt window.visualViewport (iOS 16+, Android Chrome 108+)
// UND das native Android-Signal (window.__HUI_NATIVE_KEYBOARD_INSET,
// Event 'hui:native-keyboard-inset' aus MainActivity.java) — beide
// Quellen werden gemerged, der jeweils GRÖSSERE Wert gewinnt. Das
// macht die Erkennung robust, egal welche der beiden Quellen auf
// einem konkreten Gerät zuverlässig feuert.
//
// Setzt --hui-keyboard-inset als CSS-Variable.
// Modals lesen diese Variable und passen ihr Layout an:
//   height: calc(100dvh - var(--hui-keyboard-inset, 0px))
//
// Fallback: Wenn visualViewport nicht verfügbar ist, wird
// ein resize-Listener auf window verwendet.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

let globalInset = 0;
let vvInset = 0;      // aus window.visualViewport
let nativeInset = 0;  // aus MainActivity.java (Android IME-Insets)
let listeners = new Set();
let initialized = false;

function applyInset() {
  // DEFENSIVE-CLAMP-FIX (2026-08-17): Nutzer-Report (Xiaomi HyperOS,
  // Screenshot) — Chat-Layout brach komplett zusammen (Nachricht fast
  // vollständig aus dem Bild gescrollt), obwohl der Spacer-Fix + Scroll-
  // Fix bereits live waren. Root Cause vermutet: auf diesem Geraet
  // liefert entweder visualViewport ODER der native ime()-Inset einen
  // fehlerhaft zu grossen Wert (z.B. durch OEM-spezifische Density-
  // Berechnung), wodurch `bottom: var(--hui-keyboard-inset)` Container
  // weit ueber die tatsaechliche Tastaturhoehe hinaus schrumpft. Fix:
  // harte Obergrenze von 60% der Fensterhoehe — echte Tastaturen liegen
  // praktisch immer bei 30-45%, alles darueber ist mit Sicherheit ein
  // fehlerhafter Messwert und wird gekappt statt das Layout zu brechen.
  const cap = typeof window !== "undefined" ? window.innerHeight * 0.6 : 9999;
  const next = Math.min(Math.max(0, Math.max(vvInset, nativeInset)), cap);
  if (next !== globalInset) {
    globalInset = next;
    document.documentElement.style.setProperty("--hui-keyboard-inset", `${globalInset}px`);
    listeners.forEach(fn => fn(globalInset));
  }
}

function initGlobal() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const updateVV = () => {
    if (window.visualViewport) {
      vvInset = Math.max(0, window.innerHeight - window.visualViewport.height);
      applyInset();
    }
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", updateVV);
    window.visualViewport.addEventListener("scroll", updateVV);
  }
  window.addEventListener("resize", updateVV);

  // Natives Android-Signal (MainActivity.java) — siehe KEYBOARD-FIX (2026-08-10)
  if (typeof window.__HUI_NATIVE_KEYBOARD_INSET === "number") {
    nativeInset = window.__HUI_NATIVE_KEYBOARD_INSET;
  }
  window.addEventListener("hui:native-keyboard-inset", (e) => {
    nativeInset = e?.detail?.inset ?? 0;
    applyInset();
  });

  updateVV();
  applyInset();
}

export function useKeyboardInset() {
  const [inset, setInset] = useState(globalInset);

  useEffect(() => {
    initGlobal();
    const listener = (v) => setInset(v);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return inset;
}

// Globale CSS-Variable: --hui-keyboard-inset (0px wenn keine Tastatur)
// Modals können nutzen: paddingBottom: "calc(88px + var(--hui-keyboard-inset, 0px))"
export function getKeyboardInset() {
  return globalInset;
}

// DIAGNOSE-FIX (2026-08-17): temporäre Debug-Funktion — gibt alle rohen
// Zwischenwerte zurück, damit wir bei einem Geräte-spezifischen Bug (z.B.
// Xiaomi HyperOS) sehen können, WELCHE Quelle (visualViewport vs. natives
// Android ime()-Signal) den fehlerhaften Wert liefert, statt zu raten.
// Wird von einem temporären Debug-Overlay in ConversationRoom genutzt —
// nach Diagnose wieder entfernen.
export function getKeyboardDebugInfo() {
  return {
    vvInset,
    nativeInset,
    globalInset,
    windowInnerHeight: typeof window !== "undefined" ? window.innerHeight : null,
    vvHeight: typeof window !== "undefined" && window.visualViewport ? window.visualViewport.height : null,
    screenHeight: typeof window !== "undefined" && window.screen ? window.screen.height : null,
  };
}
