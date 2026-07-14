/**
 * HUI Feed Runtime Diagnostics
 *
 * Instrumentierung für Safari/WebKit-Reproduktion des Feed-White-Area-Bugs.
 * Kein Bugfix — nur messbare Runtime-Daten.
 *
 * Aktivierung Overlay: localStorage.setItem('hui_feed_debug', '1') + DEV-Modus
 * Export: window.__HUI_FEED_DEBUG__.export()
 */

const MAX_EVENTS = 200;
const MAX_LOAD_MORE = 100;
const MAX_OBSERVER_EVENTS = 200;

function nowIso() {
  return new Date().toISOString();
}

function safeNum(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function describeEl(el) {
  if (!el) return null;
  return {
    tag: el.tagName?.toLowerCase() || null,
    id: el.id || null,
    className: typeof el.className === "string" ? el.className : null,
    selector: el.className
      ? `.${String(el.className).trim().split(/\s+/).filter(Boolean).join(".")}`
      : el.tagName?.toLowerCase() || null,
  };
}

function countDomNodes(root) {
  if (!root || typeof root.querySelectorAll !== "function") return 0;
  return root.querySelectorAll("*").length;
}

function countFeedCards(root) {
  if (!root) return 0;
  return root.querySelectorAll(".hui-feed-card, [data-index]").length;
}

function getSentinelRect(sentinelEl) {
  if (!sentinelEl?.getBoundingClientRect) return null;
  const r = sentinelEl.getBoundingClientRect();
  return {
    top: safeNum(r.top),
    bottom: safeNum(r.bottom),
    left: safeNum(r.left),
    right: safeNum(r.right),
    width: safeNum(r.width),
    height: safeNum(r.height),
    inViewport: r.top < (typeof window !== "undefined" ? window.innerHeight : 0)
      && r.bottom > 0,
  };
}

function initStore() {
  if (typeof window === "undefined") return null;
  if (!window.__HUI_FEED_DEBUG__) {
    window.__HUI_FEED_DEBUG__ = {
      version: 1,
      startedAt: nowIso(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      webkit: /\bAppleWebKit\b/.test(navigator.userAgent),
      safari: /\bSafari\b/.test(navigator.userAgent) && !/\bChrome\b/.test(navigator.userAgent),
      overlayEnabled: false,
      snapshot: null,
      lastSuccessfulRender: null,
      loadMoreCalls: [],
      observerEvents: [],
      anomalies: [],
      events: [],
    };
  }
  return window.__HUI_FEED_DEBUG__;
}

export function isFeedDebugOverlayEnabled() {
  if (typeof window === "undefined") return false;
  if (!import.meta.env.DEV) return false;
  try {
    return localStorage.getItem("hui_feed_debug") === "1";
  } catch {
    return false;
  }
}

export function isFeedDiagnosticsActive() {
  if (typeof window === "undefined") return false;
  return isFeedDebugOverlayEnabled() || !!window.__HUI_FEED_DEBUG__;
}

function pushEvent(store, type, payload) {
  if (!store) return;
  store.events.push({ ts: nowIso(), type, ...payload });
  if (store.events.length > MAX_EVENTS) store.events.shift();
}

function pushAnomaly(store, code, detail) {
  if (!store) return;
  const entry = { ts: nowIso(), code, detail };
  store.anomalies.push(entry);
  if (store.anomalies.length > MAX_EVENTS) store.anomalies.shift();
  pushEvent(store, "anomaly", { code, detail });
}

export function initFeedDiagnostics() {
  const store = initStore();
  if (store) {
    store.overlayEnabled = isFeedDebugOverlayEnabled();
  }
  return store;
}

export function buildScrollSnapshot(scrollEl) {
  if (!scrollEl) {
    return {
      scrollTop: null,
      scrollHeight: null,
      clientHeight: null,
      scrollable: null,
      progress: null,
      scrollContainer: null,
      domNodeCount: null,
      feedCardCount: null,
    };
  }
  const scrollTop = safeNum(scrollEl.scrollTop);
  const scrollHeight = safeNum(scrollEl.scrollHeight);
  const clientHeight = safeNum(scrollEl.clientHeight);
  const scrollable = scrollHeight != null && clientHeight != null
    ? scrollHeight - clientHeight
    : null;
  const progress = scrollable != null && scrollable > 0 && scrollTop != null
    ? scrollTop / scrollable
    : null;

  return {
    scrollTop,
    scrollHeight,
    clientHeight,
    scrollable,
    progress: progress != null ? Math.round(progress * 1000) / 1000 : null,
    scrollContainer: describeEl(scrollEl),
    domNodeCount: countDomNodes(scrollEl),
    feedCardCount: countFeedCards(scrollEl),
  };
}

export function recordFeedSnapshot({
  scrollContainerRef,
  itemsLength,
  renderedCards,
  hasNextPage,
  isFetching,
  isFetchingNextPage,
  useVirtualizer,
  virtualItems,
  sentinelEl,
  extra = {},
}) {
  const store = initStore();
  if (!store) return null;

  const scrollEl = scrollContainerRef?.current ?? null;
  const scroll = buildScrollSnapshot(scrollEl);
  const sentinelPosition = getSentinelRect(sentinelEl);

  const snapshot = {
    ts: nowIso(),
    ...scroll,
    itemsLength: itemsLength ?? null,
    renderedCards: renderedCards ?? null,
    hasNextPage: !!hasNextPage,
    isFetching: !!isFetching,
    isFetchingNextPage: !!isFetchingNextPage,
    useVirtualizer: !!useVirtualizer,
    virtualItemCount: virtualItems?.length ?? null,
    sentinelPosition,
    ...extra,
  };

  store.snapshot = snapshot;

  // Heuristik: weißer Bereich / Scroll-Stall auf WebKit
  const whiteAreaSuspect =
    scroll.scrollTop != null
    && scroll.scrollHeight != null
    && scroll.clientHeight != null
    && scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 80
    && hasNextPage
    && !isFetchingNextPage
    && (itemsLength ?? 0) > 0
    && (renderedCards ?? 0) < Math.min(itemsLength ?? 0, 3);

  const scrollStallSuspect =
    scroll.scrollable != null
    && scroll.scrollable > 200
    && scroll.progress != null
    && scroll.progress > 0.85
    && hasNextPage
    && !isFetchingNextPage;

  if (whiteAreaSuspect) {
    pushAnomaly(store, "WHITE_AREA_SUSPECT", {
      scrollTop: scroll.scrollTop,
      scrollHeight: scroll.scrollHeight,
      clientHeight: scroll.clientHeight,
      itemsLength,
      renderedCards,
      hasNextPage,
    });
  }
  if (scrollStallSuspect) {
    pushAnomaly(store, "SCROLL_STALL_SUSPECT", {
      progress: scroll.progress,
      hasNextPage,
      isFetchingNextPage,
    });
  }

  return snapshot;
}

export function recordSuccessfulRender(meta = {}) {
  const store = initStore();
  if (!store) return;
  store.lastSuccessfulRender = {
    ts: nowIso(),
    ...meta,
  };
  pushEvent(store, "render", meta);
}

export function recordLoadMoreCall(source, state = {}) {
  const store = initStore();
  if (!store) return;
  const entry = {
    ts: nowIso(),
    source: source || "unknown",
    ...state,
  };
  store.loadMoreCalls.push(entry);
  if (store.loadMoreCalls.length > MAX_LOAD_MORE) store.loadMoreCalls.shift();
  pushEvent(store, "loadMore", entry);
}

export function recordObserverEvent(eventType, detail = {}) {
  const store = initStore();
  if (!store) return;
  const entry = {
    ts: nowIso(),
    event: eventType,
    ...detail,
  };
  store.observerEvents.push(entry);
  if (store.observerEvents.length > MAX_OBSERVER_EVENTS) store.observerEvents.shift();
  pushEvent(store, "observer", entry);
}

export function wrapLoadMore(loadMoreFn, getState) {
  if (typeof loadMoreFn !== "function") return loadMoreFn;
  return (...args) => {
    const state = typeof getState === "function" ? getState() : {};
    recordLoadMoreCall("loadMore()", state);
    return loadMoreFn(...args);
  };
}

export function attachFeedDebugExport() {
  const store = initStore();
  if (!store || store.export) return store;

  store.export = function exportFeedDebug() {
    const payload = {
      exportedAt: nowIso(),
      userAgent: navigator.userAgent,
      overlayEnabled: isFeedDebugOverlayEnabled(),
      snapshot: store.snapshot,
      lastSuccessfulRender: store.lastSuccessfulRender,
      loadMoreCalls: [...store.loadMoreCalls],
      observerEvents: [...store.observerEvents],
      anomalies: [...store.anomalies],
      events: [...store.events],
    };
    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hui-feed-debug-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("[HUI_FEED_DEBUG] export failed", err);
    }
    return payload;
  };

  store.getPayload = function getFeedDebugPayload() {
    return {
      exportedAt: nowIso(),
      userAgent: navigator.userAgent,
      overlayEnabled: isFeedDebugOverlayEnabled(),
      snapshot: store.snapshot,
      lastSuccessfulRender: store.lastSuccessfulRender,
      loadMoreCalls: [...store.loadMoreCalls],
      observerEvents: [...store.observerEvents],
      anomalies: [...store.anomalies],
      events: [...store.events],
    };
  };

  store.copy = function copyFeedDebug() {
    const payload = store.getPayload();
    try {
      navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    } catch (_) { /* ignore */ }
    return payload;
  };

  return store;
}
