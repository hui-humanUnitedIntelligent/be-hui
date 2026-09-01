// supabase/functions/send-auth-email/index.ts
// Supabase Auth Send Email Hook — mehrsprachige Auth-E-Mails.
// Ersetzt Supabase's Default-Templates durch HUI-gebrandete, lokalisierte E-Mails.
//
// Hook-Docs: https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
// Payload: { user, email_data: { token, token_hash, email, email_action_type, redirect_to, site_url, token_new, token_hash_new } }
//
// KRITISCHER FIX (2026-09-01, INC-002 Bestätigungsmails kamen nie an):
// Root Cause 1: Diese Funktion hat NUR HTML gebaut und als JSON zurückgegeben
//   ({ headers, body }) — das ist NICHT der Vertrag des Send-Email-Hooks.
//   Der Hook muss den Versand SELBST übernehmen (z.B. via Resend API). GoTrue
//   wertet nur den HTTP-Status der Hook-Antwort aus ("Hook ran successfully"
//   bei 200) — es sendet NIE selbst eine Mail, wenn ein Custom-Hook aktiv ist.
//   Beleg: auth_logs zeigte "msg":"Hook ran successfully","success":true bei
//   JEDEM Versuch, aber es kam nie eine Mail an (Gmail UND GMX gleich betroffen
//   — kein Zustellungsproblem, sondern kompletter Sende-Ausfall).
// Root Cause 2: Der Bestätigungslink wurde als `${redirectTo}?token=${token}
//   &type=${type}` gebaut — zeigt direkt auf die App mit rohem Token. Die App
//   hat aber NIRGENDS Code der `verifyOtp()` aufruft oder `?token=`-Query-Params
//   verarbeitet (AuthCallback.jsx erwartet nur die von Supabase's JS-SDK via
//   URL-Hash automatisch gesetzte Session). FIX: Link zeigt jetzt auf
//   `${SUPABASE_URL}/auth/v1/verify?token={token_hash}&type=...&redirect_to=...`
//   — der offizielle Supabase-Verify-Endpoint, der die Session erzeugt und
//   per Redirect mit URL-Hash an die App weitergibt.
// Root Cause 3: `emailData.type` existiert im echten Hook-Payload NICHT —
//   das Feld heißt `email_action_type`. Dadurch defaultete JEDE Mail (auch
//   Recovery, E-Mail-Änderung) auf "signup"-Inhalt. FIX: liest jetzt
//   `email_action_type` mit Fallback auf `type` (Abwärtskompatibilität).
//
// Unterstützte Typen: signup, recovery, email_change_current, email_change_new,
//   password_changed_notification, email_changed_notification, reauthentication, invite

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  CONTENT, FOOTER, resolveLang,
  type Lang, type EmailContentEntry,
} from "./emailContent.ts";

// ── Konstanten ────────────────────────────────────────────────────────
const FROM = "HUI <noreply@be-hui.com>";
const LOGO_URL = "https://be-hui.vercel.app/assets/brand/hui-logo.png";
const BANNER_BG = "#0EC4B8";
const BTN_BG = "#0EC4B8";
const TEXT_DARK = "#1A1A2E";
const TEXT_MUTED = "#6B7280";
const BG_BODY = "#F8F9FA";
const BG_CARD = "#FFFFFF";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";

// Typen, die KEINEN Bestätigungslink brauchen (reine Info-Mails ohne Token-Flow)
const NO_LINK_TYPES = new Set(["password_changed_notification", "email_changed_notification"]);
// reauthentication zeigt einen Code statt eines Links
const CODE_TYPES = new Set(["reauthentication"]);

// Mapping von email_action_type (granular) auf den Supabase /auth/v1/verify "type"-Query-Param
function toVerifyType(actionType: string): string {
  if (actionType.startsWith("email_change")) return "email_change";
  if (actionType === "signup") return "signup";
  if (actionType === "recovery") return "recovery";
  if (actionType === "invite") return "invite";
  if (actionType === "magiclink") return "magiclink";
  return actionType;
}

// ── HTML Template ─────────────────────────────────────────────────────

