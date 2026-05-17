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

const C = {
  cream: '#F9F6F2', card: '#FFFFFF',
  teal: '#16D7C5', coral: '#FF8A6B',
  ink: '#1A1A1A', muted: '#888',
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
    const appErr = normalizeError(error, {
      componentStack: errorInfo?.componentStack?.slice(0, 500),
      lastFeedComponent: window.__HUI_LAST_FEED_COMPONENT__,
      retryCount: this.state.retryCount,
    });
    sentryCapture(appErr, { boundary: 'GlobalAppBoundary' });
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
        <div style={{ fontSize: 20, fontWeight: 800, color: C.ink, marginBottom: 8, textAlign: 'center' }}>
          {isFatal ? 'HUI muss neu gestartet werden' : 'Etwas ist schiefgelaufen'}
        </div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 28, textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
          {appErr.toUserMessage?.() || 'Ein unerwarteter Fehler ist aufgetreten.'}
        </div>
        {isFatal ? (
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '12px 28px', background: C.teal, border: 'none',
              borderRadius: 14, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            App neu starten
          </button>
        ) : (
          <button
            onClick={this.handleRetry}
            style={{ padding: '12px 28px', background: C.teal, border: 'none',
              borderRadius: 14, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Erneut versuchen
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
        <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>
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
