// src/architecture/authority/registries/registryBuilder.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Authority — Registry Builder (ARCH-004)
// Baut alle Authority-Registries aus echten Governance-Dokumenten.
// Single Source of Architectural Authority.
// ══════════════════════════════════════════════════════════════════════════════

import {
  loadConstitutionDocument,
  parseGoldenRules,
  parsePillars,
  parseArchitecturePrinciples,
  loadAdrDocuments,
  loadRfcDocuments,
  loadPolicyDocuments,
  readGeneratedJson,
} from '../loader/documentLoader.js';
import { createRule, createDecision, RULE_PRIORITY } from '../constants/ruleSchema.js';
import { STATUS, isBindingStatus } from '../constants/statusModel.js';

/** Kanonische Domain-Definition — Quelle: RFC-000 + HUI Constitution IV */
const CANONICAL_DOMAINS = Object.freeze({
  CORE: {
    id: 'CORE', label: 'Core', layer: 0,
    paths: ['src/core'],
    allowedDependencies: ['REGISTRY'],
    description: 'Core Engines — Constitution-konforme Single Source of Truth',
  },
  REGISTRY: {
    id: 'REGISTRY', label: 'Registry', layer: 0,
    paths: ['src/registry'],
    allowedDependencies: [],
    description: 'HuiRegistry — Single Source of Meaning',
  },
  ROUTES: {
    id: 'ROUTES', label: 'Routes', layer: 1,
    paths: ['src/routes'],
    allowedDependencies: ['CORE', 'REGISTRY'],
    description: 'Route Registry — Shadow Mode (NAV-001B / ADR-001)',
  },
  SERVICES: {
    id: 'SERVICES', label: 'Services', layer: 2,
    paths: ['src/services', 'src/lib'],
    allowedDependencies: ['CORE', 'REGISTRY', 'ROUTES'],
    description: 'Service Layer — DB-Abstraktion, Business Logic',
  },
  SYSTEM: {
    id: 'SYSTEM', label: 'System', layer: 2,
    paths: ['src/system', 'src/feed', 'src/orb'],
    allowedDependencies: ['CORE', 'REGISTRY', 'SERVICES'],
    description: 'System Flows, Feed Engine, Orb System',
  },
  HOOKS: {
    id: 'HOOKS', label: 'Hooks', layer: 3,
    paths: ['src/hooks'],
    allowedDependencies: ['CORE', 'REGISTRY', 'SERVICES', 'SYSTEM'],
    description: 'React Hooks — Datenzugriff für UI-Komponenten',
  },
  CONTEXT: {
    id: 'CONTEXT', label: 'Context', layer: 3,
    paths: ['src/context'],
    allowedDependencies: ['CORE', 'REGISTRY', 'SERVICES', 'SYSTEM', 'HOOKS'],
    description: 'React Context Provider — globaler State',
  },
  FEATURES: {
    id: 'FEATURES', label: 'Features', layer: 4,
    paths: ['src/features', 'src/config', 'src/content', 'src/design'],
    allowedDependencies: ['CORE', 'REGISTRY', 'SERVICES', 'SYSTEM', 'HOOKS', 'CONTEXT'],
    description: 'Feature Module — zusammengesetzte Logik',
  },
  PAGES: {
    id: 'PAGES', label: 'Pages', layer: 5,
    paths: ['src/pages'],
    allowedDependencies: ['CORE', 'REGISTRY', 'SERVICES', 'SYSTEM', 'HOOKS', 'CONTEXT', 'FEATURES', 'COMPONENTS'],
    description: 'Seiten — Top-Level Route-Komponenten',
  },
  COMPONENTS: {
    id: 'COMPONENTS', label: 'Components', layer: 5,
    paths: ['src/components', 'src/utils'],
    allowedDependencies: ['CORE', 'REGISTRY', 'SERVICES', 'SYSTEM', 'HOOKS', 'CONTEXT', 'FEATURES'],
    description: 'UI-Komponenten — Darstellung und Interaktion',
  },
  ARCHITECTURE: {
    id: 'ARCHITECTURE', label: 'Architecture', layer: -1,
    paths: ['src/architecture'],
    allowedDependencies: [],
    description: 'Scanner, Authority & Governance — kein Runtime-Einfluss',
  },
});

