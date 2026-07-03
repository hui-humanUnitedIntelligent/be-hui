// src/guardian/checks/runtime.js
import { existsSync } from 'fs';
import { makeCheck } from '../types.js';
import { buildReachabilityGraph } from '../utils/importGraph.js';

/**
 * @param {import('../context.js').gatherContext extends (...args: any) => infer R ? R : never} ctx
 * @returns {Promise<import('../types.js').CheckResult[]>}
 */
export async function runRuntimeChecks(ctx) {
  const checks = [];
  const { reachable } = buildReachabilityGraph(ctx.srcRoot, ctx.entryPoints);

  const targetFiles = ctx.newFiles
    .filter(f => f.startsWith('src/') && /\.(jsx?|tsx?)$/.test(f))
    .map(f => f.replace(/^src\//, ''));

  const filesToCheck = targetFiles.length > 0
    ? targetFiles
    : ctx.changedFiles
      .filter(f => f.startsWith('src/') && /\.(jsx?|tsx?)$/.test(f))
      .map(f => f.replace(/^src\//, ''));

  const distExists = existsSync(ctx.distDir);

  // Bestandteil des Bundles
  // Nachweis: Build erfolgreich + Datei im Import-Graph → Rollup hat Modul verarbeitet
  const notInBundle = filesToCheck.filter(f => !reachable.has(f));
  const buildSucceeded = distExists;

  checks.push(makeCheck(
    'runtime.in_bundle',
    'Bestandteil des Bundles',
    'runtime',
    filesToCheck.length === 0 ? 'verified'
      : !buildSucceeded ? 'not_verified'
      : notInBundle.length === 0 ? 'verified'
      : 'failed',
    filesToCheck.length === 0
      ? ['Keine geänderten src/-Dateien — Bundle-Check übersprungen']
      : !buildSucceeded
        ? ['dist/ nicht vorhanden — Bundle-Check nicht durchführbar']
        : notInBundle.length === 0
          ? [
              `Build erfolgreich (dist/ vorhanden)`,
              `Alle ${filesToCheck.length} geänderten Datei(en) im Import-Graph — vom Bundler verarbeitet`,
            ]
          : [
              `${notInBundle.length} Datei(en) nicht im Import-Graph — nicht vom Bundler erreichbar`,
              ...notInBundle.slice(0, 5).map(f => `✗ ${f}`),
            ],
    { distExists, buildSucceeded, checked: filesToCheck.length, notInBundle },
  ));

  // Bestandteil des React Trees (statische Analyse)
  const notInTree = filesToCheck.filter(f => !reachable.has(f));
  checks.push(makeCheck(
    'runtime.in_react_tree',
    'Bestandteil des React Trees',
    'runtime',
    filesToCheck.length === 0 ? 'verified'
      : notInTree.length === 0 ? 'verified'
      : 'failed',
    filesToCheck.length === 0
      ? ['Keine geänderten Dateien — React-Tree-Check übersprungen']
      : notInTree.length === 0
        ? [`Alle ${filesToCheck.length} Datei(en) vom Entry-Point (main.jsx → App.jsx) erreichbar`]
        : [
            `${notInTree.length} Datei(en) nicht im React-Import-Tree`,
            ...notInTree.slice(0, 5).map(f => `✗ ${f}`),
          ],
    { reachable: filesToCheck.length - notInTree.length, unreachable: notInTree },
  ));

  // DOM — erfordert Browser-Runtime, in v1.0 nicht nachweisbar ohne E2E
  checks.push(makeCheck(
    'runtime.in_dom',
    'Bestandteil des DOM',
    'runtime',
    'not_verified',
    [
      'DOM-Präsenz erfordert Browser-Runtime oder E2E-Test',
      'In v1.0 ohne Headless-Browser nicht nachweisbar',
      'Status: NICHT VERIFIZIERT',
    ],
    { requiresE2E: true },
  ));

  // Sichtbar
  checks.push(makeCheck(
    'runtime.visible',
    'Sichtbar',
    'runtime',
    'not_verified',
    [
      'Sichtbarkeit erfordert visuelle Runtime-Verifikation',
      'In v1.0 ohne Browser-Rendering nicht nachweisbar',
      'Status: NICHT VERIFIZIERT',
    ],
    { requiresVisualTest: true },
  ));

  // Tatsächlich gerendert (aggregiert für Summary)
  checks.push(makeCheck(
    'runtime.rendered',
    'Tatsächlich gerendert',
    'runtime',
    'not_verified',
    [
      'Rendering erfordert Runtime-Instrumentierung oder E2E-Test',
      'In v1.0 ohne Headless-Browser nicht nachweisbar',
      'Status: NICHT VERIFIZIERT',
    ],
    { requiresE2E: true },
  ));

  return checks;
}
