// supabase/functions/create-payment-intent/index.ts
// deploy-trigger: 2026-06-27T18-43-40-owner-fallback-v2
// ═══════════════════════════════════════════════════════════════════
// HUI Commerce 2.0 — Create Payment Intent (Production Final)
// ═══════════════════════════════════════════════════════════════════
// Fixes (Production Sign-Off):
//   P0: creator_id kommt ausschließlich aus DB (commerce_price_authority)
//       Client-Wert für creator_id wird vollständig ignoriert
//   P1: Order-Cleanup bei Stripe-Fehler (keine orphaned pending Orders)
//   P1: Session-Idempotenz via Cart-Hash (eine offene Order pro Checkout)
//   P0: price, payout, impact, commission_eur — alles server-berechnet
//   P0: qty >= 1, qty <= 99, nur positive Integers
// ═══════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Serverseitige Konstanten — nie vom Client übernehmen
// COM-MIGRATION-015.3: Gebuehr 10%->15%, Impact 7%->2.25% (=15% der Gebuehr), Creator 90%->85%
const PLATFORM_FEE_RATE = 0.15
const IMPACT_RATE       = 0.0225
const CREATOR_SHARE     = 0.85
const MAX_QTY           = 99
const MIN_AMOUNT_CENTS  = 50   // Stripe Minimum EUR

