// supabase/functions/send-ticket-confirmation/index.ts
// Sendet eine Eingangsbestätigung per E-Mail, wenn ein Nutzer ein Support-Ticket erstellt.
// Analog zu send-auth-email / delete-account — gleicher Resend-Versand,
// gleiche verifizierte Absenderdomain be-hui.com.
//
// Wird vom Frontend (SupportPage.jsx) nach erfolgreichem DB-Insert aufgerufen.
// Fehler beim Mail-Versand blockieren NICHT die Ticket-Erstellung (Frontend
// fängt Errors ab und loggt sie nur).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

// ── i18n: 8 Sprachen (DE/EN/ES/FR/IT/TR/PT/SQ) ─────────────────────────

const SUPPORTED_LANGS = ['de','en','es','fr','it','tr','pt','sq'] as const;
type Lang = typeof SUPPORTED_LANGS[number];

function resolveLang(raw: unknown): Lang {
  const l = typeof raw === 'string' ? raw.toLowerCase().slice(0,2) : '';
  return (SUPPORTED_LANGS as readonly string[]).includes(l) ? (l as Lang) : 'de';
}

interface TicketContent {
  subject: string;
  heading: string;
  greeting: string;
  body: string;
  ticketLabel: string;
  messageLabel: string;
  closing: string;
}

const CONTENT: Record<Lang, TicketContent> = {
  de: {
    subject: "HUI Support — Deine Anfrage ist angekommen",
    heading: "Wir haben deine Anfrage erhalten",
    greeting: "Hallo",
    body: "vielen Dank für deine Nachricht. Deine Support-Anfrage ist bei uns eingegangen und wird von unserem Team bearbeitet.",
    ticketLabel: "Ticket-Nummer",
    messageLabel: "Deine Nachricht",
    closing: "Unser Support-Team meldet sich in Kürze bei dir. Du kannst den Status deiner Anfrage jederzeit in der HUI-App unter 'Mein HUI → Studio → Meine Tickets' einsehen.",
  },
  en: {
    subject: "HUI Support — Your request has been received",
    heading: "We've received your request",
    greeting: "Hello",
    body: "thank you for your message. Your support request has been received and our team is working on it.",
    ticketLabel: "Ticket number",
    messageLabel: "Your message",
    closing: "Our support team will get back to you shortly. You can check the status of your request anytime in the HUI app under 'My HUI -> Studio -> My Tickets'.",
  },
  es: {
    subject: "HUI Soporte — Hemos recibido tu solicitud",
    heading: "Hemos recibido tu solicitud",
    greeting: "Hola",
    body: "gracias por tu mensaje. Hemos recibido tu solicitud de soporte y nuestro equipo la está procesando.",
    ticketLabel: "Número de ticket",
    messageLabel: "Tu mensaje",
    closing: "Nuestro equipo de soporte se pondrá en contacto contigo en breve. Puedes consultar el estado de tu solicitud en cualquier momento en la app de HUI bajo 'Mi HUI -> Studio -> Mis Tickets'.",
  },
  fr: {
    subject: "HUI Support — Ta demande a été reçue",
    heading: "Nous avons reçu ta demande",
    greeting: "Bonjour",
    body: "merci pour ton message. Ta demande d'assistance a été reçue et notre équipe s'en occupe.",
    ticketLabel: "Numéro de ticket",
    messageLabel: "Ton message",
    closing: "Notre équipe d'assistance te recontactera très bientôt. Tu peux suivre l'état de ta demande à tout moment dans l'application HUI sous 'Mon HUI -> Studio -> Mes Tickets'.",
  },
  it: {
    subject: "HUI Support — La tua richiesta è stata ricevuta",
    heading: "Abbiamo ricevuto la tua richiesta",
    greeting: "Ciao",
    body: "grazie per il tuo messaggio. La tua richiesta di supporto è stata ricevuta e il nostro team la sta elaborando.",
    ticketLabel: "Numero ticket",
    messageLabel: "Il tuo messaggio",
    closing: "Il nostro team di supporto ti contatterà a breve. Puoi controllare lo stato della tua richiesta in qualsiasi momento nell'app HUI sotto 'Il mio HUI -> Studio -> I miei ticket'.",
  },
  tr: {
    subject: "HUI Destek — Talebiniz alındı",
    heading: "Talebinizi aldık",
    greeting: "Merhaba",
    body: "mesajın için teşekkürler. Destek talebin alındı ve ekibimiz bunu işliyor.",
    ticketLabel: "Ticket numarası",
    messageLabel: "Senin mesajın",
    closing: "Destek ekibimiz kısa süre içinde sana geri dönecek. Talebinin durumunu HUI uygulamasında 'Benim HUI -> Studio -> Ticket'larım\" altında her zaman görebilirsin.",
  },
  pt: {
    subject: "HUI Suporte — A tua solicitação foi recebida",
    heading: "Recebemos a tua solicitação",
    greeting: "Olá",
    body: "obrigado pela tua mensagem. A tua solicitação de suporte foi recebida e a nossa equipa está a processá-la.",
    ticketLabel: "Número do ticket",
    messageLabel: "A tua mensagem",
    closing: "A nossa equipa de suporte entrar em contacto contigo em breve. Podes consultar o estado da tua solicitação a qualquer momento na app HUI em 'O meu HUI -> Studio -> Os meus Tickets'.",
  },
  sq: {
    subject: "HUI Mbështetja — Kërkesa jote është marrë",
    heading: "Kemi marrë kërkesën tënde",
    greeting: "Përshëndetje",
    body: "faleminderit për mesazhin tënd. Kërkesa jote për mbështetje është marrë dhe ekipi ynë e po e përpunon.",
    ticketLabel: "Numri i ticket-it",
    messageLabel: "Mesazhi yt",
    closing: "Ekipi ynë i mbështetjes do të lidhet me ty së shpejti. Mund të kontrollosh statusin e kërkesës sate në çdo kohë në aplikacionin HUI nën 'HUI imja -> Studio -> Ticket-et e mia'.",
  },
};

