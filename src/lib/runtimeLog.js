const ENABLED =
  typeof window !== "undefined" &&
  (import.meta.env?.DEV || window.localStorage?.getItem("hui_runtime_logs") === "1");

function safeDetails(details) {
  if (!details || typeof details !== "object") return details ?? null;
  return Object.fromEntries(
    Object.entries(details).map(([key, value]) => {
      if (value instanceof Error) return [key, value.message];
      if (typeof value === "string" && value.length > 240) return [key, `${value.slice(0, 240)}...`];
      return [key, value];
    }),
  );
}

export function logRuntime(flow, event, details = null, level = "info") {
  if (!flow || !event) return;
  const payload = {
    flow,
    event,
    details: safeDetails(details),
    at: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    window.__HUI_RUNTIME_LOGS__ = window.__HUI_RUNTIME_LOGS__ || [];
    window.__HUI_RUNTIME_LOGS__.push(payload);
    if (window.__HUI_RUNTIME_LOGS__.length > 300) {
      window.__HUI_RUNTIME_LOGS__.shift();
    }
  }

  if (!ENABLED) return;
  const method = level === "error" ? "error" : level === "warn" ? "warn" : "log";
  console[method](`[HUI_RUNTIME][${flow}] ${event}`, payload.details ?? "");
}
