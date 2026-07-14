// src/architecture/intelligence/explain.js
// ══════════════════════════════════════════════════════════════════════════════
// Explain Engine — ARCH-003
// Beantwortet Architekturfragen mit nachvollziehbaren Quellen.
// ══════════════════════════════════════════════════════════════════════════════

import { getDomainForPath, DOMAINS } from '../scanner/domains.js';
import { getRuleForViolationType, getRulesForDomain, ARCHITECTURE_RULES, GOLDEN_RULES, PILLARS } from '../governance/constitution.js';
import { getAdrsForFile, getAdrsForViolationType } from '../governance/adrRegistry.js';
import { getRfcsForDomain } from '../governance/rfcRegistry.js';
import { getDependents, getDependencies, getTablesForFile, getViolationsForFile, getFilesInDomain } from '../graph/knowledgeGraph.js';
import { CAPABILITY_PATTERNS, JOURNEY_PATTERNS } from '../semantic/semanticLayer.js';
import { createStatement, combineStatements, SOURCE, CONFIDENCE } from './confidence.js';

const REMEDIATION = Object.freeze({
  CORE_BYPASS: 'Verschiebe DB-Write nach ContentService oder nutze coreEngine.js / useCoreEngine(). State über AppStateContext delegieren.',
  DB_DIRECT_WRITE: 'Verschiebe DB-Write in src/services/. Action über useHuiActions dispatchen.',
  DB_DIRECT_READ: 'Erstelle oder nutze einen Service in src/services/ für den Datenzugriff.',
  LAYER_VIOLATION: 'Entferne den Import oder extrahiere die benötigte Logik in die erlaubte Schicht.',
  DUPLICATE_OWNER: 'Konsolidiere Schreibzugriff auf eine Service-Datei. Andere Dateien rufen den Service auf.',
  DIRECT_ROUTING: 'Nutze useHuiActions() / dispatch() statt window.location oder history.*.',
  REGISTRY_BYPASS: 'Ersetze hardcodierte Farben/Labels durch HuiRegistry oder Design Tokens.',
  MISSING_HEADER: 'Füge @domain und @owner JSDoc-Tags im Datei-Header hinzu.',
});

/**
 * Erklärt eine Datei (Node) im Knowledge Graph.
 * @param {string} filePath
 * @param {ScanReport} scan
 */
export function explainNode(filePath, scan) {
  const result = scan.scanResults.get(filePath);
  if (!result) {
    return { error: `Datei nicht gefunden: ${filePath}`, sourceType: SOURCE.EXPLICIT, confidence: CONFIDENCE.HIGH };
  }

  const semantics = scan.semantics.get(filePath);
  const domain = getDomainForPath('src/' + filePath);
  const violations = getViolationsForFile(filePath, scan.violations);
  const dependents = getDependents(filePath, scan.graph);
  const dependencies = getDependencies(filePath, scan.graph);
  const tables = getTablesForFile(filePath, scan.graph);
  const adrs = getAdrsForFile(filePath, scan.governance.adrs);
  const rfcs = getRfcsForDomain(domain, scan.governance.rfcs);
  const rules = getRulesForDomain(domain);

  const statements = [
    createStatement(
      `Datei '${filePath}' gehört zur Domain ${domain} (Layer ${DOMAINS[domain]?.layer ?? '?'})`,
      { type: 'path-analysis', path: filePath },
      SOURCE.EXPLICIT, CONFIDENCE.HIGH,
      [{ type: 'domains', ref: 'src/architecture/scanner/domains.js' }]
    ),
  ];

  if (result.header?.responsibility) {
    statements.push(createStatement(result.header.responsibility, { type: 'file-header', path: filePath }, SOURCE.EXPLICIT, CONFIDENCE.HIGH));
  }

  return {
    type: 'node',
    target: filePath,
    summary: combineStatements(statements, `Erklärung für ${filePath}`),
    domain: { id: domain, ...DOMAINS[domain] },
    responsibility: semantics?.responsibility || null,
    owner: result.header?.owner || null,
    capabilities: semantics?.capabilities || [],
    journeys: semantics?.journeys || [],
    rules: rules.map(r => ({ id: r.id, title: r.title, constitutionRef: r.constitutionRef })),
    adrs: adrs.map(a => ({ id: a.id, title: a.title, status: a.status })),
    rfcs: rfcs.map(r => ({ id: r.id, title: r.title })),
    dependencies: { count: dependencies.length, files: dependencies.slice(0, 10) },
    dependents: { count: dependents.length, files: dependents.slice(0, 10) },
    tables,
    violations,
    adoption: semantics?.adoption,
    sources: [
      { type: 'scan', ref: filePath },
      { type: 'constitution', ref: 'HUI_CONSTITUTION.md' },
      ...adrs.map(a => ({ type: 'adr', ref: a.path })),
    ],
  };
}

