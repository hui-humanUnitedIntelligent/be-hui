// src/architecture/knowledge-graph/mermaidGenerator.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Knowledge Graph — ARCH-002
// Generiert alle Mermaid-Diagramme aus dem Knowledge Graph.
// ══════════════════════════════════════════════════════════════════════════════

import { DOMAINS } from '../scanner/domains.js';
import { mermaidId } from './utils.js';
import { NODE_TYPES, EDGE_TYPES } from './types.js';

const HEADER = '%% HUI Architecture Knowledge Graph — ARCH-002\n';

export function generateAllMermaidGraphs(graph) {
  return {
    dependency:  generateDependencyGraph(graph),
    layer:       generateLayerGraph(graph),
    ownership:   generateOwnershipGraph(graph),
    context:     generateContextGraph(graph),
    service:     generateServiceGraph(graph),
    action:      generateActionGraph(graph),
    core:        generateCoreGraph(graph),
    registry:    generateRegistryGraph(graph),
    violation:   generateViolationGraph(graph),
    migration:   generateMigrationGraph(graph),
    domain:      generateDomainGraph(graph),
    feature:     generateFeatureGraph(graph),
  };
}

export function generateDependencyGraph(graph) {
  const lines = ['```mermaid', 'graph TD', HEADER];
  const importEdges = graph.edges.filter(e => e.type === EDGE_TYPES.IMPORTS);
  const fileImportCount = new Map();

  for (const e of importEdges) {
    fileImportCount.set(e.target, (fileImportCount.get(e.target) || 0) + 1);
  }

  const topTargets = [...fileImportCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40);

  const nodeSet = new Set(topTargets.map(([k]) => k));
  for (const e of importEdges) {
    if (nodeSet.has(e.source)) nodeSet.add(e.target);
    if (nodeSet.has(e.target)) nodeSet.add(e.source);
  }

  for (const [id] of topTargets) {
    const node = graph.nodes.get(id);
    const label = node?.name?.split('/').pop() || id.split('::').pop();
    lines.push(`  ${mermaidId(id)}["${label}"]`);
  }

  let edgeCount = 0;
  for (const e of importEdges) {
    if (nodeSet.has(e.source) && nodeSet.has(e.target) && edgeCount < 80) {
      lines.push(`  ${mermaidId(e.source)} --> ${mermaidId(e.target)}`);
      edgeCount++;
    }
  }

  lines.push('```');
  return lines.join('\n');
}

export function generateLayerGraph(graph) {
  const lines = ['```mermaid', 'graph TB', HEADER];
  const layers = [...graph.nodes.values()]
    .filter(n => n.type === NODE_TYPES.LAYER)
    .sort((a, b) => a.level - b.level);

  for (const layer of layers) {
    const domains = [...graph.nodes.values()]
      .filter(n => n.type === NODE_TYPES.DOMAIN)
      .filter(d => {
        const layerNode = graph.edges.find(e =>
          e.type === EDGE_TYPES.BELONGS_TO && e.source === d.id
        );
        return layerNode?.target === layer.id;
      });

    if (domains.length === 0) continue;
    lines.push(`  subgraph ${mermaidId(layer.name)}["${layer.name}"]`);
    for (const d of domains) {
      const count = [...graph.nodes.values()].filter(n => n.domain === d.name).length;
      lines.push(`    ${d.name}["${d.label || d.name}<br/>${count} files"]`);
    }
    lines.push('  end');
  }

  for (const [domainId, domain] of Object.entries(DOMAINS)) {
    for (const dep of domain.allowedDependencies) {
      lines.push(`  ${domainId} --> ${dep}`);
    }
  }

  lines.push('```');
  return lines.join('\n');
}

export function generateOwnershipGraph(graph) {
  const lines = ['```mermaid', 'graph LR', HEADER];
  const owners = [...graph.nodes.values()].filter(n => n.type === NODE_TYPES.STATE_OWNER);

  for (const owner of owners.slice(0, 20)) {
    const owned = graph.edges.filter(e => e.type === EDGE_TYPES.OWNS && e.source === owner.id);
    if (owned.length === 0) continue;
    lines.push(`  ${mermaidId(owner.id)}["${owner.name}"]`);
    for (const e of owned.slice(0, 5)) {
      const target = graph.nodes.get(e.target);
      const label = target?.name?.split('/').pop() || target?.name || '';
      lines.push(`  ${mermaidId(owner.id)} --> ${mermaidId(e.target)}["${label}"]`);
    }
  }

  lines.push('```');
  return lines.join('\n');
}

