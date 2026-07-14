// src/architecture/index.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture — ARCH-001 + ARCH-003
// Top-Level Entry Point für Scanner und Intelligence.
// ══════════════════════════════════════════════════════════════════════════════

// ARCH-001 Scanner
export * from './scanner/index.js';

// ARCH-003 Intelligence
export {
  analyzeArchitecture,
  analyzePullRequestApi as analyzePullRequest,
  explainApi as explain,
  validateApi as validate,
  simulateApi as simulate,
  recommendApi as recommend,
  traceDecisionApi as traceDecision,
  getRisks,
  getRecommendationsApi as getRecommendations,
  getArchitectureHealth,
  getConstitutionCompliance,
  getAdrCompliance,
  getRfcCompliance,
  clearScanCache,
  runScan,
} from './intelligence/index.js';

// Knowledge Graph (ARCH-002)
export * from './graph/index.js';

// Semantic Layer (ARCH-002.1)
export * from './semantic/index.js';

// Governance
export * from './governance/index.js';
