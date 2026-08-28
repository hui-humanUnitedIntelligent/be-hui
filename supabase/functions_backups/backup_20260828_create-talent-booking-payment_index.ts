// supabase/functions/create-talent-booking-payment/index.ts
// ═══════════════════════════════════════════════════════════════════
// TALENT-BOOKING-PAYMENT-001 — Bezahlung fuer Talent-Angebote-Buchungen
// (Phase 3, additiv neben Commerce 2.0 create-payment-intent, eigener,
// unabhaengiger Zahlungspfad fuer geplante Termine mit Kapazitaet.)
//
// Ablauf:
//   1. rpc_create_talent_booking() legt die Buchung server-seitig an --
//      Preis wird AUSSCHLIESSLICH aus talents.price_per_session/price_per_hour
//      berechnet (Client kann keinen Preis vorgeben), Kapazitaet wird dabei
//      atomar (Row-Lock) geprueft -- schlaegt bei "kein Platz mehr frei" mit
//      einer klaren Fehlermeldung fehl, BEVOR ueberhaupt ein Stripe-Intent
//      erzeugt wird.
//   2. Bei Erfolg: Stripe PaymentIntent ueber amount_eur, Metadata verweist
//      auf die Buchung.
//   3. Schlaegt Stripe fehl -> Buchung wird geloescht (Platz sofort wieder frei,
//      gleiches Cleanup-Prinzip wie beim bestehenden create-payment-intent).
// ═══════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=denonext'
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

// CORS: jetzt per getCorsHeaders(req) — dynamisch und restriktiv (SICHERHEITSFIX 2026-08-26)

const MIN_AMOUNT_CENTS = 50 // Stripe Minimum EUR

