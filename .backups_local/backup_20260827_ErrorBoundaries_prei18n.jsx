// src/lib/ErrorBoundaries.jsx
// HUI — Error Boundary System — Phase 4B.7
// ═══════════════════════════════════════════════════════════════
// GlobalAppBoundary  — ganz oben in App.jsx
// RouteBoundary      — um einzelne Routes
// OverlayBoundary    — um Overlays (Sheet, Modal etc.)
//
// Kein White Screen. Kein Crash-Loop. Kein roher Stacktrace.
// ═══════════════════════════════════════════════════════════════
import React from 'react';
import { sentryCapture } from './sentry.js';
import { normalizeError, SEVERITY } from './errors/index.js';
import { reportError, markErrorFixed } from './errorReporter.js';
import { HUI } from "../design/hui.design.js";

const C = {
  cream: '#F9F6F2', card: HUI.COLOR.white,
  teal: HUI.COLOR.tealStudio, coral: HUI.COLOR.coralStudio,
  ink: HUI.COLOR.inkStudio, muted: '#888',
  border: 'rgba(0,0,0,0.07)',
};

// ── GlobalAppBoundary ────────────────────────────────────────────
// Fängt alle unkontrollierten Fehler auf App-Ebene.
// Zeigt eine sanfte Recovery-UI statt einem White Screen.
export class GlobalAppBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, retryCount: 0 };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    // ChunkLoadError → Hard Reload (stale assets nach neuem Deploy)
    const msg = error?.message || '';
    const isChunk = msg.includes('Failed to fetch dynamically imported module') ||
                    msg.includes('Loading chunk') ||
                    msg.includes('ChunkLoadError') ||
                    msg.includes('Importing a module script failed');
    if (isChunk) {
      // Error-Report vor dem Reload erzeugen (Punkt 2)
      try {
        reportError('chunk_load_error', {
          message: msg,
          stack: error.stack?.substring(0, 2000) || '',
          component: 'GlobalAppBoundary',
        });
      } catch (_) {}
      const lastReload = Number(sessionStorage.getItem('_hui_chunk_reload') || 0);
      // Punkt 10.3: max 2 Retries, danach Fallback-UI (nicht endlos reload)
      const reloadCount = Number(sessionStorage.getItem('_hui_chunk_reload_count') || 0);
      if (reloadCount < 2 && Date.now() - lastReload > 10000) {
        sessionStorage.setItem('_hui_chunk_reload', String(Date.now()));
        sessionStorage.setItem('_hui_chunk_reload_count', String(reloadCount + 1));
        // SICHERHEITSFIX (Red-Team-Audit C.15): Nutzer-Feedback vor Reload
        const _ov = document.createElement('div');
        _ov.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.95);display:flex;align-items:center;justify-content:center;z-index:99999;font-family:Inter,sans-serif;flex-direction:column;gap:12px';
        _ov.innerHTML = '<div style="font-size:16px;font-weight:600;color:#333">App wird aktualisiert…</div><div style="font-size:14px;color:#666">Ein kurzer Moment bitte</div><div style="width:40px;height:40px;border:3px solid #16D7C3;border-top-color:transparent;border-radius:50%;animation:_hui_spin 0.8s linear infinite"></div><style>@keyframes _hui_spin{to{transform:rotate(360deg)}}</style>';
        document.body.appendChild(_ov);
        setTimeout(() => window.location.reload(), 200);
        return;
      } else {
        // Nach 2 Reloads: Fallback-UI anzeigen (nicht weiter reloaden)
        sessionStorage.removeItem('_hui_chunk_reload_count');
      }
    }

    // Suspense-Hang Detection (Punkt 1 — Suspense-Hänger)
    const isSuspense = msg.includes('Suspense') || msg.includes('lazy') ||
                       msg.includes('__vitePreload');

    const appErr = normalizeError(error, {
      componentStack: errorInfo?.componentStack?.slice(0, 500),
      lastFeedComponent: window.__HUI_LAST_FEED_COMPONENT__,
      retryCount: this.state.retryCount,
    });
    sentryCapture(appErr, { boundary: 'GlobalAppBoundary' });

    // ── Vollständiger Error-Report (Punkt 2) ──────────────────────
    try {
      reportError(isChunk ? 'chunk_load_error' : isSuspense ? 'suspense_hang' : 'react_render_crash', {
        message: msg || 'React render crash',
        stack: error.stack?.substring(0, 2000) || '',
        filename: error.fileName || '',
        lineno: error.lineNumber || 0,
        colno: error.columnNumber || 0,
        component: errorInfo?.componentStack?.split('\n')
          ?.find(l => l.trim().startsWith('at '))?.trim()?.substring(0, 100) || 'GlobalAppBoundary',
      });
    } catch (e) {
      console.error('[HUI] ErrorReporter failed in boundary:', e);
    }
  }

  handleRetry() {
    this.setState(s => ({ error: null, retryCount: s.retryCount + 1 }));
  }

  render() {
    if (!this.state.error) return this.props.children;

    const appErr = normalizeError(this.state.error);
    const isFatal = appErr.severity === SEVERITY.FATAL || this.state.retryCount >= 3;

    return (
      <div style={{
        position: 'fixed', inset: 0, background: C.cream,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 32, fontFamily: 'inherit',
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>
          {isFatal ? '✦' : '○'}
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, color: C.ink, marginBottom: 8, textAlign: 'center' }}>
          {isFatal ? 'HUI muss neu gestartet werden' : 'Etwas ist schiefgelaufen'}
        </div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 28, textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
          {appErr.toUserMessage?.() || 'Ein unerwarteter Fehler ist aufgetreten.'}
        </div>
        {isFatal ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '12px 28px', background: C.teal, border: 'none',
                borderRadius: 14, color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              App neu starten
            </button>
            <button
              onClick={() => {
                if (navigator.serviceWorker) {
                  navigator.serviceWorker.getRegistrations().then(r =>
                    r.forEach(sw => sw.unregister())
                  ).then(() => window.location.reload());
                } else { window.location.reload(); }
              }}
              style={{ padding: '10px 22px', background: 'transparent',
                border: `1px solid ${C.border}`, borderRadius: 14,
                color: C.muted, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              Cache leeren & neu laden
            </button>
          </div>
        ) : (
          <button
            onClick={this.handleRetry}
            style={{ padding: '12px 28px', background: C.teal, border: 'none',
              borderRadius: 14, color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Erneut versuchen ({this.state.retryCount}/3)
          </button>
        )}
      </div>
    );
  }
}

// ── RouteBoundary ────────────────────────────────────────────────
// Fängt Fehler in einzelnen Route-Komponenten.
// Zeigt eine kompakte Inline-Fehlermeldung.
export class RouteBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    sentryCapture(normalizeError(error), {
      boundary: 'RouteBoundary',
      route: this.props.name || 'unknown',
    });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '40vh', padding: 24, gap: 12,
      }}>
        <div style={{ fontSize: 28 }}>○</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>
          {this.props.fallbackTitle || 'Seite konnte nicht geladen werden'}
        </div>
        <button
          onClick={() => this.setState({ error: null })}
          style={{ padding: '10px 22px', background: `${C.teal}15`,
            border: `1px solid ${C.teal}40`, borderRadius: 12,
            color: C.teal, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Neu laden
        </button>
      </div>
    );
  }
}

