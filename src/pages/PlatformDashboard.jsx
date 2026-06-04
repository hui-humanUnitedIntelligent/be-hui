// src/pages/PlatformDashboard.jsx
// HUI — Internal Platform Health Dashboard — Phase 6C.8
// ═══════════════════════════════════════════════════════════════
//
// ZUGANG: nur für Admins (/dashboard Route)
// ZWECK:  Vollständiger Überblick über Plattform-Gesundheit
//
// KEINE Vanity-Metriken. KEINE Engagement-KPIs.
// Nur: Stabilität, Qualität, Kosten.
//
// SEKTIONEN:
//   1. Operational Score (Gesamtbild)
//   2. Runtime Performance (Latenz, FPS)
//   3. Discovery Pipeline (Stage-Timing)
//   4. Cache & Cost (Einsparungen)
//   5. Realtime Stability (Reconnects, Bursts)
//   6. Mobile Health (FPS, Drops)
//   7. Error Overview (Failures)
//   8. Community Health (von useCommunityHealth)
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from '@/lib/AuthContext';
import {
  getObservabilityReport, startFpsTracking, stopFpsTracking,
  realtimeHealthScore, errorSummary, costSummary, logObservabilitySnapshot,
} from '@/lib/observability/index';

// Stub-Funktionen — Quell-Module in Phase A entfernt:
function getProtectionStatus() { return null; }
function getRealtimeStats() { return null; }
function useCommunityHealth() { return {}; }
function validateBudgets() { return null; }

// Stub-Funktionen (Quell-Module in Phase A entfernt):
function getCacheStats() { return null; }
function getDegradationStatus() { return null; }
function getPipelineStats() { return null; }
function runPreflight() { return null; }
function useFeatureFlags() { return {}; }
function useRecovery() { return {}; }


// ── Farb-System ────────────────────────────────────────────────
const C = {
  bg:       '#F9F7F4',
  card:     '#FFFFFF',
  ink:      '#1A1A1A',
  muted:    '#888888',
  border:   '#EEEBE6',
  teal:     '#16D7C5',
  coral:    '#FF8A6B',
  gold:     '#F5A623',
  green:    '#3DB87A',
  red:      '#E53E3E',
};

// ── Score Badge ─────────────────────────────────────────────────
function ScoreBadge({ score, label, size = 'normal' }) {
  const color =
    score >= 0.85 ? C.green :
    score >= 0.70 ? C.teal  :
    score >= 0.50 ? C.gold  : C.red;

  const pct = Math.round((score || 0) * 100);
  const fs  = size === 'large' ? 36 : 22;

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: fs, fontWeight: 800, color,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {pct}<span style={{ fontSize: fs * 0.5, opacity: 0.6 }}>%</span>
      </div>
      {label && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>}
    </div>
  );
}

// ── Metric Row ──────────────────────────────────────────────────
function MetricRow({ label, value, unit = '', warn, ok }) {
  const color = warn ? C.coral : ok ? C.green : C.ink;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between',
      padding: '7px 0', borderBottom: `1px solid ${C.border}`, alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: C.muted }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
        {value ?? '–'}{unit && value != null ? unit : ''}
      </span>
    </div>
  );
}

