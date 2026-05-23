// src/config/SafeRender.jsx — HUI Safe Render v2 (Phase 16.7.1)
// ═══════════════════════════════════════════════════════════════
// REGEL: Kein stilles null. Jeder Crash ist sichtbar + geloggt.
// SafeBoundary zeigt immer eine minimale Fallback-UI.
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { SAFE_MODE } from './safeMode.js';

/* ── Structured error log ─────────────────────────────────────── */
function logCrash(label, error, info) {
  const ws = window.__HUI_WORLD_STATE__ || {};
  console.error('[HUI FEED CRASH]', {
    component:      label,
    error:          error?.message || String(error),
    stack:          error?.stack?.split('\n').slice(0, 5).join('\n'),
    componentStack: info?.componentStack?.split('\n').slice(0, 6).join('\n'),
    tab:            ws.activeTab          ?? document.querySelector('[data-active-tab]')?.dataset?.activeTab ?? null,
    membershipType: ws.membershipType     ?? null,
    activeSurface:  ws.activeSurface      ?? null,
    repaintPhase:   ws.repaintPhase       ?? null,
    visibilityState:document.visibilityState,
    timestamp:      new Date().toISOString(),
  });
}

/* ── Inline ErrorBoundary ─────────────────────────────────────── */
class SafeBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error) {
    return { crashed: true, error };
  }

  componentDidCatch(error, info) {
    const { label, onError } = this.props;
    logCrash(label || 'Unknown', error, info);
    try { onError?.(error); } catch (_) {}
  }

  handleRetry = () => {
    this.setState(s => ({ crashed: false, error: null, retryCount: s.retryCount + 1 }));
  };

  render() {
    if (!this.state.crashed) return this.props.children;

    const { label, fallback, minimal } = this.props;
    const err = this.state.error;

    // 1. Custom fallback provided by parent
    if (fallback) return fallback;

    // 2. Minimal inline fallback (for rail items, cards)
    if (minimal) {
      return (
        <div style={{
          padding: '12px 16px', borderRadius: 12, margin: '6px 16px',
          background: 'rgba(255,138,107,0.06)',
          border: '1px solid rgba(255,138,107,0.15)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>
              {label || 'Bereich'} konnte nicht geladen werden
            </div>
            <button
              onClick={this.handleRetry}
              style={{
                marginTop: 4, padding: '3px 10px', borderRadius: 99,
                background: 'rgba(22,215,197,0.12)', border: 'none',
                color: '#16D7C5', fontSize: 11, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
              Wiederholen
            </button>
          </div>
        </div>
      );
    }

    // 3. Full feed fallback — shows placeholder cards instead of white screen
    return (
      <div style={{
        padding: '24px 16px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {/* Skeleton cards */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            borderRadius: 18,
            background: 'rgba(0,0,0,0.04)',
            height: i === 0 ? 220 : 140,
            animation: 'hui-skeleton-pulse 1.8s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
        <style>{`
          @keyframes hui-skeleton-pulse {
            0%,100% { opacity:0.5; }
            50%      { opacity:0.9; }
          }
        `}</style>
        {/* Retry button */}
        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
            {label || 'Feed'} konnte nicht geladen werden.
          </div>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '10px 24px', borderRadius: 14,
              background: 'linear-gradient(135deg,#16D7C5,#FF8A6B)',
              border: 'none', color: 'white', fontWeight: 700,
              fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(22,215,197,0.25)',
            }}>
            Erneut versuchen
          </button>
        </div>
        {/* Dev error info */}
        {(typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') && (
          <details style={{ fontSize: 10, color: '#aaa', padding: '0 4px' }}>
            <summary style={{ cursor: 'pointer' }}>Crash: {label}</summary>
            <pre style={{ overflow: 'auto', marginTop: 4 }}>
              {err?.message}{'\n'}{err?.stack?.split('\n').slice(0,8).join('\n')}
            </pre>
          </details>
        )}
      </div>
    );
  }
}

/* ── SafeRender Komponente ────────────────────────────────────── */
export function SafeRender({
  flag, label, children,
  fallback = null,
  minimal = false,
  onError = null,
}) {
  // 1. SAFE_MODE Check — NEVER return null silently, show disabled state
  if (!SAFE_MODE[flag]) {
    // Only log in dev — no console spam in production
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      console.info(`[HUI SafeMode] ${label || flag} deaktiviert`);
    }
    // Return empty non-null node — no white screen, no layout shift
    return <span data-safe-mode-disabled={flag} style={{ display: 'none' }} />;
  }

  // 2. ErrorBoundary Catch — NEVER returns null silently
  return (
    <SafeBoundary
      label={label || flag}
      fallback={fallback}
      minimal={minimal}
      onError={onError}
    >
      {children}
    </SafeBoundary>
  );
}

/* ── useSafeFlag Hook ─────────────────────────────────────────── */
export function useSafeFlag(flag) {
  return !!SAFE_MODE[flag];
}

export default SafeRender;
