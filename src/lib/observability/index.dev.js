// src/lib/observability/index.dev.js — DEV-only Observability Layer (Phase 6C + Sprint 13)
import {
  installReactProfiler,
  getReactObservabilityReport,
  REACT_REGISTRY,
} from './reactProfiler.js';

const MAX_RING = 200;

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

const REGISTRY = {
  feedLatency:        new RingBuffer(50),
  routeStartup:       new RingBuffer(20),
  interactionLatency: new RingBuffer(50),
  overlayLatency:     new RingBuffer(20),
  pipelineTotal:      new RingBuffer(30),
  pipelineStages:     new RingBuffer(30),
  fps:                new RingBuffer(60),
  frameDrops:         new RingBuffer(30),
  cacheHits:          new RingBuffer(100),
  cacheMisses:        new RingBuffer(100),
  cacheEvictions:     new RingBuffer(30),
  workerDurations:    new RingBuffer(30),
  workerTimeouts:     new RingBuffer(10),
  workerCrashes:      new RingBuffer(10),
  realtimeReconnects: new RingBuffer(20),
  realtimeEventBursts:new RingBuffer(10),
  asyncFailures:      new RingBuffer(20),
  pipelineFailures:   new RingBuffer(10),
  memorySnapshots:    new RingBuffer(30),
  queriesSaved:       0,
  rowsSaved:          0,
};

let _navigationTiming = null;
let _memoryInterval   = null;
let _fpsActive        = false;
let _fpsRafHandle     = null;

export const metrics = {
  feedLatency:        (ms)  => REGISTRY.feedLatency.push({ ms, ts: Date.now() }),
  routeStartup:       (route, ms) => REGISTRY.routeStartup.push({ route, ms, ts: Date.now() }),
  interactionLatency: (type, ms)  => REGISTRY.interactionLatency.push({ type, ms, ts: Date.now() }),
  overlayLatency:     (name, ms)  => REGISTRY.overlayLatency.push({ name, ms, ts: Date.now() }),
  pipelineRun:  (totalMs, stages = {}) => {
    REGISTRY.pipelineTotal.push({ totalMs, ts: Date.now() });
    REGISTRY.pipelineStages.push({ stages, ts: Date.now() });
  },
  cacheHit:   (ns) => REGISTRY.cacheHits.push({ ns, ts: Date.now() }),
  cacheMiss:  (ns) => REGISTRY.cacheMisses.push({ ns, ts: Date.now() }),
  cacheEvict: ()   => REGISTRY.cacheEvictions.push({ ts: Date.now() }),
  workerDone:    (type, ms) => REGISTRY.workerDurations.push({ type, ms, ts: Date.now() }),
  workerTimeout: (type)     => REGISTRY.workerTimeouts.push({ type, ts: Date.now() }),
  workerCrash:   (msg)      => REGISTRY.workerCrashes.push({ msg, ts: Date.now() }),
  rtReconnect: (channel, attempt) => REGISTRY.realtimeReconnects.push({ channel, attempt, ts: Date.now() }),
  rtBurst:     (channel, count)   => REGISTRY.realtimeEventBursts.push({ channel, count, ts: Date.now() }),
  asyncFail:     (context, msg) => REGISTRY.asyncFailures.push({ context, msg, ts: Date.now() }),
  pipelineFail:  (stage, msg)   => REGISTRY.pipelineFailures.push({ stage, msg, ts: Date.now() }),
  querySaved:    (rows = 0) => {
    REGISTRY.queriesSaved++;
    REGISTRY.rowsSaved += rows;
  },
};

export function perfMark(name) {
  try {
    performance.mark(`hui:${name}`);
  } catch (_) { /* duplicate mark */ }
}

export function perfMeasure(name, startMark, endMark) {
  try {
    const m = performance.measure(`hui:${name}`, `hui:${startMark}`, endMark ? `hui:${endMark}` : undefined);
    return m ? { name: m.name, durationMs: Math.round(m.duration * 100) / 100 } : null;
  } catch (_) {
    return null;
  }
}

export function captureMemorySnapshot() {
  const snap = {
    ts: Date.now(),
    jsHeapUsed: null,
    jsHeapTotal: null,
    jsHeapLimit: null,
  };
  if (performance.memory) {
    snap.jsHeapUsed  = performance.memory.usedJSHeapSize;
    snap.jsHeapTotal = performance.memory.totalJSHeapSize;
    snap.jsHeapLimit = performance.memory.jsHeapSizeLimit;
  }
  REGISTRY.memorySnapshots.push(snap);
  return snap;
}

