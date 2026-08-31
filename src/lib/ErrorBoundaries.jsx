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
import { useTranslation } from "../hooks/useTranslation.js";
import { t as i18nT, detectSystemLang } from "../i18n/index.js";

const C = {
  cream: '#F9F6F2', card: HUI.COLOR.white,
  teal: HUI.COLOR.tealStudio, coral: HUI.COLOR.coralStudio,
  ink: HUI.COLOR.inkStudio, muted: '#888',
  border: 'rgba(0,0,0,0.07)',
};

// ── Functional sub-components for ErrorBoundary (class can't use hooks) ──
function GlobalAppFallback({ isFatal, retryCount, onRetry }) {
  const { t } = useTranslation();
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
        {isFatal ? t("error.fatalTitle") : t("error.errorTitle")}
      </div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 28, textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
        {t("error.unexpectedError")}
      </div>
      {isFatal ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '12px 28px', background: C.teal, border: 'none',
              borderRadius: 14, color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            {t("error.restartApp")}
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
            {t("error.clearCacheReload")}
          </button>
        </div>
      ) : (
        <button
          onClick={onRetry}
          style={{ padding: '12px 28px', background: C.teal, border: 'none',
            borderRadius: 14, color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          {t("error.retryCount", { count: retryCount })}
        </button>
      )}
    </div>
  );
}

function RouteFallback({ fallbackTitle, onRetry, errorMsg, errorStack }) {
  const { t } = useTranslation();
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '40vh', padding: 24, gap: 12,
    }}>
      <div style={{ fontSize: 28 }}>○</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>
        {fallbackTitle || t("error.pageLoadFailed")}
      </div>
      {errorMsg && (
        <div style={{
          fontSize: 12, color: 'rgba(26,26,46,0.45)',
          background: 'rgba(232,58,58,0.06)', borderRadius: 8,
          padding: '8px 12px', maxWidth: 400, wordBreak: 'break-word',
          fontFamily: 'monospace', lineHeight: 1.5,
        }}>
          {errorMsg}
        </div>
      )}
      {errorStack && (
        <details style={{ maxWidth: 600, width: '100%' }}>
          <summary style={{ fontSize: 11, color: C.muted, cursor: 'pointer' }}>Stack-Trace anzeigen</summary>
          <pre style={{
            fontSize: 10, color: 'rgba(26,26,46,0.6)',
            background: 'rgba(0,0,0,0.03)', borderRadius: 8,
            padding: '8px 12px', overflow: 'auto', maxHeight: 300,
            fontFamily: 'monospace', lineHeight: 1.4, whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>{errorStack}</pre>
        </details>
      )}
      <button
        onClick={onRetry}
        style={{ padding: '10px 22px', background: `${C.teal}15`,
          border: `1px solid ${C.teal}40`, borderRadius: 12,
          color: C.teal, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
        {t("error.reload")}
      </button>
    </div>
  );
}

function OverlayFallback({ onClose }) {
  const { t } = useTranslation();
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: 200, padding: 24, gap: 10,
    }}>
      <div style={{ fontSize: 24 }}>○</div>
      <div style={{ fontSize: 14, color: C.muted, textAlign: 'center' }}>
        {t("error.contentLoadFailed")}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{ padding: '8px 18px', background: 'none',
            border: `1px solid ${C.border}`, borderRadius: 10,
            color: C.muted, fontSize: 13, cursor: 'pointer' }}>
          {t("error.close")}
        </button>
      )}
    </div>
  );
}

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
        _ov.innerHTML = '<div style="font-size:16px;font-weight:600;color:#333">' + i18nT('error.appUpdating', detectSystemLang()) + '</div><div style="font-size:14px;color:#666">' + i18nT('error.justMoment', detectSystemLang()) + '</div><div style="width:40px;height:40px;border:3px solid #16D7C3;border-top-color:transparent;border-radius:50%;animation:_hui_spin 0.8s linear infinite"></div><style>@keyframes _hui_spin{to{transform:rotate(360deg)}}</style>';
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
    const count = Number(sessionStorage.getItem('_hui_app_crash_retry_count') || 0);
    if (count < 3) {
      sessionStorage.setItem('_hui_app_crash_retry_count', String(count + 1));
      window.location.reload();
    } else {
      // Nach 3 Reloads: nur noch State zurücksetzen, kein weiterer Reload (Loop-Schutz)
      this.setState(s => ({ error: null, retryCount: s.retryCount + 1 }));
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    const appErr = normalizeError(this.state.error);
    const isFatal = appErr.severity === SEVERITY.FATAL || this.state.retryCount >= 3;

    return (
      <GlobalAppFallback
        isFatal={isFatal}
        retryCount={this.state.retryCount}
        onRetry={this.handleRetry}
      />
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
    console.error('[HUI RouteBoundary] CRASH in route:', this.props.name, error?.message, error?.stack);
    sentryCapture(normalizeError(error), {
      boundary: 'RouteBoundary',
      route: this.props.name || 'unknown',
    });
    this.setState({ errorMsg: error?.message || 'Unknown error' });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <RouteFallback
        fallbackTitle={this.props.fallbackTitle}
        errorMsg={this.state.error?.message || ''}
        onRetry={() => window.location.reload()}
      />
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
      <OverlayFallback onClose={this.props.onClose} />
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
