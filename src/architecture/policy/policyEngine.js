// src/architecture/policy/policyEngine.js
// ══════════════════════════════════════════════════════════════════════════════
// ARCH-006 — Policy Engine
// Zentrale Evaluations-Engine — ausschließlich Domain-Policy-basiert.
// ══════════════════════════════════════════════════════════════════════════════

import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadContracts, invalidateContractCache } from './contractLoader.js';
import { compilePolicies, getPoliciesForDomain } from './policyCompiler.js';
import { compileRules, getRulesForDomain } from './ruleCompiler.js';
import { resolveDomainForFile, invalidateDomainResolverCache } from './domainResolver.js';
import { evaluateScanResults, evaluateFileResult } from './evaluator.js';
import { computeDomainHealth, computePolicyHealth } from './healthEngine.js';
import { getRecommendationsFromViolations, enrichViolation } from './explanationEngine.js';
import { collectFiles, scanFile } from '../scanner/fileScanner.js';
import { calculateMetrics } from '../scanner/metricsCalculator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_SRC_ROOT = resolve(__dirname, '../../..', 'src');

let _state = null;

/**
 * Initialisiert oder lädt den Policy-Engine-State.
 * @param {{ force?: boolean }} [options]
 */
export function initializePolicyEngine(options = {}) {
  if (_state && !options.force) return _state;

  if (options.force) {
    invalidateContractCache();
    invalidateDomainResolverCache();
  }

  const contracts = loadContracts(options);
  const policies = compilePolicies(options);
  const rules = compileRules(options);

  _state = Object.freeze({
    version: 'ARCH-006',
    initializedAt: new Date().toISOString(),
    contracts,
    policies,
    rules,
    meta: contracts.meta,
  });

  return _state;
}

function ensureState() {
  return initializePolicyEngine();
}

/**
 * Evaluiert eine einzelne Datei.
 * @param {string} filePath
 * @param {string} [srcRoot]
 */
export function evaluateFile(filePath, srcRoot = DEFAULT_SRC_ROOT) {
  ensureState();
  const fullPath = filePath.startsWith('/') ? filePath : join(srcRoot, filePath);
  const result = scanFile(fullPath, srcRoot);
  if (!result) return { file: filePath, violations: [], domainId: 'UNKNOWN' };

  const domainId = resolveDomainForFile(result.path);
  const violations = evaluateFileResult(result, domainId, new Map([[result.path, result]]))
    .map(v => enrichViolation(v));

  return Object.freeze({ file: result.path, domainId, violations, scanResult: result });
}

/**
 * Evaluiert eine Domain.
 * @param {string} domainId
 * @param {string} [srcRoot]
 */
export function evaluateDomain(domainId, srcRoot = DEFAULT_SRC_ROOT) {
  const state = ensureState();
  const contract = state.contracts.byId[domainId];
  if (!contract) throw new Error(`Domain nicht gefunden: ${domainId}`);

  const files = collectFiles(srcRoot);
  const scanResults = new Map();
  const domainFiles = [];

  for (const file of files) {
    const result = scanFile(file, srcRoot);
    if (!result) continue;
    scanResults.set(result.path, result);
    if (resolveDomainForFile(result.path) === domainId) {
      domainFiles.push(result);
    }
  }

  const allViolations = evaluateScanResults(scanResults, state.rules);
  const violations = allViolations.filter(v => v.domainId === domainId);

  return Object.freeze({
    domainId,
    contract,
    policies: getPoliciesForDomain(domainId),
    rules: getRulesForDomain(domainId),
    fileCount: domainFiles.length,
    violations,
    health: computeDomainHealth(allViolations, domainFiles).domains[domainId],
  });
}

/**
 * Evaluiert das gesamte Repository.
 * @param {string} [srcRoot]
 */
export function evaluateRepository(srcRoot = DEFAULT_SRC_ROOT) {
  const startTime = Date.now();
  const state = ensureState();

  const files = collectFiles(srcRoot);
  const scanResults = new Map();
  for (const file of files) {
    const result = scanFile(file, srcRoot);
    if (result) scanResults.set(result.path, result);
  }

  const allResults = [...scanResults.values()];
  const violations = evaluateScanResults(scanResults, state.rules);
  const metrics = calculateMetrics(allResults, violations);
  const domainHealth = computeDomainHealth(violations, allResults);
  const policyHealth = computePolicyHealth(violations);

  return Object.freeze({
    version: 'ARCH-006',
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    srcRoot,
    metrics,
    violations,
    domainHealth,
    policyHealth,
    recommendations: getRecommendationsFromViolations(violations),
    policyCount: state.policies.length,
    ruleCount: state.rules.length,
    contractCount: state.contracts.domains.length,
  });
}

/**
 * Evaluiert einen Pull Request.
 * @param {{ changedFiles?: string[], diff?: string, title?: string }} pr
 * @param {string} [srcRoot]
 */
export function evaluatePullRequest(pr, srcRoot = DEFAULT_SRC_ROOT) {
  const repoEval = evaluateRepository(srcRoot);
  const changedFiles = pr.changedFiles || [];

  const prViolations = changedFiles.length
    ? repoEval.violations.filter(v => changedFiles.some(f => v.file?.includes(f)))
    : repoEval.violations;

  const blocking = prViolations.filter(v =>
    v.severity === 'CRITICAL' ||
    ['CONTRACT_VIOLATION', 'CROSS_DOMAIN_WRITE', 'OWNERSHIP_VIOLATION'].includes(v.type)
  );

  return Object.freeze({
    title: pr.title,
    changedFiles,
    violationCount: prViolations.length,
    violations: prViolations,
    blocking,
    blockMerge: blocking.length > 0,
    recommendations: getRecommendationsFromViolations(prViolations),
    policyHealth: repoEval.policyHealth,
  });
}

/**
 * Vollständige Architektur-Evaluation.
 * @param {string} [srcRoot]
 */
export function evaluateArchitecture(srcRoot = DEFAULT_SRC_ROOT) {
  return evaluateRepository(srcRoot);
}

/** State invalidieren */
export function invalidatePolicyEngine() {
  _state = null;
  invalidateContractCache();
  invalidateDomainResolverCache();
}

export function getPolicyState() {
  return ensureState();
}
