// ══════════════════════════════════════════════════════════════════════════════
// perf-instrument.js — TEMPORÄRE PERFORMANCE-INSTRUMENTIERUNG (Desktop only)
// ══════════════════════════════════════════════════════════════════════════════
//
// ALLE Funktionen sind No-Ops wenn window.__HUI_PERF__ nicht gesetzt ist.
// Mobile setzt dieses Flag nie → null Overhead auf Mobile.
//
// ENTFERNUNG:
//   1. Diese Datei löschen
//   2. In web-main.jsx: import + initPerf() Zeile entfernen
//   3. In Desktop-Komponenten: PerfProfiler/usePerfMount/usePerfRenders Import + Aufruf entfernen
//   4. In useFeedStream.js: pmark/feedMark Aufrufe entfernen (oder Datei reverted)
//   5. In UnifiedFeed.jsx: PerfProfiler Import + Wrapper entfernen
//
// NUTZUNG:
//   Auto-Report nach 15 Sekunden (console)
//   Manuell: window.__HUI_PERF_REPORT__() in Console aufrufen
//   Shortcut: Ctrl+Shift+P
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, createElement } from 'react';

const PERF = typeof window !== 'undefined' && !!window.__HUI_PERF__;
const _idle = () => {}; // universal no-op

// ─── Metrics Store ──────────────────────────────────────────────────────────
const store = {
  mounts: {},        // { Name: { start, end, duration } }
  renders: {},       // { Name: { count, totalActual, totalBase, phases: {mount:[],update:[]}, lastCommit } }
  queries: [],       // [{ url, name, startTime, duration, transferSize, initiatorType }]
  feedQueries: [],   // [{ table, startTime, duration }]
  images: [],        // [{ src, downloadStart, downloadEnd, decodeMs, naturalW, naturalH, displayW, displayH, size }]
  longTasks: [],     // [{ startTime, duration, name }]
  shifts: [],        // [{ value, startTime, element, text }]
  feed: {
    fetchStart: null,
    fetchEnd: null,
    mergeStart: null,
    mergeEnd: null,
    sortStart: null,
    sortEnd: null,
    firstVisible: null,
    allVisible: null,
    cardCount: 0,
  },
  hero: {
    dataLoad: null,
    imgLoadStart: null,
    imgLoadEnd: null,
    imgDecode: null,
    render: null,
    rotation: null,
  },
  domSnapshot: null,
  clsValue: 0,
  clsEntries: [],
  observers: [],
};

// ─── Performance Marks ──────────────────────────────────────────────────────
export function pmark(name) {
  if (!PERF) return;
  try { performance.mark(`hui:${name}`); } catch (_) {}
}

export function pmeasure(name, startMark, endMark) {
  if (!PERF) return 0;
  try {
    const measureName = `hui:${name}`;
    performance.measure(measureName, `hui:${startMark}`, `hui:${endMark}`);
    const entries = performance.getEntriesByName(measureName, 'measure');
    return entries.length > 0 ? entries[entries.length - 1].duration : 0;
  } catch (_) { return 0; }
}

// ─── Mount Hook ─────────────────────────────────────────────────────────────
export function usePerfMount(name) {
  const startRef = useRef(0);
  if (PERF && !startRef.current) startRef.current = performance.now();

  useEffect(() => {
    if (!PERF) return;
    const end = performance.now();
    const duration = end - startRef.current;
    store.mounts[name] = { start: startRef.current, end, duration };

    console.groupCollapsed(`[PERF MOUNT] ${name} — ${duration.toFixed(1)}ms`);
    console.log(`  Mount Start: ${startRef.current.toFixed(1)}ms`);
    console.log(`  Mount Ende:  ${end.toFixed(1)}ms`);
    console.log(`  Dauer:       ${duration.toFixed(1)}ms`);
    console.groupEnd();
  }, [name]);
}

// ─── Render Counter Hook ─────────────────────────────────────────────────────
export function usePerfRenders(name) {
  const countRef = useRef(0);
  if (PERF) countRef.current++;

  useEffect(() => {
    if (!PERF) return;
    const timer = setTimeout(() => {
      const entry = store.renders[name];
      const count = countRef.current;
      const profilerCount = entry?.count ?? 0;
      console.log(`[PERF RENDERS] ${name}: ${count} hook-renders, ${profilerCount} profiler-renders in 15s`);
    }, 15000);
    return () => clearTimeout(timer);
  }, [name]);
}

