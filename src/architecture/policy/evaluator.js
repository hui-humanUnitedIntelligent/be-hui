// src/architecture/policy/evaluator.js
// ══════════════════════════════════════════════════════════════════════════════
// ARCH-006 — Policy Evaluator
// Evaluiert Scan-Ergebnisse gegen kompilierte Domain-Regeln.
// ══════════════════════════════════════════════════════════════════════════════

import { resolve, dirname } from 'path';
import { compileRules } from './ruleCompiler.js';
import { resolveDomainForFile, isDomainImportAllowed } from './domainResolver.js';
import { getContract } from './contractLoader.js';
import { enrichViolation } from './explanationEngine.js';

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };

/**
 * Evaluiert alle Dateien gegen kompilierte Regeln.
 * @param {Map<string, object>} scanResults
 * @param {import('./types.js').CompiledRule[]} [rules]
 */
export function evaluateScanResults(scanResults, rules = compileRules()) {
  const violations = [];
  const allResults = [...scanResults.values()].filter(Boolean);
  const tableWriters = buildTableWriterMap(allResults);

  for (const result of allResults) {
    const domainId = resolveDomainForFile(result.path);
    violations.push(...evaluateFileResult(result, domainId, scanResults, rules));
  }

  violations.push(...evaluateTableOwnership(tableWriters, rules));
  violations.push(...evaluateCrossDomainWrites(allResults, rules));

  const enriched = violations.map(v => enrichViolation(v));
  return enriched.sort((a, b) =>
    (SEVERITY_ORDER[a.severity] ?? 5) - (SEVERITY_ORDER[b.severity] ?? 5)
  );
}

/**
 * Evaluiert eine einzelne Datei.
 * @param {object} fileResult
 * @param {Map<string, object>} [scanResults]
 */
export function evaluateFileResult(fileResult, domainId, scanResults, rules = compileRules()) {
  const violations = [];
  const domainRules = rules.filter(r => r.domainId === domainId || isGlobalRule(r));

  for (const rule of domainRules) {
    violations.push(...applyRule(rule, fileResult, domainId, scanResults));
  }

  // Import-Regeln für alle Domains prüfen
  violations.push(...evaluateImports(fileResult, domainId, scanResults));

  return violations;
}

function isGlobalRule(rule) {
  return ['OWNERSHIP_VIOLATION', 'CROSS_DOMAIN_WRITE'].includes(rule.type);
}

function applyRule(rule, result, domainId, scanResults) {
  const check = rule.check || {};
  const violations = [];

  switch (check.kind) {
    case 'core-write':
      violations.push(...checkCoreWrite(rule, result, domainId, check));
      break;
    case 'never-write':
      violations.push(...checkNeverWrite(rule, result, domainId, check));
      break;
    case 'scanner-rule':
      violations.push(...checkScannerRule(rule, result, domainId, check));
      break;
    case 'ui':
      violations.push(...checkUiPolicy(rule, result, domainId, check));
      break;
    case 'event-forbidden':
      violations.push(...checkForbiddenEvent(rule, result, domainId, check));
      break;
    default:
      break;
  }

  return violations;
}

function checkCoreWrite(rule, result, domainId, check) {
  const violations = [];
  const ownedPaths = getOwnedPathsForDomain(domainId);

  for (const call of result.supabaseCalls || []) {
    if (!check.tables.includes(call.table)) continue;
    if (call.operation === 'SELECT') continue;

    const isOwnerPath = ownedPaths.some(p => result.path.includes(p));
    if (!isOwnerPath) {
      violations.push(makeViolation({
        rule, result, domainId,
        type: 'CORE_WRITE',
        severity: 'CRITICAL',
        message: `Core Write: '${call.table}' außerhalb Owner-Pfade in ${domainId}`,
        line: call.line,
        detail: call.raw,
        table: call.table,
      }));
    }
  }
  return violations;
}

function checkNeverWrite(rule, result, domainId, check) {
  const violations = [];
  for (const call of result.supabaseCalls || []) {
    if (call.table !== check.table) continue;
    if (['INSERT', 'UPDATE', 'DELETE', 'UPSERT'].includes(call.operation)) {
      violations.push(makeViolation({
        rule, result, domainId,
        type: 'CROSS_DOMAIN_WRITE',
        severity: 'CRITICAL',
        message: `Cross-Domain Write: ${domainId} schreibt verbotene Tabelle '${check.table}'`,
        line: call.line,
        detail: call.raw,
        table: call.table,
      }));
    }
  }
  return violations;
}