/** Scanner-Regeln — Quelle: ADR-002 + RFC-000 */
const SCANNER_RULES = Object.freeze([
  { id: 'CORE_BYPASS',       title: 'Core tables via Core Engine only',       severity: 'CRITICAL', violationType: 'CORE_BYPASS' },
  { id: 'DB_DIRECT_WRITE',   title: 'No DB writes in UI layers',              severity: 'HIGH',     violationType: 'DB_DIRECT_WRITE' },
  { id: 'DB_DIRECT_READ',    title: 'No direct DB reads in UI layers',         severity: 'MEDIUM',   violationType: 'DB_DIRECT_READ' },
  { id: 'LAYER_VIOLATION',   title: 'RFC-000 import direction',                severity: 'HIGH',     violationType: 'LAYER_VIOLATION' },
  { id: 'DUPLICATE_OWNER',   title: 'Single writer per table',                 severity: 'HIGH',     violationType: 'DUPLICATE_OWNER' },
  { id: 'DIRECT_ROUTING',    title: 'Action Engine required for navigation',   severity: 'HIGH',     violationType: 'DIRECT_ROUTING' },
  { id: 'ACTION_ENGINE_GAP', title: 'navigate() via Action Engine',            severity: 'HIGH',     violationType: 'ACTION_ENGINE_GAP' },
  { id: 'REGISTRY_BYPASS',   title: 'HuiRegistry for colors/labels',           severity: 'LOW',      violationType: 'REGISTRY_BYPASS' },
  { id: 'MISSING_HEADER',    title: '@domain + @owner tags required',          severity: 'INFO',     violationType: 'MISSING_HEADER' },
]);

/** ADR-Metadaten — explizite Zuordnungen aus Code und Dokumenten */
const ADR_METADATA = Object.freeze({
  'ADR-001': {
    governedPaths: ['src/routes/', 'src/pages/'],
    violationTypes: ['DIRECT_ROUTING', 'ACTION_ENGINE_GAP'],
    influencedRules: ['DIRECT_ROUTING', 'ACTION_ENGINE_GAP'],
    phases: [
      { phase: 1, release: 'NAV-001B', status: 'Shadow Registry' },
      { phase: 2, release: 'NAV-002', status: 'Parity Validation' },
      { phase: 3, release: 'NAV-003', status: 'Migration' },
      { phase: 4, release: 'NAV-004', status: 'Sole Source' },
    ],
  },
  'ADR-002': {
    governedPaths: ['src/architecture/'],
    violationTypes: ['CORE_BYPASS', 'DB_DIRECT_WRITE', 'LAYER_VIOLATION', 'DUPLICATE_OWNER', 'REGISTRY_BYPASS', 'MISSING_HEADER'],
    influencedRules: SCANNER_RULES.map(r => r.id),
    phases: [
      { phase: 1, release: 'ARCH-001', status: 'Scanner' },
      { phase: 2, release: 'ARCH-002', status: 'Knowledge Graph' },
      { phase: 3, release: 'ARCH-003', status: 'Intelligence' },
      { phase: 4, release: 'ARCH-004', status: 'Authority' },
    ],
  },
});

/** RFC-Metadaten */
const RFC_METADATA = Object.freeze({
  'RFC-000': {
    rules: ['layer-import-direction', 'service-layer-db', 'core-table-access', 'registry-for-meaning'],
    governedDomains: Object.keys(CANONICAL_DOMAINS).filter(d => d !== 'ARCHITECTURE'),
    contracts: ['import-direction', 'db-access-layer', 'core-table-ownership'],
  },
  'RFC-000A': {
    rules: ['governance-process', 'status-model', 'decision-index', 'domain-charter'],
    governedDomains: ['*'],
    contracts: ['governance-flow', 'architecture-approval'],
  },
});