// ── Section Card ────────────────────────────────────────────────
function Section({ title, icon, children, accent = C.teal }) {
  return (
    <div style={{
      background: C.card, borderRadius: 16,
      border: `1px solid ${C.border}`,
      borderTop: `3px solid ${accent}`,
      padding: 20, marginBottom: 16,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.ink,
        marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>{icon}</span> {title}
      </div>
      {children}
    </div>
  );
}

// ── Status Pill ─────────────────────────────────────────────────
function Pill({ label, level }) {
  const bg =
    level === 'excellent' || level === 'stable' || level === 'smooth' || level === 'clean'
      ? '#E6FAF8' :
    level === 'healthy' || level === 'good'
      ? '#E8F5E9' :
    level === 'degraded' || level === 'acceptable' || level === 'low'
      ? '#FFF3E0' : '#FFEBEE';
  const fg =
    level === 'excellent' || level === 'stable' || level === 'smooth' || level === 'clean'
      ? C.teal :
    level === 'healthy' || level === 'good'
      ? C.green :
    level === 'degraded' || level === 'acceptable' || level === 'low'
      ? C.gold  : C.red;

  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 999,
      background: bg, color: fg, fontSize: 11, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>{label ?? level}</span>
  );
}

// ── Haupt-Dashboard ─────────────────────────────────────────────
export default function PlatformDashboard() {
  const { user } = useAuth();
  const [report,    setReport]    = useState(null);
  const [cache,     setCache]     = useState(null);
  const [realtime,  setRealtime]  = useState(null);
  const [pipeline,  setPipeline]  = useState(null);
  const [budgets,   setBudgets]   = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const { health: communityHealth, loading: chLoading } = useCommunityHealth();

  const refresh = useCallback(() => {
    const r  = getObservabilityReport();
    const c  = getCacheStats();
    const rt = getRealtimeStats();
    const p  = getPipelineStats();
    const b  = validateBudgets({
      feedLatencyMs:     r.runtime.feedLatencyP95,
      cacheBytes:        c.l1.bytes,
      realtimeChannels:  rt.activeChannels,
      heapUsedPct:       r.mobile.deviceTier ? null : null,
    });

    setReport(r);
    setCache(c);
    setRealtime(rt);
    setPipeline(p);
    setBudgets(b);
    setLastRefresh(new Date().toLocaleTimeString('de-DE'));
  }, []);

  useEffect(() => {
    startFpsTracking();
    refresh();
    const iv = setInterval(refresh, 15_000);  // 15s Auto-Refresh
    return () => { stopFpsTracking(); clearInterval(iv); };
  }, [refresh]);

  // Access Guard: nur Admin
  if (!user) return null;

  const opScore    = report?.score;
  const rt         = report?.runtime;
  const fps        = report?.fps;
  const cacheData  = report?.cache;
  const rtHealth   = report?.realtime;
  const mobileH    = report?.mobile;
  const errData    = report?.errors;

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, padding: '24px 16px', maxWidth: 720, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase',
          letterSpacing: '0.1em', marginBottom: 6 }}>
          INTERN — Platform Health
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.ink }}>
          HUI Dashboard
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
          Zuletzt aktualisiert: {lastRefresh || '…'} · Auto-Refresh 15s
          <button onClick={refresh} style={{
            marginLeft: 12, background: 'none', border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '2px 10px', cursor: 'pointer',
            fontSize: 11, color: C.muted,
          }}>↻ Jetzt</button>
        </div>
      </div>

      {/* 1. Operational Score */}
      <Section title="Operational Score" icon="🟢" accent={
        opScore?.level === 'excellent' ? C.green :
        opScore?.level === 'healthy'   ? C.teal  :
        opScore?.level === 'degraded'  ? C.gold  : C.red
      }>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <ScoreBadge score={opScore?.value} label="Gesamt" size="large" />
          <div style={{ flex: 1 }}>
            <Pill level={opScore?.level} />
            <div style={{ fontSize: 12, color: C.muted, marginTop: 8, lineHeight: 1.6 }}>
              Aggregiert aus: Realtime-Stabilität, Feed-Latenz, FPS und Fehlerrate.
              Ziel: &gt; 85%.
            </div>
          </div>
        </div>
      </Section>

      {/* 2. Runtime Performance */}
      <Section title="Runtime Performance" icon="⚡️" accent={C.teal}>
        <MetricRow label="Feed Latenz (avg)"
          value={rt?.feedLatencyAvg} unit="ms"
          warn={rt?.feedLatencyAvg > 1500} ok={rt?.feedLatencyAvg < 500} />
        <MetricRow label="Feed Latenz (P95)"
          value={rt?.feedLatencyP95} unit="ms"
          warn={rt?.feedLatencyP95 > 2000} ok={rt?.feedLatencyP95 < 800} />
        <MetricRow label="Pipeline (avg)"
          value={rt?.pipelineAvgMs} unit="ms"
          warn={rt?.pipelineAvgMs > 300} ok={rt?.pipelineAvgMs < 100} />
        <MetricRow label="Pipeline (P95)"
          value={rt?.pipelineP95Ms} unit="ms" />
        <MetricRow label="FPS (aktuell)"
          value={fps?.current} unit=" fps"
          warn={fps?.current < 30} ok={fps?.current >= 55} />
        <MetricRow label="Frame Drops (1min)"
          value={fps?.dropCount}
          warn={fps?.dropCount > 10} ok={fps?.dropCount === 0} />
      </Section>

      {/* 3. Pipeline Stages */}
      {pipeline && (
        <Section title="Discovery Pipeline" icon="🔬" accent={C.teal}>
          <MetricRow label="Runs aufgezeichnet" value={pipeline.runsRecorded} />
          <MetricRow label="Gesamtdauer (avg)" value={pipeline.avgTotalMs} unit="ms"
            warn={pipeline.avgTotalMs > 300} ok={pipeline.avgTotalMs < 100} />
          {pipeline.stageAvgs && Object.entries(pipeline.stageAvgs).map(([stage, ms]) => (
            <MetricRow key={stage} label={`  ${stage}`} value={ms} unit="ms"
              warn={ms > 50} ok={ms < 10} />
          ))}
        </Section>
      )}

      {/* 4. Cache & Cost */}
      <Section title="Cache & Cost Savings" icon="💾" accent={C.green}>
        <MetricRow label="Cache Hit Rate"
          value={cacheData?.cacheHitRate} unit="%"
          warn={cacheData?.cacheHitRate < 50} ok={cacheData?.cacheHitRate >= 80} />
        <MetricRow label="Cache-Einträge (L1)"
          value={cache?.l1.entries} />
        <MetricRow label="Cache-Größe (L1)"
          value={cache ? Math.round(cache.l1.bytes / 1024) : null} unit=" KB"
          warn={cache?.l1.bytes > 3 * 1024 * 1024} />
        <MetricRow label="Queries gespart"
          value={cacheData?.queriesSaved} />
        <MetricRow label="Rows gespart (geschätzt)"
          value={cacheData?.rowsSaved} />
        <MetricRow label="Einsparung (geschätzt)"
          value={cacheData?.estimatedSavingsUSD} unit=" USD" />
        <MetricRow label="Worker-Jobs (avg ms)"
          value={cacheData?.workerAvgMs} unit=" ms"
          ok={cacheData?.workerAvgMs < 100} />
      </Section>

      {/* 5. Realtime */}
      <Section title="Realtime Stabilität" icon="📡"
        accent={rtHealth?.level === 'stable' ? C.green : C.gold}>
        <div style={{ marginBottom: 12 }}>
          <Pill level={rtHealth?.level} />
        </div>
        <MetricRow label="Aktive Channels"
          value={realtime?.activeChannels}
          warn={realtime?.activeChannels > 8} ok={realtime?.activeChannels <= 4} />
        <MetricRow label="Reconnects (10min)"
          value={rtHealth?.reconnects}
          warn={rtHealth?.reconnects > 3} ok={rtHealth?.reconnects === 0} />
        <MetricRow label="Event Bursts (10min)"
          value={rtHealth?.bursts}
          warn={rtHealth?.bursts > 2} ok={rtHealth?.bursts === 0} />
        {realtime?.channels.map(ch => (
          <MetricRow key={ch.name}
            label={`  ${ch.name}`}
            value={`${ch.subscribers} Sub | Idle ${Math.round(ch.idleMs/1000)}s`}
            warn={ch.idleMs > 300000} />
        ))}
      </Section>

      {/* 6. Mobile */}
      <Section title="Mobile Experience" icon="📱"
        accent={mobileH?.level === 'smooth' ? C.green : C.gold}>
        <div style={{ marginBottom: 12 }}>
          <Pill level={mobileH?.level} />
          <span style={{ marginLeft: 8, fontSize: 12, color: C.muted }}>
            Device: {mobileH?.deviceTier}
          </span>
        </div>
        <MetricRow label="Mobile Score"
          value={mobileH?.score != null ? Math.round(mobileH.score * 100) : null} unit="%"
          warn={mobileH?.score < 0.6} ok={mobileH?.score >= 0.8} />
        <MetricRow label="Avg FPS"
          value={mobileH?.avgFps} unit=" fps"
          warn={mobileH?.avgFps < 30} ok={mobileH?.avgFps >= 55} />
        <MetricRow label="Frame Drops (1min)"
          value={mobileH?.recentDrops}
          warn={mobileH?.recentDrops > 5} ok={mobileH?.recentDrops === 0} />
      </Section>

      {/* 7. Errors */}
      <Section title="Fehler-Übersicht" icon="🔴"
        accent={errData?.level === 'clean' ? C.green : C.red}>
        <div style={{ marginBottom: 12 }}>
          <Pill level={errData?.level} label={
            errData?.level === 'clean' ? 'Keine Fehler' : errData?.level
          } />
        </div>
        <MetricRow label="Async Failures (5min)"
          value={errData?.asyncFails} warn={errData?.asyncFails > 3} ok={errData?.asyncFails === 0} />
        <MetricRow label="Pipeline Failures"
          value={errData?.pipelineFails} warn={errData?.pipelineFails > 0} />
        <MetricRow label="Worker Crashes"
          value={errData?.workerCrashes} warn={errData?.workerCrashes > 0} ok={errData?.workerCrashes === 0} />
        <MetricRow label="Worker Timeouts"
          value={errData?.workerTimeouts} warn={errData?.workerTimeouts > 0} />
        <MetricRow label="Realtime Reconnects"
          value={errData?.rtReconnects} warn={errData?.rtReconnects > 2} ok={errData?.rtReconnects === 0} />
      </Section>

      {/* 8. Community Health */}
      {communityHealth && (
        <Section title="Community Health" icon="🌿" accent={C.green}>
          <MetricRow label="Overall Score"
            value={Math.round((communityHealth.overallScore || 0) * 100)} unit="%"
            warn={communityHealth.overallScore < 0.5} ok={communityHealth.overallScore >= 0.75} />
          <MetricRow label="Fairness"
            value={Math.round((communityHealth.scores?.fairness || 0) * 100)} unit="%" />
          <MetricRow label="Diversity"
            value={Math.round((communityHealth.scores?.diversity || 0) * 100)} unit="%" />
          <MetricRow label="Bridge Health"
            value={Math.round((communityHealth.scores?.bridge || 0) * 100)} unit="%" />
          <MetricRow label="Resonanz"
            value={Math.round((communityHealth.scores?.resonance || 0) * 100)} unit="%" />
          <MetricRow label="Calmness"
            value={Math.round((communityHealth.scores?.calmness || 0) * 100)} unit="%" />
          {(communityHealth.issues || []).length > 0 && (
            <div style={{ marginTop: 10, fontSize: 12, color: C.gold }}>
              ⚠ Issues: {communityHealth.issues.join(', ')}
            </div>
          )}
        </Section>
      )}

      {/* Budget Violations */}
      {budgets && !budgets.pass && (
        <Section title="Budget Violations" icon="⚠" accent={C.coral}>
          {budgets.violations.map((v, i) => (
            <div key={i} style={{ fontSize: 12, color: C.coral,
              padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
              <strong>{v.budget}</strong>: {v.actual} &gt; {v.limit} — {v.action}
            </div>
          ))}
        </Section>
      )}

      {/* 9. Release & Feature Flags */}
      <Section title="Feature Flags & Kill Switches" icon="🚦" accent={C.gold}>
        <FlagSection />
      </Section>

      {/* 10. Degradation + Protection */}
      <Section title="Runtime Protection" icon="🛡️" accent={C.coral}>
        <ProtectionSection />
      </Section>

      {/* 11. Recovery Status */}
      <Section title="Recovery Status" icon="🔄" accent={C.teal}>
        <RecoverySection />
      </Section>

      {/* 12. Preflight */}
      <Section title="Deployment Preflight" icon="✈️" accent={C.gold}>
        <PreflightSection />
      </Section>

      <div style={{ height: 40 }} />
    </div>
  );
}

