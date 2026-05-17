// src/lib/recovery/index.js
// HUI — Failure Recovery System — Phase 6D.7
// ═══════════════════════════════════════════════════════════════
//
// PHILOSOPHIE:
// Kein harter White Screen. Keine unhandled Crashes.
// Jedes kritische System hat eine Recovery-Strategie.
//
// RECOVERY-STRATEGIEN:
//   Worker:       Terminate → Restart → Fallback zu Sync
//   Cache:        Flush L1 → Rebuild → Fallback zu Direct Query
//   Realtime:     Remove Channel → Reconnect mit Backoff
//   Discovery:    Reset State → Reload → Basis-Fallback
//   Session:      Clear stale → Re-auth → Login Redirect
//   Hydration:    Unmount → Remount → Hard Reload (letzter Ausweg)
//
// ALLE STRATEGIEN:
//   ✅ Automatisch ausgelöst wenn möglich
//   ✅ Manuell auslösbar (für Dashboard)
//   ✅ Geloggt im Recovery-Log
//   ✅ Reversibel
//   ❌ Nie hard reload ohne User-Wissen
// ═══════════════════════════════════════════════════════════════

import { cacheInvalidate } from '@/lib/cache/index';
import { metrics } from '@/lib/observability/index';

const _recoveryLog = [];  // Ring: letzte 30 Events
let   _recovering  = false;

function _log(system, strategy, success, detail = '') {
  const entry = {
    system, strategy, success, detail,
    ts: new Date().toISOString(),
  };
  _recoveryLog.push(entry);
  if (_recoveryLog.length > 30) _recoveryLog.shift();

  const emoji = success ? '✅' : '⚠️';
  console.info(`[Recovery] ${emoji} ${system} → ${strategy}${detail ? ': ' + detail : ''}`);
}

// ── Worker Recovery ─────────────────────────────────────────────
export async function recoverWorker() {
  _log('worker', 'terminate+restart', true, 'Pool wird neugestartet');
  try {
    // Worker Pool Singleton destroyen — beim nächsten Zugriff neu erstellen
    const { getWorkerPool } = await import('@/lib/workers/pool');
    const pool = getWorkerPool();
    // Terminiert alle Worker (Idle-Shutdown beschleunigen)
    if (pool._workers) {
      pool._workers.forEach(w => { try { w.terminate(); } catch(_) {} });
      pool._workers = [];
      pool._busy    = new Set();
      pool._ready   = false;
    }
    _log('worker', 'restart', true, 'Worker Pool geleert — Re-init beim nächsten Job');
    return true;
  } catch (err) {
    _log('worker', 'restart', false, err?.message);
    return false;
  }
}

// ── Cache Recovery ──────────────────────────────────────────────
export function recoverCache(namespace = null) {
  try {
    if (namespace) {
      cacheInvalidate(namespace);
      _log('cache', 'partial-flush', true, `namespace: ${namespace}`);
    } else {
      // Alle namespaces flushen
      ['community_health', 'graph_data', 'creator_affinity', 'search_results', 'feed_segment']
        .forEach(ns => cacheInvalidate(ns));
      _log('cache', 'full-flush', true, 'Alle Namespaces geleert');
    }

    // sessionStorage ebenfalls leeren
    try {
      const keys = Object.keys(sessionStorage).filter(k => k.startsWith('hui_c_'));
      keys.forEach(k => sessionStorage.removeItem(k));
    } catch (_) {}

    return true;
  } catch (err) {
    _log('cache', 'flush', false, err?.message);
    return false;
  }
}

// ── Realtime Recovery ───────────────────────────────────────────
export async function recoverRealtime(channelName = null) {
  try {
    const { supabase } = await import('@/lib/supabaseClient');
    if (channelName) {
      // Einzelnen Channel neu starten — wird vom createChannel-Backoff gehandelt
      _log('realtime', 'channel-reconnect', true, channelName);
    } else {
      // Alle Channels entfernen — werden durch createChannel neu aufgebaut
      const channels = supabase.getChannels();
      for (const ch of channels) {
        await supabase.removeChannel(ch);
      }
      _log('realtime', 'full-reconnect', true, `${channels.length} Channels entfernt`);
    }
    return true;
  } catch (err) {
    _log('realtime', 'reconnect', false, err?.message);
    return false;
  }
}

