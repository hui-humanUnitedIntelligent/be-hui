// src/lib/runtimeDebug.js
// Local-only runtime diagnostics for devices without DevTools.

const LIMIT = 24;

const initialState = {
  events: [],
  runtimeErrors: [],
  failedActions: [],
  failedInserts: [],
  failedRealtime: [],
};

let state = { ...initialState };
const listeners = new Set();

function nowIso() {
  return new Date().toISOString();
}

function clip(value, max = 600) {
  if (value === null || value === undefined) return value;
  const text = typeof value === "string" ? value : String(value);
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function errorDetails(error) {
  if (!error) return null;
  if (typeof error === "string") return { message: clip(error) };
  return {
    name:    error.name || null,
    code:    error.code || null,
    message: clip(error.message || String(error)),
    hint:    clip(error.hint || null),
    details: clip(error.details || null),
    stack:   clip(error.stack || null, 900),
  };
}

function summarizeMessage(input) {
  if (!input) return "Unbekannter Runtime-Fehler";
  if (typeof input === "string") return input;
  if (input.message) return input.message;
  if (input.error?.message) return input.error.message;
  return String(input);
}

function pushLimited(list, event) {
  return [event, ...list].slice(0, LIMIT);
}

function snapshot() {
  return {
    events:         [...state.events],
    runtimeErrors:  [...state.runtimeErrors],
    failedActions:  [...state.failedActions],
    failedInserts:  [...state.failedInserts],
    failedRealtime: [...state.failedRealtime],
  };
}

function notify() {
  const next = snapshot();
  listeners.forEach(listener => {
    try { listener(next); } catch (_) {}
  });
}

function record(raw) {
  const event = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: nowIso(),
    severity: raw.severity || "error",
    category: raw.category || "runtime",
    flow: raw.flow || "unknown",
    step: raw.step || "unknown",
    entity: raw.entity || "unknown",
    persistFailed: raw.persistFailed ?? null,
    message: clip(summarizeMessage(raw)),
    details: raw.details || errorDetails(raw.error),
  };

  state = {
    ...state,
    events: pushLimited(state.events, event),
  };

  if (event.category === "action" || event.category === "validation" || event.category === "navigation") {
    state = { ...state, failedActions: pushLimited(state.failedActions, event) };
  }
  if (event.category === "insert" || event.category === "publish" || event.category === "chat" || event.category === "booking") {
    state = { ...state, failedInserts: pushLimited(state.failedInserts, event) };
  }
  if (event.category === "realtime") {
    state = { ...state, failedRealtime: pushLimited(state.failedRealtime, event) };
  }
  if (event.category === "runtime") {
    state = { ...state, runtimeErrors: pushLimited(state.runtimeErrors, event) };
  }

  notify();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hui-runtime-debug", { detail: event }));
  }
  return event;
}

export function subscribeRuntimeDebug(listener) {
  listeners.add(listener);
  listener(snapshot());
  return () => listeners.delete(listener);
}

export function getRuntimeDebugState() {
  return snapshot();
}

export function clearRuntimeDebug() {
  state = { ...initialState };
  notify();
}

export function reportRuntimeError(input = {}) {
  return record({
    category: "runtime",
    flow: input.flow || "runtime",
    step: input.step || "exception",
    entity: input.entity || "app",
    persistFailed: input.persistFailed ?? false,
    message: input.message,
    error: input.error,
    details: input.details,
  });
}

export function reportActionFailure(input = {}) {
  return record({
    category: input.category || "action",
    flow: input.flow || "action",
    step: input.step || "handler",
    entity: input.entity || input.action || "button",
    persistFailed: input.persistFailed ?? false,
    message: input.message || "Action fehlgeschlagen",
    error: input.error,
    details: input.details,
  });
}

export function reportInsertFailure(input = {}) {
  return record({
    category: input.category || "insert",
    flow: input.flow || "publish",
    step: input.step || "insert",
    entity: input.entity || input.table || "unknown",
    persistFailed: true,
    message: input.message || "Persistenz fehlgeschlagen",
    error: input.error,
    details: input.details,
  });
}

export function reportRealtimeFailure(input = {}) {
  return record({
    category: "realtime",
    flow: input.flow || "realtime",
    step: input.step || "subscribe",
    entity: input.entity || input.channel || "channel",
    persistFailed: false,
    message: input.message || "Realtime fehlgeschlagen",
    error: input.error,
    details: input.details,
  });
}

export function installRuntimeDebugWindow() {
  if (typeof window === "undefined") return;
  window.__HUI_DEBUG__ = {
    getState: getRuntimeDebugState,
    clear: clearRuntimeDebug,
    report: record,
  };
}

installRuntimeDebugWindow();
