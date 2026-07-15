/**
 * HUI RC1-005 — Feed Runtime Truth Instrumentation
 * Exposes window.__HUI_FEED_RUNTIME__ for on-device diagnosis.
 * NO behavior changes — observation only.
 */

const START_MS = typeof performance !== "undefined" ? performance.now() : Date.now();

let _snapshots = [];
let _stateChanges = [];
let _firstWrong = null;

function relMs() {
  return Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - START_MS);
}

function pickLengths(state) {
  const len = (v) => (Array.isArray(v) ? v.length : typeof v === "number" ? v : null);
  return {
    "rawItems.length": len(state.rawItems),
    "normalizedItems.length": len(state.normalizedItems),
    "items.length": len(state.items),
    "searchItems.length": len(state.searchItems),
    "resolvedItems.length": len(state.resolvedItems),
    "visibleItems.length": len(state.visibleItems),
    "FeedList.length": len(state.feedListLength),
    DOM_Karten: state.domCards,
    EmptyState: state.emptyState,
  };
}

function detectFirstWrong(prev, next, label) {
  if (_firstWrong) return;
  const keys = [
    "rawItems.length", "normalizedItems.length", "items.length",
    "searchItems.length", "resolvedItems.length", "visibleItems.length",
    "FeedList.length",
  ];
  for (const k of keys) {
    const b = prev?.[k];
    const a = next?.[k];
    if (b == null || a == null) continue;
    if (b > 0 && a === 0) {
      _firstWrong = {
        variable: k,
        before: b,
        after: a,
        atMs: relMs(),
        label,
        codePath: null,
      };
      if (typeof window !== "undefined" && window.__HUI_FEED_RUNTIME__) {
        window.__HUI_FEED_RUNTIME__.firstWrongVariable = _firstWrong;
      }
      break;
    }
  }
}

export function initFeedRuntimeTruth() {
  if (typeof window === "undefined") return;
  if (window.__HUI_FEED_RUNTIME__) return;

  window.__HUI_FEED_RUNTIME__ = {
    startedAt: new Date().toISOString(),
    startMs: START_MS,

    fetchFeedPage: {
      started: false,
      finished: false,
      error: null,
      startedAtMs: null,
      finishedAtMs: null,
      durationMs: null,
      sql: null,
      rpc: null,
      supabaseResponse: null,
      httpStatus: null,
    },

    rawItems: { length: 0 },
    normalizedItems: { length: 0 },
    items: { length: 0 },
    searchItems: { length: 0 },
    resolvedItems: { length: 0 },
    visibleItems: { length: 0 },
    FeedList: { length: 0 },
    DOM_Karten: 0,
    EmptyState: false,

    isSearching: false,
    searchActive: false,
    searchQuery: "",
    categoryFilters: null,
    radiusKm: null,
    hasRadius: false,
    hasNextPage: true,
    isFetching: false,
    isFetchingNextPage: false,

    snapshots: _snapshots,
    stateChanges: _stateChanges,
    firstWrongVariable: null,

    getTimeline() {
      return _snapshots.map((s) => `${s.ms} ms — ${s.label}${s.detail ? ": " + s.detail : ""}`);
    },

    exportJSON() {
      return JSON.stringify({
        ...window.__HUI_FEED_RUNTIME__,
        snapshots: _snapshots,
        stateChanges: _stateChanges,
      }, null, 2);
    },
  };

  feedRuntimeSnapshot("init", "window.__HUI_FEED_RUNTIME__ erzeugt");
}

