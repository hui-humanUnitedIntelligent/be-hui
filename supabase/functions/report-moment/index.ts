// supabase/functions/report-moment/index.ts
// MOMENTE-REPORTS-001: Community-Schutz
// Empfängt Melde-Request → ruft rpc_report_moment auf
// Bei 5+ Meldungen: beitraege.status → 'reported' (via RPC)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { moment_id, reason = "inappropriate" } = await req.json();
    if (!moment_id) return new Response(
      JSON.stringify({ error: "moment_id erforderlich" }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
    );

    // Auth aus JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(
      JSON.stringify({ error: "Nicht authentifiziert" }),
      { status: 401, headers: { ...CORS, "Content-Type": "application/json" } }
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Eingeloggten Nutzer ermitteln
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return new Response(
      JSON.stringify({ error: "Ungültiger Token" }),
      { status: 401, headers: { ...CORS, "Content-Type": "application/json" } }
    );

    // RPC aufrufen (SECURITY DEFINER — sicher)
    const { data, error } = await supabase.rpc("rpc_report_moment", {
      p_moment_id:   moment_id,
      p_reporter_id: user.id,
      p_reason:      reason,
    });

    if (error) throw error;

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
