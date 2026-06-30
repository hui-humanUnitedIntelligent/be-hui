// src/architecture/knowledge-graph/queryEngine.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Knowledge Graph — ARCH-002
// Traversal- und Query-Engine für Architektur-Fragen.
// ══════════════════════════════════════════════════════════════════════════════

import { nodeId } from './utils.js';
import { NODE_TYPES, EDGE_TYPES } from './types.js';

/**
 * Erstellt eine Query-Engine für einen gebauten Graphen.
 */
export function createQueryEngine(graph) {
  const { nodes, edges, indexes } = graph;

  const findNode = (idOrName) => {
    if (nodes.has(idOrName)) return nodes.get(idOrName);
    const byName = indexes.byName.get(idOrName);
    if (byName) return nodes.get(byName);
    // Fuzzy: partial path match
    for (const [id, node] of nodes) {
      if (node.path?.includes(idOrName) || node.name === idOrName) return node;
    }
    return null;
  };

  const getEdges = (nodeId, direction = 'out', edgeType = null) => {
    const source = direction === 'out' ? indexes.outgoing : indexes.incoming;
    const key = direction === 'out' ? nodeId : nodeId;
    const edgeList = (direction === 'out' ? indexes.outgoing : indexes.incoming).get(key) || [];
    return edgeType ? edgeList.filter(e => e.type === edgeType) : edgeList;
  };

  const getNeighbors = (nodeId, edgeType = null, direction = 'out') => {
    const edgeList = getEdges(nodeId, direction, edgeType);
    const neighborKey = direction === 'out' ? 'target' : 'source';
    return edgeList.map(e => nodes.get(e[neighborKey])).filter(Boolean);
  };

  const bfs = (startId, edgeTypes = null, maxDepth = 10) => {
    const visited = new Set();
    const queue = [{ id: startId, depth: 0 }];
    const result = [];

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (visited.has(id) || depth > maxDepth) continue;
      visited.add(id);
      const node = nodes.get(id);
      if (node && id !== startId) result.push({ node, depth });

      const outEdges = indexes.outgoing.get(id) || [];
      for (const edge of outEdges) {
        if (!edgeTypes || edgeTypes.includes(edge.type)) {
          queue.push({ id: edge.target, depth: depth + 1 });
        }
      }
    }
    return result;
  };

  const bfsReverse = (startId, edgeTypes = null, maxDepth = 10) => {
    const visited = new Set();
    const queue = [{ id: startId, depth: 0 }];
    const result = [];

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (visited.has(id) || depth > maxDepth) continue;
      visited.add(id);
      const node = nodes.get(id);
      if (node && id !== startId) result.push({ node, depth });

      const inEdges = indexes.incoming.get(id) || [];
      for (const edge of inEdges) {
        if (!edgeTypes || edgeTypes.includes(edge.type)) {
          queue.push({ id: edge.source, depth: depth + 1 });
        }
      }
    }
    return result;
  };

  return {
    /**
     * Generische Graph-Query.
     */
    query(spec) {
      const { type, name, edgeType, direction = 'out', depth = 1 } = spec;
      const node = findNode(name || type);
      if (!node) return { found: false, results: [] };

      if (depth === 0) return { found: true, node, results: [node] };

      const traverser = direction === 'in' ? bfsReverse : bfs;
      const results = traverser(node.id, edgeType ? [edgeType] : null, depth);
      return { found: true, node, results };
    },

    getNode(idOrName) {
      return findNode(idOrName);
    },

    getNodesByType(type) {
      const ids = indexes.byType.get(type) || [];
      return ids.map(id => nodes.get(id)).filter(Boolean);
    },

    getDependencies(nameOrPath) {
      const node = findNode(nameOrPath);
      if (!node) return [];
      return getNeighbors(node.id, EDGE_TYPES.IMPORTS)
        .concat(getNeighbors(node.id, EDGE_TYPES.DEPENDS_ON));
    },

    getDependents(nameOrPath) {
      const node = findNode(nameOrPath);
      if (!node) return [];
      const importers = graph.importGraph?.get(node.path || node.name);
      if (importers) {
        return [...importers].map(p => findNode(p)).filter(Boolean);
      }
      return bfsReverse(node.id, [EDGE_TYPES.IMPORTS]).map(r => r.node);
    },

    getOwner(tableOrFile) {
      const tableNode = findNode(tableOrFile) ||
        findNode(nodeId(NODE_TYPES.SUPABASE_TABLE, tableOrFile));
      if (!tableNode) return null;

      const owners = getNeighbors(tableNode.id, EDGE_TYPES.OWNS, 'in');
      if (owners.length) return owners;

      const writers = graph.tableWriters?.get(tableOrFile);
      if (writers) {
        return [...writers].map(p => findNode(p)).filter(Boolean);
      }
      return null;
    },

    getConsumers(serviceOrContext) {
      const node = findNode(serviceOrContext) ||
        findNode(nodeId(NODE_TYPES.SERVICE, serviceOrContext)) ||
        findNode(nodeId(NODE_TYPES.CONTEXT, serviceOrContext));
      
      const results = new Map();
      const add = (n) => { if (n?.id) results.set(n.id, n); };

      if (node) {
        getNeighbors(node.id, EDGE_TYPES.USES_SERVICE, 'in').forEach(add);
        getNeighbors(node.id, EDGE_TYPES.USES_CONTEXT, 'in').forEach(add);
        bfsReverse(node.id, [EDGE_TYPES.IMPORTS]).forEach(r => add(r.node));
      }

      // Dateien die den Context/Service per Import laden
      const nameLower = serviceOrContext.toLowerCase();
      for (const fileNode of nodes.values()) {
        if (fileNode.type !== NODE_TYPES.FILE) continue;
        const importsContext = (fileNode.contexts || []).some(c =>
          c.toLowerCase() === nameLower || c.toLowerCase().includes(nameLower)
        );
        const importsService = (fileNode.services || []).some(s =>
          s.toLowerCase() === nameLower || s.toLowerCase().includes(nameLower)
        );
        const importsFile = (fileNode.path || '').toLowerCase().includes(nameLower) ||
          graph.edges.some(e =>
            e.type === EDGE_TYPES.IMPORTS && e.source === fileNode.id &&
            (graph.nodes.get(e.target)?.path || '').toLowerCase().includes(nameLower)
          );
        if (importsContext || importsService || importsFile) add(fileNode);
      }

      return [...results.values()];
    },

    getViolations(fileOrDomain) {
      const node = findNode(fileOrDomain);
      if (node?.type === NODE_TYPES.VIOLATION) return [node];

      if (node) {
        return getNeighbors(node.id, EDGE_TYPES.VIOLATES, 'in')
          .concat(getNeighbors(node.id, null, 'out').filter(n => n.type === NODE_TYPES.VIOLATION));
      }

      return [...nodes.values()].filter(n =>
        n.type === NODE_TYPES.VIOLATION &&
        (n.file?.includes(fileOrDomain) || n.domain === fileOrDomain)
      );
    },

    getLayer(nameOrPath) {
      const node = findNode(nameOrPath);
      if (!node) return null;
      if (node.layer !== undefined) return node.layer;
      if (node.domain) {
        const domainNode = findNode(nodeId(NODE_TYPES.DOMAIN, node.domain));
        return domainNode?.layer ?? null;
      }
      return null;
    },

    getDomain(nameOrPath) {
      const node = findNode(nameOrPath);
      if (!node) return null;
      return node.domain || node.name;
    },

    getImpact(nameOrPath, depth = 5) {
      const node = findNode(nameOrPath) ||
        findNode(nodeId(NODE_TYPES.SERVICE, nameOrPath)) ||
        findNode(nodeId(NODE_TYPES.CONTEXT, nameOrPath)) ||
        findNode(nodeId(NODE_TYPES.FILE, nameOrPath));
      if (!node) return { direct: [], indirect: [], total: 0 };

      const direct = bfsReverse(node.id, [EDGE_TYPES.IMPORTS, EDGE_TYPES.USES_SERVICE, EDGE_TYPES.USES_CONTEXT], 1);
      const indirect = bfsReverse(node.id, [EDGE_TYPES.IMPORTS, EDGE_TYPES.USES_SERVICE, EDGE_TYPES.USES_CONTEXT, EDGE_TYPES.USES_CONTEXT], depth);
      const allFiles = indirect.filter(r => r.node.type === NODE_TYPES.FILE);

      return {
        source: node,
        direct: direct.map(r => r.node),
        indirect: allFiles.map(r => r.node),
        total: allFiles.length,
      };
    },

    getMigrationPlan(tableName) {
      const tableNode = findNode(nodeId(NODE_TYPES.SUPABASE_TABLE, tableName));
      if (!tableNode) return null;

      const migrations = getNeighbors(tableNode.id, EDGE_TYPES.DEFINED_IN, 'in')
        .filter(n => n.type === NODE_TYPES.MIGRATION);
      const writers = graph.tableWriters?.get(tableName);
      const readers = graph.tableReaders?.get(tableName);

      return {
        table: tableNode,
        migrations,
        writers: writers ? [...writers] : [],
        readers: readers ? [...readers] : [],
        services: writers ? [...writers].map(p => findNode(p)).filter(Boolean) : [],
      };
    },

    whoOwns(tableName) {
      return this.getOwner(tableName);
    },

    whoWrites(tableName) {
      const writers = graph.tableWriters?.get(tableName);
      return writers ? [...writers].map(p => findNode(p)).filter(Boolean) : [];
    },

    whoReads(tableName) {
      const readers = graph.tableReaders?.get(tableName);
      return readers ? [...readers].map(p => findNode(p)).filter(Boolean) : [];
    },

    whatUsesService(serviceName) {
      return this.getConsumers(serviceName);
    },

    whatBypasses(target) {
      const violations = [...nodes.values()].filter(n =>
        n.type === NODE_TYPES.VIOLATION &&
        (n.message?.toLowerCase().includes(target.toLowerCase()) ||
         n.table === target)
      );
      return violations.map(v => findNode(v.file)).filter(Boolean);
    },

    whatViolatesADR(adrId) {
      return [...nodes.values()].filter(n =>
        n.type === NODE_TYPES.VIOLATION &&
        (n.message?.includes(adrId) || n.type.includes(adrId.replace('ADR-', '')))
      );
    },

    whatDependsOn(nameOrPath) {
      return this.getDependents(nameOrPath);
    },

    indirectDependents(nameOrPath, depth = 5) {
      const node = findNode(nameOrPath);
      if (!node) return [];
      return bfsReverse(node.id, [EDGE_TYPES.IMPORTS], depth).map(r => r.node);
    },

    findCircularDependencies() {
      const cycles = [];
      const fileNodes = [...nodes.values()].filter(n => n.type === NODE_TYPES.FILE);

      const adj = new Map();
      for (const edge of edges) {
        if (edge.type !== EDGE_TYPES.IMPORTS) continue;
        if (!adj.has(edge.source)) adj.set(edge.source, []);
        adj.get(edge.source).push(edge.target);
      }

      const visited = new Set();
      const stack = new Set();

      function dfs(nodeId, path) {
        if (stack.has(nodeId)) {
          const cycleStart = path.indexOf(nodeId);
          if (cycleStart >= 0) {
            cycles.push(path.slice(cycleStart).map(id => nodes.get(id)?.path || id));
          }
          return;
        }
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        stack.add(nodeId);
        for (const next of adj.get(nodeId) || []) {
          dfs(next, [...path, next]);
        }
        stack.delete(nodeId);
      }

      for (const fn of fileNodes) dfs(fn.id, [fn.id]);
      return cycles;
    },
  };
}
