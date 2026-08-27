// src/lib/ErrorReportToast.jsx
// HUI — Visible Error Toast Component
// ═══════════════════════════════════════════════════════════════
// Zeigt Fehler LIVE im UI an — nicht nur im Sentry-Hintergrund.
// Wird in WebApp.jsx (und App.jsx) EINMAL gerendert.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { HUI } from '../design/hui.design.js';

const C = {
  teal: HUI.COLOR.tealStudio || '#0DC4B5',
  coral: HUI.COLOR.coralStudio || '#FF6F61',
  ink: HUI.COLOR.inkStudio || '#1a1a1a',
  muted: '#888',
  border: 'rgba(0,0,0,0.10)',
  cardBg: HUI.COLOR.white || '#ffffff',
  danger: '#d32f2f',
  warning: '#f59e0b',
};

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 10000;

function PriorityBadge({ priority }) {
  const colors = {
    CRITICAL: { bg: '#d32f2f15', text: '#d32f2f' },
    HIGH: { bg: '#f59e0b15', text: '#f59e0b' },
    MEDIUM: { bg: '#3b82f615', text: '#3b82f6' },
    LOW: { bg: '#88888815', text: '#888' },
  };
  const c = colors[priority] || colors.LOW;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
      padding: '1px 6px', borderRadius: 4,
      background: c.bg, color: c.text, textTransform: 'uppercase',
    }}>
      {priority || 'LOW'}
    </span>
  );
}

function ErrorToastItem({ report, onDismiss }) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (expanded) return;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS * 100));
      setProgress(remaining);
      if (remaining <= 0) {
        setDismissed(true);
        setTimeout(onDismiss, 200);
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [expanded, onDismiss]);

  if (dismissed) return null;

  const isError = report.errorType === 'js_error' || report.errorType === 'white_screen';
  const accentColor = report.priority === 'CRITICAL' ? C.danger :
                      report.priority === 'HIGH' ? C.warning :
                      report.errorType === 'chunk_load_error' ? C.warning : C.coral;

  return (
    <div style={{
      background: C.cardBg, borderRadius: 12,
      border: `1px solid ${C.border}`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      overflow: 'hidden', maxWidth: 380, width: '100%',
      opacity: dismissed ? 0 : 1,
      transform: dismissed ? 'translateX(20px)' : 'translateX(0)',
      transition: 'all 200ms ease',
    }}>
      {!expanded && (
        <div style={{ height: 2, background: 'rgba(0,0,0,0.06)' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: accentColor, transition: 'width 50ms linear',
          }} />
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 28, height: 28, flexShrink: 0, borderRadius: 8,
          background: `${accentColor}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: accentColor,
        }}>
          {report.errorType === 'white_screen' ? '✦' : '!'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.ink, lineHeight: 1.3 }}>
              {report.errorCode}
            </span>
            <PriorityBadge priority={report.priority} />
          </div>
          <div style={{
            fontSize: 12, color: C.muted, lineHeight: 1.4,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: expanded ? 'unset' : 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {report.message || 'Unbekannter Fehler'}
          </div>
          {report.knownCause?.matched && (
            <div style={{ fontSize: 10, color: accentColor, marginTop: 3, fontWeight: 500 }}>
              {report.knownCause.label}
            </div>
          )}
        </div>

        <button
          onClick={() => { setDismissed(true); setTimeout(onDismiss, 200); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.muted, fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0,
          }}
        >×</button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{
          padding: '0 14px 10px 14px',
          borderTop: `1px solid ${C.border}`,
          marginTop: 0, paddingTop: 8,
        }}>
          {report.filename && (
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>
              @{report.filename}:{report.lineno || 0}:{report.colno || 0}
            </div>
          )}
          {report.route && (
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>
              Route: {report.route}
            </div>
          )}
          {report.deviceModel && (
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>
              Device: {report.deviceModel} / {report.osVersion} / {report.browserVersion}
            </div>
          )}
          {report.stack && (
            <pre style={{
              background: '#f8f8f8', padding: 8, borderRadius: 6,
              fontSize: 10, lineHeight: 1.5, color: '#555',
              overflow: 'auto', maxHeight: 120,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
            }}>{report.stack.substring(0, 800)}</pre>
          )}
          {report.reoccurred && (
            <div style={{
              fontSize: 11, color: C.danger, marginTop: 6,
              padding: '4px 8px', background: `${C.danger}10`, borderRadius: 6,
            }}>
              ⚠ Fehler ist erneut aufgetreten! Lösung: {report.previousSolution || 'keine dokumentiert'}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ padding: '0 14px 10px 14px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            background: 'none', border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '4px 10px', fontSize: 11,
            color: C.muted, cursor: 'pointer', fontWeight: 500,
          }}
        >{expanded ? 'Weniger' : 'Details'}</button>
        {expanded && (
          <button
            onClick={() => window.location.reload()}
            style={{
              background: `${C.teal}15`, border: `1px solid ${C.teal}40`,
              borderRadius: 8, padding: '4px 10px', fontSize: 11,
              color: C.teal, cursor: 'pointer', fontWeight: 600, marginLeft: 'auto',
            }}
          >Neu laden</button>
        )}
      </div>
    </div>
  );
}

export default function ErrorReportToast() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    // Listen for custom events from errorReporter
    const handleReport = (event) => {
      const report = event.detail;
      setReports(prev => [...prev.slice(-(MAX_VISIBLE - 1)), report]);
    };

    window.addEventListener('hui:error-report', handleReport);
    return () => window.removeEventListener('hui:error-report', handleReport);
  }, []);

  const handleDismiss = useCallback((id) => {
    setReports(prev => prev.filter(r => r.id !== id));
  }, []);

  if (reports.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16,
      display: 'flex', flexDirection: 'column', gap: 8,
      zIndex: 100000, maxWidth: 'calc(100vw - 32px)',
    }}>
      {reports.map(r => (
        <ErrorToastItem key={r.id} report={r} onDismiss={() => handleDismiss(r.id)} />
      ))}
    </div>
  );
}
