#!/usr/bin/env node
// scripts/generate-og-default.mjs — erzeugt HUI Default Social Images (1200×630)
import sharp from "sharp";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const W = 1200;
const H = 630;

const logoCandidates = [
  join(root, "public", "assets", "brand", "hui-logo.png"),
  join(root, "public", "hui-logo.jpg"),
  join(root, "public", "hui-logo-app.png"),
];

function findLogo() {
  for (const p of logoCandidates) {
    if (existsSync(p)) return p;
  }
  throw new Error("No HUI logo found in public/");
}

async function buildDefaultImage(logoPath, outPath) {
  const logo = readFileSync(logoPath);
  const logoSize = 280;

  const resizedLogo = await sharp(logo)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const gradient = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1ED8C8"/>
          <stop offset="100%" stop-color="#FF7A5C"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#bg)"/>
      <rect x="60" y="60" width="${W - 120}" height="${H - 120}" rx="40"
            fill="white" fill-opacity="0.12"/>
    </svg>
  `);

  const textSvg = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <text x="600" y="420" text-anchor="middle"
            font-family="Inter, Arial, sans-serif" font-size="52" font-weight="700"
            fill="white">HUI</text>
      <text x="600" y="480" text-anchor="middle"
            font-family="Inter, Arial, sans-serif" font-size="28" font-weight="500"
            fill="rgba(255,255,255,0.92)">Human United Intelligent</text>
    </svg>
  `);

  await sharp(gradient)
    .composite([
      { input: resizedLogo, top: Math.round((H - logoSize) / 2) - 60, left: Math.round((W - logoSize) / 2) },
      { input: textSvg, top: 0, left: 0 },
    ])
    .png()
    .toFile(outPath);

  console.log(`✓ ${outPath} (${W}×${H})`);
}

const logo = findLogo();
await buildDefaultImage(logo, join(root, "public", "og-default.png"));
await buildDefaultImage(logo, join(root, "public", "hui-og-image.png"));
