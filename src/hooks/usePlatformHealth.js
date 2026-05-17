// src/hooks/usePlatformHealth.js
// HUI — Platform Health Monitor — Phase 6A.7
// ═══════════════════════════════════════════════════════════════
//
// MISST (nur Gesundheits-Metriken, keine Vanity KPIs):
//   - Feed Latency (Zeit bis erste Items erscheinen)
//   - Cache Hit Rate (L1 + L2)
//   - Realtime Stability (Channel-Status)
//   - Pipeline Timing (Stage-Breakdown)
//   - Memory Usage (JS Heap wenn verfügbar)
//   - Worker Status (Main Thread entlastet?)
//
// NICHT gemessen:
//   ❌ Screen Time, DAU, Scroll-Tiefe, Engagement-Rate
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect, useRef } from 'react';
import { getCacheStats } from '@/lib/cache/index';
import { getRealtimeStats } from '@/lib/realtime/index';

export function usePlatformHealth() {
  const [metrics,    setMetrics]    = useState(null);
  const timingsRef   = useRef({});   // Akkumulierte Timings

  // Feed Latency messen
  const markFeedStart  = useCallback(() => {
    timingsRef.current.feedStart = performance.now();
  }, []);

  const markFeedReady  = useCallback((itemCount) => {
    if (!timingsRef.current.feedStart) return;
    const latency = Math.round(performance.now() - timingsRef.current.feedStart);
    timingsRef.current.feedLatency  = latency;
    timingsRef.current.feedItems    = itemCount;
    timingsRef.current.feedStart    = null;
  }, []);

  // Pipeline Audit speichern
  const recordPipelineAudit = useCallback((audit) => {
    if (!audit) return;
    timingsRef.current.pipeline = {
      total:       audit.timing?.total || 0,
      graphMs:     audit.timing?.s3_graph || 0,
      contextMs:   audit.timing?.s4_context || 0,
      healthMs:    audit.timing?.s5_health || 0,
      candidates:  audit.stages?.s1_candidates || 0,
      finalItems:  audit.stages?.s8_final || 0,
    };
  }, []);

  // Vollständigen Report erstellen
  const getReport = useCallback(() => {
    const cache    = getCacheStats();
    const realtime = getRealtimeStats();
    const memory   = typeof performance !== 'undefined' && performance.memory
      ? {
          used:  Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
          usage: `${Math.round(performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100)}%`,
        }
      : null;

    const report = {
      feed: {
        latencyMs:  timingsRef.current.feedLatency || null,
        items:      timingsRef.current.feedItems   || null,
        quality:    timingsRef.current.feedLatency < 500 ? 'fast'
                  : timingsRef.current.feedLatency < 1500 ? 'acceptable'
                  : 'slow',
      },
      pipeline: timingsRef.current.pipeline || null,
      cache: {
        l1Entries:  cache.l1.entries,
        l1Usage:    cache.l1.usage,
        l1Bytes:    Math.round(cache.l1.bytes / 1024) + 'KB',
      },
      realtime: {
        activeChannels: realtime.activeChannels,
        channels:       realtime.channels,
      },
      memory,
      timestamp: new Date().toISOString(),
    };

    // Gesundheits-Score aus Metriken ableiten
    let score = 1.0;
    if (report.feed.latencyMs > 2000)  score -= 0.3;
    if (report.feed.latencyMs > 1000)  score -= 0.1;
    if (cache.l1.bytes > 3 * 1024 * 1024) score -= 0.1;  // > 3MB Cache
    if (realtime.channels.some(c => c.idleMs > 300000))   score -= 0.1;  // Stale Channel
    if (memory && memory.used > memory.limit * 0.8)        score -= 0.2;  // > 80% Heap

    report.healthScore = Math.round(Math.max(0, score) * 100) / 100;
    report.healthLevel = score > 0.8 ? 'healthy' : score > 0.6 ? 'acceptable' : 'degraded';

    return report;
  }, []);

  const refresh = useCallback(() => {
    setMetrics(getReport());
  }, [getReport]);

  // Auto-refresh alle 30s
  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 30_000);
    return () => clearInterval(iv);
  }, [refresh]);

  return {
    metrics,
    markFeedStart,
    markFeedReady,
    recordPipelineAudit,
    refresh,
  };
}
