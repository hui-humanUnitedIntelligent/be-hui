#!/usr/bin/env node
// Prüft, dass vercel.json functions-Patterns zu echten api/*.js Functions passen.
import fs from "node:fs";
import path from "node:path";

const VERCEL_EXTENSIONS = new Set([".js", ".mjs", ".ts", ".tsx"]);
const BOT_UA_PATTERN =
  ".*([Ff]acebook[Ee]xternal[Hh]it|[Tt]witter[Bb]ot|[Ss]lack[Bb]ot|[Tt]elegram[Bb]ot|[Dd]iscord[Bb]ot|[Ll]inked[Ii]n[Bb]ot|[Ww]hats[Aa]pp|[Aa]pple[Bb]ot|[Gg]oogle[Bb]ot|[Bb]ing[Bb]ot|[Pp]interest|vkshare|ia_archiver|[Ii][Mm]essage|[Ss]ignal|[Xx]ing-contenttabreceiver).*";

const vercelJson = JSON.parse(fs.readFileSync("vercel.json", "utf8"));

const apiFiles = fs
  .readdirSync("api")
  .filter(
    (f) =>
      VERCEL_EXTENSIONS.has(path.extname(f)) &&
      !path.basename(f).startsWith("_")
  )
  .map((f) => `api/${f}`);

const patterns = Object.keys(vercelJson.functions || {});
const errors = [];

for (const pattern of patterns) {
  const matched = apiFiles.filter(
    (f) => f === pattern || f.startsWith(pattern.replace(/\*.*$/, ""))
  );
  if (matched.length === 0) {
    errors.push(
      `Pattern "${pattern}" matches no Serverless Functions in api/ (found: ${apiFiles.join(", ") || "none"})`
    );
  }
}

if (fs.existsSync("api/og.cjs")) {
  errors.push("api/og.cjs still exists — Vercel only deploys .js/.mjs/.ts/.tsx");
}

const rewriteDests = (vercelJson.rewrites || [])
  .map((r) => r.destination)
  .filter(Boolean);

for (const dest of rewriteDests) {
  if (dest.includes(".cjs")) {
    errors.push(`Rewrite destination still references .cjs: ${dest}`);
  }
  if (dest.startsWith("/api/og") && !dest.startsWith("/api/og?")) {
    errors.push(`Rewrite destination must be /api/og?path=... not ${dest}`);
  }
}

const allText = fs.readFileSync("vercel.json", "utf8");
if (allText.includes("(?i)")) {
  errors.push(
    "vercel.json contains (?i) — invalid in JavaScript RegExp (Vercel routing)"
  );
}
if (allText.includes(".cjs")) {
  errors.push("vercel.json still contains .cjs references");
}

try {
  new RegExp(BOT_UA_PATTERN);
} catch (e) {
  errors.push(`BOT_UA_PATTERN is invalid: ${e.message}`);
}

const botRewrites = (vercelJson.rewrites || []).filter((r) =>
  r.destination?.includes("/api/og?")
);
for (const rule of botRewrites) {
  const ua = rule.has?.find((h) => h.key === "user-agent")?.value;
  if (ua !== BOT_UA_PATTERN) {
    errors.push(
      `Bot rewrite for ${rule.source} uses unexpected user-agent pattern`
    );
  }
}

console.log("API files recognized by Vercel:", apiFiles.join(", ") || "(none)");
console.log("Function patterns:", patterns.join(", ") || "(none)");

if (errors.length) {
  console.error("\n✗ Validation failed:");
  for (const e of errors) console.error("  -", e);
  process.exit(1);
}

console.log("\n✓ All function patterns match api/ Serverless Functions");
console.log("✓ No .cjs references in vercel.json");
console.log("✓ Bot user-agent regex is Vercel-compatible (no (?i))");
