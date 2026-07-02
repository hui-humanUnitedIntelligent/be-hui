// src/architecture/scanner/violationDetector.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Violation Detector — ARCH-001 + ARCH-006
//
// Regeln werden ausschließlich über Policy Engine aus Domain Contracts geladen.
// Keine lokalen Regeldefinitionen mehr.
// ══════════════════════════════════════════════════════════════════════════════

import { evaluateScanResults } from '../policy/evaluator.js';
import { compileRules, SEVERITY_BY_TYPE } from '../policy/ruleCompiler.js';
import { initializePolicyEngine } from '../policy/policyEngine.js';

/** Severity-Stufen — abgeleitet aus Policy Rule Compiler */
export const SEVERITY = Object.freeze({
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFO: 'INFO',
});

/**
 * Analysiert Scan-Ergebnisse gegen Domain Policies.
 * @param {Map<string, object>} scanResults
 * @returns {object[]}
 */
export function detectViolations(scanResults) {
  initializePolicyEngine();
  const rules = compileRules();
  return evaluateScanResults(scanResults, rules);
}

/** Export für Kompatibilität */
export { SEVERITY_BY_TYPE };
