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
export const IMPACT_RATE = 0.0225; // COM-MIGRATION-015.3: vorher 0.07

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
    const id     = item.author?.id || item.user_id || item._raw?.user_id || "__unknown__";
    const name   = item.author?.name || item.author?.displayName || "Unbekannter Wirker";
    const avatar = item.author?.avatar || null;
    if (!map.has(id)) map.set(id, { id, key: id, name, avatar, items: [] });
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
/**
 * clearCartAfterSuccess — löscht den Cart nach erfolgreicher Unterstützung.
 * Ruft setCart([]) auf (React-State). Die Storage-Löschung erfolgt
 * im clearCartPersist()-Aufruf in HomeShell (Phase-2-Hook-Point).
 */
export function clearCartAfterSuccess(setCart) {
  setCart([]);
}

// ── Quantity Logic (v3.1) ─────────────────────────────────────────
/**
 * Bestimmt ob ein Item einen Mengenwähler anzeigen soll.
 *
 * Regeln:
 *   ✅ Mengenwähler: physical delivery, event, experience mit Plätzen
 *   ❌ Kein Wähler:  digital/download, original (Einzelstück), impact, moment
 *
 * Entscheidung basiert auf vorhandenen DB-Feldern ohne Hardcoding.
 */
export function allowsQuantity(item) {
  const raw = item._raw || {};
  const type = item.type || "moment";

  // Impact-Projekte und Momente → niemals
  if (type === "impact" || type === "moment") return false;

  // Explizites Flag wenn vorhanden
  if (raw.allows_multiple === true)  return true;
  if (raw.allows_multiple === false) return false;

  // Original / Einzelstück → kein Mengenwähler
  if (raw.is_original === true) return false;

  // Inventar = 1 → Einzelstück-Behandlung
  if (typeof raw.inventory === "number" && raw.inventory === 1) return false;

  // Events → immer Mengenwähler (Tickets)
  if (type === "event") return true;

  // Erlebnisse → wenn Plätze-Feld vorhanden
  if (type === "experience") {
    return typeof raw.max_participants === "number" && raw.max_participants > 1;
  }

  // Werke → Mengenwähler-Logik v1.0 (Fix: Fallback für fehlende delivery_type)
  //
  // Reihenfolge:
  //   1. delivery_type === "digital" (oder "download") → NIEMALS Menge
  //   2. delivery_type === "physical" / "ship" / "shipping" → IMMER Menge
  //   3. delivery_type fehlt / null → FALLBACK: als physisch behandeln
  //      (gilt bis WerkWizard alle Werke mit delivery_type speichert)
  //   4. Kategorie-Hinweise (product/merch/print/…) → IMMER Menge
  //
  if (type === "work") {
    const delivery = (raw.delivery_type || raw.deliveryType || "").toLowerCase().trim();

    // Explizit digital → kein Mengenwähler
    if (delivery === "digital" || delivery === "download" || delivery === "pdf") return false;

    // Explizit physisch → Mengenwähler
    if (delivery === "physical" || delivery === "ship" || delivery === "shipping") return true;

    // Kategorie-Hinweis → Mengenwähler
    const cat = (raw.category || raw.work_type || raw.format || "").toLowerCase();
    if (["product","merch","merchandise","print","book","cd","vinyl","poster","sticker"].some(k => cat.includes(k))) return true;

    // FALLBACK: delivery_type fehlt oder leer → als physisch behandeln
    // TODO: Entfernen sobald WerkWizard delivery_type zuverlässig speichert
    if (!delivery) return true;

    return false;
  }

  return false;
}

/**
 * Gibt einen kurzen Hinweis-Text zurück wenn das Item ein Einzelstück ist.
 * null wenn kein Hinweis nötig.
 */
export function getOriginalHint(item) {
  const raw = item._raw || {};
  if (raw.is_original === true) return "Original \u00b7 Einzelst\u00fcck";
  if (typeof raw.inventory === "number" && raw.inventory === 1) return "Original \u00b7 1 verf\u00fcgbar";
  return null;
}

/**
 * Berechnet die Gesamtsumme unter Berücksichtigung von item.quantity.
 */
