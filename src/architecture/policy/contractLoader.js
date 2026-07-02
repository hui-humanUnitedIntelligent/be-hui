// src/architecture/policy/contractLoader.js
// ══════════════════════════════════════════════════════════════════════════════
// ARCH-006 — Contract Loader
// Lädt ausschließlich aus docs/governance/domain-contracts.json.
// Keine Hardcodierungen. Keine Spiegelungen. Keine Konstanten im Code.
// ══════════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = join(__dirname, '../../..');
export const CONTRACTS_PATH = join(PROJECT_ROOT, 'docs/governance/domain-contracts.json');

let _cache = null;

/**
 * Lädt Domain Contracts aus der kanonischen JSON-Quelle.
 * @param {{ force?: boolean }} [options]
 * @returns {import('./types.js').ContractsDocument}
 */
export function loadContracts(options = {}) {
  if (_cache && !options.force) return _cache;

  const raw = readFileSync(CONTRACTS_PATH, 'utf8');
  const parsed = JSON.parse(raw);

  if (!parsed?.domains?.length) {
    throw new Error(`Ungültige Domain Contracts: ${CONTRACTS_PATH}`);
  }

  _cache = Object.freeze({
    meta: Object.freeze({ ...parsed.meta }),
    domains: Object.freeze(parsed.domains.map(d => Object.freeze({ ...d }))),
    byId: Object.freeze(
      Object.fromEntries(parsed.domains.map(d => [d.id, Object.freeze({ ...d })]))
    ),
    loadedAt: new Date().toISOString(),
    source: CONTRACTS_PATH,
  });

  return _cache;
}

/**
 * Gibt einen einzelnen Domain Contract zurück.
 * @param {string} domainId
 */
export function getContract(domainId) {
  const contracts = loadContracts();
  const contract = contracts.byId[domainId];
  if (!contract) {
    throw new Error(`Domain Contract nicht gefunden: ${domainId}`);
  }
  return contract;
}

/**
 * Gibt alle Domain Contracts zurück.
 */
export function getAllContracts() {
  return loadContracts().domains;
}

/** Cache invalidieren */
export function invalidateContractCache() {
  _cache = null;
}