// ── Konstanten ────────────────────────────────────────────────────────

const FROM = "HUI Support <noreply@be-hui.com>";
const LOGO_URL = "https://be-hui.vercel.app/assets/brand/hui-logo.png";
const BANNER_BG = "#0EC4B8";
const TEXT_DARK = "#1A1A2E";
const TEXT_MUTED = "#6B7280";
const BG_BODY = "#F8F9FA";
const BG_CARD = "#FFFFFF";

const FOOTER: Record<Lang, string> = {
  de: "Diese Nachricht wurde automatisch von HUI – Human United Intelligence generiert.",
  en: "This message was automatically generated by HUI – Human United Intelligence.",
  es: "Este mensaje fue generado automáticamente por HUI – Human United Intelligence.",
  fr: "Ce message a été généré automatiquement par HUI – Human United Intelligence.",
  it: "Questo messaggio è stato generato automaticamente da HUI – Human United Intelligence.",
  tr: "Bu mesaj HUI – Human United Intelligence tarafından otomatik olarak oluşturulmuştur.",
  pt: "Esta mensagem foi gerada automaticamente pela HUI – Human United Intelligence.",
  sq: "Ky mesazh u gjenerua automatikisht nga HUI – Human United Intelligence.",
};

// ── HTML Template ─────────────────────────────────────────────────────