function captureNavigationTiming() {
  const nav = performance.getEntriesByType('navigation')[0];
  if (!nav) return null;
  _navigationTiming = {
    ts: Date.now(),
    ttfbMs:        Math.round(nav.responseStart - nav.startTime),
    domInteractiveMs: Math.round(nav.domInteractive - nav.startTime),
    domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
    loadEventMs:   Math.round(nav.loadEventEnd - nav.startTime),
    transferSize:  nav.transferSize,
    type:          nav.type,
  };
  perfMark('navigation-captured');
  return _navigationTiming;
}

function getPerformanceMarks() {
  return performance.getEntriesByType('mark')
    .filter(m => m.name.startsWith('hui:'))
    .map(m => ({ name: m.name, ms: Math.round(m.startTime * 100) / 100 }));
}

function getPerformanceMeasures() {
  return performance.getEntriesByType('measure')
    .filter(m => m.name.startsWith('hui:'))
    .map(m => ({ name: m.name, durationMs: Math.round(m.duration * 100) / 100 }));
}

export function startFpsTracking() {
  if (_fpsActive || typeof requestAnimationFrame === 'undefined') return;
  _fpsActive = true;
  let lastFrameTime = performance.now();
  let frameCount = 0;
  let secStart = performance.now();
  const dropThresh = 45;

  function frame(now) {
    if (!_fpsActive) return;
    frameCount++;
    const delta = now - lastFrameTime;
    if (delta > 1000 / dropThresh) {
      REGISTRY.frameDrops.push({ deltaMs: Math.round(delta), ts: Date.now() });
    }
    lastFrameTime = now;
    if (now - secStart >= 1000) {
      const fps = Math.round(frameCount * 1000 / (now - secStart));
      REGISTRY.fps.push({ fps, ts: Date.now() });
      frameCount = 0;
      secStart = now;
    }
    _fpsRafHandle = requestAnimationFrame(frame);
  }
  _fpsRafHandle = requestAnimationFrame(frame);
}

export function stopFpsTracking() {
  _fpsActive = false;
  if (_fpsRafHandle) cancelAnimationFrame(_fpsRafHandle);
}

export function traceStage(name, fn) {
  return function traced(...args) {
    const t0 = performance.now();
    const result = fn.apply(this, args);
    const ms = Math.round(performance.now() - t0);
    REGISTRY.pipelineStages.push({ stage: name, ms, ts: Date.now() });
    return result;
  };
}

export function realtimeHealthScore() {
  const recent10m = Date.now() - 600_000;
  const recentReconnects = REGISTRY.realtimeReconnects.toArray().filter(r => r.ts > recent10m).length;
  const recentBursts     = REGISTRY.realtimeEventBursts.toArray().filter(b => b.ts > recent10m).length;
  let score = 1.0;
  if (recentReconnects > 5) score -= 0.3;
  else if (recentReconnects > 2) score -= 0.1;
  if (recentBursts > 3) score -= 0.2;
  return {
    score: Math.max(0, Math.round(score * 100) / 100),
    level: score > 0.8 ? 'stable' : score > 0.5 ? 'degraded' : 'unstable',
    reconnects: recentReconnects,
    bursts: recentBursts,
  };
}

export function mobileExperienceScore(deviceTier = 'CAPABLE') {
  const recent = Date.now() - 60_000;
  const recentFps = REGISTRY.fps.toArray().filter(f => f.ts > recent).map(f => f.fps);
  const recentDrops = REGISTRY.frameDrops.toArray().filter(d => d.ts > recent).length;
  const avgFps = recentFps.length
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
    score: Math.max(0, Math.round(score * 100) / 100),
    level: score > 0.8 ? 'smooth' : score > 0.6 ? 'acceptable' : 'janky',
    avgFps,
    recentDrops,
    deviceTier,
  };
}

export function errorSummary() {
  const recent5m = Date.now() - 300_000;
  const asyncFails     = REGISTRY.asyncFailures.toArray().filter(e => e.ts > recent5m);
  const pipelineFails  = REGISTRY.pipelineFailures.toArray().filter(e => e.ts > recent5m);
  const workerCrashes  = REGISTRY.workerCrashes.toArray().filter(e => e.ts > recent5m);
  const workerTimeouts = REGISTRY.workerTimeouts.toArray().filter(e => e.ts > recent5m);
  const rtReconnects   = REGISTRY.realtimeReconnects.toArray().filter(e => e.ts > recent5m);
  const total = asyncFails.length + pipelineFails.length + workerCrashes.length;
  const level =
    workerCrashes.length > 0 ? 'critical' :
    total > 5 ? 'elevated' :
    total > 0 ? 'low' : 'clean';
  return {
    level,
    asyncFails: asyncFails.length,
    pipelineFails: pipelineFails.length,
    workerCrashes: workerCrashes.length,
    workerTimeouts: workerTimeouts.length,
    rtReconnects: rtReconnects.length,
    topErrors: [...asyncFails, ...pipelineFails].slice(-5).map(e => ({ context: e.context || e.stage, msg: e.msg })),
  };
}

