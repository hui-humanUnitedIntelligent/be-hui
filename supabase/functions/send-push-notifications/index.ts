// HUI Push Notification Edge Function v3 (auto-deactivates stale tokens)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const FCM_PROJECT_ID   = Deno.env.get("FCM_PROJECT_ID") || "";
const FCM_CLIENT_EMAIL  = Deno.env.get("FCM_CLIENT_EMAIL") || "";
const FCM_PRIVATE_KEY   = Deno.env.get("FCM_PRIVATE_KEY") || "";

function jsonResp(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function dbSelect(table: string, columns: string, filter: Record<string, unknown>, limit = 50, order?: string) {
  const params = new URLSearchParams();
  params.set("select", columns);
  for (const [k, v] of Object.entries(filter)) {
    params.set(k, `eq.${v}`);
  }
  if (order) params.set("order", order);
  params.set("limit", String(limit));
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;
  const resp = await fetch(url, {
    headers: { "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` },
  });
  if (!resp.ok) throw new Error(`dbSelect ${table}: ${resp.status} ${await resp.text()}`);
  return await resp.json();
}

async function dbUpdate(table: string, data: Record<string, unknown>, filter: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) {
    params.set(k, `eq.${v}`);
  }
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;
  const resp = await fetch(url, {
    method: "PATCH",
    headers: { "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
    body: JSON.stringify(data),
  });
  if (!resp.ok) throw new Error(`dbUpdate ${table}: ${resp.status} ${await resp.text()}`);
}

async function dbMaybeSingle(table: string, columns: string, filter: Record<string, unknown>) {
  const results = await dbSelect(table, columns, filter, 1);
  return results.length > 0 ? results[0] : null;
}

async function strToAb(str: string): Promise<ArrayBuffer> {
  const pem = str.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\s/g, "");
  const binary = atob(pem);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function getAccessToken(): Promise<string> {
  if (!FCM_PROJECT_ID || !FCM_CLIENT_EMAIL || !FCM_PRIVATE_KEY) throw new Error("FCM env vars not configured");
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = { iss: FCM_CLIENT_EMAIL, scope: "https://www.googleapis.com/auth/firebase.messaging", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 };
  const b64url = (obj: object) => btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unsigned = `${b64url(header)}.${b64url(payload)}`;
  const keyData = FCM_PRIVATE_KEY.replace(/\\n/g, "\n");
  const key = await crypto.subtle.importKey("pkcs8", await strToAb(keyData), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const jwt = `${unsigned}.${sigB64}`;
  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!tokenResp.ok) throw new Error(`OAuth2 token error: ${await tokenResp.text()}`);
  const tokenData = await tokenResp.json();
  return tokenData.access_token;
}

async function sendFCM(token: string, title: string, body: string, data: Record<string, unknown>): Promise<{ ok: boolean; error?: string; unregistered?: boolean }> {
  try {
    const accessToken = await getAccessToken();
    const url = `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`;
    const message = {
      message: {
        token,
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v ?? "")])),
        android: { priority: "high", notification: { channel_id: "hui_notifications", icon: "@drawable/ic_notification", color: "#0EC4B8" } },
      },
    };
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      const unregistered = errText.includes("UNREGISTERED") || errText.includes("NotRegistered");
      return { ok: false, error: `FCM ${resp.status}: ${errText}`, unregistered };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message || "Unknown FCM error" };
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method === "GET") {
      return jsonResp({ status: "ok", fcm_configured: !!FCM_PROJECT_ID, supabase_url: SUPABASE_URL.substring(0, 30) });
    }

    const url = new URL(req.url);
    const debug = url.searchParams.get("debug") === "1";

    const pending = await dbSelect("notifications_outbox", "id,user_id,type,title,body,data,retry_count,category", { status: "pending" }, 50, "created_at.asc");
    if (!pending || pending.length === 0) return jsonResp({ sent: 0, message: "No pending notifications" });

    let sent = 0, skipped = 0, failed = 0;
    const staleTokens: string[] = [];
    const debugInfo: unknown[] = [];

    for (const entry of pending) {
      const settings = await dbMaybeSingle("user_notification_settings", "push_enabled,push_buchungen,push_kauf_verkauf,push_informativ", { user_id: entry.user_id });
      if (!settings) {
        await dbUpdate("notifications_outbox", { status: "skipped", error_message: "No settings found", sent_at: new Date().toISOString() }, { id: entry.id });
        skipped++; continue;
      }
      const categoryFlag = entry.category === "buchungen" ? settings.push_buchungen : entry.category === "kauf_verkauf" ? settings.push_kauf_verkauf : settings.push_informativ;
      if (!settings.push_enabled || categoryFlag === false) {
        await dbUpdate("notifications_outbox", { status: "skipped", sent_at: new Date().toISOString() }, { id: entry.id });
        skipped++; continue;
      }

      const tokens = await dbSelect("user_device_tokens", "token", { user_id: entry.user_id, is_active: "true" }, 20);
      if (!tokens || tokens.length === 0) {
        await dbUpdate("notifications_outbox", { status: "skipped", error_message: "No active device tokens", sent_at: new Date().toISOString() }, { id: entry.id });
        skipped++; continue;
      }

      let allOk = true;
      const fcmErrors: string[] = [];
      for (const { token } of tokens) {
        const result = await sendFCM(token, entry.title || "HUI", entry.body || "", entry.data || {});
        if (!result.ok) {
          allOk = false;
          fcmErrors.push(result.error || "unknown");
          if (result.unregistered) staleTokens.push(token);
        }
      }

      if (allOk) {
        await dbUpdate("notifications_outbox", { status: "sent", sent_at: new Date().toISOString() }, { id: entry.id });
        sent++;
      } else {
        const nextRetry = (entry.retry_count || 0) + 1;
        if (nextRetry >= 3) {
          await dbUpdate("notifications_outbox", { status: "failed", retry_count: nextRetry, error_message: fcmErrors.join("; "), sent_at: new Date().toISOString() }, { id: entry.id });
        } else {
          await dbUpdate("notifications_outbox", { status: "pending", retry_count: nextRetry, error_message: fcmErrors.join("; ") }, { id: entry.id });
        }
        failed++;
        if (debug) debugInfo.push({ id: entry.id, result: "fcm_failed", errors: fcmErrors, token_count: tokens.length });
      }
    }

    // Deactivate stale tokens (FCM returned UNREGISTERED)
    for (const token of staleTokens) {
      try {
        await dbUpdate("user_device_tokens", { is_active: false }, { token, is_active: "true" });
        console.log(`Deactivated stale token: ${token.substring(0, 15)}...`);
      } catch (e) {
        console.warn(`Failed to deactivate stale token: ${e?.message}`);
      }
    }

    return jsonResp({ sent, skipped, failed, total: pending.length, stale_tokens_deactivated: staleTokens.length, debug: debug ? debugInfo : undefined });
  } catch (e) {
    console.error("send-push-notifications error:", e);
    return jsonResp({ error: e?.message || "Unknown error" }, 500);
  }
});
