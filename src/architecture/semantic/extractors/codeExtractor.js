// src/architecture/semantic/extractors/codeExtractor.js
// Links scan results to semantic nodes — features, concerns, patterns.

import { readFileSync } from 'fs';
import { SEMANTIC_NODE_TYPES, SEMANTIC_EDGE_TYPES, TECHNICAL_EDGE_TYPES } from '../../graph/schema.js';
import { capId } from './capabilityExtractor.js';

/**
 * @param {import('../../graph/graphStore.js').GraphStore} store
 * @param {import('../../scanner/fileScanner.js').FileScanResult[]} scanResults
 */
export function extractCodeSemantics(store, scanResults) {
  for (const r of scanResults) {
    const fid = `file:${r.path}`;

    // Feature nodes from features/ and pages/
    if (r.path.startsWith('features/') || r.path.startsWith('pages/')) {
      const featureName = r.path.split('/').pop().replace(/\.[jt]sx?$/, '');
      const featId = `feature:${featureName.toLowerCase()}`;
      store.upsertNode({
        id: featId,
        type: SEMANTIC_NODE_TYPES.FEATURE,
        label: featureName,
        description: r.path,
        confidence: 'confirmed',
        source: 'module path',
        meta: { path: r.path },
      });
      store.addEdge({
        type: SEMANTIC_EDGE_TYPES.IMPLEMENTS,
        source: fid,
        target: featId,
        confidence: 'confirmed',
      });

      // Feature intent from header tags
      if (r.header?.responsibility) {
        store.upsertNode({
          id: `feature-intent:${featureName.toLowerCase()}`,
          type: SEMANTIC_NODE_TYPES.FEATURE_GOAL,
          label: `${featureName} Intent`,
          description: r.header.responsibility,
          confidence: 'confirmed',
          source: `@responsibility header`,
        });
        store.addEdge({
          type: SEMANTIC_EDGE_TYPES.EXPRESSES,
          source: featId,
          target: `feature-intent:${featureName.toLowerCase()}`,
          confidence: 'confirmed',
        });
      }
    }

    // JSDoc / file header purpose
    if (r.header?.responsibility && !r.path.startsWith('features/')) {
      store.addEdge({
        type: SEMANTIC_EDGE_TYPES.JUSTIFIED_BY,
        source: fid,
        target: 'mission:hui',
        confidence: 'inferred',
        sourceRef: r.header.responsibility,
      });
    }

    // Registry usage → governed by registry invariant
    if (r.registryUsage?.adopted) {
      store.addEdge({
        type: SEMANTIC_EDGE_TYPES.GOVERNS,
        source: 'invariant:registry-single-meaning',
        target: fid,
        confidence: 'confirmed',
      });
    }

    // Core engine usage → architecture pattern
    if (r.coreEngine?.adopted) {
      store.addEdge({
        type: SEMANTIC_EDGE_TYPES.IMPLEMENTS,
        source: fid,
        target: 'pattern:core-engine',
        confidence: 'confirmed',
      });
    }

    // Security concerns from security module usage
    if (/security/i.test(r.path) || /assertAuthenticated/i.test(JSON.stringify(r.imports))) {
      store.addEdge({
        type: SEMANTIC_EDGE_TYPES.PROTECTS,
        source: fid,
        target: 'concern:security',
        confidence: 'inferred',
      });
    }

    // Link action dispatches from file content patterns
    linkActionDispatches(store, r, fid);
  }

  // Architecture patterns
  store.upsertNode({
    id: 'pattern:core-engine',
    type: SEMANTIC_NODE_TYPES.ARCHITECTURE_PATTERN,
    label: 'Core Engine Pattern',
    description: 'Single Source of Truth für Wirkungsdaten',
    confidence: 'confirmed',
    source: 'HUI_CONSTITUTION.md §IV',
  });
  store.upsertNode({
    id: 'pattern:action-engine',
    type: SEMANTIC_NODE_TYPES.ARCHITECTURE_PATTERN,
    label: 'Action Engine Pattern',
    description: 'Zentralisierte User-Intent-Ausführung via useHuiActions',
    confidence: 'confirmed',
    source: 'hui.actions.js',
  });
  store.upsertNode({
    id: 'pattern:registry',
    type: SEMANTIC_NODE_TYPES.ARCHITECTURE_PATTERN,
    label: 'Registry Pattern',
    description: 'Single Source of Meaning für Texte und Semantik',
    confidence: 'confirmed',
    source: 'HuiRegistry.js',
  });

  // Concerns
  const CONCERNS = [
    ['security', SEMANTIC_NODE_TYPES.SECURITY_CONCERN, 'Authentifizierung, Autorisierung, Mutation Guards'],
    ['privacy', SEMANTIC_NODE_TYPES.PRIVACY_CONCERN, 'Datenschutz und persönliche Informationen'],
    ['accessibility', SEMANTIC_NODE_TYPES.ACCESSIBILITY_CONCERN, 'Barrierefreiheit und inklusive UX'],
    ['performance', SEMANTIC_NODE_TYPES.PERFORMANCE_CONCERN, 'Ladezeiten und Runtime-Performance'],
  ];
  for (const [key, type, desc] of CONCERNS) {
    store.upsertNode({
      id: `concern:${key}`,
      type,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      description: desc,
      confidence: 'confirmed',
      source: 'ARCH-002.1 concern registry',
    });
  }

  // Link constitution to specific files (bookingContext, HuiRegistry)
  const SPECIAL_FILES = {
    'lib/bookingContext.js': { cap: 'Booking', desc: 'Zentrales Booking-Intelligence-Layer' },
    'registry/HuiRegistry.js': { cap: 'Identity', desc: 'Single Source of Meaning — operationalisiert die Constitution' },
    'core/hui.semantics.js': { cap: 'Identity', desc: 'Action Semantics — versteht die Bedeutung von Nutzeraktionen' },
    'core/hui.actions.js': { cap: 'Navigation', desc: 'Action Engine — zentralisierte Intent-Ausführung' },
    'routes/registry.js': { cap: 'Navigation', desc: 'Route Authority (ADR-001) — vollständiges Route-Register' },
    'lib/journeyContext.js': { cap: 'Discovery', desc: 'Creator Journey Layer — verbindet Phase-3 Systeme' },
  };

  for (const [pathSuffix, info] of Object.entries(SPECIAL_FILES)) {
    const match = scanResults.find(r => r.path.endsWith(pathSuffix));
    if (!match) continue;
    const fid = `file:${match.path}`;
    store.upsertNode({
      id: `meaning:${pathSuffix.replace(/\//g, '-')}`,
      type: SEMANTIC_NODE_TYPES.INTENT,
      label: `Warum ${pathSuffix.split('/').pop()}?`,
      description: info.desc,
      confidence: 'confirmed',
      source: 'file header + architecture docs',
    });
    store.addEdge({
      type: SEMANTIC_EDGE_TYPES.JUSTIFIED_BY,
      source: fid,
      target: `meaning:${pathSuffix.replace(/\//g, '-')}`,
      confidence: 'confirmed',
    });
    store.addEdge({
      type: SEMANTIC_EDGE_TYPES.REALIZES,
      source: fid,
      target: capId(info.cap),
      confidence: 'confirmed',
      sourceRef: 'architecture documentation',
    });
  }

  return store;
}

function linkActionDispatches(store, scanResult, fid) {
  let content;
  try {
    content = readFileSync(scanResult.absolutePath, 'utf8');
  } catch {
    return;
  }
  const actionRe = /\bA\.(\w+)\b/g;
  let m;
  const seen = new Set();
  while ((m = actionRe.exec(content)) !== null) {
    const actionName = m[1];
    const aid = `action:${actionName}`;
    if (seen.has(aid) || !store.getNode(aid)) continue;
    seen.add(aid);
    store.addEdge({
      type: TECHNICAL_EDGE_TYPES.DISPATCHES,
      source: fid,
      target: aid,
      confidence: 'confirmed',
      sourceRef: 'A.ACTION pattern',
    });
  }
}

/**
 * @param {import('../../graph/graphStore.js').GraphStore} store
 * @param {import('../../scanner/fileScanner.js').FileScanResult[]} scanResults
 */
export function linkActionUsage(store, scanResults) {
  for (const r of scanResults) {
    linkActionDispatches(store, r, `file:${r.path}`);
  }
  return store;
}
