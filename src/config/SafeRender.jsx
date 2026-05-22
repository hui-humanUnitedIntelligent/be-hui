// src/config/SafeRender.jsx
// ═══════════════════════════════════════════════════════════════
// HUI SAFE RENDER — Isolation Wrapper mit Debug-Log
//
// Schützt jeden cinematic System-Block mit:
//   1. SAFE_MODE Flag Check
//   2. ErrorBoundary Catch
//   3. console.log/error Debug-Output
//
// Verwendung:
//   <SafeRender flag="orb" label="OrbAtmosphere">
//     <OrbAtmosphere />
//   </SafeRender>
//
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { SAFE_MODE } from './safeMode.js';

/* ── Inline ErrorBoundary ─────────────────────────────────────── */
class SafeBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { crashed: true, error };
  }

  componentDidCatch(error, info) {
    const { label, onError } = this.props;
    try { onError?.(error); } catch (_) {}
    console.error(
      `[HUI Render Debug] ${label} failed`,
      error,
      info?.componentStack?.split('\n').slice(0, 4).join('\n')
    );
  }

  render() {
    if (this.state.crashed) {
      const { label, fallback } = this.props;
      if (fallback) return fallback;
      // Kein UI-Crash — System unsichtbar ausblenden
      return null;
    }
    return this.props.children;
  }
}

/* ── SafeRender Komponente ────────────────────────────────────── */
export function SafeRender({ flag, label, children, fallback = null, onError = null }) {
  // 1. SAFE_MODE Check
  if (!SAFE_MODE[flag]) {
    console.info(`[HUI SafeMode] ${label || flag} deaktiviert (safe mode)`);
    return null;
  }

  // 2. Debug-Log bei Mount
  React.useEffect(() => {
    console.log(`[HUI Render Debug] ${label || flag} mounted`);
    return () => {
      console.log(`[HUI Render Debug] ${label || flag} unmounted`);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. ErrorBoundary Catch
  return (
    <SafeBoundary label={label || flag} fallback={fallback} onError={onError}>
      {children}
    </SafeBoundary>
  );
}

/* ── useSafeFlag Hook — für inline conditionals ───────────────── */
export function useSafeFlag(flag) {
  return !!SAFE_MODE[flag];
}

export default SafeRender;
