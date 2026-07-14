// src/architecture/policy/ruleCompiler.js
// ══════════════════════════════════════════════════════════════════════════════
// ARCH-006 — Rule Compiler
// Generiert Scanner-Regeln ausschließlich aus kompilierten Policies.
// ══════════════════════════════════════════════════════════════════════════════

import { compilePolicies } from './policyCompiler.js';

/** Mapping von Contract-Scanner-Regel-Präfixen zu kanonischen Regeltypen */
const RULE_TYPE_MAP = {
  CORE_BYPASS: 'CORE_WRITE',
  WIRKUNG_BYPASS: 'CORE_WRITE',
  CROSS_DOMAIN: 'CROSS_DOMAIN_WRITE',
  CROSS_DOMAIN_WRITE: 'CROSS_DOMAIN_WRITE',
  DB_DIRECT_WRITE: 'WORLD_DB_WRITE',
  DB_WRITE: 'WORLD_DB_WRITE',
  DB_DIRECT_READ: 'DOMAIN_TABLE_OWNER',
  DUPLICATE_OWNER: 'OWNERSHIP_VIOLATION',
  LAYER: 'DOMAIN_LAYER',
  LAYER_VIOLATION: 'DOMAIN_LAYER',
  DIRECT_ROUTING: 'PAGE_BYPASS',
  REGISTRY_BYPASS: 'COMPONENT_BYPASS',
  MISSING_HEADER: 'CONTRACT_VIOLATION',
  UI_IMPACT_LOGIC: 'COMPONENT_BYPASS',
  UI_EXPOSURE: 'COMPONENT_BYPASS',
  ORB_REALTIME: 'DOMAIN_REALTIME',
  REALTIME: 'DOMAIN_REALTIME',
  PRESENCE_GAMIFICATION: 'EVENT_ABUSE',
  GAMIFICATION: 'EVENT_ABUSE',
  INFINITE_SCROLL: 'EVENT_ABUSE',
  ATTENTION_MAX: 'EVENT_ABUSE',
  PUBLIC_SCORE: 'EVENT_ABUSE',
  AGGREGATOR: 'STUDIO_AGGREGATOR',
  LEGACY: 'SERVICE_BYPASS',
};

const SEVERITY_BY_TYPE = {
  CORE_WRITE: 'CRITICAL',
  CROSS_DOMAIN_WRITE: 'CRITICAL',
  WORLD_DB_WRITE: 'HIGH',
  OWNERSHIP_VIOLATION: 'HIGH',
  DOMAIN_LAYER: 'HIGH',
  DOMAIN_IMPORT: 'HIGH',
  DOMAIN_EVENT: 'HIGH',
  DOMAIN_REALTIME: 'HIGH',
  DOMAIN_CONTEXT: 'MEDIUM',
  DOMAIN_TABLE_OWNER: 'MEDIUM',
  SERVICE_BYPASS: 'HIGH',
  HOOK_BYPASS: 'MEDIUM',
  PAGE_BYPASS: 'HIGH',
  COMPONENT_BYPASS: 'LOW',
  EVENT_ABUSE: 'HIGH',
  INTELLIGENCE_WRITE: 'HIGH',
  STUDIO_AGGREGATOR: 'MEDIUM',
  CONTRACT_VIOLATION: 'CRITICAL',
};

/**
 * Kompiliert alle Scanner-Regeln aus Policies.
 * @param {{ force?: boolean }} [options]
 * @returns {import('./types.js').CompiledRule[]}
 */
export function compileRules(options = {}) {
  const policies = compilePolicies(options);
  const rules = [];

  for (const policy of policies) {
    rules.push(...compileRulesFromPolicy(policy));
  }

  return Object.freeze(dedupeRules(rules));
}

