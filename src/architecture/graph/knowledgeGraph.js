// src/architecture/graph/knowledgeGraph.js
// ══════════════════════════════════════════════════════════════════════════════
// Knowledge Graph — ARCH-002 / ARCH-003
// Querybarer Graph aus Scan-Ergebnissen, Constitution, ADRs und RFCs.
// ══════════════════════════════════════════════════════════════════════════════

import { getDomainForPath, DOMAINS } from '../scanner/domains.js';
import { ARCHITECTURE_RULES } from '../governance/constitution.js';
import { loadAdrs } from '../governance/adrRegistry.js';
import { loadRfcs } from '../governance/rfcRegistry.js';

/** @typedef {{ id: string, type: string, label: string, data: Record<string, unknown> }} GraphNode */
/** @typedef {{ id: string, source: string, target: string, type: string, data?: Record<string, unknown> }} GraphEdge */

/**
 * Baut den Knowledge Graph aus Scan-Ergebnissen.
 * @param {Map<string, FileScanResult>} scanResults
 * @param {Violation[]} violations
 * @param {object} [options]
 * @returns {{ nodes: GraphNode[], edges: GraphEdge[], index: Map<string, GraphNode> }}
 */
export function buildKnowledgeGraph(scanResults, violations, options = {}) {
  const nodes = [];
  const edges = [];
  const index = new Map();
  const adrs = options.adrs || loadAdrs();
  const rfcs = options.rfcs || loadRfcs();

  const addNode = (node) => {
    if (!index.has(node.id)) {
      nodes.push(node);
      index.set(node.id, node);
    }
    return node;
  };

  const addEdge = (source, target, type, data = {}) => {
    edges.push({ id: `${source}→${target}:${type}`, source, target, type, data });
  };

  // Domain nodes
  for (const [id, domain] of Object.entries(DOMAINS)) {
    addNode({ id: `domain:${id}`, type: 'domain', label: domain.label, data: { ...domain } });
  }

  // Rule nodes
  for (const rule of Object.values(ARCHITECTURE_RULES)) {
    addNode({ id: `rule:${rule.id}`, type: 'rule', label: rule.title, data: { ...rule } });
  }

  // ADR / RFC nodes
  for (const adr of adrs) {
    addNode({ id: `adr:${adr.id}`, type: 'adr', label: adr.title, data: { ...adr } });
  }
  for (const rfc of rfcs) {
    addNode({ id: `rfc:${rfc.id}`, type: 'rfc', label: rfc.title, data: { ...rfc } });
  }

  // File nodes + domain membership
  for (const result of scanResults.values()) {
    if (!result) continue;
    const domain = getDomainForPath('src/' + result.path);
    const fileId = `file:${result.path}`;

    addNode({
      id: fileId,
      type: 'file',
      label: result.name,
      data: {
        path: result.path,
        lines: result.lines,
        domain,
        owner: result.header?.owner,
        responsibility: result.header?.responsibility,
        components: result.components?.length || 0,
        hooks: result.hooks?.length || 0,
      },
    });

    addEdge(fileId, `domain:${domain}`, 'belongs_to');

    // Import edges
    for (const imp of (result.imports || []).filter(i => i.type === 'relative')) {
      const targetPath = resolveImportPath(result.path, imp.source);
      if (targetPath) {
        addEdge(fileId, `file:${targetPath}`, 'imports', { line: imp.line });
      }
    }

    // DB write edges
    for (const call of (result.supabaseCalls || [])) {
      const tableId = `table:${call.table}`;
      addNode({ id: tableId, type: 'table', label: call.table, data: { isCoreTable: call.isCoreTable } });

      if (call.operation === 'SELECT') {
        addEdge(fileId, tableId, 'reads_from', { operation: call.operation, line: call.line });
      } else {
        addEdge(fileId, tableId, 'writes_to', { operation: call.operation, line: call.line });
      }
    }
  }

  // Violation nodes
  for (const v of violations) {
    const vId = `violation:${v.id}`;
    addNode({ id: vId, type: 'violation', label: v.type, data: { ...v } });
    addEdge(`file:${v.file}`, vId, 'violates');

    const rule = Object.values(ARCHITECTURE_RULES).find(r => r.violationTypes.includes(v.type));
    if (rule) addEdge(vId, `rule:${rule.id}`, 'governed_by');

    for (const adr of adrs.filter(a => a.violationTypes.includes(v.type))) {
      addEdge(vId, `adr:${adr.id}`, 'governed_by');
    }
  }

  // ADR governs file edges
  for (const adr of adrs) {
    for (const result of scanResults.values()) {
      if (!result) continue;
      const governed = adr.governedPaths.some(p =>
        result.path.startsWith(p.replace(/^src\//, '')) || `src/${result.path}`.startsWith(p)
      );
      if (governed) addEdge(`adr:${adr.id}`, `file:${result.path}`, 'governs');
    }
  }

  return { nodes, edges, index };
}

/**
 * Findet alle Dateien die von einer Datei abhängen (Reverse-Imports).
 * @param {string} filePath
 * @param {{ edges: GraphEdge[] }} graph
 */
export function getDependents(filePath, graph) {
  const fileId = `file:${filePath}`;
  return graph.edges
    .filter(e => e.target === fileId && e.type === 'imports')
    .map(e => e.source.replace('file:', ''));
}

/**
 * Findet alle Dateien die eine Datei importiert.
 * @param {string} filePath
 * @param {{ edges: GraphEdge[] }} graph
 */
export function getDependencies(filePath, graph) {
  const fileId = `file:${filePath}`;
  return graph.edges
    .filter(e => e.source === fileId && e.type === 'imports')
    .map(e => e.target.replace('file:', ''));
}

/**
 * Findet Violations für eine Datei.
 * @param {string} filePath
 * @param {Violation[]} violations
 */
export function getViolationsForFile(filePath, violations) {
  return violations.filter(v => v.file === filePath);
}

/**
 * Findet Tabellen die eine Datei beeinflusst.
 * @param {string} filePath
 * @param {{ edges: GraphEdge[] }} graph
 */
export function getTablesForFile(filePath, graph) {
  const fileId = `file:${filePath}`;
  return graph.edges
    .filter(e => e.source === fileId && (e.type === 'writes_to' || e.type === 'reads_from'))
    .map(e => ({ table: e.target.replace('table:', ''), ...e.data }));
}

/**
 * Findet alle Dateien in einer Domain.
 * @param {string} domain
 * @param {{ nodes: GraphNode[] }} graph
 */
export function getFilesInDomain(domain, graph) {
  return graph.nodes
    .filter(n => n.type === 'file' && n.data.domain === domain)
    .map(n => n.data.path);
}

/**
 * Findet Domain-Grenzüberschreitungen (Cross-Domain Imports).
 * @param {{ edges: GraphEdge[], index: Map<string, GraphNode> }} graph
 */
export function getCrossDomainImports(graph) {
  const crossings = [];
  for (const edge of graph.edges) {
    if (edge.type !== 'imports') continue;
    const source = graph.index.get(edge.source);
    const target = graph.index.get(edge.target);
    if (!source || !target) continue;
    if (source.data.domain !== target.data.domain) {
      crossings.push({
        from: source.data.path,
        to: target.data.path,
        fromDomain: source.data.domain,
        toDomain: target.data.domain,
        line: edge.data?.line,
      });
    }
  }
  return crossings;
}

function resolveImportPath(fromPath, importSource) {
  if (!importSource.startsWith('.')) return null;
  const parts = fromPath.split('/');
  parts.pop();
  for (const seg of importSource.split('/')) {
    if (seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  let resolved = parts.join('/');
  if (!resolved.match(/\.(js|jsx|ts|tsx)$/)) {
    resolved += '.jsx'; // heuristic — most files are jsx
  }
  return resolved;
}
