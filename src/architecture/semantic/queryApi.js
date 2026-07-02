// src/architecture/semantic/queryApi.js
// Semantic query API for the architecture knowledge graph.

import { SEMANTIC_NODE_TYPES, TECHNICAL_NODE_TYPES } from '../graph/schema.js';

/**
 * @param {import('../graph/graphStore.js').GraphStore} store
 */
export function createQueryApi(store) {
  return {
    getCapabilities: () => store.getNodesByType(SEMANTIC_NODE_TYPES.CAPABILITY),
    getBusinessProcesses: () => store.getNodesByType(SEMANTIC_NODE_TYPES.BUSINESS_PROCESS),
    getJourneys: () => store.getNodesByType(SEMANTIC_NODE_TYPES.USER_JOURNEY),
    getHumanPrinciples: () => store.getNodesByType(SEMANTIC_NODE_TYPES.HUMAN_PRINCIPLE),
    getArchitecturePrinciples: () => store.getNodesByType(SEMANTIC_NODE_TYPES.ARCHITECTURE_PRINCIPLE),
    getPlatformGoals: () => store.getNodesByType(SEMANTIC_NODE_TYPES.PLATFORM_GOAL),
    getQualityAttributes: () => store.getNodesByType(SEMANTIC_NODE_TYPES.QUALITY_ATTRIBUTE),
    getConstitutionPrinciples: () => store.getNodesByType(SEMANTIC_NODE_TYPES.CONSTITUTION_PRINCIPLE),
    getIntents: () => store.getNodesByType(SEMANTIC_NODE_TYPES.INTENT),
    getFeatures: () => store.getNodesByType(SEMANTIC_NODE_TYPES.FEATURE),

    getFeatureIntent: (featureName) => {
      const id = `feature-intent:${featureName.toLowerCase()}`;
      return store.getNode(id) || null;
    },

    getMeaning: (nodeId) => {
      const node = resolveNode(store, nodeId);
      if (!node) return null;
      const justified = store.getNeighbors(node.id, 'JUSTIFIED_BY', 'out');
      const realizes = store.getNeighbors(node.id, 'REALIZES', 'out');
      const protects = store.getNeighbors(node.id, 'PROTECTS', 'in');
      return {
        node,
        justification: justified.map(n => n.node),
        capabilities: realizes.map(n => n.node),
        protectedBy: protects.map(n => n.node),
      };
    },

    getWhy: (nodeId) => {
      const node = resolveNode(store, nodeId);
      if (!node) return { answer: null, confidence: null };
      const chain = store.traverse([node.id], {
        edgeTypes: ['JUSTIFIED_BY', 'DERIVED_FROM', 'PROTECTS', 'GOVERNS'],
        direction: 'in',
        maxDepth: 5,
      });
      return {
        node,
        chain: chain.filter(c => c.depth > 0).map(c => c.node),
        answer: buildWhyAnswer(node, chain),
      };
    },

    explainNode: (nodeId) => explainNode(store, nodeId),
    explainFeature: (featureName) => explainFeature(store, featureName),
    whyDoesThisExist: (nameOrPath) => whyDoesThisExist(store, nameOrPath),
    whatProtects: (targetName) => whatProtects(store, targetName),
    whatWouldBreak: (nodeId) => whatWouldBreak(store, nodeId),

    /** Raw graph access */
    store,
  };
}

function resolveNode(store, nodeIdOrName) {
  if (store.getNode(nodeIdOrName)) return store.getNode(nodeIdOrName);

  // By file path
  const fileId = nodeIdOrName.startsWith('file:') ? nodeIdOrName : `file:${nodeIdOrName}`;
  if (store.getNode(fileId)) return store.getNode(fileId);

  // By basename
  for (const node of store.nodes.values()) {
    if (node.label === nodeIdOrName) return node;
    if (node.meta?.path?.endsWith(nodeIdOrName)) return node;
  }
  return null;
}

