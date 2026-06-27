// supabase/functions/handle-payment-webhook/index.ts
// deploy-trigger: 2026-06-27T5-constructEventAsync-deno
// ═══════════════════════════════════════════════════════════════════
// HUI Commerce 2.0 — Stripe Webhook Handler (P0 Security Fix)
// Änderungen:
//   ✅ webhook_events Idempotency (event.id UNIQUE)
//   ✅ WHERE status = 'pending' Guard vor Order-Update
//   ✅ Amount-Verification: pi.amount === order.total_eur * 100
//   ✅ Webhook-Replay verhindert doppeltes Impact-Crediting
// ═══════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=denonext'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const stripeKey     = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    const body      = await req.text()
    const signature = req.headers.get('stripe-signature') ?? ''

    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing stripe-signature' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!stripeKey || !webhookSecret) {
      console.warn('[WEBHOOK] Stripe nicht konfiguriert')
      return new Response(JSON.stringify({ error: 'Stripe nicht konfiguriert' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })

    // ── Webhook Signature Verification (async — Deno Web Crypto) ─
    let event: Stripe.Event
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider,
      )
    } catch (err: any) {
      console.error('[WEBHOOK] Signature verification failed:', err.message)
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Idempotency: Event bereits verarbeitet? ───────────────────
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id, status')
      .eq('stripe_event_id', event.id)
      .single()

    if (existingEvent) {
      console.log('[WEBHOOK] Event bereits verarbeitet:', event.id)
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Event registrieren (vor Verarbeitung — verhindert Race Conditions)
    const { error: registerErr } = await supabase.from('webhook_events').insert({
      stripe_event_id: event.id,
      event_type:      event.type,
      payload: { type: event.type, created: event.created },
      status:          'processing',
    })
    if (registerErr && registerErr.code !== '23505') {
      console.warn('[WEBHOOK] Event registration failed:', registerErr.message)
    }

    console.log('[WEBHOOK] Verarbeite Event:', event.type, event.id)

    // ── Event-Handler ─────────────────────────────────────────────
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent

      // Order laden (nur pending — verhindert Doppel-Update)
      let order: { id: string; customer_id: string; total_eur: number; state: string } | null = null
      let orderErr: { message?: string } | null = null

      const orderByPi = await supabase
        .from('orders')
        .select('id, customer_id, total_eur, state')
        .eq('stripe_payment_intent', pi.id)
        .eq('state', 'pending')
        .single()
      order = orderByPi.data
      orderErr = orderByPi.error

      if (!order && pi.metadata?.hui_order_id) {
        const orderByMeta = await supabase
          .from('orders')
          .select('id, customer_id, total_eur, state')
          .eq('id', pi.metadata.hui_order_id)
          .eq('state', 'pending')
          .single()
        order = orderByMeta.data
        orderErr = orderByMeta.error
      }

      if (orderErr || !order) {
        console.warn('[WEBHOOK] Order nicht gefunden oder nicht pending:', orderErr?.message, 'PI:', pi.id, 'meta:', pi.metadata?.hui_order_id)
        await supabase.from('webhook_events').update({ status: 'processed' })
          .eq('stripe_event_id', event.id)
        return new Response('ok', { headers: corsHeaders })
      }

      const { data: orderItems } = await supabase
        .from('order_items')
        .select('id, seller_id')
        .eq('order_id', order.id)

      // ── Amount-Verification ──────────────────────────────────
      const expectedCents = Math.round(Number(order.total_eur) * 100)
      if (Math.abs(pi.amount - expectedCents) > 1) { // 1 Cent Toleranz
        console.error(`[WEBHOOK] Amount-Mismatch: stripe=${pi.amount} erwartet=${expectedCents} order=${order.id}`)
        // Order auf failed setzen — manuelle Prüfung notwendig
        await supabase.from('orders').update({ state: 'failed' }).eq('id', order.id)
        await supabase.from('webhook_events').update({
          status: 'failed',
          payload: { error: 'amount_mismatch', stripe: pi.amount, expected: expectedCents }
        }).eq('stripe_event_id', event.id)
        return new Response('ok', { headers: corsHeaders })
      }

      // ── Order → paid ─────────────────────────────────────────
      await supabase.from('orders').update({
        state:                'paid',
        payment_confirmed_at: new Date().toISOString(),
        shipping_address:     (pi as any).shipping?.address ?? null,
        contact_name:         (pi as any).shipping?.name ?? null,
        contact_email:        pi.receipt_email ?? null,
      }).eq('id', order.id).eq('state', 'pending') // doppelter Guard

      // ── Commerce Event ────────────────────────────────────────
      const { error: confirmEventErr } = await supabase.from('commerce_events').insert({
        event_type: 'payment_confirmed',
        order_id:   order.id,
        actor_type: 'webhook',
        payload:    { stripe_pi: pi.id, amount: pi.amount, verified: true }
      })
      if (confirmEventErr) console.warn('[WEBHOOK] commerce_events insert failed:', confirmEventErr.message)

      // ── Creator Notifications ─────────────────────────────────
      const creatorIds = [...new Set(
        (orderItems || []).map((i: any) => i.seller_id).filter(Boolean)
      )]
      for (const creatorId of creatorIds) {
        const { error: notifErr } = await supabase.from('notifications').insert({
          user_id: creatorId,
          type:    'new_order',
          title:   'Neue Bestellung 🎉',
          body:    'Jemand hat dein Werk unterstützt.',
          data:    { order_id: order.id },
          read:    false,
        })
        if (notifErr) console.warn('[NOTIF]', notifErr.message)
      }

      // ── Impact Pool (nur einmalig via Idempotency) ────────────
      const impactEur = Math.round(Number(order.total_eur) * 0.07 * 100) / 100
      if (impactEur > 0) {
        const { data: currentRound } = await supabase
          .from('impact_rounds')
          .select('id, pool_eur')
          .eq('status', 'active')
          .single()

        if (currentRound) {
          await supabase.from('impact_rounds').update({
            pool_eur: Number(currentRound.pool_eur) + impactEur
          }).eq('id', currentRound.id)

          const { error: impactEventErr } = await supabase.from('commerce_events').insert({
            event_type: 'impact_credited',
            order_id:   order.id,
            actor_type: 'system',
            payload:    { impact_eur: impactEur, round_id: currentRound.id, via_webhook: event.id }
          })
          if (impactEventErr) console.warn('[WEBHOOK] impact event insert failed:', impactEventErr.message)
        }
      }

      // Buyer-Bestätigung
      const { error: buyerNotifErr } = await supabase.from('notifications').insert({
        user_id: order.customer_id,
        type:    'order_confirmed',
        title:   'Unterstützung bestätigt ✓',
        body:    'Deine Zahlung war erfolgreich.',
        data:    { order_id: order.id },
        read:    false,
      })
      if (buyerNotifErr) console.warn('[NOTIF]', buyerNotifErr.message)
    }

    else if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as Stripe.PaymentIntent
      await supabase.from('orders')
        .update({ state: 'failed' })
        .eq('stripe_payment_intent', pi.id)
        .eq('state', 'pending')  // Status-Guard

      const { error: failedEventErr } = await supabase.from('commerce_events').insert({
        event_type: 'payment_failed',
        actor_type: 'webhook',
        payload:    { stripe_pi: pi.id, reason: (pi as any).last_payment_error?.message }
      })
      if (failedEventErr) console.warn('[WEBHOOK] payment_failed event insert failed:', failedEventErr.message)
    }

    else if (event.type === 'charge.dispute.created') {
      console.warn('[WEBHOOK] Dispute:', (event.data.object as any).id)
      // TODO: Sprint C4
    }

    // Event als erfolgreich markieren
    await supabase.from('webhook_events').update({ status: 'processed' })
      .eq('stripe_event_id', event.id)

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (e: any) {
    console.error('[WEBHOOK] Unhandled:', e?.message)
    return new Response(JSON.stringify({ error: e?.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
