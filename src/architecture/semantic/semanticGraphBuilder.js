// src/architecture/semantic/semanticGraphBuilder.js
// Orchestrates all semantic extractors and merges into the knowledge graph.

import { join } from 'path';
import { extractConstitution, linkConstitutionProtection } from './extractors/constitutionExtractor.js';
import {
  extractRegistry,
  extractActionsAndSemantics,
  extractRoutes,
} from './extractors/registryExtractor.js';
import { extractCapabilities } from './extractors/capabilityExtractor.js';
import { extractJourneys } from './extractors/journeyExtractor.js';
import { extractCodeSemantics, linkActionUsage } from './extractors/codeExtractor.js';
import { SEMANTIC_EDGE_TYPES } from '../graph/schema.js';

/**
 * @param {import('../graph/graphStore.js').GraphStore} store
 * @param {import('../scanner/fileScanner.js').FileScanResult[]} scanResults
 * @param {string} projectRoot
 */
export function buildSemanticGraph(store, scanResults, projectRoot) {
  const src = join(projectRoot, 'src');

  extractConstitution(join(projectRoot, 'HUI_CONSTITUTION.md'), store);
  extractRegistry(join(src, 'registry/HuiRegistry.js'), store);
  extractActionsAndSemantics(
    join(src, 'core/hui.actions.js'),
    join(src, 'core/hui.contracts.js'),
    join(src, 'core/hui.semantics.js'),
    store,
  );
  extractRoutes(join(src, 'routes/registry.js'), store);
  extractCapabilities(store, scanResults);
  extractJourneys(join(src, 'lib/journeyContext.js'), store);
  extractCodeSemantics(store, scanResults);
  linkActionUsage(store, scanResults);
  linkConstitutionProtection(store);
  linkCapabilitiesToConstitution(store);
  linkViolationsToRules(store);

  return store;
}

function linkCapabilitiesToConstitution(store) {
  const discoveryCap = store.getNode('capability:discovery');
  if (discoveryCap) {
    const rule6 = store.getNode('constitution-rule:6');
    if (rule6) {
      store.addEdge({
        type: SEMANTIC_EDGE_TYPES.PROTECTS,
        source: rule6.id,
        target: discoveryCap.id,
        confidence: 'inferred',
        sourceRef: 'Feed/Discovery → Regel 6',
      });
    }
  }

  const orbCap = store.getNode('capability:orb');
  const rule5 = store.getNode('constitution-rule:5');
  if (orbCap && rule5) {
    store.addEdge({
      type: SEMANTIC_EDGE_TYPES.PROTECTS,
      source: rule5.id,
      target: orbCap.id,
      confidence: 'inferred',
    });
  }

  const trustCap = store.getNode('capability:trust');
  const rule1 = store.getNode('constitution-rule:1');
  if (trustCap && rule1) {
    store.addEdge({
      type: SEMANTIC_EDGE_TYPES.PROTECTS,
      source: rule1.id,
      target: trustCap.id,
      confidence: 'inferred',
    });
  }
}

function linkViolationsToRules(store) {
  const violations = store.getNodesByType('Violation');
  const RULE_MAP = {
    CORE_BYPASS: 'architecture-principle:4',
    DB_DIRECT_WRITE: 'invariant:no-ui-impact-logic',
    DB_DIRECT_READ: 'invariant:no-ui-impact-logic',
    LAYER_VIOLATION: 'invariant:unidirectional-dataflow',
    REGISTRY_BYPASS: 'invariant:registry-single-meaning',
    DIRECT_ROUTING: 'decision:adr-001',
  };

  for (const v of violations) {
    const ruleId = RULE_MAP[v.meta?.type || v.label];
    if (ruleId && store.getNode(ruleId)) {
      store.addEdge({
        type: SEMANTIC_EDGE_TYPES.CONSTRAINS,
        source: ruleId,
        target: v.id,
        confidence: 'inferred',
        sourceRef: 'violation→rule mapping',
      });
    }
  }
}
