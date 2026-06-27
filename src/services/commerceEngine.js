// src/services/commerceEngine.js
// ═══════════════════════════════════════════════════════════════════
// HUI Commerce Engine v1.0 — Sprint C1 Foundation
// ═══════════════════════════════════════════════════════════════════
//
// Verantwortlichkeiten:
//   ✅ Orders erzeugen + lesen
//   ✅ Order Items pro Creator erzeugen
//   ✅ Shipping Strategy (Produkttyp → Stripe-Konfiguration)
//   ✅ Snapshot-Erstellung (Kaufzeitpunkt-Zustand)
//   ✅ Commerce Events loggen
//   ✅ Fulfillment-Status steuern (Creator)
//   ✅ Payout-Status steuern (HUI-intern)
//
// Nicht hier (Server-Only):
//   ❌ Stripe Payment Intent erstellen (→ Edge Function create-payment-intent)
//   ❌ Webhook-Verarbeitung (→ Edge Function handle-payment-webhook)
//   ❌ Stripe Transfer / Payout (→ Edge Function release-payout)
//
// Architekturregeln:
//   - Preisberechnung NIEMALS nur client-side — server validiert immer
//   - payment ≠ payout (strikt getrennte Felder + Status)
//   - Snapshot ist Single Source of Truth für Kaufzeitpunkt-Daten
//   - Multi-Creator: 1 Order → N Order Items → N Creator
// ═══════════════════════════════════════════════════════════════════

import { supabase } from "../lib/supabaseClient.js";
import { calcTotalWithQty, calcImpact, parseAmount } from "../components/commerce/commerceUtils.js";

// ── Safe Query Wrapper ────────────────────────────────────────────
async function sq(queryFn, fallback = null, label = "COMMERCE") {
  try {
    const result = await queryFn();
    const { data, error } = result;
    if (error) { console.warn(`[${label}]`, error.message); return { data: fallback, error }; }
    return { data, error: null };
  } catch (e) {
    console.warn(`[${label}] Unexpected:`, e?.message);
    return { data: fallback, error: e };
  }
}

// ═══════════════════════════════════════════════════════════════════
// SHIPPING STRATEGY — Produkttyp → Stripe-Konfiguration
// ═══════════════════════════════════════════════════════════════════

/**
 * Mögliche Shipping-Typen pro Produkttyp.
 * Steuert, welche Informationen Stripe anfordern soll.
 */
export const SHIPPING_RULES = {
  work: {
    physical:   { shippingType: "physical",   needsAddress: true,  needsPhone: false, stripeModes: ["shipping_address"] },
    digital:    { shippingType: "digital",    needsAddress: false, needsPhone: false, stripeModes: [] },
    download:   { shippingType: "digital",    needsAddress: false, needsPhone: false, stripeModes: [] },
    service:    { shippingType: "service",    needsAddress: false, needsPhone: false, stripeModes: [] },
    pickup:     { shippingType: "pickup",     needsAddress: false, needsPhone: false, stripeModes: [] },
    _default:   { shippingType: "physical",   needsAddress: true,  needsPhone: false, stripeModes: ["shipping_address"] },
  },
  experience: {
    _default:   { shippingType: "experience", needsAddress: false, needsPhone: true,  stripeModes: [] },
  },
  event: {
    _default:   { shippingType: "experience", needsAddress: false, needsPhone: false, stripeModes: [] },
  },
  service: {
    _default:   { shippingType: "service",    needsAddress: false, needsPhone: false, stripeModes: [] },
  },
  support: {
    _default:   { shippingType: "none",       needsAddress: false, needsPhone: false, stripeModes: [] },
  },
};

/**
 * Analysiert den Cart und gibt die vereinte Stripe-Strategie zurück.
 *
 * @param {Array} items  — Cart-Items
 * @returns {{
 *   needsShippingAddress: boolean,
 *   needsPhone: boolean,
 *   shippingAddressCollection: string|null,  // für Stripe
 *   itemStrategies: Map<string, object>       // item.id → Strategie
 * }}
 */
