// src/architecture/scanner/metricsCalculator.js
// ══════════════════════════════════════════════════════════════════════════════
// HUI Metrics Calculator — ARCH-001
//
// Berechnet alle Architektur-Metriken vollständig automatisch.
// Keine manuell gepflegten Werte. Keine statischen Listen.
// ══════════════════════════════════════════════════════════════════════════════

import { getDomainForPath, DOMAINS } from './domains.js';

/**
 * Berechnet alle Metriken aus den Scan-Ergebnissen.
 * @param {FileScanResult[]} results
 * @param {Violation[]} violations
 * @returns {Metrics}
 */
export function calculateMetrics(results, violations) {
  const validResults = results.filter(Boolean);

  const byDomain = groupByDomain(validResults);
  const dbMetrics = calculateDbMetrics(validResults);
  const adoptionMetrics = calculateAdoptionMetrics(validResults);
  const ownershipMetrics = calculateOwnershipMetrics(validResults, violations);
  const violationMetrics = calculateViolationMetrics(violations);

  return {
    // ── Übersicht ──────────────────────────────────────────────────────────
    totalFiles:       validResults.length,
    totalLines:       validResults.reduce((s, r) => s + (r.lines || 0), 0),
    totalComponents:  validResults.reduce((s, r) => s + (r.components?.length || 0), 0),
    totalHooks:       validResults.reduce((s, r) => s + (r.hooks?.length || 0), 0),
    totalDomains:     Object.keys(byDomain).length,

    // ── DB-Metriken ───────────────────────────────────────────────────────
    dbReads:           dbMetrics.reads,
    dbWrites:          dbMetrics.writes,
    dbUpserts:         dbMetrics.upserts,
    dbTables:          dbMetrics.tables,
    dbDirectInUI:      dbMetrics.directInUI,
    crossDomainWrites: dbMetrics.crossDomainWrites,
    duplicateOwners:   dbMetrics.duplicateOwners,

    // ── Adoption ──────────────────────────────────────────────────────────
    actionEngineFiles:   adoptionMetrics.actionEngineFiles,
    actionEngineTotal:   adoptionMetrics.actionEngineTotal,
    actionEnginePct:     adoptionMetrics.actionEnginePct,
    coreEngineFiles:     adoptionMetrics.coreEngineFiles,
    coreEnginePct:       adoptionMetrics.coreEnginePct,
    registryFiles:       adoptionMetrics.registryFiles,
    registryPct:         adoptionMetrics.registryPct,

    // ── Ownership ─────────────────────────────────────────────────────────
    filesWithOwnerHeader:    ownershipMetrics.withHeader,
    ownershipCoveragePct:    ownershipMetrics.coveragePct,
    architectureCoveragePct: ownershipMetrics.archCoveragePct,

    // ── Verstöße ──────────────────────────────────────────────────────────
    totalViolations:    violationMetrics.total,
    criticalViolations: violationMetrics.critical,
    highViolations:     violationMetrics.high,
    mediumViolations:   violationMetrics.medium,
    lowViolations:      violationMetrics.low,
    infoViolations:     violationMetrics.info,

    // ── Per-Domain ────────────────────────────────────────────────────────
    byDomain:           computePerDomainMetrics(byDomain, violations),

    // ── Kontext ───────────────────────────────────────────────────────────
    generatedAt: new Date().toISOString(),
    scanVersion: 'ARCH-001',
  };
}

function groupByDomain(results) {
  const map = {};
  for (const r of results) {
    const domain = getDomainForPath('src/' + r.path);
    if (!map[domain]) map[domain] = [];
    map[domain].push(r);
  }
  return map;
}

