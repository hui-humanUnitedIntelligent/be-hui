// supabase/functions/create-support-payment/index.ts
// HUI Support Payment — Stripe PaymentIntent für "Talent unterstützen"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=denonext'
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PLATFORM_FEE_RATE = 0.15
const CREATOR_SHARE     = 0.85
const IMPACT_RATE       = 0.0225
const MIN_AMOUNT_CENTS  = 50
const MAX_AMOUNT_CENTS  = 500000

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: 'Stripe nicht konfiguriert', code: 'STRIPE_NOT_CONFIGURED' }), {
      status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const authHeader = req.headers.get('Authorization')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader?.replace('Bearer ', '') ?? '')
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { creator_id, amount_eur, message } = await req.json()

    if (!creator_id) {
      return new Response(JSON.stringify({ error: 'creator_id erforderlich' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (creator_id === user.id) {
      return new Response(JSON.stringify({ error: 'Du kannst dich nicht selbst unterstützen' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const amount = Number(amount_eur)
    if (!amount || amount < 0.50) {
      return new Response(JSON.stringify({ error: 'Mindestbetrag 0,50 €' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const amountCents = Math.round(amount * 100)
    if (amountCents > MAX_AMOUNT_CENTS) {
      return new Response(JSON.stringify({ error: 'Maximalbetrag 5.000 €' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: creator, error: creatorErr } = await supabase
      .from('profiles').select('id, display_name, username').eq('id', creator_id).single()
    if (creatorErr || !creator) {
      return new Response(JSON.stringify({ error: 'Creator nicht gefunden' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: existingCustomer } = await supabase
      .from('stripe_customers').select('stripe_customer_id').eq('user_id', user.id).maybeSingle()

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })
    let stripeCustomerId = existingCustomer?.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ metadata: { user_id: user.id } })
      stripeCustomerId = customer.id
      await supabase.from('stripe_customers').upsert({ user_id: user.id, stripe_customer_id: stripeCustomerId })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      customer: stripeCustomerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        user_id: user.id,
        creator_id: creator_id,
        payment_type: 'support',
        amount_eur: amount.toFixed(2),
        ...(message ? { support_message: message.slice(0, 500) } : {}),
      },
      description: `HUI Unterstützung für ${creator.display_name || creator.username || 'Creator'}`,
    })

    const commissionEur = +(amount * PLATFORM_FEE_RATE).toFixed(2)
    const impactEur     = +(amount * IMPACT_RATE).toFixed(2)
    const creatorShare  = +(amount * CREATOR_SHARE).toFixed(2)

    await supabase.from('stripe_payments').insert({
      user_id: user.id,
      stripe_payment_id: paymentIntent.id,
      stripe_customer_id: stripeCustomerId,
      amount: amount.toFixed(2),
      currency: 'eur',
      status: 'pending',
      payment_type: 'support',
      description: `Unterstützung für ${creator.display_name || creator.username || 'Creator'}`,
      ambassador_id: creator_id,
      impact_pool_share: impactEur.toFixed(2),
      ambassador_share: creatorShare.toFixed(2),
      metadata: { creator_id, amount_eur: amount, message: message || null, commission_eur: commissionEur, impact_eur: impactEur, creator_share_eur: creatorShare },
    })

    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret,
      publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY') || null,
      paymentIntentId: paymentIntent.id,
      amountEur: amount,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('[SUPPORT-PAYMENT] Error:', err.message)
    return new Response(JSON.stringify({ error: err.message || 'Interner Fehler' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

  // ── Rate Limiting (SCALE-006) ──
  const _rl = await checkRateLimit(req, "support-payment", 5, 60);
  if (!_rl.allowed) return rateLimitResponse(_rl.resetAt);
