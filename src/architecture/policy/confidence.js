// src/architecture/policy/confidence.js
// ══════════════════════════════════════════════════════════════════════════════
// ARCH-006 — Confidence Scoring
// ══════════════════════════════════════════════════════════════════════════════

export const CONFIDENCE = Object.freeze({
  CERTAIN: 1.0,
  HIGH: 0.85,
  MEDIUM: 0.65,
  LOW: 0.4,
  UNCERTAIN: 0.2,
});

export const SOURCE = Object.freeze({
  CONTRACT: 'domain-contract',
  POLICY: 'compiled-policy',
  RULE: 'compiled-rule',
  SCAN: 'file-scan',
  CONSTITUTION: 'constitution',
  ADR: 'adr',
  RFC: 'rfc',
});

/**
 * Berechnet Confidence für eine Violation.
 * @param {object} params
 */
export function computeConfidence(params) {
  const { rule, fileResult, domainResolved, enforceable = true } = params;
  let score = CONFIDENCE.MEDIUM;

  if (enforceable && rule?.enforceable !== false) score += 0.15;
  if (domainResolved && domainResolved !== 'UNKNOWN') score += 0.1;
  if (fileResult?.header?.hasDomainTag) score += 0.05;
  if (rule?.constitutionRefs?.length) score += 0.05;
  if (['CRITICAL', 'HIGH'].includes(rule?.severity)) score += 0.05;

  return Math.min(1, Math.max(0.1, score));
}

/**
 * Erzeugt ein begründetes Statement.
 * @param {string} text
 * @param {number} confidence
 * @param {string} source
 */
export function createStatement(text, confidence = CONFIDENCE.MEDIUM, source = SOURCE.POLICY) {
  return Object.freeze({ text, confidence, source, generatedAt: new Date().toISOString() });
}
