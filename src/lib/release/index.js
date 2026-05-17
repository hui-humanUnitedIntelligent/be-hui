// src/lib/release/index.js
// HUI — Release Safety System — Phase 6D.1 + 6D.2 + 6D.5
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Kein unkontrolliertes Deploy-Verhalten.
// Jedes Feature hat einen dokumentierten Flag.
// Jeder Flag hat einen sicheren Default.
// Jeder Flag kann zur Laufzeit überschrieben werden.
//
// DREI EBENEN:
//   1. COMPILE-TIME defaults   (in dieser Datei)
//   2. localStorage overrides  (Dev/Staging: HUI_FLAG_xxx=true)
//   3. Runtime overrides       (setFlag() für Notfälle)
//
// KILL SWITCHES (6D.5):
//   Können OHNE neues Deployment deaktivieren:
//   - Worker Runtime
//   - Progressive Discovery
//   - Health Layer
//   - Graph Enrichment
//   - Realtime
//   - Expensive Search
//
// REGELN:
//   ✅ Alle Flags haben dokumentierten Default + Reason
//   ✅ Alle Flags sind typed (boolean / string / number)
//   ✅ Alle Flags sind Remote-overrideable (localStorage)
//   ✅ Kein Flag bricht die App — immer Fallback vorhanden
//   ❌ Keine versteckten Experiment-Flags
//   ❌ Keine A/B-Tests ohne Dokumentation
// ═══════════════════════════════════════════════════════════════

// ── Flag Definitionen ──────────────────────────────────────────
//
// Format:
//   key:          Interner Identifier
//   default:      Sicherer Fallback (was passiert wenn unklar)
//   description:  Was macht dieser Flag?
//   rollout:      Wer bekommt ihn? ('all' | 'beta' | 'admin' | 'dev')
//   killSwitch:   Kann er Systeme notfallmäßig abschalten?
//   since:        Eingeführt in Phase

