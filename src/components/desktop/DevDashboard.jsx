// ══════════════════════════════════════════════════════════════════════════════
// DevDashboard.jsx — Performance Dashboard (Desktop only)
// ══════════════════════════════════════════════════════════════════════════════
//
// Zeigt Daten aus window.__HUI_PERF_STORE__ an.
// Keine neuen Messungen. Keine neuen Queries. Nur Anzeige.
// Wird ausschließlich in DesktopShell gerendert → Mobile bleibt unverändert.
//
// Tabs: Overview · Rendering · Feed · Images · Supabase · Realtime · React · Waterfall · Critical Path
// Export: Report kopieren (Markdown) · JSON exportieren · CSV exportieren
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';

const TABS = [
  'Overview', 'Rendering', 'Feed', 'Images',
  'Supabase', 'Realtime', 'React', 'Waterfall', 'Critical Path',
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n === null || n === undefined) return '—';
  if (typeof n !== 'number') return String(n);
  return n < 100 ? n.toFixed(1) : Math.round(n).toString();
}
function fmtMs(n) {
  if (n === null || n === undefined) return '—';
  return fmt(n) + ' ms';
}
function rel(n, boot) {
  if (n === null || n === undefined || !boot) return '—';
  return '+' + fmt(n - boot) + ' ms';
}

// ─── Data Hook ──────────────────────────────────────────────────────────────
function usePerfStore() {
  const [, force] = useState(0);
  const refresh = useCallback(() => force(v => v + 1), []);
  return [() => window.__HUI_PERF_STORE__, refresh];
}

// ─── Bar Component ───────────────────────────────────────────────────────────
function Bar({ value, max, label, sub, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
        <span style={{ color: '#374151' }}>{label}</span>
        <span style={{ color: '#6B7280', fontFamily: 'monospace' }}>{sub}</span>
      </div>
      <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          width: pct + '%',
          height: '100%',
          background: color || '#0DC4B5',
          borderRadius: 3,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

// ─── Card Component ──────────────────────────────────────────────────────────
function Card({ title, children, style }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      ...style,
    }}>
      {title && (
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#6B7280',
          marginBottom: 12,
        }}>{title}</div>
      )}
      {children}
    </div>
  );
}