export function feedRuntimeSnapshot(label, detailOrValues) {
  if (typeof window === "undefined") return;
  initFeedRuntimeTruth();

  const rt = window.__HUI_FEED_RUNTIME__;
  const prevLens = pickLengths({
    rawItems: rt.rawItems?.length,
    normalizedItems: rt.normalizedItems?.length,
    items: rt.items?.length,
    searchItems: rt.searchItems?.length,
    resolvedItems: rt.resolvedItems?.length,
    visibleItems: rt.visibleItems?.length,
    feedListLength: rt.FeedList?.length,
    domCards: rt.DOM_Karten,
    emptyState: rt.EmptyState,
  });

  let detail = "";
  let values = null;
  if (typeof detailOrValues === "string") {
    detail = detailOrValues;
  } else if (detailOrValues && typeof detailOrValues === "object") {
    values = detailOrValues;
    detail = Object.entries(detailOrValues)
      .map(([k, v]) => `${k} = ${v}`)
      .join(", ");
  }

  const entry = { ms: relMs(), label, detail, values };
  _snapshots.push(entry);
  if (_snapshots.length > 500) _snapshots.shift();

  if (values) {
    const nextLens = pickLengths({
      rawItems: values["rawItems.length"] ?? rt.rawItems?.length,
      normalizedItems: values["normalizedItems.length"] ?? rt.normalizedItems?.length,
      items: values["items.length"] ?? rt.items?.length,
      searchItems: values["searchItems.length"] ?? rt.searchItems?.length,
      resolvedItems: values["resolvedItems.length"] ?? rt.resolvedItems?.length,
      visibleItems: values["visibleItems.length"] ?? rt.visibleItems?.length,
      feedListLength: values["FeedList.length"] ?? rt.FeedList?.length,
      domCards: values.DOM_Karten ?? rt.DOM_Karten,
      emptyState: values.EmptyState ?? rt.EmptyState,
    });
    detectFirstWrong(prevLens, nextLens, label);
  }
}

export function updateFeedRuntimeTruth(patch) {
  if (typeof window === "undefined") return;
  initFeedRuntimeTruth();
  Object.assign(window.__HUI_FEED_RUNTIME__, patch);
}

export function recordFeedStateChange({ file, fn, line, variable, before, after, note }) {
  if (typeof window === "undefined") return;
  initFeedRuntimeTruth();

  const entry = {
    ms: relMs(),
    file,
    fn,
    line,
    variable,
    before,
    after,
    note: note || null,
  };
  _stateChanges.push(entry);
  if (_stateChanges.length > 200) _stateChanges.shift();

  if (!_firstWrong && typeof before === "number" && typeof after === "number" && before > 0 && after === 0) {
    _firstWrong = {
      variable,
      before,
      after,
      atMs: relMs(),
      label: `${fn}()`,
      codePath: { file, fn, line },
    };
    window.__HUI_FEED_RUNTIME__.firstWrongVariable = _firstWrong;
  }

  feedRuntimeSnapshot(`stateChange:${variable}`, `${file}:${line} ${fn}() ${before} → ${after}`);
}

export function markFetchFeedPageStart(meta = {}) {
  if (typeof window === "undefined") return;
  initFeedRuntimeTruth();
  const rt = window.__HUI_FEED_RUNTIME__;
  rt.fetchFeedPage = {
    ...rt.fetchFeedPage,
    started: true,
    finished: false,
    error: null,
    startedAtMs: relMs(),
    finishedAtMs: null,
    durationMs: null,
    ...meta,
  };
  feedRuntimeSnapshot("fetchFeedPage", "gestartet");
}

export function markFetchFeedPageEnd({ error, supabaseResponse, httpStatus, rawItemsLength, normalizedItemsLength }) {
  if (typeof window === "undefined") return;
  initFeedRuntimeTruth();
  const rt = window.__HUI_FEED_RUNTIME__;
  const finishedAtMs = relMs();
  rt.fetchFeedPage = {
    ...rt.fetchFeedPage,
    finished: true,
    error: error || null,
    finishedAtMs,
    durationMs: rt.fetchFeedPage.startedAtMs != null ? finishedAtMs - rt.fetchFeedPage.startedAtMs : null,
    supabaseResponse: supabaseResponse || rt.fetchFeedPage.supabaseResponse,
    httpStatus: httpStatus ?? rt.fetchFeedPage.httpStatus,
  };
  if (rawItemsLength != null) {
    rt.rawItems = { length: rawItemsLength };
    rt.normalizedItems = { length: normalizedItemsLength ?? rawItemsLength };
  }
  feedRuntimeSnapshot("fetchFeedPage", error
    ? `beendet mit Fehler: ${error}`
    : `beendet — rawItems=${rawItemsLength}, normalizedItems=${normalizedItemsLength}`);
}

/** Wrap setState to log before/after for feed item arrays */
export function wrapFeedSetter(setter, meta) {
  return (value) => {
    const resolve = (prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      const beforeLen = Array.isArray(prev) ? prev.length : 0;
      const afterLen = Array.isArray(next) ? next.length : 0;
      if (beforeLen !== afterLen) {
        recordFeedStateChange({
          ...meta,
          variable: meta.variable || "items.length",
          before: beforeLen,
          after: afterLen,
        });
      }
      return next;
    };
    if (typeof value === "function") {
      setter(resolve);
    } else {
      setter((prev) => resolve(prev));
    }
  };
}
