// src/architecture/intelligence/validate.js
// ══════════════════════════════════════════════════════════════════════════════
// Constitution Validator — ARCH-003
// Prüft Architektur-Regeln automatisch und erklärt Verstöße.
// ══════════════════════════════════════════════════════════════════════════════

import { getDomainForPath, isImportAllowed } from '../scanner/domains.js';
import { SEVERITY } from '../scanner/violationDetector.js';
import { ARCHITECTURE_RULES, GOLDEN_RULES, getRuleForViolationType, getRulesForDomain } from '../governance/constitution.js';
import { analyzeAdrCompliance } from '../governance/adrRegistry.js';
import { analyzeRfcImpact } from '../governance/rfcRegistry.js';
import { createStatement, SOURCE, CONFIDENCE } from './confidence.js';
import { explainViolation } from './explain.js';

/**
 * Validiert die gesamte Architektur gegen Constitution, ADRs und RFCs.
 * @param {ScanReport} scan
 */
export function validateConstitution(scan) {
  const results = {
    valid: scan.metrics.criticalViolations === 0,
    timestamp: new Date().toISOString(),
    summary: {
      totalViolations: scan.metrics.totalViolations,
      critical: scan.metrics.criticalViolations,
      high: scan.metrics.highViolations,
    },
    rules: [],
    goldenRules: GOLDEN_RULES.map(r => ({ ...r, checkable: false, note: 'Manuelle Review erforderlich' })),
    violations: scan.violations.map(v => ({
      ...v,
      explanation: explainViolation(v.id, scan),
      rule: getRuleForViolationType(v.type),
    })),
  };

  for (const rule of Object.values(ARCHITECTURE_RULES)) {
    const ruleViolations = scan.violations.filter(v => rule.violationTypes.includes(v.type));
    results.rules.push({
      id: rule.id,
      title: rule.title,
      constitutionRef: rule.constitutionRef,
      severity: rule.severity,
      compliant: ruleViolations.length === 0,
      violationCount: ruleViolations.length,
      violations: ruleViolations.slice(0, 10),
    });
  }

  return results;
}

/**
 * Validiert ADR-Compliance für alle Dateien.
 * @param {ScanReport} scan
 */
export function validateAdrs(scan) {
  const compliance = [];

  for (const adr of scan.governance.adrs) {
    const relatedViolations = scan.violations.filter(v => adr.violationTypes.includes(v.type));
    compliance.push({
      adr: adr.id,
      title: adr.title,
      status: adr.status,
      compliant: relatedViolations.length === 0,
      violationCount: relatedViolations.length,
      violations: relatedViolations.slice(0, 10),
      governedPaths: adr.governedPaths,
    });
  }

  return {
    valid: compliance.every(c => c.compliant),
    adrs: compliance,
  };
}

/**
 * Validiert RFC-Compliance.
 * @param {ScanReport} scan
 */
export function validateRfcs(scan) {
  const compliance = [];

  for (const rfc of scan.governance.rfcs) {
    const domainViolations = scan.violations.filter(v =>
      rfc.governedDomains.includes(v.domain) &&
      ['LAYER_VIOLATION', 'DB_DIRECT_WRITE', 'CORE_BYPASS'].includes(v.type)
    );

    compliance.push({
      rfc: rfc.id,
      title: rfc.title,
      status: rfc.status,
      compliant: domainViolations.length === 0,
      violationCount: domainViolations.length,
      rules: rfc.rules,
      violations: domainViolations.slice(0, 10),
    });
  }

  return {
    valid: compliance.every(c => c.compliant),
    rfcs: compliance,
  };
}

/**
 * Validiert einen vorgeschlagenen Change ohne Dateisystem zu ändern.
 * @param {object} proposal
 * @param {ScanReport} scan
 */
export function validateProposal(proposal, scan) {
  const violations = [];
  const warnings = [];

  if (proposal.addImport) {
    const { from, to } = proposal.addImport;
    const fromDomain = getDomainForPath('src/' + from);
    const toDomain = getDomainForPath('src/' + to);
    const { allowed, reason } = isImportAllowed(fromDomain, toDomain);

    if (!allowed) {
      violations.push({
        type: 'LAYER_VIOLATION',
        severity: SEVERITY.HIGH,
        message: `Import ${fromDomain} → ${toDomain} nicht erlaubt (${reason})`,
        file: from,
        rule: getRuleForViolationType('LAYER_VIOLATION'),
      });
    }
  }

  if (proposal.addDbWrite) {
    const { file, table } = proposal.addDbWrite;
    const domain = getDomainForPath('src/' + file);
    const uiDomains = new Set(['PAGES', 'COMPONENTS', 'FEATURES', 'HOOKS', 'CONTEXT']);

    if (uiDomains.has(domain)) {
      violations.push({
        type: 'DB_DIRECT_WRITE',
        severity: SEVERITY.HIGH,
        message: `DB-Write auf '${table}' in ${domain}-Schicht nicht erlaubt`,
        file,
        rule: getRuleForViolationType('DB_DIRECT_WRITE'),
      });
    }

    const CORE_TABLES = new Set(['profiles', 'wirker_profiles', 'impact_pool', 'impact_votes', 'orb_states', 'resonance_signals', 'core_metrics']);
    if (CORE_TABLES.has(table) && !file.includes('src/core/') && !file.includes('src/services/')) {
      violations.push({
        type: 'CORE_BYPASS',
        severity: SEVERITY.CRITICAL,
        message: `Core-Tabelle '${table}' erfordert Core Engine`,
        file,
        rule: getRuleForViolationType('CORE_BYPASS'),
      });
    }
  }

  const rfcImpact = analyzeRfcImpact(
    { type: proposal.addImport ? 'import' : proposal.addDbWrite ? 'db_write' : 'unknown', ...proposal },
    scan.governance.rfcs
  );

  return {
    allowed: violations.length === 0,
    violations,
    warnings,
    rfcImpact,
    statement: createStatement(
      violations.length === 0 ? 'Vorschlag ist constitution-konform' : `${violations.length} Verstöße erkannt`,
      { type: 'proposal-validation' },
      SOURCE.DERIVED,
      CONFIDENCE.HIGH
    ),
  };
}

/**
 * Universelle Validate-Funktion.
 * @param {{ scope?: string, proposal?: object }} query
 * @param {ScanReport} scan
 */
export function validate(query, scan) {
  if (query.proposal) return validateProposal(query.proposal, scan);

  switch (query.scope) {
    case 'adr':    return validateAdrs(scan);
    case 'rfc':    return validateRfcs(scan);
    case 'constitution':
    default:       return validateConstitution(scan);
  }
}
