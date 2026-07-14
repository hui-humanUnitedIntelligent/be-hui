// src/architecture/knowledge-graph/graphAssembler.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Knowledge Graph — ARCH-002
// Assembliert den vollständigen Architektur-Graphen aus Quellcode-Analyse.
// ══════════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'fs';
import { join } from 'path';
import { getDomainForPath, DOMAINS } from '../scanner/domains.js';
import { detectViolations } from '../scanner/violationDetector.js';
import {
  nodeId, edgeId, resolveImportPath, baseName, classifyFile,
  detectContextUsage, detectServiceUsage, detectEngineUsage,
  detectActionUsage, detectContractUsage, detectRegistryUsage,
} from './utils.js';
import { NODE_TYPES, EDGE_TYPES, SCAN_VERSION } from './types.js';
import {
  parseConstitution, parseADRs, parseRFCs, parseDomainCharters, mapViolationsToRules,
} from './governanceParser.js';
import {
  scanMigrations, scanEdgeFunctions, scanRoutes, scanContracts,
  scanRegistry, scanTodoADRs, scanEngines,
} from './platformScanner.js';

/**
 * Baut den vollständigen Architecture Knowledge Graph.
 * @param {string} projectRoot
 * @param {string} srcRoot
 * @param {Map} scanResults — von ARCH-001 fileScanner
 * @returns {ArchitectureGraph}
 */