/** System-Capabilities — Quelle: SYSTEM_OWNERSHIP.md */
const SYSTEM_CAPABILITIES = Object.freeze([
  { id: 'CAP-AUTH',       name: 'Auth / Session',       owner: 'lib/AuthContext.jsx' },
  { id: 'CAP-PROFILE',    name: 'Profile',              owner: 'lib/AppStateContext.jsx' },
  { id: 'CAP-NOTIF',      name: 'Notifications',        owner: 'lib/AppStateContext.jsx' },
  { id: 'CAP-CHAT',       name: 'Chats',                owner: 'lib/chatContext.js' },
  { id: 'CAP-MESSAGES',   name: 'Messages',             owner: 'lib/chatContext.js' },
  { id: 'CAP-BOOKINGS',   name: 'Bookings',             owner: 'lib/bookingContext.js' },
  { id: 'CAP-WORKS',      name: 'Works',                owner: 'lib/AppStateContext.jsx' },
  { id: 'CAP-TRUST',      name: 'Trust / Reputation',   owner: 'lib/trustContext.js' },
  { id: 'CAP-PRESENCE',   name: 'Presence',             owner: 'lib/sessionHooks.js' },
  { id: 'CAP-PAYMENTS',   name: 'Payments / Escrow',    owner: 'functions/createCheckout.ts' },
  { id: 'CAP-REALTIME',   name: 'Realtime Channels',    owner: 'docs/REALTIME_REGISTRY.md' },
  { id: 'CAP-ROUTING',    name: 'Route Authority',      owner: 'src/routes/registry.js' },
]);

/** Unveränderliche Invarianten — Quelle: Constitution IV */
const INVARIANTS = Object.freeze([
  { id: 'INV-01', title: 'Keine UI-Komponente besitzt eigene Wirkungslogik', source: 'HUI_CONSTITUTION.md IV' },
  { id: 'INV-02', title: 'Keine Engine besitzt eigene Sprache', source: 'HUI_CONSTITUTION.md IV' },
  { id: 'INV-03', title: 'Registry ist Single Source of Meaning', source: 'HUI_CONSTITUTION.md IV' },
  { id: 'INV-04', title: 'Core Engine ist Single Source of Truth', source: 'HUI_CONSTITUTION.md IV' },
  { id: 'INV-05', title: 'Datenfluss ist unidirektional', source: 'HUI_CONSTITUTION.md IV' },
  { id: 'INV-06', title: 'Keine Gamification', source: 'HUI_CONSTITUTION.md III.8' },
  { id: 'INV-07', title: 'KI ergänzt Menschen, ersetzt sie nicht', source: 'HUI_CONSTITUTION.md VII' },
]);

let _cache = null;

/**
 * Baut alle Registries und gibt Authority-State zurück.
 * @param {{ force?: boolean }} [options]
 */
