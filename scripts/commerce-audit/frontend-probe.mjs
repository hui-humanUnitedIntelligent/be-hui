/**
 * Playwright frontend probe — tests app boot + commerce UI without live Supabase.
 */
import { chromium } from "playwright";
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

function serveDist(port = 4173) {
  const distDir = join(process.cwd(), "dist");
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let filePath = join(distDir, req.url === "/" ? "index.html" : req.url.split("?")[0]);
      if (!existsSync(filePath) || !extname(filePath)) {
        filePath = join(distDir, "index.html");
      }
      try {
        const data = readFileSync(filePath);
        res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "application/octet-stream" });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end("Not found");
      }
    });
    server.listen(port, () => resolve(server));
  });
}

const results = [];

function record(name, status, reason) {
  results.push({ name, status, reason });
  const icon = status === "pass" ? "✅" : status === "partial" ? "⚠️" : status === "skip" ? "⏭️" : "❌";
  console.log(`${icon} ${name}: ${reason}`);
}

async function main() {
  console.log("── Playwright Frontend Probe ──\n");

  // Build first
  const { execSync } = await import("child_process");
  try {
    execSync("npm run build", { stdio: "pipe" });
    record("Build", "pass", "npm run build erfolgreich");
  } catch (e) {
    record("Build", "fail", "Build fehlgeschlagen — kein Frontend-Test möglich");
    process.exit(1);
  }

  const server = await serveDist(4173);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  try {
    await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle", timeout: 30000 });
    record("App Boot", "pass", `Title: ${await page.title()}`);
  } catch (e) {
    record("App Boot", "fail", String(e.message));
  }

  // Check Supabase warning in console (expected without .env.local)
  const supabaseWarn = consoleErrors.some((e) => e.includes("Supabase") || e.includes("VITE_"));
  record("Supabase Config Warning", supabaseWarn ? "pass" : "partial",
    supabaseWarn ? "App zeigt erwartete Config-Warnung ohne Credentials" : "Keine explizite Warnung in Console");

  // Check commerce modules are in bundle
  const bundleFiles = require("fs").readdirSync(join(process.cwd(), "dist/assets"))
    .filter((f) => f.endsWith(".js"));
  const bundleContent = bundleFiles.map((f) =>
    readFileSync(join(process.cwd(), "dist/assets", f), "utf8")
  ).join("");
  
  const hasStripe = bundleContent.includes("stripe") || bundleContent.includes("Stripe");
  const hasUnterstutzen = bundleContent.includes("Unterst") || bundleContent.includes("payment-intent");
  record("Stripe SDK im Bundle", hasStripe ? "pass" : "fail", hasStripe ? "stripe-js gebundelt" : "nicht gefunden");
  record("Commerce Flow im Bundle", hasUnterstutzen ? "pass" : "partial", "Commerce-Komponenten im Build");

  // Stripe Payment Element requires clientSecret — cannot render without API
  record("Stripe Payment Element Render", "skip", "Erfordert clientSecret von create-payment-intent");

  await browser.close();
  server.close();

  console.log(`\nFrontend Probe: ${results.filter((r) => r.status === "pass").length} pass`);
}

main().catch(console.error);
