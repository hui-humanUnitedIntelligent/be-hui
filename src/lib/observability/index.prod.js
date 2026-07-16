// src/lib/observability/index.prod.js — Production no-op (zero runtime overhead)

const EMPTY_REPORT = {
  timestamp: null,
  runtime: {
    feedLatencyAvg: null,
    feedLatencyP95: null,
    pipelineAvgMs: null,
    pipelineP95Ms: null,
  },
  fps: { current: null, dropCount: 0 },
  cache: {
    cacheHitRate: null,
    totalCacheOps: 0,
    queriesSaved: 0,
    rowsSaved: 0,
    estimatedSavingsUSD: 0,
    workerOffloadCount: 0,
    workerAvgMs: null,
  },
  realtime: { score: 1, level: 'stable', reconnects: 0, bursts: 0 },
  mobile: { score: 1, level: 'smooth', avgFps: null, recentDrops: 0, deviceTier: 'CAPABLE' },
  errors: {
    level: 'clean',
    asyncFails: 0,
    pipelineFails: 0,
    workerCrashes: 0,
    workerTimeouts: 0,
    rtReconnects: 0,
    topErrors: [],
  },
  react: null,
  memory: null,
  navigation: null,
  performanceMarks: [],
  score: { value: 1, level: 'excellent' },
};

const noop = () => {};

export const metrics = {
  feedLatency: noop,
  routeStartup: noop,
  interactionLatency: noop,
  overlayLatency: noop,
  pipelineRun: noop,
  cacheHit: noop,
  cacheMiss: noop,
  cacheEvict: noop,
  workerDone: noop,
  workerTimeout: noop,
  workerCrash: noop,
  rtReconnect: noop,
  rtBurst: noop,
  asyncFail: noop,
  pipelineFail: noop,
  querySaved: noop,
};

export function startFpsTracking() {}
export function stopFpsTracking() {}
export function traceStage(_name, fn) { return fn; }
export function realtimeHealthScore() { return EMPTY_REPORT.realtime; }
export function mobileExperienceScore(deviceTier = 'CAPABLE') {
  return { ...EMPTY_REPORT.mobile, deviceTier };
}
export function errorSummary() { return EMPTY_REPORT.errors; }
export function costSummary() { return EMPTY_REPORT.cache; }
export function getObservabilityReport() { return { ...EMPTY_REPORT, timestamp: new Date().toISOString() }; }
export function logObservabilitySnapshot() {}
export function initObservability() {}
export function captureMemorySnapshot() { return null; }
export function perfMark() {}
export function perfMeasure() { return null; }