// ─── Table Component ─────────────────────────────────────────────────────────
function Table({ headers, rows }) {
  if (!rows || rows.length === 0) return <div style={{ color: '#9CA3AF', fontSize: 13, padding: 8 }}>No data</div>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{
                textAlign: 'left',
                padding: '6px 10px',
                borderBottom: '2px solid #E5E7EB',
                color: '#6B7280',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {headers.map(h => (
                <td key={h} style={{
                  padding: '5px 10px',
                  borderBottom: '1px solid #F3F4F6',
                  color: '#374151',
                  fontFamily: typeof r[h] === 'number' ? 'monospace' : 'inherit',
                  whiteSpace: 'nowrap',
                }}>{r[h]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Stat Tile ───────────────────────────────────────────────────────────────
function StatTile({ label, value, color }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: 12,
      padding: '14px 16px',
      flex: '1 1 120px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || '#111827', marginTop: 4, fontFamily: 'monospace' }}>{value}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB CONTENT COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

// ─── Overview ─────────────────────────────────────────────────────────────────
function TabOverview({ s }) {
  const p = s.perceived || {};
  const boot = p.appBoot || 0;
  const maxVal = Math.max(p.fmp || 0, p.heroReady || 0, p.feedReady || 0, p.tti || 0, p.idleTime || 0, 1);
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatTile label="Boot Time" value={fmtMs(boot)} />
        <StatTile label="First Meaningful Paint" value={fmtMs(p.fmp)} color={p.fmp && p.fmp < 1500 ? '#0DC4B5' : '#E8876A'} />
        <StatTile label="Hero Ready" value={fmtMs(p.heroReady)} color="#0DC4B5" />
        <StatTile label="Feed Ready" value={fmtMs(p.feedReady)} color="#0DC4B5" />
        <StatTile label="Time to Interactive" value={fmtMs(p.tti)} color={p.tti && p.tti < 2000 ? '#0DC4B5' : '#E8876A'} />
        <StatTile label="Idle Time" value={fmtMs(p.idleTime)} />
        <StatTile label="CPU Busy" value={fmtMs(p.cpuBusyTime)} color={p.cpuBusyTime > 500 ? '#E8876A' : '#0DC4B5'} />
      </div>

      <Card title="Perceived Performance Timeline">
        <Bar value={boot} max={maxVal} label="Boot" sub={fmtMs(boot)} />
        <Bar value={p.fmp || 0} max={maxVal} label="First Meaningful Paint" sub={fmtMs(p.fmp)} />
        <Bar value={p.heroReady || 0} max={maxVal} label="Hero Ready" sub={fmtMs(p.heroReady)} color="#F47355" />
        <Bar value={p.feedReady || 0} max={maxVal} label="Feed Ready (5 cards + imgs)" sub={fmtMs(p.feedReady)} color="#F47355" />
        <Bar value={p.tti || 0} max={maxVal} label="Time to Interactive" sub={fmtMs(p.tti)} color="#E8876A" />
        <Bar value={p.idleTime || 0} max={maxVal} label="Idle Time" sub={fmtMs(p.idleTime)} color="#9CA3AF" />
      </Card>

      <Card title="DOM Snapshot">
        <Table
          headers={['Metric', 'Value']}
          rows={s.domSnapshot ? [
            { Metric: 'Total DOM Nodes', Value: s.domSnapshot.totalNodes },
            { Metric: 'Feed Cards', Value: s.domSnapshot.feedCards },
            { Metric: 'Images', Value: s.domSnapshot.images },
            { Metric: 'Videos', Value: s.domSnapshot.videos },
            { Metric: 'SVGs', Value: s.domSnapshot.svgs },
          ] : []}
        />
      </Card>

      <Card title="CLS (Cumulative Layout Shift)">
        <Table
          headers={['Metric', 'Value']}
          rows={[
            { Metric: 'CLS Score', Value: s.clsValue?.toFixed(4) || '0' },
            { Metric: 'Total Shifts', Value: (s.clsEntries || []).length },
          ]}
        />
      </Card>

      <Card title="Long Tasks (>50ms)">
        <Table
          headers={['Start (ms)', 'Duration (ms)', 'Attribution']}
          rows={(s.longTasks || []).map(t => ({
            'Start (ms)': fmt(t.startTime),
            'Duration (ms)': fmt(t.duration),
            'Attribution': (t.attribution || '').slice(0, 40),
          }))}
        />
      </Card>
    </div>
  );
}

// ─── Rendering ────────────────────────────────────────────────────────────────
function TabRendering({ s }) {
  const mounts = s.mounts || {};
  const renders = s.renders || {};
  return (
    <div>
      <Card title="Component Mount Times">
        <Table
          headers={['Component', 'Start (ms)', 'End (ms)', 'Duration (ms)']}
          rows={Object.entries(mounts).map(([name, m]) => ({
            'Component': name,
            'Start (ms)': fmt(m.start),
            'End (ms)': fmt(m.end),
            'Duration (ms)': fmt(m.duration),
          }))}
        />
      </Card>
      <Card title="Component Render Stats (React.Profiler)">
        <Table
          headers={['Component', 'Renders', 'Avg Actual', 'Avg Base', 'Total Actual', 'Last Commit']}
          rows={Object.entries(renders).map(([name, r]) => ({
            'Component': name,
            'Renders': r.count,
            'Avg Actual': fmt(r.totalActual / r.count),
            'Avg Base': fmt(r.totalBase / r.count),
            'Total Actual': fmt(r.totalActual),
            'Last Commit': fmt(r.lastCommit),
          }))}
        />
      </Card>
      <Card title="Mount Timeline">
        {Object.entries(mounts).map(([name, m]) => (
          <Bar key={name} value={m.duration} max={Math.max(...Object.values(mounts).map(x => x.duration), 1)}
            label={name} sub={fmt(m.duration) + ' ms'} />
        ))}
      </Card>
    </div>
  );
}

// ─── Feed ─────────────────────────────────────────────────────────────────────
function TabFeed({ s }) {
  const f = s.feed || {};
  const fetchDur = f.fetchEnd && f.fetchStart ? f.fetchEnd - f.fetchStart : null;
  const mergeDur = f.mergeEnd && f.mergeStart ? f.mergeEnd - f.mergeStart : null;
  const sortDur = f.sortEnd && f.sortStart ? f.sortEnd - f.sortStart : null;
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatTile label="Cards" value={f.cardCount || 0} />
        <StatTile label="Fetch" value={fmtMs(fetchDur)} />
        <StatTile label="Merge" value={fmtMs(mergeDur)} />
        <StatTile label="Sort" value={fmtMs(sortDur)} />
        <StatTile label="First Card" value={fmtMs(f.firstVisible)} />
        <StatTile label="All Visible" value={fmtMs(f.allVisible)} />
      </div>
      <Card title="Feed Phase Durations">
        <Bar value={fetchDur || 0} max={Math.max(fetchDur, mergeDur, sortDur, 1)} label="Fetch (all queries)" sub={fmtMs(fetchDur)} />
        <Bar value={mergeDur || 0} max={Math.max(fetchDur, mergeDur, sortDur, 1)} label="Merge + Normalize" sub={fmtMs(mergeDur)} color="#F47355" />
        <Bar value={sortDur || 0} max={Math.max(fetchDur, mergeDur, sortDur, 1)} label="Sort" sub={fmtMs(sortDur)} color="#9CA3AF" />
      </Card>
      <Card title="Individual Feed Queries">
        <Table
          headers={['Table', 'Start (ms)', 'Duration (ms)']}
          rows={(s.feedQueries || []).map(q => ({
            'Table': q.table,
            'Start (ms)': fmt(q.startTime),
            'Duration (ms)': fmt(q.duration),
          }))}
        />
      </Card>
      <Card title="FeedCard Profiler">
        <Table
          headers={['Card', 'Renders', 'Actual (ms)', 'Base (ms)', 'Commit (ms)']}
          rows={Object.entries(s.renders || {}).filter(([n]) => n.startsWith('FeedCard')).map(([name, r]) => ({
            'Card': name.replace('FeedCard:', ''),
            'Renders': r.count,
            'Actual (ms)': fmt(r.totalActual),
            'Base (ms)': fmt(r.totalBase),
            'Commit (ms)': fmt(r.lastCommit),
          }))}
        />
      </Card>
    </div>
  );
}

// ─── Images ──────────────────────────────────────────────────────────────────
function TabImages({ s }) {
  const imgs = s.images || [];
  let maxConcurrent = 0;
  for (let i = 0; i < imgs.length; i++) {
    let count = 1;
    for (let j = 0; j < imgs.length; j++) {
      if (i === j) continue;
      if (imgs[i].downloadStart < (imgs[j].downloadEnd || 0) && (imgs[i].downloadEnd || 0) > imgs[j].downloadStart) count++;
    }
    if (count > maxConcurrent) maxConcurrent = count;
  }
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatTile label="Total Images" value={imgs.length} />
        <StatTile label="Max Concurrent" value={maxConcurrent} color={maxConcurrent > 10 ? '#E8876A' : '#0DC4B5'} />
      </div>
      <Card title="Image Details">
        <Table
          headers={['Src', 'Download (ms)', 'Decode (ms)', 'Transfer (KB)', 'Natural', 'Display']}
          rows={imgs.map(img => ({
            'Src': (img.src || '').slice(0, 50),
            'Download (ms)': fmt(img.duration),
            'Decode (ms)': img.decodeMs ? fmt(img.decodeMs) : '—',
            'Transfer (KB)': img.transferSize ? (img.transferSize / 1024).toFixed(1) : '—',
            'Natural': img.naturalW ? `${img.naturalW}×${img.naturalH}` : '—',
            'Display': img.displayW ? `${img.displayW}×${img.displayH}` : '—',
          }))}
        />
      </Card>
    </div>
  );
}

// ─── Supabase ─────────────────────────────────────────────────────────────────
function TabSupabase({ s }) {
  const queries = s.queries || [];
  const slow = queries.filter(q => q.duration > 200);
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatTile label="Total Queries" value={queries.length} />
        <StatTile label="Slow (>200ms)" value={slow.length} color={slow.length > 0 ? '#E8876A' : '#0DC4B5'} />
      </div>
      <Card title="Supabase REST Queries">
        <Table
          headers={['Table', 'Start (ms)', 'Duration (ms)', 'Size (KB)', 'Initiator']}
          rows={queries.map(q => ({
            'Table': q.name,
            'Start (ms)': fmt(q.startTime),
            'Duration (ms)': fmt(q.duration),
            'Size (KB)': q.transferSize ? (q.transferSize / 1024).toFixed(1) : '—',
            'Initiator': q.initiatorType || '—',
          }))}
        />
      </Card>
    </div>
  );
}

// ─── Realtime ────────────────────────────────────────────────────────────────
function TabRealtime({ s }) {
  const rt = s.realtime || {};
  const channels = rt.channels || [];
  const active = channels.filter(c => c.status === 'subscribed' || c.status === 'connecting');
  const dupes = channels.filter(c => c.duplicate);
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatTile label="Channels (total)" value={channels.length} />
        <StatTile label="Channels (active)" value={active.length} color="#0DC4B5" />
        <StatTile label="Total Events" value={rt.totalEvents || 0} />
        <StatTile label="Duplicates" value={dupes.length} color={dupes.length > 0 ? '#E8876A' : '#0DC4B5'} />
      </div>
      <Card title="Channel Overview">
        <Table
          headers={['Channel', 'Status', 'Events', 'Time to SUBSCRIBED', 'Tables', 'Event Types']}
          rows={channels.map(c => ({
            'Channel': c.name,
            'Status': c.status,
            'Events': c.eventCount,
            'Time to SUBSCRIBED': c.timeToSubscribed ? fmt(c.timeToSubscribed) + ' ms' : '—',
            'Tables': c.tables.join(', ') || '—',
            'Event Types': c.eventTypes.join(', ') || '—',
          }))}
        />
      </Card>
      {dupes.length > 0 && (
        <Card title="Duplicate Channels" style={{ borderColor: '#E8876A' }}>
          <Table
            headers={['Channel', 'Instances', 'Total Events']}
            rows={Object.entries(channels.reduce((acc, c) => {
              if (!acc[c.name]) acc[c.name] = { count: 0, events: 0 };
              acc[c.name].count++;
              acc[c.name].events += c.eventCount;
              return acc;
            }, {})).filter(([_, v]) => v.count > 1).map(([name, v]) => ({
              'Channel': name,
              'Instances': v.count,
              'Total Events': v.events,
            }))}
          />
        </Card>
      )}
    </div>
  );
}

// ─── React ───────────────────────────────────────────────────────────────────
function TabReact({ s }) {
  const renders = s.renders || {};
  const total = Object.values(renders).reduce((sum, r) => sum + r.totalActual, 0);
  const sorted = Object.entries(renders).sort((a, b) => b[1].totalActual - a[1].totalActual);
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatTile label="Components Tracked" value={Object.keys(renders).length} />
        <StatTile label="Total Render Time" value={fmtMs(total)} />
      </div>
      <Card title="Re-Render Summary (sorted by total actual time)">
        <Table
          headers={['Component', 'Renders', 'Total Actual', 'Avg Actual', 'Mount Count']}
          rows={sorted.map(([name, r]) => ({
            'Component': name,
            'Renders': r.count,
            'Total Actual': fmt(r.totalActual) + ' ms',
            'Avg Actual': fmt(r.totalActual / r.count) + ' ms',
            'Mount Count': r.phases?.mount?.length || 0,
          }))}
        />
      </Card>
      <Card title="Render Time Distribution">
        {sorted.slice(0, 10).map(([name, r]) => (
          <Bar key={name} value={r.totalActual}
            max={sorted[0][1].totalActual || 1}
            label={name} sub={fmt(r.totalActual) + ' ms'} />
        ))}
      </Card>
    </div>
  );
}

// ─── Waterfall ────────────────────────────────────────────────────────────────
function TabWaterfall({ s }) {
  const waterfall = [];
  const m = s.mounts || {};
  const h = s.hero || {};
  const f = s.feed || {};

  if (m['DesktopShell']) waterfall.push({ Stage: 'DesktopShell', Start: m['DesktopShell'].start, End: m['DesktopShell'].end });
  if (m['DesktopSidebar']) waterfall.push({ Stage: 'Sidebar', Start: m['DesktopSidebar'].start, End: m['DesktopSidebar'].end });
  if (m['DesktopHeader']) waterfall.push({ Stage: 'Header', Start: m['DesktopHeader'].start, End: m['DesktopHeader'].end });
  if (h.render) {
    const heroStart = m['DesktopHome']?.start || h.render;
    const heroEnd = h.imgDecode || h.imgLoadEnd || h.render;
    waterfall.push({ Stage: 'Hero', Start: heroStart, End: heroEnd });
  }
  if (f.fetchStart) {
    const feedEnd = f.allVisible || f.firstVisible || f.sortEnd || f.fetchEnd;
    waterfall.push({ Stage: 'Feed', Start: f.fetchStart, End: feedEnd });
  }
  const feedImgs = (s.images || []).filter(img => !img.src?.includes('hero'));
  if (feedImgs.length > 0) {
    const imgStart = Math.min(...feedImgs.map(i => i.downloadStart));
    const imgEnd = Math.max(...feedImgs.map(i => i.downloadEnd || (i.downloadStart + i.duration)));
    waterfall.push({ Stage: 'Feed Images', Start: imgStart, End: imgEnd });
  }
  if (m['DesktopRightPanel']) {
    const rpEnd = s.perceived?.rightPanelReady || m['DesktopRightPanel'].end;
    waterfall.push({ Stage: 'Right Panel', Start: m['DesktopRightPanel'].start, End: rpEnd });
  }
  if (m['DesktopHeader']) waterfall.push({ Stage: 'Chat', Start: m['DesktopHeader'].start, End: m['DesktopHeader'].end });
  if (m['DesktopHeader']) waterfall.push({ Stage: 'Notifications', Start: m['DesktopHeader'].start, End: m['DesktopHeader'].end });

  waterfall.sort((a, b) => a.Start - b.Start);
  const minStart = waterfall.length > 0 ? Math.min(...waterfall.map(w => w.Start)) : 0;
  const maxEnd = waterfall.length > 0 ? Math.max(...waterfall.map(w => w.End)) : 0;
  const span = maxEnd - minStart || 1;

  return (
    <div>
      <Card title="Waterfall Timeline">
        {waterfall.length === 0 ? <div style={{ color: '#9CA3AF' }}>No waterfall data</div> :
          waterfall.map(w => {
            const leftPct = ((w.Start - minStart) / span) * 100;
            const widthPct = Math.max(2, ((w.End - w.Start) / span) * 100);
            return (
              <div key={w.Stage} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, fontSize: 12 }}>
                <div style={{ width: 100, color: '#374151', fontWeight: 500, flexShrink: 0 }}>{w.Stage}</div>
                <div style={{ flex: 1, position: 'relative', height: 18, background: '#F9FAFB', borderRadius: 3 }}>
                  <div style={{
                    position: 'absolute',
                    left: leftPct + '%',
                    width: widthPct + '%',
                    height: '100%',
                    background: w.Stage.includes('Hero') || w.Stage.includes('Feed') ? '#F47355' : '#0DC4B5',
                    borderRadius: 3,
                  }} />
                </div>
                <div style={{ width: 60, textAlign: 'right', color: '#6B7280', fontFamily: 'monospace', flexShrink: 0, marginLeft: 8 }}>
                  {fmt(w.End - w.Start)} ms
                </div>
              </div>
            );
          })
        }
        <div style={{ marginTop: 8, fontSize: 11, color: '#9CA3AF' }}>
          Total span: {fmt(span)} ms
        </div>
      </Card>
      <Card title="Waterfall Table">
        <Table
          headers={['Stage', 'Start (ms)', 'End (ms)', 'Duration (ms)']}
          rows={waterfall.map(w => ({
            'Stage': w.Stage,
            'Start (ms)': fmt(w.Start),
            'End (ms)': fmt(w.End),
            'Duration (ms)': fmt(w.End - w.Start),
          }))}
        />
      </Card>
    </div>
  );
}

