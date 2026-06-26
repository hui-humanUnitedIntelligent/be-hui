// src/components/commerce/commerceUtils.js
// ─────────────────────────────────────────────────────────────────
// Gemeinsame Commerce-Utilities für WerkeKorb + UnterstutzenFlow.
// Single Source of Truth — keine Duplikate in den Komponenten.
// ─────────────────────────────────────────────────────────────────

import { HUI } from "../../design/hui.design.js";

// ── Design Tokens ─────────────────────────────────────────────────
export const C = {
  cream:       HUI?.COLOR?.cream       ?? "#FAF7F2",
  creamSoft:   HUI?.COLOR?.creamSoft   ?? "#FDFBF8",
  creamDeep:   HUI?.COLOR?.creamDeep   ?? "#EDE5D8",
  teal:        HUI?.COLOR?.teal        ?? "#0DC4B5",
  tealGlow:    HUI?.COLOR?.tealGlow    ?? "rgba(13,196,181,0.18)",
  tealPale:    HUI?.COLOR?.tealPale    ?? "#E6FAF8",
  coral:       HUI?.COLOR?.coral       ?? "#F47355",
  coralGlow:   HUI?.COLOR?.coralGlow   ?? "rgba(244,115,85,0.18)",
  ink:         HUI?.COLOR?.ink         ?? "#141422",
  inkMid:      HUI?.COLOR?.inkMid      ?? "#2E2E45",
  muted:       HUI?.COLOR?.muted       ?? "#8A8A9E",
  faint:       HUI?.COLOR?.faint       ?? "#C0C0D0",
  sage:        HUI?.COLOR?.sage        ?? "#6BAE8F",
  sagePale:    HUI?.COLOR?.sagePale    ?? "#EEF7F2",
  violet:      HUI?.COLOR?.violet      ?? "#7264D6",
  violetPale:  HUI?.COLOR?.violetPale  ?? "#F0EEFF",
  gold:        HUI?.COLOR?.gold        ?? "#D4952A",
  goldPale:    HUI?.COLOR?.goldPale    ?? "#FDF6E3",
};

// ── Typ-Metadaten ─────────────────────────────────────────────────
export const TYPE_META = {
  work:       { label: "Werk",           accent: C.teal,   bg: C.tealPale   },
  experience: { label: "Erlebnis",       accent: C.coral,  bg: C.coralGlow  },
  event:      { label: "Event",          accent: C.violet, bg: C.violetPale },
  impact:     { label: "Impact-Projekt", accent: C.sage,   bg: C.sagePale   },
  moment:     { label: "Moment",         accent: C.gold,   bg: C.goldPale   },
};

// ── Impact-Konstante ──────────────────────────────────────────────
// HUI investiert 7 % der eigenen Einnahmen — kein Aufschlag für Käufer
export const IMPACT_RATE = 0.07;

// ── Preis-Utilities ───────────────────────────────────────────────
/**
 * Formatiert einen numerischen Wert als Preisstring.
 * @returns {string|null}  "12,50 €"  oder null wenn kein gültiger Preis
 */
export function formatPrice(val) {
  if (!val && val !== 0) return null;
  const n = parseFloat(String(val).replace(",", ".").replace(/[^0-9.]/g, ""));
  if (isNaN(n) || n <= 0) return null;
  return n.toFixed(2).replace(".", ",") + "\u202F\u20AC";
}

/**
 * Parst einen Preis-Wert zu einer Zahl (0 bei ungültigem Wert).
 */
export function parseAmount(val) {
  if (!val && val !== 0) return 0;
  const n = parseFloat(String(val).replace(",", ".").replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

/**
 * Berechnet die Gesamtsumme eines Cart-Arrays.
 */
export function calcTotal(items) {
  return items.reduce((s, i) => s + parseAmount(i._raw?.price ?? i.price), 0);
}

/**
 * Berechnet den Impact-Beitrag (HUI-intern, kein Aufschlag für Käufer).
 */
export function calcImpact(total) {
  return +(total * IMPACT_RATE).toFixed(2);
}

// ── Haptik ────────────────────────────────────────────────────────
export function haptic(style = "light") {
  try { window.navigator?.vibrate?.(style === "success" ? [10, 50, 10] : [8]); } catch {}
  try { window.webkit?.messageHandlers?.haptic?.postMessage?.(style); } catch {}
}

// ── Cart-Helpers ──────────────────────────────────────────────────
export function uniquePeople(items) {
  const seen = new Set();
  return items.reduce((acc, i) => {
    const id = i.author?.id || i.user_id || i._raw?.user_id;
    if (id && !seen.has(id)) { seen.add(id); acc++; }
    return acc;
  }, 0) || items.length;
}

export function groupByPerson(items) {
  const map = new Map();
  for (const item of items) {
    const id   = item.author?.id || item.user_id || item._raw?.user_id || "__unknown__";
    const name = item.author?.name || "Unbekannt";
    const avatar = item.author?.avatar || null;
    if (!map.has(id)) map.set(id, { id, name, avatar, items: [] });
    map.get(id).items.push(item);
  }
  return [...map.values()];
}

// ── Formular-Utilities ────────────────────────────────────────────
export const EMPTY_FORM = {
  vorname: "", nachname: "", email: "", telefon: "",
  strasse: "", plz: "", stadt: "",
};

/** Gibt true zurück wenn ein oder mehr Items physischen Versand benötigen */
export function hasPhysical(items) {
  return items.some(i => (i._raw?.delivery_type || i.delivery_type) === "physical");
}

/** Gibt true zurück wenn Events oder Erlebnisse enthalten sind */
export function hasEventOrExperience(items) {
  return items.some(i => i.type === "experience" || i.type === "event");
}

/**
 * Vollständige Formularvalidierung — berücksichtigt dynamische Pflichtfelder.
 * @returns {boolean}
 */
export function isFormValid(form, items) {
  const base = form.vorname.trim() && form.nachname.trim() &&
    form.email.trim() && form.email.includes("@");
  if (!base) return false;
  if (hasPhysical(items)) {
    if (!form.strasse.trim() || !form.plz.trim() || !form.stadt.trim()) return false;
  }
  return true;
}

// ── Cart-Lifecycle ─────────────────────────────────────────────────
/**
 * CART LIFECYCLE — Eindeutige Regeln:
 *
 * ERHALTEN:  Wenn der WerkeKorb geschlossen wird (onClose) ohne Unterstützung.
 *            Wenn der UnterstützenFlow abgebrochen wird (onClose) vor Schritt 4.
 *
 * GELEERT:   Ausschließlich nach erfolgreicher Unterstützung (Schritt 4).
 *            Aufruf: clearCartAfterSuccess()
 *
 * NICHT GELEERT: Beim Schließen ohne Abschluss — der Nutzer soll beim
 *               Wiedereinstieg seine Auswahl vorfinden.
 */
export function clearCartAfterSuccess(setCart) {
  setCart([]);
}
