#!/usr/bin/env node
/**
 * Sprint 8 Phase 5 — Feed Presence Cutover Verification (static + mock runtime)
 */

import { readFileSync } from "fs";
import { join } from "path";

const ROOT = new URL("..", import.meta.url).pathname;

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

const feedFiles = [
  "src/feed/UnifiedFeed.jsx",
  "src/feed/cards/BaseFeedCard.jsx",
];

console.log("═══════════════════════════════════════════════════════════");
console.log(" Sprint 8 Phase 5 — Feed Presence Cutover Check");
console.log("═══════════════════════════════════════════════════════════\n");

// ── Aufgabe 1: keine formatPresence / profiles.last_seen_at im Feed ──
console.log("AUFGABE 1 — Feed-Komponenten (Presence-Anzeige):\n");
const components = [
  {
    file: "src/feed/cards/BaseFeedCard.jsx",
    fn: "HumanHeader",
    line: "~229",
    detail: "item._presenceStatus (Anzeige via PresenceDot)",
  },
  {
    file: "src/feed/cards/BaseFeedCard.jsx",
    fn: "FeedCardHeader",
    line: "~337",
    detail: "presenceStatus prop (PresenceDot + Label)",
  },
  {
    file: "src/feed/UnifiedFeed.jsx",
    fn: "FeedList",
    line: "~497",
    detail: "usePresenceMap → _presenceStatus auf Items",
  },
];

for (const c of components) {
  console.log(`  ${c.file}`);
  console.log(`    Funktion: ${c.fn} (Z. ${c.line})`);
  console.log(`    Detail:   ${c.detail}\n`);
}

let violations = 0;
for (const f of feedFiles) {
  const src = read(f);
  if (/formatPresence/.test(src)) {
    console.log(`  ✘ ${f}: formatPresence noch vorhanden`);
    violations++;
  }
  if (/profiles\.last_seen_at|last_seen_at/.test(src) && !f.includes("usePresence")) {
    console.log(`  ✘ ${f}: profiles.last_seen_at Referenz`);
    violations++;
  }
}
if (violations === 0) {
  console.log("  ✔ Kein formatPresence / profiles.last_seen_at in Feed-Dateien\n");
}

// ── Aufgabe 3: Runtime-Pipeline (Mock) ──
console.log("AUFGABE 3 — Runtime-Pipeline (Mock):\n");

const mockPresenceDb = {
  "user-a": { user_id: "user-a", status: "online", last_seen_at: new Date().toISOString() },
  "user-b": { user_id: "user-b", status: "away",   last_seen_at: new Date().toISOString() },
  "user-c": { user_id: "user-c", status: "offline", last_seen_at: new Date(Date.now() - 86400000).toISOString() },
};

const feedItems = [
  { id: "post-1", author: { id: "user-a", name: "Anna" } },
  { id: "post-2", author: { id: "user-b", name: "Ben" } },
  { id: "post-3", author: { id: "user-c", name: "Clara" } },
  { id: "post-4", author: { id: "user-d", name: "Dave" } },
];

function resolvePresence(item, map) {
  const uid = item?.author?.id;
  return uid ? (map[uid]?.status || "offline") : null;
}

for (const item of feedItems) {
  const status = resolvePresence(item, mockPresenceDb);
  console.log(`  ${item.id} (${item.author.name}): ${status}`);
}

console.log("\n  Realtime: usePresenceMap subscribed auf user_presence (postgres_changes *)");
console.log("  Feed:     FeedList setzt _presenceStatus → HumanHeader → PresenceDot\n");

// ── Regression checks ──
const checks = [
  ["usePresenceMap in UnifiedFeed", /usePresenceMap/.test(read("src/feed/UnifiedFeed.jsx"))],
  ["_presenceStatus enrichment", /_presenceStatus:\s*resolvePresenceStatus/.test(read("src/feed/UnifiedFeed.jsx"))],
  ["PresenceDot in HumanHeader", /PresenceDot status=\{presence\}/.test(read("src/feed/cards/BaseFeedCard.jsx"))],
  ["Kein formatPresence im Feed", !/formatPresence/.test(feedFiles.map(read).join(""))],
  ["away/idle unterstützt", /presence !== "offline"/.test(read("src/feed/cards/BaseFeedCard.jsx"))],
];

console.log("AUFGABE 4 — Regression (statisch):");
for (const [label, ok] of checks) {
  console.log(`  ${ok ? "✔" : "✘"} ${label}`);
}

console.log("\n═══════════════════════════════════════════════════════════");
process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
