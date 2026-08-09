// ══════════════════════════════════════════════════════════════════════════════
// HuiDevConsole.jsx — HUI Developer Console (10 Panels)
// ══════════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useReducer } from 'react';
import { store } from './store.js';
import { formatTimeDE } from "../../../lib/formatters.js";

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeStr(ts) {
  const d = new Date(ts);
  return formatTimeDE(d, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

// ── TreeNode (React Tree Panel) ────────────────────────────────────────────────
function TreeNode({ node, level = 0 }) {
  const [expanded, setExpanded] = useState(level < 3);
  if (!node) return null;
  const hasKids = node.children?.length > 0;
  return (
    <div className="hudc-tree-node">
      <div className="hudc-tree-row" style={{ paddingLeft: level * 14 + 'px' }}>
        <button className="hudc-tree-toggle" onClick={() => setExpanded(!expanded)}>
          {hasKids ? (expanded ? '▼' : '▶') : '·'}
        </button>
        <span className="hudc-tree-name">{node.name}</span>
        <span className={`hudc-tree-type type-${node.type}`}>{node.type}</span>
        {node.props?.length > 0 && <span className="hudc-tree-props">[{node.props.join(', ')}]</span>}
        {node.hasState && <span className="hudc-tree-state">S</span>}
      </div>
      {expanded && hasKids && node.children.map((c, i) => <TreeNode key={i} node={c} level={level + 1} />)}
    </div>
  );
}

// ── 1. DOM Inspector ──────────────────────────────────────────────────────────
function DomInspectorPanel() {
  const data = store.getDomSnapshot();
  return (
    <div className="hudc-panel">
      <table className="hudc-table">
        <thead><tr><th>Selector</th><th>✓</th><th>Height</th><th>Rect</th><th>Width</th><th>Display</th><th>OvrflY</th><th>Pos</th><th>Kids</th></tr></thead>
        <tbody>
          {data.map(e => (
            <tr key={e.selector} className={e.exists && (e.rectH === 0 || e.height === '0px') ? 'row-zero' : ''}>
              <td className="mono">{e.selector.replace('#web-root ', '')}</td>
              <td>{e.exists ? '✅' : '❌'}</td>
              <td className="mono">{e.height || '-'}</td>
              <td className="mono">{e.rectH ?? '-'}</td>
              <td className="mono">{e.width || '-'}</td>
              <td className="mono">{e.display || '-'}</td>
              <td className="mono">{e.overflowY || '-'}</td>
              <td className="mono">{e.position || '-'}</td>
              <td>{e.childCount ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 2. React Tree ─────────────────────────────────────────────────────────────
function ReactTreePanel() {
  const tree = store.getReactTree();
  if (!tree) return <div className="hudc-empty">React fiber tree nicht gefunden</div>;
  return (
    <div className="hudc-panel">
      <div className="hudc-tree"><TreeNode node={tree} /></div>
    </div>
  );
}

// ── 3. Error Console ──────────────────────────────────────────────────────────
function ErrorConsolePanel() {
  const errors = store.errors;
  return (
    <div className="hudc-panel">
      <div className="panel-bar">
        <span>{errors.length} errors</span>
        <button className="btn-clear" onClick={() => { store.errors.length = 0; store._notify(); }}>Clear</button>
      </div>
      <div className="hudc-list">
        {errors.length === 0 && <div className="hudc-empty">Keine Errors aufgezeichnet</div>}
        {errors.slice().reverse().map((e, i) => (
          <div key={i} className="error-item">
            <div className="error-head">
              <span className="error-type">{e.type}</span>
              <span className="error-time">{timeStr(e.timestamp)}</span>
            </div>
            <div className="error-msg">{e.message}</div>
            {e.source && <div className="error-src mono">{e.source}</div>}
            {e.stack && <pre className="error-stack">{e.stack.split('\n').slice(0, 8).join('\n')}</pre>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 4. Network ────────────────────────────────────────────────────────────────
function NetworkPanel() {
  const [filter, setFilter] = useState('all');
  const reqs = filter === 'all' ? store.network : store.network.filter(r => r.type.includes(filter));
  return (
    <div className="hudc-panel">
      <div className="panel-bar">
        <div className="filter-group">
          {['all', 'supabase', 'fetch', 'image', 'asset', 'error'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        <button className="btn-clear" onClick={() => { store.network.length = 0; store._notify(); }}>Clear</button>
      </div>
      <div className="hudc-list">
        {reqs.length === 0 && <div className="hudc-empty">Keine Requests aufgezeichnet</div>}
        {reqs.slice().reverse().map((r, i) => (
          <div key={i} className="net-item">
            <span className="net-method">{r.method}</span>
            <span className="net-url" title={r.url}>{r.url}</span>
            <span className="net-status" style={{ color: r.status >= 200 && r.status < 300 ? '#9ece6a' : r.status >= 400 ? '#f7768e' : '#565f89' }}>{r.status || 'ERR'}</span>
            <span className="net-dur">{r.duration}ms</span>
            <span className="net-type">{r.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 5. Performance ─────────────────────────────────────────────────────────────
function PerformancePanel() {
  const p = store.perf;
  const metrics = [
    { l: 'FCP', v: p.fcp, u: 'ms', good: p.fcp < 1800 },
    { l: 'LCP', v: p.lcp, u: 'ms', good: p.lcp < 2500 },
    { l: 'CLS', v: p.cls, u: '', good: p.cls < 0.1 },
    { l: 'TTFB', v: p.ttfb, u: 'ms', good: p.ttfb < 800 },
    { l: 'INP', v: p.inp, u: 'ms', good: p.inp < 200 },
  ];
  return (
    <div className="hudc-panel">
      <div className="perf-grid">
        {metrics.map(m => (
          <div key={m.l} className={`perf-card ${m.v === null ? 'null' : m.good ? 'good' : 'bad'}`}>
            <div className="perf-label">{m.l}</div>
            <div className="perf-value">{m.v !== null ? m.v + m.u : '—'}</div>
          </div>
        ))}
        <div className="perf-card"><div className="perf-label">Mutations</div><div className="perf-value">{store.renderCount}</div></div>
      </div>
      <div className="perf-section">
        <div className="perf-section-title">Long Tasks ({p.longTasks.length})</div>
        {p.longTasks.length === 0 && <div className="hudc-empty">Keine Long Tasks</div>}
        {p.longTasks.slice(-15).map((t, i) => (
          <div key={i} className="perf-task"><span>{t.duration}ms</span><span className="mono">@ {t.startTime}ms</span></div>
        ))}
      </div>
    </div>
  );
}

// ── 6. Feed Analysis ──────────────────────────────────────────────────────────
function FeedAnalysisPanel() {
  const f = store.getFeedStatus();
  const checks = [
    ['.hui-shell', f.huiShell], ['.hui-main', f.huiMain], ['.hui-header', f.huiHeader],
    ['.hui-content-inner', f.contentInner], ['.hui-home', f.huiHome],
    ['.home-greeting', f.homeGreeting], ['.hero-wrap', f.heroWrap],
    ['hero-visible class', f.heroVisible], ['.stream-header', f.streamHeader],
    ['.hui-feed', f.huiFeed], ['Feed Cards', f.feedCards, true],
    ['Suspense Active', f.suspenseActive], ['ErrorBoundary Crashed', f.errorBoundaryCrashed, false, true],
  ];
  return (
    <div className="hudc-panel">
      <div className="feed-list">
        {checks.map(([label, val, isCount, isError]) => (
          <div key={label} className={`feed-item ${isError && val ? 'feed-error' : ''}`}>
            <span className="feed-label">{label}</span>
            <span className={`feed-value ${isCount ? 'count' : val ? 'yes' : 'no'}`}>
              {isCount ? val : val ? '✅' : '❌'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 7. CSS Inspector ──────────────────────────────────────────────────────────
function CssInspectorPanel() {
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selector, setSelector] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!picking) return;
    const onHover = (e) => { e.stopPropagation(); e.target.style.outline = '2px solid #7aa2f7'; e.target.style.outlineOffset = '1px'; };
    const onLeave = (e) => { e.stopPropagation(); e.target.style.outline = ''; e.target.style.outlineOffset = ''; };
    const onClick = (e) => {
      e.preventDefault(); e.stopPropagation(); e.target.style.outline = ''; e.target.style.outlineOffset = '';
      setSelected(e.target); setPicking(false);
    };
    document.addEventListener('mouseover', onHover, true);
    document.addEventListener('mouseout', onLeave, true);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('mouseover', onHover, true);
      document.removeEventListener('mouseout', onLeave, true);
      document.removeEventListener('click', onClick, true);
    };
  }, [picking]);

  useEffect(() => { if (selected) setData(store.getComputedStyles(selected)); }, [selected]);

  useEffect(() => {
    if (!selector) return;
    const t = setTimeout(() => {
      try { const el = document.querySelector(selector); if (el) { setSelected(el); setData(store.getComputedStyles(el)); } } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [selector]);

  return (
    <div className="hudc-panel">
      <div className="css-controls">
        <button className={`pick-btn ${picking ? 'active' : ''}`} onClick={() => setPicking(!picking)}>
          {picking ? 'Klicke Element...' : '🎯 Pick Element'}
        </button>
        <input className="css-input" placeholder="CSS Selector..." value={selector} onChange={e => setSelector(e.target.value)} />
      </div>
      {data ? (
        <div className="css-result">
          <div className="css-header">
            <span className="css-tag">{data.tagName}</span>
            {data.id && <span className="css-id">#{data.id}</span>}
            {data.className && <span className="css-class">.{data.className.split(' ').join('.')}</span>}
          </div>
          {data.matchingMediaQueries?.length > 0 && (
            <div className="css-section">
              <div className="css-section-title">Active Media Queries</div>
              {data.matchingMediaQueries.map(q => <div key={q} className="mono small">{q}</div>)}
            </div>
          )}
          <div className="css-section">
            <div className="css-section-title">Computed Styles</div>
            {Object.entries(data.styles).map(([k, v]) => (
              <div key={k} className="css-row"><span className="css-key">{k}</span><span className="css-val">{v}</span></div>
            ))}
          </div>
          {Object.keys(data.inlineVars).length > 0 && (
            <div className="css-section">
              <div className="css-section-title">CSS Variables (inline)</div>
              {Object.entries(data.inlineVars).map(([k, v]) => (
                <div key={k} className="css-row"><span className="css-key">{k}</span><span className="css-val">{v}</span></div>
              ))}
            </div>
          )}
        </div>
      ) : <div className="hudc-empty">Pick ein Element oder enter Selector</div>}
    </div>
  );
}

// ── 8. Responsive / Device ───────────────────────────────────────────────────
function ResponsivePanel() {
  const r = store.getResponsiveInfo();
  const sections = [
    { t: 'Browser', items: [['UA', r.userAgent], ['Vendor', r.vendor], ['Platform', r.platform]] },
    { t: 'Viewport', items: [['innerW', r.innerWidth + 'px'], ['innerH', r.innerHeight + 'px'], ['outerW', r.outerWidth + 'px'], ['outerH', r.outerHeight + 'px'], ['DPR', r.devicePixelRatio], ['docEl', r.docClientWidth + '×' + r.docClientHeight]] },
    { t: 'Screen', items: [['width', r.screenWidth + 'px'], ['height', r.screenHeight + 'px']] },
    ...(r.visualViewport ? [{ t: 'Visual Viewport', items: [['w', r.visualViewport.width + 'px'], ['h', r.visualViewport.height + 'px'], ['scale', r.visualViewport.scale], ['offsetTop', r.visualViewport.offsetTop + 'px']] }] : []),
    { t: 'CSS.supports', items: Object.entries(r.cssSupports).map(([k, v]) => [k, v ? '✅' : '❌']) },
    { t: 'Active Media Queries', items: Object.entries(r.mediaQueries).filter(([, v]) => v).map(([k]) => [k, '✅']) },
  ];
  return (
    <div className="hudc-panel">
      {sections.map(s => (
        <div key={s.t} className="device-section">
          <div className="device-title">{s.t}</div>
          {s.items.map(([k, v]) => (
            <div key={k} className="device-row"><span className="device-key">{k}</span><span className="device-val mono">{String(v).slice(0, 120)}</span></div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── 9. Logging ────────────────────────────────────────────────────────────────
function LoggingPanel() {
  const [filter, setFilter] = useState('all');
  const logs = filter === 'all' ? store.logs : store.logs.filter(l => l.level === filter);
  const colors = { log: '#a9b1d6', warn: '#e0af68', error: '#f7768e', info: '#7dcfff' };
  return (
    <div className="hudc-panel">
      <div className="panel-bar">
        <div className="filter-group">
          {['all', 'log', 'warn', 'error', 'info'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        <button className="btn-clear" onClick={() => { store.logs.length = 0; store._notify(); }}>Clear</button>
      </div>
      <div className="hudc-list">
        {logs.length === 0 && <div className="hudc-empty">Keine Logs (console可能在 Production stripped)</div>}
        {logs.slice().reverse().slice(0, 100).map((l, i) => (
          <div key={i} className="log-item">
            <span className="log-time">{timeStr(l.timestamp)}</span>
            <span className="log-level" style={{ color: colors[l.level] || '#a9b1d6' }}>{l.level}</span>
            <span className="log-msg">{l.args.join(' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 10. Export ─────────────────────────────────────────────────────────────────
function ExportPanel() {
  const [copied, setCopied] = useState(null);
  const doExport = (type) => {
    const content = type === 'json' ? store.exportJSON() : store.exportMarkdown();
    const mime = type === 'json' ? 'application/json' : 'text/markdown';
    store.downloadFile(content, `hui-debug-${Date.now()}.${type === 'json' ? 'json' : 'md'}`, mime);
  };
  const doCopy = async (type) => {
    try {
      await navigator.clipboard.writeText(type === 'json' ? store.exportJSON() : store.exportMarkdown());
      setCopied(type); setTimeout(() => setCopied(null), 2000);
    } catch {}
  };
  const summary = [
    ['DOM Elements', store.getDomSnapshot().length],
    ['Errors', store.errors.length],
    ['Network Requests', store.network.length],
    ['Logs', store.logs.length],
    ['Long Tasks', store.perf.longTasks.length],
    ['Render Mutations', store.renderCount],
  ];
  return (
    <div className="hudc-panel">
      <div className="export-summary">
        <div className="export-title">Debug Report Inhalt</div>
        {summary.map(([k, v]) => <div key={k} className="export-row"><span>{k}</span><span className="mono">{v}</span></div>)}
      </div>
      <div className="export-actions">
        <div className="export-group">
          <div className="export-label">JSON</div>
          <button onClick={() => doExport('json')}>⬇ Download</button>
          <button onClick={() => doCopy('json')}>{copied === 'json' ? '✅ Copied' : '📋 Copy'}</button>
        </div>
        <div className="export-group">
          <div className="export-label">Markdown</div>
          <button onClick={() => doExport('md')}>⬇ Download</button>
          <button onClick={() => doCopy('md')}>{copied === 'md' ? '✅ Copied' : '📋 Copy'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
const PANELS = [
  { id: 'dom', label: 'DOM', comp: DomInspectorPanel },
  { id: 'react', label: 'React', comp: ReactTreePanel },
  { id: 'errors', label: 'Errors', comp: ErrorConsolePanel },
  { id: 'network', label: 'Net', comp: NetworkPanel },
  { id: 'perf', label: 'Perf', comp: PerformancePanel },
  { id: 'feed', label: 'Feed', comp: FeedAnalysisPanel },
  { id: 'css', label: 'CSS', comp: CssInspectorPanel },
  { id: 'device', label: 'Device', comp: ResponsivePanel },
  { id: 'logs', label: 'Logs', comp: LoggingPanel },
  { id: 'export', label: 'Export', comp: ExportPanel },
];

export default function HuiDevConsole() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('dom');
  const [, force] = useReducer(x => x + 1, 0);

  // Store subscription (debounced)
  useEffect(() => {
    let t = null;
    const unsub = store.subscribe(() => {
      if (!t) t = setTimeout(() => { t = null; force(); }, 100);
    });
    return () => { unsub(); if (t) clearTimeout(t); };
  }, []);

  // Auto-refresh timer (500ms when open)
  useEffect(() => {
    if (!open) return;
    const id = setInterval(force, 500);
    return () => clearInterval(id);
  }, [open]);

  // Keyboard shortcut: Ctrl/Cmd+Shift+D
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault(); setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isTouch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;

  if (!open) {
    return (
      <button className="hudc-fab" onClick={() => setOpen(true)} aria-label="Dev Console">
        <span className="hudc-fab-icon">🔧</span>
        {store.errors.length > 0 && <span className="hudc-fab-badge">{store.errors.length}</span>}
      </button>
    );
  }

  const ActivePanel = PANELS.find(p => p.id === active)?.comp;

  return (
    <div className={`hudc-overlay ${isTouch ? 'touch' : ''}`} onKeyDown={e => e.stopPropagation()}>
      <div className="hudc-header">
        <div className="hudc-title">
          <span>HUI Dev Console</span>
          <span className="hudc-info">{store.renderCount} mut · {store.network.length} req · {store.errors.length} err</span>
        </div>
        <button className="hudc-close" onClick={() => setOpen(false)}>✕</button>
      </div>
      <div className="hudc-tabs">
        {PANELS.map(p => (
          <button key={p.id} className={`hudc-tab ${active === p.id ? 'active' : ''}`} onClick={() => setActive(p.id)}>
            {p.label}
            {p.id === 'errors' && store.errors.length > 0 && <span className="tab-badge err">{store.errors.length}</span>}
            {p.id === 'network' && store.network.length > 0 && <span className="tab-badge">{store.network.length}</span>}
            {p.id === 'logs' && store.logs.length > 0 && <span className="tab-badge">{store.logs.length}</span>}
          </button>
        ))}
      </div>
      <div className="hudc-content">{ActivePanel && <ActivePanel />}</div>
    </div>
  );
}