// ─── PerfProfiler Component ──────────────────────────────────────────────────
export function PerfProfiler({ id, children }) {
  if (!PERF) return children;

  return createElement(React.Profiler, {
    id,
    onRender: (profilerId, phase, actualDuration, baseDuration, startTime, commitTime) => {
      let entry = store.renders[id];
      if (!entry) {
        entry = store.renders[id] = {
          count: 0,
          totalActual: 0,
          totalBase: 0,
          phases: { mount: [], update: [] },
          lastCommit: 0,
        };
      }
      entry.count++;
      entry.totalActual += actualDuration;
      entry.totalBase += baseDuration;
      entry.lastCommit = commitTime;

      if (phase === 'mount') {
        entry.phases.mount.push({ actualDuration, baseDuration, startTime, commitTime });
        console.log(
          `[PERF PROFILER] ${id} MOUNT — ` +
          `render=${actualDuration.toFixed(1)}ms ` +
          `base=${baseDuration.toFixed(1)}ms ` +
          `commit=${commitTime.toFixed(1)}ms`
        );
      } else {
        entry.phases.update.push({ actualDuration, baseDuration, startTime, commitTime });
      }
    },
  }, children);
}

// ─── Feed Timing Helpers ────────────────────────────────────────────────────
export function feedMark(phase) {
  if (!PERF) return;
  pmark(`feed:${phase}`);
  if (phase === 'fetchStart') store.feed.fetchStart = performance.now();
  if (phase === 'fetchEnd') store.feed.fetchEnd = performance.now();
  if (phase === 'mergeStart') store.feed.mergeStart = performance.now();
  if (phase === 'mergeEnd') store.feed.mergeEnd = performance.now();
  if (phase === 'sortStart') store.feed.sortStart = performance.now();
  if (phase === 'sortEnd') store.feed.sortEnd = performance.now();
  if (phase === 'firstVisible') store.feed.firstVisible = performance.now();
  if (phase === 'allVisible') store.feed.allVisible = performance.now();
}

export function feedQueryTime(table, startTime) {
  if (!PERF) return;
  const duration = performance.now() - startTime;
  store.feedQueries.push({ table, startTime, duration });
}

// ─── Hero Timing Helpers ────────────────────────────────────────────────────
export function heroMark(phase) {
  if (!PERF) return;
  const now = performance.now();
  switch (phase) {
    case 'dataLoad':     store.hero.dataLoad = now; break;
    case 'imgLoadStart': store.hero.imgLoadStart = now; break;
    case 'imgLoadEnd':   store.hero.imgLoadEnd = now; break;
    case 'imgDecode':    store.hero.imgDecode = now; break;
    case 'render':       store.hero.render = now; break;
    case 'rotation':     store.hero.rotation = now; break;
  }
  console.log(`[PERF HERO] ${phase} @ ${now.toFixed(1)}ms`);
}

// ─── DOM Counter ────────────────────────────────────────────────────────────
export function measureDOM() {
  if (!PERF) return;
  const root = document.getElementById('web-root') || document.body;
  const allNodes = root.querySelectorAll('*');
  const feedCards = root.querySelectorAll('[data-feed-card], .feed-card, .ffc-wrap');
  const images = root.querySelectorAll('img');
  const videos = root.querySelectorAll('video');
  const svgs = root.querySelectorAll('svg');

  const snapshot = {
    timestamp: performance.now(),
    totalNodes: allNodes.length,
    feedCards: feedCards.length,
    images: images.length,
    videos: videos.length,
    svgs: svgs.length,
  };
  store.domSnapshot = snapshot;

  console.groupCollapsed('[PERF DOM] First Paint Snapshot');
  console.table(snapshot);
  console.groupEnd();
}

