// ═══════════════════════════════════════════════════════════════
// src/lib/globalKeyboardHandler.js — Globales Keyboard-Handling (2026-08-10)
// ═══════════════════════════════════════════════════════════════
// ZIEL: JEDES Textfeld der App (auch dynamisch erzeugte, in Listen,
// ScrollViews, Formularen, Modals, BottomSheets) wird automatisch
// sichtbar gehalten, sobald die Systemtastatur aufgeht — OHNE dass
// eine einzelne Komponente dafür manuell konfiguriert werden muss.
//
// WARUM ein neuer, globaler Mechanismus (statt pro Screen die
// bestehenden .hui-kbd-* Klassen / useKeyboardInset() zu verdrahten):
// Genau das manuelle "pro Screen einbauen" ist das, was bisher NICHT
// zuverlässig überall passiert ist. Ein einziger, app-weit registrierter
// `focusin`-Listener auf `document` fängt via Event-Bubbling GARANTIERT
// JEDES <input>/<textarea>/[contenteditable] ab — auch Felder, die erst
// nach diesem Bootstrap ins DOM kommen (Wizards, Modals, dynamische
// Formulare). Das ist die Standard-Web-Pattern für genau dieses Problem
// und exakt das native Prinzip aus der Anforderung übertragen auf Web/
// Capacitor: Kein pro-Screen-Listener nötig, Event-Delegation statt
// manueller Registrierung.
//
// ZUSAMMENSPIEL mit bestehender Infrastruktur (KEINE Regression):
// - Nutzt weiterhin --hui-keyboard-inset (siehe useKeyboardInset.js,
//   jetzt zusätzlich durch das native IME-Signal aus MainActivity.java
//   gespeist) als SSOT für die aktuelle Tastaturhöhe.
// - Bestehende Komponenten mit eigener .hui-kbd-aware / bottom:var(...)
//   Logik bleiben unverändert und funktionieren weiterhin — dieser
//   Handler ergänzt sie nur um automatisches Scroll-into-View, er
//   überschreibt oder ersetzt keine bestehende Komponente.
// - Setzt zusätzlich die Klasse `hui-keyboard-open` auf <body>, falls
//   irgendeine Komponente künftig generisch darauf reagieren möchte.
//
// AKTIVIERUNG: einmalig in src/main.jsx importiert + aufgerufen,
// läuft ab App-Start permanent im Hintergrund (Singleton).
// ═══════════════════════════════════════════════════════════════

let started = false;
let closeTimer = null;

function isTextField(el) {
  if (!el || !el.tagName) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "textarea") return true;
  if (tag === "input") {
    const type = (el.getAttribute("type") || "text").toLowerCase();
    // Keine Checkbox/Radio/Range/File/Button/Submit/Color — die öffnen keine Texttastatur
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
    // Safari/alte WebViews ohne Options-Objekt-Support
    try { el.scrollIntoView(false); } catch {}
  }
}

function onFocusIn(e) {
  const el = e.target;
  if (!isTextField(el)) return;

  document.body.classList.add("hui-keyboard-open");
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }

  // Wartezeit: Tastatur-Animation + native Inset-Injektion (MainActivity.java)
  // brauchen ein paar hundert ms, bevor die tatsächliche sichtbare Höhe
  // final ist. Zweifach versuchen (früh + spät) deckt sowohl schnelle als
  // auch langsame Geräte/Emulatoren ab, ohne dass eine Komponente das
  // manuell timen müsste.
  setTimeout(() => scrollFieldIntoView(el), 120);
  setTimeout(() => scrollFieldIntoView(el), 380);
}

function onFocusOut(e) {
  const el = e.target;
  if (!isTextField(el)) return;

  // Kurze Verzögerung: falls sofort ein anderes Textfeld fokussiert wird
  // (z.B. Tab zwischen Formularfeldern), soll die Klasse nicht flackern.
  if (closeTimer) clearTimeout(closeTimer);
  closeTimer = setTimeout(() => {
    const active = document.activeElement;
    if (!isTextField(active)) {
      document.body.classList.remove("hui-keyboard-open");
    }
  }, 250);
}

export function initGlobalKeyboardHandling() {
  if (started || typeof document === "undefined") return;
  started = true;

  // capture:true → fängt Focus-Events auch aus verschachtelten Shadow-
  // artigen Strukturen / Portalen (createPortal auf document.body) ab,
  // unabhängig davon wo im Baum das Feld gerendert wurde.
  document.addEventListener("focusin", onFocusIn, true);
  document.addEventListener("focusout", onFocusOut, true);
}