export function costSummary() {
  const hits   = REGISTRY.cacheHits.toArray();
  const misses = REGISTRY.cacheMisses.toArray();
  const total  = hits.length + misses.length;
  const hitRate = total > 0 ? Math.round(hits.length / total * 100) : null;
  return {
    cacheHitRate: hitRate,
    totalCacheOps: total,
    queriesSaved: REGISTRY.queriesSaved,
    rowsSaved: REGISTRY.rowsSaved,
    estimatedSavingsUSD: Math.round(REGISTRY.rowsSaved / 1000 * 0.002 * 100) / 100,
    workerOffloadCount: REGISTRY.workerDurations.length,
    workerAvgMs: REGISTRY.workerDurations.toArray().length > 0
      ? Math.round(REGISTRY.workerDurations.toArray().reduce((a, w) => a + w.ms, 0) / REGISTRY.workerDurations.toArray().length)
      : null,
  };
}

function _avg(arr) {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
}

function _p95(arr) {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1];
}

function _computeOperationalScore() {
  const rt = realtimeHealthScore();
  const errs = errorSummary();
  const fps = REGISTRY.fps.toArray().slice(-1)[0]?.fps || 60;
  const feed = REGISTRY.feedLatency.toArray().slice(-1)[0]?.ms || 0;
  let score = 1.0;
  score *= rt.score;
  if (errs.level === 'critical') score -= 0.4;
  if (errs.level === 'elevated') score -= 0.2;
  if (fps < 30) score -= 0.2;
  if (feed > 2000) score -= 0.2;
  else if (feed > 1000) score -= 0.1;
  return {
    value: Math.max(0, Math.round(score * 100) / 100),
    level: score > 0.85 ? 'excellent' : score > 0.70 ? 'healthy' : score > 0.50 ? 'degraded' : 'critical',
  };
}

export function getObservabilityReport(deviceTier = 'CAPABLE') {
  const feedLatencies  = REGISTRY.feedLatency.toArray().map(r => r.ms);
  const pipelineTotals = REGISTRY.pipelineTotal.toArray().map(r => r.totalMs);
  const memSnaps = REGISTRY.memorySnapshots.toArray();

  return {
    timestamp: new Date().toISOString(),
    runtime: {
      feedLatencyAvg: _avg(feedLatencies),
      feedLatencyP95: _p95(feedLatencies),
      pipelineAvgMs:  _avg(pipelineTotals),
      pipelineP95Ms:  _p95(pipelineTotals),
    },
    fps: {
      current: REGISTRY.fps.toArray().slice(-1)[0]?.fps || null,
      dropCount: REGISTRY.frameDrops.toArray().filter(d => d.ts > Date.now() - 60_000).length,
    },
    cache: costSummary(),
    realtime: realtimeHealthScore(),
    mobile: mobileExperienceScore(deviceTier),
    errors: errorSummary(),
    react: getReactObservabilityReport(),
    memory: {
      latest: memSnaps.slice(-1)[0] || captureMemorySnapshot(),
      snapshots: memSnaps.slice(-5),
    },
    navigation: _navigationTiming || captureNavigationTiming(),
    performanceMarks: getPerformanceMarks(),
    performanceMeasures: getPerformanceMeasures(),
    score: _computeOperationalScore(),
  };
}

export function logObservabilitySnapshot() {
  const report = getObservabilityReport();
  console.group('[HUI Observability] Snapshot');
  console.log('Runtime:   ', report.runtime);
  console.log('FPS:       ', report.fps);
  console.log('React:     ', report.react);
  console.log('Memory:    ', report.memory);
  console.log('Navigation:', report.navigation);
  console.log('Score:     ', report.score);
  console.groupEnd();
}

export function initObservability() {
  if (typeof window === 'undefined') return;

  perfMark('obs-init-start');
  installReactProfiler();
  captureNavigationTiming();
  captureMemorySnapshot();
  startFpsTracking();

  if (!_memoryInterval) {
    _memoryInterval = setInterval(captureMemorySnapshot, 60_000);
  }

  window.__HUI_OBSERVABILITY__ = {
    getReport: getObservabilityReport,
    metrics,
    captureMemorySnapshot,
    perfMark,
    perfMeasure,
    logSnapshot: logObservabilitySnapshot,
    reactRegistry: REACT_REGISTRY,
  };

  perfMark('obs-init-end');
  perfMeasure('obs-init', 'obs-init-start', 'obs-init-end');
}
