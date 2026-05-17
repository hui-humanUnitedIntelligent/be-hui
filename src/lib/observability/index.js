// src/lib/observability/index.js
// HUI — Observability Layer V1 — Phase 6C
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Wir beobachten die PLATTFORM — nicht Menschen.
// Keine User-Verhaltens-Tracker. Keine Engagement-Metriken.
// Nur: technische Stabilität und Qualität.
//
// WAS GEMESSEN WIRD:
//   ✅ Feed Latency, FPS, Frame Drops
//   ✅ Pipeline Stage Timings
//   ✅ Cache Hit/Miss Rates
//   ✅ Worker Execution Times
//   ✅ Realtime Reconnect Frequency
//   ✅ Error Rates und Types
//   ✅ Query Cost Savings durch Cache
//
// WAS NICHT GEMESSEN WIRD:
//   ❌ User-Scrolltiefe
//   ❌ Session-Dauer
//   ❌ Klick-Pfade
//   ❌ Engagement-Rate
//   ❌ Retention-Metriken
//
// DESIGN:
//   Sampling-basiert (nicht jeder Frame gemessen)
//   Low-Overhead (< 0.5ms pro Messung)
//   Memory-safe (Ring Buffer, max 200 Einträge)
//   Mobile-safe (deaktivierbar per Budget)
// ═══════════════════════════════════════════════════════════════

const IS_DEV = import.meta.env?.DEV || false;
const MAX_RING = 200;  // Ring Buffer — älteste Einträge werden überschrieben

// ── Ring Buffer ─────────────────────────────────────────────────
class RingBuffer {
  constructor(max = MAX_RING) {
    this._buf = new Array(max);
    this._max = max;
    this._pos = 0;
    this._len = 0;
  }
  push(v) {
    this._buf[this._pos] = v;
    this._pos = (this._pos + 1) % this._max;
    if (this._len < this._max) this._len++;
  }
  toArray() {
    if (this._len < this._max) return this._buf.slice(0, this._len);
    return [
      ...this._buf.slice(this._pos),
      ...this._buf.slice(0, this._pos),
    ].filter(Boolean);
  }
  get length() { return this._len; }
  clear() { this._pos = 0; this._len = 0; }
}

// ── Metric Registry (Singleton) ────────────────────────────────
const REGISTRY = {
  // Performance
  feedLatency:       new RingBuffer(50),
  routeStartup:      new RingBuffer(20),
  interactionLatency:new RingBuffer(50),
  overlayLatency:    new RingBuffer(20),

  // Pipeline
  pipelineTotal:     new RingBuffer(30),
  pipelineStages:    new RingBuffer(30),   // Objekte: { stage, ms }

  // FPS + Frames
  fps:               new RingBuffer(60),
  frameDrops:        new RingBuffer(30),

  // Cache
  cacheHits:         new RingBuffer(100),
  cacheMisses:       new RingBuffer(100),
  cacheEvictions:    new RingBuffer(30),

  // Worker
  workerDurations:   new RingBuffer(30),
  workerTimeouts:    new RingBuffer(10),
  workerCrashes:     new RingBuffer(10),

  // Realtime
  realtimeReconnects:new RingBuffer(20),
  realtimeEventBursts:new RingBuffer(10),

  // Errors
  asyncFailures:     new RingBuffer(20),
  pipelineFailures:  new RingBuffer(10),

  // Cost Savings (Schätzung)
  queriesSaved:      0,   // Zähler
  rowsSaved:         0,   // Zähler
};

// ── 6C.1 — Metric Recorder API ─────────────────────────────────

