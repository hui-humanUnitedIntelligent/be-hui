// src/architecture/policy/api.js
// ══════════════════════════════════════════════════════════════════════════════
// ARCH-006 — Policy API
// Öffentliche API für Scanner, Authority, Intelligence und CI.
// ══════════════════════════════════════════════════════════════════════════════

export { loadContracts, getContract, getAllContracts, invalidateContractCache } from './contractLoader.js';
export { compilePolicies, getPoliciesForDomain, getPolicy, POLICY_TYPES } from './policyCompiler.js';
export { compileRules, getRulesForDomain, getRule, RULE_TYPE_MAP, SEVERITY_BY_TYPE } from './ruleCompiler.js';
export {
  resolveDomainForFile,
  resolveAllDomainsForFile,
  isDomainImportAllowed,
  getContractForFile,
  getDomainForPath,
} from './domainResolver.js';
export { evaluateScanResults, evaluateFileResult } from './evaluator.js';
export {
  initializePolicyEngine,
  evaluateFile,
  evaluateDomain,
  evaluateRepository,
  evaluatePullRequest,
  evaluateArchitecture,
  getPolicyState,
  invalidatePolicyEngine,
  DEFAULT_SRC_ROOT,
} from './policyEngine.js';
export {
  enrichViolation,
  explainViolation,
  getRecommendationsFromViolations,
} from './explanationEngine.js';
export {
  computeDomainHealth,
  computePolicyHealth,
  HEALTH_DIMENSIONS,
} from './healthEngine.js';
export { CONFIDENCE, SOURCE, computeConfidence, createStatement } from './confidence.js';

import { evaluateRepository } from './policyEngine.js';
import { getRecommendationsFromViolations } from './explanationEngine.js';
import { computeDomainHealth, computePolicyHealth } from './healthEngine.js';

/** Unified evaluate() — delegiert an evaluateRepository */
export function evaluate(srcRoot) {
  return evaluateRepository(srcRoot);
}

/** Violations aus Evaluation */
export function getViolations(evaluation) {
  return evaluation?.violations || [];
}

/** Empfehlungen aus Evaluation */
export function getRecommendations(evaluation) {
  return getRecommendationsFromViolations(getViolations(evaluation));
}

/** Domain Health */
export function getDomainHealth(evaluation) {
  return evaluation?.domainHealth || computeDomainHealth(getViolations(evaluation));
}

/** Policy Health */
export function getPolicyHealth(evaluation) {
  return evaluation?.policyHealth || computePolicyHealth(getViolations(evaluation));
}
