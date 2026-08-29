// supabase/functions/send-auth-email/index.ts
// Supabase Auth Send Email Hook — mehrsprachige Auth-E-Mails.
// Ersetzt Supabase's Default-Templates durch HUI-gebrandete, lokalisierte E-Mails.
//
// Hook-Docs: https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
// Payload: { user, email_data: { token, email, type, new_email, old_email, redirect_to } }
// Response: { headers: { Subject, From, To, Content-Type }, body: "<html>" }
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

// ── HTML Template ─────────────────────────────────────────────────────

function buildHTML(entry: EmailContentEntry, lang: Lang, type: string): string {
  const buttonHTML = entry.button
    ? `<tr><td style="padding:0 40px 24px;" align="center">
         <a href="{{LINK}}"
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
           {{LINK}}
         </p>
       </td></tr>`
    : "";

  // Code-Block nur für reauthentication (OTP-Code)
  const codeHTML = type === "reauthentication"
    ? `<tr><td style="padding:16px 40px 24px;" align="center">
         <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:${TEXT_DARK};
                     font-family:'Courier New',monospace;padding:16px 24px;
                     background:#F3F4F6;border-radius:8px;display:inline-block;">
           {{CODE}}
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
    const type: string = emailData.type || "signup";
    const token: string = emailData.token || "";
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
      return new Response(JSON.stringify({ error: "Unknown email type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const entry = contentMap[lang];

    // Confirm-Link bauen (für Typen mit Token)
    const confirmLink = `${redirectTo}${redirectTo.includes("?") ? "&" : "?"}token=${token}&type=${type}`;

    // HTML bauen
    let html = buildHTML(entry, lang, type);

    // Template-Variablen ersetzen
    html = html
      .replace(/\{\{LINK\}\}/g, confirmLink)
      .replace(/\{\{CODE\}\}/g, token)
      .replace(/\{\{EMAIL\}\}/g, email)
      .replace(/\{\{OLD\}\}/g, oldEmail)
      .replace(/\{\{NEW\}\}/g, newEmail)
      .replace(/\{email\}/g, email)
      .replace(/\{oldEmail\}/g, oldEmail)
      .replace(/\{newEmail\}/g, newEmail);

    // Subject
    let subject = entry.subject;
    subject = subject
      .replace(/\{email\}/g, email)
      .replace(/\{oldEmail\}/g, oldEmail)
      .replace(/\{newEmail\}/g, newEmail);

    // Hook-Response
    return new Response(JSON.stringify({
      headers: {
        "Subject": [subject],
        "From": [FROM],
        "To": [email],
        "Content-Type": ["text/html; charset=utf-8"],
      },
      body: html,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[send-auth-email] Error:", err.message || err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
