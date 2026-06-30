// src/architecture/scanner/domains.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Domain Registry — ARCH-001
//
// Definiert die kanonischen Domains, ihre Pfadzugehörigkeit und ihre
// erlaubten/verbotenen Abhängigkeiten (basierend auf RFC-000 / HUI Constitution).
//
// Layering-Regel (RFC-000):
//   UI → Features → Services → Core → Registry
//   Kein Rück-Import erlaubt (z.B. Core → UI ist ILLEGAL).
// ══════════════════════════════════════════════════════════════════════════════

export const DOMAINS = {
  CORE: {
    id: 'CORE',
    label: 'Core',
    description: 'Core Engines — Constitution-konforme Single Source of Truth',
    paths: ['src/core'],
    layer: 0,
    allowedDependencies: ['REGISTRY'],
    color: '#16D7C5',
  },
  REGISTRY: {
    id: 'REGISTRY',
    label: 'Registry',
    description: 'HuiRegistry — Single Source of Meaning (Texte, Farben, Labels)',
    paths: ['src/registry'],
    layer: 0,
    allowedDependencies: [],
    color: '#FFD700',
  },
  ROUTES: {
    id: 'ROUTES',
    label: 'Routes',
    description: 'Route Registry — Shadow Mode (NAV-001B)',
    paths: ['src/routes'],
    layer: 1,
    allowedDependencies: ['CORE', 'REGISTRY'],
    color: '#888',
  },
  SERVICES: {
    id: 'SERVICES',
    label: 'Services',
    description: 'Service Layer — DB-Abstraktion, Business Logic',
    paths: ['src/services', 'src/lib'],
    layer: 2,
    allowedDependencies: ['CORE', 'REGISTRY', 'ROUTES'],
    color: '#FF8A6B',
  },
  SYSTEM: {
    id: 'SYSTEM',
    label: 'System',
    description: 'System Flows, Feed Engine, Orb System',
    paths: ['src/system', 'src/feed', 'src/orb'],
    layer: 2,
    allowedDependencies: ['CORE', 'REGISTRY', 'SERVICES'],
    color: '#8B5CF6',
  },
  HOOKS: {
    id: 'HOOKS',
    label: 'Hooks',
    description: 'React Hooks — Datenzugriff für UI-Komponenten',
    paths: ['src/hooks'],
    layer: 3,
    allowedDependencies: ['CORE', 'REGISTRY', 'SERVICES', 'SYSTEM'],
    color: '#F59E0B',
  },
  CONTEXT: {
    id: 'CONTEXT',
    label: 'Context',
    description: 'React Context Provider — globaler State',
    paths: ['src/context'],
    layer: 3,
    allowedDependencies: ['CORE', 'REGISTRY', 'SERVICES', 'SYSTEM', 'HOOKS'],
    color: '#3B82F6',
  },
  FEATURES: {
    id: 'FEATURES',
    label: 'Features',
    description: 'Feature Module — zusammengesetzte Logik',
    paths: ['src/features', 'src/config', 'src/content', 'src/design'],
    layer: 4,
    allowedDependencies: ['CORE', 'REGISTRY', 'SERVICES', 'SYSTEM', 'HOOKS', 'CONTEXT'],
    color: '#10B981',
  },
  PAGES: {
    id: 'PAGES',
    label: 'Pages',
    description: 'Seiten — Top-Level Route-Komponenten',
    paths: ['src/pages'],
    layer: 5,
    allowedDependencies: ['CORE', 'REGISTRY', 'SERVICES', 'SYSTEM', 'HOOKS', 'CONTEXT', 'FEATURES', 'COMPONENTS'],
    color: '#EC4899',
  },
  COMPONENTS: {
    id: 'COMPONENTS',
    label: 'Components',
    description: 'UI-Komponenten — Darstellung und Interaktion',
    paths: ['src/components', 'src/utils'],
    layer: 5,
    allowedDependencies: ['CORE', 'REGISTRY', 'SERVICES', 'SYSTEM', 'HOOKS', 'CONTEXT', 'FEATURES'],
    color: '#6366F1',
  },
  ARCHITECTURE: {
    id: 'ARCHITECTURE',
    label: 'Architecture',
    description: 'Scanner & Registry — kein Runtime-Einfluss',
    paths: ['src/architecture'],
    layer: -1,
    allowedDependencies: [],
    color: '#94A3B8',
  },
};

// Reihenfolge für Layer-Validierung (niedrigste Schicht zuerst)
export const LAYER_ORDER = [
  'REGISTRY', 'CORE', 'ROUTES', 'SERVICES', 'SYSTEM',
  'HOOKS', 'CONTEXT', 'FEATURES', 'PAGES', 'COMPONENTS',
];

/**
 * Bestimmt die Domain eines Dateipfades.
 * @param {string} filePath
 * @returns {string} Domain-ID
 */
export function getDomainForPath(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  // Längste (spezifischste) Match-Pfade zuerst prüfen
  const sorted = Object.values(DOMAINS)
    .flatMap(d => d.paths.map(p => ({ domain: d.id, path: p })))
    .sort((a, b) => b.path.length - a.path.length);

  for (const { domain, path } of sorted) {
    if (normalized.startsWith(path + '/') || normalized === path) {
      return domain;
    }
  }
  return 'UNKNOWN';
}

/**
 * Prüft ob ein Import von sourceDomain nach targetDomain erlaubt ist.
 * @param {string} sourceDomain
 * @param {string} targetDomain
 * @returns {{ allowed: boolean, reason: string }}
 */
export function isImportAllowed(sourceDomain, targetDomain) {
  if (sourceDomain === targetDomain) return { allowed: true, reason: 'same-domain' };
  if (targetDomain === 'UNKNOWN' || sourceDomain === 'UNKNOWN') {
    return { allowed: true, reason: 'unknown-domain' };
  }
  if (sourceDomain === 'ARCHITECTURE') return { allowed: false, reason: 'architecture-no-import' };

  const source = DOMAINS[sourceDomain];
  if (!source) return { allowed: true, reason: 'unregistered-domain' };

  if (source.allowedDependencies.includes(targetDomain)) {
    return { allowed: true, reason: 'allowed-dependency' };
  }

  const sourceLayer = source.layer;
  const targetLayer = DOMAINS[targetDomain]?.layer ?? 99;

  // Rück-Import: höhere Schicht importiert niedrigere
  if (sourceLayer < targetLayer) {
    return { allowed: false, reason: `layer-violation: ${sourceDomain}(${sourceLayer}) → ${targetDomain}(${targetLayer})` };
  }

  return { allowed: true, reason: 'same-or-higher-layer' };
}
