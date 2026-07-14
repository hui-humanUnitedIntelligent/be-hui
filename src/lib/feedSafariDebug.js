/**
 * feedSafariDebug.js — Safari Feed Investigation (P0)
 *
 * Runtime instrumentation for Firefox vs Safari comparison.
 * Enable: localStorage.setItem("hui_feed_debug", "1") then reload.
 * Inspect: window.__HUI_FEED_DEBUG__.snapshot() / .logs / .export()
 */

import { logDebug } from "./debugCollector.js";

const MAX_LOGS = 200;
const SCROLL_THROTTLE_MS = 250;

export function isFeedDebugEnabled() {
  return isEnabled();
}

function isEnabled() {
  if (typeof window === "undefined") return false;
  try {
    return (
      import.meta.env.DEV ||
      localStorage.getItem("hui_feed_debug") === "1" ||
      new URLSearchParams(window.location.search).has("feed_debug")
    );
  } catch {
    return import.meta.env.DEV;
  }
}

export function isSafariLike() {
  if (typeof navigator === "undefined") return false;
  return (
    /Safari/i.test(navigator.userAgent) &&
    !/Chrome|Chromium|CriOS|FxiOS|Edg/i.test(navigator.userAgent)
  );
}

export function detectBrowser() {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/FxiOS|Firefox/i.test(ua)) return "firefox";
  if (isSafariLike()) return "safari";
  if (/Chrome|Chromium|CriOS/i.test(ua)) return "chrome";
  return "other";
}

/** Which element actually scrolls when the user scrolls the feed? */
export function findActiveScrollContainer(startEl) {
  if (typeof document === "undefined") return null;

  const candidates = [];
  let el = startEl;
  while (el && el !== document.documentElement) {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      el.scrollHeight > el.clientHeight + 1
    ) {
      candidates.push({
        el,
        tag: el.tagName,
        className: el.className || "",
        id: el.id || "",
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        scrollTop: el.scrollTop,
      });
    }
    el = el.parentElement;
  }

  // document scrolling
  const docScrollable =
    document.documentElement.scrollHeight > window.innerHeight + 1;
  if (docScrollable) {
    candidates.push({
      el: document.documentElement,
      tag: "HTML",
      className: "document",
      id: "",
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: window.innerHeight,
      scrollTop: window.scrollY,
    });
  }

  return candidates;
}

export function probeBrowserApis() {
  const passiveSupported = (() => {
    let supported = false;
    try {
      const opts = Object.defineProperty({}, "passive", {
        get() {
          supported = true;
          return true;
        },
      });
      window.addEventListener("hui_feed_passive_test", null, opts);
      window.removeEventListener("hui_feed_passive_test", null, opts);
    } catch {
      /* ignore */
    }
    return supported;
  })();

  return {
    browser: detectBrowser(),
    isSafariLike: isSafariLike(),
    intersectionObserver: typeof IntersectionObserver !== "undefined",
    resizeObserver: typeof ResizeObserver !== "undefined",
    mutationObserver: typeof MutationObserver !== "undefined",
    requestAnimationFrame: typeof requestAnimationFrame !== "undefined",
    requestIdleCallback: typeof requestIdleCallback !== "undefined",
    passiveEvents: passiveSupported,
    touchEvents: typeof window !== "undefined" && "ontouchstart" in window,
    scrollIntoView: typeof Element.prototype.scrollIntoView === "function",
    contentVisibilitySupported: (() => {
      try {
        return CSS.supports("content-visibility", "auto");
      } catch {
        return false;
      }
    })(),
    aspectRatioSupported: (() => {
      try {
        return CSS.supports("aspect-ratio", "1 / 1");
      } catch {
        return false;
      }
    })(),
    webkitOverflowScrolling: (() => {
      const d = document.createElement("div");
      d.style.webkitOverflowScrolling = "touch";
      return d.style.webkitOverflowScrolling === "touch";
    })(),
    lazyLoading: "loading" in document.createElement("img"),
    decodingAsync: "decoding" in document.createElement("img"),
    fetchPriority: "fetchPriority" in document.createElement("img"),
  };
}

function countFeedCards(root) {
  if (!root) return 0;
  return root.querySelectorAll(".hui-feed-card, [data-index]").length;
}

function getSentinelRect(sentinelEl) {
  if (!sentinelEl) return null;
  const r = sentinelEl.getBoundingClientRect();
  return {
    top: Math.round(r.top),
    bottom: Math.round(r.bottom),
    height: Math.round(r.height),
    inViewport:
      r.top < window.innerHeight && r.bottom > 0,
  };
}

function feedHeight(el) {
  if (!el) return 0;
  return el.getBoundingClientRect().height;
}

