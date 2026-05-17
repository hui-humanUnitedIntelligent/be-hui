// src/lib/cache/index.js
// HUI — Cache Layer V1 — Phase 6A.3
// ═══════════════════════════════════════════════════════════════
//
// PROBLEM GELÖST:
// useCommunityHealth lädt 2.300 Rows pro Aufruf.
// Bei 1000 Usern × 5min Refresh = 27,6M rows/h.
//
// LÖSUNG:
// TTL-basierter Cache mit stale-while-revalidate.
// Memory-capped. Session-scoped. Nie persistiert.
//
// DESIGN-PRINZIPIEN:
// 1. Memory-capped: max. 5MB Gesamt-Cache
// 2. TTL-basiert: keine stale Data nach Ablauf
// 3. stale-while-revalidate: sofort servieren, im BG refreshen
// 4. Namespace-isoliert: verschiedene Caches kollidieren nicht
// 5. Kein localStorage: alles session-scope (sicherheit)
//
// CACHE-HIERARCHIE:
//   L1: In-Memory (Map) — 0ms, flüchtig
//   L2: sessionStorage  — <1ms, tab-persistent
//
// TTL-DEFAULTS:
//   community_health:   300s  (5min)
//   graph_data:         120s  (2min)
//   creator_affinity:    60s  (1min)
//   feed_segment:        30s  (30s)
//   search_results:      60s  (1min)
//   context_snapshot:    10s  (10s — sehr frisch)
// ═══════════════════════════════════════════════════════════════

// ── Konfiguration ──────────────────────────────────────────────

const TTL = {
  community_health:   300_000,   // 5 Minuten
  graph_data:         120_000,   // 2 Minuten
  creator_affinity:    60_000,   // 1 Minute
  feed_segment:        30_000,   // 30 Sekunden
  search_results:      60_000,   // 1 Minute
  context_snapshot:    10_000,   // 10 Sekunden
  follow_graph:       180_000,   // 3 Minuten
  network_health:     300_000,   // 5 Minuten
};

const MAX_MEMORY_BYTES = 5 * 1024 * 1024;  // 5MB Hard Cap
const MAX_ENTRIES      = 500;               // Max Keys

// ── L1: In-Memory Cache ────────────────────────────────────────

class MemoryCache {
  constructor() {
    this._store   = new Map();  // key → { data, expiresAt, size, revalidating }
    this._totalSz = 0;
  }

  get size()  { return this._store.size; }
  get bytes() { return this._totalSz; }

  set(key, data, ttlMs = 60_000) {
    const serialized = JSON.stringify(data);
    const size       = serialized.length * 2;  // UTF-16 bytes (approx)

    // Evict wenn nötig
    if (this._totalSz + size > MAX_MEMORY_BYTES || this._store.size >= MAX_ENTRIES) {
      this._evictLRU(size);
    }

    const existing = this._store.get(key);
    if (existing) this._totalSz -= existing.size;

    this._store.set(key, {
      data,
      expiresAt:   Date.now() + ttlMs,
      size,
      revalidating: false,
      hits:         0,
    });
    this._totalSz += size;
  }

  get(key) {
    const entry = this._store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this._store.delete(key);
      this._totalSz -= entry.size;
      return null;
    }
    entry.hits++;
    return entry;
  }

  isStale(key) {
    const entry = this._store.get(key);
    if (!entry) return true;
    return Date.now() > entry.expiresAt;
  }

  delete(key) {
    const entry = this._store.get(key);
    if (entry) {
      this._totalSz -= entry.size;
      this._store.delete(key);
    }
  }

  clear(namespace = null) {
    if (!namespace) {
      this._store.clear();
      this._totalSz = 0;
      return;
    }
    for (const key of this._store.keys()) {
      if (key.startsWith(namespace)) this.delete(key);
    }
  }

  stats() {
    return {
      entries:  this._store.size,
      bytes:    this._totalSz,
      maxBytes: MAX_MEMORY_BYTES,
      usage:    `${Math.round(this._totalSz / MAX_MEMORY_BYTES * 100)}%`,
    };
  }

  _evictLRU(neededBytes) {
    // Erst abgelaufene Einträge löschen
    for (const [key, entry] of this._store.entries()) {
      if (Date.now() > entry.expiresAt) this.delete(key);
      if (this._totalSz + neededBytes <= MAX_MEMORY_BYTES) return;
    }
    // Dann LRU (am wenigsten genutzt)
    const sorted = [...this._store.entries()].sort(([,a], [,b]) => a.hits - b.hits);
    for (const [key] of sorted) {
      this.delete(key);
      if (this._totalSz + neededBytes <= MAX_MEMORY_BYTES) return;
    }
  }
}

