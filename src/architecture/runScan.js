// src/architecture/runScan.js
// Unified scan API — ARCH-001 + ARCH-002 + ARCH-002.1

import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { collectFiles, scanFile } from './scanner/fileScanner.js';
import { detectViolations } from './scanner/violationDetector.js';
import { calculateMetrics } from './scanner/metricsCalculator.js';
import {
  buildDependencyGraph,
  buildDomainGraph,
  buildLayerGraph,
  buildServiceGraph,
  buildOwnershipGraph,
} from './scanner/graphBuilder.js';
import { GraphStore } from './graph/graphStore.js';
import { buildTechnicalGraph } from './graph/technicalGraphBuilder.js';
import { buildSemanticGraph } from './semantic/semanticGraphBuilder.js';
import { createQueryApi } from './semantic/queryApi.js';
import { createExplainEngine } from './semantic/explainEngine.js';
import { createSimulationEngine } from './semantic/simulationEngine.js';
import { buildSemanticMermaidDiagrams, generateSemanticGraphReport } from './semantic/mermaidBuilder.js';
import { generateSemanticReports } from './semantic/reportGenerator.js';
import { SCAN_VERSION } from './graph/schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PROJECT_ROOT = resolve(__dirname, '../..');

/**
 * @typedef {Object} RunScanOptions
 * @property {boolean} [includeSemantic=true]
 * @property {boolean} [includeGraphs=true]
 * @property {string} [srcRoot]
 * @property {string} [projectRoot]
 */

/**
 * Full architecture scan — returns technical + semantic knowledge graph.
 * @param {string} [srcRoot]
 * @param {RunScanOptions} [options]
 */
export async function runScan(srcRoot, options = {}) {
  const projectRoot = options.projectRoot || DEFAULT_PROJECT_ROOT;
  const resolvedSrc = srcRoot || join(projectRoot, 'src');
  const includeSemantic = options.includeSemantic !== false;

  const files = collectFiles(resolvedSrc);
  const scanResults = new Map();
  for (const file of files) {
    const result = scanFile(file, resolvedSrc);
    if (result) scanResults.set(result.path, result);
  }

  const allResults = [...scanResults.values()];
  const violations = detectViolations(scanResults);
  const metrics = calculateMetrics(allResults, violations);
  metrics.scanVersion = SCAN_VERSION;

  const store = buildTechnicalGraph(allResults, violations, resolvedSrc);

  if (includeSemantic) {
    buildSemanticGraph(store, allResults, projectRoot);
  }

  const query = createQueryApi(store);
  const explain = createExplainEngine(store);
  const simulate = createSimulationEngine(store);

  const arch001Graphs = options.includeGraphs !== false ? {
    dependency: buildDependencyGraph(allResults),
    domain: buildDomainGraph(allResults, violations),
    layer: buildLayerGraph(allResults),
    service: buildServiceGraph(allResults),
    ownership: buildOwnershipGraph(allResults),
  } : null;

  const semanticDiagrams = includeSemantic ? buildSemanticMermaidDiagrams(store) : null;

  return {
    scanVersion: SCAN_VERSION,
    results: allResults,
    violations,
    metrics,
    graph: store,
    graphJSON: store.toJSON(),
    query,
    explain,
    simulate,
    graphs: arch001Graphs,
    semanticDiagrams,
    semanticGraphReport: semanticDiagrams ? generateSemanticGraphReport(semanticDiagrams) : null,
    semanticReports: includeSemantic ? generateSemanticReports(store, metrics) : null,

    // Convenience query methods (spec API)
    getCapabilities: () => query.getCapabilities(),
    getBusinessProcesses: () => query.getBusinessProcesses(),
    getJourneys: () => query.getJourneys(),
    getHumanPrinciples: () => query.getHumanPrinciples(),
    getArchitecturePrinciples: () => query.getArchitecturePrinciples(),
    getPlatformGoals: () => query.getPlatformGoals(),
    getQualityAttributes: () => query.getQualityAttributes(),
    getFeatureIntent: (f) => query.getFeatureIntent(f),
    getMeaning: (id) => query.getMeaning(id),
    getWhy: (id) => query.getWhy(id),
    explainNode: (id) => query.explainNode(id),
    explainFeature: (f) => query.explainFeature(f),
    whyDoesThisExist: (n) => query.whyDoesThisExist(n),
    whatProtects: (t) => query.whatProtects(t),
    whatWouldBreak: (id) => query.whatWouldBreak(id),
  };
}

export { GraphStore, SCAN_VERSION };