// ─── Critical Path ──────────────────────────────────────────────────────────
function TabCriticalPath({ s }) {
  const m = s.mounts || {};
  const h = s.hero || {};
  const f = s.feed || {};
  const p = s.perceived || {};
  const stages = [];

  if (m['DesktopShell']) stages.push({ stage: '1. DesktopShell', type: 'blockierend', start: m['DesktopShell'].start, end: m['DesktopShell'].end, note: 'Root — alles wartet' });
  if (m['DesktopSidebar']) stages.push({ stage: '2a. Sidebar', type: 'parallel', start: m['DesktopSidebar'].start, end: m['DesktopSidebar'].end, note: 'Parallel mit Header' });
  if (m['DesktopHeader']) stages.push({ stage: '2b. Header', type: 'parallel', start: m['DesktopHeader'].start, end: m['DesktopHeader'].end, note: 'Search + Chat' });
  if (m['DesktopHome']) stages.push({ stage: '2c. Home', type: 'parallel', start: m['DesktopHome'].start, end: m['DesktopHome'].end, note: 'Hero + Feed' });
  if (h.render) stages.push({ stage: '3a. Hero Render', type: 'nachgelagert', start: m['DesktopHome']?.end || h.render, end: h.render, note: 'Nach Home Mount' });
  if (h.imgLoadEnd) stages.push({ stage: '3b. Hero Image', type: 'nachgelagert', start: h.imgLoadStart || h.render || 0, end: h.imgLoadEnd, note: 'Netzwerk' });
  if (f.fetchStart) stages.push({ stage: '3c. Feed Fetch', type: 'nachgelagert', start: f.fetchStart, end: f.fetchEnd || f.fetchStart, note: 'Supabase Queries' });
  if (f.firstVisible) stages.push({ stage: '4. Feed First Card', type: 'nachgelagert', start: f.fetchEnd || f.fetchStart || 0, end: f.firstVisible, note: 'Fetch → Merge → Sort → Render' });
  if (p.feedReady) stages.push({ stage: '5. Feed Ready', type: 'nachgelagert', start: f.firstVisible || f.fetchStart || 0, end: p.feedReady, note: '5 cards + images' });
  if (p.tti) stages.push({ stage: '6. TTI', type: 'blockierend', start: p.appBoot || 0, end: p.tti, note: 'Critical path end' });

  const typeColor = { 'blockierend': '#E8876A', 'parallel': '#0DC4B5', 'nachgelagert': '#9CA3AF' };

  return (
    <div>
      <Card title="Critical Path Analysis">
        {stages.length === 0 ? <div style={{ color: '#9CA3AF' }}>No critical path data</div> :
          <Table
            headers={['Stage', 'Typ', 'Start', 'End', 'Duration', 'Note']}
            rows={stages.map(st => ({
              'Stage': st.stage,
              'Typ': st.type,
              'Start': fmt(st.start),
              'End': fmt(st.end),
              'Duration': fmt(st.end - st.start) + ' ms',
              'Note': st.note,
            }))}
          />
        }
      </Card>
      <Card title="Stage Types">
        {stages.map(st => (
          <div key={st.stage} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 12 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: typeColor[st.type] || '#9CA3AF', flexShrink: 0,
            }} />
            <span style={{ fontWeight: 500, color: '#374151' }}>{st.stage}</span>
            <span style={{ color: '#9CA3AF', fontSize: 11 }}>{st.type}</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'monospace', color: '#6B7280' }}>{fmt(st.end - st.start)} ms</span>
          </div>
        ))}
      </Card>
      <Card title="Critical Chain" style={{ borderColor: '#E8876A' }}>
        {(() => {
          const blocking = stages.filter(s => s.type === 'blockierend');
          const total = blocking.reduce((sum, s) => sum + (s.end - s.start), 0);
          return (
            <>
              <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>
                {blocking.map(s => s.stage).join(' → ')}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: '#E8876A' }}>
                {fmt(total)} ms
              </div>
            </>
          );
        })()}
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════
function generateMarkdown(s) {
  const p = s.perceived || {};
  const boot = p.appBoot || 0;
  let md = `# HUI Performance Report\n\nGenerated: ${new Date().toISOString()}\n\n`;

  md += `## Overview\n\n`;
  md += `| Metric | Value |\n|---|---|\n`;
  md += `| Boot Time | ${fmtMs(boot)} |\n`;
  md += `| First Meaningful Paint | ${fmtMs(p.fmp)} |\n`;
  md += `| Hero Ready | ${fmtMs(p.heroReady)} |\n`;
  md += `| Feed Ready | ${fmtMs(p.feedReady)} |\n`;
  md += `| Time to Interactive | ${fmtMs(p.tti)} |\n`;
  md += `| Idle Time | ${fmtMs(p.idleTime)} |\n`;
  md += `| CPU Busy Time | ${fmtMs(p.cpuBusyTime)} |\n\n`;

  md += `## Component Mounts\n\n`;
  md += `| Component | Start (ms) | End (ms) | Duration (ms) |\n|---|---|---|---|\n`;
  for (const [name, m] of Object.entries(s.mounts || {}))
    md += `| ${name} | ${fmt(m.start)} | ${fmt(m.end)} | ${fmt(m.duration)} |\n`;
  md += '\n';

  md += `## Component Renders\n\n`;
  md += `| Component | Renders | Total Actual (ms) | Avg Actual (ms) |\n|---|---|---|---|\n`;
  for (const [name, r] of Object.entries(s.renders || {}))
    md += `| ${name} | ${r.count} | ${fmt(r.totalActual)} | ${fmt(r.totalActual / r.count)} |\n`;
  md += '\n';

  const f = s.feed || {};
  md += `## Feed\n\n`;
  md += `| Phase | Duration (ms) |\n|---|---|\n`;
  if (f.fetchStart && f.fetchEnd) md += `| Fetch | ${fmt(f.fetchEnd - f.fetchStart)} |\n`;
  if (f.mergeStart && f.mergeEnd) md += `| Merge | ${fmt(f.mergeEnd - f.mergeStart)} |\n`;
  if (f.sortStart && f.sortEnd) md += `| Sort | ${fmt(f.sortEnd - f.sortStart)} |\n`;
  md += `| Card Count | ${f.cardCount} |\n\n`;

  md += `## Supabase Queries\n\n`;
  md += `| Table | Start (ms) | Duration (ms) | Size (KB) |\n|---|---|---|---|\n`;
  for (const q of (s.queries || []))
    md += `| ${q.name} | ${fmt(q.startTime)} | ${fmt(q.duration)} | ${q.transferSize ? (q.transferSize / 1024).toFixed(1) : '—'} |\n`;
  md += '\n';

  const rt = s.realtime || {};
  md += `## Realtime\n\n`;
  md += `| Channel | Status | Events | Time to SUBSCRIBED | Tables |\n|---|---|---|---|---|\n`;
  for (const c of (rt.channels || []))
    md += `| ${c.name} | ${c.status} | ${c.eventCount} | ${c.timeToSubscribed ? fmt(c.timeToSubscribed) + ' ms' : '—'} | ${c.tables.join(', ')} |\n`;
  md += `\n**Active Channels:** ${rt.activeCount || 0}  \n`;
  md += `**Total Events:** ${rt.totalEvents || 0}  \n`;
  md += `**Duplicates:** ${(rt.channels || []).filter(c => c.duplicate).length}\n\n`;

  md += `## Images\n\n`;
  md += `| Src | Download (ms) | Decode (ms) | Transfer (KB) |\n|---|---|---|---|\n`;
  for (const img of (s.images || []))
    md += `| ${(img.src || '').slice(0, 50)} | ${fmt(img.duration)} | ${img.decodeMs ? fmt(img.decodeMs) : '—'} | ${img.transferSize ? (img.transferSize / 1024).toFixed(1) : '—'} |\n`;
  md += '\n';

  md += `## Long Tasks\n\n`;
  md += `| Start (ms) | Duration (ms) | Attribution |\n|---|---|---|\n`;
  for (const t of (s.longTasks || []))
    md += `| ${fmt(t.startTime)} | ${fmt(t.duration)} | ${t.attribution} |\n`;

  md += `\n## CLS\n\nScore: ${s.clsValue?.toFixed(4) || '0'}\nTotal Shifts: ${(s.clsEntries || []).length}\n`;

  return md;
}

