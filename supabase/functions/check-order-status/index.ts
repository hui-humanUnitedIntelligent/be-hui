// supabase/functions/check-order-status/index.ts
// deploy-trigger: 2026-06-27T2-runtime-stabilize
// ═══════════════════════════════════════════════════════════════════
// HUI Commerce — Check Order Status (Redirect Handler)
// ═══════════════════════════════════════════════════════════════════
// Wird aufgerufen wenn Nutzer nach SEPA/3DS-Redirect zurückkommt.
// Prüft Order-Status in DB und gibt aktuellen Zustand zurück.
// Client-Secret oder PI-Status werden nicht direkt geprüft —
// der Webhook ist die Authorität (payment_intent.succeeded).
// ═══════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Auth
    const authHeader = req.headers.get('Authorization')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') ?? ''
    )
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Order-ID aus Query-Param
    const url     = new URL(req.url)
    const orderId = url.searchParams.get('order_id')

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'order_id erforderlich' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Order laden (nur eigene)
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select(`
        id, status, total_eur, impact_eur,
        payment_confirmed_at, created_at,
        order_items(id, item_type, quantity, unit_price_eur, snapshot,
                    fulfillment_status, creator_id)
      `)
      .eq('id', orderId)
      .eq('buyer_id', user.id)  // Sicherheit: nur eigene Orders
      .single()

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order nicht gefunden', status: 'not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Ergebnis
    return new Response(JSON.stringify({
      orderId:           order.id,
      status:            order.status,             // pending|paid|failed|aborted
      isPaid:            order.status === 'paid',
      totalEur:          order.total_eur,
      impactEur:         order.impact_eur,
      paymentConfirmedAt: order.payment_confirmed_at,
      itemCount:         (order as any).order_items?.length || 0,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})

  } catch (e: any) {
    console.error('[CHECK_ORDER_STATUS]', e?.message)
    return new Response(JSON.stringify({ error: e?.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
