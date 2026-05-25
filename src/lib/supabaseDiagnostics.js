import { supabase } from "./supabaseClient.js";

export const SUPABASE_RUNTIME_ERROR_EVENT = "hui:supabase-runtime-error";
export const FEED_REFRESH_EVENT = "hui:feed-refresh";

function summarizeFile(file) {
  return {
    kind: file instanceof File ? "File" : "Blob",
    name: file instanceof File ? file.name : undefined,
    type: file.type || null,
    size: file.size ?? null,
    lastModified: file instanceof File ? file.lastModified : undefined,
  };
}

function sanitizeValue(value, seen = new WeakSet()) {
  if (value == null) return value;
  if (typeof File !== "undefined" && value instanceof File) return summarizeFile(value);
  if (typeof Blob !== "undefined" && value instanceof Blob) return summarizeFile(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(item => sanitizeValue(item, seen));
  if (typeof value === "object") {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, sanitizeValue(val, seen)])
    );
  }
  if (typeof value === "function") return `[Function ${value.name || "anonymous"}]`;
  return value;
}

export function safeDiagnosticPayload(payload) {
  try {
    return sanitizeValue(payload);
  } catch (err) {
    return { unserializable: true, message: err?.message || String(err) };
  }
}

export function normalizeSupabaseError(error) {
  if (!error) return null;
  if (typeof error === "string") return { message: error };
  return {
    message: error.message || error.error_description || String(error),
    code: error.code || error.statusCode || error.status || null,
    details: error.details || null,
    hint: error.hint || null,
    name: error.name || null,
    status: error.status || error.statusCode || null,
  };
}

async function readSessionState(authUid) {
  try {
    const { data, error } = await supabase.auth.getSession();
    const session = data?.session || null;
    return {
      state: session ? "authenticated" : "missing",
      hasSession: Boolean(session),
      authUid: authUid || session?.user?.id || null,
      sessionUserId: session?.user?.id || null,
      email: session?.user?.email || null,
      role: session?.user?.role || null,
      expiresAt: session?.expires_at
        ? new Date(session.expires_at * 1000).toISOString()
        : null,
      hasAccessToken: Boolean(session?.access_token),
      hasRefreshToken: Boolean(session?.refresh_token),
      authError: error ? normalizeSupabaseError(error) : null,
    };
  } catch (err) {
    return {
      state: "read_failed",
      hasSession: false,
      authUid: authUid || null,
      authError: normalizeSupabaseError(err),
    };
  }
}

function readClientConfigState() {
  const url = import.meta.env.VITE_SUPABASE_URL || "";
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  let urlHost = null;
  try {
    urlHost = url ? new URL(url).host : null;
  } catch (_) {
    urlHost = "invalid-url";
  }

  return {
    urlPresent: Boolean(url),
    urlHost,
    anonKeyPresent: Boolean(anonKey),
    anonKeyLength: anonKey.length,
    anonKeyLooksJwt: anonKey.split(".").length === 3,
  };
}

export async function buildSupabaseFailureReport({
  title = "SUPABASE INSERT FAILED",
  source,
  operation,
  table = null,
  bucket = null,
  path = null,
  payload = null,
  error = null,
  result = null,
  authUid = null,
  extra = null,
}) {
  const sessionState = await readSessionState(authUid);
  return {
    title,
    source,
    operation,
    table,
    bucket,
    path,
    timestamp: new Date().toISOString(),
    error: normalizeSupabaseError(error || result?.error),
    payload: safeDiagnosticPayload(payload),
    result: safeDiagnosticPayload(result),
    authUid: authUid || sessionState.authUid || null,
    sessionState,
    clientConfig: readClientConfigState(),
    extra: safeDiagnosticPayload(extra),
  };
}

export function emitSupabaseFailureReport(report) {
  if (typeof window === "undefined") return;
  window.__HUI_SUPABASE_LAST_ERROR__ = report;
  window.dispatchEvent(new CustomEvent(SUPABASE_RUNTIME_ERROR_EVENT, { detail: report }));
}

export async function reportSupabaseFailure(args) {
  const report = await buildSupabaseFailureReport(args);
  console.error(`[${report.title}]`, report);
  emitSupabaseFailureReport(report);
  return report;
}

export async function assertSupabaseResult(result, args, options = {}) {
  const { requireData = false } = options;
  const emptyData =
    result?.data == null ||
    (Array.isArray(result.data) && result.data.length === 0);

  if (result?.error || (requireData && emptyData)) {
    const report = await reportSupabaseFailure({
      ...args,
      error: result?.error || {
        message: "Supabase operation returned no data",
        code: "SUPABASE_EMPTY_RESULT",
      },
      result,
    });
    const err = new Error(report.error?.message || "Supabase operation failed");
    err.code = report.error?.code;
    err.supabaseReport = report;
    throw err;
  }

  return result;
}

export function emitFeedRefresh(detail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FEED_REFRESH_EVENT, {
    detail: { ...detail, ts: Date.now() },
  }));
}