export function calcTotalWithQty(items) {
  return items.reduce((s, i) => {
    const price = parseAmount(i._raw?.price ?? i.price);
    const qty   = (typeof i.quantity === "number" && i.quantity > 0) ? i.quantity : 1;
    return s + price * qty;
  }, 0);
}



// ═══════════════════════════════════════════════════════════════════
// COMMERCE ENGINE v2.0 — Zusätze für Sprint C1
// ═══════════════════════════════════════════════════════════════════

/** Platform-Konstanten — Single Source of Truth */
export const COMMERCE_RATES = {
  PLATFORM_FEE:  0.10,   // 10% Plattformgebühr
  IMPACT_RATE:   0.0225, // COM-MIGRATION-015.3: 2.25% Impact Pool (vorher 7%)
  CREATOR_SHARE: 0.85,   // COM-MIGRATION-015.3: 85% an Creator (vorher 90%)
};

/**
 * Berechnet den Creator-Auszahlungsbetrag für ein Item.
 * Plattformgebühr wird von HUI getragen — kein Abzug für den Käufer.
 */
export function calcCreatorPayout(unitPriceEur, qty = 1) {
  return +((unitPriceEur * qty) * COMMERCE_RATES.CREATOR_SHARE).toFixed(2);
}

/**
 * Berechnet Plattformgebühr für einen Betrag.
 */
export function calcPlatformFee(amountEur) {
  return +(amountEur * COMMERCE_RATES.PLATFORM_FEE).toFixed(2);
}

/**
 * Lesbarer Shipping-Typ für ein Cart-Item.
 * Gibt denselben Typ-String zurück den die Commerce Engine erwartet.
 */
export function resolveItemShippingType(item) {
  const type     = item.type || "work";
  const raw      = item._raw || {};
  const delivery = (raw.delivery_type || raw.deliveryType || "").toLowerCase().trim();

  if (type === "experience" || type === "event") return "experience";
  if (type === "service")                        return "service";
  if (type === "support")                        return "none";

  // Werk
  if (delivery === "digital" || delivery === "download") return "digital";
  if (delivery === "pickup")                             return "pickup";
  if (delivery === "service")                            return "service";
  return "physical"; // Default: physisch (bis WerkWizard delivery_type zuverlässig setzt)
}

/**
 * Prüft ob der Cart physische Produkte enthält die eine Lieferadresse benötigen.
 * Erweiterte Version von hasPhysical() — nutzt resolveItemShippingType.
 */
export function cartNeedsShippingAddress(items) {
  return items.some(i => resolveItemShippingType(i) === "physical");
}

/**
 * Normalisiert Werk-, Erlebnis- oder Feed-Items in das Commerce-2.0-Cart-Format.
 */
export function normalizeToCartItem(source, type = null) {
  if (!source) return null;

  // BOOK_EXPERIENCE-Payload: { experience, creator }
  if (source.experience && !source.id) {
    const exp = source.experience;
    const creator = source.creator;
    const raw = exp._raw || exp;
    return {
      id: exp.id || raw.id,
      type: "experience",
      title: exp.title || exp.name || raw.title,
      price: exp.price ?? raw.price,
      img: exp.img || exp.cover_url || raw.cover_url || raw.image_url,
      author: creator ? {
        id: creator.id || creator.user_id,
        name: creator.display_name || creator.name,
        avatar: creator.avatar_url || creator.avatar,
      } : undefined,
      user_id: exp.user_id || creator?.id || creator?.user_id,
      _raw: raw,
    };
  }

  const item = source;
  const inferredType = type || item.type || (item.max_participants != null ? "experience" : "work");
  return {
    ...item,
    type: inferredType,
    _raw: item._raw || item,
  };
}

/**
 * Fügt ein Item idempotent zum Commerce-2.0-Werkekorb hinzu.
 * @returns {boolean} true wenn hinzugefügt, false wenn ungültig oder bereits vorhanden
 */
export function addToCommerceCart(setCart, source, type = null) {
  const item = normalizeToCartItem(source, type);
  if (!item?.id) return false;
  let added = false;
  setCart(prev => {
    if (prev.some(x => x.id === item.id)) return prev;
    added = true;
    return [...prev, item];
  });
  return added;
}
