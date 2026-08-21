// ═══════════════════════════════════════════════════════════════
// HUI Rate Limiting Utility (2026-08-21)
// Simple IP-based rate limiting using Supabase as backing store.
// Usage:
//   import { checkRateLimit } from "../_shared/rateLimit.ts";
//   const { allowed, remaining } = await checkRateLimit(req, "create-payment", 5, 60);
//   if (!allowed) return new Response("Too Many Requests", { status: 429 });
// ═══════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceKey);

/**
 * Check rate limit for a given action and IP.
 * @param req - The original Request object (for IP extraction)
 * @param action - Unique action identifier (e.g., "create-payment", "cast-vote")
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowSeconds - Time window in seconds
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export async function checkRateLimit(
  req: Request,
  action: string,
  maxRequests: number = 5,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  // Extract client IP from headers
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
    || req.headers.get("x-real-ip") 
    || "unknown";

  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;
  const key = `${action}:${ip}`;

  try {
    // Use upsert with atomic increment via RPC or direct insert+count
    // For simplicity: insert a row, then count in window
    const { error: insertError } = await supabase
      .from("_rate_limits")
      .insert({ key, action, ip, created_at: new Date().toISOString() });

    if (insertError) {
      // Table might not exist — fail open (allow request) rather than block
      console.warn("[rateLimit] Insert error:", insertError.message);
      return { allowed: true, remaining: maxRequests, resetAt: now + windowSeconds };
    }

    // Count requests in window
    const { count, error: countError } = await supabase
      .from("_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("key", key)
      .gte("created_at", new Date(windowStart * 1000).toISOString());

    if (countError) {
      console.warn("[rateLimit] Count error:", countError.message);
      return { allowed: true, remaining: maxRequests, resetAt: now + windowSeconds };
    }

    const requestCount = count || 0;
    const allowed = requestCount <= maxRequests;
    const remaining = Math.max(0, maxRequests - requestCount);

    // Cleanup old entries (fire-and-forget, non-blocking)
    if (Math.random() < 0.05) { // 5% chance per request → cleanup
      supabase
        .from("_rate_limits")
        .delete()
        .lt("created_at", new Date(windowStart * 1000).toISOString())
        .then(() => {});
    }

    return { allowed, remaining, resetAt: now + windowSeconds };
  } catch (e) {
    // Fail open — don't block legitimate requests if rate limiting has issues
    console.warn("[rateLimit] Error:", e);
    return { allowed: true, remaining: maxRequests, resetAt: now + windowSeconds };
  }
}

/**
 * Returns standard 429 response with rate limit headers.
 */
export function rateLimitResponse(resetAt: number): Response {
  return new Response(
    JSON.stringify({ error: "Too Many Requests" }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.max(1, resetAt - Math.floor(Date.now() / 1000))),
        "X-RateLimit-Limit": "exceeded",
      },
    }
  );
}
