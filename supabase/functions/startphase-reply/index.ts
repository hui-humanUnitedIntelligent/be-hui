// supabase/functions/startphase-reply/index.ts
// HUI Startphase — Admin Antwort an Bewerber senden
// Authentifiziert (Admin only) — sendet Email via Resend API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const CORS = getCorsHeaders;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Nicht authentifiziert" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Ungueltiges Token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Admin check
    const { data: profile } = await userClient.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "superadmin", "super_admin", "employee"].includes(profile.role)) {
      return new Response(JSON.stringify({ error: "Keine Admin-Berechtigung" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { applicationId, to, subject, message, adminName } = await req.json();

    if (!to || !message) {
      return new Response(JSON.stringify({ error: "Empfaenger und Nachricht erforderlich" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Send email via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY nicht konfiguriert" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'Inter',system-ui,-apple-system,sans-serif;color:#141422;line-height:1.7">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
  <div style="margin-bottom:24px">
    <img src="https://be-hui.com/hui_logo.webp" alt="HUI" width="36" height="36" style="border-radius:8px"/>
  </div>
  <h1 style="font-size:20px;font-weight:700;letter-spacing:-.01em;margin:0 0 20px;color:#141422">${subject}</h1>
  <div style="background:#FFF;border-radius:12px;padding:24px;border:1px solid rgba(20,20,34,.05);font-size:15px;color:#3A3A55;white-space:pre-wrap">${message}</div>
  <div style="margin-top:24px;padding-top:20px;border-top:1px solid rgba(20,20,34,.05);font-size:13px;color:#8A8A9E">
    <p>${adminName} — HUI Team</p>
    <p>Diese E-Mail wurde ueber das HUI Startphase-Dashboard gesendet.</p>
  </div>
</div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "HUI Team <noreply@be-hui.com>",
        to: to,
        subject: subject,
        html: htmlBody,
        reply_to: "noreply@be-hui.com",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[startphase-reply] Resend error:", res.status, errText);
      return new Response(JSON.stringify({ error: "Email-Versand fehlgeschlagen" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[startphase-reply] error:", err);
    return new Response(JSON.stringify({ error: "Serverfehler" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
