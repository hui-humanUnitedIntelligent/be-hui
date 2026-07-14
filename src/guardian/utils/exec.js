// src/guardian/utils/exec.js
import { execSync } from 'child_process';

/**
 * @param {string} cmd
 * @param {{ cwd?: string, env?: Record<string, string> }} [opts]
 * @returns {{ ok: boolean, stdout: string, stderr: string, code: number }}
 */
export function run(cmd, opts = {}) {
  try {
    const stdout = execSync(cmd, {
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { ok: true, stdout: stdout || '', stderr: '', code: 0 };
  } catch (err) {
    const e = /** @type {NodeJS.ErrnoException & { stdout?: string, stderr?: string, status?: number }} */ (err);
    return {
      ok: false,
      stdout: e.stdout || '',
      stderr: e.stderr || String(e.message),
      code: e.status ?? 1,
    };
  }
}

/**
 * @param {string} cmd
 * @param {{ cwd?: string }} [opts]
 * @returns {string | null}
 */
export function runQuiet(cmd, opts = {}) {
  const result = run(cmd, opts);
  return result.ok ? result.stdout.trim() : null;
}
