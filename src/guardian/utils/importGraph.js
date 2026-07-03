// src/guardian/utils/importGraph.js
// Statische Import-Graph-Analyse für Repository- und Runtime-Checks
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, dirname, relative, extname } from 'path';
import { collectFiles, scanFile } from '../../architecture/scanner/fileScanner.js';

const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

/**
 * @param {string} source
 * @param {string} fromFile — relativer Pfad innerhalb src/
 * @param {string} srcRoot
 * @returns {string | null}
 */
export function resolveImport(source, fromFile, srcRoot) {
  let target = source;
  if (source.startsWith('@/')) {
    target = source.slice(2);
  } else if (source.startsWith('.')) {
    const fromDir = dirname(fromFile);
    target = join(fromDir, source).replace(/\\/g, '/');
  } else {
    return null; // npm package
  }

  // Normalisiere Pfad
  target = target.replace(/\\/g, '/').replace(/^\.\//, '');

  if (extname(target)) {
    const abs = join(srcRoot, target);
    return existsSync(abs) ? target : null;
  }

  for (const ext of EXTENSIONS) {
    const withExt = target + ext;
    if (existsSync(join(srcRoot, withExt))) return withExt;
  }
  for (const ext of EXTENSIONS) {
    const indexPath = join(target, `index${ext}`);
    if (existsSync(join(srcRoot, indexPath))) return indexPath.replace(/\\/g, '/');
  }
  return null;
}

/**
 * @param {string} srcRoot
 * @param {string[]} entryPaths — relativ zu src/
 * @returns {{ reachable: Set<string>, scanResults: Map<string, ReturnType<typeof scanFile>> }}
 */
export function buildReachabilityGraph(srcRoot, entryPaths) {
  const files = collectFiles(srcRoot);
  const scanResults = new Map();

  for (const abs of files) {
    const rel = relative(srcRoot, abs).replace(/\\/g, '/');
    const result = scanFile(abs, srcRoot);
    if (result) scanResults.set(rel, result);
  }

  const reachable = new Set();
  const queue = [...entryPaths];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || reachable.has(current)) continue;
    if (!scanResults.has(current)) continue;

    reachable.add(current);
    const result = scanResults.get(current);
    for (const imp of result.imports || []) {
      const resolved = resolveImport(imp.source, current, srcRoot);
      if (resolved && !reachable.has(resolved)) {
        queue.push(resolved);
      }
    }
  }

  return { reachable, scanResults };
}

/**
 * @param {string} distDir
 * @param {string} srcRelativePath
 * @returns {boolean}
 */
export function isFileReferencedInBundle(distDir, srcRelativePath) {
  if (!existsSync(distDir)) return false;

  const basename = srcRelativePath.split('/').pop()?.replace(/\.(jsx?|tsx?)$/, '') || '';

  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        if (walk(full)) return true;
      } else if (/\.js$/.test(entry)) {
        const content = readFileSync(full, 'utf8');
        if (content.includes(basename) || content.includes(srcRelativePath)) {
          return true;
        }
      }
    }
    return false;
  }

  return walk(distDir);
}
