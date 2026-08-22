// ══════════════════════════════════════════════════════════════════════════════
// web-main.jsx — HUI Web Entry Point (Desktop V3)
// ══════════════════════════════════════════════════════════════════════════════
//
// v2.5: ErrorBoundary hinzugefügt — verhindert White-Screen bei Komponenten-Crash.
// v2.4: desktopV3.css nach AuthenticatedApp verschoben.
// Öffentliche Landingpage lädt nur index.css + web.css + landing.css.
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from './WebApp.jsx';

// ── Styles (Public-only) ─────────────────────────────────────────────────────
import './index.css';                       // Shared Design System (Tailwind, CSS Variables, Fonts)
import './web.css';                         // Web-spezifische Styles (Root Reset, Loading Screen)
import './landing.css';                     // Landing Page Styles (nur Public)
// desktopV3.css → jetzt in AuthenticatedApp.jsx (lazy nach Login)

// ── Sentry ────────────────────────────────────────────────────────────────────
import { initSentry, sentryCapture } from './lib/sentry.js';

initSentry();

// KEYBOARD-PUSH-UP (2026-08-15): Globales Keyboard-Handling auch für Web/Mobile-Web
import { initGlobalKeyboardHandling } from "./lib/globalKeyboardHandler.js";
initGlobalKeyboardHandling();

// ── Global Error Handlers ───────────────────────────────────────────────────
window.addEventListener('unhandledrejection', (event) => {
  const err = event.reason instanceof Error
    ? event.reason
    : new Error(String(event.reason ?? 'Unhandled rejection'));
  sentryCapture(err, { source: 'unhandledrejection', href: window.location.href });
});

window.addEventListener('error', (event) => {
  if (!event.error) return;
  sentryCapture(event.error, { source: 'window.onerror', href: window.location.href });
});

// ── ErrorBoundary (v2.5) ──────────────────────────────────────────────────────
// Verhindert White-Screen bei Komponenten-Crash im Web-Entry.
// Zeigt Recovery-UI statt leerer Seite.
class WebErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    sentryCapture(error, { source: 'WebErrorBoundary', componentStack: errorInfo?.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', {
        style: {
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '40px 20px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          color: '#141422',
          background: '#FAF8F5',
        }
      },
        React.createElement('div', {
          style: { fontSize: '48px', marginBottom: '8px' }
        }, '⚠️'),
        React.createElement('h2', {
          style: { fontSize: '20px', fontWeight: 600, margin: 0 }
        }, 'Etwas ist schiefgelaufen'),
        React.createElement('p', {
          style: { fontSize: '14px', color: '#8A8A9E', margin: 0, textAlign: 'center', maxWidth: '400px' }
        }, String(this.state.error?.message || 'Unbekannter Fehler')),
        React.createElement('button', {
          onClick: () => window.location.reload(),
          style: {
            marginTop: '12px',
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            background: '#0DC4B5',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }
        }, 'Seite neu laden')
      );
    }
    return this.props.children;
  }
}

// ── Render ────────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('web-root')).render(
  <React.StrictMode>
    <WebErrorBoundary>
      <WebApp />
    </WebErrorBoundary>
  </React.StrictMode>
);