export function buildAuthorityState(options = {}) {
  if (_cache && !options.force) return _cache;

  const constitution = loadConstitutionDocument();
  const adrs = loadAdrDocuments();
  const rfcs = loadRfcDocuments();
  const policies = loadPolicyDocuments();
  const metrics = readGeneratedJson('metrics.json');

  const goldenRules = constitution ? parseGoldenRules(constitution.content) : [];
  const pillars = constitution ? parsePillars(constitution.content) : [];
  const archPrinciples = constitution ? parseArchitecturePrinciples(constitution.content) : [];

  const rules = buildRules(constitution, goldenRules, archPrinciples, adrs, rfcs, policies);
  const decisions = buildDecisions(adrs, rfcs, constitution);
  const versions = buildVersionRegistry(constitution, adrs, rfcs, policies);
  const migrations = buildMigrationRegistry(adrs);

  _cache = Object.freeze({
    meta: Object.freeze({
      authority: 'ARCH-004',
      version: '1.0.0',
      builtAt: new Date().toISOString(),
      source: 'document-derived',
    }),
    constitutionRegistry: Object.freeze(buildConstitutionRegistry(constitution, goldenRules, pillars, archPrinciples)),
    adrRegistry: Object.freeze(enrichAdrs(adrs)),
    rfcRegistry: Object.freeze(enrichRfcs(rfcs)),
    policyRegistry: Object.freeze(policies),
    ruleRegistry: Object.freeze(rules),
    decisionRegistry: Object.freeze(decisions),
    domainRegistry: Object.freeze(CANONICAL_DOMAINS),
    capabilityRegistry: Object.freeze(SYSTEM_CAPABILITIES),
    layerRegistry: Object.freeze(buildLayerRegistry()),
    governanceRegistry: Object.freeze(buildGovernanceRegistry(rfcs)),
    versionRegistry: Object.freeze(versions),
    statusRegistry: Object.freeze(buildStatusRegistry()),
    migrationRegistry: Object.freeze(migrations),
    invariantRegistry: Object.freeze(INVARIANTS),
    metrics,
  });

  return _cache;
}

/** Invalidiert den Cache */
export function invalidateAuthorityCache() {
  _cache = null;
}

function buildConstitutionRegistry(constitution, goldenRules, pillars, principles) {
  if (!constitution) return null;
  return Object.freeze({
    id: 'CONSTITUTION',
    version: constitution.version,
    status: normalizeStatus(constitution.status),
    date: constitution.date,
    path: constitution.path,
    goldenRules: Object.freeze(goldenRules),
    pillars: Object.freeze(pillars),
    architecturePrinciples: Object.freeze(principles),
    binding: isBindingStatus(normalizeStatus(constitution.status)),
  });
}

function enrichAdrs(adrs) {
  return adrs.map(adr => Object.freeze({
    ...adr,
    status: normalizeStatus(adr.status),
    metadata: Object.freeze(ADR_METADATA[adr.id] || {}),
    governedPaths: ADR_METADATA[adr.id]?.governedPaths || [],
    violationTypes: ADR_METADATA[adr.id]?.violationTypes || [],
    phases: Object.freeze(ADR_METADATA[adr.id]?.phases || []),
    binding: isBindingStatus(normalizeStatus(adr.status)),
  }));
}

function enrichRfcs(rfcs) {
  return rfcs.map(rfc => Object.freeze({
    ...rfc,
    status: normalizeStatus(rfc.status),
    metadata: Object.freeze(RFC_METADATA[rfc.id] || {}),
    rules: Object.freeze(RFC_METADATA[rfc.id]?.rules || []),
    governedDomains: Object.freeze(RFC_METADATA[rfc.id]?.governedDomains || []),
    contracts: Object.freeze(RFC_METADATA[rfc.id]?.contracts || []),
    binding: isBindingStatus(normalizeStatus(rfc.status)),
    ratified: normalizeStatus(rfc.status) === STATUS.RATIFIED || normalizeStatus(rfc.status) === STATUS.ACCEPTED,
  }));
}