export function resolveShippingStrategy(items) {
  let needsShippingAddress = false;
  let needsPhone = false;
  const itemStrategies = new Map();

  for (const item of items) {
    const type     = item.type || "work";
    const raw      = item._raw || {};
    const delivery = (raw.delivery_type || raw.deliveryType || "_default").toLowerCase().trim();

    const typeRules = SHIPPING_RULES[type] || SHIPPING_RULES.work;
    const rule      = typeRules[delivery] || typeRules._default || typeRules.work._default;

    itemStrategies.set(item.id, rule);

    if (rule.needsAddress) needsShippingAddress = true;
    if (rule.needsPhone)   needsPhone = true;
  }

  return {
    needsShippingAddress,
    needsPhone,
    // Stripe Checkout Session Parameter (für später)
    shippingAddressCollection: needsShippingAddress
      ? { allowed_countries: ["DE", "AT", "CH", "FR", "NL", "BE", "PL", "IT", "ES"] }
      : null,
    itemStrategies,
  };
}

// ═══════════════════════════════════════════════════════════════════
// SNAPSHOT — Kaufzeitpunkt-Daten einfrieren
// ═══════════════════════════════════════════════════════════════════

/**
 * Erzeugt einen Snapshot eines Cart-Items zum Kaufzeitpunkt.
 * Dieser Snapshot ist unveränderlich nach Order-Erstellung.
 *
 * @param {object} item  — Cart-Item (normalisiertes Feed-Item)
 * @returns {object}     — JSONB-fähiges Snapshot-Objekt
 */
export function buildItemSnapshot(item) {
  const raw = item._raw || {};
  return {
    // Identifikation
    item_id:          item.id || raw.id,
    item_type:        item.type || "work",

    // Inhalt (Kaufzeitpunkt)
    title:            item.title || raw.title || "",
    description:      raw.description || raw.bio || "",
    cover_url:        item.mediaUrl || raw.cover_url || null,

    // Creator (Kaufzeitpunkt)
    creator_id:       item.author?.id || raw.user_id || null,
    creator_name:     item.author?.name || item.author?.displayName || "Wirker",
    creator_avatar:   item.author?.avatar || null,

    // Preis (Kaufzeitpunkt)
    price_eur:        parseAmount(item._raw?.price ?? item.price),
    quantity:         item.quantity || 1,

    // Versand
    delivery_type:    raw.delivery_type || raw.deliveryType || "physical",
    shipping_cost:    raw.shipping_cost || 0,

    // Impact
    impact_rate:      0.07,

    // Varianten (vorbereitet)
    variant:          raw.selected_variant || null,

    // Metadaten
    captured_at:      new Date().toISOString(),
    source:           "hui_werkekorb_v1",
  };
}

// ═══════════════════════════════════════════════════════════════════
// ORDER SERVICE — Client-side Lese-Operationen
// (Schreiben erfolgt über Edge Functions nach Stripe Webhook)
// ═══════════════════════════════════════════════════════════════════

