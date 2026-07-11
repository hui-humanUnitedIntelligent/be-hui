import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    // Auth
    const authHeader = req.headers.get('Authorization')
    const { data: { user }, error: authErr } = await sb.auth.getUser(
      authHeader?.replace('Bearer ', '') ?? ''
    )
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { order_id, booking_id } = await req.json()
    if (!order_id && !booking_id) {
      return new Response(JSON.stringify({ error: 'order_id oder booking_id erforderlich' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. RPC: Buyer-Confirmation in DB
    const { data: confirmResult, error: confirmErr } = await sb.rpc('rpc_buyer_confirm_receipt', {
      p_order_id: order_id ?? null,
      p_booking_id: booking_id ?? null,
    })
    if (confirmErr || !confirmResult?.ok) {
      return new Response(JSON.stringify({ error: confirmResult?.error || confirmErr?.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Seller-Daten laden
    let sellerStripeAccountId: string | null = null
    let amountEur = 0
    let stripePaymentIntentId: string | null = null
    let stripeChargeId: string | null = null

    if (order_id) {
      const { data: order } = await sb.from('orders').select('*, stripe_payment_intent').eq('id', order_id).single()
      amountEur = order?.total_eur ?? 0
      stripePaymentIntentId = order?.stripe_payment_intent
      // Seller: aus order-Items den Creator ermitteln
      const { data: items } = await sb.from('order_items').select('work_id').eq('order_id', order_id).limit(1)
      if (items?.[0]?.work_id) {
        const { data: work } = await sb.from('works').select('user_id').eq('id', items[0].work_id).single()
        if (work?.user_id) {
          const { data: sellerProfile } = await sb.from('profiles').select('stripe_account_id').eq('id', work.user_id).single()
          sellerStripeAccountId = sellerProfile?.stripe_account_id ?? null
        }
      }
    }

    if (booking_id) {
      const { data: booking } = await sb.from('talent_bookings')
        .select('amount_eur, stripe_payment_intent, seller_id').eq('id', booking_id).single()
      amountEur = booking?.amount_eur ?? 0
      stripePaymentIntentId = booking?.stripe_payment_intent
      if (booking?.seller_id) {
        const { data: sellerProfile } = await sb.from('profiles').select('stripe_account_id').eq('id', booking.seller_id).single()
        sellerStripeAccountId = sellerProfile?.stripe_account_id ?? null
      }
    }

    // 3. Charge-ID aus Payment Intent holen (für Source Transaction)
    if (stripePaymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(stripePaymentIntentId)
      stripeChargeId = (pi.latest_charge as string) ?? null
    }

    // 4. Seller-Transfer (80% des Betrags)
    const SELLER_RATE = 0.80
    const transferAmountCents = Math.round(amountEur * SELLER_RATE * 100)
    let transferId: string | null = null

    if (sellerStripeAccountId && transferAmountCents > 0) {
      const transfer = await stripe.transfers.create({
        amount: transferAmountCents,
        currency: 'eur',
        destination: sellerStripeAccountId,
        source_transaction: stripeChargeId ?? undefined,
        metadata: {
          order_id: order_id ?? '',
          booking_id: booking_id ?? '',
          hui_release: 'buyer_confirmed',
          buyer_id: user.id,
        }
      })
      transferId = transfer.id
    } else {
      console.log('[ESCROW] Kein Stripe-Connect-Account für Seller — Transfer übersprungen, manuell nötig')
    }

    // 5. Transfer-ID in DB speichern
    if (order_id) {
      await sb.from('orders').update({
        seller_transfer_id: transferId,
        state: 'completed',
        updated_at: new Date().toISOString()
      }).eq('id', order_id)

      // rpc_process_order_fees auslösen falls noch nicht geschehen
      const { data: existingPool } = await sb.from('stripe_impact_pool').select('id').eq('order_id', order_id).maybeSingle()
      if (!existingPool) {
        await sb.rpc('rpc_process_order_fees', { p_order_id: order_id })
      }
    }

    if (booking_id) {
      await sb.from('talent_bookings').update({
        seller_transfer_id: transferId,
        status: 'completed',
        updated_at: new Date().toISOString()
      }).eq('id', booking_id)
    }

    return new Response(JSON.stringify({
      ok: true,
      transfer_id: transferId,
      transfer_amount_eur: transferAmountCents / 100,
      seller_has_stripe: !!sellerStripeAccountId,
      message: sellerStripeAccountId
        ? 'Bestätigt & Transfer ausgelöst'
        : 'Bestätigt — Seller hat kein Stripe Connect, Transfer manuell nötig'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('[confirm-and-transfer]', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