function compileRulesFromPolicy(policy) {
  const rules = [];
  const base = {
    domainId: policy.domainId,
    policyId: policy.id,
    constitutionRefs: policy.constitutionRefs,
    adrRefs: policy.adrRefs,
    rfcRefs: policy.rfcRefs,
    enforceable: true,
  };

  switch (policy.type) {
    case 'table':
      rules.push(...compileTableRules(policy, base));
      break;
    case 'import':
      rules.push(...compileImportRules(policy, base));
      break;
    case 'ownership':
      rules.push(...compileOwnershipRules(policy, base));
      break;
    case 'layer':
      rules.push(...compileLayerRules(policy, base));
      break;
    case 'event':
      rules.push(...compileEventRules(policy, base));
      break;
    case 'realtime':
      rules.push(...compileRealtimeRules(policy, base));
      break;
    case 'context':
      rules.push(...compileContextRules(policy, base));
      break;
    case 'service':
      rules.push(...compileServiceRules(policy, base));
      break;
    case 'hook':
      rules.push(...compileHookRules(policy, base));
      break;
    case 'ui':
      rules.push(...compileUiRules(policy, base));
      break;
    case 'core':
      rules.push(...compileCoreRules(policy, base));
      break;
    case 'scanner':
      rules.push(...compileScannerPolicyRules(policy, base));
      break;
    case 'migration':
      rules.push(...compileMigrationRules(policy, base));
      break;
    default:
      break;
  }

  return rules;
}

function compileTableRules(policy, base) {
  const rules = [];
  const { owned, neverWrite } = policy.spec;

  for (const table of owned) {
    rules.push({
      ...base,
      id: `${policy.domainId}-RULE-TABLE-OWNER-${table}`,
      type: 'DOMAIN_TABLE_OWNER',
      severity: 'HIGH',
      description: `Tabelle '${table}' gehört Domain ${policy.domainId}`,
      check: { kind: 'table-owner', table, ownerDomain: policy.domainId },
    });
  }

  for (const table of neverWrite) {
    rules.push({
      ...base,
      id: `${policy.domainId}-RULE-NEVER-WRITE-${table}`,
      type: 'CROSS_DOMAIN_WRITE',
      severity: 'CRITICAL',
      description: `Domain ${policy.domainId} darf '${table}' nicht schreiben`,
      check: { kind: 'never-write', table, domainId: policy.domainId },
    });
  }

  return rules;
}

function compileImportRules(policy, base) {
  const rules = [];
  const { forbidden = [], allowed = [] } = policy.spec.importMatrix || {};

  for (const target of forbidden) {
    if (target === '*') continue;
    rules.push({
      ...base,
      id: `${policy.domainId}-RULE-IMPORT-FORBIDDEN-${target}`,
      type: 'DOMAIN_IMPORT',
      severity: 'HIGH',
      description: `Import ${policy.domainId} → ${target} verboten`,
      check: { kind: 'import-forbidden', sourceDomain: policy.domainId, targetDomain: target },
    });
  }

  if (allowed.length > 0 && !allowed.includes('*')) {
    rules.push({
      ...base,
      id: `${policy.domainId}-RULE-IMPORT-MATRIX`,
      type: 'DOMAIN_IMPORT',
      severity: 'HIGH',
      description: `Import-Matrix für ${policy.domainId}`,
      check: { kind: 'import-matrix', sourceDomain: policy.domainId, allowed, forbidden },
    });
  }

  return rules;
}

function compileOwnershipRules(policy, base) {
  return [{
    ...base,
    id: `${policy.domainId}-RULE-OWNERSHIP`,
    type: 'OWNERSHIP_VIOLATION',
    severity: 'HIGH',
    description: `Single Ownership für ${policy.domainId}`,
    check: { kind: 'ownership', domainId: policy.domainId, spec: policy.spec },
  }];
}

function compileLayerRules(policy, base) {
  const forbidden = policy.spec.forbidden || [];
  if (!forbidden.length) return [];

  return [{
    ...base,
    id: `${policy.domainId}-RULE-LAYER`,
    type: 'DOMAIN_LAYER',
    severity: 'HIGH',
    description: `Layer-Policy für ${policy.domainId}: verboten: ${forbidden.join(', ')}`,
    check: { kind: 'layer', domainId: policy.domainId, forbidden },
  }];
}

function compileEventRules(policy, base) {
  const rules = [];
  for (const event of policy.spec.forbidden || []) {
    rules.push({
      ...base,
      id: `${policy.domainId}-RULE-EVENT-FORBIDDEN-${event.replace(/[^a-zA-Z0-9]/g, '_')}`,
      type: 'EVENT_ABUSE',
      severity: 'HIGH',
      description: `Event '${event}' verboten in ${policy.domainId}`,
      check: { kind: 'event-forbidden', event, domainId: policy.domainId },
    });
  }
  return rules;
}

function compileRealtimeRules(policy, base) {
  const channels = policy.spec.channels || [];
  if (!channels.length) return [];

  return [{
    ...base,
    id: `${policy.domainId}-RULE-REALTIME`,
    type: 'DOMAIN_REALTIME',
    severity: 'MEDIUM',
    description: `Realtime-Channels für ${policy.domainId}`,
    check: { kind: 'realtime', domainId: policy.domainId, channels },
  }];
}

