#!/usr/bin/env node
// Lokaler Smoke-Test für api/og.js — prüft OG-Meta-Tags (kein index.html).
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const handler = require("../api/og.js");

function mockRes() {
  const headers = {};
  return {
    statusCode: 200,
    body: "",
    headers,
    setHeader(k, v) {
      headers[k.toLowerCase()] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
    end() {
      return this;
    },
  };
}

async function runCase(label, req) {
  const res = mockRes();
  await handler(req, res);
  const html = res.body || "";
  const isIndex =
    html.includes('id="root"') ||
    (html.includes("HUI Chunk Recovery") && !html.includes('property="og:title"'));
  const hasOg =
    html.includes('property="og:title"') &&
    html.includes('property="og:description"') &&
    html.includes('property="og:image"');

  console.log(`\n=== ${label} ===`);
  console.log("status:", res.statusCode);
  console.log("content-type:", res.headers["content-type"] || "(none)");
  console.log("og tags:", hasOg ? "OK" : "MISSING");
  console.log("index.html leak:", isIndex ? "YES (FAIL)" : "no");

  if (!hasOg || isIndex) process.exitCode = 1;
  return { hasOg, isIndex, html };
}

await runCase("/api/og (bot, no path)", {
  url: "/api/og",
  headers: { "user-agent": "facebookexternalhit/1.1" },
});

await runCase("/api/og?path=/beitrag/test (bot)", {
  url: "/api/og?path=/beitrag/test",
  headers: { "user-agent": "WhatsApp/2.23.20" },
});

const browser = mockRes();
await handler(
  { url: "/api/og?path=/beitrag/test", headers: { "user-agent": "Mozilla/5.0" } },
  browser
);
console.log("\n=== browser (non-bot) ===");
console.log("status:", browser.statusCode);
console.log("redirect:", browser.headers.location || "(none)");
if (browser.statusCode !== 302) process.exitCode = 1;

if (process.exitCode) {
  console.error("\n✗ OG handler smoke test failed");
  process.exit(1);
}
console.log("\n✓ OG handler smoke test passed");
