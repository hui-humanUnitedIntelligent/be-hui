// src/architecture/authority/health/governanceHealth.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Authority — Governance Health (ARCH-004)
// Multi-dimensionale Health-Berechnung mit dokumentierten Faktoren.
// ══════════════════════════════════════════════════════════════════════════════

import { buildAuthorityState } from '../registries/registryBuilder.js';
import { readGeneratedJson } from '../loader/documentLoader.js';
import { STATUS, isBindingStatus } from '../constants/statusModel.js';

/**
 * Berechnet alle Governance-Health-Dimensionen.
 * Jeder Score dokumentiert Faktoren und Datenquellen.
 */
export function computeGovernanceHealth() {
  const state = buildAuthorityState();
  const metrics = state.metrics || readGeneratedJson('metrics.json') || {};
  const violations = readGeneratedJson('violations.json') || [];

  const dimensions = {
    constitutionHealth:     computeConstitutionHealth(state),
    governanceHealth:       computeGovernanceProcessHealth(state),
    layerHealth:            computeLayerHealth(metrics, violations),
    ownershipHealth:        computeOwnershipHealth(metrics),
    coreHealth:             computeCoreHealth(metrics),
    domainHealth:           computeDomainHealth(metrics, state),
    capabilityHealth:       computeCapabilityHealth(state),
    dependencyHealth:       computeDependencyHealth(metrics, violations),
    securityHealth:         computeSecurityHealth(violations),
    maintainabilityHealth:  computeMaintainabilityHealth(metrics, violations),
    documentationHealth:    computeDocumentationHealth(state),
  };

  const scores = Object.values(dimensions).map(d => d.score);
  const architectureHealth = {
    score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    label: 'Architecture Health (aggregiert)',
    factors: Object.keys(dimensions).map(k => ({
      dimension: k,
      score: dimensions[k].score,
      weight: 1 / scores.length,
    })),
    dataSources: ['ARCH-004 Authority', 'docs/generated/metrics.json', 'docs/generated/violations.json'],
    derived: true,
  };

  return Object.freeze({
    computedAt: new Date().toISOString(),
    authority: 'ARCH-004',
    dimensions: Object.freeze(dimensions),
    architectureHealth: Object.freeze(architectureHealth),
  });
}

function computeConstitutionHealth(state) {
  const factors = [];
  let score = 100;

  const constitution = state.constitutionRegistry;
  if (!constitution) {
    return healthResult('Constitution Health', 0, ['HUI_CONSTITUTION.md nicht gefunden'], ['HUI_CONSTITUTION.md']);
  }

  factors.push({ factor: 'Constitution vorhanden', value: true, impact: 0 });
  if (!isBindingStatus(constitution.status)) {
    score -= 30;
    factors.push({ factor: 'Constitution nicht ratifiziert', value: constitution.status, impact: -30 });
  }
  factors.push({ factor: 'Goldene Regeln geladen', value: constitution.goldenRules.length, expected: 10, impact: constitution.goldenRules.length < 10 ? -10 : 0 });
  if (constitution.goldenRules.length < 10) score -= 10;
  factors.push({ factor: 'Grundpfeiler geladen', value: constitution.pillars.length, expected: 5, impact: constitution.pillars.length < 5 ? -10 : 0 });
  if (constitution.pillars.length < 5) score -= 10;

  return healthResult('Constitution Health', clamp(score), factors, ['HUI_CONSTITUTION.md']);
}

function computeGovernanceProcessHealth(state) {
  let score = 100;
  const factors = [];

  const adrs = state.adrRegistry;
  const rfcs = state.rfcRegistry;
  factors.push({ factor: 'ADRs registriert', value: adrs.length, impact: 0 });
  factors.push({ factor: 'RFCs registriert', value: rfcs.length, impact: 0 });

  const nonRatified = rfcs.filter(r => !r.ratified && r.status === STATUS.DRAFT);
  if (nonRatified.length > 0) {
    score -= nonRatified.length * 5;
    factors.push({ factor: 'Nicht ratifizierte RFCs', value: nonRatified.map(r => r.id), impact: -nonRatified.length * 5 });
  }

  const bindingAdrs = adrs.filter(a => a.binding).length;
  factors.push({ factor: 'Verbindliche ADRs', value: bindingAdrs, total: adrs.length, impact: 0 });

  return healthResult('Governance Health', clamp(score), factors, ['docs/governance/', 'ARCH-004 Authority']);
}

function computeLayerHealth(metrics, violations) {
  let score = 100;
  const factors = [];
  const layerViolations = violations.filter(v => v.type === 'LAYER_VIOLATION').length;
  const total = metrics.totalViolations || 1;
  const layerPct = (layerViolations / total) * 100;

  score -= Math.min(50, layerViolations * 2);
  factors.push({ factor: 'Layer Violations', value: layerViolations, impact: -Math.min(50, layerViolations * 2) });
  factors.push({ factor: 'Layer Violation Anteil', value: `${layerPct.toFixed(1)}%`, impact: 0 });

  return healthResult('Layer Health', clamp(score), factors, ['docs/generated/violations.json', 'RFC-000']);
}

