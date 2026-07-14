// src/architecture/policy/explanationEngine.js
// ══════════════════════════════════════════════════════════════════════════════
// ARCH-006 — Explanation Engine
// Erzeugt vollständige Erklärungen für jede Policy-Violation.
// ══════════════════════════════════════════════════════════════════════════════

import { getContract } from './contractLoader.js';
import { getPolicy } from './policyCompiler.js';
import { getRule } from './ruleCompiler.js';
import { computeConfidence, createStatement, SOURCE } from './confidence.js';

const RISK_BY_SEVERITY = {
  CRITICAL: 'Architektur-Integrität gefährdet — Merge blockieren',
  HIGH: 'Constitution-Verletzung — zeitnah beheben',
  MEDIUM: 'Technische Schuld — planen',
  LOW: 'Best Practice — optional',
  INFO: 'Dokumentation — bei Gelegenheit',
};

const MIGRATION_HINTS = {
  CORE_WRITE: 'Write in Domain-Service oder Core Engine verschieben',
  CROSS_DOMAIN_WRITE: 'Cross-Domain Write über Owner-Service delegieren',
  WORLD_DB_WRITE: 'Service-Layer in Owner-Domain einführen',
  OWNERSHIP_VIOLATION: 'Single Writer pro Tabelle herstellen',
  DOMAIN_IMPORT: 'Import-Richtung gemäß Contract korrigieren',
  DOMAIN_LAYER: 'Layer-Verschiebung gemäß Contract',
  DOMAIN_EVENT: 'Event über Domain-Boundary via emit()',
  DOMAIN_REALTIME: 'Realtime-Channel Owner prüfen',
  SERVICE_BYPASS: 'Service-API der Owner-Domain nutzen',
  HOOK_BYPASS: 'Hook in Owner-Domain kapseln',
  PAGE_BYPASS: 'Action Engine statt direktem Routing',
  COMPONENT_BYPASS: 'Logik in Service/Hook extrahieren',
  EVENT_ABUSE: 'Gamification/Attention-Pattern entfernen',
  CONTRACT_VIOLATION: 'Contract-Header und Ownership dokumentieren',
  STUDIO_AGGREGATOR: 'STUDIO als Aggregator — Writes delegieren',
  INTELLIGENCE_WRITE: 'Intelligence ist read-only — Write entfernen',
};

/**
 * Reichert eine Violation mit vollständiger Erklärung an.
 * @param {import('./types.js').PolicyViolation} violation
 */
export function enrichViolation(violation) {
  let contract, rule, policy;
  try { contract = getContract(violation.domainId || violation.contractId); } catch { contract = null; }
  try { if (violation.ruleId) rule = getRule(violation.ruleId); } catch { rule = null; }
  try { if (rule?.policyId) policy = getPolicy(rule.policyId); } catch { policy = null; }

  const confidence = computeConfidence({
    rule,
    domainResolved: violation.domainId,
    enforceable: rule?.enforceable !== false,
  });

  const explanation = {
    domain: violation.domainId,
    domainLabel: contract?.label || violation.domainId,
    contract: contract?.id,
    contractVersion: contract?.version,
    rule: rule?.id || violation.ruleId,
    ruleType: violation.type,
    policy: policy?.id || violation.policyId,
    constitution: rule?.constitutionRefs || contract?.constitution?.rules || [],
    adr: rule?.adrRefs || contract?.constitution?.adrs || [],
    rfc: rule?.rfcRefs || contract?.constitution?.rfcs || [],
    ownership: contract?.ownership || {},
    risk: RISK_BY_SEVERITY[violation.severity] || 'Unbekannt',
    recommendation: buildRecommendation(violation, contract, rule),
    migration: MIGRATION_HINTS[violation.type] || contract?.migration?.notes || 'Siehe Domain Contract',
    confidence,
    statement: createStatement(
      `${violation.message} [${violation.type}]`,
      confidence,
      SOURCE.CONTRACT
    ),
  };

  return { ...violation, explanation };
}

function buildRecommendation(violation, contract, rule) {
  const steps = [];

  if (contract?.intelligence?.recommendations?.length) {
    steps.push(...contract.intelligence.recommendations.slice(0, 2));
  }

  const migrationHint = MIGRATION_HINTS[violation.type];
  if (migrationHint) steps.push(migrationHint);

  if (rule?.description) steps.push(rule.description);

  if (!steps.length) {
    steps.push(`Verstoß ${violation.type} in ${violation.file} beheben`);
  }

  return steps;
}

/**
 * Erklärt eine Violation anhand ihrer ID.
 * @param {string} violationId
 * @param {import('./types.js').PolicyViolation[]} violations
 */
export function explainViolation(violationId, violations) {
  const violation = violations.find(v => v.id === violationId);
  if (!violation) return { error: `Violation nicht gefunden: ${violationId}` };
  return violation.explanation || enrichViolation(violation).explanation;
}

/**
 * Erzeugt Empfehlungen aus Violations.
 * @param {import('./types.js').PolicyViolation[]} violations
 */
export function getRecommendationsFromViolations(violations) {
  return violations
    .filter(v => ['CRITICAL', 'HIGH', 'MEDIUM'].includes(v.severity))
    .map(v => {
      const enriched = v.explanation ? v : enrichViolation(v);
      return {
        id: `REC-${v.id}`,
        violationId: v.id,
        domain: v.domainId,
        type: v.type,
        severity: v.severity,
        file: v.file,
        title: `Beheben: ${v.type}`,
        steps: enriched.explanation?.recommendation || [],
        migration: enriched.explanation?.migration,
        confidence: enriched.explanation?.confidence,
      };
    });
}
