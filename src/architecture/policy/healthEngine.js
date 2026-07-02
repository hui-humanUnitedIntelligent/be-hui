// src/architecture/policy/healthEngine.js
// ══════════════════════════════════════════════════════════════════════════════
// ARCH-006 — Domain Health Engine
// Berechnet Health-Scores pro Domain aus Policy-Compliance.
// ══════════════════════════════════════════════════════════════════════════════

import { loadContracts } from './contractLoader.js';
import { compilePolicies } from './policyCompiler.js';
import { compileRules } from './ruleCompiler.js';

const HEALTH_DIMENSIONS = [
  'ownership', 'layer', 'events', 'realtime', 'services', 'contexts',
  'hooks', 'imports', 'dependencies', 'documentation', 'constitution',
  'rfc', 'adr', 'migration', 'policyCompliance', 'contractCompliance',
];

/**
 * Berechnet Domain Health für alle Domains.
 * @param {import('./types.js').PolicyViolation[]} violations
 * @param {object[]} [files]
 */
export function computeDomainHealth(violations, files = []) {
  const contracts = loadContracts();
  const policies = compilePolicies();
  const rules = compileRules();

  const healthByDomain = {};

  for (const contract of contracts.domains) {
    healthByDomain[contract.id] = computeSingleDomainHealth(
      contract, violations, files, policies, rules
    );
  }

  return Object.freeze({
    generatedAt: new Date().toISOString(),
    domainCount: contracts.domains.length,
    domains: healthByDomain,
    overall: computeOverallHealth(healthByDomain),
  });
}

function computeSingleDomainHealth(contract, violations, files, policies, rules) {
  const domainViolations = violations.filter(v => v.domainId === contract.id);
  const domainFiles = (contract.files || []).map(f => f.path);
  const domainPolicies = policies.filter(p => p.domainId === contract.id);
  const domainRules = rules.filter(r => r.domainId === contract.id);

  const dimensions = {
    ownership: scoreDimension(domainViolations, ['OWNERSHIP_VIOLATION', 'DOMAIN_TABLE_OWNER', 'CROSS_DOMAIN_WRITE']),
    layer: scoreDimension(domainViolations, ['DOMAIN_LAYER']),
    events: scoreDimension(domainViolations, ['DOMAIN_EVENT', 'EVENT_ABUSE']),
    realtime: scoreDimension(domainViolations, ['DOMAIN_REALTIME']),
    services: scoreDimension(domainViolations, ['SERVICE_BYPASS', 'WORLD_DB_WRITE']),
    contexts: scoreDimension(domainViolations, ['DOMAIN_CONTEXT']),
    hooks: scoreDimension(domainViolations, ['HOOK_BYPASS']),
    imports: scoreDimension(domainViolations, ['DOMAIN_IMPORT']),
    dependencies: scoreImportMatrix(contract),
    documentation: scoreDocumentation(contract, files),
    constitution: scoreConstitution(contract, domainViolations),
    rfc: contract.constitution?.rfcs?.length ? 80 : 50,
    adr: contract.constitution?.adrs?.length ? 80 : 50,
    migration: contract.migration ? 70 : 60,
    policyCompliance: scorePolicyCompliance(domainViolations, domainPolicies.length),
    contractCompliance: scoreContractCompliance(domainViolations, domainRules.length),
  };

  const values = Object.values(dimensions);
  const overall = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  return Object.freeze({
    domainId: contract.id,
    label: contract.label,
    fileCount: contract.fileCount || domainFiles.length,
    violationCount: domainViolations.length,
    criticalCount: domainViolations.filter(v => v.severity === 'CRITICAL').length,
    policyCount: domainPolicies.length,
    ruleCount: domainRules.length,
    dimensions,
    overall,
    grade: gradeFromScore(overall),
  });
}

function scoreDimension(violations, types) {
  const count = violations.filter(v => types.includes(v.type)).length;
  if (count === 0) return 100;
  if (count <= 2) return 75;
  if (count <= 5) return 50;
  if (count <= 10) return 30;
  return 10;
}

function scoreImportMatrix(contract) {
  const matrix = contract.dependencies?.importMatrix;
  if (matrix?.allowed?.length || matrix?.forbidden?.length) return 85;
  return 50;
}

function scoreDocumentation(contract, files) {
  const hasFiles = (contract.files || []).length > 0;
  const hasScannerRules = (contract.scannerRules || []).length > 0;
  if (hasFiles && hasScannerRules) return 80;
  if (hasFiles) return 60;
  return 40;
}

function scoreConstitution(contract, violations) {
  const refs = contract.constitution?.rules?.length || 0;
  const critical = violations.filter(v => v.severity === 'CRITICAL').length;
  return Math.max(10, Math.min(100, refs * 10 + 50 - critical * 15));
}

function scorePolicyCompliance(violations, policyCount) {
  if (!policyCount) return 0;
  const penalty = violations.length * 5;
  return Math.max(0, Math.min(100, 100 - penalty));
}

function scoreContractCompliance(violations, ruleCount) {
  if (!ruleCount) return 0;
  const critical = violations.filter(v => ['CRITICAL', 'HIGH'].includes(v.severity)).length;
  return Math.max(0, Math.min(100, 100 - critical * 10 - violations.length * 2));
}

function computeOverallHealth(healthByDomain) {
  const scores = Object.values(healthByDomain).map(d => d.overall);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  return Object.freeze({
    score: avg,
    grade: gradeFromScore(avg),
    domainScores: Object.fromEntries(
      Object.entries(healthByDomain).map(([id, h]) => [id, h.overall])
    ),
  });
}

function gradeFromScore(score) {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  if (score >= 20) return 'D';
  return 'F';
}

/**
 * Berechnet Policy Health (Governance-Ebene).
 * @param {import('./types.js').PolicyViolation[]} violations
 */
export function computePolicyHealth(violations) {
  const contracts = loadContracts();
  const policies = compilePolicies();
  const rules = compileRules();

  const criticalTypes = new Set(['CRITICAL', 'CONTRACT_VIOLATION', 'CROSS_DOMAIN_WRITE', 'OWNERSHIP_VIOLATION']);
  const blocking = violations.filter(v =>
    v.severity === 'CRITICAL' ||
    criticalTypes.has(v.type) ||
    v.type === 'DOMAIN_OWNER_VIOLATION'
  );

  return Object.freeze({
    generatedAt: new Date().toISOString(),
    contractCount: contracts.domains.length,
    policyCount: policies.length,
    ruleCount: rules.length,
    violationCount: violations.length,
    criticalCount: violations.filter(v => v.severity === 'CRITICAL').length,
    blockingCount: blocking.length,
    blockMerge: blocking.length > 0,
    compliancePct: Math.max(0, Math.round(100 - violations.length * 0.5)),
    dimensions: HEALTH_DIMENSIONS,
  });
}

export { HEALTH_DIMENSIONS };