// ── OverlayBoundary ──────────────────────────────────────────────
// Fängt Fehler in Bottom Sheets, Modals, Overlays.
// Schließt das Overlay sanft statt zu crashen.
export class OverlayBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    sentryCapture(normalizeError(error), { boundary: 'OverlayBoundary' });
    // Auto-close nach 1.5s wenn onClose vorhanden
    if (this.props.onClose) {
      setTimeout(() => this.props.onClose(), 1500);
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: 200, padding: 24, gap: 10,
      }}>
        <div style={{ fontSize: 24 }}>○</div>
        <div style={{ fontSize: 14, color: C.muted, textAlign: 'center' }}>
          Inhalt konnte nicht geladen werden
        </div>
        {this.props.onClose && (
          <button
            onClick={this.props.onClose}
            style={{ padding: '8px 18px', background: 'none',
              border: `1px solid ${C.border}`, borderRadius: 10,
              color: C.muted, fontSize: 13, cursor: 'pointer' }}>
            Schließen
          </button>
        )}
      </div>
    );
  }
}

// ── withBoundary HOC ─────────────────────────────────────────────
// Wraps eine Komponente in eine RouteBoundary.
// Usage: export default withBoundary(MyPage, 'MyPage')
export function withBoundary(Component, name, fallbackTitle) {
  return function BoundedComponent(props) {
    return (
      <RouteBoundary name={name} fallbackTitle={fallbackTitle}>
        <Component {...props} />
      </RouteBoundary>
    );
  };
}