function checkScannerRule(rule, result, domainId, check) {
  const violations = [];
  const prefix = check.prefix;

  if (prefix === 'CORE_BYPASS' || prefix === 'WIRKUNG_BYPASS') {
    return checkCoreWrite(rule, result, domainId, {
      tables: getContract(domainId).data?.owned || [],
    });
  }

  if (prefix === 'DB_DIRECT_WRITE' || prefix === 'DB_WRITE') {
    const contract = getContract(domainId);
    const ownedTables = new Set(contract.data?.owned || []);
    for (const call of result.supabaseCalls || []) {
      if (call.operation === 'SELECT') continue;
      if (ownedTables.has(call.table)) continue;
      const isServiceOwner = isServicePath(result.path, domainId);
      if (!isServiceOwner) {
        violations.push(makeViolation({
          rule, result, domainId,
          type: 'WORLD_DB_WRITE',
          severity: 'HIGH',
          message: `DB Write '${call.table}' ohne Service-Ownership in ${domainId}`,
          line: call.line,
          detail: call.raw,
          table: call.table,
        }));
      }
    }
  }

  if (prefix === 'DB_DIRECT_READ') {
    for (const call of (result.supabaseCalls || []).filter(c => c.operation === 'SELECT')) {
      violations.push(makeViolation({
        rule, result, domainId,
        type: 'DOMAIN_TABLE_OWNER',
        severity: 'MEDIUM',
        message: `Direkter DB-Read auf '${call.table}' — erwäge Service-Layer`,
        line: call.line,
        detail: call.raw,
        table: call.table,
      }));
    }
  }

  if (prefix === 'DIRECT_ROUTING') {
    for (const r of result.directRouting || []) {
      violations.push(makeViolation({
        rule, result, domainId,
        type: 'PAGE_BYPASS',
        severity: 'HIGH',
        message: `Direktes Routing via ${r.type} ohne Action Engine`,
        line: r.line,
        detail: r.raw,
      }));
    }
  }

  if (prefix === 'REGISTRY_BYPASS') {
    if ((result.hardcodedColors?.count || 0) > 10) {
      violations.push(makeViolation({
        rule, result, domainId,
        type: 'COMPONENT_BYPASS',
        severity: 'LOW',
        message: `Registry Bypass: ${result.hardcodedColors.count} hardcodierte Farbwerte`,
        line: null,
        detail: result.hardcodedColors.sample?.join(', '),
      }));
    }
  }

  if (prefix === 'MISSING_HEADER' && result.lines >= 50) {
    if (!result.header?.hasDomainTag || !result.header?.hasOwnerTag) {
      violations.push(makeViolation({
        rule, result, domainId,
        type: 'CONTRACT_VIOLATION',
        severity: 'INFO',
        message: `Fehlende Contract-Header: @domain=${!!result.header?.hasDomainTag} @owner=${!!result.header?.hasOwnerTag}`,
        line: 1,
        detail: 'Füge @domain und @owner JSDoc-Tags hinzu',
      }));
    }
  }

  if (prefix === 'UI_IMPACT_LOGIC') {
    const hasImpactLogic = (result.supabaseCalls || []).some(c =>
      ['resonance_signals', 'orb_states', 'core_metrics'].includes(c.table)
    );
    if (hasImpactLogic && !result.coreEngine?.adopted) {
      violations.push(makeViolation({
        rule, result, domainId,
        type: 'COMPONENT_BYPASS',
        severity: 'HIGH',
        message: 'Wirkungslogik in UI ohne Core Engine',
        line: null,
        detail: 'Nutze useCoreEngine() / coreEngine',
      }));
    }
  }

  if (['GAMIFICATION', 'ORB_REALTIME', 'PRESENCE_GAMIFICATION', 'INFINITE_SCROLL', 'ATTENTION_MAX'].includes(prefix)) {
    const content = result.path;
    if (/streak|xp|level|leaderboard|badge|achievement/i.test(content)) {
      violations.push(makeViolation({
        rule, result, domainId,
        type: 'EVENT_ABUSE',
        severity: 'HIGH',
        message: `Potenzielle Gamification/Attention-Verletzung (${prefix})`,
        line: null,
      }));
    }
  }

  if (prefix === 'AGGREGATOR' && domainId === 'STUDIO') {
    const writeCount = (result.supabaseCalls || []).filter(c => c.operation !== 'SELECT').length;
    if (writeCount > 3) {
      violations.push(makeViolation({
        rule, result, domainId,
        type: 'STUDIO_AGGREGATOR',
        severity: 'MEDIUM',
        message: `STUDIO Aggregator: ${writeCount} DB-Writes in einer Datei`,
        line: null,
      }));
    }
  }

  return violations;
}

function checkUiPolicy(rule, result, domainId, check) {
  if (!check.forbiddenLayers?.includes('Presentation')) return [];
  const hasDbWrite = (result.supabaseCalls || []).some(c => c.operation !== 'SELECT');
  if (hasDbWrite) {
    return [makeViolation({
      rule, result, domainId,
      type: 'COMPONENT_BYPASS',
      severity: 'HIGH',
      message: `Presentation-Layer mit DB-Write in ${domainId}`,
      line: null,
    })];
  }
  return [];
}

function checkForbiddenEvent(rule, result, domainId, check) {
  return [];
}

