// src/architecture/semantic/mermaidBuilder.js
// Mermaid diagram generation for semantic architecture graphs.

import { SEMANTIC_NODE_TYPES } from '../graph/schema.js';

function sanitizeId(id) {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

function buildGraph(title, nodes, edges, maxNodes = 40) {
  const lines = ['```mermaid', 'graph TD', `  %% ${title}`, ''];
  const nodeSet = new Set(nodes.slice(0, maxNodes).map(n => n.id));

  for (const node of nodes.slice(0, maxNodes)) {
    const label = (node.label || node.id).replace(/"/g, "'");
    const conf = node.confidence === 'inferred' ? ' ~' : '';
    lines.push(`  ${sanitizeId(node.id)}["${label}${conf}"]`);
  }

  lines.push('');
  let edgeCount = 0;
  for (const edge of edges) {
    if (!nodeSet.has(edge.source) || !nodeSet.has(edge.target)) continue;
    if (edgeCount >= maxNodes * 2) break;
    lines.push(`  ${sanitizeId(edge.source)} -->|${edge.type}| ${sanitizeId(edge.target)}`);
    edgeCount++;
  }

  lines.push('```');
  return lines.join('\n');
}

/**
 * @param {import('../graph/graphStore.js').GraphStore} store
 */
export function buildSemanticMermaidDiagrams(store) {
  const capNodes = store.getNodesByType(SEMANTIC_NODE_TYPES.CAPABILITY);
  const capEdges = store.edges.filter(e =>
    capNodes.some(n => n.id === e.source || n.id === e.target),
  );

  const journeyNodes = [
    ...store.getNodesByType(SEMANTIC_NODE_TYPES.USER_JOURNEY),
    ...store.getNodesByType(SEMANTIC_NODE_TYPES.BUSINESS_PROCESS),
  ];
  const journeyEdges = store.edges.filter(e =>
    journeyNodes.some(n => n.id === e.source || n.id === e.target),
  );

  const meaningNodes = store.getNodesByType(SEMANTIC_NODE_TYPES.INTENT);
  const meaningEdges = store.edges.filter(e =>
    ['JUSTIFIED_BY', 'REALIZES', 'EXPRESSES'].includes(e.type)
    && (meaningNodes.some(n => n.id === e.source || n.id === e.target)
      || e.source.startsWith('file:') || e.target.startsWith('meaning:')),
  );

  const constitutionNodes = [
    ...store.getNodesByType(SEMANTIC_NODE_TYPES.CONSTITUTION_PRINCIPLE),
    ...store.getNodesByType(SEMANTIC_NODE_TYPES.INVARIANT),
    ...store.getNodesByType(SEMANTIC_NODE_TYPES.MISSION),
  ];
  const constitutionEdges = store.edges.filter(e =>
    e.type === 'PROTECTS' || e.type === 'DERIVED_FROM',
  );

  const humanNodes = store.getNodesByType(SEMANTIC_NODE_TYPES.HUMAN_PRINCIPLE);
  const goalNodes = store.getNodesByType(SEMANTIC_NODE_TYPES.PLATFORM_GOAL);
  const featureGoalNodes = store.getNodesByType(SEMANTIC_NODE_TYPES.FEATURE_GOAL);
  const archPrincipleNodes = store.getNodesByType(SEMANTIC_NODE_TYPES.ARCHITECTURE_PRINCIPLE);
  const qualityNodes = store.getNodesByType(SEMANTIC_NODE_TYPES.QUALITY_ATTRIBUTE);

  const semanticDepNodes = [
    ...capNodes.slice(0, 15),
    ...store.getNodesByType('File').filter(f =>
      store.edges.some(e => e.source === f.id && e.type === 'REALIZES'),
    ).slice(0, 15),
  ];
  const semanticDepEdges = store.edges.filter(e =>
    ['REALIZES', 'IMPLEMENTS', 'ENABLES', 'DEPENDS_ON_MEANING'].includes(e.type),
  );

  return {
    capability: buildGraph('Capability Graph', capNodes, capEdges, 35),
    journey: buildGraph('Journey Graph', journeyNodes, journeyEdges, 30),
    meaning: buildGraph('Meaning Graph', meaningNodes, meaningEdges, 25),
    constitution: buildGraph('Constitution Graph', constitutionNodes, constitutionEdges, 25),
    humanPrinciple: buildGraph('Human Principle Graph', humanNodes, store.edges.filter(e =>
      humanNodes.some(n => n.id === e.source || n.id === e.target)), 20),
    platformGoal: buildGraph('Platform Goal Graph', goalNodes, store.edges.filter(e =>
      goalNodes.some(n => n.id === e.source || n.id === e.target)), 20),
    featureIntent: buildGraph('Feature Intent Graph', featureGoalNodes, store.edges.filter(e =>
      featureGoalNodes.some(n => n.id === e.source || n.id === e.target)), 20),
    architecturePrinciple: buildGraph('Architecture Principle Graph', archPrincipleNodes,
      store.edges.filter(e => archPrincipleNodes.some(n => n.id === e.source || n.id === e.target)), 20),
    qualityAttribute: buildGraph('Quality Attribute Graph', qualityNodes, store.edges.filter(e =>
      qualityNodes.some(n => n.id === e.source || n.id === e.target)), 15),
    semanticDependency: buildGraph('Semantic Dependency Graph', semanticDepNodes, semanticDepEdges, 30),
  };
}

export function generateSemanticGraphReport(diagrams) {
  const sections = [
    ['Capability Graph', diagrams.capability],
    ['Journey Graph', diagrams.journey],
    ['Meaning Graph', diagrams.meaning],
    ['Constitution Graph', diagrams.constitution],
    ['Human Principle Graph', diagrams.humanPrinciple],
    ['Platform Goal Graph', diagrams.platformGoal],
    ['Feature Intent Graph', diagrams.featureIntent],
    ['Architecture Principle Graph', diagrams.architecturePrinciple],
    ['Quality Attribute Graph', diagrams.qualityAttribute],
    ['Semantic Dependency Graph', diagrams.semanticDependency],
  ];

  const lines = [
    '# HUI Semantic Architecture Graphs — ARCH-002.1',
    '',
    '> Autogeneriert. `~` = inferred confidence.',
    '',
  ];

  for (const [title, diagram] of sections) {
    lines.push(`## ${title}`, '', diagram, '');
  }

  return lines.join('\n');
}
