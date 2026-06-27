// ═══════════════════════════════════════════════════════════════════
// LEGACY — SUPERSEDED BY COMMERCE 2.0 — REMOVE AFTER PHASE 5
// Kanonischer Payout: release-payout (orders/creator_payouts/creator_wallets)
// Diese Function: bookings/escrow Flow (Pre-Commerce 2.0)
// ═══════════════════════════════════════════════════════════════════
// FILE: supabase/functions/release-escrow/index.ts
// Server-side escrow release after recommendation
// Critical: never run client-side

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const authHeader = req.headers.get('Authorization')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') ?? ''
    )
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { booking_id, recommendation_text, rating } = await req.json()

    if (!booking_id) {
      return new Response(JSON.stringify({ error: 'booking_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate booking belongs to this user and is in correct state
    const { data: booking, error: bookErr } = await supabase
      .from('bookings')
      .select('id,user_id,wirker_id,amount,platform_fee,impact_fee,status,escrow_status,payment_status')
      .eq('id', booking_id)
      .single()

    if (bookErr || !booking) {
      return new Response(JSON.stringify({ error: 'Buchung nicht gefunden' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Only the buyer can release escrow
    if (booking.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Keine Berechtigung' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (booking.escrow_status !== 'held') {
      return new Response(JSON.stringify({
        error: `Escrow bereits freigegeben (Status: ${booking.escrow_status})`
      }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const now = new Date().toISOString()

    // Idempotency: check if recommendation already exists
    const { data: existingRec } = await supabase
      .from('recommendations')
      .select('id')
      .eq('booking_id', booking_id)
      .maybeSingle()

    if (!existingRec && recommendation_text) {
      // Get wirker name for recommendation
      const { data: wirkerProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()

      await supabase.from('recommendations').insert({
        wirker_id:     booking.wirker_id,
        reviewer_id:   user.id,
        reviewer_name: wirkerProfile?.display_name ?? 'Anonym',
        rating:        rating ?? 5,
        text:          recommendation_text,
        booking_id,
        created_at:    now,
      })
    }

    // Release escrow — update booking atomically
    const { data: updated, error: updateErr } = await supabase
      .from('bookings')
      .update({
        escrow_status:  'released',
        payment_status: 'paid',
        status:         'completed',
        updated_at:     now,
      })
      .eq('id', booking_id)
      .eq('escrow_status', 'held')  // optimistic lock
      .select('id,status,escrow_status,payment_status')
      .single()

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update wirker's impact_eur
    await supabase.rpc('increment_impact_pool', {
      p_wirker_id:  booking.wirker_id,
      p_amount_eur: Number(booking.impact_fee ?? 0),
    })

    // Create payout record for wirker
    const wirkerPayout = Number(booking.amount) - Number(booking.platform_fee ?? 0)
    if (wirkerPayout > 0) {
      await supabase.from('payouts').insert({
        user_id:     booking.wirker_id,
        amount_eur:  wirkerPayout,
        status:      'pending',
        booking_ids: [booking_id],
        initiated_at: now,
      })
    }

    return new Response(JSON.stringify({
      success: true,
      booking: updated,
      payout_created: wirkerPayout > 0,
      payout_amount_eur: wirkerPayout,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('[release-escrow]', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
