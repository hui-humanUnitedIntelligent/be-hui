// src/lib/errorReporter.js
// HUI — Central Error Reporter (White-Screen & Error Reporting System)
// ═══════════════════════════════════════════════════════════════
// Erzeugt vollständige Error-Reports, gruppiert sie, matched gegen
// bekannte Ursachen, sendet an SADB + Sentry, und speichert für
// das Lernsystem.
//
// Punkt 1-8 des White-Screen & Error-Reporting-Systems (2026-08-22)
// ═══════════════════════════════════════════════════════════════

import { APP_VERSION } from '../version.js';
import { sentryCapture } from './sentry.js';

// ── Konstanten ──────────────────────────────────────────────────
// Direkter Insert in Supabase system_error_reports Tabelle (anon key, RLS erlaubt INSERT)
const SUPABASE_ERROR_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim() + '/rest/v1/system_error_reports';
const SUPABASE_ANON = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
const STORAGE_KEY = 'hui_error_reports';
const KNOWN_ERRORS_KEY = 'hui_known_errors';
const MAX_STORED_REPORTS = 50;
const MAX_GROUPS = 20;

// ── Bekannte White-Screen-Ursachen (Punkt 4) ────────────────────
const KNOWN_CAUSES = {
  'react_lazy_suspense': {
    id: 1,
    name: 'React.lazy + Vite Suspense Hang',
    patterns: [
      'Loading chunk', '__vitePreload', 'Suspense',
      'Failed to fetch dynamically imported module',
    ],
    description: 'React.lazy() + Vite\'s __vitePreload hängen fest — Suspense wartet ewig.',
  },
  'modul_init_crash': {
    id: 2,
    name: 'Modul-Scope Init ohne try-catch',
    patterns: ['initSentry', 'initGlobalKeyboardHandling', 'initAppPerformance', 'initOTA'],
    description: 'Init-Funktion crash vor createRoot() — Modul-Ausführung stoppt.',
  },
  'chunk_load_error': {
    id: 3,
    name: 'ChunkLoadError (stale assets)',
    patterns: ['ChunkLoadError', 'Loading chunk', 'Importing a module script failed'],
    description: 'Stale Chunk-Hash nach Deploy — Datei existiert nicht mehr.',
  },
  'vercel_stale_deployment': {
    id: 4,
    name: 'Vercel Stale Deployment',
    patterns: ['404', 'Not Found', 'text/html'],
    description: 'Vercel servt alte oder fehlende Chunk-Dateien nach neuem Deploy.',
  },
  'ota_crash_loop': {
    id: 5,
    name: 'OTA Crash-Loop (Mobile)',
    patterns: ['notifyAppReady', 'Capacitor', 'crash-loop', 'otaUpdate'],
    description: 'notifyAppReady vor React-Render → Plugin denkt Version stabil → Crash-Loop.',
  },
  'css_layout_white_screen': {
    id: 6,
    name: 'CSS Layout White Screen',
    patterns: ['animation-fill-mode', 'opacity:0', 'display:none', 'visibility:hidden'],
    description: 'CSS-Kombination macht Content unsichtbar trotz vorhandenem DOM.',
  },
  'stacking_context_trap': {
    id: 7,
    name: 'Stacking Context Traps',
    patterns: ['z-index', 'stacking', 'transform', 'filter', 'will-change'],
    description: 'Ancestor erzeugt Stacking-Context → z-index-Vergleich aushebelt.',
  },
  'backup_in_source_tree': {
    id: 8,
    name: 'Backup-Dateien im Source-Tree',
    patterns: ['backup_', '.bak', '.old', 'is public, should be declared'],
    description: 'Backup-Dateien werden vom Compiler als echte Module erfasst.',
  },
};

// ── Error-Gruppen-Store (Punkt 3) ───────────────────────────────
let errorGroups = new Map(); // fingerprint → group data

// ── Hilfsfunktionen ─────────────────────────────────────────────

function getDeviceModel() {
  const ua = navigator.userAgent;
  // iOS
  if (/iPad/.test(ua)) return 'iPad';
  if (/iPhone/.test(ua)) return 'iPhone';
  // Android
  const androidMatch = ua.match(/Android\s[\d.]+;\s([^)]+)\)/);
  if (androidMatch) return androidMatch[1].split(';')[0].trim();
  // Desktop
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Linux/.test(ua)) return 'Linux PC';
  return 'Unknown';
}

