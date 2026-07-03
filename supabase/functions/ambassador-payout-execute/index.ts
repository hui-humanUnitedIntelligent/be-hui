// supabase/functions/ambassador-payout-execute/index.ts
// AMB-PAYOUT-009 — Admin startet die tatsaechliche Stripe-Auszahlung
// ═══════════════════════════════════════════════════════════════════
// Wird vom Admin-Dashboard aufgerufen, NACHDEM eine Anfrage genehmigt
// wurde (status='approved'). Fuehrt den echten Stripe Connect Transfer aus.
//
// Ablauf:
//   1. Auth pruefen (Admin/Superadmin/Employee)
//   2. Payout-Request laden, muss status='approved' sein
//   3. Ambassador-Stripe-Account laden (profiles.stripe_account_id)
//   4. stripe.transfers.create(...) an den Connected Account
//   5. Bei Erfolg: rpc_mark_commissions_paid + stripe_payout_id/processed_at setzen
//   6. Bei Fehler: rpc_fail_payout (bestehende RPC, setzt Provisionen zurueck)
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
    const authHeader = req.headers.get('Authorization')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') ?? ''
    )
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: adminProfile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (!adminProfile || !['superadmin', 'admin', 'employee'].includes(adminProfile.role)) {
      return new Response(JSON.stringify({ error: 'admin_only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { payout_id } = await req.json()
    if (!payout_id) {
      return new Response(JSON.stringify({ error: 'payout_id_required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: payout, error: payoutErr } = await supabase
      .from('stripe_payouts')
      .select('id, ambassador_id, amount, currency, status, payout_type')
      .eq('id', payout_id)
      .single()

    if (payoutErr || !payout) {
      return new Response(JSON.stringify({ error: 'payout_not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (payout.status !== 'approved') {
      return new Response(JSON.stringify({ error: 'invalid_state', current_status: payout.status }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: ambProfile } = await supabase
      .from('profiles').select('stripe_account_id, stripe_connect_status')
      .eq('id', payout.ambassador_id).single()

    if (!ambProfile?.stripe_account_id) {
      return new Response(JSON.stringify({ error: 'ambassador_not_connected' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'stripe_not_configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })

    try {
      const transfer = await stripe.transfers.create({
        amount: payout.amount, // bereits in Cent gespeichert
        currency: payout.currency || 'eur',
        destination: ambProfile.stripe_account_id,
        metadata: { payout_id, ambassador_id: payout.ambassador_id, source: 'hui_ambassador_payout' },
      })

      await supabase.from('stripe_payouts').update({
        status: 'paid',
        stripe_payout_id: transfer.id,
        processed_at: new Date().toISOString(),
      }).eq('id', payout_id)

      await supabase.rpc('rpc_mark_commissions_paid', { p_payout_id: payout_id })

      // Ambassador Connect-Status auf 'connected' festigen (falls noch nicht geschehen)
      if (ambProfile.stripe_connect_status !== 'connected') {
        await supabase.from('profiles').update({ stripe_connect_status: 'connected' })
          .eq('id', payout.ambassador_id)
      }

      return new Response(JSON.stringify({
        ok: true, payout_id, stripe_transfer_id: transfer.id, status: 'paid',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (stripeErr) {
      console.error('[AMBASSADOR_PAYOUT_EXECUTE] Stripe-Fehler:', stripeErr?.message)
      await supabase.rpc('rpc_fail_payout', {
        p_payout_id: payout_id,
        p_reason: stripeErr?.message?.slice(0, 500) || 'stripe_transfer_failed',
      })
      return new Response(JSON.stringify({ ok: false, error: stripeErr?.message }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (e) {
    console.error('[AMBASSADOR_PAYOUT_EXECUTE]', e?.message)
    return new Response(JSON.stringify({ error: e?.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