export const metrics = {
  // Feed
  feedLatency:       (ms)  => REGISTRY.feedLatency.push({ ms, ts: Date.now() }),
  routeStartup:      (route, ms) => REGISTRY.routeStartup.push({ route, ms, ts: Date.now() }),
  interactionLatency:(type, ms)  => REGISTRY.interactionLatency.push({ type, ms, ts: Date.now() }),
  overlayLatency:    (name, ms)  => REGISTRY.overlayLatency.push({ name, ms, ts: Date.now() }),

  // Pipeline
  pipelineRun:  (totalMs, stages = {}) => {
    REGISTRY.pipelineTotal.push({ totalMs, ts: Date.now() });
    REGISTRY.pipelineStages.push({ stages, ts: Date.now() });
  },

  // Cache
  cacheHit:   (ns) => REGISTRY.cacheHits.push({ ns, ts: Date.now() }),
  cacheMiss:  (ns) => {
    REGISTRY.cacheMisses.push({ ns, ts: Date.now() });
  },
  cacheEvict: ()   => REGISTRY.cacheEvictions.push({ ts: Date.now() }),

  // Worker
  workerDone:    (type, ms) => REGISTRY.workerDurations.push({ type, ms, ts: Date.now() }),
  workerTimeout: (type)     => REGISTRY.workerTimeouts.push({ type, ts: Date.now() }),
  workerCrash:   (msg)      => REGISTRY.workerCrashes.push({ msg, ts: Date.now() }),

  // Realtime
  rtReconnect: (channel, attempt) => REGISTRY.realtimeReconnects.push({ channel, attempt, ts: Date.now() }),
  rtBurst:     (channel, count)   => REGISTRY.realtimeEventBursts.push({ channel, count, ts: Date.now() }),

  // Errors
  asyncFail:     (context, msg) => REGISTRY.asyncFailures.push({ context, msg, ts: Date.now() }),
  pipelineFail:  (stage, msg)   => REGISTRY.pipelineFailures.push({ stage, msg, ts: Date.now() }),

  // Cost Savings
  querySaved:    (rows = 0) => {
    REGISTRY.queriesSaved++;
    REGISTRY.rowsSaved += rows;
  },
};

// ── 6C.2 — FPS Tracker ─────────────────────────────────────────
let _fpsActive      = false;
let _lastFrameTime  = 0;
let _frameCount     = 0;
let _fpsRafHandle   = null;
let _fpsDropThresh  = 45;  // < 45fps = Frame Drop

export function startFpsTracking() {
  if (_fpsActive || typeof requestAnimationFrame === 'undefined') return;
  _fpsActive   = true;
  _lastFrameTime = performance.now();
  _frameCount  = 0;

  let secStart = performance.now();

  function frame(now) {
    if (!_fpsActive) return;
    _frameCount++;

    // Frame Drop Detection
    const delta = now - _lastFrameTime;
    if (delta > 1000 / _fpsDropThresh) {
      REGISTRY.frameDrops.push({ deltaMs: Math.round(delta), ts: Date.now() });
    }
    _lastFrameTime = now;

    // FPS alle 1s aufzeichnen (Sampling — nicht jeden Frame)
    if (now - secStart >= 1000) {
      const fps = Math.round(_frameCount * 1000 / (now - secStart));
      REGISTRY.fps.push({ fps, ts: Date.now() });
      _frameCount = 0;
      secStart    = now;
    }

    _fpsRafHandle = requestAnimationFrame(frame);
  }

  _fpsRafHandle = requestAnimationFrame(frame);
}

export function stopFpsTracking() {
  _fpsActive = false;
  if (_fpsRafHandle) cancelAnimationFrame(_fpsRafHandle);
}

// ── 6C.3 — Pipeline Trace Decorator ───────────────────────────
/**
 * Wraps eine Pipeline-Stage-Funktion mit Timing.
 * Zero-Overhead wenn observability deaktiviert.
 */
export function traceStage(name, fn) {
  return function(...args) {
    const t0     = performance.now();
    const result = fn.apply(this, args);
    const ms     = Math.round(performance.now() - t0);
    REGISTRY.pipelineStages.push({ stage: name, ms, ts: Date.now() });
    return result;
  };
}

