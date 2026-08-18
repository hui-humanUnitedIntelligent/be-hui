// HUI Push Notification Edge Function v4
// FIX (2026-08-18): Doppelte Push-Benachrichtigungen behoben.
//
// ROOT CAUSE: v3 holte sich per SELECT alle status='pending' Zeilen und
// markierte sie ERST NACH dem FCM-Versand als 'sent'. Das ist ein klassisches
// TOCTOU-Race: der DB-Webhook-Trigger (trg_push_outbox_to_edge) ruft diese
// Function per pg_net "fire-and-forget" auf -- pg_net kann bei Timeouts/
// Netzwerk-Hakeln denselben Request erneut ausloesen, und weil zwei parallele
// Aufrufe beide dieselbe(n) "pending"-Zeile(n) lesen koennen BEVOR die erste
// sie auf 'sent' setzt, wird an dieselben Geraete-Tokens zweimal per FCM
// gesendet -> Nutzer sieht die Nachricht doppelt.
//
// FIX: Atomarer Claim per bedingtem UPDATE (status='pending' -> 'sending')
// VOR dem Versand. Ein UPDATE mit WHERE status='pending' ist atomar -- nur
// EIN gleichzeitiger Aufruf kann die Zeile erfolgreich auf 'sending' claimen;
// der andere bekommt 0 betroffene Zeilen zurueck und bricht fuer diese Zeile
// ab, statt nochmal zu senden. Zusaetzlich wird der bereits vom DB-Trigger
// mitgeschickte `outbox_id` jetzt tatsaechlich genutzt (v3 ignorierte ihn
// komplett und scannte immer bis zu 50 Zeilen).
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

// Atomarer Claim: gibt die geclaimte(n) Zeile(n) zurueck, oder [] wenn eine
// andere (parallele) Invocation die Zeile bereits geclaimt hat.
async function dbClaim(table: string, data: Record<string, unknown>, filter: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) {
    params.set(k, `eq.${v}`);
  }
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;
  const resp = await fetch(url, {
    method: "PATCH",
    headers: { "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" },
    body: JSON.stringify(data),
  });
  if (!resp.ok) throw new Error(`dbClaim ${table}: ${resp.status} ${await resp.text()}`);
  return await resp.json();
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

// Verarbeitet EINE bereits geclaimte (status='sending') outbox-Zeile.
async function processClaimedEntry(entry: { id: string; user_id: string; type: string; title?: string; body?: string; data?: Record<string, unknown>; retry_count?: number; category?: string }) {
  const staleTokens: string[] = [];

  const settings = await dbMaybeSingle("user_notification_settings", "push_enabled,push_buchungen,push_kauf_verkauf,push_informativ", { user_id: entry.user_id });
  if (!settings) {
    await dbUpdate("notifications_outbox", { status: "skipped", error_message: "No settings found", sent_at: new Date().toISOString() }, { id: entry.id });
    return { outcome: "skipped" as const, staleTokens };
  }
  const categoryFlag = entry.category === "buchungen" ? settings.push_buchungen : entry.category === "kauf_verkauf" ? settings.push_kauf_verkauf : settings.push_informativ;
  if (!settings.push_enabled || categoryFlag === false) {
    await dbUpdate("notifications_outbox", { status: "skipped", sent_at: new Date().toISOString() }, { id: entry.id });
    return { outcome: "skipped" as const, staleTokens };
  }

  const tokens = await dbSelect("user_device_tokens", "token", { user_id: entry.user_id, is_active: "true" }, 20);
  if (!tokens || tokens.length === 0) {
    await dbUpdate("notifications_outbox", { status: "skipped", error_message: "No active device tokens", sent_at: new Date().toISOString() }, { id: entry.id });
    return { outcome: "skipped" as const, staleTokens };
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
    return { outcome: "sent" as const, staleTokens };
  }

  const nextRetry = (entry.retry_count || 0) + 1;
  if (nextRetry >= 3) {
    await dbUpdate("notifications_outbox", { status: "failed", retry_count: nextRetry, error_message: fcmErrors.join("; "), sent_at: new Date().toISOString() }, { id: entry.id });
  } else {
    // Zurueck auf 'pending' fuer einen spaeteren Retry-Sweep -- die naechste
    // Invocation muss die Zeile erneut ueber dbClaim() atomar claimen.
    await dbUpdate("notifications_outbox", { status: "pending", retry_count: nextRetry, error_message: fcmErrors.join("; ") }, { id: entry.id });
  }
  return { outcome: "failed" as const, staleTokens, errors: fcmErrors };
}

Deno.serve(async (req) => {
  try {
    if (req.method === "GET") {
      return jsonResp({ status: "ok", fcm_configured: !!FCM_PROJECT_ID, supabase_url: SUPABASE_URL.substring(0, 30), version: "v4-atomic-claim" });
    }

    let outboxId: string | undefined;
    try {
      const body = await req.json();
      outboxId = body?.outbox_id;
    } catch {
      // kein/leerer Body ist ok (z.B. manueller Cron-Sweep ohne outbox_id)
    }

    // Kandidaten ermitteln: entweder gezielt die vom Webhook-Trigger
    // uebergebene Zeile, oder (Fallback-Sweep, z.B. Retry-Cron) bis zu 50
    // aeltere pending-Zeilen.
    const candidateIds: string[] = [];
    if (outboxId) {
      candidateIds.push(outboxId);
    } else {
      const pending = await dbSelect("notifications_outbox", "id", { status: "pending" }, 50, "created_at.asc");
      for (const p of pending) candidateIds.push(p.id);
    }

    if (candidateIds.length === 0) return jsonResp({ sent: 0, message: "No pending notifications" });

    let sent = 0, skipped = 0, failed = 0, alreadyClaimed = 0;
    const staleTokensAll: string[] = [];
    const debugInfo: unknown[] = [];

    for (const id of candidateIds) {
      // ATOMARER CLAIM: nur wenn status noch 'pending' ist, wird auf
      // 'sending' gesetzt UND die Zeile zurueckgegeben. Eine parallele
      // Invocation, die dieselbe Zeile schon geclaimt hat, bekommt hier [].
      const claimed = await dbClaim(
        "notifications_outbox",
        { status: "sending" },
        { id, status: "pending" }
      );
      if (!claimed || claimed.length === 0) {
        alreadyClaimed++;
        continue;
      }

      const entry = claimed[0];
      const result = await processClaimedEntry(entry);
      if (result.outcome === "sent") sent++;
      else if (result.outcome === "skipped") skipped++;
      else failed++;
      staleTokensAll.push(...result.staleTokens);
      if ("errors" in result) debugInfo.push({ id: entry.id, errors: result.errors });
    }

    // Deactivate stale tokens (FCM returned UNREGISTERED)
    for (const token of staleTokensAll) {
      try {
        await dbUpdate("user_device_tokens", { is_active: false }, { token, is_active: "true" });
        console.log(`Deactivated stale token: ${token.substring(0, 15)}...`);
      } catch (e) {
        console.warn(`Failed to deactivate stale token: ${e?.message}`);
      }
    }

    return jsonResp({
      sent, skipped, failed, already_claimed_by_other_invocation: alreadyClaimed,
      total_candidates: candidateIds.length,
      stale_tokens_deactivated: staleTokensAll.length,
      debug: debugInfo.length ? debugInfo : undefined,
    });
  } catch (e) {
    console.error("send-push-notifications error:", e);
    return jsonResp({ error: e?.message || "Unknown error" }, 500);
  }
});
