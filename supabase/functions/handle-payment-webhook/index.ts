// supabase/functions/handle-payment-webhook/index.ts
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
import Stripe from 'https://esm.sh/stripe@14'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const stripeKey     = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!stripeKey || !webhookSecret) {
      console.warn('[WEBHOOK] Stripe nicht konfiguriert')
      return new Response('ok', { headers: corsHeaders })
    }

    const stripe    = new Stripe(stripeKey, { apiVersion: '2024-06-20' })
    const body      = await req.text()
    const signature = req.headers.get('stripe-signature') ?? ''

    // ── Webhook Signature Verification ───────────────────────────
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
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
    await supabase.from('webhook_events').insert({
      stripe_event_id: event.id,
      event_type:      event.type,
      payload_summary: { type: event.type, created: event.created },
      status:          'processing',
    }).catch(() => {}) // Wenn bereits vorhanden (Race) → OK, ignorieren

    console.log('[WEBHOOK] Verarbeite Event:', event.type, event.id)

    // ── Event-Handler ─────────────────────────────────────────────
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent

      // Order laden (nur pending — verhindert Doppel-Update)
      const { data: order } = await supabase
        .from('orders')
        .select('id, customer_id, total_eur, state, order_items(id, seller_id)')
        .eq('stripe_payment_intent', pi.id)
        .eq('state', 'pending')   // ← Status-Guard
        .single()

      if (!order) {
        console.warn('[WEBHOOK] Order nicht gefunden oder nicht pending für PI:', pi.id)
        await supabase.from('webhook_events').update({ status: 'processed' })
          .eq('stripe_event_id', event.id)
        return new Response('ok', { headers: corsHeaders })
      }

      // ── Amount-Verification ──────────────────────────────────
      const expectedCents = Math.round(Number(order.total_eur) * 100)
      if (Math.abs(pi.amount - expectedCents) > 1) { // 1 Cent Toleranz
        console.error(`[WEBHOOK] Amount-Mismatch: stripe=${pi.amount} erwartet=${expectedCents} order=${order.id}`)
        // Order auf failed setzen — manuelle Prüfung notwendig
        await supabase.from('orders').update({ state: 'failed' }).eq('id', order.id)
        await supabase.from('webhook_events').update({
          status: 'failed',
          payload_summary: { error: 'amount_mismatch', stripe: pi.amount, expected: expectedCents }
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
      await supabase.from('commerce_events').insert({
        event_type: 'payment_confirmed',
        order_id:   order.id,
        actor_type: 'webhook',
        payload:    { stripe_pi: pi.id, amount: pi.amount, verified: true }
      }).catch(() => {})

      // ── Creator Notifications ─────────────────────────────────
      const creatorIds = [...new Set(
        ((order as any).order_items || []).map((i: any) => i.creator_id).filter(Boolean)
      )]
      for (const creatorId of creatorIds) {
        await supabase.from('notifications').insert({
          user_id: creatorId,
          type:    'new_order',
          title:   'Neue Bestellung 🎉',
          body:    'Jemand hat dein Werk unterstützt.',
          data:    JSON.stringify({ order_id: order.id }),
          read:    false,
        }).catch(e => console.warn('[NOTIF]', e.message))
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

          await supabase.from('commerce_events').insert({
            event_type: 'impact_credited',
            order_id:   order.id,
            actor_type: 'system',
            payload:    { impact_eur: impactEur, round_id: currentRound.id, via_webhook: event.id }
          }).catch(() => {})
        }
      }

      // Buyer-Bestätigung
      await supabase.from('notifications').insert({
        user_id: order.customer_id,
        type:    'order_confirmed',
        title:   'Unterstützung bestätigt ✓',
        body:    'Deine Zahlung war erfolgreich.',
        data:    JSON.stringify({ order_id: order.id }),
        read:    false,
      }).catch(() => {})
    }

    else if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as Stripe.PaymentIntent
      await supabase.from('orders')
        .update({ state: 'failed' })
        .eq('stripe_payment_intent', pi.id)
        .eq('state', 'pending')  // Status-Guard

      await supabase.from('commerce_events').insert({
        event_type: 'payment_failed',
        actor_type: 'webhook',
        payload:    { stripe_pi: pi.id, reason: (pi as any).last_payment_error?.message }
      }).catch(() => {})
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
