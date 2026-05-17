// src/lib/release/preflight.js
// HUI — Deployment Preflight Validation — Phase 6D.6
// ═══════════════════════════════════════════════════════════════
//
// ZWECK:
// Prüft die Plattform vor einem Production Release.
// Erkennt: doppelte Channels, Budget-Verletzungen,
// fehlende Fallbacks, ungültige Flags.
//
// USAGE:
//   import { runPreflight } from '@/lib/release/preflight';
//   const result = await runPreflight();
//   if (!result.pass) console.error(result.failures);
// ═══════════════════════════════════════════════════════════════

import { getRealtimeStats } from '@/lib/realtime/index';
import { getCacheStats } from '@/lib/cache/index';
import { getReleaseStatus, getFlag } from '@/lib/release/index';
import { validateBudgets } from '@/lib/budgets/index';
import { getDegradationStatus } from '@/lib/degradation/index';
import { getObservabilityReport } from '@/lib/observability/index';
import {
  QUERY_BUDGETS, CACHE_BUDGETS, REALTIME_BUDGETS, RENDER_BUDGETS
} from '@/lib/budgets/index';

// ── Check-Definitionen ─────────────────────────────────────────

async function checkRealtimeChannels() {
  const rt = getRealtimeStats();
  const issues = [];

  if (rt.activeChannels > REALTIME_BUDGETS.max_global_channels) {
    issues.push(`${rt.activeChannels} Channels > Budget (${REALTIME_BUDGETS.max_global_channels})`);
  }

  // Auf doppelte Channel-Namen prüfen
  const names = rt.channels.map(c => c.name);
  const dupes = names.filter((n, i) => names.indexOf(n) !== i);
  if (dupes.length > 0) {
    issues.push(`Duplicate channels: ${dupes.join(', ')}`);
  }

  return {
    check:  'realtime_channels',
    pass:   issues.length === 0,
    issues,
    data:   { activeChannels: rt.activeChannels, channels: names },
  };
}

async function checkCacheBudget() {
  const cache = getCacheStats();
  const issues = [];

  const maxBytes = CACHE_BUDGETS.max_memory_mb * 1024 * 1024;
  if (cache.l1.bytes > maxBytes) {
    issues.push(`Cache ${Math.round(cache.l1.bytes/1024)}KB > ${CACHE_BUDGETS.max_memory_mb}MB limit`);
  }
  if (cache.l1.entries > CACHE_BUDGETS.max_entries) {
    issues.push(`Cache ${cache.l1.entries} entries > ${CACHE_BUDGETS.max_entries} limit`);
  }

  return {
    check:  'cache_budget',
    pass:   issues.length === 0,
    issues,
    data:   { bytes: cache.l1.bytes, entries: cache.l1.entries },
  };
}

async function checkFeatureFlags() {
  const status = getReleaseStatus();
  const issues = [];

  // Flags die im Widerspruch stehen
  if (getFlag('PROGRESSIVE_DISCOVERY') && !getFlag('DISCOVERY_V2')) {
    issues.push('PROGRESSIVE_DISCOVERY aktiv aber DISCOVERY_V2 deaktiviert — inkonsistent');
  }
  if (getFlag('WORKER_POOL') && !getFlag('WORKER_RUNTIME')) {
    issues.push('WORKER_POOL aktiv aber WORKER_RUNTIME deaktiviert — Pool hat keine Worker');
  }
  if (getFlag('HEALTH_AWARE_RANKING') && !getFlag('COMMUNITY_HEALTH_ENGINE')) {
    issues.push('HEALTH_AWARE_RANKING aktiv aber COMMUNITY_HEALTH_ENGINE deaktiviert — keine Health-Daten');
  }

  // Experimental Flags in Prod?
  const expFlags = Object.values(status.flags)
    .filter(f => f.rollout === 'dev' && f.active);
  if (expFlags.length > 0) {
    issues.push(`Experimental Flags aktiv: ${expFlags.map(f => f.key || 'unknown').join(', ')}`);
  }

  return {
    check:  'feature_flags',
    pass:   issues.length === 0,
    issues,
    data:   { total: status.summary.total, overridden: status.summary.overridden },
  };
}

async function checkDegradationState() {
  const deg = getDegradationStatus();
  const issues = [];

  if (!deg.isNormal) {
    issues.push(`System in Degradation: ${deg.level} — Reason: ${deg.reason}`);
  }

  return {
    check:  'degradation_state',
    pass:   issues.length === 0,
    issues,
    data:   { level: deg.level, reason: deg.reason },
  };
}

async function checkRuntime() {
  const report = getObservabilityReport();
  const issues = [];

  // Feed Latenz zu hoch?
  if (report.runtime.feedLatencyP95 &&
      report.runtime.feedLatencyP95 > RENDER_BUDGETS.feed_full_ms) {
    issues.push(`Feed P95 Latenz ${report.runtime.feedLatencyP95}ms > ${RENDER_BUDGETS.feed_full_ms}ms Budget`);
  }

  // Aktive Fehler?
  if (report.errors.level === 'critical') {
    issues.push(`Error Level: CRITICAL — Worker Crashes: ${report.errors.workerCrashes}`);
  }
  if (report.errors.level === 'elevated') {
    issues.push(`Error Level: ELEVATED — ${report.errors.asyncFails} async failures`);
  }

  return {
    check:  'runtime_health',
    pass:   issues.length === 0,
    issues,
    data:   { errorLevel: report.errors.level, feedP95: report.runtime.feedLatencyP95 },
  };
}

async function checkFallbacks() {
  const issues = [];

  // Kritische Fallbacks prüfen
  const required = [
    { flag: 'DISCOVERY_V2',      fallback: 'Basis-Ranking über loadFeed' },
    { flag: 'WORKER_RUNTIME',    fallback: 'synchroner Main Thread' },
    { flag: 'REALTIME_CHANNELS', fallback: 'kein Realtime (statisch)' },
    { flag: 'CACHE_L1',          fallback: 'direkte Supabase-Queries' },
  ];

  // Alle Fallbacks existieren (dokumentiert in release/index.js)
  // Prüfung: sind alle Flags registriert?
  for (const { flag } of required) {
    const val = getFlag(flag);
    if (val === undefined) {
      issues.push(`Flag ${flag} nicht registriert — kein dokumentierter Fallback`);
    }
  }

  return {
    check:  'fallback_coverage',
    pass:   issues.length === 0,
    issues,
    data:   { checked: required.length },
  };
}

// ── Master Preflight ────────────────────────────────────────────

export async function runPreflight() {
  const t0 = performance.now();
  console.group('[Preflight] Starting deployment validation...');

  const checks = await Promise.all([
    checkRealtimeChannels(),
    checkCacheBudget(),
    checkFeatureFlags(),
    checkDegradationState(),
    checkRuntime(),
    checkFallbacks(),
  ]);

  const failures = checks.filter(c => !c.pass);
  const warnings = checks.filter(c => c.pass && c.issues.length > 0);
  const pass     = failures.length === 0;
  const ms       = Math.round(performance.now() - t0);

  if (pass) {
    console.info(`[Preflight] ✅ All checks passed (${ms}ms)`);
  } else {
    console.error(`[Preflight] ❌ ${failures.length} check(s) failed:`);
    failures.forEach(f => console.error(`  - ${f.check}: ${f.issues.join(', ')}`));
  }

  console.groupEnd();

  return {
    pass,
    failures,
    warnings,
    checks,
    summary: {
      total:    checks.length,
      passed:   checks.filter(c => c.pass).length,
      failed:   failures.length,
      durationMs: ms,
    },
    timestamp: new Date().toISOString(),
  };
}
