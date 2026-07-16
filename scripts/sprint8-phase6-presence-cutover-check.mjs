#!/usr/bin/env node
/**
 * Sprint 8 Phase 6 — Presence Final Cutover Verification
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(js|jsx)$/.test(name)) acc.push(p);
  }
  return acc;
}

const files = walk(SRC);
const hits = [];

for (const file of files) {
  const rel = file.replace(ROOT, "").replace(/^\//, "");
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const n = i + 1;
    if (/formatPresence\s*\(/.test(line) && !rel.includes("usePresence.jsx")) {
      hits.push({ rel, n, type: "READ (legacy formatPresence)", line: line.trim() });
    }
    if (/from\s+["']profiles["']/.test(line) && /last_seen/.test(line)) {
      hits.push({ rel, n, type: "profiles.last_seen", line: line.trim() });
    }
    if (/\.from\(["']profiles["']\)[\s\S]*last_seen/.test(line)) {
      hits.push({ rel, n, type: "WRITE profiles.last_seen", line: line.trim() });
    }
    if (/profiles["']\)\s*\n?\s*\.update\(\{[^}]*last_seen_at/.test(line)) {
      hits.push({ rel, n, type: "WRITE profiles.last_seen_at", line: line.trim() });
    }
    if (/\.update\(\{\s*last_seen_at/.test(line) && /\.from\(["']profiles["']\)/.test(readFileSync(file, "utf8"))) {
      // checked per file below
    }
  });
  const src = readFileSync(file, "utf8");
  if (/from\(["']profiles["']\)[\s\S]{0,200}\.update\(\{[^}]*last_seen_at/.test(src)) {
    hits.push({ rel, n: 0, type: "WRITE profiles.last_seen_at (file)", line: "..." });
  }
  if (/from\(["']profiles["']\)[\s\S]{0,200}\.update\(\{[^}]*last_seen[^_]/ .test(src)) {
    hits.push({ rel, n: 0, type: "WRITE profiles.last_seen (file)", line: "..." });
  }
  if (/from\(["']profiles["']\)[\s\S]{0,200}\.select\([^)]*last_seen/.test(src) && !rel.includes("usePresence.jsx")) {
    hits.push({ rel, n: 0, type: "READ profiles.last_seen (file)", line: "..." });
  }
}

const allowedUserPresence = files.filter(f => f.includes("usePresence.jsx") || f.includes("usePresence.js"));

console.log("═══════════════════════════════════════════════════════════");
console.log(" Sprint 8 Phase 6 — Presence Final Cutover Check");
console.log("═══════════════════════════════════════════════════════════\n");

const productiveHits = hits.filter(h => {
  if (h.rel.includes("usePresence.jsx")) return false;
  if (h.rel.includes("usePresence.js") && h.type.includes("comment")) return false;
  return true;
});

console.log("Produktive Verstöße (src/):", productiveHits.length);
for (const h of productiveHits) {
  console.log(`  ✘ ${h.rel}:${h.n} — ${h.type}`);
  if (h.line !== "...") console.log(`      ${h.line}`);
}

const checks = [
  ["usePresence.jsx upsert user_presence", /user_presence/.test(readFileSync(join(SRC, "lib/usePresence.jsx"), "utf8"))],
  ["usePresence.js re-export only", !/from\(["']profiles["']\)/.test(readFileSync(join(SRC, "lib/usePresence.js"), "utf8"))],
  ["ChatHeader usePresenceMap", /usePresenceMap/.test(readFileSync(join(SRC, "components/chat-center/ChatHeader.jsx"), "utf8"))],
  ["Discover PeopleSection usePresenceMap", /usePresenceMap/.test(readFileSync(join(SRC, "pages/DiscoverPage.jsx"), "utf8"))],
  ["sessionHooks no profiles last_seen", !/last_seen/.test(readFileSync(join(SRC, "lib/sessionHooks.js"), "utf8"))],
  ["Home usePresence.jsx", /usePresence\.jsx/.test(readFileSync(join(SRC, "pages/Home.jsx"), "utf8"))],
  ["Feed usePresenceMap", /usePresenceMap/.test(readFileSync(join(SRC, "feed/UnifiedFeed.jsx"), "utf8"))],
  ["Keine formatPresence Aufrufe", !files.some(f => {
    const s = readFileSync(f, "utf8");
    return /formatPresence\s*\(/.test(s) && !f.includes("usePresence.jsx");
  })],
  ["Keine produktiven Verstöße", productiveHits.length === 0],
];

console.log("\nRegression (statisch):");
for (const [label, ok] of checks) {
  console.log(`  ${ok ? "✔" : "✘"} ${label}`);
}

console.log("\nRuntime-Pipeline:");
console.log("  Login → usePresence(userId) → user_presence upsert (online)");
console.log("  Heartbeat → user_presence (status + last_seen_at + updated_at)");
console.log("  Realtime → usePresenceMap → Feed / Chat / Discover");
console.log("  Logout/unload → user_presence (offline)");

console.log("\n═══════════════════════════════════════════════════════════");
process.exit(checks.every(([, ok]) => ok) && productiveHits.length === 0 ? 0 : 1);
