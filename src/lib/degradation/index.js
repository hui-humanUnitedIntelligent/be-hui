// src/lib/degradation/index.js
// HUI — Graceful Degradation System — Phase 6D.3
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Kein System fällt hart aus. Immer ein Fallback.
// Die Plattform bleibt nutzbar — nie komplett kaputt.
//
// DEGRADATION-STUFEN:
//   FULL      → alles aktiv (Normalzustand)
//   REDUCED   → fortgeschrittene Features deaktiviert
//   MINIMAL   → nur Kern-Funktionen
//   EMERGENCY → absolutes Minimum
//
// FALLBACK-KETTE pro System:
//   Discovery:      V2 Pipeline → Basis-Ranking → statischer Feed
//   Workers:        Pool → Single Worker → synchron Main Thread
//   Realtime:       Channels → Polling → keine Updates
//   Graph:          Full → Lightweight → keine Graph-Berechnung
//   Health:         Full → Basic Passes → deaktiviert
//   Cache:          L1+L2 → L1 only → kein Cache
//   Search:         Smart+Cache → ilike only → deaktiviert
//
// ALLE DEGRADIERUNGEN:
//   ✅ sanft    — kein harter Switch
//   ✅ temporär — automatische Recovery möglich
//   ✅ reversibel — jederzeit zurückschaltbar
//   ✅ dokumentiert — im Dashboard sichtbar
// ═══════════════════════════════════════════════════════════════

import { setFlag, getFlag, recoverFromDowngrade } from '@/lib/release/index';
import { metrics } from '@/lib/observability/index';

// ── Degradation Stufen ─────────────────────────────────────────
export const DEGRADATION_LEVEL = {
  FULL:      'FULL',       // Normalzustand — alles aktiv
  REDUCED:   'REDUCED',    // Fortgeschrittene Features deaktiviert
  MINIMAL:   'MINIMAL',    // Nur Kern-Funktionen
  EMERGENCY: 'EMERGENCY',  // Absolutes Minimum
};

// Aktueller globaler Zustand
let _currentLevel  = DEGRADATION_LEVEL.FULL;
let _degradedAt    = null;
let _reason        = null;
const _events      = [];  // Ring: letzte 20 Degradierungs-Events

function _logEvent(type, level, reason) {
  _events.push({ type, level, reason, ts: new Date().toISOString() });
  if (_events.length > 20) _events.shift();
  metrics.asyncFail?.(`degradation.${type}`, reason);
  console.info(`[Degradation] ${type} → ${level}: ${reason}`);
}

// ── Fallback-Konfigurationen ───────────────────────────────────

const FALLBACK_CONFIGS = {

  // Discovery: 4-Layer → Basis → Statisch
  discovery: {
    FULL: {
      useV2Pipeline:       true,
      useGraphEnrichment:  true,
      useHealthLayer:      true,
      useProgressive:      true,
      maxCandidates:       40,
    },
    REDUCED: {
      useV2Pipeline:       true,
      useGraphEnrichment:  false,  // Graph überspringen
      useHealthLayer:      false,  // Health-Pass überspringen
      useProgressive:      true,
      maxCandidates:       20,
    },
    MINIMAL: {
      useV2Pipeline:       false,  // Zurück auf loadFeed
      useGraphEnrichment:  false,
      useHealthLayer:      false,
      useProgressive:      false,
      maxCandidates:       12,
    },
    EMERGENCY: {
      useV2Pipeline:       false,
      useGraphEnrichment:  false,
      useHealthLayer:      false,
      useProgressive:      false,
      maxCandidates:       8,
    },
  },

  // Worker: Pool → Single → Synchron
  worker: {
    FULL:      { poolEnabled: true,  singleEnabled: true,  syncFallback: false },
    REDUCED:   { poolEnabled: false, singleEnabled: true,  syncFallback: false },
    MINIMAL:   { poolEnabled: false, singleEnabled: false, syncFallback: true  },
    EMERGENCY: { poolEnabled: false, singleEnabled: false, syncFallback: true  },
  },

  // Realtime: Channels → Polling → Nichts
  realtime: {
    FULL:      { channels: true,  pollIntervalMs: null,     pollOnly: false },
    REDUCED:   { channels: true,  pollIntervalMs: null,     pollOnly: false },
    MINIMAL:   { channels: false, pollIntervalMs: 30_000,   pollOnly: true  },
    EMERGENCY: { channels: false, pollIntervalMs: null,     pollOnly: false },
  },

  // Cache: L1+L2 → L1 → Keiner
  cache: {
    FULL:      { l1: true,  l2: true,  swr: true,  ttlMultiplier: 1.0 },
    REDUCED:   { l1: true,  l2: false, swr: true,  ttlMultiplier: 0.5 },
    MINIMAL:   { l1: true,  l2: false, swr: false, ttlMultiplier: 0.2 },
    EMERGENCY: { l1: false, l2: false, swr: false, ttlMultiplier: 0   },
  },

  // Search: Smart → ilike → Deaktiviert
  search: {
    FULL:      { smart: true,  cache: true,  parallel: true  },
    REDUCED:   { smart: true,  cache: true,  parallel: false },
    MINIMAL:   { smart: false, cache: false, parallel: false },
    EMERGENCY: { smart: false, cache: false, parallel: false },
  },
};

