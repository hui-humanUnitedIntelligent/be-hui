// src/lib/budgets/index.js
// HUI — Performance & Cost Budgets — Phase 6A.8
// ═══════════════════════════════════════════════════════════════
//
// ZWECK:
// Langfristig wirtschaftlich skalierbar bleiben.
// Budgets sind transparente Grenzen — keine Überraschungen.
//
// ALLE BUDGETS SIND DOKUMENTIERT UND BEGRÜNDET.
// ═══════════════════════════════════════════════════════════════

/**
 * Query-Budgets: max. Rows pro Operation.
 *
 * Basis: 1.000 simultane User, 5min Refresh.
 * Ziel: < 5M Rows/h Supabase-Last.
 */
export const QUERY_BUDGETS = {
  community_health: {
    profiles:        150,   // war 200 → -25%
    bookings:        300,   // war 500 → -40%
    recommendations: 200,   // war 300 → -33%
    follows:         500,   // war 1000 → -50%
    works:           200,   // war 300 → -33%
    total:           1350,  // war 2300 → -41%
    rationale: 'Sampling statt vollständige Abfrage. Statistische Gesundheit bleibt valide.',
  },

  discovery_feed: {
    works:       22,
    experiences: 10,
    stories:     8,
    creators:    50,
    total:       90,
    rationale: 'Feed-Pipeline begrenzt Output ohnehin auf 12-18 Items.',
  },

  smart_search: {
    per_query:   35,   // 15 + 10 + 10 (name + tags + talent)
    cached_ttl:  60,   // Sekunden — gleiche Suche = Cache-Hit
    rationale: 'Cache eliminiert 80%+ der wiederholten Suchen.',
  },

  graph_data: {
    follow_graph: 500,
    creator_profiles: 40,
    rationale: 'Graph-Berechnungen laufen im Worker, nicht bei jeder Render.',
  },
};

/**
 * Cache-Budgets: TTL + Memory.
 */
export const CACHE_BUDGETS = {
  max_memory_mb:  5,      // 5MB Hard Cap
  max_entries:    500,    // Max Cache-Keys
  community_ttl:  300,    // 5min
  graph_ttl:      120,    // 2min
  search_ttl:     60,     // 1min
  feed_ttl:       30,     // 30s
  rationale: 'Stale-While-Revalidate: User sieht sofort etwas, frische Daten kommen im BG.',
};

/**
 * Realtime-Budgets: Max. Channels.
 */
export const REALTIME_BUDGETS = {
  max_global_channels: 10,
  max_per_user:        3,   // bookings + chats + notifs
  idle_timeout_s:      300, // 5min idle → unsubscribe
  reconnect_max_s:     30,  // max Backoff-Delay
  rationale: 'Realtime ist teuer. Nur was wirklich live sein muss, abonnieren.',
};

/**
 * Bundle-Budgets: max. Chunk-Größen.
 */
export const BUNDLE_BUDGETS = {
  main_chunk_kb:       200,  // gzipped
  intelligence_chunk:  80,   // Discovery + Graph + Context gzipped
  lazy_threshold_kb:   50,   // Komponenten > 50KB werden lazy geladen
  rationale: 'Intelligence Layer per Code-Splitting trennen (Phase 6B).',
};

/**
 * Render-Budgets: Performance-Targets.
 */
export const RENDER_BUDGETS = {
  feed_first_item_ms:  500,   // Erstes Item erscheint in < 500ms
  feed_full_ms:        1500,  // Vollständiger Feed in < 1.5s
  pipeline_main_ms:    100,   // Pipeline im Main Thread < 100ms
  worker_timeout_ms:   5000,  // Worker-Job timeout
  search_latency_ms:   300,   // Suche fühlt sich instant an
  rationale: 'Web Vitals orientiert. Mobile first.',
};

/**
 * Memory-Budgets.
 */
export const MEMORY_BUDGETS = {
  js_heap_warning_pct: 70,   // Warnung ab 70% JS Heap
  js_heap_critical_pct:85,   // Kritisch ab 85%
  cache_warning_mb:    3,    // Cache-Warning ab 3MB
  rationale: 'Mobile hat weniger Heap. 85% → GC-Druck → Jank.',
};

/**
 * Budget-Validator: prüft ob aktuelle Metriken im Budget.
 */
export function validateBudgets(metrics = {}) {
  const violations = [];
  const warnings   = [];

  const { feedLatencyMs, cacheBytes, realtimeChannels, heapUsedPct } = metrics;

  if (feedLatencyMs > RENDER_BUDGETS.feed_full_ms) {
    violations.push({
      budget:  'feed_full_ms',
      limit:   RENDER_BUDGETS.feed_full_ms,
      actual:  feedLatencyMs,
      action:  'Pipeline optimieren oder Worker nutzen',
    });
  }

  if (cacheBytes > CACHE_BUDGETS.max_memory_mb * 1024 * 1024) {
    warnings.push({
      budget:  'cache_memory',
      limit:   `${CACHE_BUDGETS.max_memory_mb}MB`,
      actual:  `${Math.round(cacheBytes / 1024 / 1024)}MB`,
      action:  'Cache eviction prüfen',
    });
  }

  if (realtimeChannels > REALTIME_BUDGETS.max_global_channels) {
    violations.push({
      budget:  'realtime_channels',
      limit:   REALTIME_BUDGETS.max_global_channels,
      actual:  realtimeChannels,
      action:  'Channel Registry: Duplikate entfernen',
    });
  }

  if (heapUsedPct > MEMORY_BUDGETS.js_heap_critical_pct) {
    violations.push({
      budget:  'js_heap',
      limit:   `${MEMORY_BUDGETS.js_heap_critical_pct}%`,
      actual:  `${heapUsedPct}%`,
      action:  'Memory Leak prüfen, Cache reduzieren',
    });
  } else if (heapUsedPct > MEMORY_BUDGETS.js_heap_warning_pct) {
    warnings.push({
      budget: 'js_heap',
      limit:  `${MEMORY_BUDGETS.js_heap_warning_pct}%`,
      actual: `${heapUsedPct}%`,
      action: 'Im Auge behalten',
    });
  }

  return {
    pass:       violations.length === 0,
    violations,
    warnings,
    timestamp:  new Date().toISOString(),
  };
}
