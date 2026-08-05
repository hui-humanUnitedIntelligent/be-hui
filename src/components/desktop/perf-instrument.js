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
  realtime: {
    channels: [],       // [{ name, creationTime, subscribedTime, timeToSubscribed, tables: [], eventTypes: [], eventCount, events: [], unsubscribedTime, lifetime, status, duplicate }]
    activeCount: 0,
    totalEvents: 0,
    duplicateCount: 0,
  },
  // ─── User Perceived Performance ───
  perceived: {
    appBoot: null,           // performance.now() at initPerf()
    fmp: null,               // First Meaningful Paint — Sidebar+Header+Hero all visible
    tti: null,               // Time to Interactive — Search+Sidebar+Feed usable
    feedReady: null,         // 5 cards rendered + images decoded
    rightPanelReady: null,  // Right panel visible + interactive
    heroReady: null,         // Hero image loaded + decoded
    idleTime: null,          // First moment with no long tasks for 1s
    cpuBusyTime: 0,          // Sum of all long tasks until TTI
    feedCardImagesDecoded: 0,
    _idleTimer: null,
    _mountedComponents: new Set(),
    _feedCardImagesLoaded: 0,
    _heroImgDecoded: false,
    _rightPanelInteractive: false,
  },
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
  if (phase === 'firstVisible') { store.feed.firstVisible = performance.now(); checkTTI(); }
  if (phase === 'allVisible') { store.feed.allVisible = performance.now(); checkFeedReady(); }
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
    case 'imgLoadEnd':   store.hero.imgLoadEnd = now; checkHeroReady(); break;
    case 'imgDecode':    store.hero.imgDecode = now; store.perceived._heroImgDecoded = true; break;
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
      // Check if this is a feed card image
      const feedCard = target.closest('[data-feed-card], .feed-card, .ffc-wrap, [class*="feed-card"]');
      if (feedCard) {
        trackFeedCardImageDecoded();
      }
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
          // Check if this is the hero image
          if (target.closest('.hero-wrap, .hero-card, [class*="hero"]')) {
            heroMark('imgDecode');
            checkHeroReady();
          }
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