function buildHtml(
  lang: Lang,
  name: string,
  ticketNumber: string,
  subject: string,
  message: string,
): string {
  const c = CONTENT[lang];
  const fullName = name || c.greeting;

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
            ${c.heading}
          </h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:12px 40px 8px;">
          <p style="margin:0;font-size:15px;color:${TEXT_DARK};line-height:1.7;">
            ${c.greeting} ${fullName},<br/><br/>
            ${c.body}
          </p>
        </td></tr>
        <!-- Ticket Number -->
        <tr><td style="padding:16px 40px 0;">
          <div style="background:#F8F9FA;border-radius:10px;padding:14px 18px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:0.06em;">
              ${c.ticketLabel}
            </p>
            <p style="margin:0;font-size:15px;font-weight:700;color:${TEXT_DARK};font-family:monospace;">
              ${ticketNumber}
            </p>
          </div>
        </td></tr>
        <!-- Subject -->
        <tr><td style="padding:12px 40px 0;">
          <p style="margin:0;font-size:14px;color:${TEXT_DARK};">
            <strong>${subject}</strong>
          </p>
        </td></tr>
        <!-- Original Message -->
        <tr><td style="padding:8px 40px 0;">
          <div style="background:#F8F9FA;border-radius:10px;padding:14px 18px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:0.06em;">
              ${c.messageLabel}
            </p>
            <p style="margin:0;font-size:13px;color:${TEXT_DARK};line-height:1.6;white-space:pre-wrap;">${message}</p>
          </div>
        </td></tr>
        <!-- Closing -->
        <tr><td style="padding:16px 40px 8px;">
          <p style="margin:0;font-size:14px;color:${TEXT_MUTED};line-height:1.6;">
            ${c.closing}
          </p>
        </td></tr>
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

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";

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

// ── Handler ────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // ── Rate Limiting (SCALE-006) ──
  const _rl = await checkRateLimit(req, "send-ticket-confirmation", 5, 60);
  if (!_rl.allowed) return rateLimitResponse(_rl.resetAt);

  try {
    const body = await req.json();
    const { email, name, ticketNumber, subject, message, lang } = body;

    if (!email || !ticketNumber) {
      return new Response(JSON.stringify({ error: "email und ticketNumber erforderlich" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const resolvedLang = resolveLang(lang);
    const html = buildHtml(
      resolvedLang,
      String(name || ""),
      String(ticketNumber),
      String(subject || ""),
      String(message || "").slice(0, 1000),
    );

    const result = await sendViaResend(email, CONTENT[resolvedLang].subject, html);

    if (!result.ok) {
      console.error(`[send-ticket-confirmation] FAILED: ${result.error} (to=${email}, ticket=${ticketNumber})`);
      // Non-blocking: return 200 even on email failure
      return new Response(JSON.stringify({ ok: true, email_sent: false, error: result.error }), {
        status: 200, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    console.log(`[send-ticket-confirmation] Sent to ${email}, ticket=${ticketNumber}, id=${result.id}`);

    // ── Base44 SadbAlert: Michael per Telegram benachrichtigen ──
    // Non-blocking: Fehler beim Alert-Aufruf blockieren NICHT die Ticket-Erstellung.
    try {
      const SADB_SECRET = Deno.env.get("SADB_WEBHOOK_SECRET") ?? "";
      const BASE44_FUNC_URL = "https://superagent-c4e431a5.base44.app/functions/supportTicketAlert";
      const alertRes = await fetch(BASE44_FUNC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sadb-secret": SADB_SECRET,
        },
        body: JSON.stringify({
          item_id:       ticketNumber,
          item_title:    `[${ticketNumber}] ${subject || "Support-Anfrage"}`,
          ticket_number: ticketNumber,
          subject:      subject || "",
          priority:      body?.priority || "normal",
          category:      body?.category || "",
          name:          name || "",
          email:         email || "",
        }),
      });
      const alertJson = await alertRes.json().catch(() => ({}));
      console.log(`[send-ticket-confirmation] SadbAlert: ${alertRes.status}`, JSON.stringify(alertJson));
    } catch (alertErr) {
      console.warn("[send-ticket-confirmation] SadbAlert (non-blocking):", alertErr);
    }

    return new Response(JSON.stringify({ ok: true, email_sent: true, id: result.id }), {
      status: 200, headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error(`[send-ticket-confirmation] Unexpected error: ${err}`);
    // Non-blocking on error too
    return new Response(JSON.stringify({ ok: true, email_sent: false, error: String(err) }), {
      status: 200, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
