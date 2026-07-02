// src/architecture/semantic/simulationEngine.js
// Refactoring intelligence — semantic impact simulation.

import { SEMANTIC_NODE_TYPES, TECHNICAL_EDGE_TYPES } from '../graph/schema.js';

/**
 * @param {import('../graph/graphStore.js').GraphStore} store
 */
export function createSimulationEngine(store) {
  return {
    simulateRemoval(nodeIdOrPath) {
      return simulateChange(store, nodeIdOrPath, 'remove');
    },

    simulateMove(nodeIdOrPath, targetDomain) {
      const base = simulateChange(store, nodeIdOrPath, 'remove');
      return {
        ...base,
        moveTarget: targetDomain,
        layerViolations: predictLayerViolations(store, nodeIdOrPath, targetDomain),
      };
    },

    simulateRefactor(nodeIdOrPath, options = {}) {
      return simulateChange(store, nodeIdOrPath, options.type || 'modify');
    },
  };
}

function resolveFile(store, nodeIdOrPath) {
  const id = nodeIdOrPath.startsWith('file:') ? nodeIdOrPath : `file:${nodeIdOrPath}`;
  return store.getNode(id) || [...store.nodes.values()].find(n =>
    n.meta?.path === nodeIdOrPath || n.meta?.path?.endsWith(nodeIdOrPath),
  );
}

function simulateChange(store, nodeIdOrPath, changeType) {
  const node = resolveFile(store, nodeIdOrPath);
  if (!node) return { error: `Node not found: ${nodeIdOrPath}` };

  // Files that import this node
  const importers = store.getNeighbors(node.id, TECHNICAL_EDGE_TYPES.IMPORTS, 'in');
  const importChain = [];
  for (const imp of importers) {
    const secondary = store.getNeighbors(imp.node.id, TECHNICAL_EDGE_TYPES.IMPORTS, 'in');
    importChain.push({
      file: imp.node.meta?.path || imp.node.label,
      downstreamCount: secondary.length,
    });
  }

  // Capabilities at risk
  const capabilities = store.getNeighbors(node.id, ['REALIZES', 'IMPLEMENTS'], 'out')
    .map(c => ({ capability: c.node.label, confidence: c.edge.confidence }));

  // Human principles at risk
  const principles = store.getNodesByType(SEMANTIC_NODE_TYPES.HUMAN_PRINCIPLE)
    .filter(p => {
      const governed = store.getNeighbors(p.id, 'GOVERNS', 'out');
      return governed.some(g => g.node.id === node.id);
    });

  // Constitution rules affected
  const constitutionRules = store.getNodesByType(SEMANTIC_NODE_TYPES.CONSTITUTION_PRINCIPLE)
    .filter(r => {
      const protects = store.getNeighbors(r.id, 'PROTECTS', 'out');
      return protects.some(p =>
        capabilities.some(c => p.node.label === c.capability)
        || p.node.id === node.id,
      );
    });

  // Journeys that break
  const journeys = store.getNodesByType(SEMANTIC_NODE_TYPES.USER_JOURNEY);
  const brokenJourneys = [];
  for (const journey of journeys) {
    const steps = store.traverse([journey.id], { edgeTypes: ['ENABLES'], maxDepth: 15 });
    const stepIds = steps.map(s => s.node.id);
    const affected = store.getNeighbors(node.id, 'REQUIRES', 'in')
      .filter(r => stepIds.includes(r.node.id));
    if (affected.length > 0 || capabilities.length > 0) {
      const requires = steps
        .filter(s => s.node.type === SEMANTIC_NODE_TYPES.BUSINESS_PROCESS)
        .filter(s => {
          const reqs = store.getNeighbors(s.node.id, 'REQUIRES', 'out');
          return reqs.some(req => req.node.id === node.id
            || capabilities.some(c => req.node.label === c.capability));
        });
      if (requires.length > 0) {
        brokenJourneys.push({ journey: journey.label, affectedSteps: requires.map(r => r.node.label) });
      }
    }
  }

  // Features losing meaning
  const features = store.getNeighbors(node.id, 'IMPLEMENTS', 'out')
    .filter(f => f.node.type === SEMANTIC_NODE_TYPES.FEATURE);

  // Architecture goals weakened
  const goals = capabilities.flatMap(c => {
    const contribs = store.getNeighbors(
      store.getNode(`capability:${c.capability.toLowerCase().replace(/\s+/g, '-')}`)?.id || '',
      'CONTRIBUTES_TO',
      'out',
    );
    return contribs.map(g => g.node.label);
  });

  return {
    changeType,
    target: node.meta?.path || node.label,
    filesAffected: importers.length,
    affectedFiles: importChain,
    capabilitiesLost: capabilities,
    humanPrinciplesViolated: principles.map(p => p.label),
    constitutionRulesAffected: constitutionRules.map(r => r.label),
    journeysBroken: brokenJourneys,
    featuresLosingMeaning: features.map(f => f.node.label),
    architectureGoalsWeakened: [...new Set(goals)],
    confidence: 'inferred',
  };
}

function predictLayerViolations(store, nodeIdOrPath, targetDomain) {
  const node = resolveFile(store, nodeIdOrPath);
  if (!node) return [];
  const importers = store.getNeighbors(node.id, TECHNICAL_EDGE_TYPES.IMPORTS, 'in');
  return importers.map(imp => ({
    file: imp.node.meta?.path,
    warning: `Import chain may violate layer rules after move to ${targetDomain}`,
    confidence: 'inferred',
  }));
}
