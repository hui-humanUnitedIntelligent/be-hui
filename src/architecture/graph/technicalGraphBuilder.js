// src/architecture/graph/technicalGraphBuilder.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Knowledge Graph — Technical Layer Builder (ARCH-002)
// Builds formal nodes/edges from ARCH-001 scan results.
// ══════════════════════════════════════════════════════════════════════════════

import { join, dirname, relative, resolve } from 'path';
import { existsSync } from 'fs';
import { getDomainForPath, DOMAINS } from '../scanner/domains.js';
import { TECHNICAL_NODE_TYPES, TECHNICAL_EDGE_TYPES } from './schema.js';
import { GraphStore } from './graphStore.js';

function fileNodeId(relativePath) {
  return `file:${relativePath}`;
}

function resolveImportPath(fromPath, importSource, srcRoot) {
  if (!importSource.startsWith('.')) return null;
  const fromDir = dirname(join(srcRoot, fromPath));
  let resolved = resolve(fromDir, importSource);
  for (const ext of ['', '.js', '.jsx', '.ts', '.tsx']) {
    const candidate = ext ? resolved + ext : resolved;
    if (existsSync(candidate)) {
      return relative(srcRoot, candidate).replace(/\\/g, '/');
    }
  }
  const indexCandidates = ['/index.js', '/index.jsx'];
  for (const idx of indexCandidates) {
    if (existsSync(resolved + idx)) {
      return relative(srcRoot, resolved + idx).replace(/\\/g, '/');
    }
  }
  return importSource.replace(/^\.\//, '');
}

/**
 * @param {import('../scanner/fileScanner.js').FileScanResult[]} results
 * @param {import('../scanner/violationDetector.js').Violation[]} violations
 * @param {string} srcRoot
 * @param {GraphStore} [store]
 */
export function buildTechnicalGraph(results, violations, srcRoot, store = new GraphStore()) {
  // Domain nodes
  for (const [id, domain] of Object.entries(DOMAINS)) {
    store.upsertNode({
      id: `domain:${id}`,
      type: TECHNICAL_NODE_TYPES.DOMAIN,
      label: domain.label,
      description: domain.description,
      confidence: 'confirmed',
      source: 'domains.js',
      meta: { layer: domain.layer, color: domain.color },
    });
  }

  // File, component, hook nodes
  const tableNodes = new Set();
  for (const r of results) {
    const fid = fileNodeId(r.path);
    const domain = getDomainForPath(r.path);
    store.upsertNode({
      id: fid,
      type: TECHNICAL_NODE_TYPES.FILE,
      label: r.path.split('/').pop(),
      description: r.path,
      confidence: 'confirmed',
      source: 'fileScanner',
      meta: {
        path: r.path,
        lines: r.lines,
        domain,
        header: r.header,
      },
    });
    store.addEdge({
      type: TECHNICAL_EDGE_TYPES.BELONGS_TO,
      source: fid,
      target: `domain:${domain}`,
      confidence: 'confirmed',
      sourceRef: 'path→domain',
    });

    for (const comp of r.components || []) {
      const name = typeof comp === 'string' ? comp : comp.name;
      const cid = `component:${r.path}#${name}`;
      store.upsertNode({
        id: cid,
        type: TECHNICAL_NODE_TYPES.COMPONENT,
        label: name,
        confidence: 'confirmed',
        source: 'fileScanner',
        meta: { file: r.path },
      });
      store.addEdge({
        type: TECHNICAL_EDGE_TYPES.CONTAINS,
        source: fid,
        target: cid,
        confidence: 'confirmed',
      });
    }

    for (const hook of r.hooks || []) {
      const name = typeof hook === 'string' ? hook : hook.name;
      const hid = `hook:${r.path}#${name}`;
      store.upsertNode({
        id: hid,
        type: TECHNICAL_NODE_TYPES.HOOK,
        label: name,
        confidence: 'confirmed',
        source: 'fileScanner',
        meta: { file: r.path },
      });
      store.addEdge({
        type: TECHNICAL_EDGE_TYPES.CONTAINS,
        source: fid,
        target: hid,
        confidence: 'confirmed',
      });
    }

    // DB tables
    for (const call of r.supabaseCalls || []) {
      const tid = `table:${call.table}`;
      if (!tableNodes.has(tid)) {
        tableNodes.add(tid);
        store.upsertNode({
          id: tid,
          type: TECHNICAL_NODE_TYPES.TABLE,
          label: call.table,
          confidence: 'confirmed',
          source: 'fileScanner',
        });
      }
      const edgeType = ['INSERT', 'UPDATE', 'DELETE', 'UPSERT'].includes(call.operation)
        ? TECHNICAL_EDGE_TYPES.WRITES
        : TECHNICAL_EDGE_TYPES.READS;
      store.addEdge({
        type: edgeType,
        source: fid,
        target: tid,
        confidence: 'confirmed',
        meta: { operation: call.operation, line: call.line },
      });
    }

    // Import edges
    for (const imp of r.imports || []) {
      if (imp.type !== 'relative') continue;
      const targetPath = resolveImportPath(r.path, imp.source, srcRoot);
      if (!targetPath) continue;
      const tid = fileNodeId(targetPath);
      if (!store.getNode(tid)) {
        store.upsertNode({
          id: tid,
          type: TECHNICAL_NODE_TYPES.FILE,
          label: targetPath.split('/').pop(),
          description: targetPath,
          confidence: 'inferred',
          source: 'import-resolution',
          meta: { path: targetPath },
        });
      }
      store.addEdge({
        type: TECHNICAL_EDGE_TYPES.IMPORTS,
        source: fid,
        target: tid,
        confidence: 'confirmed',
        meta: { line: imp.line },
      });
    }

  }

  // Violations
  for (const v of violations) {
    const vid = `violation:${v.type}:${v.file}:${v.line}`;
    store.upsertNode({
      id: vid,
      type: TECHNICAL_NODE_TYPES.VIOLATION,
      label: v.type,
      description: v.message,
      confidence: 'confirmed',
      source: 'violationDetector',
      meta: v,
    });
    const fid = fileNodeId(v.file);
    if (store.getNode(fid)) {
      store.addEdge({
        type: TECHNICAL_EDGE_TYPES.VIOLATES,
        source: fid,
        target: vid,
        confidence: 'confirmed',
      });
    }
  }

  return store;
}
