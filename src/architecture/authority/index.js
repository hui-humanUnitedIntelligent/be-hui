// src/architecture/authority/index.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Authority — ARCH-004
// Single Source of Architectural Authority
//
// Verwaltet ausschließlich Metadaten und Governance.
// Keine Runtime. Keine Produktlogik. Keine UI.
//
// Knowledge Graph, Semantic Layer und Architecture Intelligence
// beziehen sämtliche Architekturregeln ausschließlich aus dieser Authority.
// ══════════════════════════════════════════════════════════════════════════════

// ── Authority API ─────────────────────────────────────────────────────────────
export {
  getAuthorityState,
  getConstitution,
  getCurrentRules,
  getRule,
  getRuleHistory,
  getDecision,
  getDecisionHistory,
  getCurrentADR,
  getCurrentRFC,
  getCurrentPolicies,
  getCapabilities,
  getAuthorityGraph,
  getLifecycle,
  getGovernanceHealth,
} from './api/authorityApi.js';

// ── Registries ────────────────────────────────────────────────────────────────
export {
  buildAuthorityState,
  invalidateAuthorityCache,
  CANONICAL_DOMAINS,
  SCANNER_RULES,
  ADR_METADATA,
  RFC_METADATA,
} from './registries/registryBuilder.js';

// ── Status & Schema ───────────────────────────────────────────────────────────
export {
  STATUS,
  STATUS_LIST,
  BINDING_STATUSES,
  ACTIVE_STATUSES,
  STATUS_TRANSITIONS,
  isBindingStatus,
  isValidTransition,
} from './constants/statusModel.js';

export {
  createRule,
  createDecision,
  RULE_PRIORITY,
} from './constants/ruleSchema.js';

// ── Health ────────────────────────────────────────────────────────────────────
export { computeGovernanceHealth } from './health/governanceHealth.js';

// ── Graph ─────────────────────────────────────────────────────────────────────
export { buildAuthorityGraph } from './graph/authorityGraph.js';

// ── Reports ───────────────────────────────────────────────────────────────────
export {
  generateAllReports,
  generateAuthorityReport,
  generateGovernanceReport,
  generateRuleReport,
  generateDecisionReport,
  generateLifecycleReport,
  generateVersionReport,
  generatePolicyReport,
  generateHealthReport,
  generateComplianceReport,
  serializeReportsJson,
} from './reports/reportGenerator.js';

// ── Validation ────────────────────────────────────────────────────────────────
export {
  validateAuthority,
  validateModuleCompliance,
  validateReferences,
} from './validation/authorityValidator.js';

export { runCiChecks, AUTHORITY_OUT } from './validation/ciChecks.js';

// ── Loader ────────────────────────────────────────────────────────────────────
export {
  PROJECT_ROOT,
  GOVERNANCE_DIR,
  GENERATED_DIR,
  loadConstitutionDocument,
  loadAdrDocuments,
  loadRfcDocuments,
  loadPolicyDocuments,
  readGeneratedJson,
} from './loader/documentLoader.js';
