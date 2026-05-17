// src/lib/pipeline/profiler.js
// HUI — Pipeline Profiler — Phase 6B.4
// ═══════════════════════════════════════════════════════════════
//
// ZWECK:
// Misst Stage-Dauer und Cache-Hits für jede Pipeline-Run.
// Identifiziert Bottlenecks ohne Produktions-Impact.
//
// DESIGN:
// Kein Performance-Overhead wenn disabled.
// In Prod: nur aktiviert wenn HUI_DEBUG=true.
// ═══════════════════════════════════════════════════════════════

const IS_DEBUG = typeof window !== 'undefined' &&
  (localStorage.getItem('HUI_DEBUG') === 'true' ||
   import.meta.env?.DEV);

const _runs = [];  // max 20 Runs gespeichert

export class PipelineProfiler {
  constructor(runId = `run_${Date.now()}`) {
    this.runId    = runId;
    this.stages   = {};
    this.start    = performance.now();
    this.enabled  = IS_DEBUG;
  }

  // Stage-Start markieren
  beginStage(name) {
    if (!this.enabled) return;
    this.stages[name] = { start: performance.now(), end: null, cacheHit: false };
  }

  // Stage-Ende markieren
  endStage(name, meta = {}) {
    if (!this.enabled) return;
    if (!this.stages[name]) return;
    this.stages[name].end       = performance.now();
    this.stages[name].durationMs = Math.round(
      this.stages[name].end - this.stages[name].start
    );
    this.stages[name].cacheHit  = meta.cacheHit || false;
    this.stages[name].itemCount = meta.itemCount || null;
  }

  // Finalisieren und speichern
  finish(summary = {}) {
    const totalMs = Math.round(performance.now() - this.start);
    const report  = {
      runId:   this.runId,
      totalMs,
      stages:  this.stages,
      summary,
      time:    new Date().toISOString(),
    };

    if (this.enabled) {
      // Max 20 Runs im Speicher
      _runs.push(report);
      if (_runs.length > 20) _runs.shift();

      // Dev-Output
      const bottleneck = Object.entries(this.stages)
        .filter(([,s]) => s.durationMs)
        .sort(([,a], [,b]) => b.durationMs - a.durationMs)[0];

      console.groupCollapsed(`[Pipeline] ${this.runId} — ${totalMs}ms`);
      for (const [name, stage] of Object.entries(this.stages)) {
        if (stage.durationMs != null) {
          const hit = stage.cacheHit ? '⚡cache' : '';
          console.log(`  ${name}: ${stage.durationMs}ms ${hit}`);
        }
      }
      if (bottleneck) console.log(`  ⚠ Bottleneck: ${bottleneck[0]}`);
      console.groupEnd();
    }

    return report;
  }
}

// ── Memoization Helper ─────────────────────────────────────────
/**
 * Einfaches Stage-Memoization.
 * Gleiches Input-Set → gecachtes Ergebnis überspringt Stage.
 *
 * Kein persistentes Caching — nur per Pipeline-Instanz.
 */
export function createStageMemo() {
  const _memo = new Map();

  return {
    has(key) { return _memo.has(key); },
    get(key) { return _memo.get(key); },
    set(key, value) {
      _memo.set(key, value);
      // Kein unbegrenztes Wachstum — max 10 gememoizte Stages
      if (_memo.size > 10) {
        const firstKey = _memo.keys().next().value;
        _memo.delete(firstKey);
      }
    },
    clear() { _memo.clear(); },
  };
}

// ── Stats ──────────────────────────────────────────────────────
export function getPipelineStats() {
  if (!_runs.length) return null;
  const recent   = _runs.slice(-5);
  const avgTotal = Math.round(recent.reduce((a, r) => a + r.totalMs, 0) / recent.length);

  // Durchschnittliche Stage-Dauer über alle Runs
  const stageTotals  = {};
  const stageCounts  = {};
  for (const run of recent) {
    for (const [name, stage] of Object.entries(run.stages || {})) {
      if (stage.durationMs != null) {
        stageTotals[name] = (stageTotals[name] || 0) + stage.durationMs;
        stageCounts[name] = (stageCounts[name] || 0) + 1;
      }
    }
  }

  const stageAvgs = {};
  for (const name of Object.keys(stageTotals)) {
    stageAvgs[name] = Math.round(stageTotals[name] / stageCounts[name]);
  }

  return {
    runsRecorded: _runs.length,
    avgTotalMs:   avgTotal,
    stageAvgs,
    lastRun:      _runs[_runs.length - 1],
  };
}
