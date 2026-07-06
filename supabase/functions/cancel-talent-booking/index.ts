// supabase/functions/cancel-talent-booking/index.ts
// ═══════════════════════════════════════════════════════════════════
// TALENT-BOOKING-REFUND-004 — Stornierung + automatischer Stripe-Refund
//
// Ablauf:
//   1. rpc_cancel_talent_booking() storniert serverseitig (Auth-Check,
//      Status-Guards bleiben dort die alleinige Quelle der Wahrheit).
//   2. War die Buchung bereits bezahlt (status war 'confirmed' +
//      stripe_payment_intent vorhanden) -> Stripe-Refund ausloesen.
//   3. Das bestehende charge.refunded-Webhook (hui-admin-dashboard)
//      uebernimmt automatisch die Buchhaltung (rpc_record_refund:
//      stripe_payments-Status, Impact-Pool-Ruecksbuchung, Ambassador-
//      Provisions-Reset) -- hier KEINE doppelte Logik noetig.
//   4. Schlaegt der Stripe-Refund fehl: Buchung bleibt trotzdem storniert
//      (Platz ist frei), aber die Antwort meldet refund_ok:false, damit
//      das Frontend den Nutzer auf manuellen Support hinweisen kann.
// ═══════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=denonext'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    const jwt = authHeader?.replace('Bearer ', '') ?? ''

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt)
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const bookingId = body.booking_id as string
    if (!bookingId) {
      return new Response(JSON.stringify({ error: 'booking_id erforderlich' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Stornierung -- Auth/Status-Logik bleibt exklusiv in der RPC ──
    const supabaseAsUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    )
    const { data: cancelResult, error: cancelErr } = await supabaseAsUser.rpc('rpc_cancel_talent_booking', {
      p_booking_id: bookingId,
    })

    if (cancelErr) {
      console.error('[CANCEL-TALENT-BOOKING] rpc error:', cancelErr.message)
      return new Response(JSON.stringify({ error: 'Stornierung fehlgeschlagen' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (!cancelResult?.ok) {
      return new Response(JSON.stringify({ error: cancelResult?.error || 'Stornierung nicht möglich', code: cancelResult?.error }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Bereits vorher storniert oder nie bezahlt -> kein Refund noetig
    if (cancelResult.already_cancelled || !cancelResult.was_paid || !cancelResult.stripe_payment_intent) {
      return new Response(JSON.stringify({ ok: true, cancelled: true, refund_applicable: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Automatischer Stripe-Refund ──────────────────────────────
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      console.error('[CANCEL-TALENT-BOOKING] STRIPE_SECRET_KEY fehlt -- Refund konnte nicht ausgeloest werden')
      return new Response(JSON.stringify({
        ok: true, cancelled: true, refund_applicable: true, refund_ok: false,
        refund_error: 'Zahlungsanbieter nicht konfiguriert -- bitte Support kontaktieren',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })
    try {
      const refund = await stripe.refunds.create({
        payment_intent: cancelResult.stripe_payment_intent,
        reason: 'requested_by_customer',
      })

      return new Response(JSON.stringify({
        ok: true, cancelled: true, refund_applicable: true, refund_ok: true,
        refund_id: refund.id, amount_eur: cancelResult.amount_eur,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    } catch (stripeErr: any) {
      console.error('[CANCEL-TALENT-BOOKING] Stripe refund error:', stripeErr.message)
      // Buchung bleibt storniert (Platz ist frei) -- Refund muss manuell nachgeholt werden
      return new Response(JSON.stringify({
        ok: true, cancelled: true, refund_applicable: true, refund_ok: false,
        refund_error: stripeErr.message || 'Rückerstattung fehlgeschlagen -- bitte Support kontaktieren',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

  } catch (e: any) {
    console.error('[CANCEL-TALENT-BOOKING] Unhandled:', e?.message)
    return new Response(JSON.stringify({ error: e?.message || 'Interner Fehler' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
