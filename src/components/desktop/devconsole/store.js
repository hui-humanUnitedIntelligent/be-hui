// ══════════════════════════════════════════════════════════════════════════════
// store.js — HUI Developer Console Data Collection
// ══════════════════════════════════════════════════════════════════════════════
//
// Sämtliche Datensammlung: Errors, Network, Console, Performance, DOM,
// React Tree, Feed Status, Responsive Info, Export.
//
// Aktivierung: store.activate() installiert globale Hooks.
// Deaktivierung: store.deactivate() entfernt alle Hooks.
//
// Ring-Buffer: max 200 Einträge pro Kategorie → kein Memory Leak.
// Pub/Sub: store.subscribe(fn) → fn wird bei Updates gerufen.
// ══════════════════════════════════════════════════════════════════════════════

class DevConsoleStore {
  constructor() {
    this.active = false;
    this.errors = [];
    this.network = [];
    this.logs = [];
    this.perf = { fcp: null, lcp: null, cls: 0, inp: null, ttfb: null, longTasks: [] };
    this.renderCount = 0;
    this.listeners = new Set();
    this._original = { fetch: null, console: {} };
    this._observers = [];
    this._mutationObserver = null;
    this._rejectionHandler = null;
    this._errorHandler = null;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  activate() {
    if (this.active) return;
    this.active = true;
    this._installErrorHandlers();
    this._installNetworkInterceptor();
    this._installConsoleInterceptor();
    this._installPerformanceObservers();
    this._installMutationObserver();
  }

  deactivate() {
    if (!this.active) return;
    this.active = false;
    window.removeEventListener('error', this._errorHandler);
    window.removeEventListener('unhandledrejection', this._rejectionHandler);
    if (this._original.fetch) window.fetch = this._original.fetch;
    Object.entries(this._original.console).forEach(([level, fn]) => { console[level] = fn; });
    this._observers.forEach(o => { try { o.disconnect(); } catch {} });
    this._observers = [];
    if (this._mutationObserver) this._mutationObserver.disconnect();
  }

  // ── Pub/Sub ─────────────────────────────────────────────────────────────────
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  _notify() { this.listeners.forEach(fn => fn()); }

  // ── Error Handlers ──────────────────────────────────────────────────────────
  _installErrorHandlers() {
    this._errorHandler = (e) => {
      this._pushError({
        type: 'window.error',
        message: e.error?.message || e.message || 'Unknown error',
        stack: e.error?.stack || '',
        source: `${e.filename || ''}:${e.lineno || 0}:${e.colno || 0}`,
        timestamp: Date.now(),
      });
    };
    this._rejectionHandler = (e) => {
      this._pushError({
        type: 'unhandledrejection',
        message: e.reason?.message || String(e.reason),
        stack: e.reason?.stack || '',
        timestamp: Date.now(),
      });
    };
    window.addEventListener('error', this._errorHandler);
    window.addEventListener('unhandledrejection', this._rejectionHandler);
  }

  _pushError(err) {
    this.errors.push(err);
    if (this.errors.length > 200) this.errors.shift();
    this._notify();
  }

  // ── Network Interceptor ─────────────────────────────────────────────────────
  _installNetworkInterceptor() {
    this._original.fetch = window.fetch;
    const self = this;
    window.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : input?.url || '';
      const method = init?.method || 'GET';
      const start = performance.now();

      return self._original.fetch.call(this, input, init).then(res => {
        const end = performance.now();
        self._pushNetwork({
          method, url: url.slice(0, 200),
          status: res.status,
          duration: Math.round(end - start),
          startTime: Math.round(start),
          type: self._classifyRequest(url),
          size: res.headers.get('content-length') || '-',
        });
        return res;
      }).catch(err => {
        const end = performance.now();
        self._pushNetwork({
          method, url: url.slice(0, 200),
          status: 0, duration: Math.round(end - start),
          startTime: Math.round(start), type: 'error',
          error: err.message,
        });
        throw err;
      });
    };
  }