/**
 * Erklärt ein Feature (Pfadmuster-basiert).
 * @param {string} featurePattern — z.B. 'commerce', 'profile'
 * @param {ScanReport} scan
 */
export function explainFeature(featurePattern, scan) {
  const matchingFiles = [...scan.scanResults.values()]
    .filter(r => r && r.path.toLowerCase().includes(featurePattern.toLowerCase()));

  const capabilities = CAPABILITY_PATTERNS.filter(c =>
    c.patterns.some(p => p.toLowerCase().includes(featurePattern.toLowerCase()))
  );

  const allViolations = matchingFiles.flatMap(f => getViolationsForFile(f.path, scan.violations));
  const domains = [...new Set(matchingFiles.map(f => getDomainForPath('src/' + f.path)))];

  return {
    type: 'feature',
    target: featurePattern,
    summary: createStatement(
      `Feature '${featurePattern}' umfasst ${matchingFiles.length} Dateien in ${domains.length} Domains`,
      { type: 'pattern-match', path: featurePattern },
      SOURCE.DERIVED, matchingFiles.length > 0 ? CONFIDENCE.HIGH : CONFIDENCE.LOW
    ),
    files: matchingFiles.map(f => f.path),
    domains,
    capabilities,
    violations: allViolations,
    violationCount: allViolations.length,
    sources: matchingFiles.slice(0, 5).map(f => ({ type: 'file', ref: f.path })),
  };
}

/**
 * Erklärt eine Capability.
 * @param {string} capabilityId — z.B. 'CAP-COMMERCE'
 * @param {ScanReport} scan
 */
export function explainCapability(capabilityId, scan) {
  const cap = CAPABILITY_PATTERNS.find(c => c.id === capabilityId);
  if (!cap) return { error: `Capability nicht gefunden: ${capabilityId}` };

  const supportingFiles = [...scan.scanResults.values()]
    .filter(r => r && cap.patterns.some(p => r.path.includes(p)));

  const pillar = PILLARS.find(p => p.id === cap.pillar);

  return {
    type: 'capability',
    target: capabilityId,
    name: cap.name,
    pillar,
    domain: cap.domain,
    summary: createStatement(
      `Capability '${cap.name}' wird von ${supportingFiles.length} Dateien unterstützt`,
      { type: 'capability-pattern', path: capabilityId },
      SOURCE.DERIVED, CONFIDENCE.HIGH
    ),
    supportingFiles: supportingFiles.map(f => f.path),
    violations: supportingFiles.flatMap(f => getViolationsForFile(f.path, scan.violations)),
    sources: [{ type: 'semantic-layer', ref: 'src/architecture/semantic/semanticLayer.js' }],
  };
}

/**
 * Erklärt eine Domain.
 * @param {string} domainId
 * @param {ScanReport} scan
 */
export function explainDomain(domainId, scan) {
  const domain = DOMAINS[domainId];
  if (!domain) return { error: `Domain nicht gefunden: ${domainId}` };

  const files = getFilesInDomain(domainId, scan.graph);
  const domainViolations = scan.violations.filter(v => v.domain === domainId);
  const rules = getRulesForDomain(domainId);
  const rfcs = getRfcsForDomain(domainId, scan.governance.rfcs);

  return {
    type: 'domain',
    target: domainId,
    ...domain,
    summary: createStatement(
      `Domain ${domain.label} (Layer ${domain.layer}): ${files.length} Dateien, ${domainViolations.length} Violations`,
      { type: 'domain-analysis', path: domainId },
      SOURCE.DERIVED, CONFIDENCE.HIGH
    ),
    files: files.slice(0, 30),
    fileCount: files.length,
    rules,
    rfcs: rfcs.map(r => ({ id: r.id, title: r.title })),
    violations: domainViolations,
    allowedDependencies: domain.allowedDependencies,
    sources: [
      { type: 'domains', ref: 'src/architecture/scanner/domains.js' },
      { type: 'constitution', ref: 'HUI_CONSTITUTION.md' },
    ],
  };
}

