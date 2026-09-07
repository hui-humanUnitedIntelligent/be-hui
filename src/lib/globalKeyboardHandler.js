// ═══════════════════════════════════════════════════════════════
// src/lib/globalKeyboardHandler.js — Globales Keyboard-Push-Up-System
// v2 (2026-08-15): Vollständiges Push-Up für JEDES Textfeld
// v3 (2026-09-07, UNIVERSAL-PADDING-FIX): Vollbild-Overlays werden nicht mehr
//    komplett ignoriert, sondern bekommen automatisch paddingBottom=inset.
// ═══════════════════════════════════════════════════════════════
//
// ZIEL: Sobald die Systemtastatur auf dem Smartphone erscheint, wird
// der gesamte sichtbare Bereich nach oben geschoben. Kein Textfeld
// darf verdeckt sein. Kein Button darf hinter der Tastatur liegen.
// Funktioniert überall — ohne pro-Screen-Konfiguration.
//
// WICHTIG FÜR NEUE MODALS/SHEETS MIT TEXTFELDERN: Ihr müsst NICHTS
// dafür tun! Dieser Handler regelt es automatisch für JEDES neue
// createPortal(...,document.body)-Modal, egal ob Bottom-Sheet
// (alignItems:"flex-end") oder zentriertes Dialog (alignItems:"center").
// NUR wenn eine Komponente die Tastatur-Sicherheit LIEBER SELBST regeln
// will (eigenes paddingBottom/maxHeight mit --hui-keyboard-inset, siehe
// ImpactFlow.jsx als Referenz), muss sie explizit data-hui-kbd-self-managed
// auf ihren äußersten position:fixed-Wrapper setzen, um diesen globalen
// Mechanismus abzuschalten. Siehe .agents/rules/keyboard-safety.md.
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
//    - Schmale schwebende Leisten (< 70% Bildschirmhöhe, z.B. ein
//      Speichern-Button-Balken) bekommen bottom: <keyboardInset>px.
//    - Vollbild-Overlays (>= 70% Bildschirmhöhe — praktisch jedes
//      Modal/Bottom-Sheet mit position:fixed;inset:0) bekommen
//      paddingBottom: <keyboardInset>px auf den äußeren Wrapper — das
//      schiebt einen alignItems:"flex-end"- ODER "center"-Kind-Panel
//      automatisch über die Tastatur, ohne dass die Komponente selbst
//      etwas dafür programmieren muss (UNIVERSAL-PADDING-FIX, 2026-09-07).
//    - data-hui-kbd-self-managed-Elemente werden NIE angefasst.
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
// - Bestehende Komponenten mit eigenem --hui-keyboard-inset-Usage (data-hui-kbd-
//   self-managed) funktionieren unverändert weiter, keine Doppel-Anpassung
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

  // SCROLL-DRAG-FIX (2026-08-17): Nutzer-Report + Debug-Overlay-Beweis —
  // auf diesem Android-WebView (Xiaomi HyperOS) werden position:fixed-
  // Elemente FÄLSCHLICHERWEISE mitgescrollt, wenn ein Vorfahre (inkl.
  // document/body) scrollt -- eigentlich WebView-Spec-Verstoss (fixed
  // sollte IMMER relativ zum Viewport bleiben), aber empirisch bestätigt
  // (Debug-Overlay wanderte beim Scrollen mit, obwohl position:fixed).
  // Da zwischen einem <textarea> in ConversationRoom (ChatInput) und
  // document.body KEIN scrollbarer Container liegt, scrollt
  // scrollIntoView() hier den GESAMTEN body/html -- und zieht dabei den
  // kompletten (position:fixed, per Portal auf body) ConversationRoom
  // mit nach oben, obwohl der bereits über --hui-keyboard-inset korrekt
  // ueber die Tastatur gehoben wird. Zwei konkurrierende Mechanismen =
  // Layout kollabiert (Nachricht komplett aus dem Bild gescrollt).
  // FIX: Elemente, die bereits selbst innerhalb eines
  // [data-hui-kbd-self-managed]-Containers liegen (eigene
  // --hui-keyboard-inset Logik), werden hier NICHT zusätzlich per
  // scrollIntoView bewegt -- vermeidet den Konflikt komplett.
  if (el.closest && el.closest("[data-hui-kbd-self-managed]")) return;

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
    // SCROLL-DRAG-FIX (2026-08-17): Container mit eigener Keyboard-Logik
    // (z.B. ConversationRoom, bottom: clamp(0px, var(--hui-keyboard-inset)))
    // werden hier NIE zusätzlich per JS-Inline-Style angefasst -- sie
    // regeln ihre Tastatur-Sicherheit bereits vollständig selbst. Ohne
    // diesen Check kaempften React-Style und dieser globale Handler um
    // dieselbe "bottom"-Property (siehe KEYBOARD-DOUBLESHIFT-FIX unten).
    if (child.hasAttribute && child.hasAttribute("data-hui-kbd-self-managed")) {
      const saved = savedStyles.get(child);
      if (saved) {
        child.style.bottom = saved.bottom;
        child.style.transition = saved.transition;
        savedStyles.delete(child);
      }
      continue;
    }

    let rectHeight = 0;
    try { rectHeight = child.getBoundingClientRect().height; } catch { rectHeight = 0; }
    const isFullscreenOverlay = rectHeight >= window.innerHeight * 0.7;
    if (isFullscreenOverlay) {
      // UNIVERSAL-PADDING-FIX (2026-09-07, Michael-Report: "Basis & Talent-Profil"
      // -Modal — Eingabefeld komplett hinter Tastatur verschwunden, Screenshot).
      // ROOT CAUSE: Vollbild-Overlays wurden hier bisher IMMER komplett ignoriert
      // (kein bottom-Shift) -- in der Annahme, jede Komponente regele die Tastatur-
      // Sicherheit selbst ueber die CSS-Variable (siehe data-hui-kbd-self-managed-
      // Check oben). Das stimmt nur fuer die Handvoll Komponenten, die das
      // TATSAECHLICH implementiert haben (ImpactFlow, ConversationRoom, ...).
      // JEDE andere Vollbild-Sheet/Modal-Komponente (der ueberwiegende Rest, z.B.
      // ProfilBearbeitenModal, MeinBereichDrawer) bekam dadurch GAR KEINE
      // Tastatur-Anpassung -- ein Textfeld darin verschwand komplett hinter der
      // Systemtastatur, sobald der Entwickler das (wie hier) nicht manuell
      // nachgebaut hat. Das ist der wiederkehrende Bug, den Michael meldet.
      //
      // FIX: Statt komplett zu ueberspringen, bekommt JEDES nicht explizit
      // selbst-verwaltete Vollbild-Overlay automatisch paddingBottom = inset auf
      // den AEUSSEREN Backdrop-Wrapper (NICHT bottom -- das wuerde bei
      // alignItems:"flex-end"-Sheets zusaetzlich die Wrapper-Hoehe verkuerzen UND
      // verschieben = doppelte Wirkung, siehe KEYBOARD-DOUBLESHIFT-FIX oben).
      // paddingBottom verkleinert nur die verfuegbare Flex-Innenflaeche von unten
      // -- funktioniert dadurch UNIVERSELL sowohl fuer zentrierte
      // (alignItems:"center") als auch bodenverankerte (alignItems:"flex-end")
      // Kinder, ohne dass die Komponente selbst irgendetwas dafuer tun muss.
      // Komponenten, die die Tastatur bereits SELBST behandeln (eigenes
      // paddingBottom/maxHeight mit --hui-keyboard-inset), setzen weiterhin
      // data-hui-kbd-self-managed und werden hier (siehe oben) unveraendert
      // uebersprungen -- kein Konflikt, keine Regression fuer die bereits
      // gefixten Faelle (ImpactFlow etc.).
      if (inset > 0) {
        if (!savedStyles.has(child)) {
          savedStyles.set(child, {
            bottom: child.style.bottom || "",
            transition: child.style.transition || "",
            paddingBottom: child.style.paddingBottom || "",
          });
        }
        child.style.transition = "padding-bottom 0.2s ease-out";
        child.style.paddingBottom = `calc(${inset}px + env(safe-area-inset-bottom, 0px))`;
      } else {
        const saved = savedStyles.get(child);
        if (saved) {
          child.style.bottom = saved.bottom;
          child.style.transition = saved.transition;
          child.style.paddingBottom = saved.paddingBottom || "";
          savedStyles.delete(child);
        }
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

function onKeyboardChange(rawInset) {
  // DEFENSIVE-CLAMP-FIX (2026-08-17): siehe useKeyboardInset.js — gleiche
  // Kappung hier, damit beide parallelen Quellen konsistent bleiben.
  const cap = typeof window !== "undefined" ? window.innerHeight * 0.6 : 9999;
  const inset = Math.min(Math.max(0, rawInset), cap);
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
