// src/lib/observability/reactProfiler.js — DEV-only React runtime instrumentation
// Hooks __REACT_DEVTOOLS_GLOBAL_HOOK__ — no component changes required.

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
}

export const REACT_REGISTRY = {
  commits:       new RingBuffer(100),
  renderDurations: new RingBuffer(100),
  mounts:        new RingBuffer(100),
  rerenders:     new RingBuffer(200),
};

let _installed = false;
const _componentCounts = new Map();
const _mountedAt = new WeakMap();

function fiberName(fiber) {
  if (!fiber?.type) return 'Unknown';
  if (typeof fiber.type === 'string') return fiber.type;
  return fiber.type.displayName || fiber.type.name || 'Anonymous';
}

function walkFiber(rootFiber, stats) {
  if (!rootFiber) return;
  const stack = [rootFiber];
  while (stack.length) {
    const fiber = stack.pop();
    if (!fiber) continue;

    const name = fiberName(fiber);
    if (fiber.tag >= 0) {
      const isMount = fiber.alternate == null && fiber.return != null;
      const isUpdate = fiber.alternate != null;
      if (isMount) {
        stats.mounts++;
        _mountedAt.set(fiber, performance.now());
        REACT_REGISTRY.mounts.push({ component: name, ts: Date.now() });
      } else if (isUpdate) {
        stats.rerenders++;
        const prev = _componentCounts.get(name) || 0;
        _componentCounts.set(name, prev + 1);
        REACT_REGISTRY.rerenders.push({ component: name, ts: Date.now() });
      }
    }

    if (fiber.sibling) stack.push(fiber.sibling);
    if (fiber.child) stack.push(fiber.child);
  }
}

export function installReactProfiler() {
  if (_installed || typeof window === 'undefined') return false;
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return false;

  const origCommit = hook.onCommitFiberRoot;
  const origRender = hook.onRender;

  hook.onCommitFiberRoot = function onCommitFiberRoot(rendererID, root, ...rest) {
    const t0 = performance.now();
    if (origCommit) origCommit.call(this, rendererID, root, ...rest);
    const commitMs = performance.now() - t0;

    const stats = { mounts: 0, rerenders: 0 };
    try {
      walkFiber(root?.current, stats);
    } catch (_) { /* fiber walk optional */ }

    REACT_REGISTRY.commits.push({
      ms: Math.round(commitMs * 100) / 100,
      mounts: stats.mounts,
      rerenders: stats.rerenders,
      ts: Date.now(),
    });
  };

  if (typeof origRender === 'function' || hook.inject) {
    hook.onRender = function onRender(rendererID, fiber, phase, actualDuration, ...rest) {
      if (origRender) origRender.call(this, rendererID, fiber, phase, actualDuration, ...rest);
      if (typeof actualDuration === 'number' && actualDuration > 0) {
        REACT_REGISTRY.renderDurations.push({
          component: fiberName(fiber),
          phase,
          ms: Math.round(actualDuration * 100) / 100,
          ts: Date.now(),
        });
      }
    };
  }

  _installed = true;
  return true;
}

function avg(arr) {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 100) / 100 : null;
}

function p95(arr) {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1];
}

export function getReactObservabilityReport() {
  const commits = REACT_REGISTRY.commits.toArray();
  const commitMs = commits.map(c => c.ms);
  const renders = REACT_REGISTRY.renderDurations.toArray();
  const renderMs = renders.map(r => r.ms);

  const topComponents = [..._componentCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([component, count]) => ({ component, rerenderCount: count }));

  const mountCount = REACT_REGISTRY.mounts.length;
  const rerenderCount = REACT_REGISTRY.rerenders.length;

  return {
    installed: _installed,
    commitCount: commits.length,
    commitAvgMs: avg(commitMs),
    commitP95Ms: p95(commitMs),
    commitMaxMs: commitMs.length ? Math.max(...commitMs) : null,
    renderCount: renders.length,
    renderAvgMs: avg(renderMs),
    renderP95Ms: p95(renderMs),
    mountCount,
    rerenderCount,
    topComponents,
    recentCommits: commits.slice(-5),
    recentRenders: renders.slice(-5),
  };
}
