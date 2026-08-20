// supabase/functions/handle-payment-webhook/index.ts
// deploy-trigger: 2026-06-27T5-constructEventAsync-deno
// ═══════════════════════════════════════════════════════════════════
// HUI Commerce 2.0 — Stripe Webhook Handler (P0 Security Fix)
// Änderungen:
//   ✅ webhook_events Idempotency (event.id UNIQUE)
//   ✅ WHERE status = 'pending' Guard vor Order-Update
//   ✅ Amount-Verification: pi.amount === order.total_eur * 100
//   ✅ Webhook-Replay verhindert doppeltes Impact-Crediting
// ═══════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=denonext'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

const cryptoProvider = Stripe.createSubtleCryptoProvider()

// FREIE-BUCHUNG-001 (2026-08-20, Michael-Feedback): Die Seller-Benachrichtigung
// bei einer Talent-Buchung soll das Datum explizit im Text nennen
// ("Buchung für X am 13. September von Y"), nicht nur in data/metadata
// versteckt. Eigene, von Intl/Locale unabhaengige Formatierung (Deno-Runtime
// garantiert kein de-DE-Locale-Datenset) -- analog zu AvailabilityCalendar.jsx
// MONTH_NAMES, damit beide Stellen garantiert denselben Text erzeugen.
const GERMAN_MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]
function formatGermanDate(isoDate: string | null | undefined): string {
  if (!isoDate) return 'einem noch offenen Termin'
  const parts = String(isoDate).split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return isoDate
  const [, month, day] = parts
  const monthName = GERMAN_MONTH_NAMES[month - 1]
  return monthName ? `${day}. ${monthName}` : isoDate
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const stripeKey     = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    const body      = await req.text()
    const signature = req.headers.get('stripe-signature') ?? ''

    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing stripe-signature' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!stripeKey || !webhookSecret) {
      console.warn('[WEBHOOK] Stripe nicht konfiguriert')
      return new Response(JSON.stringify({ error: 'Stripe nicht konfiguriert' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })

    // ── Webhook Signature Verification (async — Deno Web Crypto) ─
    let event: Stripe.Event
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider,
      )
    } catch (err: any) {
      console.error('[WEBHOOK] Signature verification failed:', err.message)
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Idempotency: Event bereits verarbeitet? ───────────────────
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id, status')
      .eq('stripe_event_id', event.id)
      .maybeSingle()

    if (existingEvent) {
      console.log('[WEBHOOK] Event bereits verarbeitet:', event.id)
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Event registrieren (vor Verarbeitung — verhindert Race Conditions)
    const { error: registerErr } = await supabase.from('webhook_events').insert({
      stripe_event_id: event.id,
      event_type:      event.type,
      payload: { type: event.type, created: event.created },
      status:          'processing',
    })
    if (registerErr && registerErr.code !== '23505') {
      console.warn('[WEBHOOK] Event registration failed:', registerErr.message)
    }

    console.log('[WEBHOOK] Verarbeite Event:', event.type, event.id)

    // ── Event-Handler ─────────────────────────────────────────────
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent

      // Order laden (nur pending — verhindert Doppel-Update)
      let order: { id: string; customer_id: string; total_eur: number; state: string } | null = null
      let orderErr: { message?: string } | null = null

      const orderByPi = await supabase
        .from('orders')
        .select('id, customer_id, total_eur, state')
        .eq('stripe_payment_intent', pi.id)
        .eq('state', 'pending')
        .maybeSingle()
      order = orderByPi.data
      orderErr = orderByPi.error

      if (!order && pi.metadata?.hui_order_id) {
        const orderByMeta = await supabase
          .from('orders')
          .select('id, customer_id, total_eur, state')
          .eq('id', pi.metadata.hui_order_id)
          .eq('state', 'pending')
          .maybeSingle()
        order = orderByMeta.data
        orderErr = orderByMeta.error
      }

      if (orderErr || !order) {
        // ── Talent-Buchung? (Phase 3, additiv, eigener Zahlungspfad neben Orders) ──
        const { data: tBooking } = await supabase
          .from('talent_bookings')
          .select('id, customer_id, seller_id, amount_eur, status')
          .eq('stripe_payment_intent', pi.id)
          .eq('status', 'pending_payment')
          .maybeSingle()

        if (tBooking) {
          const expectedBookingCents = Math.round(Number(tBooking.amount_eur) * 100)
          if (Math.abs(pi.amount - expectedBookingCents) > 1) {
            console.error(`[WEBHOOK] Talent-Booking Amount-Mismatch: stripe=${pi.amount} erwartet=${expectedBookingCents} booking=${tBooking.id}`)
            await supabase.from('talent_bookings').update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
              .eq('id', tBooking.id).eq('status', 'pending_payment')
            await supabase.from('webhook_events').update({ status: 'failed' }).eq('stripe_event_id', event.id)
            return new Response('ok', { headers: corsHeaders })
          }

          // FIX (2026-08-16, ESCROW-COMMERCE-Bug): escrow_status wurde nie auf
          // 'holding' gesetzt (blieb beim Spalten-Default 'none') — dadurch
          // scheiterte rpc_seller_mark_shipped (WHERE escrow_status='holding')
          // lautlos für JEDE Buchung. auto_confirm_at (14 Tage) ergänzt.
          await supabase.from('talent_bookings').update({
            status: 'confirmed', confirmed_at: new Date().toISOString(),
            escrow_status: 'holding',
            delivery_status: 'pending',
            auto_confirm_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          }).eq('id', tBooking.id).eq('status', 'pending_payment') // Guard gegen Doppel-Verarbeitung

          // ESCROW-FEE-TIMING-FIX (2026-08-16): rpc_process_talent_booking_fees
          // laeuft nicht mehr hier (bei Zahlungseingang/Escrow-Start), sondern erst
          // in confirm-and-transfer wenn der Kaeufer den Erhalt/die Leistung bestaetigt.
          // Siehe Order-Pendant weiter unten fuer die vollstaendige Begruendung.

          // ── RESONANZ-BUCHUNG-001: Buchungsdetails anreichern (wer/was/wann/wo) ──
          const { data: tOffer } = await supabase
            .from('talents')
            .select('title, location_type, location_address, duration_minutes')
            .eq('id', tBooking.talent_id)
            .maybeSingle()
          const { data: tBuyerProfile } = await supabase
            .from('profiles')
            .select('display_name, full_name, username')
            .eq('id', tBooking.customer_id)
            .maybeSingle()
          const { data: tSellerProfile } = await supabase
            .from('profiles')
            .select('display_name, full_name, username, email, website')
            .eq('id', tBooking.seller_id)
            .maybeSingle()

                    // BELEG-005 (2026-08-14): full_name VOR display_name -- display_name ist oft nur
          // der Vorname (z.B. "Linda"), full_name enthaelt Vor+Nachname ("Linda Mathis").
          // Michael-Feedback: Nutzer sollen mit vollem Namen angezeigt werden.
const tBuyerName  = tBuyerProfile?.full_name || tBuyerProfile?.display_name || tBuyerProfile?.username || 'Jemand'
          const tSellerName = tSellerProfile?.full_name || tSellerProfile?.display_name || tSellerProfile?.username || 'Der Anbieter'
          const tOfferTitle = tOffer?.title || 'dein Talent-Angebot'
          const tTimeSlot   = tBooking.selected_time_slot && tBooking.selected_time_slot.start
            ? `${tBooking.selected_time_slot.start} – ${tBooking.selected_time_slot.end || ''}`.trim()
            : null
          const tLocation   = tOffer?.location_type === 'online' ? 'Online' : (tOffer?.location_address || null)

          // QUITTUNG-001 (2026-08-08): offer_id (Link zum Angebot) + seller_email/
          // seller_website (Kontaktdaten des Anbieters, "wenn vorhanden anzeigen")
          // fuer Buchungsdetail-Modal + PDF-Quittung ergaenzt.
          const tBookingMeta = {
            booking_id:    tBooking.id,
            offer_id:      tBooking.talent_id,
            offer_type:    'talent',
            offer_title:   tOfferTitle,
            buyer_name:    tBuyerName,
            seller_name:   tSellerName,
            seller_email:  tSellerProfile?.email || null,
            seller_website: tSellerProfile?.website || null,
            date:          tBooking.selected_date,
            time:          tTimeSlot,
            location:      tLocation,
            amount_eur:    tBooking.amount_eur,
            participants:  tBooking.participants,
            other_user_id: null, // wird pro Notification unten gesetzt
          }

          const tDateFormatted = formatGermanDate(tBooking.selected_date)

          await supabase.from('notifications').insert([
            {
              user_id: tBooking.seller_id, type: 'talent_booking_paid',
              title: 'Neue Buchung 🎉',
              // FREIE-BUCHUNG-001 (2026-08-20): Datum jetzt explizit im Text,
              // Michael-Vorgabe-Format "Buchung für X am 13.September von Y".
              body: `Buchung für „${tOfferTitle}" am ${tDateFormatted} von ${tBuyerName}.`,
              data: { ...tBookingMeta, other_user_id: tBooking.customer_id },
              metadata: { ...tBookingMeta, other_user_id: tBooking.customer_id },
              entity_id: tBooking.id, entity_type: 'talent_booking',
              read: false, is_read: false,
            },
            {
              user_id: tBooking.customer_id, type: 'talent_booking_confirmed',
              title: 'Buchung bestätigt ✓', body: `Deine Buchung „${tOfferTitle}" bei ${tSellerName} ist bestätigt.`,
              data: { ...tBookingMeta, other_user_id: tBooking.seller_id },
              metadata: { ...tBookingMeta, other_user_id: tBooking.seller_id },
              entity_id: tBooking.id, entity_type: 'talent_booking',
              read: false, is_read: false,
            },
          ])

          await supabase.from('webhook_events').update({ status: 'processed' }).eq('stripe_event_id', event.id)
          return new Response(JSON.stringify({ received: true, talent_booking: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // ── Support-Zahlung? (payment_type='support' → stripe_payments) ──
        if (pi.metadata?.payment_type === 'support') {
          const { data: supportPayment } = await supabase
            .from('stripe_payments')
            .select('id, user_id, ambassador_id, amount, ambassador_share, impact_pool_share')
            .eq('stripe_payment_id', pi.id)
            .eq('status', 'pending')
            .maybeSingle()

          if (supportPayment) {
            // Amount-Verification
            const expectedSupportCents = Math.round(Number(supportPayment.amount) * 100)
            if (Math.abs(pi.amount - expectedSupportCents) > 1) {
              console.error(`[WEBHOOK] Support Amount-Mismatch: stripe=${pi.amount} erwartet=${expectedSupportCents} payment=${supportPayment.id}`)
              await supabase.from('stripe_payments').update({ status: 'failed' })
                .eq('id', supportPayment.id).eq('status', 'pending')
              await supabase.from('webhook_events').update({ status: 'failed' }).eq('stripe_event_id', event.id)
              return new Response('ok', { headers: corsHeaders })
            }

            // Status → succeeded
            await supabase.from('stripe_payments').update({
              status: 'succeeded',
              updated_at: new Date().toISOString(),
            }).eq('id', supportPayment.id).eq('status', 'pending')

            // Impact-Pool aktualisieren
            const impactEur = Number(supportPayment.impact_pool_share) || 0
            if (impactEur > 0) {
              const { data: roundRows } = await supabase
                .from('impact_rounds')
                .select('id, pool_eur')
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(1)
              const currentRound = roundRows?.[0]
              if (currentRound) {
                await supabase.from('impact_rounds').update({
                  pool_eur: Number(currentRound.pool_eur) + impactEur
                }).eq('id', currentRound.id)
              }
            }

            // Creator benachrichtigen
            await supabase.from('notifications').insert({
              user_id: supportPayment.ambassador_id,
              type:    'support_received',
              title:   'Unterstützung erhalten ✦',
              body:    `${Number(supportPayment.amount).toFixed(2).replace('.', ',')} € Unterstützung ist eingegangen.`,
              data:    { payment_id: supportPayment.id, amount: supportPayment.amount },
              read:    false,
            })

            // Supporter benachrichtigen
            await supabase.from('notifications').insert({
              user_id: supportPayment.user_id,
              type:    'support_succeeded',
              title:   'Unterstützung gesendet ✓',
              body:    `Deine Unterstützung von ${Number(supportPayment.amount).toFixed(2).replace('.', ',')} € war erfolgreich.`,
              data:    { payment_id: supportPayment.id, creator_id: supportPayment.ambassador_id },
              read:    false,
            })

            await supabase.from('webhook_events').update({ status: 'processed' }).eq('stripe_event_id', event.id)
            return new Response(JSON.stringify({ received: true, support: true }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
        }

        console.warn('[WEBHOOK] Order nicht gefunden oder nicht pending:', orderErr?.message, 'PI:', pi.id, 'meta:', pi.metadata?.hui_order_id)
        await supabase.from('webhook_events').update({ status: 'processed' })
          .eq('stripe_event_id', event.id)
        return new Response('ok', { headers: corsHeaders })
      }

      const { data: orderItems } = await supabase
        .from('order_items')
        .select('id, seller_id, item_type, work_id, snapshot')
        .eq('order_id', order.id)

      // ── Amount-Verification ──────────────────────────────────
      const expectedCents = Math.round(Number(order.total_eur) * 100)
      if (Math.abs(pi.amount - expectedCents) > 1) { // 1 Cent Toleranz
        console.error(`[WEBHOOK] Amount-Mismatch: stripe=${pi.amount} erwartet=${expectedCents} order=${order.id}`)
        // Order auf failed setzen — manuelle Prüfung notwendig
        await supabase.from('orders').update({ state: 'failed' }).eq('id', order.id)
        await supabase.from('webhook_events').update({
          status: 'failed',
          payload: { error: 'amount_mismatch', stripe: pi.amount, expected: expectedCents }
        }).eq('stripe_event_id', event.id)
        return new Response('ok', { headers: corsHeaders })
      }

      // ── Order → paid ─────────────────────────────────────────
      // FIX (2026-08-16): shipping_address nur überschreiben wenn Stripe
      // auch wirklich eine liefert — sonst wird die vom Käufer eingegebene
      // Adresse (die beim Order-Insert gespeichert wurde) mit null gelöscht.
      const stripeShipping = (pi as any).shipping?.address ?? null;
      const stripeName     = (pi as any).shipping?.name ?? null;
      // FIX (2026-08-16, ESCROW-COMMERCE-Bug): escrow_status wurde nie auf
      // 'holding' gesetzt (blieb beim Spalten-Default 'none') — dadurch
      // scheiterte rpc_seller_mark_shipped (WHERE escrow_status='holding')
      // lautlos für JEDEN Verkauf seit Einführung des Escrow-Systems.
      // auto_confirm_at (14 Tage Auto-Bestätigung) ergänzt.
      const orderUpdate: Record<string, any> = {
        state:                'paid',
        payment_confirmed_at: new Date().toISOString(),
        contact_email:        pi.receipt_email ?? null,
        escrow_status:        'holding',
        delivery_status:      'pending',
        auto_confirm_at:      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      };
      if (stripeShipping) orderUpdate.shipping_address = stripeShipping;
      if (stripeName)     orderUpdate.contact_name     = stripeName;
      await supabase.from('orders').update(orderUpdate).eq('id', order.id).eq('state', 'pending'); // doppelter Guard

      // ── Commerce Event ────────────────────────────────────────
      const { error: confirmEventErr } = await supabase.from('commerce_events').insert({
        event_type: 'payment_confirmed',
        order_id:   order.id,
        actor_type: 'webhook',
        payload:    { stripe_pi: pi.id, amount: pi.amount, verified: true }
      })
      if (confirmEventErr) console.warn('[WEBHOOK] commerce_events insert failed:', confirmEventErr.message)

      // ── Creator Notifications (RESONANZ-BUCHUNG-001: Werk vs. Erlebnis unterscheiden,
      //    mit Titel/Käufer/Termin/Ort angereichert statt generischer Body-Text) ──
      const { data: orderBuyerProfile } = await supabase
        .from('profiles')
        .select('display_name, full_name, username')
        .eq('id', order.customer_id)
        .maybeSingle()
      const orderBuyerName = orderBuyerProfile?.full_name || orderBuyerProfile?.display_name || orderBuyerProfile?.username || 'Jemand'

      // Experience-Detaildaten vorab laden (fuer alle betroffenen Erlebnisse)
      const expItemIds = [...new Set(
        (orderItems || [])
          .filter((i: any) => i.item_type === 'experience')
          .map((i: any) => i.snapshot?.item_id)
          .filter(Boolean)
      )]
      let expDetailsById: Record<string, any> = {}
      if (expItemIds.length > 0) {
        const { data: expRows } = await supabase
          .from('experiences')
          .select('id, title, date, time_start, time_end, location_text, meeting_point')
          .in('id', expItemIds)
        for (const row of (expRows || [])) expDetailsById[row.id] = row
      }

      // Je Verkäufer × Item-Typ (Werk / Erlebnis) EINE Notification, mit Titel(n) der Artikel
      const sellerTypeGroups = new Map<string, { sellerId: string; itemType: string; titles: string[]; expDetail?: any }>()
      for (const item of (orderItems || [])) {
        if (!item.seller_id) continue
        const key = `${item.seller_id}__${item.item_type}`
        const title = item.snapshot?.title || (item.item_type === 'experience' ? 'ein Erlebnis' : 'ein Werk')
        if (!sellerTypeGroups.has(key)) {
          sellerTypeGroups.set(key, {
            sellerId: item.seller_id, itemType: item.item_type, titles: [title],
            expDetail: item.item_type === 'experience' ? expDetailsById[item.snapshot?.item_id] : undefined,
          })
        } else {
          sellerTypeGroups.get(key)!.titles.push(title)
        }
      }

      for (const group of sellerTypeGroups.values()) {
        const titleList = group.titles.join(', ')
        if (group.itemType === 'experience') {
          const exp = group.expDetail
          const expMeta = {
            order_id: order.id, item_titles: group.titles,
            buyer_name: orderBuyerName, seller_name: null,
            date: exp?.date || null,
            time: (exp?.time_start ? `${exp.time_start}${exp.time_end ? ' – ' + exp.time_end : ''}` : null),
            location: exp?.location_text || exp?.meeting_point || null,
            other_user_id: order.customer_id,
          }
          const { error: notifErr } = await supabase.from('notifications').insert({
            user_id: group.sellerId,
            type:    'experience_booking_paid',
            title:   'Neue Buchung 🎉',
            body:    `${orderBuyerName} hat „${titleList}" gebucht und bezahlt.`,
            data:     expMeta, metadata: expMeta,
            entity_id: exp?.id || null, entity_type: 'experience',
            read: false, is_read: false,
          })
          if (notifErr) console.warn('[NOTIF]', notifErr.message)
        } else {
          // BELEG-001 (2026-08-11): Angereichert mit amount_eur, offer_title,
          // offer_type, work_id fuer strukturiertes Detail-Modal + Beleg-Download
          const workItemsForSeller = (orderItems || []).filter((i: any) => i.seller_id === group.sellerId && i.item_type === 'work')
          const workAmountEur = workItemsForSeller.reduce((sum: number, i: any) => sum + Number(i.snapshot?.price_eur || 0) * (i.quantity || 1), 0)
          const workMeta = {
            order_id: order.id, item_titles: group.titles,
            offer_title: titleList,
            offer_type: 'werk',
            work_id: workItemsForSeller[0]?.work_id || null,
            amount_eur: workAmountEur,
            buyer_name: orderBuyerName, other_user_id: order.customer_id,
          }
          const { error: notifErr } = await supabase.from('notifications').insert({
            user_id: group.sellerId,
            type:    'new_order',
            title:   'Neue Bestellung 🎉',
            body:    `${orderBuyerName} hat „${titleList}" gekauft.`,
            data:     workMeta, metadata: workMeta,
            entity_id: (orderItems || []).find((i: any) => i.seller_id === group.sellerId && i.item_type === 'work')?.work_id || null,
            entity_type: 'work',
            read: false, is_read: false,
          })
          if (notifErr) console.warn('[NOTIF]', notifErr.message)
        }
      }

      // ── ESCROW-FEE-TIMING-FIX (2026-08-16) ──
      // rpc_process_order_fees (Impact-Pool-Gutschrift, Ambassador-Provision, etc.)
      // wurde bisher HIER ausgeloest -- direkt bei Zahlungseingang, WAEHREND das
      // Geld noch in Escrow ('holding') ist und der Kaeufer den Erhalt noch nicht
      // bestaetigt hat. Das ist fachlich falsch: Impact-Pool + Ambassador-Provision
      // duerfen erst gutgeschrieben werden, NACHDEM die Transaktion durch die
      // Kaeufer-Bestaetigung ('Ware erhalten') abgeschlossen ist -- sonst wuerde
      // bei einer spaeteren Reklamation/Nicht-Bestaetigung bereits verteiltes Geld
      // wieder zurueckgebucht werden muessen (nicht vorgesehen).
      // NEU: rpc_process_order_fees laeuft ab jetzt ausschliesslich in der Edge
      // Function confirm-and-transfer (ausgeloest durch 'Ware erhalten'-Klick des
      // Kaeufers), analog zum Seller-Stripe-Transfer. Siehe dort fuer Details.

      // Buyer-Bestätigung — getrennt nach Werk-Kauf vs. Erlebnis-Buchung (RESONANZ-BUCHUNG-001)
      const workTitles = (orderItems || []).filter((i: any) => i.item_type !== 'experience').map((i: any) => i.snapshot?.title || 'ein Werk')
      const expTitles  = (orderItems || []).filter((i: any) => i.item_type === 'experience')

      if (workTitles.length > 0) {
        // BELEG-001 (2026-08-11): Kaeufer-Bestaetigung mit vollen Details anreichern
        // (seller_name, amount_eur, work_id, offer_type) — analog zu talent_booking_confirmed.
        // Sonst zeigt das Resonanzzentrum-Modal nur einen generischen Text ohne Struktur.
        const workItems = (orderItems || []).filter((i: any) => i.item_type !== 'experience')
        const workTotalEur = workItems.reduce((sum: number, i: any) => sum + Number(i.snapshot?.price_eur || 0) * (i.quantity || 1), 0)
        const firstWorkSellerId = workItems[0]?.seller_id || null
        let workSellerName = 'Der Anbieter'
        let workSellerEmail: string | null = null
        let workSellerWebsite: string | null = null
        if (firstWorkSellerId) {
          const { data: workSellerProfile } = await supabase
            .from('profiles')
            .select('display_name, full_name, username, email, website')
            .eq('id', firstWorkSellerId)
            .maybeSingle()
          workSellerName    = workSellerProfile?.full_name || workSellerProfile?.display_name || workSellerProfile?.username || 'Der Anbieter'
          workSellerEmail   = workSellerProfile?.email || null
          workSellerWebsite = workSellerProfile?.website || null
        }
        const buyerWorkMeta = {
          order_id: order.id,
          item_titles: workTitles,
          offer_title: workTitles.join(', '),
          offer_type: 'werk',
          work_id: workItems[0]?.work_id || null,
          amount_eur: workTotalEur,
          seller_name: workSellerName,
          seller_email: workSellerEmail,
          seller_website: workSellerWebsite,
          other_user_id: firstWorkSellerId,
        }
        const { error: buyerNotifErr } = await supabase.from('notifications').insert({
          user_id: order.customer_id,
          type:    'order_confirmed',
          title:   'Unterstützung bestätigt ✓',
          body:    `Deine Zahlung für „${workTitles.join(', ')}" war erfolgreich.`,
          data:     buyerWorkMeta, metadata: buyerWorkMeta,
          entity_id: workItems[0]?.work_id || null, entity_type: 'work',
          read:    false, is_read: false,
        })
        if (buyerNotifErr) console.warn('[NOTIF]', buyerNotifErr.message)
      }

      if (expTitles.length > 0) {
        // Ein zusammengefasstes Erlebnis-Detail (bei mehreren Erlebnissen im selben Order: erstes fuer Termin/Ort)
        const firstExpItemId = expTitles[0]?.snapshot?.item_id
        const exp = firstExpItemId ? expDetailsById[firstExpItemId] : null
        const expTitleList = expTitles.map((i: any) => i.snapshot?.title || 'ein Erlebnis')
        // QUITTUNG-001 (2026-08-08): Kaeufer-Bestaetigung hatte bisher KEINE
        // Veranstalter-Info (weder seller_name noch other_user_id) -- Chat-Button
        // und "Gebucht bei" im Buchungsdetail-Modal liefen ins Leere. Seller-Id
        // steckt bereits auf dem order_item (siehe sellerTypeGroups oben), daher
        // hier direkt aus expTitles[0] lesbar -- keine Zusatzabfrage noetig.
        const expSellerId = expTitles[0]?.seller_id || null
        let expSellerName = 'Der Veranstalter'
        let expSellerEmail: string | null = null
        let expSellerWebsite: string | null = null
        if (expSellerId) {
          const { data: expSellerProfile } = await supabase
            .from('profiles')
            .select('display_name, full_name, username, email, website')
            .eq('id', expSellerId)
            .maybeSingle()
          expSellerName    = expSellerProfile?.full_name || expSellerProfile?.display_name || expSellerProfile?.username || 'Der Veranstalter'
          expSellerEmail   = expSellerProfile?.email || null
          expSellerWebsite = expSellerProfile?.website || null
        }
        const buyerExpMeta = {
          order_id: order.id, item_titles: expTitleList,
          offer_id: exp?.id || null,
          offer_type: 'experience',
          offer_title: expTitleList.join(', '),
          seller_name: expSellerName,
          seller_email: expSellerEmail,
          seller_website: expSellerWebsite,
          other_user_id: expSellerId,
          date: exp?.date || null,
          time: (exp?.time_start ? `${exp.time_start}${exp.time_end ? ' – ' + exp.time_end : ''}` : null),
          location: exp?.location_text || exp?.meeting_point || null,
        }
        const { error: expNotifErr } = await supabase.from('notifications').insert({
          user_id: order.customer_id,
          type:    'experience_booking_confirmed',
          title:   'Buchung bestätigt ✓',
          body:    `Deine Buchung für „${expTitleList.join(', ')}" ist bestätigt.`,
          data:     buyerExpMeta, metadata: buyerExpMeta,
          entity_id: exp?.id || null, entity_type: 'experience',
          read: false, is_read: false,
        })
        if (expNotifErr) console.warn('[NOTIF]', expNotifErr.message)
      }
    }

    else if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as Stripe.PaymentIntent
      await supabase.from('orders')
        .update({ state: 'failed' })
        .eq('stripe_payment_intent', pi.id)
        .eq('state', 'pending')  // Status-Guard

      // Talent-Buchung: bei fehlgeschlagener Zahlung Platz sofort wieder freigeben
      // (Kapazitaet zaehlt live nur pending_payment/confirmed -> cancelled gibt Platz frei)
      await supabase.from('talent_bookings')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('stripe_payment_intent', pi.id)
        .eq('status', 'pending_payment')

      // Support-Zahlung: bei fehlgeschlagener Zahlung auf failed setzen
      await supabase.from('stripe_payments')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('stripe_payment_id', pi.id)
        .eq('status', 'pending')

      const { error: failedEventErr } = await supabase.from('commerce_events').insert({
        event_type: 'payment_failed',
        actor_type: 'webhook',
        payload:    { stripe_pi: pi.id, reason: (pi as any).last_payment_error?.message }
      })
      if (failedEventErr) console.warn('[WEBHOOK] payment_failed event insert failed:', failedEventErr.message)
    }

    else if (event.type === 'charge.dispute.created') {
      console.warn('[WEBHOOK] Dispute:', (event.data.object as any).id)
      // TODO: Sprint C4
    }

    // Event als erfolgreich markieren
    await supabase.from('webhook_events').update({ status: 'processed' })
      .eq('stripe_event_id', event.id)

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (e: any) {
    console.error('[WEBHOOK] Unhandled:', e?.message)
    return new Response(JSON.stringify({ error: e?.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
