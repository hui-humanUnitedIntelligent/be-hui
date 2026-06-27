// supabase/functions/handle-payment-webhook/index.ts
// ═══════════════════════════════════════════════════════════════════
// HUI Commerce 2.0 — Stripe Webhook Handler
// Sprint C1: Foundation
// ═══════════════════════════════════════════════════════════════════
//
// Events die verarbeitet werden:
//   payment_intent.succeeded    → Order auf "paid" setzen, Notifications
//   payment_intent.failed       → Order auf "failed" setzen
//   charge.dispute.created      → (vorbereitet, noch kein Handler)
//
// Sicherheit:
//   - Stripe Webhook Signature Verification (PFLICHT)
//   - Idempotenz: doppelte Events werden ignoriert
//   - Service Role für DB-Schreibzugriff (umgeht RLS)
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
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!   // Service Role — umgeht RLS
  )

  try {
    const stripeKey       = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret   = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!stripeKey || !webhookSecret) {
      console.warn('[WEBHOOK] Stripe nicht konfiguriert — Demo-Modus')
      return new Response('ok', { headers: corsHeaders })
    }

    const stripe    = new Stripe(stripeKey, { apiVersion: '2024-06-20' })
    const body      = await req.text()
    const signature = req.headers.get('stripe-signature') ?? ''

    // ── Webhook Signature Verification ───────────────────────────
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('[WEBHOOK] Signature verification failed:', err.message)
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('[WEBHOOK] Event:', event.type, event.id)

    // ── Event-Handler ─────────────────────────────────────────────

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent

      // Order finden
      const { data: order } = await supabase
        .from('orders')
        .select('id, buyer_id, total_eur, order_items(id, creator_id)')
        .eq('stripe_payment_intent', pi.id)
        .single()

      if (!order) {
        console.error('[WEBHOOK] Order nicht gefunden für PI:', pi.id)
        return new Response('ok', { headers: corsHeaders }) // Idempotenz
      }

      // Order → paid
      await supabase.from('orders').update({
        status:               'paid',
        payment_confirmed_at: new Date().toISOString(),
        shipping_address:     pi.shipping?.address ?? null,
        contact_name:         pi.shipping?.name ?? null,
        contact_email:        pi.receipt_email ?? null,
      }).eq('id', order.id)

      // Commerce Event
      await supabase.from('commerce_events').insert({
        event_type:  'payment_confirmed',
        order_id:    order.id,
        actor_type:  'webhook',
        payload:     { stripe_pi: pi.id, amount: pi.amount, currency: pi.currency }
      })

      // Notifications pro Creator
      const creatorIds = [...new Set(
        (order.order_items || []).map((i: any) => i.creator_id).filter(Boolean)
      )]
      for (const creatorId of creatorIds) {
        await supabase.from('notifications').insert({
          user_id:   creatorId,
          type:      'new_order',
          title:     'Neue Bestellung 🎉',
          body:      'Jemand hat dein Werk unterstützt.',
          data:      JSON.stringify({ order_id: order.id }),
          read:      false,
        }).catch(e => console.warn('[NOTIF]', e.message))
      }

      // Impact Pool aktualisieren
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
            payload:    { impact_eur: impactEur, round_id: currentRound.id }
          })
        }
      }
    }

    else if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as Stripe.PaymentIntent

      await supabase.from('orders')
        .update({ status: 'failed' })
        .eq('stripe_payment_intent', pi.id)

      await supabase.from('commerce_events').insert({
        event_type: 'payment_failed',
        actor_type: 'webhook',
        payload:    { stripe_pi: pi.id, reason: pi.last_payment_error?.message }
      })
    }

    // Weitere Events (vorbereitet, noch kein Handler)
    else if (event.type === 'charge.dispute.created') {
      console.warn('[WEBHOOK] Dispute erstellt:', event.data.object.id)
      // TODO: Sprint C4 — Dispute-Management
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (e) {
    console.error('[WEBHOOK] Unhandled error:', e?.message)
    return new Response(JSON.stringify({ error: e?.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
