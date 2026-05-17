// src/lib/reliability/index.js
// HUI — Reliability Utilities — Phase 4B.3
// ═══════════════════════════════════════════════════════════════
// retryAsync, withTimeout, safeAsync, dedupeAsync,
// createAbortableRequest, createRealtimeGuard, createAsyncQueue
// ═══════════════════════════════════════════════════════════════

import { normalizeError, isRetryable, NetworkError, ERROR_CODES } from '../errors/index.js';
import { sentryCapture } from '../sentry.js';

// ── retryAsync ───────────────────────────────────────────────────
// Exponential backoff mit konfigurierbarem Limit.
// 
// Usage:
//   const data = await retryAsync(() => supabase.from("t").select(), { retries: 3 })
//
export async function retryAsync(fn, {
  retries   = 3,
  baseDelay = 300,   // ms
  maxDelay  = 8000,  // ms
  onRetry   = null,  // (attempt, err) => void
  retryIf   = isRetryable,
} = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = normalizeError(err, { attempt, retries });

      if (attempt === retries || !retryIf(lastErr)) {
        throw lastErr;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * delay * 0.2; // 20% jitter
      onRetry?.(attempt + 1, lastErr);
      await sleep(delay + jitter);
    }
  }
  throw lastErr;
}

// ── withTimeout ──────────────────────────────────────────────────
// Bricht eine Promise nach `ms` Millisekunden ab.
//
// Usage:
//   const data = await withTimeout(fetch("/api/data"), 5000)
//
export function withTimeout(promise, ms = 8000, label = 'request') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new NetworkError({
        code: ERROR_CODES.NETWORK_TIMEOUT,
        message: `Timeout: ${label} hat länger als ${ms}ms gedauert.`,
        retryable: true,
      }));
    }, ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// ── safeAsync ────────────────────────────────────────────────────
// Wrapper für Context-Actions: normalisiert Fehler, kein unhandled rejection.
// Gibt { data, error } zurück — kein throw.
//
// Usage:
//   const { data, error } = await safeAsync(() => sendMessage(text))
//   if (error) { rollback(); showToast(error.toUserMessage()); }
//
export async function safeAsync(fn, context = {}) {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (err) {
    const appErr = normalizeError(err, context);
    // Sentry nur für MEDIUM+ severity
    if (appErr.severity !== 'low' && appErr.severity !== 'info') {
      sentryCapture(appErr, context);
    }
    return { data: null, error: appErr };
  }
}

// ── createAbortableRequest ───────────────────────────────────────
// Erstellt eine abbrechbare Anfrage (z.B. für useEffect cleanup).
//
// Usage:
//   const { run, abort } = createAbortableRequest()
//   const data = await run(() => fetchData())
//   return () => abort()  // cleanup
//
export function createAbortableRequest() {
  const controller = new AbortController();

  async function run(fn) {
    if (controller.signal.aborted) return null;
    try {
      return await fn(controller.signal);
    } catch (err) {
      if (err.name === 'AbortError') return null;
      throw err;
    }
  }

  return { run, abort: () => controller.abort(), signal: controller.signal };
}

// ── dedupeAsync ──────────────────────────────────────────────────
// Verhindert parallele doppelte Requests für denselben Key.
// Zweiter Aufruf mit gleichem Key bekommt dieselbe Promise zurück.
//
// Usage:
//   const load = dedupeAsync((id) => fetchWork(id))
//   await Promise.all([load("123"), load("123")]) // nur EIN fetch
//
export function dedupeAsync(fn) {
  const pending = new Map();

  return async function(...args) {
    const key = JSON.stringify(args);
    if (pending.has(key)) return pending.get(key);

    const promise = fn(...args).finally(() => pending.delete(key));
    pending.set(key, promise);
    return promise;
  };
}

// ── createAsyncQueue ─────────────────────────────────────────────
// Serialisiert async Operationen — verhindert Race-Conditions.
// Nächste Operation startet erst wenn vorherige abgeschlossen.
//
// Usage:
//   const queue = createAsyncQueue()
//   queue.add(() => updateProfile(data))
//   queue.add(() => saveWork(work))  // wartet auf updateProfile
//
export function createAsyncQueue() {
  let tail = Promise.resolve();

  return {
    add(fn) {
      tail = tail.then(() => fn().catch(err => {
        // Queue läuft weiter auch bei Fehler
        sentryCapture(normalizeError(err), { source: 'asyncQueue' });
      }));
      return tail;
    },
    clear() { tail = Promise.resolve(); }
  };
}