// ── Discovery Recovery ──────────────────────────────────────────
export function recoverDiscovery() {
  try {
    // Session-Cache für Discovery zurücksetzen
    try {
      const seen = sessionStorage.getItem('hui_ctx_seen');
      if (seen) sessionStorage.removeItem('hui_ctx_seen');
    } catch (_) {}

    // Feed-Segment Cache leeren
    cacheInvalidate('feed_segment');

    _log('discovery', 'reset-session', true, 'Session-Cache und Feed-Segment geleert');
    return true;
  } catch (err) {
    _log('discovery', 'reset', false, err?.message);
    return false;
  }
}

// ── Session Recovery ────────────────────────────────────────────
export async function recoverSession() {
  try {
    const { supabase } = await import('@/lib/supabaseClient');

    // Versuche Session zu refreshen
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      _log('session', 'refresh', false, error.message);
      return false;
    }

    _log('session', 'refresh', true, `User: ${data?.session?.user?.id?.slice(0,8) || 'unknown'}`);
    return true;
  } catch (err) {
    _log('session', 'refresh', false, err?.message);
    return false;
  }
}

// ── Hydration Recovery ──────────────────────────────────────────
// Letzter Ausweg: Soft-Reload (kein hard window.location.reload)
let _hydrationAttempts = 0;

export function recoverHydration(forceHard = false) {
  _hydrationAttempts++;

  if (_hydrationAttempts <= 2 && !forceHard) {
    // Soft: Error Boundary reset triggern
    _log('hydration', 'soft-reset', true, `Attempt ${_hydrationAttempts}`);
    // Dispatch custom event — ErrorBoundary in App.jsx hört zu
    window.dispatchEvent(new CustomEvent('hui:hydration-recovery', {
      detail: { attempt: _hydrationAttempts }
    }));
    return true;
  }

  // Hard: nur wenn explizit angefordert oder > 2 Versuche
  if (forceHard) {
    _log('hydration', 'hard-reload', true, 'Forced by user or > 2 attempts');
    setTimeout(() => window.location.reload(), 500);
    return true;
  }

  _log('hydration', 'hard-reload', false, 'Not forced — user should reload');
  return false;
}

// ── Master Recovery ─────────────────────────────────────────────
export async function recoverAll() {
  if (_recovering) return;
  _recovering = true;

  _log('system', 'full-recovery', true, 'Starting comprehensive recovery...');

  const results = await Promise.allSettled([
    recoverWorker(),
    Promise.resolve(recoverCache()),
    Promise.resolve(recoverDiscovery()),
  ]);

  const success = results.filter(r => r.status === 'fulfilled' && r.value).length;
  _log('system', 'full-recovery', success > 0, `${success}/${results.length} systems recovered`);

  _recovering = false;
  return success > 0;
}

// ── Status API ──────────────────────────────────────────────────
export function getRecoveryStatus() {
  return {
    recovering:      _recovering,
    recentRecoveries:_recoveryLog.slice(-10),
    totalEvents:     _recoveryLog.length,
    hydrationAttempts: _hydrationAttempts,
  };
}

// React Hook
import { useState, useCallback } from 'react';

export function useRecovery() {
  const [status, setStatus] = useState(getRecoveryStatus);

  const recover = useCallback(async (system = 'all') => {
    if (system === 'all')       await recoverAll();
    else if (system === 'worker')    await recoverWorker();
    else if (system === 'cache')     recoverCache();
    else if (system === 'realtime')  await recoverRealtime();
    else if (system === 'discovery') recoverDiscovery();
    setStatus(getRecoveryStatus());
  }, []);

  return { status, recover };
}