function generateCSV(s) {
  let csv = 'Section,Metric,Value\n';
  const p = s.perceived || {};
  const boot = p.appBoot || 0;
  csv += `Overview,Boot Time (ms),${fmt(boot)}\n`;
  csv += `Overview,First Meaningful Paint (ms),${fmt(p.fmp)}\n`;
  csv += `Overview,Hero Ready (ms),${fmt(p.heroReady)}\n`;
  csv += `Overview,Feed Ready (ms),${fmt(p.feedReady)}\n`;
  csv += `Overview,Time to Interactive (ms),${fmt(p.tti)}\n`;
  csv += `Overview,Idle Time (ms),${fmt(p.idleTime)}\n`;
  csv += `Overview,CPU Busy (ms),${fmt(p.cpuBusyTime)}\n`;

  for (const [name, m] of Object.entries(s.mounts || {}))
    csv += `Mount,${name} Duration (ms),${fmt(m.duration)}\n`;
  for (const [name, r] of Object.entries(s.renders || {}))
    csv += `Render,${name} Total Actual (ms),${fmt(r.totalActual)}\n`;
  for (const [name, r] of Object.entries(s.renders || {}))
    csv += `RenderCount,${name} Count,${r.count}\n`;

  const f = s.feed || {};
  if (f.fetchStart && f.fetchEnd) csv += `Feed,Fetch Duration (ms),${fmt(f.fetchEnd - f.fetchStart)}\n`;
  if (f.mergeStart && f.mergeEnd) csv += `Feed,Merge Duration (ms),${fmt(f.mergeEnd - f.mergeStart)}\n`;
  if (f.sortStart && f.sortEnd) csv += `Feed,Sort Duration (ms),${fmt(f.sortEnd - f.sortStart)}\n`;
  csv += `Feed,Card Count,${f.cardCount || 0}\n`;

  for (const q of (s.queries || []))
    csv += `Supabase,${q.name} (ms),${fmt(q.duration)}\n`;

  const rt = s.realtime || {};
  csv += `Realtime,Active Channels,${rt.activeCount || 0}\n`;
  csv += `Realtime,Total Events,${rt.totalEvents || 0}\n`;
  csv += `Realtime,Duplicates,${(rt.channels || []).filter(c => c.duplicate).length}\n`;

  csv += `CLS,Score,${s.clsValue?.toFixed(4) || '0'}\n`;
  csv += `LongTasks,Count,${(s.longTasks || []).length}\n`;

  return csv;
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => true).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
  return true;
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (_) {}
  document.body.removeChild(ta);
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function DevDashboard() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('Overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [getStore] = usePerfStore();

  // Only render in desktop web with perf enabled
  if (typeof window !== 'undefined' && !window.__HUI_PERF__) return null;

  const store = getStore();
  if (!store) return null;

  const refresh = () => setRefreshKey(k => k + 1);

  const handleCopy = () => {
    copyToClipboard(generateMarkdown(store));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleJSON = () => downloadFile(JSON.stringify(store, null, 2), 'hui-perf-report.json', 'application/json');
  const handleCSV = () => downloadFile(generateCSV(store), 'hui-perf-report.csv', 'text/csv');

  const tabComponents = {
    'Overview': <TabOverview s={store} />,
    'Rendering': <TabRendering s={store} />,
    'Feed': <TabFeed s={store} />,
    'Images': <TabImages s={store} />,
    'Supabase': <TabSupabase s={store} />,
    'Realtime': <TabRealtime s={store} />,
    'React': <TabReact s={store} />,
    'Waterfall': <TabWaterfall s={store} />,
    'Critical Path': <TabCriticalPath s={store} />,
  };

  // DEV Button (bottom-right)
  if (!open) {
    return (
      <button
        onClick={() => { refresh(); setOpen(true); }}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 999999,
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '2px solid #0DC4B5',
          background: '#fff',
          color: '#0DC4B5',
          fontSize: 12,
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          transition: 'all 0.2s',
          fontFamily: 'monospace',
        }}
        onMouseEnter={e => { e.target.style.background = '#0DC4B5'; e.target.style.color = '#fff'; }}
        onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.color = '#0DC4B5'; }}
        title="HUI Performance Dashboard"
      >
        DEV
      </button>
    );
  }

  // Modal
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999998,
          background: 'rgba(0,0,0,0.3)',
        }}
      />
      {/* Dashboard */}
      <div style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 999999,
        width: 'calc(100vw - 32px)',
        maxWidth: 900,
        maxHeight: 'calc(100vh - 32px)',
        background: '#FAFAFA',
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #E5E7EB',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: '#fff',
          borderBottom: '1px solid #E5E7EB',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: '#0DC4B5', color: '#fff',
              fontSize: 10, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'monospace',
            }}>DEV</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Performance Dashboard</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={refresh} style={{
              padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB',
              background: '#fff', color: '#374151', fontSize: 12, cursor: 'pointer', fontWeight: 600,
            }}>↻ Refresh</button>
            <button onClick={handleCopy} style={{
              padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB',
              background: copied ? '#0DC4B5' : '#fff', color: copied ? '#fff' : '#374151',
              fontSize: 12, cursor: 'pointer', fontWeight: 600,
            }}>{copied ? '✓ Kopiert' : '📋 Report kopieren'}</button>
            <button onClick={handleJSON} style={{
              padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB',
              background: '#fff', color: '#374151', fontSize: 12, cursor: 'pointer', fontWeight: 600,
            }}>JSON</button>
            <button onClick={handleCSV} style={{
              padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB',
              background: '#fff', color: '#374151', fontSize: 12, cursor: 'pointer', fontWeight: 600,
            }}>CSV</button>
            <button onClick={() => setOpen(false)} style={{
              padding: '6px 12px', borderRadius: 6, border: 'none',
              background: '#F3F4F6', color: '#6B7280', fontSize: 14, cursor: 'pointer', fontWeight: 700,
            }}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 2,
          padding: '0 12px',
          background: '#fff',
          borderBottom: '1px solid #E5E7EB',
          flexShrink: 0,
          overflowX: 'auto',
        }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '10px 14px',
                border: 'none',
                background: 'transparent',
                borderBottom: tab === t ? '2px solid #0DC4B5' : '2px solid transparent',
                color: tab === t ? '#0DC4B5' : '#6B7280',
                fontSize: 13,
                fontWeight: tab === t ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >{t}</button>
          ))}
        </div>

        {/* Content */}
        <div key={refreshKey} style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
        }}>
          {tabComponents[tab] || <div style={{ color: '#9CA3AF' }}>Select a tab</div>}
        </div>
      </div>
    </>
  );
}
