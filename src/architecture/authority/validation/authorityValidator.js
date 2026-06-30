// src/architecture/authority/validation/authorityValidator.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Authority — Validation (ARCH-004)
// Prüft Authority-Integrität und erkennt Duplikat-Regelquellen in anderen Modulen.
// ══════════════════════════════════════════════════════════════════════════════

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { buildAuthorityState, CANONICAL_DOMAINS, SCANNER_RULES } from '../registries/registryBuilder.js';
import { PROJECT_ROOT } from '../loader/documentLoader.js';
import { STATUS, isBindingStatus } from '../constants/statusModel.js';

/** Module die ausschließlich aus Authority lesen dürfen */
const CONSUMING_MODULES = Object.freeze([
  { path: 'src/architecture/scanner/domains.js', name: 'ARCH-001 domains.js', type: 'domain-registry' },
  { path: 'src/architecture/scanner/violationDetector.js', name: 'ARCH-001 violationDetector.js', type: 'rule-definitions' },
  { path: 'src/architecture/knowledge-graph/', name: 'ARCH-002 Knowledge Graph', type: 'governance-consumer', optional: true },
  { path: 'src/architecture/semantic/', name: 'ARCH-002.1 Semantic Layer', type: 'governance-consumer', optional: true },
  { path: 'src/architecture/intelligence/', name: 'ARCH-003 Intelligence', type: 'governance-consumer', optional: true },
]);

/**
 * Validiert die Authority selbst.
 */
export function validateAuthority() {
  const state = buildAuthorityState({ force: true });
  const errors = [];
  const warnings = [];

  if (!state.constitutionRegistry) {
    errors.push('Constitution nicht geladen — HUI_CONSTITUTION.md fehlt');
  }

  if (state.adrRegistry.length === 0) {
    warnings.push('Keine ADRs in docs/governance/ gefunden');
  }

  if (state.rfcRegistry.length === 0) {
    warnings.push('Keine RFCs in docs/governance/ gefunden');
  }

  const ruleIds = new Set();
  for (const rule of state.ruleRegistry) {
    if (ruleIds.has(rule.id)) {
      errors.push(`Duplikat-Regel-ID: ${rule.id}`);
    }
    ruleIds.add(rule.id);
  }

  const nonRatified = state.ruleRegistry.filter(
    r => !isBindingStatus(r.status) && r.status !== STATUS.EXPERIMENTAL && r.authority !== 'RFC-000A'
  );
  for (const rule of nonRatified) {
    if (['CORE_BYPASS', 'DB_DIRECT_WRITE', 'LAYER_VIOLATION'].includes(rule.id)) {
      warnings.push(`Nicht ratifizierte verbindliche Regel: ${rule.id} (${rule.status})`);
    }
  }

  for (const adr of state.adrRegistry) {
    for (const vt of adr.violationTypes || []) {
      if (!state.ruleRegistry.some(r => r.id === vt)) {
        warnings.push(`ADR ${adr.id} referenziert unbekannte Regel: ${vt}`);
      }
    }
  }

  for (const rfc of state.rfcRegistry) {
    if (rfc.status === STATUS.DRAFT) {
      warnings.push(`RFC ${rfc.id} ist noch nicht ratifiziert (Status: ${rfc.status})`);
    }
  }

  const versionGaps = state.versionRegistry.filter(v => !v.status);
  if (versionGaps.length) {
    warnings.push(`${versionGaps.length} Versionen ohne Status`);
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
    checkedAt: new Date().toISOString(),
  });
}

/**
 * Prüft ob andere Module eigene Regeln definieren statt aus Authority zu lesen.
 */
export function validateModuleCompliance() {
  const violations = [];

  const domainsPath = join(PROJECT_ROOT, 'src/architecture/scanner/domains.js');
  if (existsSync(domainsPath)) {
    const content = readFileSync(domainsPath, 'utf8');
    if (content.includes('export const DOMAINS')) {
      const drift = detectDomainDrift(content);
      if (drift.length) {
        violations.push({
          module: 'src/architecture/scanner/domains.js',
          issue: `Eigene Domain-Definition (${drift.length} Abweichungen von Authority)`,
          drift,
          recommendation: 'Import aus src/architecture/authority — getAuthorityState().domainRegistry',
        });
      } else {
        violations.push({
          module: 'src/architecture/scanner/domains.js',
          issue: 'Definiert DOMAINS lokal statt Authority zu importieren',
          drift: [],
          recommendation: 'Import aus src/architecture/authority — getAuthorityState().domainRegistry',
        });
      }
    }
  }

  const violationPath = join(PROJECT_ROOT, 'src/architecture/scanner/violationDetector.js');
  if (existsSync(violationPath)) {
    violations.push({
      module: 'src/architecture/scanner/violationDetector.js',
      issue: 'Definiert Scanner-Regeln lokal (ALLOWED_DIRECT_DB_PATHS, SEVERITY)',
      recommendation: 'Regeln aus Authority ruleRegistry lesen',
    });
  }

  for (const mod of CONSUMING_MODULES.filter(m => m.optional)) {
    const modPath = join(PROJECT_ROOT, mod.path);
    if (existsSync(modPath)) {
      violations.push({
        module: mod.name,
        issue: `${mod.type} muss Regeln aus ARCH-004 Authority lesen`,
        recommendation: 'import { getCurrentRules, getConstitution } from "../authority/index.js"',
      });
    }
  }

  return Object.freeze({
    compliant: violations.length === 0,
    violations: Object.freeze(violations),
    consumingModules: CONSUMING_MODULES,
    authority: 'ARCH-004',
    note: 'Module mit lokalen Regeldefinitionen müssen auf Authority migriert werden. Keine automatische Codeänderung.',
  });
}

/**
 * Erkennt Abweichungen zwischen domains.js und Authority.
 */
function detectDomainDrift(domainsContent) {
  const drift = [];
  for (const [id, domain] of Object.entries(CANONICAL_DOMAINS)) {
    if (!domainsContent.includes(`id: '${id}'`) && !domainsContent.includes(`id: "${id}"`)) {
      drift.push({ domain: id, issue: 'missing in domains.js' });
    }
    if (domain.layer !== undefined && !domainsContent.includes(`layer: ${domain.layer}`)) {
      const layerMatch = domainsContent.match(new RegExp(`${id}:[\\s\\S]*?layer:\\s*(\\d+|-\\d+)`));
      if (layerMatch && parseInt(layerMatch[1], 10) !== domain.layer) {
        drift.push({ domain: id, issue: `layer mismatch: domains.js=${layerMatch[1]}, authority=${domain.layer}` });
      }
    }
  }
  return drift;
}

/**
 * Validiert Referenzen zwischen Dokumenten.
 */
export function validateReferences() {
  const state = buildAuthorityState();
  const stale = [];
  const invalid = [];

  for (const adr of state.adrRegistry) {
    if (adr.content?.includes('ARCH-003') && !existsSync(join(PROJECT_ROOT, 'src/architecture/intelligence'))) {
      stale.push({ document: adr.id, reference: 'ARCH-003 intelligence module', status: 'not yet merged' });
    }
  }

  const expectedRules = SCANNER_RULES.map(r => r.id);
  for (const ruleId of expectedRules) {
    if (!state.ruleRegistry.some(r => r.id === ruleId)) {
      invalid.push({ type: 'missing-rule', id: ruleId });
    }
  }

  return Object.freeze({ stale: Object.freeze(stale), invalid: Object.freeze(invalid) });
}
