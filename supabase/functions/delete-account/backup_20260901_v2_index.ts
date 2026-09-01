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
//   4. Bestätigungs-E-Mail an die (vorher gesicherte) E-Mail-Adresse senden
//      via Resend API — bestätigt die Löschung und deren Unwiderruflichkeit.
// ═══════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

// CORS: jetzt per getCorsHeaders(req) — dynamisch und restriktiv (SICHERHEITSFIX 2026-08-26)

// ── Bestätigungs-E-Mail nach Account-Löschung ──────────────────────
async function sendDeletionConfirmationEmail(email: string, username: string): Promise<void> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping deletion confirmation email')
    return
  }

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;color:#1a1a18;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0EC4B8,#08A39B);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;letter-spacing:-0.01em;">HUI</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Human United Intelligence</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px 8px;">
              <h2 style="margin:0 0 16px;color:#1a1a18;font-size:18px;font-weight:600;">Dein Account wurde gelöscht</h2>
              <p style="margin:0 0 14px;color:#4a4a48;font-size:14px;line-height:1.6;">
                Hallo ${username},
              </p>
              <p style="margin:0 0 14px;color:#4a4a48;font-size:14px;line-height:1.6;">
                wir bestätigen hiermit, dass dein HUI-Account und alle zugehörigen Daten
                unwiderruflich gelöscht wurden. Diese Aktion kann <strong style="color:#1a1a18;">nicht rückgängig gemacht werden</strong>.
              </p>
              <p style="margin:0 0 14px;color:#4a4a48;font-size:14px;line-height:1.6;">
                Folgendes wurde entfernt:
              </p>
              <ul style="margin:0 0 14px;padding-left:20px;color:#4a4a48;font-size:14px;line-height:1.8;">
                <li>Dein Profil und alle Profildaten</li>
                <li>Deine Werke, Momente und Erlebnisse</li>
                <li>Deine Talent-Angebote und Buchungen</li>
                <li>Deine Chat-Nachrichten (Inhalte durch Platzhalter ersetzt)</li>
                <li>Deine Follows, Favoriten und Reaktionen</li>
                <li>Transaktionsdaten wurden anonymisiert (Aufbewahrungspflicht DSGVO Art. 17(3)(b))</li>
              </ul>
              <p style="margin:0 0 14px;color:#4a4a48;font-size:14px;line-height:1.6;">
                Deine E-Mail-Adresse ist ab sofort wieder frei für eine Neu-Registrierung,
                falls du zu HUI zurückkehren möchtest.
              </p>
            </td>
          </tr>

          <!-- Trennlinie -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #eee;margin:0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;">
              <p style="margin:0 0 8px;color:#8a8a96;font-size:12px;line-height:1.5;">
                Diese E-Mail wurde automatisch gesendet. Bitte antworte nicht auf diese Nachricht.
              </p>
              <p style="margin:0;color:#8a8a96;font-size:12px;line-height:1.5;">
                HUI — Human United Intelligence<br>
                <a href="https://be-hui.vercel.app" style="color:#0EC4B8;text-decoration:none;">be-hui.vercel.app</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `HUI — Account gelöscht

Hallo ${username},

wir bestätigen hiermit, dass dein HUI-Account und alle zugehörigen Daten unwiderruflich gelöscht wurden. Diese Aktion kann nicht rückgängig gemacht werden.

Entfernt wurden:
- Dein Profil und alle Profildaten
- Deine Werke, Momente und Erlebnisse
- Deine Talent-Angebote und Buchungen
- Deine Chat-Nachrichten (Inhalte durch Platzhalter ersetzt)
- Deine Follows, Favoriten und Reaktionen
- Transaktionsdaten wurden anonymisiert (Aufbewahrungspflicht DSGVO Art. 17(3)(b))

Deine E-Mail-Adresse ist ab sofort wieder frei für eine Neu-Registrierung.

Diese E-Mail wurde automatisch gesendet. Bitte antworte nicht auf diese Nachricht.

HUI — Human United Intelligence
be-hui.vercel.app`

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'HUI <noreply@hui.app>',
      to: email,
      subject: 'Dein HUI-Account wurde gelöscht',
      html,
      text,
    }),
  })

  if (!resp.ok) {
    const errBody = await resp.text()
    console.error('Resend email failed:', resp.status, errBody)
    // E-Mail-Fehler brechen nicht den Gesamterfolg ab — Account ist bereits gelöscht
  } else {
    console.log('Deletion confirmation email sent to:', email)
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // ── Rate Limiting (SCALE-006) ──
  const _rl = await checkRateLimit(req, "delete-account", 3, 60);
  if (!_rl.allowed) return rateLimitResponse(_rl.resetAt);

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
    const userEmail = userRes.user.email ?? ''
    const username = (userRes.user.user_metadata?.full_name) ||
                     (userRes.user.user_metadata?.username) ||
                     userEmail.split('@')[0] || 'Nutzer'

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

    // Schritt 3: Bestätigungs-E-Mail senden (Account ist bereits gelöscht —
    // E-Mail-Fehler brechen den Erfolg NICHT ab)
    if (userEmail) {
      try {
        await sendDeletionConfirmationEmail(userEmail, username)
      } catch (mailErr) {
        console.error('sendDeletionConfirmationEmail failed (non-blocking):', mailErr)
      }
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
