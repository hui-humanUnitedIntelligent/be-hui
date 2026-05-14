// src/lib/sentry.js
// ════════════════════════════════════════════════════════════════
// HUI Sentry Runtime Error Monitoring
//
// Verwendung:
//   import { sentryCapture, sentryContext } from './lib/sentry';
//   sentryCapture(error, { item_id: '...', item_type: '...' });
//
// Init: einmalig in main.jsx aufgerufen via initSentry()
// DSN:  VITE_SENTRY_DSN in Vercel Environment Variables
// ════════════════════════════════════════════════════════════════

import * as Sentry from '@sentry/react';

// ── Initialisierung ─────────────────────────────────────────────
// Wird einmalig in main.jsx aufgerufen.
// Wenn kein DSN gesetzt → Sentry silent/disabled (kein Fehler).
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.info('[HUI Sentry] No VITE_SENTRY_DSN set — monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'production',
    release:     import.meta.env.VITE_APP_VERSION || 'hui@unknown',

    // ── Performance Tracing ──────────────────────────────────
    // 10% aller Sessions tracen — nicht 100% um Quota zu schonen
    tracesSampleRate: 0.1,

    // ── Session Replay ───────────────────────────────────────
    // 5% normale Sessions, 100% wenn Error auftritt
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      // BrowserTracing: Performance + Navigation Tracing
      Sentry.browserTracingIntegration(),

      // Replay: Video-ähnliche Wiedergabe bei Crash
      Sentry.replayIntegration({
        // Keine PII — Texte und Medien maskieren
        maskAllText:   false,   // Feed-Labels lesbar lassen für Diagnose
        blockAllMedia: false,   // Bilder sichtbar für Kontext
      }),
    ],

    // ── Zusätzlicher Kontext bei jedem Event ─────────────────
    beforeSend(event, hint) {
      // Safari/iPad-spezifische Zusatzinfos anhängen
      event.contexts = event.contexts || {};
      event.contexts.hui_runtime = {
        last_feed_component: window.__HUI_LAST_FEED_COMPONENT__ || null,
        document_hidden:     document.hidden,
        visibility_state:    document.visibilityState,
        user_agent:          navigator.userAgent,
        viewport:            window.innerWidth + 'x' + window.innerHeight,
        device_pixel_ratio:  window.devicePixelRatio,
        is_ipad:             /iPad/.test(navigator.userAgent) ||
                             (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
        online:              navigator.onLine,
        href:                window.location.href,
        timestamp_local:     new Date().toISOString(),
      };
      return event;
    },

    // Ignoriere irrelevante Browser-Extension Fehler
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      'The object can only be used once',  // Safari IndexedDB
    ],
  });

  console.info('[HUI Sentry] Initialized. DSN=' + dsn.slice(0, 30) + '...');
}

// ── captureException — überall verwendbar ────────────────────────
// Sendet Fehler mit HUI-Kontext zu Sentry.
// Falls Sentry nicht initialisiert: nur console.error.
//
// Usage:
//   sentryCapture(err, { item_id: item.id, item_type: item.type, index: 3 })
export function sentryCapture(error, context = {}) {
  const eventId = Sentry.withScope(scope => {
    // Alle Kontext-Keys als extras setzen
    Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));

    // Globale HUI-Extras
    scope.setExtra('last_feed_component', window.__HUI_LAST_FEED_COMPONENT__ || null);
    scope.setExtra('document_hidden',     document.hidden);
    scope.setExtra('visibility_state',    document.visibilityState);
    scope.setExtra('href',                window.location.href);

    // Tag für schnelle Filterung in Sentry Dashboard
    if (context.source) scope.setTag('hui.source', context.source);
    if (context.item_type) scope.setTag('hui.item_type', context.item_type);

    return Sentry.captureException(error);
  });

  // Event-ID immer in console — auch wenn Sentry disabled
  if (eventId) {
    console.error('[HUI Sentry] Event captured. ID:', eventId, '| context:', context);
  }
  return eventId;
}

// ── sentryMessage — für Warning-Level Events ──────────────────────
export function sentryMessage(msg, level = 'warning', context = {}) {
  Sentry.withScope(scope => {
    scope.setLevel(level);
    Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
    Sentry.captureMessage(msg);
  });
}

// ── Re-export Sentry für direkte Verwendung ───────────────────────
export { Sentry };