function buildRules(constitution, goldenRules, principles, adrs, rfcs, policies) {
  const rules = [];

  for (const gr of goldenRules) {
    rules.push(createRule({
      id: gr.id,
      title: gr.title,
      description: gr.content,
      source: 'HUI_CONSTITUTION.md',
      version: constitution?.version || '1.0',
      status: STATUS.RATIFIED,
      authority: 'CONSTITUTION',
      validSince: constitution?.date,
      scope: 'platform',
      priority: RULE_PRIORITY.CONSTITUTION,
      affectedDomains: ['*'],
    }));
  }

  for (const p of principles) {
    rules.push(createRule({
      id: p.id,
      title: p.title,
      description: p.description,
      source: 'HUI_CONSTITUTION.md',
      version: constitution?.version || '1.0',
      status: STATUS.RATIFIED,
      authority: 'CONSTITUTION',
      validSince: constitution?.date,
      scope: 'architecture',
      priority: RULE_PRIORITY.CONSTITUTION,
      affectedLayers: ['CORE', 'REGISTRY', 'SERVICES', 'COMPONENTS', 'PAGES'],
    }));
  }

  for (const sr of SCANNER_RULES) {
    const adr = adrs.find(a => a.id === 'ADR-002');
    rules.push(createRule({
      id: sr.id,
      title: sr.title,
      description: `Scanner enforcement: ${sr.violationType} (${sr.severity})`,
      source: 'docs/governance/ADR-002-architecture-scanner.md',
      version: '1.0',
      status: adr ? normalizeStatus(adr.status) : STATUS.ACCEPTED,
      authority: 'ADR-002',
      validSince: adr?.date || '2026-06-29',
      scope: 'code',
      priority: RULE_PRIORITY.SCANNER,
      affectedDomains: ['PAGES', 'COMPONENTS', 'FEATURES', 'HOOKS', 'CONTEXT', 'SERVICES', 'CORE'],
      metadata: { severity: sr.severity, violationType: sr.violationType },
    }));
  }

  for (const policy of policies) {
    for (const pr of policy.rules || []) {
      rules.push(createRule({
        id: `${policy.id}-${pr.id}`,
        title: pr.title,
        source: policy.path,
        version: '1.0',
        status: normalizeStatus(policy.status),
        authority: policy.id,
        scope: 'code',
        priority: RULE_PRIORITY.POLICY,
        derived: true,
      }));
    }
  }

  return rules;
}

