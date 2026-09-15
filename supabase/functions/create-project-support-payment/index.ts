// supabase/functions/create-project-support-payment/index.ts
// ═══════════════════════════════════════════════════════════════════
// PROJECT-DIRECT-SUPPORT-001 (2026-09-15) — Stripe PaymentIntent für
// "Herzensprojekt direkt unterstützen".
//
// Architektur bewusst 1:1 dem Muster von create-support-payment (Talent
// unterstützen) nachgebaut — Erweitern statt Neubau eines eigenen Stils
// (Architektur-Charta Prinzip 1+2). Unterschied: Ziel ist ein Projekt
// (impact_applications) statt ein Creator-Profil, Gebühren-Modell ist
// die reine Stripe-Standardgebühr (2,9% + 0,30€) statt der
// Platform-Fee/Ambassador-Aufteilung — das komplette Netto (nach reiner
// Stripe-Gebühr) fließt an das Projekt, es gibt hier keine Plattform-
// Provision (Michael-Spec: "Gelder gehen nach Stripe-Gebühr-Abzug direkt
// ans Projekt").
//
// Sicherheits-Korrektur gegenüber dem Ursprungsprompt: KEINE
// stripe.paymentIntents.create() im Client — läuft ausschließlich hier
// server-seitig mit dem echten STRIPE_SECRET_KEY. Der Client bekommt nur
// den clientSecret zurück (identisches Muster wie alle bestehenden
// Zahlungs-Flows).
// ═══════════════════════════════════════════════════════════════════
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=denonext'
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const MIN_AMOUNT_CENTS = 100     // 1,00 € Mindestbetrag
const MAX_AMOUNT_CENTS = 500000  // 5.000 € Maximalbetrag (identisch zu create-support-payment)

// Stripe-Standardgebühr EU-Karten: 2,9% + 0,30 € (Michael-Spec, exakt wie angegeben)
function calcStripeFee(grossEur: number) {
  const fee = +(grossEur * 0.029 + 0.30).toFixed(2)
  const net = +(grossEur - fee).toFixed(2)
  return { fee, net }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const _rl = await checkRateLimit(req, "project-support-payment", 5, 60);
  if (!_rl.allowed) return rateLimitResponse(_rl.resetAt);

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

    const { project_id, amount_eur } = await req.json()

    if (!project_id) {
      return new Response(JSON.stringify({ error: 'project_id erforderlich' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const amount = Number(amount_eur)
    if (!amount || amount < 1) {
      return new Response(JSON.stringify({ error: 'Mindestbetrag 1,00 €' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const amountCents = Math.round(amount * 100)
    if (amountCents > MAX_AMOUNT_CENTS) {
      return new Response(JSON.stringify({ error: 'Maximalbetrag 5.000 €' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Projekt muss genehmigt + nicht abgeschlossen sein (gleicher Schutz wie die RPC)
    const { data: project, error: projectErr } = await supabase
      .from('impact_applications')
      .select('id, project_name, status, is_completed')
      .eq('id', project_id).single()
    if (projectErr || !project) {
      return new Response(JSON.stringify({ error: 'Projekt nicht gefunden' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (project.status !== 'approved' || project.is_completed) {
      return new Response(JSON.stringify({ error: 'Dieses Projekt kann aktuell nicht direkt unterstützt werden' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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

    const { fee, net } = calcStripeFee(amount)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      customer: stripeCustomerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        user_id: user.id,
        project_id: project_id,
        payment_type: 'project_direct_support',
        amount_eur: amount.toFixed(2),
        net_amount_eur: net.toFixed(2),
      },
      description: `HUI Direkt-Unterstützung für Projekt „${project.project_name || 'Herzensprojekt'}"`,
    })

    const { error: insertErr } = await supabase.from('project_direct_supports').insert({
      project_id: project_id,
      supporter_user_id: user.id,
      gross_amount_eur: amount.toFixed(2),
      stripe_fee_eur: fee.toFixed(2),
      net_amount_eur: net.toFixed(2),
      stripe_payment_id: paymentIntent.id,
      status: 'pending',
    })
    if (insertErr) {
      // Rollback: Payment Intent stornieren, wenn die Audit-Zeile nicht angelegt werden konnte
      await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => {})
      console.error('[create-project-support-payment] insert failed:', insertErr.message)
      return new Response(JSON.stringify({ error: 'Konnte Unterstützung nicht vorbereiten' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret,
      publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY') || null,
      paymentIntentId: paymentIntent.id,
      amountEur: amount,
      feeEur: fee,
      netEur: net,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('[create-project-support-payment] error:', err)
    return new Response(JSON.stringify({ error: 'Interner Fehler', detail: String(err) }), {
      status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
    })
  }
})
