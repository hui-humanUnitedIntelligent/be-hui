// src/guardian/checks/build.js
import { existsSync } from 'fs';
import { makeCheck } from '../types.js';
import { run } from '../utils/exec.js';

/** @type {{ stdout: string, stderr: string, code: number, ok: boolean } | null} */
let lastBuildResult = null;

/**
 * @param {import('../context.js').gatherContext extends (...args: any) => infer R ? R : never} ctx
 * @returns {Promise<import('../types.js').CheckResult[]>}
 */
export async function runBuildChecks(ctx) {
  const checks = [];

  if (!ctx.skipBuild) {
    lastBuildResult = run('npm run build', { cwd: ctx.projectRoot });
  } else if (existsSync(ctx.distDir)) {
    lastBuildResult = { ok: true, stdout: 'Build übersprungen — dist/ vorhanden', stderr: '', code: 0 };
  } else {
    lastBuildResult = { ok: false, stdout: '', stderr: 'dist/ nicht vorhanden und Build übersprungen', code: 1 };
  }

  const output = (lastBuildResult.stdout + '\n' + lastBuildResult.stderr).trim();
  const errors = extractBuildErrors(output);
  const warnings = extractBuildWarnings(output);

  // Build erfolgreich
  checks.push(makeCheck(
    'build.successful',
    'Build erfolgreich',
    'build',
    lastBuildResult.ok ? 'verified' : 'failed',
    [
      `Exit-Code: ${lastBuildResult.code}`,
      `dist/ existiert: ${existsSync(ctx.distDir)}`,
    ],
    { exitCode: lastBuildResult.code, distExists: existsSync(ctx.distDir) },
  ));

  // Buildfehler
  checks.push(makeCheck(
    'build.errors',
    'Buildfehler',
    'build',
    errors.length === 0 ? 'verified' : 'failed',
    errors.length === 0
      ? ['Keine Buildfehler im Output nachgewiesen']
      : errors.slice(0, 10).map(e => `Fehler: ${e}`),
    { count: errors.length, errors: errors.slice(0, 20) },
  ));

  // Warnungen
  checks.push(makeCheck(
    'build.warnings',
    'Warnungen',
    'build',
    warnings.length === 0 ? 'verified' : 'not_verified',
    warnings.length === 0
      ? ['Keine Warnungen im Build-Output nachgewiesen']
      : [`${warnings.length} Warnung(en) im Build-Output`, ...warnings.slice(0, 5).map(w => `Warnung: ${w}`)],
    { count: warnings.length, warnings: warnings.slice(0, 20) },
  ));

  return checks;
}

/** @returns {{ stdout: string, stderr: string, code: number, ok: boolean } | null} */
export function getLastBuildResult() {
  return lastBuildResult;
}

/**
 * @param {string} output
 * @returns {string[]}
 */
function extractBuildErrors(output) {
  const errors = [];
  const lines = output.split('\n');
  for (const line of lines) {
    if (/\berror\b/i.test(line) && !/0 error/i.test(line)) {
      errors.push(line.trim());
    }
  }
  if (output.includes('Build failed') || output.includes('✗')) {
    const failLine = lines.find(l => /failed|✗/i.test(l));
    if (failLine && !errors.includes(failLine.trim())) errors.push(failLine.trim());
  }
  return [...new Set(errors)];
}

/**
 * @param {string} output
 * @returns {string[]}
 */
function extractBuildWarnings(output) {
  const warnings = [];
  for (const line of output.split('\n')) {
    if (/\bwarning\b/i.test(line) && !/0 warning/i.test(line)) {
      warnings.push(line.trim());
    }
  }
  return [...new Set(warnings)];
}
