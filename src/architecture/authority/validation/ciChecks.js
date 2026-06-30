// src/architecture/authority/validation/ciChecks.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Authority — CI/CD Checks (ARCH-004)
// Vor jedem Merge: Authority prüfen, Versionen validieren, Referenzen prüfen.
// ══════════════════════════════════════════════════════════════════════════════

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { buildAuthorityState, invalidateAuthorityCache } from '../registries/registryBuilder.js';
import { validateAuthority, validateModuleCompliance, validateReferences } from './authorityValidator.js';
import { generateAllReports, serializeReportsJson } from '../reports/reportGenerator.js';
import { PROJECT_ROOT, GENERATED_DIR } from '../loader/documentLoader.js';
import { isBindingStatus } from '../constants/statusModel.js';

const AUTHORITY_OUT = join(GENERATED_DIR, 'authority');

/**
 * Führt alle CI-Checks für ARCH-004 aus.
 * @param {{ writeReports?: boolean, failOnWarnings?: boolean }} [options]
 */
export function runCiChecks(options = {}) {
  invalidateAuthorityCache();
  const state = buildAuthorityState({ force: true });
  const authorityCheck = validateAuthority();
  const moduleCheck = validateModuleCompliance();
  const refCheck = validateReferences();

  const checks = [];
  let passed = true;

  checks.push(checkItem('authority-loaded', !!state.constitutionRegistry, 'Constitution geladen'));
  checks.push(checkItem('adrs-present', state.adrRegistry.length >= 2, `${state.adrRegistry.length} ADRs`));
  checks.push(checkItem('rfcs-present', state.rfcRegistry.length >= 1, `${state.rfcRegistry.length} RFCs`));
  checks.push(checkItem('rules-present', state.ruleRegistry.length >= 10, `${state.ruleRegistry.length} Regeln`));
  checks.push(checkItem('no-duplicate-rules', authorityCheck.errors.filter(e => e.includes('Duplikat')).length === 0, 'Keine Duplikat-Regeln'));
  checks.push(checkItem('authority-valid', authorityCheck.valid, 'Authority self-check'));
  checks.push(checkItem('version-registry', state.versionRegistry.length >= 5, `${state.versionRegistry.length} Versionen`));
  checks.push(checkItem('invalid-refs', refCheck.invalid.length === 0, `${refCheck.invalid.length} ungültige Referenzen`));

  const nonRatified = state.rfcRegistry.filter(r => !r.ratified && r.id === 'RFC-000A');
  checks.push({
    id: 'non-ratified-flagged',
    passed: true,
    message: nonRatified.length
      ? `${nonRatified.length} nicht ratifizierte RFC(s) gekennzeichnet: ${nonRatified.map(r => r.id).join(', ')}`
      : 'Alle RFCs ratifiziert oder accepted',
    warning: nonRatified.length > 0,
  });

  const staleRefs = refCheck.stale;
  if (staleRefs.length) {
    checks.push({
      id: 'stale-references',
      passed: true,
      message: `${staleRefs.length} veraltete Referenz(en) erkannt`,
      warning: true,
      details: staleRefs,
    });
  }

  for (const c of checks) {
    if (!c.passed) passed = false;
    if (c.warning && options.failOnWarnings) passed = false;
  }

  const result = Object.freeze({
    passed,
    authority: 'ARCH-004',
    checkedAt: new Date().toISOString(),
    checks: Object.freeze(checks),
    authorityValidation: authorityCheck,
    moduleCompliance: moduleCheck,
    references: refCheck,
    nonRatifiedRules: Object.freeze(
      state.ruleRegistry.filter(r => !isBindingStatus(r.status)).map(r => ({ id: r.id, status: r.status }))
    ),
  });

  if (options.writeReports !== false) {
    writeCiArtifacts(result);
  }

  return result;
}

function checkItem(id, condition, message) {
  return { id, passed: condition, message, warning: false };
}

function writeCiArtifacts(result) {
  if (!existsSync(AUTHORITY_OUT)) mkdirSync(AUTHORITY_OUT, { recursive: true });

  const reports = generateAllReports();
  const json = serializeReportsJson();

  writeFileSync(join(AUTHORITY_OUT, 'ci-result.json'), JSON.stringify(result, null, 2));
  writeFileSync(join(AUTHORITY_OUT, 'authority.json'), JSON.stringify(json, null, 2));

  for (const [name, content] of Object.entries(reports)) {
    if (typeof content === 'string') {
      writeFileSync(join(AUTHORITY_OUT, `${name}-report.md`), content);
    }
  }

  const graph = json.reports.graph;
  if (graph?.mermaid) {
    writeFileSync(join(AUTHORITY_OUT, 'authority-graph.md'), `# Authority Graph\n\n\`\`\`mermaid\n${graph.mermaid}\n\`\`\`\n`);
  }
}

export { AUTHORITY_OUT };
