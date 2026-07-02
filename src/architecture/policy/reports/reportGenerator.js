// src/architecture/policy/reports/reportGenerator.js
// ══════════════════════════════════════════════════════════════════════════════
// ARCH-006 — Policy Report Generator
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Generiert alle Policy-Reports.
 * @param {object} evaluation — Ergebnis von evaluateRepository()
 */
export function generateAllPolicyReports(evaluation) {
  return {
    'policy-report.md': generatePolicyReport(evaluation),
    'domain-policy-report.md': generateDomainPolicyReport(evaluation),
    'contract-report.md': generateContractReport(evaluation),
    'policy-health.md': generatePolicyHealthReport(evaluation),
    'policy-violations.md': generatePolicyViolationsReport(evaluation),
    'cross-domain-report.md': generateCrossDomainReport(evaluation),
    'contract-compliance.md': generateContractComplianceReport(evaluation),
    'policy-summary.md': generatePolicySummaryReport(evaluation),
  };
}

export function generatePolicyReport(evaluation) {
  const lines = [
    '# Policy Report — ARCH-006',
    '',
    `**Generiert:** ${evaluation.generatedAt}`,
    `**Version:** ${evaluation.version}`,
    '',
    '## Übersicht',
    '',
    `| Metrik | Wert |`,
    `|---|---|`,
    `| Domain Contracts | ${evaluation.contractCount} |`,
    `| Kompilierte Policies | ${evaluation.policyCount} |`,
    `| Kompilierte Regeln | ${evaluation.ruleCount} |`,
    `| Violations | ${evaluation.violations.length} |`,
    `| CRITICAL | ${evaluation.metrics?.criticalViolations ?? 0} |`,
    `| HIGH | ${evaluation.metrics?.highViolations ?? 0} |`,
    '',
    '## Policy-Quelle',
    '',
    'Alle Regeln stammen ausschließlich aus `docs/governance/domain-contracts.json`.',
    'Keine Hardcodierungen. Keine Spiegelungen.',
    '',
  ];
  return lines.join('\n');
}

export function generateDomainPolicyReport(evaluation) {
  const lines = [
    '# Domain Policy Report — ARCH-006',
    '',
    `**Generiert:** ${evaluation.generatedAt}`,
    '',
    '| Domain | Health | Grade | Violations | CRITICAL | Policies | Rules |',
    '|---|---|---|---|---|---|---|',
  ];

  const domains = evaluation.domainHealth?.domains || {};
  for (const [id, health] of Object.entries(domains)) {
    lines.push(`| ${id} | ${health.overall}% | ${health.grade} | ${health.violationCount} | ${health.criticalCount} | ${health.policyCount} | ${health.ruleCount} |`);
  }

  return lines.join('\n');
}

