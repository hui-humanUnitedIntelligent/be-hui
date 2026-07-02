// src/architecture/intelligence/index.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Intelligence — ARCH-003
// Öffentliche API für Analyse, Erklärung, Validierung und Empfehlungen.
// ══════════════════════════════════════════════════════════════════════════════

import { runScan } from './runScan.js';
import { explain } from './explain.js';
import { validate, validateConstitution, validateAdrs, validateRfcs } from './validate.js';
import { simulate } from './simulate.js';
import { recommend, getRecommendations } from './recommend.js';
import { assessRisk, assessAllRisks } from './risk.js';
import { analyzePullRequest } from './prAnalysis.js';
import { traceDecision, buildDecisionTrace } from './decisionTrace.js';
import { generateAllReports } from './reports.js';
import { explainArchitecture } from './explain.js';

let _cachedScan = null;

/**
 * Führt vollständige Architektur-Analyse durch.
 * @param {{ srcRoot?: string, force?: boolean }} [options]
 */
export async function analyzeArchitecture(options = {}) {
  if (_cachedScan && !options.force) return _cachedScan;
  _cachedScan = await runScan(options.srcRoot, options);
  return _cachedScan;
}

/**
 * Analysiert einen Pull Request.
 * @param {{ diff?: string, changedFiles?: string[], title?: string }} pr
 * @param {ScanReport} [scan]
 */
export async function analyzePullRequestApi(pr, scan) {
  const s = scan || await analyzeArchitecture();
  return analyzePullRequest(pr, s);
}

/**
 * Erklärt Architektur-Elemente.
 * @param {{ type: string, target?: string }} query
 * @param {ScanReport} [scan]
 */
export async function explainApi(query, scan) {
  const s = scan || await analyzeArchitecture();
  return explain(query, s);
}

/**
 * Validiert Constitution / ADR / RFC oder Proposal.
 * @param {{ scope?: string, proposal?: object }} query
 * @param {ScanReport} [scan]
 */
export async function validateApi(query = {}, scan) {
  const s = scan || await analyzeArchitecture();
  return validate(query, s);
}

/**
 * Simuliert Architektur-Änderungen.
 * @param {object} change
 * @param {ScanReport} [scan]
 */
export async function simulateApi(change, scan) {
  const s = scan || await analyzeArchitecture();
  return simulate(change, s);
}

/**
 * Generiert Empfehlungen.
 * @param {{ violationId?: string, file?: string, minSeverity?: string, limit?: number }} query
 * @param {ScanReport} [scan]
 */
export async function recommendApi(query = {}, scan) {
  const s = scan || await analyzeArchitecture();
  return recommend(query, s);
}

/**
 * Erzeugt Decision Trace.
 * @param {{ recommendationId?: string, violationId?: string, recommendation?: object }} query
 * @param {ScanReport} [scan]
 */
export async function traceDecisionApi(query, scan) {
  const s = scan || await analyzeArchitecture();
  return traceDecision(query, s);
}

/**
 * Gibt Risiko-Bewertungen zurück.
 * @param {{ violationId?: string }} [query]
 * @param {ScanReport} [scan]
 */
export async function getRisks(query = {}, scan) {
  const s = scan || await analyzeArchitecture();
  if (query.violationId) {
    const violation = s.violations.find(v => v.id === query.violationId);
    if (!violation) return { error: `Violation nicht gefunden: ${query.violationId}` };
    return assessRisk({ violation, scan: s });
  }
  return assessAllRisks(s);
}

/**
 * Gibt Empfehlungen zurück.
 * @param {{ minSeverity?: string, limit?: number }} [options]
 * @param {ScanReport} [scan]
 */
export async function getRecommendationsApi(options = {}, scan) {
  const s = scan || await analyzeArchitecture();
  return getRecommendations(s, options);
}

/**
 * Berechnet Architecture Health Score (0-100).
 * @param {ScanReport} [scan]
 */
export async function getArchitectureHealth(scan) {
  const s = scan || await analyzeArchitecture();
  const m = s.metrics;

  const violationPenalty = Math.min(50,
    m.criticalViolations * 5 + m.highViolations * 2 + m.mediumViolations * 0.5
  );
  const adoptionBonus = (m.actionEnginePct + m.coreEnginePct + m.registryPct) / 6;
  const ownershipBonus = m.ownershipCoveragePct / 5;

  const score = Math.max(0, Math.min(100, Math.round(100 - violationPenalty + adoptionBonus + ownershipBonus - 50)));

  return {
    score,
    grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F',
    metrics: {
      violations: { total: m.totalViolations, critical: m.criticalViolations, high: m.highViolations },
      adoption: { actionEngine: m.actionEnginePct, coreEngine: m.coreEnginePct, registry: m.registryPct },
      ownership: m.ownershipCoveragePct,
    },
    blockMerge: m.criticalViolations > 0,
    sources: [{ type: 'scan', ref: 'docs/generated/metrics.json' }],
  };
}

/**
 * Constitution Compliance.
 */
export async function getConstitutionCompliance(scan) {
  const s = scan || await analyzeArchitecture();
  return validateConstitution(s);
}

/**
 * ADR Compliance.
 */
export async function getAdrCompliance(scan) {
  const s = scan || await analyzeArchitecture();
  return validateAdrs(s);
}

/**
 * RFC Compliance.
 */
export async function getRfcCompliance(scan) {
  const s = scan || await analyzeArchitecture();
  return validateRfcs(s);
}

/** Cache invalidieren */
export function clearScanCache() {
  _cachedScan = null;
}

// Re-exports für direkten Modul-Zugriff
export { runScan } from './runScan.js';
export {
  explain, explainArchitecture,
  explainNode, explainFeature, explainCapability, explainDomain,
  explainJourney, explainDecision, explainViolation, explainImpact,
} from './explain.js';
export { validate, validateConstitution, validateAdrs, validateRfcs, validateProposal } from './validate.js';
export {
  simulate, simulateChange, simulateDeletion, simulateMove,
  simulateRename, simulateSplit, simulateMerge, simulateOwnershipTransfer, simulateLayerMove,
} from './simulate.js';
export { recommend, getRecommendations, recommendForViolation } from './recommend.js';
export { assessRisk, assessAllRisks } from './risk.js';
export { analyzePullRequest, parseDiff } from './prAnalysis.js';
export { traceDecision, buildDecisionTrace } from './decisionTrace.js';
export { generateAllReports } from './reports.js';
export { SOURCE, CONFIDENCE, createStatement } from './confidence.js';
