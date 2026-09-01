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
import { supabase } from './lib/supabaseClient.js';
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

// ── Session-Restore aus Cross-Domain-Redirect-Hash (FIX INC-004, 2026-09-01) ──
// ROOT CAUSE: AuthCallback.jsx (be-hui.vercel.app) übergibt die Session nach
// erfolgreicher Bestätigung als URL-Hash (#access_token=...&refresh_token=...)
// an www.be-hui.app/app/Home, weil localStorage per-Origin ist. Der Supabase-
// Client hier ist mit flowType:'pkce' konfiguriert (supabaseClient.js).
// GoTrueClient._getSessionFromURL() (auth-js) erkennt zwar den Hash als
// "implicit"-Callback (params.access_token vorhanden), wirft dann aber INTERN
// einen AuthPKCEGrantCodeExchangeError('Not a valid PKCE flow url.'), weil
// implicit-Grant-URL-Parameter mit flowType:'pkce' als Mismatch gilt (siehe
// GoTrueClient.js _getSessionFromURL(), switch(callbackUrlType) case 'implicit').
// Der Fehler wird intern abgefangen (kein Crash) — die Session wird aber NIE
// gesetzt. Ergebnis: Nutzer landet nach Klick auf den Bestätigungslink NICHT
// eingeloggt auf der Login-Seite, obwohl der Link korrekt verifiziert wurde.
// (Verifiziert per Code-Analyse in node_modules/@supabase/auth-js sowie durch
// echten Repro-Test mit einer per Supabase Admin API erzeugten Session.)
//
// FIX: Hash selbst parsen und die Session explizit über supabase.auth.setSession()
// setzen — dieser Pfad hat KEINEN flowType-Check (setSession() → _setSession()
// ruft nur _getUser(access_token) auf und speichert die Session direkt).
// Muss VOR dem React-Render laufen, damit AuthContext beim Mount bereits die
// gesetzte Session sieht (onAuthStateChange feuert SIGNED_IN synchron beim
// setSession()-Call, AuthContext hört bereits auf dieses Event).
async function restoreSessionFromHashIfPresent() {
  try {
    const hash = window.location.hash;
    if (!hash || hash.indexOf('access_token=') === -1) return;

    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    // Hash aus der Adressleiste entfernen — Tokens sollen nicht in der
    // Browser-History/URL-Leiste sichtbar bleiben (unabhängig vom Ergebnis).
    const cleanUrl = window.location.pathname + window.location.search;
    window.history.replaceState(null, '', cleanUrl);

    if (!accessToken || !refreshToken) return;

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      console.error('[HUI] Session-Restore aus Hash fehlgeschlagen:', error.message);
      try {
        reportError('session_restore_from_hash_failed', {
          message: error.message,
          component: 'web-main.jsx / restoreSessionFromHashIfPresent',
        });
      } catch (_) {}
    }
  } catch (e) {
    console.error('[HUI] restoreSessionFromHashIfPresent crashed:', e);
  }
}

// ── Render ────────────────────────────────────────────────────────
// Punkt 11: Eine einzige Top-Level Error Boundary um die gesamte App
// GlobalAppBoundary fängt JEDEN Render-Fehler ab, bevor White Screen entsteht
(async () => {
  await restoreSessionFromHashIfPresent();

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
})();