export const orderService = {

  // Meine Bestellungen als Käufer
  async myOrders({ limit = 20, skip = 0 } = {}) {
    return sq(() => supabase
      .from("orders")
      .select(`
        id, status, total_eur, created_at, payment_confirmed_at,
        contact_name, contact_email,
        order_items(
          id, item_type, quantity, unit_price_eur, line_total_eur,
          fulfillment_status, payout_status, snapshot,
          shipments(id, carrier, tracking_number, tracking_url, shipped_at, delivered_at)
        )
      `)
      .order("created_at", { ascending: false })
      .range(skip, skip + limit - 1)
    , [], "ORDER");
  },

  // Eine Bestellung nach ID
  async getById(orderId) {
    return sq(() => supabase
      .from("orders")
      .select(`
        id, status, total_eur, subtotal_eur, shipping_eur, impact_eur,
        created_at, payment_confirmed_at, shipping_address,
        contact_name, contact_email,
        order_items(
          id, item_type, quantity, unit_price_eur, line_total_eur,
          fulfillment_status, payout_status, snapshot, created_at,
          shipments(id, carrier, tracking_number, tracking_url, shipped_at, delivered_at)
        )
      `)
      .eq("id", orderId)
      .single()
    , null, "ORDER");
  },

  // Order lokal vorbereiten (vor Stripe — nur für Übergabe an Edge Function)
  buildOrderPayload(items, shippingStrategy, buyerId) {
    const total     = calcTotalWithQty(items);
    const impact    = calcImpact(total);
    const platFee   = +(total * 0.10).toFixed(2); // 10% Plattformgebühr

    // Gruppierung nach Creator für Order Items
    const itemsByCreator = new Map();
    for (const item of items) {
      const creatorId = item.author?.id || item._raw?.user_id || "__unknown__";
      if (!itemsByCreator.has(creatorId)) itemsByCreator.set(creatorId, []);
      itemsByCreator.get(creatorId).push(item);
    }

    const orderItems = [];
    for (const [creatorId, creatorItems] of itemsByCreator) {
      for (const item of creatorItems) {
        const raw         = item._raw || {};
        const unitPrice   = parseAmount(item._raw?.price ?? item.price);
        const qty         = item.quantity || 1;
        const shipping    = raw.shipping_cost || 0;
        const typeRules   = shippingStrategy.itemStrategies?.get(item.id);
        const itemImpact  = +((unitPrice * qty) * 0.07).toFixed(2);
        const payoutEur   = +((unitPrice * qty) * 0.90).toFixed(2); // 90% an Creator

        orderItems.push({
          creator_id:         creatorId,
          item_type:          item.type || "work",
          item_id:            item.id || null,
          snapshot:           buildItemSnapshot(item),
          shipping_type:      typeRules?.shippingType || "physical",
          quantity:           qty,
          unit_price_eur:     unitPrice,
          shipping_eur:       shipping,
          fulfillment_status: "new",
          payout_status:      "held",
          impact_eur:         itemImpact,
          payout_eur:         payoutEur,
        });
      }
    }

    return {
      order: {
        buyer_id:         buyerId,
        subtotal_eur:     total,
        shipping_eur:     0,         // TODO: Versandkostenberechnung Sprint C2
        discount_eur:     0,         // TODO: Gutscheine Sprint C4
        total_eur:        total,
        platform_fee_eur: platFee,
        impact_eur:       impact,
        status:           "pending",
        currency:         "eur",
      },
      orderItems,
      stripe: {
        amount_cents:             Math.round(total * 100),
        currency:                 "eur",
        shipping_address_collection: shippingStrategy.shippingAddressCollection,
        metadata: {
          buyer_id:       buyerId,
          item_count:     items.length.toString(),
          creator_count:  itemsByCreator.size.toString(),
          impact_eur:     impact.toFixed(2),
          source:         "hui_werkekorb_v1",
        },
      },
    };
  },
};

// ═══════════════════════════════════════════════════════════════════
// ORDER ITEMS — Creator Dashboard (Fulfillment)
// ═══════════════════════════════════════════════════════════════════

export const fulfillmentService = {

  // Meine Order Items als Creator
  async myItems({ status = null, limit = 30, skip = 0 } = {}) {
    let q = supabase
      .from("order_items")
      .select(`
        id, item_type, quantity, unit_price_eur, line_total_eur,
        fulfillment_status, payout_status, payout_eur,
        snapshot, created_at, fulfilled_at,
        order:order_id(id, contact_name, contact_email, shipping_address, payment_confirmed_at),
        shipments(id, carrier, tracking_number, tracking_url, shipped_at, delivered_at)
      `)
      .order("created_at", { ascending: false })
      .range(skip, skip + limit - 1);

    if (status) q = q.eq("fulfillment_status", status);
    return sq(() => q, [], "FULFILLMENT");
  },

  // Fulfillment-Status aktualisieren (Creator)
  async updateStatus(itemId, status, note = null) {
    const updates = {
      fulfillment_status: status,
      fulfillment_note:   note,
      updated_at:         new Date().toISOString(),
    };
    if (status === "done") updates.fulfilled_at = new Date().toISOString();

    return sq(() => supabase
      .from("order_items")
      .update(updates)
      .eq("id", itemId)
      .select()
      .single()
    , null, "FULFILLMENT");
  },

  // Tracking hinzufügen
  async addTracking(orderItemId, orderId, { carrier, trackingNumber, trackingUrl, estimatedDelivery } = {}) {
    if (!orderItemId || !trackingNumber) return { data: null, error: "trackingNumber erforderlich" };

    // 1. Shipment anlegen
    const { data: shipment, error: shipErr } = await sq(() => supabase
      .from("shipments")
      .insert({
        order_item_id:     orderItemId,
        order_id:          orderId,
        carrier:           carrier || null,
        tracking_number:   trackingNumber,
        tracking_url:      trackingUrl || null,
        estimated_delivery: estimatedDelivery || null,
        shipped_at:        new Date().toISOString(),
      })
      .select()
      .single()
    , null, "SHIPMENT");

    if (shipErr) return { data: null, error: shipErr };

    // 2. Order Item Status → shipped
    await fulfillmentService.updateStatus(orderItemId, "shipped", `Versand via ${carrier || "Paketdienst"}`);

    return { data: shipment, error: null };
  },
};

