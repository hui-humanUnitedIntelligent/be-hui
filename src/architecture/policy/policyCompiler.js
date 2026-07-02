// src/architecture/policy/policyCompiler.js
// ══════════════════════════════════════════════════════════════════════════════
// ARCH-006 — Policy Compiler
// Erzeugt automatisch alle Policy-Typen aus Domain Contracts.
// ══════════════════════════════════════════════════════════════════════════════

import { loadContracts } from './contractLoader.js';

/** @type {import('./types.js').PolicyType[]} */
const POLICY_TYPES = [
  'ownership', 'import', 'realtime', 'layer', 'service', 'context',
  'table', 'event', 'hook', 'ui', 'core', 'scanner', 'migration',
];

/**
 * Kompiliert alle Policies aus Domain Contracts.
 * @param {{ force?: boolean }} [options]
 * @returns {import('./types.js').CompiledPolicy[]}
 */
export function compilePolicies(options = {}) {
  const contracts = loadContracts(options);
  const policies = [];

  for (const contract of contracts.domains) {
    policies.push(...compileDomainPolicies(contract));
  }

  return Object.freeze(policies);
}

/**
 * Kompiliert Policies für eine einzelne Domain.
 * @param {import('./types.js').DomainContract} contract
 */
export function compileDomainPolicies(contract) {
  const constitutionRefs = contract.constitution?.rules || [];
  const adrRefs = contract.constitution?.adrs || [];
  const rfcRefs = contract.constitution?.rfcs || [];
  const base = { domainId: contract.id, contractVersion: contract.version, constitutionRefs, adrRefs, rfcRefs };

  return [
  {
    ...base,
    id: `${contract.id}-POLICY-OWNERSHIP`,
    type: 'ownership',
    description: `Ownership-Policy für ${contract.label}`,
    spec: {
      services: contract.ownership?.services || [],
      contexts: contract.ownership?.contexts || [],
      hooks: contract.ownership?.hooks || [],
      components: contract.ownership?.components || [],
      pages: contract.ownership?.pages || [],
      invariants: contract.constitution?.invariants || [],
    },
  },
  {
    ...base,
    id: `${contract.id}-POLICY-IMPORT`,
    type: 'import',
    description: `Import-Policy für ${contract.label}`,
    spec: {
      mayDependOn: contract.dependencies?.mayDependOn || [],
      mayBeDependedOnBy: contract.dependencies?.mayBeDependedOnBy || [],
      forbiddenCycles: contract.dependencies?.forbiddenCycles || [],
      importMatrix: contract.dependencies?.importMatrix || { allowed: [], forbidden: [] },
    },
  },
  {
    ...base,
    id: `${contract.id}-POLICY-REALTIME`,
    type: 'realtime',
    description: `Realtime-Policy für ${contract.label}`,
    spec: {
      channels: contract.realtime?.channels || [],
      presenceAllowed: contract.realtime?.presenceAllowed || [],
    },
  },
  {
    ...base,
    id: `${contract.id}-POLICY-LAYER`,
    type: 'layer',
    description: `Layer-Policy für ${contract.label}`,
    spec: {
      allowed: contract.layers?.allowed || [],
      forbidden: contract.layers?.forbidden || [],
    },
  },
  {
    ...base,
    id: `${contract.id}-POLICY-SERVICE`,
    type: 'service',
    description: `Service-Policy für ${contract.label}`,
    spec: {
      publicApi: contract.publicApi?.services || [],
      ownedServices: contract.ownership?.services || [],
    },
  },
  {
    ...base,
    id: `${contract.id}-POLICY-CONTEXT`,
    type: 'context',
    description: `Context-Policy für ${contract.label}`,
    spec: {
      contexts: contract.ownership?.contexts || [],
    },
  },
  {
    ...base,
    id: `${contract.id}-POLICY-TABLE`,
    type: 'table',
    description: `Table-Policy für ${contract.label}`,
    spec: {
      owned: contract.data?.owned || [],
      readOnly: contract.data?.readOnly || [],
      neverWrite: contract.data?.neverWrite || [],
    },
  },
  {
    ...base,
    id: `${contract.id}-POLICY-EVENT`,
    type: 'event',
    description: `Event-Policy für ${contract.label}`,
    spec: {
      publishes: contract.events?.publishes || [],
      consumes: contract.events?.consumes || [],
      forbidden: contract.events?.forbidden || [],
    },
  },
  {
    ...base,
    id: `${contract.id}-POLICY-HOOK`,
    type: 'hook',
    description: `Hook-Policy für ${contract.label}`,
    spec: {
      hooks: contract.ownership?.hooks || [],
    },
  },
  {
    ...base,
    id: `${contract.id}-POLICY-UI`,
    type: 'ui',
    description: `UI-Policy für ${contract.label}`,
    spec: {
      components: contract.ownership?.components || [],
      pages: contract.ownership?.pages || [],
      forbiddenLayers: contract.layers?.forbidden || [],
    },
  },
  {
    ...base,
    id: `${contract.id}-POLICY-CORE`,
    type: 'core',
    description: `Core-Policy für ${contract.label}`,
    spec: {
      ownedTables: contract.data?.owned || [],
      invariants: (contract.constitution?.invariants || []).filter(i =>
        /core|engine|unidirektional|truth/i.test(i)
      ),
      neverWrite: contract.data?.neverWrite || [],
    },
  },
  {
    ...base,
    id: `${contract.id}-POLICY-SCANNER`,
    type: 'scanner',
    description: `Scanner-Policy für ${contract.label}`,
    spec: {
      rules: contract.scannerRules || [],
    },
  },
  {
    ...base,
    id: `${contract.id}-POLICY-MIGRATION`,
    type: 'migration',
    description: `Migration-Policy für ${contract.label}`,
    spec: {
      migration: contract.migration || {},
      intelligence: contract.intelligence?.recommendations || [],
    },
  },
  ];
}

/**
 * Gibt Policies für eine Domain zurück.
 * @param {string} domainId
 */
export function getPoliciesForDomain(domainId) {
  return compilePolicies().filter(p => p.domainId === domainId);
}

/**
 * Gibt eine Policy nach ID zurück.
 * @param {string} policyId
 */
export function getPolicy(policyId) {
  const policy = compilePolicies().find(p => p.id === policyId);
  if (!policy) throw new Error(`Policy nicht gefunden: ${policyId}`);
  return policy;
}

export { POLICY_TYPES };