// ── Öffentliche API ─────────────────────────────────────────────

/**
 * Aktuelle Fallback-Konfiguration für ein System.
 * Pure — kein State-Schreiben.
 */
export function getFallbackConfig(system) {
  const level  = _currentLevel;
  const config = FALLBACK_CONFIGS[system];
  if (!config) return {};
  return config[level] || config[DEGRADATION_LEVEL.FULL];
}

/**
 * Zu einer Degradation-Stufe wechseln.
 * Sanft: setzt Feature Flags, kein harter Reload.
 *
 * @param {string} level   — DEGRADATION_LEVEL.*
 * @param {string} reason  — Warum? (für Dashboard)
 */
export function degradeTo(level, reason = 'manual') {
  if (!DEGRADATION_LEVEL[level]) return;
  if (_currentLevel === level) return;  // Kein no-op Log

  _currentLevel = level;
  _degradedAt   = Date.now();
  _reason       = reason;
  _logEvent('degrade', level, reason);

  // Feature Flags anpassen
  const discoConf = FALLBACK_CONFIGS.discovery[level] || {};
  if (!discoConf.useGraphEnrichment) setFlag('GRAPH_ENRICHMENT',   false);
  if (!discoConf.useHealthLayer)     setFlag('HEALTH_AWARE_RANKING',false);
  if (!discoConf.useProgressive)     setFlag('PROGRESSIVE_DISCOVERY',false);

  const workerConf = FALLBACK_CONFIGS.worker[level] || {};
  if (!workerConf.poolEnabled)    setFlag('WORKER_POOL',    false);
  if (!workerConf.singleEnabled)  setFlag('WORKER_RUNTIME', false);

  const rtConf = FALLBACK_CONFIGS.realtime[level] || {};
  if (!rtConf.channels)           setFlag('REALTIME_CHANNELS', false);
}

/**
 * Recovery: zurück zu FULL.
 * Alle Feature Flags zurücksetzen.
 */
export function recoverToFull(reason = 'auto-recovery') {
  if (_currentLevel === DEGRADATION_LEVEL.FULL) return;

  _logEvent('recover', DEGRADATION_LEVEL.FULL, reason);
  _currentLevel = DEGRADATION_LEVEL.FULL;
  _degradedAt   = null;
  _reason       = null;
  recoverFromDowngrade();  // Alle Runtime Overrides löschen
}

/**
 * Aktueller Degradation-Status.
 */
export function getDegradationStatus() {
  return {
    level:       _currentLevel,
    isNormal:    _currentLevel === DEGRADATION_LEVEL.FULL,
    degradedAt:  _degradedAt,
    reason:      _reason,
    durationMs:  _degradedAt ? Date.now() - _degradedAt : 0,
    recentEvents:_events.slice(-5),
    configs: {
      discovery: getFallbackConfig('discovery'),
      worker:    getFallbackConfig('worker'),
      realtime:  getFallbackConfig('realtime'),
      cache:     getFallbackConfig('cache'),
      search:    getFallbackConfig('search'),
    },
  };
}

export { FALLBACK_CONFIGS };
