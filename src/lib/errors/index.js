// src/lib/errors/index.js
// HUI — Global Error Model — Phase 4B.2
// ═══════════════════════════════════════════════════════════════
// Alle Systeme sprechen dieselbe Fehler-Sprache.
// Kein roher Error-String mehr im UI.
// ═══════════════════════════════════════════════════════════════

// ── Severity Levels ─────────────────────────────────────────────
export const SEVERITY = {
  FATAL:   'fatal',    // App nicht nutzbar
  HIGH:    'high',     // Feature kaputt
  MEDIUM:  'medium',   // Degraded UX
  LOW:     'low',      // Minor issue
  INFO:    'info',     // Informational
};

// ── Error Codes ─────────────────────────────────────────────────
export const ERROR_CODES = {
  // Auth
  AUTH_SESSION_EXPIRED:    'AUTH_001',
  AUTH_PERMISSION_DENIED:  'AUTH_002',
  AUTH_INVALID_CREDENTIALS:'AUTH_003',
  AUTH_NETWORK:            'AUTH_004',

  // Network
  NETWORK_OFFLINE:         'NET_001',
  NETWORK_TIMEOUT:         'NET_002',
  NETWORK_SERVER_ERROR:    'NET_003',
  NETWORK_RATE_LIMITED:    'NET_004',

  // Realtime
  REALTIME_CONNECT_FAILED: 'RT_001',
  REALTIME_CHANNEL_ERROR:  'RT_002',
  REALTIME_ZOMBIE_SUB:     'RT_003',

  // Booking
  BOOKING_NOT_FOUND:       'BOOK_001',
  BOOKING_CONFLICT:        'BOOK_002',
  BOOKING_PAYMENT_FAILED:  'BOOK_003',
  BOOKING_SLOT_TAKEN:      'BOOK_004',

  // Chat
  CHAT_SEND_FAILED:        'CHAT_001',
  CHAT_LOAD_FAILED:        'CHAT_002',
  CHAT_PERMISSION:         'CHAT_003',

  // Content
  CONTENT_UPLOAD_FAILED:   'CONT_001',
  CONTENT_NOT_FOUND:       'CONT_002',
  CONTENT_VALIDATION:      'CONT_003',

  // Payment
  PAYMENT_FAILED:          'PAY_001',
  PAYMENT_WEBHOOK:         'PAY_002',

  // Generic
  VALIDATION_FAILED:       'VAL_001',
  UNKNOWN:                 'UNK_001',
};

// ── Base AppError ────────────────────────────────────────────────
export class AppError extends Error {
  constructor({
    code      = ERROR_CODES.UNKNOWN,
    message   = 'Ein unbekannter Fehler ist aufgetreten.',
    retryable = false,
    severity  = SEVERITY.MEDIUM,
    context   = {},
    cause     = null,
  } = {}) {
    super(message);
    this.name      = 'AppError';
    this.code      = code;
    this.retryable = retryable;
    this.severity  = severity;
    this.context   = context;
    this.cause     = cause;
    this.timestamp = new Date().toISOString();
  }

  toLog() {
    return {
      name:      this.name,
      code:      this.code,
      message:   this.message,
      severity:  this.severity,
      retryable: this.retryable,
      context:   this.context,
      timestamp: this.timestamp,
      stack:     this.stack,
    };
  }

  /** User-safe message — never expose stack traces */
  toUserMessage() {
    const messages = {
      [ERROR_CODES.NETWORK_OFFLINE]:      'Du bist offline. Verbindung wird wiederhergestellt…',
      [ERROR_CODES.NETWORK_TIMEOUT]:      'Die Anfrage hat zu lange gedauert. Bitte erneut versuchen.',
      [ERROR_CODES.AUTH_SESSION_EXPIRED]: 'Deine Sitzung ist abgelaufen. Bitte neu anmelden.',
      [ERROR_CODES.BOOKING_SLOT_TAKEN]:   'Dieser Zeitslot ist leider schon vergeben.',
      [ERROR_CODES.BOOKING_PAYMENT_FAILED]:'Zahlung fehlgeschlagen. Bitte Zahlungsmethode prüfen.',
      [ERROR_CODES.CONTENT_UPLOAD_FAILED]:'Upload fehlgeschlagen. Bitte erneut versuchen.',
      [ERROR_CODES.CHAT_SEND_FAILED]:     'Nachricht konnte nicht gesendet werden.',
    };
    return messages[this.code] || this.message;
  }
}

