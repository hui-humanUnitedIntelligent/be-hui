// supabase/functions/check-order-status/index.ts
// deploy-trigger: 2026-06-27T3-commerce-2-canonical
// ═══════════════════════════════════════════════════════════════════
// HUI Commerce 2.0 — Check Order Status (Redirect Handler)
// Kanonisch: customer_id, state, seller_id via buyer_order_status View
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

    // Order laden via buyer_order_status (kanonisch + Legacy-Aliase)
    const { data: order, error: orderErr } = await supabase
      .from('buyer_order_status')
      .select(`
        id, customer_id, state, status, total_eur, impact_eur,
        payment_confirmed_at, created_at, order_items
      `)
      .eq('id', orderId)
      .eq('customer_id', user.id)
      .single()

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order nicht gefunden', state: 'not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const orderState = order.state ?? order.status

    // Ergebnis (state kanonisch; status als Legacy-Alias für Clients)
    return new Response(JSON.stringify({
      orderId:            order.id,
      state:              orderState,
      status:             orderState,           // Legacy-Alias — Phase 5 entfernen
      isPaid:             orderState === 'paid',
      totalEur:           order.total_eur,
      impactEur:          order.impact_eur,
      paymentConfirmedAt: order.payment_confirmed_at,
      itemCount:          Array.isArray(order.order_items) ? order.order_items.length : 0,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})

  } catch (e: any) {
    console.error('[CHECK_ORDER_STATUS]', e?.message)
    return new Response(JSON.stringify({ error: e?.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
