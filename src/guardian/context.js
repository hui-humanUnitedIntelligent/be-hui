// src/guardian/context.js
// Sammelt Umgebungskontext für alle Guardian-Checks
import { existsSync } from 'fs';
import { join } from 'path';
import { runQuiet } from './utils/exec.js';

/**
 * @param {string} projectRoot
 * @param {{ baseBranch?: string, skipBuild?: boolean }} [options]
 */
export function gatherContext(projectRoot, options = {}) {
  const baseBranch = options.baseBranch
    || process.env.GUARDIAN_BASE_BRANCH
    || process.env.GITHUB_BASE_REF
    || 'main';

  const branch = process.env.GITHUB_HEAD_REF
    || runQuiet('git rev-parse --abbrev-ref HEAD', { cwd: projectRoot })
    || 'unknown';

  const commit = process.env.GITHUB_SHA
    || runQuiet('git rev-parse HEAD', { cwd: projectRoot })
    || 'unknown';

  const shortCommit = commit.slice(0, 7);

  const eventName = process.env.GITHUB_EVENT_NAME || 'local';
  const isPullRequest = eventName === 'pull_request';
  const isPush = eventName === 'push';

  const prNumber = process.env.GITHUB_EVENT_PULL_REQUEST_NUMBER
    || extractPrNumberFromRef(process.env.GITHUB_REF);

  const prEnv = {
    draft: process.env.GUARDIAN_PR_DRAFT === 'true',
    merged: process.env.GUARDIAN_PR_MERGED === 'true',
    mergeable: process.env.GUARDIAN_PR_MERGEABLE === 'true' ? true
      : process.env.GUARDIAN_PR_MERGEABLE === 'false' ? false : undefined,
    state: process.env.GUARDIAN_PR_STATE || null,
  };

  const github = {
    eventName,
    isPullRequest,
    isPush,
    prNumber: prNumber ? String(prNumber) : null,
    repository: process.env.GITHUB_REPOSITORY || null,
    token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null,
    ref: process.env.GITHUB_REF || null,
    baseRef: process.env.GITHUB_BASE_REF || baseBranch,
    headRef: process.env.GITHUB_HEAD_REF || branch,
    actor: process.env.GITHUB_ACTOR || null,
    runId: process.env.GITHUB_RUN_ID || null,
  };

  const mergeBase = runQuiet(`git merge-base HEAD origin/${baseBranch}`, { cwd: projectRoot })
    || runQuiet(`git merge-base HEAD ${baseBranch}`, { cwd: projectRoot })
    || null;

  const changedFiles = getChangedFiles(projectRoot, baseBranch, mergeBase);
  const newFiles = getNewFiles(projectRoot, baseBranch, mergeBase);

  return {
    projectRoot,
    srcRoot: join(projectRoot, 'src'),
    distDir: join(projectRoot, 'dist'),
    baseBranch,
    branch,
    commit,
    shortCommit,
    mergeBase,
    changedFiles,
    newFiles,
    github,
    skipBuild: options.skipBuild ?? false,
    vercel: {
      url: process.env.VERCEL_URL || null,
      env: process.env.VERCEL_ENV || null,
      gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
      projectId: process.env.VERCEL_PROJECT_ID || null,
    },
    prEnv,
    hasVercelConfig: existsSync(join(projectRoot, 'vercel.json')),
    entryPoints: ['main.jsx', 'App.jsx'],
  };
}

/**
 * @param {string} projectRoot
 * @param {string} baseBranch
 * @param {string | null} mergeBase
 * @returns {string[]}
 */
function getChangedFiles(projectRoot, baseBranch, mergeBase) {
  const range = mergeBase ? `${mergeBase}...HEAD` : `origin/${baseBranch}...HEAD`;
  const diff = runQuiet(`git diff --name-only ${range}`, { cwd: projectRoot });
  if (!diff) {
    const fallback = runQuiet('git diff --name-only HEAD~1..HEAD', { cwd: projectRoot });
    return fallback ? fallback.split('\n').filter(Boolean) : [];
  }
  return diff.split('\n').filter(Boolean);
}

/**
 * @param {string} projectRoot
 * @param {string} baseBranch
 * @param {string | null} mergeBase
 * @returns {string[]}
 */
function getNewFiles(projectRoot, baseBranch, mergeBase) {
  const range = mergeBase ? `${mergeBase}...HEAD` : `origin/${baseBranch}...HEAD`;
  const diff = runQuiet(`git diff --name-only --diff-filter=A ${range}`, { cwd: projectRoot });
  return diff ? diff.split('\n').filter(Boolean) : [];
}

/**
 * @param {string | undefined} ref
 * @returns {string | null}
 */
function extractPrNumberFromRef(ref) {
  if (!ref) return null;
  const m = ref.match(/pull\/(\d+)/);
  return m ? m[1] : null;
}

/**
 * @param {ReturnType<typeof gatherContext>} ctx
 * @param {string} endpoint
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function fetchGitHub(ctx, endpoint) {
  if (!ctx.github.token || !ctx.github.repository) return null;
  const url = `https://api.github.com/repos/${ctx.github.repository}/${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${ctx.github.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
