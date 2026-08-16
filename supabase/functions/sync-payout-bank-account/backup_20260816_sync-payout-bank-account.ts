// supabase/functions/sync-payout-bank-account/index.ts
// BANKDATEN-002 (2026-08-16) — Bankdaten -> echter Stripe-Connect-Custom-Account
// ═══════════════════════════════════════════════════════════════════
// Bisher (AMB-BANK-PAYOUT-001, nur Ambassadors) wurden IBAN/Kontoinhaber nur
// verschluesselt in profiles.bank_*_enc gespeichert -- OHNE dass daraus je ein
// echter Stripe-Account wurde. confirm-and-transfer / ambassador-payout-execute
// brauchen aber profiles.stripe_account_id (ein Connect-Ziel), sonst passiert
// beim "Ware erhalten"-Klick GAR KEIN Transfer (stiller No-Op, siehe Kommentar
// dort). Diese Funktion schliesst die Luecke: sie nimmt die (serverseitig
// entschluesselten) Bankdaten und legt einen Stripe Connect "Custom"-Account an
// (oder aktualisiert das externe Bankkonto eines bestehenden), damit Stripe
// echte SEPA-Transfers an dieses Konto ausfuehren kann.
//
// Aufruf: vom Client NACH erfolgreichem rpc_save_ambassador_bank_details.
// ═══════════════════════════════════════════════════════════════════
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const authHeader = req.headers.get('Authorization')
    const { data: { user }, error: authErr } = await sb.auth.getUser(authHeader?.replace('Bearer ', '') ?? '')
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Entschluesselte Bankdaten nur ueber die service-role-only RPC laden
    // (Client selbst kriegt nie Klartext-IBAN zu Gesicht — bereits durch
    // rpc_get_ambassador_bank_status abgesichert, hier zusaetzlich fuer diesen Pfad).
    const { data: bankResult, error: bankErr } = await sb.rpc('rpc_get_decrypted_bank_details_for_stripe', { p_user_id: user.id })
    if (bankErr || !bankResult?.ok) {
      return new Response(JSON.stringify({ error: bankResult?.error || bankErr?.message || 'no_bank_details' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: profile } = await sb.from('profiles')
      .select('stripe_account_id, email').eq('id', user.id).single()

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'stripe_not_configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })

    const nameParts = String(bankResult.holder || '').trim().split(/\s+/)
    const firstName = nameParts[0] || 'Unbekannt'
    const lastName  = nameParts.slice(1).join(' ') || nameParts[0] || 'Unbekannt'
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0'

    let accountId = profile?.stripe_account_id || null

    try {
      if (!accountId) {
        // Neuen Custom-Account anlegen, Bankkonto direkt mit anlegen
        const account = await stripe.accounts.create({
          type: 'custom',
          country: 'DE',
          email: bankResult.email || profile?.email || undefined,
          capabilities: { transfers: { requested: true } },
          business_type: 'individual',
          individual: { first_name: firstName, last_name: lastName, email: bankResult.email || profile?.email || undefined },
          tos_acceptance: { date: Math.floor(Date.now() / 1000), ip: clientIp },
          external_account: {
            object: 'bank_account',
            country: 'DE',
            currency: 'eur',
            account_holder_name: bankResult.holder,
            account_number: bankResult.iban,
          },
          metadata: { hui_user_id: user.id, source: 'hui_bankdaten' },
        })
        accountId = account.id
        await sb.from('profiles').update({
          stripe_account_id: accountId,
          stripe_connect_status: 'connected',
          stripe_charges_enabled: account.charges_enabled ?? false,
          stripe_payouts_enabled: account.payouts_enabled ?? false,
          stripe_onboarding_complete: true,
        }).eq('id', user.id)
      } else {
        // Bestehenden Account: externes Bankkonto aktualisieren (IBAN-Aenderung)
        const extAccount = await stripe.accounts.createExternalAccount(accountId, {
          external_account: {
            object: 'bank_account',
            country: 'DE',
            currency: 'eur',
            account_holder_name: bankResult.holder,
            account_number: bankResult.iban,
          } as any,
          default_for_currency: true,
        })
        const account = await stripe.accounts.retrieve(accountId)
        await sb.from('profiles').update({
          stripe_connect_status: 'connected',
          stripe_charges_enabled: account.charges_enabled ?? false,
          stripe_payouts_enabled: account.payouts_enabled ?? false,
        }).eq('id', user.id)
      }

      return new Response(JSON.stringify({ ok: true, stripe_account_id: accountId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } catch (stripeErr: any) {
      // Bankdaten sind bereits lokal verschluesselt gespeichert (rpc_save_ambassador_bank_details
      // lief vorher erfolgreich) -- Stripe-Sync-Fehler blockiert das NICHT, wird aber klar
      // zurueckgemeldet, damit die UI den Status ehrlich anzeigt statt "alles ok" zu behaupten.
      console.error('[sync-payout-bank-account] Stripe-Fehler:', stripeErr?.message)
      await sb.from('profiles').update({ stripe_connect_status: 'error' }).eq('id', user.id)
      return new Response(JSON.stringify({
        ok: false, saved_locally: true,
        error: stripeErr?.message || 'stripe_error',
        stripe_requirements: stripeErr?.raw?.param || null,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

  } catch (e) {
    console.error('[sync-payout-bank-account]', e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
