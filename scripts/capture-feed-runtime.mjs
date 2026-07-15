#!/usr/bin/env node
/**
 * HUI RC1-005 — Capture window.__HUI_FEED_RUNTIME__ from running app
 * Uses Playwright headless browser against local Vite dev server.
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.FEED_CAPTURE_URL || "http://127.0.0.1:5173";
const OUT_DIR = process.env.FEED_CAPTURE_OUT || join(process.cwd(), "artifacts/rc1-005");
const WAIT_MS = Number(process.env.FEED_CAPTURE_WAIT_MS || 15000);
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://gxztrhvhcxhmunhhkfjd.supabase.co";
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY
  || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enRyaHZoY3hobXVuaGhrZmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4ODI2NDIsImV4cCI6MjA5MzQ1ODY0Mn0.cq8E_NQkmeTZPIe0G0SSqEzzg6yJhyce5xpW2iwVIbk";

async function createSession() {
  const email = `hui-rc1-005-cap-${Date.now()}@cursor-agent.local`;
  const password = "HuiRc1005!Agent";
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
  await sb.auth.signUp({ email, password });
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return {
    email,
    storageKey: "hui-auth-token",
    session: data.session,
  };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const auth = await createSession();
  console.log("Authenticated as", auth.email);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  await context.addInitScript(({ storageKey, session }) => {
    localStorage.setItem(storageKey, JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      token_type: session.token_type,
      user: session.user,
    }));
    const uid = session.user?.id;
    if (uid) {
      localStorage.setItem(`hui_welcome_seen:${uid}`, "true");
    }
    localStorage.setItem("hui_profile_completed", "true");
    localStorage.setItem("hui_welcome_seen", "true");
  }, { storageKey: auth.storageKey, session: auth.session });

  const consoleLogs = [];
  page.on("console", (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on("pageerror", (err) => consoleLogs.push(`[pageerror] ${err.message}`));

  console.log(`Navigating to ${BASE}/Home ...`);
  await page.goto(`${BASE}/Home`, { waitUntil: "networkidle", timeout: 90000 }).catch(() =>
    page.goto(`${BASE}/Home`, { waitUntil: "domcontentloaded", timeout: 90000 })
  );

  console.log(`Waiting ${WAIT_MS}ms for feed runtime ...`);
  await page.waitForTimeout(WAIT_MS);

  // Direktprobe: fetchFeedPage im Browser-Kontext (echte Runtime, kein Mock)
  const directProbe = await page.evaluate(async () => {
    try {
      const mod = await import("/src/feed/useFeedStream.js");
      if (!mod.fetchFeedPage) return { error: "fetchFeedPage not exported" };
      const t0 = performance.now();
      const result = await mod.fetchFeedPage(null, null);
      return {
        ok: true,
        durationMs: Math.round(performance.now() - t0),
        itemsLength: result?.items?.length ?? null,
        hasMore: result?.hasMore ?? null,
        firstIds: (result?.items || []).slice(0, 3).map((i) => i.id),
      };
    } catch (err) {
      return {
        ok: false,
        error: err?.message || String(err),
        stack: (err?.stack || "").split("\n").slice(0, 8),
      };
    }
  });
  console.log("Direct fetchFeedPage probe:", JSON.stringify(directProbe, null, 2));

  const runtime = await page.evaluate(() => {
    const rt = window.__HUI_FEED_RUNTIME__;
    if (!rt) return { error: "__HUI_FEED_RUNTIME__ not found" };
    return JSON.parse(rt.exportJSON ? rt.exportJSON() : JSON.stringify(rt));
  });

  const streamDebug = await page.evaluate(() => window.__HUI_STREAM_DEBUG__ || null);
  const feedReality = await page.evaluate(() => window.__HUI_FEED_REALITY__ || null);
  const screenshotPath = join(OUT_DIR, "runtime-screenshot.png");
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const payload = {
    capturedAt: new Date().toISOString(),
    url: `${BASE}/Home`,
    authEmail: auth.email,
    waitMs: WAIT_MS,
    runtime,
    streamDebug,
    feedReality,
    directProbe,
    consoleLogs: consoleLogs.slice(-120),
  };

  const jsonPath = join(OUT_DIR, "runtime-capture.json");
  writeFileSync(jsonPath, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${screenshotPath}`);

  if (runtime?.firstWrongVariable) {
    console.log("\n=== FIRST WRONG VARIABLE ===");
    console.log(JSON.stringify(runtime.firstWrongVariable, null, 2));
  }
  if (runtime?.fetchFeedPage?.error) {
    console.log("\n=== fetchFeedPage ERROR ===");
    console.log(runtime.fetchFeedPage.error);
  }
  if (runtime?.snapshots?.length) {
    console.log("\n=== TIMELINE (last 20) ===");
    runtime.snapshots.slice(-20).forEach((s) => {
      console.log(`${s.ms} ms — ${s.label}${s.detail ? ": " + s.detail : ""}`);
    });
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
