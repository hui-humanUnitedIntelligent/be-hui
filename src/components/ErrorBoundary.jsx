// src/components/ErrorBoundary.jsx
// ══════════════════════════════════════════════════════════════
// HUI Global Error Boundary
// Fängt JS-Fehler in Component-Trees auf.
// Zeigt Retry-UI statt weißem Bildschirm.
// Kein visuelles Redesign — HUI-Ästhetik bleibt erhalten.
// ══════════════════════════════════════════════════════════════

import React from 'react';

const C = {
  teal: '#16D7C5', coral: '#FF8A6B',
  cream: '#F9F6F2', ink: '#1A1A1A', muted: '#888',
  border: 'rgba(0,0,0,0.07)',
};

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log to console (replace with Sentry/LogRocket in production)
    console.error('[HUI ErrorBoundary]', error, errorInfo);
  }

  reset() {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { fallback, inline, label } = this.props;

    // Custom fallback provided
    if (fallback) return fallback;

    // Inline error (for small sections)
    if (inline) {
      return (
        <div style={{
          padding: '16px', borderRadius: 12, textAlign: 'center',
          background: `rgba(255,138,107,0.08)`,
          border: `1px solid ${C.coral}22`,
          margin: '8px 0',
        }}>
          <div style={{ fontSize: 18, marginBottom: 6 }}>⚠️</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
            {label || 'Dieser Bereich konnte nicht geladen werden.'}
          </div>
          <button
            onClick={() => this.reset()}
            style={{
              padding: '6px 16px', borderRadius: 999,
              background: C.teal, border: 'none',
              color: 'white', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
            Erneut versuchen
          </button>
        </div>
      );
    }

    // Full-page error
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg,#E6FAF8 0%,#FFF9F4 100%)`,
        padding: 32, fontFamily: "-apple-system,'SF Pro Display',system-ui,sans-serif",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, marginBottom: 8 }}>
          Etwas ist schiefgelaufen
        </div>
        <div style={{
          fontSize: 13, color: C.muted, textAlign: 'center',
          maxWidth: 280, lineHeight: 1.65, marginBottom: 28,
        }}>
          HUI konnte diesen Bereich nicht laden. Das passiert manchmal kurz —
          einfach nochmal versuchen.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => this.reset()}
            style={{
              padding: '13px 28px', borderRadius: 16,
              background: `linear-gradient(135deg,${C.teal},${C.coral})`,
              border: 'none', color: 'white', fontWeight: 800,
              fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: `0 4px 18px rgba(22,215,197,0.3)`,
            }}>
            Erneut versuchen
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '13px 24px', borderRadius: 16,
              background: 'none', border: `1.5px solid ${C.border}`,
              color: C.muted, fontWeight: 600, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
            Neu laden
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && this.state.error && (
          <details style={{ marginTop: 24, maxWidth: 400, width: '100%' }}>
            <summary style={{ fontSize: 11, color: C.muted, cursor: 'pointer' }}>
              Dev: Fehler-Details
            </summary>
            <pre style={{
              fontSize: 10, color: C.muted, background: 'rgba(0,0,0,0.04)',
              padding: 12, borderRadius: 8, overflow: 'auto', marginTop: 8,
            }}>
              {this.state.error.toString()}
              {'\n\n'}
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
        )}
      </div>
    );
  }
}

// ── withErrorBoundary HOC ─────────────────────────────────────
export function withErrorBoundary(Component, options = {}) {
  return function WrappedWithErrorBoundary(props) {
    return (
      <ErrorBoundary {...options}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
