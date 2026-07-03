// supabase/functions/ambassador-stripe-connect/index.ts
// AMB-PAYOUT-009 — Stripe Connect Express Onboarding fuer Ambassadors
// ═══════════════════════════════════════════════════════════════════
// Ablauf:
//   1. Auth pruefen (Ambassador selbst, nur eigenes Konto)
//   2. Falls noch kein stripe_account_id vorhanden: Express-Account anlegen
//   3. Account Link (hosted onboarding) erzeugen und URL zurueckgeben
//   4. profiles.stripe_connect_status auf 'onboarding' setzen
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

    const { ambassador_id } = await req.json()

    // Nur eigenes Konto -- kein Fremdzugriff (DSGVO/Sicherheit)
    if (!ambassador_id || ambassador_id !== user.id) {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('id, email, stripe_account_id, role, ambassador_status')
      .eq('id', ambassador_id)
      .single()

    if (profErr || !profile) {
      return new Response(JSON.stringify({ error: 'profile_not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (profile.role !== 'ambassador' || profile.ambassador_status !== 'confirmed') {
      return new Response(JSON.stringify({ error: 'not_an_ambassador' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'stripe_not_configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })

    let accountId = profile.stripe_account_id

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'AT',
        email: profile.email || undefined,
        capabilities: { transfers: { requested: true } },
        business_type: 'individual',
        metadata: { ambassador_id, source: 'hui_ambassador_payout' },
      })
      accountId = account.id
      await supabase.from('profiles').update({
        stripe_account_id: accountId,
        stripe_connect_status: 'onboarding',
      }).eq('id', ambassador_id)
    }

    const origin = req.headers.get('origin') || 'https://www.be-hui.com'
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/?stripe_connect=refresh`,
      return_url: `${origin}/?stripe_connect=success`,
      type: 'account_onboarding',
    })

    return new Response(JSON.stringify({ ok: true, url: accountLink.url, account_id: accountId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (e) {
    console.error('[AMBASSADOR_STRIPE_CONNECT]', e?.message)
    return new Response(JSON.stringify({ error: e?.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
