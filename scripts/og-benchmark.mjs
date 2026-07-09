#!/usr/bin/env node
// scripts/og-benchmark.mjs — Local OG card render benchmark
import { createRequire } from "module";
import { writeFileSync } from "fs";
import { performance } from "perf_hooks";

const require = createRequire(import.meta.url);
const { defaultCardData } = require("../api/og-resolve.cjs");
const { renderCard } = require("../api/og-render.cjs");

const SAMPLES = [
  { cardType: "default", title: "HUI — Human United Intelligent", description: "Ein ruhiges kreatives Netzwerk.", coverImage: null },
  { cardType: "beitrag", title: "Peanut vs. Bacon", description: "Ein kurzer Moment über die wichtigsten Fragen des Lebens — mit viel Humor und Herz.", category: "Handwerk", authorName: "Michael", authorAvatar: null, coverImage: null },
  { cardType: "werk", title: "Schönes Haus", description: "Handwerk · 21.000 € · von Michael", category: "Handwerk", price: "21.000 €", subtitle: "von Michael", coverImage: null },
  { cardType: "wirker", title: "Michael", description: "Architekt · Berlin", category: "Architekt", location: "Berlin", subtitle: "Jetzt auf HUI entdecken", coverImage: null },
  { cardType: "veranstaltung", title: "Kaffee & Ideen", description: "Freitag, 12. Juli 2026 · 16:00 Uhr · Berlin", date: "Freitag, 12. Juli 2026", time: "16:00 Uhr", location: "Berlin", coverImage: null },
  { cardType: "erlebnis", title: "Stadtführung durch Kreuzberg", description: "Entdecke versteckte Höfe und lokale Kunst.", coverImage: null },
  { cardType: "projekt", title: "Gemeinschaftsgarten Mitte", description: "Ein Impact-Projekt für mehr Grün in der Stadt.", category: "Impact", coverImage: null },
];

async function main() {
  const times = [];
  console.log("HUI OG Card Benchmark (local)\n");

  // Warm-up pass (simulates Vercel module init)
  await renderCard({ ...defaultCardData(), cardType: "default" });
  console.log("  (warm-up complete)\n");

  for (let i = 0; i < SAMPLES.length; i++) {
    const card = { ...defaultCardData(), ...SAMPLES[i] };
    const t0 = performance.now();
    const buf = await renderCard(card);
    const ms = performance.now() - t0;
    times.push(ms);
    const out = `public/og-benchmark-${card.cardType}.jpg`;
    writeFileSync(out, buf);
    console.log(`  ${card.cardType.padEnd(14)} ${ms.toFixed(1)} ms  → ${out} (${(buf.length / 1024).toFixed(1)} KB)`);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const max = Math.max(...times);
  console.log(`\n  Durchschnitt: ${avg.toFixed(1)} ms`);
  console.log(`  Maximum:      ${max.toFixed(1)} ms`);
  console.log(`  Ziel:         ≤ 300 ms ${max <= 300 ? "✓" : "✗"}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
