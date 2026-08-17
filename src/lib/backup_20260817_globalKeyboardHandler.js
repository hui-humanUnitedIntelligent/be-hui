// ═══════════════════════════════════════════════════════════════
// src/lib/globalKeyboardHandler.js — Globales Keyboard-Push-Up-System
// v2 (2026-08-15): Vollständiges Push-Up für JEDES Textfeld
// ═══════════════════════════════════════════════════════════════
//
// ZIEL: Sobald die Systemtastatur auf dem Smartphone erscheint, wird
// der gesamte sichtbare Bereich nach oben geschoben. Kein Textfeld
// darf verdeckt sein. Kein Button darf hinter der Tastatur liegen.
// Funktioniert überall — ohne pro-Screen-Konfiguration.
//
// WIE ES FUNKTIONIERT (3 Mechanismen, alle global):
//
// 1) VISUAL VIEWPORT + NATIVE IME (Höhe-Erkennung):
//    - window.visualViewport resize → keyboardInset = innerHeight - vv.height
//    - Android: window.__HUI_NATIVE_KEYBOARD_INSET (MainActivity.java)
//    - Beide Quellen werden gemerged (größere gewinnt)
//    - Setzt --hui-keyboard-inset CSS-Variable (SSOT für alle Komponenten)
//
// 2) FIXED MODALS ANPASSEN (Portaled Elements):
//    - Alle position:fixed direkten Kinder von <body> (createPortal-Modals)
//      bekommen bottom: <keyboardInset>px statt bottom: 0
//    - MutationObserver fängt neu hinzugefügte Modals ab
//    - Beim Schließen: Original-Styles wiederherstellen
//
// 3) CSS-REGELN (in index.css):
//    - body.hui-keyboard-open .hui-scroll → padding-bottom: keyboardInset + 16px
//    - body.hui-keyboard-open [data-hui-bottom-navigation] → transform: translateY(150%)
//    - body.hui-keyboard-open input:focus → scroll-margin-bottom für sicheren Abstand
//
// KEINE REGRESSION:
// - Keine Komponente wird verändert — alles läuft über CSS-Variablen + body-Klasse
// - Desktop: visualViewport.height ≈ innerHeight → inset = 0 → keine Auswirkung
// - Bestehende Komponenten mit eigenem --hui-keyboard-inset-Usage funktionieren weiter
// - Modals die bereits bottom: var(--hui-keyboard-inset) nutzen werden nicht
//   doppelt ajustiert (JS setzt den gleichen Pixelwert wie die CSS-Variable)
//
// AKTIVIERUNG: src/main.jsx + src/web-main.jsx (einmaliger Aufruf)
// ═══════════════════════════════════════════════════════════════

let started = false;
let closeTimer = null;
let currentInset = 0;

// Map: element → { bottom, transition } — für Restore beim Keyboard-Close
const savedStyles = new Map();

// ─── Helpers ────────────────────────────────────────────────────

function isTextField(el) {
  if (!el || !el.tagName) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "textarea") return true;
  if (tag === "input") {
    const type = (el.getAttribute("type") || "text").toLowerCase();
    return !["checkbox", "radio", "range", "file", "button", "submit", "reset", "color", "hidden", "image"].includes(type);
  }
  if (el.isContentEditable) return true;
  return false;
}

function scrollFieldIntoView(el) {
  if (!el || typeof el.scrollIntoView !== "function") return;
  try {
    el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
  } catch {
    try { el.scrollIntoView(false); } catch {}
  }
}

// ─── Fixed-Modal-Anpassung ──────────────────────────────────────
// Alle position:fixed direkten Kinder von <body> (Portaled-Modals)
// bekommen bottom: keyboardInset — so rutscht der Save-Button über die Tastatur.

