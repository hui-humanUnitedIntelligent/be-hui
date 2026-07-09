#!/usr/bin/env node
// scripts/test-og.mjs — lokaler Smoke-Test für OpenGraph-Endpunkte
import ogHandler from "../api/og.js";
import ogImageHandler from "../api/og-image.js";
import { resolveContent, contentToOgPayload } from "../api/_og-shared.js";

const BOT_UA = "facebookexternalhit/1.1";
const BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(code) { this.statusCode = code; return this; },
    send(data) { this.body = data; return this; },
    end(data) { if (data) this.body = data; return this; },
  };
  return res;
}

async function testOgHtml(type, id) {
  const req = {
    url: `/api/og?path=/${type}/${id}`,
    headers: { "user-agent": BOT_UA },
  };
  const res = mockRes();
  await ogHandler(req, res);
  const html = String(res.body || "");
  const tags = {
    status: res.statusCode,
    ogTitle: html.match(/property="og:title"\s+content="([^"]*)"/)?.[1],
    ogDesc: html.match(/property="og:description"\s+content="([^"]*)"/)?.[1],
    ogImage: html.match(/property="og:image"\s+content="([^"]*)"/)?.[1],
    twitterCard: html.match(/name="twitter:card"\s+content="([^"]*)"/)?.[1],
    canonical: html.match(/rel="canonical"\s+href="([^"]*)"/)?.[1],
    genericTitle: html.includes("HUI — Human United Intelligent") && !html.includes("veröffentlicht") && !html.includes("Werk von"),
  };
  return tags;
}

async function testOgImage(type, id) {
  const path = type ? `/api/og-image/${type}/${id}` : "/api/og-image/default";
  const req = { url: path, headers: {} };
  const res = mockRes();
  await ogImageHandler(req, res);
  return {
    status: res.statusCode,
    contentType: res.headers["content-type"],
    cacheControl: res.headers["cache-control"],
    bodySize: res.body?.length || 0,
  };
}

async function testBrowserRedirect() {
  const req = { url: "/api/og?path=/beitrag/test", headers: { "user-agent": BROWSER_UA } };
  const res = mockRes();
  await ogHandler(req, res);
  return { status: res.statusCode, location: res.headers.location };
}

console.log("=== HUI OpenGraph Smoke Test ===\n");

// Browser redirect (must stay 302)
const redirect = await testBrowserRedirect();
console.log("Browser redirect:", redirect.status === 302 ? "✓ 302" : `✗ ${redirect.status}`);

// Default image
const defImg = await testOgImage();
console.log("Default image:", defImg.status === 200 && defImg.contentType === "image/jpeg" && defImg.bodySize > 1000
  ? `✓ ${defImg.bodySize} bytes JPEG` : `✗ ${JSON.stringify(defImg)}`);

// Content resolution unit tests (no DB needed for structure)
const samples = [
  { fn: () => ({ title: "Michael hat einen neuen Beitrag veröffentlicht", ogType: "beitrag", ogId: "abc" }), label: "Beitrag title template" },
  { fn: () => ({ title: "Schönes Haus – Werk von Michael", ogType: "werke", ogId: "haus" }), label: "Werk title template" },
];

for (const s of samples) {
  const c = s.fn();
  const payload = contentToOgPayload(c);
  const ok = payload.imageUrl.startsWith("https://") && payload.imageUrl.includes("/api/og-image/");
  console.log(`${s.label}:`, ok ? `✓ ${payload.imageUrl}` : `✗ ${payload.imageUrl}`);
}

// Live DB tests (optional — only if env vars set)
if (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY) {
  console.log("\n--- Live DB tests ---");
  for (const [type, id] of [["beitrag", process.env.OG_TEST_BEITRAG_ID]].filter(([, id]) => id)) {
    const content = await resolveContent(type, id);
    if (content) {
      const r = await testOgHtml(type, id);
      console.log(`${type}/${id}:`, r);
    }
  }
} else {
  console.log("\n(Skipping live DB tests — no SUPABASE_SERVICE_ROLE_KEY)");
}

console.log("\nDone.");