// ── Cart-Hash für Idempotenz ──────────────────────────────────────
// Deterministisch: gleicher Cart + gleicher User = gleicher Hash
function buildCartHash(userId: string, items: any[]): string {
  const sorted = [...items]
    .sort((a, b) => (a.item_id || '').localeCompare(b.item_id || ''))
    .map(i => {
      const qty = Math.max(1, Math.min(MAX_QTY, Number(i.quantity) || 1))
      if (i.item_type === 'support') {
        const price = Number(i.unit_price_eur) || 0
        return `support:${i.item_id}:${price.toFixed(2)}`
      }
      return `${i.item_id}:${qty}`
    })
    .join('|')
  return `hui_cart_${userId}_${btoa(sorted).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) {
    return new Response(JSON.stringify({
      error: 'Stripe nicht konfiguriert',
      code:  'STRIPE_NOT_CONFIGURED',
    }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }

  // Order-ID für Cleanup im Fehlerfall
  let createdOrderId: string | null = null

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

    // ── 2. Client-Payload — NUR item_id + quantity akzeptiert ────
    const { orderItems: rawClientItems } = await req.json()

    if (!rawClientItems?.length) {
      return new Response(JSON.stringify({ error: 'orderItems erforderlich' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Nur item_id und quantity vom Client übernehmen — Support: unit_price_eur aus Snapshot
    const clientItems = rawClientItems.map((i: any) => ({
      item_id:        (i.item_type === 'support'
        ? (i.item_id || i.snapshot?.creator_id || i.snapshot?.item_id)
        : (i.item_id || i.snapshot?.item_id || null)) as string | null,
      item_type:      (i.item_type || i.snapshot?.item_type || 'work') as string,
      quantity:       Math.max(1, Math.min(MAX_QTY, Math.round(Number(i.quantity) || 1))),
      unit_price_eur: i.unit_price_eur ?? i.snapshot?.price_eur ?? null,
    }))

    // ── 3. Session-Idempotenz: bestehende offene Order prüfen ────
    const cartHash = buildCartHash(user.id, clientItems)

    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, stripe_payment_intent, total_eur, state')
      .eq('customer_id', user.id)
      .eq('state', 'pending')
      .eq('cart_hash', cartHash)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingOrder?.stripe_payment_intent) {
      // Bestehenden PI reaktivieren statt neuen erstellen
      const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })
      try {
        const pi = await stripe.paymentIntents.retrieve(existingOrder.stripe_payment_intent)
        if (pi.status === 'requires_payment_method' || pi.status === 'requires_confirmation') {
          console.log('[PI] Bestehenden PI wiederverwendet:', pi.id)
          return new Response(JSON.stringify({
            clientSecret: pi.client_secret,
            orderId:      existingOrder.id,
            reused:       true,
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
        }
      } catch {}
      // PI nicht mehr nutzbar → alte Order auf aborted setzen, neu erstellen
      await supabase.from('orders').update({ state: 'aborted' }).eq('id', existingOrder.id)
    }

    // ── 4. Serverseitiger Preis-Lookup — EINZIGE Quelle für Preise ──
    const itemIds = clientItems.filter((i: any) => i.item_id).map((i: any) => i.item_id)

    // Primär: nur published Items (commerce_price_authority View)
    const { data: authorityRows, error: priceErr } = await supabase
      .from('commerce_price_authority')
      .select('item_id, item_type, price_eur, creator_id, title, cover_url')
      .in('item_id', itemIds)

    if (priceErr) {
      console.error('[PI] Price lookup error:', priceErr.message)
      return new Response(JSON.stringify({ error: 'Preisvalidierung fehlgeschlagen' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fallback: Items die published-Filter nicht bestanden haben —
    // Creator kann eigene nicht-published Werke kaufen (z.B. pending_review beim Testen)
    const foundIds = new Set((authorityRows || []).map((r: any) => r.item_id))
    const missingIds = itemIds.filter(id => !foundIds.has(id))
    let fallbackRows: any[] = []
    if (missingIds.length > 0) {
      const { data: fb } = await supabase
        .from('works')
        .select('id as item_id, user_id as creator_id, price as price_eur, title, cover_url, status')
        .in('id', missingIds)
        .eq('user_id', user.id)   // NUR eigene Werke
        .in('status', ['pending_review', 'draft', 'approved'])
        .not('price', 'is', null)
        .gt('price', 0)
      if (fb?.length) {
        fallbackRows = fb.map((r: any) => ({ ...r, item_type: 'work' }))
        console.log('[PI] Fallback: Owner-Werke (nicht published):', fallbackRows.map((r:any) => r.item_id))
      }
    }
    const allAuthorityRows = [...(authorityRows || []), ...fallbackRows]

    // Price Map: item_id → { price_eur, creator_id, title, cover_url }
    const priceMap = new Map<string, any>()
    for (const row of allAuthorityRows) {
      priceMap.set(row.item_id, row)
    }

    // ── 5. Berechnung — alles server-side ────────────────────────
    let serverTotal = 0
    const validatedItems: any[] = []

    for (const clientItem of clientItems) {
      // ── Support: Creator-ID + client-gewählter Betrag (validiert) ──
      if (clientItem.item_type === 'support') {
        const creatorId = clientItem.item_id
        const unitPrice = Number(clientItem.unit_price_eur)
        if (!creatorId || !unitPrice || unitPrice < 0.5) {
          console.warn(`[PI] Support-Item ungültig: creator=${creatorId} price=${unitPrice}`)
          continue
        }
        const { data: creatorRow } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .eq('id', creatorId)
          .single()
        if (!creatorRow) {
          console.warn(`[PI] Support-Creator ${creatorId} nicht gefunden`)
          continue
        }
        const qty       = clientItem.quantity
        const lineTotal = +(unitPrice * qty).toFixed(2)
        const payoutEur = +(lineTotal * CREATOR_SHARE).toFixed(2)
        const impactEur = +(lineTotal * IMPACT_RATE).toFixed(2)
        const commissionEur = +(lineTotal * PLATFORM_FEE_RATE).toFixed(2)
        serverTotal += lineTotal
        validatedItems.push({
          seller_id:      creatorRow.id,
          item_type:      'support',
          item_id:        creatorRow.id,
          quantity:       qty,
          unit_price_eur: unitPrice,
          shipping_eur:   0,
          payout_eur:     payoutEur,
          impact_eur:     impactEur,
          shipping_type:  'none',
          snapshot: {
            item_id:          creatorRow.id,
            item_type:        'support',
            title:            `Unterstützung für ${creatorRow.display_name || 'Talent'}`,
            cover_url:        creatorRow.avatar_url,
            seller_id:        creatorRow.id,
            price_eur:        unitPrice,
            quantity:         qty,
            payout_eur:       payoutEur,
            impact_eur:       impactEur,
            commission_eur:   commissionEur,
            server_validated: true,
            validated_at:     new Date().toISOString(),
          },
        })
        continue
      }

      if (!clientItem.item_id) continue  // unbekannte custom items überspringen

      const dbRow = priceMap.get(clientItem.item_id)
      if (!dbRow) {
        console.warn(`[PI] Item ${clientItem.item_id} nicht in commerce_price_authority — nicht published?`)
        continue  // Item nicht verfügbar → überspringen statt Fehler
      }

      const qty        = clientItem.quantity
      const unitPrice  = Number(dbRow.price_eur)
      const lineTotal  = +(unitPrice * qty).toFixed(2)
      const payoutEur  = +(lineTotal * CREATOR_SHARE).toFixed(2)
      const impactEur  = +(lineTotal * IMPACT_RATE).toFixed(2)
      const commissionEur = +(lineTotal * PLATFORM_FEE_RATE).toFixed(2)

      serverTotal += lineTotal

      validatedItems.push({
        seller_id:      dbRow.creator_id,  // commerce_price_authority.creator_id → order_items.seller_id
        item_type:      dbRow.item_type || clientItem.item_type,
        item_id:        clientItem.item_id,
        quantity:       qty,
        unit_price_eur: unitPrice,
        shipping_eur:   0,
        payout_eur:     payoutEur,
        impact_eur:     impactEur,
        shipping_type:  'none',
        snapshot: {
          item_id:          clientItem.item_id,
          item_type:        dbRow.item_type,
          title:            dbRow.title,
          cover_url:        dbRow.cover_url,
          seller_id:        dbRow.creator_id,
          price_eur:        unitPrice,
          quantity:         qty,
          payout_eur:       payoutEur,
          impact_eur:       impactEur,
          commission_eur:   commissionEur,
          server_validated: true,
          validated_at:     new Date().toISOString(),
        },
      })
    }

    serverTotal = Math.round(serverTotal * 100) / 100

    if (validatedItems.length === 0) {
      return new Response(JSON.stringify({ error: 'Keine verfügbaren Items — möglicherweise nicht mehr published' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const amountCents = Math.round(serverTotal * 100)
    if (amountCents < MIN_AMOUNT_CENTS) {
      return new Response(JSON.stringify({ error: 'Mindestbetrag 0.50 €' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── 6. Order anlegen ─────────────────────────────────────────
    const { data: dbOrder, error: orderErr } = await supabase
      .from('orders')
      .insert({
        customer_id:      user.id,
        subtotal_eur:     serverTotal,
        total_eur:        serverTotal,
        commission_eur:   +(serverTotal * PLATFORM_FEE_RATE).toFixed(2),
        impact_eur:       +(serverTotal * IMPACT_RATE).toFixed(2),
        state:            'pending',
        currency:         'eur',
        cart_hash:        cartHash,  // für Idempotenz-Lookup
      })
      .select('id')
      .single()

    if (orderErr || !dbOrder) {
      return new Response(JSON.stringify({ error: 'Order-Erstellung fehlgeschlagen' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    createdOrderId = dbOrder.id  // für Cleanup

    // ── 7. Order Items ────────────────────────────────────────────
    const { error: itemsErr } = await supabase.from('order_items').insert(
      validatedItems.map(item => ({
        order_id:    dbOrder.id,
        seller_id:   item.seller_id,
        item_type:          item.item_type,
        item_id:            item.item_id,
        ...(item.item_type === 'work' ? { work_id: item.item_id } : {}),
        snapshot:           item.snapshot,
        shipping_type:      item.shipping_type,
        quantity:           item.quantity,
        unit_price_eur:     item.unit_price_eur,
        shipping_eur:       item.shipping_eur,
        payout_eur:         item.payout_eur,
        impact_eur:         item.impact_eur,
        fulfillment_status: 'new',
        payout_status:      'held',
      }))
    )
    if (itemsErr) {
      console.error('[PI] Order items insert failed:', itemsErr.message)
      await supabase.from('orders').update({ state: 'aborted' }).eq('id', dbOrder.id)
      return new Response(JSON.stringify({ error: 'Order-Items fehlgeschlagen', detail: itemsErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── 8. Stripe Payment Intent ──────────────────────────────────
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })
    const idempotencyKey = `pi_hui_${dbOrder.id}`

    let paymentIntent: Stripe.PaymentIntent
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount:   amountCents,
        currency: 'eur',
        automatic_payment_methods: { enabled: true },
        receipt_email: user.email || undefined,
        metadata: {
          hui_order_id:   dbOrder.id,
          customer_id:    user.id,
          item_count:     validatedItems.length.toString(),
          creator_count:  [...new Set(validatedItems.map(i => i.seller_id))].filter(Boolean).length.toString(),
          impact_eur:     (+(serverTotal * IMPACT_RATE).toFixed(2)).toFixed(2),
          cart_hash:      cartHash,
          source:         'hui_commerce_v2',
        },
      }, { idempotencyKey })
    } catch (stripeErr: any) {
      // P1: Stripe-Fehler → Order cleanup (kein orphaned pending)
      console.error('[PI] Stripe Error:', stripeErr.message)
      await supabase.from('orders')
        .update({ state: 'aborted' })
        .eq('id', dbOrder.id)
      const { error: failEventErr } = await supabase.from('commerce_events').insert({
        event_type: 'payment_failed',
        order_id:   dbOrder.id,
        actor_type: 'system',
        payload:    { error: stripeErr.message, stage: 'pi_creation' }
      })
      if (failEventErr) console.warn('[PI] commerce_events insert failed:', failEventErr.message)
      return new Response(JSON.stringify({
        error: 'Stripe-Verbindung fehlgeschlagen. Bitte erneut versuchen.',
        code:  'STRIPE_ERROR',
      }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    // PI-ID in Order speichern
    const { error: piLinkErr } = await supabase.from('orders')
      .update({ stripe_payment_intent: paymentIntent.id })
      .eq('id', dbOrder.id)
    if (piLinkErr) {
      console.error('[PI] stripe_payment_intent update failed:', piLinkErr.message)
      await supabase.from('orders').update({ state: 'aborted' }).eq('id', dbOrder.id)
      return new Response(JSON.stringify({ error: 'Order-Verknüpfung fehlgeschlagen' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Commerce Event
    const { error: orderEventErr } = await supabase.from('commerce_events').insert({
      event_type: 'order_created',
      order_id:   dbOrder.id,
      actor_id:   user.id,
      actor_type: 'buyer',
      payload:    {
        amount_eur:    serverTotal,
        item_count:    validatedItems.length,
        db_validated:  true,
        creator_count: [...new Set(validatedItems.map(i => i.seller_id))].length,
      }
    })
    if (orderEventErr) console.warn('[PI] commerce_events insert failed:', orderEventErr.message)

    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret,
      orderId:      dbOrder.id,
      serverTotal,
      publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY') || null,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})

  } catch (e: any) {
    // P1: unerwarteter Fehler → Order cleanup
    if (createdOrderId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      const { error: cleanupErr } = await supabase.from('orders')
        .update({ state: 'aborted' })
        .eq('id', createdOrderId)
      if (cleanupErr) console.warn('[PI] Order cleanup failed:', cleanupErr.message)
    }
    console.error('[CREATE_PAYMENT_INTENT] Unhandled:', e?.message)
    return new Response(JSON.stringify({ error: e?.message || 'Unbekannter Fehler' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