function adjustFixedElements(inset) {
  for (const child of document.body.children) {
    if (child.id === "root") continue;
    if (["SCRIPT", "STYLE", "LINK", "NOSCRIPT"].includes(child.tagName)) continue;
    if (child.id && child.id.startsWith("eruda")) continue;

    let computed;
    try { computed = getComputedStyle(child); } catch { continue; }
    if (computed.position !== "fixed") continue;

    // KEYBOARD-DOUBLESHIFT-FIX (2026-08-15): Nutzer-Report — beim Öffnen der
    // Tastatur in CommentsSheet/ConversationRoom/SettingsModal/ProfilBearbeitenModal/
    // ImpactUpdateSheet/ImpactProjektUpdateSheet/HuiMomentSheet verschob sich das
    // GESAMTE Sheet zu weit nach oben, Header verschwand, weißer Balken sichtbar,
    // Eingabefeld nicht erreichbar. Root Cause: ALLE diese Sheets sind
    // "position:fixed; inset:0" Vollbild-Wrapper (direkte body-Kinder) MIT einem
    // intern geschachtelten Panel, das sich SELBST bereits ueber
    // "bottom: var(--hui-keyboard-inset)" / "maxHeight: calc(Xdvh - var(--hui-keyboard-inset))"
    // korrekt ueber die Tastatur hebt. Dieser globale Handler hat ZUSAETZLICH den
    // AEUSSEREN Vollbild-Wrapper per "bottom: insetPx" verschoben (mit unveraendertem
    // top:0 verkuerzt das die Wrapper-Hoehe von unten) — das innere Panel positioniert
    // sich dann relativ zu diesem bereits verkuerzten Wrapper NOCH EINMAL um "inset"
    // nach oben = doppelte Verschiebung, Header wandert aus dem Bild, weisser Bereich
    // wird sichtbar. FIX: Vollbild-Overlays (Hoehe >= 70% der Viewport-Hoehe) werden
    // hier gar nicht mehr beruehrt — sie regeln ihre Tastatur-Sicherheit bereits
    // vollstaendig selbst ueber die CSS-Variable (die dieser Handler weiterhin oben
    // in onKeyboardChange() korrekt setzt). Nur ECHTE schmale Leisten (z.B. ein
    // schwebender Speichern-Button-Balken < 70% Bildschirmhoehe) werden weiterhin
    // wie bisher per "bottom: insetPx" ueber die Tastatur geschoben.
    let rectHeight = 0;
    try { rectHeight = child.getBoundingClientRect().height; } catch { rectHeight = 0; }
    const isFullscreenOverlay = rectHeight >= window.innerHeight * 0.7;
    if (isFullscreenOverlay) {
      // Falls dieses Element vorher (bei einem frueheren, kleineren inset-Wert)
      // bereits faelschlich anjustiert wurde, jetzt sauber zuruecksetzen.
      const saved = savedStyles.get(child);
      if (saved) {
        child.style.bottom = saved.bottom;
        child.style.transition = saved.transition;
        savedStyles.delete(child);
      }
      continue;
    }

    if (inset > 0) {
      if (!savedStyles.has(child)) {
        savedStyles.set(child, {
          bottom: child.style.bottom || "",
          transition: child.style.transition || "",
        });
      }
      child.style.transition = "bottom 0.25s ease-out";
      child.style.bottom = inset + "px";
    } else {
      const saved = savedStyles.get(child);
      if (saved) {
        child.style.bottom = saved.bottom;
        child.style.transition = saved.transition;
        savedStyles.delete(child);
      }
    }
  }
}

// ─── Keyboard-Inset-Änderung verarbeiten ─────────────────────────

function onKeyboardChange(inset) {
  if (inset === currentInset) return;
  currentInset = inset;

  // CSS-Variable aktualisieren (SSOT)
  document.documentElement.style.setProperty("--hui-keyboard-inset", inset + "px");

  if (inset > 0) {
    document.body.classList.add("hui-keyboard-open");
  } else {
    document.body.classList.remove("hui-keyboard-open");
  }

  adjustFixedElements(inset);
}

// ─── Focus-Events (scroll into view) ────────────────────────────

function onFocusIn(e) {
  const el = e.target;
  if (!isTextField(el)) return;
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
  setTimeout(() => scrollFieldIntoView(el), 150);
  setTimeout(() => scrollFieldIntoView(el), 400);
}

function onFocusOut(e) {
  const el = e.target;
  if (!isTextField(el)) return;
  if (closeTimer) clearTimeout(closeTimer);
  closeTimer = setTimeout(() => {
    const active = document.activeElement;
    if (!isTextField(active)) {
      if (currentInset === 0) {
        document.body.classList.remove("hui-keyboard-open");
      }
    }
  }, 300);
}

// ─── Keyboard-Höhe überwachen ───────────────────────────────────

function setupKeyboardWatcher() {
  if (window.visualViewport) {
    const updateVV = () => {
      const vvInset = Math.max(0, window.innerHeight - window.visualViewport.height);
      onKeyboardChange(vvInset);
    };
    window.visualViewport.addEventListener("resize", updateVV);
    window.visualViewport.addEventListener("scroll", updateVV);
    updateVV();
  }

  window.addEventListener("hui:native-keyboard-inset", (e) => {
    const nativeInset = (e && e.detail && e.detail.inset) ? e.detail.inset : 0;
    const vvInset = window.visualViewport
      ? Math.max(0, window.innerHeight - window.visualViewport.height)
      : 0;
    onKeyboardChange(Math.max(nativeInset, vvInset));
  });
}

// ─── MutationObserver: Neue Modals während Keyboard offen ────────

function setupMutationObserver() {
  const observer = new MutationObserver(function() {
    if (currentInset > 0) {
      adjustFixedElements(currentInset);
    }
  });
  observer.observe(document.body, { childList: true, subtree: false });
}

// ─── Init ────────────────────────────────────────────────────────

export function initGlobalKeyboardHandling() {
  if (started || typeof document === "undefined") return;
  started = true;

  document.addEventListener("focusin", onFocusIn, true);
  document.addEventListener("focusout", onFocusOut, true);

  setupKeyboardWatcher();
  setupMutationObserver();
}
