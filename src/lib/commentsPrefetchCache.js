// src/lib/commentsPrefetchCache.js — INSTANT-COMMENTS.1 (2026-08-07)
// ══════════════════════════════════════════════════════════════════
// Zweck: CommentsSheet.jsx soll beim Öffnen NIE einen "Kommentare werden
// geladen …"-Spinner zeigen müssen. Dafür werden Kommentare bereits im
// Hintergrund geladen, sobald die zugehörige Karte (Feed, Werk-Detail,
// Erlebnis-Detail, Momente-Vollbild, ContentPreviewSheet) sichtbar wird —
// lange bevor der Nutzer überhaupt auf das Sprechblasen-Icon tippt.
//
// Modul-Level-Cache (RAM, kein Storage) — lebt so lange wie die
// JS-Session/Seite. Kein TTL nötig: Realtime-Subscription + das globale
// "hui:comments:changed"-Event (siehe CommentsSheet.jsx) halten die Daten
// aktuell, solange die App offen ist; beim Öffnen der Sheet wird zusätzlich
// still (ohne Spinner) im Hintergrund revalidiert.
//
// EINZIGER Ort für diesen Cache (Architektur-Charta #7 — eine autoritative
// Quelle pro Zuständigkeitsbereich). Kein direkter Zugriff auf die Map von
// außen — nur über die exportierten Funktionen.
// ══════════════════════════════════════════════════════════════════

const cache = new Map();    // key -> { items, total, hasMore, offset, ts }
const inflight = new Map(); // key -> Promise (Dedupe paralleler Prefetches)

function makeKey(postId, postType) {
  return `${postType || "beitrag"}:${postId}`;
}

export function getCachedComments(postId, postType) {
  if (!postId) return null;
  return cache.get(makeKey(postId, postType)) || null;
}

export function setCachedComments(postId, postType, data) {
  if (!postId) return;
  cache.set(makeKey(postId, postType), {
    items: data.items || [],
    total: data.total ?? 0,
    hasMore: !!data.hasMore,
    offset: data.offset ?? 0,
    ts: Date.now(),
  });
}

export function invalidateCachedComments(postId, postType) {
  if (!postId) return;
  cache.delete(makeKey(postId, postType));
}

// Prefetch: lädt die ersten 20 Kommentare im Hintergrund und legt sie in
// den Cache, sobald eine Karte sichtbar wird. `getCommentsFn` wird von
// außen übergeben (statt hier zu importieren), um einen Zirkelbezug zu
// commentsService.js zu vermeiden und Tests/Wiederverwendung zu erleichtern.
export function prefetchComments(postId, postType, currentUserId, getCommentsFn) {
  if (!postId || !getCommentsFn) return;
  const k = makeKey(postId, postType);
  if (cache.has(k) || inflight.has(k)) return;
  const p = getCommentsFn(postId, postType, { offset: 0, limit: 20, currentUserId })
    .then((res) => {
      if (res && !res.error) {
        setCachedComments(postId, postType, {
          items: res.items,
          total: res.visibleTotal ?? res.totalRoots ?? 0,
          hasMore: res.hasMore,
          offset: res.nextOffset,
        });
      }
      inflight.delete(k);
    })
    .catch(() => { inflight.delete(k); });
  inflight.set(k, p);
}
