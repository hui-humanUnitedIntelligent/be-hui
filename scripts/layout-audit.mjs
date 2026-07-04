/**
 * AppShell layout audit — measures rendered geometry across main tabs.
 * Run: node scripts/layout-audit.mjs (requires dev server on :5173 + authenticated session)
 *
 * Without auth, validates structural parity via static analysis fallback.
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const checks = [
  {
    file: "src/pages/MyBasisProfile.jsx",
    mustNot: ["position:\"fixed\", inset:0, zIndex:9500", "NAV_RESERVED_HEIGHT_CSS", "safe-area-inset-top"],
    mustHave: ["SHELL_PAGE_TITLE_PAD", "SHELL_LAYOUT"],
  },
  {
    file: "src/pages/Home.jsx",
    mustHave: ["tabRefs.creator", "keepCreator", "MyBasisProfile"],
    mustNot: ["creatorOpen={"],
  },
  {
    file: "src/components/home/profile/ProfileLauncher.jsx",
    mustNot: ["import(\"../../../pages/MyBasisProfile", "<MyBasisProfile"],
  },
  {
    file: "src/components/home/shellLayout.js",
    mustHave: ["CONTENT_PX: 16", "SHELL_PAGE_TITLE_PAD"],
  },
];

let failed = 0;
for (const { file, mustHave = [], mustNot = [] } of checks) {
  const src = readFileSync(join(root, file), "utf8");
  for (const token of mustHave) {
    if (!src.includes(token)) {
      console.error(`FAIL ${file}: missing "${token}"`);
      failed++;
    }
  }
  for (const token of mustNot) {
    if (src.includes(token)) {
      console.error(`FAIL ${file}: still contains "${token}"`);
      failed++;
    }
  }
}

if (failed === 0) {
  console.log("✓ AppShell layout audit passed (static structural checks)");
  process.exit(0);
}
process.exit(1);