// ═══════════════════════════════════════════════════════════════════
// COMMERCE EVENT LOG
// ═══════════════════════════════════════════════════════════════════

export const commerceEventLog = {
  async record({ eventType, orderId = null, orderItemId = null, payoutId = null,
                 actorId = null, actorType = "system", payload = {} }) {
    // Fire-and-forget — blockiert nie UI
    supabase.from("commerce_events").insert({
      event_type:    eventType,
      order_id:      orderId,
      order_item_id: orderItemId,
      payout_id:     payoutId,
      actor_id:      actorId,
      actor_type:    actorType,
      payload,
    }).then(({ error }) => {
      if (error) console.warn("[COMMERCE_EVENT]", error.message);
    });
  },
};

// ═══════════════════════════════════════════════════════════════════
// STRIPE APPEARANCE — HUI Design
// Wird beim Initialisieren des Stripe Elements übergeben
// ═══════════════════════════════════════════════════════════════════

export const STRIPE_APPEARANCE = {
  theme: "flat",
  variables: {
    colorPrimary:         "#0DC4B5",       // HUI Teal
    colorBackground:      "#FAF7F2",       // HUI Cream
    colorText:            "#141422",       // HUI Ink
    colorTextSecondary:   "#8A8A9E",       // HUI Muted
    colorDanger:          "#F47355",       // HUI Coral
    colorSuccess:         "#6BAE8F",       // HUI Sage
    fontFamily:           "Inter, system-ui, sans-serif",
    borderRadius:         "14px",
    spacingUnit:          "5px",
    fontSizeBase:         "15px",
    fontWeightNormal:     "450",
    fontWeightMedium:     "600",
    fontWeightBold:       "700",
  },
  rules: {
    ".Input": {
      backgroundColor:  "#FDFBF8",
      border:           "1.5px solid rgba(20,20,34,0.10)",
      borderRadius:     "12px",
      padding:          "12px 14px",
      fontSize:         "15px",
      color:            "#141422",
      boxShadow:        "none",
    },
    ".Input:focus": {
      border:     "1.5px solid #0DC4B5",
      boxShadow:  "0 0 0 3px rgba(13,196,181,0.12)",
      outline:    "none",
    },
    ".Input--invalid": {
      border:     "1.5px solid #F47355",
    },
    ".Label": {
      color:       "#8A8A9E",
      fontSize:    "12px",
      fontWeight:  "600",
      letterSpacing: "0.3px",
      marginBottom: "6px",
    },
    ".Error": {
      color:    "#F47355",
      fontSize: "12px",
    },
    ".Tab": {
      backgroundColor: "#FAF7F2",
      border:          "1.5px solid rgba(20,20,34,0.08)",
      borderRadius:    "12px",
    },
    ".Tab--selected": {
      backgroundColor: "rgba(13,196,181,0.08)",
      border:          "1.5px solid #0DC4B5",
      color:           "#0DC4B5",
    },
    ".Block": {
      backgroundColor: "#FAF7F2",
      borderRadius:    "14px",
      border:          "1.5px solid rgba(20,20,34,0.06)",
    },
  },
};

// ═══════════════════════════════════════════════════════════════════
// PLATFORM CONFIG
// ═══════════════════════════════════════════════════════════════════

export const COMMERCE_CONFIG = {
  PLATFORM_FEE_RATE:   0.10,   // 10% HUI Plattformgebühr
  IMPACT_RATE:         0.07,   // 7%  Impact Pool (aus Plattformgebühr)
  CREATOR_PAYOUT_RATE: 0.90,   // 90% an Creator
  CURRENCY:            "eur",
  PAYOUT_DELAY_DAYS:   14,     // Auszahlungsfrist nach Lieferung
  SUPPORTED_COUNTRIES: ["DE", "AT", "CH", "FR", "NL", "BE", "PL", "IT", "ES"],
};