/**
 * Erklärt eine User Journey.
 * @param {string} journeyId
 * @param {ScanReport} scan
 */
export function explainJourney(journeyId, scan) {
  const journey = JOURNEY_PATTERNS.find(j => j.id === journeyId);
  if (!journey) return { error: `Journey nicht gefunden: ${journeyId}` };

  const journeyFiles = [...scan.scanResults.values()]
    .filter(r => r && journey.patterns.some(p => r.path.includes(p)));

  const affectedViolations = journeyFiles.flatMap(f => getViolationsForFile(f.path, scan.violations));

  return {
    type: 'journey',
    target: journeyId,
    name: journey.name,
    summary: createStatement(
      `User Journey '${journey.name}' betrifft ${journeyFiles.length} Dateien`,
      { type: 'journey-pattern', path: journeyId },
      SOURCE.DERIVED, CONFIDENCE.MEDIUM
    ),
    files: journeyFiles.map(f => f.path),
    violations: affectedViolations,
    riskIfBroken: affectedViolations.filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH').length,
    sources: journeyFiles.slice(0, 5).map(f => ({ type: 'file', ref: f.path })),
  };
}

/**
 * Erklärt eine Architekturentscheidung (ADR).
 * @param {string} adrId
 * @param {ScanReport} scan
 */
