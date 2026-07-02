// src/architecture/authority/reports/reportGenerator.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Authority — Report Generator (ARCH-004)
// ══════════════════════════════════════════════════════════════════════════════

import {
  getAuthorityState,
  getConstitution,
  getCurrentRules,
  getCurrentADR,
  getCurrentRFC,
  getCurrentPolicies,
  getCapabilities,
  getAuthorityGraph,
  getGovernanceHealth,
} from '../api/authorityApi.js';
import { validateAuthority, validateModuleCompliance } from '../validation/authorityValidator.js';

/**
 * Generiert alle Authority-Reports.
 */
export function generateAllReports() {
  return Object.freeze({
    authority:    generateAuthorityReport(),
    governance:   generateGovernanceReport(),
    rules:        generateRuleReport(),
    decisions:    generateDecisionReport(),
    lifecycle:    generateLifecycleReport(),
    versions:     generateVersionReport(),
    policies:     generatePolicyReport(),
    health:       generateHealthReport(),
    compliance:   generateComplianceReport(),
  });
}

export function generateAuthorityReport() {
  const state = getAuthorityState();
  const lines = [
    '# HUI Architecture Authority Report',
    '',
    `**Authority:** ARCH-004 v${state.meta.version}`,
    `**Generated:** ${state.meta.builtAt}`,
    `**Source:** ${state.meta.source}`,
    '',
    '## Registry Summary',
    '',
    '| Registry | Count |',
    '|----------|-------|',
    `| Constitution | ${state.constitutionRegistry ? 1 : 0} |`,
    `| ADRs | ${state.adrRegistry.length} |`,
    `| RFCs | ${state.rfcRegistry.length} |`,
    `| Policies | ${state.policyRegistry.length} |`,
    `| Rules | ${state.ruleRegistry.length} |`,
    `| Decisions | ${state.decisionRegistry.length} |`,
    `| Domains | ${Object.keys(state.domainRegistry).length} |`,
    `| Capabilities | ${state.capabilityRegistry.length} |`,
    `| Invariants | ${state.invariantRegistry.length} |`,
    `| Migrations | ${state.migrationRegistry.length} |`,
    '',
    '## Single Source of Truth',
    '',
    'ARCH-004 ist die einzige verbindliche Instanz für:',
    '- Constitution-Status und Version',
    '- ADR/RFC/Policy-Registries',
    '- Regel-Lifecycle und Status',
    '- Governance Health',
    '- Authority Graph',
    '',
  ];
  return lines.join('\n');
}

export function generateGovernanceReport() {
  const state = getAuthorityState();
  const lines = [
    '# Governance Report',
    '',
    '## Process Flow',
    '',
    '```',
    state.governanceRegistry.process.flow.join(' → '),
    '```',
    '',
    '## ADRs',
    '',
  ];
  for (const adr of state.adrRegistry) {
    lines.push(`### ${adr.id} — ${adr.title}`);
    lines.push(`- **Status:** ${adr.status}`);
    lines.push(`- **Owner:** ${adr.owner}`);
    lines.push(`- **Binding:** ${adr.binding}`);
    lines.push('');
  }
  lines.push('## RFCs', '');
  for (const rfc of state.rfcRegistry) {
    lines.push(`### ${rfc.id} — ${rfc.title}`);
    lines.push(`- **Status:** ${rfc.status}`);
    lines.push(`- **Ratified:** ${rfc.ratified}`);
    lines.push('');
  }
  return lines.join('\n');
}

export function generateRuleReport() {
  const rules = getCurrentRules();
  const lines = [
    '# Rule Report',
    '',
    `**Binding Rules:** ${rules.length}`,
    '',
    '| ID | Title | Status | Authority | Priority |',
    '|----|-------|--------|-----------|----------|',
  ];
  for (const r of rules) {
    lines.push(`| ${r.id} | ${r.title} | ${r.status} | ${r.authority} | ${r.priority} |`);
  }
  return lines.join('\n');
}

export function generateDecisionReport() {
  const state = getAuthorityState();
  const lines = ['# Decision Report', ''];
  for (const d of state.decisionRegistry) {
    lines.push(`## ${d.id} — ${d.title}`);
    lines.push(`**Why:** ${d.why.slice(0, 200)}${d.why.length > 200 ? '...' : ''}`);
    lines.push(`**Status:** ${d.status}`);
    if (d.influencedRules.length) lines.push(`**Rules:** ${d.influencedRules.join(', ')}`);
    if (d.domains.length) lines.push(`**Domains:** ${d.domains.join(', ')}`);
    lines.push('');
  }
  return lines.join('\n');
}