const FLAG_DEFINITIONS = {

  // ── Discovery ──────────────────────────────────────────────
  DISCOVERY_V2: {
    key:         'DISCOVERY_V2',
    default:     true,
    description: '4-Layer Discovery Stack (5C+5D+5E+5G). Fallback: Basis-Relevanz-Ranking.',
    rollout:     'all',
    killSwitch:  true,
    since:       '5H',
  },

  HEALTH_AWARE_RANKING: {
    key:         'HEALTH_AWARE_RANKING',
    default:     true,
    description: 'Community Health Modifier (±15%) im Feed-Ranking. Fallback: ohne Health-Pass.',
    rollout:     'all',
    killSwitch:  true,
    since:       '5H',
  },

  PROGRESSIVE_DISCOVERY: {
    key:         'PROGRESSIVE_DISCOVERY',
    default:     true,
    description: '3-Wellen Progressive Feed Delivery. Fallback: vollständiger Load auf einmal.',
    rollout:     'all',
    killSwitch:  true,
    since:       '6B',
  },

  GRAPH_ENRICHMENT: {
    key:         'GRAPH_ENRICHMENT',
    default:     true,
    description: 'Bridge-Score + Soft-Cluster Graph-Berechnung. Fallback: kein Graph-Bonus.',
    rollout:     'all',
    killSwitch:  true,
    since:       '5D',
  },

  // ── Workers ─────────────────────────────────────────────────
  WORKER_RUNTIME: {
    key:         'WORKER_RUNTIME',
    default:     true,
    description: 'Web Worker Pool für Graph-Berechnungen. Fallback: synchron Main Thread.',
    rollout:     'capable',   // Nur auf CAPABLE+ Devices
    killSwitch:  true,
    since:       '6B',
  },

  WORKER_POOL: {
    key:         'WORKER_POOL',
    default:     true,
    description: 'Priority Queue Worker Pool (max 2). Fallback: einzelner Worker.',
    rollout:     'capable',
    killSwitch:  true,
    since:       '6B',
  },

  // ── Realtime ────────────────────────────────────────────────
  REALTIME_CHANNELS: {
    key:         'REALTIME_CHANNELS',
    default:     true,
    description: 'Supabase Realtime Channel Subscriptions. Fallback: kein Realtime.',
    rollout:     'all',
    killSwitch:  true,
    since:       '6A',
  },

  REALTIME_BACKOFF: {
    key:         'REALTIME_BACKOFF',
    default:     true,
    description: 'Exponential Backoff bei Realtime-Reconnects. Fallback: instant retry.',
    rollout:     'all',
    killSwitch:  false,
    since:       '6A',
  },

  // ── Cache ───────────────────────────────────────────────────
  CACHE_L1: {
    key:         'CACHE_L1',
    default:     true,
    description: 'In-Memory L1 Cache. Fallback: direkte Supabase-Queries.',
    rollout:     'all',
    killSwitch:  true,
    since:       '6A',
  },

  CACHE_SWR: {
    key:         'CACHE_SWR',
    default:     true,
    description: 'Stale-While-Revalidate Refresh-Strategie. Fallback: blocking fetch.',
    rollout:     'all',
    killSwitch:  false,
    since:       '6A',
  },

  // ── Community Health ─────────────────────────────────────────
  COMMUNITY_HEALTH_ENGINE: {
    key:         'COMMUNITY_HEALTH_ENGINE',
    default:     true,
    description: 'Community Health Score Berechnung (5G). Fallback: deaktiviert.',
    rollout:     'all',
    killSwitch:  true,
    since:       '5G',
  },

  SELF_HEALING: {
    key:         'SELF_HEALING',
    default:     true,
    description: 'Network Self-Healing Balancer (5H). Fallback: Standard-Parameter.',
    rollout:     'all',
    killSwitch:  true,
    since:       '5H',
  },

  // ── Search ──────────────────────────────────────────────────
  SMART_SEARCH: {
    key:         'SMART_SEARCH',
    default:     true,
    description: 'Semantische Suche mit Cache + Deduplication. Fallback: einfache ilike-Suche.',
    rollout:     'all',
    killSwitch:  true,
    since:       '6A',
  },

  EXPENSIVE_SEARCH: {
    key:         'EXPENSIVE_SEARCH',
    default:     true,
    description: 'Parallele 3-Query Suche (name+tags+talent). Fallback: nur name-Query.',
    rollout:     'all',
    killSwitch:  true,
    since:       '6A',
  },

  // ── Mobile ──────────────────────────────────────────────────
  ADAPTIVE_PIPELINE: {
    key:         'ADAPTIVE_PIPELINE',
    default:     true,
    description: 'Device-Tier-basierte Pipeline-Tiefe. Fallback: Standard-Pipeline für alle.',
    rollout:     'all',
    killSwitch:  false,
    since:       '6B',
  },

  // ── Observability ────────────────────────────────────────────
  OBSERVABILITY: {
    key:         'OBSERVABILITY',
    default:     true,
    description: 'Metrics-Sammlung im Observability Layer. Fallback: keine Metriken.',
    rollout:     'all',
    killSwitch:  false,
    since:       '6C',
  },

  FPS_TRACKING: {
    key:         'FPS_TRACKING',
    default:     false,  // Standard OFF — nur wenn Dashboard offen
    description: 'RAF-basiertes FPS-Tracking. Nur aktiv wenn Dashboard offen.',
    rollout:     'admin',
    killSwitch:  false,
    since:       '6C',
  },

  // ── Experimental ─────────────────────────────────────────────
  EXPERIMENTAL_GRAPH_V2: {
    key:         'EXPERIMENTAL_GRAPH_V2',
    default:     false,  // Noch nicht released
    description: 'Nächste Graph-Engine Version (in Entwicklung).',
    rollout:     'dev',
    killSwitch:  false,
    since:       '6D',
  },
};

// ── Runtime Override Store ─────────────────────────────────────
const _runtimeOverrides = new Map();  // key → boolean

// ── Flag Resolver ──────────────────────────────────────────────

function _readLocalStorage(key) {
  try {
    const val = localStorage.getItem(`HUI_FLAG_${key}`);
    if (val === 'true')  return true;
    if (val === 'false') return false;
    return null;
  } catch (_) { return null; }
}

/**
 * Liest einen Feature Flag.
 * Priorität: Runtime Override > localStorage > Default
 *
 * @param {string} flagKey   — aus FLAG_DEFINITIONS
 * @returns {boolean}
 */