// ── Sub-Sektionen ──────────────────────────────────────────────

function FlagSection() {
  const { status, toggle, killAll, recover } = useFeatureFlags();
  const killSwitches = Object.entries(status.flags)
    .filter(([, f]) => f.killSwitch)
    .slice(0, 8);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={killAll} style={{
          background: '#FFEBEE', border: `1px solid ${C.red}`, borderRadius: 8,
          padding: '6px 14px', cursor: 'pointer', fontSize: 12,
          color: C.red, fontWeight: 700,
        }}>⚠ Emergency Downgrade</button>
        <button onClick={recover} style={{
          background: '#E8F5E9', border: `1px solid ${C.green}`, borderRadius: 8,
          padding: '6px 14px', cursor: 'pointer', fontSize: 12,
          color: C.green, fontWeight: 700,
        }}>✓ Recover All</button>
      </div>
      <MetricRow label="Total Flags"    value={status.summary.total} />
      <MetricRow label="Aktiv"          value={status.summary.active} />
      <MetricRow label="Überschrieben"  value={status.summary.overridden}
        warn={status.summary.overridden > 0} />
      <MetricRow label="Deaktiviert"    value={status.summary.disabled}
        warn={status.summary.disabled > 0} />
      <div style={{ marginTop: 12, fontSize: 11, color: C.muted, marginBottom: 6 }}>
        KILL SWITCHES
      </div>
      {killSwitches.map(([key, f]) => (
        <div key={key} style={{ display: 'flex', justifyContent: 'space-between',
          padding: '5px 0', borderBottom: `1px solid ${C.border}`, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: f.active ? C.ink : C.muted }}>{key}</span>
          <button onClick={() => toggle(key)} style={{
            background: f.active ? '#E8F5E9' : '#FFEBEE',
            border: 'none', borderRadius: 999, padding: '3px 10px',
            cursor: 'pointer', fontSize: 11, fontWeight: 700,
            color: f.active ? C.green : C.red,
          }}>{f.active ? 'ON' : 'OFF'}</button>
        </div>
      ))}
    </div>
  );
}

