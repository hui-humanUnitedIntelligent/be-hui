#!/usr/bin/env node
// scripts/validate-vercel-functions.mjs — prüft vercel.json functions-Patterns gegen api/*
import fs from "node:fs";
import path from "node:path";

const VERCEL_EXTENSIONS = new Set([".js", ".mjs", ".ts", ".tsx"]);
const vercelJson = JSON.parse(fs.readFileSync("vercel.json", "utf8"));

const apiFiles = fs.readdirSync("api")
  .filter((f) => VERCEL_EXTENSIONS.has(path.extname(f)) && !path.basename(f).startsWith("_"))
  .map((f) => `api/${f}`);

const patterns = Object.keys(vercelJson.functions || {});
const errors = [];
const warnings = [];

for (const pattern of patterns) {
  const matched = apiFiles.filter((f) => f === pattern || f.startsWith(pattern.replace(/\*.*$/, "")));
  if (matched.length === 0) {
    errors.push(`Pattern "${pattern}" matches no Serverless Functions in api/ (found: ${apiFiles.join(", ") || "none"})`);
  }
}

const rewriteDests = (vercelJson.rewrites || [])
  .map((r) => r.destination)
  .filter(Boolean);

for (const dest of rewriteDests) {
  if (dest.includes(".cjs")) {
    errors.push(`Rewrite destination still references .cjs: ${dest}`);
  }
}

const allText = fs.readFileSync("vercel.json", "utf8");
if (allText.includes(".cjs")) {
  errors.push("vercel.json still contains .cjs references");
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