function compileContextRules(policy, base) {
  const contexts = policy.spec.contexts || [];
  if (!contexts.length) return [];

  return [{
    ...base,
    id: `${policy.domainId}-RULE-CONTEXT`,
    type: 'DOMAIN_CONTEXT',
    severity: 'MEDIUM',
    description: `Context-Ownership für ${policy.domainId}`,
    check: { kind: 'context', domainId: policy.domainId, contexts },
  }];
}

function compileServiceRules(policy, base) {
  const services = policy.spec.ownedServices || [];
  if (!services.length) return [];

  return [{
    ...base,
    id: `${policy.domainId}-RULE-SERVICE`,
    type: 'SERVICE_BYPASS',
    severity: 'HIGH',
    description: `Service-Bypass-Prüfung für ${policy.domainId}`,
    check: { kind: 'service', domainId: policy.domainId, services },
  }];
}

function compileHookRules(policy, base) {
  const hooks = policy.spec.hooks || [];
  if (!hooks.length) return [];

  return [{
    ...base,
    id: `${policy.domainId}-RULE-HOOK`,
    type: 'HOOK_BYPASS',
    severity: 'MEDIUM',
    description: `Hook-Ownership für ${policy.domainId}`,
    check: { kind: 'hook', domainId: policy.domainId, hooks },
  }];
}

function compileUiRules(policy, base) {
  const forbiddenLayers = policy.spec.forbiddenLayers || [];
  if (!forbiddenLayers.includes('Presentation')) return [];

  return [{
    ...base,
    id: `${policy.domainId}-RULE-UI`,
    type: 'COMPONENT_BYPASS',
    severity: 'LOW',
    description: `UI-Policy für ${policy.domainId}`,
    check: { kind: 'ui', domainId: policy.domainId, forbiddenLayers },
  }];
}

function compileCoreRules(policy, base) {
  const ownedTables = policy.spec.ownedTables || [];
  if (!ownedTables.length) return [];

  return [{
    ...base,
    id: `${policy.domainId}-RULE-CORE`,
    type: 'CORE_WRITE',
    severity: 'CRITICAL',
    description: `Core-Tabellen nur via Engine in ${policy.domainId}`,
    check: { kind: 'core-write', domainId: policy.domainId, tables: ownedTables },
  }];
}

function compileScannerPolicyRules(policy, base) {
  const rules = [];
  for (const sr of policy.spec.rules || []) {
    const prefix = sr.rule.split(':')[0].trim();
    const ruleType = RULE_TYPE_MAP[prefix] || 'CONTRACT_VIOLATION';
    const severity = SEVERITY_BY_TYPE[ruleType] || 'MEDIUM';

    rules.push({
      ...base,
      id: sr.id || `${policy.domainId}-RULE-SCANNER-${prefix}`,
      type: ruleType,
      severity,
      description: sr.rule,
      enforceable: sr.enforceable !== false,
      check: { kind: 'scanner-rule', scannerRuleId: sr.id, ruleText: sr.rule, prefix },
      contractRuleRef: sr.id,
    });
  }
  return rules;
}

function compileMigrationRules(policy, base) {
  const recommendations = policy.spec.intelligence || [];
  if (!recommendations.length) return [];

  return [{
    ...base,
    id: `${policy.domainId}-RULE-MIGRATION`,
    type: 'CONTRACT_VIOLATION',
    severity: 'INFO',
    enforceable: false,
    description: `Migration-Empfehlungen für ${policy.domainId}`,
    check: { kind: 'migration', domainId: policy.domainId, recommendations },
  }];
}

function dedupeRules(rules) {
  const seen = new Map();
  for (const rule of rules) {
    if (!seen.has(rule.id)) seen.set(rule.id, rule);
  }
  return [...seen.values()];
}

/**
 * Gibt Regeln für eine Domain zurück.
 * @param {string} domainId
 */
export function getRulesForDomain(domainId) {
  return compileRules().filter(r => r.domainId === domainId);
}

/**
 * Gibt eine Regel nach ID zurück.
 * @param {string} ruleId
 */
export function getRule(ruleId) {
  const rule = compileRules().find(r => r.id === ruleId);
  if (!rule) throw new Error(`Regel nicht gefunden: ${ruleId}`);
  return rule;
}

export { RULE_TYPE_MAP, SEVERITY_BY_TYPE };