const ERROR_MESSAGES: Record<string, string> = {
  talent_not_found:      'Dieses Angebot existiert nicht (mehr).',
  talent_not_approved:   'Dieses Angebot ist aktuell nicht buchbar.',
  cannot_book_own_offer: 'Du kannst dein eigenes Angebot nicht buchen.',
  no_price_configured:   'Für dieses Angebot ist kein Preis hinterlegt.',
  no_seats_available:    'Keine Plätze mehr verfügbar für diesen Termin.',
  seller_not_public:     'Dieses Profil ist nicht öffentlich — Buchungen sind aktuell deaktiviert.',
  invalid_participants:  'Ungültige Teilnehmerzahl.',
  not_authenticated:     'Bitte melde dich an.',
  // AKTIONSRADIUS-ENFORCE-001 (2026-08-20, Michael-Vorgabe: "Der Aktionsradius
  // muss zwingend eingehalten werden."):
  address_required:      'Bitte gib deine Adresse an, damit der Anbieter zu dir kommen kann.',
  seller_location_missing: 'Der Anbieter hat keinen Standort hinterlegt — Hausbesuch aktuell nicht buchbar.',
  radius_not_configured: 'Der Anbieter hat keinen Aktionsradius hinterlegt — Hausbesuch aktuell nicht buchbar.',
  outside_radius:        'Deine Adresse liegt außerhalb des Aktionsradius des Anbieters.',
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: 'Stripe nicht konfiguriert', code: 'STRIPE_NOT_CONFIGURED' }), {
      status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  let createdBookingId: string | null = null

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── Auth ─────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    const jwt = authHeader?.replace('Bearer ', '') ?? ''
    const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt)
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const talentId       = body.talent_id as string
    const selectedDate   = body.selected_date as string       // 'YYYY-MM-DD'
    const timeSlot        = body.time_slot ?? null
    const participants    = Math.max(1, Math.min(500, Math.round(Number(body.participants) || 1)))
    const customerNote    = (body.customer_note ?? null) as string | null
    // AKTIONSRADIUS-ENFORCE-001 (2026-08-20): Kunden-Adresse fuer Hausbesuche --
    // wird server-seitig in rpc_create_talent_booking gegen den Aktionsradius
    // des Anbieters geprueft (einzige Quelle der Wahrheit, Client-Pruefung ist
    // nur UX-Komfort und kann nicht umgangen werden).
    const customerAddress = (body.customer_address ?? null) as string | null
    const customerLat     = body.customer_lat != null ? Number(body.customer_lat) : null
    const customerLng     = body.customer_lng != null ? Number(body.customer_lng) : null

    if (!talentId || !selectedDate) {
      return new Response(JSON.stringify({ error: 'talent_id und selected_date erforderlich' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Buchung server-seitig anlegen (Preis + Kapazitaet werden dort geprueft) ──
    // Client-Auth-Kontext (auth.uid()) wird ueber den User-JWT weitergereicht,
    // damit die RPC (SECURITY DEFINER) den richtigen Kunden erkennt.
    const supabaseAsUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    )

    const { data: bookingResult, error: bookingErr } = await supabaseAsUser.rpc('rpc_create_talent_booking', {
      p_talent_id: talentId,
      p_selected_date: selectedDate,
      p_time_slot: timeSlot,
      p_participants: participants,
      p_customer_note: customerNote,
      p_customer_address: customerAddress,
      p_customer_lat: customerLat,
      p_customer_lng: customerLng,
    })

    if (bookingErr) {
      console.error('[TALENT-BOOKING] rpc error:', bookingErr.message)
      return new Response(JSON.stringify({ error: 'Buchung konnte nicht angelegt werden' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (!bookingResult?.ok) {
      const code = bookingResult?.error || 'unknown_error'
      // AKTIONSRADIUS-ENFORCE-001: bei outside_radius Distanz+Radius mitgeben,
      // damit der Client eine konkrete Fehlermeldung anzeigen kann ("120km
      // entfernt, Angebot nur bis 100km").
      return new Response(JSON.stringify({
        error: ERROR_MESSAGES[code] || 'Buchung nicht möglich.',
        code,
        remaining: bookingResult?.remaining,
        radius_km: bookingResult?.radius_km,
        distance_km: bookingResult?.distance_km,
      }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    createdBookingId = bookingResult.booking_id
    const amountEur = Number(bookingResult.amount_eur)
    const amountCents = Math.round(amountEur * 100)

    if (amountCents < MIN_AMOUNT_CENTS) {
      await supabase.from('talent_bookings').delete().eq('id', createdBookingId)
      return new Response(JSON.stringify({ error: 'Mindestbetrag 0.50 €' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Stripe PaymentIntent ───────────────────────────────────────
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })
    let pi: Stripe.PaymentIntent
    try {
      pi = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'eur',
        automatic_payment_methods: { enabled: true },
        metadata: {
          type: 'talent_booking',
          booking_id: createdBookingId,
          talent_id: talentId,
          customer_id: user.id,
        },
      })
    } catch (stripeErr: any) {
      console.error('[TALENT-BOOKING] Stripe error:', stripeErr.message)
      // Cleanup: Buchung entfernen, Platz sofort wieder frei
      await supabase.from('talent_bookings').delete().eq('id', createdBookingId)
      return new Response(JSON.stringify({ error: 'Zahlungsanbieter-Fehler' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    await supabase.from('talent_bookings')
      .update({ stripe_payment_intent: pi.id })
      .eq('id', createdBookingId)

    // ── Stock-Decrement (COMMERCE-STOCK-001) ─────────────────────
    // Atomare Bestandsreduzierung für Talent-Bookings
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { data: stockResult, error: stockErr } = await supabaseAdmin
      .rpc('rpc_decrement_stock', {
        p_table: 'talents',
        p_item_id: talentId,
        p_quantity: 1,
      })
    if (stockErr || !stockResult?.success) {
      console.warn('[TALENT-BOOKING] Stock decrement failed:', stockErr?.message || stockResult?.error)
      // Nicht blockierend — PI bereits erstellt
    } else {
      console.log('[TALENT-BOOKING] Stock decremented for talent', talentId, 'remaining:', stockResult.new_stock_available)
    }

    return new Response(JSON.stringify({
      clientSecret: pi.client_secret,
      bookingId: createdBookingId,
      amountEur,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (e: any) {
    console.error('[TALENT-BOOKING] Unhandled:', e?.message)
    if (createdBookingId) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )
        await supabase.from('talent_bookings').delete().eq('id', createdBookingId)
      } catch {}
    }
    return new Response(JSON.stringify({ error: e?.message || 'Interner Fehler' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

  // ── Rate Limiting (SCALE-006) ──
  const _rl = await checkRateLimit(req, "talent-booking-payment", 5, 60);
  if (!_rl.allowed) return rateLimitResponse(_rl.resetAt);
