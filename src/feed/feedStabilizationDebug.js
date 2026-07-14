/**
 * feedStabilizationDebug — Runtime diagnostics for feed stabilization (Release Blocker)
 *
 * Logs pipeline metrics at each stage. Exposes window.__HUI_FEED_DEBUG__ for inspection.
 * Enable verbose console output via localStorage.setItem('hui_feed_debug', '1')
 */

const STAGES = [
  "supabase",
  "items",
  "rhythmic",
  "filtered",
  "sorted",
  "resolved",
  "virtualizer",
  "sentinel",
  "keepAlive",
];

function isVerbose() {
  try {
    return import.meta.env.DEV || localStorage.getItem("hui_feed_debug") === "1";
  } catch {
    return import.meta.env.DEV;
  }
}

function now() {
  return Date.now();
}

/** @type {Record<string, unknown>} */
const state = {
  startedAt: now(),
  stages: {},
  history: [],
  sentinelFires: 0,
  loadMoreCalls: 0,
  loadMoreSkips: 0,
  hookInstances: 0,
  lastSnapshot: null,
};

function pushHistory(label, snapshot) {
  const entry = { ts: now(), label, ...snapshot };
  state.history.push(entry);
  if (state.history.length > 200) state.history.shift();
  state.lastSnapshot = entry;
}

/**
 * Log metrics for a pipeline stage.
 * @param {string} stage — one of STAGES
 * @param {Record<string, unknown>} metrics
 */
export function logFeedStage(stage, metrics = {}) {
  const snapshot = { stage, ...metrics, ts: now() };
  state.stages[stage] = snapshot;
  pushHistory(stage, metrics);

  if (typeof window !== "undefined") {
    window.__HUI_FEED_DEBUG__ = {
      ...state,
      stages: { ...state.stages },
      history: [...state.history],
    };
  }

  if (isVerbose()) {
    const parts = Object.entries(metrics)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(" ");
    console.log(`[HUI_FEED:${stage}] ${parts}`);
  }
}

/** Log data-loss detection between two counts */
export function logDataLoss(fromStage, toStage, before, after, extra = {}) {
  const lost = before - after;
  if (lost > 0 || isVerbose()) {
    logFeedStage("dataLoss", {
      from: fromStage,
      to: toStage,
      before,
      after,
      lost,
      ...extra,
    });
  }
}

export function logSentinelFire(meta = {}) {
  state.sentinelFires += 1;
  logFeedStage("sentinel", { fire: state.sentinelFires, ...meta });
}

export function logLoadMore(action, meta = {}) {
  if (action === "call") state.loadMoreCalls += 1;
  if (action === "skip") state.loadMoreSkips += 1;
  logFeedStage("pagination", { action, calls: state.loadMoreCalls, skips: state.loadMoreSkips, ...meta });
}

export function logHookMount(instanceId) {
  state.hookInstances += 1;
  logFeedStage("hook", { event: "mount", instanceId, total: state.hookInstances });
}

export function logHookUnmount(instanceId) {
  logFeedStage("hook", { event: "unmount", instanceId });
}

export function logKeepAlive(meta = {}) {
  logFeedStage("keepAlive", meta);
}

export function logVirtualizerDivergence(meta = {}) {
  logFeedStage("virtualizer", { diverged: true, ...meta });
}

export function getFeedDebugState() {
  return { ...state, stages: { ...state.stages }, history: [...state.history] };
}

export { STAGES };
