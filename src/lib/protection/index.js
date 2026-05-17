// src/lib/protection/index.js
// HUI — Health-Based Auto Protection — Phase 6D.4
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Die Plattform schützt sich selbst — sanft, temporär, reversibel.
// Kein aggressives Auto-System. Kein Blackbox-Verhalten.
//
// AUSLÖSER:
//   low_fps          → FPS < 30 für > 10s
//   reconnect_storm  → > 5 Reconnects in 5min
//   worker_overload  → > 3 Worker-Timeouts in 5min
//   memory_pressure  → JS Heap > 85%
//   cache_thrashing  → > 50% Cache-Evictions in 1min
//
// REAKTION:
//   Immer: sanfte Degradation eine Stufe nach unten
//   Nie:   sofortiger Emergency-Shutdown ohne Warnung
//   Immer: automatische Recovery nach Normalisierung
//
// RECOVERY:
//   Alle 60s prüfen ob Auslöser verschwunden.
//   Nach 3 sauberen Checks → Recovery zu FULL.
// ═══════════════════════════════════════════════════════════════

import { getObservabilityReport, realtimeHealthScore, errorSummary } from '@/lib/observability/index';
import { degradeTo, recoverToFull, getDegradationStatus, DEGRADATION_LEVEL } from '@/lib/degradation/index';
import { metrics } from '@/lib/observability/index';

// ── Schwellenwerte ─────────────────────────────────────────────
const THRESHOLDS = {
  fps_critical:          25,    // FPS unter 25 → MINIMAL
  fps_low:               40,    // FPS unter 40 → REDUCED
  reconnects_storm:       5,    // > 5 Reconnects / 5min → REDUCED
  worker_timeouts:        3,    // > 3 Timeouts / 5min → REDUCED
  memory_critical:       85,    // > 85% Heap → MINIMAL
  memory_high:           75,    // > 75% Heap → REDUCED
  recovery_checks:        3,    // 3 saubere Checks → recovery
  check_interval_ms:  30_000,   // 30s Check-Intervall
};

// Interne State
let _checkTimer      = null;
let _cleanChecks     = 0;       // Zähler sauberer Checks für Recovery
let _protectionActive= false;
let _activeReasons   = new Set();
const _protectionLog = [];      // Ring: letzte 20 Events

function _log(type, reason, level) {
  _protectionLog.push({ type, reason, level, ts: new Date().toISOString() });
  if (_protectionLog.length > 20) _protectionLog.shift();
}

// ── Zustandsprüfung ─────────────────────────────────────────────
function _assessHealth() {
  const report = getObservabilityReport();
  const issues = [];

  // FPS
  const fps = report.fps?.current;
  if (fps !== null && fps < THRESHOLDS.fps_critical) {
    issues.push({ trigger: 'low_fps_critical', severity: 'MINIMAL', fps });
  } else if (fps !== null && fps < THRESHOLDS.fps_low) {
    issues.push({ trigger: 'low_fps', severity: 'REDUCED', fps });
  }

  // Realtime Reconnects
  const rt = realtimeHealthScore();
  if (rt.reconnects > THRESHOLDS.reconnects_storm) {
    issues.push({ trigger: 'reconnect_storm', severity: 'REDUCED', reconnects: rt.reconnects });
  }

  // Worker Timeouts
  const errs = errorSummary();
  if (errs.workerTimeouts > THRESHOLDS.worker_timeouts) {
    issues.push({ trigger: 'worker_overload', severity: 'REDUCED', timeouts: errs.workerTimeouts });
  }
  if (errs.workerCrashes > 0) {
    issues.push({ trigger: 'worker_crash', severity: 'REDUCED', crashes: errs.workerCrashes });
  }

  // Memory
  if (report.mobile?.memory) {
    const heapPct = parseFloat(report.mobile.memory?.usage) || 0;
    if (heapPct > THRESHOLDS.memory_critical) {
      issues.push({ trigger: 'memory_critical', severity: 'MINIMAL', heapPct });
    } else if (heapPct > THRESHOLDS.memory_high) {
      issues.push({ trigger: 'memory_pressure', severity: 'REDUCED', heapPct });
    }
  }

  return issues;
}

// ── Protection Loop ─────────────────────────────────────────────
function _runCheck() {
  const issues    = _assessHealth();
  const current   = getDegradationStatus().level;

  if (issues.length > 0) {
    _cleanChecks = 0;  // Reset Recovery Counter

    // Schlimmste Severity bestimmen
    const targetLevel = issues.some(i => i.severity === 'MINIMAL')
      ? DEGRADATION_LEVEL.MINIMAL
      : DEGRADATION_LEVEL.REDUCED;

    const reasons = issues.map(i => i.trigger).join(', ');
    _activeReasons = new Set(issues.map(i => i.trigger));

    if (current === DEGRADATION_LEVEL.FULL || current !== targetLevel) {
      _protectionActive = true;
      _log('protect', reasons, targetLevel);
      console.warn(`[Protection] Auto-degrading to ${targetLevel}: ${reasons}`);
      degradeTo(targetLevel, `auto:${reasons}`);
    }
  } else {
    // Keine Issues → Recovery-Counter hochzählen
    if (_protectionActive) {
      _cleanChecks++;
      if (_cleanChecks >= THRESHOLDS.recovery_checks) {
        _cleanChecks     = 0;
        _protectionActive= false;
        _activeReasons   = new Set();
        _log('recover', 'auto-recovery after stable period', DEGRADATION_LEVEL.FULL);
        console.info('[Protection] Auto-recovering to FULL');
        recoverToFull('auto-protection-recovery');
      }
    }
  }
}

// ── Öffentliche API ─────────────────────────────────────────────

/**
 * Startet den Protection-Loop.
 * Läuft alle 30s im Hintergrund.
 */
export function startProtection() {
  if (_checkTimer) return;
  _checkTimer = setInterval(_runCheck, THRESHOLDS.check_interval_ms);
  console.info('[Protection] Health-based auto protection started');
}

/**
 * Stoppt den Protection-Loop.
 */
export function stopProtection() {
  if (_checkTimer) {
    clearInterval(_checkTimer);
    _checkTimer = null;
  }
}

/**
 * Manueller Check (für Dashboard).
 */
export function runProtectionCheck() {
  _runCheck();
  return getProtectionStatus();
}

/**
 * Status für Dashboard.
 */
export function getProtectionStatus() {
  return {
    active:          _protectionActive,
    activeReasons:   [..._activeReasons],
    cleanChecks:     _cleanChecks,
    recoveryNeeded:  _protectionActive && _cleanChecks > 0,
    recentEvents:    _protectionLog.slice(-5),
    checkIntervalMs: THRESHOLDS.check_interval_ms,
    thresholds:      THRESHOLDS,
  };
}

// React Hook
import { useState, useEffect, useCallback } from 'react';

export function useRuntimeProtection({ autoStart = true } = {}) {
  const [status, setStatus] = useState(getProtectionStatus);

  useEffect(() => {
    if (autoStart) startProtection();
    const iv = setInterval(() => setStatus(getProtectionStatus()), 15_000);
    return () => {
      clearInterval(iv);
      if (autoStart) stopProtection();
    };
  }, [autoStart]);

  const forceCheck = useCallback(() => {
    setStatus(runProtectionCheck());
  }, []);

  return { status, forceCheck };
}
