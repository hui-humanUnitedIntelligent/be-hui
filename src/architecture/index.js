// src/architecture/index.js
// HUI Architecture — ARCH-001 + ARCH-002 + ARCH-002.1

export { runScan, GraphStore, SCAN_VERSION } from './runScan.js';
export { createQueryApi } from './semantic/queryApi.js';
export { createExplainEngine } from './semantic/explainEngine.js';
export { createSimulationEngine } from './semantic/simulationEngine.js';
export { buildSemanticMermaidDiagrams, generateSemanticGraphReport } from './semantic/mermaidBuilder.js';
export { generateSemanticReports } from './semantic/reportGenerator.js';
export { GraphStore as KnowledgeGraphStore } from './graph/graphStore.js';
export * from './graph/schema.js';

// ARCH-001 scanner re-exports (backward compatible)
export { collectFiles, scanFile } from './scanner/fileScanner.js';
export { detectViolations, SEVERITY } from './scanner/violationDetector.js';
export { calculateMetrics } from './scanner/metricsCalculator.js';
export {
  buildDependencyGraph,
  buildDomainGraph,
  buildLayerGraph,
  buildServiceGraph,
  buildOwnershipGraph,
} from './scanner/graphBuilder.js';
export {
  generateArchitectureReport,
  generateOwnershipReport,
  generateViolationsReport,
  generateActionEngineReport,
  generateRegistryReport,
  generateCoreReport,
  generateDependencyGraphReport,
} from './scanner/reportGenerator.js';
export { getDomainForPath, DOMAINS, isImportAllowed } from './scanner/domains.js';
