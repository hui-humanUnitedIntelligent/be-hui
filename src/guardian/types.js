// src/guardian/types.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Release Guardian — Typen und Konstanten (GUARD-001)
// Grundlage: HUI_CONSTITUTION.md
// ══════════════════════════════════════════════════════════════════════════════

/** @typedef {'verified' | 'not_verified' | 'failed'} CheckStatus */

/**
 * @typedef {Object} CheckResult
 * @property {string} id
 * @property {string} label
 * @property {'git' | 'build' | 'deployment' | 'repository' | 'runtime'} category
 * @property {CheckStatus} status
 * @property {boolean} verified — true nur bei nachweisbarem Erfolg
 * @property {string[]} facts — ausschließlich überprüfbare Fakten
 * @property {Record<string, unknown>} [evidence]
 */

/**
 * @typedef {Object} GuardianReport
 * @property {string} version
 * @property {string} timestamp
 * @property {string} constitutionRef
 * @property {'IMPLEMENTIERT' | 'VERIFIZIERT' | 'NICHT VERIFIZIERT'} primaryStatus
 * @property {string[]} statusFlags
 * @property {CheckResult[]} checks
 * @property {Record<string, CheckResult>} summaryChecks
 * @property {string} ergebnis
 * @property {Record<string, unknown>} context
 */

export const GUARDIAN_VERSION = '1.0';
export const CONSTITUTION_REF = 'HUI_CONSTITUTION.md';

/** Checks die für VERIFIZIERT erforderlich sind (PR-Kontext) */
export const REQUIRED_FOR_VERIFIED = [
  'build.successful',
  'git.pr_present',
  'git.pr_merged',
  'runtime.in_bundle',
  'runtime.in_dom',
  'runtime.rendered',
];

/** Zusammenfassungs-Checks für den Report-Header */
export const SUMMARY_CHECK_IDS = {
  build:   'build.successful',
  pr:      'git.pr_present',
  merge:   'git.pr_merged',
  bundle:  'runtime.in_bundle',
  dom:     'runtime.in_dom',
  runtime: 'runtime.rendered',
};

/**
 * @param {string} id
 * @param {string} label
 * @param {CheckResult['category']} category
 * @param {CheckStatus} status
 * @param {string[]} facts
 * @param {Record<string, unknown>} [evidence]
 * @returns {CheckResult}
 */
export function makeCheck(id, label, category, status, facts, evidence = {}) {
  return {
    id,
    label,
    category,
    status,
    verified: status === 'verified',
    facts,
    evidence,
  };
}
