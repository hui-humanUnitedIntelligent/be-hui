// src/architecture/authority/api/authorityApi.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Architecture Authority — Public API (ARCH-004)
// Single Source of Architectural Authority.
// ══════════════════════════════════════════════════════════════════════════════

import { buildAuthorityState } from '../registries/registryBuilder.js';
import { buildAuthorityGraph } from '../graph/authorityGraph.js';
import { computeGovernanceHealth } from '../health/governanceHealth.js';
import { STATUS, isBindingStatus } from '../constants/statusModel.js';

/**
 * @returns {object} Vollständiger Authority-State
 */
export function getAuthorityState() {
  return buildAuthorityState();
}

/**
 * Gibt die gültige Constitution zurück.
 */
export function getConstitution() {
  return buildAuthorityState().constitutionRegistry;
}

/**
 * Gibt alle aktuell verbindlichen Regeln zurück.
 */
export function getCurrentRules() {
  return buildAuthorityState().ruleRegistry.filter(r =>
    isBindingStatus(r.status) || r.status === STATUS.EXPERIMENTAL
  );
}

/**
 * Gibt eine Regel anhand ihrer ID zurück.
 * @param {string} id
 */
export function getRule(id) {
  return buildAuthorityState().ruleRegistry.find(r => r.id === id) || null;
}

/**
 * Gibt die Versionshistorie einer Regel zurück.
 * @param {string} id
 */
export function getRuleHistory(id) {
  const rule = getRule(id);
  if (!rule) return null;

  const history = [{ ...rule, event: 'current' }];
  if (rule.predecessor) {
    const pred = getRule(rule.predecessor);
    if (pred) history.unshift({ ...pred, event: 'predecessor' });
  }
  if (rule.supersededBy) {
    const succ = getRule(rule.supersededBy);
    if (succ) history.push({ ...succ, event: 'successor' });
  }

  const versions = buildAuthorityState().versionRegistry.filter(
    v => v.id === id || v.id.startsWith(id)
  );

  return Object.freeze({
    rule: id,
    entries: Object.freeze(history),
    versions: Object.freeze(versions),
  });
}

/**
 * Gibt eine Architekturentscheidung zurück.
 * @param {string} id
 */
export function getDecision(id) {
  return buildAuthorityState().decisionRegistry.find(d => d.id === id) || null;
}

/**
 * Gibt die Historie einer Entscheidung zurück.
 * @param {string} id
 */
export function getDecisionHistory(id) {
  const decision = getDecision(id);
  if (!decision) return null;

  const state = buildAuthorityState();
  const relatedAdr = state.adrRegistry.find(a => a.id === id);
  const relatedRfcs = state.rfcRegistry.filter(r =>
    decision.rfc === r.id || (relatedAdr && r.content?.includes(relatedAdr.id))
  );

  return Object.freeze({
    decision,
    adr: relatedAdr || null,
    relatedRfcs: Object.freeze(relatedRfcs),
    influencedRules: Object.freeze(
      decision.influencedRules.map(rid => getRule(rid)).filter(Boolean)
    ),
  });
}

/**
 * Gibt alle aktiven ADRs zurück.
 */
export function getCurrentADR() {
  return buildAuthorityState().adrRegistry.filter(a =>
    isBindingStatus(a.status) || a.status === STATUS.EXPERIMENTAL
  );
}

/**
 * Gibt alle aktiven RFCs zurück.
 */
export function getCurrentRFC() {
  return buildAuthorityState().rfcRegistry;
}

/**
 * Gibt alle aktiven Policies zurück.
 */
export function getCurrentPolicies() {
  return buildAuthorityState().policyRegistry;
}

/**
 * Gibt alle System-Capabilities zurück.
 */
export function getCapabilities() {
  return buildAuthorityState().capabilityRegistry;
}

/**
 * Gibt den Governance-Graph zurück.
 */
export function getAuthorityGraph() {
  return buildAuthorityGraph();
}

/**
 * Gibt den Lifecycle einer Entität zurück.
 * @param {string} id — Regel-, ADR- oder RFC-ID
 */
export function getLifecycle(id) {
  const state = buildAuthorityState();

  const rule = state.ruleRegistry.find(r => r.id === id);
  if (rule) {
    return Object.freeze({
      type: 'rule',
      id,
      status: rule.status,
      version: rule.version,
      validSince: rule.validSince,
      predecessor: rule.predecessor,
      successor: rule.successor || rule.supersededBy,
      binding: isBindingStatus(rule.status),
    });
  }

  const adr = state.adrRegistry.find(a => a.id === id);
  if (adr) {
    return Object.freeze({
      type: 'adr',
      id,
      status: adr.status,
      phases: adr.phases,
      binding: adr.binding,
    });
  }

  const rfc = state.rfcRegistry.find(r => r.id === id);
  if (rfc) {
    return Object.freeze({
      type: 'rfc',
      id,
      status: rfc.status,
      ratified: rfc.ratified,
      binding: rfc.binding,
    });
  }

  const version = state.versionRegistry.find(v => v.id === id);
  if (version) {
    return Object.freeze({ type: 'version', ...version });
  }

  return null;
}

/**
 * Gibt Governance Health Scores zurück.
 */
export function getGovernanceHealth() {
  return computeGovernanceHealth();
}
