import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

// CORS: jetzt per getCorsHeaders(req) — dynamisch und restriktiv (SICHERHEITSFIX 2026-08-26);

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  // ── Rate Limiting (SCALE-006) ──
  const _rl = await checkRateLimit(req, "apply-migration", 3, 60);
  if (!_rl.allowed) return rateLimitResponse(_rl.resetAt);
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );
  
  // Execute the SQL using the pg_execute RPC or raw query
  const sql = `
    DROP POLICY IF EXISTS chats_delete_own ON public.chats;
    CREATE POLICY chats_delete_own ON public.chats
      FOR DELETE TO authenticated
      USING (auth.uid() = ANY(participant_ids));
  `;
  
  // Use the Supabase SQL API
  const { data, error } = await supabase.rpc("exec_sql", { sql }).then(
    () => ({ data: null, error: null }),
    (err) => ({ data: null, error: err })
  );
  
  // Alternative: use the pg extension
  try {
    // Direct SQL execution via the database connection
    const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/`, {
      method: "POST",
      headers: {
        "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
    });
    
    // We need to use the pg library for DDL statements
    // Let's use the Deno postgres library
    const { Client } = await import("https://deno.land/x/postgres/mod.ts");
    const client = new Client({
      connectionString: Deno.env.get("DATABASE_URL") || 
        `postgresql://postgres:${Deno.env.get("POSTGRES_PASSWORD")}@db.gxztrhvhcxhmunhhkfjd.supabase.co:5432/postgres`,
    });
    await client.connect();
    await client.queryArray(sql);
    const result = await client.queryArray("SELECT policyname, cmd FROM pg_policies WHERE tablename = 'chats'");
    await client.end();
    
    return new Response(JSON.stringify({ ok: true, policies: result.rows }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
