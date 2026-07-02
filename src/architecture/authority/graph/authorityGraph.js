// src/architecture/authority/graph/authorityGraph.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Authority — Governance Graph (ARCH-004)
//
// Constitution → Rules → ADRs → RFCs → Policies → Domains → Capabilities → Code → Runtime
// ══════════════════════════════════════════════════════════════════════════════

import { buildAuthorityState } from '../registries/registryBuilder.js';

/**
 * Baut den Governance-Graph als Knoten und Kanten.
 */
export function buildAuthorityGraph() {
  const state = buildAuthorityState();
  const nodes = [];
  const edges = [];

  // Constitution (root)
  if (state.constitutionRegistry) {
    nodes.push({
      id: 'CONSTITUTION',
      type: 'constitution',
      label: `HUI Constitution v${state.constitutionRegistry.version}`,
      status: state.constitutionRegistry.status,
    });
  }

  // Rules
  for (const rule of state.ruleRegistry) {
    nodes.push({
      id: rule.id,
      type: 'rule',
      label: rule.title,
      status: rule.status,
      authority: rule.authority,
      derived: rule.derived,
    });
    edges.push({
      from: 'CONSTITUTION',
      to: rule.id,
      type: 'defines',
      label: rule.authority,
    });
  }

  // ADRs
  for (const adr of state.adrRegistry) {
    nodes.push({
      id: adr.id,
      type: 'adr',
      label: adr.title,
      status: adr.status,
    });
    edges.push({ from: 'CONSTITUTION', to: adr.id, type: 'governs', label: 'decision' });

    for (const vt of adr.violationTypes || []) {
      if (state.ruleRegistry.some(r => r.id === vt)) {
        edges.push({ from: adr.id, to: vt, type: 'enforces', label: 'violation' });
      }
    }
  }

  // RFCs
  for (const rfc of state.rfcRegistry) {
    nodes.push({
      id: rfc.id,
      type: 'rfc',
      label: rfc.title,
      status: rfc.status,
      ratified: rfc.ratified,
    });
    edges.push({ from: 'CONSTITUTION', to: rfc.id, type: 'specifies', label: 'rfc' });

    for (const domain of rfc.governedDomains || []) {
      if (domain !== '*' && state.domainRegistry[domain]) {
        edges.push({ from: rfc.id, to: domain, type: 'governs-domain', label: 'layer' });
      }
    }
  }

  // Policies
  for (const policy of state.policyRegistry) {
    nodes.push({
      id: policy.id,
      type: 'policy',
      label: policy.title,
      status: policy.status,
    });
    edges.push({ from: 'CONSTITUTION', to: policy.id, type: 'policy', label: 'operational' });
  }

  // Domains
  for (const [id, domain] of Object.entries(state.domainRegistry)) {
    nodes.push({
      id,
      type: 'domain',
      label: domain.label,
      layer: domain.layer,
    });
    edges.push({ from: 'RFC-000', to: id, type: 'layer-model', label: `layer ${domain.layer}` });
  }

  // Capabilities
  for (const cap of state.capabilityRegistry) {
    nodes.push({
      id: cap.id,
      type: 'capability',
      label: cap.name,
      owner: cap.owner,
    });
    edges.push({ from: 'POLICY-OWNERSHIP', to: cap.id, type: 'owns', label: cap.owner });
  }

  // Code layer (derived from metrics)
  nodes.push({
    id: 'CODE',
    type: 'code',
    label: 'HUI Source Code',
    files: state.metrics?.totalFiles || 0,
    derived: true,
  });
  for (const domain of Object.keys(state.domainRegistry)) {
    edges.push({ from: domain, to: 'CODE', type: 'contains', label: 'paths', derived: true });
  }

  // Runtime (terminal node — no modification)
  nodes.push({
    id: 'RUNTIME',
    type: 'runtime',
    label: 'HUI Runtime (read-only reference)',
    derived: true,
    inferred: true,
  });
  edges.push({ from: 'CODE', to: 'RUNTIME', type: 'deploys', label: 'build', derived: true });

  return Object.freeze({
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges),
    mermaid: generateMermaid(nodes, edges),
    hierarchy: Object.freeze([
      'CONSTITUTION', 'Rules', 'ADRs', 'RFCs', 'Policies',
      'Domains', 'Capabilities', 'Code', 'Runtime',
    ]),
  });
}

function generateMermaid(nodes, edges) {
  const lines = ['graph TD'];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  const styleMap = {
    constitution: 'CONSTITUTION',
    adr: 'ADR',
    rfc: 'RFC',
    rule: 'RULE',
    policy: 'POLICY',
    domain: 'DOMAIN',
    capability: 'CAP',
    code: 'CODE',
    runtime: 'RUNTIME',
  };

  for (const node of nodes) {
    const safeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
    const prefix = styleMap[node.type] || 'NODE';
    lines.push(`  ${prefix}_${safeId}["${node.label.replace(/"/g, "'")}"]`);
  }

  for (const edge of edges) {
    const fromSafe = edge.from.replace(/[^a-zA-Z0-9_]/g, '_');
    const toSafe = edge.to.replace(/[^a-zA-Z0-9_]/g, '_');
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    const fromPrefix = styleMap[fromNode?.type] || 'NODE';
    const toPrefix = styleMap[toNode?.type] || 'NODE';
    lines.push(`  ${fromPrefix}_${fromSafe} -->|${edge.type}| ${toPrefix}_${toSafe}`);
  }

  return lines.join('\n');
}