function getOSVersion() {
  const ua = navigator.userAgent;
  if (/OS (\d+[._]\d+)/.test(ua)) return ua.match(/OS (\d+[._]\d+)/)[1].replace('_', '.');
  if (/Android (\d+[.\d]*)/.test(ua)) return ua.match(/Android (\d+[.\d]*)/)[1];
  if (/Windows NT (\d+[.\d]*)/.test(ua)) return 'Windows ' + ua.match(/Windows NT (\d+[.\d]*)/)[1];
  if (/Mac OS X (\d+[._\d]*)/.test(ua)) return 'macOS ' + ua.match(/Mac OS X (\d+[._\d]*)/)[1].replace(/_/g, '.');
  return 'Unknown';
}

function getBrowserVersion() {
  const ua = navigator.userAgent;
  if (/Chrome\/(\d+)/.test(ua) && !/Edg/.test(ua)) return 'Chrome ' + ua.match(/Chrome\/(\d+)/)[1];
  if (/Firefox\/(\d+)/.test(ua)) return 'Firefox ' + ua.match(/Firefox\/(\d+)/)[1];
  if (/Safari\/(\d+)/.test(ua) && !/Chrome/.test(ua)) return 'Safari ' + ua.match(/Version\/(\d+)/)?.[1] || '?';
  if (/Edg\/(\d+)/.test(ua)) return 'Edge ' + ua.match(/Edg\/(\d+)/)[1];
  return 'Unknown';
}

function getCurrentRoute() {
  return window.location.pathname + window.location.hash;
}

function getUserId() {
  try {
    // Supabase session
    const session = localStorage.getItem('sb-gxztrhvhcxhmunhhkfjd-auth-token');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed?.user?.id || 'authenticated'; // SICHERHEITSFIX (2026-08-26): kein E-Mail-Fallback (PII-Schutz)
    }
  } catch (_) {}
  return 'anonymous';
}

function getAppStateSnapshot() {
  try {
    return {
      lastFeedComponent: window.__HUI_LAST_FEED_COMPONENT__ || null,
      documentHidden: document.hidden,
      visibilityState: document.visibilityState,
      online: navigator.onLine,
      viewport: window.innerWidth + 'x' + window.innerHeight,
      dpr: window.devicePixelRatio,
      memory: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB',
      } : null,
      rootChildren: document.getElementById('web-root')?.childElementCount ||
                     document.getElementById('root')?.childElementCount || 0,
    };
  } catch (_) {
    return null;
  }
}

function getLastUserAction() {
  try {
    return window.__HUI_LAST_USER_ACTION__ || null;
  } catch (_) {
    return null;
  }
}

// ── Fingerprint (für Gruppierung, Punkt 3) ──────────────────────
function generateFingerprint(report) {
  // Fingerprint = Fehlerart + Datei + erste 100 Zeichen der Message
  const filePart = report.filename ? report.filename.split('/').pop() : 'unknown';
  const msgPart = (report.message || '').substring(0, 100);
  return `${report.errorType}:${filePart}:${msgPart}`;
}

// ── Known-Cause-Matcher (Punkt 4) ────────────────────────────────
function matchKnownCause(report) {
  const fullText = `${report.message} ${report.stack || ''} ${report.filename || ''}`.toLowerCase();

  for (const [key, cause] of Object.entries(KNOWN_CAUSES)) {
    for (const pattern of cause.patterns) {
      if (fullText.includes(pattern.toLowerCase())) {
        return {
          matched: true,
          id: cause.id,
          key: key,
          label: `Bekannte Ursache: #${cause.id} aus WHITESCREEN_CAUSES.md`,
          name: cause.name,
          description: cause.description,
        };
      }
    }
  }
  return { matched: false, label: 'Unbekannt', name: 'Unbekannter Fehler' };
}

// ── Priorität bestimmen (Punkt 3) ────────────────────────────────
function determinePriority(errorType, knownCause, frequency) {
  if (knownCause.matched) {
    if (['react_lazy_suspense', 'modul_init_crash', 'ota_crash_loop'].includes(knownCause.key)) {
      return 'CRITICAL';
    }
    return 'HIGH';
  }
  if (errorType === 'white_screen') return 'CRITICAL';
  if (errorType === 'chunk_load_error') return 'HIGH';
  if (frequency >= 10) return 'HIGH';
  if (frequency >= 3) return 'MEDIUM';
  return 'LOW';
}

