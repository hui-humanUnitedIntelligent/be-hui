// supabase/functions/release-payout/index.ts
// ═══════════════════════════════════════════════════════════════════
// HUI Commerce 2.0 — Creator Payout Release
// Sprint C1: Foundation (Stripe Connect noch nicht aktiv)
// ═══════════════════════════════════════════════════════════════════
//
// Wann wird das aufgerufen?
//   - Manuell durch HUI Admin nach Fulfillment-Verifizierung
//   - Automatisch nach konfigurierbarer Rückgabefrist (COMMERCE_CONFIG.PAYOUT_DELAY_DAYS)
//   - Erweiterung des bestehenden release-escrow Patterns
//
// Ablauf:
//   1. Auth prüfen (Admin oder System)
//   2. Order Items auf payout_status=held prüfen
//   3. Stripe Connect Transfer erstellen (wenn konfiguriert)
//   4. payout_status → released / paid
//   5. creator_payouts Eintrag erstellen
//   6. Creator Wallet aktualisieren
//   7. Commerce Event loggen
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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    // ── Auth: Admin oder System ───────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') ?? ''
    )
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Admin-Check
    const { data: profile } = await supabase
      .from('profiles').select('membership_type').eq('id', user.id).single()
    if (profile?.membership_type !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { order_item_ids, creator_id } = await req.json()

    if (!order_item_ids?.length || !creator_id) {
      return new Response(JSON.stringify({ error: 'order_item_ids und creator_id erforderlich' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Order Items laden ─────────────────────────────────────────
    const { data: items } = await supabase
      .from('order_items')
      .select('id, payout_eur, payout_status, order_id')
      .in('id', order_item_ids)
      .eq('seller_id', creator_id)
      .eq('payout_status', 'held')

    if (!items?.length) {
      return new Response(JSON.stringify({ error: 'Keine freizugebenden Items gefunden' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const totalPayout = items.reduce((s, i) => s + Number(i.payout_eur || 0), 0)

    // ── Stripe Connect Transfer (wenn konfiguriert) ───────────────
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    let stripeTransferId = null

    if (stripeKey && totalPayout > 0) {
      // Creator Stripe Account ID aus creator_wallets laden
      const { data: wallet } = await supabase
        .from('creator_wallets')
        .select('stripe_account_id')
        .eq('user_id', creator_id)
        .single()

      if (wallet?.stripe_account_id) {
        const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })
        try {
          const transfer = await stripe.transfers.create({
            amount:      Math.round(totalPayout * 100),
            currency:    'eur',
            destination: wallet.stripe_account_id,
            metadata:    {
              creator_id,
              item_count: items.length.toString(),
              source:     'hui_commerce_v2'
            }
          })
          stripeTransferId = transfer.id
        } catch (stripeErr) {
          console.error('[PAYOUT] Stripe Transfer fehlgeschlagen:', stripeErr.message)
          // Nicht abbrechen — manuelle Auszahlung als Fallback
        }
      }
    }

    // ── Order Items aktualisieren ─────────────────────────────────
    const payoutStatusNew = stripeTransferId ? 'paid' : 'released'
    await supabase.from('order_items')
      .update({
        payout_status:      payoutStatusNew,
        payout_released_at: new Date().toISOString(),
        payout_paid_at:     stripeTransferId ? new Date().toISOString() : null,
        stripe_transfer_id: stripeTransferId,
      })
      .in('id', order_item_ids)

    // ── creator_payouts Eintrag ───────────────────────────────────
    const { data: payoutRecord } = await supabase
      .from('creator_payouts')
      .insert({
        creator_id,
        order_item_ids,
        gross_eur:         totalPayout,
        platform_fee_eur:  0,           // bereits abgezogen in unit_price
        net_eur:           totalPayout,
        stripe_transfer_id: stripeTransferId,
        status:            payoutStatusNew,
        initiated_at:      new Date().toISOString(),
        paid_at:           stripeTransferId ? new Date().toISOString() : null,
      })
      .select('id')
      .single()

    // ── Creator Wallet aktualisieren ──────────────────────────────
    await supabase.rpc('increment_wallet_balance', {
      p_user_id: creator_id,
      p_amount:  totalPayout
    }).catch(e => console.warn('[WALLET] RPC error:', e.message))

    // ── Commerce Events ───────────────────────────────────────────
    for (const item of items) {
      await supabase.from('commerce_events').insert({
        event_type:    'payout_released',
        order_id:      item.order_id,
        order_item_id: item.id,
        payout_id:     payoutRecord?.id,
        actor_id:      user.id,
        actor_type:    'admin',
        payload:       { payout_eur: item.payout_eur, stripe_transfer: stripeTransferId }
      })
    }

    // Creator informieren
    await supabase.from('notifications').insert({
      user_id: creator_id,
      type:    'payout_released',
      title:   'Auszahlung freigegeben ✓',
      body:    `${totalPayout.toFixed(2).replace(".", ",")} € wurden freigegeben.`,
      data:    JSON.stringify({ payout_id: payoutRecord?.id }),
      read:    false,
    }).catch(() => {})

    return new Response(JSON.stringify({
      success:          true,
      payout_eur:       totalPayout,
      items_released:   items.length,
      stripe_transfer:  stripeTransferId,
      status:           payoutStatusNew,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})

  } catch (e) {
    console.error('[RELEASE_PAYOUT]', e?.message)
    return new Response(JSON.stringify({ error: e?.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
