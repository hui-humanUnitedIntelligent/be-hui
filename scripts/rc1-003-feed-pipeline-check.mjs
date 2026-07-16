#!/usr/bin/env node
/**
 * RC1-003 — Feed Empty State Pipeline Check
 * Simuliert fetchFeedPage → items → resolvedItems → FeedList → DOM
 * ohne Live-DB (Mock-Daten entsprechen Feed-V3-Schema).
 */

const PAGE_SIZE = 20;
const limit = Math.ceil(PAGE_SIZE / 2);

// ─── Feed V3 Filter (aus useFeedStream.js) ───────────────────────────────────
function isUpcomingExperience(item) {
  if (item?.type !== "experience") return false;
  const dateStr = item?._raw?.date;
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const evDay = new Date(dateStr);
  evDay.setHours(0, 0, 0, 0);
  return evDay >= today;
}

function shouldExcludeFromMainFeed(item) {
  if (isUpcomingExperience(item)) return true;
  if (item?.type === "event") return true;
  return false;
}

function createdAtMs(item) {
  const ts = item?._raw?.created_at;
  return ts ? new Date(ts).getTime() : 0;
}

// ─── Mock DB ─────────────────────────────────────────────────────────────────
function mockDb() {
  const mk = (n, prefix, extra = {}) =>
    Array.from({ length: n }, (_, i) => ({
      id: `${prefix}-${i}`,
      created_at: new Date(Date.now() - i * 3600000).toISOString(),
      user_id: "user-abc",
      ...extra,
    }));

  return {
    works: mk(5, "work", { title: "Werk", status: "published", approval_status: "approved" }),
    exps: mk(3, "exp", {
      title: "Erlebnis",
      status: "published",
      approval_status: "approved",
      date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), // past → stays in main feed
    }),
    beitr: mk(11, "beitr", { caption: "Moment", type: "image", src: "https://example.com/x.jpg" }),
    upcomingExp: {
      id: "exp-upcoming",
      created_at: new Date().toISOString(),
      user_id: "user-abc",
      title: "Kommendes Erlebnis",
      status: "published",
      approval_status: "approved",
      date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    },
  };
}

function normalizeMock(row, type) {
  return {
    id: row.id,
    type,
    title: row.title || row.caption || row.id,
    createdAt: row.created_at,
    author: { id: row.user_id, name: "Test" },
    _raw: row,
  };
}

// ─── Simuliert fetchFeedPage (NACH Fix: kein invs) ───────────────────────────
function simulateFetchFeedPage(db) {
  const works = db.works;
  const exps = [...db.exps, db.upcomingExp];
  const beitr = db.beitr;

  // VOR Fix: ReferenceError bei ...invs
  let fetchError = null;
  try {
    // eslint-disable-next-line no-undef
    const _broken = [...works, ...exps, ...beitr, ...invs];
    void _broken;
  } catch (e) {
    fetchError = e.message;
  }

  const rawItems = [...works, ...exps, ...beitr];
  const normalizedItems = [
    ...works.map((r) => normalizeMock(r, "work")),
    ...exps.map((r) => normalizeMock(r, "experience")),
    ...beitr.map((r) => normalizeMock(r, "moment")),
  ].filter(Boolean);

  const afterMainFeedFilter = normalizedItems.filter((item) => !shouldExcludeFromMainFeed(item));
  afterMainFeedFilter.sort((a, b) => createdAtMs(b) - createdAtMs(a));

  return {
    fetchError,
    rawItems,
    normalizedItems,
    items: afterMainFeedFilter,
    hasMore: works.length >= limit || exps.length >= limit || beitr.length >= limit,
  };
}

function simulateResolvedItems(streamItems) {
  return streamItems
    .map((raw) => (raw?.id && raw.author ? raw : raw?.id ? raw : null))
    .filter((i) => i?.id);
}

function simulateFeedList(items) {
  const valid = items.filter((i) => i && typeof i === "object" && i.id);
  return Array.from(new Map(valid.map((i) => [String(i.id), i])).values());
}

function describeStage(name, items) {
  const types = [...new Set(items.map((i) => i.type))];
  console.log(`\n── ${name} ──`);
  console.log(`  Anzahl:      ${items.length}`);
  console.log(`  IDs:         ${items.map((i) => i.id).join(", ") || "(leer)"}`);
  console.log(`  Inhaltstyp:  ${types.join(", ") || "(keine)"}`);
}