export function getFlag(flagKey) {
  const def = FLAG_DEFINITIONS[flagKey];
  if (!def) {
    console.warn(`[Release] Unknown flag: ${flagKey}`);
    return false;  // Unbekannte Flags = sicher OFF
  }

  // 1. Runtime Override (höchste Priorität — für Notfälle)
  if (_runtimeOverrides.has(flagKey)) {
    return _runtimeOverrides.get(flagKey);
  }

  // 2. localStorage Override (Dev/Staging)
  const lsVal = _readLocalStorage(flagKey);
  if (lsVal !== null) return lsVal;

  // 3. Default
  return def.default;
}

/**
 * Setzt einen Runtime Override (ohne Reload).
 * Für Notfall-Kill-Switches.
 *
 * @param {string}  flagKey
 * @param {boolean} value
 */
export function setFlag(flagKey, value) {
  const def = FLAG_DEFINITIONS[flagKey];
  if (!def) {
    console.warn(`[Release] Cannot set unknown flag: ${flagKey}`);
    return false;
  }
  _runtimeOverrides.set(flagKey, value);
  console.info(`[Release] Flag ${flagKey} = ${value} (runtime override)`);
  return true;
}

/**
 * Reset eines Runtime Overrides zurück auf Default.
 */
export function resetFlag(flagKey) {
  _runtimeOverrides.delete(flagKey);
  console.info(`[Release] Flag ${flagKey} reset to default`);
}

/**
 * Alle aktiven Kill-Switches mit einem Aufruf deaktivieren.
 * Emergency: wenn Plattform instabil → alle experimentellen Features OFF.
 */
export function emergencyDowngrade() {
  const killSwitches = Object.values(FLAG_DEFINITIONS)
    .filter(f => f.killSwitch && f.default === true);

  // Nur non-core Features deaktivieren (Discovery bleibt aktiv)
  const toDisable = [
    'HEALTH_AWARE_RANKING', 'GRAPH_ENRICHMENT', 'WORKER_RUNTIME',
    'WORKER_POOL', 'COMMUNITY_HEALTH_ENGINE', 'SELF_HEALING',
    'EXPENSIVE_SEARCH', 'PROGRESSIVE_DISCOVERY',
  ];

  toDisable.forEach(k => setFlag(k, false));
  console.warn('[Release] EMERGENCY DOWNGRADE activated — advanced features disabled');
  return toDisable;
}

/**
 * Alle Runtime Overrides zurücksetzen (Recovery nach Downgrade).
 */
export function recoverFromDowngrade() {
  _runtimeOverrides.clear();
  console.info('[Release] All runtime overrides cleared — defaults restored');
}

// ── Release Registry API ────────────────────────────────────────

/**
 * Vollständiger Status aller Flags.
 * Für Dashboard + Debugging.
 */
export function getReleaseStatus() {
  const flags = {};
  for (const [key, def] of Object.entries(FLAG_DEFINITIONS)) {
    const active   = getFlag(key);
    const override = _runtimeOverrides.has(key) ? 'runtime'
      : _readLocalStorage(key) !== null          ? 'localStorage'
      : 'default';

    flags[key] = {
      active,
      default:     def.default,
      override,
      rollout:     def.rollout,
      killSwitch:  def.killSwitch,
      description: def.description,
      since:       def.since,
      changed:     active !== def.default,
    };
  }

  const activeFlags   = Object.values(flags).filter(f => f.active).length;
  const overridden    = Object.values(flags).filter(f => f.override !== 'default').length;
  const killSwitches  = Object.values(flags).filter(f => f.killSwitch).length;
  const disabled      = Object.values(flags).filter(f => f.changed && !f.active).length;

  return {
    flags,
    summary: { total: Object.keys(flags).length, active: activeFlags, overridden, killSwitches, disabled },
    timestamp: new Date().toISOString(),
  };
}

// ── React Hook ─────────────────────────────────────────────────
import { useState, useCallback } from 'react';

export function useFeatureFlags() {
  const [status, setStatus] = useState(() => getReleaseStatus());

  const refresh = useCallback(() => setStatus(getReleaseStatus()), []);

  const toggle = useCallback((key) => {
    const current = getFlag(key);
    setFlag(key, !current);
    setStatus(getReleaseStatus());
  }, []);

  const killAll = useCallback(() => {
    emergencyDowngrade();
    setStatus(getReleaseStatus());
  }, []);

  const recover = useCallback(() => {
    recoverFromDowngrade();
    setStatus(getReleaseStatus());
  }, []);

  return { status, refresh, toggle, killAll, recover };
}

// Convenience re-exports
export { FLAG_DEFINITIONS };
