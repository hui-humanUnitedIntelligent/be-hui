// src/architecture/intelligence/runScan.js
// ══════════════════════════════════════════════════════════════════════════════
// Scan Orchestrator — ARCH-006
// Vereinigt ARCH-001 Scanner, Knowledge Graph und Semantic Layer.
// ══════════════════════════════════════════════════════════════════════════════

import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { collectFiles, scanFile } from '../scanner/fileScanner.js';
import { detectViolations } from '../scanner/violationDetector.js';
import { calculateMetrics } from '../scanner/metricsCalculator.js';
import { buildKnowledgeGraph } from '../graph/knowledgeGraph.js';
import { buildSemanticLayer } from '../semantic/semanticLayer.js';
import { parseConstitution } from '../governance/constitution.js';
import { loadAdrs } from '../governance/adrRegistry.js';
import { loadRfcs } from '../governance/rfcRegistry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SRC_ROOT = resolve(__dirname, '../../..', 'src');

/**
 * Führt einen vollständigen Architecture Scan durch.
 * @param {string} [srcRoot]
 * @param {object} [options]
 * @returns {Promise<ScanReport>}
 */
export async function runScan(srcRoot = DEFAULT_SRC_ROOT, options = {}) {
  const startTime = Date.now();

  const files = collectFiles(srcRoot);
  const scanResults = new Map();
  for (const file of files) {
    const result = scanFile(file, srcRoot);
    if (result) scanResults.set(result.path, result);
  }

  const allResults = [...scanResults.values()];
  const violations = detectViolations(scanResults);
  const metrics = calculateMetrics(allResults, violations);
  metrics.scanVersion = 'ARCH-006';
  metrics.scanDurationMs = Date.now() - startTime;

  const adrs = loadAdrs();
  const rfcs = loadRfcs();
  const constitution = parseConstitution();
  const graph = buildKnowledgeGraph(scanResults, violations, { adrs, rfcs });
  const semantics = buildSemanticLayer(scanResults, graph, violations);

  return {
    scanVersion: 'ARCH-006',
    generatedAt: new Date().toISOString(),
    scanDurationMs: Date.now() - startTime,
    srcRoot,
    metrics,
    violations,
    files: allResults,
    scanResults,
    graph,
    semantics,
    governance: { constitution, adrs, rfcs },
  };
}

/**
 * Cached Scan — lädt aus docs/generated wenn verfügbar und nicht stale.
 * @param {string} [srcRoot]
 * @param {{ force?: boolean }} [options]
 */
export async function getOrRunScan(srcRoot = DEFAULT_SRC_ROOT, options = {}) {
  if (!options.force) {
    try {
      const { readFileSync, existsSync } = await import('fs');
      const metricsPath = join(resolve(__dirname, '../../..'), 'docs', 'generated', 'metrics.json');
      if (existsSync(metricsPath)) {
        const cached = JSON.parse(readFileSync(metricsPath, 'utf8'));
        if (cached.scanVersion === 'ARCH-006') {
          return runScan(srcRoot, options);
        }
      }
    } catch { /* fall through to full scan */ }
  }
  return runScan(srcRoot, options);
}