// ─── Realtime Subscription Tracker ───────────────────────────────────────────
// Patcht supabase.channel() um alle Realtime-Subscriptions abzufangen.
// Erfasst: Erstellung, SUBSCRIBED-Status, Events, Event-Typen, Lifetime, Duplicates.
async function setupRealtimeTracker() {
  if (!PERF) return;

  try {
    const { supabase } = await import('../../lib/supabaseClient.js');
    if (!supabase || !supabase.channel) {
      console.warn('[PERF RT] supabase.channel not found — realtime tracking disabled');
      return;
    }

    const originalChannel = supabase.channel.bind(supabase);
    const originalRemoveChannel = supabase.removeChannel ? supabase.removeChannel.bind(supabase) : null;

    supabase.channel = function(name, options) {
      const channel = originalChannel(name, options);
      const creationTime = performance.now();

      const channelInfo = {
        name: name || 'unnamed',
        creationTime,
        subscribeCallTime: null,
        subscribedTime: null,
        timeToSubscribed: null,
        tables: [],
        eventTypes: [],
        eventCount: 0,
        events: [],
        unsubscribedTime: null,
        lifetime: null,
        status: 'created',
        duplicate: false,
      };

      // Duplicate detection: same channel name already exists
      const existing = store.realtime.channels.find(c => c.name === channelInfo.name);
      if (existing) {
        channelInfo.duplicate = true;
        existing.duplicate = true;
        store.realtime.duplicateCount = store.realtime.channels.filter(c =>
          c.duplicate || store.realtime.channels.filter(o => o.name === c.name).length > 1
        ).length;
      }
      store.realtime.channels.push(channelInfo);
      store.realtime.activeCount = store.realtime.channels.filter(c => c.status !== 'unsubscribed').length;

      // Wrap .on(type, filter, callback)
      const originalOn = channel.on ? channel.on.bind(channel) : null;
      if (originalOn) {
        channel.on = function(type, filter, callback) {
          // Track postgres_changes events
          if (type === 'postgres_changes') {
            const tableName = filter?.table || 'unknown';
            const eventType = filter?.event || 'any';
            if (!channelInfo.tables.includes(tableName)) channelInfo.tables.push(tableName);
            if (!channelInfo.eventTypes.includes(eventType)) channelInfo.eventTypes.push(eventType);
          } else {
            if (!channelInfo.eventTypes.includes(type)) channelInfo.eventTypes.push(type);
          }

          // Wrap callback to count events
          const wrappedCallback = function(payload) {
            channelInfo.eventCount++;
            store.realtime.totalEvents++;
            const evtType = payload?.eventType || type || 'unknown';
            const evtTable = payload?.table || (filter?.table) || 'unknown';
            channelInfo.events.push({
              time: performance.now(),
              type: evtType,
              table: evtTable,
            });
            // Keep only last 50 events per channel to avoid memory bloat
            if (channelInfo.events.length > 50) channelInfo.events.shift();
            if (callback) return callback(payload);
          };
          return originalOn(type, filter, wrappedCallback);
        };
      }

      // Wrap .subscribe(callback)
      const originalSubscribe = channel.subscribe ? channel.subscribe.bind(channel) : null;
      if (originalSubscribe) {
        channel.subscribe = function(callback) {
          channelInfo.subscribeCallTime = performance.now();
          channelInfo.status = 'connecting';

          const wrappedCallback = function(status, error) {
            if (status === 'SUBSCRIBED') {
              channelInfo.subscribedTime = performance.now();
              channelInfo.timeToSubscribed = channelInfo.subscribedTime - channelInfo.subscribeCallTime;
              channelInfo.status = 'subscribed';
              console.log(`[PERF RT] Channel "${channelInfo.name}" SUBSCRIBED in ${channelInfo.timeToSubscribed.toFixed(0)}ms`);
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              channelInfo.status = status.toLowerCase();
              console.warn(`[PERF RT] Channel "${channelInfo.name}" status: ${status}`);
            }
            if (callback) return callback(status, error);
          };
          return originalSubscribe(wrappedCallback);
        };
      }

      // Wrap .unsubscribe()
      const originalUnsubscribe = channel.unsubscribe ? channel.unsubscribe.bind(channel) : null;
      if (originalUnsubscribe) {
        channel.unsubscribe = function() {
          channelInfo.unsubscribedTime = performance.now();
          channelInfo.lifetime = channelInfo.unsubscribedTime - channelInfo.creationTime;
          channelInfo.status = 'unsubscribed';
          store.realtime.activeCount = store.realtime.channels.filter(c => c.status !== 'unsubscribed').length;
          console.log(`[PERF RT] Channel "${channelInfo.name}" UNSUBSCRIBED — lifetime ${channelInfo.lifetime?.toFixed(0)}ms, ${channelInfo.eventCount} events`);
          return originalUnsubscribe();
        };
      }

      console.log(`[PERF RT] Channel "${channelInfo.name}" created @ ${creationTime.toFixed(1)}ms — tables: ${channelInfo.tables.join(', ') || 'pending'}`);
      return channel;
    };

    // Wrap removeChannel to detect cleanup
    if (originalRemoveChannel) {
      supabase.removeChannel = function(channel) {
        if (channel) {
          const info = store.realtime.channels.find(c => c.name === (channel?.name || channel?.topic));
          if (info && info.status !== 'unsubscribed') {
            info.unsubscribedTime = performance.now();
            info.lifetime = info.unsubscribedTime - info.creationTime;
            info.status = 'removed';
          }
        }
        store.realtime.activeCount = store.realtime.channels.filter(c => c.status !== 'unsubscribed' && c.status !== 'removed').length;
        return originalRemoveChannel(channel);
      };
    }

    console.log('[PERF RT] Realtime tracker active — supabase.channel() patched');
  } catch (e) {
    console.warn('[PERF RT] Could not setup realtime tracker:', e.message);
  }
}


// ─── User Perceived Performance Trackers ────────────────────────────────────

// Track component mounts for FMP detection
const _origUsePerfMount = usePerfMount;
export function usePerfMountPerceived(name) {
  const startRef = useRef(0);
  if (PERF && !startRef.current) startRef.current = performance.now();

  useEffect(() => {
    if (!PERF) return;
    const end = performance.now();
    const duration = end - startRef.current;
    store.mounts[name] = { start: startRef.current, end, duration };
    store.perceived._mountedComponents.add(name);

    console.groupCollapsed(`[PERF MOUNT] ${name} — ${duration.toFixed(1)}ms`);
    console.log(`  Mount Start: ${startRef.current.toFixed(1)}ms`);
    console.log(`  Mount Ende:  ${end.toFixed(1)}ms`);
    console.log(`  Dauer:       ${duration.toFixed(1)}ms`);
    console.groupEnd();

    checkFMP();
    checkTTI();
  }, [name]);
}

// Check First Meaningful Paint: Sidebar + Header + Hero all mounted
function checkFMP() {
  if (!PERF || store.perceived.fmp) return;
  const required = ['DesktopSidebar', 'DesktopHeader', 'DesktopHome'];
  const allMounted = required.every(c => store.perceived._mountedComponents.has(c));
  if (allMounted) {
    // FMP = latest mount end time of the three
    const times = required.map(c => store.mounts[c]?.end || 0);
    store.perceived.fmp = Math.max(...times);
    console.log(`[PERF PERCEIVED] First Meaningful Paint @ ${store.perceived.fmp.toFixed(0)}ms`);
  }
}