class FeedSafariDebugger {
  constructor() {
    this.logs = [];
    this.pageLoads = 0;
    this.loadMoreCalls = 0;
    this.ioFires = 0;
    this.lastSnapshot = null;
    this._scrollTimer = null;
    this._scrollUnsub = null;
    this._enabled = false;
  }

  _push(event, payload) {
    const entry = { ts: Date.now(), event, payload };
    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS) this.logs.shift();
    logDebug(`FEED_${event}`, payload);
  }

  init() {
    if (!isEnabled() || this._enabled) return;
    this._enabled = true;

    const apis = probeBrowserApis();
    this._push("INIT", apis);

    if (typeof window !== "undefined") {
      window.__HUI_FEED_DEBUG__ = this;
      window.__HUI_FEED_DEBUG_APIS__ = apis;
    }
  }

  attachScrollProbe(scrollEl, sentinelEl, getState) {
    if (!isEnabled() || !scrollEl) return () => {};

    const onScroll = () => {
      if (this._scrollTimer) return;
      this._scrollTimer = setTimeout(() => {
        this._scrollTimer = null;
        const state = typeof getState === "function" ? getState() : {};
        const snap = this.capture({
          scrollEl,
          sentinelEl,
          feedListEl: scrollEl.querySelector("[data-feed-list]"),
          ...state,
        });
        this._push("SCROLL", snap);
      }, SCROLL_THROTTLE_MS);
    };

    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    this._scrollUnsub = () => scrollEl.removeEventListener("scroll", onScroll);
    return this._scrollUnsub;
  }

  capture({
    scrollEl,
    sentinelEl,
    feedListEl,
    itemsLength = 0,
    renderedCards = null,
    hasMore = null,
    loadingMore = null,
    useVirt = null,
    totalHeight = null,
    virtItemCount = null,
    pagesLength = null,
  } = {}) {
    const scrollCandidates = findActiveScrollContainer(sentinelEl || feedListEl || scrollEl);
    const activeScroll = scrollCandidates[0] || null;

    const snap = {
      browser: detectBrowser(),
      isSafariLike: isSafariLike(),
      // Task 1 metrics
      scrollHeight: scrollEl?.scrollHeight ?? null,
      clientHeight: scrollEl?.clientHeight ?? null,
      scrollTop: scrollEl?.scrollTop ?? null,
      feedHeight: feedHeight(feedListEl),
      renderedCards: renderedCards ?? countFeedCards(feedListEl),
      sentinelPosition: getSentinelRect(sentinelEl),
      intersectionObserverFires: this.ioFires,
      loadMoreCalls: this.loadMoreCalls,
      hasMore,
      pagesLength,
      itemsLength,
      // Virtualizer
      useVirt,
      totalHeight,
      virtItemCount,
      loadingMore,
      // Task 3 — actual scroll container proof
      assumedScrollContainer: scrollEl
        ? { tag: scrollEl.tagName, className: scrollEl.className, isHuiScroll: scrollEl.classList?.contains("hui-scroll") }
        : null,
      activeScrollCandidates: scrollCandidates.map((c) => ({
        tag: c.tag,
        className: c.className,
        scrollHeight: c.scrollHeight,
        clientHeight: c.clientHeight,
        scrollTop: c.scrollTop,
        isAssumedContainer: c.el === scrollEl,
      })),
      domNodeCount: feedListEl?.querySelectorAll("*").length ?? null,
      apis: window.__HUI_FEED_DEBUG_APIS__ || probeBrowserApis(),
    };

    this.lastSnapshot = snap;
    if (typeof window !== "undefined") {
      window.__HUI_FEED_DEBUG_SNAPSHOT__ = snap;
    }
    return snap;
  }

  logEvent(event, payload) {
    this._push(event, payload);
  }

  logIoFire(payload) {
    this.ioFires += 1;
    this._push("IO_FIRE", { ...payload, totalFires: this.ioFires });
  }

  logLoadMore(payload) {
    this.loadMoreCalls += 1;
    this.pageLoads += 1;
    this._push("LOAD_MORE", { ...payload, callCount: this.loadMoreCalls });
  }

  logDataArrived(payload) {
    this._push("DATA_ARRIVED", payload);
  }

  snapshot() {
    return this.lastSnapshot;
  }

  export() {
    return JSON.stringify(
      { apis: window.__HUI_FEED_DEBUG_APIS__, logs: this.logs, lastSnapshot: this.lastSnapshot },
      null,
      2
    );
  }

  destroy() {
    if (this._scrollUnsub) this._scrollUnsub();
    if (this._scrollTimer) clearTimeout(this._scrollTimer);
  }
}

export const feedSafariDebug = new FeedSafariDebugger();