// ─── CLS Tracker ────────────────────────────────────────────────────────────
function setupCLSTracker() {
  if (!PERF || !window.PerformanceObserver) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        store.clsValue += entry.value;
        store.clsEntries.push({
          value: entry.value,
          startTime: entry.startTime,
          element: entry.sources?.[0]?.node?.nodeName || 'unknown',
          text: entry.sources?.[0]?.node?.textContent?.slice(0, 50) || '',
        });
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });
    store.observers.push(observer);
  } catch (_) { /* CLS not supported */ }
}

// ─── Long Task Tracker ─────────────────────────────────────────────────────
function setupLongTaskTracker() {
  if (!PERF || !window.PerformanceObserver) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const task = {
          startTime: entry.startTime,
          duration: entry.duration,
          name: entry.name || 'anonymous',
          attribution: entry.attribution?.map(a => a.name).join(', ') || 'unknown',
        };
        store.longTasks.push(task);
        console.warn(`[PERF LONG TASK] ${task.duration.toFixed(0)}ms @ ${task.startTime.toFixed(0)}ms — ${task.attribution}`);
      }
    });
    observer.observe({ type: 'longtask', buffered: true });
    store.observers.push(observer);
  } catch (_) { /* longtask not supported */ }
}

// ─── Network / Query Tracker (Resource Timing API) ────────────────────────
function setupQueryTracker() {
  if (!PERF || !window.PerformanceObserver) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const url = entry.name || '';
        // Supabase REST API calls
        if (url.includes('/rest/v1/') || url.includes('supabase')) {
          const tableMatch = url.match(/\/rest\/v1\/([^?]+)/);
          const table = tableMatch ? tableMatch[1] : 'unknown';

          store.queries.push({
            url: url.slice(0, 120),
            name: table,
            startTime: entry.startTime,
            duration: entry.duration,
            transferSize: entry.transferSize,
            encodedBodySize: entry.encodedBodySize,
            initiatorType: entry.initiatorType,
            status: 'completed',
          });
        }
        // Image loads
        if (entry.initiatorType === 'img' || /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?|#|$)/i.test(url)) {
          store.images.push({
            src: url.slice(0, 100),
            downloadStart: entry.startTime,
            downloadEnd: entry.startTime + entry.duration,
            duration: entry.duration,
            transferSize: entry.transferSize,
            encodedBodySize: entry.encodedBodySize,
            naturalW: 0, naturalH: 0,
            displayW: 0, displayH: 0,
          });
        }
      }
    });
    observer.observe({ type: 'resource', buffered: true });
    store.observers.push(observer);
  } catch (_) {}
}

// ─── Image Detail Tracker (natural size, display size, decode) ────────────
function setupImageDetailTracker() {
  if (!PERF) return;

  // Track images that load
  document.addEventListener('load', (e) => {
    const target = e.target;
    if (target && target.tagName === 'IMG' && target.src) {
      const entry = store.images.find(img => target.src.includes(img.src)) || {};
      entry.naturalW = target.naturalWidth;
      entry.naturalH = target.naturalHeight;
      entry.displayW = target.offsetWidth || target.clientWidth;
      entry.displayH = target.offsetHeight || target.clientHeight;
      entry.decodeMs = 0;

      // Try to measure decode time
      if (target.decode) {
        const decodeStart = performance.now();
        target.decode().then(() => {
          entry.decodeMs = performance.now() - decodeStart;
        }).catch(_idle);
      }
    }
  }, true);
}

// ─── Feed Visibility Tracker (first card, all cards) ──────────────────────
let feedCardObserver = null;
let feedCardCount = 0;
let feedCardStableTimer = null;

