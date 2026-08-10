// supabase/functions/send-push-notifications/index.ts
// HUI Push Notification Edge Function
// Liest pending Einträge aus notifications_outbox, sendet via FCM HTTP v1 API.
// Wird getriggert durch: DB Webhook (notifications INSERT) ODER pg_cron (periodisch).
//
// Requirements:
//   - FCM_PROJECT_ID env var (Firebase project ID)
//   - FCM_CLIENT_EMAIL env var (Firebase service account client email)
//   - FCM_PRIVATE_KEY env var (Firebase service account private key)
//   - SUPABASE_URL env var (auto-provided by Supabase)
//   - SUPABASE_SERVICE_ROLE_KEY env var (auto-provided by Supabase)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// FCM Config
const FCM_PROJECT_ID   = Deno.env.get("FCM_PROJECT_ID");
const FCM_CLIENT_EMAIL = Deno.env.get("FCM_CLIENT_EMAIL");
const FCM_PRIVATE_KEY  = Deno.env.get("FCM_PRIVATE_KEY");

// ─── OAuth2 Access Token für FCM v1 API ────────────────────────────────────
async function getAccessToken(): Promise<string> {
  if (!FCM_PROJECT_ID || !FCM_CLIENT_EMAIL || !FCM_PRIVATE_KEY) {
    throw new Error("FCM env vars not configured");
  }

  // JWT erstellen (RS256)
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: FCM_CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  // Base64url encode
  const b64url = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const unsigned = `${b64url(header)}.${b64url(payload)}`;

  // Sign with private key
  const keyData = FCM_PRIVATE_KEY.replace(/\\n/g, "\n");
  const key = await crypto.subtle.importKey(
    "pkcs8",
    await strToAb(keyData),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const jwt = `${unsigned}.${sigB64}`;

  // Exchange JWT for access token
  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResp.ok) {
    const err = await tokenResp.text();
    throw new Error(`OAuth2 token error: ${err}`);
  }

  const tokenData = await tokenResp.json();
  return tokenData.access_token;
}

async function strToAb(str: string): Promise<ArrayBuffer> {
  // Convert PEM private key to ArrayBuffer
  const pem = str
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binary = atob(pem);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// ─── Send FCM Message ───────────────────────────────────────────────────────
async function sendFCM(
  token: string,
  title: string,
  body: string,
  data: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const accessToken = await getAccessToken();
    const url = `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`;

    const message = {
      message: {
        token,
        notification: { title, body },
        data: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v ?? "")])
        ),
        android: {
          priority: "high",
          notification: {
            channel_id: "hui_notifications",
            icon: "@drawable/ic_notification",
            color: "#0EC4B8",
          },
        },
      },
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return { ok: false, error: `FCM ${resp.status}: ${errText}` };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message || "Unknown FCM error" };
  }
}

// ─── Main Handler ───────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    // 1. Pending notifications aus outbox holen (max 50 pro Durchlauf)
    const { data: pending, error: fetchErr } = await supabase
      .from("notifications_outbox")
      .select("id, user_id, type, title, body, data, retry_count, category")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchErr) {
      return json({ error: fetchErr.message }, 500);
    }

    if (!pending || pending.length === 0) {
      return json({ sent: 0, message: "No pending notifications" });
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const entry of pending) {
      // 2. Pruefen ob push_enabled = true UND die Kategorie dieser Notification
      //    individuell aktiviert ist (RESONANZ-BUCHUNG-001: Buchungen / Kauf & Verkauf /
      //    Informativ einzeln deaktivierbar). entry.category wird bereits beim Insert
      //    in notifications_outbox durch fn_notification_category() gesetzt (SSOT).
      const { data: settings } = await supabase
        .from("user_notification_settings")
        .select("push_enabled, push_buchungen, push_kauf_verkauf, push_informativ")
        .eq("user_id", entry.user_id)
        .single();

      const categoryFlag = entry.category === "buchungen"
        ? settings?.push_buchungen
        : entry.category === "kauf_verkauf"
        ? settings?.push_kauf_verkauf
        : settings?.push_informativ;

      if (!settings?.push_enabled || categoryFlag === false) {
        // Skip — push ist deaktiviert (global oder fuer diese Kategorie)
        await supabase
          .from("notifications_outbox")
          .update({ status: "skipped", sent_at: new Date().toISOString() })
          .eq("id", entry.id);
        skipped++;
        continue;
      }

      // 3. Aktive Device Tokens holen
      const { data: tokens } = await supabase
        .from("user_device_tokens")
        .select("token")
        .eq("user_id", entry.user_id)
        .eq("is_active", true);

      if (!tokens || tokens.length === 0) {
        // Kein Token → skip
        await supabase
          .from("notifications_outbox")
          .update({ status: "skipped", error_message: "No active device tokens", sent_at: new Date().toISOString() })
          .eq("id", entry.id);
        skipped++;
        continue;
      }

      // 4. An alle Tokens senden
      let allOk = true;
      for (const { token } of tokens) {
        const result = await sendFCM(
          token,
          entry.title || "HUI",
          entry.body || "",
          entry.data || {}
        );
        if (!result.ok) {
          allOk = false;
          console.warn(`FCM error for token ${token.substring(0, 15)}...: ${result.error}`);
        }
      }

      // 5. Outbox-Status aktualisieren
      if (allOk) {
        await supabase
          .from("notifications_outbox")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", entry.id);
        sent++;
      } else {
        // Retry logic: max 3 retries
        const nextRetry = (entry.retry_count || 0) + 1;
        if (nextRetry >= 3) {
          await supabase
            .from("notifications_outbox")
            .update({ status: "failed", retry_count: nextRetry, error_message: "Max retries exceeded", sent_at: new Date().toISOString() })
            .eq("id", entry.id);
          failed++;
        } else {
          await supabase
            .from("notifications_outbox")
            .update({ status: "pending", retry_count: nextRetry, error_message: "Partial send failure" })
            .eq("id", entry.id);
          failed++;
        }
      }
    }

    return json({ sent, skipped, failed, total: pending.length });
  } catch (e) {
    console.error("send-push-notifications error:", e);
    return json({ error: e?.message || "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