// Singleton
const L1 = new MemoryCache();

// ── L2: sessionStorage Cache ────────────────────────────────────
const L2 = {
  set(key, data, ttlMs) {
    try {
      const payload = JSON.stringify({ data, expiresAt: Date.now() + ttlMs });
      sessionStorage.setItem(`hui_c_${key}`, payload);
    } catch (_) {}  // QuotaExceededError ignorieren
  },

  get(key) {
    try {
      const raw = sessionStorage.getItem(`hui_c_${key}`);
      if (!raw) return null;
      const { data, expiresAt } = JSON.parse(raw);
      if (Date.now() > expiresAt) {
        sessionStorage.removeItem(`hui_c_${key}`);
        return null;
      }
      return { data };
    } catch (_) { return null; }
  },

  delete(key) {
    try { sessionStorage.removeItem(`hui_c_${key}`); } catch (_) {}
  },
};

// ── Haupt-Cache-API ────────────────────────────────────────────

/**
 * Liest aus Cache (L1 → L2 → Miss)
 */
export function cacheGet(namespace, key) {
  const cacheKey = `${namespace}:${key}`;

  // L1 zuerst
  const l1 = L1.get(cacheKey);
  if (l1) return { data: l1.data, stale: false, source: 'l1' };

  // L2 fallback
  const l2 = L2.get(cacheKey);
  if (l2) {
    // In L1 promoten
    L1.set(cacheKey, l2.data, 30_000);  // L1 kurz halten
    return { data: l2.data, stale: false, source: 'l2' };
  }

  return null;  // Cache Miss
}

/**
 * Schreibt in Cache (L1 + L2)
 */
export function cacheSet(namespace, key, data, ttlMs = null) {
  const cacheKey = `${namespace}:${key}`;
  const ttl      = ttlMs || TTL[namespace] || 60_000;
  L1.set(cacheKey, data, ttl);
  L2.set(cacheKey, data, ttl);
}

/**
 * Cache invalidieren
 */
export function cacheInvalidate(namespace, key = null) {
  if (key) {
    L1.delete(`${namespace}:${key}`);
    L2.delete(`${namespace}:${key}`);
  } else {
    L1.clear(namespace);
  }
}

// ── Stale-While-Revalidate ─────────────────────────────────────

/**
 * SWR: gibt stale Data sofort zurück, refresht im Hintergrund.
 *
 * @param {string}   namespace
 * @param {string}   key
 * @param {Function} fetcher      — async () => data
 * @param {Object}   opts         — { ttl, staleThreshold }
 * @returns {Promise<{data, stale, refreshing}>}
 */
export async function cacheOrFetch(namespace, key, fetcher, opts = {}) {
  const { ttl = null, staleThreshold = null } = opts;
  const cacheKey = `${namespace}:${key}`;
  const effectiveTtl = ttl || TTL[namespace] || 60_000;

  // Cache-Hit
  const cached = cacheGet(namespace, key);
  if (cached) {
    // SWR: Im Hintergrund revalidieren wenn fast abgelaufen
    const l1Entry = L1._store.get(cacheKey);
    const timeLeft = l1Entry ? l1Entry.expiresAt - Date.now() : 0;
    const isAlmostStale = timeLeft < effectiveTtl * 0.2;  // Letztes 20% der TTL

    if (isAlmostStale && l1Entry && !l1Entry.revalidating) {
      l1Entry.revalidating = true;
      fetcher().then(fresh => {
        if (fresh !== null && fresh !== undefined) {
          cacheSet(namespace, key, fresh, effectiveTtl);
        }
        if (l1Entry) l1Entry.revalidating = false;
      }).catch(() => {
        if (l1Entry) l1Entry.revalidating = false;
      });
    }

    return { data: cached.data, stale: false, refreshing: isAlmostStale };
  }

  // Cache Miss → Fetch
  try {
    const data = await fetcher();
    if (data !== null && data !== undefined) {
      cacheSet(namespace, key, data, effectiveTtl);
    }
    return { data, stale: false, refreshing: false };
  } catch (err) {
    console.error(`[Cache] Fetch failed for ${namespace}:${key}`, err?.message);
    return { data: null, stale: false, refreshing: false };
  }
}

/**
 * Cache Stats (für Observability-Dashboard)
 */
export function getCacheStats() {
  return {
    l1: L1.stats(),
    ttls: TTL,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Namespace-Keys (für Debugging)
 */
export { TTL as CACHE_TTL };