// ── 6C.4 — Realtime Health Score ───────────────────────────────
/**
 * Berechnet Realtime-Gesundheit aus gesammelten Metriken.
 * Score 0–1: 1 = perfekt stabil, 0 = kritisch.
 */
export function realtimeHealthScore() {
  const reconnects = REGISTRY.realtimeReconnects.toArray();
  const bursts     = REGISTRY.realtimeEventBursts.toArray();

  // Reconnects der letzten 10min
  const recent10m  = Date.now() - 600_000;
  const recentReconnects = reconnects.filter(r => r.ts > recent10m).length;
  const recentBursts     = bursts.filter(b => b.ts > recent10m).length;

  let score = 1.0;
  if (recentReconnects > 5)  score -= 0.3;
  else if (recentReconnects > 2) score -= 0.1;
  if (recentBursts > 3)     score -= 0.2;

  return {
    score:      Math.max(0, Math.round(score * 100) / 100),
    level:      score > 0.8 ? 'stable' : score > 0.5 ? 'degraded' : 'unstable',
    reconnects: recentReconnects,
    bursts:     recentBursts,
  };
}

// ── 6C.5 — Mobile Experience Score ─────────────────────────────
export function mobileExperienceScore(deviceTier = 'CAPABLE') {
  const fps     = REGISTRY.fps.toArray();
  const drops   = REGISTRY.frameDrops.toArray();
  const recent  = Date.now() - 60_000;  // Letzte Minute

  const recentFps    = fps.filter(f => f.ts > recent).map(f => f.fps);
  const recentDrops  = drops.filter(d => d.ts > recent).length;
  const avgFps       = recentFps.length
    ? Math.round(recentFps.reduce((a, b) => a + b, 0) / recentFps.length)
    : null;

  let score = 1.0;
  if (avgFps !== null) {
    if (avgFps < 30) score -= 0.4;
    else if (avgFps < 45) score -= 0.2;
    else if (avgFps < 55) score -= 0.1;
  }
  if (recentDrops > 10) score -= 0.3;
  else if (recentDrops > 5) score -= 0.1;

  return {
    score:      Math.max(0, Math.round(score * 100) / 100),
    level:      score > 0.8 ? 'smooth' : score > 0.6 ? 'acceptable' : 'janky',
    avgFps,
    recentDrops,
    deviceTier,
  };
}

// ── 6C.6 — Error Observability ──────────────────────────────────
export function errorSummary() {
  const recent5m = Date.now() - 300_000;

  const asyncFails    = REGISTRY.asyncFailures.toArray().filter(e => e.ts > recent5m);
  const pipelineFails = REGISTRY.pipelineFailures.toArray().filter(e => e.ts > recent5m);
  const workerCrashes = REGISTRY.workerCrashes.toArray().filter(e => e.ts > recent5m);
  const workerTimeouts= REGISTRY.workerTimeouts.toArray().filter(e => e.ts > recent5m);
  const rtReconnects  = REGISTRY.realtimeReconnects.toArray().filter(e => e.ts > recent5m);

  const total = asyncFails.length + pipelineFails.length + workerCrashes.length;
  const level =
    workerCrashes.length > 0 ? 'critical' :
    total > 5               ? 'elevated'  :
    total > 0               ? 'low'       : 'clean';

  return {
    level,
    asyncFails:    asyncFails.length,
    pipelineFails: pipelineFails.length,
    workerCrashes: workerCrashes.length,
    workerTimeouts:workerTimeouts.length,
    rtReconnects:  rtReconnects.length,
    topErrors:     [...asyncFails, ...pipelineFails]
      .slice(-5)
      .map(e => ({ context: e.context || e.stage, msg: e.msg })),
  };
}

