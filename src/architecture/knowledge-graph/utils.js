// src/architecture/knowledge-graph/utils.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Knowledge Graph — ARCH-002
// Gemeinsame Hilfsfunktionen für Pfadauflösung und ID-Generierung.
// ══════════════════════════════════════════════════════════════════════════════

import { resolve, dirname, basename, extname } from 'path';

/**
 * Erzeugt eine stabile Knoten-ID aus Typ und Name.
 */
export function nodeId(type, name) {
  const safe = String(name).replace(/[^a-zA-Z0-9._/-]/g, '_').slice(0, 120);
  return `${type}::${safe}`;
}

/**
 * Erzeugt eine stabile Kanten-ID.
 */
export function edgeId(type, source, target, label = '') {
  const base = `${type}::${source}::${target}`;
  return label ? `${base}::${label}` : base;
}

/**
 * Löst einen relativen Import zu einem src/-relativen Pfad auf.
 */
export function resolveImportPath(filePath, importSource, srcRoot = 'src') {
  const normalized = filePath.replace(/\\/g, '/');
  const sourceDir = dirname(`${srcRoot}/${normalized}`);
  try {
    let resolved = resolve(sourceDir, importSource).replace(/\\/g, '/');
    resolved = resolved.replace(/^.*?\/src\//, '');
    if (!resolved.startsWith('src/')) resolved = resolved.replace(/^src\//, '');
    // Extension ergänzen falls fehlend
    if (!/\.(js|jsx|ts|tsx)$/.test(resolved)) {
      for (const ext of ['.js', '.jsx', '/index.js', '/index.jsx']) {
        const candidate = resolved + ext;
        if (candidate.includes('index.')) return candidate.replace(/^src\//, '');
      }
    }
    return resolved.replace(/^src\//, '');
  } catch {
    return importSource;
  }
}

/**
 * Dateiname ohne Extension.
 */
export function baseName(filePath) {
  return basename(filePath, extname(filePath));
}

/**
 * Sanitize für Mermaid-Knoten-IDs.
 */
export function mermaidId(str) {
  return String(str).replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+/, '').slice(0, 50);
}

import { readdirSync, statSync } from 'fs';

export function collectFilesByExtSync(dir, extensions, result = [], skip = ['node_modules', '.git', 'dist']) {
  let entries;
  try { entries = readdirSync(dir); } catch { return result; }
  for (const entry of entries) {
    if (skip.includes(entry)) continue;
    const full = resolve(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      collectFilesByExtSync(full, extensions, result, skip);
    } else if (extensions.some(ext => entry.endsWith(ext))) {
      result.push(full);
    }
  }
  return result;
}

/**
 * Extrahiert Tabellennamen aus SQL-Inhalt.
 */
export function extractTablesFromSql(content) {
  const tables = new Set();
  const re = /(?:CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?|ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?|FROM\s+(?:public\.)?|INTO\s+(?:public\.)?|JOIN\s+(?:public\.)?)([a-z_][a-z0-9_]*)/gi;
  let m;
  while ((m = re.exec(content)) !== null) {
    const name = m[1].toLowerCase();
    if (!['if', 'not', 'exists', 'public', 'select', 'where', 'and', 'or'].includes(name)) {
      tables.add(name);
    }
  }
  return [...tables];
}

/**
 * Erkennt Context-Nutzung aus Import-Quellen und Dateiinhalt.
 */
export function detectContextUsage(content, imports) {
  const contexts = new Set();
  const contextImportRe = /(?:Context|Provider)(?:\.jsx?)?['"]?$/i;
  for (const imp of imports) {
    if (contextImportRe.test(imp.source) || /Context/i.test(imp.source)) {
      contexts.add(baseName(imp.source));
    }
  }
  const useContextRe = /useContext\s*\(\s*(\w+)/g;
  let m;
  while ((m = useContextRe.exec(content)) !== null) contexts.add(m[1]);
  return [...contexts];
}

/**
 * Erkennt Service-Nutzung aus Imports.
 */
export function detectServiceUsage(imports) {
  const services = new Set();
  for (const imp of imports) {
    if (imp.source.includes('services/') || /Service/i.test(imp.source)) {
      services.add(baseName(imp.source));
    }
    if (imp.source.includes('lib/') && /(?:Context|Service|db)/i.test(imp.source)) {
      services.add(baseName(imp.source));
    }
  }
  return [...services];
}

/**
 * Erkennt Engine-Nutzung aus Dateiinhalt.
 */
export function detectEngineUsage(content) {
  const engines = [];
  const patterns = [
    { name: 'coreEngine', re: /coreEngine\./ },
    { name: 'resonanceEngine', re: /resonanceEngine\./ },
    { name: 'orbEngine', re: /orbEngine\./ },
    { name: 'useCoreEngine', re: /useCoreEngine\s*\(/ },
    { name: 'useOrbParams', re: /useOrbParams\s*\(/ },
    { name: 'feedRhythmEngine', re: /feedRhythmEngine/ },
    { name: 'HuiConnectionEngine', re: /HuiConnectionEngine/ },
    { name: 'intelligenceEngine', re: /intelligenceEngine|intelligence\// },
    { name: 'worldEngine', re: /world\/|WorldEngine/ },
  ];
  for (const { name, re } of patterns) {
    if (re.test(content)) engines.push(name);
  }
  return engines;
}

/**
 * Erkennt Action-Nutzung.
 */
export function detectActionUsage(content) {
  const actions = new Set();
  const re = /(?:dispatch\s*\(\s*|actions\.|A\.)([A-Z][A-Z0-9_]+)/g;
  let m;
  while ((m = re.exec(content)) !== null) actions.add(m[1]);
  if (/useHuiActions\s*\(/.test(content)) actions.add('useHuiActions');
  return [...actions];
}

/**
 * Erkennt Contract-Nutzung.
 */
export function detectContractUsage(content, imports) {
  const uses = imports.some(i => i.source.includes('hui.contracts'));
  const contracts = new Set();
  if (uses) {
    const re = /validate\s*\(\s*A\.([A-Z_]+)/g;
    let m;
    while ((m = re.exec(content)) !== null) contracts.add(m[1]);
  }
  return { usesContracts: uses, contracts: [...contracts] };
}

/**
 * Erkennt Registry-Nutzung.
 */
export function detectRegistryUsage(content) {
  return /HuiRegistry\.|from\s+['"].*registry\/HuiRegistry|PILLARS\[|PILLAR_TRAITS\[/.test(content);
}

/**
 * Klassifiziert Dateityp (Page, Component, Hook, etc.).
 */
export function classifyFile(filePath, scanResult) {
  const p = filePath.replace(/\\/g, '/');
  if (p.startsWith('pages/')) return 'Page';
  if (p.startsWith('components/')) return 'Component';
  if (p.startsWith('hooks/')) return 'Hook';
  if (p.startsWith('context/') || /Context\.jsx?$/.test(p)) return 'Context';
  if (p.startsWith('services/')) return 'Service';
  if (p.startsWith('core/')) return 'Engine';
  if (p.startsWith('features/')) return 'Feature';
  if (scanResult?.hooks?.length > 0 && !scanResult?.components?.length) return 'Hook';
  if (scanResult?.components?.length > 0) return 'Component';
  return 'Module';
}