function computeOwnershipHealth(metrics) {
  let score = 100;
  const factors = [];
  const coverage = metrics.ownershipCoveragePct ?? 0;
  const duplicateOwners = metrics.duplicateOwners ?? 0;

  score -= (100 - coverage);
  factors.push({ factor: 'Ownership Header Coverage', value: `${coverage}%`, impact: -(100 - coverage) });
  score -= duplicateOwners * 3;
  factors.push({ factor: 'Duplicate Table Owners', value: duplicateOwners, impact: -duplicateOwners * 3 });

  return healthResult('Ownership Health', clamp(score), factors, ['docs/generated/metrics.json', 'docs/SYSTEM_OWNERSHIP.md']);
}

function computeCoreHealth(metrics) {
  let score = 100;
  const factors = [];
  const corePct = metrics.coreEnginePct ?? 0;
  const critical = metrics.criticalViolations ?? 0;

  score -= (100 - corePct);
  factors.push({ factor: 'Core Engine Adoption', value: `${corePct}%`, impact: -(100 - corePct) });
  score -= critical * 2;
  factors.push({ factor: 'Critical Violations (Core Bypass)', value: critical, impact: -critical * 2 });

  return healthResult('Core Health', clamp(score), factors, ['docs/generated/metrics.json']);
}

function computeDomainHealth(metrics, state) {
  let score = 100;
  const factors = [];
  const byDomain = metrics.byDomain || {};
  const unknownFiles = byDomain.UNKNOWN?.files ?? 0;

  if (unknownFiles > 0) {
    score -= unknownFiles * 5;
    factors.push({ factor: 'Unklassifizierte Dateien', value: unknownFiles, impact: -unknownFiles * 5 });
  }
  factors.push({ factor: 'Registrierte Domains', value: Object.keys(state.domainRegistry).length, impact: 0 });

  return healthResult('Domain Health', clamp(score), factors, ['docs/generated/metrics.json', 'ARCH-004 domainRegistry']);
}

function computeCapabilityHealth(state) {
  let score = 100;
  const factors = [];
  const caps = state.capabilityRegistry;
  factors.push({ factor: 'Capabilities registriert', value: caps.length, impact: 0 });

  const withoutOwner = caps.filter(c => !c.owner).length;
  if (withoutOwner > 0) {
    score -= withoutOwner * 10;
    factors.push({ factor: 'Capabilities ohne Owner', value: withoutOwner, impact: -withoutOwner * 10 });
  }

  return healthResult('Capability Health', clamp(score), factors, ['docs/SYSTEM_OWNERSHIP.md', 'ARCH-004 capabilityRegistry']);
}

function computeDependencyHealth(metrics, violations) {
  let score = 100;
  const factors = [];
  const high = metrics.highViolations ?? 0;
  const crossDomain = metrics.crossDomainWrites ?? 0;

  score -= Math.min(40, high);
  factors.push({ factor: 'HIGH Violations', value: high, impact: -Math.min(40, high) });
  score -= crossDomain * 5;
  factors.push({ factor: 'Cross-Domain Writes', value: crossDomain, impact: -crossDomain * 5 });

  return healthResult('Dependency Health', clamp(score), factors, ['docs/generated/metrics.json', 'docs/generated/violations.json']);
}

function computeSecurityHealth(violations) {
  let score = 100;
  const factors = [];
  const dbWrites = violations.filter(v => v.type === 'DB_DIRECT_WRITE').length;
  const coreBypass = violations.filter(v => v.type === 'CORE_BYPASS').length;

  score -= dbWrites;
  factors.push({ factor: 'DB Direct Writes in UI', value: dbWrites, impact: -dbWrites });
  score -= coreBypass * 3;
  factors.push({ factor: 'Core Bypass', value: coreBypass, impact: -coreBypass * 3 });

  return healthResult('Security Health', clamp(score), factors, ['docs/generated/violations.json']);
}

function computeMaintainabilityHealth(metrics, violations) {
  let score = 100;
  const factors = [];
  const total = metrics.totalViolations ?? 0;
  const files = metrics.totalFiles ?? 1;
  const violationDensity = (total / files) * 100;

  score -= Math.min(50, violationDensity * 5);
  factors.push({ factor: 'Violation Density', value: `${violationDensity.toFixed(2)}/100 files`, impact: -Math.min(50, violationDensity * 5) });
  factors.push({ factor: 'Total Violations', value: total, impact: 0 });

  return healthResult('Maintainability Health', clamp(score), factors, ['docs/generated/metrics.json']);
}

function computeDocumentationHealth(state) {
  let score = 100;
  const factors = [];

  const docs = [
    state.constitutionRegistry,
    ...state.adrRegistry,
    ...state.rfcRegistry,
    ...state.policyRegistry,
  ].filter(Boolean);

  factors.push({ factor: 'Governance-Dokumente', value: docs.length, impact: 0 });

  const missingContent = state.adrRegistry.filter(a => !a.content || a.content.length < 100);
  if (missingContent.length > 0) {
    score -= missingContent.length * 15;
    factors.push({ factor: 'Unvollständige ADRs', value: missingContent.map(a => a.id), impact: -missingContent.length * 15 });
  }

  return healthResult('Documentation Health', clamp(score), factors, ['docs/governance/', 'HUI_CONSTITUTION.md']);
}

function healthResult(label, score, factors, dataSources) {
  return Object.freeze({
    label,
    score: clamp(score),
    factors: Object.freeze(factors),
    dataSources: Object.freeze(dataSources),
    derived: dataSources.some(s => s.includes('generated')),
  });
}

function clamp(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}