function buildDecisions(adrs, rfcs, constitution) {
  const decisions = [];

  for (const adr of adrs) {
    const meta = ADR_METADATA[adr.id] || {};
    const contextMatch = adr.content?.match(/## Context\n\n([\s\S]*?)(?=\n## )/);
    const decisionMatch = adr.content?.match(/## Decision\n\n([\s\S]*?)(?=\n## )/);
    const consequencesMatch = adr.content?.match(/## Consequences\n\n([\s\S]*?)(?=\n## |$)/);

    decisions.push(createDecision({
      id: adr.id,
      title: adr.title,
      why: contextMatch?.[1]?.trim() || '',
      alternatives: Object.freeze([]),
      acceptedRisks: Object.freeze(consequencesMatch?.[1]?.split('\n').filter(l => l.startsWith('-')).map(l => l.slice(2)) || []),
      influencedRules: Object.freeze(meta.influencedRules || meta.violationTypes || []),
      adr: adr.id,
      rfc: null,
      constitutionRules: Object.freeze(['GR-09']),
      domains: Object.freeze(meta.governedPaths?.map(p => p.replace('src/', '').replace('/', '')) || []),
      impacts: Object.freeze(decisionMatch?.[1]?.split('\n').filter(l => l.match(/^\d+\./)).map(l => l.replace(/^\d+\.\s*/, '')) || []),
      status: normalizeStatus(adr.status),
      version: '1.0',
      date: adr.date,
      owner: adr.owner,
      source: adr.path,
    }));
  }

  return decisions;
}

function buildLayerRegistry() {
  const layers = {};
  for (const [id, domain] of Object.entries(CANONICAL_DOMAINS)) {
    const layer = domain.layer;
    if (!layers[layer]) layers[layer] = [];
    layers[layer].push(id);
  }
  return Object.freeze(
    Object.fromEntries(
      Object.entries(layers).map(([layer, domains]) => [layer, Object.freeze(domains)])
    )
  );
}

function buildGovernanceRegistry(rfcs) {
  const rfc000a = rfcs.find(r => r.id === 'RFC-000A');
  return Object.freeze({
    process: Object.freeze({
      flow: ['CONSTITUTION', 'RFC', 'ADR', 'RELEASE_SPEC', 'IMPLEMENTATION', 'ARCHITECTURE_APPROVED'],
      source: rfc000a?.path || 'docs/governance/RFC-000A_ARCHITECTURE_GOVERNANCE.md',
    }),
    roles: Object.freeze(['Architecture Council', 'Release Engineering', 'Domain Owner']),
    approvalRequired: Object.freeze(['ADR', 'Constitution', 'RFC']),
  });
}

function buildVersionRegistry(constitution, adrs, rfcs, policies) {
  const versions = [];

  if (constitution) {
    versions.push({ id: 'CONSTITUTION', document: 'HUI_CONSTITUTION.md', version: constitution.version, status: normalizeStatus(constitution.status) });
    const changelog = constitution.content?.match(/\| Version \| Datum[\s\S]*?\n((?:\|[^\n]+\n)+)/);
    if (changelog) {
      const rows = changelog[1].trim().split('\n');
      for (const row of rows) {
        const cols = row.split('|').map(c => c.trim()).filter(Boolean);
        if (cols.length >= 3 && cols[0] !== '1.0') {
          versions.push({ id: `CONSTITUTION-${cols[0]}`, document: 'HUI_CONSTITUTION.md', version: cols[0], status: STATUS.SUPERSEDED, date: cols[1], note: cols[2] });
        }
      }
    }
  }

  for (const adr of adrs) {
    versions.push({ id: adr.id, document: adr.path, version: '1.0', status: normalizeStatus(adr.status), date: adr.date });
  }
  for (const rfc of rfcs) {
    versions.push({ id: rfc.id, document: rfc.path, version: rfc.id.includes('000A') ? '1.0' : '1.0', status: normalizeStatus(rfc.status), date: rfc.date });
  }
  for (const policy of policies) {
    versions.push({ id: policy.id, document: policy.path, version: '1.0', status: normalizeStatus(policy.status) });
  }

  return versions;
}

function buildMigrationRegistry(adrs) {
  const migrations = [];
  for (const adr of adrs) {
    const phases = ADR_METADATA[adr.id]?.phases || [];
    for (const phase of phases) {
      migrations.push(Object.freeze({
        id: `${adr.id}-PHASE-${phase.phase}`,
        adr: adr.id,
        phase: phase.phase,
        release: phase.release,
        status: phase.status,
        current: phase.phase === 1 && adr.id === 'ADR-001',
      }));
    }
  }
  return migrations;
}

function buildStatusRegistry() {
  return Object.freeze({
    model: 'ARCH-004',
    values: Object.freeze(['Draft', 'Review', 'Accepted', 'Ratified', 'Locked', 'Experimental', 'Deprecated', 'Superseded', 'Archived', 'Rejected']),
    binding: Object.freeze(['Accepted', 'Ratified', 'Locked']),
  });
}

function normalizeStatus(raw) {
  if (!raw) return STATUS.DRAFT;
  const s = raw.toLowerCase();
  if (s.includes('ratif')) return STATUS.RATIFIED;
  if (s.includes('accept')) return STATUS.ACCEPTED;
  if (s.includes('review')) return STATUS.REVIEW;
  if (s.includes('draft')) return STATUS.DRAFT;
  if (s.includes('lock')) return STATUS.LOCKED;
  if (s.includes('experiment')) return STATUS.EXPERIMENTAL;
  if (s.includes('deprecat')) return STATUS.DEPRECATED;
  if (s.includes('supersed')) return STATUS.SUPERSEDED;
  if (s.includes('archiv')) return STATUS.ARCHIVED;
  if (s.includes('reject')) return STATUS.REJECTED;
  if (s.includes('shadow')) return STATUS.EXPERIMENTAL;
  return STATUS.DRAFT;
}

export { CANONICAL_DOMAINS, SCANNER_RULES, ADR_METADATA, RFC_METADATA };