function buildHTML(entry: EmailContentEntry, lang: Lang, type: string, link: string, code: string): string {
  const buttonHTML = entry.button && !NO_LINK_TYPES.has(type) && !CODE_TYPES.has(type)
    ? `<tr><td style="padding:0 40px 24px;" align="center">
         <a href="${link}"
            style="display:inline-block;padding:14px 36px;background:${BTN_BG};color:#fff;
                   text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;
                   font-family:Inter,Helvetica,Arial,sans-serif;">
           ${entry.button}
         </a>
       </td></tr>
       <tr><td style="padding:0 40px 8px;" align="center">
         <p style="font-size:12px;color:${TEXT_MUTED};margin:0;">
           ${lang === "de" ? "Wenn der Button nicht funktioniert, kopiere diesen Link:" :
             lang === "en" ? "If the button doesn't work, copy this link:" :
             lang === "es" ? "Si el botón no funciona, copia este enlace:" :
             lang === "fr" ? "Si le bouton ne fonctionne pas, copie ce lien :" :
             lang === "it" ? "Se il pulsante non funziona, copia questo link:" :
             lang === "tr" ? "Buton çalışmıyorsa, bu bağlantıyı kopyala:" :
             lang === "pt" ? "Se o botão não funcionar, copia este link:" :
             "Nëse butoni nuk funksionon, kopjo këtë link:"}
         </p>
         <p style="font-size:12px;color:${TEXT_MUTED};word-break:break-all;margin:4px 0 0;">
           ${link}
         </p>
       </td></tr>`
    : "";

  // Code-Block nur für reauthentication (OTP-Code)
  const codeHTML = CODE_TYPES.has(type)
    ? `<tr><td style="padding:16px 40px 24px;" align="center">
         <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:${TEXT_DARK};
                     font-family:'Courier New',monospace;padding:16px 24px;
                     background:#F3F4F6;border-radius:8px;display:inline-block;">
           ${code}
         </div>
       </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG_BODY};font-family:Inter,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG_BODY};padding:24px 0;">
    <tr><td align="center">
      <table width="500" cellpadding="0" cellspacing="0" style="background:${BG_CARD};border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Banner -->
        <tr><td style="background:${BANNER_BG};padding:28px 40px;text-align:center;">
          <img src="${LOGO_URL}" alt="HUI" width="80" style="margin:0 auto;display:block;"/>
        </td></tr>
        <!-- Heading -->
        <tr><td style="padding:32px 40px 8px;">
          <h1 style="margin:0;font-size:22px;font-weight:700;color:${TEXT_DARK};letter-spacing:-0.3px;">
            ${entry.heading}
          </h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:12px 40px 8px;">
          <p style="margin:0;font-size:15px;color:${TEXT_DARK};line-height:1.7;">
            ${entry.body}
          </p>
        </td></tr>
        ${entry.body2 ? `
        <tr><td style="padding:8px 40px 0;">
          <p style="margin:0;font-size:14px;color:${TEXT_MUTED};line-height:1.6;">
            ${entry.body2}
          </p>
        </td></tr>` : ""}
        <!-- Code (nur reauthentication) -->
        ${codeHTML}
        <!-- Button -->
        ${buttonHTML}
        <!-- Footer -->
        <tr><td style="padding:24px 40px 32px;border-top:1px solid #EEE;">
          <p style="margin:0;font-size:12px;color:${TEXT_MUTED};text-align:center;line-height:1.5;">
            ${FOOTER[lang]}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Resend-Versand ────────────────────────────────────────────────────

async function sendViaResend(to: string, subject: string, html: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    return { ok: false, error: "RESEND_API_KEY nicht konfiguriert" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: `Resend HTTP ${res.status}: ${JSON.stringify(json)}` };
    }
    return { ok: true, id: json.id };
  } catch (err) {
    return { ok: false, error: `Resend fetch failed: ${err?.message || err}` };
  }
}

// ── Hook Handler ─────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS" } });
  }

  try {
    const payload = await req.json();

    // Hook-Payload extrahieren
    const user = payload.user || {};
    const emailData = payload.email_data || {};

    // FIX Root Cause 3: Feld heißt email_action_type, nicht type (Fallback für Abwärtskompatibilität)
    const type: string = emailData.email_action_type || emailData.type || "signup";
    const token: string = emailData.token || "";
    const tokenHash: string = emailData.token_hash || token;
    const email: string = emailData.email || user.email || "";
    const newEmail: string = emailData.new_email || email;
    const oldEmail: string = emailData.old_email || "";
    const redirectTo: string = emailData.redirect_to || "https://be-hui.vercel.app";

    // Sprache aus user_metadata (von LoginPage signUp gesetzt), Fallback 'de'
    const lang: Lang = resolveLang(user.user_metadata?.hui_lang);

    // Content für diesen Typ holen
    const contentMap = CONTENT[type];
    if (!contentMap) {
      console.error(`[send-auth-email] Unknown email type: ${type}`);
      return new Response(JSON.stringify({ error: { http_code: 400, message: "Unknown email type" } }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const entry = contentMap[lang];

    // FIX Root Cause 2: Confirm-Link zeigt auf den offiziellen Supabase Verify-Endpoint,
    // nicht direkt auf die App. Der Verify-Endpoint erzeugt die Session und leitet dann
    // per Redirect (mit Session im URL-Hash) an redirect_to weiter — das kann AuthCallback.jsx
    // korrekt verarbeiten (supabase-js SDK liest Session automatisch aus dem Hash).
    const verifyType = toVerifyType(type);
    const confirmLink = `${SUPABASE_URL}/auth/v1/verify?token=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(verifyType)}&redirect_to=${encodeURIComponent(redirectTo)}`;

    // HTML bauen
    let html = buildHTML(entry, lang, type, confirmLink, token);

    // Verbleibende Text-Platzhalter ersetzen (Body/Body2 können {email} etc. enthalten)
    html = html
      .replace(/\{email\}/g, email)
      .replace(/\{oldEmail\}/g, oldEmail)
      .replace(/\{newEmail\}/g, newEmail);

    // Subject
    let subject = entry.subject
      .replace(/\{email\}/g, email)
      .replace(/\{oldEmail\}/g, oldEmail)
      .replace(/\{newEmail\}/g, newEmail);

    // FIX Root Cause 1: Die Mail wird jetzt AKTIV über Resend versendet — nicht nur
    // HTML zurückgegeben, das ins Leere läuft. Der Send-Email-Hook-Vertrag verlangt,
    // dass der Hook den Versand SELBST übernimmt.
    const sendResult = await sendViaResend(email, subject, html);

    if (!sendResult.ok) {
      console.error(`[send-auth-email] Resend send FAILED für ${email} (type=${type}): ${sendResult.error}`);
      return new Response(JSON.stringify({ error: { http_code: 500, message: `E-Mail-Versand fehlgeschlagen: ${sendResult.error}` } }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[send-auth-email] OK: ${email} (type=${type}, lang=${lang}, resend_id=${sendResult.id})`);

    // Erfolgs-Antwort (Hook-Vertrag: leerer Body / 200 = Hook erfolgreich)
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[send-auth-email] Error:", err?.message || err);
    return new Response(JSON.stringify({ error: { http_code: 500, message: "Internal error" } }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
