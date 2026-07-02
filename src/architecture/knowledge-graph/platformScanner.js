// src/architecture/knowledge-graph/platformScanner.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Knowledge Graph — ARCH-002
// Scannt Plattform-Artefakte: SQL-Migrationen, Edge Functions, Routes, Contracts.
// ══════════════════════════════════════════════════════════════════════════════

import { readFileSync, existsSync } from 'fs';
import { join, relative, basename } from 'path';
import { nodeId, extractTablesFromSql, collectFilesByExtSync } from './utils.js';
import { NODE_TYPES } from './types.js';

/**
 * Scannt alle SQL-Dateien für Tabellen und Migrationen.
 */
export function scanMigrations(projectRoot) {
  const sqlDirs = [
    join(projectRoot, 'supabase', 'migrations'),
    join(projectRoot, 'supabase'),
    join(projectRoot, 'sql'),
  ];

  const migrations = [];
  const tables = new Map(); // tableName → { sources, migrationIds }

  for (const dir of sqlDirs) {
    if (!existsSync(dir)) continue;
    const files = collectFilesByExtSync(dir, ['.sql']);
    for (const file of files) {
      const rel = relative(projectRoot, file).replace(/\\/g, '/');
      const content = readFileSync(file, 'utf8');
      const tableNames = extractTablesFromSql(content);

      migrations.push({
        id: nodeId(NODE_TYPES.MIGRATION, rel),
        type: NODE_TYPES.MIGRATION,
        name: basename(file),
        path: rel,
        tables: tableNames,
      });

      for (const table of tableNames) {
        if (!tables.has(table)) {
          tables.set(table, { name: table, migrations: [], sqlPaths: [] });
        }
        const entry = tables.get(table);
        entry.migrations.push(rel);
        if (!entry.sqlPaths.includes(rel)) entry.sqlPaths.push(rel);
      }
    }
  }

  const tableNodes = [...tables.values()].map(t => ({
    id: nodeId(NODE_TYPES.SUPABASE_TABLE, t.name),
    type: NODE_TYPES.SUPABASE_TABLE,
    name: t.name,
    migrations: t.migrations,
    sqlPaths: t.sqlPaths,
  }));

  return { migrations, tables: tableNodes };
}

/**
 * Scannt Supabase Edge Functions.
 */
export function scanEdgeFunctions(projectRoot) {
  const fnDir = join(projectRoot, 'supabase', 'functions');
  if (!existsSync(fnDir)) return [];

  const functions = [];
  const entries = collectFilesByExtSync(fnDir, ['.ts', '.js']);
  const seen = new Set();

  for (const file of entries) {
    const rel = relative(projectRoot, file).replace(/\\/g, '/');
    const fnName = rel.split('/')[2]; // supabase/functions/<name>/...
    if (!fnName || seen.has(fnName)) continue;
    seen.add(fnName);

    const content = readFileSync(file, 'utf8');
    const tables = extractTablesFromSql(content);

    functions.push({
      id: nodeId(NODE_TYPES.EDGE_FUNCTION, fnName),
      type: NODE_TYPES.EDGE_FUNCTION,
      name: fnName,
      path: rel,
      tables,
    });
  }

  return functions;
}

/**
 * Parst Route Registry aus src/routes/registry.js.
 */
