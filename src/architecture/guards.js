// src/architecture/guards.js
// ══════════════════════════════════════════════════════════════
// HUI Architecture Guards — CORE-001
// Dev-Warnings und Assertions — KEINE Laufzeit-Änderung in Prod
// ══════════════════════════════════════════════════════════════

import { getTableOwner } from './domains.js';

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

/**
 * Warn when a UI component performs a direct Supabase write.
 * No-op in production — observability only.
 *
 * @param {string} callerFile - e.g. 'components/WorkDetailPage.jsx'
 * @param {string} table
 * @param {'select'|'insert'|'update'|'delete'|'upsert'} operation
 * @param {import('./domains.js').HuiDomain} [callerDomain]
 */
export function warnDirectDbAccess(callerFile, table, operation, callerDomain) {
  if (!isDev) return;

  const tableOwner = getTableOwner(table);
  const isWrite = operation !== 'select';

  if (!isWrite) return;

  const isUiLayer = callerFile.includes('components/') || callerFile.includes('pages/');
  if (!isUiLayer) return;

  console.warn(
    `%c[HUI ARCH GUARD]%c Direct DB ${operation} on "${table}" in ${callerFile}`,
    'color:#F59E0B;font-weight:800',
    'color:#6B7280',
    {
      violation: 'ADR-0001 §3 — UI darf nicht direkt schreiben',
      tableOwner,
      callerDomain,
      migration: `Route through ${tableOwner || 'domain'} service`,
    }
  );
}

/**
 * Warn when Action Engine is bypassed for navigation/state transitions.
 *
 * @param {string} callerFile
 * @param {string} action - e.g. 'setShowWirker', 'navigate'
 */
export function warnActionEngineBypass(callerFile, action) {
  if (!isDev) return;

  console.warn(
    `%c[HUI ARCH GUARD]%c Action Engine bypass: ${action} in ${callerFile}`,
    'color:#EF4444;font-weight:800',
    'color:#6B7280',
    {
      violation: 'ADR-0001 §4 — Interaktionen über useHuiActions()',
      migration: 'Use A.* constants from hui.actions.js',
    }
  );
}

/**
 * Warn when a hook contains business logic (DB writes).
 *
 * @param {string} hookFile
 * @param {string} description
 */
export function warnHookBusinessLogic(hookFile, description) {
  if (!isDev) return;

  console.warn(
    `%c[HUI ARCH GUARD]%c Hook business logic: ${hookFile}`,
    'color:#A78BFA;font-weight:800',
    'color:#6B7280',
    { description, migration: 'Move to domain service or context owner' }
  );
}

/**
 * Warn on cross-domain write access.
 *
 * @param {string} callerFile
 * @param {import('./domains.js').HuiDomain} callerDomain
 * @param {string} table
 */
export function warnCrossDomainAccess(callerFile, callerDomain, table) {
  if (!isDev) return;

  const tableOwner = getTableOwner(table);
  if (!tableOwner || tableOwner === callerDomain) return;

  console.warn(
    `%c[HUI ARCH GUARD]%c Cross-domain write: ${callerDomain} → ${table} (owned by ${tableOwner})`,
    'color:#DC2626;font-weight:800',
    'color:#6B7280',
    { callerFile, migration: `Delegate to ${tableOwner} service` }
  );
}

/**
 * Assert architecture invariant — throws only in dev, logs in prod.
 *
 * @param {boolean} condition
 * @param {string} message
 */
export function assertArchitecture(condition, message) {
  if (condition) return;
  if (isDev) {
    console.error(`%c[HUI ARCH ASSERT]%c ${message}`, 'color:#DC2626;font-weight:800', 'color:#6B7280');
  }
}

/**
 * Log ownership metadata on module init (dev only).
 *
 * @param {string} file
 * @param {import('./domains.js').HuiDomain} domain
 * @param {string} role
 */
export function logDomainOwnership(file, domain, role) {
  if (!isDev) return;
  if (typeof window === 'undefined') return;
  if (!window.__HUI_ARCH_DEBUG__) return;

  console.log(
    `%c[HUI DOMAIN]%c ${domain}/${role} → ${file}`,
    'color:#0DC4B5;font-weight:700',
    'color:#4B5563'
  );
}