function buildWhyAnswer(node, chain) {
  const parts = [`**${node.label}** existiert`];
  if (node.description) parts.push(`weil: ${node.description}`);
  const upstream = chain.filter(c => c.depth > 0).map(c => c.node);
  if (upstream.length > 0) {
    parts.push(`Abgeleitet von: ${upstream.map(n => n.label).join(' → ')}`);
  }
  if (node.confidence === 'inferred') parts.push('*(inferred — unsichere Ableitung)*');
  return parts.join('. ');
}

function explainNode(store, nodeId) {
  const node = resolveNode(store, nodeId);
  if (!node) return { error: `Node not found: ${nodeId}` };

  const outgoing = store.getNeighbors(node.id, null, 'out');
  const incoming = store.getNeighbors(node.id, null, 'in');

  return {
    node,
    summary: `${node.type}: ${node.label}`,
    description: node.description,
    confidence: node.confidence,
    source: node.source,
    outgoing: outgoing.map(({ edge, node: n }) => ({ relation: edge.type, target: n.label, confidence: edge.confidence })),
    incoming: incoming.map(({ edge, node: n }) => ({ relation: edge.type, source: n.label, confidence: edge.confidence })),
  };
}

function explainFeature(store, featureName) {
  const featId = `feature:${featureName.toLowerCase()}`;
  const feature = store.getNode(featId);
  if (!feature) return { error: `Feature not found: ${featureName}` };

  const implementers = store.getNeighbors(featId, 'IMPLEMENTS', 'in');
  const intent = store.getNode(`feature-intent:${featureName.toLowerCase()}`);

  return {
    feature,
    intent,
    implementedBy: implementers.map(i => i.node),
    capabilities: implementers.flatMap(i =>
      store.getNeighbors(i.node.id, 'REALIZES', 'out').map(c => c.node),
    ),
  };
}

function whyDoesThisExist(store, nameOrPath) {
  const node = resolveNode(store, nameOrPath);
  if (!node) return { error: `Not found: ${nameOrPath}` };

  const meaning = store.getNeighbors(node.id, 'JUSTIFIED_BY', 'out');
  const meaningNodes = meaning.map(m => m.node);
  const capabilities = store.getNeighbors(node.id, 'REALIZES', 'out');
  const constitution = store.getNeighbors(node.id, 'GOVERNS', 'in');

  const existsBecause = meaningNodes.map(m => m.description).filter(Boolean).join('; ')
    || node.description
    || null;

  return {
    subject: node,
    existsBecause,
    realizesCapabilities: capabilities.map(c => c.node.label),
    governedBy: constitution.map(c => c.node.label),
    confidence: node.confidence,
  };
}

function whatProtects(store, targetName) {
  const target = resolveNode(store, targetName)
    || store.getNode(`capability:${targetName.toLowerCase().replace(/\s+/g, '-')}`)
    || store.getNode(`domain:${targetName.toUpperCase()}`);

  if (!target) return { error: `Target not found: ${targetName}` };

  const protectors = store.getNeighbors(target.id, 'PROTECTS', 'in');
  return {
    target,
    protectors: protectors.map(p => ({
      node: p.node,
      confidence: p.edge.confidence,
    })),
  };
}

function whatWouldBreak(store, nodeId) {
  const node = resolveNode(store, nodeId);
  if (!node) return { error: `Node not found: ${nodeId}` };

  const dependents = store.getNeighbors(node.id, 'IMPORTS', 'in');
  const capabilityLoss = store.getNeighbors(node.id, 'REALIZES', 'out');
  const journeyImpact = store.getNeighbors(node.id, 'REQUIRES', 'in');
  const violations = store.getNeighbors(node.id, 'VIOLATES', 'out');

  return {
    node,
    filesAffected: dependents.length,
    dependentFiles: dependents.slice(0, 20).map(d => d.node.label),
    capabilitiesAtRisk: capabilityLoss.map(c => c.node.label),
    journeysAtRisk: journeyImpact.map(j => j.node.label),
    newViolations: violations.map(v => v.node.label),
  };
}

export { resolveNode };
