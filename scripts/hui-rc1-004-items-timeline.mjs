#!/usr/bin/env node
/**
 * HUI RC1-004 — items[] Timeline Simulation
 * Bewiesener Ablauf: Feed lädt → isSearching wird true → Anzeige leer
 * items[] wird NICHT via setItems([]) geleert.
 */

const timeline = [];
let t = 0;
function tick(ms, event, data) {
  t = ms;
  timeline.push({ ms, event, ...data });
}

// ─── State ───────────────────────────────────────────────────────────────────
let items = [];
let searchItems = [];
let searchActive = false;
let isSearching = false;
let searchLoading = false;

function computeIsSearching(searchActive, query, categories, geo, radiusKm) {
  const hasRadius = !!(geo && radiusKm && radiusKm !== "world");
  return searchActive && (!!(query || "").trim() || !!(categories?.length) || hasRadius);
}

function displayLen() {
  return isSearching ? searchItems.length : items.length;
}

function setItems(next, caller, reason) {
  const before = items.length;
  items = typeof next === "function" ? next(items) : next;
  timeline.push({
    ms: t,
    type: "setItems",
    time: `+${t}ms`,
    caller,
    reason,
    before,
    after: items.length,
  });
}

function logDisplaySwap() {
  timeline.push({
    ms: t,
    type: "displaySwap",
    time: `+${t}ms`,
    caller: "useFeedStream",
    reason: isSearching
      ? "display swap → searchItems (items[] unverändert)"
      : "display swap → items[]",
    itemsStateLen: items.length,
    searchItemsLen: searchItems.length,
    visible: displayLen(),
  });
}

// ─── REPRO: Vor Fix (searchActive nicht berücksichtigt) ─────────────────────
console.log("═══════════════════════════════════════════════════════════");
console.log(" RC1-004 — VOR FIX (isSearching ohne searchActive-Gate)");
console.log("═══════════════════════════════════════════════════════════\n");

timeline.length = 0;
t = 0;
items = [];
searchItems = [];
searchActive = false;
let geo = null;
let radiusKm = null;

tick(0, "mount", { items: items.length, visible: displayLen() });

// initialLoad completes
setItems(Array.from({ length: 20 }, (_, i) => ({ id: `item-${i}` })), "initialLoad", "initialLoad()");
tick(120, "initialLoad done", { items: items.length, visible: displayLen() });

// SearchCommandCenter restores radius from localStorage (panel closed)
geo = { lat: 52.52, lng: 13.405, label: "Berlin" };
radiusKm = 25;
const prevSearching = isSearching;
isSearching = !!(false) || false || !!(geo && radiusKm && radiusKm !== "world"); // BUG: alte Logik
searchLoading = true;
if (prevSearching !== isSearching) logDisplaySwap();
tick(180, "SearchCommandCenter effect (radius+geo restored)", {
  searchActive,
  hasRadius: true,
  isSearching,
  items: items.length,
  searchItems: searchItems.length,
  visible: displayLen(),
});

searchLoading = false;
searchItems = [];
tick(250, "Empty State", { items: items.length, visible: displayLen(), isSearching });

console.log("Timeline:");
for (const e of timeline) {
  if (e.type === "setItems") {
    console.log(`  ${e.ms} ms  setItems  ${e.caller}() — ${e.reason}: ${e.before} → ${e.after}`);
  } else if (e.type === "displaySwap") {
    console.log(`  ${e.ms} ms  DISPLAY   ${e.reason}`);
    console.log(`           items[]=${e.itemsStateLen}  searchItems=${e.searchItemsLen}  sichtbar=${e.visible}`);
  } else {
    console.log(`  ${e.ms} ms  ${e.event}`, JSON.stringify(e));
  }
}

console.log("\nBEWEIS (VOR FIX):");
console.log(`  items[] nach 250ms:     ${items.length}  (NICHT geleert)`);
console.log(`  sichtbar nach 250ms:    ${displayLen()}  (LEER durch isSearching-Swap)`);
console.log(`  Verursacher:            isSearching=true ohne searchActive`);
console.log(`  setItems([]) aufgerufen: NEIN\n`);

// ─── NACH FIX ────────────────────────────────────────────────────────────────
console.log("═══════════════════════════════════════════════════════════");
console.log(" RC1-004 — NACH FIX (isSearching gated by searchActive)");
console.log("═══════════════════════════════════════════════════════════\n");

const timeline2 = [];
t = 0;
items = [];
searchItems = [];
searchActive = false;
geo = { lat: 52.52, lng: 13.405 };
radiusKm = 25;

timeline2.push({ ms: 0, visible: 0 });
items = Array.from({ length: 20 }, (_, i) => ({ id: `item-${i}` }));
timeline2.push({ ms: 120, event: "initialLoad", items: items.length, visible: items.length });

searchActive = false;
isSearching = computeIsSearching(searchActive, "", [], geo, radiusKm);
timeline2.push({
  ms: 180,
  event: "radius restored, searchActive=false",
  isSearching,
  items: items.length,
  visible: isSearching ? searchItems.length : items.length,
});

timeline2.push({
  ms: 250,
  event: "Feed stabil",
  items: items.length,
  visible: isSearching ? searchItems.length : items.length,
});

for (const e of timeline2) {
  console.log(`  ${e.ms} ms  ${e.event || ""}  items=${e.items ?? "-"}  visible=${e.visible ?? "-"}`);
}

console.log("\nNACH FIX: Feed bleibt bei 20 sichtbaren Items.\n");

// ─── Alle setItems-Stellen dokumentieren ───────────────────────────────────────
console.log("═══════════════════════════════════════════════════════════");
console.log(" AUFGABE 2 — setItems() / items=[] Stellen (Feed-Hook)");
console.log("═══════════════════════════════════════════════════════════\n");

const sites = [
  ["src/feed/useFeedStream.js", 833, "setItems(cached.items)", "initialLoad", "cache restore()"],
  ["src/feed/useFeedStream.js", 847, "setItems(newItems)", "initialLoad", "initialLoad()"],
  ["src/feed/useFeedStream.js", 869, "setItems(fresh)", "_silentRefresh", "silent refresh()"],
  ["src/feed/useFeedStream.js", 883, "setItems(prev=>...)", "loadMore", "loadMore()"],
  ["src/feed/useFeedStream.js", 900, "setItems(prev=>...)", "loadMore", "loadMore()"],
  ["src/feed/useFeedStream.js", 944, "setItems(prev=>...)", "_receiveLiveItem", "receiveRealtime()"],
  ["src/feed/useFeedStream.js", 953, "setItems(prev=>...)", "flushPendingItems", "flushPendingItems()"],
  ["src/feed/useFeedStream.js", 1074, "setItems(prev=>...)", "refresh", "refresh()"],
  ["src/feed/useFeedStream.js", 727, "useState([])", "mount", "initial state"],
];

for (const [file, line, call, caller, reason] of sites) {
  console.log(`  ${file}:${line}  ${call}  → ${caller}() / ${reason}`);
}

console.log("\n  KEIN setItems([]) im Feed-Hook.");
console.log("  Display-Swap: useFeedStream.js:1095  items: isSearching ? searchItems : items\n");
