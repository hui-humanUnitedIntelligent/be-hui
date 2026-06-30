// src/architecture/scanner/index.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Scanner — ARCH-001
// Haupt-Entry-Point für den Scanner.
//
// Exportiert:
//   runScan(srcRoot, options) → ScanReport
//   alle Sub-Scanner als Named Exports
// ══════════════════════════════════════════════════════════════════════════════

export { collectFiles, scanFile } from './fileScanner.js';
export { detectViolations, SEVERITY } from './violationDetector.js';
export { calculateMetrics } from './metricsCalculator.js';
export {
  buildDependencyGraph,
  buildDomainGraph,
  buildLayerGraph,
  buildServiceGraph,
  buildOwnershipGraph,
} from './graphBuilder.js';
export {
  generateArchitectureReport,
  generateOwnershipReport,
  generateViolationsReport,
  generateActionEngineReport,
  generateRegistryReport,
  generateCoreReport,
  generateDependencyGraphReport,
} from './reportGenerator.js';
export { getDomainForPath, DOMAINS, isImportAllowed } from './domains.js';
export { runScan } from '../intelligence/runScan.js';
