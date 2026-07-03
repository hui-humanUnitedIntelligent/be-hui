// src/guardian/checks/repository.js
import { makeCheck } from '../types.js';
import { buildReachabilityGraph } from '../utils/importGraph.js';

/**
 * @param {import('../context.js').gatherContext extends (...args: any) => infer R ? R : never} ctx
 * @returns {Promise<import('../types.js').CheckResult[]>}
 */
export async function runRepositoryChecks(ctx) {
  const checks = [];
  const { reachable, scanResults } = buildReachabilityGraph(ctx.srcRoot, ctx.entryPoints);

  const srcFiles = [...scanResults.keys()];
  const deadFiles = srcFiles.filter(f => !reachable.has(f) && !isExemptFromReachability(f));

  const newSrcFiles = ctx.newFiles
    .filter(f => f.startsWith('src/') && /\.(jsx?|tsx?)$/.test(f))
    .map(f => f.replace(/^src\//, ''));

  const changedSrcFiles = ctx.changedFiles
    .filter(f => f.startsWith('src/') && /\.(jsx?|tsx?)$/.test(f))
    .map(f => f.replace(/^src\//, ''));

  // Neue Dateien vorhanden
  const hasNewFiles = newSrcFiles.length > 0;
  checks.push(makeCheck(
    'repository.new_files',
    'Neue Dateien vorhanden',
    'repository',
    'verified',
    hasNewFiles
      ? [`${newSrcFiles.length} neue Datei(en) in src/`, ...newSrcFiles.slice(0, 10).map(f => `+ ${f}`)]
      : [`Keine neuen src/-Dateien im Diff`],
    { count: newSrcFiles.length, files: newSrcFiles },
  ));

  // Dateien tatsächlich importiert
  const unimportedNew = newSrcFiles.filter(f => !reachable.has(f));
  const targetFiles = newSrcFiles.length > 0 ? newSrcFiles : changedSrcFiles;
  const unimportedTarget = targetFiles.filter(f => !reachable.has(f) && !isExemptFromReachability(f));

  checks.push(makeCheck(
    'repository.files_imported',
    'Dateien tatsächlich importiert',
    'repository',
    unimportedTarget.length === 0 ? 'verified' : 'failed',
    targetFiles.length === 0
      ? ['Keine geänderten/neuen src/-Dateien zu prüfen']
      : unimportedTarget.length === 0
        ? [`Alle ${targetFiles.length} geänderten/neuen Dateien im Import-Graph erreichbar`]
        : [
            `${unimportedTarget.length} Datei(en) nicht vom Entry-Point erreichbar`,
            ...unimportedTarget.slice(0, 10).map(f => `✗ ${f}`),
          ],
    { reachable: targetFiles.length - unimportedTarget.length, unreachable: unimportedTarget },
  ));

  // Tote Dateien
  checks.push(makeCheck(
    'repository.dead_files',
    'Tote Dateien',
    'repository',
    deadFiles.length === 0 ? 'verified' : 'not_verified',
    deadFiles.length === 0
      ? ['Keine toten Dateien im src/-Verzeichnis nachgewiesen']
      : [
          `${deadFiles.length} Datei(en) nicht vom Entry-Point erreichbar`,
          ...deadFiles.slice(0, 10).map(f => `tot: ${f}`),
        ],
    { count: deadFiles.length, files: deadFiles.slice(0, 50) },
  ));

  // Nicht verwendete Komponenten
  const unusedComponents = findUnusedComponents(scanResults, reachable);
  checks.push(makeCheck(
    'repository.unused_components',
    'Nicht verwendete Komponenten',
    'repository',
    unusedComponents.length === 0 ? 'verified' : 'not_verified',
    unusedComponents.length === 0
      ? ['Keine unbenutzten exportierten Komponenten nachgewiesen']
      : [
          `${unusedComponents.length} exportierte Komponente(n) nicht importiert`,
          ...unusedComponents.slice(0, 10).map(c => `${c.file}: ${c.name}`),
        ],
    { count: unusedComponents.length, components: unusedComponents.slice(0, 30) },
  ));

  return checks;
}

/**
 * @param {string} path
 * @returns {boolean}
 */
function isExemptFromReachability(path) {
  const exempt = [
    'routes/registry.js',
    'architecture/',
    'guardian/',
    '.test.',
    '.spec.',
  ];
  return exempt.some(e => path.includes(e));
}

/**
 * @param {Map<string, ReturnType<import('../../architecture/scanner/fileScanner.js').scanFile>>} scanResults
 * @param {Set<string>} reachable
 * @returns {{ file: string, name: string }[]}
 */
function findUnusedComponents(scanResults, reachable) {
  const exportedComponents = new Map();

  for (const [file, result] of scanResults) {
    for (const comp of result.components || []) {
      exportedComponents.set(`${file}:${comp}`, { file, name: comp });
    }
  }

  const importedNames = new Set();
  for (const file of reachable) {
    const result = scanResults.get(file);
    if (!result) continue;
    const content = result.components || [];
    for (const imp of result.imports || []) {
      importedNames.add(imp.source);
    }
    for (const comp of content) {
      importedNames.add(comp);
    }
  }

  const unused = [];
  for (const [key, { file, name }] of exportedComponents) {
    if (!reachable.has(file)) continue;
    const isEntryPoint = file === 'main.jsx' || file === 'App.jsx';
    if (isEntryPoint) continue;

    let used = false;
    for (const [otherFile, result] of scanResults) {
      if (otherFile === file) continue;
      if (!reachable.has(otherFile)) continue;
      const importSources = (result.imports || []).map(i => i.source);
      if (importSources.some(s => s.includes(name) || s.includes(file.replace(/\.(jsx?)$/, '')))) {
        used = true;
        break;
      }
    }
    if (!used) unused.push({ file, name });
  }

  return unused;
}
