// src/web-main.jsx
// HUI Web Entry Point — Enhanced with Error Reporting System (2026-08-22)
// ═══════════════════════════════════════════════════════════════
// Punkt 10.2: Jeder Top-Level-Code MUSS in try-catch.
// Punkt 11: GlobalAppBoundary um die gesamte App.
// Error-Reporter init für automatische Fehlererkennung.
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from './WebApp.jsx';
import { GlobalAppBoundary } from './lib/ErrorBoundaries.jsx';
import ErrorReportToast from './lib/ErrorReportToast.jsx';
import { initErrorReporting, reportError } from './lib/errorReporter.js';
import './index.css';
import './web.css';
import './landing.css';
import { initSentry } from './lib/sentry.js';
import { initGlobalKeyboardHandling } from "./lib/globalKeyboardHandler.js";

// ── Set App Version for Error Reports ────────────────────────────
import { APP_VERSION } from './version.js';
window.__HUI_APP_VERSION__ = APP_VERSION;

// ── Sentry ────────────────────────────────────────────────────────
// Punkt 10.2: try-catch um ALLE Init-Funktionen
try { initSentry(); } catch (e) { console.error('[HUI] Sentry init failed:', e); }

// ── Global keyboard handling ──────────────────────────────────────
try { initGlobalKeyboardHandling(); } catch (e) { console.error('[HUI] KB init failed:', e); }

// ── Error Reporting System (Punkt 1-8) ────────────────────────────
try { initErrorReporting(); } catch (e) { console.error('[HUI] ErrorReporter init failed:', e); }

// ── Render ────────────────────────────────────────────────────────
// Punkt 11: Eine einzige Top-Level Error Boundary um die gesamte App
// GlobalAppBoundary fängt JEDEN Render-Fehler ab, bevor White Screen entsteht
try {
  ReactDOM.createRoot(document.getElementById('web-root')).render(
    <React.StrictMode>
      <GlobalAppBoundary>
        <WebApp />
        <ErrorReportToast />
      </GlobalAppBoundary>
    </React.StrictMode>
  );
} catch (e) {
  // Punkt 10.2: Wenn createRoot selbst crasht (z.B. #web-root fehlt)
  console.error('[HUI] createRoot failed:', e);
  try {
    reportError('react_render_crash', {
      message: 'createRoot failed: ' + (e?.message || String(e)),
      stack: e?.stack?.substring(0, 2000) || '',
      component: 'web-main.jsx / createRoot',
    });
  } catch (_) {}
  // Last-resort: direkt HTML schreiben
  var root = document.getElementById('web-root');
  if (root) {
    root.innerHTML = '<div style="position:fixed;inset:0;background:#F9F6F2;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;font-family:sans-serif">' +
      '<div style="font-size:36px;margin-bottom:8px;opacity:0.7">✦</div>' +
      '<h1 style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0 0 4px 0;text-align:center">HUI Web — Start-Fehler</h1>' +
      '<p style="font-size:14px;color:#888;margin:0 0 24px 0;text-align:center;max-width:400px">Die App konnte nicht starten. Bitte lade die Seite neu.</p>' +
      '<button onclick="window.location.reload()" style="padding:12px 28px;background:#0DC4B5;border:none;border-radius:14px;color:white;font-size:15px;font-weight:600;cursor:pointer">Neu laden</button>' +
      '<p style="font-size:11px;color:#aaa;margin:24px 0 0 0">HUI Web Guard v3 &middot; ' + new Date().toISOString() + '</p>' +
      '</div>';
  }
}