// ── Error-Code generieren ───────────────────────────────────────
function generateErrorCode(errorType, knownCause) {
  if (knownCause.matched) {
    return `WS-${String(knownCause.id).padStart(3, '0')}`;
  }
  const typeCodes = {
    'white_screen': 'WS-100',
    'js_error': 'JS-200',
    'chunk_load_error': 'CHK-300',
    'react_render_crash': 'RND-400',
    'suspense_hang': 'SUS-500',
    'ota_crash_loop': 'OTA-600',
    'css_white_screen': 'CSS-700',
    'unhandled_rejection': 'REJ-800',
  };
  return typeCodes[errorType] || 'UNK-999';
}

// ── Hauptfunktion: Report erzeugen (Punkt 2) ─────────────────────
export function createErrorReport(errorType, errorData = {}) {
  const timestamp = new Date().toISOString();
  const knownCause = matchKnownCause({ ...errorData, errorType });

  const report = {
    // Pflichtfelder (Punkt 2)
    id: `rpt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    errorType: errorType,
    errorCode: generateErrorCode(errorType, knownCause),
    message: errorData.message || 'Unknown error',
    stack: errorData.stack?.substring(0, 3000) || '',
    filename: errorData.filename || '',
    lineno: errorData.lineno || 0,
    colno: errorData.colno || 0,
    route: errorData.route || getCurrentRoute(),
    component: errorData.component || window.__HUI_LAST_FEED_COMPONENT__ || null,

    // Device & Environment
    deviceModel: getDeviceModel(),
    osVersion: getOSVersion(),
    appVersion: APP_VERSION,
    browserVersion: getBrowserVersion(),
    networkStatus: navigator.onLine ? 'online' : 'offline',

    // Zeit & Nutzer
    timestamp: timestamp,
    userId: getUserId(),

    // App-Zustand
    appState: getAppStateSnapshot(),
    lastUserAction: getLastUserAction(),

    // Analyse (Punkt 3+4)
    knownCause: knownCause,
    priority: null, // wird nach Gruppierung gesetzt
    frequency: 1,
    fingerprint: null, // wird nach Gruppierung gesetzt
    firstOccurrence: timestamp,
    lastOccurrence: timestamp,

    // Status
    status: 'open', // open / analyzing / fixed
    reportedToAdmin: false,
    reportedToBase44: false,
  };

  // Gruppierung (Punkt 3)
  report.fingerprint = generateFingerprint(report);
  const group = errorGroups.get(report.fingerprint);
  if (group) {
    group.frequency++;
    group.lastOccurrence = timestamp;
    report.frequency = group.frequency;
  } else {
    errorGroups.set(report.fingerprint, {
      fingerprint: report.fingerprint,
      frequency: 1,
      firstOccurrence: timestamp,
      lastOccurrence: timestamp,
      errorType: errorType,
      knownCause: knownCause,
    });
    if (errorGroups.size > MAX_GROUPS) {
      // Älteste Gruppe entfernen
      const oldestKey = errorGroups.keys().next().value;
      errorGroups.delete(oldestKey);
    }
  }

  // Priorität
  report.priority = determinePriority(errorType, knownCause, report.frequency);

  // SADB Events (Punkt 8)
  logSADBEvent('system_error_detected', report);
  logSADBEvent('system_error_report_created', report);

  // Gruppierung-Event
  if (group) {
    logSADBEvent('system_error_grouped', { ...report, groupSize: group.frequency });
  }

  return report;
}

// ── Report senden (Punkt 5+6+8) ──────────────────────────────────
export function sendErrorReport(report) {
  // An SADB (Punkt 5)
  try {
    // Direkter Insert in Supabase system_error_reports (RLS erlaubt anon INSERT)
    const payload = {
      error_id:        report.id,
      error_type:      report.errorType || 'unknown',
      error_code:      report.errorCode || null,
      message:         (report.message || '').substring(0, 2000),
      stack:           report.stack?.substring(0, 3000) || null,
      filename:        report.filename || null,
      lineno:          report.lineno || null,
      colno:           report.colno || null,
      route:           report.route || null,
      component:       report.component || null,
      device_model:    report.deviceModel || null,
      os_version:      report.osVersion || null,
      app_version:     report.appVersion || null,
      browser_version: report.browserVersion || null,
      network_status:  report.networkStatus || null,
      user_id:         report.userId || null,
      app_state:       report.appState || null,
      last_user_action: report.lastUserAction || null,
      known_cause_id:  report.knownCause?.id || null,
      known_cause_name: report.knownCause?.name || null,
      priority:        report.priority || 'MEDIUM',
      frequency:       report.frequency || 1,
      fingerprint:     report.fingerprint || null,
      status:          report.status || 'new',
    };

    if (SUPABASE_ERROR_URL && SUPABASE_ANON) {
      fetch(SUPABASE_ERROR_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON,
          'Authorization': `Bearer ${SUPABASE_ANON}`,
        },
        keepalive: true,
      }).catch(() => {});
    }

    report.reportedToAdmin = true;
    logSADBEvent('system_error_sent_to_admin', report);
  } catch (e) {
    console.warn('[HUI ErrorReporter] Send to SADB failed:', e);
  }

  // An Sentry (Punkt 6 — Errorbox für Base44)
  try {
    sentryCapture(new Error(report.message), {
      errorType: report.errorType,
      errorCode: report.errorCode,
      knownCause: report.knownCause.label,
      priority: report.priority,
      fingerprint: report.fingerprint,
      route: report.route,
      component: report.component,
      deviceModel: report.deviceModel,
      osVersion: report.osVersion,
    });
    report.reportedToBase44 = true;
  } catch (e) {
    // Sentry kann disabled sein — kein Problem
  }

  // Toast-UI benachrichtigen (sichtbare Fehler-Anzeige)
  try {
    window.dispatchEvent(new CustomEvent('hui:error-report', { detail: report }));
  } catch (_) {}

  // Lokal speichern (Lernsystem, Punkt 7)
  storeReportLocally(report);

  return report;
}

// ── Lokale Speicherung (Lernsystem, Punkt 7) ────────────────────
function storeReportLocally(report) {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    stored.push({
      id: report.id,
      errorType: report.errorType,
      errorCode: report.errorCode,
      message: report.message.substring(0, 200),
      fingerprint: report.fingerprint,
      knownCause: report.knownCause.label,
      timestamp: report.timestamp,
      status: report.status,
    });
    // Max 50 Reports lokal
    if (stored.length > MAX_STORED_REPORTS) {
      stored.splice(0, stored.length - MAX_STORED_REPORTS);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (_) {}
}

// ── SADB Event Logging (Punkt 8) ────────────────────────────────
function logSADBEvent(eventType, report) {
  try {
    const event = {
      event_type: eventType,
      timestamp: new Date().toISOString(),
      error_id: report.id,
      error_type: report.errorType,
      error_code: report.errorCode,
      fingerprint: report.fingerprint,
      priority: report.priority,
      known_cause: report.knownCause?.label || null,
    };
    // Event-Log wird lokal gespeichert (kein separater Network-Call nötig —
    // der Error-Report selbst geht bereits an Supabase).
    try {
      const logs = JSON.parse(localStorage.getItem('hui_sadb_events') || '[]');
      logs.push(event);
      if (logs.length > 100) logs.splice(0, logs.length - 100);
      localStorage.setItem('hui_sadb_events', JSON.stringify(logs));
    } catch (_) {}
  } catch (_) {}
}

// ── Lernsystem: Bekannte Fehler laden (Punkt 7) ──────────────────
export function loadKnownErrors() {
  try {
    return JSON.parse(localStorage.getItem(KNOWN_ERRORS_KEY) || '[]');
  } catch (_) {
    return [];
  }
}

export function markErrorFixed(report, solution) {
  const known = loadKnownErrors();
  const entry = {
    fingerprint: report.fingerprint,
    errorType: report.errorType,
    errorCode: report.errorCode,
    message: report.message.substring(0, 200),
    knownCause: report.knownCause.label,
    solution: solution,
    fixedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
  };

  // Duplikat-Check
  const existing = known.find(k => k.fingerprint === report.fingerprint);
  if (existing) {
    existing.solution = solution;
    existing.fixedAt = entry.fixedAt;
    existing.appVersion = entry.appVersion;
  } else {
    known.push(entry);
  }

  try {
    localStorage.setItem(KNOWN_ERRORS_KEY, JSON.stringify(known));
  } catch (_) {}

  logSADBEvent('system_error_fixed', { ...report, solution });
  return entry;
}

export function checkReoccurrence(report) {
  const known = loadKnownErrors();
  const existing = known.find(k => k.fingerprint === report.fingerprint);
  if (existing) {
    logSADBEvent('system_error_reoccurred', report);
    return { reoccurred: true, previousSolution: existing.solution };
  }
  return { reoccurred: false };
}

// ── User-Action Tracking (für "letzter User-Action-Event") ───────
export function trackUserAction(action, details = {}) {
  window.__HUI_LAST_USER_ACTION__ = {
    action: action,
    details: details,
    timestamp: new Date().toISOString(),
    route: getCurrentRoute(),
  };
}

// ── Convenience: Vollständiger Report-Pipeline ──────────────────
export function reportError(errorType, errorData = {}) {
  const report = createErrorReport(errorType, errorData);

  // Reoccurrence-Check (Lernsystem, Punkt 7)
  const reoccurrence = checkReoccurrence(report);
  if (reoccurrence.reoccurred) {
    report.reoccurred = true;
    report.previousSolution = reoccurrence.previousSolution;
  }

  sendErrorReport(report);
  return report;
}

// ── Initialisierung: Global Error Listeners ─────────────────────
export function initErrorReporting() {
  // JS-Fehler (Punkt 1)
  window.addEventListener('error', (event) => {
    if (!event.error && !event.message) return;
    // Irrelevante Fehler ignorieren
    const msg = event.error?.message || event.message || '';
    if (msg.includes('ResizeObserver loop')) return;
    if (msg.includes('Non-Error promise rejection')) return;

    // Chunk-Error → spezieller Typ
    const isChunk = msg.includes('Failed to fetch dynamically imported module') ||
                   msg.includes('Loading chunk') ||
                   msg.includes('ChunkLoadError') ||
                   msg.includes('Importing a module script failed');

    reportError(isChunk ? 'chunk_load_error' : 'js_error', {
      message: msg,
      stack: event.error?.stack?.substring(0, 2000) || '',
      filename: event.filename || '',
      lineno: event.lineno || 0,
      colno: event.colno || 0,
    });
  });

  // Unhandled Rejections (Punkt 1)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason || 'Unknown rejection');
    if (msg.includes('ResizeObserver loop')) return;
    if (msg.includes('Non-Error promise rejection')) return;

    reportError('unhandled_rejection', {
      message: msg,
      stack: reason?.stack?.substring(0, 2000) || '',
    });
  });

  // White-Screen Detection (Punkt 1)
  setTimeout(() => {
    const root = document.getElementById('web-root') || document.getElementById('root');
    if (root && !root.hasChildNodes()) {
      reportError('white_screen', {
        message: 'White Screen: #web-root/#root hat keine Children nach 5s',
        filename: 'web.html',
        component: 'Root',
      });
    }
  }, 5000);

  // CSS White-Screen Detection (Punkt 1)
  setTimeout(() => {
    const root = document.getElementById('web-root') || document.getElementById('root');
    if (root && root.hasChildNodes()) {
      const style = window.getComputedStyle(root);
      if (style.display === 'none' || style.visibility === 'hidden' ||
          style.opacity === '0' || root.offsetHeight === 0) {
        reportError('css_white_screen', {
          message: 'CSS White Screen: Root-Element unsichtbar (display/visibility/opacity/height)',
          filename: 'web.html',
          component: 'Root',
        });
      }
    }
  }, 6000);

  // User-Action Tracking (Punkt 2 — letzter User-Action-Event)
  ['click', 'submit', 'change', 'keydown'].forEach(evt => {
    document.addEventListener(evt, (e) => {
      // FIX (2026-08-22, SVG-CLICK-CRASH): e.target.className ist bei SVG-Elementen
      // (z.B. Zahnrad-Icon im Profil) KEIN String, sondern ein SVGAnimatedString-Objekt
      // ohne .substring()-Methode -> "o.substring is not a function" bei JEDEM Klick
      // auf ein SVG/<path>-Icon systemweit. getAttribute('class') liefert bei HTML-
      // UND SVG-Elementen zuverlässig einen echten String (oder null).
      let cls = '';
      try {
        const raw = e.target?.getAttribute ? e.target.getAttribute('class') : null;
        cls = typeof raw === 'string' ? raw.substring(0, 50) : '';
      } catch (_) { /* nie einen Tracking-Fehler nach außen werfen */ }
      trackUserAction(evt, {
        target: e.target?.tagName || 'unknown',
        id: e.target?.id || '',
        className: cls,
      });
    }, { passive: true });
  });

  // Network status tracking (Punkt 2)
  window.addEventListener('online', () => trackUserAction('network_online'));
  window.addEventListener('offline', () => trackUserAction('network_offline'));

  console.info('[HUI ErrorReporter] Initialized — monitoring active');
}

// ── Export: Known Causes für externe Nutzung ─────────────────────
export { KNOWN_CAUSES };