export function generateContextGraph(graph) {
  const lines = ['```mermaid', 'graph LR', HEADER];
  const contexts = [...graph.nodes.values()].filter(n => n.type === NODE_TYPES.CONTEXT);

  for (const ctx of contexts.slice(0, 15)) {
    lines.push(`  ${mermaidId(ctx.id)}["${ctx.name}"]`);
    const consumers = graph.edges.filter(e =>
      e.type === EDGE_TYPES.USES_CONTEXT && e.target === ctx.id
    );
    for (const e of consumers.slice(0, 5)) {
      const file = graph.nodes.get(e.source);
      lines.push(`  ${mermaidId(e.source)}["${file?.name?.split('/').pop() || ''}"] --> ${mermaidId(ctx.id)}`);
    }
  }

  lines.push('```');
  return lines.join('\n');
}

export function generateServiceGraph(graph) {
  const lines = ['```mermaid', 'graph LR', HEADER];
  const tables = new Set();
  const serviceEdges = graph.edges.filter(e =>
    [EDGE_TYPES.READS, EDGE_TYPES.WRITES, EDGE_TYPES.USES_SERVICE].includes(e.type)
  );

  for (const e of serviceEdges) {
    const target = graph.nodes.get(e.target);
    if (target?.type === NODE_TYPES.SUPABASE_TABLE) tables.add(target.name);
  }

  for (const table of [...tables].slice(0, 20)) {
    lines.push(`  ${mermaidId('t_' + table)}[("${table}")]`);
  }
  lines.push('');

  const services = [...graph.nodes.values()].filter(n => n.type === NODE_TYPES.SERVICE).slice(0, 15);
  for (const svc of services) {
    lines.push(`  ${mermaidId(svc.id)}["${svc.name}"]`);
    const access = graph.edges.filter(e =>
      e.source === svc.id && (e.type === EDGE_TYPES.READS || e.type === EDGE_TYPES.WRITES)
    );
    for (const e of access) {
      const table = graph.nodes.get(e.target);
      const arrow = e.type === EDGE_TYPES.WRITES ? '-->' : '-.->';
      lines.push(`  ${mermaidId(svc.id)} ${arrow}|${e.type === EDGE_TYPES.WRITES ? 'W' : 'R'}| ${mermaidId('t_' + table?.name)}`);
    }
  }

  lines.push('```');
  return lines.join('\n');
}

export function generateActionGraph(graph) {
  const lines = ['```mermaid', 'graph TD', HEADER];
  const actions = [...graph.nodes.values()].filter(n => n.type === NODE_TYPES.ACTION).slice(0, 20);

  lines.push(`  ActionEngine["Action Engine"]`);
  for (const action of actions) {
    lines.push(`  ${mermaidId(action.id)}["${action.name}"]`);
    lines.push(`  ActionEngine --> ${mermaidId(action.id)}`);
    const users = graph.edges.filter(e => e.target === action.id && e.type === EDGE_TYPES.USES_ACTION);
    for (const e of users.slice(0, 3)) {
      const file = graph.nodes.get(e.source);
      lines.push(`  ${mermaidId(e.source)}["${file?.name?.split('/').pop() || ''}"] --> ${mermaidId(action.id)}`);
    }
  }

  lines.push('```');
  return lines.join('\n');
}

export function generateCoreGraph(graph) {
  const lines = ['```mermaid', 'graph TD', HEADER];
  const engines = [...graph.nodes.values()].filter(n => n.type === NODE_TYPES.ENGINE);

  for (const eng of engines) {
    lines.push(`  ${mermaidId(eng.id)}["${eng.name}"]`);
    const users = graph.edges.filter(e =>
      e.target === eng.id && (e.type === EDGE_TYPES.USES_CORE || e.type === EDGE_TYPES.USES_ENGINE)
    );
    for (const e of users.slice(0, 4)) {
      const file = graph.nodes.get(e.source);
      lines.push(`  ${mermaidId(e.source)}["${file?.name?.split('/').pop() || ''}"] --> ${mermaidId(eng.id)}`);
    }
  }

  lines.push('```');
  return lines.join('\n');
}

export function generateRegistryGraph(graph) {
  const lines = ['```mermaid', 'graph TD', HEADER];
  const registry = [...graph.nodes.values()].find(n => n.type === NODE_TYPES.REGISTRY);
  if (!registry) return lines.join('\n') + '\n```';

  lines.push(`  Registry["HuiRegistry"]`);
  const consumers = graph.edges.filter(e => e.type === EDGE_TYPES.USES_REGISTRY);
  const domainCounts = new Map();

  for (const e of consumers) {
    const file = graph.nodes.get(e.source);
    if (file?.domain) domainCounts.set(file.domain, (domainCounts.get(file.domain) || 0) + 1);
  }

  for (const [domain, count] of [...domainCounts.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`  ${domain}["${domain}<br/>${count} files"] --> Registry`);
  }

  lines.push('```');
  return lines.join('\n');
}

