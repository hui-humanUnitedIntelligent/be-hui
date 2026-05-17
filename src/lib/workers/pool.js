// src/lib/workers/pool.js
// HUI — Worker Pool System — Phase 6B.5
// ═══════════════════════════════════════════════════════════════
//
// ZWECK:
// Koordiniert mehrere Web Worker für Graph-Berechnungen.
// Priority Queue: kritische Jobs zuerst.
// Keine Worker-Explosion: max. 2 parallele Worker.
//
// MOBILE-FIRST:
// Auf LOW-Tier Devices: Pool deaktiviert (Worker-Overhead zu hoch).
// Auf MODEST+: 1 Worker.
// Auf CAPABLE+: 2 Worker.
//
// DESIGN:
// - Max 2 Worker (mehr = CPU-Überlastung auf Mobile)
// - 3 Prioritäts-Stufen: HIGH / NORMAL / LOW
// - Job-Cancellation: abgebrochene Jobs werden nicht berechnet
// - Idle-Shutdown: Worker terminiert nach 2min Inaktivität
// ═══════════════════════════════════════════════════════════════

import { detectDeviceTier } from '@/lib/deviceProfile/index';

// ── Konfiguration ──────────────────────────────────────────────
const MAX_WORKERS = {
  POWERFUL: 2,
  CAPABLE:  2,
  MODEST:   1,
  LOW:      0,  // Kein Worker-Pool
};

const IDLE_SHUTDOWN_MS = 120_000;  // 2min Inaktivität → Worker terminieren
const JOB_TIMEOUT_MS   = 8_000;   // 8s max pro Job

// ── Priority ───────────────────────────────────────────────────
export const PRIORITY = {
  HIGH:   0,  // Feed ist sichtbar, User wartet
  NORMAL: 1,  // Hintergrund-Enrichment
  LOW:    2,  // Prefetch, Speculative
};

// ── Worker Pool (Singleton) ───────────────────────────────────
class WorkerPool {
  constructor() {
    this._workers   = [];      // Worker-Instanzen
    this._queue     = [];      // { job, priority, resolve, reject, cancelled }
    this._busy      = new Set(); // Welche Worker sind beschäftigt?
    this._idleTimer = null;
    this._jobId     = 0;
    this._ready     = false;
    this._init();
  }

  _init() {
    const { tier } = detectDeviceTier();
    const maxW     = MAX_WORKERS[tier] ?? 1;

    if (maxW === 0) {
      console.info('[WorkerPool] Disabled on LOW-tier device');
      this._ready = true;
      return;
    }

    try {
      for (let i = 0; i < maxW; i++) {
        const worker = new Worker(
          new URL('./graphWorker.js', import.meta.url),
          { type: 'module' }
        );
        worker._id       = i;
        worker._pending  = new Map();

        worker.onmessage = (e) => this._onMessage(worker, e.data);
        worker.onerror   = (e) => this._onError(worker, e);

        this._workers.push(worker);
      }
      this._ready = true;
    } catch (err) {
      console.warn('[WorkerPool] Init failed:', err.message);
      this._ready = true;  // Fallback: Pool leer, Jobs laufen synchron
    }
  }

  _onMessage(worker, data) {
    const { id, type, payload } = data;
    const pending = worker._pending.get(id);
    if (!pending) return;

    clearTimeout(pending.timer);
    worker._pending.delete(id);
    this._busy.delete(worker._id);

    if (pending.cancelled) {
      // Job wurde storniert — trotzdem resolve (leeres Ergebnis)
      pending.resolve(null);
    } else if (type === 'ERROR') {
      pending.reject(new Error(payload?.message || 'Worker error'));
    } else {
      pending.resolve(payload);
    }

    this._resetIdleTimer();
    this._drainQueue();
  }

  _onError(worker, err) {
    console.error(`[WorkerPool] Worker ${worker._id}:`, err.message);
    // Alle pending Jobs dieses Workers ablehnen
    for (const [id, pending] of worker._pending.entries()) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Worker crashed'));
    }
    worker._pending.clear();
    this._busy.delete(worker._id);
    this._drainQueue();
  }

  _drainQueue() {
    if (this._queue.length === 0) return;

    // Freien Worker finden
    const freeWorker = this._workers.find(w => !this._busy.has(w._id));
    if (!freeWorker) return;

    // Höchste Priorität aus Queue
    this._queue.sort((a, b) => a.priority - b.priority);
    const next = this._queue.shift();
    if (!next) return;

    if (next.cancelled) {
      next.resolve(null);
      this._drainQueue();
      return;
    }

    this._busy.add(freeWorker._id);
    const jobId = ++this._jobId;

    const timer = setTimeout(() => {
      freeWorker._pending.delete(jobId);
      this._busy.delete(freeWorker._id);
      next.reject(new Error('Worker job timeout'));
      this._drainQueue();
    }, JOB_TIMEOUT_MS);

    freeWorker._pending.set(jobId, { ...next, timer });
    freeWorker.postMessage({ ...next.job, id: jobId });
  }

  _resetIdleTimer() {
    if (this._idleTimer) clearTimeout(this._idleTimer);
    this._idleTimer = setTimeout(() => {
      // Idle: Worker terminieren (sie werden bei Bedarf neu erstellt)
      if (this._queue.length === 0 && this._busy.size === 0) {
        console.info('[WorkerPool] Idle shutdown');
        this._workers.forEach(w => w.terminate());
        this._workers = [];
        this._ready   = false;
        // Lazy re-init beim nächsten Job
      }
    }, IDLE_SHUTDOWN_MS);
  }

  // ── Public API ──────────────────────────────────────────────

  submit(type, payload, priority = PRIORITY.NORMAL) {
    return new Promise((resolve, reject) => {
      const job = { type, payload };
      let cancelled = false;

      const entry = { job, priority, resolve, reject,
        get cancelled() { return cancelled; }
      };
      entry.cancel = () => { cancelled = true; };

      if (this._workers.length === 0) {
        // Kein Worker verfügbar → ablehnen (Fallback im Caller)
        reject(new Error('no_worker'));
        return;
      }

      this._queue.push(entry);
      this._drainQueue();
    });
  }

  get available() {
    return this._workers.length > 0;
  }

  stats() {
    return {
      workers:    this._workers.length,
      busy:       this._busy.size,
      queued:     this._queue.length,
      available:  this.available,
    };
  }
}

// Singleton
let _pool = null;
export function getWorkerPool() {
  if (!_pool) _pool = new WorkerPool();
  return _pool;
}