export function buildKnowledgeGraph(projectRoot, srcRoot, scanResults) {
  const nodes = new Map();
  const edges = [];
  const allResults = [...scanResults.values()].filter(Boolean);
  const violations = detectViolations(scanResults);

  const addNode = (node) => {
    if (node?.id) nodes.set(node.id, node);
  };
  const addEdge = (type, source, target, props = {}) => {
    if (!source || !target || source === target) return;
    edges.push({ id: edgeId(type, source, target, props.label), type, source, target, ...props });
  };

  // ── Governance ────────────────────────────────────────────────────────────
  const gov = parseConstitution(projectRoot);
  if (gov.constitution) addNode(gov.constitution);
  for (const r of gov.rules) addNode(r);
  for (const p of gov.pillars) addNode(p);
  for (const inv of gov.invariants) addNode(inv);

  for (const adr of parseADRs(projectRoot)) addNode(adr);
  for (const rfc of parseRFCs(projectRoot)) addNode(rfc);
  for (const charter of parseDomainCharters(projectRoot)) addNode(charter);

  // ── Layers & Domains ──────────────────────────────────────────────────────
  const layerSet = new Set();
  for (const [domainId, domain] of Object.entries(DOMAINS)) {
    addNode({
      id: nodeId(NODE_TYPES.DOMAIN, domainId),
      type: NODE_TYPES.DOMAIN,
      name: domainId,
      label: domain.label,
      layer: domain.layer,
      paths: domain.paths,
      color: domain.color,
    });
    const layerName = `Layer ${domain.layer}`;
    if (!layerSet.has(domain.layer)) {
      layerSet.add(domain.layer);
      addNode({
        id: nodeId(NODE_TYPES.LAYER, layerName),
        type: NODE_TYPES.LAYER,
        name: layerName,
        level: domain.layer,
      });
    }
    addEdge(EDGE_TYPES.BELONGS_TO, nodeId(NODE_TYPES.DOMAIN, domainId), nodeId(NODE_TYPES.LAYER, layerName));
    if (gov.constitution) {
      addEdge(EDGE_TYPES.PROTECTED_BY, nodeId(NODE_TYPES.DOMAIN, domainId), gov.constitution.id);
    }
  }

  // Domain dependency edges from charters
  for (const charter of parseDomainCharters(projectRoot)) {
    for (const dep of charter.allowedDependencies) {
      addEdge(EDGE_TYPES.DEPENDS_ON,
        nodeId(NODE_TYPES.DOMAIN, charter.name),
        nodeId(NODE_TYPES.DOMAIN, dep),
        { allowed: true });
    }
  }

  // ── Platform artifacts ────────────────────────────────────────────────────
  const { migrations, tables } = scanMigrations(projectRoot);
  for (const mig of migrations) addNode(mig);
  for (const table of tables) addNode(table);
  for (const mig of migrations) {
    for (const t of mig.tables) {
      addEdge(EDGE_TYPES.DEFINED_IN, nodeId(NODE_TYPES.SUPABASE_TABLE, t), mig.id);
    }
  }

  for (const fn of scanEdgeFunctions(projectRoot)) {
    addNode(fn);
    for (const t of fn.tables) {
      addEdge(EDGE_TYPES.USES, fn.id, nodeId(NODE_TYPES.SUPABASE_TABLE, t));
    }
  }

  for (const route of scanRoutes(projectRoot)) {
    addNode(route);
    addEdge(EDGE_TYPES.BELONGS_TO, route.id, nodeId(NODE_TYPES.DOMAIN, 'ROUTES'));
    if (route.owner) {
      addEdge(EDGE_TYPES.OWNS, nodeId(NODE_TYPES.STATE_OWNER, route.owner), route.id);
    }
  }

  const { contracts, actions } = scanContracts(projectRoot);
  for (const c of contracts) addNode(c);
  for (const a of actions) addNode(a);

  const registry = scanRegistry(projectRoot);
  if (registry) {
    addNode(registry);
    for (const e of registry.enums) addNode(e);
    for (const s of registry.signals) addNode(s);
    for (const e of registry.enums) addEdge(EDGE_TYPES.DEFINED_IN, e.id, registry.id);
    for (const s of registry.signals) addEdge(EDGE_TYPES.DEFINED_IN, s.id, registry.id);
  }

  for (const engine of scanEngines(projectRoot)) addNode(engine);

  for (const todo of scanTodoADRs(srcRoot, allResults)) addNode(todo);

  // ── File analysis ─────────────────────────────────────────────────────────
  const tableWriters = new Map();
  const tableReaders = new Map();
  const importGraph = new Map(); // targetPath → Set<sourcePath>
  const exportGraph = new Map(); // sourcePath → exports

  for (const result of allResults) {
    const fileId = nodeId(NODE_TYPES.FILE, result.path);
    const domain = getDomainForPath('src/' + result.path);
    const fileType = classifyFile(result.path, result);
    const content = readFileSync(join(srcRoot, result.path), 'utf8');

    const fileNode = {
      id: fileId,
      type: NODE_TYPES.FILE,
      name: result.path,
      path: result.path,
      domain,
      layer: DOMAINS[domain]?.layer ?? -1,
      lines: result.lines,
      fileType,
      owner: result.header?.owner || null,
      declaredDomain: result.header?.domain || null,
      exports: result.exports?.map(e => e.name) || [],
      components: result.components || [],
      hooks: result.hooks || [],
      supabaseReads: result.supabaseCalls?.filter(c => c.operation === 'SELECT').length || 0,
      supabaseWrites: result.supabaseCalls?.filter(c => c.operation !== 'SELECT').length || 0,
      usesActionEngine: result.actionEngine?.adopted || false,
      usesCoreEngine: result.coreEngine?.adopted || false,
      usesRegistry: result.registryUsage?.adopted || detectRegistryUsage(content),
      contexts: detectContextUsage(content, result.imports || []),
      services: detectServiceUsage(result.imports || []),
      engines: detectEngineUsage(content),
      actions: detectActionUsage(content),
      contracts: detectContractUsage(content, result.imports || []),
    };
    addNode(fileNode);
    addEdge(EDGE_TYPES.BELONGS_TO, fileId, nodeId(NODE_TYPES.DOMAIN, domain));

    // Typed sub-nodes
    for (const comp of result.components || []) {
      const compId = nodeId(NODE_TYPES.COMPONENT, `${result.path}::${comp}`);
      addNode({ id: compId, type: NODE_TYPES.COMPONENT, name: comp, file: result.path });
      addEdge(EDGE_TYPES.DEFINED_IN, compId, fileId);
    }
    for (const hook of result.hooks || []) {
      const hookId = nodeId(NODE_TYPES.HOOK, `${result.path}::${hook}`);
      addNode({ id: hookId, type: NODE_TYPES.HOOK, name: hook, file: result.path });
      addEdge(EDGE_TYPES.DEFINED_IN, hookId, fileId);
    }
    if (fileType === 'Page') {
      const pageId = nodeId(NODE_TYPES.PAGE, result.path);
      addNode({ id: pageId, type: NODE_TYPES.PAGE, name: baseName(result.path), path: result.path });
      addEdge(EDGE_TYPES.DEFINED_IN, pageId, fileId);
    }
    if (fileType === 'Feature') {
      const featId = nodeId(NODE_TYPES.FEATURE, result.path);
      addNode({ id: featId, type: NODE_TYPES.FEATURE, name: baseName(result.path), path: result.path });
      addEdge(EDGE_TYPES.DEFINED_IN, featId, fileId);
    }
    if (fileType === 'Context' || result.statePatterns?.createContext > 0) {
      const ctxId = nodeId(NODE_TYPES.CONTEXT, baseName(result.path));
      addNode({ id: ctxId, type: NODE_TYPES.CONTEXT, name: baseName(result.path), file: result.path });
      addEdge(EDGE_TYPES.DEFINED_IN, ctxId, fileId);
      if (result.statePatterns?.contextProvider > 0) {
        const provId = nodeId(NODE_TYPES.CONTEXT_PROVIDER, baseName(result.path));
        addNode({ id: provId, type: NODE_TYPES.CONTEXT_PROVIDER, name: baseName(result.path), file: result.path });
        addEdge(EDGE_TYPES.PROVIDES, provId, ctxId);
        addEdge(EDGE_TYPES.DEFINED_IN, provId, fileId);
      }
    }
    if (fileType === 'Service' || result.path.includes('services/')) {
      const svcId = nodeId(NODE_TYPES.SERVICE, baseName(result.path));
      addNode({ id: svcId, type: NODE_TYPES.SERVICE, name: baseName(result.path), file: result.path });
      addEdge(EDGE_TYPES.DEFINED_IN, svcId, fileId);
    }

    // Owner
    if (result.header?.owner) {
      const ownerId = nodeId(NODE_TYPES.STATE_OWNER, result.header.owner);
      addNode({ id: ownerId, type: NODE_TYPES.STATE_OWNER, name: result.header.owner });
      addEdge(EDGE_TYPES.OWNS, ownerId, fileId);
    }

    // Imports
    exportGraph.set(result.path, result.exports?.map(e => e.name) || []);
    for (const imp of result.imports || []) {
      if (imp.type === 'relative') {
        const targetPath = resolveImportPath(result.path, imp.source);
        addEdge(EDGE_TYPES.IMPORTS, fileId, nodeId(NODE_TYPES.FILE, targetPath), { line: imp.line });
        if (!importGraph.has(targetPath)) importGraph.set(targetPath, new Set());
        importGraph.get(targetPath).add(result.path);
      } else {
        addEdge(EDGE_TYPES.DEPENDS_ON, fileId, nodeId(NODE_TYPES.MODULE, imp.source), { external: true });
      }
    }

    // Supabase table access
    for (const call of result.supabaseCalls || []) {
      const tableNodeId = nodeId(NODE_TYPES.SUPABASE_TABLE, call.table);
      if (!nodes.has(tableNodeId)) {
        addNode({ id: tableNodeId, type: NODE_TYPES.SUPABASE_TABLE, name: call.table, inferred: true });
      }
      const edgeType = call.operation === 'SELECT' ? EDGE_TYPES.READS : EDGE_TYPES.WRITES;
      addEdge(edgeType, fileId, tableNodeId, { operation: call.operation, line: call.line });

      if (edgeType === EDGE_TYPES.WRITES) {
        if (!tableWriters.has(call.table)) tableWriters.set(call.table, new Set());
        tableWriters.get(call.table).add(result.path);
      } else {
        if (!tableReaders.has(call.table)) tableReaders.set(call.table, new Set());
        tableReaders.get(call.table).add(result.path);
      }

      // Table ownership
      const owner = result.header?.owner || baseName(result.path);
      addEdge(EDGE_TYPES.OWNS, nodeId(NODE_TYPES.STATE_OWNER, owner), tableNodeId, { via: result.path });
    }

    // Context usage
    for (const ctx of fileNode.contexts) {
      const ctxId = nodeId(NODE_TYPES.CONTEXT, ctx);
      if (!nodes.has(ctxId)) addNode({ id: ctxId, type: NODE_TYPES.CONTEXT, name: ctx, inferred: true });
      addEdge(EDGE_TYPES.USES_CONTEXT, fileId, ctxId);
      addEdge(EDGE_TYPES.CONSUMES, fileId, nodeId(NODE_TYPES.CONSUMER, baseName(result.path)));
    }

    // Service usage
    for (const svc of fileNode.services) {
      const svcId = nodeId(NODE_TYPES.SERVICE, svc);
      if (!nodes.has(svcId)) addNode({ id: svcId, type: NODE_TYPES.SERVICE, name: svc, inferred: true });
      addEdge(EDGE_TYPES.USES_SERVICE, fileId, svcId);
    }

    // Engine usage
    if (fileNode.usesCoreEngine) addEdge(EDGE_TYPES.USES_CORE, fileId, nodeId(NODE_TYPES.ENGINE, 'coreEngine.js'));
    for (const eng of fileNode.engines) {
      const engId = nodeId(NODE_TYPES.ENGINE, eng);
      if (!nodes.has(engId)) addNode({ id: engId, type: NODE_TYPES.ENGINE, name: eng, inferred: true });
      addEdge(EDGE_TYPES.USES_ENGINE, fileId, engId);
    }

    // Registry usage
    if (fileNode.usesRegistry && registry) addEdge(EDGE_TYPES.USES_REGISTRY, fileId, registry.id);

    // Action usage
    if (fileNode.usesActionEngine) addEdge(EDGE_TYPES.USES_ACTION, fileId, nodeId(NODE_TYPES.ENGINE, 'hui.actions.js'));
    for (const act of fileNode.actions) {
      const actId = nodeId(NODE_TYPES.ACTION, act);
      if (!nodes.has(actId)) addNode({ id: actId, type: NODE_TYPES.ACTION, name: act, inferred: true });
      addEdge(EDGE_TYPES.USES_ACTION, fileId, actId);
      addEdge(EDGE_TYPES.CALLS, fileId, actId);
    }

    // Contract usage
    if (fileNode.contracts.usesContracts) {
      addEdge(EDGE_TYPES.USES_CONTRACT, fileId, nodeId(NODE_TYPES.FILE, 'core/hui.contracts.js'));
      for (const c of fileNode.contracts.contracts) {
        addEdge(EDGE_TYPES.USES_CONTRACT, fileId, nodeId(NODE_TYPES.CONTRACT, c));
      }
    }
  }

  // ── Violations ────────────────────────────────────────────────────────────
  for (const v of violations) {
    const vId = nodeId(NODE_TYPES.VIOLATION, v.id);
    addNode({
      id: vId,
      type: NODE_TYPES.VIOLATION,
      name: v.type,
      severity: v.severity,
      file: v.file,
      line: v.line,
      message: v.message,
      domain: v.domain,
      table: v.table || null,
    });
    addEdge(EDGE_TYPES.VIOLATES, nodeId(NODE_TYPES.FILE, v.file), vId);
    addEdge(EDGE_TYPES.DEFINED_IN, vId, nodeId(NODE_TYPES.FILE, v.file));

    for (const ruleName of mapViolationsToRules(v.type)) {
      const ruleNode = [...nodes.values()].find(n =>
        n.type === NODE_TYPES.CONSTITUTION_RULE && n.name.includes(ruleName)
      ) || [...nodes.values()].find(n =>
        n.type === NODE_TYPES.RFC && n.name === ruleName
      );
      if (ruleNode) addEdge(EDGE_TYPES.PROTECTED_BY, vId, ruleNode.id, { violated: true });
    }
  }

  // Consumer edges: files that import a given file
  for (const [targetPath, sources] of importGraph) {
    for (const src of sources) {
      addEdge(EDGE_TYPES.CONSUMES,
        nodeId(NODE_TYPES.CONSUMER, baseName(src)),
        nodeId(NODE_TYPES.FILE, targetPath));
    }
  }

  // Build indexes for fast lookup
  const indexes = buildIndexes(nodes, edges, importGraph, tableWriters, tableReaders);

  return {
    version: SCAN_VERSION,
    generatedAt: new Date().toISOString(),
    stats: {
      nodes: nodes.size,
      edges: edges.length,
      files: allResults.length,
      violations: violations.length,
      tables: tables.length,
      domains: Object.keys(DOMAINS).length,
    },
    nodes,
    edges,
    indexes,
    importGraph,
    tableWriters,
    tableReaders,
    violations,
    scanResults: allResults,
  };
}

function buildIndexes(nodes, edges, importGraph, tableWriters, tableReaders) {
  const byType = new Map();
  const byName = new Map();
  const outgoing = new Map();
  const incoming = new Map();

  for (const node of nodes.values()) {
    if (!byType.has(node.type)) byType.set(node.type, []);
    byType.get(node.type).push(node.id);
    byName.set(node.name, node.id);
    if (node.path) byName.set(node.path, node.id);
  }

  for (const edge of edges) {
    if (!outgoing.has(edge.source)) outgoing.set(edge.source, []);
    outgoing.get(edge.source).push(edge);
    if (!incoming.has(edge.target)) incoming.set(edge.target, []);
    incoming.get(edge.target).push(edge);
  }

  return { byType, byName, outgoing, incoming, importGraph, tableWriters, tableReaders };
}
