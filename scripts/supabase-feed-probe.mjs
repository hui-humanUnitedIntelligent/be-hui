#!/usr/bin/env node
/**
 * HUI RC1-005 — Direct Supabase feed queries (same as fetchFeedPage Step 1)
 * Real HTTP responses, no mocks.
 */
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://gxztrhvhcxhmunhhkfjd.supabase.co";
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY
  || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enRyaHZoY3hobXVuaGhrZmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4ODI2NDIsImV4cCI6MjA5MzQ1ODY0Mn0.cq8E_NQkmeTZPIe0G0SSqEzzg6yJhyce5xpW2iwVIbk";

const LIMIT = 10;
const headers = {
  apikey: SUPABASE_ANON,
  Authorization: `Bearer ${SUPABASE_ANON}`,
  Accept: "application/json",
};

async function query(table, params) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;
  const res = await fetch(url, { headers });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { url, httpStatus: res.status, ok: res.ok, count: Array.isArray(data) ? data.length : null, data, error: !res.ok ? data : null };
}

async function main() {
  const started = Date.now();
  const [works, exps, beitr] = await Promise.all([
    query("works", "select=id,title,created_at,user_id&status=eq.published&approval_status=eq.approved&order=created_at.desc&limit=" + LIMIT),
    query("experiences", "select=id,title,created_at,user_id&status=eq.published&approval_status=eq.approved&order=created_at.desc&limit=" + LIMIT),
    query("beitraege", "select=id,user_id,type,caption,created_at&order=created_at.desc&limit=" + LIMIT),
  ]);

  const rawCount = (works.count || 0) + (exps.count || 0) + (beitr.count || 0);
  const out = {
    capturedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    supabaseUrl: SUPABASE_URL,
    sql: {
      works: { table: "works", filters: { status: "published", approval_status: "approved" }, limit: LIMIT },
      experiences: { table: "experiences", filters: { status: "published", approval_status: "approved" }, limit: LIMIT },
      beitraege: { table: "beitraege", filters: {}, limit: LIMIT },
    },
    rpc: null,
    responses: { works, experiences: exps, beitraege: beitr },
    rawItemsLength: rawCount,
    httpErrors: [works, exps, beitr].filter((r) => !r.ok).map((r) => ({ table: r.url, status: r.httpStatus, error: r.error })),
  };

  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
