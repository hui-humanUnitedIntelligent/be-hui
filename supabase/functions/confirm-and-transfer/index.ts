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
    // FIX (2026-08-16, DUPLICATE-NOTIF-BUG + BROKEN-TRANSFER-BUG):
    //   a) Die RPC gibt das Feld 'success' zurueck, nicht 'ok'. Der alte Check
    //      `!confirmResult?.ok` war IMMER true (Feld existierte nie) -> diese
    //      Funktion brach hier IMMER mit 400 ab, BEVOR der Stripe-Transfer an
    //      den Verkaeufer ueberhaupt ausgeloest wurde. Das Geld blieb bei jedem
    //      einzigen Verkauf in Escrow haengen ("Zahlung offen" beim Verkaeufer),
    //      obwohl der Kaeufer den Erhalt bereits bestaetigt hatte.
    //   b) Die RPC ist jetzt idempotent (siehe Migration 2026-08-16) und liefert
    //      bei einem wiederholten Aufruf `skipped:true` zurueck. Bei Doppelklick/
    //      Netzwerk-Retry duerfen Transfer + Notification NICHT erneut ausgeloest
    //      werden -- sonst doppelte Stripe-Transfers + doppelte Resonanzzentrum-
    //      Nachrichten (genau das gemeldete Symptom).
    const { data: confirmResult, error: confirmErr } = await sb.rpc('rpc_buyer_confirm_receipt', {
      p_order_id: order_id ?? null,
      p_booking_id: booking_id ?? null,
    })
    if (confirmErr || !confirmResult?.success) {
      return new Response(JSON.stringify({ error: confirmResult?.error || confirmErr?.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (confirmResult.skipped) {
      // Bereits vorher bestaetigt (Doppelklick/Retry) -- rein idempotente Antwort,
      // OHNE erneuten Transfer, OHNE erneute Fee-Verarbeitung, OHNE Notification.
      return new Response(JSON.stringify({
        ok: true, skipped: true, message: 'Bereits bestätigt — keine erneute Verarbeitung.'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 2. Seller-Daten laden
    let sellerId: string | null = null
    let sellerStripeAccountId: string | null = null
    let amountEur = 0
    let stripePaymentIntentId: string | null = null
    let stripeChargeId: string | null = null

    if (order_id) {
      const { data: order } = await sb.from('orders').select('*, stripe_payment_intent').eq('id', order_id).single()
      amountEur = order?.total_eur ?? 0
      stripePaymentIntentId = order?.stripe_payment_intent
      // Seller: aus order-Items den Creator ermitteln
      const { data: items } = await sb.from('order_items').select('work_id, seller_id').eq('order_id', order_id).limit(1)
      sellerId = items?.[0]?.seller_id ?? null
      if (!sellerId && items?.[0]?.work_id) {
        const { data: work } = await sb.from('works').select('user_id').eq('id', items[0].work_id).single()
        sellerId = work?.user_id ?? null
      }
      if (sellerId) {
        const { data: sellerProfile } = await sb.from('profiles').select('stripe_account_id').eq('id', sellerId).single()
        sellerStripeAccountId = sellerProfile?.stripe_account_id ?? null
      }
    }

    if (booking_id) {
      const { data: booking } = await sb.from('talent_bookings')
        .select('amount_eur, stripe_payment_intent, seller_id').eq('id', booking_id).single()
      amountEur = booking?.amount_eur ?? 0
      stripePaymentIntentId = booking?.stripe_payment_intent
      sellerId = booking?.seller_id ?? null
      if (sellerId) {
        const { data: sellerProfile } = await sb.from('profiles').select('stripe_account_id').eq('id', sellerId).single()
        sellerStripeAccountId = sellerProfile?.stripe_account_id ?? null
      }
    }

    // 3. Charge-ID aus Payment Intent holen (für Source Transaction)
    if (stripePaymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(stripePaymentIntentId)
      stripeChargeId = (pi.latest_charge as string) ?? null
    }

    // 4. Seller-Transfer (80% des Betrags)
    // FIX (2026-08-16): Stripe-Idempotency-Key ergaenzt (order_id/booking_id-basiert).
    // Selbst wenn dieser Request durch ein Netzwerk-Retry oder einen theoretisch
    // doch durchgekommenen Doppelklick zweimal bei Stripe ankommt, verhindert
    // Stripe selbst serverseitig einen zweiten echten Transfer.
    const SELLER_RATE = 0.80
    const transferAmountCents = Math.round(amountEur * SELLER_RATE * 100)
    let transferId: string | null = null
    const idempotencyKey = `hui-transfer-${order_id ?? booking_id}`

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
      }, { idempotencyKey })
      transferId = transfer.id
    } else {
      console.log('[ESCROW] Kein Stripe-Connect-Account für Seller — Transfer übersprungen, manuell nötig')
    }

    // 5. Transfer-ID in DB speichern + Fee-Processing (Impact-Pool/Ambassador) auslösen
    // ESCROW-FEE-TIMING-FIX (2026-08-16): rpc_process_order_fees / rpc_process_talent_booking_fees
    // laufen jetzt AUSSCHLIESSLICH hier -- also erst NACHDEM der Kaeufer den Erhalt
    // bestaetigt hat, nicht mehr sofort bei Zahlungseingang (vorher: handle-payment-webhook).
    // Beide RPCs sind idempotent (Check gegen stripe_impact_pool.order_id).
    let feeResult: any = null
    if (order_id) {
      await sb.from('orders').update({
        seller_transfer_id: transferId,
        state: 'completed',
        updated_at: new Date().toISOString()
      }).eq('id', order_id)

      const { data: existingPool } = await sb.from('stripe_impact_pool').select('id').eq('order_id', order_id).maybeSingle()
      if (!existingPool) {
        const { data: fr, error: feeErr } = await sb.rpc('rpc_process_order_fees', { p_order_id: order_id })
        feeResult = fr
        if (feeErr) console.error('[ESCROW] rpc_process_order_fees failed:', feeErr.message)
        else {
          await sb.from('commerce_events').insert({
            event_type: 'impact_credited', order_id, actor_type: 'system',
            payload: { ...fr, via: 'confirm-and-transfer' }
          })
        }
      }
    }

    if (booking_id) {
      await sb.from('talent_bookings').update({
        seller_transfer_id: transferId,
        status: 'completed',
        updated_at: new Date().toISOString()
      }).eq('id', booking_id)

      const { data: existingPool } = await sb.from('stripe_impact_pool')
        .select('id').eq('order_id', booking_id).eq('source', 'talent_booking').maybeSingle()
      if (!existingPool) {
        const { data: fr, error: feeErr } = await sb.rpc('rpc_process_talent_booking_fees', { p_booking_id: booking_id })
        feeResult = fr
        if (feeErr) console.error('[ESCROW] rpc_process_talent_booking_fees failed:', feeErr.message)
      }
    }

    // impact_rounds additiv fuer die bestehende ImpactPage/Voting-UI speisen
    const impactEur = feeResult?.ok ? Number(feeResult.impact_eur) : 0
    if (impactEur > 0) {
      const { data: roundRows } = await sb
        .from('impact_rounds')
        .select('id, pool_eur')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
      const currentRound = roundRows?.[0]
      if (currentRound) {
        await sb.from('impact_rounds').update({
          pool_eur: Number(currentRound.pool_eur) + impactEur
        }).eq('id', currentRound.id)
      }
    }

    // 6. EXAKT EINE Notification an den Verkäufer — nicht mehr client-seitig
    // (siehe FinanzuebersichtModal.jsx), damit sie garantiert nur einmal
    // ausgeloest wird, egal was das Frontend danach tut (Reload, Netzwerkfehler etc.).
    // Der partial-unique-index auf notifications(user_id,type,entity_id) ist das
    // letzte Sicherheitsnetz, falls dieser Codepfad doch doppelt erreicht wird.
    if (sellerId) {
      const entityId = order_id ?? booking_id
      const { error: notifErr } = await sb.from('notifications').insert({
        user_id: sellerId,
        type: 'buyer_confirmed',
        title: 'Zahlung freigegeben ✓',
        body: 'Der Käufer hat den Erhalt bestätigt. Die Auszahlung wurde freigegeben.',
        is_read: false, read: false,
        actor_id: user.id,
        entity_id: entityId,
        entity_type: order_id ? 'order' : 'talent_booking',
      })
      // 23505 = unique_violation (bereits vorhanden) -- erwartet & unkritisch, kein Fehler-Log
      if (notifErr && notifErr.code !== '23505') console.warn('[ESCROW] seller notify failed:', notifErr.message)
    }

    return new Response(JSON.stringify({
      ok: true,
      skipped: false,
      transfer_id: transferId,
      transfer_amount_eur: transferAmountCents / 100,
      seller_has_stripe: !!sellerStripeAccountId,
      fee_processed: !!feeResult?.ok,
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
