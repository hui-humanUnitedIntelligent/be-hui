// supabase/functions/delete-account/index.ts
// ═══════════════════════════════════════════════════════════════════
// ACCOUNT-DELETION-001 — Vollständige, unwiderrufliche Account-Löschung
// (DSGVO Art. 17 "Recht auf Löschung")
//
// Ablauf:
//   1. JWT des aufrufenden Nutzers verifizieren (kein Service-Role-Aufruf
//      von außen möglich — Nutzer kann NUR seinen eigenen Account löschen).
//   2. rpc_delete_own_account() aufrufen (im User-Kontext, damit auth.uid()
//      innerhalb der Funktion korrekt aufgelöst wird) — löscht/anonymisiert
//      alle Daten in public.* (siehe Migration 115).
//   3. Erst danach: auth.users-Zeile per Service-Role löschen
//      (supabase.auth.admin.deleteUser) — das macht die E-Mail sofort wieder
//      frei für eine Neu-Registrierung UND invalidiert alle Sessions/Tokens.
//   4. Reihenfolge ist bewusst so: Schritt 3 vor Schritt 2 wäre riskant,
//      weil danach kein gültiges JWT für Schritt 2 mehr existieren würde.
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
    const authHeader = req.headers.get('Authorization')
    const jwt = authHeader?.replace('Bearer ', '') ?? ''
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'NOT_AUTHENTICATED' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

    // User-scoped Client (JWT des Aufrufers) — fuer auth.uid() innerhalb der RPC
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    })

    const { data: userRes, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: 'NOT_AUTHENTICATED' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const userId = userRes.user.id

    // Schritt 1: alle Daten in public.* loeschen/anonymisieren (im User-Kontext)
    const { error: rpcErr } = await userClient.rpc('rpc_delete_own_account')
    if (rpcErr) {
      console.error('rpc_delete_own_account failed:', rpcErr)
      return new Response(JSON.stringify({ error: 'DATA_DELETE_FAILED', detail: rpcErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Schritt 2: auth.users-Zeile per Service-Role loeschen (E-Mail wird frei)
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const { error: authDeleteErr } = await adminClient.auth.admin.deleteUser(userId)
    if (authDeleteErr) {
      console.error('auth.admin.deleteUser failed:', authDeleteErr)
      // Daten sind bereits geloescht — Auth-Loeschung nachtraeglich per Hand nachholen
      return new Response(JSON.stringify({ error: 'AUTH_DELETE_FAILED', detail: authDeleteErr.message, data_deleted: true }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('delete-account unexpected error:', e)
    return new Response(JSON.stringify({ error: 'UNEXPECTED', detail: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