function calculateDbMetrics(results) {
  let reads = 0, writes = 0, upserts = 0, directInUI = 0, crossDomainWrites = 0;
  const tables = new Set();
  const tableWriters = new Map();
  const UI_DOMAINS = new Set(['PAGES', 'COMPONENTS', 'FEATURES']);

  for (const r of results) {
    const domain = getDomainForPath('src/' + r.path);
    for (const call of (r.supabaseCalls || [])) {
      tables.add(call.table);
      if (call.operation === 'SELECT') reads++;
      else if (call.operation === 'UPSERT') { writes++; upserts++; }
      else if (['INSERT', 'UPDATE', 'DELETE'].includes(call.operation)) writes++;

      if (['INSERT', 'UPDATE', 'DELETE', 'UPSERT'].includes(call.operation)) {
        if (UI_DOMAINS.has(domain)) directInUI++;
        if (!tableWriters.has(call.table)) tableWriters.set(call.table, new Set());
        tableWriters.get(call.table).add(r.path);
      }
    }
  }

  let duplicateOwners = 0;
  for (const [, writers] of tableWriters) {
    if (writers.size > 1) duplicateOwners++;
  }

  return { reads, writes, upserts, tables: tables.size, directInUI, crossDomainWrites, duplicateOwners };
}

function calculateAdoptionMetrics(results) {
  // Nur Dateien die überhaupt navigate() oder Routing verwenden
  const navigatingFiles = results.filter(r =>
    (r.navigateCalls?.length || 0) > 0 ||
    (r.directRouting?.length || 0) > 0
  );

  const actionEngineFiles = results.filter(r => r.actionEngine?.adopted).length;
  const coreEngineFiles   = results.filter(r => r.coreEngine?.adopted).length;
  const registryFiles     = results.filter(r => r.registryUsage?.adopted).length;

  const totalActionRelevant = navigatingFiles.length || 1;
  const totalCoreRelevant   = results.filter(r =>
    r.components?.length > 0 || r.hooks?.length > 0
  ).length || 1;

  return {
    actionEngineFiles,
    actionEngineTotal: results.reduce((s, r) => s + (r.actionEngine?.uses || 0), 0),
    actionEnginePct:   Math.round((actionEngineFiles / results.length) * 100),
    coreEngineFiles,
    coreEnginePct:     Math.round((coreEngineFiles / totalCoreRelevant) * 100),
    registryFiles,
    registryPct:       Math.round((registryFiles / results.length) * 100),
  };
}

function calculateOwnershipMetrics(results, violations) {
  const minLines = 50;
  const relevantFiles = results.filter(r => r.lines >= minLines && !r.path.startsWith('architecture/'));
  const withHeader = relevantFiles.filter(r =>
    r.header?.hasDomainTag && r.header?.hasOwnerTag
  ).length;

  const missingHeaderViolations = violations.filter(v => v.type === 'MISSING_HEADER').length;

  return {
    withHeader,
    coveragePct: relevantFiles.length
      ? Math.round((withHeader / relevantFiles.length) * 100)
      : 0,
    archCoveragePct: results.length
      ? Math.round(((results.length - missingHeaderViolations) / results.length) * 100)
      : 0,
  };
}

function calculateViolationMetrics(violations) {
  return {
    total:    violations.length,
    critical: violations.filter(v => v.severity === 'CRITICAL').length,
    high:     violations.filter(v => v.severity === 'HIGH').length,
    medium:   violations.filter(v => v.severity === 'MEDIUM').length,
    low:      violations.filter(v => v.severity === 'LOW').length,
    info:     violations.filter(v => v.severity === 'INFO').length,
  };
}

function computePerDomainMetrics(byDomain, violations) {
  const result = {};
  for (const [domain, files] of Object.entries(byDomain)) {
    const domainViolations = violations.filter(v => v.domain === domain);
    result[domain] = {
      files:          files.length,
      lines:          files.reduce((s, r) => s + (r.lines || 0), 0),
      components:     files.reduce((s, r) => s + (r.components?.length || 0), 0),
      hooks:          files.reduce((s, r) => s + (r.hooks?.length || 0), 0),
      dbReads:        files.reduce((s, r) => s + (r.supabaseCalls?.filter(c => c.operation === 'SELECT').length || 0), 0),
      dbWrites:       files.reduce((s, r) => s + (r.supabaseCalls?.filter(c => c.operation !== 'SELECT').length || 0), 0),
      actionEngine:   files.filter(r => r.actionEngine?.adopted).length,
      coreEngine:     files.filter(r => r.coreEngine?.adopted).length,
      violations:     domainViolations.length,
      label:          DOMAINS[domain]?.label ?? domain,
    };
  }
  return result;
}