export function scanRoutes(projectRoot) {
  const registryPath = join(projectRoot, 'src/routes/registry.js');
  if (!existsSync(registryPath)) return [];

  const content = readFileSync(registryPath, 'utf8');
  const routes = [];

  const routeRe = /\{\s*path:\s*["'`]([^"'`]+)["'`][^}]*owner:\s*OWNER\.(\w+)[^}]*(?:authLevel:\s*AUTH\.(\w+))?/g;
  let m;
  while ((m = routeRe.exec(content)) !== null) {
    routes.push({
      id: nodeId(NODE_TYPES.ROUTE, m[1]),
      type: NODE_TYPES.ROUTE,
      name: m[1],
      path: m[1],
      owner: m[2],
      authLevel: m[3] || 'PUBLIC',
      definedIn: nodeId(NODE_TYPES.FILE, 'routes/registry.js'),
    });
  }

  // Fallback: path-only extraction
  if (routes.length === 0) {
    const pathRe = /path:\s*["'`]([^"'`]+)["'`]/g;
    while ((m = pathRe.exec(content)) !== null) {
      routes.push({
        id: nodeId(NODE_TYPES.ROUTE, m[1]),
        type: NODE_TYPES.ROUTE,
        name: m[1],
        path: m[1],
        owner: 'unknown',
        authLevel: 'PUBLIC',
        definedIn: nodeId(NODE_TYPES.FILE, 'routes/registry.js'),
      });
    }
  }

  return routes;
}

/**
 * Parst Action Contracts aus hui.contracts.js.
 */
export function scanContracts(projectRoot) {
  const contractsPath = join(projectRoot, 'src/core/hui.contracts.js');
  if (!existsSync(contractsPath)) return { contracts: [], actions: [] };

  const content = readFileSync(contractsPath, 'utf8');
  const contracts = [];
  const actions = [];

  const contractRe = /(\w+):\s*\{[^}]*description:\s*"([^"]+)"/g;
  let m;
  while ((m = contractRe.exec(content)) !== null) {
    if (['required', 'optional', 'requiredOr'].includes(m[1])) continue;
    const actionName = m[1];
    contracts.push({
      id: nodeId(NODE_TYPES.CONTRACT, actionName),
      type: NODE_TYPES.CONTRACT,
      name: actionName,
      description: m[2],
      definedIn: nodeId(NODE_TYPES.FILE, 'core/hui.contracts.js'),
    });
    actions.push({
      id: nodeId(NODE_TYPES.ACTION, actionName),
      type: NODE_TYPES.ACTION,
      name: actionName,
      description: m[2],
      definedIn: nodeId(NODE_TYPES.FILE, 'core/hui.actions.js'),
    });
  }

  // Actions aus hui.actions.js
  const actionsPath = join(projectRoot, 'src/core/hui.actions.js');
  if (existsSync(actionsPath)) {
    const actionsContent = readFileSync(actionsPath, 'utf8');
    const actionConstRe = /(\w+):\s*["']([A-Z_]+)["']/g;
    while ((m = actionConstRe.exec(actionsContent)) !== null) {
      if (!actions.find(a => a.name === m[2])) {
        actions.push({
          id: nodeId(NODE_TYPES.ACTION, m[2]),
          type: NODE_TYPES.ACTION,
          name: m[2],
          definedIn: nodeId(NODE_TYPES.FILE, 'core/hui.actions.js'),
        });
      }
    }
  }

  return { contracts, actions };
}

/**
 * Scannt Registry-Exporte aus HuiRegistry.js.
 */
export function scanRegistry(projectRoot) {
  const registryPath = join(projectRoot, 'src/registry/HuiRegistry.js');
  if (!existsSync(registryPath)) return null;

  const content = readFileSync(registryPath, 'utf8');
  const enums = [];
  const signals = [];

  const exportRe = /export\s+(?:const|let)\s+(\w+)\s*=/g;
  let m;
  while ((m = exportRe.exec(content)) !== null) {
    enums.push({
      id: nodeId(NODE_TYPES.ENUM, m[1]),
      type: NODE_TYPES.ENUM,
      name: m[1],
      definedIn: nodeId(NODE_TYPES.FILE, 'registry/HuiRegistry.js'),
    });
  }

  if (/PILLARS/.test(content)) {
    signals.push({
      id: nodeId(NODE_TYPES.SIGNAL, 'PILLARS'),
      type: NODE_TYPES.SIGNAL,
      name: 'PILLARS',
      definedIn: nodeId(NODE_TYPES.FILE, 'registry/HuiRegistry.js'),
    });
  }
  if (/PILLAR_TRAITS/.test(content)) {
    signals.push({
      id: nodeId(NODE_TYPES.SIGNAL, 'PILLAR_TRAITS'),
      type: NODE_TYPES.SIGNAL,
      name: 'PILLAR_TRAITS',
      definedIn: nodeId(NODE_TYPES.FILE, 'registry/HuiRegistry.js'),
    });
  }

  return {
    id: nodeId(NODE_TYPES.REGISTRY, 'HuiRegistry'),
    type: NODE_TYPES.REGISTRY,
    name: 'HuiRegistry',
    path: 'src/registry/HuiRegistry.js',
    enums,
    signals,
  };
}

/**
 * Findet TODO(ADR) Kommentare im Quellcode.
 */
export function scanTodoADRs(srcRoot, scanResults) {
  const todos = [];
  for (const result of scanResults) {
    const content = readFileSync(join(srcRoot, result.path), 'utf8');
    const re = /TODO\s*\(\s*ADR[-\s]?(\d+)\s*\)\s*:?\s*(.*)/gi;
    let m;
    while ((m = re.exec(content)) !== null) {
      todos.push({
        id: nodeId(NODE_TYPES.TODO_ADR, `${result.path}:${m.index}`),
        type: NODE_TYPES.TODO_ADR,
        name: `TODO(ADR-${m[1]})`,
        adrRef: `ADR-${m[1]}`,
        note: m[2].trim().slice(0, 200),
        file: result.path,
        definedIn: nodeId(NODE_TYPES.FILE, result.path),
      });
    }
  }
  return todos;
}

/**
 * Erkennt Core Engines aus src/core/.
 */
export function scanEngines(projectRoot) {
  const coreDir = join(projectRoot, 'src/core');
  if (!existsSync(coreDir)) return [];

  const engineFiles = collectFilesByExtSync(coreDir, ['.js', '.jsx']);
  const engines = [];

  const engineMap = {
    'coreEngine.js': 'Core Engine',
    'resonanceEngine.js': 'Resonance Engine',
    'orbEngine.js': 'Orb Engine',
    'hui.actions.js': 'Action Engine',
    'hui.flow.js': 'Flow Engine',
    'HuiConnectionEngine.jsx': 'Connection Engine',
    'hui.contracts.js': 'Contract Layer',
  };

  for (const file of engineFiles) {
    const name = basename(file);
    const rel = relative(projectRoot, file).replace(/\\/g, '/').replace(/^src\//, '');
    engines.push({
      id: nodeId(NODE_TYPES.ENGINE, name),
      type: NODE_TYPES.ENGINE,
      name: engineMap[name] || baseName(name),
      file: rel,
      definedIn: nodeId(NODE_TYPES.FILE, rel),
    });
  }

  // Feed Engine
  const feedEngine = join(projectRoot, 'src/feed/feedRhythmEngine.js');
  if (existsSync(feedEngine)) {
    engines.push({
      id: nodeId(NODE_TYPES.ENGINE, 'feedRhythmEngine'),
      type: NODE_TYPES.ENGINE,
      name: 'Feed Rhythm Engine',
      file: 'feed/feedRhythmEngine.js',
      definedIn: nodeId(NODE_TYPES.FILE, 'feed/feedRhythmEngine.js'),
    });
  }

  return engines;
}

function baseName(filePath) {
  return basename(filePath).replace(/\.(js|jsx)$/, '');
}
