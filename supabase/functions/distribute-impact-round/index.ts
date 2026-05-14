// ══════════════════════════════════════════════════════════════════════
// HUI Edge Functions — supabase/functions/
// Alle kritischen Geschäftslogik serverseitig
// Deployment: supabase functions deploy <name>
// ══════════════════════════════════════════════════════════════════════

// FILE: supabase/functions/distribute-impact-round/index.ts
// Distributes the monthly impact pool among projects based on votes

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Service role — bypasses RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Auth: only admins can trigger distribution
    const authHeader = req.headers.get('Authorization')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') ?? ''
    )
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('membership_type')
      .eq('id', user.id)
      .single()

    if (profile?.membership_type !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { round_id } = await req.json()
    if (!round_id) {
      return new Response(JSON.stringify({ error: 'round_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Get round data
    const { data: round, error: roundErr } = await supabase
      .from('impact_rounds')
      .select('id,month,status,pool_eur')
      .eq('id', round_id)
      .single()

    if (roundErr || !round) {
      return new Response(JSON.stringify({ error: 'Round not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (round.status === 'completed') {
      return new Response(JSON.stringify({ error: 'Round already distributed' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Tally votes per project
    const { data: votes } = await supabase
      .from('impact_votes')
      .select('project_id, weight')
      .eq('round_id', round_id)

    const voteTally: Record<string, number> = {}
    for (const vote of votes ?? []) {
      voteTally[vote.project_id] = (voteTally[vote.project_id] ?? 0) + (vote.weight ?? 1)
    }

    // 3. Get all active projects in this round
    const { data: projects } = await supabase
      .from('impact_projects')
      .select('id,name,goal_eur,votes')
      .in('status', ['active','voting','featured'])

    if (!projects?.length) {
      return new Response(JSON.stringify({ error: 'No active projects' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 4. Sort by votes — winner gets full goal_eur, rest splits remainder
    const sorted = [...projects].sort((a, b) =>
      (voteTally[b.id] ?? 0) - (voteTally[a.id] ?? 0)
    )

    const winner = sorted[0]
    const others = sorted.slice(1)
    const poolEur = Number(round.pool_eur)

    const winnerAmount = Math.min(Number(winner.goal_eur ?? 0), poolEur)
    const remainder    = poolEur - winnerAmount
    const perOther     = others.length > 0 ? remainder / others.length : 0

    // 5. Update projects with awarded amounts
    const now = new Date().toISOString()

    await supabase.from('impact_projects')
      .update({ awarded_eur: winnerAmount, status: 'funded', distributed_at: now })
      .eq('id', winner.id)

    for (const project of others) {
      const award = Math.round(perOther * 100) / 100 // 2 decimal places
      await supabase.from('impact_projects')
        .update({ awarded_eur: award, distributed_at: now })
        .eq('id', project.id)
    }

    // 6. Mark round as completed
    await supabase.from('impact_rounds')
      .update({
        status: 'completed',
        winner_project_id: winner.id,
        distributed_at: now,
      })
      .eq('id', round_id)

    // 7. Create next month's round automatically
    const [year, month] = round.month.split('-').map(Number)
    const nextDate = new Date(year, month, 1) // month is 0-indexed in JS
    const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`

    await supabase.from('impact_rounds').upsert({
      month:  nextMonth,
      status: 'active',
      pool_eur: 0,
    }, { onConflict: 'month', ignoreDuplicates: true })

    return new Response(JSON.stringify({
      success: true,
      winner: { id: winner.id, name: winner.name, awarded_eur: winnerAmount },
      others: others.map((p, i) => ({ id: p.id, name: p.name, awarded_eur: Math.round(perOther * 100) / 100 })),
      next_round: nextMonth,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('[distribute-impact-round]', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
