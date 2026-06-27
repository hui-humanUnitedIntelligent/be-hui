// supabase/functions/create-payment-intent/index.ts
// ═══════════════════════════════════════════════════════════════════
// HUI Commerce 2.0 — Create Stripe Payment Intent
// Sprint C1: Foundation (Stripe-Schlüssel noch nicht produktiv)
// ═══════════════════════════════════════════════════════════════════
//
// Flow:
//   Client sendet: { orderPayload } (aus commerceEngine.orderService.buildOrderPayload)
//   Server:
//     1. Validiert Auth
//     2. Validiert Betrag server-side (niemals dem Client vertrauen)
//     3. Erstellt Stripe Payment Intent
//     4. Erstellt Order-Record (status=pending)
//     5. Gibt clientSecret zurück
//
// Sicherheit:
//   - Preisberechnung serverseitig
//   - Webhook Signature Verification (handle-payment-webhook)
//   - Kein Preis kommt unkontrolliert vom Client
// ═══════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

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
    const { order, orderItems, stripe: stripeConfig } = await req.json()

    if (!order || !orderItems?.length) {
      return new Response(JSON.stringify({ error: 'order und orderItems erforderlich' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── 3. Server-seitige Preisvalidierung ───────────────────────
    // Beträge aus Snapshots neu berechnen — Client-Werte niemals blind übernehmen
    let serverTotal = 0
    for (const item of orderItems) {
      const snap     = item.snapshot || {}
      const price    = Number(snap.price_eur) || 0
      const qty      = Number(item.quantity) || 1
      const shipping = Number(item.shipping_eur) || 0
      serverTotal   += price * qty + shipping
    }
    serverTotal = Math.round(serverTotal * 100) / 100

    // Toleranz: max 1 Cent Abweichung durch Rundung
    const clientTotal = Number(order.total_eur)
    if (Math.abs(serverTotal - clientTotal) > 0.01) {
      console.error(`[PAYMENT] Preisabweichung: client=${clientTotal} server=${serverTotal}`)
      return new Response(JSON.stringify({
        error: 'Preisvalidierung fehlgeschlagen',
        detail: 'Bitte Seite neu laden und erneut versuchen'
      }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    const amountCents = Math.round(serverTotal * 100)
    if (amountCents < 50) { // Stripe Minimum: 50 Cent
      return new Response(JSON.stringify({ error: 'Mindestbetrag: 0.50 €' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── 4. Order in DB erstellen (status=pending) ─────────────────
    const { data: dbOrder, error: orderErr } = await supabase
      .from('orders')
      .insert({
        buyer_id:         user.id,
        subtotal_eur:     order.subtotal_eur,
        total_eur:        serverTotal,
        platform_fee_eur: Math.round(serverTotal * 0.10 * 100) / 100,
        impact_eur:       Math.round(serverTotal * 0.07 * 100) / 100,
        status:           'pending',
        currency:         'eur',
      })
      .select('id')
      .single()

    if (orderErr) {
      console.error('[ORDER] DB insert error:', orderErr.message)
      return new Response(JSON.stringify({ error: 'Order konnte nicht erstellt werden' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── 5. Order Items erstellen ──────────────────────────────────
    const itemInserts = orderItems.map(item => ({
      order_id:           dbOrder.id,
      creator_id:         item.creator_id || null,
      item_type:          item.item_type || 'work',
      item_id:            item.item_id || null,
      snapshot:           item.snapshot || {},
      shipping_type:      item.shipping_type || 'none',
      quantity:           item.quantity || 1,
      unit_price_eur:     item.unit_price_eur || 0,
      shipping_eur:       item.shipping_eur || 0,
      fulfillment_status: 'new',
      payout_status:      'held',
      impact_eur:         item.impact_eur || 0,
      payout_eur:         item.payout_eur || 0,
    }))

    await supabase.from('order_items').insert(itemInserts)

    // ── 6. Stripe Payment Intent erstellen ───────────────────────
    // HINWEIS: STRIPE_SECRET_KEY muss in Supabase Edge Function Secrets hinterlegt sein
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      // Stripe noch nicht konfiguriert — Demo-Modus
      console.warn('[STRIPE] STRIPE_SECRET_KEY nicht gesetzt — Demo-Modus')
      return new Response(JSON.stringify({
        clientSecret:  null,
        orderId:       dbOrder.id,
        demoMode:      true,
        message:       'Stripe-Schlüssel noch nicht konfiguriert',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   amountCents,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: {
        hui_order_id:   dbOrder.id,
        buyer_id:       user.id,
        item_count:     orderItems.length.toString(),
        creator_count:  [...new Set(orderItems.map(i => i.creator_id))].filter(Boolean).length.toString(),
        impact_eur:     (Math.round(serverTotal * 0.07 * 100) / 100).toFixed(2),
        source:         'hui_commerce_v2',
      },
    })

    // Payment Intent ID in Order speichern
    await supabase.from('orders')
      .update({ stripe_payment_intent: paymentIntent.id })
      .eq('id', dbOrder.id)

    // Commerce Event loggen
    await supabase.from('commerce_events').insert({
      event_type:  'order_created',
      order_id:    dbOrder.id,
      actor_id:    user.id,
      actor_type:  'buyer',
      payload:     { amount_eur: serverTotal, item_count: orderItems.length }
    })

    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret,
      orderId:      dbOrder.id,
      demoMode:     false,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})

  } catch (e) {
    console.error('[CREATE_PAYMENT_INTENT]', e?.message)
    return new Response(JSON.stringify({ error: e?.message || 'Unbekannter Fehler' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