export function setupFeedVisibilityTracker() {
  if (!PERF) return;

  // Use MutationObserver to detect when feed cards appear
  const feedContainer = document.querySelector('.hui-feed') || document.querySelector('[class*="feed"]');

  if (!feedContainer) {
    // Retry after 500ms
    setTimeout(setupFeedVisibilityTracker, 500);
    return;
  }

  feedCardObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        const card = node.matches?.('[data-feed-card], .feed-card, .ffc-wrap, [class*="feed-card"]')
          || node.querySelector?.('[data-feed-card], .feed-card, .ffc-wrap, [class*="feed-card"]');
        if (card) {
          feedCardCount++;
          store.feed.cardCount = feedCardCount;

          if (feedCardCount === 1) {
            feedMark('firstVisible');
            console.log(`[PERF FEED] First card visible @ ${store.feed.firstVisible?.toFixed(1)}ms`);
          }

          // Reset stability timer — if no new card for 500ms, mark all visible
          clearTimeout(feedCardStableTimer);
          feedCardStableTimer = setTimeout(() => {
            feedMark('allVisible');
            console.log(`[PERF FEED] All ${feedCardCount} cards visible @ ${store.feed.allVisible?.toFixed(1)}ms`);
          }, 500);
        }
      }
    }
  });

  feedCardObserver.observe(feedContainer, { childList: true, subtree: true });
  store.observers.push({ disconnect: () => feedCardObserver?.disconnect() });
}

// ─── Concurrent Image Download Counter ─────────────────────────────────────
export function logConcurrentImages() {
  if (!PERF) return;
  const activeDownloads = store.images.filter(img =>
    img.downloadEnd === img.downloadStart + img.duration
  ).length;

  const overlapGroups = [];
  for (let i = 0; i < store.images.length; i++) {
    const a = store.images[i];
    let overlapping = 1;
    for (let j = 0; j < store.images.length; j++) {
      if (i === j) continue;
      const b = store.images[j];
      if (a.downloadStart < b.downloadEnd && a.downloadEnd > b.downloadStart) {
        overlapping++;
      }
    }
    overlapGroups.push({ src: a.src, concurrent: overlapping });
  }

  const maxConcurrent = Math.max(0, ...overlapGroups.map(g => g.concurrent));
  console.log(`[PERF IMAGES] Max concurrent downloads: ${maxConcurrent}`);
  console.log(`[PERF IMAGES] Total images tracked: ${store.images.length}`);

  return { totalImages: store.images.length, maxConcurrent };
}

// ─── Init ──────────────────────────────────────────────────────────────────
export function initPerf() {
  if (!PERF) return;

  console.log('%c[PERF] Instrumentation active — report auto-generates after 15s', 'color:#0DC4B5;font-weight:bold;');
  console.log('%c[PERF] Manual report: window.__HUI_PERF_REPORT__()  |  Shortcut: Ctrl+Shift+P', 'color:#0DC4B5;');

  pmark('app:start');

  setupCLSTracker();
  setupLongTaskTracker();
  setupQueryTracker();
  setupImageDetailTracker();

  // DOM snapshot after first paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      measureDOM();
      setupFeedVisibilityTracker();
    });
  });

  // Auto-report after 15s
  setTimeout(() => {
    console.log('%c[PERF] ═══════════ AUTO REPORT (15s) ═══════════', 'color:#0DC4B5;font-weight:bold;font-size:14px');
    perfReport();
  }, 15000);

  // Ctrl+Shift+P shortcut
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
      e.preventDefault();
      perfReport();
    }
  });

  // Expose manual trigger
  window.__HUI_PERF_REPORT__ = perfReport;
}