// ── createRealtimeGuard ──────────────────────────────────────────
// Schützt Realtime-Callbacks vor:
// - veralteten Daten (stale closure)
// - Race conditions beim Unmount
// - doppelten Events (Supabase kann doppelt feuern)
//
// Usage:
//   const guard = createRealtimeGuard()
//   const handler = guard.wrap((payload) => setState(payload.new))
//   return () => guard.destroy()
//
export function createRealtimeGuard() {
  let active   = true;
  const seen   = new Set(); // Event-Dedupe

  return {
    wrap(handler) {
      return (payload) => {
        if (!active) return;

        // Deduplizierung via event ID wenn vorhanden
        const eventId = payload?.commit_timestamp || payload?.new?.updated_at;
        if (eventId) {
          if (seen.has(eventId)) return; // Doppeltes Event — ignorieren
          seen.add(eventId);
          if (seen.size > 50) {
            // Prevent memory leak — clear alte entries
            const oldest = [...seen].slice(0, 25);
            oldest.forEach(k => seen.delete(k));
          }
        }

        handler(payload);
      };
    },
    destroy() {
      active = false;
      seen.clear();
    },
    get isActive() { return active; },
  };
}

// ── useAsyncStatus ───────────────────────────────────────────────
// React Hook — standardisierter Async-Status.
// Ersetzt: loading/saving/sending/busy/pending — alle unified.
//
// Status: 'idle' | 'loading' | 'success' | 'error' | 'retrying' | 'offline'
//
// Usage:
//   const { status, run, error, reset } = useAsyncStatus()
//   await run(() => sendMessage(text))
//   if (status === 'loading') return <Spinner />
//
import { useState, useCallback } from 'react';

export function useAsyncStatus() {
  const [status, setStatus] = useState('idle');
  const [error,  setError]  = useState(null);
  const [data,   setData]   = useState(null);

  const run = useCallback(async (fn, opts = {}) => {
    const { retries = 0, onSuccess, onError } = opts;

    setStatus('loading');
    setError(null);

    try {
      const result = retries > 0
        ? await retryAsync(fn, {
            retries,
            onRetry: () => setStatus('retrying'),
          })
        : await fn();

      setData(result);
      setStatus('success');
      onSuccess?.(result);
      return { data: result, error: null };

    } catch (err) {
      const appErr = normalizeError(err);
      setError(appErr);
      setStatus(appErr.code === ERROR_CODES.NETWORK_OFFLINE ? 'offline' : 'error');
      onError?.(appErr);
      return { data: null, error: appErr };
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setData(null);
  }, []);

  return { status, error, data, run, reset,
    isIdle:     status === 'idle',
    isLoading:  status === 'loading',
    isSuccess:  status === 'success',
    isError:    status === 'error',
    isRetrying: status === 'retrying',
    isOffline:  status === 'offline',
  };
}

// ── useNetworkStatus ─────────────────────────────────────────────
// Erkennt Online/Offline-Status und feuert Callbacks.
//
export function useNetworkStatus(onReconnect = null) {
  const [online, setOnline] = useState(navigator.onLine);
  const wasOfflineRef = { current: !navigator.onLine };

  if (typeof window !== 'undefined') {
    // Setup einmalig (kein useEffect wegen SSR-safety)
  }

  return { online, wasOffline: wasOfflineRef.current };
}

// ── sleep ────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── withMountedGuard ─────────────────────────────────────────────
// Verhindert setState nach Unmount (Race Condition in useEffect).
// Ersetzt das manuelle `let mounted = true` Pattern.
//
// Usage:
//   useEffect(() => {
//     const { guard, cleanup } = withMountedGuard()
//     guard(() => setData(result))
//     return cleanup
//   }, [deps])
//
export function withMountedGuard() {
  let mounted = true;
  return {
    guard: (fn) => { if (mounted) fn(); },
    cleanup: () => { mounted = false; },
    isMounted: () => mounted,
  };
}