// ── 6C.7 — Cost Observability ──────────────────────────────────
export function costSummary() {
  const hits   = REGISTRY.cacheHits.toArray();
  const misses = REGISTRY.cacheMisses.toArray();
  const total  = hits.length + misses.length;
  const hitRate = total > 0 ? Math.round(hits.length / total * 100) : null;

  // Geschätzte Einsparungen (Basis: 1350 rows pro Community Health Load)
  const estimatedRowsSaved = REGISTRY.rowsSaved;
  const estimatedQueriesSaved = REGISTRY.queriesSaved;

  // Supabase Cost-Proxy (rough: 1000 rows ≈ $0.002)
  const estimatedSavingsUSD =
    Math.round(estimatedRowsSaved / 1000 * 0.002 * 100) / 100;

  return {
    cacheHitRate:        hitRate,
    totalCacheOps:       total,
    queriesSaved:        estimatedQueriesSaved,
    rowsSaved:           estimatedRowsSaved,
    estimatedSavingsUSD,
    workerOffloadCount:  REGISTRY.workerDurations.length,
    workerAvgMs: REGISTRY.workerDurations.toArray().length > 0
      ? Math.round(
          REGISTRY.workerDurations.toArray().reduce((a, w) => a + w.ms, 0)
          / REGISTRY.workerDurations.toArray().length
        )
      : null,
  };
}

// ── MASTER: getObservabilityReport ─────────────────────────────
/**
 * Vollständiger Observability-Report.
 * Aggregiert alle Subsysteme in einen einzigen Snapshot.
 */
export function getObservabilityReport(deviceTier = 'CAPABLE') {
  const feedLatencies = REGISTRY.feedLatency.toArray().map(r => r.ms);
  const pipelineTotals= REGISTRY.pipelineTotal.toArray().map(r => r.totalMs);
  const avg           = arr => arr.length
    ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
  const p95           = arr => {
    if (!arr.length) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1];
  };

  return {
    timestamp: new Date().toISOString(),

    runtime: {
      feedLatencyAvg:  avg(feedLatencies),
      feedLatencyP95:  p95(feedLatencies),
      pipelineAvgMs:   avg(pipelineTotals),
      pipelineP95Ms:   p95(pipelineTotals),
    },

    fps:         {
      current: REGISTRY.fps.toArray().slice(-1)[0]?.fps || null,
      dropCount: REGISTRY.frameDrops.toArray().filter(
        d => d.ts > Date.now() - 60_000
      ).length,
    },

    cache:       costSummary(),
    realtime:    realtimeHealthScore(),
    mobile:      mobileExperienceScore(deviceTier),
    errors:      errorSummary(),

    // Gesamt-Operational-Score
    score: _computeOperationalScore(),
  };
}

function _computeOperationalScore() {
  const rt    = realtimeHealthScore();
  const errs  = errorSummary();
  const fps   = REGISTRY.fps.toArray().slice(-1)[0]?.fps || 60;
  const feed  = REGISTRY.feedLatency.toArray().slice(-1)[0]?.ms || 0;

  let score = 1.0;
  score *= rt.score;                          // Realtime-Anteil
  if (errs.level === 'critical') score -= 0.4;
  if (errs.level === 'elevated') score -= 0.2;
  if (fps < 30) score -= 0.2;
  if (feed > 2000) score -= 0.2;
  else if (feed > 1000) score -= 0.1;

  return {
    value: Math.max(0, Math.round(score * 100) / 100),
    level: score > 0.85 ? 'excellent'  :
           score > 0.70 ? 'healthy'    :
           score > 0.50 ? 'degraded'   : 'critical',
  };
}

// ── Dev-only Logging ───────────────────────────────────────────
export function logObservabilitySnapshot() {
  if (!IS_DEV) return;
  const report = getObservabilityReport();
  console.group('[HUI Observability] Snapshot');
  console.log('Runtime:  ', report.runtime);
  console.log('FPS:      ', report.fps);
  console.log('Cache:    ', report.cache);
  console.log('Realtime: ', report.realtime);
  console.log('Errors:   ', report.errors);
  console.log('Score:    ', report.score);
  console.groupEnd();
}
