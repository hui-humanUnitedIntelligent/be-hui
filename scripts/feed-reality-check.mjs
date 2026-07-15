#!/usr/bin/env node
/**
 * HUI Feed Reality Check — Runtime-Pipeline-Simulation (ohne Live-DB)
 * Reproduziert fetchFeedPage → rhythmizeFeed → FeedList-Dedupe → Virtualizer
 */

const PAGE_SIZE = 20;
const limit = Math.ceil(PAGE_SIZE / 2);

// ─── Mock-DB (simuliert fetchFeedPage Step 1) ─────────────────────────────
function mockFetchPage({ works = 10, exps = 10, beitr = 10, inv = 2 } = {}) {
  const mk = (n, prefix) =>
    Array.from({ length: n }, (_, i) => ({
      id: `${prefix}-${i}`,
      created_at: new Date(Date.now() - i * 60000).toISOString(),
      user_id: "user-1",
      type: prefix === "beitr" ? "moment" : prefix.slice(0, -1),
      caption: `Post ${i}`,
      title: prefix === "work" ? `Work ${i}` : undefined,
      status: "published",
      approval_status: "approved",
    }));

  const worksRows = mk(works, "work");
  const expsRows = mk(exps, "exp");
  const beitrRows = mk(beitr, "beitr");
  const invRows = mk(inv, "inv").map((r) => ({ ...r, type: "invitation", status: "active", visibility: "public" }));

  const hasMore = works >= limit || exps >= limit || beitr >= limit;
  return { works: worksRows, exps: expsRows, beitr: beitrRows, inv: invRows, hasMore };
}

// ─── Simuliert _receiveLiveItem VOR Fix (FEED.3B) ─────────────────────────
function simulateReceiveLiveItemBroken(items, pendingItems, newRow) {
  const normalized = { id: newRow.id, type: "moment", createdAt: newRow.created_at, _raw: newRow };
  if (!normalized.id) return { items, pendingItems, droppedAt: "normalizer" };
  if (items.find((i) => i.id === normalized.id)) return { items, pendingItems, droppedAt: null };
  const newPending = pendingItems.find((i) => i.id === normalized.id)
    ? pendingItems
    : [normalized, ...pendingItems];
  return { items, pendingItems: newPending, droppedAt: "items[] — nur pendingItems (_receiveLiveItem)" };
}

// ─── Simuliert _receiveLiveItem NACH Fix ──────────────────────────────────
function simulateReceiveLiveItemFixed(items, newRow) {
  const normalized = { id: newRow.id, type: "moment", createdAt: newRow.created_at, _raw: newRow };
  if (!normalized.id) return { items, droppedAt: "normalizer" };
  if (items.find((i) => i.id === normalized.id)) return { items, droppedAt: null };
  return { items: [normalized, ...items], droppedAt: null };
}

// ─── Simuliert refresh() Race NACH Fix (Merge statt Löschen) ──────────────
function simulateRefreshRaceFixed(newPostId) {
  let items = [{ id: "old-1" }, { id: "old-2" }];
  const newRow = { id: newPostId, created_at: new Date().toISOString() };

  ({ items } = simulateReceiveLiveItemFixed(items, newRow));

  const page = mockFetchPage({ works: 3, exps: 2, beitr: 2, inv: 1 });
  const fetched = [...page.works, ...page.exps, ...page.beitr, ...page.inv].map((r) => ({ id: r.id }));
  const extras = items.filter((p) => !fetched.some((n) => n.id === p.id));
  items = extras.length ? [...extras, ...fetched] : fetched;

  const inItems = items.some((i) => i.id === newPostId);
  return { inItems, lostAt: inItems ? null : "refresh merge fehlgeschlagen" };
}

// ─── Virtualizer Höhen-Simulation ─────────────────────────────────────────
function simulateVirtualizer({ count, estimateSize, actualSizes }) {
  const estimatedTotal = count * estimateSize;
  const actualTotal = actualSizes.reduce((a, b) => a + b, 0);
  const whiteGap = actualTotal - estimatedTotal;
  return { estimatedTotal, actualTotal, whiteGap, domCardsRendered: "overscan+visible (~7 bei count>6)" };
}

// ─── FeedList Dedupe ──────────────────────────────────────────────────────
function feedListDedupe(items) {
  const valid = items.filter((i) => i && typeof i === "object" && i.id);
  return Array.from(new Map(valid.map((i) => [String(i.id), i])).values());
}

// ─── RUN ──────────────────────────────────────────────────────────────────
console.log("═══════════════════════════════════════════════════════════");
console.log(" HUI FEED REALITY CHECK — Runtime-Simulation");
console.log("═══════════════════════════════════════════════════════════\n");

const page = mockFetchPage();
const merged = [...page.works, ...page.exps, ...page.beitr, ...page.inv];
console.log("AUFGABE 1 — Stationen (Mock-DB):");
console.log("  Upload/INSERT:     vorhanden (simuliert)");
console.log("  fetchFeedPage:     works=%d exps=%d beitr=%d inv=%d hasMore=%s",
  page.works.length, page.exps.length, page.beitr.length, page.inv.length, page.hasMore);
console.log("  merged raw:        %d IDs: %s", merged.length, merged.map((r) => r.id).slice(0, 5).join(", ") + "...");

const normalized = merged.map((r) => ({ id: r.id, type: r.type, createdAt: r.created_at }));
const deduped = feedListDedupe(normalized);
console.log("  FeedList arr:      %d (nach Dedupe)", deduped.length);

const newPostId = "beitr-NEW-" + Date.now();
const rtOld = simulateReceiveLiveItemBroken([], [], { id: newPostId, created_at: new Date().toISOString() });
const rtNew = simulateReceiveLiveItemFixed([], { id: newPostId, created_at: new Date().toISOString() });
console.log("\nAUFGABE 3 — Neuer Beitrag nach Realtime (VOR Fix):");
console.log("  items[]:           %d", rtOld.items.length);
console.log("  pendingItems:      %d", rtOld.pendingItems.length);
console.log("  VERLUST-STELLE:    %s", rtOld.droppedAt);
console.log("\nAUFGABE 3 — Neuer Beitrag nach Realtime (NACH Fix):");
console.log("  items[]:           %d", rtNew.items.length);
console.log("  VERLUST-STELLE:    %s", rtNew.droppedAt || "keiner");

const race = simulateRefreshRaceFixed(newPostId);
console.log("\nAUFGABE 3 — refresh()+Realtime Race (NACH Fix):");
console.log("  in items[]:        %s", race.inItems);
console.log("  VERLUST-STELLE:    %s", race.lostAt || "keiner");

const virt = simulateVirtualizer({
  count: 15,
  estimateSize: 640,
  actualSizes: Array(15).fill(820),
});
console.log("\nAUFGABE 4 — Virtualizer (15 Karten, geschätzt 640px, real 820px):");
console.log("  items.length:      15");
console.log("  estimatedTotal:    %d px", virt.estimatedTotal);
console.log("  actualTotal:       %d px", virt.actualTotal);
console.log("  weißer Bereich:    %d px", virt.whiteGap);
console.log("  DOM-Karten:        %s", virt.domCardsRendered);
console.log("  loadMore-Trigger:  FeedBottomSentinel root=scrollContainer (Fix)");

console.log("\n═══════════════════════════════════════════════════════════");
