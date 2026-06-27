// ═══════════════════════════════════════════════════════════════════
// LEGACY — SUPERSEDED BY COMMERCE 2.0 — REMOVE AFTER PHASE 5
// Impact-Subsystem (nicht Commerce-Checkout). Kanonisch: distribute-impact-round
// ═══════════════════════════════════════════════════════════════════
// FILE: supabase/functions/cast-impact-vote/index.ts
// Server-side vote casting — validates weight, prevents duplicates

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Authenticate user
    const authHeader = req.headers.get('Authorization')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') ?? ''
    )
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Nicht eingeloggt' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { project_id, round_id } = await req.json()
    if (!project_id || !round_id) {
      return new Response(JSON.stringify({ error: 'project_id und round_id erforderlich' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get vote allocation via server-side function
    const { data: allocation } = await supabase
      .rpc('hui_get_vote_allocation', { p_user_id: user.id, p_round_id: round_id })
      .single()

    if (!allocation || allocation.votes_left <= 0) {
      return new Response(JSON.stringify({
        error: 'Keine Stimmen mehr übrig für diesen Monat',
        votes_left: 0,
      }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Check: already voted for this project?
    const { data: existing } = await supabase
      .from('impact_votes')
      .select('id')
      .eq('user_id', user.id)
      .eq('round_id', round_id)
      .eq('project_id', project_id)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ error: 'Bereits für dieses Projekt abgestimmt' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate round is open for voting
    const { data: round } = await supabase
      .from('impact_rounds')
      .select('status, voting_ends_at')
      .eq('id', round_id)
      .single()

    if (!round || !['active','voting'].includes(round.status)) {
      return new Response(JSON.stringify({ error: 'Abstimmung nicht aktiv' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (round.voting_ends_at && new Date(round.voting_ends_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Abstimmungsfrist abgelaufen' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Cast vote
    const { data: vote, error: voteErr } = await supabase
      .from('impact_votes')
      .insert({
        user_id:    user.id,
        project_id,
        round_id,
        weight:     1,
        created_at: new Date().toISOString(),
      })
      .select('id,user_id,project_id,round_id,weight,created_at')
      .single()

    if (voteErr) {
      return new Response(JSON.stringify({ error: voteErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update project vote count (denormalized for performance)
    await supabase.rpc('increment_project_votes', { p_project_id: project_id })

    return new Response(JSON.stringify({
      success: true,
      vote,
      votes_left: allocation.votes_left - 1,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('[cast-impact-vote]', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
