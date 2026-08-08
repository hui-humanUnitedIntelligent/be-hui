// ═══════════════════════════════════════════════════════════════
// src/hooks/useKeyboardInset.js — Keyboard-Inset Hook (2026-08-08)
// ═══════════════════════════════════════════════════════════════
// Löst das Problem: Wenn die Tastatur auf iOS/Android aufgeht,
// werden fixed-position Modals/Botton-Sheets oben abgeschnitten
// oder der Speichern-Button verschwindet hinter der Tastatur.
//
// Lösung: Nutzt window.visualViewport (iOS 16+, Android Chrome 108+)
// um die tatsächliche sichtbare Höhe zu ermitteln und setzt
// --hui-keyboard-inset als CSS-Variable.
//
// Modals lesen diese Variable und passen ihr Layout an:
//   height: calc(100dvh - var(--hui-keyboard-inset, 0px))
//
// Fallback: Wenn visualViewport nicht verfügbar ist, wird
// ein resize-Listener auf window verwendet.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

let globalInset = 0;
let listeners = new Set();
let initialized = false;

function initGlobal() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const update = () => {
    if (window.visualViewport) {
      const inset = Math.max(0, window.innerHeight - window.visualViewport.height);
      if (inset !== globalInset) {
        globalInset = inset;
        document.documentElement.style.setProperty("--hui-keyboard-inset", `${globalInset}px`);
        listeners.forEach(fn => fn(globalInset));
      }
    }
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", update);
    window.visualViewport.addEventListener("scroll", update);
  }
  window.addEventListener("resize", update);
  update();
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