export function generateContractReport(evaluation) {
  const lines = [
    '# Contract Report — ARCH-006',
    '',
    `**Generiert:** ${evaluation.generatedAt}`,
    '',
    '## Contract Compliance',
    '',
    `Compliance: ${evaluation.policyHealth?.compliancePct ?? 0}%`,
    '',
  ];

  const domains = evaluation.domainHealth?.domains || {};
  for (const [id, health] of Object.entries(domains)) {
    lines.push(`### ${id}`);
    lines.push(`- Contract Compliance: ${health.dimensions?.contractCompliance ?? 0}%`);
    lines.push(`- Policy Compliance: ${health.dimensions?.policyCompliance ?? 0}%`);
    lines.push(`- Dateien: ${health.fileCount}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function generatePolicyHealthReport(evaluation) {
  const ph = evaluation.policyHealth || {};
  const lines = [
    '# Policy Health — ARCH-006',
    '',
    `**Generiert:** ${ph.generatedAt || evaluation.generatedAt}`,
    '',
    `| Metrik | Wert |`,
    `|---|---|`,
    `| Contracts | ${ph.contractCount ?? evaluation.contractCount} |`,
    `| Policies | ${ph.policyCount ?? evaluation.policyCount} |`,
    `| Rules | ${ph.ruleCount ?? evaluation.ruleCount} |`,
    `| Violations | ${ph.violationCount ?? evaluation.violations.length} |`,
    `| CRITICAL | ${ph.criticalCount ?? 0} |`,
    `| Blocking | ${ph.blockingCount ?? 0} |`,
    `| Block Merge | ${ph.blockMerge ? '❌ JA' : '✅ NEIN'} |`,
    `| Compliance | ${ph.compliancePct ?? 0}% |`,
    '',
    '## Domain Health',
    '',
    `Gesamt: ${evaluation.domainHealth?.overall?.score ?? 0}% (${evaluation.domainHealth?.overall?.grade ?? 'N/A'})`,
    '',
  ];
  return lines.join('\n');
}

export function generatePolicyViolationsReport(evaluation) {
  const lines = [
    '# Policy Violations — ARCH-006',
    '',
    `**Generiert:** ${evaluation.generatedAt}`,
    `**Gesamt:** ${evaluation.violations.length}`,
    '',
  ];

  const bySeverity = groupBy(evaluation.violations, 'severity');
  for (const [severity, items] of Object.entries(bySeverity)) {
    lines.push(`## ${severity} (${items.length})`);
    lines.push('');
    for (const v of items.slice(0, 20)) {
      lines.push(`- **[${v.domainId}]** \`${v.file}:${v.line}\` — ${v.message}`);
      if (v.explanation?.migration) lines.push(`  - Migration: ${v.explanation.migration}`);
    }
    if (items.length > 20) lines.push(`- ... und ${items.length - 20} weitere`);
    lines.push('');
  }

  return lines.join('\n');
}

export function generateCrossDomainReport(evaluation) {
  const crossDomain = evaluation.violations.filter(v =>
    ['CROSS_DOMAIN_WRITE', 'DOMAIN_IMPORT', 'OWNERSHIP_VIOLATION'].includes(v.type)
  );

  const lines = [
    '# Cross-Domain Report — ARCH-006',
    '',
    `**Generiert:** ${evaluation.generatedAt}`,
    `**Cross-Domain Violations:** ${crossDomain.length}`,
    '',
  ];

  const byType = groupBy(crossDomain, 'type');
  for (const [type, items] of Object.entries(byType)) {
    lines.push(`## ${type} (${items.length})`);
    for (const v of items.slice(0, 15)) {
      lines.push(`- [${v.domainId}] ${v.file}: ${v.message}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function generateContractComplianceReport(evaluation) {
  const lines = [
    '# Contract Compliance — ARCH-006',
    '',
    `**Generiert:** ${evaluation.generatedAt}`,
    '',
  ];

  const domains = evaluation.domainHealth?.domains || {};
  for (const [id, health] of Object.entries(domains)) {
    const dims = health.dimensions || {};
    lines.push(`## ${id} — ${health.overall}% (${health.grade})`);
    lines.push('');
    lines.push('| Dimension | Score |');
    lines.push('|---|---|');
    for (const [dim, score] of Object.entries(dims)) {
      lines.push(`| ${dim} | ${score}% |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function generatePolicySummaryReport(evaluation) {
  const lines = [
    '# Policy Summary — ARCH-006',
    '',
    `**Generiert:** ${evaluation.generatedAt}`,
    `**Scan-Dauer:** ${evaluation.durationMs}ms`,
    '',
    '## Ergebnis',
    '',
    `- **Contracts:** ${evaluation.contractCount} Domains`,
    `- **Policies:** ${evaluation.policyCount} kompiliert`,
    `- **Rules:** ${evaluation.ruleCount} generiert`,
    `- **Violations:** ${evaluation.violations.length}`,
    `- **Domain Health:** ${evaluation.domainHealth?.overall?.score ?? 0}%`,
    `- **Policy Compliance:** ${evaluation.policyHealth?.compliancePct ?? 0}%`,
    `- **Merge blockieren:** ${evaluation.policyHealth?.blockMerge ? 'JA' : 'NEIN'}`,
    '',
    '## Architektur-Flow',
    '',
    '```',
    'Authority → Policy Engine → Domain Contracts',
    'Scanner   → Policy Engine → Domain Contracts',
    'Intelligence → Policy Engine → Domain Contracts',
    '```',
    '',
  ];
  return lines.join('\n');
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key] || 'UNKNOWN';
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

/**
 * Serialisiert JSON-Artefakte.
 * @param {object} evaluation
 */
export function serializePolicyJson(evaluation) {
  const state = evaluation;
  return {
    'policy.json': JSON.stringify({
      version: state.version,
      generatedAt: state.generatedAt,
      contractCount: state.contractCount,
      policyCount: state.policyCount,
      ruleCount: state.ruleCount,
    }, null, 2),
    'contracts.json': JSON.stringify(state.contracts || {}, null, 2),
    'compiled-policies.json': JSON.stringify(
      (state.policies || []).map(p => ({ id: p.id, type: p.type, domainId: p.domainId })),
      null, 2
    ),
    'compiled-rules.json': JSON.stringify(
      (state.rules || []).map(r => ({ id: r.id, type: r.type, domainId: r.domainId, severity: r.severity })),
      null, 2
    ),
    'policy-health.json': JSON.stringify(state.policyHealth || {}, null, 2),
    'policy-violations.json': JSON.stringify(state.violations || [], null, 2),
    'domain-health.json': JSON.stringify(state.domainHealth || {}, null, 2),
  };
}