// Check Time to Interactive: Search (header) + Sidebar + Feed first card
function checkTTI() {
  if (!PERF || store.perceived.tti) return;
  const sidebarMounted = store.perceived._mountedComponents.has('DesktopSidebar');
  const headerMounted = store.perceived._mountedComponents.has('DesktopHeader');
  const feedHasCards = store.feed.firstVisible !== null;

  if (sidebarMounted && headerMounted && feedHasCards) {
    store.perceived.tti = Math.max(
      store.mounts['DesktopSidebar']?.end || 0,
      store.mounts['DesktopHeader']?.end || 0,
      store.feed.firstVisible || 0
    );
    console.log(`[PERF PERCEIVED] Time to Interactive @ ${store.perceived.tti.toFixed(0)}ms`);

    // Calculate CPU busy time (sum of long tasks until TTI)
    store.perceived.cpuBusyTime = store.longTasks
      .filter(t => t.startTime < store.perceived.tti)
      .reduce((s, t) => s + t.duration, 0);
    console.log(`[PERF PERCEIVED] CPU Busy Time (until TTI): ${store.perceived.cpuBusyTime.toFixed(0)}ms`);
  }
}

// Track feed card images decoded for Feed Ready
export function trackFeedCardImageDecoded() {
  if (!PERF) return;
  store.perceived._feedCardImagesLoaded++;
  checkFeedReady();
}

// Check Feed Ready: 5 cards rendered + images decoded
function checkFeedReady() {
  if (!PERF || store.perceived.feedReady) return;
  if (store.feed.cardCount >= 5 && store.perceived._feedCardImagesLoaded >= 5) {
    store.perceived.feedReady = performance.now();
    console.log(`[PERF PERCEIVED] Feed Ready (5 cards + images) @ ${store.perceived.feedReady.toFixed(0)}ms`);
  }
}

// Mark right panel as interactive
export function markRightPanelReady() {
  if (!PERF || store.perceived.rightPanelReady) return;
  store.perceived.rightPanelReady = performance.now();
  store.perceived._rightPanelInteractive = true;
  console.log(`[PERF PERCEIVED] Right Panel Ready @ ${store.perceived.rightPanelReady.toFixed(0)}ms`);
}

// Check Hero Ready: image loaded + decoded
function checkHeroReady() {
  if (!PERF || store.perceived.heroReady) return;
  if (store.hero.imgLoadEnd && store.hero.imgDecode) {
    store.perceived.heroReady = Math.max(store.hero.imgLoadEnd, store.hero.imgDecode);
    console.log(`[PERF PERCEIVED] Hero Ready @ ${store.perceived.heroReady.toFixed(0)}ms`);
  } else if (store.hero.imgLoadEnd && !store.perceived._heroImgDecoded) {
    // If decode wasn't explicitly tracked, use load end as proxy
    store.perceived.heroReady = store.hero.imgLoadEnd;
    console.log(`[PERF PERCEIVED] Hero Ready (image loaded, decode untracked) @ ${store.perceived.heroReady.toFixed(0)}ms`);
  }
}

// Idle Time: no long tasks for 1 second
function setupIdleTracker() {
  if (!PERF) return;

  const checkIdle = () => {
    if (store.perceived.idleTime) return;

    const lastLongTask = store.longTasks.length > 0
      ? store.longTasks[store.longTasks.length - 1]
      : null;
    const lastTaskEnd = lastLongTask ? lastLongTask.startTime + lastLongTask.duration : 0;
    const now = performance.now();

    if (now - lastTaskEnd > 1000) {
      store.perceived.idleTime = lastTaskEnd > 0 ? lastTaskEnd : now;
      console.log(`[PERF PERCEIVED] Idle Time @ ${store.perceived.idleTime.toFixed(0)}ms (no long tasks for 1s)`);
    } else {
      // Re-check in 200ms
      setTimeout(checkIdle, 200);
    }
  };

  // Start checking after 2s
  setTimeout(checkIdle, 2000);
}