function evaluateImports(result, domainId, scanResults) {
  const violations = [];
  for (const imp of result.imports || []) {
    if (imp.type !== 'relative') continue;

    const sourceDir = dirname('src/' + result.path);
    let targetPath;
    try {
      targetPath = resolve(sourceDir, imp.source)
        .replace(/\\/g, '/')
        .replace(/^.*?src\//, 'src/');
    } catch { continue; }

    const targetDomain = resolveDomainForFile(targetPath.replace(/^src\//, ''));
    if (targetDomain === 'UNKNOWN' || targetDomain === domainId) continue;

    const { allowed, reason } = isDomainImportAllowed(domainId, targetDomain);
    if (!allowed) {
      violations.push({
        id: `DOMAIN_IMPORT_${result.path}_${imp.source}`,
        type: 'DOMAIN_IMPORT',
        severity: 'HIGH',
        file: result.path,
        line: imp.line,
        domainId,
        contractId: domainId,
        ruleId: `${domainId}-RULE-IMPORT-FORBIDDEN-${targetDomain}`,
        message: `Domain Import Violation: ${domainId} → ${targetDomain} (${reason})`,
        detail: `import from '${imp.source}'`,
        targetDomain,
      });
    }
  }
  return violations;
}

function evaluateTableOwnership(tableWriters, rules) {
  const violations = [];
  const ownerRules = rules.filter(r => r.type === 'DOMAIN_TABLE_OWNER');

  for (const [table, writers] of tableWriters.entries()) {
    const ownerRule = ownerRules.find(r => r.check?.table === table);
    if (!ownerRule) continue;

    const ownerDomain = ownerRule.check.ownerDomain;
    const nonOwnerWriters = [...writers].filter(p => {
      const fileDomain = resolveDomainForFile(p);
      return fileDomain !== ownerDomain && !isServicePath(p, ownerDomain);
    });

    if (nonOwnerWriters.length > 0) {
      violations.push({
        id: `OWNERSHIP_VIOLATION_${table}`,
        type: 'OWNERSHIP_VIOLATION',
        severity: 'HIGH',
        file: [...writers][0],
        line: null,
        domainId: ownerDomain,
        contractId: ownerDomain,
        ruleId: ownerRule.id,
        message: `Ownership Violation: '${table}' hat ${writers.size} Writer, Owner ist ${ownerDomain}`,
        detail: [...writers].join(', '),
        table,
        writers: [...writers],
      });
    }
  }
  return violations;
}

function evaluateCrossDomainWrites(allResults, rules) {
  const violations = [];
  for (const result of allResults) {
    const domainId = resolveDomainForFile(result.path);
    if (domainId === 'UNKNOWN') continue;

    let contract;
    try { contract = getContract(domainId); } catch { continue; }

    const neverWrite = new Set(contract.data?.neverWrite || []);
    for (const call of result.supabaseCalls || []) {
      if (!neverWrite.has(call.table)) continue;
      if (['INSERT', 'UPDATE', 'DELETE', 'UPSERT'].includes(call.operation)) {
        violations.push({
          id: `CROSS_DOMAIN_WRITE_${result.path}_${call.table}_L${call.line}`,
          type: 'CROSS_DOMAIN_WRITE',
          severity: 'CRITICAL',
          file: result.path,
          line: call.line,
          domainId,
          contractId: domainId,
          ruleId: `${domainId}-RULE-NEVER-WRITE-${call.table}`,
          message: `Cross-Domain Write: ${domainId} schreibt '${call.table}' (neverWrite)`,
          detail: call.raw,
          table: call.table,
        });
      }
    }
  }
  return violations;
}

function buildTableWriterMap(allResults) {
  const map = new Map();
  for (const result of allResults) {
    for (const w of (result.supabaseCalls || []).filter(c =>
      ['INSERT', 'UPDATE', 'DELETE', 'UPSERT'].includes(c.operation)
    )) {
      if (!map.has(w.table)) map.set(w.table, new Set());
      map.get(w.table).add(result.path);
    }
  }
  return map;
}

function getOwnedPathsForDomain(domainId) {
  const contract = getContract(domainId);
  const paths = [];
  for (const svc of contract.ownership?.services || []) {
    paths.push(svc.replace(/\*/g, ''));
  }
  if (domainId === 'WIRKUNG') paths.push('core/', 'services/');
  if (domainId === 'KERNEL') paths.push('services/', 'lib/');
  return paths;
}

function isServicePath(filePath, domainId) {
  const contract = getContract(domainId);
  const services = contract.ownership?.services || [];
  return services.some(s => filePath.includes(s.replace(/\*/g, '')));
}

function makeViolation({ rule, result, domainId, type, severity, message, line, detail, table }) {
  return {
    id: `${type}_${result.path}_${line || 'L0'}`,
    type,
    severity: severity ?? rule?.severity ?? 'MEDIUM',
    file: result.path,
    line: line ?? null,
    domainId,
    contractId: domainId,
    ruleId: rule?.id,
    policyId: rule?.policyId,
    message,
    detail,
    table,
  };
}