export function explainDecision(adrId, scan) {
  const adr = scan.governance.adrs.find(a => a.id === adrId);
  if (!adr) return { error: `ADR nicht gefunden: ${adrId}` };

  const relatedViolations = scan.violations.filter(v => adr.violationTypes.includes(v.type));
  const governedFiles = [...scan.scanResults.values()]
    .filter(r => r && adr.governedPaths.some(p => r.path.startsWith(p.replace(/^src\//, ''))));

  return {
    type: 'decision',
    target: adrId,
    adr,
    summary: createStatement(
      `ADR ${adrId}: ${adr.title} — ${relatedViolations.length} aktuelle Violations`,
      { type: 'adr', path: adr.path },
      SOURCE.EXPLICIT, CONFIDENCE.HIGH
    ),
    governedFiles: governedFiles.length,
    violations: relatedViolations.slice(0, 20),
    implements: adr.implements,
    sources: [{ type: 'adr', ref: adr.path }],
  };
}

/**
 * Erklärt einen Violation mit vollständiger Begründung.
 * @param {string} violationId
 * @param {ScanReport} scan
 */
export function explainViolation(violationId, scan) {
  const violation = scan.violations.find(v => v.id === violationId);
  if (!violation) return { error: `Violation nicht gefunden: ${violationId}` };

  const rule = getRuleForViolationType(violation.type);
  const adrs = getAdrsForViolationType(violation.type, scan.governance.adrs);
  const remediation = REMEDIATION[violation.type] || 'Prüfe HUI Constitution und RFC-000.';

  const statements = [
    createStatement(violation.message, { type: 'violation', path: violation.file, line: violation.line }, SOURCE.EXPLICIT, CONFIDENCE.HIGH),
  ];

  if (rule) {
    statements.push(createStatement(
      `Verletzt Regel '${rule.title}' (${rule.constitutionRef})`,
      { type: 'constitution-rule', section: rule.constitutionRef },
      SOURCE.EXPLICIT, CONFIDENCE.HIGH,
      [{ type: 'constitution', ref: 'HUI_CONSTITUTION.md' }]
    ));
  }

  return {
    type: 'violation',
    target: violationId,
    violation,
    rule,
    adrs: adrs.map(a => ({ id: a.id, title: a.title })),
    remediation,
    summary: combineStatements(statements, violation.message),
    affectedFiles: violation.writers || [violation.file],
    sources: [
      { type: 'scan', ref: violation.file, line: violation.line },
      { type: 'constitution', ref: 'HUI_CONSTITUTION.md' },
      ...adrs.map(a => ({ type: 'adr', ref: a.path })),
    ],
  };
}

/**
 * Erklärt den Impact einer Datei-Änderung.
 * @param {string} filePath
 * @param {ScanReport} scan
 */
export function explainImpact(filePath, scan) {
  const dependents = getDependents(filePath, scan.graph);
  const tables = getTablesForFile(filePath, scan.graph);
  const semantics = scan.semantics.get(filePath);
  const violations = getViolationsForFile(filePath, scan.violations);

  const brokenServices = dependents.filter(d => d.includes('services/') || d.includes('lib/'));
  const affectedJourneys = semantics?.journeys || [];
  const affectedCapabilities = semantics?.capabilities || [];

  return {
    type: 'impact',
    target: filePath,
    summary: createStatement(
      `Änderung an '${filePath}' betrifft ${dependents.length} abhängige Dateien, ${tables.length} Tabellen`,
      { type: 'graph-analysis', path: filePath },
      SOURCE.DERIVED, CONFIDENCE.HIGH
    ),
    dependents: { count: dependents.length, files: dependents },
    brokenServices,
    affectedCapabilities,
    affectedJourneys,
    tables,
    existingViolations: violations,
    sources: [
      { type: 'knowledge-graph', ref: 'src/architecture/graph/knowledgeGraph.js' },
      { type: 'file', ref: filePath },
    ],
  };
}

/**
 * Erklärt die Gesamtarchitektur.
 * @param {ScanReport} scan
 */
export function explainArchitecture(scan) {
  const { metrics, violations, governance } = scan;

  return {
    type: 'architecture',
    summary: createStatement(
      `HUI Architektur: ${metrics.totalFiles} Dateien, ${metrics.totalViolations} Violations (${metrics.criticalViolations} CRITICAL)`,
      { type: 'scan-metrics' },
      SOURCE.DERIVED, CONFIDENCE.HIGH
    ),
    metrics,
    health: {
      actionEngineAdoption: metrics.actionEnginePct,
      coreEngineAdoption: metrics.coreEnginePct,
      registryAdoption: metrics.registryPct,
      ownershipCoverage: metrics.ownershipCoveragePct,
    },
    violationsBySeverity: {
      critical: metrics.criticalViolations,
      high: metrics.highViolations,
      medium: metrics.mediumViolations,
      low: metrics.lowViolations,
      info: metrics.infoViolations,
    },
    domains: metrics.byDomain,
    goldenRules: GOLDEN_RULES,
    pillars: PILLARS,
    adrs: governance.adrs.map(a => ({ id: a.id, title: a.title, status: a.status })),
    rfcs: governance.rfcs.map(r => ({ id: r.id, title: r.title, status: r.status })),
    constitutionSections: governance.constitution.sections.length,
    sources: [
      { type: 'constitution', ref: 'HUI_CONSTITUTION.md' },
      { type: 'scanner', ref: 'src/architecture/scanner/' },
      { type: 'metrics', ref: 'docs/generated/metrics.json' },
    ],
  };
}

/**
 * Universelle Explain-Funktion — dispatcht nach Typ.
 * @param {{ type: string, target?: string }} query
 * @param {ScanReport} scan
 */
export function explain(query, scan) {
  const { type, target } = query;

  switch (type) {
    case 'node':       return explainNode(target, scan);
    case 'feature':    return explainFeature(target, scan);
    case 'capability': return explainCapability(target, scan);
    case 'domain':     return explainDomain(target, scan);
    case 'journey':    return explainJourney(target, scan);
    case 'decision':   return explainDecision(target, scan);
    case 'violation':  return explainViolation(target, scan);
    case 'impact':     return explainImpact(target, scan);
    case 'architecture': return explainArchitecture(scan);
    default:
      if (target && scan.scanResults.has(target)) return explainNode(target, scan);
      return explainArchitecture(scan);
  }
}