  _classifyRequest(url) {
    if (url.includes('/rest/v1/')) return 'supabase.rest';
    if (url.includes('/rpc/')) return 'supabase.rpc';
    if (url.includes('/auth/v1/')) return 'supabase.auth';
    if (url.includes('/storage/v1/')) return 'supabase.storage';
    if (url.includes('/realtime/')) return 'supabase.realtime';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)/i)) return 'image';
    if (url.includes('/assets/')) return 'asset';
    return 'fetch';
  }

  _pushNetwork(req) {
    this.network.push(req);
    if (this.network.length > 200) this.network.shift();
    this._notify();
  }

  // ── Console Interceptor ──────────────────────────────────────────────────────
  _installConsoleInterceptor() {
    ['log', 'warn', 'error', 'info'].forEach(level => {
      const orig = console[level];
      if (!orig) return;
      this._original.console[level] = orig;
      const self = this;
      console[level] = function(...args) {
        self._pushLog({
          level,
          args: args.map(a => {
            try {
              if (a instanceof Error) return a.message;
              if (typeof a === 'object') return JSON.stringify(a)?.slice(0, 500);
              return String(a).slice(0, 500);
            } catch { return String(a).slice(0, 200); }
          }),
          timestamp: Date.now(),
        });
        return orig.apply(console, args);
      };
    });
  }

  _pushLog(log) {
    this.logs.push(log);
    if (this.logs.length > 200) this.logs.shift();
    this._notify();
  }

  // ── Performance Observers ────────────────────────────────────────────────────
  _installPerformanceObservers() {
    try {
      // FCP + TTFB (one-time)
      const paint = performance.getEntriesByType('paint');
      paint.forEach(e => { if (e.name === 'first-contentful-paint') this.perf.fcp = Math.round(e.startTime); });
      const nav = performance.getEntriesByType('navigation');
      if (nav[0]) this.perf.ttfb = Math.round(nav[0].responseStart);

      // LCP
      const lcpObs = new PerformanceObserver(list => {
        const entries = list.getEntries();
        if (entries.length) this.perf.lcp = Math.round(entries[entries.length - 1].startTime);
        this._notify();
      });
      lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
      this._observers.push(lcpObs);

      // CLS
      let cls = 0;
      const clsObs = new PerformanceObserver(list => {
        for (const e of list.getEntries()) {
          if (!e.hadRecentInput) { cls += e.value; this.perf.cls = Math.round(cls * 10000) / 10000; }
        }
        this._notify();
      });
      clsObs.observe({ type: 'layout-shift', buffered: true });
      this._observers.push(clsObs);

      // Long Tasks
      const ltObs = new PerformanceObserver(list => {
        for (const e of list.getEntries()) {
          this.perf.longTasks.push({ duration: Math.round(e.duration), startTime: Math.round(e.startTime) });
          if (this.perf.longTasks.length > 50) this.perf.longTasks.shift();
        }
        this._notify();
      });
      ltObs.observe({ type: 'longtask', buffered: true });
      this._observers.push(ltObs);

      // INP (simplified)
      let maxINP = 0;
      const inpObs = new PerformanceObserver(list => {
        for (const e of list.getEntries()) {
          if (e.interactionId && e.duration > maxINP) { maxINP = e.duration; this.perf.inp = Math.round(maxINP); }
        }
        this._notify();
      });
      inpObs.observe({ type: 'event', buffered: true });
      this._observers.push(inpObs);
    } catch { /* PerformanceObserver might not support all types */ }
  }

  // ── Mutation Observer (render count proxy) ──────────────────────────────────
  _installMutationObserver() {
    const root = document.getElementById('web-root');
    if (!root) return;
    let timer = null;
    this._mutationObserver = new MutationObserver(() => {
      this.renderCount++;
      if (!timer) {
        timer = setTimeout(() => { timer = null; this._notify(); }, 300);
      }
    });
    this._mutationObserver.observe(root, { childList: true, subtree: true, attributes: true });
  }

  // ── DOM Snapshot ────────────────────────────────────────────────────────────
  getDomSnapshot() {
    const selectors = [
      '#web-root', '#web-root .hui-shell', '#web-root .hui-main',
      '#web-root .hui-header', '#web-root .hui-content',
      '#web-root .hui-content-inner', '#web-root .hui-feed',
      '#web-root .hui-sidebar', '#web-root .hui-rightpanel',
      '#web-root .home-greeting', '#web-root .hero-wrap',
      '#web-root .stream-header', '#web-root .hui-home',
    ];
    return selectors.map(sel => {
      const el = document.querySelector(sel);
      if (!el) return { selector: sel, exists: false };
      const c = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        selector: sel, exists: true,
        height: c.height, width: c.width,
        display: c.display, visibility: c.visibility, opacity: c.opacity,
        overflow: c.overflow, overflowY: c.overflowY, overflowX: c.overflowX,
        zIndex: c.zIndex, position: c.position,
        flex: c.flex, flexDirection: c.flexDirection, flexShrink: c.flexShrink,
        alignItems: c.alignItems, minHeight: c.minHeight, maxHeight: c.maxHeight,
        rectH: Math.round(r.height), rectW: Math.round(r.width),
        rectTop: Math.round(r.top), rectLeft: Math.round(r.left),
        childCount: el.children.length,
      };
    });
  }

  // ── React Fiber Tree ─────────────────────────────────────────────────────────
  getReactTree() {
    const container = document.getElementById('web-root');
    if (!container) return null;
    const key = Object.keys(container).find(k =>
      k.startsWith('__reactContainer$') || k.startsWith('__reactFiber$'));
    if (!key) return null;
    return this._traverseFiber(container[key], 0, 15);
  }

  _traverseFiber(fiber, depth, maxDepth) {
    if (!fiber || depth > maxDepth) return null;
    let name = 'unknown', type = 'unknown';

    if (typeof fiber.type === 'function') {
      name = fiber.type.displayName || fiber.type.name || 'Anonymous';
      type = fiber.type.prototype?.isReactComponent ? 'class' : 'function';
    } else if (typeof fiber.type === 'string') {
      name = fiber.type; type = 'host';
    } else if (fiber.type?.$$typeof) {
      const ts = fiber.type.$$typeof.toString();
      if (ts.includes('memo')) { name = fiber.type.type?.displayName || fiber.type.type?.name || 'Memo'; type = 'memo'; }
      else if (ts.includes('lazy')) { name = 'Lazy'; type = 'lazy'; }
      else if (ts.includes('provider')) { name = 'Provider'; type = 'context'; }
      else { name = 'Symbol'; type = 'symbol'; }
    } else if (fiber.type === null) { name = 'HostRoot'; type = 'root'; }

    const node = {
      name, type, depth,
      props: fiber.memoizedProps ? Object.keys(fiber.memoizedProps).filter(k => k !== 'children').slice(0, 8) : [],
      hasState: !!fiber.memoizedState,
      children: [],
    };

    let child = fiber.child;
    while (child) {
      const cn = this._traverseFiber(child, depth + 1, maxDepth);
      if (cn) node.children.push(cn);
      child = child.sibling;
    }
    return node;
  }

  // ── Feed Status ──────────────────────────────────────────────────────────────
  getFeedStatus() {
    return {
      huiFeed: !!document.querySelector('#web-root .hui-feed'),
      feedCards: document.querySelectorAll('#web-root .hui-feed-card').length,
      homeGreeting: !!document.querySelector('#web-root .home-greeting'),
      heroWrap: !!document.querySelector('#web-root .hero-wrap'),
      heroVisible: document.querySelector('#web-root .hero-wrap')?.classList.contains('hero-visible'),
      streamHeader: !!document.querySelector('#web-root .stream-header'),
      suspenseActive: !!document.querySelector('#web-root .feed-loading'),
      contentInner: !!document.querySelector('#web-root .hui-content-inner'),
      huiHome: !!document.querySelector('#web-root .hui-home'),
      errorBoundaryCrashed: !!document.querySelector('[class*="crashed"]'),
      huiHeader: !!document.querySelector('#web-root .hui-header'),
      huiMain: !!document.querySelector('#web-root .hui-main'),
      huiShell: !!document.querySelector('#web-root .hui-shell'),
    };
  }

  // ── Responsive Info ──────────────────────────────────────────────────────────
  getResponsiveInfo() {
    return {
      userAgent: navigator.userAgent,
      vendor: navigator.vendor,
      platform: navigator.platform,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      devicePixelRatio: window.devicePixelRatio,
      screenWidth: screen.width, screenHeight: screen.height,
      docClientWidth: document.documentElement.clientWidth,
      docClientHeight: document.documentElement.clientHeight,
      visualViewport: window.visualViewport ? {
        width: Math.round(window.visualViewport.width),
        height: Math.round(window.visualViewport.height),
        offsetTop: Math.round(window.visualViewport.offsetTop),
        scale: window.visualViewport.scale,
      } : null,
      cssSupports: {
        '100dvh': CSS.supports('height', '100dvh'),
        '100svh': CSS.supports('height', '100svh'),
        '100lvh': CSS.supports('height', '100lvh'),
      },
      mediaQueries: {
        '(max-width:768px)': matchMedia('(max-width: 768px)').matches,
        '(max-width:1100px)': matchMedia('(max-width: 1100px)').matches,
        '(max-width:1280px)': matchMedia('(max-width: 1280px)').matches,
        '(min-width:1280px)': matchMedia('(min-width: 1280px)').matches,
        '(orientation:portrait)': matchMedia('(orientation: portrait)').matches,
        '(orientation:landscape)': matchMedia('(orientation: landscape)').matches,
        '(pointer:coarse)': matchMedia('(pointer: coarse)').matches,
        '(pointer:fine)': matchMedia('(pointer: fine)').matches,
        '(hover:hover)': matchMedia('(hover: hover)').matches,
        '(hover:none)': matchMedia('(hover: none)').matches,
      },
    };
  }

  // ── CSS Inspector (computed styles for any element) ─────────────────────────
  getComputedStyles(element) {
    if (!element) return null;
    const c = getComputedStyle(element);
    const props = [
      'display', 'visibility', 'opacity', 'position', 'zIndex',
      'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
      'overflow', 'overflowX', 'overflowY',
      'flex', 'flexDirection', 'flexShrink', 'flexGrow', 'flexBasis',
      'alignItems', 'alignSelf', 'justifyContent', 'gap',
      'gridTemplateColumns', 'gridTemplateRows',
      'margin', 'padding', 'border',
      'top', 'right', 'bottom', 'left',
      'transform', 'transition', 'animation', 'willChange',
      'background', 'color', 'fontSize', 'fontFamily',
    ];
    const result = {};
    props.forEach(p => { if (c[p] !== undefined) result[p] = c[p]; });

    // CSS Variables
    const vars = {};
    for (let i = 0; i < element.style.length; i++) {
      const name = element.style[i];
      if (name.startsWith('--')) vars[name] = element.style.getPropertyValue(name);
    }
    const computedVars = {};
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.style) {
            for (let j = 0; j < rule.style.length; j++) {
              const name = rule.style[j];
              if (name.startsWith('--')) computedVars[name] = rule.style.getPropertyValue(name);
            }
          }
        }
      } catch {}
    }
    return {
      tagName: element.tagName,
      className: element.className?.toString?.() || '',
      id: element.id || '',
      styles: result,
      inlineVars: vars,
      definedVars: Object.fromEntries(Object.entries(computedVars).slice(0, 30)),
      matchingMediaQueries: this._getMatchingMediaQueries(),
    };
  }

  _getMatchingMediaQueries() {
    const queries = [
      '(max-width: 768px)', '(max-width: 1100px)', '(max-width: 1280px)',
      '(min-width: 1280px)', '(min-width: 1440px)', '(min-width: 1600px)',
      '(orientation: portrait)', '(orientation: landscape)',
    ];
    return queries.filter(q => matchMedia(q).matches);
  }

  // ── Export Report ────────────────────────────────────────────────────────────
  exportJSON() {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      browser: this.getResponsiveInfo(),
      dom: this.getDomSnapshot(),
      reactTree: this.getReactTree(),
      errors: this.errors,
      network: this.network,
      performance: this.perf,
      feed: this.getFeedStatus(),
      renderCount: this.renderCount,
      logs: this.logs,
    };
    return JSON.stringify(report, null, 2);
  }

  exportMarkdown() {
    const r = this.getResponsiveInfo();
    const d = this.getDomSnapshot();
    const f = this.getFeedStatus();
    let md = `# HUI Debug Report\n\n**Generated:** ${new Date().toISOString()}\n**URL:** ${window.location.href}\n\n`;

    md += `## Browser & Viewport\n\n`;
    md += `- **UA:** ${r.userAgent}\n- **Vendor:** ${r.vendor}\n- **Platform:** ${r.platform}\n`;
    md += `- **Viewport:** ${r.innerWidth}×${r.innerHeight} (outer: ${r.outerWidth}×${r.outerHeight})\n`;
    md += `- **Screen:** ${r.screenWidth}×${r.screenHeight}\n- **DPR:** ${r.devicePixelRatio}\n`;
    md += `- **Media Queries:** ${Object.entries(r.mediaQueries).filter(([,v]) => v).map(([k]) => k).join(', ')}\n\n`;

    md += `## DOM Snapshot\n\n`;
    md += `| Selector | Exists | Height | Width | Display | Rect H |\n|---|---|---|---|---|---|\n`;
    d.forEach(e => {
      md += `| ${e.selector} | ${e.exists ? '✅' : '❌'} | ${e.height || '-'} | ${e.width || '-'} | ${e.display || '-'} | ${e.rectH || '-'} |\n`;
    });

    md += `\n## Feed Status\n\n`;
    md += `- huiShell: ${f.huiShell ? '✅' : '❌'}\n- huiMain: ${f.huiMain ? '✅' : '❌'}\n`;
    md += `- huiHeader: ${f.huiHeader ? '✅' : '❌'}\n- huiFeed: ${f.huiFeed ? '✅' : '❌'}\n`;
    md += `- Feed Cards: ${f.feedCards}\n- Suspense Active: ${f.suspenseActive ? '✅' : 'no'}\n`;
    md += `- ErrorBoundary Crashed: ${f.errorBoundaryCrashed ? '❌ YES' : 'no'}\n`;
    md += `- Greeting: ${f.homeGreeting ? '✅' : '❌'}\n- Hero: ${f.heroWrap ? '✅' : '❌'}\n`;

    md += `\n## Performance\n\n`;
    md += `- FCP: ${this.perf.fcp}ms\n- LCP: ${this.perf.lcp}ms\n- CLS: ${this.perf.cls}\n`;
    md += `- TTFB: ${this.perf.ttfb}ms\n- INP: ${this.perf.inp}ms\n`;
    md += `- Long Tasks: ${this.perf.longTasks.length}\n- Render Count (mutations): ${this.renderCount}\n`;

    md += `\n## Errors (${this.errors.length})\n\n`;
    this.errors.slice(-20).forEach(e => {
      md += `### ${e.type} — ${new Date(e.timestamp).toISOString()}\n- ${e.message}\n`;
      if (e.stack) md += `\n\`\`\`\n${e.stack.slice(0, 500)}\n\`\`\`\n`;
    });

    md += `\n## Network (${this.network.length})\n\n`;
    md += `| Method | URL | Status | Duration | Type |\n|---|---|---|---|---|\n`;
    this.network.slice(-30).forEach(n => {
      md += `| ${n.method} | ${n.url.slice(0, 60)} | ${n.status} | ${n.duration}ms | ${n.type} |\n`;
    });

    return md;
  }

  downloadFile(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export const store = new DevConsoleStore();