// Periodic re-check for perceived metrics (catches async events)
function setupPerceivedRechecker() {
  if (!PERF) return;
  const recheck = () => {
    checkFMP();
    checkTTI();
    checkFeedReady();
    checkHeroReady();
  };
  // Re-check every 500ms for 20 seconds
  let count = 0;
  const interval = setInterval(() => {
    recheck();
    count++;
    if (count >= 40) clearInterval(interval);
  }, 500);
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
  setupRealtimeTracker();
  setupIdleTracker();
  setupPerceivedRechecker();

  // Record app boot time
  store.perceived.appBoot = performance.now();

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


  // ═══ 13. REALTIME SUBSCRIPTIONS ═══
  console.groupCollapsed('%c13. Realtime Subscriptions', 'font-weight:bold;color:#0DC4B5');
  const rt = store.realtime;
  const channels = rt.channels;

  if (channels.length > 0) {
    // Main table: Channel | Status | Events | Lifetime | Duplicate
    console.table(channels.map(c => ({
      'Channel': c.name,
      'Status': c.status,
      'Events': c.eventCount,
      'Lifetime (ms)': c.lifetime ? c.lifetime.toFixed(0) : (c.status === 'unsubscribed' || c.status === 'removed' ? 'n/a' : 'active'),
      'Duplicate': c.duplicate ? 'YES' : 'no',
    })));

    // Detail table: creation, subscribe time, time to SUBSCRIBED, tables, event types
    console.table(channels.map(c => ({
      'Channel': c.name,
      'Created (ms)': c.creationTime.toFixed(1),
      'Subscribed (ms)': c.subscribedTime ? c.subscribedTime.toFixed(1) : 'n/a',
      'Time to SUBSCRIBED (ms)': c.timeToSubscribed ? c.timeToSubscribed.toFixed(0) : 'n/a',
      'Tables': c.tables.join(', ') || 'none',
      'Event Types': c.eventTypes.join(', ') || 'none',
    })));

    // Event log per channel (first 5 events each)
    for (const c of channels) {
      if (c.events.length > 0) {
        console.log(`Events for "${c.name}" (${c.eventCount} total, showing first 5):`);
        console.table(c.events.slice(0, 5).map(e => ({
          'Time (ms)': e.time.toFixed(1),
          'Type': e.type,
          'Table': e.table,
        })));
      }
    }

    // Duplicate analysis
    const nameCounts = {};
    for (const c of channels) {
      nameCounts[c.name] = (nameCounts[c.name] || 0) + 1;
    }
    const duplicates = Object.entries(nameCounts).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      console.warn('Duplicate channels detected:');
      console.table(duplicates.map(([name, count]) => ({
        'Channel': name,
        'Instances': count,
      })));
    }
  } else {
    console.log('No realtime channels tracked');
  }
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

  // Realtime overhead
  for (const c of store.realtime.channels) {
    if (c.eventCount > 20) {
      blockers.push({
        Quelle: `RT Channel: ${c.name}`,
        Typ: 'Realtime',
        'Kosten (ms)': c.eventCount * 0.5, // estimated 0.5ms per event handler
        'Detail': `${c.eventCount} events, ${c.tables.join(', ')}`,
      });
    }
    if (c.timeToSubscribed && c.timeToSubscribed > 2000) {
      blockers.push({
        Quelle: `RT Subscribe: ${c.name}`,
        Typ: 'Realtime',
        'Kosten (ms)': c.timeToSubscribed,
        'Detail': `Slow subscribe: ${c.timeToSubscribed.toFixed(0)}ms`,
      });
    }
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
    'RT Channels (total)': store.realtime.channels.length,
    'RT Channels (active)': store.realtime.activeCount,
    'RT Events (total)': store.realtime.totalEvents,
    'RT Duplicates': store.realtime.duplicateCount,
  });
  console.groupEnd();

  // ═══ REALTIME EMPFEHLUNG ═══
  console.groupCollapsed('%c═══ REALTIME ZUSAMMENFASSUNG ═══', 'font-weight:bold;color:#E8876A;font-size:13px');
  const rtSummary = store.realtime;
  const allChannels = rtSummary.channels;
  const activeChannels = allChannels.filter(c => c.status === 'subscribed' || c.status === 'connecting');
  const unsubscribedChannels = allChannels.filter(c => c.status === 'unsubscribed' || c.status === 'removed');
  const nameMap = {};
  for (const c of allChannels) {
    if (!nameMap[c.name]) nameMap[c.name] = [];
    nameMap[c.name].push(c);
  }
  const dupes = Object.entries(nameMap).filter(([_, arr]) => arr.length > 1);

  console.table({
    'Aktiver Channels': activeChannels.length,
    'Insgesamt erstellt': allChannels.length,
    'Abbestellt': unsubscribedChannels.length,
    'Empfangene Events': rtSummary.totalEvents,
    'Doppelte Channels': dupes.length,
  });

  if (dupes.length > 0) {
    console.warn('Doppelte Channels gefunden:');
    console.table(dupes.map(([name, arr]) => ({
      'Channel': name,
      'Instanzen': arr.length,
      'Tables': arr.map(c => c.tables.join(', ')).join(' | '),
      'Events': arr.reduce((s, c) => s + c.eventCount, 0),
    })));
  }

  // Empfehlung
  const recommendations = [];
  if (dupes.length > 0) {
    recommendations.push(`${dupes.length} doppelte Channel(s) — zusammenführen um ${dupes.reduce((s, [_, arr]) => s + (arr.length - 1), 0)} WebSocket-Verbindung(en) zu sparen.`);
  }
  if (activeChannels.length > 5) {
    recommendations.push(`${activeChannels.length} aktive Channels — prüfen ob alle benötigt werden (z.B. bei Tab-Wechsel pausieren).`);
  }
  if (rtSummary.totalEvents === 0) {
    recommendations.push('Keine Realtime-Events empfangen — Channels evtl. nicht korrekt subscribed.');
  }
  // Slow subscribe detection
  const slowChannels = allChannels.filter(c => c.timeToSubscribed && c.timeToSubscribed > 2000);
  if (slowChannels.length > 0) {
    recommendations.push(`${slowChannels.length} Channel(s) mit langsamer Subscribe-Zeit (>2s): ${slowChannels.map(c => c.name).join(', ')}`);
  }
  // High event rate
  const highEventChannels = allChannels.filter(c => c.eventCount > 50);
  if (highEventChannels.length > 0) {
    recommendations.push(`${highEventChannels.length} Channel(s) mit hoher Event-Rate (>50 events): ${highEventChannels.map(c => `${c.name}(${c.eventCount})`).join(', ')}`);
  }

  if (recommendations.length > 0) {
    console.log('Empfehlungen zur Reduzierung:');
    recommendations.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
  } else {
    console.log('Keine Optimierung empfohlen — Realtime-Konfiguration sieht gut aus.');
  }
  console.groupEnd();
}

  // ═══ 14. USER PERCEIVED PERFORMANCE ═══
  console.groupCollapsed('%c14. User Perceived Performance', 'font-weight:bold;color:#E8876A;font-size:13px');
  const p = store.perceived;
  const bootTime = p.appBoot || 0;

  const perceivedTable = [];
  if (bootTime) perceivedTable.push({ Metric: 'Boot Time (initPerf)', 'ms': bootTime.toFixed(0), 'rel (ms)': '0' });
  if (p.fmp) perceivedTable.push({ Metric: 'First Meaningful Paint', 'ms': p.fmp.toFixed(0), 'rel (ms)': (p.fmp - bootTime).toFixed(0) });
  if (p.heroReady) perceivedTable.push({ Metric: 'Hero Ready (img + decode)', 'ms': p.heroReady.toFixed(0), 'rel (ms)': (p.heroReady - bootTime).toFixed(0) });
  if (p.feedReady) perceivedTable.push({ Metric: 'Feed Ready (5 cards + imgs)', 'ms': p.feedReady.toFixed(0), 'rel (ms)': (p.feedReady - bootTime).toFixed(0) });
  if (p.rightPanelReady) perceivedTable.push({ Metric: 'Right Panel Ready', 'ms': p.rightPanelReady.toFixed(0), 'rel (ms)': (p.rightPanelReady - bootTime).toFixed(0) });
  if (p.tti) perceivedTable.push({ Metric: 'Time to Interactive', 'ms': p.tti.toFixed(0), 'rel (ms)': (p.tti - bootTime).toFixed(0) });
  if (p.cpuBusyTime) perceivedTable.push({ Metric: 'CPU Busy Time (long tasks until TTI)', 'ms': p.cpuBusyTime.toFixed(0), 'rel (ms)': (p.cpuBusyTime).toFixed(0) });
  if (p.idleTime) perceivedTable.push({ Metric: 'Idle Time (no long tasks for 1s)', 'ms': p.idleTime.toFixed(0), 'rel (ms)': (p.idleTime - bootTime).toFixed(0) });

  if (perceivedTable.length > 0) {
    console.table(perceivedTable);
  } else {
    console.log('No perceived performance data yet');
  }

  // Detail breakdown
  console.log('Detail:');
  console.table({
    'Mounted Components': Array.from(p._mountedComponents).join(', ') || 'none',
    'Feed Card Count': store.feed.cardCount,
    'Feed Card Images Decoded': p._feedCardImagesLoaded,
    'Hero Image Decoded': p._heroImgDecoded ? 'yes' : 'no',
    'Right Panel Interactive': p._rightPanelInteractive ? 'yes' : 'no',
    'Long Tasks (total)': store.longTasks.length,
    'Long Tasks (until TTI)': p.tti ? store.longTasks.filter(t => t.startTime < p.tti).length : 'n/a',
  });
  console.groupEnd();

  // ═══ 15. WATERFALL TIMELINE ═══
  console.groupCollapsed('%c15. Waterfall Timeline', 'font-weight:bold;color:#0DC4B5;font-size:13px');
  const waterfall = [];

  // Collect all timing events
  if (store.mounts['DesktopShell']) {
    waterfall.push({ Stage: 'DesktopShell', Start: store.mounts['DesktopShell'].start, End: store.mounts['DesktopShell'].end, Dauer: store.mounts['DesktopShell'].duration });
  }
  if (store.mounts['DesktopSidebar']) {
    waterfall.push({ Stage: 'Sidebar', Start: store.mounts['DesktopSidebar'].start, End: store.mounts['DesktopSidebar'].end, Dauer: store.mounts['DesktopSidebar'].duration });
  }
  if (store.mounts['DesktopHeader']) {
    waterfall.push({ Stage: 'Header', Start: store.mounts['DesktopHeader'].start, End: store.mounts['DesktopHeader'].end, Dauer: store.mounts['DesktopHeader'].duration });
  }
  if (store.hero.render) {
    const heroStart = store.mounts['DesktopHome']?.start || store.hero.render;
    const heroEnd = store.hero.imgDecode || store.hero.imgLoadEnd || store.hero.render;
    waterfall.push({ Stage: 'Hero', Start: heroStart, End: heroEnd, Dauer: heroEnd - heroStart });
  }
  if (store.feed.fetchStart) {
    const feedEnd = store.feed.allVisible || store.feed.firstVisible || store.feed.sortEnd || store.feed.fetchEnd;
    waterfall.push({ Stage: 'Feed', Start: store.feed.fetchStart, End: feedEnd, Dauer: feedEnd - store.feed.fetchStart });
  }
  // Feed Images: from first image download to last decoded
  const feedImages = store.images.filter(img => !img.src?.includes('hero'));
  if (feedImages.length > 0) {
    const imgStart = Math.min(...feedImages.map(i => i.downloadStart));
    const imgEnd = Math.max(...feedImages.map(i => i.downloadEnd || (i.downloadStart + i.duration)));
    waterfall.push({ Stage: 'Feed Images', Start: imgStart, End: imgEnd, Dauer: imgEnd - imgStart });
  }
  if (store.mounts['DesktopRightPanel']) {
    const rpEnd = p.rightPanelReady || store.mounts['DesktopRightPanel'].end;
    waterfall.push({ Stage: 'Right Panel', Start: store.mounts['DesktopRightPanel'].start, End: rpEnd, Dauer: rpEnd - store.mounts['DesktopRightPanel'].start });
  }
  // Chat: approximate from header mount (chat is in header)
  if (store.mounts['DesktopHeader']) {
    waterfall.push({ Stage: 'Chat', Start: store.mounts['DesktopHeader'].start, End: store.mounts['DesktopHeader'].end, Dauer: store.mounts['DesktopHeader'].duration });
  }
  // Notifications: approximate from header mount
  if (store.mounts['DesktopHeader']) {
    waterfall.push({ Stage: 'Notifications', Start: store.mounts['DesktopHeader'].start, End: store.mounts['DesktopHeader'].end, Dauer: store.mounts['DesktopHeader'].duration });
  }

  // Sort by start time
  waterfall.sort((a, b) => a.Start - b.Start);

  if (waterfall.length > 0) {
    // Format for display
    const wfDisplay = waterfall.map(w => ({
      Stage: w.Stage,
      'Start (ms)': w.Start.toFixed(1),
      'Ende (ms)': w.End.toFixed(1),
      'Dauer (ms)': w.Dauer.toFixed(1),
    }));
    console.table(wfDisplay);

    // ASCII waterfall
    const minStart = Math.min(...waterfall.map(w => w.Start));
    const maxEnd = Math.max(...waterfall.map(w => w.End));
    const totalSpan = maxEnd - minStart;
    const BAR_WIDTH = 40;

    if (totalSpan > 0) {
      console.log('ASCII Waterfall (each █ ≈ ' + (totalSpan / BAR_WIDTH).toFixed(0) + 'ms):');
      let ascii = '';
      for (const w of waterfall) {
        const offset = Math.round((w.Start - minStart) / totalSpan * BAR_WIDTH);
        const length = Math.max(1, Math.round(w.Dauer / totalSpan * BAR_WIDTH));
        const pad = ' '.repeat(offset);
        const bar = '█'.repeat(length);
        ascii += `${w.Stage.padEnd(16)} ${pad}${bar} ${w.Dauer.toFixed(0)}ms\n`;
      }
      console.log(ascii);
    }
  } else {
    console.log('No waterfall data');
  }
  console.groupEnd();

  // ═══ 16. CRITICAL PATH ═══
  console.groupCollapsed('%c16. Critical Path', 'font-weight:bold;color:#E8876A;font-size:13px');
  const cpStages = [];

  // Build critical path stages with dependencies
  const shellMount = store.mounts['DesktopShell'];
  const sidebarMount = store.mounts['DesktopSidebar'];
  const headerMount = store.mounts['DesktopHeader'];
  const homeMount = store.mounts['DesktopHome'];
  const feedFetch = store.feed.fetchStart;
  const feedFirstCard = store.feed.firstVisible;
  const feedReady = p.feedReady;
  const heroRender = store.hero.render;
  const heroImg = store.hero.imgLoadEnd;
  const tti = p.tti;

  if (shellMount) cpStages.push({
    Stage: '1. DesktopShell Mount',
    Start: shellMount.start, End: shellMount.end, Dauer: shellMount.duration,
    Type: 'blockierend',
    Blocks: 'Sidebar, Header, Home, Feed',
    Note: 'Root component — alles wartet auf Shell',
  });

  if (sidebarMount) cpStages.push({
    Stage: '2a. Sidebar Mount',
    Start: sidebarMount.start, End: sidebarMount.end, Dauer: sidebarMount.duration,
    Type: shellMount && sidebarMount.start < shellMount.end ? 'blockierend' : 'parallel',
    Blocks: 'Navigation',
    Note: 'Parallel mit Header',
  });

  if (headerMount) cpStages.push({
    Stage: '2b. Header Mount',
    Start: headerMount.start, End: headerMount.end, Dauer: headerMount.duration,
    Type: shellMount && headerMount.start < shellMount.end ? 'blockierend' : 'parallel',
    Blocks: 'Search, Chat, Notifications',
    Note: 'Parallel mit Sidebar',
  });

  if (homeMount) cpStages.push({
    Stage: '2c. Home Mount',
    Start: homeMount.start, End: homeMount.end, Dauer: homeMount.duration,
    Type: shellMount && homeMount.start < shellMount.end ? 'blockierend' : 'parallel',
    Blocks: 'Hero, Feed',
    Note: 'Parallel mit Sidebar/Header',
  });

  if (heroRender) cpStages.push({
    Stage: '3a. Hero Render',
    Start: homeMount?.end || heroRender, End: heroRender,
    Dauer: heroRender - (homeMount?.end || heroRender),
    Type: 'nachgelagert',
    Blocks: 'Hero visibility',
    Note: 'Nach Home Mount',
  });

  if (heroImg) cpStages.push({
    Stage: '3b. Hero Image Load',
    Start: store.hero.imgLoadStart || heroRender || 0, End: heroImg,
    Dauer: heroImg - (store.hero.imgLoadStart || heroRender || 0),
    Type: 'nachgelagert',
    Blocks: 'Hero Ready',
    Note: 'Netzwerk-abhängig',
  });

  if (feedFetch) cpStages.push({
    Stage: '3c. Feed Fetch',
    Start: feedFetch, End: store.feed.fetchEnd || feedFetch,
    Dauer: (store.feed.fetchEnd || feedFetch) - feedFetch,
    Type: 'nachgelagert',
    Blocks: 'Feed cards',
    Note: 'Nach Home Mount — 6 Supabase Queries parallel',
  });

  if (feedFirstCard) cpStages.push({
    Stage: '4. Feed First Card',
    Start: store.feed.fetchEnd || feedFetch || 0, End: feedFirstCard,
    Dauer: feedFirstCard - (store.feed.fetchEnd || feedFetch || 0),
    Type: 'nachgelagert',
    Blocks: 'TTI',
    Note: 'Nach Fetch + Merge + Sort + Render',
  });

  if (feedReady) cpStages.push({
    Stage: '5. Feed Ready (5 cards+imgs)',
    Start: feedFirstCard || feedFetch || 0, End: feedReady,
    Dauer: feedReady - (feedFirstCard || feedFetch || 0),
    Type: 'nachgelagert',
    Blocks: 'Full feed interaction',
    Note: 'Warten auf Bild-Dekodierung',
  });

  if (tti) cpStages.push({
    Stage: '6. Time to Interactive',
    Start: bootTime, End: tti,
    Dauer: tti - bootTime,
    Type: 'blockierend',
    Blocks: 'User interaction',
    Note: 'Kritischer Pfad Endpunkt',
  });

  if (cpStages.length > 0) {
    console.table(cpStages.map(s => ({
      Stage: s.Stage,
      'Start (ms)': s.Start.toFixed(1),
      'Ende (ms)': s.End.toFixed(1),
      'Dauer (ms)': s.Dauer.toFixed(1),
      Typ: s.Type,
      Blockiert: s.Blocks,
      Notiz: s.Note,
    })));

    // Determine the actual critical path (longest sequential chain)
    const blockingStages = cpStages.filter(s => s.Type === 'blockierend');
    const criticalChain = blockingStages.map(s => s.Stage);
    console.log('Kritische Kette (blockierende Stufen):');
    console.log('  ' + criticalChain.join(' → '));

    // Total critical path duration
    const critDur = blockingStages.reduce((s, st) => s + st.Dauer, 0);
    console.log(`Kritische Pfad Dauer: ${critDur.toFixed(0)}ms`);

    // Parallel stages
    const parallelStages = cpStages.filter(s => s.Type === 'parallel');
    if (parallelStages.length > 0) {
      console.log('Parallele Stufen:');
      parallelStages.forEach(s => console.log(`  ${s.Stage}: ${s.Dauer.toFixed(0)}ms`));
    }

    // Downstream stages
    const downstreamStages = cpStages.filter(s => s.Type === 'nachgelagert');
    if (downstreamStages.length > 0) {
      console.log('Nachgelagerte Stufen:');
      downstreamStages.forEach(s => console.log(`  ${s.Stage}: ${s.Dauer.toFixed(0)}ms`));
    }
  } else {
    console.log('No critical path data');
  }
  console.groupEnd();

  // ═══ 17. GESAMTBEWERTUNG ═══
  console.groupCollapsed('%c17. Gesamtbewertung', 'font-weight:bold;color:#E8876A;font-size:14px');

  const assessment = {
    'Boot Time': bootTime ? bootTime.toFixed(0) + 'ms' : 'n/a',
    'First Meaningful Paint': p.fmp ? p.fmp.toFixed(0) + 'ms' : 'n/a',
    'Hero Ready': p.heroReady ? p.heroReady.toFixed(0) + 'ms' : 'n/a',
    'Feed Ready': p.feedReady ? p.feedReady.toFixed(0) + 'ms' : 'n/a',
    'Interactive (TTI)': p.tti ? p.tti.toFixed(0) + 'ms' : 'n/a',
    'Idle Time': p.idleTime ? p.idleTime.toFixed(0) + 'ms' : 'n/a',
  };
  console.table(assessment);

  // Determine the biggest bottleneck
  const bottlenecks = [];

  // Find the longest stage in the waterfall
  if (waterfall.length > 0) {
    const longest = waterfall.reduce((a, b) => a.Dauer > b.Dauer ? a : b);
    bottlenecks.push({
      Stage: longest.Stage,
      Dauer: longest.Dauer.toFixed(0) + 'ms',
      Issue: 'Längste Stage im Waterfall',
    });
  }

  // Check FMP delay
  if (p.fmp && bootTime && (p.fmp - bootTime) > 2000) {
    bottlenecks.push({
      Stage: 'First Meaningful Paint',
      Dauer: (p.fmp - bootTime).toFixed(0) + 'ms',
      Issue: 'FMP > 2s — Shell/Header/Hero zu langsam',
    });
  }

  // Check Hero image load
  if (store.hero.imgLoadStart && store.hero.imgLoadEnd) {
    const heroImgDur = store.hero.imgLoadEnd - store.hero.imgLoadStart;
    if (heroImgDur > 1500) {
      bottlenecks.push({
        Stage: 'Hero Image',
        Dauer: heroImgDur.toFixed(0) + 'ms',
        Issue: 'Bildladezeit > 1.5s — zu groß oder CDN langsam',
      });
    }
  }

  // Check Feed fetch
  if (store.feed.fetchStart && store.feed.fetchEnd) {
    const fetchDur = store.feed.fetchEnd - store.feed.fetchStart;
    if (fetchDur > 1000) {
      bottlenecks.push({
        Stage: 'Feed Fetch',
        Dauer: fetchDur.toFixed(0) + 'ms',
        Issue: 'Supabase Queries > 1s — zu viele parallele Requests',
      });
    }
  }

  // Check Feed ready (image decode)
  if (p.feedReady && p.fmp) {
    const feedDur = p.feedReady - p.fmp;
    if (feedDur > 3000) {
      bottlenecks.push({
        Stage: 'Feed Ready',
        Dauer: feedDur.toFixed(0) + 'ms',
        Issue: 'Feed + Bilder > 3s nach FMP — Bild-Optimierung nötig',
      });
    }
  }

  // Check CPU busy time
  if (p.cpuBusyTime > 500) {
    bottlenecks.push({
      Stage: 'CPU Busy',
      Dauer: p.cpuBusyTime.toFixed(0) + 'ms',
      Issue: 'Summe Long Tasks > 500ms — JS-Blockierung',
    });
  }

  // Check idle time
  if (p.idleTime && p.tti && (p.idleTime - p.tti) > 3000) {
    bottlenecks.push({
      Stage: 'Idle Time',
      Dauer: (p.idleTime - p.tti).toFixed(0) + 'ms nach TTI',
      Issue: 'Main Thread bleibt nach TTI > 3s belegt',
    });
  }

  // Sort by duration (longest first)
  bottlenecks.sort((a, b) => parseFloat(b.Dauer) - parseFloat(a.Dauer));

  if (bottlenecks.length > 0) {
    console.log('Größte Flaschenhälse (sortiert nach Dauer):');
    console.table(bottlenecks);
    console.log(`>>> GRÖßTER FLASCHENHALS: ${bottlenecks[0].Stage} — ${bottlenecks[0].Dauer} — ${bottlenecks[0].Issue}`);
  } else {
    console.log('Keine signifikanten Flaschenhälse erkannt.');
  }
  console.groupEnd();


// ─── Export store for debugging ─────────────────────────────────────────────
window.__HUI_PERF_STORE__ = store;