// ─── Report Generator ───────────────────────────────────────────────────────
export function perfReport() {
  if (!PERF) {
    console.log('[PERF] Instrumentation not active (window.__HUI_PERF__ not set)');
    return;
  }

  // ═══ 1. COMPONENT MOUNT TABLE ═══
  console.groupCollapsed('%c1. Component Mount Times', 'font-weight:bold;color:#0DC4B5');
  if (Object.keys(store.mounts).length > 0) {
    console.table(Object.entries(store.mounts).map(([name, m]) => ({
      Component: name,
      'Mount Start (ms)': m.start.toFixed(1),
      'Mount Ende (ms)': m.end.toFixed(1),
      'Dauer (ms)': m.duration.toFixed(1),
    })));
  } else {
    console.log('No mount data');
  }
  console.groupEnd();

  // ═══ 2. COMPONENT RENDER STATS ═══
  console.groupCollapsed('%c2. Component Render Stats (React.Profiler)', 'font-weight:bold;color:#0DC4B5');
  if (Object.keys(store.renders).length > 0) {
    console.table(Object.entries(store.renders).map(([name, r]) => ({
      Component: name,
      'Render Count': r.count,
      'Avg Actual (ms)': (r.totalActual / r.count).toFixed(2),
      'Avg Base (ms)': (r.totalBase / r.count).toFixed(2),
      'Total Actual (ms)': r.totalActual.toFixed(1),
      'Total Base (ms)': r.totalBase.toFixed(1),
      'Last Commit (ms)': r.lastCommit.toFixed(1),
      'Mount Count': r.phases.mount.length,
    })));
  } else {
    console.log('No render data');
  }
  console.groupEnd();

  // ═══ 3. FEED TIMINGS ═══
  console.groupCollapsed('%c3. Feed Timings', 'font-weight:bold;color:#0DC4B5');
  const feed = store.feed;
  const feedTable = [];
  if (feed.fetchStart && feed.fetchEnd) feedTable.push({ Phase: 'Fetch (all queries)', 'ms': (feed.fetchEnd - feed.fetchStart).toFixed(1) });
  if (feed.mergeStart && feed.mergeEnd) feedTable.push({ Phase: 'Merge + Normalize', 'ms': (feed.mergeEnd - feed.mergeStart).toFixed(1) });
  if (feed.sortStart && feed.sortEnd) feedTable.push({ Phase: 'Sort', 'ms': (feed.sortEnd - feed.sortStart).toFixed(1) });
  if (feed.fetchStart && feed.firstVisible) feedTable.push({ Phase: 'Time to First Card', 'ms': (feed.firstVisible - feed.fetchStart).toFixed(1) });
  if (feed.fetchStart && feed.allVisible) feedTable.push({ Phase: 'Time to All Cards', 'ms': (feed.allVisible - feed.fetchStart).toFixed(1) });
  if (feed.firstVisible && feed.allVisible) feedTable.push({ Phase: 'First → All (stabilized)', 'ms': (feed.allVisible - feed.firstVisible).toFixed(1) });
  feedTable.push({ Phase: 'Card Count', 'ms': String(feed.cardCount) });
  if (feedTable.length > 1) console.table(feedTable);

  // Individual feed queries
  if (store.feedQueries.length > 0) {
    console.log('Individual Feed Queries:');
    console.table(store.feedQueries.map(q => ({
      Table: q.table,
      'Start (ms)': q.startTime.toFixed(1),
      'Dauer (ms)': q.duration.toFixed(1),
    })));
  }
  console.groupEnd();

  // ═══ 4. FEEDCARD PROFILER ═══
  console.groupCollapsed('%c4. FeedCard Profiler', 'font-weight:bold;color:#0DC4B5');
  const feedCardEntries = Object.entries(store.renders).filter(([name]) => name.startsWith('FeedCard'));
  if (feedCardEntries.length > 0) {
    const cards = feedCardEntries.map(([name, r]) => ({
      Card: name,
      'Renders': r.count,
      'Actual (ms)': r.totalActual.toFixed(2),
      'Base (ms)': r.totalBase.toFixed(2),
      'Commit (ms)': r.lastCommit.toFixed(1),
    }));
    console.table(cards);

    const avgActual = feedCardEntries.reduce((s, [_, r]) => s + r.totalActual, 0) / feedCardEntries.length;
    const avgBase = feedCardEntries.reduce((s, [_, r]) => s + r.totalBase, 0) / feedCardEntries.length;
    console.log(`FeedCard Average: actual=${avgActual.toFixed(2)}ms base=${avgBase.toFixed(2)}ms (n=${feedCardEntries.length})`);
  } else {
    console.log('No FeedCard profiler data');
  }
  console.groupEnd();

  // ═══ 5. IMAGES ═══
  console.groupCollapsed('%c5. Images', 'font-weight:bold;color:#0DC4B5');
  if (store.images.length > 0) {
    const imgs = store.images.map(img => ({
      'Src': img.src.slice(0, 50),
      'Download (ms)': img.duration?.toFixed(1),
      'Decode (ms)': img.decodeMs?.toFixed(1) || 'n/a',
      'Transfer (KB)': img.transferSize ? (img.transferSize / 1024).toFixed(1) : 'n/a',
      'Natural': img.naturalW ? `${img.naturalW}×${img.naturalH}` : 'n/a',
      'Display': img.displayW ? `${img.displayW}×${img.displayH}` : 'n/a',
    }));
    console.table(imgs);

    // Concurrent download analysis
    let maxConcurrent = 0;
    for (let i = 0; i < store.images.length; i++) {
      const a = store.images[i];
      let count = 1;
      for (let j = 0; j < store.images.length; j++) {
        if (i === j) continue;
        const b = store.images[j];
        if (a.downloadStart < b.downloadEnd && a.downloadEnd > b.downloadStart) count++;
      }
      if (count > maxConcurrent) maxConcurrent = count;
    }
    console.log(`Max concurrent image downloads: ${maxConcurrent}`);
  } else {
    console.log('No image data');
  }
  console.groupEnd();

  // ═══ 6. DOM ═══
  console.groupCollapsed('%c6. DOM Snapshot', 'font-weight:bold;color:#0DC4B5');
  if (store.domSnapshot) {
    console.table(store.domSnapshot);
  } else {
    console.log('No DOM snapshot (run measureDOM())');
  }
  console.groupEnd();

  // ═══ 7. CLS ═══
  console.groupCollapsed('%c7. Cumulative Layout Shift (CLS)', 'font-weight:bold;color:#0DC4B5');
  console.log(`CLS Score: ${store.clsValue.toFixed(4)}`);
  if (store.clsEntries.length > 0) {
    const largest = store.clsEntries.reduce((a, b) => a.value > b.value ? a : b);
    console.table({
      'Total Shifts': store.clsEntries.length,
      'CLS Score': store.clsValue.toFixed(4),
      'Largest Shift': largest.value.toFixed(4),
      'Largest Source': largest.element,
      'Source Text': largest.text,
    });
    console.table(store.clsEntries.slice(0, 10).map(s => ({
      'Value': s.value.toFixed(4),
      'Time (ms)': s.startTime.toFixed(1),
      'Element': s.element,
    })));
  } else {
    console.log('No layout shifts detected');
  }
  console.groupEnd();

  // ═══ 8. LONG TASKS ═══
  console.groupCollapsed('%c8. Long Tasks (>50ms)', 'font-weight:bold;color:#0DC4B5');
  if (store.longTasks.length > 0) {
    console.table(store.longTasks.map(t => ({
      'Start (ms)': t.startTime.toFixed(1),
      'Dauer (ms)': t.duration.toFixed(0),
      'Attribution': t.attribution,
    })));
  } else {
    console.log('No long tasks detected');
  }
  console.groupEnd();

  // ═══ 9. RE-RENDERS (15s window) ═══
  console.groupCollapsed('%c9. Re-Render Summary', 'font-weight:bold;color:#0DC4B5');
  if (Object.keys(store.renders).length > 0) {
    console.table(Object.entries(store.renders).map(([name, r]) => ({
      Component: name,
      'Render Count': r.count,
      'Total Actual (ms)': r.totalActual.toFixed(1),
      'Avg Actual (ms)': (r.totalActual / r.count).toFixed(2),
    })).sort((a, b) => b['Total Actual (ms)'] - a['Total Actual (ms)']));
  } else {
    console.log('No render data');
  }
  console.groupEnd();

  // ═══ 10. NETWORK / SUPABASE QUERIES ═══
  console.groupCollapsed('%c10. Network — Supabase Queries', 'font-weight:bold;color:#0DC4B5');
  if (store.queries.length > 0) {
    console.table(store.queries.map(q => ({
      'Table/Name': q.name,
      'Start (ms)': q.startTime.toFixed(1),
      'Dauer (ms)': q.duration.toFixed(1),
      'Size (KB)': q.transferSize ? (q.transferSize / 1024).toFixed(1) : 'n/a',
      'Initiator': q.initiatorType,
    })));
  } else {
    console.log('No Supabase queries tracked');
  }
  console.groupEnd();

  // ═══ 11. HERO ═══
  console.groupCollapsed('%c11. Hero Timings', 'font-weight:bold;color:#0DC4B5');
  const h = store.hero;
  const heroTable = [];
  if (h.dataLoad) heroTable.push({ Phase: 'Data Load', 'ms': h.dataLoad.toFixed(1) });
  if (h.imgLoadStart) heroTable.push({ Phase: 'Image Load Start', 'ms': h.imgLoadStart.toFixed(1) });
  if (h.imgLoadEnd) heroTable.push({ Phase: 'Image Load End', 'ms': h.imgLoadEnd.toFixed(1) });
  if (h.imgLoadStart && h.imgLoadEnd) heroTable.push({ Phase: 'Image Load Duration', 'ms': (h.imgLoadEnd - h.imgLoadStart).toFixed(1) });
  if (h.imgDecode) heroTable.push({ Phase: 'Image Decode', 'ms': h.imgDecode.toFixed(1) });
  if (h.render) heroTable.push({ Phase: 'Render', 'ms': h.render.toFixed(1) });
  if (h.rotation) heroTable.push({ Phase: '8s Rotation', 'ms': h.rotation.toFixed(1) });
  if (heroTable.length > 0) console.table(heroTable);
  else console.log('No hero data');
  console.groupEnd();

  // ═══ 12. FINAL SUMMARY — Top 10 Performance Bremsen ═══
  console.groupCollapsed('%c12. Top-10 Performance Bremsen', 'font-weight:bold;color:#E8876A;font-size:13px');
  const blockers = [];

  // Component render costs
  for (const [name, r] of Object.entries(store.renders)) {
    blockers.push({
      Quelle: name,
      Typ: 'Render',
      'Kosten (ms)': r.totalActual,
      'Detail': `${r.count} renders, avg ${(r.totalActual / r.count).toFixed(1)}ms`,
    });
  }
  // Long tasks
  for (const t of store.longTasks) {
    blockers.push({
      Quelle: `Long Task @ ${t.startTime.toFixed(0)}ms`,
      Typ: 'Long Task',
      'Kosten (ms)': t.duration,
      'Detail': t.attribution,
    });
  }
  // Slow queries
  for (const q of store.queries) {
    if (q.duration > 100) {
      blockers.push({
        Quelle: `Query: ${q.name}`,
        Typ: 'Network',
        'Kosten (ms)': q.duration,
        'Detail': q.transferSize ? `${(q.transferSize / 1024).toFixed(1)} KB` : 'unknown size',
      });
    }
  }
  // Large images
  for (const img of store.images) {
    if (img.transferSize && img.transferSize > 100 * 1024) {
      blockers.push({
        Quelle: `Image: ${img.src.slice(0, 30)}...`,
        Typ: 'Image',
        'Kosten (ms)': img.duration,
        'Detail': `${(img.transferSize / 1024).toFixed(1)} KB`,
      });
    }
  }
  // CLS
  if (store.clsValue > 0.1) {
    blockers.push({
      Quelle: 'Layout Shifts',
      Typ: 'CLS',
      'Kosten (ms)': store.clsValue * 1000,
      'Detail': `CLS=${store.clsValue.toFixed(4)}, ${store.clsEntries.length} shifts`,
    });
  }

  blockers.sort((a, b) => b['Kosten (ms)'] - a['Kosten (ms)']);
  console.table(blockers.slice(0, 10));
  console.groupEnd();

  // ═══ SUMMARY TABLE ═══
  console.groupCollapsed('%c═══ SUMMARY ═══', 'font-weight:bold;color:#0DC4B5;font-size:14px');
  console.table({
    'Queries (total)': store.queries.length,
    'Feed Queries': store.feedQueries.length,
    'Images': store.images.length,
    'Long Tasks': store.longTasks.length,
    'CLS Score': store.clsValue.toFixed(4),
    'DOM Nodes': store.domSnapshot?.totalNodes || 'n/a',
    'Feed Cards': store.domSnapshot?.feedCards || 'n/a',
    'Components Tracked': Object.keys(store.renders).length,
    'Total Render Time (ms)': Object.values(store.renders).reduce((s, r) => s + r.totalActual, 0).toFixed(1),
  });
  console.groupEnd();
}

// ─── Export store for debugging ─────────────────────────────────────────────
window.__HUI_PERF_STORE__ = store;