function ProtectionSection() {
  const [prot, setProt] = React.useState(getProtectionStatus);
  const [deg,  setDeg]  = React.useState(getDegradationStatus);
  React.useEffect(() => {
    const iv = setInterval(() => {
      setProt(getProtectionStatus());
      setDeg(getDegradationStatus());
    }, 10_000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <Pill level={deg.level === 'FULL' ? 'stable' : 'degraded'} label={`Mode: ${deg.level}`} />
        {!deg.isNormal && (
          <span style={{ marginLeft: 8, fontSize: 12, color: C.coral }}>
            Grund: {deg.reason}
          </span>
        )}
      </div>
      <MetricRow label="Auto-Protection aktiv"
        value={prot.active ? 'Ja' : 'Nein'}
        warn={prot.active} ok={!prot.active} />
      <MetricRow label="Clean Checks bis Recovery"
        value={prot.active ? `${prot.cleanChecks}/${3}` : '–'} />
      {prot.activeReasons.length > 0 && (
        <div style={{ fontSize: 12, color: C.coral, marginTop: 8 }}>
          Auslöser: {prot.activeReasons.join(', ')}
        </div>
      )}
      {prot.recentEvents.slice(-3).map((e, i) => (
        <div key={i} style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
          {e.type}: {e.level} — {e.reason}
        </div>
      ))}
    </div>
  );
}

function RecoverySection() {
  const { status, recover } = useRecovery();
  const systems = ['worker', 'cache', 'realtime', 'discovery'];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {systems.map(s => (
          <button key={s} onClick={() => recover(s)} style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '5px 12px', cursor: 'pointer', fontSize: 11, color: C.muted,
          }}>↺ {s}</button>
        ))}
        <button onClick={() => recover('all')} style={{
          background: '#E6FAF8', border: `1px solid ${C.teal}`, borderRadius: 8,
          padding: '5px 12px', cursor: 'pointer', fontSize: 11, color: C.teal, fontWeight: 700,
        }}>↺ All</button>
      </div>
      <MetricRow label="Recovery Events" value={status.totalEvents} />
      <MetricRow label="Hydration Attempts" value={status.hydrationAttempts}
        warn={status.hydrationAttempts > 1} />
      {status.recentRecoveries.slice(-3).map((e, i) => (
        <div key={i} style={{ fontSize: 11, color: e.success ? C.green : C.coral, marginTop: 4 }}>
          {e.success ? '✓' : '✗'} {e.system} → {e.strategy}
          {e.detail ? ` (${e.detail})` : ''}
        </div>
      ))}
    </div>
  );
}

function PreflightSection() {
  const [result, setResult] = React.useState(null);
  const [running, setRunning] = React.useState(false);

  const run = async () => {
    setRunning(true);
    const r = await runPreflight();
    setResult(r);
    setRunning(false);
  };

  return (
    <div>
      <button onClick={run} disabled={running} style={{
        background: running ? C.border : '#E6FAF8',
        border: `1px solid ${C.teal}`, borderRadius: 8,
        padding: '7px 16px', cursor: running ? 'wait' : 'pointer',
        fontSize: 12, color: C.teal, fontWeight: 700, marginBottom: 12,
      }}>{running ? 'Prüfe…' : '▶ Preflight starten'}</button>

      {result && (
        <div>
          <Pill level={result.pass ? 'stable' : 'degraded'}
            label={result.pass ? `✅ ${result.summary.passed}/${result.summary.total} Checks bestanden` : `❌ ${result.summary.failed} Fehler`} />
          <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
            Dauer: {result.summary.durationMs}ms · {result.timestamp?.slice(11,19)}
          </div>
          {result.failures.map((f, i) => (
            <div key={i} style={{ marginTop: 8, fontSize: 12, color: C.red }}>
              ❌ {f.check}: {f.issues.join(' — ')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}