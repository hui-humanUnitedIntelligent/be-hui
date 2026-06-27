// supabase/functions/ticket-reply/index.ts
// Erlaubt authentifizierten Usern eine Antwort auf ihr eigenes Support-Ticket zu senden
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth-User aus Token ermitteln
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Nicht authentifiziert" }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Ungültiger Token" }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });

    const body = await req.json();
    const { ticketNumber, subject, message, attachments = [] } = body;

    if (!ticketNumber || !message?.trim()) {
      return new Response(JSON.stringify({ error: "ticketNumber und message erforderlich" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    // Service-Role für Insert verwenden
    const sb = createClient(supabaseUrl, serviceKey);

    // User-Profil laden
    const { data: profile } = await sb.from("profiles").select("username,first_name,last_name").eq("id", user.id).single();
    const userName = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.username : user.email;

    const { error } = await sb.from("notifications").insert({
      user_id:  user.id,
      type:     "support_ticket",
      title:    `[${ticketNumber}] RE: ${subject}`,
      body:     message.trim().slice(0, 200),
      data: {
        ticket_number:    ticketNumber,
        name:             userName ?? "",
        email:            user.email ?? "",
        category:         "anfrage",
        priority:         "normal",
        subject:          `RE: ${subject}`,
        message:          message.trim(),
        status:           "open",
        attachments,
        admin_reply:      null,
        replied_at:       null,
        read_by_admin:    false,
        is_followup:      true,
        original_subject: subject,
      },
      is_read: false,
      read:    false,
    });

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