export function generateLifecycleReport() {
  const state = getAuthorityState();
  const lines = [
    '# Lifecycle Report',
    '',
    '## Status Model',
    '',
    state.statusRegistry.values.join(', '),
    '',
    '## Migrations',
    '',
    '| ID | ADR | Phase | Release | Status |',
    '|----|-----|-------|---------|--------|',
  ];
  for (const m of state.migrationRegistry) {
    lines.push(`| ${m.id} | ${m.adr} | ${m.phase} | ${m.release} | ${m.status} |`);
  }
  return lines.join('\n');
}

export function generateVersionReport() {
  const state = getAuthorityState();
  const lines = [
    '# Version Report',
    '',
    '| Document | Version | Status | Date |',
    '|----------|---------|--------|------|',
  ];
  for (const v of state.versionRegistry) {
    lines.push(`| ${v.document} | ${v.version} | ${v.status} | ${v.date || '—'} |`);
  }
  return lines.join('\n');
}

export function generatePolicyReport() {
  const policies = getCurrentPolicies();
  const lines = ['# Policy Report', ''];
  for (const p of policies) {
    lines.push(`## ${p.id} — ${p.title}`);
    lines.push(`- **Path:** ${p.path}`);
    lines.push(`- **Status:** ${p.status}`);
    lines.push(`- **Rules:** ${(p.rules || []).length}`);
    lines.push('');
  }
  return lines.join('\n');
}

export function generateHealthReport() {
  const health = getGovernanceHealth();
  const lines = [
    '# Health Report',
    '',
    `**Architecture Health (aggregated):** ${health.architectureHealth.score}/100`,
    '',
    '## Dimensions',
    '',
    '| Dimension | Score | Derived |',
    '|-----------|-------|---------|',
  ];
  for (const [key, dim] of Object.entries(health.dimensions)) {
    lines.push(`| ${dim.label} | ${dim.score} | ${dim.derived ? 'yes' : 'no'} |`);
  }
  lines.push('', '## Factor Details', '');
  for (const [key, dim] of Object.entries(health.dimensions)) {
    lines.push(`### ${dim.label}`);
    for (const f of dim.factors) {
      lines.push(`- ${f.factor}: ${JSON.stringify(f.value)} (impact: ${f.impact})`);
    }
    lines.push(`- Data sources: ${dim.dataSources.join(', ')}`);
    lines.push('');
  }
  return lines.join('\n');
}

export function generateComplianceReport() {
  const authorityValidation = validateAuthority();
  const moduleValidation = validateModuleCompliance();
  const lines = [
    '# Compliance Report',
    '',
    '## Authority Self-Check',
    '',
    `**Valid:** ${authorityValidation.valid}`,
    `**Errors:** ${authorityValidation.errors.length}`,
    `**Warnings:** ${authorityValidation.warnings.length}`,
    '',
  ];
  if (authorityValidation.errors.length) {
    lines.push('### Errors', '');
    for (const e of authorityValidation.errors) lines.push(`- ${e}`);
    lines.push('');
  }
  if (authorityValidation.warnings.length) {
    lines.push('### Warnings', '');
    for (const w of authorityValidation.warnings) lines.push(`- ${w}`);
    lines.push('');
  }
  lines.push('## Module Compliance (Duplicate Sources)', '');
  lines.push(`**Compliant:** ${moduleValidation.compliant}`);
  lines.push(`**Violations:** ${moduleValidation.violations.length}`, '');
  for (const v of moduleValidation.violations) {
    lines.push(`- **${v.module}:** ${v.issue} → ${v.recommendation}`);
  }
  return lines.join('\n');
}

export function serializeReportsJson() {
  const state = getAuthorityState();
  return {
    meta: state.meta,
    reports: {
      authority: { summary: generateAuthorityReport() },
      governance: { adrs: getCurrentADR(), rfcs: getCurrentRFC() },
      rules: getCurrentRules(),
      decisions: state.decisionRegistry,
      lifecycle: state.migrationRegistry,
      versions: state.versionRegistry,
      policies: getCurrentPolicies(),
      health: getGovernanceHealth(),
      compliance: {
        authority: validateAuthority(),
        modules: validateModuleCompliance(),
      },
      graph: getAuthorityGraph(),
      capabilities: getCapabilities(),
      constitution: getConstitution(),
    },
  };
}
