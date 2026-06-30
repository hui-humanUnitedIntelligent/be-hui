// src/architecture/knowledge-graph/api.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Knowledge Graph — ARCH-002
// Öffentliche API für ARCH-003 (Architecture Guardian) und CI-Integration.
// ══════════════════════════════════════════════════════════════════════════════

import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { collectFiles, scanFile } from '../scanner/fileScanner.js';
import { buildKnowledgeGraph } from './graphAssembler.js';
import { createQueryEngine } from './queryEngine.js';
import { createImpactSimulator } from './impactSimulator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PROJECT_ROOT = resolve(__dirname, '../../..');
const DEFAULT_SRC_ROOT = join(DEFAULT_PROJECT_ROOT, 'src');

let _cachedGraph = null;
let _cachedQuery = null;
let _cachedSimulator = null;

/**
 * Baut den Knowledge Graph (mit optionalem Cache).
 */
export async function buildGraph(options = {}) {
  const projectRoot = options.projectRoot || DEFAULT_PROJECT_ROOT;
  const srcRoot = options.srcRoot || DEFAULT_SRC_ROOT;
  const useCache = options.cache !== false;

  if (useCache && _cachedGraph && !options.force) {
    return _cachedGraph;
  }

  const files = collectFiles(srcRoot);
  const scanResults = new Map();
  for (const file of files) {
    const result = scanFile(file, srcRoot);
    if (result) scanResults.set(result.path, result);
  }

  const graph = buildKnowledgeGraph(projectRoot, srcRoot, scanResults);
  graph.queryEngine = createQueryEngine(graph);
  graph.impactSimulator = createImpactSimulator(graph, graph.queryEngine);

  if (useCache) {
    _cachedGraph = graph;
    _cachedQuery = graph.queryEngine;
    _cachedSimulator = graph.impactSimulator;
  }

  return graph;
}

function getQuery(graph) {
  return graph?.queryEngine || _cachedQuery;
}

function getSimulator(graph) {
  return graph?.impactSimulator || _cachedSimulator;
}

/** Einzelnen Knoten abrufen */
export function getNode(graph, idOrName) {
  return getQuery(graph).getNode(idOrName);
}

/** Abhängigkeiten eines Knotens */
export function getDependencies(graph, nameOrPath) {
  return getQuery(graph).getDependencies(nameOrPath);
}

/** Owner einer Tabelle oder Datei */
export function getOwner(graph, tableOrFile) {
  return getQuery(graph).getOwner(tableOrFile);
}

/** Consumer eines Services oder Contexts */
export function getConsumers(graph, serviceOrContext) {
  return getQuery(graph).getConsumers(serviceOrContext);
}

/** Violations für Datei oder Domain */
export function getViolations(graph, fileOrDomain) {
  return getQuery(graph).getViolations(fileOrDomain);
}

/** Impact-Analyse */
export function getImpact(graph, nameOrPath, depth = 5) {
  return getQuery(graph).getImpact(nameOrPath, depth);
}

/** Layer einer Datei */
export function getLayer(graph, nameOrPath) {
  return getQuery(graph).getLayer(nameOrPath);
}

/** Domain einer Datei */
export function getDomain(graph, nameOrPath) {
  return getQuery(graph).getDomain(nameOrPath);
}

/** Migrationsplan für Tabelle */
export function getMigrationPlan(graph, tableName) {
  return getQuery(graph).getMigrationPlan(tableName);
}

/** Generische Query */
export function query(graph, spec) {
  return getQuery(graph).query(spec);
}

/** Refactoring-Simulation */
export function simulateChange(graph, target, action = 'modify', options = {}) {
  return getSimulator(graph).simulate(target, action, options);
}

/** Cache leeren */
export function clearCache() {
  _cachedGraph = null;
  _cachedQuery = null;
  _cachedSimulator = null;
}

/** Vollständige API als Objekt (für ARCH-003) */
export function createGraphAPI(graph) {
  const q = getQuery(graph);
  const sim = getSimulator(graph);
  return {
    getNode: (id) => q.getNode(id),
    getNodesByType: (type) => q.getNodesByType(type),
    getDependencies: (name) => q.getDependencies(name),
    getDependents: (name) => q.getDependents(name),
    getOwner: (name) => q.getOwner(name),
    getConsumers: (name) => q.getConsumers(name),
    getViolations: (name) => q.getViolations(name),
    getImpact: (name, depth) => q.getImpact(name, depth),
    getLayer: (name) => q.getLayer(name),
    getDomain: (name) => q.getDomain(name),
    getMigrationPlan: (table) => q.getMigrationPlan(table),
    query: (spec) => q.query(spec),
    simulate: (target, action, opts) => sim.simulate(target, action, opts),
    whoOwns: (table) => q.whoOwns(table),
    whoWrites: (table) => q.whoWrites(table),
    whoReads: (table) => q.whoReads(table),
    findCircularDependencies: () => q.findCircularDependencies(),
    graph: {
      nodes: graph.nodes,
      edges: graph.edges,
      stats: graph.stats,
      version: graph.version,
    },
  };
}
