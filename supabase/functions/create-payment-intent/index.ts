// supabase/functions/create-payment-intent/index.ts
// ═══════════════════════════════════════════════════════════════════
// HUI Commerce 2.0 — Create Stripe Payment Intent (P0 Security Fix)
// ═══════════════════════════════════════════════════════════════════
// Änderungen gegenüber Sprint C1:
//   ✅ Server-side Preis-Lookup aus DB (commerce_price_authority View)
//   ✅ payout_eur server-side berechnet — nie Client-Wert
//   ✅ Idempotency Key auf PI-Erstellung
//   ✅ Qty-Validierung (positive Integer, kein Overflow)
//   ✅ Demo-Mode: klarer Fehler statt clientSecret=null
// ═══════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PLATFORM_FEE_RATE = 0.10
const IMPACT_RATE       = 0.07
const CREATOR_SHARE     = 0.90
const MAX_QTY           = 99

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')

  // Kein Stripe Key → klarer Fehler (kein Demo-Mode mit orphaned Orders)
  if (!stripeKey) {
    return new Response(JSON.stringify({
      error: 'Stripe nicht konfiguriert — STRIPE_SECRET_KEY fehlt in Edge Function Secrets',
      code:  'STRIPE_NOT_CONFIGURED',
    }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── 1. Auth ──────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') ?? ''
    )
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── 2. Payload lesen ─────────────────────────────────────────
    const { order: clientOrder, orderItems: clientItems } = await req.json()

    if (!clientOrder || !clientItems?.length) {
      return new Response(JSON.stringify({ error: 'order und orderItems erforderlich' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── 3. Server-side Preis-Authorität (DB-Lookup) ──────────────
    // Schritt A: alle item_ids sammeln die eine DB-Quelle haben
    const lookupIds = clientItems
      .filter((i: any) => i.item_id && i.item_type !== 'support')
      .map((i: any) => i.item_id)

    let priceMap: Record<string, number> = {}

    if (lookupIds.length > 0) {
      const { data: authorityRows } = await supabase
        .from('commerce_price_authority')
        .select('item_id, price_eur')
        .in('item_id', lookupIds)

      for (const row of (authorityRows || [])) {
        priceMap[row.item_id] = Number(row.price_eur) || 0
      }
    }

    // Schritt B: Betrag server-side aus DB-Preisen berechnen
    let serverTotal = 0
    const validatedItems: any[] = []

    for (const item of clientItems) {
      const snap = item.snapshot || {}

      // Qty validieren
      const rawQty = Number(item.quantity) || 1
      const qty = Math.max(1, Math.min(MAX_QTY, Math.round(rawQty)))

      // Preis: DB-Lookup bevorzugt, Snapshot als Fallback (für support/custom items)
      const dbPrice     = item.item_id ? priceMap[item.item_id] : null
      const snapPrice   = Number(snap.price_eur) || 0
      const unitPrice   = dbPrice !== null && dbPrice !== undefined ? dbPrice : snapPrice

      if (unitPrice <= 0 && item.item_type !== 'support') {
        console.warn(`[PAYMENT] Item ${item.item_id} hat Preis 0 — möglicherweise nicht published`)
      }

      // Shipping: aktuell immer 0 (Sprint C3: serverseitige Berechnung)
      const shippingEur = 0

      const lineTotal  = +(unitPrice * qty + shippingEur).toFixed(2)
      const payoutEur  = +(lineTotal * CREATOR_SHARE).toFixed(2)    // Server berechnet!
      const impactEur  = +(lineTotal * IMPACT_RATE).toFixed(2)

      serverTotal += lineTotal

      validatedItems.push({
        ...item,
        quantity:       qty,
        unit_price_eur: unitPrice,
        shipping_eur:   shippingEur,
        payout_eur:     payoutEur,   // server-computed
        impact_eur:     impactEur,   // server-computed
        // Snapshot mit verifizierten Werten überschreiben
        snapshot: {
          ...snap,
          price_eur:   unitPrice,
          quantity:    qty,
          payout_eur:  payoutEur,
          impact_eur:  impactEur,
          server_validated: true,
          validated_at:     new Date().toISOString(),
        },
      })
    }

    serverTotal = Math.round(serverTotal * 100) / 100
    const amountCents = Math.round(serverTotal * 100)

    if (amountCents < 50) {
      return new Response(JSON.stringify({ error: 'Mindestbetrag: 0.50 €' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── 4. Order in DB anlegen (pending) ─────────────────────────
    const { data: dbOrder, error: orderErr } = await supabase
      .from('orders')
      .insert({
        buyer_id:         user.id,
        subtotal_eur:     serverTotal,
        total_eur:        serverTotal,
        platform_fee_eur: +(serverTotal * PLATFORM_FEE_RATE).toFixed(2),
        impact_eur:       +(serverTotal * IMPACT_RATE).toFixed(2),
        status:           'pending',
        currency:         'eur',
      })
      .select('id')
      .single()

    if (orderErr || !dbOrder) {
      console.error('[ORDER] DB insert error:', orderErr?.message)
      return new Response(JSON.stringify({ error: 'Order konnte nicht erstellt werden' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── 5. Order Items mit server-validierten Werten anlegen ──────
    const itemInserts = validatedItems.map((item: any) => ({
      order_id:           dbOrder.id,
      creator_id:         (item.creator_id && item.creator_id !== '__unknown__') ? item.creator_id : null,
      item_type:          item.item_type || 'work',
      item_id:            item.item_id || null,
      snapshot:           item.snapshot,
      shipping_type:      item.shipping_type || 'none',
      quantity:           item.quantity,
      unit_price_eur:     item.unit_price_eur,
      shipping_eur:       item.shipping_eur,
      payout_eur:         item.payout_eur,   // server-berechnet
      impact_eur:         item.impact_eur,   // server-berechnet
      fulfillment_status: 'new',
      payout_status:      'held',
    }))

    await supabase.from('order_items').insert(itemInserts)

    // ── 6. Stripe Payment Intent (mit Idempotency Key) ────────────
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })

    // Idempotency Key = Order-ID (verhindert Doppel-PIs bei Netzwerkfehler)
    const idempotencyKey = `pi_hui_${dbOrder.id}`

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   amountCents,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      receipt_email: user.email || undefined,
      metadata: {
        hui_order_id:   dbOrder.id,
        buyer_id:       user.id,
        item_count:     validatedItems.length.toString(),
        creator_count:  [...new Set(validatedItems.map((i: any) => i.creator_id))].filter(Boolean).length.toString(),
        impact_eur:     (+(serverTotal * IMPACT_RATE).toFixed(2)).toFixed(2),
        source:         'hui_commerce_v2',
      },
    }, { idempotencyKey })

    // PI-ID in Order speichern
    await supabase.from('orders')
      .update({ stripe_payment_intent: paymentIntent.id })
      .eq('id', dbOrder.id)

    // Commerce Event
    await supabase.from('commerce_events').insert({
      event_type: 'order_created',
      order_id:   dbOrder.id,
      actor_id:   user.id,
      actor_type: 'buyer',
      payload:    { amount_eur: serverTotal, item_count: validatedItems.length, db_validated: true }
    }).catch(() => {})

    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret,
      orderId:      dbOrder.id,
      serverTotal,  // zur Anzeige im UI (trusted)
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})

  } catch (e: any) {
    console.error('[CREATE_PAYMENT_INTENT]', e?.message)
    return new Response(JSON.stringify({ error: e?.message || 'Unbekannter Fehler' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
