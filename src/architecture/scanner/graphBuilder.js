// src/architecture/scanner/graphBuilder.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Graph Builder — ARCH-001
// Erstellt Mermaid-Diagramme für Dependency, Domain, Layer, Service, Ownership.
// ══════════════════════════════════════════════════════════════════════════════

import { getDomainForPath, DOMAINS, LAYER_ORDER } from './domains.js';
import { resolve, dirname } from 'path';

// ── Dependency Graph ──────────────────────────────────────────────────────────
export function buildDependencyGraph(results) {
  const lines = [
    '```mermaid',
    'graph TD',
    '  %% HUI Dependency Graph — ARCH-001',
    '  %% Zeigt Datei-zu-Datei Abhängigkeiten (Top 50 nach Verbindungen)',
    '',
  ];

  // Zähle wie oft jede Datei importiert wird
  const importCount = new Map();
  for (const r of results) {
    for (const imp of (r.imports || [])) {
      if (imp.type !== 'relative') continue;
      const key = imp.source.replace(/\.\//g, '').replace(/\//g, '_').replace(/\.[jt]sx?$/, '');
      importCount.set(key, (importCount.get(key) || 0) + 1);
    }
  }

  // Top 30 meistimportierten Dateien als Knoten
  const topFiles = [...importCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);

  const nodeSet = new Set(topFiles.map(([k]) => k));

  for (const [key, count] of topFiles) {
    const label = key.split('_').pop();
    const domain = getDomainFromKey(key);
    const color = getDomainColor(domain);
    lines.push(`  ${sanitizeId(key)}["${label}<br/>(${count}×)"]`);
  }

  lines.push('');

  // Verbindungen
  let edgeCount = 0;
  for (const r of results) {
    const sourceName = r.path.replace(/\//g, '_').replace(/\.[jt]sx?$/, '');
    if (!nodeSet.has(sourceName)) continue;
    for (const imp of (r.imports || []).slice(0, 5)) {
      if (imp.type !== 'relative') continue;
      const targetKey = resolveImportKey(r.path, imp.source);
      if (nodeSet.has(targetKey) && edgeCount < 60) {
        lines.push(`  ${sanitizeId(sourceName)} --> ${sanitizeId(targetKey)}`);
        edgeCount++;
      }
    }
  }

  lines.push('```');
  return lines.join('\n');
}

// ── Domain Graph ──────────────────────────────────────────────────────────────
export function buildDomainGraph(results, violations) {
  const lines = [
    '```mermaid',
    'graph LR',
    '  %% HUI Domain Graph — ARCH-001',
    '  %% Zeigt Domain-zu-Domain Abhängigkeiten',
    '',
  ];

  // Domain-Knoten
  const domainFileCount = {};
  for (const r of results) {
    const d = getDomainForPath('src/' + r.path);
    domainFileCount[d] = (domainFileCount[d] || 0) + 1;
  }

  for (const [domainId, domain] of Object.entries(DOMAINS)) {
    const count = domainFileCount[domainId] || 0;
    if (count === 0) continue;
    lines.push(`  ${domainId}["**${domain.label}**<br/>${count} Dateien"]`);
  }

  lines.push('');

  // Cross-Domain Kanten
  const edges = new Set();
  for (const r of results) {
    const sourceDomain = getDomainForPath('src/' + r.path);
    for (const imp of (r.imports || [])) {
      if (imp.type !== 'relative') continue;
      const targetPath = resolveToSrcPath(r.path, imp.source);
      const targetDomain = getDomainForPath(targetPath);
      if (targetDomain !== sourceDomain &&
          targetDomain !== 'UNKNOWN' &&
          sourceDomain !== 'UNKNOWN') {
        const edgeKey = `${sourceDomain}_${targetDomain}`;
        edges.add(edgeKey);
      }
    }
  }

  for (const edge of edges) {
    const [src, tgt] = edge.split('_');
    // Violation-Kanten rot markieren
    const isViolation = violations.some(v =>
      v.type === 'LAYER_VIOLATION' &&
      v.domain === src &&
      v.targetDomain === tgt
    );
    lines.push(`  ${src} ${isViolation ? '--x' : '-->'} ${tgt}`);
  }

  lines.push('```');
  return lines.join('\n');
}

// ── Layer Graph ───────────────────────────────────────────────────────────────
export function buildLayerGraph(results) {
  const lines = [
    '```mermaid',
    'graph TB',
    '  %% HUI Layer Graph — ARCH-001',
    '  %% Zeigt die erlaubte Schichten-Hierarchie',
    '',
    '  subgraph Layer0["Layer 0 — Foundation"]',
    '    REGISTRY["📋 Registry<br/>(HuiRegistry)"]',
    '    CORE["⚙️ Core Engines<br/>(coreEngine, orbEngine, resonanceEngine)"]',
    '  end',
    '',
    '  subgraph Layer1["Layer 1 — Routes"]',
    '    ROUTES["🗺️ Route Registry<br/>(Shadow Mode)"]',
    '  end',
    '',
    '  subgraph Layer2["Layer 2 — Services"]',
    '    SERVICES["🔧 Services<br/>(db.js, commerceEngine, lib/)"]',
    '    SYSTEM["🌊 System<br/>(feed, orb, flows)"]',
    '  end',
    '',
    '  subgraph Layer3["Layer 3 — Logic"]',
    '    HOOKS["🎣 Hooks"]',
    '    CONTEXT["🌐 Context Provider"]',
    '  end',
    '',
    '  subgraph Layer4["Layer 4 — Features"]',
    '    FEATURES["✨ Features"]',
    '  end',
    '',
    '  subgraph Layer5["Layer 5 — UI"]',
    '    PAGES["📄 Pages"]',
    '    COMPONENTS["🧩 Components"]',
    '  end',
    '',
    '  REGISTRY --> CORE',
    '  CORE --> ROUTES',
    '  CORE --> SERVICES',
    '  CORE --> SYSTEM',
    '  SERVICES --> HOOKS',
    '  SERVICES --> CONTEXT',
    '  SYSTEM --> HOOKS',
    '  HOOKS --> FEATURES',
    '  CONTEXT --> FEATURES',
    '  FEATURES --> PAGES',
    '  FEATURES --> COMPONENTS',
    '',
    '  style REGISTRY fill:#FFD700,color:#000',
    '  style CORE     fill:#16D7C5,color:#000',
    '  style SERVICES fill:#FF8A6B,color:#fff',
    '  style SYSTEM   fill:#8B5CF6,color:#fff',
    '  style HOOKS    fill:#F59E0B,color:#000',
    '  style CONTEXT  fill:#3B82F6,color:#fff',
    '  style FEATURES fill:#10B981,color:#fff',
    '  style PAGES    fill:#EC4899,color:#fff',
    '  style COMPONENTS fill:#6366F1,color:#fff',
    '```',
  ];
  return lines.join('\n');
}

// ── Service Graph ─────────────────────────────────────────────────────────────
export function buildServiceGraph(results) {
  const lines = [
    '```mermaid',
    'graph LR',
    '  %% HUI Service Graph — ARCH-001',
    '  %% Zeigt Tabellen-Zugriffsmuster pro Service',
    '',
  ];

  // Alle Dateien mit Supabase-Calls
  const serviceFiles = results.filter(r =>
    (r.supabaseCalls?.length || 0) > 0 &&
    (r.path.includes('src/services/') ||
     r.path.includes('src/lib/') ||
     r.path.includes('src/hooks/'))
  );

  const tableNodes = new Set();
  const serviceNodes = new Set();

  for (const r of serviceFiles.slice(0, 15)) {
    const name = r.name.replace(/\.[jt]sx?$/, '');
    serviceNodes.add(name);
    for (const call of (r.supabaseCalls || [])) {
      tableNodes.add(call.table);
    }
  }

  // Table-Knoten
  for (const table of tableNodes) {
    lines.push(`  ${sanitizeId('t_' + table)}[("${table}")]`);
  }
  lines.push('');

  // Service-Knoten und Verbindungen
  for (const r of serviceFiles.slice(0, 15)) {
    const name = r.name.replace(/\.[jt]sx?$/, '');
    lines.push(`  ${sanitizeId(name)}["${name}"]`);
    const tables = new Set(r.supabaseCalls.map(c => c.table));
    for (const table of tables) {
      const writes = r.supabaseCalls.filter(c => c.table === table && c.operation !== 'SELECT');
      const reads  = r.supabaseCalls.filter(c => c.table === table && c.operation === 'SELECT');
      if (writes.length) lines.push(`  ${sanitizeId(name)} -->|"W"| ${sanitizeId('t_' + table)}`);
      else if (reads.length) lines.push(`  ${sanitizeId(name)} -.->|"R"| ${sanitizeId('t_' + table)}`);
    }
  }

  lines.push('```');
  return lines.join('\n');
}

// ── Ownership Graph ───────────────────────────────────────────────────────────
export function buildOwnershipGraph(results) {
  const lines = [
    '```mermaid',
    'pie title Dateien mit Architektur-Header (@domain + @owner)',
    '',
  ];

  const minLines = 50;
  const relevant = results.filter(r => r.lines >= minLines && !r.path.startsWith('architecture/'));
  const withHeader = relevant.filter(r => r.header?.hasDomainTag && r.header?.hasOwnerTag).length;
  const withoutHeader = relevant.length - withHeader;

  lines.push(`  "Mit Header (${withHeader})" : ${withHeader}`);
  lines.push(`  "Ohne Header (${withoutHeader})" : ${withoutHeader}`);

  lines.push('```');
  return lines.join('\n');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function sanitizeId(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+/, '').slice(0, 40);
}

function getDomainFromKey(key) {
  const parts = key.split('_');
  if (parts.includes('core')) return 'CORE';
  if (parts.includes('services') || parts.includes('db')) return 'SERVICES';
  if (parts.includes('lib')) return 'SERVICES';
  if (parts.includes('components')) return 'COMPONENTS';
  if (parts.includes('pages')) return 'PAGES';
  if (parts.includes('hooks')) return 'HOOKS';
  return 'UNKNOWN';
}

function getDomainColor(domain) {
  return DOMAINS[domain]?.color ?? '#888';
}

function resolveImportKey(filePath, importSource) {
  const dir = dirname(filePath);
  const resolved = resolve(dir, importSource)
    .replace(/\\/g, '/')
    .replace(/^.*?src\//, '');
  return resolved.replace(/\//g, '_').replace(/\.[jt]sx?$/, '');
}

function resolveToSrcPath(filePath, importSource) {
  const dir = 'src/' + dirname(filePath);
  try {
    return resolve(dir, importSource)
      .replace(/\\/g, '/')
      .replace(/^.*?\/src\//, 'src/');
  } catch { return importSource; }
}
