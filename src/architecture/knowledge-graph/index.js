// src/architecture/knowledge-graph/index.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Knowledge Graph — ARCH-002
// Haupt-Entry-Point und öffentliche Exports.
// ══════════════════════════════════════════════════════════════════════════════

export { NODE_TYPES, EDGE_TYPES, SCAN_VERSION } from './types.js';
export { buildKnowledgeGraph } from './graphAssembler.js';
export { createQueryEngine } from './queryEngine.js';
export { createImpactSimulator } from './impactSimulator.js';
export { generateAllMermaidGraphs, generateMermaidReport } from './mermaidGenerator.js';
export { generateAllReports } from './reportGenerator.js';
export { exportAllJson } from './jsonExporter.js';
export {
  buildGraph,
  getNode,
  getDependencies,
  getOwner,
  getConsumers,
  getViolations,
  getImpact,
  getLayer,
  getDomain,
  getMigrationPlan,
  query,
  simulateChange,
  createGraphAPI,
  clearCache,
} from './api.js';