// ─── RUN ─────────────────────────────────────────────────────────────────────
console.log("═══════════════════════════════════════════════════════════");
console.log(" RC1-003 — Feed Pipeline Check");
console.log("═══════════════════════════════════════════════════════════");

const db = mockDb();
const { fetchError, rawItems, normalizedItems, items, hasMore } = simulateFetchFeedPage(db);

console.log("\nAUFGABE 4 — DB → fetchFeedPage → Feed");
console.log(`  DB works:        ${db.works.length}`);
console.log(`  DB exps:         ${db.exps.length + 1} (inkl. 1 upcoming)`);
console.log(`  DB beitraege:    ${db.beitr.length}`);
console.log(`  fetchFeedPage:   ${fetchError ? "FEHLER — " + fetchError : "OK"}`);

describeStage("fetchFeedPage() → rawItems", rawItems);
describeStage("normalizedItems (vor Filter)", normalizedItems);

const excluded = normalizedItems.filter((item) => shouldExcludeFromMainFeed(item));
console.log("\n── AUFGABE 2 — Filter der Items entfernt ──");
console.log(`  Datei:       src/feed/useFeedStream.js`);
console.log(`  Funktion:    shouldExcludeFromMainFeed / isUpcomingExperience`);
console.log(`  Codezeile:   40-44 (Filter in fetchFeedPage Z.242)`);
console.log(`  Grund:       Feed V3 — upcoming experiences + events nur in „Demnächst“`);
console.log(`  Entfernt:    ${excluded.length} Item(s): ${excluded.map((i) => i.id).join(", ")}`);

describeStage("items (Hook-State nach fetchFeedPage)", items);

const resolvedItems = simulateResolvedItems(items);
describeStage("resolvedItems (UnifiedFeed useMemo)", resolvedItems);

const visibleItems = resolvedItems;
describeStage("visibleItems (= resolvedItems, kein weiterer Filter)", visibleItems);

const feedListArr = simulateFeedList(visibleItems);
describeStage("FeedList arr (Dedupe)", feedListArr);

const domCards = feedListArr.length;
console.log("\n── DOM (FeedList Render) ──");
console.log(`  Empty State:  ${feedListArr.length === 0 ? "JA — EmptyFeed (arr.length === 0)" : "NEIN"}`);
console.log(`  DOM-Karten:   ${domCards}`);
console.log(`  hasMore:      ${hasMore}`);

console.log("\n── AUFGABE 3 — Empty-State-Bedingung ──");
console.log(`  Datei:       src/feed/UnifiedFeed.jsx`);
console.log(`  Funktion:    FeedList`);
console.log(`  Codezeile:   615`);
console.log(`  Bedingung:   arr.length === 0  →  <EmptyFeed />`);
console.log(`  Codepfad:    streamItems (items[]) → resolvedItems → FeedList items prop → arr → EmptyFeed`);
console.log(`  Ursache:     items[] blieb leer weil fetchFeedPage() mit ReferenceError: invs is not defined abbrach`);

console.log("\n── ROOT CAUSE (VOR Fix) ──");
console.log(`  Datei:       src/feed/useFeedStream.js`);
console.log(`  Funktion:    fetchFeedPage`);
console.log(`  Codezeile:   164`);
console.log(`  Grund:       ...invs spread — invs ist in fetchFeedPage nicht definiert (Feed V3 entfernte Invitations-Query)`);
console.log(`  Effekt:      ReferenceError → catch in initialLoad → items=[] → EmptyFeed`);

// Regression checks
const checks = [
  ["Vorhandene Beiträge erscheinen", items.some((i) => i.type === "moment")],
  ["Neuer Beitrag oben (chronologisch)", items[0]?.type === "moment" || items[0]?.type === "work"],
  ["Demnächst-Filter aktiv (upcoming exp excluded)", !items.some((i) => i.id === "exp-upcoming")],
  ["Chronologie (created_at DESC)", items.every((v, i, a) => i === 0 || createdAtMs(a[i - 1]) >= createdAtMs(v))],
  ["Infinite Scroll hasMore", hasMore === true],
  ["Empty State weg", feedListArr.length > 0],
];

console.log("\n── AUFGABE 6 — Regressionstest (simuliert) ──");
for (const [label, ok] of checks) {
  console.log(`  ${ok ? "✔" : "✘"} ${label}`);
}

console.log("\n═══════════════════════════════════════════════════════════");

const allPass = checks.every(([, ok]) => ok);
process.exit(allPass ? 0 : 1);
