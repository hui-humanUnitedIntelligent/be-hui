// src/architecture/knowledge-graph/jsonExporter.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Knowledge Graph — ARCH-002
// Exportiert den vollständigen Graphen als JSON-Artefakte.
// ══════════════════════════════════════════════════════════════════════════════

import { NODE_TYPES, EDGE_TYPES } from './types.js';

function serializeNode(node) {
  const { id, type, name, ...rest } = node;
  return { id, type, name, ...rest };
}

export function exportAllJson(graph, queryEngine) {
  const nodes = [...graph.nodes.values()].map(serializeNode);
  const edges = graph.edges.map(({ id, type, source, target, ...rest }) => ({
    id, type, source, target, ...rest,
  }));

  const ownership = buildOwnershipJson(graph);
  const dependencies = buildDependenciesJson(graph);
  const services = buildServicesJson(graph);
  const contexts = buildContextsJson(graph);
  const tables = buildTablesJson(graph);
  const violations = (graph.violations || []).map(v => ({ ...v }));
  const impact = buildImpactJson(graph, queryEngine);
  const migration = buildMigrationJson(graph);

  return {
    'graph.json': {
      version: graph.version,
      generatedAt: graph.generatedAt,
      stats: graph.stats,
      nodeTypes: Object.values(NODE_TYPES),
      edgeTypes: Object.values(EDGE_TYPES),
      nodes,
      edges,
    },
    'nodes.json': nodes,
    'edges.json': edges,
    'ownership.json': ownership,
    'dependencies.json': dependencies,
    'services.json': services,
    'contexts.json': contexts,
    'tables.json': tables,
    'violations.json': violations,
    'impact.json': impact,
    'migration.json': migration,
  };
}

function buildOwnershipJson(graph) {
  const ownership = { tables: {}, files: {}, routes: {} };

  for (const e of graph.edges) {
    if (e.type !== 'OWNS') continue;
    const owner = graph.nodes.get(e.source);
    const target = graph.nodes.get(e.target);
    if (!owner || !target) continue;

    if (target.type === NODE_TYPES.SUPABASE_TABLE) {
      if (!ownership.tables[target.name]) ownership.tables[target.name] = [];
      ownership.tables[target.name].push({ owner: owner.name, via: e.via });
    } else if (target.type === NODE_TYPES.FILE) {
      ownership.files[target.path] = owner.name;
    } else if (target.type === NODE_TYPES.ROUTE) {
      ownership.routes[target.path] = owner.name;
    }
  }

  for (const [table, writers] of graph.tableWriters || []) {
    if (!ownership.tables[table]) {
      ownership.tables[table] = [...writers].map(w => ({ owner: w, via: 'write-access' }));
    }
  }

  return ownership;
}

function buildDependenciesJson(graph) {
  const deps = {};
  for (const [path, importers] of graph.importGraph || []) {
    deps[path] = {
      importedBy: [...importers],
      count: importers.size,
    };
  }
  return deps;
}

function buildServicesJson(graph) {
  const services = {};
  for (const node of graph.nodes.values()) {
    if (node.type !== NODE_TYPES.SERVICE) continue;
    const consumers = graph.edges
      .filter(e => e.target === node.id && e.type === 'USES_SERVICE')
      .map(e => graph.nodes.get(e.source)?.path)
      .filter(Boolean);
    const tableAccess = graph.edges
      .filter(e => e.source === node.id && (e.type === 'READS' || e.type === 'WRITES'))
      .map(e => ({
        table: graph.nodes.get(e.target)?.name,
        operation: e.type,
      }));
    services[node.name] = { file: node.file, consumers, tableAccess };
  }
  return services;
}

function buildContextsJson(graph) {
  const contexts = {};
  for (const node of graph.nodes.values()) {
    if (node.type !== NODE_TYPES.CONTEXT) continue;
    const consumers = graph.edges
      .filter(e => e.target === node.id && e.type === 'USES_CONTEXT')
      .map(e => graph.nodes.get(e.source)?.path)
      .filter(Boolean);
    contexts[node.name] = { file: node.file, consumers, consumerCount: consumers.length };
  }
  return contexts;
}

function buildTablesJson(graph) {
  const tables = {};
  for (const node of graph.nodes.values()) {
    if (node.type !== NODE_TYPES.SUPABASE_TABLE) continue;
    tables[node.name] = {
      migrations: node.migrations || [],
      writers: graph.tableWriters?.get(node.name) ? [...graph.tableWriters.get(node.name)] : [],
      readers: graph.tableReaders?.get(node.name) ? [...graph.tableReaders.get(node.name)] : [],
      inferred: node.inferred || false,
    };
  }
  return tables;
}

function buildImpactJson(graph, queryEngine) {
  const impact = {};
  const keyTargets = [
    ...[...graph.nodes.values()]
      .filter(n => [NODE_TYPES.SERVICE, NODE_TYPES.CONTEXT].includes(n.type))
      .slice(0, 30),
  ];

  for (const target of keyTargets) {
    const result = queryEngine.getImpact(target.name, 3);
    impact[target.name] = {
      direct: result.direct.map(n => n.path || n.name),
      indirect: result.indirect.map(n => n.path || n.name),
      total: result.total,
    };
  }
  return impact;
}

function buildMigrationJson(graph) {
  const migration = { tables: {}, migrations: [] };

  for (const node of graph.nodes.values()) {
    if (node.type === NODE_TYPES.MIGRATION) {
      migration.migrations.push({ name: node.name, path: node.path, tables: node.tables });
    }
  }

  for (const node of graph.nodes.values()) {
    if (node.type !== NODE_TYPES.SUPABASE_TABLE) continue;
    migration.tables[node.name] = {
      migrations: node.migrations || node.sqlPaths || [],
      writers: graph.tableWriters?.get(node.name) ? [...graph.tableWriters.get(node.name)] : [],
    };
  }

  return migration;
}