// ── Spezialisierte Error-Klassen ─────────────────────────────────
export class AuthError extends AppError {
  constructor(opts = {}) {
    super({ code: ERROR_CODES.AUTH_SESSION_EXPIRED, severity: SEVERITY.HIGH, retryable: false, ...opts });
    this.name = 'AuthError';
  }
}

export class NetworkError extends AppError {
  constructor(opts = {}) {
    super({ code: ERROR_CODES.NETWORK_OFFLINE, severity: SEVERITY.HIGH, retryable: true, ...opts });
    this.name = 'NetworkError';
  }
}

export class RealtimeError extends AppError {
  constructor(opts = {}) {
    super({ code: ERROR_CODES.REALTIME_CONNECT_FAILED, severity: SEVERITY.MEDIUM, retryable: true, ...opts });
    this.name = 'RealtimeError';
  }
}

export class BookingError extends AppError {
  constructor(opts = {}) {
    super({ code: ERROR_CODES.BOOKING_NOT_FOUND, severity: SEVERITY.HIGH, retryable: false, ...opts });
    this.name = 'BookingError';
  }
}

export class ChatError extends AppError {
  constructor(opts = {}) {
    super({ code: ERROR_CODES.CHAT_SEND_FAILED, severity: SEVERITY.MEDIUM, retryable: true, ...opts });
    this.name = 'ChatError';
  }
}

export class ValidationError extends AppError {
  constructor(opts = {}) {
    super({ code: ERROR_CODES.VALIDATION_FAILED, severity: SEVERITY.LOW, retryable: false, ...opts });
    this.name = 'ValidationError';
  }
}

export class PaymentError extends AppError {
  constructor(opts = {}) {
    super({ code: ERROR_CODES.PAYMENT_FAILED, severity: SEVERITY.FATAL, retryable: false, ...opts });
    this.name = 'PaymentError';
  }
}

export class PermissionError extends AppError {
  constructor(opts = {}) {
    super({ code: ERROR_CODES.AUTH_PERMISSION_DENIED, severity: SEVERITY.HIGH, retryable: false, ...opts });
    this.name = 'PermissionError';
  }
}

export class ContentError extends AppError {
  constructor(opts = {}) {
    super({ code: ERROR_CODES.CONTENT_UPLOAD_FAILED, severity: SEVERITY.MEDIUM, retryable: true, ...opts });
    this.name = 'ContentError';
  }
}

// ── normalizeError ───────────────────────────────────────────────
// Wandelt JEDEN Error (nativ, Supabase, string, unknown) in AppError um.
export function normalizeError(err, context = {}) {
  if (err instanceof AppError) return err;

  // Supabase error format: { message, code, details, hint }
  if (err?.message && err?.code && typeof err.code === 'string' && err.code.length <= 5) {
    const isAuth = err.code === 'PGRST301' || err.code === '42501';
    const isNet  = err.code === 'ERR_NETWORK' || err.message?.includes('fetch');
    return new AppError({
      code:      isAuth ? ERROR_CODES.AUTH_PERMISSION_DENIED
                        : isNet ? ERROR_CODES.NETWORK_OFFLINE
                                : ERROR_CODES.UNKNOWN,
      message:   err.message,
      retryable: isNet,
      severity:  isAuth ? SEVERITY.HIGH : SEVERITY.MEDIUM,
      context:   { ...context, supabaseCode: err.code },
      cause:     err,
    });
  }

  // Network errors
  if (err?.name === 'AbortError') {
    return new NetworkError({
      code: ERROR_CODES.NETWORK_TIMEOUT,
      message: 'Anfrage abgebrochen (Timeout).',
      context,
      cause: err,
    });
  }

  if (!navigator?.onLine || err?.message?.toLowerCase().includes('network')) {
    return new NetworkError({ message: 'Keine Internetverbindung.', context, cause: err });
  }

  // Generic JS Error
  if (err instanceof Error) {
    return new AppError({
      code:     ERROR_CODES.UNKNOWN,
      message:  err.message || 'Unbekannter Fehler.',
      severity: SEVERITY.MEDIUM,
      context,
      cause:    err,
    });
  }

  // String error
  if (typeof err === 'string') {
    return new AppError({ code: ERROR_CODES.UNKNOWN, message: err, context });
  }

  return new AppError({ code: ERROR_CODES.UNKNOWN, context });
}

// ── isRetryable ──────────────────────────────────────────────────
export function isRetryable(err) {
  if (err instanceof AppError) return err.retryable;
  // Network errors sind immer retryable
  if (!navigator?.onLine) return true;
  if (err?.status >= 500) return true;
  return false;
}
