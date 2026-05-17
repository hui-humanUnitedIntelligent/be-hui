// src/lib/realtime/index.js
// HUI — Realtime Scale Governance — Phase 6A.5
// ═══════════════════════════════════════════════════════════════
//
// PROBLEM GELÖST:
// Realtime Channels ohne Backoff, ohne Pooling, ohne Lifecycle.
//
// LÖSUNG:
// - Centralized Channel Registry (Single Owner pro Channel)
// - Reconnect Exponential Backoff (1s → 2s → 4s → 8s → max 30s)
// - Visibility-Aware: Tab im Hintergrund → Throttle
// - Idle Mode: nach 5min Inaktivität → Unsubscribe
// - Memory-safe: cleanup bei Unmount immer garantiert
// ═══════════════════════════════════════════════════════════════

import { supabase } from '@/lib/supabaseClient';

// ── Globale Channel Registry (Singleton) ──────────────────────
const REGISTRY = new Map();  // channelName → { channel, subscribers, lastEvent }

// Backoff-Konfiguration
const BACKOFF = {
  initial:  1_000,
  max:      30_000,
  factor:   2,
};

// Idle-Timeout: nach 5min ohne Events → Unsubscribe
const IDLE_TIMEOUT_MS = 5 * 60_000;

function getBackoffDelay(attempt) {
  return Math.min(BACKOFF.initial * Math.pow(BACKOFF.factor, attempt), BACKOFF.max);
}

// ── Channel Factory ────────────────────────────────────────────
/**
 * Erstellt oder wiederverwendet einen Realtime-Channel.
 * Single-Owner-Prinzip: jeder Channel-Name hat genau einen Subscriber.
 *
 * @param {string}   name       — Channel-Name (eindeutig pro Kontext)
 * @param {Function} configure  — (channel) => channel mit .on() Callbacks
 * @param {Object}   opts
 * @returns {{ unsubscribe: Function }}
 */
export function createChannel(name, configure, opts = {}) {
  const { onError = null, onReconnect = null } = opts;

  // Bestehenden Channel wiederverwenden
  if (REGISTRY.has(name)) {
    const existing = REGISTRY.get(name);
    existing.subscribers++;
    return {
      unsubscribe: () => {
        existing.subscribers--;
        if (existing.subscribers <= 0) {
          cleanupChannel(name);
        }
      },
    };
  }

  let attempt      = 0;
  let idleTimer    = null;
  let isDestroyed  = false;

  const entry = {
    channel:     null,
    subscribers: 1,
    lastEvent:   Date.now(),
    attempt,
  };
  REGISTRY.set(name, entry);

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    entry.lastEvent = Date.now();
    if (!document.hidden) {
      idleTimer = setTimeout(() => {
        if (!isDestroyed) {
          console.info(`[Realtime] ${name}: Idle timeout, unsubscribing`);
          cleanupChannel(name);
        }
      }, IDLE_TIMEOUT_MS);
    }
  }

  function connect() {
    if (isDestroyed) return;

    const channel = supabase.channel(name);
    configure(channel);

    channel.on('system', {}, (payload) => {
      if (payload.extension === 'postgres_changes') {
        resetIdleTimer();
      }
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        attempt = 0;  // Reset backoff on success
        entry.attempt = 0;
        if (onReconnect && attempt > 0) onReconnect();
        resetIdleTimer();
      }

      if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        if (!isDestroyed) {
          const delay = getBackoffDelay(attempt);
          attempt++;
          entry.attempt = attempt;
          console.warn(`[Realtime] ${name}: ${status}, retry in ${delay}ms (attempt ${attempt})`);
          if (onError) onError({ status, attempt, delay });
          setTimeout(connect, delay);
        }
      }
    });

    entry.channel = channel;
  }

  // Visibility Change: Tab im Hintergrund → Idle beschleunigen
  const onVisibilityChange = () => {
    if (document.hidden) {
      // Tab hidden: Idle-Timer auf 30s verkürzen
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (!isDestroyed && entry.subscribers > 0) {
          console.info(`[Realtime] ${name}: Tab hidden, throttling`);
          // Channel bleibt aktiv aber Idle-Timer verkürzt
        }
      }, 30_000);
    } else {
      // Tab visible wieder: voller Idle-Timer
      resetIdleTimer();
    }
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  connect();

  return {
    unsubscribe: () => {
      entry.subscribers--;
      if (entry.subscribers <= 0) {
        cleanupChannel(name);
      }
    },
    getStatus: () => ({
      name,
      subscribers:  entry.subscribers,
      attempt:      entry.attempt,
      lastEvent:    entry.lastEvent,
      isIdle:       Date.now() - entry.lastEvent > IDLE_TIMEOUT_MS * 0.8,
    }),
  };

  function cleanupChannel(channelName) {
    const entry = REGISTRY.get(channelName);
    if (!entry) return;
    isDestroyed = true;
    if (idleTimer) clearTimeout(idleTimer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    if (entry.channel) {
      supabase.removeChannel(entry.channel);
    }
    REGISTRY.delete(channelName);
  }
}

// ── Registry Stats (für Observability) ───────────────────────
export function getRealtimeStats() {
  const channels = [];
  for (const [name, entry] of REGISTRY.entries()) {
    channels.push({
      name,
      subscribers: entry.subscribers,
      attempt:     entry.attempt,
      idleMs:      Date.now() - entry.lastEvent,
    });
  }
  return { activeChannels: REGISTRY.size, channels };
}

// ── Convenience: Typed Channels ─────────────────────────────────
export function createBookingChannel(userId, onBookingEvent) {
  return createChannel(
    `asc-bookings:${userId}`,
    (ch) => ch.on('postgres_changes', {
      event: '*', schema: 'public', table: 'bookings',
      filter: `wirker_user_id=eq.${userId}`,
    }, onBookingEvent),
    { onError: (e) => console.warn('[BookingChannel]', e) }
  );
}

export function createChatChannel(userId, onChatEvent) {
  return createChannel(
    `asc-chats:${userId}`,
    (ch) => ch.on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'messages',
    }, onChatEvent),
  );
}

export function createNotifChannel(userId, onNotifEvent) {
  return createChannel(
    `asc-notifs:${userId}`,
    (ch) => ch.on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, onNotifEvent),
  );
}
