// src/architecture/intelligence/decisionTrace.js
// ══════════════════════════════════════════════════════════════════════════════
// Decision Trace — ARCH-003
// Vollständige Nachvollziehbarkeit jeder Empfehlung.
// ══════════════════════════════════════════════════════════════════════════════

import { getRuleForViolationType } from '../governance/constitution.js';
import { getAdrsForViolationType } from '../governance/adrRegistry.js';
import { getDependents, getTablesForFile } from '../graph/knowledgeGraph.js';
import { SOURCE } from './confidence.js';

/**
 * Erzeugt Decision Trace für eine Empfehlung oder Violation.
 * @param {object} input — recommendation oder { violationId, violation }
 * @param {ScanReport} scan
 */
export function buildDecisionTrace(input, scan) {
  const violation = input.violation
    || scan.violations.find(v => v.id === input.violationId);

  const facts = [];
  const analyzedFiles = [];
  const appliedRules = [];
  const sources = [];
  let conclusion = '';

  if (violation) {
    facts.push({ type: 'violation', data: { id: violation.id, type: violation.type, severity: violation.severity, message: violation.message }, sourceType: SOURCE.EXPLICIT });
    analyzedFiles.push({ path: violation.file, line: violation.line, reason: 'Violation-Quelldatei' });

    const scanResult = scan.scanResults.get(violation.file);
    if (scanResult) {
      facts.push({ type: 'file-scan', data: { lines: scanResult.lines, domain: scanResult.header?.domain, supabaseCalls: scanResult.supabaseCalls?.length }, sourceType: SOURCE.EXPLICIT });
    }

    const rule = getRuleForViolationType(violation.type);
    if (rule) {
      appliedRules.push({ id: rule.id, title: rule.title, constitutionRef: rule.constitutionRef });
      sources.push({ type: 'constitution', ref: 'HUI_CONSTITUTION.md', section: rule.constitutionRef });
    }

    const adrs = getAdrsForViolationType(violation.type, scan.governance.adrs);
    for (const adr of adrs) {
      appliedRules.push({ id: adr.id, title: adr.title, type: 'adr' });
      sources.push({ type: 'adr', ref: adr.path });
    }

    const dependents = getDependents(violation.file, scan.graph);
    const tables = getTablesForFile(violation.file, scan.graph);

    if (dependents.length > 0) {
      facts.push({ type: 'dependents', data: { count: dependents.length, files: dependents.slice(0, 10) }, sourceType: SOURCE.DERIVED });
      dependents.slice(0, 5).forEach(d => analyzedFiles.push({ path: d, reason: 'Dependent' }));
    }

    if (tables.length > 0) {
      facts.push({ type: 'tables', data: tables, sourceType: SOURCE.EXPLICIT });
    }

    sources.push({ type: 'scan', ref: violation.file, line: violation.line });
    sources.push({ type: 'knowledge-graph', ref: 'src/architecture/graph/knowledgeGraph.js' });

    const title = input.title || `Verstoß beheben: ${violation.type}`;
    const affected = input.affectedFiles || [violation.file, ...dependents.slice(0, 5)];
    const riskScore = input.risk?.overall ?? '?';

    conclusion = `${violation.file} verletzt ${rule?.title || violation.type}. Empfehlung: ${title}. Betroffene Dateien: ${affected.slice(0, 5).join(', ')}. Risiko: ${riskScore}/10.`;
  }

  return {
    recommendationId: input.id || (violation ? `REC-${violation.id}` : null),
    factsUsed: facts,
    analyzedFiles,
    appliedRules,
    sources,
    conclusion,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Universelle traceDecision-Funktion.
 * @param {{ recommendationId?: string, violationId?: string, recommendation?: object }} query
 * @param {ScanReport} scan
 */
export function traceDecision(query, scan) {
  if (query.recommendation) {
    return buildDecisionTrace(query.recommendation, scan);
  }

  if (query.violationId) {
    const violation = scan.violations.find(v => v.id === query.violationId);
    if (!violation) return { error: `Violation nicht gefunden: ${query.violationId}` };
    return buildDecisionTrace({ violationId: query.violationId, violation }, scan);
  }

  return { error: 'recommendation, recommendationId oder violationId erforderlich' };
}