export function generateViolationGraph(graph) {
  const lines = ['```mermaid', 'graph TD', HEADER];
  const byType = new Map();

  for (const v of graph.violations || []) {
    byType.set(v.type, (byType.get(v.type) || 0) + 1);
  }

  lines.push(`  Violations["${graph.violations?.length || 0} Violations"]`);
  for (const [type, count] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
    const id = mermaidId(type);
    lines.push(`  ${id}["${type}<br/>${count}"]`);
    lines.push(`  Violations --> ${id}`);
  }

  lines.push('```');
  return lines.join('\n');
}

export function generateMigrationGraph(graph) {
  const lines = ['```mermaid', 'graph LR', HEADER];
  const migrations = [...graph.nodes.values()].filter(n => n.type === NODE_TYPES.MIGRATION).slice(0, 15);

  for (const mig of migrations) {
    lines.push(`  ${mermaidId(mig.id)}["${mig.name}"]`);
    for (const t of (mig.tables || []).slice(0, 5)) {
      lines.push(`  ${mermaidId(mig.id)} --> ${mermaidId('t_' + t)}["${t}"]`);
    }
  }

  lines.push('```');
  return lines.join('\n');
}

export function generateDomainGraph(graph) {
  const lines = ['```mermaid', 'graph LR', HEADER];
  const crossEdges = new Set();

  for (const e of graph.edges) {
    if (e.type !== EDGE_TYPES.IMPORTS) continue;
    const src = graph.nodes.get(e.source);
    const tgt = graph.nodes.get(e.target);
    if (!src?.domain || !tgt?.domain || src.domain === tgt.domain) continue;
    crossEdges.add(`${src.domain}->${tgt.domain}`);
  }

  for (const [domainId, domain] of Object.entries(DOMAINS)) {
    const count = [...graph.nodes.values()].filter(n => n.domain === domainId).length;
    if (count > 0) lines.push(`  ${domainId}["${domain.label}<br/>${count}"]`);
  }

  for (const edge of crossEdges) {
    const [src, tgt] = edge.split('->');
    const isViolation = (graph.violations || []).some(v =>
      v.type === 'LAYER_VIOLATION' && v.domain === src && v.targetDomain === tgt
    );
    lines.push(`  ${src} ${isViolation ? '--x' : '-->'} ${tgt}`);
  }

  lines.push('```');
  return lines.join('\n');
}

export function generateFeatureGraph(graph) {
  const lines = ['```mermaid', 'graph TD', HEADER];
  const features = [...graph.nodes.values()].filter(n => n.type === NODE_TYPES.FEATURE);

  for (const feat of features) {
    lines.push(`  ${mermaidId(feat.id)}["${feat.name}"]`);
    const deps = graph.edges.filter(e => e.source === feat.id && e.type === EDGE_TYPES.IMPORTS);
    for (const e of deps.slice(0, 5)) {
      const target = graph.nodes.get(e.target);
      lines.push(`  ${mermaidId(feat.id)} --> ${mermaidId(e.target)}["${target?.name?.split('/').pop() || ''}"]`);
    }
  }

  lines.push('```');
  return lines.join('\n');
}

export function generateMermaidReport(graphs) {
  const sections = [
    ['Dependency Graph', graphs.dependency],
    ['Layer Graph', graphs.layer],
    ['Ownership Graph', graphs.ownership],
    ['Context Graph', graphs.context],
    ['Service Graph', graphs.service],
    ['Action Graph', graphs.action],
    ['Core Graph', graphs.core],
    ['Registry Graph', graphs.registry],
    ['Violation Graph', graphs.violation],
    ['Migration Graph', graphs.migration],
    ['Domain Graph', graphs.domain],
    ['Feature Graph', graphs.feature],
  ];

  const lines = [
    '# HUI Architecture Knowledge Graph — Mermaid Diagrams',
    '',
    '> Automatisch generiert — ARCH-002',
    `> Generiert: ${new Date().toISOString()}`,
    '',
    '⚠️ Nicht manuell bearbeiten. Wird bei `npm run architecture:graph` überschrieben.',
    '',
  ];

  for (const [title, content] of sections) {
    lines.push(`## ${title}`, '', content, '');
  }

  return lines.join('\n');
}
